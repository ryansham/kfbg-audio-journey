# -*- coding: utf-8 -*-
"""產生 data.json —— dashboard 的後備快照。

正常情況下頁面會問 ga-proxy.php 拿即時數據；只有 proxy 未設定好、或 GA 暫時
打不通時，才會退回這個檔。所以它不需要天天更新，但也不應該長期不管 —— 萬一
proxy 出事，同事看到的就是這一份。

    python3 build_data.py

數值來源：Analytics Data API（資源 549905025）。改數之後跑一次，再連同其他檔
一起上載。輸出的結構必須與 ga-proxy.php 的 buildPayload() 完全一致，否則前端
退回快照時會出現欄位對不上。
"""
import json, datetime, math
from decimal import Decimal, ROUND_HALF_UP


def r(x):
    """四捨五入（half away from zero）。

    ⚠️ 不要用內建 round()：Python 用的是銀行家捨入，round(12.5) == 12，
    而 ga-proxy.php 的 PHP round() 會得出 13。同一組數字經兩邊產生會顯示不同
    百分比，同事看到的數字就會取決於當下是 proxy 還是快照在供數。
    """
    return int(Decimal(str(x)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))

def pcts(counts):
    """加起來剛好 100 的整數百分比（最大餘額法）。

    逐個獨立四捨五入會得出 99 或 101，而版面上的說明寫著「加起來是 100%」，
    那句就會變成假話。必須跟 ga-proxy.php 的 pcts() 完全一樣，包括打和時
    保持原次序（PHP 的 arsort 在 8.0 之後是穩定排序）。
    """
    total = sum(counts)
    if total <= 0:
        return [0] * len(counts)
    exact = [c / total * 100 for c in counts]
    out = [math.floor(e) for e in exact]
    order = sorted(range(len(counts)), key=lambda i: (-(exact[i] - math.floor(exact[i])), i))
    for i in order[:100 - sum(out)]:
        out[i] += 1
    return out


HKT = datetime.timezone(datetime.timedelta(hours=8))


def b(zh, en):
    return {"zh": zh, "en": en}


# ── 由 GA 讀回來的原始數字（2026-08-14 至 08-23）────────────────────────────
USERS, SESSIONS, ENGAGED = 106, 134, 84
ENGAGE_SECONDS = 17904
QR_SESSIONS, QR_USERS, QR_SECONDS = 111, 88, 9763
INT_SESSIONS, INT_SECONDS = 20, 7545
OTHER_SESSIONS = 3

DAILY = [  # (日, 星期索引 0=日, 總次數, 有實際使用)
    ("14", 5, 17, 13), ("15", 6, 11, 5),  ("16", 0, 10, 5),
    ("17", 1, 17, 12), ("18", 2, 9, 7),   ("19", 3, 8, 4),
    ("20", 4, 10, 4),  ("21", 5, 5, 3),   ("22", 6, 7, 3),
    ("23", 0, 26, 18), ("24", 1, 14, 10),
]
CHAPTERS = [(1, 16, 38), (2, 9, 12), (3, 7, 7), (4, 5, 6), (5, 5, 5)]
# 對不上章節編號的記錄（GA4 自訂維度不回溯，登記之前的事件回 '(not set)'）。
# 一定要出數：悄悄丟掉會令同事以為圖上就是全部。
CHAPTERS_UNKNOWN = (5, 4)

# 裝置：deviceCategory × operatingSystem 歸類後的結果。「其他」那 1 次是分類報
# mobile 但作業系統報 Macintosh 的怪 UA —— 不可以當成 iPhone，也不可以丟掉。
DEVICES = [
    (b("iPhone／iPad", "iPhone / iPad"), 79),
    (b("Android 手機", "Android phone"), 42),
    (b("桌面電腦", "Desktop computer"), 14),
    (b("其他", "Other"), 1),
]
# 地區。分母用這幾行的總和，不是 GA 的總 session 數 —— GA 逐個維度各自 dedup，
# 加起來會多過總數（這裡 136 對 134），用總數做分母百分比就會加埋超過 100%。
PLACES = [
    (b("香港", "Hong Kong"), 122, True),
    (b("日本", "Japan"), 10, False),
    (b("中國內地", "Mainland China"), 4, False),
]
QR_JOURNEY_START, QR_AUDIO, QR_DOWNLOAD, QR_COMPLETE = 28, 25, 9, 3
PWA_LAUNCH_ALL = 9
LISTENED_PCT = 20.5
LANG_ZH, LANG_EN = 32, 2
DAYS = 11
MONTH = "2026-08"  # DAILY 只寫日子，月份在這裡。將來跨月要改成逐行帶完整日期。

