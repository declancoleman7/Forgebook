import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from './Avatar.jsx';
import EmblemSvg from './EmblemSvg.jsx';
import { faction } from '../data/factions.js';
import { useRecipeVoteSummary, useSavedRecipes } from '../queries/useRecipes.js';
import { useAuth } from '../auth/AuthContext.jsx';

function DifficultyDots({ level = 1, max = 5 }) {
  return (
    <span className="difficulty">
      {Array.from({ length: max }, (_, i) => <span key={i} className={i < level ? 'is-filled' : ''} />)}
    </span>
  );
}

export default function RecipeCard({ r }) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: voteSummary } = useRecipeVoteSummary();
  const { data: savedRecipes } = useSavedRecipes();

  const fac = faction(r.faction);
  const stack = (r.steps || []).slice(0, 6).map(() => fac.color); // step-paint-colour stack needs the paint form's data (Stage 3 batch 5); faction colour stands in for now
  const ownerId = r.authorId || userId;
  const summary = r.published !== false ? voteSummary?.find((v) => v.recipeOwnerId === ownerId && v.recipeId === r.id) : null;
  const net = summary ? summary.likeCount - summary.dislikeCount : 0;
  const saved = r.published !== false && savedRecipes?.some((s) => s.recipeOwnerId === ownerId && s.recipeId === r.id);

  const dest = r.authorId ? `/recipe/${r.id}/by/${r.authorId}` : `/recipe/${r.id}`;

  return (
    <div className="recipe-card" style={{ '--faction-color': fac.color }} onClick={() => navigate(dest)}>
      <div className={`recipe-card__hero ${r.photo ? 'has-photo' : ''}`} style={r.photo ? { backgroundImage: `url('${r.photo}')` } : {}}>
        {!r.photo && <span className="recipe-card__emblem emblem-badge emblem-badge--lg"><EmblemSvg emblemKey={fac.emblem} size={26} /></span>}
        <div className="recipe-card__stack">{stack.map((c, i) => <span key={i} style={{ background: c }} />)}</div>
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__id">{r.unit || 'General'}</div>
        <div className="recipe-card__name">{r.name}</div>
        <div className="recipe-card__meta">
          <DifficultyDots level={r.difficulty || 1} />
          <span className="recipe-card__meta-right">
            <span className="recipe-card__steps">{(r.steps || []).length} steps</span>
            {r.published !== false && <span className="recipe-card__score"><Icon name="thumb-up" size={11} /> {net}</span>}
            {saved && <span className="recipe-card__saved" title="Saved"><Icon name="bookmark" size={11} /></span>}
          </span>
        </div>
        {r.authorId && (
          <div className="recipe-card__author" onClick={(e) => { e.stopPropagation(); navigate(`/u/${r.authorId}`); }}>
            <Avatar displayName={r.author?.displayName} url={r.author?.avatarUrl} size={14} /> {r.author?.displayName}
          </div>
        )}
        {r.published === false && <span className="pill-status pill-status--draft">Draft</span>}
      </div>
    </div>
  );
}
