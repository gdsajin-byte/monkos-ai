#!/usr/bin/env python3
"""M1 ~/developer/_ext/katago-ios (metal-coreml-stable) 시험 빌드 준비 — 멱등.
사용: python3 prep.py b10|b18
- pbxproj: 팀 ZPMVHPDUHW, 번들 ID ccy.* → ai.monkos.go.bench*
- KataGoHelper.mm: Documents로 chdir(로그 저장) + Documents/bench_cmds.txt 있으면 1회 GTP 입력으로 넣고 .done으로 이름 변경 (UI 무변경)
- default_gtp.cfg: Metal GPU(coremlDeviceToUse 0), maxVisits 1500, maxTime 60, rules korean, logDir gtp_logs
- Resources/default_model.bin.gz ← 선택 모델, CoreML mlpackage 자리는 빈 폴더(ANE 미사용)
"""
import os
import re
import shutil
import sys

ROOT = os.path.expanduser("~/developer/_ext/katago-ios")
IOS = os.path.join(ROOT, "ios", "KataGo iOS")
PBX = os.path.join(IOS, "KataGo iOS.xcodeproj", "project.pbxproj")
HELPER = os.path.join(IOS, "KataGo iOS", "KataGoHelper.mm")
CFG = os.path.join(IOS, "Resources", "default_gtp.cfg")
MODELS = {"b10": os.path.join(ROOT, "models", "monk_b10_s41M.bin.gz"), "b18": os.path.join(ROOT, "models", "b18.bin.gz")}

which = sys.argv[1]

s = open(PBX).read()
s = s.replace("DEVELOPMENT_TEAM = 4L5BJK5M8K;", "DEVELOPMENT_TEAM = ZPMVHPDUHW;")
s = s.replace('PRODUCT_BUNDLE_IDENTIFIER = "ccy.KataGo-iOS";', "PRODUCT_BUNDLE_IDENTIFIER = ai.monkos.go.bench;")
s = s.replace("PRODUCT_BUNDLE_IDENTIFIER = ccy.KataGoSwift;", "PRODUCT_BUNDLE_IDENTIFIER = ai.monkos.go.bench.swift;")
s = s.replace("PRODUCT_BUNDLE_IDENTIFIER = ccy.katago;", "PRODUCT_BUNDLE_IDENTIFIER = ai.monkos.go.bench.katago;")
open(PBX, "w").write(s)
left = re.findall(r"PRODUCT_BUNDLE_IDENTIFIER = [^;]*ccy[^;]*;", s)
print("pbxproj ccy 잔여:", len(left), left[:3])

h = open(HELPER).read()
MARK = "// MONK bench patch"
if MARK not in h:
    if "#include <unistd.h>" not in h:
        h = "#include <unistd.h>\n" + h
    patch = (
        f"    {MARK}: 로그를 앱 Documents에 쓰고, Documents/bench_cmds.txt가 있으면 1회 GTP 입력으로 넣는다\n"
        "    NSString* docs = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;\n"
        "    chdir([docs fileSystemRepresentation]);\n"
        "    NSString* benchPath = [docs stringByAppendingPathComponent:@\"bench_cmds.txt\"];\n"
        "    NSString* bench = [NSString stringWithContentsOfFile:benchPath encoding:NSUTF8StringEncoding error:nil];\n"
        "    if (bench) {\n"
        "        NSString* done = [docs stringByAppendingPathComponent:@\"bench_cmds.done\"];\n"
        "        [[NSFileManager defaultManager] removeItemAtPath:done error:nil];\n"
        "        [[NSFileManager defaultManager] moveItemAtPath:benchPath toPath:done error:nil];\n"
        "    }\n\n"
    )
    h = h.replace("    // Replace the global cout object with the custom one\n", patch + "    // Replace the global cout object with the custom one\n", 1)
    h = h.replace("    MainCmds::gtp(subArgs);\n#else",
                  "    if (bench) { outToKataGo << string([bench UTF8String]) << flush; }  // " + MARK + "\n    MainCmds::gtp(subArgs);\n#else", 1)
    open(HELPER, "w").write(h)
print("helper patched:", h.count(MARK))

lines = open(CFG).read().split("\n")
want = {"coremlDeviceToUse": "0", "maxVisits": "1500", "maxTime": "60", "rules": "korean", "logDir": "gtp_logs",
        "logSearchInfo": "true", "ponderingEnabled": "false"}
seen = set()
out = []
for ln in lines:
    m = re.match(r"^\s*([A-Za-z0-9_]+)\s*=", ln)
    if m and m.group(1) in want:
        k = m.group(1)
        if k in seen:
            continue
        out.append(f"{k} = {want[k]}  # MONK bench")
        seen.add(k)
    else:
        out.append(ln)
for k, v in want.items():
    if k not in seen:
        out.append(f"{k} = {v}  # MONK bench")
open(CFG, "w").write("\n".join(out))
print("cfg:", {k: (k in seen) for k in want})

res = os.path.join(IOS, "Resources")
shutil.copyfile(MODELS[which], os.path.join(res, "default_model.bin.gz"))
os.makedirs(os.path.join(res, "KataGoModel29x29fp16.mlpackage"), exist_ok=True)
print("model:", which, os.path.getsize(os.path.join(res, "default_model.bin.gz")))
