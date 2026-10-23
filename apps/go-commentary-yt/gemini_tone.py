# 해설 방송 톤·유머·맥락 태깅 — Gemini(Vertex)가 음성을 직접 듣고, 자막·판 상태를 함께 본다. 사용: gemini_tone.py <폴더> [모델]
# 입력: audio_32k.mp3 · transcript.json(faster-whisper) · board_track.json(yt_board) → 출력 tone.json
# 인증: gcloud 사용자 토큰(값 미출력). 내부 연구용 — 출시 전 해설가 허락·유튜브 약관 확인(원장 191 계열).
import base64, json, subprocess, sys, urllib.request

d = sys.argv[1]
model = sys.argv[2] if len(sys.argv) > 2 else "gemini-3.1-pro-preview"
tr = json.load(open(f"{d}/transcript.json"))
bt = json.load(open(f"{d}/board_track.json"))
info = json.load(open(f"{d}/info.info.json"))


def mmss(t):
    return f"{int(t) // 60:02d}:{int(t) % 60:02d}"


subs = "\n".join(f"[{mmss(s['start'])}-{mmss(s['end'])}] {s['text']}" for s in tr["segments"])
board = "\n".join(f"{mmss(r['t'])} 판 돌 {r['black'] + r['white']}개" + (f" · 참고도 번호 돌 {r['numbered']}개 표시 중" if r["numbered"] >= 3 else "")
                  for r in bt)
prompt = f"""너는 바둑 해설 방송 분석가다. 첨부 음성은 유튜브 바둑 해설 방송 '{info.get('title', '')}'(해설: {info.get('channel', '')})이다.
아래 [자막]은 음성 인식 결과(오인식 있을 수 있음, 음성을 우선)이고 [판 상태]는 10초마다 화면 판의 돌 수와 해설자가 놓은 참고도 번호 돌 수다.

목표: 해설 LLM이 이 해설자의 '맛'을 배우도록, 장면 단위로 말의 내용·톤·유머·맥락을 태깅한다.

반드시 아래 JSON만 출력:
{{
 "overview": {{"style": "해설 스타일 3~5문장", "signature_phrases": ["입버릇·자주 쓰는 표현"], "humor_style": "유머 방식", "pacing": "말 속도·호흡·뜸 들이기 특징"}},
 "scenes": [
  {{"start": "MM:SS", "end": "MM:SS",
    "function": "포석설명|형세판단|수읽기|참고도|승부처|감탄|아쉬움|시청자소통|잡담|결과정리 중 하나",
    "tone": ["흥분","차분","긴장","감탄","농담","탄식","단호" 등 1~3개],
    "energy": 1~5,
    "humor": null 또는 {{"type": "과장|자조|비유|말장난|시청자 놀리기 등", "line": "그 대사 원문"}},
    "quote": "가장 그 해설자다운 대사 원문 1문장(음성 기준으로 교정)",
    "board_ref": "참고도 사용 여부·판의 어느 국면 이야기인지 한 줄(판 상태 근거)",
    "learn": "해설 LLM이 이 장면에서 배울 점 한 줄(표현·구성·리듬)"}}
 ],
 "turning_points": [{{"time": "MM:SS", "what": "해설자가 승부처·역전으로 짚은 장면", "how_said": "어떻게 극적으로 전달했나"}}]
}}
장면은 내용·톤이 바뀌는 지점마다 나눠 25~45개. 대사는 지어내지 말고 들은 그대로.

[판 상태]
{board}

[자막]
{subs}"""

audio = base64.b64encode(open(f"{d}/audio_32k.mp3", "rb").read()).decode()
body = {"contents": [{"role": "user", "parts": [{"inlineData": {"mimeType": "audio/mpeg", "data": audio}}, {"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3, "maxOutputTokens": 32768}}
tok = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, check=True).stdout.strip()
req = urllib.request.Request(f"https://aiplatform.googleapis.com/v1/projects/monkos/locations/global/publishers/google/models/{model}:generateContent",
                             data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
import ssl, certifi  # python.org 빌드는 시스템 인증서를 안 씀
r = json.load(urllib.request.urlopen(req, timeout=900, context=ssl.create_default_context(cafile=certifi.where())))
txt = "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"])
res = json.loads(txt)
res["_meta"] = {"model": r.get("modelVersion", model), "usage": r.get("usageMetadata", {})}
json.dump(res, open(f"{d}/tone.json", "w"), ensure_ascii=False, indent=1)
u = r.get("usageMetadata", {})
print("완료 — 장면", len(res.get("scenes", [])), "· 토큰 입력", u.get("promptTokenCount"), "출력", u.get("candidatesTokenCount"))
