# 프로젝트 전체 문서 전수 감사 + 기술 카탈로그 + 재설계안

[2026-02-20 09:00 KST] M1/막내1

---

## 조사 요약

- **조사 대상**: 프로젝트 전체 `.md` 파일 (node_modules 제외)
- **총 파일**: 246개 (총 ~55,000줄)
- **적정 위치**: 190개 (77%)
- **misplaced**: 56개 (23%)
- **6분류 분포**: 법 68 / 비즈니스 38 / 지식 33 / 테크 41 / 히스토리 60 / 철학 4 / (분류불요 2)

---

## Phase 1: 전수 조사 결과표

### 1-1. 루트 레벨 (2파일)

| 파일 | 줄수 | 분류 | 위치 |
|------|------|------|:----:|
| `CLAUDE.md` | 372 | 법 | O |
| `README.md` | ~30 | 지식 | O |

### 1-2. apps/ (13파일)

| 파일 | 줄수 | 분류 | 위치 | 사유 |
|------|------|------|:----:|------|
| `monk_imagen4/ARCHITECTURE.md` | 139 | 테크 | X | 레거시 — React/TS 시대 |
| `monk_imagen4/BENCHMARK.md` | 230 | 테크 | X | 레거시 |
| `monk_imagen4/CLOUDFLARE_RESOURCES.md` | 312 | 지식 | X | 레거시 |
| `monk_imagen4/CLOUDFLARE_SETUP.md` | 84 | 법 | X | 레거시 |
| `monk_imagen4/DEPLOYMENT_GUIDE.md` | 121 | 법 | X | 레거시 |
| `monk_imagen4/PLUGIN_GUIDE.md` | 553 | 지식 | X | 레거시 |
| `monk_imagen4/WORKFLOW_ARCHITECTURE.md` | 340 | 테크 | X | 레거시 |
| `monk_imagen4/README.md` | 85 | 지식 | X | 레거시 |
| `monk_imagen4/backend/README.md` | 308 | 지식 | X | 레거시 |
| `monk-cam/README.md` | 87 | 지식 | O | |
| `monk-cam/TECHNICAL_SPEC.md` | 366 | 테크 | O | |
| `photolab-monkkr-mpa-0219/PAGE_SPLIT_ANALYSIS.md` | 463 | 테크 | X | 중복 생성 |
| `photolab-monkkr-mpa-0219/TECH_SPEC_MPA.md` | 135 | 테크 | X | 중복 생성 |

### 1-3. backend/ (1파일)

| 파일 | 줄수 | 분류 | 위치 | 사유 |
|------|------|------|:----:|------|
| `README.md` | 95 | 지식 | X | 레거시 — asia-northeast3 기준, 현재 us-central1 |

### 1-4. commands/ (16파일)

| 파일 | 줄수 | 분류 | 위치 |
|------|------|------|:----:|
| `README.md` | 43 | 법 | O |
| 지시서 15파일 (2/18~2/19) | 65~351 | 법 | O |

> 전부 적정 위치. 단 완료 지시서의 `archive/` 미이동 문제 있음.

### 1-5. docs/corpus/ (53파일, sessions/ 제외)

| 디렉토리 | 파일수 | 분류 분포 | misplaced |
|----------|--------|-----------|:---------:|
| `README.md` | 1 | 법 | 0 |
| `claude_sessions/certifications/` | 1 | 지식 | 0 |
| `claude_sessions/Chulchang/` | 1 | 비즈니스 | 0 |
| `claude_sessions/marketing/` | 5 | 비즈니스 5 | 0 |
| `claude_sessions/strategy/` | 10 | 비즈니스 7, 테크 3 | **5** |
| `claude_sessions/templates/` | 1 | 테크 | **1** |
| `factory/` | 2 | 법 1, 테크 1 | **1** |
| `gemini/` | 7 | 히스토리 5, 지식 2 | 0 |
| `legacy/` | 18 | 히스토리 8, 법 5, 테크 7 | 0 |
| `notebookLM/` | 2 | 지식 1, 히스토리 1 | 0 |

