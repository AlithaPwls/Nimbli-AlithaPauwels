-- Align profiles.id with auth.users for linked rows, and allow PK updates to propagate.
-- Apply before/with app changes that set profiles.id = auth user id on registration.

-- ---------------------------------------------------------------------------
-- FKs referencing profiles(id): add ON UPDATE CASCADE so profile PK can change
-- (Skipped automatically if MVP tables from 20260407120000 are not present.)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.patients') is not null then
    alter table public.patients
      drop constraint if exists patients_child_profile_id_fkey;
    alter table public.patients
      add constraint patients_child_profile_id_fkey
      foreign key (child_profile_id)
      references public.profiles (id)
      on update cascade
      on delete set null;
  end if;

  if to_regclass('public.patient_exercises') is not null then
    alter table public.patient_exercises
      drop constraint if exists patient_exercises_assigned_by_profile_id_fkey;
    alter table public.patient_exercises
      add constraint patient_exercises_assigned_by_profile_id_fkey
      foreign key (assigned_by_profile_id)
      references public.profiles (id)
      on update cascade
      on delete set null;
  end if;

  if to_regclass('public.exercise_events') is not null then
    alter table public.exercise_events
      drop constraint if exists exercise_events_actor_profile_id_fkey;
    alter table public.exercise_events
      add constraint exercise_events_actor_profile_id_fkey
      foreign key (actor_profile_id)
      references public.profiles (id)
      on update cascade
      on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- One-time backfill: linked profiles use primary key = auth user id
-- (Pending invite rows keep random id until registration updates them.)
-- ---------------------------------------------------------------------------
update public.profiles p
set id = p.user_id
where p.user_id is not null
  and p.id is distinct from p.user_id;
