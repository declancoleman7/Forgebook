// Forgebook is a live, account-required app now -- there is nothing useful it
// can do without a network connection, so this service worker does no
// caching at all. It exists only so the app stays installable (browsers
// require a registered service worker with a fetch handler for the "Add to
// Home Screen" / install prompt); every request is passed straight through
// to the network.
//
// This deliberately replaces an earlier cache-first, then network-first,
// caching strategy: the previous approach was the source of "the app never
// updates" reports -- once anything was cached, some devices kept being
// served that stale copy indefinitely. No caching means that can't happen.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clear out any cache an older version of this service worker left behind.
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", () => {
  // No respondWith() call: the browser's default network handling takes
  // over for every request, untouched.
});
