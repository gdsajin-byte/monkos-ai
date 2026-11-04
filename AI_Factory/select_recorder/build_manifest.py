#!/usr/bin/env python3
"""build_manifest.py — 맥북 셀렉 기록기 iMac 측 가공기 (stdlib만).

collect_mac.sh 메타 TSV + 시놀로지 촬영접수 파일명 색인 → 월별 manifest.jsonl.

  todo  : 아직 축소본이 없는 원본 상대경로 목록 (증분 회수 대상)
  build : 축소본 배치(새 파일만 복사) + 셀렉 대조 + 사람 묶음 + 매니페스트 병합 쓰기 + 검증 리포트

정답 정의(작가님 2026-11-04 17:28): 그 CR3 파일명이 촬영접수 고객 폴더에 있으면 셀렉.
별점(rating)=작가님, 색 태그(color_tag)=꾸 — 중간 선호 신호(보조 열).

⚠️ 리포트·로그에는 고객 이름을 쓰지 않는다 — customer_key(YYYYMMDD_NNN)만.
   매니페스트·축소본은 시놀로지 사내 보관만(레포·외부 전송 금지).
"""
import argparse
import csv
import datetime as dt
import json
import os
import re
import shutil
import statistics
import sys
import unicodedata
from collections import Counter, defaultdict

KST = dt.timezone(dt.timedelta(hours=9))
FOLDER_RE = re.compile(r"^(\d{8})\s*_(\d{3})")
PURPOSE_RE = re.compile(r"\(([^)]*)\)")
COLOR_NAMES = {0: None, 1: "red", 2: "orange", 3: "yellow", 4: "green", 5: "blue", 6: "pink", 7: "purple"}
ID_PURPOSE_TOKENS = ("증명", "여권", "운전", "민증", "비자", "여증", "여민", "고증")
DEFAULT_GAP = 120  # 초 — 근거는 README §묶음 규칙


def nfc(s):
    """시놀로지(SMB)·APFS 경로는 NFD 한글이 섞인다 — 비교 전 NFC로 통일."""
    return unicodedata.normalize("NFC", s) if s else s


def die(msg):
    print(f"❌ build_manifest: {msg}", file=sys.stderr)
    sys.exit(1)


def read_meta(path):
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f, delimiter="\t"))
    if not rows:
        die(f"메타 0행: {path}")
    need = {"file", "relpath", "source", "kind", "birth_epoch", "exp_epoch", "rating", "color_tag", "trashed"}
    if not need <= set(rows[0]):
        die(f"메타 열 불일치: {sorted(set(rows[0]))}")
    bad = [r["file"] for r in rows if not r["birth_epoch"]]
    if bad:
        die(f"촬영 시각 없는 행 {len(bad)}건: {bad[:5]}")
    # 열 밀림 가드 — 별점 0~5, 색 0~7, 휴지통 0/1 밖이면 수집 단계 결함
    bad = [r["file"] for r in rows
           if r["rating"] not in ("", "0", "1", "2", "3", "4", "5")
           or r["color_tag"] not in ("", "0", "1", "2", "3", "4", "5", "6", "7")
           or r["trashed"] not in ("0", "1")]
    if bad:
        die(f"메타 값 범위 이탈 {len(bad)}건(열 밀림 의심): {bad[:5]}")
    for r in rows:
        r["file"] = nfc(r["file"])
        r["relpath"] = nfc(r["relpath"])
        r["t"] = float(r["birth_epoch"])
        d = dt.datetime.fromtimestamp(r["t"], KST)
        r["shot_at"] = d.isoformat(timespec="seconds")
        r["day"] = d.strftime("%Y%m%d")
        r["month"] = d.strftime("%Y-%m")
        r["stem"] = os.path.splitext(r["file"])[0]
    return rows


def thumb_name(row):
    return row["stem"] + ".jpg"


