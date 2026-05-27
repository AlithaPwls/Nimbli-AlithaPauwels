-- Pose detection config for exercises (data-driven evaluators).
-- Adds:
-- - exercises.pose_enabled (bool)
-- - exercises.pose_config (jsonb)
-- - check: pose_enabled=true requires pose_config with numeric version
-- - GIN index for jsonb queries

alter table public.exercises
  add column if not exists pose_enabled boolean not null default false;

alter table public.exercises
  add column if not exists pose_config jsonb;

alter table public.exercises
  drop constraint if exists exercises_pose_config_required_chk;

alter table public.exercises
  add constraint exercises_pose_config_required_chk
  check (
    pose_enabled = false
    or (
      pose_config is not null
      and jsonb_typeof(pose_config->'version') = 'number'
    )
  );

create index if not exists exercises_pose_config_gin_idx
  on public.exercises
  using gin (pose_config);

