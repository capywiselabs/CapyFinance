-- 0003_tasks.sql — Module 2: Tasks, quizzes, videos

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete cascade,
  kind task_kind not null,
  title text not null,
  description text,
  reward_coins int not null default 5 check (reward_coins between 0 and 200),
  due_at timestamptz,
  status task_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists tasks_assignee_idx on public.tasks(assignee_id, status);

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function private.touch_updated_at();

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  evidence_url text,
  notes text,
  approver_id uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_reason text,
  status task_status not null default 'submitted'
);

create index if not exists task_completions_task_idx on public.task_completions(task_id);
create index if not exists task_completions_student_idx on public.task_completions(student_id, submitted_at desc);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_zh text not null,
  topic text,
  age_min smallint default 6,
  age_max smallint default 12,
  active boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt_en text not null,
  prompt_zh text not null,
  choices jsonb not null,
  correct_index smallint not null,
  ord smallint not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null,
  answers jsonb,
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_student_idx on public.quiz_attempts(student_id, created_at desc);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_zh text not null,
  url text not null,
  duration_sec int not null check (duration_sec > 0),
  age_min smallint default 6,
  age_max smallint default 12,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.video_watch_events (
  id bigserial primary key,
  video_id uuid not null references public.videos(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  watched_seconds int not null check (watched_seconds >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Approve a task: callable only by parent in same family. Atomic ledger update.
create or replace function public.approve_task(p_completion_id uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_completion public.task_completions;
  v_task public.tasks;
  v_pet public.pets;
  v_is_parent boolean;
begin
  select * into v_completion from public.task_completions
    where id = p_completion_id and status = 'submitted'
    for update;
  if not found then raise exception 'completion_not_pending'; end if;

  select * into v_task from public.tasks where id = v_completion.task_id;

  -- caller must be parent in the same family
  select exists (
    select 1
    from public.family_members fm_parent
    join public.family_members fm_child on fm_child.family_id = fm_parent.family_id
    where fm_parent.profile_id = auth.uid()
      and fm_parent.relation = 'parent'
      and fm_child.profile_id = v_completion.student_id
  ) into v_is_parent;

  if not v_is_parent then raise exception 'not_parent'; end if;

  update public.task_completions
    set status = 'approved', approver_id = auth.uid(), approved_at = now()
    where id = p_completion_id;

  update public.tasks
    set status = 'approved', updated_at = now()
    where id = v_task.id;

  select * into v_pet from public.pets where student_id = v_completion.student_id;
  if found then
    insert into public.coin_ledger (pet_id, delta, reason, ref_table, ref_id)
      values (v_pet.id, v_task.reward_coins, 'task_reward', 'task_completions', p_completion_id);
    update public.pets
      set happiness = least(100, happiness + 5),
          updated_at = now()
      where id = v_pet.id;
  end if;

  insert into public.audit_log (actor_id, action, target_table, target_id)
    values (auth.uid(), 'approve_task', 'task_completions', p_completion_id);

  return v_task.reward_coins;
end $$;
