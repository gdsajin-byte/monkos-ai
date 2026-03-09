---
type: order
date: 2026-03-07
from: iMac/쌍아
to: iMac/막내3
status: pending
---

# [지시서] TTS 전면 삭제 + 수동 셔터 삭제 + 코칭 트리거 멘트 변경

> **[2026-03-07 14:12 KST] iMac/쌍아 → iMac/막내3**
>
> 작가님 결정: 자동촬영 도입으로 TTS 음성 코치·수동 셔터·코칭 모드 선택이 모두 불필요.
> 텍스트 코칭 오버레이는 유지 (카메라 위에 겹쳐서 시선 이동 없음).

---

## Phase 1: TTS 코드 전면 삭제 — camera.js

**파일**: `monkos_AI/idphoto-kr/public/camera.js`

### 삭제 대상 (코드 제거, 주석 처리 아님)

**1) 음성 가이드 블록 (라인 25-69)**
```javascript
// ─── 음성 가이드 ───        ← 이 섹션 전체 삭제
let koVoice = null;
let ttsActivated = false;
function initVoice() { ... }
if ('speechSynthesis' in window) { ... }
function activateTTS() { ... }
document.addEventListener('touchstart', activateTTS, { once: true });
document.addEventListener('click', activateTTS, { once: true });
function speakKo(text) { ... }
```

**2) showCoaching() 내 speakKo 호출 (라인 86)**
```javascript
// 변경 전
speakKo(text);

// → 이 줄 삭제
```

**3) stopCoachingWS() 내 speechSynthesis.cancel() (라인 188)**
```javascript
// 변경 전
if ('speechSynthesis' in window) speechSynthesis.cancel();

// → 이 줄 삭제
```

**4) init() 내 voiceEnabled 설정 (라인 388)**
```javascript
// 변경 전
store.voiceEnabled = (store.coachingMode === 'voice');

// → 이 줄 삭제
```

---

## Phase 2: 수동 셔터 버튼 삭제 — camera.html + camera.js

### camera.html

**`#controls` 섹션 전체 삭제 (라인 223-225)**
```html
<!-- 삭제 대상 -->
<div id="controls">
    <button id="btn-capture" onclick="capturePhoto()" data-class="coaching.ready:ready"></button>
</div>
```

**카운트다운 중 btn-capture 비활성화 코드 (camera.js)도 제거:**

```javascript
// startCountdown() 내 (라인 205)
document.querySelector('#btn-capture')?.setAttribute('disabled', '');
// → 삭제

// cancelCountdown() 내 (라인 227)
document.querySelector('#btn-capture')?.removeAttribute('disabled');
// → 삭제
```

**showCoaching() 내 btn-capture ready 토글 (라인 77-78)도 제거:**
```javascript
const btnCapture = document.querySelector('#btn-capture');
if (btnCapture) btnCapture.classList.toggle('ready', ready);
// → 이 2줄 삭제
```

### camera.js window 노출에서 capturePhoto 제거 (라인 323-325)
```javascript
// 변경 전
Object.assign(window, {
  capturePhoto,
});

// 변경 후 — window 노출 불필요 (onclick 제거됨). 빈 블록 또는 삭제.
```

**`capturePhoto()` 함수 자체는 유지** — autoCapture에서 내부적으로 호출됨.

---

## Phase 3: 코칭 모드 선택 UI 삭제 — prep.js + prep.html

### prep.js renderConfirmPage() (라인 519-566)

코칭 모드 카드 블록 삭제:

```javascript
// 삭제: 변수 선언 (라인 519-520)
const textSel = store.coachingMode === 'text' ? ' selected' : '';
const voiceSel = store.coachingMode === 'voice' ? ' selected' : '';

// 삭제: HTML 템플릿 내 coaching-mode-card (라인 530-548)
<div class="coaching-mode-card" id="coaching-mode-card">
  ...전체...
</div>

// 삭제: 이벤트 리스너 (라인 556-566)
const modeCard = document.getElementById('coaching-mode-card');
if (modeCard) { ... }
```

