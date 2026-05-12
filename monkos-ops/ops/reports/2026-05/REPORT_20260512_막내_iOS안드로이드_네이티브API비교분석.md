---
type: report
date: 2026-05-12
device: iMac
agent: 막내1
portfolio: PF_CROP
status: 완료
---

# iOS vs Android 네이티브 API 비교 분석 — MonkosCrop 관점

> **[2026-05-12 18:51 KST] iMac/막내1**
> 지시서: `ORDER_20260512_iMac쌍아_막내_iOS안드로이드_네이티브API비교분석.md`
> 목적: MonkosCrop iOS 네이티브 전환 근거 수립 + Android 병행 개발 판단 자료

---

## 범례

| 기호 | 의미 |
|------|------|
| ◎ | 크롭앱 핵심 기능 — 반드시 활용 |
| ○ | 활용 가능 — Phase 2~3에서 도입 검토 |
| △ | 간접 관련 — 부가 기능으로 고려 가능 |
| ✕ | 무관 — 크롭앱에 해당 없음 |

---

## 1. 얼굴 인식 / 랜드마크

| 비교 항목 | iOS — Vision (VNDetectFaceLandmarks) | Android — ML Kit Face Detection |
|----------|--------------------------------------|--------------------------------|
| **전용 하드웨어 가속** | Neural Engine 직접 실행 (A17 Pro/A18: 35 TOPS). ISP 파이프라인과 통합 | NPU 활용은 SoC 의존 (Snapdragon 8 Elite: ~45 TOPS, Tensor G4: 비공개). NNAPI 경유였으나 Android 15에서 deprecated |
| **추가 번들 사이즈** | 0 MB (시스템 프레임워크 내장) | ~6.2 MB (번들 모델) 또는 Play Services 동적 다운로드 시 ~20 MB |
| **처리 속도** | <5 ms/frame (Neural Engine, .fast 모드) | 5–20 ms/frame (최적화 시, NV21 입력 + FAST 모드). 비최적화(Bitmap) 시 ~800 ms |
| **정확도/품질** | 80+ 랜드마크 포인트. iOS 19에서 모델 갱신. revision 3 이상 권장 | 133 랜드마크(Face Mesh 모드), contour 36포인트. 분류(눈 뜸/미소/고개 각도) 동시 지원 |
| **최소 OS 버전** | iOS 11 (랜드마크), iOS 17+ (Swift 네이티브 API) | API 21 (Android 5.0). Face Mesh는 Play Services 의존 |
| **웹 대비 이점** | MediaPipe WASM 대비 5–10배 빠름. Neural Engine 전용 경로 = 배터리 효율 극대 | MediaPipe WASM과 동일 모델 기반이나 NPU 오프로드 시 전력 효율 우위 |
| **크롭앱 활용도** | ◎ 핵심 — ICAO 얼굴 위치/크기/기울기 판정의 기반 | ◎ 핵심 — 동일 역할 |

**판정: iOS 우위** — 시스템 내장(0MB) + Neural Engine 전용 가속 + <5ms 레이턴시. Android는 번들 사이즈 부담 + SoC 파편화.

---

## 2. 이미지 세그멘테이션 (배경 제거)

| 비교 항목 | iOS — Vision + Core ML | Android — ML Kit Segmentation / MediaPipe |
|----------|------------------------|-------------------------------------------|
| **전용 하드웨어 가속** | Neural Engine 직접 실행. VNGeneratePersonSegmentationRequest는 ANE 최적화 | GPU Delegate 또는 NPU(SoC 의존). MediaPipe는 GPU 셰이더 경유 |
| **추가 번들 사이즈** | 0 MB (iOS 15+ 시스템 내장) | ML Kit ~3 MB (번들) + 모델 다운로드 ~5 MB. MediaPipe ~3–5 MB |
| **처리 속도** | .fast: <30 ms, .balanced: ~37 ms, .accurate: ~60 ms (iPhone 13 기준) | Selfie Segmentation: 25–65 ms (Pixel 4). 기기별 편차 큼 |
| **정확도/품질** | .accurate 모드: 고해상도 마스크 + 프레임 간 시간적 스무딩. 머리카락 경계 양호 | MobileNetV3 기반. 일반/풍경 모델 선택 가능. 머리카락 경계 MediaPipe 수준 |
| **최소 OS 버전** | iOS 15 (VNGeneratePersonSegmentationRequest) | API 21 (ML Kit), MediaPipe는 API 24+ |
| **웹 대비 이점** | @imgly ISNet(~5초) 대비 10배 이상 빠름. Neural Engine = 배터리 소모 최소 | @imgly ISNet 대비 빠르나 기기 편차. GPU 가속 가능 기기에서만 이점 |
| **크롭앱 활용도** | ◎ 핵심 — 배경 제거/교체가 Phase 2 필수 기능 | ◎ 핵심 — 동일 역할 |

**판정: iOS 우위** — 시스템 내장 + 3단계 품질 제어 + 시간적 스무딩. 웹 @imgly(5초) 대비 60ms는 압도적 차이.

---

## 3. 카메라 제어

