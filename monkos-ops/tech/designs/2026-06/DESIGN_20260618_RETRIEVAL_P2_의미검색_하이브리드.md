---
type: design
date: 2026-06-18
device: iMac
agent: 쌍아
portfolio: PF_RETRIEVAL
status: 설계
---

# DESIGN: PF_RETRIEVAL P2 — 의미검색 (Vertex AI Embeddings + 하이브리드)

> **[2026-06-18 14:29 KST]** iMac/쌍아 → 작가님
> P1(BM25 키워드 검색) 위에 의미검색을 얹어 하이브리드 검색을 구현한다.

---

## 1. 목표

"증명사진 품질 문제"를 검색하면 "QC 검증 실패", "생성 결과 흐림" 같은 **의미적으로 관련된 문서**까지 잡아주는 검색. 현재 BM25는 키워드 일치만 봄.

---

## 2. 아키텍처

```
monkos-ops/ + governance/ + docs/
         ↓
  build_index.js (기존 P1)
         ↓
  ┌─────────────────────────────────┐
  │  monk_index.db (SQLite)         │
  │  ├─ documents (기존)            │
  │  ├─ documents_fts (기존 BM25)   │
  │  ├─ doc_embeddings (신규)       │  ← 벡터 저장
  │  └─ doc_portfolios (기존)       │
  └─────────────────────────────────┘
         ↑
  Vertex AI Embeddings API
  (text-multilingual-embedding-002)
         ↑
  content_preview (500자) per doc
```

### 검색 흐름

```
쿼리 입력
  ├─ BM25 검색 → 상위 N건 (기존)
  ├─ 벡터 검색 → 상위 N건 (신규)
  └─ RRF 결합 → 최종 순위
```

---

## 3. 기술 결정

### 3.1 임베딩 모델

**Vertex AI `text-multilingual-embedding-002`**

| 항목 | 값 |
|------|-----|
| 차원 | 768 |
| 최대 입력 | 2,048 토큰 |
| 다국어 | 한/영/일 동일 벡터 공간 |
| 비용 | $0.000025/1K chars (2600건 × 500자 = ~$0.03) |
| 인증 | 기존 GCP 프로젝트 SA (monkos) |

선정 이유: 한국어 품질 우수, 다국어 지원(거버넌스 문서 + 영문 기술 문서 동시 검색), 비용 무시 수준, 기존 GCP 인프라 활용.

### 3.2 벡터 저장소

**SQLite-vss** (SQLite 확장)

| 항목 | 값 |
|------|-----|
| 저장 | 기존 monk_index.db에 테이블 추가 |
| 검색 | Approximate Nearest Neighbor (ANN) |
| 의존성 | `sqlite-vss` npm 패키지 |
| 장점 | 별도 서버 불필요, 기존 SQLite와 통합, 로컬 환경 적합 |

대안 검토:
- `better-sqlite3` + 코사인 유사도 직접 계산: 2600건이면 brute-force도 충분히 빠름 (<100ms). sqlite-vss가 설치 문제를 일으키면 이 방식으로 폴백.

### 3.3 하이브리드 결합

**RRF (Reciprocal Rank Fusion)**

```
score(doc) = Σ 1/(k + rank_i(doc))
```

- k = 60 (표준값)
- BM25 상위 20건 + 벡터 상위 20건을 합치고 RRF로 재순위
- 구현 단순, 별도 가중치 튜닝 불필요

---

## 4. 구현 계획

### 4.1 build_index.js 확장

```
기존 빌드 프로세스:
  scan → parse frontmatter → insert documents → FTS 트리거

추가:
  → content_preview를 Vertex AI에 배치 전송 (100건씩)
  → 반환된 768차원 벡터를 doc_embeddings 테이블에 저장
```

**doc_embeddings 스키마:**

```sql
CREATE TABLE doc_embeddings (
  doc_id INTEGER PRIMARY KEY REFERENCES documents(id),
  embedding BLOB NOT NULL  -- Float32Array → Buffer
);
```

### 4.2 search.js 확장

```
기존: --query "검색어" → BM25 결과

추가:
  --query "검색어" → BM25 결과 + 벡터 결과 → RRF 결합
  --mode bm25|vector|hybrid (기본: hybrid)
```

검색 시 쿼리도 Vertex AI로 임베딩 → 저장된 벡터들과 코사인 유사도 계산 → 상위 N건.

### 4.3 증분 임베딩

전체 리빌드 시 모든 문서를 다시 임베딩하면 낭비. 최적화:

1. 문서별 content_preview의 해시를 저장
2. 리빌드 시 해시 비교 → 변경된 문서만 Vertex AI 호출
3. 미변경 문서는 기존 벡터 유지

→ P1.5 자동 갱신에서 push 때마다 돌아도 API 호출 최소화.

---

## 5. 파일 구조

```
scripts/retrieval/
  ├─ build_index.js     ← 확장 (임베딩 생성 추가)
  ├─ search.js          ← 확장 (하이브리드 검색 추가)
  ├─ embeddings.js      ← 신규 (Vertex AI 호출 모듈)
  ├─ monk_index.db      ← 기존 (doc_embeddings 테이블 추가)
  └─ package.json       ← 의존성 추가
```

### 의존성 추가

```json
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "gray-matter": "^4.0.3",
    "@google-cloud/aiplatform": "^3.0.0"
  }
}
```

인증: 기존 ADC (Application Default Credentials) 사용. `GOOGLE_APPLICATION_CREDENTIALS` 또는 `gcloud auth application-default login` 이미 설정된 환경.

---

## 6. 검증 기준

- [ ] `--query "증명사진 품질"` → "QC 검증", "생성 결과 흐림" 관련 문서가 상위에 노출
- [ ] `--query "헌법 개정"` → governance 내 개헌 청구·amendment 문서 노출
- [ ] `--mode bm25` vs `--mode hybrid` 비교 시 hybrid가 의미적 관련 문서를 더 잡음
- [ ] 2600건 전체 임베딩 생성 시간 < 2분
- [ ] 검색 응답 시간 < 500ms
- [ ] P1.5 자동 갱신 시 증분 임베딩 정상 동작

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| sqlite-vss 설치 문제 (네이티브 바인딩) | 중 | brute-force 코사인 유사도로 폴백 (2600건이면 충분히 빠름) |
| Vertex AI 호출 실패 (네트워크/인증) | 낮 | 임베딩 실패 시 BM25 단독으로 폴백, 에러 로그 |
| content_preview 500자가 의미 포착에 부족 | 중 | 1000자로 확장 또는 title+subject+preview 결합 |

---

## 8. 실행 순서

1. **P1.5 완료 확인** (자동 갱신 루틴 정상 동작)
2. **P2 지시서 발행** (본 설계서 기반)
3. 막내 구현 → 검증 → 배포
4. P3 MCP 서버 설계 (별도)

> 본 설계서는 read-only. 코드 변경은 승인 후 막내 지시서 경유.
