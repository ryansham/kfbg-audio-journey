/**
 * 將 chapter 嘅 audio_duration_seconds 校正做音頻檔真實時長。
 *
 * 點解：CMS 嘅值同實際檔案脫節（ch05 話 5:56，實際 8:08，差 2 分 12 秒）。App 而家會喺
 * 載入之前顯示呢個值，所以錯值會直接講大話畀山上嘅人聽。
 *
 * 安全設計：唔淨係信本地檔。寫入前 HEAD 一次已部署嘅 URL，確認 content-length 同本地檔
 * 一樣——即係「我寫緊嘅時長，描述緊真係部署咗嗰個檔」。對唔上就跳過唔改。
 *
 *   預覽： npx sanity exec scripts/fix-durations.mjs --with-user-token
 *   落實： npx sanity exec scripts/fix-durations.mjs --with-user-token -- --commit
 *   staging： 加 -- --dataset staging
 */
import sanityCli from 'sanity/cli'
const {getCliClient} = sanityCli
import {readFileSync, statSync} from 'node:fs'

const COMMIT = process.argv.includes('--commit')
const dsArg = process.argv[process.argv.indexOf('--dataset') + 1]
const base = getCliClient()
const client = process.argv.includes('--dataset') ? base.withConfig({dataset: dsArg}) : base
const {projectId, dataset} = client.config()

const HOST = {
  production: 'https://audio-journey.kfbg.org/',
  staging: 'https://ryansham.github.io/kfbg-audio-journey/',
}[dataset]
if (!HOST) { console.error(`唔識 dataset "${dataset}"`); process.exit(1) }

// ffprobe 量度嘅真實時長（兩個獨立方法核過：ffprobe + 瀏覽器 loadedmetadata，數字一致）
const MEASURED = JSON.parse(readFileSync(new URL('./durations.json', import.meta.url), 'utf8'))

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`

console.log(`\nproject ${projectId} · dataset ${dataset} · ${COMMIT ? 'COMMIT' : 'DRY RUN'}\n`)

const doc = await client.fetch('*[_type == "journey" && defined(chapters)][0]')
const ops = {}
let planned = 0, skipped = 0

for (const c of doc.chapters) {
  const m = MEASURED[String(c.chapter_number)]
  if (!m) { console.log(`  ch${c.chapter_number}  ⚠️ 冇量度數據，跳過`); skipped++; continue }

  // 確認部署咗嘅檔就係我量過嗰個
  const rel = String(c.audio_url).replace(/^https?:\/\/[^/]+\//, '')
  const res = await fetch(`${HOST}${rel}`, {method: 'HEAD'})
  const remoteBytes = Number(res.headers.get('content-length'))
  if (!res.ok || remoteBytes !== m.bytes) {
    console.log(`  ch${c.chapter_number}  ❌ 部署嘅檔對唔上本地檔（remote ${remoteBytes} vs local ${m.bytes}）— 唔改`)
    skipped++; continue
  }

  if (c.audio_duration_seconds === m.seconds) {
    console.log(`  ch${c.chapter_number}  ✓ 已經啱（${fmt(m.seconds)}）`)
    continue
  }
  console.log(`  ch${c.chapter_number}  ${c.audio_duration_seconds}s (${fmt(c.audio_duration_seconds)})  →  ${m.seconds}s (${fmt(m.seconds)})   差 ${m.seconds - c.audio_duration_seconds >= 0 ? '+' : ''}${m.seconds - c.audio_duration_seconds}s`)
  ops[`chapters[_key=="${c._key}"].audio_duration_seconds`] = m.seconds
  planned++
}

console.log(`\n計劃改 ${planned} 條，跳過 ${skipped} 條。`)
if (!COMMIT) console.log('DRY RUN —— 冇寫入任何嘢。\n')
else if (!planned) console.log('冇嘢要改。\n')
else { await client.patch(doc._id).set(ops).commit(); console.log(`✅ 已寫入 ${dataset}。\n`) }
