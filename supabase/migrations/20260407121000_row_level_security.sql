-- Row level security (production commonly keeps `profiles` without RLS so anonymous
-- clients can complete invite registration updates in useRegisterFamily.)
--
-- practices / exercises / assignments / sessions / badges / notes are scoped.

-- ---------------------------------------------------------------------------
-- practices
-- ---------------------------------------------------------------------------
alter table public.practices enable row level security;

drop policy if exists "kine_select_own_practice" on public.practices;
create policy "kine_select_own_practice"
on public.practices
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = public.practices.id
  )
);

-- ---------------------------------------------------------------------------
-- child_parent_relations
-- ---------------------------------------------------------------------------
alter table public.child_parent_relations enable row level security;

drop policy if exists "kine_all_child_parent_same_practice" on public.child_parent_relations;
create policy "kine_all_child_parent_same_practice"
on public.child_parent_relations
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles par on par.id = public.child_parent_relations.parent_id
    join public.profiles ch on ch.id = public.child_parent_relations.child_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id is not null
      and kine.practice_id = par.practice_id
      and kine.practice_id = ch.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles kine
    join public.profiles par on par.id = public.child_parent_relations.parent_id
    join public.profiles ch on ch.id = public.child_parent_relations.child_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id is not null
      and kine.practice_id = par.practice_id
      and kine.practice_id = ch.practice_id
  )
);

drop policy if exists "parent_select_own_child_parent_relations" on public.child_parent_relations;
create policy "parent_select_own_child_parent_relations"
on public.child_parent_relations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles me
    where me.user_id = auth.uid()
      and me.role = 'parent'
      and me.id = public.child_parent_relations.parent_id
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

drop policy if exists "parent_select_exercises_via_assignments" on public.exercises;
create policy "parent_select_exercises_via_assignments"
on public.exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.exercise_assignments ea
    join public.profiles parent on parent.user_id = auth.uid() and parent.role = 'parent'
    join public.profiles child on child.role = 'child' and child.invite_code = parent.invite_code
    where parent.invite_code is not null
      and ea.exercise_id = public.exercises.id
      and ea.child_id = child.id
  )
);

drop policy if exists "child_select_assigned_exercises" on public.exercises;
create policy "child_select_assigned_exercises"
on public.exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.exercise_assignments ea
    join public.profiles self on self.user_id = auth.uid() and self.role = 'child'
    where ea.exercise_id = public.exercises.id
      and ea.child_id = self.id
  )
);

-- ---------------------------------------------------------------------------
-- exercise_assignments
-- ---------------------------------------------------------------------------
alter table public.exercise_assignments enable row level security;

drop policy if exists "kine_select_exercise_assignments" on public.exercise_assignments;
create policy "kine_select_exercise_assignments"
on public.exercise_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.exercise_assignments.child_id
    join public.exercises ex on ex.id = public.exercise_assignments.exercise_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
      and kine.practice_id = ex.practice_id
  )
);

drop policy if exists "kine_insert_exercise_assignments" on public.exercise_assignments;
create policy "kine_insert_exercise_assignments"
on public.exercise_assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.exercise_assignments.child_id
    join public.exercises ex on ex.id = public.exercise_assignments.exercise_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
      and kine.practice_id = ex.practice_id
  )
);

drop policy if exists "kine_update_exercise_assignments" on public.exercise_assignments;
create policy "kine_update_exercise_assignments"
on public.exercise_assignments
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.exercise_assignments.child_id
    join public.exercises ex on ex.id = public.exercise_assignments.exercise_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
      and kine.practice_id = ex.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.exercise_assignments.child_id
    join public.exercises ex on ex.id = public.exercise_assignments.exercise_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
      and kine.practice_id = ex.practice_id
  )
);

drop policy if exists "kine_delete_exercise_assignments" on public.exercise_assignments;
create policy "kine_delete_exercise_assignments"
on public.exercise_assignments
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.exercise_assignments.child_id
    join public.exercises ex on ex.id = public.exercise_assignments.exercise_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
      and kine.practice_id = ex.practice_id
  )
);

drop policy if exists "parent_select_exercise_assignments" on public.exercise_assignments;
create policy "parent_select_exercise_assignments"
on public.exercise_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child' and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and public.exercise_assignments.child_id = child.id
  )
);

drop policy if exists "child_select_own_exercise_assignments" on public.exercise_assignments;
create policy "child_select_own_exercise_assignments"
on public.exercise_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles self
    where self.user_id = auth.uid()
      and self.role = 'child'
      and self.id = public.exercise_assignments.child_id
  )
);

-- ---------------------------------------------------------------------------
-- exercise_sessions
-- ---------------------------------------------------------------------------
alter table public.exercise_sessions enable row level security;

drop policy if exists "kine_select_exercise_sessions" on public.exercise_sessions;
create policy "kine_select_exercise_sessions"
on public.exercise_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.exercise_sessions.child_id
    join public.exercises ex on ex.id = public.exercise_sessions.exercise_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
      and kine.practice_id = ex.practice_id
  )
);

drop policy if exists "parent_select_exercise_sessions" on public.exercise_sessions;
create policy "parent_select_exercise_sessions"
on public.exercise_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child' and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and public.exercise_sessions.child_id = child.id
  )
);

drop policy if exists "child_insert_own_exercise_sessions" on public.exercise_sessions;
create policy "child_insert_own_exercise_sessions"
on public.exercise_sessions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles self
    where self.user_id = auth.uid()
      and self.role = 'child'
      and self.id = public.exercise_sessions.child_id
  )
);

drop policy if exists "child_select_own_exercise_sessions" on public.exercise_sessions;
create policy "child_select_own_exercise_sessions"
on public.exercise_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles self
    where self.user_id = auth.uid()
      and self.role = 'child'
      and self.id = public.exercise_sessions.child_id
  )
);

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------
alter table public.badges enable row level security;

drop policy if exists "kine_badges_same_practice" on public.badges;
create policy "kine_badges_same_practice"
on public.badges
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.badges.child_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.badges.child_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
  )
);

drop policy if exists "parent_select_badges" on public.badges;
create policy "parent_select_badges"
on public.badges
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child' and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and public.badges.child_id = child.id
  )
);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
alter table public.notes enable row level security;

drop policy if exists "kine_notes_same_practice" on public.notes;
create policy "kine_notes_same_practice"
on public.notes
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.notes.child_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
  )
)
with check (
  exists (
    select 1
    from public.profiles kine
    join public.profiles child on child.id = public.notes.child_id
    where kine.user_id = auth.uid()
      and kine.role = 'kine'
      and kine.practice_id = child.practice_id
  )
);

drop policy if exists "parent_select_notes" on public.notes;
create policy "parent_select_notes"
on public.notes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child' and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and public.notes.child_id = child.id
  )
);
