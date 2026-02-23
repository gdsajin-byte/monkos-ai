# 지시서: Track B — app.js + index.html + config.js + app.css

```
[2026-02-17 21:15 KST] M1/쌍아 → 막내(any)
```

## 역할 선언

> **너는 "막내 N호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → M1/쌍아` 형식

---

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | Track B — App Layer (앱 계층 구현) |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` |
| **생성 파일** | `app.js`, `config.js`, `index.html`, `app.css` (4개) |
| **참조 파일** | `index_00079.html` (원본 2,187줄 — 여기서 추출) |
| | `monk.js` (프레임워크 코어 — 이미 완성, 수정 금지) |
| | `docs/monkos/TASK_20260217_monkjs_framework.md` (API 계약서) |
| **브랜치** | `develop` |
| **배포** | 없음 (코드 작성만) |

## ★ 0원칙 확인 (필독)

> **monkos_AI/idphoto-kr/ 수정 금지. MONK_kr/ 에서만 작업.**
> **monk.js 수정 금지. API 계약 그대로 사용.**

---

## 목표

00079 모놀리스(index_00079.html)를 4개 파일로 분해하여, monk.js 프레임워크 위에서 동작하는 앱 계층을 완성한다.

```
index_00079.html (2,187줄)
  ├── CSS (라인 57~737)    → app.css
  ├── HTML (라인 738~1031) → index.html (data-bind 속성 추가)
  ├── 상수 (라인 1033~1091)→ config.js
  └── JS (라인 1092~2187)  → app.js (monk.js API 사용)
```

---

## 파일 1: config.js

00079에서 추출할 상수/설정:

```js
// config.js — 환경 설정 + 상수

export const API = {
  PORTAL_URL: 'https://monkos.ai',
  // MONK_kr은 정적 배포이므로, API는 monkos 서버를 직접 호출
  // 향후 Workers 프록시로 교체 가능
};

export const CREDIT_COST = {
  generate: 1,
  download: 10,
};

export const TOSS_CLIENT_KEY = 'test_ck_6bJXmgo28eBJk12vvDAW3LAnGKWx';

export const PHOTO_SPECS = {
  id_photo: {
    name: '여권/증명사진 (35x45mm)',
    widthMM: 35, heightMM: 45,
    faceTopMM: 7, faceLenMM: 27,
  },
  resume: {
    name: '이력서 (30x40mm)',
    widthMM: 30, heightMM: 40,
    faceTopMM: 6, faceLenMM: 24,
  },
};

// 텍스트 상수 (한국어)
export const TX = {
  stepReady: '촬영 준비',
  waiting: '대기 중',
  connecting: '연결 중',
  connected: 'AI 연결됨',
  disconnected: '연결 끊김',
  // ... (00079 라인 1039~1071 TX 객체 전체 복사)
};

export const MAX_CAPTURE_SIZE = 720;
export const COACHING_DISPLAY_MS = 10000;
export const FRAME_INTERVAL_MS = 1000;
export const CAPTURE_SIZE = 512;
```

**규칙:**
- 00079 라인 1033~1091의 상수를 **빠짐없이** 추출
- `PORTAL_URL` 등 API 엔드포인트는 00079 값 그대로 유지
- ES Module export 사용

---

## 파일 2: app.css

00079 라인 57~737의 `<style>` 내용을 그대로 추출.

**규칙:**
- CSS 수정 없이 그대로 복사 (리팩토링은 이후 별도 작업)
- `<style>` 태그 제거, 순수 CSS만

---

## 파일 3: index.html

00079 라인 738~1031의 HTML을 기반으로 재작성.

**핵심 변경:**
1. CSS → `<link rel="stylesheet" href="app.css">`
2. JS → `<script type="module" src="app.js"></script>`
3. **data-bind 속성 추가** (monk.js Store 바인딩)

### data-bind 변환 가이드

00079에서 수동 DOM 조작하던 곳을 data 속성으로 교체:

```html
<!-- 크레딧 뱃지: 기존 getElementById('creditCount') → data-bind -->
<span data-bind="user.credits"></span>

