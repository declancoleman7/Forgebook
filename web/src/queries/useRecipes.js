import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useActiveHobbyId } from '../hooks/useActiveHobby.js';

function photoUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.photoBucket}/${path}` : null;
}
function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

function toRemoteRecipe(r, userId) {
  return {
    id: r.id, user_id: userId, name: r.name, faction: r.faction, unit: r.unit,
    hobby_id: r.hobbyId || 'warhammer', difficulty: r.difficulty, photo_path: r.photoPath || null,
    steps: r.steps || [], notes: r.notes || '', published: !!r.published,
    updated_at: new Date().toISOString(), deleted: false,
  };
}
function fromRemoteRecipe(row) {
  return {
    id: row.id, name: row.name, faction: row.faction, unit: row.unit,
    hobbyId: row.hobby_id || 'warhammer', difficulty: row.difficulty, photoPath: row.photo_path,
    photo: photoUrl(row.photo_path), steps: row.steps || [], notes: row.notes || '',
    published: !!row.published, updatedAt: row.updated_at,
  };
}

export function useMyRecipes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['recipes', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipes').select('*').eq('user_id', userId).eq('deleted', false);
      if (error) throw error;
      return (data || []).map(fromRemoteRecipe);
    },
    enabled: !!userId,
  });
}

// Other users' published recipes -- read-only, never merged with your own.
// Author names/avatars are denormalized directly onto each recipe (same
// simpler-than-a-shared-cache approach already used for notifications)
// rather than a separate profiles store.
export function useSharedRecipes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['sharedRecipes', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipes').select('*').eq('published', true).eq('deleted', false).neq('user_id', userId);
      if (error) throw error;
      const recipes = (data || []).map((row) => ({ ...fromRemoteRecipe(row), authorId: row.user_id }));
      const authorIds = [...new Set(recipes.map((r) => r.authorId))];
      let authors = {};
      if (authorIds.length) {
        const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').in('user_id', authorIds);
        authors = Object.fromEntries((profRows || []).map((row) => [row.user_id, { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin }]));
      }
      return recipes.map((r) => ({ ...r, author: authors[r.authorId] || { displayName: 'Someone', avatarUrl: null, isAdmin: false } }));
    },
    enabled: !!userId,
  });
}

// Own + shared, scoped to whichever hobby is active -- same as the old
// app's getVisibleRecipes().
export function useVisibleRecipes() {
  const mine = useMyRecipes();
  const shared = useSharedRecipes();
  const activeHobbyId = useActiveHobbyId();
  const recipes = [...(mine.data || []), ...(shared.data || [])].filter((r) => (r.hobbyId || 'warhammer') === activeHobbyId);
  return { data: recipes, isLoading: mine.isLoading || shared.isLoading };
}

export function useFindRecipe(id, authorId) {
  const mine = useMyRecipes();
  const shared = useSharedRecipes();
  if (authorId) return shared.data?.find((r) => r.id === id && r.authorId === authorId);
  return mine.data?.find((r) => r.id === id);
}

export function usePushRecipe() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipe) => {
      const { error } = await supabase.from('recipes').upsert(toRemoteRecipe(recipe, userId));
      if (error) throw new Error("Couldn't save that — try again.");
      return recipe;
    },
    onSuccess: (recipe) => {
      qc.setQueryData(['recipes', userId], (prev) => {
        if (!prev) return prev;
        const idx = prev.findIndex((r) => r.id === recipe.id);
        const withHobby = { ...recipe, hobbyId: recipe.hobbyId || 'warhammer', photo: photoUrl(recipe.photoPath) };
        if (idx === -1) return [...prev, withHobby];
        const next = [...prev]; next[idx] = withHobby; return next;
      });
    },
  });
}

// Storage-only -- the caller folds the returned path into the recipe
// payload it's about to upsert via usePushRecipe, same order of operations
// as the old app's recipe-save handler (upload first, then push the row
// pointing at it).
export function useUploadRecipePhoto() {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async ({ dataUrl, recipeId }) => {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${userId}/${recipeId}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const { error } = await supabase.storage.from(CONFIG.photoBucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      return path;
    },
  });
}

export function useDeleteRecipe() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't delete that — try again.");
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['recipes', userId], (prev) => prev?.filter((r) => r.id !== id));
    },
  });
}

// --- Votes ---------------------------------------------------------------

export function useRecipeVoteSummary() {
  return useQuery({
    queryKey: ['recipeVoteSummary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipe_vote_summary').select('*');
      if (error) throw error;
      return (data || []).map((row) => ({ recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id, likeCount: row.like_count, dislikeCount: row.dislike_count }));
    },
  });
}

export function useMyRecipeVotes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['myRecipeVotes', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipe_votes').select('*').eq('user_id', userId).eq('deleted', false);
      if (error) throw error;
      return (data || []).map((row) => ({ recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id, value: row.value }));
    },
    enabled: !!userId,
  });
}

// Tapping the same value you already voted retracts it (a toggle, not a
// one-way action). Optimistic via onMutate/onError -- TanStack Query's
// built-in version of the same "update instantly, roll back on failure"
// pattern the old app hand-rolled per-feature (voteOnRecipe/
// adjustRecipeVoteSummary in js/app.js).
export function useVoteRecipe() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ownerId, recipeId, value, retract }) => {
      if (retract) {
        const { error } = await supabase.from('recipe_votes').delete().eq('user_id', userId).eq('recipe_owner_id', ownerId).eq('recipe_id', recipeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipe_votes').upsert({ recipe_owner_id: ownerId, recipe_id: recipeId, user_id: userId, value, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onMutate: async ({ ownerId, recipeId, value, retract }) => {
      await qc.cancelQueries({ queryKey: ['myRecipeVotes', userId] });
      await qc.cancelQueries({ queryKey: ['recipeVoteSummary'] });
      const prevMine = qc.getQueryData(['myRecipeVotes', userId]);
      const prevSummary = qc.getQueryData(['recipeVoteSummary']);
      const oldValue = prevMine?.find((v) => v.recipeOwnerId === ownerId && v.recipeId === recipeId)?.value ?? null;
      const newValue = retract ? null : value;

      qc.setQueryData(['myRecipeVotes', userId], (prev = []) => {
        const rest = prev.filter((v) => !(v.recipeOwnerId === ownerId && v.recipeId === recipeId));
        return newValue == null ? rest : [...rest, { recipeOwnerId: ownerId, recipeId, value: newValue }];
      });
      qc.setQueryData(['recipeVoteSummary'], (prev = []) => {
        const idx = prev.findIndex((x) => x.recipeOwnerId === ownerId && x.recipeId === recipeId);
        const row = idx > -1 ? { ...prev[idx] } : { recipeOwnerId: ownerId, recipeId, likeCount: 0, dislikeCount: 0 };
        if (oldValue === 1) row.likeCount--; else if (oldValue === -1) row.dislikeCount--;
        if (newValue === 1) row.likeCount++; else if (newValue === -1) row.dislikeCount++;
        row.likeCount = Math.max(0, row.likeCount); row.dislikeCount = Math.max(0, row.dislikeCount);
        const next = [...prev];
        if (idx > -1) next[idx] = row; else next.push(row);
        return next;
      });
      return { prevMine, prevSummary };
    },
    onError: (err, vars, context) => {
      if (context?.prevMine) qc.setQueryData(['myRecipeVotes', userId], context.prevMine);
      if (context?.prevSummary) qc.setQueryData(['recipeVoteSummary'], context.prevSummary);
    },
  });
}

// --- Saved recipes ---------------------------------------------------------

export function useSavedRecipes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['savedRecipes', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('saved_recipes').select('recipe_owner_id, recipe_id').eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((row) => ({ recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id }));
    },
    enabled: !!userId,
  });
}

export function useToggleSaveRecipe() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ownerId, recipeId, saved }) => {
      if (saved) {
        const { error } = await supabase.from('saved_recipes').delete().eq('user_id', userId).eq('recipe_owner_id', ownerId).eq('recipe_id', recipeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_recipes').upsert({ recipe_owner_id: ownerId, recipe_id: recipeId, user_id: userId });
        if (error) throw error;
      }
      return { ownerId, recipeId, saved: !saved };
    },
    onMutate: async ({ ownerId, recipeId, saved }) => {
      await qc.cancelQueries({ queryKey: ['savedRecipes', userId] });
      const prev = qc.getQueryData(['savedRecipes', userId]);
      qc.setQueryData(['savedRecipes', userId], (list = []) =>
        saved ? list.filter((s) => !(s.recipeOwnerId === ownerId && s.recipeId === recipeId)) : [...list, { recipeOwnerId: ownerId, recipeId }]
      );
      return { prev };
    },
    onError: (err, vars, context) => {
      if (context?.prev) qc.setQueryData(['savedRecipes', userId], context.prev);
    },
  });
}
