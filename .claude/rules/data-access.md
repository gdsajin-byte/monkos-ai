# 크레딧/고객 데이터 접근 규칙 (ch4 10조)

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