**misplaced 7건**:
- `strategy/` 5건: daily briefing → sessions, 구현 스펙 → infra, 증명사진 규격 → infra, SNS 자동화 → marketing, 글로벌 홍보 → marketing
- `templates/` 1건: 설계서인데 "template" 폴더에 (에이전트 혼선)
- `factory/` 1건: 텔레그램 통신 전략이 공장 로그 폴더에 (긴급 작업)

### 1-6. docs/corpus/sessions/ (38파일)

| 디렉토리 | 파일수 | 분류 | misplaced |
|----------|--------|------|:---------:|
| `2026-01/` | 24 | 히스토리 | 0 |
| `2026-02/` | 14 | 히스토리 | 0 |

> 전부 적정 위치. 세션 로그 규칙 준수.

### 1-7. docs/infrastructure/ (55파일) — **최대 문제 지점**

| 분류 | 파일수 | 적정 | misplaced |
|------|--------|:----:|:---------:|
| 지식 | 11 | 8 | 3 |
| 테크 | 16 | 8 | 8 |
| 법 | 11 | 8 | 3 |
| 비즈니스 | 9 | 0 | **9** |
| 히스토리 | 5 | 2 | 3 |
| 철학 | 3 | 1 | 2 |
| **합계** | **55** | **30** | **25** |

**핵심 발견: 비즈니스 문서 9개가 전부 misplaced**
- COIN_ECONOMY_STRATEGY, CREDIT_NFT_FEASIBILITY_REPORT, MARKETING_WEEKLY_STRATEGY, MONK_AI_KIT_PACKAGE, MONK_ROCKET_STRATEGY, VERTEX_CREDIT_STRATEGY, REMOTE_RETOUCH_APP_PROPOSAL, BWYA_ACADEMY_INDEX, 연구원_이력서_양식

**레거시 14개**: GO_NOW, GPU_VM_SETUP_L4, HOME_RESTART_GUIDE, RESUME_SESSION, CLAUDE_CODE_* (3), DUAL_AI_DEPLOYMENT, MONKOS_CHAT_DEPLOYMENT, OPUS_EXECUTION_PLAN, ROADMAP_GCP_ENGINE, SCRIPTS_CLEANUP_GUIDE, YONGA_CONNECTION_GUIDE, YONGA_TEST_SWITCH

### 1-8. docs/monkos/ (34파일)

| 유형 | 파일수 | 적정 | misplaced |
|------|--------|:----:|:---------:|
| 지시서 (TASK_*) | 24 | 22 | 2 |
| 설계/인시던트/운영 | 10 | 6 | 4 |

**misplaced 6건**: MONKOS_APP_MISSION (레거시), TELEGRAM_DEPLOY_GUIDE (레거시), work_queue (레거시), YONGA.md (에이전트 혼선), tasks/ 서브폴더 불일치 2건

### 1-9. docs/rnd_2026/ (16파일)

| 분류 | 파일수 | 적정 | misplaced |
|------|--------|:----:|:---------:|
| 비즈니스 | 13 | 13 | 0 |
| 테크 | 2 | 2 | 0 |
| 법 | 1 | 1 | 0 |

> **가장 정돈된 디렉토리.** 1건만 경계선상 (용아_파이프라인_요청.md → corpus/gemini 대상).

### 1-10. MONK_kr/ (11파일)

| 디렉토리 | 파일수 | 적정 | misplaced | 사유 |
|----------|--------|:----:|:---------:|------|
| `.context/` | 3 | 0 | **3** | 레거시 — Cursor 시절 용아 전용 |
| `ai_lab/photolab/` | 2 | 2 | 0 | |
| `cloudflare-workers-imagen/` | 2 | 2 | 0 | |
| `cloudflare-workers/` | 3 | 1 | 2 | 레거시 — RAG 구상 폐기 |
| `README.md` | 1 | 1 | 0 | |

### 1-11. monkos_AI/ (3파일)

