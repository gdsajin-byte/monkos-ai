#!/usr/bin/env python3
"""whisper 힌트 2안 — 짧은 initial_prompt(이름 + 핵심 용어 20개)만, hotwords 없음 (PF_GO, 11-05)
1안(긴 프롬프트 120어 + hotwords 60어)은 5분에 8~9구간·문장 잘림으로 무너졌다 → 같은 음성으로 다시.
  whisper_hint2.py VIDEO_ID 시작초 이름,이름,…   (cmp/<ID>_free_<시작>/audio.m4a → whisper_hint2.json)
"""
import json, subprocess, sys, time
from pathlib import Path
import numpy as np, imageio_ffmpeg
from faster_whisper import WhisperModel

vid, s0 = sys.argv[1], int(sys.argv[2])
names = [n for n in (sys.argv[3].split(",") if len(sys.argv) > 3 else []) if n]
D = Path.home() / ".monkos" / "go-commentary-yt" / "cmp" / f"{vid}_free_{s0}"
CORE = ["실리", "세력", "두텁다", "급소", "대세점", "호구", "쌍립", "날일자", "한칸뛰기", "마늘모", "젖히기", "끊기", "단수", "축", "패",
        "사활", "끝내기", "선수", "행마", "형세"]
raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-i", str(D / "audio.m4a"), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, np.float32)
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=8)
t = time.time()
segs, _ = m.transcribe(pcm, language="ko", vad_filter=True, beam_size=5,
                       initial_prompt=f"바둑 해설 방송입니다. {' '.join(names)} 출연. 용어: {', '.join(CORE)}.")
out = [{"start": round(s0 + s.start, 2), "end": round(s0 + s.end, 2), "text": s.text.strip()} for s in segs]
(D / "whisper_hint2.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
lg = json.loads((D / "free_log.json").read_text()) if (D / "free_log.json").exists() else {}
lg["whisper_hint2"] = {"secs": round(time.time() - t, 1), "n": len(out), "audio_secs": round(len(pcm) / 16000, 1)}
(D / "free_log.json").write_text(json.dumps(lg, ensure_ascii=False, indent=1))
print(json.dumps(lg["whisper_hint2"], ensure_ascii=False))
