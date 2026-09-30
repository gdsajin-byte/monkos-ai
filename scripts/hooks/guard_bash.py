#!/usr/bin/env python3
"""PreToolUse(Bash) 집행 훅 — E1·E2·E3·E4·E5(Bash)·E9·E10.

원천: DESIGN_20260930_집행코드화_hooks_deny.md §4.3 판정표
판정 원칙: 명령을 세그먼트(선두 / && ; || | 뒤 / $( ) / 개행)로 쪼개고
각 세그먼트 **선두**에서 패턴을 본다 (CI C13과 동일 — 문자열 '언급'이 아니라 실행 형태).
히어독 본문·주석은 제거 후 판정 (세션 로그 어펜드의 문서 텍스트 오탐 방지).
"""
import re
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _common import consume_approval, decide, hook_err, kill_switch, read_input  # noqa: E402

EVENT = "PreToolUse"

COMMIT_CATEGORIES = "feat|fix|refactor|docs|ops|cleanup|deploy|sync|research|정리|정산|헌법|log|briefing"

# (이름, 선두 앵커 정규식, 결정, 사유)
RULES = [
    # E1/E2 — 헌법 4조 2항 파괴 명령 (세그먼트 어디에 있든 선두 기준)
    ("rm -rf", r"rm\s+(-[a-zA-Z]*[rR][a-zA-Z]*[fF]|-[a-zA-Z]*[fF][a-zA-Z]*[rR])\b", "deny",
     "헌법 4조 2항: rm -rf 실행 금지"),
    ("git push --force", r"git\s+push\b(?!.*--force-with-lease).*(\s--force\b|\s-f\b)", "deny",
     "헌법 4조 2항: git push --force 금지 (--force-with-lease는 허용)"),
    ("git reset --hard", r"git\s+reset\s+--hard\b", "deny", "헌법 4조 2항: git reset --hard 금지"),
    ("git clean -f", r"git\s+clean\s+-[a-zA-Z]*f", "deny", "헌법 4조 2항: git clean -f 금지"),
    ("git checkout --", r"git\s+checkout\s+--\s", "deny", "헌법 4조 2항 준용: git checkout -- (변경 폐기) 금지"),
    # E3 — ch5 2조
    ("gcloud run deploy", r"gcloud\s+(alpha\s+|beta\s+)?run\s+deploy\b", "deny",
     "ch5 2조: gcloud run deploy 직접 실행 금지 → ./deploy.sh {env} 경유"),
    ("gcloud builds submit", r"gcloud\s+(alpha\s+|beta\s+)?builds\s+submit\b", "deny",
     "ch5 2조: gcloud builds submit 직접 실행 금지 → ./deploy.sh {env} 경유"),
    # E4 — ch4 10조
    ("gcloud firestore", r"gcloud\s+(alpha\s+|beta\s+)?firestore\b", "deny",
     "ch4 10조: Firestore 직접 접근 금지 → scripts/credits.sh 경유"),
    ("firebase firestore", r"firebase\s+firestore\b", "deny",
     "ch4 10조: Firestore 직접 접근 금지 → scripts/credits.sh 경유"),
    # E5 — 헌법 4조 1항 시크릿 직접 조작
    ("gcloud secrets write", r"gcloud\s+secrets\s+(create|versions\s+add)\b", "deny",
     "헌법 4조 1항·data-access: 시크릿 직접 등록 금지 → 작가님 `secret` 커맨드 경유"),
    ("gh secret set", r"gh\s+secret\s+set\b", "deny",
     "헌법 4조 1항: GitHub Secrets 직접 설정 금지 → 작가님 `secret` 커맨드 경유"),
    ("wrangler secret put", r"wrangler\s+secret\s+put\b", "deny",
     "헌법 4조 1항: CF 시크릿 직접 설정 금지 → 작가님 `secret` 커맨드 경유"),
    # E10 예비 경로 보호 — 에이전트가 승인 커맨드 직접 실행 금지
    ("approve.sh", r"(\./|scripts/|bash\s+scripts/)?approve\.sh\b", "deny",
     "ch1 7조: 승인 토큰 발급은 작가님 전용 (채팅 '배포 승인' 또는 작가님 터미널)"),
]

# E10 — 승인 게이트 대상 (ch5 1조·ch1 7조)
DEPLOY_GATE = [
    (r"(\./|bash\s+|sh\s+)?([\w./-]*/)?deploy\.sh\s+prod\b", "deploy.sh prod"),
    (r"wrangler\s+pages\s+deploy\b", "wrangler pages deploy (monk.kr)"),
    (r"gh\s+workflow\s+run\s+deploy-monk-kr", "gh workflow run deploy-monk-kr"),
    (r"edge/deploy\.sh\b", "edge/deploy.sh (monkos.ai 엣지)"),
]

# 신뢰 불명 원격 실행 → ask
PIPE_TO_SHELL = re.compile(r"\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b")

