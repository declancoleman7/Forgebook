const CACHE_NAME = "forgebook-v5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/data.js",
  "./js/cloud.js",
  "./js/config.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Cross-origin things worth keeping offline: the Supabase client library, and
// recipe photos once they've moved to cloud storage. Without this, an offline
// user would see broken images where their minis used to be.
const RUNTIME_CACHEABLE = [
  "cdn.jsdelivr.net",
  "/storage/v1/object/public/recipe-photos/",
];

function isRuntimeCacheable(url) {
  return RUNTIME_CACHEABLE.some((frag) => url.includes(frag));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin core assets, network-first fallback to cache
// for everything else (e.g. Google Fonts), so the app still works offline
// after the first successful load.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Never cache Supabase API/auth traffic — a cached auth response or a stale
  // recipe list would be worse than no response at all. Photos and the client
  // library are the exceptions, and they're matched explicitly below.
  const isSupabaseApi =
    url.hostname.endsWith(".supabase.co") && !isRuntimeCacheable(req.url);
  if (isSupabaseApi) return;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
              return res;
            })
            .catch(() => caches.match("./index.html"))
      )
    );
  } else {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
