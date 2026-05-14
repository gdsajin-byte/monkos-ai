---
type: order
date: 2026-05-14
from: iMac/쌍아
to: iMac/막내1
subject: PF_CROP — Step4 웹 크롭 엔진 통합 구현 (프레임 고정 + 사진 이동 패러다임)
status: 대기
portfolio: PF_CROP
prior: REPORT_20260514_막내1_크롭앱_엔진통합설계.md
---

# 지시서: Step4 웹 크롭 엔진 통합 구현

## 목적

현재 iOS 앱의 Step4를 **웹 크롭 엔진(crop.js)의 "프레임 고정 + 사진 이동" 패러다임**으로 전면 재구축한다. 설계 정본은 본인이 작성한 `REPORT_20260514_막내1_크롭앱_엔진통합설계.md`이다. 보고서의 §3~§5를 구현한다.

## 현재 앱 플로우 (유지)

```
Step1: 규격 선택 (유지)
Step2: 사진 업로드 → 얼굴 감지 (유지)
Step3: 배경색 선택 → 원본 전체 누끼 (유지)
Step4: ★ 본 지시서 대상 — 측정 + 검수 + 교정 + 최종 크롭 ★
Step5: 완료 + 다운로드 (유지)
```

## 구현 내용

### Phase 1 — 기반 구조

#### 1-1. PhotoSpec 확장

`SpecData.swift`의 `PhotoSpec`에 필드 추가:

```swift
let faceMin: Double    // ICAO 얼굴 최소 mm (여권: 32)
let faceMax: Double    // ICAO 얼굴 최대 mm (여권: 36)
let faceTarget: Double // 목표 얼굴 mm (여권: 34)
```

기존 `appCountries` 데이터에 값 반영. 웹 SPECS 객체 참조:
- 여권: faceMin=32, faceMax=36, faceTarget=34

#### 1-2. CropState 정의

보고서 §3.3의 `CropState` struct를 `ContentView.swift` 또는 별도 파일에 구현.

#### 1-3. computeMetrics() 구현

보고서 §3.5의 `computeMetrics()` 함수 구현. 웹 `render()` 수치 로직 직역.

#### 1-4. coachingMessage() 구현

보고서 §3.7의 코칭 메시지 분기 함수 구현. i18n `tr()` 키 추가 필요.

### Phase 2 — autoPlace 이식

#### 2-1. autoPlace() 함수

보고서 §3.4의 `autoPlace()` 구현. 웹 `autoPlace()` (crop.js 735행~) 직역.

핵심:
- cover 스케일 계산 (object-fit: cover 모사)
- imgScale: 얼굴이 faceTarget mm에 맞도록
- imgOffset.y: 눈이 43%에 오도록
- imgOffset.x: 얼굴 중심이 프레임 중앙에 오도록
- 모든 랜드마크를 프레임 좌표로 변환

#### 2-2. Step3→Step4 전환 시 초기화

`runBgRemoval()` 완료 후 Step4 진입 시 `autoPlace()` 호출하여 `CropState` 초기화.

### Phase 3 — Step4 뷰 리빌드

#### 3-1. 뷰 구조 (보고서 §3.2)

기존 `step4` computed property를 전면 교체:

```
ZStack (규격 비율 aspectRatio clip)
  ├─ [L0] bgColor 배경
  ├─ [L1] GeometryReader → 누끼 원본 이미지 (offset + scaleEffect + DragGesture)
  ├─ [L2] GuideOverlay (SwiftUI Canvas 또는 Path)
  │    ├─ 상단/하단 반투명 마스크 (crown 위, chin 아래)
  │    ├─ 정수리 가로선 (faceSignal 색상)
  │    ├─ 턱끝 가로선 (고정)
  │    ├─ 눈 가로선 (eyeSignal 색상)
  │    ├─ 세로 중심선 (중심 이탈도 색상)
  │    ├─ 정수리 핀 (DragGesture — crown.y만 변경)
  │    ├─ 얼굴 mm 배지 (faceMm + faceMin~faceMax)
  │    └─ 상태 배지 (In spec / Out of range)
  └─ [L3] CornerBrackets (기존 유지)
```

#### 3-2. 이미지 드래그

사진 DragGesture → `imgOffset` 변경 → `CropState.pts` 전체 +dx,dy 이동 → `computeMetrics()` 자동 갱신.

**핵심**: 사진이 움직이면 pts(crown/chin/pupils) 전체가 따라 움직인다. 프레임은 고정.

