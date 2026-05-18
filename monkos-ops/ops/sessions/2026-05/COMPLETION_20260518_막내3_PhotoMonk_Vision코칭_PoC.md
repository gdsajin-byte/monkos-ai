---
type: completion
date: 2026-05-18
device: iMac
agent: 막내3
portfolio: PF_IDPHOTO
status: 완료
---

# 완료 보고: PhotoMonk — Apple Vision 실시간 코칭 PoC

> 2026-05-18 | iMac/막내3

## 산출물

### 프로젝트: `apps/PhotoMonk/`

| 파일 | 줄 수 | 역할 |
|------|-------|------|
| `Package.swift` | 12 | macOS 14 + iOS 17 듀얼 타겟 |
| `PhotoMonkApp.swift` | 11 | @main 진입점 |
| `CameraManager.swift` | 120 | AVCaptureSession + 프레임 딜리버리 + 사진 캡처 |
| `CoachingEngine.swift` | 219 | Vision 분석 + 9규칙 코칭 엔진 |
| `CoachingView.swift` | 330 | 카메라 프리뷰 + 타원 가이드 + 코칭 UI + 결과 화면 |
| `SpeechCoach.swift` | 34 | AVSpeechSynthesizer TTS (3초 쿨다운) |
| **합계** | **714** | |

## 빌드 결과

| 환경 | 명령 | 결과 |
|------|------|------|
| macOS (swift build) | `swift build` | ✅ Build complete (17.48s) |
| iOS Simulator (xcodebuild) | `xcodebuild -scheme PhotoMonk -destination 'generic/platform=iOS Simulator'` | ✅ BUILD SUCCEEDED |

## 구현 상세

### 1. 카메라 (CameraManager)

- `AVCaptureSession` + 전면 카메라 (`builtInWideAngleCamera`, `.front`)
- macOS 폴백: 내장 카메라 (`AVCaptureDevice.default(for: .video)`)
- `AVCaptureVideoDataOutput` → 프레임 콜백 (분석용)
- `AVCapturePhotoOutput` → 고화질 스틸 캡처
- 권한 요청 자동 처리 (`AVCaptureDevice.requestAccess`)
- iOS: 비디오 미러링 활성화

### 2. 코칭 엔진 (CoachingEngine)

**Vision 요청:** `VNDetectFaceLandmarksRequest` (Revision3, 76포인트)
**프레임 레이트:** ~12fps 스로틀 (0.08초 간격)

**9개 규칙:**

| # | 규칙 | Vision 데이터 | 임계값 | 가이드 메시지 |
|---|------|--------------|--------|-------------|
| 1 | 얼굴 없음 | results.count == 0 | — | "얼굴이 보이지 않습니다" |
| 2 | 다수 얼굴 | results.count > 1 | — | "한 명만 촬영해주세요" |
| 3 | 중앙 이탈 | bbox.midX/midY vs 0.5 | 15% | "얼굴을 중앙으로 이동해주세요" |
| 4 | 너무 멀리 | bbox.height | < 25% | "카메라에 좀 더 가까이" |
| 5 | 너무 가까이 | bbox.height | > 65% | "조금 뒤로 물러나주세요" |
| 6 | 좌우 회전 (yaw) | face.yaw | > 15° | "정면을 봐주세요" |
| 7 | 좌우 기울기 (roll) | face.roll | > 5° | "고개를 바르게 해주세요" |
| 8 | 상하 기울기 (pitch) | face.pitch + 랜드마크 폴백 | > 10° | "턱을 살짝 올려/내려주세요" |
| 9 | 눈 감김 | leftEye/rightEye aspect ratio | < 0.18 | "눈을 떠주세요" |

**상태 집계:**
- 🔴 교정 필요: 2개+ 규칙 실패
- 🟡 거의 완료: 1개 규칙 실패
- 🟢 촬영 가능: 전 규칙 통과

### 3. UI (CoachingView)

- **전체화면 카메라 프리뷰** (`AVCaptureVideoPreviewLayer`, 크로스플랫폼)
- **타원형 가이드 프레임**: Canvas EvenOdd fill로 외부 딤 처리 + 상태별 색상 테두리
- **상단**: 가이드 메시지 (ultraThinMaterial 배경)
- **중앙**: 카운트다운 표시 (자동촬영 시 3-2-1)
- **하단**: 상태 표시(🔴🟡🟢) + 캡처 버튼 + TTS 토글 + 자동촬영 토글
- **결과 화면**: 촬영 완료 후 미리보기 + 다시촬영/사용하기 버튼

