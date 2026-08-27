# Audio Journey 數據簡報

給項目團隊傳閱的 GA4 使用情況報告。中英雙語、淺色單一主題（刻意不做深色版：這份會被列印和貼進簡報，每個人看到的應該一樣）。

**位置**：`https://audio-journey.kfbg.org/analytics/`
**伺服器路徑**：`public_html/analytics/`

---

## 檔案

| 檔案 | 上載? | 用途 |
|---|:---:|---|
| `index.html` | ✅ | 頁面本身。圖表在瀏覽器由數據即場畫出，沒有外部程式庫 |
| `ga-proxy.php` | ✅ | 伺服器端即時查 GA4。憑證留在伺服器，永不下傳 |
| `data.json` | ✅ | 後備快照。proxy 未設定好或 GA 打不通時頁面會退回這一份 |
| `.htaccess` | ⚠️ | 擋住憑證與快取、關掉搜尋引擎收錄、JSON 不快取。**平時不要上載** —— 會蓋走 DirectAdmin 的密碼保護，見下面「存取控制」 |
| `config.php` | ✅ | **在伺服器上由 `config.sample.php` 複製而成，不在 repo 內** |
| `config.sample.php` | ➖ | 設定範本 |
| `build_data.py` | ➖ | 產生 `data.json` |
| `test-proxy.php` | ➖ | proxy 轉換邏輯自我檢查 |
| `test-dates.mjs` | ➖ | 前端日期／時區檢查 |

➖ = 不需要上載。`.htaccess` 按**檔案類別**擋（`test-*`、`*.py`、`*.mjs`、`*.md`、`config*.php`），
不是逐個檔名列，所以將來加新的工具檔也會自動被擋住，即使誤上載也打不開。

---

## 數據怎樣來

```
瀏覽器  →  ga-proxy.php  →  GA4 Data API      （即時，15 分鐘快取）
            ↓ 失敗
        data.json                              （人手匯出快照）
```

頁面右上角的圓點標示現在看的是哪一種：**即時數據**（綠點）或**人手匯出快照**（灰點）。按「重新載入數據」會重試，並告訴你數字有沒有變。

兩邊輸出的 JSON 結構完全一致，所以退回快照時版面不會出事。⚠️ 改任何一邊的欄位，另一邊要一起改。

---

## 訪客背景（裝置、地區、年齡性別）

**裝置**（iPhone／Android／桌面）同**地區**都有數，已經放上版面。裝置那個比例對這個
應用特別有用：要下載音頻離線收聽、又要在鎖上螢幕之後繼續播放，而 iOS 在這兩件事上
的限制比 Android 多，所以測試時間應該按這個比例分配。

**年齡與性別暫時沒有。** 2026-08-27 實測：Data API 回**零行**，並且標住
`subject_to_thresholding: true`。兩個原因：

1. **Google Signals 不會補回舊數據。** 2026-08-27 才開啟，只由那天起計。
2. **人數太少會被自動隱去**，以免辨認到個人。一百人左右這個量級，開了也未必見得到。

要再確認的話跑一次，見到 `rows: []` 就是仍然未夠：

```
run_report(property_id=549905025, dimensions=["userAgeBracket","userGender"], metrics=["totalUsers"])
```

⚠️ **地區由 IP 推算，公司網絡或 VPN 會算錯。** 實測 2026-08 那批「日本」訪問全部是
桌面 Mac ＋ Chrome ＋ 直接輸入網址，每次事件數是一般訪客的兩倍多 —— 明顯不是拿著
手機在園區行的訪客。少量非香港的訪問通常屬於這一類，不要當成海外訪客。

---

## 百分比

三個表（來源、裝置、地區）的佔比都用**最大餘額法**算，加起來剛好 100。

逐個獨立四捨五入的話會得出 99 或 101 —— 實測一百組隨機數字，有 19 組會出事，而版面上
的說明白紙黑字寫著「加起來是 100%」，那句就變成假話。`pcts()` 在 `ga-proxy.php` 和
`build_data.py` 各有一份，必須完全一樣（包括打和時保持原次序）。

分母一律是**表內各行的總和**，不是 GA 的總 session 數：GA 逐個維度各自去重，加起來會
多過總數（實測 136 對 134）。文案裡「X% 來自 QR」那句直接讀表格那一行，不另外算一次。

---

## 時區

全條鏈都是香港時間，而且每一處都明寫，不靠任何預設值：

