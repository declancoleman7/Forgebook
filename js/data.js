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

const TECHNIQUES = ["Primer", "Base", "Shade", "Layer", "Highlight", "Edge Highlight", "Glaze", "Drybrush", "Wash", "Contrast", "Technical"];
const PAINT_TYPES = ["Base", "Layer", "Shade", "Contrast", "Dry", "Technical", "Air", "Spray", "Other"];
const PAINT_BRANDS = ["Citadel", "Vallejo", "Army Painter", "Scale75", "Pro Acryl", "Two Thin Coats", "AK", "Kimera", "Other"];

// ============================================================
// Paint library — a browsable catalogue of real paints, separate from the
// user's own rack (SEED_PAINTS / whatever they've added). Citadel's current
// range only for now (Base/Layer/Shade/Contrast/Technical/Dry; Spray, Air and
// texture paints excluded as they're not steps in a recipe the same way).
// Hex values are best-effort approximations — Citadel doesn't publish exact
// codes, and several ranges (Shade, Contrast, metallics) are rendered by GW
// as two-tone gradients that don't reduce to one "true" hex anyway.
// ============================================================
const PAINT_LIBRARY = [
  { name: "Abaddon Black", brand: "Citadel", type: "Base", hex: "#000000" },
  { name: "Averland Sunset", brand: "Citadel", type: "Base", hex: "#fbb81c" },
  { name: "Balthasar Gold", brand: "Citadel", type: "Base", hex: "#8e6949" },
  { name: "Barak-Nar Burgundy", brand: "Citadel", type: "Base", hex: "#451636" },
  { name: "Bugman's Glow", brand: "Citadel", type: "Base", hex: "#804c43" },
  { name: "Caledor Sky", brand: "Citadel", type: "Base", hex: "#366699" },
  { name: "Caliban Green", brand: "Citadel", type: "Base", hex: "#003d15" },
  { name: "Castellan Green", brand: "Citadel", type: "Base", hex: "#264715" },
  { name: "Catachan Flesh", brand: "Citadel", type: "Base", hex: "#442b25" },
  { name: "Celestra Grey", brand: "Citadel", type: "Base", hex: "#8ba3a3" },
  { name: "Corax White", brand: "Citadel", type: "Base", hex: "#ffffff" },
  { name: "Corvus Black", brand: "Citadel", type: "Base", hex: "#171314" },
  { name: "Daemonette Hide", brand: "Citadel", type: "Base", hex: "#655f81" },
  { name: "Death Guard Green", brand: "Citadel", type: "Base", hex: "#6d774d" },
  { name: "Death Korps Drab", brand: "Citadel", type: "Base", hex: "#3d4539" },
  { name: "Deathworld Forest", brand: "Citadel", type: "Base", hex: "#556229" },
  { name: "Dryad Bark", brand: "Citadel", type: "Base", hex: "#2b2a24" },
  { name: "Gal Vorbak Red", brand: "Citadel", type: "Base", hex: "#4b213c" },
  { name: "Grey Knights Steel", brand: "Citadel", type: "Base", hex: "#a3acb1" },
  { name: "Grey Seer", brand: "Citadel", type: "Base", hex: "#a2a5a7" },
  { name: "Hobgrot Hide", brand: "Citadel", type: "Base", hex: "#a1812a" },
  { name: "Incubi Darkness", brand: "Citadel", type: "Base", hex: "#082e32" },
  { name: "Ionrach Skin", brand: "Citadel", type: "Base", hex: "#97a384" },
  { name: "Iron Hands Steel", brand: "Citadel", type: "Base", hex: "#9a9894" },
  { name: "Iron Warriors", brand: "Citadel", type: "Base", hex: "#7e7d7c" },
  { name: "Jokaero Orange", brand: "Citadel", type: "Base", hex: "#ed3814" },
  { name: "Kantor Blue", brand: "Citadel", type: "Base", hex: "#02134e" },
  { name: "Khorne Red", brand: "Citadel", type: "Base", hex: "#650001" },
  { name: "Leadbelcher", brand: "Citadel", type: "Base", hex: "#83878a" },
  { name: "Lupercal Green", brand: "Citadel", type: "Base", hex: "#002c2b" },
  { name: "Macragge Blue", brand: "Citadel", type: "Base", hex: "#0f3d7c" },
  { name: "Mechanicus Standard Grey", brand: "Citadel", type: "Base", hex: "#39484a" },
  { name: "Mephiston Red", brand: "Citadel", type: "Base", hex: "#960c09" },
  { name: "Morghast Bone", brand: "Citadel", type: "Base", hex: "#c0a973" },
  { name: "Mournfang Brown", brand: "Citadel", type: "Base", hex: "#490f06" },
  { name: "Naggaroth Night", brand: "Citadel", type: "Base", hex: "#3b2b50" },
  { name: "Night Lords Blue", brand: "Citadel", type: "Base", hex: "#002b5c" },
  { name: "Nocturne Green", brand: "Citadel", type: "Base", hex: "#162a29" },
  { name: "Orruk Flesh", brand: "Citadel", type: "Base", hex: "#8cc276" },
  { name: "Phoenician Purple", brand: "Citadel", type: "Base", hex: "#440052" },
  { name: "Rakarth Flesh", brand: "Citadel", type: "Base", hex: "#9c998d" },
  { name: "Ratskin Flesh", brand: "Citadel", type: "Base", hex: "#a86648" },
  { name: "Retributor Armour", brand: "Citadel", type: "Base", hex: "#c4ab8e" },
  { name: "Rhinox Hide", brand: "Citadel", type: "Base", hex: "#462f30" },
  { name: "Runelord Brass", brand: "Citadel", type: "Base", hex: "#877e75" },
  { name: "Screamer Pink", brand: "Citadel", type: "Base", hex: "#7a0e44" },
  { name: "Screaming Bell", brand: "Citadel", type: "Base", hex: "#ae8b6d" },
  { name: "Steel Legion Drab", brand: "Citadel", type: "Base", hex: "#584e2d" },
  { name: "Stegadon Scale Green", brand: "Citadel", type: "Base", hex: "#06455d" },
  { name: "The Fang", brand: "Citadel", type: "Base", hex: "#405b71" },
  { name: "Thondia Brown", brand: "Citadel", type: "Base", hex: "#54302a" },
  { name: "Thousand Sons Blue", brand: "Citadel", type: "Base", hex: "#00506f" },
  { name: "Waaagh! Flesh", brand: "Citadel", type: "Base", hex: "#0b3b36" },
  { name: "Warplock Bronze", brand: "Citadel", type: "Base", hex: "#9b6558" },
  { name: "Wraithbone", brand: "Citadel", type: "Base", hex: "#dbd1b2" },
  { name: "XV-88", brand: "Citadel", type: "Base", hex: "#6c4811" },
  { name: "Zandri Dust", brand: "Citadel", type: "Base", hex: "#988e56" },
  { name: "Administratum Grey", brand: "Citadel", type: "Layer", hex: "#989c94" },
  { name: "Ahriman Blue", brand: "Citadel", type: "Layer", hex: "#00708a" },
  { name: "Alaitoc Blue", brand: "Citadel", type: "Layer", hex: "#2f4f85" },
  { name: "Altdorf Guard Blue", brand: "Citadel", type: "Layer", hex: "#2d4696" },
  { name: "Auric Armour Gold", brand: "Citadel", type: "Layer", hex: "#d8a776" },
  { name: "Baharroth Blue", brand: "Citadel", type: "Layer", hex: "#54bdca" },
  { name: "Balor Brown", brand: "Citadel", type: "Layer", hex: "#875408" },
  { name: "Baneblade Brown", brand: "Citadel", type: "Layer", hex: "#8f7c68" },
  { name: "Bestigor Flesh", brand: "Citadel", type: "Layer", hex: "#d08951" },
  { name: "Bloodreaver Flesh", brand: "Citadel", type: "Layer", hex: "#6a4848" },
  { name: "Blue Horror", brand: "Citadel", type: "Layer", hex: "#9eb5ce" },
  { name: "Brass Scorpion", brand: "Citadel", type: "Layer", hex: "#9e6533" },
  { name: "Cadian Fleshtone", brand: "Citadel", type: "Layer", hex: "#c47652" },
  { name: "Calgar Blue", brand: "Citadel", type: "Layer", hex: "#2a497f" },
  { name: "Canoptek Alloy", brand: "Citadel", type: "Layer", hex: "#cbbfbc" },
  { name: "Castellax Bronze", brand: "Citadel", type: "Layer", hex: "#9d796a" },
  { name: "Dark Reaper", brand: "Citadel", type: "Layer", hex: "#354d4c" },
  { name: "Dawnstone", brand: "Citadel", type: "Layer", hex: "#697068" },
  { name: "Deathclaw Brown", brand: "Citadel", type: "Layer", hex: "#af634f" },
  { name: "Dechala Lilac", brand: "Citadel", type: "Layer", hex: "#b598c9" },
  { name: "Deepkin Flesh", brand: "Citadel", type: "Layer", hex: "#a9b79f" },
  { name: "Doombull Brown", brand: "Citadel", type: "Layer", hex: "#570003" },
  { name: "Dorn Yellow", brand: "Citadel", type: "Layer", hex: "#fff55a" },
  { name: "Elysian Green", brand: "Citadel", type: "Layer", hex: "#6b8c37" },
  { name: "Emperor's Children", brand: "Citadel", type: "Layer", hex: "#b74073" },
  { name: "Eshin Grey", brand: "Citadel", type: "Layer", hex: "#484b4e" },
  { name: "Evil Sunz Scarlet", brand: "Citadel", type: "Layer", hex: "#c01411" },
  { name: "Fenrisian Grey", brand: "Citadel", type: "Layer", hex: "#6d94b3" },
  { name: "Fire Dragon Bright", brand: "Citadel", type: "Layer", hex: "#f4874e" },
  { name: "Flash Gitz Yellow", brand: "Citadel", type: "Layer", hex: "#fff300" },
  { name: "Flayed One Flesh", brand: "Citadel", type: "Layer", hex: "#eec483" },
  { name: "Fulgrim Pink", brand: "Citadel", type: "Layer", hex: "#f3abca" },
  { name: "Fulgurite Copper", brand: "Citadel", type: "Layer", hex: "#aa806f" },
  { name: "Gauss Blaster Green", brand: "Citadel", type: "Layer", hex: "#7fc1a5" },
  { name: "Gehenna's Gold", brand: "Citadel", type: "Layer", hex: "#b97e1f" },
  { name: "Genestealer Purple", brand: "Citadel", type: "Layer", hex: "#7658a5" },
  { name: "Gorthor Brown", brand: "Citadel", type: "Layer", hex: "#5f463f" },
  { name: "Hashut Copper", brand: "Citadel", type: "Layer", hex: "#a4794a" },
  { name: "Hoeth Blue", brand: "Citadel", type: "Layer", hex: "#4c78af" },
  { name: "Ironbreaker", brand: "Citadel", type: "Layer", hex: "#9b9b9b" },
  { name: "Kabalite Green", brand: "Citadel", type: "Layer", hex: "#008962" },
  { name: "Kakophoni Purple", brand: "Citadel", type: "Layer", hex: "#8869ae" },
  { name: "Karak Stone", brand: "Citadel", type: "Layer", hex: "#b7945c" },
  { name: "Kislev Flesh", brand: "Citadel", type: "Layer", hex: "#d1a570" },
  { name: "Knight-Questor Flesh", brand: "Citadel", type: "Layer", hex: "#996563" },
  { name: "Krieg Khaki", brand: "Citadel", type: "Layer", hex: "#bcbb7e" },
  { name: "Liberator Gold", brand: "Citadel", type: "Layer", hex: "#c4b392" },
  { name: "Loren Forest", brand: "Citadel", type: "Layer", hex: "#486c25" },
  { name: "Lothern Blue", brand: "Citadel", type: "Layer", hex: "#2c9bcc" },
  { name: "Lugganath Orange", brand: "Citadel", type: "Layer", hex: "#f69b82" },
  { name: "Moot Green", brand: "Citadel", type: "Layer", hex: "#3daf44" },
  { name: "Nurgling Green", brand: "Citadel", type: "Layer", hex: "#7e975e" },
  { name: "Ogryn Camo", brand: "Citadel", type: "Layer", hex: "#96a648" },
  { name: "Pallid Wych Flesh", brand: "Citadel", type: "Layer", hex: "#caccbb" },
  { name: "Phalanx Yellow", brand: "Citadel", type: "Layer", hex: "#ffe200" },
  { name: "Pink Horror", brand: "Citadel", type: "Layer", hex: "#8e2757" },
  { name: "Runefang Steel", brand: "Citadel", type: "Layer", hex: "#b6b9bb" },
  { name: "Russ Grey", brand: "Citadel", type: "Layer", hex: "#507085" },
  { name: "Screaming Skull", brand: "Citadel", type: "Layer", hex: "#b9c099" },
  { name: "Skarsnik Green", brand: "Citadel", type: "Layer", hex: "#588f6b" },
  { name: "Skavenblight Dinge", brand: "Citadel", type: "Layer", hex: "#45413b" },
  { name: "Skrag Brown", brand: "Citadel", type: "Layer", hex: "#8b4806" },
  { name: "Skullcrusher Brass", brand: "Citadel", type: "Layer", hex: "#e1c4a0" },
  { name: "Slaanesh Grey", brand: "Citadel", type: "Layer", hex: "#8b8893" },
  { name: "Sons of Horus Green", brand: "Citadel", type: "Layer", hex: "#00545e" },
  { name: "Sotek Green", brand: "Citadel", type: "Layer", hex: "#0b6371" },
  { name: "Squig Orange", brand: "Citadel", type: "Layer", hex: "#a74d42" },
  { name: "Stormhost Silver", brand: "Citadel", type: "Layer", hex: "#cccfd1" },
  { name: "Stormvermin Fur", brand: "Citadel", type: "Layer", hex: "#6d655f" },
  { name: "Straken Green", brand: "Citadel", type: "Layer", hex: "#597f1c" },
  { name: "Sybarite Green", brand: "Citadel", type: "Layer", hex: "#17a166" },
  { name: "Sycorax Bronze", brand: "Citadel", type: "Layer", hex: "#ac9996" },
  { name: "Tallarn Sand", brand: "Citadel", type: "Layer", hex: "#a07409" },
  { name: "Tau Light Ochre", brand: "Citadel", type: "Layer", hex: "#bc6b10" },
  { name: "Teclis Blue", brand: "Citadel", type: "Layer", hex: "#3877bf" },
  { name: "Temple Guard Blue", brand: "Citadel", type: "Layer", hex: "#239489" },
  { name: "Thunderhawk Blue", brand: "Citadel", type: "Layer", hex: "#396a70" },
  { name: "Troll Slayer Orange", brand: "Citadel", type: "Layer", hex: "#f16c23" },
  { name: "Tuskgor Fur", brand: "Citadel", type: "Layer", hex: "#863231" },
  { name: "Ulthuan Grey", brand: "Citadel", type: "Layer", hex: "#c4ddd5" },
  { name: "Ungor Flesh", brand: "Citadel", type: "Layer", hex: "#d1a560" },
  { name: "Ushabti Bone", brand: "Citadel", type: "Layer", hex: "#aba173" },
  { name: "Vulkan Green", brand: "Citadel", type: "Layer", hex: "#223c2e" },
  { name: "Warboss Green", brand: "Citadel", type: "Layer", hex: "#317e57" },
  { name: "Warpfiend Grey", brand: "Citadel", type: "Layer", hex: "#66656e" },
  { name: "Warpstone Glow", brand: "Citadel", type: "Layer", hex: "#0f702a" },
  { name: "Wazdakka Red", brand: "Citadel", type: "Layer", hex: "#880804" },
  { name: "White Scar", brand: "Citadel", type: "Layer", hex: "#ffffff" },
  { name: "Wild Rider Red", brand: "Citadel", type: "Layer", hex: "#e82e1b" },
  { name: "Word Bearers Red", brand: "Citadel", type: "Layer", hex: "#620104" },
  { name: "Xereus Purple", brand: "Citadel", type: "Layer", hex: "#47125a" },
  { name: "Yriel Yellow", brand: "Citadel", type: "Layer", hex: "#ffd900" },
  { name: "Zamesi Desert", brand: "Citadel", type: "Layer", hex: "#d89d1b" },
  { name: "Agrax Earthshade", brand: "Citadel", type: "Shade", hex: "#635344" },
  { name: "Athonian Camoshade", brand: "Citadel", type: "Shade", hex: "#606045" },
  { name: "Berserker Bloodshade", brand: "Citadel", type: "Shade", hex: "#c4476c" },
  { name: "Biel-Tan Green", brand: "Citadel", type: "Shade", hex: "#426248" },
  { name: "Carroburg Crimson", brand: "Citadel", type: "Shade", hex: "#6f3d4c" },
  { name: "Casandora Yellow", brand: "Citadel", type: "Shade", hex: "#eda15e" },
  { name: "Coelia Greenshade", brand: "Citadel", type: "Shade", hex: "#165c56" },
  { name: "Drakenhof Nightshade", brand: "Citadel", type: "Shade", hex: "#4c535c" },
  { name: "Druchii Violet", brand: "Citadel", type: "Shade", hex: "#533256" },
  { name: "Fuegan Orange", brand: "Citadel", type: "Shade", hex: "#8f4321" },
  { name: "Kroak Green", brand: "Citadel", type: "Shade", hex: "#9ac7a6" },
  { name: "Mortarion Grime", brand: "Citadel", type: "Shade", hex: "#bdb440" },
  { name: "Nuln Oil", brand: "Citadel", type: "Shade", hex: "#4e4c4b" },
  { name: "Poxwalker", brand: "Citadel", type: "Shade", hex: "#7eacad" },
  { name: "Reikland Fleshshade", brand: "Citadel", type: "Shade", hex: "#6f513d" },
  { name: "Seraphim Sepia", brand: "Citadel", type: "Shade", hex: "#664a2b" },
  { name: "Soulblight Grey", brand: "Citadel", type: "Shade", hex: "#b7b2b4" },
  { name: "Targor Rageshade", brand: "Citadel", type: "Shade", hex: "#877888" },
  { name: "Tyran Blue", brand: "Citadel", type: "Shade", hex: "#439dce" },
  { name: "Aeldari Emerald", brand: "Citadel", type: "Contrast", hex: "#006761" },
  { name: "Aethermatic Blue", brand: "Citadel", type: "Contrast", hex: "#278598" },
  { name: "Aggaros Dunes", brand: "Citadel", type: "Contrast", hex: "#7a6f47" },
  { name: "Akhelian Green", brand: "Citadel", type: "Contrast", hex: "#005469" },
  { name: "Apothecary White", brand: "Citadel", type: "Contrast", hex: "#aec4d9" },
  { name: "Asurmen Blue", brand: "Citadel", type: "Contrast", hex: "#004a7f" },
  { name: "Baal Red", brand: "Citadel", type: "Contrast", hex: "#c61925" },
  { name: "Bad Moon Yellow", brand: "Citadel", type: "Contrast", hex: "#fcbd11" },
  { name: "Basilicanum Grey", brand: "Citadel", type: "Contrast", hex: "#2e2e2d" },
  { name: "Black Legion", brand: "Citadel", type: "Contrast", hex: "#141415" },
  { name: "Black Templar", brand: "Citadel", type: "Contrast", hex: "#202020" },
  { name: "Blood Angels Red", brand: "Citadel", type: "Contrast", hex: "#8d0c0f" },
  { name: "Briar Queen Chill", brand: "Citadel", type: "Contrast", hex: "#5aa0b2" },
  { name: "Celestium Blue", brand: "Citadel", type: "Contrast", hex: "#0c4580" },
  { name: "Creed Camo", brand: "Citadel", type: "Contrast", hex: "#1c6235" },
  { name: "Cygor Brown", brand: "Citadel", type: "Contrast", hex: "#441f1c" },
  { name: "Dark Angels Green", brand: "Citadel", type: "Contrast", hex: "#001715" },
  { name: "Darkoath Flesh", brand: "Citadel", type: "Contrast", hex: "#9f6760" },
  { name: "Doomfire Magenta", brand: "Citadel", type: "Contrast", hex: "#bc006f" },
  { name: "Dreadful Visage", brand: "Citadel", type: "Contrast", hex: "#a48da6" },
  { name: "Flesh Tearers Red", brand: "Citadel", type: "Contrast", hex: "#510503" },
  { name: "Frostheart", brand: "Citadel", type: "Contrast", hex: "#004a6b" },
  { name: "Fyreslayer Flesh", brand: "Citadel", type: "Contrast", hex: "#7a5241" },
  { name: "Garaghak's Sewer", brand: "Citadel", type: "Contrast", hex: "#624a2d" },
  { name: "Gore-Grunta Fur", brand: "Citadel", type: "Contrast", hex: "#663b1c" },
  { name: "Gryph-Charger Grey", brand: "Citadel", type: "Contrast", hex: "#337393" },
  { name: "Gryph-Hound Orange", brand: "Citadel", type: "Contrast", hex: "#9d3612" },
  { name: "Guilliman Flesh", brand: "Citadel", type: "Contrast", hex: "#a45043" },
  { name: "Gutrippa Flesh", brand: "Citadel", type: "Contrast", hex: "#3a7840" },
  { name: "Hexwraith Flame", brand: "Citadel", type: "Contrast", hex: "#00a237" },
  { name: "Imperial Fist", brand: "Citadel", type: "Contrast", hex: "#faa818" },
  { name: "Ironjawz Yellow", brand: "Citadel", type: "Contrast", hex: "#c49124" },
  { name: "Iyanden Yellow", brand: "Citadel", type: "Contrast", hex: "#de870f" },
  { name: "Karandras Green", brand: "Citadel", type: "Contrast", hex: "#00672e" },
  { name: "Kroxigor Scales", brand: "Citadel", type: "Contrast", hex: "#006d81" },
  { name: "Leviadon Blue", brand: "Citadel", type: "Contrast", hex: "#000e1b" },
  { name: "Leviathan Purple", brand: "Citadel", type: "Contrast", hex: "#11054d" },
  { name: "Luxion Purple", brand: "Citadel", type: "Contrast", hex: "#2f0958" },
  { name: "Magmadroth Flame", brand: "Citadel", type: "Contrast", hex: "#de5227" },
  { name: "Magos Purple", brand: "Citadel", type: "Contrast", hex: "#824b77" },
  { name: "Mantis Warriors Green", brand: "Citadel", type: "Contrast", hex: "#497a30" },
  { name: "Militarum Green", brand: "Citadel", type: "Contrast", hex: "#707b17" },
  { name: "Nazdreg Yellow", brand: "Citadel", type: "Contrast", hex: "#785500" },
  { name: "Nighthaunt Gloom", brand: "Citadel", type: "Contrast", hex: "#4c838a" },
  { name: "Ork Flesh", brand: "Citadel", type: "Contrast", hex: "#005e20" },
  { name: "Plaguebearer Flesh", brand: "Citadel", type: "Contrast", hex: "#7a8932" },
  { name: "Pylar Glacier", brand: "Citadel", type: "Contrast", hex: "#23a8e2" },
  { name: "Ratling Grime", brand: "Citadel", type: "Contrast", hex: "#565250" },
  { name: "Shyish Purple", brand: "Citadel", type: "Contrast", hex: "#301446" },
  { name: "Sigvald Burgundy", brand: "Citadel", type: "Contrast", hex: "#65004c" },
  { name: "Skeleton Horde", brand: "Citadel", type: "Contrast", hex: "#ac9e78" },
  { name: "Snakebite Leather", brand: "Citadel", type: "Contrast", hex: "#715026" },
  { name: "Space Wolves Grey", brand: "Citadel", type: "Contrast", hex: "#2b5375" },
  { name: "Stormfiend", brand: "Citadel", type: "Contrast", hex: "#004b76" },
  { name: "Striking Scorpion Green", brand: "Citadel", type: "Contrast", hex: "#056c30" },
  { name: "Talassar Blue", brand: "Citadel", type: "Contrast", hex: "#004179" },
  { name: "Terradon Turquoise", brand: "Citadel", type: "Contrast", hex: "#005d69" },
  { name: "Ultramarines Blue", brand: "Citadel", type: "Contrast", hex: "#0c1f4f" },
  { name: "Volupus Pink", brand: "Citadel", type: "Contrast", hex: "#650120" },
  { name: "Warp Lightning", brand: "Citadel", type: "Contrast", hex: "#00642a" },
  { name: "Wyldwood", brand: "Citadel", type: "Contrast", hex: "#472c27" },
  { name: "Ardcoat", brand: "Citadel", type: "Technical", hex: "#ededed" },
  { name: "Blood For The Blood God", brand: "Citadel", type: "Technical", hex: "#6f181c" },
  { name: "Contrast Medium", brand: "Citadel", type: "Technical", hex: "#ededed" },
  { name: "Lahmian Medium", brand: "Citadel", type: "Technical", hex: "#ededed" },
  { name: "Nihilakh Oxide", brand: "Citadel", type: "Technical", hex: "#66b39a" },
  { name: "Nurgles Rot", brand: "Citadel", type: "Technical", hex: "#9d8b16" },
  { name: "Soulstone Blue", brand: "Citadel", type: "Technical", hex: "#1b2c5d" },
  { name: "Spiritstone Red", brand: "Citadel", type: "Technical", hex: "#89291a" },
  { name: "Stormshield", brand: "Citadel", type: "Technical", hex: "#ededed" },
  { name: "Tesseract Glow", brand: "Citadel", type: "Technical", hex: "#49ad33" },
  { name: "Typhus Corrosion", brand: "Citadel", type: "Technical", hex: "#373a22" },
  { name: "Waystone Green", brand: "Citadel", type: "Technical", hex: "#194c35" },
  { name: "Astorath Red", brand: "Citadel", type: "Dry", hex: "#a9311e" },
  { name: "Dawnstone", brand: "Citadel", type: "Dry", hex: "#697068" },
  { name: "Eldar Flesh", brand: "Citadel", type: "Dry", hex: "#e8c07f" },
  { name: "Etherium Blue", brand: "Citadel", type: "Dry", hex: "#9eb5ce" },
  { name: "Golden Griffon", brand: "Citadel", type: "Dry", hex: "#c4b392" },
  { name: "Golgfag Brown", brand: "Citadel", type: "Dry", hex: "#8f502a" },
  { name: "Hexos Palesun", brand: "Citadel", type: "Dry", hex: "#fff55a" },
  { name: "Hoeth Blue", brand: "Citadel", type: "Dry", hex: "#4c78af" },
  { name: "Imrik Blue", brand: "Citadel", type: "Dry", hex: "#208abf" },
  { name: "Longbeard Grey", brand: "Citadel", type: "Dry", hex: "#dbdcc6" },
  { name: "Lucius Lilac", brand: "Citadel", type: "Dry", hex: "#b598c9" },
  { name: "Necron Compound", brand: "Citadel", type: "Dry", hex: "#cccfd1" },
  { name: "Niblet Green", brand: "Citadel", type: "Dry", hex: "#378c35" },
  { name: "Nurgling Green", brand: "Citadel", type: "Dry", hex: "#7e975e" },
  { name: "Praxeti White", brand: "Citadel", type: "Dry", hex: "#ffffff" },
  { name: "Ryza Rust", brand: "Citadel", type: "Dry", hex: "#f16c23" },
  { name: "Sigmarite", brand: "Citadel", type: "Dry", hex: "#dea856" },
  { name: "Skink Blue", brand: "Citadel", type: "Dry", hex: "#54bdca" },
  { name: "Stormfang", brand: "Citadel", type: "Dry", hex: "#5a7fa3" },
  { name: "Sylvaneth Bark", brand: "Citadel", type: "Dry", hex: "#4e483b" },
  { name: "Terminatus Stone", brand: "Citadel", type: "Dry", hex: "#c8b79d" },
  { name: "Tyrant Skull", brand: "Citadel", type: "Dry", hex: "#c8c483" },
  { name: "Underhive Ash", brand: "Citadel", type: "Dry", hex: "#bcbb7e" },
  { name: "Wrack White", brand: "Citadel", type: "Dry", hex: "#d3d0cf" },
];

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
  { id: "pa-nuln-oil",         name: "Nuln Oil",            brand: "Citadel", hex: "#1A1A1A", type: "Shade", needsRestock: true },
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
  { id: "pa-black-spray",      name: "Chaos Black Spray",   brand: "Citadel", hex: "#0A0A0C", type: "Spray" },
  { id: "pa-white-spray",      name: "Corax White Spray",   brand: "Citadel", hex: "#E8E8E2", type: "Spray" },
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
      { id: "s0", technique: "Primer",    paintId: "pa-black-spray",      notes: "Even coat over the whole model. Let it cure fully before basecoating.", area: "" },
      { id: "s1", technique: "Base",      paintId: "pa-warboss-green",    notes: "Two thin coats.", area: "Skin" },
      { id: "s2", technique: "Wash",      paintId: "pa-german-red-brown", notes: "Thin wash into all recesses, let it pool in the wrinkles.", area: "Skin" },
      { id: "s3", technique: "Layer",     paintId: "pa-plaguebearer",     notes: "Mix 1:1 with the base colour, build up on raised muscle.", area: "Skin" },
      { id: "s4", technique: "Highlight", paintId: "pa-titanium-white",   notes: "Tiny dot mix on knuckles, brow ridge and tusks only.", area: "Skin" },
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
      { id: "s0", technique: "Primer",        paintId: "pa-white-spray",    notes: "A bright undercoat keeps Macragge Blue vibrant rather than muddy.", area: "" },
      { id: "s1", technique: "Base",          paintId: "pa-macragge-blue",  notes: "Even coverage, two coats.", area: "Armour" },
      { id: "s2", technique: "Wash",          paintId: "pa-nuln-oil",       notes: "Full wash over all armour panels.", area: "Armour" },
      { id: "s3", technique: "Layer",         paintId: "pa-calgar-blue",    notes: "Panel centres, leave the recesses dark.", area: "Armour" },
      { id: "s4", technique: "Edge Highlight", paintId: "pa-fenrisian-grey", notes: "Sharp edge highlight on trim and rims.", area: "Armour" },
      { id: "s5", technique: "Base",           paintId: "pa-retributor",     notes: "Shoulder trim and honour badges.", area: "Trim" },
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
      { id: "s0", technique: "Primer",         paintId: "pa-black-spray",     notes: "Even coat, this recipe leans on the primer staying visible in recesses.", area: "" },
      { id: "s1", technique: "Base",           paintId: "pa-abaddon-black",   notes: "Armour plates, two thin coats.", area: "Armour" },
      { id: "s2", technique: "Glaze",          paintId: "pa-screamer-pink",   notes: "Thin purple glaze in the recesses for corruption.", area: "Armour" },
      { id: "s3", technique: "Base",           paintId: "pa-warplock-bronze", notes: "All trim, rivets and shoulder pads.", area: "Trim" },
      { id: "s4", technique: "Drybrush",       paintId: "pa-sycorax-bronze",  notes: "Light drybrush over the bronze trim only.", area: "Trim" },
      { id: "s5", technique: "Edge Highlight", paintId: "pa-runefang-steel",  notes: "Blade edges and chipped paint effects.", area: "Trim" },
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
  wantToBuy: "forgebook.wantToBuy",
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