### 4. 자동촬영

- 전 규칙 🟢 상태 15프레임 연속 유지 시 자동 트리거 (~1.2초)
- 3초 카운트다운 → 도중 규칙 실패 시 카운트다운 취소
- 토글 버튼으로 On/Off

### 5. 음성 안내 (SpeechCoach)

- `AVSpeechSynthesizer` (ko-KR 기본)
- 동일 메시지 3초 쿨다운 (반복 방지)
- 말하는 중 새 메시지 → 현재 발화 중단 후 새 메시지
- TTS 토글로 On/Off
- locale 속성으로 `ja-JP`, `en-US` 분기 가능 구조

## 테스트 항목 (디바이스 테스트 필요)

> PoC 코드 기반 예상. 실제 iOS 디바이스 테스트는 Xcode + M1/M4에서 수행 필요.

| 항목 | 방법 | 예상 결과 |
|------|------|----------|
| **정면 인식 정확도** | 정면/15°/30°/45° 각도별 | VNDetectFaceLandmarksRequest Revision3 — 정면~15° 안정, 30° 이상 감지 가능하나 랜드마크 정밀도 저하, 45° 이상 감지 실패 가능 |
| **반응 속도** | 자세 변경 → 가이드 표시 | ~80ms 스로틀 + Vision 처리 ~20-40ms = 체감 즉시 (~100ms) |
| **조명 민감도** | 밝은/어두운/역광 | Vision은 조명 변화에 강건하나, 극단적 역광 시 얼굴 미감지 가능 |
| **배터리 소모** | 10분 연속 | Vision 온디바이스 + 카메라 = 보통 수준. Gemini Live API 호출 대비 현저히 낮음 |
| **pitch 정확도** | 고개 상하 10° 미세 변화 | face.pitch 미제공 시 랜드마크 폴백 → 정밀도 다소 저하. iOS 17에서는 pitch 직접 제공 기대 |
| **눈 감김 감지** | 의도적 눈 감기/뜨기 | eye aspect ratio 방식 — 빠른 깜빡임 감지 어려움, 2초+ 감김은 감지 |

## IDPASS(MonkosCrop) 대비 아키텍처

| 항목 | IDPASS (MonkosCrop) | PhotoMonk (본 PoC) |
|------|--------------------|--------------------|
| 목적 | 크롭 (사후 처리) | 코칭 (촬영 가이드) |
| 입력 | 갤러리 사진 (PhotosPicker) | 실시간 카메라 |
| Vision 사용 | 정적 이미지 1회 분석 | 실시간 연속 분석 (~12fps) |
| 서버 의존 | 없음 (100% 온디바이스) | 없음 (100% 온디바이스) |
| TTS | 없음 | AVSpeechSynthesizer |
| 출력 | 크롭된 증명사진 | 코칭 후 촬영 원본 |

## Gemini Live 대비 장단점

| 항목 | Gemini Live (현재 웹) | Apple Vision (본 PoC) |
|------|----------------------|----------------------|
| 비용 | API 호출당 과금 | **무료** |
| 레이턴시 | 네트워크 왕복 (200-500ms) | **즉시 (~100ms)** |
| 오프라인 | 불가 | **가능** |
| 자연어 대화 | ✅ 자연스러운 대화형 코칭 | ❌ 규칙 기반 정형 메시지 |
| 상황 인식 | ✅ 복합 판단 (조명, 표정, 복장 등) | ⚠️ 얼굴 기하학만 판단 |
| 6/1 모델 리스크 | ❌ `gemini-2.0-flash-live` shutdown 예정 | ✅ 없음 |
| 프라이버시 | 서버 전송 | **온디바이스 완결** |

**결론:** 기본 자세 교정(위치·각도·거리·눈 감김)은 Vision으로 충분. 복장·조명·표정 등 고급 코칭은 Gemini Live이 우위. 하이브리드(Vision 기본 → 옵션으로 AI 코칭)도 가능.
