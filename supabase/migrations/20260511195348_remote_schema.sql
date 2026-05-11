drop extension if exists "pg_net";

drop policy "child_select_assigned_exercises" on "public"."exercises";

drop policy "parent_select_exercises_via_assignments" on "public"."exercises";

alter table "public"."practices" drop constraint "practices_plan_chk";

alter table "public"."profiles" drop constraint "profiles_role_chk";

alter table "public"."exercise_assignments" drop constraint "exercise_assignments_exercise_id_fkey";

alter table "public"."exercise_sessions" drop constraint "exercise_sessions_exercise_id_fkey";

drop index if exists "public"."child_parent_relations_parent_child_uidx";

drop index if exists "public"."exercise_assignments_child_id_idx";

drop index if exists "public"."exercise_assignments_exercise_id_idx";

drop index if exists "public"."exercise_sessions_child_completed_idx";

drop index if exists "public"."exercise_sessions_exercise_completed_idx";

drop index if exists "public"."profiles_user_id_idx";

alter table "public"."profiles" alter column "id" drop default;

CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id) WHERE (user_id IS NOT NULL);

alter table "public"."practices" add constraint "practices_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text]))) not valid;

alter table "public"."practices" validate constraint "practices_plan_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['child'::text, 'parent'::text, 'kine'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."exercise_assignments" add constraint "exercise_assignments_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_assignments" validate constraint "exercise_assignments_exercise_id_fkey";

alter table "public"."exercise_sessions" add constraint "exercise_sessions_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_sessions" validate constraint "exercise_sessions_exercise_id_fkey";


  create policy "parent_insert_exercise_sessions"
  on "public"."exercise_sessions"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.profiles parent
     JOIN public.profiles child ON (((child.role = 'child'::text) AND (child.invite_code = parent.invite_code))))
  WHERE ((parent.user_id = auth.uid()) AND (parent.role = 'parent'::text) AND (parent.invite_code IS NOT NULL) AND (exercise_sessions.child_id = child.id)))));



  create policy "child_select_exercises_same_practice"
  on "public"."exercises"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'child'::text) AND (p.practice_id IS NOT NULL) AND (p.practice_id = exercises.practice_id)))));



  create policy "parent_select_exercises_same_practice"
  on "public"."exercises"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'parent'::text) AND (p.practice_id IS NOT NULL) AND (p.practice_id = exercises.practice_id)))));



