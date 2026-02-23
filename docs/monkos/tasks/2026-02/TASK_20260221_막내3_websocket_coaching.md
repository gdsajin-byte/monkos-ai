# 지시서: camera.js WebSocket 코칭 전환 (REST → Live)

```
[2026-02-21 19:10 KST] iMac/쌍아 → 막내3
```

## 역할 선언

> **너는 "막내3"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → iMac/쌍아` 형식
> - **선행 조건**: 막내2 작업 완료 후 실행 (public/에 파일 배치 필요)
> - **네 수정 범위**: `monkos_AI/idphoto-kr/public/camera.js`, `monkos_AI/idphoto-kr/public/shared.js` (Pipe WS 추가만)

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 촬영실 코칭 REST 폴링 → WebSocket 실시간 전환 |
| **수정 파일** | `monkos_AI/idphoto-kr/public/camera.js`, `monkos_AI/idphoto-kr/public/shared.js` |
| **브랜치** | `develop` |
| **긴급도** | 높음 (iOS TTS 문제 근본 해결) |
| **선행 작업** | 막내2 프론트엔드 이식 완료 필수 |

## ⚠️ 준수 조항

- **법률 제2장**: monk.js Store/Pipe 패턴 유지
- **헌법 제7조**: 피드백 의무 — iOS TTS 안정화 확인 필수

## ⚠️ 파일 충돌 방지

- `server.js` 수정 금지 (막내1 담당)
- `config.js` 수정 금지 (막내2가 완료)
- `result.js`, `prep.js`, `thankyou.js` 수정 금지
- HTML 파일 수정 금지

---

## 배경

현재 camera.js는 REST 폴링 방식으로 2초마다 프레임을 캡처하여 `/api/coaching` POST로 전송한다.
이 방식은 매번 `speechSynthesis.cancel()` + 새 `speak()`를 반복하여 iOS Safari에서 TTS가 사일런트 실패한다.

idphoto-kr server.js에는 이미 Gemini Live 2.0 WebSocket 코칭이 구현되어 있다:
- 클라이언트 → WS 바이너리(JPEG 프레임) 전송
- 서버 → Gemini Live에 전달 → 응답 버퍼링 → `{ type: 'ai-coaching', text }` JSON 전송
- 5프레임마다 `turnComplete` 트리거

### WebSocket 서버 핸들러 상세 (server.js 줄 543-626)

**메시지 타입:**
- 바이너리: JPEG 프레임 → base64 변환 → `sendRealtimeInput({ media })` 전송
- 텍스트 JSON:
  - `{ type: 'set-style', style: 'id_photo' | 'resume' }` — 코칭 스타일 변경
  - `{ type: 'stop-coaching' }` — Live 세션 종료
  - `{ type: 'restart-coaching' }` — Live 세션 재시작

**서버 → 클라이언트 응답:**
```json
{ "type": "ai-coaching", "text": "정면을 봐주세요", "timestamp": 1234567890 }
```

---

## 작업 내역

### TASK 1: shared.js에 WebSocket Pipe 추가

현재 shared.js의 Pipe 설정 (줄 79-87)에 WebSocket 엔드포인트 추가:

**현재:**
```javascript
export const pipe = Monk.pipe({
  precheck: { method: 'POST', url: API.PRECHECK },
  generate: { method: 'POST', url: API.GENERATE },
  creditUse: { method: 'POST', url: API.CREDIT_USE },
}, { ... });
```

**변경:**
```javascript
export const pipe = Monk.pipe({
  precheck: { method: 'POST', url: API.PRECHECK },
  generate: { method: 'POST', url: API.GENERATE },
  creditUse: { method: 'POST', url: API.CREDIT_USE },
  coaching: { type: 'ws', url: '' },  // WebSocket — url은 camera.js에서 동적 생성
}, { ... });
```

### TASK 2: camera.js — REST 코칭 루프 → WebSocket 전환

**제거할 코드 (현재 줄 128-184):**
- `coachingLoop()` 함수 전체 — REST fetch 기반 while 루프
- 관련 변수: `coachingActive`, `coachingGen`

**새 코드 — WebSocket 코칭:**

```javascript
// ─── WebSocket 코칭 ───
let wsCoaching = null;
let frameTimer = null;

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

function startCoachingWS() {
  const wsUrl = getWsUrl();
  wsCoaching = new WebSocket(wsUrl);

  wsCoaching.onopen = () => {
    Monk.log('코칭 WS 연결');
    // 스타일 설정 전송
    wsCoaching.send(JSON.stringify({
      type: 'set-style',
      style: store.style || 'id_photo',
    }));
    // 프레임 전송 시작 (500ms 간격)
    startFrameLoop();
  };

  wsCoaching.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'ai-coaching' && msg.text) {
        showCoaching(msg.text, msg.text.includes('좋') || msg.text.includes('지금') || msg.text.includes('촬영'));
      }
    } catch (e) {
      Monk.log('코칭 메시지 파싱 실패: ' + e.message);
    }
  };

  wsCoaching.onerror = (err) => {
    Monk.log('코칭 WS 에러');
  };

  wsCoaching.onclose = () => {
    Monk.log('코칭 WS 종료');
    stopFrameLoop();
  };
}

