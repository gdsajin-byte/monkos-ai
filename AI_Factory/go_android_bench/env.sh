# MONKOS Go 안드로이드 빌드 환경 — source 해서 쓴다 (PF_GO, ORDER_20261106 안드로이드빌드_GameLoop)
# 도구는 전부 레포 밖 사용자 홈(~/.monkos/go_android/toolchain)에만 있다. 전역 설정·sudo 없음.
GA="${GA:-$HOME/.monkos/go_android}"
export JAVA_HOME="$(ls -d "$GA"/toolchain/jdk-17*/Contents/Home 2>/dev/null | head -1)"
export ANDROID_HOME="$GA/toolchain/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export NDK_VER="${NDK_VER:-26.3.11579264}"
export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/$NDK_VER"
export GRADLE_USER_HOME="$GA/toolchain/gradle-home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
[ -n "$JAVA_HOME" ] || echo "❌ go_android env: JDK 없음 — $GA/toolchain/jdk-17*" >&2
