-- 0002_pets_shop.sql — Module 1: Pet, shop, coin ledger

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null default 'Capy',
  level smallint not null default 1 check (level >= 1),
  xp int not null default 0 check (xp >= 0),
  hp smallint not null default 80 check (hp between 0 and 100),
  happiness smallint not null default 80 check (happiness between 0 and 100),
  hunger smallint not null default 50 check (hunger between 0 and 100),
  coins int not null default 0 check (coins >= 0),
  last_tick_at timestamptz not null default now(),
  equipped jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists pets_touch on public.pets;
create trigger pets_touch before update on public.pets
  for each row execute function private.touch_updated_at();

create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  kind shop_item_kind not null,
  name_en text not null,
  name_zh text not null,
  price_coins int not null check (price_coins >= 0),
  rarity smallint not null default 1,
  asset_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pet_inventory (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  unique (pet_id, item_id)
);

create table if not exists public.coin_ledger (
  id bigserial primary key,
  pet_id uuid not null references public.pets(id) on delete cascade,
  delta int not null,
  reason text not null,
  ref_table text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists coin_ledger_pet_idx on public.coin_ledger(pet_id, created_at desc);

-- Materialize coins on pets via ledger trigger
create or replace function private.apply_coin_ledger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.pets
    set coins = greatest(0, coins + new.delta),
        updated_at = now()
    where id = new.pet_id;
  return new;
end $$;

drop trigger if exists coin_ledger_apply on public.coin_ledger;
create trigger coin_ledger_apply after insert on public.coin_ledger
  for each row execute function private.apply_coin_ledger();

-- Pet decay constants live in lib/pet/mechanics.ts; rpc.tick_pet is idempotent server-time.
create or replace function public.tick_pet(p_pet_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pet_row public.pets;
  hours_elapsed numeric;
begin
  select * into pet_row from public.pets where id = p_pet_id for update;
  if not found then return; end if;

  hours_elapsed := extract(epoch from (now() - pet_row.last_tick_at)) / 3600.0;
  if hours_elapsed < 0.05 then return; end if; -- 3 minutes throttle

  update public.pets
    set hp = greatest(0, hp - floor(hours_elapsed * 1)::int),
        happiness = greatest(0, happiness - floor(hours_elapsed * 2)::int),
        hunger = least(100, hunger + floor(hours_elapsed * 3)::int),
        last_tick_at = now(),
        updated_at = now()
    where id = p_pet_id;
end $$;

create or replace function public.purchase_item(p_item_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_pet public.pets;
  v_item public.shop_items;
  v_inv_id uuid;
begin
  select p.* into v_pet
    from public.pets p
    where p.student_id = auth.uid()
    for update;
  if not found then raise exception 'no_pet'; end if;

  select * into v_item from public.shop_items where id = p_item_id and active;
  if not found then raise exception 'item_not_found'; end if;

  if v_pet.coins < v_item.price_coins then raise exception 'insufficient_coins'; end if;

  insert into public.pet_inventory (pet_id, item_id) values (v_pet.id, v_item.id)
    on conflict (pet_id, item_id) do nothing
    returning id into v_inv_id;

  if v_inv_id is null then raise exception 'already_owned'; end if;

  insert into public.coin_ledger (pet_id, delta, reason, ref_table, ref_id)
    values (v_pet.id, -v_item.price_coins, 'shop_purchase', 'shop_items', v_item.id);

  return v_inv_id;
end $$;
