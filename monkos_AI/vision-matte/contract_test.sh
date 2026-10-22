#!/bin/bash
# matte 계약 테스트 — 4060 matte-server(server.py) 계약 기준. 대상 URL만 바꾸면 4060·vision-matte 양쪽에 같은 요청이 간다.
# 사용: ./contract_test.sh <BASE_URL> <IMAGE> [--secret S] [--bench N] [--save OUT.jpg]
#   --secret  : 대상의 MATTE_SECRET. 주면 양성 요청에 헤더를 싣고, 음성(잘못된 시크릿 → 403)을 검사한다.
#               안 주면 403 검사는 "SKIP"으로 명시 출력한다(무음 통과 금지).
#   --bench N : /api/matte 순차 N회 → meta.elapsedSec·왕복 p50/p90
#   --save    : 양성 결과 JPEG 저장 경로
# 시크릿 값은 출력하지 않는다. 종료 코드: FAIL 1건 이상이면 1.
set -uo pipefail
BASE="${1:?BASE_URL}"; IMG="${2:?IMAGE}"; shift 2
SECRET=""; BENCH=0; SAVE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --secret) SECRET="$2"; shift 2 ;;
    --bench) BENCH="$2"; shift 2 ;;
    --save) SAVE="$2"; shift 2 ;;
    *) echo "❌ contract_test: 알 수 없는 인자 $1"; exit 2 ;;
  esac
done
[ -f "$IMG" ] || { echo "❌ contract_test: 이미지 없음 $IMG"; exit 2; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

AUTH=(); [ -n "$SECRET" ] && AUTH=(-H "X-Matte-Secret: $SECRET")
python3 -c 'import base64,json,sys; print(json.dumps({"image": base64.b64encode(open(sys.argv[1],"rb").read()).decode(), "bgColor": "#FFFFFF"}))' "$IMG" > "$TMP/req.json"
echo '{"image":"!!!not-base64###","bgColor":"#FFFFFF"}' > "$TMP/bad.json"

post() {  # post <path> <body> <out> [헤더…] → HTTP 코드 출력
  local p="$1" b="$2" o="$3"; shift 3
  curl -s -o "$o" -D "$o.h" -w '%{http_code}' -X POST "$BASE$p" -H 'Content-Type: application/json' "$@" --data-binary "@$b"
}

echo "▶ 대상 $BASE · 이미지 $(basename "$IMG")"

echo "[1] GET /health"
code=$(curl -s -o "$TMP/h.json" -w '%{http_code}' "$BASE/health")
st=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("status"))' "$TMP/h.json" 2>/dev/null)
[ "$code" = 200 ] && [ "$st" = ok ] && ok "/health 200 status=ok" || bad "/health code=$code status=$st"
MAXC=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("max_concurrent") or "")' "$TMP/h.json" 2>/dev/null)

check_matte() {  # check_matte <label> <out>
  python3 - "$2" "${SAVE:-}" <<'PY' && ok "$1 {success:true,image,meta.elapsedSec} + JPEG 디코드" || bad "$1 응답 형식"
import base64, json, sys, subprocess, tempfile, os
d = json.load(open(sys.argv[1]))
assert d.get("success") is True, "success"
assert isinstance(d.get("meta", {}).get("elapsedSec"), (int, float)), "meta.elapsedSec"
raw = base64.b64decode(d["image"])
assert raw[:3] == b"\xff\xd8\xff", "JPEG SOI"
p = sys.argv[2] or tempfile.mktemp(suffix=".jpg")
open(p, "wb").write(raw)
out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", p], capture_output=True, text=True).stdout
assert "pixelWidth" in out, "sips decode"
print("    →", " ".join(out.split()[-4:]), f"elapsedSec={d['meta']['elapsedSec']}", (f"saved={p}" if sys.argv[2] else ""))
if not sys.argv[2]: os.remove(p)
PY
}

echo "[2] POST /api/matte (양성)"
code=$(post /api/matte "$TMP/req.json" "$TMP/m.json" "${AUTH[@]+"${AUTH[@]}"}")
[ "$code" = 200 ] && check_matte "/api/matte 200" "$TMP/m.json" || bad "/api/matte code=$code $(head -c 200 "$TMP/m.json")"

