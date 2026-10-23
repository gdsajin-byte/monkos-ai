"""작가님 검수용 비교 시트 (설계 §4 ④) — 국면 그림 + 사실 + 모델별 해설(블라인드 A·B·C) + 3점 척도.

  python3 sheet.py     # → SHEET.html (커밋 대상)

모델 열 순서는 국면마다 고정 시드로 섞는다. 정답 키는 시트 하단 '모델 공개'에 접어 둔다.
채점은 브라우저 안에서만 저장(localStorage) — '결과 복사'로 JSON을 쌍아에게 전달.
"""
import glob
import html
import json
import os
import random

from board import gtp_to_xy, N, COLS
from facts import board_at
from analyze import load_game

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
MODELS = ["haiku", "sonnet", "opus"]
LEVELS = ["아이", "아마", "유단"]
CRIT = ["맞는 말", "재미", "이해"]


def svg_board(gm, fx):
    i = fx["move_number"] - 1
    b = board_at(gm, i)
    cell, pad = 20, 22
    size = pad * 2 + cell * (N - 1)
    o = [f'<svg viewBox="0 0 {size} {size}" class="bd" role="img" aria-label="{fx["pos_id"]} 국면">',
         f'<rect width="{size}" height="{size}" fill="var(--wood)"/>']
    for k in range(N):
        a = pad + k * cell
        o.append(f'<line x1="{pad}" y1="{a}" x2="{size - pad}" y2="{a}" class="ln"/>')
        o.append(f'<line x1="{a}" y1="{pad}" x2="{a}" y2="{size - pad}" class="ln"/>')
        o.append(f'<text x="{a}" y="12" class="lb">{COLS[k]}</text>')
        o.append(f'<text x="8" y="{a + 3}" class="lb">{N - k}</text>')
    for x in (3, 9, 15):
        for y in (3, 9, 15):
            o.append(f'<circle cx="{pad + x * cell}" cy="{pad + y * cell}" r="2.5" class="hs"/>')
    for (x, y), c in b.s.items():
        o.append(f'<circle cx="{pad + x * cell}" cy="{pad + y * cell}" r="9.3" class="{"sb" if c == "B" else "sw"}"/>')
    # 직전 수 표시
    if i > 0:
        lp = gtp_to_xy(gm["moves"][i - 1][1])
        if lp and lp in b.s:
            o.append(f'<circle cx="{pad + lp[0] * cell}" cy="{pad + lp[1] * cell}" r="3.5" class="lm"/>')
    pa, pb = gtp_to_xy(fx["actual"]), gtp_to_xy(fx["best"])
    o.append(f'<circle cx="{pad + pb[0] * cell}" cy="{pad + pb[1] * cell}" r="8" class="mb"/>')
    x, y = pad + pa[0] * cell, pad + pa[1] * cell
    o.append(f'<path d="M{x - 6} {y - 6}L{x + 6} {y + 6}M{x + 6} {y - 6}L{x - 6} {y + 6}" class="ma"/>')
    o.append("</svg>")
    return "".join(o)


def esc(s):
    return html.escape(s, quote=True)


