---
type: order
date: 2026-06-19
from: iMac/쌍아
to: iMac/막내
portfolio: PF_PROFILES
status: 대기
---

# 지시서: AI 헤드샷 서비스 — 포털 서브디렉토리 구현

> **[2026-06-19 16:13 KST]** iMac/쌍아 → 막내
> 근거: [설계서](../../tech/designs/2026-06/DESIGN_20260619_HEADSHOT_포털서브디렉토리_설계.md)
> 작가님 승인: 2026-06-19 16:13 KST

---

## 목적

monkos.ai/headshot에 AI 헤드샷 서비스를 구현한다. 포털 서브디렉토리 방식으로 인증·결제·크레딧을 100% 재사용하고, 생성은 스튜디오 API를 프록시한다. 모바일 퍼스트.

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: 시크릿/API키 생성·추측 금지
- **ch5 2조**: 배포는 deploy.sh 경유
- **ch2 코딩**: 순수 JS (HTML/CSS/JS), Tailwind 클래스 우선, camelCase, 한국어 UI
- **절대 건드리지 말 것**: 기존 포털 라우트(/, /specs, /blog, /guide, /pricing, /faq, /crop), 인증·결제 핸들러

---

## 작업 내용

### 1. SSR 렌더 — `lib/cms/render-headshot.js` (신규)

`renderHeadshot(req, res, lang)` + `renderHeadshotResult(req, res, lang)` 함수.

기존 `renderSpecsDetail`, `renderPricing` 패턴 참고.

**기본 언어: English (영어권 우선 전략, 6/18 확정)**
- `/headshot` = 영어 기본, `/ko/headshot` = 한국어, `/ja/headshot` = 일본어

**메인 페이지 (/headshot)**:
- 모바일 퍼스트 단일 칼럼
- 히어로: "Professional AI Headshots — Ready in 30 Seconds"
- 1단계: 사진 업로드 (드래그/클릭/카메라) — "Upload your photo"
- 2단계: 분위기 프리셋 5개 (헤어·의상 세부 조정 없음, 연출만 변경):
  - **LinkedIn Pro** — 정면, 밝은 배경, 다크 정장, 자연 미소
  - **Business Casual** — 3/4턴, 따뜻한 톤, 라이트 의상, 친근
  - **Creative** — 살짝 기울임, 드라마틱 조명, 캐주얼
  - **Executive** — 정면, 그레이 배경, 포멀, 신뢰감
  - **Job Application** — 정면, 화이트 배경, 단정, 부드러운 표정
- 3단계: 생성 버튼 + 크레딧 잔액 표시 — "Generate — 10 credits"
- 정체성 보존 원칙: 얼굴·헤어 그대로 유지, 정돈만. 프롬프트에 "keep the subject's hairstyle, only tidy and groom" 명시
- 로그인 안 된 상태 → 생성 버튼 클릭 시 로그인 모달 (shared.js의 기존 패턴)
- 크레딧 부족 → 충전 모달 (기존 패턴)
- SEO: title/description/OG 영어 기본, JSON-LD (SoftwareApplication)

**결과 페이지 (/headshot/result)**:
- 원본 ↔ 헤드샷 전후비교 ("Before / After")
- Regenerate / Download / Try Another Style 버튼
- 생성 히스토리 썸네일

### 2. 클라이언트 JS — `public/js/headshot.js` (신규)

- 사진 업로드 (FileReader → base64)
- 스타일 선택 상태 관리
- 생성 요청: `fetch('/api/headshot/generate', { method: 'POST', body: JSON.stringify({ image, purpose, model: 'nano-banana-pro' }) })`
- 로딩 상태 (생성 중 — 10~20초)
- 결과 표시 + 다운로드

### 3. 스타일 — `public/css/headshot.css` (신규)

- 모바일 퍼스트 (max-width 기본, 데스크톱은 미디어쿼리로 확장)
- Tailwind 클래스 우선, 커스텀은 최소
- 다크 테마 (포털 기존 톤 유지)

### 4. server.js 라우트 추가

```
// AI 헤드샷
if (urlPath === '/headshot' && req.method === 'GET') return renderHeadshot(req, res);
if (urlPath === '/headshot/result' && req.method === 'GET') return renderHeadshotResult(req, res);
if (urlPath === '/en/headshot' && req.method === 'GET') return renderHeadshot(req, res, 'en');
if (urlPath === '/ja/headshot' && req.method === 'GET') return renderHeadshot(req, res, 'ja');
```

### 5. API 프록시 — server.js에 추가

```
// /api/headshot/generate → 스튜디오 프록시
if (urlPath === '/api/headshot/generate' && req.method === 'POST') {
  // 1. 인증 확인
  // 2. 크레딧 차감 (10c)
  // 3. 스튜디오 /api/profiles/generate 호출 (내부 fetch)
  // 4. 응답 반환
}
```

스튜디오 URL: `https://monkos-studio-933456016842.us-central1.run.app/api/profiles/generate`
(환경변수 `STUDIO_API_URL`로 관리)

크레딧 차감: 기존 `handleCreditsUse` 내부 로직 참고. generate = 10c.

생성 실패 시 크레딧 환불: 기존 `handleCreditsRefund` 패턴.

---

## 참고

- 포털 SSR 패턴: `lib/cms/render.js` → `renderSpecsDetail`, `renderPricing`
- 인증 패턴: `lib/auth.js` → `handleAuthVerify`
- 크레딧 패턴: `lib/credits.js` → `handleCreditsUse`
- 스튜디오 프로필스 API: `monkos_AI/studio/server.js` → `/api/profiles/generate`
- 설계서: `monkos-ops/tech/designs/2026-06/DESIGN_20260619_HEADSHOT_포털서브디렉토리_설계.md`

---

## 완료 기준

1. monkos.ai/headshot 접속 → 모바일에서 단일 칼럼 레이아웃 정상 렌더
2. 사진 업로드 → 스타일 선택 → 생성 → 결과 표시 전 흐름 정상
3. 크레딧 차감 + 부족 시 충전 모달 정상
4. /en/headshot, /ja/headshot 다국어 정상
5. 배포는 본 지시서 범위 밖 — 코드 완료까지
