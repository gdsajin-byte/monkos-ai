"""두 캡처 묶음의 픽셀 비교 — 크기·다른 픽셀 수·다른 영역 박스."""
import sys, glob, os
from PIL import Image, ImageChops
D = "/Users/jeong-kyushin/.claude/jobs/66441cd2/tmp/dark/shots"
a, b = sys.argv[1], sys.argv[2]
for fa in sorted(glob.glob(f"{D}/{a}_*.png")):
    fb = fa.replace(f"/{a}_", f"/{b}_")
    if not os.path.exists(fb): continue
    A, B = Image.open(fa).convert("RGB"), Image.open(fb).convert("RGB")
    name = os.path.basename(fa)[len(a) + 1:]
    if A.size != B.size:
        print(f"❌ {name} 크기 다름 {A.size} vs {B.size}"); continue
    diff = ImageChops.difference(A, B)
    bbox = diff.getbbox()
    n = sum(1 for px in diff.getdata() if px != (0, 0, 0)) if bbox else 0
    print(f"{'✅' if n == 0 else '❌'} {name} {A.size} 다른 픽셀 {n}{'' if not bbox else f' 영역 {bbox}'}")
