---
type: order
date: 2026-03-01
from: iMac/쌍아
to: iMac/막내
priority: P2.1 (P2 핫픽스)
status: pending
---

# P2.1 — 단품 보너스 +10c 반영 + 소액충전 스테퍼

## 배경

P2 배포 후 철창이 Pricing v2.1 대조 결과 2건 누락 발견:
1. 단품(₩9,900) credits가 70으로 설정됨 → **80이어야 함** (+10c 보너스 포함)
2. 소액충전 `[ - ] 10c [ + ]` 스테퍼 미구현

### 10c 보너스 설계 의도 (작가님 직접 설명)
- 기존 로그인 유저가 0c에서 진입 → 70c 충전 시 생성(10c) 후 다운로드(70c) 모자람 → **2중충전 짜증 방지**
- 70c에 +10c 보너스 → "생색" + 딱 맞추려는 사용자도 자연히 **엔딩(ThankYou)까지 흐름 유도**
- 엔딩에서 10c 잔여 → 추가규격(10c) 즉시 소진 확률 높음 → **업셀 마중물**

---

## Task 1: charge.js — 단품 credits 70 → 80

**파일**: `monkos_AI/idphoto-kr/public/modules/charge.js`

### 변경 내용
```javascript
// AS-IS (line 14)
credits: 70,

// TO-BE
credits: 80,
```

### UI 라벨도 수정
- 현재 desc: `'생성 + 다운로드 1회'`
- 변경: `'생성 + 다운로드 1회 (보너스 +10c)'`

---

## Task 2: portal config.js — TOSS_AMOUNT_CREDITS 매핑 수정

**파일**: `monkos_AI/portal/lib/shared/config.js`

### 변경 내용
```javascript
// AS-IS (line 81)
9900: 70,

// TO-BE
9900: 80,
```

> ⚠️ 이 매핑이 안 맞으면 결제 후 크레딧 지급이 70c로 됨. 반드시 동기화.

---

## Task 3: charge.js — 소액충전 10c 스테퍼 추가

**파일**: `monkos_AI/idphoto-kr/public/modules/charge.js`

### 위치
3단 패키지 아래, 결제 버튼 위에 삽입.

### UI 명세
```
── 또는 소액 충전 ──
[ - ]  10c (₩1,450)  [ + ]
        최소 10c · 최대 100c
```

### 동작
- 기본값: 10c / ₩1,450
- 스텝: 10c 단위
- 범위: 10c(₩1,450) ~ 100c(₩14,500)
- `[ - ]` / `[ + ]` 탭으로 수량 조절
- 패키지 라디오와 **배타적 선택**: 스테퍼 터치 시 패키지 라디오 해제, 패키지 선택 시 스테퍼 리셋
- 결제 버튼 클릭 시: 스테퍼 활성 → `buyCreditsKR(amount, credits)` 호출

### 구현 가이드
```javascript
// 스테퍼 상태
let _stepperActive = false;
let _stepperQty = 1; // 10c 단위 (1=10c, 2=20c, ..., 10=100c)
const STEP_UNIT = 10;   // credits
const STEP_PRICE = 1450; // KRW per 10c

// 결제 버튼 클릭 핸들러 수정
overlay.querySelector('#chargePayBtn').addEventListener('click', () => {
  if (_stepperActive) {
    ChargeModule.close();
    buyCreditsKR(_stepperQty * STEP_PRICE, _stepperQty * STEP_UNIT);
  } else {
    const opt = CHARGE_OPTIONS[_chargeIdx];
    ChargeModule.close();
    buyCreditsKR(opt.amount, opt.credits);
  }
});
```

### 스타일
- 디자인: 기존 charge.js 모달 톤 유지 (dark theme, #a78bfa 악센트)
- 분리선: `── 또는 소액 충전 ──` (기존 `── 패키지 충전 ──`과 동일 스타일)
- 버튼: 원형 `-` `+`, 가운데 수량·금액 표시

---

## Task 4: portal config.js — 소액충전 금액 매핑 추가

**파일**: `monkos_AI/portal/lib/shared/config.js`

### TOSS_AMOUNT_CREDITS에 추가
```javascript
// 소액충전 (10c 단위, ₩1,450/10c)
2900: 20,    // 20c
4350: 30,    // 30c
5800: 40,    // 40c
7250: 50,    // 50c
8700: 60,    // 60c
10150: 70,   // 70c — 이미 존재
11600: 80,   // 80c — 이미 존재
13050: 100,  // 100c — 이미 존재 (90c=13050 아님 주의)
```

> 기존 `1450: 10`은 이미 존재. 10150/11600/13050도 이미 있음.
> **추가 필요**: 2900, 4350, 5800, 7250, 8700 (+ 12325: 90 추가)

실제 필요 매핑:
```
1450: 10   (이미 있음)
2900: 20   (추가)
4350: 30   (추가)
5800: 40   (추가)
7250: 50   (추가)
8700: 60   (추가)
10150: 70  (이미 있음)
11600: 80  (이미 있음)
13050: 90  (추가 — 현재 13050:100 은 오류, 90c가 맞음)
14500: 100 (추가)
```

> ⚠️ 기존 `13050: 100`은 산수 오류 (₩1,450 × 9 = ₩13,050 = 90c). **13050: 90으로 수정, 14500: 100 추가**.

---

## 배포

1. `monkos_AI/idphoto-kr/` → Cloud Run (idphoto-kr)
2. `monkos_AI/portal/` → Cloud Run (portal)
3. 배포 후 리비전명 보고

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키, 시크릿 등 절대 생성/추측 금지
- **헌법 1조**: 보고서 타임스탬프 `date` 명령 사용
- **헌법 2조**: 완료 보고 `✅❌💡⏳📁🔀` 형식

---

## 체크리스트

- [ ] charge.js 단품 credits: 70 → 80
- [ ] charge.js 단품 desc 보너스 문구 추가
- [ ] portal config.js TOSS_AMOUNT_CREDITS 9900: 70 → 80
- [ ] charge.js 소액충전 스테퍼 UI 추가
- [ ] charge.js 패키지/스테퍼 배타적 선택 로직
- [ ] portal config.js 소액충전 금액 매핑 추가 (2900~14500)
- [ ] portal config.js 13050: 100 → 90 수정
- [ ] 양쪽 배포 + 리비전명 보고
