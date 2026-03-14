# 현행 문서 체계 해부 — 3계층 분리 설계안

**작성일**: 2026-02-20 05:45 KST
**작성자**: M1/막내2 (지시서: M1/쌍아)
**목적**: CLAUDE.md 372줄 + MEMORY.md 192줄 + docs/ 148개를 3계층(헌법/법률/규정)으로 분류하고, 최적 분리 설계안 제시

---

## 1. CLAUDE.md 정밀 해부 (Phase 1)

### 1-1. 3계층 분류표

| # | 줄 범위 | 섹션명 | 분류 | 근거 | MEMORY 중복 |
|---|---------|--------|------|------|-------------|
| 1 | L1-10 | 1규칙: 타임스탬프 | **헌법** | "절대 준수" 명시. 시계열 정합성의 근간 | ✗ |
| 2 | L12-26 | 수발신 헤더 (형식) | **법률** | 구체적 형식 규정. 디바이스 추가 시 변경됨 | ✗ |
| 3 | L28-33 | 프로젝트 개요 | **헌법** | 이름·비전·도메인 = 프로젝트 정체성 | ✗ |
| 4 | L35-46 | 4 MUSE 시스템 | **헌법** | 비즈니스 구조의 근간. 네이밍 규칙 포함 | ✗ |
| 5 | L48-58 | 에이전트 정의 (표) | **법률** | 모델명·alias 변경 가능 (Opus→다른 모델 등) | ✗ |
| 6 | L60-87 | 에이전트 관계 + 핵심흐름 | **법률** | 조직도. 확장 가능 (로컬 LLM 추가 등) | ✗ |
| 7 | L88-108 | 지시서 작성 규칙 | **법률** | 운용 규칙. 형식 변경 가능 | △ (MEMORY L187) |
| 8 | L110-120 | CLI 단축 명령 (alias) | **규정** | 기술 상세. alias 수시 변경 | ✗ |
| 9 | L122-130 | 디바이스 약칭 | **규정** | 기술 상세. 디바이스 추가/변경 시 갱신 | ✗ |
| 10 | L132-160 | 운용 환경 구조 | **규정** | 디바이스별 구성. 수시 변경 (이미 변경된 내용 있음) | ✗ |
| 11 | L162-172 | 세션 저장 + 뮤즈 구분 | **규정** | 저장 경로 등 기술 상세 | ✗ |
| 12 | L174-181 | 응답 규칙 | **헌법** | "작가님" 호칭, "아부 금지" = 프로젝트 문화의 근간 | ✗ |
| 13 | L183-205 | 2규칙: 완료 보고 | **헌법** | "절대 준수" 명시. 모든 에이전트 적용 | ✗ |
| 14 | L207-215 | 코딩 규칙 | **법률** | 기술 스택 변경 시 수정 가능 (JS→TS 등) | ✗ |
| 15 | L217-230 | 인프라 보호 규칙 | **헌법** | "절대 준수". API 키·민감정보 보호 = 불변 원칙 | ✗ |
| 16 | L232-265 | 세션 로그 규칙 | **법률** | 형식·위치는 변경 가능 | ✗ |
| 17 | L267-283 | 파일/폴더 규칙 | **법률** | 폴더 구조는 변경 가능 | ✗ |
| 18 | L285-288 | 막내 규칙 서문 | **헌법** | "권한이 열려있을수록 규율이 중요" = 불변 원칙 | ✗ |
| 19 | L290-301 | 배포 규칙 | **법률** | 허용/금지 표. 전략 변경 시 수정 | ✗ |
| 20 | L303-309 | 작업 흐름 | **법률** | 운용 흐름도 | ✗ |
| 21 | L311-316 | 브랜치 규칙 | **법률** | develop/main 운용 규칙 | ✗ |
| 22 | L318-326 | 금지 사항 | **헌법**(파괴·보안) + **법률**(배포·구조·범위) | 파괴·보안은 불변, 나머지는 변경 가능 | ✗ |
| 23 | L328-337 | 자유 작업 범위 | **법률** | 허용 범위는 변경 가능 | ✗ |
| 24 | L339-346 | 에스컬레이션 | **법률** | 운용 규칙 | ✗ |
| 25 | L348-353 | 커밋 규칙 | **법률** | 접두사·형식은 변경 가능 | ✗ |
| 26 | L355-357 | 완료 보고 (참조) | **헌법** | 2규칙 참조 | ✗ |
| 27 | L359-363 | MEMORY.md 확인 의무 | **법률** | 운용 규칙 | ✗ |
| 28 | L365-372 | 참조 문서 | **규정** | 경로·문서명은 변경됨 | ✗ |

