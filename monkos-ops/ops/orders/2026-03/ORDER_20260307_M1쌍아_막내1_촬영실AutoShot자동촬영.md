---
type: ORDER
date: 2026-03-07
from: M1/쌍아
to: 막내1
scope: 촬영실 AutoShot — AI 코칭 완료 시 카운트다운 자동 촬영
prerequisite: 7836620 (현행 main HEAD)
ref: 2026-03-07 05:20 KST 작가님 — 촬영실 자동촬영 지시 + 철창이 프로토타입
---

# 지시서: 촬영실 AutoShot (자동촬영)

> **[2026-03-07 05:20 KST] M1/쌍아 → 막내1**

---

## 배경

현행: AI 코칭 → 유저 수동 캡처 버튼 클릭
변경: AI 코칭 → AI가 "준비됐다" 판단 → **카운트다운 3→2→1 → 자동 촬영**

유저는 시작 버튼만 누르고 가이드 원에 얼굴을 맞추면, 나머지는 AI가 자동 처리.

---

## Phase A: 서버 — ready 시그널 추가

**파일:** `monkos_AI/idphoto-kr/server.js`

### A-1. ai-coaching 메시지에 ready 필드 추가

현행 flushBuffer (L370 부근):
```javascript
session.ws.send(JSON.stringify({
  type: 'ai-coaching',
  text: session.responseBuffer.trim(),
  timestamp: Date.now(),
}));
```

수정:
```javascript
const text = session.responseBuffer.trim();
const isReady = /지금\s*촬영|완벽|좋아요|좋습니다/.test(text);
session.ws.send(JSON.stringify({
  type: 'ai-coaching',
  text,
  ready: isReady,
  timestamp: Date.now(),
}));
```

### A-2. COACHING_INSTRUCTIONS 촬영 트리거 문구 명확화

passport/id 양쪽의 코칭 규칙에 추가:
```
- 촬영 준비가 완료되면 반드시 "지금 촬영하세요!" 문구를 포함하세요.
- "지금 촬영하세요!"는 시스템이 자동 촬영을 실행하는 트리거입니다. 확실할 때만 사용하세요.
```

---

## Phase B: 클라이언트 — 카운트다운 + 자동 촬영

**파일:** `monkos_AI/idphoto-kr/public/camera.js`

### B-1. 카운트다운 상태 추가

```javascript
let countdownTimer = null;
let readyCount = 0;           // ready 연속 확인 횟수
const READY_THRESHOLD = 1;    // 1회 ready 수신 시 카운트다운 시작
```

### B-2. onmessage에서 ready 감지 → 카운트다운 트리거

현행 (L118~L127):
```javascript
wsCoaching.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'ai-coaching' && msg.text) {
      showCoaching(msg.text, msg.text.includes('좋') || msg.text.includes('지금') || msg.text.includes('촬영'));
    }
  } catch (e) { ... }
};
```

수정:
```javascript
wsCoaching.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'ai-coaching' && msg.text) {
      const isReady = msg.ready === true;
      showCoaching(msg.text, isReady);

      if (isReady && !countdownTimer) {
        readyCount++;
        if (readyCount >= READY_THRESHOLD) {
          startCountdown();
        }
      } else if (!isReady) {
        readyCount = 0;  // 코칭 메시지가 오면 카운트 리셋
      }
    }
  } catch (e) {
    Monk.log('코칭 메시지 파싱 실패: ' + e.message);
  }
};
```

### B-3. startCountdown() 함수 신규

```javascript
function startCountdown() {
  // 프레임 전송 중단 (움직임 방지)
  stopFrameLoop();

  // 코칭 오버레이를 카운트다운 모드로 전환
  showCountdownOverlay(3);

  let n = 3;
  countdownTimer = setInterval(() => {
    n--;
    if (n > 0) {
      showCountdownOverlay(n);
    } else {
      clearInterval(countdownTimer);
      countdownTimer = null;
      doAutoCapture();
    }
  }, 1000);
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  readyCount = 0;
  hideCountdownOverlay();
  // 코칭 재시작
  startFrameLoop();
}
```

