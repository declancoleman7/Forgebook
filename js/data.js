// ============================================================
// Forgebook — data layer
//
// ORIGINAL ARTWORK NOTE
// The emblems below are original abstract heraldic marks drawn for this app.
// They are deliberately NOT reproductions of Games Workshop's faction icons,
// which are GW's copyrighted IP. Faction names are used only to label your
// own recipes. If you'd rather see a different mark for a faction, use
// "Change emblem" on the faction page to drop in any image you like — it's
// stored on your device and never leaves it.
// ============================================================

// --- Emblems: original geometric marks, 24x24, stroked in the faction colour ---
const EMBLEMS = {
  helm: '<path d="M12 3c4 0 6 2.5 6 6v3l-2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4l-2-2V9c0-3.5 2-6 6-6z"/><path d="M9.5 10h1.5M13 10h1.5M12 14v4"/>',
  chevrons: '<path d="M4 8l8-4 8 4"/><path d="M4 13l8-4 8 4"/><path d="M4 18l8-4 8 4"/>',
  cog: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  wings: '<path d="M12 7v11"/><path d="M12 9L4 6l2 5-2 1 8 3"/><path d="M12 9l8-3-2 5 2 1-8 3"/>',
  spiral: '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 0 1-4 4 6 6 0 0 1-6-6 8 8 0 0 1 8-8"/>',
  sunburst: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
  fangs: '<path d="M3 7h18"/><path d="M5 7l2 6 2-6M11 7l1 8 1-8M15 7l2 6 2-6"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M12 8v7"/>',
  crescent: '<path d="M15 3a9 9 0 1 0 5 12A7 7 0 0 1 15 3z"/><path d="M18 4l1.5 1.5L18 7l-1.5-1.5z"/>',
  flame: '<path d="M12 21c-3.5 0-6-2.4-6-5.6 0-4.4 6-6.4 5-12.4 3 2 7 5 7 12.4 0 3.2-2.5 5.6-6 5.6z"/><path d="M12 21c-1.7 0-3-1.3-3-3 0-2.2 3-3 3-6 1.5 1.5 3 3.8 3 6 0 1.7-1.3 3-3 3z"/>',
  trefoil: '<circle cx="12" cy="12" r="2"/><path d="M12 10V5M12 10L7 18M12 10l5 8"/><circle cx="12" cy="4.5" r="2.5"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/>',
  bolt: '<path d="M13 2L5 13h5l-1 9 8-11h-5z"/>',
  leaf: '<path d="M12 21c0-8 2-13 8-16 1 8-2 14-8 16z"/><path d="M12 21c0-6-2-10-8-12 0 7 3 11 8 12z"/><path d="M12 21v-6"/>',
  knot: '<path d="M8 6a4 4 0 0 0 0 8 4 4 0 0 1 0 8"/><path d="M16 6a4 4 0 0 1 0 8 4 4 0 0 0 0 8"/><path d="M4 10h16M4 18h16"/>',
  hammer: '<path d="M6 5h9l3 3-3 3H6z"/><path d="M11 11v10"/><path d="M8 21h6"/>',
  bones: '<path d="M6 6a2 2 0 1 1 3 3l6 6a2 2 0 1 1-3 3"/><path d="M18 6a2 2 0 1 0-3 3l-6 6a2 2 0 1 0 3 3"/>',
  anvil: '<path d="M4 9h13a4 4 0 0 1-4 4H9v3h6v2H5v-2h2v-3a4 4 0 0 1-3-4z"/>',
  crown: '<path d="M4 18h16"/><path d="M4 18l-1-9 5 4 4-7 4 7 5-4-1 9z"/>',
  serpent: '<path d="M20 5c-4 0-4 5-8 5S4 5 4 5"/><path d="M4 12c4 0 4 5 8 5s4-5 8-5"/><circle cx="19" cy="19" r="1.5"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>',
  tower: '<path d="M6 21V8l3-2V3h6v3l3 2v13z"/><path d="M10 21v-5h4v5"/>',
  claw: '<path d="M5 3c1 6 3 10 7 12"/><path d="M10 3c0 6 1 10 4 12"/><path d="M15 4c-1 6-1 9 1 11"/><path d="M6 15c2 4 5 6 9 6"/>',
};

