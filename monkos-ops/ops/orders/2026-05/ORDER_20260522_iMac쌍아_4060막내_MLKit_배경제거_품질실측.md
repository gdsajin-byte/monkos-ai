---
type: order
date: 2026-05-22
from: iMac/쌍아
to: 4060/막내
status: 대기
portfolio: PF_CROP
---

# ML Kit Subject Segmentation 배경제거 품질 실측 (4060 환경)

## 배경

IDPASS Android 네이티브 앱 개발 사전 조사. 배경 제거 엔진 선택지 비교:
- **A. ML Kit Subject Segmentation** — Google Play Services 의존, 번들 0MB
- **B. ISNet ONNX (@imgly)** — 앱 번들 ~40MB, 웹 PoC에서 품질 검증 완료 (04/30)
- **참조. Apple PersonSegmentation** — iOS 정본 품질 (IDPASS 현재 사용 중)

ML Kit이 Apple PersonSegmentation급 품질이면 Android 앱 번들 40MB 절약 가능. 실측 필요.

## 환경

- **4060 (NVIDIA RTX 4060)** — CUDA 가용, Android 에뮬레이터 원활
- Android SDK + 에뮬레이터 구축 필요 시 선행 설치
- ISNet ONNX 추론은 CUDA로 실행 가능 (속도 비교에 유리)

## 작업

### 1. Android 테스트 프로젝트 생성

`apps/monkos-crop-android-test/` (Kotlin, Compose 기반 최소 프로젝트)

### 2. ML Kit Subject Segmentation 구현

```kotlin
// build.gradle
implementation("com.google.mlkit:subject-segmentation:16.0.0-beta1")

val segmenter = SubjectSegmentation.getClient(
    SubjectSegmenterOptions.Builder()
        .enableForegroundBitmap()
        .build()
)
```

### 3. ISNet ONNX 비교 구현

```kotlin
implementation("com.microsoft.onnxruntime:onnxruntime-android:1.17.0")
```

모델: `@imgly/background-removal`에서 사용하는 ISNet ONNX 모델 추출.

### 4. 테스트 샘플

동일 샘플 5장:
- `apps/MonkosCrop/MonkosCrop/Resources/ID_Photosample.jpg` (기존 앱 샘플)
- `apps/MonkosCrop/MonkosCrop/Resources/pass_f_1.jpg`
- 추가 3장: 복잡한 배경, 역광, 곱슬머리 등 엣지 케이스 (웹에서 수집)

### 5. 비교 보고서

| 비교 항목 | ML Kit | ISNet |
|----------|--------|-------|
| 머리카락 경계 정밀도 | ? | ? |
| 어깨/옷 경계 | ? | ? |
| 반투명 영역 (귀 뒤 머리카락 등) | ? | ? |
| 처리 시간 (ms) | ? | ? |
| 앱 번들 증가량 | 0MB (Play Services) | ~40MB |
| 오프라인 동작 | Play Services 캐시 의존 | ✅ 완전 오프라인 |
| 최소 Android 버전 | API 24+ | API 21+ |
| beta API 제약사항 | ? | 없음 |

결과 이미지를 나란히 비교 캡처.

### 6. ML Kit Face Detection contour 모드 부수 테스트

배경 제거 실측 김에 얼굴 인식도 확인:

```kotlin
val faceDetector = FaceDetection.getClient(
    FaceDetectorOptions.Builder()
        .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
        .build()
)
```

- contour 포인트 수 실측 (스펙: ~130pt)
- 눈 중심, 턱 최하단, 코끝 좌표 추출 가능 여부
- Apple Vision 76pt 대비 크롭 로직 이식 가능성 판단

## 산출물

1. 비교 보고서 (`REPORT_20260522_4060막내_MLKit배경제거_품질실측.md`)
2. 비교 이미지 셋 (ML Kit vs ISNet, 5장×2)
3. Face Detection contour 좌표 덤프
4. 테스트 프로젝트 코드

## ⚠️ 준수 조항

- Android 실기기 또는 에뮬레이터에서 **실측**할 것 (문서 스펙 비교 아님)
- ML Kit beta API 프로덕션 사용 가능 여부 확인
- 기존 막내 지시서(iMac 대상)는 본 지시서로 대체. 환경 블로커 해소.
