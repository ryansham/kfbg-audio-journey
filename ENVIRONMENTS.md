# Staging / Production 環境分離 — 決策與工作流程

*建立日期：2026-06-19 · 維護者：Ryan Sham*

呢份文件記錄 KFBG Audio Journey 點樣分離 staging 同 production，**以及每個決定背後嘅「點解」**。給未來嘅自己（或交接同事）一份單一真相來源。

---

## 1. 問題

App 同時存在於兩個地方：

| 環境 | 網址 | Sanity dataset | 用途 |
|------|------|----------------|------|
| **Staging** | `ryansham.github.io/kfbg-audio-journey` (GitHub Pages) | `staging` | 內部測試、預覽 |
| **Production** | `audio-journey.kfbg.org` (DirectAdmin) | `production` | 公開訪客 |

之前嘅分離係「半自動、靠人記住」，冇明確規矩，存在三個風險：未完成嘅改動意外上 production、唔知 production 究竟 live 緊邊個版本、推送內容時可能覆蓋咗 production 又冇得回滾。

---

## 2. 分離要保證嘅三件事（設計原則）

所有決定都係為咗滿足呢三條，唔係為加功能：

1. **隔離** — 測試／編輯永遠唔影響訪客睇到嘅嘢
2. **可追溯** — 隨時答到「production 而家 live 緊邊個 code + 內容版本」
3. **安全推送** — staging→production 係刻意、可回滾、單向

> 核心約束：呢個 app 係**單一靜態 `index.html`、Ryan 係唯一維護者**。所以刻意避免企業級 CI/CD —— 簡單可靠 > 完備複雜。

---

## 3. 決策（每軸 + 點解）

### 軸 1｜網址 / 環境 — ✅ 已分離，維持
staging = GitHub Pages、production = DirectAdmin，兩個獨立 host。**唔需要改。**

### 軸 2｜Sanity 資料 — ✅ 兩個獨立 dataset
`index.html` 靠 hostname 自動判斷讀邊個 dataset：
```js
if(h === 'audio-journey.kfbg.org' || h === 'audio.kfbg.org') return 'production';
return 'staging';
```
**點解保留 `audio.kfbg.org`**：預留畀 IT 日後若改用該 subdomain，唔使再改 code。

**已修 bug**：`sanityImg()` 圖片 URL 之前寫死 `/production/`，令 staging 都攞 production 圖。已改成跟 `${SANITY_DATASET}`。安全原因：GROQ query 用 `asset->url` 優先解析，呢個 builder 只係 fallback，而 `asset->url` 證明 asset 必定存在於當前 dataset。

### 軸 3｜程式碼分支 — ✅ 決定：**單一 `main` 分支，唔開 staging 分支**
**點解唔開分支**（即使直覺上「分離」會諗到分支）：
- App 係單一靜態檔、單人維護。
- GitHub Pages 自動部署 `main` —— 「一 push 就更新 staging」正正係 sandbox 嘅用途，唔係 bug。
- Production 係**手動上傳**，本身已經閘住；所以 `main` 上未完成嘅嘢只會出現喺 staging，永遠唔會自動去 production。**隔離（保證 1）已達成，唔使分支。**
- 加 staging 分支 = 換嚟 merge 儀式、零安全增益（典型過度工程化）。
- **逃生門**：真係要連 staging 都收埋某段 WIP？臨時開個 feature branch，做完 merge 返 `main`。唔好制度化。

### 軸 4｜Production 部署流程 — ✅ 決定：**手動上傳 + git tag 記錄**
- **機制（先簡後繁）**：經 DirectAdmin File Manager / FTP 手動上傳，跟下面 checklist。
  - *點解唔即刻寫自動化 script*：唔使儲 FTP 憑證、冇 script 要維護。
  - *升級路徑*：若部署變頻繁，加 FTP 憑證入 `.env`，可寫 `deploy-prod.sh`（`lftp mirror`）一鍵部署。**到需要先做。**
- **可追溯**：每次 production release 打 git tag `prod-vNN`（對應 `PAGE_CACHE` 版本）。之後 `git show prod-v44` = 正正係 live 緊嗰份。**保證 2 達成。**

### 軸 5｜內容 promotion（Sanity）— ✅ 決定：**copy 前先 export 備份**
```bash
cd studio/
npx sanity dataset export production backups/prod-$(date +%Y%m%d).tar.gz   # 先備份
npx sanity dataset copy staging production                                  # 再推送
```
**點解先備份**：`dataset copy` 會**整個覆蓋** production；30 秒 export 換到可回滾。**單向**：永遠 staging→production，唔反方向。**保證 3 達成。**

---

## 4. 工作流程速查

### 日常開發
1. 改 `index.html` → push `main` → GitHub Pages 自動更新 staging → 喺 `ryansham.github.io` 測試
2. 改內容 → 喺 Sanity `staging` dataset 編輯 → staging 即見

### 發佈到 Production（release checklist）
1. **Bump 版本**：`index.html` 註解 `vNN` + `sw.js` 嘅 `kfbg-pages-vNN`（兩處同步）
2. **備份 prod 內容**：`cd studio && npx sanity dataset export production backups/prod-YYYYMMDD.tar.gz`
3. **推送內容**：`npx sanity dataset copy staging production`
4. **上傳 code** 到 DirectAdmin `public_html`：`index.html`、`sw.js`、`manifest.json`、`.htaccess`、`images/`、`audio/`、圖標
5. **打 tag**：`git tag prod-vNN && git push --tags`
6. **驗證**：開 `audio-journey.kfbg.org` → 強制刷新 → 確認冇黃色 STAGING badge、SW 已更新

### 回滾
- **Code**：重新上傳上一個 tag 嘅檔案（`git checkout prod-v{NN-1} -- .` 再上傳）
- **內容**：`npx sanity dataset import backups/prod-YYYYMMDD.tar.gz production --replace`

---

## 5. 一次性前置設定（部署前必做）
- [ ] DirectAdmin → SSL Certificates 開 Let's Encrypt（Service Worker 必須 HTTPS）
- [ ] 上傳 `.htaccess`（已含 sw.js no-cache + 強制 HTTPS）
- [ ] Sanity → API → CORS 加 `https://audio-journey.kfbg.org`
- [ ] Revoke 舊 Editor token，出新 token 收入 `.env`
- [ ] 建立 `studio/backups/` 目錄並加入 `.gitignore`（備份檔唔入版本控制）
