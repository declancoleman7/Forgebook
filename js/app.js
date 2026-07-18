// Forgebook — main app logic (vanilla JS, no framework)

// Applied as the very first thing this script does, before anything else
// runs, so the chosen theme is on screen as early as this file can manage it.
// The real fix — no flash at all, even on the very first paint — needs a
// small inline script in index.html's <head> before the stylesheet link;
// script tags all currently load at the end of body, so a user who's picked
// light will still see a brief dark flash on load until that's added.
if (localStorage.getItem(KEYS.theme) === "light") {
  document.documentElement.setAttribute("data-theme", "light");
}

function getThemePref() { return localStorage.getItem(KEYS.theme) === "light" ? "light" : "dark"; }
function setThemePref(theme) {
  if (theme === "light") {
    localStorage.setItem(KEYS.theme, "light");
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    localStorage.removeItem(KEYS.theme);
    document.documentElement.removeAttribute("data-theme");
  }
}

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
  flag: '<path d="M5 21V4" /><path d="M5 4h13l-3 4 3 4H5" />',
  user: '<circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 6.5H4.5C4.5 15.5 6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" />',
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

function emblemSvg(key, size = 24) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" stroke="none">${emblemPaths(key)}</svg>`;
}

// A tag on exported backup files, decoupled from any app/schema version --
// only bumped if the backup JSON's own shape changes.
const BACKUP_FORMAT_VERSION = 5;

const NAV_ITEMS = [
  { route: "home", label: "Home", icon: "home" },
  { route: "factions", label: "Armies", icon: "banner" },
  { route: "recipes", label: "Recipes", icon: "book" },
  { route: "paints", label: "Paints", icon: "palette" },
  // Settings now lives inside your own Profile (a gear icon in its header),
  // rather than being its own top-level destination.
  { route: "profile", label: "Profile", icon: "user" },
];

let state = {
  route: "home",
  params: {},
  factionFilter: null, // single value — the Faction/Unit drill-down and "+ New recipe for X" preset context, NOT the Recipes list filter below
  unitFilter: undefined, // undefined = no unit filter; null = General only; string = that unit
  recipeFactionFilters: [], // multi-select — the Recipes list's filter window; empty = any
  recipeDifficultyFilters: [], // multi-select — same window; empty = any
  recipeFilterOpen: false,
  searchQuery: "", // the Recipes list's own inline #recipe-list-search box only -- the topbar box drives globalSearch (a separate, non-state variable) instead
  paintLibFilter: "all", // "all" | "owned" | "want" — Paint Library ownership filter
  paintLibBrands: [], // multi-select — empty = all brands
  paintLibCategories: [], // multi-select — paintCategory() keys; empty = all types
  paintLibSort: "name", // "name" | "rating" — Paint Library sort order
  includeShared: true, // whether other users' shared recipes appear in lists/browsing
};

// ---------------------------------------------------------------
// Storage accessors
// ---------------------------------------------------------------
// A render cache of whatever Supabase last returned (see cloud.js
// loadBook/pushRecipe/pushPaint) -- not a second source of truth, just the
// local copy the UI reads from between fetches.
function getAllRecipeRows() { return readJSON(KEYS.recipes, []); }
function getAllPaintRows() { return readJSON(KEYS.paints, []); }

function getRecipes() { return getAllRecipeRows().filter((r) => !r.deleted); }
function getPaints() { return getAllPaintRows().filter((p) => !p.deleted); }
function getRecents() { return readJSON(KEYS.recents, []); }
function getFactionArt() { return readJSON(KEYS.art, {}); }
function getGlobalFactionArt() { return readJSON(KEYS.globalArt, {}); }

// Your own personal override (this device only) wins over the admin's
// shared one, which wins over the built-in mark.
function resolvedFactionArt(id) { return getFactionArt()[id] || getGlobalFactionArt()[id]; }

// Other users' shared (published) recipes and the paints their steps
// reference — a read-only cache (see cloud.js fetchSharedRecipes), never
// merged into the local book and never pushed back up.
function getSharedRecipes() { return readJSON(KEYS.sharedRecipes, []); }
function getSharedPaints() { return readJSON(KEYS.sharedPaints, []); }
function getProfiles() { return readJSON(KEYS.profiles, []); }
function getNotifications() { return readJSON(KEYS.notifications, []); }

function authorName(userId) {
  const p = getProfiles().find((x) => x.userId === userId);
  return (p && p.displayName) || "Someone";
}

// A small circular avatar wherever a name renders — an <img> when a profile
// has uploaded one, otherwise a tinted initial-letter circle, so nobody ever
// shows as a broken image. Takes the name/url directly (not a userId) so it
// works equally for a cached profile lookup and a one-off fetched object
// (search results, a public share page) that isn't in getProfiles() yet.
function avatarGlyphHtml(displayName, url, size = 24) {
  if (url) return `<span class="avatar" style="width:${size}px; height:${size}px; background-image:url('${escapeHtml(url)}')"></span>`;
  const letter = escapeHtml(((displayName || "?").trim()[0] || "?").toUpperCase());
  return `<span class="avatar avatar--fallback" style="width:${size}px; height:${size}px; font-size:${Math.round(size * 0.5)}px">${letter}</span>`;
}

function avatarHtml(userId, size = 24) {
  const p = getProfiles().find((x) => x.userId === userId);
  return avatarGlyphHtml((p && p.displayName) || "Someone", p && p.avatarUrl, size);
}

// Short relative timestamp for comments/notes ("2h ago", "3d ago") — falls
// back to a plain date once it's old enough that "N days ago" stops being
// more useful than just the date.
function relativeTime(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.round(hours / 24);
  if (days < 14) return days + "d ago";
  return new Date(iso).toLocaleDateString();
}

// Own recipes plus (when the shared toggle is on) everyone else's shared
// ones — this is what every browsing screen (Recipes list, Armies, Units)
// reads from, so a shared recipe slots into the same faction/unit hierarchy
// as your own. The Home screen deliberately does NOT use this — it's a
// personal dashboard, not a browse screen.
function getVisibleRecipes() {
  return state.includeShared ? getRecipes().concat(getSharedRecipes()) : getRecipes();
}

// A recipe step's paintId is only unique within its own author's rack (two
// users' paints can share an id, e.g. from identical seed data), so a shared
// recipe's paints must always be looked up against that author's cache, never
// the current user's own rack.
function resolvePaintFor(recipe, paintId) {
  if (!paintId) return null;
  if (recipe.authorId) return getSharedPaints().find((p) => p.authorId === recipe.authorId && p.id === paintId) || null;
  return findPaint(paintId) || null;
}

// A step's paint is either a real rack paint (paintId) or, for one's own
// recipes only, a snapshot of a not-yet-owned library paint picked as a
// shopping-list placeholder (wantPaint/mixWantPaint — see newStep). This
// resolves whichever is set into one shape for rendering, tagging the
// latter so callers can show it differently.
//
// A want snapshot is checked against the rack every time, rather than once
// at pick time: the paint might get bought later (from the Paint Library, or
// any other recipe), and nothing else ever goes back to update the steps
// that reference it by name+brand — this is what makes it read as owned
// again the moment it shows up on the rack, instead of staying stuck showing
// "not on rack" forever.
function resolveStepPaint(recipe, step, field) {
  const id = step[field];
  if (id) return resolvePaintFor(recipe, id);
  const want = step[field === "paintId" ? "wantPaint" : "mixWantPaint"];
  if (!want) return null;
  // A want snapshot is just a name/brand/hex, regardless of whose recipe
  // it's attached to — so it's checked against the viewer's own rack either
  // way, not just on their own recipes. Without this, adding a shared
  // recipe's not-yet-owned paint straight to your rack (see
  // paint-add-to-rack) left that recipe's own row still showing "not
  // owned," even though My Rack already had it.
  const owned = ownedPaintFor(want.name, want.brand);
  if (owned) return owned;
  return { ...want, isWant: true };
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false; // almost always QuotaExceededError -- photos are the usual cause
  }
}
function saveFactionArt(a) { return save(KEYS.art, a); }

// Every write stamps the record with when it changed, then goes straight to
// Supabase -- there is no local queue and nothing to reconcile.
function stamp(record) {
  record.updatedAt = new Date().toISOString();
  return record;
}

function pushRecent(id) {
  let recents = getRecents().filter((r) => r !== id);
  recents.unshift(id);
  save(KEYS.recents, recents.slice(0, 8));
}

function getRecentSearches() { return readJSON(KEYS.recentSearches, []); }

// Same dedupe-move-to-front-then-cap-at-8 shape as pushRecent above, except
// case-insensitive: "Ork" and "ork" are the same search to a person, unlike
// two recipe ids which are never expected to differ only by case.
function pushRecentSearch(q) {
  q = String(q || "").trim();
  if (!q) return;
  let recents = getRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase());
  recents.unshift(q);
  save(KEYS.recentSearches, recents.slice(0, 8));
}

// authorId disambiguates a shared recipe from an own one with the same id —
// recipe ids are only unique per-user, so two authors' seed data (or two
// independently-created recipes) can collide on the same id string.
function findRecipe(id, authorId) {
  if (authorId) return getSharedRecipes().find((r) => r.id === id && r.authorId === authorId);
  return getRecipes().find((r) => r.id === id);
}
function findPaint(id) { return getPaints().find((p) => p.id === id); }

// Every distinct paint used by a recipe, in the order it's first used —
// including "want" placeholders (see resolveStepPaint), so a step planned
// around a paint you're still shopping for shows up in Paints Used too.
function recipePaints(r) {
  const seen = new Set();
  const out = [];
  (r.steps || []).forEach((s) => {
    ["paintId", "mixPaintId"].forEach((field) => {
      const want = s[field === "paintId" ? "wantPaint" : "mixWantPaint"];
      const key = s[field] || (want && "want:" + paintKey(want.name, want.brand));
      if (!key || seen.has(key)) return;
      const p = resolveStepPaint(r, s, field);
      if (p) { seen.add(key); out.push(p); }
    });
  });
  return out;
}

// Recipes referencing this paint — whether by real ownership (paintId) or
// by a want-list snapshot that now matches its name+brand (see
// resolveStepPaint): a step planned around this paint before it was bought
// still counts once it's on the rack.
function recipesUsingPaint(p) {
  const wantMatches = (want) => !!want && paintKey(want.name, want.brand) === paintKey(p.name, p.brand);
  return getRecipes().filter((r) => (r.steps || []).some((s) =>
    s.paintId === p.id || s.mixPaintId === p.id || wantMatches(s.wantPaint) || wantMatches(s.mixWantPaint)
  ));
}

function paintUsageCount(paintId) {
  const p = findPaint(paintId);
  return p ? recipesUsingPaint(p).length : 0;
}

// ---------------------------------------------------------------
// Colour matching — "similar colours": rank the whole library against a
// source colour so a paint used in a recipe (or any colour you set
// directly) can be substituted with something else on the rack, or from a
// brand you don't have.
// ---------------------------------------------------------------
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

// Redmean weighted-Euclidean distance — a well-known low-cost stand-in for
// full perceptual (Lab/CIEDE2000) colour distance, good enough to rank
// "which of these reads as basically the same colour" without pulling a
// colour-science library into a client-side paint catalogue.
function colourDistance(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const rmean = (a.r + b.r) / 2;
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
}

// Calibrated so a near-identical swatch reads high-90s% and a
// different-but-plausibly-confused colour lands in the 60-80% band —
// distances above this are different colour families entirely.
const COLOUR_MAX_DISTANCE = 210;
function colourSimilarity(hexA, hexB) {
  const d = colourDistance(hexA, hexB);
  return Math.max(0, Math.round(100 - (d / COLOUR_MAX_DISTANCE) * 100));
}

function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hexToHsv(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

// A wash and a base coat can share a hex and still not be interchangeable —
// one pools in recesses, the other doesn't. Grouping every brand's range
// name into a working-behaviour bucket lets "similar colours" (and the
// swatch badges below) prefer a substitute that behaves the same way, not
// just one that happens to look the same in the pot. Matched by keyword
// rather than an exact lookup table so it generalises across every brand's
// own naming (Citadel "Shade", Army Painter "Warpaints Fanatic: Wash", Pro
// Acryl "Standard (Washes)" all land on "wash" the same way).
function paintCategory(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("wash") || t.includes("shade")) return "wash";
  if (t.includes("contrast") || t.includes("speedpaint")) return "contrast";
  if (t.includes("metal")) return "metallic";
  if (t.includes("primer") || t.includes("spray")) return "primer";
  return "base";
}

const PAINT_CATEGORY_LABEL = { base: "Base/Layer", wash: "Wash", contrast: "Contrast/Speedpaint", metallic: "Metallic", primer: "Primer/Spray" };
const PAINT_CATEGORY_GLYPH = {
  wash: '<path d="M12 3C12 3 6 10 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 10 12 3 12 3Z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/>',
  metallic: '<path d="M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z"/>',
  primer: '<circle cx="12" cy="7" r="2.4"/><circle cx="7" cy="16" r="2.4"/><circle cx="17" cy="16" r="2.4"/>',
};

// A small corner badge for a swatch, signalling how the paint behaves at a
// glance rather than just its colour. Base/Layer paints — the common case —
// get no badge at all, so the badge only ever draws the eye to the paints
// worth treating differently.
function paintTypeBadgeHtml(type) {
  const cat = paintCategory(type);
  const glyph = PAINT_CATEGORY_GLYPH[cat];
  if (!glyph) return "";
  return `<span class="paint-type-badge" title="${PAINT_CATEGORY_LABEL[cat]}"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none">${glyph}</svg></span>`;
}

// One shared star-rating partial for every place a rating shows up: the
// Similar Colours rating widget, a profile's "Ratings Given" list, and the
// compact Paint Library row badge — so the visual language can't drift.
const STAR_PATH = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2z";
function starRowHtml(value, opts = {}) {
  const size = opts.size || 16;
  const interactive = !!opts.interactive;
  const stars = [1, 2, 3, 4, 5]
    .map((n) => {
      const filled = value != null && n <= Math.round(value);
      const cls = "star-row__star" + (filled ? " is-filled" : "");
      const attrs = interactive ? `data-action="rate-paint" data-value="${n}" role="button" tabindex="0"` : "";
      return `<span class="${cls}" ${attrs}><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="${STAR_PATH}"/></svg></span>`;
    })
    .join("");
  return `<span class="star-row ${interactive ? "star-row--interactive" : ""}">${stars}</span>`;
}

// ---------------------------------------------------------------
// Paint library — browsing a real catalogue (PAINT_LIBRARY, in data.js) and
// tracking which entries the rack already has, or still needs to buy.
// ---------------------------------------------------------------
function ownedPaintFor(name, brand) {
  return getPaints().find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
}

// Shared by every "add this paint to my rack" entry point (the Paint
// Library's tap-to-add, and a recipe's "add straight to rack" button on a
// paint it doesn't have yet) so a new rack row is always built the same way.
async function addPaintToRack(entry, quantity) {
  const id = "lib-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const row = stamp({ id, name: entry.name, brand: entry.brand, hex: entry.hex, type: entry.type, quantity: quantity || 1 });
  const res = await pushPaint(row);
  if (!res.ok) return res;
  const rows = getAllPaintRows();
  rows.push(row);
  save(KEYS.paints, rows);
  // Owned and "need to buy" are mutually exclusive — clear the wishlist
  // flag now that it's moot.
  if (isWanted(entry.name, entry.brand)) toggleWanted(entry.name, entry.brand);
  return { ok: true, row };
}

// Lives in its own paint_wants table (see cloud.js) rather than in the
// paints array -- a wanted-but-unowned paint has no business in the rack or
// the recipe-step paint picker.
function getWantToBuy() { return readJSON(KEYS.wantToBuy, []).map((w) => w.key); }
function isWanted(name, brand) { return getWantToBuy().includes(paintKey(name, brand)); }
function toggleWanted(name, brand) {
  const key = paintKey(name, brand);
  const rows = readJSON(KEYS.wantToBuy, []);
  const idx = rows.findIndex((w) => w.key === key);
  if (idx > -1) {
    rows.splice(idx, 1);
    save(KEYS.wantToBuy, rows);
    removeWantRemote(key); // fire-and-forget: a wishlist flag isn't worth blocking the tap on
  } else {
    rows.push({ key });
    save(KEYS.wantToBuy, rows);
    pushWant(key);
  }
}

function getMyRatings() { return readJSON(KEYS.myRatings, []); }
function myRatingFor(name, brand) {
  const r = getMyRatings().find((x) => x.paintKey === paintKey(name, brand));
  return r ? r.stars : null;
}
function getRatingSummary(name, brand) {
  return readJSON(KEYS.ratingSummary, []).find((x) => x.paintKey === paintKey(name, brand)) || null;
}
// Same optimistic-local-then-fire-and-forget shape as toggleWanted above —
// a star tap shouldn't wait on a round trip before it reflects on screen.
function ratePaint(name, brand, stars) {
  const key = paintKey(name, brand);
  const rows = getMyRatings();
  const idx = rows.findIndex((r) => r.paintKey === key);
  if (idx > -1) rows[idx] = { paintKey: key, stars };
  else rows.push({ paintKey: key, stars });
  save(KEYS.myRatings, rows);
  pushRating(key, stars);
}

// A flag on an owned paint itself, so it rides along with that paint's
// normal live write (see toRemotePaint/fromRemotePaint in cloud.js).
function toggleRestock(id) {
  const rows = getAllPaintRows();
  const p = rows.find((x) => x.id === id);
  if (!p) return;
  p.needsRestock = !p.needsRestock;
  stamp(p);
  save(KEYS.paints, rows);
  pushPaint(p); // fire-and-forget, same reasoning as toggleWanted above
}

// Units that actually have recipes in a faction, plus the General bucket.
// Includes shared recipes (when the toggle is on) so someone else's recipe
// for a unit you've never recorded still slots in as its own row.
function unitsForFaction(facId) {
  const recipes = getVisibleRecipes().filter((r) => r.faction === facId);
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

// Every unit name anyone's typed (yours or a shared recipe's), for the
// form's autocomplete.
function allUnitNames() {
  return [...new Set(getVisibleRecipes().map((r) => r.unit).filter(Boolean))].sort();
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

// An in-app "are you sure?" in place of the browser's own confirm() — same
// role, but styled like the rest of Forgebook instead of OS chrome. Built as
// its own overlay (rather than a placeholder sitting in every shell variant)
// so it can be called from anywhere without every screen needing to host one.
function showConfirm(message, opts = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "confirm-overlay";
    wrap.innerHTML = `
      <div class="confirm-overlay__backdrop"></div>
      <div class="confirm-dialog" role="alertdialog" aria-modal="true">
        <div class="confirm-dialog__message">${escapeHtml(message)}</div>
        <div class="confirm-dialog__actions">
          <button type="button" class="btn btn-ghost" data-confirm="cancel">${escapeHtml(opts.cancelLabel || "Cancel")}</button>
          <button type="button" class="btn ${opts.danger === false ? "btn-primary" : "btn-danger"}" data-confirm="ok">${escapeHtml(opts.okLabel || "Remove")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const close = (result) => {
      wrap.remove();
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };
    const onKeydown = (e) => { if (e.key === "Escape") close(false); };
    document.addEventListener("keydown", onKeydown);

    wrap.querySelector(".confirm-overlay__backdrop").onclick = () => close(false);
    wrap.querySelector("[data-confirm='cancel']").onclick = () => close(false);
    wrap.querySelector("[data-confirm='ok']").onclick = () => close(true);
    wrap.querySelector("[data-confirm='ok']").focus();
  });
}

// Same self-contained overlay pattern as showConfirm, but resolves to a
// reason string (possibly empty) on submit, or null on cancel — shared by
// both comments and paint notes via data-action="report" data-kind.
function showReportDialog(kind) {
  return new Promise((resolve) => {
    const noun = kind === "comment" ? "comment" : "note";
    const wrap = document.createElement("div");
    wrap.className = "confirm-overlay";
    wrap.innerHTML = `
      <div class="confirm-overlay__backdrop"></div>
      <div class="confirm-dialog" role="alertdialog" aria-modal="true">
        <div class="confirm-dialog__message">Report this ${noun}? Let us know what's wrong (optional).</div>
        <textarea id="report-reason-input" class="report-reason-input" maxlength="200" placeholder="Reason (optional)"></textarea>
        <div class="confirm-dialog__actions">
          <button type="button" class="btn btn-ghost" data-confirm="cancel">Cancel</button>
          <button type="button" class="btn btn-danger" data-confirm="ok">Report</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const close = (result) => {
      wrap.remove();
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };
    const onKeydown = (e) => { if (e.key === "Escape") close(null); };
    document.addEventListener("keydown", onKeydown);

    wrap.querySelector(".confirm-overlay__backdrop").onclick = () => close(null);
    wrap.querySelector("[data-confirm='cancel']").onclick = () => close(null);
    wrap.querySelector("[data-confirm='ok']").onclick = () => close(wrap.querySelector("#report-reason-input").value.trim());
  });
}

