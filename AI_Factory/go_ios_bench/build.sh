#!/bin/bash
# M1: KataGo iOS(metal-coreml-stable) 빌드 → 아이폰 설치.
# 사용: monk_build.sh [기기ID]   (기기ID 생략 = 연결된 아이폰 1대 자동, 없으면 generic 빌드만)
# ⚠️ 서명은 M1 화면 터미널에서 실행해야 한다(ssh는 키체인 잠김 → errSecInternalComponent)
set -uo pipefail
ROOT=~/developer/_ext/katago-ios
DEV="${1:-}"
[ "$DEV" = generic ] && DEV="" && GENERIC=1
if [ -z "$DEV" ] && [ -z "${GENERIC:-}" ]; then
  DEV=$(xcrun devicectl list devices 2>/dev/null | awk '/available/ && /iPhone/ {print $3; exit}')
fi
if [ -n "$DEV" ]; then DEST="id=$DEV"; else DEST="generic/platform=iOS"; fi
echo "대상: ${DEV:-없음(generic 빌드만)}"
cd "$ROOT/ios/KataGo iOS"
LOG=$ROOT/build.log
xcodebuild -project "KataGo iOS.xcodeproj" -scheme "KataGo iOS" -configuration Release \
  -destination "$DEST" -derivedDataPath "$ROOT/build" -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=ZPMVHPDUHW CODE_SIGN_STYLE=Automatic build > "$LOG" 2>&1
RC=$?
echo "xcodebuild rc=$RC"
grep -E " error:|BUILD (SUCCEEDED|FAILED)|errSecInternalComponent|requires a provisioning|No profiles" "$LOG" | sort -u | head -20
APP=$(find "$ROOT/build/Build/Products" -maxdepth 2 -name "*.app" -path "*iphoneos*" | head -1)
[ $RC -eq 0 ] && [ -n "$APP" ] || exit 1
[ -n "$DEV" ] || { echo "기기 없음 — 설치 생략"; exit 0; }
xcrun devicectl device install app --device "$DEV" "$APP" 2>&1 | tail -4