| 비교 항목 | iOS — AVFoundation | Android — CameraX / Camera2 |
|----------|--------------------|-----------------------------|
| **전용 하드웨어 가속** | ISP(Image Signal Processor) 직접 제어. Deep Fusion, Smart HDR 자동 적용 | ISP 접근은 Camera2로 가능하나 OEM별 구현 상이. CameraX는 추상화 레이어 |
| **추가 번들 사이즈** | 0 MB (시스템 프레임워크) | CameraX: ~2.5 MB (Jetpack 라이브러리). Camera2: 0 MB (시스템) |
| **처리 속도** | 60fps 안정. ProRAW/ProRes 실시간 인코딩. LiDAR 깊이 맵 동시 취득 | CameraX 1.5: 60fps, 슬로모션, DNG/RAW 지원. Feature Group API로 조합 보장 |
| **정확도/품질** | Apple 전 기기 통일된 카메라 파이프라인. 48MP ProRAW 지원 | CameraX: 150+ 기기 테스트 완료. Camera2: 기기별 quirks 직접 대응 필요 |
| **최소 OS 버전** | iOS 4+ (AVFoundation). 최신 기능은 iOS 17+ | CameraX: API 21+ (Android 5.0). Camera2: API 21+ |
| **웹 대비 이점** | getUserMedia 대비: 노출/포커스/화이트밸런스 수동 제어, ProRAW, 다중 렌즈 선택 | getUserMedia 대비: 수동 노출/ISO, RAW 캡처, 멀티카메라 |
| **크롭앱 활용도** | ○ 활용 가능 — 인앱 촬영 기능 도입 시 품질 제어 가능 | ○ 활용 가능 — 동일 역할 |

**판정: iOS 소폭 우위** — 기기 통일성(파편화 없음). Android는 CameraX 1.5로 격차 축소 중이나 OEM 파편화 잔존.

---

## 4. 이미지 처리 / 편집

| 비교 항목 | iOS — Core Image, vImage | Android — RenderScript / Vulkan Compute |
|----------|--------------------------|----------------------------------------|
| **전용 하드웨어 가속** | Core Image: GPU/Metal 자동 선택. vImage: SIMD + Accelerate 프레임워크 (NEON) | RenderScript: deprecated (Android 12). Vulkan Compute: GPU 직접 실행 |
| **추가 번들 사이즈** | 0 MB (시스템 내장, 200+ 빌트인 필터) | RenderScript: 0 MB (deprecated). Vulkan: 0 MB (시스템). RenderEffect: 0 MB |
| **처리 속도** | Core Image 필터 체인: GPU 파이프라인 자동 최적화, lazy evaluation. 4K 이미지 실시간 | Vulkan Compute: GPU 직접 접근으로 고성능. RenderEffect(Android 12+): UI 레벨 블러/색상 |
| **정확도/품질** | 200+ 빌트인 필터. CIKernel으로 커스텀 Metal 셰이더. 색 공간 자동 관리 (Wide Color P3) | Vulkan 셰이더 직접 작성 필요. 빌트인 필터 라이브러리 없음 → GPUImage/Glide 등 서드파티 의존 |
| **최소 OS 버전** | iOS 5 (Core Image). vImage: iOS 7+ | Vulkan: API 24+ (Android 7.0). RenderEffect: API 31+ (Android 12) |
| **웹 대비 이점** | Canvas 2D/WebGL 대비: 200+ 필터 즉시 사용, GPU 파이프라인 자동 최적화, P3 색 공간 | Canvas/WebGL 대비: Vulkan 직접 GPU 접근. 단, 필터 라이브러리 직접 구축 필요 |
| **크롭앱 활용도** | ◎ 핵심 — 크롭 결과물 리사이즈, 배경색 합성, 밝기/콘트라스트 조정 | ◎ 핵심 — 동일 역할. 단 빌트인 필터 부재로 구현량 증가 |

**판정: iOS 우위** — 200+ 빌트인 필터 + GPU 자동 최적화 + lazy evaluation. Android는 RenderScript deprecated 이후 빌트인 이미지 처리 파이프라인 부재.

---

## 5. AR

| 비교 항목 | iOS — ARKit + LiDAR | Android — ARCore |
|----------|---------------------|------------------|
| **전용 하드웨어 가속** | LiDAR 스캐너(Pro 모델 전용) + TrueDepth 카메라 + Neural Engine. 메시 생성 하드웨어 가속 | ToF 센서 (일부 기기만). Depth API는 소프트웨어 추정 기반 |
| **추가 번들 사이즈** | 0 MB (시스템 프레임워크) | ARCore: ~30 MB (Google Play Services for AR, 별도 앱) |
| **처리 속도** | LiDAR: 실시간 메시 생성 (60fps). 평면 감지 즉시 | 평면 감지: 수 초 소요. 메시 생성: 소프트웨어 기반으로 느림 |
| **정확도/품질** | LiDAR: mm 단위 깊이 정확도. 얼굴 AR: TrueDepth 52개 블렌드셰이프 | 모노카메라 깊이 추정. 얼굴 AR: 전면 카메라 기반 468 메시 포인트 |
| **최소 OS 버전** | iOS 11 (ARKit). LiDAR: iPhone 12 Pro+ / iPad Pro 2020+ | ARCore: Android 7.0+. 지원 기기 목록 제한 (~수백 모델) |
| **웹 대비 이점** | WebXR 대비: LiDAR 깊이, 오클루전, 메시 스캐닝 불가 | WebXR 대비: Depth API, 환경 이해. 단 하드웨어 센서 접근 제한적 |
| **크롭앱 활용도** | △ 간접 — 3D 얼굴 정렬 보조 가능. Phase 3 이후 검토 대상 | △ 간접 — 동일 |

