---
type: ATLAS
date: 2026-02-27
from: 막내2
status: active
---

# MONK.KR 문서 자산 지도 (DOCUMENT ATLAS)

> 전체 문서 자산의 위치·성격·소관을 한눈에 파악하는 마스터 맵.
> 법적 근거: ch4 1조 (문서 구조), ch4 4조 (정본 위치)
> 최종 갱신: 2026-02-27

---

## 문서 체계 개요

| 최상위 폴더 | 성격 | 파일 수 | 정본 여부 |
|------------|------|---------|----------|
| docs/infrastructure/ | 기술 인프라 | 74 | 정본 |
| docs/monkos/ | 서비스 도메인 | 191 | 정본 |
| docs/corpus/ | 학습/RAG 데이터 | 173 | 아카이브 |
| docs/rnd_2026/ | R&D 연구 | 56 | 정본 |
| governance/ | 법률/헌법/철학 | 28 | 정본 |
| monkos-ops/ | 운영 체계 | 216 | 운영 |
| commands/_archive/ | 레거시 커맨드 | 29 | 아카이브 |

**총 문서 수**: ~767건

---

## 카테고리별 상세

### docs/infrastructure/ (기술 인프라 — 74건)

7개 카테고리 폴더 + 최상위 인덱스 3건.

| 하위 폴더 | 설명 | 파일 수 | README |
|-----------|------|---------|--------|
| architecture/ | 시스템 아키텍처, 서비스 구조도 | 10 | ✅ |
| deployment/ | 배포, 인프라, 비용 분석, VM 가이드 | 11 | ✅ |
| ai-models/ | AI 모델, 프롬프트, 스키마, 코칭 | 13 | ✅ |
| strategy/ | 사업 전략, 크레딧/NFT, 마케팅 | 13 | ✅ |
| guides/ | 운영 가이드, 코딩 표준, 세션 로그 | 13 | ✅ |
| audit/ | 감사, 법률 분석, 거버넌스 초안 | 7 | ✅ |
| history/ | 프로젝트 히스토리, 실행 계획 | 4 | ✅ |
| _(최상위)_ | ASSET_REGISTRY, FILE_TYPE_REGISTRY, README | 3 | — |

### docs/monkos/ (서비스 도메인 — 191건)

| 하위 폴더 | 설명 | 파일 수 |
|-----------|------|---------|
| designs/ | UI/UX 디자인 문서 | 2 |
| incidents/ | 장애 보고서 | 2 |
| reports/ | 작업 보고서 (월별 하위 폴더) | 37 |
| specs/ | 서비스 사양서 | 5 |
| sprints/ | 스프린트/작업큐 | 3 |
| tasks/ | 작업 지시서 (월별 하위 폴더) | 142 |

### docs/corpus/ (학습/RAG 데이터 — 173건)

| 하위 폴더 | 설명 |
|-----------|------|
| bwya/ | BWYA 아카데미 강의 데이터 |
| claude_sessions/ | Claude 세션 아카이브 (자격증 PDF 포함) |
| factory/ | 팩토리 학습 데이터 |
| gemini/ | Gemini 대화 코퍼스 |
| legacy/ | 레거시 코퍼스 |
| notebookLM/ | NotebookLM 출력 |
| sessions/ | 세션 로그 아카이브 (읽기전용) |

### docs/rnd_2026/ (R&D 연구 — 56건)

디딤돌 R&D, KOITA 연구활동보고서, GPU 분석, 결제 시스템 PoC 등.
주요 산출물: KOITA 보고서 (HTML/MD/PDF), 기술개발목표, 연구개발방법 초안.

### governance/ (법률/헌법/철학 — 28건)

| 하위 폴더 | 설명 |
|-----------|------|
| constitution/ | 헌법, 개정 절차, 개정 청구서 |
| laws/ | 법률 8장 36조 (ch1~ch8) |
| philosophy/ | PHILOSOPHY.md (89건 철학 레지스트리) |
| history/ | 의사결정 기록 |
| _(최상위)_ | PERSONNEL_REGISTRY, MIGRATION_LOG, README |

### monkos-ops/ (운영 체계 — 216건)

| 하위 폴더 | 설명 |
|-----------|------|
| ops/sessions/ | 세션 로그 (정본) |
| ops/orders/ | 지시서 |
| ops/reports/ | 보고서 |
| ops/agenda/ | 전략 어젠다 |
| ops/decisions/ | 의사결정 기록 |
| ops/config/ | 운영 설정 |
| tech/ | 기술 스펙 |
| contents/ | 콘텐츠 관리 |
| marketing/ | 마케팅 채널 (kku/han) |
| scripts/ | 운영 자동화 스크립트 |
| 01~06_*/ | 번호별 운영 카테고리 |

### commands/_archive/ (레거시 — 29건)

2026-02-18~19 기간 레거시 커맨드 파일. `monkos-ops/ops/orders/`로 체계 이관 후 아카이브.

---

## 심사 대응 매핑

| 심사 | 필요 문서 | 위치 |
|------|----------|------|
| 토스 실결제 | 사업자등록증, 결제 플로우, 서비스 소개 | monkos_AI/portal/ (코드), docs/infrastructure/deployment/ |
| 카카오 비즈앱 | 서비스 소개, 개인정보처리방침, 이용약관 | MONK_kr/ (정적 페이지) |
| 디딤돌 R&D | 연구계획서, 기술명세, 활동보고서 | docs/rnd_2026/ |
| IRIS (특허) | 기술명세, 아키텍처, AI 모델 설명 | docs/infrastructure/architecture/, docs/infrastructure/ai-models/ |
| KOITA | 연구활동보고서, 증빙자료 | docs/rnd_2026/KOITA_*.md, docs/rnd_2026/KOITA_*.pdf |

---

## 관련 문서

- [ASSET_REGISTRY.md](infrastructure/ASSET_REGISTRY.md) — 전 저장소 통합 에셋 인덱스
- [FILE_TYPE_REGISTRY.md](infrastructure/FILE_TYPE_REGISTRY.md) — 파일 유형 분류
- [ch4_docs_structure.md](../governance/laws/ch4_docs_structure.md) — 문서 구조 법률
