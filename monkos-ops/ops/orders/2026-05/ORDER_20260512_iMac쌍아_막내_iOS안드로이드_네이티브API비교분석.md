---
type: order
date: 2026-05-12
from: iMac/쌍아
to: iMac/막내
portfolio: PF_CROP
status: 대기
---

# 지시서 — iOS vs Android 네이티브 API 비교 분석 데이터표

> **[2026-05-12 18:41 KST] iMac/쌍아 → iMac/막내**

## 목적

MonkosCrop 앱의 iOS 네이티브 전환 근거 수립 + Android 병행 개발 판단 자료.
iOS/Android 양 플랫폼의 네이티브 API를 **크롭앱 관점 + 범용 앱 관점** 양쪽에서 비교 분석한다.

## 산출물

**마크다운 리포트 1건**: `monkos-ops/ops/reports/2026-05/REPORT_20260512_막내_iOS안드로이드_네이티브API비교분석.md`

## 요구사항

### 1. 비교 대상 영역 (최소 아래 포함, 추가 발굴 환영)

| # | 영역 | iOS 측 | Android 측 |
|---|------|--------|-----------|
| 1 | 얼굴 인식/랜드마크 | Vision (VNDetectFaceLandmarks) | ML Kit Face Detection |
| 2 | 이미지 세그멘테이션 (배경 제거) | Vision + Core ML | ML Kit Segmentation / MediaPipe |
| 3 | 카메라 제어 | AVFoundation | CameraX / Camera2 |
| 4 | 이미지 처리/편집 | Core Image, vImage | RenderScript / Vulkan Compute |
| 5 | AR | ARKit + LiDAR | ARCore |
| 6 | 음성 인식 | Speech Framework | SpeechRecognizer |
| 7 | 생체 인증 | Face ID / Touch ID (LocalAuthentication) | BiometricPrompt (지문/얼굴) |
| 8 | NFC | Core NFC | Android NFC |
| 9 | 결제 | StoreKit / Apple Pay | Google Play Billing / Google Pay |
| 10 | 건강/피트니스 센서 | HealthKit + Core Motion | Health Connect + SensorManager |
| 11 | 백그라운드 처리 | BGTaskScheduler | WorkManager / Foreground Service |
| 12 | 로컬 ML 추론 | Core ML + Neural Engine | NNAPI + GPU Delegate (TFLite) |
| 13 | 온디바이스 OCR | Vision (VNRecognizeTextRequest) | ML Kit Text Recognition |
| 14 | 바코드/QR | Vision (VNDetectBarcodesRequest) | ML Kit Barcode Scanning |
| 15 | 푸시 알림 | APNs | FCM |
| 16 | 위치 서비스 | Core Location | Fused Location Provider |
| 17 | 블루투스 | Core Bluetooth | Android BLE |
| 18 | 파일 시스템 접근 | FileManager (샌드박스) | SAF / MediaStore |
| 19 | 위젯 | WidgetKit | App Widgets (Glance) |
| 20 | 딥링크/앱링크 | Universal Links | App Links / Deep Links |

### 2. 비교 항목 (각 영역마다 아래 열 채우기)

| 비교 항목 | 설명 |
|----------|------|
| **전용 하드웨어 가속** | Neural Engine / NPU / ISP / Secure Enclave 등 전용 칩 활용 여부 |
| **추가 번들 사이즈** | 시스템 내장(0MB) vs 외부 라이브러리 필요 시 용량 |
| **처리 속도** | 벤치마크 수치 또는 상대 비교 (가능한 한 수치 기반) |
| **정확도/품질** | 공식 문서 기반 정확도, 커뮤니티 평가 |
| **최소 OS 버전** | API 사용 가능 최소 버전 |
| **웹 대비 이점** | 같은 기능을 웹(JS/WASM)으로 구현했을 때 대비 네이티브의 차별점 |
| **크롭앱 활용도** | 우리 MonkosCrop에서 직접 쓸 수 있는지 (◎ 핵심 / ○ 활용 가능 / △ 간접 / ✕ 무관) |

### 3. 종합 분석 섹션

- **iOS 우위 영역**: Neural Engine 독점 등 하드웨어 락인이 강한 영역
- **Android 우위 영역**: 개방성/커스터마이징이 강한 영역
- **동등 영역**: 양쪽 성능 차이 무의미한 영역
- **웹으로 충분한 영역**: 네이티브 전환 불필요한 것들
- **MonkosCrop 관점 결론**: 크롭앱에서 실제로 네이티브 이점을 취하는 기능 목록 + Android 병행 시 주의점

### 4. 리서치 원칙

- **공식 문서 1차 출처**: Apple Developer Documentation, Android Developers 기준
- **수치 근거**: "빠르다/좋다" 금지. 벤치마크 수치 또는 공식 스펙 기재. 수치 없으면 `[수치 미확인]` 표기
- **2025~2026 기준**: 최신 OS (iOS 19, Android 16) 기준으로 작성. 구버전 한정 기능은 명시

## ⚠️ 준수 조항

- 헌법 3조 1항: 타임스탬프 `date` 취득 필수
- ch7 3조: 지시서 범위 밖 작업 금지
- 완료 시: COMPLETION 보고 + 세션 로그 어펜드 + PF_CROP 히스토리 1행 어펜드
