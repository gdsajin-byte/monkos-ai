---
type: order
date: 2026-11-06
from: iMac/쌍아
to: iMac/쌍아-막내2
subject: MONKOS Go 안드로이드 빌드 v0 — KataGo CPU(Eigen) arm64 + Game Loop 래퍼 APK → FTL 가상 기기 스모크 → 저가 갤럭시 실기기 실측(무료 한도 안)
status: 대기
portfolio: PF_GO
---

# ORDER — 안드로이드 빌드 v0 (Game Loop APK)

**[2026-11-06 05:51 KST]** iMac/쌍아 → iMac/쌍아-막내2

출처: 작가님 2026-11-06 05:51 iMac/쌍아 세션 사람 턴 "안드로이드도 빌드해". 선행 조사: `monkos-ops/ops/reports/2026-11/COMPLETION_20261106_iMac쌍아-막내8_GO_실기기테스트_FTL도구.md`(안드로이드 경로 조사 — 공식 빌드 없음, NDK+Eigen 기준선 1순위, OpenCL은 삼성 위주·Pixel 미제공, Game Loop는 인텐트 래퍼 필요, 3~7일). 도구: `AI_Factory/device_lab/ftl.sh`(막내8 소유 — run android 추가는 막내8과 겹치지 않게 별도 함수로, 병합은 쌍아).

## 0. 범위 승인

- 작가님 05:51 지시를 **안드로이드 빌드 도구 설치** 승인으로 본다. 대상은 Android SDK command-line tools, NDK, platform-tools, build-tools, JDK이며 사용자 홈 아래에만 설치한다. sudo·전역 설정·Homebrew 전역 패키지는 범위 밖이다. 막히면 보고한다.
- 빌드 장소는 iMac(Intel)이다. 4060은 쓰지 않는다. 8765에 진행 중인 판이 있으면 무거운 컴파일을 미룬다.

## 1. 단계 (작은 단위 — 단계마다 쌍아에 1줄 보고, 대기하지 말고 진행)

1. **KataGo CPU 백엔드 arm64 빌드**: NDK 크로스 컴파일, Eigen, `-DUSE_BACKEND=EIGEN`. 실행 파일은 `libkatago.so` 이름으로 APK `jniLibs/arm64-v8a`에 넣는다. 실행 권한 우회 방식으로, Android 10 이상의 쓰기 가능 경로 실행 금지를 피한다. 로컬 시험용으로 x86_64도 함께 빌드한다(선택).
2. **래퍼 APK (Kotlin, 화면 1개)**:
   - Game Loop 인텐트(`com.google.intent.action.TEST_LOOP`)를 받으면 모델 `monk_b10_s83M.bin.gz`(또는 v3 회수 후 v3)와 GTP 벤치 명령을 assets에서 꺼낸다.
   - KataGo를 실행해 iOS 벤치와 같은 측정을 한다: 빈 판·100수·200수 × 1500 visits + 자동 visits(2초 목표).
   - 결과를 `logFile`에 JSON으로 쓰고, 화면 캡처 3장(시작·1500v 직후·종료, 기종·Android 버전·단계 표기)을 남긴 뒤 종료한다.
   - 손으로 실행할 때도 같은 벤치 버튼이 있게 한다.
3. **스모크는 FTL 가상 기기로 먼저**: 무료 60분/일, 실기기 한도와 별도다. 1회 실행 → 결과 회수까지 확인한다.
4. **실기기 1차 실측(실기기 무료 한도 안)**: 저가 갤럭시 A05s·A15 + 기준 S24 × 1회. 막내8의 iOS 실측과 **같은 날 25분 가드를 공유**하므로, 실행 전에 `ftl.sh usage`로 잔여를 확인하고 모자라면 내일로 넘긴다.
5. OpenCL 백엔드는 이번 범위 밖이다. CPU 기준선 결과를 본 뒤 결정한다.

## 2. 반환

COMPLETION(빌드 방법 재현 스크립트 `AI_Factory/go_android_bench/` · APK 크기 · 가상·실기기 속도 표 · 캡처 경로 · 막힌 곳) + 브랜치 SHA. APK·SDK·모델은 레포에 커밋하지 않는다(레포 밖 `~/.monkos/go_android/`).

## 3. 하지 않는 것

- 스토어 배포·서명 키 신설(디버그 키만). 유료 초과 실행. 8765 재기동.

## 4. 준수

헌법 3조·4조. KataGo 라이선스(MIT)·Eigen(MPL2) 고지 파일은 APK 안에 포함한다. 도구 3요건.