// Full-size view of a recipe photo — same self-contained overlay pattern as
// showConfirm, closeable via the backdrop, the close button, or Escape.
function showLightbox(url) {
  const wrap = document.createElement("div");
  wrap.className = "lightbox-overlay";
  wrap.innerHTML = `
    <div class="lightbox-overlay__backdrop"></div>
    <button type="button" class="lightbox-overlay__close" aria-label="Close">&times;</button>
    <img class="lightbox-overlay__img" src="${url}" alt="Finished mini, full size" />
  `;
  document.body.appendChild(wrap);

  const close = () => {
    wrap.remove();
    document.removeEventListener("keydown", onKeydown);
  };
  const onKeydown = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKeydown);

  wrap.querySelector(".lightbox-overlay__backdrop").onclick = close;
  wrap.querySelector(".lightbox-overlay__close").onclick = close;
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

// Sibling to downscaleImage, for avatars: center-crops to a square (the
// larger of the two source dimensions is cropped away, not squeezed) before
// downscaling, so an off-center or non-square source photo doesn't distort
// into an oval.
function downscaleImageSquare(file, size, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      cb(canvas.toDataURL("image/jpeg", 0.85));
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
  // A shared recipe's id is only unique per-author, not globally, so its
  // author has to ride along in the URL to disambiguate — never paired with
  // /edit, since shared recipes are view-only.
  if (route === "recipe") return `#/recipe/${p.id}${p.authorId ? "/by/" + encodeURIComponent(p.authorId) : ""}${p.edit ? "/edit" : ""}`;
  // The public share link — no sign-in required to resolve it (see
  // fetchPublicRecipe/init()) — deliberately a different shape (/r/, not
  // /recipe/) so it's unambiguous at a glance which kind of link this is.
  if (route === "public-recipe") return `#/r/${encodeURIComponent(p.authorId)}/${encodeURIComponent(p.id)}`;
  if (route === "faction") return `#/faction/${p.id}`;
  if (route === "unit") return `#/faction/${p.id}/unit/${p.unit === null ? "_general" : slug(p.unit)}`;
  if (route === "paint") return `#/paint/${p.id}`;
  // A source paint's own name+brand ride along so refreshing or sharing the
  // URL keeps the same "similar to X" context; with neither, it's the
  // pick-a-colour tool instead.
  if (route === "similar") return `#/similar${p.name ? "/" + encodeURIComponent(p.name) + "/" + encodeURIComponent(p.brand || "") : ""}`;
  // No id = the search/browse mode of the same page (mirrors "similar"'s own
  // colour-picker-vs-anchored-to-a-paint duality) — deliberately one route,
  // not two, so there's only one render function to keep in sync.
  if (route === "profile") return `#/u${p.id ? "/" + encodeURIComponent(p.id) : ""}`;
  return `#/${route}`;
}

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { route: "home", params: {} };

  if (parts[0] === "r" && parts[1] && parts[2]) {
    return { route: "public-recipe", params: { authorId: decodeURIComponent(parts[1]), id: decodeURIComponent(parts[2]) } };
  }
  if (parts[0] === "recipe" && parts[1]) {
    const id = decodeURIComponent(parts[1]);
    if (parts[2] === "by" && parts[3]) {
      return { route: "recipe", params: { id, authorId: decodeURIComponent(parts[3]), edit: false } };
    }
    return { route: "recipe", params: { id, edit: parts[2] === "edit" } };
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
  if (parts[0] === "similar") {
    if (parts[1]) return { route: "similar", params: { name: decodeURIComponent(parts[1]), brand: decodeURIComponent(parts[2] || "") } };
    return { route: "similar", params: {} };
  }
  if (parts[0] === "u") {
    return { route: "profile", params: parts[1] ? { id: decodeURIComponent(parts[1]) } : {} };
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
  // A public share link opened while the app is already running (an
  // installed PWA reusing its existing window, or just an in-page link) is
  // a same-document navigation — DOMContentLoaded/init() never re-fires, so
  // this is the only other place that ever sees the hash change. Without
  // this, render()'s route dispatch has no case for "public-recipe" and
  // silently falls back to the home screen instead.
  if (route === "public-recipe") { renderPublicRecipe(params); return; }
  // Unlike public-recipe (a permanently separate route from "recipe"),
  // "profile" is ONE route serving both the full-shell in-app page and the
  // bare signed-out share link — so the bypass only applies to a genuinely
  // signed-out visitor with a specific id; everyone else (including a
  // bare "#/u" search page) gets the normal state/render() pipeline below.
  if (route === "profile" && params.id && !isSignedIn()) { renderPublicProfile(params.id); return; }
  state.route = route;
  state.params = params;
  render();
});

// ---------------------------------------------------------------
// Global search — matching/ranking helpers shared by getFilteredRecipes()
// (the Recipes list's own inline search box) and viewSearch() (the topbar's
// app-wide search). Kept as pure functions with no state/route awareness so
// both call sites can reuse the exact same match rules.
// ---------------------------------------------------------------
function recipeMatchesQuery(r, q) {
  return r.name.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q) ||
    (r.unit || "").toLowerCase().includes(q) ||
    faction(r.faction).label.toLowerCase().includes(q) ||
    recipePaints(r).some((p) => p.name.toLowerCase().includes(q));
}

// Matches brand too (unlike viewPaintLibrary()'s own on-page search, which
// only matches name+type) -- that page has clickable brand-filter chips as
// an alternative, but the global search box has no such affordance, and
// PAINT_LIBRARY spans many brands worth finding by typing them directly.
function paintMatchesQuery(p, q) {
  return p.name.toLowerCase().includes(q) ||
    (p.brand || "").toLowerCase().includes(q) ||
    (p.type || "").toLowerCase().includes(q);
}

function factionMatchesQuery(f, q) { return f.label.toLowerCase().includes(q); }

// Same aggregation unitsForFaction() does for one faction, generalized
// across all of them at once -- global search has no single faction to
// scope to. Keyed on [facId, unit] via JSON.stringify rather than a
// "|"-joined string, since a unit name is free text and could contain "|".
function allUnitsMatching(q) {
  const seen = new Map();
  getVisibleRecipes().forEach((r) => {
    if (!r.unit || !r.unit.toLowerCase().includes(q)) return;
    const key = JSON.stringify([r.faction, r.unit]);
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  return [...seen.entries()].map(([key, count]) => {
    const [facId, unit] = JSON.parse(key);
    return { facId, unit, count };
  });
}

// Ranking for the Top tab -- simple tier + length, not the Home feed's
// time-decay formula (a different problem: text relevance, not recency).
// Exact match beats prefix beats "matches somewhere"; ties broken by
// shorter name (a tighter match for the same query).
function matchTier(name, q) {
  const n = (name || "").toLowerCase();
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
      if (list[i]) { out.push(list[i]); any = true; if (out.length >= limit) break; }
    }
    if (!any) break;
    i++;
  }
  return out;
}

// ---------------------------------------------------------------
// The recipe list currently in context — drives both the Recipes
// screen and the order you swipe through on a recipe page.
// ---------------------------------------------------------------
function getFilteredRecipes() {
  let recipes = getVisibleRecipes();
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
    recipes = recipes.filter((r) => recipeMatchesQuery(r, q));
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
  const idx = siblings.findIndex((r) => r.id === state.params.id && (r.authorId || null) === (state.params.authorId || null));
  if (idx === -1) return false;
  const target = siblings[idx + dir];
  if (!target) return false;
  swipeDirection = dir === 1 ? "left" : "right";
  navigate("recipe", { id: target.id, authorId: target.authorId });
  return true;
}

// ---------------------------------------------------------------
// View: Home \u2014 a site-wide activity feed (recently published recipes,
// recipe comments, paint ratings, paint notes), not a personal dashboard.
// "Continue Painting"/"Your Armies" (the old Home content) live on your own
// Profile now \u2014 see personalWorkspaceHtml.
// ---------------------------------------------------------------
const FEED_WINDOW_MS = 7 * 24 * 3600 * 1000;
const FEED_HALF_LIFE_MS = 48 * 3600 * 1000;

// Turns the four raw arrays cached by fetchActivityFeed (plus the shared
// recipes list already cached separately) into one heterogeneous, ranked
// list. Comments are grouped per recipe within FEED_WINDOW_MS so "5 new
// comments on X" reads as a single item instead of five -- ratings/notes are
// inherently paint-level (keyed by paint_key, not a recipe), so each one is
// its own item pointing at that paint's Similar Colours page.
function buildFeedItems() {
  const feed = readJSON(KEYS.activityFeed, {});
  const comments = feed.comments || [];
  const ratings = feed.ratings || [];
  const notes = feed.notes || [];
  const now = Date.now();
  const items = [];

  getSharedRecipes()
    .filter((r) => now - new Date(r.updatedAt).getTime() < FEED_WINDOW_MS)
    .forEach((r) => items.push({ type: "recipe_published", recipe: r, authorId: r.authorId, at: r.updatedAt, engagement: 1 }));

  const commentGroups = {};
  comments
    .filter((c) => now - new Date(c.createdAt).getTime() < FEED_WINDOW_MS)
    .forEach((c) => {
      const key = c.recipeOwnerId + "|" + c.recipeId;
      const g = commentGroups[key] || (commentGroups[key] = { recipeOwnerId: c.recipeOwnerId, recipeId: c.recipeId, count: 0, latestAt: c.createdAt });
      g.count += 1;
      if (new Date(c.createdAt) > new Date(g.latestAt)) g.latestAt = c.createdAt;
    });
  Object.values(commentGroups).forEach((g) => {
    const recipe = findRecipe(g.recipeId, g.recipeOwnerId === currentUserId() ? undefined : g.recipeOwnerId);
    if (!recipe) return;
    items.push({ type: "recipe_comments", recipe, recipeOwnerId: g.recipeOwnerId, count: g.count, at: g.latestAt, engagement: g.count });
  });

  ratings
    .filter((r) => now - new Date(r.updatedAt).getTime() < FEED_WINDOW_MS)
    .forEach((r) => {
      const paint = paintFromKey(r.paintKey);
      if (paint) items.push({ type: "paint_rating", paint, raterId: r.userId, stars: r.stars, at: r.updatedAt, engagement: 1 });
    });

  notes
    .filter((n) => now - new Date(n.createdAt).getTime() < FEED_WINDOW_MS)
    .forEach((n) => {
      const paint = paintFromKey(n.paintKey);
      if (paint) items.push({ type: "paint_note", paint, authorId: n.userId, body: n.body, at: n.createdAt, engagement: 1 });
    });

  // 48h half-life decay, boosted by engagement (comment count) so a
  // still-active thread can outrank a quieter, slightly newer item.
  const decay = (iso) => Math.pow(0.5, (now - new Date(iso).getTime()) / FEED_HALF_LIFE_MS);
  items.forEach((it) => { it.score = decay(it.at) * (1 + Math.log2(1 + it.engagement)); });
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, 30);
}

function feedItemHtml(item) {
  if (item.type === "recipe_published") {
    const r = item.recipe;
    return `
      <div class="comment-row" data-nav="recipe" data-id="${escapeHtml(r.id)}" ${r.authorId ? `data-author="${escapeHtml(r.authorId)}"` : ""} style="cursor:pointer">
        <div class="comment-row__meta">
          <span class="comment-row__author">${icon("book", 12)} New recipe</span>
          <span class="comment-row__time">${relativeTime(item.at)}</span>
        </div>
        <div class="comment-row__body">${avatarHtml(item.authorId, 16)} ${escapeHtml(authorName(item.authorId))} published "${escapeHtml(r.name)}"</div>
      </div>
    `;
  }
  if (item.type === "recipe_comments") {
    const r = item.recipe;
    const isMine = item.recipeOwnerId === currentUserId();
    return `
      <div class="comment-row" data-nav="recipe" data-id="${escapeHtml(r.id)}" ${isMine ? "" : `data-author="${escapeHtml(item.recipeOwnerId)}"`} style="cursor:pointer">
        <div class="comment-row__meta">
          <span class="comment-row__author">Comments</span>
          <span class="comment-row__time">${relativeTime(item.at)}</span>
        </div>
        <div class="comment-row__body">${item.count} new comment${item.count === 1 ? "" : "s"} on "${escapeHtml(r.name)}"</div>
      </div>
    `;
  }
  if (item.type === "paint_rating") {
    const p = item.paint;
    return `
      <div class="comment-row" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}" data-hex="${p.hex}" style="cursor:pointer">
        <div class="comment-row__meta">
          ${starRowHtml(item.stars, { size: 12 })}
          <span class="comment-row__time">${relativeTime(item.at)}</span>
        </div>
        <div class="comment-row__body">${avatarHtml(item.raterId, 16)} ${escapeHtml(authorName(item.raterId))} rated ${escapeHtml(p.name)} <span style="opacity:0.7">(${escapeHtml(p.brand)})</span></div>
      </div>
    `;
  }
  // paint_note
  const p = item.paint;
  return `
    <div class="comment-row" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}" data-hex="${p.hex}" style="cursor:pointer">
      <div class="comment-row__meta">
        <span class="comment-row__author">Note</span>
        <span class="comment-row__time">${relativeTime(item.at)}</span>
      </div>
      <div class="comment-row__body">${avatarHtml(item.authorId, 16)} ${escapeHtml(authorName(item.authorId))} on ${escapeHtml(p.name)}: "${escapeHtml(item.body)}"</div>
    </div>
  `;
}

function viewHome() {
  const items = buildFeedItems();
  return `
    <div class="page-enter">
      <div class="page-title">Community Feed</div>
      <div style="font-size:13px; opacity:0.75; margin:0 2px 14px">What's happening across Forgebook right now.</div>
      ${items.length
        ? items.map(feedItemHtml).join("")
        : emptyStateHtml("book", "Nothing yet", "Publish a recipe, or leave a note or rating, to get the community feed moving.")}
    </div>
  `;
}

