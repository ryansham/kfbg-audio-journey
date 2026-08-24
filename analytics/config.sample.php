<?php
/**
 * ga-proxy.php 的設定範本。
 *
 * 用法：在伺服器上把本檔複製成 config.php 再填入真實值。
 *
 * 🔴 config.php 不進版本控制（.gitignore 已擋），因為本 repo 是 public。
 *    永遠不要把真實路徑或憑證寫回這個範本檔。
 */

return [
    // GA4 資源編號（Admin → Property Settings 可見）
    'property_id' => '549905025',

    // Service account 的 JSON 金鑰路徑。
    //
    // 🔴 必須放在 public_html 以外。若放在 analytics/ 之內，任何人打
    //    https://audio-journey.kfbg.org/analytics/<檔名>.json 就會拿到私鑰，
    //    等於把整個 GA 帳戶交出去。
    //
    // DirectAdmin 上，家目錄通常是 /home/<使用者名稱>/，而網站根目錄是
    // /home/<使用者名稱>/domains/audio-journey.kfbg.org/public_html/。
    // 把金鑰放在家目錄底下一個新資料夾即可，例如：
    'key_file' => '/home/CHANGEME/ga-credentials/audio-journey-sa.json',

    // 統計起始日。GA4 資源 2026-08-14 中午才開始收集，更早的日子沒有數據，
    // 拉進來只會讓趨勢圖前半段是一條平地，並稀釋所有平均數。
    'range_start' => '2026-08-14',

    // 快取存放位置與秒數。
    // 15 分鐘足以讓「有多少同事在看」與「打多少次 GA API」脫鈎 —— 十個人同時
    // 開著頁面，GA 仍然每 15 分鐘只被問一次。
    'cache_dir' => __DIR__ . '/cache',
    'cache_ttl' => 900,
];
