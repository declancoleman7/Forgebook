import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PaintPicker from '../components/PaintPicker.jsx';
import { useActiveHobby } from '../hooks/useActiveHobby.js';
import { faction, HOBBIES } from '../data/factions.js';
import { TECHNIQUES, paintKey } from '../data/paints.js';
import { downscaleImage } from '../utils/image.js';
import { useMyRecipes, useVisibleRecipes, usePushRecipe, useUploadRecipePhoto } from '../queries/useRecipes.js';
import { useMyPaints, useWantToBuy, useToggleWanted } from '../queries/usePaints.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import { getRecipeDraft, setRecipeDraft, clearRecipeDraft } from '../state/recipeDraft.js';

function newStep() {
  // mixPaintId is undefined (not "") when there's no mix at all -- that's
  // what tells the form whether to show the "+ Mix in a second paint"
  // button or the expanded second-paint picker. wantPaint/mixWantPaint hold
  // a snapshot ({name,brand,hex,type}) of a library paint picked that isn't
  // on the rack yet -- exactly one of paintId/wantPaint (same for the mix
  // pair) is ever set at a time.
  return {
    id: 'ns' + Math.random().toString(36).slice(2, 9),
    technique: TECHNIQUES[0], paintId: '', wantPaint: undefined,
    notes: '', area: '', mixPaintId: undefined, mixWantPaint: undefined, mixRatio: '',
  };
}

function generateId(facId, myRecipes) {
  const prefix = (faction(facId).label.match(/[A-Za-z]/g) || ['R']).slice(0, 3).join('').toUpperCase();
  let n = myRecipes.filter((r) => r.id.startsWith(prefix + '-')).length + 1;
  let id = `${prefix}-${String(n).padStart(3, '0')}`;
  while (myRecipes.some((r) => r.id === id)) { n++; id = `${prefix}-${String(n).padStart(3, '0')}`; }
  return id;
}

// Ported from the old app's viewRecipeForm()/bindRecipeForm() plus its
// supporting paint-picker overlay. The half-written form lives in local
// state (not global module state like the old app), except for the one
// case that needs to survive a real unmount: a step's "+ New" button,
// which round-trips through /paint-new -- see state/recipeDraft.js.
export default function RecipeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { data: myRecipes, isLoading } = useMyRecipes();
  const existing = isEdit ? myRecipes?.find((r) => r.id === id) : null;

  if (isEdit && isLoading) return <div className="empty-state__sub">Loading…</div>;
  if (isEdit && !existing) return <EmptyState icon="search" title="Recipe not found" sub="It may have been deleted." />;

  return <RecipeFormInner key={id || 'new'} existing={existing} myRecipes={myRecipes || []} />;
}

