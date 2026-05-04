-- Nimbli public schema (aligned with production).
-- Tables: practices, profiles, child_parent_relations, exercises, exercise_assignments,
--         exercise_sessions, badges, notes

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- practices
-- ---------------------------------------------------------------------------
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email_general text,
  email_invoice text,
  kvk_number text,
  vat_number text,
  street text,
  street_number text,
  city text,
  postal_code text,
  country text default 'België'::text,
  invoice_same_as_practice boolean not null default true,
  invoice_name text,
  invoice_street text,
  invoice_street_number text,
  invoice_city text,
  invoice_postal_code text,
  invoice_country text,
  plan text not null default 'free'::text,
  plan_started_at timestamptz,
  created_at timestamptz not null default now(),
  constraint practices_plan_chk check (plan = any (array['free'::text, 'pro'::text]))
);

comment on table public.practices is 'Kinesiologist practice; freemium plan on practices.plan';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  firstname text not null,
  lastname text not null,
  email text not null,
  role text not null,
  avatar_url text,
  date_of_birth date,
  created_at timestamptz default now(),
  invite_code text,
  user_id uuid references auth.users (id) on delete set null,
  practice_id uuid references public.practices (id) on delete set null,
  treatment_goal text,
  constraint profiles_role_chk check (role = any (array['child'::text, 'parent'::text, 'kine'::text]))
);

create index if not exists profiles_practice_id_idx on public.profiles (practice_id);
create index if not exists profiles_user_id_idx on public.profiles (user_id);

-- ---------------------------------------------------------------------------
-- child_parent_relations
-- ---------------------------------------------------------------------------
create table public.child_parent_relations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on update cascade on delete cascade,
  child_id uuid not null references public.profiles (id) on update cascade on delete cascade
);

create unique index if not exists child_parent_relations_parent_child_uidx
  on public.child_parent_relations (parent_id, child_id);

-- ---------------------------------------------------------------------------
-- exercises (per practice)
-- ---------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  duration_seconds integer,
  difficulty integer,
  focus text,
  video_url text,
  xp_value integer default 0,
  created_by uuid references public.profiles (id) on update cascade on delete set null,
  created_at timestamptz default now(),
  thumbnail_url text,
  reps integer,
  media_url text,
  practice_id uuid references public.practices (id) on delete cascade,
  title text not null,
  is_archived boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.exercises is 'Per-practice exercise library (kine MVP).';
comment on column public.exercises.practice_id is 'Owning practice; required for new rows via app/RLS.';

create index if not exists exercises_practice_id_idx on public.exercises (practice_id);
create index if not exists exercises_archived_idx on public.exercises (practice_id, is_archived);

-- ---------------------------------------------------------------------------
-- exercise_assignments (child profile ↔ exercise)
-- ---------------------------------------------------------------------------
create table public.exercise_assignments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on update cascade on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on update cascade on delete set null,
  reps integer,
  rep_unit text,
  created_at timestamptz default now()
);

create index if not exists exercise_assignments_child_id_idx on public.exercise_assignments (child_id);
create index if not exists exercise_assignments_exercise_id_idx on public.exercise_assignments (exercise_id);

-- ---------------------------------------------------------------------------
-- exercise_sessions
-- ---------------------------------------------------------------------------
create table public.exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on update cascade on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  assignment_id uuid references public.exercise_assignments (id) on delete set null,
  completed_at timestamptz default now(),
  success boolean,
  score integer
);

create index if not exists exercise_sessions_child_completed_idx
  on public.exercise_sessions (child_id, completed_at desc);
create index if not exists exercise_sessions_exercise_completed_idx
  on public.exercise_sessions (exercise_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on update cascade on delete cascade,
  badge_type text not null,
  badge_description text,
  earned_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on update cascade on delete cascade,
  author_id uuid references public.profiles (id) on update cascade on delete set null,
  title text,
  content text,
  created_at timestamptz default now()
);