function startFrameLoop() {
  stopFrameLoop();
  frameTimer = setInterval(() => {
    if (!wsCoaching || wsCoaching.readyState !== WebSocket.OPEN) return;

    const frame = media.capture();
    if (!frame) return;

    // JPEG dataURL → 바이너리 전송
    const base64 = frame.includes(',') ? frame.split(',')[1] : frame;
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    wsCoaching.send(binary.buffer);
  }, FRAME_INTERVAL_MS); // 500ms (config.js)
}

function stopFrameLoop() {
  if (frameTimer) {
    clearInterval(frameTimer);
    frameTimer = null;
  }
}

function stopCoachingWS() {
  if (wsCoaching) {
    if (wsCoaching.readyState === WebSocket.OPEN) {
      wsCoaching.send(JSON.stringify({ type: 'stop-coaching' }));
    }
    wsCoaching.close();
    wsCoaching = null;
  }
  stopFrameLoop();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  store.coaching = { text: '', ready: false, active: false };
}
```

### TASK 3: startCoachingLoop / stopCoachingLoop 교체

**기존 (제거):**
```javascript
function startCoachingLoop() {
  coachingActive = true;
  coachingLoop();
}

function stopCoachingLoop() {
  coachingActive = false;
  coachingGen++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  store.coaching = { text: '', ready: false, active: false };
}
```

**교체:**
```javascript
function startCoachingLoop() {
  startCoachingWS();
}

function stopCoachingLoop() {
  stopCoachingWS();
}
```

이렇게 하면 init()과 capturePhoto()에서 호출하는 `startCoachingLoop()`, `stopCoachingLoop()` 인터페이스가 유지되어 다른 코드 변경이 불필요하다.

### TASK 4: TTS 안정화 — cancel/speak 패턴 개선

현재 `speakKo()` (줄 58-72)는 매번 `cancel()` 후 50ms 딜레이로 `speak()`한다.

WebSocket으로 전환하면 응답 빈도가 줄어들지만(Gemini Live 턴 단위), 여전히 `cancel()`은 필요하다.

**개선:**
```javascript
function speakKo(text) {
  if (!store.voiceEnabled || !('speechSynthesis' in window)) return;
  if (!koVoice) return;

  // iOS Safari: cancel() 후 바로 speak()하면 씹힘 → 100ms 딜레이
  speechSynthesis.cancel();
  setTimeout(() => {
    // iOS에서 cancel 후 speaking 상태 체크
    if (speechSynthesis.speaking) return; // 이전 발화가 아직 안 끝났으면 스킵

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.15;
    u.pitch = 1.05;
    u.voice = koVoice;
    speechSynthesis.speak(u);
  }, 100); // 50ms → 100ms로 늘림
}
```

### TASK 5: detectMotion() 정리

`detectMotion()` 함수 (줄 110-122)는 정의만 있고 호출되지 않는 dead code.
**삭제한다.**

---

## showCoaching() 함수는 유지

showCoaching(text, ready) (줄 87-107)은 그대로 유지.
WebSocket 메시지 수신 시 이 함수를 호출하여 오버레이 표시 + TTS를 트리거한다.

`ready` 판단:
- 서버 응답에 `ready` 필드 없음 → 클라이언트에서 텍스트 기반 판단
- `text`에 "좋", "지금", "촬영", "완벽", "OK" 포함 시 ready = true

---

## 금지 사항

- `server.js` 수정 금지
- `config.js` 수정 금지
- `result.js`, `prep.js`, `thankyou.js` 수정 금지
- HTML 파일 수정 금지
- showCoaching() 함수 시그니처 변경 금지
- activateTTS() 로직 변경 금지 (iOS user gesture 대응 유지)

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | `develop` 브랜치에 커밋 | **필수** |
| 2 | `git push origin develop` | **필수** |
| 3 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |
| 4 | `main` 머지 + 배포 | **금지** — 작가님 별도 지시 시에만 |

### 커밋 메시지 형식

```
[migration] camera.js 코칭 REST→WebSocket 전환 + TTS 안정화

지시서: TASK_20260221_막내3_websocket_coaching.md
```

---

## 완료 조건

1. camera.js의 코칭이 WebSocket으로 동작
2. REST coachingLoop() 제거, detectMotion() dead code 제거
3. startCoachingLoop() / stopCoachingLoop() 인터페이스 유지 (호출부 변경 없음)
4. TTS speakKo() iOS 안정화 패치 적용 (100ms 딜레이 + speaking 체크)
5. shared.js Pipe에 coaching WS 엔드포인트 추가
6. develop 커밋 + push 완료
7. 완료 보고 발신
