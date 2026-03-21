---
type: REPORT
date: 2026-03-14
time: "17:08 KST"
from: iMac/막내1
to: iMac/쌍아
order: ORDER_20260314_iMac쌍아_막내1_docs정리_인프라기술문서.md
status: completed
---

# 보고서: docs/ 정리 리서치 — 인프라·기술문서

> **[2026-03-14 17:08 KST] iMac/막내1 → iMac/쌍아**
> 리서치 전용. 실제 이동/삭제 미수행 (법률 ch7 3조 준수).

---

## 1. 총괄 요약

| 영역 | 총 파일 수 | 활성 | 레거시 | 사문화 | 중복 |
|------|-----------|------|--------|--------|------|
| `docs/infrastructure/` | 78건 | 43건 (55%) | 22건 (28%) | 8건 (10%) | 2건 (3%) |
| `docs/monkos/` | 193건 | 0건 | 191건 (99%) | 2건 (1%) | 0건 |
| **합계** | **271건** | **43건** | **213건** | **10건** | **2건** |

**핵심 발견:**
- `docs/infrastructure/`: 활성 파일이 과반(55%). CLAUDE.md 참조 5건 전부 현위치 유지 필수.
- `docs/monkos/`: ch4 4조에 의해 **아카이브 동결** 상태. 사실상 전량 레거시. monkos-ops/와 시간적으로 분리(02월 원본 vs 03월 이후 신규)되어 중복 0건.

---

## 2. CLAUDE.md 규정 참조 파일 현황 (최우선)

| # | 규정명 | 파일 경로 | 분류 | 조치 | 비고 |
|---|--------|-----------|------|------|------|
| 1 | 조항 코드표 | `docs/infrastructure/audit/MONK_ARTICLES_DRAFT_v1.md` | **활성** | 현위치 유지 | v1은 11조 기준. 현행 7조 체계와 불일치 → v2 갱신 권고 |
| 2 | 코딩 표준 | `docs/infrastructure/guides/CODING_STANDARDS.md` | **활성** | 현위치 유지 | 정상 |
| 3 | 디자인 시스템 | `docs/infrastructure/guides/DESIGN_SYSTEM.md` | **활성** | 현위치 유지 | v4 라이트 테마 도입으로 다크 테마 기준 동기화 필요 |
| 4 | GCS 구조 | `docs/infrastructure/deployment/GCS_BUCKET_STRUCTURE.md` | **활성** | 현위치 유지 | 정상 |
| 5 | 에셋 레지스트리 | `docs/infrastructure/ASSET_REGISTRY.md` | **활성** | 현위치 유지 | ch4 6조 6항에서 직접 참조 |

---

## 3. docs/infrastructure/ 상세 분류 (78건)

### 3-1. 루트 파일 (4건)

| 파일 | 분류 | 근거 | 처리 제안 |
|------|------|------|----------|
| `ASSET_REGISTRY.md` | **활성** | ch4 6조 6항 직접 참조. 전 저장소 통합 인덱스 | 현위치 유지 (필수) |
| `FILE_TYPE_REGISTRY.md` | **활성** | ch4 3조 파일 유형 패턴 정의 테이블 | 현위치 유지 |
| `README.md` | **활성** | 폴더 인덱스 | 현위치 유지 (파일 수 갱신 필요) |
| `EXAM_READINESS_MAP.md` | **레거시** | 3월초 심사 대응 매핑표. 시점 경과 | `docs/archives/` 이관 |

### 3-2. ai-models/ (13건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `AI_MODELS_DIGEST.md` | **활성** | 현위치 유지 |
| `BWYA_ACADEMY_INDEX.md` | **활성** | 현위치 유지 |
| `BWYA_SCHEMA_DESIGN.md` | **활성** | 현위치 유지 |
| `bwya_prompt_seed.sql` | **활성** | 현위치 유지 |
| `COACHING_MODEL_UPGRADE_SPEC.md` | **활성** | 현위치 유지 |
| `KBEAUTY_DATA_SCHEMA.md` | **활성** | 현위치 유지 |
| `LOOKBOOK_BACKGROUND_STRATEGY.md` | **활성** | 현위치 유지 |
| `QC_CONSULTANT_ARCHITECTURE.md` | **활성** | 현위치 유지 |
| `README.md` | **활성** | 현위치 유지 |
| `VERTEX_AI_CONNECTION_GUIDE.md` | **레거시** | 현위치 유지 (DIGEST에 통합되었으나 원본 가치) |
| `VERTEX_CREDIT_STRATEGY.md` | **레거시** | `docs/archives/` 이관 (크레딧 만료) |
| `YONGA_CONNECTION_GUIDE.md` | **레거시** | `docs/archives/` 이관 (전환 완료) |
| `YONGA_TEST_SWITCH.md` | **레거시** | `docs/archives/` 이관 (전환 완료) |

