-- ============================================================
-- Forgebook — database schema
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste
-- -> Run. It is safe to re-run (everything is IF NOT EXISTS / OR REPLACE).
--
-- The security model lives here, not in the JavaScript. Row Level Security
-- means the database itself refuses to hand over another user's rows, so a
-- bug in the frontend can't leak anyone's book.
-- ============================================================

-- ------------------------------------------------------------
-- Recipes
-- ------------------------------------------------------------
create table if not exists public.recipes (
  id          text        not null,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null,
  faction     text,
  unit        text,
  difficulty  int         default 1,
  photo_path  text,
  steps       jsonb       not null default '[]'::jsonb,
  notes       text        default '',
  published   boolean     not null default false,
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (user_id, id)
);

-- Which hobby this recipe belongs to (see HOBBIES in data.js). The DEFAULT
-- backfills every existing row to 'warhammer' the instant this runs -- that
-- IS the entire migration for pre-existing recipes, no UPDATE needed. No
-- check constraint against a fixed hobby-id list, matching the existing
-- philosophy that faction/unit are unconstrained too -- the known-list is a
-- client-side (data.js) concept, not a DB-enforced one.
alter table public.recipes add column if not exists hobby_id text not null default 'warhammer';
create index if not exists recipes_hobby_idx on public.recipes (user_id, hobby_id);

-- Where in the uploaded photo the "important" part is, normalized 0-1 (0.5,
-- 0.5 is dead center, the CSS default every existing photo already renders
-- at). Lets a user recenter a photo whose subject isn't centered instead of
-- letting each display context's own background-position: center crop it
-- out -- one focal point works across every context (card thumbnail, full
-- detail hero, feed card) since each just crops around the same point at
-- its own aspect ratio, same idea as Instagram/most CMS "focal point" tools.
alter table public.recipes add column if not exists photo_focal_x real not null default 0.5;
alter table public.recipes add column if not exists photo_focal_y real not null default 0.5;
alter table public.recipes drop constraint if exists recipes_photo_focal_x_check;
alter table public.recipes add constraint recipes_photo_focal_x_check check (photo_focal_x between 0 and 1);
alter table public.recipes drop constraint if exists recipes_photo_focal_y_check;
alter table public.recipes add constraint recipes_photo_focal_y_check check (photo_focal_y between 0 and 1);

-- ------------------------------------------------------------
-- Paint rack
-- ------------------------------------------------------------
create table if not exists public.paints (
  id            text        not null,
  user_id       uuid        not null references auth.users (id) on delete cascade,
  name          text        not null,
  brand         text,
  hex           text,
  type          text,
  needs_restock boolean     not null default false,
  quantity      int         not null default 1,
  updated_at    timestamptz not null default now(),
  deleted       boolean     not null default false,
  primary key (user_id, id)
);

-- Running this again on an existing database: adds the column without
-- touching anything already there.
alter table public.paints add column if not exists needs_restock boolean not null default false;
alter table public.paints add column if not exists quantity int not null default 1;

-- Same shape as data.js's paintKey(name, brand), computed here so the
-- paint-rating notification trigger can match a paint_ratings row back to
-- owned paints without re-deriving the string by hand in plpgsql.
-- coalesce(brand,'') matters: brand is nullable, and NULL || anything is
-- NULL in SQL (unlike JS's "" fallback) -- without it, every brandless
-- paint would silently generate a paint_key that can never match anything.
alter table public.paints add column if not exists paint_key text
  generated always as (lower(trim(name)) || '|' || lower(trim(coalesce(brand, '')))) stored;
create index if not exists paints_paint_key_idx on public.paints (paint_key);

-- ------------------------------------------------------------
-- Paint shopping list (the paint-library "need to buy" flag) — deliberately
-- separate from paints: these are library paints the user doesn't own yet,
-- so they have no business in the rack or the recipe-step paint picker.
-- ------------------------------------------------------------
create table if not exists public.paint_wants (
  paint_key   text        not null,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  type        text        not null default '',
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (user_id, paint_key, type)
);

-- Widens the primary key so Base/Spray-style type-variants of the same
-- name+brand can be wanted independently -- PAINT_LIBRARY has ~30 pairs
-- like this, and a shared (user_id, paint_key) key meant toggling one
-- variant's "want to buy" silently flipped its sibling too. Existing rows
-- default to type='' ("wants any type of this paint"), which still matches
-- every variant until the user re-toggles a specific one. Unconditional
-- drop-then-recreate so this is safe to paste again once already applied.
alter table public.paint_wants add column if not exists type text not null default '';
alter table public.paint_wants drop constraint if exists paint_wants_pkey;
alter table public.paint_wants add primary key (user_id, paint_key, type);

-- ------------------------------------------------------------
-- Profiles — just enough to show "shared by X" on someone else's recipe.
-- auth.users itself is never exposed to other users' clients, so a shared
-- recipe's author needs a separate, publicly-readable row. Created/kept in
-- sync client-side (see cloud.js ensureProfile) rather than a DB trigger, so
-- it also backfills existing invited users the first time they sign in.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  display_name text        not null,
  is_admin     boolean     not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id)
);

-- Running this again on an existing database: adds the column without
-- touching anything already there.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists avatar_path text;
-- Which hobby (see HOBBIES in data.js) a fresh device/session should start
-- on -- null means "no explicit default set," which the client treats the
-- same as 'warhammer'. Distinct from the per-device "what am I looking at
-- right now" value (plain localStorage, never synced): this is what makes
-- a chosen default follow the account across devices.
alter table public.profiles add column if not exists default_hobby_id text;

-- Account-level moderation action, distinct from hiding a single piece of
-- content: a banned account is refused at sign-in (see AuthContext.jsx),
-- not revoked mid-session -- this column is only ever read/written by an
-- admin (see the RLS policy + column grant below), never the account
-- owner themselves.
alter table public.profiles add column if not exists is_banned boolean not null default false;

-- ------------------------------------------------------------
-- Faction emblems — an admin-uploaded image for an army that replaces the
-- built-in mark for EVERYONE, not just the uploader's own device (unlike the
-- personal "Change emblem" override, which stays local-only by design).
-- ------------------------------------------------------------
create table if not exists public.faction_emblems (
  faction_id  text        not null,
  image_path  text        not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users (id) on delete set null,
  primary key (faction_id)
);