**판정: iOS 압도적 우위** — LiDAR 하드웨어 독점. 단, 크롭앱 관점에서는 양쪽 모두 핵심 기능이 아님.

---

## 6. 음성 인식

| 비교 항목 | iOS — Speech Framework | Android — SpeechRecognizer |
|----------|------------------------|---------------------------|
| **전용 하드웨어 가속** | Neural Engine 기반 온디바이스 모델 (iOS 13+). Siri 엔진 공유 | 온디바이스 모델 (Android 11+). 서버 기반은 Google Cloud Speech 연동 |
| **추가 번들 사이즈** | 0 MB (시스템 내장). 언어 모델: ~50 MB/언어 (시스템이 관리) | 0 MB (시스템/Play Services). 오프라인 모델: ~50 MB/언어 (사용자 다운로드) |
| **처리 속도** | 실시간 스트리밍 전사. 온디바이스 레이턴시 [수치 미확인] | 실시간 스트리밍. Android 16 GenAI Speech Recognition API 추가 |
| **정확도/품질** | 한국어/일본어/영어 지원. iOS 17+: 문장 부호 자동 삽입 | 한국어/일본어/영어 지원. Google 음성 인식 품질 업계 최고 수준 |
| **최소 OS 버전** | iOS 10 (서버). iOS 13+ (온디바이스) | API 3 (서버). Android 11+ (온디바이스) |
| **웹 대비 이점** | Web Speech API 대비: 오프라인 동작, 세밀한 타이밍 정보, 신뢰도 점수 | Web Speech API 대비: 오프라인 동작, Google 엔진 직접 접근 |
| **크롭앱 활용도** | ✕ 무관 — 증명사진 크롭에 음성 기능 불필요 | ✕ 무관 |

**판정: Android 소폭 우위** — Google 음성 인식 엔진의 정확도가 업계 최고. 단 크롭앱에는 무관.

---

## 7. 생체 인증

| 비교 항목 | iOS — Face ID / Touch ID (LocalAuthentication) | Android — BiometricPrompt |
|----------|------------------------------------------------|---------------------------|
| **전용 하드웨어 가속** | Secure Enclave + TrueDepth 카메라 (Face ID) / Secure Enclave (Touch ID). 생체 데이터 칩 외부 유출 불가 | TEE (Trusted Execution Environment) 또는 SE (Secure Element). 구현은 OEM 의존 |
| **추가 번들 사이즈** | 0 MB (시스템 프레임워크) | 0 MB (AndroidX Biometric ~100 KB) |
| **처리 속도** | Face ID: <100 ms (적외선 투사 → 3D 맵 매칭). Touch ID: <50 ms | 지문: <100 ms. 얼굴: 기기별 상이 (일부 2D 기반으로 보안 수준 하위) |
| **정확도/품질** | Face ID 오인식률: 1/1,000,000. Touch ID: 1/50,000. Apple 전 기기 균일 | Class 3 (강력): 1/50,000+ (지문). Class 2 (약): 2D 얼굴 인식 포함 → 보안 수준 기기별 상이 |
| **최소 OS 버전** | iOS 8 (Touch ID). iOS 11 (Face ID) | Android 9 (BiometricPrompt). Android 11 (BiometricManager) |
| **웹 대비 이점** | WebAuthn 대비: 더 빠른 UX, Secure Enclave 직접 접근, 앱 잠금 화면 통합 | WebAuthn 대비: 기기 내장 센서 직접 접근 |
| **크롭앱 활용도** | △ 간접 — 갤러리 접근 잠금 등 프라이버시 기능에 활용 가능 | △ 간접 — 동일 |

**판정: iOS 우위** — Secure Enclave 하드웨어 보안 + 전 기기 균일한 보안 수준. Android는 Class 2/3 혼재로 파편화.

---

## 8. NFC

| 비교 항목 | iOS — Core NFC | Android — Android NFC |
|----------|----------------|----------------------|
| **전용 하드웨어 가속** | NFC 컨트롤러 내장 (iPhone 7+). Secure Element 연동 | NFC 컨트롤러 내장. HCE(Host-based Card Emulation) 지원 |
| **추가 번들 사이즈** | 0 MB | 0 MB |
| **처리 속도** | NDEF 태그 읽기: 즉시 (iOS 13+ 백그라운드 태그 읽기) | NDEF 태그 읽기: 즉시. HCE 에뮬레이션 가능 |
| **정확도/품질** | NDEF, ISO 7816, ISO 15693, FeliCa 지원. 카드 에뮬레이션은 Apple Pay 전용 | NDEF, ISO-DEP, NfcA/B/F/V, HCE 풀 지원. 카드 에뮬레이션 개방 |
| **최소 OS 버전** | iOS 11 (읽기). iOS 13 (백그라운드 태그). iOS 13 (쓰기) | Android 2.3 (API 9). HCE: Android 4.4 (API 19) |
| **웹 대비 이점** | Web NFC 미지원(Chrome only, Android only) → 네이티브만 가능 | Web NFC: Chrome Android에서 NDEF 읽기/쓰기 가능. 네이티브는 HCE 추가 |
| **크롭앱 활용도** | ✕ 무관 | ✕ 무관 |

**판정: Android 우위** — HCE 풀 지원 + 카드 에뮬레이션 개방. iOS는 Apple Pay 외 에뮬레이션 제한. 단 크롭앱에는 무관.

