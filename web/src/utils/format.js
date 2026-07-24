// For a downloaded/shared file name -- e.g. "Warboss Green Skin" -> "warboss-green-skin".
export function slug(s) {
  return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
}

// Shared by RecipeDetail's own metastrip and the share card canvas (see
// utils/shareCard.js) -- both need to agree on the same estimate.
export function estimatedMinutes(r) {
  const steps = (r.steps || []).length;
  if (!steps) return 0;
  return Math.max(5, Math.round((steps * 12) / 5) * 5);
}
export function formatDuration(mins) {
  if (!mins) return '—';
  if (mins < 60) return `~${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

export function relativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.round(hours / 24);
  if (days < 14) return days + 'd ago';
  return new Date(iso).toLocaleDateString();
}
