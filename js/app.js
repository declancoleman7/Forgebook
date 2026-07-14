// Forgebook — main app logic (vanilla JS, no framework)

const ICONS = {
  home: '<path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" /><path d="M18 4v16" />',
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
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

const NAV_ITEMS = [
  { route: "home", label: "Home", icon: "home" },
  { route: "recipes", label: "Recipes", icon: "book" },
  { route: "paints", label: "Paints", icon: "palette" },
  { route: "settings", label: "Settings", icon: "settings" },
];

let state = {
  route: "home",
  params: {},
  factionFilter: null,
  searchQuery: "",
};

function getRecipes() {
  try {
    return JSON.parse(localStorage.getItem("forgebook.recipes")) || [];
  } catch (e) {
    return [];
  }
}

function saveRecipes(recipes) {
  try {
    localStorage.setItem("forgebook.recipes", JSON.stringify(recipes));
    return true;
  } catch (e) {
    // Almost always QuotaExceededError — photos are the usual culprit.
    return false;
  }
}

// Downscale a photo to a phone-friendly JPEG data URL (~50-150KB) so
// dozens of recipes with photos still fit comfortably in localStorage.
function downscalePhoto(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const MAX = 900;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
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

function getRecents() {
  try {
    return JSON.parse(localStorage.getItem("forgebook.recents")) || [];
  } catch (e) {
    return [];
  }
}

function pushRecent(id) {
  let recents = getRecents().filter((r) => r !== id);
  recents.unshift(id);
  recents = recents.slice(0, 8);
  localStorage.setItem("forgebook.recents", JSON.stringify(recents));
}

function findRecipe(id) {
  return getRecipes().find((r) => r.id === id);
}

function difficultyDots(level, max = 5) {
  let out = "";
  for (let i = 1; i <= max; i++) {
    out += `<span class="${i <= level ? "is-filled" : ""}"></span>`;
  }
  return `<span class="difficulty">${out}</span>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

// ---------------------------------------------------------------
// Router
// ---------------------------------------------------------------
function navigate(route, params = {}) {
  state.route = route;
  state.params = params;
  const hash = "#/" + route + (params.id ? "/" + params.id : "") + (params.edit ? "/edit" : "");
  if (location.hash !== hash) location.hash = hash;
  render();
  window.scrollTo(0, 0);
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts.length === 0) return { route: "home", params: {} };
  if (parts[0] === "recipe" && parts[1]) {
    return { route: "recipe", params: { id: parts[1], edit: parts[2] === "edit" } };
  }
  if (parts[0] === "recipe-new") {
    return { route: "recipe-new", params: {} };
  }
  return { route: parts[0], params: {} };
}

window.addEventListener("hashchange", () => {
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;
  render();
});

// ---------------------------------------------------------------
// Filtered recipe list (shared by the Recipes view and swipe order)
// ---------------------------------------------------------------
function getFilteredRecipes() {
  let recipes = getRecipes();
  if (state.factionFilter) {
    recipes = recipes.filter((r) => r.faction === state.factionFilter);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    recipes = recipes.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.paints || []).some((p) => p.name.toLowerCase().includes(q))
    );
  }
  return recipes;
}

// ---------------------------------------------------------------
// Swipe between recipes (detail page)
// ---------------------------------------------------------------
// Set just before a swipe-driven navigation so render() can animate the
// incoming page from the correct side. "left" = user swiped left = next.
let swipeDirection = null;

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
  const continueRecipe = recents[0] || recipes[0];
  const recentList = recents.slice(0, 4);

  return `
    <div class="page-enter">
      ${continueRecipe ? `
        <div class="section-label">Continue Painting</div>
        <div class="continue-card" data-nav="recipe" data-id="${continueRecipe.id}">
          <div class="continue-card__hero ${continueRecipe.photo ? "has-photo" : ""}"${continueRecipe.photo ? ` style="background-image:url('${continueRecipe.photo}')"` : ""}>${continueRecipe.photo ? "" : (continueRecipe.heroEmoji || "\u{1F3A8}")}</div>
          <div class="continue-card__body">
            <div class="continue-card__eyebrow">${continueRecipe.id}</div>
            <div class="continue-card__title">${escapeHtml(continueRecipe.name)}</div>
          </div>
          <div class="continue-card__chevron">${icon("chevron", 20)}</div>
        </div>
      ` : ""}

      <div class="section-label">Browse by Faction</div>
      <div class="faction-row">
        ${FACTIONS.map((f) => `
          <div class="faction-chip" data-faction-goto="${f.id}" style="--chip-color:${f.color}">
            <span class="faction-chip__dot" style="background:${f.color}"></span>
            ${escapeHtml(f.label)}
          </div>
        `).join("")}
      </div>

      <div class="section-label">Recent Recipes</div>
      ${recentList.length ? `
        <div class="recipe-grid">
          ${recentList.map(recipeCardHtml).join("")}
        </div>
      ` : emptyStateHtml("\u{1F4D6}", "No recipes yet", "Tap the + button to record your first paint recipe.")}
    </div>
  `;
}

function recipeCardHtml(r) {
  const fac = faction(r.faction);
  const stackColors = (r.steps || []).slice(0, 5).map((s) => {
    const p = (r.paints || []).find((pp) => pp.id === s.paintId);
    return p ? p.hex : fac.color;
  });
  return `
    <div class="recipe-card" data-nav="recipe" data-id="${r.id}" style="--faction-color:${fac.color}">
      <div class="recipe-card__hero ${r.photo ? "has-photo" : ""}"${r.photo ? ` style="background-image:url('${r.photo}')"` : ""}>
        ${r.photo ? "" : (r.heroEmoji || "\u{1F3A8}")}
        <div class="recipe-card__stack">
          ${stackColors.map((c) => `<span style="background:${c}"></span>`).join("")}
        </div>
      </div>
      <div class="recipe-card__body">
        <div class="recipe-card__id">${r.id}</div>
        <div class="recipe-card__name">${escapeHtml(r.name)}</div>
        <div class="recipe-card__meta">
          ${difficultyDots(r.difficulty || 1)}
          <span>${fac.glyph}</span>
        </div>
      </div>
    </div>
  `;
}

function emptyStateHtml(glyph, title, sub) {
  return `
    <div class="empty-state">
      <div class="empty-state__glyph">${glyph}</div>
      <div class="empty-state__title">${escapeHtml(title)}</div>
      <div class="empty-state__sub">${escapeHtml(sub)}</div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Recipes list
// ---------------------------------------------------------------
function viewRecipes() {
  const recipes = getFilteredRecipes();

  return `
    <div class="page-enter">
      <div class="page-title">Recipes</div>
      <div class="faction-row" style="margin-bottom:18px">
        <div class="faction-chip ${!state.factionFilter ? "is-active" : ""}" data-faction-filter="">
          All
        </div>
        ${FACTIONS.map((f) => `
          <div class="faction-chip ${state.factionFilter === f.id ? "is-active" : ""}" data-faction-filter="${f.id}" style="--chip-color:${f.color}">
            <span class="faction-chip__dot" style="background:${f.color}"></span>
            ${escapeHtml(f.label)}
          </div>
        `).join("")}
      </div>
      ${recipes.length ? `
        <div class="recipe-grid">
          ${recipes.map(recipeCardHtml).join("")}
        </div>
      ` : emptyStateHtml("\u{1F50D}", "No matches", "Try a different faction or search term.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Recipe detail
// ---------------------------------------------------------------
function viewRecipeDetail(id) {
  const r = findRecipe(id);
  if (!r) return emptyStateHtml("\u26A0\uFE0F", "Recipe not found", "It may have been deleted.");
  pushRecent(id);
  const fac = faction(r.faction);

  const siblings = getFilteredRecipes();
  const idx = siblings.findIndex((s) => s.id === r.id);
  const swipeCls = swipeDirection === "left" ? "swipe-in-left" : swipeDirection === "right" ? "swipe-in-right" : "";

  return `
    <div class="page-enter ${swipeCls}" data-swipe-page>
      <div class="detail-header">
        <button class="icon-btn" data-nav="recipes">${icon("back", 18)}</button>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" data-nav="recipe" data-id="${r.id}" data-edit="1">${icon("edit", 16)}</button>
          <button class="icon-btn" data-action="delete" data-id="${r.id}">${icon("trash", 16)}</button>
        </div>
      </div>

      <div class="detail-hero ${r.photo ? "has-photo" : ""}" style="--faction-color:${fac.color}${r.photo ? `;background-image:url('${r.photo}')` : ""}">${r.photo ? "" : (r.heroEmoji || "\u{1F3A8}")}</div>

      ${idx > -1 && siblings.length > 1 ? `
        <div class="detail-pager">
          <button class="icon-btn" data-swipe="prev" ${idx === 0 ? "disabled" : ""} aria-label="Previous recipe">${icon("back", 16)}</button>
          <span>${idx + 1} of ${siblings.length} &middot; swipe to browse</span>
          <button class="icon-btn" data-swipe="next" ${idx === siblings.length - 1 ? "disabled" : ""} aria-label="Next recipe">${icon("chevron", 16)}</button>
        </div>
      ` : ""}

      <span class="detail-id">${r.id}</span>
      <div class="detail-title">${escapeHtml(r.name)}</div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <div class="detail-faction-tag" style="border-color:${fac.color}66">
          <span class="faction-chip__dot" style="background:${fac.color}"></span>
          ${escapeHtml(fac.label)}
        </div>
        <div class="detail-faction-tag">${difficultyDots(r.difficulty || 1)}</div>
      </div>

      <div class="section-label">Paints</div>
      <div class="paint-list">
        ${(r.paints || []).map((p) => `
          <div class="paint-row">
            <div class="paint-row__swatch" style="background:${p.hex}"></div>
            <div>
              <div class="paint-row__name">${escapeHtml(p.name)}</div>
              <div class="paint-row__brand">${escapeHtml(p.brand || "")}</div>
            </div>
            <div class="paint-row__hex">${p.hex}</div>
          </div>
        `).join("") || `<div class="empty-state__sub">No paints listed.</div>`}
      </div>

      <div class="section-label">Method</div>
      <div class="layer-stack">
        ${(r.steps || []).map((s, i) => {
          const p = (r.paints || []).find((pp) => pp.id === s.paintId);
          return `
            <div class="layer-stack__row">
              <div class="layer-stack__num">${i + 1}</div>
              <div class="layer-stack__swatch" style="background:${p ? p.hex : fac.color}"></div>
              <div class="layer-stack__content">
                <div class="layer-stack__top">
                  <span class="layer-stack__technique">${escapeHtml(s.technique)}</span>
                  <span class="layer-stack__paint">${p ? escapeHtml(p.name) : ""}</span>
                </div>
                ${s.notes ? `<div class="layer-stack__notes">${escapeHtml(s.notes)}</div>` : ""}
              </div>
            </div>
          `;
        }).join("") || `<div class="empty-state__sub">No steps recorded.</div>`}
      </div>

      ${r.notes ? `
        <div class="section-label">Notes</div>
        <div class="notes-block">${escapeHtml(r.notes)}</div>
      ` : ""}

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-action="print" data-id="${r.id}">Print Recipe</button>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Paints library
// ---------------------------------------------------------------
function viewPaints() {
  const recipes = getRecipes();
  const map = new Map();
  recipes.forEach((r) => {
    (r.paints || []).forEach((p) => {
      const key = p.name.toLowerCase() + "|" + (p.brand || "");
      if (!map.has(key)) {
        map.set(key, { ...p, count: 0 });
      }
      map.get(key).count++;
    });
  });
  const paints = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));

  return `
    <div class="page-enter">
      <div class="page-title">Paint Library</div>
      ${paints.length ? paints.map((p) => `
        <div class="paint-lib-row">
          <div class="paint-row__swatch" style="background:${p.hex}"></div>
          <div>
            <div class="paint-row__name">${escapeHtml(p.name)}</div>
            <div class="paint-row__brand">${escapeHtml(p.brand || "")}</div>
          </div>
          <div class="paint-lib-row__count">${p.count} recipe${p.count === 1 ? "" : "s"}</div>
        </div>
      `).join("") : emptyStateHtml("\u{1F3A8}", "No paints yet", "Paints you add to recipes will appear here.")}
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Settings
// ---------------------------------------------------------------
function viewSettings() {
  return `
    <div class="page-enter">
      <div class="page-title">Settings</div>

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
            <div class="settings-row__desc">Download all recipes as a JSON backup file.</div>
          </div>
          <button class="icon-btn" data-action="export">${icon("download", 16)}</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Import data</div>
            <div class="settings-row__desc">Restore recipes from a JSON backup file.</div>
          </div>
          <button class="icon-btn" data-action="import">${icon("upload", 16)}</button>
          <input type="file" id="import-input" accept="application/json" class="hidden" />
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Reset to sample data</div>
            <div class="settings-row__desc">Erase everything and reload the starter recipes.</div>
          </div>
          <button class="btn btn-danger" data-action="reset">Reset</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-row">
          <div>
            <div class="settings-row__label">Forgebook</div>
            <div class="settings-row__desc">Version 0.3 &middot; Recipe Book &middot; Works offline</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// View: Add / Edit recipe form
// ---------------------------------------------------------------
let formState = null;

function newPaintEntry() {
  return { id: "np" + Math.random().toString(36).slice(2, 9), name: "", brand: "", hex: "#c9a227" };
}

function newStepEntry() {
  return { id: "ns" + Math.random().toString(36).slice(2, 9), technique: TECHNIQUES[0], paintId: "", notes: "" };
}

function initFormState(existing) {
  if (existing) {
    formState = JSON.parse(JSON.stringify(existing));
  } else {
    formState = {
      id: null,
      name: "",
      faction: FACTIONS[0].id,
      difficulty: 2,
      heroEmoji: "\u{1F3A8}",
      photo: null,
      paints: [newPaintEntry()],
      steps: [newStepEntry()],
      notes: "",
    };
  }
}

function generateId(facId) {
  const prefixMap = { orks: "ORK", "space-marines": "SM", chaos: "CSM", tyranids: "TYR", generic: "REC" };
  const prefix = prefixMap[facId] || "REC";
  const existing = getRecipes().filter((r) => r.id.startsWith(prefix));
  let n = existing.length + 1;
  let id = `${prefix}-${String(n).padStart(3, "0")}`;
  while (getRecipes().some((r) => r.id === id)) {
    n++;
    id = `${prefix}-${String(n).padStart(3, "0")}`;
  }
  return id;
}

function viewRecipeForm(isEdit) {
  const fac = faction(formState.faction);
  return `
    <div class="page-enter">
      <div class="detail-header">
        <button class="icon-btn" data-action="form-cancel">${icon("back", 18)}</button>
        <div class="page-title" style="margin:0">${isEdit ? "Edit Recipe" : "New Recipe"}</div>
        <div style="width:36px"></div>
      </div>

      <div class="field">
        <label>Recipe name</label>
        <input type="text" id="f-name" value="${escapeHtml(formState.name)}" placeholder="e.g. Ork Boyz Skin" />
      </div>

      <div class="field">
        <label>Faction</label>
        <div class="faction-picker">
          ${FACTIONS.map((f) => `
            <button type="button" data-set-faction="${f.id}" class="${formState.faction === f.id ? "is-selected" : ""}" style="--picker-color:${f.color}">
              <span class="dot" style="background:${f.color}"></span>${escapeHtml(f.label)}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="field">
        <label>Difficulty</label>
        <div class="difficulty-picker">
          ${[1, 2, 3, 4, 5].map((n) => `
            <button type="button" data-set-difficulty="${n}" class="${formState.difficulty === n ? "is-selected" : ""}">${n}</button>
          `).join("")}
        </div>
      </div>

      <div class="field">
        <label>Hero emoji (shown on card)</label>
        <input type="text" id="f-emoji" value="${escapeHtml(formState.heroEmoji)}" maxlength="4" style="width:80px; text-align:center; font-size:20px;" />
      </div>

      <div class="field">
        <label>Photo of the finished mini (optional, replaces the emoji)</label>
        <div class="photo-field">
          ${formState.photo ? `
            <div class="photo-field__preview" style="background-image:url('${formState.photo}')"></div>
            <button type="button" class="btn btn-ghost" data-action="photo-pick">Replace</button>
            <button type="button" class="btn btn-danger" data-action="photo-remove">Remove</button>
          ` : `
            <button type="button" class="repeater-add" style="margin:0" data-action="photo-pick">+ Add photo</button>
          `}
          <input type="file" id="photo-input" accept="image/*" class="hidden" />
        </div>
      </div>

      <div class="section-label">Paints</div>
      ${formState.paints.map((p, i) => `
        <div class="repeater-item">
          ${formState.paints.length > 1 ? `<button type="button" class="repeater-item__remove" data-remove-paint="${p.id}">&times;</button>` : ""}
          <div class="field" style="margin-bottom:10px;">
            <label>Paint name</label>
            <input type="text" data-paint-field="name" data-paint-id="${p.id}" value="${escapeHtml(p.name)}" placeholder="e.g. Warboss Green" />
          </div>
          <div class="field" style="margin-bottom:10px;">
            <label>Brand</label>
            <input type="text" data-paint-field="brand" data-paint-id="${p.id}" value="${escapeHtml(p.brand)}" placeholder="e.g. Citadel" />
          </div>
          <div class="field" style="margin-bottom:0;">
            <label>Colour</label>
            <div class="field-hex-row">
              <input type="color" data-paint-field="hex" data-paint-id="${p.id}" value="${p.hex}" />
              <span class="paint-row__hex">${p.hex}</span>
            </div>
          </div>
        </div>
      `).join("")}
      <button type="button" class="repeater-add" data-action="add-paint">+ Add paint</button>

      <div class="section-label">Method steps</div>
      ${formState.steps.map((s, i) => `
        <div class="repeater-item">
          ${formState.steps.length > 1 ? `<button type="button" class="repeater-item__remove" data-remove-step="${s.id}">&times;</button>` : ""}
          <div class="field" style="margin-bottom:10px;">
            <label>Technique</label>
            <select data-step-field="technique" data-step-id="${s.id}">
              ${TECHNIQUES.map((t) => `<option value="${t}" ${s.technique === t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="margin-bottom:10px;">
            <label>Paint used</label>
            <select data-step-field="paintId" data-step-id="${s.id}">
              <option value="">\u2014 choose a paint \u2014</option>
              ${formState.paints.filter((p) => p.name).map((p) => `<option value="${p.id}" ${s.paintId === p.id ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
            </select>
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
        <textarea id="f-notes" placeholder="Variations, tips, anything worth remembering">${escapeHtml(formState.notes)}</textarea>
      </div>

      <div class="detail-actions">
        <button class="btn btn-ghost btn-block" data-action="form-cancel">Cancel</button>
        <button class="btn btn-primary btn-block" data-action="form-save">Save recipe</button>
      </div>
    </div>
  `;
}

// Rebuild each step's "paint used" <select> options in place (no full
// re-render) so typing a paint name updates the dropdown live without
// stealing focus from the field being typed into.
function syncStepPaintOptions(root) {
  const namedPaints = formState.paints.filter((p) => p.name.trim());
  root.querySelectorAll("select[data-step-field='paintId']").forEach((sel) => {
    const stepId = sel.dataset.stepId;
    const step = formState.steps.find((s) => s.id === stepId);
    const currentValue = step ? step.paintId : "";
    const stillValid = namedPaints.some((p) => p.id === currentValue);
    sel.innerHTML =
      `<option value="">\u2014 choose a paint \u2014</option>` +
      namedPaints.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    sel.value = stillValid ? currentValue : "";
    if (step && !stillValid) step.paintId = "";
  });
}

function bindFormEvents(root) {
  const nameEl = root.querySelector("#f-name");
  if (nameEl) nameEl.oninput = (e) => { formState.name = e.target.value; };
  const emojiEl = root.querySelector("#f-emoji");
  if (emojiEl) emojiEl.oninput = (e) => { formState.heroEmoji = e.target.value; };
  const notesEl = root.querySelector("#f-notes");
  if (notesEl) notesEl.oninput = (e) => { formState.notes = e.target.value; };

  root.querySelectorAll("[data-paint-field]").forEach((el) => {
    el.oninput = (e) => {
      const paint = formState.paints.find((p) => p.id === e.target.dataset.paintId);
      if (!paint) return;
      paint[e.target.dataset.paintField] = e.target.value;
      if (e.target.dataset.paintField === "hex") {
        const hexLabel = e.target.parentElement.querySelector(".paint-row__hex");
        if (hexLabel) hexLabel.textContent = e.target.value;
      }
      if (e.target.dataset.paintField === "name") {
        syncStepPaintOptions(root);
      }
    };
  });

  root.querySelectorAll("[data-step-field]").forEach((el) => {
    el.oninput = el.onchange = (e) => {
      const step = formState.steps.find((s) => s.id === e.target.dataset.stepId);
      if (!step) return;
      step[e.target.dataset.stepField] = e.target.value;
    };
  });
}

// ---------------------------------------------------------------
// Render
// ---------------------------------------------------------------
function render() {
  const { route, params } = state;
  const root = document.getElementById("view-root");
  const isWide = window.innerWidth >= 860;

  let html = "";
  let showFab = true;

  if (route === "home") html = viewHome();
  else if (route === "recipes") html = viewRecipes();
  else if (route === "recipe" && params.edit) {
    // Only (re)initialise when entering the edit screen for this recipe —
    // in-form re-renders (faction picker, photo, add paint…) must keep
    // the unsaved formState.
    if (!formState || formState.id !== params.id) initFormState(findRecipe(params.id));
    html = viewRecipeForm(true);
    showFab = false;
  } else if (route === "recipe") {
    html = viewRecipeDetail(params.id);
    showFab = false;
  } else if (route === "recipe-new") {
    if (!formState || formState.id !== null) initFormState(null);
    html = viewRecipeForm(false);
    showFab = false;
  } else if (route === "paints") html = viewPaints();
  else if (route === "settings") html = viewSettings();
  else html = viewHome();

  root.innerHTML = html;
  swipeDirection = null; // one-shot: only the render triggered by a swipe animates directionally
  bindFormEvents(root);

  document.querySelectorAll(".bottom-nav__item, .side-nav__item").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.route === route || (el.dataset.route === "recipes" && route === "recipe"));
  });

  document.getElementById("fab").classList.toggle("hidden", !showFab);

  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.onclick = () => {
      if (window.deferredInstallPrompt) {
        window.deferredInstallPrompt.prompt();
      } else {
        showToast("Use your browser menu \u2192 'Install app' or 'Add to Home screen'");
      }
    };
  }
}

// ---------------------------------------------------------------
// Event delegation
// ---------------------------------------------------------------
document.addEventListener("click", (e) => {
  const navEl = e.target.closest("[data-nav]");
  if (navEl) {
    const route = navEl.dataset.nav;
    const id = navEl.dataset.id;
    const edit = navEl.dataset.edit === "1";
    if (route === "recipe" && id) navigate("recipe", { id, edit });
    else navigate(route);
    return;
  }

  const facGoto = e.target.closest("[data-faction-goto]");
  if (facGoto) {
    state.factionFilter = facGoto.dataset.factionGoto;
    navigate("recipes");
    return;
  }

  const facFilter = e.target.closest("[data-faction-filter]");
  if (facFilter) {
    state.factionFilter = facFilter.dataset.factionFilter || null;
    render();
    return;
  }

  const setFaction = e.target.closest("[data-set-faction]");
  if (setFaction) {
    formState.faction = setFaction.dataset.setFaction;
    render();
    return;
  }

  const setDiff = e.target.closest("[data-set-difficulty]");
  if (setDiff) {
    formState.difficulty = Number(setDiff.dataset.setDifficulty);
    render();
    return;
  }

  const addPaint = e.target.closest("[data-action='add-paint']");
  if (addPaint) {
    formState.paints.push(newPaintEntry());
    render();
    return;
  }

  const removePaint = e.target.closest("[data-remove-paint]");
  if (removePaint) {
    const pid = removePaint.dataset.removePaint;
    formState.paints = formState.paints.filter((p) => p.id !== pid);
    formState.steps.forEach((s) => { if (s.paintId === pid) s.paintId = ""; });
    render();
    return;
  }

  const addStep = e.target.closest("[data-action='add-step']");
  if (addStep) {
    formState.steps.push(newStepEntry());
    render();
    return;
  }

  const removeStep = e.target.closest("[data-remove-step]");
  if (removeStep) {
    formState.steps = formState.steps.filter((s) => s.id !== removeStep.dataset.removeStep);
    render();
    return;
  }

  const swipeBtn = e.target.closest("[data-swipe]");
  if (swipeBtn && !swipeBtn.disabled) {
    swipeTo(swipeBtn.dataset.swipe === "next" ? 1 : -1);
    return;
  }

  const photoPick = e.target.closest("[data-action='photo-pick']");
  if (photoPick) {
    document.getElementById("photo-input").click();
    return;
  }

  const photoRemove = e.target.closest("[data-action='photo-remove']");
  if (photoRemove) {
    formState.photo = null;
    render();
    return;
  }

  const cancel = e.target.closest("[data-action='form-cancel']");
  if (cancel) {
    const targetId = formState.id;
    formState = null; // discard the unsaved session
    navigate(targetId ? "recipe" : "home", targetId ? { id: targetId } : {});
    return;
  }

  const save = e.target.closest("[data-action='form-save']");
  if (save) {
    if (!formState.name.trim()) {
      showToast("Give the recipe a name first");
      return;
    }
    const recipes = getRecipes();
    formState.paints = formState.paints.filter((p) => p.name.trim());
    formState.steps = formState.steps.filter((s) => s.paintId);
    const isNew = !formState.id;
    if (formState.id) {
      const idx = recipes.findIndex((r) => r.id === formState.id);
      if (idx > -1) recipes[idx] = formState;
    } else {
      formState.id = generateId(formState.faction);
      recipes.unshift(formState);
    }
    if (!saveRecipes(recipes)) {
      if (isNew) formState.id = null; // undo, so retrying doesn't double-assign
      showToast("Storage is full \u2014 try removing a photo");
      return;
    }
    showToast("Recipe saved");
    const savedId = formState.id;
    formState = null; // session complete
    navigate("recipe", { id: savedId });
    return;
  }

  const del = e.target.closest("[data-action='delete']");
  if (del) {
    if (confirm("Delete this recipe? This cannot be undone.")) {
      const recipes = getRecipes().filter((r) => r.id !== del.dataset.id);
      saveRecipes(recipes);
      showToast("Recipe deleted");
      navigate("recipes");
    }
    return;
  }

  const print = e.target.closest("[data-action='print']");
  if (print) {
    window.print();
    return;
  }

  const exportBtn = e.target.closest("[data-action='export']");
  if (exportBtn) {
    const blob = new Blob([JSON.stringify(getRecipes(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forgebook-recipes.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded");
    return;
  }

  const importBtn = e.target.closest("[data-action='import']");
  if (importBtn) {
    document.getElementById("import-input").click();
    return;
  }

  const resetBtn = e.target.closest("[data-action='reset']");
  if (resetBtn) {
    if (confirm("This will erase all recipes and reload the sample data. Continue?")) {
      localStorage.removeItem("forgebook.recipes");
      localStorage.removeItem("forgebook.recents");
      loadSeedIfEmpty();
      showToast("Reset to sample data");
      navigate("home");
    }
    return;
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "photo-input") {
    const file = e.target.files[0];
    if (!file) return;
    downscalePhoto(file, (dataUrl) => {
      if (!dataUrl) {
        showToast("That image could not be read");
        return;
      }
      formState.photo = dataUrl;
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
        if (!Array.isArray(data)) throw new Error("bad format");
        saveRecipes(data);
        showToast("Recipes imported");
        navigate("home");
      } catch (err) {
        showToast("That file could not be read");
      }
    };
    reader.readAsText(file);
  }
});

// ---------------------------------------------------------------
// Touch swipe gesture (recipe detail page)
// The page follows the finger during a horizontal drag; past a
// threshold it commits to the previous/next recipe, otherwise it
// springs back. Vertical scrolling is left alone.
// ---------------------------------------------------------------
const touchState = { active: false, x: 0, y: 0, dx: 0, locked: null, canPrev: false, canNext: false };

function swipePage() {
  return document.querySelector("#view-root [data-swipe-page]");
}

document.addEventListener("touchstart", (e) => {
  touchState.active = false;
  if (state.route !== "recipe" || state.params.edit) return;
  if (e.target.closest("input, textarea, select, button, a")) return;
  const siblings = getFilteredRecipes();
  const idx = siblings.findIndex((r) => r.id === state.params.id);
  touchState.active = true;
  touchState.x = e.touches[0].clientX;
  touchState.y = e.touches[0].clientY;
  touchState.dx = 0;
  touchState.locked = null;
  touchState.canPrev = idx > 0;
  touchState.canNext = idx > -1 && idx < siblings.length - 1;
}, { passive: true });

document.addEventListener("touchmove", (e) => {
  if (!touchState.active) return;
  const dx = e.touches[0].clientX - touchState.x;
  const dy = e.touches[0].clientY - touchState.y;
  if (touchState.locked === null && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
    touchState.locked = Math.abs(dx) > Math.abs(dy) * 1.4 ? "h" : "v";
  }
  if (touchState.locked !== "h") return;
  // Rubber-band when there's nothing in that direction
  const blocked = (dx > 0 && !touchState.canPrev) || (dx < 0 && !touchState.canNext);
  touchState.dx = dx;
  const page = swipePage();
  if (page) {
    page.style.transition = "none";
    page.style.transform = `translateX(${dx * (blocked ? 0.25 : 0.85)}px)`;
    page.style.opacity = blocked ? "1" : String(Math.max(0.55, 1 - Math.abs(dx) / 700));
  }
}, { passive: true });

document.addEventListener("touchend", () => {
  if (!touchState.active) return;
  touchState.active = false;
  const page = swipePage();
  if (touchState.locked === "h" && Math.abs(touchState.dx) > 70) {
    if (swipeTo(touchState.dx < 0 ? 1 : -1)) return; // render() replaces the page
  }
  if (page) {
    page.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    page.style.transform = "";
    page.style.opacity = "";
    setTimeout(() => {
      if (page.isConnected) page.style.transition = "";
    }, 220);
  }
});

// Desktop: left/right arrow keys browse recipes on the detail page
document.addEventListener("keydown", (e) => {
  if (state.route !== "recipe" || state.params.edit) return;
  if (e.target.closest("input, textarea, select")) return;
  if (e.key === "ArrowRight") swipeTo(1);
  else if (e.key === "ArrowLeft") swipeTo(-1);
});

// Search (topbar)
document.addEventListener("input", (e) => {
  if (e.target.id === "search-input") {
    state.searchQuery = e.target.value;
    if (state.route !== "recipes") navigate("recipes");
    else render();
  }
});

window.addEventListener("resize", () => render());

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
function buildShell() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <nav class="side-nav">
      <div class="side-nav__brand">${icon("book", 20)} Forgebook</div>
      ${NAV_ITEMS.map((n) => `
        <button class="side-nav__item" data-nav="${n.route}" data-route="${n.route}">
          ${icon(n.icon, 18)} ${n.label}
        </button>
      `).join("")}
    </nav>
    <header class="topbar">
      <div class="topbar__brand"><span class="glyph">${icon("book", 16)}</span> Forgebook</div>
      <div class="topbar__search">
        ${icon("search", 16)}
        <input type="text" id="search-input" placeholder="Search recipes or paints" />
      </div>
    </header>
    <main id="view-root"></main>
    <button class="fab" id="fab" data-nav="recipe-new" aria-label="Add recipe">${icon("plus", 24)}</button>
    <nav class="bottom-nav">
      ${NAV_ITEMS.map((n) => `
        <button class="bottom-nav__item" data-nav="${n.route}" data-route="${n.route}">
          ${icon(n.icon, 21)}
          <span>${n.label}</span>
        </button>
      `).join("")}
    </nav>
    <div class="toast" id="toast"></div>
  `;
}

function init() {
  loadSeedIfEmpty();
  buildShell();
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
});

document.addEventListener("DOMContentLoaded", init);
