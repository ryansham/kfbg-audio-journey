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
];

$calls = 0;
$fetch = function (array $requests) use (&$calls, $batchA, $batchB) {
    $calls++;
    if (count($requests) > 5) {
        throw new RuntimeException("一批送了 " . count($requests) . " 份報表，GA4 上限是 5。");
    }
    return $calls === 1 ? $batchA : $batchB;
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
check('GA 呼叫次數（應為 2 批）', $calls, 2);

printf("\n%s  通過 %d／失敗 %d\n\n", $fail === 0 ? '✅ 全部通過' : '❌ 有檢查失敗', $pass, $fail);
exit($fail === 0 ? 0 : 1);
