# 지시서: monk.js 코드 리뷰 반영 + 통합 테스트

```
[2026-02-17 21:22 KST] M1/쌍아 → 막내2
```

## 역할 선언

> **너는 막내 2호다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실에서 설계/리뷰하는 에이전트 (이 지시서의 발신자)
> - 너 = iTerm에서 코드를 실행하는 막내 2호
> - CLAUDE.md의 "막내 규칙" 섹션이 너의 행동 규범이다

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | monk.js Polish + Integration Test |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` |
| **대상 파일** | `monk.js` (수정), `test.html` (신규) |
| **병렬 작업** | 막내1이 동시에 `app.js` 작업 중 — **app.js 절대 터치 금지** |
| **브랜치** | `develop` |
| **배포** | 없음 (코드 작성만) |

## ★ 0원칙 확인 (필독)

> **monkos_AI/idphoto-kr/ 수정 금지. MONK_kr/ 에서만 작업.**
> CLAUDE.md ★ 0원칙 참조.

## ★ 충돌 방지 (절대 준수)

> 막내1이 동시에 `app.js`, `config.js`, `index.html`, `app.css` 작업 중.
> **이 4개 파일은 읽기만 가능, 수정 금지.**
> 너의 작업 범위: `monk.js` + `test.html` (신규) 만 해당.

---

## 작업 1: Agent REST result delivery 개선

### 현재 문제 (monk.js 604~610줄)

```js
// 현재: 100ms polling으로 결과 체크 — 비효율적
const checkResult = setInterval(() => {
  const loop = pipeInstance._loops[endpoint];
  if (loop?._lastResult) {
    if (resultCallback) resultCallback(loop._lastResult);
    loop._lastResult = null;
  }
}, 100);
```

**문제점:**
- 100ms마다 무의미한 체크 반복
- `_lastResult` + `_resultChecker` 라는 내부 상태 추가 오염
- 타이밍 이슈: result 발생 후 최대 100ms 딜레이

### 개선 방향: Pipe.startLoop에서 직접 콜백 호출

**Pipe 쪽 (startLoop 내부, 라인 280~305):**

현재 `loops[name]._lastResult = result;`에 결과를 저장하는 대신, 등록된 콜백을 직접 호출하도록 변경.

```js
// 개선안: startLoop 내부에서 결과 콜백 직접 호출
const startLoop = (name, intervalMs, inputFn) => {
  // ... 기존 코드 ...
  try {
    const result = await run(name, input);
    // agent가 등록한 콜백이 있으면 직접 호출
    if (agentCallbacks[name]) {
      agentCallbacks[name](result);
    }
  } catch (err) { }
  // ...
};
```

**Agent 쪽 (라인 596~622):**

```js
// 개선안: polling 제거, onResult 콜백을 pipe의 agentCallbacks에 등록
if (type === 'rest') {
  const onResult = (callback) => {
    resultCallback = callback;
    // REST용 콜백도 agentCallbacks에 등록
    pipeInstance._agentCallbacks[endpoint] = (result) => {
      if (resultCallback) resultCallback(result);
    };
  };

  const start = (inputFn) => {
    pipeInstance.startLoop(endpoint, interval, inputFn);
    // polling 제거 — Pipe가 직접 콜백 호출
  };

  const stop = () => {
    pipeInstance.stopLoop(endpoint);
  };

  return { onResult, start, stop, name };
}
```

### API 계약 불변 확인

| 메서드 | 시그니처 | 변경 |
|--------|----------|------|
| `vision.onResult(callback)` | 동일 | ❌ |
| `vision.start(inputFn)` | 동일 | ❌ |
| `vision.stop()` | 동일 | ❌ |
| `pipe.startLoop(name, ms, fn)` | 동일 | ❌ |
| `pipe.stopLoop(name)` | 동일 | ❌ |

내부 구현만 변경. 외부 API 시그니처 일체 변경 없음.

### 제거 대상

- `loops[name]._lastResult` 저장 로직
- `loops[name]._resultChecker` setInterval
- Agent의 `clearInterval(loop._resultChecker)` 정리 코드

---

## 작업 2: Pipe `_loops` 내부 구조 정리

현재 `_loops`가 외부 노출(라인 323):
```js
_loops: loops,
```

Agent가 `pipeInstance._loops[endpoint]`를 직접 참조하는 패턴을 제거했으므로,
`_loops` 노출은 유지하되 `_lastResult` / `_resultChecker` 프로퍼티는 제거된다.

---

## 작업 3: `test.html` 작성

`MONK_kr/ai_lab/photolab/test.html` — 브라우저에서 monk.js 모듈을 단독 테스트하는 페이지.

### 요구사항

1. **파일 로드**: `<script type="module">` 로 monk.js import
2. **각 모듈 테스트 버튼** (UI 최소한):
   - **Screen**: 화면 2개 정의 → go() 호출 → active 클래스 확인
   - **Store**: 상태 변경 → data-bind DOM 갱신 확인
   - **Store 중첩**: `store.user = { credits: 10 }` → `data-bind="user.credits"` 갱신 확인
   - **Pipe REST**: mock endpoint (실제 호출 없이 에러 핸들링 확인)
   - **Media**: 카메라 권한 요청 → 비디오 표시 (수동 확인)
   - **Agent**: Vision agent 생성 → onResult 콜백 등록 확인
3. **결과 표시**: 각 테스트 pass/fail을 DOM에 표시 (console.log도 병행)
4. **자립 실행**: 외부 서버 없이 `file://` 또는 로컬 서버로 열 수 있을 것
5. **스타일**: 최소한. 검정 배경 + 모노스페이스. 예쁠 필요 없음

