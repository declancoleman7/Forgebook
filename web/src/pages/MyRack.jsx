import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { paintMatchesQuery, paintCategory } from '../data/paints.js';
import { useMyPaints } from '../queries/usePaints.js';

const CATEGORY_GLYPH = {
  wash: '<path d="M12 3C12 3 6 10 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 10 12 3 12 3Z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/>',
  metallic: '<path d="M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z"/>',
  primer: '<circle cx="12" cy="7" r="2.4"/><circle cx="7" cy="16" r="2.4"/><circle cx="17" cy="16" r="2.4"/>',
};
function TypeBadge({ type }) {
  const glyph = CATEGORY_GLYPH[paintCategory(type)];
  return glyph ? <span className="paint-type-badge"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" dangerouslySetInnerHTML={{ __html: glyph }} /></span> : null;
}

export default function MyRack() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: allPaints = [], isLoading } = useMyPaints();

  const q = query.trim().toLowerCase();
  const paints = q ? allPaints.filter((p) => paintMatchesQuery(p, q)) : allPaints;
  const brands = [...new Set(paints.map((p) => p.brand || 'Unbranded'))].sort();

  return (
    <div className="page-enter">
      <div className="page-title">Paint Rack</div>
      <div className="detail-sub" style={{ marginBottom: 14 }}>
        {allPaints.length} paint{allPaints.length === 1 ? '' : 's'} on the rack.
        Add them here once, then pull them into any recipe.
      </div>

      {allPaints.length > 0 && (
        <div className="mini-search">
          <Icon name="search" size={14} />
          <input type="text" placeholder="Search your rack" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}

      <button className="btn btn-primary btn-block" style={{ marginBottom: 10 }} onClick={() => navigate('/paint-library')}>
        Browse paint library
      </button>
      <button className="btn btn-ghost btn-block" style={{ marginBottom: 18 }} onClick={() => navigate('/paint-new')}>
        + Add paint manually
      </button>

      {isLoading ? (
        <div className="empty-state__sub">Loading…</div>
      ) : paints.length ? (
        brands.map((brand) => (
          <div key={brand}>
            <div className="section-label">{brand}</div>
            {paints.filter((p) => (p.brand || 'Unbranded') === brand).sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <div key={p.id} className="paint-lib-row" onClick={() => navigate(`/paint/${p.id}`)}>
                <div className="paint-row__swatch" style={{ background: p.hex }}><TypeBadge type={p.type} /></div>
                <div>
                  <div className="paint-row__name">{p.name}</div>
                  <div className="paint-row__brand">{p.type || 'Other'}</div>
                </div>
                {p.quantity > 1 && <span className="qty-badge">×{p.quantity}</span>}
                {p.needsRestock && <span className="restock-badge">Buy</span>}
                {/* Recipe-usage count needs the recipes data layer -- Stage 3 batch 4. */}
                <div className="paint-lib-row__count">unused</div>
                <div className="unit-row__chevron"><Icon name="chevron" size={14} /></div>
              </div>
            ))}
          </div>
        ))
      ) : q ? (
        <EmptyState icon="search" title="No matches" sub="Try a different search term." />
      ) : (
        <EmptyState icon="paintdrop" title="No paints yet" sub="Add one manually, or browse the paint library." />
      )}
    </div>
  );
}