| 파일 | 분류 | 위치 |
|------|------|:----:|
| `README.md` | 지식 | O |
| `infrastructure/DEPLOY_GUIDE.md` | 법 | O |
| `infrastructure/SERVICE_MAP.md` | 지식 | O |

### 1-12. monkos-ops/ (6파일)

| 파일수 | 적정 | misplaced |
|--------|:----:|:---------:|
| 6 | 5 | 1 |

> 1건: `MONKOS_기술명세서.md` (docs/rnd_2026/과 중복)

### 1-13. 기타 (marketing/ 2파일, teams/ 1파일)

| 디렉토리 | 파일수 | 위치 |
|----------|--------|:----:|
| `marketing/` | 2 | O |
| `teams/` | 1 | O |

---

## Phase 2: 흩어짐 원인 분석

### 원인별 집계

| 원인 유형 | 건수 | 비율 | 설명 |
|-----------|:----:|:----:|------|
| **레거시** | 31 | 55% | 과거 구조(Cursor, React, MonkosChat, L4 GPU 등)에서 생성 후 방치 |
| **규칙 부재** | 12 | 21% | 해당 분류의 폴더가 없어서 infrastructure에 임의 배치 |
| **에이전트 혼선** | 6 | 11% | 막내/쌍아가 위치 판단 오류 (용아 문서가 잘못된 곳에) |
| **중복 생성** | 4 | 7% | 같은 내용이 2곳 이상에 존재 |
| **긴급 작업** | 3 | 5% | 급한 작업 중 생성 후 미정리 |
| **합계** | **56** | | |

### 핵심 패턴

1. **`docs/infrastructure/` = 잡동사니 서랍** (25/55 = 45% misplaced)
   - "어디에 넣을지 모르면 infrastructure에" → 비즈니스 9개, 레거시 14개 축적
   - 해결: 6분류 폴더 분리로 "기본 투하 지점" 제거

2. **`apps/monk_imagen4/` = 레거시 묘지** (9/9 = 100% misplaced)
   - React/TypeScript 기반 문서가 전부. 현재 순수 JS 규칙과 완전 충돌
   - 해결: 전체를 corpus/legacy/로 이관 또는 삭제

3. **용아(Gemini) 문서 분산** (6건)
   - corpus/gemini/, MONK_kr/.context/, docs/rnd_2026/, docs/monkos/ 4곳에 산재
   - 해결: corpus/gemini/로 통합

4. **지시서 위치 불일치** (commands/ vs docs/monkos/)
   - commands/: 16개 (2/18~2/19 우체통 체계)
   - docs/monkos/: 24개 (쌍아→막내 지시서)
   - 2개 체계가 병존 → 통합 필요

---

## Phase 3: 기술 카탈로그 설계

### 10개 기술 카테고리

| # | 카테고리 | 현 관련 파일수 | 상태 | 설명 |
|---|---------|:-------------:|------|------|
| 1 | `monk_cam` | 4 | 활성 | 카메라, 미러 캡처, WebRTC, MediaStream |
| 2 | `chatbot_autonomy` | 3 | 대기 | MonkosChat, AI 챗봇, 자율강화, 대화 |
| 3 | `tailscale_network` | 3 | 활성 | Tailscale, 원격, VPN, 메시, 프레젠테이션 |
| 4 | `telegram_ops` | 3 | 활성 | Telegram 봇, 알림, 모니터링, n8n |
| 5 | `imagen_engine` | 5 | 활성 | Imagen NB3, I2I, 프롬프트, 생성 엔진 |
| 6 | `gemini_analysis` | 5 | 활성 | Gemini 3 Flash, 코칭, QC, 프리체크, Live |
| 7 | `cloud_deploy` | 6 | 활성 | Cloud Run, GCP, Docker, deploy.sh |
| 8 | `cf_frontend` | 4 | 활성 | Cloudflare Pages, Workers, wrangler, MPA |
| 9 | `auth_payment` | 4 | 활성 | OAuth, 토스, Lemon Squeezy, 크레딧, Firestore |
| 10 | `gpu_local_llm` | 5 | 대기 | 4060, SDXL, DeepSeek, Llama, 로컬 추론 |

