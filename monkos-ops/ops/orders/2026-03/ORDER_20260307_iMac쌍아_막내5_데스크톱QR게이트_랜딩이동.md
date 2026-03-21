---
type: order
date: 2026-03-07
from: iMac/쌍아
to: iMac/막내2
status: 발행
---

# 지시서: 데스크톱 QR 게이트를 랜딩 CTA로 이동

**[2026-03-07 18:54 KST] iMac/쌍아 → iMac/막내2**

## 배경

- 현재: 데스크톱에서 prep → camera까지 진행한 후에야 QR 블로커 표시
- 문제: prep에서 선택한 값은 sessionStorage라 모바일로 안 넘어감 → 시간 낭비
- 랜딩은 광고 페이지이므로 데스크톱에서 볼 수 있어야 함. CTA 버튼 클릭 시에만 분기

## 작업 내용

### 수정 대상: `index.html` (1파일만)

**1) CTA 링크를 JS 분기로 변경**

현재 (628번 줄 부근):
```html
<a class="hero-cta" href="/prep">촬영 시작하기 &rarr;</a>
```

변경:
```html
<a class="hero-cta" href="/prep" id="btn-hero-cta">촬영 시작하기 &rarr;</a>
```

**2) 데스크톱 블로커 HTML 추가**

`</body>` 직전(기존 `<script type="module">` 직전)에 추가:

```html
<!-- 데스크탑 차단 (CTA 클릭 시 표시) -->
<div id="desktop-blocker" style="display:none; position:fixed; inset:0; background:#030508; z-index:9999; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px;">
    <div style="font-size:48px; margin-bottom:24px;">📱</div>
    <h2 style="font-size:22px; font-weight:800; color:#F1F5F9; margin:0 0 12px;">스마트폰에서 이용해 주세요</h2>
    <p style="font-size:14px; color:#94A3B8; line-height:1.6; margin:0 0 24px;">AI 증명사진은 스마트폰의<br>전면 카메라로 촬영하는 전용 서비스입니다</p>
    <div style="background:#fff; padding:16px; border-radius:16px; display:inline-block;">
        <img id="qr-code" src="" alt="QR코드" width="180" height="180">
    </div>
    <div id="qr-url" style="margin-top:16px; font-size:12px; color:#64748B; background:rgba(255,255,255,0.06); padding:8px 16px; border-radius:8px;"></div>
</div>
```

**3) 스크립트에 분기 로직 추가**

기존 `<script type="module">` 블록을 확장:

```javascript
import { GOOGLE_CLIENT_ID, API } from './config.js';
import { initChatbot } from './modules/chatbot.js';
window.MONKOS_GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
window.MONKOS_PORTAL_URL = API.PORTAL_URL;
initChatbot();

// 데스크톱 QR 게이트
const cta = document.getElementById('btn-hero-cta');
if (cta) {
  cta.addEventListener('click', (e) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      const blocker = document.getElementById('desktop-blocker');
      const mobileUrl = 'https://idphoto-kr.monkos.ai/prep';
      document.getElementById('qr-code').src =
        `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mobileUrl)}&bgcolor=ffffff&color=000000`;
      document.getElementById('qr-url').textContent = mobileUrl;
      blocker.style.display = 'flex';
    }
  });
}
```

**QR URL은 `prep` 페이지**를 가리킴 — 모바일에서 QR 스캔 시 바로 준비실로 진입.

### 건드리지 않는 것

- camera.html의 기존 desktop-blocker — **유지** (직접 URL 접근 시 fallback)
- camera.js의 로그인 게이트 — **유지**
- shared.js, prep.js, result.js — **수정 금지**

## ⚠️ 준수 조항

- **헌법 8조**: 기존 코드 삭제 금지. index.html에 추가만
- **법률 2장**: index.html 1파일만 수정. 다른 파일 절대 건드리지 말 것
- **오늘 교훈**: 지정 파일 외 수정 = 연쇄 버그. 1파일만 수정할 것

## 산출물

- `monkos_AI/idphoto-kr/public/index.html` (수정)

## 커밋

```
[feat] 데스크톱 QR 게이트를 랜딩 CTA로 이동 — prep 전 차단
```