### B-4. doAutoCapture() — 셔터 플래시 + 캡처

```javascript
function doAutoCapture() {
  // 셔터 플래시
  const flashEl = document.getElementById('shutter-flash');
  if (flashEl) {
    flashEl.classList.add('active');
    setTimeout(() => flashEl.classList.remove('active'), 300);
  }

  // 기존 capturePhoto() 로직 호출 (약간의 딜레이로 플래시 효과 체감)
  setTimeout(() => capturePhoto(), 200);
}
```

### B-5. showCountdownOverlay() / hideCountdownOverlay()

```javascript
function showCountdownOverlay(n) {
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('countdown-number');
  const labelEl = document.getElementById('countdown-label');
  if (!overlay || !numEl) return;

  overlay.classList.add('active');
  numEl.textContent = n;
  numEl.style.animation = 'none';
  // 리플로우 트리거 후 애니메이션 재시작
  void numEl.offsetHeight;
  numEl.style.animation = 'countdown-pop 0.4s ease';

  if (labelEl) {
    labelEl.textContent = n === 3 ? '준비되셨습니다, 촬영합니다' : '';
  }

  // 가이드 오벌 + 코칭 오버레이 녹색 전환
  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) faceGuide.classList.add('ready');
}

function hideCountdownOverlay() {
  const overlay = document.getElementById('countdown-overlay');
  if (overlay) overlay.classList.remove('active');
}
```

### B-6. 수동 캡처 버튼 → 폴백으로 유지

`#btn-capture`는 **삭제하지 않고 유지**. 자동 촬영이 실패하거나 코칭이 지연될 때 유저가 수동으로 찍을 수 있는 안전장치.

단, 카운트다운 진행 중에는 비활성화:
```javascript
// startCountdown() 내
document.querySelector('#btn-capture')?.setAttribute('disabled', '');

// cancelCountdown() 내
document.querySelector('#btn-capture')?.removeAttribute('disabled');
```

### B-7. 카운트다운 중 탭하면 취소

카운트다운 오버레이에 터치/클릭 핸들러:
```javascript
document.getElementById('countdown-overlay')?.addEventListener('click', () => {
  if (countdownTimer) {
    cancelCountdown();
    showCoaching('카운트다운 취소됨. 다시 준비해주세요.', false);
  }
});
```

### B-8. cleanup에 카운트다운 정리 추가

`stopCoachingWS()` (L160~L171) 내부에 추가:
```javascript
if (countdownTimer) {
  clearInterval(countdownTimer);
  countdownTimer = null;
}
readyCount = 0;
hideCountdownOverlay();
```

---

## Phase C: HTML — 카운트다운 + 플래시 엘리먼트

**파일:** `monkos_AI/idphoto-kr/public/camera.html`

### C-1. #camera-area 내부에 카운트다운 오버레이 추가

`#face-guide` 아래, `#coaching-overlay` 위에 삽입:

```html
<!-- 카운트다운 오버레이 -->
<div id="countdown-overlay">
    <div id="countdown-label">준비되셨습니다, 촬영합니다</div>
    <div id="countdown-number">3</div>
</div>

<!-- 셔터 플래시 -->
<div id="shutter-flash"></div>
```

---

## Phase D: CSS — 카운트다운 + 플래시 애니메이션

**파일:** `monkos_AI/idphoto-kr/public/app.css`

### D-1. 카운트다운 오버레이

