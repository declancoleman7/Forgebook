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
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (user_id, paint_key)
);

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
  content_type text        not null, -- 'recipe_comment' | 'paint_note'
  content_id   uuid        not null,
  reporter_id  uuid        not null references auth.users (id) on delete cascade,
  reason       text,
  created_at   timestamptz not null default now(),
  primary key (id),
  unique (content_type, content_id, reporter_id)
);

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
grant update (display_name, updated_at) on public.profiles to authenticated;

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

-- Readable by anyone who can already read the underlying recipe (including
-- an anonymous visitor on the public share page) — mirrors "read published
-- recipes" exactly. A comment past the report threshold (or hidden by an
-- admin) is additionally visible only to its own author or an admin.
-- Same flagged-hides-from-everyone-but-author shape as paint_notes: a
-- client-filter hit doesn't block the post, it just starts it hidden-pending
-- (status='visible' alone isn't enough to be seen by others; not-flagged is
-- also required), same as an admin explicitly hiding it via status.
drop policy if exists "read comments on visible recipes" on public.recipe_comments;
create policy "read comments on visible recipes" on public.recipe_comments
  for select
  using (
    deleted = false
    and (
      (status = 'visible' and flagged = false)
      or user_id = auth.uid()
      or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
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
drop policy if exists "read visible paint notes" on public.paint_notes;
create policy "read visible paint notes" on public.paint_notes
  for select
  using (
    deleted = false
    and (
      (
        status = 'visible'
        and flagged = false
        and (
          select count(*) from public.reports rep
          where rep.content_type = 'paint_note' and rep.content_id = paint_notes.id
        ) < 3
      )
      or user_id = auth.uid()
      or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin)
    )
  );

drop policy if exists "post paint notes" on public.paint_notes;
create policy "post paint notes" on public.paint_notes
  for insert
  with check (auth.uid() = user_id);

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
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id              uuid        not null default gen_random_uuid(),
  recipient_id    uuid        not null references auth.users (id) on delete cascade,
  actor_id        uuid        references auth.users (id) on delete set null,
  type            text        not null check (type in ('comment', 'rating', 'mention')),
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

-- Notifies the recipe owner (skipped if commenting on your own recipe) plus
-- anyone @mentioned in the body. flagged=false guards both: a filtered
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
begin
  if new.user_id <> new.recipe_owner_id and new.flagged = false then
    insert into public.notifications (recipient_id, actor_id, type, recipe_owner_id, recipe_id, comment_id)
    values (new.recipe_owner_id, new.user_id, 'comment', new.recipe_owner_id, new.recipe_id, new.id);
  end if;

  if new.flagged = false then
    for mentioned in select public.mentioned_profile_ids(new.body, new.user_id) loop
      -- Don't double-notify the recipe owner if they were already notified
      -- above for this exact comment.
      continue when mentioned = new.recipe_owner_id and new.user_id <> new.recipe_owner_id;
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
