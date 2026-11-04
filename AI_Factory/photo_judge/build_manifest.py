#!/usr/bin/env python3
"""build_manifest.py — 사진 판별 학습 매니페스트 v0 (stdlib만).

입력 : ~/.monkos/photo_judge/listing.tsv  (scan_listing.py 산출 — 목록·크기만)
       (선택 --xmp) 사이드카 .xmp 본문(크롭 필드만 파싱)
산출 : ~/.monkos/photo_judge/manifest_v0.jsonl   고객 1행, 가명화 (DESIGN_20261103 §8-4)
       ~/.monkos/photo_judge/pathmap.jsonl       id·path_ref → 실제 경로 (비공개, 학습 기기 밖 반출 금지)
       stdout / --table-out                      §8-3 재현표(건수만 — 레포에 둘 수 있는 유일한 산출)

분류 규칙: README §분류 규칙. 가명화: README §가명화.
⚠️ 고객 이름·폴더명은 manifest·표·로그에 쓰지 않는다. listing.tsv·pathmap.jsonl은 레포 밖에만 둔다.
"""
import argparse
import hashlib
import json
import os
import re
import secrets
import sys
import unicodedata
from collections import Counter, defaultdict

HOME = os.path.expanduser("~/.monkos/photo_judge")
SHARES = {"intake": "/Volumes/촬영접수", "backup": "/Volumes/작업백업"}
HANAM_FROM = "20240601"  # 건대→하남 경계(키 날짜). 근거: README §시대 경계

RAW_EXT = {".cr2", ".cr3", ".dng"}
SIDECAR_EXT = {".xmp", ".acr", ".cos", ".cop", ".cof", ".cot", ".comask"}
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}
TIF_EXT = {".tif", ".tiff"}
PSD_EXT = {".psd", ".psb"}

# 규격(증명류) 용도 토큰 — 파일명 꼬리·폴더 (용도)에서 찾는다. 긴 것 먼저.
SPEC_TOKENS = ["민증운전", "운전민증", "미국비자", "중국비자", "일본비자", "인도비자", "캐나다비자",
               "베트남비자", "여권", "증명", "민증", "운전", "면허", "비자", "사원증", "이력서",
               "수능", "학생증", "자격증", "수험", "공무원", "여민", "고증", "여증", "이패", "프증"]
PRINT_LAYOUT_RE = re.compile(r"^\s*\d+R\s*\(|인화|4x6|5x7", re.I)
GUNDAE_OUT_RE = re.compile(r"출력용")
GUNDAE_WEB_RE = re.compile(r"웹용")
SV_RE = re.compile(r"sv", re.I)
RE_RE = re.compile(r"re", re.I)
KEY_RE = re.compile(r"^(\d{8})\s*_(\d{3})")
PAREN_RE = re.compile(r"\(([^)]*)\)")
SAFE_TOKEN_RE = re.compile(r"^[0-9A-Za-z가-힣]{1,12}$")
XMP_FIELDS = ("CropTop", "CropLeft", "CropBottom", "CropRight", "CropAngle", "HasCrop")
XMP_RE = {f: re.compile(r'crs:%s\s*=\s*"([^"]*)"|<crs:%s>([^<]*)</crs:%s>' % (f, f, f)) for f in XMP_FIELDS}
XMP_ORIENT_RE = re.compile(r'tiff:Orientation\s*=\s*"(\d)"|<tiff:Orientation>(\d)</tiff:Orientation>')


def nfc(s):
    return unicodedata.normalize("NFC", s)


def die(msg):
    print(f"❌ build_manifest: {msg}", file=sys.stderr)
    sys.exit(1)


def load_salt(path):
    """레포 밖 솔트(내부 가명화용). 없으면 새로 만든다. 값은 출력하지 않는다."""
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), mode=0o700, exist_ok=True)
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(secrets.token_hex(32))
        print("ℹ️ 솔트 신규 생성(값 미출력)", file=sys.stderr)
    s = open(path).read().strip()
    if len(s) < 32:
        die("솔트 길이 비정상")
    return s


def pseudo_id(salt, key):
    return "c_" + hashlib.sha256((salt + ":" + key).encode()).hexdigest()[:16]


