import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

// Reports point at a recipe_comment or paint_note by a bare content_id --
// there's no FK Postgrest can follow across two different possible target
// tables, so this fetches open reports, then the two content tables
// separately by id and stitches them together client-side, same "no
// cross-table join" approach useComments.js/useNotes.js already use for
// denormalizing author profiles onto their own rows.
export function useOpenReports() {
  return useQuery({
    queryKey: ['adminReports'],
    queryFn: async () => {
      const { data: reports, error } = await supabase.from('reports').select('*').eq('status', 'open').order('created_at', { ascending: false });
      if (error) throw error;
      const rows = reports || [];

      const commentIds = [...new Set(rows.filter((r) => r.content_type === 'recipe_comment').map((r) => r.content_id))];
      const noteIds = [...new Set(rows.filter((r) => r.content_type === 'paint_note').map((r) => r.content_id))];

      const [{ data: comments }, { data: notes }] = await Promise.all([
        commentIds.length ? supabase.from('recipe_comments').select('*').in('id', commentIds) : Promise.resolve({ data: [] }),
        noteIds.length ? supabase.from('paint_notes').select('*').in('id', noteIds) : Promise.resolve({ data: [] }),
      ]);

      const authorIds = [...new Set([...(comments || []).map((c) => c.user_id), ...(notes || []).map((n) => n.user_id)])];
      let authors = {};
      if (authorIds.length) {
        const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path').in('user_id', authorIds);
        authors = Object.fromEntries((profRows || []).map((row) => [row.user_id, { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path) }]));
      }

      const commentsById = Object.fromEntries((comments || []).map((c) => [c.id, c]));
      const notesById = Object.fromEntries((notes || []).map((n) => [n.id, n]));

      // Group every report pointing at the same piece of content into one
      // queue row -- 3 reporters on one bad comment should read as one
      // thing to act on, not 3 separate rows each needing their own click.
      const grouped = new Map();
      rows.forEach((r) => {
        const key = `${r.content_type}:${r.content_id}`;
        const content = r.content_type === 'recipe_comment' ? commentsById[r.content_id] : notesById[r.content_id];
        if (!content) return; // the content itself was deleted since this report was filed
        if (!grouped.has(key)) {
          grouped.set(key, {
            contentType: r.content_type,
            contentId: r.content_id,
            body: content.body,
            status: content.status,
            author: authors[content.user_id] || { displayName: 'Someone', avatarUrl: null },
            reportCount: 0,
            reportIds: [],
            reasons: [],
          });
        }
        const g = grouped.get(key);
        g.reportCount += 1;
        g.reportIds.push(r.id);
        if (r.reason) g.reasons.push(r.reason);
      });

      return [...grouped.values()];
    },
  });
}

function removeFromQueue(qc, contentType, contentId) {
  qc.setQueryData(['adminReports'], (prev = []) => prev.filter((r) => !(r.contentType === contentType && r.contentId === contentId)));
}

export function useHideContent() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId, reportIds }) => {
      const table = contentType === 'recipe_comment' ? 'recipe_comments' : 'paint_notes';
      const { error: hideErr } = await supabase.from(table).update({ status: 'hidden' }).eq('id', contentId);
      if (hideErr) throw new Error("Couldn't hide that — try again.");
      const { error: resolveErr } = await supabase.from('reports').update({ status: 'resolved', resolved_by: userId, resolved_at: new Date().toISOString() }).in('id', reportIds);
      if (resolveErr) throw new Error('Hid the content, but could not clear its reports — try again.');
      return { contentType, contentId };
    },
    onSuccess: ({ contentType, contentId }) => removeFromQueue(qc, contentType, contentId),
  });
}

export function useDismissReports() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId, reportIds }) => {
      const { error } = await supabase.from('reports').update({ status: 'dismissed', resolved_by: userId, resolved_at: new Date().toISOString() }).in('id', reportIds);
      if (error) throw new Error("Couldn't dismiss that — try again.");
      return { contentType, contentId };
    },
    onSuccess: ({ contentType, contentId }) => removeFromQueue(qc, contentType, contentId),
  });
}

// Bans/unbans an account -- enforced at sign-in (see AuthContext.jsx), not
// a live session kill, so this only ever affects a banned user's NEXT sign-
// in attempt.
export function useSetUserBanned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUserId, banned }) => {
      const { error } = await supabase.from('profiles').update({ is_banned: banned }).eq('user_id', targetUserId);
      if (error) throw new Error("Couldn't update that account — try again.");
      return { targetUserId, banned };
    },
    onSuccess: ({ targetUserId, banned }) => {
      qc.setQueriesData({ queryKey: ['profileSearch'] }, (prev) => prev?.map((p) => (p.userId === targetUserId ? { ...p, isBanned: banned } : p)));
    },
  });
}
