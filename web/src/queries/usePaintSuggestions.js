import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

// A user-submitted "please add this paint/range" request -- reviewed by an
// admin (see Admin.jsx's Suggestions tab), never auto-applied: PAINT_LIBRARY
// is a static bundled file, not a live table, so "approved" just marks it as
// judged worth adding to a future library update, not an immediate change.
export function useSubmitPaintSuggestion() {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async ({ name, brand, type, hex, notes }) => {
      const { error } = await supabase.from('paint_suggestions').insert({
        user_id: userId, name, brand, type, hex, notes,
      });
      if (error) throw new Error("Couldn't send that — try again.");
    },
  });
}

function fromRemote(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    type: row.type,
    hex: row.hex,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

// Admin-only in practice (RLS only lets an admin select rows other than
// their own), same "the real gate is RLS, this hook just assumes it" stance
// as useAdmin.js's own queries.
export function useOpenPaintSuggestions() {
  return useQuery({
    queryKey: ['adminPaintSuggestions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('paint_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(fromRemote);
    },
  });
}

export function useReviewPaintSuggestion() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('paint_suggestions').update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error("Couldn't update that — try again.");
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['adminPaintSuggestions'], (prev = []) => prev.filter((s) => s.id !== id));
    },
  });
}
