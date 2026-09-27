#!/bin/bash
# mk-push: monk_project main push
# 삭제 금지 — 쌓기만 하는 구조
# works submodule 스텝 제거 (2026-08-13 채널 폐지 — ORDER_20260813 §4-2)
#
# 2026-09-27 인덱스 경화 (09-26 17:42~02:47 9시간 빈 DB 무음 공백 재발 방지):
#   - 빌드는 타임아웃 아래서 실행 (timeout → gtimeout → perl alarm 폴백). 정지(hang)는 실패로 판정, push는 계속.
#   - 임시 DB에 빌드 → 스모크 PASS → 원자적 mv. 중단된 빌드가 정본 DB를 빈 파일로 바꾸는 일이 없다.
#   - 2단계: [A] BM25 전용(네트워크 불요, ~15s)로 신선한 인덱스 확보 → [B] --embed(네트워크)는 별도 타임아웃. B 실패해도 A 결과는 남는다.
#   - 모든 실패는 🔴 한 줄로 가시화. 무음 강등 금지 (도구 3요건 #3).
#   - 09-27 임베딩 캐시 사이드카(scripts/retrieval/embed_cache.db): [B]가 배치마다 커밋 → 타임아웃돼도 진행분 적립, 회차마다 이어서 완주.
#     [B] 미완 시 [A'] 재실행으로 적립분을 정본에 이월한다 (이전: 임시 DB와 함께 진행분 폐기 → 매번 처음부터, 영구 미완).
#
# 옵션/환경변수:
#   --index-only            push 없이 인덱스 단계만 실행 (검증용)
#   MK_INDEX_TIMEOUT=120    [A] BM25 빌드 타임아웃(초)
#   MK_INDEX_EMBED=1        [B] 임베딩 단계 실행 여부 (0이면 건너뜀 — 건너뜀도 출력)
#   MK_INDEX_EMBED_TIMEOUT=300  [B] 임베딩 빌드 타임아웃(초)

cd "$(git rev-parse --show-toplevel)" || exit 1

INDEX_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --index-only) INDEX_ONLY=1 ;;
  esac
done

RETRIEVAL_DIR="scripts/retrieval"
DB="$RETRIEVAL_DIR/monk_index.db"
INDEX_TIMEOUT="${MK_INDEX_TIMEOUT:-120}"
EMBED_ENABLED="${MK_INDEX_EMBED:-1}"
EMBED_TIMEOUT="${MK_INDEX_EMBED_TIMEOUT:-300}"

# --- 타임아웃 래퍼: exit 124 = 타임아웃 (coreutils 규약) ---
run_with_timeout() {
  local secs="$1"; shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$secs" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout "$secs" "$@"
  else
    perl -e '
      my $t = shift @ARGV;
      my $pid = fork();
      die "fork: $!" unless defined $pid;
      if ($pid == 0) { exec { $ARGV[0] } @ARGV; exit 127; }
      local $SIG{ALRM} = sub {
        kill "TERM", $pid; select(undef, undef, undef, 2); kill "KILL", $pid;
        waitpid($pid, 0); exit 124;
      };
      alarm $t;
      waitpid($pid, 0);
      alarm 0;
      my $st = $?;
      exit(($st & 127) ? 128 + ($st & 127) : ($st >> 8));
    ' "$secs" "$@"
  fi
}

# 임시 산출물 정리 (특정 파일만 — rm -rf 금지)
cleanup_tmp() {
  local base="$1"
  rm -f "$base" "$base-wal" "$base-shm" "$base.building.tmp" "$base.building.tmp-wal" "$base.building.tmp-shm"
}