function recipeCardHtml(r) {
  const fac = faction(r.faction);
  const stack = (r.steps || []).slice(0, 6).map((s) => {
    const p = resolveStepPaint(r, s, "paintId");
    return p ? p.hex : fac.color;
  });
  return `
    <div class="recipe-card" data-nav="recipe" data-id="${r.id}" ${r.authorId ? `data-author="${escapeHtml(r.authorId)}"` : ""} style="--faction-color:${fac.color}">
      <div class="recipe-card__hero ${r.photo ? "has-photo" : ""}"${r.photo ? ` style="background-image:url('${r.photo}')"` : ""}>
        ${r.photo ? "" : `<span class="recipe-card__emblem emblem-badge emblem-badge--lg">${emblemSvg(fac.emblem, 26)}</span>`}
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
        ${r.authorId ? `<div class="recipe-card__author" data-nav="profile" data-id="${escapeHtml(r.authorId)}">${avatarHtml(r.authorId, 14)} ${escapeHtml(authorName(r.authorId))}</div>` : ""}
        ${r.published === false ? `<span class="pill-status pill-status--draft">Draft</span>` : ""}
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
    const p = resolveStepPaint(r, s, "paintId");
    return p ? p.hex : fac.color;
  });
  return `
    <div class="compact-recipe-row ${isActive ? "is-active" : ""}" data-nav="recipe" data-id="${r.id}" ${r.authorId ? `data-author="${escapeHtml(r.authorId)}"` : ""} style="--faction-color:${fac.color}">
      <div class="compact-recipe-row__thumb ${r.photo ? "has-photo" : ""}"${r.photo ? ` style="background-image:url('${r.photo}')"` : ""}>
        ${r.photo ? "" : `<span class="emblem-badge emblem-badge--sm">${emblemSvg(fac.emblem, 16)}</span>`}
      </div>
      <div class="compact-recipe-row__info">
        <div class="compact-recipe-row__name">${escapeHtml(r.name)}</div>
        <div class="compact-recipe-row__meta">${escapeHtml(fac.label)}${r.unit ? " · " + escapeHtml(r.unit) : ""}${r.authorId ? " · " + escapeHtml(authorName(r.authorId)) : ""}</div>
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
          ${getSharedRecipes().length ? `
          <div class="section-label">Shared recipes</div>
          <div class="filter-toggle-row">
            <div class="faction-chip ${state.includeShared ? "is-active" : ""}" data-action="toggle-shared-filter">
              ${icon("book", 13)} Show recipes shared by others
            </div>
          </div>
          ` : ""}
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
  const recipes = getVisibleRecipes();
  const art = { ...getGlobalFactionArt(), ...getFactionArt() }; // personal override wins over the admin's shared one

  const tile = (f) => {
    const n = recipes.filter((r) => r.faction === f.id).length;
    const hasArt = !!art[f.id];
    const gradId = `mg-${f.id}`;
    const allianceClass = `faction-tile--${slug(f.alliance)}`;
    const mark = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="url(#${gradId})" stroke="none" style="color:${f.color}">${emblemPaths(f.emblem)}</svg>`;
    const icon = hasArt ? "" : `
      <svg width="0" height="0" style="position:absolute">
        <defs><linearGradient id="${gradId}" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0" style="stop-color:color-mix(in srgb, ${f.color} 45%, var(--parchment))"/>
          <stop offset="0.55" style="stop-color:${f.color}"/>
          <stop offset="1" style="stop-color:color-mix(in srgb, ${f.color} 60%, black)"/>
        </linearGradient></defs>
      </svg>
      <span class="faction-tile__watermark">${mark(66)}</span>
      ${mark(48)}`;
    return `
      <div class="faction-tile ${allianceClass}" data-nav="faction" data-id="${f.id}" style="--faction-color:${f.color}" title="${escapeHtml(f.label)}">
        <div class="faction-tile__rivet tl"></div><div class="faction-tile__rivet tr"></div><div class="faction-tile__rivet bl"></div><div class="faction-tile__rivet br"></div>
        ${n ? `<div class="faction-tile__count">${n}</div>` : ""}
        <div class="faction-tile__art ${hasArt ? "has-art" : ""}"${hasArt ? ` style="background-image:url('${art[f.id]}')"` : ""}>${icon}</div>
      </div>
    `;
  };

  const body = SYSTEMS.map((sys) => {
    const groups = sys.alliances.map((alliance) => {
      const facs = FACTIONS.filter((f) => f.system === sys.id && f.alliance === alliance);
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
      ${body}
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
  const personalArt = getFactionArt()[f.id];
  const globalArt = getGlobalFactionArt()[f.id];
  const art = personalArt || globalArt;
  const admin = isAdmin();
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
          ${icon("image", 14)} ${personalArt ? "Change emblem" : "Add emblem"}
        </button>
      </div>

      <div class="faction-banner ${art ? "has-art" : ""}"${art ? ` style="background-image:url('${art}')"` : ""} style="--faction-color:${f.color}">
        ${art ? "" : `<span class="faction-banner__emblem emblem-badge emblem-badge--xl">${emblemSvg(f.emblem, 40)}</span>`}
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
      ${personalArt ? `<button class="btn btn-ghost btn-block" data-action="faction-art-clear" data-id="${f.id}">Remove custom emblem</button>` : ""}

      ${admin ? `
        <div class="section-label">Admin</div>
        <div class="settings-group">
          <div class="settings-row">
            <div>
              <div class="settings-row__label">Shared emblem</div>
              <div class="settings-row__desc">Uploads for every signed-in user, not just this device.</div>
            </div>
            <button class="btn btn-ghost btn-sm" data-action="admin-emblem" data-id="${f.id}">${globalArt ? "Replace" : "Upload"}</button>
          </div>
          ${globalArt ? `
          <div class="settings-row">
            <div>
              <div class="settings-row__label">Remove shared emblem</div>
              <div class="settings-row__desc">Everyone goes back to the built-in mark, or their own override if they've set one.</div>
            </div>
            <button class="btn btn-danger btn-sm" data-action="admin-emblem-clear" data-id="${f.id}">Remove</button>
          </div>` : ""}
        </div>
        <input type="file" id="admin-emblem-input" accept="image/*" class="hidden" />
      ` : ""}
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
  const used = [...new Set(getVisibleRecipes().map((r) => r.faction))];
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
function viewRecipeDetail(id, authorId) {
  const r = findRecipe(id, authorId);
  if (!r) return emptyStateHtml("search", "Recipe not found", "It may have been deleted.");
  const isShared = !!r.authorId;
  if (!isShared) pushRecent(id); // shared recipes are someone else's \u2014 not "recently painted" by you
  const f = faction(r.faction);
  const paints = recipePaints(r);

  const siblings = getFilteredRecipes();
  const idx = siblings.findIndex((s) => s.id === r.id && (s.authorId || null) === (r.authorId || null));
  const swipeCls = swipeDirection === "left" ? "swipe-in-left" : swipeDirection === "right" ? "swipe-in-right" : "";

  // A recipe you own has no .authorId (that's only set on someone else's
  // shared copy) — either way this is the row's true DB owner, which is
  // what the comments table's composite foreign key needs.
  const ownerId = r.authorId || currentUserId();
  if (r.published) ensureCommentsLoaded(ownerId, r.id);

  const detailHtml = `
    <div class="page-enter ${swipeCls}" data-swipe-page>
      <div class="detail-header">
        <button class="icon-btn" data-nav="recipes">${icon("back", 18)}</button>
        ${isShared ? "" : `
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" data-nav="recipe" data-id="${r.id}" data-edit="1">${icon("edit", 16)}</button>
          <button class="icon-btn" data-action="delete-recipe" data-id="${r.id}">${icon("trash", 16)}</button>
        </div>`}
      </div>

      <div class="detail-hero ${r.photo ? "has-photo" : ""}" style="--faction-color:${f.color}${r.photo ? `;background-image:url('${r.photo}')` : ""}" ${r.photo ? `data-action="open-lightbox" data-photo="${escapeHtml(r.photo)}"` : ""}>
        ${r.photo ? "" : `<span class="emblem-badge emblem-badge--xl">${emblemSvg(f.emblem, 40)}</span>`}
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
      ${isShared ? `<div class="shared-badge">${avatarHtml(r.authorId, 16)} Shared by <span data-nav="profile" data-id="${escapeHtml(r.authorId)}" style="cursor:pointer; text-decoration:underline">${escapeHtml(authorName(r.authorId))}</span></div>` : ""}
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
        ${paints.length ? paints.map((p) => {
          // Own, already-owned paint: a plain row linking to its own detail page.
          if (!isShared && !p.isWant) {
            return `
              <div class="paint-row" data-nav="paint" data-id="${p.id}">
                <div class="paint-row__swatch" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}" data-hex="${p.hex}" title="Find similar colours" style="background:${p.hex}">${paintTypeBadgeHtml(p.type)}</div>
                <div>
                  <div class="paint-row__name">${escapeHtml(p.name)}</div>
                  <div class="paint-row__brand">${escapeHtml(p.brand || "")}${p.type ? " \u00b7 " + escapeHtml(p.type) : ""}</div>
                </div>
                <div class="paint-row__hex">${escapeHtml(p.hex)}</div>
              </div>
            `;
          }
          // Either a shared recipe's paint (ownership only means something
          // against the viewer's own rack, re-checked here by name+brand \u2014
          // same key the paint library's owned/want-to-buy tracking uses)
          // or one's own recipe's "want" placeholder (never owned, by
          // definition). Either way: no paint-detail page to link to, so
          // show a toggleable buy-list row instead.
          const owned = p.isWant ? false : !!ownedPaintFor(p.name, p.brand);
          const wanted = !owned && isWanted(p.name, p.brand);
          return `
            <div class="paint-row ${owned ? "is-owned" : ""}">
              <div class="paint-row__swatch" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}" data-hex="${p.hex}" title="Find similar colours" style="background:${p.hex}">${paintTypeBadgeHtml(p.type)}</div>
              <div>
                <div class="paint-row__name">${escapeHtml(p.name)}</div>
                <div class="paint-row__brand">${escapeHtml(p.brand || "")}${p.type ? " \u00b7 " + escapeHtml(p.type) : ""}</div>
              </div>
              ${owned
                ? `<span class="lib-row__ring is-owned" style="margin-left:auto" title="On your rack">${icon("check", 13)}</span>`
                : `<div style="display:flex; gap:6px; margin-left:auto">
                    <button class="lib-row__flag is-wanted ${wanted ? "is-on" : ""}" data-action="toggle-wanted" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}" title="${wanted ? "On your buy list" : "Add to buy list"}">${icon("cart", 13)}</button>
                    <button class="lib-row__flag" data-action="paint-add-to-rack" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}" data-hex="${p.hex}" data-type="${escapeHtml(p.type || "")}" title="Add straight to rack">${icon("plus", 13)}</button>
                  </div>`}
            </div>
          `;
        }).join("") : `<div class="empty-state__sub">No paints listed.</div>`}
      </div>
      ${isShared && paints.length ? `<div class="fine-print" style="margin-top:6px">${paints.filter((p) => !ownedPaintFor(p.name, p.brand)).length} of ${paints.length} paints not on your rack \u2014 tap the cart to add them to your buy list.</div>` : ""}
      ${!isShared && paints.some((p) => p.isWant) ? `<div class="fine-print" style="margin-top:6px">Paints marked "not on rack" are steps you've planned around something on your buy list.</div>` : ""}

      <div class="section-label">Method</div>
      ${(r.steps || []).length ? groupStepsByArea(r.steps).map((g) => `
        ${g.area ? `<div class="grouphead">${escapeHtml(g.area)}</div>` : ""}
        <div class="layer-stack">
          ${g.items.map(({ step: s, num }) => {
            const p = resolveStepPaint(r, s, "paintId");
            const mixP = (s.mixPaintId || s.mixWantPaint) ? resolveStepPaint(r, s, "mixPaintId") : null;
            const tag = (x) => x && x.isWant ? ` <span class="paint-picker__want-tag">not on rack</span>` : "";
            const swatchBg = mixP
              ? `linear-gradient(to bottom, ${p ? p.hex : f.color} 50%, ${mixP.hex} 50%)`
              : (p ? p.hex : f.color);
            const paintLabel = mixP
              ? `${p ? escapeHtml(p.name) : "(paint deleted)"}${tag(p)} + ${escapeHtml(mixP.name)}${s.mixRatio ? ` (${escapeHtml(s.mixRatio)})` : ""}${tag(mixP)}`
              : (p ? escapeHtml(p.name) + tag(p) : "(paint deleted)");
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
        <button class="btn btn-ghost btn-block" style="flex:1" data-action="print">Print Recipe</button>
        <button class="btn btn-primary btn-block" style="flex:1" data-action="share-recipe" data-id="${r.id}" ${isShared ? `data-author-id="${r.authorId}"` : ""}>
          ${icon("upload", 15)} Share
        </button>
      </div>

      ${r.published ? commentListHtml(ownerId, r.id) : ""}
    </div>
  `;

  // Mobile: .recipe-master is plain block, the list column is hidden, and
  // the detail above fills the screen exactly as before. Desktop: the two
  // become side-by-side columns, so switching recipes from the sidebar
  // never requires leaving this screen.
  return `
    <div class="recipe-master">
      <div class="recipe-master__list">
        ${siblings.map((s) => recipeCompactRowHtml(s, s.id === r.id && (s.authorId || null) === (r.authorId || null))).join("")}
      </div>
      <div class="recipe-master__detail">
        ${detailHtml}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Public recipe share page — the #/r/<authorId>/<id> route. Entirely
// separate from the signed-in app: no shell, no bottom nav, no state/render
// cycle, no localStorage. It's rendered once, directly into #app, by
// init() bypassing decideBootState() entirely (see below) so it works for a
// visitor with no Forgebook account and no session at all.
// ---------------------------------------------------------------
function resolvePublicStepPaint(paints, step, field) {
  const id = step[field];
  if (id) return paints.find((p) => p.id === id) || null;
  const want = step[field === "paintId" ? "wantPaint" : "mixWantPaint"];
  return want ? { ...want, isWant: true } : null;
}

function publicRecipeShellHtml(inner) {
  return `
    <div class="gate public-recipe">
      <div class="gate__card public-recipe__card">
        ${inner}
      </div>
      <div class="toast" id="toast"></div>
    </div>
  `;
}

async function renderPublicRecipe(params) {
  document.getElementById("app").innerHTML = publicRecipeShellHtml(`
    <div class="gate__brand">${icon("book", 26)} Forgebook</div>
    <div class="detail-sub" style="margin-top:14px">Loading recipe…</div>
  `);

  const result = await fetchPublicRecipe(params.authorId, params.id);

  if (!result || !result.recipe.published || result.recipe.deleted) {
    document.getElementById("app").innerHTML = publicRecipeShellHtml(`
      <div class="gate__brand">${icon("book", 26)} Forgebook</div>
      <div class="gate__tagline">This recipe isn't available — it may have been unpublished or removed.</div>
      <a class="btn btn-primary btn-block" style="margin-top:20px" href="./">Open Forgebook</a>
    `);
    return;
  }

  const { recipe: r, paints, authorName: author, authorAvatarUrl } = result;
  const f = faction(r.faction);
  const steps = r.steps || [];

  // This route never calls the normal render() cycle, so comments are
  // fetched straight into the shared cache here (this function is already
  // async) rather than through the fire-and-render ensureCommentsLoaded
  // pattern the signed-in recipe detail page uses.
  const commentsKey = params.authorId + "|" + params.id;
  if (commentsCache[commentsKey] === undefined) {
    try { commentsCache[commentsKey] = await fetchComments(params.authorId, params.id); }
    catch (e) { commentsCache[commentsKey] = []; }
  }

  const usedPaints = [];
  const seenPaintKeys = new Set();
  steps.forEach((s) => {
    [["paintId", "wantPaint"], ["mixPaintId", "mixWantPaint"]].forEach(([idField, wantField]) => {
      const p = resolvePublicStepPaint(paints, s, idField);
      if (!p) return;
      const key = p.id || ("want:" + (p.name || "") + "|" + (p.brand || ""));
      if (seenPaintKeys.has(key)) return;
      seenPaintKeys.add(key);
      usedPaints.push(p);
    });
  });

  document.getElementById("app").innerHTML = publicRecipeShellHtml(`
    <div class="public-recipe__banner">
      <span>${icon("book", 15)} Made with Forgebook</span>
      <a href="./">Get the app</a>
    </div>

    <div class="detail-hero ${r.photo ? "has-photo" : ""}" style="--faction-color:${f.color}${r.photo ? `;background-image:url('${escapeHtml(r.photo)}')` : ""}">
      ${r.photo ? "" : `<span class="emblem-badge emblem-badge--xl">${emblemSvg(f.emblem, 40)}</span>`}
    </div>

    <div class="detail-crumbs">
      <span style="color:${f.color}">${escapeHtml(f.label)}</span>
      <span class="sep">/</span>
      <span>${escapeHtml(r.unit || "General")}</span>
    </div>
    <div class="detail-title">${escapeHtml(r.name)}</div>
    <div class="shared-badge">${avatarGlyphHtml(author, authorAvatarUrl, 16)} Shared by <a href="#/u/${encodeURIComponent(params.authorId)}" style="color:inherit">${escapeHtml(author)}</a></div>

    <div class="metastrip">
      <div class="metastrip__cell">
        <div class="metastrip__n">${difficultyDots(r.difficulty || 1)}</div>
        <div class="metastrip__l">Difficulty</div>
      </div>
      <div class="metastrip__cell">
        <div class="metastrip__n">${steps.length}</div>
        <div class="metastrip__l">Steps</div>
      </div>
      <div class="metastrip__cell">
        <div class="metastrip__n">${formatDuration(estimatedMinutes(r))}</div>
        <div class="metastrip__l">Est. time</div>
      </div>
    </div>

    <div class="section-label">Paints Used</div>
    <div class="paint-list">
      ${usedPaints.length ? usedPaints.map((p) => `
        <div class="paint-row">
          <div class="paint-row__swatch" style="background:${p.hex}">${paintTypeBadgeHtml(p.type)}</div>
          <div>
            <div class="paint-row__name">${escapeHtml(p.name)}</div>
            <div class="paint-row__brand">${escapeHtml(p.brand || "")}${p.type ? " · " + escapeHtml(p.type) : ""}</div>
          </div>
          <div class="paint-row__hex">${escapeHtml(p.hex)}</div>
        </div>
      `).join("") : `<div class="empty-state__sub">No paints listed.</div>`}
    </div>

    <div class="section-label">Method</div>
    ${steps.length ? groupStepsByArea(steps).map((g) => `
      ${g.area ? `<div class="grouphead">${escapeHtml(g.area)}</div>` : ""}
      <div class="layer-stack">
        ${g.items.map(({ step: s, num }) => {
          const p = resolvePublicStepPaint(paints, s, "paintId");
          const mixP = (s.mixPaintId || s.mixWantPaint) ? resolvePublicStepPaint(paints, s, "mixPaintId") : null;
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

    ${commentListHtml(params.authorId, params.id, true)}

    <a class="btn btn-primary btn-block" style="margin-top:24px" href="./">
      ${icon("book", 16)} Track your own recipes with Forgebook
    </a>
  `);
}

// ---------------------------------------------------------------
// Share card — a portrait (1080x1350, the safe Instagram feed crop) PNG
// summarising a recipe, generated client-side on a canvas and handed to the
// Web Share API (or downloaded, where that's unavailable). Deliberately not
// a screenshot of any in-app view: social platforms recompress/crop shared
// images unpredictably, so this is drawn at a fixed size built for that,
// rather than reusing the responsive HTML layout.
// ---------------------------------------------------------------
function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((w) => {
    const attempt = line ? line + " " + w : w;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = attempt;
    }
  });
  if (line) lines.push(line);
  return lines;
}

// usedPaints: recipePaints(r)'s own shape ({name, hex, ...}). steps: pre-
// resolved to {technique, paintName, hex} by the caller — this function only
// draws, it doesn't know how to resolve a step's paint from a rack/id.
function drawShareCardCanvas(r, f, usedPaints, steps) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const pad = 80;

  // --- Background: graphite ground + a faction-coloured glow, same idea as
  // the app's own dark theme but fixed values (no CSS variables in canvas). ---
  ctx.fillStyle = "#14171a";
  ctx.fillRect(0, 0, W, H);
  const { r: fr, g: fg, b: fb } = hexToRgb(f.color);
  const glow = ctx.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, W * 0.75);
  glow.addColorStop(0, `rgba(${fr},${fg},${fb},0.35)`);
  glow.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const gold = "#dcae67";
  const parchment = "#e9e3d4";
  const parchmentDim = "#c2bcaa";
  const ink = "#9c9587";
  const line = "rgba(255,255,255,0.08)";

  let y = pad + 10;

  // --- Faction row: emblem + label ---
  ctx.save();
  ctx.translate(pad, y - 28);
  ctx.fillStyle = f.color;
  ctx.scale(1.4, 1.4);
  // emblemPaths() returns SVG markup (<path d="...">), not raw path data --
  // Path2D only accepts the latter, so each d="..." attribute is pulled out
  // and filled as its own subpath.
  const emblemDs = emblemPaths(f.emblem).match(/d="([^"]+)"/g) || [];
  emblemDs.forEach((m) => {
    const d = m.slice(3, -1);
    try { ctx.fill(new Path2D(d)); } catch (e) {}
  });
  ctx.restore();
  ctx.fillStyle = f.color;
  ctx.font = "600 30px " + FONT_MONO;
  ctx.textBaseline = "middle";
  ctx.fillText(f.label.toUpperCase(), pad + 56, y);
  y += 70;

  // --- Title (up to 2 lines) ---
  ctx.fillStyle = parchment;
  ctx.font = "600 72px " + FONT_DISPLAY;
  ctx.textBaseline = "alphabetic";
  const titleLines = wrapCanvasText(ctx, r.name, W - pad * 2).slice(0, 2);
  titleLines.forEach((l) => { y += 74; ctx.fillText(l, pad, y); });
  y += 20;

  // --- Subtitle ---
  ctx.fillStyle = ink;
  ctx.font = "30px " + FONT_BODY;
  y += 38;
  ctx.fillText(`${r.unit || "General"} · Made with Forgebook`, pad, y);
  y += 44;

  // --- Meta row (difficulty / steps / est. time) ---
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  const metaY = y + 56;
  const cellW = (W - pad * 2) / 3;
  const metas = [
    [difficultyDotsText(r.difficulty || 1), "DIFFICULTY"],
    [String(steps.length), "STEPS"],
    [formatDuration(estimatedMinutes(r)), "EST. TIME"],
  ];
  metas.forEach(([val, label], i) => {
    const cx = pad + cellW * i + cellW / 2;
    ctx.fillStyle = parchment;
    ctx.font = "600 34px " + FONT_MONO;
    ctx.textAlign = "center";
    ctx.fillText(val, cx, metaY);
    ctx.fillStyle = ink;
    ctx.font = "22px " + FONT_MONO;
    ctx.fillText(label, cx, metaY + 34);
  });
  ctx.textAlign = "left";
  y = metaY + 66;
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  y += 54;

  // --- Paints: swatches + name, capped with an overflow chip. Fixed
  // six-column grid (five swatches + an overflow chip once there's more
  // than six paints) so labels always get the same width to wrap into,
  // rather than however much space happens to be left. ---
  ctx.fillStyle = gold;
  ctx.font = "600 24px " + FONT_MONO;
  ctx.fillText("PAINTS", pad, y);
  y += 50;
  const TOTAL_SLOTS = 6;
  const needsOverflow = usedPaints.length > TOTAL_SLOTS;
  const shown = usedPaints.slice(0, needsOverflow ? TOTAL_SLOTS - 1 : TOTAL_SLOTS);
  const overflow = usedPaints.length - shown.length;
  const colW = (W - pad * 2) / TOTAL_SLOTS;
  const swatchR = 42;
  const labelMaxWidth = colW - 14;
  shown.forEach((p, i) => {
    const cx = pad + colW * i + colW / 2;
    const cy = y + swatchR;
    ctx.beginPath();
    ctx.arc(cx, cy, swatchR, 0, Math.PI * 2);
    ctx.fillStyle = p.hex;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = "17px " + FONT_MONO;
    ctx.textAlign = "center";
    const labelLines = wrapCanvasText(ctx, p.name, labelMaxWidth).slice(0, 2);
    labelLines.forEach((l, li) => ctx.fillText(l, cx, cy + swatchR + 26 + li * 20));
  });
  if (overflow > 0) {
    const cx = pad + colW * shown.length + colW / 2;
    const cy = y + swatchR;
    ctx.beginPath();
    ctx.arc(cx, cy, swatchR, 0, Math.PI * 2);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ink;
    ctx.font = "26px " + FONT_MONO;
    ctx.textAlign = "center";
    ctx.fillText("+" + overflow, cx, cy + 8);
  }
  ctx.textAlign = "left";
  y += swatchR * 2 + 66;

  // --- Steps: first few, condensed ---
  ctx.fillStyle = gold;
  ctx.font = "600 24px " + FONT_MONO;
  ctx.fillText("HOW IT'S BUILT", pad, y);
  y += 50;
  const MAX_STEPS = 3;
  steps.slice(0, MAX_STEPS).forEach((s) => {
    ctx.beginPath();
    ctx.arc(pad + 10, y - 9, 10, 0, Math.PI * 2);
    ctx.fillStyle = s.hex || f.color;
    ctx.fill();
    ctx.fillStyle = parchmentDim;
    ctx.font = "30px " + FONT_BODY;
    ctx.fillText(s.technique, pad + 34, y);
    const techW = ctx.measureText(s.technique + " ").width;
    ctx.font = "700 30px " + FONT_BODY;
    ctx.fillStyle = parchment;
    ctx.fillText(s.paintName, pad + 34 + techW, y);
    y += 46;
  });
  if (steps.length > MAX_STEPS) {
    ctx.fillStyle = ink;
    ctx.font = "24px " + FONT_MONO;
    ctx.fillText(`+ ${steps.length - MAX_STEPS} more steps in the app`, pad + 34, y);
    y += 20;
  }

  // --- Footer ---
  const footerY = H - pad + 4;
  ctx.strokeStyle = line;
  ctx.beginPath(); ctx.moveTo(pad, footerY - 44); ctx.lineTo(W - pad, footerY - 44); ctx.stroke();
  ctx.fillStyle = gold;
  ctx.font = "600 34px " + FONT_DISPLAY;
  ctx.textAlign = "left";
  ctx.fillText("Forgebook", pad, footerY);
  ctx.fillStyle = ink;
  ctx.font = "24px " + FONT_MONO;
  ctx.textAlign = "right";
  ctx.fillText("forgebook.co.uk", W - pad, footerY);
  ctx.textAlign = "left";

  return canvas;
}