echo "[3] POST /matte (별칭)"
SAVE_BAK="$SAVE"; SAVE=""
code=$(post /matte "$TMP/req.json" "$TMP/m2.json" "${AUTH[@]+"${AUTH[@]}"}")
[ "$code" = 200 ] && check_matte "/matte 200" "$TMP/m2.json" || bad "/matte code=$code"
SAVE="$SAVE_BAK"

echo "[4] 음성: 잘못된 시크릿 → 403"
if [ -n "$SECRET" ]; then
  code=$(post /api/matte "$TMP/req.json" "$TMP/s.json" -H "X-Matte-Secret: wrong-$RANDOM")
  [ "$code" = 403 ] && ok "잘못된 시크릿 403" || bad "잘못된 시크릿 code=$code"
  code=$(post /api/matte "$TMP/req.json" "$TMP/s2.json")
  [ "$code" = 403 ] && ok "시크릿 헤더 없음 403" || bad "시크릿 헤더 없음 code=$code"
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "X-Matte-Secret: wrong" "$BASE/health")
  [ "$code" = 200 ] && ok "/health 인증 제외(잘못된 시크릿에도 200)" || bad "/health 인증 제외 code=$code"
else
  echo "  ⏭ SKIP — --secret 미지정(대상이 MATTE_SECRET 없이 기동됐다면 검사 생략이 계약)"
fi

echo "[5] 음성: 잘못된 base64 → 400"
code=$(post /api/matte "$TMP/bad.json" "$TMP/b.json" "${AUTH[@]+"${AUTH[@]}"}")
[ "$code" = 400 ] && ok "잘못된 base64 400" || bad "잘못된 base64 code=$code $(head -c 200 "$TMP/b.json")"

echo "[6] 음성: 동시 MAX_CONCURRENT+1 → 503 ≥1 (Retry-After: 1)"
if [ -z "$MAXC" ]; then
  bad "/health에 max_concurrent 없음 — 동시 요청 수 산정 불가"
else
  N=$((MAXC + 1))
  for i in $(seq 1 "$N"); do
    ( post /api/matte "$TMP/req.json" "$TMP/c$i.json" "${AUTH[@]+"${AUTH[@]}"}" > "$TMP/c$i.code" ) &
  done
  wait
  n200=0; n503=0; ra=0
  for i in $(seq 1 "$N"); do
    c=$(cat "$TMP/c$i.code")
    [ "$c" = 200 ] && n200=$((n200+1))
    if [ "$c" = 503 ]; then n503=$((n503+1)); grep -qi '^retry-after: *1' "$TMP/c$i.json.h" && ra=$((ra+1)); fi
  done
  echo "    → 동시 $N건: 200=$n200 503=$n503 (Retry-After:1 $ra/$n503)"
  [ "$n503" -ge 1 ] && [ "$ra" = "$n503" ] && [ $((n200 + n503)) = "$N" ] && ok "포화 즉시 503" || bad "포화 거절 불일치"
fi

if [ "$BENCH" -gt 0 ]; then
  echo "[7] 벤치 /api/matte 순차 ${BENCH}회"
  : > "$TMP/bench.txt"
  for i in $(seq 1 "$BENCH"); do
    rt=$(curl -s -o "$TMP/bn.json" -w '%{time_total}' -X POST "$BASE/api/matte" -H 'Content-Type: application/json' "${AUTH[@]+"${AUTH[@]}"}" --data-binary "@$TMP/req.json")
    es=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["meta"]["elapsedSec"])' "$TMP/bn.json" 2>/dev/null || echo NA)
    echo "$es $rt" >> "$TMP/bench.txt"
  done
  python3 - "$TMP/bench.txt" <<'PY'
import sys, statistics
rows = [l.split() for l in open(sys.argv[1]) if l.strip()]
def pct(xs, q):
    xs = sorted(xs); k = (len(xs) - 1) * q; f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)
for name, idx in (("엔진 elapsedSec", 0), ("왕복 time_total", 1)):
    xs = [float(r[idx]) for r in rows if r[idx] != "NA"]
    print(f"    {name}: n={len(xs)} p50={pct(xs,.5):.3f}s p90={pct(xs,.9):.3f}s 값={[round(x,3) for x in xs]}")
PY
fi

echo "▶ 결과 PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = 0 ]
