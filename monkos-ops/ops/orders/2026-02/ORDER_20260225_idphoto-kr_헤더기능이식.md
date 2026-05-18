---
type: ORDER
date: 2026-02-25
from: iMac/쌍아
to: 막내
status: pending
priority: high
---

# 지시서: idphoto-kr 랜딩 헤더 기능 이식

**[2026-02-25 14:58 KST] iMac/쌍아 → 막내**

## 배경

`idphoto-kr.monkos.ai`(증명사진 앱) 랜딩 페이지 헤더에 로그인/크레딧/챗봇 기능이 없음.
포털(`monkos.ai`)에는 전부 구현되어 있으나 `idphoto-kr/public/index.html`은 로고만 존재.

### 현재 상태 (idphoto-kr/public/index.html:418~423)
```html
<header>
  <div class="logo">
    <img src="/monkos-icon.svg" alt="MONKOS" width="28" height="28">
    <span>MONKOS</span>
  </div>
</header>
```

### 목표 상태
```
┌─────────────────────────────────────────┐
│ [🔮 MONKOS ?]          [로그인] 또는 [💎 80 👤] │
│  ↑ 클릭→챗봇            ↑ 비로그인/로그인 상태    │
└─────────────────────────────────────────┘
```

## 작업 범위

### 1. 헤더 HTML 확장
- **대상 파일**: `monkos_AI/idphoto-kr/public/index.html`
- 좌측: 로고를 `logo-chat-trigger`로 감싸고 `logo-bubble`(?) 추가 — 클릭 시 챗봇 토글
- 우측: `auth-area` 추가
  - 비로그인: `로그인` 버튼 (포털 로그인 페이지로 이동)
  - 로그인: 크레딧 표시 (`💎 N`) + 프로필 아이콘

### 2. 헤더 CSS 추가
- 포털(`monkos_AI/portal/public/index.html` 126~280줄) 참조하여 동일 디자인 유지
- 모바일 우선 (idphoto-kr은 모바일 앱)
- `header { display: flex; justify-content: space-between; align-items: center; }`

### 3. 인증 상태 표시 (JS)
- `index.html`은 ES module을 사용하지 않는 정적 페이지
- `sessionStorage.getItem('monkos_user')` 확인하여 로그인 상태 판별
- 비로그인 시: `로그인` 버튼 표시 → 클릭 시 `https://monkos.ai` 포털로 이동 (로그인 후 리다이렉트)
- 로그인 시: 크레딧 + 프로필 아이콘 표시

### 4. 챗봇 패널 추가
- 포털(`monkos_AI/portal/public/index.html` 854~945, 1367~1398, 2295~2398줄) 참조
- 챗봇 API: `https://monkos.ai/api/chat` (POST, { message, sessionId, lang })
- 로고 클릭 → 챗봇 패널 토글
- 모바일: 하단 시트 스타일 (width: 100vw, border-radius: 16px 16px 0 0)

## 참조 코드 (포털에서 복사할 부분)

| 기능 | 포털 파일 | 라인 |
|------|-----------|------|
| 헤더 HTML | portal/public/index.html | 1182~1216 |
| 헤더 CSS | portal/public/index.html | 126~280 |
| 챗봇 HTML | portal/public/index.html | 1367~1398 |
| 챗봇 CSS | portal/public/index.html | 854~945 |
| 챗봇 JS | portal/public/index.html | 2295~2398 |
| 인증 UI | portal/public/index.html | 1624~1663 |

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: API 키, 비밀번호 절대 하드코딩 금지
- **헌법 제4조 (4 MUSE 비공개)**: 챗봇 표기는 "MONKOS AI"로만
- **헌법 제9조 (I2I 정체성)**: 해당 없음
- **헌법 제10조 (프록시 금지)**: 챗봇 API 호출 시 포털 URL 직접 사용 (프록시 경유 금지)
- **법률 제2장 (코딩 규칙)**: 인라인 `<script>` 블록에 추가 (index.html은 ES module 미사용)

## 주의사항

- `index.html`의 `<script>` 블록(579~595줄)은 fade-in observer뿐. 여기에 인증/챗봇 JS 추가
- `shared.js`는 ES module이라 index.html에서 직접 import 불가 → 인라인으로 경량 구현
- 포털의 전체 인증 로직(Google OAuth 등)을 이식하지 말 것. sessionStorage 확인 + 포털 리다이렉트만
- 챗봇 API CORS: `idphoto-kr.monkos.ai` → `monkos.ai` 크로스도메인. 서버 CORS 설정 확인 필요

## 완료 기준

- [ ] 비로그인 상태: 헤더 우상단 `로그인` 버튼 표시
- [ ] 로그인 상태: 헤더 우상단 크레딧 + 프로필 아이콘 표시
- [ ] 좌상단 MONKOS 로고 클릭 → 챗봇 패널 열림
- [ ] 챗봇 메시지 송수신 정상 작동
- [ ] 모바일(iPhone Safari) 레이아웃 정상
- [ ] 프로덕션 배포 전 로컬 테스트 완료
