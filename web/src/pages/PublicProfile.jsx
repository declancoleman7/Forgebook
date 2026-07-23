import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import { faction } from '../data/factions.js';
import { usePublicProfile } from '../queries/usePublic.js';

function PublicRecipeCard({ r, authorId }) {
  const fac = faction(r.faction);
  const stack = (r.steps || []).slice(0, 6);
  return (
    <a className="recipe-card" href={`#/r/${encodeURIComponent(authorId)}/${encodeURIComponent(r.id)}`} style={{ '--faction-color': fac.color }}>
      <div className={`recipe-card__hero ${r.photo ? 'has-photo' : ''}`} style={r.photo ? { backgroundImage: `url('${r.photo}')` } : {}}>
        {!r.photo && <span className="recipe-card__emblem emblem-badge emblem-badge--lg"><EmblemSvg emblemKey={fac.emblem} size={26} /></span>}
        <div className="recipe-card__stack">{stack.map((_, i) => <span key={i} style={{ background: fac.color }} />)}</div>
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__id">{r.unit || 'General'}</div>
        <div className="recipe-card__name">{r.name}</div>
        <div className="recipe-card__meta">
          <span className="difficulty">{'●'.repeat(r.difficulty || 1)}{'○'.repeat(5 - (r.difficulty || 1))}</span>
          <span className="recipe-card__steps">{(r.steps || []).length} steps</span>
        </div>
      </div>
    </a>
  );
}

// The signed-out /u/:id route (see App.jsx's Boot(), which renders this
// instead of the normal authenticated Profile whenever there's no
// session) -- recipes only, real <a href="#/r/..."> anchors rather than
// onClick navigation, same as the old app's renderPublicProfile().
export default function PublicProfile({ id }) {
  const { data: result, isLoading } = usePublicProfile(id);

  if (isLoading) {
    return (
      <div className="gate public-recipe">
        <div className="gate__card public-recipe__card">
          <div className="gate__brand"><Icon name="book" size={26} /> Forgebook</div>
          <div className="detail-sub" style={{ marginTop: 14 }}>Loading painter…</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="gate public-recipe">
        <div className="gate__card public-recipe__card">
          <div className="gate__brand"><Icon name="book" size={26} /> Forgebook</div>
          <div className="gate__tagline">This painter isn't available — they may not exist, or have no published work.</div>
          <a className="btn btn-primary btn-block" style={{ marginTop: 20 }} href="./">Open Forgebook</a>
        </div>
      </div>
    );
  }

  const { recipes } = result;

  return (
    <div className="gate public-recipe">
      <div className="gate__card public-recipe__card">
        <div className="public-recipe__banner">
          <span><Icon name="book" size={15} /> Made with Forgebook</span>
          <a href="./">Get the app</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar displayName={result.displayName} url={result.avatarUrl} size={56} />
          <div>
            <div className="detail-title detail-title--identity">{result.displayName}</div>
            <div className="detail-sub">{recipes.length} recipe{recipes.length === 1 ? '' : 's'} shared</div>
          </div>
        </div>

        <div className="section-label">Published Recipes</div>
        {recipes.length ? (
          <div className="recipe-grid">{recipes.map((r) => <PublicRecipeCard key={r.id} r={r} authorId={id} />)}</div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__glyph"><Icon name="book" size={30} /></div>
            <div className="empty-state__title">No recipes yet</div>
            <div className="empty-state__sub">Nothing published so far.</div>
          </div>
        )}

        <a className="btn btn-primary btn-block" style={{ marginTop: 24 }} href="./">
          <Icon name="book" size={16} /> Track your own recipes with Forgebook
        </a>
      </div>
    </div>
  );
}
