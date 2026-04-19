-- Align exercises with kine MVP when the remote table predates practice_id.
alter table public.exercises
  add column if not exists practice_id uuid references public.practices (id) on delete cascade;

comment on column public.exercises.practice_id is 'Owning practice; app always sets this for kine inserts.';
