-- 0001_init.sql — extensions, enums, identity / family / org

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "citext";

create schema if not exists private;

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student','parent','teacher','school_admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_kind') then
    create type task_kind as enum ('real','virtual_video','virtual_quiz');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('draft','active','submitted','approved','rejected','expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_source') then
    create type expense_source as enum ('photo','voice','manual','imported');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type expense_status as enum ('pending_review','confirmed','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'currency_code') then
    create type currency_code as enum ('HKD','CNY','USD');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_period') then
    create type report_period as enum ('weekly','monthly','term');
  end if;
  if not exists (select 1 from pg_type where typname = 'shop_item_kind') then
    create type shop_item_kind as enum ('hat','shirt','accessory','background','material');
  end if;
end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  display_name text not null check (length(display_name) between 1 and 60),
  avatar_url text,
  locale text not null default 'zh-HK',
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- Families
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  family_code text unique not null check (length(family_code) between 4 and 12),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relation text not null check (relation in ('parent','child','guardian')),
  primary key (family_id, profile_id)
);

create index if not exists family_members_profile_idx on public.family_members(profile_id);

-- Schools / classes (lightweight, expand in P5)
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  grade smallint,
  year smallint,
  created_at timestamptz not null default now()
);

create table if not exists public.class_enrollments (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (class_id, student_profile_id)
);

create table if not exists public.teacher_classes (
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  primary key (teacher_profile_id, class_id)
);

-- Audit log (insert-only)
create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);

-- updated_at helper
create or replace function private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
