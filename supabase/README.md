# Supabase 云存档配置

游戏是纯静态页面，存档默认只在本机浏览器。  
Supabase 用来做“店长名字 + 4–8 位 PIN”的跨设备云存档。

> **当前线上版已预配置**：项目 URL `https://ckwfbkqnczlsvvrhhaqb.supabase.co`，anon public key 已内置，`schema.sql` 已执行。  
> 玩家打开「存档」只需设置 PIN，不需要自己建 Supabase。下面步骤仅用于换项目或自建。

## 1. 建项目

1. 打开 https://supabase.com/dashboard ，注册/登录。
2. 新建一个免费项目，记下项目 URL，例如 `https://abcdefgh.supabase.co`。
3. 在 **SQL Editor** 里整段运行 `supabase/schema.sql`。

## 2. 取 anon key

项目 **Settings → API**：

- `Project URL` → 游戏里的 Project URL
- `anon public` key → 游戏里的 anon public key

> 只使用 anon public key。  
> **不要**把 `service_role` key 放进网页。

## 3. 游戏里连接

标题页 →「存档」→「Supabase 云存档」：

1. 填 Project URL 和 anon key；
2. 输入 4–8 位数字 PIN；
3. 点「上传到 Supabase」；
4. 换设备时输入**同一个店长名字 + 同一个 PIN**，点「从 Supabase 读取」。

## 安全说明

- 表 `public.player_saves` 启用了 RLS，浏览器不能直接读表。
- 只能通过 `save_player` / `load_player` 两个函数访问。
- PIN 只保存 bcrypt 哈希，不会以明文存储。
- anon key 本身就是公开的，泄露它不能绕过 RLS。
- 如果有人知道店长名字，仍可以尝试猜 PIN；请使用不容易猜的数字，不要用 `1234`。

## 免费额度

Supabase 免费项目有数据库和带宽额度，个人小店足够。  
长期没有访问的项目可能被暂停，重新打开项目即可恢复。
