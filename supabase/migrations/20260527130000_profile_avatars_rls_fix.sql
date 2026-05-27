-- Fix profile-avatars storage RLS: security definer helper + child_parent_relations fallback.

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

  return exists (
    select 1
    from public.profiles parent
    join public.child_parent_relations rel on rel.parent_id = parent.id
    where parent.role = 'parent'
      and (parent.user_id = auth.uid() or parent.id = auth.uid())
      and rel.child_id = v_child_id
  )
  or exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.id = v_child_id and child.role = 'child'
    where parent.role = 'parent'
      and parent.invite_code is not null
      and parent.invite_code = child.invite_code
      and (parent.user_id = auth.uid() or parent.id = auth.uid())
  );
end;
$$;

revoke all on function public.parent_can_upload_child_avatar(text) from public;
grant execute on function public.parent_can_upload_child_avatar(text) to authenticated;

drop policy if exists "profile_avatars_public_select" on storage.objects;
create policy "profile_avatars_public_select"
on storage.objects
for select
to public
using (bucket_id = 'profile-avatars');

drop policy if exists "profile_avatars_parent_insert" on storage.objects;
create policy "profile_avatars_parent_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and public.parent_can_upload_child_avatar(name)
);

drop policy if exists "profile_avatars_parent_update" on storage.objects;
create policy "profile_avatars_parent_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.parent_can_upload_child_avatar(name)
)
with check (
  bucket_id = 'profile-avatars'
  and public.parent_can_upload_child_avatar(name)
);

drop policy if exists "profile_avatars_parent_delete" on storage.objects;
create policy "profile_avatars_parent_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.parent_can_upload_child_avatar(name)
);
