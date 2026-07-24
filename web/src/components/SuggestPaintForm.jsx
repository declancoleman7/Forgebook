import { useState } from 'react';
import { useSubmitPaintSuggestion } from '../queries/usePaintSuggestions.js';
import { useToast } from '../toast/ToastContext.jsx';
import { containsBlockedContent } from '../utils/moderation.js';

// A missing paint (or a whole missing range, e.g. "the Vallejo Xpress Color
// line") goes to admins for review, not straight into PAINT_LIBRARY --
// that's a static bundled file, not a live table, so "approved" just means
// an admin has judged it worth adding in a future library update, not that
// it appears immediately. Same modal shell as ConfirmContext's own dialog
// (.confirm-overlay/.confirm-dialog), just with real form fields instead of
// a plain message.
export default function SuggestPaintForm({ prefill, onClose }) {
  const showToast = useToast();
  const submit = useSubmitPaintSuggestion();
  const [name, setName] = useState(prefill?.name || '');
  const [brand, setBrand] = useState(prefill?.brand || '');
  const [type, setType] = useState(prefill?.type || '');
  const [notes, setNotes] = useState('');

  const save = async () => {
    if (!name.trim()) { showToast('Give it a name -- a specific paint, or a range like "Vallejo Xpress Color"'); return; }
    if (containsBlockedContent(name) || containsBlockedContent(notes)) { showToast("That text isn't allowed — please rephrase it"); return; }
    try {
      await submit.mutateAsync({
        name: name.trim(), brand: brand.trim() || null, type: type.trim() || null,
        hex: prefill?.hex || null, notes: notes.trim() || null,
      });
      showToast('Thanks — sent to the admins for review');
      onClose();
    } catch (e) {
      showToast(e.message || "Couldn't send that — try again.");
    }
  };

  return (
    <div className="confirm-overlay">
      <div className="confirm-overlay__backdrop" onClick={onClose} />
      <div className="confirm-dialog" role="dialog" aria-modal="true" style={{ textAlign: 'left', maxWidth: 380, width: '92vw' }}>
        <div className="confirm-dialog__message" style={{ marginBottom: 4 }}>Suggest a paint or range</div>
        <div className="label-hint" style={{ marginBottom: 14 }}>Missing a paint, or a whole range? This goes to the admins to review -- good suggestions get added to the library in a future update.</div>

        <div className="field">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Warboss Green, or "Xpress Color range"' autoFocus />
        </div>
        <div className="field">
          <label>Brand <span className="label-hint">optional</span></label>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Vallejo" />
        </div>
        <div className="field">
          <label>Type <span className="label-hint">optional</span></label>
          <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Base, Wash, Metallic..." />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Notes <span className="label-hint">optional</span></label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth knowing -- what it's similar to, a link, etc." />
        </div>

        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={submit.isPending} onClick={save}>Send suggestion</button>
        </div>
      </div>
    </div>
  );
}
