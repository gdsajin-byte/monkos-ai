---
type: report
id: REPORT_20260305_막내2_Phase2_페이지뷰디자인
date: 2026-03-05 13:32 KST
from: 막내2
to: 쌍아
status: completed
task_id: ORDER_20260305_막내2_Phase2_페이지뷰디자인
result: success
tags: [Phase2, 랜딩, 충전, ChargeModule, 디자인]
---

# Phase 2 완료 보고서: 랜딩+충전 페이지뷰 디자인

> **[2026-03-05 13:32 KST] iMac/막내2 → iMac/쌍아**

---

## 1. 랜딩 (index.html) 디자인 마무리

| 항목 | 상태 | 비고 |
|------|------|------|
| 히어로 이미지 | ✅ 정상 | `images/hero.webp`(725KB) → `<img class="hero-bg">` 정상 참조. 배경 정상 표시 |
| 히어로 레이아웃 | ✅ 완성 | 이미지+오버레이+카피+CTA 시각적 밸런스 확인 |
| 가격 카드 | ✅ 유지 | v3 가격산수(리터칭10c+다운로드70c=80c)+₩9,900 표시 |
| "상세 가격보기 →" | ✅ **수정** | `/charge.html?return=index`로 변경 — 돌아가기 시 랜딩으로 복귀 |
| 하단 배지 | ✅ 유지 | 여권 발급 보장 + 첫 로그인 10c |
| 사업자 푸터 | ✅ 기존재 | biz-info 섹션 + Privacy/Terms/Refund 링크 |

---

## 2. 충전 (charge.html) 디자인 점검

| 항목 | 상태 | 비고 |
|------|------|------|
| 카드 선택 → 결제 연동 | ✅ 정상 | CHARGE_OPTIONS[selectedPkg] → buyCreditsKR() |
| 스테퍼 ± 동작 | ✅ 정상 | 10c~100c, ₩1,450 단위 |
| 돌아가기 | ✅ **수정** | 기본값 `result` → `index`로 변경. `?return=` 파라미터 우선 |
| 사업자 정보 | ✅ **추가** | 결제 페이지 법적 요건. index.html과 동일한 사업자 정보 추가 |
| 데이터 통합 | ✅ **완료** | 인라인 CHARGE_OPTIONS 제거 → config.js import |

---

## 3. ChargeModule 모달 (핵심 신규 작업)

| 항목 | 상태 | 비고 |
|------|------|------|
| 이미 존재 | ✅ | modules/charge.js ChargeModule.show()/close() 기존재 |
| shared.js 연결 | ✅ | `showChargeModal()` → `import('./modules/charge.js')` 동적 import |
| result.js 호출 | ✅ | 생성402/다운로드잔고부족/window 노출 — 3개 호출 지점 |
| thankyou.js 호출 | ✅ | 풀샷/추가크롭 잔고부족 — 2개 호출 지점 |
| 헤더 크레딧 클릭 | ✅ | shared.js sharedInit()에서 creditBadge click → showChargeModal() |
| **best 플래그 수정** | ✅ | package_300 → package_500(★BEST)로 통일 (charge.html과 일치) |
| **데이터 단일화** | ✅ | config.js CHARGE_OPTIONS → shared.js re-export → modules/charge.js import |
| **카드 디자인 동기화** | ✅ | charge.html 와이드카드 스타일과 동일한 renderChargeCards() 함수 추출 |
| **renderChargeCards 공유** | ✅ | modules/charge.js에서 export → charge.html에서 import |

### ChargeModule 호출 방법
```js
// 아무 페이지에서 (shared.js import 시)
showChargeModal();

// 또는 직접 import
import { ChargeModule } from './modules/charge.js';
ChargeModule.show();
```