| 位置 | 做法 |
|---|---|
| GA4 資源 | `time_zone: Asia/Hong_Kong`，所以 GA 的「日」本身就是香港的日 |
| `ga-proxy.php` | 全部 `DateTime` 明確帶 `$TZ`。`maxDataDate()` 先把時刻換算到香港才數日子 |
| `data.json` 的 `generated` | 帶 `+08:00` |
| 頁面顯示的讀取時間 | `toLocaleString()` 明確指定 `timeZone: 'Asia/Hong_Kong'` |
| 預設按鈕算日子 | 純粹加減年月日欄位，不做時區換算 |

🔴 **伺服器的 PHP 預設時區是 UTC。** 少寫一個 `$TZ`，每日香港時間 00:00 到 08:00
這八個鐘算出來的「今天」就會慢一日 —— 同事一早開報告，會見到期間比昨天還要短。
`maxDataDate()` 把這條界線抽了出來，就是為了測得到：`test-proxy.php` 用固定時刻
餵它，涵蓋午夜前後、跨月、跨年。

🔴 **`toISOString()` 不可以用來算日子。** 它換算成 UTC，`2026-08-24` 會變 `2026-08-23`。
實測連香港時區的讀者都會中招：「最近 7 天」會變成 8 天。

前端的時區問題不會報錯，只會靜靜顯示錯的日子，而且多數只錯在別人身上 —— 寫程式的
人自己的機器就是香港時區，永遠試不出來。所以 `test-dates.mjs` 由 `index.html` 抽出
真正的函式和真正的格式選項，在五個時區各跑一次，答案必須一模一樣。

---

## 選期間

頁面頂有三個預設（最近 7 天／最近 30 天／全部）加一組日期格。選好之後日子會寫進網址，
所以 `…/analytics/?from=2026-08-18&to=2026-08-24` 這種連結派得出去；不帶參數的連結永遠
顯示最新的完整期間。

日期在**伺服器**驗，不倚賴前端：

| 情況 | 結果 |
|---|---|
| 早過分析系統開始收集那天 | 收窄到那天 |
| 晚過「前日」 | 收窄到前日（最近一天的互動數字未算好，會回 0）|
| `from` 遲過 `to` | 整個退回預設範圍 |
| 不存在的日期，例如 `2026-02-31` | 當作沒有帶 |

回傳的 JSON 帶著**實際採用**的 `range.from` / `range.to`，頁面的選擇器跟著它走。
所以選擇器顯示的永遠是「畫面上這批數字屬於哪一段」，不是「你要求了甚麼」。被收窄時
會出一句說明。

⚠️ **快取以範圍做鍵**（`cache/dashboard-<from>_<to>.json`）。以前只有一個固定範圍，
一個檔就夠；現在共用一個檔名的話，先到的人存起「最近 7 天」，後到的人開預設會收到那
7 天的數字但標題寫著自己的日期。七日沒碰過的快取檔會自動清走。

每個沒被快取命中的範圍 = 一次 GA API 查詢（9 份報表，分 2 批）。15 分鐘快取之下，
幾個同事各自揀幾個範圍離配額還很遠，但如果將來要做「任意拖動日期」就要重新算一次。

---

## 設定即時數據（一次過）

### 1. 開 service account

Google Cloud Console → IAM & Admin → Service Accounts → Create：

- 名稱隨意，例如 `audio-journey-dashboard`
- 不需要授予任何 Google Cloud 角色
- 建立後進去 → Keys → Add key → JSON → 下載

### 2. 在 GA4 加它做檢視者

GA4 → Admin → Property access management → 加剛才那個 service account 的電郵（`…@….iam.gserviceaccount.com`），角色選 **Viewer**。

### 3. 把金鑰放上伺服器

🔴 **必須放在 `public_html` 以外。** 放在 `analytics/` 之內的話，任何人打
`https://audio-journey.kfbg.org/analytics/<檔名>.json` 就會拿到私鑰，等於把整個 GA 帳戶交出去。

DirectAdmin 上，家目錄通常是 `/home/<使用者名稱>/`。建一個資料夾例如
`/home/<使用者名稱>/ga-credentials/`，把 JSON 放進去。

### 4. 建立 config.php

在伺服器把 `config.sample.php` 複製成 `config.php`，填入金鑰的絕對路徑。這個檔不進版本控制（`.gitignore` 已擋，本 repo 是 public）。

### 5. 驗一驗

```bash
curl -s "https://audio-journey.kfbg.org/analytics/ga-proxy.php" | head -c 200
```

見到 `{"generated":"…","live":true,…` 就成功。見到 `{"error":"config-missing"…}` 代表第 4 步未做；見到 `{"error":"ga-unavailable"…}` 代表憑證或權限有問題，訊息會說明是哪一種。

---

## 更新後備快照