// --- Factions currently in the Games Workshop range ---
const FACTIONS = [
  // Warhammer 40,000 — Imperium
  { id: "space-marines",        label: "Space Marines",        system: "40k", alliance: "Imperium",    color: "#1B4B6B", emblem: "helm" },
  { id: "blood-angels",         label: "Blood Angels",         system: "40k", alliance: "Imperium",    color: "#8E1B24", emblem: "wings" },
  { id: "dark-angels",          label: "Dark Angels",          system: "40k", alliance: "Imperium",    color: "#20452F", emblem: "wings" },
  { id: "space-wolves",         label: "Space Wolves",         system: "40k", alliance: "Imperium",    color: "#6C8794", emblem: "fangs" },
  { id: "black-templars",       label: "Black Templars",       system: "40k", alliance: "Imperium",    color: "#4A4A50", emblem: "shield" },
  { id: "deathwatch",           label: "Deathwatch",           system: "40k", alliance: "Imperium",    color: "#3C3C42", emblem: "bones" },
  { id: "grey-knights",         label: "Grey Knights",         system: "40k", alliance: "Imperium",    color: "#7E8B96", emblem: "tower" },
  { id: "adeptus-custodes",     label: "Adeptus Custodes",     system: "40k", alliance: "Imperium",    color: "#B08A2E", emblem: "crown" },
  { id: "adepta-sororitas",     label: "Adepta Sororitas",     system: "40k", alliance: "Imperium",    color: "#8A1C2B", emblem: "flame" },
  { id: "astra-militarum",      label: "Astra Militarum",      system: "40k", alliance: "Imperium",    color: "#5A6340", emblem: "chevrons" },
  { id: "adeptus-mechanicus",   label: "Adeptus Mechanicus",   system: "40k", alliance: "Imperium",    color: "#9B3B24", emblem: "cog" },
  { id: "imperial-knights",     label: "Imperial Knights",     system: "40k", alliance: "Imperium",    color: "#3F6D8E", emblem: "tower" },
  { id: "imperial-agents",      label: "Imperial Agents",      system: "40k", alliance: "Imperium",    color: "#5C5568", emblem: "eye" },

  // Warhammer 40,000 — Chaos
  { id: "chaos-space-marines",  label: "Chaos Space Marines",  system: "40k", alliance: "Chaos",       color: "#5B2E63", emblem: "sunburst" },
  { id: "death-guard",          label: "Death Guard",          system: "40k", alliance: "Chaos",       color: "#6E7443", emblem: "trefoil" },
  { id: "thousand-sons",        label: "Thousand Sons",        system: "40k", alliance: "Chaos",       color: "#1E6E6B", emblem: "spiral" },
  { id: "world-eaters",         label: "World Eaters",         system: "40k", alliance: "Chaos",       color: "#96222B", emblem: "claw" },
  { id: "emperors-children",    label: "Emperor's Children",   system: "40k", alliance: "Chaos",       color: "#8E3A7E", emblem: "serpent" },
  { id: "chaos-daemons",        label: "Chaos Daemons",        system: "40k", alliance: "Chaos",       color: "#6B2450", emblem: "eye" },
  { id: "chaos-knights",        label: "Chaos Knights",        system: "40k", alliance: "Chaos",       color: "#5A3242", emblem: "tower" },

  // Warhammer 40,000 — Xenos
  { id: "aeldari",              label: "Aeldari",              system: "40k", alliance: "Xenos",       color: "#2E7C86", emblem: "crescent" },
  { id: "drukhari",             label: "Drukhari",             system: "40k", alliance: "Xenos",       color: "#3F5A72", emblem: "claw" },
  { id: "necrons",              label: "Necrons",              system: "40k", alliance: "Xenos",       color: "#4C7A3E", emblem: "bones" },
  { id: "orks",                 label: "Orks",                 system: "40k", alliance: "Xenos",       color: "#5C7A29", emblem: "fangs" },
  { id: "tau-empire",           label: "T'au Empire",          system: "40k", alliance: "Xenos",       color: "#B4642A", emblem: "shield" },
  { id: "tyranids",             label: "Tyranids",             system: "40k", alliance: "Xenos",       color: "#B8542E", emblem: "claw" },
  { id: "genestealer-cults",    label: "Genestealer Cults",    system: "40k", alliance: "Xenos",       color: "#7A5C8E", emblem: "spiral" },
  { id: "leagues-of-votann",    label: "Leagues of Votann",    system: "40k", alliance: "Xenos",       color: "#B08A2E", emblem: "anvil" },

  // Age of Sigmar — Order
  { id: "stormcast-eternals",   label: "Stormcast Eternals",   system: "aos", alliance: "Order",       color: "#B0912F", emblem: "bolt" },
  { id: "cities-of-sigmar",     label: "Cities of Sigmar",     system: "aos", alliance: "Order",       color: "#6A5B8C", emblem: "tower" },
  { id: "daughters-of-khaine",  label: "Daughters of Khaine",  system: "aos", alliance: "Order",       color: "#8E2340", emblem: "crescent" },
  { id: "fyreslayers",          label: "Fyreslayers",          system: "aos", alliance: "Order",       color: "#C05A22", emblem: "flame" },
  { id: "idoneth-deepkin",      label: "Idoneth Deepkin",      system: "aos", alliance: "Order",       color: "#2E7C86", emblem: "spiral" },
  { id: "kharadron-overlords",  label: "Kharadron Overlords",  system: "aos", alliance: "Order",       color: "#9A7B2E", emblem: "cog" },
  { id: "lumineth-realm-lords", label: "Lumineth Realm-lords", system: "aos", alliance: "Order",       color: "#C2A33F", emblem: "sunburst" },
  { id: "seraphon",             label: "Seraphon",             system: "aos", alliance: "Order",       color: "#2F6F4E", emblem: "sunburst" },
  { id: "sylvaneth",            label: "Sylvaneth",            system: "aos", alliance: "Order",       color: "#4C7A3E", emblem: "leaf" },

  // Age of Sigmar — Chaos
  { id: "blades-of-khorne",     label: "Blades of Khorne",     system: "aos", alliance: "Chaos",       color: "#96222B", emblem: "hammer" },
  { id: "disciples-of-tzeentch",label: "Disciples of Tzeentch",system: "aos", alliance: "Chaos",       color: "#1E6E6B", emblem: "eye" },
  { id: "maggotkin-of-nurgle",  label: "Maggotkin of Nurgle",  system: "aos", alliance: "Chaos",       color: "#6E7443", emblem: "trefoil" },
  { id: "hedonites-of-slaanesh",label: "Hedonites of Slaanesh",system: "aos", alliance: "Chaos",       color: "#8E3A7E", emblem: "serpent" },
  { id: "skaven",               label: "Skaven",               system: "aos", alliance: "Chaos",       color: "#7A6A3E", emblem: "fangs" },
  { id: "slaves-to-darkness",   label: "Slaves to Darkness",   system: "aos", alliance: "Chaos",       color: "#5A3242", emblem: "sunburst" },

  // Age of Sigmar — Death
  { id: "flesh-eater-courts",   label: "Flesh-eater Courts",   system: "aos", alliance: "Death",       color: "#7E5A3C", emblem: "crown" },
  { id: "nighthaunt",           label: "Nighthaunt",           system: "aos", alliance: "Death",       color: "#3E7E76", emblem: "knot" },
  { id: "ossiarch-bonereapers", label: "Ossiarch Bonereapers", system: "aos", alliance: "Death",       color: "#8A8256", emblem: "bones" },
  { id: "soulblight-gravelords",label: "Soulblight Gravelords",system: "aos", alliance: "Death",       color: "#7A2130", emblem: "bones" },

  // Age of Sigmar — Destruction
  { id: "gloomspite-gitz",      label: "Gloomspite Gitz",      system: "aos", alliance: "Destruction", color: "#3E7E5E", emblem: "crescent" },
  { id: "ogor-mawtribes",       label: "Ogor Mawtribes",       system: "aos", alliance: "Destruction", color: "#8A6A3E", emblem: "fangs" },
  { id: "orruk-warclans",       label: "Orruk Warclans",       system: "aos", alliance: "Destruction", color: "#5C7A29", emblem: "hammer" },
  { id: "sons-of-behemat",      label: "Sons of Behemat",      system: "aos", alliance: "Destruction", color: "#7A6A4E", emblem: "anvil" },

  // Everything else
  { id: "generic",              label: "Unaligned & Terrain",  system: "other", alliance: "General",   color: "#6B6560", emblem: "knot" },
];

