-- ============================================================================
-- get_points_history — лента транзакций баллов текущего юзера (Activity → Сводка).
-- Зеркало get_points_balance: language sql, SECURITY DEFINER, фильтр auth.uid(),
-- read-only. user_points используется как леджер (строка на каждое начисление/донат).
-- Идемпотентно (create or replace). Начисления/списания НЕ затрагиваются.
-- ============================================================================
create or replace function public.get_points_history(p_limit int default 30)
returns table (points int, reason text, source_type text, created_at timestamptz)
language sql security definer set search_path to 'public'
as $$
  select points, reason, source_type, created_at
  from public.user_points
  where user_id = auth.uid()
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

grant execute on function public.get_points_history(int) to authenticated;
