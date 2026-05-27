-- Child profile avatars: public bucket, path {child_profile_id}/avatar.{ext}

insert into storage.buckets (id, name, public, file_size_limit)
select 'profile-avatars', 'profile-avatars', true, 5242880
where not exists (select 1 from storage.buckets where id = 'profile-avatars');

drop policy if exists "profile_avatars_parent_insert" on storage.objects;
create policy "profile_avatars_parent_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child'
      and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and child.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "profile_avatars_parent_update" on storage.objects;
create policy "profile_avatars_parent_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child'
      and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and child.id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'profile-avatars'
  and exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child'
      and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and child.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "profile_avatars_parent_delete" on storage.objects;
create policy "profile_avatars_parent_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and exists (
    select 1
    from public.profiles parent
    join public.profiles child on child.role = 'child'
      and child.invite_code = parent.invite_code
    where parent.user_id = auth.uid()
      and parent.role = 'parent'
      and parent.invite_code is not null
      and child.id::text = (storage.foldername(name))[1]
  )
);
