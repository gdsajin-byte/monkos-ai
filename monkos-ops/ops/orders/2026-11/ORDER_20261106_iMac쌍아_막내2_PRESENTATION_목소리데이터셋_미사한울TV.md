---
type: order
date: 2026-11-06
from: iMac/쌍아
to: iMac/쌍아-막내2
subject: 작가님 목소리 데이터셋 v0 — 미사한울TV(작가님 채널) 직접 더빙 14편에서 음성 추출·배경음 분리·받아쓰기·깨끗한 구간 선별 → 복제 학습용 묶음. 복제 실행은 다음 단계
status: 대기
portfolio: PF_PRESENTATION
---

# ORDER — 목소리 데이터셋 v0 (미사한울TV)

**[2026-11-06 09:04 KST]** iMac/쌍아 → iMac/쌍아-막내2

출처: 작가님 2026-11-06 06:53 "미사한울TV 유튜브에 예전 부동산과 경매 관련 콘텐츠 올렸던 영상들 있어", 09:04 "첫 공개라고 한 이후부터 모두 직접 더빙일걸". 상위: PF_PRESENTATION 목소리 모듈(06:30), 녹음 원고 `monkos-ops/ops/portfolios/PF_PRESENTATION/VOICE_녹음원고_v1.md`(정식 녹음은 별도). 채널: `https://www.youtube.com/channel/UCzNcOMsWHhv-615zqYiUklQ` — **작가님 본인 채널**이다(본인 목소리·본인 콘텐츠).

## 1. 대상 (쌍아 06:53 목록 실측, 최신순)

"신PD의 목소리 최초 공개"(U-GqdO1wEfc) 및 그 이후 게시 영상 15편 중 드론 영상(MJaUjymTn8M)을 뺀 14편:
QsBSmIdtVww(32초) · krBCm-a19p8 · K5rRobvxSls · VFHNqIxLpqw · j-hK4k257u0 · TZkY4Wp0fEk · C4liL69VikQ · PrgbTUR_RcM · 8EU6fmI1oBU · fkWmgdsniCQ · mJ6sXdQIaV8 · Phj2V2OqDjc · GfpsOKhW8pE · U-GqdO1wEfc (합 약 1시간 46분).
게시일 순서는 목록을 다시 받아 확인한다. 이전 편 10편은 화자 미상이라 이번 범위 밖이다.

## 2. 할 일 (iMac CPU — 4060은 14:00까지 바둑 낮 작업 중이라 쓰지 않는다)

1. **음성만 받기**: yt-dlp 오디오 최고 품질(무로그인) → `~/.monkos/voice/misa/raw/`.
2. **배경음 분리**: demucs(htdemucs, CPU)로 보컬 트랙만 남긴다. 라이선스는 MIT이며 확인해 기록한다.
3. **받아쓰기 + 구간화**: faster-whisper(기존 설치) 단어 시각 → 문장 단위 2~15초 조각.
4. **화자·품질 선별**: 작가님 단일 화자인지 확인한다(다른 목소리·현장 인터뷰가 섞이면 제외 — 음높이·임베딩 군집). 잡음(바람·차·음악 잔여) 점수, 클리핑, 너무 작은 음량 조각은 버린다. 결과는 표로 남긴다: 편별 원 분량 → 남은 분량.
5. **산출**: `~/.monkos/voice/misa/dataset_v0/`(wav 24kHz 모노 + `metadata.csv` = 파일|대본) + 견본 5개(가장 깨끗한 조각) + 품질 요약.
6. **판정 기준**: 깨끗한 단일 화자 분량 **10분 이상**이면 복제 첫 판에 쓸 수 있다고 판정한다. 미달이면 미달 사유(잡음 원인 상위)를 적는다.

## 3. 하지 않는 것

- 음성 복제 실행(ElevenLabs 목소리 등록·오픈소스 학습) — 데이터셋 보고 후 쌍아가 다음 지시서로 낸다. 외부 업로드 0.
- 레포에 음성·대본 원문 커밋 금지(도구 스크립트만 `apps/voice-dataset/`).

## 4. 준수

헌법 3조·1조 3항(실존 인물 정체성 — 본인 목소리, 본인 동의 = 작가님 지시). 반환: COMPLETION(편별 분량 표·견본 경로·판정) + 브랜치 SHA. 병합은 쌍아.
