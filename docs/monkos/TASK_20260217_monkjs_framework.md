# 지시서: MONK.js 프레임워크 코어 구현

```
[2026-02-17 20:31 KST] M1/쌍아 → 막내(any)
```

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | MONK.js Framework Core |
| **작업 경로** | `MONK_kr/ai_lab/photolab/monk.js` |
| **베이스라인** | `MONK_kr/ai_lab/photolab/index_00079.html` (2,187줄 모놀리스) |
| **참고 문서** | `MONK_kr/ai_lab/photolab/flowchart_00079.html` (코드 분석) |
| | `MONK_kr/ai_lab/photolab/framework_design.html` (설계서) |
| **브랜치** | `develop` |
| **배포** | 없음 (코드 작성만) |

## ★ 0원칙 확인 (필독)

> **monkos_AI/idphoto-kr/ 수정 금지. MONK_kr/ 에서만 작업.**
> CLAUDE.md ★ 0원칙 참조.

## 목표

`monk.js` 파일 1개를 작성한다. 이 파일은 5개 코어 모듈을 포함하는 마이크로 프레임워크다.

```
monk.js (~300줄)
├── Screen   — 화면 상태 머신 + enter/exit 생명주기
├── Store    — Proxy 반응형 상태 + HTML data-bind 자동 바인딩
├── Pipe     — REST/WS 범용 AI 통신 + 릴레이 루프
├── Media    — 카메라 캡처/해제 + 얼굴검출 + 규격 크롭
└── Agent    — 독립 AI 에이전트 (Vision/Voice 패턴)
```

## API 계약 (절대 준수)

아래 인터페이스는 app.js(별도 팀 작업)와의 계약이다. **시그니처를 변경하지 마라.**
내부 구현은 자유. 인터페이스만 지키면 된다.

---

### 1. Monk.screens(definitions) → screenManager

```js
// 생성
const screens = Monk.screens({
  prep:     { el: '#prep-screen' },
  camera:   { el: '#camera-area',  enter(params) {}, exit(params) {} },
  result:   { el: '#result-overlay' },
  thankyou: { el: '#thankyou-screen' },
});

// 메서드
screens.go('camera', { mode: 'coaching' });  // 화면 전환
screens.current;                              // 현재 화면 이름 (string)
```

**동작 규칙:**
- `go(name, params?)` 호출 시:
  1. 이전 화면 el에서 `active` 클래스 제거
  2. 이전 화면 `exit(params)` 호출 (있으면)
  3. 새 화면 el에 `active` 클래스 추가
  4. 새 화면 `enter(params)` 호출 (있으면)
- enter/exit는 async 가능 (await 처리)
- 초기 상태: 어떤 화면도 active 아님

---

### 2. Monk.store(initialState) → proxy

```js
// 생성
const store = Monk.store({
  user: { id: null, email: null, credits: 0 },
  style: null,
  gender: null,
  step: 0,
  captured: null,
  generated: null,
  coaching: { text: '', ready: false },
});

// 사용: 값 변경 → DOM 자동 갱신
store.style = 'id_photo';
store.user = { ...store.user, credits: 10 };
```

**HTML 바인딩 속성:**

| 속성 | 동작 | 예시 |
|------|------|------|
| `data-bind="key"` | el.textContent = value | `<span data-bind="credits">` |
| `data-bind-src="key"` | el.src = value | `<img data-bind-src="generated">` |
| `data-show="key"` | truthy→표시, falsy→숨김 | `<div data-show="coaching.ready">` |
| `data-hide="key"` | data-show 반대 | `<div data-hide="loading">` |
| `data-class="key:className"` | truthy→add, falsy→remove | `<div data-class="ready:is-ready">` |

**중첩 처리:**
- 1단계 중첩: `store.user` 변경 시 `data-bind="user.credits"` 갱신
- 방법: 점(.) 표기 파싱. `user.credits` → `store.user` 객체의 `credits` 참조
- 깊은 중첩 불필요 (1단계면 충분)

**구독 (선택):**
```js
Monk.watch(store, 'key', (newVal, oldVal) => { });
```

---

### 3. Monk.pipe(definitions, options?) → pipeManager

```js
// 생성
const pipe = Monk.pipe({
  precheck: { type: 'post', path: '/api/pre-check' },
  generate: { type: 'post', path: '/api/generate' },
  qc:       { type: 'post', path: '/api/qc' },
  coaching: {
    type: 'ws',
    url: () => `wss://${location.host}`,
    onOpen(ws) { },
    onMessage(parsed, ws) { },
    onClose() { },
    reconnect: { delay: 3000, max: 5 },
  },
}, {
  baseUrl: '',
  onError(name, error) { },
  onCreditShort(error) { },   // 402 전용
});

// REST 실행
const result = await pipe.run('generate', { image, style, gender });

// WebSocket
pipe.connect('coaching');
pipe.send('coaching', { type: 'frame', data: base64 });
pipe.disconnect('coaching');
pipe.isConnected('coaching');  // boolean
```

**pipe.run() 규칙:**
- Content-Type: application/json 자동
- 200~299 → JSON 파싱 반환
- 402 → onCreditShort 호출 후 throw
- 그 외 → onError 호출 후 throw
- throw 객체: `{ status, error, ...serverResponse }`

**pipe.startLoop(name, intervalMs, inputFn) / pipe.stopLoop(name):**
```js
// 릴레이 루프 (용아 패턴: isProcessing 백프레셔 방지)
pipe.startLoop('vision', 2000, () => media.capture());
pipe.stopLoop('vision');
```
- inputFn()이 null 반환 시 스킵
- 이전 실행이 안 끝났으면 스킵 (isProcessing 플래그)
- 결과는 해당 agent의 onResult 콜백으로 전달

---

### 4. Monk.media(config) → mediaManager

```js
// 생성
const media = Monk.media({
  video: '#camera-video',
  canvas: '#capture-canvas',
  maxSize: 720,
  captureQuality: 0.8,
  frameInterval: 1000,
  faceDetection: true,
  mirror: true,
});