def tail_of(stem):
    """'이름님_여권' → '_여권'. 님 없으면 stem 전체(건대 '여권_출력용' 등)."""
    i = stem.rfind("님")
    return stem[i + 1:] if i >= 0 else stem


def spec_token(text):
    for t in SPEC_TOKENS:
        if t in text:
            return t
    return None


def classify(rel):
    """파일 1개 → (분류, 용도 토큰|None, 세부). 파일명·확장자만 본다."""
    base = os.path.basename(rel)
    stem, ext = os.path.splitext(base)
    ext = ext.lower()
    if ext in RAW_EXT:
        return "raw", None, None
    if ext in SIDECAR_EXT:
        return "sidecar", None, ext[1:]
    if ext not in IMG_EXT | TIF_EXT | PSD_EXT:
        return "other", None, None
    if PRINT_LAYOUT_RE.search(stem):
        return "print_layout", None, None
    if "보정전" in stem:
        return "before_retouch", None, None
    if ext in PSD_EXT:
        return "psd_work", None, None
    if ext in TIF_EXT:
        return "master_tif", None, None
    tail = tail_of(stem)
    if SV_RE.search(tail):
        return "service_sv", spec_token(tail), None
    if GUNDAE_OUT_RE.search(stem):
        return "spec_final", spec_token(stem), "gundae_print"
    if GUNDAE_WEB_RE.search(stem):
        return "spec_final", spec_token(stem), "gundae_web"
    tok = spec_token(tail)
    if tok and "님" in stem:
        return "spec_final", tok, "named"
    if "프로필" in tail:
        return "profile", None, None
    return "other_img", None, None


def folder_purposes(rel):
    for part in rel.split("/")[:-1]:
        if KEY_RE.match(part):
            out = []
            for g in PAREN_RE.findall(part):
                for t in re.split(r"[+,]", g):
                    t = t.strip()
                    if SAFE_TOKEN_RE.match(t) and "님" not in t:
                        out.append(t)
            return out
    return []


def parse_xmp(path):
    try:
        with open(path, "rb") as f:
            s = f.read(256 * 1024).decode("utf-8", "replace")
    except OSError as e:
        return {"err": type(e).__name__}
    out = {}
    for k, rx in XMP_RE.items():
        m = rx.search(s)
        if m:
            out[k] = m.group(1) if m.group(1) is not None else m.group(2)
    m = XMP_ORIENT_RE.search(s)
    if m:
        out["Orientation"] = int(m.group(1) or m.group(2))
    return out


def crop_from_xmp(x):
    """정규화(0~1) 센서 좌표 [l,t,r,b] + angle. HasCrop=False·필드 누락이면 None."""
    if not x or x.get("HasCrop", "").lower() != "true":
        return None
    try:
        box = [float(x["CropLeft"]), float(x["CropTop"]), float(x["CropRight"]), float(x["CropBottom"])]
        ang = float(x.get("CropAngle", 0) or 0)
    except (KeyError, ValueError):
        return None
    return {"crop": [round(v, 6) for v in box], "angle": ang, "orientation": x.get("Orientation")}


def load_listing(path):
    if not os.path.exists(path):
        die(f"목록 없음 — 먼저 scan_listing.py 실행: {path}")
    recs = defaultdict(list)
    n = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) != 5:
                continue
            sh, key, rel, size, mt = p
            recs[key].append((sh, nfc(rel), int(size)))
            n += 1
    if n == 0:
        die("목록 0행")
    return recs, n


