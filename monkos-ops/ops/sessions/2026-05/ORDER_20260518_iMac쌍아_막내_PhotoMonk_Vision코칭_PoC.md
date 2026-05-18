---
type: order
date: 2026-05-18
from: iMac/쌍아
to: 막내
status: 발행
portfolio: PF_IDPHOTO
---

# 지시서: PhotoMonk — Apple Vision 실시간 코칭 PoC

## 배경

MONKOS 증명사진 앱(잠정명 **PhotoMonk**)을 독립 iOS 네이티브 앱으로 개발.
현재 웹 증명앱의 Gemini Live 코칭을 **Apple Vision 온디바이스**로 대체하는 PoC를 구축한다.

- Gemini Live: API 비용 + 레이턴시 + 6/1 모델 shutdown 리스크
- Apple Vision: 비용 제로 + 레이턴시 제로 + 오프라인 동작

IDPASS(크롭앱)와는 **별도 프로젝트**. IDPASS 코드를 참조할 수 있으나 IDPASS를 수정하지 않는다.

## 임무

### 1. 프로젝트 생성

- 경로: `apps/PhotoMonk/`
- SwiftUI + Swift Package (Package.swift 기반)
- 최소 타겟: iOS 17.0
- 번들 ID: `ai.monkos.photomonk` (잠정)

### 2. 카메라 프리뷰 + Vision 실시간 분석

| 항목 | 구현 |
|------|------|
| 카메라 | AVCaptureSession, 전면 카메라 기본 |
| Vision 요청 | VNDetectFaceLandmarksRequest (76pt) |
| 프레임 레이트 | 초당 10~15프레임 분석 (매 프레임 불필요) |
| 얼굴 바운딩박스 | 실시간 오버레이 표시 |

### 3. 코칭 규칙 엔진

Vision 데이터로 아래 규칙 판단 → 화면에 텍스트 가이드 표시:

| 규칙 | Vision 데이터 | 조건 | 가이드 메시지 |
|------|-------------|------|-------------|
| 얼굴 없음 | face count == 0 | — | "얼굴이 보이지 않습니다" |
| 다수 얼굴 | face count > 1 | — | "한 명만 촬영해주세요" |
| 중앙 이탈 | bbox center vs frame center | 오차 > 15% | "얼굴을 중앙으로 이동해주세요" |
| 너무 멀리 | bbox 높이 / frame 높이 | < 30% | "카메라에 좀 더 가까이" |
| 너무 가까이 | bbox 높이 / frame 높이 | > 70% | "조금 뒤로 물러나주세요" |
| 좌우 회전 (yaw) | faceLandmarks yaw 추산 | > 15° | "정면을 봐주세요" |
| 상하 기울기 (pitch) | 눈-턱 각도 변화 | > 10° | "턱을 살짝 올려/내려주세요" |
| 좌우 기울기 (roll) | 양 눈 높이 차이 | > 5° | "고개를 바르게 해주세요" |
| 눈 감김 | 눈 랜드마크 상하 간격 | < threshold | "눈을 떠주세요" |

### 4. 코칭 UI

- 카메라 프리뷰 전체 화면
- 상단: 현재 가이드 메시지 (텍스트, 큰 폰트)
- 중앙: 얼굴 가이드 프레임 (타원형 오버레이)
- 하단: 상태 표시 (🔴 교정 필요 / 🟡 거의 완료 / 🟢 촬영 가능)
- 전 항목 🟢 시 자동 촬영 또는 촬영 버튼 활성화

### 5. 음성 안내 (선택)

- AVSpeechSynthesizer로 가이드 메시지 TTS
- 같은 메시지 반복 방지 (3초 쿨다운)
- 한국어 기본, 일본어/영어 분기 가능 구조

### 6. 테스트 항목

| 항목 | 방법 |
|------|------|
| 정면 인식 정확도 | 정면/15°/30°/45° 각도별 테스트 |
| 반응 속도 | 자세 변경 → 가이드 표시까지 체감 |
| 조명 민감도 | 밝은/어두운/역광 환경 |
| 배터리 소모 | 10분 연속 사용 |

## 산출물

- `apps/PhotoMonk/` 프로젝트 (빌드 가능 상태)
- 테스트 결과 포함 완료 보고서
- macOS에서 swift build 가능 + M1/M4에서 iOS 빌드 가능 상태

## ⚠️ 준수 조항

- IDPASS(apps/MonkosCrop/) 코드 수정 금지. 참조만 허용
- AI API 호출 없음 — 순수 온디바이스 Vision만
- 완료 후 세션 로그 어펜드 + 커밋
