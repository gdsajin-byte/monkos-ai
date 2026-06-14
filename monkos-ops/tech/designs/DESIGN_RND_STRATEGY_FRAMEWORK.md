---
type: design
id: DESIGN_RND_STRATEGY_FRAMEWORK
date: 2026-02-28 13:31 KST
from: iMac/쌍아
status: draft
portfolio: PF_RND
tags: [r&d, strategy, governance, ch9, framework]
---

# 설계서: R&D + 정부자금전략 통합 프레임워크

> **[2026-02-28 13:31 KST] iMac/쌍아**
> **목적**: 흩어진 기술 연구·전략 문서를 3층 라이프사이클로 통합
> **법률 편입**: ch9 "연구개발" 신설 예정

---

## 1. 현황 진단

### 1-1. 현재 문서 분포

| 위치 | 파일 수 | 실제 성격 | 문제 |
|------|--------|----------|------|
| `docs/rnd_2026/` | 25 | 정부자금전략 (디딤돌, KOITA) | 이름 혼동 — "R&D"이지만 기술연구가 아닌 자금전략 |
| `docs/infrastructure/strategy/` | 13 | 사업전략 (코인경제, NFT, 마케팅) | R&D 에셋과 연결 부재 |
| `docs/infrastructure/ai-models/` | 13 | 기술 연구 (I2I, 코칭, QC) | 1층(R&D)인데 infrastructure에 묻힘 |
| `docs/infrastructure/architecture/` | 10 | 시스템 설계 | 완성된 것과 진행 중인 것 미분류 |
| `monkos-ops/tech/DESIGN_*.md` | 3 | 기술 설계서 | 연구 라이프사이클과 분리 |
| `docs/infrastructure/deployment/` | 11 | 배포/인프라 가이드 | 연구 산출물이 아닌 운영 가이드 |

### 1-2. 부재 요소

- 프로젝트 단위 연구 라이프사이클 없음
- 디버깅 과정·실험 로그가 세션 로그에 묻혀 소실
- 기술명세서 어펜딩 규칙 없음
- 완성된 기술의 논문형 보고서 체계 없음
- R&D 에셋 ↔ 정부자금 트랙 매핑 없음
- 트랙별 상태(서치/도전/인증) 관리 없음

---

## 2. 3층 아키텍처

```
┌─────────────────────────────────────────────────────┐
│  3층: Strategy (정부자금/인증 전략)                     │
│  docs/strategy/                                      │
│  "기술을 돈과 인증으로 바꾼다"                           │
│  ├─ tracks/ (디딤돌, 창사, KOITA, 벤처인증...)          │
│  ├─ patents/ (특허 전략)                              │
│  └─ ASSET_MAP.md (에셋↔트랙 매핑)                     │
├─────────────────────────────────────────────────────┤
│  2층: Papers (완성된 기술 증빙)                         │
│  docs/research/papers/                               │
│  "기술을 증명한다"                                     │
│  ├─ PAPER_*.md (논문형 보고서)                         │
│  └─ INDEX.md (에셋 레지스트리)                         │
├─────────────────────────────────────────────────────┤
│  1층: R&D (기술 연구)                                  │
│  docs/research/projects/                             │
│  "기술을 만든다"                                       │
│  ├─ RD_*/  (프로젝트별 연구 폴더)                       │
│  └─ 각 폴더 내: 목표→분석→계획→시행→로그→성과→논문        │
└─────────────────────────────────────────────────────┘
```

### 2-1. 층간 흐름

```
1층 R&D Project ──완성──→ 2층 Paper ──무기로 활용──→ 3층 Strategy Track
     (active)              (논문)                      (자금/인증)
         │                    │                            │
    연구노트 어펜딩        리뷰+등록                  트랙별 전략+서류
    기술명세서 성장        INDEX.md                   ASSET_MAP.md
    디버깅 로그 누적       에셋 레지스트리              상태 관리
```

---

## 3. 폴더 구조

### 3-1. 1층: R&D (`docs/research/`)