const SYSTEMS = [
  { id: "40k", label: "Warhammer 40,000", alliances: ["Imperium", "Chaos", "Xenos"] },
  { id: "aos", label: "Age of Sigmar", alliances: ["Order", "Chaos", "Death", "Destruction"] },
  { id: "other", label: "Everything Else", alliances: ["General"] },
];

const TECHNIQUES = ["Base", "Shade", "Layer", "Highlight", "Edge Highlight", "Glaze", "Drybrush", "Wash", "Contrast", "Technical"];
const PAINT_TYPES = ["Base", "Layer", "Shade", "Contrast", "Dry", "Technical", "Air", "Spray", "Other"];
const PAINT_BRANDS = ["Citadel", "Vallejo", "Army Painter", "Scale75", "Pro Acryl", "Two Thin Coats", "AK", "Kimera", "Other"];

const GENERAL_UNIT = "\u2014 General \u2014"; // label for faction-wide recipes

function faction(id) {
  return FACTIONS.find((f) => f.id === id) || FACTIONS[FACTIONS.length - 1];
}

function emblemPaths(key) {
  return EMBLEMS[key] || EMBLEMS.knot;
}

// ============================================================
// Seed data
// ============================================================
const SEED_PAINTS = [
  { id: "pa-warboss-green",    name: "Warboss Green",       brand: "Citadel", hex: "#3C5C29", type: "Base" },
  { id: "pa-german-red-brown", name: "German Red Brown",    brand: "Vallejo", hex: "#5C2E1E", type: "Layer" },
  { id: "pa-plaguebearer",     name: "Plaguebearer Flesh",  brand: "Citadel", hex: "#8FA55B", type: "Layer" },
  { id: "pa-titanium-white",   name: "Bold Titanium White", brand: "Vallejo", hex: "#F1EDE6", type: "Layer" },
  { id: "pa-macragge-blue",    name: "Macragge Blue",       brand: "Citadel", hex: "#1B4B6B", type: "Base" },
  { id: "pa-nuln-oil",         name: "Nuln Oil",            brand: "Citadel", hex: "#1A1A1A", type: "Shade" },
  { id: "pa-calgar-blue",      name: "Calgar Blue",         brand: "Citadel", hex: "#3D74A6", type: "Layer" },
  { id: "pa-fenrisian-grey",   name: "Fenrisian Grey",      brand: "Citadel", hex: "#A9B7C0", type: "Layer" },
  { id: "pa-retributor",       name: "Retributor Armour",   brand: "Citadel", hex: "#8C6B2A", type: "Base" },
  { id: "pa-abaddon-black",    name: "Abaddon Black",       brand: "Citadel", hex: "#0E0E10", type: "Base" },
  { id: "pa-screamer-pink",    name: "Screamer Pink",       brand: "Citadel", hex: "#5B2E63", type: "Base" },
  { id: "pa-warplock-bronze",  name: "Warplock Bronze",     brand: "Citadel", hex: "#6A4A2E", type: "Base" },
  { id: "pa-sycorax-bronze",   name: "Sycorax Bronze",      brand: "Citadel", hex: "#9C7A45", type: "Layer" },
  { id: "pa-runefang-steel",   name: "Runefang Steel",      brand: "Citadel", hex: "#C8CDD1", type: "Layer" },
  { id: "pa-rhinox-hide",      name: "Rhinox Hide",         brand: "Citadel", hex: "#3A2A22", type: "Base" },
  { id: "pa-fire-dragon",      name: "Fire Dragon Bright",  brand: "Citadel", hex: "#B8542E", type: "Layer" },
  { id: "pa-ushabti-bone",     name: "Ushabti Bone",        brand: "Citadel", hex: "#C9B27A", type: "Layer" },
  { id: "pa-agrax",            name: "Agrax Earthshade",    brand: "Citadel", hex: "#4A3826", type: "Shade" },
  { id: "pa-leadbelcher",      name: "Leadbelcher",         brand: "Citadel", hex: "#6E7477", type: "Base" },
  { id: "pa-stirland-mud",     name: "Stirland Mud",        brand: "Citadel", hex: "#5A4632", type: "Technical" },
];