function RecipeFormInner({ existing, myRecipes }) {
  const navigate = useNavigate();
  const activeHobby = useActiveHobby();
  const confirm = useConfirm();
  const showToast = useToast();
  const { data: visibleRecipes = [] } = useVisibleRecipes();
  const { data: myPaints = [] } = useMyPaints();
  const { data: wantedKeys = [] } = useWantToBuy();
  const toggleWanted = useToggleWanted();
  const pushRecipe = usePushRecipe();
  const uploadPhoto = useUploadRecipePhoto();

  const draftCandidate = getRecipeDraft();
  const draftMatches = draftCandidate && (existing ? draftCandidate.id === existing.id : !draftCandidate.id);

  const [recipe, setRecipe] = useState(() => {
    if (draftMatches) { clearRecipeDraft(); return draftCandidate; }
    if (existing) return { ...JSON.parse(JSON.stringify(existing)), unit: existing.unit || '', originalPhoto: existing.photo || null };
    return {
      id: null, name: '', faction: activeHobby.factions[0].id, unit: '',
      hobbyId: activeHobby.id, difficulty: 2, photo: null, photoPath: null, originalPhoto: null,
      steps: [newStep()], notes: '', published: false,
    };
  });
  const snapshotRef = useRef(JSON.stringify(recipe));
  const photoInputRef = useRef(null);
  const [picker, setPicker] = useState(null); // { stepId, field } | null

  const hobby = HOBBIES.find((h) => h.id === recipe.hobbyId) || activeHobby;
  const unitSuggestions = [...new Set(visibleRecipes.map((r) => r.unit).filter(Boolean))].sort();
  const areaSuggestions = [...new Set(recipe.steps.map((s) => s.area).filter(Boolean))];
  const rackEmpty = myPaints.length === 0;

  const patch = (fields) => setRecipe((r) => ({ ...r, ...fields }));
  const updateStep = (stepId, fields) => setRecipe((r) => ({ ...r, steps: r.steps.map((s) => (s.id === stepId ? { ...s, ...fields } : s)) }));

  const resolveStepPaint = (step, field) => {
    const pid = step[field];
    if (pid) return myPaints.find((p) => p.id === pid) || null;
    const want = step[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
    if (!want) return null;
    const owned = myPaints.find((p) => paintKey(p.name, p.brand) === paintKey(want.name, want.brand));
    return owned || { ...want, isWant: true };
  };

  const addStep = () => setRecipe((r) => ({ ...r, steps: [...r.steps, newStep()] }));
  const insertStepAfter = (stepId) => setRecipe((r) => {
    const i = r.steps.findIndex((s) => s.id === stepId);
    const steps = [...r.steps];
    steps.splice(i + 1, 0, newStep());
    return { ...r, steps };
  });
  const moveStep = (stepId, dir) => setRecipe((r) => {
    const i = r.steps.findIndex((s) => s.id === stepId);
    const j = i + dir;
    if (j < 0 || j >= r.steps.length) return r;
    const steps = [...r.steps];
    const [s] = steps.splice(i, 1);
    steps.splice(j, 0, s);
    return { ...r, steps };
  });
  const removeStep = (stepId) => setRecipe((r) => ({ ...r, steps: r.steps.filter((s) => s.id !== stepId) }));

  const addMix = (stepId) => updateStep(stepId, { mixPaintId: '', mixRatio: recipe.steps.find((s) => s.id === stepId)?.mixRatio || '1:1' });
  const removeMix = (stepId) => updateStep(stepId, { mixPaintId: undefined, mixWantPaint: undefined, mixRatio: '' });

  const openPicker = (stepId, field) => setPicker({ stepId, field });
  const onPickPaint = (entry, owned) => {
    const { stepId, field } = picker;
    const wantField = field === 'paintId' ? 'wantPaint' : 'mixWantPaint';
    updateStep(stepId, owned ? { [field]: owned.id, [wantField]: undefined } : { [field]: '', [wantField]: { name: entry.name, brand: entry.brand, hex: entry.hex, type: entry.type } });
    if (!owned && !wantedKeys.includes(paintKey(entry.name, entry.brand))) toggleWanted.mutate({ name: entry.name, brand: entry.brand, wanted: false });
    setPicker(null);
  };

  const quickPaint = (stepId) => {
    setRecipeDraft(recipe);
    navigate('/paint-new', { state: { returnToRecipe: stepId } });
  };

  const onPhotoChosen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await downscaleImage(file, 900);
    if (!url) { showToast('That image could not be read'); return; }
    patch({ photo: url });
  };

  const togglePublished = () => {
    if (!recipe.published && !recipe.photo) { showToast('Add a photo first — published recipes need one so the feed has something to show'); return; }
    patch({ published: !recipe.published });
  };

  const cancel = async () => {
    const dirty = JSON.stringify(recipe) !== snapshotRef.current;
    if (dirty && !(await confirm('Discard your changes to this recipe?', { okLabel: 'Discard', cancelLabel: 'Keep editing' }))) return;
    clearRecipeDraft();
    navigate(recipe.id ? `/recipe/${recipe.id}` : '/home');
  };

  const save = async () => {
    if (!recipe.name.trim()) { showToast('Give the recipe a name first'); return; }
    const steps = recipe.steps.filter((s) => s.paintId || s.wantPaint);
    if (!steps.length) { showToast('Add at least one step with a paint'); return; }
    if (recipe.published && !recipe.photo) { showToast('Add a photo before publishing, or turn off sharing'); return; }

    const isNew = !recipe.id;
    const id = isNew ? generateId(recipe.faction, myRecipes) : recipe.id;
    let photoPath = recipe.photo !== (recipe.originalPhoto || null) ? null : (recipe.photoPath || null);

    if (recipe.photo && String(recipe.photo).startsWith('data:')) {
      showToast('Uploading photo…');
      try {
        photoPath = await uploadPhoto.mutateAsync({ dataUrl: recipe.photo, recipeId: id });
      } catch {
        showToast("Couldn't upload that photo — try again");
        return;
      }
    }

    const payload = {
      id, name: recipe.name.trim(), faction: recipe.faction, unit: recipe.unit.trim() || null,
      hobbyId: recipe.hobbyId || 'warhammer', difficulty: recipe.difficulty, photoPath,
      steps, notes: recipe.notes, published: !!recipe.published, updatedAt: new Date().toISOString(),
    };

    showToast('Saving…');
    try {
      await pushRecipe.mutateAsync(payload);
      clearRecipeDraft();
      showToast('Recipe saved');
      navigate(`/recipe/${payload.id}`);
    } catch (e) {
      showToast(e.message || "Couldn't save that — try again.");
    }
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={cancel}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{recipe.id ? 'Edit Recipe' : 'New Recipe'}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="field">
        <label>Recipe name</label>
        <input type="text" value={recipe.name} onChange={(e) => patch({ name: e.target.value })} placeholder={hobby.namePlaceholder} />
      </div>

      <div className="field">
        <label>{hobby.groupLabel}</label>
        <select value={recipe.faction} onChange={(e) => patch({ faction: e.target.value })}>
          {hobby.flatBrowse
            ? hobby.factions.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)
            : hobby.systems.map((sys) => (
                <optgroup key={sys.id} label={sys.label}>
                  {hobby.factions.filter((f) => f.system === sys.id).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </optgroup>
              ))}
        </select>
      </div>

      <div className="field">
        <label>Unit <span className="label-hint">leave blank for a General, {hobby.groupLabel.toLowerCase()}-wide recipe</span></label>
        <input type="text" list="unit-suggestions" value={recipe.unit} onChange={(e) => patch({ unit: e.target.value })} placeholder={hobby.unitPlaceholder} />
        <datalist id="unit-suggestions">{unitSuggestions.map((u) => <option key={u} value={u} />)}</datalist>
      </div>

      <div className="field">
        <label>Difficulty</label>
        <div className="difficulty-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} className={recipe.difficulty === n ? 'is-selected' : ''} onClick={() => patch({ difficulty: n })}>{n}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Sharing</label>
        <div className={`share-toggle ${recipe.published ? 'is-on' : ''}`} onClick={togglePublished}>
          <div className="share-toggle__text">
            <strong>Share this recipe</strong>
            <span>Visible to everyone else in Forgebook, listed under its {hobby.groupLabel.toLowerCase()} and unit.</span>
          </div>
          <div className="share-toggle__switch"><i /></div>
        </div>
      </div>

      <div className="field">
        <label>Photo of the finished mini <span className="label-hint">{recipe.published ? 'required to share' : 'optional'}</span></label>
        <div className="photo-field">
          {recipe.photo ? (
            <>
              <div className="photo-field__preview" style={{ backgroundImage: `url('${recipe.photo}')` }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => photoInputRef.current?.click()}>Replace</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => patch({ photo: null })}>Remove</button>
            </>
          ) : (
            <button type="button" className="repeater-add" style={{ margin: 0 }} onClick={() => photoInputRef.current?.click()}>+ Add photo</button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChosen} />
        </div>
      </div>

      <div className="section-label">Method steps</div>
      {rackEmpty && <div className="notice">Your paint rack is empty — pick a paint from the full library below and it'll go on your buy list, or add one to your rack first.</div>}

      {recipe.steps.map((s, i) => {
        const p = resolveStepPaint(s, 'paintId');
        const mixP = (s.mixPaintId !== undefined || s.mixWantPaint !== undefined) ? resolveStepPaint(s, 'mixPaintId') : null;
        const hasMix = s.mixPaintId !== undefined || s.mixWantPaint !== undefined;
        return (
          <div key={s.id}>
            <div className="repeater-item">
              <div className="repeater-item__header">
                <span className="repeater-item__num">Step {i + 1}</span>
                <div className="repeater-item__controls">
                  <button type="button" className="icon-btn-sm" disabled={i === 0} aria-label="Move step up" onClick={() => moveStep(s.id, -1)}><Icon name="chevron" size={13} /></button>
                  <button type="button" className="icon-btn-sm repeater-item__down" disabled={i === recipe.steps.length - 1} aria-label="Move step down" onClick={() => moveStep(s.id, 1)}><Icon name="chevron" size={13} /></button>
                  {recipe.steps.length > 1 && <button type="button" className="repeater-item__remove" aria-label="Remove step" onClick={() => removeStep(s.id)}>&times;</button>}
                </div>
              </div>

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Technique</label>
                <div className="tech-picker">
                  {TECHNIQUES.map((t) => <button type="button" key={t} className={s.technique === t ? 'is-selected' : ''} onClick={() => updateStep(s.id, { technique: t })}>{t}</button>)}
                </div>
              </div>

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Paint</label>
                <div className="paint-pick-row">
                  <button type="button" className="paint-pick-trigger" onClick={() => openPicker(s.id, 'paintId')}>
                    <span className="paint-pick-row__swatch" style={{ background: p ? p.hex : 'transparent' }} />
                    <span className="paint-pick-trigger__label">{p ? `${p.name}${p.brand ? ` (${p.brand})` : ''}` : <span className="paint-pick-trigger__placeholder">Choose a paint…</span>}</span>
                    {p?.isWant && <span className="paint-picker__want-tag">Not on rack</span>}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => quickPaint(s.id)}>+ New</button>
                </div>
              </div>

              {hasMix ? (
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Mixed with <span className="label-hint">a second paint, blended with the one above</span></label>
                  <div className="paint-pick-row">
                    <button type="button" className="paint-pick-trigger" onClick={() => openPicker(s.id, 'mixPaintId')}>
                      <span className="paint-pick-row__swatch" style={{ background: mixP ? mixP.hex : 'transparent' }} />
                      <span className="paint-pick-trigger__label">{mixP ? `${mixP.name}${mixP.brand ? ` (${mixP.brand})` : ''}` : <span className="paint-pick-trigger__placeholder">Choose a paint…</span>}</span>
                      {mixP?.isWant && <span className="paint-picker__want-tag">Not on rack</span>}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMix(s.id)}>Remove</button>
                  </div>
                  <input type="text" value={s.mixRatio || ''} onChange={(e) => updateStep(s.id, { mixRatio: e.target.value })} placeholder="Ratio, e.g. 1:1" style={{ marginTop: 8 }} />
                </div>
              ) : (
                <button type="button" className="repeater-add" style={{ margin: '0 0 10px' }} onClick={() => addMix(s.id)}>+ Mix in a second paint</button>
              )}

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Group <span className="label-hint">optional — e.g. Armour, Base, Trim</span></label>
                <input type="text" list="area-suggestions" value={s.area || ''} onChange={(e) => updateStep(s.id, { area: e.target.value })} placeholder="e.g. Armour" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Notes</label>
                <textarea value={s.notes} onChange={(e) => updateStep(s.id, { notes: e.target.value })} placeholder="e.g. two thin coats, let dry between" />
              </div>
            </div>
            <button type="button" className="repeater-insert" onClick={() => insertStepAfter(s.id)}>+ Insert step here</button>
          </div>
        );
      })}
      <datalist id="area-suggestions">{areaSuggestions.map((a) => <option key={a} value={a} />)}</datalist>
      <button type="button" className="repeater-add" onClick={addStep}>+ Add step</button>

      <div className="field">
        <label>Notes</label>
        <textarea value={recipe.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Variations, tips, anything worth remembering" />
      </div>

      <div className="detail-actions">
        <button className="btn btn-ghost btn-block" onClick={cancel}>Cancel</button>
        <button className="btn btn-primary btn-block" onClick={save}>Save recipe</button>
      </div>

      {picker && (
        <PaintPicker
          myPaints={myPaints}
          currentId={recipe.steps.find((s) => s.id === picker.stepId)?.[picker.field]}
          currentWant={recipe.steps.find((s) => s.id === picker.stepId)?.[picker.field === 'paintId' ? 'wantPaint' : 'mixWantPaint']}
          onPick={onPickPaint}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
