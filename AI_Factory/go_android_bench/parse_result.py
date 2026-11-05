#!/usr/bin/env python3
"""FTL·수동 실행 결과(result.json / Game Loop logFile) → 속도 표 + 캡처 꺼내기 (PF_GO, ORDER_20261106)
  parse_result.py 결과폴더…      (폴더 안을 뒤져 JSON 중 "bench" 키가 있는 것을 읽는다)
캡처: 로그 안 축소 JPEG(base64)를 같은 폴더 shots/에 풀어 둔다(앱 폴더 PNG 회수가 안 된 경우 대비).
"""
import base64, json, sys
from pathlib import Path

rows = []
for d in sys.argv[1:]:
    for f in Path(d).rglob("*"):
        if not f.is_file() or f.stat().st_size > 20_000_000:
            continue
        try:
            j = json.loads(f.read_text(errors="ignore"))
        except (ValueError, UnicodeDecodeError):
            continue
        if not isinstance(j, dict) or "bench" not in j:
            continue
        dev = j.get("device", {})
        name = f"{dev.get('manufacturer', '')} {dev.get('model', '')} A{dev.get('android', '')}"
        sd = f.parent / "shots"
        for s in j.get("screenshots", []):
            if s.get("jpeg_b64"):
                sd.mkdir(exist_ok=True)
                (sd / f"{s['tag']}.jpg").write_bytes(base64.b64decode(s["jpeg_b64"]))
        for b in j["bench"]:
            rows.append((name, dev.get("abi"), dev.get("cores"), j.get("threads"), j.get("load_seconds"), b["moves"], b["mode"], b["seconds"], b["visits"], b["visits_per_sec"], str(f)))
        if not j.get("ok"):
            print(f"⚠ {name}: ok=false — {j.get('error')}")
seen, uniq = set(), []
for r in rows:  # Game Loop logFile과 앱 폴더 result.json은 같은 내용 — 한 번만
    k = r[:10]
    if k not in seen:
        seen.add(k); uniq.append(r)
rows = uniq
print("| 기기 | ABI | 코어/스레드 | 적재(초) | 국면 | 방식 | 시간(초) | visits | visits/초 |")
print("|---|---|---|---|---|---|---|---|---|")
for r in rows:
    print(f"| {r[0]} | {r[1]} | {r[2]}/{r[3]} | {r[4]:.1f} | {r[5]}수 | {r[6]} | {r[7]:.2f} | {r[8]} | {r[9]:.0f} |")
if not rows:
    print("❌ parse_result: bench 결과 JSON을 찾지 못함")
    sys.exit(1)
