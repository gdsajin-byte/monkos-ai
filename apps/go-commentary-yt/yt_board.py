# 유튜브 해설 화면 판독 — 프레임마다 흑·백 돌 + '번호 돌'(해설자가 놓은 참고도 수순) 수. 사용: yt_board.py <폴더> [x0 y0 step]
# 기하(480p 이현욱바둑TV 실측 10-23): x0=220 y0=16 step=25.44 — 다른 채널·해상도는 인자로
import json, sys, glob, os
import numpy as np
from PIL import Image
d = sys.argv[1]
x0, y0, st = (float(v) for v in sys.argv[2:5]) if len(sys.argv) > 4 else (220, 16, 25.44)
off = int(st * 0.22)
out = []
for f in sorted(glob.glob(f"{d}/frames/f_*.jpg")):
    im = np.asarray(Image.open(f).convert("RGB")).astype(int)
    b, w, num = {}, {}, 0
    for i in range(19):
        for j in range(19):
            x, y = int(x0 + i * st), int(y0 + j * st)
            p = np.concatenate([im[y + dy - 1:y + dy + 2, x + dx - 1:x + dx + 2].reshape(-1, 3) for dx in (-off, off) for dy in (-off, off)])
            m = p.mean(axis=0); g = m.mean(); sat = m.max() - m.min()
            ctr = im[y - 4:y + 5, x - 4:x + 5].mean(axis=2)  # 가운데 9×9 — 숫자 획이 가늘어 평균 대신 극값
            if g < 80:
                b[(i, j)] = 1
                if ctr.max() > 170: num += 1  # 흑돌 가운데 밝은 획 = 흰 숫자
            elif g > 200 and sat < 40:
                w[(i, j)] = 1
                if ctr.min() < 100: num += 1  # 백돌 가운데 어두운 획 = 검은 숫자
    t = (int(os.path.basename(f)[2:6]) - 1) * 10  # fps=1/10 → 초
    out.append({"t": t, "black": len(b), "white": len(w), "numbered": num})
json.dump(out, open(f"{d}/board_track.json", "w"))
for r in out[::6]:
    print(f'{r["t"]//60:2d}:{r["t"]%60:02d}  흑 {r["black"]:3d} 백 {r["white"]:3d}  번호돌 {r["numbered"]}')
