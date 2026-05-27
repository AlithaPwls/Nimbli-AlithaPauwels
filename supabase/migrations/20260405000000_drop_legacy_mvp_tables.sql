-- Remove obsolete MVP objects from older migration packs (if present).
-- Safe no-op when tables never existed.

drop table if exists public.exercise_events cascade;
drop table if exists public.patient_exercises cascade;
drop table if exists public.patients cascade;