def build(recs, salt, use_xmp):
    manifest, pathmap = [], []
    stats = []
    for key in sorted(recs):
        files = recs[key]
        era = "gundae" if key < HANAM_FROM else "hanam"
        cls = defaultdict(list)
        seen = set()
        purposes = []
        for sh, rel, size in files:
            base = os.path.basename(rel)
            c, tok, sub = classify(rel)
            dkey = (c, base.lower(), size)  # 두 공유에 같은 파일(이름·크기 동일)은 1개로
            if dkey in seen:
                continue
            seen.add(dkey)
            cls[c].append((sh, rel, size, tok, sub))
            if not purposes:
                purposes = folder_purposes(rel)
        # 보조 규칙: 이름 붙은 규격 파일이 없고 폴더 (용도)가 규격이면, 번호만 붙은 완성 JPG(`님_01`·`님`)를
        # 규격 완성 후보로 올린다(spec_conf=low). 근거: README §분류 규칙 4.
        if not cls["spec_final"]:
            ftok = next((spec_token(p) for p in purposes if spec_token(p)), None)
            if ftok:
                keep = []
                for sh, rel, size, tok, sub in cls["other_img"]:
                    stem = os.path.splitext(os.path.basename(rel))[0]
                    if "님" in stem and re.fullmatch(r"[_ ]?\d{0,3}", tail_of(stem)):
                        cls["spec_final"].append((sh, rel, size, ftok, "folder_inferred"))
                    else:
                        keep.append((sh, rel, size, tok, sub))
                cls["other_img"] = keep
        refs = {}
        cnt = Counter()

        def ref(prefix, sh, rel):
            cnt[prefix] += 1
            r = f"{prefix}{cnt[prefix]}"
            refs[r] = f"{sh}:{rel}"
            return r

        raw_by_stem = {}
        raw = []
        for sh, rel, size, _, _ in cls["raw"]:
            r = ref("r", sh, rel)
            raw.append({"path_ref": r, "size": size, "ext": os.path.splitext(rel)[1].lower()[1:]})
            raw_by_stem[os.path.splitext(os.path.basename(rel))[0].lower()] = r
        sidecar = []
        for sh, rel, size, _, sub in cls["sidecar"]:
            r = ref("x", sh, rel)
            stem = os.path.splitext(os.path.basename(rel))[0].lower()
            item = {"path_ref": r, "type": sub, "for": raw_by_stem.get(stem)}
            if use_xmp and sub == "xmp":
                c = crop_from_xmp(parse_xmp(os.path.join(SHARES[sh], rel)))
                if c:
                    item.update(c)
                else:
                    item["crop"] = None
            sidecar.append(item)
        master = [{"path_ref": ref("m", sh, rel)} for sh, rel, size, _, _ in cls["master_tif"]]
        spec = []
        for sh, rel, size, tok, sub in cls["spec_final"]:
            spec.append({"path_ref": ref("f", sh, rel), "purpose": tok, "src": sub,
                         "wh": None, "crop_in_raw": None})
        service = [{"path_ref": ref("s", sh, rel)} for sh, rel, size, _, _ in cls["service_sv"]]
        spec_conf = None
        if spec:
            srcs = {s["src"] for s in spec}
            spec_conf = ("high" if "named" in srcs else
                         "medium" if srcs & {"gundae_print", "gundae_web"} else "low")
        allnames = " ".join(os.path.basename(r) for _, r, _ in files)
        rec = {
            "id": pseudo_id(salt, key),
            "era": era,
            "date": f"{key[:4]}-{key[4:6]}",
            "purpose": sorted(set(purposes) | {s["purpose"] for s in spec if s["purpose"]}),
            "raw": raw,
            "sidecar": sidecar,
            "master": master,
            "spec_final": spec,
            "spec_conf": spec_conf,
            "service": service,
            "counts": {k: len(v) for k, v in cls.items()},
            "flags": {"re": bool(re.search(r"님[^/]*re|re_|_re|re\.", allnames, re.I)),
                      "before_retouch": bool(cls["before_retouch"]),
                      "print_layout": bool(cls["print_layout"])},
        }
        manifest.append(rec)
        pathmap.append({"id": rec["id"], "key": key, "refs": refs})
        stats.append((key, rec))
    return manifest, pathmap, stats


