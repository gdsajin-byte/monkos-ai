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

VER = "v4"  # v2: 자체 화면 캡처(05:42 작가님) · v3: 판 화면 캡처(쌍아 06:00) · v4: 저메모리 축소(쌍아 06:13 — iPhone 8 Jetsam)
if MARK in h and f"MONK gameloop {VER}" in h:
    print("helper: already", VER)
else:
    if MARK in h:  # 이전 버전 블록 제거(호출 줄은 아래에서 다시 넣는다)
        a, b = h.index(MARK), h.index("// ===== /MONK gameloop =====") + len("// ===== /MONK gameloop =====\n")
        h = h[:a] + h[b:]
        h = h.replace("    monkGameLoop(docs, modelPath, configPath, monkVisits);  // MONK gameloop(FTL)\n", "")
        h = h.replace("    monkGameLoopShow();  // MONK gameloop(FTL) — GTP 준비 뒤 판 화면 캡처\n", "")
        print("helper: 이전 gameloop 블록 교체")
    funcs = MARK + f" {VER}" + r""" (FTL Game Loop — 한 번 측정·기록·캡처·종료) =====
#import <UIKit/UIKit.h>

static NSDictionary* gMonkGL = nil;  // 이번 실행 측정 결과(화면 캡처 단계로 넘김)

/// benchmark 1회(-v visits -n 3 -t 32) → (visits/s, 국면당 초). 실패 시 -1
static void monkBenchOnce(const string& model, const string& config, int visits, double& vps, double& secPerMove, string& raw) {
    std::stringstream ss;
    std::streambuf* old = cout.rdbuf(ss.rdbuf());
    vector<string> a = {"benchmark", "-model", model, "-config", config, "-v", std::to_string(visits), "-n", "3", "-t", monkLowMem() ? "8" : "32"};
    if (monkLowMem()) { a.push_back("-override-config"); a.push_back(kMonkLowOvr); }
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
    monkBenchOnce(model, config, 1500, v1, s1, raw1);
    monkBenchOnce(model, config, autoVisits, v2, s2, raw2);
    struct utsname u; uname(&u);
    NSDictionary* ab = [NSJSONSerialization JSONObjectWithData:([NSData dataWithContentsOfFile:[docs stringByAppendingPathComponent:@"autobench.json"]] ?: [NSData data]) options:0 error:nil] ?: @{};
    NSString* tail = [NSString stringWithUTF8String:(raw1.size() > 1200 ? raw1.substr(raw1.size() - 1200) : raw1).c_str()] ?: @"";
    NSDictionary* rec = @{@"machine": [NSString stringWithUTF8String:u.machine],
                          @"os": [[NSProcessInfo processInfo] operatingSystemVersionString],
                          @"autobench": ab, @"autoVisits": @(autoVisits),
                          @"physicalMemoryMB": @([NSProcessInfo processInfo].physicalMemory / (1024 * 1024)), @"lowMem": @(monkLowMem()),
                          @"v1500": @{@"visitsPerSec": @(v1), @"secPerMove": @(s1)},
                          @"vAuto": @{@"visits": @(autoVisits), @"visitsPerSec": @(v2), @"secPerMove": @(s2)},
                          @"at": [[NSDate date] description], @"rawTail1500": tail};
    NSData* d = [NSJSONSerialization dataWithJSONObject:rec options:NSJSONWritingPrettyPrinted error:nil];
    [d writeToFile:[dir stringByAppendingPathComponent:[NSString stringWithFormat:@"bench_%s.json", u.machine]] atomically:YES];
    [@"1" writeToFile:done atomically:YES encoding:NSUTF8StringEncoding error:nil];
    gMonkGL = @{@"dir": dir, @"v1": @(v1), @"s1": @(s1), @"v2": @(v2), @"s2": @(s2), @"auto": @(autoVisits)};  // 화면 캡처는 GTP 준비 뒤(monkGameLoopShow)
}

/// GTP 준비 뒤 판 화면 캡처 — 측정 국면(G10 첫 30수)을 놓고 Goban 탭으로 → 시작 · 1500v genmove 직후 · 자동 genmove 직후 → 완료 URL.
/// GTP 명령은 전역 입력 스트림에 미리 넣어 두면 GTP가 뜬 뒤 차례로 처리한다(bench_cmds 와 같은 방식). 응답은 화면(UI)이 읽어 판을 그린다.
static void monkGameLoopShow() {
    NSDictionary* g = gMonkGL;
    if (!g) return;  // 이번 실행에서 측정하지 않았으면(FTL 아님·이미 끝남) 아무것도 안 한다
    gMonkGL = nil;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        NSString* dir = g[@"dir"];
        double s1 = [g[@"s1"] doubleValue], s2 = [g[@"s2"] doubleValue], v1 = [g[@"v1"] doubleValue], v2 = [g[@"v2"] doubleValue];
        int av = [g[@"auto"] intValue];
        const char* seq = "B R16 W Q4 B D17 W C4 B E4 W E3 B D4 W D3 B C5 W F4 B C3 W B4 B C2 W B5 B D6 W C6 B F3 W D5 B E5 W E6 "
                          "B F5 W F6 B C5 W G5 B G4 W D7 B H5 W G6 B C14 W H4";  // 측정 국면 30수(작가님 G10 기보 앞부분)
        std::stringstream in(seq); string c, m, cmds = "clear_board\n";
        while (in >> c >> m) cmds += "play " + c + " " + m + "\n";
        outToKataGo << cmds << "showboard\n" << flush;
        sleep(12);  // GTP 기동(모델 적재)·판 그림 대기
        dispatch_async(dispatch_get_main_queue(), ^{
            [[NSNotificationCenter defaultCenter] postNotificationName:@"MONKShowGoban" object:nil];
        });
        sleep(2);
        monkSnap(dir, 1, @"시작 · 측정 국면 30수");
        outToKataGo << "kata-set-param maxVisits 1500\ngenmove b\nshowboard\n" << flush;
        sleep((unsigned)(s1 > 0 ? s1 : 5) + 4);
        monkSnap(dir, 2, [NSString stringWithFormat:@"1500v 직후 · %.2f초 · %.0f v/s", s1, v1]);
        outToKataGo << "kata-set-param maxVisits " << av << "\ngenmove w\nshowboard\n" << flush;
        sleep((unsigned)(s2 > 0 ? s2 : 3) + 4);
        monkSnap(dir, 3, [NSString stringWithFormat:@"종료 · 자동 %dv %.2f초 · %.0f v/s", av, s2, v2]);
        dispatch_async(dispatch_get_main_queue(), ^{
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:@"firebase-game-loop-complete://"] options:@{} completionHandler:nil];
        });
    });
}
// ===== /MONK gameloop =====

"""
    h = h.replace("@implementation KataGoHelper", funcs + "@implementation KataGoHelper", 1)
    LOWMARK = "// ===== MONK lowmem"
    if LOWMARK not in h:
        low = LOWMARK + r""" (실메모리 3GB 미만 = 스레드 8·NN 캐시 2^16·배치 8 — 11-06 FTL iPhone 8 Jetsam) =====
#import <Foundation/Foundation.h>
static bool monkLowMem() { return [NSProcessInfo processInfo].physicalMemory < 3ULL * 1024 * 1024 * 1024; }
static const char* kMonkLowOvr = "numSearchThreads=8,nnCacheSizePowerOfTwo=16,nnMaxBatchSize=8";
// ===== /MONK lowmem =====

"""
        h = h.replace("// ===== MONK autobench", low + "// ===== MONK autobench", 1)
        old_ab = 'vector<string> a = {"benchmark", "-model", model, "-config", config, "-v", "300", "-n", "3", "-t", "32,32"};'
        if h.count(old_ab) != 1:
            sys.exit("❌ patch_gameloop: autobench benchmark 줄을 못 찾음")
        h = h.replace(old_ab, 'vector<string> a = {"benchmark", "-model", model, "-config", config, "-v", "300", "-n", "3", "-t", monkLowMem() ? "8,8" : "32,32"};\n'
                              '    if (monkLowMem()) { a.push_back("-override-config"); a.push_back(kMonkLowOvr); }  // MONK lowmem', 1)
        old_g = 'subArgs.push_back("maxVisits=" + std::to_string(monkVisits));'
        if h.count(old_g) != 1:
            sys.exit("❌ patch_gameloop: GTP maxVisits 오버라이드 줄을 못 찾음")
        h = h.replace(old_g, 'subArgs.push_back("maxVisits=" + std::to_string(monkVisits) + (monkLowMem() ? string(",") + kMonkLowOvr : string("")));  // MONK lowmem', 1)
        print("lowmem: patched(autobench·GTP)")
    anchor = "    int monkVisits = monkAutoBench(docs, modelPath, configPath);  // MONK autobench\n"
    if anchor not in h:
        sys.exit("❌ patch_gameloop: monkAutoBench 호출 줄을 못 찾음 — patch_autobench 결과가 달라졌다")
    h = h.replace(anchor, anchor + "    monkGameLoop(docs, modelPath, configPath, monkVisits);  // MONK gameloop(FTL)\n", 1)
    anchor2 = "    MainCmds::gtp(subArgs);\n"
    if h.count(anchor2) != 1:
        sys.exit("❌ patch_gameloop: MainCmds::gtp 호출 줄을 못 찾음")
    h = h.replace(anchor2, "    monkGameLoopShow();  // MONK gameloop(FTL) — GTP 준비 뒤 판 화면 캡처\n" + anchor2, 1)
    open(H, "w").write(h)
    print("helper: patched")

