import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { PAINT_LIBRARY, paintKey } from '../data/paints.js';
import { useMyPaints, useUpdateQuantity, useToggleRestock, useDeletePaint } from '../queries/usePaints.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';

export default function PaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showToast = useToast();
  const { data: paints } = useMyPaints();
  const { inc, dec } = useUpdateQuantity();
  const toggleRestock = useToggleRestock();
  const deletePaint = useDeletePaint();

  const p = paints?.find((x) => x.id === id);
  if (!p) return <EmptyState icon="paintdrop" title="Paint not found" sub="It may have been removed from the rack." />;

  // Library-backed rows (added via the library's own "add to rack") only
  // let the rack track quantity/restock -- name/brand/hex/type are edited
  // at the library level so paintKey()-based lookups (ratings, notes,
  // "find similar") never silently fork. A genuinely custom paint (Stage 3
  // batch 5's paint form) still gets the full editor.
  const fromLibrary = !!PAINT_LIBRARY.find((x) => paintKey(x.name, x.brand) === paintKey(p.name, p.brand));

  const doDec = async () => {
    const next = (p.quantity || 1) - 1;
    if (next <= 0) {
      if (await confirm(`Remove ${p.name} from your rack?`)) {
        await deletePaint.mutateAsync(p.id);
        showToast('Removed from rack');
        navigate('/paints');
      }
      return;
    }
    dec(p.id, p.quantity);
  };

  const doDelete = async () => {
    if (await confirm(`Remove ${p.name} from your rack?`)) {
      await deletePaint.mutateAsync(p.id);
      showToast('Removed from rack');
      navigate('/paints');
    }
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/paints')}><Icon name="back" size={18} /></button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!fromLibrary && <button className="icon-btn" onClick={() => navigate(`/paint-new?edit=${p.id}`)}><Icon name="edit" size={16} /></button>}
          <button className="icon-btn" onClick={doDelete}><Icon name="trash" size={16} /></button>
        </div>
      </div>

      <div className="paint-hero" style={{ background: p.hex }} />
      <div className="detail-title">{p.name}</div>
      <div className="detail-sub">{p.brand || 'Unbranded'} · {p.type || 'Other'} · <span className="paint-row__hex">{p.hex}</span></div>
      {fromLibrary && <div className="fine-print" style={{ marginTop: 4 }}>From the paint library — your rack only tracks whether you own it.</div>}

      <div className="settings-group" style={{ margin: '16px 0' }}>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Quantity</div>
            <div className="settings-row__desc">How many pots you've got on the rack.</div>
          </div>
          <div className="lib-row__qty">
            <button className="lib-row__qty-btn" aria-label="Decrease quantity" onClick={doDec}>−</button>
            <span className="lib-row__qty-n">{p.quantity || 1}</span>
            <button className="lib-row__qty-btn" aria-label="Increase quantity" onClick={() => inc(p.id, p.quantity)}>+</button>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Need to buy</div>
            <div className="settings-row__desc">Flag this one for restocking next time you're shopping.</div>
          </div>
          <button className={`btn ${p.needsRestock ? 'btn-danger' : 'btn-ghost'} btn-sm`} onClick={() => toggleRestock(p.id, p.needsRestock)}>
            {p.needsRestock ? 'Flagged' : 'Flag it'}
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Similar colours</div>
            <div className="settings-row__desc">See who else makes something close, across every brand.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand || '')}`)}>Find</button>
        </div>
      </div>

      {/* "Used In" needs the recipes data layer -- Stage 3 batch 4. */}
      <div className="section-label">Used In</div>
      <div className="empty-state__sub">Not used in any recipe yet.</div>
    </div>
  );
}