-- ------------------------------------------------------------
-- Comments on published recipes. recipe_owner_id+recipe_id together
-- reference one recipe unambiguously, since recipes.id is only unique
-- per-author (recipes' primary key is the composite (user_id, id)).
-- ------------------------------------------------------------
create table if not exists public.recipe_comments (
  id              uuid        not null default gen_random_uuid(),
  recipe_owner_id uuid        not null,
  recipe_id       text        not null,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  body            text        not null,
  edited          boolean     not null default false,
  flagged         boolean     not null default false,
  status          text        not null default 'visible',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted         boolean     not null default false,
  primary key (id),
  foreign key (recipe_owner_id, recipe_id) references public.recipes (user_id, id) on delete cascade,
  check (char_length(body) between 1 and 500)
);

-- flagged was added after this table's initial release -- create table if
-- not exists is a permanent no-op on a database that already has this
-- table, so (unlike paint_notes, which had flagged from its first release)
-- this column needs its own explicit migration to reach an existing table.
alter table public.recipe_comments add column if not exists flagged boolean not null default false;

-- One level deep only -- enforced as a UI convention (the composer never
-- offers "Reply" on a comment that's itself a reply), not a DB constraint;
-- a check constraint can't see a parent's own parent_comment_id without a
-- trigger, and depth-limiting isn't a security boundary worth that
-- complexity. The "post comments" insert policy below does still check
-- that a reply's parent belongs to the same recipe, which is a real
-- integrity concern (not just a nicety).
alter table public.recipe_comments add column if not exists parent_comment_id uuid references public.recipe_comments (id) on delete cascade;
create index if not exists recipe_comments_parent_idx on public.recipe_comments (parent_comment_id);

-- ------------------------------------------------------------
-- Reports — one shared table for both recipe comments and paint notes,
-- rather than a bespoke table per content type. content_id is deliberately
-- not foreign-keyed to a specific table (it points at whichever table
-- content_type names); the unique constraint is what makes "auto-hide past
-- N reports" resistant to a single abuser spamming reports, by forcing N
-- distinct reporters.
-- ------------------------------------------------------------
create table if not exists public.reports (
  id           uuid        not null default gen_random_uuid(),
  content_type text        not null, -- 'recipe_comment' | 'paint_note' | 'recipe_photo' | 'avatar_photo'
  content_id   uuid        not null,
  reporter_id  uuid        not null references auth.users (id) on delete cascade,
  reason       text,
  created_at   timestamptz not null default now(),
  primary key (id),
  unique (content_type, content_id, reporter_id)
);

-- Widened from uuid: a recipe's own id is text (e.g. "ORK-001", unique only
-- per-owner, not globally), so a 'recipe_photo' report needs content_id to
-- hold the composite string "{ownerId}:{recipeId}" instead of a bare uuid
-- (neither half ever contains ":", so this is unambiguous to split back
-- apart client-side). Deliberately NOT a separate nullable owner-id column:
-- that would make the unique constraint above silently uncheckable for
-- every OTHER content type, since NULL never equals NULL in a unique
-- constraint -- comments/notes have no owner id, so they'd all read NULL
-- there and stop colliding on repeat reports of the same item. Safe to
-- re-run: casting text to text is a no-op once already migrated.
--
-- Postgres refuses to ALTER COLUMN TYPE on a column any RLS policy
-- (anywhere, not just on this table) depends on -- both
-- "read comments on visible recipes" and "read visible paint notes" (below,
-- in the RLS section) subquery reports.content_id, so re-running this
-- against a database that already has those policies from a prior paste
-- fails with "cannot alter type of a column used in a policy definition"
-- unless they're dropped first. Both get recreated fresh in their normal
-- place later in this file -- this is just so the drop happens BEFORE the
-- type change, not after.
drop policy if exists "read comments on visible recipes" on public.recipe_comments;
drop policy if exists "read visible paint notes" on public.paint_notes;
alter table public.reports alter column content_id type text using content_id::text;

-- Lets the admin area track "still needs a look" vs "already handled"
-- instead of every report sitting in one undifferentiated pile forever --
-- the auto-hide-at-3-reports behaviour below is separate and unaffected by
-- this (it counts ALL reports regardless of status, matching how it always
-- has); this is purely for the admin queue's own view.
alter table public.reports add column if not exists status text not null default 'open';
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check check (status in ('open', 'resolved', 'dismissed'));
alter table public.reports add column if not exists resolved_by uuid references auth.users (id) on delete set null;
alter table public.reports add column if not exists resolved_at timestamptz;
create index if not exists reports_status_idx on public.reports (status, created_at);

-- ------------------------------------------------------------
-- Community notes on library paints — freeform tips ("this is similar to a
-- discontinued shade", "more like a wash than a contrast") that don't fit
-- PAINT_LIBRARY's structured fields. Keyed by paint_key exactly like
-- paint_wants, since PAINT_LIBRARY entries have no id/DB row of their own.
-- `flagged` is a client-side profanity-filter result kept server-side as
-- defense-in-depth; `status` is for admin moderation; the report-count
-- auto-hide itself is enforced entirely by the read policy below, not a
-- column, so there's nothing here that needs a trigger to stay in sync.
-- ------------------------------------------------------------
create table if not exists public.paint_notes (
  id          uuid        not null default gen_random_uuid(),
  paint_key   text        not null,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  body        text        not null,
  flagged     boolean     not null default false,
  status      text        not null default 'visible',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (id),
  check (char_length(body) between 1 and 500)
);

-- ------------------------------------------------------------
-- Paint ratings — one rating per user per paint (upsertable), same
-- (user_id, paint_key) shape as paint_wants. Fully public-readable, which is
-- what lets the aggregate view below stay a plain view.
-- ------------------------------------------------------------
create table if not exists public.paint_ratings (
  paint_key  text        not null,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  stars      int         not null,
  updated_at timestamptz not null default now(),
  deleted    boolean     not null default false,
  primary key (user_id, paint_key),
  check (stars between 1 and 5)
);

-- Site-wide avg+count per paint, computed once here rather than the client
-- running ~2000 individual queries across PAINT_LIBRARY. No security_invoker
-- clause: paint_ratings is already fully public-read (see RLS below), and
-- that clause needs Postgres 15+, which isn't worth depending on when the
-- extra precision is moot against an already-public base table.
create or replace view public.paint_rating_summary as
select paint_key, round(avg(stars), 2) as avg_stars, count(*) as rating_count
from public.paint_ratings
where deleted = false
group by paint_key;

-- ------------------------------------------------------------
-- Recipe likes/dislikes — a quick one-tap engagement signal, distinct from
-- the considered 1-5 star paint ratings above. Recipes are keyed by
-- (user_id, id), not a single string like paint_key, so this needs the same
-- recipe_owner_id+recipe_id composite recipe_comments already uses to point
-- at one recipe unambiguously.
-- ------------------------------------------------------------
create table if not exists public.recipe_votes (
  recipe_owner_id uuid        not null,
  recipe_id       text        not null,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  value           int         not null,
  updated_at      timestamptz not null default now(),
  deleted         boolean     not null default false,
  primary key (user_id, recipe_owner_id, recipe_id),
  foreign key (recipe_owner_id, recipe_id) references public.recipes (user_id, id) on delete cascade,
  check (value in (-1, 1))
);
create index if not exists recipe_votes_recipe_idx on public.recipe_votes (recipe_owner_id, recipe_id);

-- Comment likes -- upvote-only (no dislike), unlike recipe_votes above.
-- A plain join table (liked = row exists) rather than a value column.
create table if not exists public.comment_votes (
  comment_id uuid        not null references public.recipe_comments (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists comment_votes_comment_idx on public.comment_votes (comment_id);

-- Same "don't leak that a hidden/reported comment exists" concern as
-- recipe_comment_counts below -- a plain view bypasses recipe_comments' own
-- RLS entirely, so this where-clause reproduces its public-visible subset.
create or replace view public.comment_vote_counts as
select cv.comment_id, count(*) as like_count
from public.comment_votes cv
join public.recipe_comments c on c.id = cv.comment_id
where c.deleted = false and c.status = 'visible' and c.flagged = false
group by cv.comment_id;

-- Both counts stored (net is computed client-side for display) so dislike
-- counts stay independently queryable later even though only the net score
-- is ever shown. Fully public, same as paint_rating_summary above -- nothing
-- this exposes isn't already publicly readable via the RLS below.
create or replace view public.recipe_vote_summary as
select recipe_owner_id, recipe_id,
  count(*) filter (where value =  1) as like_count,
  count(*) filter (where value = -1) as dislike_count
from public.recipe_votes
where deleted = false
group by recipe_owner_id, recipe_id;

-- A site-wide comment count per recipe for the activity feed's preview
-- cards -- recipe_comments has no such aggregate today (per-recipe counts
-- are only ever fetched on demand when actually viewing that recipe).
-- Unlike the vote/rating views above, recipe_comments' own RLS is NOT fully
-- public (it hides flagged/non-visible rows from everyone but that
-- comment's own author and admins) -- a plain view bypasses that RLS
-- entirely, so this view's own where-clause is the only thing standing
-- between a stranger and a count that would otherwise leak "there's a
-- hidden/reported comment here." The filter below deliberately reproduces
-- only the PUBLIC subset of "read comments on visible recipes"'s own
-- condition, and deliberately does NOT special-case the viewer being the
-- comment's author or an admin -- even a comment's own author sees the same
-- public-only count everyone else on the feed does.
create or replace view public.recipe_comment_counts as
select recipe_owner_id, recipe_id, count(*) as comment_count
from public.recipe_comments
where deleted = false and status = 'visible' and flagged = false
group by recipe_owner_id, recipe_id;

-- ------------------------------------------------------------
-- Saved/bookmarked recipes and paints -- purely personal bookkeeping, unlike
-- recipe_votes/paint_ratings above: no public count, no aggregate view, and
-- (matching this session's own "don't notify on votes, it's noisy"
-- precedent) no notification on being saved. Composite key for recipes
-- (same recipe_owner_id+recipe_id shape recipe_votes/recipe_comments use,
-- since recipes are keyed (user_id, id) not a single string); a bare
-- paint_key for paints (same shape as paint_wants, since PAINT_LIBRARY
-- entries have no DB row of their own).
-- ------------------------------------------------------------
create table if not exists public.saved_recipes (
  recipe_owner_id uuid        not null,
  recipe_id       text        not null,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, recipe_owner_id, recipe_id),
  foreign key (recipe_owner_id, recipe_id) references public.recipes (user_id, id) on delete cascade
);

create table if not exists public.saved_paints (
  paint_key  text        not null,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, paint_key)
);

-- ------------------------------------------------------------
-- Which extra hobbies a user has opted into (see HOBBIES in data.js).
-- Warhammer is never a row here -- it's always implicitly enabled for every
-- account (see enabledHobbyIds() in app.js) -- so an account that's never
-- touched this feature has zero rows here, needing zero backfill either.
-- Private, like saved_recipes/saved_paints above (not public like follows):
-- nobody else needs to see which hobbies an account has enabled.
-- ------------------------------------------------------------
create table if not exists public.user_hobbies (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  hobby_id   text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, hobby_id)
);

-- ------------------------------------------------------------
-- Follows -- unlike saved_recipes/saved_paints above, this is inherently
-- public-facing: the whole point of a follower/following count and list is
-- that other people can see it, same as recipe_votes/paint_ratings' fully
-- public shape (see the read policy below), not saves' private one.
-- ------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid        not null references auth.users (id) on delete cascade,
  followed_id uuid        not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index if not exists follows_followed_idx on public.follows (followed_id);

-- ------------------------------------------------------------
-- Hobby log — a personal project tracker separate from recipes
-- themselves ("how I painted it" vs "what I'm working on and how far
-- along it is"). Reuses the recipe-photos bucket (per-user-folder RLS
-- already allows any path under the owner's own folder) rather than a
-- dedicated bucket. Public entries appear on the owner's profile;
-- everything else about the log stays private by default.
-- ------------------------------------------------------------
create table if not exists public.hobby_log_entries (
  id          uuid        not null default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  notes       text        default '',
  status      text        not null default 'owned',
  hobby_id    text,
  faction_id  text,
  photo_path  text,
  is_public   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (id),
  -- A physical-assembly pipeline, not just a generic progress label: bought
  -- it, built it, primed it, painting it, done.
  check (status in ('owned', 'built', 'primed', 'wip', 'completed')),
  check (char_length(title) between 1 and 120)
);

-- create table if not exists is a permanent no-op on a database that
-- already has this table, so the original new/wip/completed check needs
-- its own explicit migration to widen to the 5-stage pipeline above.
alter table public.hobby_log_entries drop constraint if exists hobby_log_entries_status_check;
alter table public.hobby_log_entries add constraint hobby_log_entries_status_check check (status in ('owned', 'built', 'primed', 'wip', 'completed'));
alter table public.hobby_log_entries alter column status set default 'owned';

-- Superseded by quantity + stage_counts below (a real unit tracker, not one
-- status per whole project) -- status itself is kept, not dropped, so a
-- mistake here is never unrecoverable; the app simply stops reading it.
alter table public.hobby_log_entries add column if not exists quantity integer not null default 1;
alter table public.hobby_log_entries add column if not exists stage_counts jsonb not null default '{}'::jsonb;

-- One-time backfill for rows created before quantity/stage_counts existed --
-- guarded by "stage_counts = '{}'" so re-pasting this file never re-runs it
-- against an already-migrated row.
update public.hobby_log_entries
set quantity = 1,
    stage_counts = jsonb_build_object(
      case status
        when 'owned' then 'unassembled'
        when 'built' then 'assembled'
        when 'primed' then 'primed'
        when 'wip' then 'in_progress'
        else 'finished'
      end,
      1
    )
where stage_counts = '{}'::jsonb;

create index if not exists hobby_log_user_updated_idx on public.hobby_log_entries (user_id, updated_at);
create index if not exists hobby_log_public_idx on public.hobby_log_entries (user_id, created_at) where is_public and not deleted;

-- Which of the owner's own recipes were used on a logged project --
-- many-to-many, since Paint Pad's version lets one project reference
-- several recipes (e.g. armour recipe + base recipe).
create table if not exists public.hobby_log_recipes (
  log_id          uuid not null references public.hobby_log_entries (id) on delete cascade,
  recipe_owner_id uuid not null,
  recipe_id       text not null,
  primary key (log_id, recipe_owner_id, recipe_id),
  foreign key (recipe_owner_id, recipe_id) references public.recipes (user_id, id) on delete cascade
);

-- A Project groups several existing units toward one goal (e.g. "Blood
-- Angels army," "Tournament list") -- it has no quantity/stage_counts of
-- its own; its progress is always derived by summing whichever units are
-- linked to it (see hobby_log_project_entries below), same "derive, don't
-- duplicate" approach the dashboard's own charts already use.
create table if not exists public.hobby_log_projects (
  id          uuid        not null default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  notes       text        default '',
  hobby_id    text,
  is_public   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (id),
  check (char_length(title) between 1 and 120)
);
create index if not exists hobby_log_projects_user_updated_idx on public.hobby_log_projects (user_id, updated_at);

-- Many-to-many: a unit can belong to more than one Project (e.g. the same
-- squad counting toward both an army project and a tournament-list
-- project), same shape as hobby_log_recipes above.
create table if not exists public.hobby_log_project_entries (
  project_id uuid not null references public.hobby_log_projects (id) on delete cascade,
  entry_id   uuid not null references public.hobby_log_entries (id) on delete cascade,
  primary key (project_id, entry_id)
);

-- Sync pulls "everything changed since X", so index that.
create index if not exists recipes_user_updated_idx     on public.recipes     (user_id, updated_at);
create index if not exists paints_user_updated_idx      on public.paints      (user_id, updated_at);
create index if not exists paint_wants_user_updated_idx on public.paint_wants (user_id, updated_at);
create index if not exists recipes_published_idx        on public.recipes     (published) where published;
create index if not exists recipe_comments_recipe_idx   on public.recipe_comments (recipe_owner_id, recipe_id, created_at);
create index if not exists reports_content_idx          on public.reports     (content_type, content_id);
create index if not exists paint_notes_key_idx          on public.paint_notes (paint_key, created_at);
create index if not exists paint_ratings_key_idx         on public.paint_ratings (paint_key);

-- Fast case-insensitive display-name search for the profile finder.
create extension if not exists pg_trgm;
create index if not exists profiles_display_name_trgm_idx on public.profiles using gin (display_name gin_trgm_ops);

-- Names must be unique (case-insensitive) once they show up as recipe
-- authors, @mentions and search results.
create unique index if not exists profiles_display_name_unique_idx on public.profiles (lower(display_name));

-- Anonymous-callable availability check for the signup form -- profiles' own
-- RLS only lets signed-in users read arbitrary rows, so a plain select from
-- the pre-confirmation signup screen can't see enough to be accurate. This
-- exposes nothing but a boolean.
create or replace function public.display_name_available(p_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(display_name) = lower(trim(p_name))
  );
$$;

grant execute on function public.display_name_available(text) to anon, authenticated;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.recipes  enable row level security;
alter table public.paints   enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "own recipes" on public.recipes;
create policy "own recipes" on public.recipes
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lets an admin clear a reported photo off someone else's recipe (see the
-- admin queue's useHideContent) -- same broad for-update shape as "admin
-- moderate comments"/"admin moderate paint notes" below, no column-grant
-- restriction, matching how "admin manage faction emblems" is already an
-- unrestricted for-all policy rather than the profiles-specific column-
-- grant pattern. The only code path that ever exercises this sends
-- {photo_path: null}, but the policy itself doesn't enforce that narrowly.
drop policy if exists "admin hide recipe photos" on public.recipes;
create policy "admin hide recipe photos" on public.recipes
  for update
  using      (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin));

drop policy if exists "own paints" on public.paints;
create policy "own paints" on public.paints
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Shared recipes. Published recipes are public — readable by anyone,
-- signed in or not — so a share link works for someone with no Forgebook
-- account at all. Only the published/deleted flags gate this; nothing about
-- the author's identity or their other (unpublished) recipes is exposed.
drop policy if exists "read published recipes" on public.recipes;
create policy "read published recipes" on public.recipes
  for select
  using (published = true and deleted = false);

-- A shared recipe's steps reference the author's own paint ids, so those
-- specific paints need to be readable too (not the author's whole rack —
-- only the ones actually used in a recipe they've published).
drop policy if exists "read paints used in published recipes" on public.paints;
create policy "read paints used in published recipes" on public.paints
  for select
  using (
    exists (
      select 1 from public.recipes r
      where r.user_id = paints.user_id
        and r.published = true
        and r.deleted = false
        and (
          r.steps @> jsonb_build_array(jsonb_build_object('paintId', paints.id))
          or r.steps @> jsonb_build_array(jsonb_build_object('mixPaintId', paints.id))
        )
    )
  );

-- Anyone signed in can see anyone else's display name (that's the whole
-- point — it's what shows as the author on a shared recipe). Anyone at all
-- (signed in or not) can see the display name of someone who has at least
-- one published recipe, since that name shows up on that recipe's public
-- share page too — everyone else's name stays behind the sign-in wall. Only
-- the owner can change their own.
drop policy if exists "read all profiles" on public.profiles;
create policy "read all profiles" on public.profiles
  for select
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.recipes r
      where r.user_id = profiles.user_id and r.published = true and r.deleted = false
    )
  );

drop policy if exists "manage own profile" on public.profiles;
create policy "manage own profile" on public.profiles
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS alone can't stop a column value being changed within a row you're
-- otherwise allowed to touch — that needs a column-level grant. Nobody signs
-- themselves up as admin through the app: is_admin can only ever be flipped
-- by re-running the bootstrap block below directly in the SQL editor.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_path, default_hobby_id, updated_at) on public.profiles to authenticated;
grant update (is_banned) on public.profiles to authenticated;

-- A policy defined ON profiles that needs to check profiles' OWN is_admin
-- column can't just subquery profiles directly the way every other admin
-- check in this file does (those all live on a DIFFERENT table checking
-- profiles) -- that would subject the subquery to profiles' own RLS,
-- including this very policy, tripping "infinite recursion detected in
-- policy for relation" (42P17). Same gotcha comment_parent_in_same_recipe()
-- above works around, same fix: a security-definer function bypasses RLS
-- on its own internal lookup.
create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce((select is_admin from public.profiles where user_id = p_user_id), false);
$$;

-- Lets an admin update ANY account's row for the columns already granted
-- to `authenticated` above -- is_banned (for bans) and, since it's granted
-- from the very first line too, avatar_path (for the admin queue's hide-
-- reported-avatar action). Column GRANTs in Postgres are role-wide, not
-- scoped per-policy, so this policy's row-level admission (is_admin) is
-- really what's doing the work here, not the grant -- display_name and
-- default_hobby_id are technically reachable through this same policy too
-- (both already granted above for the owner's own use), there's just no
-- code path today that ever asks it to touch them.
drop policy if exists "admin manage bans" on public.profiles;
create policy "admin manage bans" on public.profiles
  for update
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Faction emblems: readable by anyone signed in, writable only by an admin.
alter table public.faction_emblems enable row level security;

drop policy if exists "read faction emblems" on public.faction_emblems;
create policy "read faction emblems" on public.faction_emblems
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin manage faction emblems" on public.faction_emblems;
create policy "admin manage faction emblems" on public.faction_emblems
  for all
  using      (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin));

-- ------------------------------------------------------------
-- Comments, reports, paint notes, paint ratings
-- ------------------------------------------------------------
alter table public.recipe_comments enable row level security;
alter table public.reports         enable row level security;
alter table public.paint_notes     enable row level security;
alter table public.paint_ratings   enable row level security;
alter table public.recipe_votes    enable row level security;

-- Readable by anyone who can already read the underlying recipe (including
-- an anonymous visitor on the public share page) — mirrors "read published
-- recipes" exactly. A comment past the report threshold (or hidden by an
-- admin) is additionally visible only to its own author or an admin.
-- Same flagged-hides-from-everyone-but-author shape as paint_notes: a
-- client-filter hit doesn't block the post, it just starts it hidden-pending
-- (status='visible' alone isn't enough to be seen by others; not-flagged is
-- also required), same as an admin explicitly hiding it via status.
-- The "deleted = true and user_id = auth.uid()" branch exists purely so a
-- soft-delete (an UPDATE setting deleted=true) doesn't 42501 -- Postgres
-- needs to re-select the row it just wrote to confirm the write, and that
-- re-select is subject to this same SELECT policy; if the row you just
-- deleted became invisible to you too, Postgres reports that as "new row
-- violates row-level security policy" rather than quietly hiding it. This
-- does NOT resurface deleted comments anywhere: fetchComments() (cloud.js)
-- already filters .eq("deleted", false) itself, so the client never
-- actually requests (or displays) a comment once it's been deleted --
-- this only unblocks the deletion itself.
drop policy if exists "read comments on visible recipes" on public.recipe_comments;
create policy "read comments on visible recipes" on public.recipe_comments
  for select
  using (
    (
      (
        deleted = false
        and (
          (
            status = 'visible'
            and flagged = false
            and (
              select count(*) from public.reports rep
              where rep.content_type = 'recipe_comment' and rep.content_id = recipe_comments.id::text
            ) < 3
          )
          or user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
        )
      )
      or (deleted = true and user_id = auth.uid())
    )
    and exists (
      select 1 from public.recipes r
      where r.user_id = recipe_comments.recipe_owner_id
        and r.id = recipe_comments.recipe_id
        and r.published = true and r.deleted = false
    )
  );

