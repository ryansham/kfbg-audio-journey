/**
 * 將 journey chapter 嘅 audio_url 由絕對 URL 改成相對路徑。
 *
 * 點解：絕對 URL 會令 production dataset 指住 staging host（ryansham.github.io）。
 * 相對路徑跟住邊個 host 開個 app 就用邊個，所以 staging→production promotion
 * 永遠唔會再將 staging 嘅 host 帶入 production。
 *
 *   預覽： npx sanity exec scripts/fix-audio-urls.mjs --with-user-token
 *   落實： npx sanity exec scripts/fix-audio-urls.mjs --with-user-token -- --commit
 *
 * 預設 dry-run。冇 --commit 就唔會寫入任何嘢。
 */
// sanity/cli 係 CJS，ESM 攞唔到 named export，所以用 default import 再拆
import sanityCli from 'sanity/cli'
const {getCliClient} = sanityCli

const COMMIT = process.argv.includes('--commit')
const dsArg = process.argv[process.argv.indexOf('--dataset') + 1]
const base = getCliClient()
const client = process.argv.includes('--dataset') ? base.withConfig({dataset: dsArg}) : base
const {projectId, dataset} = client.config()

// 每個 dataset 嘅 app 各自跑喺邊個 host —— 相對路徑要喺嗰個 host 度驗，唔係一律驗 prod
const HOST = {
  production: 'https://audio-journey.kfbg.org/',
  staging: 'https://ryansham.github.io/kfbg-audio-journey/',
}[dataset]
if (!HOST) {
  console.error(`唔識 dataset "${dataset}" 對應邊個 host，唔敢改。`)
  process.exit(1)
}

// 由 audio_url 抽出 /audio/... 之後嗰段，唔理原本邊個 host
const toRelative = (url) => {
  const m = String(url || '').match(/(?:^|\/)(audio\/.+\.mp3)$/)
  return m ? m[1] : null
}

console.log(`\nproject ${projectId} · dataset ${dataset} · host ${HOST} · ${COMMIT ? 'COMMIT' : 'DRY RUN'}\n`)

const journeys = await client.fetch('*[_type == "journey" && defined(chapters)]')
let planned = 0
let skipped = 0
const patches = []

for (const doc of journeys) {
  console.log(`${doc._id}`)
  const ops = {}
  for (const c of doc.chapters) {
    const next = toRelative(c.audio_url)
    if (!next) {
      console.log(`  ch${c.chapter_number}  ⚠️  認唔到格式，跳過：${c.audio_url}`)
      skipped++
      continue
    }
    if (next === c.audio_url) {
      console.log(`  ch${c.chapter_number}  ✓ 已經係相對路徑，唔使改`)
      continue
    }
    // 落實之前確認個檔喺呢個 dataset 對應嘅 host 真係攞得到 —— 唔好將 CMS 指去 404
    const probe = `${HOST}${next}`
    const res = await fetch(probe, {method: 'HEAD'})
    if (!res.ok) {
      console.log(`  ch${c.chapter_number}  ❌ ${probe} 回 ${res.status} —— 唔改呢條`)
      skipped++
      continue
    }
    console.log(`  ch${c.chapter_number}`)
    console.log(`      from: ${c.audio_url}`)
    console.log(`      to:   ${next}   (HEAD ${res.status}, ${res.headers.get('content-length')} bytes)`)
    ops[`chapters[_key=="${c._key}"].audio_url`] = next
    planned++
  }
  if (Object.keys(ops).length) patches.push({id: doc._id, ops})
}

console.log(`\n計劃改 ${planned} 條，跳過 ${skipped} 條。`)

if (!COMMIT) {
  console.log('DRY RUN —— 冇寫入任何嘢。確認之後加 -- --commit 再跑。\n')
} else if (!planned) {
  console.log('冇嘢要改。\n')
} else {
  const tx = patches.reduce((t, p) => t.patch(p.id, (patch) => patch.set(p.ops)), client.transaction())
  await tx.commit()
  console.log(`✅ 已寫入 ${dataset}。\n`)
}
