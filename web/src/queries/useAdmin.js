import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

function recipePhotoUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.photoBucket}/${path}` : null;
}

// Reports point at content by a bare content_id -- there's no FK Postgrest
// can follow across the several different possible target tables, so this
// fetches reports (in whichever statuses the caller wants), then each
// content table separately and stitches them together client-side, same
// "no cross-table join" approach useComments.js/useNotes.js already use for
// denormalizing author profiles. Shared by useOpenReports (the queue,
// status='open' only) and useTopOffenders (status in open+resolved, grouped
// a different way -- see below) so the fetch/resolve logic lives in
// exactly one place.
//
// A 'recipe_photo' report's content_id is the composite "{ownerId}:{recipeId}"
// string (see schema.sql's content_id widening comment for why) -- fetching
// candidate recipes via two independent .in() filters (matching either half
// across ALL reported photos, not exact pairs) can occasionally over-fetch
// when several photos are reported at once, but the lookup below re-keys by
// the exact "ownerId:recipeId" string, so an over-fetched, unrelated recipe
// is simply never matched against -- harmless, not a correctness issue.
//
// Each returned item is grouped by CONTENT (one row per reported thing, not
// per report) and carries `ownerId` -- whoever WROTE the comment/note or
// whoever the reported photo belongs to, i.e. who a ban would actually
// target, never the reporter (the reporter is only ever reporter_id on the
// underlying report rows, not surfaced here at all).
async function fetchGroupedReports(statuses) {
  const { data: reports, error } = await supabase.from('reports').select('*').in('status', statuses).order('created_at', { ascending: false });
  if (error) throw error;
  const rows = reports || [];

  const commentIds = [...new Set(rows.filter((r) => r.content_type === 'recipe_comment').map((r) => r.content_id))];
  const noteIds = [...new Set(rows.filter((r) => r.content_type === 'paint_note').map((r) => r.content_id))];
  const photoRefs = rows.filter((r) => r.content_type === 'recipe_photo').map((r) => r.content_id.split(':'));
  const photoOwnerIds = [...new Set(photoRefs.map(([ownerId]) => ownerId))];
  const photoRecipeIds = [...new Set(photoRefs.map(([, recipeId]) => recipeId))];
  const avatarUserIds = [...new Set(rows.filter((r) => r.content_type === 'avatar_photo').map((r) => r.content_id))];

  const [{ data: comments }, { data: notes }, { data: photoRecipes }, { data: avatarProfiles }] = await Promise.all([
    commentIds.length ? supabase.from('recipe_comments').select('*').in('id', commentIds) : Promise.resolve({ data: [] }),
    noteIds.length ? supabase.from('paint_notes').select('*').in('id', noteIds) : Promise.resolve({ data: [] }),
    photoRecipeIds.length ? supabase.from('recipes').select('user_id, id, name, photo_path').in('id', photoRecipeIds).in('user_id', photoOwnerIds) : Promise.resolve({ data: [] }),
    avatarUserIds.length ? supabase.from('profiles').select('user_id, display_name, avatar_path, is_banned').in('user_id', avatarUserIds) : Promise.resolve({ data: [] }),
  ]);

  const authorIds = [...new Set([...(comments || []).map((c) => c.user_id), ...(notes || []).map((n) => n.user_id), ...photoOwnerIds])];
  let authors = {};
  if (authorIds.length) {
    const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_banned').in('user_id', authorIds);
    authors = Object.fromEntries((profRows || []).map((row) => [row.user_id, { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isBanned: !!row.is_banned }]));
  }

  const commentsById = Object.fromEntries((comments || []).map((c) => [c.id, c]));
  const notesById = Object.fromEntries((notes || []).map((n) => [n.id, n]));
  const photoRecipesByKey = Object.fromEntries((photoRecipes || []).map((r) => [`${r.user_id}:${r.id}`, r]));
  const avatarProfilesById = Object.fromEntries((avatarProfiles || []).map((p) => [p.user_id, p]));

  // Group every report pointing at the same piece of content into one
  // queue row -- 3 reporters on one bad comment should read as one
  // thing to act on, not 3 separate rows each needing their own click.
  const grouped = new Map();
  rows.forEach((r) => {
    const key = `${r.content_type}:${r.content_id}`;
    let entry;
    if (r.content_type === 'recipe_comment' || r.content_type === 'paint_note') {
      const content = r.content_type === 'recipe_comment' ? commentsById[r.content_id] : notesById[r.content_id];
      if (!content) return; // the content itself was deleted since this report was filed
      entry = { kind: 'text', body: content.body, ownerId: content.user_id, author: authors[content.user_id] || { displayName: 'Someone', avatarUrl: null, isBanned: false } };
    } else if (r.content_type === 'recipe_photo') {
      const recipe = photoRecipesByKey[r.content_id];
      if (!recipe) return; // the recipe itself was deleted since this report was filed
      // photo_path can be null here if this report was already resolved by
      // removing the photo (see useHideContent) -- that's still a real,
      // countable violation for the top-offenders view, it just can't
      // re-render an image that no longer exists (ReportedContentPreview
      // shows a "photo removed" placeholder instead).
      entry = { kind: 'image', imageUrl: recipe.photo_path ? recipePhotoUrl(recipe.photo_path) : null, caption: recipe.name, ownerId: recipe.user_id, author: authors[recipe.user_id] || { displayName: 'Someone', avatarUrl: null, isBanned: false } };
    } else if (r.content_type === 'avatar_photo') {
      const profile = avatarProfilesById[r.content_id];
      if (!profile) return; // the profile itself no longer exists
      entry = { kind: 'image', imageUrl: profile.avatar_path ? avatarUrl(profile.avatar_path) : null, caption: `${profile.display_name}'s profile photo`, ownerId: profile.user_id, author: { displayName: profile.display_name, avatarUrl: avatarUrl(profile.avatar_path), isBanned: !!profile.is_banned } };
    } else {
      return;
    }

    if (!grouped.has(key)) {
      grouped.set(key, { contentType: r.content_type, contentId: r.content_id, ...entry, reportCount: 0, reportIds: [], reasons: [] });
    }
    const g = grouped.get(key);
    g.reportCount += 1;
    g.reportIds.push(r.id);
    if (r.reason) g.reasons.push(r.reason);
  });

  return [...grouped.values()];
}