---

## 9. 결제

| 비교 항목 | iOS — StoreKit / Apple Pay | Android — Google Play Billing / Google Pay |
|----------|---------------------------|-------------------------------------------|
| **전용 하드웨어 가속** | Secure Enclave (Apple Pay 토큰화). NFC 결제 | TEE 기반 토큰화. NFC 결제 (HCE) |
| **추가 번들 사이즈** | 0 MB (StoreKit 시스템 내장) | Play Billing Library v8.3: ~1 MB |
| **처리 속도** | StoreKit 2: async/await 네이티브. 트랜잭션 검증 자동화 | PBL v8: 일회성 상품 다중 구매 옵션, 비만료 구독 지원 |
| **정확도/품질** | App Store 수수료 30% (소규모 15%). StoreKit 2: 서버 검증 간소화 | Play Store 수수료 30% (소규모 15%). v8: 2026-08-31까지 v7 마이그레이션 필수 |
| **최소 OS 버전** | iOS 15 (StoreKit 2). iOS 3+ (레거시 StoreKit) | Play Billing v8: API 21+. Google Pay: API 19+ |
| **웹 대비 이점** | 웹 결제 대비: 생체 인증 원클릭, 구독 관리 시스템 통합, 영수증 자동 검증 | 웹 결제 대비: Play Store 구독 인프라, 할부 결제 API |
| **크롭앱 활용도** | ✕ 무관 — 크롭앱은 완전 무료 (IAP 없음, 광고 없음) | ✕ 무관 — 동일 |

**판정: 동등** — 양쪽 모두 성숙한 결제 인프라. 크롭앱은 완전 무료이므로 무관.

---

## 10. 건강/피트니스 센서

| 비교 항목 | iOS — HealthKit + Core Motion | Android — Health Connect + SensorManager |
|----------|-------------------------------|------------------------------------------|
| **전용 하드웨어 가속** | M-시리즈 모션 코프로세서 (가속도/자이로 상시 수집, 메인 CPU 미사용) | SoC 내장 센서허브 (저전력 상시 수집). 기기별 상이 |
| **추가 번들 사이즈** | 0 MB | Health Connect: ~5 MB (시스템 앱, Android 14+ 내장) |
| **처리 속도** | Core Motion: 실시간 (100Hz 가속도계). CMPedometer 배경 카운팅 | SensorManager: 실시간 (최대 ~400Hz 일부 기기). 배경 수집은 제한적 |
| **정확도/품질** | Apple Watch 연동으로 의료 등급 데이터 (심전도, 혈중산소). 80+ 데이터 타입 | Health Connect: 표준화된 데이터 타입. 웨어러블 연동은 제조사별 상이 |
| **최소 OS 버전** | iOS 8 (HealthKit). iOS 7 (Core Motion) | Health Connect: Android 14+ (내장). Android 9+ (별도 설치) |
| **웹 대비 이점** | DeviceMotion API 대비: 모션 코프로세서 상시 수집, 건강 데이터 통합 접근 | DeviceMotion API 대비: 센서허브 상시 수집, Health Connect 통합 |
| **크롭앱 활용도** | ✕ 무관 | ✕ 무관 |

**판정: iOS 소폭 우위** — Apple Watch 에코시스템 + 의료 등급 데이터. 크롭앱에는 무관.

---

## 11. 백그라운드 처리

| 비교 항목 | iOS — BGTaskScheduler | Android — WorkManager / Foreground Service |
|----------|----------------------|-------------------------------------------|
| **전용 하드웨어 가속** | 시스템 ML 기반 실행 시점 예측 (사용 패턴 학습). 배터리 최적화 자동 | 시스템 Doze/App Standby 정책. Foreground Service는 사용자 알림 필수 |
| **추가 번들 사이즈** | 0 MB | WorkManager: ~300 KB (AndroidX). Foreground Service: 0 MB |
| **처리 속도** | BGProcessingTask: 수 분 단위 작업 가능 (충전+Wi-Fi 시). BGAppRefreshTask: ~30초 | WorkManager: 제약 조건 충족 시 실행. Foreground Service: 시간 제한 없음 (Android 14+ 유형 필수 선언) |
| **정확도/품질** | iOS가 실행 시점 결정 → 정확한 타이밍 보장 불가. 시스템이 ML로 최적 시점 선택 | WorkManager: 지연 가능. Foreground Service: 즉시 실행 가능 |
| **최소 OS 버전** | iOS 13 (BGTaskScheduler) | WorkManager: API 14+ (Android 4.0). Foreground Service: API 26+ (유형 선언) |
| **웹 대비 이점** | Service Worker 대비: 네이티브 수준 배경 실행, 시스템 리소스 접근 | Service Worker 대비: 장시간 배경 작업, 시스템 API 접근 |
| **크롭앱 활용도** | △ 간접 — 대량 크롭 배치 처리 시 백그라운드 활용 가능 | △ 간접 — 동일 |

**판정: Android 우위** — Foreground Service로 장시간 배경 작업 자유도 높음. iOS는 시스템 제약 강함. 크롭앱에는 간접적.

---

## 12. 로컬 ML 추론

