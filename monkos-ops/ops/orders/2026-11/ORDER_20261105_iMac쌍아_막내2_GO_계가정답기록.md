---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/쌍아-막내2
subject: 바둑앱 계가 정답 기록 — 계가 확정마다 국면·마무리 수·사석·집 지도·결과·KataGo 점수 1행 JSONL (형세봇 설계 §2-2, 지시서 1/8)
status: 대기
portfolio: PF_GO
---

# ORDER — 계가 정답 기록 (형세봇 1/8)

**[2026-11-05 21:31 KST]** iMac/쌍아 → iMac/쌍아-막내2

출처: 작가님 2026-11-05 21:31 iMac/쌍아 세션 사람 턴 "권장안으로 진행해 취지를 이해했잖아" — 설계서 DESIGN_20261105_GO_형세봇_계가정답지_MONKOS성장.md §3 지시서 1번(막내2 배정 권장안).

## 할 일
1. `confirm_score()`(계가 확정, `server.py` ~1740) 때 1행 JSONL 기록: 방 id · 시각 · 규칙·덤·치석 · 원국면 수순(해시+수 수) · 마무리 수(수순, 사유 passes) · 사석 좌표 · 집 지도(흑/백/공배 좌표) · 결과(앱 count) · KataGo final_score · 마무리 **전** 국면 KataGo scoreLead(계가 신청 시 이미 계산한 값이 있으면 재사용, 없으면 null — 추가 엔진 호출 금지) · 사석 토글 횟수(사람이 고쳤는지).
2. 위치: 레포 밖 `~/.monkos/go-board/scoring/answers.jsonl`(append-only). 기록 실패는 대국을 막지 않되 로그 `⚠️` 1줄.
3. 봇 대국·사람 대국 모두. 계가 취소된 건은 기록하지 않음(취소 횟수만 이벤트).
4. 읽기 도구 `tools/scoring_answers.py` — 건수·결과 일치율(앱 vs KataGo)·사석 수정 비율 요약.

## 판정
- 8767: 사람 대국 계가 1건 + 봇 대국 계가 1건 → 2행, 필드 채워짐. 취소 1건 → 0행.
- 8765 반영: 판 0 확인 → kickstart 분리 → 2회 히트.

## 준수
헌법 3조(세션 로그·COMPLETION·PF_GO 1행). 반환: COMPLETION + 브랜치 SHA. 병합은 쌍아.
