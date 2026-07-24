// A rough weight for how much building/painting work one miniature in this
// category takes relative to a baseline Infantry model -- used to compute a
// "weighted" pile size alongside the raw model count, since a Titan or
// vehicle takes vastly longer than a trooper. Deliberately hobby-agnostic
// (not Warhammer-specific battlefield roles) so it fits D&D minis too, e.g.
// a dragon is a Monster same as a Warhammer one. Weights are a judgment
// call, not derived from anything -- adjust freely.
// Same validated 7-hue chart set hobbyStages.js uses (forgebook.css's
// --chart-* tokens), sliced to the 6 slots this breakdown needs -- see that
// file's own comment for why these are CSS custom properties, not raw hex.
export const MODEL_CATEGORIES = [
  { id: 'infantry', label: 'Infantry', weight: 1, color: 'var(--chart-blue)' },
  { id: 'character', label: 'Character', weight: 1.5, color: 'var(--chart-violet)' },
  { id: 'monster', label: 'Monster', weight: 3, color: 'var(--chart-orange)' },
  { id: 'vehicle', label: 'Vehicle', weight: 4, color: 'var(--chart-aqua)' },
  { id: 'titan', label: 'Titan', weight: 10, color: 'var(--chart-magenta)' },
  { id: 'terrain', label: 'Terrain', weight: 2, color: 'var(--chart-yellow)' },
];

export const DEFAULT_MODEL_CATEGORY = 'infantry';

export function categoryLabel(categoryId) {
  return MODEL_CATEGORIES.find((c) => c.id === categoryId)?.label || 'Infantry';
}

export function categoryWeight(categoryId) {
  return MODEL_CATEGORIES.find((c) => c.id === categoryId)?.weight ?? 1;
}

export function categoryColor(categoryId) {
  return MODEL_CATEGORIES.find((c) => c.id === categoryId)?.color || 'var(--gold)';
}
