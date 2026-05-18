---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 크롭앱 UX 2차 개선 4건 + 표정 프롬프트 미세 조정
priority: P1
category: 프론트엔드 + 프롬프트
---

# 지시서: 크롭앱 UX 2차 개선 4건 + 표정 프롬프트 미세 조정

> **[2026-03-12 16:03 KST]** iMac/쌍아 → iMac/막내
> 출처: 작가님 프로덕션 테스트 2차 피드백

---

## 이슈 1: 정수리 핀 — 시각 크기 원복 + 히트 영역만 확대

### 현재 (crop.css 131-137행)
이전 지시서에서 `padding: 15px; margin: -15px;`를 적용했으나, **핀 자체가 시각적으로 너무 커 보인다**는 피드백.

### 변경

#### A. 정수리 핀 CSS — 히트 영역만 확대 (시각 크기 20px 유지)
```css
.pin-crown {
  width: 20px; height: 20px; cursor: ns-resize;
  /* 터치 히트 영역 — 시각 크기 유지, 투명 패딩으로 확장 */
  padding: 15px;
  margin: -15px;
  box-sizing: content-box;
}
```
→ 이 부분은 이미 적용됨. CSS는 그대로 유지.

#### B. 정수리 핀 시각 요소 — 핀 내부에 ↕ 화살표 아이콘 표시
현재 핀은 빈 원형(`<div class="pin pin-crown" id="crownPin"></div>`).

**crop.html 102행 변경:**
```html
<!-- 현재 -->
<div class="pin pin-crown" id="crownPin"></div>
<div class="pin-hint" id="crownHint">↕ 드래그</div>

<!-- 변경 — 핀 내부에 화살표, 힌트 텍스트 크기 확대 -->
<div class="pin pin-crown" id="crownPin">↕</div>
<div class="pin-hint" id="crownHint">↕ 드래그</div>
```

**crop.css .pin-crown 추가:**
```css
.pin-crown {
  /* 기존 유지 */
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #fff; font-weight: 800;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
```

→ 핀 20px 크기 안에 ↕ 아이콘이 들어가서 "이걸 위아래로 움직이라는 거구나" 인지 가능.

---

## 이슈 2: 사진 이동 영역 — 길게누르기 미리보기 충돌 해결

### 문제
사진 영역을 터치하면 이동(드래그)이 시작되어야 하는데, 길게 누르면 **브라우저 기본 동작(이미지 미리보기/컨텍스트 메뉴)**이 뜸.

### 변경

