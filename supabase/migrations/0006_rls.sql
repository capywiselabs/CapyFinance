-- 0006_rls.sql — Row-level security policies

-- Helper functions (security definer, hidden in private schema).
create or replace function private.same_family(viewer uuid, subject uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.family_members a
    join public.family_members b on a.family_id = b.family_id
    where a.profile_id = viewer
      and b.profile_id = subject
  );
$$;

create or replace function private.is_parent_of(viewer uuid, subject uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.family_members p
    join public.family_members c on c.family_id = p.family_id
    where p.profile_id = viewer
      and p.relation = 'parent'
      and c.profile_id = subject
  );
$$;

create or replace function private.teacher_of(viewer uuid, student uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.teacher_classes tc
    join public.class_enrollments ce on ce.class_id = tc.class_id
    where tc.teacher_profile_id = viewer
      and ce.student_profile_id = student
  );
$$;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.audit_log enable row level security;

alter table public.pets enable row level security;
alter table public.shop_items enable row level security;
alter table public.pet_inventory enable row level security;
alter table public.coin_ledger enable row level security;

alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.videos enable row level security;
alter table public.video_watch_events enable row level security;

alter table public.categories enable row level security;
alter table public.merchants_kb enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_corrections enable row level security;
alter table public.budgets enable row level security;

alter table public.reports enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.stripe_subscriptions enable row level security;

-- profiles
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated
  using (id = auth.uid() or private.same_family(auth.uid(), id) or private.teacher_of(auth.uid(), id));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- families
drop policy if exists families_member_select on public.families;
create policy families_member_select on public.families for select to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = families.id and fm.profile_id = auth.uid()
  ));

drop policy if exists families_creator_insert on public.families;
create policy families_creator_insert on public.families for insert to authenticated
  with check (created_by = auth.uid());

-- family_members
drop policy if exists family_members_self_select on public.family_members;
create policy family_members_self_select on public.family_members for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.family_members fm2
      where fm2.family_id = family_members.family_id and fm2.profile_id = auth.uid()
    )
  );

-- pets / inventory / ledger
drop policy if exists pets_owner_select on public.pets;
create policy pets_owner_select on public.pets for select to authenticated
  using (
    student_id = auth.uid()
    or private.is_parent_of(auth.uid(), student_id)
    or private.teacher_of(auth.uid(), student_id)
  );

drop policy if exists pet_inventory_select on public.pet_inventory;
create policy pet_inventory_select on public.pet_inventory for select to authenticated
  using (exists (
    select 1 from public.pets p
    where p.id = pet_inventory.pet_id
      and (p.student_id = auth.uid() or private.is_parent_of(auth.uid(), p.student_id))
  ));

drop policy if exists coin_ledger_select on public.coin_ledger;
create policy coin_ledger_select on public.coin_ledger for select to authenticated
  using (exists (
    select 1 from public.pets p
    where p.id = coin_ledger.pet_id
      and (p.student_id = auth.uid() or private.is_parent_of(auth.uid(), p.student_id))
  ));

-- shop_items, categories, merchants_kb: read-all-authed; writes by service role only
drop policy if exists shop_items_read on public.shop_items;
create policy shop_items_read on public.shop_items for select to authenticated using (active);

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to authenticated using (true);

drop policy if exists merchants_kb_read on public.merchants_kb;
create policy merchants_kb_read on public.merchants_kb for select to authenticated using (true);

-- tasks
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (
    assignee_id = auth.uid()
    or created_by = auth.uid()
    or (family_id is not null and exists (
      select 1 from public.family_members fm
      where fm.family_id = tasks.family_id and fm.profile_id = auth.uid()
    ))
  );

drop policy if exists tasks_parent_insert on public.tasks;
create policy tasks_parent_insert on public.tasks for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      family_id is null
      or exists (
        select 1 from public.family_members fm
        where fm.family_id = tasks.family_id
          and fm.profile_id = auth.uid()
          and fm.relation = 'parent'
      )
    )
  );

