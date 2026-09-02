#!/bin/bash
# monkos-portal-edge 배포 — SSG 빌드 → Worker 배포 (ch5 배포 규칙 준용)
set -euo pipefail
EDGE="$(cd "$(dirname "$0")" && pwd)"
PORTAL="$(cd "$EDGE/.." && pwd)"

echo "── 1/2 specs SSG 빌드 ──"
"$PORTAL/tools/specs-ssg/build.sh"

echo "── 2/3 Worker 배포 ──"
cd "$EDGE"
npx wrangler deploy

# ─── 3/3 배포 후 스모크 (2026-08-25 신설 — 도구 맵 3요건: 실작동 검증 + 실패 가시화) ───
# 배포 직후 콜로별 버전 전파 스큐가 있어(08-24 실측) 실패 시 재시도한다.
echo "── 3/3 스모크 검증 ──"
M="https://monkos.ai"
smoke() { # $1=설명 $2=검사식 (재시도 3회, 간격 10s)
  for i in 1 2 3; do
    if eval "$2"; then echo "  ✓ $1"; return 0; fi
    [ "$i" -lt 3 ] && sleep 10
  done
  echo "  ✗ 스모크 실패: $1" >&2; return 1
}
FAIL=0
smoke "specs 정적 200" \
  '[ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 $M/specs/passport/kr)" = "200" ]' || FAIL=1
smoke "CMS 엣지 캐시 헤더" \
  'curl -s -D- -o /dev/null --max-time 15 $M/blog | grep -qi "x-edge-cache"' || FAIL=1
smoke "sid 발급 (정적 경로)" \
  'curl -s -D- -o /dev/null --max-time 15 $M/specs/passport/kr | grep -qi "set-cookie: monkos_sid"' || FAIL=1
smoke "빌드 신선도 (배포 매니페스트 = 로컬 dist)" \
  '[ -f "$EDGE/../tools/specs-ssg/dist/build-manifest.json" ] && curl -s --max-time 15 $M/build-manifest.json | grep -q "$(grep -o "\"gitRev\": *\"[^\"]*\"" "$EDGE/../tools/specs-ssg/dist/build-manifest.json" | head -1 | sed "s/.*: *\"//;s/\"//")"' || FAIL=1
if [ "$FAIL" -ne 0 ]; then
  echo "❌ 스모크 실패 — 배포는 완료됐으나 실서빙 검증 미통과. 즉시 확인 필요 (무음 강등 금지)" >&2
  exit 1
fi

# ─── 콘텐츠 어서션 (G2, 2026-09-01) — edge/smoke_assert.txt 존재 시에만.
# 행 형식: "URL<TAB>+기대문구" 또는 "URL<TAB>-부재문구". 판정은 2회 히트 규칙(live-verify.md) — 1차 버리고 2차로 판정.
ASSERT="$EDGE/smoke_assert.txt"
if [ -f "$ASSERT" ]; then
  echo "── 콘텐츠 어서션 ──"
  AFAIL=0; ALINE=0; ACHECKED=0
  # 마지막 행에 개행이 없어도 처리되도록 `|| [ -n "$RAW" ]`
  while IFS= read -r RAW || [ -n "$RAW" ]; do
    ALINE=$((ALINE + 1))
    case "$RAW" in ''|'#'*) continue ;; esac
    AURL="${RAW%%$'\t'*}"; APAT="${RAW#*$'\t'}"
    # ── 서식 검증 (2026-09-02, ch5 7조 발효 선행 조건 ①) — 서식 오류를 통과로 처리하지 않는다.
    if [ "$APAT" = "$RAW" ] || [ -z "$AURL" ]; then
      echo "  ✗ 서식 오류 [${ALINE}행] 탭 구분자 없음: $RAW" >&2; AFAIL=1; continue
    fi
    SIGN="${APAT:0:1}"; PAT="${APAT:1}"
    if [ "$SIGN" != "+" ] && [ "$SIGN" != "-" ]; then
      echo "  ✗ 서식 오류 [${ALINE}행] 부호가 +/- 가 아님('$SIGN'): $RAW" >&2; AFAIL=1; continue
    fi
    if [ -z "$PAT" ]; then
      echo "  ✗ 서식 오류 [${ALINE}행] 기대 문구 공백: $RAW" >&2; AFAIL=1; continue
    fi
    curl -s -o /dev/null --max-time 15 "$AURL" || true   # 1차: 재검증 트리거 (판정에 쓰지 않는다)
    sleep 1
    BODY="$(curl -s --max-time 15 "$AURL" || true)"      # 2차: 판정
    if [ -z "$BODY" ]; then
      echo "  ✗ 조회 실패 [${ALINE}행] 응답 본문 없음 — 판정 불가: $AURL" >&2; AFAIL=1; continue
    fi
    HIT=$(printf '%s' "$BODY" | grep -cF -- "$PAT" || true)
    ACHECKED=$((ACHECKED + 1))
    if { [ "$SIGN" = "+" ] && [ "$HIT" -gt 0 ]; } || { [ "$SIGN" = "-" ] && [ "$HIT" -eq 0 ]; }; then
      echo "  ✓ [$SIGN] $PAT"
    else
      echo "  ✗ 어서션 실패 [$SIGN|히트 $HIT] $AURL :: $PAT" >&2; AFAIL=1
    fi
  done < "$ASSERT"
  # 파일은 있는데 검사한 행이 0건이면 통과가 아니다 (0건 ≠ 부재).
  if [ "$ACHECKED" -eq 0 ] && [ "$AFAIL" -eq 0 ]; then
    echo "  ✗ 유효 어서션 0건 — 파일은 존재하나 검사된 행이 없다. 서식: URL<TAB>+기대문구" >&2; AFAIL=1
  fi
  if [ "$AFAIL" -ne 0 ]; then
    echo "❌ 콘텐츠 어서션 미통과 — 변경 의도가 라이브에 반영되지 않았거나 어서션 서식이 잘못됐다" >&2
    exit 1
  fi
  echo "  ✅ 콘텐츠 어서션 ${ACHECKED}/${ACHECKED} 통과"
else
  echo "⚠ 콘텐츠 어서션 스킵(파일 부재) — 내용 검증 미실시. 서식: URL<TAB>+기대문구 → $ASSERT" >&2
fi

# ─── 드리프트 해시 기록 (G1) — 실패해도 배포 성공은 유지 (기록만 경고)
"$PORTAL/../../scripts/tools/specs_drift.sh" --record || echo "⚠️ 드리프트 해시 기록 실패 (배포는 정상)" >&2
echo "✅ monkos-portal-edge 배포 + 스모크 4/4 완료"
