#!/usr/bin/env python3
"""변수 → 사용 선택자 목록 (다크 매핑 설계용). usage.py <css> [kind 접두, 예: --sf-bg]"""
import re, sys
src = re.sub(r"/\*.*?\*/", "", open(sys.argv[1], encoding="utf-8").read(), flags=re.S)
pre = sys.argv[2] if len(sys.argv) > 2 else "--"
root = re.search(r":root \{\n(.*?)\n\}", src, re.S)
defs = dict(re.findall(r"  (--[\w-]+): ([^;]+);", root.group(1)))
body = src[root.end():]
use = {}
for sel, block in re.findall(r"([^{}]+)\{([^{}]*)\}", body):
    for v in set(re.findall(r"var\((--[\w-]+)\)", block)):
        use.setdefault(v, []).append(" ".join(sel.split())[-60:])
for v in sorted(defs):
    if v.startswith(pre):
        print(f"{v} = {defs[v]}  [{len(use.get(v, []))}] " + " ; ".join(use.get(v, [])[:6]))
