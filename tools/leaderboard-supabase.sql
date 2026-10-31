-- 奶蛙黄桃罐头店 · 全网排行榜（Supabase 版）
--
-- 用法：打开 Supabase 控制台 → 左侧 SQL Editor → New query → 粘贴本文件全部内容 → Run。
-- 可以重复执行（幂等），不会清掉已有成绩。
--
-- 执行完之后：游戏里的「排行榜」会自动从「本机排行榜」变成「全网排行榜 · 共 N 位玩家」，
-- 不需要改代码、也不需要重新部署（客户端已经在读这两个函数）。若函数不存在，游戏会静默退回本机榜。

-- 1. 成绩表：一个店长在一个模式里只存一条最好成绩
create table if not exists public.naiwa_rank (
  name text not null,
  mode text not null check (mode in ('endless', 'rogue')),
  week integer not null default 0,
  coins integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (name, mode)
);

alter table public.naiwa_rank enable row level security;

drop policy if exists naiwa_rank_read on public.naiwa_rank;
create policy naiwa_rank_read on public.naiwa_rank
  for select using (true);

-- 2. 上报成绩：同名字 + 同模式只保留更高的一档
create or replace function public.naiwa_submit_score(
  p_name text,
  p_mode text,
  p_week integer default 0,
  p_coins integer default 0
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_week integer;
  v_coins integer;
begin
  v_name := left(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g'), 12);
  if length(btrim(v_name)) = 0 then
    v_name := '无名店长';
  end if;
  if p_mode not in ('endless', 'rogue') then
    return;
  end if;
  v_week := greatest(0, least(coalesce(p_week, 0), 9999));
  v_coins := greatest(0, least(coalesce(p_coins, 0), 999999));

  insert into public.naiwa_rank (name, mode, week, coins, updated_at)
  values (v_name, p_mode, v_week, v_coins, now())
  on conflict (name, mode) do update set
    week = greatest(public.naiwa_rank.week, excluded.week),
    coins = greatest(public.naiwa_rank.coins, excluded.coins),
    updated_at = now();
end;
$$;

-- 3. 读取排行榜（返回 { "rows": [ {name, week, coins}, ... ] }）
create or replace function public.naiwa_top_rank(
  p_mode text,
  p_limit integer default 20
) returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'rows',
    coalesce(json_agg(row_to_json(t)), '[]'::json)
  )
  from (
    select name, week, coins
    from public.naiwa_rank
    where mode = case when p_mode in ('endless', 'rogue') then p_mode else 'endless' end
    order by week desc, coins desc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
  ) t;
$$;

-- 4. 权限：让网页用的 anon key 可以调用
grant execute on function public.naiwa_submit_score(text, text, integer, integer) to anon, authenticated;
grant execute on function public.naiwa_top_rank(text, integer) to anon, authenticated;
grant select on public.naiwa_rank to anon, authenticated;
