#!/bin/bash
# credits.sh — MONKOS 크레딧/고객 데이터 접근 전용 스크립트
# 법률 제4장 10조 준수. 직접 Firestore 접근 금지 — 반드시 이 스크립트 경유.
#
# 사용법:
#   scripts/credits.sh query <email>                      — 크레딧 조회
#   scripts/credits.sh charge <email> <amount> "<사유>"   — 크레딧 충전
#   scripts/credits.sh deduct <email> <amount> "<사유>"   — 크레딧 차감
#   scripts/credits.sh user <email>                       — 고객 정보 조회
#   scripts/credits.sh log [N]                            — 최근 감사 로그 조회 (기본 10건)
#   scripts/credits.sh signups [일수]                     — 신규 회원가입 집계 (기본 7일, 읽기 전용)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORTAL_DIR="$PROJECT_ROOT/monkos_AI/portal"
AUDIT_DIR="$PROJECT_ROOT/monkos-ops/ops/audit"
AUDIT_FILE="$AUDIT_DIR/CREDIT_AUDIT_LOG.md"

# 감사 로그 파일 초기화
init_audit_log() {
  if [ ! -f "$AUDIT_FILE" ]; then
    mkdir -p "$AUDIT_DIR"
    cat > "$AUDIT_FILE" << 'HEADER'
# 크레딧 감사 로그

> append only. 수정·삭제 금지. credits.sh가 자동 기록.

| 시각 | 디바이스 | 명령 | 대상 | 변경전 | 변경후 | 사유 |
|------|---------|------|------|--------|--------|------|
HEADER
  fi
}

# 현재 디바이스 식별
get_device() {
  local hostname
  hostname=$(hostname -s 2>/dev/null || echo "unknown")
  # 신규 디바이스 추가 시 여기에 case 추가 (M4 MacBook 등)
  case "$hostname" in
    *iMac*|*imac*) echo "iMac" ;;
    *MacBook*|*macbook*) echo "M1" ;;
    *mac-mini*|*Mac-mini*) echo "M2" ;;
    *) echo "$hostname" ;;
  esac
}

# 감사 로그 1행 어펜드
append_audit() {
  local cmd="$1" email="$2" before="$3" after="$4" reason="$5"
  local timestamp device
  timestamp=$(date '+%Y-%m-%d %H:%M KST')
  device=$(get_device)
  init_audit_log
  echo "| $timestamp | $device | $cmd | $email | ${before}c | ${after}c | $reason |" >> "$AUDIT_FILE"
}

# Node.js 실행 래퍼
run_node() {
  cd "$PORTAL_DIR" && node --env-file=.env --input-type=module -e "$1" 2>&1 | grep -v "^\[AUTH\]\|^\[.*INFO\]"
}

# === 명령어 ===

