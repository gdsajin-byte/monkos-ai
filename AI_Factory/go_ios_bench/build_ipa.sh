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
stage() { echo "[$(date +%H:%M:%S)] $*"; }
run_x() {  # 로그파일 명령… — 10초마다 경과 표시(멈춘 게 아님을 보인다), 끝나면 꼬리 3줄
  local log="$1"; shift
  "$@" > "$log" 2>&1 &
  local pid=$! t0; t0=$(date +%s)
  while kill -0 "$pid" 2>/dev/null; do
    sleep 10
    kill -0 "$pid" 2>/dev/null && echo "   … $(( $(date +%s) - t0 ))초 경과 · 로그 $(wc -l < "$log" | tr -d ' ')줄 — 진행 중입니다(멈춘 게 아닙니다, Ctrl+C 누르지 마세요)"
  done
  local rc=0; wait "$pid" || rc=$?  # set -e 아래에서도 실패 꼬리를 보여 준 뒤 rc 반환
  tail -3 "$log"
  return $rc
}
stage "1/3 아카이브(컴파일) 시작 — 보통 3~8분"
run_x "$OUT/archive.log" xcodebuild -project "KataGo iOS.xcodeproj" -scheme "KataGo iOS" -configuration Release -destination "generic/platform=iOS" \
  -archivePath "$OUT/MONKBench.xcarchive" -allowProvisioningUpdates IPHONEOS_DEPLOYMENT_TARGET=16.4 archive  # 전 대상 16.4 — KataGoSwift(17.0) 때문에 iOS 16.6 기기 실행 직후 충돌(11-06 FTL 실측)
stage "2/3 IPA 내보내기(개발 서명)"
run_x "$OUT/export.log" xcodebuild -exportArchive -archivePath "$OUT/MONKBench.xcarchive" -exportOptionsPlist "$OUT/ExportOptions.plist" \
  -exportPath "$OUT" -allowProvisioningUpdates
stage "3/3 서명·URL 스킴 확인"
IPA=$(ls "$OUT"/*.ipa | head -1)
mv "$IPA" "$OUT/MONKBench.ipa" 2>/dev/null || true
rm -rf "$OUT/chk" && mkdir "$OUT/chk" && (cd "$OUT/chk" && unzip -q ../MONKBench.ipa)
codesign --verify --deep --verbose "$OUT"/chk/Payload/*.app && echo "✅ build_ipa: $OUT/MONKBench.ipa (서명 확인)"
/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes:0" "$OUT"/chk/Payload/*.app/Info.plist \
  | grep -q firebase-game-loop && echo "✅ build_ipa: URL 스킴 firebase-game-loop 포함" || { echo "❌ build_ipa: URL 스킴 없음"; exit 1; }