```
docs/research/
  ├─ projects/                          ← 프로젝트별 연구
  │   ├─ RD_쿠키단일화/
  │   │   ├─ OBJECTIVE.md               ← ① 연구 목표
  │   │   ├─ ANALYSIS.md                ← ② 방향·정합·시장성 분석
  │   │   ├─ PLAN.md                    ← ③ 연구 계획
  │   │   ├─ SPEC.md                    ← ④ 기술명세서 (어펜딩)
  │   │   ├─ LOG.md                     ← ⑤ 연구노트 (디버깅 포함)
  │   │   ├─ RESULT.md                  ← ⑥ 성과 분석
  │   │   └─ README.md                  ← 상태 요약
  │   ├─ RD_I2I파이프라인/
  │   ├─ RD_AI코칭/
  │   ├─ RD_크레딧결제/
  │   └─ ...
  │
  ├─ papers/                            ← 완성 논문
  │   ├─ PAPER_쿠키단일화.md
  │   ├─ PAPER_I2I파이프라인.md
  │   └─ INDEX.md                       ← 에셋 레지스트리
  │
  └─ README.md
```

### 3-2. 3층: Strategy (`docs/strategy/`)

```
docs/strategy/
  ├─ tracks/                            ← 트랙별 전략
  │   ├─ 디딤돌/
  │   │   ├─ STRATEGY.md                ← 트랙 전용 전략
  │   │   ├─ TIMELINE.md                ← 일정·마일스톤
  │   │   ├─ DOCS/                      ← 신청서·서류·증빙
  │   │   ├─ LOG.md                     ← 진행 로그 (어펜딩)
  │   │   └─ README.md                  ← 상태 요약
  │   ├─ 창업사관학교/
  │   ├─ KOITA/
  │   ├─ 벤처인증/
  │   ├─ 이노비즈/
  │   └─ 토스결제심사/                   ← 민간 인증도 트랙
  │
  ├─ patents/                           ← 특허 전략
  │   ├─ PAT_I2I_정체성보존/
  │   └─ INDEX.md
  │
  ├─ ASSET_MAP.md                       ← 핵심: 에셋↔트랙 매핑
  └─ INDEX.md                           ← 트랙 현황 레지스트리
```

### 3-3. 기존 infrastructure/ 유지 범위

```
docs/infrastructure/                    ← 운영 인프라 가이드 (변경 없음)
  ├─ deployment/                        ← 배포 가이드 (유지)
  ├─ guides/                            ← 코딩·운영 가이드 (유지)
  ├─ audit/                             ← 감사·거버넌스 (유지)
  ├─ history/                           ← 프로젝트 역사 (유지)
  ├─ ai-models/      → 참조만. 연구 프로젝트는 research/로 이관
  ├─ architecture/   → 참조만. 연구 프로젝트는 research/로 이관
  └─ strategy/       → docs/strategy/로 이관 대상
```

---

## 4. R&D 프로젝트 라이프사이클

### 4-1. 7단계 프로세스

```
① 목표설정 → ② 분석 → ③ 계획 → ④ 시행+명세 → ⑤ 로그 → ⑥ 성과 → ⑦ 논문
  (WHY)     (타당성)   (HOW)   (DO+SPEC)    (RECORD)  (EVAL)   (PAPER)
```

| 단계 | 파일 | 작성 시점 | 성격 |
|------|------|----------|------|
| ① 목표설정 | `OBJECTIVE.md` | 프로젝트 개시 | 1회 작성 |
| ② 분석 | `ANALYSIS.md` | 개시 직후 | 1회 작성 (필요 시 갱신) |
| ③ 계획 | `PLAN.md` | 착수 전 | 1회 작성 (변경 시 이력 기록) |
| ④ 시행+명세 | `SPEC.md` | 착수~완료 | **어펜딩** — 구현하면서 성장 |
| ⑤ 로그 | `LOG.md` | 착수~완료 | **어펜딩** — 날짜별 누적 |
| ⑥ 성과 | `RESULT.md` | 완료 시 | 1회 작성 |
| ⑦ 논문 | `papers/PAPER_*.md` | 리뷰 후 | 1회 작성, 정식 등록 |

### 4-2. 어펜딩 규칙 (④ SPEC.md, ⑤ LOG.md)

