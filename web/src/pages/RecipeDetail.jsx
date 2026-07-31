import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import EmptyState from '../components/EmptyState.jsx';
import CommentThread from '../components/CommentThread.jsx';
import Lightbox from '../components/Lightbox.jsx';
import HobbyStageStack from '../components/HobbyStageStack.jsx';
import { faction } from '../data/factions.js';
import { paintTypeKey, isWanted, paintCategory } from '../data/paints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useFindRecipe, useDeleteRecipe, usePushRecipe, useRecipeVoteSummary, useMyRecipeVotes, useVoteRecipe, useSavedRecipes, useToggleSaveRecipe } from '../queries/useRecipes.js';
import { useMyPaints, useSharedPaints, useWantToBuy, useToggleWanted, useAddPaintToRack } from '../queries/usePaints.js';
import { useMyHobbyLog } from '../queries/useHobbyLog.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { useReport } from '../report/ReportContext.jsx';
import { useReportContent } from '../queries/useReports.js';
import { estimatedMinutes, formatDuration, slug } from '../utils/format.js';
import { drawShareCardCanvas } from '../utils/shareCard.js';

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
          <span className="vote-widget__net-group"><Icon name="thumb-up" size={14} /><motion.span key={net} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="vote-widget__net">{net}</motion.span></span>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.85 }} className={`vote-widget__btn ${mine === 1 ? 'is-active' : ''}`} aria-label="Like" onClick={() => cast(1)}><Icon name="thumb-up" size={16} /></motion.button>
            <motion.span key={net} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="vote-widget__net">{net}</motion.span>
            <motion.button whileTap={{ scale: 0.85 }} className={`vote-widget__btn ${mine === -1 ? 'is-active' : ''}`} aria-label="Dislike" onClick={() => cast(-1)}><Icon name="thumb-down" size={16} /></motion.button>
          </>
        )}
      </div>
      <span className="vote-widget__divider" />
      <motion.button whileTap={{ scale: 0.85 }} className={`vote-widget__save ${saved ? 'is-active' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save this recipe'} title={saved ? 'Saved' : 'Save'}
        onClick={() => toggleSave.mutate({ ownerId, recipeId: recipe.id, saved })}>
        <Icon name="bookmark" size={17} />
      </motion.button>
    </div>
  );
}

export default function RecipeDetail() {
  const { id, authorId } = useParams();
  const navigate = useNavigate();
  // The paint's own swatch is the "find similar colours" affordance --
  // always, regardless of whether the row itself goes somewhere else on
  // click (an owned paint's row opens its rack detail page instead; see
  // paint-row's own onClick below). stopPropagation keeps a tap on the
  // swatch from also firing that outer click. This was dropped in the
  // React port -- the old app's swatch had the exact same data-action.
  const openSimilar = (e, name, brand) => {
    e.stopPropagation();
    navigate(`/similar/${encodeURIComponent(name)}/${encodeURIComponent(brand || '')}`);
  };
  const confirm = useConfirm();
  const showToast = useToast();
  const report = useReport();
  const reportContent = useReportContent();
  const { userId } = useAuth();
  const r = useFindRecipe(id, authorId);
  const deleteRecipe = useDeleteRecipe();
  const pushRecipe = usePushRecipe();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { data: myPaints } = useMyPaints();
  const { data: sharedPaints } = useSharedPaints(authorId ? [authorId] : []);
  const { data: wantedKeys } = useWantToBuy();
  const toggleWanted = useToggleWanted();
  const addToRack = useAddPaintToRack();
  // A hobby log entry only ever links to the viewer's OWN recipes (see
  // HobbyLog.jsx's EntryForm), so this reverse lookup only ever has
  // anything to show on a recipe you own yourself, never a shared one.
  const { data: myHobbyLog = [] } = useMyHobbyLog();
  // Resolves the "Copy to new recipe" provenance link (see doCopy below) --
  // undefined authorId means "look in my own recipes", same convention this
  // component's own r = useFindRecipe(id, authorId) already uses. Called
  // unconditionally (before the !r early return below) since it's a hook;
  // r?. keeps it safe while the real recipe is still loading. Not found
  // (the original was deleted, or a shared one got unpublished since) just
  // means no link to show -- copiedFromName still shows the attribution
  // text either way, since that's a snapshot taken at copy time, not a
  // live lookup.
  const copiedFromIsOwn = r?.copiedFromOwnerId === userId;
  const copiedFromOriginal = useFindRecipe(r?.copiedFromRecipeId, copiedFromIsOwn ? undefined : r?.copiedFromOwnerId);

  if (!r) return <EmptyState icon="search" title="Recipe not found" sub="It may have been deleted." />;

  const isShared = !!r.authorId;
  const f = faction(r.faction);
  const ownerId = r.authorId || userId;

  // "{ownerId}:{recipeId}" -- a recipe's own id is only unique per-owner,
  // not globally, so the admin queue's report content_id needs both halves
  // to identify one photo unambiguously (see schema.sql's reports.content_id
  // widening comment for why this is a plain composite string, not a
  // separate owner-id column).
  const doReportPhoto = async () => {
    const reason = await report('photo');
    if (reason === null) return;
    try {
      const res = await reportContent.mutateAsync({ contentType: 'recipe_photo', contentId: `${ownerId}:${r.id}`, reason });
      showToast(res.alreadyReported ? "You've already reported this" : 'Reported — thanks for flagging this');
    } catch (err) {
      showToast(err.message || "Couldn't send that report — try again.");
    }
  };

  const resolveStepPaint = (step, field) => {
    const pid = step[field];
    if (pid) {
      const pool = isShared ? sharedPaints : myPaints;
      return pool?.find((p) => p.id === pid) || null;
    }
    const want = step[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
    if (!want) return null;
    const owned = myPaints?.find((p) => paintTypeKey(p.name, p.brand, p.type) === paintTypeKey(want.name, want.brand, want.type));
    if (owned) return owned;
    return { ...want, isWant: true };
  };

  const paints = (() => {
    const seen = new Set();
    const out = [];
    (r.steps || []).forEach((s) => {
      ['paintId', 'mixPaintId'].forEach((field) => {
        const want = s[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
        const key = s[field] || (want && 'want:' + paintTypeKey(want.name, want.brand, want.type));
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

  // Prefills a brand-new recipe from this one -- good for a variant that
  // shares most of its steps with something you (or someone else) already
  // wrote up. Works on a shared recipe too, not just your own: a step
  // there points at the AUTHOR's rack, which means nothing on your own, so
  // it's carried over as a want-snapshot (the same shape the paint picker
  // already writes for a library paint you don't own yet) instead of a
  // paintId that would silently resolve to nothing. The photo is
  // deliberately NOT copied -- a new recipe is a fresh attempt, and
  // (for a shared recipe) it isn't yours to reuse anyway.
  //
  // Handed over via router location state, not state/recipeDraft.js's
  // module-level draft: that module's read-once-and-clear pattern assumes
  // exactly one mount of the destination form, but Layout.jsx's page-
  // transition wrapper (AnimatePresence/motion.div keyed by pathname)
  // genuinely mounts RecipeForm twice for a single navigation here -- the
  // second mount would find the draft already cleared by the first, and
  // silently land on a blank form. location.state isn't consumed on read,
  // so it survives being read on either (or both) mount.
  const doCopy = () => {
    const copyFrom = {
      id: null, name: `Copy of ${r.name}`, faction: r.faction, unit: r.unit || '',
      hobbyId: r.hobbyId || 'warhammer', difficulty: r.difficulty,
      photo: null, photoPath: null, originalPhoto: null, photoFocalX: 0.5, photoFocalY: 0.5,
      copiedFromOwnerId: ownerId, copiedFromRecipeId: r.id, copiedFromName: r.name,
      steps: (r.steps || []).map((s) => {
        if (!isShared) return { ...s, id: 'ns' + Math.random().toString(36).slice(2, 9) };
        const p = resolveStepPaint(s, 'paintId');
        const mixP = (s.mixPaintId || s.mixWantPaint) ? resolveStepPaint(s, 'mixPaintId') : null;
        return {
          id: 'ns' + Math.random().toString(36).slice(2, 9), technique: s.technique,
          paintId: '', wantPaint: p ? { name: p.name, brand: p.brand, hex: p.hex, type: p.type } : undefined,
          notes: s.notes || '', area: s.area || '',
          mixPaintId: mixP ? '' : undefined,
          mixWantPaint: mixP ? { name: mixP.name, brand: mixP.brand, hex: mixP.hex, type: mixP.type } : undefined,
          mixRatio: s.mixRatio || '',
        };
      }),
      notes: r.notes || '', published: false,
    };
    showToast('Copied — tweak it and save as a new recipe');
    navigate('/recipe-new', { state: { copyFrom } });
  };

  // Generates a portrait share-card PNG (see utils/shareCard.js) and hands
  // it to the Web Share API, falling back to a download + copied link on
  // desktop/unsupported browsers. An own, not-yet-published recipe gets
  // published first -- a share link only makes sense for something the
  // public route (/r/:authorId/:id) can actually resolve.
  const onShare = async () => {
    let recipe = r;
    if (!isShared && !r.published) {
      showToast('Publishing recipe…');
      try {
        recipe = await pushRecipe.mutateAsync({ ...r, published: true });
      } catch (e) {
        showToast(e.message || "Couldn't publish that — try again.");
        return;
      }
    }

    const cardSteps = (recipe.steps || []).map((s) => {
      const p = resolveStepPaint(s, 'paintId');
      return { technique: s.technique, paintName: p ? p.name : '(paint deleted)', hex: p ? p.hex : f.color };
    });
    const canvas = drawShareCardCanvas(recipe, f, paints, cardSteps);
    const shareUrl = `https://forgebook.co.uk/#/r/${encodeURIComponent(ownerId)}/${encodeURIComponent(recipe.id)}`;

    canvas.toBlob(async (blob) => {
      if (!blob) { showToast("Couldn't generate the share image — try again."); return; }
      const fileName = `${slug(recipe.name)}.png`;
      const shareText = `${recipe.name} — a Forgebook paint recipe. ${shareUrl}`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: recipe.name, text: shareText });
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return; // user backed out of the share sheet
          // anything else: fall through to the download fallback below
        }
      }

      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objUrl);

      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Image saved, link copied — paste both into your post');
      } catch {
        showToast('Image saved — copy the link from the recipe page to include it');
      }
    }, 'image/png');
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/recipes')}><Icon name="back" size={18} /></button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" aria-label="Copy to new recipe" title="Copy to new recipe" onClick={doCopy}><Icon name="copy" size={16} /></button>
          {!isShared && (
            <>
              <button className="icon-btn" onClick={() => navigate(`/recipe/${r.id}/edit`)}><Icon name="edit" size={16} /></button>
              <button className="icon-btn" onClick={doDelete}><Icon name="trash" size={16} /></button>
            </>
          )}
        </div>
      </div>

      <div className={`detail-hero ${r.photo ? 'has-photo' : ''}`} style={{ '--faction-color': f.color, cursor: r.photo ? 'pointer' : undefined, ...(r.photo ? { backgroundImage: `url('${r.photo}')`, backgroundPosition: `${(r.photoFocalX ?? 0.5) * 100}% ${(r.photoFocalY ?? 0.5) * 100}%` } : {}) }}
        onClick={r.photo ? () => setLightboxOpen(true) : undefined}>
        {!r.photo && <span className="emblem-badge emblem-badge--xl"><EmblemSvg emblemKey={f.emblem} size={40} /></span>}
        {isShared && r.photo && (
          <button type="button" className="report-photo-btn" aria-label="Report photo" title="Report photo" onClick={(e) => { e.stopPropagation(); doReportPhoto(); }}>
            <Icon name="flag" size={13} />
          </button>
        )}
      </div>

      {lightboxOpen && r.photo && <Lightbox url={r.photo} onClose={() => setLightboxOpen(false)} />}

      <div className="detail-crumbs">
        <span className="crumb-chip" style={{ '--chip-color': f.color }} onClick={() => navigate(`/faction/${f.id}`)}>{f.label}</span>
        <span className="crumb-chip" onClick={() => navigate(`/faction/${f.id}/unit/${r.unit ? encodeURIComponent(r.unit) : '_general'}`)}>{r.unit || 'General'}</span>
      </div>
      <div className="detail-title">{r.name}</div>
      {isShared && (
        <div className="shared-badge">
          <Avatar displayName={r.author?.displayName} url={r.author?.avatarUrl} size={16} /> Shared by{' '}
          <span onClick={() => navigate(`/u/${r.authorId}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{r.author?.displayName}</span>
        </div>
      )}
      {r.copiedFromRecipeId && (
        <div className="shared-badge">
          Copied from{' '}
          {copiedFromOriginal ? (
            <span
              onClick={() => navigate(copiedFromIsOwn ? `/recipe/${r.copiedFromRecipeId}` : `/recipe/${r.copiedFromRecipeId}/by/${r.copiedFromOwnerId}`)}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              {r.copiedFromName}
            </span>
          ) : r.copiedFromName}
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
                <div className="paint-row__swatch" title="Find similar colours" style={{ background: p.hex, cursor: 'pointer' }} onClick={(e) => openSimilar(e, p.name, p.brand)}><TypeBadge type={p.type} /></div>
                <div>
                  <div className="paint-row__name">{p.name}</div>
                  <div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div>
                </div>
                <div className="paint-row__hex">{p.hex}</div>
              </div>
            );
          }
          const owned = p.isWant ? false : myPaints?.some((mp) => paintTypeKey(mp.name, mp.brand, mp.type) === paintTypeKey(p.name, p.brand, p.type));
          const wanted = !owned && isWanted(wantedKeys, p.name, p.brand, p.type);
          return (
            <div key={i} className={`paint-row ${owned ? 'is-owned' : ''}`}>
              <div className="paint-row__swatch" title="Find similar colours" style={{ background: p.hex }} onClick={(e) => openSimilar(e, p.name, p.brand)}><TypeBadge type={p.type} /></div>
              <div>
                <div className="paint-row__name">{p.name}</div>
                <div className="paint-row__brand">{p.brand || ''}{p.type ? ` · ${p.type}` : ''}</div>
              </div>
              {owned ? (
                <span className="lib-row__ring is-owned" style={{ marginLeft: 'auto' }} title="On your rack"><Icon name="check" size={13} /></span>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button className={`lib-row__flag is-wanted ${wanted ? 'is-on' : ''}`} title={wanted ? 'On your buy list' : 'Add to buy list'}
                    onClick={() => toggleWanted.mutate({ name: p.name, brand: p.brand, type: p.type, wanted })}>
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

      <div className="detail-actions">
        <button className="btn btn-ghost btn-block" style={{ flex: 1 }} onClick={() => window.print()}>Print Recipe</button>
        <button className="btn btn-primary btn-block" style={{ flex: 1 }} onClick={onShare}><Icon name="upload" size={15} /> Share</button>
      </div>

      {!isShared && (() => {
        const usedByEntries = myHobbyLog.filter((e) => e.recipeLinks.some((l) => l.recipeId === r.id));
        if (!usedByEntries.length) return null;
        return (
          <>
            <div className="section-label">Used by</div>
            <div className="hobbylog-list">
              {usedByEntries.map((entry) => (
                <div key={entry.id} className="hobbylog-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/hobby-log?entry=${entry.id}`)}>
                  <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')` } : undefined}>
                    {!entry.photo && <Icon name="paintdrop" size={22} />}
                  </div>
                  <div className="hobbylog-card__body">
                    <div className="hobbylog-card__title">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span></div>
                    <HobbyStageStack stageCounts={entry.stageCounts} quantity={entry.quantity} />
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {r.published && <CommentThread ownerId={ownerId} recipeId={r.id} />}
    </div>
  );
}
