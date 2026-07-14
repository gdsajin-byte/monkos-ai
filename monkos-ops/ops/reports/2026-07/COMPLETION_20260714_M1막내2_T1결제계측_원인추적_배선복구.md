---
type: completion
date: 2026-07-14
device: M1
agent: 막내2
status: 완료
portfolio: PF_SPECS
---

# T1 결제 계측 갭 — 원인 추적 + 배선 복구

**[2026-07-14 12:13 KST]** M1/막내2 → 작가님

## 원인 판정

### H1 확정 (주인): `/toss-success` 페이지 계측 부재

`/toss-success`(payments.js:996)는 독립 HTML 페이지로 gtag.js·specs-funnel.js를 일체 로드하지 않음. 크레딧 충전 경유 결제(로그인 → `/credits.html` → 토스 위젯 → `/toss-success` → confirm) 시 purchase 발화 주체가 전무.

- specs 직접결제(v2-pay-instant) 경로는 `?toss=direct` 리다이렉트 → resume() → `gaTrackPurchase` 정상 배선이나, "purchase 전 기간 0"이므로 이 경로의 실사용 이력이 없거나 매우 희소.
- 작가님 7/13 실결제(19:02)는 크레딧 충전 경유로 추정 → H1이 직접 원인.

### H2 확정 (보강): begin_checkout beacon 미적용

begin_checkout(specs-funnel.js:890)이 `transport_type: 'beacon'` 없이 발화 → 토스 위젯 렌더 후 사용자가 빠르게 결제 완료 시 이벤트 유실 가능성.

### H3~H5 기각

- H3: `?toss=direct` resume 분기(specs-funnel.js:1189)에 `gaTrackPurchase` 정상 배선 확인.
- H4: `GA_PAY` 객체는 CFG.market 기반 조건 초기화, undefined 가능성 없음.
- H5: `gaOrderFired` 빈 객체 초기화, dedup 오작동 가능성 없음.

## 변경 내역

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/payments.js` | `/toss-success` HTML 템플릿에 gtag.js 스니펫(G-JPZWSJ3323 + G-FKG0CPTC14) 추가 + confirm 성공 후 `purchase` 이벤트 발화(transaction_id·currency·value·transport_type:beacon) |
| `monkos_AI/portal/public/js/specs-funnel.js` | begin_checkout 파라미터에 `transport_type: 'beacon'` 추가 |

## 검증

- [x] jest `render-specs-v2-ga.test.js` 10/10 통과
- [x] dev 배포(rev `monkos-portal-dev-00116-tgl`) — 헬스 200, specs 3개 언어 렌더 정상
- [x] dev `/toss-success` 페이지 gtag+purchase+beacon 존재 확인
- [x] dev specs-funnel.js 난독화 후 begin_checkout·purchase·beacon·transport_type 존재 확인
- [x] prod 배포(rev `monkos-portal-00465-b4m`) — 헬스 200, 동일 검증 통과
- [x] 무료 퍼널 기존 이벤트(spec_select·photo_upload) 회귀 무결
- [ ] ⏳ 작가님 실결제 1건 재검증 — GA4 DebugView/Realtime에서 begin_checkout→purchase 연쇄 확인 필요 (직접 결제 유도 금지 — 작가님 판단)

## 배포 리비전

- dev: `monkos-portal-dev-00116-tgl`
- prod: `monkos-portal-00465-b4m`