drop policy if exists task_completions_select on public.task_completions;
create policy task_completions_select on public.task_completions for select to authenticated
  using (student_id = auth.uid() or private.is_parent_of(auth.uid(), student_id));

drop policy if exists task_completions_student_insert on public.task_completions;
create policy task_completions_student_insert on public.task_completions for insert to authenticated
  with check (student_id = auth.uid());

-- quizzes / videos: readable by all authenticated
drop policy if exists quizzes_read on public.quizzes;
create policy quizzes_read on public.quizzes for select to authenticated using (active);

drop policy if exists quiz_questions_read on public.quiz_questions;
create policy quiz_questions_read on public.quiz_questions for select to authenticated using (true);

drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated
  using (student_id = auth.uid() or private.is_parent_of(auth.uid(), student_id) or private.teacher_of(auth.uid(), student_id));

drop policy if exists quiz_attempts_insert on public.quiz_attempts;
create policy quiz_attempts_insert on public.quiz_attempts for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists videos_read on public.videos;
create policy videos_read on public.videos for select to authenticated using (true);

drop policy if exists video_watch_select on public.video_watch_events;
create policy video_watch_select on public.video_watch_events for select to authenticated
  using (student_id = auth.uid() or private.is_parent_of(auth.uid(), student_id));

drop policy if exists video_watch_insert on public.video_watch_events;
create policy video_watch_insert on public.video_watch_events for insert to authenticated
  with check (student_id = auth.uid());

-- expenses (privacy: no teacher access)
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select to authenticated
  using (
    student_id = auth.uid()
    or private.is_parent_of(auth.uid(), student_id)
  );

drop policy if exists expenses_owner_insert on public.expenses;
create policy expenses_owner_insert on public.expenses for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists expenses_owner_update on public.expenses;
create policy expenses_owner_update on public.expenses for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists expense_corrections_select on public.expense_corrections;
create policy expense_corrections_select on public.expense_corrections for select to authenticated
  using (exists (
    select 1 from public.expenses e
    where e.id = expense_corrections.expense_id
      and (e.student_id = auth.uid() or private.is_parent_of(auth.uid(), e.student_id))
  ));

drop policy if exists expense_corrections_insert on public.expense_corrections;
create policy expense_corrections_insert on public.expense_corrections for insert to authenticated
  with check (corrected_by = auth.uid());

drop policy if exists budgets_select on public.budgets;
create policy budgets_select on public.budgets for select to authenticated
  using (student_id = auth.uid() or private.is_parent_of(auth.uid(), student_id));

drop policy if exists budgets_parent_insert on public.budgets;
create policy budgets_parent_insert on public.budgets for insert to authenticated
  with check (student_id = auth.uid() or private.is_parent_of(auth.uid(), student_id));

-- reports
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated
  using (
    subject_id = auth.uid()
    or private.is_parent_of(auth.uid(), subject_id)
    or ('teacher' = any (visibility) and private.teacher_of(auth.uid(), subject_id))
  );

-- audit log: no client read
drop policy if exists audit_log_none on public.audit_log;
create policy audit_log_none on public.audit_log for select to authenticated using (false);

-- classes / enrollments / teachers
drop policy if exists classes_member_select on public.classes;
create policy classes_member_select on public.classes for select to authenticated
  using (
    exists (select 1 from public.teacher_classes tc where tc.class_id = classes.id and tc.teacher_profile_id = auth.uid())
    or exists (select 1 from public.class_enrollments ce where ce.class_id = classes.id and ce.student_profile_id = auth.uid())
  );

drop policy if exists class_enrollments_select on public.class_enrollments;
create policy class_enrollments_select on public.class_enrollments for select to authenticated
  using (
    student_profile_id = auth.uid()
    or exists (select 1 from public.teacher_classes tc where tc.class_id = class_enrollments.class_id and tc.teacher_profile_id = auth.uid())
    or private.is_parent_of(auth.uid(), student_profile_id)
  );

drop policy if exists teacher_classes_select on public.teacher_classes;
create policy teacher_classes_select on public.teacher_classes for select to authenticated
  using (teacher_profile_id = auth.uid());
