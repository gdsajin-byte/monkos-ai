---
type: ORDER
date: 2026-02-27
time: "17:07 KST"
from: iMac/쌍아
to: 막내4
task_id: DOC_CONSOLIDATION_P4
priority: P0
depends_on: DOC_CONSOLIDATION_P1
ref:
  - governance/laws/ch4_docs_structure.md
  - docs/infrastructure/
  - docs/rnd_2026/
---

# 문서 자산 통합 Phase 4 — 통합본 DIGEST + 심사 패키지

> **[2026-02-27 17:07 KST] iMac/쌍아 → 막내4**
> Phase 1(infrastructure/ 분류) 완료 후 착수. Phase 2·3과 병렬 가능.
> 카테고리별 통합 요약본 3건 + R&D 심사용 인덱스 + 심사 대응 매핑.

---

## 선행 조건

- **Phase 1 완료 확인** 후 착수 (막내1이 "Phase 1 완료" 선언)
- 착수 전 `git pull` 필수
- Phase 1이 분류한 하위 폴더 구조를 기반으로 작업

---

## 작업 내용

### Step 1: STRATEGY_DIGEST.md (전략 통합 요약)

`docs/infrastructure/strategy/STRATEGY_DIGEST.md`:

```markdown
---
type: DIGEST
date: 2026-02-27
from: 막내4
category: strategy
source_count: 8
---

# 전략 자산 통합 요약 (STRATEGY DIGEST)

> strategy/ 폴더 8건의 핵심 내용을 하나로 통합.
> 개별 문서의 상세는 원본 참조.

## 1. 코인 이코노미 (COIN_ECONOMY_STRATEGY.md)
{핵심 요약 3~5줄}

## 2. 크레딧 NFT 타당성 (CREDIT_NFT_FEASIBILITY_REPORT.md)
{핵심 요약 3~5줄}

... (8건 전체)

## 전략 상호 관계도

{전략 간 의존성/시너지 2~3문장}

## 심사 활용 가이드

| 심사 | 관련 전략 | 핵심 어필 포인트 |
|------|----------|----------------|
| 토스 실결제 | 코인 이코노미 | ... |
| 디딤돌 R&D | AI Kit, Rocket | ... |
```

**작성 원칙**: 각 원본 파일을 **반드시 전문 읽기** 후 요약. 파일명만 보고 추측 금지.

### Step 2: ARCHITECTURE_DIGEST.md (아키텍처 통합 요약)

`docs/infrastructure/architecture/ARCHITECTURE_DIGEST.md`:

```markdown
---
type: DIGEST
date: 2026-02-27
from: 막내4
category: architecture
source_count: 8
---

# 아키텍처 자산 통합 요약 (ARCHITECTURE DIGEST)

> architecture/ 폴더 8건의 핵심 내용을 하나로 통합.

## 시스템 전체 아키텍처
{3TRACK + FLOWCHART + OVERVIEW 종합}

## 서비스별 아키텍처
{MONK_PHOTO_STUDIO + MONKOS_AI_TECHNICAL_SPEC}

## 설계 원칙
{ARCHITECTURE_GUIDE_FROM_YONGA 핵심}

## 분리/마이그레이션 계획
{SHARED_CORE_SEPARATION_PLAN}
```

### Step 3: AI_MODELS_DIGEST.md (AI/모델 통합 요약)

`docs/infrastructure/ai-models/AI_MODELS_DIGEST.md`:

```markdown
---
type: DIGEST
date: 2026-02-27
from: 막내4
category: ai-models
source_count: 9
---

# AI/모델 자산 통합 요약 (AI MODELS DIGEST)

> ai-models/ 폴더 9건의 핵심 내용을 하나로 통합.

## 모델 연결 현황
{Vertex AI, Yonga 연결 가이드 종합}

## 데이터 스키마
{BWYA, K-Beauty 스키마}

## 코칭 모델
{COACHING_MODEL_UPGRADE_SPEC}

## 크레딧/비용 전략
{VERTEX_CREDIT_STRATEGY}
```

