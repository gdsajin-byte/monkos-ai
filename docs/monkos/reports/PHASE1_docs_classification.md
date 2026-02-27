---
type: report
from: M1/쌍아
to: 작가님
date: 2026-02-17 13:17 KST
status: pending_review
tags: [docs, restructure, phase1]
---

# PHASE 1: docs/ 전수 조사 및 분류표

> 총 파일 수: 163개 (md 131개, pdf 32개)

## 1. infrastructure/ → 분산 이동 (48개)

### 1.1 ops/ (운영 규칙) — 10개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | CODING_STANDARDS.md | 2026-01-14 | ops/coding.md | ops | 리네임 |
| infrastructure/ | DEPLOYMENT_GUIDE.md | 2026-01-12 | ops/deploy.md | ops | 리네임 |
| infrastructure/ | DESIGN_SYSTEM.md | 2026-01-14 | ops/design.md | ops | 리네임 |
| infrastructure/ | SECURITY_AUDIT_REPORT.md | 2026-02-13 | ops/security.md | ops | 리네임 |
| infrastructure/ | SESSION_LOG_VALUE.md | 2026-01-14 | ops/sessions.md | ops | 리네임 |
| infrastructure/ | CLAUDE_CODE_COLLABORATION_STRATEGY.md | 2026-01-24 | ops/ | ops | 에이전트 협업 |
| infrastructure/ | CLAUDE_CODE_FEATURES.md | 2026-01-24 | ops/ | ops | 도구 참조 |
| infrastructure/ | CLAUDE_CODE_SETUP_GUIDE.md | 2026-01-24 | ops/ | ops | 설정 가이드 |
| infrastructure/ | VSCODE_WORKSPACE_STANDARD.md | 2026-02-17 | ops/ | ops | 워크스페이스 |
| infrastructure/ | OVERNIGHT_AUTOMATION_RULES.md | 2026-01-26 | ops/ | ops | 야간 자동화 |

### 1.2 project/arch/ (아키텍처) — 7개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | 3TRACK_SYSTEM_ARCHITECTURE.md | 2026-01-24 | project/arch/ | arch | 핵심 아키텍처 |
| infrastructure/ | ARCHITECTURE_FLOWCHART.md | 2026-02-17 | project/arch/ | arch | 플로우차트 |
| infrastructure/ | MONK_PHOTO_STUDIO_ARCHITECTURE.md | 2026-02-17 | project/arch/ | arch | 몽크사진관 |
| infrastructure/ | SHARED_CORE_SEPARATION_PLAN.md | 2026-02-17 | project/arch/ | arch | KR/JP 공유 코어 |
| infrastructure/ | QC_CONSULTANT_ARCHITECTURE.md | 2026-02-15 | project/arch/ | arch | QC 설계 |
| infrastructure/ | COACHING_MODEL_UPGRADE_SPEC.md | 2026-02-14 | project/arch/ | arch | 코칭 모델 |
| infrastructure/ | DUAL_AI_DEPLOYMENT_STRATEGY.md | 2026-01-12 | project/arch/ | arch | 듀얼 AI |

### 1.3 project/infra/ (인프라 설정) — 11개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | GCS_BUCKET_STRUCTURE.md | 2026-01-15 | project/infra/ | infra | GCS 구조 |
| infrastructure/ | GCS_BACKUP_SETUP.md | 2026-01-19 | project/infra/ | infra | 백업 설정 |
| infrastructure/ | GCP_COST_ANALYSIS.md | 2026-02-16 | project/infra/ | infra | 비용 분석 |
| infrastructure/ | GPU_VM_SETUP_L4.md | 2026-01-12 | project/infra/ | infra | GPU 설정 |
| infrastructure/ | VERTEX_AI_CONNECTION_GUIDE.md | 2026-01-13 | project/infra/ | infra | Vertex 연결 |
| infrastructure/ | VERTEX_CREDIT_STRATEGY.md | 2026-01-12 | project/infra/ | infra | 크레딧 전략 |
| infrastructure/ | VERTEX_VM_SETUP_GUIDE.md | 2026-01-12 | project/infra/ | infra | VM 설정 |
| infrastructure/ | ROADMAP_GCP_ENGINE.md | 2026-01-12 | project/infra/ | infra | GCP 로드맵 |
| infrastructure/ | MONKOS_CHAT_DEPLOYMENT.md | 2026-01-30 | project/infra/ | infra | 챗봇 배포 |
| infrastructure/ | test_payment_flow.md | 2026-01-19 | project/infra/ | infra | 결제 테스트 |

