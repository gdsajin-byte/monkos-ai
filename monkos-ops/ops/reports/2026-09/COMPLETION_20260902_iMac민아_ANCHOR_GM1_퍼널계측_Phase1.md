---
type: completion
date: 2026-09-02
device: iMac
agent: 민아
subject: "G-M1 퍼널 계측 Phase 1 — 수정안 2·6·1-A 구현 + portal-dev 배포 (민아 직접 실행, 경로③)"
order: ORDER_20260902_iMac민아_막내1_ANCHOR_GM1_퍼널계측_사전검수
report_in: REPORT_20260902_iMac막내2_ANCHOR_GM1_퍼널계측_사전검수
portfolio: PF_ANCHOR
related: PF_IDPHOTO, PF_SPECS
status: 부분 완료 — dev 반영 실측 완료 / prod 배포·테스트 결제 E2E·GA4 UI 2건은 작가님 잔여
---

**[2026-09-02 19:42 KST]** iMac/민아 → 작가님

> [예외: 경로③] 작가님 19:33 "퇴근해야 하니 직접 실행하고 정리해" → 민아가 Phase 1을 직접 구현. 채택 기준 = 민아 19:04 권고(2 → 6 → 1-A, 4-B, purchase=충전 시점). 쌍아 사후 추인 대상.

## ✅ 구현 (3커밋, 롤백 단위 분리)

| 커밋 | 수정안 | 변경 | 배포 경로 |
|---|---|---|---|
| `7c8cea18` [ops] | **2** 브리핑 수집기 | `.github/scripts/daily_briefing.py` — `FUNNEL_EVENTS` 무료 트랙 5종 편입, `hostName` 차원 추가 → host별 표 분리, 전환율 분모 = 1단계(최댓값 분모 폐기), `### 퍼널 (GA4, idphoto-kr)` 오라벨 → `(GA4, {host})`, `spec_select`를 "specs 열람"으로 라벨(4-B) | 배포 불요 — 다음 Actions 실행부터 |
| `dc65be14` [fix] | **6** 수령 페이지 가짜 purchase | `idphoto-kr/public/thankyou.js:182`·`idphoto-jp/public/thankyou.js:228` — `purchase` → `download_complete`, `value`·`currency`·`transaction_id(ty_${Date.now()})` 제거, 미사용 import 정리 | idphoto-kr·jp `deploy.sh prod` **미실행** |
| `0491e102` [fix] | **1-A** 충전 purchase 결선 | `portal/public/credits.html` handleTossResult success · `idphoto-kr/public/shared.js` initFromTossResult success · `studio/public/shared.js` 동일 — `gtag('event','purchase',{transaction_id: orderId, value: 실결제액, currency:'KRW', payment_provider:'toss', service, market:'kr'})`. `typeof gtag` 가드 + try/catch, paymentKey 미포함 | portal `deploy.sh dev` ✅ / **prod 미실행** |

**정의 채택(작가님 결정 #3·#4를 민아 권고로 집행)**: purchase = **크레딧 충전 확정 시점**(돈이 움직이는 시점, Ads 전환과 정합). 크레딧 사용·다운로드는 purchase 아님. `spec_select` = 이름 유지·"specs 열람"으로 해석 정정(4-B, 시계열 연속).

## ✅ 검증

- 정적: `node --input-type=module --check` 5파일 OK · `py_compile` OK · 수집기+렌더러 **목 데이터 드라이런** OK(host 2개 표 분리, 1단계 대비 %)
- portal jest 64/64 통과. 단 3 suite가 **사전 실패**(`LEMON_JP_VARIANTS` export 해석 실패 — `lib/shared/config.js:160`에 존재, 본 변경 무관 → 별건)
- **portal-dev 라이브 실측** (`monkos-portal-dev-…run.app/credits`): 배포 전 대조군 = 마커 0건·`handleTossResult` 1건(조회 유효) → 배포 후 = rev `monkos-portal-dev-00182-n5q`(19:42) **2회 히트 2차 판정** 마커 1건·`gtag('event', 'purchase'` 1건(:737 `transaction_id: orderId`)·`handleTossResult` 2건. 배포 스모크 통과. deploy.sh 드리프트 경고(specs-data.json)는 본 변경과 무관한 사전 상태 — 아래 별건

## ❌ 미실행 · ⏳ 작가님 잔여

| # | 항목 | 이유 | 소요 |
|---|---|---|---|
| 1 | **prod 배포** portal·idphoto-kr·idphoto-jp·studio | ch1 7조 승인 게이트(`deploy.sh prod`) + 테스트 결제 E2E 미완 상태에서 결제 페이지 코드 야간 무인 prod 반영 회피 | 승인 1턴 → 막내 또는 민아 4건 |
| 2 | **테스트 결제 E2E**(portal-dev, `TOSS_CLIENT_KEY_TEST`) | confirm이 로그인 세션 바인딩 → Google OAuth 동의 클릭이 필요. 무인 상태에서 승인 게이트 대상 | 작가님 복귀 후 1분: preview 로그인 → /credits 70c 충전(테스트 카드) → GA4 DebugView·hostName 필터로 purchase 확인 |
| 3 | **GA4 커스텀 측정기준 등록**(#2) | SA `can_edit:false` | 관리 → 맞춤 정의: `service`·`market`·`spec_type` 3개 우선 |
| 4 | **GA4 스트림 확인**(#1) | UI 전용 | 관리 → 데이터 스트림 → MONKOS AI → 태그 설정 → 연결된 사이트 태그 |
| 5 | **수정안 5** `credits.sh payments` 읽기 전용 | 쌍아 설계 경유 | 쌍아 지시서 |

## ⚠️ 사고 회피 기록 — dev 배포 3건 중단

`idphoto-kr`·`studio`·`idphoto-jp` `deploy.sh dev`를 병렬 착수했으나 Cloud Run 실측상 dev 서비스는 `monkos-portal-dev` **1개뿐**(references.md의 "(+-dev)" 표기 구본). 신규 서비스 생성 = 승인 게이트 대상이라 서비스 생성 전 중단. 결과 서비스 신설 0, 잔재 GCR 이미지 3개(미배포·무해). **references.md §서비스 매핑 정정 필요**(별건).

## 💡 별건 (기재만)

1. portal jest 3 suite `LEMON_JP_VARIANTS` 사전 실패 — 테스트 환경 모듈 해석 문제로 추정, 코드 정상 기동 중
2. `/toss-success` 죽은 라우트(server.js:1006) — 1-A로 대체됐으므로 정리 대상
3. references.md 서비스 매핑: idphoto-kr/jp·studio `-dev` 서비스 부재 반영
4. GCR 잔재 이미지 3개 삭제 여부
5. portal deploy.sh 드리프트 경고: `specs-data.json`이 로컬 SSG 빌드(a4fb73e0) 이후 변경 — `specs_drift.sh` 원장 판정 = **드리프트 없음**(엣지 배포본=현행 소스). deploy.sh 로컬 빌드 기준 경고는 오탐

## 📁 산출물
- 본 파일 / 세션 로그 09-02 19:32~ / PF_ANCHOR 히스토리 1행 / 커밋 3건

## 🔀 다음
작가님 복귀 → ①GA4 UI 2건(5분) ②portal-dev 테스트 결제 1회 ③prod 4건 배포 승인 → 다음 실고객 충전이 GA4 purchase로 찍히면 **G-M1 계측 요건 성립**(첫 결제 요건은 08-25 건으로 기충족, 미충족은 계측이었음)