HEREDOC = re.compile(r"<<-?\s*['\"]?(\w+)['\"]?[^\n]*\n(.*?)\n\s*\1\s*(?=\n|$)", re.S)
SPLIT = re.compile(r"\s*(?:&&|\|\||;|\||\n|\$\(|`)\s*")
PREFIX = re.compile(r"^(?:(?:sudo|time|nohup|env|command|exec)\s+|[A-Za-z_][A-Za-z0-9_]*=\S*\s+|\(\s*)+")
WRAPPERS = re.compile(r"^(?:bash|sh|zsh)\s+-l?c\s+(['\"])(.*)\1\s*$", re.S)
XARGS = re.compile(r"^xargs\s+(?:-\S+\s+)*(.*)$")
EVAL = re.compile(r"^eval\s+(['\"]?)(.*)\1$", re.S)


def segments(cmd: str) -> list[str]:
    body = HEREDOC.sub("<<HEREDOC_STRIPPED", cmd)
    body = re.sub(r"(^|\s)#[^\n]*", " ", body)  # 주석 제거
    out = []
    for seg in SPLIT.split(body):
        seg = seg.strip().strip(")")
        if not seg:
            continue
        seg = PREFIX.sub("", seg)
        m = WRAPPERS.match(seg) or EVAL.match(seg)
        if m:
            out.extend(segments(m.group(2)))
            continue
        m = XARGS.match(seg)
        if m:
            out.extend(segments(m.group(1)))
            continue
        out.append(seg)
    return out


def check_commit_format(seg: str) -> str | None:
    """E9 — git commit -m '[카테고리] ...' 14종. 판정 불가(에디터·-F)면 None."""
    if not re.match(r"git\s+commit\b", seg):
        return None
    m = re.search(r"-m\s+(?:\"((?:[^\"\\]|\\.)*)\"|'([^']*)'|(\S+))", seg)
    if not m:
        return None
    msg = next(g for g in m.groups() if g is not None)
    msg = msg.strip()
    if msg.startswith("$("):  # -m "$(cat <<EOF ...)" — 히어독은 원문에서 본다
        return None
    first = msg.splitlines()[0] if msg else ""
    if not re.match(r"^\[(%s)\]\s*\S" % COMMIT_CATEGORIES, first):
        return "ch6 1조: 커밋 메시지는 `[카테고리] 요약` 14종(%s). 받은 값: %r" % (
            COMMIT_CATEGORIES.replace("|", ","), first[:60])
    return None


def check_commit_heredoc(cmd: str) -> str | None:
    if not re.search(r"git\s+commit\b", cmd):
        return None
    m = HEREDOC.search(cmd)
    if not m:
        return None
    first = m.group(2).strip().splitlines()[0] if m.group(2).strip() else ""
    if not re.match(r"^\[(%s)\]\s*\S" % COMMIT_CATEGORIES, first):
        return "ch6 1조: 커밋 메시지 첫 줄은 `[카테고리] 요약` 14종. 받은 값: %r" % first[:60]
    return None


def main() -> int:
    if kill_switch():
        return 0
    data = read_input()
    if data.get("tool_name") != "Bash":
        return 0
    cmd = (data.get("tool_input") or {}).get("command") or ""
    if not cmd.strip():
        return 0
    session_id = data.get("session_id") or "unknown"

    try:
        segs = segments(cmd)
    except Exception as e:  # noqa: BLE001
        hook_err("세그먼트 분해 실패: %s" % e)
        return 1

    # 1) 조문 열거 패턴 → deny
    for seg in segs:
        for name, pat, decision, reason in RULES:
            if re.match(pat, seg):
                decide(EVENT, decision, "[집행 훅] %s — 차단 패턴: %s" % (reason, name))
                return 0

    # 2) E10 승인 게이트
    for seg in segs:
        for pat, label in DEPLOY_GATE:
            if re.match(pat, seg):
                ok, why = consume_approval(session_id)
                if ok:
                    sys.stderr.write("[집행 훅] E10 통과: %s — %s\n" % (label, why))
                    decide(EVENT, "allow", "ch1 7조 승인 게이트 통과 (%s)" % why)
                    return 0
                decide(EVENT, "deny",
                       "[집행 훅] ch1 7조·ch5 1조: %s 는 작가님 승인 필요 — %s. "
                       "작가님이 이 세션 채팅에 '배포 승인'이라고 치면 1시간·1회 토큰이 발급된다. "
                       "무인 맥락이면 실행 금지 + 에스컬레이션." % (label, why))
                return 0

    # 3) E9 커밋 형식 — 히어독 커밋은 원문에서만 판정(세그먼트 분해 시 따옴표가 깨진다)
    msg = None
    if re.search(r"git\s+commit\b", cmd) and HEREDOC.search(cmd):
        msg = check_commit_heredoc(cmd)
    else:
        for seg in segs:
            msg = check_commit_format(seg)
            if msg:
                break
    if msg:
        decide(EVENT, "deny", "[집행 훅] " + msg)
        return 0

    # 4) 원격 스크립트 파이프 실행 → ask
    if PIPE_TO_SHELL.search(cmd):
        decide(EVENT, "ask", "[집행 훅] 원격 스크립트를 셸에 파이프 실행 — 출처 확인 후 승인 필요")
        return 0

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
        sys.exit(1)