-- auth.uid() = user_id can never be satisfied by an anonymous request, so
-- this is authenticated-only without needing an explicit role check.
-- A raw correlated subquery on recipe_comments directly inside that table's
-- own policy (see below) trips Postgres's RLS engine into "infinite
-- recursion detected in policy for relation" (42P17) -- a well-known
-- gotcha, not an actual logical loop: evaluating the policy re-applies RLS
-- to the inner query, which needs the same policy again. A security
-- definer function sidesteps it by running the inner check without RLS,
-- same reasoning as mentioned_profile_ids() below.
create or replace function public.comment_parent_in_same_recipe(p_parent_id uuid, p_recipe_owner_id uuid, p_recipe_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.recipe_comments pc
    where pc.id = p_parent_id
      and pc.recipe_owner_id = p_recipe_owner_id
      and pc.recipe_id = p_recipe_id
  );
$$;

-- Rate limiting: nothing else stops a signed-in account from posting
-- comments back-to-back with no limit -- the lowest-effort spam vector in
-- the app (unlike a recipe, which takes real effort to fill out, or a
-- vote, already capped to one-per-item by its own unique constraint).
-- Counting a user's own recent rows in the SAME table an insert policy is
-- being evaluated for hits the identical infinite-recursion gotcha
-- comment_parent_in_same_recipe() above already works around -- same fix,
-- a security-definer function runs the count without RLS.
create or replace function public.recent_recipe_comment_count(p_user_id uuid, p_minutes int)
returns int
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select count(*)::int from public.recipe_comments
  where user_id = p_user_id and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

