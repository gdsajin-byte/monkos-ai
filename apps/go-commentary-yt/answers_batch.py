#!/usr/bin/env python3
"""유료 정답지 일괄 — selection.json 30편: Flash 3.8 음성만(60분, 10분 조각) + 해설자별 3편 Pro 3.1 영상(20분, 10분 2호출) (PF_GO, 11-05 23:06 작가님 ₩25,000)
  answers_batch.py [--dry-run]     → ~/.monkos/go-commentary-yt/answers/{ID}/{flash|pro}_{시작초}/gemini_full.json + ledger.jsonl
하드 상한 $17: 매 호출 전 (원장 누적 + 진행 중 예약 + 이번 호출 예상 상한)이 $17을 넘으면 호출하지 않고 멈춘다. 실패는 1회 재시도.
조각 음성(32k mp3)·자동 자막은 남긴다 — 다음 단계(같은 30편 로컬 무료 경로 대조) 입력.
"""
import json, os, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import imageio_ffmpeg

CAP = 17.0
PRICE = {"gemini-3.8-flash": (0.75, 3.75), "gemini-3.1-pro-preview": (2.0, 12.0)}  # 1M 토큰당 입력·출력(생각 포함), aistudio 11-05
EST = {"gemini-3.8-flash": 0.09, "gemini-3.1-pro-preview": 0.60}  # 10분 1호출 예상 상한(실측 0.053·0.395에 여유)
FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = Path(__file__).parent
B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
LEDGER = B / "ledger.jsonl"
DRY = "--dry-run" in sys.argv
sel = json.loads((B / "selection.json").read_text())
lock = threading.Lock()
reserved = [0.0]
stop = threading.Event()


def spent():
    if not LEDGER.exists():
        return 0.0
    return sum(json.loads(l)["usd"] for l in LEDGER.read_text().splitlines() if l.strip())


def usd(model, u):
    pi, po = PRICE[model]
    return u.get("promptTokenCount", 0) / 1e6 * pi + (u.get("candidatesTokenCount", 0) + (u.get("thoughtsTokenCount") or 0)) / 1e6 * po


def pro_pick(rows):
    """해설자별 Pro 3편: 조회수 상위 2 + 류승희/문도원 진행 편이 없으면 하나 넣기(없으면 3위)."""
    out = {}
    for w in ("목진석", "이현욱", "송태곤"):
        rs = [r for r in rows if r["commentator"] == w]
        pick = rs[:2]
        for c in ("류승희", "문도원"):
            if len(pick) < 3 and not any(c in r["caster"] for r in pick):
                x = next((r for r in rs[2:] if c in r["caster"]), None)
                if x:
                    pick.append(x)
        for r in rs:
            if len(pick) >= 3:
                break
            if r not in pick:
                pick.append(r)
        out[w] = [r["id"] for r in pick[:3]]
    return out


def audio(vid):
    d = B / vid
    d.mkdir(parents=True, exist_ok=True)
    f = next(d.glob("audio.*"), None)
    if not f:
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--ffmpeg-location", FF, "-f", "bestaudio[ext=m4a]/bestaudio",
                        "-o", str(d / "audio.%(ext)s"), f"https://www.youtube.com/watch?v={vid}"], check=True)
        f = next(d.glob("audio.*"))
    return f


def chunk(vid, src, s0, s1):
    f = B / vid / f"chunk_{s0}_{s1}_32k.mp3"
    if not f.exists():
        subprocess.run([FF, "-loglevel", "error", "-y", "-ss", str(s0), "-to", str(s1), "-i", str(src), "-ac", "1", "-b:a", "32k", str(f)], check=True)
    return f