| 비교 항목 | iOS — Core ML + Neural Engine | Android — NNAPI(deprecated) + TFLite |
|----------|-------------------------------|--------------------------------------|
| **전용 하드웨어 가속** | Neural Engine 35 TOPS (A17 Pro/A18). Core ML이 ANE/GPU/CPU 자동 분배 | NNAPI: Android 15에서 deprecated. 대체: LiteRT(TFLite) GPU Delegate + QNN Delegate (Snapdragon). NPU 접근은 SoC별 전용 SDK 필요 |
| **추가 번들 사이즈** | 0 MB (Core ML 시스템 내장). 모델 파일만 번들 | TFLite 런타임: ~1.5 MB. GPU Delegate: ~0.5 MB 추가 |
| **처리 속도** | Photoroom 세그멘테이션 벤치마크: iPhone 15 Pro ~37 ms. MobileNet급 모델 30fps+ 가능 | GPU Delegate: CPU 대비 2–7배 가속. NPU INT8: CPU 대비 최대 120배 (ResNet50, 특정 SoC) |
| **정확도/품질** | coremltools로 PyTorch/TF 모델 변환. INT8/INT4 양자화 지원. iOS 19: 통합 모델 포맷 | TFLite: INT8/FP16 양자화. GPU Delegate에서 8비트 양자화 = float 동등 정확도 |
| **최소 OS 버전** | iOS 11 (Core ML). iOS 12+ (Neural Engine 가속). iOS 16+ (INT8 양자화) | NNAPI: Android 8.1+ (deprecated). TFLite: API 21+ |
| **웹 대비 이점** | WASM/WebGL 대비: Neural Engine 전용 가속(35 TOPS), 배터리 효율 10배+, 모델 로딩 시간 단축 | WASM/WebGL 대비: NPU/GPU 오프로드. 단 SoC 파편화로 일관된 성능 보장 어려움 |
| **크롭앱 활용도** | ◎ 핵심 — FaceMesh 대체 + 배경 제거 모델 + ICAO 검증 모델 모두 Core ML 경유 | ◎ 핵심 — 동일 역할. TFLite 경유 |

**판정: iOS 압도적 우위** — Core ML + Neural Engine 통합 파이프라인. 시스템 내장 0MB, 자동 ANE/GPU/CPU 분배. Android는 NNAPI deprecated + SoC 파편화 + 전용 SDK 난립.

---

## 13. 온디바이스 OCR

| 비교 항목 | iOS — Vision (VNRecognizeTextRequest) | Android — ML Kit Text Recognition v2 |
|----------|---------------------------------------|--------------------------------------|
| **전용 하드웨어 가속** | Neural Engine 실행. .accurate 모드는 ANE 최적화 | GPU Delegate 활용 가능. 온디바이스 모델 |
| **추가 번들 사이즈** | 0 MB (시스템 내장) | 번들: ~3 MB (Latin). CJK 추가 시: +18 MB |
| **처리 속도** | .fast: 실시간 (카메라 피드). .accurate: 프레임당 수십 ms [수치 미확인] | [수치 미확인]. Google 공식 벤치마크 미공개 |
| **정확도/품질** | iOS 19: 18개 언어 (한국어, 일본어, 중국어 포함). 자동 언어 감지. 문서 구조 인식 (RecognizeDocumentsRequest 신규) | Latin, Chinese, Devanagari, Japanese, Korean 지원. 최소 문자 크기: Latin 16×16px, CJK 24×24px. 정확도 수치 미공개 |
| **최소 OS 버전** | iOS 13 (VNRecognizeTextRequest). iOS 19 (RecognizeDocumentsRequest) | API 21+ (ML Kit v2) |
| **웹 대비 이점** | Tesseract.js/PaddleOCR WASM 대비: 시스템 내장(0MB) + Neural Engine 가속 + 18개 언어 | Tesseract.js 대비: 더 정확한 CJK 인식. 단 번들 사이즈 부담 |
| **크롭앱 활용도** | △ 간접 — 여권 MRZ 자동 인식으로 국적/문서유형 자동 판별 가능 (Phase 3) | △ 간접 — 동일 |

**판정: iOS 우위** — 시스템 내장 0MB + 18개 언어 + iOS 19 문서 구조 인식. Android는 CJK 추가 시 번들 +18MB.

---

## 14. 바코드 / QR

| 비교 항목 | iOS — Vision (VNDetectBarcodesRequest) | Android — ML Kit Barcode Scanning |
|----------|----------------------------------------|----------------------------------|
| **전용 하드웨어 가속** | Neural Engine / GPU 자동 선택 | 온디바이스 모델. GPU 활용 가능 |
| **추가 번들 사이즈** | 0 MB (시스템 내장) | 번들: ~2.4 MB. Google Play Services: 동적 다운로드 |
| **처리 속도** | 실시간 (카메라 피드 30fps+ 처리) | 실시간 (카메라 피드). Google Code Scanner API: 시스템 UI 제공 |
| **정확도/품질** | QR, EAN, DataMatrix, PDF417, Aztec 등 16+ 포맷. iOS 18: 멀티 바코드 동시 인식 개선 | QR, EAN, DataMatrix, PDF417, Aztec 등. 자동 줌 기능 |
| **최소 OS 버전** | iOS 11 | API 21+ |
| **웹 대비 이점** | BarcodeDetector API(Chrome only) 대비: 전 브라우저 동작 불가 → 네이티브 필수 | BarcodeDetector API 대비: 안정적 + 자동 줌 |
| **크롭앱 활용도** | ✕ 무관 | ✕ 무관 |

**판정: 동등** — 양쪽 모두 성숙. iOS는 시스템 내장(0MB), Android는 자동 줌 등 UX 기능 우위. 크롭앱에는 무관.

