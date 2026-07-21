import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import EmptyState from '../components/EmptyState.jsx';
import CommentThread from '../components/CommentThread.jsx';
import { faction } from '../data/factions.js';
import { paintKey, paintCategory } from '../data/paints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useFindRecipe, useDeleteRecipe, useRecipeVoteSummary, useMyRecipeVotes, useVoteRecipe, useSavedRecipes, useToggleSaveRecipe } from '../queries/useRecipes.js';
import { useMyPaints, useSharedPaints, useWantToBuy, useToggleWanted, useAddPaintToRack } from '../queries/usePaints.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

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

function estimatedMinutes(r) {
  const steps = (r.steps || []).length;
  if (!steps) return 0;
  return Math.max(5, Math.round((steps * 12) / 5) * 5);
}
function formatDuration(mins) {
  if (!mins) return '—';
  if (mins < 60) return `~${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}
function groupStepsByArea(steps) {
  const groups = [];
  (steps || []).forEach((s, i) => {
    const area = (s.area || '').trim();
    const last = groups[groups.length - 1];
    if (last && last.area === area) last.items.push({ step: s, num: i + 1 });
    else groups.push({ area, items: [{ step: s, num: i + 1 }] });
  });
  return groups;
}

// VoteWidget -- ported from recipeVoteWidgetHtml(). Uses the same
// useMutation onMutate/onError optimistic pattern the old app hand-rolled
// as voteOnRecipe()/adjustRecipeVoteSummary().
function VoteWidget({ recipe, ownerId }) {
  const { userId } = useAuth();
  const { data: voteSummary } = useRecipeVoteSummary();
  const { data: myVotes } = useMyRecipeVotes();
  const { data: savedRecipes } = useSavedRecipes();
  const voteRecipe = useVoteRecipe();
  const toggleSave = useToggleSaveRecipe();

  const isOwn = ownerId === userId;
  const summary = voteSummary?.find((v) => v.recipeOwnerId === ownerId && v.recipeId === recipe.id);
  const net = summary ? summary.likeCount - summary.dislikeCount : 0;
  const mine = myVotes?.find((v) => v.recipeOwnerId === ownerId && v.recipeId === recipe.id)?.value ?? null;
  const saved = savedRecipes?.some((s) => s.recipeOwnerId === ownerId && s.recipeId === recipe.id);

  const cast = (value) => voteRecipe.mutate({ ownerId, recipeId: recipe.id, value, retract: mine === value });

  return (
    <div className="vote-widget">
      <div className="vote-widget__votes">
        {isOwn ? (
          <span className="vote-widget__net-group"><Icon name="thumb-up" size={14} /><span className="vote-widget__net">{net}</span></span>
        ) : (
          <>
            <button className={`vote-widget__btn ${mine === 1 ? 'is-active' : ''}`} aria-label="Like" onClick={() => cast(1)}><Icon name="thumb-up" size={16} /></button>
            <span className="vote-widget__net">{net}</span>
            <button className={`vote-widget__btn ${mine === -1 ? 'is-active' : ''}`} aria-label="Dislike" onClick={() => cast(-1)}><Icon name="thumb-down" size={16} /></button>
          </>
        )}
      </div>
      <span className="vote-widget__divider" />
      <button className={`vote-widget__save ${saved ? 'is-active' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save this recipe'} title={saved ? 'Saved' : 'Save'}
        onClick={() => toggleSave.mutate({ ownerId, recipeId: recipe.id, saved })}>
        <Icon name="bookmark" size={17} />
      </button>
    </div>
  );
}

