#!/usr/bin/env python3
"""KataGoHelper.mm: 첫 실행 자동 측정(MONK autobench) — 멱등.
측정: KataGo benchmark(-v 300 -n 3 -t 32,32)를 cout 캡처로 1회 → 마지막(워밍업 뒤) 'visits/s' 값.
결정: maxVisits = clamp(floor(vps × 2초 × 0.85 / 50) × 50, 100, 1500).
기록: Documents/autobench.json(기종·iOS·모델 크기·vps·결정값·측정 초·원문 꼬리). 같은 모델이면 재사용, Documents/autobench_redo 있으면 재측정.
적용: gtp에 -override-config maxVisits=N.
"""
import os
H = os.path.expanduser("~/developer/_ext/katago-ios/ios/KataGo iOS/KataGo iOS/KataGoHelper.mm")
h = open(H).read()
MARK = "// ===== MONK autobench"
if MARK in h:
    print("already")
    raise SystemExit
funcs = MARK + r""" (재사용 단위: 측정 → 결정 → 기록. 정식 앱 ⑥-2에서 그대로 옮겨 쓴다) =====
#include <sys/utsname.h>
#include <chrono>

/// 측정: KataGo benchmark를 짧게 1회 돌려 워밍업 뒤 visits/s를 돌려준다(실패 시 -1). raw에 출력 원문.
static double monkMeasureVisitsPerSec(const string& model, const string& config, string& raw) {
    std::stringstream ss;
    std::streambuf* old = cout.rdbuf(ss.rdbuf());
    vector<string> a = {"benchmark", "-model", model, "-config", config, "-v", "300", "-n", "3", "-t", "32,32"};
    try { MainCmds::benchmark(a); } catch (...) {}
    cout.rdbuf(old);
    raw = ss.str();
    const string key = "visits/s = ";
    double v = -1;
    size_t p = 0;
    while ((p = raw.find(key, p)) != string::npos) { v = atof(raw.c_str() + p + key.size()); p += key.size(); }
    return v;  // 마지막 값 = 두 번째(워밍업 뒤) 측정
}

/// 결정: 목표 응수 시간 안에 들어오는 수읽기(50 단위, 하한·상한).
static int monkDecideVisits(double vps, double targetSec = 2.0, double safety = 0.85, int lo = 100, int hi = 1500) {
    if (vps <= 0) return lo;
    int v = (int)(vps * targetSec * safety / 50.0) * 50;
    return std::max(lo, std::min(hi, v));
}

/// 기록·재사용: Documents/autobench.json. 같은 모델 크기면 저장값을 쓰고, autobench_redo가 있으면 다시 잰다.
static int monkAutoBench(NSString* docs, NSString* modelPath, NSString* configPath) {
    NSFileManager* fm = [NSFileManager defaultManager];
    NSString* jp = [docs stringByAppendingPathComponent:@"autobench.json"];
    NSString* redo = [docs stringByAppendingPathComponent:@"autobench_redo"];
    long long msize = [[[fm attributesOfItemAtPath:modelPath error:nil] objectForKey:NSFileSize] longLongValue];
    NSDictionary* prev = [NSJSONSerialization JSONObjectWithData:([NSData dataWithContentsOfFile:jp] ?: [NSData data]) options:0 error:nil];
    if ([prev isKindOfClass:[NSDictionary class]] && ![fm fileExistsAtPath:redo] &&
        [prev[@"modelBytes"] longLongValue] == msize && [prev[@"maxVisits"] intValue] > 0) {
        return [prev[@"maxVisits"] intValue];
    }
    [fm removeItemAtPath:redo error:nil];
    auto t0 = std::chrono::steady_clock::now();
    string raw;
    double vps = monkMeasureVisitsPerSec(string([modelPath UTF8String]), string([configPath UTF8String]), raw);
    double secs = std::chrono::duration<double>(std::chrono::steady_clock::now() - t0).count();
    int visits = monkDecideVisits(vps);
    struct utsname u; uname(&u);
    NSString* tail = [NSString stringWithUTF8String:(raw.size() > 1500 ? raw.substr(raw.size() - 1500) : raw).c_str()] ?: @"";
    NSDictionary* rec = @{@"machine": [NSString stringWithUTF8String:u.machine],
                          @"os": [[NSProcessInfo processInfo] operatingSystemVersionString],
                          @"modelBytes": @(msize), @"visitsPerSec": @(vps), @"maxVisits": @(visits),
                          @"targetSec": @2.0, @"safety": @0.85, @"measureSec": @(secs),
                          @"measuredAt": [[NSDate date] description], @"rawTail": tail};
    NSData* d = [NSJSONSerialization dataWithJSONObject:rec options:NSJSONWritingPrettyPrinted error:nil];
    [d writeToFile:jp atomically:YES];
    return visits;
}
// ===== /MONK autobench =====

"""
h = h.replace("@implementation KataGoHelper", funcs + "@implementation KataGoHelper", 1)
call = ("    int monkVisits = monkAutoBench(docs, modelPath, configPath);  // MONK autobench\n"
        "    subArgs.push_back(string(\"-override-config\"));\n"
        "    subArgs.push_back(\"maxVisits=\" + std::to_string(monkVisits));\n")
anchor = "    if (bench) { outToKataGo << string([bench UTF8String]) << flush; }"
assert anchor in h
h = h.replace(anchor, call + anchor, 1)
# 측정은 cout 교체 전이어야 한다 → runGtp 안에서 cout.rdbuf(&tsbFromKataGo)보다 먼저 호출되도록 위치 확인
i_call, i_swap = h.find("monkAutoBench(docs"), h.find("cout.rdbuf(&tsbFromKataGo)")
print("call after swap:", i_call > i_swap)
open(H, "w").write(h)
print("patched")
