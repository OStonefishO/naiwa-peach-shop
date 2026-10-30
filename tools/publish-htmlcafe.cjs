const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const id = process.env.HTMLCAFE_ID;
const key = process.env.HTMLCAFE_KEY;
if (!id || !key) {
  console.log('html.cafe mirror skipped: HTMLCAFE_ID / HTMLCAFE_KEY not set');
  process.exit(0);
}
let html = fs.readFileSync(path.join(root, 'wechat-qq/index.html'), 'utf8');
for (const name of ['title', 'desk', 'work', 'summary']) {
  const file = path.join(root, 'wechat-qq/music', name + '.mp3');
  const data = fs.readFileSync(file).toString('base64');
  html = html.split('music/' + name + '.mp3').join('data:audio/mpeg;base64,' + data);
}
(async () => {
  const res = await fetch('https://html.cafe/_save/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, key, data: html })
  });
  const text = await res.text();
  if (text !== '1') throw new Error('html.cafe save failed: ' + text);
  const url = 'https://html.cafe/' + id;
  const check = await fetch(url);
  const page = await check.text();
  if (check.status !== 200 || !page.includes('奶蛙黄桃罐头店')) throw new Error('html.cafe verify failed');
  console.log('html.cafe mirror updated:', url, Buffer.byteLength(page), 'bytes');
})().catch(err => { console.error(err.message); process.exit(1); });