# 빌드 1회: 임시 DB → 스모크 → 원자적 교체. 인자: 라벨, 타임아웃(초), build_index 추가 플래그...
# 반환: 0 성공 / 2 BM25 정상·임베딩 실패(교체함) / 1 실패(정본 미변경)
build_and_swap() {
  local label="$1" secs="$2"; shift 2
  local tmp="$DB.$$.tmp"
  cleanup_tmp "$tmp"

  echo "--- [$label] 빌드 (타임아웃 ${secs}s) → $tmp"
  run_with_timeout "$secs" node "$RETRIEVAL_DIR/build_index.js" --out "$tmp" "$@"
  local rc=$?

  if [ "$rc" -eq 124 ]; then
    echo "🔴 [$label] 인덱스 빌드 타임아웃(${secs}s) — 정본 DB 미변경. push는 계속"
    cleanup_tmp "$tmp"; return 1
  elif [ "$rc" -ne 0 ] && [ "$rc" -ne 2 ]; then
    echo "🔴 [$label] 인덱스 빌드 실패(exit $rc) — 정본 DB 미변경. push는 계속"
    cleanup_tmp "$tmp"; return 1
  fi
  if [ ! -s "$tmp" ]; then
    echo "🔴 [$label] 빌드 산출물 없음/0바이트 — 정본 DB 미변경. push는 계속"
    cleanup_tmp "$tmp"; return 1
  fi

  if ! MONK_INDEX_DB="$tmp" node "$RETRIEVAL_DIR/search.js" --smoke; then
    echo "🔴 [$label] 스모크 FAIL — 임시 DB 폐기, 정본 DB 미변경. push는 계속"
    cleanup_tmp "$tmp"; return 1
  fi

  if mv -f "$tmp" "$DB"; then
    rm -f "$DB-wal" "$DB-shm"
    if [ "$rc" -eq 2 ]; then
      echo "🟡 [$label] 인덱스 교체 완료 — BM25 정상, 임베딩 실패(부분/0건). 벡터 검색은 다음 회차 재시도"
      return 2
    fi
    echo "✅ [$label] 인덱스 교체 완료 (원자적 mv)"
    return 0
  fi
  echo "🔴 [$label] 정본 교체(mv) 실패 — 정본 DB 미변경. push는 계속"
  cleanup_tmp "$tmp"; return 1
}

echo "=== [1/2] retrieval 인덱스 리빌드 ==="
if ! command -v timeout >/dev/null 2>&1 && ! command -v gtimeout >/dev/null 2>&1; then
  echo "ℹ️ timeout/gtimeout 부재 — perl alarm 폴백 사용"
fi
if [ ! -d "$RETRIEVAL_DIR/node_modules" ]; then
  echo "🔴 $RETRIEVAL_DIR/node_modules 부재 — (cd $RETRIEVAL_DIR && npm install) 필요. 인덱스 단계 건너뜀, push는 계속"
else
  cleanup_tmp "$DB.stale"; rm -f "$DB.building.tmp"   # 직접 실행(build_index.js) 중단 시 남는 스테이징 잔재 제거
  build_and_swap "A·BM25" "$INDEX_TIMEOUT"
  A_RC=$?
  if [ "$EMBED_ENABLED" = "1" ]; then
    build_and_swap "B·임베딩" "$EMBED_TIMEOUT" --embed
    B_RC=$?
    if [ "$B_RC" -eq 1 ]; then
      # [B] 중단돼도 완료 배치는 사이드카 캐시(embed_cache.db)에 적립돼 있다 → [A] 재실행으로 적립분을 정본에 이월 (네트워크 불요)
      echo "ℹ️ [B] 미완 — 적립된 임베딩 캐시를 정본에 이월하기 위해 [A] 재실행. 잔여분은 다음 회차가 이어간다"
      build_and_swap "A'·캐시 이월" "$INDEX_TIMEOUT"
    fi
  else
    echo "⏭️ [B·임베딩] 건너뜀 (MK_INDEX_EMBED=$EMBED_ENABLED) — 벡터 검색 갱신 없음"
  fi
fi
echo ""

if [ "$INDEX_ONLY" -eq 1 ]; then
  echo "=== --index-only: push 생략 ==="
  exit 0
fi

echo "=== [2/2] main push ==="
if git push origin main 2>&1; then
  echo "✅ main push 완료"
else
  echo "❌ main push 실패 — git pull 후 재시도"
  git pull --no-rebase origin main && git push origin main
fi

echo ""
echo "✅ main push 완료"
