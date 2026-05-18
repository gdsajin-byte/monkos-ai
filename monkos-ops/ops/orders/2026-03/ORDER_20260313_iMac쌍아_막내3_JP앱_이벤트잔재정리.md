---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내3
status: pending
---

# 지시서: JP앱 — 폐지 이벤트 잔재 정리 (약관/정책/코드)

## 배경
현재 운영 이벤트: **"첫 로그인 10c"만** 존재.
SNS 공유 100c, 텔레그램 채널 40c — 전부 폐지.
JP앱 약관·정책 페이지, server.js, thankyou.js에 폐지된 이벤트 코드가 남아있다.

## 작업 대상

### 1. `monkos_AI/idphoto-jp/public/terms.html`
- **L67 수정**: `<li><strong>シェアボーナス</strong>：SNSシェア時に10クレジット付与</li>`
  → 이 줄 제거

### 2. `monkos_AI/idphoto-jp/public/credits-policy.html`
- **L160 수정**: `<tr><td>無料付与クレジット</td><td>登録/シェアボーナス</td><td>返金対象外</td></tr>`
  → `<tr><td>無料付与クレジット</td><td>登録ボーナス</td><td>返金対象外</td></tr>`

### 3. `monkos_AI/idphoto-jp/public/refund.html`
- **L65 수정**: `<tr><td>無料付与クレジット</td><td>登録ボーナス、シェアボーナス</td><td>返金対象外</td></tr>`
  → `<tr><td>無料付与クレジット</td><td>登録ボーナス</td><td>返金対象外</td></tr>`

### 4. `monkos_AI/idphoto-jp/server.js` — 공유 보너스 코드 제거

#### (A) grantShareBonus 함수 제거 (L97~110 부근)
```javascript
async function grantShareBonus(userId, platform) { ... }
```
→ 전체 삭제

#### (B) share-bonus 엔드포인트 제거 (L697~707 부근)
```javascript
// シェアボーナス
app.post('/api/credit/share-bonus', async (req, res) => { ... });
```
→ 전체 삭제

#### (C) 시작 로그 제거 (L815 부근)
```javascript
log('  POST /api/credit/share-bonus — シェアボーナス');
```
→ 제거

### 5. `monkos_AI/idphoto-jp/public/thankyou.js` — SNS 이벤트 로직 제거

#### (A) setupSnsEvent 함수 제거 (L170~196 부근)
```javascript
function setupSnsEvent() { ... }
```
→ 전체 삭제

#### (B) setupSnsEvent() 호출 제거 (L237 부근)
```javascript
setupSnsEvent();
```
→ 제거

### 6. `monkos_AI/idphoto-jp/public/thankyou.html` — SNS 이벤트 CSS 제거

- **L276~321 부근**: `.ty-event-card`, `.ty-event-btn`, `.ty-event-header`, `.ty-event-badge` 등 이벤트 카드 CSS
  → 전체 삭제 (해당 HTML 마크업도 없으므로 완전 불용 코드)

## ⚠️ 준수 조항
- 헌법 8조: 파괴적 명령 금지 — 정밀 제거만, 주변 코드 손상 금지
- 법률 2장: 기존 파일 구조 유지

## 완료 기준
- [ ] terms.html — シェアボーナス 라인 제거
- [ ] credits-policy.html — "登録/シェアボーナス" → "登録ボーナス"
- [ ] refund.html — "登録ボーナス、シェアボーナス" → "登録ボーナス"
- [ ] server.js — grantShareBonus + 엔드포인트 + 로그 제거
- [ ] thankyou.js — setupSnsEvent 함수 + 호출 제거
- [ ] thankyou.html — 이벤트 카드 CSS 제거
- [ ] 기존 기능(다운로드, 크롭, 풀샷 등 thankyou 핵심 기능) 정상 동작 확인
- [ ] 완료 보고
