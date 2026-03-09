---
type: order
date: 2026-03-06
from: iMac/쌍아
to: iMac/막내1
status: pending
---

# [지시서] 촬영실 UI 레이아웃 리디자인 — 시선 동선 최적화 + 코칭 정확도 강화

> **[2026-03-06 18:22 KST] iMac/쌍아 → iMac/막내1**
>
> 작가님 직접 테스트 피드백 기반.
> 핵심: **사용자 시선이 카메라 아래로 떨어지지 않는 구조.**
> 코칭 텍스트를 카메라 근처에, 셔터를 상단에 배치.

---

## 배경

### 현행 문제 (아이폰 실기 테스트)

```
[MONKOS AI 증명사진 | 촬영 중]     [10 Cr]    ← 풀 헤더 (불필요)
[증명사진·남성·성인]                             ← 선택 요약 (상단, 촬영 중 불필요)
[카메라 + 가이드 원]                             ← 카메라
[       코칭 오버레이 (하단 대형)       ]         ← 시선이 아래로 떨어짐
[          📸 셔터 버튼              ]           ← 최하단, 눈이 내려감
```

**문제점**:
1. 코칭 텍스트가 카메라에서 멀리 떨어져 한눈에 안 들어옴
2. 셔터 버튼이 최하단 → 누르려면 시선이 내려감
3. 풀 헤더가 불필요한 공간 차지
4. 선택 요약 뱃지가 촬영 중에는 무의미한 위치

### 목표 레이아웃

```
[촬영중]                         [📸]    ← 미니 헤더 + 셔터 상단 우측
    [코칭: 고개를 살짝 왼쪽으로]          ← 뱃지형 코칭 (카메라 상단)
┌─────────────────────────────────┐
│                                 │
│      [가이드 원 + 카메라]        │      ← 메인 카메라 영역
│                                 │
└─────────────────────────────────┘
    [증명사진 · 남성 · 성인]              ← 선택 요약 하단 이동
```

**핵심 원칙**: 사용자 시선이 카메라~상단 범위를 벗어나지 않음

---

## 작업 내용

### Phase 1: camera.html 레이아웃 변경

**파일**: `monkos_AI/idphoto-kr/public/camera.html`

#### 1-A: 헤더 → 미니 헤더

현행 (라인 78-99):
```html
<div id="header">
  <div>
    <h1><span class="brand">MONKOS</span> <span>AI 증명사진</span></h1>
    <span id="step-label" data-bind="stepLabel">촬영 중</span>
  </div>
  <div style="display:flex; align-items:center; gap:8px;">
    <div class="header-balance" id="creditBadge" data-show="user.id">
      <!-- 크레딧 뱃지 코인 전체 -->
    </div>
  </div>
</div>
```

변경:
```html
<div id="camera-header">
  <div class="camera-header-left">
    <span class="camera-status-dot"></span>
    <span class="camera-status-text">촬영중</span>
  </div>
  <button id="btn-capture" onclick="capturePhoto()" data-class="coaching.ready:ready">
    <span class="capture-icon"></span>
  </button>
</div>
```

- 풀 헤더 삭제 → `#camera-header` 미니 헤더
- 크레딧 뱃지 삭제 (촬영 중 불필요)
- 셔터 버튼이 헤더 우측으로 이동
- `촬영중` 텍스트 + 녹색 점 (라이브 인디케이터)

> **주의**: 기존 `#header`는 다른 페이지(prep, result)에서도 사용하므로 **삭제하지 않는다**.
> 카메라 페이지에서만 `#header`를 숨기고 `#camera-header`를 표시하는 방식.

#### 1-B: 코칭 오버레이 → 뱃지형 코칭

현행 (라인 162-170): 하단 대형 오버레이
```html
<div id="coaching-overlay" data-class="coaching.active:active">
  <div class="coaching-inner">
    <div id="coaching-label">
      <span class="coaching-pulse"></span>
      <span>AI 코칭 중</span>
    </div>
    <div id="coaching-text" data-bind="coaching.text">자세를 체크하고 있습니다...</div>
  </div>
</div>
```

변경: 카메라 영역 상단에 뱃지형으로 이동
```html
<div id="coaching-badge" data-class="coaching.active:active">
  <span class="coaching-pulse"></span>
  <span id="coaching-text" data-bind="coaching.text">자세를 체크하고 있습니다...</span>
</div>
```

