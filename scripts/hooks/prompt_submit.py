#!/usr/bin/env python3
"""UserPromptSubmit 훅 — E6(KST 시각 주입) + E10(채팅 승인 → 세션 토큰 발급).

원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.2 E6·E10
- 헌법 3조 1항: 매 턴 시각을 하네스가 실측해 주입 → 모델 date 호출 1턴 절약, 추정 타임스탬프 원천 차단.
- ch1 7조: 이 훅은 사람이 입력한 턴만이 아니라 **세션 간 메시지·작업 통지에도 발화한다**(10-01 붙여넣기 2건,
  10-02 14:58·17:00 세션 간 메시지 발급 실측). 그래서 발급 조건을 입력 출처와 턴 형태로 좁힌다 (10-02 P1):
  ① `<cross-session-message`·`<task-notification`으로 시작하는 입력은 발급하지 않는다
  ② `<pasted_content>` 안은 탐지 대상에서 뺀다
  ③ 턴 전체가 승인 문구일 때만 발급한다 — 공백·문장부호를 뺀 본문이 승인 문구로 시작하고, 짧고(≤24자),
     부정·보류·질문 낱말이 없을 것. `prod`는 단어 경계(뒤에 영문자가 붙으면 다른 낱말)
  승인처럼 보이나 미발급한 경우는 사유를 컨텍스트 1줄로 남긴다(무음 금지).
"""
import re
import sys
import time

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _common import context, hook_err, issue_approval, kill_switch, read_input  # noqa: E402

EVENT = "UserPromptSubmit"
# 승인 언급 탐지(넓게) — 발급 여부가 아니라 "미발급 사유를 알릴지"를 정한다
MENTION = re.compile(r"(배포|deploy|prod(?![a-z])|프로덕션)[^\n]{0,20}승인|승인[^\n]{0,20}(배포|deploy|prod(?![a-z])|프로덕션)", re.I)
# 발급(좁게) — 압축 본문의 시작이 승인 문구여야 한다
ISSUE_START = re.compile(r"^(?:(?:prod(?![a-z])|deploy|프로덕션)?배포|prod(?![a-z])|deploy|프로덕션)승인|^승인(?:prod(?![a-z])|deploy|프로덕션)?배포")
NEGATION = re.compile(r"안|않|말|마라|하지|아니|보류|대기|내일|나중|이따|잠깐|취소|철회|거부|반려|중단|금지|보여|알려|목록|뭐|어떻|\?")
MAX_LEN = 24
MACHINE_PREFIX = ("<cross-session-message", "<task-notification")
PASTED = re.compile(r"<pasted_content\b[^>]*>.*?(?:</pasted_content>|$)", re.S | re.I)
HEADER_RULE = "**[YYYY-MM-DD HH:MM KST]** {디바이스}/{에이전트} → {수신자}"


def judge(prompt: str) -> tuple[bool, str]:
    """(발급 여부, 미발급 사유). 사유가 빈 문자열이면 승인 언급 자체가 없는 턴."""
    raw = prompt.lstrip()
    if raw.startswith(MACHINE_PREFIX):
        return False, ("세션 간 메시지·작업 통지는 사람이 입력한 턴이 아니다" if MENTION.search(raw) else "")
    body = PASTED.sub(" ", raw)
    if not MENTION.search(body):
        return False, ("붙여넣기 본문 안의 승인 문구는 탐지하지 않는다" if MENTION.search(raw) else "")
    compact = re.sub(r"[\s.,!~·…'\"`]+", "", body).lower()
    if not ISSUE_START.match(compact):
        return False, "턴이 승인 문구로 시작하지 않는다(문장 속 언급)"
    if len(compact) > MAX_LEN:
        return False, "승인 문구만으로 된 짧은 턴이 아니다(%d자 > %d)" % (len(compact), MAX_LEN)
    m = NEGATION.search(compact)
    if m:
        return False, "부정·보류·질문 낱말 '%s' 포함" % m.group(0)
    return True, ""


def main() -> int:
    data = read_input()
    now = time.strftime("%Y-%m-%d %H:%M KST")
    lines = ["[MONK 헌법 3조·2조] 현재 시각(하네스 실측) = %s — 이 값을 헤더에 복사. 수발신 헤더 필수: %s" % (now, HEADER_RULE)]
    if not kill_switch():
        prompt = data.get("prompt") or ""
        ok, why = judge(prompt)
        if ok:
            sid = data.get("session_id") or "unknown"
            try:
                p = issue_approval(sid, prompt.strip()[:80])
                lines.append("[승인 토큰 발급] 작가님 채팅 승인 감지 → %s (세션 바인딩·60분·1회용). "
                             "배포 명령은 이 세션에서 1회 통과한다." % p.name)
            except Exception as e:  # noqa: BLE001
                hook_err("토큰 발급 실패: %s" % e)
        elif why:
            lines.append("[승인 토큰 미발급] %s — 승인은 사람이 입력한 턴에 승인 문구만 단독으로 (ch1 7조, 10-02 P1)." % why)
    context(EVENT, "\n".join(lines))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
