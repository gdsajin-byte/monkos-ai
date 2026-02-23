# 지시서: 촬영실 세팅 — 퍼널 연동 + 코칭 모델 전환 + 프롬프트 강화

```
[2026-02-21 04:52 KST] M1/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 촬영실 세팅 — 퍼널 9필드 연동 + 코칭 강화 |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` + `functions/api/` |
| **수정 파일** | `camera.html`, `camera.js`, `functions/api/idphoto-coaching.js` |
| **브랜치** | `develop` |
| **선행 작업** | 준비실 키오스크 퍼널 완료 (prep.js 9필드) |

## 0원칙

> **monkos_AI/ 수정 금지.** (프로덕션 동결)
> **monk.js, shared.js, config.js 수정 금지.** (공통 모듈 보호)
> **prep.html, prep.js, result.html, result.js 수정 금지.** (다른 페이지 보호)
> **API 키 하드코딩 금지.** `env.GEMINI_API_KEY` (CF Pages Secrets) 사용.
> 작업 범위: `camera.html` + `camera.js` + `functions/api/idphoto-coaching.js` 3파일만.

---

## 배경

준비실이 9필드 퍼널로 확장되었다. 현재 촬영실(camera.js)은 `style`, `gender`, `age` 3개만 읽고, 코칭 CF Function은 `gemini-2.0-flash` 모델에 `style`만 전달한다.

### 문제점
1. **퍼널 9필드 미연동** — 의상/넥타이/헤어/배경/표정 데이터가 코칭에 반영 안 됨
2. **모델 미전환** — 기획은 Gemini 3 Flash, 현재 gemini-2.0-flash
3. **스타일바 불필요** — 퍼널에서 용도를 이미 선택했으므로 촬영 중 변경은 혼란
4. **코칭 프롬프트 단순** — 9필드 정보를 활용하면 훨씬 정교한 코칭 가능

---

## 구현 상세

### Task 1: camera.js — 퍼널 9필드 로딩

현재 `init()`에서 `store.style`, `store.gender`, `store.age` 3개만 체크한다.
9필드 전체를 sessionStorage에서 로딩하도록 확장.

```js
// 현재 (3필드)
if (!store.style || !store.gender || !store.age) {
  location.href = 'prep.html';
  return;
}

// 변경 (9필드 로딩 — style+age는 필수 체크, 나머지는 선택)
const purpose = loadSessionData('purpose');
const age = loadSessionData('age');
const gender = loadSessionData('gender');
const clothing = loadSessionData('clothing');
const clothingColor = loadSessionData('clothingColor');
const tie = loadSessionData('tie');
const hair = loadSessionData('hair');
const background = loadSessionData('background');
const expression = loadSessionData('expression');

// 필수값 체크 (legacy: style은 purpose→style 매핑으로 이미 저장됨)
if (!store.style || !purpose) {
  location.href = 'prep.html';
  return;
}

// store에 9필드 세팅
store.purpose = purpose;
store.clothing = clothing;
store.clothingColor = clothingColor;
store.tie = tie;
store.hair = hair;
store.background = background;
store.expression = expression;
```

**중요**: `store.style`은 shared.js의 `sharedInit()`에서 이미 sessionStorage → store로 복원됨. `purpose`는 별도로 읽어야 함.

---

### Task 2: camera.js — 코칭 프레임 전송 시 9필드 포함

현재 `sendCoachingFrame()`은 `image`와 `style`만 전송한다.
9필드 전체를 코칭 API에 전달하여 정교한 코칭 가능하게 확장.

```js
// 현재
body: JSON.stringify({ image: base64, style: store.style || 'id_photo' }),

// 변경
body: JSON.stringify({
  image: base64,
  style: store.style || 'id_photo',
  purpose: store.purpose,
  gender: store.gender,
  age: store.age,
  clothing: store.clothing,
  clothingColor: store.clothingColor,
  tie: store.tie,
  hair: store.hair,
  expression: store.expression,
}),
```

---

### Task 3: camera.html — 스타일바 제거 + 선택 요약 표시

퍼널에서 이미 용도를 선택했으므로 촬영 중 스타일 변경 바는 불필요.
대신 현재 선택 요약을 읽기 전용으로 간결하게 표시.

