-- ============================================================================
-- Gamification engine (server-side) + Charity Variant B
-- Консолидирует SQL, применённый в Supabase за сессию (для синхронизации repo↔DB).
-- Идемпотентно: безопасно прогонять на свежей БД и поверх уже применённого.
-- Заменяет/дополняет старую миграцию make_donation (Variant A → Variant B).
-- ============================================================================

-- ============================== gamification_config =========================
create table if not exists public.gamification_config (
  event_key          text primary key,
  points             integer not null,
  trust_tier         text check (trust_tier in ('A','B','C','D')),
  daily_cap          integer,
  monthly_cap_points integer,
  cooldown_seconds   integer,
  window_days        integer,
  enabled            boolean not null default true
);

insert into public.gamification_config
  (event_key, points, trust_tier, daily_cap, monthly_cap_points, cooldown_seconds, window_days, enabled) values
  ('visit_verified',       50, 'A', null, null, null, null, true),
  ('vaccination_verified', 50, 'A', null, null, null, null, true),
  ('reminder_completed',   20, 'A', null, null, null, 3,    true),
  ('course_completed',     10, 'A', null, null, null, null, true),
  ('ocr_document',         15, 'B', 5,    null, null, null, true),
  ('daily_checkin',         2, 'C', 1,    null, null, null, true),
  ('streak_7',             15, 'C', null, null, null, null, true),
  ('streak_30',            50, 'C', null, null, null, null, true),
  ('manual_first',          5, 'D', null, null, null, null, true)
on conflict (event_key) do nothing;

alter table public.gamification_config enable row level security;
drop policy if exists gamification_config_select on public.gamification_config;
create policy gamification_config_select
  on public.gamification_config for select to authenticated using (true);

-- ===================== user_points: server-side fields ======================
alter table public.user_points
  add column if not exists source_type text,
  add column if not exists dedup_key   text;

create unique index if not exists user_points_dedup_uniq
  on public.user_points (user_id, source_type, dedup_key)
  where dedup_key is not null;

create index if not exists user_points_user_created_idx
  on public.user_points (user_id, created_at desc);

-- ============================ award_points + balance ========================
create or replace function public.award_points(
  p_user_id uuid, p_event_key text, p_dedup_key text, p_source_type text default 'app'
) returns json language plpgsql security definer set search_path to 'public'
as $$
declare
  v_caller uuid := auth.uid();
  v_cfg public.gamification_config%rowtype;
  v_points int; v_cnt int; v_month_event int; v_month_total int;
  v_last_at timestamptz; v_inserted int; v_balance int;
  v_global_cap constant int := 250;  -- §7: ~250 баллов/мес/юзер (tunable)