### 1-2. 계층별 줄 수 집계

| 계층 | 해당 항목 | 현재 줄 수 | 비율 |
|------|----------|-----------|------|
| **헌법** | #1, #3, #4, #12, #13, #15, #18, #22(일부), #26 | ~95줄 | 25% |
| **법률** | #2, #5, #6, #7, #14, #16, #17, #19-25, #27 | ~215줄 | 58% |
| **규정** | #8, #9, #10, #11, #28 | ~62줄 | 17% |

**핵심 발견**: 현재 CLAUDE.md의 **75%가 헌법이 아닌 내용** (법률 58% + 규정 17%). 이것이 토큰 낭비의 근본 원인.

### 1-3. 혼재 문제 상세

**가장 심각한 혼재**: #22 금지 사항 (L318-326)
- "파괴: rm -rf, git push --force" = **헌법** (영구 불변)
- "배포: deploy.sh prod 금지" = **법률** (전략 변경 시 수정)
- "구조: DB 스키마 변경" = **법률**
- → 한 테이블 안에 3계층이 섞여 있음

**운용 환경 비대화**: #10 (L132-160, 29줄)
- 디바이스 5대의 상세 구성을 CLAUDE.md에 직접 기술
- 이미 3TRACK_SYSTEM_ARCHITECTURE.md에 더 상세하게 있음 → 중복

---

## 2. MEMORY.md ↔ CLAUDE.md 대조 (Phase 2)

### 2-1. 대조표

| MEMORY 섹션 | 줄 범위 | CLAUDE.md 대응 | 관계 | 비고 |
|-------------|---------|---------------|------|------|
| Imagen 프롬프트 핵심 원칙 | L3-7 | 없음 | **MEMORY만** | 도메인 지식 (규정) |
| 코칭 프롬프트 구조 | L9-14 | 없음 | **MEMORY만** | 기술 상세 (규정) |
| 일본 취활 규칙 | L16-21 | 없음 | **MEMORY만** | 도메인 지식 (규정) |
| AI 모델 스택 & API 경로 | L23-34 | CLAUDE L214 "Backend: GCP Cloud Run..." | **부분 중복** | MEMORY가 10배 상세 |
| monkos_AI 인프라 구조 | L36-81 | 없음 | **MEMORY만** | 기술 상세 (규정) |
| 서비스 계보 | L83-101 | 없음 | **MEMORY만** | 구조 설명 (규정) |
| 79 임계점 분석 | L103-113 | 없음 | **MEMORY만** | 역사적 교훈 (경험) |
| 리팩토링 전략 | L115-175 | 없음 | **MEMORY만** | 현재 작업 전략 (규정) |
| 멀티 에이전트 운용 교훈 | L177-179 | 없음 | **MEMORY만** | 교훈 (경험) |
| 향후 구상 | L181-185 | 없음 | **MEMORY만** | 구상 (경험) |
| 지시서 작성 규칙 | L187-188 | CLAUDE L88-108 | **중복** | CLAUDE에 상세, MEMORY는 참조만 |
| 프로젝트 구조 | L190-192 | 없음 | **MEMORY만** | 경로 정보 (규정) |

### 2-2. 관계 요약

| 관계 | 건수 | 비고 |
|------|------|------|
| **MEMORY만** (CLAUDE에 없음) | 10/12 | MEMORY가 기술 규정 + 경험의 주 저장소 역할 |
| **부분 중복** | 1/12 | AI 모델 스택 — CLAUDE는 1줄, MEMORY는 12줄 |
| **중복** | 1/12 | 지시서 규칙 — 양쪽에 있으나 MEMORY는 참조만 |
| **충돌** | 0/12 | 내용 충돌 없음 |
| **CLAUDE만** (MEMORY에 없음) | 거의 전부 | 운용 규칙·원칙은 CLAUDE에만 있음 |

### 2-3. 핵심 발견

1. **CLAUDE.md = 규칙 (How to behave)** / **MEMORY.md = 지식 (What to know)**
   - 두 문서의 성격이 이미 자연 분리되어 있음
   - 중복이 거의 없는 이유: 각자의 역할이 다르기 때문

