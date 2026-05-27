-- Logboek: track last edit time and speed up notes per child
alter table public.notes
  add column if not exists updated_at timestamptz default now();

create index if not exists notes_child_created_idx
  on public.notes (child_id, created_at desc);