drop policy if exists "post comments on published recipes" on public.recipe_comments;
create policy "post comments on published recipes" on public.recipe_comments
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes r
      where r.user_id = recipe_owner_id and r.id = recipe_id
        and r.published = true and r.deleted = false
    )
    -- A reply's parent must belong to the same recipe -- otherwise a
    -- buggy or malicious client could link a reply to a comment on an
    -- entirely different recipe, producing a nonsensical cross-recipe
    -- thread. This is the one part of "one level deep" actually worth an
    -- RLS check (see the parent_comment_id column comment above).
    and (
      parent_comment_id is null
      or public.comment_parent_in_same_recipe(parent_comment_id, recipe_owner_id, recipe_id)
    )
    -- Generous enough for genuine back-and-forth conversation, tight
    -- enough to stop a flood. A rejection here surfaces client-side as
    -- Postgres error code 42501 -- see useComments.js's useAddComment.
    and public.recent_recipe_comment_count(auth.uid(), 5) < 10
  );

-- Covers both a text edit (edited=true) and the author's own soft-delete
-- (deleted=true) — there's no separate delete policy for this table.
drop policy if exists "edit own comments" on public.recipe_comments;
create policy "edit own comments" on public.recipe_comments
  for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "admin moderate comments" on public.recipe_comments;