2. **MEMORY.md의 실질적 역할 = "규정" 계층**
   - 기술 상세 (모델명, API 경로, 배포 타겟) = 규정
   - 학습된 경험 (장애 교훈, 리팩토링) = 규정 + α
   - → MEMORY.md가 이미 규정 계층으로 기능하고 있음

3. **200줄 제한이 자연적 압축기**
   - MEMORY.md의 200줄 제한이 "정말 중요한 기술 규정만 남기게" 강제함
   - 이 제약이 오히려 규정 계층의 품질을 유지하는 기제

---

## 3. docs/ 규칙 문서 감사 (Phase 3)

### 3-1. 핵심 12개 문서 상세 감사

| 문서 | 작성일 | 줄 수 | 판정 | 근거 |
|------|--------|------|------|------|
| MONKOS_AI_TECHNICAL_SPEC.md | 2/18 | 382줄 | **현행** ★ | 가장 포괄적 기술문서. MEMORY.md와 상당 부분 중복 |
| CODING_STANDARDS.md | 1月 | 57줄 | **현행** | CLAUDE.md가 직접 참조. 간결하고 유효 |
| DESIGN_SYSTEM.md | 1月 | 72줄 | **현행** | CLAUDE.md가 직접 참조. 간결하고 유효 |
| DEPLOYMENT_GUIDE.md | 2/9 | 175줄 | **구식** | Photo Coach → apps/ 참조 (레거시). TECH_SPEC에 갱신됨 |
| 3TRACK_SYSTEM_ARCHITECTURE.md | 2/15 | 260줄 | **중복** | 에이전트 체계가 CLAUDE.md·MEMORY.md와 3중 중복 |
| GCS_BUCKET_STRUCTURE.md | 2/8 | 284줄 | **현행** | GCS 상세. CLAUDE.md와 중복 없음 (독립) |
| SESSION_LOG_VALUE.md | 1月 | 114줄 | **독립** | 전략 문서 (규칙 아님, 참고 자료) |
| VSCODE_WORKSPACE_STANDARD.md | 2/17 | 179줄 | **현행** | 워크스페이스 표준. CLAUDE.md와 중복 없음 |
| OVERNIGHT_AUTOMATION_RULES.md | 1/27 | 399줄 | **현행** | 야간 자동화 규칙. CLAUDE.md와 중복 없음 |
| CLAUDE_CODE_COLLABORATION_STRATEGY.md | 1/23 | 377줄 | **구식** | Cursor 시대 문서. 현재 CLI 체계와 불일치 |
| CLAUDE_CODE_FEATURES.md | 1/24 | 182줄 | **구식** | Cursor 시대 문서. 현재 CLI 체계와 불일치 |
| CLAUDE_CODE_SETUP_GUIDE.md | 1/24 | 162줄 | **구식** | Cursor 시대 문서. 현재 CLI 체계와 불일치 |

### 3-2. docs/infrastructure/ 나머지 39개 파일명 분류