- `#camera-area` 내부, 가이드 원 위쪽에 위치
- 반투명 배경 뱃지 (pill 형태)
- "AI 코칭 중" 레이블 제거 → 펄스 점 + 텍스트만
- 폰트 14px, 1줄 표시

#### 1-C: 선택 요약 뱃지 위치 이동

현행: `#selection-summary` 카메라 상단 (line 159)

변경: 카메라 영역 하단으로 이동
- `top: 12px;` → `bottom: 12px;`
- 촬영 중에는 참고 정보이므로 하단이 적합

#### 1-D: 하단 컨트롤 영역 제거

현행 (라인 173-175):
```html
<div id="controls">
  <button id="btn-capture" onclick="capturePhoto()" ...></button>
</div>
```

변경: `#controls` 제거 (셔터가 헤더로 이동했으므로)

---

### Phase 2: camera.html 전용 CSS (인라인 `<style>`)

**파일**: `monkos_AI/idphoto-kr/public/camera.html` `<style>` 섹션

> `app.css` 수정 금지 원칙 유지. 카메라 전용 스타일은 `camera.html` 인라인 `<style>`에 작성.

```css
/* 기존 헤더 숨김 (카메라 페이지 전용) */
#header { display: none !important; }

/* 미니 헤더 */
#camera-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  padding-top: max(8px, env(safe-area-inset-top));
  background: rgba(3,5,8,0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
  z-index: 20;
}

.camera-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.camera-status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 1.5s infinite;
}

.camera-status-text {
  font-size: 13px;
  font-weight: 600;
  color: #888;
}

/* 셔터 버튼 (상단 우측) */
#camera-header #btn-capture {
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.15);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

#camera-header #btn-capture .capture-icon {
  display: block;
  width: 38px; height: 38px;
  border-radius: 50%;
  background: #fff;
  margin: auto;
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.2s;
}

#camera-header #btn-capture.ready {
  border-color: #22c55e;
}
#camera-header #btn-capture.ready .capture-icon {
  background: #22c55e;
}

/* 코칭 뱃지 (카메라 상단) */
#coaching-badge {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(245,158,11,0.4);
  z-index: 10;
  display: none;
  align-items: center;
  gap: 8px;
  max-width: 85%;
}

#coaching-badge.active {
  display: flex;
}

#coaching-badge.ready {
  border-color: rgba(34,197,94,0.6);
}

#coaching-badge .coaching-pulse {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse 1.5s infinite;
  flex-shrink: 0;
}

#coaching-badge.ready .coaching-pulse {
  background: #22c55e;
}

#coaching-badge #coaching-text {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#coaching-badge.ready #coaching-text {
  color: #22c55e;
}

/* 선택 요약 뱃지 → 하단 */
#selection-summary {
  position: absolute;
  bottom: 12px;
  top: auto;
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
  white-space: nowrap;
  pointer-events: none;
}

/* 기존 하단 컨트롤 숨김 */
#controls { display: none !important; }

/* 기존 코칭 오버레이 숨김 (뱃지로 대체) */
#coaching-overlay { display: none !important; }
```

---

### Phase 3: camera.js 코칭 요소 참조 업데이트

**파일**: `monkos_AI/idphoto-kr/public/camera.js`

#### 3-A: showCoaching() — 오버레이 → 뱃지 참조

현행 (라인 74-94):
```javascript
function showCoaching(text, ready = false) {
  store.coaching = { text, ready, active: true };

  const btnCapture = document.querySelector('#btn-capture');
  if (btnCapture) btnCapture.classList.toggle('ready', ready);

  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) faceGuide.classList.toggle('ready', ready);

  const overlay = document.querySelector('#coaching-overlay');
  if (overlay) overlay.classList.toggle('ready', ready);
  // ...
}
```

변경:
```javascript
function showCoaching(text, ready = false) {
  store.coaching = { text, ready, active: true };

  const btnCapture = document.querySelector('#btn-capture');
  if (btnCapture) btnCapture.classList.toggle('ready', ready);

  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) faceGuide.classList.toggle('ready', ready);

  // 뱃지형 코칭
  const badge = document.querySelector('#coaching-badge');
  if (badge) badge.classList.toggle('ready', ready);

  speakKo(text);
  // ...
}
```

