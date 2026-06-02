-- Fix: infinite recursion on exercise_assignments when parent policies on exercises
-- subquery exercise_assignments while kine policies on exercise_assignments join exercises.

create or replace function public.parent_can_access_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.child_parent_relations rel
    join public.profiles p on p.id = rel.parent_id
    where p.user_id = auth.uid()
      and p.role = 'parent'
      and rel.child_id = p_child_id
  );
$$;

revoke all on function public.parent_can_access_child(uuid) from public;
grant execute on function public.parent_can_access_child(uuid) to authenticated;

create or replace function public.parent_can_view_exercise(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.exercise_assignments ea
    where ea.exercise_id = p_exercise_id
      and public.parent_can_access_child(ea.child_id)
  );
$$;

revoke all on function public.parent_can_view_exercise(uuid) from public;
grant execute on function public.parent_can_view_exercise(uuid) to authenticated;

drop policy if exists "parent_select_exercises_via_assignments" on public.exercises;
create policy "parent_select_exercises_via_assignments"
on public.exercises
for select
to authenticated
using (public.parent_can_view_exercise(public.exercises.id));

-- Practice-wide parent read (no exercise_assignments subquery — avoids RLS cycle).
drop policy if exists "parent_select_exercises_same_practice" on public.exercises;
create policy "parent_select_exercises_same_practice"
on public.exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'parent'
      and p.practice_id is not null
      and p.practice_id = public.exercises.practice_id
  )
);
