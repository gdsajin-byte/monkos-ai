---
type: ORDER
date: 2026-02-25
from: iMac/쌍아
to: 막내2
status: pending
priority: normal
---

# 지시서: idphoto-kr 헤더 모듈 고도화 — 프론트엔드

**[2026-02-25 15:52 KST] iMac/쌍아 → 막내2**

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내2 → iMac/쌍아` 형식

## 배경

막내1이 포털 헤더 기능을 idphoto-kr에 이식 완료(1dd9f62). 철창이 기획안에 따라 헤더를 고도화한다.

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/idphoto-kr/public/index.html` | 작업 대상 (메인 랜딩) |
| `monkos_AI/idphoto-kr/public/config.js` | API 설정 |
| `monkos_AI/idphoto-kr/public/shared.js` | 공통 로직 (인증/크레딧) |
| `monkos_AI/portal/public/index.html` | 참조 (포털 OAuth/크레딧 구현) |

## 작업 내용

### 1. OAuth 선택 모달 구현

현재 로그인 버튼이 `location.href='https://monkos.ai'`로 페이지 이탈됨. **페이지 이탈 없는 OAuth**로 변경.

**로그인 버튼 클릭 시:**

```
[로그인 버튼 탭]
    ↓
[OAuth 선택 모달 팝업]
    ├── Google로 로그인    → GIS 팝업 (클라이언트 직접)
    ├── 카카오로 로그인     → window.open 팝업 → 포털 OAuth
    └── LINE으로 로그인     → window.open 팝업 → 포털 OAuth
```

**Google OAuth (GIS 팝업):**
- 포털의 Google OAuth 로직 참조 (`portal/public/index.html` lines 1415-1612)
- GIS 스크립트 동적 로드 → `initTokenClient` → `requestAccessToken`
- 콜백에서 `fetch('https://monkos.ai/api/auth/google', ...)` POST
- 응답의 user 정보를 localStorage에 저장

**Kakao/LINE OAuth (팝업 윈도우):**
```javascript
function loginKakao() {
    const popup = window.open(
        'https://monkos.ai/auth/kakao?popup=1&redirect_app=idphoto-kr',
        'kakao-login',
        'width=500,height=600'
    );
    // postMessage 리스너로 토큰 수신
    window.addEventListener('message', function handler(e) {
        if (e.origin !== 'https://monkos.ai') return;
        if (e.data.type === 'auth-success') {
            localStorage.setItem('monkos_user', JSON.stringify(e.data.user));
            localStorage.setItem('monkos_token', e.data.token);
            updateAuthUI();
            window.removeEventListener('message', handler);
        }
    });
}
```
- LINE도 동일 패턴 (`/auth/line?popup=1&redirect_app=idphoto-kr`)
- **막내3이 포털 서버에 팝업 콜백 지원을 추가할 예정** — 서버 작업 완료 전에는 기존 리다이렉트 폴백 유지

**모달 UI:**
```html
<div class="login-modal" id="loginModal">
    <div class="login-modal-content">
        <button class="login-close" onclick="closeLoginModal()">&times;</button>
        <h3>로그인</h3>
        <button class="login-google" onclick="loginGoogle()">
            <svg>G아이콘</svg> Google로 로그인
        </button>
        <button class="login-kakao" onclick="loginKakao()">
            <svg>K아이콘</svg> 카카오로 로그인
        </button>
        <button class="login-line" onclick="loginLine()">
            <svg>L아이콘</svg> LINE으로 로그인
        </button>
    </div>
</div>
```
- 포털의 로그인 모달 디자인 참조 (lines 1398-1413)
- 모바일 하단 시트 스타일 (기존 챗봇 패널과 일관)

### 2. 크레딧 버튼 3상태 분기