create policy "admin moderate comments" on public.recipe_comments
  for update
  using      (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin));

drop policy if exists "file a report" on public.reports;
create policy "file a report" on public.reports
  for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "read own or admin reports" on public.reports;
create policy "read own or admin reports" on public.reports
  for select
  using (
    auth.uid() = reporter_id
    or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
  );

drop policy if exists "admin manage reports" on public.reports;
create policy "admin manage reports" on public.reports
  for all
  using      (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin));

-- Publicly readable like the paint library itself, EXCEPT a note past the
-- report threshold (3 distinct reporters), which only its own author and an
-- admin can still see. The threshold check happens right here, at read
-- time — no denormalized counter, no trigger.
-- A note is visible to everyone only while it's status='visible', NOT
-- flagged by the client-side filter, and under the report threshold; its own
-- author (and an admin) can always see it regardless, which is what lets the
-- author's own view show a "pending review" note instead of it just
-- vanishing on them.
-- Same "deleted = true and user_id = auth.uid()" carve-out as recipe_comments'
-- read policy above, and for the identical reason: removePaintNoteRemote()
-- soft-deletes via UPDATE, which needs to re-select the row it just wrote
-- to confirm the write -- without this, that re-select fails RLS the
-- instant deleted flips to true, even for the note's own author, and
-- Postgres reports it as "new row violates row-level security policy"
-- instead of just going through. fetchPaintNotes() already filters
-- deleted=false itself, so this doesn't resurface deleted notes anywhere.
drop policy if exists "read visible paint notes" on public.paint_notes;
create policy "read visible paint notes" on public.paint_notes
  for select
  using (
    (
      deleted = false
      and (
        (
          status = 'visible'
          and flagged = false
          and (
            select count(*) from public.reports rep
            where rep.content_type = 'paint_note' and rep.content_id = paint_notes.id::text
          ) < 3
        )
        or user_id = auth.uid()
        or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
      )
    )
    or (deleted = true and user_id = auth.uid())
  );

