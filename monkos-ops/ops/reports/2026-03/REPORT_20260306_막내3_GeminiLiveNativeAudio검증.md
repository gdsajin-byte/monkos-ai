---
type: report
date: 2026-03-06
from: iMac/막내3
to: iMac/쌍아
order: ORDER_20260306_iMac쌍아_막내3_GeminiLiveNativeAudio검증
status: completed
---

# [보고서] Gemini Live Native Audio 모델 검증 + 보이스 시연

> **[2026-03-06 17:07 KST] iMac/막내3 → iMac/쌍아**

---

## 검증 결과 요약

| Step | 항목 | 결과 | 비고 |
|------|------|------|------|
| 1 | 모델 접근성 | ✅ 성공 | Vertex AI ADC 인증 OK |
| 2 | 한국어 음성 | ✅ 성공 | 210,794B, 2,765ms |
| 2 | 일본어 음성 | ✅ 성공 | 74,474B, 1,359ms |
| 3 | Kore 보이스 | ✅ 성공 | 193,558B WAV, 1,963ms |
| 3 | Puck 보이스 | ✅ 성공 | 206,998B WAV, 1,990ms |
| 3 | Aoede 보이스 | ✅ 성공 | 193,558B WAV, 1,941ms |
| 4 | 이미지+오디오 | ✅ 성공 | 212,714B, 첫 청크 2,451ms |

**전 항목 통과. Native Audio 마이그레이션 가능 확인.**

---

## Step 1: 모델 접근성 검증

```
모델: gemini-live-2.5-flash-native-audio
인증: Vertex AI ADC (PROJECT_ID=monkos, LOCATION=us-central1)
```

- Vertex AI ADC 인증으로 모델 접근: ✅
- us-central1 리전 사용 가능: ✅
- AUDIO responseModality 응답: ✅ (PCM 18청크, 203,114B)
- 응답 오디오 포맷: PCM 24kHz, 16-bit, mono ✅
- 첫 세션 지연: 4,431ms (콜드 스타트 포함)

---

## Step 2: 한국어/일본어 음성 검증

### 한국어

| 항목 | 값 |
|------|-----|
| 보이스 | Kore |
| 입력 | "고개를 살짝 오른쪽으로. 좋아요, 지금 촬영하세요!" |
| 오디오 | 19청크, 210,794B |
| 지연 | 2,765ms |
| WAV | `_step2_kr_test.wav` |

### 일본어

| 항목 | 값 |
|------|-----|
| 보이스 | Kore |
| 입력 | "少し右を向いてください。いいですね、今撮影してください！" |
| 오디오 | 6청크, 74,474B |
| 지연 | 1,359ms |
| WAV | `_step2_jp_test.wav` |

양 언어 모두 자연스러운 음성 출력 확인. 일본어가 응답 크기 더 작음 (짧은 발화).

---

## Step 3: 보이스 시연 (3종)

코칭 문장: "고개를 살짝 오른쪽으로. 좋아요, 지금 촬영하세요!"

| 보이스 | 계열 | WAV 파일 | 크기 | 지연 |
|--------|------|----------|------|------|
| **Kore** | Firm | `kore_coaching_sample.wav` | 193,558B | 1,963ms |
| **Puck** | Bright | `puck_coaching_sample.wav` | 206,998B | 1,990ms |
| **Aoede** | 중성 | `aoede_coaching_sample.wav` | 193,558B | 1,941ms |

- 3보이스 모두 한국어 코칭 정상 발화
- 지연 시간: 1.9~2.0초 (워밍업 이후 안정적)
- Puck이 가장 긴 발화 (206KB vs 193KB)

**시연 파일 위치**: `~/Desktop/쌍아/voice_samples/`

---

## Step 4: 이미지 입력 + AUDIO 응답 통합 테스트

| 항목 | 값 |
|------|-----|
| 입력 | 256x256 JPEG (테스트 이미지) |
| 전송 | `sendRealtimeInput({ media: { data, mimeType: 'image/jpeg' } })` |
| 오디오 | 20청크, 212,714B |
| 첫 청크 지연 | **2,451ms** |
| WAV | `_step4_image_audio.wav` |

- 이미지 프레임 → AUDIO 코칭 응답 파이프라인: ✅ 정상
- 실제 촬영실 시나리오에서 약 2.5초 지연 예상

---

## 성능 분석

| 구간 | 현행 (TEXT + TTS) | Native Audio |
|------|-----------------|-------------|
| Gemini Live 응답 | ~600ms (텍스트) | ~2,000ms (오디오) |
| 클라이언트 처리 | +TTS 변환 (~500ms) | +AudioWorklet 재생 (~0ms) |
| **총 지연** | **~1,100ms** | **~2,000ms** |
| iOS 호환 | ❌ (TTS 미작동) | ✅ (Web Audio API) |
| 음성 품질 | 기기 TTS 의존 | HD 보이스 고정 |

→ 지연 시간은 약 0.9초 증가하나, iOS 호환성 + 음성 품질 일관성으로 트레이드오프 가치 있음.

---

## 결론 + 다음 단계

1. **모델 사용 가능**: `gemini-live-2.5-flash-native-audio` — Vertex AI ADC, us-central1에서 정상 작동
2. **한국어/일본어**: 양 언어 모두 자연스러운 코칭 음성 출력
3. **보이스 3종 시연 완료**: `~/Desktop/쌍아/voice_samples/`에 WAV 저장 → 작가님 시청 후 보이스 선택
4. **이미지+오디오 통합**: 촬영실 파이프라인 호환 확인 (첫 청크 ~2.5초)

**Phase B 진행 가능**: 서버 모드 분기 구현 (SPEC_20260306 §2.2)