#### 3-B: init() — 카메라 영역 활성화 시 헤더 처리

기존 init()에서 `document.querySelector('#controls')?.classList.add('active');` 부분을 제거하거나 조건부 처리.
셔터가 `#camera-header`에 있으므로 `#controls` 관련 코드를 정리.

---

### Phase 4: server.js — 코칭 정확도 강화 (가이드 원 인식)

**파일**: `monkos_AI/idphoto-kr/server.js`

현행 `COACHING_INSTRUCTIONS.passport` (라인 112-136) 교체:

```javascript
const COACHING_INSTRUCTIONS = {
  passport: `증명사진 촬영 AI 코치입니다. 카메라 프레임을 실시간으로 보면서 코칭합니다.

[코칭 규칙]
- 한국어 1문장, 15자 이내
- 문제 시 1가지만 지적
- 15자 넘기지 마세요. 예: "오른쪽으로 살짝", "턱을 내려주세요"

[가이드 원 기준 — 최우선]
- 화면 상단에 노란 점선 타원형 가이드가 있습니다
- 얼굴이 이 가이드 안에 적절히 위치해야 합니다
- 얼굴이 가이드 밖에 있으면: "얼굴을 원 안으로" — 절대 "좋아요" 금지
- 얼굴이 너무 작으면: "좀 더 가까이"
- 얼굴이 너무 크면: "조금 뒤로"

[체크 순서] (가이드 안에 있을 때만)
1. 정면 응시 (고개 기울기, 시선)
2. 표정 (무표정 또는 자연스러운 미소)
3. 조명 균일 (얼굴에 그림자 없이)
4. 눈이 열려있는지
5. 앞머리가 눈썹/눈을 가리지 않는지

[촬영 판단]
- 위 체크가 모두 통과하면: "지금 촬영하세요!"
- 확실할 때만 발화. 애매하면 코칭 계속.

[세션 규율]
- 인사하지 마세요. 바로 코칭만.
- 프레임이 양호하면 침묵. 할 말 있을 때만 발화.
- 같은 지적을 연속 반복하지 마세요.

[절대 금지]
- 자기소개, 잡담, 감상, 질문
- 가이드 밖 상태에서 "좋아요", "완벽해요", "촬영하세요" 발화`,

  id: `이력서 사진 촬영 AI 코치입니다. 카메라 프레임을 실시간으로 보면서 코칭합니다.

[코칭 규칙]
- 한국어 1문장, 15자 이내
- 문제 시 1가지만 지적

[가이드 원 기준 — 최우선]
- 화면 상단에 노란 점선 타원형 가이드가 있습니다
- 얼굴이 이 가이드 안에 적절히 위치해야 합니다
- 얼굴이 가이드 밖에 있으면: "얼굴을 원 안으로" — 절대 "좋아요" 금지

[체크 순서] (가이드 안에 있을 때만)
1. 정면 응시 (고개 기울기, 시선)
2. 표정 (자연스럽고 호감가는 미소)
3. 조명 균일
4. 자세 (허리 펴고, 어깨 수평)

[촬영 판단]
- 위 체크가 모두 통과하면: "지금 촬영하세요!"
- 확실할 때만 발화.

[세션 규율]
- 인사하지 마세요. 바로 코칭만.
- 프레임이 양호하면 침묵.
- 같은 지적을 연속 반복하지 마세요.

[절대 금지]
- 자기소개, 잡담, 감상, 질문
- 가이드 밖 상태에서 "좋아요", "완벽해요", "촬영하세요" 발화`,
};
```

**핵심 변경**:
- `[가이드 원 기준 — 최우선]` 섹션 추가
- 가이드 밖에서 긍정/촬영 발화 절대 금지 명시
- `[촬영 판단]` 섹션 추가 — 전 체크 통과 시 "지금 촬영하세요!" 발화

---

### Phase 5: 자동 캡처 트리거

#### 5-A: server.js — 촬영 판단 신호 전송

**파일**: `monkos_AI/idphoto-kr/server.js`

`flushBuffer()` 함수 (라인 369-380) 내에서, 클라이언트로 코칭 텍스트 전송 직후:

