import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { faction } from '../data/factions.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';
import { useVisibleRecipes } from '../queries/useRecipes.js';

export default function UnitDetail() {
  const { id, unit } = useParams();
  const navigate = useNavigate();
  const h = useActiveHobby();
  const f = faction(id);
  const isGeneral = !unit || unit === '_general';
  const label = isGeneral ? 'General' : decodeURIComponent(unit);
  const { data: visibleRecipes = [] } = useVisibleRecipes();
  const recipes = visibleRecipes.filter((r) => r.faction === id && (isGeneral ? !r.unit : r.unit === label));

  return (
    <div className="page-enter">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate(`/faction/${id}`)}><Icon name="back" size={18} /></button>
      </div>
      <div className="detail-id" style={{ color: f.color }}>{f.label}</div>
      <div className="detail-title">{label}</div>
      <div className="detail-sub">{recipes.length} recipe{recipes.length === 1 ? '' : 's'}{isGeneral ? ` that apply to the ${h.wholeGroupLabel}` : ''}</div>

      {recipes.length ? (
        <div className="recipe-grid" style={{ marginTop: 14 }}>{recipes.map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
      ) : (
        <EmptyState icon="book" title="Nothing here yet" sub="Tap + to add the first recipe for this unit." />
      )}
    </div>
  );
}
