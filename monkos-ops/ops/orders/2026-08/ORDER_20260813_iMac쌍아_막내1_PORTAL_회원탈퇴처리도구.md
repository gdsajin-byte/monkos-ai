---
type: order
date: 2026-08-13
from: iMac/쌍아
to: iMac/막내1
subject: "회원 탈퇴 처리 도구 신설 — credits.sh delete 서브커맨드 (dry-run 기본 + 승인 게이트)"
status: 대기
portfolio: PF_PORTAL
---

# ORDER — 회원 탈퇴 처리 도구 (credits.sh delete)

**[2026-08-13 15:24 KST]** iMac/쌍아 → iMac/막내1

> **발행 근거**: 작가님 직접 지시(08-13 15시) — 실제 탈퇴 요청 수신에 따른 대응.
> **착수 전 필독**: [`.claude/rules/data-access.md`](../../../../.claude/rules/data-access.md) (ch4 10조) + [PF_PORTAL/README.md](../../portfolios/PF_PORTAL/README.md)

## 1. 배경 — 약속과 수단의 공백

2026-08-13 14:30 KST, 실제 유저가 `info@monkos.ai`로 회원 탈퇴를 요청했다. 실측 결과 **처리 수단이 없다**.

| 항목 | 실측 |
|------|------|
| 개인정보처리방침 약속 | `portal/public/privacy.html` L72 "회원 탈퇴 시 **즉시 파기**" |
| 안내된 요청 경로 | 동 L90 "회원 탈퇴 (info@monkos.ai로 요청)" — 이메일만 |
| 앱 내 탈퇴 기능 | ❌ 미구현 (`/api/account/delete` 코드 부재. PROPOSAL_20260624 T3 / DESIGN_20260715 T5 미착수) |
| 운영 측 처리 도구 | ❌ `credits.sh` = query·charge·deduct·user·log·signups. **delete 부재** |
| Firestore 직접 삭제 | 🚫 ch4 10조 1항 금지 |

즉 방침으로 "즉시 파기"를 약속해놓고 집행 경로가 없다. **1회성 스크립트로 때우지 말 것** — 탈퇴 요청은 재발이 확실하고, 그때마다 Firestore 직접 접근 유혹이 생긴다. 정본 도구(`credits.sh`)에 못 박는 것이 본 지시서의 목적이다.

## 2. 산출물

| 파일 | 작업 |
|------|------|
| `scripts/credits.sh` | `delete` 서브커맨드 신설 (+ usage 2곳 갱신: 5-11행 주석 블록, 306-315행 usage 출력) |
| `.claude/rules/data-access.md` | 사용법 섹션에 `delete` 1행 추가 |
| `monkos-ops/ops/reports/2026-08/COMPLETION_...md` | 완료 보고 (dry-run 출력 첨부) |

## 3. 상세 설계

### 3-1. 인터페이스

```
scripts/credits.sh delete <email> "<사유>"              # dry-run (기본) — 삭제 대상만 출력, 변경 없음
scripts/credits.sh delete <email> "<사유>" --confirm    # 실제 삭제
```

- **dry-run이 기본값**이다. `--confirm` 없이는 어떤 쓰기도 발생하지 않는다.
- 사유 필수 (charge/deduct 준용). 미기입 시 exit 1.
- 대상 미존재 시 `{"error":"사용자 없음"}` 출력 후 exit 0 (charge/deduct 준용).

### 3-2. 삭제 범위 — 실측 기반

기존 함수들과 동일하게 `users` 컬렉션을 email 대조로 스캔하여 `uid`(doc id)를 확정한 뒤, uid 기준으로 처리한다.

**삭제 대상**

| 컬렉션 / 저장소 | 키 | 비고 |
|---|---|---|
| `users` | doc id = uid | PII 정본 |
| `generations` | `userId` 필드 | `lib/gcs-save.js` 참조 |
| GCS `{service}/{uid}/` | 경로 프리픽스 | 생성 이미지 객체. 버킷은 `lib/shared/config.js` 정본 경유 |
| `free_quota` | doc id `{date}_{uid}` | `server.js:183` 참조 |
| `telegram_links` | `userId` 필드 | `lib/telegram.js:165` 참조 |
| `cs_tickets` / `cs_conversations` | `userId` 필드 | `lib/tg-cs.js:68` 참조 |