W_ZH = ["日", "一", "二", "三", "四", "五", "六"]
W_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


def mmss(seconds):
    s = r(seconds)
    return f"{s // 60}:{s % 60:02d}"


def pct_of_qr(n):
    return f"{r(n / QR_USERS * 100)}%"


SRC = [
    (b("園區 QR code", "On-site QR code"), None, QR_SESSIONS,
     mmss(QR_SECONDS / QR_SESSIONS), True),
    (b("直接輸入網址", "Direct URL"), b("內部測試", "Internal testing"), INT_SESSIONS,
     mmss(INT_SECONDS / INT_SESSIONS), False),
    (b("其他", "Other"), None, OTHER_SESSIONS, "—", False),
]
SRC_PCT = pcts([x[2] for x in SRC])
DEV_SORTED = sorted(DEVICES, key=lambda d: -d[1])   # 由多到少，同 ga-proxy.php 一樣
DEV_PCT = pcts([n for _, n in DEV_SORTED])
PLACE_PCT = pcts([n for _, n, _ in PLACES])

busiest = max(DAILY, key=lambda row: row[2])  # 唔用 r 做參數名：會遮蓋上面個捨入函數

data = {
    "generated": datetime.datetime.now(HKT).replace(microsecond=0).isoformat(),
    "live": False,
    "range": {
        "start": b("2026 年 8 月 14 日", "14 August 2026"),
        "end":   b("8 月 24 日", "24 August 2026"),
        "days":  DAYS,
        "asOf":  b("8 月 24 日", "24 August 2026"),
        # 快照只有這一段數據，所以 min/max 等於 from/to —— 頁面見到範圍不可選，
        # 就會把日期選擇器關掉並說明原因，而不是讓人揀完發現數字沒有變。
        "from":  f"{MONTH}-14",
        "to":    f"{MONTH}-24",
        "min":   f"{MONTH}-14",
        "max":   f"{MONTH}-24",
        "clamped": False,
    },
    "summary": [
        {"k": b("訪客人數", "Visitors"), "v": str(USERS),
         "n": b("不重複訪客", "Unique visitors")},
        {"k": b("使用次數", "Sessions"), "v": str(SESSIONS),
         "n": b(f"平均每天 {r(SESSIONS / DAYS)} 次", f"About {r(SESSIONS / DAYS)} a day")},
        {"k": b("平均使用時間", "Average time in app"), "v": mmss(ENGAGE_SECONDS / SESSIONS),
         "n": b("分：秒", "min : sec")},
        {"k": b("聽完整條路線", "Completed the route"), "v": str(QR_COMPLETE),
         "n": b("經 QR code 進入的訪客", "Among QR code visitors")},
    ],
    "daily": [
        {"iso": f"{MONTH}-{int(d):02d}", "d": d, "w": b(W_ZH[w], W_EN[w]),
         "engaged": eng, "quick": tot - eng}
        for d, w, tot, eng in DAILY
    ],
    "funnel": [
        {"label": b("掃描 QR code 進入", "Arrived via QR code"), "v": QR_USERS, "pct": "100%"},
        {"label": b("進入導賞路線", "Opened the route"), "v": QR_JOURNEY_START, "pct": pct_of_qr(QR_JOURNEY_START)},
        {"label": b("實際播放音頻", "Played audio"), "v": QR_AUDIO, "pct": pct_of_qr(QR_AUDIO)},
        {"label": b("下載離線收聽", "Downloaded for offline"), "v": QR_DOWNLOAD, "pct": pct_of_qr(QR_DOWNLOAD)},
        {"label": b("完成整條路線", "Completed the route"), "v": QR_COMPLETE, "pct": pct_of_qr(QR_COMPLETE)},
    ],
    "chapters": [
        {"label": b(f"第 {n} 章", f"Ch {n}"), "complete": c, "abandon": a}
        for n, c, a in CHAPTERS
    ],
    "chaptersUnknown": {"complete": CHAPTERS_UNKNOWN[0], "abandon": CHAPTERS_UNKNOWN[1]},
    # 由多到少排，同 ga-proxy.php 一樣（版面第一行會被當成「最多人用的裝置」）
    "devices": [
        {"name": nm, "sessions": n, "pct": f"{p}%"}
        for (nm, n), p in zip(DEV_SORTED, DEV_PCT)
    ],
    "places": [
        {"name": nm, "sessions": n, "pct": f"{p}%", "hi": hi}
        for (nm, n, hi), p in zip(PLACES, PLACE_PCT)
    ],
    "facts": [
        {"v": b(f"{LISTENED_PCT}%", f"{LISTENED_PCT}%"),
         "k": b("中途離開時的平均收聽進度", "Average progress when a chapter is abandoned"),
         "n": b("以 chapter_abandon 事件計", "From chapter_abandon events")},
        {"v": b(f"{QR_DOWNLOAD} 人", str(QR_DOWNLOAD)),
         "k": b("下載音頻離線收聽", "Downloaded audio for offline use"),
         "n": b(f"{pct_of_qr(QR_DOWNLOAD)} QR code 訪客", f"{pct_of_qr(QR_DOWNLOAD)} of QR code visitors")},
        {"v": b(f"{PWA_LAUNCH_ALL} 人", str(PWA_LAUNCH_ALL)),
         "k": b("從主畫面圖示開啟", "Opened from a home-screen icon"),
         "n": b("已把應用程式加到主畫面", "Have added the app to their home screen")},
        {"v": b(f"{LANG_ZH} : {LANG_EN}", f"{LANG_ZH} : {LANG_EN}"),
         "k": b("中文對英文使用者", "Chinese to English users"),
         "n": b("以有播放行為的訪客計", "Among visitors who played audio")},
    ],
    # 分母是這三行的總和，不是 SESSIONS —— GA 逐個維度各自去重，加起來會多過總數。
    "sources": [
        {"name": nm, "tag": tag, "sessions": n, "pct": f"{p}%", "avg": avg, "hi": hi}
        for (nm, tag, n, avg, hi), p in zip(SRC, SRC_PCT)
    ],
    # 文案要用的數字。放在這裡而不是寫死在 HTML —— 數據一更新，寫死的句子就會
    # 跟旁邊的圖表互相矛盾。
    "derived": {
        # 直接讀表格那一行，不另外算一次 —— 分開算的話餘額分配可能差 1%，
        # 文字就會同表格打交。
        "qrShare": f"{SRC_PCT[0]}%",
        "engagedPct": f"{r(ENGAGED / SESSIONS * 100)}%",
        "internalSessions": INT_SESSIONS,
        "internalAvg": mmss(INT_SECONDS / INT_SESSIONS),
        "qrAvg": mmss(QR_SECONDS / QR_SESSIONS),
        "internalMultiple": r((INT_SECONDS / INT_SESSIONS) / (QR_SECONDS / QR_SESSIONS)),
        "busiest": {
            "sessions": busiest[2], "engaged": busiest[3],
            "label": b(f"8 月 {busiest[0]} 日（星期{W_ZH[busiest[1]]}）",
                       f"{busiest[0]} August ({W_EN[busiest[1]]})"),
        },
        "listenedPct": f"{LISTENED_PCT}%",
        "playRatio": r(QR_USERS / QR_AUDIO),
    },
}

json.dump(data, open("data.json", "w"), ensure_ascii=False, indent=1)
print("✅ data.json 已產生 —", data["generated"])
