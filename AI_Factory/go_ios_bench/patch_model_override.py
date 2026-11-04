#!/usr/bin/env python3
"""KataGoHelper.mm: Documents/default_model.bin.gz가 있으면 번들 모델 대신 그것을 쓴다(모델 교체에 재빌드 불필요). 멱등."""
import os
H = os.path.expanduser("~/developer/_ext/katago-ios/ios/KataGo iOS/KataGo iOS/KataGoHelper.mm")
h = open(H).read()
MARK = "// MONK model override"
if MARK not in h:
    anchor = "    // Replace the global cout object with the custom one\n"
    add = (f"    {MARK}: Documents/default_model.bin.gz 우선\n"
           "    NSString* docModel = [docs stringByAppendingPathComponent:@\"default_model.bin.gz\"];\n"
           "    if ([[NSFileManager defaultManager] fileExistsAtPath:docModel]) { modelPath = docModel; }\n\n")
    assert anchor in h and "NSString* docs" in h
    h = h.replace(anchor, add + anchor, 1)
    open(H, "w").write(h)
print("override:", h.count(MARK))
