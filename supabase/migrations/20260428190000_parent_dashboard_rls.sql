-- Parent read access for ouder dashboard screens.
-- Goal: an authenticated parent can read only:
-- - their own profile row
-- - linked child profile rows (same invite_code)
-- - patients linked to those child profiles
-- - assignments/events/exercises for those patients

-- ---------------------------------------------------------------------------
-- profiles (parent + linked children)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "parent_select_own_and_linked_profiles" on public.profiles;
create policy "parent_select_own_and_linked_profiles"
on public.profiles
for select
to authenticated
using (
  -- parent can always read own profile row
  public.profiles.user_id = auth.uid()
  or exists (
    -- parent can read child profiles with same invite_code
    select 1
    from public.profiles parent
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and public.profiles.role = 'child'
      and public.profiles.invite_code = parent.invite_code
  )
);

-- ---------------------------------------------------------------------------
-- patients (linked via child_profile_id)
-- ---------------------------------------------------------------------------
alter table public.patients enable row level security;

drop policy if exists "parent_select_patients_linked_children" on public.patients;
create policy "parent_select_patients_linked_children"
on public.patients
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles parent
    join public.profiles child
      on child.role = 'child'
     and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and public.patients.child_profile_id = child.id
  )
);

-- ---------------------------------------------------------------------------
-- patient_exercises (assignments for accessible patients)
-- ---------------------------------------------------------------------------
alter table public.patient_exercises enable row level security;

drop policy if exists "parent_select_patient_exercises_linked_children" on public.patient_exercises;
create policy "parent_select_patient_exercises_linked_children"
on public.patient_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pat
    join public.profiles parent
      on parent.user_id = auth.uid()
     and parent.role = 'parent'
    join public.profiles child
      on child.role = 'child'
     and child.invite_code = parent.invite_code
    where parent.invite_code is not null
      and pat.id = public.patient_exercises.patient_id
      and pat.child_profile_id = child.id
  )
);

-- ---------------------------------------------------------------------------
-- exercise_events (events for accessible patients)
-- ---------------------------------------------------------------------------
alter table public.exercise_events enable row level security;

drop policy if exists "parent_select_exercise_events_linked_children" on public.exercise_events;
create policy "parent_select_exercise_events_linked_children"
on public.exercise_events
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pat
    join public.profiles parent
      on parent.user_id = auth.uid()
     and parent.role = 'parent'
    join public.profiles child
      on child.role = 'child'
     and child.invite_code = parent.invite_code
    where parent.invite_code is not null
      and pat.id = public.exercise_events.patient_id
      and pat.child_profile_id = child.id
  )
);

-- ---------------------------------------------------------------------------
-- exercises (only those referenced by accessible assignments)
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;

drop policy if exists "parent_select_exercises_linked_children" on public.exercises;
create policy "parent_select_exercises_linked_children"
on public.exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.patient_exercises pe
    join public.patients pat
      on pat.id = pe.patient_id
    join public.profiles parent
      on parent.user_id = auth.uid()
     and parent.role = 'parent'
    join public.profiles child
      on child.role = 'child'
     and child.invite_code = parent.invite_code
    where parent.invite_code is not null
      and pe.exercise_id = public.exercises.id
      and pat.child_profile_id = child.id
  )
);

