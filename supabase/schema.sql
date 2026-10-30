-- 奶蛙黄桃罐头店 · Supabase 云存档
-- 在 Supabase Dashboard → SQL Editor 中整段运行一次。
-- 存档按“店长名字 + PIN”保存；PIN 只以 bcrypt 哈希存在数据库里。

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.player_saves (
  name       text primary key,
  pin_hash   text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.player_saves enable row level security;

-- 不允许浏览器直接读写表，只能通过下面的 RPC 函数。
revoke all on table public.player_saves from anon, authenticated;

create or replace function public.save_player(
  p_name text,
  p_pin  text,
  p_data jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_name text := lower(btrim(coalesce(p_name, '')));
  v_hash text;
  v_now  timestamptz := now();
begin
  if length(v_name) < 1 or length(v_name) > 24 then
    raise exception 'invalid name';
  end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then
    raise exception 'pin too short';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'invalid data';
  end if;
  if octet_length(p_data::text) > 200000 then
    raise exception 'save too large';
  end if;

  select pin_hash into v_hash from public.player_saves where name = v_name;

  if found then
    if v_hash <> extensions.crypt(p_pin, v_hash) then
      raise exception 'wrong pin';
    end if;
    update public.player_saves
       set data = p_data, updated_at = v_now
     where name = v_name;
  else
    insert into public.player_saves(name, pin_hash, data, updated_at)
    values (v_name, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)), p_data, v_now);
  end if;

  return jsonb_build_object('ok', true, 'name', v_name, 'updated_at', v_now);
end;
$$;

create or replace function public.load_player(
  p_name text,
  p_pin  text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_name text := lower(btrim(coalesce(p_name, '')));
  v_row  public.player_saves%rowtype;
begin
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then
    raise exception 'pin too short';
  end if;

  select * into v_row from public.player_saves where name = v_name;
  if not found then
    raise exception 'not found';
  end if;
  if v_row.pin_hash <> extensions.crypt(p_pin, v_row.pin_hash) then
    raise exception 'wrong pin';
  end if;

  return v_row.data;
end;
$$;

revoke all on function public.save_player(text, text, jsonb) from public;
revoke all on function public.load_player(text, text) from public;
grant execute on function public.save_player(text, text, jsonb) to anon, authenticated;
grant execute on function public.load_player(text, text) to anon, authenticated;

-- 可选：查看最近存档时间（只在 Dashboard 里用，浏览器无权访问）
-- select name, updated_at, octet_length(data::text) from public.player_saves order by updated_at desc;
