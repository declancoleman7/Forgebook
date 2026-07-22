import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../icons.jsx';
import Avatar from './Avatar.jsx';
import MentionTextarea from './MentionTextarea.jsx';
import MentionText from './MentionText.jsx';
import { relativeTime } from '../utils/format.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useComments, useSubmitComment, useEditComment, useDeleteComment, useCommentVoteCounts, useMyCommentVotes, useToggleCommentVote } from '../queries/useComments.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useReport } from '../report/ReportContext.jsx';
import { useReportContent } from '../queries/useReports.js';
import { useToast } from '../toast/ToastContext.jsx';

// Ported from the old app's commentListHtml()/commentRowHtml().
function CommentRow({ c, myId, isReply, isSignedIn, likeCount, liked, onReply, onEdit, onDelete, onReport, onToggleLike }) {
  const isMine = c.userId === myId;
  const pending = c.flagged || c.status === 'hidden';

  return (
    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
      className={`comment-row ${pending ? 'is-pending' : ''} ${isReply ? 'comment-row--reply' : ''}`}>
      <div className="comment-row__meta">
        <span className="comment-row__author">
          <Avatar displayName={c.author.displayName} url={c.author.avatarUrl} size={16} />
          {' '}{c.author.displayName}{c.author.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}
        </span>
        <span className="comment-row__time">{relativeTime(c.createdAt)}{c.edited ? ' · edited' : ''}</span>
        {pending && <span className="pill-status">{c.status === 'hidden' ? 'Hidden — reported' : 'Hidden — pending review'}</span>}
      </div>
      <div className="comment-row__body"><MentionText text={c.body} /></div>
      {(!isMine && isSignedIn) || (!isMine && !isReply) || isMine || likeCount > 0 ? (
        <div className="comment-row__linkrow">
          {!isMine && isSignedIn ? (
            <motion.button whileTap={{ scale: 0.85 }} className={`comment-row__like ${liked ? 'is-active' : ''}`} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => onToggleLike(c.id, liked)}>
              <Icon name="thumb-up" size={12} /> {likeCount > 0 && <motion.span key={likeCount}>{likeCount}</motion.span>}
            </motion.button>
          ) : (
            likeCount > 0 && <span className="comment-row__like-count"><Icon name="thumb-up" size={12} /> {likeCount}</span>
          )}
          {!isMine && !isReply && <button className="comment-row__link" onClick={() => onReply(c)}>Reply</button>}
          {isMine && <button className="comment-row__link" onClick={() => onEdit(c)}>Edit</button>}
          {isMine && <button className="comment-row__link" onClick={() => onDelete(c.id)}>Delete</button>}
        </div>
      ) : null}
      {!isMine && isSignedIn && <button className="comment-row__report" title="Report" onClick={() => onReport(c.id)}><Icon name="flag" size={13} /></button>}
    </motion.div>
  );
}

export default function CommentThread({ ownerId, recipeId }) {
  const { userId, isSignedIn } = useAuth();
  const confirm = useConfirm();
  const report = useReport();
  const reportContent = useReportContent();
  const showToast = useToast();
  const { data: comments, isLoading } = useComments(ownerId, recipeId);
  const submitComment = useSubmitComment(ownerId, recipeId);
  const editComment = useEditComment(ownerId, recipeId);
  const deleteComment = useDeleteComment(ownerId, recipeId);
  const { data: voteCounts } = useCommentVoteCounts();
  const { data: myVotes } = useMyCommentVotes();
  const toggleLike = useToggleCommentVote();

  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { id, authorName } | null
  const textareaRef = useRef(null);

  const { top, repliesFor } = useMemo(() => {
    const sorted = comments ? [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : comments;
    const topLevel = sorted ? sorted.filter((c) => !c.parentCommentId) : sorted;
    const replies = (id) => (comments || []).filter((c) => c.parentCommentId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { top: topLevel, repliesFor: replies };
  }, [comments]);

  const startReply = (c) => { setReplyingTo({ id: c.id, authorName: c.author.displayName }); setEditingId(null); textareaRef.current?.focus(); };
  const startEdit = (c) => { setEditingId(c.id); setBody(c.body); setReplyingTo(null); textareaRef.current?.focus(); };
  const cancelReply = () => setReplyingTo(null);
  const cancelEdit = () => { setEditingId(null); setBody(''); };

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      if (editingId) {
        await editComment.mutateAsync({ id: editingId, body: trimmed });
      } else {
        await submitComment.mutateAsync({ body: trimmed, parentCommentId: replyingTo?.id });
      }
      setBody(''); setEditingId(null); setReplyingTo(null);
    } catch (e) {
      showToast(e.message || 'Something went wrong — try again.');
    }
  };

  const doDelete = async (id) => {
    if (await confirm('Delete this comment?')) {
      deleteComment.mutate(id);
    }
  };

  const doReport = async (id) => {
    const reason = await report('comment');
    if (reason === null) return;
    try {
      const res = await reportContent.mutateAsync({ contentType: 'recipe_comment', contentId: id, reason });
      showToast(res.alreadyReported ? "You've already reported this" : 'Reported — thanks for flagging this');
    } catch (e) {
      showToast(e.message || "Couldn't send that report — try again.");
    }
  };

  const doToggleLike = (id, liked) => toggleLike.mutate({ commentId: id, liked });

  return (
    <>
      <div className="section-label">Comments{comments ? ` (${comments.length})` : ''}</div>
      {isSignedIn ? (
        <div className="note-composer">
          {replyingTo && (
            <div className="reply-indicator">
              Replying to <strong>{replyingTo.authorName}</strong>
              <button type="button" className="reply-indicator__cancel" onClick={cancelReply} aria-label="Cancel reply">&times;</button>
            </div>
          )}
          {editingId && (
            <div className="reply-indicator">
              Editing your comment
              <button type="button" className="reply-indicator__cancel" onClick={cancelEdit} aria-label="Cancel edit">&times;</button>
            </div>
          )}
          <MentionTextarea textareaRef={textareaRef} id="comment-input" maxLength={500} spellCheck autoCapitalize="sentences"
            placeholder="Ask a question or share a tip... (@ to mention someone)" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="note-composer__footer">
            <span className="char-count">{body.length}/500</span>
            <button className="btn btn-primary btn-sm" disabled={submitComment.isPending || editComment.isPending} onClick={submit}>
              {editingId ? 'Save edit' : 'Post comment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="fine-print" style={{ marginBottom: 14 }}>Sign in to comment.</div>
      )}
      {isLoading ? (
        <div className="empty-state__sub">Loading comments…</div>
      ) : top?.length ? (
        <AnimatePresence initial={false}>
          {top.flatMap((c) => [
            <CommentRow key={c.id} c={c} myId={userId} isReply={false} isSignedIn={isSignedIn}
              likeCount={voteCounts?.find((v) => v.commentId === c.id)?.likeCount || 0} liked={!!myVotes?.includes(c.id)}
              onReply={startReply} onEdit={startEdit} onDelete={doDelete} onReport={doReport} onToggleLike={doToggleLike} />,
            ...repliesFor(c.id).map((r) => (
              <CommentRow key={r.id} c={r} myId={userId} isReply isSignedIn={isSignedIn}
                likeCount={voteCounts?.find((v) => v.commentId === r.id)?.likeCount || 0} liked={!!myVotes?.includes(r.id)}
                onReply={startReply} onEdit={startEdit} onDelete={doDelete} onReport={doReport} onToggleLike={doToggleLike} />
            )),
          ])}
        </AnimatePresence>
      ) : (
        <div className="empty-state__sub">No comments yet.</div>
      )}
    </>
  );
}
