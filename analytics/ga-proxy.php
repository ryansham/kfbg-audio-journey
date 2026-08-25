<?php
/**
 * GA4 → dashboard JSON proxy
 * KFBG Audio Journey · https://audio-journey.kfbg.org/analytics/
 *
 * 為甚麼要有這個檔：GA4 Data API 需要憑證，而憑證不可以放在前端。瀏覽器打這個
 * 檔，PHP 在伺服器端拿著憑證去問 GA4，只把彙總數字回傳。憑證從不離開伺服器。
 *
 * 回傳的 JSON 結構與 data.json 完全一致，所以前端不需要知道數據是靜態還是即時，
 * 只有 "live": true 這個欄位不同（頁面用它來顯示資料是即時抓的）。
 *
 * 🔴 三條不可違反的規則
 *   1. service account key 必須放在 public_html 以外。放在這個資料夾裡，
 *      任何人打 https://…/analytics/<檔名>.json 就會拿到私鑰。
 *   2. config.php 不進版本控制（.gitignore 已擋）。本 repo 是 public。
 *   3. 這個檔只做唯讀查詢，永不寫入 GA。
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Robots-Tag: noindex, nofollow');

// ── 設定 ────────────────────────────────────────────────────────────────────
$configPath = __DIR__ . '/config.php';
$cfg = is_readable($configPath) ? require $configPath : [];

$PROPERTY_ID  = isset($cfg['property_id']) ? $cfg['property_id'] : '';
$KEY_FILE     = isset($cfg['key_file']) ? $cfg['key_file'] : '';
$RANGE_START  = isset($cfg['range_start']) ? $cfg['range_start'] : '2026-08-14';
$CACHE_DIR    = isset($cfg['cache_dir']) ? $cfg['cache_dir'] : __DIR__ . '/cache';
$CACHE_TTL    = isset($cfg['cache_ttl']) ? (int)$cfg['cache_ttl'] : 900;   // 15 分鐘
$TZ           = new DateTimeZone('Asia/Hong_Kong');

// 被測試 include 時只載入函式，不執行主流程。
$RUN = !defined('GA_PROXY_NO_RUN');

// ── 快取 ────────────────────────────────────────────────────────────────────
// GA4 免費版每個資源每日有查詢配額，而一個長開的分頁如果每次載入都直接打 API，
// 幾個同事同時看就會把配額燒光。快取讓「有多少人在看」與「打多少次 API」脫鈎。
$cacheFile = rtrim($CACHE_DIR, '/') . '/dashboard.json';
if (!is_dir($CACHE_DIR)) { @mkdir($CACHE_DIR, 0700, true); }
// 🔴 cache/token.json 裝住一個生效中的 GA access token。萬一 cache 資料夾落在
//    public_html 之內而父層 .htaccess 又漏了規則，那個 token 就是 web 讀得到的。
//    所以由程式自己在建立資料夾時寫一份 deny —— 這道閘跟著程式碼走，不靠人手設定。
$cacheGuard = rtrim($CACHE_DIR, '/') . '/.htaccess';
if (is_dir($CACHE_DIR) && !file_exists($cacheGuard)) {
    @file_put_contents($cacheGuard,
        "# 由 ga-proxy.php 自動建立。此目錄內有 GA access token，不可對外開放。\n" .
        "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n" .
        "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
}

if ($RUN) {
if ($PROPERTY_ID === '' || $KEY_FILE === '') {
    fail('尚未設定 config.php，請參考 config.sample.php。', 'config-missing');
}
$force = isset($_GET['force']) && $_GET['force'] === '1';
if (!$force && is_readable($cacheFile) && (time() - filemtime($cacheFile)) < $CACHE_TTL) {
    header('X-Cache: hit');
    readfile($cacheFile);
    exit;
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
try {
    $token = getAccessToken($KEY_FILE, $CACHE_DIR);
    // 收到「前日」為止，不是昨天。
    // 實測：08-24 查 08-23，互動數字是 0；08-25 再查同一天，變成 18。GA 對最近
    // 一天的互動要一日以上才處理完，期間會回 0。收昨天的話，圖表最後一條柱會
    // 變成「當天所有人一開就走」，看起來像出了大事，其實只是數據未算好。
    $end   = (new DateTime('-2 days', $TZ))->format('Y-m-d');
    $fetch   = function (array $requests) use ($token, $PROPERTY_ID) {
        return gaBatch($token, $PROPERTY_ID, $requests);
    };
    $payload = buildPayload($fetch, $RANGE_START, $end, $TZ);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    @file_put_contents($cacheFile, $json, LOCK_EX);
    header('X-Cache: miss');
    echo $json;
} catch (Throwable $e) {
    // 查不到 GA 時，寧可給一份標明時間的舊數據，也不要給一個空白頁面。
    if (is_readable($cacheFile)) {
        header('X-Cache: stale');
        header('X-Error: ' . str_replace(["\r", "\n"], ' ', $e->getMessage()));
        readfile($cacheFile);
        exit;
    }
    fail($e->getMessage(), 'ga-unavailable');
}
} // end if ($RUN)

// ════════════════════════════════════════════════════════════════════════════

function fail(string $msg, string $code): void {
    // 🔴 一律回 200，即使係錯誤。
    //
    // 呢部 server（DirectAdmin／Apache）會把任何 4xx／5xx 回應嘅內容換走，
    // 塞返佢自己嗰版「Service Unavailable」頁。即係我哋寫嘅診斷訊息會被丟掉，
    // 用家只見到一句同真正原因無關嘅通用錯誤，反而更難查。
    //
    // 所以錯誤靠 body 入面嘅 "error" 欄位表達，唔靠 HTTP 狀態碼。
    // 前端本身就係讀 d.error（index.html 的 fetchFirstAvailable），不受影響。
    http_response_code(200);
    echo json_encode(['error' => $code, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Service account JSON → 簽 JWT → 換 OAuth access token（token 自身也快取）。 */
