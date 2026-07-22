import { useEffect, useState } from 'react';
import Icon from '../icons.jsx';
import { faction } from '../data/factions.js';

// Same searchable-modal shape as PaintPicker, but multi-select (checkbox
// rows that toggle in place) rather than single-pick-and-close, since a
// hobby log entry can reference more than one recipe (e.g. an armour
// recipe plus a separate base recipe).
export default function RecipePicker({ recipes, selectedIds, onToggle, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? recipes.filter((r) => r.name.toLowerCase().includes(q) || (r.unit || '').toLowerCase().includes(q) || faction(r.faction).label.toLowerCase().includes(q))
    : recipes;

  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="paint-picker__panel">
        <div className="paint-picker__header">
          <div className="paint-picker__title">Link recipes</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={18} /></button>
        </div>
        <div className="paint-picker__search">
          <Icon name="search" size={15} />
          <input type="text" placeholder="Search your recipes" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="paint-picker__body">
          {filtered.length ? filtered.map((r) => {
            const f = faction(r.faction);
            const isSelected = selectedIds.has(r.id);
            return (
              <button type="button" key={r.id} className={`paint-picker__row ${isSelected ? 'is-selected' : ''}`} onClick={() => onToggle(r)}>
                <span className="paint-pick-row__swatch" style={{ background: f.color }} />
                <div className="paint-picker__row-info">
                  <div className="paint-row__name">{r.name}</div>
                  <div className="paint-row__brand">{f.label}{r.unit ? ` · ${r.unit}` : ''}</div>
                </div>
                {isSelected && <Icon name="check" size={16} />}
              </button>
            );
          }) : <div className="empty-state__sub" style={{ padding: '20px 0' }}>{q ? 'No matches.' : "You don't have any recipes yet."}</div>}
        </div>
        <div className="filter-overlay__footer">
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>Done{selectedIds.size ? ` (${selectedIds.size} linked)` : ''}</button>
        </div>
      </div>
    </div>
  );
}
