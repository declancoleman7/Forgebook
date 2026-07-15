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
  updated_at   timestamptz not null default now(),
  primary key (user_id)
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

-- Shared recipes. Published recipes are readable by any SIGNED-IN user (i.e.
-- anyone you've invited) — not by the whole internet. To make published
-- schemes truly public later, change `auth.role() = 'authenticated'` to `true`.
drop policy if exists "read published recipes" on public.recipes;
create policy "read published recipes" on public.recipes
  for select
  using (published = true and deleted = false and auth.role() = 'authenticated');

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
-- point — it's what shows as the author on a shared recipe). Only the owner
-- can change their own.
drop policy if exists "read all profiles" on public.profiles;
create policy "read all profiles" on public.profiles
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "manage own profile" on public.profiles;
create policy "manage own profile" on public.profiles
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);


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
