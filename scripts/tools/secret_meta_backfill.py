#!/usr/bin/env python3
"""SM 메타 백필 — SECRET_INVENTORY 수기 메타(용도·서비스·비고)를 SM annotations로 이전.

P1-ⓓ (2026-07-24 작가님 승인): 메타 정본을 값 옆(SM)으로 — 인벤토리는 생성 뷰로 강등.
값 비접촉·전량 가역(annotations만 갱신). 기본 dry-run, --apply로 적용.

사용: python3 scripts/tools/secret_meta_backfill.py [--apply]
"""
import re
import subprocess
import sys

PROJECT = "monkos"
INV = "monkos-ops/ops/SECRET_INVENTORY.md"
APPLY = "--apply" in sys.argv
DELIM = "^@@@^"  # gcloud 대체 구분자 — 비고 내 쉼표·콜론 안전


def sm_names():
    out = subprocess.run(
        ["gcloud", "secrets", "list", f"--project={PROJECT}", "--format=value(name)"],
        capture_output=True, text=True, check=True)
    return [x for x in out.stdout.split() if x]


def inventory_meta():
    meta = {}
    for line in open(INV, encoding="utf-8"):
        m = re.match(r"^\|\s*\d+\s*\|\s*([A-Z0-9_]+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|", line)
        if m:
            name = m.group(1).strip()
            meta[name] = {
                "purpose": m.group(2).strip(),
                "service": m.group(3).strip(),
                "note": m.group(4).strip(),
            }
    return meta


def clean(v: str) -> str:
    # 어노테이션 값 정리: 마크다운 굵게 제거·개행 금지·과장 길이 컷
    v = v.replace("**", "").replace("\n", " ").strip()
    return v[:200]


def main():
    names = sm_names()
    meta = inventory_meta()
    print(f"[백필] SM {len(names)}건 / 인벤 테이블 파싱 {len(meta)}건 / 모드: {'APPLY' if APPLY else 'dry-run'}")
    unmatched = []
    for n in names:
        m = meta.get(n)
        if not m:
            unmatched.append(n)
            continue
        parts = [f"purpose={clean(m['purpose'])}"]
        if m["service"]:
            parts.append(f"service={clean(m['service'])}")
        if m["note"]:
            parts.append(f"note={clean(m['note'])}")
        flag = DELIM + DELIM.join(parts).replace(DELIM, "@@@", 0)  # placeholder no-op
        flag = "^@@@^" + "@@@".join(parts)
        print(f"  {n}: purpose='{clean(m['purpose'])[:40]}' service='{clean(m['service'])[:20]}' note={len(clean(m['note']))}자")
        if APPLY:
            r = subprocess.run(
                ["gcloud", "secrets", "update", n, f"--project={PROJECT}",
                 f"--update-annotations={flag}",
                 "--update-labels=meta_src=inventory_20260724"],
                capture_output=True, text=True)
            if r.returncode != 0:
                print(f"    ✗ 실패: {r.stderr.strip()[:120]}")
    if unmatched:
        print(f"[미매칭 {len(unmatched)}건 — 테이블 밖(섹션별 기재 추정), purpose=미기재로 표기]")
        for n in unmatched:
            print(f"  - {n}")
            if APPLY:
                subprocess.run(
                    ["gcloud", "secrets", "update", n, f"--project={PROJECT}",
                     "--update-annotations=purpose=미기재(백필시 인벤 메인테이블 밖)",
                     "--update-labels=meta_src=inventory_20260724"],
                    capture_output=True, text=True)
    print("[완료]" if APPLY else "[dry-run 종료 — --apply로 적용]")


if __name__ == "__main__":
    main()
