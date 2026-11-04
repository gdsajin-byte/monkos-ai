import json, os
Q = os.path.expanduser('~/.monkos/go-board/analysis/mistakes_v0/queries_smoke10.jsonl')
qs = [json.loads(x) for x in open(Q)]
g = next(q for q in qs if len(q['moves']) >= 250)  # 표본 대국 1국(수순만, 대국자 없음)
out = ["boardsize 19", "komi 6.5"]
def pos(n, tag, repeat=1):
    out.append("clear_board")
    for c, m in g['moves'][:n]:
        out.append(f"play {c} {m}")
    side = "B" if n % 2 == 0 else "W"
    for i in range(repeat):
        out.append("clear_cache")
        out.append(f"genmove {side}")
        out.append("undo")
pos(0, "empty")
pos(100, "mid")
pos(200, "end")
pos(100, "mid-sustain", repeat=20)
out.append("clear_board")
open('bench_cmds.txt', 'w').write("\n".join(out) + "\n")
print(len(out), "lines; game moves", len(g['moves']))
