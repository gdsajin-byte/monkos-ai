---
type: order
date: 2026-06-20
from: iMac/쌍아
to: 막내
device: iMac
agent: 쌍아
portfolio: PF_RETRIEVAL
status: 발행
---

# 지시서: PF_RETRIEVAL P2 — 의미검색 하이브리드 구현

> **[2026-06-20 10:23 KST]** iMac/쌍아 → 막내
> 설계서: `monkos-ops/tech/designs/2026-06/DESIGN_20260618_RETRIEVAL_P2_의미검색_하이브리드.md`

---

## 목표

기존 BM25 키워드 검색 위에 Vertex AI 임베딩 벡터 검색을 얹어 **하이브리드 검색**을 구현한다. "증명사진 품질"을 검색하면 "QC 검증 실패", "생성 결과 흐림" 같은 키워드가 다른 문서도 잡혀야 한다.

---

## 작업 범위

### 1. `embeddings.js` 신규 생성

`scripts/retrieval/embeddings.js` — Vertex AI 임베딩 호출 모듈.

- `@google-cloud/aiplatform` 사용
- 모델: `text-multilingual-embedding-002`
- 프로젝트: `monkos` / 리전: `us-central1`
- 인증: ADC (기존 `gcloud auth application-default login`)
- 배치 호출: 최대 100건씩 묶어 전송
- 입력: content_preview 문자열 (500자)
- 출력: Float32Array (768차원)

```js
// 핵심 함수 시그니처
async function embedTexts(texts)  // string[] → Float32Array[]
async function embedQuery(query)  // string → Float32Array
```

### 2. `build_index.js` 확장

기존 빌드 프로세스 뒤에 임베딩 생성 단계 추가.

**DB 스키마 추가:**
```sql
CREATE TABLE doc_embeddings (
  doc_id INTEGER PRIMARY KEY REFERENCES documents(id),
  embedding BLOB NOT NULL,
  content_hash TEXT NOT NULL
);
```

**증분 임베딩 로직:**
1. 문서별 content_preview의 SHA-256 해시 계산
2. `--embed` 플래그가 있을 때만 임베딩 실행 (없으면 기존 BM25 빌드만)
3. `--embed` 실행 시:
   - 기존 DB에서 doc_embeddings 테이블이 있으면 해시 비교
   - 해시가 변경된 문서만 Vertex AI 호출
   - 미변경 문서는 기존 벡터 유지
4. 첫 실행(테이블 없음)은 전체 임베딩
5. 진행 상황 출력: `임베딩 진행: 100/3200 (신규/변경 250건)`

**실행 명령:**
```bash
node build_index.js           # 기존 BM25 빌드만 (P1 호환)
node build_index.js --embed   # BM25 + 임베딩 빌드
```

⚠️ 기존 `build_index.js`는 매번 DB를 삭제 후 재생성(`fs.unlinkSync`). 임베딩 증분을 위해 구조 변경 필요:
- `--embed` 없으면 기존 동작 유지 (full rebuild)
- `--embed` 있으면: 임베딩 테이블 데이터를 임시 보존 → 기존 테이블 재생성 → 임베딩 증분 매칭

### 3. `search.js` 확장

**벡터 검색 함수 추가:**
1. 쿼리를 Vertex AI로 임베딩
2. DB의 모든 벡터와 코사인 유사도 계산 (brute-force, ~3200건이면 <100ms)
3. 상위 20건 반환

**하이브리드 결합 — RRF (Reciprocal Rank Fusion):**
```
score(doc) = Σ 1/(60 + rank_i(doc))
```
- BM25 상위 20건 + 벡터 상위 20건 합산
- RRF로 최종 순위 산출

**CLI 인터페이스 추가:**
```bash
node search.js --query "증명사진 품질"                    # 기본: hybrid (임베딩 있으면)
node search.js --query "증명사진 품질" --mode bm25        # BM25만
node search.js --query "증명사진 품질" --mode vector      # 벡터만
node search.js --query "증명사진 품질" --mode hybrid      # 명시적 hybrid
```

- `--mode` 미지정 시: doc_embeddings 테이블이 있으면 hybrid, 없으면 bm25 자동
- 결과 출력에 모드 표시: `🔍 하이브리드 검색: "증명사진 품질" (BM25 + Vector RRF)`

### 4. `package.json` 의존성 추가

```json
"@google-cloud/aiplatform": "^3.0.0"
```

`npm install` 실행.

### 5. mk-push.sh 연동 확인

P1.5에서 mk-push.sh에 `node build_index.js` 호출이 이미 있음. `--embed` 플래그는 수동 빌드 시에만 사용하므로 mk-push.sh는 변경 불필요 (BM25 인덱스만 자동 갱신, 임베딩은 수동).

---

## 검증 기준

- [ ] `node build_index.js --embed` 실행 — 전체 임베딩 생성, 2분 이내 완료
- [ ] 재실행 시 증분 동작 확인 — 변경 0건이면 Vertex AI 호출 0건
- [ ] `--query "증명사진 품질"` hybrid → "QC", "검증", "흐림" 관련 문서가 BM25 단독보다 상위에
- [ ] `--query "헌법 개정"` → governance 내 개헌 청구·amendment 문서 노출
- [ ] `--mode bm25` vs `--mode hybrid` 비교 출력
- [ ] 검색 응답 시간 < 500ms
- [ ] `node build_index.js` (플래그 없음) — 기존 P1 동작 정상 (하위호환)

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키 생성/추측 금지. ADC 인증 사용. 프로젝트 ID `monkos`는 코드에 하드코딩 허용 (시크릿 아님).
- **ch2 코딩 규칙**: 순수 JS, camelCase, 한국어 주석/출력.
- **ch5 배포 규칙**: 본 건은 로컬 도구이므로 배포 대상 아님.
- **sqlite-vss 미사용**: 설계서에서 brute-force 폴백을 권고했고, 3200건 규모에서 brute-force가 충분히 빠르므로 sqlite-vss 설치 없이 **코사인 유사도 직접 계산**으로 구현한다.

---

## 산출물

1. `scripts/retrieval/embeddings.js` (신규)
2. `scripts/retrieval/build_index.js` (확장)
3. `scripts/retrieval/search.js` (확장)
4. `scripts/retrieval/package.json` (의존성 추가)
5. COMPLETION 보고서 → `monkos-ops/ops/reports/2026-06/`