export default function RecipeDetail() {
  const { id, authorId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showToast = useToast();
  const { userId } = useAuth();
  const r = useFindRecipe(id, authorId);
  const deleteRecipe = useDeleteRecipe();
  const { data: myPaints } = useMyPaints();
  const { data: sharedPaints } = useSharedPaints(authorId ? [authorId] : []);
  const { data: wantedKeys } = useWantToBuy();
  const toggleWanted = useToggleWanted();
  const addToRack = useAddPaintToRack();

  if (!r) return <EmptyState icon="search" title="Recipe not found" sub="It may have been deleted." />;

  const isShared = !!r.authorId;
  const f = faction(r.faction);
  const ownerId = r.authorId || userId;

  const resolveStepPaint = (step, field) => {
    const pid = step[field];
    if (pid) {
      const pool = isShared ? sharedPaints : myPaints;
      return pool?.find((p) => p.id === pid) || null;
    }
    const want = step[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
    if (!want) return null;
    const owned = myPaints?.find((p) => paintKey(p.name, p.brand) === paintKey(want.name, want.brand));
    if (owned) return owned;
    return { ...want, isWant: true };
  };

  const paints = (() => {
    const seen = new Set();
    const out = [];
    (r.steps || []).forEach((s) => {
      ['paintId', 'mixPaintId'].forEach((field) => {
        const want = s[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
        const key = s[field] || (want && 'want:' + paintKey(want.name, want.brand));
        if (!key || seen.has(key)) return;
        const p = resolveStepPaint(s, field);
        if (p) { seen.add(key); out.push(p); }
      });
    });
    return out;
  })();

  const doDelete = async () => {
    if (await confirm('Delete this recipe? This cannot be undone.')) {
      await deleteRecipe.mutateAsync(r.id);
      showToast('Recipe deleted');
      navigate('/recipes');
    }
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/recipes')}><Icon name="back" size={18} /></button>
        {!isShared && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => navigate(`/recipe/${r.id}/edit`)}><Icon name="edit" size={16} /></button>
            <button className="icon-btn" onClick={doDelete}><Icon name="trash" size={16} /></button>
          </div>
        )}
      </div>

      <div className={`detail-hero ${r.photo ? 'has-photo' : ''}`} style={{ '--faction-color': f.color, ...(r.photo ? { backgroundImage: `url('${r.photo}')` } : {}) }}>
        {!r.photo && <span className="emblem-badge emblem-badge--xl"><EmblemSvg emblemKey={f.emblem} size={40} /></span>}
      </div>

      <div className="detail-crumbs">
        <span onClick={() => navigate(`/faction/${f.id}`)} style={{ color: f.color, cursor: 'pointer' }}>{f.label}</span>
        <span className="sep">/</span>
        <span onClick={() => navigate(`/faction/${f.id}/unit/${r.unit ? encodeURIComponent(r.unit) : '_general'}`)} style={{ cursor: 'pointer' }}>{r.unit || 'General'}</span>
      </div>
      <div className="detail-title">{r.name}</div>
      {isShared && (
        <div className="shared-badge">
          <Avatar displayName={r.author?.displayName} url={r.author?.avatarUrl} size={16} /> Shared by{' '}
          <span onClick={() => navigate(`/u/${r.authorId}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{r.author?.displayName}</span>
        </div>
      )}
      {r.published && <VoteWidget recipe={r} ownerId={ownerId} />}

      <div className="metastrip">
        <div className="metastrip__cell"><div className="metastrip__n">{'●'.repeat(r.difficulty || 1)}{'○'.repeat(5 - (r.difficulty || 1))}</div><div className="metastrip__l">Difficulty</div></div>
        <div className="metastrip__cell"><div className="metastrip__n">{(r.steps || []).length}</div><div className="metastrip__l">Steps</div></div>
        <div className="metastrip__cell"><div className="metastrip__n">{formatDuration(estimatedMinutes(r))}</div><div className="metastrip__l">Est. time</div></div>
      </div>

      <div className="section-label">Paints Used</div>
      <div className="paint-list">
        {paints.length ? paints.map((p, i) => {
          if (!isShared && !p.isWant) {
            return (
              <div key={i} className="paint-row" onClick={() => navigate(`/paint/${p.id}`)}>
                <div className="paint-row__swatch" style={{ background: p.hex }}><TypeBadge type={p.type} /></div>
                <div>
                  <div className="paint-row__name">{p.name}</div>
                  <div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div>
                </div>
                <div className="paint-row__hex">{p.hex}</div>
              </div>
            );
          }
          const owned = p.isWant ? false : myPaints?.some((mp) => paintKey(mp.name, mp.brand) === paintKey(p.name, p.brand));
          const wanted = !owned && wantedKeys?.includes(paintKey(p.name, p.brand));
          return (
            <div key={i} className={`paint-row ${owned ? 'is-owned' : ''}`}>
              <div className="paint-row__swatch" style={{ background: p.hex }}><TypeBadge type={p.type} /></div>
              <div>
                <div className="paint-row__name">{p.name}</div>
                <div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div>
              </div>
              {owned ? (
                <span className="lib-row__ring is-owned" style={{ marginLeft: 'auto' }} title="On your rack"><Icon name="check" size={13} /></span>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button className={`lib-row__flag is-wanted ${wanted ? 'is-on' : ''}`} title={wanted ? 'On your buy list' : 'Add to buy list'}
                    onClick={() => toggleWanted.mutate({ name: p.name, brand: p.brand, wanted })}>
                    <Icon name="cart" size={13} />
                  </button>
                  <button className="lib-row__flag" title="Add straight to rack"
                    onClick={() => addToRack.mutate({ name: p.name, brand: p.brand, hex: p.hex, type: p.type, quantity: 1 })}>
                    <Icon name="plus" size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        }) : <div className="empty-state__sub">No paints listed.</div>}
      </div>

      <div className="section-label">Method</div>
      {(r.steps || []).length ? groupStepsByArea(r.steps).map((g, gi) => (
        <div key={gi}>
          {g.area && <div className="grouphead">{g.area}</div>}
          <div className="layer-stack">
            {g.items.map(({ step: s, num }) => {
              const p = resolveStepPaint(s, 'paintId');
              const mixP = (s.mixPaintId || s.mixWantPaint) ? resolveStepPaint(s, 'mixPaintId') : null;
              const swatchBg = mixP ? `linear-gradient(to bottom, ${p ? p.hex : f.color} 50%, ${mixP.hex} 50%)` : (p ? p.hex : f.color);
              return (
                <div key={s.id || num} className="layer-stack__row">
                  <div className="layer-stack__num">{num}</div>
                  <div className="layer-stack__swatch" style={{ background: swatchBg }} />
                  <div className="layer-stack__content">
                    <div className="layer-stack__top">
                      <span className="layer-stack__technique">{s.technique}</span>
                      <span className="layer-stack__paint">
                        {p ? p.name : '(paint deleted)'}{p?.isWant && <span className="paint-picker__want-tag"> not on rack</span>}
                        {mixP && <> + {mixP.name}{s.mixRatio ? ` (${s.mixRatio})` : ''}{mixP.isWant && <span className="paint-picker__want-tag"> not on rack</span>}</>}
                      </span>
                    </div>
                    {s.notes && <div className="layer-stack__notes">{s.notes}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )) : <div className="empty-state__sub">No steps recorded.</div>}

      {r.notes && <><div className="section-label">Notes</div><div className="notes-block">{r.notes}</div></>}

      {r.published && <CommentThread ownerId={ownerId} recipeId={r.id} />}
    </div>
  );
}
