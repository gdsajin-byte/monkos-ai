---
type: order
date: 2026-06-19
from: iMac/쌍아
to: iMac/막내
portfolio:
status: 완료
---

# 지시서: GA4 purchase 이벤트 value:0 버그 수정

> **[2026-06-19 10:35 KST]** iMac/쌍아 → 막내
> 근거: 웹민아 E2E 브리핑(BRIEFING_E2E_20260619) — PR #86 후속 식별
> 작가님 승인: 2026-06-19 10:35 KST

---

## 목적

thankyou.js의 GA4 `purchase` 이벤트에서 `value: 0`이 하드코딩되어 있어, 결제 전환 매출이 GA4에 0원으로 기록된다. 실제 크레딧 소비에 해당하는 금액으로 수정하여 GA4 결제 퍼널 측정을 복구한다.

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: 시크릿/API키 생성·추측 금지
- **ch5 2조**: 배포 필요 시 deploy.sh 경유
- **ch2 코딩**: 순수 JS, camelCase, 한국어 주석

---

## 수정 대상 (2개 서비스)

### 1. idphoto-kr — `monkos_AI/idphoto-kr/public/thankyou.js:182`

**현재 (버그)**:
```js
if (typeof gtag === 'function') gtag('event', 'purchase', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', value: 0, currency: 'KRW', transaction_id: `ty_${Date.now()}` });
```

**수정**:
- `value: 0` → `value: CREDIT_COST.download * KRW_PER_CREDIT`
- `CREDIT_COST`와 `KRW_PER_CREDIT`은 이미 `config.js`에서 export, `shared.js`에서 re-export됨
- thankyou.js 상단 import에 `CREDIT_COST`, `KRW_PER_CREDIT` 추가 필요 (현재 미임포트)
- 계산값: 70 × 145 = 10,150 (KRW)

### 2. idphoto-jp — `monkos_AI/idphoto-jp/public/thankyou.js:228`

**현재 (동일 버그)**:
```js
if (typeof gtag === 'function') gtag('event', 'purchase', { ... value: 0, currency: 'JPY', ... });
```

**수정**:
- `value: 0` → `value: CREDIT_COST.download * JPY_PER_CREDIT`
- JP config.js에 `JPY_PER_CREDIT = 15` 존재. import 추가 필요
- 계산값: 70 × 15 = 1,050 (JPY)

---

## 확인 사항

- `begin_checkout` 이벤트(result.js)에는 value 필드가 없음 — 이건 정상 (체크아웃 시작이므로). 건드리지 말 것
- studio/thankyou.js에는 GA4 purchase 이벤트 자체가 없음 — 범위 밖

---

## 완료 기준

1. idphoto-kr thankyou.js에서 purchase value가 `CREDIT_COST.download * KRW_PER_CREDIT`으로 전송됨
2. idphoto-jp thankyou.js에서 purchase value가 `CREDIT_COST.download * JPY_PER_CREDIT`으로 전송됨
3. 기존 동작(사진 표시, 다운로드, 전후비교 등) 영향 없음
4. 배포는 본 지시서 범위 밖 — 수정 커밋까지
