-- Cumulative XP per child profile; awarded on successful exercise_sessions inserts.

alter table public.profiles
  add column if not exists total_xp integer not null default 0;

comment on column public.profiles.total_xp is
  'Cumulatieve XP van voltooide oefeningen (alleen kindprofielen).';

-- Backfill from historical successful sessions.
update public.profiles p
set total_xp = coalesce(
  (
    select sum(coalesce(e.xp_value, 0))::integer
    from public.exercise_sessions es
    join public.exercises e on e.id = es.exercise_id
    where es.child_id = p.id
      and es.success is true
  ),
  0
)
where p.role = 'child';

update public.profiles
set total_xp = 0
where role <> 'child';

-- Block client-side total_xp edits unless the award trigger sets a session flag.
create or replace function public.protect_profiles_total_xp()
returns trigger
language plpgsql
as $$
begin
  if new.total_xp is distinct from old.total_xp
     and current_setting('nimbli.allow_total_xp_update', true) is distinct from 'true'
  then
    new.total_xp := old.total_xp;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_total_xp on public.profiles;
create trigger protect_profiles_total_xp
  before update of total_xp on public.profiles
  for each row
  execute function public.protect_profiles_total_xp();

-- Award XP when a child completes an exercise successfully.
create or replace function public.award_child_xp_on_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp integer;
begin
  if new.success is not true then
    return new;
  end if;

  select coalesce(e.xp_value, 0)
  into v_xp
  from public.exercises e
  where e.id = new.exercise_id;

  if v_xp is null or v_xp <= 0 then
    return new;
  end if;

  perform set_config('nimbli.allow_total_xp_update', 'true', true);

  update public.profiles
  set total_xp = total_xp + v_xp
  where id = new.child_id
    and role = 'child';

  perform set_config('nimbli.allow_total_xp_update', 'false', true);

  return new;
end;
$$;

drop trigger if exists award_child_xp_on_session on public.exercise_sessions;
create trigger award_child_xp_on_session
  after insert on public.exercise_sessions
  for each row
  execute function public.award_child_xp_on_session();
