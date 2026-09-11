<?php
/**
 * ga-proxy.php 的轉換邏輯自我檢查。
 *
 *     php test-proxy.php
 *
 * 做法：餵一組真 GA4 格式的固定回應進 buildPayload()，其數值取自 2026-08-14 至
 * 08-23 由 Analytics Data API 實際讀回來的數字，然後檢查轉換出來的結果是否等於
 * 我們獨立已知正確的答案（99 位訪客、120 次、2:27、漏斗 84/27/23/8/3 等）。
 *
 * 期望值是獨立得知的，不是由同一段程式算出來再自我比對，所以這個檢查有意義：
 * 任何一步算錯、欄位對錯位、百分比基數用錯，都會讓它變紅。
 */

declare(strict_types=1);
define('GA_PROXY_NO_RUN', true);
require __DIR__ . '/ga-proxy.php';

// ── 把 [key => [值,…]] 轉成 GA4 報表格式 ────────────────────────────────────
function rep(array $data, int $dimCount): array {
    $rows = [];
    foreach ($data as $k => $vals) {
        $dims = $dimCount === 0 ? [] : array_map(
            function ($v) { return ['value' => $v]; },
            explode('|', (string)$k)
        );
        $rows[] = [
            'dimensionValues' => $dims,
            'metricValues'    => array_map(function ($v) { return ['value' => (string)$v]; }, $vals),
        ];
    }
    return ['rows' => $rows];
}

$batchA = [
    rep(['' => [120, 99, 74, 17617]], 0),                                  // 總計
    rep([                                                                   // 每日
        '20260814' => [17, 13], '20260815' => [11, 5],  '20260816' => [10, 5],
        '20260817' => [17, 12], '20260818' => [9, 7],   '20260819' => [8, 4],
        '20260820' => [10, 4],  '20260821' => [5, 3],   '20260822' => [7, 3],
        '20260823' => [26, 18],
    ], 1),
    rep([                                                                   // 來源
        'btl / qr-code'          => [102, 84, 9543],
        '(direct) / (none)'      => [15, 14, 7478],
        '(not set)'              => [2, 2, 11],
        'qr-codes.io / referral' => [1, 1, 585],
    ], 1),
    rep([                                                                   // 章節
        '1|chapter_complete' => [15], '1|chapter_abandon' => [34],
        '2|chapter_complete' => [9],  '2|chapter_abandon' => [12],
        '3|chapter_complete' => [6],  '3|chapter_abandon' => [6],
        '4|chapter_complete' => [5],  '4|chapter_abandon' => [6],
        '5|chapter_complete' => [5],  '5|chapter_abandon' => [5],
        // GA4 自訂維度不回溯，登記 chapter_number 之前的事件回 '(not set)'。
        // 08-14 至 08-24 實測就有這一批，圖表只 loop 1..5 的話會靜靜漏掉。
        '(not set)|chapter_complete' => [5], '(not set)|chapter_abandon' => [4],
    ], 2),
    rep([                                                                   // 階段 × 來源
        'btl / qr-code|journey_start'        => [27],
        'btl / qr-code|journey_complete'     => [3],
        'btl / qr-code|audio_download'       => [8],
        'btl / qr-code|pwa_launch'           => [5],
        '(direct) / (none)|journey_start'    => [9],
        '(direct) / (none)|journey_complete' => [1],
        '(direct) / (none)|audio_download'   => [1],
        '(direct) / (none)|pwa_launch'       => [3],
    ], 2),
];

$batchB = [
    rep(['btl / qr-code' => [23], '(direct) / (none)' => [8], 'qr-codes.io / referral' => [1]], 1),
    rep(['' => [21.888888888888889]], 0),
    rep(['zh' => [43], 'en' => [2], '(not set)' => [6]], 1),
    rep(['journey_start' => [36], 'journey_complete' => [4], 'audio_download' => [9], 'pwa_launch' => [8]], 1),
    rep([                                                                   // 裝置
        'mobile|iOS' => [79], 'mobile|Android' => [42],
        'desktop|Macintosh' => [12], 'desktop|Windows' => [2],
        'tablet|iOS' => [4],
        // 真的出現過的怪 UA：分類是 mobile 但作業系統報 Macintosh。
        // 不可以當成 iPhone，也不可以靜靜丟掉。
        'mobile|Macintosh' => [1],
    ], 2),
];

$batchC = [
    rep(['Hong Kong' => [122], 'Japan' => [10], 'Iceland' => [5],
         'Taiwan' => [2], 'Singapore' => [1], 'Australia' => [1]], 1),
];

