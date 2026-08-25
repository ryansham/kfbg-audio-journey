# -*- coding: utf-8 -*-
"""睇下 ga-proxy.php 通咗未，用白話講卡喺邊一步。

    read -p "DirectAdmin 使用者名稱: " U && \
      curl -s -u "$U" "https://audio-journey.kfbg.org/analytics/ga-proxy.php?force=1" \
      | python3 check.py

⚠️ API 未開同權限不足兩者都回 HTTP 403，所以下面的判斷要先認 API 未開的字串，
   次序調轉的話「API 未開」會被誤判成「未給權限」，然後一直叫你去改一個沒有問題的設定。
"""
import sys, json
raw = sys.stdin.read().strip()
def out(*a): print(*a)
if not raw:
    out("❓ 冇任何回應 —— 網址或者密碼唔啱"); sys.exit()
try:
    d = json.loads(raw)
except Exception:
    out("❓ 回應唔係 JSON。頭 200 字：\n" + raw[:200]); sys.exit()
if d.get("live"):
    s = d.get("summary", [])
    out("✅ 成功！即時數據通咗。")
    if len(s) >= 2:
        out(f"   期間 {d['range']['start']['zh']} 至 {d['range']['end']['zh']}（{d['range']['days']} 天）")
        out(f"   訪客 {s[0]['v']} 人 · 使用 {s[1]['v']} 次")
    out("\n   下一步：開個頁面撳「重新載入數據」，右上角應該由灰點變綠點。")
    sys.exit()
msg = d.get("message", "")
if d.get("error") == "config-missing":
    out("🔴 卡喺：config.php 讀唔到")
    out("   → 睇下 config.php 仲喺唔喺 analytics 資料夾")
elif "讀不到 service account key" in msg:
    out("🔴 卡喺：第 4／6 步 —— 金鑰檔搵唔到")
    out("   → 個 JSON 上載咗未？")
    out("   → 檔名係咪一字不差叫 audio-journey-sa.json？")
    out("   → 佢係咪真係喺 ga-credentials 資料夾入面？")
elif "格式不正確" in msg:
    out("🔴 卡喺：金鑰檔內容唔對")
    out("   → 上載嗰陣可能損壞咗，或者揀錯咗 P12 唔係 JSON。重新下載一次。")
elif "has not been used" in msg or "SERVICE_DISABLED" in msg or "accessNotConfigured" in msg:
    out("🔴 卡喺：第 2 步 —— API 未開")
    out("   → Google Cloud 搜尋 Google Analytics Data API → 撳 Enable")
    out("   → 開完等一兩分鐘先再試")
elif "PERMISSION_DENIED" in msg or "403" in msg:
    out("🔴 卡喺：第 5 步 —— GA 未畀權限")
    out("   → GA4 Admin → Property access management 加咗個 service account email 未？")
    out("   → 加咗喺啱嗰個 property 未？（要 audio journey 嗰個）")
elif "invalid_grant" in msg or "JWT" in msg:
    out("🔴 卡喺：金鑰無效或者伺服器時鐘唔準")
    out("   → 重新下載一次金鑰")
else:
    out("🔴 未見過嘅錯誤，原文：")
    out("   " + msg[:300])