def table(stats, legacy=False):
    """§8-3 재현표. legacy=True: 쌍아 11-03 규칙 근사(규격=`님_{용도}`만, 건대 출력용·웹용 미포함)."""
    cols = ["고객", "RAW", "사이드카", "마스터 TIF", "규격 완성", "sv", "RAW+규격", "RAW+규격+sv", "RAW+사이드카", "규격∪프로필"]
    agg = defaultdict(Counter)
    for key, r in stats:
        y = key[:4]
        has_raw = bool(r["raw"])
        has_sc = bool(r["sidecar"])
        spec = [s for s in r["spec_final"] if (s["src"] == "named" or not legacy)]
        has_spec = bool(spec)
        has_sv = bool(r["service"])
        for yy in (y, "합계"):
            a = agg[yy]
            a["고객"] += 1
            a["RAW"] += has_raw
            a["사이드카"] += has_sc
            a["마스터 TIF"] += bool(r["master"])
            a["규격 완성"] += has_spec
            a["sv"] += has_sv
            a["RAW+규격"] += has_raw and has_spec
            a["RAW+규격+sv"] += has_raw and has_spec and has_sv
            a["RAW+사이드카"] += has_raw and has_sc
            a["규격∪프로필"] += has_spec or bool(r["counts"].get("profile"))
    lines = ["| 연도 | " + " | ".join(cols) + " |", "|" + "---|" * (len(cols) + 1)]
    for y in sorted(k for k in agg if k != "합계") + ["합계"]:
        lines.append(f"| {y} | " + " | ".join(f"{agg[y][c]:,}" for c in cols) + " |")
    return "\n".join(lines), agg


def xmp_table(stats):
    agg = defaultdict(Counter)
    for key, r in stats:
        xs = [s for s in r["sidecar"] if s["type"] == "xmp"]
        if not xs:
            continue
        a = agg[key[:4]]
        a["xmp 보유 고객"] += 1
        a["크롭 있음"] += any(s.get("crop") for s in xs)
        a["RAW 짝(같은 이름)"] += any(s.get("for") for s in xs)
        a["크롭+규격 완성"] += any(s.get("crop") for s in xs) and bool(r["spec_final"])
    cols = ["xmp 보유 고객", "크롭 있음", "RAW 짝(같은 이름)", "크롭+규격 완성"]
    lines = ["| 연도 | " + " | ".join(cols) + " |", "|" + "---|" * (len(cols) + 1)]
    for y in sorted(agg):
        lines.append(f"| {y} | " + " | ".join(f"{agg[y][c]:,}" for c in cols) + " |")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--listing", default=os.path.join(HOME, "listing.tsv"))
    ap.add_argument("--out", default=os.path.join(HOME, "manifest_v0.jsonl"))
    ap.add_argument("--pathmap", default=os.path.join(HOME, "pathmap.jsonl"))
    ap.add_argument("--salt", default=os.path.join(HOME, "salt"))
    ap.add_argument("--xmp", action="store_true", help="사이드카 .xmp 크롭 필드 파싱(시놀로지 읽기)")
    ap.add_argument("--table-out", help="§8-3 재현표 마크다운 사본 경로(건수만)")
    ap.add_argument("--dry-run", action="store_true", help="매니페스트·pathmap을 쓰지 않음")
    a = ap.parse_args()
    for p in (a.out, a.pathmap, a.salt):
        if os.path.realpath(p).startswith(os.path.realpath(os.path.join(os.path.dirname(__file__), "..", ".."))):
            die(f"레포 안 경로 금지: {p}")
    if a.xmp:
        for sh, root in SHARES.items():
            if not os.path.isdir(root):
                die(f"공유 미마운트: {sh}")
    salt = load_salt(a.salt)
    recs, n = load_listing(a.listing)
    manifest, pathmap, stats = build(recs, salt, a.xmp)
    ids = [m["id"] for m in manifest]
    if len(set(ids)) != len(ids):
        die("가명 id 충돌")
    t_new, agg = table(stats)
    t_old, _ = table(stats, legacy=True)
    report = [f"입력 {n:,}행 · 고객 레코드 {len(manifest):,}", "", "### 재현표 (v0 규칙)", t_new,
              "", "### 재현표 (11-03 규칙 근사 — 규격=`님_{용도}`만)", t_old]
    if a.xmp:
        report += ["", "### 사이드카 .xmp 크롭 가용", xmp_table(stats)]
    out = "\n".join(report)
    print(out)
    if a.table_out:
        with open(a.table_out, "w", encoding="utf-8") as f:
            f.write(out + "\n")
    if a.dry_run:
        print("ℹ️ dry-run — 매니페스트 미기록")
        return
    for path, rows in ((a.out, manifest), (a.pathmap, pathmap)):
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        os.replace(tmp, path)
        os.chmod(path, 0o600)
    print(f"✅ manifest {len(manifest):,}행 → {a.out} · pathmap → {a.pathmap}")


if __name__ == "__main__":
    main()