// Plain solid-dot difficulty text for canvas (no HTML spans available there).
function difficultyDotsText(level, max = 5) {
  let out = "";
  for (let i = 1; i <= max; i++) out += i <= level ? "●" : "○";
  return out;
}

const FONT_DISPLAY = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';
const FONT_BODY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FONT_MONO = 'ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", Consolas, "Liberation Mono", monospace';

// ---------------------------------------------------------------
// View: Paint rack (the user's own paints)
// ---------------------------------------------------------------
function viewPaints() {
  const paints = getPaints();

  // group by brand so a big rack stays navigable
  const brands = [...new Set(paints.map((p) => p.brand || "Unbranded"))].sort();

  return `
    <div class="page-enter">
      <div class="page-title">Paint Rack</div>
      <div class="detail-sub" style="margin-bottom:14px">
        ${paints.length} paint${paints.length === 1 ? "" : "s"} on the rack.
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
              <div class="paint-row__swatch" style="background:${p.hex}">${paintTypeBadgeHtml(p.type)}</div>
              <div>
                <div class="paint-row__name">${escapeHtml(p.name)}</div>
                <div class="paint-row__brand">${escapeHtml(p.type || "Other")}</div>
              </div>
              ${p.quantity > 1 ? `<span class="qty-badge">×${p.quantity}</span>` : ""}
              ${p.needsRestock ? `<span class="restock-badge">Buy</span>` : ""}
              <div class="paint-lib-row__count">${n ? n + (n === 1 ? " recipe" : " recipes") : "unused"}</div>
              <div class="unit-row__chevron">${icon("chevron", 14)}</div>
            </div>`;
        }).join("")}
      `).join("") : emptyStateHtml("palette", "No paints yet", "Add one manually, or browse the paint library.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: One paint
// ---------------------------------------------------------------
function viewPaint(id) {
  const p = findPaint(id);
  if (!p) return emptyStateHtml("palette", "Paint not found", "It may have been removed from the rack.");
  const used = recipesUsingPaint(p);

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
            <div class="settings-row__label">Quantity</div>
            <div class="settings-row__desc">How many pots you've got on the rack.</div>
          </div>
          <div class="lib-row__qty">
            <button class="lib-row__qty-btn" data-action="paint-qty-dec" data-id="${p.id}" data-name="${escapeHtml(p.name)}" aria-label="Decrease quantity">−</button>
            <span class="lib-row__qty-n">${p.quantity || 1}</span>
            <button class="lib-row__qty-btn" data-action="paint-qty-inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Need to buy</div>
            <div class="settings-row__desc">Flag this one for restocking next time you're shopping.</div>
          </div>
          <button class="btn ${p.needsRestock ? "btn-danger" : "btn-ghost"} btn-sm" data-action="toggle-restock" data-id="${p.id}">
            ${p.needsRestock ? "Flagged" : "Flag it"}
          </button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Similar colours</div>
            <div class="settings-row__desc">See who else makes something close, across every brand.</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}" data-hex="${p.hex}">Find</button>
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
// View: Similar colours — either from a specific paint ("what else is
// close to this") or from a colour picked directly ("what's this called").
// A real route (not a modal like the recipe-step paint picker) since
// there's no in-progress form to preserve underneath it, and a shareable
// URL for "similar to X" is genuinely useful.
// ---------------------------------------------------------------
function resolveSourceHex(name, brand) {
  const owned = ownedPaintFor(name, brand);
  if (owned) return owned.hex;
  const lib = PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
  return lib ? lib.hex : null;
}

function resolveSourceType(name, brand) {
  const owned = ownedPaintFor(name, brand);
  if (owned) return owned.type;
  const lib = PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === paintKey(name, brand));
  return lib ? lib.type : null;
}

let similarColours = { sourceName: null, sourceBrand: null, hex: "#b8863f", resultFilter: "all" };
// The params signature similarColours was last built from — lets
// viewSimilarColours tell "the route was navigated to fresh" (reinitialise)
// apart from "the filter tabs were clicked" (leave it alone), even though
// both end up calling render() the same way.
let similarColoursSeenSig = null;

function openSimilarColours(name, brand, hex) {
  similarColoursSeenSig = name + "|" + brand;
  similarColours = { sourceName: name, sourceBrand: brand, hex: hex || resolveSourceHex(name, brand) || "#b8863f", resultFilter: "other" };
  navigate("similar", { name, brand });
}

// ---------------------------------------------------------------
// Community Notes — freeform tips on a library paint, fetched on demand
// (there's no bulk "everyone's notes on everything" cache the way ratings
// have one, since that would mean downloading every note on every paint up
// front for a page most people will only ever view a handful of). Loaded by
// ensurePaintNotesLoaded, called from bindSimilarColours once the page is on
// screen; undefined = not fetched yet, an array = loaded (possibly empty).
// ---------------------------------------------------------------
let paintNotesCache = {};
let paintNotesLoading = {};
let communityNoteForm = { body: "" };
let communityNoteFormSeenSig = null;

// Called by cloud.js's onSignedOut — notes visibility is per-viewer (RLS
// hides a flagged/reported note from everyone but its author), so a stale
// cache from the previous session must not leak into the next one.
function resetPaintNotesCache() {
  paintNotesCache = {};
  paintNotesLoading = {};
}

// ---------------------------------------------------------------
// Recipe comments — flat, chronological (newest first), fetched on demand
// per recipe exactly like Community Notes above (same reasoning: no bulk
// "every comment on everything" cache makes sense here either). Cache key
// is "ownerId|recipeId" since a recipe's own id is only unique per-author.
// ---------------------------------------------------------------
let commentsCache = {};
let commentsLoading = {};
let commentForm = { body: "", editingId: null };
let commentFormSeenSig = null;

function resetCommentsCache() {
  commentsCache = {};
  commentsLoading = {};
}

function ensureCommentsLoaded(ownerId, recipeId) {
  const key = ownerId + "|" + recipeId;
  if (commentsCache[key] !== undefined || commentsLoading[key]) return;
  commentsLoading[key] = true;
  fetchComments(ownerId, recipeId)
    .then((comments) => { commentsCache[key] = comments; })
    .catch((e) => { commentsCache[key] = []; })
    .finally(() => { commentsLoading[key] = false; render(); });
}

// readOnly forces the plain read-only rendering regardless of session state
// — used by the public (signed-out) share page, which has no state/render()
// cycle of its own to react to a click-delegate action even if the visitor
// happens to already have a session (e.g. an installed PWA opening its own
// share link) — so composer/reply/edit/report controls would be dead UI
// there rather than actually broken, but simplest and safest is to just
// never offer them on that route at all.
function commentListHtml(ownerId, recipeId, readOnly = false) {
  const key = ownerId + "|" + recipeId;
  if (commentFormSeenSig !== key) {
    commentFormSeenSig = key;
    commentForm = { body: "", editingId: null };
  }
  const comments = commentsCache[key];
  const myId = currentUserId();
  const sorted = comments ? [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : comments;
  const canWrite = !readOnly && isSignedIn();
  return `
    <div class="section-label">Comments${comments ? ` (${comments.length})` : ""}</div>
    ${canWrite ? `
      <div class="note-composer">
        <textarea id="comment-input" maxlength="500" placeholder="Ask a question or share a tip...">${escapeHtml(commentForm.body)}</textarea>
        <div class="note-composer__footer">
          <span class="char-count">${commentForm.body.length}/500</span>
          <button class="btn btn-primary btn-sm" data-action="submit-comment" data-owner-id="${escapeHtml(ownerId)}" data-recipe-id="${escapeHtml(recipeId)}">${commentForm.editingId ? "Save edit" : "Post comment"}</button>
        </div>
      </div>
    ` : readOnly ? `<div class="fine-print" style="margin-bottom:14px">Sign in to comment — <a href="./">open Forgebook</a>.</div>` : `<div class="fine-print" style="margin-bottom:14px">Sign in to comment.</div>`}
    ${sorted === undefined
      ? `<div class="empty-state__sub">Loading comments…</div>`
      : sorted.length
      ? sorted.map((c) => commentRowHtml(c, myId, readOnly)).join("")
      : `<div class="empty-state__sub">No comments yet.</div>`}
  `;
}

function commentRowHtml(c, myId, readOnly = false) {
  const isMine = !readOnly && c.userId === myId;
  const pending = c.flagged || c.status === "hidden";
  const links = [];
  if (!readOnly && isSignedIn() && !isMine) links.push(`<button class="comment-row__link" data-action="reply-comment" data-user-id="${escapeHtml(c.userId)}">Reply</button>`);
  if (isMine) {
    links.push(`<button class="comment-row__link" data-action="edit-comment" data-id="${escapeHtml(c.id)}" data-body="${escapeHtml(c.body)}">Edit</button>`);
    links.push(`<button class="comment-row__link" data-action="delete-comment" data-id="${escapeHtml(c.id)}">Delete</button>`);
  }
  return `
    <div class="comment-row ${pending ? "is-pending" : ""}">
      <div class="comment-row__meta">
        <span class="comment-row__author" data-nav="profile" data-id="${escapeHtml(c.userId)}">${avatarHtml(c.userId, 16)} ${escapeHtml(authorName(c.userId))}</span>
        <span class="comment-row__time">${relativeTime(c.createdAt)}${c.edited ? " · edited" : ""}</span>
        ${pending ? `<span class="pill-status">${c.status === "hidden" ? "Hidden — reported" : "Hidden — pending review"}</span>` : ""}
      </div>
      <div class="comment-row__body">${escapeHtml(c.body)}</div>
      ${links.length ? `<div class="comment-row__linkrow">${links.join("")}</div>` : ""}
      ${!readOnly && !isMine && isSignedIn() ? `<button class="comment-row__report" data-action="report" data-kind="comment" data-id="${escapeHtml(c.id)}" title="Report">${icon("flag", 13)}</button>` : ""}
    </div>
  `;
}

// ---------------------------------------------------------------
// User profiles — a hub for someone's published recipes, community notes,
// and ratings. One route serves two modes (mirrors viewSimilarColours'
// isColourMode duality): no id = search/browse, an id = that person's page.
// ---------------------------------------------------------------
let profileCache = {};
let profileLoading = {};
let profileSearch = { query: "", results: [] };
let profileSearchDebounce = null;

// ---------------------------------------------------------------
// Global search — the topbar box's app-wide results page. Ephemeral UI
// state, not part of `state`/the URL (mirrors profileSearch above) so
// typing doesn't spam browser history with one entry per keystroke.
// ---------------------------------------------------------------
let globalSearch = { query: "", tab: "top", accountResults: [], accountResultsQuery: "" };
let globalSearchDebounce = null;

// Shared by the topbar input and by tapping a recent search — runs (or
// re-runs) a global search and always lands on the search route. Accounts
// is the one category that needs a network round trip (searchProfiles),
// so it gets the exact same debounce-then-check-staleness shape
// #profile-search-input's own handler already uses.
function runGlobalSearch(q) {
  globalSearch.query = q;
  const input = document.getElementById("search-input");
  if (input && input.value !== q) input.value = q;
  clearTimeout(globalSearchDebounce);
  const trimmed = q.trim();
  if (!trimmed) {
    globalSearch.accountResults = [];
    globalSearch.accountResultsQuery = "";
  } else {
    globalSearchDebounce = setTimeout(() => {
      searchProfiles(trimmed).then((results) => {
        if (globalSearch.query.trim() !== trimmed) return; // superseded by more typing
        globalSearch.accountResults = results;
        globalSearch.accountResultsQuery = trimmed;
        render();
      });
    }, 250);
  }
  if (state.route === "search") render(); else navigate("search");
}

function resetProfileCache() {
  profileCache = {};
  profileLoading = {};
}

function ensureProfileLoaded(userId) {
  if (profileCache[userId] !== undefined || profileLoading[userId]) return;
  profileLoading[userId] = true;
  fetchProfile(userId)
    .then((p) => { profileCache[userId] = p; })
    .catch((e) => { profileCache[userId] = null; })
    .finally(() => { profileLoading[userId] = false; render(); });
}

// Reverses a paint_key back to a real PAINT_LIBRARY entry for display —
// notes/ratings are only ever stored keyed by paint_key, never a name/brand
// pair, so this is the one place that needs to go the other way.
function paintFromKey(key) {
  return PAINT_LIBRARY.find((p) => paintKey(p.name, p.brand) === key) || null;
}

function profileSearchResultRowHtml(p) {
  return `
    <div class="settings-row" data-nav="profile" data-id="${escapeHtml(p.userId)}" style="cursor:pointer">
      <div style="display:flex; align-items:center; gap:10px">
        ${avatarGlyphHtml(p.displayName, p.avatarUrl, 28)}
        <div class="settings-row__label">${escapeHtml(p.displayName)}</div>
      </div>
    </div>
  `;
}

function profileNoteRowHtml(n) {
  const paint = paintFromKey(n.paintKey);
  return `
    <div class="comment-row">
      <div class="comment-row__meta">
        ${paint
          ? `<span class="comment-row__author" data-action="find-similar-colour" data-name="${escapeHtml(paint.name)}" data-brand="${escapeHtml(paint.brand)}" data-hex="${paint.hex}" style="cursor:pointer">${escapeHtml(paint.name)}</span>`
          : `<span class="comment-row__author">Unknown paint</span>`}
        <span class="comment-row__time">${relativeTime(n.createdAt)}</span>
      </div>
      <div class="comment-row__body">${escapeHtml(n.body)}</div>
    </div>
  `;
}

function profileRatingRowHtml(r) {
  const paint = paintFromKey(r.paintKey);
  return `
    <div class="settings-row">
      <div>
        <div class="settings-row__label">${paint ? escapeHtml(paint.name) : "Unknown paint"}</div>
        <div class="settings-row__desc">${paint ? escapeHtml(paint.brand) : ""}</div>
      </div>
      ${starRowHtml(r.stars, { size: 14 })}
    </div>
  `;
}

function viewProfile(params) {
  if (!params.id) {
    return `
      <div class="page-enter">
        <div class="detail-header">
          <button class="icon-btn" data-nav="settings">${icon("back", 18)}</button>
          <div class="page-title" style="margin:0">Find a Painter</div>
          <div style="width:36px"></div>
        </div>
        <div class="field" style="margin-bottom:14px">
          <input type="text" id="profile-search-input" placeholder="Search by display name" value="${escapeHtml(profileSearch.query)}" autocomplete="off" />
        </div>
        ${profileSearch.results.length
          ? profileSearch.results.map(profileSearchResultRowHtml).join("")
          : profileSearch.query
          ? emptyStateHtml("search", "No painters found", "Try a different name.")
          : `<div class="empty-state__sub">Type a name to search.</div>`}
      </div>
    `;
  }

  ensureProfileLoaded(params.id);
  const p = profileCache[params.id];
  const isMe = params.id === currentUserId();
  // Your own Profile is now the primary "my stuff" screen (reached via the
  // main nav), so it shows everything you own, published or not -- a
  // stranger's page stays symmetric with what a visitor to it would see
  // (published only). My own recipes live in the own-recipe cache
  // (getSharedRecipes() explicitly excludes the caller's own rows) --
  // everyone else's come from the fetched profile, tagged with authorId so
  // recipeCardHtml links them through the existing shared-recipe nav path.
  const recipes = isMe
    ? getRecipes()
    : p ? p.recipes.map((r) => ({ ...r, authorId: params.id })) : [];

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="home">${icon("back", 18)}</button>
        ${isMe ? `<button class="icon-btn" data-nav="settings">${icon("settings", 18)}</button>` : `<div style="width:36px"></div>`}
      </div>
      ${p === undefined
        ? `<div class="empty-state__sub">Loading…</div>`
        : p === null
        ? emptyStateHtml("search", "Painter not found", "This profile doesn't exist, or has no published work yet.")
        : `
          <div style="display:flex; align-items:center; gap:12px">
            ${avatarGlyphHtml(p.displayName, p.avatarUrl, 56)}
            <div>
              <div class="detail-title">${escapeHtml(p.displayName)}</div>
              <div class="detail-sub">${recipes.length} recipe${recipes.length === 1 ? "" : "s"}${isMe ? "" : " shared"}</div>
            </div>
          </div>

          ${isMe ? personalWorkspaceHtml(recipes) : ""}

          <div class="section-label">${isMe ? "Your Recipes" : "Published Recipes"}</div>
          ${recipes.length
            ? `<div class="recipe-grid">${recipes.map(recipeCardHtml).join("")}</div>`
            : emptyStateHtml("book", "No recipes yet", isMe ? "Tap the + button to record your first paint recipe." : "Nothing published so far.")}

          <div class="section-label">Notes Written</div>
          ${p.notes.length ? p.notes.map(profileNoteRowHtml).join("") : `<div class="empty-state__sub">No community notes yet.</div>`}

          <div class="section-label">Ratings Given</div>
          ${p.ratings.length ? p.ratings.map(profileRatingRowHtml).join("") : `<div class="empty-state__sub">No ratings yet.</div>`}
        `}
    </div>
  `;
}

