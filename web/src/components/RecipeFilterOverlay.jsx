import Icon from '../icons.jsx';
import EmblemSvg from './EmblemSvg.jsx';
import { faction } from '../data/factions.js';

// A toggle-everything-at-once window rather than inline chips -- ported
// from the old app's recipeFilterOverlayHtml(). Army/faction and
// difficulty are both multi-select.
export default function RecipeFilterOverlay({
  usedFactionIds, factionFilters, difficultyFilters, includeShared, hasSharedRecipes,
  groupLabel, onToggleFaction, onToggleDifficulty, onToggleShared, onClear, onClose,
}) {
  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="filter-overlay__panel">
        <div className="filter-overlay__header">
          <div className="page-title" style={{ margin: 0 }}>Filter recipes</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={16} /></button>
        </div>
        <div className="filter-overlay__body">
          {hasSharedRecipes && (
            <>
              <div className="section-label">Shared recipes</div>
              <div className="filter-toggle-row">
                <div className={`faction-chip ${includeShared ? 'is-active' : ''}`} onClick={onToggleShared}>
                  <Icon name="book" size={13} /> Show recipes shared by others
                </div>
              </div>
            </>
          )}
          <div className="section-label">{groupLabel}</div>
          <div className="filter-toggle-row">
            {usedFactionIds.length ? usedFactionIds.map((id) => {
              const f = faction(id);
              const active = factionFilters.includes(f.id);
              return (
                <div key={f.id} className={`faction-chip ${active ? 'is-active' : ''}`} style={{ '--chip-color': f.color }} onClick={() => onToggleFaction(f.id)}>
                  <span className="faction-chip__emblem" style={{ color: f.color }}><EmblemSvg emblemKey={f.emblem} size={15} /></span>
                  {f.label}
                </div>
              );
            }) : <div className="empty-state__sub">No recipes yet to filter by {groupLabel.toLowerCase()}.</div>}
          </div>
          <div className="section-label">Difficulty</div>
          <div className="filter-toggle-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className={`faction-chip ${difficultyFilters.includes(n) ? 'is-active' : ''}`} onClick={() => onToggleDifficulty(n)}>
                <span className="difficulty">{'●'.repeat(n)}{'○'.repeat(5 - n)}</span>
              </div>
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
