# 타이젬 대국 라이브 관전 — 브리지 로그의 수순을 읽어 별도 KataGo 분석(가벼운 visits)으로 형세·추천수를 띄운다.
# 사용: python3 live_view.py [브리지로그] [--port 8770] [--visits 160] [--komi 6.5|0] [--pre "B D3"]   → http://127.0.0.1:8770/
# 브리지(대국)와 GPU를 나눠 쓴다. 판정·착수에는 관여하지 않는다(읽기 전용).
import argparse, glob, json, os, re, subprocess, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

K = os.path.expanduser("~/.monkos/katago")
TY = os.path.expanduser("~/.monkos/tygem")
COLS = "ABCDEFGHJKLMNOPQRST"
MOVE_RE = re.compile(r"#(\d+) (우리|상대) ([BW]) (\S+)")


def latest_log():
    logs = sorted(glob.glob(f"{TY}/bridge_2*.log"), key=os.path.getmtime)
    if not logs:
        raise SystemExit("❌ live_view: 브리지 로그 없음")
    return logs[-1]


def complexity(ri, infos, osd, n=99):
    """복잡도 v0(휴리스틱, 보정 전) — 0~100.
    ① 신경망이 스스로 예측한 단기 승률 오차(rawStWrError) ② 불확실한 점의 비율(ownershipStdev>0.6)
    ③ 최선수와 5%p 안쪽 후보 수. 싸움터 표시용으로 점별 불확실성도 함께 돌려준다."""
    st = min(1.0, ri.get("rawStWrError", 0) / 0.25)
    contested = sum(1 for v in osd if v > 0.6) / 361 if osd else 0
    ct = min(1.0, contested / 0.15)
    best = max((m["winrate"] for m in infos), default=0)
    tot = sum(m["visits"] for m in infos) or 1
    close = sum(1 for m in infos if m["visits"] >= tot * 0.05 and best - m["winrate"] <= 0.05)
    sp = min(1.0, max(0, close - 1) / 3) if n >= 40 else 0  # 포석은 좋은 수가 많아도 '쉬운' 국면 — 후보 수 가중 제외(10-23 4국 보정)
    return {"cx": round(100 * (0.4 * st + 0.35 * ct + 0.25 * sp)),
            "cxParts": [round(st, 2), round(contested, 3), close], "osd": [round(v, 2) for v in osd]}


