"""PF_AUTOPILOT — PF 상태 대시보드 생성."""

from datetime import date
from pathlib import Path

import yaml

PF_DIR = Path("monkos-ops/ops/portfolios")

STATUS_GROUPS = {
    "active": ("🟢", "Active"),
    "blocked": ("🔴", "Blocked"),
    "draft": ("🟡", "Draft"),
    "paused": ("🟡", "Paused"),
    "completed": ("✅", "Completed"),
}


def find_pf_files():
    """Find all PF definition files (single-file and folder patterns)."""
    seen_ids = set()
    pf_list = []

    for path in sorted(PF_DIR.rglob("*.md")):
        if path.name == "README.md" and path.parent.name.startswith("PF_"):
            pass
        elif path.name.startswith("PF_") and path.parent == PF_DIR:
            pass
        elif path.name.startswith("PF_") and path.name == f"{path.parent.name}.md":
            pass
        else:
            continue

        meta = parse_frontmatter(path)
        if not meta or meta.get("type") != "portfolio":
            continue

        pf_id = meta.get("id", "")
        if pf_id in seen_ids:
            continue
        seen_ids.add(pf_id)

        pf_list.append({
            "id": pf_id,
            "name": meta.get("name", pf_id),
            "subject": meta.get("subject", ""),
            "status": meta.get("status", "draft"),
        })

    return pf_list


def parse_frontmatter(path):
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return None

    if not text.startswith("---"):
        return None

    end = text.find("---", 3)
    if end == -1:
        return None

    try:
        return yaml.safe_load(text[3:end])
    except yaml.YAMLError:
        return None


def main():
    pf_list = find_pf_files()

    groups = {}
    for pf in pf_list:
        status = pf["status"]
        groups.setdefault(status, []).append(pf)

    print(f"# PF 상태 대시보드 — {date.today().isoformat()}")
    print()

    display_order = ["active", "blocked", "draft", "paused", "completed"]

    for status in display_order:
        items = groups.get(status, [])
        icon, label = STATUS_GROUPS.get(status, ("❓", status))
        print(f"## {icon} {label} ({len(items)}건)")
        if items:
            print("| PF | 주제 |")
            print("|---|---|")
            for pf in sorted(items, key=lambda p: p["id"]):
                print(f"| {pf['id']} | {pf['subject']} |")
        else:
            print("| — | — |")
        print()


if __name__ == "__main__":
    main()
