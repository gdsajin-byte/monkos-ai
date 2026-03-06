---
type: order
date: 2026-03-06
from: iMac/쌍아
to: iMac/막내3
status: pending
---

# [지시서] Gemini Live Native Audio 모델 검증 + 보이스 시연

> **[2026-03-06 16:40 KST] iMac/쌍아 → iMac/막내3**
> 촬영실 코칭 시스템 재설계(기술명세 SPEC_20260306)의 Phase A.
> 신규 모델 검증 + 보이스 샘플 제작.

---

## 배경

- 현행 코칭 모델 `gemini-2.0-flash-live-preview-04-09`은 2026-06 퇴역 예정
- Native Audio 미지원 → Web Speech API 의존 → iOS 한국어 음성 미작동
- 마이그레이션 타겟: Vertex AI `gemini-live-2.5-flash-native-audio` (GA, ~2026-12-13)

## 기술명세 참조

- `monkos-ops/tech/SPEC_20260306_코칭모드선택_GeminiLiveNativeAudio.md`

---

## 작업 내용

### Step 1: 모델 접근성 검증

```javascript
// 현재 프로젝트의 Vertex AI ADC로 접근 가능한지 확인
const ai = new GoogleGenAI({ vertexai: true, project: 'monkos', location: 'us-central1' });

const session = await ai.live.connect({
  model: 'gemini-live-2.5-flash-native-audio',
  config: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Kore' }
      }
    },
    systemInstruction: { parts: [{ text: '한국어로 짧게 인사해주세요.' }] }
  },
  callbacks: { ... }
});
```

**확인사항**:
1. Vertex AI ADC 인증으로 모델 접근 가능 여부
2. us-central1 리전에서 모델 사용 가능 여부
3. AUDIO responseModality 응답 정상 수신 여부
4. 응답 오디오 포맷: PCM 24kHz, 16-bit, mono 확인

### Step 2: 한국어/일본어 음성 검증

**한국어 테스트**:
```
systemInstruction: "한국어로 응답하세요. 증명사진 촬영 코칭입니다."
입력 텍스트: "고개를 조금 왼쪽으로 돌려주세요"
```

**일본어 테스트**:
```
systemInstruction: "日本語で応答してください。証明写真撮影のコーチングです。"
입력 텍스트: "少し左を向いてください"
```

확인: 한국어/일본어 음성이 자연스럽게 나오는지

### Step 3: 보이스 시연 (3종)

다음 3개 보이스로 동일 한국어 코칭 문장을 녹음:

| 보이스 | 계열 | 코칭 문장 |
|--------|------|----------|
| **Kore** | Firm | "고개를 살짝 오른쪽으로. 좋아요, 지금 촬영하세요!" |
| **Puck** | Bright | 동일 |
| **Aoede** | 중성 | 동일 |

**산출물**: 각 보이스별 PCM → WAV 변환 파일 (작가님 시청용)
- 저장 경로: `~/Desktop/쌍아/voice_samples/`
  - `kore_coaching_sample.wav`
  - `puck_coaching_sample.wav`
  - `aoede_coaching_sample.wav`

### Step 4: 이미지 입력 + 코칭 AUDIO 응답 통합 테스트

실제 촬영실 시나리오 시뮬레이션:
1. Live 세션 연결 (AUDIO 모드)
2. JPEG 이미지 프레임 전송 (`sendRealtimeInput`)
3. AUDIO 응답 수신 확인
4. 응답 지연 시간(latency) 측정

---

## 테스트 스크립트

`scripts/test_live_audio.js`에 검증 스크립트 작성:
- Step 1~4 자동화
- 결과를 콘솔 로그로 출력
- WAV 파일 자동 저장

---

## ⚠️ 준수 조항

- **헌법 2조**: 완료 보고 필수 — 각 Step별 성공/실패 명시
- **헌법 6조**: API 키 생성·추측 금지. 기존 Vertex AI ADC 사용
- **헌법 8조**: 파괴적 명령 금지
- **법률 6장**: 커밋 메시지 `[test] Gemini Live Native Audio 모델 검증 + 보이스 시연`

---

## 보고서

- `monkos-ops/ops/reports/REPORT_20260306_막내3_GeminiLiveNativeAudio검증.md`
- 모델 접근성, 음성 품질, 지연 시간, 보이스별 비교 포함
