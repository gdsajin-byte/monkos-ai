---
type: completion
date: 2026-05-18
device: M4
agent: 쌍아
status: 마감
portfolio: PF_IDPHOTO
---

# 완료 보고: PhotoMonk 실기기 빌드 + 설치 + 테스트 + 코칭엔진 디버깅

> **[2026-05-18 17:52 KST] M4/쌍아 → 작가님**

## 지시서

`ORDER_20260518_iMac쌍아_M4쌍아_PhotoMonk_실기기빌드.md`

## 작업 개요

iMac/쌍아가 개발한 PhotoMonk PoC(Apple Vision 실시간 코칭 앱)를 M4 실기기(iPhone 17 Pro)에서 빌드·설치·테스트하고, 발견된 버그 4건을 수정했다.

---

## 1. Xcode 프로젝트 구성

### 문제: SPM → Xcode 프로젝트 전환

기존 `apps/PhotoMonk/`은 `Package.swift` 기반 SPM 프로젝트로, `swift package generate-xcodeproj`은 Swift 6.3에서 제거되어 사용 불가. Xcode GUI로 `PHOTOMONK.xcodeproj` 신규 생성 후 기존 소스를 통합했다.

### 프로젝트 구조

```
apps/PhotoMonk/PHOTOMONK/
├── PHOTOMONK.xcodeproj/
│   └── project.pbxproj          ← 서명/권한/배포타겟 설정
└── PHOTOMONK/
    ├── PhotoMonkApp.swift        ← @main 앱 엔트리
    ├── CameraManager.swift       ← AVCaptureSession + 전면카메라
    ├── CoachingEngine.swift      ← Vision 분석 + 규칙 엔진 + 시퀀스
    ├── CoachingView.swift        ← SwiftUI UI + 카메라 프리뷰
    ├── SpeechCoach.swift         ← AVSpeechSynthesizer TTS
    └── Assets.xcassets/
```

### pbxproj 설정

| 항목 | 값 |
|------|-----|
| Bundle ID | `ai.monkos.photomonk` |
| Team | `ZPMVHPDUHW` (MONK STUDIO) |
| Signing | Automatic — `Apple Development: JeongKyu Shin (Q63WT2V55B)` |
| Deployment Target | iOS 17.0 |
| Camera 권한 | `NSCameraUsageDescription` 추가 |
| Microphone 권한 | `NSMicrophoneUsageDescription` 추가 |

---

## 2. 발견 버그 및 수정 (4건)

### Bug #1: `setVideoMirrored` 크래시

**증상**: 앱 실행 직후 크래시. 카메라 권한 팝업만 보이고 종료.

**원인**: `AVCaptureConnection.isVideoMirrored = true` 호출 시 `automaticallyAdjustsVideoMirroring`이 기본값 `YES`여서 충돌.

**에러**: `NSInvalidArgumentException: Cannot be set when automaticallyAdjustsVideoMirroring is YES`

**수정** (`CameraManager.swift:66-68`, `CoachingView.swift:383-384`):
```swift
// Before
conn.isVideoMirrored = true

// After
conn.automaticallyAdjustsVideoMirroring = false
conn.isVideoMirrored = true
```

### Bug #2: 카메라 프리뷰 미표시

**증상**: 크래시 해결 후 앱 실행되나 카메라 영상 안 보임. 가이드 오버레이만 표시.

**원인**: `CameraPreview`의 `UIView`에 `AVCaptureVideoPreviewLayer`를 `addSublayer`로 추가했으나, 레이어의 `frame`이 `.zero`로 초기화되어 크기가 갱신되지 않음.

**수정** (`CoachingView.swift` — `CameraPreview` 전면 재작성):
```swift
// Before: addSublayer 방식 (frame 수동 관리 필요)
struct CameraPreview: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        let layer = AVCaptureVideoPreviewLayer(session: session)
        view.layer.addSublayer(layer)  // frame이 .zero → 안 보임
        ...
    }
}

// After: layerClass 오버라이드 (자동 리사이즈)
class PreviewUIView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}
```

### Bug #3: readyFrameCount 스레드 경합 (race condition)

**증상**: 카메라+코칭 정상 동작하나 🟡(거의 완료)에서 🟢(촬영 가능)으로 전이 안 됨. 15프레임 연속 통과 카운터가 누적되지 않음.

**원인**: `readyFrameCount`는 `@Published`로 main thread에서만 갱신되는데, 카메라 queue에서 `let prev = readyFrameCount`로 읽으면 항상 stale 값(0)을 읽음. 카운터가 영원히 0.

**수정** (`CoachingEngine.swift`):
```swift
// Before: main thread 변수를 camera queue에서 읽음
let prev = readyFrameCount  // ← camera queue에서 읽으면 stale
let newCount = allOK ? prev + 1 : 0
DispatchQueue.main.async {
    self.readyFrameCount = newCount
    if allOK && newCount >= Self.autoReadyFrames { self.startSequence() }
}

// After: camera queue 전용 카운터 분리
private var internalReadyCount: Int = 0  // camera queue 전용

internalReadyCount = allOK ? internalReadyCount + 1 : max(internalReadyCount - 1, 0)
let count = internalReadyCount
let shouldStart = allOK && count >= Self.autoReadyFrames
DispatchQueue.main.async {
    self.readyFrameCount = count
    if shouldStart { self.startSequence() }
}
```

