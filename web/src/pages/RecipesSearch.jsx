import { useMemo, useState } from 'react';
import Icon from '../icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import RecipeFilterOverlay from '../components/RecipeFilterOverlay.jsx';
import { faction } from '../data/factions.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';
import { useIncludeShared, setIncludeShared } from '../hooks/useIncludeShared.js';
import { useVisibleRecipes, useSharedRecipes, useRecipeVoteSummary } from '../queries/useRecipes.js';

// Simplified port of the old app's merged viewRecipes() (recipe showcase +
// inline search, sort, and the faction/difficulty filter overlay window).
// Deferred for a later pass: the full cross-content search (Top/Recipes/
// Paints/Armies&Units/Accounts tabs) and matching by paint name within a
// recipe's steps (needs the recipe-form paint-picker data shape) -- search
// matches name/id/unit/faction label only for now.
function recipeMatchesQuery(r, q) {
  return r.name.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q) ||
    (r.unit || '').toLowerCase().includes(q) ||
    faction(r.faction).label.toLowerCase().includes(q);
}

export default function RecipesSearch() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new'); // new | old | rating
  const [filterOpen, setFilterOpen] = useState(false);
  const [factionFilters, setFactionFilters] = useState([]);
  const [difficultyFilters, setDifficultyFilters] = useState([]);
  const hobby = useActiveHobby();
  const includeShared = useIncludeShared();
  const { data: recipes, isLoading } = useVisibleRecipes();
  const { data: sharedRecipes } = useSharedRecipes();
  const { data: voteSummary } = useRecipeVoteSummary();

  const usedFactionIds = useMemo(() => [...new Set(recipes.map((r) => r.faction))], [recipes]);

  const q = query.trim().toLowerCase();
  let list = q ? recipes.filter((r) => recipeMatchesQuery(r, q)) : recipes;
  if (factionFilters.length) list = list.filter((r) => factionFilters.includes(r.faction));
  if (difficultyFilters.length) list = list.filter((r) => difficultyFilters.includes(r.difficulty || 1));

  if (sort === 'old') {
    list = [...list].sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
  } else if (sort === 'rating') {
    const netFor = (r) => {
      const ownerId = r.authorId || null;
      const s = voteSummary?.find((v) => v.recipeOwnerId === (ownerId || v.recipeOwnerId) && v.recipeId === r.id);
      return s ? s.likeCount - s.dislikeCount : 0;
    };
    list = [...list].sort((a, b) => netFor(b) - netFor(a));
  } else {
    list = [...list].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  const activeFilterCount = factionFilters.length + difficultyFilters.length;

  return (
    <div className="page-enter">
      <div className="page-title">Recipes</div>
      <div className="search-filter-row">
        <div className="mini-search">
          <Icon name="search" size={14} />
          <input type="text" placeholder="Search recipes" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button type="button" className="filter-icon-btn" aria-label="Filters" onClick={() => setFilterOpen(true)}>
          <Icon name="filter" size={16} />
          {activeFilterCount > 0 && <span className="filter-icon-btn__count">{activeFilterCount}</span>}
        </button>
      </div>
      <div className="lib-filter-seg" style={{ marginBottom: 12 }}>
        <button className={sort === 'new' ? 'is-active' : ''} onClick={() => setSort('new')}>Newest</button>
        <button className={sort === 'old' ? 'is-active' : ''} onClick={() => setSort('old')}>Oldest</button>
        <button className={sort === 'rating' ? 'is-active' : ''} onClick={() => setSort('rating')}>Top Rated</button>
      </div>

      {isLoading ? (
        <div className="empty-state__sub">Loading…</div>
      ) : list.length ? (
        <div className="recipe-grid">{list.map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
      ) : (
        <EmptyState icon="search" title="No matches" sub="Try different filters, or a different search term." />
      )}

      {filterOpen && (
        <RecipeFilterOverlay
          usedFactionIds={usedFactionIds}
          factionFilters={factionFilters}
          difficultyFilters={difficultyFilters}
          includeShared={includeShared}
          hasSharedRecipes={(sharedRecipes?.length || 0) > 0}
          groupLabel={hobby.groupLabel}
          onToggleFaction={(id) => setFactionFilters((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          onToggleDifficulty={(n) => setDifficultyFilters((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n])}
          onToggleShared={() => setIncludeShared(!includeShared)}
          onClear={() => { setFactionFilters([]); setDifficultyFilters([]); }}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}