<!-- 생성된 이미지: 기존 getElementById('photo-generated').src = → data-bind-src -->
<img data-bind-src="generated" id="photo-generated">

<!-- 코칭 오버레이: 기존 classList.add('active') → data-show -->
<div data-show="coaching.ready" class="coaching-label">촬영 OK!</div>

<!-- QC 결과: data-class로 pass/fail 클래스 토글 -->
<div id="qc-badge" data-class="qcPassed:pass"></div>

<!-- 스텝 라벨: 기존 getElementById('step-label').textContent = → data-bind -->
<span data-bind="stepLabel"></span>
```

### 화면 ID 규칙

Screen 모듈의 el 셀렉터와 매칭:
```html
<div id="prep-screen">...</div>      <!-- screens.go('prep') -->
<div id="camera-area">...</div>       <!-- screens.go('camera') -->
<div id="result-overlay">...</div>    <!-- screens.go('result') -->
<div id="thankyou-screen">...</div>   <!-- screens.go('thankyou') -->
```

### 필수 요소
```html
<video id="camera-video" autoplay playsinline></video>
<canvas id="capture-canvas" style="display:none;"></canvas>
```

### 외부 스크립트
00079에서 사용하는 외부 스크립트 유지:
```html
<script src="https://js.tosspayments.com/v2/standard"></script>
```

**규칙:**
- 00079의 HTML 구조를 최대한 유지 (레이아웃, 클래스명, ID)
- `onclick="함수명()"` 인라인 핸들러 → 유지 (app.js에서 window에 노출)
- data-bind 속성만 추가하는 것이 핵심 변경

---

## 파일 4: app.js

**가장 중요한 파일.** 00079의 JS 로직(라인 1092~2187)을 monk.js API로 재작성.

### 핵심 원칙: getElementById 0개

```js
// ❌ 금지
document.getElementById('step-label').textContent = '생성 중...';

// ✅ 대신
store.stepLabel = '생성 중...';
// → data-bind="stepLabel"인 요소가 자동 갱신됨
```

### app.js 구조

```js
import Monk from './monk.js';
import { API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, ... } from './config.js';

// ─── 1. Store 초기화 ───
const store = Monk.store({
  user: { id: null, email: null, credits: 0 },
  style: null,
  gender: null,
  age: null,
  step: 0,
  captured: null,
  generated: null,
  cropped: null,
  coaching: { text: '', ready: false },
  qcResult: null,
  qcPassed: false,
  stepLabel: TX.stepReady,
  voiceEnabled: true,
  // ... 필요한 상태 추가
});

// ─── 2. Pipe 설정 ───
const pipe = Monk.pipe({
  precheck: { type: 'post', path: '/api/pre-check' },
  generate: { type: 'post', path: '/api/generate' },
  qc:       { type: 'post', path: '/api/qc' },
  creditUse:{ type: 'post', path: '/api/credit/use' },
  coaching: {
    type: 'ws',
    url: () => `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`,
    onOpen: (ws) => ws.send(JSON.stringify({ type: 'set-style', style: store.style })),
    onMessage: (msg) => {
      if (msg.type === 'ai-coaching') {
        store.coaching = { text: msg.text, ready: msg.text.includes('OK') };
      }
    },
    onClose: () => {},
    reconnect: { delay: 3000, max: 5 },
  },
}, {
  baseUrl: API.PORTAL_URL,  // 또는 서버 직접 URL
  onCreditShort: (err) => showCreditModal(err),
  onError: (name, err) => Monk.log(`API 에러[${name}]: ${err.error || err.message}`),
});

// ─── 3. Media 설정 ───
const media = Monk.media({
  video: '#camera-video',
  canvas: '#capture-canvas',
  maxSize: 720,
  captureQuality: 0.8,
  faceDetection: true,
  mirror: true,
});

