#!/usr/bin/env python3
"""scan_listing.py — 시놀로지 두 공유의 파일 목록 스캔 (읽기 전용, stdlib만).

목록·크기·수정시각만 읽는다. 파일 내용은 열지 않는다.
산출(레포 밖): ~/.monkos/photo_judge/listing.tsv
  share \t customer_key \t relpath(공유 기준) \t size \t mtime

customer_key = 경로상 가장 가까운 `YYYYMMDD_NNN` 폴더(앞머리). 고객 폴더 밖 파일은 기록하지 않는다.
⚠️ listing.tsv에는 실제 경로(고객 이름 포함)가 들어간다 — 레포·로그로 옮기지 않는다.
"""
import argparse
import os
import re
import sys
import time
import unicodedata

SHARES = {"intake": "/Volumes/촬영접수", "backup": "/Volumes/작업백업"}
KEY_RE = re.compile(r"^(\d{8})\s*_(\d{3})")
SKIP_DIRS = {"#recycle", "_select_dataset", "@eaDir", ".DS_Store", "#snapshot"}
OUT_DIR = os.path.expanduser("~/.monkos/photo_judge")


def nfc(s):
    return unicodedata.normalize("NFC", s)


def walk(share, root, out, stats):
    stack = [(root, None)]
    while stack:
        d, key = stack.pop()
        try:
            it = list(os.scandir(d))
        except OSError as e:
            stats["err"] += 1
            print(f"⚠️ scan: 디렉터리 읽기 실패 ({type(e).__name__})", file=sys.stderr)
            continue
        for e in it:
            name = nfc(e.name)
            if name.startswith("._") or name in SKIP_DIRS:
                continue
            try:
                if e.is_dir(follow_symlinks=False):
                    m = KEY_RE.match(name)
                    k = f"{m.group(1)}_{m.group(2)}" if m else key
                    if m:
                        stats["folders"] += 1
                    stack.append((e.path, k))
                elif e.is_file(follow_symlinks=False) and key:
                    st = e.stat(follow_symlinks=False)
                    rel = nfc(os.path.relpath(e.path, root)).replace("\t", " ")
                    out.write(f"{share}\t{key}\t{rel}\t{st.st_size}\t{int(st.st_mtime)}\n")
                    stats["files"] += 1
            except OSError:
                stats["err"] += 1
        if stats["files"] and stats["files"] % 5000 < 50:
            pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(OUT_DIR, "listing.tsv"))
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.out), mode=0o700, exist_ok=True)
    tmp = a.out + ".tmp"
    t0 = time.time()
    with open(tmp, "w", encoding="utf-8") as out:
        for share, root in SHARES.items():
            if not os.path.isdir(root):
                print(f"❌ scan: 공유 미마운트 {share}", file=sys.stderr)
                sys.exit(1)
            stats = {"files": 0, "folders": 0, "err": 0}
            walk(share, root, out, stats)
            print(f"{share}: 고객 폴더 {stats['folders']} · 파일 {stats['files']} · 오류 {stats['err']} · {time.time()-t0:.0f}s", flush=True)
    os.replace(tmp, a.out)
    os.chmod(a.out, 0o600)
    print(f"완료 {time.time()-t0:.0f}s → {a.out}")


if __name__ == "__main__":
    main()
