#!/usr/bin/env python3
"""이현욱 일반 영상 일괄 — 프레임 저장 없이 스트리밍 판독 → 사건 → 짝 (PF_GO, 11-07 막내2, 무료·로컬)
  lhw_stream.py pick N            → lhw/_batch100/pick.json  (후보: 5~30분·한글 제목·조회수 순, v0 10편·AI 대국 제외)
  lhw_stream.py run [작업자 수]    → pick 순서대로 처리, 영상마다 lhw/_batch100/log.jsonl 1행(ok|skip 사유) — 이어 하기 가능
  lhw_stream.py merge             → lhw/pairs_v1.jsonl (v0 9편 + 통과 영상) + 요약
영상당: 720p 무음 받기(video720.mp4 보관 — 육안 대조 때 그 초만 다시 뽑는다) + 자동 자막 json3 + 보정용 프레임 12장(calib_frames/)만 저장.
1초 프레임은 ffmpeg 원시 화소 파이프로 읽고 버린다(100편 × 약 140MB JPG 절약).
건너뛰기(목록화):
  · 판 크기 변동: 앞 절반·뒤 절반 프레임으로 따로 격자 보정 → 칸 간격 차 2%↑ (11-07 Pg7KyHEV_fA 유형)
  · 판독 실패: 판 보인 프레임 70% 미만 또는 실전 수 20 미만
  · 자막 없음: 자동 자막 json3 없음(판독은 남기고 짝만 생략)
"""
import json, re, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
R = Path.home() / ".monkos" / "go-commentary-yt"
L = R / "lhw"
BD = L / "_batch100"
V0 = ["CpjWJPRJI3k", "K9mM3vHRcwQ", "0ZZMMBeDMi0", "iaohvJydBdY", "-mFzbFsBx7s", "ZWkE8DpX9rI", "5BNgsb8UiZE", "6KG21NmMCuU", "_4C8JLF98Ns", "Pg7KyHEV_fA"]
W, H = 1280, 720


def ff():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def pick(n):
    e = json.loads((R / "catalog" / "raw_leehyunwook_videos.json").read_text())["entries"]
    c = [x for x in e if x.get("duration") and 300 <= x["duration"] <= 1800 and re.search("[가-힣]", x["title"] or "")
         and x["id"] not in V0 and not re.search("AI|카타고|그린스팟|인공지능", x["title"])]
    c.sort(key=lambda x: -(x.get("view_count") or 0))
    out = [{"id": x["id"], "dur": x["duration"], "views": x["view_count"], "title": x["title"]} for x in c[:n]]
    BD.mkdir(parents=True, exist_ok=True)
    (BD / "pick.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print("후보", len(c), "→", len(out))


def fetch(vid, d):
    url = f"https://www.youtube.com/watch?v={vid}"
    if not (d / "video720.mp4").exists():
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "-f", "bv*[height<=720][vcodec^=avc1]/bv*[height<=720]",
                        "-o", str(d / "video720.mp4"), url], check=True, capture_output=True)
    if not list(d.glob("*.json3")):
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--skip-download", "--write-auto-subs", "--sub-langs", "ko",
                        "--sub-format", "json3", "-o", str(d / "subs"), url], capture_output=True)


def calib_frames(d, dur):
    cd = d / "calib_frames"; cd.mkdir(exist_ok=True)
    ts = [int(dur * (i + 0.5) / 12) for i in range(12)]
    for i, t in enumerate(ts):
        f = cd / f"f_{i + 1:05d}.jpg"
        if not f.exists():
            subprocess.run([ff(), "-loglevel", "error", "-ss", str(t), "-i", str(d / "video720.mp4"), "-frames:v", "1", "-vf", f"scale={W}:{H}",
                            "-q:v", "2", str(f)], check=True)
    return cd


def calib(d, dur):
    import board_read
    cd = calib_frames(d, dur)
    res = board_read.calib(str(cd))
    (d / "calib.json").write_text(json.dumps(res))
    # 판 크기 변동 검사: 앞 6장 / 뒤 6장 따로 보정
    half = []
    for part in ("a", "b"):
        hd = d / f"calib_{part}"; hd.mkdir(exist_ok=True)
        for i in range(6):
            src = cd / f"f_{(i + 1) if part == 'a' else (i + 7):05d}.jpg"
            dst = hd / f"f_{i + 1:05d}.jpg"
            if not dst.exists():
                dst.write_bytes(src.read_bytes())
        half.append(board_read.calib(str(hd)))
    drift = abs(half[0]["sx"] - half[1]["sx"]) / max(half[0]["sx"], half[1]["sx"])
    return res, round(drift, 4)