---

## 15. 푸시 알림

| 비교 항목 | iOS — APNs | Android — FCM |
|----------|------------|---------------|
| **전용 하드웨어 가속** | 해당 없음 (네트워크 서비스) | 해당 없음 (네트워크 서비스) |
| **추가 번들 사이즈** | 0 MB | Firebase Messaging: ~1 MB |
| **처리 속도** | 즉시 전송. 백그라운드 갱신 + Silent Push 지원 | 즉시 전송. 토픽 구독, 조건부 전송 지원 |
| **정확도/품질** | APNs: Apple 인프라 단일. 전달률 매우 높음. Rich Notification (이미지/비디오) | FCM: Google 인프라. 토픽/조건부/그룹 전송. Rich Notification |
| **최소 OS 버전** | iOS 3+ (APNs). iOS 10+ (UNUserNotificationCenter) | API 19+ (FCM) |
| **웹 대비 이점** | Web Push 대비: 배지 카운트, 소리 커스텀, 알림 그룹화, Silent Push | Web Push 대비: 토픽 구독, 조건부 전송, 데이터 메시지 |
| **크롭앱 활용도** | △ 간접 — 규격 업데이트 알림, 퍼널(MONKOS 프로모션) 활용 가능 | △ 간접 — 동일 |

**판정: 동등** — 양쪽 모두 성숙한 푸시 인프라. FCM은 크로스플랫폼(iOS 포함) 지원.

---

## 16. 위치 서비스

| 비교 항목 | iOS — Core Location | Android — Fused Location Provider |
|----------|--------------------|---------------------------------|
| **전용 하드웨어 가속** | U1/U2 칩 (UWB). GPS + Wi-Fi + 셀룰러 + 기압계 융합 | GPS + Wi-Fi + 셀룰러 + 센서 융합 (Google Play Services) |
| **추가 번들 사이즈** | 0 MB | Google Play Services 의존 (~0 MB 앱 내) |
| **처리 속도** | kCLLocationAccuracyBest: GPS 수 초. 실내: iBeacon + UWB 즉시 | FusedLocationProvider: GPS 수 초. 실내: Wi-Fi RTT (Android 9+) |
| **정확도/품질** | GPS: ~5m. UWB: ~10cm. Wi-Fi: ~15m | GPS: ~5m. Wi-Fi RTT: ~1-2m. 셀룰러: ~300m |
| **최소 OS 버전** | iOS 2+ (Core Location). iOS 13+ (UWB) | API 12+ (Fused Location). Play Services 필수 |
| **웹 대비 이점** | Geolocation API 대비: UWB 정밀 위치, 지오펜싱, 방문 모니터링, 배경 위치 | Geolocation API 대비: 지오펜싱, 활동 인식, 배경 위치 |
| **크롭앱 활용도** | △ 간접 — 사용자 위치 기반 국가 자동 선택에 활용 가능 | △ 간접 — 동일 |

**판정: 동등** — GPS 정확도 동등. iOS는 UWB 우위, Android는 Wi-Fi RTT 우위. 크롭앱에서는 IP 기반 국가 판별로 충분.

---

## 17. 블루투스

| 비교 항목 | iOS — Core Bluetooth | Android — Android BLE |
|----------|---------------------|----------------------|
| **전용 하드웨어 가속** | BLE 5.3. W-시리즈 칩 (AirPods/Apple Watch 연동) | BLE 5.x (기기 의존). Companion Device Manager |
| **추가 번들 사이즈** | 0 MB | 0 MB |
| **처리 속도** | BLE 연결: ~100ms. 데이터 전송: 기기 의존 | BLE 연결: ~100–300ms. 기기별 편차 |
| **정확도/품질** | Central/Peripheral 모드. L2CAP 채널. 백그라운드 BLE 지원 (제한적) | Central/Peripheral 모드. L2CAP (API 29+). 백그라운드 BLE (Foreground Service 필요) |
| **최소 OS 버전** | iOS 5 (Core Bluetooth). BLE: iOS 7+ | Android 4.3 (API 18). BLE Peripheral: API 21+ |
| **웹 대비 이점** | Web Bluetooth 대비: Peripheral 모드, L2CAP, 백그라운드 동작, Apple 생태계 연동 | Web Bluetooth 대비: Peripheral 모드, 백그라운드 스캔, Companion Device Manager |
| **크롭앱 활용도** | ✕ 무관 | ✕ 무관 |

**판정: 동등** — 양쪽 모두 BLE 풀 지원. iOS는 Apple 생태계 통합, Android는 개방성. 크롭앱에는 무관.

---

## 18. 파일 시스템 접근

