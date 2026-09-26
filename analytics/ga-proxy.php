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
// 🔴 快取檔名一定要帶著範圍。以前只有一個固定範圍，一個 dashboard.json 就夠；
//    現在使用者揀得到範圍，還用同一個檔名的話，先到的人存起「最近 7 天」，
//    後到的人開預設就會收到那 7 天的數字，但標題寫著自己揀的日期 —— 錯得無聲無息。
//    實際檔名在下面 clampRange() 驗過之後才砌。
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
$MAX_DATE = maxDataDate(new DateTime('now'), $TZ);
list($FROM, $TO, $CLAMPED) = clampRange(
    isset($_GET['from']) ? $_GET['from'] : null,
    isset($_GET['to'])   ? $_GET['to']   : null,
    $RANGE_START, $MAX_DATE);
// 檔名只由驗過的值砌成，所以不可能夾帶路徑。
$cacheFile = rtrim($CACHE_DIR, '/') . "/dashboard-{$FROM}_{$TO}.json";

$force = isset($_GET['force']) && $_GET['force'] === '1';
if (!$force && is_readable($cacheFile) && (time() - filemtime($cacheFile)) < $CACHE_TTL) {
    header('X-Cache: hit');
    readfile($cacheFile);
    exit;
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
try {
    $token = getAccessToken($KEY_FILE, $CACHE_DIR);
    $fetch = function (array $requests) use ($token, $PROPERTY_ID) {
        return gaBatch($token, $PROPERTY_ID, $requests);
    };
    $payload = buildPayload($fetch, $FROM, $TO, $TZ, $RANGE_START, $MAX_DATE, $CLAMPED);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    @file_put_contents($cacheFile, $json, LOCK_EX);
    // 快取以範圍做鍵，檔案數量由「同事揀過多少個不同範圍」決定。清走七日沒碰過
    // 的，令這個目錄有上限。只夾自己造的檔名，碰不到 token.json 或 .htaccess。
    foreach (glob(rtrim($CACHE_DIR, '/') . '/dashboard-*.json') ?: [] as $stale) {
        if (time() - filemtime($stale) > 7 * 86400) @unlink($stale);
    }
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

/**
 * 把外來的 from／to 收窄到安全範圍，回傳 [from, to, 有沒有被改動]。
 *
 * 這是這個檔第一次接受外來輸入，所以規矩全部寫死在伺服器，不倚賴前端：
 *   · 必須是 YYYY-MM-DD，而且真的存在那一天。DateTime::createFromFormat()
 *     會把 '2026-02-31' 靜靜接受成 3 月 3 日，所以要回頭比對字串才算數。
 *   · 不可以早過分析系統開始收集的那天 —— 更早的日子只會畫出一段假的空白。
 *   · 不可以晚過「前日」 —— GA 對最近一天的互動數字未算好，會回 0。
 *   · from 必須不遲於 to，否則整個退回預設範圍。
 *
 * 不合規就退回預設而不是報錯：這是一份給同事看的報告，網址被改壞了應該照樣
 * 看到數。回傳的 payload 會帶著實際採用的範圍，頁面上的日期永遠是真的。
 */
/**
 * 可以拿到數據的最後一天：香港時間的今天，再退一日（今天未完，不計）。
 *
 * 2026-09-11 起由「退兩日」改為「退一日」（Ryan 決定）。已知代價：GA 計互動數字
 * 有時要一日以上，最近一天的 engaged 可能暫時是 0，圖表最後一條柱會看起來像
 * 「當天所有人一開就走」，等 GA 算好會自動補上。實測：09-11 下午 3 時半查 09-10，
 * sessions 30、engaged 0。頁面的 rHint 已經向同事說明。
 *
 * 🔴 「今天」一定要用香港時間判斷。伺服器的 PHP 預設時區是 UTC，直接用預設的
 *    話，每日香港時間 00:00 到 08:00 這八個鐘算出來都會慢一日 —— 同事一早開報告
 *    會見到期間比昨天還要短。$now 由外面傳入，令這條界線測得到。
 */
function maxDataDate(DateTimeInterface $now, DateTimeZone $tz): string {
    // '@時間戳' 一律當 UTC，不受伺服器預設時區影響；再換算到香港才數日子。
    $d = new DateTime('@' . $now->getTimestamp());
    $d->setTimezone($tz);
    $d->modify('-1 day');
    return $d->format('Y-m-d');
}

function clampRange($from, $to, string $min, string $max): array {
    if ($min > $max) $max = $min;          // 全新資源：還未夠一日數據
    $valid = function ($v) {
        if (!is_string($v) || $v === '') return null;
        // 這裡用 UTC 沒關係：'!' 把時間歸零，而我們只是把它 format 回去跟原字串
        // 比對，全程不做時區換算。用哪個時區結果都一樣。
        $d = DateTime::createFromFormat('!Y-m-d', $v, new DateTimeZone('UTC'));
        return ($d && $d->format('Y-m-d') === $v) ? $v : null;
    };
    $f = $valid($from); $t = $valid($to);
    $changed = ($from !== null && $from !== '' && $f === null)
            || ($to   !== null && $to   !== '' && $t === null);
    if ($f === null) $f = $min;
    if ($t === null) $t = $max;
    if ($f < $min) { $f = $min; $changed = true; }
    if ($t > $max) { $t = $max; $changed = true; }
    if ($f > $t)   { $f = $min; $t = $max; $changed = true; }
    return [$f, $t, $changed];
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

/**
 * 把一組數字轉成加起來剛好 100 的整數百分比。
 *
 * 逐個獨立四捨五入的話，加起來會變成 99 或 101 —— 同事一加就會質疑整份報告，
 * 而版面上的說明還寫著「加起來是 100%」，那句就變成假話。
 * 用最大餘額法：先取整數部分，剩下的名額按小數部分由大到小分配。
 */
function pcts(array $counts): array {
    $total = array_sum($counts);
    $n = count($counts);
    if ($total <= 0) return array_fill(0, $n, 0);
    $out = []; $frac = []; $used = 0;
    foreach ($counts as $i => $c) {
        $exact = $c / $total * 100;
        $out[$i] = (int)floor($exact);
        $frac[$i] = $exact - floor($exact);
        $used += $out[$i];
    }
    arsort($frac);                       // PHP 8 的排序穩定，數值相同就保持原次序
    $rest = 100 - $used;
    foreach (array_keys($frac) as $i) {
        if ($rest <= 0) break;
        $out[$i]++; $rest--;
    }
    ksort($out);
    return $out;
}

/** 把 pcts() 的結果寫回每一行的 'pct'。 */
function withPcts(array $rows): array {
    $p = pcts(array_column($rows, 'sessions'));
    foreach ($rows as $i => $_) { $rows[$i]['pct'] = $p[$i] . '%'; }
    return $rows;
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
function buildPayload(callable $fetch, string $start, string $end, DateTimeZone $tz,
                      ?string $min = null, ?string $max = null, bool $clamped = false): array {
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
        req(['deviceCategory', 'operatingSystem'], ['sessions']),
    ]));
    // 每批上限 5 份報表，所以國家要另開一批。
    // 🔴 exit / listened_sec / audio_error 由 2026-09-24 才開始送。時間窗跨過那一天的話，
    //    這幾個數字只覆蓋後半段；不可以當成整段期間的數字讀，下面用 $newFieldsFull 守住。
    $batchC = $fetch(array_map($withRange, [
        req(['country'], ['sessions'], null,
            [['metric' => ['metricName' => 'sessions'], 'desc' => true]], 50),
        // exit 把「熄了屏幕但仍在聽」同「真的離開」分開。沒有 exit 值的是改動之前的記錄。
        req(['customEvent:chapter_number', 'customEvent:exit'],
            ['eventCount', 'averageCustomEvent:listened_pct'], eventFilter(['chapter_abandon'])),
        // 實際聽到的音訊秒數。帶 exit 是為了把 hidden_playing 那批剔出去 —— 它們多數之後
        // 還會再發一次 chapter_complete，兩邊都算就會重複計同一段收聽。
        req(['customEvent:chapter_number', 'eventName', 'customEvent:exit'],
            ['customEvent:listened_sec', 'eventCount'], eventFilter($CHAPTER_EVENTS)),
        req(['customEvent:is_offline'], ['eventCount'], eventFilter(['audio_error']), null, 20),
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
    $devRows = rows($batchB[4]);
    $ctyRows = rows($batchC[0]);
    // ?? [] ：GA 正常會回齊每份報表，但局部回應只應該令個別數字變空白，唔應該 500 成版。
    $exitRow = rows(isset($batchC[1]) ? $batchC[1] : []);
    $secRow  = rows(isset($batchC[2]) ? $batchC[2] : []);
    $errRow  = rows(isset($batchC[3]) ? $batchC[3] : []);

    // ── 09-24 起才有的欄位 ──
    $FIELDS_SINCE  = '2026-09-24';
    $newFieldsFull = $start >= $FIELDS_SINCE;
    $sinceNote = bi('9 月 24 日起計', 'From 24 Sep');

    // ── 新介面上線日（章節全屏頁，app v52）──
    // 由呢日起 QR 深連結唔再自動播，訪客撳播放先射 chapter_play。以前一掃 QR 就記一次播放，
    // 瀏覽器擋咗自動播都照記，所以呢日之後第一章播放數會跌，唔代表少咗人聽。
    // 🔴 上線當日改做真實上載日期。
    $UI_SINCE = '2026-09-27';

    // exit 逐章拆開。POCKET 一定要同「真的離開」分家：它代表訪客把手機放進口袋繼續聽，
    // 舊版把它記成放棄，第一章因此虛高（222 放棄 + 58 聽完 > 270 播放）。
    $POCKET = 'hidden_playing';
    $pocketByCh = []; $pocketAll = 0;
    $pctNum = 0.0; $pctDen = 0;      // 只用有標籤、而且不是口袋那批來算平均進度
    // 四種離開方式各自數一次。unlabelled 是改動之前的記錄 —— 要留著並且在圖上標明，
    // 悄悄丟掉會讓百分比以一個比實際小的分母計算，看起來卻完全正常。
    $exitTotals = ['switch' => 0, 'hidden_paused' => 0, 'hidden_playing' => 0, 'unlabelled' => 0];
    foreach ($exitRow as $k => $m) {
        $parts = explode('|', (string)$k);
        $ch = isset($parts[0]) ? $parts[0] : '';
        $ex = isset($parts[1]) ? $parts[1] : '';
        $n  = (int)$m[0];
        // GA 對缺參數有時回空字串、有時回 '(not set)'，兩個都要當未標籤。
        if ($ex === '' || $ex === '(not set)') { $exitTotals['unlabelled'] += $n; continue; }
        if (isset($exitTotals[$ex])) $exitTotals[$ex] += $n;
        if ($ex === $POCKET) {
            $pocketAll += $n;
            if ($ch !== '') $pocketByCh[$ch] = (isset($pocketByCh[$ch]) ? $pocketByCh[$ch] : 0) + $n;
            continue;
        }
        $pctNum += $n * (isset($m[1]) ? $m[1] : 0.0);
        $pctDen += $n;
    }

    // 實際收聽秒數：聽完的全部算，中途離開的只算「真的離開」那批。
    // 逐章同總數由同一份報表出，所以兩個數字永遠夾得埋，不會各自算出不同的總和。
    $audioSecs = 0.0; $secByCh = []; $nByCh = [];
    foreach ($secRow as $k => $m) {
        $parts = explode('|', (string)$k);
        $ch = isset($parts[0]) ? $parts[0] : '';
        $ev = isset($parts[1]) ? $parts[1] : '';
        $ex = isset($parts[2]) ? $parts[2] : '';
        if ($ev === 'chapter_abandon' && $ex === $POCKET) continue;
        $audioSecs += $m[0];
        if ($ch !== '' && $ch !== '(not set)') {
            $secByCh[$ch] = (isset($secByCh[$ch]) ? $secByCh[$ch] : 0) + $m[0];
            $nByCh[$ch]   = (isset($nByCh[$ch]) ? $nByCh[$ch] : 0) + (isset($m[1]) ? (int)$m[1] : 0);
        }
    }

    $errAll = 0; $errOffline = 0;
    foreach ($errRow as $k => $m) {
        $errAll += (int)$m[0];
        if ((string)$k === 'true' || (string)$k === '1') $errOffline += (int)$m[0];
    }

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
        // '!' 令未指定的時分秒歸零。不加的話會填入「現在」的時間，日子雖然仍對，
        // 但同一份報表在不同時刻跑會得出不同的物件，出事時很難查。
        $dt = DateTime::createFromFormat('!Ymd', (string)$ymd, $tz);
        if (!$dt) continue;
        $w = (int)$dt->format('w');
        $tot1 = (int)$m[0]; $eng1 = (int)($m[1] ?? 0);
        $dailyOut[] = [
            // iso 畀前端做提示框的完整日期。期間會一日日加長並跨月，只帶「日」
            // 的話 8 月 3 日同 9 月 3 日會分唔開。
            'iso' => $dt->format('Y-m-d'),
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
    $chapters = []; $placedC = 0; $placedA = 0;
    for ($i = 1; $i <= 5; $i++) {
        $c = (int)pick($chapRow, "$i|chapter_complete");
        $a = (int)pick($chapRow, "$i|chapter_abandon");
        if ($c === 0 && $a === 0) continue;
        $placedC += $c; $placedA += $a;
        // pocket 從 abandon 裡面扣出來，兩條加起來仍然等於 GA 的原始放棄數，圖表不會少掉記錄。
        $p = isset($pocketByCh[(string)$i]) ? (int)$pocketByCh[(string)$i] : 0;
        // 完成率的分母用 GA 的原始放棄數，不是扣掉口袋之後那個 —— 口袋那批也是真的
        // 播過一次，從分母剔走會讓完成率虛高。
        $den = $c + $a;
        $n   = isset($nByCh[(string)$i]) ? $nByCh[(string)$i] : 0;
        $chapters[] = ['label' => bi("第 $i 章", "Ch $i"), 'complete' => $c,
                       'abandon' => max($a - $p, 0), 'pocket' => $p,
                       'rate'    => $den > 0 ? (int)round($c / $den * 100) : null,
                       'avgSec'  => $n > 0 ? (int)round($secByCh[(string)$i] / $n) : null];
    }
    // 🔴 擺唔入上面五章嘅記錄一定要有人數住。GA4 的自訂維度不會回溯：登記
    // chapter_number 之前發生的事件全部回 '(not set)'，只 loop 1..5 會靜靜地漏掉
    // 它們（實測 08-14 至 08-24 漏了 5 次聽完、4 次離開，即全部記錄的 7.6%）。
    // 這裡用「總數減已放進圖表的」而不是只夾 '(not set)'，將來多出第 6 章也接得住。
    $allC = 0; $allA = 0;
    foreach ($chapRow as $k => $m) {
        $n = (int)$m[0]; $key = (string)$k;
        if (substr($key, -17) === '|chapter_complete')     $allC += $n;
        elseif (substr($key, -16) === '|chapter_abandon')  $allA += $n;
    }
    $chaptersUnknown = ['complete' => max($allC - $placedC, 0), 'abandon' => max($allA - $placedA, 0)];

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
            'pct' => '',        // 下面一次過算，令一組加起來剛好 100
            'avg' => $avg,
            'hi'  => !$isInternal,
        ];
    }
    if ($otherSessions > 0) {
        $sources[] = ['name' => bi('其他', 'Other'), 'tag' => null, 'sessions' => $otherSessions,
                      'pct' => '', 'avg' => '—', 'hi' => false];
    }
    $sources = withPcts($sources);
    // 文字那句「X% 來自 QR」直接讀表格那一行，不要另外算一次 —— 分開算的話，
    // 餘額分配有機會令兩個數差 1%，同事就會見到文字同表格打交。
    foreach ($sources as $row) { if ($row['hi']) { $qrShare = $row['pct']; break; } }

    // ── 訪客裝置 ──
    // 對一個要離線下載、背景播放的音頻應用來說，iPhone 對 Android 的比例是真的有用：
    // iOS 在這兩件事上限制最多。以「使用次數」計，跟旁邊的來源表同一個單位。
    $devBuckets = [
        'ios'     => ['n' => 0, 'label' => bi('iPhone／iPad', 'iPhone / iPad')],
        'android' => ['n' => 0, 'label' => bi('Android 手機', 'Android phone')],
        'tablet'  => ['n' => 0, 'label' => bi('平板電腦', 'Tablet')],
        'desktop' => ['n' => 0, 'label' => bi('桌面電腦', 'Desktop computer')],
        'other'   => ['n' => 0, 'label' => bi('其他', 'Other')],
    ];
    foreach ($devRows as $k => $m) {
        $parts = explode('|', (string)$k);
        $cat = $parts[0] ?? ''; $os = $parts[1] ?? '';
        $n = (int)$m[0];
        if ($cat === 'desktop')                       $devBuckets['desktop']['n'] += $n;
        elseif ($cat === 'tablet')                    $devBuckets['tablet']['n']  += $n;
        elseif ($cat === 'mobile' && $os === 'iOS')   $devBuckets['ios']['n']     += $n;
        elseif ($cat === 'mobile' && $os === 'Android') $devBuckets['android']['n'] += $n;
        else                                          $devBuckets['other']['n']   += $n;
    }
    $devTotal = 0;
    foreach ($devBuckets as $b) { $devTotal += $b['n']; }
    $devices = [];
    foreach ($devBuckets as $b) {
        if ($b['n'] === 0) continue;
        $devices[] = ['name' => $b['label'], 'sessions' => $b['n'], 'pct' => ''];
    }
    // 由多到少排。版面上「最多人用的是 X」那句直接讀第一行，靠固定次序的話，
    // 有一天 Android 超過 iPhone，那句就會變成假話而沒有人發現。
    usort($devices, function ($a, $b) { return $b['sessions'] <=> $a['sessions']; });
    $devices = withPcts($devices);

    // ── 訪客地區 ──
    // GA 只給英文國名。常見的譯好，其餘保留原名 —— 憑空音譯只會譯錯。
    $ctyName = [
        'Hong Kong' => bi('香港', 'Hong Kong'),   'China' => bi('中國內地', 'Mainland China'),
        'Macao' => bi('澳門', 'Macao'),           'Taiwan' => bi('台灣', 'Taiwan'),
        'Japan' => bi('日本', 'Japan'),           'South Korea' => bi('南韓', 'South Korea'),
        'Singapore' => bi('新加坡', 'Singapore'), 'Malaysia' => bi('馬來西亞', 'Malaysia'),
        'Thailand' => bi('泰國', 'Thailand'),     'Philippines' => bi('菲律賓', 'Philippines'),
        'United States' => bi('美國', 'United States'),
        'United Kingdom' => bi('英國', 'United Kingdom'),
        'Australia' => bi('澳洲', 'Australia'),   'Canada' => bi('加拿大', 'Canada'),
    ];
    $ctyTotal = 0;
    foreach ($ctyRows as $m) { $ctyTotal += (int)$m[0]; }
    $places = []; $ctyRest = 0; $i = 0;
    foreach ($ctyRows as $name => $m) {
        $n = (int)$m[0];
        // 只列頭四個，其餘歸「其他地區」—— 一堆一次的國家會蓋過真正的訊號。
        if ($i++ >= 4) { $ctyRest += $n; continue; }
        $places[] = [
            'name' => isset($ctyName[$name]) ? $ctyName[(string)$name] : bi((string)$name, (string)$name),
            'sessions' => $n, 'pct' => '',
            'hi'  => ((string)$name === 'Hong Kong'),
        ];
    }
    if ($ctyRest > 0) {
        $places[] = ['name' => bi('其他地區', 'Elsewhere'), 'sessions' => $ctyRest,
                     'pct' => '', 'hi' => false];
    }
    $places = withPcts($places);

    // ── 其他觀察 ──
    // 舊版用 averageCustomEvent:listened_pct 算全部 chapter_abandon，而那批裡面大多數是
    // 「熄屏放進口袋」的一刻，所以量到的其實是「幾時收機」而不是「幾時放棄」。五章全部
    //  落在 15–26% 這種平坦分佈就是徵狀。現在只用有 exit 標籤、而且不是口袋那批來算。
    $listenedPct    = $pctDen > 0 ? round($pctNum / $pctDen, 1) : null;
    $listenedPctOld = round(pick($listened, ''), 1);   // 保留舊算法，給下面的備註做對比
    $dl      = $stage('audio_download');
    $pwaAll  = (int)pick($stgAll, 'pwa_launch');
    $zhUsers = (int)pick($langRow, 'zh');
    $enUsers = (int)pick($langRow, 'en');
    $facts = [
        ['v' => bi($listenedPct === null ? '—' : $listenedPct . '%',
                   $listenedPct === null ? '—' : $listenedPct . '%'),
         'k' => bi('真正中途離開時的平均進度', 'Average progress at a real drop-off'),
         'n' => $listenedPct === null
                ? $sinceNote
                : bi('已剔除熄屏繼續聽那批 · ' . $sinceNote['zh'],
                     'Screen-locked listening excluded · ' . $sinceNote['en'])],
        ['v' => bi($sessions > 0 && $audioSecs > 0 ? mmss($audioSecs / $sessions) : '—',
                   $sessions > 0 && $audioSecs > 0 ? mmss($audioSecs / $sessions) : '—'),
         'k' => bi('平均實際收聽時間', 'Audio actually heard'),
         'n' => bi('由音訊進度計，螢幕熄了也算 · ' . $sinceNote['zh'],
                   'From audio progress, counts with the screen off · ' . $sinceNote['en'])],
        ['v' => bi($pocketAll . ' 次', (string)$pocketAll),
         'k' => bi('熄屏後把手機放下繼續聽', 'Pocketed the phone and kept listening'),
         'n' => bi('舊版把這批算成放棄 · ' . $sinceNote['zh'],
                   'The old figure counted these as drop-offs · ' . $sinceNote['en'])],
        ['v' => bi($errAll . ' 次', (string)$errAll),
         'k' => bi('音檔載入失敗', 'Audio failed to load'),
         'n' => $errAll > 0
                ? bi($errOffline . ' 次發生在離線 · ' . $sinceNote['zh'],
                     $errOffline . ' while offline · ' . $sinceNote['en'])
                : bi('之前完全沒有記錄 · ' . $sinceNote['zh'],
                     'Not measured at all before then · ' . $sinceNote['en'])],
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
            // 前端用這幾個值把日期選擇器設定成跟伺服器一致：選擇器顯示的
            // 永遠是「實際採用了甚麼」，不是「使用者要求了甚麼」。
            'from'  => $start,
            'to'    => $end,
            'min'   => $min !== null ? $min : $start,
            'max'   => $max !== null ? $max : $end,
            'clamped' => $clamped,
        ],
        'summary' => [
            ['k' => bi('訪客人數', 'Visitors'), 'v' => (string)$users,
             'n' => bi('不重複訪客', 'Unique visitors')],
            ['k' => bi('使用次數', 'Sessions'), 'v' => (string)$sessions,
             'n' => bi('平均每天 ' . ($days > 0 ? round($sessions / $days) : 0) . ' 次',
                       'About ' . ($days > 0 ? round($sessions / $days) : 0) . ' a day')],
            // 只計前景兼螢幕亮著的時間，所以是下限；上限在「其他觀察」的實際收聽時間。
            ['k' => bi('平均使用時間', 'Time in app'),
             'v' => $sessions > 0 ? mmss($engageSecs / $sessions) : '—',
             'n' => bi('螢幕亮著才計', 'Screen-on time only')],
            ['k' => bi('聽完整條路線', 'Completed the route'), 'v' => (string)$qrComplete,
             'n' => bi('經 QR code 進入的訪客', 'Among QR code visitors')],
        ],
        'daily'    => $dailyOut,
        'funnel'   => $funnel,
        'chapters' => $chapters,
        // 對不上章節編號的記錄。圖表下面會明寫有幾多次未計入 —— 悄悄丟掉會令
        // 同事以為圖上就是全部。
        'chaptersUnknown' => $chaptersUnknown,
        // 前端用這幾個值決定要不要在圖表旁邊寫「這條線 9 月 24 日才開始有數」。
        'fields' => [
            'since'       => $FIELDS_SINCE,
            'full'        => $newFieldsFull,
            'pocketAll'   => $pocketAll,
            'audioSecs'   => (int)$audioSecs,
            'exitTotals'  => $exitTotals,
            // 原始秒數：上下限那條範圍圖要自己算長度，格式化過的 "2:14" 用不到。
            'avgEngageSec'=> $sessions > 0 ? (int)round($engageSecs / $sessions) : 0,
            'avgAudioSec' => $sessions > 0 ? (int)round($audioSecs / $sessions) : 0,
            'errAll'      => $errAll,
            'oldAvgPct'   => $listenedPctOld,
            // 前端用嚟決定章節圖下面講唔講「前後不可直接比較」
            'uiSince'     => $UI_SINCE,
            'uiBefore'    => $end < $UI_SINCE,
            'uiAfter'     => $start >= $UI_SINCE,
        ],
        'facts'    => $facts,
        'sources'  => $sources,
        'devices'  => $devices,
        'places'   => $places,
        // 文案要用的數字。放在這裡而不是寫死在 HTML —— 數據一即時更新，寫死的句子
        // 就會跟圖表打架。
        'derived' => [
            'qrShare'          => $qrShare,
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
            'listenedPct'      => $listenedPct === null ? '—' : $listenedPct . '%',
            // 前端用這個決定要不要寫出那一句 —— 沒有可信數字時整句略去，好過印一個「—」。
            'listenedPctKnown' => $listenedPct !== null,
            'playRatio'        => $qrAudio > 0 ? (int)round($qrUsers / $qrAudio) : null,  // JSON 出 int，唔好出 4.0
        ],
    ];
}
