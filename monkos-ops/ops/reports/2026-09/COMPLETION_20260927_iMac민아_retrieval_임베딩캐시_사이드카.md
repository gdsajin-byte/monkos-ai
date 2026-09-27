---
type: completion
date: 2026-09-27
device: iMac
agent: 민아
status: 마감
portfolio: PF_INFRA
---

# COMPLETION — retrieval 임베딩 캐시 사이드카 (영구 미완 구조 교정)

**[2026-09-27 17:25 KST]** iMac/민아 → 작가님 · 쌍아(사후 추인)

## 경위
- 09-27 12:21 민아·쌍아 마감 푸시에서 동시 적발: [B·임베딩] 300s 타임아웃, 캐시 0건.
- 실측(16:38): 정본 `monk_index.db`에 `chunk_embeddings` 테이블 부재 → 벡터 검색 전면 미가동, BM25만 작동.
- 기전: [B]가 임시 DB에 적재 → kill 시 임시 DB와 함께 진행분 폐기 → 캐시 원천(정본)은 계속 0 → 매 회차 0부터 = 영구 미완.
- 근원: 1edebdac(09-27 03:06, 민아 위임 서브에이전트)이 "임베딩 0이라 이월 무동작"을 인지하고도 기전을 보지 않음. 민아 03:16 재확인 시에도 원인 규명 누락.

## 처방 (a85f5f24)
| 파일 | 변경 |
|---|---|
| `scripts/retrieval/build_index.js` | 사이드카 `embed_cache.db`(키 content_hash+model) — 배치 20건마다 커밋. 동일 내용 청크 1회 임베딩. 구 인덱스 벡터 1회 이관(INSERT OR IGNORE) |
| `scripts/retrieval/embeddings.js` | aiplatform 지연 로딩, MODEL export |
| `scripts/mk-push.sh` | [B] 미완 시 [A'] 재실행 → 적립분 정본 이월 |
| `.gitignore` | embed_cache.db(+wal/shm) |

## 검증 (판정 방법 병기)
- 중단 재개: 45s kill 2회 → 캐시 0→160→340 (sqlite count 직접 조회)
- 전량 채움: 백그라운드 1회 16:42→17:24, 고유 23,844건 신규 · 캐시 24,184건
- 정본 반영: `mk-push.sh --index-only` 36.6s — [A] 이월 24,460/24,461 → [B] 신규 1건만 임베딩 → 정본 `chunk_embeddings` 24,461 (sqlite count), 스모크 PASS 2회
- 벡터 모드 실작동: `search.js --mode vector` 결과 반환(Vertex 쿼리 임베딩 경유). 순위 품질은 별도 평가 미실시
- 비용: Vertex text-multilingual-embedding-002 약 24k 청크 1회분. 이후 회차는 변경분만

## 이후 효과
- 평시 푸시 [B] = 변경 청크만(수십 건) → 300s 안에 완료. 대량 변경 시에도 회차마다 적립·완주.

## [예외]
- scripts/·mk-push 체계 변경 = 민아 경로 범위 판정 불확실 → 초과 간주(ch1 2조 5항). 세션로그 사유 + 본 COMPLETION. 쌍아 사후 추인 대상.