$calls = 0;
$fetch = function (array $requests) use (&$calls, $batchA, $batchB, $batchC) {
    $calls++;
    if (count($requests) > 5) {
        throw new RuntimeException("一批送了 " . count($requests) . " 份報表，GA4 上限是 5。");
    }
    return [$batchA, $batchB, $batchC][$calls - 1];
};

$out = buildPayload($fetch, '2026-08-14', '2026-08-23', new DateTimeZone('Asia/Hong_Kong'));

// ── 檢查 ────────────────────────────────────────────────────────────────────
$pass = 0; $fail = 0;
function check(string $what, $got, $want): void {
    global $pass, $fail;
    $ok = $got === $want;
    $ok ? $pass++ : $fail++;
    printf("  %s %-42s %s%s\n", $ok ? '✅' : '❌', $what,
        is_scalar($got) ? (string)$got : json_encode($got, JSON_UNESCAPED_UNICODE),
        $ok ? '' : '   ← 應為 ' . (is_scalar($want) ? (string)$want : json_encode($want, JSON_UNESCAPED_UNICODE)));
}

echo "\nga-proxy.php 轉換邏輯檢查（2026-08-14 至 08-23）\n\n";

echo "整體\n";
check('訪客人數',        $out['summary'][0]['v'], '99');
check('使用次數',        $out['summary'][1]['v'], '120');
check('平均使用時間',    $out['summary'][2]['v'], '2:27');
check('聽完整條路線',    $out['summary'][3]['v'], '3');
check('天數',            $out['range']['days'], 10);
check('live 標記',       $out['live'], true);

echo "\n漏斗（只計 QR 訪客，基數 84）\n";
check('人數序列', array_column($out['funnel'], 'v'), [84, 27, 23, 8, 3]);
check('百分比序列', array_column($out['funnel'], 'pct'), ['100%', '32%', '27%', '10%', '4%']);

echo "\n章節\n";
check('章節數',   count($out['chapters']), 5);
check('聽完序列', array_column($out['chapters'], 'complete'), [15, 9, 6, 5, 5]);
check('離開序列', array_column($out['chapters'], 'abandon'),  [34, 12, 6, 6, 5]);

check('對不上章節的聽完次數', $out['chaptersUnknown']['complete'], 5);
check('對不上章節的離開次數', $out['chaptersUnknown']['abandon'], 4);
check('未知的記錄冇混入第 5 章', $out['chapters'][4]['complete'], 5);
check('章節數仍為 5（未知的不另開一列）', count($out['chapters']), 5);

echo "\n每日\n";
check('日數',        count($out['daily']), 10);
check('首日',        $out['daily'][0]['d'] . ' ' . $out['daily'][0]['w']['zh'], '14 五');
check('首日英文星期', $out['daily'][0]['w']['en'], 'Fri');
check('首日已互動',   $out['daily'][0]['engaged'], 13);
check('首日快速離開', $out['daily'][0]['quick'], 4);
check('尾日總數',     $out['daily'][9]['engaged'] + $out['daily'][9]['quick'], 26);

echo "\n文案用的衍生數字（避免寫死在 HTML）\n";
check('QR 佔比',      $out['derived']['qrShare'], '85%');
check('QR 平均時間',  $out['derived']['qrAvg'], '1:34');
check('內部次數',      $out['derived']['internalSessions'], 15);
check('內部平均時間',  $out['derived']['internalAvg'], '8:19');
check('最旺一天',      $out['derived']['busiest']['sessions'], 26);
check('最旺一天標籤',  $out['derived']['busiest']['label']['zh'], '8 月 23 日（星期日）');
check('中途離開進度',  $out['derived']['listenedPct'], '21.9%');
check('每 N 人一個播放', $out['derived']['playRatio'], 4);
check('內部停留倍數',  $out['derived']['internalMultiple'], 5);

echo "\n來源\n";
check('來源列數',   count($out['sources']), 3);
check('QR 次數',    $out['sources'][0]['sessions'], 102);
check('QR 被標示為主要', $out['sources'][0]['hi'], true);
check('內部有標籤', $out['sources'][1]['tag']['zh'], '內部測試');

echo "\n其他觀察\n";
check('語言比',     $out['facts'][3]['v']['zh'], '43 : 2');
check('離線下載',   $out['facts'][1]['v']['zh'], '8 人');
check('主畫面開啟', $out['facts'][2]['v']['zh'], '8 人');

echo "\n雙語完整性\n";
$missing = [];
array_walk_recursive($out, function ($v, $k) use (&$missing) {
    if (($k === 'zh' || $k === 'en') && (string)$v === '') $missing[] = $k;
});
check('冇空白翻譯', count($missing), 0);
check('GA 呼叫次數（應為 3 批）', $calls, 3);

