#!/usr/bin/env python3
"""시험 기록 파일 생성 — selection.json(시험·대조 기준선) + drafts.json(전/후 문안) → TEST_20261105_검색제목.md 본문 표.
수치는 GSC 2026-10-06~11-02(28일), 한국 노출 제외. 페이지 URL·공개 문안만(고객 데이터 없음)."""
import argparse, json

ap = argparse.ArgumentParser()
ap.add_argument("--selection", required=True)
ap.add_argument("--drafts", required=True)
a = ap.parse_args()
sel = json.load(open(a.selection, encoding="utf-8"))
dr = {(d["slug"], d["lang"]): d for d in json.load(open(a.drafts, encoding="utf-8"))}


def agg(g):
    imp = sum(x["imp"] for x in g); clk = sum(x["clk"] for x in g)
    pos = sum(x["pos"] * x["imp"] for x in g) / imp
    return imp, clk, clk / imp * 100, pos


out = []
for name, g in (("시험군", sel["test"]), ("대조군", sel["ctrl"])):
    imp, clk, ctr, pos = agg(g)
    out.append(f"| {name} | {len(g)} | {sum(x['lang']=='en' for x in g)} / {sum(x['lang']=='es' for x in g)} | {imp:,} | {clk} | {ctr:.2f}% | {pos:.2f} |")
print("## 기준선 요약 (GSC 2026-10-06~11-02, 한국 노출 제외)\n")
print("| 군 | 페이지 | en / es | 노출 | 클릭 | CTR | 평균 순위(노출 가중) |")
print("|---|---:|---|---:|---:|---:|---:|")
print("\n".join(out))
print("\n## 짝별 기준선 (같은 짝 = 노출 규모가 인접한 두 페이지, 시드 1105로 배정)\n")
print("| 짝 | 시험 페이지 | 노출 | 클릭 | CTR | 순위 | 대조 페이지 | 노출 | 클릭 | CTR | 순위 |")
print("|---:|---|---:|---:|---:|---:|---|---:|---:|---:|---:|")
ctrl = {x["pair"]: x for x in sel["ctrl"]}
short = lambda u: u.replace("https://monkos.ai", "")
for t in sel["test"]:
    c = ctrl[t["pair"]]
    print(f"| {t['pair']} | `{short(t['url'])}` | {t['imp']} | {t['clk']} | {t['ctr']*100:.2f}% | {t['pos']:.1f} | `{short(c['url'])}` | {c['imp']} | {c['clk']} | {c['ctr']*100:.2f}% | {c['pos']:.1f} |")
print("\n## 시험군 문안 전/후\n")
print("| 짝 | 페이지 | 전 제목 | 후 제목 | 후 설명 |")
print("|---:|---|---|---|---|")
esc = lambda s: (s or "").replace("|", "\\|")
for t in sel["test"]:
    d = dr[(t["slug"], t["lang"])]
    print(f"| {t['pair']} | `{short(t['url'])}` | {esc(d['oldTitle'])} | {esc(d['title'])} | {esc(d['desc'])} |")
print("\n<details><summary>시험군 전 설명(원문)</summary>\n")
for t in sel["test"]:
    d = dr[(t["slug"], t["lang"])]
    print(f"- `{short(t['url'])}`: {esc(d['oldDesc'])}")
print("\n</details>")
