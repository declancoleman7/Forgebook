import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { faction } from '../data/factions.js';
import { PAINT_LIBRARY, paintCategory, paintKey } from '../data/paints.js';
import { relativeTime } from '../utils/format.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useActiveHobbyId } from '../hooks/useActiveHobby.js';
import { useMyRecipes, useSharedRecipes, useRecipeVoteSummary, useMyRecipeVotes, useVoteRecipe, useSavedRecipes, useToggleSaveRecipe } from '../queries/useRecipes.js';
import { useSavedPaintKeys } from '../queries/usePaints.js';
import { useActivityFeed, useRecipeCommentCounts, usePaintRatingSummary } from '../queries/useFeed.js';
import { useMyFollowingIds, useSuggestedProfiles, useToggleFollow } from '../queries/useSocial.js';

// Same tunables as the old app's buildFeedItems() -- a 7-day activity
// window, 48h popularity half-life, and a comment counting for 3x a like
// (a comment is a meaningfully higher-effort signal: read, think, type a
// sentence, vs. one tap).
const FEED_WINDOW_MS = 7 * 24 * 3600 * 1000;
const FEED_HALF_LIFE_MS = 48 * 3600 * 1000;
const COMMENT_ENGAGEMENT_WEIGHT = 3;

function paintFromKey(key) {
  return PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === key) || null;
}
function voteSummaryFor(summary, ownerId, recipeId) {
  return summary.find((v) => v.recipeOwnerId === ownerId && v.recipeId === recipeId);
}
function commentCountFor(counts, ownerId, recipeId) {
  return counts.find((c) => c.recipeOwnerId === ownerId && c.recipeId === recipeId)?.commentCount || 0;
}
function recipeEngagement(voteSummary, ownerId, recipeId, commentCount) {
  const s = voteSummaryFor(voteSummary, ownerId, recipeId);
  const net = s ? s.likeCount - s.dislikeCount : 0;
  return Math.max(0, net) + commentCount * COMMENT_ENGAGEMENT_WEIGHT;
}
function feedItemActorId(it) {
  if (it.type === 'recipe_published') return it.authorId;
  if (it.type === 'recipe_comments') return it.recipeOwnerId;
  if (it.type === 'paint_rating') return it.raterId;
  return it.authorId; // paint_note
}

// Turns the raw activity feed (comments/ratings/notes, site-wide) plus the
// shared-recipes list into one heterogeneous, ranked feed -- ported from
// the old app's buildFeedItems(). Comments are grouped per recipe within
// FEED_WINDOW_MS so "5 new comments on X" reads as one item; ratings/notes
// are inherently paint-level, so each is its own item.
function buildFeedItems({ myRecipes, sharedRecipes, feed, commentCounts, voteSummary, sort, followingIds, activeHobbyId, userId }) {
  const now = Date.now();
  const items = [];

  sharedRecipes
    .filter((r) => now - new Date(r.updatedAt || 0).getTime() < FEED_WINDOW_MS && (r.hobbyId || 'warhammer') === activeHobbyId)
    .forEach((r) => items.push({
      type: 'recipe_published', recipe: r, authorId: r.authorId, at: r.updatedAt,
      engagement: recipeEngagement(voteSummary, r.authorId, r.id, commentCountFor(commentCounts, r.authorId, r.id)),
    }));

  const commentGroups = {};
  feed.comments
    .filter((c) => now - new Date(c.createdAt).getTime() < FEED_WINDOW_MS)
    .forEach((c) => {
      const key = c.recipeOwnerId + '|' + c.recipeId;
      const g = commentGroups[key] || (commentGroups[key] = { recipeOwnerId: c.recipeOwnerId, recipeId: c.recipeId, count: 0, latestAt: c.createdAt });
      g.count += 1;
      if (new Date(c.createdAt) > new Date(g.latestAt)) g.latestAt = c.createdAt;
    });
  Object.values(commentGroups).forEach((g) => {
    const recipe = g.recipeOwnerId === userId
      ? myRecipes.find((r) => r.id === g.recipeId)
      : sharedRecipes.find((r) => r.id === g.recipeId && r.authorId === g.recipeOwnerId);
    if (!recipe) return;
    if ((recipe.hobbyId || 'warhammer') !== activeHobbyId) return;
    items.push({
      type: 'recipe_comments', recipe, recipeOwnerId: g.recipeOwnerId, count: g.count, at: g.latestAt,
      engagement: recipeEngagement(voteSummary, g.recipeOwnerId, g.recipeId, g.count),
    });
  });

  feed.ratings
    .filter((r) => now - new Date(r.updatedAt).getTime() < FEED_WINDOW_MS)
    .forEach((r) => {
      const paint = paintFromKey(r.paintKey);
      if (paint) items.push({ type: 'paint_rating', paint, raterId: r.userId, author: r.author, stars: r.stars, at: r.updatedAt, engagement: 1 });
    });

  feed.notes
    .filter((n) => now - new Date(n.createdAt).getTime() < FEED_WINDOW_MS)
    .forEach((n) => {
      const paint = paintFromKey(n.paintKey);
      if (paint) items.push({ type: 'paint_note', paint, authorId: n.userId, author: n.author, body: n.body, at: n.createdAt, engagement: 1 });
    });

  const visible = sort === 'following' ? items.filter((it) => followingIds.includes(feedItemActorId(it))) : items;

  if (sort === 'new' || sort === 'following') {
    visible.sort((a, b) => new Date(b.at) - new Date(a.at));
  } else {
    const decay = (iso) => Math.pow(0.5, (now - new Date(iso).getTime()) / FEED_HALF_LIFE_MS);
    visible.forEach((it) => { it.score = decay(it.at) * (1 + Math.log2(1 + it.engagement)); });
    visible.sort((a, b) => b.score - a.score);
  }
  return visible.slice(0, 30);
}