class Analyzer:
    def __init__(s, visits, komi=6.5):
        s.komi = komi
        s.p = subprocess.Popen([f"{K}/katago-ocl", "analysis", "-config", f"{K}/analysis_live.cfg",
                                "-model", f"{K}/kata1-b18c384nbt-s9996604416-d4316597426.bin.gz"],
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
        s.visits = visits
        s.initial = []  # 접바둑 치석 [["B","D4"],...]

    def run(s, moves):
        q = {"id": str(len(moves)), "moves": [[c, m] for c, m in moves], "rules": "korean", "komi": s.komi,
             "boardXSize": 19, "boardYSize": 19, "maxVisits": s.visits, "initialStones": s.initial,
             "includeOwnership": True, "includeOwnershipStdev": True}
        s.p.stdin.write(json.dumps(q) + "\n")
        line = s.p.stdout.readline()
        if not line:
            raise RuntimeError("분석 엔진 종료")
        r = json.loads(line)
        if "error" in r:
            raise RuntimeError(r["error"])
        ri = r["rootInfo"]
        top = [{"move": m["move"], "winrate": m["winrate"], "scoreLead": m["scoreLead"], "visits": m["visits"],
                "pv": m.get("pv", [])[:6]} for m in sorted(r["moveInfos"], key=lambda m: m["order"])[:5]]
        return {"winrate": ri["winrate"], "scoreLead": ri["scoreLead"], "top": top,
                **complexity(ri, r["moveInfos"], r.get("ownershipStdev") or [], len(moves))}


class State:
    def __init__(s, log, visits, komi=6.5, pre=(), goboard=None):
        s.pre = list(pre)  # 브리지가 이어 두기로 시작해 로그에 없는 앞 수들
        s.goboard = goboard  # 우리 웹 바둑판 /api/state — 있으면 그 판의 SGF를 수순 원본으로 쓴다
        s.log, s.lock = log, threading.Lock()
        s.moves, s.results, s.me, s.tail, s.err = [], {}, "b", [], None
        s.an, s.sys = Analyzer(visits, komi), {}
        threading.Thread(target=s.loop, daemon=True).start()
        threading.Thread(target=s.sysmon, daemon=True).start()

    def read_goboard(s):
        import urllib.request
        st = json.load(urllib.request.urlopen(s.goboard, timeout=15))
        sgf = open(st["sgf"], encoding="utf-8").read() if st.get("sgf") and os.path.exists(st["sgf"]) else ""
        if st.get("sgf") != s.log:  # 새 판 — 결과 초기화
            with s.lock:
                s.log, s.results = st.get("sgf") or "(대국 없음)", {}
        s.me = (st.get("user") or "B").lower()
        s.an.komi = st.get("komi", 6.5)
        g = lambda v: "pass" if not v else COLS[ord(v[0]) - 97] + str(19 - (ord(v[1]) - 97))
        ab = re.search(r"AB((?:\[[a-s]{2}\])+)", sgf)
        s.an.initial = [["B", g(v)] for v in re.findall(r"\[([a-s]{2})\]", ab.group(1))] if ab else []
        moves = [(c, g(v)) for c, v in re.findall(r";([BW])\[([a-s]{0,2})\]", sgf)]
        return moves, []

    def read_log(s):
        if s.goboard:
            return s.read_goboard()
        moves, tail = list(s.pre), []
        for l in open(s.log, encoding="utf-8", errors="replace"):
            l = l.rstrip("\n")
            tail.append(l)
            m = MOVE_RE.search(l)
            if m and int(m.group(1)) == len(moves) - len(s.pre) + 1:
                moves.append((m.group(3), m.group(4).upper()))
            if "나:" in l:
                s.me = "w" if "나: w" in l else "b"
        return moves, tail[-8:]

    def loop(s):
        while True:
            try:
                moves, tail = s.read_log()
                with s.lock:
                    s.moves, s.tail = moves, tail
                    todo = [k for k in range(len(moves), -1, -1) if k not in s.results]
                if todo:
                    k = todo[0]  # 최신 국면 우선, 남는 시간에 과거 보충
                    res = s.an.run(moves[:k])
                    with s.lock:
                        s.results[k] = res
                        s.err = None
                    continue
            except Exception as e:  # 실패 가시화 — 연속 3회부터 화면에 표시(바둑판 서버가 엔진 응답 중이면 잠깐 늦을 수 있음)
                s.fails = getattr(s, "fails", 0) + 1
                if s.fails >= 3:
                    with s.lock:
                        s.err = f"❌ live_view: {e} (연속 {s.fails}회)"
                time.sleep(1.0)
                continue
            s.fails = 0
            with s.lock:
                s.err = None
            time.sleep(1.0)

    def sysmon(s):
        while True:
            info = {}
            try:
                io = subprocess.run(["ioreg", "-r", "-d", "1", "-c", "IOAccelerator"], capture_output=True, text=True, timeout=5).stdout
                u = [int(x) for x in re.findall(r'"Device Utilization %"=(\d+)', io)]
                info["gpu"] = max(u) if u else None
                info["load"] = round(os.getloadavg()[0], 1)
                th = subprocess.run(["pmset", "-g", "therm"], capture_output=True, text=True, timeout=5).stdout
                m = re.search(r"CPU_Speed_Limit\s*=\s*(\d+)", th)
                info["speed"] = int(m.group(1)) if m else 100
                ts = [] if s.goboard else [(time.strptime(l[:8], "%H:%M:%S"), MOVE_RE.search(l)) for l in open(s.log, encoding="utf-8", errors="replace") if MOVE_RE.search(l)]
                think = [time.mktime(ts[i][0]) - time.mktime(ts[i - 1][0]) for i in range(1, len(ts)) if ts[i][1].group(2) == "우리"]
                info["think"] = think[-1] if think else None
                info["thinkAvg"] = round(sum(think[-10:]) / len(think[-10:]), 1) if think else None
            except Exception as e:
                info["err"] = str(e)
            with s.lock:
                s.sys = info
            time.sleep(3)

    def snapshot(s):
        with s.lock:
            return {"log": os.path.basename(s.log), "me": s.me, "moves": s.moves, "tail": s.tail, "error": s.err, "sys": s.sys,
                    "results": {str(k): ({kk: vv for kk, vv in v.items() if kk != "osd"} if k != len(s.moves) else v)
                                for k, v in s.results.items()}}


PAGE = r"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>대국 라이브</title><style>
:root{--bg:#f6f5f2;--fg:#1d1d1f;--mut:#6b6b70;--card:#fff;--line:#e3e1dc;--wood:#e6c48a;--grid:#5a4320;--b:#111;--w:#fafafa;--acc:#2f6fdb;--good:#1f9d55;--bad:#d64545}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#17181a;--fg:#ececec;--mut:#9a9aa0;--card:#202124;--line:#34353a;--wood:#b8935a;--grid:#3a2a10}}
:root[data-theme="dark"]{--bg:#17181a;--fg:#ececec;--mut:#9a9aa0;--card:#202124;--line:#34353a;--wood:#b8935a;--grid:#3a2a10}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 -apple-system,"Apple SD Gothic Neo",sans-serif}
.wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;padding:16px;max-width:1200px;margin:auto}
@media (max-width:820px){.wrap{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}
h2{font-size:13px;color:var(--mut);margin:0 0 8px;font-weight:600}
.big{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}.row{display:flex;gap:16px;align-items:baseline}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}td{padding:4px 2px;border-top:1px solid var(--line)}
.tag{display:inline-block;width:20px;height:20px;border-radius:50%;color:#fff;text-align:center;font-weight:700;font-size:12px;line-height:20px}
.err{color:var(--bad);font-weight:600}.mut{color:var(--mut)}pre{margin:0;font-size:11px;white-space:pre-wrap;color:var(--mut)}
svg{display:block;width:100%;height:auto}.cxrow{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px}.cxbar{flex:1;height:8px;border-radius:4px;background:var(--line);overflow:hidden}#cxf{height:100%;width:0;background:linear-gradient(90deg,#3aa76d,#e0a43a,#d64545);transition:width .6s}.chips{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;font-variant-numeric:tabular-nums}.chip{padding:3px 8px;border-radius:999px;border:1px solid var(--line);color:var(--mut)}.chip b{color:var(--fg);font-weight:600}.chip.warn{border-color:var(--bad);color:var(--bad)}#board{max-height:64vh;margin:auto}body.embed{background:transparent}body.embed .wrap{grid-template-columns:1fr;padding:0;gap:8px}body.embed .card{padding:10px}body.embed .big{font-size:22px}body.embed #boardCard{display:none}.bar{display:flex;height:26px;border-radius:6px;overflow:hidden;border:1px solid #888;margin-top:12px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}.bar div{display:flex;align-items:center;padding:0 8px;transition:width .6s;white-space:nowrap}#barb{background:#111;color:#fff}#barw{background:#fafafa;color:#111;justify-content:flex-end;flex:1}
</style></head><body><div class="wrap">
<div><div class="card" id="boardCard"><div class="row" style="justify-content:space-between"><h2 id="title">대국 라이브</h2><span class="mut" id="mv"></span></div>
<svg id="board" viewBox="0 0 400 400"></svg></div>
<div class="card" style="margin-top:12px"><h2>형세 흐름 — 흑 승률(파랑)·집 차이(점선)·복잡도(주황)</h2><svg id="graph" viewBox="0 0 600 160"></svg></div></div>
<div><div class="card"><h2>현재 형세</h2><div class="row"><div><div class="mut">흑 승률</div><div class="big" id="wr">–</div></div><div><div class="mut">집 차이</div><div class="big" id="sc">–</div></div></div><div class="bar"><div id="barb" style="width:50%">흑</div><div id="barw">백</div></div><div class="cxrow"><span class="mut">복잡도</span><div class="cxbar"><div id="cxf"></div></div><b id="cxv">–</b><span id="cxl" class="mut"></span></div><div id="err" class="err"></div></div>
<div class="card" style="margin-top:12px"><h2>추천수 (다음 차례 <span id="turn"></span>)</h2><table id="top"></table></div>
<div class="card sys" style="margin-top:12px"><h2>시스템</h2><div id="sys" class="chips"></div></div></div></div>
<script>
const L="ABCDEFGHJKLMNOPQRST",C=["#2f6fdb","#1f9d55","#c98a12","#8a5cd6","#888"],N=19,S=20,O=20;
const xy=m=>{if(!m||m.toLowerCase()==="pass")return null;const x=L.indexOf(m[0]),y=N-parseInt(m.slice(1));return[O+x*S,O+y*S]};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function board(moves,res){const g=[],st={};
 // 따냄 반영 — 간이 규칙 엔진
 const grid=Array.from({length:N},()=>Array(N).fill(null));const nb=(x,y)=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<N&&b<N);
 const grp=(x,y)=>{const c=grid[y][x],seen=new Set([x+","+y]),q=[[x,y]];let lib=0;const libs=new Set();while(q.length){const[a,b]=q.pop();for(const[u,v]of nb(a,b)){const k=u+","+v;if(grid[v][u]===null)libs.add(k);else if(grid[v][u]===c&&!seen.has(k)){seen.add(k);q.push([u,v])}}}return[seen,libs.size]};
 moves.forEach(([c,m],i)=>{if(m.toLowerCase()==="pass")return;const x=L.indexOf(m[0]),y=N-parseInt(m.slice(1));grid[y][x]=c;
  for(const[u,v]of nb(x,y)){if(grid[v][u]&&grid[v][u]!==c){const[s,l]=grp(u,v);if(l===0)s.forEach(k=>{const[a,b]=k.split(",").map(Number);grid[b][a]=null})}}});
 g.push(`<rect width="400" height="400" fill="${css('--wood')}" rx="6"/>`);
 const rr=res[String(moves.length)];if(rr&&rr.osd&&rr.osd.length===361)rr.osd.forEach((v,i)=>{const a=Math.max(0,Math.min(.55,(v-.35)*.9));if(a>0.02)g.push(`<rect x="${O+(i%N)*S-S/2}" y="${O+Math.floor(i/N)*S-S/2}" width="${S}" height="${S}" fill="#e0453a" opacity="${a.toFixed(2)}"/>`)});
 for(let i=0;i<N;i++){g.push(`<line x1="${O}" y1="${O+i*S}" x2="${O+18*S}" y2="${O+i*S}" stroke="${css('--grid')}" stroke-width=".7"/><line x1="${O+i*S}" y1="${O}" x2="${O+i*S}" y2="${O+18*S}" stroke="${css('--grid')}" stroke-width=".7"/>`)}
 [3,9,15].forEach(a=>[3,9,15].forEach(b=>g.push(`<circle cx="${O+a*S}" cy="${O+b*S}" r="2.2" fill="${css('--grid')}"/>`)));
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=grid[y][x];if(c)g.push(`<circle cx="${O+x*S}" cy="${O+y*S}" r="9.4" fill="${c==="B"?"#111":"#fafafa"}" stroke="#222" stroke-width=".6"/>`)}
 const last=moves[moves.length-1],p=last&&xy(last[1]);if(p)g.push(`<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#e0453a"/>`);
 const r=res[String(moves.length)];if(r)r.top.slice(0,3).forEach((t,i)=>{const q=xy(t.move);if(!q||grid[N-parseInt(t.move.slice(1))][L.indexOf(t.move[0])])return;
  g.push(`<circle cx="${q[0]}" cy="${q[1]}" r="9" fill="${C[i]}" opacity=".85"/><text x="${q[0]}" y="${q[1]+3.6}" font-size="10" font-weight="700" text-anchor="middle" fill="#fff">${"ABC"[i]}</text>`)});
 document.getElementById("board").innerHTML=g.join("")}
function graph(n,res){const W=600,H=160,P=24,g=[];const X=k=>P+(W-2*P)*k/Math.max(n,20),Y=v=>P/2+(H-P)*(1-v);
 g.push(`<line x1="${P}" x2="${W-P}" y1="${Y(.5)}" y2="${Y(.5)}" stroke="${css('--line')}" stroke-dasharray="3 3"/>`);
 g.push(`<text x="2" y="${Y(1)+4}" font-size="10" fill="${css('--mut')}">100</text><text x="2" y="${Y(.5)+4}" font-size="10" fill="${css('--mut')}">50</text><text x="8" y="${Y(0)+4}" font-size="10" fill="${css('--mut')}">0</text>`);
 const ks=Object.keys(res).map(Number).sort((a,b)=>a-b);
 const wl=ks.map(k=>`${X(k)},${Y(res[k].winrate)}`).join(" ");const sl=ks.map(k=>`${X(k)},${Y(Math.max(0,Math.min(1,.5+res[k].scoreLead/60)))}`).join(" ");
 const cl=ks.filter(k=>res[k].cx!=null).map(k=>`${X(k)},${Y(res[k].cx/100)}`).join(" ");g.push(`<polyline points="${cl}" fill="none" stroke="#e0a43a" stroke-width="1.2" opacity=".9"/>`);
 g.push(`<polyline points="${sl}" fill="none" stroke="${css('--mut')}" stroke-dasharray="4 3" stroke-width="1.2"/><polyline points="${wl}" fill="none" stroke="${css('--acc')}" stroke-width="2"/>`);
 document.getElementById("graph").innerHTML=g.join("")}
async function tick(){try{const s=await (await fetch("/api/state")).json();const n=s.moves.length;
 document.getElementById("title").textContent=`타이젬 대국 라이브 — 우리 ${s.me==="b"?"흑":"백"} · ${s.log}`;
 document.getElementById("mv").textContent=`${n}수`;document.getElementById("err").textContent=s.error||"";
 board(s.moves,s.results);graph(n,s.results);
 const ks=Object.keys(s.results).map(Number).filter(k=>k<=n).sort((a,b)=>b-a);const r=s.results[String(n)]||s.results[String(ks[0])];
 if(r){document.getElementById("wr").textContent=(r.winrate*100).toFixed(1)+"%";const d=r.scoreLead;document.getElementById("sc").textContent=(d>=0?"흑 +":"백 +")+Math.abs(d).toFixed(1);const b=r.winrate*100;const bb=document.getElementById("barb");bb.style.width=Math.max(4,Math.min(96,b))+"%";bb.textContent="흑 "+b.toFixed(1)+"%";document.getElementById("barw").textContent="백 "+(100-b).toFixed(1)+"%";
  if(r.cx!=null){document.getElementById("cxf").style.width=r.cx+"%";document.getElementById("cxv").textContent=r.cx;document.getElementById("cxl").textContent=r.cx>=60?"복잡 — 승부처":r.cx>=30?"긴장":"평이"}}
 document.getElementById("turn").textContent=n%2===0?"흑":"백";
 const cur=s.results[String(n)];document.getElementById("top").innerHTML=cur?cur.top.map((t,i)=>`<tr><td><span class="tag" style="background:${C[i]}">${i<3?"ABC"[i]:i+1}</span></td><td><b>${t.move}</b></td><td>${(t.winrate*100).toFixed(1)}%</td><td>${t.scoreLead>=0?"흑+":"백+"}${Math.abs(t.scoreLead).toFixed(1)}</td><td class="mut">${t.visits}v</td></tr>`).join(""):`<tr><td class="mut">분석 중…</td></tr>`;
 const y=s.sys||{},ch=[];const c=(t,v,w)=>ch.push(`<span class="chip${w?" warn":""}">${t} <b>${v}</b></span>`);
 if(y.gpu!=null)c("GPU",y.gpu+"%");if(y.load!=null)c("부하",y.load,y.load>12);c("CPU 속도",(y.speed??100)+"%",(y.speed??100)<100);
 if(y.think!=null)c("우리 생각",y.think+"초 · 최근10 "+y.thinkAvg+"초");if(y.err)c("측정 오류",y.err,1);
 document.getElementById("sys").innerHTML=ch.join("")}catch(e){document.getElementById("err").textContent="❌ 서버 응답 없음"}}
if(new URLSearchParams(location.search).has("embed")){document.body.classList.add("embed");const gc=document.getElementById("graph").closest(".card"),tp=document.getElementById("top").closest(".card");gc.style.marginTop="12px";tp.after(gc)}
tick();setInterval(tick,2000);
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("log", nargs="?")
    ap.add_argument("--port", type=int, default=8770)
    ap.add_argument("--visits", type=int, default=160)
    ap.add_argument("--komi", type=float, default=6.5)
    ap.add_argument("--goboard", nargs="?", const="http://127.0.0.1:8765/api/state", help="우리 웹 바둑판 대국을 분석(기본 8765)")
    ap.add_argument("--pre", default="", help="로그 앞에 놓을 수, 예: B D3,W Q16")
    a = ap.parse_args()
    st = State(a.log or ("" if a.goboard else latest_log()), a.visits, a.komi, [tuple(x.split()) for x in a.pre.split(",") if x.strip()], a.goboard)

    class H(BaseHTTPRequestHandler):
        def log_message(self, *x):
            pass

        def do_GET(self):
            if self.path == "/api/state":
                body, ct = json.dumps(st.snapshot(), ensure_ascii=False).encode(), "application/json; charset=utf-8"
            elif self.path.split("?")[0] == "/":
                body, ct = PAGE.encode(), "text/html; charset=utf-8"
            else:
                self.send_response(404); self.end_headers(); return
            self.send_response(200); self.send_header("Content-Type", ct); self.send_header("Cache-Control", "no-store")
            self.end_headers(); self.wfile.write(body)

    print(f"관전: http://127.0.0.1:{a.port}/  로그: {st.log}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", a.port), H).serve_forever()


if __name__ == "__main__":
    main()
