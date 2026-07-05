---
type: completion
date: 2026-07-05
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# COMPLETION — 결제 게이트 prod E2E 실패 진단·수정

**[2026-07-05 16:00 KST]** iMac/민아 → 작가님, 쌍아

> 지시서: [ORDER_20260705_iMac쌍아_민아_결제게이트_E2E실패진단.md](../../orders/2026-07/ORDER_20260705_iMac쌍아_민아_결제게이트_E2E실패진단.md) (긴급)

## ✅ 진단 결과 — 두 증상은 별개 사건이었음

### 증상 1 "결제 없이 생성됨" → 구 리비전의 흔적 (현행 우회 아님)
- prod 로그 실측: `/api/idphoto/generate` 200이 **14:17·14:18 KST 2건** — 402 게이트가 실리기 **전** 구 리비전(00375, 7/2 코드, v2 파일럿+게이트 부재) 시점의 생성.
- 신 리비전(00376, 14:49 배포) 이후 생성 성공 0건. 무토큰 호출은 `PAYMENT_REQUIRED` 402 차단 — curl 실측 2회 확인.
- 쌍아 분석의 402·400 2건(가능성 C 근거)은 민아의 14:50 스모크 프로브였음.
- 가능성 C(로그인 크레딧 경로)는 **설계 의도된 경로**로 실존하나(서버 generate: 토큰 없고 로그인 시 10c 차감), v2 클라이언트는 무토큰 상태에서 generate에 도달하지 않음(btn-proceed가 phasePay로 강제). 이번 사건과 무관.

### 증상 2 "₩2,000 버튼 무반응" → 토스 결제창 user activation 만료 (실결함, 수정 완료)
- prod 로그: 15:03:22~44 KST에 `direct/init` 200 **10연발**(0.4~0.6s 간격) = 클릭→init 성공→결제창 실패→재클릭 루프.
- 원인: 클릭 후 `fetch(init)` → `persistImage(compressImage 캔버스 압축)` **비동기 2홉 뒤**에 토스 결제창 오픈 → Chrome user activation 만료 → 팝업 무음 차단.
- 수정: `persistImage`를 **검수(precheck) 통과 시점으로 선행**, 결제 클릭은 init→startToss 직결. (레몬 경로는 기존에도 클릭 제스처 내 선오픈으로 안전)

### 부차 관찰
- "모든 phase display:none" 콘솔 결과: 세션스토리지 null과 조합하면 **다른 탭(직전 dev 테스트 탭) 콘솔에서 실행**했을 가능성이 높음. 신선 로드 실측(민아 Chrome)에서는 phase 상태 정상(upload=block, 나머지 none), TossPayments=function.
- 검수 통과 화면의 큰 사진 표시가 "생성 결과"로 오인될 소지 — UX 카피 개선 후보로 기록만 남김.

## ✅ 검증·배포
- jest 51/51 · dev rev 00042 검증(패치 반영 + 결제 클릭 체인 persistImage 부재 확인) · **prod rev monkos-portal-00377-tfk** 트래픽 100%.
- 커밋: 00cb2d31

## ⏳ 재테스트 요청 (작가님)
1. `monkos.ai/specs/kr-passport` **새로고침** 후 업로드 → 검수 → ₩2,000 클릭 → **토스 결제창이 뜨는지** (이번 수정의 검증 포인트)
2. 결제 → 생성 → 다운로드까지
3. `/en/specs/kr-passport` 레몬 $1.99 동일 (웹훅 배선 완료 상태라 이번엔 팝업 닫힌 뒤 수 초 내 생성 진입이 정상)

## 📁 산출물
- render-specs.js(수정), 본 보고서, 세션 로그 어펜드, PF_SPECS 히스토리 어펜드