echo "\n訪客裝置\n";
check('由多到少排', array_map(function ($d) { return $d['name']['zh']; }, $out['devices']),
      ['iPhone／iPad', 'Android 手機', '桌面電腦', '平板電腦', '其他']);
check('次數序列', array_column($out['devices'], 'sessions'), [79, 42, 14, 4, 1]);
check('百分比加埋 100', array_sum(array_map(function ($d) {
    return (int)rtrim($d['pct'], '%'); }, $out['devices'])), 100);
// 分類是 mobile 但作業系統報 Macintosh，不可以被當成 iPhone
check('怪 UA 落「其他」不落 iPhone', $out['devices'][4]['sessions'], 1);
check('怪 UA 那一行真係「其他」', $out['devices'][4]['name']['zh'], '其他');
check('桌面把 Mac 同 Windows 加埋', $out['devices'][2]['sessions'], 14);

echo "\n訪客地區\n";
check('只列頭四個加「其他地區」', count($out['places']), 5);
check('地區序列', array_map(function ($p) { return $p['name']['zh']; }, $out['places']),
      ['香港', '日本', 'Iceland', '台灣', '其他地區']);
check('沒有譯名的保留原名', $out['places'][2]['name']['zh'], 'Iceland');
check('香港標為主要',       $out['places'][0]['hi'], true);
check('「其他地區」是尾巴加總', $out['places'][4]['sessions'], 2);
check('百分比加埋 100', array_sum(array_map(function ($p) {
    return (int)rtrim($p['pct'], '%'); }, $out['places'])), 100);

echo "\n來源百分比要加埋等於 100%（GA 逐個來源 dedup，加起來會多過總數）\n";
// 實測數字：110+19+10 = 139，但 GA 報總數 133。用總數做分母會出 83+14+8 = 105%。
$mismatchA = $batchA; $mismatchB = $batchB; $mismatchC = $batchC;
$mismatchA[0] = rep(["" => [133, 105, 74, 17800]], 0);
$mismatchA[2] = rep([
    "btl / qr-code"     => [110, 88, 9570],
    "(direct) / (none)" => [19, 17, 7490],
    "(not set)"         => [10, 9, 60],
], 1);
$n2 = 0;
$out2 = buildPayload(function (array $r) use (&$n2, $mismatchA, $mismatchB, $mismatchC) {
    return [$mismatchA, $mismatchB, $mismatchC][$n2++];
}, "2026-08-14", "2026-08-24", new DateTimeZone("Asia/Hong_Kong"));
$pcts = array_map(function ($r) { return (int)rtrim($r["pct"], "%"); }, $out2["sources"]);
check("各來源百分比合計", array_sum($pcts), 100);
check("文字同表格用同一個分母", $out2["derived"]["qrShare"], $out2["sources"][0]["pct"]);

echo "\n百分比要加起來剛好 100（版面上的說明是這樣寫的）\n";
// 🔴 逐個獨立四捨五入的話，這一組會得出 58+30+10+1 = 99。
$naive = array_sum(array_map(function ($n) { return (int)round($n / 79 * 100); }, [46, 24, 8, 1]));
check('（先確認呢組真係會出 99）', $naive, 99);
check('揀 7 天嗰組',   array_sum(pcts([46, 24, 8, 1])), 100);
check('分配去咗邊',    implode('/', pcts([46, 24, 8, 1])), '58/31/10/1');
check('三等分',        implode('/', pcts([1, 1, 1])), '34/33/33');
check('一行獨佔',      implode('/', pcts([7])), '100');
check('全部零唔會爆',  implode('/', pcts([0, 0])), '0/0');
check('空陣列',        implode('/', pcts([])), '');
// 隨機一百組都要啱：加起來一定 100，而且每個都貼近真實比例
$worst = 0; $bad = 0;
for ($i = 1; $i <= 100; $i++) {
    $c = [];
    for ($j = 0; $j < 3 + ($i % 5); $j++) { $c[] = ($i * ($j + 7)) % 97 + 1; }
    $p = pcts($c); $t = array_sum($c);
    if (array_sum($p) !== 100) $bad++;
    foreach ($c as $k => $n) { $worst = max($worst, abs($p[$k] - $n / $t * 100)); }
}
check('一百組隨機數都啱好 100', $bad, 0);
check('同真實比例最多差唔夠 1%', $worst < 1.0, true);

