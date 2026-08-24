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
import json, datetime
from decimal import Decimal, ROUND_HALF_UP


def r(x):
    """四捨五入（half away from zero）。

    ⚠️ 不要用內建 round()：Python 用的是銀行家捨入，round(12.5) == 12，
    而 ga-proxy.php 的 PHP round() 會得出 13。同一組數字經兩邊產生會顯示不同
    百分比，同事看到的數字就會取決於當下是 proxy 還是快照在供數。
    """
    return int(Decimal(str(x)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))

HKT = datetime.timezone(datetime.timedelta(hours=8))


def b(zh, en):
    return {"zh": zh, "en": en}


# ── 由 GA 讀回來的原始數字（2026-08-14 至 08-23）────────────────────────────
USERS, SESSIONS, ENGAGED = 99, 120, 74
ENGAGE_SECONDS = 17617
QR_SESSIONS, QR_USERS, QR_SECONDS = 102, 84, 9543
INT_SESSIONS, INT_SECONDS = 15, 7478
OTHER_SESSIONS = 3

DAILY = [  # (日, 星期索引 0=日, 總次數, 有實際使用)
    ("14", 5, 17, 13), ("15", 6, 11, 5),  ("16", 0, 10, 5),
    ("17", 1, 17, 12), ("18", 2, 9, 7),   ("19", 3, 8, 4),
    ("20", 4, 10, 4),  ("21", 5, 5, 3),   ("22", 6, 7, 3),
    ("23", 0, 26, 18),
]
CHAPTERS = [(1, 15, 34), (2, 9, 12), (3, 6, 6), (4, 5, 6), (5, 5, 5)]
QR_JOURNEY_START, QR_AUDIO, QR_DOWNLOAD, QR_COMPLETE = 27, 23, 8, 3
PWA_LAUNCH_ALL = 8
LISTENED_PCT = 21.9
LANG_ZH, LANG_EN = 43, 2
DAYS = 10

W_ZH = ["日", "一", "二", "三", "四", "五", "六"]
W_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


def mmss(seconds):
    s = r(seconds)
    return f"{s // 60}:{s % 60:02d}"


def pct_of_qr(n):
    return f"{r(n / QR_USERS * 100)}%"


busiest = max(DAILY, key=lambda row: row[2])  # 唔用 r 做參數名：會遮蓋上面個捨入函數

data = {
    "generated": datetime.datetime.now(HKT).replace(microsecond=0).isoformat(),
    "live": False,
    "range": {
        "start": b("2026 年 8 月 14 日", "14 August 2026"),
        "end":   b("8 月 23 日", "23 August 2026"),
        "days":  DAYS,
        "asOf":  b("8 月 23 日", "23 August 2026"),
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
        {"d": d, "w": b(W_ZH[w], W_EN[w]), "engaged": eng, "quick": tot - eng}
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
    "sources": [
        {"name": b("園區 QR code", "On-site QR code"), "tag": None, "sessions": QR_SESSIONS,
         "pct": f"{r(QR_SESSIONS / SESSIONS * 100)}%", "avg": mmss(QR_SECONDS / QR_SESSIONS), "hi": True},
        {"name": b("直接輸入網址", "Direct URL"), "tag": b("內部測試", "Internal testing"),
         "sessions": INT_SESSIONS, "pct": f"{r(INT_SESSIONS / SESSIONS * 100)}%",
         "avg": mmss(INT_SECONDS / INT_SESSIONS), "hi": False},
        {"name": b("其他", "Other"), "tag": None, "sessions": OTHER_SESSIONS,
         "pct": f"{r(OTHER_SESSIONS / SESSIONS * 100)}%", "avg": "—", "hi": False},
    ],
    # 文案要用的數字。放在這裡而不是寫死在 HTML —— 數據一更新，寫死的句子就會
    # 跟旁邊的圖表互相矛盾。
    "derived": {
        "qrShare": f"{r(QR_SESSIONS / SESSIONS * 100)}%",
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
