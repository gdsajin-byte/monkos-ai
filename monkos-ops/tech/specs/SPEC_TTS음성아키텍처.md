---
type: spec
date: 2026-02-14
subject: TTS / Voice 아키텍처 기술명세
service: studio
origin: memory/tts_voice_architecture.md
---

# TTS / Voice 아키텍처 기술명세

> 작성: 2026-02-14 | 세션23 대화 기반 정리

## 1. 핵심 판단

**촬영 코칭 = 대화가 아니라 지시(Command)**
- 필요한 것: **정확한 분석 + 적절한 타이밍 + 짧은 지시**
- 불필요한 것: 맥락 대화, 감정 교감, 긴 문장

## 2. 아키텍처 비교

### 현재 (Gemini 2.0 Live 단일)
```
[카메라 프레임] → 2.0 Live (분석+음성 동시) → 스트리밍 응답
```

### 제안 (눈+입 분리)
```
[카메라 프레임] → 3 Flash (정밀 분석) → JSON 지시어 → TTS (즉시 발화)
```

### 하이브리드 (눈→입 연결)
```
[카메라 프레임] → 3 Flash (정밀 분석) → 결과를 2.0 Live 컨텍스트에 주입
```

## 3. TTS 시장 비교 (2026-02 기준)

| 항목 | 1위 | 2위 | 3위 |
|------|-----|-----|-----|
| 음질/자연스러움 | ElevenLabs | Inworld | OpenAI |
| 레이턴시 | ElevenLabs Flash (75ms) | OpenAI (200ms) | Google (200ms) |
| 다국어 커버 | Google (380+) | ElevenLabs (70+) | OpenAI |

### 가격 비교 (100만 글자)

| 서비스 | 비용 |
|--------|------|
| Google Cloud TTS Standard | $4 (월 4M 무료) |
| OpenAI TTS Mini | $0.60 |
| OpenAI TTS HD | $30 |
| ElevenLabs | $99~330/월 |
| Web Speech API | 무료 |

## 4. 전략적 판단

- **증명사진 촬영 코칭**: 눈(3 Flash) + 입(경량 TTS) 조합이 최적
- **프레젠테이션 코칭**: Gemini 2.0 Live 유지
- **내레이션/스크립트 재생**: ElevenLabs 또는 OpenAI TTS HD
