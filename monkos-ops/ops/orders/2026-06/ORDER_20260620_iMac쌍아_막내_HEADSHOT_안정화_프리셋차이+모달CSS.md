---
type: order
date: 2026-06-20
from: iMac/쌍아
to: 막내
device: iMac
agent: 쌍아
portfolio: PF_PROFILES
status: 발행
---

# 지시서: 헤드샷 안정화 — 프리셋 차이 선명화 + 로그인 모달 CSS

> **[2026-06-20 14:13 KST]** iMac/쌍아 → 막내
> 6/19 라이브 직후 미결 2건. 기능 추가 아닌 기존 구현의 품질 보강.

---

## 목표

1. 5프리셋(LinkedIn/Corporate/Creative/Business Pro/Dating)의 생성 결과 차이를 선명화
2. 로그인 모달이 헤드샷 UI 위에서 깔끔하게 표시되도록 CSS 정리

---

## 작업 1: 프리셋별 프롬프트 분기

### 현황

`monkos_AI/portal/server.js:184` — 현재 `customPrompt`가 5프리셋 공통 단일 프롬프트:
```
Waist-up portrait, crop above the navel. Do NOT show full body...
```

`purpose`(linkedin/corporate/creative/realtor/dating)는 스튜디오 API로 전달되지만, **포털 서버에서 purpose별 프롬프트 수식어를 추가하지 않고 있음**. 프리셋 차이는 스튜디오 API 내부의 기본 처리에만 의존 중.

### 변경

`server.js`의 headshot generate 핸들러에서 **purpose별 프롬프트 수식어를 customPrompt에 추가**:

```js
const styleModifiers = {
  linkedin_pro: 'Confident, approachable expression. Soft neutral studio background (light gray or off-white). Even, diffused lighting. Conservative professional attire mood — no specific garment prescribed, let the style feel naturally formal.',
  corporate: 'Composed, authoritative expression. Clean solid-color backdrop (dark navy or charcoal gray). Dramatic studio lighting with subtle rim light. Executive boardroom atmosphere.',
  creative: 'Relaxed, genuine smile. Warm-toned environment or textured backdrop. Natural window-style lighting with soft shadows. Smart-casual creative industry vibe.',
  realtor: 'Warm, trustworthy smile. Modern office or neutral gradient background. Bright, even lighting. Polished business-professional mood, approachable yet established.',
  dating: 'Natural, warm expression with a relaxed smile. Soft golden-hour outdoor-style lighting. Blurred lifestyle background (café, park, urban). Casual-chic styling mood.',
};
```

**적용 위치**: `server.js:180~186` customPrompt 구성 부분.

```js
const basePrompt = 'Waist-up portrait, crop above the navel. Do NOT show full body, legs, or desk/furniture below waist. Keep the subject\'s hairstyle exactly as-is, only tidy and groom. The subject must be clearly recognizable as the SAME person in the input photo.';
const styleMod = styleModifiers[purpose] || styleModifiers.linkedin_pro;
const customPrompt = basePrompt + ' ' + styleMod;
```

### 핵심 원칙
- **의상을 구체적으로 지정하지 않는다** (6/19 작가님 확정: "의상 고정 말고 스타일 무드로"). "attire mood", "styling mood" 수준만.
- **정체성 보존 문구 유지** ("clearly recognizable as the SAME person").
- **배경·조명·분위기 4축으로 차이를 만든다**.

---

## 작업 2: 로그인 모달 CSS 정리

### 현황

`render-headshot.js`에 `loginRequired`/`loginBtn` 텍스트가 있으나, `headshot.css`에 로그인 모달 전용 스타일이 없음. 포털 공통 로그인 모달(`main.css` 또는 `main.js`의 구글 로그인)을 사용 중일 가능성.

### 변경

1. 헤드샷 페이지에서 로그인 모달이 열릴 때 **배경 딤(dim) + 모달 중앙 정렬**이 정상 동작하는지 확인
2. 미비 시 `headshot.css`에 모달 오버라이드 추가:
   - `.hs-login-overlay` — 풀스크린 딤 배경
   - `.hs-login-modal` — 중앙 정렬, 라운드 카드, 구글 로그인 버튼
3. 포털 공통 모달이 이미 정상 동작하면 **변경 불필요 — 확인만 보고**

---

## 검증 기준

- [ ] 5프리셋 각각으로 동일 사진 생성 → **배경·조명·분위기가 뚜렷하게 다름** (특히 LinkedIn vs Creative vs Dating)
- [ ] 프리셋 미지정 시 기본값(linkedin_pro) 적용
- [ ] 비로그인 상태에서 Generate 클릭 → 로그인 모달 정상 표시 (딤 배경 + 중앙 정렬 + 구글 버튼)
- [ ] 모바일(600px 이하)에서 모달 정상 표시
- [ ] 정체성 보존 문구가 프롬프트에 유지됨

---

## ⚠️ 준수 조항

- **헌법 3항(정체성 보존)**: 정체성 보존 프롬프트 문구 제거/약화 금지.
- **ch2 코딩 규칙**: 순수 JS, camelCase.
- **ch5 배포 규칙**: deploy.sh 경유.
- **프롬프트 내 의상 구체 지정 금지**: 6/19 작가님 확정.

---

## 산출물

1. `monkos_AI/portal/server.js` (프리셋별 프롬프트 분기)
2. `monkos_AI/portal/public/css/headshot.css` (모달 CSS, 필요 시)
3. 프로덕션 배포 (deploy.sh)
4. COMPLETION 보고서 → `monkos-ops/ops/reports/2026-06/`