def main():
    games = {g["id"]: g for g in json.load(open(os.path.join(HERE, "games.json")))}
    ver = json.load(open(os.path.join(DATA, "verify.json")))
    bad = {}
    for r in ver["rows"]:
        if r.get("errors"):
            bad[(r["model"], r["pos_id"], r["level"], r["sentence"])] = r["errors"]
    rng = random.Random(20261023)
    sections, key = [], []
    loaded = {}
    for f in sorted(glob.glob(os.path.join(DATA, "facts", "P*.json"))):
        fx = json.load(open(f))
        gm = loaded.setdefault(fx["game"], load_game(fx["game"]))
        g = games[fx["game"]]
        order = MODELS[:]
        rng.shuffle(order)
        key.append((fx["pos_id"], order))
        facts = "".join(f'<li><b>{x["id"]}</b> <span class="ty">{esc(x["type"])}</span> {esc(x["text"])}</li>'
                        for x in fx["facts"])
        cols = []
        for label, m in zip("ABC", order):
            t = json.load(open(os.path.join(DATA, "teacher", m, f"{fx['pos_id']}.json")))
            body = []
            if not t["levels"]:
                body.append('<p class="err">응답 파싱 실패</p>')
            else:
                for lv in LEVELS:
                    sents = []
                    for s in t["levels"].get(lv, []):
                        e = bad.get((m, fx["pos_id"], lv, s))
                        cls = ' class="fail"' if e else ""
                        tip = f' title="검증기 탈락: {esc(", ".join(e))}"' if e else ""
                        sents.append(f"<span{cls}{tip}>{esc(s)}</span>")
                    body.append(f'<div class="lv"><h4>{lv}</h4><p>{" ".join(sents)}</p></div>')
            score = "".join(
                f'<div class="sc"><span>{c}</span>' + "".join(
                    f'<label><input type="radio" name="{fx["pos_id"]}-{label}-{ci}" value="{v}">{v}</label>'
                    for v in (1, 2, 3)) + "</div>" for ci, c in enumerate(CRIT))
            cols.append(f'<div class="col"><h3>{label}</h3>{"".join(body)}<div class="score">{score}</div></div>')
        sections.append(f'''<section id="{fx["pos_id"]}">
<h2>{fx["pos_id"]} · {esc(g["band"])} ({esc(g["black"])} 대 {esc(g["white"])}) · {"흑" if fx["color"] == "B" else "백"} {fx["move_number"]}수 {fx["actual"]} → 최선 {fx["best"]}</h2>
<div class="top"><figure>{svg_board(gm, fx)}<figcaption>✕ 실제 수 {fx["actual"]} · 파란 원 최선수 {fx["best"]} · 작은 점 직전 수 · <a href="{g["url"]}">OGS 원본</a></figcaption></figure>
<ol class="facts">{facts}</ol></div>
<div class="cols">{"".join(cols)}</div></section>''')
    keyhtml = "".join(f"<li>{p}: " + ", ".join(f"{l}={m}" for l, m in zip("ABC", o)) + "</li>" for p, o in key)
    s = ver["summary"]
    stat = "".join(
        f"<tr><td>{m}</td><td>{s[m]['pass_rate'] * 100:.1f}%</td><td>{s[m]['passed']}/{s[m]['sentences']}</td>"
        f"<td>{s[m]['strict_rate'] * 100:.1f}%</td><td>{s[m]['clean_responses']}/{s[m]['responses']}</td><td>{s[m]['sec_median']}초</td>"
        f"<td>{esc(', '.join(f'{k} {v}' for k, v in sorted(s[m]['reasons'].items(), key=lambda t: -t[1])) or '없음')}</td></tr>"
        for m in MODELS if m in s)
    page = TEMPLATE.replace("{{SECTIONS}}", "\n".join(sections)).replace("{{KEY}}", keyhtml).replace("{{STAT}}", stat)
    open(os.path.join(HERE, "SHEET.html"), "w").write(page)
    print("SHEET.html", len(sections), "국면")