begin
  if v_caller is not null and v_caller <> p_user_id then
    raise exception 'forbidden: cannot award points to another user';
  end if;
  if p_dedup_key is null or length(trim(p_dedup_key)) = 0 then
    raise exception 'dedup_key is required';
  end if;

  select * into v_cfg from public.gamification_config where event_key = p_event_key and enabled = true;
  if not found then
    select coalesce(sum(points),0) into v_balance from public.user_points where user_id = p_user_id;
    return json_build_object('awarded', false, 'reason', 'event_disabled_or_unknown', 'new_balance', v_balance);
  end if;
  v_points := v_cfg.points;

  if v_cfg.cooldown_seconds is not null then
    select max(created_at) into v_last_at from public.user_points
     where user_id = p_user_id and reason = p_event_key and points > 0;
    if v_last_at is not null and v_last_at > now() - make_interval(secs => v_cfg.cooldown_seconds) then
      select coalesce(sum(points),0) into v_balance from public.user_points where user_id = p_user_id;
      return json_build_object('awarded', false, 'reason', 'cooldown', 'new_balance', v_balance);
    end if;
  end if;

  if v_cfg.daily_cap is not null then
    select count(*) into v_cnt from public.user_points
     where user_id = p_user_id and reason = p_event_key and points > 0 and created_at >= date_trunc('day', now());
    if v_cnt >= v_cfg.daily_cap then
      select coalesce(sum(points),0) into v_balance from public.user_points where user_id = p_user_id;
      return json_build_object('awarded', false, 'reason', 'daily_cap', 'new_balance', v_balance);
    end if;
  end if;

  if v_cfg.monthly_cap_points is not null then
    select coalesce(sum(points),0) into v_month_event from public.user_points
     where user_id = p_user_id and reason = p_event_key and points > 0 and created_at >= date_trunc('month', now());
    if v_month_event + v_points > v_cfg.monthly_cap_points then
      select coalesce(sum(points),0) into v_balance from public.user_points where user_id = p_user_id;
      return json_build_object('awarded', false, 'reason', 'monthly_event_cap', 'new_balance', v_balance);
    end if;
  end if;

  select coalesce(sum(points),0) into v_month_total from public.user_points
   where user_id = p_user_id and dedup_key is not null and points > 0 and created_at >= date_trunc('month', now());
  if v_month_total + v_points > v_global_cap then
    select coalesce(sum(points),0) into v_balance from public.user_points where user_id = p_user_id;
    return json_build_object('awarded', false, 'reason', 'global_monthly_cap', 'new_balance', v_balance);
  end if;

  insert into public.user_points (user_id, points, reason, source_type, dedup_key)
  values (p_user_id, v_points, p_event_key, p_source_type, p_dedup_key)
  on conflict (user_id, source_type, dedup_key) where dedup_key is not null do nothing;
  get diagnostics v_inserted = row_count;

  select coalesce(sum(points),0) into v_balance from public.user_points where user_id = p_user_id;
  if v_inserted = 0 then
    return json_build_object('awarded', false, 'reason', 'duplicate', 'new_balance', v_balance);
  end if;
  return json_build_object('awarded', true, 'reason', 'ok', 'points', v_points, 'new_balance', v_balance);
end; $$;

create or replace function public.get_points_balance()
returns integer language sql security definer set search_path to 'public'
as $$ select coalesce(sum(points),0)::int from public.user_points where user_id = auth.uid(); $$;

grant execute on function public.award_points(uuid, text, text, text) to authenticated;
grant execute on function public.get_points_balance() to authenticated;

-- ========================= user_points RLS lockdown =========================
-- Прямой INSERT/UPDATE/DELETE с клиента запрещён; начисление/списание — только
-- через SECURITY DEFINER RPC (award_points / make_donation), они в обход RLS.
alter table public.user_points enable row level security;
drop policy if exists "Users see own points" on public.user_points;
drop policy if exists "user_points_select_own" on public.user_points;
create policy "user_points_select_own"
  on public.user_points for select to authenticated using (auth.uid() = user_id);

