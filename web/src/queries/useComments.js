import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, CONFIG } from '../supabase.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { containsBlockedContent } from '../utils/moderation.js';

function avatarUrl(path) {
  return path ? `${CONFIG.supabaseUrl}/storage/v1/object/public/avatar-photos/${path}` : null;
}

function fromRemoteComment(row) {
  return {
    id: row.id, recipeOwnerId: row.recipe_owner_id, recipeId: row.recipe_id, userId: row.user_id,
    body: row.body, edited: !!row.edited, flagged: !!row.flagged, status: row.status,
    parentCommentId: row.parent_comment_id || null, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// Author profiles denormalized onto each comment, same pattern as
// useNotifications/useSharedRecipes -- avoids a separate profile-cache
// layer. Works signed-out too (RLS gates visibility by the recipe's own
// published/deleted flags), matching the old app's fetchComments().
export function useComments(ownerId, recipeId) {
  return useQuery({
    queryKey: ['comments', ownerId, recipeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipe_comments').select('*').eq('recipe_owner_id', ownerId).eq('recipe_id', recipeId).eq('deleted', false).order('created_at');
      if (error) throw error;
      const comments = (data || []).map(fromRemoteComment);
      const authorIds = [...new Set(comments.map((c) => c.userId))];
      let authors = {};
      if (authorIds.length) {
        const { data: profRows } = await supabase.from('profiles').select('user_id, display_name, avatar_path, is_admin').in('user_id', authorIds);
        authors = Object.fromEntries((profRows || []).map((row) => [row.user_id, { displayName: row.display_name, avatarUrl: avatarUrl(row.avatar_path), isAdmin: !!row.is_admin }]));
      }
      return comments.map((c) => ({ ...c, author: authors[c.userId] || { displayName: 'Someone', avatarUrl: null, isAdmin: false } }));
    },
    enabled: !!ownerId && !!recipeId,
  });
}

export function useSubmitComment(ownerId, recipeId) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, parentCommentId }) => {
      const comment = {
        id: crypto.randomUUID(), recipe_owner_id: ownerId, recipe_id: recipeId, user_id: userId,
        body, flagged: containsBlockedContent(body), parent_comment_id: parentCommentId || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('recipe_comments').insert(comment);
      if (error) throw new Error("Couldn't post that comment — try again.");
      return fromRemoteComment(comment);
    },
    onSuccess: (comment) => {
      qc.setQueryData(['comments', ownerId, recipeId], (prev = []) => [...prev, { ...comment, author: { displayName: 'You', avatarUrl: null, isAdmin: false } }]);
      qc.invalidateQueries({ queryKey: ['comments', ownerId, recipeId] }); // pick up the real author profile
    },
  });
}

export function useEditComment(ownerId, recipeId) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const { error } = await supabase.from('recipe_comments').update({ body, edited: true, flagged: containsBlockedContent(body), updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
      if (error) throw new Error("Couldn't save that edit — try again.");
      return { id, body };
    },
    onSuccess: ({ id, body }) => {
      qc.setQueryData(['comments', ownerId, recipeId], (prev) => prev?.map((c) => (c.id === id ? { ...c, body, edited: true } : c)));
    },
  });
}

export function useDeleteComment(ownerId, recipeId) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('recipe_comments').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['comments', ownerId, recipeId], (prev) => prev?.filter((c) => c.id !== id));
    },
  });
}

// --- Comment likes --------------------------------------------------------
// Same "fetch the whole aggregate view, look up client-side" shape as
// useRecipeVoteSummary/useMyRecipeVotes -- upvote-only (no dislike), so a
// vote is either present or absent rather than a +1/-1 value.

export function useCommentVoteCounts() {
  return useQuery({
    queryKey: ['commentVoteCounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('comment_vote_counts').select('*');
      if (error) throw error;
      return (data || []).map((row) => ({ commentId: row.comment_id, likeCount: row.like_count }));
    },
  });
}

export function useMyCommentVotes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['myCommentVotes', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('comment_votes').select('comment_id').eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((row) => row.comment_id);
    },
    enabled: !!userId,
  });
}

export function useToggleCommentVote() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, liked }) => {
      if (liked) {
        const { error } = await supabase.from('comment_votes').delete().eq('user_id', userId).eq('comment_id', commentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('comment_votes').insert({ comment_id: commentId, user_id: userId });
        if (error) throw error;
      }
    },
    onMutate: async ({ commentId, liked }) => {
      await qc.cancelQueries({ queryKey: ['myCommentVotes', userId] });
      await qc.cancelQueries({ queryKey: ['commentVoteCounts'] });
      const prevMine = qc.getQueryData(['myCommentVotes', userId]);
      const prevCounts = qc.getQueryData(['commentVoteCounts']);

      qc.setQueryData(['myCommentVotes', userId], (prev = []) => (liked ? prev.filter((id) => id !== commentId) : [...prev, commentId]));
      qc.setQueryData(['commentVoteCounts'], (prev = []) => {
        const idx = prev.findIndex((c) => c.commentId === commentId);
        const row = idx > -1 ? { ...prev[idx] } : { commentId, likeCount: 0 };
        row.likeCount = Math.max(0, row.likeCount + (liked ? -1 : 1));
        const next = [...prev];
        if (idx > -1) next[idx] = row; else next.push(row);
        return next;
      });
      return { prevMine, prevCounts };
    },
    onError: (err, vars, context) => {
      if (context?.prevMine) qc.setQueryData(['myCommentVotes', userId], context.prevMine);
      if (context?.prevCounts) qc.setQueryData(['commentVoteCounts'], context.prevCounts);
    },
  });
}
