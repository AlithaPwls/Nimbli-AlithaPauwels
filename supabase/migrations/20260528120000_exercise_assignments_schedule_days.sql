-- Planned weekdays per assignment (0 = Monday … 6 = Sunday).

alter table public.exercise_assignments
  add column if not exists schedule_days integer[] not null default '{0,1,2,3,4,5}';

comment on column public.exercise_assignments.schedule_days is
  'Weekdays when this exercise is planned (0=Mon … 6=Sun). Default Mon–Sat.';

update public.exercise_assignments
set schedule_days = '{0,1,2,3,4,5}'
where schedule_days is null
   or cardinality(schedule_days) = 0;

create or replace function public.exercise_assignments_schedule_days_valid(days integer[])
returns boolean
language sql
immutable
as $$
  select
    days is not null
    and cardinality(days) >= 1
    and days <@ array[0, 1, 2, 3, 4, 5, 6]::integer[]
    and cardinality(days) = cardinality(
      (select coalesce(array_agg(distinct d), '{}'::integer[]) from unnest(days) as d)
    );
$$;

alter table public.exercise_assignments
  drop constraint if exists exercise_assignments_schedule_days_chk;

alter table public.exercise_assignments
  add constraint exercise_assignments_schedule_days_chk
  check (public.exercise_assignments_schedule_days_valid(schedule_days));