def call(job):
    vid, kind, s0, s1, model, com, cas, mp3 = job
    out = B / vid / f"{kind}_{s0}"
    if (out / "gemini_full.json").exists():
        return "skip"
    for attempt in (1, 2):
        with lock:
            if stop.is_set():
                return "stopped"
            now = spent() + reserved[0]
            if now + EST[model] > CAP:
                stop.set()
                print(f"⛔ 상한 정지: 누적+예약 ${now:.2f} + 예상 ${EST[model]:.2f} > ${CAP} — {vid} {kind} {s0}", flush=True)
                return "stopped"
            reserved[0] += EST[model]
        try:
            env = dict(os.environ, GEMINI_MAX_OUT="16000")
            if mp3:
                env["GEMINI_AUDIO"] = str(mp3)
            (out / "gemini_full_usage.json").unlink(missing_ok=True) if out.exists() else None
            p = subprocess.run([sys.executable, str(HERE / "gemini_full.py"), vid, str(s0), str(s1), str(out), model, com, cas],
                               env=env, capture_output=True, text=True, timeout=2400)
            uf = out / "gemini_full_usage.json"
            u = json.loads(uf.read_text()) if uf.exists() else {}
            cost = usd(model, u.get("usage") or {}) if u else 0.0
            ok = p.returncode == 0
            row = {"t": time.strftime("%Y-%m-%d %H:%M:%S"), "id": vid, "kind": kind, "win": [s0, s1], "model": model, "attempt": attempt, "ok": ok,
                   "finish": u.get("finishReason"), "in": (u.get("usage") or {}).get("promptTokenCount", 0),
                   "out": (u.get("usage") or {}).get("candidatesTokenCount", 0), "think": (u.get("usage") or {}).get("thoughtsTokenCount", 0) or 0,
                   "usd": round(cost, 5), "err": None if ok else (p.stderr or p.stdout)[-300:]}
        except Exception as e:  # noqa: BLE001 — 타임아웃 등, 과금 불명은 예상 상한으로 적는다
            ok, cost = False, EST[model]
            row = {"t": time.strftime("%Y-%m-%d %H:%M:%S"), "id": vid, "kind": kind, "win": [s0, s1], "model": model, "attempt": attempt, "ok": False,
                   "finish": None, "in": 0, "out": 0, "think": 0, "usd": cost, "err": f"예외(과금 불명→예상 상한 기재): {e}"[:300]}
        with lock:
            reserved[0] -= EST[model]
            with LEDGER.open("a") as fh:
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(f"{'✅' if ok else '❌'} {vid} {kind} {s0}-{s1} ${cost:.3f} 누적 ${spent():.2f} {row['finish']} {'' if ok else row['err'][-120:]}", flush=True)
        if ok:
            return "ok"
    return "fail"


def main():
    pro = pro_pick(sel)
    jobs_f, jobs_p = [], []
    for r in sel:
        cas = ",".join(r["caster"])
        s60, e60 = r["win60"]
        for s in range(s60, e60, 600):
            jobs_f.append((r, "flash", s, min(e60, s + 600), "gemini-3.8-flash"))
        if r["id"] in pro[r["commentator"]] and "--flash-only" not in sys.argv:
            s20, e20 = r["win20"]
            for s in range(s20, e20, 600):
                jobs_p.append((r, "pro", s, min(e20, s + 600), "gemini-3.1-pro-preview"))
    est = len(jobs_f) * 0.053 + len(jobs_p) * 0.395
    print(f"Flash {len(jobs_f)}호출 · Pro {len(jobs_p)}호출 (Pro 대상 {pro}) · 실측 단가 기준 예상 ${est:.2f} · 원장 누적 ${spent():.2f} · 상한 ${CAP}", flush=True)
    if DRY:
        return
    # 음성 받기·조각(무료) — Flash 조각만 필요
    ready = []
    for r, kind, s0, s1, m in jobs_f:
        src = audio(r["id"])
        ready.append((r["id"], kind, s0, s1, m, r["commentator"], ",".join(r["caster"]), chunk(r["id"], src, s0, s1)))
    print(f"조각 {len(ready)}개 준비", flush=True)
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(call, ready))
        res += list(ex.map(call, [(r["id"], k, s0, s1, m, r["commentator"], ",".join(r["caster"]), None) for r, k, s0, s1, m in jobs_p]))
    from collections import Counter
    print(f"끝 {dict(Counter(res))} · 원장 누적 ${spent():.2f}", flush=True)


main()
