# go-commentary-yt — 유튜브 바둑 해설 학습 시범 도구 (내부 연구)

> 2026-10-23 iMac/쌍아, 작가님 승인("승인" 19:13). 목적: 해설 LLM이 해설자의 말·톤·유머·맥락을 배우도록 **장면-발화 짝 데이터**를 만든다.
> ⚠️ 내부 연구 전용: 유튜브 다운로드는 약관 제한 대상, 해설가 말투 학습은 당사자 허락 필요 — **출시 전 허락·계약 확인**. 데이터(음성·영상·자막·결과)는 레포 밖 `~/.monkos/go-commentary-yt/<영상ID>/`, 커밋 금지.

## 순서
1. `python3 -m yt_dlp -f "bestaudio[ext=m4a]" -o audio.%(ext)s URL` · `-f "bv*[height<=480][ext=mp4]" -o video.%(ext)s` · `--skip-download --write-info-json -o info`
2. `transcribe.py <폴더>` — faster-whisper large-v3-turbo(CPU int8, 실시간 약 1배) → `transcript.json`(단어 시각). PyAV 불일치는 번들 ffmpeg(imageio-ffmpeg) 디코드로 회피
3. 프레임: `ffmpeg -i video.mp4 -vf fps=1/10 frames/f_%04d.jpg` → `yt_board.py <폴더> [x0 y0 step]` → `board_track.json`(흑·백 돌 수 + 해설자가 놓은 참고도 번호 돌 수). 격자는 채널·해상도별 실측(이현욱바둑TV 480p: 220 16 25.44)
4. `ffmpeg -i audio.m4a -ac 1 -ar 16000 -b:a 32k audio_32k.mp3` → `gemini_tone.py <폴더>` — Vertex `gemini-3.1-pro-preview`(global)가 음성을 직접 듣고 자막·판 상태와 함께 장면별 기능·톤·에너지·유머·대표 대사·배울 점 → `tone.json`
5. 병합 → `pairs.jsonl`(장면 시각·판 상태·기능·톤·유머·대사·자막 원문)

## 시범 1편 결과(dFnIMWABxiY, 21:39)
자막 1,097구간(821초) · 장면 38 · 승부처 7 · Gemini 입력 56k·출력 7k 토큰. 다음: 판 판독 → 수순 복원 → KataGo 사실 결합(엔진 사실 ↔ 해설 발화 짝), 화자 분리.

## 이현욱 개인 영상 장면 해설 짝 (11-07 막내2, `lhw_*.py`)
판이 화면 대부분인 개인 영상(생중계 제외) → 대화록 문장 ↔ 판 국면(실전 몇 수째·변화도 몇 수째) ↔ 그 사이 놓인 돌. 데이터 `~/.monkos/go-commentary-yt/lhw/<영상ID>/`(커밋 금지).
1. `lhw_batch.py cands` 후보 표 → `lhw_batch.py fetch ID…` (720p 무음 + 자동 자막 json3 + 1초 프레임)
2. `lhw_batch.py run ID…` = `lhw_read.py` 판 격자 자동 보정·점 판독(빈·흑·백·번호 돌·마지막 수 세모) → `lhw_events.py` 실전 수순·변화도(바둑 규칙 재현으로 번호)·앞뒤 이동 → `lhw_pair.py` 문장(종결 어미·쉼) × 국면 짝 `pairs.jsonl`·`pairs.md`
3. `lhw_check.py 폴더 points|vars|moves N seed` 육안 대조 시트 · `lhw_batch.py merge ID…` → `lhw/pairs_v0.jsonl`
- 화면 두 방식: 세모(마지막 수 노란·남색 세모) / 고리(새 판 화면, 작은 고리 — 가운데가 비면 고리, 획이 지나면 숫자 1). 판 크기가 영상 중간에 바뀌는 영상(Pg7KyHEV_fA)은 고정 격자로 못 읽는다.
