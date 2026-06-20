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

# 지시서: 헤드샷 프리셋 재설계 + 로그인 모달 CSS 수정

> **[2026-06-20 18:55 KST]** iMac/쌍아 → 막내
> 작가님 직접 설계. 프리셋 5종 4축 스키마 전면 재설계 + portal.css 누락 수정.

---

## 목표

1. 프리셋 5종을 4축(배경·포멀도·헤어·메이크업) 스키마로 전면 재설계
2. Business Pro → Professional 리네이밍
3. Dating Profile → KR "데일리" 분리 네이밍
4. portal.css 누락 → 로그인 모달 좌측하단 노출 버그 수정

---

## 작업 1: 프리셋 프롬프트 전면 재설계

`monkos_AI/portal/server.js`의 `styleModifiers` 교체.

### 공통 basePrompt (변경 없음)
```
Waist-up portrait, crop above the navel. Do NOT show full body, legs, or desk/furniture below waist. Keep the subject's hairstyle exactly as-is, only tidy and groom. The subject must be clearly recognizable as the SAME person in the input photo.
```

### 프리셋별 styleModifiers (전면 교체)

```js
const styleModifiers = {
  corporate: 'Composed, authoritative expression. Clean solid-color backdrop (dark navy or charcoal gray). Dramatic studio lighting with subtle rim light. Executive boardroom atmosphere. Neatly styled hair as if freshly blow-dried — same hairstyle but tidier. Polished, refined makeup if present in original — do not add makeup not in original. Full formal attire mood.',

  linkedin_pro: 'Confident, approachable expression with a natural smile. Modern office environment with soft bokeh background (blurred bookshelves, window light, office plants). Natural window-style lighting. Lightly groomed hair — maintain original style but neater. Clean, natural-looking makeup if present. Smart professional attire mood — blazer with shirt, no tie necessary.',

  professional: 'Calm, trustworthy expression. Bright neutral studio background (light gray or off-white). Even, diffused lighting. Naturally tidy hair — original style maintained with subtle polish. Neat, understated makeup if present. Business-casual attire mood — no-tie, clean shirt or smart blazer. Suitable for business cards, company websites, and professional directories.',

  creative: 'Relaxed, genuine smile showing personality. Warm-toned environment or textured backdrop (exposed brick, artistic studio, warm wood). Natural window-style lighting with soft shadows. Hair kept exactly as original — embrace the natural look. Minimal makeup, natural skin. Smart-casual creative industry vibe — individuality over formality.',

  dating: 'Natural, warm expression with a relaxed confident smile. Soft golden-hour outdoor-style lighting. Blurred lifestyle background (café terrace, boutique street, sunlit park). Hair kept completely natural and effortless. Fresh, dewy makeup look if present — effortless but intentional. Stylish casual outfit mood — current fashion sensibility, seasonally appropriate, well-put-together but not overdressed. The subject looks like they dressed intentionally to impress.',
};
```

### 메이크업 공통 가드 (basePrompt에 추가)
```
Enhance existing makeup to match the style level if makeup is present in the original photo. Do NOT add makeup that is not present in the original.
```

최종 basePrompt:
```js
const basePrompt = 'Waist-up portrait, crop above the navel. Do NOT show full body, legs, or desk/furniture below waist. Keep the subject\'s hairstyle exactly as-is, only tidy and groom. The subject must be clearly recognizable as the SAME person in the input photo. Enhance existing makeup to match the style level if makeup is present in the original photo. Do NOT add makeup that is not present in the original.';
```

### purpose 기본값
```js
purpose: purpose || 'linkedin_pro',
```

---

## 작업 2: KR/EN 네이밍 분리

`monkos_AI/portal/lib/cms/render-headshot.js`의 i18n styles 객체 수정.

**EN:**
```js
styles: {
  linkedin_pro: 'LinkedIn',
  corporate: 'Corporate',
  creative: 'Creative',
  professional: 'Professional',
  dating: 'Dating Profile',
},
```

**KO:**
```js
styles: {
  linkedin_pro: '링크드인',
  corporate: '코포레이트',
  creative: '크리에이티브',
  professional: '프로페셔널',
  dating: '데일리',
},
```

**JA:**
```js
styles: {
  linkedin_pro: 'LinkedIn',
  corporate: 'コーポレート',
  creative: 'クリエイティブ',
  professional: 'プロフェッショナル',
  dating: 'デイリー',
},
```

⚠️ 키값은 `realtor` → `professional`, 나머지 동일. `headshot.js`에서 `data-style` 참조도 확인.

---

## 작업 3: portal.css 누락 수정

`monkos_AI/portal/lib/cms/render-headshot.js`에 **이미 쌍아가 수정 완료**:

```html
<link rel="stylesheet" href="/css/portal.css">
<link rel="stylesheet" href="/css/headshot.css">
```

이 수정이 반영되어 있는지 확인만. 로그인 모달(`.modal-overlay`)이 `display: none`으로 기본 숨김 처리됨.

---

## 검증 기준

- [ ] 5프리셋 각각으로 동일 사진 생성 → 배경·조명·분위기·포멀도가 뚜렷하게 다름
- [ ] Corporate(다크) vs LinkedIn(오피스) vs Professional(밝은 단색) 배경 차이 명확
- [ ] Creative(따뜻한 질감) vs Dating(야외 골든아워) 라이프 2종 차이 명확
- [ ] KR 화면: 데일리 / EN 화면: Dating Profile 표시
- [ ] Business Pro → Professional 리네이밍 정상 (UI + 서버 양쪽)
- [ ] 비로그인 상태에서 로그인 모달 좌측하단 노출 ❌ → 숨김 정상
- [ ] Generate 클릭 시 로그인 모달 중앙 정상 표시
- [ ] 메이크업 가드: 원본에 메이크업 없는 사진 → AI가 메이크업 추가 안 함

---

## ⚠️ 준수 조항

- **헌법 3항(정체성 보존)**: 정체성 보존 프롬프트 + 메이크업 가드 유지 필수.
- **의상 직접 지정 금지**: "attire mood" 수준만 (작가님 6/19 확정).
- **ch5 배포 규칙**: deploy.sh 경유.

---

## 산출물

1. `monkos_AI/portal/server.js` (styleModifiers 전면 교체 + basePrompt 메이크업 가드 + purpose 키 변경)
2. `monkos_AI/portal/lib/cms/render-headshot.js` (i18n 네이밍 + portal.css 확인)
3. `monkos_AI/portal/public/js/headshot.js` (data-style 키 realtor→professional 변경 확인)
4. 프로덕션 배포 (deploy.sh)
5. COMPLETION 보고서 → `monkos-ops/ops/reports/2026-06/`
