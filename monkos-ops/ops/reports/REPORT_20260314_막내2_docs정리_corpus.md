---
type: REPORT
date: 2026-03-14
from: iMac/막내2
subject: docs/ 정리 리서치 — corpus 영역 (세션아카이브·학습데이터)
order: ORDER_20260314_iMac쌍아_막내2_docs정리_corpus.md
---

# docs/corpus/ 정리 리서치 보고서

> **[2026-03-14 17:04 KST] iMac/막내2 → 쌍아**

---

## 전체 현황

| 항목 | 수치 |
|------|------|
| 총 용량 | ~69 MB |
| 총 파일 수 | ~120건 (PDF 31건 + md/txt/json ~89건) |
| 하위 폴더 | 7개 (sessions, claude_sessions, gemini, factory, bwya, notebookLM, legacy) |
| 최종 수정일 | 2026-02-27 (README 일괄 정비 이후 동결) |
| 외부 참조 | 291건 / 87파일에서 `docs/corpus/` 경로 참조 |

---

## 폴더별 분류

### 1. sessions/ — 세션 아카이브

| 항목 | 상세 |
|------|------|
| 파일 수 | 61건 (2026-01: 28쌍 md+txt, 2026-02: 23건 md, README 3건) |
| 용량 | ~1.1 MB |
| 날짜 범위 | 2026-01-08 ~ 2026-02-22 |
| 네이밍 | `YYYYMMDD_session.md` (구형) |

**vs ops/sessions/ 비교**:

| 기준 | docs/corpus/sessions/ | monkos-ops/ops/sessions/ |
|------|----------------------|--------------------------|
| 지위 | **읽기전용 아카이브** (정본 아님) | **정본** (ch3 1조) |
| 2026-01 | 28쌍 존재 | **폴더 미존재** |
| 2026-02 | 23건 (02-22까지) | 38건 (02-20~) |
| 2026-03 | 없음 | 54건+ (활성) |
| 네이밍 | `YYYYMMDD_session.md` | `YYYY-MM-DD_{디바이스}_{에이전트}.md` |
| 포맷 | 단순 서사형 | 구조화 (헤더+태그+섹션) |

**핵심 발견**:
- **중복 아님** — 완전히 다른 시스템. 2월 중순 전환기에 병존.
- 2026-01 세션은 **corpus/sessions/에만 존재**. ops/sessions/2026-01/은 미존재.
- ops/sessions/README.md에 명시: "docs/corpus/sessions/는 읽기전용 아카이브. 참조하지 마세요."
- **1월분은 유일본** — 삭제 시 복구 불가.

**분류: 학습 데이터 + 세션 정본(1월분)**

| 이관 제안 | 대상 | 이유 |
|----------|------|------|
| 현위치 유지 | 전체 | 아카이브 목적 부합. GCS 동기화 대상. NotebookLM 학습 소스 |
| 대안: 1월분 ops 이관 | 2026-01/ 28쌍 | ops/sessions/에 정본이 없는 유일 기간. 단, 네이밍 규칙이 구형이라 이관 시 변환 필요 |

---

### 2. claude_sessions/ — 철창이 아카이브

| 항목 | 상세 |
|------|------|
| 파일 수 | ~62건 (PDF 31건, md/docx/pptx ~31건) |
| 용량 | **~62 MB** (corpus 전체의 85%) |
| 하위 폴더 | 6개 (certifications, strategy, marketing, KOITA, templates, Chulchang) |

**하위 폴더별 상세**:

