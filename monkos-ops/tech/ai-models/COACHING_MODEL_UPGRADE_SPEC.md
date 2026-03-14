# AI 코칭 모델 업그레이드 기술명세

**작성일:** 2026-02-13
**작성자:** 쌍아 (Claude Code Opus 4.6)
**상태:** Phase 1 실패 → Phase 2 설계 완료

---

## 1. 현행 시스템

### 아키텍처

```
[클라이언트]                    [서버 (Cloud Run)]              [Google Cloud]
카메라 JPEG ──WebSocket──→ server.js ──ai.live.connect()──→ Gemini 2.0 Flash Live
  (수십~수백KB/프레임)       sendRealtimeInput()              (Vertex AI ADC)
                                                                    │
                           ←── ai-coaching 텍스트 ────────────────┘
```

### 현재 모델 맵

| 용도 | 모델 | 인증 | 비고 |
|------|------|------|------|
| 코칭 (Live) | `gemini-2.0-flash-live-preview-04-09` | Vertex AI ADC | 멀티모달 Live 유일 |
| I2I 생성 | `gemini-3-pro-image-preview` | AI Studio API Key | Vertex AI 미지원 |
| QC | `gemini-2.0-flash` | Vertex AI ADC | |
| 챗봇/CS | `gemini-2.0-flash` | Vertex AI ADC | 포털 |

### 현행 문제점

1. **모델 고정** — 멀티모달 Live는 `2.0-flash-live-preview-04-09`만 지원. 업그레이드 불가
2. **높은 토큰 비용** — 매 프레임 이미지 토큰 소비 (JPEG → 이미지 토큰)
3. **네트워크 의존** — 카메라 프레임을 서버 경유로 Google에 전송 (이중 hop)
4. **해석 비일관성** — AI가 매번 이미지를 "보고" 판단하므로 동일 자세에 다른 코칭 가능
5. **서버 부하** — 프레임 중계가 서버 메모리/대역폭 소비

---

## 2. Phase 1: Gemini 2.5 Live 직접 전환 시도 (실패)

### 시도 내용

| 항목 | 변경 |
|------|------|
| 모델 | `gemini-2.0-flash-live-preview-04-09` → `gemini-2.5-flash-native-audio-latest` |
| 인증 | Vertex AI ADC (`ai`) → AI Studio API Key (`imagenAI`) |
| 메서드 | `live.connect()` (동일 SDK) |
| 배포 | KR `00061-hzh`, JP `00062-6rw` |

### 실패 로그

```
14:51:25.473 [Gemini Live][c1] 연결 완료
14:51:25.474 [Gemini Live][c1] 세션 초기화 완료
14:51:25.510 [Gemini Live][c1] 연결 종료: 1007    ← 37ms 만에 종료
14:51:26.482 [Gemini Live][c1] 연결 완료           ← 재시도
14:51:26.545 [Gemini Live][c1] 연결 종료: 1007    ← 63ms 만에 종료
... (무한 반복)
```

### 실패 원인

- **WebSocket 1007** = Invalid frame payload data
- `gemini-2.5-flash-native-audio-latest`는 **음성(Audio) 전용** Live 모델
- `bidiGenerateContent` 메서드를 지원하지만, **이미지 프레임 입력 미지원**
- `sendRealtimeInput({ media: { data, mimeType: 'image/jpeg' } })` → 서버 측 즉시 거부

### Gemini 2.5 모델 현황 (2026-02-13 기준)

#### AI Studio (API Key)

| 모델 | 메서드 | 용도 |
|------|--------|------|
| `gemini-2.5-flash` | `generateContent` | 텍스트/멀티모달 (비실시간) |
| `gemini-2.5-pro` | `generateContent` | 텍스트/멀티모달 (비실시간) |
| `gemini-2.5-flash-native-audio-latest` | `bidiGenerateContent` | **음성 전용 Live** |
| `gemini-2.5-flash-native-audio-preview-12-2025` | `bidiGenerateContent` | 음성 전용 Live |
| `gemini-2.5-flash-native-audio-preview-09-2025` | `bidiGenerateContent` | 음성 전용 Live |
| `gemini-2.5-flash-preview-tts` | `generateContent` | TTS 전용 |
| `gemini-2.5-flash-image` | `generateContent` | 이미지 생성 |
| `gemini-2.5-flash-lite` | `generateContent` | 경량 텍스트 |

#### Vertex AI

| 모델 | 메서드 | 비고 |
|------|--------|------|
| `gemini-2.5-flash` | `generateContent` | Live 미지원 |
| `gemini-2.5-flash-lite` | `generateContent` | Live 미지원 |
| `gemini-2.5-flash-image` | `generateContent` | Live 미지원 |
| `gemini-2.0-flash-live-preview-04-09` | `bidiGenerateContent` | **멀티모달 Live 유일** |

