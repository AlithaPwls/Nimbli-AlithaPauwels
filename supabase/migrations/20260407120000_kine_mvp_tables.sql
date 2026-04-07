-- Kine MVP tables (patients, exercises, assignments, events)
-- Notes:
-- - Assumes existing tables: public.profiles (id uuid PK), public.practices (id uuid PK)
-- - We keep "patient" as a separate table so a patient can exist before linking to a child profile.
-- - RLS/policies will be added in a follow-up migration step.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,

  -- Optional link to a child profile row (role='child') once it exists / is known.
  child_profile_id uuid null references public.profiles (id) on delete set null,

  firstname text not null,
  lastname text not null,
  birthdate date null,
  avatar_url text null,

  -- Freeform clinical focus as seen in the UI mock (e.g. "Evenwicht", "Coördinatie").
  focus text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patients_practice_id_idx on public.patients (practice_id);
create index if not exists patients_child_profile_id_idx on public.patients (child_profile_id);
create index if not exists patients_name_search_idx on public.patients using gin (
  to_tsvector('simple', coalesce(firstname,'') || ' ' || coalesce(lastname,''))
);

-- ---------------------------------------------------------------------------
-- exercises (library per practice for MVP)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,

  title text not null,
  description text null,
  media_url text null,
  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exercises_practice_id_idx on public.exercises (practice_id);
create index if not exists exercises_archived_idx on public.exercises (practice_id, is_archived);

-- ---------------------------------------------------------------------------
-- patient_exercises (assignment)
-- ---------------------------------------------------------------------------
create table if not exists public.patient_exercises (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,

  patient_id uuid not null references public.patients (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,

  assigned_by_profile_id uuid null references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),

  -- MVP scheduling knobs; keep nullable until needed.
  target_per_week integer null,
  starts_on date null,
  ends_on date null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patient_exercises_target_per_week_chk
    check (target_per_week is null or target_per_week between 1 and 50)
);

create index if not exists patient_exercises_practice_id_idx on public.patient_exercises (practice_id);
create index if not exists patient_exercises_patient_id_idx on public.patient_exercises (patient_id);
create index if not exists patient_exercises_exercise_id_idx on public.patient_exercises (exercise_id);
create index if not exists patient_exercises_active_idx on public.patient_exercises (patient_id, is_active);

-- ---------------------------------------------------------------------------
-- exercise_events (per attempt/session)
-- ---------------------------------------------------------------------------
create table if not exists public.exercise_events (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,

  patient_id uuid not null references public.patients (id) on delete cascade,
  patient_exercise_id uuid null references public.patient_exercises (id) on delete set null,
  exercise_id uuid not null references public.exercises (id) on delete restrict,

  -- Who performed the attempt (often a child profile), if linked.
  actor_profile_id uuid null references public.profiles (id) on delete set null,

  happened_at timestamptz not null default now(),
  duration_seconds integer null,
  score integer null,
  notes text null,

  created_at timestamptz not null default now()
);

create index if not exists exercise_events_practice_id_idx on public.exercise_events (practice_id);
create index if not exists exercise_events_patient_id_idx on public.exercise_events (patient_id, happened_at desc);
create index if not exists exercise_events_exercise_id_idx on public.exercise_events (exercise_id, happened_at desc);
create index if not exists exercise_events_assignment_id_idx on public.exercise_events (patient_exercise_id, happened_at desc);

