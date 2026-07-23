import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import HobbyStageStack from '../components/HobbyStageStack.jsx';
import { faction } from '../data/factions.js';
import { PAINT_LIBRARY, paintKey } from '../data/paints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useActiveHobbyId, useActiveHobby } from '../hooks/useActiveHobby.js';
import { useMyRecipes, useSharedRecipes, useSavedRecipes } from '../queries/useRecipes.js';
import { useSavedPaintKeys } from '../queries/usePaints.js';
import { useViewedProfile, useMyFollowingIds, useToggleFollow } from '../queries/useSocial.js';
import { useMyHobbyLog } from '../queries/useHobbyLog.js';
import { useReport } from '../report/ReportContext.jsx';
import { useReportContent } from '../queries/useReports.js';
import { useToast } from '../toast/ToastContext.jsx';

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

function SectionLabel({ label, count, kind, profileId }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="section-label" style={{ flex: 1 }}>{label}</div>
      {count > 4 && <button type="button" className="section-see-all" onClick={() => navigate(`/u/${profileId}/section/${kind}`)}>See all ({count})</button>}
    </div>
  );
}

function NoteRow({ n }) {
  const navigate = useNavigate();
  const paint = paintFromKey(n.paintKey);
  return (
    <div className="comment-row">
      <div className="comment-row__meta">
        {paint
          ? <span className="comment-row__author" style={{ cursor: 'pointer' }} onClick={() => navigate(`/similar/${encodeURIComponent(paint.name)}/${encodeURIComponent(paint.brand)}`)}>{paint.name}</span>
          : <span className="comment-row__author">Unknown paint</span>}
      </div>
      <div className="comment-row__body">{n.body}</div>
    </div>
  );
}

function RatingRow({ r }) {
  const paint = paintFromKey(r.paintKey);
  return (
    <div className="settings-row">
      <div>
        <div className="settings-row__label">{paint ? paint.name : 'Unknown paint'}</div>
        <div className="settings-row__desc">{paint ? paint.brand : ''}</div>
      </div>
      <StarRow value={r.stars} />
    </div>
  );
}

function HobbyLogRow({ entry }) {
  const navigate = useNavigate();
  const f = entry.factionId ? faction(entry.factionId) : null;
  return (
    <div className="hobbylog-card" onClick={() => navigate('/hobby-log')}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')` } : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span></div>
        <HobbyStageStack stageCounts={entry.stageCounts} quantity={entry.quantity} />
        <div className="hobbylog-card__meta">
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
        </div>
      </div>
    </div>
  );
}

function SavedPaintRow({ p }) {
  const navigate = useNavigate();
  return (
    <div className="paint-lib-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand || '')}`)}>
      <div className="paint-row__swatch" style={{ background: p.hex }} />
      <div>
        <div className="paint-row__name">{p.name}</div>
        <div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div>
      </div>
    </div>
  );
}

