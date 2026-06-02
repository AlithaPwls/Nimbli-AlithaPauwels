-- Dev seed: each child profile gets up to 15 successful exercise_sessions (random exercises).
-- Safe to re-run: only inserts until count reaches 15 per child.
-- Run via Supabase SQL editor or: psql $DATABASE_URL -f supabase/scripts/seed_child_exercise_sessions.sql

WITH base AS (
  SELECT
    p.id AS child_id,
    gs.n,
    (SELECT count(*)::int FROM public.exercise_sessions es WHERE es.child_id = p.id) AS existing
  FROM public.profiles p
  CROSS JOIN generate_series(1, 15) AS gs(n)
  WHERE p.role = 'child'
),
slots AS (
  SELECT child_id, n FROM base WHERE n > existing
),
picked AS (
  SELECT
    s.child_id,
    s.n,
    (SELECT e.id FROM public.exercises e ORDER BY random() LIMIT 1) AS exercise_id
  FROM slots s
)
INSERT INTO public.exercise_sessions (
  child_id,
  exercise_id,
  assignment_id,
  completed_at,
  success,
  score,
  duration
)
SELECT
  p.child_id,
  p.exercise_id,
  (
    SELECT a.id
    FROM public.exercise_assignments a
    WHERE a.child_id = p.child_id
      AND a.exercise_id = p.exercise_id
    ORDER BY a.created_at DESC
    LIMIT 1
  ),
  now()
    - ((p.n * 2) + floor(random() * 4)::int) * interval '1 day'
    - (floor(random() * 10) || ' hours')::interval,
  true,
  75 + floor(random() * 25)::int,
  45 + floor(random() * 90)::int
FROM picked p;
