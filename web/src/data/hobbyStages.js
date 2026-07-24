// The Pile of Potential's fixed build/paint pipeline -- a unit's miniature
// count is split across these, not reduced to one status for the whole
// unit. Order matters (used for both display and the "which stage absorbs
// a quantity change" logic in HobbyLog.jsx's EntryForm).
// Colours are CSS custom properties (forgebook.css's --chart-* tokens, themed
// per light/dark) rather than raw hex -- this exact 7-hue set and order was
// run through the dataviz skill's validate_palette.js, not eyeballed. Two of
// the previous hex values (Assembled/Primed) measured almost identical even
// to full-colour vision (ΔE 4.8, well under the 15 floor) -- don't reorder
// or swap a single slot's hue without re-running the validator.
export const HOBBY_STAGES = [
  { id: 'unassembled', label: 'Unassembled', color: 'var(--chart-blue)' },
  { id: 'assembled', label: 'Assembled', color: 'var(--chart-orange)' },
  { id: 'primed', label: 'Primed', color: 'var(--chart-aqua)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--chart-violet)' },
  { id: 'painted', label: 'Painted', color: 'var(--chart-magenta)' },
  { id: 'based', label: 'Based', color: 'var(--chart-yellow)' },
  { id: 'finished', label: 'Finished', color: 'var(--chart-green)' },
];

// Maps the old single-status pipeline (owned/built/primed/wip/completed)
// onto a starting stage -- used client-side for any row the one-time SQL
// backfill hasn't touched yet (schema.sql's own migration is the real fix;
// this is belt-and-suspenders for the mock and for any stale cached data).
const LEGACY_STATUS_STAGE = { owned: 'unassembled', built: 'assembled', primed: 'primed', wip: 'in_progress', completed: 'finished' };

export function stageCountsFromLegacyStatus(status) {
  return { [LEGACY_STATUS_STAGE[status] || 'unassembled']: 1 };
}

export function stageTotal(stageCounts) {
  return Object.values(stageCounts || {}).reduce((sum, n) => sum + (n || 0), 0);
}

// A single 0-100 "how far along is this, overall" number -- each model
// contributes its own stage's position in the pipeline (Unassembled=0%,
// Finished=100%, everything else spread evenly between), averaged across
// the whole quantity. Softer and more informative than "% finished" alone,
// which would read a unit that's fully Painted but not yet Based/Finished
// as 0% complete.
export function stageProgressPercent(stageCounts, quantity) {
  if (!quantity) return 0;
  const maxIdx = HOBBY_STAGES.length - 1;
  const weighted = HOBBY_STAGES.reduce((sum, s, idx) => sum + (stageCounts?.[s.id] || 0) * (idx / maxIdx), 0);
  return Math.round((weighted / quantity) * 100);
}
