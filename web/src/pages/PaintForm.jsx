import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Icon from '../icons.jsx';
import { PAINT_BRANDS, PAINT_TYPES, paintTypeKey } from '../data/paints.js';
import { useMyPaints, useSavePaint } from '../queries/usePaints.js';
import { useToast } from '../toast/ToastContext.jsx';
import { getRecipeDraft, setRecipeDraft } from '../state/recipeDraft.js';
import { containsBlockedContent } from '../utils/moderation.js';

// Ported from the old app's viewPaintForm()/bindPaintForm() -- add a
// brand-new custom paint to the rack, or edit an existing one's name/brand/
// hex/type (library-backed rows skip this entirely, see PaintDetail.jsx).
// Reachable two ways: directly from My Rack/Paint Detail (?edit=<id>), or
// mid-recipe via a step's "+ New" button, which needs the half-written
// recipe form to survive this round trip -- see state/recipeDraft.js.
export default function PaintForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const { data: myPaints } = useMyPaints();
  const savePaint = useSavePaint();

  const editId = searchParams.get('edit');
  const returnStepId = location.state?.returnToRecipe;
  const existing = editId ? myPaints?.find((p) => p.id === editId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [brand, setBrand] = useState(existing?.brand || 'Citadel');
  const [type, setType] = useState(existing?.type || 'Base');
  const [hex, setHex] = useState(existing?.hex || '#c9a227');

  if (editId && myPaints && !existing) {
    return null; // paint vanished from the rack mid-edit -- nothing sane to show
  }

  const goBackToRecipe = () => {
    const draft = getRecipeDraft();
    if (draft?.id) navigate(`/recipe/${draft.id}/edit`);
    else navigate('/recipe-new');
  };

  const cancel = () => {
    if (returnStepId !== undefined) goBackToRecipe();
    else navigate('/paints');
  };

  const save = async () => {
    if (!name.trim()) { showToast('Give the paint a name first'); return; }
    if (containsBlockedContent(name)) { showToast("That name isn't allowed — please rephrase it"); return; }
    const dupe = myPaints?.find((p) => p.id !== editId && paintTypeKey(p.name, p.brand, p.type) === paintTypeKey(name, brand, type));
    if (dupe) { showToast('That paint is already on your rack'); return; }

    showToast('Saving…');
    try {
      const saved = await savePaint.mutateAsync({ id: editId || null, name: name.trim(), brand, hex, type });
      showToast('Paint saved');
      if (returnStepId !== undefined) {
        const draft = getRecipeDraft();
        if (draft) {
          const step = draft.steps.find((s) => s.id === returnStepId);
          if (step) { step.paintId = saved.id; step.wantPaint = undefined; }
          setRecipeDraft(draft);
        }
        goBackToRecipe();
      } else {
        navigate(`/paint/${saved.id}`);
      }
    } catch (e) {
      showToast(e.message || "Couldn't save that — try again.");
    }
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={cancel}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>{editId ? 'Edit Paint' : 'New Paint'}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="paint-hero" style={{ background: hex }} />

      <div className="field">
        <label>Paint name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warboss Green" />
      </div>

      <div className="field">
        <label>Brand</label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          {PAINT_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {PAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Colour</label>
        <div className="field-hex-row">
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} />
          <span className="paint-row__hex">{hex}</span>
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn btn-ghost btn-block" onClick={cancel}>Cancel</button>
        <button className="btn btn-primary btn-block" onClick={save}>Save paint</button>
      </div>
    </div>
  );
}
