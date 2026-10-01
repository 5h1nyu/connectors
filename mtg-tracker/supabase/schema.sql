-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- One row per user holding their whole collection (decks + loose cards) as JSON.

create table if not exists public.collections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row level security: each logged-in user can only see and change their own row.
alter table public.collections enable row level security;

create policy "read own collection" on public.collections
  for select using (auth.uid() = user_id);
create policy "insert own collection" on public.collections
  for insert with check (auth.uid() = user_id);
create policy "update own collection" on public.collections
  for update using (auth.uid() = user_id);
