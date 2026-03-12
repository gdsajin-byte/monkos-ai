---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 크롭앱 UX 개선 4건 + 표정 프롬프트 전면 검토
priority: P1
category: 프론트엔드 + 프롬프트
---

# 지시서: 크롭앱 UX 개선 4건 + 표정 프롬프트 전면 검토

> **[2026-03-12 15:25 KST]** iMac/쌍아 → iMac/막내
> 출처: 작가님 프로덕션 테스트 피드백

---

## 이슈 1: 파비콘 — 헤더 로고를 MONKOS 아이콘으로

### 현재
crop.html 헤더에 텍스트 로고 `<div class="header-logo">M</div>` (24행)

### 변경
파비콘 파일은 이미 존재: `/monkos-icon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`
`<link rel="icon">` 태그도 이미 정상 (11-13행).

**헤더 로고만 변경:**
```html
<!-- 현재 -->
<div class="header-logo">M</div>

<!-- 변경 -->
<img class="header-logo" src="/monkos-icon.svg" alt="M" width="28" height="28" style="border-radius:6px;">
```

CSS `.header-logo`에서 텍스트 관련 스타일(font-size, line-height 등) 제거하고 이미지에 맞게 조정.

---

## 이슈 2: 정수리 핀 + 스케일 핸들 터치 영역 확대

### 현재
- 정수리 핀: `width: 20px; height: 20px` (crop.css 135행)
- 스케일 핸들: `width: 22px; height: 22px` (crop.css 148행)
- 스케일 핸들 위치: `brCorner.x + 10, brCorner.y + 10` (crop.js 255-256행)

### 문제
모바일에서 사진 영역(이동)과 핀/핸들이 가까워서 잘못 잡힘. 시각 크기는 괜찮으나 **터치 히트 영역이 너무 작음**.

### 변경

#### A. 정수리 핀 — 터치 영역 확대 (시각 크기 유지)
```css
.pin-crown {
  width: 20px; height: 20px; cursor: ns-resize;
  /* 터치 히트 영역 확대 — 시각 크기 유지, 투명 패딩으로 확장 */
  padding: 15px;
  margin: -15px;
  box-sizing: content-box;
}
```

#### B. 스케일 핸들 — 시각 크기 + 터치 영역 모두 확대
```css
.scale-handle {
  position: absolute; transform: translate(-50%,-50%);
  width: 30px; height: 30px; border-radius: 8px;  /* 22→30px */
  background: var(--accent); border: 2.5px solid #fff;
  cursor: nwse-resize; z-index: 22; pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff; font-weight: 900;  /* 10→12px */
  /* 터치 히트 영역 추가 확장 */
  padding: 10px;
  margin: -10px;
  box-sizing: content-box;
}
```

#### C. 스케일 핸들 위치 — 현재 설정 보고
현재: `brCorner.x + 10, brCorner.y + 10` (crop.js 255-256행)
→ 얼굴 우하단 모서리에서 10px 바깥. 핸들 크기 키웠으니 **+15로 변경**:
```javascript
sh.style.left = Math.min(FW - 25, Math.max(15, pts.brCorner.x + 15)) + 'px';
sh.style.top = Math.min(FH - 25, Math.max(15, pts.brCorner.y + 15)) + 'px';
```

---

## 이슈 3: 하단 버튼 정리

### 현재 (crop.html 158-163행)
```html
<button class="btn btn-photo" id="btnPhoto">사진</button>
<button class="btn btn-reset" id="btnReset">리셋</button>
<button class="btn btn-download disabled" id="btnDownload">다운로드</button>
```

### 변경

#### A. "사진" → "← 돌아가기"
- 앱 내 진입(`from=thankyou`)이면: `← 돌아가기` → `history.back()` 또는 `navigateTo('thankyou.html')`
- 오픈앱 진입이면: `📁 사진 선택` (기존 파일 업로드 트리거)

