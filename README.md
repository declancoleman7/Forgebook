# Forgebook — Warhammer Paint Recipe Book (v0.5)

A installable, offline-capable web app for logging and browsing your
miniature paint recipes. Dark, Citadel-Colour-inspired UI; no frameworks,
no build step — just static files.

## What's new in v0.5 — Accounts & Sync

Forgebook now has optional cloud sync, backed by Supabase. It remains
**local-first**: your device's copy is the source of truth the app reads from,
so it still works with no signal at the painting table. The cloud is a
background replica that catches up when it can.

- Sign in with a **magic email link** — no passwords
- **Invite only.** Sign-ups are disabled in Supabase; the only accounts that
  exist are ones you invite. An uninvited address simply never receives a link.
- Recipes and the paint rack sync across all your devices
- Photos move to cloud storage (the database stores a path, not a base64 blob)
- Signing in on a device that already has recipes asks whether to merge them
- Signing out clears the device's copy, so a shared laptop doesn't leak your book
- The app is fully usable **without** signing in — it just stays on that device

### Conflict handling
Each record carries a timestamp; on sync, the newer edit wins, per record.
Timestamps are monotonic per record (always at least 1ms newer than the version
they were edited from), so a device with a fast clock can't strand a later,
genuine edit from another device. Deletes are tombstones, so deleting on your
phone also removes it on your laptop rather than the laptop resurrecting it.

## Setup (one time)

1. **Run the schema.** Supabase dashboard → SQL Editor → New query → paste the
   contents of `supabase/schema.sql` → Run. This creates the tables, the photo
   bucket, and the Row Level Security policies that stop one user reading
   another's book.

2. **Lock the door.** Authentication → Providers → Email:
   - Enable Email
   - **Turn OFF "Allow new users to sign up"** ← this is what makes it invite only
   - Enable "Confirm email"

3. **Set the URLs.** Authentication → URL Configuration:
   - Site URL: `https://forgebook.co.uk`
   - Redirect URLs: add `https://forgebook.co.uk` and `https://forgebook.co.uk/`

4. **Set up email sending.** Supabase's built-in email is rate-limited and meant
   for testing — magic links will start silently failing. Wire up an SMTP
   provider (Resend's free tier is plenty) under Project Settings → Auth → SMTP.
   Do this **before** inviting anyone real.

5. **Invite people.** Authentication → Users → "Invite user" → their email.
   That's the entire access-control system. To revoke someone, delete the user.

6. **Keep the free project awake.** Free Supabase projects pause after 7 days of
   no traffic. Either upgrade to Pro, or add a scheduled GitHub Action that
   pings the API weekly.

## Security notes
- `js/config.js` contains the project URL and the **publishable (anon) key**.
  Both are designed to be public and are safe in this repo. The `service_role`
  key must NEVER go in here — it bypasses all security.
- Row Level Security is what actually protects data: the database refuses to
  return another user's rows, so a frontend bug can't leak anyone's book.
- The photo bucket is **public-read with unguessable filenames**. Photos of
  painted minis are low-risk and this keeps them cacheable offline. If you'd
  rather they were fully private, set `public = false` in schema.sql and switch
  the app to signed URLs.
- You are now storing other people's email addresses. Be prepared to delete an
  account and its data on request.

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
   git commit -m "Forgebook v0.5"
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