```javascript
function flushBuffer() {
  if (session.responseBuffer.trim() && session.ws?.readyState === 1) {
    const text = session.responseBuffer.trim();
    session.ws.send(JSON.stringify({
      type: 'ai-coaching',
      text,
      timestamp: Date.now(),
    }));
    log(`[코칭][${clientId}] ${text}`);

    // 촬영 판단: 코치가 촬영 승인하면 자동 캡처 신호
    if (text.includes('촬영하세요') || text.includes('촬영')) {
      session.ws.send(JSON.stringify({ type: 'auto-capture' }));
      log(`[자동캡처][${clientId}] 촬영 신호 전송`);
    }
  }
  session.responseBuffer = '';
  session.bufferFlushTimer = null;
}
```

#### 5-B: camera.js — 자동 캡처 수신

**파일**: `monkos_AI/idphoto-kr/public/camera.js`

WS `onmessage` (라인 118-127)에 핸들링 추가:

```javascript
wsCoaching.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'ai-coaching' && msg.text) {
      showCoaching(msg.text, msg.text.includes('좋') || msg.text.includes('지금') || msg.text.includes('촬영'));
    }
    if (msg.type === 'auto-capture') {
      // 코치 승인 → 자동 촬영
      capturePhoto();
    }
  } catch (e) {
    Monk.log('코칭 메시지 파싱 실패: ' + e.message);
  }
};
```

---

### Phase 6: 통합 검증

1. **레이아웃**: 셔터 상단 우측, 코칭 뱃지 카메라 상단, 선택 요약 하단 확인
2. **시선 동선**: 카메라 응시 중 코칭 + 셔터가 시야에 들어오는지 확인
3. **코칭 정확도**: 가이드 원 밖에서 "좋아요" 발화 안 하는지 확인
4. **자동 캡처**: "촬영하세요!" → 자동 캡처 작동 확인
5. **텍스트/음성 모드**: 양쪽 모두 뱃지형 코칭 정상 표시 확인
6. **iOS Safari**: 레이아웃 + safe-area-inset 정상 확인

---

## ⚠️ 준수 조항

- **헌법 2조**: 각 Phase별 성공/실패 보고 필수
- **헌법 6조**: API 키 생성·추측 금지
- **헌법 8조**: 파괴적 명령 금지
- **법률 6장**: 커밋 메시지 `[feat] 촬영실 UI 리디자인 — 시선 동선 최적화 + 코칭 뱃지 + 자동 캡처`
- **app.css 수정 금지**: 카메라 전용 스타일은 `camera.html` 인라인 `<style>`에만 작성

---

## 핵심 원칙

1. **app.css 수정 금지** — 카메라 전용 CSS는 `camera.html` `<style>` 인라인만
2. **기존 헤더 삭제 아님** — `#header`를 CSS로 숨기고 `#camera-header` 신규 추가
3. **시선 동선이 핵심** — 모든 중요 요소가 카메라 높이 이상에 위치
4. **가이드 원 = 코칭의 기준선** — 원 밖이면 긍정 피드백 금지
5. **촬영 판단 = 코치 책임** — 코치가 승인하면 자동 캡처

---

## 참조 코드

| 파일 | 구간 | 역할 |
|------|------|------|
| `monkos_AI/idphoto-kr/public/camera.html` | 전체 (184줄) | HTML 레이아웃 (리디자인 대상) |
| `monkos_AI/idphoto-kr/public/camera.js` | 라인 74-94 (showCoaching), 118-127 (WS onmessage) | 코칭 표시 + WS 수신 |
| `monkos_AI/idphoto-kr/public/app.css` | 라인 326-407 (카메라+코칭) | 기존 CSS (수정 금지, 오버라이드만) |
| `monkos_AI/idphoto-kr/server.js` | 라인 112-161 (COACHING_INSTRUCTIONS), 369-380 (flushBuffer) | 코칭 인스트럭션 + 텍스트 전송 |

---

## 보고서

- `monkos-ops/ops/reports/REPORT_20260306_막내1_촬영실UI리디자인.md`
- 각 Phase 성공/실패 명시
- 스크린샷 불가 시 레이아웃 ASCII 비교
- 자동 캡처 작동 확인 결과
