-- Friends, profiles and sharing. Run this once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run more than once. Needs schema.sql to have been run first.

-- ---------- Profiles: your username, display name, picture and who can see your collection ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (char_length(username) between 2 and 30 and username = btrim(username)),
  display_name text check (char_length(display_name) <= 40),
  avatar_url text,
  collection_visibility text not null default 'private' check (collection_visibility in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));
alter table public.profiles enable row level security;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

drop policy if exists "profiles are readable" on public.profiles;
drop policy if exists "create own profile" on public.profiles;
drop policy if exists "edit own profile" on public.profiles;
create policy "profiles are readable" on public.profiles for select using (true);
create policy "create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "edit own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- Friendships: a request from one person to another, then accepted ----------
create table if not exists public.friendships (
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
alter table public.friendships enable row level security;
grant select, insert, update, delete on public.friendships to authenticated;

drop policy if exists "see own friendships" on public.friendships;
drop policy if exists "send requests" on public.friendships;
drop policy if exists "accept requests" on public.friendships;
drop policy if exists "remove friendships" on public.friendships;
create policy "see own friendships" on public.friendships for select to authenticated
  using (auth.uid() in (requester, addressee));
create policy "send requests" on public.friendships for insert to authenticated
  with check (auth.uid() = requester and status = 'pending');
create policy "accept requests" on public.friendships for update to authenticated
  using (auth.uid() = addressee) with check (auth.uid() = addressee and status = 'accepted');
create policy "remove friendships" on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

-- ---------- What someone is allowed to see of another person's vault ----------
-- Returns only the decks whose visibility allows it, and the loose cards if the collection allows it.
-- Your own data stays private in the collections table; this is the only way others can read it.
create or replace function public.shared_collection(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  allowed text[];
  vault jsonb;
  coll_vis text;
begin
  select collection_visibility into coll_vis from profiles where id = target;
  if not found then return null; end if;

  if viewer = target then
    allowed := array['public', 'friends', 'private'];
  elsif exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester = viewer and addressee = target) or (requester = target and addressee = viewer))
  ) then
    allowed := array['public', 'friends'];
  else
    allowed := array['public'];
  end if;

  select data into vault from collections where user_id = target;
  return jsonb_build_object(
    'decks', coalesce((
      select jsonb_agg(d) from jsonb_array_elements(coalesce(vault -> 'decks', '[]'::jsonb)) d
      where coalesce(d ->> 'visibility', 'private') = any (allowed)
    ), '[]'::jsonb),
    'loose', case when coll_vis = any (allowed) then coalesce(vault -> 'loose', '[]'::jsonb) else null end,
    'relationship', case when viewer = target then 'me' when 'friends' = any (allowed) then 'friend' else 'stranger' end
  );
end;
$$;
grant execute on function public.shared_collection(uuid) to anon, authenticated;

-- ---------- Profile pictures (uploaded photos) ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars are public" on storage.objects;
drop policy if exists "upload own avatar" on storage.objects;
drop policy if exists "replace own avatar" on storage.objects;
drop policy if exists "delete own avatar" on storage.objects;
create policy "avatars are public" on storage.objects for select using (bucket_id = 'avatars');
create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