const SEED_RECIPES = [
  {
    id: "ORK-001",
    name: "Ork Boyz Skin",
    faction: "orks",
    unit: "Boyz",
    difficulty: 2,
    photo: null,
    steps: [
      { id: "s1", technique: "Base",      paintId: "pa-warboss-green",    notes: "Two thin coats over black primer." },
      { id: "s2", technique: "Wash",      paintId: "pa-german-red-brown", notes: "Thin wash into all recesses, let it pool in the wrinkles." },
      { id: "s3", technique: "Layer",     paintId: "pa-plaguebearer",     notes: "Mix 1:1 with the base colour, build up on raised muscle." },
      { id: "s4", technique: "Highlight", paintId: "pa-titanium-white",   notes: "Tiny dot mix on knuckles, brow ridge and tusks only." },
    ],
    notes: "Works equally well on Nobz. For Deffskulls, swap the base for a bone tone.",
  },
  {
    id: "SM-001",
    name: "Ultramarines Power Armour",
    faction: "space-marines",
    unit: null,
    difficulty: 3,
    photo: null,
    steps: [
      { id: "s1", technique: "Base",           paintId: "pa-macragge-blue",  notes: "Even coverage, two coats over grey primer." },
      { id: "s2", technique: "Wash",           paintId: "pa-nuln-oil",       notes: "Full wash over all armour panels." },
      { id: "s3", technique: "Layer",          paintId: "pa-calgar-blue",    notes: "Panel centres, leave the recesses dark." },
      { id: "s4", technique: "Edge Highlight", paintId: "pa-fenrisian-grey", notes: "Sharp edge highlight on trim and rims." },
      { id: "s5", technique: "Base",           paintId: "pa-retributor",     notes: "Shoulder trim and honour badges." },
    ],
    notes: "Applies to the whole army rather than one kit \u2014 which is why it sits under General.",
  },
  {
    id: "CSM-001",
    name: "Chaos Trim & Brass",
    faction: "chaos-space-marines",
    unit: "Legionaries",
    difficulty: 4,
    photo: null,
    steps: [
      { id: "s1", technique: "Base",           paintId: "pa-abaddon-black",   notes: "Armour plates, two thin coats." },
      { id: "s2", technique: "Glaze",          paintId: "pa-screamer-pink",   notes: "Thin purple glaze in the recesses for corruption." },
      { id: "s3", technique: "Base",           paintId: "pa-warplock-bronze", notes: "All trim, rivets and shoulder pads." },
      { id: "s4", technique: "Drybrush",       paintId: "pa-sycorax-bronze",  notes: "Light drybrush over the bronze trim only." },
      { id: "s5", technique: "Edge Highlight", paintId: "pa-runefang-steel",  notes: "Blade edges and chipped paint effects." },
    ],
    notes: "Stipple a little dried blood red near the blade tips for a used look.",
  },
  {
    id: "TYR-001",
    name: "Tyranid Carapace",
    faction: "tyranids",
    unit: "Termagants",
    difficulty: 3,
    photo: null,
    steps: [
      { id: "s1", technique: "Base",      paintId: "pa-rhinox-hide",  notes: "Carapace and claws." },
      { id: "s2", technique: "Layer",     paintId: "pa-fire-dragon",  notes: "Zenithal-style layer, leaving deep recesses brown." },
      { id: "s3", technique: "Highlight", paintId: "pa-ushabti-bone", notes: "Ridge lines only, thin mix, several light coats." },
    ],
    notes: "The soft flesh between plates uses a separate warm pink recipe.",
  },
  {
    id: "GEN-001",
    name: "Basing \u2014 Dry Earth & Grit",
    faction: "generic",
    unit: null,
    difficulty: 1,
    photo: null,
    steps: [
      { id: "s1", technique: "Technical", paintId: "pa-stirland-mud",  notes: "Thick coat over the whole base, keep the rim clean." },
      { id: "s2", technique: "Drybrush",  paintId: "pa-ushabti-bone",  notes: "Heavy drybrush to catch the texture." },
      { id: "s3", technique: "Base",      paintId: "pa-abaddon-black", notes: "Tidy the base rim." },
    ],
    notes: "Universal basing recipe \u2014 works for every army, which is why it's Unaligned.",
  },
];

