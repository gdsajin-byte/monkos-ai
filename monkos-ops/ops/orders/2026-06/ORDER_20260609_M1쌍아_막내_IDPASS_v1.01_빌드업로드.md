---
type: order
date: 2026-06-09
device: M1
agent: 쌍아
recipient: 막내
portfolio: PF_CROP
status: 발행
priority: 1
---

# IDPASS v1.01 빌드 + App Store Connect 업로드

**[2026-06-09 12:00 KST] M1/쌍아 → 막내**

## 배경

- IDPASS 증명사진 v1.0 출시 중 (READY_FOR_SALE, 5/29~)
- ASC에 v1.01 제출 준비 완료: 6.9" 스크린샷 8장 + 15개 언어 메타데이터 전부 업데이트됨
- **빌드만 미등록** — Archive → 업로드 필요
- 계약 동의 완료 (작가님 6/9 처리)

## 작업

### 1단계: 버전 업데이트

**파일**: `apps/MonkosCrop/MonkosCrop.xcodeproj/project.pbxproj`

- `MARKETING_VERSION` = `1.0` → `1.01` (ASC 버전과 일치시킬 것)
- `CURRENT_PROJECT_VERSION` = `4` → `5`
- Debug/Release 양쪽 모두 변경 (총 2곳씩)

### 2단계: Release 빌드 확인

```bash
xcodebuild -project apps/MonkosCrop/MonkosCrop.xcodeproj \
  -scheme MonkosCrop \
  -destination 'generic/platform=iOS' \
  -configuration Release \
  clean build
```

**BUILD SUCCEEDED** 확인 후 다음 단계.

### 3단계: Archive

```bash
xcodebuild -project apps/MonkosCrop/MonkosCrop.xcodeproj \
  -scheme MonkosCrop \
  -destination 'generic/platform=iOS' \
  -configuration Release \
  -archivePath /tmp/IDPASS_1.01.xcarchive \
  archive
```

### 4단계: Export IPA

ExportOptions.plist 생성 후 export:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>ZPMVHPDUHW</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

```bash
xcodebuild -exportArchive \
  -archivePath /tmp/IDPASS_1.01.xcarchive \
  -exportOptionsPlist /tmp/ExportOptions.plist \
  -exportPath /tmp/IDPASS_1.01_export
```

### 5단계: ASC 업로드

```bash
xcrun altool --upload-app \
  -f /tmp/IDPASS_1.01_export/IDPASS.ipa \
  -t ios \
  --apiKey <API_KEY> \
  --apiIssuer <ISSUER_ID>
```

> API Key 없으면 Xcode Organizer GUI 또는 `xcrun altool --upload-app -u <AppleID> -p <앱비밀번호>` 사용.
> **API 키/비밀번호 모르면 작가님에게 질문할 것 (헌법 4조 1항).**

### 6단계: 검증

- ASC에서 빌드 처리 완료 확인 (보통 5~15분 소요)
- v1.01 버전에 빌드 선택 가능한지 확인
- 작가님에게 빌드 선택 + 심사 제출 요청 보고

## 기술 참조

| 항목 | 값 |
|------|---|
| 프로젝트 경로 | `apps/MonkosCrop/MonkosCrop.xcodeproj` |
| 번들 ID | `ai.monkos.MonkosCrop` |
| 팀 ID | `ZPMVHPDUHW` |
| 서명 인증서 | Apple Distribution: JeongKyu Shin (ZPMVHPDUHW) |
| Xcode | 26.5 (17F42) — M1 설치 확인됨 |
| 타겟 | iPhone 전용 (TARGETED_DEVICE_FAMILY=1) |
| 현재 빌드 테스트 | Release BUILD SUCCEEDED 확인 (6/9 쌍아) |

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키/비밀번호 생성·추측 금지. 모르면 질문
- ch6: 커밋 메시지 `[ops] IDPASS v1.01 빌드 — ASC 업로드` 형식

## 완료 보고

- COMPLETION 생성 → `monkos-ops/ops/completions/2026-06/`
- ASC 빌드 번호, 업로드 성공 여부 기록
- PF_CROP 히스토리 1행 어펜드
- 커밋 → 푸시
