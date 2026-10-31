/**
 * 奶蛙黄桃罐头店 · 全网排行榜（Cloudflare Worker + KV）
 *
 * 为什么需要它：游戏是纯静态页面，排行榜默认只存在每台设备的 localStorage 里，
 * 换设备就互相看不见。想「所有玩家一起排名」必须有一个共享的后端。这个 Worker
 * 用 Cloudflare 免费额度就能跑（KV 免费 1GB / 每天 10 万次读），5 分钟部署完。
 *
 * 部署步骤：
 *   1. 打开 https://dash.cloudflare.com → Workers & Pages → Create → Worker，名字随意；
 *   2. 把本文件全部粘贴进去，Deploy；
 *   3. 在该 Worker 的 Settings → Variables → KV Namespace Bindings 新建一个 KV，
 *      变量名填 RANK_KV（名字必须一致），保存并重新 Deploy；
 *   4. 复制 Worker 地址（形如 https://xxx.yyy.workers.dev），
 *      填到 src/game.v2.js 顶部的 `const RANK_API = '';` 里，重新构建部署游戏；
 *   5. 打开游戏 → 排行榜，页脚会显示「全网排行榜 · 共 N 位玩家」。
 *
 * 接口：
 *   POST /submit  { name, mode:'endless'|'rogue', week, coins }
 *   GET  /top?mode=endless|rogue  → { rows:[{name, week, coins}] }
 *
 * 防刷：同一名字只保留最好成绩；每个模式最多存 200 条；名字截断到 12 字。
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const MODES = ['endless', 'rogue'];
const KEEP = 200;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS }
  });
}

function cleanName(name) {
  return String(name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12) || '无名店长';
}

async function readList(env, mode) {
  const raw = await env.RANK_KV.get(`rank:${mode}`);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function sortList(list) {
  return list
    .sort((a, b) => (b.week || 0) - (a.week || 0) || (b.coins || 0) - (a.coins || 0))
    .slice(0, KEEP);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/submit' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return json({ ok: false, error: 'bad json' }, 400);
      }
      const mode = MODES.includes(body.mode) ? body.mode : null;
      if (!mode) return json({ ok: false, error: 'bad mode' }, 400);

      const name = cleanName(body.name);
      const week = Math.max(0, Math.min(9999, Number(body.week) || 0));
      const coins = Math.max(0, Math.min(999999, Number(body.coins) || 0));

      const list = await readList(env, mode);
      const old = list.find(p => p.name === name);
      if (old) {
        // 只保留更好的成绩，避免刷榜把记录刷低
        if (week > (old.week || 0) || coins > (old.coins || 0)) {
          old.week = Math.max(old.week || 0, week);
          old.coins = Math.max(old.coins || 0, coins);
        }
      } else {
        list.push({ name, week, coins });
      }
      await env.RANK_KV.put(`rank:${mode}`, JSON.stringify(sortList(list)));
      return json({ ok: true });
    }

    if (url.pathname === '/top' && request.method === 'GET') {
      const mode = MODES.includes(url.searchParams.get('mode')) ? url.searchParams.get('mode') : 'endless';
      const list = await readList(env, mode);
      return json({ rows: sortList(list).slice(0, 20) });
    }

    return json({ ok: true, hint: 'POST /submit or GET /top?mode=endless' });
  }
};
