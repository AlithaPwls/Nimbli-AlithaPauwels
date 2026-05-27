-- Link pending profiles to Auth without FK 23503 errors:
-- 1) FKs on profiles.id use ON UPDATE CASCADE (assignments/sessions follow child id change).
-- 2) RPC removes child_parent_relations before PK updates, then re-inserts (works even if client lacks delete RLS).

-- ---------------------------------------------------------------------------
-- FKs: ON UPDATE CASCADE so profiles.id can move to auth.users.id
-- (idempotent if 20260430120000 already applied)
-- ---------------------------------------------------------------------------
alter table public.child_parent_relations
  drop constraint if exists child_parent_relations_parent_id_fkey;
alter table public.child_parent_relations
  add constraint child_parent_relations_parent_id_fkey
  foreign key (parent_id) references public.profiles (id)
  on update cascade
  on delete cascade;

alter table public.child_parent_relations
  drop constraint if exists child_parent_relations_child_id_fkey;
alter table public.child_parent_relations
  add constraint child_parent_relations_child_id_fkey
  foreign key (child_id) references public.profiles (id)
  on update cascade
  on delete cascade;

alter table public.exercises
  drop constraint if exists exercises_created_by_fkey;
alter table public.exercises
  add constraint exercises_created_by_fkey
  foreign key (created_by) references public.profiles (id)
  on update cascade
  on delete set null;

alter table public.exercise_assignments
  drop constraint if exists exercise_assignments_child_id_fkey;
alter table public.exercise_assignments
  add constraint exercise_assignments_child_id_fkey
  foreign key (child_id) references public.profiles (id)
  on update cascade
  on delete cascade;

alter table public.exercise_assignments
  drop constraint if exists exercise_assignments_assigned_by_fkey;
alter table public.exercise_assignments
  add constraint exercise_assignments_assigned_by_fkey
  foreign key (assigned_by) references public.profiles (id)
  on update cascade
  on delete set null;

alter table public.exercise_sessions
  drop constraint if exists exercise_sessions_child_id_fkey;
alter table public.exercise_sessions
  add constraint exercise_sessions_child_id_fkey
  foreign key (child_id) references public.profiles (id)
  on update cascade
  on delete cascade;

alter table public.badges
  drop constraint if exists badges_child_id_fkey;
alter table public.badges
  add constraint badges_child_id_fkey
  foreign key (child_id) references public.profiles (id)
  on update cascade
  on delete cascade;

alter table public.notes
  drop constraint if exists notes_child_id_fkey;
alter table public.notes
  add constraint notes_child_id_fkey
  foreign key (child_id) references public.profiles (id)
  on update cascade
  on delete cascade;

alter table public.notes
  drop constraint if exists notes_author_id_fkey;
alter table public.notes
  add constraint notes_author_id_fkey
  foreign key (author_id) references public.profiles (id)
  on update cascade
  on delete set null;

-- ---------------------------------------------------------------------------
-- Atomic invite completion (called from registerFamily after Auth sign-up)
-- ---------------------------------------------------------------------------
create or replace function public.complete_pending_family_registration(
  p_invite_digits text,
  p_parent_old_id uuid,
  p_child_old_id uuid,
  p_parent_auth_id uuid,
  p_child_auth_id uuid,
  p_parent_email text,
  p_child_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv text := regexp_replace(coalesce(p_invite_digits, ''), '\D', '', 'g');
begin
  if length(inv) < 6 then
    raise exception 'invalid invite';
  end if;

  if not exists (
    select 1
    from public.profiles par
    inner join public.profiles ch
      on regexp_replace(coalesce(par.invite_code, ''), '\D', '', 'g')
       = regexp_replace(coalesce(ch.invite_code, ''), '\D', '', 'g')
    where par.id = p_parent_old_id
      and ch.id = p_child_old_id
      and par.role = 'parent'
      and ch.role = 'child'
      and par.user_id is null
      and ch.user_id is null
      and regexp_replace(coalesce(par.invite_code, ''), '\D', '', 'g') = inv
  ) then
    raise exception 'invalid pending family';
  end if;

  delete from public.child_parent_relations cpr
  where cpr.parent_id = p_parent_old_id
    and cpr.child_id = p_child_old_id;

  update public.profiles
  set
    id = p_parent_auth_id,
    user_id = p_parent_auth_id,
    email = p_parent_email
  where id = p_parent_old_id
    and user_id is null;

  if not found then
    raise exception 'parent profile link failed';
  end if;

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

  insert into public.child_parent_relations (parent_id, child_id)
  values (p_parent_auth_id, p_child_auth_id);
end;
$$;

revoke all on function public.complete_pending_family_registration(text, uuid, uuid, uuid, uuid, text, text) from public;
grant execute on function public.complete_pending_family_registration(text, uuid, uuid, uuid, uuid, text, text) to anon;
grant execute on function public.complete_pending_family_registration(text, uuid, uuid, uuid, uuid, text, text) to authenticated;
