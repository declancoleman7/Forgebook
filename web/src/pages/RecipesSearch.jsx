import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../icons.jsx';
import Avatar from '../components/Avatar.jsx';
import EmblemSvg from '../components/EmblemSvg.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import RecipeFilterOverlay from '../components/RecipeFilterOverlay.jsx';
import { faction } from '../data/factions.js';
import { PAINT_LIBRARY, paintKey, paintTypeKey, paintMatchesQuery } from '../data/paints.js';
import { useActiveHobby } from '../hooks/useActiveHobby.js';
import { useIncludeShared, setIncludeShared } from '../hooks/useIncludeShared.js';
import { useVisibleRecipes, useSharedRecipes, useRecipeVoteSummary } from '../queries/useRecipes.js';
import { useMyPaints, useSharedPaints, useSavedPaintKeys } from '../queries/usePaints.js';
import { useSearchProfiles } from '../queries/useSocial.js';

// Recent searches persist across sessions (unlike includeShared, which
// deliberately resets) -- same dedupe-move-to-front-then-cap-at-8 shape as
// the old app's pushRecentSearch(), just backed by localStorage directly
// instead of a shared KEYS.recentSearches store (this is the only screen
// that reads or writes it).
const RECENT_SEARCHES_KEY = 'forgebook.recentSearches';
function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || []; } catch { return []; }
}
function pushRecentSearch(q) {
  q = String(q || '').trim();
  if (!q) return;
  const recents = getRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...recents].slice(0, 8)));
}

// Every distinct paint name a recipe's steps actually use -- a step
// resolves against its OWN author's rack (shared recipes never resolve
// against the viewer's), same split RecipeCard/RecipeDetail already use.
// wantPaint/mixWantPaint are embedded snapshots for a paint the recipe
// calls for but the author doesn't own yet, so those match by name alone.
function recipePaintNames(r, myPaints, sharedPaintsByAuthor) {
  const pool = r.authorId ? (sharedPaintsByAuthor.get(r.authorId) || []) : myPaints;
  const names = new Set();
  (r.steps || []).forEach((s) => {
    ['paintId', 'mixPaintId'].forEach((field) => {
      const pid = s[field];
      if (pid) {
        const p = pool.find((x) => x.id === pid);
        if (p) names.add(p.name);
        return;
      }
      const want = s[field === 'paintId' ? 'wantPaint' : 'mixWantPaint'];
      if (want) names.add(want.name);
    });
  });
  return names;
}

function recipeMatchesQuery(r, q, paintNames) {
  return r.name.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q) ||
    (r.unit || '').toLowerCase().includes(q) ||
    faction(r.faction).label.toLowerCase().includes(q) ||
    [...paintNames].some((name) => name.toLowerCase().includes(q));
}

function factionMatchesQuery(f, q) { return f.label.toLowerCase().includes(q); }