cmd_query() {
  local email="$1"
  local result
  result=$(run_node "
    import { firestore } from './lib/shared/config.js';
    const snap = await firestore.collection('users').get();
    let found = false;
    snap.forEach(d => {
      const data = d.data();
      if ((data.email || '').toLowerCase() === '${email}'.toLowerCase()) {
        console.log(JSON.stringify({ uid: d.id, email: data.email, name: data.name, credits: data.credits ?? 0 }));
        found = true;
      }
    });
    if (!found) console.log(JSON.stringify({ error: '사용자 없음', email: '${email}' }));
    process.exit(0);
  ")
  echo "$result"
}

cmd_charge() {
  local email="$1" amount="$2" reason="${3//\'/\\\'}"

  if [ -z "$reason" ]; then
    echo "❌ 사유 필수. 사용법: credits.sh charge <email> <amount> \"<사유>\""
    exit 1
  fi

  if ! [[ "$amount" =~ ^[0-9]+$ ]] || [ "$amount" -le 0 ]; then
    echo "❌ 금액은 양의 정수여야 합니다."
    exit 1
  fi

  # 현재 크레딧 조회 + 충전
  local result
  result=$(run_node "
    import { firestore } from './lib/shared/config.js';
    const snap = await firestore.collection('users').get();
    let targetDoc = null;
    snap.forEach(d => {
      const data = d.data();
      if ((data.email || '').toLowerCase() === '${email}'.toLowerCase()) {
        targetDoc = { id: d.id, ...data };
      }
    });
    if (!targetDoc) {
      console.log(JSON.stringify({ error: '사용자 없음' }));
      process.exit(0);
    }
    const userRef = firestore.collection('users').doc(targetDoc.id);
    const result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      const current = doc.data()?.credits ?? 0;
      const newCredits = current + ${amount};
      tx.update(userRef, { credits: newCredits });
      return { before: current, after: newCredits, email: targetDoc.email, name: targetDoc.name };
    });
    // Firestore audit 컬렉션에도 기록
    await firestore.collection('audit').add({
      type: 'credit_charge',
      email: targetDoc.email,
      uid: targetDoc.id,
      before: result.before,
      after: result.after,
      amount: ${amount},
      reason: '${reason}',
      device: '$(get_device)',
      timestamp: new Date().toISOString()
    });
    console.log(JSON.stringify(result));
    process.exit(0);
  ")

  # 에러 체크
  if echo "$result" | grep -q '"error"'; then
    echo "❌ $result"
    exit 1
  fi

  local before after
  before=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['before'])" 2>/dev/null || echo "?")
  after=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['after'])" 2>/dev/null || echo "?")

  # 로컬 감사 로그 기록
  append_audit "charge" "$email" "$before" "$after" "$reason"

  echo "✅ 충전 완료: $email ${before}c → ${after}c (+${amount}c)"
  echo "   사유: $reason"
}

cmd_deduct() {
  local email="$1" amount="$2" reason="${3//\'/\\\'}"

  if [ -z "$reason" ]; then
    echo "❌ 사유 필수. 사용법: credits.sh deduct <email> <amount> \"<사유>\""
    exit 1
  fi

  if ! [[ "$amount" =~ ^[0-9]+$ ]] || [ "$amount" -le 0 ]; then
    echo "❌ 금액은 양의 정수여야 합니다."
    exit 1
  fi

  local result
  result=$(run_node "
    import { firestore } from './lib/shared/config.js';
    const snap = await firestore.collection('users').get();
    let targetDoc = null;
    snap.forEach(d => {
      const data = d.data();
      if ((data.email || '').toLowerCase() === '${email}'.toLowerCase()) {
        targetDoc = { id: d.id, ...data };
      }
    });
    if (!targetDoc) {
      console.log(JSON.stringify({ error: '사용자 없음' }));
      process.exit(0);
    }
    const userRef = firestore.collection('users').doc(targetDoc.id);
    const result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      const current = doc.data()?.credits ?? 0;
      if (current < ${amount}) {
        return { error: '크레딧 부족', current: current, required: ${amount} };
      }
      const newCredits = current - ${amount};
      tx.update(userRef, { credits: newCredits });
      return { before: current, after: newCredits, email: targetDoc.email };
    });
    if (!result.error) {
      await firestore.collection('audit').add({
        type: 'credit_deduct',
        email: targetDoc.email,
        uid: targetDoc.id,
        before: result.before,
        after: result.after,
        amount: -${amount},
        reason: '${reason}',
        device: '$(get_device)',
        timestamp: new Date().toISOString()
      });
    }
    console.log(JSON.stringify(result));
    process.exit(0);
  ")

  if echo "$result" | grep -q '"error"'; then
    echo "❌ $result"
    exit 1
  fi

  local before after
  before=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['before'])" 2>/dev/null || echo "?")
  after=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['after'])" 2>/dev/null || echo "?")

  append_audit "deduct" "$email" "$before" "$after" "$reason"

  echo "✅ 차감 완료: $email ${before}c → ${after}c (-${amount}c)"
  echo "   사유: $reason"
}

