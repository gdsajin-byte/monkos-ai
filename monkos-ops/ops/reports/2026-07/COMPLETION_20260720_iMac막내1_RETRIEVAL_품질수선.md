---
type: completion
date: 2026-07-20
device: iMac
agent: 막내1
portfolio: PF_RETRIEVAL
status: 완료
---

# COMPLETION — retrieval 검색 품질 수선 (preview 확장 + 최신성 가중)

> **[2026-07-20 14:56 KST]** iMac/막내1 → 작가님
> 지시서: `ORDER_20260720_iMac쌍아_막내_RETRIEVAL_품질수선_O4O2.md`

## 결과

✅ **Task 1 (O4)** — `build_index.js:208` content_preview 500→2000자 확장
✅ **Task 2 (O2)** — `lib.js` rrfFusion에 최신성 가중 추가 (`1 + 0.3 * exp(-daysDiff/90)`, 90일 반감기, 최대 30% 부스트)
✅ **Task 3** — 전량 재임베딩 완료: 3,833건 문서, 3,584건 신규 임베딩, 249건 캐시 재사용
✅ **Task 4** — 스모크 3종 통과 (아래)

## 임베딩 배치 조정

2000자 확장으로 토큰 한도(20,000) 초과 발생. 배치 크기 조정:
- `embeddings.js` BATCH_SIZE: 50 → 5
- `build_index.js` BATCH: 100 → 20

## 스모크 검증 결과

| # | 쿼리 | 기대 | 결과 |
|---|-------|------|------|
| 1 | "도해 생성기 브랜드 이미지" | 7/11 세션 상위 복귀 | ✅ COMPLETION_20260711 민아 도해26종 — 1위 |
| 2 | "시타델 대시보드" | 기존 정상 유지 | ✅ PROPOSAL_20260714 CITADEL대시보드 — 3위 |
| 3 | "33 플로어 제거" | 오늘 작업 반영 | ✅ 민아 검증 REPORT + 막내 COMPLETION + 지시서 — 상위 3건 |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `scripts/retrieval/build_index.js` | content_preview 500→2000, BATCH 100→20 |
| `scripts/retrieval/lib.js` | rrfFusion 최신성 가중 추가 |
| `scripts/retrieval/embeddings.js` | BATCH_SIZE 50→5 (토큰 한도 대응) |

## 준수 조항 확인

- ✅ BM25 인덱싱 핵심 로직 무접촉
- ✅ monk_index.db gitignore 대상 — 커밋 불포함
- ✅ rrfFusion k=60 무변경

## 비고

- PF_RETRIEVAL: iMac에 portfolios 미체크아웃 — 히스토리 어펜드 보류 (쌍아 사후 보정 필요)
