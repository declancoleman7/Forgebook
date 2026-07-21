import { useQuery } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}
function fromRemoteComment(row) {
  return { id: row.id, recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id, userId: row.user_id, body: row.body, createdAt: row.created_at };
}
function fromRemoteRating(row) {
  return { paintKey: row.paint_key, stars: row.stars, updatedAt: row.updated_at, userId: row.user_id };
}
function fromRemoteNote(row) {
  return { id: row.id, paintKey: row.paint_key, userId: row.user_id, body: row.body, createdAt: row.created_at };
}

// The Home activity feed's raw material -- bounded, recency-ordered
// slices of comments/ratings/notes site-wide, same shape as the old app's
// fetchActivityFeed(). Author profiles are batch-resolved here (one query
// for every distinct author across all three, not per-row) rather than
// diffed against a persistent local profiles cache the old app kept --
// there's no equivalent long-lived cache in the React version worth
// maintaining just to skip a handful of already-cheap refetches.
export function useActivityFeed() {
  return useQuery({
    queryKey: ['activityFeed'],
    queryFn: async () => {
      const [cRes, rRes, nRes] = await Promise.all([
        supabase.from('recipe_comments').select('*').eq('status', 'visible').eq('flagged', false).eq('deleted', false).order('created_at', { ascending: false }).limit(100),
        supabase.from('paint_ratings').select('*').eq('deleted', false).order('updated_at', { ascending: false }).limit(100),
        supabase.from('paint_notes').select('*').eq('status', 'visible').eq('flagged', false).eq('deleted', false).order('created_at', { ascending: false }).limit(100),
      ]);
      if (cRes.error) throw cRes.error;
      if (rRes.error) throw rRes.error;
      if (nRes.error) throw nRes.error;

      const comments = (cRes.data || []).map(fromRemoteComment);
      const ratings = (rRes.data || []).map(fromRemoteRating);
      const notes = (nRes.data || []).map(fromRemoteNote);
      const authorIds = [...new Set([...comments.map((c) => c.userId), ...ratings.map((r) => r.userId), ...notes.map((n) => n.userId)])];
      let authors = {};
      if (authorIds.length) {
        const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').in('user_id', authorIds);
        authors = Object.fromEntries((profRows || []).map((row) => [row.user_id, { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin }]));
      }
      const withAuthor = (userId) => authors[userId] || { displayName: 'Someone', avatarUrl: null, isAdmin: false };
      return {
        comments: comments.map((c) => ({ ...c, author: withAuthor(c.userId) })),
        ratings: ratings.map((r) => ({ ...r, author: withAuthor(r.userId) })),
        notes: notes.map((n) => ({ ...n, author: withAuthor(n.userId) })),
      };
    },
  });
}

// Site-wide comment count per recipe -- schema.sql's recipe_comment_counts
// view (public-visible-comments only), used for both feed engagement
// scoring and a recipe card's own "N Comments" badge.
export function useRecipeCommentCounts() {
  return useQuery({
    queryKey: ['recipeCommentCounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipe_comment_counts').select('*');
      if (error) throw error;
      return (data || []).map((row) => ({ recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id, commentCount: row.comment_count }));
    },
  });
}

// Site-wide avg+count per paint_key -- schema.sql's paint_rating_summary
// view, one call instead of one per paint.
export function usePaintRatingSummary() {
  return useQuery({
    queryKey: ['paintRatingSummary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('paint_rating_summary').select('*');
      if (error) throw error;
      return (data || []).map((row) => ({ paintKey: row.paint_key, avgStars: row.avg_stars, ratingCount: row.rating_count }));
    },
  });
}