def existing_thumbs(dest):
    have = set()
    if os.path.isdir(dest):
        for m in os.listdir(dest):
            td = os.path.join(dest, m, "thumbs")
            if os.path.isdir(td):
                have.update(nfc(n) for n in os.listdir(td) if n.lower().endswith(".jpg"))
    return have


def index_intake(intake_root):
    """파일명 → [(customer_key, purpose)], 고객 폴더 목록 {key: {day, purpose, n_cr3}}"""
    if not os.path.isdir(intake_root):
        die(f"촬영접수 경로 없음(마운트 확인): {intake_root}")
    by_file = defaultdict(list)
    folders = {}
    for dp, dn, fn in os.walk(intake_root):
        dn[:] = [d for d in dn if not d.startswith("#") and not d.startswith(".")]
        name = nfc(os.path.basename(dp))
        m = FOLDER_RE.match(name)
        if not m:
            continue
        key = f"{m.group(1)}_{m.group(2)}"
        pm = PURPOSE_RE.search(name)
        purpose = pm.group(1) if pm else None
        info = folders.setdefault(key, {"day": m.group(1), "purpose": purpose, "n_cr3": 0})
        for f in fn:
            if f.lower().endswith(".cr3"):
                info["n_cr3"] += 1
                by_file[nfc(f)].append((key, purpose))
    if not folders:
        die(f"촬영접수 고객 폴더 0건 — 조회 무효 의심: {intake_root}")
    return by_file, folders


def is_id_purpose(p):
    return bool(p) and any(tok in p for tok in ID_PURPOSE_TOKENS)


def group_rows(rows, gap):
    """같은 날·시간 연속 구간(간격 ≤ gap초) → 구간 내 셀렉 앵커로 고객 배정."""
    rows = sorted(rows, key=lambda r: r["t"])
    segs, cur = [], []
    for r in rows:
        if cur and (r["day"] != cur[-1]["day"] or r["t"] - cur[-1]["t"] > gap):
            segs.append(cur)
            cur = []
        cur.append(r)
    if cur:
        segs.append(cur)

    groups = []  # (key|None, rows, conf)
    for seg in segs:
        anchors = [(i, r["sel_keys"][0]) for i, r in enumerate(seg) if r["sel_keys"]]
        keys = []
        for _, k in anchors:
            if k not in keys:
                keys.append(k)
        if not keys:
            groups.append([None, seg, "none"])
            continue
        if len(keys) == 1:
            groups.append([keys[0], seg, "high"])
            continue
        # 2명 이상: 서로 다른 고객의 인접 앵커 사이에서 최대 간격 지점으로 자른다
        cuts = []
        for (i1, k1), (i2, k2) in zip(anchors, anchors[1:]):
            if k1 == k2:
                continue
            best = max(range(i1 + 1, i2 + 1), key=lambda j: seg[j]["t"] - seg[j - 1]["t"])
            cuts.append(best)
        bounds = [0] + cuts + [len(seg)]
        for a, b in zip(bounds, bounds[1:]):
            part = seg[a:b]
            pk = next((r["sel_keys"][0] for r in part if r["sel_keys"]), None)
            groups.append([pk, part, "low"])

    # 같은 고객이 인접 그룹으로 쪼개졌으면 병합(중간 신뢰)
    merged = []
    for g in groups:
        if merged and g[0] and merged[-1][0] == g[0] and merged[-1][1][-1]["day"] == g[1][0]["day"]:
            prev = merged[-1]
            prev[1] = prev[1] + g[1]
            prev[2] = "low" if "low" in (prev[2], g[2]) else "medium"
        else:
            merged.append(g)

    seen = Counter()
    unassigned = Counter()
    for key, part, conf in merged:
        if key:
            seen[key] += 1
            gid = key if seen[key] == 1 else f"{key}#{seen[key]}"
            if seen[key] > 1:
                conf = "low"
        else:
            day = part[0]["day"]
            unassigned[day] += 1
            gid = f"{day}_u{unassigned[day]:02d}"
        for r in part:
            r["group_id"] = gid
            r["group_key"] = key
            r["group_conf"] = conf
    return merged


