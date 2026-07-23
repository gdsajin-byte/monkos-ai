#!/bin/bash
# SA·시크릿 감사 스냅샷 — 읽기 전용 (2026-07-24 신설, 작가님 지시 "종합 시크릿 관리 수준 체크")
#
# 출력: ① SA 목록 ② 프로젝트 IAM(SA·user) ③ SA별 사용자 키(나이) ④ SA별 임퍼소네이션 허용
#       ⑤ Cloud Run 실행 SA ⑥ SM 시크릿 ↔ SECRET_INVENTORY 등재 대조
# 용도: 순찰(소넷이/민아) 주기 실행 → SECRET_INVENTORY '권한 매트릭스'와 diff → 불일치 시 보고.
# 값 비접촉: 시크릿 이름·메타만 출력. 키 본문·토큰 절대 미출력.
set -uo pipefail
P=monkos
INV="$(git rev-parse --show-toplevel 2>/dev/null)/monkos-ops/ops/SECRET_INVENTORY.md"

echo "=== ① SA 목록 ==="
gcloud iam service-accounts list --project=$P --format="table(email,disabled)" || echo "[sa_audit] SA 목록 실패"

echo "=== ② 프로젝트 IAM (SA·user, 서비스에이전트 제외) ==="
gcloud projects get-iam-policy $P --format=json | python3 -c "
import json,sys
p=json.load(sys.stdin); m={}
for b in p['bindings']:
    for mem in b['members']: m.setdefault(mem,[]).append(b['role'])
for mem in sorted(m):
    if mem.startswith('user:') or ('gserviceaccount' in mem and '@'+'$P'+'.iam' in mem or 'compute@developer' in mem):
        print(mem); [print('   ',r) for r in m[mem]]"

echo "=== ③ 사용자 관리 키 (나이 경보: 90일+) ==="
for SA in $(gcloud iam service-accounts list --project=$P --format="value(email)" | grep "@$P.iam"); do
  echo "-- $SA"
  gcloud iam service-accounts keys list --iam-account=$SA --managed-by=user \
    --format="table(name.basename(),validAfterTime,validBeforeTime)" 2>/dev/null | tail -n +2 | while read -r line; do
      echo "   $line"
    done
done

echo "=== ④ 임퍼소네이션 허용 (SA-level tokenCreator) ==="
for SA in $(gcloud iam service-accounts list --project=$P --format="value(email)" | grep "@$P.iam"); do
  R=$(gcloud iam service-accounts get-iam-policy $SA --format=json 2>/dev/null | python3 -c "
import json,sys; p=json.load(sys.stdin)
for b in p.get('bindings',[]):
    if 'TokenCreator' in b['role'] or 'tokenCreator' in b['role']: print(', '.join(b['members']))")
  [ -n "$R" ] && echo "  $SA ← $R"
done

echo "=== ⑤ Cloud Run 실행 SA ==="
gcloud run services list --region=us-central1 --format="table(metadata.name,spec.template.spec.serviceAccountName)" || true

echo "=== ⑥ SM ↔ 인벤토리 대조 ==="
MISS=0
for s in $(gcloud secrets list --project=$P --format="value(name)"); do
  grep -q "$s" "$INV" 2>/dev/null || { echo "  ⚠️ 인벤토리 미등재: $s"; MISS=1; }
done
[ $MISS = 0 ] && echo "  전량 등재 ✓"
echo "[sa_audit] 완료 — 권한 매트릭스(SECRET_INVENTORY.md)와 대조하라"