// "Continue Painting" + "Your Armies" -- lifted from the old Home tab
// (which is now the community activity feed) since this personal-workspace
// convenience needed a new home once Home stopped being personal. Only
// rendered on your own Profile, never a stranger's.
function personalWorkspaceHtml(recipes) {
  const recents = getRecents().map((id) => findRecipe(id)).filter(Boolean);
  const cont = recents[0] || recipes[0];
  const armies = [...new Set(recipes.map((r) => r.faction))];

  return `
    ${cont ? `
      <div class="section-label">Continue Painting</div>
      <div class="continue-card" data-nav="recipe" data-id="${cont.id}" style="--faction-color:${faction(cont.faction).color}">
        <div class="continue-card__hero ${cont.photo ? "has-photo" : ""}"${cont.photo ? ` style="background-image:url('${cont.photo}')"` : ""}>
          ${cont.photo ? "" : `<span class="emblem-badge emblem-badge--md">${emblemSvg(faction(cont.faction).emblem, 24)}</span>`}
        </div>
        <div class="continue-card__body">
          <div class="continue-card__eyebrow">${escapeHtml(faction(cont.faction).label)}${cont.unit ? " · " + escapeHtml(cont.unit) : ""}</div>
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
  `;
}

// The signed-out share-link variant — recipes only (see fetchPublicProfile),
// same bare-shell/no-render()-cycle posture as renderPublicRecipe. Recipe
// cards here are real <a href="#/r/..."> anchors, not data-nav elements —
// this page has no click-delegate reliance at all, matching every other
// interactive-looking thing on it.
function publicProfileRecipeCardHtml(r, authorId) {
  const fac = faction(r.faction);
  return `
    <a class="recipe-card" href="#/r/${encodeURIComponent(authorId)}/${encodeURIComponent(r.id)}" style="--faction-color:${fac.color}">
      <div class="recipe-card__hero ${r.photo ? "has-photo" : ""}"${r.photo ? ` style="background-image:url('${escapeHtml(r.photo)}')"` : ""}>
        ${r.photo ? "" : `<span class="recipe-card__emblem emblem-badge emblem-badge--lg">${emblemSvg(fac.emblem, 26)}</span>`}
        <div class="recipe-card__stack">
          ${(r.steps || []).slice(0, 6).map(() => `<span style="background:${fac.color}"></span>`).join("")}
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
    </a>
  `;
}

async function renderPublicProfile(id) {
  document.getElementById("app").innerHTML = publicRecipeShellHtml(`
    <div class="gate__brand">${icon("book", 26)} Forgebook</div>
    <div class="detail-sub" style="margin-top:14px">Loading painter…</div>
  `);

  const result = await fetchPublicProfile(id);
  if (!result) {
    document.getElementById("app").innerHTML = publicRecipeShellHtml(`
      <div class="gate__brand">${icon("book", 26)} Forgebook</div>
      <div class="gate__tagline">This painter isn't available — they may not exist, or have no published work.</div>
      <a class="btn btn-primary btn-block" style="margin-top:20px" href="./">Open Forgebook</a>
    `);
    return;
  }

  const recipes = result.recipes;
  document.getElementById("app").innerHTML = publicRecipeShellHtml(`
    <div class="public-recipe__banner">
      <span>${icon("book", 15)} Made with Forgebook</span>
      <a href="./">Get the app</a>
    </div>
    <div style="display:flex; align-items:center; gap:12px">
      ${avatarGlyphHtml(result.displayName, result.avatarUrl, 56)}
      <div>
        <div class="detail-title">${escapeHtml(result.displayName)}</div>
        <div class="detail-sub">${recipes.length} recipe${recipes.length === 1 ? "" : "s"} shared</div>
      </div>
    </div>

    <div class="section-label">Published Recipes</div>
    ${recipes.length
      ? `<div class="recipe-grid">${recipes.map((r) => publicProfileRecipeCardHtml(r, id)).join("")}</div>`
      : emptyStateHtml("book", "No recipes yet", "Nothing published so far.")}

    <a class="btn btn-primary btn-block" style="margin-top:24px" href="./">
      ${icon("book", 16)} Track your own recipes with Forgebook
    </a>
  `);
}

function ensurePaintNotesLoaded(key) {
  if (paintNotesCache[key] !== undefined || paintNotesLoading[key]) return;
  paintNotesLoading[key] = true;
  fetchPaintNotes(key)
    .then((notes) => { paintNotesCache[key] = notes; })
    .catch((e) => { paintNotesCache[key] = []; })
    .finally(() => { paintNotesLoading[key] = false; render(); });
}

function communityNotesHtml(sourceName, sourceBrand) {
  const key = paintKey(sourceName, sourceBrand);
  if (communityNoteFormSeenSig !== key) {
    communityNoteFormSeenSig = key;
    communityNoteForm = { body: "" };
  }
  const notes = paintNotesCache[key];
  const myId = currentUserId();
  return `
    <div class="section-label">Community Notes</div>
    <div class="detail-sub" style="margin:2px 2px 12px">
      Freeform tips from other painters on this paint — comparisons to old ranges, texture, anything that doesn't fit the fields above.
    </div>
    ${isSignedIn() ? `
      <div class="note-composer">
        <textarea id="note-input" maxlength="500" placeholder="e.g. &quot;Similar to the old Citadel Goblin Green&quot;">${escapeHtml(communityNoteForm.body)}</textarea>
        <div class="note-composer__footer">
          <span class="char-count">${communityNoteForm.body.length}/500</span>
          <button class="btn btn-primary btn-sm" data-action="submit-note">Post note</button>
        </div>
      </div>
    ` : `<div class="fine-print" style="margin-bottom:14px">Sign in to leave a note.</div>`}
    ${notes === undefined
      ? `<div class="empty-state__sub">Loading notes…</div>`
      : notes.length
      ? notes.map((n) => communityNoteRowHtml(n, myId)).join("")
      : `<div class="empty-state__sub">No notes yet — be the first.</div>`}
  `;
}

function communityNoteRowHtml(n, myId) {
  const isMine = n.userId === myId;
  const pending = n.flagged || n.status === "hidden";
  return `
    <div class="comment-row ${pending ? "is-pending" : ""}">
      <div class="comment-row__meta">
        <span class="comment-row__author" data-nav="profile" data-id="${escapeHtml(n.userId)}">${avatarHtml(n.userId, 16)} ${escapeHtml(authorName(n.userId))}</span>
        <span class="comment-row__time">${relativeTime(n.createdAt)}</span>
        ${pending ? `<span class="pill-status">${n.status === "hidden" ? "Hidden — reported" : "Hidden — pending review"}</span>` : ""}
      </div>
      <div class="comment-row__body">${escapeHtml(n.body)}</div>
      ${!isMine ? `<button class="comment-row__report" data-action="report" data-kind="note" data-id="${escapeHtml(n.id)}" title="Report">${icon("flag", 13)}</button>` : ""}
    </div>
  `;
}

// A primary action on the page, not buried like Community Notes further
// down — sits right under the "here's the paint you looked up" row.
function paintRatingWidgetHtml(sourceName, sourceBrand) {
  const summary = getRatingSummary(sourceName, sourceBrand);
  const mine = myRatingFor(sourceName, sourceBrand);
  return `
    <div class="rating-widget">
      ${starRowHtml(mine, { size: 22, interactive: true })}
      <div class="rating-widget__meta">
        ${summary
          ? `<span class="rating-widget__avg">${Number(summary.avgStars).toFixed(1)}</span><span class="rating-widget__count">(${summary.ratingCount})</span>`
          : `<span class="rating-widget__count">No ratings yet</span>`}
        ${mine ? `<div class="rating-widget__mine">Your rating: ${mine}★ · tap a star to change</div>` : ""}
      </div>
    </div>
  `;
}

function viewSimilarColours(params) {
  const sig = params.name ? params.name + "|" + params.brand : "__colour__";
  if (sig !== similarColoursSeenSig) {
    similarColoursSeenSig = sig;
    similarColours = params.name
      ? { sourceName: params.name, sourceBrand: params.brand, hex: resolveSourceHex(params.name, params.brand) || "#b8863f", resultFilter: "other" }
      : { sourceName: null, sourceBrand: null, hex: similarColours.hex || "#b8863f", resultFilter: "all" };
  }
  const st = similarColours;
  // Whether this screen is anchored to a specific paint (tapped a swatch
  // somewhere) or is the free-standing colour-picker tool — every swatch
  // app-wide can trigger the former directly now, so there's no manual
  // mode switch left to drive this off of.
  const isColourMode = !st.sourceName;
  const activeHex = st.hex;
  const sourceType = !isColourMode ? resolveSourceType(st.sourceName, st.sourceBrand) : null;
  const excludeKey = !isColourMode ? paintKey(st.sourceName, st.sourceBrand) : "__none__";
  const matches = computeColourMatches(activeHex, excludeKey, st.resultFilter, !isColourMode ? st.sourceBrand : null, sourceType);

  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="paint-library">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">Similar Colours</div>
        <div style="width:36px"></div>
      </div>

      <div class="detail-sub" style="margin:4px 2px">
        ${isColourMode
          ? "Not sure what it's called? Set a colour directly and match it against every brand Forgebook knows."
          : "Tap ≈ on any swatch below to explore further, or use the filters to narrow these down."}
      </div>

      ${isColourMode ? `
        <div class="colour-match-card">
          <div class="wheel-wrap">
            <canvas id="wheel-canvas" width="180" height="180"></canvas>
            <div class="wheel-indicator" id="wheel-indicator"></div>
          </div>
          <div class="brightness-row">
            <span class="brightness-row__label">Bright</span>
            <input type="range" id="brightness-input" min="0" max="100" />
          </div>
          <div class="colour-match-card__row">
            <div class="picker-swatch" id="colour-preview" style="background:${st.hex}"></div>
            <div class="picker-fields">
              <div class="hex-field">
                <span>#</span>
                <input type="text" id="hex-input" value="${st.hex.replace("#", "").toUpperCase()}" maxlength="6" />
              </div>
              <div class="swatch-row">
                ${["#7e1b1b", "#c2591c", "#c99a2e", "#3c5c29", "#1b4b6b", "#4b2e63", "#3b2a22", "#4a4d52"]
                  .map((h) => `<button type="button" data-swatch="${h}" style="background:${h}"></button>`).join("")}
              </div>
            </div>
          </div>
          <div class="label-hint" style="margin-top:10px">Drag the wheel for hue and saturation, or type a hex code.</div>
        </div>
      ` : ""}

      <div class="colour-match-source">
        <div class="paint-row__swatch" id="results-source-swatch" style="background:${activeHex}">${!isColourMode ? paintTypeBadgeHtml(sourceType) : ""}</div>
        <div>
          <div class="results-source__name">${isColourMode ? "Your colour" : escapeHtml(st.sourceName)}</div>
          <div class="results-source__meta" id="results-source-meta">${isColourMode ? activeHex.toUpperCase() : escapeHtml(st.sourceBrand)}</div>
        </div>
      </div>

      ${!isColourMode ? paintRatingWidgetHtml(st.sourceName, st.sourceBrand) : ""}

      <div class="lib-filter-seg">
        <button data-action="similar-filter" data-filter="all" class="${st.resultFilter === "all" ? "is-active" : ""}">All brands</button>
        <button data-action="similar-filter" data-filter="other" class="${st.resultFilter === "other" ? "is-active" : ""}" ${isColourMode ? "disabled style=\"opacity:.4\"" : ""}>Other brands</button>
        <button data-action="similar-filter" data-filter="owned" class="${st.resultFilter === "owned" ? "is-active" : ""}">On my rack</button>
      </div>

      <div id="matches-container">${colourMatchListHtml(matches)}</div>

      ${!isColourMode ? communityNotesHtml(st.sourceName, st.sourceBrand) : ""}
    </div>
  `;
}

// Only worth splitting into sections when the list is actually mixed —
// colour-picker mode (no source category to compare against) and an
// all-same-category result both just read as one flat list.
function colourMatchListHtml(matches) {
  if (!matches.length) return `<div class="empty-state__sub">No matches.</div>`;
  const same = matches.filter((m) => m.sameCategory);
  const other = matches.filter((m) => !m.sameCategory);
  if (!same.length || !other.length) return matches.map(colourMatchRowHtml).join("");
  return `
    <div class="section-label">Same kind of paint</div>
    ${same.map(colourMatchRowHtml).join("")}
    <div class="section-label">Other paints</div>
    ${other.map(colourMatchRowHtml).join("")}
  `;
}

function colourMatchRowHtml(m) {
  const owned = ownedPaintFor(m.paint.name, m.paint.brand);
  return `
    <div class="colour-match-row">
      <div class="paint-row__swatch" data-action="find-similar-colour" data-name="${escapeHtml(m.paint.name)}" data-brand="${escapeHtml(m.paint.brand)}" data-hex="${m.paint.hex}" title="Find similar colours" style="background:${m.paint.hex}">${paintTypeBadgeHtml(m.paint.type)}</div>
      <div class="colour-match-row__info">
        <div class="paint-row__name">${escapeHtml(m.paint.name)}</div>
        <div class="paint-row__brand">${escapeHtml(m.paint.brand)} · ${escapeHtml(m.paint.type)}</div>
      </div>
      <div class="colour-match-row__score">
        <span>${m.score}%</span>
        <div class="colour-match-row__bar"><i style="width:${m.score}%"></i></div>
      </div>
      ${owned
        ? `<span class="lib-row__ring is-owned" title="On your rack">${icon("check", 13)}</span>`
        : `<button class="lib-row__flag is-wanted ${isWanted(m.paint.name, m.paint.brand) ? "is-on" : ""}" data-action="toggle-wanted" data-name="${escapeHtml(m.paint.name)}" data-brand="${escapeHtml(m.paint.brand)}" title="${isWanted(m.paint.name, m.paint.brand) ? "On your buy list" : "Add to buy list"}">${icon("cart", 13)}</button>`}
    </div>
  `;
}

// Shared by the full render() and applyLiveColour()'s lightweight live
// update, so the two can never drift into ranking results differently.
// sourceType groups same-behaviour paints (a wash next to other washes, not
// a base coat that happens to share a hex) ahead of everything else, still
// ranked by colour closeness within each group.
function computeColourMatches(hex, excludeKey, resultFilter, sourceBrand, sourceType) {
  const sourceCat = sourceType ? paintCategory(sourceType) : null;
  let matches = PAINT_LIBRARY
    .filter((p) => paintKey(p.name, p.brand) !== excludeKey)
    .map((p) => ({ paint: p, score: colourSimilarity(hex, p.hex), sameCategory: !sourceCat || paintCategory(p.type) === sourceCat }));
  if (resultFilter === "other" && sourceBrand) {
    matches = matches.filter((m) => m.paint.brand !== sourceBrand);
  } else if (resultFilter === "owned") {
    matches = matches.filter((m) => ownedPaintFor(m.paint.name, m.paint.brand));
  }
  matches.sort((a, b) => (b.sameCategory - a.sameCategory) || (b.score - a.score));
  return matches.slice(0, 20);
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
  let entries = PAINT_LIBRARY;
  if (state.paintLibBrands.length) entries = entries.filter((p) => state.paintLibBrands.includes(p.brand));
  if (state.paintLibCategories.length) entries = entries.filter((p) => state.paintLibCategories.includes(paintCategory(p.type)));

  const isOwnedEntry = (p) => !!ownedPaintFor(p.name, p.brand);
  const isWantedEntry = (p) => !isOwnedEntry(p) && isWanted(p.name, p.brand);
  // "To buy" covers both flavours of "go get this next time you're
  // shopping" -- a paint you don't own yet and a paint you own but flagged
  // as running low -- even though they're mutually exclusive per-paint and
  // use separate flag buttons (toggle-wanted vs toggle-restock).
  const needsPurchaseEntry = (p) => {
    if (isWantedEntry(p)) return true;
    const owned = ownedPaintFor(p.name, p.brand);
    return !!owned && owned.needsRestock;
  };

  if (state.paintLibFilter === "owned") entries = entries.filter(isOwnedEntry);
  else if (state.paintLibFilter === "want") entries = entries.filter(needsPurchaseEntry);

  const allBrands = [...new Set(PAINT_LIBRARY.map((p) => p.brand))];
  const totalCount = PAINT_LIBRARY.length;
  const ownedCount = PAINT_LIBRARY.filter(isOwnedEntry).length;
  const wantCount = PAINT_LIBRARY.filter(needsPurchaseEntry).length;
  const pct = totalCount ? Math.round((ownedCount / totalCount) * 100) : 0;

  // Group by each entry's own type/range label (brand-authentic, e.g. "Speedpaint
  // 2.0" or "Model Color") rather than the fixed Citadel-only PAINT_TYPES list, so
  // every brand's real ranges show up as their own section.
  const groups = [];
  entries.forEach((p) => { if (!groups.includes(p.type)) groups.push(p.type); });

  // "Top rated" breaks out of the type-grouped layout entirely -- the whole
  // point is a single ranked list (e.g. "all whites, best rated first"),
  // which a per-type grouping would just fragment back apart. Unrated
  // entries sort last; ties break by rating count, then name.
  const ratedSorted =
    state.paintLibSort === "rating"
      ? [...entries].sort((a, b) => {
          const as = getRatingSummary(a.name, a.brand);
          const bs = getRatingSummary(b.name, b.brand);
          const aAvg = as ? as.avgStars : -1;
          const bAvg = bs ? bs.avgStars : -1;
          if (bAvg !== aAvg) return bAvg - aAvg;
          const aCount = as ? as.ratingCount : 0;
          const bCount = bs ? bs.ratingCount : 0;
          if (bCount !== aCount) return bCount - aCount;
          return a.name.localeCompare(b.name);
        })
      : null;

  const row = (p) => {
    const owned = ownedPaintFor(p.name, p.brand);
    const wanted = isWanted(p.name, p.brand);
    const summary = getRatingSummary(p.name, p.brand);
    const flagBtn = owned
      ? `<button class="lib-row__flag is-restock ${owned.needsRestock ? "is-on" : ""}" data-action="toggle-restock" data-id="${owned.id}" title="${owned.needsRestock ? "Flagged for restock" : "Flag for restock"}">${icon("cart", 14)}</button>`
      : `<button class="lib-row__flag is-wanted ${wanted ? "is-on" : ""}" data-action="toggle-wanted" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}" title="${wanted ? "On your buy list" : "Add to buy list"}">${icon("cart", 14)}</button>`;
    // Owned rows drop the whole-row tap-to-toggle: it made removing a paint
    // one accidental tap away. Decreasing the quantity to 0 confirms first
    // (see paint-qty-dec) and is now the only way a paint leaves the rack.
    const statusBtn = owned
      ? `<div class="lib-row__qty">
          <button class="lib-row__qty-btn" data-action="paint-qty-dec" data-id="${owned.id}" data-name="${escapeHtml(p.name)}" aria-label="Decrease quantity">−</button>
          <span class="lib-row__qty-n">${owned.quantity || 1}</span>
          <button class="lib-row__qty-btn" data-action="paint-qty-inc" data-id="${owned.id}" aria-label="Increase quantity">+</button>
        </div>`
      : `<span class="lib-row__ring lib-row__ring--add" title="Add to rack">${icon("plus", 14)}</span>`;
    return `
      <div class="lib-row ${owned ? "is-owned" : ""}"
        ${owned ? "" : `data-action="toggle-have"`}
        data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}"
        data-hex="${p.hex}" data-type="${escapeHtml(p.type)}"
      >
        <div class="paint-row__swatch" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand)}" data-hex="${p.hex}" title="Find similar colours" style="background:${p.hex}">${paintTypeBadgeHtml(p.type)}${summary ? `<span class="lib-row__rating" title="${Number(summary.avgStars).toFixed(1)} average, ${summary.ratingCount} rating${summary.ratingCount === 1 ? "" : "s"}">★${Number(summary.avgStars).toFixed(1)}</span>` : ""}</div>
        <div class="lib-row__info">
          <div class="paint-row__name">${escapeHtml(p.name)}</div>
          <div class="paint-row__brand">${escapeHtml(p.brand)} · ${escapeHtml(p.type)}</div>
        </div>
        ${flagBtn}
        ${statusBtn}
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
        Tap a paint's swatch to find similar colours from other brands. Tap the row to add a first
        pot to your rack, then use +/− to track how many you've got — down to 0 removes it. Flag
        ones you're missing for a buy list, or ones you own but are running low for a restock.
        Colours are close approximations, not official swatches — manufacturers don't publish exact codes.
      </div>

      <button class="colour-match-cta" data-nav="similar">${icon("search", 18)} Match a colour you have in mind</button>

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
          <div class="faction-chip ${!state.paintLibBrands.length ? "is-active" : ""}" data-action="lib-brand" data-brand="">All brands</div>
          ${allBrands.map((b) => `<div class="faction-chip ${state.paintLibBrands.includes(b) ? "is-active" : ""}" data-action="lib-brand" data-brand="${escapeHtml(b)}">${escapeHtml(b)}</div>`).join("")}
        </div>
      ` : ""}

      <div class="faction-row" style="margin-bottom:10px">
        <div class="faction-chip ${!state.paintLibCategories.length ? "is-active" : ""}" data-action="lib-category" data-category="">All types</div>
        ${["base", "wash", "contrast", "metallic", "primer"].map((c) => `<div class="faction-chip ${state.paintLibCategories.includes(c) ? "is-active" : ""}" data-action="lib-category" data-category="${c}">${PAINT_CATEGORY_LABEL[c]}</div>`).join("")}
      </div>

      <div class="lib-filter-seg" style="margin-bottom:10px">
        <button class="${state.paintLibSort === "name" ? "is-active" : ""}" data-action="lib-sort" data-sort="name">Default order</button>
        <button class="${state.paintLibSort === "rating" ? "is-active" : ""}" data-action="lib-sort" data-sort="rating">Top rated</button>
      </div>

      ${!entries.length
        ? emptyStateHtml("search", "No matches", "Try a different filter.")
        : ratedSorted
        ? `<div class="section-label">Top rated</div><div class="lib-grid">${ratedSorted.map(row).join("")}</div>`
        : groups
            .map((type) => {
              const inType = entries.filter((p) => p.type === type);
              const ownedInType = inType.filter(isOwnedEntry).length;
              return `
                <div class="section-label">${escapeHtml(type)} <span class="lib-section-count">${ownedInType}/${inType.length} owned</span></div>
                <div class="lib-grid">${inType.map(row).join("")}</div>
              `;
            })
            .join("")}
    </div>
  `;
}

// The colour wheel's canvas gradient is static (hue/sat only, always at full
// brightness) so it only needs drawing once per full render(); dragging it
// (or the brightness slider) only ever moves the indicator and recolours the
// live bits below — never rebuilding the view, since a full render() mid-drag
// would replace the canvas out from under an in-progress pointer capture and
// silently kill the drag.
function bindSimilarColours(root) {
  // Runs regardless of colour-picker vs anchored-to-a-paint mode (the wheel
  // canvas below only exists in the former), since Community Notes only
  // makes sense when there's an actual paint to fetch notes for.
  if (similarColours.sourceName) {
    ensurePaintNotesLoaded(paintKey(similarColours.sourceName, similarColours.sourceBrand));
  }

  const canvas = root.querySelector("#wheel-canvas");
  if (!canvas) return;

  const wheel = hexToHsv(similarColours.hex);
  drawColourWheel(canvas);
  positionWheelIndicator(canvas, wheel);

  const brightnessInput = root.querySelector("#brightness-input");
  if (brightnessInput) {
    brightnessInput.value = Math.round(wheel.v * 100);
    brightnessInput.style.background = `linear-gradient(to right, #000, ${hsvToHex(wheel.h, wheel.s, 1)})`;
    brightnessInput.oninput = (e) => {
      const w = hexToHsv(similarColours.hex);
      applyLiveColour(hsvToHex(w.h, w.s, Number(e.target.value) / 100));
    };
    brightnessInput.onchange = () => render(); // full resync once the gesture ends
  }

  const hexInput = root.querySelector("#hex-input");
  if (hexInput) {
    hexInput.oninput = (e) => {
      const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
      e.target.value = v;
      if (v.length === 6) { similarColours.hex = "#" + v; render(); }
    };
  }
  root.querySelectorAll("[data-swatch]").forEach((el) => {
    el.onclick = () => { similarColours.hex = el.dataset.swatch; render(); };
  });

  let dragging = false;
  const R = canvas.width / 2;
  function updateFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scale - R;
    const y = (e.clientY - rect.top) * scale - R;
    const dist = Math.sqrt(x * x + y * y);
    let angle = Math.atan2(x, -y);
    if (angle < 0) angle += Math.PI * 2;
    const w = hexToHsv(similarColours.hex);
    applyLiveColour(hsvToHex((angle / (Math.PI * 2)) * 360, Math.min(1, dist / R), w.v));
  }
  canvas.onpointerdown = (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); updateFromEvent(e); };
  canvas.onpointermove = (e) => { if (dragging) updateFromEvent(e); };
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    render(); // full resync once the gesture ends
  };
  canvas.onpointerup = endDrag;
  canvas.onpointercancel = endDrag;
}

