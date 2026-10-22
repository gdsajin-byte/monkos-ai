#!/bin/bash
# vision-matte 빌드 — 산출물 .build/out/vision-matte (현재 머신 아키텍처)
#   1순위 swift build -c release (SwiftPM)
#   2순위 swiftc 직접 컴파일 — 외부 의존성 0이라 결과는 같다.
#   ⚠️ iMac(CLT 전용, Swift 5.8.1)은 SwiftPM이 `xcrun --show-sdk-platform-path` 조회에서 죽는다(10-22 실측).
#      CLT 갱신은 전역 설치라 범위 밖 — 폴백으로 빌드하고 그 사실을 출력한다(무음 강등 금지).
#   교차 빌드: ARCH=arm64 ./build.sh  (M1 배치용 — iMac Intel에서 arm64 바이너리 생성)
set -euo pipefail
cd "$(dirname "$0")"
ARCH="${ARCH:-$(uname -m)}"
OUT=.build/out
mkdir -p "$OUT"

if [ "$ARCH" = "$(uname -m)" ] && swift build -c release >/dev/null 2>"$OUT/spm_err.txt"; then
  cp "$(swift build -c release --show-bin-path)/VisionMatte" "$OUT/vision-matte"
  echo "✅ build: swift build (SwiftPM) → $OUT/vision-matte"
else
  if [ "$ARCH" = "$(uname -m)" ]; then
    echo "⚠️ build: swift build 실패 → swiftc 폴백. 사유: $(head -1 "$OUT/spm_err.txt" 2>/dev/null)"
  fi
  swiftc -O -target "$ARCH-apple-macos12.0" Sources/VisionMatte/main.swift -o "$OUT/vision-matte"
  echo "✅ build: swiftc ($ARCH-apple-macos12.0) → $OUT/vision-matte"
fi
file "$OUT/vision-matte"
