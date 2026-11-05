#!/usr/bin/env python3
"""선별(유료) 풀 감상 — Gemini(Vertex)가 유튜브 URL을 직접 보고(영상+음성) 장면 1행 규격으로 추출 (PF_GO, 11-05 22:18 지시서 §11)
  gemini_full.py VIDEO_ID 시작초 끝초 출력폴더 [모델] [해설자] [캐스터]
장면 1행: t_start·t_end·speaker·trigger·expression·humor{code,line}·board_draw·terms·term_context·move_no·phase·line(22:23 추가 3필드)(교정 대사 = 무료 대본 교정 정답본, §12)
예산 게이트(쌍아 22:12): 비교 표본 3편·구간 한정까지만. 사용량은 gemini_usage.json. 내부 연구 전용.
"""
import json, ssl, subprocess, sys, time, urllib.request
from pathlib import Path
import certifi

vid, s0, s1, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), Path(sys.argv[4])
model = sys.argv[5] if len(sys.argv) > 5 else "gemini-3.1-pro-preview"
com = sys.argv[6] if len(sys.argv) > 6 else ""
cas = sys.argv[7] if len(sys.argv) > 7 else ""
out.mkdir(parents=True, exist_ok=True)
who = (f"해설위원 {com}" if com else "해설위원(이름은 화면·설명에 보일 때만)") + (f", 진행(캐스터) {cas}" if cas else ", 캐스터(이름은 화면에 보일 때만, 추정 금지)")
prompt = f"""너는 바둑 해설 방송 기록가다. 첨부 영상 구간({s0}초~{s1}초)을 보고 들은 그대로 기록한다. 출연: {who}.
장면 나누기(쌍아 22:56 — 더 잘게): 화자가 바뀌거나, 판에 무언가를 그리거나, 15초가 지나면 새 장면. 장면 1행의 line은 2문장·150자 이내(넘으면 다음 장면으로). 반드시 아래 JSON만 출력:
{{
 "scenes": [{{
   "t_start": "MM:SS(영상 전체 기준)", "t_end": "MM:SS",
   "speaker": "해설|캐스터|기타",
   "trigger": "이 발화를 부른 것 하나: 실전착수|형세급변|캐스터질문|초읽기|침묵|해설자자발|시청자반응|기타",
   "expression": "표정·몸짓(웹캠·화면에 보일 때만, 안 보이면 null)",
   "humor": null 또는 {{"code": "과장|자조|의인화|비유|반전|대국자놀림|말장난|기타", "line": "그 대사 원문"}},
   "board_draw": "해설판에 그리는 방식(번호 돌 순서·몇 수 앞까지·지우는 시점·화살표/표시·실전 복귀) 또는 null",
   "terms": ["이 장면의 바둑 용어"],
   "term_context": [{{"term": "용어", "target": "착점|돌뭉치|영역|기타", "where": "판 좌표(예: Q16)나 위치 설명, 모르면 null"}}],
   "move_no": "실전 수순 번호(판·화면 정보로 확인될 때만, 모르면 null)",
   "phase": "포석|중반|끝내기 — 해설자 발언·수순으로 판단",
   "line": "교정된 대사 — 들은 그대로, 바둑 용어·기사 이름을 바르게(요약 금지)"
 }}],
 "names_seen": {{"commentator": "화면 자막에 보인 해설 이름 또는 null", "caster": "화면 자막에 보인 캐스터 이름 또는 null"}}
}}
대사는 빠짐없이, 지어내지 마라. board_draw·expression·where는 각 80자 이내 요약(같은 표시를 나열하지 말고 '우하귀 흑백 돌 6개에 세모'처럼 묶어서)."""
import base64, os
AUDIO = os.environ.get("GEMINI_AUDIO")  # 음성만 비교용 — 구간 음성 파일 경로(mp3). 있으면 영상 URL 대신 이 음성을 넣는다(판·표정 필드는 null 예상)
media = ({"inlineData": {"mimeType": "audio/mpeg", "data": base64.b64encode(open(AUDIO, "rb").read()).decode()}} if AUDIO else
         {"fileData": {"fileUri": f"https://www.youtube.com/watch?v={vid}", "mimeType": "video/*"},
          "videoMetadata": {"startOffset": f"{s0}s", "endOffset": f"{s1}s"}})
if AUDIO:
    prompt = prompt.replace("첨부 영상 구간", "첨부 음성(영상의 해당 구간)") + " 음성만 들으므로 expression·board_draw는 말로 확인되는 것만, 아니면 null."
body = {"contents": [{"role": "user", "parts": [media, {"text": prompt}]}],
    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2, "maxOutputTokens": int(__import__("os").environ.get("GEMINI_MAX_OUT") or 16000),
                         **({"frequencyPenalty": 0.3} if "pro" in model else {}),  # Flash는 벌점 미지원(400)
                         "mediaResolution": "MEDIA_RESOLUTION_LOW"}}  # 11-05 목진석 표본 반복 폭주(65k 출력) 뒤 상한·반복 벌점
tok = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, check=True).stdout.strip()
req = urllib.request.Request(f"https://aiplatform.googleapis.com/v1/projects/monkos/locations/global/publishers/google/models/{model}:generateContent",
                             data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
t0 = time.time()
try:
    r = json.load(urllib.request.urlopen(req, timeout=1800, context=ssl.create_default_context(cafile=certifi.where())))
except urllib.error.HTTPError as e:
    sys.exit(f"❌ gemini_full: HTTP {e.code} — {e.read().decode()[:400]}")
cand = r["candidates"][0]
txt = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
u = r.get("usageMetadata", {})
(out / "gemini_full_usage.json").write_text(json.dumps({"finishReason": cand.get("finishReason"), "usage": u, "secs": round(time.time() - t0, 1)}, ensure_ascii=False))
try:
    res = json.loads(txt)
except json.JSONDecodeError:
    (out / "gemini_full_raw.txt").write_text(txt)
    sys.exit(f"❌ gemini_full: JSON 아님(finishReason {cand.get('finishReason')}, 출력 토큰 {u.get('candidatesTokenCount')}) — 원문 {out / 'gemini_full_raw.txt'}")
res["_meta"] = {"model": r.get("modelVersion", model), "usage": u, "secs": round(time.time() - t0, 1), "window": [s0, s1], "input": "audio" if AUDIO else "video"}
(out / "gemini_full.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(f"완료 {time.time() - t0:.0f}초 · 장면 {len(res.get('scenes', []))} · 토큰 입력 {u.get('promptTokenCount')} 출력 {u.get('candidatesTokenCount')} 생각 {u.get('thoughtsTokenCount')}")
