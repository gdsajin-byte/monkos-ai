#!/bin/bash
# run_collect.sh — iMac에서 실행하는 맥북 셀렉 기록기 1회 회수(증분·재실행 안전).
#   1) 맥북 메타 수집(collect_mac.sh meta, ssh)
#   2) 축소본 없는 컷만 목록화(build_manifest.py todo)
#   3) 배치별 512px JPEG 생성·전송(collect_mac.sh thumbs → tar 스트림)
#   4) 매니페스트 병합 쓰기 + 검증 리포트(build_manifest.py build)
#
# 사용: AI_Factory/select_recorder/run_collect.sh [--dry-run] [--limit N]
# 환경변수(기본값): SELREC_HOST=mac@100.92.201.83
#                  SELREC_DEST=/Volumes/작업백업/_select_dataset
#                  SELREC_INTAKE=/Volumes/촬영접수/2026년_작업
#                  SELREC_BATCH=40
# 실패 가시화: 전 단계 실패 시 "❌ run_collect:" + exit≠0. 축소본 실패 목록은 리포트·stderr에.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
HOST="${SELREC_HOST:-mac@100.92.201.83}"
DEST="${SELREC_DEST:-/Volumes/작업백업/_select_dataset}"
INTAKE="${SELREC_INTAKE:-/Volumes/촬영접수/2026년_작업}"
BATCH="${SELREC_BATCH:-40}"
DRY=0; LIMIT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --limit) LIMIT="$2"; shift ;;
    *) echo "❌ run_collect: 알 수 없는 인자 $1" >&2; exit 2 ;;
  esac
  shift
done
die() { echo "❌ run_collect: $*" >&2; exit 1; }

[ -d "$(dirname "$DEST")" ] || die "작업백업 마운트 없음: $(dirname "$DEST")"
[ -d "$INTAKE" ] || die "촬영접수 마운트 없음: $INTAKE"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/selrec_run.XXXXXX")
cleanup() { find "$WORK" -mindepth 1 -delete 2>/dev/null; rmdir "$WORK" 2>/dev/null || true; }
trap cleanup EXIT
mkdir -p "$WORK/thumbs"
T0=$(date +%s)

echo "▶ 메타 수집 ($HOST)"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "bash -s -- meta" < "$HERE/collect_mac.sh" > "$WORK/meta.tsv" \
  || die "맥북 메타 수집 실패"
N=$(($(wc -l < "$WORK/meta.tsv") - 1))
[ "$N" -gt 0 ] || die "메타 0행 — 촬영본 경로·접속 확인"
echo "  컷 $N"

python3 -I "$HERE/build_manifest.py" todo --meta "$WORK/meta.tsv" --dest "$DEST" > "$WORK/todo.txt" \
  || die "todo 산출 실패"
if [ "$LIMIT" -gt 0 ]; then head -n "$LIMIT" "$WORK/todo.txt" > "$WORK/todo2.txt"; mv "$WORK/todo2.txt" "$WORK/todo.txt"; fi
TODO=$(grep -c . "$WORK/todo.txt" || true)
echo "▶ 신규 축소본 대상 $TODO 컷 (배치 $BATCH)"

FAILS=0
if [ "$TODO" -gt 0 ]; then
  split -l "$BATCH" "$WORK/todo.txt" "$WORK/batch."
  for b in "$WORK"/batch.*; do
    B64=$(base64 < "$b" | tr -d '\n')
    if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "bash -s -- thumbs $B64" < "$HERE/collect_mac.sh" 2>"$b.err" \
        | tar -C "$WORK/thumbs" -xf -; then
      echo "⚠️ 배치 실패: $(basename "$b")" >&2
    fi
    f=$(grep -c '^FAIL' "$b.err" || true); FAILS=$((FAILS + f))
    grep '^FAIL' "$b.err" >&2 || true
    grep -q '^DONE' "$b.err" || { echo "⚠️ 배치 완료 신호 없음: $(basename "$b")" >&2; cat "$b.err" >&2; FAILS=$((FAILS + 1)); }
    printf '  %s/%s\n' "$(find "$WORK/thumbs" -name '*.jpg' | wc -l | tr -d ' ')" "$TODO"
  done
fi
GOT=$(find "$WORK/thumbs" -name '*.jpg' | wc -l | tr -d ' ')
BYTES=$(find "$WORK/thumbs" -name '*.jpg' -exec stat -f %z {} + 2>/dev/null | awk '{s+=$1} END{print s+0}')

ARGS=(build --meta "$WORK/meta.tsv" --dest "$DEST" --intake "$INTAKE" --thumbs "$WORK/thumbs" --report "$WORK/report.json")
[ "$DRY" = 1 ] && ARGS+=(--dry-run)
python3 -I "$HERE/build_manifest.py" "${ARGS[@]}" > /dev/null || die "매니페스트 빌드 실패"
if [ "$DRY" = 0 ]; then
  mkdir -p "$DEST/_runs"
  cp "$WORK/report.json" "$DEST/_runs/report_$(date +%Y%m%d_%H%M%S).json"
fi
cp "$WORK/report.json" "${SELREC_REPORT_OUT:-/dev/null}" 2>/dev/null || true
T1=$(date +%s)
echo "✔ 완료: 메타 $N · 신규 축소본 $GOT/$TODO (${BYTES}B) · 실패 $FAILS · $((T1 - T0))s"
[ "$FAILS" -eq 0 ] || exit 3
