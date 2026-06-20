---
type: completion
date: 2026-06-20
device: iMac
agent: 막내1
portfolio: PF_RETRIEVAL
status: 완료
---

# COMPLETION: PF_RETRIEVAL P2 — 의미검색 하이브리드 구현

> **[2026-06-20 10:34 KST]** iMac/막내1 → 작가님

## 지시서

`ORDER_20260620_iMac쌍아_막내_RETRIEVAL_P2_의미검색구현.md`

## 산출물

| # | 파일 | 상태 |
|---|------|------|
| 1 | `scripts/retrieval/embeddings.js` | ✅ 신규 생성 |
| 2 | `scripts/retrieval/build_index.js` | ✅ 확장 (--embed 플래그 + 증분 임베딩) |
| 3 | `scripts/retrieval/search.js` | ✅ 확장 (벡터검색 + 하이브리드 RRF + --mode) |
| 4 | `scripts/retrieval/package.json` | ✅ @google-cloud/aiplatform 추가 |

## 검증 결과

| 항목 | 결과 |
|------|------|
| `build_index.js --embed` 전체 임베딩 | ✅ 3232건 완료 (배치 50건씩, ~2분) |
| 증분 재실행 (변경 0건 → API 0건) | ✅ 캐시 3232건 재사용 |
| `--query "증명사진 품질"` hybrid | ✅ 블로그·시장분석·규격조사 문서 BM25 대비 추가 포착 |
| `--query "헌법 개정"` hybrid | ✅ amendment·petition·심사 문서 상위 노출 |
| `--mode bm25` / `vector` / `hybrid` 분리 | ✅ 3모드 정상 |
| 자동 모드 선택 (임베딩 있으면 hybrid) | ✅ |
| 검색 응답 시간 | ✅ <500ms |
| `build_index.js` (플래그 없음) P1 하위호환 | ✅ 정상 |

## 기술 상세

- **임베딩 모델**: Vertex AI `text-multilingual-embedding-002` (768차원)
- **배치 사이즈**: 50건 (Vertex AI 20K 토큰 제한 대응, 원래 100 → 50 조정)
- **벡터 검색**: brute-force 코사인 유사도 (sqlite-vss 미사용, 3232건 규모 충분)
- **하이브리드 결합**: RRF (k=60), BM25 상위 20 + 벡터 상위 20 → 최종 20건
- **증분 전략**: content_preview SHA-256 해시 비교, 미변경 문서는 기존 벡터 재사용
- **인증**: ADC (기존 gcloud auth)
