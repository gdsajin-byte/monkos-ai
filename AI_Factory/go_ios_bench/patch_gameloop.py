#!/usr/bin/env python3
"""Firebase Test Lab Game Loop 진입 — 멱등. (ORDER_20261106 실기기테스트_FirebaseTestLab도구 §1-2)

FTL은 앱을 `firebase-game-loop://?scenario=N` URL로 띄운다. 앱이 시작하면 runGtp 안에서 monkAutoBench(자동 측정)가 돈다.
이 패치는 자동 측정 직후 **한 번만**(Documents/GameLoopResults/done 없을 때) 아래를 하고 테스트를 끝낸다:
  1) KataGo benchmark -v 1500 -n 3 · -v {자동 결정값} -n 3 (같은 스레드 32) → 수당 시간·visits/s
  2) Documents/GameLoopResults/bench_{기종}.json (autobench.json 내용 + 1500v·자동 visits 결과 + 원문 꼬리)
  3) firebase-game-loop-complete:// 열기(메인 스레드) — FTL 밖에서는 처리할 앱이 없어 아무 일도 없다
그리고 Info.plist에 URL 스킴 firebase-game-loop 를 등록한다(FTL이 앱을 띄우는 입구).

실행: M1 `~/developer/_ext/katago-ios/`에서 `python3 monk_patch_gameloop.py` (patch_autobench.py 다음).
점검: 최소 iOS 버전(IPHONEOS_DEPLOYMENT_TARGET)이 16.6보다 높으면 FTL의 iPhone 8·11 Pro(iOS 16.6)에서 설치 불가 → 경고만(자동 변경 안 함).
"""
import glob
import os
import plistlib
import re
import sys

ROOT = os.path.expanduser("~/developer/_ext/katago-ios/ios/KataGo iOS")
H = os.path.join(ROOT, "KataGo iOS", "KataGoHelper.mm")
MARK = "// ===== MONK gameloop"
h = open(H).read()
if "// ===== MONK autobench" not in h:
    sys.exit("❌ patch_gameloop: patch_autobench.py 를 먼저 적용해야 한다(monkAutoBench 없음)")

if MARK in h:
    print("helper: already")