| 판정 | 파일 | 비고 |
|------|------|------|
| **구식** | GPU_VM_SETUP_L4.md, VERTEX_VM_SETUP_GUIDE.md, VERTEX_CREDIT_STRATEGY.md | VM/Vertex 구시대 |
| **구식** | DUAL_AI_DEPLOYMENT_STRATEGY.md, ROADMAP_GCP_ENGINE.md | 구 전략 (실현/폐기) |
| **구식** | OPUS_EXECUTION_PLAN.md, RESUME_SESSION.md, GO_NOW.md | 일회성 실행 계획 |
| **구식** | SCRIPTS_CLEANUP_GUIDE.md, HOME_RESTART_GUIDE.md | 일회성 가이드 |
| **구식** | YONGA_CONNECTION_GUIDE.md, YONGA_TEST_SWITCH.md | Gemini 연결 (초기 설정) |
| **현행** | TECHNICAL_SPEC_20260220.md | 최신 인프라 변경사항 (2/20) |
| **현행** | MONKOS_AI_TECHNICAL_SPEC.md | 총괄 기술문서 (2/18) |
| **현행** | ARCHITECTURE_FLOWCHART.md | 00079 플로우차트 |
| **현행** | MONK_PHOTO_STUDIO_ARCHITECTURE.md | 몽크사진관 전략 |
| **현행** | SHARED_CORE_SEPARATION_PLAN.md | KR/JP 분리 설계 |
| **현행** | CF_SERVERLESS_MIGRATION_STRATEGY.md | CF 마이그레이션 |
| **현행** | COACHING_MODEL_UPGRADE_SPEC.md | 코칭 모델 업그레이드 |
| **현행** | QC_CONSULTANT_ARCHITECTURE.md | QC 아키텍처 |
| **독립** | MONK_AI_KIT_PACKAGE.md, MONK_ROCKET_STRATEGY.md | 전략 자료 |
| **독립** | ARCHITECTURE_GUIDE_FROM_YONGA.md | 용아 자문 |
| **독립** | KBEAUTY_DATA_SCHEMA.md, BWYA_SCHEMA_DESIGN.md, BWYA_ACADEMY_INDEX.md | 데이터/교육 |
| **독립** | LOOKBOOK_BACKGROUND_STRATEGY.md | 룩북 전략 |
| **독립** | GCS_BACKUP_SETUP.md | 백업 절차 |
| **독립** | MONKOS_CHAT_DEPLOYMENT.md | 챗봇 배포 |
| **독립** | GCP_COST_ANALYSIS.md, COIN_ECONOMY_STRATEGY.md | 비용/경제 분석 |
| **독립** | KEYWORD_LEXICON.md | 키워드 사전 |
| **독립** | VERTEX_AI_CONNECTION_GUIDE.md | Vertex 연결 |
| **독립** | REMOTE_RETOUCH_APP_PROPOSAL.md, CREDIT_NFT_FEASIBILITY_REPORT.md | 기획서 |
| **독립** | SECURITY_AUDIT_REPORT.md | 보안 감사 |
| **독립** | PROJECT_WORK_HISTORY.md | 작업 이력 |
| **독립** | MARKETING_WEEKLY_STRATEGY.md | 마케팅 전략 |
| **독립** | test_payment_flow.md, 연구원_이력서_양식.md | 기타 |

### 3-3. docs/monkos/ (31개) — 작업 큐·지시서·사고보고

| 판정 | 건수 | 설명 |
|------|------|------|
| **독립** (지시서) | 20개 | TASK_2026MMDD_*.md — 완료/진행 중인 작업 지시서 |
| **독립** (사고보고) | 1개 | INCIDENT_20260216_deployment.md |
| **독립** (설계서) | 2개 | DESIGN_*, SPRINT_* |
| **독립** (기타) | 8개 | work_queue, YONGA, PHASE1 등 |

### 3-4. docs/corpus/ (~70개) — 세션 로그·아카이브

전부 **독립** (규칙 문서 아님). 세션 로그, Gemini 대화, 레거시 아카이브, 전략 문서 등.

### 3-5. docs/rnd_2026/ (16개) — R&D 문서

전부 **독립** (규칙 문서 아님). KOITA 보고서, 디딤돌 서류, GPU 분석 등.

### 3-6. 문서 감사 집계

| 판정 | 건수 | 조치 |
|------|------|------|
| **현행** (유효, 참조 필요) | 12개 | 3계층 분리 시 참조 경로 정비 |
| **구식** (내용 오래됨) | 12개 | legacy/ 이관 또는 삭제 검토 |
| **중복** (CLAUDE/MEMORY와 겹침) | 1개 | 3TRACK → 통합 후 정리 |
| **독립** (규칙 아님, 참고 자료) | ~123개 | 분리 대상 아님. 현재 위치 유지 |

---

## 4. 3계층 분리 설계안 (Phase 4)

### 4-0. 설계 전 핵심 제약 정리

| 제약 | 내용 | 영향 |
|------|------|------|
| **자동 로딩** | CLAUDE.md + MEMORY.md만 매 세션 시스템 프롬프트에 주입 | 다른 파일은 수동 읽기 필요 |
| **MEMORY 200줄 제한** | 200줄 초과 시 절단 | 규정 계층의 자연적 용량 한도 |
| **멀티에이전트 동기** | 쌍아·막내·소넷이 전원이 같은 규칙을 봐야 함 | 규칙 파편화 위험 |
| **토큰 비용** | CLAUDE.md 전문이 매 턴 시스템 프롬프트 소비 | 짧을수록 좋음 |

### 4-1. 설계안 A: 3파일 완전 분리 (권장)

