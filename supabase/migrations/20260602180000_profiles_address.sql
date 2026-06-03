-- Parent account edit: store home address on profile.
alter table public.profiles
  add column if not exists address text;

comment on column public.profiles.address is
  'Contact address for parent (and optionally other roles).';
