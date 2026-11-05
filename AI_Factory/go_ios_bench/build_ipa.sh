#!/bin/bash
# FTL Game Loop용 IPA(개발 서명) — M1 화면 터미널에서 실행(ssh는 키체인 잠김으로 서명 실패, README).
# 순서: prep.py b10 → addsrc.py → patch_model_override.py → patch_autobench.py → patch_gameloop.py → 이 스크립트
# 산출: ~/developer/_ext/katago-ios/build/gameloop/MONKBench.ipa  (FTL이 자체 인증서로 다시 서명한다 — Firebase 문서)
set -euo pipefail
cd ~/developer/_ext/katago-ios/ios/"KataGo iOS"
OUT=~/developer/_ext/katago-ios/build/gameloop
mkdir -p "$OUT"
cat > "$OUT/ExportOptions.plist" <<'PL'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>development</string>
  <key>teamID</key><string>ZPMVHPDUHW</string>
  <key>signingStyle</key><string>automatic</string>
  <key>compileBitcode</key><false/>
</dict></plist>
PL
xcodebuild -project "KataGo iOS.xcodeproj" -scheme "KataGo iOS" -configuration Release -destination "generic/platform=iOS" \
  -archivePath "$OUT/MONKBench.xcarchive" -allowProvisioningUpdates archive | tail -3
xcodebuild -exportArchive -archivePath "$OUT/MONKBench.xcarchive" -exportOptionsPlist "$OUT/ExportOptions.plist" \
  -exportPath "$OUT" -allowProvisioningUpdates | tail -3
IPA=$(ls "$OUT"/*.ipa | head -1)
mv "$IPA" "$OUT/MONKBench.ipa" 2>/dev/null || true
rm -rf "$OUT/chk" && mkdir "$OUT/chk" && (cd "$OUT/chk" && unzip -q ../MONKBench.ipa)
codesign --verify --deep --verbose "$OUT"/chk/Payload/*.app && echo "✅ build_ipa: $OUT/MONKBench.ipa (서명 확인)"
/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes:0" "$OUT"/chk/Payload/*.app/Info.plist \
  | grep -q firebase-game-loop && echo "✅ build_ipa: URL 스킴 firebase-game-loop 포함" || { echo "❌ build_ipa: URL 스킴 없음"; exit 1; }