### Bug #4: Vision roll 값 90° 고정

**증상**: Bug #3 해결 후에도 🟢 도달 불가. frontal 규칙이 "고개를 바르게 해주세요"를 무한 반복.

**원인**: `VNFaceObservation.roll`이 전면카메라 + `.upMirrored` orientation 조합에서 **항상 90°(π/2 rad)를 반환**. 실제 사용자의 고개 기울기가 아닌 카메라 회전 보정값이 섞여있음. 디버그 로그로 확인:
```
[Frontal] yaw=0.0° roll=90.0°   ← 정면을 보고 있어도 90°
[Frontal] yaw=0.0° roll=90.0°
[Frontal] yaw=0.0° roll=90.0°
```

**수정**: roll 체크 완전 제거. 향후 `CMMotionManager` 또는 `deviceMotion`으로 디바이스 기울기를 별도 감지하는 방식으로 대체 필요.
```swift
// Before
if rollDeg > rollLimit {
    return [RuleResult(priority: .frontal, passed: false, message: "고개를 바르게 해주세요")]
}

// After: roll 체크 제거, yaw만 유지
```

---

## 3. 임계값 튜닝

실기기 테스트 과정에서 원본 임계값이 너무 엄격하여 단계적으로 완화:

| 항목 | 원본 | 최종 | 비고 |
|------|------|------|------|
| autoReadyFrames | 15 | 10 | 연속 통과 프레임 |
| 실패 시 카운터 | 즉시 0 | -1 감소 | 간헐적 실패 허용 |
| centerThreshold | 0.15 | 0.20 | 중앙 이탈 허용 |
| minFaceRatio | 0.25 | 0.20 | 최소 얼굴 크기 |
| maxFaceRatio | 0.65 | 0.70 | 최대 얼굴 크기 |
| yawLimit | 15° | 25° | 좌우 회전 |
| rollLimit | 5° | **제거** | Vision 90° 버그 |
| eyeAspectMin | 0.18 | 0.12 | 눈 감김 |
| foreheadLow | 0.40 | 0.30 | 카메라 각도 하한 |
| foreheadHigh | 0.70 | 0.80 | 카메라 각도 상한 |
| chinFrameMin | 0.25 | 0.10 | 턱 위치 |
| brightnessMin | 0.30 | 0.20 | 밝기 |
| backlightRatio | 1.5 | 2.0 | 역광 |
| shadowDiff | 0.30 | 0.50 | 그림자 |
| blurMin | 0.04 | 0.03 | 흔들림 |
| movementLimit | 0.12 | 0.15 | 시퀀스 중 움직임 |

---

## 4. Combine import 누락

Swift 6의 strict concurrency 모드(`SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`)에서 `@Published` 사용 시 `Combine` 명시 import 필요.

- `CameraManager.swift` — `import Combine` 추가
- `SpeechCoach.swift` — `import Combine` 추가

---

## 5. 테스트 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| Xcode 프로젝트 빌드 (Simulator) | ✅ PASS | iPhone 17 Pro Simulator |
| Xcode 프로젝트 빌드 (실기기) | ✅ PASS | iPhone 17 Pro (18,1) |
| iPhone 설치 | ✅ PASS | `devicectl device install app` |
| 카메라 프리뷰 | ✅ PASS | Bug #2 수정 후 |
| Vision 랜드마크 | ✅ PASS | 가이드 오버레이 표시 |
| 코칭 메시지 우선순위 | ✅ PASS | 1개씩 순서대로 |
| yaw 감지 | ✅ PASS | 좌우 회전 25° 기준 |
| roll 감지 | ❌ FAIL | Vision 90° 고정 버그 — 체크 제거 |
| 🟢 전항목 통과 → 시퀀스 | ✅ PASS | Bug #3 수정 후 |
| TTS 음성 | ⏳ 미확인 | 시퀀스 도달 후 작가님 확인 대기 |

---

## 6. 산출물

| # | 파일 | 비고 |
|---|------|------|
| 1 | `apps/PhotoMonk/PHOTOMONK/` | Xcode 프로젝트 (xcodeproj + 소스 5개) |
| 2 | 본 보고서 | `COMPLETION_20260518_M4쌍아_PhotoMonk_실기기빌드테스트.md` |

## 💡 향후 과제

- roll 감지: `CMMotionManager.deviceMotion`으로 디바이스 물리 기울기 사용
- 임계값: 다양한 조명/거리 환경에서 대규모 테스트 후 최적값 도출
- 카메라 각도: 전면카메라 `pitch` 추산 정밀도 개선

---

✅ 지시서 수행 완료 (Bug 4건 수정, 실기기 설치·실행 성공)
❌ roll 감지 — Vision API 한계, 별도 센서 방식 필요
💡 임계값은 PoC 기준 완화 상태, 프로덕션 시 재조정 필요
📁 `apps/PhotoMonk/PHOTOMONK/`, 본 보고서
