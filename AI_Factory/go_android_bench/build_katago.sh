#!/bin/bash
# KataGo(Eigen CPU) 안드로이드 크로스 빌드 — NDK·c++ 정적 링크 실행 파일 → libkatago.so 이름으로 APK jniLibs/<ABI>에 넣는다 (PF_GO, ORDER_20261106 1단계)
#   build_katago.sh [arm64-v8a|x86_64]      (기본 arm64-v8a)  → ~/.monkos/go_android/out/<ABI>/libkatago.so
# sha2.cpp가 BYTE_ORDER를 요구 → bionic endian.h를 -include로 미리 넣는다(KataGo 소스 무수정).
# Android 10+ 는 쓰기 가능 경로의 실행을 막는다 → 앱 nativeLibraryDir(읽기 전용·실행 허용)에 'lib*.so' 이름으로 넣어 설치기가 풀게 하고 거기서 exec 한다.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/env.sh"
ABI="${1:-arm64-v8a}"
API="${API:-26}"
SRC="${KATAGO_SRC:-$HOME/.monkos/katago/src/KataGo-1.18.2/cpp}"
GA="$HOME/.monkos/go_android"
EIGEN="$GA/toolchain/eigen-3.4.0"
die() { echo "❌ build_katago: $*" >&2; exit 1; }
[ -d "$SRC" ] || die "KataGo 소스 없음: $SRC"
if [ ! -d "$EIGEN/Eigen" ]; then
  curl -fsSL -o "$GA/toolchain/eigen.tar.gz" "https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.tar.gz" || die "Eigen 받기 실패"
  tar xzf "$GA/toolchain/eigen.tar.gz" -C "$GA/toolchain"
fi
CMAKE="$ANDROID_HOME/cmake/3.22.1/bin/cmake"
NINJA="$ANDROID_HOME/cmake/3.22.1/bin/ninja"
B="$GA/build/$ABI"; mkdir -p "$B" "$GA/out/$ABI"
"$CMAKE" -S "$SRC" -B "$B" -G Ninja -DCMAKE_MAKE_PROGRAM="$NINJA" \
  -DCMAKE_TOOLCHAIN_FILE="$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake" \
  -DANDROID_ABI="$ABI" -DANDROID_PLATFORM="android-$API" -DANDROID_STL=c++_static \
  -DCMAKE_BUILD_TYPE=Release -DUSE_BACKEND=EIGEN -DEIGEN3_INCLUDE_DIRS="$EIGEN" \
  -DNO_GIT_REVISION=1 -DNO_LIBZIP=1 -DKATAGO_AUTO_FETCH_DEPS=OFF \
  -DCMAKE_CXX_FLAGS="-include endian.h" \
  -DCMAKE_EXE_LINKER_FLAGS="-static-libstdc++" >"$B/configure.log" 2>&1 || { tail -30 "$B/configure.log"; die "cmake 구성 실패 ($B/configure.log)"; }
"$NINJA" -C "$B" -j "${JOBS:-6}" katago >"$B/build.log" 2>&1 || { grep -m5 -B2 -A8 "error" "$B/build.log"; die "컴파일 실패 ($B/build.log)"; }
"$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-strip" -o "$GA/out/$ABI/libkatago.so" "$B/katago"
file "$GA/out/$ABI/libkatago.so"
ls -la "$GA/out/$ABI/libkatago.so"
echo "✅ build_katago: $ABI → $GA/out/$ABI/libkatago.so"
