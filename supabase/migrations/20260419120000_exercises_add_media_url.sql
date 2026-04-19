-- Remote DBs may predate kine MVP migration or omit columns; ensure media URL storage exists.
alter table public.exercises add column if not exists media_url text null;