// 메서드
await media.start();                    // getUserMedia + video.srcObject
media.stop();                           // stream 해제 + 타이머 정리
const base64 = media.capture();         // 현재 프레임 → JPEG dataURL
media.onFrame(callback);                // 주기 캡처 콜백 등록
media.offFrame();                       // 콜백 해제
const result = await media.crop(dataURL, spec);  // 얼굴검출 + 규격 크롭
const jpeg = await media.toJpeg(dataURL, 0.92);  // PNG→JPEG 변환
```

**crop() spec 형식:**
```js
{ widthMM: 35, heightMM: 45, faceTopMM: 7, faceLenMM: 27 }
```

**crop() 반환:**
```js
{ dataUrl, spec, outputW, outputH }
```

**얼굴검출 우선순위:**
1. MediaPipe FaceDetector (CDN import)
2. Chrome FaceDetector API (폴백)
3. 휴리스틱 (최종 폴백: 이미지 중앙 45%×50%)

**mirror 처리:**
- `mirror: true` → capture() 시 ctx.translate + ctx.scale(-1, 1)

---

### 5. Monk.agent(name, config) → agent

```js
// 생성
const vision = Monk.agent('vision', {
  pipe: pipe,          // Pipe 인스턴스 참조
  endpoint: 'precheck', // pipe 내 엔드포인트 이름
  type: 'rest',
  interval: 2000,
});

const voice = Monk.agent('voice', {
  pipe: pipe,
  endpoint: 'coaching',
  type: 'ws',
});

// Vision 메서드
vision.onResult(callback);    // 분석 결과 콜백
vision.start(inputFn);        // pipe.startLoop 래핑
vision.stop();                // pipe.stopLoop 래핑

// Voice 메서드
voice.connect();              // pipe.connect 래핑
voice.disconnect();           // pipe.disconnect 래핑
voice.inject(data);           // WS로 컨텍스트 주입 (pipe.send 래핑)
voice.onMessage(callback);    // WS 메시지 수신 콜백
```

**Agent는 Pipe의 고수준 래퍼다.** 직접 WS/REST를 다루지 않고 pipe를 경유한다.

---

### 6. 유틸리티

```js
Monk.log(msg);         // console.log with timestamp prefix
Monk.isMobile();       // UA + touchPoints 판정
```

---

## 구현 지침

### 필수 사항
1. **순수 JS, ES Module** — `export` 사용, 번들러 불필요
2. **외부 의존성 0** — MediaPipe만 CDN dynamic import
3. **파일 1개** — `monk.js` 안에 전부 포함
4. **~300줄 목표** — 최대 400줄. 넘으면 과잉 설계
5. **00079 코드의 실제 패턴을 반영** — 이론이 아닌 실전
   - `index_00079.html` 읽고 실제 DOM 구조, 이벤트 패턴 확인
   - 특히 카메라 미러링, iOS Safari 대응, 갤럭시 터치 이벤트 등

### 주의 사항
- `getElementById` 0개 원칙: monk.js 내부에서는 `querySelector`만 사용 (바인딩 스캔용)
- app.js에서 `getElementById`를 쓸 일이 없어야 함 — 그게 프레임워크의 존재 이유
- Store의 Proxy는 1단계 중첩까지만. 깊은 중첩 지원하려다 복잡해지지 마라
- Media.crop()의 얼굴검출 코드는 00079의 `cropToSpec()` (라인 1916~2010) 참고

### 참조 코드 위치 (00079 기준)
| 기능 | 라인 |
|------|------|
| 전역 상태 변수 | 1093~1116 |
| 크레딧 시스템 | 1110~1262 |
| 카메라 초기화 | 별도 initCamera() |
| WS 코칭 | 1566~1612 |
| 프레임 캡처 | startFrameCapture() |
| 촬영 | capturePhoto() 1716~1756 |
| 사전분석+생성+QC | confirmAndGenerate() 1776~1863 |
| 규격 크롭 | cropToSpec() 1916~2010 |
| 모바일 판정 | isMobile() 2166~2169 |

## 완료 기준

- [ ] `monk.js` 파일 생성 완료
- [ ] Monk.screens / Monk.store / Monk.pipe / Monk.media / Monk.agent 전부 구현
- [ ] 위 API 계약의 모든 메서드가 존재하고 시그니처 일치
- [ ] 00079의 cropToSpec 로직 이식 (MediaPipe + Chrome API + 휴리스틱)
- [ ] 00079의 카메라 미러링 로직 이식
- [ ] 단독 테스트 가능: `<script type="module" src="monk.js">` 로 로드 후 콘솔에서 API 호출 확인

## 커밋

```bash
git add MONK_kr/ai_lab/photolab/monk.js
git commit -m "[feature] MONK.js 프레임워크 코어 v1 — Screen/Store/Pipe/Media/Agent"
git push origin develop
```

## 완료 보고

2규칙 형식으로 보고. 📁 변경 파일 + 🔀 커밋 필수.

---

*[2026-02-17 20:31 KST] M1/쌍아 → 막내(any)*
