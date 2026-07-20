---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_RETRIEVAL
---

# 지시서: retrieval 검색 품질 수선 — preview 확장 + 최신성 가중

> **[2026-07-20 14:41 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 14:41 KST

## 배경

임베딩 복원(491c0146)으로 한국어 검색은 살아났으나, 인덱스가 문서 첫 500자만 보고 있어 중후반 내용(세션 로그 15번째 턴 등)이 검색 불가. "도해 생성기"로 검색 시 7/11 세션 로그 대신 3월 문서가 올라오는 원인.

## Task

### Task 1 — O4: content_preview 500→2000자 확장

**파일**: `scripts/retrieval/build_index.js`
**위치**: 208행 부근 (content_preview 절단)

현재 `content.slice(0, 500)` → `content.slice(0, 2000)`으로 변경.

### Task 2 — O2: RRF 최신성 가중

**파일**: `scripts/retrieval/lib.js`
**위치**: 129행 부근 (rrfFusion 함수)

RRF 점수 계산에 날짜 감쇠 부스트 추가:
- 문서 날짜가 최근일수록 점수에 가산
- 감쇠 공식: `1 + 0.3 * Math.exp(-daysDiff / 90)` (90일 반감기, 최대 30% 부스트)
- 날짜 없는 문서는 부스트 0 (현행 점수 유지)

### Task 3 — 전량 재임베딩

```bash
cd scripts/retrieval && node build_index.js --embed
```

- preview 확장으로 content_hash 전량 변경 → 재임베딩 ~3,823건 발생 (예상 2~3분)
- 완료 후 임베딩 건수 보고

### Task 4 — 스모크 검증

리임베딩 완료 후 MCP `monk_search`로 아래 쿼리 실행:

1. `도해 생성기 브랜드 이미지` — 7/11 세션 로그 상위 복귀 여부 확인
2. `시타델 대시보드` — 기존 정상 유지 확인
3. `33 플로어 제거` — 오늘 작업 반영 확인

## ⚠️ 준수 조항

- BM25 인덱싱 핵심 로직(스캔·파싱·토크나이저) 무접촉
- monk_index.db는 gitignore 대상 — 커밋 불포함
- rrfFusion의 기존 k=60 파라미터 무변경

## 완료 기준

- [ ] content_preview 2000자 확장
- [ ] RRF 최신성 가중 추가
- [ ] 전량 재임베딩 완료, 건수 보고
- [ ] 스모크 3종 결과 보고
- [ ] COMPLETION 보고서 + 세션 로그 + PF_RETRIEVAL 어펜드 + 커밋 + 푸시
