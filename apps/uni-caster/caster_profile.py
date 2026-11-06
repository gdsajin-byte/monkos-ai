#!/usr/bin/env python3
"""실제 캐스터 발화 → 말투 특징표(분포).

  python3 caster_profile.py

입력(레포 밖): ~/.monkos/go-board/analysis/commentary_v0/refine/v1_{영상}_in*.jsonl + _out*.jsonl (막내1 정제·분류 v1)
              — out 파일이 아직 없는 묶음(진행 중)은 건너뛴다. 실행 시점의 처리 분만 센다.
출력: data/caster_profile_v0.json (분포만 — 생성 규칙·점검이 읽는다)
      reports/CASTER_PROFILE_v0.md (특징표)
      ~/.monkos/uni-caster/caster_by_video_v0.json (영상별 — 내부 분석용, 레포 밖)
대상 발화: role=캐스터 · keep · 라벨 ∈ {Q, 추임새, 국면, 형세, 수순} (선수대회·기타는 바둑 장면 밖이라 별도 집계만)
"""
import datetime as dt
import glob
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import features as F  # noqa: E402

REFINE = os.path.expanduser(os.environ.get("REFINE_DIR", "~/.monkos/go-board/analysis/commentary_v0/refine"))
PRIV = os.path.expanduser("~/.monkos/uni-caster")
SCENE_LABELS = {"Q", "추임새", "국면", "형세", "수순"}


def load():
    out = []  # (영상, 라벨, 텍스트)
    files = 0
    for f in sorted(glob.glob(os.path.join(REFINE, "v1_*_out*.jsonl"))):
        fi = f.replace("_out", "_in")
        if not os.path.exists(fi):
            continue
        vid = os.path.basename(f)[3:].rsplit("_out", 1)[0]
        ins = {}
        for line in open(fi, encoding="utf-8"):
            d = json.loads(line)
            ins[d["i"]] = d
        files += 1
        for line in open(f, encoding="utf-8"):
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("role") != "캐스터" or not d.get("keep"):
                continue
            t = ins.get(d["i"], {}).get("text", "")
            if t.strip():
                out.append((vid, d.get("label"), t))
    return out, files


def table(c, total=None, top=None):
    t = total or sum(c.values()) or 1
    rows = sorted(c.items(), key=lambda kv: -kv[1])[:top]
    return "\n".join(f"| {k} | {v} | {v / t:.1%} |" for k, v in rows)


def main():
    rows, files = load()
    vids = sorted({v for v, _, _ in rows})
    scene = [t for _, l, t in rows if l in SCENE_LABELS]
    other = [t for _, l, t in rows if l not in SCENE_LABELS]
    p = F.profile(scene)
    p_all = F.profile([t for _, _, t in rows])
    labels = {}
    for _, l, _ in rows:
        labels[l or "-"] = labels.get(l or "-", 0) + 1
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d %H:%M KST")
    meta = {"generated": now, "videos": len(vids), "files": files, "caster_utterances": len(rows),
            "scene_utterances": len(scene), "labels": labels}
    os.makedirs(os.path.join(HERE, "data"), exist_ok=True)
    json.dump({"meta": meta, "scene": p, "all": p_all}, open(os.path.join(HERE, "data", "caster_profile_v0.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    # 영상별(내부) — 레포 밖
    os.makedirs(PRIV, exist_ok=True)
    by = {v: F.profile([t for vv, l, t in rows if vv == v and l in SCENE_LABELS]) for v in vids}
    json.dump(by, open(os.path.join(PRIV, "caster_by_video_v0.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # 질문 예시(유형별 3) — 짧은 것만, 출처 영상 비표기
    random.seed(20261107)
    qex = {}
    for t in scene:
        for s in F.sentences(t):
            if F.is_question(s) and 4 <= len(s) <= 40:
                qex.setdefault(F.qtype(s), []).append(s)
    ex_lines = []
    for k in ["왜", "어떻게", "확인", "감탄 되묻기", "의견 청하기", "기타"]:
        xs = qex.get(k, [])
        ex_lines.append(f"| {k} | " + " / ".join(random.sample(xs, min(3, len(xs)))) + " |")

    md = f"""---
type: research
date: {now[:10]}
portfolio: PF_PRESENTATION
source: apps/uni-caster/caster_profile.py
---

# 실제 캐스터 말투 특징표 v0 — 분포만

> 생성 {now}. 입력 = 막내1 정제·분류 v1(레포 밖 `commentary_v0/refine/v1_*`) 중 실행 시점 처리분 — 영상 {len(vids)}편 · 묶음 {files}개.
> 대상 = 화자 '캐스터'로 분류된 남긴 발화 {len(rows)}개 중 장면 라벨(Q·추임새·국면·형세·수순) {len(scene)}개. 선수대회·기타 {len(other)}개는 바둑 장면 밖이라 제외.
> 실존 캐스터 이름·영상별 표는 레포 밖 `~/.monkos/uni-caster/caster_by_video_v0.json`(내부 분석용). 생성 규칙·점검은 이 분포만 쓴다.
> 한계: 자동 자막이라 문장 부호가 불완전하다 — 문장 나눔은 `. ? !` 기준, 부호 없는 긴 구간은 한 문장으로 잡힌다(긴 쪽 꼬리가 과대).

## 1. 라벨 구성(캐스터 발화)

| 라벨 | 발화 | 비율 |
|---|---|---|
{table(labels)}

## 2. 문장 길이(어절)

문장 {p['sentences']} · 질문 {p['questions']} ({p['questions'] / max(1, p['sentences']):.1%}) · 단독 반응 발화(네·음·아 등) {p['reaction_only']} ({p['reaction_only'] / max(1, p['utterances']):.1%} of 발화)

| 구간 | 문장 | 비율 |
|---|---|---|
{table(p['length'])}

## 3. 어미(문장 끝)

| 어미 계열 | 문장 | 비율 |
|---|---|---|
{table(p['ending'])}

## 4. 추임새(문장 첫머리)

| 첫머리 | 문장 | 비율 |
|---|---|---|
{table(p['head'])}

## 5. 질문 유형

| 유형 | 문장 | 비율 |
|---|---|---|
{table(p['qtype'])}

**예시(무작위, 40자 이하)**

| 유형 | 예 |
|---|---|
{chr(10).join(ex_lines)}

## 6. 생성 규칙으로 옮긴 것

- 유니 문장은 짧게: 실제 캐스터 질문·리액션은 3–10어절이 중심 — 유니 한 턴 1~2문장, 문장 12어절 이하 권장.
- 어미 섞기: `-네요·-군요·-죠·-나요/-가요·-습니다` 를 고루. 한 장면에서 같은 어미 3연속 금지.
- 첫머리 '자'는 장면 열기·넘기기에, '아'는 리액션에. 단독 '네'는 해설 중간 맞장구로만(학습 대상 문장 수에서 제외 가능).
- 질문은 확인형이 가장 많고 '어떻게'가 다음 — 유니도 확인·어떻게를 중심, '왜'는 장면당 1회 안팎.
"""
    os.makedirs(os.path.join(HERE, "reports"), exist_ok=True)
    open(os.path.join(HERE, "reports", "CASTER_PROFILE_v0.md"), "w", encoding="utf-8").write(md)
    print(json.dumps(meta, ensure_ascii=False))
    print("길이", p["length"]); print("어미", p["ending"]); print("첫머리", p["head"]); print("질문", p["qtype"])


if __name__ == "__main__":
    main()
