#!/usr/bin/env python3
"""무료 대본 vs 교정 정답본(Gemini 풀 감상 line) — 같은 구간 정렬·오류율·교정 사전 (PF_GO, 11-05 22:18 지시서 §12)
  align_eval.py VIDEO_ID 시작초 끝초 이름,이름,…   → 표 출력 + cmp/<ID>_free_<시작>/eval.json
  지표: 글자 오류율(CER, 공백·문장부호 제외) · 바둑 용어 재현율 · 이름 재현율 · 교정 사전(정답 ↔ 오인식, 단어 수준 치환)
"""
import json, re, sys
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
B = Path.home() / ".monkos" / "go-commentary-yt" / "cmp"
vid, s0, s1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
names = [n for n in (sys.argv[4].split(",") if len(sys.argv) > 4 else []) if n]
F = B / f"{vid}_free_{s0}"


def secs(mmss):
    p = [int(x) for x in str(mmss).split(":")]
    return p[0] * 3600 + p[1] * 60 + p[2] if len(p) == 3 else p[0] * 60 + p[1]


def norm(s):
    return re.sub(r"[^가-힣A-Za-z0-9]", "", s)


def cer(ref, hyp):
    a, b = norm(ref), norm(hyp)
    if not a:
        return None
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1] / len(a)


full = json.loads((B / f"{vid}_full" / "gemini_full.json").read_text())
ref_lines = [s["line"] for s in full["scenes"] if s.get("line") and s0 <= secs(s["t_start"]) < s1]
ref = " ".join(ref_lines)
src = (Path(__file__).resolve().parent.parent / "go-commentary-pilot" / "lexicon.yaml").read_text(encoding="utf-8")
TERMS = sorted(set(t.strip() for t in re.findall(r'(?:name|ko|term)\s*:\s*"?([가-힣][가-힣 ]{0,8})', src))
               | {"대세점", "쌍립", "삼삼", "걸침", "협공", "정석", "사활", "끝내기", "포석", "행마", "수상전", "형세", "대마", "어깨짚음", "입구자", "덤", "반집", "불계"})
TERMS = set(TERMS) | {t for s in full["scenes"] for t in (s.get("terms") or [])}
hyps = {}
for tag, fn in (("자동 자막", "auto.json"), ("whisper", "whisper_plain.json"), ("whisper+힌트1(긴 프롬프트+hotwords)", "whisper_hint.json"), ("whisper+힌트2(짧은 프롬프트)", "whisper_hint2.json")):
    p = F / fn
    if p.exists():
        hyps[tag] = " ".join(x["text"] for x in json.loads(p.read_text()))


def recall(words, ref, hyp):
    rc = {w: norm(ref).count(norm(w)) for w in words if norm(w) and norm(ref).count(norm(w))}
    if not rc:
        return None, 0
    hit = sum(min(c, norm(hyp).count(norm(w))) for w, c in rc.items())
    return hit / sum(rc.values()), sum(rc.values())


def subs(ref, hyp):
    a, b = ref.split(), hyp.split()
    out = Counter()
    for op, i1, i2, j1, j2 in SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == "replace" and i2 - i1 <= 2 and j2 - j1 <= 2:
            r, h = " ".join(a[i1:i2]), " ".join(b[j1:j2])
            if norm(r) != norm(h) and (any(t in r for t in TERMS) or any(n in r for n in names)):
                out[(r, h)] += 1
    return out


res = {"ref_chars": len(norm(ref)), "ref_lines": len(ref_lines), "rows": {}}
print(f"## {vid} {s0}~{s1}초 — 정답본 {len(ref_lines)}줄 {len(norm(ref))}자")
print("| 대본 | 글자 오류율 | 용어 재현율(정답 등장 수) | 이름 재현율(정답 등장 수) |")
print("|---|---|---|---|")
for tag, hyp in hyps.items():
    c = cer(ref, hyp)
    tr, tn = recall(TERMS, ref, hyp)
    nr, nn = recall(names, ref, hyp)
    sb = subs(ref, hyp)
    res["rows"][tag] = {"cer": c, "term_recall": tr, "term_n": tn, "name_recall": nr, "name_n": nn,
                        "subs": [[r, h, n] for (r, h), n in sb.most_common(30)]}
    f = lambda x: "-" if x is None else f"{x:.0%}"
    print(f"| {tag} | {f(c)} | {f(tr)} ({tn}) | {f(nr)} ({nn}) |")
for tag, row in res["rows"].items():
    if row["subs"]:
        print(f"- {tag} 교정 사전 후보: " + " · ".join(f"'{h}'→'{r}'" for r, h, n in row["subs"][:12]))
(F / "eval.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
