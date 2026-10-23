# 유튜브 해설 음성 → 단어 단위 시각 자막(JSON). 사용: transcribe.py <폴더>  (audio.m4a → transcript.json)
import json, sys, time
from faster_whisper import WhisperModel
d = sys.argv[1]
t0 = time.time()
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=8)
import subprocess, numpy as np, imageio_ffmpeg  # PyAV 버전 불일치(metadata_errors) 회피 — 번들 ffmpeg로 16kHz 모노 디코드
raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-i", f"{d}/audio.m4a", "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
segs, info = m.transcribe(np.frombuffer(raw, np.float32), language="ko", word_timestamps=True, vad_filter=True, beam_size=5)
out = []
for s in segs:
    out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                "words": [[round(w.start, 2), round(w.end, 2), w.word] for w in (s.words or [])]})
    if len(out) % 20 == 0:
        print(f"{s.end/60:.1f}분까지 · {time.time()-t0:.0f}s 경과", flush=True)
json.dump({"duration": info.duration, "segments": out, "secs": round(time.time() - t0)}, open(f"{d}/transcript.json", "w"), ensure_ascii=False, indent=1)
print("완료", len(out), "구간", round(time.time() - t0), "초", flush=True)
