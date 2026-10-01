-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
-- One row per user holding their whole collection (decks + loose cards) as JSON.

create table if not exists public.collections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Let logged-in users reach the table through Supabase's API
-- (newer projects don't always do this automatically).
grant select, insert, update on public.collections to authenticated;

-- Row level security: each logged-in user can only see and change their own row.
alter table public.collections enable row level security;

drop policy if exists "read own collection" on public.collections;
drop policy if exists "insert own collection" on public.collections;
drop policy if exists "update own collection" on public.collections;

create policy "read own collection" on public.collections
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own collection" on public.collections
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own collection" on public.collections
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Make the API notice the table straight away.
notify pgrst, 'reload schema';
