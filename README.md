# Forgebook — Warhammer Paint Recipe Book (v0.3)

A installable, offline-capable web app for logging and browsing your
miniature paint recipes. Dark, Citadel-Colour-inspired UI; no frameworks,
no build step — just static files.

## What's new in v0.3
- Swipe left/right on a recipe page to flip between recipes (respects your
  current faction filter and search) — with a page indicator, prev/next
  arrows, and arrow-key support on desktop
- Attach a photo of your finished mini to any recipe; it becomes the hero
  image on the card, home screen and recipe page (photos are auto-shrunk
  to phone-friendly size and stored on-device like everything else)
- Smoother directional page transitions; drag follows your finger and
  rubber-bands at the first/last recipe
- Graceful handling when device storage is full

## What's new in v0.2
- Bottom navigation (Home / Recipes / Paints / Settings), sidebar on desktop
- Browse and filter by faction, with colour-coded chips throughout
- Dedicated recipe detail page with a "layer stack" view of the method
  (each step shown in the actual order you paint it, colour-matched to the paint)
- Paint library page — every paint you've used, deduped, with a usage count
- Add / Edit recipe screens with repeating paint and step fields
- Data saved on-device (localStorage) — nothing leaves your phone
- Export/import JSON backup, reset to sample data
- Installable PWA with offline support (service worker)

## Running it locally
No build tools needed. From this folder:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser. (Opening `index.html`
directly via `file://` mostly works too, but the service worker/offline
support only activates when served over http/https.)

## Installing on Android / desktop
Once it's hosted somewhere (see below), open the URL in Chrome and use
**⋮ → Add to Home screen** (Android) or the install icon in the address bar
(desktop Chrome/Edge). It'll behave like a native app: its own icon,
no browser chrome, and full offline use after the first load.

## Deploying to GitHub Pages
To host this at your repo `declancoleman7/Warhammer-recipe-library`:

1. Copy every file in this folder into the root of that repo (keep the
   `css/`, `js/`, and `icons/` folders intact).
2. Commit and push:
   ```
   git add .
   git commit -m "Forgebook v0.3"
   git push
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source**, choose
   **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. After a minute or two it'll be live at:
   `https://declancoleman7.github.io/Warhammer-recipe-library/`

That URL is what you'd open on your phone and add to your home screen.

## Notes
- Data lives in the browser's localStorage, per-device — recipes added on
  your phone won't automatically appear on your PC. Use Settings → Export
  to download a JSON backup and Import it on another device to sync manually.
- Seed data (4 starter recipes) only loads the first time, if no data exists yet.
