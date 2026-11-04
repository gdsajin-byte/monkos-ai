#!/usr/bin/env python3
"""바둑앱 자체 소리 팩 "monk" 후보 생성 도구 (ORDER_20261105 막내2, PF_GO).

ElevenLabs 키는 scripts/secret.sh get 으로 이 프로세스 메모리에만 읽는다 — 출력·로그·파일 기록 금지(헌법 4조 1항).
음원은 레포 밖 ~/.monkos/go-board-sound-candidates/ 에 둔다. 타사 참조 팩(tygem-ref)은 읽지도 가공하지도 않는다.

  sound_candidates.py sub                        구독 등급·사용 글자 수(크레딧) 조회
  sound_candidates.py voices [--lang ko] [--n 30] 공유 라이브러리 한국어 목소리 목록(JSON 요약)
  sound_candidates.py add PUBLIC_OWNER VOICE_ID NAME   공유 목소리를 내 라이브러리에 추가(TTS 사용 전제)
  sound_candidates.py tts VOICE_ID SLUG          후보 문구 5개 생성 → go-board-sound-candidates/voice_<SLUG>_<문구>.mp3
  sound_candidates.py sfx NAME SECONDS "PROMPT"  효과음 1개 생성 → go-board-sound-candidates/sfx_raw/<NAME>.mp3
실패 가시화: HTTP 오류는 본문 요약과 함께 ❌ + exit 1.
"""
import json, subprocess, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path.home() / ".monkos" / "go-board-sound-candidates"  # 팩 폴더(go-board-sounds) 밖 — 안에 두면 실사용 화면 팩 목록에 노출
API = "https://api.elevenlabs.io"
MODEL = "eleven_multilingual_v2"
# 문구 — 타사 원문을 옮기지 않고 뜻만 맞춘 우리 문안(지시서 §1-1)
PHRASES = [("count1", "하나"), ("count10", "열"), ("remain1", "초읽기 마지막 회입니다"),
           ("start", "대국을 시작합니다"), ("counting", "계가를 시작합니다")]
# 팩 전체 규격(tygem-ref와 같은 파일명) — 11-05 06:15 작가님 "앱에 몇가지 선택버전으로". 앱은 count1~10(10초 남음=하나)·remain1~3(남은 회)만 재생,
# count11은 규격 채움용(앱 미재생)
PHRASES_FULL = PHRASES + [("count2", "둘"), ("count3", "셋"), ("count4", "넷"), ("count5", "다섯"), ("count6", "여섯"),
                          ("count7", "일곱"), ("count8", "여덟"), ("count9", "아홉"), ("count11", "열하나"),
                          ("remain2", "초읽기 두 번 남았습니다"), ("remain3", "초읽기 세 번 남았습니다")]


def key():
    r = subprocess.run([str(ROOT / "scripts" / "secret.sh"), "get", "ELEVENLABS_API_KEY"], capture_output=True, text=True)
    v = r.stdout.strip()
    if r.returncode != 0 or not v or " " in v:
        sys.exit("❌ sound_candidates: ELEVENLABS_API_KEY 조회 실패(secret.sh)")
    return v