### 1.4 philosophy/brand/ (브랜드/K뷰티) — 7개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | BWYA_ACADEMY_INDEX.md | 2026-01-17 | philosophy/brand/ | brand | BWYA 커리큘럼 |
| infrastructure/ | BWYA_SCHEMA_DESIGN.md | 2026-01-13 | philosophy/brand/ | brand | 스키마 |
| infrastructure/ | KEYWORD_LEXICON.md | 2026-02-16 | philosophy/brand/ | brand | 키워드 사전 |
| infrastructure/ | KBEAUTY_DATA_SCHEMA.md | 2026-01-13 | philosophy/brand/ | brand | K뷰티 스키마 |
| infrastructure/ | COIN_ECONOMY_STRATEGY.md | 2026-02-15 | philosophy/brand/ | brand | 코인 이코노미 |
| infrastructure/ | CREDIT_NFT_FEASIBILITY_REPORT.md | 2026-02-13 | philosophy/brand/ | brand | NFT 검토 |
| infrastructure/ | MONK_AI_KIT_PACKAGE.md | 2026-01-13 | philosophy/brand/ | brand | AI 키트 |

### 1.5 philosophy/strategy/ (전략) — 4개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | MARKETING_WEEKLY_STRATEGY.md | 2026-02-14 | philosophy/strategy/ | strategy | 마케팅 |
| infrastructure/ | MONK_ROCKET_STRATEGY.md | 2026-01-12 | philosophy/strategy/ | strategy | 로켓 전략 |
| infrastructure/ | LOOKBOOK_BACKGROUND_STRATEGY.md | 2026-01-13 | philosophy/strategy/ | strategy | 룩북 배경 |
| infrastructure/ | REMOTE_RETOUCH_APP_PROPOSAL.md | 2026-02-13 | philosophy/strategy/ | strategy | 원격 리터칭 |

### 1.6 history/legacy/ (레거시 보존) — 8개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | GO_NOW.md | 2026-01-12 | history/legacy/ | legacy | 보존 |
| infrastructure/ | HOME_RESTART_GUIDE.md | 2026-01-12 | history/legacy/ | legacy | 보존 |
| infrastructure/ | RESUME_SESSION.md | 2026-01-12 | history/legacy/ | legacy | 보존 |
| infrastructure/ | SCRIPTS_CLEANUP_GUIDE.md | 2026-01-12 | history/legacy/ | legacy | 보존 |
| infrastructure/ | OPUS_EXECUTION_PLAN.md | 2026-01-12 | history/legacy/ | legacy | 보존 |
| infrastructure/ | ARCHITECTURE_GUIDE_FROM_YONGA.md | 2026-01-12 | history/legacy/ | legacy | 용아 초기 자문 |
| infrastructure/ | YONGA_CONNECTION_GUIDE.md | 2026-01-12 | history/legacy/ | legacy | 보존 |
| infrastructure/ | YONGA_TEST_SWITCH.md | 2026-01-12 | history/legacy/ | legacy | 보존 |

### 1.7 history/ (히스토리) — 1개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | PROJECT_WORK_HISTORY.md | 2026-02-13 | history/changelog.md | history | 리네임 |

### 1.8 rnd/ — 1개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | 연구원_이력서_양식.md | 2026-01-19 | rnd/ | rnd | — |

---

## 2. corpus/ → 구조 유지 + 일부 이동 (78개)

### 2.1 corpus/sessions/ → history/sessions/ (그대로 이동, 36개)

| 현재 경로 | 파일 수 | 목표 위치 | 분류 | 비고 |
|-----------|---------|-----------|------|------|
| corpus/sessions/2026-01/ | 24개 | history/sessions/2026-01/ | history | 폴더 통째로 |
| corpus/sessions/2026-02/ | 12개 | history/sessions/2026-02/ | history | 폴더 통째로 |