**보존 대상 (삭제 금지)**

| 컬렉션 | 근거 |
|---|---|
| `payments` | 전자상거래법 5년 보관 의무 (`privacy.html` L74 명시) |
| `transactions` | 크레딧 거래 기록 — payments 준용 |
| `audit` | 감사 기록 append-only (ch4 10조 3항) |

⚠️ 위 3종은 **개인정보처리방침이 이미 예외로 고지한 항목**이다. 임의로 삭제 범위에 넣지 말 것.

### 3-3. 감사 기록

- 기존 `append_audit()`를 재사용하되 크레딧 칸이 무의미하므로 `delete` 전용 행 포맷을 쓴다: 변경전 = 삭제 시점 잔여 크레딧, 변경후 = `-`.
- **이메일은 마스킹하여 기록한다** (예: `l***i@gmail.com`). 파기를 이행해놓고 감사로그에 원본 식별자를 남기면 자기모순이다. uid는 그대로 기록(내부 식별자).
- Firestore `audit` 컬렉션에도 `type: 'account_delete'`로 1건 기록 (charge/deduct 준용, 이메일 마스킹 동일 적용).
- 삭제된 컬렉션별 문서 수와 GCS 객체 수를 사유와 함께 남길 것.

### 3-4. 안전장치

- `--confirm` 실행 시에도 **삭제 직전 대상 요약을 stdout에 출력**한 뒤 진행 (무음 삭제 금지).
- 부분 실패 시 중단하지 말고 나머지를 계속 처리하되, **실패 항목을 종료 시 명시 출력**하고 exit code를 0이 아닌 값으로 낼 것. 무음 강등 금지.
- `set -euo pipefail` 유지.

## 4. 실행 절차 — 2단 게이트

**Phase A (본 지시서 범위)**
1. `delete` 서브커맨드 구현.
2. `scripts/credits.sh delete lingohosi@gmail.com "회원 탈퇴 요청 (2026-08-13 이메일 수신)"` **dry-run 실행**.
3. dry-run 출력 전문을 COMPLETION 보고서에 첨부하고 **작가님에게 보고 후 대기**.

**Phase B (작가님 승인 후 별도 지시)**
- `--confirm` 실행. **Phase A 보고만으로 자동 진행 금지.**

> 고객 데이터 삭제는 비가역이며 ch4 10조 4항상 작가님 지시가 필요하다. dry-run 결과를 눈으로 확인하는 게이트를 건너뛰지 말 것.

## 5. ⚠️ 준수 조항

- **ch4 10조 1항**: Firestore 직접 접근 금지 — 구현 자체는 `credits.sh` 내부의 기존 `run_node` 래퍼 경유. 별도 `node -e` 일회성 실행 금지.
- **ch4 10조 4항**: 실제 삭제(`--confirm`)는 작가님 승인 필수. Phase A는 dry-run까지.
- **헌법 4조 1항**: 값 추측 금지. 버킷명·컬렉션명은 코드 정본에서 실측 확인 후 사용.
- **헌법 4조 2항**: 파괴적 명령 금지 원칙 — 본 도구는 예외 승인 대상이나, 그렇기에 dry-run 기본값과 `--confirm` 게이트가 필수 구성요소다. 생략 시 미완료.
- **ch2 7조**: 버킷·프로젝트 상수 하드코딩 금지. `lib/shared/config.js` 경유.
- **헌법 3조 1항**: 매 턴 `date` 실행.
- **헌법 3조 2항**: COMPLETION 보고서 파일 필수 + 세션 로그 어펜드 + **PF_PORTAL 히스토리 1행**.

## 6. 후속 (본 지시서 범위 밖 — 참고)

근본 원인은 앱 내 탈퇴 기능 부재다. 마이페이지 탈퇴 플로우(PROPOSAL_20260624 T3 / DESIGN_20260715 T5)는 별도 지시서로 다룬다. 본 도구는 그때까지의 운영 경로이자, 기능 구현 후에도 CS 예외 처리용으로 남는다.