**SPEC.md (기술명세서)**:
```markdown
## [2026-02-28] 초기 설계
- 아키텍처: ...
- 기술 선택: ...

## [2026-02-28] 구현 1차
- 변경사항: ...
- 근거: ...

## [2026-03-01] 디버깅 — store.user null 이슈
- 증상: ...
- 원인: ...
- 수정: ...
- 교훈: ...
```

**LOG.md (연구노트)**:
```markdown
## [2026-02-28 06:27] 세션 시작
- 목표: 쿠키 단일화 Phase A~C 구현
- 참조: DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md

## [2026-02-28 08:15] 배포 완료
- portal-00094, idphoto-kr-00111
- Phase D 테스트 잔여

## [2026-02-28 12:00] 버그 발견 — iOS 먹통
- 증상: 비로그인 시 버튼 미반응
- 디버깅 과정: store.user=null → TypeError → 모듈 로딩 실패
- 수정: store.user 기본 객체 보장
- 커밋: fbe5356

## [2026-02-28 13:10] iOS 교차 테스트 결과
- Galaxy: ✅, iPhone(작가님): ❌, iPhone(꾸): ⚠️
- 추가 진단: 캐시 + OAuth 팝업 차단
```

### 4-3. 프로젝트 상태 관리

README.md YAML frontmatter:
```yaml
---
type: rd-project
id: RD_쿠키단일화
title: 인증 체계 HttpOnly 쿠키 단일화
status: active          # active | paused | completed | archived
started: 2026-02-28
lead: 쌍아
assets_used_by:         # 3층에서 이 에셋을 쓰는 트랙
  - 디딤돌
  - 벤처인증
---
```

### 4-4. 논문 작성 → 리뷰 → 등록

```
① 프로젝트 완료 (RESULT.md 작성)
② 쌍아가 SPEC.md + LOG.md + RESULT.md를 종합하여 PAPER 초안 작성
③ 작가님 리뷰
④ papers/INDEX.md에 정식 등록
⑤ ASSET_MAP.md에 에셋 매핑 갱신
```

**PAPER 구조** (논문형):
```markdown
# [제목]

## Abstract (요약)
## 1. Introduction (배경·목적)
## 2. Related Work (기존 기술·경쟁사)
## 3. Architecture (설계)
## 4. Implementation (구현)
## 5. Evaluation (성과·수치)
## 6. Discussion (한계·향후)
## 7. Conclusion
## Appendix (커밋 이력, 세션 로그 참조)
```

---

## 5. 정부자금전략 라이프사이클

### 5-1. 트랙 상태

| 상태 | 의미 | 행동 |
|------|------|------|
| `searching` | 서치 중 — 자격·일정·요건 조사 | 정보 수집, 타당성 판단 |
| `preparing` | 준비 중 — 서류 작성, 에셋 매핑 | 신청서 초안, 증빙 정리 |
| `challenging` | 도전 중 — 제출 완료, 심사 대기 | 추가 서류 대응, 이의신청 |
| `awarded` | 인증/선정 완료 | 이행·관리·갱신 |
| `rejected` | 탈락 | 사후 분석, 재도전 계획 |
| `paused` | 보류 | 사유 기록 |

### 5-2. ASSET_MAP.md (에셋↔트랙 매핑)

```markdown
# 에셋 매핑 테이블

| R&D 에셋 (Paper) | 디딤돌 | 창사 | KOITA | 벤처인증 | 특허 |
|------------------|--------|------|-------|---------|------|
| I2I 파이프라인 (90:10) | ★핵심 | ○활용 | ○활용 | ○활용 | ★출원 |
| AI 코칭 (Gemini Live) | ○활용 | ★핵심 | ○활용 | — | △검토 |
| 쿠키 단일화 | — | — | ○활용 | — | — |
| 크레딧 결제 시스템 | — | ★핵심 | — | ○활용 | — |
| MONK OS 멀티에이전트 | ○활용 | — | ★핵심 | ○활용 | ★출원 |

★ = 핵심 무기, ○ = 활용 가능, △ = 검토 필요, — = 무관
```

### 5-3. 트랙별 LOG.md 어펜딩

