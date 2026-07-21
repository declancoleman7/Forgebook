import { useEffect, useMemo, useState } from 'react';
import Icon from '../icons.jsx';
import { PAINT_LIBRARY, PAINT_CATEGORY_LABEL, paintCategory, paintKey } from '../data/paints.js';

function PickRow({ entry, owned, isSelected, onPick }) {
  return (
    <button type="button" className={`paint-picker__row ${isSelected ? 'is-selected' : ''}`} onClick={() => onPick(entry, owned)}>
      <span className="paint-pick-row__swatch" style={{ background: entry.hex }} />
      <div className="paint-picker__row-info">
        <div className="paint-row__name">{entry.name}</div>
        <div className="paint-row__brand">{entry.brand || ''}{entry.type ? ` · ${entry.type}` : ''}</div>
      </div>
      {owned ? null : <span className="paint-picker__want-tag">Not on rack</span>}
    </button>
  );
}

// Ported from the old app's paint picker overlay (openPaintPicker()/
// renderPaintPicker()) -- a searchable rack-vs-full-library modal in place
// of a plain <select>, which becomes unusable once a rack has more than a
// handful of entries. onPick(entry, ownedEntry) mirrors pickPaintForStep():
// ownedEntry is the matching rack row (with its own id) when there is one,
// otherwise entry is just a {name,brand,hex,type} snapshot to store as a
// "want" pick.
export default function PaintPicker({ myPaints, currentId, currentWant, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(myPaints.length ? 'rack' : 'library');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pool = tab === 'rack' ? myPaints : PAINT_LIBRARY;
  const brandOptions = useMemo(() => [...new Set(pool.map((p) => p.brand).filter(Boolean))].sort(), [pool]);

  const q = query.trim().toLowerCase();
  const ownedByKey = useMemo(() => new Map(myPaints.map((p) => [paintKey(p.name, p.brand), p])), [myPaints]);

  let rackList = useMemo(() => [...myPaints].sort((a, b) => a.name.localeCompare(b.name)), [myPaints]);
  let libList = PAINT_LIBRARY;
  if (q) {
    rackList = rackList.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    libList = libList.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }
  if (brands.length) { rackList = rackList.filter((p) => brands.includes(p.brand)); libList = libList.filter((p) => brands.includes(p.brand)); }
  if (categories.length) {
    rackList = rackList.filter((p) => categories.includes(paintCategory(p.type)));
    libList = libList.filter((p) => categories.includes(paintCategory(p.type)));
  }

  const toggleIn = (list, setList, val) => setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const switchTab = (t) => { setTab(t); setQuery(''); setBrands([]); };

  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="paint-picker__panel">
        <div className="paint-picker__header">
          <div className="paint-picker__title">Choose a paint</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={18} /></button>
        </div>
        <div className="paint-picker__search">
          <Icon name="search" size={15} />
          <input type="text" placeholder="Search by name or brand" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="lib-filter-seg paint-picker__tabs">
          <button type="button" className={tab === 'rack' ? 'is-active' : ''} onClick={() => switchTab('rack')}>On rack <span className="b">{myPaints.length}</span></button>
          <button type="button" className={tab === 'library' ? 'is-active' : ''} onClick={() => switchTab('library')}>Full library <span className="b">{PAINT_LIBRARY.length}</span></button>
        </div>
        {brandOptions.length > 1 && (
          <div className="faction-row" style={{ margin: '0 16px 8px', flexShrink: 0 }}>
            <div className={`faction-chip ${!brands.length ? 'is-active' : ''}`} onClick={() => setBrands([])}>All brands</div>
            {brandOptions.map((b) => (
              <div key={b} className={`faction-chip ${brands.includes(b) ? 'is-active' : ''}`} onClick={() => toggleIn(brands, setBrands, b)}>{b}</div>
            ))}
          </div>
        )}
        <div className="faction-row" style={{ margin: '0 16px 10px', flexShrink: 0 }}>
          <div className={`faction-chip ${!categories.length ? 'is-active' : ''}`} onClick={() => setCategories([])}>All types</div>
          {['base', 'wash', 'contrast', 'metallic', 'primer'].map((c) => (
            <div key={c} className={`faction-chip ${categories.includes(c) ? 'is-active' : ''}`} onClick={() => toggleIn(categories, setCategories, c)}>{PAINT_CATEGORY_LABEL[c]}</div>
          ))}
        </div>
        <div className="paint-picker__body">
          {tab === 'rack' ? (
            rackList.length ? rackList.map((p) => (
              <PickRow key={p.id} entry={p} owned={p} isSelected={currentId === p.id} onPick={onPick} />
            )) : <div className="empty-state__sub" style={{ padding: '20px 0' }}>{q ? 'No matches on your rack.' : "Nothing on your rack yet — try Full library."}</div>
          ) : (
            libList.length ? libList.map((p, i) => {
              const owned = ownedByKey.get(paintKey(p.name, p.brand)) || null;
              const isSelected = owned ? currentId === owned.id : !!(currentWant && paintKey(currentWant.name, currentWant.brand) === paintKey(p.name, p.brand));
              // PAINT_LIBRARY legitimately has a few duplicate name+brand
              // entries (distinct product-line variants) -- paintKey() alone
              // isn't a unique React key here, unlike everywhere else it's
              // used as a lookup key, so index breaks the tie.
              return <PickRow key={`${paintKey(p.name, p.brand)}-${i}`} entry={p} owned={owned} isSelected={isSelected} onPick={onPick} />;
            }) : <div className="empty-state__sub" style={{ padding: '20px 0' }}>No matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}
