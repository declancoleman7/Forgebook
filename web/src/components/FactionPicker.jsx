import { useEffect, useMemo, useState } from 'react';
import Icon from '../icons.jsx';
import EmblemSvg from './EmblemSvg.jsx';

function FactionRow({ f, isSelected, onPick }) {
  return (
    <button type="button" className={`paint-picker__row ${isSelected ? 'is-selected' : ''}`} onClick={() => onPick(f.id)}>
      <span className="emblem-badge emblem-badge--sm" style={{ '--faction-color': f.color }}><EmblemSvg emblemKey={f.emblem} size={17} /></span>
      <div className="paint-picker__row-info">
        <div className="paint-row__name">{f.label}</div>
        {f.alliance && <div className="paint-row__brand">{f.alliance}</div>}
      </div>
    </button>
  );
}

// A searchable overlay for picking one faction/army out of a long list --
// same panel/row shell as PaintPicker.jsx (search input, scrollable body,
// selected-row highlight), swapping a colour swatch for an emblem badge.
// Was previously a plain <optgroup>-grouped <select>, unusable once a hobby
// has 270+ entries (Warhammer's combined systems). Grouped by system when
// one is given (Warhammer); D&D's flatBrowse hobby has none, so it's just
// one flat list there, same as its own browse page treats it.
export default function FactionPicker({ factions, systems, allowNone, groupLabel, currentId, onPick, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const filtered = q ? factions.filter((f) => f.label.toLowerCase().includes(q)) : factions;

  const groups = useMemo(() => {
    if (!systems?.length) return [{ label: null, items: filtered }];
    return systems
      .map((sys) => ({ label: sys.label, items: filtered.filter((f) => f.system === sys.id) }))
      .filter((g) => g.items.length);
  }, [filtered, systems]);

  const pick = (id) => { onPick(id); onClose(); };

  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="paint-picker__panel">
        <div className="paint-picker__header">
          <div className="paint-picker__title">Choose your {groupLabel ? groupLabel.toLowerCase() : 'faction'}</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={18} /></button>
        </div>
        <div className="paint-picker__search">
          <Icon name="search" size={15} />
          <input type="text" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="paint-picker__body">
          {allowNone && !q && (
            <button type="button" className={`paint-picker__row ${!currentId ? 'is-selected' : ''}`} onClick={() => pick('')}>
              <div className="paint-picker__row-info"><div className="paint-row__name">None</div></div>
            </button>
          )}
          {groups.some((g) => g.items.length) ? groups.map((g) => (
            <div key={g.label || 'all'}>
              {g.label && <div className="section-label" style={{ margin: '10px 16px 4px' }}>{g.label}</div>}
              {g.items.map((f) => <FactionRow key={f.id} f={f} isSelected={currentId === f.id} onPick={pick} />)}
            </div>
          )) : <div className="empty-state__sub" style={{ padding: '20px 0' }}>No matches.</div>}
        </div>
      </div>
    </div>
  );
}