// ============================================================
// Storage + migration
// ============================================================
const SCHEMA_VERSION = 5;
const KEYS = {
  recipes: "forgebook.recipes",
  paints: "forgebook.paints",
  recents: "forgebook.recents",
  art: "forgebook.factionArt",
  schema: "forgebook.schema",
  guest: "forgebook.guest",
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function paintKey(name, brand) {
  return String(name || "").trim().toLowerCase() + "|" + String(brand || "").trim().toLowerCase();
}

// v0.3 kept a separate copy of each paint inside every recipe. v0.4 has one
// shared library and recipe steps point into it. This lifts the embedded
// paints out, dedupes by name+brand, and rewrites the steps — so nobody
// upgrading from v0.3 loses a recipe.
function migrateFromV3(oldRecipes) {
  const paints = [];
  const byKey = new Map();
  let n = 0;

  const ensurePaint = (p) => {
    const key = paintKey(p.name, p.brand);
    if (byKey.has(key)) return byKey.get(key).id;
    n++;
    const entry = {
      id: "pm-" + n + "-" + Math.random().toString(36).slice(2, 7),
      name: p.name,
      brand: p.brand || "",
      hex: p.hex || "#808080",
      type: "Other",
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    paints.push(entry);
    byKey.set(key, entry);
    return entry.id;
  };

  // Faction ids that changed when the full GW list came in
  const remap = { chaos: "chaos-space-marines" };

  const recipes = oldRecipes.map((r) => {
    const localMap = {};
    (r.paints || []).forEach((p) => { localMap[p.id] = ensurePaint(p); });
    return {
      id: r.id,
      name: r.name,
      faction: remap[r.faction] || r.faction || "generic",
      unit: r.unit || null,
      difficulty: r.difficulty || 1,
      photo: r.photo || null,
      steps: (r.steps || [])
        .map((s) => ({ id: s.id, technique: s.technique, paintId: localMap[s.paintId] || "", notes: s.notes || "" }))
        .filter((s) => s.paintId),
      notes: r.notes || "",
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
  });

  return { recipes, paints };
}

// Sample data is flagged so sync never pushes it to the cloud as if it were
// the user's own work, and so signing in can quietly clear it away.
function seeded(rows) {
  const t = new Date().toISOString();
  return rows.map((r) => Object.assign({}, r, { seed: true, deleted: false, updatedAt: t }));
}

function initStore() {
  const schema = Number(localStorage.getItem(KEYS.schema) || 0);
  const existing = readJSON(KEYS.recipes, null);

  if (!existing) {
    localStorage.setItem(KEYS.recipes, JSON.stringify(seeded(SEED_RECIPES)));
    localStorage.setItem(KEYS.paints, JSON.stringify(seeded(SEED_PAINTS)));
    localStorage.setItem(KEYS.recents, JSON.stringify(["ORK-001"]));
    localStorage.setItem(KEYS.schema, String(SCHEMA_VERSION));
    return;
  }

  if (schema < SCHEMA_VERSION) {
    const looksOld = existing.some((r) => Array.isArray(r.paints));
    if (looksOld) {
      const migrated = migrateFromV3(existing);
      localStorage.setItem(KEYS.recipes, JSON.stringify(migrated.recipes));
      localStorage.setItem(KEYS.paints, JSON.stringify(migrated.paints));
    } else if (!localStorage.getItem(KEYS.paints)) {
      localStorage.setItem(KEYS.paints, JSON.stringify(seeded(SEED_PAINTS)));
    }

    // v0.5 adds sync metadata. Anything already on the device is treated as
    // the user's own work (never as sample data), so it survives sign-in.
    const t = new Date().toISOString();
    const addMeta = (key) => {
      const rows = readJSON(key, []).map((x) => {
        if (!x.updatedAt) x.updatedAt = t;
        if (x.deleted === undefined) x.deleted = false;
        return x;
      });
      localStorage.setItem(key, JSON.stringify(rows));
    };
    addMeta(KEYS.recipes);
    addMeta(KEYS.paints);

    localStorage.setItem(KEYS.schema, String(SCHEMA_VERSION));
  }

  if (!localStorage.getItem(KEYS.recents)) {
    localStorage.setItem(KEYS.recents, JSON.stringify([]));
  }
}

function resetStore() {
  localStorage.setItem(KEYS.recipes, JSON.stringify(seeded(SEED_RECIPES)));
  localStorage.setItem(KEYS.paints, JSON.stringify(seeded(SEED_PAINTS)));
  localStorage.setItem(KEYS.recents, JSON.stringify(["ORK-001"]));
  localStorage.removeItem(KEYS.art);
  localStorage.setItem(KEYS.schema, String(SCHEMA_VERSION));
}
