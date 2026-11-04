#!/usr/bin/env python3
"""pbxproj에 빠진 cpp 소스를 같은 폴더의 기존 소스를 본떠 추가 — 그 파일을 컴파일하는 모든 Sources 단계에 넣는다. 멱등."""
import os
import re
import secrets

PBX = os.path.expanduser("~/developer/_ext/katago-ios/ios/KataGo iOS/KataGo iOS.xcodeproj/project.pbxproj")
ADD = [("sgfmetadata.cpp", "nninputs.cpp"), ("evalcache.cpp", "searchnode.cpp")]  # (새 파일, 본뜰 파일)
s = open(PBX).read()


def nid():
    return secrets.token_hex(12).upper()


for new, ref in ADD:
    if f"/* {new} */" in s:
        print(new, "이미 있음")
        continue
    m = re.search(r"\t\t([0-9A-F]{24}) /\* " + re.escape(ref) + r" \*/ = \{isa = PBXFileReference;([^\n]*)\n", s)
    if not m:
        raise SystemExit(f"본뜰 파일 참조 없음: {ref}")
    ref_id, body = m.group(1), m.group(2)
    new_ref = nid()
    s = s.replace(m.group(0), m.group(0) + f"\t\t{new_ref} /* {new} */ = {{isa = PBXFileReference;{body.replace(ref, new)}\n", 1)
    # 그룹 children
    s = re.sub(r"(\t+)" + ref_id + r" /\* " + re.escape(ref) + r" \*/,\n",
               lambda mm: mm.group(0) + f"{mm.group(1)}{new_ref} /* {new} */,\n", s, count=1)
    # 빌드 파일들
    bfs = re.findall(r"\t\t([0-9A-F]{24}) /\* " + re.escape(ref) + r" in Sources \*/ = \{isa = PBXBuildFile; fileRef = " + ref_id + r"[^\n]*\n", s)
    for bf in bfs:
        new_bf = nid()
        line = re.search(r"\t\t" + bf + r" /\* " + re.escape(ref) + r" in Sources \*/ = \{[^\n]*\n", s).group(0)
        s = s.replace(line, line + f"\t\t{new_bf} /* {new} in Sources */ = {{isa = PBXBuildFile; fileRef = {new_ref} /* {new} */; }};\n", 1)
        s = re.sub(r"(\t+)" + bf + r" /\* " + re.escape(ref) + r" in Sources \*/,\n",
                   lambda mm: mm.group(0) + f"{mm.group(1)}{new_bf} /* {new} in Sources */,\n", s, count=1)
    print(new, "추가 — 빌드 단계", len(bfs))
open(PBX, "w").write(s)
