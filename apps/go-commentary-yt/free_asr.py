#!/usr/bin/env python3
"""무료 대본 2종 — ① 유튜브 자동 자막(json3, 연산 0) ② faster-whisper 로컬(힌트 없음 / 바둑 용어 힌트) — 같은 구간 (PF_GO, 11-05 22:11)
  free_asr.py VIDEO_ID 시작초 끝초 [이름,이름,…]   → ~/.monkos/go-commentary-yt/cmp/<ID>_free_<시작>/
힌트 = lexicon.yaml 개념어 + 방송 상용어 + 영상 제목의 기사·해설자 이름(initial_prompt + hotwords). 무로그인. 내부 연구 전용.
"""
import json, re, subprocess, sys, time
from pathlib import Path
import numpy as np, imageio_ffmpeg

HERE = Path(__file__).resolve().parent
vid, s0, s1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
names = [n for n in (sys.argv[4].split(",") if len(sys.argv) > 4 else []) if n]
D = Path.home() / ".monkos" / "go-commentary-yt" / "cmp" / f"{vid}_free_{s0}"
D.mkdir(parents=True, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
URL = f"https://www.youtube.com/watch?v={vid}"
log = {}


def terms():
    s = (HERE.parent / "go-commentary-pilot" / "lexicon.yaml").read_text(encoding="utf-8")
    lex = sorted(set(re.findall(r'(?:name|ko|term)\s*:\s*"?([가-힣][가-힣 ]{0,8})', s)))
    extra = ["대세점", "쌍립", "삼삼", "걸침", "협공", "정석", "패", "사활", "끝내기", "포석", "행마", "수상전", "형세", "대마", "어깨짚음",
             "들여다보기", "날일자", "입구자", "덤", "초읽기", "계가", "반집", "불계", "흑", "백", "참고도", "실전"]
    return [t.strip() for t in lex] + extra


# ① 자동 자막(영상 전체 json3 → 구간)
t = time.time()
subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--skip-download", "--write-auto-subs", "--sub-langs", "ko", "--sub-format", "json3",
                "-o", str(D / "auto"), URL], capture_output=True)
sub = next(D.glob("auto*.json3"), None)
auto = []
if sub:
    for ev in json.loads(sub.read_text()).get("events", []):
        st = ev.get("tStartMs", 0) / 1000
        txt = "".join(sg.get("utf8", "") for sg in ev.get("segs") or []).strip()
        if s0 <= st < s1 and txt and txt != "\n":
            auto.append({"start": round(st, 2), "text": txt})
(D / "auto.json").write_text(json.dumps(auto, ensure_ascii=False, indent=1))
log["auto"] = {"secs": round(time.time() - t, 1), "n": len(auto), "found": bool(sub)}

# 음성 구간(5분 등) — 이미 받은 20분 음성이 있으면 잘라 쓰고, 없으면 구간만 받기
t = time.time()
a = D / "audio.m4a"
if not a.exists():
    big = Path.home() / ".monkos" / "go-commentary-yt" / "cmp" / f"{vid}_1800" / "audio.m4a"
    if big.exists() and s0 >= 1800 and s1 <= 3000:
        subprocess.run([FF, "-loglevel", "error", "-y", "-ss", str(s0 - 1800), "-t", str(s1 - s0), "-i", str(big), "-c", "copy", str(a)], check=True)
    else:
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--ffmpeg-location", FF, "-f", "bestaudio[ext=m4a]/bestaudio",
                        "--download-sections", f"*{s0}-{s1}", "-o", str(D / "audio.%(ext)s"), URL], check=True)
log["audio_get"] = {"secs": round(time.time() - t, 1)}

raw = subprocess.run([FF, "-loglevel", "error", "-i", str(a), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, np.float32)
from faster_whisper import WhisperModel
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=8)
hint_words = names + terms()
for tag, kw in (("plain", {}), ("hint", {"initial_prompt": "바둑 해설 방송. " + ", ".join(hint_words[:120]), "hotwords": " ".join(hint_words[:60])})):
    t = time.time()
    segs, info = m.transcribe(pcm, language="ko", vad_filter=True, beam_size=5, **kw)
    out = [{"start": round(s0 + s.start, 2), "end": round(s0 + s.end, 2), "text": s.text.strip()} for s in segs]
    (D / f"whisper_{tag}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    log[f"whisper_{tag}"] = {"secs": round(time.time() - t, 1), "n": len(out), "audio_secs": round(len(pcm) / 16000, 1)}
(D / "free_log.json").write_text(json.dumps(log, ensure_ascii=False, indent=1))
print(json.dumps(log, ensure_ascii=False))
