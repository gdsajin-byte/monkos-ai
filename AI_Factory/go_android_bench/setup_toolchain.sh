#!/bin/bash
# 안드로이드 빌드 도구를 사용자 홈에만 설치 — JDK 17(Temurin)·SDK cmdline-tools·platform-tools·build-tools 34·platform 34·NDK·CMake (PF_GO, ORDER_20261106)
# 범위: 작가님 11-06 05:51 "안드로이드도 빌드해"(쌍아 지시서 0항 — 홈 아래만, sudo·전역 설정 없음). 다시 실행해도 안전(있는 것은 건너뜀).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
GA="${GA:-$HOME/.monkos/go_android}"
T="$GA/toolchain"; mkdir -p "$T"; cd "$T"
die() { echo "❌ setup_toolchain: $*" >&2; exit 1; }
if ! ls -d jdk-17*/Contents/Home >/dev/null 2>&1; then
  curl -fsSL -o jdk17.tar.gz "https://api.adoptium.net/v3/binary/latest/17/ga/mac/x64/jdk/hotspot/normal/eclipse" || die "JDK 받기 실패"
  tar xzf jdk17.tar.gz
fi
if [ ! -x sdk/cmdline-tools/latest/bin/sdkmanager ]; then
  curl -fsSL -o cmdtools.zip "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip" || die "cmdline-tools 받기 실패"
  mkdir -p sdk/cmdline-tools && unzip -q -o cmdtools.zip -d sdk/cmdline-tools && mv sdk/cmdline-tools/cmdline-tools sdk/cmdline-tools/latest
fi
. "$HERE/env.sh"
yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;$NDK_VER" "cmake;3.22.1" | tail -2
[ -f "$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake" ] || die "NDK $NDK_VER 설치 확인 실패"
echo "✅ setup_toolchain: JDK $("$JAVA_HOME/bin/java" -version 2>&1 | head -1) · NDK $NDK_VER · SDK $ANDROID_HOME"
