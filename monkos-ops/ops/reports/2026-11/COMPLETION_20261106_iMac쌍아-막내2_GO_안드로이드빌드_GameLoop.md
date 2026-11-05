---
type: completion
date: 2026-11-06
device: iMac
agent: 쌍아-막내2
status: 진행
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내2_GO_안드로이드빌드_GameLoop.md
---

# COMPLETION — MONKOS Go 안드로이드 빌드 v0 (KataGo Eigen + Game Loop APK)

**[2026-11-06 06:11 KST]** iMac/쌍아-막내2 → iMac/쌍아(세션2)

출처: 작가님 2026-11-06 05:51 iMac/쌍아 세션 사람 턴 "안드로이드도 빌드해" → 쌍아 지시서(위 order). FTL 한도 지침: 쌍아 06:02(오늘 안드로이드 실기기는 0대, 가상은 별도로 50분 가드).

## 요약
- ✅ 1~3단계 완료: 툴체인 → KataGo arm64 빌드 → 래퍼 APK(18.6MB) → **FTL 가상 기기 Game Loop Passed 2회**(logFile·결과 JSON·캡처 3장 회수).
- ⏳ 4단계 실기기(A05s·A15·S24)는 **내일로 넘김.** 오늘 실기기 원장이 24/25분이다(막내8 iOS 사용). 안드로이드 실기기는 0분 썼다.
- 유료 0. 가상 6분/50분 사용.

## 1. 툴체인 (0단계) — 사용자 홈에만
| 도구 | 버전 | 위치 |
|---|---|---|
| JDK | Temurin 17.0.21 | `~/.monkos/go_android/toolchain/jdk-17.0.21+9` |
| Android SDK | cmdline-tools 11076708 · platform 34 · build-tools 34.0.0 · platform-tools | `…/toolchain/sdk` |
| NDK | 26.3.11579264 | `…/sdk/ndk/` |
| CMake·Ninja | 3.22.1(SDK) | `…/sdk/cmake/` |
| Gradle | 8.7(AGP 8.5.2·Kotlin 1.9.24) | `…/toolchain/gradle-8.7`, 캐시 `…/toolchain/gradle-home` |
| Eigen | 3.4.0(헤더) | `…/toolchain/eigen-3.4.0` |
- sudo·Homebrew·전역 설정은 쓰지 않았다. 디버그 키스토어는 `ANDROID_USER_HOME=~/.monkos/go_android/android-user`에 있다(`~/.android` 미사용).
- 재현: `AI_Factory/go_android_bench/setup_toolchain.sh`(이미 있으면 건너뜀). 용량은 `~/.monkos/go_android` 5.9GB.

## 2. KataGo 빌드 (1단계)
| ABI | 크기(strip) | 형식 | 의존 |
|---|---|---|---|
| arm64-v8a | 7.5MB | PIE 실행 파일, c++ 정적 | libz·libm·libdl·libc(안드로이드 기본) |
| x86_64 | 8.2MB | 같음 | 같음 |
- KataGo 1.18.2(`~/.monkos/katago/src`, 소스 무수정). 옵션: `-DUSE_BACKEND=EIGEN -DNO_LIBZIP=1 -DNO_GIT_REVISION=1 -DANDROID_PLATFORM=android-26 -DANDROID_STL=c++_static`.
- 막힌 곳 1건: `core/sha2.cpp`가 `BYTE_ORDER`를 요구해 실패했다. `-DCMAKE_CXX_FLAGS="-include endian.h"`(bionic 헤더 선포함)로 해결했다.
- 실행 권한 우회: `libkatago.so` 이름으로 `jniLibs/<ABI>`에 넣고 `useLegacyPackaging=true`(extractNativeLibs)로 설치기가 `nativeLibraryDir`(실행 허용)에 풀게 했다. 가상 기기 Android 14에서 exec가 되는 것을 확인했다.

## 3. 래퍼 APK (2단계) — `AI_Factory/go_android_bench/app/`
- `ai.monkos.go.bench` 디버그 APK **18.6MB**. 내용: dex 2.3MB · arm64 7.5MB · x86_64 8.2MB · 모델 11.0MB(b10 `monk_b10_s83M`) · 라이선스 고지 3개(KataGo MIT·Eigen MPL2·NOTICE).
- Game Loop 인텐트(TEST_LOOP)로 시작하면 자동 실행한다: 벤치 → logFile JSON → 캡처 3장 → 종료. 손으로 열면 `벤치 실행` 버튼으로 같은 벤치를 돈다.
- 벤치는 iOS와 같은 표본 대국으로, 빈 판·100수·200수 × (1500 visits / 2초 자동 = maxTime 2)이다.
  - visits는 `kata-genmove_analyze … rootInfo true`의 rootInfo에서 읽고, 시간은 벽시계로 잰다.
  - 스레드 = 코어 수(numSearchThreads·numEigenThreadsPerModel·nnMaxBatchSize).