-- Same rate-limiting reasoning and security-definer-function-to-avoid-
-- recursion fix as recent_recipe_comment_count() above.
create or replace function public.recent_paint_note_count(p_user_id uuid, p_minutes int)
returns int
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select count(*)::int from public.paint_notes
  where user_id = p_user_id and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

drop policy if exists "post paint notes" on public.paint_notes;
create policy "post paint notes" on public.paint_notes
  for insert
  with check (
    auth.uid() = user_id
    and public.recent_paint_note_count(auth.uid(), 5) < 10
  );

-- Same soft-delete-via-update convention as recipe_comments.
drop policy if exists "manage own paint notes" on public.paint_notes;
create policy "manage own paint notes" on public.paint_notes
  for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "admin moderate paint notes" on public.paint_notes;
create policy "admin moderate paint notes" on public.paint_notes
  for update
  using      (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin));

drop policy if exists "own paint rating" on public.paint_ratings;
create policy "own paint rating" on public.paint_ratings
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fully public — this is what makes paint_rating_summary safe to expose to
-- everyone without leaking anything beyond the aggregate itself.
drop policy if exists "read all paint ratings" on public.paint_ratings;
create policy "read all paint ratings" on public.paint_ratings
  for select
  using (deleted = false);

-- One policy (not comments' insert/update split) covers insert, update, AND
-- delete: with check gates insert/update on "still published, not your own
-- recipe" -- retracting a vote (delete only evaluates `using`) always works,
-- even on a recipe that's since been unpublished.
drop policy if exists "own recipe vote" on public.recipe_votes;
create policy "own recipe vote" on public.recipe_votes
  for all
  using      (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and recipe_owner_id <> user_id
    and exists (
      select 1 from public.recipes r
      where r.user_id = recipe_owner_id and r.id = recipe_id
        and r.published = true and r.deleted = false
    )
  );

-- Fully public, same rationale as "read all paint ratings" above -- this is
-- what makes both a fully-visible dislike count and recipe_vote_summary safe.
drop policy if exists "read all recipe votes" on public.recipe_votes;
create policy "read all recipe votes" on public.recipe_votes
  for select
  using (deleted = false);

-- Comment likes -- unlike recipe_votes above, NOT fully public: a like on a
-- hidden/pending comment must stay as invisible to a stranger as the
-- comment itself (same reasoning as comment_vote_counts' view above).
-- Self-like is blocked by the with-check's "c.user_id <> auth.uid()".
alter table public.comment_votes enable row level security;

drop policy if exists "own comment vote" on public.comment_votes;
create policy "own comment vote" on public.comment_votes
  for all
  using      (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipe_comments c
      where c.id = comment_id and c.user_id <> auth.uid()
    )
  );

drop policy if exists "read comment votes on visible comments" on public.comment_votes;
create policy "read comment votes on visible comments" on public.comment_votes
  for select
  using (
    exists (
      select 1 from public.recipe_comments c
      where c.id = comment_id
        and (
          (c.deleted = false and c.status = 'visible' and c.flagged = false)
          or c.user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
        )
    )
  );

-- No public "read all" policy on either table below, unlike recipe_votes/
-- paint_ratings above -- a save is private to the saver, nobody else ever
-- needs to read another user's saved rows, so a single "for all" policy
-- covers select/insert/update/delete.
alter table public.saved_recipes enable row level security;

drop policy if exists "own saved recipes" on public.saved_recipes;
create policy "own saved recipes" on public.saved_recipes
  for all
  using      (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes r
      where r.user_id = recipe_owner_id and r.id = recipe_id
        and r.published = true and r.deleted = false
    )
  );

alter table public.saved_paints enable row level security;

drop policy if exists "own saved paints" on public.saved_paints;
create policy "own saved paints" on public.saved_paints
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.user_hobbies enable row level security;

drop policy if exists "manage own hobbies" on public.user_hobbies;
create policy "manage own hobbies" on public.user_hobbies
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fully public (to any signed-in user), same rationale as "read all recipe
-- votes"/"read all paint ratings" above -- the whole point of a follower/
-- following count and list is that other people can see it. Self-follow is
-- blocked by the table's own check constraint, not RLS.
alter table public.follows enable row level security;

drop policy if exists "read all follows" on public.follows;
create policy "read all follows" on public.follows
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "manage own follows" on public.follows;
create policy "manage own follows" on public.follows
  for all
  using      (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

-- ------------------------------------------------------------
-- Notifications — this codebase's first DB triggers, and the first RLS
-- where the whole point is that clients can never insert at all: rows are
-- only ever created by the security-definer trigger functions below, which
-- bypass RLS the same way a table owner always does. If a future edit ever
-- adds a client-facing insert policy "just to test something", that would
-- let any signed-in user forge a notification to anyone -- don't.
--
-- Columns are sparse/nullable because which ones apply depends on `type`:
-- a mention sourced from a paint note has no recipe_owner_id/recipe_id, a
-- rating notification has no comment_id, etc.
--
-- 'like' notifies only on a genuine like (never a dislike, and never a
-- same-value re-upsert or a retraction) -- see notify_on_recipe_vote below.
-- A vote is otherwise a one-tap, high-frequency action, which is why this
-- was deliberately excluded when voting first shipped; scoping it to just
-- likes keeps that original noise concern in mind rather than ignoring it.
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id              uuid        not null default gen_random_uuid(),
  recipient_id    uuid        not null references auth.users (id) on delete cascade,
  actor_id        uuid        references auth.users (id) on delete set null,
  type            text        not null check (type in ('comment', 'rating', 'mention', 'like', 'reply')),
  recipe_owner_id uuid,
  recipe_id       text,
  comment_id      uuid        references public.recipe_comments (id) on delete cascade,
  paint_note_id   uuid        references public.paint_notes (id) on delete cascade,
  paint_key       text,
  read            boolean     not null default false,
  created_at      timestamptz not null default now(),
  primary key (id),
  foreign key (recipe_owner_id, recipe_id) references public.recipes (user_id, id) on delete cascade
);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, read, created_at desc);

-- create table if not exists is a permanent no-op on a database that
-- already has this table, so widening the inline check above needs its own
-- explicit migration to reach one that predates the 'like'/'reply' types.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in ('comment', 'rating', 'mention', 'like', 'reply', 'comment_like'));

-- Lets the rating trigger's steps @> ... containment check (below) use an
-- index instead of scanning every published recipe row it's handed.
create index if not exists recipes_steps_gin_idx on public.recipes using gin (steps jsonb_path_ops);

alter table public.notifications enable row level security;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select
  using (auth.uid() = recipient_id);

