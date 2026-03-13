---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내2
status: pending
---

# 지시서: KR앱 — 폐지 이벤트 잔재 정리 (약관/정책/코드)

## 배경
현재 운영 이벤트: **"첫 로그인 10c"만** 존재.
SNS 공유 보너스, 텔레그램/카카오 채널 보너스 — 전부 폐지.
KR앱 약관·정책 페이지와 server.js에 폐지된 이벤트 코드가 남아있다.

## 작업 대상

### 1. `monkos_AI/idphoto-kr/public/terms.html`
- **L67 수정**: `<li><strong>공유 보너스</strong>: SNS 공유 시 70 크레딧 지급</li>`
  → 이 줄 제거

### 2. `monkos_AI/idphoto-kr/public/credits-policy.html`
- **L187 수정**: `<tr><td>무료 지급 크레딧</td><td>가입/공유 보너스</td><td>환불 대상 아님</td></tr>`
  → `<tr><td>무료 지급 크레딧</td><td>가입 보너스</td><td>환불 대상 아님</td></tr>`

### 3. `monkos_AI/idphoto-kr/public/refund.html`
- **L65 수정**: `<tr><td>무료 지급 크레딧</td><td>가입 보너스, 공유 보너스</td><td>환불 대상 아님</td></tr>`
  → `<tr><td>무료 지급 크레딧</td><td>가입 보너스</td><td>환불 대상 아님</td></tr>`

### 4. `monkos_AI/idphoto-kr/server.js` — 공유 보너스 코드 제거

#### (A) grantShareBonus 함수 제거 (L96~110 부근)
```javascript
async function grantShareBonus(userId, platform) { ... }
```
→ 전체 삭제

#### (B) share-bonus 엔드포인트 제거 (L691~700 부근)
```javascript
// 공유 보너스
app.post('/api/credit/share-bonus', async (req, res) => { ... });
```
→ 전체 삭제

#### (C) 시작 로그 제거 (L767 부근)
```javascript
log('  POST /api/credit/share-bonus — 공유 보너스');
```
→ 제거

### 5. Portal 페이지도 함께 처리

#### `monkos_AI/portal/public/terms.html`
- **L62 수정**: `<li><strong>공유 보너스</strong>: SNS 공유 시 8 크레딧 지급</li>`
  → 이 줄 제거

#### `monkos_AI/portal/public/refund.html`
- **L60 수정**: `<tr><td>무료 지급 크레딧</td><td>가입 보너스, 공유 보너스</td><td>환불 대상 아님</td></tr>`
  → `<tr><td>무료 지급 크레딧</td><td>가입 보너스</td><td>환불 대상 아님</td></tr>`

## ⚠️ 준수 조항
- 헌법 8조: 파괴적 명령 금지 — 코드 삭제 시 해당 함수/엔드포인트만 정밀 제거, 주변 코드 손상 금지
- 법률 2장: 기존 파일 구조 유지

## 완료 기준
- [ ] terms.html (KR, Portal) — 공유 보너스 라인 제거
- [ ] credits-policy.html (KR) — "가입/공유 보너스" → "가입 보너스"
- [ ] refund.html (KR, Portal) — "가입 보너스, 공유 보너스" → "가입 보너스"
- [ ] server.js — grantShareBonus 함수 + 엔드포인트 + 로그 제거
- [ ] 기존 기능(로그인, 크레딧 조회, 결제 등) 정상 동작 확인
- [ ] 완료 보고
