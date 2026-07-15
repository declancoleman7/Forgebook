// Forgebook — main app logic (vanilla JS, no framework)

const ICONS = {
  home: '<path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" /><path d="M18 4v16" />',
  banner: '<path d="M6 3h12v16l-6-4-6 4z" />',
  palette: '<circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="1.2" fill="currentColor" /><circle cx="13" cy="8.5" r="1.2" fill="currentColor" /><circle cx="16" cy="11.5" r="1.2" fill="currentColor" /><path d="M12 21a2 2 0 0 1-2-2c0-.8.6-1.3.6-2 0-.6-.6-1-1.3-1H9a4 4 0 0 1 0-8" />',
  settings: '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />',
  search: '<circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />',
  back: '<path d="M15 18l-6-6 6-6" />',
  edit: '<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />',
  trash: '<path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />',
  chevron: '<path d="M9 18l6-6-6-6" />',
  plus: '<path d="M12 5v14" /><path d="M5 12h14" />',
  download: '<path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" />',
  upload: '<path d="M12 21V9" /><path d="M7 14l5-5 5 5" /><path d="M5 3h14" />',
  image: '<rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5-5-6 6-3-3-4 4" />',
  check: '<path d="M5 12l5 5L20 6" />',
  cart: '<circle cx="9" cy="20" r="1.4" fill="currentColor" /><circle cx="18" cy="20" r="1.4" fill="currentColor" /><path d="M2 3h3l2.5 12h11l2-8H6" />',
  filter: '<path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />',
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

function emblemSvg(key, size = 24) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${emblemPaths(key)}</svg>`;
}

const NAV_ITEMS = [
  { route: "home", label: "Home", icon: "home" },
  { route: "factions", label: "Armies", icon: "banner" },
  { route: "recipes", label: "Recipes", icon: "book" },
  { route: "paints", label: "Paints", icon: "palette" },
  { route: "settings", label: "Settings", icon: "settings" },
];

let state = {
  route: "home",
  params: {},
  factionFilter: null, // single value — the Faction/Unit drill-down and "+ New recipe for X" preset context, NOT the Recipes list filter below
  unitFilter: undefined, // undefined = no unit filter; null = General only; string = that unit
  recipeFactionFilters: [], // multi-select — the Recipes list's filter window; empty = any
  recipeDifficultyFilters: [], // multi-select — same window; empty = any
  recipeFilterOpen: false,
  searchQuery: "",
  paintLibFilter: "all", // "all" | "owned" | "want" — Paint Library ownership filter
  paintLibBrand: null, // null = all brands
};

// ---------------------------------------------------------------
// Storage accessors
// ---------------------------------------------------------------
// Deleted records are kept locally as tombstones so the deletion can be synced
// (and so a stale cloud copy can't resurrect them). The UI never sees them.
function getAllRecipeRows() { return readJSON(KEYS.recipes, []); }
function getAllPaintRows() { return readJSON(KEYS.paints, []); }

function getRecipes() { return getAllRecipeRows().filter((r) => !r.deleted); }
function getPaints() { return getAllPaintRows().filter((p) => !p.deleted); }
function getRecents() { return readJSON(KEYS.recents, []); }
function getFactionArt() { return readJSON(KEYS.art, {}); }

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false; // almost always QuotaExceededError — photos are the usual cause
  }
}

// Every write stamps the record and schedules a background push. Local storage
// is still the source of truth; the cloud catches up when it can.
function saveRecipes(rows) {
  const ok = save(KEYS.recipes, rows);
  if (ok) queueSync();
  return ok;
}
function savePaints(rows) {
  const ok = save(KEYS.paints, rows);
  if (ok) queueSync();
  return ok;
}
function saveFactionArt(a) { return save(KEYS.art, a); }

// Timestamp a record for the merge.
//
// Devices don't agree on the time. If a phone's clock runs a few minutes fast,
// a naive `Date.now()` would make its rows unbeatable — a later, genuine edit
// from a laptop would look "older" and be discarded. So a stamp is always at
// least 1ms newer than the version it was edited from. An edit therefore
// always supersedes its own parent, whatever the clocks say.
function stamp(record, prevIso) {
  const prev = prevIso ? new Date(prevIso).getTime() : 0;
  const next = Math.max(Date.now(), prev + 1);
  record.updatedAt = new Date(next).toISOString();
  delete record.seed; // touching a sample record makes it yours
  return record;
}

// Soft delete, so the deletion propagates to your other devices.
function tombstoneRecipe(id) {
  const rows = getAllRecipeRows();
  const r = rows.find((x) => x.id === id);
  if (r) { r.deleted = true; stamp(r, r.updatedAt); }
  return saveRecipes(rows);
}

function tombstonePaint(id) {
  const rows = getAllPaintRows();
  const p = rows.find((x) => x.id === id);
  if (p) { p.deleted = true; stamp(p, p.updatedAt); }
  return savePaints(rows);
}

function pushRecent(id) {
  let recents = getRecents().filter((r) => r !== id);
  recents.unshift(id);
  save(KEYS.recents, recents.slice(0, 8));
}

function findRecipe(id) { return getRecipes().find((r) => r.id === id); }
function findPaint(id) { return getPaints().find((p) => p.id === id); }

// Every distinct paint used by a recipe, in the order it's first used.
function recipePaints(r) {
  const seen = new Set();
  const out = [];
  (r.steps || []).forEach((s) => {
    [s.paintId, s.mixPaintId].forEach((pid) => {
      if (!pid || seen.has(pid)) return;
      const p = findPaint(pid);
      if (p) { seen.add(pid); out.push(p); }
    });
  });
  return out;
}

function paintUsageCount(paintId) {
  return getRecipes().filter((r) => (r.steps || []).some((s) => s.paintId === paintId || s.mixPaintId === paintId)).length;
}

// ---------------------------------------------------------------
// Paint library — browsing a real catalogue (PAINT_LIBRARY, in data.js) and
// tracking which entries the rack already has, or still needs to buy.
// ---------------------------------------------------------------
function ownedPaintFor(name, brand) {
  return getPaints().find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
}

// Synced via its own paint_wants table (see cloud.js's syncWants) rather
// than living in the paints array — a wanted-but-unowned paint has no
// business in the rack or the recipe-step paint picker. Tombstoned like
// recipes/paints so a "no longer want it" toggle propagates instead of the
// old copy quietly reappearing on another device.
function getAllWantRows() {
  const raw = readJSON(KEYS.wantToBuy, []);
  // Defensive migration: earlier versions stored this as a plain array of
  // paint keys with no sync metadata. Upgrade any such entries in place.
  let changed = false;
  const rows = raw.map((w) => {
    if (typeof w === "string") { changed = true; return stamp({ key: w, deleted: false }, null); }
    return w;
  });
  if (changed) save(KEYS.wantToBuy, rows);
  return rows;
}
function getWantToBuy() { return getAllWantRows().filter((w) => !w.deleted).map((w) => w.key); }
function isWanted(name, brand) { return getWantToBuy().includes(paintKey(name, brand)); }
function toggleWanted(name, brand) {
  const key = paintKey(name, brand);
  const rows = getAllWantRows();
  const existing = rows.find((w) => w.key === key);
  if (existing) { existing.deleted = !existing.deleted; stamp(existing, existing.updatedAt); }
  else rows.push(stamp({ key, deleted: false }, null));
  save(KEYS.wantToBuy, rows);
  queueSync();
}

// Restock is a flag on an owned paint itself, so it rides along with that
// paint's normal sync (see toRemotePaint/fromRemotePaint in cloud.js).
function toggleRestock(id) {
  const rows = getAllPaintRows();
  const p = rows.find((x) => x.id === id);
  if (!p) return;
  p.needsRestock = !p.needsRestock;
  stamp(p, p.updatedAt);
  savePaints(rows);
}

// Units that actually have recipes in a faction, plus the General bucket.
function unitsForFaction(facId) {
  const recipes = getRecipes().filter((r) => r.faction === facId);
  const map = new Map();
  let general = 0;
  recipes.forEach((r) => {
    if (!r.unit) { general++; return; }
    map.set(r.unit, (map.get(r.unit) || 0) + 1);
  });
  const units = [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { units, general };
}

// Every unit name the user has ever typed, for the form's autocomplete.
function allUnitNames() {
  return [...new Set(getRecipes().map((r) => r.unit).filter(Boolean))].sort();
}

// ---------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------
function difficultyDots(level, max = 5) {
  let out = "";
  for (let i = 1; i <= max; i++) out += `<span class="${i <= level ? "is-filled" : ""}"></span>`;
  return `<span class="difficulty">${out}</span>`;
}

// A rough painting-time estimate, purely computed from step count — not a
// stored/synced field, so it needs no schema change and no form to fill in.
// ~12 minutes per step (basecoat, shade, highlight are all in the same
// ballpark), rounded to the nearest 5.
function estimatedMinutes(r) {
  const steps = (r.steps || []).length;
  if (!steps) return 0;
  return Math.max(5, Math.round((steps * 12) / 5) * 5);
}

function formatDuration(mins) {
  if (!mins) return "—";
  if (mins < 60) return `~${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

// Steps are grouped by consecutive matching "area" (e.g. Armour, Base) so a
// recipe with no groups renders exactly as before — grouping is opt-in per
// step, not a new required field.
function groupStepsByArea(steps) {
  const groups = [];
  (steps || []).forEach((s, i) => {
    const area = (s.area || "").trim();
    const last = groups[groups.length - 1];
    if (last && last.area === area) last.items.push({ step: s, num: i + 1 });
    else groups.push({ area, items: [{ step: s, num: i + 1 }] });
  });
  return groups;
}

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function slug(s) {
  return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, "-"));
}

// Downscale a photo to a phone-friendly JPEG data URL so dozens of recipes
// with photos still fit comfortably in localStorage.
function downscaleImage(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#17161c"; // transparent PNGs land on the app background, not black
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => cb(null);
    img.src = reader.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

// ---------------------------------------------------------------
// Router
// ---------------------------------------------------------------
function navigate(route, params = {}) {
  state.route = route;
  state.params = params;
  const hash = buildHash(route, params);
  if (location.hash !== hash) location.hash = hash;
  else render();
  window.scrollTo(0, 0);
}

function buildHash(route, p) {
  if (route === "recipe") return `#/recipe/${p.id}${p.edit ? "/edit" : ""}`;
  if (route === "faction") return `#/faction/${p.id}`;
  if (route === "unit") return `#/faction/${p.id}/unit/${p.unit === null ? "_general" : slug(p.unit)}`;
  if (route === "paint") return `#/paint/${p.id}`;
  return `#/${route}`;
}

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { route: "home", params: {} };

  if (parts[0] === "recipe" && parts[1]) {
    return { route: "recipe", params: { id: decodeURIComponent(parts[1]), edit: parts[2] === "edit" } };
  }
  if (parts[0] === "faction" && parts[1]) {
    const facId = decodeURIComponent(parts[1]);
    if (parts[2] === "unit" && parts[3]) {
      const raw = parts[3];
      const unit = raw === "_general" ? null : findUnitByslug(facId, raw);
      return { route: "unit", params: { id: facId, unit } };
    }
    return { route: "faction", params: { id: facId } };
  }
  if (parts[0] === "paint" && parts[1]) {
    return { route: "paint", params: { id: decodeURIComponent(parts[1]) } };
  }
  if (parts[0] === "recipe-new" || parts[0] === "paint-new") {
    return { route: parts[0], params: {} };
  }
  return { route: parts[0], params: {} };
}

// Unit names are stored as typed; the URL carries a slug, so map back.
function findUnitByslug(facId, unitSlug) {
  const match = unitsForFaction(facId).units.find((u) => slug(u.name) === unitSlug);
  return match ? match.name : decodeURIComponent(unitSlug).replace(/-/g, " ");
}

window.addEventListener("hashchange", () => {
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;
  render();
});