function FeedRecipeCard({ item, kind, myId, commentCounts }) {
  const navigate = useNavigate();
  const { data: voteSummary = [] } = useRecipeVoteSummary();
  const { data: myVotes = [] } = useMyRecipeVotes();
  const { data: savedRecipes = [] } = useSavedRecipes();
  const voteRecipe = useVoteRecipe();
  const toggleSave = useToggleSaveRecipe();

  const r = item.recipe;
  const fac = faction(r.faction);
  const ownerId = kind === 'published' ? item.authorId : item.recipeOwnerId;
  const author = item.author || r.author;
  const summary = voteSummaryFor(voteSummary, ownerId, r.id);
  const net = summary ? summary.likeCount - summary.dislikeCount : 0;
  const commentCount = commentCountFor(commentCounts, ownerId, r.id);
  const isMine = ownerId === myId;
  const mine = myVotes.find((v) => v.recipeOwnerId === ownerId && v.recipeId === r.id)?.value ?? null;
  const saved = savedRecipes.some((s) => s.recipeOwnerId === ownerId && s.recipeId === r.id);
  const tag = kind === 'published' ? 'New Recipe' : `${item.count} New Comment${item.count === 1 ? '' : 's'}`;

  const openRecipe = () => navigate(isMine ? `/recipe/${r.id}` : `/recipe/${r.id}/by/${ownerId}`);

  return (
    <div className="feed-card">
      <div className="feed-card__link" style={{ cursor: 'pointer' }} onClick={openRecipe}>
        <div className={`feed-card__hero ${r.photo ? 'has-photo' : ''}`} style={{ '--faction-color': fac.color, ...(r.photo ? { backgroundImage: `url('${r.photo}')` } : {}) }}>
          {!r.photo && <span className="emblem-badge emblem-badge--xl"><EmblemSvg emblemKey={fac.emblem} size={46} /></span>}
          <span className="feed-card__tag">{tag}</span>
        </div>
        <div className="feed-card__body">
          <div className="feed-card__meta">
            <Avatar displayName={author?.displayName} url={author?.avatarUrl} size={18} />
            <span className="feed-card__author">{author?.displayName || 'Someone'}</span>
            <span className="feed-card__dot">·</span>
            <span className="feed-card__time">{relativeTime(item.at)}</span>
            {saved && <span className="recipe-card__saved" title="Saved"><Icon name="bookmark" size={11} /></span>}
          </div>
          <div className="feed-card__title">{r.name}</div>
        </div>
      </div>
      <div className="feed-card__actions">
        {isMine ? (
          <div className="feed-card__votes feed-card__votes--readonly"><Icon name="thumb-up" size={15} /><motion.span key={net} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="feed-card__vote-score">{net}</motion.span></div>
        ) : (
          <div className="feed-card__votes">
            <motion.button whileTap={{ scale: 0.85 }} className={`feed-card__vote-btn ${mine === 1 ? 'is-active' : ''}`} aria-label="Like" onClick={() => voteRecipe.mutate({ ownerId, recipeId: r.id, value: 1, retract: mine === 1 })}><Icon name="thumb-up" size={15} /></motion.button>
            <motion.span key={net} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="feed-card__vote-score">{net}</motion.span>
            <motion.button whileTap={{ scale: 0.85 }} className={`feed-card__vote-btn ${mine === -1 ? 'is-active' : ''}`} aria-label="Dislike" onClick={() => voteRecipe.mutate({ ownerId, recipeId: r.id, value: -1, retract: mine === -1 })}><Icon name="thumb-down" size={15} /></motion.button>
          </div>
        )}
        <div className="feed-card__comment-btn" style={{ cursor: 'pointer' }} onClick={openRecipe}><Icon name="comment" size={15} /> {commentCount} Comment{commentCount === 1 ? '' : 's'}</div>
        {!isMine && (
          <motion.button whileTap={{ scale: 0.85 }} className={`icon-btn ${saved ? 'is-active' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save'} onClick={() => toggleSave.mutate({ ownerId, recipeId: r.id, saved })}>
            <Icon name="bookmark" size={15} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

const CATEGORY_GLYPH = {
  wash: '<path d="M12 3C12 3 6 10 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 10 12 3 12 3Z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/>',
  metallic: '<path d="M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z"/>',
  primer: '<circle cx="12" cy="7" r="2.4"/><circle cx="7" cy="16" r="2.4"/><circle cx="17" cy="16" r="2.4"/>',
};
function TypeBadge({ type }) {
  const glyph = CATEGORY_GLYPH[paintCategory(type)];
  return glyph ? <span className="paint-type-badge"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" dangerouslySetInnerHTML={{ __html: glyph }} /></span> : null;
}

// The quiet half of the feed -- a paint rating or note is ambient community
// activity, not a "post," so it's a small muted row rather than competing
// with recipe cards for attention. Deferred: this doesn't link to Similar
// Colours yet (still a later Placeholder) -- routes there regardless, same
// as Profile's note rows, so it starts working once that page exists.
function FeedPaintCard({ item }) {
  const navigate = useNavigate();
  const { data: ratingSummary = [] } = usePaintRatingSummary();
  const { data: savedPaintKeys = [] } = useSavedPaintKeys();
  const p = item.paint;
  const summary = ratingSummary.find((s) => s.paintKey === paintKey(p.name, p.brand));
  const saved = savedPaintKeys.includes(paintKey(p.name, p.brand));
  const author = item.author;
  const tag = item.type === 'paint_rating' ? 'Rating' : 'Note';
  const preview = item.type === 'paint_rating' ? `Rated it ${item.stars}★` : `“${item.body}”`;

  return (
    <div className="feed-card-minor" style={{ cursor: 'pointer' }} onClick={() => navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand)}`)}>
      <div className="feed-card-minor__swatch" style={{ background: p.hex }}><TypeBadge type={p.type} /></div>
      <div className="feed-card-minor__body">
        <div className="feed-card-minor__meta">
          <Avatar displayName={author?.displayName} url={author?.avatarUrl} size={14} />
          <span className="feed-card-minor__author">{author?.displayName || 'Someone'}</span>
          <span className="feed-card-minor__tag">{tag}</span>
          <span className="feed-card__dot">·</span>
          <span className="feed-card__time">{relativeTime(item.at)}</span>
        </div>
        <div className="feed-card-minor__title">{p.name} <span className="feed-card__brand">{p.brand}</span> — {preview}</div>
      </div>
      <div className="feed-card-minor__rating">
        {summary && <>★{Number(summary.avgStars).toFixed(1)}</>}
        {saved && <span className="recipe-card__saved" title="Saved"><Icon name="bookmark" size={11} /></span>}
      </div>
    </div>
  );
}

function SuggestedPaintersRail() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: suggested, isLoading } = useSuggestedProfiles();
  const { data: followingIds = [] } = useMyFollowingIds();
  const toggleFollow = useToggleFollow();

  const exclude = new Set([userId, ...followingIds]);
  const list = (suggested || []).filter((p) => !exclude.has(p.userId)).slice(0, 6);

  return (
    <>
      <div className="section-label">Suggested Painters</div>
      {isLoading ? (
        <div className="empty-state__sub">Loading…</div>
      ) : list.length ? (
        list.map((p) => (
          <div key={p.userId} className="settings-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate(`/u/${p.userId}`)}>
              <Avatar displayName={p.displayName} url={p.avatarUrl} size={28} />
              <div className="settings-row__label">{p.displayName}{p.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => toggleFollow.mutate({ profileId: p.userId, following: false })}>Follow</button>
          </div>
        ))
      ) : (
        <div className="empty-state__sub">No one else to suggest yet.</div>
      )}
    </>
  );
}

