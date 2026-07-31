# Forgebook

Forgebook is a paint-recipe tracker and hobby companion for tabletop
miniature painters — Warhammer and D&D miniatures today, more hobbies over
time. Write down how you painted something once (paints, order, technique),
keep a paint rack and shopping list, track what you're building and
painting in the Pile of Potential, and optionally share recipes with other
painters.

Live at **[forgebook.co.uk](https://forgebook.co.uk)**.

## Status

The **`web/`** directory is the real app — a React 19 + Vite + React
Router + TanStack Query rewrite backed by Supabase (Postgres, Auth,
Storage). It's what's actually deployed to production.

The root-level files (`index.html`, `js/`, `css/`) are the original
vanilla-JS, localStorage-only PWA this project started as. They're kept in
the repo purely for rollback confidence and are no longer developed —
all new work happens in `web/`.

## Features

- **Paint recipes** — step-by-step method, organised by faction/army and
  unit, with photos, difficulty, and estimated time
- **Paint rack** — the paints you actually own, a "need to buy" list, and
  colour-matching against the whole paint library
- **Pile of Potential** — a separate build/paint progress tracker (how
  many of a unit are built, primed, painted, finished), plus Projects that
  group several units toward one goal
- **Community layer** — publish recipes, comment, rate and leave notes on
  paints, follow other painters, an activity feed, and moderation tools
  (reporting, an admin review queue)
- **Multi-hobby** — Warhammer is built in by default; D&D miniatures (and
  more later) can be enabled per account

## Tech stack

- **Frontend:** React 19, Vite, React Router 7, TanStack Query, Framer
  Motion — plain `.jsx`, no TypeScript build step (a couple of `@types/*`
  packages are kept only so editors get JS/JSX IntelliSense)
- **Backend:** Supabase — Postgres with Row Level Security, Auth
  (email + password), and Storage for photos
- **Hosting:** GitHub Pages (production), a Cloudflare Worker (a staging
  preview, deployed on the same trigger — see below)

## Local development

```
cd web
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

## Database setup

`supabase/schema.sql` is fully idempotent — every statement is
`IF NOT EXISTS` (or an explicit `DROP ... IF EXISTS` immediately before a
`CREATE`), so it's always safe to paste the whole file into the Supabase
SQL Editor and run it, whether it's a fresh project or one that's already
had an earlier version of the file applied. Re-paste it any time a change
touches this file.

Row Level Security is what actually protects data — the database refuses
to hand back another user's rows, so a frontend bug can't leak anyone's
book. See the file's own header comment and the "Security model" section
below.

## Deployment

Two GitHub Actions workflows watch for pushes to `main` that touch
`web/**`:

- **`deploy-pages.yml`** builds `web/` and publishes it to GitHub Pages —
  this is the real production deploy, served at forgebook.co.uk.
- **`deploy-web-staging.yml`** builds the same code and deploys it to a
  Cloudflare Worker as a separate preview environment. It fires on the
  same push as production, so testing a change on staging first means
  pushing to a branch and running that workflow manually (via
  `workflow_dispatch`, selecting the branch) rather than merging to `main`.

Neither workflow currently runs lint or tests as a gate — `npm run lint`
is available locally but isn't wired into CI yet.

## Security model

- `web/src/supabase.js` hardcodes the Supabase project URL and a
  **publishable (anon) key**. Both are designed to be public and are safe
  to commit — the anon key grants no access on its own. The `service_role`
  key must **never** go here; it bypasses all security and belongs on a
  server, or nowhere at all.
- Row Level Security in Postgres is the actual security boundary, not
  anything in the JavaScript — see `supabase/schema.sql`.
- The photo storage buckets are public-read with unguessable filenames
  (low-risk content — photos of painted miniatures — kept cacheable
  offline this way).

## Legal

`web/src/pages/About.jsx`, `Terms.jsx`, and `Privacy.jsx` cover the
unofficial/not-affiliated-with-Games-Workshop-or-Wizards-of-the-Coast
disclaimer, terms of use, and privacy policy. Their contact/copyright
placeholders still need filling in with a real address.
