-- Full align of public.exercises with kine MVP + createPracticeExercise / usePracticeExercises.
-- Safe on legacy DBs: IF NOT EXISTS + backfill before NOT NULL on title.

alter table public.exercises
  add column if not exists practice_id uuid references public.practices (id) on delete cascade;

alter table public.exercises
  add column if not exists title text;

alter table public.exercises
  add column if not exists description text;

alter table public.exercises
  add column if not exists media_url text;

alter table public.exercises
  add column if not exists is_archived boolean not null default false;

alter table public.exercises
  add column if not exists created_at timestamptz not null default now();

alter table public.exercises
  add column if not exists updated_at timestamptz not null default now();

-- Legacy rows: copy name → title when title empty
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
      set title = coalesce(nullif(trim(title), ''), nullif(trim(name), ''))
      where (title is null or trim(title) = '')
        and name is not null
        and trim(name) <> ''
    $u$;
  end if;
end $$;

update public.exercises
set title = 'Oefening'
where title is null or trim(title) = '';

alter table public.exercises
  alter column title set not null;

create index if not exists exercises_practice_id_idx on public.exercises (practice_id);
create index if not exists exercises_archived_idx on public.exercises (practice_id, is_archived);

comment on table public.exercises is 'Per-practice exercise library (kine MVP).';
