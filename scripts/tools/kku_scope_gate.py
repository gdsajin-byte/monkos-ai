#!/usr/bin/env python3
"""monk.kr 버튼 배포 범위 게이트 (G-K) — ch5 1조 7항의2 (PETITION_20261002 §3.1~§3.6).

판정 정본은 워크플로 러너다(ch1 1조 판단 분리). 로컬 --dry-run은 M2 쌍아의 사전 점검 편의 도구일 뿐 판정이 아니다.
Python 3.9 호환(M2) — match·`X | Y` 타입 표기 금지.

사용:
  kku_scope_gate.py --dry-run BASE TARGET              # R1~R8만 (로컬 사전 점검)
  kku_scope_gate.py gate --approver 꾸 --ref refs/heads/main --target SHA --reason "..." \
        [--sha-input SHA] [--run-base SHA --run-approver 꾸 --run-recorded-base SHA] [--cf-base SHA] \
        [--summary PATH] [--record PATH] [--run-id ID]
  kku_scope_gate.py resolve-run --repo O/R --workflow deploy-monk-kr.yml --exclude-run ID   # gh 필요
  kku_scope_gate.py resolve-cf --project monk-kr                                            # CF API env 필요

종료 코드: 0 범위 안(또는 비적용) / 1 범위 밖·차단 / 2 판정 불가(오류) — 1·2 모두 배포하지 않는다.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

# ── 패턴 정본 (청구안 §3.2 — 보강=규정 변경, 완화=법률 개정) ─────────────────────────
SCOPE = ["MONK_kr/", "functions/", ".github/", "package.json"]          # §3.1 diff 범위
ALLOWED_ROOT = "MONK_kr/monk_studio/"                                     # R1
ALLOWED_EXT = {".html", ".css", ".json", ".md", ".txt", ".jpg", ".jpeg", ".png",
               ".webp", ".avif", ".svg", ".gif", ".ico"}                  # R2 (.js 제외 — K2-A)
BLOCKED_PATHS = ["functions/", ".github/", "package.json", "MONK_kr/smoke_assert.txt",
                 "_headers", "_redirects", "config.js"]                    # R3
R4_PAT = re.compile(r'<form|<input|<textarea|<select|contenteditable|type\s*=\s*["\']?file', re.I)
R5_PAT = re.compile(r'<script|\son\w+\s*=|javascript:|fetch\s*\(|XMLHttpRequest|sendBeacon|action\s*=|'
                    r'eval\s*\(|new\s+Function|<meta[^>]*http-equiv|<base[\s>]|<object|<embed|srcdoc', re.I)
URL_PAT = re.compile(r'(?:https?:)?//[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+[^\s"\'<>)\\`]*')   # R6
R7_PATH = re.compile(r'monk_studio/store/print/|order|checkout|pay', re.I)
R8_DEL, R8_TOTAL = 10, 100
SCRIPT_EXT = {".html", ".htm", ".svg"}                                    # R5 기존 <script> 블록 내부 추가 줄
GU_SUBJECT = re.compile(r'^꾸 via M2/쌍아\(M2-쌍아-[0-9]{4}-[0-9]{4}\)')   # §3.3

DESC = {
    "R1": "MONK_kr/monk_studio/ 밖 경로", "R2": "허용 외 확장자", "R3": "차단 경로",
    "R4": "폼·입력 추가", "R5": "실행·전송 추가(기존 <script> 블록 내부 포함)", "R6": "신규 외부 URL",
    "R7": "결제·주문 경로", "R8": "일괄 변경(삭제 10↑ 또는 전체 100↑)",
}


def git(*args, check=True):
    p = subprocess.run(["git", "-c", "core.quotePath=false"] + list(args),
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and p.returncode != 0:
        raise RuntimeError("git %s 실패: %s" % (" ".join(args), p.stderr.strip()))
    return p


def rev(x):
    if not x:
        return ""
    p = git("rev-parse", "--verify", "--quiet", x + "^{commit}", check=False)
    return p.stdout.strip() if p.returncode == 0 else ""


def is_ancestor(a, b):
    return git("merge-base", "--is-ancestor", a, b, check=False).returncode == 0


def ext_of(path):
    name = path.rsplit("/", 1)[-1]
    return ("." + name.rsplit(".", 1)[-1].lower()) if "." in name else ""


def norm_url(u):
    return re.sub(r'^https?:', '', u)


def base_urls(base):
    p = git("grep", "-ohIE", r"(https?:)?//[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+[^\"'<>[:space:])\\`]*",
            base, "--", "MONK_kr/", check=False)
    return {norm_url(u) for u in p.stdout.split()}


def script_spans(target, path):
    """target 시점 파일에서 <script>…</script> 블록의 (시작줄, 끝줄) 목록. 1-index, 양끝 포함."""
    p = git("show", "%s:%s" % (target, path), check=False)
    if p.returncode != 0:
        return []
    # JSON-LD(`type="application/ld+json"`)는 실행되지 않는 데이터 블록이라 제외한다(검색 설명문 수정 허용).
    # 단, 그 블록을 *새로* 여는 `<script` 줄 자체는 R5_PAT이 잡는다.
    spans, start, data = [], None, False
    for i, line in enumerate(p.stdout.splitlines(), 1):
        low = line.lower()
        pos = 0
        while True:
            if start is None:
                k = low.find("<script", pos)
                if k < 0:
                    break
                tag_end = low.find(">", k)
                data = "application/ld+json" in low[k:(tag_end if tag_end >= 0 else len(low))]
                start, pos = i, k + 7
            else:
                k = low.find("</script", pos)
                if k < 0:
                    break
                if not data:
                    spans.append((start, i))
                start, pos = None, k + 8
    if start is not None and not data:
        spans.append((start, 10 ** 9))   # 닫히지 않은 블록 = 끝까지
    return spans


def judge(base, target):
    """R1~R8. 반환: (findings[list of (R, file, line, detail)], nfiles, ndel). 예외 = 판정 불가."""
    out = git("diff", "--no-renames", "--name-status", base, target, "--", *SCOPE).stdout
    entries = [l.split("\t") for l in out.splitlines() if l.strip()]
    files = [(e[0][0], e[-1]) for e in entries]
    nfiles, ndel = len(files), sum(1 for s, _ in files if s == "D")
    f = []
    for status, path in files:
        if not path.startswith(ALLOWED_ROOT):
            f.append(("R1", path, "", "경로"))
        elif ext_of(path) not in ALLOWED_EXT:
            f.append(("R2", path, "", ext_of(path) or "(확장자 없음)"))
        for bp in BLOCKED_PATHS:
            if path == bp or path.startswith(bp) or path.endswith("/" + bp):
                f.append(("R3", path, "", bp))
        if R7_PATH.search(path):
            f.append(("R7", path, "", R7_PATH.search(path).group(0)))
    if ndel >= R8_DEL or nfiles >= R8_TOTAL:
        f.append(("R8", "(전체)", "", "삭제 %d · 전체 %d" % (ndel, nfiles)))

    diff = git("diff", "--no-renames", "-U0", base, target, "--", *SCOPE).stdout
    known, cur, newline, spans = None, None, 0, []
    for line in diff.splitlines():
        if line.startswith("+++ "):
            cur = line[6:] if line.startswith("+++ b/") else None
            spans = script_spans(target, cur) if cur and ext_of(cur) in SCRIPT_EXT else []
            continue
        if line.startswith("@@"):
            m = re.match(r'@@ -\S+ \+(\d+)', line)
            newline = int(m.group(1)) if m else 0
            continue
        if not line.startswith("+") or cur is None:
            continue
        text, ln = line[1:], newline
        newline += 1
        m = R4_PAT.search(text)
        if m:
            f.append(("R4", cur, ln, m.group(0)))
        m = R5_PAT.search(text)
        if m:
            f.append(("R5", cur, ln, m.group(0).strip()))
        elif any(a <= ln <= b for a, b in spans):
            f.append(("R5", cur, ln, "기존 <script> 블록 내부"))
        for u in URL_PAT.findall(text):
            if known is None:
                known = base_urls(base)
            if norm_url(u) not in known:
                f.append(("R6", cur, ln, u[:80]))
    return f, nfiles, ndel


def md_cell(s):
    return str(s).replace("|", "\\|").replace("\n", " ")


def render(verdict, rows, base, target, notes, nfiles=None):
    lines = ["## 범위 게이트 (G-K) — %s" % verdict, "",
             "| 항목 | 값 |", "|---|---|",
             "| base | `%s` |" % (base or "-"), "| target | `%s` |" % (target or "-")]
    if nfiles is not None:
        lines.append("| 변경 파일 | %s |" % nfiles)
    for n in notes:
        lines.append("| 비고 | %s |" % md_cell(n))
    if rows:
        lines += ["", "| 조건 | 파일 | 줄 | 내용 |", "|---|---|---|---|"]
        for r, path, ln, d in rows[:60]:
            lines.append("| %s %s | `%s` | %s | `%s` |" % (r, DESC.get(r, ""), md_cell(path), ln, md_cell(d)))
        if len(rows) > 60:
            lines.append("| … | 외 %d건 | | |" % (len(rows) - 60))
    return "\n".join(lines) + "\n"


def emit(text, summary):
    print(text)
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write(text + "\n")


def write_record(path, **kv):
    if path:
        with open(path, "w", encoding="utf-8") as fh:
            for k, v in kv.items():
                fh.write("%s=%s\n" % (k, v or ""))


def cmd_gate(a):
    target = rev(a.target)
    subject = a.reason.split(" | ", 1)[0].strip()
    notes, rows = [], []
    run_base, cf_base = rev(a.run_base), rev(a.cf_base)

    def done(verdict, code, base="", nfiles=None):
        emit(render(verdict, rows, base, target, notes, nfiles), a.summary)
        # record: 배포 후 아티팩트로 올라간다. base는 다음 꾸 롤백의 허용 대상(§3.6)
        write_record(a.record, approver=a.approver, base=base or run_base, target=target,
                     run_id=a.run_id, gate=("pass" if code == 0 else "block"),
                     nfiles=("" if nfiles is None else nfiles))
        return code

    if not target:
        notes.append("target 해석 불가: %s" % a.target)
        return done("⛔ 판정 불가", 2)

    # §3.3 흔적 정합 — 승인자 무관 적용
    if a.approver == "꾸" and not GU_SUBJECT.match(subject):
        notes.append("approver=꾸인데 사유 주체가 `꾸 via M2/쌍아(M2-쌍아-MMDD-HHMM)` 서식이 아님: %s" % subject)
        return done("❌ 차단 (흔적 정합)", 1)
    if a.approver == "작가님" and "꾸" in subject:
        notes.append("approver=작가님인데 사유 주체에 '꾸'가 있음: %s — 꾸 경로는 approver=꾸로" % subject)
        return done("❌ 차단 (흔적 정합)", 1)
    if a.approver not in ("작가님", "꾸"):
        notes.append("approver 값 오류: %s" % a.approver)
        return done("❌ 차단", 1)

    if a.approver == "작가님":
        notes.append("G-K 비적용 — approver=작가님 (ch5 1조 3항 본문 경로). 기록용 base=%s" % (run_base or "미해석"))
        return done("➖ 비적용 (작가님)", 0, run_base)

    # §3.1 ref 고정
    if a.ref != "refs/heads/main":
        notes.append("approver=꾸는 main에서만 — 받은 ref: %s" % a.ref)
        return done("❌ 차단 (비main ref)", 1)
    om = rev("origin/main")
    if not om or not is_ancestor(target, om):
        notes.append("target이 origin/main의 조상이 아님 (origin/main=%s)" % (om or "부재"))
        return done("❌ 차단 (비main target)", 1)

    # §3.1 base — 1순위 run 기록 · 2순위 CF 활성 배포. headSha·CF 목록 최상단 금지
    if not run_base or not cf_base:
        notes.append("base 부재 — run 기록=%s · CF 활성 배포=%s (fail-closed)" % (run_base or "없음", cf_base or "없음"))
        return done("❌ 차단 (base 부재)", 1)
    if run_base != cf_base:
        notes.append("base 불일치 — run 기록 %s ≠ CF 활성 배포 %s (대시보드 롤백·예비 경로 배포 의심)" % (run_base[:8], cf_base[:8]))
        return done("❌ 차단 (base 불일치)", 1, run_base)
    base = run_base

    # §3.6 롤백 — sha 입력은 직전 꾸 run이 기록한 base로만
    if a.sha_input:
        if a.run_approver == "꾸" and rev(a.run_recorded_base) and rev(a.sha_input) == rev(a.run_recorded_base):
            notes.append("꾸 롤백 — 직전 꾸 run의 base `%s`로 되돌림 (§3.6). R1~R8 비대상(이미 라이브였던 내용)" % target[:8])
            return done("✅ 범위 안 (꾸 롤백)", 0, base)
        notes.append("sha 지정은 직전 production 배포가 꾸 run이고 그 run이 기록한 base일 때만 — 직전 approver=%s · 기록 base=%s"
                     % (a.run_approver or "미상", (a.run_recorded_base or "없음")[:8]))
        return done("❌ 차단 (롤백 범위 밖)", 1, base)

    if not is_ancestor(base, target):
        notes.append("base `%s`가 target의 조상이 아님" % base[:8])
        return done("❌ 차단 (비조상)", 1, base)
    try:
        rows[:], nfiles, _ = judge(base, target)
    except Exception as e:  # 판정 불가 = 통과 아님
        notes.append("판정 오류: %s" % e)
        return done("⛔ 판정 불가", 2, base)
    if nfiles == 0:
        notes.append("diff 0건 — 0건은 부재의 증거가 아니다(base 오판 의심). 차단")
        return done("❌ 차단 (diff 0건)", 1, base, 0)
    if rows:
        return done("❌ 범위 밖 — 작가님 승인 경로로", 1, base, nfiles)
    return done("✅ 범위 안", 0, base, nfiles)


def cmd_dry(base, target):
    b, t = rev(base), rev(target)
    if not b or not t:
        print("⛔ 커밋 해석 불가: base=%s target=%s" % (base, target), file=sys.stderr)
        return 2
    rows, nfiles, _ = judge(b, t)
    notes = ["로컬 사전 점검(--dry-run) — 판정 아님. base 산출·ref·흔적 검사는 러너만"]
    if nfiles == 0:
        print(render("❌ 차단 (diff 0건)", rows, b, t, notes, 0))
        return 1
    print(render("❌ 범위 밖" if rows else "✅ 범위 안", rows, b, t, notes, nfiles))
    return 1 if rows else 0


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def cmd_resolve_run(a):
    """직전 *실제* production 배포 run의 기록. 출력: JSON {run_id, commit, approver, base}. 못 찾으면 {}."""
    p = sh(["gh", "run", "list", "-R", a.repo, "--workflow", a.workflow, "--status", "completed",
            "--limit", "30", "--json", "databaseId"])
    if p.returncode != 0:
        print("resolve-run: gh run list 실패: %s" % p.stderr.strip(), file=sys.stderr)
        print("{}")
        return 0
    for r in json.loads(p.stdout or "[]")[: a.max_runs]:
        rid = str(r["databaseId"])
        if rid == str(a.exclude_run):
            continue
        with tempfile.TemporaryDirectory() as d:
            dl = sh(["gh", "run", "download", rid, "-R", a.repo, "-n", "deploy-record", "-D", d])
            path = os.path.join(d, "deploy-record.txt")
            if dl.returncode == 0 and os.path.exists(path):
                kv = dict(l.split("=", 1) for l in open(path, encoding="utf-8").read().splitlines() if "=" in l)
                if kv.get("deployed") == "1":
                    print(json.dumps({"run_id": rid, "commit": kv.get("target", ""),
                                      "approver": kv.get("approver", ""), "base": kv.get("base", "")}))
                    return 0
                continue
        # 기록 없는 과거 run — 실행 로그의 `배포 커밋:` + wrangler 완료 문구가 둘 다 있어야 배포로 인정
        log = sh(["gh", "run", "view", rid, "-R", a.repo, "--log"]).stdout
        m = re.search(r"배포 커밋: ([0-9a-f]{40})", log)
        if m and "Deployment complete!" in log:
            print(json.dumps({"run_id": rid, "commit": m.group(1), "approver": "작가님(기록 이전)", "base": ""}))
            return 0
    print("{}")
    return 0


def cmd_resolve_cf(a):
    """CF Pages 프로젝트의 활성 production 배포(canonical_deployment) 커밋. Idle(미빌드) 항목은 제외."""
    tok, acct = os.environ.get("CLOUDFLARE_API_TOKEN", ""), os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not tok or not acct:
        print("resolve-cf: CLOUDFLARE_API_TOKEN/ACCOUNT_ID 부재", file=sys.stderr)
        return 0
    url = "https://api.cloudflare.com/client/v4/accounts/%s/pages/projects/%s" % (acct, a.project)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + tok})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            res = json.load(resp).get("result") or {}
    except Exception as e:
        print("resolve-cf: API 실패: %s" % e, file=sys.stderr)
        return 0
    dep = res.get("canonical_deployment") or {}
    stage = (dep.get("latest_stage") or {})
    commit = ((dep.get("deployment_trigger") or {}).get("metadata") or {}).get("commit_hash", "")
    if stage.get("status") not in ("success",) or not commit:
        print("resolve-cf: 활성 배포 부적격 — stage=%s/%s commit=%s" % (stage.get("name"), stage.get("status"), commit or "없음"),
              file=sys.stderr)
        return 0
    print(commit)
    return 0


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "--dry-run":
        if len(sys.argv) != 4:
            print("사용: kku_scope_gate.py --dry-run BASE TARGET", file=sys.stderr)
            return 2
        return cmd_dry(sys.argv[2], sys.argv[3])
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    g = sp.add_parser("gate")
    g.add_argument("--approver", required=True)
    g.add_argument("--ref", required=True)
    g.add_argument("--target", required=True)
    g.add_argument("--reason", required=True)
    g.add_argument("--sha-input", default="")
    g.add_argument("--run-base", default="")
    g.add_argument("--run-approver", default="")
    g.add_argument("--run-recorded-base", default="")
    g.add_argument("--cf-base", default="")
    g.add_argument("--summary", default="")
    g.add_argument("--record", default="")
    g.add_argument("--run-id", default="")
    r = sp.add_parser("resolve-run")
    r.add_argument("--repo", required=True)
    r.add_argument("--workflow", required=True)
    r.add_argument("--exclude-run", default="")
    r.add_argument("--max-runs", type=int, default=15)
    c = sp.add_parser("resolve-cf")
    c.add_argument("--project", required=True)
    a = ap.parse_args()
    return {"gate": cmd_gate, "resolve-run": cmd_resolve_run, "resolve-cf": cmd_resolve_cf}[a.cmd](a)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # 예외 = 판정 불가(2). 1(차단)과 구분해 작가님 경로가 크래시로 막히지 않게 한다
        print("⛔ kku_scope_gate 판정 불가: %s: %s" % (type(e).__name__, e), file=sys.stderr)
        sys.exit(2)
