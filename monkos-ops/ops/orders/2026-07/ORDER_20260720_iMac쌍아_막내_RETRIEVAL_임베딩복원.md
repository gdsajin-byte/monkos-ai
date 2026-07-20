---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_RETRIEVAL
---

# 지시서: retrieval 임베딩 복원 — mk-push.sh --embed 전환 + 전량 리임베딩

> **[2026-07-20 13:03 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 13:01 KST

## 배경

`mk-push.sh`가 `--embed` 플래그 없이 `build_index.js`를 호출.
리빌드 시 DB를 통째로 삭제 → 6/20 구축 임베딩 3,232건 첫 푸시에서 전량 소실.
34일간 BM25 단독 강등, 한국어 다어절 검색 전멸 (진단: 민아 REPORT_20260720).

## Task

### Task 1 — mk-push.sh --embed 전환 (P0)

**파일**: `scripts/mk-push.sh`
**위치**: 12행

**현재**:
```bash
if (cd scripts/retrieval && node build_index.js); then
```

**변경**:
```bash
if (cd scripts/retrieval && node build_index.js --embed); then
```

### Task 2 — 임베딩 0건 경고 추가 (P0)

**파일**: `scripts/retrieval/build_index.js`

리빌드 완료 후, `doc_embeddings` 테이블의 행 수를 체크.
0건이면 stderr에 경고 출력:

```
⚠️ 임베딩 0건 — --embed 플래그 확인 필요
```

(구현 위치: 빌드 완료 직후, process.exit 직전)

### Task 3 — 전량 리임베딩 1회 실행 (P1)

```bash
cd scripts/retrieval && node build_index.js --embed
```

- 완료 후 임베딩 건수 보고 (예상: ~3,800건)
- 실행 시간 보고

### Task 4 — 자연어 스모크 5종

리임베딩 완료 후 MCP `monk_search` 도구로 아래 5개 쿼리 실행, 결과 건수 보고:

1. `시타델 대시보드`
2. `제안서 킷`
3. `크롭 엔진 배치`
4. `블로그 슬러그 정책`
5. `순찰 러너 설계`

각 쿼리 결과 0건이면 실패 — 원인 조사 후 보고.

## ⚠️ 준수 조항

- `build_index.js` 핵심 로직(스캔·파싱·BM25 인덱싱) 무접촉 — --embed 경로와 경고만
- `mk-push.sh`의 works/main push 로직 무접촉
- monk_index.db는 gitignore 대상 — 커밋 불포함

## 완료 기준

- [ ] mk-push.sh 12행 --embed 추가
- [ ] build_index.js 임베딩 0건 경고 추가
- [ ] 전량 리임베딩 실행, 건수+시간 보고
- [ ] 스모크 5종 결과 보고
- [ ] COMPLETION 보고서 + 세션 로그 + PF_RETRIEVAL 어펜드 + 커밋 + 푸시
