import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { fromRemoteRecipe } from './useRecipes.js';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}
function fromRemoteNote(row) {
  return { id: row.id, paintKey: row.paint_key, userId: row.user_id, body: row.body, flagged: !!row.flagged, status: row.status, createdAt: row.created_at };
}
function fromRemoteRating(row) {
  return { paintKey: row.paint_key, stars: row.stars, updatedAt: row.updated_at, userId: row.user_id };
}

// Followers/following ids aren't denormalized with names -- batch-resolve
// them into the {userId, displayName, avatarUrl, isAdmin} shape every
// profile-row renderer already expects, same one query per profile view
// (not per row) that the old app's local profiles cache amortized instead.
async function resolvePeople(ids) {
  if (!ids.length) return [];
  const { data } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').in('user_id', ids);
  const byId = Object.fromEntries((data || []).map((row) => [row.user_id, row]));
  return ids.map((id) => {
    const row = byId[id];
    return { userId: id, displayName: row?.display_name || 'Someone', avatarUrl: row ? avatarUrl(row.avatar_path) : null, isAdmin: !!row?.is_admin };
  });
}

export function useMyFollowingIds() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('follows').select('followed_id').eq('follower_id', userId);
      if (error) throw error;
      return (data || []).map((row) => row.followed_id);
    },
    enabled: !!userId,
  });
}

// Optimistic on both your own following list AND (if it happens to be
// cached) that profile's own follower list/count, same double-write shape
// as the old app's toggleFollow().
export function useToggleFollow() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, following }) => {
      if (following) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', userId).eq('followed_id', profileId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('follows').upsert({ follower_id: userId, followed_id: profileId });
        if (error) throw error;
      }
    },
    onMutate: async ({ profileId, following }) => {
      await qc.cancelQueries({ queryKey: ['following', userId] });
      await qc.cancelQueries({ queryKey: ['viewedProfile', profileId] });
      const prevMine = qc.getQueryData(['following', userId]);
      const prevProfile = qc.getQueryData(['viewedProfile', profileId]);
      qc.setQueryData(['following', userId], (prev = []) => (following ? prev.filter((id) => id !== profileId) : [...prev, profileId]));
      qc.setQueryData(['viewedProfile', profileId], (prev) => {
        if (!prev) return prev;
        const followerIds = following ? prev.followerIds.filter((id) => id !== userId) : [...prev.followerIds, userId];
        const followerObjs = following ? prev.followerObjs.filter((f) => f.userId !== userId) : prev.followerObjs;
        return { ...prev, followerIds, followerObjs };
      });
      return { prevMine, prevProfile };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prevMine) qc.setQueryData(['following', userId], ctx.prevMine);
      if (ctx?.prevProfile) qc.setQueryData(['viewedProfile', vars.profileId], ctx.prevProfile);
    },
  });
}

// One profile's whole page: published recipes, notes, ratings, follower/
// following ids+names -- batched the same way fetchProfile() does, since
// viewProfile()/viewProfileSection() must never compute a different set of
// items for the same profile (see computeProfileLists() in the old app).
export function useViewedProfile(id) {
  return useQuery({
    queryKey: ['viewedProfile', id],
    queryFn: async () => {
      const [profRes, recipesRes, notesRes, ratingsRes, followerRes, followingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', id).maybeSingle(),
        supabase.from('recipes').select('*').eq('user_id', id).eq('published', true).eq('deleted', false),
        supabase.from('paint_notes').select('*').eq('user_id', id).eq('deleted', false),
        supabase.from('paint_ratings').select('*').eq('user_id', id).eq('deleted', false),
        supabase.from('follows').select('follower_id').eq('followed_id', id),
        supabase.from('follows').select('followed_id').eq('follower_id', id),
      ]);
      if (!profRes.data) return null;
      const followerIds = (followerRes.data || []).map((row) => row.follower_id);
      const followingIds = (followingRes.data || []).map((row) => row.followed_id);
      const [followerObjs, followingObjs] = await Promise.all([resolvePeople(followerIds), resolvePeople(followingIds)]);
      return {
        userId: id,
        displayName: profRes.data.display_name,
        avatarUrl: avatarUrl(profRes.data.avatar_path),
        isAdmin: !!profRes.data.is_admin,
        recipes: (recipesRes.data || []).map((row) => ({ ...fromRemoteRecipe(row), authorId: id })),
        notes: (notesRes.data || []).map(fromRemoteNote),
        ratings: (ratingsRes.data || []).map(fromRemoteRating),
        followerIds, followingIds, followerObjs, followingObjs,
      };
    },
    enabled: !!id,
  });
}

// Home's "Suggested Painters" rail (desktop only) -- a batch with no query
// to filter by, unlike useSearchProfiles; the caller excludes self/already-
// followed and slices it down.
export function useSuggestedProfiles() {
  return useQuery({
    queryKey: ['suggestedProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').limit(30);
      if (error) return [];
      return (data || []).map((row) => ({ userId: row.user_id, displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin }));
    },
  });
}

export function useSearchProfiles(query) {
  const q = query.trim();
  return useQuery({
    queryKey: ['profileSearch', q],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').ilike('display_name', `%${q}%`).limit(20);
      if (error) return [];
      return (data || []).map((row) => ({ userId: row.user_id, displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin }));
    },
    enabled: q.length > 0,
  });
}