#### 3-3. 줌 슬라이더

`Slider(value: $imgScale)` → 스케일 변경 시 **프레임 중심 기준 pts 재배치** (보고서 §1.6 스케일 재배치 공식):

```swift
let ratio = newScale / oldScale
let cx = frameW / 2
let cy = frameH / 2
pts[key] = CGPoint(
    x: cx + (pts[key].x - cx) * ratio,
    y: cy + (pts[key].y - cy) * ratio
)
```

#### 3-4. 정수리 핀 드래그

보고서 §3.8 — crown.y만 드래그 변경. faceMm/topMm 변동, eyeRatio 불변.

#### 3-5. MetricBar 실시간 갱신

기존 `MetricBox` 컴포넌트 재활용. CropState 변경 → computeMetrics() → 4칸 갱신.
표시 항목: EYE(%), FACE(mm), TOP(mm), BTM(mm)

#### 3-6. 코칭 메시지

Step4 상단에 실시간 코칭 메시지 표시. 규격 내이면 "모든 항목이 규격 범위 내입니다." 표시.

### Phase 4 — 최종 크롭

#### 4-1. performFinalCrop()

보고서 §3.9의 `performFinalCrop()` 구현. 웹 `performCrop()` (crop.js 856행~) 직역.

**핵심**: CSS transform 체인을 UIGraphicsContext/CGContext에 정확히 재현:
1. outScale = pxH / frameH
2. ctx.scaleBy(outScale)
3. ctx.translateBy(frameW/2 + imgOffset, frameH/2 + imgOffset)
4. ctx.scaleBy(imgScale)
5. ctx.translateBy(-frameW/2, -frameH/2)
6. cover 스케일로 drawImage

macOS 빌드 시 NSGraphicsContext/CIImage 기반으로 분기 (`#if canImport(UIKit)`).

#### 4-2. "이대로 크롭 →" 버튼

`CropMetrics.isBlocked == true` 이면 비활성 (dim 처리). 
활성 시 → `performFinalCrop()` → `croppedImage` 설정 → Step5 진입.

#### 4-3. "초기화" 버튼

`autoPlace()` 재실행 → CropState 리셋.

## 기존 코드 처리

- **기존 `CropEngine.crop()`**: 호출하지 않음. autoPlace + performFinalCrop이 대체.
  - 단, `CropEngine.detectFace()`, `generatePersonMask()`, `compositeBackground()`는 그대로 사용.
- **기존 검수 시퀀스 (`InspectionState`)**: Step4에서 제거. 실시간 메트릭 + 코칭이 대체.
- **기존 `FaceLandmarksOverlay`**: 새 `GuideOverlay`로 교체.
- **기존 메트릭 계산 (eyePct, chinPct 등)**: `computeMetrics()`로 교체.

## 검증

1. macOS PoC 빌드 (`swiftc -target x86_64-apple-macosx13.0`)로 동작 확인
2. 사진 업로드 → Step3 누끼 → Step4 진입 시 얼굴이 규격 프레임 안에 자동 배치
3. 드래그로 사진 이동 → 메트릭 실시간 변동 + 코칭 메시지 전환
4. 슬라이더로 줌 → 메트릭 실시간 변동
5. 정수리 핀 드래그 → faceMm 변동
6. "이대로 크롭" → Step5에서 트리밍된 결과물 확인
7. 규격 이탈 시 크롭 버튼 비활성 + 코칭 메시지 표시

## 산출물

- `ContentView.swift` Step4 전면 교체
- `SpecData.swift` PhotoSpec 확장
- 필요 시 `CropState.swift`, `GuideOverlay.swift` 신규 파일
- macOS PoC 빌드 성공 확인
- `COMPLETION_20260514_막내1_크롭앱_Step4엔진통합.md`

## ⚠️ 준수 조항

- Step1, Step2, Step3, Step5, Landing, Thanks 뷰는 수정하지 않는다
- CropEngine.swift의 detectFace(), generatePersonMask(), compositeBackground()는 수정하지 않는다
- 웹 엔진의 좌표 계산 공식을 정확하게 이식할 것. 추측 금지 — crop.js 코드에 근거
- i18n 키 추가 시 ko/en/ja 3개 언어 전부 추가
- `#if canImport(UIKit)` / `#else` 분기로 iOS/macOS 양쪽 빌드 가능하게

---

> 발행: **[2026-05-14 13:50 KST]** iMac/쌍아 → iMac/막내1 투입 대기
