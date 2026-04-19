-- Existing exercises got practice_id NULL when the column was added; RLS uses
-- `profiles.practice_id = exercises.practice_id`, so NULL never matches → empty library.
-- Assign orphans to the practice that already owns the most exercises; if all are null,
-- pick one practice deterministically (GROUP count tie → min id).

update public.exercises e
set practice_id = pick.id
from (
  select p.id
  from public.practices p
  left join public.exercises x on x.practice_id = p.id
  group by p.id
  order by count(x.id) desc, p.id asc
  limit 1
) pick
where e.practice_id is null;
