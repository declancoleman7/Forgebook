import { useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import Icon from '../icons.jsx';
import { PAINT_LIBRARY, paintKey, paintCategory, paintMatchesQuery } from '../data/paints.js';
import { useMyPaints, useWantToBuy, useAddPaintToRack, useToggleWanted, useToggleRestock, useUpdateQuantity, useDeletePaint } from '../queries/usePaints.js';
import { useConfirm } from '../confirm/ConfirmContext.jsx';
import { useToast } from '../toast/ToastContext.jsx';
import PaintLibFilterOverlay from '../components/PaintLibFilterOverlay.jsx';

const CATEGORY_GLYPH = {
  wash: '<path d="M12 3C12 3 6 10 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 10 12 3 12 3Z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/>',
  metallic: '<path d="M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z"/>',
  primer: '<circle cx="12" cy="7" r="2.4"/><circle cx="7" cy="16" r="2.4"/><circle cx="17" cy="16" r="2.4"/>',
};

function TypeBadge({ type }) {
  const glyph = CATEGORY_GLYPH[paintCategory(type)];
  if (!glyph) return null;
  return <span className="paint-type-badge"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" dangerouslySetInnerHTML={{ __html: glyph }} /></span>;
}

// Three states per paint: not-owned, not-owned-and-wanted ("need to buy"),
// and owned-but-needs-restock. Owned and "need to buy" are mutually
// exclusive; the trailing icon button is the same slot for both, its
// meaning following from whether the paint is owned.
function PaintRow({ p, owned, wanted, onAddToRack, onToggleWanted, onToggleRestock, onInc, onDec }) {
  const navigate = useNavigate();

  const openSimilar = (e) => { e.stopPropagation(); navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand)}`); };

  if (owned) {
    return (
      <div className="lib-row is-owned">
        <div className="paint-row__swatch" title="Find similar colours" style={{ background: p.hex, cursor: 'pointer' }} onClick={openSimilar}><TypeBadge type={p.type} /></div>
        <div className="lib-row__info" onClick={() => navigate(`/paint/${owned.id}`)} style={{ cursor: 'pointer' }}>
          <div className="paint-row__name">{p.name}</div>
          <div className="paint-row__brand">{p.brand} · {p.type}</div>
        </div>
        <button className={`lib-row__flag is-restock ${owned.needsRestock ? 'is-on' : ''}`} title={owned.needsRestock ? 'Flagged for restock' : 'Flag for restock'} onClick={() => onToggleRestock(owned.id, owned.needsRestock)}>
          <Icon name="cart" size={14} />
        </button>
        <div className="lib-row__qty">
          <button className="lib-row__qty-btn" aria-label="Decrease quantity" onClick={() => onDec(owned)}>−</button>
          <span className="lib-row__qty-n">{owned.quantity || 1}</span>
          <button className="lib-row__qty-btn" aria-label="Increase quantity" onClick={() => onInc(owned.id, owned.quantity)}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lib-row" onClick={() => onAddToRack(p)} style={{ cursor: 'pointer' }}>
      <div className="paint-row__swatch" title="Find similar colours" style={{ background: p.hex }} onClick={openSimilar}><TypeBadge type={p.type} /></div>
      <div className="lib-row__info">
        <div className="paint-row__name">{p.name}</div>
        <div className="paint-row__brand">{p.brand} · {p.type}</div>
      </div>
      <button className={`lib-row__flag is-wanted ${wanted ? 'is-on' : ''}`} title={wanted ? 'On your buy list' : 'Add to buy list'}
        onClick={(e) => { e.stopPropagation(); onToggleWanted(p, wanted); }}>
        <Icon name="cart" size={14} />
      </button>
      <span className="lib-row__ring lib-row__ring--add" title="Add to rack"><Icon name="plus" size={14} /></span>
    </div>
  );
}

const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 62;

export default function PaintLibrary() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | owned | want
  const [filterOpen, setFilterOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('list'); // list | ranges
  const scrollRef = useRef(null);
  const confirm = useConfirm();
  const showToast = useToast();

  const paintsQuery = useMyPaints();
  const wantsQuery = useWantToBuy();
  const addToRack = useAddPaintToRack();
  const toggleWanted = useToggleWanted();
  const toggleRestock = useToggleRestock();
  const { inc, dec } = useUpdateQuantity();
  const deletePaint = useDeletePaint();

  const ownedByKey = useMemo(() => new Map((paintsQuery.data || []).map((p) => [paintKey(p.name, p.brand), p])), [paintsQuery.data]);
  const wantedKeys = useMemo(() => new Set(wantsQuery.data || []), [wantsQuery.data]);
  const isOwnedEntry = useCallback((p) => ownedByKey.has(paintKey(p.name, p.brand)), [ownedByKey]);
  const needsPurchaseEntry = useCallback((p) => {
    if (!isOwnedEntry(p)) return wantedKeys.has(paintKey(p.name, p.brand));
    return !!ownedByKey.get(paintKey(p.name, p.brand))?.needsRestock;
  }, [ownedByKey, wantedKeys, isOwnedEntry]);

  const allBrands = useMemo(() => [...new Set(PAINT_LIBRARY.map((p) => p.brand).filter(Boolean))].sort(), []);

  const q = query.trim().toLowerCase();
  let entries = q ? PAINT_LIBRARY.filter((p) => paintMatchesQuery(p, q)) : PAINT_LIBRARY;
  if (filter === 'owned') entries = entries.filter(isOwnedEntry);
  else if (filter === 'want') entries = entries.filter(needsPurchaseEntry);
  // Ranges are computed before the brand filter narrows things down --
  // picking a range tile is itself the way to apply that filter.
  const entriesForRanges = categories.length ? entries.filter((p) => categories.includes(paintCategory(p.type))) : entries;
  if (brands.length) entries = entries.filter((p) => brands.includes(p.brand));
  if (categories.length) entries = entries.filter((p) => categories.includes(paintCategory(p.type)));

  const rangeTiles = useMemo(() => {
    const byBrand = new Map();
    for (const p of entriesForRanges) {
      if (!byBrand.has(p.brand)) byBrand.set(p.brand, { brand: p.brand, total: 0, owned: 0 });
      const bucket = byBrand.get(p.brand);
      bucket.total++;
      if (isOwnedEntry(p)) bucket.owned++;
    }
    return [...byBrand.values()].sort((a, b) => b.total - a.total);
  }, [entriesForRanges, isOwnedEntry]);

  const totalCount = PAINT_LIBRARY.length;
  const ownedCount = useMemo(() => PAINT_LIBRARY.filter(isOwnedEntry).length, [isOwnedEntry]);
  const wantCount = useMemo(() => PAINT_LIBRARY.filter(needsPurchaseEntry).length, [needsPurchaseEntry]);
  const pct = totalCount ? Math.round((ownedCount / totalCount) * 100) : 0;

  const flatRows = useMemo(() => {
    const byType = new Map();
    for (const p of entries) { if (!byType.has(p.type)) byType.set(p.type, []); byType.get(p.type).push(p); }
    const out = [];
    for (const [type, items] of byType) {
      out.push({ kind: 'header', type, ownedInType: items.filter(isOwnedEntry).length, total: items.length });
      for (const p of items) out.push({ kind: 'item', p });
    }
    return out;
  }, [entries, isOwnedEntry]);

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (flatRows[i]?.kind === 'header' ? HEADER_HEIGHT : ROW_HEIGHT),
    overscan: 10,
  });

  const doAddToRack = (p) => addToRack.mutate({ name: p.name, brand: p.brand, hex: p.hex, type: p.type, quantity: 1 });
  const doToggleWanted = (p, wanted) => toggleWanted.mutate({ name: p.name, brand: p.brand, wanted });
  // Decreasing to 0 removes the paint from the rack entirely -- same rule
  // as the old app, confirmed first. "Used in N recipes" is folded back in
  // once the recipes data layer exists (Stage 3 batch 4).
  const doDec = async (owned) => {
    const next = (owned.quantity || 1) - 1;
    if (next <= 0) {
      if (await confirm(`Remove ${owned.name} from your rack?`)) {
        deletePaint.mutate(owned.id, { onSuccess: () => showToast('Removed from rack') });
      }
      return;
    }
    dec(owned.id, owned.quantity);
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => window.history.back()}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Paint Library</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="detail-sub" style={{ marginBottom: 14 }}>
        Tap a paint's swatch to find similar colours from other brands. Tap the row to add a first
        pot to your rack, then use +/− to track how many you've got — down to 0 removes it. Flag
        ones you're missing for a buy list, or ones you own but are running low for a restock.
      </div>

      <div className="search-filter-row">
        <div className="mini-search">
          <Icon name="search" size={14} />
          <input type="text" placeholder="Search paints" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button type="button" className={`filter-icon-btn ${view === 'ranges' ? 'is-active' : ''}`} aria-label="Browse by range" onClick={() => setView(view === 'ranges' ? 'list' : 'ranges')}>
          <Icon name="grid" size={16} />
        </button>
        <button type="button" className="filter-icon-btn" aria-label="Filters" onClick={() => setFilterOpen(true)}>
          <Icon name="filter" size={16} />
          {(brands.length + categories.length) > 0 && <span className="filter-icon-btn__count">{brands.length + categories.length}</span>}
        </button>
      </div>

      <div className="lib-progress">
        <div className="lib-progress__stats">
          <div className="lib-progress__stat"><span className="lib-progress__n">{ownedCount}<small>/{totalCount}</small></span><span className="lib-progress__l">On rack</span></div>
          <div className="lib-progress__stat"><span className="lib-progress__n" style={{ color: 'var(--blood-bright)' }}>{wantCount}</span><span className="lib-progress__l">To buy</span></div>
        </div>
        <div className="lib-progress__bar"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="lib-filter-seg">
        <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>All <span className="b">{totalCount}</span></button>
        <button className={filter === 'owned' ? 'is-active' : ''} onClick={() => setFilter('owned')}>On rack <span className="b">{ownedCount}</span></button>
        <button className={filter === 'want' ? 'is-active' : ''} onClick={() => setFilter('want')}>To buy <span className="b">{wantCount}</span></button>
      </div>

      {view === 'ranges' ? (
        !rangeTiles.length ? (
          <div className="empty-state"><div className="empty-state__title">No matches</div><div className="empty-state__sub">Try a different filter.</div></div>
        ) : (
          <div className="range-tiles">
            {rangeTiles.map(({ brand, total, owned }) => (
              <div key={brand} className="range-tile" onClick={() => { setBrands([brand]); setView('list'); }}>
                <div className="range-tile__name">{brand}</div>
                <div className="range-tile__count">{owned > 0 ? `${owned}/${total} owned` : `${total} paints`}</div>
              </div>
            ))}
          </div>
        )
      ) : !entries.length ? (
        <div className="empty-state"><div className="empty-state__title">No matches</div><div className="empty-state__sub">Try a different filter.</div></div>
      ) : (
        <div ref={scrollRef} style={{ height: 'calc(100vh - 420px)', minHeight: 400, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '0 4px' }}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = flatRows[vRow.index];
              const style = { position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${vRow.start}px)`, height: vRow.size };
              if (row.kind === 'header') {
                return (
                  <div key={vRow.key} style={{ ...style, display: 'flex', alignItems: 'flex-end', padding: '0 4px' }}>
                    <div className="section-label" style={{ margin: 0, width: '100%' }}>{row.type} <span className="lib-section-count">{row.ownedInType}/{row.total} owned</span></div>
                  </div>
                );
              }
              const owned = ownedByKey.get(paintKey(row.p.name, row.p.brand));
              const wanted = wantedKeys.has(paintKey(row.p.name, row.p.brand));
              return (
                <div key={vRow.key} style={{ ...style, padding: '0 4px 8px' }}>
                  <PaintRow p={row.p} owned={owned} wanted={wanted}
                    onAddToRack={doAddToRack} onToggleWanted={doToggleWanted}
                    onToggleRestock={(id, current) => toggleRestock(id, current)}
                    onInc={inc} onDec={doDec} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filterOpen && (
        <PaintLibFilterOverlay
          allBrands={allBrands}
          brands={brands}
          categories={categories}
          onToggleBrand={(b) => setBrands((prev) => (b === null ? [] : prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))}
          onToggleCategory={(c) => setCategories((prev) => (c === null ? [] : prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))}
          onClear={() => { setBrands([]); setCategories([]); }}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}
