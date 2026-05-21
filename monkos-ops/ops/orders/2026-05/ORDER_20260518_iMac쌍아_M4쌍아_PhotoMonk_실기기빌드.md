---
type: order
date: 2026-05-18
from: iMac/쌍아
to: M4/쌍아
status: 발행
portfolio: PF_IDPHOTO
---

# 지시서: PhotoMonk 실기기 빌드 + 설치

## 상황

- `apps/PhotoMonk/` — Vision 실시간 코칭 PoC (1,151줄, 5파일)
- M4에서 iOS Simulator 빌드 성공 확인됨
- SSH에서 devicectl 설치 실패 (sandbox 제한) → Xcode GUI 필요
- iPhone 17 Pro USB 연결 완료 (3AE3A741-9156-5734-A7CE-92D0A6A3DFEE)

## 임무

### 1. Xcode 프로젝트 생성 (SPM → xcodeproj)

Package.swift 기반이라 Xcode 프로젝트 파일이 없음. 두 가지 방법 중 택1:

**방법 A**: Xcode → File → Open → `~/developer/monk_project/apps/PhotoMonk/Package.swift` 직접 열기 (SPM 프로젝트로 인식)

**방법 B**: xcodeproj 필요 시 생성
```bash
cd ~/developer/monk_project/apps/PhotoMonk
swift package generate-xcodeproj
```

### 2. 서명 설정

- Team: `ZPMVHPDUHW` (MONK STUDIO)
- Bundle ID: `ai.monkos.photomonk`
- Signing: Automatically manage signing 활성화

### 3. 권한 설정 (Info.plist)

카메라 + 마이크(TTS) 권한 필요:
```
NSCameraUsageDescription: "증명사진 촬영을 위해 카메라 접근이 필요합니다"
NSMicrophoneUsageDescription: "음성 안내를 위해 마이크 접근이 필요합니다"
```

SPM 프로젝트에서 Info.plist 미존재 시 Xcode → Target → Info 탭에서 직접 추가.

### 4. 빌드 + 실행

- Destination: **iPhone 17 Pro** (실기기)
- ▶ Run
- 카메라 권한 팝업 → 허용

### 5. 테스트 항목

| 항목 | 확인 |
|------|------|
| 카메라 프리뷰 표시 | 전면 카메라 정상 |
| Vision 랜드마크 오버레이 | 눈/코/턱 도트 + 타원 가이드 |
| 코칭 메시지 | 우선순위 순서대로 1개씩 |
| 카메라 각도 감지 | 폰 아래에서 올려봤을 때 "눈높이로" |
| 조명 감지 | 어두운 곳에서 "조명이 어둡습니다" |
| 🟢 전항목 통과 | "좋아요, 촬영합니다" 시퀀스 시작 |
| 3,2,1 카운트다운 | 숫자 오버레이 + TTS |
| 자동 촬영 | 플래시 + 셔터음 + 프리뷰 |
| 시퀀스 중단 | 카운트다운 중 얼굴 돌리면 Phase 2 복귀 |
| TTS 음성 | 한국어 자연스러움 |

### 6. 결과 보고

- 각 테스트 항목 PASS/FAIL
- 문제 발견 시 스크린샷 또는 상세 기술
- 커밋 (서명/plist 변경 있으면)

## ⚠️ 준수 조항

- IDPASS(MonkosCrop) 수정 금지
