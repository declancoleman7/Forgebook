import { useEffect, useState } from 'react';
import Icon from '../icons.jsx';
import { faction } from '../data/factions.js';

// Same searchable multi-select modal shape as RecipePicker -- a Project
// links several of the user's own units toward one goal, and a unit can
// belong to more than one Project at once, same "toggle in place" pattern.
export default function EntryPicker({ entries, selectedIds, onToggle, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? entries.filter((e) => e.title.toLowerCase().includes(q) || (e.factionId ? faction(e.factionId).label.toLowerCase().includes(q) : false))
    : entries;

  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="paint-picker__panel">
        <div className="paint-picker__header">
          <div className="paint-picker__title">Link units</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={18} /></button>
        </div>
        <div className="paint-picker__search">
          <Icon name="search" size={15} />
          <input type="text" placeholder="Search your units" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="paint-picker__body">
          {filtered.length ? filtered.map((entry) => {
            const f = entry.factionId ? faction(entry.factionId) : null;
            const isSelected = selectedIds.has(entry.id);
            return (
              <button type="button" key={entry.id} className={`paint-picker__row ${isSelected ? 'is-selected' : ''}`} onClick={() => onToggle(entry)}>
                <span className="paint-pick-row__swatch" style={{ background: f?.color || 'var(--ink-dim)' }} />
                <div className="paint-picker__row-info">
                  <div className="paint-row__name">{entry.title} <span className="hobbylog-card__qty">×{entry.quantity}</span></div>
                  <div className="paint-row__brand">{f ? f.label : 'General'}</div>
                </div>
                {isSelected && <Icon name="check" size={16} />}
              </button>
            );
          }) : <div className="empty-state__sub" style={{ padding: '20px 0' }}>{q ? 'No matches.' : "You don't have any units yet."}</div>}
        </div>
        <div className="filter-overlay__footer">
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>Done{selectedIds.size ? ` (${selectedIds.size} linked)` : ''}</button>
        </div>
      </div>
    </div>
  );
}