```markdown
## [2026-01-23] 아이리스 제출 완료
- 서류: DIDIMOL_RND_TEMPLATE.md
- 핵심 에셋: I2I 파이프라인, MONK OS

## [2026-02-13] 서면평가 결과 — 탈락
- 7건 지적 사항 분석: 20260213_디딤돌_서면평가결과_분석.md
- 이의신청 전략 수립

## [2026-02-15] 이의신청 초안 작성
- YONGA_RND_REBUTTAL_PROPOSAL.md
- API vs GPU Two-Track 논거
```

---

## 6. 기존 문서 이관 계획

### 6-1. docs/rnd_2026/ → docs/strategy/tracks/

| 현재 파일 | 이관 대상 |
|----------|----------|
| `DIDIMOL_RND_TEMPLATE.md` | `strategy/tracks/디딤돌/DOCS/` |
| `20260213_디딤돌_서면평가결과_분석.md` | `strategy/tracks/디딤돌/DOCS/` |
| `20260213_이의신청_절차_및_처리방법.md` | `strategy/tracks/디딤돌/DOCS/` |
| `20260215_YONGA_RND_REBUTTAL_PROPOSAL.md` | `strategy/tracks/디딤돌/DOCS/` |
| `MONKOS_RND_DEVELOPMENT_REPORT.md` | `strategy/tracks/디딤돌/DOCS/` |
| `아이리스_입력용.txt` | `strategy/tracks/디딤돌/DOCS/` |
| `기술개발목표_초안.md` | `strategy/tracks/디딤돌/DOCS/` |
| `연구개발방법_초안.md` | `strategy/tracks/디딤돌/DOCS/` |
| `KOITA_*.md` / `*.pdf` | `strategy/tracks/KOITA/DOCS/` |
| `20260212_RND_활동증빙_현장조사용.md` | `strategy/tracks/KOITA/DOCS/` |
| `20260220_RND_MONK_OS_인프라분석_AI리뷰.md` | `strategy/tracks/KOITA/DOCS/` |
| `PDF변환 디딤돌 R&D/` | `strategy/tracks/디딤돌/DOCS/공식양식/` |
| `GPU_LLM_ANALYSIS.md` | `research/projects/RD_GPU전략/` |
| `SDXL_MODEL_COMPARISON_4060.md` | `research/projects/RD_GPU전략/` |
| `komoju_*.md` | `strategy/tracks/일본진출/DOCS/` 또는 `research/projects/RD_일본결제/` |
| `토스_결제경로_캡처가이드.md` | `strategy/tracks/토스결제심사/DOCS/` |
| `generate_pdf.py` | `scripts/` (유틸리티) |

### 6-2. docs/infrastructure/strategy/ → docs/strategy/

| 현재 파일 | 이관 대상 |
|----------|----------|
| `COIN_ECONOMY_STRATEGY.md` | `strategy/` (범용 사업전략) |
| `CREDIT_NFT_FEASIBILITY_REPORT.md` | `strategy/` |
| `MARKETING_WEEKLY_STRATEGY.md` | `strategy/` |
| `MONK_ROCKET_STRATEGY.md` | `strategy/` |
| `MONK_AI_KIT_PACKAGE.md` | `strategy/` |
| `REMOTE_RETOUCH_APP_PROPOSAL.md` | `strategy/` |
| `DUAL_AI_DEPLOYMENT_STRATEGY.md` | `strategy/` |
| `STRATEGY_DIGEST.md` | `strategy/` |
| `KEYWORD_LEXICON.md` | `strategy/` |

### 6-3. 이관 원칙

- **옵스 편입 ≠ 원본 삭제** (MEMORY.md 교훈) — 이관 완료 후 원본 위치에 리다이렉트 README 배치
- 단계적 이관: 먼저 구조 생성 → 파일 이동 → 원본 리다이렉트 → 정본 테이블 갱신
- ch4 6조 4항 "폴더 편입" 절차 준수

---

## 7. 법률 편입: ch9 "연구개발" 신설안

### 7-1. ch9 조항 구성 (초안)