### 기술 카탈로그 폴더 구조

```
docs/tech/
├── README.md                    ← 기술 카탈로그 인덱스
├── monk_cam/
│   ├── README.md                ← 방향성, 목표, 현재 상태
│   ├── debug_history.md         ← 디버깅 이력
│   └── (관련 문서 이동 대상)
│       - apps/monk-cam/TECHNICAL_SPEC.md
│       - MONKOS_PRESENTATION_ASSISTANT_SPEC.md
│       - monkos-live-present-architecture.md
├── chatbot_autonomy/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - MONKOS_CHAT_DEPLOYMENT.md
│       - 20260129_MONKOS_APP_MISSION.md
├── tailscale_network/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - monkos-gpu-infrastructure-strategy.md
│       - MONKOS_iPhone_Device_Strategy.md
├── telegram_ops/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - telegram_ai_communication_strategy.md
│       - TELEGRAM_DEPLOY_GUIDE.md
├── imagen_engine/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - COACHING_MODEL_UPGRADE_SPEC.md
│       - QC_CONSULTANT_ARCHITECTURE.md
│       - SHARED_CORE_SEPARATION_PLAN.md
├── gemini_analysis/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - YONGA_CONNECTION_GUIDE.md
│       - YONGA_TEST_SWITCH.md
├── cloud_deploy/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - DEPLOYMENT_GUIDE.md
│       - monkos_AI/infrastructure/DEPLOY_GUIDE.md
│       - GPU_VM_SETUP_L4.md
│       - VERTEX_VM_SETUP_GUIDE.md
├── cf_frontend/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - CF_SERVERLESS_MIGRATION_STRATEGY.md
│       - PAGE_SPLIT_ANALYSIS.md
│       - TECH_SPEC_MPA.md
├── auth_payment/
│   ├── README.md
│   └── (관련 문서 이동 대상)
│       - test_payment_flow.md
│       - COIN_ECONOMY_STRATEGY.md
│       - CREDIT_NFT_FEASIBILITY_REPORT.md
└── gpu_local_llm/
    ├── README.md
    └── (관련 문서 이동 대상)
        - SDXL_MODEL_COMPARISON_4060.md
        - GPU_LLM_ANALYSIS.md
        - FINAL_STRATEGY_GPU.md
```

### 각 폴더 README.md 템플릿 (예: monk_cam)

```markdown
# monk_cam — 카메라 & 영상 파이프라인

## 방향성
- MONK.kr에서 실시간 촬영 + AI 코칭 + 미러 캡처를 담당
- WebRTC P2P 기반, Tailscale 메시 네트워크 위에서 동작

## 목표
- 현재: REST 3fps 스냅샷 + Web Speech TTS 코칭
- 다음: Gemini 3.0 Live 안정화 시 WebSocket 교체

## 현재 상태
- 활성 (apps/monk-cam/ 프로토타입 운용 중)

## 관련 파일
- apps/monk-cam/TECHNICAL_SPEC.md (WebRTC 3개 서브시스템)
- apps/monk-cam/README.md (CamCapture API)

## 디버깅 이력
→ debug_history.md 참조
```

---

## Phase 4: docs/ 전체 재설계안

### 현재 구조의 문제

```
docs/
├── corpus/          ← 53파일 (claude_sessions 경계 모호)
├── infrastructure/  ← 55파일 ★ 잡동사니 서랍 (45% misplaced)
├── monkos/          ← 34파일 (지시서 + 설계 + 인시던트 혼재)
└── rnd_2026/        ← 16파일 (가장 정돈됨)
```

### 제안: 6분류 기반 재설계

