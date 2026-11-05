#!/usr/bin/env python3
"""유튜브 바둑 해설 목록화(다운로드 없음) — 채널 영상·라이브 목록을 yt-dlp --flat-playlist로 받아 해설자 분류 → catalog.jsonl (PF_GO, 11-05 21:52)
  catalog.py fetch            채널 원목록 → ~/.monkos/go-commentary-yt/catalog/raw_<채널>_<탭>.json
  catalog.py build            원목록 → catalog.jsonl(id·채널·제목·길이·게시일·해설자·대국자·기전 추정) + 요약
내부 연구 전용: 로그인·쿠키 없음, 메타데이터만. 데이터는 레포 밖.
"""
import json, re, subprocess, sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

OUT = Path.home() / ".monkos" / "go-commentary-yt" / "catalog"
CHANNELS = {  # 11-05 21:52 실측(검색 메타): 바둑TV 공식·이현욱 개인
    "baduktv": "https://www.youtube.com/channel/UC_kyhuCGhgbur6g7NJ_Nrqw",
    "leehyunwook": "https://www.youtube.com/channel/UC3IGAaL0LQDARZMowdJnAog",
}
TABS = ("videos", "streams")
COMMENTATORS = {"목진석": ["목진석"], "이현욱": ["이현욱"], "송태곤": ["송태곤"]}
TOURNAMENT = re.compile(r"(\d{4}\s*)?([가-힣A-Za-z]+(?:배|리그|전|대회|오픈|챔피언십|컵))")
VS = re.compile(r"([가-힣]{2,4})\s*(?:\d+단)?\s*(?:VS|vs|Vs|대)\s*([가-힣]{2,4})")


def fetch():
    OUT.mkdir(parents=True, exist_ok=True)
    for ch, url in CHANNELS.items():
        for tab in TABS:
            p = OUT / f"raw_{ch}_{tab}.json"
            r = subprocess.run([sys.executable, "-m", "yt_dlp", "--flat-playlist", "-J", f"{url}/{tab}"], capture_output=True, text=True)
            if r.returncode != 0 or not r.stdout.strip():
                print(f"⚠️ {ch}/{tab}: 목록 실패 — {r.stderr.strip()[-200:]}")
                continue
            p.write_text(r.stdout)
            n = len(json.loads(r.stdout).get("entries") or [])
            print(f"{ch}/{tab}: {n}편 → {p}")


def mentions(title):
    return [k for k, keys in COMMENTATORS.items() if any(x in title for x in keys)]


def who(title, ch, desc_map):
    """해설자 — 개인 채널은 본인. 바둑TV는 설명의 '해설:'(desc_scan·Data API)이 정본, 없으면 '?'(제목 이름은 대국자일 수 있어 해설자로 보지 않는다)."""
    if ch == "leehyunwook":
        return ["이현욱"], "channel"
    return (desc_map[1], "description") if desc_map and desc_map[1] else (["?"], None)


def build():
    desc = {}  # 설명에서 읽은 해설·진행(desc_scan.jsonl 또는 Data API 결과)
    for f in (OUT / "desc_scan.jsonl", OUT / "desc_api.jsonl"):
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                try:
                    j = json.loads(line)
                except json.JSONDecodeError:
                    continue
                desc[j["id"]] = (j.get("date"), j.get("commentator") or [], j.get("caster") or [])
    rows = []
    for ch in CHANNELS:
        for tab in TABS:
            p = OUT / f"raw_{ch}_{tab}.json"
            if not p.exists():
                continue
            for e in json.loads(p.read_text()).get("entries") or []:
                t = e.get("title") or ""
                m = VS.search(t)
                tm = TOURNAMENT.search(t)
                ts = e.get("timestamp") or e.get("release_timestamp")
                dm = desc.get(e.get("id"))
                com, src = who(t, ch, dm)
                rows.append({"id": e.get("id"), "channel": ch, "tab": tab, "title": t, "duration": e.get("duration"),
                             "date": datetime.fromtimestamp(ts).strftime("%Y-%m-%d") if ts else ((dm and dm[0]) or e.get("upload_date") or None),
                             "views": e.get("view_count"), "commentator": com, "commentator_src": src,
                             "caster": (dm[2] if dm else []) or [], "mentions": mentions(t),
                             "players": list(m.groups()) if m else None, "event": tm.group(0).strip() if tm else None})
    seen, uniq = set(), []
    for r in rows:
        if r["id"] in seen:
            continue
        seen.add(r["id"]); uniq.append(r)
    with open(OUT.parent / "catalog.jsonl", "w", encoding="utf-8") as f:
        for r in uniq:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"catalog.jsonl {len(uniq)}편 → {OUT.parent / 'catalog.jsonl'}")
    by = defaultdict(list)
    for r in uniq:
        for c in r["commentator"]:
            by[(c, r["channel"])].append(r)
    cand = Counter(m for r in uniq if r["channel"] == "baduktv" and r["commentator"] == ["?"] for m in r["mentions"])
    print("바둑TV 해설자 미확정 중 제목 언급(대국자일 수 있음 — 설명 확인 대상):", dict(cand))
    print("| 해설자 | 채널 | 편수 | 총 시간 | 연도 분포 |")
    print("|---|---|---|---|---|")
    for (c, ch), rs in sorted(by.items(), key=lambda kv: (kv[0][0] == "?", kv[0])):
        hours = sum((r["duration"] or 0) for r in rs) / 3600
        years = Counter((r["date"] or "????")[:4] for r in rs)
        print(f"| {c} | {ch} | {len(rs)} | {hours:.0f}시간 | {', '.join(f'{y}:{n}' for y, n in sorted(years.items()))} |")


if __name__ == "__main__":
    {"fetch": fetch, "build": build}[sys.argv[1]]()
