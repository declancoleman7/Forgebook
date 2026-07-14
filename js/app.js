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
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
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
  factionFilter: null,
  unitFilter: undefined, // undefined = no unit filter; null = General only; string = that unit
  searchQuery: "",
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
    if (seen.has(s.paintId)) return;
    const p = findPaint(s.paintId);
    if (p) { seen.add(s.paintId); out.push(p); }
  });
  return out;
}

function paintUsageCount(paintId) {
  return getRecipes().filter((r) => (r.steps || []).some((s) => s.paintId === paintId)).length;
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

  return `
    <div class="page-enter">
      <div class="page-title">Recipes</div>
      <div class="faction-row" style="margin-bottom:18px">
        <div class="faction-chip ${!state.factionFilter ? "is-active" : ""}" data-faction-filter="">All</div>
        ${used.map((id) => {
          const f = faction(id);
          return `
            <div class="faction-chip ${state.factionFilter === f.id ? "is-active" : ""}" data-faction-filter="${f.id}" style="--chip-color:${f.color}">
              <span class="faction-chip__emblem" style="color:${f.color}">${emblemSvg(f.emblem, 15)}</span>
              ${escapeHtml(f.label)}
            </div>`;
        }).join("")}
      </div>
      ${recipes.length
        ? `<div class="recipe-grid">${recipes.map(recipeCardHtml).join("")}</div>`
        : emptyStateHtml("search", "No matches", "Try a different army or search term.")}
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

  return `
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
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:8px;">
        <div class="detail-faction-tag">${difficultyDots(r.difficulty || 1)}</div>
        <div class="detail-faction-tag">${(r.steps || []).length} steps</div>
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
      <div class="layer-stack">
        ${(r.steps || []).map((s, i) => {
          const p = findPaint(s.paintId);
          return `
            <div class="layer-stack__row">
              <div class="layer-stack__num">${i + 1}</div>
              <div class="layer-stack__swatch" style="background:${p ? p.hex : f.color}"></div>
              <div class="layer-stack__content">
                <div class="layer-stack__top">
                  <span class="layer-stack__technique">${escapeHtml(s.technique)}</span>
                  <span class="layer-stack__paint">${p ? escapeHtml(p.name) : "(paint deleted)"}</span>
                </div>
                ${s.notes ? `<div class="layer-stack__notes">${escapeHtml(s.notes)}</div>` : ""}
              </div>
            </div>`;
        }).join("") || `<div class="empty-state__sub">No steps recorded.</div>`}
      </div>

      ${r.notes ? `<div class="section-label">Notes</div><div class="notes-block">${escapeHtml(r.notes)}</div>` : ""}

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-action="print">Print Recipe</button>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Paint library
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

      <button class="btn btn-primary btn-block" data-nav="paint-new" style="margin-bottom:18px">
        + Add paint to rack
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

      <div class="section-label">Used In</div>
      ${used.length
        ? `<div class="recipe-grid">${used.map(recipeCardHtml).join("")}</div>`
        : `<div class="empty-state__sub">Not used in any recipe yet.</div>`}
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
  return { id: "ns" + Math.random().toString(36).slice(2, 9), technique: TECHNIQUES[0], paintId: "", notes: "" };
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

      ${recipeForm.steps.map((s) => `
        <div class="repeater-item">
          ${recipeForm.steps.length > 1 ? `<button type="button" class="repeater-item__remove" data-remove-step="${s.id}">&times;</button>` : ""}
          <div class="field" style="margin-bottom:10px;">
            <label>Technique</label>
            <select data-step-field="technique" data-step-id="${s.id}">
              ${TECHNIQUES.map((t) => `<option value="${t}" ${s.technique === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="margin-bottom:10px;">
            <label>Paint</label>
            <div class="paint-pick-row">
              <span class="paint-pick-row__swatch" data-swatch-for="${s.id}" style="background:${(findPaint(s.paintId) || {}).hex || "transparent"}"></span>
              <select data-step-field="paintId" data-step-id="${s.id}">${paintOptionsHtml(s.paintId)}</select>
              <button type="button" class="btn btn-ghost btn-sm" data-action="quick-paint" data-step-id="${s.id}">+ New</button>
            </div>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label>Notes</label>
            <textarea data-step-field="notes" data-step-id="${s.id}" placeholder="e.g. two thin coats, let dry between">${escapeHtml(s.notes)}</textarea>
          </div>
        </div>
      `).join("")}
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
      if (e.target.dataset.stepField === "paintId") {
        // update the swatch beside the picker without a full re-render
        const sw = root.querySelector(`[data-swatch-for="${step.id}"]`);
        const p = findPaint(step.paintId);
        if (sw) sw.style.background = p ? p.hex : "transparent";
      }
    };
  });
}

// ---------------------------------------------------------------
// View: Settings
// ---------------------------------------------------------------
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
              <div class="settings-row__label">Sign out</div>
              <div class="settings-row__desc">Clears this device's copy of your book. Your recipes stay in the cloud.</div>
            </div>
            <button class="btn btn-danger" data-action="sign-out">Sign out</button>
          </div>
        ` : `
          <div class="settings-row" style="display:block">
            <div class="settings-row__label">Sign in to sync across devices</div>
            <div class="settings-row__desc" style="margin-bottom:10px">
              Forgebook is invite only. Enter the email address you were invited with and
              we'll send you a sign-in link \u2014 no password to remember.
            </div>
            <div class="signin-row">
              <input type="email" id="signin-email" placeholder="you@example.com" autocomplete="email" />
              <button class="btn btn-primary" data-action="send-link" ${cloudAvailable() ? "" : "disabled"}>Send link</button>
            </div>
            ${cloudAvailable()
              ? `<div class="settings-row__desc" style="margin-top:8px">Without signing in, Forgebook still works \u2014 your book just stays on this device.</div>`
              : `<div class="settings-row__desc" style="margin-top:8px">You're offline, so sign-in isn't available. The app works fine without it.</div>`}
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
        app are original artwork.
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

function render() {
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
  } else if (route === "settings") { html = viewSettings(); showFab = false; }
  else html = viewHome();

  root.innerHTML = html;
  swipeDirection = null; // one-shot: only a swipe-driven render animates directionally
  bindRecipeForm(root);
  bindPaintForm(root);

  document.querySelectorAll(".bottom-nav__item, .side-nav__item").forEach((el) => {
    const r = el.dataset.route;
    const active =
      r === route ||
      (r === "recipes" && (route === "recipe" || route === "recipe-new")) ||
      (r === "factions" && (route === "faction" || route === "unit")) ||
      (r === "paints" && (route === "paint" || route === "paint-new"));
    el.classList.toggle("is-active", active);
  });

  document.getElementById("fab").classList.toggle("hidden", !showFab);
  updateSyncPill();

  const signinEmail = root.querySelector("#signin-email");
  if (signinEmail) signinEmail.oninput = (e) => { authEmail = e.target.value; };

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

function updateSyncPill() {
  const pill = document.getElementById("sync-pill");
  if (!pill) return;
  const label = syncStatusLabel();
  pill.classList.toggle("hidden", !label);
  pill.classList.toggle("is-busy", syncing);
  pill.classList.toggle("is-error", cloudError === "sync" || !navigator.onLine);
  if (label) pill.textContent = label;
}

// ---------------------------------------------------------------
// Click delegation
// ---------------------------------------------------------------
document.addEventListener("click", async (e) => {
  const t = (sel) => e.target.closest(sel);

  // --- account ---
  if (t("[data-action='send-link']")) {
    const email = (authEmail || "").trim();
    if (!email || !email.includes("@")) { showToast("Enter the email you were invited with"); return; }
    showToast("Sending\u2026");
    const res = await sendMagicLink(email);
    showToast(res.message);
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

  const facFilter = t("[data-faction-filter]");
  if (facFilter) {
    state.factionFilter = facFilter.dataset.factionFilter || null;
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

  const addStep = t("[data-action='add-step']");
  if (addStep) { recipeForm.steps.push(newStep()); render(); return; }

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
  if (["paints", "factions", "recipes"].includes(state.route)) render();
  else navigate("recipes");
});

window.addEventListener("resize", () => render());

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

async function init() {
  initStore();
  buildShell();
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;

  // Paint first, ask the network later. The app is usable before the cloud
  // layer has even finished loading — that's the whole point of local-first.
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  await initCloud();
  render();
  if (isSignedIn() && !pendingMerge) syncNow();
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
});

document.addEventListener("DOMContentLoaded", init);
