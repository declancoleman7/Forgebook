import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function fromRemote(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || '',
    hobbyId: row.hobby_id || '',
    isPublic: !!row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entryIds: (row.hobby_log_project_entries || []).map((l) => l.entry_id),
  };
}

const SELECT_WITH_ENTRIES = '*, hobby_log_project_entries(entry_id)';

// Every one of the signed-in user's own projects -- same "own eyes only"
// management view as useMyHobbyLog().
export function useMyHobbyProjects() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['hobbyProjects', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hobby_log_projects').select(SELECT_WITH_ENTRIES).eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(fromRemote);
    },
    enabled: !!userId,
  });
}

export function useFindHobbyProject(id) {
  const list = useMyHobbyProjects();
  return list.data?.find((p) => p.id === id);
}

// Replaces a project's linked-unit join rows wholesale rather than diffing
// -- same approach useHobbyLog.js's own replaceRecipeLinks() takes for a
// unit's recipe links.
async function replaceProjectEntries(projectId, entryIds) {
  const { error: delErr } = await supabase.from('hobby_log_project_entries').delete().eq('project_id', projectId);
  if (delErr) throw delErr;
  if (entryIds?.length) {
    const rows = entryIds.map((entryId) => ({ project_id: projectId, entry_id: entryId }));
    const { error: insErr } = await supabase.from('hobby_log_project_entries').insert(rows);
    if (insErr) throw insErr;
  }
}

export function useCreateHobbyProject() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, notes, hobbyId, isPublic, entryIds }) => {
      const { data, error } = await supabase.from('hobby_log_projects').insert({
        user_id: userId, title, notes: notes || '', hobby_id: hobbyId || null, is_public: !!isPublic,
      }).select().single();
      if (error) throw new Error("Couldn't save that project — try again.");
      await replaceProjectEntries(data.id, entryIds);
      return { ...data, hobby_log_project_entries: (entryIds || []).map((entryId) => ({ entry_id: entryId })) };
    },
    onSuccess: (row) => {
      qc.setQueryData(['hobbyProjects', userId], (prev = []) => [fromRemote(row), ...prev]);
    },
  });
}

export function useUpdateHobbyProject() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, notes, hobbyId, isPublic, entryIds }) => {
      const { error } = await supabase.from('hobby_log_projects').update({
        title, notes: notes || '', hobby_id: hobbyId || null, is_public: !!isPublic,
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't save that project — try again.");
      await replaceProjectEntries(id, entryIds);
      return { id, title, notes: notes || '', hobbyId, isPublic, entryIds: entryIds || [] };
    },
    onSuccess: (updated) => {
      qc.setQueryData(['hobbyProjects', userId], (prev = []) => {
        const idx = prev?.findIndex((p) => p.id === updated.id) ?? -1;
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      });
    },
  });
}

export function useDeleteHobbyProject() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('hobby_log_projects').delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't delete that — try again.");
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['hobbyProjects', userId], (prev) => prev?.filter((p) => p.id !== id));
    },
  });
}
