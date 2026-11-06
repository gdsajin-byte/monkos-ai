"""대본 → 화자별 음성(ElevenLabs with-timestamps) + 마커 발화 시각. 키는 secret.sh 로 읽어 메모리에서만 쓴다(출력·저장 금지).
사용: python3 -I tts.py <script.json> <out_dir> [--dry]"""
import base64
import json
import os
import re
import subprocess
import sys
import ssl
import urllib.request
CTX = ssl.create_default_context(cafile='/etc/ssl/cert.pem')  # python.org 파이썬 인증서 묶음 없음(11-05 실측) — 검증은 유지

SCRIPT, OUT = sys.argv[1], sys.argv[2]
DRY = "--dry" in sys.argv
VOICES = {
    "uni": "jzkODlZ3yY0WQRU8bhD5",   # 계정 저장 보이스 'MONKOS Uni host'(10-25)
    "host": "nPczCjzI2devNBz1zQrb",  # ElevenLabs 공개 기본 보이스(남성 내레이터 'Brian') — 임시 해설, 계정 저장 없음
}
MODEL = "eleven_multilingual_v2"
# v0 마커(move·ref·real) + 판 단독 렌더러(render_scene.py) 마커(fail·ok·pos·hl·lib·arrow·diff·clear) — 11-07 막내1
MARK = re.compile(r"<((?:move|ref|fail|ok):\d+|real|pos|diff|clear|(?:hl|lib):[A-T]\d{1,2}|arrow:[A-T]\d{1,2},[A-T]\d{1,2})>")

sc = json.load(open(SCRIPT, encoding="utf-8"))
lines = []
for i, ln in enumerate(sc["lines"]):
    plain, marks, pos = "", [], 0
    for m in MARK.finditer(ln["text"]):
        plain += ln["text"][pos:m.start()]
        marks.append({"marker": m.group(1), "char": len(plain)})
        pos = m.end()
    plain += ln["text"][pos:]
    lines.append({"i": i, "who": ln["who"], "text": plain, "marks": marks})
total = sum(len(l["text"]) for l in lines)
print(f"대사 {len(lines)}줄 · 합계 {total}자 · 화자 {sorted({l['who'] for l in lines})}")
if DRY:
    sys.exit(0)

secret = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "scripts", "secret.sh")  # 레포 scripts/secret.sh(SM 경유)
got = subprocess.run(["zsh", secret, "get", "ELEVENLABS_API_KEY"], capture_output=True, text=True)
key = [x.strip() for x in got.stdout.splitlines() if x.strip()][-1] if got.returncode == 0 and got.stdout.strip() else None
if not key:
    sys.exit("❌ tts: ELEVENLABS_API_KEY 조회 실패(secret.sh) — 값은 출력하지 않음")
os.makedirs(OUT, exist_ok=True)
for l in lines:
    body = json.dumps({"text": l["text"], "model_id": MODEL,
                       "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.2, "use_speaker_boost": True}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICES[l['who']]}/with-timestamps?output_format=mp3_44100_128",
                                 data=body, method="POST", headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120, context=CTX) as r:
            j = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"❌ tts: {l['i']}줄 HTTP {e.code} {e.read()[:200]!r}")
    mp3 = os.path.join(OUT, f"line{l['i']:02d}_{l['who']}.mp3")
    open(mp3, "wb").write(base64.b64decode(j["audio_base64"]))
    al = j.get("alignment") or {}
    starts, ends = al.get("character_start_times_seconds") or [], al.get("character_end_times_seconds") or []
    l["file"] = mp3
    l["dur"] = ends[-1] if ends else None
    for m in l["marks"]:
        c = min(m["char"], len(starts) - 1)
        m["t"] = round(starts[c], 3) if starts else None  # 마커 바로 뒤 글자의 발화 시작 = 돌 놓을 시각(줄 안 상대)
    print(f"  {l['i']:02d} {l['who']:4s} {l['dur']:.2f}s 마커 {[(m['marker'], m['t']) for m in l['marks']]}")
json.dump({"model": MODEL, "voices": {k: v for k, v in VOICES.items()}, "chars": total, "lines": lines},
          open(os.path.join(OUT, "tracks.json"), "w"), ensure_ascii=False, indent=1)
print("저장", os.path.join(OUT, "tracks.json"))
