---
type: order
id: ORDER_20260314_iMac쌍아_막내_docs실행_infrastructure분산이관
date: "2026-03-14 18:50 KST"
status: completed
from: iMac/쌍아
to: 막내
priority: P2
---

# 지시: docs/infrastructure/ 분산 이관

## 배경

docs/infrastructure/ 84건 분석 완료 (막내1 정밀 보고 REPORT_20260314). docs/는 아카이브 위상이나, infrastructure/ 내 문서 대부분은 **활성 참조 문서**. 작가님 결정: "활성문서는 새 편제에 안착시켜라."

## 작업 1: 사문화 9건 삭제

`git rm`으로 삭제:

| # | 경로 | 사유 |
|---|------|------|
| 1 | `deployment/GCS_BACKUP_SETUP.md` | 미완성 + 폐기 인프라 |
| 2 | `deployment/GPU_VM_SETUP_L4.md` | 미실행 구상 |
| 3 | `deployment/HOME_RESTART_GUIDE.md` | 1회성 즉석 메모 |
| 4 | `deployment/VERTEX_VM_SETUP_GUIDE.md` | 미실행 + 비밀번호 평문 노출 |
| 5 | `guides/CLAUDE_CODE_SETUP_GUIDE.md` | 구버전/구환경 |
| 6 | `guides/SCRIPTS_CLEANUP_GUIDE.md` | 대상 디렉토리 소멸 |
| 7 | `strategy/context_README_legacy.md` | legacy 명시 |
| 8 | `strategy/project_vision_context.md` | 빈 placeholder + 내부명칭 노출 |
| 9 | `strategy/yonga_strategy_context.md` | 빈 템플릿 + 내부명칭 노출 |

## 작업 2: 활성 파일 분산 이관

모든 이동은 `git mv` 사용 (히스토리 보존). 목적지 폴더 없으면 `mkdir -p`로 생성.

### 2-1. governance/audit/ ← audit/ (6건)

| 파일 | 목적지 |
|------|--------|
| `COMMS_PROTOCOL_DRAFT_v1.md` | `governance/audit/` |
| `FULL_DOCS_AUDIT_AND_TECH_CATALOG.md` | `governance/audit/` |
| `LAW_AUDIT_DOCUMENT_ANALYSIS.md` | `governance/audit/` |
| `LAW_AUDIT_SESSION_CHRONICLE.md` | `governance/audit/` |
| `MONK_ARTICLES_DRAFT_v1.md` | `governance/audit/` |
| `MONK_GOVERNANCE_DESIGN_v1.md` | `governance/audit/` |

> MONK_ARTICLES_DRAFT_v1.md는 CLAUDE.md 규정 참조에서 인용 중 → 경로 갱신 필수

### 2-2. monkos-ops/tech/architecture/ ← architecture/ (9건)

| 파일 | 목적지 |
|------|--------|
| `3TRACK_SYSTEM_ARCHITECTURE.md` | `monkos-ops/tech/architecture/` |
| `ARCHITECTURE_DIGEST.md` | `monkos-ops/tech/architecture/` |
| `ARCHITECTURE_FLOWCHART.md` | `monkos-ops/tech/architecture/` |
| `ARCHITECTURE_GUIDE_FROM_YONGA.md` | `monkos-ops/tech/architecture/` |
| `MONKOS_AI_TECHNICAL_SPEC.md` | `monkos-ops/tech/architecture/` |
| `MONK_PHOTO_STUDIO_ARCHITECTURE.md` | `monkos-ops/tech/architecture/` |
| `OPERATIONS_OVERVIEW_20260220.md` | `monkos-ops/tech/architecture/` |
| `PORTAL_V4_TECHNICAL_SPEC.md` | `monkos-ops/tech/architecture/` |
| `SHARED_CORE_SEPARATION_PLAN.md` | `monkos-ops/tech/architecture/` |
| `TECHNICAL_SPEC_20260220.md` | `monkos-ops/tech/architecture/` |

### 2-3. monkos-ops/tech/ai-models/ ← ai-models/ (11건)

