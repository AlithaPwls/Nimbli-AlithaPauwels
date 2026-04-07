-- RLS + policies for kine MVP tables
-- Goal: a logged-in kinesiologist can only access rows for their practice_id.
-- Implementation: scope by public.profiles(user_id=auth.uid(), role='kine', practice_id=...).

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
alter table public.patients enable row level security;

drop policy if exists "kine_select_patients_same_practice" on public.patients;
create policy "kine_select_patients_same_practice"
on public.patients
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patients.practice_id
  )
);

drop policy if exists "kine_insert_patients_same_practice" on public.patients;
create policy "kine_insert_patients_same_practice"
on public.patients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patients.practice_id
  )
);

drop policy if exists "kine_update_patients_same_practice" on public.patients;
create policy "kine_update_patients_same_practice"
on public.patients
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patients.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patients.practice_id
  )
);

drop policy if exists "kine_delete_patients_same_practice" on public.patients;
create policy "kine_delete_patients_same_practice"
on public.patients
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patients.practice_id
  )
);

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;

drop policy if exists "kine_select_exercises_same_practice" on public.exercises;
create policy "kine_select_exercises_same_practice"
on public.exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercises.practice_id
  )
);

drop policy if exists "kine_insert_exercises_same_practice" on public.exercises;
create policy "kine_insert_exercises_same_practice"
on public.exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercises.practice_id
  )
);

drop policy if exists "kine_update_exercises_same_practice" on public.exercises;
create policy "kine_update_exercises_same_practice"
on public.exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercises.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercises.practice_id
  )
);

drop policy if exists "kine_delete_exercises_same_practice" on public.exercises;
create policy "kine_delete_exercises_same_practice"
on public.exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercises.practice_id
  )
);

-- ---------------------------------------------------------------------------
-- patient_exercises
-- ---------------------------------------------------------------------------
alter table public.patient_exercises enable row level security;

drop policy if exists "kine_select_patient_exercises_same_practice" on public.patient_exercises;
create policy "kine_select_patient_exercises_same_practice"
on public.patient_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patient_exercises.practice_id
  )
);

drop policy if exists "kine_insert_patient_exercises_same_practice" on public.patient_exercises;
create policy "kine_insert_patient_exercises_same_practice"
on public.patient_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patient_exercises.practice_id
  )
);

drop policy if exists "kine_update_patient_exercises_same_practice" on public.patient_exercises;
create policy "kine_update_patient_exercises_same_practice"
on public.patient_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patient_exercises.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patient_exercises.practice_id
  )
);

drop policy if exists "kine_delete_patient_exercises_same_practice" on public.patient_exercises;
create policy "kine_delete_patient_exercises_same_practice"
on public.patient_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.patient_exercises.practice_id
  )
);

-- ---------------------------------------------------------------------------
-- exercise_events
-- ---------------------------------------------------------------------------
alter table public.exercise_events enable row level security;

drop policy if exists "kine_select_exercise_events_same_practice" on public.exercise_events;
create policy "kine_select_exercise_events_same_practice"
on public.exercise_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercise_events.practice_id
  )
);

drop policy if exists "kine_insert_exercise_events_same_practice" on public.exercise_events;
create policy "kine_insert_exercise_events_same_practice"
on public.exercise_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercise_events.practice_id
  )
);

drop policy if exists "kine_update_exercise_events_same_practice" on public.exercise_events;
create policy "kine_update_exercise_events_same_practice"
on public.exercise_events
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercise_events.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercise_events.practice_id
  )
);

drop policy if exists "kine_delete_exercise_events_same_practice" on public.exercise_events;
create policy "kine_delete_exercise_events_same_practice"
on public.exercise_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.exercise_events.practice_id
  )
);

