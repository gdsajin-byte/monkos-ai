#!/usr/bin/env python3
"""이현욱 개인 영상(생중계 제외) 후보 표 + 일괄 판독·짝 맞춤 (PF_GO, 11-07 막내2, 무료·로컬)
  lhw_batch.py cands [N]        → 후보 표(목록 raw_leehyunwook_videos.json: 5~30분 · 한글 제목 · 조회수 순) 출력
  lhw_batch.py fetch ID…        → ~/.monkos/go-commentary-yt/lhw/{ID}/ video720.mp4(무음 720p 이하) + subs.ko.json3 + frames1/(1초)
  lhw_batch.py run ID…          → calib(자동, 실패 시 calib_box.json 상자) → read → events → pair
  lhw_batch.py merge ID…        → lhw/pairs_v0.jsonl (영상 순서대로 이어 붙임) + 요약 출력
"""
import json, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
R = Path.home() / ".monkos" / "go-commentary-yt"
L = R / "lhw"


def cands(n=30):
    e = json.loads((R / "catalog" / "raw_leehyunwook_videos.json").read_text())["entries"]
    c = [x for x in e if x.get("duration") and 300 <= x["duration"] <= 1800 and re.search("[가-힣]", x["title"] or "")]
    c.sort(key=lambda x: -(x.get("view_count") or 0))
    for i, x in enumerate(c[:n], 1):
        kind = "명국선" if "명국" in x["title"] else "하이라이트" if "하이라이트" in x["title"] else "AI대국" if re.search("AI|카타고|그린스팟", x["title"]) else "기타"
        print(f"| {i} | {x['id']} | {x['duration'] // 60}:{x['duration'] % 60:02d} | {x['view_count']:,} | {kind} | {x['title'][:60].replace('|', '/')} |")
    return c


def ff():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def fetch(vid):
    d = L / vid; d.mkdir(parents=True, exist_ok=True)
    url = f"https://www.youtube.com/watch?v={vid}"
    if not (d / "video720.mp4").exists():
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "-f", "bv*[height<=720][vcodec^=avc1]/bv*[height<=720]", "-o", str(d / "video720.mp4"), url], check=True)
    if not list(d.glob("*.json3")):
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--skip-download", "--write-auto-subs", "--sub-langs", "ko", "--sub-format", "json3", "-o", str(d / "subs"), url])
    fd = d / "frames1"
    if not fd.exists():
        fd.mkdir()
        subprocess.run([ff(), "-loglevel", "error", "-i", str(d / "video720.mp4"), "-vf", "fps=1,scale=1280:-2", "-q:v", "2", str(fd / "f_%05d.jpg")], check=True)
    print(vid, "프레임", len(list(fd.glob("*.jpg"))), "자막", bool(list(d.glob("*.json3"))), flush=True)


def run(vid):
    import lhw_read, lhw_events, lhw_pair
    d = L / vid
    box = json.loads((d / "calib_box.json").read_text()) if (d / "calib_box.json").exists() else None
    if not (d / "calib.json").exists() or box:
        lhw_read.calib(str(d), box)
    lhw_read.read(str(d))
    lhw_events.run(str(d))
    if list(d.glob("*.json3")):
        lhw_pair.run(str(d), vid)


def merge(ids):
    rows, summ = [], []
    for vid in ids:
        f = L / vid / "pairs.jsonl"
        ev = json.loads((L / vid / "events.json").read_text())
        rs = [json.loads(x) for x in f.read_text().splitlines()] if f.exists() else []
        rows += rs
        summ.append({"id": vid, "sentences": len(rs), "with_events": sum(1 for r in rs if r["events"]), "in_var": sum(1 for r in rs if r["pos"]["var"]),
                     "main": len(ev["main"]), "vars": len(ev["vars"]), "var_stones": sum(len(v["final"]) for v in ev["vars"]), "navs": len(ev["navs"])})
    with open(L / "pairs_v0.jsonl", "w") as fo:
        for r in rows:
            fo.write(json.dumps(r, ensure_ascii=False) + "\n")
    (L / "pairs_v0_summary.json").write_text(json.dumps(summ, ensure_ascii=False, indent=1))
    for s in summ:
        print(s)
    print("합", len(rows), "문장")


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "cands":
        cands(int(args[0]) if args else 30)
    elif cmd == "fetch":
        for v in args:
            fetch(v)
    elif cmd == "run":
        for v in args:
            run(v)
    else:
        merge(args)