| 파일 | 목적지 |
|------|--------|
| `AI_MODELS_DIGEST.md` | `monkos-ops/tech/ai-models/` |
| `BWYA_ACADEMY_INDEX.md` | `monkos-ops/tech/ai-models/` |
| `BWYA_SCHEMA_DESIGN.md` | `monkos-ops/tech/ai-models/` |
| `COACHING_MODEL_UPGRADE_SPEC.md` | `monkos-ops/tech/ai-models/` |
| `KBEAUTY_DATA_SCHEMA.md` | `monkos-ops/tech/ai-models/` |
| `LOOKBOOK_BACKGROUND_STRATEGY.md` | `monkos-ops/tech/ai-models/` |
| `QC_CONSULTANT_ARCHITECTURE.md` | `monkos-ops/tech/ai-models/` |
| `VERTEX_AI_CONNECTION_GUIDE.md` | `monkos-ops/tech/ai-models/` |
| `VERTEX_CREDIT_STRATEGY.md` | `monkos-ops/tech/ai-models/` |
| `YONGA_CONNECTION_GUIDE.md` | `monkos-ops/tech/ai-models/` |
| `YONGA_TEST_SWITCH.md` | `monkos-ops/tech/ai-models/` |

### 2-4. monkos-ops/tech/deployment/ ← deployment/ 활성 (5건)

| 파일 | 목적지 |
|------|--------|
| `CF_SERVERLESS_MIGRATION_STRATEGY.md` | `monkos-ops/tech/deployment/` |
| `DEPLOYMENT_GUIDE.md` | `monkos-ops/tech/deployment/` |
| `GCP_COST_ANALYSIS.md` | `monkos-ops/tech/deployment/` |
| `GCS_BUCKET_STRUCTURE.md` | `monkos-ops/tech/deployment/` |
| `ROADMAP_GCP_ENGINE.md` | `monkos-ops/tech/deployment/` |
| `SECURITY_AUDIT_REPORT.md` | `monkos-ops/tech/deployment/` |

> GCS_BUCKET_STRUCTURE.md는 CLAUDE.md 규정 참조에서 인용 중 → 경로 갱신 필수

### 2-5. monkos-ops/tech/guides/ ← guides/ 활성 (8건)

| 파일 | 목적지 |
|------|--------|
| `CLAUDE_CODE_COLLABORATION_STRATEGY.md` | `monkos-ops/tech/guides/` |
| `CLAUDE_CODE_FEATURES.md` | `monkos-ops/tech/guides/` |
| `CODING_STANDARDS.md` | `monkos-ops/tech/guides/` |
| `CONTEXT_ARCHITECTURE.md` | `monkos-ops/tech/guides/` |
| `DESIGN_SYSTEM.md` | `monkos-ops/tech/guides/` |
| `MONKOS_CHAT_DEPLOYMENT.md` | `monkos-ops/tech/guides/` |
| `OVERNIGHT_AUTOMATION_RULES.md` | `monkos-ops/tech/guides/` |
| `SESSION_LOG_VALUE.md` | `monkos-ops/tech/guides/` |
| `VSCODE_WORKSPACE_STANDARD.md` | `monkos-ops/tech/guides/` |
| `test_payment_flow.md` | `monkos-ops/tech/guides/` |

> CODING_STANDARDS, DESIGN_SYSTEM, CONTEXT_ARCHITECTURE는 CLAUDE.md/MEMORY.md에서 인용 중 → 경로 갱신 필수

### 2-6. monkos-ops/ops/reports/2026-03/ ← reports/ (9건)

| 파일 | 목적지 |
|------|--------|
| `REPORT_20260308_CREDIT_POLICY_LEGAL.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_DATA_RETENTION_LEGAL_TERMS.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_DATA_RETENTION_TECHNICAL_DESIGN.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_GCS_AUDIT_HOSTING_STRATEGY.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_IMAGE_SCHEMA_OPTIMIZATION.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_KRJP_LEGAL_POLICY_DIVERGENCE.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_KRJP_UX_CHATBOT_DIVERGENCE.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_PROJECT_SPLIT_IMAGE_MANAGEMENT.md` | `monkos-ops/ops/reports/2026-03/` |
| `REPORT_20260308_R2_D1_ASSET_ARCHITECTURE.md` | `monkos-ops/ops/reports/2026-03/` |

### 2-7. monkos-ops/marketing/strategy/ ← strategy/ 활성 (7건)

