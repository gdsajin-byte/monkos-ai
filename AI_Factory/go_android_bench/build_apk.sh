#!/bin/bash
# 래퍼 APK 빌드(디버그 서명) — Gradle은 홈 아래 툴체인에서 실행, 빌드물·디버그 키 모두 레포 밖 (PF_GO, ORDER_20261106 2단계)
#   build_apk.sh   → ~/.monkos/go_android/apk/monk-go-bench-debug.apk
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/env.sh"
GA="$HOME/.monkos/go_android"
GV="${GRADLE_VER:-8.7}"
die() { echo "❌ build_apk: $*" >&2; exit 1; }
[ -f "$GA/out/arm64-v8a/libkatago.so" ] || die "libkatago.so 없음 — build_katago.sh 먼저"
[ -f "$GA/assets/model_bin_gz.dat" ] || die "assets 없음 — prep_assets.py 먼저"
if [ ! -x "$GA/toolchain/gradle-$GV/bin/gradle" ]; then
  curl -fsSL -o "$GA/toolchain/gradle.zip" "https://services.gradle.org/distributions/gradle-$GV-bin.zip" || die "Gradle 받기 실패"
  unzip -q -o "$GA/toolchain/gradle.zip" -d "$GA/toolchain"
fi
export ANDROID_USER_HOME="$GA/android-user"   # 디버그 키스토어를 ~/.android 대신 여기에
mkdir -p "$ANDROID_USER_HOME" "$GA/apk"
echo "sdk.dir=$ANDROID_HOME" > "$HERE/app/local.properties"
"$GA/toolchain/gradle-$GV/bin/gradle" -p "$HERE/app" --project-cache-dir "$GA/gradle-project-cache" --no-daemon -q :bench:assembleDebug || die "gradle 실패"
APK="$GA/gradle-build/bench/outputs/apk/debug/bench-debug.apk"
[ -f "$APK" ] || die "APK 없음: $APK"
cp "$APK" "$GA/apk/monk-go-bench-debug.apk"
ls -la "$GA/apk/monk-go-bench-debug.apk"
unzip -l "$GA/apk/monk-go-bench-debug.apk" | grep -E "libkatago|model.bin|licenses|classes.dex" || true
echo "✅ build_apk: $GA/apk/monk-go-bench-debug.apk"
