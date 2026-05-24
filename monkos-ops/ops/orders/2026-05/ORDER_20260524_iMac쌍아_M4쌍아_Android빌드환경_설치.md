---
type: order
date: 2026-05-24
from: iMac/쌍아
to: M4/쌍아
subject: IDPASS Android 빌드 환경 M4 설치 + release AAB 준비
status: 대기
portfolio: PF_CROP
---

# 지시서: Android 빌드 환경 M4 설치 + release AAB 준비

**[2026-05-24 13:17 KST] iMac/쌍아 → M4/쌍아**

---

## 배경

IDPASS Android 앱을 4060(Windows)에서 개발해왔으나, macOS 통일 (iMac/M4) 체제로 이관한다.
- Windows ↔ macOS 디자인 렌더링 차이, SSH 소통 불안정, 한글 처리 등 마찰 해소
- iOS + Android 모두 macOS에서 빌드 가능한 환경 구축
- 작가님 직접 지시 (2026-05-24)

---

## 1. Android 개발 환경 설치

### 1-1. Android Studio 설치
- Android Studio (최신 stable) 다운로드 + 설치
- Apple Silicon (arm64) 버전 확인

### 1-2. SDK 설정
- compileSdk 35 / minSdk 24 / targetSdk 35 (현행 build.gradle.kts 기준)
- Build Tools, Platform Tools 설치
- Java 17 (Android Studio 번들 JDK 사용)

### 1-3. 프로젝트 빌드 확인
```bash
cd ~/developer/monk_project/apps/idpass-android
./gradlew assembleDebug
```
- 빌드 성공 여부 보고
- 에러 발생 시 해결 후 재빌드

---

## 2. Release Keystore 생성

4060 보고서 기준 keystore 미생성 상태. M4에서 생성한다.

```bash
keytool -genkey -v \
  -keystore idpass-release.keystore \
  -alias idpass \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

⚠️ **keystore 비밀번호, alias 비밀번호는 작가님께 확인 후 설정할 것. 임의 생성 금지 (헌법 4조 1항).**
- 생성 후 keystore 파일 경로 보고
- keystore를 Git에 커밋하지 말 것 (.gitignore 확인)

---

## 3. Release AAB 빌드 테스트

keystore 생성 후:

### 3-1. build.gradle.kts에 signingConfigs 추가
```kotlin
signingConfigs {
    create("release") {
        storeFile = file("../idpass-release.keystore")
        // 비밀번호는 local.properties 또는 환경변수에서 읽기
    }
}
```

### 3-2. AAB 빌드
```bash
./gradlew bundleRelease
```

- 빌드 성공 여부 + AAB 파일 경로 보고

---

## 4. 보고 사항

| 항목 | 보고 내용 |
|------|----------|
| Android Studio 버전 | 설치된 버전 |
| SDK 버전 | 설치된 API 레벨 |
| debug 빌드 | 성공/실패 |
| keystore | 생성 여부 (비밀번호 보고 금지) |
| release AAB | 빌드 성공/실패 |

---

## ⚠️ 준수 조항
- 헌법 4조 1항: keystore 비밀번호 임의 생성/추측 금지. 작가님 확인 필수.
- 헌법 3조 1항: 타임스탬프 `date` 실측 필수
- .keystore 파일 Git 커밋 금지

---

## 산출물
1. Android 빌드 환경 설치 완료
2. debug 빌드 성공 확인
3. keystore 관련 작가님 확인 요청 (비밀번호)
4. COMPLETION 보고서
5. 커밋 + 푸시
