-- 0005_reports.sql — Module 4: AI-generated reports + Stripe stubs

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.profiles(id) on delete cascade,
  period report_period not null,
  period_start date not null,
  period_end date not null,
  summary_md text,
  metrics jsonb not null default '{}'::jsonb,
  ai_model text,
  generated_at timestamptz not null default now(),
  visibility text[] not null default '{parent}',
  unique (subject_id, period, period_start)
);

create index if not exists reports_subject_idx on public.reports(subject_id, generated_at desc);

-- Stripe stubs (DEFERRED — Phase 6)
create table if not exists public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  customer_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  status text not null,
  plan text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
