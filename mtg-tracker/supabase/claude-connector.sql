-- Private connector links for Claude. Run once in Supabase: SQL Editor → New query → paste → Run.
-- Only a fingerprint (hash) of each secret link is stored, never the link itself.
create table if not exists public.claude_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  key_hash text unique not null,
  created_at timestamptz not null default now()
);
alter table public.claude_keys enable row level security;
grant select, insert, update, delete on public.claude_keys to authenticated;

drop policy if exists "own claude key" on public.claude_keys;
create policy "own claude key" on public.claude_keys for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The connector itself (the vault-mcp function) runs as service_role. Newer projects don't grant it access
-- to new tables automatically, so allow it to read the links and read/write the vaults it edits.
grant select on public.claude_keys to service_role;
grant select, insert, update on public.collections to service_role;

notify pgrst, 'reload schema';
