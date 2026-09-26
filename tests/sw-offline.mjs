// sw.js 離線自我檢查：node tests/sw-offline.mjs
// iOS 飛行模式下 fetch 唔一定失敗，可以一直唔返；Chromium 離線會即刻失敗，模擬唔到。
// 所以呢度用一個永遠唔 resolve 嘅 fetch，驗 service worker 會唔會因為等佢而交唔到嘢（主畫面 app 黑屏）。
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const BASE = 'https://x.test/app/';
class Req { constructor(u) { this.url = typeof u === 'string' ? new URL(u, BASE).href : u.url; } }

function load({ fetchImpl, cached = [], onLine = true }) {
  const store = new Map(cached.map(([u, body, type]) => [new URL(u, BASE).href, new Response(body, { headers: { 'Content-Type': type || 'text/html' } })]));
  const key = r => (typeof r === 'string' ? new URL(r, BASE).href : r.url);
  const cache = { match: async r => store.get(key(r))?.clone(), put: async (r, res) => { store.set(key(r), res); }, addAll: async () => {} };
  const handlers = {};
  const self = { addEventListener: (t, f) => (handlers[t] = f), navigator: { onLine }, clients: { matchAll: async () => [], claim: async () => {} }, skipWaiting() {} };
  const caches = { open: async () => cache, match: r => cache.match(r), keys: async () => [], delete: async () => true };
  new Function('self', 'caches', 'fetch', 'Request', src)(self, caches, fetchImpl, Req);
  return { fetch: handlers.fetch, store };
}
function run(h, url) {
  let p; const t0 = Date.now();
  h.fetch({ request: new Req(url), respondWith: x => (p = Promise.resolve(x)) });
  // 8 秒都交唔到嘢＝主畫面 app 會黑屏（舊版 sw.js 就係咁）
  const never = new Promise(r => setTimeout(r, 8000, null)).then(() => ({ res: new Response('NEVER ANSWERED'), ms: 8000 }));
  return Promise.race([p.then(res => ({ res, ms: Date.now() - t0 })), never]);
}
const hang = () => new Promise(() => {});
const pending = (p, ms) => Promise.race([p.then(() => false), new Promise(r => setTimeout(r, ms, true))]);
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? '✅' : '❌'} ${name} ${extra}`); if (!ok) fails++; };

// 1. 頁面：fetch 一直唔返，有快取 → 3 秒左右交快取（以前永遠等，黑屏）
{ const h = load({ fetchImpl: hang, cached: [['index.html', 'CACHED']] });
  const { res, ms } = await run(h, BASE + 'index.html');
  check('頁面：fetch 卡住，有快取 → 交快取', (await res.text()) === 'CACHED' && ms >= 2900 && ms < 3600, `${ms}ms`); }
// 2. 頁面：已知離線（onLine false）→ 即刻交快取
{ const h = load({ fetchImpl: hang, cached: [['index.html', 'CACHED']], onLine: false });
  const { res, ms } = await run(h, BASE + 'index.html');
  check('頁面：已知離線 → 即刻交快取', (await res.text()) === 'CACHED' && ms < 200, `${ms}ms`); }
// 3. 頁面：冇快取、網絡慢 → 唔可以交空嘢，要繼續等網絡
{ const h = load({ fetchImpl: hang });
  let p; h.fetch({ request: new Req(BASE + 'index.html'), respondWith: x => (p = Promise.resolve(x)) });
  check('頁面：冇快取 → 繼續等網絡，唔交空嘢', await pending(p, 3500)); }
// 4. 頁面：網絡正常 → 用網絡版，兼更新快取
{ const h = load({ fetchImpl: async () => new Response('FRESH'), cached: [['index.html', 'OLD']] });
  const { res } = await run(h, BASE + 'index.html');
  await new Promise(r => setTimeout(r, 50));
  check('頁面：網絡正常 → 新版兼更新快取', (await res.text()) === 'FRESH' && (await h.store.get(BASE + 'index.html').clone().text()) === 'FRESH'); }
// 5. Google Fonts 樣式表：卡住又冇快取 → 3 秒後交空白 CSS，唔好阻住畫面
{ const h = load({ fetchImpl: hang });
  const { res, ms } = await run(h, 'https://fonts.googleapis.com/css2?family=X');
  check('字型樣式表：卡住冇快取 → 空白 CSS', (await res.text()) === '' && res.headers.get('Content-Type') === 'text/css' && ms < 3600, `${ms}ms`); }
// 6. Google Fonts：有快取 → 即刻交
{ const h = load({ fetchImpl: hang, cached: [['https://fonts.gstatic.com/a.woff2', 'FONT', 'font/woff2']] });
  const { res, ms } = await run(h, 'https://fonts.gstatic.com/a.woff2');
  check('字型檔：有快取 → 即刻交', (await res.text()) === 'FONT' && ms < 200, `${ms}ms`); }
// 7. Sanity API：卡住，有快取 → 4 秒左右交快取
{ const h = load({ fetchImpl: hang, cached: [['https://bw3aid78.apicdn.sanity.io/q?x=1', '{"result":[]}', 'application/json']] });
  const { res, ms } = await run(h, 'https://bw3aid78.apicdn.sanity.io/q?x=1');
  check('Sanity API：卡住，有快取 → 交快取', (await res.text()) === '{"result":[]}' && ms >= 3900 && ms < 4600, `${ms}ms`); }
// 8. 頁面版本號要同 sw.js 一樣：頁面細過 SW 就會以為自己係舊版，每次更新都多載入一次
{ const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const a = +(/const APP_VER=(\d+)/.exec(html) || [])[1], b = +(/kfbg-pages-v(\d+)/.exec(src) || [])[1];
  check('版本號：index.html APP_VER 同 sw.js PAGE_CACHE 一致', a > 0 && a === b, `index ${a} · sw ${b}`); }

console.log(fails ? `\n❌ ${fails} 項失敗` : '\n✅ 全部通過');
process.exit(fails ? 1 : 0);