```javascript
// crop.js에서 from 파라미터에 따라 분기
const isAppEntry = new URLSearchParams(location.search).get('from') === 'thankyou';
const btnPhoto = $('btnPhoto');
if (isAppEntry) {
  btnPhoto.textContent = '← 돌아가기';
  btnPhoto.onclick = () => history.back();
} else {
  btnPhoto.textContent = '📁 사진 선택';
  // 기존 파일 업로드 로직 유지
}
```

#### B. "리셋" → 초기 상태 복원
- 사진 삭제가 아닌 **사진 로딩 직후 autoPlace 상태로 복원**
- 즉 `reset(specKey)` 호출 (이미 구현되어 있음, crop.js 434행)
- 라벨: `↻ 초기화`

```html
<button class="btn btn-reset" id="btnReset">↻ 초기화</button>
```

---

## 이슈 4: 표정 프롬프트 전면 검토

### 문제
이전 수정(`neutral: 'calm, relaxed neutral expression with soft eyes'`)에도 여전히 딱딱함.

### 분석 — 표정이 딱딱해지는 원인이 복수

1. **EXPRESSION_PROMPTS** (232-237행) — 이미 수정됨, 단독으로는 부족
2. **STYLE_PROMPTS.passport** (191행): `'Professional passport/ID photo'` — "passport"가 AI에게 무표정 유도
3. **FORMAT 절** (256행): `'Neutral composed expression'` — **여기서 강제로 무표정 지시**
4. **IDENTITY_PRESERVATION** (185행): `'Make eyes look intense, strained, or unnaturally wide — keep natural calm eye contact'` — 이건 좋음

### 핵심 충돌
`EXPRESSION_PROMPTS`에서 `gentle_smile`을 선택해도, FORMAT 절(256행)에서 `'Neutral composed expression'`이 덮어씀. **두 프롬프트가 충돌**.

### 변경

#### A. FORMAT 절 — 표정 강제 제거
```javascript
// 현재 (256행)
'[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. Neutral composed expression. White background mandatory.'

// 변경 — 표정 지시를 EXPRESSION 절에 위임
'[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. White background mandatory.'
```

#### B. STYLE_PROMPTS 표정 완화
```javascript
// 현재 (191행)
passport: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',

// 변경 — 표정 관련 없으므로 유지 (문제 없음)
```

#### C. EXPRESSION_PROMPTS 보강
```javascript
const EXPRESSION_PROMPTS = {
  gentle_smile: 'gentle, warm subtle smile with relaxed soft eyes, friendly and approachable',
  neutral: 'calm, relaxed face with soft natural eyes, not stiff or tense',
  natural_smile: 'natural, warm friendly smile showing ease and confidence',
  bright_smile: 'bright, genuine confident smile with naturally happy eyes',
};
```

#### D. 프롬프트 빌더에 EXPRESSION 절 명시 추가
현재 `buildPromptV5()`에 expression 처리가 **없음** — 프롬프트에 반영 안 되고 있을 가능성.

확인 필요: `body.expression`이 넘어오는지, `EXPRESSION_PROMPTS[expression]`이 parts에 push되는지.

만약 빠져있다면 추가:
```javascript
// [7] EXPRESSION
const expr = expression || 'gentle_smile';
if (EXPRESSION_PROMPTS[expr]) {
  parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
}
```

> ⚠️ 이 부분이 가장 의심됨. EXPRESSION_PROMPTS가 정의만 되어 있고 실제 프롬프트 빌더에서 사용하지 않고 있을 수 있음. **반드시 확인 후 누락이면 추가.**

#### E. KR/JP 동일 적용

---

## ⚠️ 준수 조항

- **헌법 9조 (I2I 정체성 보존)**: 표정 변경이 정체성 90%+ 보존에 영향 없는지 확인
- **헌법 6조**: API 키/인프라 수정 금지

## 커밋 + 배포

- 1커밋으로 합쳐서 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**
