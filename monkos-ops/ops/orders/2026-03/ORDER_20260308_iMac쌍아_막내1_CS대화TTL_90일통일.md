---
type: order
date: 2026-03-08
from: iMac/쌍아
to: 막내1
priority: P0
category: backend / hotfix
---

# 지시서: CS 대화 TTL 3년 → 90일 통일 수정

**[2026-03-08 17:29 KST] iMac/쌍아 → 막내1**

## 근거

작가님 확정 (본 세션 17:00경):
> "3년 의무는 거래장부에 관한 내용. 대화 데이터는 전 채널 90일 통일로 가보자"

- 전자상거래법 시행령 제6조 "소비자 불만·분쟁처리 기록 3년"은 **거래 장부**(payments, transactions 컬렉션)에 해당
- CS 대화 원문은 거래 장부가 아님 — 90일 보관으로 충분
- 거래 장부는 이미 Firestore `payments`, `transactions` 컬렉션에서 별도 관리 중이며 본 건 대상 아님

## 수정 내용

### 1. chat-engine.js

**L64 — `TTL_3_YEARS` 상수 삭제:**
```javascript
// 삭제
const TTL_3_YEARS = 3 * 365 * 24 * 60 * 60 * 1000;
```

**L98 — 주석 수정:**
```javascript
// 변경 전
// === Firestore CS 대화 로깅 (3년 TTL) ===

// 변경 후
// === Firestore CS 대화 로깅 (90일 TTL) ===
```

**L106 — expireAt 수정:**
```javascript
// 변경 전
const expireAt = new Date(Date.now() + TTL_3_YEARS);

// 변경 후
const expireAt = new Date(Date.now() + TTL_90_DAYS);
```

### 2. firestore_ttl_migrate.js (마이그레이션 스크립트)

cs_conversations도 동일하게 90일 기준 적용 확인.

## ⚠️ 준수 조항

- 이 수정은 작가님 직접 확정에 따른 것임
- 거래 장부(payments, transactions)는 절대 건드리지 말 것

## 보고 형식

```
✅ logCsConversation TTL 90일 통일 완료
✅ TTL_3_YEARS 상수 제거
📁 chat-engine.js
```