### 3-3. architecture/ (11건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `3TRACK_SYSTEM_ARCHITECTURE.md` | **활성** | 현위치 유지 |
| `ARCHITECTURE_DIGEST.md` | **활성** | 현위치 유지 |
| `ARCHITECTURE_FLOWCHART.md` | **활성** | 현위치 유지 |
| `MONKOS_AI_TECHNICAL_SPEC.md` | **활성** | 현위치 유지 |
| `MONK_PHOTO_STUDIO_ARCHITECTURE.md` | **활성** | 현위치 유지 |
| `OPERATIONS_OVERVIEW_20260220.md` | **활성** | 현위치 유지 |
| `PORTAL_V4_TECHNICAL_SPEC.md` | **활성** | 현위치 유지 (최신, 03-14 작성) |
| `README.md` | **활성** | 현위치 유지 |
| `SHARED_CORE_SEPARATION_PLAN.md` | **활성** | 현위치 유지 |
| `TECHNICAL_SPEC_20260220.md` | **활성** | 현위치 유지 |
| `ARCHITECTURE_GUIDE_FROM_YONGA.md` | **레거시** | `docs/archives/` 이관 |

### 3-4. audit/ (7건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `MONK_ARTICLES_DRAFT_v1.md` | **활성** | 현위치 유지 (필수, CLAUDE.md 참조). 7조 체계 동기화 필요 |
| `README.md` | **활성** | 현위치 유지 (이관 후 갱신 필요) |
| `COMMS_PROTOCOL_DRAFT_v1.md` | **레거시** | `docs/archives/` 이관 (ch1에 법률화 완료) |
| `FULL_DOCS_AUDIT_AND_TECH_CATALOG.md` | **레거시** | `docs/archives/` 이관 |
| `LAW_AUDIT_DOCUMENT_ANALYSIS.md` | **레거시** | `docs/archives/` 이관 |
| `LAW_AUDIT_SESSION_CHRONICLE.md` | **레거시** | `docs/archives/` 이관 |
| `MONK_GOVERNANCE_DESIGN_v1.md` | **레거시** | `docs/archives/` 이관 |

### 3-5. constitution/ (1건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `constitution/README.md` | **중복** | 삭제 가능 (governance/constitution/으로 리다이렉트. ch4 4조 패턴이나 유지해도 무해) |

### 3-6. deployment/ (11건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `CF_SERVERLESS_MIGRATION_STRATEGY.md` | **활성** | 현위치 유지 |
| `GCS_BUCKET_STRUCTURE.md` | **활성** | 현위치 유지 (필수, CLAUDE.md 참조) |
| `SECURITY_AUDIT_REPORT.md` | **활성** | 현위치 유지 (조치 완료 여부 점검 필요) |
| `README.md` | **활성** | 현위치 유지 |
| `DEPLOYMENT_GUIDE.md` | **레거시** | `docs/archives/` 이관 |
| `GCP_COST_ANALYSIS.md` | **레거시** | `docs/archives/` 이관 |
| `ROADMAP_GCP_ENGINE.md` | **레거시** | `docs/archives/` 이관 |
| `GCS_BACKUP_SETUP.md` | **사문화** | 삭제 제안 (Workers→Cloud Run 전환으로 무효) |
| `GPU_VM_SETUP_L4.md` | **사문화** | 삭제 제안 (미실행, 크레딧 만료) |
| `HOME_RESTART_GUIDE.md` | **사문화** | 삭제 제안 (완료된 원타임 체크리스트) |
| `VERTEX_VM_SETUP_GUIDE.md` | **사문화** | 삭제 제안 (미실행, 크레딧 만료) |