def stream_read(d):
    import lhw_read
    c = json.loads((d / "calib.json").read_text())
    p = subprocess.Popen([ff(), "-loglevel", "error", "-i", str(d / "video720.mp4"), "-vf", f"fps=1,scale={W}:{H}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    out, t = [], 0
    while True:
        buf = p.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        im = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.int16)
        g, mk, wf = lhw_read.classify(im, c)
        ho = []  # 번호 돌 중 가운데가 빈 것(고리 표시) — lhw_events 고리 방식 판별용(프레임 파일 대신)
        for k, ch in enumerate(g):
            if ch in "BW":
                x, y = int(round(c["x0"] + (k % 19) * c["sx"])), int(round(c["y0"] + (k // 19) * c["sy"]))
                gr = im[y - 2:y + 3, x - 2:x + 3].mean(axis=2)
                if (gr.min() > 170) if ch == "W" else (gr.max() < 110):
                    ho.append(k)
        out.append({"t": t, "g": g, "mk": mk, "vis": bool(wf > 0.8 and g.count(".") > 20), "ho": ho})
        t += 1
    p.wait()
    (d / "states.json").write_text(json.dumps(out))
    return out


def process(item):
    import lhw_events, lhw_pair
    vid = item["id"]; d = L / vid; d.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    rec = {"id": vid, "title": item["title"][:60], "dur": item["dur"]}
    try:
        if (d / "events.json").exists() and (d / "states.json").exists():
            rec["cached"] = True
        fetch(vid, d)
        res, drift = calib(d, item["dur"])
        rec["drift"] = drift
        if drift > 0.02:
            return rec | {"status": "skip", "why": f"판 크기 변동(앞뒤 칸 간격 차 {drift:.1%})", "secs": round(time.time() - t0)}
        st = stream_read(d)
        vis = sum(s["vis"] for s in st) / max(1, len(st))
        ev = lhw_events.run(str(d))
        rec |= {"frames": len(st), "vis": round(vis, 3), "main": len(ev["main"]), "vars": len(ev["vars"]), "style": ev["style"]}
        if vis < 0.7 or len(ev["main"]) < 20:
            return rec | {"status": "skip", "why": f"판독 실패(판 보임 {vis:.0%}, 실전 {len(ev['main'])}수)", "secs": round(time.time() - t0)}
        if not list(d.glob("*.json3")):
            return rec | {"status": "ok_nosubs", "secs": round(time.time() - t0)}
        rows = lhw_pair.run(str(d), vid)
        return rec | {"status": "ok", "sentences": len(rows), "basis": rows[0]["go_scene"]["move_no_basis"] if rows else None, "secs": round(time.time() - t0)}
    except Exception as e:
        return rec | {"status": "error", "why": repr(e)[:200], "secs": round(time.time() - t0)}


def run(workers=3):
    items = json.loads((BD / "pick.json").read_text())
    done = set()
    lf = BD / "log.jsonl"
    if lf.exists():
        done = {json.loads(x)["id"] for x in lf.read_text().splitlines() if x.strip()}
    todo = [x for x in items if x["id"] not in done]
    print("처리할 영상", len(todo), "/", len(items), flush=True)
    with ProcessPoolExecutor(workers) as ex:
        for r in ex.map(process, todo):
            with open(lf, "a") as f:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
            print(r["status"], r["id"], r.get("why") or f"실전 {r.get('main')} · 변화도 {r.get('vars')} · 문장 {r.get('sentences')}", f"{r['secs']}s", flush=True)


def merge():
    log = [json.loads(x) for x in (BD / "log.jsonl").read_text().splitlines() if x.strip()]
    ids = [x for x in V0 if x != "Pg7KyHEV_fA"] + [r["id"] for r in log if r["status"] == "ok"]
    n = 0
    with open(L / "pairs_v1.jsonl", "w") as fo:
        for vid in ids:
            f = L / vid / "pairs.jsonl"
            if f.exists():
                for line in f.read_text().splitlines():
                    fo.write(line + "\n"); n += 1
    from collections import Counter
    c = Counter(r["status"] for r in log)
    basis = Counter(r.get("basis") for r in log if r["status"] == "ok")
    summ = {"videos_ok": len(ids), "rows": n, "batch_status": dict(c), "batch_basis": dict(basis),
            "skipped": [{"id": r["id"], "why": r.get("why"), "title": r["title"]} for r in log if r["status"] in ("skip", "error")]}
    (L / "pairs_v1_summary.json").write_text(json.dumps(summ, ensure_ascii=False, indent=1))
    print(json.dumps({k: v for k, v in summ.items() if k != "skipped"}, ensure_ascii=False))


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "pick":
        pick(int(sys.argv[2]) if len(sys.argv) > 2 else 100)
    elif cmd == "run":
        run(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
    else:
        merge()