| 파일 | 목적지 |
|------|--------|
| `COIN_ECONOMY_STRATEGY.md` | `monkos-ops/marketing/strategy/` |
| `CREDIT_NFT_FEASIBILITY_REPORT.md` | `monkos-ops/marketing/strategy/` |
| `DUAL_AI_DEPLOYMENT_STRATEGY.md` | `monkos-ops/marketing/strategy/` |
| `KEYWORD_LEXICON.md` | `monkos-ops/marketing/strategy/` |
| `MARKETING_WEEKLY_STRATEGY.md` | `monkos-ops/marketing/strategy/` |
| `MONK_AI_KIT_PACKAGE.md` | `monkos-ops/marketing/strategy/` |
| `MONK_ROCKET_STRATEGY.md` | `monkos-ops/marketing/strategy/` |
| `REMOTE_RETOUCH_APP_PROPOSAL.md` | `monkos-ops/marketing/strategy/` |
| `STRATEGY_DIGEST.md` | `monkos-ops/marketing/strategy/` |

### 2-8. docs/archives/history/ ← history/ (3건)

| 파일 | 목적지 |
|------|--------|
| `OPUS_EXECUTION_PLAN.md` | `docs/archives/history/` |
| `PROJECT_WORK_HISTORY.md` | `docs/archives/history/` |
| `연구원_이력서_양식.md` | `docs/archives/history/` |

### 2-9. 루트 파일 (3건)

| 파일 | 목적지 | 사유 |
|------|--------|------|
| `ASSET_REGISTRY.md` | `monkos-ops/tech/` | 기술 자산 레지스트리 |
| `EXAM_READINESS_MAP.md` | `monkos-ops/tech/` | 기술 점검 문서 |
| `FILE_TYPE_REGISTRY.md` | `governance/` | 파일 유형 규정 |

## 작업 3: README 처리

- 각 하위 폴더의 README.md → 이관 목적지에 동반 이동
- `docs/infrastructure/constitution/README.md`, `docs/infrastructure/laws/README.md` → governance/ 정본과 중복 확인 후 삭제
- `docs/infrastructure/README.md` (루트) → 삭제 (폴더 소멸)

## 작업 4: CLAUDE.md 경로 갱신

규정 참조 테이블의 경로를 새 위치로 수정:

| 현재 경로 | 새 경로 |
|----------|---------|
| `docs/infrastructure/audit/MONK_ARTICLES_DRAFT_v1.md` | `governance/audit/MONK_ARTICLES_DRAFT_v1.md` |
| `docs/infrastructure/guides/CODING_STANDARDS.md` | `monkos-ops/tech/guides/CODING_STANDARDS.md` |
| `docs/infrastructure/guides/DESIGN_SYSTEM.md` | `monkos-ops/tech/guides/DESIGN_SYSTEM.md` |
| `docs/infrastructure/deployment/GCS_BUCKET_STRUCTURE.md` | `monkos-ops/tech/deployment/GCS_BUCKET_STRUCTURE.md` |

## 작업 5: MEMORY.md 경로 갱신

외장 메모리 섹션:

| 현재 경로 | 새 경로 |
|----------|---------|
| `docs/infrastructure/guides/CONTEXT_ARCHITECTURE.md` | `monkos-ops/tech/guides/CONTEXT_ARCHITECTURE.md` |

## 작업 6: docs/infrastructure/ 폴더 소멸 확인

모든 파일 이동/삭제 후 `docs/infrastructure/` 폴더가 비어 있는지 확인. 비어 있으면 폴더 자동 소멸 (git은 빈 디렉토리 미추적).

## 작업 7: 커밋

단일 커밋:
```
[docs] infrastructure/ 분산 이관 — 사문화 9건 삭제 + 활성 75건 편제 안착
```

커밋 후 push.

## 산출물

완료 보고: `monkos-ops/ops/reports/COMPLETION_20260314_막내_{HHMMSS}.md`

내용:
- 이관 건수 (목적지별)
- 삭제 건수
- CLAUDE.md/MEMORY.md 경로 갱신 확인
- docs/infrastructure/ 소멸 확인
- 충돌 발생 시 처리 내역

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 헌법 제4조: 내부 명칭 노출 파일 삭제 (사문화 8,9번)
- 헌법 제8조: git mv 사용 (git rm -rf 금지), 활성 파일 보호
- 법률 ch7 3조: 충돌 시 기존 활성 파일 보호 (새 목적지의 동명 파일 우선)
