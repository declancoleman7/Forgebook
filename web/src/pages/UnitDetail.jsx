import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { faction } from '../data/factions.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';

// Recipes-per-unit is deferred until the recipes data layer exists (Stage
// 3 batch 4) -- always shows the empty state for now.
export default function UnitDetail() {
  const { id, unit } = useParams();
  const navigate = useNavigate();
  const h = useActiveHobby();
  const f = faction(id);
  const isGeneral = !unit || unit === '_general';
  const label = isGeneral ? 'General' : decodeURIComponent(unit);
  const recipes = [];

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate(`/faction/${id}`)}><Icon name="back" size={18} /></button>
      </div>
      <div className="detail-id" style={{ color: f.color }}>{f.label}</div>
      <div className="detail-title">{label}</div>
      <div className="detail-sub">{recipes.length} recipe{recipes.length === 1 ? '' : 's'}{isGeneral ? ` that apply to the ${h.wholeGroupLabel}` : ''}</div>

      <EmptyState icon="book" title="Nothing here yet" sub="Tap + to add the first recipe for this unit." />
    </div>
  );
}
