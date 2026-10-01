-- Allow any characters in usernames (letters, spaces, symbols, emoji). Run once in the SQL Editor.
-- Names are still unique, ignoring capitals: "Shinyu" and "shinyu" can't both exist.
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles add constraint profiles_username_check
  check (char_length(username) between 2 and 30 and username = btrim(username));
create unique index if not exists profiles_username_lower on public.profiles (lower(username));
notify pgrst, 'reload schema';
