---
type: completion
date: 2026-11-08
device: iMac
agent: 쌍아-막내9
status: 완료
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261108_iMac쌍아_막내9_GO_용어검출_개념어확장_판독표본.md
---

# COMPLETION — 용어 검출 개념어 확장 · 30편 재태깅 · 판독 9편 표본 50

**[2026-11-08 15:02 KST]** iMac/쌍아-막내9 → iMac/쌍아

✅ 완료
- 문장 용어 검출기 `AI_Factory/go_kibo/go_text_terms.py` 신설 — 개념·손익·형세·사활어 51종(GO_TERMS 47 + 보충 4: 완생·미생·수읽기·타개, 감수 대상), 활용형·띄어쓰기·STT 변형(맞보기=맛보기·맛복), 일상어 제외 규칙, 충돌 위험 25종은 앞뒤 발화 판 단서 규칙. 자체 대조군 20/20.
- 표본 50 재채점: 지적 5건(#15 정석·두터움 · #24 사활 · #40 완생 · #8 팻감 · #14 두터움) + #3 철벽 전부 검출, **새 오검출 0/50**(사람 '선수' 8건 미부착).
- 30편 재태깅 `refine/v1_all_t1.jsonl`(레포 밖): 꼬리표 있는 남김 발화 10,150 → 11,152, 새로 붙은 검출 2,511. 무작위 60 판독 오검출 1 → 보정(≈98%).
- 발화 DB: utterance_term 19,404 → 21,915, 출처 표 `utterance_term_det`(added 칸으로 되돌리기 가능) 신설, `corpus/tag_terms_v1.py` 멱등·재실행 실측 2회, 백업 `monk_corpus.db.bak_20261108_pre_t1`, `query_v0.py` 8/8.
- 판독 9편 f1 표본 50: `refine/v1_review50_f1.jsonl` + `.md`(레포 밖, 시드 2026110750, 모집단 849). `refine_sample.py`에 `--src`·`--out`, 판단 줄에 '문장 검출 추가'.
- 보고서(건수만): `AI_Factory/go_kibo/reports/GO_TEXT_TERMS_v1.md` — 용어별 빈도 전·후 표 2종(정제본·DB).

❌ 미완·한계
- #10 '사화'(사활 STT 오기)는 넣지 않음. 엷다·완착 등 문장 출현 0~1이라 검출 0.
- f1 9편 재태깅은 표본용만 — DB 반영은 30편(지시서 범위). 원하면 `tag_terms_v1.py --src refine/f1_all.jsonl` 한 줄.
- `.claude/rules/references.md` 도구 표 등재는 쌍아 소관이라 미수정(대상: 발화 DB 행에 go_text_terms·tag_terms_v1 추가).

💡 제안
- 일꾼(LLM) 꼬리표와 코드 검출을 칸으로 분리해 둔 상태(utterance_term_det). 정밀도 판독을 작가님 감수 표본으로 돌리면 규칙 보정이 수치로 닫힌다.

⏳ 대기
- f1 표본 50 검토(작가님·쌍아). 보충 4종(완생·미생·수읽기·타개) 표기 감수.

📁 산출
- 레포: go_text_terms.py · retag_text_terms.py · corpus/tag_terms_v1.py · refine_sample.py 수정 · README 2 · reports/GO_TEXT_TERMS_v1.md
- 레포 밖: refine/v1_all_t1.jsonl · f1_all.jsonl · v1_review50_f1.{jsonl,md} · v1_det_spot.md · v1_t1_report.md · f1_t1_report.md · monk_corpus.db(+백업)

🔀 브랜치 `worktree-makne9-go-terms` — 병합은 쌍아. 위임 하위 주체 없음. 원문 대화록 커밋 0 · 유료 API 0 · rm -rf 0.