cmd_user() {
  local email="$1"
  run_node "
    import { firestore } from './lib/shared/config.js';
    const snap = await firestore.collection('users').get();
    let found = false;
    snap.forEach(d => {
      const data = d.data();
      if ((data.email || '').toLowerCase() === '${email}'.toLowerCase()) {
        const safe = {
          email: data.email,
          name: data.name,
          credits: data.credits ?? 0,
          provider: data.provider,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin
        };
        console.log(JSON.stringify(safe, null, 2));
        found = true;
      }
    });
    if (!found) console.log(JSON.stringify({ error: '사용자 없음', email: '${email}' }));
    process.exit(0);
  "
}

cmd_log() {
  local count="${1:-10}"
  if [ ! -f "$AUDIT_FILE" ]; then
    echo "감사 로그 없음"
    exit 0
  fi
  echo "=== 최근 ${count}건 감사 로그 ==="
  tail -n "$count" "$AUDIT_FILE"
}

# 신규 회원가입 집계 (읽기 전용, PII 미노출 — 집계만)
cmd_signups() {
  local days="${1:-7}"
  if ! [[ "$days" =~ ^[0-9]+$ ]] || [ "$days" -le 0 ]; then
    echo "❌ 기간(일)은 양의 정수여야 합니다."
    exit 1
  fi
  run_node "
    import { firestore } from './lib/shared/config.js';
    const DAYS = ${days};
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    const snap = await firestore.collection('users').get();
    let total = 0;
    const byDay = {}, byProvider = {}, bySource = {};
    snap.forEach(d => {
      const data = d.data();
      const raw = data.createdAt;
      if (!raw) return;
      const created = new Date(raw);
      if (isNaN(created) || created < since) return;
      total++;
      const day = created.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      const prov = data.provider || 'unknown';
      byProvider[prov] = (byProvider[prov] || 0) + 1;
      const src = data.signupSource || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    });
    const sortObj = o => Object.fromEntries(Object.entries(o).sort());
    console.log(JSON.stringify({
      period_days: DAYS,
      since: since.toISOString().slice(0, 10),
      total_signups: total,
      by_day: sortObj(byDay),
      by_provider: sortObj(byProvider),
      by_source: sortObj(bySource)
    }, null, 2));
    process.exit(0);
  "
}

# === 메인 ===

if [ $# -lt 1 ]; then
  echo "사용법:"
  echo "  credits.sh query <email>                      — 크레딧 조회"
  echo "  credits.sh charge <email> <amount> \"<사유>\"   — 크레딧 충전"
  echo "  credits.sh deduct <email> <amount> \"<사유>\"   — 크레딧 차감"
  echo "  credits.sh user <email>                       — 고객 정보 조회"
  echo "  credits.sh log [N]                            — 최근 감사 로그 (기본 10건)"
  echo "  credits.sh signups [일수]                     — 신규 회원가입 집계 (기본 7일)"
  exit 1
fi

CMD="$1"
shift

case "$CMD" in
  query)
    [ $# -lt 1 ] && echo "❌ email 필수" && exit 1
    cmd_query "$1"
    ;;
  charge)
    [ $# -lt 3 ] && echo "❌ 사용법: credits.sh charge <email> <amount> \"<사유>\"" && exit 1
    cmd_charge "$1" "$2" "$3"
    ;;
  deduct)
    [ $# -lt 3 ] && echo "❌ 사용법: credits.sh deduct <email> <amount> \"<사유>\"" && exit 1
    cmd_deduct "$1" "$2" "$3"
    ;;
  user)
    [ $# -lt 1 ] && echo "❌ email 필수" && exit 1
    cmd_user "$1"
    ;;
  log)
    cmd_log "${1:-10}"
    ;;
  signups)
    cmd_signups "${1:-7}"
    ;;
  *)
    echo "❌ 알 수 없는 명령: $CMD"
    echo "   사용 가능: query | charge | deduct | user | log | signups"
    exit 1
    ;;
esac
