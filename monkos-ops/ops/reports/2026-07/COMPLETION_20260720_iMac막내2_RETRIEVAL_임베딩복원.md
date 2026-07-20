---
type: completion
date: 2026-07-20
device: iMac
agent: 막내2
portfolio: PF_RETRIEVAL
subject: retrieval 임베딩 복원 — mk-push.sh --embed 전환 + 전량 리임베딩
status: 완료
---

# COMPLETION — retrieval 임베딩 복원

**[2026-07-20 13:08 KST]** iMac/막내2 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260720_iMac쌍아_막내_RETRIEVAL_임베딩복원.md`

## 작업 결과

### ✅ Task 1 — mk-push.sh --embed 전환
- `scripts/mk-push.sh` 11행: `node build_index.js` → `node build_index.js --embed`
- 이후 모든 mk-push.sh 실행 시 임베딩 자동 갱신

### ✅ Task 2 — 임베딩 0건 경고 추가
- `scripts/retrieval/build_index.js`: 빌드 완료 직후 `doc_embeddings` 테이블 행 수 체크
- 0건 시 stderr에 `⚠️ 임베딩 0건 — --embed 플래그 확인 필요` 경고 출력
- 테이블 미존재(--embed 미사용) 시에도 동일 경고

### ✅ Task 3 — 전량 리임베딩 실행
- 실행: `node build_index.js --embed`
- 문서: **3,823건**
- PF 링크: 845건 (41개 PF)
- 임베딩 벡터: **3,823건** (신규 3,823건, 캐시 0건 — 전량 신규)
- 실행 시간: **2분 3초**

### ✅ Task 4 — 자연어 스모크 5종

| # | 쿼리 | 결과 건수 | 상위 1건 |
|---|------|----------|---------|
| 1 | 시타델 대시보드 | 10건 | ORDER_20260715 CITADEL 대시보드 어드민 이식 |
| 2 | 제안서 킷 | 10건 | marketing/proposal-kit/README.md |
| 3 | 크롭 엔진 배치 | 10건 | ORDER_20260718 크롭엔진 배치복원 통합수선 |
| 4 | 블로그 슬러그 정책 | 10건 | PROPOSAL_20260611 블로그CMS 슬러그단일화 |
| 5 | 순찰 러너 설계 | 10건 | ORDER_20260302 퍼널v5 엔진로직 충돌분석 |

전 쿼리 hybrid 검색 정상 작동. 한국어 다어절 검색 복원 확인.

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `scripts/mk-push.sh` | 11행 `--embed` 플래그 추가 |
| `scripts/retrieval/build_index.js` | 빌드 후 임베딩 0건 경고 로직 추가 |

## 준수 조항 이행

- build_index.js 핵심 로직(스캔·파싱·BM25) 무접촉 ✅
- mk-push.sh works/main push 로직 무접촉 ✅
- monk_index.db 커밋 불포함 ✅