```
CLAUDE.md (~120줄)                    ← 헌법: 매 세션 자동 로딩
docs/infrastructure/OPERATION_RULES.md (~200줄)  ← 법률: CLAUDE.md에서 참조, 필요시 읽기
MEMORY.md (~180줄)                    ← 규정: 매 세션 자동 로딩 (현재 역할 유지)
```

#### 계층 1: 헌법 (CLAUDE.md — 프로젝트 루트, ~120줄)

포함 항목:
- **프로젝트 정체성** (이름, 비전, 도메인, 언어, 환경)
- **4 MUSE 시스템** (표 + 네이밍 규칙)
- **1규칙: 타임스탬프** (원칙 + 형식)
- **2규칙: 완료 보고** (원칙 + 형식)
- **응답 규칙** ("작가님" 호칭, 아부 금지, 피드백 의무)
- **인프라 보호 규칙** (민감 정보 금지, 승인 필요 파일)
- **에이전트 정의** (표만 — 5인 이름·모델·역할)
- **절대 금지 사항** (파괴: rm -rf, force push / 보안: API 키 하드코딩)
- **참조 링크 블록** (법률·규정 파일 경로)

예상 줄 수: ~120줄 (현재 372줄 → **68% 축소**)
로딩: 매 세션 자동 (시스템 프롬프트)

#### 계층 2: 법률 (OPERATION_RULES.md, ~200줄)

포함 항목:
- **에이전트 상세** (관계도, 핵심 흐름, 지시서 작성 규칙)
- **수발신 헤더 상세** (형식, 예시)
- **코딩 규칙** (JS, 네이밍, Tailwind 등 — 상세는 CODING_STANDARDS.md 참조)
- **세션 로그 규칙** (위치, 형식, 헤더, 본문, 종료)
- **파일/폴더 규칙** (docs/ 구조, 금지 사항)
- **막내 규칙 전문** (배포, 브랜치, 금지, 자유, 에스컬레이션, 커밋, 보고)

예상 줄 수: ~200줄
로딩: CLAUDE.md 말미에 `⚠️ 작업 시작 전 반드시 읽기: docs/infrastructure/OPERATION_RULES.md` 명시

#### 계층 3: 규정 (MEMORY.md — 현재 역할 유지, ~180줄)

포함 항목 (현재와 동일):
- **AI 모델 스택** (모델명, API 경로, 과금 정보)
- **인프라 구조** (DB, 서비스 구조, Cloud Run 배포 타겟)
- **리팩토링 현황** (작업장, 동결 대상, 페이지 분리)
- **도메인 지식** (Imagen 특성, 코칭 구조, 일본 규칙)
- **학습된 경험** (79 임계점, 에이전트 운용 교훈)

변경사항:
- `지시서 작성 규칙` 항목 삭제 (CLAUDE.md → OPERATION_RULES.md로 이관됨. 참조 불필요)
- `프로젝트 구조` 항목 유지

예상 줄 수: ~180줄 (200줄 이내)
로딩: 매 세션 자동 (시스템 프롬프트)

#### CLAUDE.md 참조 블록 (설계안 A 말미)

```markdown
## 참조 문서 (작업 전 필독)

### 필수 (전 에이전트)
- **운용 규칙**: `docs/infrastructure/OPERATION_RULES.md` ← 법률 계층
- **기술명세**: `docs/infrastructure/architecture/MONKOS_AI_TECHNICAL_SPEC.md`

### 코딩 관련
- 코딩 표준: `docs/infrastructure/guides/CODING_STANDARDS.md`
- 디자인 시스템: `docs/infrastructure/guides/DESIGN_SYSTEM.md`

### 인프라 관련
- 아키텍처: `docs/infrastructure/architecture/3TRACK_SYSTEM_ARCHITECTURE.md`
- GCS 구조: `docs/infrastructure/deployment/GCS_BUCKET_STRUCTURE.md`
- 배포 가이드: `docs/infrastructure/architecture/MONKOS_AI_TECHNICAL_SPEC.md` §3 (배포 체계)
```

---

### 4-2. 설계안 B: CLAUDE.md에 법률 포함 (보수적)

```
CLAUDE.md (~250줄)          ← 헌법 + 핵심 법률: 매 세션 자동 로딩
MEMORY.md (~180줄)          ← 규정: 매 세션 자동 로딩
docs/infrastructure/ 참조   ← 상세 규정: 필요시 읽기
```

