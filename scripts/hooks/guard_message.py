#!/usr/bin/env python3
"""PreToolUse(SendMessage) 집행 훅 — E11 시각 헤더 쓰기 직전 대조 (헌법 3조 1항·2조 2항).

원천: ORDER_20261024 막내16 — 10-24 막내15 메시지 헤더 22:02(실측 22:00)·22:07(22:04) 미래 시각 실사고.
메시지 본문(`message`)의 `**[YYYY-MM-DD HH:MM KST]**` 헤더를 실측 KST와 대조 → +2분 초과 미래·10분 초과 과거 deny.
훅 자체 오류는 발송을 막지 않고 [HOOK-ERR] 경고.
"""
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _common import decide, hook_err, kill_switch, read_input  # noqa: E402

EVENT = "PreToolUse"


def main() -> int:
    if kill_switch():
        return 0
    data = read_input()
    if data.get("tool_name") != "SendMessage":
        return 0
    msg = (data.get("tool_input") or {}).get("message") or ""
    if not isinstance(msg, str) or not msg.strip():
        return 0
    try:
        import time_header
        why = time_header.check(msg)
    except Exception as e:  # noqa: BLE001
        hook_err("시각 대조 실패: %s" % e)
        return 0
    if why:
        decide(EVENT, "deny", why)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
        sys.exit(1)
