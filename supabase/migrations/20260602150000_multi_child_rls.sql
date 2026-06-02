-- Multi-child families: relations as source of truth for parent RLS + pending child registration RPC.

-- ---------------------------------------------------------------------------
-- 1.3 Backfill child_parent_relations from matching invite_code (legacy pairs)
-- ---------------------------------------------------------------------------
insert into public.child_parent_relations (parent_id, child_id)
select par.id, ch.id
from public.profiles par
join public.profiles ch
  on ch.role = 'child'
  and regexp_replace(coalesce(par.invite_code, ''), '\D', '', 'g')
    = regexp_replace(coalesce(ch.invite_code, ''), '\D', '', 'g')
where par.role = 'parent'
  and par.invite_code is not null
  and not exists (
    select 1
    from public.child_parent_relations cpr
    where cpr.parent_id = par.id
      and cpr.child_id = ch.id
  );

create unique index if not exists child_parent_relations_parent_child_uidx
  on public.child_parent_relations (parent_id, child_id);

-- ---------------------------------------------------------------------------
-- 1.1 Helper: parent_can_access_child
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 1.2 Parent RLS policies: invite_code joins -> parent_can_access_child
-- (exercises via security definer helper — no inline exercise_assignments subquery)
-- ---------------------------------------------------------------------------
drop policy if exists "parent_select_exercises_via_assignments" on public.exercises;
create policy "parent_select_exercises_via_assignments"
on public.exercises
for select
to authenticated
using (public.parent_can_view_exercise(public.exercises.id));

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

drop policy if exists "parent_select_exercise_assignments" on public.exercise_assignments;
create policy "parent_select_exercise_assignments"
on public.exercise_assignments
for select
to authenticated
using (public.parent_can_access_child(public.exercise_assignments.child_id));

drop policy if exists "parent_select_exercise_sessions" on public.exercise_sessions;
create policy "parent_select_exercise_sessions"
on public.exercise_sessions
for select
to authenticated
using (public.parent_can_access_child(public.exercise_sessions.child_id));

drop policy if exists "parent_insert_exercise_sessions" on public.exercise_sessions;
create policy "parent_insert_exercise_sessions"
on public.exercise_sessions
for insert
to authenticated
with check (public.parent_can_access_child(public.exercise_sessions.child_id));

drop policy if exists "parent_select_badges" on public.badges;
create policy "parent_select_badges"
on public.badges
for select
to authenticated
using (public.parent_can_access_child(public.badges.child_id));

drop policy if exists "parent_select_notes" on public.notes;
create policy "parent_select_notes"
on public.notes
for select
to authenticated
using (public.parent_can_access_child(public.notes.child_id));

-- ---------------------------------------------------------------------------
-- Storage avatars: relations-only (backfill ensures legacy pairs have relations)
-- ---------------------------------------------------------------------------
create or replace function public.parent_can_upload_child_avatar(object_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  v_child_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  begin
    v_child_id := nullif((storage.foldername(object_path))[1], '')::uuid;
  exception
    when others then
      return false;
  end;

  if v_child_id is null then
    return false;
  end if;

  return public.parent_can_access_child(v_child_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 1.5 RPC: complete_pending_child_registration (additional child)
-- ---------------------------------------------------------------------------
create or replace function public.complete_pending_child_registration(
  p_child_old_id uuid,
  p_child_auth_id uuid,
  p_parent_auth_id uuid,
  p_child_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_role_parent text;
  v_parent_profile_id uuid;
begin
  select id
    into v_parent_profile_id
  from public.profiles
  where user_id = p_parent_auth_id
    and role = 'parent'
  limit 1;

  if v_parent_profile_id is null then
    raise exception 'invalid parent';
  end if;

  if not exists (
    select 1
    from public.profiles ch
    where ch.id = p_child_old_id
      and ch.role = 'child'
      and ch.user_id is null
  ) then
    raise exception 'invalid pending child';
  end if;

  if not exists (
    select 1
    from public.child_parent_relations cpr
    where cpr.parent_id = v_parent_profile_id
      and cpr.child_id = p_child_old_id
  ) then
    raise exception 'invalid parent child relation';
  end if;

  select cpr.role_parent
    into saved_role_parent
  from public.child_parent_relations cpr
  where cpr.parent_id = v_parent_profile_id
    and cpr.child_id = p_child_old_id
  limit 1;

  delete from public.child_parent_relations cpr
  where cpr.parent_id = v_parent_profile_id
    and cpr.child_id = p_child_old_id;

  update public.profiles
  set
    id = p_child_auth_id,
    user_id = p_child_auth_id,
    email = p_child_email
  where id = p_child_old_id
    and user_id is null;

  if not found then
    raise exception 'child profile link failed';
  end if;

  insert into public.child_parent_relations (parent_id, child_id, role_parent)
  values (v_parent_profile_id, p_child_auth_id, saved_role_parent);
end;
$$;

revoke all on function public.complete_pending_child_registration(uuid, uuid, uuid, text) from public;
grant execute on function public.complete_pending_child_registration(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.complete_pending_child_registration(uuid, uuid, uuid, text) to anon;
