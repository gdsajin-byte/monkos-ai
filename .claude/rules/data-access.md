---
description: 크레딧/고객 데이터 접근 + 시크릿 운용 규칙
paths:
  - "scripts/credits.sh"
  - "monkos_AI/portal/lib/credits.js"
  - "monkos-ops/ops/audit/**"
  - "**/.env*"
  - "**/deploy.sh"
  - "monkos-ops/ops/SECRET_INVENTORY.md"
---

> source: governance/laws/ch4_docs_structure.md@2026-08-13

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
scripts/credits.sh signups [일수]                     # 신규 회원가입 집계 (읽기 전용, 기본 7일)
scripts/credits.sh delete <email> "<사유>" [--confirm] # 회원 탈퇴 처리 (기본 dry-run, --confirm 시 실삭제)
```

**delete 주의**: dry-run이 기본값이며 `--confirm` 없이는 쓰기가 발생하지 않는다. 실삭제는 비가역 + ch4 10조 4항상 **작가님 승인 필수**. `payments`·`transactions`·`audit`은 방침 고지 예외로 보존한다.

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

# 시크릿 운용 원칙 (광역오더 #8 + 2026-06-23 프로토콜 확정)

## 정본 체계
- **GCP Secret Manager** = 시크릿 단일 정본
- **GitHub Secrets** = write-only 카탈로그 + Actions 실행용 (정본 아님)
- **.env / git** = 비밀 아닌 설정값만 (PROJECT_ID, LOCATION, GCS_BUCKET 등)
- **인벤토리 정본**: `monkos-ops/ops/SECRET_INVENTORY.md` (메타만, 값 절대 금지)

## 시크릿 등록 프로토콜 — `secret` 커맨드 경유 필수

시크릿이 필요할 때 에이전트가 직접 값을 다루지 않는다. **작가님에게 `secret` 실행을 요청**한다.

**에이전트 → 작가님 요청 시 표준 문구:**
```
시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
이름: {시크릿명}
발급처: {어디서 키를 복사하는지}
```

**작가님 실행:**
```bash
secret                              # 대화식: 이름 → 값 순서로 물어봄
secret add <NAME>                   # 이름 지정: 값만 물어봄
```

**에이전트 확인 (값 미접촉):**
```bash
secret check <NAME>                 # 존재 + 버전만 확인
```

**에이전트 후속 처리:**
1. `SECRET_INVENTORY.md` 메타 1행 추가 (이름·용도·서비스·날짜만. 값 절대 금지)
2. `deploy.sh --set-secrets` 라인 추가 (해당 시)
3. `secret env` 로 .env 동기화 (해당 시)

## "없다"고 보고하기 전에
- **시크릿 인지 = `scripts/secret.sh map <NAME>` 1콜** (2026-07-24 신설): 존재·버전 상태·용도·소비처가 한 번에 나온다. grep·문서 탐색으로 있네없네 판단 금지. 무인자 실행 = 전체 맵 + 인벤 미등재 적발.
- **키가 없다/환경변수가 없다 → 먼저 `secret check <NAME>` 또는 SECRET_INVENTORY.md를 Read하라**
- **SA 권한/GSC 소유권이 "미부여"로 의심될 때 → SECRET_INVENTORY.md SA 섹션 Read하라.** monk-image-engine SA는 GSC sc-domain:monkos.ai 소유자 등록 + roles/indexing.publisher 보유 확정(2026-06-07). 색인 멈춤은 권한이 아니라 쿼터·폐기 엔드포인트·코드를 보라.
- Cloud Run 환경변수는 deploy.sh가 주입. 콘솔에서 직접 설정된 것도 있음 (AUTH_SECRET 등)

## 금지
- 시크릿 값 생성/추측/placeholder 금지 (헌법 4조 1항)
- **에이전트가 값을 채팅·컨텍스트·파일에 노출 금지** — `secret` 커맨드만 안내
- .env에 시크릿 하드코딩 후 git 커밋 금지
- SA 키 JSON을 코드에 포함 금지
- `gcloud secrets create/versions add` 직접 실행 금지 — `secret` 커맨드 경유
