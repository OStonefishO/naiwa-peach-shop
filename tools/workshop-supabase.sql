-- 奶蛙黄桃罐头店 · 创意工坊（v2：新增 owner / code_hash / 删除策略 / 搜索支持）
create table if not exists public.naiwa_maps (
  id text primary key,
  name text not null,
  author text not null default '匿名',
  code text not null,
  cover text default '',
  intro text default '',
  gameplay text default '',
  likes int not null default 0,
  plays int not null default 0,
  created_at timestamptz not null default now()
);

-- 老表补齐新字段（幂等）
alter table public.naiwa_maps add column if not exists owner text default '';
alter table public.naiwa_maps add column if not exists code_hash text default '';
alter table public.naiwa_maps add column if not exists intro text default '';
alter table public.naiwa_maps add column if not exists gameplay text default '';
create index if not exists naiwa_maps_codehash_idx on public.naiwa_maps (owner, code_hash);
create index if not exists naiwa_maps_created_idx on public.naiwa_maps (created_at desc);

alter table public.naiwa_maps enable row level security;

-- 读：所有人
drop policy if exists "naiwa_maps read" on public.naiwa_maps;
create policy "naiwa_maps read" on public.naiwa_maps for select using (true);

-- 上传：限制字段长度
drop policy if exists "naiwa_maps insert" on public.naiwa_maps;
create policy "naiwa_maps insert" on public.naiwa_maps for insert with check (
  char_length(name) between 1 and 24 and char_length(code) < 20000
);

-- 删除：开发者模式用（客户端会先判断 devMode）
drop policy if exists "naiwa_maps delete" on public.naiwa_maps;
create policy "naiwa_maps delete" on public.naiwa_maps for delete using (true);

-- 点赞 / 下载计数（security definer，避免直接改行）
create or replace function public.naiwa_map_like(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.naiwa_maps set likes = likes + 1 where id = p_id;
end $$;

create or replace function public.naiwa_map_play(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.naiwa_maps set plays = plays + 1 where id = p_id;
end $$;

grant select, insert, delete on public.naiwa_maps to anon, authenticated;
grant execute on function public.naiwa_map_like(text) to anon, authenticated;
grant execute on function public.naiwa_map_play(text) to anon, authenticated;