// "Continue Painting" + "Your Armies" -- lifted from the old Home tab (now
// the community activity feed) since this personal-workspace convenience
// needed a new home once Home stopped being personal; only ever rendered
// on your own Profile. Deferred: the old app's device-local "recents" list
// (most-recently-*viewed*, not just edited) -- most-recently-updated own
// recipe is a reasonable stand-in until that's worth porting separately.
function PersonalWorkspace({ recipes }) {
  const navigate = useNavigate();
  const activeHobbyId = useActiveHobbyId();
  const hobby = useActiveHobby();
  const cont = [...recipes].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
  const inHobby = recipes.filter((r) => (r.hobbyId || 'warhammer') === activeHobbyId);
  const armies = [...new Set(inHobby.map((r) => r.faction))];

  return (
    <>
      {cont && (
        <>
          <div className="section-label">Continue Painting</div>
          <div className="continue-card" style={{ '--faction-color': faction(cont.faction).color }} onClick={() => navigate(`/recipe/${cont.id}`)}>
            <div className={`continue-card__hero ${cont.photo ? 'has-photo' : ''}`} style={cont.photo ? { backgroundImage: `url('${cont.photo}')`, backgroundPosition: `${(cont.photoFocalX ?? 0.5) * 100}% ${(cont.photoFocalY ?? 0.5) * 100}%` } : {}}>
              {!cont.photo && <span className="emblem-badge emblem-badge--md"><EmblemSvg emblemKey={faction(cont.faction).emblem} size={24} /></span>}
            </div>
            <div className="continue-card__body">
              <div className="continue-card__eyebrow">{faction(cont.faction).label}{cont.unit ? ` · ${cont.unit}` : ''}</div>
              <div className="continue-card__title">{cont.name}</div>
            </div>
            <div className="continue-card__chevron"><Icon name="chevron" size={20} /></div>
          </div>
        </>
      )}

      <div className="section-label">Your {hobby.groupLabelPlural}</div>
      {armies.length ? (
        <div className="faction-row">
          {armies.map((id) => {
            const f = faction(id);
            const n = inHobby.filter((r) => r.faction === id).length;
            return (
              <div key={id} className="faction-chip" style={{ '--chip-color': f.color }} onClick={() => navigate(`/faction/${f.id}`)}>
                <span className="faction-chip__emblem" style={{ color: f.color }}><EmblemSvg emblemKey={f.emblem} size={15} /></span>
                {f.label} <span className="faction-chip__count">{n}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state__sub" style={{ padding: '0 2px 8px' }}>No recipes yet. Tap {hobby.browseTitle} to pick a {hobby.groupLabel.toLowerCase()}.</div>
      )}
    </>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const isMe = id === userId;
  const showToast = useToast();
  const report = useReport();
  const reportContent = useReportContent();

  const { data: viewedProfile, isLoading } = useViewedProfile(id);
  const { data: myRecipes = [] } = useMyRecipes();
  const { data: sharedRecipes = [] } = useSharedRecipes();
  const { data: savedRecipes = [] } = useSavedRecipes();
  const { data: savedPaintKeys = [] } = useSavedPaintKeys();
  const { data: followingIds = [] } = useMyFollowingIds();
  const toggleFollow = useToggleFollow();
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
  const isFollowing = followingIds.includes(id);

  const doReportPhoto = async () => {
    const reason = await report('photo');
    if (reason === null) return;
    try {
      const res = await reportContent.mutateAsync({ contentType: 'avatar_photo', contentId: id, reason });
      showToast(res.alreadyReported ? "You've already reported this" : 'Reported — thanks for flagging this');
    } catch (err) {
      showToast(err.message || "Couldn't send that report — try again.");
    }
  };

  return (
    <div className="page-enter view-wide">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/home')}><Icon name="back" size={18} /></button>
        {isMe ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => navigate('/hobby-log')} aria-label="Pile of Potential"><Icon name="clipboard-check" size={18} /></button>
            <button className="icon-btn" onClick={() => navigate('/settings')}><Icon name="settings" size={18} /></button>
          </div>
        ) : <div style={{ width: 36 }} />}
      </div>

      <div className="profile-layout">
        <div className="profile-layout__side">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Avatar displayName={viewedProfile.displayName} url={viewedProfile.avatarUrl} size={56} />
              {!isMe && viewedProfile.avatarUrl && (
                <button type="button" className="report-photo-btn" style={{ top: -4, right: -4, width: 22, height: 22 }} aria-label="Report photo" title="Report photo" onClick={doReportPhoto}>
                  <Icon name="flag" size={11} />
                </button>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="detail-title">{viewedProfile.displayName}{viewedProfile.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</div>
              <div className="detail-sub">
                {recipes.length} recipe{recipes.length === 1 ? '' : 's'}{isMe ? '' : ' shared'} ·{' '}
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/u/${id}/section/followers`)}>{viewedProfile.followerIds.length} follower{viewedProfile.followerIds.length === 1 ? '' : 's'}</span> ·{' '}
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/u/${id}/section/following`)}>{viewedProfile.followingIds.length} following</span>
              </div>
            </div>
            {!isMe && (
              <button className={`btn ${isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => toggleFollow.mutate({ profileId: id, following: isFollowing })}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {isMe && <PersonalWorkspace recipes={recipes} />}
        </div>

        <div className="profile-layout__main">
          <SectionLabel label={isMe ? 'Your Recipes' : 'Published Recipes'} count={recipes.length} kind="recipes" profileId={id} />
          {recipes.length
            ? <div className="recipe-grid">{recipes.slice(0, 4).map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
            : <EmptyState icon="book" title="No recipes yet" sub={isMe ? 'Tap the + button to record your first paint recipe.' : 'Nothing published so far.'} />}

          <SectionLabel label="Notes Written" count={viewedProfile.notes.length} kind="notes" profileId={id} />
          {viewedProfile.notes.length ? viewedProfile.notes.slice(0, 4).map((n) => <NoteRow key={n.id} n={n} />) : <div className="empty-state__sub">No community notes yet.</div>}

          <SectionLabel label="Ratings Given" count={viewedProfile.ratings.length} kind="ratings" profileId={id} />
          {viewedProfile.ratings.length
            ? <div className="profile-ratings-grid">{viewedProfile.ratings.slice(0, 4).map((r) => <RatingRow key={r.paintKey} r={r} />)}</div>
            : <div className="empty-state__sub">No ratings yet.</div>}

          <SectionLabel label={isMe ? 'Pile of Potential' : 'Public Pile of Potential'} count={(isMe ? myHobbyLog : viewedProfile.hobbyLog).length} kind="hobby-log" profileId={id} />
          {(isMe ? myHobbyLog : viewedProfile.hobbyLog).length
            ? <div className="hobbylog-list">{(isMe ? myHobbyLog : viewedProfile.hobbyLog).slice(0, 4).map((e) => <HobbyLogRow key={e.id} entry={e} />)}</div>
            : <div className="empty-state__sub">{isMe ? 'Nothing logged yet — tap the paint drop above to start.' : 'Nothing public yet.'}</div>}

          {isMe && (
            <>
              <SectionLabel label="Saved Recipes" count={savedRecipeObjs.length} kind="saved-recipes" profileId={id} />
              {savedRecipeObjs.length
                ? <div className="recipe-grid">{savedRecipeObjs.slice(0, 4).map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
                : <div className="empty-state__sub">Nothing saved yet.</div>}

              <SectionLabel label="Saved Paints" count={savedPaintObjs.length} kind="saved-paints" profileId={id} />
              {savedPaintObjs.length ? savedPaintObjs.slice(0, 4).map((p) => <SavedPaintRow key={paintKey(p.name, p.brand)} p={p} />) : <div className="empty-state__sub">Nothing saved yet.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
