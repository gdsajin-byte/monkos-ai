#!/usr/bin/env python3
"""유료 정답지 선별 — 해설자별 조회수 상위 10편(30편) + 캐스터 류승희·문도원 진행 편 포함 + 실제 해설 구간(자동 자막 밀도 최대 60분) (PF_GO, 11-05 23:06 작가님 예산 ₩25,000)
  answers_select.py   → ~/.monkos/go-commentary-yt/answers/selection.json
구간: 자동 자막(무료) 글자 수가 가장 많은 연속 60분(짧은 영상은 전체). Pro 영상 20분은 그 60분 안에서 다시 밀도 최대.
"""
import json, subprocess, sys
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt"
OUT = B / "answers"
OUT.mkdir(parents=True, exist_ok=True)
WHO = ("목진석", "이현욱", "송태곤")
WANT_CAST = ("류승희", "문도원")
api = {json.loads(l)["id"]: json.loads(l) for l in (B / "catalog" / "desc_api.jsonl").read_text(encoding="utf-8").splitlines()}
rows = [json.loads(l) for l in (B / "catalog.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]


def views(r):
    return (api.get(r["id"]) or {}).get("views", 0)


def subs(vid):
    d = OUT / "subs"
    d.mkdir(exist_ok=True)
    f = next(d.glob(f"{vid}*.json3"), None)
    if not f:
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--skip-download", "--write-auto-subs", "--sub-langs", "ko", "--sub-format", "json3",
                        "-o", str(d / vid), f"https://www.youtube.com/watch?v={vid}"], capture_output=True)
        f = next(d.glob(f"{vid}*.json3"), None)
    if not f:
        return []
    ev = json.loads(f.read_text()).get("events", [])
    return [(e.get("tStartMs", 0) / 1000, len("".join(s.get("utf8", "") for s in e.get("segs") or []).strip())) for e in ev]


def densest(ev, dur, win, lo=0, hi=None):
    hi = hi if hi is not None else dur
    if hi - lo <= win:
        return lo, sum(c for t, c in ev if lo <= t < hi)
    best = (lo, -1)
    for st in range(int(lo), int(hi - win) + 1, 60):
        c = sum(n for t, n in ev if st <= t < st + win)
        if c > best[1]:
            best = (st, c)
    return best


sel = []
for w in WHO:
    cand = sorted([r for r in rows if w in r["commentator"] and (r.get("duration") or 0) >= 600], key=lambda r: -views(r))
    top = cand[:10]
    if w != "이현욱":  # 캐스터 류승희·문도원 진행 편이 없으면 상위 밖에서 하나씩 바꿔 넣는다
        for c in WANT_CAST:
            if not any(c in (r.get("caster") or []) for r in top):
                extra = next((r for r in cand[10:] if c in (r.get("caster") or [])), None)
                if extra:
                    top[-1] = extra
    for r in top:
        dur = r.get("duration") or (api.get(r["id"]) or {}).get("duration") or 0
        ev = subs(r["id"])
        s60, c60 = densest(ev, dur, 3600)
        e60 = min(dur, s60 + 3600)
        s20, c20 = densest(ev, dur, 1200, s60, e60)
        sel.append({"id": r["id"], "commentator": w, "caster": r.get("caster") or [], "views": views(r), "duration": dur,
                    "title": r["title"], "win60": [int(s60), int(e60)], "chars60": c60, "win20": [int(s20), int(min(e60, s20 + 1200))],
                    "auto_subs": bool(ev)})
        print(f"{w} {r['id']} {views(r):,}회 {dur // 60}분 캐스터 {r.get('caster') or '-'} → 60분 {int(s60) // 60}~{int(e60) // 60}분(자막 {c60}자)", flush=True)
(OUT / "selection.json").write_text(json.dumps(sel, ensure_ascii=False, indent=1))
print(f"선별 {len(sel)}편 → {OUT / 'selection.json'}")