### 3-7. guides/ (13건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `CODING_STANDARDS.md` | **활성** | 현위치 유지 (필수, CLAUDE.md 참조) |
| `CONTEXT_ARCHITECTURE.md` | **활성** | 현위치 유지 (MEMORY.md 외장 메모리에서도 참조) |
| `DESIGN_SYSTEM.md` | **활성** | 현위치 유지 (필수). v4 라이트 테마 동기화 필요 |
| `VSCODE_WORKSPACE_STANDARD.md` | **활성** | 현위치 유지 |
| `README.md` | **활성** | 현위치 유지 |
| `CLAUDE_CODE_COLLABORATION_STRATEGY.md` | **레거시** | `docs/archives/` 이관 (Cursor 시대) |
| `CLAUDE_CODE_FEATURES.md` | **레거시** | `docs/archives/` 이관 (Cursor 시대) |
| `MONKOS_CHAT_DEPLOYMENT.md` | **레거시** | `docs/archives/` 이관 |
| `OVERNIGHT_AUTOMATION_RULES.md` | **레거시** | `docs/archives/` 이관 |
| `SESSION_LOG_VALUE.md` | **레거시** | `docs/archives/` 이관 (ch3에 체계화) |
| `test_payment_flow.md` | **레거시** | `docs/archives/` 이관 |
| `CLAUDE_CODE_SETUP_GUIDE.md` | **사문화** | 삭제 제안 (Cursor 확장 설정, 완전 구식) |
| `SCRIPTS_CLEANUP_GUIDE.md` | **사문화** | 삭제 제안 (monk_cs 폴더 자체 레거시) |

### 3-8. history/ (4건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `README.md` | **활성** | 현위치 유지 |
| `연구원_이력서_양식.md` | **활성** | 현위치 유지 (인사 문서, monkos-ops/ 이관 검토 가능) |
| `OPUS_EXECUTION_PLAN.md` | **레거시** | `docs/archives/` 이관 |
| `PROJECT_WORK_HISTORY.md` | **레거시** | `docs/archives/` 이관 |

### 3-9. laws/ (1건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `laws/README.md` | **중복** | 현위치 유지 (ch4 4조 정본 테이블이 이 리다이렉트를 명시적 참조) |

### 3-10. reports/ (9건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| 9건 전량 (`REPORT_20260308_*.md`) | **활성** | 현위치 유지 |

> 크레딧 정책 법규, 데이터 보관 법규/기술설계, GCS 감사, 이미지 스키마, KR/JP 법적/UX 분기, 프로젝트 분기 이미지 관리, R2+D1 아키텍처 — 2026-03-08 작성, 전량 현행 참조 문서.

### 3-11. strategy/ (13건)

| 파일 | 분류 | 처리 제안 |
|------|------|----------|
| `COIN_ECONOMY_STRATEGY.md` | **활성** | 현위치 유지 |
| `KEYWORD_LEXICON.md` | **활성** | 현위치 유지 (governance/philosophy/ 이관 검토 가능) |
| `REMOTE_RETOUCH_APP_PROPOSAL.md` | **활성** | 현위치 유지 |
| `STRATEGY_DIGEST.md` | **활성** | 현위치 유지 |
| `README.md` | **활성** | 현위치 유지 |
| `CREDIT_NFT_FEASIBILITY_REPORT.md` | **레거시** | `docs/archives/` 이관 |
| `DUAL_AI_DEPLOYMENT_STRATEGY.md` | **레거시** | `docs/archives/` 이관 |
| `MARKETING_WEEKLY_STRATEGY.md` | **레거시** | `docs/archives/` 이관 |
| `MONK_AI_KIT_PACKAGE.md` | **레거시** | `docs/archives/` 이관 |
| `MONK_ROCKET_STRATEGY.md` | **레거시** | `docs/archives/` 이관 |
| `context_README_legacy.md` | **사문화** | 삭제 제안 (.context/ 시대 잔해) |
| `project_vision_context.md` | **사문화** | 삭제 제안 (빈 placeholder) |
| `yonga_strategy_context.md` | **사문화** | 삭제 제안 (템플릿 수준, 실질 내용 부재) |

