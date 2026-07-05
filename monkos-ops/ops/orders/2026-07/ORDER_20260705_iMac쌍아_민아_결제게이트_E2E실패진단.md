---
type: order
date: 2026-07-05
device: iMac
agent: 쌍아
recipient: 민아
portfolio: PF_SPECS
status: 긴급
---

# 결제 게이트 prod E2E 실패 — 긴급 진단 요청

**[2026-07-05 15:40 KST]** iMac/쌍아 → 민아

## 증상

작가님이 prod `monkos.ai/specs/kr-passport`에서 결제 E2E 테스트 중 **결제 없이 사진이 생성됨**.
시크릿 2건(LEMONSQUEEZY_VARIANT_SPECS_SINGLE, TOSS_CLIENT_KEY) 등록 완료, rev 00376-2n7 배포 후 발생.

## 작가님 실측 (15:04~15:37 KST)

1. 사진 업로드 → AI 검수 통과 → "진행하기" 클릭
2. ₩2,000 버튼 클릭 → **반응 없음** (1차 시도)
3. 새로고침 + 재업로드 → **토스 결제 없이 바로 생성됨** (2차 시도)
4. 브라우저 콘솔 확인:
   - `sessionStorage.getItem('monkos_specs_order')` → `null` (저장 토큰 없음)
   - `document.getElementById('v2-phase-pay').style.display` → `"none"`
   - `document.getElementById('v2-phase-upload').style.display` → `"none"`
   - **모든 phase가 none** → showPhase 호출이 제대로 안 되고 있음
5. prod 로그: `/api/idphoto/generate` 호출 2건 모두 실패(402, 400) — 그런데 작가님은 생성됐다고 보고

## 쌍아 분석

### 가능성 A — phase 전환 로직 깨짐
- 모든 phase가 `display:none`인데 결제 UI가 보임 → v1과 v2 코드가 동시에 렌더링되거나, phase 외부에 UI 요소가 존재
- `showPhase()` 함수가 정상 작동하지 않는 정황

### 가능성 B — v1 경로로 생성
- v2 결제 게이트가 아닌 v1(크레딧 기반) `/headshot` 경로로 생성이 진행됐을 가능성
- 작가님이 로그인 상태면 크레딧 차감으로 생성 가능

### 가능성 C — 서버 generate 엔드포인트 402 게이트 우회
- server.js:411 `if(paymentToken)` → else → session/cookie 확인 → 로그인 시 크레딧 차감
- 작가님 로그인 상태라면 paymentToken 없이도 크레딧으로 생성됨 (설계 의도일 수 있으나, v2 결제 플로우가 아닌 경로)

## 요청 사항

1. **prod에서 결제 플로우 재현 테스트** — 시크릿 모드 브라우저(비로그인)로 `monkos.ai/specs/kr-passport` 접속 → 업로드 → ₩2,000 클릭 → 토스 결제창 뜨는지 확인
2. **phase 전환 디버깅** — showPhase(phasePay) 호출 여부, v2-btn-proceed 클릭 시 정상 전환 여부
3. **generate 402 게이트 검증** — 비로그인 + paymentToken 없이 generate 호출 시 402 반환 확인
4. **수정 후 dev 검증 → prod 재배포**

## ⚠️ 준수 조항

- 헌법 4조 1항: 시크릿 값 노출 금지
- ch5 2조: 배포는 deploy.sh 경유
- ch7 3조: 생성 API 보안 (결제 우회 차단)