// ─── 4. Screen 정의 ───
const screens = Monk.screens({
  prep:     { el: '#prep-screen' },
  camera:   {
    el: '#camera-area',
    async enter() {
      await media.start();
      pipe.connect('coaching');
      media.onFrame((frame) => pipe.send('coaching', { type: 'frame', data: frame }));
    },
    exit() {
      media.offFrame();
      media.stop();
      pipe.disconnect('coaching');
    },
  },
  result:   { el: '#result-overlay' },
  thankyou: { el: '#thankyou-screen' },
});

// ─── 5. Agent 설정 (선택 — 향후 Vision/Voice 분리용) ───
// 현재는 pipe 직접 사용으로 충분. Agent는 코칭 고도화 시 도입.

// ─── 6. 비즈니스 로직 ───

// 준비 화면 — 프로필 선택
function selectGender(gender) { store.gender = gender; checkProfileComplete(); }
function selectAge(age) { store.age = age; checkProfileComplete(); }
function selectStyle(style) { store.style = style; checkProfileComplete(); }

function checkProfileComplete() {
  // 버튼 활성화 등은 data-class 바인딩으로 처리
  store.profileComplete = !!(store.gender && store.age && store.style);
}

// 촬영 시작
async function startShooting() {
  screens.go('camera');
  store.step = 1;
  store.stepLabel = TX.step1;
}

// 촬영
function capturePhoto() {
  if (store.step !== 1) return;
  store.captured = media.capture();
  store.step = 2;
  store.stepLabel = TX.step2;
  screens.go('result');
}

// 재촬영
function retakePhoto() {
  store.captured = null;
  store.generated = null;
  store.step = 1;
  store.stepLabel = TX.step1;
  screens.go('camera');
}

// 생성 + QC 파이프라인
async function confirmAndGenerate() {
  if (!store.captured) return;
  const image = store.captured.includes(',') ? store.captured.split(',')[1] : store.captured;

  // 사전분석
  store.stepLabel = '사진 분석 중...';
  try {
    const pre = await pipe.run('precheck', { image });
    if (!pre.suitable) {
      store.stepLabel = '재촬영을 권장합니다';
      return;
    }
  } catch { /* 사전분석 실패 시 진행 */ }

  // 생성
  store.step = 3;
  store.stepLabel = TX.generating;
  try {
    const gen = await pipe.run('generate', {
      image, style: store.style, gender: store.gender,
      age: store.age, userId: store.user.id,
    });
    store.generated = gen.image;

    // QC
    store.stepLabel = TX.qcVerifying;
    try {
      const qc = await pipe.run('qc', {
        original: image,
        generated: gen.image.includes(',') ? gen.image.split(',')[1] : gen.image,
        gender: store.gender, age: store.age,
      });
      store.qcResult = qc;
      store.qcPassed = qc.identity === 'PASS' || qc.same_person === true;
      store.stepLabel = store.qcPassed ? TX.resultDone : TX.resultFail;
    } catch (qcErr) {
      store.qcPassed = false;
      store.stepLabel = 'QC 에러';
    }
  } catch (err) {
    if (err.status === 402) {
      store.step = 2;
      return; // onCreditShort가 모달 처리
    }
    store.stepLabel = TX.genFail;
  }
}

// 다운로드
async function downloadResult() {
  if (!store.generated) return;
  store.cropped = (await media.crop(store.generated, PHOTO_SPECS[store.style])).dataUrl;
  screens.go('thankyou');
}

// 인증 (00079 라인 1118~1140, 1172~1188 참조)
async function initFromUrlToken() { /* 00079 로직 이식 */ }
function initCredits() { /* 00079 로직 이식 */ }
async function fetchLatestCredits() { /* 00079 로직 이식 */ }

