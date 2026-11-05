#!/usr/bin/env python3
"""다음 단계 준비 — 같은 30편을 로컬 무료 경로(자동 자막·whisper)로 돌려 Flash 정답본과 대조할 입력 목록 (PF_GO, 11-06)
  answers_local_manifest.py  → answers/manifest_local.jsonl (조각마다: 음성 조각 경로·자동 자막 경로·정답본 경로·구간)
"""
import json
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
sel = json.loads((B / "selection.json").read_text())
n = 0
with (B / "manifest_local.jsonl").open("w") as f:
    for r in sel:
        s60, e60 = r["win60"]
        sub = next((B / "subs").glob(f"{r['id']}*.json3"), None)
        for s in range(s60, e60, 600):
            e = min(e60, s + 600)
            ans = B / r["id"] / f"flash_{s}" / "gemini_full.json"
            f.write(json.dumps({"id": r["id"], "commentator": r["commentator"], "caster": r["caster"], "win": [s, e],
                                "audio": str(B / r["id"] / f"chunk_{s}_{e}_32k.mp3"), "auto_subs": str(sub) if sub else None,
                                "answer": str(ans) if ans.exists() else None}, ensure_ascii=False) + "\n")
            n += 1
print(f"{n}조각 → {B / 'manifest_local.jsonl'}")
