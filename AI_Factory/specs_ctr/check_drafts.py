#!/usr/bin/env python3
"""drafts.json 규칙 점검 — 길이·필수 키워드·민아 감수(11-05 05:10) 금지 표현."""
import json, os, re, sys
d = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "drafts.json"), encoding="utf-8"))
TITLE_EXC = {"cr-passport|es", "gt-passport|es"}
en = [o for o in d if o["lang"] == "en"]; es = [o for o in d if o["lang"] == "es"]
chk = {
    # 60자 예외 2건 — 민아 11-05 05:14 승인(픽셀 기준 잘림 없음, es 단위 띄어쓰기 통일): cr-passport|es 61 · gt-passport|es 62
    "제목 ≤60(예외 2건 ≤62)": all(o["title"] and (o["tlen"] <= 60 or (f"{o['slug']}|{o['lang']}" in TITLE_EXC and o["tlen"] <= 62)) for o in d),
    "설명 ≤155": all(o["desc"] and o["dlen"] <= 155 for o in d),
    "제목 무료(Free/Gratis)": all(("Free" in o["title"]) or ("Gratis" in o["title"]) for o in d),
    "제목 AI": all(("AI-Checked" in o["title"]) or ("Revisada por IA" in o["title"]) for o in d),
    "en 제목 Size": all("Size" in o["title"] for o in en),
    "설명 selfie": all("selfie" in o["desc"].lower() for o in d),
    "'Free from' 0": not any("Free from" in o["title"] + o["desc"] for o in d),
    "'compliance'·'verificación' 0": not any(("compliance" in o["desc"]) or ("verificación" in o["desc"]) for o in d),
    "es inch·in 0": not any(("inch" in o["title"] + o["desc"]) or (" in " in o["title"] + " ") for o in es),
    "es 'Revisión IA'·'Gratis con IA' 0": not any(("Revisión IA" in o["title"]) or ("Gratis con IA" in o["title"]) for o in es),
    "es 설명 medidas": all("medidas" in o["desc"] for o in es),
    "es 제목 콜론(do-passport 예외 — 검색어 'foto pasaporte dominicano')": all((":" in o["title"]) or o["slug"] == "do-passport" for o in es),
    "es 단위 띄어쓰기": not any(re.search(r"\d(cm|mm)\b", o["title"] + o["desc"]) for o in es),
    "en 설명 'Visa photo'·'Passport photo' 대문자 0": not any(re.search(r"(Visa|Passport) photo", o["desc"]) for o in en),
}
for k, v in chk.items():
    print(("✅" if v else "❌"), k)
print(f"2026 유지 {sum('2026' in o['title'] for o in d)}/{len(d)} · 최대 길이 제목 {max(o['tlen'] for o in d)} 설명 {max(o['dlen'] for o in d)}")
sys.exit(0 if all(chk.values()) else 1)