TEMPLATE = """<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>바둑 해설 교사 비교</title>
<style>
:root{--bg:#f7f5f0;--fg:#1d1b18;--mut:#6b655c;--card:#fff;--line:#e3ddd2;--wood:#e2bd7a;--grid:#5a4320;--acc:#2a62c9;--bad:#c23b2b;--badbg:#fbe6e2}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#161513;--fg:#ece7de;--mut:#a39c90;--card:#201e1b;--line:#38342e;--wood:#b8935a;--grid:#3b2b12;--acc:#7aa7ff;--bad:#ff8a7a;--badbg:#3a1f1b}}
:root[data-theme="dark"]{--bg:#161513;--fg:#ece7de;--mut:#a39c90;--card:#201e1b;--line:#38342e;--wood:#b8935a;--grid:#3b2b12;--acc:#7aa7ff;--bad:#ff8a7a;--badbg:#3a1f1b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}
main{max-width:1280px;margin:0 auto;padding:24px 16px 80px}h1{font-size:22px;margin:0 0 4px}.sub{color:var(--mut);margin:0 0 16px}
table{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--line);margin:8px 0 24px;font-size:14px}td,th{padding:6px 10px;border-bottom:1px solid var(--line);text-align:left}
section{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:0 0 20px}h2{font-size:17px;margin:0 0 12px}
.top{display:grid;grid-template-columns:minmax(220px,340px) 1fr;gap:16px}figure{margin:0}figcaption{font-size:12px;color:var(--mut)}
.bd{width:100%;height:auto;display:block;border-radius:4px}.ln{stroke:var(--grid);stroke-width:.8}.lb{font-size:8px;fill:var(--grid);text-anchor:middle}.hs{fill:var(--grid)}
.sb{fill:#111;stroke:#000}.sw{fill:#fafafa;stroke:#555;stroke-width:.8}.lm{fill:#e33}.mb{fill:none;stroke:#1d5fe0;stroke-width:3}.ma{stroke:#e0301d;stroke-width:3;stroke-linecap:round}
.facts{margin:0;padding-left:18px;font-size:13.5px}.facts li{margin:0 0 4px}.ty{color:var(--mut);font-size:12px}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.col{border:1px solid var(--line);border-radius:8px;padding:10px}
.col h3{margin:0 0 6px;font-size:15px}.lv h4{margin:8px 0 2px;font-size:12.5px;color:var(--mut)}.lv p{margin:0;font-size:14px}
.fail{background:var(--badbg);color:var(--bad);text-decoration:underline dotted}.err{color:var(--bad)}
.score{margin-top:10px;border-top:1px dashed var(--line);padding-top:8px;font-size:13px}.sc{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.sc span{width:56px;color:var(--mut)}
.sc label{display:inline-flex;gap:3px;align-items:center;min-height:32px}
.bar{position:sticky;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 16px;display:flex;gap:10px;align-items:center;justify-content:center}
button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid var(--line);background:var(--acc);color:#fff;cursor:pointer}
details{margin-top:24px}a{color:var(--acc)}
@media (max-width:800px){.top{grid-template-columns:1fr}.cols{grid-template-columns:1fr}table{display:block;overflow-x:auto}}
</style></head><body><main>
<h1>바둑 해설 교사 비교 — 파일럿 20국면</h1>
<p class="sub">같은 사실 목록(KataGo 계산)을 세 모델이 아이·아마·유단 3수준으로 옮긴 결과입니다. 열 A·B·C는 국면마다 섞은 블라인드입니다. 붉은 밑줄 문장은 검증기 탈락(마우스를 올리면 사유). 각 열에 1~3점(1 나쁨 · 3 좋음)을 매겨 주세요.</p>
<table><thead><tr><th>모델</th><th>문장 통과율</th><th>통과/전체</th><th>엄격 통과율</th><th>전 문장 통과 응답</th><th>응답 시간(중앙값)</th><th>모순 사유</th></tr></thead><tbody>{{STAT}}</tbody></table>
{{SECTIONS}}
<details><summary>모델 공개 (채점 후 열기)</summary><ul>{{KEY}}</ul></details>
</main>
<div class="bar"><span id="cnt">0</span>/180 채점 <button id="cp">결과 복사</button></div>
<script>
const K='go-sheet-20261023';let st={};try{st=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
const ins=[...document.querySelectorAll('input[type=radio]')];
ins.forEach(i=>{if(st[i.name]==i.value)i.checked=true;i.addEventListener('change',()=>{st[i.name]=i.value;try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}upd()})});
function upd(){document.getElementById('cnt').textContent=Object.keys(st).length}
document.getElementById('cp').onclick=async()=>{const t=JSON.stringify(st);try{await navigator.clipboard.writeText(t);document.getElementById('cp').textContent='복사됨'}catch(e){prompt('복사해 주세요',t)}};upd();
</script></body></html>
"""

if __name__ == "__main__":
    main()
