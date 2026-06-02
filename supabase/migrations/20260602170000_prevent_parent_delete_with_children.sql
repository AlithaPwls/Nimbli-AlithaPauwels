-- Block accidental parent profile deletion while children are still linked.

create or replace function public.prevent_parent_profile_delete_with_children()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'parent' then
    if exists (
      select 1
      from public.child_parent_relations cpr
      where cpr.parent_id = old.id
    ) then
      raise exception 'parent_profile_has_linked_children'
        using hint = 'Remove or unlink all children before deleting the parent profile.';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_parent_delete_with_children on public.profiles;

create trigger trg_prevent_parent_delete_with_children
before delete on public.profiles
for each row
execute function public.prevent_parent_profile_delete_with_children();
