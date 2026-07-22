import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { stageCountsFromLegacyStatus, stageTotal } from '../data/hobbyStages.js';

function photoUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.photoBucket}/${path}` : null;
}

function fromRemote(row) {
  // schema.sql's own migration backfills stage_counts for every existing
  // row -- this fallback only matters for the mock (which never runs SQL)
  // or a moment before that migration's been re-pasted.
  const stageCounts = (row.stage_counts && stageTotal(row.stage_counts) > 0) ? row.stage_counts : stageCountsFromLegacyStatus(row.status);
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || '',
    quantity: row.quantity || 1,
    stageCounts,
    hobbyId: row.hobby_id || '',
    factionId: row.faction_id || '',
    photoPath: row.photo_path,
    photo: photoUrl(row.photo_path),
    isPublic: !!row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipeLinks: (row.hobby_log_recipes || []).map((l) => ({ recipeOwnerId: l.recipe_owner_id, recipeId: l.recipe_id })),
  };
}

const SELECT_WITH_RECIPES = '*, hobby_log_recipes(recipe_owner_id, recipe_id)';

// Every one of the signed-in user's own entries, any status, public or
// private -- the management view (own eyes only).
export function useMyHobbyLog() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['hobbyLog', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hobby_log_entries').select(SELECT_WITH_RECIPES).eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(fromRemote);
    },
    enabled: !!userId,
  });
}

export function useFindHobbyLogEntry(id) {
  const list = useMyHobbyLog();
  return list.data?.find((e) => e.id === id);
}

// Replaces an entry's linked-recipes join rows wholesale rather than
// diffing -- the same "overwrite the whole small collection" approach the
// old app used for a recipe's steps array.
async function replaceRecipeLinks(logId, recipeLinks) {
  const { error: delErr } = await supabase.from('hobby_log_recipes').delete().eq('log_id', logId);
  if (delErr) throw delErr;
  if (recipeLinks?.length) {
    const rows = recipeLinks.map((l) => ({ log_id: logId, recipe_owner_id: l.recipeOwnerId, recipe_id: l.recipeId }));
    const { error: insErr } = await supabase.from('hobby_log_recipes').insert(rows);
    if (insErr) throw insErr;
  }
}

export function useCreateHobbyLogEntry() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, notes, quantity, stageCounts, hobbyId, factionId, photoPath, isPublic, recipeLinks }) => {
      const { data, error } = await supabase.from('hobby_log_entries').insert({
        user_id: userId, title, notes: notes || '', quantity, stage_counts: stageCounts,
        hobby_id: hobbyId || null, faction_id: factionId || null,
        photo_path: photoPath || null, is_public: !!isPublic,
      }).select().single();
      if (error) throw new Error("Couldn't save that entry — try again.");
      await replaceRecipeLinks(data.id, recipeLinks);
      return { ...data, hobby_log_recipes: (recipeLinks || []).map((l) => ({ recipe_owner_id: l.recipeOwnerId, recipe_id: l.recipeId })) };
    },
    onSuccess: (row) => {
      qc.setQueryData(['hobbyLog', userId], (prev = []) => [fromRemote(row), ...prev]);
    },
  });
}

export function useUpdateHobbyLogEntry() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    // Doesn't rely on .update()'s own return value -- same convention as
    // the rest of the app's edit mutations (e.g. useEditComment): the
    // caller already knows exactly what it just wrote, so the cache patch
    // is built from the mutation's own input rather than a round trip.
    mutationFn: async ({ id, title, notes, quantity, stageCounts, hobbyId, factionId, photoPath, isPublic, recipeLinks }) => {
      const { error } = await supabase.from('hobby_log_entries').update({
        title, notes: notes || '', quantity, stage_counts: stageCounts,
        hobby_id: hobbyId || null, faction_id: factionId || null,
        photo_path: photoPath || null, is_public: !!isPublic,
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't save that entry — try again.");
      await replaceRecipeLinks(id, recipeLinks);
      return { id, title, notes: notes || '', quantity, stageCounts, hobbyId, factionId, photoPath, isPublic, recipeLinks: recipeLinks || [] };
    },
    onSuccess: (updated) => {
      qc.setQueryData(['hobbyLog', userId], (prev = []) => {
        const idx = prev?.findIndex((e) => e.id === updated.id) ?? -1;
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated, photo: photoUrl(updated.photoPath) };
        return next;
      });
    },
  });
}

export function useDeleteHobbyLogEntry() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('hobby_log_entries').delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't delete that — try again.");
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['hobbyLog', userId], (prev) => prev?.filter((e) => e.id !== id));
    },
  });
}

// Storage-only, same recipe-photos bucket as recipe photos -- the per-user
// folder RLS already covers any path under the owner's own folder.
export function useUploadHobbyLogPhoto() {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async ({ dataUrl }) => {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${userId}/hobbylog-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const { error } = await supabase.storage.from(CONFIG.photoBucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      return path;
    },
  });
}

export { fromRemote as fromRemoteHobbyLogEntry, SELECT_WITH_RECIPES as HOBBY_LOG_SELECT_WITH_RECIPES };
