---
type: tech-spec
date: 2026-03-06
author: iMac/쌍아
status: draft
---

# [기술명세] 촬영실 코칭 모드 선택 + Gemini Live Native Audio 전환

> **목적**: iOS 음성 코칭 미작동 문제의 근본 해결 + 코칭 품질 향상
> **범위**: idphoto-kr (KR) — 검증 후 idphoto-jp (JP)에도 적용

---

## 1. 현행 문제

### 1.1 구조적 문제
- Gemini Live `responseModalities: ['TEXT']` → 클라이언트 Web Speech API로 TTS
- iOS Safari에서 한국어 음성 로딩 실패 시 영구 무음 (`if (!koVoice) return;`)
- 디바이스/OS/브라우저별 TTS 품질·호환성 편차

### 1.2 UX 문제
- 음성 안내가 기본 ON → 공공장소에서 갑작스러운 소리 발생
- 사용자 선택권 없음

---

## 2. 설계

### 2.1 코칭 모드 선택 UI

**위치**: 촬영 준비실(prep) 퍼널 마지막 단계, 촬영 시작 버튼 직전

```
[성별 선택] → [연령대] → [스타일] → [코칭 모드] → [촬영 시작]
```

**코칭 모드 UI**:
```
┌─────────────────────────────────────┐
│  AI 코칭 안내 방식                   │
│                                     │
│  💬 텍스트 (기본)    ← 선택됨        │
│  화면에 글자로 안내합니다             │
│                                     │
│  🔊 음성                            │
│  AI가 직접 말해줍니다                 │
└─────────────────────────────────────┘
```

- **기본값**: 텍스트 모드 (소리 없음)
- **음성 모드**: 사용자가 명시적으로 선택해야 활성화

### 2.2 서버 아키텍처

```
클라이언트                    서버                     Gemini Live
   │                          │                          │
   │─ WS connect ────────────>│                          │
   │─ {type:'set-mode',       │                          │
   │   mode:'text'|'audio',   │                          │
   │   format:'passport'}────>│                          │
   │                          │─ ai.live.connect({       │
   │                          │   responseModalities:    │
   │                          │   ['TEXT'] or ['AUDIO']  │
   │                          │  })───────────────────-->│
   │                          │                          │
   │─ [binary: JPEG frame] ──>│─ sendRealtimeInput ─────>│
   │                          │                          │
   │                          │<── TEXT: {text: "..."} ──│
   │<── {type:'ai-coaching',  │    or                    │
   │     text: "..."}         │<── AUDIO: {inlineData}───│
   │    or                    │                          │
   │<── [binary: PCM audio] ──│                          │
```

### 2.3 모드별 처리

| | 텍스트 모드 | 음성 모드 |
|--|-----------|----------|
| `responseModalities` | `['TEXT']` | `['AUDIO']` |
| 서버→클라이언트 | JSON `{type:'ai-coaching', text}` | Binary PCM 24kHz |
| 클라이언트 처리 | 코칭 오버레이 텍스트 표시 | Web Audio API + AudioWorklet 재생 |
| Web Speech API | 사용 안 함 | 사용 안 함 |

---

## 3. 모델 마이그레이션

### 3.1 현행 → 타겟

| | 현행 | 타겟 |
|--|------|------|
| **모델** | `gemini-2.0-flash-live-preview-04-09` | `gemini-live-2.5-flash-native-audio` |
| **SDK** | Vertex AI ADC (@google/genai) | 동일 |
| **Native Audio** | ❌ (TTS 기반) | ✅ (30개 HD 보이스) |
| **폐기일** | 2026-06 (퇴역 예정) | 2026-12-13 |
| **한국어** | 지원 | ✅ 24개 언어 지원 |
| **음성 설정** | `speechConfig.language_code` | systemInstruction으로 언어 지정 |

### 3.2 음성 설정

```javascript
// Native Audio 모델은 language_code 미지원
// → systemInstruction으로 언어 강제
const config = {
  responseModalities: ['AUDIO'],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: 'Kore' }  // 또는 다른 HD 보이스
    }
  }
};

const systemInstruction = `몽코스 AI 코치입니다. 반드시 한국어로 응답하세요.
[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
...`;
```

### 3.3 음성 후보 (작가님 시연 후 선택)

| 보이스 | 계열 | 특성 | 비고 |
|--------|------|------|------|
| **Kore** | Firm | 단단하고 명확 | 코칭에 적합 후보 |
| **Puck** | Bright | 밝고 친근 | 기본값 |
| **Aoede** | - | 중성적 | - |

→ 막내 지시서에서 3개 보이스 시연 영상/음성 샘플 제작 포함

---

## 4. 클라이언트 구현 (음성 모드)

### 4.1 AudioWorklet 기반 재생

**신규 파일**: `public/audio-playback.js`

```javascript
// AudioContext 24kHz + AudioWorklet
const audioCtx = new AudioContext({ sampleRate: 24000 });
await audioCtx.audioWorklet.addModule('playback-worklet.js');
const playbackNode = new AudioWorkletNode(audioCtx, 'playback-processor');
playbackNode.connect(audioCtx.destination);
```

**신규 파일**: `public/playback-worklet.js`

```javascript
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.port.onmessage = (e) => {
      const int16 = e.data;
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }
      this.buffer.push(float32);
    };
  }
  process(inputs, outputs) {
    const output = outputs[0][0];
    // circular buffer에서 읽어 출력
    return true;
  }
}
registerProcessor('playback-processor', PlaybackProcessor);
```

### 4.2 삭제 대상 (Web Speech API 코드)

**camera.js에서 제거**:
- `koVoice`, `ttsActivated` 변수
- `initVoice()`, `activateTTS()`, `speakKo()`, `toggleVoice()` 함수
- `speechSynthesis.onvoiceschanged` 리스너
- `document.addEventListener('touchstart/click', activateTTS)` 리스너

---

## 5. 텍스트 모드 변경사항

- 현행 텍스트 모드는 유지 (코칭 오버레이 표시)
- Web Speech API 호출만 제거
- `toggleVoice()` 버튼 → 모드 선택은 prep에서 완료, 촬영 중 전환 불필요

---

## 6. 검증 매트릭스

| 디바이스 | OS | 브라우저 | 텍스트 모드 | 음성 모드 |
|---------|-----|---------|-----------|----------|
| 갤럭시 | Android | Chrome | □ | □ |
| 갤럭시 | Android | Samsung Internet | □ | □ |
| 아이폰 | iOS | Safari | □ | □ |
| 아이폰 | iOS | Chrome | □ | □ |

---

## 7. 구현 순서

1. **Phase A**: 모델 체크 — `gemini-live-2.5-flash-native-audio` AUDIO 응답 검증 + 보이스 시연
2. **Phase B**: 서버 — 모드 분기 (`set-mode` 메시지 처리 + responseModalities 분기)
3. **Phase C**: 클라이언트 — AudioWorklet 재생기 + prep 모드 선택 UI
4. **Phase D**: Web Speech API 전량 삭제 + 통합 테스트
5. **Phase E**: JP 적용 (KR 검증 후)
