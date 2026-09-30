#!/usr/bin/env python3
"""pf.py + pf_autolink + stop_check 스모크 — 임시 PF_SMOKE 를 만들어 검증 후 삭제. exit 1 = FAIL."""
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PF = ROOT / "monkos-ops/ops/portfolios/PF_SMOKE"
DOC = ROOT / "monkos-ops/ops/reports/2026-09/COMPLETION_20260930_smoke_pf자동링크.md"
ENV = dict(os.environ, CLAUDE_PROJECT_DIR=str(ROOT))
ENV.pop("MONK_HOOKS_OFF", None)
res = []


def expect(label, got, want):
    ok = got == want
    res.append(ok)
    print("%s %-44s want=%s got=%s" % ("PASS" if ok else "FAIL", label, want, got))


def pf(*args):
    p = subprocess.run([sys.executable, str(ROOT / "scripts/pf.py"), *args], capture_output=True, text=True, env=ENV)
    return p.returncode, p.stdout + p.stderr


def hook(script, payload):
    p = subprocess.run([sys.executable, str(HERE / script)], input=json.dumps(payload), capture_output=True, text=True, env=ENV)
    return p.returncode, p.stdout, p.stderr


try:
    PF.mkdir(parents=True, exist_ok=True)
    (PF / "README.md").write_text(
        "---\ntype: portfolio\nid: PF_SMOKE\nname: \"SMOKE\"\nstatus: active\nleads: \"smoke\"\n---\n\n# PF_SMOKE\n\n## 2. 히스토리\n\n"
        "| 날짜 | 주체 | 내용 | 산출물 | 상태 |\n|------|------|------|--------|------|\n| 09/01 | smoke | 최초 | — | ✅ |\n\n## 3. Phase\n\n- 없음\n",
        encoding="utf-8")
    rc, out = pf("append", "SMOKE", "행 추가 a|b", "--agent", "iMac/민아", "--status", "⏳")
    expect("append rc", rc, 0)
    txt = (PF / "README.md").read_text()
    expect("append MM/DD 형식·파이프 이스케이프", "| iMac/민아 | 행 추가 a｜b | — | ⏳ |" in txt, True)
    expect("append 위치=히스토리 블록 끝", txt.index("행 추가") < txt.index("## 3. Phase"), True)
    rc, out = pf("append", "PF_SMOKE", "산출물 링크", "--agent", "x", "--artifact", "scripts/pf.py")
    expect("artifact 상대 링크", "[pf](../../../../scripts/pf.py)" in (PF / "README.md").read_text(), True)
    rc, out = pf("append", "PF_SMOKE", "중복", "--agent", "x", "--artifact", "scripts/pf.py")
    expect("중복 거부 rc=2", rc, 2)
    rc, out = pf("append", "PF_NOPE", "x", "--agent", "x")
    expect("PF 부재 rc=2", rc, 2)
    rc, out = pf("query", "--pf", "SMOKE")
    expect("query 표 출력", "PF_SMOKE" in out and "1 PF" in out, True)
    rc, out = pf("show", "PF_SMOKE", "--tail", "2")
    expect("show tail", "산출물 링크" in out, True)
    # autolink 훅
    DOC.write_text("---\ntype: completion\ndate: 2026-09-30\ndevice: iMac\nagent: 민아\nstatus: 마감\nportfolio: PF_SMOKE\nsubject: \"자동 링크 스모크\"\n---\n\n# x\n", encoding="utf-8")
    rc, out, err = hook("pf_autolink.py", {"hook_event_name": "PostToolUse", "tool_name": "Write", "tool_input": {"file_path": str(DOC)}})
    expect("autolink rc", rc, 0)
    expect("autolink 행 추가", "**COMPLETION** 자동 링크 스모크" in (PF / "README.md").read_text(), True)
    expect("autolink 컨텍스트 안내", "[PF 자동 링크]" in out, True)
    rc, out, err = hook("pf_autolink.py", {"hook_event_name": "PostToolUse", "tool_name": "Write", "tool_input": {"file_path": str(DOC)}})
    expect("autolink 중복 무동작", out.strip(), "")
    rc, out, err = hook("pf_autolink.py", {"hook_event_name": "PostToolUse", "tool_name": "Write", "tool_input": {"file_path": str(ROOT / "scripts/pf.py")}})
    expect("autolink 비대상 경로 무동작", out.strip(), "")
    # check
    rc, out = pf("check", "--days", "1")
    expect("check 링크 정상", "COMPLETION_20260930_smoke" not in out, True)
    (PF / "README.md").write_text((PF / "README.md").read_text().replace("COMPLETION_20260930_smoke_pf자동링크.md", "GONE"), encoding="utf-8")
    rc, out = pf("check", "--days", "1", "--strict")
    expect("check 누락 감지 --strict rc=1", rc == 1 and "COMPLETION_20260930_smoke" in out, True)
    # stop_check
    rc, out, err = hook("stop_check.py", {"hook_event_name": "Stop", "stop_hook_active": False})
    expect("stop_check PF 미갱신 경고", "PF 미갱신" in out and "COMPLETION_20260930_smoke" in out, True)
    rc, out, err = hook("stop_check.py", {"hook_event_name": "Stop", "stop_hook_active": True})
    expect("stop_check 재진입 무동작", out.strip(), "")
finally:
    shutil.rmtree(PF, ignore_errors=True)
    if DOC.exists():
        DOC.unlink()

n = len(res); f = n - sum(res)
print("\n%d/%d PASS%s" % (n - f, n, "" if not f else " — FAIL %d" % f))
sys.exit(1 if f else 0)
