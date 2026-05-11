"""PF_AUTOPILOT — R&D 마감 알림 체크."""

import re
from datetime import date, datetime
from pathlib import Path

TRACKS_DIR = Path("monkos-ops/ops/portfolios/PF_RND/tracks")
DEADLINE_RE = re.compile(r"##\s*마감\s*[:：]\s*(\d{4}-\d{2}-\d{2})")


def scan_timelines():
    alerts = []
    if not TRACKS_DIR.exists():
        return alerts

    for timeline in TRACKS_DIR.glob("*/timeline.md"):
        track_name = timeline.parent.name
        text = timeline.read_text(encoding="utf-8")
        match = DEADLINE_RE.search(text)
        if not match:
            continue

        try:
            deadline = datetime.strptime(match.group(1), "%Y-%m-%d").date()
        except ValueError:
            continue

        days_left = (deadline - date.today()).days
        if days_left < 0:
            level = "⚫"
            label = f"D+{abs(days_left)} (마감 경과)"
        elif days_left <= 3:
            level = "🔴"
            label = f"D-{days_left} 긴급"
        elif days_left <= 7:
            level = "🟠"
            label = f"D-{days_left} 주목"
        else:
            continue

        alerts.append({
            "level": level,
            "track": track_name,
            "deadline": match.group(1),
            "label": label,
            "days_left": days_left,
        })

    alerts.sort(key=lambda a: a["days_left"])
    return alerts


def main():
    alerts = scan_timelines()

    print("## 📅 R&D 마감 알림")
    print()
    if not alerts:
        print("- 7일 이내 마감 건 없음")
    else:
        print("| 긴급도 | 트랙 | 마감일 | D-day |")
        print("|--------|------|--------|-------|")
        for a in alerts:
            print(f"| {a['level']} | {a['track']} | {a['deadline']} | {a['label']} |")
    print()


if __name__ == "__main__":
    main()
