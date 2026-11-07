#!/usr/bin/env python3
"""이현욱 영상 whisper 재받아쓰기 — 자동 자막과 오류율 대조용 (PF_GO, 11-07 막내2, 무료·CPU)
  lhw_whisper.py VIDEO_ID 시작초 끝초  → ~/.monkos/go-commentary-yt/lhw/_asr/{ID}_{시작}.json [{start,end,text}]
음성: answers/{ID}/audio.m4a(정답지 받은 것) 또는 lhw/{ID}/audio.m4a. 설정은 whisper_hint2(11-05 2안: 짧은 이름·용어 프롬프트, hotwords 없음)와 같다.
"""
import json, subprocess, sys, time
from pathlib import Path
import numpy as np, imageio_ffmpeg
from faster_whisper import WhisperModel

R = Path.home() / ".monkos" / "go-commentary-yt"
vid, s0, s1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
a = next(p for p in (R / "answers" / vid / "audio.m4a", R / "lhw" / vid / "audio.m4a") if p.exists())
CORE = ["실리", "세력", "두텁다", "급소", "대세점", "호구", "쌍립", "날일자", "한칸뛰기", "마늘모", "젖히기", "끊기", "단수", "축", "패",
        "사활", "끝내기", "선수", "행마", "형세"]
raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-ss", str(s0), "-to", str(s1), "-i", str(a),
                      "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, np.float32)
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=8)
t = time.time()
segs, _ = m.transcribe(pcm, language="ko", vad_filter=True, beam_size=5,
                       initial_prompt=f"바둑 해설 방송입니다. 이현욱 출연. 용어: {', '.join(CORE)}.")
out = [{"start": round(s0 + s.start, 2), "end": round(s0 + s.end, 2), "text": s.text.strip()} for s in segs]
od = R / "lhw" / "_asr"; od.mkdir(parents=True, exist_ok=True)
(od / f"{vid}_{s0}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(vid, s0, s1, "구간", len(out), f"{time.time() - t:.0f}초", flush=True)