#### A. 사진 이미지 길게누르기 방지 (crop.css)
```css
.photo {
  /* 기존 유지 */
  -webkit-touch-callout: none; /* iOS 길게누르기 메뉴 차단 */
}
.frame-container {
  /* 기존 유지 */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

#### B. 사진 이동 영역에 ✋ 손바닥 아이콘 표시
프레임 내에 이동 핸들 영역 추가. 사진 중앙 하단에 반투명 이동 아이콘.

**crop.html — frame 내부에 추가 (chinPin 아래):**
```html
<!-- 이동 핸들 (사진 드래그 영역 표시) -->
<div class="move-handle" id="moveHandle">✋</div>
```

**crop.css 추가:**
```css
.move-handle {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(6,8,13,0.5);
  border: 1.5px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  z-index: 15; /* 오버레이 위, 핀 아래 */
  pointer-events: auto;
  cursor: grab;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.move-handle:active {
  opacity: 1;
  cursor: grabbing;
}
```

**crop.js 변경:**
- `$('photo').addEventListener('pointerdown', ...)` → `$('moveHandle').addEventListener('pointerdown', ...)`로 변경
- 사진 자체에서는 드래그 이벤트 제거 (터치해도 이동 안 됨)
- 이동은 오직 ✋ 핸들에서만 가능

```javascript
// 이벤트: 드래그 (936행)
// 변경 전: $('photo').addEventListener('pointerdown', (e) => onPtrDown(e, 'img'));
// 변경 후:
$('moveHandle').addEventListener('pointerdown', (e) => onPtrDown(e, 'img'));
```

#### C. 미리보기 버튼 (가이드 숨김) — 별도 버튼
하단 버튼 영역에 "미리보기" 버튼 추가. 누르는 동안 가이드(SVG 오버레이 + 핀 + 배지)를 숨기고 사진만 표시.

**crop.html — actions 영역 (159-163행) 변경:**
```html
<div class="actions">
  <button class="btn btn-photo" id="btnPhoto">사진</button>
  <button class="btn btn-reset" id="btnReset">↻ 초기화</button>
  <button class="btn btn-preview" id="btnPreview">👁 미리보기</button>
  <button class="btn btn-download disabled" id="btnDownload">다운로드</button>
</div>
```

**crop.css 추가:**
```css
.btn-preview {
  padding: 11px 10px;
  font-size: 11px;
}
```

**crop.js — init() 내 추가:**
```javascript
// 미리보기 (누르는 동안 가이드 숨김)
const btnPreview = $('btnPreview');
btnPreview.addEventListener('pointerdown', () => {
  $('overlaySvg').style.opacity = '0';
  $('crownPin').style.opacity = '0';
  $('crownHint').style.opacity = '0';
  $('chinPin').style.opacity = '0';
  $('scaleHandle').style.opacity = '0';
  $('moveHandle').style.opacity = '0';
  $('badgeFace').style.opacity = '0';
  $('badgeStatus').style.opacity = '0';
  $('badgeScale').style.opacity = '0';
});
const restoreGuides = () => {
  $('overlaySvg').style.opacity = '';
  $('crownPin').style.opacity = '';
  $('crownHint').style.opacity = '';
  $('chinPin').style.opacity = '';
  $('scaleHandle').style.opacity = '';
  $('moveHandle').style.opacity = '';
  $('badgeFace').style.opacity = '';
  $('badgeStatus').style.opacity = '';
  $('badgeScale').style.opacity = '';
};
btnPreview.addEventListener('pointerup', restoreGuides);
btnPreview.addEventListener('pointerleave', restoreGuides);
```

---

## 이슈 3: 스케일 핸들 — 대각 화살표로 변경

### 현재
`⤡` 문자 (crop.html 109행, crop.css 153행 font-size: 12px)

### 변경

**crop.html 109행:**
```html
<!-- 현재 -->
<div class="scale-handle" id="scaleHandle">⤡</div>

<!-- 변경 — 대각 확대/축소 화살표 -->
<div class="scale-handle" id="scaleHandle">⤢</div>
```

> `⤢` (U+2922, NORTH EAST AND SOUTH WEST ARROW) — 대각 양방향 화살표로 스케일링 느낌.
> 만약 렌더링이 안 되면 SVG 인라인으로 대체:
```html
<div class="scale-handle" id="scaleHandle">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 12L12 2M12 2H7M12 2V7M2 12H7M2 12V7" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>
</div>
```

---

## 이슈 4: 표정 프롬프트 미세 조정 — 더 자연스럽게

### 피드백
> "미소가 살짝 많이 들어간 느낌. 원본 0 ~ 활짝 10이면 1~2 정도 안쪽으로"

### 현재 (server.js 232-237행)
```javascript
const EXPRESSION_PROMPTS = {
  gentle_smile: 'gentle, warm subtle smile with relaxed soft eyes, friendly and approachable',
  neutral: 'calm, relaxed face with soft natural eyes, not stiff or tense',
  natural_smile: 'natural, warm friendly smile showing ease and confidence',
  bright_smile: 'bright, genuine confident smile with naturally happy eyes',
};
```

### 변경
```javascript
const EXPRESSION_PROMPTS = {
  gentle_smile: 'very subtle hint of warmth in eyes, barely perceptible gentle expression, not smiling but pleasant',
  neutral: 'calm, natural resting face with soft relaxed eyes, pleasant but not smiling',
  natural_smile: 'slight natural warmth, gentle friendly eyes, minimal smile',
  bright_smile: 'gentle, warm subtle smile with relaxed soft eyes, approachable',
};
```

**변경 포인트:**
- `gentle_smile`(기본값): "warm subtle smile" → "barely perceptible gentle expression, not smiling but pleasant". 미소 X, 좋은 인상만
- `neutral`: "relaxed" 유지, 더 명확히 "not smiling"
- `natural_smile`: 원래 gentle_smile 수준으로 하향
- `bright_smile`: 원래 gentle_smile 수준으로 하향
- 전체적으로 1~2단계씩 하향 (10점 기준 1~2 수준)

### KR/JP 동일 적용
- `monkos_AI/idphoto-kr/server.js` 232-237행
- `monkos_AI/idphoto-jp/server.js` 해당 행

---

## ⚠️ 준수 조항

- **헌법 9조 (I2I 정체성 보존)**: 표정 변경이 정체성 90%+ 보존에 영향 없는지 확인
- **헌법 6조**: API 키/인프라 수정 금지

## 커밋 + 배포

- 1커밋으로 합쳐서 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**