**삭제할 요소:**
```html
<!-- 이 전체 블록 삭제 -->
<div id="style-bar">
  <div class="style-chip" data-style="id_photo" onclick="selectStyleInCamera('id_photo')">여권/신분증</div>
  <div class="style-chip" data-style="resume" onclick="selectStyleInCamera('resume')">취업/컬러증명</div>
</div>
```

**대체할 요소:**
```html
<!-- 선택 요약 뱃지 (읽기 전용, 카메라 위 상단) -->
<div id="selection-summary"></div>
```

camera.js에서 init() 시 동적으로 채움:

```js
const summaryEl = document.querySelector('#selection-summary');
if (summaryEl) {
  const labels = [];
  // purpose 라벨 매핑
  const PURPOSE_LABELS = {
    passport: '여권', student_id: '학생증', employee_id: '사원증',
    resume: '이력서', color_portrait: '컬러증명'
  };
  labels.push(PURPOSE_LABELS[store.purpose] || store.style);
  if (store.gender === 'male') labels.push('남성');
  else if (store.gender === 'female') labels.push('여성');
  summaryEl.textContent = labels.join(' · ');
}
```

CSS는 app.css를 수정하지 않고 camera.html 내 `<style>` 또는 인라인으로 처리.
(단, camera.html은 기존에 app.css를 사용 — 새 클래스를 app.css에 추가하는 것이 아니라 camera.html head에 `<style>` 블록 추가)

**`#selection-summary` 스타일 예시:**
```css
#selection-summary {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 20px;
  z-index: 5;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

---

### Task 4: camera.js — selectStyleInCamera 제거

스타일바를 삭제했으므로 관련 함수도 정리:

- `selectStyleInCamera()` 함수 삭제
- `window` 노출에서도 제거
- init()의 스타일 칩 동기화 코드 삭제:
  ```js
  // 삭제
  document.querySelectorAll('.style-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.style === style);
  });
  ```

---

### Task 5: idphoto-coaching.js — Gemini 모델 전환

```js
// 현재
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// 변경
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
```

**참고**: `gemini-3-flash-preview`는 내부 프리뷰명. 공개 API에서는 `gemini-2.5-flash`가 현재 최신 stable Flash 모델. 호출 실패 시 기존 `gemini-2.0-flash`로 폴백 가능하도록 에러 핸들링 강화.

---

### Task 6: idphoto-coaching.js — 프롬프트 강화 (9필드 활용)

현재 `COACHING_INSTRUCTIONS`는 `id_photo`/`resume` 2개 고정 프롬프트.
9필드 데이터를 받아서 **동적 프롬프트 빌더**로 전환.

```js
function buildCoachingPrompt(body) {
  const { style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = body;

  const base = style === 'id_photo' ? COACHING_INSTRUCTIONS.id_photo : COACHING_INSTRUCTIONS.resume;

  // 9필드 컨텍스트 추가
  const context = [];

  if (clothing && clothing !== 'as_is') {
    const clothingNames = { suit: '정장', shirt: '셔츠/블라우스', casual: '캐주얼', uniform: '교복' };
    context.push(`사용자 의상: ${clothingNames[clothing] || clothing}`);
    if (clothingColor) {
      const colorNames = { black: '검정', navy: '네이비', charcoal: '차콜', white: '흰색', beige: '베이지', wine: '와인', pastel: '파스텔' };
      context.push(`의상 컬러: ${colorNames[clothingColor] || clothingColor}`);
    }
  }

  if (tie && tie !== 'none' && gender === 'male') {
    context.push(`넥타이 착용 예정`);
  }

  if (hair && hair !== 'as_is') {
    const hairNames = { tidy: '정돈', up: '올림머리', down: '내림머리' };
    context.push(`헤어 스타일: ${hairNames[hair] || hair}`);
  }

  if (expression) {
    const exprNames = { gentle_smile: '잔잔한 미소', neutral: '무표정', natural_smile: '자연스러운 미소', bright_smile: '밝은 미소' };
    context.push(`목표 표정: ${exprNames[expression] || expression}`);
  }

  if (context.length === 0) return base;

  return base + `\n\n[사용자 설정]\n${context.join('\n')}\n\n위 설정을 참고하여 촬영 전 코칭해 주세요. 의상이나 표정에 대한 구체적인 조언도 가능합니다.`;
}
```

`onRequestPost`에서:
```js
// 현재
const instruction = COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo;

// 변경
const instruction = buildCoachingPrompt(body);
```

`body`에서 9필드를 destructure하므로, 클라이언트에서 안 보내면 undefined → context 배열에 안 들어감 → 기존 동작 호환.

---

### Task 7: idphoto-coaching.js — API 호출 방식 통일

현재 API 키 전달이 query parameter (`?key=`)로 되어 있다.
보안 best practice인 헤더 방식(`x-goog-api-key`)으로 통일. (precheck.js와 동일 패턴)

```js
// 현재
const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
});

