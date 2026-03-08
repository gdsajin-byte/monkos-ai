---
type: ORDER
date: 2026-02-27
time: "16:30 KST"
from: iMac/쌍아
to: 막내1
task_id: KAKAO_LOGIN_POSTMSG_FIX
priority: P0
ref:
  - monkos_AI/idphoto-kr/public/index.html
  - monkos_AI/portal/lib/auth.js
---

# 카카오/LINE 로그인 postMessage origin 불일치 수정

> **[2026-02-27 16:30 KST] iMac/쌍아 → 막내1**
> 앱(idphoto-kr)에서 카카오/LINE 로그인 시 인증 후 postMessage가 앱으로 돌아오지 않는 버그.
> redirect_app=idphoto-kr (문자열) vs ALLOWED_POPUP_ORIGINS (전체 URL) 불일치.

---

## 원인

1. 앱이 `redirect_app=idphoto-kr` (짧은 문자열)을 보냄
2. 포탈 콜백에서 `ALLOWED_POPUP_ORIGINS.includes('idphoto-kr')` → false
3. targetOrigin이 `'https://monkos.ai'`로 폴백
4. `postMessage(data, 'https://monkos.ai')` → 수신자 `https://idphoto-kr.monkos.ai` → origin 불일치, 메시지 드랍

## 수정

### 방법: idphoto-kr 프론트에서 전체 origin 전달

`monkos_AI/idphoto-kr/public/index.html`:

```javascript
// 변경 전
'/auth/kakao?popup=1&redirect_app=idphoto-kr'
'/auth/line?popup=1&redirect_app=idphoto-kr'

// 변경 후
'/auth/kakao?popup=1&redirect_app=' + encodeURIComponent(window.location.origin)
'/auth/line?popup=1&redirect_app=' + encodeURIComponent(window.location.origin)
```

loginKakao(), loginLine() 양쪽 모두 수정 (팝업 URL + 폴백 URL 총 4곳).

### 포탈 auth.js는 수정 불필요

`ALLOWED_POPUP_ORIGINS`에 이미 `'https://idphoto-kr.monkos.ai'`가 포함되어 있으므로,
전체 URL이 오면 includes 체크 통과 → 올바른 targetOrigin으로 postMessage 전달.

---

## 커밋 규칙

- 커밋 메시지: `[fix] 카카오/LINE 로그인 postMessage origin 불일치 수정`
- idphoto-kr만 배포
- 커밋 + push 승인 요청