```css
/* 카운트다운 오버레이 */
#countdown-overlay {
    position: absolute;
    inset: 0;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    z-index: 15;
    pointer-events: auto;
}
#countdown-overlay.active { display: flex; }

#countdown-label {
    font-size: 13px;
    font-weight: 600;
    color: #22c55e;
    margin-bottom: 12px;
    letter-spacing: 0.05em;
}

#countdown-number {
    font-size: 96px;
    font-weight: 900;
    color: #fff;
    line-height: 1;
    text-shadow: 0 0 40px rgba(34, 197, 94, 0.6);
}

@keyframes countdown-pop {
    0%   { transform: scale(0.5); opacity: 0; }
    50%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
}
```

### D-2. 셔터 플래시

```css
/* 셔터 플래시 */
#shutter-flash {
    position: absolute;
    inset: 0;
    background: #fff;
    z-index: 20;
    opacity: 0;
    pointer-events: none;
    transition: none;
}
#shutter-flash.active {
    animation: shutter-flash 0.3s ease forwards;
}
@keyframes shutter-flash {
    0%   { opacity: 0.9; }
    100% { opacity: 0; }
}
```

---

## 요약: 전체 흐름

```
유저: prep에서 규격·코칭모드 선택 → "촬영 시작하기" 탭
  ↓
camera.html 진입 → 카메라 ON + AI 코칭 WS 연결
  ↓
[AI 코칭 루프]
  서버 ← 프레임 전송
  서버 → {type:'ai-coaching', text:'고개를 정면으로', ready:false}
  → 코칭 오버레이: 금색 "AI 코칭 중"
  ↓
  서버 → {type:'ai-coaching', text:'지금 촬영하세요!', ready:true}
  → readyCount++
  → readyCount >= THRESHOLD: startCountdown()
  ↓
[카운트다운]
  프레임 전송 중단
  코칭 오버레이 → 녹색 "준비되셨습니다, 촬영합니다"
  3 (팝) → 2 (팝) → 1 (팝)
  ↓
[자동 촬영]
  셔터 플래시 → 캡처 → sessionStorage 저장 → result.html 이동
```

---

## 검증 (완료 조건)

| # | 항목 | 확인 |
|---|------|------|
| 1 | AI 코칭 중 → "지금 촬영하세요!" 수신 시 카운트다운 3→2→1 시작 |
| 2 | 카운트다운 완료 → 셔터 플래시 → 자동 캡처 → result.html 이동 |
| 3 | 카운트다운 중 프레임 전송 중단 (움직임 방지) |
| 4 | 카운트다운 중 화면 탭 → 취소 + 코칭 재시작 |
| 5 | 수동 캡처 버튼 유지 (폴백, 카운트다운 중 비활성) |
| 6 | 가이드 오벌: 코칭 중 금색, ready 시 녹색 전환 |
| 7 | 카운트다운 숫자 팝 애니메이션 정상 |
| 8 | 셔터 플래시 0.3초 백색 효과 |
| 9 | 코칭 WS 종료 시 카운트다운 타이머 정리 (메모리 누수 없음) |
| 10 | 기존 음성/텍스트 코칭 모드와 충돌 없음 |

---

## 수정 파일 목록 (4건)

| # | 파일 | 내용 |
|---|------|------|
| 1 | `monkos_AI/idphoto-kr/server.js` | ai-coaching에 `ready` 필드 추가 + 프롬프트 트리거 명확화 |
| 2 | `monkos_AI/idphoto-kr/public/camera.js` | 카운트다운 상태머신 + 자동촬영 + 취소 로직 |
| 3 | `monkos_AI/idphoto-kr/public/camera.html` | 카운트다운 오버레이 + 셔터 플래시 HTML |
| 4 | `monkos_AI/idphoto-kr/public/app.css` | 카운트다운 팝 + 셔터 플래시 애니메이션 |

---

## 참고 자료

- 철창이 프로토타입: `monkos-ops/03_개발/MONKOS_촬영실_AutoShot_v1.jsx`
- 현행 코칭 프롬프트: `server.js:112~161` (COACHING_INSTRUCTIONS)
- 현행 ready 감지: `camera.js:122` (키워드 매칭)