function drawColourWheel(canvas) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2, cy = size / 2, radius = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const conic = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  for (let i = 0; i <= 360; i += 15) conic.addColorStop(i / 360, hsvToHex(i, 1, 1));
  ctx.fillStyle = conic;
  ctx.fillRect(0, 0, size, size);

  // White at centre fading to transparent at the rim desaturates toward the
  // middle -- the usual "hue ring, white core" wheel look.
  const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  radial.addColorStop(0, "rgba(255,255,255,1)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

function positionWheelIndicator(canvas, wheel) {
  const indicator = document.getElementById("wheel-indicator");
  if (!indicator) return;
  const R = canvas.width / 2;
  const angle = (wheel.h / 360) * Math.PI * 2;
  const dist = wheel.s * R;
  const x = R + dist * Math.sin(angle);
  const y = R - dist * Math.cos(angle);
  indicator.style.left = ((x / canvas.width) * 100) + "%";
  indicator.style.top = ((y / canvas.height) * 100) + "%";
  indicator.style.background = hsvToHex(wheel.h, wheel.s, wheel.v);
}

// The lightweight path for anything that fires many times per second (wheel
// drag, brightness drag): touches only the DOM that actually needs to
// change, so a fast drag never fights a full render() over the canvas or
// drops pointer capture mid-gesture.
function applyLiveColour(hex) {
  similarColours.hex = hex;
  const canvas = document.getElementById("wheel-canvas");
  if (canvas) positionWheelIndicator(canvas, hexToHsv(hex));

  const preview = document.getElementById("colour-preview");
  if (preview) preview.style.background = hex;

  const hexInput = document.getElementById("hex-input");
  if (hexInput && document.activeElement !== hexInput) hexInput.value = hex.replace("#", "").toUpperCase();

  const brightnessInput = document.getElementById("brightness-input");
  if (brightnessInput && document.activeElement !== brightnessInput) {
    const w = hexToHsv(hex);
    brightnessInput.value = Math.round(w.v * 100);
    brightnessInput.style.background = `linear-gradient(to right, #000, ${hsvToHex(w.h, w.s, 1)})`;
  }

  const srcSwatch = document.getElementById("results-source-swatch");
  if (srcSwatch) srcSwatch.style.background = hex;
  const srcMeta = document.getElementById("results-source-meta");
  if (srcMeta) srcMeta.textContent = hex.toUpperCase();

  const container = document.getElementById("matches-container");
  if (container) {
    const excludeKey = similarColours.sourceName ? paintKey(similarColours.sourceName, similarColours.sourceBrand) : "__none__";
    const matches = computeColourMatches(hex, excludeKey, similarColours.resultFilter, similarColours.sourceName ? similarColours.sourceBrand : null);
    container.innerHTML = colourMatchListHtml(matches);
  }
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
// A snapshot taken when the form opens, compared against on cancel so
// leaving only prompts when something was actually touched.
let recipeFormSnapshot = null;

function newStep() {
  // mixPaintId is undefined (not "") when there's no mix at all — that's
  // what tells the form whether to show the "+ Mix in a second paint"
  // button or the expanded second-paint picker.
  //
  // wantPaint/mixWantPaint hold a snapshot ({name,brand,hex,type}) of a
  // library paint picked that isn't on the rack yet — a way to plan a step
  // around something you're shopping for. Mutually exclusive with the
  // matching id field: exactly one of paintId/wantPaint (same for the mix
  // pair) is ever set at a time.
  return {
    id: "ns" + Math.random().toString(36).slice(2, 9),
    technique: TECHNIQUES[0], paintId: "", wantPaint: undefined,
    notes: "", area: "", mixPaintId: undefined, mixWantPaint: undefined, mixRatio: "",
  };
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
        published: false,
      };
  if (recipeForm.unit === null) recipeForm.unit = "";
  recipeFormSnapshot = JSON.stringify(recipeForm);
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

// The clickable field that opens the paint picker for one step's paint or
// mix-paint slot, showing the current pick's swatch \u2014 or a placeholder if
// nothing's chosen yet, or a "not on rack" tag if it's a want-list pick.
function paintPickTriggerHtml(step, field) {
  const p = resolveStepPaint(recipeForm, step, field);
  const swatch = p ? p.hex : "transparent";
  const label = p
    ? `${escapeHtml(p.name)}${p.brand ? " (" + escapeHtml(p.brand) + ")" : ""}`
    : `<span class="paint-pick-trigger__placeholder">Choose a paint\u2026</span>`;
  return `
    <button type="button" class="paint-pick-trigger" data-action="open-paint-picker" data-step-id="${step.id}" data-field="${field}">
      <span class="paint-pick-row__swatch" style="background:${swatch}"></span>
      <span class="paint-pick-trigger__label">${label}</span>
      ${p && p.isWant ? `<span class="paint-picker__want-tag">Not on rack</span>` : ""}
    </button>
  `;
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

      ${isSignedIn() ? `
      <div class="field">
        <label>Sharing</label>
        <div class="share-toggle ${recipeForm.published ? "is-on" : ""}" data-action="toggle-published">
          <div class="share-toggle__text">
            <strong>Share this recipe</strong>
            <span>Visible to everyone else in Forgebook, listed as by ${escapeHtml(authorName(currentUserId()))} under its army and unit.</span>
          </div>
          <div class="share-toggle__switch"><i></i></div>
        </div>
      </div>
      ` : ""}

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
      ${rackEmpty ? `<div class="notice">Your paint rack is empty \u2014 pick a paint from the full library below and it'll go on your buy list, or add one to your rack first.</div>` : ""}

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
              ${paintPickTriggerHtml(s, "paintId")}
              <button type="button" class="btn btn-ghost btn-sm" data-action="quick-paint" data-step-id="${s.id}">+ New</button>
            </div>
          </div>
          ${s.mixPaintId !== undefined || s.mixWantPaint !== undefined ? `
            <div class="field" style="margin-bottom:10px;">
              <label>Mixed with <span class="label-hint">a second paint, blended with the one above</span></label>
              <div class="paint-pick-row">
                ${paintPickTriggerHtml(s, "mixPaintId")}
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
    };
  });
}

// ---------------------------------------------------------------
// Paint picker — a searchable overlay for choosing a recipe step's paint, in
// place of a plain <select> that becomes unusable once a rack has more than
// a handful of entries. Self-contained: binds its own listeners directly
// (like showConfirm) rather than going through the global click delegation.
// ---------------------------------------------------------------
let paintPicker = null; // { stepId, field, query, tab, brands, categories } while open — brands/categories are multi-select, empty = any

function openPaintPicker(stepId, field) {
  paintPicker = { stepId, field, query: "", tab: getPaints().length ? "rack" : "library", brands: [], categories: [] };
  renderPaintPicker();
}

function paintPickerKeydown(e) {
  if (e.key === "Escape") closePaintPicker();
}

function closePaintPicker() {
  const el = document.getElementById("paint-picker-overlay");
  if (el) el.remove();
  document.removeEventListener("keydown", paintPickerKeydown);
  paintPicker = null;
}

// entry is a plain {name,brand,hex,type} snapshot either way; ownedEntry is
// the matching rack paint (with its own id) when there is one.
function pickPaintForStep(entry, ownedEntry) {
  const step = recipeForm.steps.find((s) => s.id === paintPicker.stepId);
  if (step) {
    const idField = paintPicker.field;
    const wantField = idField === "paintId" ? "wantPaint" : "mixWantPaint";
    if (ownedEntry) {
      step[idField] = ownedEntry.id;
      step[wantField] = undefined;
    } else {
      step[idField] = "";
      step[wantField] = { name: entry.name, brand: entry.brand, hex: entry.hex, type: entry.type };
      // Picking something you don't own is the point of this path — put it
      // on the shopping list too, unless it's already there.
      if (!isWanted(entry.name, entry.brand)) toggleWanted(entry.name, entry.brand);
    }
  }
  closePaintPicker();
  render();
}

function paintPickerRowHtml(entry, ownedEntry, isSelected) {
  const attrs = ownedEntry
    ? `data-pick-id="${ownedEntry.id}"`
    : `data-pick-name="${escapeHtml(entry.name)}" data-pick-brand="${escapeHtml(entry.brand || "")}" data-pick-hex="${entry.hex}" data-pick-type="${escapeHtml(entry.type || "")}"`;
  return `
    <button type="button" class="paint-picker__row ${isSelected ? "is-selected" : ""}" ${attrs}>
      <span class="paint-pick-row__swatch" style="background:${entry.hex}"></span>
      <div class="paint-picker__row-info">
        <div class="paint-row__name">${escapeHtml(entry.name)}</div>
        <div class="paint-row__brand">${escapeHtml(entry.brand || "")}${entry.type ? " · " + escapeHtml(entry.type) : ""}</div>
      </div>
      ${ownedEntry ? "" : `<span class="paint-picker__want-tag">Not on rack</span>`}
    </button>
  `;
}

function renderPaintPicker() {
  const { stepId, field, query, tab, brands: selectedBrands, categories: selectedCategories } = paintPicker;
  const step = recipeForm.steps.find((s) => s.id === stepId);
  const currentId = step ? step[field] : null;
  const currentWant = step ? step[field === "paintId" ? "wantPaint" : "mixWantPaint"] : null;

  // Brand chips reflect whichever pool (rack or full library) is currently
  // showing, so switching tabs never leaves a brand selected that has no
  // paints in the new pool.
  const pool = tab === "rack" ? getPaints() : PAINT_LIBRARY;
  const brands = [...new Set(pool.map((p) => p.brand).filter(Boolean))].sort();

  const q = query.trim().toLowerCase();
  let rackList = getPaints().slice().sort((a, b) => a.name.localeCompare(b.name));
  let libList = PAINT_LIBRARY;
  if (q) {
    rackList = rackList.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
    libList = libList.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }
  if (selectedBrands.length) {
    rackList = rackList.filter((p) => selectedBrands.includes(p.brand));
    libList = libList.filter((p) => selectedBrands.includes(p.brand));
  }
  if (selectedCategories.length) {
    rackList = rackList.filter((p) => selectedCategories.includes(paintCategory(p.type)));
    libList = libList.filter((p) => selectedCategories.includes(paintCategory(p.type)));
  }

  const rows = tab === "rack"
    ? (rackList.length
        ? rackList.map((p) => paintPickerRowHtml(p, p, currentId === p.id)).join("")
        : `<div class="empty-state__sub" style="padding:20px 0">${q ? "No matches on your rack." : "Nothing on your rack yet — try Full library."}</div>`)
    : (libList.length
        ? libList.map((p) => {
            const owned = ownedPaintFor(p.name, p.brand);
            const isSelected = owned
              ? currentId === owned.id
              : !!(currentWant && paintKey(currentWant.name, currentWant.brand) === paintKey(p.name, p.brand));
            return paintPickerRowHtml(p, owned, isSelected);
          }).join("")
        : `<div class="empty-state__sub" style="padding:20px 0">No matches.</div>`);

  let wrap = document.getElementById("paint-picker-overlay");
  const isNew = !wrap;
  if (isNew) {
    wrap = document.createElement("div");
    wrap.id = "paint-picker-overlay";
    wrap.className = "filter-overlay";
    document.body.appendChild(wrap);
    document.addEventListener("keydown", paintPickerKeydown);
  }

  // Same focus/caret preservation as render()'s generic handling — rebuilding
  // innerHTML on every keystroke would otherwise drop focus from the search
  // box after exactly one character.
  const activeEl = document.activeElement;
  const focusInfo = activeEl && activeEl.id === "paint-picker-search"
    ? { selStart: activeEl.selectionStart, selEnd: activeEl.selectionEnd }
    : null;

  wrap.innerHTML = `
    <div class="filter-overlay__backdrop" data-picker-close="1"></div>
    <div class="paint-picker__panel">
      <div class="paint-picker__header">
        <div class="paint-picker__title">Choose a paint</div>
        <button type="button" class="icon-btn" data-picker-close="1" aria-label="Close">${icon("back", 18)}</button>
      </div>
      <div class="paint-picker__search">
        ${icon("search", 15)}
        <input type="text" id="paint-picker-search" placeholder="Search by name or brand" value="${escapeHtml(query)}" />
      </div>
      <div class="lib-filter-seg paint-picker__tabs">
        <button type="button" class="${tab === "rack" ? "is-active" : ""}" data-picker-tab="rack">On rack <span class="b">${getPaints().length}</span></button>
        <button type="button" class="${tab === "library" ? "is-active" : ""}" data-picker-tab="library">Full library <span class="b">${PAINT_LIBRARY.length}</span></button>
      </div>
      ${brands.length > 1 ? `
        <div class="faction-row" style="margin:0 16px 8px; flex-shrink:0">
          <div class="faction-chip ${!selectedBrands.length ? "is-active" : ""}" data-picker-brand="">All brands</div>
          ${brands.map((b) => `<div class="faction-chip ${selectedBrands.includes(b) ? "is-active" : ""}" data-picker-brand="${escapeHtml(b)}">${escapeHtml(b)}</div>`).join("")}
        </div>
      ` : ""}
      <div class="faction-row" style="margin:0 16px 10px; flex-shrink:0">
        <div class="faction-chip ${!selectedCategories.length ? "is-active" : ""}" data-picker-category="">All types</div>
        ${["base", "wash", "contrast", "metallic", "primer"].map((c) => `<div class="faction-chip ${selectedCategories.includes(c) ? "is-active" : ""}" data-picker-category="${c}">${PAINT_CATEGORY_LABEL[c]}</div>`).join("")}
      </div>
      <div class="paint-picker__body">${rows}</div>
    </div>
  `;

  wrap.querySelectorAll("[data-picker-close]").forEach((el) => { el.onclick = () => closePaintPicker(); });
  wrap.querySelectorAll("[data-picker-tab]").forEach((el) => {
    // Reset the brand filter too -- it's scoped to whichever pool is showing
    // (see `brands` above), so carrying a brand selection across tabs could
    // leave it active against a pool that doesn't have that brand at all.
    el.onclick = () => { paintPicker.tab = el.dataset.pickerTab; paintPicker.query = ""; paintPicker.brands = []; renderPaintPicker(); };
  });
  wrap.querySelectorAll("[data-picker-brand]").forEach((el) => {
    el.onclick = () => {
      const b = el.dataset.pickerBrand;
      if (!b) paintPicker.brands = [];
      else {
        const idx = paintPicker.brands.indexOf(b);
        if (idx > -1) paintPicker.brands.splice(idx, 1); else paintPicker.brands.push(b);
      }
      renderPaintPicker();
    };
  });
  wrap.querySelectorAll("[data-picker-category]").forEach((el) => {
    el.onclick = () => {
      const c = el.dataset.pickerCategory;
      if (!c) paintPicker.categories = [];
      else {
        const idx = paintPicker.categories.indexOf(c);
        if (idx > -1) paintPicker.categories.splice(idx, 1); else paintPicker.categories.push(c);
      }
      renderPaintPicker();
    };
  });

  const searchInput = wrap.querySelector("#paint-picker-search");
  searchInput.oninput = (e) => { paintPicker.query = e.target.value; renderPaintPicker(); };
  if (focusInfo || isNew) {
    searchInput.focus();
    if (focusInfo && focusInfo.selStart != null) {
      try { searchInput.setSelectionRange(focusInfo.selStart, focusInfo.selEnd); } catch (e) {}
    }
  }

  wrap.querySelectorAll("[data-pick-id], [data-pick-name]").forEach((el) => {
    el.onclick = () => {
      if (el.dataset.pickId) {
        const owned = getPaints().find((p) => p.id === el.dataset.pickId);
        if (owned) pickPaintForStep(owned, owned);
      } else {
        const entry = { name: el.dataset.pickName, brand: el.dataset.pickBrand, hex: el.dataset.pickHex, type: el.dataset.pickType };
        pickPaintForStep(entry, null);
      }
    };
  });
}

// ---------------------------------------------------------------
// View: Settings
// ---------------------------------------------------------------
// Shared by the boot-time gate and this signed-out Settings block, so the
// two never drift out of sync on copy or on which disclaimers get shown.
// Three states: sign in, create an account, or "check your email" after a
// signup \u2014 the last one replaces the fields entirely rather than sitting
// alongside them, since there's nothing left to do here until that link is
// clicked (email confirmation is required before the account can sign in).
function authFormHtml() {
  if (authSignupSent) {
    return `
      <div class="empty-state__sub" style="padding:0">
        Check <strong>${escapeHtml(authSignupSent)}</strong> for a confirmation link. Once you click it,
        come back here and sign in.
      </div>
      <button type="button" class="btn btn-ghost btn-sm" data-action="auth-mode-signin" style="margin-top:10px">Back to sign in</button>
    `;
  }

  if (authMode === "signup") {
    return `
      <div class="field" style="margin-bottom:10px">
        <label>Display name</label>
        <input type="text" id="auth-display-name" placeholder="What should we call you?" value="${escapeHtml(authDisplayName)}" autocomplete="nickname" />
        <div class="label-hint" style="margin-top:4px">Shown as the author on any recipe you share.</div>
      </div>
      <div class="field" style="margin-bottom:10px">
        <label>Email</label>
        <input type="email" id="signin-email" placeholder="you@example.com" autocomplete="email" />
      </div>
      <div class="field" style="margin-bottom:10px">
        <label>Password</label>
        <input type="password" id="new-password" placeholder="At least 8 characters" autocomplete="new-password" />
      </div>
      <div class="field" style="margin-bottom:10px">
        <label>Confirm password</label>
        <input type="password" id="new-password-confirm" placeholder="Type it again" autocomplete="new-password" />
      </div>
      <button class="btn btn-primary btn-block" data-action="sign-up" ${cloudAvailable() ? "" : "disabled"}>Create account</button>
      <div class="settings-row__desc" style="margin-top:10px">
        ${cloudAvailable()
          ? "You'll get an email with a confirmation link \u2014 you can't sign in until you click it."
          : "You're offline, so account creation isn't available right now. An account is required to use Forgebook."}
      </div>
      <button type="button" class="btn btn-ghost btn-sm" data-action="auth-mode-signin" style="margin-top:8px">Already have an account? Sign in</button>
    `;
  }

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
        ? "New here?"
        : "You're offline, so sign-in isn't available right now. An account is required to use Forgebook."}
      ${cloudAvailable() ? `<button type="button" class="btn btn-ghost btn-sm" data-action="auth-mode-signup" style="margin-left:6px">Create an account</button>` : ""}
    </div>
  `;
}

function viewSettings() {
  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="profile" data-id="${escapeHtml(currentUserId())}">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">Settings</div>
        <div style="width:36px"></div>
      </div>

      <div class="section-label">Account</div>
      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">${escapeHtml(currentEmail())}</div>
            <div class="settings-row__desc">${escapeHtml(syncStatusLabel() || "")}</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="sync-now" ${syncing ? "disabled" : ""}>Refresh</button>
        </div>
        <div class="settings-row" style="display:block">
          <div class="settings-row__label">Display name</div>
          <div class="settings-row__desc" style="margin-bottom:10px">Shown as the author on any recipe you share.</div>
          <div class="field" style="display:flex; gap:8px; align-items:center; margin-bottom:0">
            <input type="text" id="display-name-input" value="${escapeHtml(authorName(currentUserId()))}" placeholder="e.g. ${escapeHtml(defaultDisplayName(currentEmail()))}" />
            <button class="btn btn-ghost btn-sm" data-action="save-display-name">Save</button>
          </div>
        </div>
        <div class="settings-row">
          <div style="display:flex; align-items:center; gap:12px">
            ${avatarHtml(currentUserId(), 44)}
            <div>
              <div class="settings-row__label">Profile picture</div>
              <div class="settings-row__desc">Shown next to your name in comments and search.</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="avatar-pick">Change</button>
          <input type="file" id="avatar-input" accept="image/*" class="hidden" />
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
            <div class="settings-row__label">Find a painter</div>
            <div class="settings-row__desc">Look up someone else's profile by display name.</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-nav="profile">Search</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Sign out</div>
            <div class="settings-row__desc">You'll need to sign in again to use Forgebook.</div>
          </div>
          <button class="btn btn-danger" data-action="sign-out">Sign out</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Appearance</div>
            <div class="settings-row__desc">Dark suits painting under a lamp; light holds up in daylight too.</div>
          </div>
          <div class="theme-toggle" role="group" aria-label="Theme">
            <button type="button" class="theme-toggle__btn ${getThemePref() === "dark" ? "is-active" : ""}" data-set-theme="dark">Dark</button>
            <button type="button" class="theme-toggle__btn ${getThemePref() === "light" ? "is-active" : ""}" data-set-theme="light">Light</button>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Install Forgebook</div>
            <div class="settings-row__desc">Add to your home screen for quicker, app-like access.</div>
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
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Forgebook</div>
            <div class="settings-row__desc">Version 0.5 &middot; ${getRecipes().length} recipes &middot; ${getPaints().length} paints</div>
          </div>
        </div>
      </div>

      <div class="fine-print">
        Faction names are used to organise your own recipes. Forgebook is an unofficial hobby
        tool, not affiliated with or endorsed by Games Workshop. All emblems shipped with the
        app are original artwork. If you sign in, your email address and an encrypted password
        are stored with our database provider (Supabase) so your recipes can sync across
        devices — this is a small, self-run hobby project, not a professional security service,
        so please use a password you don't rely on elsewhere. An account is required to use
        Forgebook.
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Notifications
// ---------------------------------------------------------------
// Resolves a notification's deep-link target and summary text. A mention
// can point at either a recipe comment (recipeId set) or a paint note
// (paintKey set, no recipe fields) -- comment/rating notifications always
// point at a recipe, since a rating notification's recipe_owner_id/recipe_id
// are the recipient's own published recipe that features the rated paint.
function notificationRowHtml(n) {
  const recipe = n.recipeId ? findRecipe(n.recipeId, n.recipeOwnerId === currentUserId() ? undefined : n.recipeOwnerId) : null;
  const paint = !recipe && n.paintKey ? paintFromKey(n.paintKey) : null;

  let text;
  if (n.type === "comment") text = `commented on your recipe "${escapeHtml(recipe ? recipe.name : "a recipe")}"`;
  else if (n.type === "rating") text = `rated a paint you feature in "${escapeHtml(recipe ? recipe.name : "a recipe")}"`;
  else if (recipe) text = `mentioned you in a comment on "${escapeHtml(recipe.name)}"`;
  else text = `mentioned you in a note on ${escapeHtml(paint ? paint.name : "a paint")}`;

  // One data-action carries both effects (mark read + navigate) rather than
  // pairing data-action with data-nav on the same element -- the generic
  // [data-nav] delegate case is checked (and returns) before any data-action
  // branch further down, so a dual-purpose element would never reach its
  // own mark-read handling.
  const linkAttrs = recipe
    ? `data-recipe-id="${escapeHtml(n.recipeId)}" data-recipe-owner="${escapeHtml(n.recipeOwnerId)}"`
    : paint
    ? `data-paint-name="${escapeHtml(paint.name)}" data-paint-brand="${escapeHtml(paint.brand)}" data-paint-hex="${paint.hex}"`
    : "";

  return `
    <div class="comment-row ${n.read ? "" : "is-unread"}" data-action="open-notification" data-id="${escapeHtml(n.id)}" ${linkAttrs} style="cursor:pointer">
      <div class="comment-row__meta">
        ${avatarHtml(n.actorId, 18)}
        <span class="comment-row__author">${escapeHtml(authorName(n.actorId))}</span>
        <span class="comment-row__time">${relativeTime(n.createdAt)}</span>
        ${n.read ? "" : `<span class="notif-dot" aria-hidden="true"></span>`}
      </div>
      <div class="comment-row__body">${text}</div>
    </div>
  `;
}

function viewNotifications() {
  const notifications = getNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-nav="home">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">Notifications</div>
        <div style="width:36px"></div>
      </div>
      ${unread ? `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px">
          <button class="btn btn-ghost btn-sm" data-action="mark-all-read">Mark all as read</button>
        </div>
      ` : ""}
      ${notifications.length
        ? notifications.map(notificationRowHtml).join("")
        : emptyStateHtml("bell", "No notifications yet", "You'll hear about comments, ratings, and mentions here.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Global search (topbar box) — a tab bar (Top/Recipes/Paints/
// Armies & Units/Accounts) over the same match logic from Stage 1.
// ---------------------------------------------------------------
function searchPaintRowHtml(p) {
  return `
    <div class="paint-lib-row" data-action="find-similar-colour" data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}" data-hex="${p.hex}" style="cursor:pointer">
      <div class="paint-row__swatch" style="background:${p.hex}">${paintTypeBadgeHtml(p.type)}</div>
      <div>
        <div class="paint-row__name">${escapeHtml(p.name)}</div>
        <div class="paint-row__brand">${escapeHtml(p.brand || "")}${p.type ? " · " + escapeHtml(p.type) : ""}</div>
      </div>
    </div>
  `;
}

function searchArmyRowHtml(f) {
  return `
    <div class="unit-row" data-nav="faction" data-id="${f.id}">
      <div class="unit-row__bar" style="background:${f.color}"></div>
      <div class="unit-row__name">${escapeHtml(f.label)}</div>
      <div class="unit-row__chevron">${icon("chevron", 16)}</div>
    </div>
  `;
}

function searchUnitRowHtml(u) {
  const f = faction(u.facId);
  return `
    <div class="unit-row" data-open-unit="${escapeHtml(u.unit)}" data-faction="${u.facId}">
      <div class="unit-row__bar" style="background:${f.color}"></div>
      <div class="unit-row__name">${escapeHtml(u.unit)} <span style="opacity:0.6">· ${escapeHtml(f.label)}</span></div>
      <div class="unit-row__count">${u.count}</div>
      <div class="unit-row__chevron">${icon("chevron", 16)}</div>
    </div>
  `;
}

// Dispatches a Top-tab item to whichever row renderer matches its kind —
// recipes get the denser compact row (consistent height across a mixed
// list), not the full recipe-grid card used on the Recipes tab itself.
function searchTopRowHtml(item) {
  if (item.kind === "recipe") return recipeCompactRowHtml(item.data, false);
  if (item.kind === "paint") return searchPaintRowHtml(item.data);
  if (item.kind === "army") return searchArmyRowHtml(item.data);
  if (item.kind === "unit") return searchUnitRowHtml(item.data);
  return profileSearchResultRowHtml(item.data);
}

function viewSearch() {
  const q = globalSearch.query.trim().toLowerCase();
  const header = `
    <div class="detail-header">
      <button class="icon-btn" data-nav="home">${icon("back", 18)}</button>
      <div class="page-title" style="margin:0">Search</div>
      <div style="width:36px"></div>
    </div>
  `;

  if (!q) {
    return `<div class="page-enter">${header}${emptyStateHtml("search", "Search Forgebook", "Search for a recipe, paint, army, unit, or painter.")}</div>`;
  }

  const recipes = getVisibleRecipes().filter((r) => recipeMatchesQuery(r, q));
  const paints = PAINT_LIBRARY.filter((p) => paintMatchesQuery(p, q));
  const armies = FACTIONS.filter((f) => factionMatchesQuery(f, q));
  const units = allUnitsMatching(q);
  const accountsReady = globalSearch.accountResultsQuery === q;
  const accounts = accountsReady ? globalSearch.accountResults : [];

  const tabs = [
    { key: "top", label: "Top" }, // no count, mirrors Instagram's own Top tab
    { key: "recipes", label: "Recipes", count: recipes.length },
    { key: "paints", label: "Paints", count: paints.length },
    { key: "armies", label: "Armies & Units", count: armies.length + units.length },
    { key: "accounts", label: "Accounts", count: accountsReady ? accounts.length : null },
  ];
  const activeTab = tabs.some((t) => t.key === globalSearch.tab) ? globalSearch.tab : "top";

  const tabBar = `
    <div class="search-tabs">
      ${tabs.map((t) => `
        <div class="search-tab ${activeTab === t.key ? "is-active" : ""}" data-action="search-tab" data-tab="${t.key}">
          ${escapeHtml(t.label)}
          ${t.count != null ? `<span class="search-tab__count">${t.count}</span>` : t.key === "accounts" ? `<span class="search-tab__count">…</span>` : ""}
        </div>
      `).join("")}
    </div>
  `;

  let body;
  if (activeTab === "recipes") {
    body = recipes.length
      ? `<div class="recipe-grid">${recipes.map(recipeCardHtml).join("")}</div>`
      : emptyStateHtml("book", "No recipes match", "Try a different search term.");
  } else if (activeTab === "paints") {
    body = paints.length
      ? paints.slice(0, 40).map(searchPaintRowHtml).join("")
      : emptyStateHtml("palette", "No paints match", "Try a different search term.");
  } else if (activeTab === "armies") {
    body = (armies.length || units.length)
      ? `
        ${armies.length ? `<div class="section-label">Armies</div>${armies.map(searchArmyRowHtml).join("")}` : ""}
        ${units.length ? `<div class="section-label">Units</div>${units.map(searchUnitRowHtml).join("")}` : ""}
      `
      : emptyStateHtml("banner", "No armies or units match", "Try a different search term.");
  } else if (activeTab === "accounts") {
    body = accounts.length
      ? accounts.map(profileSearchResultRowHtml).join("")
      : `<div class="empty-state__sub">${accountsReady ? "No painters match." : "Searching…"}</div>`;
  } else {
    const rankedRecipes = rankByTier(recipes, (r) => r.name, q).map((r) => ({ kind: "recipe", data: r }));
    const rankedPaints = rankByTier(paints, (p) => p.name, q).map((p) => ({ kind: "paint", data: p }));
    const rankedArmies = rankByTier(armies, (f) => f.label, q).map((f) => ({ kind: "army", data: f }));
    const rankedUnits = rankByTier(units, (u) => u.unit, q).map((u) => ({ kind: "unit", data: u }));
    const rankedAccounts = accountsReady ? rankByTier(accounts, (a) => a.displayName, q).map((a) => ({ kind: "account", data: a })) : [];
    const top = interleaveTop([rankedRecipes, rankedPaints, rankedArmies, rankedUnits, rankedAccounts], 15);
    body = top.length ? top.map(searchTopRowHtml).join("") : emptyStateHtml("search", "No matches", "Try a different search term.");
  }

  return `
    <div class="page-enter">
      ${header}
      ${tabBar}
      ${body}
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
function bindAuthInputs(root) {
  const bind = (id, fn) => { const el = root.querySelector(id); if (el) el.oninput = fn; };
  bind("#signin-email", (e) => { authEmail = e.target.value; });
  bind("#signin-password", (e) => { authPassword = e.target.value; });
  bind("#new-password", (e) => { authNewPassword = e.target.value; });
  bind("#new-password-confirm", (e) => { authNewPasswordConfirm = e.target.value; });
  bind("#auth-display-name", (e) => { authDisplayName = e.target.value; });
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

  if (route === "home") html = viewHome();
  else if (route === "factions") html = viewFactions();
  else if (route === "faction") { html = viewFaction(params.id); showFab = false; }
  else if (route === "unit") html = viewUnit(params.id, params.unit);
  else if (route === "recipes") html = viewRecipes();
  else if (route === "recipe" && params.edit) {
    if (!recipeForm || recipeForm.id !== params.id) initRecipeForm(findRecipe(params.id));
    html = viewRecipeForm(true);
    showFab = false;
  } else if (route === "recipe") { html = viewRecipeDetail(params.id, params.authorId); showFab = false; }
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
  else if (route === "similar") { html = viewSimilarColours(params); showFab = false; }
  else if (route === "profile") { html = viewProfile(params); showFab = false; }
  else if (route === "settings") { html = viewSettings(); showFab = false; }
  else if (route === "notifications") { html = viewNotifications(); showFab = false; }
  else if (route === "search") { html = viewSearch(); showFab = false; }
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
  bindSimilarColours(root);

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
  updateNotifBadge();
  // Leaving the search route (nav tap, back button, tapping a result) clears
  // the topbar box, so it doesn't show a stale query next time it's opened.
  if (state.route !== "search" && globalSearch.query) {
    globalSearch.query = "";
    const si = document.getElementById("search-input");
    if (si) si.value = "";
  }

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
let authDisplayName = ""; // collected at signup and on the invite's password-setup screen
let authMode = "signin"; // "signin" | "signup" — which fields authFormHtml() shows
let authSignupSent = null; // the email a confirmation link was just sent to, or null
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

// Same "static shell element, updated by id" pattern as updateSyncPill —
// the topbar bell is built once at boot (see buildShell), not re-rendered
// per route. Reload-on-demand, not polling: this only reflects whatever
// loadBook last fetched, matching every other cache in this app.
function updateNotifBadge() {
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  const count = getNotifications().filter((n) => !n.read).length;
  badge.classList.toggle("hidden", count === 0);
  badge.textContent = count > 9 ? "9+" : String(count);
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
    if (!appBooted) {
      location.hash = ""; // always land on Home after signing in, not wherever the hash last pointed
      decideBootState();
    } else {
      render();
    }
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

  if (t("[data-action='auth-mode-signup']")) { authMode = "signup"; authSignupSent = null; render(); return; }
  if (t("[data-action='auth-mode-signin']")) {
    authMode = "signin"; authSignupSent = null;
    authNewPassword = ""; authNewPasswordConfirm = "";
    render();
    return;
  }

  if (t("[data-action='sign-up']")) {
    const email = (authEmail || "").trim();
    const pw = authNewPassword || "";
    const pw2 = authNewPasswordConfirm || "";
    const name = (authDisplayName || "").trim();
    if (!name) { showToast("Enter a display name first"); return; }
    if (!email || !email.includes("@")) { showToast("Enter your email"); return; }
    if (pw.length < 8) { showToast("Use at least 8 characters"); return; }
    if (pw !== pw2) { showToast("Passwords don't match"); return; }
    const res = await signUp(email, pw, name);
    if (!res.ok) { showToast(res.message); return; }
    authNewPassword = ""; authNewPasswordConfirm = ""; authDisplayName = "";
    authSignupSent = email;
    render();
    return;
  }

  if (t("[data-action='submit-password']")) {
    const pw = authNewPassword || "";
    const pw2 = authNewPasswordConfirm || "";
    const wasSetup = passwordScreenMode === "setup";
    const name = (authDisplayName || "").trim();
    if (wasSetup && !name) { showToast("Enter a display name first"); return; }
    if (pw.length < 8) { showToast("Use at least 8 characters"); return; }
    if (pw !== pw2) { showToast("Passwords don't match"); return; }
    const res = await setPassword(pw);
    if (!res.ok) { showToast(res.message || "Couldn't set that password"); return; }
    if (wasSetup) await updateDisplayName(name);
    authNewPassword = ""; authNewPasswordConfirm = ""; authDisplayName = ""; passwordScreenMode = null;
    if (wasSetup) location.hash = ""; // land on Home after finishing account setup
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

  if (t("[data-action='sign-out']")) {
    if (await showConfirm("Sign out of Forgebook?", { okLabel: "Sign out" })) {
      await signOutCloud();
      showToast("Signed out");
    }
    return;
  }

  const themeBtn = t("[data-set-theme]");
  if (themeBtn) {
    setThemePref(themeBtn.dataset.setTheme);
    render();
    return;
  }

  if (t("[data-action='sync-now']")) {
    const res = await loadBook();
    showToast(res.ok ? "Refreshed" : "Couldn't refresh — try again");
    return;
  }

  if (t("[data-action='save-display-name']")) {
    const input = document.getElementById("display-name-input");
    const res = await updateDisplayName(input ? input.value : "");
    showToast(res.ok ? "Display name saved" : res.message || "Couldn't save that");
    // Your own Profile page is served from profileCache, not getProfiles(),
    // so it won't pick up the change until that stale entry is dropped.
    if (res.ok) { delete profileCache[currentUserId()]; render(); }
    return;
  }

  // Checked ahead of data-nav below: this sits nested inside rows that are
  // themselves a data-nav link (e.g. a recipe's own paint row), so it has to
  // win the closest() race or the row's own navigation would fire instead.
  const findSimilar = t("[data-action='find-similar-colour']");
  if (findSimilar) {
    openSimilarColours(findSimilar.dataset.name, findSimilar.dataset.brand, findSimilar.dataset.hex);
    return;
  }

  const navEl = t("[data-nav]");
  if (navEl) {
    const route = navEl.dataset.nav;
    const id = navEl.dataset.id;
    if (route === "recipe" && id) navigate("recipe", { id, authorId: navEl.dataset.author || undefined, edit: navEl.dataset.edit === "1" });
    else if (route === "faction" && id) navigate("faction", { id });
    else if (route === "paint" && id) navigate("paint", { id });
    else if (route === "profile") navigate("profile", id ? { id } : {});
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

  const toggleSharedFilter = t("[data-action='toggle-shared-filter']");
  if (toggleSharedFilter) { state.includeShared = !state.includeShared; render(); return; }

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

  // --- admin: shared emblem, uploaded once for every user ---
  const adminEmblem = t("[data-action='admin-emblem']");
  if (adminEmblem) {
    document.getElementById("admin-emblem-input").click();
    return;
  }
  const adminEmblemClear = t("[data-action='admin-emblem-clear']");
  if (adminEmblemClear) {
    if (!(await showConfirm("Remove the shared emblem for this army? Everyone loses it, not just you.", { okLabel: "Remove" }))) return;
    const res = await removeGlobalFactionEmblem(adminEmblemClear.dataset.id);
    showToast(res.ok ? "Shared emblem removed" : (res.message || "Couldn't remove that"));
    if (res.ok) render();
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

  const avatarPick = t("[data-action='avatar-pick']");
  if (avatarPick) { document.getElementById("avatar-input").click(); return; }

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
    if (step) { step.mixPaintId = undefined; step.mixWantPaint = undefined; step.mixRatio = ""; render(); }
    return;
  }

  const togglePublished = t("[data-action='toggle-published']");
  if (togglePublished) { recipeForm.published = !recipeForm.published; render(); return; }

  // Add a paint to the rack without losing the half-written recipe
  const quickPaint = t("[data-action='quick-paint']");
  if (quickPaint) {
    initPaintForm(null);
    paintForm.returnToRecipe = quickPaint.dataset.stepId;
    navigate("paint-new");
    return;
  }

  const openPicker = t("[data-action='open-paint-picker']");
  if (openPicker) {
    openPaintPicker(openPicker.dataset.stepId, openPicker.dataset.field);
    return;
  }

  const openLightbox = t("[data-action='open-lightbox']");
  if (openLightbox) {
    showLightbox(openLightbox.dataset.photo);
    return;
  }

  const recipeCancel = t("[data-action='recipe-cancel']");
  if (recipeCancel) {
    const dirty = JSON.stringify(recipeForm) !== recipeFormSnapshot;
    if (dirty && !(await showConfirm("Discard your changes to this recipe?", { okLabel: "Discard", cancelLabel: "Keep editing" }))) {
      return;
    }
    const id = recipeForm.id;
    recipeForm = null;
    recipeFormSnapshot = null;
    navigate(id ? "recipe" : "home", id ? { id } : {});
    return;
  }

  const recipeSave = t("[data-action='recipe-save']");
  if (recipeSave) {
    if (!recipeForm.name.trim()) { showToast("Give the recipe a name first"); return; }
    const steps = recipeForm.steps.filter((s) => s.paintId || s.wantPaint);
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
    stamp(payload);
    payload.photoPath = recipeForm.photoPath || null;
    if (recipeForm.photo !== (recipeForm.originalPhoto || null)) payload.photoPath = null; // photo changed -> re-upload
    payload.published = !!recipeForm.published;
    if (isNew) payload.id = generateId(payload.faction);

    if (payload.photo && String(payload.photo).startsWith("data:")) {
      showToast("Uploading photo…");
      try {
        const path = await uploadRecipePhoto(payload.photo, currentUserId(), payload.id);
        payload.photoPath = path;
        payload.photo = photoUrl(path);
      } catch (e) {
        showToast("Couldn't upload that photo — try again");
        return;
      }
    }

    showToast("Saving…");
    const res = await pushRecipe(payload);
    if (!res.ok) { showToast(res.message); return; }

    const rows = getAllRecipeRows();
    if (isNew) {
      rows.unshift(payload);
    } else {
      const idx = rows.findIndex((r) => r.id === payload.id);
      if (idx > -1) rows[idx] = payload; else rows.unshift(payload);
    }
    save(KEYS.recipes, rows);

    recipeForm = null;
    recipeFormSnapshot = null;
    showToast("Recipe saved");
    navigate("recipe", { id: payload.id });
    return;
  }

  const delRecipe = t("[data-action='delete-recipe']");
  if (delRecipe) {
    if (await showConfirm("Delete this recipe? This cannot be undone.", { okLabel: "Delete" })) {
      const id = delRecipe.dataset.id;
      const res = await deleteRecipeRemote(id);
      if (!res.ok) { showToast(res.message); return; }
      save(KEYS.recipes, getAllRecipeRows().filter((r) => r.id !== id));
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

  const qtyDec = t("[data-action='paint-qty-dec']");
  if (qtyDec) {
    const id = qtyDec.dataset.id;
    const rows = getAllPaintRows();
    const row = rows.find((p) => p.id === id);
    if (!row) return;
    const next = (row.quantity || 1) - 1;
    if (next <= 0) {
      const n = paintUsageCount(id);
      const msg = n
        ? `This paint is used in ${n} recipe${n === 1 ? "" : "s"}. Removing it from your rack will leave those steps without a paint. Continue?`
        : `Remove ${qtyDec.dataset.name || "this paint"} from your rack?`;
      if (await showConfirm(msg)) {
        const res = await deletePaintRemote(id);
        if (!res.ok) { showToast(res.message); return; }
        save(KEYS.paints, rows.filter((p) => p.id !== id));
        showToast("Removed from rack");
        render();
      }
      return;
    }
    row.quantity = next;
    stamp(row);
    const res = await pushPaint(row);
    if (!res.ok) { showToast(res.message); return; }
    save(KEYS.paints, rows);
    render();
    return;
  }

  const qtyInc = t("[data-action='paint-qty-inc']");
  if (qtyInc) {
    const id = qtyInc.dataset.id;
    const rows = getAllPaintRows();
    const row = rows.find((p) => p.id === id);
    if (!row) return;
    row.quantity = (row.quantity || 1) + 1;
    stamp(row);
    const res = await pushPaint(row);
    if (!res.ok) { showToast(res.message); return; }
    save(KEYS.paints, rows);
    render();
    return;
  }

  const toggleHave = t("[data-action='toggle-have']");
  if (toggleHave) {
    const { name, brand, hex, type } = toggleHave.dataset;
    const res = await addPaintToRack({ name, brand, hex, type });
    if (!res.ok) { showToast(res.message); return; }
    showToast("Added to rack");
    render();
    return;
  }

  const paintAddToRack = t("[data-action='paint-add-to-rack']");
  if (paintAddToRack) {
    const { name, brand, hex, type } = paintAddToRack.dataset;
    const res = await addPaintToRack({ name, brand, hex, type });
    if (!res.ok) { showToast(res.message); return; }
    showToast("Added to rack");
    render();
    return;
  }

  const libFilter = t("[data-action='lib-filter']");
  if (libFilter) { state.paintLibFilter = libFilter.dataset.filter; render(); return; }

  const libBrand = t("[data-action='lib-brand']");
  if (libBrand) {
    const brand = libBrand.dataset.brand;
    if (!brand) state.paintLibBrands = [];
    else {
      const idx = state.paintLibBrands.indexOf(brand);
      if (idx > -1) state.paintLibBrands.splice(idx, 1); else state.paintLibBrands.push(brand);
    }
    render();
    return;
  }

  const libCategory = t("[data-action='lib-category']");
  if (libCategory) {
    const cat = libCategory.dataset.category;
    if (!cat) state.paintLibCategories = [];
    else {
      const idx = state.paintLibCategories.indexOf(cat);
      if (idx > -1) state.paintLibCategories.splice(idx, 1); else state.paintLibCategories.push(cat);
    }
    render();
    return;
  }

  const similarFilter = t("[data-action='similar-filter']");
  if (similarFilter) {
    if (!similarFilter.disabled) { similarColours.resultFilter = similarFilter.dataset.filter; render(); }
    return;
  }

  const libSort = t("[data-action='lib-sort']");
  if (libSort) { state.paintLibSort = libSort.dataset.sort; render(); return; }

  const openNotif = t("[data-action='open-notification']");
  if (openNotif) {
    const notifications = getNotifications();
    const n = notifications.find((x) => x.id === openNotif.dataset.id);
    if (n && !n.read) {
      n.read = true;
      save(KEYS.notifications, notifications);
      updateNotifBadge();
      markNotificationReadRemote(n.id); // fire-and-forget, like every other write in this app
    }
    if (openNotif.dataset.recipeId) {
      navigate("recipe", { id: openNotif.dataset.recipeId, authorId: openNotif.dataset.recipeOwner !== currentUserId() ? openNotif.dataset.recipeOwner : undefined });
    } else if (openNotif.dataset.paintName) {
      navigate("similar", { name: openNotif.dataset.paintName, brand: openNotif.dataset.paintBrand });
    } else {
      render();
    }
    return;
  }

  const markAllRead = t("[data-action='mark-all-read']");
  if (markAllRead) {
    save(KEYS.notifications, getNotifications().map((n) => ({ ...n, read: true })));
    render();
    markAllNotificationsReadRemote(); // fire-and-forget
    return;
  }

  const searchTab = t("[data-action='search-tab']");
  if (searchTab) { globalSearch.tab = searchTab.dataset.tab; render(); return; }

  const rateBtn = t("[data-action='rate-paint']");
  if (rateBtn) {
    if (!isSignedIn()) { showToast("Sign in to rate paints"); return; }
    ratePaint(similarColours.sourceName, similarColours.sourceBrand, Number(rateBtn.dataset.value));
    render();
    return;
  }

  const submitNote = t("[data-action='submit-note']");
  if (submitNote) {
    const body = (communityNoteForm.body || "").trim();
    if (!body) { showToast("Write a note first"); return; }
    const key = paintKey(similarColours.sourceName, similarColours.sourceBrand);
    const res = await pushPaintNote(key, body);
    if (!res.ok) { showToast(res.message); return; }
    const now = new Date().toISOString();
    paintNotesCache[key] = (paintNotesCache[key] || []).concat({
      id: res.note.id, paintKey: key, userId: currentUserId(), body: res.note.body,
      flagged: res.note.flagged, status: "visible", createdAt: now, updatedAt: now, deleted: false,
    });
    communityNoteForm = { body: "" };
    showToast("Note posted");
    render();
    return;
  }

  const reportBtn = t("[data-action='report']");
  if (reportBtn) {
    if (!isSignedIn()) { showToast("Sign in to report content"); return; }
    const { kind, id } = reportBtn.dataset;
    const reason = await showReportDialog(kind);
    if (reason === null) return;
    const res = await reportContent(kind === "comment" ? "recipe_comment" : "paint_note", id, reason);
    showToast(res.ok ? (res.alreadyReported ? "You've already reported this" : "Reported — thanks for flagging this") : res.message);
    return;
  }

  const submitComment = t("[data-action='submit-comment']");
  if (submitComment) {
    const body = (commentForm.body || "").trim();
    if (!body) { showToast("Write a comment first"); return; }
    const { ownerId, recipeId } = submitComment.dataset;
    const key = ownerId + "|" + recipeId;
    if (commentForm.editingId) {
      const editingId = commentForm.editingId;
      const res = await editCommentRemote(editingId, body);
      if (!res.ok) { showToast(res.message); return; }
      const row = (commentsCache[key] || []).find((c) => c.id === editingId);
      if (row) { row.body = body; row.edited = true; row.flagged = containsBlockedContent(body); }
    } else {
      const res = await submitCommentRemote(ownerId, recipeId, body);
      if (!res.ok) { showToast(res.message); return; }
      const now = new Date().toISOString();
      commentsCache[key] = (commentsCache[key] || []).concat({
        id: res.comment.id, recipeOwnerId: ownerId, recipeId, userId: currentUserId(), body: res.comment.body,
        edited: false, flagged: res.comment.flagged, status: "visible", createdAt: now, updatedAt: now, deleted: false,
      });
    }
    commentForm = { body: "", editingId: null };
    render();
    return;
  }

  const replyComment = t("[data-action='reply-comment']");
  if (replyComment) {
    commentForm.body = `@${authorName(replyComment.dataset.userId)} `;
    render();
    document.getElementById("comment-input")?.focus();
    return;
  }

  const editComment = t("[data-action='edit-comment']");
  if (editComment) {
    commentForm = { body: editComment.dataset.body, editingId: editComment.dataset.id };
    render();
    document.getElementById("comment-input")?.focus();
    return;
  }

  const deleteComment = t("[data-action='delete-comment']");
  if (deleteComment) {
    if (!(await showConfirm("Delete this comment?"))) return;
    const id = deleteComment.dataset.id;
    const res = await removeCommentRemote(id);
    if (!res.ok) { showToast(res.message || "Couldn't delete that — try again."); return; }
    Object.keys(commentsCache).forEach((key) => {
      commentsCache[key] = (commentsCache[key] || []).filter((c) => c.id !== id);
    });
    render();
    return;
  }

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
    let row;
    if (paintForm.id) {
      row = stamp({ id: paintForm.id, name: paintForm.name.trim(), brand: paintForm.brand, hex: paintForm.hex, type: paintForm.type });
    } else {
      savedId = "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      row = stamp({ id: savedId, name: paintForm.name.trim(), brand: paintForm.brand, hex: paintForm.hex, type: paintForm.type });
    }

    showToast("Saving…");
    const res = await pushPaint(row);
    if (!res.ok) { showToast(res.message); return; }

    const rows = getAllPaintRows();
    if (paintForm.id) {
      const idx = rows.findIndex((p) => p.id === paintForm.id);
      if (idx > -1) rows[idx] = row; else rows.push(row);
    } else {
      rows.push(row);
    }
    save(KEYS.paints, rows);
    paintForm = null;
    showToast("Paint saved");

    // came from a recipe step? drop the new paint straight into it
    if (returnStep !== undefined && recipeForm) {
      const step = recipeForm.steps.find((s) => s.id === returnStep);
      if (step) { step.paintId = savedId; step.wantPaint = undefined; }
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
    if (await showConfirm(msg, { okLabel: "Remove" })) {
      const id = delPaint.dataset.id;
      const res = await deletePaintRemote(id);
      if (!res.ok) { showToast(res.message); return; }
      save(KEYS.paints, getAllPaintRows().filter((p) => p.id !== id));
      showToast("Paint removed");
      navigate("paints");
    }
    return;
  }

  // --- settings ---
  if (t("[data-action='print']")) { window.print(); return; }

  const shareRecipe = t("[data-action='share-recipe']");
  if (shareRecipe) {
    const foreignAuthorId = shareRecipe.dataset.authorId || null;
    const r = findRecipe(shareRecipe.dataset.id, foreignAuthorId);
    if (!r) return;
    const authorId = foreignAuthorId || currentUserId();

    // Only an own, not-yet-published recipe needs this — a shared recipe is
    // published by definition (that's the only way it could be showing here
    // at all), so there's nothing to flip for someone else's row.
    if (!foreignAuthorId && !r.published) {
      showToast("Publishing recipe…");
      r.published = true;
      stamp(r);
      const res = await pushRecipe(r);
      if (!res.ok) { r.published = false; showToast(res.message); return; }
      const rows = getAllRecipeRows();
      const idx = rows.findIndex((x) => x.id === r.id);
      if (idx > -1) rows[idx] = r;
      save(KEYS.recipes, rows);
    }

    const f = faction(r.faction);
    const usedPaints = recipePaints(r);
    const cardSteps = (r.steps || []).map((s) => {
      const p = resolveStepPaint(r, s, "paintId");
      return { technique: s.technique, paintName: p ? p.name : "(paint deleted)", hex: p ? p.hex : f.color };
    });
    const canvas = drawShareCardCanvas(r, f, usedPaints, cardSteps);
    const shareUrl = `https://forgebook.co.uk/#/r/${encodeURIComponent(authorId)}/${encodeURIComponent(r.id)}`;

    canvas.toBlob(async (blob) => {
      if (!blob) { showToast("Couldn't generate the share image — try again."); return; }
      const fileName = `${slug(r.name)}.png`;
      const shareText = `${r.name} — a Forgebook paint recipe. ${shareUrl}`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: r.name, text: shareText });
          return;
        } catch (e) {
          if (e && e.name === "AbortError") return; // user backed out of the share sheet
          // anything else: fall through to the download fallback below
        }
      }

      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objUrl);

      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Image saved, link copied — paste both into your post");
      } catch (e) {
        showToast("Image saved — copy the link from the recipe page to include it");
      }
    }, "image/png");

    render();
    return;
  }

  if (t("[data-action='export']")) {
    const payload = {
      forgebook: BACKUP_FORMAT_VERSION,
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

  if (t("[data-action='import']")) { document.getElementById("import-input").click(); return;
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

  if (e.target.id === "avatar-input") {
    const file = e.target.files[0];
    if (!file) return;
    downscaleImageSquare(file, 240, async (url) => {
      if (!url) { showToast("That image could not be read"); return; }
      showToast("Uploading…");
      try {
        const path = await uploadAvatar(url, currentUserId());
        const profiles = getProfiles();
        const idx = profiles.findIndex((p) => p.userId === currentUserId());
        const row = { userId: currentUserId(), displayName: authorName(currentUserId()), avatarUrl: avatarUrl(path) };
        if (idx === -1) profiles.push(row); else profiles[idx] = { ...profiles[idx], avatarUrl: row.avatarUrl };
        save(KEYS.profiles, profiles);
        // Same staleness issue as save-display-name -- your own Profile page
        // reads profileCache, not getProfiles(), so it needs dropping too.
        delete profileCache[currentUserId()];
        showToast("Profile picture updated");
        render();
      } catch (err) {
        showToast("Couldn't upload that — try again");
      }
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

  if (e.target.id === "admin-emblem-input") {
    const file = e.target.files[0];
    if (!file) return;
    const factionId = state.params.id;
    downscaleImage(file, 480, async (url) => {
      if (!url) { showToast("That image could not be read"); return; }
      showToast("Uploading…");
      const res = await uploadGlobalFactionEmblem(factionId, url);
      showToast(res.ok ? "Shared emblem updated for everyone" : (res.message || "Couldn't upload that"));
      if (res.ok) render();
    });
    return;
  }

  if (e.target.id === "import-input") {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.recipes)) throw new Error("bad format");
        showToast("Importing…");
        const paints = Array.isArray(data.paints) ? data.paints : [];
        for (const p of paints) await pushPaint(p);
        for (const r of data.recipes) await pushRecipe(r);
        if (data.factionArt) saveFactionArt(data.factionArt);
        await loadBook();
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
  if (e.target.id === "search-input") { runGlobalSearch(e.target.value); return; }
  if (e.target.id === "note-input") {
    communityNoteForm.body = e.target.value;
    render();
    return;
  }
  if (e.target.id === "comment-input") {
    commentForm.body = e.target.value;
    render();
    return;
  }
  if (e.target.id === "profile-search-input") {
    profileSearch.query = e.target.value;
    clearTimeout(profileSearchDebounce);
    const q = e.target.value.trim();
    if (!q) { profileSearch.results = []; render(); return; }
    profileSearchDebounce = setTimeout(() => {
      searchProfiles(q).then((results) => {
        // Stale response from a query that's since been superseded by more typing.
        if (profileSearch.query.trim() !== q) return;
        profileSearch.results = results;
        render();
      });
    }, 250);
  }
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
  // Nav buttons are static markup built once here at boot, not re-rendered
  // per route -- the profile button's own id has to be baked in now rather
  // than read off state, since it's always "my own profile" regardless of
  // whatever else is on screen.
  const navIdAttr = (route) => (route === "profile" ? ` data-id="${escapeHtml(currentUserId())}"` : "");
  document.getElementById("app").innerHTML = `
    <nav class="side-nav">
      <div class="side-nav__brand">${icon("book", 20)} Forgebook</div>
      ${NAV_ITEMS.map((n) => `
        <button class="side-nav__item" data-nav="${n.route}" data-route="${n.route}"${navIdAttr(n.route)}>
          ${icon(n.icon, 18)} ${n.label}
        </button>`).join("")}
    </nav>
    <header class="topbar">
      <div class="topbar__brand"><span class="glyph">${icon("book", 16)}</span> Forgebook</div>
      <div class="topbar__search">
        ${icon("search", 16)}
        <input type="text" id="search-input" placeholder="Search recipes, armies or paints" />
      </div>
      <button class="topbar__bell" data-nav="notifications" aria-label="Notifications">
        ${icon("bell", 18)}
        <span class="topbar__bell-badge hidden" id="notif-badge"></span>
      </button>
      <div class="sync-pill hidden" id="sync-pill"></div>
    </header>
    <main id="view-root"></main>
    <button class="fab" id="fab" data-nav="recipe-new" aria-label="Add recipe">${icon("plus", 24)}</button>
    <nav class="bottom-nav">
      ${NAV_ITEMS.map((n) => `
        <button class="bottom-nav__item" data-nav="${n.route}" data-route="${n.route}"${navIdAttr(n.route)}>
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
// An account is required for everything past this point -- the gate is hard,
// with no local/offline escape hatch.
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

        ${isSetup ? `
        <div class="field gate__field" style="margin-top:20px">
          <label>Display name</label>
          <input type="text" id="auth-display-name" placeholder="What should we call you?" value="${escapeHtml(authDisplayName)}" autocomplete="nickname" />
          <div class="label-hint" style="margin-top:4px">Shown as the author on any recipe you share.</div>
        </div>
        ` : ""}
        <div class="field gate__field" style="margin-top:${isSetup ? "0" : "20px"}">
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
  if (isSignedIn()) { bootIntoApp(); return; }
  showGate();
}

// Commit to the full app: fetch the account's book, then build the shell,
// route, and render — the point of no return past which the gate can't
// reappear this session (short of signing out).
//
// bootingIntoApp guards the gap while loadBook() is in flight: appBooted
// itself doesn't flip true until the shell actually exists, because loadBook()
// calls render() (to reflect its own loading state), and render() trusts
// appBooted as its signal that #view-root is safe to touch. Without a
// separate in-flight guard, any render() during that gap (loadBook's own, or
// a re-entrant decideBootState() from the SIGNED_IN listener) would see
// appBooted still false, call decideBootState() again, and call
// bootIntoApp() a second time.
let bootingIntoApp = false;
async function bootIntoApp() {
  if (appBooted || bootingIntoApp) return;
  bootingIntoApp = true;
  showBootSplash();
  await loadBook();
  bootingIntoApp = false;
  appBooted = true;
  buildShell();
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;
  render();
  registerServiceWorker();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("service-worker.js").then((reg) => {
    // Don't just wait for the browser's own (slow, heuristic) background
    // check — ask right now, so a device that already has the app installed
    // gets fresh code promptly rather than whenever the browser next feels
    // like checking.
    reg.update().catch(() => {});
  }).catch(() => {});

  // service-worker.js calls skipWaiting()+clients.claim(), so a new worker
  // takes over immediately — but this tab's already-running JS is still the
  // old version until it reloads. Without this, "the SW updated" and "the
  // page you're looking at updated" are two different things.
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    location.reload();
  });
}

async function init() {
  showBootSplash();

  // The persisted-session check is local (no network round trip unless a
  // token needs refreshing), so this resolves fast — but we still wait for
  // it rather than guessing, since guessing wrong is exactly the flash we're
  // trying to avoid.
  await initCloud();

  // A public share link bypasses the sign-in gate entirely — see
  // renderPublicRecipe/fetchPublicRecipe — since the whole point is that a
  // visitor with no Forgebook account can open it.
  const { route, params } = parseHash();
  if (route === "public-recipe") { renderPublicRecipe(params); return; }
  // See the matching comment on the hashchange listener — this only bypasses
  // decideBootState() for a genuinely signed-out visitor.
  if (route === "profile" && params.id && !isSignedIn()) { renderPublicProfile(params.id); return; }

  decideBootState();
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
});

document.addEventListener("DOMContentLoaded", init);