-- Covers both "mark one read" and "mark all read" -- one update policy,
-- gated on recipient identity both before AND after the write.
drop policy if exists "mark own notifications read" on public.notifications;
create policy "mark own notifications read" on public.notifications
  for update
  using      (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- No client insert/delete at all (only the security-definer triggers below
-- create rows), and even the one row a recipient can touch, only its own
-- read flag is theirs to change -- same column-level lockdown pattern as
-- profiles.is_admin above.
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

-- ------------------------------------------------------------
-- Resolves every "@Display Name" mention in a comment/note body to real
-- profiles.user_id values, longest-display-name-first so "@Declan Smith"
-- is preferred over a shorter "@Declan" that's a prefix of it, and a match
-- only counts if the character right after it isn't itself a name
-- character (so "@DeclanSmith" doesn't false-hit a user literally named
-- "Declan"). Case-insensitive: with zero autocomplete UI, forcing exact-
-- case typing would silently drop real mentions nobody would ever notice
-- failed. Runs DB-side (not client-side) for the same reliability reason
-- as the triggers below: a mention must resolve no matter which client
-- path wrote the comment/note, and a client has no efficient way to know
-- every display name in the system to match against anyway.
-- ------------------------------------------------------------
create or replace function public.mentioned_profile_ids(body text, exclude_user uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  names text[];
  ids uuid[];
  n int;
  i int;
  at_pos int;
  search_from int := 1;
  match_len int;
  candidate text;
  boundary_char text;
  found_id uuid;
  result_ids uuid[] := '{}';
begin
  select array_agg(display_name order by length(display_name) desc),
         array_agg(user_id      order by length(display_name) desc)
    into names, ids
  from public.profiles
  where display_name is not null and length(trim(display_name)) > 0;

  if names is null then
    return;
  end if;
  n := array_length(names, 1);

  loop
    at_pos := position('@' in substring(body from search_from));
    exit when at_pos = 0;
    at_pos := search_from + at_pos - 1;

    found_id := null;
    for i in 1..n loop
      match_len := length(names[i]);
      candidate := substring(body from at_pos + 1 for match_len);
      if candidate is not null and lower(candidate) = lower(names[i]) then
        boundary_char := substring(body from at_pos + 1 + match_len for 1);
        if (boundary_char is null or boundary_char !~ '[[:alnum:]_]') and ids[i] <> exclude_user then
          found_id := ids[i];
        end if;
        exit;
      end if;
    end loop;

    if found_id is not null and not (found_id = any(result_ids)) then
      result_ids := result_ids || found_id;
    end if;

    search_from := at_pos + 1;
  end loop;

  return query select unnest(result_ids);
end;
$$;

-- Notifies the recipe owner (skipped if commenting on your own recipe),
-- the parent comment's author if this is a reply (skipped if that's the
-- same person as the recipe owner, already notified above, or the replier
-- themselves), plus anyone @mentioned in the body who isn't already
-- covered by one of those two. flagged=false guards all three: a filtered
-- (hidden-pending) comment must not ping anyone, since the recipient's own
-- read policy on recipe_comments would hide it from them anyway -- a dead
-- deep-link, not a leak, but confusing, and this is exactly the kind of
-- check that's easy to silently drop in a future edit (see this repo's own
-- paint_notes.flagged history).
create or replace function public.notify_on_recipe_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  mentioned uuid;
  parent_author uuid;
begin
  if new.user_id <> new.recipe_owner_id and new.flagged = false then
    insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id, comment_id)
    values (new.recipe_owner_id, new.user_id, 'comment', new.recipe_owner_id, new.recipe_id, new.id);
  end if;

  if new.parent_comment_id is not null and new.flagged = false then
    select user_id into parent_author from public.recipe_comments where id = new.parent_comment_id;
    if parent_author is not null and parent_author <> new.user_id and parent_author <> new.recipe_owner_id then
      insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id, comment_id)
      values (parent_author, new.user_id, 'reply', new.recipe_owner_id, new.recipe_id, new.id);
    end if;
  end if;

  if new.flagged = false then
    for mentioned in select public.mentioned_profile_ids(new.body, new.user_id) loop
      -- Don't double-notify the recipe owner or the parent comment's
      -- author if they were already notified above for this exact comment.
      continue when mentioned = new.recipe_owner_id and new.user_id <> new.recipe_owner_id;
      continue when mentioned = parent_author and new.parent_comment_id is not null;
      insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id, comment_id)
      values (mentioned, new.user_id, 'mention', new.recipe_owner_id, new.recipe_id, new.id);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists recipe_comments_notify on public.recipe_comments;
create trigger recipe_comments_notify
  after insert on public.recipe_comments
  for each row execute function public.notify_on_recipe_comment();

-- A paint note has no "owner" to notify about -- mentions only.
create or replace function public.notify_on_paint_note()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  mentioned uuid;
begin
  if new.flagged = false then
    for mentioned in select public.mentioned_profile_ids(new.body, new.user_id) loop
      insert into public.notifications (recipient_id, actor_id, type, paint_key, paint_note_id)
      values (mentioned, new.user_id, 'mention', new.paint_key, new.id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists paint_notes_notify on public.paint_notes;
create trigger paint_notes_notify
  after insert on public.paint_notes
  for each row execute function public.notify_on_paint_note();

-- "Someone rated a paint that appears in one of your published recipes" --
-- resolves via paint_ratings.paint_key -> paints (same paint_key, any
-- owner) -> recipes (that owner, published, not deleted, steps references
-- that paint's id). This is the one genuinely expensive query in this
-- design (worst case O(users owning a same-named paint x their published
-- recipe count), run on every rating write) -- acceptable at this app's
-- current scale given both new indexes above keep every hop indexed, but
-- worth reconsidering (e.g. dropping the published/steps hop entirely in
-- favour of "rated a paint in your rack") if the user base grows a lot.
-- Fires on insert or on stars actually changing (not a same-value re-
-- upsert) -- ratings are upsertable, so "new rating" isn't always a fresh
-- row.
create or replace function public.notify_on_paint_rating()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  hit record;
begin
  if new.deleted then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.stars is not distinct from old.stars then
    return new;
  end if;

  for hit in
    select distinct r.user_id as owner_id, r.id as recipe_id
    from public.paints p
    join public.recipes r on r.user_id = p.user_id
    where p.paint_key = new.paint_key
      and r.published = true
      and r.deleted = false
      and r.user_id <> new.user_id
      and (
        r.steps @> jsonb_build_array(jsonb_build_object('paintId', p.id))
        or r.steps @> jsonb_build_array(jsonb_build_object('mixPaintId', p.id))
      )
  loop
    insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id, paint_key)
    values (hit.owner_id, new.user_id, 'rating', hit.owner_id, hit.recipe_id, new.paint_key);
  end loop;

  return new;
end;
$$;

drop trigger if exists paint_ratings_notify on public.paint_ratings;
create trigger paint_ratings_notify
  after insert or update of stars on public.paint_ratings
  for each row execute function public.notify_on_paint_rating();

-- "Someone liked your recipe" -- fires only on a genuine "now liked"
-- transition: a fresh insert with value = 1, or an update where the value
-- actually changed to 1 (e.g. dislike -> like). Deliberately does not fire
-- for a dislike, a same-value re-upsert (not reachable anyway --
-- voteOnRecipe retracts rather than re-upserts an unchanged value), or a
-- retraction (a real DELETE, which no trigger here is attached to). No
-- self-notify guard needed: recipe_votes' own "own recipe vote" RLS already
-- requires recipe_owner_id <> user_id for every insert/update, and the
-- recipe must already be published+undeleted to pass that same check -- so
-- both are already guaranteed by the time this trigger runs.
create or replace function public.notify_on_recipe_vote()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.value = 1 and (tg_op = 'INSERT' or old.value is distinct from new.value) then
    insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id)
    values (new.recipe_owner_id, new.user_id, 'like', new.recipe_owner_id, new.recipe_id);
  end if;
  return new;
