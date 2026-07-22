import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { PAINT_LIBRARY, paintKey } from '../data/paints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useMyRecipes, useSharedRecipes, useSavedRecipes } from '../queries/useRecipes.js';
import { useSavedPaintKeys } from '../queries/usePaints.js';
import { useViewedProfile } from '../queries/useSocial.js';
import { useMyHobbyLog } from '../queries/useHobbyLog.js';
import { faction } from '../data/factions.js';

const HOBBYLOG_STATUS_LABEL = { owned: 'Owned', built: 'Built', primed: 'Primed', wip: 'Work in Progress', completed: 'Complete' };
function HobbyLogSectionRow({ entry, navigate }) {
  const f = entry.factionId ? faction(entry.factionId) : null;
  return (
    <div className="hobbylog-card" onClick={() => navigate('/hobby-log')}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')` } : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title}</div>
        <div className="hobbylog-card__meta">
          <span className={`hobbylog-status hobbylog-status--${entry.status}`}>{HOBBYLOG_STATUS_LABEL[entry.status]}</span>
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
        </div>
      </div>
    </div>
  );
}

const STAR_PATH = 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2z';
function StarRow({ value, size = 14 }) {
  return (
    <span className="star-row">
      {[5, 4, 3, 2, 1].map((n) => (
        <span key={n} className={`star-row__star ${value != null && n <= Math.round(value) ? 'is-filled' : ''}`}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d={STAR_PATH} /></svg>
        </span>
      ))}
    </span>
  );
}
function paintFromKey(key) {
  return PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === key) || null;
}

// The "See all" destination for any Profile section that only shows its
// first 4 items inline -- shares the exact same list-computation as
// Profile.jsx so the two can never drift out of sync on what counts as
// "in" a section for the same profile.
export default function ProfileSection() {
  const { id, kind } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const isMe = id === userId;

  const { data: viewedProfile, isLoading } = useViewedProfile(id);
  const { data: myRecipes = [] } = useMyRecipes();
  const { data: sharedRecipes = [] } = useSharedRecipes();
  const { data: savedRecipes = [] } = useSavedRecipes();
  const { data: savedPaintKeys = [] } = useSavedPaintKeys();
  const { data: myHobbyLog = [] } = useMyHobbyLog();

  const savedRecipeObjs = useMemo(() => {
    if (!isMe) return [];
    return savedRecipes.map((s) => {
      if (s.recipeOwnerId === userId) return myRecipes.find((r) => r.id === s.recipeId);
      return sharedRecipes.find((r) => r.authorId === s.recipeOwnerId && r.id === s.recipeId);
    }).filter(Boolean);
  }, [isMe, savedRecipes, myRecipes, sharedRecipes, userId]);
  const savedPaintObjs = useMemo(() => (isMe ? savedPaintKeys.map(paintFromKey).filter(Boolean) : []), [isMe, savedPaintKeys]);

  if (isLoading) return <div className="empty-state__sub">Loading…</div>;
  if (!viewedProfile) return <EmptyState icon="search" title="Painter not found" sub="This profile doesn't exist, or has no published work yet." />;

  const recipes = isMe ? myRecipes : viewedProfile.recipes;

  const sections = {
    recipes: {
      label: isMe ? 'Your Recipes' : 'Published Recipes',
      items: recipes,
      body: (items) => <div className="recipe-grid">{items.map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>,
      empty: <EmptyState icon="book" title="No recipes yet" sub={isMe ? 'Tap the + button to record your first paint recipe.' : 'Nothing published so far.'} />,
    },
    notes: {
      label: 'Notes Written',
      items: viewedProfile.notes,
      body: (items) => items.map((n) => {
        const paint = paintFromKey(n.paintKey);
        return (
          <div key={n.id} className="comment-row">
            <div className="comment-row__meta">
              {paint
                ? <span className="comment-row__author" style={{ cursor: 'pointer' }} onClick={() => navigate(`/similar/${encodeURIComponent(paint.name)}/${encodeURIComponent(paint.brand)}`)}>{paint.name}</span>
                : <span className="comment-row__author">Unknown paint</span>}
            </div>
            <div className="comment-row__body">{n.body}</div>
          </div>
        );
      }),
      empty: <div className="empty-state__sub">No community notes yet.</div>,
    },
    ratings: {
      label: 'Ratings Given',
      items: viewedProfile.ratings,
      body: (items) => <div className="profile-ratings-grid">{items.map((r) => {
        const paint = paintFromKey(r.paintKey);
        return (
          <div key={r.paintKey} className="settings-row">
            <div><div className="settings-row__label">{paint ? paint.name : 'Unknown paint'}</div><div className="settings-row__desc">{paint ? paint.brand : ''}</div></div>
            <StarRow value={r.stars} />
          </div>
        );
      })}</div>,
      empty: <div className="empty-state__sub">No ratings yet.</div>,
    },
    'saved-recipes': {
      label: 'Saved Recipes',
      items: savedRecipeObjs,
      body: (items) => <div className="recipe-grid">{items.map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>,
      empty: <div className="empty-state__sub">Nothing saved yet.</div>,
    },
    'saved-paints': {
      label: 'Saved Paints',
      items: savedPaintObjs,
      body: (items) => items.map((p) => (
        <div key={paintKey(p.name, p.brand)} className="paint-lib-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand || '')}`)}>
          <div className="paint-row__swatch" style={{ background: p.hex }} />
          <div><div className="paint-row__name">{p.name}</div><div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div></div>
        </div>
      )),
      empty: <div className="empty-state__sub">Nothing saved yet.</div>,
    },
    followers: {
      label: 'Followers',
      items: viewedProfile.followerObjs,
      body: (items) => items.map((p) => (
        <div key={p.userId} className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${p.userId}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar displayName={p.displayName} url={p.avatarUrl} size={28} />
            <div className="settings-row__label">{p.displayName}{p.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</div>
          </div>
        </div>
      )),
      empty: <div className="empty-state__sub">No followers yet.</div>,
    },
    'hobby-log': {
      label: isMe ? 'Hobby Log' : 'Public Hobby Log',
      items: isMe ? myHobbyLog : viewedProfile.hobbyLog,
      body: (items) => <div className="hobbylog-list">{items.map((e) => <HobbyLogSectionRow key={e.id} entry={e} navigate={navigate} />)}</div>,
      empty: <div className="empty-state__sub">{isMe ? 'Nothing logged yet.' : 'Nothing public yet.'}</div>,
    },
    following: {
      label: 'Following',
      items: viewedProfile.followingObjs,
      body: (items) => items.map((p) => (
        <div key={p.userId} className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${p.userId}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar displayName={p.displayName} url={p.avatarUrl} size={28} />
            <div className="settings-row__label">{p.displayName}{p.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</div>
          </div>
        </div>
      )),
      empty: <div className="empty-state__sub">Not following anyone yet.</div>,
    },
  };
  const section = sections[kind];

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate(`/u/${id}`)}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{section ? section.label : ''}</div>
        <div style={{ width: 36 }} />
      </div>
      {section ? (section.items.length ? section.body(section.items) : section.empty) : null}
    </div>
  );
}