### 결론

> **2026-02-13 현재, 이미지 프레임을 실시간 Live로 받을 수 있는 모델은 `gemini-2.0-flash-live-preview-04-09` 하나뿐이다.**
> Vertex AI에서만 사용 가능하며, 2.5 계열에는 동등 모델이 존재하지 않는다.

---

## 3. Phase 2: MediaPipe 벡터 중개 방식 (설계)

### 핵심 발상

이미지를 AI에게 보내는 대신, **브라우저에서 얼굴을 수치 데이터로 변환**한 뒤 텍스트로 전송.
이미지 해석을 AI가 하지 않으므로 **아무 텍스트 모델이나 사용 가능**.

### 아키텍처

```
[클라이언트 (브라우저)]
카메라 → MediaPipe Face Mesh (WASM, 로컬)
              │
              ├─ 468개 3D 랜드마크 (x, y, z)
              ├─ 52개 Blendshape 계수 (표정)
              └─ 변환행렬 (yaw, pitch, roll)
              │
              ▼
         데이터 가공 (JS)
              │
              ├─ yaw: -8.2°     (좌우 회전)
              ├─ pitch: 3.1°    (상하 기울기)
              ├─ roll: -1.5°    (좌우 기울기)
              ├─ eyeOpenL: 0.92 (왼눈 개방도)
              ├─ eyeOpenR: 0.88 (오른눈 개방도)
              ├─ mouthGap: 0.05 (입 벌림)
              ├─ faceCenter: { x: 0.48, y: 0.52 } (얼굴 중심)
              ├─ faceSizeRatio: 0.35 (프레임 대비 얼굴 비율)
              └─ brightness: 0.72 (조도 추정)
              │
              ▼  (~50 bytes, JSON)
         WebSocket → 서버 → Gemini 2.5 Flash (텍스트 입력)
                                    │
                                    ▼
                           "고개를 오른쪽으로 8도 돌려주세요"
```

### MediaPipe Face Landmarker 스펙

| 항목 | 값 |
|------|-----|
| 라이브러리 | `@mediapipe/tasks-vision` |
| CDN | `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js` |
| WASM 런타임 | `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm` |
| 랜드마크 수 | 468개 3D 좌표 (x, y, z) |
| Blendshape | 52개 표정 계수 |
| 변환행렬 | 4x4 행렬 (yaw/pitch/roll 추출 가능) |
| 실행 위치 | 클라이언트 브라우저 (WebAssembly) |
| 모바일 호환 | iOS Safari, Android Chrome 지원 |
| 프레임 레이트 | 30fps+ (모바일 기준) |

### 코칭용 추출 데이터 설계

```javascript
// 클라이언트에서 추출하여 서버로 전송할 데이터
const coachingData = {
  // 얼굴 방향 (변환행렬에서 추출)
  yaw: -8.2,           // 좌우 회전 (도) — 음수=왼쪽, 양수=오른쪽
  pitch: 3.1,          // 상하 기울기 (도) — 음수=아래, 양수=위
  roll: -1.5,          // 좌우 기울기 (도) — 음수=왼쪽 기울임

  // 표정 (Blendshape 계수, 0~1)
  eyeOpenL: 0.92,      // 왼눈 개방도
  eyeOpenR: 0.88,      // 오른눈 개방도
  mouthSmile: 0.15,    // 미소 정도
  mouthGap: 0.05,      // 입 벌림 정도
  browUp: 0.10,        // 눈썹 올림

  // 위치/크기
  faceX: 0.48,         // 얼굴 중심 X (0~1, 0.5=정중앙)
  faceY: 0.52,         // 얼굴 중심 Y
  faceSizeRatio: 0.35,  // 프레임 대비 얼굴 크기 비율
  faceVisible: true,    // 얼굴 감지 여부

  // 조도 (선택 — 캔버스 밝기 추정)
  brightness: 0.72,     // 0=어두움, 1=밝음
};
```

### 코칭 시스템 프롬프트 (2.5 Flash용)

