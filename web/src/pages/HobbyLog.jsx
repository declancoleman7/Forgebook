import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipePicker from '../components/RecipePicker.jsx';
import EntryPicker from '../components/EntryPicker.jsx';
import FactionPicker from '../components/FactionPicker.jsx';
import Lightbox from '../components/Lightbox.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import HobbyStageStack from '../components/HobbyStageStack.jsx';
import { HOBBIES, faction as findFaction } from '../data/factions.js';
import { HOBBY_STAGES, stageProgressPercent } from '../data/hobbyStages.js';
import { MODEL_CATEGORIES, DEFAULT_MODEL_CATEGORY, categoryLabel, categoryWeight } from '../data/modelCategories.js';
import { downscaleImage } from '../utils/image.js';
import { relativeTime } from '../utils/format.js';
import { useMyHobbyLog, useCreateHobbyLogEntry, useUpdateHobbyLogEntry, useDeleteHobbyLogEntry, useUploadHobbyLogPhoto, useHobbyLogStageEvents, useLogHobbyStageEvents } from '../queries/useHobbyLog.js';
import { useMyHobbyProjects, useCreateHobbyProject, useUpdateHobbyProject, useDeleteHobbyProject } from '../queries/useHobbyProjects.js';
import { useMyRecipes } from '../queries/useRecipes.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { containsBlockedContent } from '../utils/moderation.js';

// A Project's own progress is always derived by summing whichever units are
// linked to it -- weighted by miniature count, not a per-unit average, so a
// 40-model unit moves the needle far more than a 1-model one, matching how
// quantity is the unit of measure everywhere else in the Pile of Potential.
function sumStageCounts(entries, entryIds) {
  const linked = entries.filter((e) => entryIds.includes(e.id));
  const quantity = linked.reduce((sum, e) => sum + (e.quantity || 0), 0);
  const stageCounts = {};
  linked.forEach((e) => {
    HOBBY_STAGES.forEach((s) => { stageCounts[s.id] = (stageCounts[s.id] || 0) + (e.stageCounts?.[s.id] || 0); });
  });
  return { quantity, stageCounts };
}

// Which non-zero stage an entry has made the most progress into -- used to
// bucket a mixed unit (e.g. half primed, half still unassembled) into one
// filter/status reading, without needing a second stored field. Ties lean
// toward the later stage: real progress made, even if only on part of the
// unit, is what "how far has this gotten" should reflect.
function dominantStage(entry) {
  let best = HOBBY_STAGES[0].id, bestN = -1;
  HOBBY_STAGES.forEach((s) => {
    const n = entry.stageCounts?.[s.id] || 0;
    if (n >= bestN) { best = s.id; bestN = n; }
  });
  return best;
}

