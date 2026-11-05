---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/쌍아-막내3
subject: 실수 사전 후처리 — 착수마다 필연성(1·2순위 집 차)·직감(prior)·사분면 라벨(당연한 수/묘수/놓친 묘수/착각) 추가, 엔진 재실행 없음 (형세봇 설계 §2-4, 지시서 3/8)
status: 대기
portfolio: PF_GO
---

# ORDER — 실수 사전 사분면 라벨 (형세봇 3/8)

**[2026-11-05 21:31 KST]** iMac/쌍아 → iMac/쌍아-막내3

출처: 작가님 2026-11-05 21:31 사람 턴 "권장안으로 진행해 취지를 이해했잖아" — DESIGN_20261105_GO_형세봇_계가정답지_MONKOS성장.md §3 지시서 3번(막내3 권장안). 정의 원천: 작가님 20:27 "당연한 수 = 1·2순위 승률 차이가 가장 극명한 수".

## 선행
- **오늘 밤 GO-mistakes-run은 손대지 않는다.** 이 작업은 결과(responses·moves jsonl)에 덧붙이는 후처리.
- 쌍아 실측 v0(smoke10, scratchpad `gap_probe.py` 방식): 1·2순위 집 차 0-1 / 1-3 / 3-6 / 6-12 / 12+ 구간 작가님 1순위 일치 38/47/55/80/95%, prior 0.39→0.87.

## 할 일
1. `analyze_mistakes.py`에 필드 추가: `gap_lead`(1·2순위 scoreLead 차, 둘째 수 visits 함께), `gap_wr`, `prior_best`, `prior_mine`, `quad`(obvious|brilliant|missed_brilliant|blunder_obvious|normal|ai_sense).
2. 임계값은 상수 1곳(초안 6집·0.7·0.3) — 2단계(400 visits) 재평가 수치가 있으면 그걸로 판정.
3. 보고서 MISTAKES에 사분면 표·구간 곡선(gap별 일치율·prior)·사분면별 대표 10수(대국 G번호·수순만, 기보 원문·아이디 금지).
4. smoke10으로 먼저 → 2,000국 결과 나오면 재실행, 임계 민감도(5/6/8집, 0.6/0.7/0.8) 표.

## 판정
smoke10 재현: 쌍아 v0 수치와 일치(외길 45수: 찾음 39·놓침 6). 2,000국 결과로 표 갱신.

## 준수
헌법 3조. 4060 GPU 시간 규칙 무관(후처리 CPU). 반환: COMPLETION + 브랜치 SHA. 병합은 쌍아.