```
당신은 MONKOS AI 증명사진 코칭 전문가입니다.
클라이언트에서 실시간 얼굴 데이터(JSON)를 수신합니다.

## 데이터 해석
- yaw: 0° = 정면. ±3° 이내 = OK. 음수=왼쪽 회전
- pitch: 0° = 정면. ±5° 이내 = OK. 음수=아래 숙임
- roll: 0° = 수평. ±3° 이내 = OK. 음수=왼쪽 기울임
- eyeOpen: 0.7 이상 = OK
- mouthGap: 0.1 이하 = OK (입 다물기)
- faceX/Y: 0.45~0.55 = 중앙 OK
- faceSizeRatio: 0.30~0.45 = 적정 거리
- brightness: 0.5 이상 = OK

## 응답 규칙
- 1문장, 20자 이내
- 가장 큰 문제 1개만 지적
- 모든 수치 OK면 "좋습니다! 지금 촬영하세요!"
- 친근한 존댓말
```

### Phase 2 vs 현행 비교

| 항목 | 현행 (Phase 0) | Phase 2 (MediaPipe) |
|------|---------------|---------------------|
| 얼굴 분석 | 서버 (Gemini 이미지 해석) | **클라이언트 (MediaPipe WASM)** |
| 네트워크 전송 | JPEG 수십~수백KB | **JSON ~50 bytes** |
| 코칭 모델 | `gemini-2.0-flash-live` 고정 | **아무 텍스트 모델** (2.5 Flash 등) |
| 인증 | Vertex AI ADC 전용 | AI Studio API Key 또는 Vertex AI |
| 토큰 비용 | 이미지 토큰 (고비용) | **텍스트 토큰만 (저비용)** |
| 코칭 정밀도 | AI 이미지 해석 의존 (가변) | **수치 기반 (일관)** |
| 모바일 부하 | 낮음 (서버 위임) | 약간 증가 (WASM 실행) |
| 서버 부하 | 프레임 중계 (높음) | **제로 (텍스트만)** |
| 오프라인 가능 | 불가 | 얼굴 감지만 오프라인 가능 |

### 구현 범위

#### 클라이언트 (`index.html`)

1. MediaPipe Face Landmarker CDN 로드
2. `initFaceMesh()` — WASM 초기화 + 모델 로드
3. `detectLoop()` — 카메라 프레임 → 랜드마크 → 데이터 추출 루프
4. `extractCoachingData(landmarks, blendshapes, matrix)` — 코칭 데이터 가공
5. WS 전송 타입 변경: 바이너리(JPEG) → `{ type: 'face-data', data: coachingData }`

#### 서버 (`server.js`)

1. `connectGeminiLive()` 제거 → `connectGeminiChat()` (일반 generateContent)
2. `face-data` 메시지 수신 → JSON을 코칭 프롬프트에 삽입 → 2.5 Flash 호출
3. Vertex AI ADC `ai` 클라이언트 → `imagenAI` (AI Studio) 또는 2.5 Flash용 클라이언트

#### 변경 파일

| 파일 | 변경 |
|------|------|
| `idphoto-kr/public/index.html` | MediaPipe 로드 + 데이터 추출 + WS 전송 변경 |
| `idphoto-jp/public/index.html` | 동일 |
| `idphoto-kr/server.js` | Live 제거 → generateContent 코칭 |
| `idphoto-jp/server.js` | 동일 |

### 리스크

| 리스크 | 심각도 | 대책 |
|--------|--------|------|
| 구형 모바일 WASM 성능 | 중간 | MediaPipe Lite 모델 사용 (경량) |
| 조도 추정 정확도 | 낮음 | 캔버스 평균 밝기로 간접 추정 |
| generateContent 레이턴시 | 중간 | 2.5 Flash Lite 사용 시 수백ms 이내 |
| 첫 로드 WASM 다운로드 | 중간 | CDN 캐시 + preload |

### 향후 확장

- MediaPipe 데이터 → 클라이언트 자체 판단 (서버 호출 없이 즉시 가이드) → 서버는 최종 판정만
- 5090 로컬 추론 시 완전 오프라인 코칭 가능
- 동일 데이터를 학습 데이터로 축적 → 최적 자세 ML 모델 자체 훈련

---

## 4. 롤백 이력

| 시각 | 리비전 | 모델 | 결과 |
|------|--------|------|------|
| 23:37 | KR `00061-hzh` / JP `00062-6rw` | `gemini-2.5-flash-native-audio-latest` | 실패 (1007) |
| 23:47 | KR `00062-crn` / JP `00063-cln` | `gemini-2.0-flash-live-preview-04-09` | 정상 복구 |

---

## 5. 결론

1. **Gemini 2.5 멀티모달 Live 모델은 아직 없다** (2026-02-13 기준)
2. **native-audio 모델은 음성 전용** — 이미지 입력 불가
3. **근본적 해결은 Phase 2 (MediaPipe 벡터 중개)** — 모델 종속성 제거, 비용 절감, 정밀도 향상
4. 현행 `2.0-flash-live`는 Phase 2 구현 전까지 유지
