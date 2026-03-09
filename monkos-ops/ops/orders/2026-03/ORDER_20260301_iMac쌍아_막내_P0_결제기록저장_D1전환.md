---
type: ORDER
date: 2026-03-01
from: iMac/쌍아
to: 막내 (배정 대기)
priority: P0
scope: 포털 백엔드 수정 (monkos_AI/portal/)
---

# 지시서: P0 — 결제 기록 저장 + D1→Firestore 전환

> **[2026-03-01 14:16 KST] iMac/쌍아 → 막내**
> **긴급도**: P0 — 데이터 유실 중
> **범위**: `monkos_AI/portal/lib/` 내 4개 파일
> **배포**: Cloud Run `monkos-portal` 재배포 필요

---

## 배경

막내1 DB 조사(REPORT_20260301)에서 발견:
- Firestore `payments` 컬렉션: **0건** — 토스 로그인 결제가 기록되지 않음
- `lastPurchase` 타임스탬프만 존재, 결제 상세(금액·PG사·paymentKey) 미저장
- D1 거래원장: `TX_API_KEY` 환경변수 미설정 시 조용히 무시 → 원장 유실

인프라 결정: **D1 제거, Firestore 단일 라인으로 통일** (작가님 확정 2026-03-01)

---

## 작업 1: 토스 결제 기록 Firestore 저장

### 대상 파일
`monkos_AI/portal/lib/payments.js`

### 현재 문제
`handleTossConfirm` (라인 213~224):
```javascript
// 현재: lastPurchase만 저장
tx.update(userRef, { credits, lastPurchase: new Date().toISOString() });
```
비로그인 직결제 `handleTossDirect` (라인 282~292)는 `payments` 컬렉션에 기록하지만, 로그인 결제는 안 함.

### 수정 내용
토스 결제 confirm 성공 후, Firestore `payments` 컬렉션에 결제 상세 저장:

```javascript
// 트랜잭션 외부 (tx.update 이후)에서 저장
await firestore.collection('payments').add({
  type: 'toss_confirm',
  userId,
  orderId,
  amount,        // 원화 금액
  paymentKey,
  creditsAdded,  // 지급된 크레딧
  balanceAfter: credits,  // 지급 후 잔액
  createdAt: new Date().toISOString(),
});
```

### 주의사항
- 기존 트랜잭션(`tx.update`) 로직은 건드리지 않음
- `payments.add()`는 트랜잭션 외부에서 실행 (결제 확인 완료 후)
- 기존 비로그인 직결제(라인 282~292)는 이미 정상 → 수정 불필요

---

## 작업 2: D1 → Firestore `transactions` 컬렉션 전환

### 대상 파일
`monkos_AI/portal/lib/shared/config.js`

### 현재 문제
`logTransaction` (라인 198~205):
```javascript
export function logTransaction(...) {
  if (!TX_API_KEY) return;  // ← 환경변수 없으면 무시
  fetch(TX_API_URL, { ... }).catch(...);  // ← D1 HTTP 호출
}
```

### 수정 내용
D1 HTTP 호출 → Firestore `transactions` 컬렉션 직접 저장:

```javascript
export async function logTransaction({ userId, amount, type, service = 'portal', provider = 'system', balanceAfter, description, referenceId, metadata }) {
  try {
    await firestore.collection('transactions').add({
      userId,
      amount,
      type,           // 'use' | 'charge' | 'event' | 'refund'
      service,
      provider,       // 'system' | 'toss' | 'lemon' | 'mission'
      balanceAfter,
      description,
      referenceId,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[TX] 원장 기록 실패: ${err.message}`);
  }
}
```

### 핵심 변경점
- `fetch(TX_API_URL)` 제거 → `firestore.collection('transactions').add()` 대체
- `if (!TX_API_KEY) return` 가드 제거 — 항상 기록
- fire-and-forget 유지 (catch로 에러 흡수, 본 트랜잭션은 영향 없음)
- `TX_API_URL`, `TX_API_KEY` 환경변수는 더 이상 불필요 → 제거하지 말고 방치 (향후 정리)

### 호출처 (6곳, 수정 불필요)
logTransaction 시그니처가 동일하므로 호출처 변경 없음:
- `payments.js:121` — Lemon Squeezy 결제
- `payments.js:146` — 환불
- `payments.js:227` — Toss 결제
- `events.js:179` — 미션 완료
- `events.js:362` — 이벤트 크레딧
- `credits.js:86` — 크레딧 사용
- `credits.js:128` — 환불

---

## 작업 3: firestore 임포트 확인

`config.js`에서 `firestore`가 이미 export되어 있음 (라인 57~58):
```javascript
export const firestore = new Firestore({ projectId: PROJECT_ID });
```

`logTransaction` 함수가 같은 파일에 있으므로 추가 임포트 불필요. 다만 `logTransaction`이 `async`로 변경되므로, 호출처에서 `await`를 붙이지 않아도 동작하는지 확인:
- 현재 호출처 전부 `logTransaction({...})` (await 없이 호출) → fire-and-forget이므로 문제 없음

---

## 검증

### 배포 전
1. 로컬에서 Firestore 에뮬레이터 또는 실DB로 테스트:
   - `payments` 컬렉션에 토스 결제 기록이 저장되는지
   - `transactions` 컬렉션에 크레딧 사용/충전/이벤트 기록이 저장되는지
2. 기존 크레딧 차감/환불 로직이 정상 동작하는지 (logTransaction 시그니처 동일 확인)

### 배포 후
1. 테스트 결제 1건 실행 → Firestore 콘솔에서 `payments`, `transactions` 컬렉션 확인
2. 크레딧 사용 → `transactions` 컬렉션에 기록 확인
3. 기존 기능 정상 동작 확인 (로그인, 크레딧 조회 등)

---

## 산출물

- 수정 파일 목록 + 변경 내역 보고
- Cloud Run 배포 리비전
- Firestore `payments`, `transactions` 컬렉션 기록 확인 스크린샷 또는 gcloud 쿼리 결과

---

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: Firestore 기존 컬렉션(users 등) 구조 변경 금지. 새 컬렉션(`transactions`) 추가만
- **헌법 제8조 (파괴적 명령 금지)**: 기존 데이터 삭제 금지
- **헌법 제10조 (프록시 금지)**: D1 HTTP 우회 제거가 목적. Firestore 직접 기록
- **헌법 제2조 (완료 보고)**: `✅❌💡⏳📁🔀` 형식 보고

---

**[2026-03-01 14:16 KST] iMac/쌍아 발행**