| 폴더 | 파일 수 | 용량 | 내용 | 현재 사용 |
|------|---------|------|------|----------|
| **certifications/** | 31 PDF + 1 md | **~58 MB** | Google Cloud AI 인증 교재 (MLOps, AI Security, Responsible AI 등) | ⚠️ 학습 참고용. 활성 사용 불명 |
| **strategy/** | 12 md/docx | ~432 KB | 글로벌 전략, GPU 인프라, 일본 진출, 디바이스 전략 등 | ⚠️ 일부 유효 (경쟁사 분석 등) |
| **marketing/** | 5 md | ~36 KB | SNS 전략, SEO, 경쟁사 벤치마크, MINA 로드맵 | ⚠️ 마케팅팀(한송이) 참고 가능 |
| **KOITA_2026Q1_PDF_아카이브/** | 3 PDF | ~3 MB | R&D 연구활동보고서, 별첨, 현장조사용 | ✅ KOITA 제출 원본 보존 필수 |
| **templates/** | 1 md | ~20 KB | live-present 아키텍처 템플릿 | ❌ 사문화 가능성 |
| **Chulchang/** | 1 md + README | ~12 KB | 철창이 세션 1건 (2025-02-13 Claude 플랜 분석) | ❌ 역사 자료 |

**중복 PDF 발견 (6건)**:

| 원본 | 중복 수 | 중복 용량 |
|------|---------|----------|
| C-SECWAI-B-m3-l2-ko-file-11.ko.pdf | (1)(2)(3) = 3건 | ~225 KB |
| T-RESPAIFB-I-4-l2-ko-file-18.ko.pdf | (1) = 1건 | ~8.5 MB |
| T-RESPAIFB-I-4-l3-ko-file-19.ko.pdf | (1) = 1건 | ~8.7 MB |
| T-RESPAIPS-I-m4-l4-ko-file-23.ko.pdf | (1) = 1건 | ~362 KB |
| google_secure_ai_framework_approach.pdf | (1) = 1건 | ~652 KB |
| how-ai-can-reverse-defenders-dilemma.pdf | (1) = 1건 | ~1.1 MB |
| **합계** | **8건** | **~19.5 MB** |

바이트 동일 — 브라우저 다운로드 중복 (`(1)` 접미사). **삭제해도 무방**.

**분류**:

| 분류 | 대상 | 이관 제안 |
|------|------|----------|
| 학습 데이터 | certifications/ (인증 교재) | 현위치 유지. 중복 8건 삭제 → **~19.5 MB 절감** |
| 활성 | KOITA_2026Q1_PDF_아카이브/ | 현위치 유지 (제출 원본 보존) |
| 활성/레거시 경계 | strategy/, marketing/ | ops/contents/ 또는 monkos-ops/marketing/ 이관 검토 |
| 레거시 | Chulchang/, templates/ | `docs/archives/`로 이관 |

---

### 3. gemini/ — 용아 대화 기록

| 항목 | 상세 |
|------|------|
| 파일 수 | 11건 (JSON 3건 + md 7건 + README) |
| 용량 | ~5.5 MB |
| 내용 | Gemini(용아) 전략 대화 코퍼스 — 비용분석, 인프라, 사업전략 |

**JSON 파일 상세**:

| 파일 | 용량 | 내용 |
|------|------|------|
| GEMINI_CORPUS_202601.json | 556 KB | 2026-01 대화 (8세션, 205턴) |
| GEMINI_CORPUS_LEGACY.json | **4.0 MB** | 레거시 전체 대화 |
| GEMINI_CORPUS_TOTAL.json | 456 KB | 집계 |

**README 대비 실태**:
- README에 `gemini/yonga_conversations/` 하위 폴더 기술 → **실제 미존재** (문서화 vs 현실 괴리)

**분류: 학습 데이터**

| 이관 제안 | 대상 | 이유 |
|----------|------|------|
| 현위치 유지 | 전체 | GCS 동기화·NotebookLM 학습 대상. 활성 코퍼스 |
| LEGACY.json 검토 | 4 MB 파일 | Git에서 대형 JSON 관리 적합성 검토. GCS 전용 전환 고려 |

---

### 4. factory/ — Windows 공장 로그

| 항목 | 상세 |
|------|------|
| 파일 수 | 2건 (README + telegram_ai_communication_strategy.md) |
| 용량 | ~16 KB |
| 상태 | **계획 단계 — 실데이터 0건** |

- README는 246줄의 상세 계획서 (시간별/일일/작업별 로그 체계 설계)
- 실제 로그 파일(2026-01/, reports/, tasks/ 등)은 **미생성**
- `telegram_ai_communication_strategy.md`는 factory 로그와 무관한 문서 (잘못 배치)

**분류: 사문화 (계획만 존재, 실행 0)**

| 이관 제안 | 대상 | 이유 |
|----------|------|------|
| 현위치 유지 or 삭제 제안 | README.md | 4060 공장 자동화 미가동. 재가동 시 재설계 필요 |
| 이동 | telegram_ai_communication_strategy.md | 잘못된 배치 — strategy/ 또는 marketing/으로 이관 |

---

### 5. bwya/ — BWYA Academy 자료

| 항목 | 상세 |
|------|------|
| 파일 수 | 1건 (extracted_tags.json) |
| 용량 | ~8 KB |
| 내용 | BWYA Academy 이미지 태그 추출 데이터 (lighting, composition, mood 등) |

- 이미지 프롬프트/태그 분석용 구조화 데이터
- I2I 서비스의 프롬프트 엔지니어링 참고 자료로 활용 가능

**분류: 학습 데이터**

| 이관 제안 | 대상 | 이유 |
|----------|------|------|
| 현위치 유지 | extracted_tags.json | 코퍼스 목적에 부합. 크기 미미 |

---

### 6. notebookLM/ — NotebookLM 노트

| 항목 | 상세 |
|------|------|
| 파일 수 | 3건 (ONBOARDING_GUIDE.md, 20260119_notebooklm_chat.md, README) |
| 용량 | ~48 KB |
| 내용 | NotebookLM 온보딩 가이드 (팀원 교육용) + AI 기억 시스템 실험 대화 |

- ONBOARDING_GUIDE.md: 팀원(한송이 등) NotebookLM 사용법 교육 문서
- 20260119_notebooklm_chat.md: NotebookLM에 세션 로그 32건 피딩 후 대화 기록

**분류: 학습 데이터 + 팀원 교육**

| 이관 제안 | 대상 | 이유 |
|----------|------|------|
| 현위치 유지 | 전체 | NotebookLM 활용이 재개되면 참고. 크기 미미 |

---

### 7. legacy/ — 레거시 문서

| 항목 | 상세 |
|------|------|
| 파일 수 | 27건 (md 22건 + txt 2건 + json 3건) |
| 용량 | ~436 KB |
| 보존 기한 | 2026-12-31 (README에 명시) |
| 내용 | Cursor IDE 시대 문서, Soul Sync 설계, 맥락 복구 보고서, CLAUDE.md v1 백업 |

**가치 판단**:

| 파일 | 보존 가치 | 이유 |
|------|----------|------|
| CLAUDE_md_v1_20260220.md | **높음** | 헌법 v1 원본 — 역사적 기록 |
| 20260207_cursorrules.md | **높음** | Cursor→Claude Code 전환 전 설정 백업 |
| cursorignore_20260207.txt | **중간** | .cursorignore 백업 |
| 20260108_CONTEXT_RECOVERY_REPORT.md | **중간** | 초기 맥락 복구 기록 |
| 20260108_RECOVERED_CONTEXT.md | **중간** | 복구된 맥락 데이터 |
| SOUL_ARCHITECTURE.md 등 Soul Sync 5건 | **낮음** | Soul Sync 프로젝트 폐기됨. 설계 여정 기록으로만 가치 |
| CURSOR_AI_COLLABORATION_GUIDE.md | **낮음** | Cursor IDE 미사용 |
| backup_json/ 3건 | **낮음** | Cursor Composer JSON 덤프. 48~56 KB |
| backup_markdown/ 1건 | **낮음** | Cursor 대화 마크다운 변환본 |

**분류: 레거시 (보존 기한 내)**

| 이관 제안 | 대상 | 이유 |
|----------|------|------|
| 현위치 유지 | 전체 | 보존 기한 2026-12-31. 기한 내 삭제 불가 |
| 2026년 말 재검토 | 전체 | 기한 도래 시 CLAUDE_md_v1, cursorrules만 영구 보존, 나머지 삭제 검토 |

---

## 종합 분류표

| 분류 | 폴더 | 파일 수 | 용량 | 이관 제안 |
|------|------|---------|------|----------|
| **학습 데이터** | sessions/, gemini/, bwya/, notebookLM/ | ~76건 | ~6.7 MB | 현위치 유지 (GCS 동기화 대상) |
| **활성** | claude_sessions/KOITA_2026Q1_PDF_아카이브/ | 3건 | ~3 MB | 현위치 유지 (제출 원본) |
| **활성/레거시 경계** | claude_sessions/strategy/, marketing/ | ~17건 | ~468 KB | ops 이관 검토 또는 현위치 유지 |
| **레거시** | legacy/, claude_sessions/Chulchang/, templates/ | ~30건 | ~448 KB | 현위치 유지 (보존 기한 내) |
| **사문화** | factory/ (README만) | 2건 | ~16 KB | 재가동 시까지 동결 |
| **삭제 제안** | certifications/ 중복 PDF 8건 | 8건 | **~19.5 MB** | 즉시 삭제 가능 (바이트 동일 중복) |
| **잘못된 배치** | factory/telegram_ai_communication_strategy.md | 1건 | 미미 | strategy/ 또는 marketing/으로 이관 |

---

## 핵심 권고사항

### 즉시 실행 가능 (작가님 승인 시)

1. **중복 PDF 8건 삭제** → ~19.5 MB 절감 (corpus 전체의 28%)
2. **factory/telegram_ai_communication_strategy.md 이관** → strategy/로 이동

### 검토 필요

3. **GEMINI_CORPUS_LEGACY.json (4 MB)**: Git 추적 적합성 — GCS 전용 전환 또는 `.gitignore` 추가 검토
4. **certifications/ PDF 31건 (58 MB)**: Git에서 바이너리 PDF 58 MB 추적 중. LFS 전환 또는 GCS 전용 전환 검토
5. **strategy/marketing/ 17건**: monkos-ops/contents/ 또는 monkos-ops/marketing/ 이관 시 ops 체계와 통합 가능. 단, 현재 corpus README의 "검색 팁" 테이블에서 활성 참조 중

### 장기 과제

6. **2026-01 세션 정본 문제**: ops/sessions/2026-01/이 미존재. corpus/sessions/2026-01/이 유일본. 정본 체계 통일 시 이관 여부 결정 필요 (네이밍 변환 수반)
7. **corpus/README.md 갱신**: 최종 업데이트 2026-02-15. gemini/yonga_conversations/ 미존재, factory/ 미가동 등 현실과 괴리

---

**[2026-03-14 17:04 KST] iMac/막내2 — 리서치 완료**
