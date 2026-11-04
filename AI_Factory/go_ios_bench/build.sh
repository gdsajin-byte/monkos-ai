#!/bin/bash
# M1: KataGo iOS(metal-coreml-stable) 빌드 → 아이폰 설치. 사용: build.sh
set -uo pipefail
DEV=3AE3A741-9156-5734-A7CE-92D0A6A3DFEE
ROOT=~/developer/_ext/katago-ios
cd "$ROOT/ios/KataGo iOS"
LOG=$ROOT/build.log
xcodebuild -project "KataGo iOS.xcodeproj" -scheme "KataGo iOS" -configuration Release \
  -destination "id=$DEV" -derivedDataPath "$ROOT/build" -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=ZPMVHPDUHW CODE_SIGN_STYLE=Automatic build > "$LOG" 2>&1
RC=$?
echo "xcodebuild rc=$RC"
grep -E "error:|BUILD (SUCCEEDED|FAILED)|requires a provisioning|No profiles|Signing for" "$LOG" | sort -u | head -20
APP=$(find "$ROOT/build/Build/Products" -maxdepth 2 -name "*.app" -path "*iphoneos*" | head -1)
echo "app: $APP"
[ $RC -eq 0 ] && [ -n "$APP" ] || exit 1
xcrun devicectl device install app --device $DEV "$APP" 2>&1 | tail -4
