// Forgebook seed data
// Faction config: id, label, swatch colour (used as a real functional colour-code
// throughout the UI, not decoration), and icon glyph.
const FACTIONS = [
  { id: "orks", label: "Orks", color: "#5C7A29", glyph: "\u2694" },
  { id: "space-marines", label: "Space Marines", color: "#1B4B6B", glyph: "\u271D" },
  { id: "chaos", label: "Chaos", color: "#5B2E63", glyph: "\u2620" },
  { id: "tyranids", label: "Tyranids", color: "#B8542E", glyph: "\u2749" },
  { id: "generic", label: "Generic", color: "#6B6560", glyph: "\u25C8" },
];

const TECHNIQUES = ["Base", "Shade", "Layer", "Highlight", "Edge Highlight", "Glaze", "Drybrush", "Wash"];

function faction(id) {
  return FACTIONS.find((f) => f.id === id) || FACTIONS[FACTIONS.length - 1];
}

// Each recipe: paints (local to recipe, referenced by id) + steps (ordered method,
// each tied to a technique + a paint). Order is real information: it's the
// sequence you paint in.
const SEED_RECIPES = [
  {
    id: "ORK-001",
    name: "Ork Boyz Skin",
    faction: "orks",
    difficulty: 2,
    heroEmoji: "\uD83D\uDC7A",
    paints: [
      { id: "p1", name: "German Red Brown", brand: "Vallejo", hex: "#5C2E1E" },
      { id: "p2", name: "Bold Titanium White", brand: "Vallejo", hex: "#F1EDE6" },
      { id: "p3", name: "Plaguebearer Flesh", brand: "Citadel", hex: "#8FA55B" },
      { id: "p4", name: "Warboss Green", brand: "Citadel", hex: "#3C5C29" },
    ],
    steps: [
      { id: "s1", technique: "Base", paintId: "p4", notes: "Two thin coats over black primer." },
      { id: "s2", technique: "Wash", paintId: "p1", notes: "Thin wash into all recesses, let pool in wrinkles." },
      { id: "s3", technique: "Layer", paintId: "p3", notes: "Mix 1:1 with base colour, build up on raised muscle." },
      { id: "s4", technique: "Highlight", paintId: "p2", notes: "Tiny dot mix on knuckles, brow ridge, tusks only." },
    ],
    notes: "Works equally well on Nobz. For Deffskulls, swap base for a bone tone.",
  },
  {
    id: "SM-001",
    name: "Ultramarines Power Armour",
    faction: "space-marines",
    difficulty: 3,
    heroEmoji: "\uD83D\uDD35",
    paints: [
      { id: "p1", name: "Macragge Blue", brand: "Citadel", hex: "#1B4B6B" },
      { id: "p2", name: "Nuln Oil", brand: "Citadel", hex: "#1A1A1A" },
      { id: "p3", name: "Calgar Blue", brand: "Citadel", hex: "#3D74A6" },
      { id: "p4", name: "Fenrisian Grey", brand: "Citadel", hex: "#A9B7C0" },
      { id: "p5", name: "Retributor Armour", brand: "Citadel", hex: "#8C6B2A" },
    ],
    steps: [
      { id: "s1", technique: "Base", paintId: "p1", notes: "Even coverage, two coats over grey primer." },
      { id: "s2", technique: "Wash", paintId: "p2", notes: "Full wash over all armour panels." },
      { id: "s3", technique: "Layer", paintId: "p3", notes: "Panel centres, leave recesses dark." },
      { id: "s4", technique: "Highlight", paintId: "p4", notes: "Sharp edge highlight on trim and rims." },
      { id: "s5", technique: "Base", paintId: "p5", notes: "Shoulder trim, aquila and honour badges." },
    ],
    notes: "Chapter icon and honours go on last, after matte varnish on the blue.",
  },
  {
    id: "CSM-001",
    name: "Chaos Trim & Brass",
    faction: "chaos",
    difficulty: 4,
    heroEmoji: "\u2620\uFE0F",
    paints: [
      { id: "p1", name: "Abaddon Black", brand: "Citadel", hex: "#0E0E10" },
      { id: "p2", name: "Screamer Pink", brand: "Citadel", hex: "#5B2E63" },
      { id: "p3", name: "Warplock Bronze", brand: "Citadel", hex: "#6A4A2E" },
      { id: "p4", name: "Sycorax Bronze", brand: "Citadel", hex: "#9C7A45" },
      { id: "p5", name: "Runefang Steel", brand: "Citadel", hex: "#C8CDD1" },
    ],
    steps: [
      { id: "s1", technique: "Base", paintId: "p1", notes: "Armour plates, two thin coats." },
      { id: "s2", technique: "Glaze", paintId: "p2", notes: "Thin purple glaze in the recesses for corruption." },
      { id: "s3", technique: "Base", paintId: "p3", notes: "All trim, rivets and shoulder pads." },
      { id: "s4", technique: "Drybrush", paintId: "p4", notes: "Light drybrush over the bronze trim only." },
      { id: "s5", technique: "Edge Highlight", paintId: "p5", notes: "Blade edges and chipped paint effects." },
    ],
    notes: "Stipple on a little dried blood red near blade tips for a used look.",
  },
  {
    id: "TYR-001",
    name: "Tyranid Carapace",
    faction: "tyranids",
    difficulty: 3,
    heroEmoji: "\uD83E\uDD8B",
    paints: [
      { id: "p1", name: "Rhinox Hide", brand: "Citadel", hex: "#3A2A22" },
      { id: "p2", name: "Fire Dragon Bright", brand: "Citadel", hex: "#B8542E" },
      { id: "p3", name: "Fire Dragon Bright + White", brand: "Citadel/Vallejo", hex: "#D98255" },
      { id: "p4", name: "Ushabti Bone", brand: "Citadel", hex: "#C9B27A" },
    ],
    steps: [
      { id: "s1", technique: "Base", paintId: "p1", notes: "Carapace and claws." },
      { id: "s2", technique: "Layer", paintId: "p2", notes: "Zenithal-style layer leaving deep recesses brown." },
      { id: "s3", technique: "Highlight", paintId: "p3", notes: "Ridge lines only, thin mix, several light coats." },
      { id: "s4", technique: "Edge Highlight", paintId: "p4", notes: "Claw tips and horn points." },
    ],
    notes: "Soft flesh between plates uses a separate warm pink recipe (see notes).",
  },
];

function loadSeedIfEmpty() {
  const existing = localStorage.getItem("forgebook.recipes");
  if (!existing) {
    localStorage.setItem("forgebook.recipes", JSON.stringify(SEED_RECIPES));
  }
  if (!localStorage.getItem("forgebook.recents")) {
    localStorage.setItem("forgebook.recents", JSON.stringify(["ORK-001"]));
  }
}