### 테스트 구조 예시

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>monk.js 단위 테스트</title>
  <style>
    body { background: #111; color: #0f0; font-family: monospace; padding: 20px; }
    .pass { color: #0f0; }
    .fail { color: #f00; }
    button { margin: 4px; padding: 8px 16px; }
  </style>
</head>
<body>
  <!-- Screen 테스트용 더미 화면 -->
  <div id="screen-a" style="display:none">Screen A</div>
  <div id="screen-b" style="display:none">Screen B</div>

  <!-- Store 바인딩 테스트용 -->
  <span data-bind="name">초기값</span>
  <span data-bind="user.credits">0</span>

  <!-- 테스트 버튼 + 결과 -->
  <div id="controls"></div>
  <pre id="log"></pre>

  <script type="module">
    import Monk from './monk.js';
    // 테스트 코드...
  </script>
</body>
</html>
```

---

## 구현 지침

1. **monk.js 수정은 최소한** — Agent REST polling 제거가 메인. 다른 코드 건드리지 마라
2. **API 시그니처 변경 금지** — 막내1의 app.js가 이 API에 의존 중
3. **test.html은 실용적으로** — 과도한 테스트 프레임워크 도입 금지. 순수 JS로
4. **00079 참조 불필요** — 이 작업은 monk.js 내부 개선이므로 00079 안 봐도 됨

## 완료 기준

- [ ] Agent REST: polling 제거, Pipe→Agent 직접 콜백 방식으로 전환
- [ ] `_lastResult`, `_resultChecker` 관련 코드 전량 제거
- [ ] 기존 API 시그니처 100% 유지 (onResult/start/stop/startLoop/stopLoop)
- [ ] `test.html` 생성 — Screen, Store, Agent 최소 3개 모듈 테스트 가능
- [ ] test.html에서 monk.js import + 테스트 pass 확인

## 커밋

```bash
git add MONK_kr/ai_lab/photolab/monk.js MONK_kr/ai_lab/photolab/test.html
git commit -m "[refactor] monk.js Agent REST polling→콜백 전환 + 단위 테스트"
git push origin develop
```

## 완료 보고

2규칙 형식으로 보고. 📁 변경 파일 + 🔀 커밋 필수.

---

*[2026-02-17 21:22 KST] M1/쌍아 → 막내2*