- CLAUDE.md에서 규정(CLI alias, 디바이스 상세, 운용 환경 29줄)만 제거
- 법률은 CLAUDE.md에 유지
- 현재 372줄 → ~250줄 (33% 축소)

#### 장점
- 모든 규칙이 자동 로딩됨 → 읽기 누락 위험 0
- 마이그레이션 간단 (규정만 삭제)

#### 단점
- 여전히 250줄 → 토큰 비용 여전히 높음
- 법률 변경 시 CLAUDE.md 직접 수정 필요
- 3계층 분리의 효과가 미미

---

### 4-3. 설계안 C: CLAUDE.md 최소화 + .claude/ 활용

```
CLAUDE.md (~80줄)                     ← 헌법: 핵심 원칙만
.claude/rules/operation.md (~200줄)   ← 법률: Claude Code가 자동 인식할 수도 있는 경로
MEMORY.md (~180줄)                    ← 규정: 현재 역할 유지
```

#### 장점
- CLAUDE.md 극한 압축 (~80줄)
- `.claude/` 디렉토리가 Claude Code의 프로젝트 설정 디렉토리로 이미 사용됨

#### 단점
- `.claude/rules/` 내 .md 파일이 시스템 프롬프트에 자동 로딩되는지 미검증
- 자동 로딩 안 되면 설계안 A와 동일한 수동 읽기 필요
- `.claude/`는 이미 Claude Code 내부용 → 규칙 파일 배치 시 충돌 가능성

---

### 4-4. 설계안 비교

| 기준 | A: 3파일 분리 | B: 보수적 | C: .claude/ 활용 |
|------|-------------|----------|------------------|
| **CLAUDE.md 줄 수** | ~120줄 | ~250줄 | ~80줄 |
| **축소율** | 68% | 33% | 78% |
| **자동 로딩 커버리지** | 헌법 + 규정 | 헌법 + 법률 + 규정 | 헌법 + 규정 (법률 미검증) |
| **법률 읽기 누락 위험** | 중간 (참조 명시로 완화) | 없음 | 높음 (미검증) |
| **유지보수성** | 높음 (계층별 독립 수정) | 중간 (CLAUDE.md 수정 빈번) | 높음 |
| **마이그레이션 난이도** | 중간 | 낮음 | 높음 (검증 필요) |
| **멀티에이전트 동기** | 좋음 (경로 명시) | 최고 (자동 로딩) | 불확실 |
| **토큰 효율** | 좋음 | 보통 | 최고 |

### 4-5. 권장: **설계안 A (3파일 분리)** + 안전장치

**선택 근거:**
1. 68% 축소로 토큰 효율 대폭 개선
2. MEMORY.md가 이미 규정 역할 → 자연스러운 3계층 완성
3. 법률 읽기 누락은 아래 안전장치로 해소

**안전장치:**
```markdown
## ⚠️ 필독 의무 (CLAUDE.md 말미에 추가)

> 모든 에이전트는 작업 시작 전 반드시 아래를 읽는다:
> 1. MEMORY.md (자동 로딩 — 확인만)
> 2. `docs/infrastructure/OPERATION_RULES.md` (수동 읽기 — 필수)
>
> 읽지 않은 채 작업 시작 시 **에스컬레이션 대상**.
```

추가로 OPERATION_RULES.md 첫 줄에:
```markdown
> ⚠️ 이 문서는 CLAUDE.md(헌법)의 하위 법률이다. 모든 에이전트는 작업 전 필독.
```

---

### 4-6. MEMORY.md 역할 재정의

| 항목 | 현재 | 제안 |
|------|------|------|
| 성격 | CLAUDE.md의 보조 저장소 (혼재) | **규정 계층의 정본** |
| 내용 | 기술 상세 + 경험 + 약간의 규칙 참조 | 기술 규정 + 학습된 경험 (규칙 참조 삭제) |
| 중복 | 지시서 규칙 참조 1건 | 0건 |
| TECH_SPEC과 관계 | 상당 부분 중복 | 역할 분담: MEMORY = 에이전트용 요약, TECH_SPEC = 상세 레퍼런스 |

