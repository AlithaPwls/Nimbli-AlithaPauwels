-- Add contact fields for parent + relation label.
-- - profiles.phone_number: phone for parent profiles (kine add-patient flow)
-- - child_parent_relations.role_parent: label like moeder/vader/tante/...

alter table public.profiles
  add column if not exists phone_number text;

alter table public.child_parent_relations
  add column if not exists role_parent text;

-- Preserve role_parent during pending family registration completion.
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
  saved_role_parent text;
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

  select cpr.role_parent
    into saved_role_parent
  from public.child_parent_relations cpr
  where cpr.parent_id = p_parent_old_id
    and cpr.child_id = p_child_old_id
  limit 1;

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

  insert into public.child_parent_relations (parent_id, child_id, role_parent)
  values (p_parent_auth_id, p_child_auth_id, saved_role_parent);
end;
$$;

