#!/usr/bin/env python3
"""C안 — Gemini(Vertex)가 유튜브 영상을 URL로 직접 본다(다운로드 없음). 구간 지정 가능. 화자(해설/캐스터)·대본·장면·판 사건을 JSON으로 (PF_GO, 11-05 21:52)
  gemini_watch.py VIDEO_ID 시작초 끝초 출력폴더 [모델] [해설자 이름] [캐스터 이름]
인증: gcloud 사용자 토큰(값 미출력). 내부 연구 전용 — 출시 전 해설가 허락·유튜브 약관 확인.
"""
import json, ssl, subprocess, sys, time, urllib.request
from pathlib import Path
import certifi

vid, s0, s1, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), Path(sys.argv[4])
model = sys.argv[5] if len(sys.argv) > 5 else "gemini-3.1-pro-preview"
com = sys.argv[6] if len(sys.argv) > 6 else ""
cas = sys.argv[7] if len(sys.argv) > 7 else ""
out.mkdir(parents=True, exist_ok=True)
who = (f"해설위원은 {com}" if com else "해설위원 이름은 화면·설명에 있을 때만") + (f", 진행(캐스터)은 {cas}" if cas else ", 캐스터 이름은 화면·설명에 있을 때만 적고 추정하지 마라")
prompt = f"""너는 바둑 해설 방송 기록가다. 첨부 영상 구간({s0}초~{s1}초)을 보고 들은 그대로 기록한다. {who}.
반드시 아래 JSON만 출력:
{{
 "transcript": [{{"t": "MM:SS(영상 전체 기준)", "speaker": "해설|캐스터|대국자|기타", "text": "들은 그대로(바둑 용어·기사 이름 정확히)"}}],
 "scenes": [{{"t": "MM:SS", "type": "실전수진행|참고도|형세판단|대국자화면|기타", "board": "판에서 일어난 일 한 줄(놓인 수·참고도 번호·지운 것)"}}],
 "caster_moves": [{{"t": "MM:SS", "role": "질문|맞장구|정리|분위기전환|시간안내", "line": "캐스터 대사", "reply": "이어진 해설 응답 요지"}}],
 "names_seen": {{"commentator": "화면 자막에 보인 해설위원 이름 또는 null", "caster": "화면 자막에 보인 캐스터 이름 또는 null"}}
}}
대본은 문장 단위로 빠짐없이. 지어내지 마라."""
body = {"contents": [{"role": "user", "parts": [
    {"fileData": {"fileUri": f"https://www.youtube.com/watch?v={vid}", "mimeType": "video/*"},
     "videoMetadata": {"startOffset": f"{s0}s", "endOffset": f"{s1}s"}},
    {"text": prompt}]}],
    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2, "maxOutputTokens": 65535, "mediaResolution": "MEDIA_RESOLUTION_LOW"}}
tok = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, check=True).stdout.strip()
req = urllib.request.Request(f"https://aiplatform.googleapis.com/v1/projects/monkos/locations/global/publishers/google/models/{model}:generateContent",
                             data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
t0 = time.time()
try:
    r = json.load(urllib.request.urlopen(req, timeout=1800, context=ssl.create_default_context(cafile=certifi.where())))
except urllib.error.HTTPError as e:
    sys.exit(f"❌ gemini_watch: HTTP {e.code} — {e.read().decode()[:400]}")
cand = r["candidates"][0]
txt = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
u = r.get("usageMetadata", {})
(out / "gemini_usage.json").write_text(json.dumps({"finishReason": cand.get("finishReason"), "usage": u, "secs": round(time.time() - t0, 1)}, ensure_ascii=False))
try:
    res = json.loads(txt)
except json.JSONDecodeError:
    (out / "gemini_raw.txt").write_text(txt)
    sys.exit(f"❌ gemini_watch: JSON 아님(finishReason {cand.get('finishReason')}, 출력 토큰 {u.get('candidatesTokenCount')}) — 원문 {out / 'gemini_raw.txt'}")
res["_meta"] = {"model": r.get("modelVersion", model), "usage": u, "secs": round(time.time() - t0, 1), "window": [s0, s1]}
(out / "gemini_watch.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(f"완료 {time.time() - t0:.0f}초 · 대본 {len(res.get('transcript', []))} · 장면 {len(res.get('scenes', []))} · 캐스터 {len(res.get('caster_moves', []))} · 토큰 입력 {u.get('promptTokenCount')} 출력 {u.get('candidatesTokenCount')}")