// 변경
const geminiRes = await fetch(GEMINI_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  },
  body: JSON.stringify({ ... }),
});
```

---

## 데이터 흐름 (변경 후)

```
prep.js (9필드)
  ↓ sessionStorage
camera.js (9필드 로드)
  ↓ POST /api/idphoto-coaching
idphoto-coaching.js (9필드 → 동적 프롬프트 → Gemini 2.5 Flash)
  ↓ { text, ready }
camera.js (코칭 표시 + TTS)
```

---

## 수정하지 않는 것 (명시)

| 파일 | 이유 |
|------|------|
| `shared.js` | 공통 모듈. store 키 추가 필요하면 camera.js에서 직접 세팅 |
| `config.js` | 상수 변경 없음 |
| `monk.js` | 프레임워크 |
| `prep.js` / `prep.html` | 이미 완성, 보호 |
| `result.js` / `result.html` | 이번 범위 아님 |
| `app.css` | camera.html `<style>` 블록으로 신규 스타일 추가 |
| `precheck.js` / `idgen.js` | 이번 범위 아님 |

---

## 완료 조건

### Level 1 (필수)
- [ ] camera.js에서 9필드 sessionStorage 로딩
- [ ] 코칭 API 호출 시 9필드 전달
- [ ] idphoto-coaching.js 모델 gemini-2.0-flash → gemini-2.5-flash 전환
- [ ] 동적 프롬프트 빌더 구현 (9필드 반영)
- [ ] API 키 전달: query param → x-goog-api-key 헤더
- [ ] 스타일바 제거 + 선택 요약 뱃지 표시
- [ ] 퍼널 → 촬영실 → 분석실 플로우 정상 동작 (기존 깨지지 않음)

### Level 2 (권장)
- [ ] 선택 요약 뱃지에 용도 + 성별 표시
- [ ] selectStyleInCamera 관련 코드 완전 정리
- [ ] 코칭 프롬프트에 의상/표정 컨텍스트 반영 확인

### Level 3 (보너스)
- [ ] 코칭 응답에서 설정 기반 조언 품질 확인 (수동 테스트 — 로그 출력)
- [ ] 모델 전환 실패 시 fallback 로직

---

## 참조

- **현재 구현**: `MONK_kr/ai_lab/photolab/camera.html`, `camera.js`
- **CF Function**: `functions/api/idphoto-coaching.js`
- **기술 명세**: `MONK_kr/ai_lab/photolab/TECH_SPEC_MPA.md`
- **퍼널 구현**: `MONK_kr/ai_lab/photolab/prep.js` (9필드 데이터 구조 참조)
- **공통 모듈**: `MONK_kr/ai_lab/photolab/shared.js` (수정 금지, import만)

---

## 주의사항

1. **app.css 수정 금지** — 신규 스타일은 camera.html 내 `<style>` 블록에 추가
2. **API 키 하드코딩 금지** — `env.GEMINI_API_KEY` (CF Pages Secrets)
3. **result.js 플로우에 영향 없어야 함** — camera → result 전환 시 기존 `captured` sessionStorage 저장 유지
4. **prep.js에서 저장한 legacy 키(style, gender, age)는 건드리지 않는다** — 추가 키만 읽기
5. **gemini-2.5-flash 호출 실패 시** — 에러 로그 남기고 빈 응답 반환 (코칭 루프 중단하지 않음)
