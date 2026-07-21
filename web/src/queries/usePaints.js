import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { paintKey } from '../data/paints.js';

function toRemotePaint(p, userId) {
  return {
    id: p.id, user_id: userId, name: p.name, brand: p.brand,
    hex: p.hex, type: p.type, needs_restock: !!p.needsRestock,
    quantity: p.quantity == null ? 1 : p.quantity,
    updated_at: new Date().toISOString(), deleted: false,
  };
}

function fromRemotePaint(row) {
  return {
    id: row.id, name: row.name, brand: row.brand, hex: row.hex,
    type: row.type, needsRestock: !!row.needs_restock,
    quantity: row.quantity == null ? 1 : row.quantity,
  };
}

export function useMyPaints() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['paints', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paints').select('*').eq('user_id', userId).eq('deleted', false);
      if (error) throw error;
      return (data || []).map(fromRemotePaint);
    },
    enabled: !!userId,
  });
}

// Lives in its own paint_wants table rather than on a rack row -- a
// wanted-but-unowned paint has no business in the rack itself. Returns the
// plain array of paintKey() strings, same shape the old app's
// getWantToBuy() did.
export function useWantToBuy() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['paintWants', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('paint_wants').select('paint_key').eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((row) => row.paint_key);
    },
    enabled: !!userId,
  });
}

// Shared by every "add this paint to my rack" entry point (the Paint
// Library's tap-to-add, and later a recipe step's "add straight to rack").
// Owned and "need to buy" are mutually exclusive, so this also clears the
// wishlist flag if it was set -- moot now that it's owned.
export function useAddPaintToRack() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, brand, hex, type, quantity }) => {
      const row = { id: 'lib-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, brand, hex, type, quantity: quantity || 1 };
      const { error } = await supabase.from('paints').upsert(toRemotePaint(row, userId));
      if (error) throw new Error("Couldn't save that — try again.");
      const key = paintKey(name, brand);
      const { error: wantErr } = await supabase.from('paint_wants').delete().eq('user_id', userId).eq('paint_key', key);
      if (wantErr) { /* non-fatal -- the paint is on the rack either way */ }
      return { row, key };
    },
    onSuccess: ({ row, key }) => {
      qc.setQueryData(['paints', userId], (prev) => (prev ? [...prev, row] : prev));
      qc.setQueryData(['paintWants', userId], (prev) => prev?.filter((k) => k !== key));
    },
  });
}

function usePatchPaint() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      const current = qc.getQueryData(['paints', userId])?.find((p) => p.id === id);
      if (!current) throw new Error('Paint not found');
      const next = { ...current, ...patch };
      const { error } = await supabase.from('paints').upsert(toRemotePaint(next, userId));
      if (error) throw new Error("Couldn't save that — try again.");
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(['paints', userId], (prev) => prev?.map((p) => (p.id === next.id ? next : p)));
    },
  });
}

// Plain +/- only -- the old app's "decreasing to 0 removes it from the
// rack, confirmed first" rule is a UI decision, not a data one, so that
// confirm() + useDeletePaint() call lives at the component call site
// instead (same split already used for sign-out).
export function useUpdateQuantity() {
  const patch = usePatchPaint();
  const inc = (id, current) => patch.mutate({ id, patch: { quantity: (current || 1) + 1 } });
  const dec = (id, current) => patch.mutate({ id, patch: { quantity: Math.max(1, (current || 1) - 1) } });
  return { inc, dec, isPending: patch.isPending };
}

export function useToggleRestock() {
  const patch = usePatchPaint();
  return (id, current) => patch.mutate({ id, patch: { needsRestock: !current } });
}

export function useToggleWanted() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, brand, wanted }) => {
      const key = paintKey(name, brand);
      if (wanted) {
        const { error } = await supabase.from('paint_wants').delete().eq('user_id', userId).eq('paint_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('paint_wants').upsert({ paint_key: key, user_id: userId });
        if (error) throw error;
      }
      return { key, wanted: !wanted };
    },
    onSuccess: ({ key, wanted }) => {
      qc.setQueryData(['paintWants', userId], (prev) => {
        if (!prev) return prev;
        return wanted ? [...new Set([...prev, key])] : prev.filter((k) => k !== key);
      });
    },
  });
}

export function useDeletePaint() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('paints').delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't delete that — try again.");
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['paints', userId], (prev) => prev?.filter((p) => p.id !== id));
    },
  });
}
