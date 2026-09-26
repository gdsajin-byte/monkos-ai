---
type: completion
date: 2026-09-26
device: iMac
agent: 민아
status: dev 검증 완료 · prod 배포 승인 대기
portfolio: PF_PORTAL
---

**[2026-09-26 13:51 KST]** iMac/민아 → 작가님

# COMPLETION — 어드민 리뷰 갤러리 게이트 배지 분리

## 배경
- 09-26 작가님 캡처의 "유료·credits" 2건이 실제로는 웰컴 10c 소진(잔액 0c·충전 이력 0)이었다. 어드민 `idphoto-review.html`이 gate=credits·token을 일괄 "유료"로 표기해 매출로 오독.
- 지시: "배지 분리 진행해, 좀더 명확하고 간략하게 알 수 있도록" (13:39).

## 변경 (커밋 c7fad349)
| 파일 | 내용 |
|---|---|
| `lib/credit-source.js` (신설) | 원장 `transactions` type='charge'(토스·Lemon 적립)가 생성 시각 이전에 존재 → `purchased`, 없으면 `welcome`. 조회 실패 → null. 어드민 수동 충전(`credit_charge`)은 제외 |
| `lib/gcs-save.js` | generations 기록에 `creditSource` 스냅샷 필드 |
| `server.js` / `lib/headshot-route.js` | gate=credits 생성 시 판정 후 저장. 헤드샷은 gate·sessionId도 함께 기록(기존 미기록) |
| `lib/cms/idphoto-review.js` | API 응답에 `creditSource`. 09-26 이전 구기록은 읽기 시 생성 시각 기준 판정(소급 없음) |
| `public/admin/idphoto-review.html` | 배지 5종: 무료(회색)·웰컴(파랑)·구매크레딧(초록)·즉시결제(초록)·유료(T1)(구기록). 판정 실패 시 "크레딧"(파랑, 매출 단정 금지). 상단 범례 "매출 N건 · 배지별 집계" — 매출 = 구매크레딧+즉시결제만 |
| `__tests__/credit-source.test.js` | 10건(순수 판정 6 + Firestore 래퍼 모킹 4) 통과 |

## 검증
- **단위**: 신규 10/10 통과. 기존 3스위트(headshot-gate·toss-cancel-webhook·payments-direct) 실패는 config 모킹에 `LEMON_JP_VARIANTS` 누락한 **선행 결함** — stash 대조로 본 건 무관 확인. 별도 작업 칩 발행.
- **dev 배포**: `deploy.sh dev --yes` → rev `monkos-portal-dev-00190-89w`, 드리프트 없음, health 200.
- **라이브 판정(2회 히트, Bearer 에이전트 키)**: `/api/admin/idphoto/results?service=kr&limit=12` 2차 응답에서 credits 게이트 2건 모두 `creditSource=welcome`, 나머지 free는 null. `service=all&limit=200`: free 196 · credits→welcome 3(09-21·25·26) · token 1(09-23 ₩2,000).
- **대조군**: prod 동일 API는 `creditSource` 필드 부재(미배포) → 필드 출현이 배포 효과임을 확인. **양성 대조군(purchased) 라이브 부재** — 충전 결제 고객이 아직 0명이라 단위 테스트로 대체. 첫 충전 고객 발생 시 실측 필요.
- **UI 렌더**: 실제 HTML + dev 실측 JSON을 로컬 스텁으로 서빙해 내장 브라우저 캡처. 12:45 카드 "웰컴"(파랑), 나머지 "무료", 범례 "매출 0건 · 웰컴 2 · 무료 10". 콘솔 에러 0.

## 미완·대기
- **prod 배포 미실행** — ch1 7조 승인 게이트(새 턴 승인 수신 후 `deploy.sh prod --yes`). 승인 시 민아 경로 범위 초과 ②(프로덕션 표면) → 세션로그 `[예외]` + 본 COMPLETION 갱신.
- 헤드샷 갤러리(`service=headshot`)는 기존 기록에 gate 없음 → 배지 공백(기존과 동일). 신규 생성부터 기록.

## 부수 적발
- **시크릿 부분 노출 (자기 적발)**: AGENT-API-KEYS 값 40자를 세션 컨텍스트에 출력. 외부 유출 아님. 로테이션(`secret add AGENT-API-KEYS`) 요청 완료, 작가님 실행 대기. 재발 방지: 시크릿은 길이·존재 여부 외 부분 문자열 출력 금지.
- 로그 타임스탬프 오기 2회(13:10→13:04, 13:15→13:14) — append-only 보정 행으로 처리, 이후 `date` 값 변수 삽입.