// 결제 (00079 라인 1228~1314 참조)
async function buyCreditsKR(amount, credits) { /* 00079 로직 이식 */ }
async function initFromTossResult() { /* 00079 로직 이식 */ }

// 크레딧 모달
function showCreditModal(err) { /* 00079 로직 이식 */ }
function closeCreditModal() { /* 00079 로직 이식 */ }

// 음성 가이드 (00079 라인 1424~1451 참조)
function initVoice() { /* 00079 로직 이식 */ }
function speakKo(text) { /* 00079 로직 이식 */ }
function toggleVoice() { store.voiceEnabled = !store.voiceEnabled; }

// ─── 7. window 노출 (인라인 onclick 호환) ───
Object.assign(window, {
  selectGender, selectAge, selectStyle,
  startShooting, capturePhoto, retakePhoto,
  confirmAndGenerate, downloadResult,
  buyCreditsKR, closeCreditModal,
  toggleVoice,
});

// ─── 8. 초기화 ───
async function init() {
  await initFromUrlToken();
  initCredits();
  await initFromTossResult();
  if (!Monk.isMobile() && !new URLSearchParams(location.search).has('dev')) {
    // 데스크톱 차단 표시 (Store 바인딩으로)
    store.desktopBlocked = true;
  }
  screens.go('prep');
}

init();
```

### 이식 시 주의사항

1. **/* 00079 로직 이식 */로 표시된 함수**: index_00079.html의 해당 라인을 참조하여 실제 코드를 채워라. 위 구조는 뼈대이며, 빈 함수로 남기지 마라.

2. **API 경로 주의**: 00079은 같은 서버(`/api/generate`)에서 API를 호출하지만, MONK_kr은 정적 사이트이므로 API URL을 절대경로로 변경해야 할 수 있다. 우선은 00079 패턴 그대로 유지하고, 주석으로 `// TODO: Workers 프록시 전환 시 변경` 표시.

3. **Store 바인딩으로 대체 불가능한 DOM 조작**: 복잡한 DOM 조작(예: TTS 제어, 결제창 호출)은 app.js에서 직접 처리해도 무방. 단, `getElementById` 대신 `document.querySelector`를 쓰고, 가능한 한 Store 변경으로 대체.

4. **인라인 이벤트 핸들러**: 00079의 `onclick="capturePhoto()"` 패턴을 유지. app.js에서 `window.capturePhoto = capturePhoto`로 노출. 향후 이벤트 위임으로 교체 가능.

5. **visibilitychange 리스너**: 00079 라인 1165~1170의 탭 복귀 시 크레딧 재조회 — `init()`에서 등록.

6. **데스크톱 차단**: 00079의 `showDesktopBlocker()` → Store의 `desktopBlocked` + data-show 바인딩으로 대체.

---

## 완료 기준

- [ ] `config.js` — 00079 상수 전체 추출, ES Module export
- [ ] `app.css` — 00079 CSS 그대로 추출 (~680줄)
- [ ] `index.html` — data-bind 속성 추가, monk.js/app.js 로드, 외부 스크립트 유지
- [ ] `app.js` — monk.js API 사용, getElementById 0개 목표, 빈 함수 없음
- [ ] 5개 파일 로드 시 콘솔 에러 없음 (API 미연결 제외)
- [ ] `index_00079.html`의 전체 기능이 4파일에 빠짐없이 대응

## 커밋

```bash
git add MONK_kr/ai_lab/photolab/app.js MONK_kr/ai_lab/photolab/config.js MONK_kr/ai_lab/photolab/index.html MONK_kr/ai_lab/photolab/app.css
git commit -m "[feature] Track B 앱 계층 v1 — app.js/config.js/index.html/app.css"
git push origin develop
```

## 완료 보고

2규칙 형식. 📁 변경 파일 + 🔀 커밋 필수.

---

*[2026-02-17 21:15 KST] M1/쌍아 → 막내(any)*
