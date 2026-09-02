#!/bin/bash
# specs_drift.sh — specs 소스 ↔ 엣지 배포본 드리프트 감지 (G1, 2026-09-01 민아)
# 용법: specs_drift.sh            현황 판정 (드리프트 시 exit 1 + 경고)
#       specs_drift.sh --record   배포 직후 현행 소스 해시 기록 (edge/deploy.sh가 호출)
#       specs_drift.sh --hook     pre-push용 — 경고만 하고 항상 exit 0 (푸시 비차단)
#       specs_drift.sh --install-hook  .git/hooks/pre-push 설치
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
PORTAL="$ROOT/monkos_AI/portal"
HASH_FILE="$PORTAL/edge/.specs-deploy-hash"

# ── 해싱 대상: git 추적 파일만 (ch5 6조 게이트 3 "gitignore 산출물 제외", 7조 발효 선행 조건 ③)
# 2026-09-02 보정: 종전 find 방식은 gitignore된 `tools/specs-ssg/dist/` 빌드 산출물 7건을 함께 해싱했다.
# 해시 기록 파일(.specs-deploy-hash)은 커밋되지만 dist/는 커밋되지 않으므로, SSG 빌드 이력이 없는
# 디바이스(M1·M2·웹·신규 클론)에서는 항상 해시가 어긋나 상시 오탐이 났다. 게다가 build-manifest.json의
# builtAt(ms)·assetVer는 소스가 바이트 동일해도 재빌드만 하면 바뀐다. → 추적 소스만 해싱한다.
# 경로는 레포 상대이므로 디바이스 간 이식성이 있다.
SPECS_PATHS="monkos_AI/portal/lib/cms/specs-data.json monkos_AI/portal/lib/cms/specs-i18n.js monkos_AI/portal/lib/cms/render-specs.js monkos_AI/portal/lib/cms/components monkos_AI/portal/tools/specs-ssg"
MIN_FILES=5   # 경로 지정이 깨지면 목록이 0~2건으로 쪼그라든다. 그때 '변경 없음'으로 통과시키지 않는다.

calc() {
  local list count
  list="$(cd "$ROOT" && git ls-files -- $SPECS_PATHS | grep -E '\.(js|mjs|json)$' | LC_ALL=C sort)"
  count="$(printf '%s' "$list" | grep -c . || true)"
  if [ "$count" -lt "$MIN_FILES" ]; then
    echo "❌ [specs_drift] 해싱 대상 ${count}건 (최소 ${MIN_FILES}건 기대) — 경로 지정이 깨졌거나 레포 밖에서 실행됐다." >&2
    echo "   0건·소수는 '변경 없음'이 아니다. SPECS_PATHS를 확인하라: $SPECS_PATHS" >&2
    return 1
  fi
  # "해시  경로" 쌍을 해싱한다 — 경로를 포함해야 파일 이름 변경도 드리프트로 잡힌다.
  (cd "$ROOT" && printf '%s\n' "$list" | tr '\n' '\0' | xargs -0 shasum) \
    | LC_ALL=C sort | shasum | awk '{print $1}'
}
case "${1:-}" in
  --record)
    calc > "$HASH_FILE"; echo "✓ specs 배포 해시 기록: $(cat "$HASH_FILE" | head -c 12)…" ;;
  --install-hook)
    HOOK="$ROOT/.git/hooks/pre-push"
    grep -q specs_drift "$HOOK" 2>/dev/null || { echo -e "#!/bin/bash\n\"\$(git rev-parse --show-toplevel)/scripts/tools/specs_drift.sh\" --hook" >> "$HOOK"; chmod +x "$HOOK"; }
    echo "✓ pre-push 훅 설치 완료 (경고 전용·비차단)" ;;
  --hook|"")
    if [ ! -f "$HASH_FILE" ]; then echo "⚠️  [specs_drift] 배포 해시 기록 없음 — 최초 배포 후 --record 필요" >&2; [ "${1:-}" = "--hook" ] && exit 0 || exit 1; fi
    CUR="$(calc)"; REC="$(cat "$HASH_FILE")"
    if [ "$CUR" = "$REC" ]; then echo "✓ [specs_drift] 엣지 배포본 = 현행 소스 (드리프트 없음)"
    else
      echo "⚠️  [specs_drift] 무음 구본 경보 — specs 소스가 마지막 엣지 배포 이후 변경됨. 'monkos_AI/portal/edge/deploy.sh' 재배포 필요" >&2
      [ "${1:-}" = "--hook" ] && exit 0 || exit 1
    fi ;;
  *) echo "용법: specs_drift.sh [--record|--hook|--install-hook]"; exit 2 ;;
esac