```
docs/
├── philosophy/              ← 철학 (비전, 페르소나, 브랜드)
│   ├── KEYWORD_LEXICON.md
│   ├── SESSION_LOG_VALUE.md
│   └── project_vision.md (MONK_kr/.context/에서 이관)
│
├── knowledge/               ← 지식 (인프라, API, 모델 스택)
│   ├── 3TRACK_SYSTEM_ARCHITECTURE.md
│   ├── ARCHITECTURE_FLOWCHART.md
│   ├── GCS_BUCKET_STRUCTURE.md
│   ├── GCP_COST_ANALYSIS.md
│   ├── MONKOS_AI_TECHNICAL_SPEC.md
│   ├── MONK_PHOTO_STUDIO_ARCHITECTURE.md
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── TECHNICAL_SPEC_20260220.md
│   └── VERTEX_AI_CONNECTION_GUIDE.md
│
├── law/                     ← 법 (헌법, 법률, 규정, 코딩표준)
│   ├── CODING_STANDARDS.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DESIGN_SYSTEM.md
│   ├── GCS_BACKUP_SETUP.md
│   ├── OVERNIGHT_AUTOMATION_RULES.md
│   ├── VSCODE_WORKSPACE_STANDARD.md
│   ├── MONK_ARTICLES_DRAFT_v1.md
│   ├── MONK_GOVERNANCE_DESIGN_v1.md
│   └── LAW_AUDIT_*.md
│
├── tech/                    ← 테크 (기술별 폴더, Phase 2)
│   ├── README.md            ← 기술 카탈로그 인덱스
│   ├── monk_cam/
│   ├── imagen_engine/
│   ├── gemini_analysis/
│   ├── cloud_deploy/
│   ├── cf_frontend/
│   ├── auth_payment/
│   ├── tailscale_network/
│   ├── telegram_ops/
│   ├── chatbot_autonomy/
│   └── gpu_local_llm/
│
├── history/                 ← 히스토리 (세션 로그, 인시던트, 변천사)
│   ├── sessions/            ← 기존 corpus/sessions/ 승계
│   │   ├── 2026-01/ (24파일)
│   │   └── 2026-02/ (14파일)
│   ├── incidents/           ← 장애 기록
│   │   └── INCIDENT_20260216_deployment.md
│   ├── gemini/              ← 용아 대화 (기존 corpus/gemini/ 승계)
│   ├── legacy/              ← 기존 corpus/legacy/ 승계
│   ├── PROJECT_WORK_HISTORY.md
│   └── notebookLM/
│
├── business/                ← 비즈니스 (마케팅, R&D, 전략)
│   ├── rnd/                 ← 기존 rnd_2026/ 승계
│   ├── marketing/           ← corpus/claude_sessions/marketing/ + marketing/docs/
│   ├── strategy/            ← corpus/claude_sessions/strategy/ (정리 후)
│   └── COIN_ECONOMY_STRATEGY.md (infrastructure에서 이관)
│
├── ops/                     ← 운용 (지시서, 작업큐, 자동화)
│   ├── tasks/               ← 현 docs/monkos/TASK_* + commands/ 통합
│   │   ├── active/          ← 미완료 지시서
│   │   └── archive/         ← 완료 지시서
│   └── sprints/             ← 스프린트 계획
│
└── _legacy/                 ← 정리 대기 (이관 전 임시)
    ├── apps_monk_imagen4/   ← 레거시 9파일
    ├── cursor_era/          ← CLAUDE_CODE_*, .context/ 관련
    └── misc/                ← 기타 정리 대상
```

### 현재 → 신규 매핑 요약

| 현재 | 파일수 | 신규 위치 |
|------|:------:|-----------|
| `docs/infrastructure/` (적정) | 30 | knowledge/, law/, tech/ 분산 |
| `docs/infrastructure/` (misplaced) | 25 | business/, _legacy/, tech/ 분산 |
| `docs/corpus/sessions/` | 38 | history/sessions/ |
| `docs/corpus/gemini/` | 7 | history/gemini/ |
| `docs/corpus/legacy/` | 18 | history/legacy/ |
| `docs/corpus/claude_sessions/` | 18 | business/strategy, business/marketing 분산 |
| `docs/monkos/` TASK_* | 24 | ops/tasks/ |
| `docs/monkos/` 기타 | 10 | 각 분류별 분산 |
| `docs/rnd_2026/` | 16 | business/rnd/ |
| `commands/` | 16 | ops/tasks/ (또는 현행 유지) |

---

