---
type: order
date: 2026-05-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_CROP
---

# ML Kit Subject Segmentation 배경제거 품질 실측

## 배경

IDPASS Android 네이티브 앱 개발 사전 조사. 배경 제거 엔진 선택지:
- **A. ML Kit Subject Segmentation** — Google Play Services 의존, 번들 0MB, 기기 파편화 덜함
- **B. ISNet ONNX (@imgly)** — 앱 번들 40MB, 품질 검증됨 (웹 PoC 04/30)
- **참조. Apple PersonSegmentation** — iOS 정본 품질 (IDPASS 현재 사용 중)

ML Kit이 Apple PersonSegmentation급 품질이면 번들 40MB 절약 가능. 품질 실측이 필요.

## 작업

### 1. Android 테스트 프로젝트 생성

`apps/monkos-crop-android-test/` (Kotlin, Compose 기반 최소 프로젝트)

### 2. ML Kit Subject Segmentation 구현

```kotlin
// build.gradle
implementation("com.google.mlkit:subject-segmentation:16.0.0-beta1")

// SubjectSegmenter 호출
val segmenter = SubjectSegmentation.getClient(
    SubjectSegmenterOptions.Builder()
        .enableForegroundBitmap()
        .build()
)
```

- 입력: 증명사진 샘플 5장 (정면, 다양한 배경/조명/머리카락)
- 출력: 누끼 이미지 (전경 비트맵 + 흰색 배경 합성)

### 3. ISNet ONNX 비교 구현

동일 샘플 5장에 대해 ONNX Runtime으로 ISNet 추론 비교.

```kotlin
implementation("com.microsoft.onnxruntime:onnxruntime-android:1.17.0")
```

모델: `@imgly/background-removal`에서 사용하는 ISNet ONNX 모델 추출.

### 4. 비교 보고서 작성

| 비교 항목 | ML Kit | ISNet | Apple (참조) |
|----------|--------|-------|-------------|
| 머리카락 경계 정밀도 | ? | ? | 우수 |
| 어깨/옷 경계 | ? | ? | 우수 |
| 반투명 영역 (귀 뒤 머리카락 등) | ? | ? | ? |
| 처리 시간 (ms) | ? | ? | 1~2초 |
| 앱 번들 증가량 | 0MB (Play Services) | ~40MB | 0MB |
| 오프라인 동작 | Play Services 캐시 | ✅ | ✅ |
| 최소 Android 버전 | API 24+ | API 21+ | — |

샘플 이미지:
- `Resources/ID_Photosample.jpg` (기존 앱 샘플)
- `Resources/pass_f_1.jpg`
- 추가 3장: 복잡한 배경, 역광, 곱슬머리 등 엣지 케이스

결과 이미지를 나란히 비교하여 `/tmp/mlkit_vs_isnet/` 에 저장.

## 산출물

1. 비교 보고서 (`REPORT_20260522_막내_MLKit배경제거_품질실측.md`)
2. 비교 이미지 셋 (`/tmp/mlkit_vs_isnet/`)
3. 테스트 프로젝트 코드

## ⚠️ 준수 조항

- Android 실기기 또는 에뮬레이터에서 실측할 것 (문서 스펙 비교 아님)
- ML Kit beta API 제한사항 확인 (16.0.0-beta1 — 프로덕션 사용 가능 여부)