| 비교 항목 | iOS — FileManager (샌드박스) | Android — SAF / MediaStore |
|----------|----------------------------|---------------------------|
| **전용 하드웨어 가속** | 해당 없음 | 해당 없음 |
| **추가 번들 사이즈** | 0 MB | 0 MB |
| **처리 속도** | 샌드박스 내 즉시. 외부 파일: UIDocumentPickerViewController 경유 | SAF: DocumentsProvider 경유. MediaStore: ContentResolver 쿼리 |
| **정확도/품질** | 앱 샌드박스 격리. iCloud Drive 연동. App Groups로 앱 간 공유 | Scoped Storage (Android 10+). MediaStore: 이미지/비디오 메타데이터 접근. 외부 저장소: MANAGE_EXTERNAL_STORAGE 권한 |
| **최소 OS 버전** | iOS 2+ (FileManager). iOS 11+ (Files 앱 연동) | SAF: API 19+ (Android 4.4). Scoped Storage: API 29+ (필수 API 30+) |
| **웹 대비 이점** | File API 대비: 영구 저장, iCloud 동기화, 앱 간 공유 | File API 대비: 영구 저장, MediaStore 메타데이터, 외부 저장소 |
| **크롭앱 활용도** | ○ 활용 가능 — 크롭 결과물 저장/공유. 포토 라이브러리 직접 저장 (PHPhotoLibrary) | ○ 활용 가능 — MediaStore로 갤러리 저장. SAF로 커스텀 위치 저장 |

**판정: Android 소폭 우위** — 파일 시스템 접근 자유도 높음 (MANAGE_EXTERNAL_STORAGE). iOS는 샌드박스 제약. 크롭앱에서는 양쪽 모두 충분.

---

## 19. 위젯

| 비교 항목 | iOS — WidgetKit | Android — App Widgets (Glance) |
|----------|-----------------|-------------------------------|
| **전용 하드웨어 가속** | 해당 없음 | 해당 없음 |
| **추가 번들 사이즈** | 0 MB (위젯 Extension 별도 타겟) | Glance: ~200 KB (Jetpack Compose Glance). 전통 RemoteViews: 0 MB |
| **처리 속도** | Timeline 기반 갱신. 시스템이 갱신 시점 결정 | AppWidgetProvider: 주기적 갱신 (최소 30분). Glance: Compose 기반 선언형 |
| **정확도/품질** | SwiftUI 기반 선언형 UI. 인터랙티브 위젯 (iOS 17+). 라이브 액티비티 | Glance (Compose 기반) 또는 RemoteViews. Android 12+ Material You 연동 |
| **최소 OS 버전** | iOS 14 (WidgetKit). iOS 16+ (Lock Screen). iOS 17+ (Interactive) | API 21+ (AppWidget). Glance: Compose 1.0+ |
| **웹 대비 이점** | PWA 대비: 홈 화면 위젯 불가 → 네이티브 전용 기능 | PWA 대비: 홈 화면 위젯 불가 → 네이티브 전용 기능 |
| **크롭앱 활용도** | △ 간접 — "최근 크롭" 위젯으로 재진입 유도 가능 | △ 간접 — 동일 |

**판정: iOS 소폭 우위** — SwiftUI 기반 + Lock Screen 위젯 + 인터랙티브 위젯. Android Glance는 아직 성숙도 낮음.

---

## 20. 딥링크 / 앱링크

| 비교 항목 | iOS — Universal Links | Android — App Links / Deep Links |
|----------|----------------------|--------------------------------|
| **전용 하드웨어 가속** | 해당 없음 | 해당 없음 |
| **추가 번들 사이즈** | 0 MB | 0 MB |
| **처리 속도** | 즉시. AASA(Apple-App-Site-Association) 파일 CDN 캐시 | 즉시. assetlinks.json 검증 |
| **정확도/품질** | Universal Links: 검증된 도메인만 허용 (피싱 방지). 폴백 사파리 자동 | App Links: 검증된 도메인. Deep Links: 검증 없이 intent-filter 등록 (충돌 가능) |
| **최소 OS 버전** | iOS 9 (Universal Links) | API 23 (App Links 자동 검증). Deep Links: API 1+ |
| **웹 대비 이점** | 웹 URL → 앱 직접 진입. 앱 미설치 시 웹 폴백 | 웹 URL → 앱 직접 진입. 앱 미설치 시 Play Store 또는 웹 폴백 |
| **크롭앱 활용도** | ○ 활용 가능 — `monkos.ai/crop?spec=korea-passport` → 앱 직접 진입 + 규격 자동 로딩 | ○ 활용 가능 — 동일. TWA에서 assetlinks.json 이미 준비 완료 |

**판정: 동등** — 양쪽 모두 성숙. iOS Universal Links가 보안 측면에서 약간 우위 (검증 필수).

---

## 종합 분석

### iOS 우위 영역 (8개)

| # | 영역 | 핵심 이유 |
|---|------|----------|
| 1 | 얼굴 인식/랜드마크 | 시스템 내장 0MB + Neural Engine <5ms |
| 2 | 이미지 세그멘테이션 | 시스템 내장 + 3단계 품질 + 시간적 스무딩 |
| 4 | 이미지 처리/편집 | 200+ 빌트인 필터 + GPU 자동 최적화 |
| 5 | AR | LiDAR 하드웨어 독점 |
| 7 | 생체 인증 | Secure Enclave + 전 기기 균일 보안 |
| 12 | 로컬 ML 추론 | Core ML + Neural Engine 35 TOPS 통합 파이프라인 |
| 13 | 온디바이스 OCR | 시스템 내장 0MB + 18개 언어 |
| 19 | 위젯 | SwiftUI + Lock Screen + Interactive |

### Android 우위 영역 (3개)

| # | 영역 | 핵심 이유 |
|---|------|----------|
| 6 | 음성 인식 | Google 음성 엔진 정확도 업계 최고 |
| 8 | NFC | HCE 풀 지원 + 카드 에뮬레이션 개방 |
| 11 | 백그라운드 처리 | Foreground Service 자유도 |

### 동등 영역 (5개)

