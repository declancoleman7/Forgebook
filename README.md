# Forgebook — Warhammer Paint Recipe Book (v0.4)

A installable, offline-capable web app for logging and browsing your
miniature paint recipes. Dark, Citadel-Colour-inspired UI; no frameworks,
no build step — just static files.

## What's new in v0.4
- **All current Games Workshop factions pre-loaded** — 28 Warhammer 40,000
  armies and 23 Age of Sigmar armies, grouped by system and grand alliance,
  plus an "Unaligned & Terrain" bucket for basing and general recipes
- **Faction → Unit → Recipe hierarchy** — open an army to see its units, each
  with a recipe count. Every army also has a **General** bucket for recipes
  that apply force-wide (power armour, basing, trim) rather than to one kit
- **A real paint rack** — paints are now their own thing. Add them once with
  brand, type and colour, then pull them into any recipe from a dropdown. Tap
  a paint to see every recipe that uses it. You can also add a new paint from
  inside the recipe form without losing your place
- **Original emblem artwork** for every faction (see "About the artwork" below),
  with the option to drop in your own image per army
- Seamless upgrade: recipes and paints from v0.1–v0.3 are migrated automatically

## About the artwork
The emblems shipped with Forgebook are **original abstract heraldic marks drawn
for this app**. They are deliberately not reproductions of Games Workshop's
faction icons, which are GW's copyrighted intellectual property — bundling those
into a public repo would not be legitimate.

Faction names are used purely to organise your own recipes. Forgebook is an
unofficial hobby tool and is not affiliated with or endorsed by Games Workshop.

If you'd rather see a different mark for an army in *your* copy, open the faction
page and tap **Change emblem** to use any image from your device. It's stored
locally and never uploaded anywhere.

Note that GW's ranges change (a new edition of 40k is expected in 2026), so treat
the faction list as a starting point.

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
To host this at your repo `declancoleman7/Forgebook`:

1. Copy every file in this folder into the root of that repo (keep the
   `css/`, `js/`, and `icons/` folders intact).
2. Commit and push:
   ```
   git add .
   git commit -m "Forgebook v0.4"
   git push
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source**, choose
   **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. After a minute or two it'll be live at:
   `https://declancoleman7.github.io/Forgebook/`

That URL is what you'd open on your phone and add to your home screen.

## Notes
- Data lives in the browser's localStorage, per-device — recipes added on
  your phone won't automatically appear on your PC. Use Settings → Export
  to download a JSON backup and Import it on another device to sync manually.
- Seed data (5 starter recipes, 20 paints) only loads on a fresh install.
- Upgrading from an older version migrates your existing recipes rather than wiping them.
