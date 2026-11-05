#!/usr/bin/env python3
"""유료 사용량 → 금액 (PF_GO, 11-05) — gemini_watch.json/_meta·gemini_usage.json·gemini_full_usage.json 모두 읽어 공식 단가로 환산.
단가(2026-11-05 aistudio.google.com/docs/pricing, 프롬프트 ≤200k, 1M 토큰당): 3.1 Pro 입력 $2·출력(생각 포함) $12 / 3.8 Flash $0.75·$3.75 / 3.5 Flash-Lite $0.30·$2.50
"""
import json
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt"
PRO = (2.0, 12.0)
rows = []
for p in sorted(B.rglob("*.json")):
    if p.name not in ("gemini_watch.json", "gemini_usage.json", "gemini_full_usage.json", "gemini_full.json"):
        continue
    j = json.loads(p.read_text())
    u = (j.get("_meta") or {}).get("usage") if "_meta" in j else j.get("usage")
    if not u:
        continue
    if p.name == "gemini_full.json" and (p.parent / "gemini_full_usage.json").exists():
        continue  # 같은 호출을 두 번 세지 않는다
    if p.name == "gemini_watch.json" and (p.parent / "gemini_usage.json").exists():
        continue
    i, o, t = u.get("promptTokenCount", 0), u.get("candidatesTokenCount", 0), u.get("thoughtsTokenCount", 0) or 0
    usd = i / 1e6 * PRO[0] + (o + t) / 1e6 * PRO[1]
    rows.append((str(p.relative_to(B)), i, o, t, j.get("finishReason") or "STOP", usd))
tot = 0
print("| 호출(결과 파일) | 입력 | 출력 | 생각 | 종료 | 금액(USD) |")
print("|---|---|---|---|---|---|")
for r in rows:
    tot += r[5]
    print(f"| {r[0]} | {r[1]:,} | {r[2]:,} | {r[3]:,} | {r[4]} | ${r[5]:.3f} |")
print(f"| 합(기록 있는 호출) | | | | | **${tot:.2f}** |")
print("기록 없는 호출(파일 덮어씀·중단): 목진석 풀 감상 반복 폭주 1건(입력 ~55k·출력 65,521 MAX_TOKENS ≈ $0.90, 실측 토큰) · 목진석 20분 C안 출력 잘림 1건(미확인, ≤ $0.9) · 22:23 중단한 풀 감상 1건(미확인, ≤ $0.4)")
