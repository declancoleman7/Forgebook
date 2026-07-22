import Icon from '../icons.jsx';
import { PAINT_CATEGORY_LABEL } from '../data/paints.js';

const CATEGORIES = ['base', 'wash', 'contrast', 'metallic', 'primer'];

// Same "one trigger, one toggle-everything overlay" shape as
// RecipeFilterOverlay -- ported from the old app's paintLibFilterOverlayHtml().
// Brand and type are both multi-select.
export default function PaintLibFilterOverlay({ allBrands, brands, categories, onToggleBrand, onToggleCategory, onClear, onClose }) {
  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="filter-overlay__panel">
        <div className="filter-overlay__header">
          <div className="page-title" style={{ margin: 0 }}>Filter paints</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={16} /></button>
        </div>
        <div className="filter-overlay__body">
          {allBrands.length > 1 && (
            <>
              <div className="section-label">Brand</div>
              <div className="filter-toggle-row">
                <div className={`faction-chip ${!brands.length ? 'is-active' : ''}`} onClick={() => onToggleBrand(null)}>All brands</div>
                {allBrands.map((b) => (
                  <div key={b} className={`faction-chip ${brands.includes(b) ? 'is-active' : ''}`} onClick={() => onToggleBrand(b)}>{b}</div>
                ))}
              </div>
            </>
          )}
          <div className="section-label">Type</div>
          <div className="filter-toggle-row">
            <div className={`faction-chip ${!categories.length ? 'is-active' : ''}`} onClick={() => onToggleCategory(null)}>All types</div>
            {CATEGORIES.map((c) => (
              <div key={c} className={`faction-chip ${categories.includes(c) ? 'is-active' : ''}`} onClick={() => onToggleCategory(c)}>{PAINT_CATEGORY_LABEL[c]}</div>
            ))}
          </div>
        </div>
        <div className="filter-overlay__footer">
          <button type="button" className="btn btn-ghost btn-block" onClick={onClear}>Clear all</button>
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
