-- Allow kine practice registration: INSERT was blocked (only SELECT policy existed).

drop policy if exists "kine_insert_practice_registration" on public.practices;
create policy "kine_insert_practice_registration"
on public.practices
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id is null
  )
  or not exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
  )
);

-- RETURNING after insert needs SELECT; profile may not be linked yet.
drop policy if exists "kine_select_practice_registration" on public.practices;
create policy "kine_select_practice_registration"
on public.practices
for select
to authenticated
using (
  (
    not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'kine'
        and p.practice_id is null
    )
  )
  and not exists (
    select 1
    from public.profiles p2
    where p2.practice_id = practices.id
  )
);

drop policy if exists "kine_update_own_practice" on public.practices;
create policy "kine_update_own_practice"
on public.practices
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = practices.id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'kine'
      and p.practice_id = practices.id
  )
);
