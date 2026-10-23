"""검증기 (설계 §4 ③) — 문장별 근거 사실 ID 대조.

  python3 verify.py      # data/teacher/*/*.json → data/verify.json + 모델별 요약 출력

두 층으로 판정한다.
  모순(hard) — 무태그 · 없는 ID · 국면의 어느 사실(+머리말: 수 번호·실제 수·최선수)에도 없는 수치·좌표·영역명
           + 의미 모순: 영역·집 수치 짝이 F3과 다름 / "급한" 주장인데 F7 판정이 급함 아님
  인용 불일치(soft) — 값은 사실 목록에 있으나 그 문장이 인용한 사실에는 없음 (태그 누락)
통과율 = 모순 없는 문장 비율. 엄격 통과율 = 모순·인용 불일치 둘 다 없는 비율.
수치 비교는 부호 무시·값 일치(사실이 6.2면 6.2만 통과, 6이나 6.0은 탈락 — 반올림 금지 규칙).
"""
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")

TAG = re.compile(r"\[\s*([FX]\d+(?:\s*[,，]\s*[FX]\d+)*)\s*\]")  # F=사실, X=발동 개념(바둑판 열 A~T와 겹치지 않는 글자)
NUM = re.compile(r"\d+(?:\.\d+)?")
COORD = re.compile(r"(?<![A-Za-z])([A-HJ-T](?:1[0-9]|[1-9]))(?![0-9A-Za-z])")
REGIONS = ["좌상귀", "우상귀", "좌하귀", "우하귀", "좌변", "우변", "상변", "하변", "중앙"]
PLAIN = {"오른쪽 위": "우상귀", "왼쪽 위": "좌상귀", "오른쪽 아래": "우하귀", "왼쪽 아래": "좌하귀",
         "오른쪽 변": "우변", "왼쪽 변": "좌변", "위쪽 변": "상변", "아래쪽 변": "하변", "가운데": "중앙"}


def nums(s):
    return {float(n) for n in NUM.findall(s)}


def values(body, src):
    """body의 좌표·수치·영역 중 src에 없는 것."""
    miss = []
    # 좌표를 먼저 걷어내야 Q16의 16이 수치로 잡히지 않는다
    for c in COORD.findall(body):
        if c not in src:
            miss.append(f"좌표 {c}")
    src_n = nums(COORD.sub(" ", src))
    for n in nums(COORD.sub(" ", body)):
        if n not in src_n:
            miss.append(f"수치 {n:g}")
    for r in REGIONS:
        if r in body and r not in src:
            miss.append(f"영역 {r}")
    for k, r in PLAIN.items():
        if k in body and r not in src:
            miss.append(f"영역 {k}(={r})")
    return miss


PAIR = re.compile("(" + "|".join(REGIONS) + r")에서\s*(?:약\s*)?(?:[−-])?(\d+\.\d)\s*집")


def pairs(body):
    """'{영역}에서 (약) N.N집' 형태만 짝으로 본다 (총 손실 문장과의 오결합 방지)."""
    return PAIR.findall(body)


def semantic(body, sem):
    errs = []
    for reg, val in pairs(body):
        if reg in sem["f3"] and abs(sem["f3"][reg] - float(val)) > 0.05:
            errs.append(f"결합 {reg} {val}≠{sem['f3'][reg]}")
    if "급한" in body and "안 급한" not in body and "급하지" not in body and sem["f7"] != "급함":
        errs.append(f"판정 급함≠{sem['f7']}")
    return errs


def check(sentence, facts, header, sem):
    """→ (모순 목록, 인용 불일치 목록)"""
    m = list(TAG.finditer(sentence))
    if not m:
        return ["무태그"], []
    ids = {i.strip() for t in m for i in re.split(r"[,，]", t.group(1))}
    unknown = ids - facts.keys()
    if unknown:
        return [f"없는 ID {sorted(unknown)}"], []
    body = TAG.sub("", sentence)
    hard = values(body, header + " " + " ".join(facts.values())) + semantic(body, sem)
    soft = [e for e in values(body, header + " " + " ".join(facts[i] for i in ids)) if e not in hard]
    return hard, soft


def main():
    facts, header, sems = {}, {}, {}
    for f in glob.glob(os.path.join(DATA, "facts", "P*.json")):
        fx = json.load(open(f))
        facts[fx["pos_id"]] = {x["id"]: x["text"] for x in fx["facts"]}
        header[fx["pos_id"]] = f"{fx['move_number']} {fx['actual']} {fx['best']}"
        d = {x["id"]: x["data"] for x in fx["facts"]}
        sems[fx["pos_id"]] = {"f3": {r: v for r, v in d["F3"]["lost"] + d["F3"]["gained"]},
                              "f7": d["F7"]["kind"]}
    rows, summary = [], {}
    for f in sorted(glob.glob(os.path.join(DATA, "teacher", "*", "P*.json"))):
        t = json.load(open(f))
        s = summary.setdefault(t["model"], {"responses": 0, "parse_fail": 0, "sentences": 0, "passed": 0,
                                            "strict_passed": 0, "clean_responses": 0, "secs": [],
                                            "reasons": {}, "soft_reasons": {}})
        s["responses"] += 1
        s["secs"].append(t["wall_secs"])
        if not t["levels"]:
            s["parse_fail"] += 1
            rows.append({"model": t["model"], "pos_id": t["pos_id"], "parse_fail": True})
            continue
        clean = True
        for lvl, sents in t["levels"].items():
            for sent in sents:
                errs, soft = check(sent, facts[t["pos_id"]], header[t["pos_id"]], sems[t["pos_id"]])
                s["sentences"] += 1
                for bucket, lst in (("reasons", errs), ("soft_reasons", soft)):
                    for e in lst:
                        k = e.split(" ")[0]
                        s[bucket][k] = s[bucket].get(k, 0) + 1
                if errs:
                    clean = False
                else:
                    s["passed"] += 1
                    s["strict_passed"] += not soft
                rows.append({"model": t["model"], "pos_id": t["pos_id"], "level": lvl,
                             "sentence": sent, "errors": errs, "soft": soft})
        s["clean_responses"] += clean
    for m, s in summary.items():
        secs = sorted(s.pop("secs"))
        s["sec_median"] = secs[len(secs) // 2]
        s["sec_mean"] = round(sum(secs) / len(secs), 1)
        s["pass_rate"] = round(s["passed"] / s["sentences"], 3) if s["sentences"] else 0
        s["strict_rate"] = round(s["strict_passed"] / s["sentences"], 3) if s["sentences"] else 0
    json.dump({"summary": summary, "rows": rows}, open(os.path.join(DATA, "verify.json"), "w"),
              ensure_ascii=False, indent=1)
    for m in ("haiku", "sonnet", "opus"):
        if m in summary:
            print(m, json.dumps(summary[m], ensure_ascii=False))


if __name__ == "__main__":
    main()