function StagePipelineChart({ entries, onStageClick }) {
  const totalMinis = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
  if (!totalMinis) return null;
  // Weighted by category (a Titan or Vehicle is vastly more work than a
  // trooper) -- only shown when it actually differs from the raw count, so
  // an all-Infantry pile isn't cluttered with a redundant second number.
  const weightedTotal = Math.round(entries.reduce((sum, e) => sum + (e.quantity || 0) * categoryWeight(e.category), 0));
  const rows = HOBBY_STAGES
    .map((s) => ({ ...s, n: entries.reduce((sum, e) => sum + (e.stageCounts?.[s.id] || 0), 0) }))
    .filter((s) => s.n > 0);

  return (
    <div className="hoblog-pipeline">
      {weightedTotal !== totalMinis && (
        <div className="label-hint" style={{ marginBottom: 10 }}>{totalMinis} miniatures · ~{weightedTotal} weighted by category</div>
      )}
      {rows.map((s) => {
        const pct = Math.round((s.n / totalMinis) * 100);
        return (
          <div key={s.id} className={`hoblog-pipeline__row ${onStageClick ? 'is-clickable' : ''}`} onClick={onStageClick ? () => onStageClick(s.id) : undefined}>
            <span className="hoblog-pipeline__label">{s.label}</span>
            <div className="hoblog-pipeline__track"><div className="hoblog-pipeline__fill" style={{ width: `${pct}%`, background: s.color }} /></div>
            <span className="hoblog-pipeline__pct">{pct}%</span>
          </div>
        );
      })}
      <div className="hoblog-timeline__legend" style={{ marginTop: 12 }}>
        {rows.map((s) => <span key={s.id} className="hoblog-timeline__legend-item"><i style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </div>
  );
}

// "This month you painted 20" / "built 40" -- net progress THIS calendar
// month, per stage, straight from the real transition log. A stage only
// shows up once it has actually moved this month; reaching Primed stays
// true forever once logged (see schema.sql's hobby_log_stage_events
// comment), so this never has to "undo" an earlier month's number just
// because those same models have since moved further along.
function ThisMonthStats({ stageEvents, onStageClick }) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const totals = {};
  stageEvents.forEach((ev) => {
    if (!ev.occurredAt) return;
    const d = new Date(ev.occurredAt);
    if (`${d.getFullYear()}-${d.getMonth()}` !== monthKey) return;
    totals[ev.stageId] = (totals[ev.stageId] || 0) + ev.delta;
  });
  const rows = HOBBY_STAGES.filter((s) => totals[s.id]);
  if (!rows.length) return null;

  return (
    <div className="hoblog-month-tiles">
      {rows.map((s) => (
        <div key={s.id} className={`hoblog-month-tile ${onStageClick ? 'is-clickable' : ''}`} style={{ '--tile-color': s.color }} onClick={onStageClick ? () => onStageClick(s.id) : undefined}>
          <div className="hoblog-month-tile__label">{s.label}</div>
          <div className="hoblog-month-tile__value">{totals[s.id] > 0 ? '+' : ''}{totals[s.id]}</div>
        </div>
      ))}
    </div>
  );
}

// A simple horizontal bar list, shared shape for "models by army" and
// "models by category" -- both are just "total quantity grouped by one
// field, sorted biggest first," differing only in what groups them and
// what colour/label each group gets. onRowClick is optional and per-row --
// a row can opt out (clickable: false) when there's nowhere sensible to
// send it, e.g. "No army set" has no faction to scope a list to.
function BarBreakdown({ rows, onRowClick }) {
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="hoblog-bars">
      {rows.map((r) => {
        const clickable = !!onRowClick && r.clickable !== false;
        return (
          <div key={r.key} className={`hoblog-bars__row ${clickable ? 'is-clickable' : ''}`} onClick={clickable ? () => onRowClick(r) : undefined}>
            <div className="hoblog-bars__top">
              <span className="hoblog-bars__label"><i style={{ background: r.color }} />{r.label}</span>
              <span className="hoblog-bars__n">{r.n}</span>
            </div>
            <div className="hoblog-bars__track"><div className="hoblog-bars__fill" style={{ width: `${(r.n / max) * 100}%`, background: r.color }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function ModelsByArmyChart({ entries, onArmyClick }) {
  const totals = new Map();
  entries.forEach((e) => {
    const key = e.factionId || '__none__';
    if (!totals.has(key)) totals.set(key, { n: 0, hobbyId: e.hobbyId });
    totals.get(key).n += (e.quantity || 0);
  });
  const rows = [...totals.entries()]
    .map(([key, v]) => {
      const f = key !== '__none__' ? findFaction(key) : null;
      return {
        key, n: v.n, label: f ? f.label : 'No army set', color: f?.color || 'var(--ink-dim)',
        clickable: !!f, hobby: v.hobbyId, system: f?.system, faction: key,
      };
    })
    .sort((a, b) => b.n - a.n);
  return <BarBreakdown rows={rows} onRowClick={onArmyClick ? (r) => onArmyClick({ hobby: r.hobby, system: r.system, faction: r.faction }) : undefined} />;
}

function ModelsByCategoryChart({ entries, onCategoryClick }) {
  const totals = new Map();
  entries.forEach((e) => {
    const key = e.category || DEFAULT_MODEL_CATEGORY;
    totals.set(key, (totals.get(key) || 0) + (e.quantity || 0));
  });
  const rows = MODEL_CATEGORIES
    .filter((c) => totals.get(c.id))
    .map((c) => ({ key: c.id, n: totals.get(c.id), label: c.label, color: c.color }))
    .sort((a, b) => b.n - a.n);
  return <BarBreakdown rows={rows} onRowClick={onCategoryClick ? (r) => onCategoryClick(r.key) : undefined} />;
}

// A stacked column per month -- each segment is one stage's net "reached
// this stage or beyond" delta that month (see HobbyLog's save() for why
// that's the right quantity, not the raw stage_counts bucket). Segment
// height within a column is proportional via flex-grow, not an absolute
// size, so this stays readable whether one month had 3 models move or 300.
function PipelineTimelineChart({ stageEvents, onStageClick }) {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
  }
  const perMonth = months.map(({ key }) => {
    const totals = {};
    stageEvents.forEach((ev) => {
      if (!ev.occurredAt) return;
      const d = new Date(ev.occurredAt);
      if (`${d.getFullYear()}-${d.getMonth()}` !== key) return;
      totals[ev.stageId] = (totals[ev.stageId] || 0) + ev.delta;
    });
    return totals;
  });
  const monthTotals = perMonth.map((t) => HOBBY_STAGES.reduce((sum, s) => sum + Math.max(0, t[s.id] || 0), 0));
  const max = Math.max(1, ...monthTotals);
  if (!monthTotals.some((n) => n > 0)) return null;

  return (
    <div className="hoblog-trend">
      <div className="hoblog-trend__bars">
        <div className="hoblog-trend__grid"><i /><i /><i /><i /></div>
        {months.map((m, i) => {
          const totals = perMonth[i];
          const segments = HOBBY_STAGES.filter((s) => (totals[s.id] || 0) > 0);
          return (
            <div key={m.key} className="hoblog-trend__col">
              <span className="hoblog-trend__count">{monthTotals[i] || ''}</span>
              <div className="hoblog-trend__track">
                <div className="hoblog-timeline__stack" style={{ height: `${Math.max(4, (monthTotals[i] / max) * 100)}%` }}>
                  {segments.map((s) => (
                    <div key={s.id} className={onStageClick ? 'is-clickable' : ''} title={`${s.label}: ${totals[s.id]}`}
                      style={{ flex: totals[s.id], background: s.color }}
                      onClick={onStageClick ? (e) => { e.stopPropagation(); onStageClick(s.id); } : undefined} />
                  ))}
                </div>
              </div>
              <span className="hoblog-trend__label">{m.label}</span>
            </div>
          );
        })}
      </div>
      <div className="hoblog-timeline__legend">
        {HOBBY_STAGES.map((s) => (
          <span key={s.id} className="hoblog-timeline__legend-item"><i style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry, onEdit }) {
  const f = entry.factionId ? findFaction(entry.factionId) : null;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const openLightbox = (e) => { e.stopPropagation(); setLightboxOpen(true); };
  return (
    <div className="hobbylog-card" onClick={() => onEdit(entry.id)}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')`, cursor: 'pointer' } : undefined}
        onClick={entry.photo ? openLightbox : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      {lightboxOpen && entry.photo && (
        <div onClick={(e) => e.stopPropagation()}>
          <Lightbox url={entry.photo} onClose={() => setLightboxOpen(false)} />
        </div>
      )}
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span></div>
        <HobbyStageStack stageCounts={entry.stageCounts} quantity={entry.quantity} />
        <div className="hobbylog-card__meta">
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
          {entry.category && entry.category !== DEFAULT_MODEL_CATEGORY && <span className="hobbylog-card__tag">{categoryLabel(entry.category)}</span>}
          {entry.completedAt && <span className="hobbylog-card__public">Finished {relativeTime(entry.completedAt)}</span>}
          {entry.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
          {entry.recipeLinks.length > 0 && <span className="hobbylog-card__recipes">{entry.recipeLinks.length} recipe{entry.recipeLinks.length === 1 ? '' : 's'}</span>}
        </div>
      </div>
    </div>
  );
}

// A recipe linked to this unit -- a proper row (its own photo, faction,
// unit) rather than a bare name-only chip, and clickable through to the
// recipe itself, same detail level as RecipePicker's own selection rows.
function LinkedRecipeRow({ recipe, onRemove }) {
  const navigate = useNavigate();
  const f = findFaction(recipe.faction);
  return (
    <div className="hobbylog-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
      <div className={`hobbylog-card__photo ${recipe.photo ? 'has-photo' : ''}`} style={recipe.photo ? { backgroundImage: `url('${recipe.photo}')` } : undefined}>
        {!recipe.photo && <Icon name="book" size={22} />}
      </div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{recipe.name}</div>
        <div className="hobbylog-card__meta">
          <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>
          {recipe.unit && <span className="hobbylog-card__tag">{recipe.unit}</span>}
        </div>
      </div>
      <button type="button" className="icon-btn-sm" style={{ alignSelf: 'center' }} aria-label={`Remove ${recipe.name}`} onClick={(e) => { e.stopPropagation(); onRemove(recipe); }}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
}

function EntryForm({ existing, myRecipes, prefill, onClose }) {
  const { userId } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const create = useCreateHobbyLogEntry();
  const update = useUpdateHobbyLogEntry();
  const del = useDeleteHobbyLogEntry();
  const uploadPhoto = useUploadHobbyLogPhoto();
  const logStageEvents = useLogHobbyStageEvents();
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [factionPickerOpen, setFactionPickerOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [entry, setEntry] = useState(() => existing
    ? { ...existing, originalPhoto: existing.photo || null }
    : { id: null, title: '', notes: '', quantity: 1, stageCounts: { unassembled: 1 }, category: DEFAULT_MODEL_CATEGORY, hobbyId: prefill?.hobbyId || '', factionId: prefill?.factionId || '', photo: null, photoPath: null, originalPhoto: null, isPublic: false, recipeLinks: [], completedAt: null });
  // Snapshotted once, at whatever stage_counts this form opened with (an
  // existing unit's last-saved counts, or a brand-new one's starting point)
  // -- diffed against the final counts at save time to log only the NET
  // change per stage. Stage-count edits only ever live in local state until
  // Save is clicked, so this is the only point that can ever reach the
  // network anyway; no need to instrument every individual +/- click.
  const openingStageCountsRef = useRef(entry.stageCounts);

  const patch = (fields) => setEntry((e) => ({ ...e, ...fields }));
  const hobby = HOBBIES.find((h) => h.id === entry.hobbyId);
  const factionsForHobby = hobby ? hobby.factions : [];
  const eligibleRecipes = entry.hobbyId ? myRecipes.filter((r) => (r.hobbyId || 'warhammer') === entry.hobbyId) : myRecipes;
  const linkedRecipes = entry.recipeLinks.map((l) => myRecipes.find((r) => r.id === l.recipeId)).filter(Boolean);

  const toggleRecipe = (r) => {
    const key = { recipeOwnerId: userId, recipeId: r.id };
    const has = entry.recipeLinks.some((l) => l.recipeId === r.id);
    patch({ recipeLinks: has ? entry.recipeLinks.filter((l) => l.recipeId !== r.id) : [...entry.recipeLinks, key] });
  };

  // Growing the count adds new models to Unassembled (freshly tracked,
  // nothing done to them yet); shrinking it removes from the LEAST-
  // progressed non-zero stage first, walking forward through the pipeline
  // -- so trimming a miscounted quantity down never silently erases
  // progress on models you've actually already painted.
  const setQuantity = (raw) => {
    const newQty = Math.max(0, parseInt(raw, 10) || 0);
    const delta = newQty - entry.quantity;
    const counts = { ...entry.stageCounts };
    if (delta > 0) {
      counts.unassembled = (counts.unassembled || 0) + delta;
    } else if (delta < 0) {
      let toRemove = -delta;
      for (const s of HOBBY_STAGES) {
        if (toRemove <= 0) break;
        const have = counts[s.id] || 0;
        const take = Math.min(have, toRemove);
        counts[s.id] = have - take;
        toRemove -= take;
      }
    }
    patch({ quantity: newQty, stageCounts: counts });
  };

  // Shifts models forward or back along the pipeline. Advancing (delta>0)
  // cascades backward through every EARLIER stage, nearest first, not just
  // the one immediately before -- a bulk correction (typing straight into
  // Primed) or even a single "+1" tap shouldn't get stuck just because the
  // immediately-preceding stage happens to read 0 while an earlier one still
  // has stock (e.g. 22 Unassembled/0 Assembled/10 Primed: advancing Primed
  // has to reach back past the empty Assembled bucket to Unassembled).
  // Undoing (delta<0) always lands exactly one step back, never further --
  // "this batch wasn't as far along as I said" is inherently a one-stage
  // correction, not a multi-stage rewind. Always clamped to what's actually
  // available, so the breakdown can never drift from quantity -- no
  // separate "does this add up" validation needed, it's balanced by
  // construction. Unassembled (the first stage) has nothing earlier to
  // shift with; it only changes via the quantity field above.
  const shiftStage = (stageId, delta) => {
    const idx = HOBBY_STAGES.findIndex((s) => s.id === stageId);
    if (idx <= 0 || delta === 0) return;
    const counts = { ...entry.stageCounts };
    if (delta > 0) {
      let remaining = delta;
      for (let i = idx - 1; i >= 0 && remaining > 0; i--) {
        const id = HOBBY_STAGES[i].id;
        const take = Math.min(counts[id] || 0, remaining);
        counts[id] = (counts[id] || 0) - take;
        remaining -= take;
      }
      counts[stageId] = (counts[stageId] || 0) + (delta - remaining);
    } else {
      const prevId = HOBBY_STAGES[idx - 1].id;
      const take = Math.min(counts[stageId] || 0, -delta);
      counts[stageId] = (counts[stageId] || 0) - take;
      counts[prevId] = (counts[prevId] || 0) + take;
    }
    patch({ stageCounts: counts });
  };

  const setStageCountDirect = (stageId, raw) => {
    const n = Math.max(0, parseInt(raw, 10) || 0);
    shiftStage(stageId, n - (entry.stageCounts[stageId] || 0));
  };

  // Collapses every model into one stage, regardless of where they
  // currently sit -- unlike shiftStage (which only ever pulls FORWARD from
  // earlier stages), this also has to handle pulling back from a LATER
  // one: e.g. everything's already in Finished and you tap Primed meaning
  // to walk it back down. There's no "earlier stage" to pull from in that
  // case, so shiftStage's own cascade can't do it -- this just sets the
  // target stage to the full quantity and zeroes every other stage.
  const moveAllToStage = (stageId) => {
    const counts = {};
    HOBBY_STAGES.forEach((s) => { counts[s.id] = s.id === stageId ? entry.quantity : 0; });
    patch({ stageCounts: counts });
  };

  const onPhotoChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await downscaleImage(file, 900);
    patch({ photo: url });
  };

  const save = async () => {
    if (!entry.title.trim()) { showToast('Give the unit a name first'); return; }
    if (containsBlockedContent(entry.title) || containsBlockedContent(entry.notes)) {
      showToast("That name or notes text isn't allowed — please rephrase it");
      return;
    }
    let photoPath = entry.photo !== (entry.originalPhoto || null) ? null : (entry.photoPath || null);
    if (entry.photo && String(entry.photo).startsWith('data:')) {
      showToast('Uploading photo…');
      try {
        photoPath = await uploadPhoto.mutateAsync({ dataUrl: entry.photo });
      } catch {
        showToast("Couldn't upload that photo — try again");
        return;
      }
    }
    // Set the first time this unit reaches fully Finished; cleared if a
    // later correction drops it back below full again. Once set, it doesn't
    // move just because the unit is saved again while still fully finished.
    const isFullyFinished = entry.quantity > 0 && (entry.stageCounts.finished || 0) === entry.quantity;
    const completedAt = isFullyFinished ? (entry.completedAt || new Date().toISOString()) : null;
    const payload = {
      id: entry.id, title: entry.title.trim(), notes: entry.notes, quantity: entry.quantity, stageCounts: entry.stageCounts,
      category: entry.category || DEFAULT_MODEL_CATEGORY, hobbyId: entry.hobbyId || null, factionId: entry.factionId || null,
      photoPath, isPublic: entry.isPublic, recipeLinks: entry.recipeLinks, completedAt,
    };
    try {
      const saved = entry.id ? await update.mutateAsync(payload) : await create.mutateAsync(payload);
      // Diffing each stage's OWN bucket directly would be wrong: advancing a
      // model from Primed to Painted empties Primed's bucket, which would
      // read as "-8 Primed" even though nothing was undone. What should
      // never regress from ordinary forward progress is "how many models
      // have reached this stage or any stage further along" -- a model
      // that's now Finished has necessarily passed through Primed too, so
      // that cumulative count only drops when a stage is genuinely
      // corrected backward (the "-" stepper, "move all to" an earlier
      // stage, or shrinking the miniature count), which is exactly the
      // model deltas should reflect. Unassembled (index 0) is skipped --
      // "reached unassembled" is just pipeline size, not a real milestone.
      const reachedOrBeyond = (counts, idx) => HOBBY_STAGES.slice(idx).reduce((sum, s) => sum + (counts[s.id] || 0), 0);
      const deltas = {};
      HOBBY_STAGES.forEach((s, idx) => {
        if (idx === 0) return;
        const delta = reachedOrBeyond(entry.stageCounts, idx) - reachedOrBeyond(openingStageCountsRef.current, idx);
        if (delta) deltas[s.id] = delta;
      });
      if (Object.keys(deltas).length) await logStageEvents.mutateAsync({ entryId: saved.id, deltas });
      showToast('Saved');
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't save that — try again");
    }
  };

  const doDelete = async () => {
    if (!(await confirm(`Delete "${entry.title}" from your Pile of Potential?`))) return;
    await del.mutateAsync(entry.id);
    showToast('Deleted');
    onClose();
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={onClose}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{entry.id ? 'Edit Unit' : 'New Unit'}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="field">
        <label>Unit name</label>
        <input type="text" value={entry.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Legionnaires" />
      </div>

      <div className="field">
        <label>Photo</label>
        <div className={`detail-hero ${entry.photo ? 'has-photo' : ''}`}
          style={entry.photo ? { backgroundImage: `url('${entry.photo}')`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' } : undefined}
          onClick={entry.photo ? () => setLightboxOpen(true) : undefined}>
          {!entry.photo && <Icon name="paintdrop" size={40} />}
        </div>
        <div className="photo-field" style={{ marginTop: 10 }}>
          {entry.photo ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => photoInputRef.current?.click()}>Replace</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => cameraInputRef.current?.click()}>Retake</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => patch({ photo: null, photoPath: null })}>Remove</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button type="button" className="repeater-add" style={{ margin: 0, flex: 1 }} onClick={() => photoInputRef.current?.click()}>+ Choose photo</button>
              <button type="button" className="repeater-add" style={{ margin: 0, flex: 1 }} onClick={() => cameraInputRef.current?.click()}>+ Take photo</button>
            </div>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChosen} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoChosen} />
        {lightboxOpen && entry.photo && <Lightbox url={entry.photo} onClose={() => setLightboxOpen(false)} />}
      </div>

      <div className="field">
        <label>How many miniatures</label>
        <input type="number" min="0" value={entry.quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>

      <div className="field">
        <label>Category <span className="label-hint">how much work one of these takes, roughly</span></label>
        <div className="tech-picker">
          {MODEL_CATEGORIES.map((c) => (
            <button type="button" key={c.id} className={entry.category === c.id ? 'is-selected' : ''} onClick={() => patch({ category: c.id })}>{c.label}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Build &amp; paint progress</label>
        <div className="label-hint" style={{ marginBottom: 8 }}>Tap − / + to move models to or from the stage before it, or tap a stage's name to put every model there, from wherever they currently sit. Unassembled only changes via the miniature count above.</div>
        <div className="hoblog-chart">
          {HOBBY_STAGES.map((s, idx) => {
            const n = entry.stageCounts[s.id] || 0;
            const pct = entry.quantity ? Math.round((n / entry.quantity) * 100) : 0;
            // Total available to pull forward from ANY earlier stage, not
            // just the immediate predecessor -- matches shiftStage's own
            // cascading behaviour, so the +/- stepper's + button isn't
            // disabled just because the one stage right before this
            // happens to read 0.
            const availableBefore = HOBBY_STAGES.slice(0, idx).reduce((sum, st) => sum + (entry.stageCounts[st.id] || 0), 0);
            return (
              <div key={s.id} className="hoblog-chart__row hoblog-chart__row--edit">
                {idx === 0 ? (
                  <span className="hoblog-chart__row-label">{s.label}</span>
                ) : (
                  <button type="button" className="hoblog-chart__row-label hoblog-chart__row-label--action" disabled={n === entry.quantity}
                    title={`Move every model to ${s.label}`}
                    onClick={() => moveAllToStage(s.id)}>
                    {s.label}
                  </button>
                )}
                <div className="hoblog-chart__row-bar"><i style={{ width: `${pct}%`, background: s.color }} /></div>
                {idx === 0 ? (
                  <span className="hoblog-chart__row-count">{n}</span>
                ) : (
                  <div className="hoblog-chart__row-stepper">
                    <button type="button" aria-label={`Move a model back out of ${s.label}`} disabled={n === 0} onClick={() => shiftStage(s.id, -1)}>−</button>
                    <input type="number" min="0" className="hoblog-chart__row-input" value={n} onChange={(e) => setStageCountDirect(s.id, e.target.value)} />
                    <button type="button" aria-label={`Move a model into ${s.label}`} disabled={availableBefore === 0} onClick={() => shiftStage(s.id, 1)}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label>Hobby <span className="label-hint">optional</span></label>
        <select value={entry.hobbyId} onChange={(e) => patch({ hobbyId: e.target.value, factionId: '' })}>
          <option value="">Not linked to a hobby</option>
          {HOBBIES.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
        </select>
      </div>

      {hobby && (
        <div className="field">
          <label>{hobby.groupLabel} <span className="label-hint">optional</span></label>
          <button type="button" className="paint-pick-trigger" onClick={() => setFactionPickerOpen(true)}>
            {entry.factionId ? (
              <>
                <span className="paint-pick-row__swatch" style={{ background: findFaction(entry.factionId).color }} />
                <span className="paint-pick-trigger__label">{findFaction(entry.factionId).label}</span>
              </>
            ) : (
              <span className="paint-pick-trigger__placeholder">None</span>
            )}
          </button>
        </div>
      )}

      {factionPickerOpen && (
        <FactionPicker
          factions={factionsForHobby}
          systems={hobby.flatBrowse ? null : hobby.systems}
          allowNone
          groupLabel={hobby.groupLabel}
          currentId={entry.factionId}
          onPick={(id) => patch({ factionId: id })}
          onClose={() => setFactionPickerOpen(false)}
        />
      )}

      <div className="field">
        <label>Notes</label>
        <textarea rows={4} value={entry.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="What's the plan, what's left to do..." />
      </div>

      {myRecipes.length > 0 && (
        <div className="field">
          <label>Recipes used <span className="label-hint">optional — link how you actually painted this</span></label>
          {linkedRecipes.length > 0 && (
            <div className="hobbylog-list" style={{ marginBottom: 10 }}>
              {linkedRecipes.map((r) => <LinkedRecipeRow key={r.id} recipe={r} onRemove={toggleRecipe} />)}
            </div>
          )}
          <button type="button" className="repeater-add" style={{ margin: 0 }} onClick={() => setPickerOpen(true)}>
            <Icon name="search" size={14} /> {linkedRecipes.length ? 'Add another recipe' : 'Choose recipes'}
          </button>
        </div>
      )}

      {pickerOpen && (
        <RecipePicker
          recipes={eligibleRecipes}
          selectedIds={new Set(entry.recipeLinks.map((l) => l.recipeId))}
          onToggle={toggleRecipe}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Public entry</div>
            <div className="settings-row__desc">Shows on your profile for other people to read. Off by default.</div>
          </div>
          <button type="button" className={`toggle ${entry.isPublic ? 'is-on' : ''}`} onClick={() => patch({ isPublic: !entry.isPublic })}><i /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Save</button>
        {entry.id && <button className="btn btn-danger" onClick={doDelete}>Delete</button>}
      </div>
    </div>
  );
}

function ProjectCard({ project, entries, onEdit }) {
  const { quantity, stageCounts } = sumStageCounts(entries, project.entryIds);
  const pct = stageProgressPercent(stageCounts, quantity);
  return (
    <div className="hobbylog-card" onClick={() => onEdit(project.id)}>
      <div className="hobbylog-card__photo"><Icon name="clipboard-check" size={22} /></div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{project.title} <span className="hobbylog-card__pct">{pct}%</span></div>
        <HobbyStageStack stageCounts={stageCounts} quantity={quantity} />
        <div className="hobbylog-card__meta">
          <span>{project.entryIds.length} unit{project.entryIds.length === 1 ? '' : 's'}</span>
          {project.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
        </div>
      </div>
    </div>
  );
}

// One linked unit within a Project's edit form -- a proper vertical row
// (title, its own stage stack + %, faction tag) rather than the old
// horizontal faction-chip strip, which squeezed everything down to a name
// and had no room for per-unit progress at all.
function ProjectEntryRow({ entry, onOpen, onRemove }) {
  const f = entry.factionId ? findFaction(entry.factionId) : null;
  const pct = stageProgressPercent(entry.stageCounts, entry.quantity);
  return (
    <div className="hobbylog-card" onClick={() => onOpen(entry.id)}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')` } : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span> <span className="hobbylog-card__pct">{pct}%</span></div>
        <HobbyStageStack stageCounts={entry.stageCounts} quantity={entry.quantity} />
        <div className="hobbylog-card__meta">
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
        </div>
      </div>
      <button type="button" className="icon-btn-sm" style={{ alignSelf: 'center' }} aria-label={`Remove ${entry.title} from this project`} onClick={(e) => { e.stopPropagation(); onRemove(entry); }}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
}

function ProjectForm({ existing, entries, onClose, onOpenEntry }) {
  const showToast = useToast();
  const confirm = useConfirm();
  const create = useCreateHobbyProject();
  const update = useUpdateHobbyProject();
  const del = useDeleteHobbyProject();
  const [pickerOpen, setPickerOpen] = useState(false);

  const [project, setProject] = useState(() => existing
    ? { ...existing }
    : { id: null, title: '', notes: '', hobbyId: '', isPublic: false, entryIds: [] });

  const patch = (fields) => setProject((p) => ({ ...p, ...fields }));
  const eligibleEntries = project.hobbyId ? entries.filter((e) => e.hobbyId === project.hobbyId) : entries;
  const linkedEntries = project.entryIds.map((id) => entries.find((e) => e.id === id)).filter(Boolean);
  const { quantity, stageCounts } = sumStageCounts(entries, project.entryIds);

  const toggleEntry = (entry) => {
    const has = project.entryIds.includes(entry.id);
    patch({ entryIds: has ? project.entryIds.filter((id) => id !== entry.id) : [...project.entryIds, entry.id] });
  };

  const save = async () => {
    if (!project.title.trim()) { showToast('Give the project a name first'); return; }
    if (containsBlockedContent(project.title) || containsBlockedContent(project.notes)) {
      showToast("That name or notes text isn't allowed — please rephrase it");
      return;
    }
    const payload = { id: project.id, title: project.title.trim(), notes: project.notes, hobbyId: project.hobbyId || null, isPublic: project.isPublic, entryIds: project.entryIds };
    try {
      if (project.id) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      showToast('Saved');
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't save that — try again");
    }
  };

  const doDelete = async () => {
    if (!(await confirm(`Delete "${project.title}"? The units in it aren't affected.`))) return;
    await del.mutateAsync(project.id);
    showToast('Deleted');
    onClose();
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={onClose}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{project.id ? 'Edit Project' : 'New Project'}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="field">
        <label>Project name</label>
        <input type="text" value={project.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Blood Angels Army" />
      </div>

      <div className="field">
        <label>Hobby <span className="label-hint">optional — scopes which units you can link</span></label>
        <select value={project.hobbyId} onChange={(e) => patch({ hobbyId: e.target.value })}>
          <option value="">Any hobby</option>
          {HOBBIES.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea rows={4} value={project.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="What's the goal here..." />
      </div>

      <div className="field">
        <label>Units in this project <span className="label-hint">{linkedEntries.length > 0 ? `${stageProgressPercent(stageCounts, quantity)}% complete overall` : ''}</span></label>
        {linkedEntries.length > 0 && (
          <>
            <HobbyStageStack stageCounts={stageCounts} quantity={quantity} />
            <div className="hobbylog-list" style={{ margin: '10px 0' }}>
              {linkedEntries.map((entry) => (
                <ProjectEntryRow key={entry.id} entry={entry} onOpen={onOpenEntry} onRemove={toggleEntry} />
              ))}
            </div>
          </>
        )}
        <button type="button" className="repeater-add" style={{ margin: 0 }} onClick={() => setPickerOpen(true)}>
          <Icon name="search" size={14} /> {linkedEntries.length ? 'Add another unit' : 'Choose units'}
        </button>
      </div>

      {pickerOpen && (
        <EntryPicker
          entries={eligibleEntries}
          selectedIds={new Set(project.entryIds)}
          onToggle={toggleEntry}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Public project</div>
            <div className="settings-row__desc">Shows on your profile for other people to read. Off by default.</div>
          </div>
          <button type="button" className={`toggle ${project.isPublic ? 'is-on' : ''}`} onClick={() => patch({ isPublic: !project.isPublic })}><i /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Save</button>
        {project.id && <button className="btn btn-danger" onClick={doDelete}>Delete</button>}
      </div>
    </div>
  );
}

function DashTile({ color, count, label, icon, onClick }) {
  return (
    <div className="faction-tile" style={{ '--faction-color': color }} title={label} onClick={onClick}>
      <div className="faction-tile__rivet tl" /><div className="faction-tile__rivet tr" /><div className="faction-tile__rivet bl" /><div className="faction-tile__rivet br" />
      <div className="faction-tile__count">{count}</div>
      <div className="faction-tile__art">
        <span className="emblem-badge emblem-badge--lg">{icon}</span>
      </div>
      <div className="faction-tile__label">{label}</div>
    </div>
  );
}

export default function HobbyLog() {
  const navigate = useNavigate();
  const { data: entries = [], isLoading } = useMyHobbyLog();
  const { data: projects = [] } = useMyHobbyProjects();
  const { data: myRecipes = [] } = useMyRecipes();
  const { data: stageEvents = [] } = useHobbyLogStageEvents();
  // Which dashboard metric view is showing -- kept separate from the browse
  // state below (hobby/system/faction drill-down), since it's scoped to the
  // Level 0 dashboard only.
  const [dashView, setDashView] = useState('overview'); // overview | army | category | timeline

  // Every drill-down/edit level below lives in the URL's own query string,
  // not local state -- this whole page is a single route, so plain useState
  // here would never create a browser history entry, meaning Android's back
  // button (or the browser's own) skipped past every level at once, straight
  // out of the page. Reading these from useSearchParams and pushing new
  // params via navigate() (its default behaviour, unless {replace:true} is
  // passed) gives each "go deeper" tap its own history entry, so back steps
  // through hobby -> system -> army -> list -> entry/project one level at a
  // time, same as anywhere else in the app that uses real routes.
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('entry'); // null | 'new' | entry id
  const editingProjectId = searchParams.get('project'); // null | 'new' | project id
  // null = hobby-picker dashboard; 'all' = flat list of everything (the
  // escape hatch, same view this page used to open straight to);
  // otherwise a hobby id, drilling into that hobby's systems/factions below.
  const browseHobbyId = searchParams.get('hobby');
  // Only meaningful for a hobby with more than one system (Warhammer: 40k/
  // AoS/Horus Heresy/etc, per data/factions.js's HOBBIES[].systems, the
  // same grouping Collection.jsx's own browse grid already uses) -- null
  // means "still picking a system," '__general__' means entries logged
  // against this hobby with no faction at all (can't belong to a system
  // without one), otherwise a system id.
  const browseSystemId = searchParams.get('system');
  // null = faction grid; '__general__' = this hobby's entries with no
  // faction set; otherwise a faction id, scoping the list to just that one.
  const browseFactionId = searchParams.get('faction');
  // Level 2's own filters -- also URL params (not useState) so a dashboard
  // chart can deep-link straight to a filtered list (click "Painted" in the
  // pipeline chart -> land on the flat list pre-filtered to Painted).
  const stageFilter = searchParams.get('stage') || 'all';
  const catFilter = searchParams.get('cat') || 'all';

  // Pushes one new history entry with the given params changed, preserving
  // every other param already in the URL (e.g. opening a unit FROM WITHIN a
  // project keeps ?project=X while adding &entry=Y, so one "back" pop drops
  // just the entry and lands back on the project, not the list underneath
  // it). A tap that logically jumps more than one level at once (e.g. the
  // "General" tile below, which sets system AND faction together) passes
  // both keys in one call, so back undoes that whole tap in a single step.
  const pushParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    navigate({ search: next.toString() });
  };
  // Same param-merging as pushParams, but replaces the current history entry
  // instead of adding one -- for adjustments to a view you're already on
  // (flipping a filter tab), where every tap becoming its own back-stack
  // entry would make "go back" feel like it's undoing clicks, not leaving.
  const replaceParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    navigate({ search: next.toString() }, { replace: true });
  };
  const goBack = () => navigate(-1);

  if (editingId) {
    const existing = editingId === 'new' ? null : entries.find((e) => e.id === editingId);
    const prefill = editingId === 'new' && browseHobbyId && browseHobbyId !== 'all'
      ? { hobbyId: browseHobbyId, factionId: browseFactionId && browseFactionId !== '__general__' ? browseFactionId : '' }
      : null;
    return <EntryForm key={editingId} existing={existing} myRecipes={myRecipes} prefill={prefill} onClose={goBack} />;
  }

  if (editingProjectId) {
    const existing = editingProjectId === 'new' ? null : projects.find((p) => p.id === editingProjectId);
    return <ProjectForm key={editingProjectId} existing={existing} entries={entries} onClose={goBack} onOpenEntry={(id) => pushParams({ entry: id })} />;
  }

  if (isLoading) return <div className="empty-state__sub">Loading…</div>;

  // --- Level 0: pick a hobby -------------------------------------------
  if (!browseHobbyId) {
    const hobbyCounts = new Map();
    let unsorted = 0;
    entries.forEach((e) => { if (e.hobbyId) hobbyCounts.set(e.hobbyId, (hobbyCounts.get(e.hobbyId) || 0) + 1); else unsorted++; });

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="icon-btn" onClick={() => navigate(-1)}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>Pile of Potential</div>
          <button className="icon-btn" onClick={() => pushParams({ entry: 'new' })}><Icon name="plus" size={18} /></button>
        </div>
        <div className="detail-sub" style={{ marginBottom: 14 }}>
          Track every unit you're building and painting, miniature by miniature. Pick a hobby to see the armies or categories you've logged something for.
        </div>
        {entries.length > 0 && (
          <>
            <div className="lib-filter-seg" style={{ marginBottom: 10 }}>
              <button className={dashView === 'overview' ? 'is-active' : ''} onClick={() => setDashView('overview')}>Overview</button>
              <button className={dashView === 'army' ? 'is-active' : ''} onClick={() => setDashView('army')}>By Army</button>
              <button className={dashView === 'category' ? 'is-active' : ''} onClick={() => setDashView('category')}>By Category</button>
              <button className={dashView === 'timeline' ? 'is-active' : ''} onClick={() => setDashView('timeline')}>Timeline</button>
            </div>
            {dashView === 'overview' && (
              <>
                <div className="section-label">Your pipeline</div>
                <StagePipelineChart entries={entries} onStageClick={(id) => pushParams({ hobby: 'all', stage: id })} />
                <ThisMonthStats stageEvents={stageEvents} onStageClick={(id) => pushParams({ hobby: 'all', stage: id })} />
              </>
            )}
            {dashView === 'army' && (
              <>
                <div className="section-label">Models by army</div>
                <ModelsByArmyChart entries={entries} onArmyClick={(target) => pushParams(target)} />
              </>
            )}
            {dashView === 'category' && (
              <>
                <div className="section-label">Models by category</div>
                <ModelsByCategoryChart entries={entries} onCategoryClick={(id) => pushParams({ hobby: 'all', cat: id })} />
              </>
            )}
            {dashView === 'timeline' && (
              <>
                <div className="section-label">Pipeline over time</div>
                <div className="detail-sub" style={{ margin: '2px 2px 12px' }}>How many models reached each stage, month by month.</div>
                <PipelineTimelineChart stageEvents={stageEvents} onStageClick={(id) => pushParams({ hobby: 'all', stage: id })} />
              </>
            )}
          </>
        )}

        <div className="section-label">Projects</div>
        {projects.length > 0 && (
          <div className="hobbylog-list" style={{ marginBottom: 10 }}>
            {projects.map((project) => <ProjectCard key={project.id} project={project} entries={entries} onEdit={(id) => pushParams({ project: id })} />)}
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => pushParams({ project: 'new' })}>
          <Icon name="plus" size={14} /> New project
        </button>

        <div className="settings-group" style={{ marginTop: 20 }}>
          {HOBBIES.map((h) => {
            const n = hobbyCounts.get(h.id) || 0;
            return (
              <div key={h.id} className="settings-row" style={{ cursor: 'pointer' }} onClick={() => pushParams({ hobby: h.id })}>
                <div>
                  <div className="settings-row__label">{h.label}</div>
                  <div className="settings-row__desc">{n} unit{n === 1 ? '' : 's'} logged</div>
                </div>
                <Icon name="chevron" size={18} />
              </div>
            );
          })}
          {unsorted > 0 && (
            <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => pushParams({ hobby: 'all', faction: null })}>
              <div>
                <div className="settings-row__label">Not linked to a hobby</div>
                <div className="settings-row__desc">{unsorted} unit{unsorted === 1 ? '' : 's'}</div>
              </div>
              <Icon name="chevron" size={18} />
            </div>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => pushParams({ hobby: 'all' })}>
          Browse everything at once
        </button>
      </div>
    );
  }

  const isFlatAll = browseHobbyId === 'all';
  const hobby = HOBBIES.find((h) => h.id === browseHobbyId);
  const hasSystemLevel = !isFlatAll && hobby?.systems?.length > 1;

  // --- Level 0.5: pick a system within the hobby (multi-system hobbies only) ---
  if (!isFlatAll && hasSystemLevel && !browseSystemId) {
    const hobbyEntries = entries.filter((e) => e.hobbyId === browseHobbyId);
    const systemCounts = new Map();
    let generalCount = 0;
    hobbyEntries.forEach((e) => {
      const fac = e.factionId ? findFaction(e.factionId) : null;
      if (fac) systemCounts.set(fac.system, (systemCounts.get(fac.system) || 0) + 1);
      else generalCount++;
    });
    const ownedSystems = hobby.systems.filter((sys) => systemCounts.get(sys.id));

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="icon-btn" onClick={goBack}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>{hobby.label}</div>
          <button className="icon-btn" onClick={() => pushParams({ entry: 'new' })}><Icon name="plus" size={18} /></button>
        </div>
        {ownedSystems.length || generalCount ? (
          <div className="faction-tiles">
            {ownedSystems.map((sys) => (
              <DashTile key={sys.id} color="var(--gold)" count={systemCounts.get(sys.id)} label={sys.label} icon={<Icon name="shield" size={26} />} onClick={() => pushParams({ system: sys.id })} />
            ))}
            {generalCount > 0 && (
              <DashTile color="var(--ink-dim)" count={generalCount} label="General" icon={<Icon name="paintdrop" size={22} />} onClick={() => pushParams({ system: '__general__', faction: '__general__' })} />
            )}
          </div>
        ) : (
          <EmptyState icon="paintdrop" title="Nothing logged yet" sub="Tap + to log your first unit." />
        )}
      </div>
    );
  }

  // --- Level 1: pick a faction/category within the chosen hobby+system --
  if (!isFlatAll && !browseFactionId) {
    const hobbyEntries = entries.filter((e) => e.hobbyId === browseHobbyId);
    const factionCounts = new Map();
    let generalCount = 0;
    hobbyEntries.forEach((e) => { if (e.factionId) factionCounts.set(e.factionId, (factionCounts.get(e.factionId) || 0) + 1); else generalCount++; });
    const scopedFactionIds = hasSystemLevel
      ? [...factionCounts.keys()].filter((id) => findFaction(id)?.system === browseSystemId)
      : [...factionCounts.keys()];
    const ownedFactions = scopedFactionIds.map((id) => findFaction(id)).filter(Boolean);
    const titleLabel = hasSystemLevel ? hobby.systems.find((s) => s.id === browseSystemId)?.label : hobby?.label;

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="icon-btn" onClick={goBack}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>{titleLabel || 'Browse'}</div>
          <button className="icon-btn" onClick={() => pushParams({ entry: 'new' })}><Icon name="plus" size={18} /></button>
        </div>
        {ownedFactions.length || (!hasSystemLevel && generalCount) ? (
          <div className="faction-tiles">
            {ownedFactions.map((f) => (
              <DashTile key={f.id} color={f.color} count={factionCounts.get(f.id)} label={f.label} icon={<EmblemSvg emblemKey={f.emblem} size={30} />} onClick={() => pushParams({ faction: f.id })} />
            ))}
            {!hasSystemLevel && generalCount > 0 && (
              <DashTile color="var(--ink-dim)" count={generalCount} label="General" icon={<Icon name="paintdrop" size={22} />} onClick={() => pushParams({ faction: '__general__' })} />
            )}
          </div>
        ) : (
          <EmptyState icon="paintdrop" title="Nothing logged yet" sub={`Tap + to log your first ${(hobby?.groupLabel || 'unit').toLowerCase()}.`} />
        )}
      </div>
    );
  }

  // --- Level 2: the entry list, scoped to whatever was picked above -----
  const scopedEntries = isFlatAll ? entries : entries.filter((e) => (
    browseFactionId === '__general__' ? e.hobbyId === browseHobbyId && !e.factionId : e.hobbyId === browseHobbyId && e.factionId === browseFactionId
  ));
  const stageScoped = stageFilter === 'all' ? scopedEntries : scopedEntries.filter((e) => dominantStage(e) === stageFilter);
  // Category has no visible tab row of its own (stage already owns that
  // row) -- it only ever arrives as a landing state from the "By Category"
  // dashboard chart, shown as a clearable pill next to the title instead.
  const filtered = catFilter === 'all' ? stageScoped : stageScoped.filter((e) => (e.category || DEFAULT_MODEL_CATEGORY) === catFilter);
  const countFor = (s) => scopedEntries.filter((e) => dominantStage(e) === s).length;
  const titleLabel = isFlatAll ? 'All units' : browseFactionId === '__general__' ? 'General' : (findFaction(browseFactionId)?.label || 'Entries');
  const activeCategory = catFilter !== 'all' ? MODEL_CATEGORIES.find((c) => c.id === catFilter) : null;

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={goBack}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{titleLabel}</div>
        <button className="icon-btn" onClick={() => pushParams({ entry: 'new' })}><Icon name="plus" size={18} /></button>
      </div>
      {isFlatAll && (
        <div className="detail-sub" style={{ marginBottom: 14 }}>
          Track every unit you're building and painting, separate from the step-by-step recipes themselves.
          Mark public entries to share them on your profile.
        </div>
      )}
      {activeCategory && (
        <div className="hoblog-month-stat" style={{ '--chip-color': activeCategory.color, marginBottom: 12, width: 'fit-content' }}>
          Category: {activeCategory.label}
          <button type="button" aria-label="Clear category filter" onClick={() => replaceParams({ cat: null })} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 6, display: 'inline-flex' }}>
            <Icon name="x" size={11} />
          </button>
        </div>
      )}

      <div className="lib-filter-seg lib-filter-seg--wrap">
        <button className={stageFilter === 'all' ? 'is-active' : ''} onClick={() => replaceParams({ stage: null })}>All <span className="b">{scopedEntries.length}</span></button>
        {HOBBY_STAGES.map((s) => (
          <button key={s.id} className={stageFilter === s.id ? 'is-active' : ''} onClick={() => replaceParams({ stage: s.id })}>{s.label} <span className="b">{countFor(s.id)}</span></button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState icon="paintdrop" title="Nothing here yet" sub="Tap + to log a unit you're working on." />
      ) : (
        <div className="hobbylog-list">
          {filtered.map((entry) => <EntryCard key={entry.id} entry={entry} onEdit={(id) => pushParams({ entry: id })} />)}
        </div>
      )}
    </div>
  );
}