function getAccessToken(string $keyFile, string $cacheDir): string {
    $tokFile = rtrim($cacheDir, '/') . '/token.json';
    if (is_readable($tokFile)) {
        $t = json_decode((string)file_get_contents($tokFile), true);
        if (is_array($t) && isset($t['exp'], $t['token']) && $t['exp'] > time() + 60) {
            return $t['token'];
        }
    }

    if (!is_readable($keyFile)) {
        throw new RuntimeException('讀不到 service account key（' . basename($keyFile) . '）。');
    }
    $key = json_decode((string)file_get_contents($keyFile), true);
    if (!isset($key['client_email'], $key['private_key'])) {
        throw new RuntimeException('service account key 格式不正確。');
    }

    $now = time();
    $header = b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claim  = b64url(json_encode([
        'iss'   => $key['client_email'],
        'scope' => 'https://www.googleapis.com/auth/analytics.readonly',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'exp'   => $now + 3600,
        'iat'   => $now,
    ]));
    $sig = '';
    if (!openssl_sign("$header.$claim", $sig, $key['private_key'], OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('JWT 簽署失敗，請確認伺服器有 openssl 擴充。');
    }
    $jwt = "$header.$claim." . b64url($sig);

    $res = httpPost('https://oauth2.googleapis.com/token', http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt,
    ]), ['Content-Type: application/x-www-form-urlencoded']);

    $tok = json_decode($res, true);
    if (!isset($tok['access_token'])) {
        throw new RuntimeException('換不到 access token：' . substr($res, 0, 200));
    }
    @file_put_contents($tokFile, json_encode([
        'token' => $tok['access_token'],
        'exp'   => $now + (int)($tok['expires_in'] ?? 3600) - 120,
    ]), LOCK_EX);

    return $tok['access_token'];
}

function b64url(string $s): string {
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function httpPost(string $url, string $body, array $headers): string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $out  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($out === false)  throw new RuntimeException("連線失敗：$err");
    if ($code >= 400)    throw new RuntimeException("HTTP $code：" . substr((string)$out, 0, 200));
    return (string)$out;
}

/** batchRunReports：一次過送多份報表，省來回。GA4 每批上限 5 份。 */
function gaBatch(string $token, string $propertyId, array $requests): array {
    $url = "https://analyticsdata.googleapis.com/v1beta/properties/$propertyId:batchRunReports";
    $res = httpPost($url, json_encode(['requests' => $requests]), [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ]);
    $d = json_decode($res, true);
    if (!isset($d['reports'])) throw new RuntimeException('GA 回應無 reports 欄位。');
    return $d['reports'];
}

function req(array $dims, array $mets, ?array $filter = null, ?array $order = null, int $limit = 200): array {
    $r = [
        'dimensions' => array_map(function ($d) { return ['name' => $d]; }, $dims),
        'metrics'    => array_map(function ($m) { return ['name' => $m]; }, $mets),
        'limit'      => $limit,
    ];
    if ($filter) $r['dimensionFilter'] = $filter;
    if ($order)  $r['orderBys'] = $order;
    return $r;
}

