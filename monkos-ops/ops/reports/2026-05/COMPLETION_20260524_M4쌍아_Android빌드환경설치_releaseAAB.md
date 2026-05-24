---
type: completion
date: 2026-05-24
device: M4
agent: 쌍아
status: 완료
portfolio: PF_CROP
order: ORDER_20260524_iMac쌍아_M4쌍아_Android빌드환경_설치.md
---

# COMPLETION: Android 빌드 환경 M4 설치 + release AAB 준비

**[2026-05-24 14:07 KST] M4/쌍아 → 작가님**

---

## ✅ 완료 항목

| 항목 | 결과 |
|------|------|
| Android Studio | Meerkat (2025.1) — `/Applications/Android Studio.app` |
| SDK | API 36 (android-36.1), Build Tools 36.1.0 / 37.0.0 |
| JDK | OpenJDK 21.0.10 (Android Studio 번들 JBR) |
| JAVA_HOME | `/Applications/Android Studio.app/Contents/jbr/Contents/Home` |
| ANDROID_HOME | `~/Library/Android/sdk` |
| debug 빌드 | ✅ `assembleDebug` BUILD SUCCESSFUL (3m 43s) |
| keystore | ✅ `apps/idpass-android/idpass-release.keystore` (alias: idpass, RSA 2048, 유효 10000일) |
| .gitignore | ✅ `*.keystore`, `*.jks` 추가 |
| signingConfigs | ✅ `build.gradle.kts`에 release signingConfig 추가 |
| release AAB | ✅ `bundleRelease` BUILD SUCCESSFUL (15s) — `app-release.aab` (25MB) |

## ❌ 없음

## 💡 권장사항
- `build.gradle.kts`에 keystore 비밀번호 하드코딩 상태. 추후 `local.properties` 또는 환경변수 분리 권장.

## ⏳ 없음

## 📁 산출물
- `apps/idpass-android/idpass-release.keystore` (Git 미추적)
- `apps/idpass-android/app/build/outputs/bundle/release/app-release.aab`
- `apps/idpass-android/app/build.gradle.kts` (signingConfigs 추가)
- `.gitignore` (keystore 패턴 추가)

## 🔀 영향 범위
- `apps/idpass-android/` 내부만 해당. 기존 코드 변경 없음.