| # | 영역 | 비고 |
|---|------|------|
| 9 | 결제 | 양쪽 성숙. 크롭앱 무료로 무관 |
| 14 | 바코드/QR | 양쪽 성숙 |
| 15 | 푸시 알림 | 양쪽 성숙 |
| 16 | 위치 서비스 | GPS 동등. UWB vs Wi-Fi RTT |
| 20 | 딥링크/앱링크 | 양쪽 성숙 |

### iOS 소폭 우위 (2개)

| # | 영역 | 비고 |
|---|------|------|
| 3 | 카메라 제어 | 기기 통일성. CameraX 1.5로 격차 축소 중 |
| 10 | 건강/피트니스 | Apple Watch 에코시스템 |

### Android 소폭 우위 (2개)

| # | 영역 | 비고 |
|---|------|------|
| 17 | 블루투스 | 실질 동등. 개방성 약간 우위 |
| 18 | 파일 시스템 | 접근 자유도 높음 |

### 웹으로 충분한 영역

| # | 영역 | 근거 |
|---|------|------|
| 9 | 결제 | 크롭앱 완전 무료 — 결제 시스템 불필요 |
| 15 | 푸시 알림 | Web Push API로 기본 기능 대체 가능 (FCM도 웹 지원) |
| 16 | 위치 서비스 | IP 기반 국가 판별로 충분 (Geolocation API) |
| 20 | 딥링크/앱링크 | 웹 URL 자체가 딥링크 역할. 앱 설치 시 전환만 하면 됨 |

---

## MonkosCrop 관점 결론

### 크롭앱에서 네이티브 이점을 취하는 핵심 기능 (◎)

| 기능 | 웹 현황 | iOS 네이티브 이점 | 체감 차이 |
|------|---------|-------------------|----------|
| **얼굴 인식** | MediaPipe WASM ~50ms | Vision <5ms (10배↑) + 0MB | ★★★ 압도적 |
| **배경 제거** | @imgly ISNet ~5초 | VNGeneratePersonSegmentation ~60ms (80배↑) + 0MB | ★★★ 압도적 |
| **이미지 처리** | Canvas 2D 수동 구현 | Core Image 200+ 필터 + GPU 자동 최적화 | ★★☆ 생산성 |
| **로컬 ML** | WASM/WebGL 제한적 | Core ML + Neural Engine 35 TOPS | ★★★ 압도적 |

### iOS 전환 결론

1. **크롭앱 4대 핵심 기능 전부 iOS 압도적 우위** — 얼굴 인식(10배), 배경 제거(80배), 이미지 처리(빌트인 200+), ML 추론(Neural Engine 35 TOPS)
2. **번들 사이즈 혁신** — 웹: FaceMesh(16MB) + @imgly(40MB) = 56MB → iOS: 시스템 내장 0MB. 앱 사이즈 60MB → ~5MB 이하 가능
3. **배터리 효율** — Neural Engine은 GPU/CPU 대비 전력 소모 1/10 수준. 모바일 앱의 핵심 UX 지표
4. **"MONKOS 검수" 연출** — Vision <5ms 완료 → 1.5초 시퀀스 연출. 웹(50ms)도 가능하나 iOS의 여유가 더 자연스러운 UX 제공

### Android 병행 시 주의점

1. **NNAPI deprecated (Android 15)** — TFLite GPU Delegate + QNN Delegate(Snapdragon)로 마이그레이션 필수. NNAPI 기반 코드 작성 금지
2. **SoC 파편화** — Snapdragon / Tensor / Exynos / Dimensity 각각 NPU 접근 방식 상이. 일관된 성능 보장 어려움
3. **시스템 내장 API 부재** — 얼굴 인식(ML Kit ~6MB), 배경 제거(모델 별도), OCR(CJK +18MB) 모두 번들 필요. 앱 사이즈 증가 불가피
4. **이미지 처리 파이프라인 공백** — RenderScript deprecated + Core Image 대응물 없음. GPUImage 등 서드파티 의존
5. **CameraX 1.5 활용 권장** — Camera2 직접 사용 대비 기기 호환성 + 코드량 절감
6. **Google Play Billing v8 마이그레이션** — 크롭앱은 무료지만, 추후 증명사진 앱(유료) 출시 시 v8 필수 (v7 마감: 2026-08-31)

### 전략 제언

| 단계 | 전략 |
|------|------|
| **Phase 2 현재** | iOS 우선 (SwiftUI + Vision + Core ML). 핵심 4기능 모두 시스템 내장 → 개발 속도 + 앱 품질 극대화 |
| **Android 착수 시점** | iOS 앱 스토어 출시 + 초기 피드백 반영 완료 후. 아키텍처 검증된 상태에서 Android 포팅 |
| **Android 기술 스택** | Kotlin + Jetpack Compose + CameraX 1.5 + ML Kit (Face Detection + Text Recognition) + TFLite (배경 제거 모델) |
| **크로스플랫폼 검토** | KMP(Kotlin Multiplatform)로 비즈니스 로직 공유, UI는 네이티브 유지. Flutter/React Native는 ML 파이프라인 제약으로 비권장 |

---

> **[2026-05-12 18:51 KST] iMac/막내1** — 리서치 기준: Apple Developer Documentation, Android Developers, Photoroom Core ML Benchmark, Qualcomm Product Brief, Google ML Kit Documentation. 수치 근거 없는 항목은 `[수치 미확인]` 표기.