// ---------------------------------------------------------------
// The recipe list currently in context — drives both the Recipes
// screen and the order you swipe through on a recipe page.
// ---------------------------------------------------------------
function getFilteredRecipes() {
  let recipes = getRecipes();
  if (state.factionFilter) recipes = recipes.filter((r) => r.faction === state.factionFilter);
  if (state.unitFilter !== undefined) {
    recipes = recipes.filter((r) => (r.unit || null) === state.unitFilter);
  }
  if (state.recipeFactionFilters.length) {
    recipes = recipes.filter((r) => state.recipeFactionFilters.includes(r.faction));
  }
  if (state.recipeDifficultyFilters.length) {
    recipes = recipes.filter((r) => state.recipeDifficultyFilters.includes(r.difficulty || 1));
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    recipes = recipes.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.unit || "").toLowerCase().includes(q) ||
      faction(r.faction).label.toLowerCase().includes(q) ||
      recipePaints(r).some((p) => p.name.toLowerCase().includes(q))
    );
  }
  return recipes;
}

// ---------------------------------------------------------------
// Swipe between recipes
// ---------------------------------------------------------------
let swipeDirection = null; // "left" = swiped left = went to the next recipe

// Every view's HTML bakes in class="page-enter" (a fade-and-rise-in), and
// render() always does a full root.innerHTML swap — including for in-place
// interactions that never change the route at all (picking a difficulty,
// typing a search query, toggling a filter chip, a background sync tick
// completing). Since innerHTML always creates a brand-new element, the
// animation replayed on literally every click, which is what reads as the
// whole app "jerking" or "reloading itself" on every interaction. This key
// lets render() tell "actually went somewhere new" apart from "same screen,
// something on it changed" and only animate the former.
let lastRenderKey = null;

function swipeTo(dir) {
  const siblings = getFilteredRecipes();
  const idx = siblings.findIndex((r) => r.id === state.params.id);
  if (idx === -1) return false;
  const target = siblings[idx + dir];
  if (!target) return false;
  swipeDirection = dir === 1 ? "left" : "right";
  navigate("recipe", { id: target.id });
  return true;
}

// ---------------------------------------------------------------
// View: Home
// ---------------------------------------------------------------
function viewHome() {
  const recipes = getRecipes();
  const recents = getRecents().map(findRecipe).filter(Boolean);
  const cont = recents[0] || recipes[0];
  const recentList = recents.slice(0, 4);
  const armies = [...new Set(recipes.map((r) => r.faction))];

  return `
    <div class="page-enter">
      ${cont ? `
        <div class="section-label">Continue Painting</div>
        <div class="continue-card" data-nav="recipe" data-id="${cont.id}" style="--faction-color:${faction(cont.faction).color}">
          <div class="continue-card__hero ${cont.photo ? "has-photo" : ""}"${cont.photo ? ` style="background-image:url('${cont.photo}')"` : ""}>
            ${cont.photo ? "" : emblemSvg(faction(cont.faction).emblem, 28)}
          </div>
          <div class="continue-card__body">
            <div class="continue-card__eyebrow">${escapeHtml(faction(cont.faction).label)}${cont.unit ? " \u00b7 " + escapeHtml(cont.unit) : ""}</div>
            <div class="continue-card__title">${escapeHtml(cont.name)}</div>
          </div>
          <div class="continue-card__chevron">${icon("chevron", 20)}</div>
        </div>
      ` : ""}

      <div class="section-label">Your Armies</div>
      ${armies.length ? `
        <div class="faction-row">
          ${armies.map((id) => {
            const f = faction(id);
            const n = recipes.filter((r) => r.faction === id).length;
            return `
              <div class="faction-chip" data-nav="faction" data-id="${f.id}" style="--chip-color:${f.color}">
                <span class="faction-chip__emblem" style="color:${f.color}">${emblemSvg(f.emblem, 15)}</span>
                ${escapeHtml(f.label)} <span class="faction-chip__count">${n}</span>
              </div>`;
          }).join("")}
        </div>
      ` : `<div class="empty-state__sub" style="padding:0 2px 8px">No recipes yet. Tap Armies to pick a faction.</div>`}

      <div class="section-label">Recent Recipes</div>
      ${recentList.length
        ? `<div class="recipe-grid">${recentList.map(recipeCardHtml).join("")}</div>`
        : emptyStateHtml("book", "No recipes yet", "Tap the + button to record your first paint recipe.")}
    </div>
  `;
}

function recipeCardHtml(r) {
  const fac = faction(r.faction);
  const stack = (r.steps || []).slice(0, 6).map((s) => {
    const p = findPaint(s.paintId);
    return p ? p.hex : fac.color;
  });
  return `
    <div class="recipe-card" data-nav="recipe" data-id="${r.id}" style="--faction-color:${fac.color}">
      <div class="recipe-card__hero ${r.photo ? "has-photo" : ""}"${r.photo ? ` style="background-image:url('${r.photo}')"` : ""}>
        ${r.photo ? "" : `<span class="recipe-card__emblem" style="color:${fac.color}">${emblemSvg(fac.emblem, 34)}</span>`}
        <div class="recipe-card__stack">
          ${stack.map((c) => `<span style="background:${c}"></span>`).join("")}
        </div>
      </div>
      <div class="recipe-card__body">
        <div class="recipe-card__id">${escapeHtml(r.unit || "General")}</div>
        <div class="recipe-card__name">${escapeHtml(r.name)}</div>
        <div class="recipe-card__meta">
          ${difficultyDots(r.difficulty || 1)}
          <span class="recipe-card__steps">${(r.steps || []).length} steps</span>
        </div>
      </div>
    </div>
  `;
}

// A narrow, clickable row for the desktop three-pane layout's list column —
// recipeCardHtml's tile doesn't fit a 300px sidebar, so this is a distinct,
// denser presentation of the same data.
function recipeCompactRowHtml(r, isActive) {
  const fac = faction(r.faction);
  const stack = (r.steps || []).slice(0, 5).map((s) => {
    const p = findPaint(s.paintId);
    return p ? p.hex : fac.color;
  });
  return `
    <div class="compact-recipe-row ${isActive ? "is-active" : ""}" data-nav="recipe" data-id="${r.id}" style="--faction-color:${fac.color}">
      <div class="compact-recipe-row__thumb ${r.photo ? "has-photo" : ""}"${r.photo ? ` style="background-image:url('${r.photo}')"` : ""}>
        ${r.photo ? "" : `<span style="color:${fac.color}">${emblemSvg(fac.emblem, 18)}</span>`}
      </div>
      <div class="compact-recipe-row__info">
        <div class="compact-recipe-row__name">${escapeHtml(r.name)}</div>
        <div class="compact-recipe-row__meta">${escapeHtml(fac.label)}${r.unit ? " · " + escapeHtml(r.unit) : ""}</div>
        <div class="compact-recipe-row__stack">${stack.map((c) => `<span style="background:${c}"></span>`).join("")}</div>
      </div>
    </div>`;
}

// Shared by the mobile grid and the desktop list column in viewRecipes() —
// a single trigger button, badged with the active filter count, that opens
// the multi-select filter window below. Both call this and
// recipeFilterOverlayHtml() so mobile and desktop never drift apart.
function recipeFilterTriggerHtml() {
  const count = state.recipeFactionFilters.length + state.recipeDifficultyFilters.length;
  return `
    <button type="button" class="btn btn-ghost recipe-filter-trigger" data-action="open-recipe-filters" style="margin-bottom:14px">
      ${icon("filter", 14)} Filters
      ${count ? `<span class="recipe-filter-trigger__count">${count}</span>` : ""}
    </button>`;
}

// A toggle-everything-at-once window rather than inline chips: army and
// difficulty are both multi-select (tap several armies on at once), and
// nothing here is hidden behind a scroll the way the old chip row was.
function recipeFilterOverlayHtml(used) {
  if (!state.recipeFilterOpen) return "";
  const toggle = (active, label, dataAttr) =>
    `<div class="faction-chip ${active ? "is-active" : ""}" ${dataAttr}>${label}</div>`;

  return `
    <div class="filter-overlay">
      <div class="filter-overlay__backdrop" data-action="close-recipe-filters"></div>
      <div class="filter-overlay__panel">
        <div class="filter-overlay__header">
          <div class="page-title" style="margin:0">Filter recipes</div>
          <button type="button" class="icon-btn" data-action="close-recipe-filters" aria-label="Close">${icon("back", 16)}</button>
        </div>
        <div class="filter-overlay__body">
          <div class="section-label">Army</div>
          <div class="filter-toggle-row">
            ${used.map((id) => {
              const f = faction(id);
              const active = state.recipeFactionFilters.includes(f.id);
              return `
                <div class="faction-chip ${active ? "is-active" : ""}" data-toggle-faction-filter="${f.id}" style="--chip-color:${f.color}">
                  <span class="faction-chip__emblem" style="color:${f.color}">${emblemSvg(f.emblem, 15)}</span>
                  ${escapeHtml(f.label)}
                </div>`;
            }).join("") || `<div class="empty-state__sub">No recipes yet to filter by army.</div>`}
          </div>
          <div class="section-label">Difficulty</div>
          <div class="filter-toggle-row">
            ${[1, 2, 3, 4, 5].map((n) =>
              toggle(state.recipeDifficultyFilters.includes(n), difficultyDots(n), `data-toggle-difficulty-filter="${n}"`)
            ).join("")}
          </div>
        </div>
        <div class="filter-overlay__footer">
          <button type="button" class="btn btn-ghost btn-block" data-action="clear-recipe-filters">Clear all</button>
          <button type="button" class="btn btn-primary btn-block" data-action="close-recipe-filters">Done</button>
        </div>
      </div>
    </div>`;
}