-- ========================= charity Variant B: schema ========================
create table if not exists public.charity_pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount_byn numeric not null,            -- размер пула на период (заглушка, правится позже)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.charity_pool_periods (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.charity_pools(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'open' check (status in ('open','closed','paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.charity_distributions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.charity_pool_periods(id) on delete cascade,
  shelter_id uuid not null references public.shelters(id),
  points_share int not null,
  amount_byn numeric not null,            -- доля пула по баллам (не фикс-курс)
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

alter table public.charity_donations
  add column if not exists period_id uuid references public.charity_pool_periods(id);

insert into public.charity_pools (name, amount_byn, active)
select 'Основной пул', 4000, true
where not exists (select 1 from public.charity_pools);

insert into public.charity_pool_periods (pool_id, period_start, period_end, status)
select p.id, date_trunc('month', now())::date,
       (date_trunc('month', now()) + interval '1 month - 1 day')::date, 'open'
from public.charity_pools p
where p.active = true
  and not exists (select 1 from public.charity_pool_periods where status = 'open');

alter table public.charity_pools enable row level security;
alter table public.charity_pool_periods enable row level security;
alter table public.charity_distributions enable row level security;
drop policy if exists charity_pools_select on public.charity_pools;
create policy charity_pools_select on public.charity_pools for select to authenticated using (true);
drop policy if exists charity_periods_select on public.charity_pool_periods;
create policy charity_periods_select on public.charity_pool_periods for select to authenticated using (true);
drop policy if exists charity_distributions_select on public.charity_distributions;
create policy charity_distributions_select on public.charity_distributions for select to authenticated using (true);

-- ========================== charity Variant B: RPC ==========================
-- make_donation: списание баллов = «голос» за приют в текущем открытом периоде
-- (без прямой выплаты по курсу). Сигнатура сохранена (клиент не меняется).
create or replace function public.make_donation(
  p_user_id uuid, p_shelter_id uuid, p_points integer
) returns json language plpgsql security definer set search_path to 'public'
as $$
declare v_caller uuid := auth.uid(); v_balance int; v_shelter text; v_period uuid;
begin
  if v_caller is not null and v_caller <> p_user_id then
    raise exception 'forbidden: cannot donate from another user balance';
  end if;
  if p_points is null or p_points <= 0 then raise exception 'points must be positive'; end if;

  select coalesce(sum(points),0) into v_balance from user_points where user_id = p_user_id;
  if v_balance < p_points then raise exception 'Insufficient points. Current: %, required: %', v_balance, p_points; end if;

  select name into v_shelter from shelters where id = p_shelter_id and active = true;
  if v_shelter is null then raise exception 'Shelter not found or inactive'; end if;

  select id into v_period from charity_pool_periods
   where status='open' and now()::date between period_start and period_end
   order by created_at desc limit 1;
  if v_period is null then raise exception 'No open charity period'; end if;

  insert into user_points (user_id, points, reason, source_type)
  values (p_user_id, -p_points, 'Donation to ' || v_shelter, 'donation');

  insert into charity_donations (user_id, shelter_id, points_spent, shelter_name, period_id)
  values (p_user_id, p_shelter_id, p_points, v_shelter, v_period);

  update shelters set total_donations = total_donations + p_points where id = p_shelter_id;

  select coalesce(sum(points),0) into v_balance from user_points where user_id = p_user_id;
  return json_build_object('success',true,'new_balance',v_balance,
    'shelter_name',v_shelter,'points_spent',p_points,'period_id',v_period);
end; $$;

-- distribute_pool: закрытие периода, пул делится пропорционально голосам приютов.
create or replace function public.distribute_pool(p_period_id uuid)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare v_status text; v_pool numeric; v_total int; v_rows int;
begin
  select pp.status, cp.amount_byn into v_status, v_pool
  from charity_pool_periods pp join charity_pools cp on cp.id = pp.pool_id where pp.id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then raise exception 'Period not open (status=%)', v_status; end if;

  select coalesce(sum(points_spent),0) into v_total from charity_donations where period_id = p_period_id;
  delete from charity_distributions where period_id = p_period_id;
  if v_total > 0 then
    insert into charity_distributions (period_id, shelter_id, points_share, amount_byn)
    select p_period_id, d.shelter_id, sum(d.points_spent),
           round(v_pool * sum(d.points_spent)::numeric / v_total, 2)
    from charity_donations d where d.period_id = p_period_id group by d.shelter_id;
    get diagnostics v_rows = row_count;
  else v_rows := 0; end if;

  update charity_pool_periods set status='closed' where id = p_period_id;
  return json_build_object('success',true,'period_id',p_period_id,
    'pool_amount_byn',v_pool,'total_points',v_total,'shelters_distributed',v_rows);
end; $$;

grant execute on function public.make_donation(uuid, uuid, integer) to authenticated;
revoke execute on function public.distribute_pool(uuid) from public;  -- админская операция