def to_record(r, purpose_by_key, thumb_rel):
    key = r.get("group_key")
    ct = int(r["color_tag"]) if r["color_tag"] not in ("", None) else 0
    rt = int(r["rating"]) if r["rating"] not in ("", None) else 0
    return {
        "file": r["file"],
        "shot_at": r["shot_at"],
        "rating": rt,
        "color_tag": ct,
        "color_name": COLOR_NAMES.get(ct, str(ct)),
        "selected": bool(r["sel_keys"]),
        "selected_keys": r["sel_keys"],
        "customer_key": key,
        "purpose": purpose_by_key.get(key) if key else None,
        "group_id": r["group_id"],
        "group_conf": r["group_conf"],
        "trashed": r["trashed"] == "1",
        "c1_rotation": float(r["c1_rotation"]) if r.get("c1_rotation") not in ("", None) else None,
        "thumb_rotation_applied": 0,
        "source": f'{r["kind"]}:{r["source"]}',
        "relpath": r["relpath"],
        "thumb": thumb_rel,
    }


def cmd_todo(a):
    rows = read_meta(a.meta)
    have = existing_thumbs(a.dest)
    for r in rows:
        if thumb_name(r) not in have:
            print(r["relpath"])


def cmd_build(a):
    rows = read_meta(a.meta)
    by_file, folders = index_intake(a.intake)
    for r in rows:
        r["sel_keys"] = sorted({k for k, _ in by_file.get(r["file"], [])})
    purpose_by_key = {k: v["purpose"] for k, v in folders.items()}

    group_rows(rows, a.gap)

    # 축소본 배치 — 새 파일만 복사(기존 파일 덮어쓰기·삭제 없음)
    have = existing_thumbs(a.dest)
    copied, missing_thumb = 0, []
    for r in rows:
        tn = thumb_name(r)
        r["thumb_rel"] = None
        tdir = os.path.join(a.dest, r["month"], "thumbs")
        if tn in have or os.path.exists(os.path.join(tdir, tn)):
            r["thumb_rel"] = f"thumbs/{tn}"
            continue
        src = os.path.join(a.thumbs, tn) if a.thumbs else None
        if src and os.path.exists(src):
            if not a.dry_run:
                os.makedirs(tdir, exist_ok=True)
                shutil.copy2(src, os.path.join(tdir, tn))
            copied += 1
            r["thumb_rel"] = f"thumbs/{tn}"
        else:
            missing_thumb.append(r["relpath"])

    # 매니페스트 병합 — 맥북에서 사라진 과거 행은 보존, 현재 행은 갱신
    by_month = defaultdict(list)
    for r in rows:
        by_month[r["month"]].append(r)
    written = {}
    for month, mrows in sorted(by_month.items()):
        mdir = os.path.join(a.dest, month)
        mpath = os.path.join(mdir, "manifest.jsonl")
        old = {}
        if os.path.exists(mpath):
            with open(mpath, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        rec = json.loads(line)
                        old[rec["file"]] = rec
        for r in mrows:
            old[r["file"]] = to_record(r, purpose_by_key, r["thumb_rel"])
        recs = sorted(old.values(), key=lambda x: x["shot_at"])
        written[month] = len(recs)
        if not a.dry_run:
            os.makedirs(mdir, exist_ok=True)
            tmp = mpath + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                for rec in recs:
                    f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            os.replace(tmp, mpath)

    report = make_report(rows, folders, a.gap)
    report.update({"thumbs_copied": copied, "thumbs_missing": missing_thumb, "manifest_rows": written})
    out = json.dumps(report, ensure_ascii=False, indent=1)
    if a.report:
        with open(a.report, "w", encoding="utf-8") as f:
            f.write(out)
    print(out)
    if missing_thumb:
        print(f"⚠️ 축소본 없는 컷 {len(missing_thumb)}건", file=sys.stderr)


def make_report(rows, folders, gap):
    days = sorted({r["day"] for r in rows})
    lo, hi = days[0], days[-1]
    on_mac = {r["file"] for r in rows}
    sel_keys_on_mac = {k for r in rows for k in r["sel_keys"]}
    per_day = []
    for d in days:
        drows = [r for r in rows if r["day"] == d]
        fk = {k: v for k, v in folders.items() if v["day"] == d}
        sel = [r for r in drows if r["sel_keys"]]
        keys_matched = {k for r in sel for k in r["sel_keys"]}
        per_day.append({
            "day": d,
            "cuts": len(drows),
            "selected_cuts": len(sel),
            "intake_folders": len(fk),
            "intake_folders_with_cr3": sum(1 for v in fk.values() if v["n_cr3"]),
            "folders_matched": len(keys_matched & set(fk)),
            "folders_cr3_not_on_mac": sorted(k for k, v in fk.items() if v["n_cr3"] and k not in sel_keys_on_mac),
            "folders_without_cr3": sorted(k for k, v in fk.items() if not v["n_cr3"]),
            "selected_cross_day": sorted(k for k in keys_matched if k[:8] != d),
        })
    # 셀렉 파일명이 맥북 범위(날짜) 안 촬영접수에 있는데 맥북에 없는 CR3 수
    # 그룹 크기
    gsize = defaultdict(lambda: {"n": 0, "conf": None, "key": None})
    for r in rows:
        g = gsize[r["group_id"]]
        g["n"] += 1
        g["conf"] = r["group_conf"]
        g["key"] = r["group_key"]
    def dist(vals):
        if not vals:
            return {}
        return {"groups": len(vals), "median": statistics.median(vals), "min": min(vals), "max": max(vals),
                "hist": dict(sorted(Counter(vals).items()))}
    id_sizes = [g["n"] for g in gsize.values() if g["key"] and is_id_purpose(folders.get(g["key"], {}).get("purpose"))]
    other_sizes = [g["n"] for g in gsize.values() if g["key"] and not is_id_purpose(folders.get(g["key"], {}).get("purpose"))]
    conf = Counter(g["conf"] for g in gsize.values())
    unassigned_cuts = sum(g["n"] for g in gsize.values() if not g["key"])
    # 별·색·셀렉 겹침
    def bucket(r):
        rt = int(r["rating"] or 0)
        ct = int(r["color_tag"] or 0)
        return (f"별{rt}", COLOR_NAMES.get(ct) or "색없음")
    cross = Counter()
    for r in rows:
        b = bucket(r)
        cross[(b[0], b[1], "셀렉" if r["sel_keys"] else "비셀렉")] += 1
    multi_sel = sorted(r["file"] for r in rows if len(r["sel_keys"]) > 1)
    return {
        "range": [lo, hi],
        "gap_sec": gap,
        "cuts_total": len(rows),
        "cuts_trashed": sum(1 for r in rows if r["trashed"] == "1"),
        "selected_cuts": sum(1 for r in rows if r["sel_keys"]),
        "selected_in_multiple_folders": len(multi_sel),
        "per_day": per_day,
        "group_conf": dict(conf),
        "unassigned_cuts": unassigned_cuts,
        "group_size_id_purpose": dist(id_sizes),
        "group_size_other_purpose": dist(other_sizes),
        "rating_color_selected": {" / ".join(k): v for k, v in sorted(cross.items())},
    }


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    t = sp.add_parser("todo")
    t.add_argument("--meta", required=True)
    t.add_argument("--dest", required=True)
    b = sp.add_parser("build")
    b.add_argument("--meta", required=True)
    b.add_argument("--dest", required=True)
    b.add_argument("--intake", required=True, help="촬영접수/2026년_작업 등 고객 폴더 상위")
    b.add_argument("--thumbs", help="이번 회수분 축소본 임시 폴더")
    b.add_argument("--gap", type=float, default=DEFAULT_GAP)
    b.add_argument("--report")
    b.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    {"todo": cmd_todo, "build": cmd_build}[a.cmd](a)


if __name__ == "__main__":
    main()
