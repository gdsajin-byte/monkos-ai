"""교사 비교 (설계 §4 ②) — 같은 사실 JSON으로 haiku·sonnet·opus 해설 3수준 생성.

  python3 teacher.py [model ...]   # data/teacher/{model}/{pos_id}.json

호출: `claude -p --model {m}` (구독 경로, API 키 미사용). 도구 0·MCP 0·세션 비보존.
레포 밖 작업 폴더에서 실행해 프로젝트 CLAUDE.md·훅이 교사 입력에 섞이지 않게 한다.
"""
import concurrent.futures as cf
import glob
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
WORKDIR = os.path.expanduser("~/.monkos/katago/teacher-cwd")
MODELS = ["haiku", "sonnet", "opus"]
PARALLEL = 3

SYSTEM = """너는 바둑 해설가다. 판을 직접 보지 않는다. 주어진 '사실 목록'만 말로 옮긴다.
규칙:
- 사실 목록에 없는 수치·좌표·그룹·수순을 만들지 않는다. 추측·일반론으로 빈칸을 채우지 않는다.
- 모든 문장 끝에 근거 사실 ID를 대괄호로 붙인다. 예: "여기서 6.2집을 잃었어요. [F1]" / 여러 개면 [F1,F3].
- 숫자는 사실에 나온 값 그대로 쓴다(반올림 금지). 좌표도 사실에 나온 표기(예: Q16) 그대로.
- 3수준으로 쓴다:
  아이 = 초등학생용, 2~3문장, 쉬운 말, 좌표 대신 '오른쪽 위' 같은 말 허용(단 사실의 영역명과 일치).
  아마 = 급수 아마추어용, 3~4문장, 왜 실수인지와 어디를 뒀어야 했는지.
  유단 = 유단자용, 3~5문장, 수순·급함과 큼·그룹 상태 중심.
- 출력은 JSON 하나만: {"아이": ["문장", ...], "아마": [...], "유단": [...]}. 코드 블록·설명 금지."""


def prompt_for(fx):
    lines = [f"국면 {fx['pos_id']} — {('흑' if fx['color'] == 'B' else '백')} {fx['move_number']}수째 {fx['actual']} (최선수 {fx['best']})",
             "사실 목록:"]
    lines += [f"[{f['id']}] ({f['type']}) {f['text']}" for f in fx["facts"]]
    return "\n".join(lines)


def call(model, fx):
    t = time.time()
    r = subprocess.run(
        ["claude", "-p", "--model", model, "--output-format", "json", "--tools", "",
         "--strict-mcp-config", "--no-session-persistence", "--system-prompt", SYSTEM],
        input=prompt_for(fx), capture_output=True, text=True, cwd=WORKDIR, timeout=300)
    wall = time.time() - t
    try:
        env = json.loads(r.stdout)
    except json.JSONDecodeError:
        env = {"result": r.stdout, "is_error": True, "stderr": r.stderr[-500:]}
    text = env.get("result", "")
    body = text.strip()
    if body.startswith("```"):
        body = body.strip("`").split("\n", 1)[-1]
    try:
        out = json.loads(body[body.find("{"): body.rfind("}") + 1])
    except (json.JSONDecodeError, ValueError):
        out = None
    return {"pos_id": fx["pos_id"], "model": model, "wall_secs": round(wall, 1),
            "duration_ms": env.get("duration_ms"), "cost_usd": env.get("total_cost_usd"),
            "is_error": env.get("is_error", False) or out is None, "raw": text, "levels": out}


def main():
    models = sys.argv[1:] or MODELS
    os.makedirs(WORKDIR, exist_ok=True)
    fxs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(DATA, "facts", "P*.json")))]
    jobs = []
    for m in models:
        os.makedirs(os.path.join(DATA, "teacher", m), exist_ok=True)
        for fx in fxs:
            dst = os.path.join(DATA, "teacher", m, f"{fx['pos_id']}.json")
            if not os.path.exists(dst):
                jobs.append((m, fx, dst))
    with cf.ThreadPoolExecutor(PARALLEL) as ex:
        futs = {ex.submit(call, m, fx): dst for m, fx, dst in jobs}
        for fu in cf.as_completed(futs):
            res = fu.result()
            json.dump(res, open(futs[fu], "w"), ensure_ascii=False, indent=1)
            print(res["model"], res["pos_id"], res["wall_secs"], "ERR" if res["is_error"] else "ok", flush=True)


if __name__ == "__main__":
    main()