// Ported from the old app's viewHome()/buildFeedItems(). Deferred: the
// once-only new-account avatar nudge (needs "did I just confirm a signup"
// detection, a smaller feature not worth blocking the rest of this batch
// on) and global cross-content search (already deferred from the Recipes
// search page in batch 4).
export default function Home() {
  const { userId } = useAuth();
  const [sort, setSort] = useState('following');
  const activeHobbyId = useActiveHobbyId();

  const { data: myRecipes = [] } = useMyRecipes();
  const { data: sharedRecipes = [] } = useSharedRecipes();
  const { data: feed, isLoading: feedLoading } = useActivityFeed();
  const { data: commentCounts = [] } = useRecipeCommentCounts();
  const { data: voteSummary = [] } = useRecipeVoteSummary();
  const { data: followingIds = [] } = useMyFollowingIds();

  const items = useMemo(() => {
    if (!feed) return [];
    return buildFeedItems({ myRecipes, sharedRecipes, feed, commentCounts, voteSummary, sort, followingIds, activeHobbyId, userId });
  }, [myRecipes, sharedRecipes, feed, commentCounts, voteSummary, sort, followingIds, activeHobbyId, userId]);

  return (
    <div className="page-enter view-wide">
      <div className="home-layout">
        <div className="home-layout__main">
          <div className="page-title">Community Feed</div>
          <div style={{ fontSize: 13, opacity: 0.75, margin: '0 2px 10px' }}>What's happening across Forgebook right now.</div>
          <div className="lib-filter-seg" style={{ marginBottom: 14 }}>
            <button className={sort === 'following' ? 'is-active' : ''} onClick={() => setSort('following')}>Following</button>
            <button className={sort === 'popular' ? 'is-active' : ''} onClick={() => setSort('popular')}>Popular</button>
            <button className={sort === 'new' ? 'is-active' : ''} onClick={() => setSort('new')}>New</button>
          </div>
          {feedLoading ? (
            <div className="empty-state__sub">Loading…</div>
          ) : items.length ? (
            items.map((it, i) => (
              <div key={i}>
                {it.type === 'recipe_published' ? <FeedRecipeCard item={it} kind="published" myId={userId} commentCounts={commentCounts} />
                  : it.type === 'recipe_comments' ? <FeedRecipeCard item={it} kind="comments" myId={userId} commentCounts={commentCounts} />
                  : <FeedPaintCard item={it} />}
              </div>
            ))
          ) : sort === 'following' ? (
            <EmptyState icon="book" title="Follow some painters" sub="Nothing from people you follow yet -- check Popular or New to find some." />
          ) : (
            <EmptyState icon="book" title="Nothing yet" sub="Publish a recipe, or leave a note or rating, to get the community feed moving." />
          )}
        </div>
        <div className="home-layout__rail">
          <SuggestedPaintersRail />
        </div>
      </div>
    </div>
  );
}
