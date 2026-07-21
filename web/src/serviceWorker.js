// Ported from the old app's registerServiceWorker() -- registered once the
// signed-in app shell actually mounts (see Layout.jsx), same timing as the
// old app calling this at the tail of bootIntoApp(), not on every page
// load: a signed-out visitor (the gate, or a public share link) never
// triggers it either way. service-worker.js itself is an unmodified static
// passthrough copied into web/public/ -- it does no caching at all, by
// design, after a past stale-cache incident; this only handles asking for
// updates promptly and reloading once a new one takes over.
let registered = false;

export function registerServiceWorker() {
  if (registered || !('serviceWorker' in navigator)) return;
  registered = true;

  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    reg.update().catch(() => {});
  }).catch(() => {});

  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    location.reload();
  });
}