function emptyStateHtml(iconName, title, sub) {
  return `
    <div class="empty-state">
      <div class="empty-state__glyph">${icon(iconName, 30)}</div>
      <div class="empty-state__title">${escapeHtml(title)}</div>
      <div class="empty-state__sub">${escapeHtml(sub)}</div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Factions (browse all armies)
// ---------------------------------------------------------------
function viewFactions() {
  const recipes = getRecipes();
  const art = getFactionArt();
  const q = state.searchQuery.toLowerCase();

  const tile = (f) => {
    const n = recipes.filter((r) => r.faction === f.id).length;
    return `
      <div class="faction-tile" data-nav="faction" data-id="${f.id}" style="--faction-color:${f.color}">
        <div class="faction-tile__art ${art[f.id] ? "has-art" : ""}"${art[f.id] ? ` style="background-image:url('${art[f.id]}')"` : ""}>
          ${art[f.id] ? "" : `<span style="color:${f.color}">${emblemSvg(f.emblem, 30)}</span>`}
        </div>
        <div class="faction-tile__name">${escapeHtml(f.label)}</div>
        <div class="faction-tile__count">${n ? n + (n === 1 ? " recipe" : " recipes") : "\u2014"}</div>
      </div>
    `;
  };

  const body = SYSTEMS.map((sys) => {
    const groups = sys.alliances.map((alliance) => {
      const facs = FACTIONS.filter(
        (f) => f.system === sys.id && f.alliance === alliance && (!q || f.label.toLowerCase().includes(q))
      );
      if (!facs.length) return "";
      return `
        <div class="alliance-label">${escapeHtml(alliance)}</div>
        <div class="faction-tiles">${facs.map(tile).join("")}</div>
      `;
    }).join("");
    if (!groups.trim()) return "";
    return `<div class="section-label">${escapeHtml(sys.label)}</div>${groups}`;
  }).join("");

  return `
    <div class="page-enter">
      <div class="page-title">Armies</div>
      ${body || emptyStateHtml("search", "No armies match", "Try a different search term.")}
      <div class="fine-print">
        Emblems are original artwork drawn for Forgebook, not Games Workshop's own icons.
        Open any army to swap in your own image.
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: One faction — its units, plus the General bucket
// ---------------------------------------------------------------
function viewFaction(id) {
  const f = faction(id);
  const art = getFactionArt()[f.id];
  const { units, general } = unitsForFaction(f.id);
  const total = general + units.reduce((a, u) => a + u.count, 0);

  const row = (label, count, unitValue) => `
    <div class="unit-row ${unitValue === null ? "is-general" : ""}" data-open-unit="${unitValue === null ? "_general" : escapeHtml(unitValue)}" data-faction="${f.id}">
      <div class="unit-row__bar" style="background:${f.color}"></div>
      <div class="unit-row__name">${escapeHtml(label)}</div>
      <div class="unit-row__count">${count}</div>
      <div class="unit-row__chevron">${icon("chevron", 16)}</div>
    </div>
  `;

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="factions">${icon("back", 18)}</button>
        <button class="btn btn-ghost btn-sm" data-action="faction-art" data-id="${f.id}">
          ${icon("image", 14)} ${art ? "Change emblem" : "Add emblem"}
        </button>
      </div>

      <div class="faction-banner ${art ? "has-art" : ""}"${art ? ` style="background-image:url('${art}')"` : ""} style="--faction-color:${f.color}">
        ${art ? "" : `<span class="faction-banner__emblem" style="color:${f.color}">${emblemSvg(f.emblem, 64)}</span>`}
      </div>
      <input type="file" id="faction-art-input" accept="image/*" class="hidden" />

      <div class="detail-title">${escapeHtml(f.label)}</div>
      <div class="detail-sub">${escapeHtml(f.alliance)} \u00b7 ${total} recipe${total === 1 ? "" : "s"}</div>

      <div class="section-label">Units</div>
      <div class="unit-list">
        ${row(GENERAL_UNIT.replace(/\u2014/g, "").trim() + " \u2014 whole army", general, null)}
        ${units.map((u) => row(u.name, u.count, u.name)).join("")}
      </div>
      ${!units.length ? `<div class="empty-state__sub" style="padding:10px 2px">
        No units yet for this army. Units appear here as soon as you save a recipe against one \u2014
        or use General for recipes that apply to the whole force.
      </div>` : ""}

      <div class="detail-actions">
        <button class="btn btn-primary btn-block" data-action="new-for-faction" data-id="${f.id}">
          + New recipe for ${escapeHtml(f.label)}
        </button>
      </div>
      ${art ? `<button class="btn btn-ghost btn-block" data-action="faction-art-clear" data-id="${f.id}">Remove custom emblem</button>` : ""}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Recipes within one unit (or General)
// ---------------------------------------------------------------
function viewUnit(facId, unit) {
  const f = faction(facId);
  state.factionFilter = facId;
  state.unitFilter = unit;
  const recipes = getFilteredRecipes();
  const label = unit === null ? "General" : unit;

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="faction" data-id="${facId}">${icon("back", 18)}</button>
      </div>
      <div class="detail-id" style="color:${f.color}">${escapeHtml(f.label)}</div>
      <div class="detail-title">${escapeHtml(label)}</div>
      <div class="detail-sub">${recipes.length} recipe${recipes.length === 1 ? "" : "s"}${unit === null ? " that apply to the whole army" : ""}</div>

      ${recipes.length
        ? `<div class="recipe-grid" style="margin-top:14px">${recipes.map(recipeCardHtml).join("")}</div>`
        : emptyStateHtml("book", "Nothing here yet", "Tap + to add the first recipe for this unit.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: All recipes
// ---------------------------------------------------------------
function viewRecipes() {
  state.unitFilter = undefined; // the all-recipes screen ignores unit scoping
  const recipes = getFilteredRecipes();
  const used = [...new Set(getRecipes().map((r) => r.faction))];
  const filterTrigger = recipeFilterTriggerHtml();
  const noMatch = emptyStateHtml("search", "No matches", "Try different filters or a different search term.");

  // Mobile keeps the existing full-width card grid unchanged. Desktop
  // (≥860px) instead shows a narrow, always-visible list column — this is
  // what lets a click open a recipe alongside the list instead of replacing
  // it. Both are rendered; CSS shows exactly one depending on viewport,
  // the same trick buildShell() already uses for side-nav vs. bottom-nav.
  return `
    <div class="page-enter recipe-master">
      <div class="recipe-master__mobile-grid">
        <div class="page-title">Recipes</div>
        ${filterTrigger}
        ${recipes.length ? `<div class="recipe-grid">${recipes.map(recipeCardHtml).join("")}</div>` : noMatch}
      </div>
      <div class="recipe-master__list">
        <div class="page-title" style="margin-bottom:2px">Recipes</div>
        <div class="detail-sub" style="margin-bottom:12px">${recipes.length} recipe${recipes.length === 1 ? "" : "s"}</div>
        <div class="mini-search">
          ${icon("search", 14)}
          <input type="text" id="recipe-list-search" placeholder="Search recipes" value="${escapeHtml(state.searchQuery)}" />
        </div>
        ${filterTrigger}
        ${recipes.length ? recipes.map((r) => recipeCompactRowHtml(r, false)).join("") : noMatch}
      </div>
      <div class="recipe-master__placeholder">
        ${emptyStateHtml("book", "Select a recipe", "Pick one from the list to see it here.")}
      </div>
      ${recipeFilterOverlayHtml(used)}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Recipe detail
// ---------------------------------------------------------------
function viewRecipeDetail(id) {
  const r = findRecipe(id);
  if (!r) return emptyStateHtml("search", "Recipe not found", "It may have been deleted.");
  pushRecent(id);
  const f = faction(r.faction);
  const paints = recipePaints(r);

  const siblings = getFilteredRecipes();
  const idx = siblings.findIndex((s) => s.id === r.id);
  const swipeCls = swipeDirection === "left" ? "swipe-in-left" : swipeDirection === "right" ? "swipe-in-right" : "";

  const detailHtml = `
    <div class="page-enter ${swipeCls}" data-swipe-page>
      <div class="detail-header">
        <button class="icon-btn" data-nav="recipes">${icon("back", 18)}</button>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" data-nav="recipe" data-id="${r.id}" data-edit="1">${icon("edit", 16)}</button>
          <button class="icon-btn" data-action="delete-recipe" data-id="${r.id}">${icon("trash", 16)}</button>
        </div>
      </div>

      <div class="detail-hero ${r.photo ? "has-photo" : ""}" style="--faction-color:${f.color}${r.photo ? `;background-image:url('${r.photo}')` : ""}">
        ${r.photo ? "" : `<span style="color:${f.color}">${emblemSvg(f.emblem, 64)}</span>`}
      </div>

      ${idx > -1 && siblings.length > 1 ? `
        <div class="detail-pager">
          <button class="icon-btn" data-swipe="prev" ${idx === 0 ? "disabled" : ""} aria-label="Previous recipe">${icon("back", 16)}</button>
          <span>${idx + 1} of ${siblings.length} &middot; swipe to browse</span>
          <button class="icon-btn" data-swipe="next" ${idx === siblings.length - 1 ? "disabled" : ""} aria-label="Next recipe">${icon("chevron", 16)}</button>
        </div>` : ""}

      <div class="detail-crumbs">
        <span data-nav="faction" data-id="${f.id}" style="color:${f.color}">${escapeHtml(f.label)}</span>
        <span class="sep">/</span>
        <span data-open-unit="${r.unit ? escapeHtml(r.unit) : "_general"}" data-faction="${f.id}">${escapeHtml(r.unit || "General")}</span>
      </div>
      <div class="detail-title">${escapeHtml(r.name)}</div>
      <div class="metastrip">
        <div class="metastrip__cell">
          <div class="metastrip__n">${difficultyDots(r.difficulty || 1)}</div>
          <div class="metastrip__l">Difficulty</div>
        </div>
        <div class="metastrip__cell">
          <div class="metastrip__n">${(r.steps || []).length}</div>
          <div class="metastrip__l">Steps</div>
        </div>
        <div class="metastrip__cell">
          <div class="metastrip__n">${formatDuration(estimatedMinutes(r))}</div>
          <div class="metastrip__l">Est. time</div>
        </div>
      </div>

      <div class="section-label">Paints Used</div>
      <div class="paint-list">
        ${paints.length ? paints.map((p) => `
          <div class="paint-row" data-nav="paint" data-id="${p.id}">
            <div class="paint-row__swatch" style="background:${p.hex}"></div>
            <div>
              <div class="paint-row__name">${escapeHtml(p.name)}</div>
              <div class="paint-row__brand">${escapeHtml(p.brand || "")}${p.type ? " \u00b7 " + escapeHtml(p.type) : ""}</div>
            </div>
            <div class="paint-row__hex">${escapeHtml(p.hex)}</div>
          </div>
        `).join("") : `<div class="empty-state__sub">No paints listed.</div>`}
      </div>

      <div class="section-label">Method</div>
      ${(r.steps || []).length ? groupStepsByArea(r.steps).map((g) => `
        ${g.area ? `<div class="grouphead">${escapeHtml(g.area)}</div>` : ""}
        <div class="layer-stack">
          ${g.items.map(({ step: s, num }) => {
            const p = findPaint(s.paintId);
            const mixP = s.mixPaintId ? findPaint(s.mixPaintId) : null;
            const swatchBg = mixP
              ? `linear-gradient(to bottom, ${p ? p.hex : f.color} 50%, ${mixP.hex} 50%)`
              : (p ? p.hex : f.color);
            const paintLabel = mixP
              ? `${p ? escapeHtml(p.name) : "(paint deleted)"} + ${escapeHtml(mixP.name)}${s.mixRatio ? ` (${escapeHtml(s.mixRatio)})` : ""}`
              : (p ? escapeHtml(p.name) : "(paint deleted)");
            return `
              <div class="layer-stack__row">
                <div class="layer-stack__num">${num}</div>
                <div class="layer-stack__swatch" style="background:${swatchBg}"></div>
                <div class="layer-stack__content">
                  <div class="layer-stack__top">
                    <span class="layer-stack__technique">${escapeHtml(s.technique)}</span>
                    <span class="layer-stack__paint">${paintLabel}</span>
                  </div>
                  ${s.notes ? `<div class="layer-stack__notes">${escapeHtml(s.notes)}</div>` : ""}
                </div>
              </div>`;
          }).join("")}
        </div>
      `).join("") : `<div class="empty-state__sub">No steps recorded.</div>`}

      ${r.notes ? `<div class="section-label">Notes</div><div class="notes-block">${escapeHtml(r.notes)}</div>` : ""}

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-action="print">Print Recipe</button>
      </div>
    </div>
  `;

  // Mobile: .recipe-master is plain block, the list column is hidden, and
  // the detail above fills the screen exactly as before. Desktop: the two
  // become side-by-side columns, so switching recipes from the sidebar
  // never requires leaving this screen.
  return `
    <div class="recipe-master">
      <div class="recipe-master__list">
        ${siblings.map((s) => recipeCompactRowHtml(s, s.id === r.id)).join("")}
      </div>
      <div class="recipe-master__detail">
        ${detailHtml}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Paint rack (the user's own paints)
// ---------------------------------------------------------------
function viewPaints() {
  const q = state.searchQuery.toLowerCase();
  let paints = getPaints();
  if (q) {
    paints = paints.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.type || "").toLowerCase().includes(q)
    );
  }

  // group by brand so a big rack stays navigable
  const brands = [...new Set(paints.map((p) => p.brand || "Unbranded"))].sort();

  return `
    <div class="page-enter">
      <div class="page-title">Paint Rack</div>
      <div class="detail-sub" style="margin-bottom:14px">
        ${getPaints().length} paint${getPaints().length === 1 ? "" : "s"} on the rack.
        Add them here once, then pull them into any recipe.
      </div>

      <button class="btn btn-primary btn-block" data-nav="paint-library" style="margin-bottom:10px">
        Browse paint library
      </button>
      <button class="btn btn-ghost btn-block" data-nav="paint-new" style="margin-bottom:18px">
        + Add paint manually
      </button>

      ${paints.length ? brands.map((brand) => `
        <div class="section-label">${escapeHtml(brand)}</div>
        ${paints.filter((p) => (p.brand || "Unbranded") === brand).sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
          const n = paintUsageCount(p.id);
          return `
            <div class="paint-lib-row" data-nav="paint" data-id="${p.id}">
              <div class="paint-row__swatch" style="background:${p.hex}"></div>
              <div>
                <div class="paint-row__name">${escapeHtml(p.name)}</div>
                <div class="paint-row__brand">${escapeHtml(p.type || "Other")}</div>
              </div>
              ${p.needsRestock ? `<span class="restock-badge">Buy</span>` : ""}
              <div class="paint-lib-row__count">${n ? n + (n === 1 ? " recipe" : " recipes") : "unused"}</div>
              <div class="unit-row__chevron">${icon("chevron", 14)}</div>
            </div>`;
        }).join("")}
      `).join("") : emptyStateHtml("palette", "No paints match", "Add a paint, or clear the search.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: One paint
// ---------------------------------------------------------------
function viewPaint(id) {
  const p = findPaint(id);
  if (!p) return emptyStateHtml("palette", "Paint not found", "It may have been removed from the rack.");
  const used = getRecipes().filter((r) => (r.steps || []).some((s) => s.paintId === p.id));

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="paints">${icon("back", 18)}</button>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" data-action="edit-paint" data-id="${p.id}">${icon("edit", 16)}</button>
          <button class="icon-btn" data-action="delete-paint" data-id="${p.id}">${icon("trash", 16)}</button>
        </div>
      </div>

      <div class="paint-hero" style="background:${p.hex}"></div>
      <div class="detail-title">${escapeHtml(p.name)}</div>
      <div class="detail-sub">${escapeHtml(p.brand || "Unbranded")} \u00b7 ${escapeHtml(p.type || "Other")} \u00b7 <span class="paint-row__hex">${escapeHtml(p.hex)}</span></div>

      <div class="settings-group" style="margin:16px 0">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Need to buy</div>
            <div class="settings-row__desc">Flag this one for restocking next time you're shopping.</div>
          </div>
          <button class="btn ${p.needsRestock ? "btn-danger" : "btn-ghost"} btn-sm" data-action="toggle-restock" data-id="${p.id}">
            ${p.needsRestock ? "Flagged" : "Flag it"}
          </button>
        </div>
      </div>

      <div class="section-label">Used In</div>
      ${used.length
        ? `<div class="recipe-grid">${used.map(recipeCardHtml).join("")}</div>`
        : `<div class="empty-state__sub">Not used in any recipe yet.</div>`}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Paint library — browse a real catalogue and mark paints as owned
// or needed. Citadel's current range only for now (see PAINT_LIBRARY), but
// brand is a real field throughout so a second brand is just more data, not
// a rework — the brand filter row below only renders once there's more than
// one brand to choose between.
//
// Three states per paint, not two: not-owned, not-owned-and-wanted ("need to
// buy" — missing from the rack entirely), and owned-but-needs-restock (you
// have it, it's running low). Owned and "need to buy" are mutually
// exclusive; restock only ever applies once something's owned. The trailing
// icon button is the same slot for both flags — its meaning (buy vs.
// restock) follows from whether the paint is owned, so it never needs to
// show both at once.
// ---------------------------------------------------------------
function viewPaintLibrary() {
  const q = state.searchQuery.toLowerCase();
  let entries = PAINT_LIBRARY;
  if (state.paintLibBrand) entries = entries.filter((p) => p.brand === state.paintLibBrand);
  if (q) entries = entries.filter((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));

  const isOwnedEntry = (p) => !!ownedPaintFor(p.name, p.brand);
  const isWantedEntry = (p) => !isOwnedEntry(p) && isWanted(p.name, p.brand);

  if (state.paintLibFilter === "owned") entries = entries.filter(isOwnedEntry);
  else if (state.paintLibFilter === "want") entries = entries.filter(isWantedEntry);

  const allBrands = [...new Set(PAINT_LIBRARY.map((p) => p.brand))];
  const totalCount = PAINT_LIBRARY.length;
  const ownedCount = PAINT_LIBRARY.filter(isOwnedEntry).length;
  const wantCount = PAINT_LIBRARY.filter(isWantedEntry).length;
  const pct = totalCount ? Math.round((ownedCount / totalCount) * 100) : 0;

  // Group by each entry's own type/range label (brand-authentic, e.g. "Speedpaint
  // 2.0" or "Model Color") rather than the fixed Citadel-only PAINT_TYPES list, so
  // every brand's real ranges show up as their own section.
  const groups = [];
  entries.forEach((p) => { if (!groups.includes(p.type)) groups.push(p.type); });

  const row = (p) => {
    const owned = ownedPaintFor(p.name, p.brand);
    const wanted = isWanted(p.name, p.brand);
    const flagBtn = owned
      ? `<button class="lib-row__flag is-restock ${owned.needsRestock ? "is-on" : ""}" data-action="toggle-restock" data-id="${owned.id}" title="${owned.needsRestock ? "Flagged for restock" : "Flag for restock"}">${icon("cart", 14)}</button>`
      : `<button class="lib-row__flag is-wanted ${wanted ? "is-on" : ""}" data-action="toggle-wanted" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}" title="${wanted ? "On your buy list" : "Add to buy list"}">${icon("cart", 14)}</button>`;
    return `
      <div class="lib-row ${owned ? "is-owned" : ""}"
        data-action="toggle-have"
        data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}"
        data-hex="${p.hex}" data-type="${escapeHtml(p.type)}"
      >
        <div class="paint-row__swatch" style="background:${p.hex}"></div>
        <div class="lib-row__info">
          <div class="paint-row__name">${escapeHtml(p.name)}</div>
          <div class="paint-row__brand">${escapeHtml(p.brand)} · ${escapeHtml(p.type)}</div>
        </div>
        ${flagBtn}
        <span class="lib-row__ring">${icon("check", 14)}</span>
      </div>`;
  };

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="paints">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">Paint Library</div>
        <div style="width:36px"></div>
      </div>
      <div class="detail-sub" style="margin-bottom:14px">
        Tap a paint to mark it on your rack. Flag ones you're missing for a buy list, or ones
        you own but are running low for a restock. Colours are close approximations, not
        official swatches — manufacturers don't publish exact codes.
      </div>

      <div class="lib-progress">
        <div class="lib-progress__stats">
          <div class="lib-progress__stat"><span class="lib-progress__n">${ownedCount}<small>/${totalCount}</small></span><span class="lib-progress__l">On rack</span></div>
          <div class="lib-progress__stat"><span class="lib-progress__n" style="color:var(--blood-bright)">${wantCount}</span><span class="lib-progress__l">To buy</span></div>
        </div>
        <div class="lib-progress__bar"><i style="width:${pct}%"></i></div>
      </div>

      <div class="lib-filter-seg">
        <button class="${state.paintLibFilter === "all" ? "is-active" : ""}" data-action="lib-filter" data-filter="all">All <span class="b">${totalCount}</span></button>
        <button class="${state.paintLibFilter === "owned" ? "is-active" : ""}" data-action="lib-filter" data-filter="owned">On rack <span class="b">${ownedCount}</span></button>
        <button class="${state.paintLibFilter === "want" ? "is-active" : ""}" data-action="lib-filter" data-filter="want">To buy <span class="b">${wantCount}</span></button>
      </div>

      ${allBrands.length > 1 ? `
        <div class="faction-row" style="margin-bottom:10px">
          <div class="faction-chip ${!state.paintLibBrand ? "is-active" : ""}" data-action="lib-brand" data-brand="">All brands</div>
          ${allBrands.map((b) => `<div class="faction-chip ${state.paintLibBrand === b ? "is-active" : ""}" data-action="lib-brand" data-brand="${escapeHtml(b)}">${escapeHtml(b)}</div>`).join("")}
        </div>
      ` : ""}

      ${entries.length ? groups.map((type) => {
        const inType = entries.filter((p) => p.type === type);
        const ownedInType = inType.filter(isOwnedEntry).length;
        return `
          <div class="section-label">${escapeHtml(type)} <span class="lib-section-count">${ownedInType}/${inType.length} owned</span></div>
          <div class="lib-grid">${inType.map(row).join("")}</div>
        `;
      }).join("") : emptyStateHtml("search", "No matches", "Try a different search or filter.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Paint form (add / edit)
// ---------------------------------------------------------------
let paintForm = null;

function initPaintForm(existing) {
  paintForm = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: null, name: "", brand: "Citadel", hex: "#c9a227", type: "Base" };
}

function viewPaintForm(isEdit) {
  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-action="paint-cancel">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">${isEdit ? "Edit Paint" : "New Paint"}</div>
        <div style="width:36px"></div>
      </div>

      <div class="paint-hero" id="paint-preview" style="background:${paintForm.hex}"></div>

      <div class="field">
        <label>Paint name</label>
        <input type="text" id="p-name" value="${escapeHtml(paintForm.name)}" placeholder="e.g. Warboss Green" />
      </div>

      <div class="field">
        <label>Brand</label>
        <select id="p-brand">
          ${PAINT_BRANDS.map((b) => `<option value="${b}" ${paintForm.brand === b ? "selected" : ""}>${b}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Type</label>
        <select id="p-type">
          ${PAINT_TYPES.map((t) => `<option value="${t}" ${paintForm.type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Colour</label>
        <div class="field-hex-row">
          <input type="color" id="p-hex" value="${paintForm.hex}" />
          <span class="paint-row__hex" id="p-hex-label">${escapeHtml(paintForm.hex)}</span>
        </div>
      </div>

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-action="paint-cancel">Cancel</button>
        <button class="btn btn-primary btn-block" data-action="paint-save">Save paint</button>
      </div>
    </div>
  `;
}

function bindPaintForm(root) {
  const bind = (id, fn) => { const el = root.querySelector(id); if (el) el.oninput = el.onchange = fn; };
  bind("#p-name", (e) => { paintForm.name = e.target.value; });
  bind("#p-brand", (e) => { paintForm.brand = e.target.value; });
  bind("#p-type", (e) => { paintForm.type = e.target.value; });
  bind("#p-hex", (e) => {
    paintForm.hex = e.target.value;
    root.querySelector("#p-hex-label").textContent = e.target.value;
    root.querySelector("#paint-preview").style.background = e.target.value;
  });
}

// ---------------------------------------------------------------
// View: Recipe form (add / edit)
// ---------------------------------------------------------------
let recipeForm = null;

function newStep() {
  // mixPaintId is undefined (not "") when there's no mix at all — that's
  // what tells the form whether to show the "+ Mix in a second paint"
  // button or the expanded second-paint picker.
  return { id: "ns" + Math.random().toString(36).slice(2, 9), technique: TECHNIQUES[0], paintId: "", notes: "", area: "", mixPaintId: undefined, mixRatio: "" };
}

function initRecipeForm(existing, presetFaction, presetUnit) {
  recipeForm = existing
    ? Object.assign(JSON.parse(JSON.stringify(existing)), { originalPhoto: existing.photo || null })
    : {
        id: null,
        name: "",
        faction: presetFaction || FACTIONS[0].id,
        unit: presetUnit || "",
        difficulty: 2,
        photo: null,
        steps: [newStep()],
        notes: "",
      };
  if (recipeForm.unit === null) recipeForm.unit = "";
}

function generateId(facId) {
  const prefix = (faction(facId).label.match(/[A-Za-z]/g) || ["R"]).slice(0, 3).join("").toUpperCase();
  const existing = getRecipes();
  let n = existing.filter((r) => r.id.startsWith(prefix + "-")).length + 1;
  let id = `${prefix}-${String(n).padStart(3, "0")}`;
  while (existing.some((r) => r.id === id)) {
    n++;
    id = `${prefix}-${String(n).padStart(3, "0")}`;
  }
  return id;
}

function paintOptionsHtml(selectedId) {
  const paints = getPaints().slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    `<option value="">\u2014 choose from your rack \u2014</option>` +
    paints.map((p) => `<option value="${p.id}" ${selectedId === p.id ? "selected" : ""}>${escapeHtml(p.name)}${p.brand ? " (" + escapeHtml(p.brand) + ")" : ""}</option>`).join("")
  );
}

function viewRecipeForm(isEdit) {
  const rackEmpty = getPaints().length === 0;

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-action="recipe-cancel">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">${isEdit ? "Edit Recipe" : "New Recipe"}</div>
        <div style="width:36px"></div>
      </div>

      <div class="field">
        <label>Recipe name</label>
        <input type="text" id="r-name" value="${escapeHtml(recipeForm.name)}" placeholder="e.g. Ork Boyz Skin" />
      </div>

      <div class="field">
        <label>Army</label>
        <select id="r-faction">
          ${SYSTEMS.map((sys) => `
            <optgroup label="${escapeHtml(sys.label)}">
              ${FACTIONS.filter((f) => f.system === sys.id).map((f) =>
                `<option value="${f.id}" ${recipeForm.faction === f.id ? "selected" : ""}>${escapeHtml(f.label)}</option>`
              ).join("")}
            </optgroup>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Unit <span class="label-hint">leave blank for a General, army-wide recipe</span></label>
        <input type="text" id="r-unit" list="unit-suggestions" value="${escapeHtml(recipeForm.unit)}" placeholder="e.g. Boyz, Termagants, Intercessors" />
        <datalist id="unit-suggestions">
          ${allUnitNames().map((u) => `<option value="${escapeHtml(u)}"></option>`).join("")}
        </datalist>
      </div>

      <div class="field">
        <label>Difficulty</label>
        <div class="difficulty-picker">
          ${[1, 2, 3, 4, 5].map((n) =>
            `<button type="button" data-set-difficulty="${n}" class="${recipeForm.difficulty === n ? "is-selected" : ""}">${n}</button>`
          ).join("")}
        </div>
      </div>

      <div class="field">
        <label>Photo of the finished mini <span class="label-hint">optional</span></label>
        <div class="photo-field">
          ${recipeForm.photo ? `
            <div class="photo-field__preview" style="background-image:url('${recipeForm.photo}')"></div>
            <button type="button" class="btn btn-ghost btn-sm" data-action="photo-pick">Replace</button>
            <button type="button" class="btn btn-danger btn-sm" data-action="photo-remove">Remove</button>
          ` : `<button type="button" class="repeater-add" style="margin:0" data-action="photo-pick">+ Add photo</button>`}
          <input type="file" id="photo-input" accept="image/*" class="hidden" />
        </div>
      </div>

      <div class="section-label">Method steps</div>
      ${rackEmpty ? `<div class="notice">Your paint rack is empty. Add a paint first \u2014 every step picks a paint from the rack.</div>` : ""}

      ${recipeForm.steps.map((s, i) => `
        <div class="repeater-item">
          <div class="repeater-item__header">
            <span class="repeater-item__num">Step ${i + 1}</span>
            <div class="repeater-item__controls">
              <button type="button" class="icon-btn-sm" data-action="move-step-up" data-step-id="${s.id}" ${i === 0 ? "disabled" : ""} aria-label="Move step up">${icon("chevron", 13)}</button>
              <button type="button" class="icon-btn-sm repeater-item__down" data-action="move-step-down" data-step-id="${s.id}" ${i === recipeForm.steps.length - 1 ? "disabled" : ""} aria-label="Move step down">${icon("chevron", 13)}</button>
              ${recipeForm.steps.length > 1 ? `<button type="button" class="repeater-item__remove" data-remove-step="${s.id}" aria-label="Remove step">&times;</button>` : ""}
            </div>
          </div>
          <div class="field" style="margin-bottom:10px;">
            <label>Technique</label>
            <div class="tech-picker">
              ${TECHNIQUES.map((t) => `<button type="button" data-set-technique="${escapeHtml(t)}" data-step-id="${s.id}" class="${s.technique === t ? "is-selected" : ""}">${escapeHtml(t)}</button>`).join("")}
            </div>
          </div>
          <div class="field" style="margin-bottom:10px;">
            <label>Paint</label>
            <div class="paint-pick-row">
              <span class="paint-pick-row__swatch" data-swatch-for="${s.id}" style="background:${(findPaint(s.paintId) || {}).hex || "transparent"}"></span>
              <select data-step-field="paintId" data-step-id="${s.id}">${paintOptionsHtml(s.paintId)}</select>
              <button type="button" class="btn btn-ghost btn-sm" data-action="quick-paint" data-step-id="${s.id}">+ New</button>
            </div>
          </div>
          ${s.mixPaintId !== undefined ? `
            <div class="field" style="margin-bottom:10px;">
              <label>Mixed with <span class="label-hint">a second paint, blended with the one above</span></label>
              <div class="paint-pick-row">
                <span class="paint-pick-row__swatch" data-swatch-for="${s.id}-mix" style="background:${(findPaint(s.mixPaintId) || {}).hex || "transparent"}"></span>
                <select data-step-field="mixPaintId" data-step-id="${s.id}">${paintOptionsHtml(s.mixPaintId)}</select>
                <button type="button" class="btn btn-ghost btn-sm" data-action="remove-mix" data-step-id="${s.id}">Remove</button>
              </div>
              <input type="text" data-step-field="mixRatio" data-step-id="${s.id}" value="${escapeHtml(s.mixRatio || "")}" placeholder="Ratio, e.g. 1:1" style="margin-top:8px" />
            </div>
          ` : `<button type="button" class="repeater-add" style="margin:0 0 10px" data-action="add-mix" data-step-id="${s.id}">+ Mix in a second paint</button>`}
          <div class="field" style="margin-bottom:10px;">
            <label>Group <span class="label-hint">optional — e.g. Armour, Base, Trim</span></label>
            <input type="text" data-step-field="area" data-step-id="${s.id}" list="area-suggestions" value="${escapeHtml(s.area || "")}" placeholder="e.g. Armour" />
          </div>
          <div class="field" style="margin-bottom:0;">
            <label>Notes</label>
            <textarea data-step-field="notes" data-step-id="${s.id}" placeholder="e.g. two thin coats, let dry between">${escapeHtml(s.notes)}</textarea>
          </div>
        </div>
        <button type="button" class="repeater-insert" data-action="insert-step-after" data-step-id="${s.id}">+ Insert step here</button>
      `).join("")}
      <datalist id="area-suggestions">
        ${[...new Set(recipeForm.steps.map((s) => s.area).filter(Boolean))].map((a) => `<option value="${escapeHtml(a)}"></option>`).join("")}
      </datalist>
      <button type="button" class="repeater-add" data-action="add-step">+ Add step</button>

      <div class="field">
        <label>Notes</label>
        <textarea id="r-notes" placeholder="Variations, tips, anything worth remembering">${escapeHtml(recipeForm.notes)}</textarea>
      </div>

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-action="recipe-cancel">Cancel</button>
        <button class="btn btn-primary btn-block" data-action="recipe-save">Save recipe</button>
      </div>
    </div>
  `;
}

function bindRecipeForm(root) {
  const bind = (sel, fn) => { const el = root.querySelector(sel); if (el) el.oninput = fn; };
  bind("#r-name", (e) => { recipeForm.name = e.target.value; });
  bind("#r-unit", (e) => { recipeForm.unit = e.target.value; });
  bind("#r-notes", (e) => { recipeForm.notes = e.target.value; });

  const facEl = root.querySelector("#r-faction");
  if (facEl) facEl.onchange = (e) => { recipeForm.faction = e.target.value; };

  root.querySelectorAll("[data-step-field]").forEach((el) => {
    el.oninput = el.onchange = (e) => {
      const step = recipeForm.steps.find((s) => s.id === e.target.dataset.stepId);
      if (!step) return;
      step[e.target.dataset.stepField] = e.target.value;
      if (e.target.dataset.stepField === "paintId" || e.target.dataset.stepField === "mixPaintId") {
        // update the swatch beside the picker without a full re-render
        const isMix = e.target.dataset.stepField === "mixPaintId";
        const sw = root.querySelector(`[data-swatch-for="${step.id}${isMix ? "-mix" : ""}"]`);
        const p = findPaint(isMix ? step.mixPaintId : step.paintId);
        if (sw) sw.style.background = p ? p.hex : "transparent";
      }
    };
  });
}

// ---------------------------------------------------------------
// View: Settings
// ---------------------------------------------------------------
// Shared by the boot-time gate and this signed-out Settings block, so the
// two never drift out of sync on copy or on which disclaimers get shown.
function authFormHtml() {
  return `
    <div class="field" style="margin-bottom:10px">
      <label>Email</label>
      <input type="email" id="signin-email" placeholder="you@example.com" autocomplete="email" />
    </div>
    <div class="field" style="margin-bottom:10px">
      <label>Password</label>
      <input type="password" id="signin-password" placeholder="Your password" autocomplete="current-password" />
    </div>
    <button class="btn btn-primary btn-block" data-action="sign-in" ${cloudAvailable() ? "" : "disabled"}>Sign in</button>
    <button type="button" class="btn btn-ghost btn-sm" data-action="forgot-password" style="margin-top:8px">Forgot password?</button>
    <div class="settings-row__desc" style="margin-top:10px">
      ${cloudAvailable()
        ? "Forgebook is invite only \u2014 there's no sign-up form. If you've accepted an invite and set a password, sign in above."
        : "You're offline, so sign-in isn't available right now. The app works fine without it."}
    </div>
  `;
}

function viewSettings() {
  return `
    <div class="page-enter">
      <div class="page-title">Settings</div>

      <div class="section-label">Account</div>
      <div class="settings-group">
        ${isSignedIn() ? `
          <div class="settings-row">
            <div>
              <div class="settings-row__label">${escapeHtml(currentEmail())}</div>
              <div class="settings-row__desc">${escapeHtml(syncStatusLabel() || "")}</div>
            </div>
            <button class="btn btn-ghost btn-sm" data-action="sync-now" ${syncing ? "disabled" : ""}>Sync now</button>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-row__label">Change password</div>
              <div class="settings-row__desc">Update the password you sign in with.</div>
            </div>
            <button class="btn btn-ghost btn-sm" data-nav="change-password">Change</button>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-row__label">Sign out</div>
              <div class="settings-row__desc">Clears this device's copy of your book. Your recipes stay in the cloud.</div>
            </div>
            <button class="btn btn-danger" data-action="sign-out">Sign out</button>
          </div>
        ` : `
          <div class="settings-row" style="display:block">
            <div class="settings-row__label">Sign in to sync across devices</div>
            <div class="settings-row__desc" style="margin-bottom:14px">
              Enter the email and password you set when you accepted your invite.
            </div>
            ${authFormHtml()}
          </div>
        `}
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Install Forgebook</div>
            <div class="settings-row__desc">Add to your home screen for offline, app-like use.</div>
          </div>
          <button class="btn btn-primary" id="install-btn">Install</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Export data</div>
            <div class="settings-row__desc">Download recipes, paint rack and emblems as one JSON backup.</div>
          </div>
          <button class="icon-btn" data-action="export">${icon("download", 16)}</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Import data</div>
            <div class="settings-row__desc">Restore from a JSON backup file.</div>
          </div>
          <button class="icon-btn" data-action="import">${icon("upload", 16)}</button>
          <input type="file" id="import-input" accept="application/json" class="hidden" />
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Reset to sample data</div>
            <div class="settings-row__desc">Erase everything and reload the starter recipes and paints.</div>
          </div>
          <button class="btn btn-danger" data-action="reset">Reset</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Forgebook</div>
            <div class="settings-row__desc">Version 0.5 &middot; ${getRecipes().length} recipes &middot; ${getPaints().length} paints &middot; Works offline</div>
          </div>
        </div>
      </div>

      <div class="fine-print">
        Faction names are used to organise your own recipes. Forgebook is an unofficial hobby
        tool, not affiliated with or endorsed by Games Workshop. All emblems shipped with the
        app are original artwork. If you sign in, your email address and an encrypted password
        are stored with our database provider (Supabase) so your recipes can sync across
        devices — this is a small, self-run hobby project, not a professional security service,
        so please use a password you don't rely on elsewhere. Nothing is required to use
        Forgebook without an account.
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Change password (signed-in users only)
// ---------------------------------------------------------------
function viewChangePassword() {
  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="settings">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">Change Password</div>
        <div style="width:36px"></div>
      </div>

      <div class="field">
        <label>New password</label>
        <input type="password" id="new-password" placeholder="At least 8 characters" autocomplete="new-password" />
      </div>
      <div class="field">
        <label>Confirm password</label>
        <input type="password" id="new-password-confirm" placeholder="Type it again" autocomplete="new-password" />
      </div>

      <div class="notice">
        Use a password you don't already rely on elsewhere. Forgebook is a small, self-run
        hobby project, not a professional security service — Supabase (our database provider)
        handles and stores your password, hashed; Forgebook itself never sees it in plain text.
      </div>

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-nav="settings">Cancel</button>
        <button class="btn btn-primary btn-block" data-action="change-password-save">Save password</button>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Render
// ---------------------------------------------------------------
function mergePromptHtml() {
  return `
    <div class="page-enter">
      <div class="page-title">Welcome back</div>
      <div class="notice" style="margin-bottom:18px">
        Signed in as <strong>${escapeHtml(currentEmail() || "")}</strong>
      </div>
      <div class="settings-group">
        <div class="settings-row" style="display:block">
          <div class="settings-row__label">This device has ${pendingMerge} recipe${pendingMerge === 1 ? "" : "s"} saved locally</div>
          <div class="settings-row__desc" style="margin:8px 0 14px">
            Do you want to add them to your account, so they sync to your other devices?
            If this isn't your device, or these aren't yours, discard them instead —
            anything already in your account is untouched either way.
          </div>
          <button class="btn btn-primary btn-block" data-action="merge-accept">Add them to my account</button>
          <button class="btn btn-ghost btn-block" data-action="merge-decline">Discard this device's copy</button>
        </div>
      </div>
    </div>
  `;
}

function bindAuthInputs(root) {
  const bind = (id, fn) => { const el = root.querySelector(id); if (el) el.oninput = fn; };
  bind("#signin-email", (e) => { authEmail = e.target.value; });
  bind("#signin-password", (e) => { authPassword = e.target.value; });
  bind("#new-password", (e) => { authNewPassword = e.target.value; });
  bind("#new-password-confirm", (e) => { authNewPasswordConfirm = e.target.value; });
}

function render() {
  // render() is also the callback auth state changes fire into. If the shell
  // hasn't been built yet, we're sitting on the boot splash, the gate, or a
  // password screen — the only thing that can happen here is a sign-in
  // resolving after the fact (e.g. an invite/recovery link), in which case we
  // re-run the boot decision instead of trying (and failing) to touch a
  // #view-root that doesn't exist yet.
  if (!appBooted) {
    decideBootState();
    return;
  }

  const { route, params } = state;
  const root = document.getElementById("view-root");
  let html = "";
  let showFab = true;

  // A pending merge decision blocks everything else — we must not sync until
  // the person has told us whether this device's book is theirs.
  if (pendingMerge) {
    root.innerHTML = mergePromptHtml();
    document.getElementById("fab").classList.add("hidden");
    updateSyncPill();
    return;
  }

  if (route === "home") html = viewHome();
  else if (route === "factions") html = viewFactions();
  else if (route === "faction") { html = viewFaction(params.id); showFab = false; }
  else if (route === "unit") html = viewUnit(params.id, params.unit);
  else if (route === "recipes") html = viewRecipes();
  else if (route === "recipe" && params.edit) {
    if (!recipeForm || recipeForm.id !== params.id) initRecipeForm(findRecipe(params.id));
    html = viewRecipeForm(true);
    showFab = false;
  } else if (route === "recipe") { html = viewRecipeDetail(params.id); showFab = false; }
  else if (route === "recipe-new") {
    if (!recipeForm || recipeForm.id !== null) {
      // Tapped + while browsing a unit? Start the recipe already scoped to it.
      const presetUnit = state.unitFilter === undefined ? "" : (state.unitFilter || "");
      initRecipeForm(null, state.factionFilter, presetUnit);
    }
    html = viewRecipeForm(false);
    showFab = false;
  } else if (route === "paints") html = viewPaints();
  else if (route === "paint") { html = viewPaint(params.id); showFab = false; }
  else if (route === "paint-new") {
    if (!paintForm) initPaintForm(null);
    html = viewPaintForm(!!paintForm.id);
    showFab = false;
  } else if (route === "paint-library") { html = viewPaintLibrary(); showFab = false; }
  else if (route === "settings") { html = viewSettings(); showFab = false; }
  else if (route === "change-password") {
    if (!isSignedIn()) { navigate("settings"); return; }
    html = viewChangePassword();
    showFab = false;
  }
  else html = viewHome();

  // A swipe (recipe → different recipe) always counts as "went somewhere
  // new" even though the route name itself doesn't change, since params.id
  // does — keyed on both together.
  const routeKey = route + ":" + JSON.stringify(params);
  const isFreshEntry = routeKey !== lastRenderKey;
  lastRenderKey = routeKey;

  // The desktop three-pane list column would otherwise snap back to the top
  // every time you pick a different recipe from it (a full innerHTML swap
  // has no notion of "the same scrollable element", so its scroll position
  // is naturally lost) — carry it across manually instead.
  const prevListScroll = root.querySelector(".recipe-master__list")?.scrollTop;

  // Any input whose own oninput handler calls render() (live-filter-as-you-
  // type boxes, e.g. the recipe list search) would otherwise lose focus
  // after exactly one keystroke: innerHTML below destroys and recreates it
  // fresh each time, and a newly-created element with the same id doesn't
  // inherit focus just because its predecessor had it. Capture it here and
  // restore it after, generically, so this can't bite any input like it.
  const activeEl = document.activeElement;
  const focusInfo = activeEl && activeEl.id && root.contains(activeEl)
    ? { id: activeEl.id, selStart: activeEl.selectionStart, selEnd: activeEl.selectionEnd }
    : null;

  root.innerHTML = html;
  if (!isFreshEntry) {
    // Same screen as last render, just something on it changed — don't
    // replay the entrance animation.
    root.querySelectorAll(".page-enter").forEach((el) => el.classList.remove("page-enter"));
  }
  if (prevListScroll) {
    const newList = root.querySelector(".recipe-master__list");
    if (newList) newList.scrollTop = prevListScroll;
  }
  if (focusInfo) {
    const el = document.getElementById(focusInfo.id);
    if (el) {
      el.focus();
      if (focusInfo.selStart != null) {
        try { el.setSelectionRange(focusInfo.selStart, focusInfo.selEnd); } catch (e) {}
      }
    }
  }
  swipeDirection = null; // one-shot: only a swipe-driven render animates directionally
  bindRecipeForm(root);
  bindPaintForm(root);

  const recipeListSearch = root.querySelector("#recipe-list-search");
  if (recipeListSearch) recipeListSearch.oninput = (e) => { state.searchQuery = e.target.value; render(); };

  document.querySelectorAll(".bottom-nav__item, .side-nav__item").forEach((el) => {
    const r = el.dataset.route;
    const active =
      r === route ||
      (r === "recipes" && (route === "recipe" || route === "recipe-new")) ||
      (r === "factions" && (route === "faction" || route === "unit")) ||
      (r === "paints" && (route === "paint" || route === "paint-new" || route === "paint-library"));
    el.classList.toggle("is-active", active);
  });

  document.getElementById("fab").classList.toggle("hidden", !showFab);
  updateSyncPill();

  bindAuthInputs(root);

  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.onclick = () => {
      if (window.deferredInstallPrompt) window.deferredInstallPrompt.prompt();
      else showToast("Use your browser menu \u2192 'Install app' or 'Add to Home screen'");
    };
  }
}

// ---------------------------------------------------------------
// Sync status pill (topbar)
// ---------------------------------------------------------------
let authEmail = "";
let authPassword = "";
let authNewPassword = "";
let authNewPasswordConfirm = "";
let passwordScreenMode = null; // "setup" | "recovery" while a password screen is showing
let appBooted = false; // false while the boot splash, gate, or a password screen is showing

function updateSyncPill() {
  const pill = document.getElementById("sync-pill");
  if (!pill) return;
  const label = syncStatusLabel();
  const isLive = !!label && !syncing && cloudError !== "sync" && navigator.onLine;
  pill.classList.toggle("hidden", !label);
  pill.classList.toggle("is-busy", syncing);
  pill.classList.toggle("is-error", cloudError === "sync" || !navigator.onLine);
  if (label) {
    pill.innerHTML = (isLive ? '<span class="sync-pill__dot"></span>' : "") + escapeHtml(label);
  }
}

// ---------------------------------------------------------------
// Click delegation
// ---------------------------------------------------------------
document.addEventListener("click", async (e) => {
  const t = (sel) => e.target.closest(sel);

  // --- account ---
  if (t("[data-action='sign-in']")) {
    const email = (authEmail || "").trim();
    const password = authPassword || "";
    if (!email || !email.includes("@")) { showToast("Enter your email"); return; }
    if (!password) { showToast("Enter your password"); return; }
    const res = await signIn(email, password);
    if (!res.ok) { showToast(res.message); return; }
    authPassword = "";
    if (!appBooted) decideBootState();
    else render();
    return;
  }

  if (t("[data-action='forgot-password']")) {
    const email = (authEmail || "").trim();
    if (!email || !email.includes("@")) { showToast("Enter your email above first, then try again"); return; }
    showToast("Sending\u2026");
    const res = await requestPasswordReset(email);
    showToast(res.message);
    return;
  }

  if (t("[data-action='submit-password']")) {
    const pw = authNewPassword || "";
    const pw2 = authNewPasswordConfirm || "";
    if (pw.length < 8) { showToast("Use at least 8 characters"); return; }
    if (pw !== pw2) { showToast("Passwords don't match"); return; }
    const res = await setPassword(pw);
    if (!res.ok) { showToast(res.message || "Couldn't set that password"); return; }
    const wasSetup = passwordScreenMode === "setup";
    authNewPassword = ""; authNewPasswordConfirm = ""; passwordScreenMode = null;
    decideBootState();
    showToast(wasSetup ? "Password set \u2014 welcome!" : "Password updated");
    return;
  }

  if (t("[data-action='change-password-save']")) {
    const pw = authNewPassword || "";
    const pw2 = authNewPasswordConfirm || "";
    if (pw.length < 8) { showToast("Use at least 8 characters"); return; }
    if (pw !== pw2) { showToast("Passwords don't match"); return; }
    const res = await setPassword(pw);
    if (!res.ok) { showToast(res.message || "Couldn't update your password"); return; }
    authNewPassword = ""; authNewPasswordConfirm = "";
    showToast("Password updated");
    navigate("settings");
    return;
  }

  if (t("[data-action='continue-guest']")) {
    continueAsGuest();
    bootIntoApp();
    return;
  }

  if (t("[data-action='sign-out']")) {
    if (confirm("Sign out? This device's copy of your book will be cleared. Your recipes stay safely in your account.")) {
      await signOutCloud();
      showToast("Signed out");
      navigate("home");
    }
    return;
  }

  if (t("[data-action='sync-now']")) {
    const res = await syncNow({ full: true });
    showToast(res.ok ? "Synced" : "Couldn't sync \u2014 will retry automatically");
    return;
  }

  if (t("[data-action='merge-accept']")) { await acceptMerge(); navigate("home"); return; }
  if (t("[data-action='merge-decline']")) { await declineMerge(); navigate("home"); return; }

  const navEl = t("[data-nav]");
  if (navEl) {
    const route = navEl.dataset.nav;
    const id = navEl.dataset.id;
    if (route === "recipe" && id) navigate("recipe", { id, edit: navEl.dataset.edit === "1" });
    else if (route === "faction" && id) navigate("faction", { id });
    else if (route === "paint" && id) navigate("paint", { id });
    else if (route === "paint-new") { initPaintForm(null); navigate("paint-new"); }
    else if (route === "recipe-new") { recipeForm = null; navigate("recipe-new"); }
    else {
      if (route === "recipes") state.factionFilter = null;
      state.unitFilter = undefined;
      navigate(route);
    }
    return;
  }

  const unitEl = t("[data-open-unit]");
  if (unitEl) {
    const raw = unitEl.dataset.openUnit;
    navigate("unit", { id: unitEl.dataset.faction, unit: raw === "_general" ? null : raw });
    return;
  }

  const swipeBtn = t("[data-swipe]");
  if (swipeBtn && !swipeBtn.disabled) {
    swipeTo(swipeBtn.dataset.swipe === "next" ? 1 : -1);
    return;
  }

  const openRecipeFilters = t("[data-action='open-recipe-filters']");
  if (openRecipeFilters) { state.recipeFilterOpen = true; render(); return; }

  const closeRecipeFilters = t("[data-action='close-recipe-filters']");
  if (closeRecipeFilters) { state.recipeFilterOpen = false; render(); return; }

  const clearRecipeFilters = t("[data-action='clear-recipe-filters']");
  if (clearRecipeFilters) {
    state.recipeFactionFilters = [];
    state.recipeDifficultyFilters = [];
    render();
    return;
  }

  const toggleFacFilter = t("[data-toggle-faction-filter]");
  if (toggleFacFilter) {
    const id = toggleFacFilter.dataset.toggleFactionFilter;
    const list = state.recipeFactionFilters;
    const idx = list.indexOf(id);
    if (idx > -1) list.splice(idx, 1); else list.push(id);
    render();
    return;
  }

  const toggleDiffFilter = t("[data-toggle-difficulty-filter]");
  if (toggleDiffFilter) {
    const n = Number(toggleDiffFilter.dataset.toggleDifficultyFilter);
    const list = state.recipeDifficultyFilters;
    const idx = list.indexOf(n);
    if (idx > -1) list.splice(idx, 1); else list.push(n);
    render();
    return;
  }

  const newForFaction = t("[data-action='new-for-faction']");
  if (newForFaction) {
    recipeForm = null;
    state.factionFilter = newForFaction.dataset.id;
    navigate("recipe-new");
    return;
  }

  // --- faction custom emblem ---
  const facArt = t("[data-action='faction-art']");
  if (facArt) {
    document.getElementById("faction-art-input").click();
    return;
  }
  const facArtClear = t("[data-action='faction-art-clear']");
  if (facArtClear) {
    const art = getFactionArt();
    delete art[facArtClear.dataset.id];
    saveFactionArt(art);
    showToast("Custom emblem removed");
    render();
    return;
  }

  // --- recipe form ---
  const setDiff = t("[data-set-difficulty]");
  if (setDiff) { recipeForm.difficulty = Number(setDiff.dataset.setDifficulty); render(); return; }

  const setTech = t("[data-set-technique]");
  if (setTech) {
    const step = recipeForm.steps.find((s) => s.id === setTech.dataset.stepId);
    if (step) { step.technique = setTech.dataset.setTechnique; render(); }
    return;
  }

  const addStep = t("[data-action='add-step']");
  if (addStep) { recipeForm.steps.push(newStep()); render(); return; }

  const insertStep = t("[data-action='insert-step-after']");
  if (insertStep) {
    const i = recipeForm.steps.findIndex((s) => s.id === insertStep.dataset.stepId);
    if (i > -1) recipeForm.steps.splice(i + 1, 0, newStep());
    render();
    return;
  }

  const moveStepUp = t("[data-action='move-step-up']");
  if (moveStepUp) {
    const i = recipeForm.steps.findIndex((s) => s.id === moveStepUp.dataset.stepId);
    if (i > 0) {
      const [step] = recipeForm.steps.splice(i, 1);
      recipeForm.steps.splice(i - 1, 0, step);
    }
    render();
    return;
  }

  const moveStepDown = t("[data-action='move-step-down']");
  if (moveStepDown) {
    const i = recipeForm.steps.findIndex((s) => s.id === moveStepDown.dataset.stepId);
    if (i > -1 && i < recipeForm.steps.length - 1) {
      const [step] = recipeForm.steps.splice(i, 1);
      recipeForm.steps.splice(i + 1, 0, step);
    }
    render();
    return;
  }

  const removeStep = t("[data-remove-step]");
  if (removeStep) {
    recipeForm.steps = recipeForm.steps.filter((s) => s.id !== removeStep.dataset.removeStep);
    render();
    return;
  }

  const photoPick = t("[data-action='photo-pick']");
  if (photoPick) { document.getElementById("photo-input").click(); return; }

  const photoRemove = t("[data-action='photo-remove']");
  if (photoRemove) { recipeForm.photo = null; render(); return; }

  const addMix = t("[data-action='add-mix']");
  if (addMix) {
    const step = recipeForm.steps.find((s) => s.id === addMix.dataset.stepId);
    if (step) { step.mixPaintId = ""; step.mixRatio = step.mixRatio || "1:1"; render(); }
    return;
  }

  const removeMix = t("[data-action='remove-mix']");
  if (removeMix) {
    const step = recipeForm.steps.find((s) => s.id === removeMix.dataset.stepId);
    if (step) { step.mixPaintId = undefined; step.mixRatio = ""; render(); }
    return;
  }

  // Add a paint to the rack without losing the half-written recipe
  const quickPaint = t("[data-action='quick-paint']");
  if (quickPaint) {
    initPaintForm(null);
    paintForm.returnToRecipe = quickPaint.dataset.stepId;
    navigate("paint-new");
    return;
  }

  const recipeCancel = t("[data-action='recipe-cancel']");
  if (recipeCancel) {
    const id = recipeForm.id;
    recipeForm = null;
    navigate(id ? "recipe" : "home", id ? { id } : {});
    return;
  }

  const recipeSave = t("[data-action='recipe-save']");
  if (recipeSave) {
    if (!recipeForm.name.trim()) { showToast("Give the recipe a name first"); return; }
    const steps = recipeForm.steps.filter((s) => s.paintId);
    if (!steps.length) { showToast("Add at least one step with a paint"); return; }

    const payload = {
      id: recipeForm.id,
      name: recipeForm.name.trim(),
      faction: recipeForm.faction,
      unit: recipeForm.unit.trim() || null, // blank unit == General
      difficulty: recipeForm.difficulty,
      photo: recipeForm.photo,
      steps,
      notes: recipeForm.notes,
    };

    const isNew = !payload.id;
    const prevRow = payload.id ? getAllRecipeRows().find((r) => r.id === payload.id) : null;
    stamp(payload, prevRow ? prevRow.updatedAt : null);
    payload.photoPath = recipeForm.photoPath || null;
    if (recipeForm.photo !== (recipeForm.originalPhoto || null)) payload.photoPath = null; // photo changed → re-upload
    payload.published = !!recipeForm.published;

    const rows = getAllRecipeRows();
    if (isNew) {
      payload.id = generateId(payload.faction);
      rows.unshift(payload);
    } else {
      const idx = rows.findIndex((r) => r.id === payload.id);
      if (idx > -1) rows[idx] = payload;
    }
    if (!saveRecipes(rows)) { showToast("Storage is full \u2014 try removing a photo"); return; }

    recipeForm = null;
    showToast("Recipe saved");
    navigate("recipe", { id: payload.id });
    return;
  }

  const delRecipe = t("[data-action='delete-recipe']");
  if (delRecipe) {
    if (confirm("Delete this recipe? This cannot be undone.")) {
      tombstoneRecipe(delRecipe.dataset.id);
      showToast("Recipe deleted");
      navigate("recipes");
    }
    return;
  }

  // --- paint form ---
  const editPaint = t("[data-action='edit-paint']");
  if (editPaint) { initPaintForm(findPaint(editPaint.dataset.id)); navigate("paint-new"); return; }

  // --- paint library ---
  // The flag button (toggle-wanted / toggle-restock) sits inside the row
  // that carries toggle-have, so these two must be checked BEFORE
  // toggle-have below — closest() would otherwise walk up past the button
  // to the row and fire the wrong handler.
  const toggleWant = t("[data-action='toggle-wanted']");
  if (toggleWant) {
    toggleWanted(toggleWant.dataset.name, toggleWant.dataset.brand);
    render();
    return;
  }

  const toggleRestockBtn = t("[data-action='toggle-restock']");
  if (toggleRestockBtn) {
    toggleRestock(toggleRestockBtn.dataset.id);
    render();
    return;
  }

  const toggleHave = t("[data-action='toggle-have']");
  if (toggleHave) {
    const { name, brand, hex, type } = toggleHave.dataset;
    const existing = ownedPaintFor(name, brand);
    if (existing) {
      tombstonePaint(existing.id);
      showToast("Removed from rack");
    } else {
      const rows = getAllPaintRows();
      const id = "lib-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      rows.push(stamp({ id, name, brand, hex, type }, null));
      if (!savePaints(rows)) { showToast("Storage is full"); return; }
      // Owned and "need to buy" are mutually exclusive — clear the wishlist
      // flag now that it's moot.
      if (isWanted(name, brand)) toggleWanted(name, brand);
      showToast("Added to rack");
    }
    render();
    return;
  }

  const libFilter = t("[data-action='lib-filter']");
  if (libFilter) { state.paintLibFilter = libFilter.dataset.filter; render(); return; }

  const libBrand = t("[data-action='lib-brand']");
  if (libBrand) { state.paintLibBrand = libBrand.dataset.brand || null; render(); return; }

  const paintCancel = t("[data-action='paint-cancel']");
  if (paintCancel) {
    const back = paintForm.returnToRecipe;
    paintForm = null;
    if (back !== undefined) navigate(recipeForm && recipeForm.id ? "recipe" : "recipe-new", recipeForm && recipeForm.id ? { id: recipeForm.id, edit: true } : {});
    else navigate("paints");
    return;
  }

  const paintSave = t("[data-action='paint-save']");
  if (paintSave) {
    if (!paintForm.name.trim()) { showToast("Give the paint a name first"); return; }
    const paints = getPaints();
    const dupe = paints.find(
      (p) => p.id !== paintForm.id && paintKey(p.name, p.brand) === paintKey(paintForm.name, paintForm.brand)
    );
    if (dupe) { showToast("That paint is already on your rack"); return; }

    const returnStep = paintForm.returnToRecipe;
    let savedId = paintForm.id;
    const rows = getAllPaintRows();

    if (paintForm.id) {
      const idx = rows.findIndex((p) => p.id === paintForm.id);
      if (idx > -1) {
        const prev = rows[idx].updatedAt;
        rows[idx] = stamp({ id: paintForm.id, name: paintForm.name.trim(), brand: paintForm.brand, hex: paintForm.hex, type: paintForm.type }, prev);
      }
    } else {
      savedId = "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      rows.push(stamp({ id: savedId, name: paintForm.name.trim(), brand: paintForm.brand, hex: paintForm.hex, type: paintForm.type }, null));
    }
    if (!savePaints(rows)) { showToast("Storage is full"); return; }
    paintForm = null;
    showToast("Paint saved");

    // came from a recipe step? drop the new paint straight into it
    if (returnStep !== undefined && recipeForm) {
      const step = recipeForm.steps.find((s) => s.id === returnStep);
      if (step) step.paintId = savedId;
      navigate(recipeForm.id ? "recipe" : "recipe-new", recipeForm.id ? { id: recipeForm.id, edit: true } : {});
    } else {
      navigate("paint", { id: savedId });
    }
    return;
  }

  const delPaint = t("[data-action='delete-paint']");
  if (delPaint) {
    const n = paintUsageCount(delPaint.dataset.id);
    const msg = n
      ? `This paint is used in ${n} recipe${n === 1 ? "" : "s"}. Deleting it will leave those steps without a paint. Continue?`
      : "Remove this paint from your rack?";
    if (confirm(msg)) {
      tombstonePaint(delPaint.dataset.id);
      showToast("Paint removed");
      navigate("paints");
    }
    return;
  }

  // --- settings ---
  if (t("[data-action='print']")) { window.print(); return; }

  if (t("[data-action='export']")) {
    const payload = {
      forgebook: SCHEMA_VERSION,
      exported: new Date().toISOString(),
      recipes: getRecipes(),
      paints: getPaints(),
      factionArt: getFactionArt(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forgebook-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded");
    return;
  }

  if (t("[data-action='import']")) { document.getElementById("import-input").click(); return; }

  if (t("[data-action='reset']")) {
    if (confirm("This will erase all recipes and paints and reload the sample data. Continue?")) {
      resetStore();
      showToast("Reset to sample data");
      navigate("home");
    }
    return;
  }
});

// ---------------------------------------------------------------
// File inputs
// ---------------------------------------------------------------
document.addEventListener("change", (e) => {
  if (e.target.id === "photo-input") {
    const file = e.target.files[0];
    if (!file) return;
    downscaleImage(file, 900, (url) => {
      if (!url) { showToast("That image could not be read"); return; }
      recipeForm.photo = url;
      render();
    });
    return;
  }

  if (e.target.id === "faction-art-input") {
    const file = e.target.files[0];
    if (!file) return;
    downscaleImage(file, 480, (url) => {
      if (!url) { showToast("That image could not be read"); return; }
      const art = getFactionArt();
      art[state.params.id] = url;
      if (!saveFactionArt(art)) { showToast("Storage is full"); return; }
      showToast("Emblem updated");
      render();
    });
    return;
  }

  if (e.target.id === "import-input") {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        // v0.4 backup
        if (data && Array.isArray(data.recipes)) {
          saveRecipes(data.recipes);
          savePaints(Array.isArray(data.paints) ? data.paints : []);
          saveFactionArt(data.factionArt || {});
          localStorage.setItem(KEYS.schema, String(SCHEMA_VERSION));
        } else if (Array.isArray(data)) {
          // a bare v0.3 export — run it through the same migration
          const migrated = migrateFromV3(data);
          saveRecipes(migrated.recipes);
          savePaints(migrated.paints);
          localStorage.setItem(KEYS.schema, String(SCHEMA_VERSION));
        } else {
          throw new Error("bad format");
        }
        showToast("Backup imported");
        navigate("home");
      } catch (err) {
        showToast("That file could not be read");
      }
    };
    reader.readAsText(file);
  }
});

// ---------------------------------------------------------------
// Touch swipe (recipe detail)
// ---------------------------------------------------------------
const touch = { active: false, x: 0, y: 0, dx: 0, locked: null, canPrev: false, canNext: false };

function swipePage() { return document.querySelector("#view-root [data-swipe-page]"); }

document.addEventListener("touchstart", (e) => {
  touch.active = false;
  if (state.route !== "recipe" || state.params.edit) return;
  if (e.target.closest("input, textarea, select, button, a")) return;
  const siblings = getFilteredRecipes();
  const idx = siblings.findIndex((r) => r.id === state.params.id);
  touch.active = true;
  touch.x = e.touches[0].clientX;
  touch.y = e.touches[0].clientY;
  touch.dx = 0;
  touch.locked = null;
  touch.canPrev = idx > 0;
  touch.canNext = idx > -1 && idx < siblings.length - 1;
}, { passive: true });

document.addEventListener("touchmove", (e) => {
  if (!touch.active) return;
  const dx = e.touches[0].clientX - touch.x;
  const dy = e.touches[0].clientY - touch.y;
  if (touch.locked === null && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
    touch.locked = Math.abs(dx) > Math.abs(dy) * 1.4 ? "h" : "v";
  }
  if (touch.locked !== "h") return;
  const blocked = (dx > 0 && !touch.canPrev) || (dx < 0 && !touch.canNext);
  touch.dx = dx;
  const page = swipePage();
  if (page) {
    page.style.transition = "none";
    page.style.transform = `translateX(${dx * (blocked ? 0.25 : 0.85)}px)`;
    page.style.opacity = blocked ? "1" : String(Math.max(0.55, 1 - Math.abs(dx) / 700));
  }
}, { passive: true });

document.addEventListener("touchend", () => {
  if (!touch.active) return;
  touch.active = false;
  const page = swipePage();
  if (touch.locked === "h" && Math.abs(touch.dx) > 70) {
    if (swipeTo(touch.dx < 0 ? 1 : -1)) return; // render() replaces the page
  }
  if (page) {
    page.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    page.style.transform = "";
    page.style.opacity = "";
    setTimeout(() => { if (page.isConnected) page.style.transition = ""; }, 220);
  }
});

document.addEventListener("keydown", (e) => {
  if (state.route !== "recipe" || state.params.edit) return;
  if (e.target.closest("input, textarea, select")) return;
  if (e.key === "ArrowRight") swipeTo(1);
  else if (e.key === "ArrowLeft") swipeTo(-1);
});

// ---------------------------------------------------------------
// Search
// ---------------------------------------------------------------
document.addEventListener("input", (e) => {
  if (e.target.id !== "search-input") return;
  state.searchQuery = e.target.value;
  // search means different things on different screens, so stay put where it makes sense
  if (["paints", "paint-library", "factions", "recipes"].includes(state.route)) render();
  else navigate("recipes");
});

// A mobile on-screen keyboard opening/closing fires a resize event too (it
// shrinks the viewport height), and re-rendering mid-keystroke would replace
// the very input the person is typing into — killing its focus and dropping
// the keyboard the instant they tap in. Width is what actually changes on a
// real rotation or window resize, so gate on that instead of firing on every
// height wobble.
let lastResizeWidth = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === lastResizeWidth) return;
  lastResizeWidth = window.innerWidth;
  render();
});

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
function buildShell() {
  document.getElementById("app").innerHTML = `
    <nav class="side-nav">
      <div class="side-nav__brand">${icon("book", 20)} Forgebook</div>
      ${NAV_ITEMS.map((n) => `
        <button class="side-nav__item" data-nav="${n.route}" data-route="${n.route}">
          ${icon(n.icon, 18)} ${n.label}
        </button>`).join("")}
    </nav>
    <header class="topbar">
      <div class="topbar__brand"><span class="glyph">${icon("book", 16)}</span> Forgebook</div>
      <div class="topbar__search">
        ${icon("search", 16)}
        <input type="text" id="search-input" placeholder="Search recipes, armies or paints" />
      </div>
      <div class="sync-pill hidden" id="sync-pill"></div>
    </header>
    <main id="view-root"></main>
    <button class="fab" id="fab" data-nav="recipe-new" aria-label="Add recipe">${icon("plus", 24)}</button>
    <nav class="bottom-nav">
      ${NAV_ITEMS.map((n) => `
        <button class="bottom-nav__item" data-nav="${n.route}" data-route="${n.route}">
          ${icon(n.icon, 20)}
          <span>${n.label}</span>
        </button>`).join("")}
    </nav>
    <div class="toast" id="toast"></div>
  `;
}

// ---------------------------------------------------------------
// Boot splash + sign-in gate
// ---------------------------------------------------------------
// Forgebook is invite only, but local-first: the book on this device is
// never at risk, and offline use never blocks on the gate. So the gate is
// soft — a sign-in screen with an always-available "continue without an
// account" escape, remembered so it only has to be dismissed once.
//
// We can't decide gate-vs-app until we know whether a session is already
// persisted, and that check is async (initCloud). Rendering the full app
// shell first and swapping to the gate a moment later would flash the app
// chrome at anyone who isn't signed in yet, so instead we hold on a minimal
// splash — no nav, no fab, nothing route-specific — until that's resolved,
// then commit to exactly one of gate or app.
function showBootSplash() {
  document.getElementById("app").innerHTML = `
    <div class="boot-splash">
      <span class="boot-splash__mark">${icon("book", 30)}</span>
      <span class="boot-splash__word">Forgebook</span>
    </div>
  `;
}

function gateHtml() {
  return `
    <div class="gate">
      <div class="gate__card">
        <div class="gate__brand">${icon("book", 26)} Forgebook</div>
        <div class="gate__tagline">Your paint recipes, wherever you paint.</div>

        <div class="gate__field" style="margin-top:20px; text-align:left">
          ${authFormHtml()}
        </div>

        <div class="gate__divider"><span>or</span></div>

        <button class="btn btn-ghost btn-block" data-action="continue-guest">Continue without an account</button>
        <div class="settings-row__desc" style="margin-top:8px">
          Your book stays on this device until you sign in. Nothing is lost either way.
        </div>
      </div>
      <div class="toast" id="toast"></div>
    </div>
  `;
}

function showGate() {
  document.getElementById("app").innerHTML = gateHtml();
  bindAuthInputs(document);
}

// The blocking screen for both "finish your invite" (mode "setup") and
// "forgot password" (mode "recovery") — same fields, different framing, both
// funnel into setPassword().
function passwordFormHtml(mode) {
  const isSetup = mode === "setup";
  return `
    <div class="gate">
      <div class="gate__card">
        <div class="gate__brand">${icon("book", 26)} Forgebook</div>
        <div class="gate__tagline">
          ${isSetup
            ? `You're invited${currentEmail() ? `, ${escapeHtml(currentEmail())}` : ""}. Set a password to finish creating your account.`
            : "Choose a new password for your account."}
        </div>

        <div class="field gate__field" style="margin-top:20px">
          <label>New password</label>
          <input type="password" id="new-password" placeholder="At least 8 characters" autocomplete="new-password" />
        </div>
        <div class="field gate__field" style="margin-top:0">
          <label>Confirm password</label>
          <input type="password" id="new-password-confirm" placeholder="Type it again" autocomplete="new-password" />
        </div>

        <button class="btn btn-primary btn-block" data-action="submit-password">
          ${isSetup ? "Set password & continue" : "Update password"}
        </button>

        <div class="notice" style="margin-top:16px; text-align:left">
          This is a small, self-run hobby project — not a professional security service.
          Please use a password you don't already rely on elsewhere. Forgebook never sees your
          password itself; it's handled and stored, hashed, by Supabase, our database provider.
        </div>
      </div>
      <div class="toast" id="toast"></div>
    </div>
  `;
}

function showPasswordScreen(mode) {
  passwordScreenMode = mode;
  document.getElementById("app").innerHTML = passwordFormHtml(mode);
  bindAuthInputs(document);
}

// The single source of truth for "what should be on screen right now,"
// before the app shell exists. Re-run any time auth state changes while
// we're still pre-boot (e.g. a recovery or invite link resolving).
function decideBootState() {
  if (inPasswordRecovery()) { showPasswordScreen("recovery"); return; }
  if (isSignedIn() && needsPasswordSetup()) { showPasswordScreen("setup"); return; }
  if (isSignedIn() || isGuest()) { bootIntoApp(); return; }
  showGate();
}

// Commit to the full app: build the shell, route, and render — the point of
// no return past which the gate can't reappear this session.
function bootIntoApp() {
  if (appBooted) return;
  appBooted = true;
  buildShell();
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").then((reg) => {
      // Don't just wait for the browser's own (slow, heuristic) background
      // check — ask right now. This is what actually gets a device that
      // already has the app installed off an old cached version promptly,
      // rather than whenever the browser next feels like checking.
      reg.update().catch(() => {});
    }).catch(() => {});

    // service-worker.js calls skipWaiting()+clients.claim(), so a new worker
    // takes over immediately — but this tab's already-running JS is still
    // the old version until it reloads. Without this, "the SW updated" and
    // "the page you're looking at updated" are two different things.
    let refreshingForUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshingForUpdate) return;
      refreshingForUpdate = true;
      location.reload();
    });
  }
  if (isSignedIn() && !pendingMerge) syncNow();
}

async function init() {
  initStore();
  showBootSplash();

  // The persisted-session check is local (no network round trip unless a
  // token needs refreshing), so this resolves fast — but we still wait for
  // it rather than guessing, since guessing wrong is exactly the flash we're
  // trying to avoid.
  await initCloud();

  decideBootState();
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
});

document.addEventListener("DOMContentLoaded", init);
