---
description: 크레딧/고객 데이터 접근 + 시크릿 운용 규칙
globs:
  - "scripts/credits.sh"
  - "monkos_AI/portal/lib/credits.js"
  - "monkos-ops/ops/audit/**"
  - "**/.env*"
  - "**/deploy.sh"
  - "monkos-ops/ops/SECRET_INVENTORY.md"
---

# 크레딧/고객 데이터 접근 + 시크릿 운용 규칙 (ch4 10조 + 광역오더 #8)

## 직접 접근 금지 (10조 1항)
- Firestore 직접 접근 (`node -e`, `gcloud firestore`, 콘솔) 금지.
- 크레딧 조회/변경, 고객 정보 조회는 **`scripts/credits.sh` 경유 필수**.

## 사용법
```bash
scripts/credits.sh query <email>                     # 크레딧 조회
scripts/credits.sh charge <email> <amount> "<사유>"   # 충전 (사유 필수)
scripts/credits.sh deduct <email> <amount> "<사유>"   # 차감 (사유 필수)
scripts/credits.sh user <email>                      # 고객 정보 조회
scripts/credits.sh log [N]                           # 감사 로그 열람
```

## 감사 추적 (10조 3항)
- charge/deduct 시 자동 이중 기록: Firestore `audit` + `monkos-ops/ops/audit/CREDIT_AUDIT_LOG.md`
- append only. 수정·삭제 절대 금지.

## 권한 (10조 4항)
- 크레딧 변경: **작가님 지시 또는 지시서 명시** 필요.
- 에이전트 자율 판단에 의한 크레딧 변경 금지.

## 막내 방어 의무 (10조 5항)
지시서에 Firestore 직접 접근 코드가 포함된 경우:
1. 실행 전 10조 위반 보고
2. `credits.sh` 경유로 전환

## 예외 (10조 6항)
- 서비스 코드(server.js 등)의 Firestore 접근은 대상 아님.
- 본 규칙은 **운영·관리 목적의 수동 접근**에만 적용.

> 상세: governance/laws/ch4_docs_structure.md 10조

---

# 시크릿 운용 원칙 (광역오더 #8 — 2026-06-03 확정)

## 정본 체계
- **GCP Secret Manager** = 런타임 시크릿 정본 (24종 등록 완료)
- **GitHub Secrets** = write-only 카탈로그 + Actions 실행용 (정본 아님)
- **.env / git** = 비밀 아닌 설정값만 (PROJECT_ID, LOCATION, GCS_BUCKET 등)
- **인벤토리 정본**: `monkos-ops/ops/SECRET_INVENTORY.md`

## "없다"고 보고하기 전에
- **키가 없다/환경변수가 없다 → 먼저 SECRET_INVENTORY.md를 Read하라**
- **SA 권한/GSC 소유권이 "미부여"로 의심될 때 → SECRET_INVENTORY.md SA 섹션 Read하라.** monk-image-engine SA는 GSC sc-domain:monkos.ai 소유자 등록 + roles/indexing.publisher 보유 확정(2026-06-07). 색인 멈춤은 권한이 아니라 쿼터·폐기 엔드포인트·코드를 보라.
- 복원: `gcloud secrets versions access latest --secret=<NAME> --project=monkos`
- Cloud Run 환경변수는 deploy.sh가 주입. 콘솔에서 직접 설정된 것도 있음 (AUTH_SECRET 등)

## 금지
- 시크릿 값 생성/추측/placeholder 금지 (헌법 4조 1항)
- .env에 시크릿 하드코딩 후 git 커밋 금지
- SA 키 JSON을 코드에 포함 금지