def _q(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def call(method, path, body=None, raw=False):
    """curl 경유(python.org 파이썬은 인증서 번들 부재·설치 금지). 키·본문은 stdin 설정(-K -)으로만 — 인자·출력 미노출."""
    cfg = [f"url = {_q(API + path)}", f"request = {_q(method)}", f"header = {_q('xi-api-key: ' + key())}",
           'header = "Content-Type: application/json"', 'write-out = "\\n%{http_code}"', "silent", "show-error", "max-time = 180"]
    if body is not None:
        cfg.append(f"data-binary = {_q(json.dumps(body, ensure_ascii=False))}")
    r = subprocess.run(["curl", "-K", "-"], input="\n".join(cfg).encode(), capture_output=True)
    out = r.stdout
    b, _, code = out.rpartition(b"\n")
    code = code.decode(errors="replace").strip()
    if r.returncode != 0 or not code.startswith("2"):
        sys.exit(f"❌ sound_candidates: {method} {path.split('?')[0]} HTTP {code or r.returncode} — {b[:300].decode(errors='replace')}")
    return b if raw else json.loads(b)


def sub():
    s = call("GET", "/v1/user/subscription")
    print(json.dumps({k: s.get(k) for k in ("tier", "character_count", "character_limit", "next_character_count_reset_unix",
                                             "voice_slots_used", "voice_limit", "professional_voice_slots_used",
                                             "can_use_instant_voice_cloning", "status")}, ensure_ascii=False))


def voices(lang="ko", n=30):
    q = urllib.parse.urlencode({"language": lang, "page_size": n, "sort": "usage_character_count_1y"})
    v = call("GET", f"/v1/shared-voices?{q}")
    keep = ("voice_id", "public_owner_id", "name", "gender", "age", "accent", "descriptive", "use_case", "category",
            "language", "free_users_allowed", "live_moderation_enabled", "notice_period", "usage_character_count_1y",
            "cloned_by_count", "description")
    for x in v.get("voices", []):
        d = {k: x.get(k) for k in keep}
        d["description"] = (d.get("description") or "")[:120]
        print(json.dumps(d, ensure_ascii=False))


def add(owner, vid, name):
    r = call("POST", f"/v1/voices/add/{owner}/{vid}", {"new_name": name})
    print(json.dumps(r, ensure_ascii=False))


def tts(vid, slug, full=""):
    """후보 문구 생성. full='full'이면 팩 전체 문구 — 이미 있는 파일은 건너뛴다(크레딧 중복 방지)."""
    OUT.mkdir(parents=True, exist_ok=True)
    n = 0
    for tag, text in (PHRASES_FULL if full == "full" else PHRASES):
        if (OUT / f"voice_{slug}_{tag}.mp3").exists():
            continue
        b = call("POST", f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                 {"text": text, "model_id": MODEL, "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}}, raw=True)
        (OUT / f"voice_{slug}_{tag}.mp3").write_bytes(b)
        n += len(text)
        print(f"ok voice_{slug}_{tag}.mp3 {len(b)}B '{text}'")
    print(f"chars {n}")


def sfx(name, seconds, prompt):
    d = OUT / "sfx_raw"
    d.mkdir(parents=True, exist_ok=True)
    b = call("POST", "/v1/sound-generation?output_format=mp3_44100_128",
             {"text": prompt, "duration_seconds": float(seconds), "prompt_influence": 0.6}, raw=True)
    (d / f"{name}.mp3").write_bytes(b)
    with open(d / "prompts.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({"name": name, "seconds": float(seconds), "prompt": prompt, "prompt_influence": 0.6}, ensure_ascii=False) + "\n")
    print(f"ok sfx_raw/{name}.mp3 {len(b)}B")


def stt(pattern="voice_*.mp3"):
    """우리 생성 목소리만 되읽기(발음 확인용) — 타사 참조 음원은 보내지 않는다. pattern은 OUT 안 glob(voice_*만 허용)."""
    if not pattern.startswith("voice_"):
        sys.exit("❌ sound_candidates: stt 는 우리 생성물(voice_*)만")
    for p in sorted(OUT.glob(pattern)):
        cfg = [f"url = {_q(API + '/v1/speech-to-text')}", 'request = "POST"', f"header = {_q('xi-api-key: ' + key())}",
               'form = "model_id=scribe_v1"', 'form = "language_code=kor"', f"form = {_q('file=@' + str(p))}",
               'write-out = "\\n%{http_code}"', "silent", "show-error", "max-time = 120"]
        r = subprocess.run(["curl", "-K", "-"], input="\n".join(cfg).encode(), capture_output=True)
        b, _, code = r.stdout.rpartition(b"\n")
        if not code.strip().startswith(b"2"):
            sys.exit(f"❌ sound_candidates: STT HTTP {code.decode().strip()} — {b[:200].decode(errors='replace')}")
        print(f"{p.name}\t{json.loads(b).get('text', '').strip()}")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    {"sub": lambda: sub(), "voices": lambda: voices(*(a[1:3] or [])),
     "add": lambda: add(*a[1:4]), "stt": lambda: stt(*a[1:2]), "tts": lambda: tts(*a[1:4]), "sfx": lambda: sfx(*a[1:4])}[a[0]]()
