-- Optional one-time repair: after linking Auth, ensure profiles primary key matches auth user id.
-- Safe when FKs use ON UPDATE CASCADE (initial_schema).

update public.profiles p
set id = p.user_id
where p.user_id is not null
  and p.id is distinct from p.user_id;