else:
    funcs = MARK + r""" (FTL Game Loop — 한 번 측정·기록·종료) =====
#import <UIKit/UIKit.h>

/// benchmark 1회(-v visits -n 3 -t 32) → (visits/s, 국면당 초). 실패 시 -1
static void monkBenchOnce(const string& model, const string& config, int visits, double& vps, double& secPerMove, string& raw) {
    std::stringstream ss;
    std::streambuf* old = cout.rdbuf(ss.rdbuf());
    vector<string> a = {"benchmark", "-model", model, "-config", config, "-v", std::to_string(visits), "-n", "3", "-t", "32"};
    auto t0 = std::chrono::steady_clock::now();
    try { MainCmds::benchmark(a); } catch (...) {}
    double total = std::chrono::duration<double>(std::chrono::steady_clock::now() - t0).count();
    cout.rdbuf(old);
    raw = ss.str();
    vps = -1; secPerMove = -1;
    const string key = "visits/s = ";
    size_t p = raw.rfind(key);
    if (p != string::npos) { vps = atof(raw.c_str() + p + key.size()); secPerMove = vps > 0 ? visits / vps : -1; }
    if (secPerMove < 0 && total > 0) secPerMove = total / 3.0;
}

/// Game Loop 결과 기록 + 종료 신호. 같은 설치에서 한 번만(done 표시).
static void monkGameLoop(NSString* docs, NSString* modelPath, NSString* configPath, int autoVisits) {
    NSFileManager* fm = [NSFileManager defaultManager];
    NSString* dir = [docs stringByAppendingPathComponent:@"GameLoopResults"];
    NSString* done = [dir stringByAppendingPathComponent:@"done"];
    if ([fm fileExistsAtPath:done]) return;
    [fm createDirectoryAtPath:dir withIntermediateDirectories:YES attributes:nil error:nil];
    string model([modelPath UTF8String]), config([configPath UTF8String]), raw1, raw2;
    double v1, s1, v2, s2;
    monkBenchOnce(model, config, 1500, v1, s1, raw1);
    monkBenchOnce(model, config, autoVisits, v2, s2, raw2);
    struct utsname u; uname(&u);
    NSDictionary* ab = [NSJSONSerialization JSONObjectWithData:([NSData dataWithContentsOfFile:[docs stringByAppendingPathComponent:@"autobench.json"]] ?: [NSData data]) options:0 error:nil] ?: @{};
    NSString* tail = [NSString stringWithUTF8String:(raw1.size() > 1200 ? raw1.substr(raw1.size() - 1200) : raw1).c_str()] ?: @"";
    NSDictionary* rec = @{@"machine": [NSString stringWithUTF8String:u.machine],
                          @"os": [[NSProcessInfo processInfo] operatingSystemVersionString],
                          @"autobench": ab, @"autoVisits": @(autoVisits),
                          @"v1500": @{@"visitsPerSec": @(v1), @"secPerMove": @(s1)},
                          @"vAuto": @{@"visits": @(autoVisits), @"visitsPerSec": @(v2), @"secPerMove": @(s2)},
                          @"at": [[NSDate date] description], @"rawTail1500": tail};
    NSData* d = [NSJSONSerialization dataWithJSONObject:rec options:NSJSONWritingPrettyPrinted error:nil];
    [d writeToFile:[dir stringByAppendingPathComponent:[NSString stringWithFormat:@"bench_%s.json", u.machine]] atomically:YES];
    [@"1" writeToFile:done atomically:YES encoding:NSUTF8StringEncoding error:nil];
    dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] openURL:[NSURL URLWithString:@"firebase-game-loop-complete://"] options:@{} completionHandler:nil];
    });
}
// ===== /MONK gameloop =====

"""
    h = h.replace("@implementation KataGoHelper", funcs + "@implementation KataGoHelper", 1)
    anchor = "    int monkVisits = monkAutoBench(docs, modelPath, configPath);  // MONK autobench\n"
    if anchor not in h:
        sys.exit("❌ patch_gameloop: monkAutoBench 호출 줄을 못 찾음 — patch_autobench 결과가 달라졌다")
    h = h.replace(anchor, anchor + "    monkGameLoop(docs, modelPath, configPath, monkVisits);  // MONK gameloop(FTL)\n", 1)
    open(H, "w").write(h)
    print("helper: patched")

# ---- Info.plist URL 스킴
plists = [p for p in glob.glob(os.path.join(ROOT, "**", "Info.plist"), recursive=True) if "Tests" not in p and "build" not in p.split(os.sep)]
if not plists:
    sys.exit("❌ patch_gameloop: 앱 Info.plist 없음(생성형 Info.plist) — Xcode 대상 Info 탭 'URL Types'에 firebase-game-loop 를 손으로 추가해 주세요")
for p in plists:
    with open(p, "rb") as f:
        d = plistlib.load(f)
    types = d.setdefault("CFBundleURLTypes", [])
    if any("firebase-game-loop" in t.get("CFBundleURLSchemes", []) for t in types):
        print(f"plist: already {p}")
        continue
    types.append({"CFBundleURLName": "", "CFBundleTypeRole": "Editor", "CFBundleURLSchemes": ["firebase-game-loop"]})
    with open(p, "wb") as f:
        plistlib.dump(d, f)
    print(f"plist: patched {p}")

# ---- 최소 iOS 버전 점검(경고만)
pbx = glob.glob(os.path.join(ROOT, "*.xcodeproj", "project.pbxproj"))
tg = sorted(set(re.findall(r"IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);", open(pbx[0]).read()))) if pbx else []
print("deployment target:", tg or "(미확인)")
if any(tuple(map(int, t.split("."))) > (16, 6) for t in tg):
    print("⚠️ patch_gameloop: 최소 iOS가 16.6보다 높다 — FTL iPhone 8·11 Pro(16.6)에는 설치되지 않는다. SE 3(18.4)·16 Pro(18.3)만 가능")
