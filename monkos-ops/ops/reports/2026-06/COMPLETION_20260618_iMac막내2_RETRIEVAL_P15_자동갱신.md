---
type: completion
date: 2026-06-18
device: iMac
agent: 막내2
portfolio: PF_RETRIEVAL
status: 완료
---

# 완료 보고: PF_RETRIEVAL P1.5 — 인덱스 자동 갱신 루틴

> **[2026-06-18 14:11 KST]** iMac/막내2 → 작가님

## 지시서

`ORDER_20260618_iMac쌍아_막내_RETRIEVAL_P15_자동갱신.md`

## 결과

- ✅ mk-push.sh에 [0/3] 인덱스 리빌드 단계 추가 (빌드 실패해도 push 계속)
- ✅ .gitignore에 monk_index.db-shm, monk_index.db-wal 추가
- ✅ build_index.js 스캔 범위 확장: monkos-ops + governance + docs (존재 확인 후 스캔)
- ✅ 빌드 결과: 2619→3206문서(+587), 446→499 PF링크(+53), 33→35 PF(+2)

## 검증

- ✅ `--query "헤드텀"` → 오늘(06/18) 문서 5건 검색
- ✅ `--pf PF_RETRIEVAL` → 본건 지시서 포함 5건
- ✅ `--query "헌법"` → governance/ 문서 20건 검색
- ✅ monk_index.db git tracked 아님 확인

## 변경 파일

- 📁 `scripts/mk-push.sh` — [0/3] 인덱스 리빌드 단계 삽입
- 📁 `scripts/retrieval/build_index.js` — SCAN_DIRS 복수 디렉토리 스캔
- 📁 `.gitignore` — db-shm, db-wal 추가
- 📁 `monkos-ops/ops/portfolios/PF_RETRIEVAL/README.md` — P1.5 Phase+히스토리 갱신