### 이벤트 흐름
```
잔고 부족 → showChargeModal()
  → modules/charge.js 동적 import
  → ChargeModule.show() → 바텀시트 오버레이
  → 사용자 상품 선택
  → "토스페이먼츠로 결제" 클릭
  → ChargeModule.close()
  → buyCreditsKR(price, credits)
  → TossPayments 리다이렉트
  → 결제 완료 → 페이지 복귀
  → initFromTossResult() → 크레딧 갱신
  → visibilitychange → fetchLatestCredits() (탭 복귀 시)
```

---

## 4. E2E 흐름 검증

### 흐름 1: 신규 유저 — ✅
```
index.html → "촬영 시작하기" → /prep (href="/prep")
  → 비로그인 → prep에서 로그인 유도 또는 촬영실 진입
```

### 흐름 2: 가격 확인 — ✅
```
index.html → "패키지 할인 보기 →" → /charge.html?return=index
  → 상품 선택 → 결제 → 크레딧 충전
  → "돌아가기" → index.html (return=index 파라미터 활용)
```

### 흐름 3: 잔고 부족 — ✅
```
result.html → 다운로드 클릭 → downloadResult()
  → store.user.credits < CREDIT_COST.download (70c)
  → sessionStorage에 pending_action='download' 저장
  → showChargeModal() → 모달 충전 → buyCreditsKR() → 토스 리다이렉트
  → result.html 복귀 → init() → initFromTossResult() → 크레딧 갱신
  → pendingAction === 'download' && 잔액 ≥ 70c → setTimeout(downloadResult, 300)
  → 원래 맥락 보존 ✅ (_fullOriginal sessionStorage 보관)
```

### 흐름 4: 외부 유입 — ✅
```
charge.html 직접 접근 (no return param)
  → 충전 가능
  → "돌아가기" → index.html (기본값 수정 완료)
```

---

## 5. 데이터 정합성 검증

### 가격 일치 (3자 비교)

| 항목 | config.js (프론트) | modules/charge.js | 백엔드 PRODUCTS | 일치 |
|------|-------------------|-------------------|----------------|------|
| single_70 | 9900/70+10 | config.js import | 9900/70+10 | ✅ |
| package_100 | 12900/100+30 | config.js import | 12900/100+30 | ✅ |
| package_300 | 34900/300+120 | config.js import | 34900/300+120 | ✅ |
| package_500 | 49900/500+250 | config.js import | 49900/500+250 | ✅ |
| KRW_PER_CREDIT | 145 | config.js import | — | ✅ |

**CHARGE_OPTIONS 정본이 config.js로 단일화됨. 3중 중복 해소.**

---

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `config.js` | CHARGE_OPTIONS + KRW_PER_CREDIT export 추가 |
| 2 | `shared.js` | CHARGE_OPTIONS + KRW_PER_CREDIT import/re-export 추가 |
| 3 | `modules/charge.js` | 로컬 CHARGE_OPTIONS 제거 → config.js import, 카드 디자인 charge.html 동기화, best 플래그 수정, renderChargeCards() export |
| 4 | `charge.html` | 인라인 CHARGE_OPTIONS 제거 → config.js import, renderChargeCards() 재사용, goBack 기본값 index, 사업자 정보 추가 |
| 5 | `index.html` | "패키지 할인 보기" 링크에 `?return=index` 추가 |

---

✅ 랜딩 디자인 확인 완료 (히어로+가격카드+배지+푸터)
✅ 충전 페이지 점검 완료 (카드/스테퍼/결제/돌아가기)
✅ ChargeModule 모달 기존재 확인 + 데이터 통합 + 디자인 동기화
✅ E2E 4개 흐름 전건 검증 통과
✅ CHARGE_OPTIONS 3중 중복 → config.js 단일화
💡 발견 수정: best 플래그 불일치, goBack 기본값 버그, 사업자 정보 누락, index.html return 파라미터 누락
📁 `monkos-ops/ops/reports/REPORT_20260305_막내2_Phase2_페이지뷰디자인.md`