## Phase 5: 파일 이동 실행 계획

> ⚠️ **실제 이동은 작가님 승인 후 별도 지시에서 실행**

### 우선순위 1: 레거시 정리 (31파일)

| 원본 | 대상 | 건수 |
|------|------|:----:|
| `apps/monk_imagen4/*.md` | `docs/_legacy/apps_monk_imagen4/` | 9 |
| `apps/photolab-monkkr-mpa-0219/*.md` | 삭제 (원본 MONK_kr/에 있음) | 2 |
| `backend/README.md` | `docs/_legacy/` | 1 |
| `MONK_kr/.context/*.md` | `docs/_legacy/cursor_era/` | 3 |
| `docs/infrastructure/` 레거시 14건 | `docs/_legacy/` | 14 |
| `docs/monkos/` 레거시 3건 | `docs/_legacy/` | 3 |

### 우선순위 2: 비즈니스 문서 이관 (13파일)

| 원본 | 대상 |
|------|------|
| `infrastructure/COIN_ECONOMY_STRATEGY.md` | `business/` |
| `infrastructure/CREDIT_NFT_FEASIBILITY_REPORT.md` | `business/` |
| `infrastructure/MARKETING_WEEKLY_STRATEGY.md` | `business/marketing/` |
| `infrastructure/MONK_AI_KIT_PACKAGE.md` | `business/` |
| `infrastructure/MONK_ROCKET_STRATEGY.md` | `business/` |
| `infrastructure/VERTEX_CREDIT_STRATEGY.md` | `business/` |
| `infrastructure/REMOTE_RETOUCH_APP_PROPOSAL.md` | `business/` |
| `infrastructure/BWYA_ACADEMY_INDEX.md` | `business/` |
| `infrastructure/연구원_이력서_양식.md` | `business/rnd/` |
| `infrastructure/LOOKBOOK_BACKGROUND_STRATEGY.md` | `business/` |
| `infrastructure/KBEAUTY_DATA_SCHEMA.md` | `business/rnd/` |
| `corpus/strategy/20250211_MONKOS_SNS_자동화_방안.md` | `business/marketing/` |
| `corpus/strategy/20250211_MONKOS_글로벌_홍보전략_보고서.md` | `business/marketing/` |

### 우선순위 3: 용아 문서 통합 (6파일)

| 원본 | 대상 |
|------|------|
| `MONK_kr/.context/yong_a_strategy.md` | `history/gemini/` |
| `docs/monkos/YONGA.md` | `history/gemini/` |
| `docs/rnd_2026/용아_파이프라인_요청.md` | `history/gemini/` |
| `MONK_kr/cloudflare-workers/PARSING_GUIDE_FOR_YONGA.md` | `history/gemini/` |
| `infrastructure/YONGA_CONNECTION_GUIDE.md` | `_legacy/` (or tech/gemini_analysis/) |
| `infrastructure/YONGA_TEST_SWITCH.md` | `_legacy/` |

### 우선순위 4: 기술 문서 재배치 (해당 tech/ 카테고리로)

> docs/ 재설계 승인 후 실행. 개별 파일 매핑은 Phase 2 카탈로그 참조.

---

## Phase 6: 흩어짐 방지 규정 초안

### 법률 제X장: 문서 위치 규정

#### 1조: 문서 생성 시 분류 의무
- 모든 `.md` 파일 생성 시 6분류(철학/지식/법/테크/히스토리/비즈니스) 중 하나에 귀속시킨다
- **분류 불명 시 `_legacy/`에 임시 배치** 후 다음 세션에서 정리
- 근거: infrastructure/ 45% misplaced — "어디에 넣을지 모르면 infrastructure" 패턴이 최대 원인

#### 2조: 루트 방치 금지 (기존 규칙 강화)
- 프로젝트 루트에 임시 `.md` 파일 방치 금지
- 루트 허용: `CLAUDE.md`, `README.md`, `package.json` 등 프로젝트 설정 파일만
- 근거: 2/20 루트 `20260216_session.md` 삭제 (긴급 작업 잔재)