end;
$$;

drop trigger if exists recipe_votes_notify on public.recipe_votes;
create trigger recipe_votes_notify
  after insert or update of value on public.recipe_votes
  for each row execute function public.notify_on_recipe_vote();

-- "Someone liked your comment" -- fires on every fresh insert (a genuine
-- new like, since unliking is a real DELETE with no trigger attached, so
-- retract-then-re-like is treated as a new like each time, not deduped).
-- Self-like is already blocked by comment_votes' own "own comment vote"
-- with-check, so no self-notify guard is needed here.
create or replace function public.notify_on_comment_vote()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  comment_author uuid;
  r_owner uuid;
  r_id text;
begin
  select user_id, recipe_owner_id, recipe_id into comment_author, r_owner, r_id
  from public.recipe_comments where id = new.comment_id;

  if comment_author is not null then
    insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id, comment_id)
    values (comment_author, new.user_id, 'comment_like', r_owner, r_id, new.comment_id);
  end if;

  return new;
end;
$$;

drop trigger if exists comment_votes_notify on public.comment_votes;
create trigger comment_votes_notify
  after insert on public.comment_votes
  for each row execute function public.notify_on_comment_vote();

-- ------------------------------------------------------------
-- Hobby log RLS
-- ------------------------------------------------------------
alter table public.hobby_log_entries enable row level security;
alter table public.hobby_log_recipes enable row level security;
alter table public.hobby_log_projects enable row level security;
alter table public.hobby_log_project_entries enable row level security;

drop policy if exists "own hobby log entries" on public.hobby_log_entries;
create policy "own hobby log entries" on public.hobby_log_entries
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "read public hobby log entries" on public.hobby_log_entries;
create policy "read public hobby log entries" on public.hobby_log_entries
  for select
  using (is_public = true and deleted = false);

drop policy if exists "manage own hobby log recipes" on public.hobby_log_recipes;
create policy "manage own hobby log recipes" on public.hobby_log_recipes
  for all
  using      (exists (select 1 from public.hobby_log_entries e where e.id = log_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.hobby_log_entries e where e.id = log_id and e.user_id = auth.uid()));

drop policy if exists "read hobby log recipes on visible entries" on public.hobby_log_recipes;
create policy "read hobby log recipes on visible entries" on public.hobby_log_recipes
  for select
  using (exists (
    select 1 from public.hobby_log_entries e
    where e.id = log_id and (e.user_id = auth.uid() or (e.is_public = true and e.deleted = false))
  ));

drop policy if exists "own hobby log projects" on public.hobby_log_projects;
create policy "own hobby log projects" on public.hobby_log_projects
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "read public hobby log projects" on public.hobby_log_projects;
create policy "read public hobby log projects" on public.hobby_log_projects
  for select
  using (is_public = true and deleted = false);

drop policy if exists "manage own hobby log project entries" on public.hobby_log_project_entries;
create policy "manage own hobby log project entries" on public.hobby_log_project_entries
  for all
  using      (exists (select 1 from public.hobby_log_projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.hobby_log_projects p where p.id = project_id and p.user_id = auth.uid()));

drop policy if exists "read hobby log project entries on visible projects" on public.hobby_log_project_entries;
create policy "read hobby log project entries on visible projects" on public.hobby_log_project_entries
  for select
  using (exists (
    select 1 from public.hobby_log_projects p
    where p.id = project_id and (p.user_id = auth.uid() or (p.is_public = true and p.deleted = false))
  ));

-- ------------------------------------------------------------
-- Admin bootstrap — run this block (just this block) whenever you want to
-- grant or move admin. Safe to re-run: it's a no-op if that person is
-- already an admin, and it only ever touches the one row matched by email.
-- ------------------------------------------------------------
insert into public.profiles (user_id, display_name, is_admin)
select id, split_part(email, '@', 1), true
from auth.users
where email = 'declan.coleman@designid.co.uk'
on conflict (user_id) do update set is_admin = true;


-- ============================================================
-- Photo storage
-- ============================================================
-- Create the bucket (public read, unguessable filenames). Photos of painted
-- miniatures are low-risk, and a public bucket keeps them cacheable offline.
-- If you'd rather they were fully private, set public = false here and ask me
-- to switch the app to signed URLs.
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- Users may only write inside a folder named after their own user id.
drop policy if exists "own photos upload" on storage.objects;
create policy "own photos upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own photos update" on storage.objects;
create policy "own photos update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own photos delete" on storage.objects;
create policy "own photos delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos readable" on storage.objects;
create policy "photos readable" on storage.objects
  for select
  using (bucket_id = 'recipe-photos');

-- ============================================================
-- Avatar storage — identical per-user-folder-scoped approach to recipe
-- photos above, just a separate bucket so an avatar upload can never
-- collide with (or be confused for) a recipe photo path.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatar-photos', 'avatar-photos', true)
on conflict (id) do nothing;

drop policy if exists "own avatar upload" on storage.objects;
create policy "own avatar upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatar-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own avatar update" on storage.objects;
create policy "own avatar update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatar-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own avatar delete" on storage.objects;
create policy "own avatar delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatar-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars readable" on storage.objects;
create policy "avatars readable" on storage.objects
  for select
  using (bucket_id = 'avatar-photos');

-- ============================================================
-- Faction emblem storage — same public-bucket approach as recipe photos,
-- but the write side is admin-only rather than per-user-folder, since these
-- are shared images meant to replace the built-in mark for every user.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('faction-emblems', 'faction-emblems', true)
on conflict (id) do nothing;

drop policy if exists "admin faction emblems upload" on storage.objects;
create policy "admin faction emblems upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'faction-emblems'
    and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
  );

drop policy if exists "admin faction emblems update" on storage.objects;
create policy "admin faction emblems update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'faction-emblems'
    and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
  );

drop policy if exists "admin faction emblems delete" on storage.objects;
create policy "admin faction emblems delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'faction-emblems'
    and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
  );

drop policy if exists "faction emblems readable" on storage.objects;
create policy "faction emblems readable" on storage.objects
  for select
  using (bucket_id = 'faction-emblems');