### 2.2 corpus/legacy/ → history/legacy/ (그대로 이동, 21개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| corpus/legacy/ | _START_HERE.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | 20260108_CONTEXT_RECOVERY_REPORT.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | 20260108_RECOVERED_CONTEXT.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | 20260111_REBOOT_BACKUP.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | 20260112_FINAL_DECISION.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | 20260207_cursorrules.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | ARCHIVE_INVENTORY.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | CURRENT_STATUS.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | CURSOR_AI_COLLABORATION_GUIDE.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | CURSOR_BACKUP_STRATEGY.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | FINAL_STRATEGY_GPU.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | INDEX.md | 2026-02-15 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | MONK_MASTER_CONTEXT_SUMMARY.md | 2026-02-15 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | PROJECT_COMPLETION_REPORT.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | README_SOUL_SYNC.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | REVIEW_SSANGA_RESPONSE.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | RND_SOUL_SYNC_DESIGN_JOURNEY.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | SOUL_ARCHITECTURE.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | SOUL_SYNC_QUICKSTART.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/ | SYNC_STRATEGY.md | 2026-02-08 | history/legacy/ | legacy | 보존 |
| corpus/legacy/backup_markdown/ | 1개 | history/legacy/backup_markdown/ | legacy | 폴더 유지 |

### 2.3 corpus/gemini/ → philosophy/gemini/ (이동, 7개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| corpus/gemini/ | GEMINI_DAILY_SUMMARY_202601.md | 2026-01-19 | philosophy/gemini/ | philosophy | 용아 대화 |
| corpus/gemini/ | GEMINI_DAILY_SUMMARY_TOTAL.md | 2026-01-19 | philosophy/gemini/ | philosophy | — |
| corpus/gemini/ | GEMINI_INSIGHTS_202601.md | 2026-01-19 | philosophy/gemini/ | philosophy | — |
| corpus/gemini/ | GEMINI_INSIGHTS_LEGACY.md | 2026-01-19 | philosophy/gemini/ | philosophy | — |
| corpus/gemini/ | GEMINI_INSIGHTS_TOTAL.md | 2026-01-19 | philosophy/gemini/ | philosophy | — |
| corpus/gemini/ | GEMINI_SESSION_202601.md | 2026-01-19 | philosophy/gemini/ | philosophy | — |
| corpus/gemini/ | GEMINI_SUMMARY_LEGACY.md | 2026-01-19 | philosophy/gemini/ | philosophy | — |

### 2.4 corpus/claude_sessions/strategy/ → philosophy/strategy/ (통합, 10개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| claude_sessions/strategy/ | 20250208_monkos_id_photo_global_strategy.md | 2026-02-08 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | 20250211_MONKOS_SNS_자동화_방안.md | 2026-02-12 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | 20250211_MONKOS_글로벌_홍보전략_보고서.md | 2026-02-12 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | 20260208_MONKOS_daily_briefing.md | 2026-02-08 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | 20260208_MONKOS_일본진출_실행전략_Part2.md | 2026-02-09 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | 20260209_monkos_japan_idphoto_strategy.md | 2026-02-09 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | monkos_competitor_analysis_ai_photo.md | 2026-02-08 | philosophy/strategy/ | strategy | 경쟁사 분석 |
| claude_sessions/strategy/ | monkos_id_photo_gemini_live_guide.md | 2026-02-08 | philosophy/strategy/ | strategy | Gemini Live |
| claude_sessions/strategy/ | MONKOS_iPhone_Device_Strategy.md | 2026-02-07 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | MONKOS_PRESENTATION_ASSISTANT_SPEC.md | 2026-02-08 | philosophy/strategy/ | strategy | — |
| claude_sessions/strategy/ | monkos-gpu-infrastructure-strategy.md | 2026-02-07 | philosophy/strategy/ | strategy | — |

### 2.5 corpus/claude_sessions/marketing/ → philosophy/strategy/ (통합, 5개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| claude_sessions/marketing/ | 20260212_KR_JP_마케팅_채널전략.md | 2026-02-12 | philosophy/strategy/ | strategy | — |
| claude_sessions/marketing/ | 20260212_MINA_에이전시_AI모델_로드맵.md | 2026-02-12 | philosophy/strategy/ | strategy | 민아 에이전시 |
| claude_sessions/marketing/ | 20260212_SNS_실행방안.md | 2026-02-12 | philosophy/strategy/ | strategy | SNS |
| claude_sessions/marketing/ | 20260212_경쟁사_벤치마크.md | 2026-02-12 | philosophy/strategy/ | strategy | — |
| claude_sessions/marketing/ | 20260212_구글_SEO_최적화_보고.md | 2026-02-12 | philosophy/strategy/ | strategy | SEO |

