"""시험군 50페이지 en/es 문안 초안 — 숫자 유지 + '셀카로 무료'·'AI 규격 검증' 배합. 제목 ≤60·설명 ≤155(문자 수).
나라·문서 종류를 맨 앞. 반려 사유는 항목 rejectionReasons[lang]의 첫 항목. 과장·약속·내부 호칭 없음."""
import json, re

import os
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "../../monkos_AI/portal")
T = HERE
data = json.load(open(f"{P}/lib/cms/specs-data.json"))
sel = json.load(open(f"{T}/selection.json"))
OVR = json.load(open(f"{T}/overrides.json")) if __import__("os").path.exists(f"{T}/overrides.json") else {}


def size_fmt(s, lang):
    """en: 3.8×4.8cm · 2×2 in / es: 4.5×4.5 cm · 51×51 mm (스페인어 inch 금지 — 민아 05:10 ④)"""
    s = s.strip()
    m = re.match(r"^([\d.]+)\s*[×x]\s*([\d.]+)\s*inch(?:\s*\(([\d.]+)\s*[×x]\s*([\d.]+)\s*mm\))?", s)
    if m:
        if lang == "en":
            return f"{m.group(1)}×{m.group(2)} in"
        if m.group(3):
            return f"{m.group(3)}×{m.group(4)} mm"
        raise SystemExit(f"❌ draft: es inch 규격에 mm 병기 없음 — {s}")
    m = re.match(r"^([\d.]+)\s*[×x]\s*([\d.]+)\s*(cm|mm)", s)
    if m:
        return f"{m.group(1)}×{m.group(2)}{'' if lang == 'en' else ' '}{m.group(3)}"
    raise SystemExit(f"❌ draft: 규격 해석 불가 — {s}")


def first_fit(cands, limit):
    for c in cands:
        if len(c) <= limit:
            return c
    return None


out = []
for x in sel["test"]:
    e, L = data[x["slug"]], x["lang"]
    S = size_fmt(e["size"], L)
    rr = (e.get("rejectionReasons") or {}).get(L) or (e.get("rejectionReasons") or {}).get("en") or []
    reason = rr[0] if rr else None
    if L == "en":
        # 민아 05:10: 주 검색어 "{country} {type} photo size 2026" — Size 유지, 60 초과 시 2026부터 탈락. 꼬리는 "Free & AI-Checked"로 통일
        C, Ty = e["countryEn"], e["typeEn"]
        # 설명은 문장 중간이라 일반명사만 소문자(Passport·Visa) — 고유명(Schengen·My Number) 유지 (민아 05:14)
        Tyl = re.sub(r"\b(Passport|Visa|Photo|College Entrance Exam)\b", lambda m: m.group(1).lower(), Ty)
        bg = (e.get("backgroundEn") or "").strip()
        tc = [f"{C} {Ty} Photo Size {S} 2026 — Free & AI-Checked", f"{C} {Ty} Photo Size {S} — Free & AI-Checked",
              f"{C} {Ty} Photo Size {S} — Free, AI-Checked"]
        r = f" A common rejection: {reason[0].lower() + reason[1:]}." if reason else ""
        r2 = f" Common rejection: {reason[0].lower() + reason[1:]}." if reason else ""
        dc = [f"{C} {Tyl} photo size: {S}, {bg.lower()} background.{r} Make yours from a selfie for free — AI-checked for size, framing and lighting.",
              f"{C} {Tyl} photo size: {S}, {bg.lower()} background.{r} Make it from a selfie for free, AI-checked for size and framing.",
              f"{C} {Tyl} photo: {S}, {bg.lower()} background.{r} Make it from a selfie for free, AI-checked for size and framing.",
              f"{C} {Tyl} photo: {S}, {bg.lower()} background.{r2} Make it from a selfie for free, AI-checked for size and framing.",
              f"{C} {Tyl} photo: {S}, {bg.lower()} background.{r2} Make it from a selfie for free, AI-checked."]
    else:
        # 민아 05:10 ④: 나라 뒤 콜론, "Revisada por IA", 설명에 "medidas"
        C, Ty = e["countryEs"], e["typeEs"]
        bg = (e.get("backgroundEs") or "").strip()
        tc = [f"{C}: Foto de {Ty} {S} 2026 — Gratis, Revisada por IA", f"{C}: Foto de {Ty} {S} — Gratis, Revisada por IA",
              f"{C}: Foto {Ty} {S} — Gratis, Revisada por IA"]
        r = f" Rechazo frecuente: {reason[0].lower() + reason[1:]}." if reason else ""
        dc = [f"Foto de {Ty.lower()} de {C}: medidas {S}, fondo {bg.lower()}.{r} Hazla gratis desde un selfie; la IA revisa tamaño y encuadre.",
              f"Foto de {Ty.lower()} de {C}: medidas {S}, fondo {bg.lower()}.{r} Hazla gratis desde un selfie, revisada por IA."]
    key = f"{x['slug']}|{L}"
    title = OVR.get(key, {}).get("title") or first_fit(tc, 60)
    desc = OVR.get(key, {}).get("desc") or first_fit(dc, 155)
    out.append({"pair": x["pair"], "slug": x["slug"], "lang": L, "imp": x["imp"],
                "oldTitle": e["seoTitle"][L], "oldDesc": e["seoDescription"].get(L), "title": title, "desc": desc,
                "tlen": len(title or ""), "dlen": len(desc or "")})
json.dump(out, open(f"{T}/drafts.json", "w"), ensure_ascii=False, indent=1)
bad = [o for o in out if not o["title"] or not o["desc"]]
print("초안", len(out), "· 길이 초과(수동 필요)", [(o["slug"], o["lang"], bool(o["title"]), bool(o["desc"])) for o in bad])
for o in out:
    print(f'{o["pair"]:>2} {o["lang"]} {o["slug"]:<14} [{o["tlen"]}] {o["title"]}')
    print(f'                     [{o["dlen"]}] {o["desc"]}')
