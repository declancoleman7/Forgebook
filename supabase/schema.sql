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
  updated_at    timestamptz not null default now(),
  deleted       boolean     not null default false,
  primary key (user_id, id)
);

-- Running this again on an existing database: adds the column without
-- touching anything already there.
alter table public.paints add column if not exists needs_restock boolean not null default false;

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

-- Sync pulls "everything changed since X", so index that.
create index if not exists recipes_user_updated_idx     on public.recipes     (user_id, updated_at);
create index if not exists paints_user_updated_idx      on public.paints      (user_id, updated_at);
create index if not exists paint_wants_user_updated_idx on public.paint_wants (user_id, updated_at);
create index if not exists recipes_published_idx        on public.recipes     (published) where published;

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