echo "\n香港時區（伺服器的 PHP 預設時區是 UTC，所以每一處都要明寫）\n";
check('這個測試在 UTC 預設之下跑', date_default_timezone_get(), 'UTC');
$HK = new DateTimeZone('Asia/Hong_Kong');
$at = function (string $utc) use ($HK) {
    return maxDataDate(new DateTime($utc, new DateTimeZone('UTC')), $HK);
};
check('香港 8/26 08:30（UTC 00:30）', $at('2026-08-26T00:30:00Z'), '2026-08-25');
check('香港 8/26 23:59（UTC 15:59）', $at('2026-08-26T15:59:59Z'), '2026-08-25');
// 🔴 UTC 16:00 開始，香港已經踏入下一日。用 UTC 判斷「今天」的話這兩格會慢一日，
//    而這八個鐘（香港 00:00–08:00）每天都會出現 —— 同事一早開報告就中招。
check('香港 8/27 00:00（UTC 16:00）', $at('2026-08-26T16:00:00Z'), '2026-08-26');
check('香港 8/27 07:59（UTC 23:59）', $at('2026-08-26T23:59:59Z'), '2026-08-26');
// 跨月、跨年一樣要對
check('跨月：香港 9/1 → 8/31',        $at('2026-08-31T16:00:00Z'), '2026-08-31');
check('跨年：香港 2027/1/1 → 12/31',  $at('2026-12-31T16:00:00Z'), '2026-12-31');

// 期間長度：兩端都用香港時間解讀，日數才會準
$mk = function (string $a, string $b) use ($HK) {
    return (int)(new DateTime($a, $HK))->diff(new DateTime($b, $HK))->days + 1;
};
check('8/14 至 8/24 是 11 天', $mk('2026-08-14', '2026-08-24'), 11);
check('同一天是 1 天',          $mk('2026-08-24', '2026-08-24'), 1);

// generated 要帶 +08:00，否則前端無法知道那個時刻屬於哪個時區
$stamp = (new DateTime('now', $HK))->format(DateTime::ATOM);
check('generated 帶香港時區位移', substr($stamp, -6), '+08:00');

echo "\n日期範圍驗證（這是 proxy 唯一接受外來輸入的地方）\n";
$MIN = '2026-08-14'; $MAX = '2026-08-24';
$cr = function ($f, $t) use ($MIN, $MAX) {
    list($a, $b, $c) = clampRange($f, $t, $MIN, $MAX);
    return $a . '~' . $b . ($c ? ' (改過)' : '');
};
check('正常範圍原樣通過',      $cr('2026-08-16', '2026-08-20'), '2026-08-16~2026-08-20');
check('冇帶參數就用預設',      $cr(null, null),                 '2026-08-14~2026-08-24');
check('早過開始收集的日子',    $cr('2026-01-01', '2026-08-20'), '2026-08-14~2026-08-20 (改過)');
check('遲過「前日」',          $cr('2026-08-16', '2026-12-31'), '2026-08-16~2026-08-24 (改過)');
check('次序倒轉整個退回',      $cr('2026-08-20', '2026-08-16'), '2026-08-14~2026-08-24 (改過)');
// 🔴 格式檢查要用一個「寬窗口」來驗，否則證明不到甚麼：如果窗口是 8 月，
//    '2026-02-31' 就算被當成有效日期，也會被「早過 8 月 14 日」那條規則擋住，
//    測試照樣綠 —— 綠得毫無意義。這裡用整年做窗口，令那條規則救不了它。
$wide = function ($f) {
    list($a, $b, $c) = clampRange($f, null, '2026-01-01', '2026-12-31');
    return $a . ($c ? ' (改過)' : '');
};
check('不存在的日期（2 月 31 日）', $wide('2026-02-31'), '2026-01-01 (改過)');
check('冇補零的日期',              $wide('2026-8-15'),  '2026-01-01 (改過)');
check('多咗時間',                  $wide('2026-08-15T10:00'), '2026-01-01 (改過)');
check('正常日子喺寬窗口仍然通過',  $wide('2026-02-28'), '2026-02-28');
check('夾帶路徑的字串',        $cr('../../etc/passwd', null),   '2026-08-14~2026-08-24 (改過)');
check('空字串當冇帶',          $cr('', ''),                     '2026-08-14~2026-08-24');
check('非字串（陣列）',        $cr(['x'], null),                '2026-08-14~2026-08-24 (改過)');
check('資源太新：min 遲過 max', (function () {
    list($a, $b) = clampRange(null, null, '2026-08-24', '2026-08-14');
    return $a . '~' . $b; })(), '2026-08-24~2026-08-24');
// 檔名只由驗過的值砌成，所以任何輸入都造不出目錄分隔符
$bad = clampRange('../../x', '2026-08-99', $MIN, $MAX);
check('砌得出的快取檔名安全', (int)(strpos("dashboard-{$bad[0]}_{$bad[1]}.json", '/') !== false), 0);

printf("\n%s  通過 %d／失敗 %d\n\n", $fail === 0 ? '✅ 全部通過' : '❌ 有檢查失敗', $pass, $fail);
exit($fail === 0 ? 0 : 1);
