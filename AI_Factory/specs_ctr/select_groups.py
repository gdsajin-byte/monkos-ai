"""시험군·대조군 선정 — GSC(2026-10-06~11-02) en·es specs 페이지, 한국 외 노출 상위 100을 노출순으로 짝지어 쌍마다 무작위 배정(시드 1105).
URL→slug 매핑은 렌더러 parseSlug와 같은 규칙(TYPE_SLUG_PATTERNS를 소스에서 읽음 — 사본 하드코딩 없음)."""
import json, random, re

import os
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "../../monkos_AI/portal")
T = HERE
src = open(f"{P}/lib/cms/render-specs.js").read()
pats = re.findall(r"'([a-z0-9-]+)'", re.search(r"const TYPE_SLUG_PATTERNS = \[(.*?)\];", src, re.S).group(1))
data = json.load(open(f"{P}/lib/cms/specs-data.json"))


def parse(slug):
    for p in pats:
        if slug.endswith("-" + p):
            return p, slug[: -(len(p) + 1)]
    i = slug.rfind("-")
    return (slug[i + 1:], slug[:i]) if i > 0 else (slug, "")


route = {}
for slug in data:
    t, c = parse(slug)
    route[f"{t}/{c}"] = slug
raw = json.load(open(f"{T}/gsc_raw.json"))
kor = {r["keys"][0]: r for r in raw["kor"]}
rows, unmapped = [], []
for r in raw["all"]:
    url = r["keys"][0]
    m = re.match(r"^https://monkos\.ai/(en|es)/specs/([^?#]+?)/?$", url)
    if not m:
        unmapped.append(url); continue
    lang, rk = m.group(1), m.group(2)
    slug = route.get(rk)
    if not slug:
        unmapped.append(url); continue
    k = kor.get(url, {"impressions": 0, "clicks": 0})
    imp = r["impressions"] - k["impressions"]; clk = r["clicks"] - k["clicks"]
    if not (data[slug].get("seoTitle") or {}).get(lang):
        unmapped.append(url + " (seoTitle 없음)"); continue
    rows.append({"url": url, "lang": lang, "slug": slug, "imp": imp, "clk": clk, "ctr": clk / imp if imp else 0,
                 "pos": r["position"], "impAll": r["impressions"]})
rows.sort(key=lambda x: (-x["imp"], x["url"]))
top = rows[:100]
rnd = random.Random(1105)
test, ctrl = [], []
for i in range(0, 100, 2):
    a, b = top[i], top[i + 1]
    if rnd.random() < 0.5: a, b = b, a
    a["group"], b["group"], a["pair"], b["pair"] = "test", "ctrl", i // 2 + 1, i // 2 + 1
    test.append(a); ctrl.append(b)
json.dump({"test": test, "ctrl": ctrl, "unmapped": unmapped, "universe": len(rows)}, open(f"{T}/selection.json", "w"), ensure_ascii=False, indent=1)
S = lambda g, k: sum(x[k] for x in g)
for name, g in (("시험", test), ("대조", ctrl)):
    print(f"{name}: 노출 {S(g,'imp')} 클릭 {S(g,'clk')} CTR {S(g,'clk')/S(g,'imp')*100:.2f}% 평균순위(노출가중) {sum(x['pos']*x['imp'] for x in g)/S(g,'imp'):.2f} en {sum(x['lang']=='en' for x in g)} es {sum(x['lang']=='es' for x in g)}")
print("모집단", len(rows), "· 매핑 실패", len(unmapped), unmapped[:5], "· 100위 노출", top[-1]["imp"], "· 1위", top[0]["imp"])