---

## 4. docs/monkos/ 상세 분류 (193건)

### 법적 위상

ch4 4조에 의거: `docs/monkos/`는 **아카이브(동결)** — 2026-02 이전 산출물의 보존소. 신규 생성 금지. README에 이미 동결 경고 표기 완료.

### 하위 폴더별 요약

| 하위 폴더 | 파일 수 (README 포함) | 분류 | 처리 |
|-----------|---------------------|------|------|
| 루트 README | 1건 | 레거시 | 유지 (아카이브 인덱스) |
| designs/ | 2건 | 레거시 | 유지 |
| incidents/ | 2건 | 레거시 | 유지 (프로젝트 최초 인시던트. 유일본) |
| specs/ | 5건 | 레거시 | 유지 (2건 특이: 아래 참조) |
| sprints/ | 3건 | 혼합 | `work_queue.md` 삭제 제안 |
| reports/ | 37건 | 레거시 | 전량 유지 (02-22~25 거버넌스 수립기 원본) |
| tasks/ | 143건 | 레거시 | `TASK_TEMPLATE.md` 삭제 제안 |
| **합계** | **193건** | — | — |

### 중복 현황

**0건.** monkos-ops/에 동일 내용으로 이관된 파일이 없다. docs/monkos/(2026-02 원본)와 monkos-ops/(02-25 이후 신규)는 **시간적으로 분리**되어 중복이 발생하지 않는 구조.

### docs/monkos/tasks/ vs 현행 ORDER_ 체계

- TASK_ 134건 (02-16~02-25): **구 체계 지시서**. ORDER_와 1:1 중복 없음.
- ORDER_ 체계는 02-18부터 병행, 03-08 이후 단독 사용.
- TASK_→ORDER_ 전환은 "이관"이 아닌 "체계 교체"이므로 구 파일은 audit trail로서 보존 가치.

### docs/monkos/reports/ vs monkos-ops/ops/reports/

- docs/monkos/reports/2026-02/ (34건): 02-22~02-25 작성 원본
- monkos-ops/ops/reports/2026-02/ : 02-25 이후 작성 파일
- 동일 주제 중복 없음. 시간적 분리.

---

## 5. 삭제 제안 목록

### 확정 사문화 (10건)

**docs/infrastructure/ — 8건:**

| # | 파일 | 사유 |
|---|------|------|
| 1 | `deployment/GCS_BACKUP_SETUP.md` | Workers→Cloud Run 전환으로 구현 경로 변경 |
| 2 | `deployment/GPU_VM_SETUP_L4.md` | 미실행, 크레딧 만료 |
| 3 | `deployment/HOME_RESTART_GUIDE.md` | 완료된 원타임 체크리스트 |
| 4 | `deployment/VERTEX_VM_SETUP_GUIDE.md` | 미실행, 크레딧 만료 |
| 5 | `guides/CLAUDE_CODE_SETUP_GUIDE.md` | Cursor 확장 설정, CLI 전환 완료 |
| 6 | `guides/SCRIPTS_CLEANUP_GUIDE.md` | monk_cs 폴더 자체 레거시 |
| 7 | `strategy/context_README_legacy.md` | .context/ 시대 잔해 |
| 8 | `strategy/project_vision_context.md` | 빈 placeholder, 실질 내용 부재 |

> `strategy/yonga_strategy_context.md`도 사문화이나, 위 8건에 추가하면 9건.

**docs/monkos/ — 2건:**

| # | 파일 | 사유 |
|---|------|------|
| 9 | `sprints/work_queue.md` | 텔레그램 큐 잔해, 현행 ORDER_ 체계로 대체 |
| 10 | `tasks/TASK_TEMPLATE.md` | 구 TASK_ 체계 템플릿, 현행 미사용 |

### 삭제 경계선 (작가님 판단 요청, 2건)

| # | 파일 | 사유 |
|---|------|------|
| 1 | `docs/monkos/specs/TELEGRAM_DEPLOY_GUIDE.md` | 현행 봇 구조와 괴리. 비표준 네이밍 |
| 2 | `docs/monkos/specs/YONGA.md` | 비활성 에이전트. 재활성화 가능성에 따라 판단 |