| 상태 | 표시 | 색상 | 클릭 동작 |
|------|------|------|----------|
| 비로그인 | `[로그인]` | 기본 (보라) | OAuth 모달 |
| 로그인 + 0크레딧 | `[💎 0]` | **오렌지** (#FF6B35) | 충전 페이지 이동 |
| 로그인 + N크레딧 | `[💎 N]` | 기본 (보라) | 충전 페이지 이동 |

**구현:**
```javascript
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('monkos_user'));
    if (!user) {
        // 비로그인
        loginBtn.style.display = 'block';
        creditBtn.style.display = 'none';
        return;
    }
    loginBtn.style.display = 'none';
    creditBtn.style.display = 'flex';
    creditCount.textContent = user.credits ?? 0;

    // 0크레딧 강조
    if (!user.credits || user.credits <= 0) {
        creditBtn.classList.add('credit-empty');  // 오렌지 배경
    } else {
        creditBtn.classList.remove('credit-empty');
    }
}
```

**CSS:**
```css
.credit-btn.credit-empty {
    background: #FF6B35;
    animation: pulse-subtle 2s infinite;
}
```

### 3. sessionStorage → localStorage 전환

현재 `sessionStorage.getItem('monkos_user')` → `localStorage`로 전환.

- **변경 대상**: index.html 내 인라인 JS + shared.js
- **토큰 저장**: `localStorage.setItem('monkos_token', token)`
- **만료 체크**: 페이지 로드 시 토큰 만료 확인 → 만료 시 자동 로그아웃
```javascript
function checkTokenExpiry() {
    const token = localStorage.getItem('monkos_token');
    if (!token) return;
    try {
        const payload = JSON.parse(atob(token.split('.')[0] || token));
        if (payload.exp && payload.exp < Date.now()) {
            localStorage.removeItem('monkos_user');
            localStorage.removeItem('monkos_token');
            updateAuthUI();
        }
    } catch(e) {
        // 토큰 파싱 실패 시 제거
        localStorage.removeItem('monkos_user');
        localStorage.removeItem('monkos_token');
    }
}
```
- **탭 복귀 시 크레딧 갱신** (shared.js의 visibilitychange 리스너 활용)

### 4. 비로그인 체험 플로우

기획안 설계: 촬영~워터마크 프리뷰까지 무료, 다운로드 시점에 로그인+크레딧 게이트.

**확인 후 구현:**
1. shared.js의 다운로드 함수에서 `monkos_user` 체크 여부 확인
2. 미로그인 시 다운로드 차단 → OAuth 모달 팝업
3. 로그인 후 크레딧 0이면 충전 페이지로 안내

```javascript
function downloadGate() {
    const user = JSON.parse(localStorage.getItem('monkos_user'));
    if (!user) {
        // 미로그인 → OAuth 모달
        openLoginModal();
        return false;
    }
    if (!user.credits || user.credits < CREDIT_COST.download) {
        // 크레딧 부족 → 토스트 알림 + 충전 유도
        showToast('크레딧이 부족합니다. 충전 후 다운로드하세요.', 'warning');
        setTimeout(function() { location.href = 'https://monkos.ai/credits'; }, 1500);
        return false;
    }
    return true;
}
```

**토스트 컴포넌트 구현 (alert 사용 금지):**
- 기존 챗봇 패널/로그인 모달과 톤 일관성을 위해 **네이티브 alert() 대신 커스텀 토스트** 사용
- 하단 토스트 스타일 (모바일 하단 시트와 일관)
- warning(오렌지) / info(보라) / error(레드) 3종

### 5. 로그아웃 기능

현재 로그아웃 버튼 없음. 추가:
- 크레딧 버튼 탭 시 로그아웃 팝오버는 **불필요** (기획안에 없음)
- 대신 충전 페이지(포털)에서 로그아웃 가능
- idphoto-kr에서는 로그아웃 미노출 (기획안 의도: 간결한 헤더)

## ⚠️ 준수 조항

- **헌법 제6조**: Google 클라이언트 ID는 포털 코드에서 참조. 하드코딩 금지 — config.js에서 관리.
- **헌법 제4조**: 내부 기술명(Google/Firebase) 사용자에게 노출 금지. 버튼 텍스트는 "Google로 로그인" (서비스명은 허용).
- **ch2 코딩 규칙**: ES5 호환 (기존 코드가 ES5). `let/const`, 화살표 함수 사용 시 기존 패턴 확인.
- 포털 서버 코드(`monkos_AI/portal/`) **수정 금지** — 서버는 막내3 범위.

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | `monkos_AI/idphoto-kr/public/index.html` 외 수정 파일 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
