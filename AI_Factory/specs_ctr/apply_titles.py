#!/usr/bin/env python3
"""specs 검색 제목 시험 문안 반영 + diff 검증 (ORDER_20261105 SPECS_검색제목_셀카무료AI검증_50페이지시험).

입력: drafts.json(시험군 50건: slug·lang·title·desc) — 레포 밖 작업 파일.
동작: specs-data.json 의 대상 (slug, lang) seoTitle·seoDescription 만 바꾼다. 서식은 원본과 같은 직렬화(indent 2·ensure_ascii False·끝 줄바꿈).
검증: 바꾸기 전 원본을 다시 직렬화해 바이트가 같은지(서식 보존) → 변경 후 전 항목·전 필드를 비교해 바뀐 경로가 정확히 대상 (slug, seoTitle|seoDescription, lang) 집합인지.
--check 만 주면 쓰지 않고 검증만 한다.
"""
import argparse, json, sys

ap = argparse.ArgumentParser()
ap.add_argument("--data", required=True)
ap.add_argument("--drafts", required=True)
ap.add_argument("--check", action="store_true")
a = ap.parse_args()

raw = open(a.data, encoding="utf-8").read()
orig = json.loads(raw)
ser = lambda d: json.dumps(d, ensure_ascii=False, indent=2) + "\n"
if ser(orig) != raw:
    sys.exit("❌ apply_titles: 원본 재직렬화가 바이트 단위로 다르다 — 서식 보존 불가, 중단")

# 제목 60자 예외 — 민아 11-05 05:14 승인(픽셀 기준 잘림 없음)
TITLE_EXC = {"cr-passport|es", "gt-passport|es"}
drafts = json.load(open(a.drafts, encoding="utf-8"))
new = json.loads(raw)
expected = set()
for d in drafts:
    s, L = d["slug"], d["lang"]
    if L not in ("en", "es"):
        sys.exit(f"❌ apply_titles: en·es 외 언어 {s}|{L}")
    for f, v in (("seoTitle", d["title"]), ("seoDescription", d["desc"])):
        if not v:
            sys.exit(f"❌ apply_titles: 빈 문안 {s}|{L}|{f}")
        tmax = 62 if f"{s}|{L}" in TITLE_EXC else 60
        if f == "seoTitle" and len(v) > tmax or f == "seoDescription" and len(v) > 155:
            sys.exit(f"❌ apply_titles: 길이 초과 {s}|{L}|{f} {len(v)}")
        if L not in new[s][f]:
            sys.exit(f"❌ apply_titles: 원본에 {s}.{f}.{L} 없음")
        new[s][f][L] = v
        expected.add((s, f, L))


def diff_paths(x, y, path=()):
    if isinstance(x, dict) and isinstance(y, dict):
        out = set()
        for k in set(x) | set(y):
            if k not in x or k not in y:
                out.add(path + (k,))
            else:
                out |= diff_paths(x[k], y[k], path + (k,))
        return out
    return set() if x == y else {path}


changed = diff_paths(orig, new)
if changed != expected:
    sys.exit(f"❌ apply_titles: 변경 경로 불일치 — 예상 외 {sorted(changed - expected)[:5]} · 누락 {sorted(expected - changed)[:5]}")
print(f"✅ 변경 경로 {len(changed)}개 = 대상 {len(drafts)}페이지 × (seoTitle, seoDescription) · 다른 키 변경 0 · 항목 수 {len(orig)} 불변")
if not a.check:
    open(a.data, "w", encoding="utf-8").write(ser(new))
    print("✍️ 반영 완료:", a.data)
