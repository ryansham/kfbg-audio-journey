#!/bin/bash
# 由外面、不帶密碼，檢查秘密連結 folder 開放的只有該開放的東西。
#
#   analytics/test-live.sh                         # 打 live（https://comm.kfbg.org）
#   analytics/test-live.sh http://127.0.0.1:8830   # 打本機 Apache 模擬環境
#
# 上載任何檔案、改過 .htaccess、或者父層 .htaccess 有人動過之後，都跑一次。
# 這個 folder 不在 hub verify.sh 的 TOOL_PATHS 裡（V8 要求每個工具都問密碼，
# 這裡刻意不問），所以 verify.sh 的 V4–V7 不會替它檢查憑證 —— 這個 script 就是
# 唯一的檢查。
#
# 全部通過 exit 0，任何一項失敗 exit 1。

BASE=${1:-https://comm.kfbg.org}
# 🔴 folder 名不可以寫在這裡：這個 repo 是公開的，而秘密連結唯一的保護就是網址沒人知道。
#    它放在 gitignored 的 analytics/.secret-folder（一行，例如 /analytics-and-dashboards/xxx），
#    權威記錄在 kfbg-comm-hub（private）的 README「刻意喺閘外」那段。
SECRET="$(dirname "$0")/.secret-folder"
F=$( { tr -d '[:space:]' < "$SECRET"; } 2>/dev/null )   # 大括號：讀檔失敗的錯誤由 shell 發出，不是 tr
if [[ $F != /analytics-and-dashboards/* ]]; then
  echo "❌ 讀不到 $SECRET —— 從 kfbg-comm-hub README 抄 folder 路徑進去（一行）。" >&2; exit 2
fi
pass=0; fail=0
body=$(mktemp)

row() { # <path> <可接受的狀態碼，空格分隔> <說明>
  local hdr code auth
  hdr=$(curl -s -D - -o "$body" --max-time 20 "$BASE$1")
  code=$(printf '%s' "$hdr" | head -1 | awk '{print $2}')
  auth=$(printf '%s' "$hdr" | grep -ci '^WWW-Authenticate')
  if [[ " $2 " == *" $code "* ]]; then pass=$((pass + 1)); m="✅"; else fail=$((fail + 1)); m="❌"; fi
  printf '%s %-44s %s (want %s)%s\n' "$m" "$3" "${code:-—}" "$2" "$([ "$auth" -gt 0 ] && echo '  [asks password]')"
  # 該擋的檔案回了 200，就把開頭印出來：一眼看得出漏了甚麼
  # iconv -c：head -c 會在中文字中間切斷，壞掉的 UTF-8 令 macOS grep 把整份輸出當成 binary。
  if [[ $m == "❌" && $code == "200" ]]; then echo "     ↳ 漏出內容：$(head -c 100 "$body" | iconv -c -f UTF-8 -t UTF-8 2>/dev/null | tr '\n' ' ')"; fi
}

echo "── 其他地方仍然要密碼"
row "/"                                                  "401"     "hub 首頁"
row "/analytics-and-dashboards/"                         "401"     "分區頁"
row "/analytics-and-dashboards/audio-journey-analytics/" "401"     "舊 folder 名（改名後應該已經冇）"
row "$F/../"                                             "401"     "../ 繞出 folder"

echo "── 秘密 folder 開放的部分"
row "$F/"              "200" "睇板頁（不問密碼）"
row "$F/ga-proxy.php"  "200" "ga-proxy.php（頁面要即時取數）"
row "$F/data.json"     "200" "data.json（proxy 失敗時的後備）"

echo "── 🔴 憑證：一定不可以是 200"
row "$F/config.php"                 "403"     "config.php（金鑰路徑）"
row "$F/cache/token.json"           "403 404" "cache/token.json（生效中 GA token）"
row "$F/audio-journey-ga4.key.json" "403 404" "誤放 folder 內的 key json"
row "$F/.htaccess"                  "403"     ".htaccess"
# key 本身放在 public_html 外面，網址到不了。這條防的是有人日後把它搬進 docroot。
row "$F/../../ga-credentials/audio-journey-ga4.key.json" "401 403 404" "../../ 去 key 所在位置"

echo "── 開發檔：沒上載是 404，上載了但被擋是 403，兩個都可以"
row "$F/README.md"      "403 404" "README.md"
row "$F/build_data.py"  "403 404" "build_data.py"
row "$F/check.py"       "403 404" "check.py"
row "$F/test-proxy.php" "403 404" "test-proxy.php"
row "$F/test-live.sh"   "403 404" "test-live.sh（本檔）"
row "$F/cache/"         "403 404" "cache/ 不可以列出目錄"

echo "── header"
robots=$(curl -s -I --max-time 20 "$BASE$F/" | grep -ci '^X-Robots-Tag:.*noindex')
if [ "$robots" -gt 0 ]; then pass=$((pass + 1)); echo "✅ X-Robots-Tag noindex"; else fail=$((fail + 1)); echo "❌ 冇 X-Robots-Tag noindex —— 條連結有機會被搜尋器收錄"; fi

# 本機模擬環境沒有 https，這一項只對 live 有意義。
if [[ $BASE == https://* ]]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "${BASE/https:/http:}$F/")
  if [[ $code == 301 || $code == 302 ]]; then pass=$((pass + 1)); echo "✅ http:// 轉走，不直接出頁              $code"
  else fail=$((fail + 1)); echo "❌ http:// 回 $code（應該 301／302）"; fi
fi

rm -f "$body"
echo "── 通過 $pass／失敗 $fail"
[ "$fail" -eq 0 ]