### Step 4: docs/rnd_2026/README.md (R&D 심사용 인덱스)

```markdown
---
type: README
date: 2026-02-27
from: 막내4
purpose: R&D 심사 대응
---

# R&D 2026 연구 자산

> 디딤돌 R&D / IRIS 심사 대응 인덱스.
> 정본: docs/rnd_2026/

## 연구 과제 목록

| # | 과제명 | 파일 | 상태 |
|---|--------|------|------|
| 1 | ... | ... | ... |

## 관련 기술 문서 참조

| 문서 | 위치 | 연관 과제 |
|------|------|----------|
| ARCHITECTURE_DIGEST.md | docs/infrastructure/architecture/ | 전체 |
| AI_MODELS_DIGEST.md | docs/infrastructure/ai-models/ | AI 연구 |
| ... |
```

### Step 5: 심사 대응 매핑 테이블

`docs/infrastructure/EXAM_READINESS_MAP.md`:

```markdown
---
type: MAP
date: 2026-02-27
from: 막내4
purpose: 심사 대응
---

# 심사 대응 문서 매핑

> 3월초 심사 4건에 필요한 문서가 어디에 있는지 즉시 찾을 수 있는 매핑표.

## 토스 실결제 심사

| 필요 항목 | 문서 | 위치 | 상태 |
|----------|------|------|------|
| 사업자등록증 | ... | ... | ✅/❌ |
| 결제 플로우 설명 | ... | ... | ✅/❌ |
| 개인정보처리방침 | ... | ... | ✅/❌ |
| 서비스 소개서 | ... | ... | ✅/❌ |

## 카카오 비즈앱 심사

| 필요 항목 | 문서 | 위치 | 상태 |
|----------|------|------|------|

## 디딤돌 R&D 심사

| 필요 항목 | 문서 | 위치 | 상태 |
|----------|------|------|------|

## IRIS 심사

| 필요 항목 | 문서 | 위치 | 상태 |
|----------|------|------|------|
```

**각 심사별 필요 항목은 관련 문서와 웹 정보를 참고하여 합리적으로 추론**. 확실하지 않은 항목은 `❓` 표시.

### Step 6 (연속): 레거시 정리 확인

- `monkos-ops/` 내 `01~06_*` 패턴 빈 폴더 존재 여부 확인 → 있으면 삭제
- `docs/corpus/` 내 대형 바이너리(>10MB) 목록 작성 → GCS 이관 후보 태깅

---

## ⚠️ 준수 조항

- **헌법 7조**: 파일 내용을 읽고 요약 — 에러 묵과/추측 금지
- **헌법 13조**: YAML frontmatter 필수
- **ch4 3조 12번**: DIGEST 패턴 — `{CATEGORY}_DIGEST.md`
- 원본 문서는 **절대 수정/삭제하지 않음** — DIGEST는 별도 신규 파일

---

## 완료 조건

| # | 조건 | 검증 |
|---|------|------|
| 1 | STRATEGY_DIGEST.md 존재 + 8건 전체 커버 | cat 확인 |
| 2 | ARCHITECTURE_DIGEST.md 존재 + 8건 전체 커버 | cat 확인 |
| 3 | AI_MODELS_DIGEST.md 존재 + 9건 전체 커버 | cat 확인 |
| 4 | docs/rnd_2026/README.md 존재 | ls 확인 |
| 5 | EXAM_READINESS_MAP.md 존재 + 4개 심사 커버 | cat 확인 |
| 6 | 빈 레거시 폴더 목록 보고 | find 확인 |
| 7 | 대형 바이너리 목록 보고 | find 확인 |

---

## 커밋 규칙

- 커밋 메시지: `[docs] 문서자산통합 Phase 4 — DIGEST 3건 + 심사 대응 매핑 + R&D 인덱스`
- 커밋 후 push 승인 요청
