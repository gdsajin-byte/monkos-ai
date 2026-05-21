---
type: order
date: 2026-05-21
from: iMac/쌍아
to: M4/쌍아
subject: "IDPASS TestFlight 빌드 + 업로드"
status: 대기
portfolio: PF_CROP
---

# 지시서: IDPASS TestFlight 빌드 + 업로드

> **[2026-05-21 16:51 KST] iMac/쌍아 → M4/쌍아**

## 배경

IDPASS 앱 대규모 업데이트 완료 (데이터 320문서, 비율왜곡 근본수정, 떙큐 C3 등). TestFlight에 올려서 실기기 검증 필요.

리포는 최신 상태 (`git pull` 완료). Xcode 26.5 확인됨.

## 문제

Xcode 프로젝트(pbxproj)에 **2개 Swift 파일이 미등록**:

- `LandingView.swift` — 랜딩 페이지
- `DemoAnimation.swift` — 랜딩 데모 애니메이션

현재 등록된 파일 (5개):
```
MonkosCropApp.swift ✅
ContentView.swift ✅
SpecData.swift ✅
CropView.swift ✅
CropEngine.swift ✅
LandingView.swift ❌ 미등록
DemoAnimation.swift ❌ 미등록
```

## 작업 순서

### 1. Xcode에서 파일 추가

```
MonkosCrop.xcodeproj 열기
→ 좌측 네비게이터에서 MonkosCrop 그룹 우클릭
→ Add Files to "MonkosCrop"
→ LandingView.swift, DemoAnimation.swift 선택
→ Target: MonkosCrop 체크 확인
→ Add
```

### 2. 리소스 파일 확인

`Resources/` 폴더 내 새로 추가된 파일이 타겟에 포함되는지 확인:
- `slider_before.jpg` — 떙큐 Before 이미지
- `slider_after.jpg` — 떙큐 After 이미지

Xcode 네비게이터에서 Resources 그룹에 없으면 동일하게 Add Files.

### 3. Archive 빌드

```bash
cd ~/developer/monk_project/apps/MonkosCrop
xcodebuild -project MonkosCrop.xcodeproj \
  -scheme MonkosCrop \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /tmp/MonkosCrop.xcarchive \
  archive
```

### 4. TestFlight 업로드

```bash
xcodebuild -exportArchive \
  -archivePath /tmp/MonkosCrop.xcarchive \
  -exportPath /tmp/MonkosCropExport \
  -exportOptionsPlist ~/developer/monk_project/apps/MonkosCrop/ExportOptions.plist

# 또는 Xcode Organizer에서 Distribute App → TestFlight
```

ExportOptions.plist가 없으면 Xcode Organizer(Window → Organizer) GUI로 업로드.

### 5. 빌드 번호

현재 빌드 번호 확인 후 +1 증가 필요:
```bash
grep MARKETING_VERSION MonkosCrop.xcodeproj/project.pbxproj | head -2
grep CURRENT_PROJECT_VERSION MonkosCrop.xcodeproj/project.pbxproj | head -2
```

## 완료 기준

1. Archive 빌드 성공
2. TestFlight 업로드 완료
3. App Store Connect에서 "Processing" → "Ready to Test" 확인
4. 작가님 아이폰에서 TestFlight 앱 업데이트 알림

## ⚠️ 참고

- 번들 ID: `ai.monkos.MonkosCrop` (변경 없음)
- 팀: Apple Developer (W1803588193)
- 인증서: "Apple Development: JeongKyu Shin (Q63WT2V55B)" 확인됨
- Distribution 인증서가 별도 필요할 수 있음 (5/13에 생성한 이력 있음)