# ---- ContentView: 탭 선택 상태 + MONKShowGoban 알림 → Goban 탭(v3, 멱등)
CV = os.path.join(ROOT, "KataGo iOS", "ContentView.swift")
cv = open(CV).read()
if "MONKShowGoban" in cv:
    print("contentview: already")
else:
    pairs = [("    @State var isEditing = EditMode.inactive\n",
              "    @State var isEditing = EditMode.inactive\n    @State private var monkTab = 0  // MONK gameloop: FTL 캡처 때 Goban 탭으로\n"),
             ("        TabView() {", "        TabView(selection: $monkTab) {"),
             ('''                    Label("Command", systemImage: "text.alignleft")
                }
''', '''                    Label("Command", systemImage: "text.alignleft")
                }
                .tag(0)
'''),
             ('''                    Label("Goban", systemImage: "circle")
                }
''', '''                    Label("Goban", systemImage: "circle")
                }
                .tag(1)
'''),
             ('''                    Label("Config", systemImage: "slider.horizontal.3")
                }
''', '''                    Label("Config", systemImage: "slider.horizontal.3")
                }
                .tag(2)
'''),
             ('''        .environment(\\.editMode, $isEditing)
''', '''        .environment(\\.editMode, $isEditing)
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("MONKShowGoban"))) { _ in monkTab = 1 }  // MONK gameloop
''')]
    for a, b in pairs:
        if cv.count(a) != 1:
            sys.exit(f"❌ patch_gameloop: ContentView 패치 지점 없음 — {a.strip()[:40]}")
        cv = cv.replace(a, b, 1)
    open(CV, "w").write(cv)
    print("contentview: patched(탭 선택·Goban 전환)")

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
          "build_ipa.sh 가 IPHONEOS_DEPLOYMENT_TARGET=16.4 로 덮어써 빌드한다(11-06 FTL: 17.0 KataGoSwift 때문에 iOS 16.6 실행 직후 충돌 실측). 이 스크립트로 직접 빌드하지 말 것")
