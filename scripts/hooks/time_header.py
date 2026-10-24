#!/usr/bin/env python3
"""시각 헤더 쓰기 직전 대조 — 헌법 3조 1항 코드 집행 (ORDER_20261024 막내16).

원천: 10-24 실사고 4건(전부 '미래 시각' = 턴 시작 시각에 경과를 추정 가산). E6(prompt_submit)은 턴 시작에만
시각을 주입하므로, 쓰기 시점에 새로 들어가는 헤더를 실측 KST와 대조한다.
- 대상: `**[YYYY-MM-DD HH:MM KST]**`(줄 어디든) + 굵게 없는 `[YYYY-MM-DD HH:MM KST]`(줄 머리)
- 차단: 실측보다 FUTURE_MIN분 초과 미래 / PAST_MIN분 초과 과거
- 제외: 코드 블록(```)·인라인 코드(`…`) 안, `출처:`·`근거:` 인용 줄, 어제 이전 날짜(과거 사건 기록),
  기존 내용에 이미 있던 줄(old 텍스트)
- 시간대: 기기 TZ와 무관하게 UTC+9로 계산. 스모크는 MONK_HOOK_NOW="YYYY-MM-DD HH:MM[:SS]"로 고정.
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
FUTURE_MIN = 2
PAST_MIN = 10
TARGET_DIRS = ("sessions", "orders", "reports", "proposals", "incidents", "briefings")
# monkos-ops/ops/{대상}/…/*.md — 상대 경로(ops/… 또는 monkos-ops/ops/…) 모두
TARGET_PATH = re.compile(r"(?:^|/)ops/(?:%s)/[^\s'\"<>|;&]*\.md\b" % "|".join(TARGET_DIRS))

BOLD = re.compile(r"\*\*\[(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}) KST\]\*\*")
HEAD = re.compile(r"^[\s#>*+-]*\[(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}) KST\]")
QUOTE_LINE = re.compile(r"(출처|근거)\s*:")
INLINE_CODE = re.compile(r"`[^`\n]*`")


def now_kst() -> datetime:
    fixed = os.environ.get("MONK_HOOK_NOW")
    if fixed:
        fmt = "%Y-%m-%d %H:%M:%S" if fixed.count(":") == 2 else "%Y-%m-%d %H:%M"
        return datetime.strptime(fixed, fmt).replace(tzinfo=KST)
    return datetime.now(KST)


def is_target_path(path: str) -> bool:
    return bool(TARGET_PATH.search(path.replace("\\", "/")))


def headers(text: str, skip_lines: set[str] | None = None):
    """검사 대상 헤더 (줄, datetime) 목록. 코드 블록·인용 줄·기존 줄 제외."""
    out, fence = [], False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            fence = not fence
            continue
        if fence or QUOTE_LINE.search(line):
            continue
        if skip_lines and line.strip() in skip_lines:
            continue
        bare = INLINE_CODE.sub("", line)
        found = [m.groups() for m in BOLD.finditer(bare)]
        if not found:
            m = HEAD.match(bare)
            if m:
                found = [m.groups()]
        for d, hh, mm in found:
            try:
                dt = datetime.strptime("%s %s:%s" % (d, hh, mm), "%Y-%m-%d %H:%M").replace(tzinfo=KST)
            except ValueError:
                continue
            out.append((line.strip(), dt))
    return out


def check(new_text: str, old_text: str = "") -> str | None:
    """위반이면 deny 사유, 아니면 None."""
    now = now_kst()
    floor = now.replace(second=0, microsecond=0)
    skip = {ln.strip() for ln in old_text.splitlines() if ln.strip()}
    for line, dt in headers(new_text, skip):
        if dt.date() < now.date():
            continue  # 어제 이전 = 과거 사건 기록
        diff = (dt - floor).total_seconds() / 60
        if diff > FUTURE_MIN:
            kind = "%d분 미래" % diff
        elif -diff > PAST_MIN:
            kind = "%d분 과거" % -diff
        else:
            continue
        return ("[집행 훅] 헌법 3조 1항: 헤더 시각 %s 는 실측보다 %s(허용 +%d/−%d분) — 실측 %s — 이 값으로 다시 쓰세요. "
                "추정 가산 금지, 쓰기 직전 `date` 실측. 대상 줄: %s"
                % (dt.strftime("%Y-%m-%d %H:%M KST"), kind, FUTURE_MIN, PAST_MIN,
                   now.strftime("%Y-%m-%d %H:%M KST"), line[:80]))
    return None