**MEMORY.md 정리 항목:**
- 삭제: `지시서 작성 규칙 (2/18 확정)` — OPERATION_RULES.md로 이관
- 유지: 나머지 전부 (이미 규정 성격)
- TECH_SPEC과의 중복은 의도적 유지: MEMORY = 자동 로딩 요약본, TECH_SPEC = 수동 참조 상세본

---

### 4-7. 마이그레이션 계획

#### Step 1: 산출물 승인 (작가님)
- 이 문서 + 막내1호 세션 연대기 종합 검토
- 설계안 A/B/C 중 최종 선택

#### Step 2: OPERATION_RULES.md 작성
- CLAUDE.md에서 법률 항목 추출
- 섹션 구조 확정 후 신규 파일 작성
- 위치: `docs/infrastructure/OPERATION_RULES.md`

#### Step 3: CLAUDE.md 축소
- 헌법 항목만 남기고 법률·규정 제거
- 참조 블록 추가 (OPERATION_RULES.md, TECH_SPEC 경로)
- 필독 의무 안전장치 추가

#### Step 4: MEMORY.md 정리
- 중복 항목 삭제 (지시서 규칙 참조)
- 역할 재정의 주석 추가

#### Step 5: 구식 문서 정리
- CLAUDE_CODE_COLLABORATION_STRATEGY.md → legacy/ 이관
- CLAUDE_CODE_FEATURES.md → legacy/ 이관
- CLAUDE_CODE_SETUP_GUIDE.md → legacy/ 이관
- DEPLOYMENT_GUIDE.md → TECH_SPEC으로 흡수 후 legacy/ 이관

#### Step 6: 검증
- 쌍아·막내·소넷이 각각 새 CLAUDE.md로 세션 시작
- OPERATION_RULES.md 읽기 누락 여부 테스트
- 1주일 운용 후 재평가

---

## 5. 부록: 에스컬레이션 발견사항

### 5-1. CLAUDE.md와 실제 운용 간 괴리

| 항목 | CLAUDE.md 기술 | 실제 운용 | 심각도 |
|------|--------------|----------|--------|
| 에이전트 모델 | "Claude Opus" (L54-58) | Opus 4.6 | 낮음 (명칭 미갱신) |
| 운용 환경 | "맥미니" (L126) | "M1" (실제 사용 약칭) | 낮음 |
| Cursor 참조 | 없음 (이미 제거됨) | CLI 전환 완료 | — (해소됨) |
| 배포 체계 | "wrangler pages deploy" (L298) | 자동빌드 OFF + 수동 배포 (2/20 변경) | **중간** (TECH_SPEC_20260220에만 반영) |

### 5-2. 구식 문서 12개 — 정리 대상

| 문서 | 작성일 | 이유 |
|------|--------|------|
| CLAUDE_CODE_COLLABORATION_STRATEGY.md | 1/23 | Cursor 시대 문서 |
| CLAUDE_CODE_FEATURES.md | 1/24 | Cursor 시대 문서 |
| CLAUDE_CODE_SETUP_GUIDE.md | 1/24 | Cursor 시대 문서 |
| DEPLOYMENT_GUIDE.md | 2/9 | TECH_SPEC에 갱신됨 |
| GPU_VM_SETUP_L4.md | 1月 | VM 구시대 |
| VERTEX_VM_SETUP_GUIDE.md | 1月 | VM 구시대 |
| VERTEX_CREDIT_STRATEGY.md | 1月 | 구 전략 |
| DUAL_AI_DEPLOYMENT_STRATEGY.md | 1月 | 구 전략 |
| ROADMAP_GCP_ENGINE.md | 1月 | 구 로드맵 |
| OPUS_EXECUTION_PLAN.md | 1月 | 일회성 |
| SCRIPTS_CLEANUP_GUIDE.md | 1月 | 일회성 |
| HOME_RESTART_GUIDE.md | 1月 | 일회성 |

### 5-3. 3중 중복 정보

**에이전트 체계** 가 3곳에 존재:
1. CLAUDE.md L48-172 (~125줄)
2. 3TRACK_SYSTEM_ARCHITECTURE.md L77-121 (~45줄)
3. VSCODE_WORKSPACE_STANDARD.md L58-96 (~39줄)

→ 3계층 분리 시 정본을 CLAUDE.md(헌법: 표만) + OPERATION_RULES.md(법률: 상세)로 통일하고, 나머지는 참조만.

---

*작성: M1/막내2*
*Phase 1~4 전수 조사 + 설계안 완료*