export function useOpenReports() {
  return useQuery({
    queryKey: ['adminReports'],
    queryFn: () => fetchGroupedReports(['open']),
  });
}

// Ranks accounts by how much of THEIR content has been reported, so an
// admin can spot a repeat offender from the Users tab before individually
// searching for them. Counts 'open' and 'resolved' reports (things that
// were, or still are, genuinely actionable) but not 'dismissed' ones -- a
// dismissed report was already judged not a real violation, so it
// shouldn't count against anyone. Each offender's own `items` reuses the
// exact same grouped-by-content shape useOpenReports returns, so ReportRow
// can render an offender's flagged items with zero new branching.
export function useTopOffenders() {
  return useQuery({
    queryKey: ['adminTopOffenders'],
    queryFn: async () => {
      const items = await fetchGroupedReports(['open', 'resolved']);
      const byOwner = new Map();
      items.forEach((item) => {
        if (!byOwner.has(item.ownerId)) {
          byOwner.set(item.ownerId, { ownerId: item.ownerId, displayName: item.author.displayName, avatarUrl: item.author.avatarUrl, isBanned: item.author.isBanned, totalReports: 0, items: [] });
        }
        const o = byOwner.get(item.ownerId);
        o.totalReports += item.reportCount;
        o.items.push(item);
      });
      return [...byOwner.values()].sort((a, b) => b.totalReports - a.totalReports).slice(0, 20);
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
      let hideErr;
      if (contentType === 'recipe_comment' || contentType === 'paint_note') {
        const table = contentType === 'recipe_comment' ? 'recipe_comments' : 'paint_notes';
        ({ error: hideErr } = await supabase.from(table).update({ status: 'hidden' }).eq('id', contentId));
      } else if (contentType === 'recipe_photo') {
        // contentId is "{ownerId}:{recipeId}" -- recipes are keyed
        // (user_id, id), so both halves are needed to target one row.
        const [ownerId, recipeId] = contentId.split(':');
        ({ error: hideErr } = await supabase.from('recipes').update({ photo_path: null }).eq('user_id', ownerId).eq('id', recipeId));
      } else {
        ({ error: hideErr } = await supabase.from('profiles').update({ avatar_path: null }).eq('user_id', contentId));
      }
      if (hideErr) throw new Error("Couldn't hide that — try again.");
      const { error: resolveErr } = await supabase.from('reports').update({ status: 'resolved', resolved_by: userId, resolved_at: new Date().toISOString() }).in('id', reportIds);
      if (resolveErr) throw new Error('Hid the content, but could not clear its reports — try again.');
      return { contentType, contentId };
    },
    onSuccess: ({ contentType, contentId }) => {
      removeFromQueue(qc, contentType, contentId);
      qc.invalidateQueries({ queryKey: ['adminTopOffenders'] });
    },
  });
}

// Dismissing (unlike hiding) changes an offender's total: a dismissed
// report no longer counts toward it (see useTopOffenders' own comment on
// why only open+resolved count), so this invalidates that list too rather
// than trying to hand-patch its aggregate count correctly.
export function useDismissReports() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId, reportIds }) => {
      const { error } = await supabase.from('reports').update({ status: 'dismissed', resolved_by: userId, resolved_at: new Date().toISOString() }).in('id', reportIds);
      if (error) throw new Error("Couldn't dismiss that — try again.");
      return { contentType, contentId };
    },
    onSuccess: ({ contentType, contentId }) => {
      removeFromQueue(qc, contentType, contentId);
      qc.invalidateQueries({ queryKey: ['adminTopOffenders'] });
    },
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
      qc.setQueryData(['adminTopOffenders'], (prev) => prev?.map((o) => (o.ownerId === targetUserId ? { ...o, isBanned: banned } : o)));
    },
  });
}