// Same aggregation FactionDetail.jsx's own unit list does for one faction,
// generalized across all of them at once -- global search has no single
// faction to scope to. Keyed via JSON so a free-text unit name containing
// "|" can't collide with the join separator.
function allUnitsMatching(recipes, q) {
  const seen = new Map();
  recipes.forEach((r) => {
    if (!r.unit || !r.unit.toLowerCase().includes(q)) return;
    const key = JSON.stringify([r.faction, r.unit]);
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  return [...seen.entries()].map(([key, count]) => {
    const [facId, unit] = JSON.parse(key);
    return { facId, unit, count };
  });
}

// Ranking for the Top tab -- text relevance, not the Home feed's time-decay
// formula. Exact match beats prefix beats "matches somewhere"; ties broken
// by shorter name (a tighter match for the same query).
function matchTier(name, q) {
  const n = (name || '').toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  return 2;
}
function rankByTier(items, nameFn, q) {
  return [...items].sort((a, b) => {
    const at = matchTier(nameFn(a), q), bt = matchTier(nameFn(b), q);
    return at !== bt ? at - bt : nameFn(a).length - nameFn(b).length;
  });
}
// Round-robins a fixed count across already-ranked category lists, so Top
// isn't dominated by whichever category happens to have the most rows.
function interleaveTop(taggedLists, limit) {
  const out = [];
  let i = 0;
  while (out.length < limit) {
    let any = false;
    for (const list of taggedLists) {
      if (i < list.length) { out.push(list[i]); any = true; if (out.length >= limit) break; }
    }
    if (!any) break;
    i++;
  }
  return out;
}

function CompactRecipeRow({ r }) {
  const navigate = useNavigate();
  const { data: voteSummary } = useRecipeVoteSummary();
  const { data: myPaints = [] } = useMyPaints();
  const { data: sharedPaints = [] } = useSharedPaints(r.authorId ? [r.authorId] : []);
  const fac = faction(r.faction);
  const pool = r.authorId ? sharedPaints : myPaints;
  const resolveStepPaint = (s) => {
    if (s.paintId) return pool.find((p) => p.id === s.paintId) || null;
    if (!s.wantPaint) return null;
    return myPaints.find((p) => paintTypeKey(p.name, p.brand, p.type) === paintTypeKey(s.wantPaint.name, s.wantPaint.brand, s.wantPaint.type)) || s.wantPaint;
  };
  const stack = (r.steps || []).slice(0, 5).map((s) => resolveStepPaint(s)?.hex || fac.color);
  const ownerId = r.authorId || null;
  const summary = ownerId ? voteSummary?.find((v) => v.recipeOwnerId === ownerId && v.recipeId === r.id) : null;
  const dest = r.authorId ? `/recipe/${r.id}/by/${r.authorId}` : `/recipe/${r.id}`;
  return (
    <div className="compact-recipe-row" style={{ '--faction-color': fac.color }} onClick={() => navigate(dest)}>
      <div className={`compact-recipe-row__thumb ${r.photo ? 'has-photo' : ''}`} style={r.photo ? { backgroundImage: `url('${r.photo}')`, backgroundPosition: `${(r.photoFocalX ?? 0.5) * 100}% ${(r.photoFocalY ?? 0.5) * 100}%` } : {}}>
        {!r.photo && <span className="emblem-badge emblem-badge--sm"><EmblemSvg emblemKey={fac.emblem} size={16} /></span>}
      </div>
      <div className="compact-recipe-row__info">
        <div className="compact-recipe-row__name">{r.name}</div>
        <div className="compact-recipe-row__meta">{fac.label}{r.unit ? ` · ${r.unit}` : ''}{r.author ? ` · ${r.author.displayName}` : ''}</div>
        <div className="compact-recipe-row__stack">{stack.map((c, i) => <span key={i} style={{ background: c }} />)}</div>
      </div>
      {summary && <span className="recipe-card__score"><Icon name="thumb-up" size={11} /> {summary.likeCount - summary.dislikeCount}</span>}
    </div>
  );
}

function PaintSearchRow({ p }) {
  const navigate = useNavigate();
  const { data: savedKeys = [] } = useSavedPaintKeys();
  const saved = savedKeys.includes(paintKey(p.name, p.brand));
  return (
    <div className="paint-lib-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/similar/${encodeURIComponent(p.name)}/${encodeURIComponent(p.brand)}`)}>
      <div className="paint-row__swatch" style={{ background: p.hex }} />
      <div>
        <div className="paint-row__name">{p.name}{saved && <span className="recipe-card__saved" title="Saved"><Icon name="bookmark" size={11} /></span>}</div>
        <div className="paint-row__brand">{p.brand}{p.type ? ` · ${p.type}` : ''}</div>
      </div>
    </div>
  );
}

function ArmyRow({ f }) {
  const navigate = useNavigate();
  return (
    <div className="unit-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/faction/${f.id}`)}>
      <div className="unit-row__bar" style={{ background: f.color }} />
      <div className="unit-row__name">{f.label}</div>
      <div className="unit-row__chevron"><Icon name="chevron" size={16} /></div>
    </div>
  );
}

function UnitRow({ u }) {
  const navigate = useNavigate();
  const f = faction(u.facId);
  return (
    <div className="unit-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/faction/${u.facId}/unit/${encodeURIComponent(u.unit)}`)}>
      <div className="unit-row__bar" style={{ background: f.color }} />
      <div className="unit-row__name">{u.unit} <span style={{ opacity: 0.6 }}>· {f.label}</span></div>
      <div className="unit-row__count">{u.count}</div>
      <div className="unit-row__chevron"><Icon name="chevron" size={16} /></div>
    </div>
  );
}

function AccountRow({ p }) {
  const navigate = useNavigate();
  return (
    <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${p.userId}`)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar displayName={p.displayName} url={p.avatarUrl} size={28} />
        <div className="settings-row__label">{p.displayName}{p.isAdmin && <span className="admin-badge" title="Forgebook admin">GM</span>}</div>
      </div>
    </div>
  );
}

function SearchTopRow({ item }) {
  if (item.kind === 'recipe') return <CompactRecipeRow r={item.data} />;
  if (item.kind === 'paint') return <PaintSearchRow p={item.data} />;
  if (item.kind === 'army') return <ArmyRow f={item.data} />;
  if (item.kind === 'unit') return <UnitRow u={item.data} />;
  return <AccountRow p={item.data} />;
}

// The recent-searches dropdown, plus the box itself -- shared by all three
// of viewRecipes()'s modes (showcase/quick/full), matching the old app's
// globalSearchBoxHtml()/searchDropdownHtml() living in one place.
function GlobalSearchBox({ query, onChange, onSubmit }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recents, setRecents] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setDropdownOpen(false); };
    const onDocKey = (e) => { if (e.key === 'Escape') setDropdownOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onDocKey);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onDocKey); };
  }, []);

  const openDropdown = () => { setRecents(getRecentSearches()); setDropdownOpen(true); };
  const pickRecent = (q) => { onChange(q); onSubmit(q); setDropdownOpen(false); };

  return (
    <div className="mini-search global-search" ref={boxRef}>
      <Icon name="search" size={14} />
      <input
        type="text"
        placeholder="Search recipes, paints, armies, painters…"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (!query.trim()) openDropdown(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { e.preventDefault(); onSubmit(query); setDropdownOpen(false); } }}
      />
      {dropdownOpen && !query.trim() && (
        <div className="search-dropdown">
          {recents.length ? (
            <>
              <div className="search-dropdown__label">Recent searches</div>
              {recents.map((q) => (
                <div key={q} className="search-dropdown__item" onClick={() => pickRecent(q)}>
                  <Icon name="search" size={13} /> {q}
                </div>
              ))}
            </>
          ) : (
            <div className="search-dropdown__empty">No recent searches yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// Instagram-style: empty shows the recipe showcase (browse/sort/filter);
// typing shows quick recipe-only matches (fast, uncluttered); pressing
// Enter (or tapping a recent search) escalates to the full cross-content
// tabbed view. Ported from the old app's viewRecipes() + its Search tab
// doubling as global search.
export default function RecipesSearch() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState('top');
  const [sort, setSort] = useState('new');
  const [filterOpen, setFilterOpen] = useState(false);
  const [factionFilters, setFactionFilters] = useState([]);
  const [difficultyFilters, setDifficultyFilters] = useState([]);
  const hobby = useActiveHobby();
  const includeShared = useIncludeShared();
  const { data: recipes = [], isLoading } = useVisibleRecipes();
  const { data: sharedRecipes } = useSharedRecipes();
  const { data: voteSummary } = useRecipeVoteSummary();
  const { data: myPaints = [] } = useMyPaints();

  const sharedAuthorIds = useMemo(() => [...new Set(recipes.filter((r) => r.authorId).map((r) => r.authorId))], [recipes]);
  const { data: sharedPaintsFlat = [] } = useSharedPaints(sharedAuthorIds);
  const sharedPaintsByAuthor = useMemo(() => {
    const m = new Map();
    sharedPaintsFlat.forEach((p) => { if (!m.has(p.authorId)) m.set(p.authorId, []); m.get(p.authorId).push(p); });
    return m;
  }, [sharedPaintsFlat]);

  const q = query.trim().toLowerCase();
  const submittedActive = submitted && q;
  // Called unconditionally (Rules of Hooks) even though its result is only
  // used in the submitted/tabbed branch below -- enabled:q.length>0 already
  // keeps it from fetching the rest of the time.
  const { data: accounts = [], isLoading: accountsLoading } = useSearchProfiles(submittedActive ? q : '');

  const submitQuery = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;
    setSubmitted(true);
    pushRecentSearch(trimmed);
  };
  const changeQuery = (text) => { setQuery(text); setSubmitted(false); };

  const usedFactionIds = useMemo(() => [...new Set(recipes.map((r) => r.faction))], [recipes]);

  // --- Full tabbed cross-content results (query submitted) ----------------
  if (submittedActive) {
    const matchingRecipes = recipes.filter((r) => recipeMatchesQuery(r, q, recipePaintNames(r, myPaints, sharedPaintsByAuthor)));
    const matchingPaints = PAINT_LIBRARY.filter((p) => paintMatchesQuery(p, q));
    const matchingArmies = hobby.factions.filter((f) => factionMatchesQuery(f, q));
    const matchingUnits = allUnitsMatching(recipes, q);

    const tabs = [
      { key: 'top', label: 'Top' },
      { key: 'recipes', label: 'Recipes', count: matchingRecipes.length },
      { key: 'paints', label: 'Paints', count: matchingPaints.length },
      { key: 'armies', label: `${hobby.groupLabelPlural} & Units`, count: matchingArmies.length + matchingUnits.length },
      { key: 'accounts', label: 'Accounts', count: accountsLoading ? null : accounts.length },
    ];
    const activeTab = tabs.some((t) => t.key === tab) ? tab : 'top';

    let body;
    if (activeTab === 'recipes') {
      body = matchingRecipes.length ? <div className="recipe-grid">{matchingRecipes.map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
        : <EmptyState icon="book" title="No recipes match" sub="Try a different search term." />;
    } else if (activeTab === 'paints') {
      body = matchingPaints.length
        // PAINT_LIBRARY has ~29 real duplicate name+brand combos (distinct
        // product-line SKUs) -- same index-tiebreaker fix as
        // SimilarColours.jsx/PaintPicker.jsx, else React logs duplicate-key
        // warnings and can silently drop/duplicate rows.
        ? <>{matchingPaints.slice(0, 40).map((p, i) => <PaintSearchRow key={`${paintKey(p.name, p.brand)}-${i}`} p={p} />)}</>
        : <EmptyState icon="paintdrop" title="No paints match" sub="Try a different search term." />;
    } else if (activeTab === 'armies') {
      body = (matchingArmies.length || matchingUnits.length) ? (
        <>
          {matchingArmies.length > 0 && <><div className="section-label">{hobby.groupLabelPlural}</div>{matchingArmies.map((f) => <ArmyRow key={f.id} f={f} />)}</>}
          {matchingUnits.length > 0 && <><div className="section-label">Units</div>{matchingUnits.map((u) => <UnitRow key={`${u.facId}:${u.unit}`} u={u} />)}</>}
        </>
      ) : <EmptyState icon="shield" title={`No ${hobby.groupLabelPlural.toLowerCase()} or units match`} sub="Try a different search term." />;
    } else if (activeTab === 'accounts') {
      body = accounts.length ? <>{accounts.map((p) => <AccountRow key={p.userId} p={p} />)}</>
        : <div className="empty-state__sub">{accountsLoading ? 'Searching…' : 'No painters match.'}</div>;
    } else {
      const rankedRecipes = rankByTier(matchingRecipes, (r) => r.name, q).map((r) => ({ kind: 'recipe', data: r }));
      const rankedPaints = rankByTier(matchingPaints, (p) => p.name, q).map((p) => ({ kind: 'paint', data: p }));
      const rankedArmies = rankByTier(matchingArmies, (f) => f.label, q).map((f) => ({ kind: 'army', data: f }));
      const rankedUnits = rankByTier(matchingUnits, (u) => u.unit, q).map((u) => ({ kind: 'unit', data: u }));
      const rankedAccounts = !accountsLoading ? rankByTier(accounts, (a) => a.displayName, q).map((a) => ({ kind: 'account', data: a })) : [];
      const top = interleaveTop([rankedRecipes, rankedPaints, rankedArmies, rankedUnits, rankedAccounts], 15);
      body = top.length ? <>{top.map((item, i) => <SearchTopRow key={`${item.kind}-${i}`} item={item} />)}</>
        : <EmptyState icon="search" title="No matches" sub="Try a different search term." />;
    }

    return (
      <div className="page-enter">
        <div className="page-title">Search</div>
        <div className="search-filter-row" style={{ marginBottom: 4 }}><GlobalSearchBox query={query} onChange={changeQuery} onSubmit={submitQuery} /></div>
        <div className="search-tabs">
          {tabs.map((t) => (
            <div key={t.key} className={`search-tab ${activeTab === t.key ? 'is-active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}{t.count != null ? <span className="search-tab__count">{t.count}</span> : t.key === 'accounts' ? <span className="search-tab__count">…</span> : null}
            </div>
          ))}
        </div>
        {body}
      </div>
    );
  }

  // --- Quick results (typing, not yet submitted) --------------------------
  if (q) {
    const matchingRecipes = recipes.filter((r) => recipeMatchesQuery(r, q, recipePaintNames(r, myPaints, sharedPaintsByAuthor)));
    const hint = `Press Enter to also search paints, ${hobby.groupLabelPlural.toLowerCase()} and painters.`;
    return (
      <div className="page-enter">
        <div className="page-title">Search</div>
        <div className="search-filter-row" style={{ marginBottom: 4 }}><GlobalSearchBox query={query} onChange={changeQuery} onSubmit={submitQuery} /></div>
        <div className="fine-print" style={{ marginBottom: 14 }}>{hint}</div>
        {matchingRecipes.length ? <div className="recipe-grid">{matchingRecipes.map((r) => <RecipeCard key={r.authorId ? `${r.authorId}:${r.id}` : r.id} r={r} />)}</div>
          : <EmptyState icon="book" title="No recipes match yet" sub={hint} />}
      </div>
    );
  }

  // --- Showcase (no query) -------------------------------------------------
  let list = recipes;
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
        <GlobalSearchBox query={query} onChange={changeQuery} onSubmit={submitQuery} />
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
        <EmptyState icon="search" title="No matches" sub="Try different filters, or search above for anything else." />
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