### app.css (라인 259-288)

coaching-mode 관련 스타일 삭제:
```css
.coaching-mode-card { ... }
.coaching-mode-title { ... }
.coaching-mode-options { ... }
.coaching-mode-option { ... }
/* ... 전부 삭제 ... */
```

---

## Phase 4: 코칭 트리거 멘트 변경 — server.js

### COACHING_INSTRUCTIONS (라인 112-163)

passport와 id 양쪽 모두 동일하게 변경:

```javascript
// 변경 전 (passport 라인 132-133, id 라인 157-158)
- 촬영 준비가 완료되면 반드시 "지금 촬영하세요!" 문구를 포함하세요.
- "지금 촬영하세요!"는 시스템이 자동 촬영을 실행하는 트리거입니다. 확실할 때만 사용하세요.

// 변경 후
- 촬영 준비가 완료되면 반드시 "이제 촬영할게요!" 문구를 포함하세요.
- "이제 촬영할게요!"는 시스템이 자동 촬영을 실행하는 트리거입니다. 확실할 때만 사용하세요.
```

### flushBuffer() ready 감지 regex (라인 374)

```javascript
// 변경 전
const isReady = /지금\s*촬영|완벽|좋아요|좋습니다/.test(text);

// 변경 후
const isReady = /이제\s*촬영할게|완벽|좋아요|좋습니다/.test(text);
```

---

## Phase 5: store 정리 — shared.js

**파일**: `monkos_AI/idphoto-kr/public/shared.js`

### store 초기값 (라인 78, 81)
```javascript
// 삭제 또는 유지 판단
coachingMode: 'text',    // → 삭제 (더 이상 사용 안 함)
voiceEnabled: true,      // → 삭제 (더 이상 사용 안 함)
```

### saveSelections / loadSelections (라인 352, 366)
`'coachingMode'`를 필드 목록에서 제거.

### clearSelections (라인 379)
```javascript
store.coachingMode = 'text';  // → 삭제
```

### sharedInit restore (라인 429)
```javascript
store.coachingMode = restore('coachingMode', 'text');  // → 삭제
```

---

## ⚠️ 준수 조항

- **헌법 2조**: Phase별 보고 필수
- **헌법 6조**: API 키 생성·추측 금지
- **법률 6장**: 커밋 메시지 `[fix] TTS 삭제 + 수동 셔터 삭제 + 코칭 트리거 멘트 변경`
- **app.css coaching-mode 스타일 삭제** 시 다른 클래스 영향 없는지 확인

---

## 참조 코드

| 파일 | 구간 | 역할 |
|------|------|------|
| `camera.js` | 25-69 | TTS 전체 (삭제) |
| `camera.js` | 77-78, 86, 188, 205, 227, 323-325, 388 | TTS·셔터 참조점 (삭제) |
| `camera.html` | 223-225 | #controls 셔터 버튼 (삭제) |
| `prep.js` | 519-520, 530-548, 556-566 | 코칭 모드 선택 UI (삭제) |
| `app.css` | 259-288 | coaching-mode 스타일 (삭제) |
| `shared.js` | 78, 81, 352, 366, 379, 429 | coachingMode/voiceEnabled store (삭제) |
| `server.js` | 132-133, 157-158 | systemInstruction 트리거 멘트 (변경) |
| `server.js` | 374 | flushBuffer ready regex (변경) |

---

## 보고서

- `monkos-ops/ops/reports/REPORT_20260307_막내3_TTS삭제_셔터삭제.md`
- Phase 1: TTS 코드 제거 확인 (speechSynthesis 참조 0건)
- Phase 2: #controls 삭제 + capturePhoto window 노출 제거
- Phase 3: 코칭 모드 선택 UI 제거 + CSS 정리
- Phase 4: 트리거 멘트 "이제 촬영할게요" + regex 변경
- Phase 5: shared.js store 정리
