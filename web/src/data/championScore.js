// A single "community contribution" number for a profile, built entirely
// from data that's already public via existing RLS (published recipes,
// visible comments, likes on both) -- nothing here needs a schema change or
// a new aggregate view. Weights are a judgement call, not derived from
// anything: a published recipe is the biggest single contribution (a full
// guide someone else can follow), a like is validated community approval,
// a comment is the lightest-effort of the three.
export const CHAMPION_WEIGHTS = { recipe: 5, comment: 1, like: 2 };

export function championScore({ recipesPublished, commentCount, likesReceived }) {
  return (
    (recipesPublished || 0) * CHAMPION_WEIGHTS.recipe +
    (commentCount || 0) * CHAMPION_WEIGHTS.comment +
    (likesReceived || 0) * CHAMPION_WEIGHTS.like
  );
}

// Purely cosmetic tiers so the number means something at a glance -- no
// gameplay effect, just a label under the score.
const TIERS = [
  { min: 50, label: 'Legend' },
  { min: 20, label: 'Champion' },
  { min: 5, label: 'Contributor' },
  { min: 0, label: 'Newcomer' },
];

export function championTier(score) {
  return TIERS.find((t) => score >= t.min).label;
}