function eventFilter(array $names): array {
    return ['filter' => ['fieldName' => 'eventName', 'inListFilter' => ['values' => $names]]];
}

/** 把一份報表轉成 [dimValue => [metric floats]]；無維度時 key 為 ''。 */
function rows(array $report): array {
    $out = [];
    foreach (($report['rows'] ?? []) as $row) {
        $k = implode('|', array_column($row['dimensionValues'] ?? [], 'value'));
        $out[$k] = array_map('floatval', array_column($row['metricValues'] ?? [], 'value'));
    }
    return $out;
}

function pick(array $r, string $key, int $i = 0, float $default = 0.0): float {
    return isset($r[$key][$i]) ? $r[$key][$i] : $default;
}

function mmss(float $seconds): string {
    $s = (int)round($seconds);
    return sprintf('%d:%02d', intdiv($s, 60), $s % 60);
}

function bi(string $zh, string $en): array { return ['zh' => $zh, 'en' => $en]; }

// ════════════════════════════════════════════════════════════════════════════

/**
 * 由 GA4 報表資料組成 dashboard 的 JSON。
 * $fetch 是注入的取數函式（array $requests): array $reports），令這裡與 HTTP 脫鈎 ——
 * 測試可以餵真 GA 格式的固定資料進來，驗證轉換出來的數字是否正確。
 */