### 2.6 corpus/claude_sessions/certifications/ → rnd/certifications/ (30개, PDF 29 + MD 1)

| 현재 경로 | 파일 수 | 목표 위치 | 분류 | 비고 |
|-----------|---------|-----------|------|------|
| claude_sessions/certifications/ | 29 PDF | rnd/certifications/ | rnd | GCP 자격증 자료 |
| claude_sessions/certifications/ | 1 MD | rnd/certifications/ | rnd | Vertex 인증 가이드 |

### 2.7 corpus/claude_sessions/templates/ → project/arch/ (1개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| claude_sessions/templates/ | monkos-live-present-architecture.md | 2026-02-07 | project/arch/ | arch | 아키텍처 템플릿 |

### 2.8 corpus/claude_sessions/Chulchang/ → history/legacy/ (1개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| claude_sessions/Chulchang/ | 20250213_session_plan_review.md | 2026-02-13 | history/legacy/ | legacy | 철창이 세션 |

### 2.9 corpus/claude_sessions/KOITA_* → rnd/ (3개 PDF)

| 현재 경로 | 파일명 | 목표 위치 | 분류 | 비고 |
|-----------|--------|-----------|------|------|
| claude_sessions/KOITA_2026Q1_PDF_아카이브/ | 3개 PDF | rnd/ | rnd | 중복 검토 필요 |

### 2.10 corpus/factory/ → ops/ (2개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| corpus/factory/ | README.md | 2026-01-24 | ops/ | ops | 팩토리 운영 |
| corpus/factory/ | telegram_ai_communication_strategy.md | 2026-01-30 | ops/ | ops | 텔레그램 통신 |

### 2.11 corpus/notebookLM/ → history/legacy/ (2개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| corpus/notebookLM/ | 20260119_notebooklm_chat.md | 2026-01-19 | history/legacy/ | legacy | 보존 |
| corpus/notebookLM/ | ONBOARDING_GUIDE.md | 2026-01-19 | history/legacy/ | legacy | 보존 |

### 2.12 corpus/README.md → 삭제 후 재생성

| 현재 경로 | 파일명 | 목표 위치 | 분류 | 비고 |
|-----------|--------|-----------|------|------|
| corpus/ | README.md | (삭제) | — | 구조 변경 후 불필요 |

---

## 3. monkos/ → project/tasks/ + history/incidents/ (12개)

### 3.1 project/tasks/ — 9개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| monkos/ | SPRINT_D1D3_20260217.md | 2026-02-16 | project/tasks/ | tasks | 스프린트 |
| monkos/ | TASK_20260216_download_ux.md | 2026-02-16 | project/tasks/ | tasks | 지시서 |
| monkos/ | TASK_20260216_ux_bugfix.md | 2026-02-16 | project/tasks/ | tasks | 지시서 |
| monkos/ | TASK_20260217_camera_crash.md | — | project/tasks/ | tasks | 지시서 |
| monkos/ | TASK_20260217_codebase_audit.md | 2026-02-17 | project/tasks/ | tasks | 지시서 |
| monkos/ | TASK_20260217_docs_restructure.md | 2026-02-17 | project/tasks/ | tasks | 지시서 (본 문서) |
| monkos/ | TASK_20260217_file_split.md | 2026-02-16 | project/tasks/ | tasks | 지시서 |
| monkos/ | TASK_20260217_sharp_removal.md | — | project/tasks/ | tasks | 지시서 |
| monkos/ | work_queue.md | 2026-01-30 | project/tasks/ | tasks | 작업 큐 |

### 3.2 history/incidents/ — 1개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| monkos/ | INCIDENT_20260216_deployment.md | 2026-02-16 | history/incidents/ | history | 장애 기록 |

### 3.3 ops/ — 1개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| monkos/ | TELEGRAM_DEPLOY_GUIDE.md | 2026-01-30 | ops/ | ops | 배포 가이드 |

### 3.4 philosophy/brand/ — 1개

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| monkos/ | 20260129_MONKOS_APP_MISSION.md | 2026-02-08 | philosophy/brand/ | brand | 앱 미션 |

---

## 4. rnd_2026/ → rnd/ (그대로 이동, 25개)

### 4.1 rnd/ (MD 15개 + PDF 10개)

| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| rnd_2026/ | KOITA_RND_활동보고서_10p.md | 2026-02-17 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_RND_활동보고서_10p.pdf | 2026-02-17 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_RND_활동보고서_20p.md | 2026-02-17 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_RND_활동보고서_20p.pdf | 2026-02-17 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_RND_활동증빙_상세본.pdf | 2026-02-12 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_별첨_5종.md | 2026-02-12 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_연구활동보고서_2026Q1.md | 2026-02-12 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_연구활동보고서_요약본_50p.md | 2026-02-12 | rnd/ | rnd | — |
| rnd_2026/ | KOITA_연구활동보고서_요약본.pdf | 2026-02-12 | rnd/ | rnd | — |
| rnd_2026/ | 20260212_RND_활동증빙_현장조사용.md | 2026-02-12 | rnd/ | rnd | — |
| rnd_2026/ | 20260213_디딤돌_서면평가결과_분석.md | 2026-02-13 | rnd/ | rnd | — |
| rnd_2026/ | 20260213_이의신청_절차_및_처리방법.md | 2026-02-13 | rnd/ | rnd | — |
| rnd_2026/ | 20260215_YONGA_RND_REBUTTAL_PROPOSAL.md | 2026-02-15 | rnd/ | rnd | — |
| rnd_2026/ | DIDIMOL_RND_TEMPLATE.md | 2026-02-07 | rnd/ | rnd | — |
| rnd_2026/ | MONKOS_RND_DEVELOPMENT_REPORT.md | 2026-02-07 | rnd/ | rnd | — |
| rnd_2026/ | SDXL_MODEL_COMPARISON_4060.md | 2026-02-08 | rnd/ | rnd | — |
| rnd_2026/ | 기술개발목표_초안.md | 2026-02-07 | rnd/ | rnd | — |
| rnd_2026/ | 연구개발방법_초안.md | 2026-02-07 | rnd/ | rnd | — |
| rnd_2026/ | 용아_파이프라인_요청.md | 2026-02-07 | rnd/ | rnd | — |

### 4.2 rnd/didimol/ (PDF 폴더 — 12개)

| 현재 경로 | 목표 위치 | 분류 | 비고 |
|-----------|-----------|------|------|
| rnd_2026/PDF변환 디딤돌 R&D/ | rnd/didimol/ | rnd | 폴더명 변경 (공백/한글 제거) |

---

## 5. 중복 파일 식별

### 5.1 corpus/claude_sessions/KOITA_* ↔ rnd_2026/

| 파일 A | 파일 B | 판정 |
|--------|--------|------|
| corpus/.../KOITA_별첨_5종.pdf | rnd_2026/... (없음) | 고유 → rnd/ 이동 |
| corpus/.../KOITA_연구활동보고서_요약본_50p.pdf | rnd_2026/KOITA_연구활동보고서_요약본.pdf | 중복 확인 필요 |
| corpus/.../20260212_RND_활동증빙_현장조사용.pdf | rnd_2026/KOITA_RND_활동증빙_상세본.pdf | 중복 확인 필요 |

**→ PHASE 2에서 md5sum 비교 후 원본만 이동, 복본 삭제**

---

## 6. 요약 통계

| 목표 디렉토리 | 파일 수 | 비고 |
|---------------|---------|------|
| ops/ | 14 | 운영 규칙 |
| history/sessions/ | 36 | 세션 로그 |
| history/legacy/ | 33 | 레거시 보존 |
| history/incidents/ | 1 | 장애 기록 |
| history/changelog.md | 1 | 프로젝트 이력 |
| project/arch/ | 8 | 아키텍처 |
| project/infra/ | 11 | 인프라 설정 |
| project/tasks/ | 9 | 지시서/스프린트 |
| philosophy/brand/ | 9 | 브랜드/K뷰티 |
| philosophy/strategy/ | 20 | 전략/마케팅 |
| philosophy/gemini/ | 7 | 용아 대화 |
| rnd/ | 58 | R&D + 자격증 |
| **합계** | **207** | (일부 폴더 이동으로 증가) |

---

## 7. PHASE 2 사전 준비 사항

1. **중복 파일 확인**: KOITA PDF 3건 md5sum 비교
2. **폴더명 정규화**: `PDF변환 디딤돌 R&D/` → `didimol/`
3. **빈 폴더 정리**: corpus/ 하위 폴더들 이동 후 삭제

---

**PHASE 1 완료. 검토 요청드립니다.**
