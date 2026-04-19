-- Legacy `exercises.name` NOT NULL while the app uses `title` (MVP). Keep rows consistent
-- and allow inserts that only set `title`.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'name'
  ) then
    execute $u$
      update public.exercises
      set name = coalesce(nullif(trim(name), ''), nullif(trim(title), ''), 'Oefening')
      where name is null or trim(name) = ''
    $u$;
    execute 'alter table public.exercises alter column name drop not null';
  end if;
end $$;