```markdown
# 제9장: 연구개발

### 1조: R&D 프로젝트 라이프사이클
프로젝트 단위 연구는 7단계 프로세스를 따른다.
① 목표설정 → ② 분석 → ③ 계획 → ④ 시행+명세 → ⑤ 로그 → ⑥ 성과 → ⑦ 논문

**1항**: 프로젝트 개시 기준 — 쌍아가 설계서(DESIGN_*)를 발행하는 규모의 기술 작업
**2항**: 각 단계의 산출물 파일명과 위치는 본 장에서 규정
**3항**: ④ SPEC.md와 ⑤ LOG.md는 어펜딩 방식 (날짜별 누적, 덮어쓰기 금지)

### 2조: 기술명세서 어펜딩 규칙
**1항**: SPEC.md는 구현 진행에 따라 날짜별 섹션을 추가한다
**2항**: 디버깅 과정(증상→원인→수정→교훈)을 반드시 기록한다
**3항**: 이전 내용을 삭제하거나 수정하지 않는다 (오류 발견 시 새 섹션에 정정)

### 3조: 논문 및 에셋 등록
**1항**: 프로젝트 완료 시 논문형 보고서(PAPER_*.md)를 작성한다
**2항**: 쌍아 리뷰 + 작가님 승인 후 papers/INDEX.md에 정식 등록
**3항**: 등록된 Paper는 정부자금전략의 에셋으로 활용 가능

### 4조: 정부자금전략
**1항**: 트랙별 전략은 docs/strategy/tracks/{트랙명}/ 하위에 관리한다
**2항**: 트랙 상태: searching | preparing | challenging | awarded | rejected | paused
**3항**: ASSET_MAP.md로 R&D 에셋과 트랙 간 매핑을 관리한다
**4항**: 특허 전략은 docs/strategy/patents/ 하위에 관리한다

### 5조: 정본 위치
| 대상 | 위치 |
|------|------|
| R&D 프로젝트 | docs/research/projects/ |
| 완성 논문 | docs/research/papers/ |
| 정부자금전략 | docs/strategy/ |
| 에셋 매핑 | docs/strategy/ASSET_MAP.md |
```

### 7-2. 연동 영향

| 대상 | 변경 |
|------|------|
| **CLAUDE.md 법률 인덱스** | ch9 추가 (5조) |
| **ch4 1조** | docs/ 하위 구조에 research/, strategy/ 추가 |
| **ch4 4조 정본 테이블** | research/, strategy/ 행 추가 |
| **ch4 3조** | R&D 문서 네이밍 패턴 추가 (RD_, PAPER_, PAT_) |
| **기존 법률** | 충돌 없음 |

---

## 8. 구현 로드맵

| 단계 | 내용 | 담당 |
|------|------|------|
| 1 | 본 설계서 작가님 리뷰 | 쌍아+작가님 |
| 2 | ch9 법률 개정 청구 | 쌍아 (ch4 8조 청구와 일괄 처리 가능) |
| 3 | 폴더 구조 생성 (research/, strategy/) | 막내 |
| 4 | 기존 문서 이관 (6절 계획대로) | 막내 |
| 5 | INDEX.md, ASSET_MAP.md 초기 작성 | 막내 |
| 6 | 소급 적용: 쿠키 단일화를 첫 R&D 프로젝트로 등록 | 쌍아+막내 |
| 7 | ch4 정본 테이블·CLAUDE.md 갱신 | 쌍아 |

---

## 9. 소급 적용 후보 (기존 기술 → R&D 프로젝트화)

| # | 기술 | 근거 자료 | Paper 가능성 |
|---|------|----------|-------------|
| 1 | I2I 파이프라인 (90:10) | idgen.js, QC 아키텍처 | ★ 핵심 에셋 |
| 2 | AI 코칭 (Gemini Live) | camera.js, 코칭 프롬프트 | ★ 핵심 에셋 |
| 3 | 쿠키 단일화 | 오늘 전체 자료 | ○ 인프라 에셋 |
| 4 | MONK OS 멀티에이전트 | CLAUDE.md, 법률 체계 | ★ 독보적 에셋 |
| 5 | 크레딧 결제 시스템 | 토스 SDK, 크레딧 로직 | ○ 사업 에셋 |
| 6 | BWYA 스키마 | bwya_schema, 2347 paragraphs | ★ 지식 에셋 |
| 7 | 크로스도메인 세션 | 설계서, 구현 | △ 보조 에셋 |

---

**이상 설계서 끝.**