即時數據上線後，`data.json` 只在 GA 打不通時才會用到，但也不應該長期不管 —— 出事那天同事看到的就是它。

1. 由 GA4 重新拉數，改 `build_data.py` 頂部那組常數
2. `python3 build_data.py`
3. 只上載 `data.json`

---

## 存取控制

由 DirectAdmin 的 Basic Auth 把關，設定在：

```
DirectAdmin → Advanced Features → Password Protected Directories
→ public_html/analytics
```

訪客在頁面載入之前就要通過，所以 `index.html` 內不再自設密碼框（兩層密碼只會讓同事被問兩次）。

要改密碼，在同一個 DirectAdmin 畫面改，不用動任何檔案。

### 🔴 上載 `.htaccess` 會關掉密碼保護

DirectAdmin 把 `AuthType` / `AuthUserFile` 那幾行**寫進 `analytics/.htaccess` 本身**。
上載 repo 版本就是蓋走它們，`/analytics/` 會立即變成全世界打得開。
2026-08-26 實際發生過：上載之後 `curl` 回 200 而不是 401。

auth 那幾行沒有寫進 repo，是因為 `.htpasswd` 的絕對路徑是那部伺服器獨有的，而這個
repo 是公開的。

所以 `.htaccess` 平時**不要上載**。真的改過規則要上載，三步缺一不可：

1. 上載 `.htaccess`
2. DirectAdmin → Password Protected Directories → `public_html/analytics` → 重新設定一次
3. 驗一驗（下面）

### 每次上載之後都要跑一次

```bash
for u in / ga-proxy.php config.php cache/token.json; do
  printf "%-22s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' "https://audio-journey.kfbg.org/analytics/$u")"
done
```

應該見到：

| 網址 | 應該回 |
|---|---|
| `/analytics/` | **401**（回 200 就是密碼保護被蓋走了）|
| `/analytics/ga-proxy.php` | **401** |
| `/analytics/config.php` | 403 |
| `/analytics/cache/token.json` | 403 |

⚠️ 「記得去 DirectAdmin 重開」這種靠人記住的規矩一定會有一天忘記，所以真正把關的是
上面這個 curl，不是這段文字。上載完就跑，30 秒。

---

## 開發

```bash
php test-proxy.php     # proxy 轉換邏輯自我檢查（86 項，含百分比、時區、輸入驗證）
node test-dates.mjs    # 前端日期／時區檢查（五個時區各跑一次）
python3 build_data.py  # 重新產生後備快照
```

`test-proxy.php` 餵一組真 GA4 格式的固定資料進 `buildPayload()`，比對的是我們獨立已知正確的答案（99 位訪客、2:27、漏斗 84/27/23/8/3 等），所以它捉得到算錯、欄位對錯位、百分比基數用錯。另外有一組 `clampRange()` 的檢查，因為那是這個檔唯一接受外來輸入的地方。改過 proxy 就跑一次。

要在本機試日期選擇器，靜態 server 不行：`ga-proxy.php` 跑不起來，頁面會退回快照，
選擇器就會關掉（這是刻意的 —— 只有一份快照時揀期間沒有意義）。要試的話寫一個替身，
`require` 真的 `ga-proxy.php`（帶 `GA_PROXY_NO_RUN`）借用真的 `clampRange()` 和
`buildPayload()`，只把 GA 換成按日期過濾的固定資料。

---

## 幾件踩過的坑

- **`/analytics/` 帶尾斜線才安全。** App 的 service worker 在 `/` scope，它的 `isPage` 只夾 `/` 和 `/index.html` 結尾。`/analytics/` 不會被攔截，但 `/analytics/index.html`（明寫檔名）會 —— 線上正常，離線第一次可能拿到 app 的殼。派連結一律用帶尾斜線那個。
- **`cache/token.json` 裝住生效中的 GA access token。** `ga-proxy.php` 建立快取資料夾時會自己寫一份 deny 進去，不倚賴人手設定 `.htaccess`。
- **PHP 和 Python 的 `round()` 不一樣。** Python 用銀行家捨入（`round(12.5) == 12`），PHP 四捨五入（得 13）。同一組數經兩邊產生會顯示不同百分比，所以 `build_data.py` 用 `Decimal` + `ROUND_HALF_UP` 對齊 PHP。
- **`toISOString()` 不可以用來算日子。** 它換算成 UTC，香港是 UTC+8，`2026-08-24` 會變成 `2026-08-23`。預設按鈕的日期用手寫的年月日格式。
- **句子裡的數字一律由 `derived` 帶進來。** 「85%」「5 倍」「每 4 位」這些寫死在 HTML 的話，數據一更新就會跟旁邊的圖表互相矛盾。
