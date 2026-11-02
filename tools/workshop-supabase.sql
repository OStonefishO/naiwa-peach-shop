-- 奶蛙黄桃罐头店 · 创意工坊（Supabase）
-- 在 Supabase 项目的 SQL Editor 里整段运行一次即可。
-- 作用：建地图表、允许匿名读写、点赞/下载计数函数。

create table if not exists public.naiwa_maps (
  id text primary key,
  name text not null,
  author text default '匿名',
  code text not null,
  cover text default '',
  likes int not null default 0,
  plays int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.naiwa_maps enable row level security;

drop policy if exists naiwa_maps_read on public.naiwa_maps;
create policy naiwa_maps_read on public.naiwa_maps
  for select using (true);

drop policy if exists naiwa_maps_insert on public.naiwa_maps;
create policy naiwa_maps_insert on public.naiwa_maps
  for insert with check (char_length(name) between 1 and 24 and char_length(code) < 20000);

-- 点赞 +1
create or replace function public.naiwa_map_like(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.naiwa_maps set likes = likes + 1 where id = p_id;
$$;

-- 下载 +1
create or replace function public.naiwa_map_play(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.naiwa_maps set plays = plays + 1 where id = p_id;
$$;

grant execute on function public.naiwa_map_like(text) to anon, authenticated;
grant execute on function public.naiwa_map_play(text) to anon, authenticated;
grant select, insert on public.naiwa_maps to anon, authenticated;
