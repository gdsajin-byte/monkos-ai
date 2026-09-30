#!/usr/bin/env python3
"""UserPromptSubmit 훅 — E6(KST 시각 주입) + E10(채팅 승인 → 세션 토큰 발급).

원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.2 E6·E10
- 헌법 3조 1항: 매 턴 시각을 하네스가 실측해 주입 → 모델 date 호출 1턴 절약, 추정 타임스탬프 원천 차단.
- ch1 7조: 이 훅은 하네스가 **실제 사용자 입력**에만 발화 → 모델이 위조 불가한 승인 채널.
  '배포'+'승인'(또는 deploy/prod + 승인)이 함께 있으면 세션 바인딩 토큰(1h·1회) 발급.
"""
import re
import sys
import time

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _common import context, hook_err, issue_approval, kill_switch, read_input  # noqa: E402

EVENT = "UserPromptSubmit"
APPROVAL = re.compile(r"(배포|deploy|prod|프로덕션)[^\n]{0,20}승인|승인[^\n]{0,20}(배포|deploy|prod|프로덕션)", re.I)
HEADER_RULE = "**[YYYY-MM-DD HH:MM KST]** {디바이스}/{에이전트} → {수신자}"


def main() -> int:
    data = read_input()
    now = time.strftime("%Y-%m-%d %H:%M KST")
    lines = ["[MONK 헌법 3조·2조] 현재 시각(하네스 실측) = %s — 이 값을 헤더에 복사. 수발신 헤더 필수: %s" % (now, HEADER_RULE)]
    if not kill_switch():
        prompt = data.get("prompt") or ""
        if APPROVAL.search(prompt):
            sid = data.get("session_id") or "unknown"
            try:
                p = issue_approval(sid, prompt.strip()[:80])
                lines.append("[승인 토큰 발급] 작가님 채팅 승인 감지 → %s (세션 바인딩·60분·1회용). "
                             "배포 명령은 이 세션에서 1회 통과한다." % p.name)
            except Exception as e:  # noqa: BLE001
                hook_err("토큰 발급 실패: %s" % e)
    context(EVENT, "\n".join(lines))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
        sys.exit(1)
