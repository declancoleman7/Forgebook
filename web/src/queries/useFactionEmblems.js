import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function factionEmblemUrl(path) {
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/faction-emblems/${path}`;
}

// Global, admin-uploaded emblem overrides -- visible to every signed-in
// user, unlike the personal "Change emblem" override (useFactionArt.js),
// which stays on one device by design. Read-only for everyone but the
// admin; enforced server-side (see schema.sql's "admin manage faction
// emblems" policy) -- the isAdmin gating in the UI is just so it doesn't
// offer an action that would fail.
export function useGlobalFactionArt() {
  return useQuery({
    queryKey: ['globalFactionArt'],
    queryFn: async () => {
      const { data, error } = await supabase.from('faction_emblems').select('*');
      if (error) throw error;
      const map = {};
      (data || []).forEach((row) => { map[row.faction_id] = factionEmblemUrl(row.image_path); });
      return map;
    },
  });
}

export function useUploadGlobalFactionEmblem() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ factionId, dataUrl }) => {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${factionId}-${Date.now().toString(36)}.jpg`;
      const { error: upErr } = await supabase.storage.from('faction-emblems').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw new Error("Couldn't upload that — try again.");
      const { error: dbErr } = await supabase.from('faction_emblems').upsert({ faction_id: factionId, image_path: path, updated_at: new Date().toISOString(), updated_by: userId });
      if (dbErr) throw new Error("Couldn't upload that — try again.");
      return { factionId, url: factionEmblemUrl(path) };
    },
    onSuccess: ({ factionId, url }) => {
      qc.setQueryData(['globalFactionArt'], (prev = {}) => ({ ...prev, [factionId]: url }));
    },
  });
}

export function useRemoveGlobalFactionEmblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (factionId) => {
      const { error } = await supabase.from('faction_emblems').delete().eq('faction_id', factionId);
      if (error) throw new Error("Couldn't remove that — try again.");
      return factionId;
    },
    onSuccess: (factionId) => {
      qc.setQueryData(['globalFactionArt'], (prev = {}) => {
        const next = { ...prev };
        delete next[factionId];
        return next;
      });
    },
  });
}