---

## 6. 레거시 이관 대상 (`docs/archives/` 이관 제안, 22건)

**docs/infrastructure/ 내 22건:**

| # | 현재 경로 | 이관 사유 |
|---|-----------|----------|
| 1 | `EXAM_READINESS_MAP.md` | 시점 경과 |
| 2 | `ai-models/VERTEX_CREDIT_STRATEGY.md` | 크레딧 만료 |
| 3 | `ai-models/YONGA_CONNECTION_GUIDE.md` | 전환 완료 |
| 4 | `ai-models/YONGA_TEST_SWITCH.md` | 전환 완료 |
| 5 | `architecture/ARCHITECTURE_GUIDE_FROM_YONGA.md` | 전환 완료 |
| 6 | `audit/COMMS_PROTOCOL_DRAFT_v1.md` | ch1에 법률화 완료 |
| 7 | `audit/FULL_DOCS_AUDIT_AND_TECH_CATALOG.md` | 현 구조로 재편 완료 |
| 8 | `audit/LAW_AUDIT_DOCUMENT_ANALYSIS.md` | CLAUDE.md 3계층 분리 기초 자료 |
| 9 | `audit/LAW_AUDIT_SESSION_CHRONICLE.md` | 법률 제정 과정 연대기 |
| 10 | `audit/MONK_GOVERNANCE_DESIGN_v1.md` | 거버넌스 설계 v1, 반영 완료 |
| 11 | `deployment/DEPLOYMENT_GUIDE.md` | 초기 배포 방식, wrangler로 전환 |
| 12 | `deployment/GCP_COST_ANALYSIS.md` | 비용 분석, 시점 경과 |
| 13 | `deployment/ROADMAP_GCP_ENGINE.md` | 전환 완료, 바우처 만료 |
| 14 | `guides/CLAUDE_CODE_COLLABORATION_STRATEGY.md` | Cursor 시대 |
| 15 | `guides/CLAUDE_CODE_FEATURES.md` | Cursor 시대 |
| 16 | `guides/MONKOS_CHAT_DEPLOYMENT.md` | 현행 구조와 상이 |
| 17 | `guides/OVERNIGHT_AUTOMATION_RULES.md` | GPU 워크로드 방식 변경 |
| 18 | `guides/SESSION_LOG_VALUE.md` | ch3에 체계화됨 |
| 19 | `guides/test_payment_flow.md` | 결제 체계 전환 예정 |
| 20 | `history/OPUS_EXECUTION_PLAN.md` | 전환 완료 |
| 21 | `history/PROJECT_WORK_HISTORY.md` | 33세션 이력, 시점 경과 |
| 22 | `strategy/CREDIT_NFT_FEASIBILITY_REPORT.md` ~ `MONK_ROCKET_STRATEGY.md` (5건) | 의사결정 완료 또는 시점 경과 |

> docs/monkos/는 전체가 이미 아카이브 동결 상태이므로 별도 이관 불필요.

---

## 7. 실행 시 고려사항

1. **`docs/archives/` 하위 구조**: 현재 `backend-v1/`, `scripts-legacy/`만 존재. infrastructure 레거시 이관 시 `docs/archives/infrastructure-legacy/` 서브디렉토리 신설 권고.

2. **README 갱신**: 파일 이관/삭제 후 해당 폴더 README.md의 파일 수·목록 갱신 필수.

3. **ch4 4조 법적 근거**: `docs/infrastructure/`는 "원천 아카이브(보물창고), 기존 네이밍 유지, 3조 관할 밖". 이동/삭제 시에도 네이밍 규칙(YAML frontmatter 등) 강제 적용 대상이 아님.

4. **동기화 필요 파일 2건**:
   - `audit/MONK_ARTICLES_DRAFT_v1.md`: 11조 기준 → 현행 7조 체계 반영 v2 작성 권고
   - `guides/DESIGN_SYSTEM.md`: 다크 테마 기준 → v4 라이트 테마 반영 필요

5. **삭제 시 헌법 준수**: "옵스 편입 ≠ 원본 삭제. 삭제 지시 없이 삭제 = 헌법 위반" — 삭제는 작가님 명시 승인 후 실행.
