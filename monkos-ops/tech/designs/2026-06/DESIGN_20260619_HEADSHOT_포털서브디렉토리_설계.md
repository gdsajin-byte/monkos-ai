---
type: design
date: 2026-06-19
device: iMac
agent: 쌍아
portfolio: PF_PROFILES
status: 기안
---

# 설계: AI 헤드샷 서비스 — 포털 서브디렉토리 방식

> **[2026-06-19 16:10 KST]** iMac/쌍아 → 작가님
> 근거: 6/19 세션 — "한 앱에 다 때려넣는게 아니라 용도별 분리 배포", "포털에서 결제 쥐고 API 연동"

---

## 1. 구조

```
monkos.ai (포털 — 단일 Cloud Run)
│
├── 기존
│   ├── /         홈
│   ├── /specs/   규격 가이드 (SSR)
│   ├── /blog/    블로그 (SSR)
│   ├── /guide/   가이드
│   ├── /pricing  가격
│   ├── /faq      FAQ
│   └── /crop     크롭 도구
│
├── 신규
│   ├── /headshot           ← AI 헤드샷 (1차)
│   ├── /headshot/result    ← 결과 페이지
│   └── (/beauty 등 후속 확장)
│
├── 인증·결제 (기존 그대로)
│   ├── /api/auth/*         Firebase Auth
│   ├── /api/credits/*      크레딧 조회/차감/환불
│   ├── /api/checkout       토스/LS 결제
│   └── /api/payments/*     결제 확인
│
└── 생성 API (스튜디오 프록시)
    └── /api/headshot/generate  ← 신규. 스튜디오 /api/profiles/generate 프록시
```

### 핵심 원칙

- **프론트**: 포털 server.js에서 SSR 렌더. 얇은 HTML + 클라이언트 JS
- **인증·결제**: 포털 기존 인프라 100% 재사용. 새로 만들 것 없음
- **생성**: 포털 → 스튜디오 API 프록시. 스튜디오에 이미 프로필스 엔드포인트 있음
- **크레딧**: 생성 시 포털 `/api/credits/use` 호출 (기존 패턴 동일)
- **배포**: 포털 deploy.sh 1번. 별도 서비스 없음

---

## 2. 페이지 설계

### /headshot (메인)

모바일 퍼스트 단일 칼럼:

```
┌─────────────────────────┐
│  MONKOS AI HEADSHOT     │
│  프로페셔널 헤드샷을      │
│  AI로 30초 만에          │
├─────────────────────────┤
│  [내 사진 업로드]        │  ← 1단계: 사진 선택
│                         │
│  또는 카메라 촬영        │
├─────────────────────────┤
│  스타일 선택:            │  ← 2단계: 용도 선택
│  [링크드인] [취업] [기업] │
│  [전문직] [캐주얼]       │
├─────────────────────────┤
│  [생성하기 — 10c]        │  ← 3단계: 생성
│  잔액: 80c              │
└─────────────────────────┘
```

- 3단계 퍼널. 선택지 최소화
- 로그인 안 했으면 생성 버튼 → 로그인 모달 (idphoto-kr 패턴)
- 크레딧 부족 → 충전 모달 (기존 패턴)

### /headshot/result (결과)

```
┌─────────────────────────┐
│  원본         →  헤드샷  │  ← 전후비교
├─────────────────────────┤
│  [다시 생성] [다운로드]   │
│  [다른 스타일 시도]       │
├─────────────────────────┤
│  생성 히스토리           │
│  [thumb] [thumb] [thumb] │
└─────────────────────────┘
```

---

## 3. API 흐름

```
사용자 → 포털 /headshot (프론트)
  ↓ 사진 업로드 + 스타일 선택
  ↓ fetch('/api/headshot/generate', { image, purpose: 'linkedin', model: 'nano-banana-pro' })
  ↓
포털 server.js /api/headshot/generate (프록시)
  ↓ 1. 인증 확인 (cookie → handleAuthVerify)
  ↓ 2. 크레딧 차감 (useCredits → 10c)
  ↓ 3. 스튜디오 API 호출 (fetch → studio.monkos.ai/api/profiles/generate)
  ↓ 4. 응답 반환 (생성 이미지)
  ↓
사용자 → 결과 표시
```

---

## 4. 다국어

| 경로 | 언어 |
|------|------|
| /headshot | 한국어 (기본) |
| /en/headshot | English |
| /ja/headshot | 日本語 |

기존 포털 다국어 패턴 (`renderXxx(req, res, lang)`) 동일 적용.

---

## 5. 구현 범위

### 신규 파일

| 파일 | 내용 |
|------|------|
| `lib/cms/render-headshot.js` | SSR 렌더 함수 (메인 + 결과) |
| `public/headshot.js` | 클라이언트 JS (업로드, 생성, 결과) |
| `public/headshot.css` | 스타일 (모바일 퍼스트) |

### 수정 파일

| 파일 | 변경 |
|------|------|
| `server.js` | `/headshot`, `/en/headshot`, `/ja/headshot` 라우트 추가 + `/api/headshot/generate` 프록시 엔드포인트 |

### 재사용 (수정 없음)

- 인증: handleAuthVerify, handleGoogleAuth
- 크레딧: handleCreditsUse, handleCreditsRefund
- 결제: handleCheckout, handleTossConfirm
- 공통 UI: 헤더, 로그인 모달, 충전 모달

---

## 6. SEO

- SSR 렌더 → 구글 크롤러에 완전한 HTML
- JSON-LD: SoftwareApplication + HowTo
- OG/메타: 언어별
- 헤드텀 레지스트리 매핑: "AI headshot" → /en/headshot, "AI 헤드샷" → /headshot

---

## 7. 비용

- Cloud Run 추가 비용: 0 (포털에 포함)
- 생성 비용: 기존 크레딧 체계 (나노바나나 Pro ₩185/장, 사용자 10c 차감)
- GenAI App Builder 크레딧 적용: ✅ (스튜디오 Vertex AI ADC 경유)
