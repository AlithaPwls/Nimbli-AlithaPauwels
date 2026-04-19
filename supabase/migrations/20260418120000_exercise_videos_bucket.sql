-- Exercise video uploads: bucket + RLS (path: {practice_id}/{exercise_id}/{filename})

insert into storage.buckets (id, name, public, file_size_limit)
select 'exercise-videos', 'exercise-videos', true, 52428800
where not exists (select 1 from storage.buckets where id = 'exercise-videos');

-- Kine may upload only under their practice_id folder (first path segment).
drop policy if exists "exercise_videos_insert_own_practice" on storage.objects;
create policy "exercise_videos_insert_own_practice"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'exercise-videos'
  and exists (
    select 1
    from public.profiles p
    where p.role = 'kine'
      and p.practice_id is not null
      and p.practice_id::text = (storage.foldername(name))[1]
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
);

drop policy if exists "exercise_videos_delete_own_practice" on storage.objects;
create policy "exercise_videos_delete_own_practice"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'exercise-videos'
  and exists (
    select 1
    from public.profiles p
    where p.role = 'kine'
      and p.practice_id is not null
      and p.practice_id::text = (storage.foldername(name))[1]
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
);

drop policy if exists "exercise_videos_update_own_practice" on storage.objects;
create policy "exercise_videos_update_own_practice"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'exercise-videos'
  and exists (
    select 1
    from public.profiles p
    where p.role = 'kine'
      and p.practice_id is not null
      and p.practice_id::text = (storage.foldername(name))[1]
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
)
with check (
  bucket_id = 'exercise-videos'
  and exists (
    select 1
    from public.profiles p
    where p.role = 'kine'
      and p.practice_id is not null
      and p.practice_id::text = (storage.foldername(name))[1]
      and (p.user_id = auth.uid() or p.id = auth.uid())
  )
);
