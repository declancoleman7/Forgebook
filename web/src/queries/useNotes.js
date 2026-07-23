import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { containsBlockedContent } from '../utils/moderation.js';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}
function fromRemoteNote(row) {
  return {
    id: row.id, paintKey: row.paint_key, userId: row.user_id, body: row.body,
    flagged: !!row.flagged, status: row.status, createdAt: row.created_at,
  };
}

// Freeform community tips on a library paint. Author profiles are
// denormalized onto each row, same pattern as useComments -- there's no
// edit/delete for your own note in the old app either (post it, or report
// someone else's), so this hook is intentionally read+submit only.
export function usePaintNotes(paintKey) {
  return useQuery({
    queryKey: ['paintNotes', paintKey],
    queryFn: async () => {
      const { data, error } = await supabase.from('paint_notes').select('*').eq('paint_key', paintKey).eq('deleted', false).order('created_at');
      if (error) throw error;
      const notes = (data || []).map(fromRemoteNote);
      const authorIds = [...new Set(notes.map((n) => n.userId))];
      let authors = {};
      if (authorIds.length) {
        const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').in('user_id', authorIds);
        authors = Object.fromEntries((profRows || []).map((row) => [row.user_id, { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin }]));
      }
      return notes.map((n) => ({ ...n, author: authors[n.userId] || { displayName: 'Someone', avatarUrl: null, isAdmin: false } }));
    },
    enabled: !!paintKey,
  });
}

export function useSubmitNote(paintKey) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const note = { id: crypto.randomUUID(), paint_key: paintKey, user_id: userId, body, flagged: containsBlockedContent(body), updated_at: new Date().toISOString() };
      const { error } = await supabase.from('paint_notes').insert(note);
      // Same 42501-means-rate-limited reasoning as useComments.js's
      // useAddComment -- see schema.sql's "post paint notes" policy.
      if (error?.code === '42501') throw new Error("You're posting a bit fast — wait a few minutes and try again.");
      if (error) throw new Error("Couldn't post that note — try again.");
      return fromRemoteNote(note);
    },
    onSuccess: (note) => {
      qc.setQueryData(['paintNotes', paintKey], (prev = []) => [...prev, { ...note, author: { displayName: 'You', avatarUrl: null, isAdmin: false } }]);
      qc.invalidateQueries({ queryKey: ['paintNotes', paintKey] }); // pick up the real author profile
    },
  });
}
