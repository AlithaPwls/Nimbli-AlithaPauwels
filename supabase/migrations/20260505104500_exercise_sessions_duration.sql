-- Add duration tracking to exercise sessions (seconds).
alter table public.exercise_sessions
  add column if not exists duration integer;