function buildPayload(callable $fetch, string $start, string $end, DateTimeZone $tz): array {
    $dr = [['startDate' => $start, 'endDate' => $end]];
    $withRange = function (array $r) use ($dr) { $r['dateRanges'] = $dr; return $r; };

    $QR = 'btl / qr-code';
    $AUDIO_EVENTS   = ['chapter_play', 'chapter_complete', 'chapter_abandon'];
    $CHAPTER_EVENTS = ['chapter_complete', 'chapter_abandon'];
    $STAGE_EVENTS   = ['journey_start', 'journey_complete', 'audio_download', 'pwa_launch'];

    $batchA = $fetch(array_map($withRange, [
        req([], ['sessions', 'totalUsers', 'engagedSessions', 'userEngagementDuration']),
        req(['date'], ['sessions', 'engagedSessions'], null,
            [['dimension' => ['dimensionName' => 'date']]], 400),
        req(['sessionSourceMedium'], ['sessions', 'totalUsers', 'userEngagementDuration']),
        req(['customEvent:chapter_number', 'eventName'], ['eventCount'], eventFilter($CHAPTER_EVENTS)),
        req(['sessionSourceMedium', 'eventName'], ['totalUsers'], eventFilter($STAGE_EVENTS)),
    ]));

    $batchB = $fetch(array_map($withRange, [
        req(['sessionSourceMedium'], ['totalUsers'], eventFilter($AUDIO_EVENTS)),
        req([], ['averageCustomEvent:listened_pct'], eventFilter(['chapter_abandon'])),
        req(['customEvent:lang'], ['totalUsers'], eventFilter($AUDIO_EVENTS)),
        req(['eventName'], ['totalUsers'], eventFilter($STAGE_EVENTS)),
    ]));

    $tot     = rows($batchA[0]);
    $daily   = rows($batchA[1]);
    $srcRows = rows($batchA[2]);
    $chapRow = rows($batchA[3]);
    $stgSrc  = rows($batchA[4]);
    $audSrc  = rows($batchB[0]);
    $listened= rows($batchB[1]);
    $langRow = rows($batchB[2]);
    $stgAll  = rows($batchB[3]);

    $sessions   = (int)pick($tot, '', 0);
    $users      = (int)pick($tot, '', 1);
    $engaged    = (int)pick($tot, '', 2);
    $engageSecs = pick($tot, '', 3);

    $qrSessions = (int)pick($srcRows, $QR, 0);
    $qrUsers    = (int)pick($srcRows, $QR, 1);
    $qrShare    = 0;  // 下面用 $srcTotal 算，同表格同一個分母，文字先至同表格夾得埋

    // ── 每日 ──
    $wZh = ['日','一','二','三','四','五','六'];
    $wEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    $dailyOut = []; $busiest = null;
    foreach ($daily as $ymd => $m) {
        // PHP 會把「看起來像整數」的陣列鍵自動轉成 int，所以 '20260814' 到這裡
        // 已經是數字，strict_types 之下直接丟 TypeError。一定要轉回字串。
        $dt = DateTime::createFromFormat('Ymd', (string)$ymd, $tz);
        if (!$dt) continue;
        $w = (int)$dt->format('w');
        $tot1 = (int)$m[0]; $eng1 = (int)($m[1] ?? 0);
        $dailyOut[] = [
            'd' => $dt->format('j'), 'w' => bi($wZh[$w], $wEn[$w]),
            'engaged' => $eng1, 'quick' => max($tot1 - $eng1, 0),
        ];
        if ($busiest === null || $tot1 > $busiest['sessions']) {
            $busiest = ['sessions' => $tot1, 'engaged' => $eng1,
                        'label' => bi($dt->format('n') . ' 月 ' . $dt->format('j') . ' 日（星期' . $wZh[$w] . '）',
                                      $dt->format('j F') . ' (' . $wEn[$w] . ')')];
        }
    }

    // ── 章節 ──
    $chapters = [];
    for ($i = 1; $i <= 5; $i++) {
        $c = (int)pick($chapRow, "$i|chapter_complete");
        $a = (int)pick($chapRow, "$i|chapter_abandon");
        if ($c === 0 && $a === 0) continue;
        $chapters[] = ['label' => bi("第 $i 章", "Ch $i"), 'complete' => $c, 'abandon' => $a];
    }

    // ── 漏斗（只計 QR 訪客）──
    $stage = function (string $event) use ($stgSrc, $QR) { return (int)pick($stgSrc, "$QR|$event"); };
    $qrAudio    = (int)pick($audSrc, $QR);
    $qrComplete = $stage('journey_complete');
    $pctOf = function (int $n) use ($qrUsers) {
        return $qrUsers > 0 ? round($n / $qrUsers * 100) . '%' : '—';
    };
    $funnel = [
        ['label' => bi('掃描 QR code 進入', 'Arrived via QR code'), 'v' => $qrUsers,             'pct' => '100%'],
        ['label' => bi('進入導賞路線',     'Opened the route'),     'v' => $stage('journey_start'), 'pct' => $pctOf($stage('journey_start'))],
        ['label' => bi('實際播放音頻',     'Played audio'),         'v' => $qrAudio,             'pct' => $pctOf($qrAudio)],
        ['label' => bi('下載離線收聽',     'Downloaded for offline'),'v' => $stage('audio_download'), 'pct' => $pctOf($stage('audio_download'))],
        ['label' => bi('完成整條路線',     'Completed the route'),  'v' => $qrComplete,          'pct' => $pctOf($qrComplete)],
    ];

    // ── 來源 ──
    $srcName = [
        $QR                 => bi('園區 QR code', 'On-site QR code'),
        '(direct) / (none)' => bi('直接輸入網址', 'Direct URL'),
    ];
    // 分母用「各來源加總」，不是 GA 的總 session 數。
    // GA 逐個來源查會各自 dedup，加起來可以多過總數（實測 110+19+10=139 對 133），
    // 用總數做分母的話表格會出現 83%+14%+8%=105%，同事一加就不信這份報告。
    $srcTotal = 0;
    foreach ($srcRows as $m) { $srcTotal += (int)$m[0]; }
    if ($srcTotal <= 0) $srcTotal = max($sessions, 1);

    $sources = []; $otherSessions = 0; $internal = ['sessions' => 0, 'avg' => '—'];
    foreach ($srcRows as $name => $m) {
        $s = (int)$m[0];
        if (!isset($srcName[$name])) { $otherSessions += $s; continue; }
        $avg = $s > 0 ? mmss($m[2] / $s) : '—';
        $isInternal = ($name !== $QR);
        if ($isInternal) $internal = ['sessions' => $s, 'avg' => $avg];
        $sources[] = [
            'name' => $srcName[$name],
            'tag'  => $isInternal ? bi('內部測試', 'Internal testing') : null,
            'sessions' => $s,
            'pct' => round($s / $srcTotal * 100) . '%',
            'avg' => $avg,
            'hi'  => !$isInternal,
        ];
    }
    if ($otherSessions > 0) {
        $sources[] = ['name' => bi('其他', 'Other'), 'tag' => null, 'sessions' => $otherSessions,
                      'pct' => round($otherSessions / $srcTotal * 100) . '%',
                      'avg' => '—', 'hi' => false];
    }

    // ── 其他觀察 ──
    $listenedPct = round(pick($listened, ''), 1);
    $dl      = $stage('audio_download');
    $pwaAll  = (int)pick($stgAll, 'pwa_launch');
    $zhUsers = (int)pick($langRow, 'zh');
    $enUsers = (int)pick($langRow, 'en');
    $facts = [
        ['v' => bi($listenedPct . '%', $listenedPct . '%'),
         'k' => bi('中途離開時的平均收聽進度', 'Average progress when a chapter is abandoned'),
         'n' => bi('以 chapter_abandon 事件計', 'From chapter_abandon events')],
        ['v' => bi($dl . ' 人', (string)$dl),
         'k' => bi('下載音頻離線收聽', 'Downloaded audio for offline use'),
         'n' => bi($pctOf($dl) . ' QR code 訪客', $pctOf($dl) . ' of QR code visitors')],
        ['v' => bi($pwaAll . ' 人', (string)$pwaAll),
         'k' => bi('從主畫面圖示開啟', 'Opened from a home-screen icon'),
         'n' => bi('已把應用程式加到主畫面', 'Have added the app to their home screen')],
        ['v' => bi("$zhUsers : $enUsers", "$zhUsers : $enUsers"),
         'k' => bi('中文對英文使用者', 'Chinese to English users'),
         'n' => bi('以有播放行為的訪客計', 'Among visitors who played audio')],
    ];

    // ── 日期 ──
    $sDt = new DateTime($start, $tz);
    $eDt = new DateTime($end, $tz);
    $days = (int)$sDt->diff($eDt)->days + 1;
    $zhDate = function (DateTime $d, bool $withYear) {
        return ($withYear ? $d->format('Y') . ' 年 ' : '') . $d->format('n') . ' 月 ' . $d->format('j') . ' 日';
    };

    return [
        'generated' => (new DateTime('now', $tz))->format(DateTime::ATOM),
        'live'      => true,
        'range' => [
            'start' => bi($zhDate($sDt, true),  $sDt->format('j F Y')),
            'end'   => bi($zhDate($eDt, false), $eDt->format('j F Y')),
            'days'  => $days,
            'asOf'  => bi($zhDate($eDt, false), $eDt->format('j F Y')),
        ],
        'summary' => [
            ['k' => bi('訪客人數', 'Visitors'), 'v' => (string)$users,
             'n' => bi('不重複訪客', 'Unique visitors')],
            ['k' => bi('使用次數', 'Sessions'), 'v' => (string)$sessions,
             'n' => bi('平均每天 ' . ($days > 0 ? round($sessions / $days) : 0) . ' 次',
                       'About ' . ($days > 0 ? round($sessions / $days) : 0) . ' a day')],
            ['k' => bi('平均使用時間', 'Average time in app'),
             'v' => $sessions > 0 ? mmss($engageSecs / $sessions) : '—', 'n' => bi('分：秒', 'min : sec')],
            ['k' => bi('聽完整條路線', 'Completed the route'), 'v' => (string)$qrComplete,
             'n' => bi('經 QR code 進入的訪客', 'Among QR code visitors')],
        ],
        'daily'    => $dailyOut,
        'funnel'   => $funnel,
        'chapters' => $chapters,
        'facts'    => $facts,
        'sources'  => $sources,
        // 文案要用的數字。放在這裡而不是寫死在 HTML —— 數據一即時更新，寫死的句子
        // 就會跟圖表打架。
        'derived' => [
            'qrShare'          => round($qrSessions / $srcTotal * 100) . '%',
            'engagedPct'       => $sessions > 0 ? round($engaged / $sessions * 100) . '%' : '—',
            'internalSessions' => $internal['sessions'],
            'internalAvg'      => $internal['avg'],
            'qrAvg'            => $qrSessions > 0 ? mmss(pick($srcRows, $QR, 2) / $qrSessions) : '—',
            // 「是一般訪客的 N 倍」呢句唔可以寫死喺 HTML —— 數據一更新就會變成假話。
            'internalMultiple' => ($qrSessions > 0 && $internal['sessions'] > 0 && pick($srcRows, $QR, 2) > 0)
                ? (int)round((pick($srcRows, '(direct) / (none)', 2) / $internal['sessions'])
                           / (pick($srcRows, $QR, 2) / $qrSessions))
                : null,
            'busiest'          => $busiest,
            'listenedPct'      => $listenedPct . '%',
            'playRatio'        => $qrAudio > 0 ? (int)round($qrUsers / $qrAudio) : null,  // JSON 出 int，唔好出 4.0
        ],
    ];
}