- 막힌 곳 2건:
  1. aapt가 `.gz` 애셋 이름을 바꿔 넣었다(`model.bin.gz` → `assets/model.bin`). 애셋 이름을 `model_bin_gz.dat`로 바꾸고, 기기에서 `model.bin.gz`로 복사하게 했다.
  2. 착점 칸에 `-0.494006`이 들어갔다. 원인은 정규식 `play (\S+)`가 info 줄의 `scoreSelfplay -0.42…`에 걸린 것이다. "play "로 시작하는 줄만 읽게 고쳐 2차 실행에서 Q16·N2·N18로 확인했다.

## 4. FTL 가상 기기 스모크 (3단계)
- `ftl.sh run android` 추가(막내8 함수와 분리, 디스패치 1줄 분기).
  - 가상은 원장 `virtual_minutes`·가드 50분, 실기기는 기존 `minutes`·25분으로 따로 건다.
  - 가상과 실기기를 섞으면 거부한다(음성 시험 확인). 회수는 `ftl.sh fetch-android`.
- 실행 2회 모두 **Passed**(MediumPhone.arm · Android 14 · arm64-v8a · 4코어, 기기당 상한 3분). 결과 `~/.monkos/device_lab/results/20261106_060843_android/`(2차).

| 국면 | 방식 | 시간(초) | visits | visits/초 | 착점 |
|---|---|---|---|---|---|
| 빈 판 | 1500v | 7.78 | 1503 | 193 | Q16 |
| 빈 판 | 2초 자동 | 2.03 | 441 | 218 | Q16 |
| 100수 | 1500v | 7.15 | 1503 | 210 | N2 |
| 100수 | 2초 자동 | 2.02 | 411 | 203 | N2 |
| 200수 | 1500v | 6.45 | 1502 | 233 | N18 |
| 200수 | 2초 자동 | 2.02 | 431 | 213 | J16 |
- 모델 적재 0.5초. 1차 실행은 1500v 6.6~8.9초(첫 수 예열 영향)였다.
- ⚠ 가상 기기는 ARM 호스트 위 에뮬레이터라서 **휴대폰 속도의 대리값이 아니다.** 도구 사슬이 동작하는지 확인한 값이다.
- 캡처: `…/artifacts/sdcard/Android/data/ai.monkos.go.bench/files/screenshots/{1_start,2_after_1500v,3_end}.png`. 기종·Android 버전·단계가 찍혀 있다. 같은 캡처의 축소 JPEG가 logFile 안에도 있다(`parse_result.py`가 `shots/`로 푼다).

## 5. 다음 (4단계 — 내일)
```bash
AI_Factory/device_lab/ftl.sh usage      # 실기기 잔여 확인 — 3대 × 3분 = 9분 필요
AI_Factory/device_lab/ftl.sh run android --models a05s:35,a15:34,e1q:34 --apk ~/.monkos/go_android/apk/monk-go-bench-debug.apk --timeout 3m
```
- 기종 ID(11-06 목록 실측): A05s `a05s`(35) · A15 `a15`(34) · S24 `e1q`(34, 스냅드래곤) / `e1s`(36, 엑시노스).
- 저가기(A05s) 1500v가 3분 상한에 걸리면 벤치를 줄여야 한다(예: 1500v 국면 1개 + 2초 자동 3개). 가상 기준 전체 벤치는 약 40초다.

## 6. 산출물
| 파일 | 역할 |
|---|---|
| `AI_Factory/go_android_bench/env.sh` | 툴체인 환경 변수(source용) |
| `setup_toolchain.sh` | JDK·SDK·NDK·CMake 설치(홈) |
| `build_katago.sh [ABI]` | KataGo Eigen 크로스 빌드 → `out/<ABI>/libkatago.so` |
| `prep_assets.py [모델]` | 모델·gtp.cfg·벤치 수순·라이선스 → `assets/` |
| `build_apk.sh` | Gradle 디버그 APK → `apk/monk-go-bench-debug.apk` |
| `app/` | Kotlin 앱 소스(Gradle, 빌드 폴더는 레포 밖) |
| `parse_result.py` | 결과 → 속도 표 + 캡처 풀기 |
| `AI_Factory/device_lab/ftl.sh` | `run android`·`fetch-android`·가상 가드 추가 |
- APK·SDK·모델·빌드물은 커밋하지 않았다(레포 밖 `~/.monkos/go_android/`).

## 완료 보고
- ✅ 툴체인(홈만) · KataGo Eigen arm64/x86_64 · 래퍼 APK 18.6MB(라이선스 고지 포함)
- ✅ FTL 가상 Game Loop Passed ×2 — logFile·캡처 3장 회수, 1500v 6.5~7.8초(가상, 대리값 아님)
- ✅ ftl.sh 안드로이드 실행·회수·가상/실기기 분리 가드(혼합 거부 음성 시험)
- ⏳ 실기기 A05s·A15·S24 — 오늘 실기기 원장 24/25분이라 내일
- ❌ 없음 · 유료 0 · 가상 6/50분