#### 3조: 코드 디렉토리 문서 제한
- `apps/`, `MONK_kr/`, `monkos_AI/` 내 `.md`는 해당 코드의 **README 또는 기술명세만** 허용
- 전략/기획/비즈니스 문서는 `docs/` 아래에만 생성
- 근거: `apps/monk_imagen4/` 9개 전부 레거시 — 코드 디렉토리에 문서가 축적되면 코드 삭제 시에도 문서가 잔류

#### 4조: 지시서 통합 관리
- 미완료 지시서: `docs/ops/tasks/active/`
- 완료 지시서: `docs/ops/tasks/archive/`
- `commands/` 우체통 체계는 **실시간 디바이스간 통신용**으로 유지하되, 완료 시 archive/로 이동
- 근거: commands/ 16파일 전부 상태 미갱신 + docs/monkos/ TASK_* 24파일과 이중화

#### 5조: 세션 로그 불변
- `history/sessions/` 원본은 수정/이동 금지
- 기술 내용 필요 시 **추출하여** 해당 `tech/` 폴더의 `debug_history.md`에 기록
- 근거: 세션 로그 규칙 (CLAUDE.md 기존 규정 승계)

#### 6조: 중복 문서 금지
- 같은 내용의 문서가 2개 이상 존재하면 1개로 통합
- 통합 시 **근거가 더 풍부한 쪽**을 유지
- 근거: `apps/photolab-monkkr-mpa-0219/` 2파일 = MONK_kr/ 원본의 복사본

#### 7조: 용아 문서 통합
- 용아(Gemini) 관련 문서는 `history/gemini/`에 통합
- 여러 디렉토리에 분산 금지 (4곳 분산 → 1곳 통합)
- 근거: 에이전트 혼선으로 4곳에 산재

#### 8조: 레거시 정리 주기
- `_legacy/` 폴더는 **3개월 보존** 후 삭제 검토
- 보존 가치가 있는 것은 `history/legacy/`로 이관
- 근거: 현재 레거시 31파일이 여러 곳에 산재 — 1곳 집중 후 주기적 정리

---

## 부록: 전체 분류 통계

### 6분류별 파일 수 (246파일)

| 분류 | 파일수 | 비율 | 적정 위치 | misplaced |
|------|:------:|:----:|:---------:|:---------:|
| 법(Law) | 68 | 28% | 60 | 8 |
| 히스토리(History) | 60 | 24% | 57 | 3 |
| 테크(Tech) | 41 | 17% | 26 | 15 |
| 비즈니스(Business) | 38 | 15% | 25 | 13 |
| 지식(Knowledge) | 33 | 13% | 21 | 12 |
| 철학(Philosophy) | 4 | 2% | 1 | 3 |
| 분류불요(루트 설정) | 2 | 1% | 2 | 0 |
| **합계** | **246** | | **192** | **54** |

### 디렉토리별 misplaced 비율

| 디렉토리 | 총수 | misplaced | 비율 | 심각도 |
|----------|:----:|:---------:|:----:|:------:|
| `docs/infrastructure/` | 55 | 25 | 45% | ★★★ |
| `apps/monk_imagen4/` | 9 | 9 | 100% | ★★★ |
| `apps/photolab-mpa-0219/` | 2 | 2 | 100% | ★★ |
| `docs/corpus/claude_sessions/` | 18 | 7 | 39% | ★★ |
| `MONK_kr/.context/` | 3 | 3 | 100% | ★ |
| `docs/monkos/` | 34 | 6 | 18% | ★ |
| 기타 | 125 | 2 | 2% | — |

### misplaced 원인별 총계

| 원인 | 건수 | 비율 |
|------|:----:|:----:|
| 레거시 | 31 | 55% |
| 규칙 부재 | 12 | 21% |
| 에이전트 혼선 | 6 | 11% |
| 중복 생성 | 4 | 7% |
| 긴급 작업 | 3 | 5% |

---

*이 문서는 조사+설계 산출물이다. 실제 파일 이동은 작가님 승인 후 별도 지시에서 실행한다.*
