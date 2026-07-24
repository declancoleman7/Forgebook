import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import HobbyStageStack from '../components/HobbyStageStack.jsx';
import { faction } from '../data/factions.js';
import { PAINT_LIBRARY, paintKey } from '../data/paints.js';
import { championTier } from '../data/championScore.js';
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

// The shared row shape Notes and Ratings now both render through, instead
// of the comment-row vs settings-row split they used to get -- a note and a
// rating are both "a small thing you left somewhere," so they should look
// like the same kind of thing.
function ActivityRow({ icon, title, meta, trailing }) {
  return (
    <div className="profile-activity-row">
      <div className={`profile-activity-row__icon is-${icon}`}>
        {icon === 'note' ? <Icon name="comment" size={14} /> : <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d={STAR_PATH} /></svg>}
      </div>
      <div className="profile-activity-row__body">
        <div className="profile-activity-row__title">{title}</div>
        {meta && <div className="profile-activity-row__meta">{meta}</div>}
      </div>
      {trailing && <div className="profile-activity-row__trailing">{trailing}</div>}
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

// A sub-heading inside a tab pane, with the same "See all" escape hatch the
// old per-section labels used, just at a slightly higher preview cap --
// tabs give this content the whole page instead of a cramped 4-item strip,
// so there's room to actually show a handful before asking to go further.
function TabGroupHeader({ label, count, kind, profileId }) {
  const navigate = useNavigate();
  return (
    <div className="profile-group-head">
      <div className="profile-group-head__label">{label}</div>
      {count > 6 && <button type="button" className="section-see-all" onClick={() => navigate(`/u/${profileId}/section/${kind}`)}>See all ({count})</button>}
    </div>
  );
}

// A community-contribution score built entirely from data that's already
// public about this profile (published recipes, visible comments, likes on
// both) -- see data/championScore.js for the weighting. It reads as just
// another stat next to followers/following/recipes, and the tier sits as a
// badge beside the name -- not a separate box bolted on below, which is
// where this used to live.
function ProfileHero({ profile, isMe, id, recipesCount, isFollowing, onToggleFollow, onReportPhoto, navigate }) {
  return (
    <div className="profile-hero">
      <div className="profile-hero__avatarwrap">
        <Avatar displayName={profile.displayName} url={profile.avatarUrl} size={64} />
        {!isMe && profile.avatarUrl && (
          <button type="button" className="report-photo-btn" aria-label="Report photo" title="Report photo" onClick={onReportPhoto}>
            <Icon name="flag" size={11} />
          </button>
        )}
      </div>
      <div className="profile-hero__identity">
        <div className="profile-hero__name-row">
          <span className="profile-hero__name">{profile.displayName}</span>
          {profile.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}
          <span className="profile-tier">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
            {championTier(profile.championScore)}
          </span>
        </div>
        <div className="profile-stat-strip">
          <div className="profile-stat is-link" onClick={() => navigate(`/u/${id}/section/followers`)}>
            <b>{profile.followerIds.length}</b><span>Follower{profile.followerIds.length === 1 ? '' : 's'}</span>
          </div>
          <div className="profile-stat is-link" onClick={() => navigate(`/u/${id}/section/following`)}>
            <b>{profile.followingIds.length}</b><span>Following</span>
          </div>
          <div className="profile-stat"><b>{recipesCount}</b><span>Recipes</span></div>
          <div className="profile-stat"><b className="is-score">{profile.championScore}</b><span>Score</span></div>
        </div>
        {profile.modelsOwned > 0 && (
          <div className="profile-hero__models">{profile.modelsCompleted} of {profile.modelsOwned} models finished</div>
        )}
      </div>
      {!isMe && (
        <button className={`btn ${isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={onToggleFollow}>
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
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

const PREVIEW_LIMIT = 6;

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const isMe = id === userId;
  const showToast = useToast();
  const report = useReport();
  const reportContent = useReportContent();
  const [tab, setTab] = useState('recipes');

  const { data: viewedProfile, isLoading } = useViewedProfile(id);
  const { data: myRecipes = [] } = useMyRecipes();
  const { data: sharedRecipes = [] } = useSharedRecipes();
  const { data: savedRecipes = [] } = useSavedRecipes();
  const { data: savedPaintKeys = [] } = useSavedPaintKeys();
  const { data: followingIds = [] } = useMyFollowingIds();
  const toggleFollow = useToggleFollow();
  const { data: myHobbyLog = [] } = useMyHobbyLog();

  if (isLoading) return <div className="empty-state__sub">Loading…</div>;
  if (!viewedProfile) return <EmptyState icon="search" title="Painter not found" sub="This profile doesn't exist, or has no published work yet." />;

  const recipes = isMe ? myRecipes : viewedProfile.recipes;
  const isFollowing = followingIds.includes(id);
  const pileEntries = isMe ? myHobbyLog : viewedProfile.hobbyLog;
  const savedRecipeObjs = isMe
    ? savedRecipes.map((s) => (s.recipeOwnerId === userId ? myRecipes.find((r) => r.id === s.recipeId) : sharedRecipes.find((r) => r.authorId === s.recipeOwnerId && r.id === s.recipeId))).filter(Boolean)
    : [];
  const savedPaintObjs = isMe ? savedPaintKeys.map(paintFromKey).filter(Boolean) : [];

  const TABS = [
    { id: 'recipes', label: 'Recipes', count: recipes.length },
    { id: 'activity', label: 'Activity', count: viewedProfile.notes.length + viewedProfile.ratings.length },
    { id: 'pile', label: 'Pile', title: isMe ? 'Pile of Potential' : 'Public Pile of Potential', count: pileEntries.length },
  ];
  if (isMe) TABS.push({ id: 'collection', label: 'Collection', count: savedRecipeObjs.length + savedPaintObjs.length });

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

      <ProfileHero
        profile={viewedProfile}
        isMe={isMe}
        id={id}
        recipesCount={recipes.length}
        isFollowing={isFollowing}
        onToggleFollow={() => toggleFollow.mutate({ profileId: id, following: isFollowing })}
        onReportPhoto={doReportPhoto}
        navigate={navigate}
      />

      {isMe && <PersonalWorkspace recipes={recipes} />}

      <div className="profile-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'is-active' : ''} title={t.title} onClick={() => setTab(t.id)}>
            {t.label} <span className="n">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="profile-pane">
        {tab === 'recipes' && (
          recipes.length
            ? <div className="recipe-grid">{recipes.slice(0, PREVIEW_LIMIT).map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
            : <EmptyState icon="book" title="No recipes yet" sub={isMe ? 'Tap the + button to record your first paint recipe.' : 'Nothing published so far.'} />
        )}
        {recipes.length > PREVIEW_LIMIT && tab === 'recipes' && (
          <button type="button" className="section-see-all" style={{ marginTop: 10 }} onClick={() => navigate(`/u/${id}/section/recipes`)}>See all ({recipes.length})</button>
        )}

        {tab === 'activity' && (
          <>
            <TabGroupHeader label="Notes Written" count={viewedProfile.notes.length} kind="notes" profileId={id} />
            {viewedProfile.notes.length
              ? viewedProfile.notes.slice(0, PREVIEW_LIMIT).map((n) => {
                const paint = paintFromKey(n.paintKey);
                return (
                  <ActivityRow
                    key={n.id}
                    icon="note"
                    title={<>Note on <b>{paint ? paint.name : 'Unknown paint'}</b>{paint?.brand && <span className="profile-activity-row__inline-meta"> · {paint.brand}</span>}</>}
                    meta={`"${n.body}"`}
                  />
                );
              })
              : <div className="empty-state__sub">No community notes yet.</div>}

            <TabGroupHeader label="Ratings Given" count={viewedProfile.ratings.length} kind="ratings" profileId={id} />
            {viewedProfile.ratings.length
              ? viewedProfile.ratings.slice(0, PREVIEW_LIMIT).map((r) => {
                const paint = paintFromKey(r.paintKey);
                return (
                  <ActivityRow
                    key={r.paintKey}
                    icon="rating"
                    title={<>Rated <b>{paint ? paint.name : 'Unknown paint'}</b>{paint?.brand && <span className="profile-activity-row__inline-meta"> · {paint.brand}</span>}</>}
                    meta={<StarRow value={r.stars} />}
                  />
                );
              })
              : <div className="empty-state__sub">No ratings yet.</div>}
          </>
        )}

        {tab === 'pile' && (
          pileEntries.length
            ? (
              <>
                <div className="hobbylog-list">{pileEntries.slice(0, PREVIEW_LIMIT).map((e) => <HobbyLogRow key={e.id} entry={e} />)}</div>
                {pileEntries.length > PREVIEW_LIMIT && (
                  <button type="button" className="section-see-all" style={{ marginTop: 10 }} onClick={() => navigate(`/u/${id}/section/hobby-log`)}>See all ({pileEntries.length})</button>
                )}
              </>
            )
            : <div className="empty-state__sub">{isMe ? 'Nothing logged yet — tap the paint drop above to start.' : 'Nothing public yet.'}</div>
        )}

        {tab === 'collection' && isMe && (
          <>
            <TabGroupHeader label="Saved Recipes" count={savedRecipeObjs.length} kind="saved-recipes" profileId={id} />
            {savedRecipeObjs.length
              ? <div className="recipe-grid">{savedRecipeObjs.slice(0, PREVIEW_LIMIT).map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
              : <div className="empty-state__sub">Nothing saved yet.</div>}

            <TabGroupHeader label="Saved Paints" count={savedPaintObjs.length} kind="saved-paints" profileId={id} />
            {savedPaintObjs.length
              ? savedPaintObjs.slice(0, PREVIEW_LIMIT).map((p) => <SavedPaintRow key={paintKey(p.name, p.brand)} p={p} />)
              : <div className="empty-state__sub">Nothing saved yet.</div>}
          </>
        )}
      </div>
    </div>
  );
}
