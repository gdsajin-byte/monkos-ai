#!/usr/bin/env python3
"""Firebase Test Lab Game Loop 진입 — 멱등. (ORDER_20261106 실기기테스트_FirebaseTestLab도구 §1-2)

FTL은 앱을 `firebase-game-loop://?scenario=N` URL로 띄운다. 앱이 시작하면 runGtp 안에서 monkAutoBench(자동 측정)가 돈다.
이 패치는 자동 측정 직후 **한 번만**(Documents/GameLoopResults/done 없을 때) 아래를 하고 테스트를 끝낸다:
  1) KataGo benchmark -v 1500 -n 3 · -v {자동 결정값} -n 3 (같은 스레드 32) → 수당 시간·visits/s
  2) Documents/GameLoopResults/bench_{기종}.json (autobench.json 내용 + 1500v·자동 visits 결과 + 원문 꼬리)
     + screen_1~3.png 자체 화면 캡처(시작·1500v 직후·종료, 기종 코드·iOS·단계 표기) — v2(11-06 05:42 작가님)
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

VER = "v2"  # v2: 자체 화면 캡처 3장(11-06 05:42 작가님 "기기마다 잘 도는지 캡처")
if MARK in h and f"MONK gameloop {VER}" in h:
    print("helper: already", VER)
else:
    if MARK in h:  # 이전 버전 블록 제거(호출 줄은 아래에서 다시 넣는다)
        a, b = h.index(MARK), h.index("// ===== /MONK gameloop =====") + len("// ===== /MONK gameloop =====\n")
        h = h[:a] + h[b:]
        h = h.replace("    monkGameLoop(docs, modelPath, configPath, monkVisits);  // MONK gameloop(FTL)\n", "")
        print("helper: 이전 gameloop 블록 교체")
    funcs = MARK + f" {VER}" + r""" (FTL Game Loop — 한 번 측정·기록·캡처·종료) =====
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

/// 자체 화면 캡처 — 앱 창을 그대로 그려 PNG로(기종 코드·iOS·단계 표기 띠). 메인 스레드에서 그리고 이 스레드는 기다린다.
static void monkSnap(NSString* dir, int n, NSString* stage) {
    struct utsname u; uname(&u);
    NSString* label = [NSString stringWithFormat:@"%s · iOS %@ · %@", u.machine, [[UIDevice currentDevice] systemVersion], stage];
    NSString* path = [dir stringByAppendingPathComponent:[NSString stringWithFormat:@"screen_%d.png", n]];
    void (^snap)(void) = ^{
        UIWindow* w = nil;
        for (UIScene* sc in [UIApplication sharedApplication].connectedScenes) {
            if (![sc isKindOfClass:[UIWindowScene class]]) continue;
            for (UIWindow* x in ((UIWindowScene*)sc).windows) { if (x.isKeyWindow || !w) w = x; }
        }
        if (!w) return;
        UIGraphicsImageRenderer* r = [[UIGraphicsImageRenderer alloc] initWithBounds:w.bounds];
        UIImage* img = [r imageWithActions:^(UIGraphicsImageRendererContext* ctx) {
            [w drawViewHierarchyInRect:w.bounds afterScreenUpdates:YES];
            CGRect band = CGRectMake(0, w.bounds.size.height - 44, w.bounds.size.width, 44);
            [[UIColor colorWithWhite:0 alpha:0.7] setFill];
            UIRectFill(band);
            [label drawInRect:CGRectInset(band, 10, 11) withAttributes:@{NSFontAttributeName: [UIFont boldSystemFontOfSize:15],
                                                                           NSForegroundColorAttributeName: [UIColor whiteColor]}];
        }];
        [UIImagePNGRepresentation(img) writeToFile:path atomically:YES];
    };
    if ([NSThread isMainThread]) snap(); else dispatch_sync(dispatch_get_main_queue(), snap);  // 메인에서 불리면 바로(교착 방지)
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
    monkSnap(dir, 1, @"시작");
    monkBenchOnce(model, config, 1500, v1, s1, raw1);
    monkSnap(dir, 2, [NSString stringWithFormat:@"1500v %.0f v/s", v1]);
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
    monkSnap(dir, 3, [NSString stringWithFormat:@"종료 · 자동 %dv %.0f v/s", autoVisits, v2]);
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

# ---- Info.plist URL 스킴 — 앱 대상은 생성형 Info.plist(GENERATE_INFOPLIST_FILE=YES, 11-06 M1 실측)
# → URL 스킴만 담은 GameLoop-Info.plist 를 만들고 앱 대상(번들 ai.monkos.go.bench) 설정에 INFOPLIST_FILE 로 연결한다(Xcode가 생성 키와 합친다)
APP_PLIST = os.path.join(ROOT, "KataGo iOS", "GameLoop-Info.plist")
pbx_path = glob.glob(os.path.join(ROOT, "*.xcodeproj", "project.pbxproj"))[0]
pbx = open(pbx_path).read()
if not os.path.exists(APP_PLIST):
    with open(APP_PLIST, "wb") as f:
        plistlib.dump({"CFBundleURLTypes": [{"CFBundleURLName": "", "CFBundleTypeRole": "Editor",
                                             "CFBundleURLSchemes": ["firebase-game-loop"]}]}, f)
    print("plist: created", APP_PLIST)
anchor = "PRODUCT_BUNDLE_IDENTIFIER = ai.monkos.go.bench;"
n_app = pbx.count(anchor)
if n_app == 0:
    sys.exit("❌ patch_gameloop: 앱 대상(번들 ai.monkos.go.bench) 설정을 pbxproj에서 못 찾음")
if 'INFOPLIST_FILE = "KataGo iOS/GameLoop-Info.plist";' in pbx:
    print("pbxproj: already")
else:
    pbx = pbx.replace(anchor, anchor + '\n\t\t\t\tINFOPLIST_FILE = "KataGo iOS/GameLoop-Info.plist";')
    open(pbx_path, "w").write(pbx)
    print(f"pbxproj: INFOPLIST_FILE 연결 {n_app}곳(Debug·Release)")

# ---- 최소 iOS 버전 점검(경고만, 자동 변경 안 함)
tg = sorted(set(re.findall(r"IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);", pbx)))
print("deployment targets(전체 대상):", tg)
if any(tuple(map(int, t.split("."))) > (16, 6) for t in tg):
    print("⚠️ patch_gameloop: 일부 대상(프레임워크 KataGoSwift·katago 등)의 최소 iOS가 16.6보다 높다 — "
          "FTL iPhone 8·11 Pro(16.6)에서 설치·실행이 막힐 수 있다(실측으로 확인). SE 3(18.4)·16 Pro(18.3)는 무관")
