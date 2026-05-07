-- 0004_expenses.sql — Module 3: Categories, merchants KB, expenses, budgets

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_zh text not null,
  icon text,
  color text,
  parent_id uuid references public.categories(id) on delete set null,
  ord smallint not null default 0
);

create table if not exists public.merchants_kb (
  id uuid primary key default gen_random_uuid(),
  name_normalized text unique not null,
  display_name_en text,
  display_name_zh text,
  default_category_id uuid references public.categories(id) on delete set null,
  aliases text[] not null default '{}',
  region text not null default 'HK',
  source text not null default 'seed',
  created_at timestamptz not null default now()
);

create index if not exists merchants_kb_name_trgm_idx
  on public.merchants_kb using gin (name_normalized gin_trgm_ops);
create index if not exists merchants_kb_aliases_idx
  on public.merchants_kb using gin (aliases);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  currency currency_code not null default 'HKD',
  merchant_text text,
  merchant_id uuid references public.merchants_kb(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  occurred_at timestamptz not null default now(),
  source expense_source not null,
  status expense_status not null default 'confirmed',
  raw_ocr jsonb,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  receipt_storage_path text,
  receipt_expires_at timestamptz,
  voice_storage_path text,
  voice_transcript text,
  notes text,
  ai_model text,
  ai_cost_usd numeric(8, 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists expenses_student_occurred_idx
  on public.expenses(student_id, occurred_at desc) where deleted_at is null;
create index if not exists expenses_category_idx on public.expenses(category_id);
create index if not exists expenses_status_idx on public.expenses(status);

drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses
  for each row execute function private.touch_updated_at();

create table if not exists public.expense_corrections (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  corrected_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  period text not null check (period in ('weekly','monthly')),
  limit_cents int not null check (limit_cents > 0),
  active boolean not null default true,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

create index if not exists budgets_student_idx on public.budgets(student_id, active);

-- Confirm an expense and grant a small coin reward (capped 6/day to prevent grinding).
create or replace function public.confirm_expense(p_expense_id uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_exp public.expenses;
  v_pet public.pets;
  v_today_count int;
  v_reward int := 0;
begin
  select * into v_exp from public.expenses
    where id = p_expense_id and student_id = auth.uid()
    for update;
  if not found then raise exception 'expense_not_found'; end if;

  if v_exp.status <> 'confirmed' then
    update public.expenses set status = 'confirmed' where id = v_exp.id;
  end if;

  select * into v_pet from public.pets where student_id = auth.uid();
  if not found then return 0; end if;

  select count(*) into v_today_count
    from public.coin_ledger
    where pet_id = v_pet.id
      and reason = 'expense_log'
      and created_at >= date_trunc('day', now() at time zone 'Asia/Hong_Kong');

  if v_today_count < 3 then
    v_reward := 2;
    insert into public.coin_ledger (pet_id, delta, reason, ref_table, ref_id)
      values (v_pet.id, v_reward, 'expense_log', 'expenses', v_exp.id);
  end if;

  return v_reward;
end $$;

-- Helpful view: this-week spend by category for a student
create or replace view public.v_expense_by_category_week as
select
  e.student_id,
  c.slug as category_slug,
  c.name_en, c.name_zh,
  date_trunc('week', e.occurred_at at time zone 'Asia/Hong_Kong') as week_start,
  sum(e.amount_cents)::int as total_cents,
  count(*)::int as log_count
from public.expenses e
left join public.categories c on c.id = e.category_id
where e.deleted_at is null and e.status = 'confirmed'
group by 1, 2, 3, 4, 5;
