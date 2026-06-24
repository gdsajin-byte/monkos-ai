---
type: order
date: 2026-06-24
from: iMac/쌍아
to: 막내
status: 대기
---

# S4 보안 잔존 수정

> **[2026-06-24 11:21 KST]** iMac/쌍아 → 막내
> 근거: `REPORT_20260616_웹민아_현행노출표면_S4독립검증.md` (PR #80)
> V1(health 엔진명), V2(idphoto-kr 에러 제네릭화)는 이미 수정 완료 확인. 본 지시서는 잔존 3건만 대상.

---

## 작업 1: V2 — portal 에러 메시지 제네릭화 (9개소)

**위험**: `err.message`가 클라이언트에 그대로 반환되어 내부 스택, API 경로, 시크릿이 노출될 수 있음.

**수정 패턴**: `res.end(JSON.stringify({ error: err.message }))` → `res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }))`
(log에는 err.message 유지 — 이미 되어 있으므로 그대로)

| # | 파일 | 라인 | 컨텍스트 |
|---|------|------|----------|
| 1 | `monkos_AI/portal/lib/payments.js` | :66 | Checkout 에러 |
| 2 | `monkos_AI/portal/lib/payments.js` | :180 | Webhook 에러 |
| 3 | `monkos_AI/portal/lib/payments.js` | :307 | Toss 결제 에러 |
| 4 | `monkos_AI/portal/lib/payments.js` | :369 | Toss-Direct 에러 |
| 5 | `monkos_AI/portal/lib/credits.js` | :57 | 크레딧 조회 에러 |
| 6 | `monkos_AI/portal/lib/credits.js` | :133 | 크레딧 사용 에러 |
| 7 | `monkos_AI/portal/lib/credits.js` | :189 | 크레딧 환불 에러 |
| 8 | `monkos_AI/portal/lib/tg-cs.js` | :132 | TG passport-issue 에러 |
| 9 | `monkos_AI/portal/lib/tg-cs.js` | :207 | TG upload-mission 에러 |

**참고**: payments.js:304 텔레그램 알림의 `err.message`는 내부 채널 전송이므로 유지 OK.

---

## 작업 2: V3 — GCP 리소스 기본값 제거 + env 필수화 (4개소)

**위험**: env 미설정 시 실 프로덕션 project/bucket명이 코드 기본값으로 노출.

**수정 패턴**: fallback 제거 → env 없으면 시작 시 throw.

| # | 파일 | 라인 | 현행 | 수정 |
|---|------|------|------|------|
| 1 | `monkos_AI/idphoto-kr/server.js` | :26 | `process.env.PROJECT_ID \|\| 'monkos'` | `process.env.PROJECT_ID` (없으면 서버 기동 시 체크) |
| 2 | `monkos_AI/idphoto-kr/gcs-save.js` | :10 | `process.env.CUSTOMER_GCS_BUCKET \|\| 'monk-customer-photos'` | 동일 패턴 |
| 3 | `monkos_AI/portal/lib/shared/config.js` | :15 | `process.env.PROJECT_ID \|\| 'monkos'` | 동일 패턴 |
| 4 | `monkos_AI/portal/lib/shared/config.js` | :77 | `process.env.GCS_BUCKET \|\| 'monk-ai-images'` | 동일 패턴 |

**구현**: 각 서비스 진입점(server.js, config.js) 상단에 env 검증 블록 추가:
```js
const REQUIRED_ENV = ['PROJECT_ID', 'GCS_BUCKET' /* 등 */];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`필수 환경변수 ${key} 미설정`);
}
```

---

## 작업 3: V4 — `/api/stats` admin 인증 게이트

**위험**: 무인증으로 가입자 수(totalUsers) 노출 → 경쟁 정보 유출.

| 파일 | 라인 | 수정 |
|------|------|------|
| `monkos_AI/portal/server.js` | :151 | admin 인증 체크 추가. 미인증 시 `403` 반환. |

**구현**: 기존 admin 인증 패턴(dashboard 등)을 준용. 세션/토큰 기반 admin 체크 후 통과 시에만 stats 반환.

---

## ⚠️ 준수 조항

- 배포는 `deploy.sh` 경유 필수 (ch5 2조). `gcloud run deploy` 직접 실행 금지.
- `.env`, secrets 관련 파일 수정 금지 (헌법 4조 1항).
- 수정 후 회귀 테스트: 헬스체크 200 + 결제 정상응답 + 크레딧 API 정상응답 확인.
- idphoto-kr은 이미 제네릭화 완료. **건드리지 않는다.**

## 완료 기준

- [ ] V2: portal 9개소 에러 메시지 제네릭화
- [ ] V3: 4개소 기본값 제거 + env 필수화
- [ ] V4: /api/stats admin 인증 게이트
- [ ] 회귀 테스트 통과
- [ ] 완료 보고 (헌법 3조 2항)
