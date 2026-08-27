/**
 * 日期／時區自我檢查（前端）
 *
 *     node test-dates.mjs
 *
 * 為甚麼要有這個檔：時區錯了不會報錯，只會靜靜顯示錯的日子，而且只錯在一部分
 * 讀者身上 —— 寫程式的人自己的機器多數就是香港時區，永遠試不出來。所以這裡把
 * 真正的函式和真正的格式選項由 index.html 抽出來，逐個時區跑一次。
 *
 * 🔴 一律由檔案抽原文，不要在這裡抄一份。抄一份的話，index.html 改壞了這裡照樣
 *    綠 —— 那就是一個甚麼都守不住的閘。
 */
import fs from 'fs';
import { execFileSync } from 'child_process';

const FILE = new URL('./index.html', import.meta.url).pathname;
const SELF = new URL('./test-dates.mjs', import.meta.url).pathname;
const h = fs.readFileSync(FILE, 'utf8');
const grab = (label, re) => {
  const m = h.match(re);
  if (!m) { console.log(`  ❌ 在 index.html 找不到 ${label}，可能改過名`); process.exit(1); }
  return m[0];
};

const TZS = ['Asia/Hong_Kong', 'UTC', 'America/New_York', 'Pacific/Kiritimati', 'Pacific/Midway'];
const GENERATED = '2026-08-26T06:19:13+08:00';   // 香港時間 8 月 26 日上午 6:19

if (!process.env.CHILD) {
  console.log('\n日期／時區檢查（同一組輸入，逐個時區跑一次，答案必須一模一樣）\n');
  let bad = 0;
  for (const tz of TZS) {
    try {
      process.stdout.write(execFileSync(process.execPath, [SELF],
        { env: { ...process.env, TZ: tz, CHILD: '1' } }));
    } catch (e) { process.stdout.write(e.stdout || ''); bad++; }
  }
  console.log(bad ? `❌ 有 ${bad} 個時區失敗\n` : '✅ 全部時區通過\n');
  process.exit(bad ? 1 : 0);
}

const tz = process.env.TZ;
let pass = 0, fail = 0;
const check = (what, got, want) => {
  const ok = got === want; ok ? pass++ : fail++;
  console.log(`  ${ok ? '✅' : '❌'} ${what.padEnd(34)} ${got}${ok ? '' : '   ← 應為 ' + want}`);
};
console.log(`裝置時區 ${tz}`);

// ── 1. 預設按鈕算出來的日子，不可以隨讀者的裝置時區改變 ──
const helpers = grab('isoOf', /const isoOf = [^\n]*\n/)
              + grab('isoShift', /function isoShift\([\s\S]*?\n}/) + '\n'
              + grab('presetRange', /function presetRange\([\s\S]*?\n}/) + '\n';
const { presetRange } = new Function('RANGE', helpers + 'return { presetRange };')(
  { min: '2026-08-14', max: '2026-08-24' });
check('最近 7 天',   presetRange(7).join('~'),  '2026-08-18~2026-08-24');
check('最近 30 天',  presetRange(30).join('~'), '2026-08-14~2026-08-24');
check('全部',        presetRange(0).join('~'),  '2026-08-14~2026-08-24');

// ── 2. 「數據讀取時間」一律用香港時間，不跟讀者的裝置走 ──
// 抽出 index.html 實際用緊的那組選項。刪走 timeZone 這裡就會紅。
const genLine = grab("s-gen 的 toLocaleString", /\$\('s-gen'\)\.textContent = new Date[\s\S]*?\);/);
const opts = new Function('return ' + genLine.match(/\{[^{}]*\}/)[0])();
check('數據讀取時間', new Date(GENERATED).toLocaleString('zh-HK', opts), '2026年8月26日 上午6:19');

// ── 3. 圖表日期由 iso 直接讀，全程不做時區換算 ──
const dt = new Date('2026-08-24T00:00:00');
check('圖表日期（8/24 星期一）', `${dt.getMonth() + 1}-${dt.getDate()}-${dt.getDay()}`, '8-24-1');

// ── 4. toISOString() 不可以出現在日子運算裡（它換算成 UTC，香港會退一日）──
const noComments = h.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
check('沒有用 toISOString() 算日子', /toISOString\s*\(/.test(noComments) ? '有' : '沒有', '沒有');

if (fail) { console.log(`  ❌ ${tz} 失敗 ${fail} 項\n`); process.exit(1); }
console.log(`  ✅ 通過 ${pass} 項\n`);
