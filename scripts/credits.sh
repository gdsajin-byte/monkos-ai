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
#   scripts/credits.sh delete <email> "<사유>" [--confirm] — 회원 탈퇴 처리 (기본 dry-run)

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
# before/after가 "-"이면 크레딧 단위(c)를 붙이지 않는다 (delete 등 크레딧 무관 명령).
append_audit() {
  local cmd="$1" email="$2" before="$3" after="$4" reason="$5"
  local timestamp device before_disp after_disp
  timestamp=$(date '+%Y-%m-%d %H:%M KST')
  device=$(get_device)
  [ "$before" = "-" ] && before_disp="-" || before_disp="${before}c"
  [ "$after" = "-" ] && after_disp="-" || after_disp="${after}c"
  init_audit_log
  echo "| $timestamp | $device | $cmd | $email | $before_disp | $after_disp | $reason |" >> "$AUDIT_FILE"
}

# 이메일 마스킹 (감사 기록용 — 파기 이행 후 원본 식별자 잔존 방지)
mask_email() {
  local e="$1" lp dom
  case "$e" in
    *@*) lp="${e%%@*}"; dom="${e#*@}" ;;
    *) echo "***"; return ;;
  esac
  if [ ${#lp} -le 2 ]; then
    echo "${lp:0:1}***@${dom}"
  else
    echo "${lp:0:1}***${lp: -1}@${dom}"
  fi
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

# === 회원 탈퇴 처리 (개인정보처리방침 "회원 탈퇴 시 즉시 파기" 집행 경로) ===
#
# dry-run이 기본값. --confirm 없이는 어떤 쓰기도 발생하지 않는다.
# 보존 대상(payments / transactions / audit)은 방침이 이미 예외 고지한 항목 — 삭제하지 않는다.

# 대상 스캔/삭제 공용 Node 실행부. $1=email, $2=사유, $3=mode(scan|delete)
_delete_run_node() {
  local email="$1" reason="$2" mode="$3"
  run_node "
    import { firestore, CUSTOMER_GCS_BUCKET } from './lib/shared/config.js';
    import { Storage } from '@google-cloud/storage';

    const EMAIL = '${email}';
    const REASON = '${reason}';
    const DEVICE = '$(get_device)';
    const MODE = '${mode}';

    const mask = (e) => {
      const at = e.indexOf('@');
      if (at < 1) return '***';
      const lp = e.slice(0, at), dom = e.slice(at);
      return lp.length <= 2 ? lp[0] + '***' + dom : lp[0] + '***' + lp[lp.length - 1] + dom;
    };

    // 1) email → uid 확정 (기존 명령들과 동일하게 users 스캔)
    const usersSnap = await firestore.collection('users').get();
    let target = null;
    usersSnap.forEach(d => {
      const data = d.data();
      if ((data.email || '').toLowerCase() === EMAIL.toLowerCase()) target = Object.assign({ id: d.id }, data);
    });
    if (!target) {
      console.log(JSON.stringify({ error: '사용자 없음', email: EMAIL }));
      process.exit(0);
    }
    const uid = target.id;

    const out = { mode: MODE, uid, email_masked: mask(target.email || EMAIL), name: target.name || null,
                  credits: target.credits ?? 0, failures: [] };

    const idsOf = async (col, field) => {
      const s = await firestore.collection(col).where(field, '==', uid).get();
      return s.docs.map(d => d.id);
    };

    // 2) 삭제 대상 수집
    const genIds = await idsOf('generations', 'userId');
    const ticketIds = await idsOf('cs_tickets', 'userId');

    const linkSnap = await firestore.collection('telegram_links').where('userId', '==', uid).get();
    const linkIds = linkSnap.docs.map(d => d.id);
    const chatIds = new Set();
    linkSnap.forEach(d => {
      chatIds.add(String(d.id));
      const c = d.data().chatId;
      if (c !== undefined && c !== null) chatIds.add(String(c));
    });
    // cs_conversations는 userId 필드가 없다 (doc id = tg_{chatId}) → telegram_links 경유로 역참조
    const convIds = [];
    for (const c of chatIds) {
      const id = 'tg_' + c;
      const doc = await firestore.collection('cs_conversations').doc(id).get();
      if (doc.exists) convIds.push(id);
    }

    // GCS: 문서에 기록된 경로 + 서비스 프리픽스 실측 열거 후 uid 폴더 스캔(문서 누락분 커버)
    const bucket = new Storage().bucket(CUSTOMER_GCS_BUCKET);
    const gcsPaths = new Set();
    const genSnap = await firestore.collection('generations').where('userId', '==', uid).get();
    genSnap.forEach(d => {
      const g = d.data();
      for (const k of ['gcsOriginal', 'gcsGenerated', 'gcsT1Raw']) if (g[k]) gcsPaths.add(g[k]);
    });
    let servicePrefixes = [];
    try {
      const resp = await bucket.getFiles({ delimiter: '/', maxResults: 1000, autoPaginate: false });
      servicePrefixes = (resp[2] && resp[2].prefixes) || [];
      for (const sp of servicePrefixes) {
        const listed = await bucket.getFiles({ prefix: sp + uid + '/' });
        listed[0].forEach(f => gcsPaths.add(f.name));
      }
    } catch (e) {
      out.failures.push('gcs-list: ' + e.message);
    }
    const paths = Array.from(gcsPaths).sort();

    // telegramGateCodes — userId 보유 = 사용자 식별 가능. 법정 보존 근거 없음 → 삭제 대상
    // (2026-08-13 쌍아 판정: 지시서 미지정 → 삭제 대상 편입)
    const gateIds = await idsOf('telegramGateCodes', 'userId');

    // 3) 보존 현황 (읽기 전용 — 삭제하지 않음)
    const payIds = await idsOf('payments', 'userId');
    const txIds = await idsOf('transactions', 'userId');

    out.targets = { users: 1, generations: genIds.length, telegram_links: linkIds.length,
                    telegramGateCodes: gateIds.length, cs_tickets: ticketIds.length,
                    cs_conversations: convIds.length, gcs_objects: paths.length };
    out.gcs_bucket = CUSTOMER_GCS_BUCKET;
    out.gcs_service_prefixes = servicePrefixes;
    out.gcs_paths = paths;
    out.preserved = { payments: payIds.length, transactions: txIds.length, audit: 'append-only' };
    out.excluded = { free_quota: 'doc id = {date}_sha256(ip|sid)[0:24] — uid 무관 익명 해시. 대조 불가, PII 미포함' };

    if (MODE !== 'delete') {
      console.log(JSON.stringify(out, null, 2));
      process.exit(0);
    }

    // 4) 삭제 실행 — 부분 실패해도 중단하지 않고 실패 항목을 수집
    const delDocs = async (col, ids) => {
      let ok = 0;
      for (let i = 0; i < ids.length; i += 400) {
        const chunk = ids.slice(i, i + 400);
        const batch = firestore.batch();
        chunk.forEach(id => batch.delete(firestore.collection(col).doc(id)));
        try { await batch.commit(); ok += chunk.length; }
        catch (e) { out.failures.push(col + ': ' + e.message); }
      }
      return ok;
    };

    let gcsOk = 0;
    for (const p of paths) {
      try { await bucket.file(p).delete({ ignoreNotFound: true }); gcsOk++; }
      catch (e) { out.failures.push('gcs:' + p + ' — ' + e.message); }
    }

    const deleted = {
      gcs_objects: gcsOk,
      generations: await delDocs('generations', genIds),
      cs_conversations: await delDocs('cs_conversations', convIds),
      cs_tickets: await delDocs('cs_tickets', ticketIds),
      telegram_links: await delDocs('telegram_links', linkIds),
      telegramGateCodes: await delDocs('telegramGateCodes', gateIds),
      users: await delDocs('users', [uid]),
    };
    out.deleted = deleted;

    // 5) Firestore 감사 기록 (이메일 마스킹 — uid는 내부 식별자로 원본 유지)
    try {
      await firestore.collection('audit').add({
        type: 'account_delete',
        email: out.email_masked,
        uid,
        creditsAtDeletion: out.credits,
        deleted,
        preserved: { payments: payIds.length, transactions: txIds.length },
        failures: out.failures,
        reason: REASON,
        device: DEVICE,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      out.failures.push('audit-write: ' + e.message);
    }

    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  "
}

# 스캔 결과 JSON → 사람이 읽는 요약
_delete_print_summary() {
  python3 - "$1" << 'PYEOF'
import json, sys
d = json.loads(sys.argv[1])
t = d['targets']
print("─" * 60)
print(f"대상 uid   : {d['uid']}")
print(f"이메일     : {d['email_masked']} (마스킹)")
print(f"이름       : {d.get('name') or '-'}")
print(f"잔여 크레딧: {d['credits']}c")
print("─" * 60)
print("■ 삭제 대상")
labels = {'users': 'users (PII 정본)', 'generations': 'generations', 'telegram_links': 'telegram_links',
          'telegramGateCodes': 'telegramGateCodes', 'cs_tickets': 'cs_tickets',
          'cs_conversations': 'cs_conversations',
          'gcs_objects': f"GCS 객체 [{d['gcs_bucket']}]"}
for k, v in t.items():
    print(f"  - {labels.get(k, k):<34} {v}건")
if d['gcs_paths']:
    print("    경로:")
    for p in d['gcs_paths']:
        print(f"      · {p}")
print(f"  (스캔한 서비스 프리픽스: {', '.join(d['gcs_service_prefixes']) or '없음'})")
print("■ 보존 대상 (방침 고지 예외 — 삭제 안 함)")
print(f"  - payments                           {d['preserved']['payments']}건")
print(f"  - transactions                       {d['preserved']['transactions']}건")
print(f"  - audit                              append-only")
print("■ 제외")
print(f"  - free_quota: {d['excluded']['free_quota']}")
if d['failures']:
    print("■ ⚠️ 스캔 중 실패")
    for f in d['failures']:
        print(f"  - {f}")
print("─" * 60)
PYEOF
}

cmd_delete() {
  local email="$1" reason_raw="$2" flag="${3:-}"
  local reason="${reason_raw//\'/\\\'}"

  if [ -z "$reason_raw" ]; then
    echo "❌ 사유 필수. 사용법: credits.sh delete <email> \"<사유>\" [--confirm]"
    exit 1
  fi

  local confirm="no"
  if [ "$flag" = "--confirm" ]; then
    confirm="yes"
  elif [ -n "$flag" ]; then
    echo "❌ 알 수 없는 옵션: $flag (사용 가능: --confirm)"
    exit 1
  fi

  # 1단계: 스캔 (쓰기 없음)
  local scan
  scan=$(_delete_run_node "$email" "$reason" "scan")

  if echo "$scan" | grep -q '"error"'; then
    echo "$scan"
    exit 0
  fi

  if [ "$confirm" = "no" ]; then
    echo "🔍 [DRY-RUN] 실제 삭제는 발생하지 않았습니다. 아래는 삭제 예정 대상입니다."
    echo "   사유: $reason_raw"
    _delete_print_summary "$scan"
    echo "   실제 삭제: 위 내용을 확인한 뒤 동일 명령에 --confirm 을 붙여 실행하십시오."
    echo "   ⚠️ 고객 데이터 삭제는 비가역이며 ch4 10조 4항상 작가님 승인이 필요합니다."
    return 0
  fi

  # 2단계: 삭제 직전 대상 요약 출력 (무음 삭제 금지)
  echo "⚠️ [DELETE] 아래 대상을 삭제합니다."
  echo "   사유: $reason_raw"
  _delete_print_summary "$scan"

  local result
  result=$(_delete_run_node "$email" "$reason" "delete")

  local uid credits masked
  uid=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['uid'])" 2>/dev/null || echo "?")
  credits=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['credits'])" 2>/dev/null || echo "?")
  masked=$(mask_email "$email")

  echo "$result" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('■ 삭제 결과')
for k, v in d.get('deleted', {}).items():
    print(f'  - {k:<20} {v}건 삭제')
" 2>/dev/null || echo "$result"

  # 로컬 감사 로그 (변경전 = 삭제 시점 잔여 크레딧, 변경후 = -)
  append_audit "delete" "$masked" "$credits" "-" "$reason_raw (uid=$uid)"

  local fail_count
  fail_count=$(echo "$result" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('failures', [])))" 2>/dev/null || echo "1")

  if [ "$fail_count" != "0" ]; then
    echo "❌ 실패 항목 ${fail_count}건 — 무음 강등 금지, 아래 전문 확인 요망:"
    echo "$result" | python3 -c "
import sys, json
for f in json.load(sys.stdin).get('failures', []):
    print(f'   · {f}')
" 2>/dev/null || echo "$result"
    exit 2
  fi

  echo "✅ 탈퇴 처리 완료: $masked (uid=$uid)"
  echo "   사유: $reason_raw"
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
  echo "  credits.sh delete <email> \"<사유>\" [--confirm] — 회원 탈퇴 처리 (기본 dry-run)"
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
  delete)
    [ $# -lt 2 ] && echo "❌ 사용법: credits.sh delete <email> \"<사유>\" [--confirm]" && exit 1
    cmd_delete "$1" "$2" "${3:-}"
    ;;
  *)
    echo "❌ 알 수 없는 명령: $CMD"
    echo "   사용 가능: query | charge | deduct | user | log | signups | delete"
    exit 1
    ;;
esac
