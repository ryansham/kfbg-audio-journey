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
| `.htaccess` | ✅ | 擋住憑證與快取、關掉搜尋引擎收錄、JSON 不快取 |
| `config.php` | ✅ | **在伺服器上由 `config.sample.php` 複製而成，不在 repo 內** |
| `config.sample.php` | ➖ | 設定範本 |
| `build_data.py` | ➖ | 產生 `data.json` |
| `test-proxy.php` | ➖ | proxy 轉換邏輯自我檢查 |

➖ = 不需要上載（`.htaccess` 已擋住直接存取，即使誤上載也打不開）

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

### 建議：DirectAdmin 真閘

```
DirectAdmin → Advanced Features → Password Protected Directories
→ 選 public_html/analytics → 設使用者名稱與密碼
```

設好之後，把 `index.html` 內的 `REQUIRE_PASSWORD` 改成 `false`，訪客就只會被問一次密碼。

### 目前：頁內密碼

🔴 **不是保安措施，只是阻嚇。** 任何人檢視原始碼都看得到所有數字，也可以直接略過密碼框。適合防止連結被隨手轉發，不適合保護真正敏感的東西。

這份報告全是彙總訪客數據、沒有個人資料，阻嚇級別大致夠用 —— 但真閘就在上面，兩分鐘的事。

要改密碼：算新的 FNV-1a 32-bit hash，換掉 `index.html` 內的 `PW_HASH`。

---

## 開發

```bash
php test-proxy.php     # proxy 轉換邏輯自我檢查（35 項）
python3 build_data.py  # 重新產生後備快照
```

`test-proxy.php` 餵一組真 GA4 格式的固定資料進 `buildPayload()`，比對的是我們獨立已知正確的答案（99 位訪客、2:27、漏斗 84/27/23/8/3 等），所以它捉得到算錯、欄位對錯位、百分比基數用錯。改過 proxy 就跑一次。

---

## 幾件踩過的坑

- **`/analytics/` 帶尾斜線才安全。** App 的 service worker 在 `/` scope，它的 `isPage` 只夾 `/` 和 `/index.html` 結尾。`/analytics/` 不會被攔截，但 `/analytics/index.html`（明寫檔名）會 —— 線上正常，離線第一次可能拿到 app 的殼。派連結一律用帶尾斜線那個。
- **`cache/token.json` 裝住生效中的 GA access token。** `ga-proxy.php` 建立快取資料夾時會自己寫一份 deny 進去，不倚賴人手設定 `.htaccess`。
- **PHP 和 Python 的 `round()` 不一樣。** Python 用銀行家捨入（`round(12.5) == 12`），PHP 四捨五入（得 13）。同一組數經兩邊產生會顯示不同百分比，所以 `build_data.py` 用 `Decimal` + `ROUND_HALF_UP` 對齊 PHP。
- **句子裡的數字一律由 `derived` 帶進來。** 「85%」「5 倍」「每 4 位」這些寫死在 HTML 的話，數據一更新就會跟旁邊的圖表互相矛盾。
