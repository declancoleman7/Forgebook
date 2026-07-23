import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipePicker from '../components/RecipePicker.jsx';
import EntryPicker from '../components/EntryPicker.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import HobbyStageStack from '../components/HobbyStageStack.jsx';
import { HOBBIES, faction as findFaction } from '../data/factions.js';
import { HOBBY_STAGES } from '../data/hobbyStages.js';
import { downscaleImage } from '../utils/image.js';
import { useMyHobbyLog, useCreateHobbyLogEntry, useUpdateHobbyLogEntry, useDeleteHobbyLogEntry, useUploadHobbyLogPhoto } from '../queries/useHobbyLog.js';
import { useMyHobbyProjects, useCreateHobbyProject, useUpdateHobbyProject, useDeleteHobbyProject } from '../queries/useHobbyProjects.js';
import { useMyRecipes } from '../queries/useRecipes.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

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

function StagePipelineChart({ entries }) {
  const totalMinis = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
  if (!totalMinis) return null;
  return (
    <div className="hoblog-chart">
      {HOBBY_STAGES.map((s) => {
        const n = entries.reduce((sum, e) => sum + (e.stageCounts?.[s.id] || 0), 0);
        const pct = Math.round((n / totalMinis) * 100);
        return (
          <div key={s.id} className="hoblog-chart__row">
            <span className="hoblog-chart__row-label">{s.label}</span>
            <div className="hoblog-chart__row-bar">
              <i style={{ width: `${pct}%`, background: s.color }} />
            </div>
            <span className="hoblog-chart__row-count">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

// Buckets FINISHED miniatures (not entries) by the month their entry was
// last updated -- there's no dedicated "finished at" timestamp, so this is
// a reasonable proxy, not an exact audit trail (editing a finished entry
// later nudges its month).
function FinishedTrendChart({ entries }) {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
  }
  const counts = months.map(({ key }) => entries.reduce((sum, e) => {
    const finished = e.stageCounts?.finished || 0;
    if (!finished || !e.updatedAt) return sum;
    const d = new Date(e.updatedAt);
    return `${d.getFullYear()}-${d.getMonth()}` === key ? sum + finished : sum;
  }, 0));
  const max = Math.max(1, ...counts);
  if (!counts.some((n) => n > 0)) return null;

  return (
    <div className="hoblog-trend">
      <div className="hoblog-trend__bars">
        {months.map((m, i) => (
          <div key={m.key} className="hoblog-trend__col">
            <span className="hoblog-trend__count">{counts[i] || ''}</span>
            <div className="hoblog-trend__track">
              <div className="hoblog-trend__bar" style={{ height: `${Math.max(4, (counts[i] / max) * 100)}%` }} />
            </div>
            <span className="hoblog-trend__label">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry, onEdit }) {
  const f = entry.factionId ? findFaction(entry.factionId) : null;
  return (
    <div className="hobbylog-card" onClick={() => onEdit(entry.id)}>
      <div className={`hobbylog-card__photo ${entry.photo ? 'has-photo' : ''}`} style={entry.photo ? { backgroundImage: `url('${entry.photo}')` } : undefined}>
        {!entry.photo && <Icon name="paintdrop" size={22} />}
      </div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span></div>
        <HobbyStageStack stageCounts={entry.stageCounts} quantity={entry.quantity} />
        <div className="hobbylog-card__meta">
          {f && <span className="hobbylog-card__tag" style={{ color: f.color }}>{f.label}</span>}
          {entry.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
          {entry.recipeLinks.length > 0 && <span className="hobbylog-card__recipes">{entry.recipeLinks.length} recipe{entry.recipeLinks.length === 1 ? '' : 's'}</span>}
        </div>
      </div>
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
  const photoInputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [entry, setEntry] = useState(() => existing
    ? { ...existing, originalPhoto: existing.photo || null }
    : { id: null, title: '', notes: '', quantity: 1, stageCounts: { unassembled: 1 }, hobbyId: prefill?.hobbyId || '', factionId: prefill?.factionId || '', photo: null, photoPath: null, originalPhoto: null, isPublic: false, recipeLinks: [] });

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
    const payload = {
      id: entry.id, title: entry.title.trim(), notes: entry.notes, quantity: entry.quantity, stageCounts: entry.stageCounts,
      hobbyId: entry.hobbyId || null, factionId: entry.factionId || null,
      photoPath, isPublic: entry.isPublic, recipeLinks: entry.recipeLinks,
    };
    try {
      if (entry.id) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
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
        <label>How many miniatures</label>
        <input type="number" min="0" value={entry.quantity} onChange={(e) => setQuantity(e.target.value)} />
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
          <select value={entry.factionId} onChange={(e) => patch({ factionId: e.target.value })}>
            <option value="">None</option>
            {factionsForHobby.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
      )}

      <div className="field">
        <label>Notes</label>
        <textarea rows={4} value={entry.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="What's the plan, what's left to do..." />
      </div>

      <div className="field">
        <label>Photo</label>
        <div className="photo-field">
          {entry.photo ? (
            <>
              <div className="photo-field__preview" style={{ backgroundImage: `url('${entry.photo}')` }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => photoInputRef.current?.click()}>Replace</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => patch({ photo: null, photoPath: null })}>Remove</button>
            </>
          ) : (
            <button type="button" className="repeater-add" style={{ margin: 0 }} onClick={() => photoInputRef.current?.click()}>+ Add photo</button>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChosen} />
      </div>

      {myRecipes.length > 0 && (
        <div className="field">
          <label>Recipes used <span className="label-hint">optional — link how you actually painted this</span></label>
          {linkedRecipes.length > 0 && (
            <div className="faction-row" style={{ marginBottom: 8 }}>
              {linkedRecipes.map((r) => (
                <div key={r.id} className="faction-chip is-active" style={{ '--chip-color': findFaction(r.faction).color }}>
                  {r.name}
                  <button type="button" aria-label={`Remove ${r.name}`} onClick={() => toggleRecipe(r)} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 4, display: 'inline-flex' }}>
                    <Icon name="x" size={11} />
                  </button>
                </div>
              ))}
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
  return (
    <div className="hobbylog-card" onClick={() => onEdit(project.id)}>
      <div className="hobbylog-card__photo"><Icon name="clipboard-check" size={22} /></div>
      <div className="hobbylog-card__body">
        <div className="hobbylog-card__title">{project.title}</div>
        <HobbyStageStack stageCounts={stageCounts} quantity={quantity} />
        <div className="hobbylog-card__meta">
          <span>{project.entryIds.length} unit{project.entryIds.length === 1 ? '' : 's'}</span>
          {project.isPublic && <span className="hobbylog-card__public" title="Visible on your public profile"><Icon name="user" size={11} /> Public</span>}
        </div>
      </div>
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
        <label>Units in this project</label>
        {linkedEntries.length > 0 && (
          <>
            <HobbyStageStack stageCounts={stageCounts} quantity={quantity} />
            <div className="faction-row" style={{ margin: '8px 0' }}>
              {linkedEntries.map((entry) => {
                const f = entry.factionId ? findFaction(entry.factionId) : null;
                return (
                  <div key={entry.id} className="faction-chip is-active" style={{ '--chip-color': f?.color || 'var(--ink-dim)', cursor: 'pointer' }} onClick={() => onOpenEntry(entry.id)} title={`Open ${entry.title}`}>
                    {entry.title} ×{entry.quantity}
                    <button type="button" aria-label={`Remove ${entry.title}`} onClick={(e) => { e.stopPropagation(); toggleEntry(entry); }} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 4, display: 'inline-flex' }}>
                      <Icon name="x" size={11} />
                    </button>
                  </div>
                );
              })}
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
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null); // null | 'new' | entry id
  const [editingProjectId, setEditingProjectId] = useState(null); // null | 'new' | project id
  // null = hobby-picker dashboard; 'all' = flat list of everything (the
  // escape hatch, same view this page used to open straight to);
  // otherwise a hobby id, drilling into that hobby's systems/factions below.
  const [browseHobbyId, setBrowseHobbyId] = useState(null);
  // Only meaningful for a hobby with more than one system (Warhammer: 40k/
  // AoS/Horus Heresy/etc, per data/factions.js's HOBBIES[].systems, the
  // same grouping Collection.jsx's own browse grid already uses) -- null
  // means "still picking a system," '__general__' means entries logged
  // against this hobby with no faction at all (can't belong to a system
  // without one), otherwise a system id.
  const [browseSystemId, setBrowseSystemId] = useState(null);
  // null = faction grid; '__general__' = this hobby's entries with no
  // faction set; otherwise a faction id, scoping the list to just that one.
  const [browseFactionId, setBrowseFactionId] = useState(null);

  if (editingId) {
    const existing = editingId === 'new' ? null : entries.find((e) => e.id === editingId);
    const prefill = editingId === 'new' && browseHobbyId && browseHobbyId !== 'all'
      ? { hobbyId: browseHobbyId, factionId: browseFactionId && browseFactionId !== '__general__' ? browseFactionId : '' }
      : null;
    return <EntryForm key={editingId} existing={existing} myRecipes={myRecipes} prefill={prefill} onClose={() => setEditingId(null)} />;
  }

  if (editingProjectId) {
    const existing = editingProjectId === 'new' ? null : projects.find((p) => p.id === editingProjectId);
    return <ProjectForm key={editingProjectId} existing={existing} entries={entries} onClose={() => setEditingProjectId(null)} onOpenEntry={setEditingId} />;
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
          <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
        </div>
        <div className="detail-sub" style={{ marginBottom: 14 }}>
          Track every unit you're building and painting, miniature by miniature. Pick a hobby to see the armies or categories you've logged something for.
        </div>
        {entries.length > 0 && (
          <>
            <div className="section-label">Your pipeline</div>
            <StagePipelineChart entries={entries} />
            <FinishedTrendChart entries={entries} />
          </>
        )}

        <div className="section-label">Projects</div>
        {projects.length > 0 && (
          <div className="hobbylog-list" style={{ marginBottom: 10 }}>
            {projects.map((project) => <ProjectCard key={project.id} project={project} entries={entries} onEdit={setEditingProjectId} />)}
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setEditingProjectId('new')}>
          <Icon name="plus" size={14} /> New project
        </button>

        <div className="settings-group" style={{ marginTop: 20 }}>
          {HOBBIES.map((h) => {
            const n = hobbyCounts.get(h.id) || 0;
            return (
              <div key={h.id} className="settings-row" style={{ cursor: 'pointer' }} onClick={() => setBrowseHobbyId(h.id)}>
                <div>
                  <div className="settings-row__label">{h.label}</div>
                  <div className="settings-row__desc">{n} unit{n === 1 ? '' : 's'} logged</div>
                </div>
                <Icon name="chevron" size={18} />
              </div>
            );
          })}
          {unsorted > 0 && (
            <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => { setBrowseHobbyId('all'); setBrowseFactionId(null); }}>
              <div>
                <div className="settings-row__label">Not linked to a hobby</div>
                <div className="settings-row__desc">{unsorted} unit{unsorted === 1 ? '' : 's'}</div>
              </div>
              <Icon name="chevron" size={18} />
            </div>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => setBrowseHobbyId('all')}>
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
          <button className="icon-btn" onClick={() => setBrowseHobbyId(null)}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>{hobby.label}</div>
          <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
        </div>
        {ownedSystems.length || generalCount ? (
          <div className="faction-tiles">
            {ownedSystems.map((sys) => (
              <DashTile key={sys.id} color="var(--gold)" count={systemCounts.get(sys.id)} label={sys.label} icon={<Icon name="shield" size={26} />} onClick={() => setBrowseSystemId(sys.id)} />
            ))}
            {generalCount > 0 && (
              <DashTile color="var(--ink-dim)" count={generalCount} label="General" icon={<Icon name="paintdrop" size={22} />} onClick={() => { setBrowseSystemId('__general__'); setBrowseFactionId('__general__'); }} />
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
    const goBack = () => (hasSystemLevel ? setBrowseSystemId(null) : setBrowseHobbyId(null));
    const titleLabel = hasSystemLevel ? hobby.systems.find((s) => s.id === browseSystemId)?.label : hobby?.label;

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="icon-btn" onClick={goBack}><Icon name="back" size={18} /></button>
          <div className="page-title" style={{ margin: 0 }}>{titleLabel || 'Browse'}</div>
          <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
        </div>
        {ownedFactions.length || (!hasSystemLevel && generalCount) ? (
          <div className="faction-tiles">
            {ownedFactions.map((f) => (
              <DashTile key={f.id} color={f.color} count={factionCounts.get(f.id)} label={f.label} icon={<EmblemSvg emblemKey={f.emblem} size={30} />} onClick={() => setBrowseFactionId(f.id)} />
            ))}
            {!hasSystemLevel && generalCount > 0 && (
              <DashTile color="var(--ink-dim)" count={generalCount} label="General" icon={<Icon name="paintdrop" size={22} />} onClick={() => setBrowseFactionId('__general__')} />
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
  const filtered = filter === 'all' ? scopedEntries : scopedEntries.filter((e) => dominantStage(e) === filter);
  const countFor = (s) => scopedEntries.filter((e) => dominantStage(e) === s).length;
  const titleLabel = isFlatAll ? 'All units' : browseFactionId === '__general__' ? 'General' : (findFaction(browseFactionId)?.label || 'Entries');
  // The Level 0.5 "General" tile jumps straight here (no faction to pick),
  // so going back has to retrace that same skip -- straight to the system
  // picker, not the faction grid it never actually showed.
  const goBack = () => {
    if (isFlatAll) { setBrowseHobbyId(null); return; }
    if (browseSystemId === '__general__') { setBrowseSystemId(null); setBrowseFactionId(null); return; }
    setBrowseFactionId(null);
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={goBack}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{titleLabel}</div>
        <button className="icon-btn" onClick={() => setEditingId('new')}><Icon name="plus" size={18} /></button>
      </div>
      {isFlatAll && (
        <div className="detail-sub" style={{ marginBottom: 14 }}>
          Track every unit you're building and painting, separate from the step-by-step recipes themselves.
          Mark public entries to share them on your profile.
        </div>
      )}

      <div className="lib-filter-seg lib-filter-seg--wrap">
        <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>All <span className="b">{scopedEntries.length}</span></button>
        {HOBBY_STAGES.map((s) => (
          <button key={s.id} className={filter === s.id ? 'is-active' : ''} onClick={() => setFilter(s.id)}>{s.label} <span className="b">{countFor(s.id)}</span></button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState icon="paintdrop" title="Nothing here yet" sub="Tap + to log a unit you're working on." />
      ) : (
        <div className="hobbylog-list">
          {filtered.map((entry) => <EntryCard key={entry.id} entry={entry} onEdit={setEditingId} />)}
        </div>
      )}
    </div>
  );
}
