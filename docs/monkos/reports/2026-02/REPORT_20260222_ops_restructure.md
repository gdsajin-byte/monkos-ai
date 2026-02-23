# monkos-ops/ 체계화 보고서

```
[2026-02-22 16:00 KST] iMac/막내1 → iMac/쌍아
지시서: TASK_20260222_막내1_ops_restructure_report.md
```

---

## 1. 현행 ops/ 현황

### 1.1 디렉토리 전체도

```
monkos-ops/
├── 01_전략/
│   ├── credentials_inventory.md
│   ├── decisions/
│   │   ├── 20260213_MONKOS_이의신청_반박문.md
│   │   ├── 20260213_MONKOS_기술명세서.md
│   │   ├── 20260213_디딤돌_이의신청_전략.md
│   │   └── 20260219_vision_vs_schema.md
│   ├── orders/           ← .gitkeep만
│   └── weekly-plans/     ← .gitkeep만
├── 02_리서치/
│   ├── funding/          ← .gitkeep만
│   ├── market/           ← .gitkeep만
│   └── tech/             ← .gitkeep만
├── 03_개발/
│   ├── releases/         ← .gitkeep만
│   ├── reviews/
│   │   └── 20260213_credential_debugging_postmortem.md
│   └── tasks/            ← .gitkeep만
├── 04_문서/
│   ├── ir-materials/     ← .gitkeep만
│   ├── reports/          ← .gitkeep만
│   └── templates/        ← .gitkeep만
├── 05_공유/
│   └── hansong/
│       ├── inbox/        ← .gitkeep만
│       ├── outbox/       ← .gitkeep만
│       └── reference/    ← .gitkeep만
├── 06_로그/
│   ├── metrics/          ← .gitkeep만
│   ├── orchestration/    ← .gitkeep만
│   └── sessions/
│       ├── 2026-02-20_M1_막내1.md
│       ├── 2026-02-20_iMac_쌍아_photolab_imagepro.md
│       ├── 2026-02-21_iMac_막내2.md
│       ├── 2026-02-22_iMac_막내1.md
│       ├── 2026-02-22_iMac_막내3.md
│       ├── 2026-02-22_막내2_통합.md
│       ├── 2026-02-22_막내456_통합.md
│       └── 2026-02-22_쌍아_통합.md
└── scripts/
    ├── ads_sync.py
    ├── ads_upload.sh
    ├── mailbox_watcher.sh
    └── session_watcher.sh
```

### 1.2 실질 파일 인벤토리

| 영역 | 파일 | 요약 |
|------|------|------|
| **01_전략** | `credentials_inventory.md` | 전 서비스 인증정보(API Key, OAuth, 서비스 계정) 인벤토리 |
| 01_전략/decisions | `20260213_MONKOS_이의신청_반박문.md` | 디딤돌 R&D 이의신청 반박문 |
| 01_전략/decisions | `20260213_MONKOS_기술명세서.md` | 디딤돌 이의신청용 기술명세서 |
| 01_전략/decisions | `20260213_디딤돌_이의신청_전략.md` | 디딤돌 이의신청 전략 설계 |
| 01_전략/decisions | `20260219_vision_vs_schema.md` | Vision API vs Schema API 의사결정 기록 |
| **03_개발/reviews** | `20260213_credential_debugging_postmortem.md` | Credential `l`/`I` 혼동 디버깅 포스트모템 |
| **06_로그/sessions** | (8개) | 2/20~2/22 세션 로그 (쌍아, 막내1~6) |
| **scripts** | `ads_sync.py` | GCS 광고 동기화 스크립트 |
| scripts | `ads_upload.sh` | MONKOS_ADS 폴더 → GCS 자동 업로드 |
| scripts | `mailbox_watcher.sh` | 와이프(kku) 맥미니 ↔ 우리 쪽 파일 자동 전달 |
| scripts | `session_watcher.sh` | 소넷이 아카이브 데몬 (세션 로그 자동 분석) |

**실질 파일 합계: 18개** (세션 로그 8 + 전략 5 + 리뷰 1 + 스크립트 4)

### 1.3 빈 영역 (gitkeep만)

| 폴더 | 원래 의도 | 상태 |
|------|----------|------|
| 01_전략/orders | 작가님 명령 | 미사용 |
| 01_전략/weekly-plans | 주간 계획 | 미사용 |
| 02_리서치/ (전체) | 시장/기술/자금 리서치 | 완전 미사용 |
| 03_개발/releases | 릴리스 노트 | 미사용 |
| 03_개발/tasks | 작업 티켓 | 미사용 (지시서는 docs/monkos/) |
| 04_문서/ (전체) | IR자료/보고서/템플릿 | 완전 미사용 |
| 05_공유/hansong/ (전체) | 한송이 inbox/outbox/reference | gitkeep만 |
| 06_로그/metrics | 운영 지표 | 미사용 |
| 06_로그/orchestration | 오케스트레이션 로그 | 미사용 |

---

## 2. 변경 계획

### 2.1 05_공유 리네이밍 + kku 신설

**현행:**
```
05_공유/
└── hansong/
    ├── inbox/
    ├── outbox/
    └── reference/
```

**변경안:**
```
05_공유/
├── han/              ← hansong/ → han/ (git mv)
│   ├── inbox/
│   ├── outbox/
│   ├── reference/
│   └── README.md     ← 신설
└── kku/              ← 신설
    ├── inbox/
    ├── outbox/
    ├── reference/
    └── README.md     ← 신설
```

**영향 범위:**
- `mailbox_watcher.sh`: 현행 `TEAMS_DIR/kku/inbox` 참조 — **kku/ 경로는 이미 맞음** (워처는 원격 M2의 `~/kku/`를 참조, ops/ 내 kku/와는 별도)
- **hansong/ → han/ 리네이밍 시**: `mailbox_watcher.sh`에 hansong 참조 없음 → 영향 없음
- Git 이력: `git mv` 추적 유지

### 2.2 03_개발/specs/ 신설

**현행:**
```
03_개발/
├── tasks/
├── reviews/
└── releases/
```

**변경안:**
```
03_개발/
├── tasks/
├── reviews/
├── releases/
└── specs/                ← 신설
    ├── portal/           ← monkos.ai 포털
    ├── idphoto-kr/       ← 한국 증명사진
    ├── idphoto-jp/       ← 일본 증명사진
    ├── photolab/         ← monk.kr 프로덕션
    ├── ai-models/        ← AI 모델 명세 (코칭/QC/Imagen)
    ├── infrastructure/   ← 인프라 공통 (GCS/배포/인증)
    └── README.md
```

### 2.3 docs/infrastructure/ 59건 큐레이션 계획

#### 이관 후보: ops/03_개발/specs/ 승격 (12건)

활성 기술명세 — 현행 서비스의 동작 스펙.

| 파일 | 카테고리 | 이관 대상 | 비고 |
|------|---------|----------|------|
| `MONKOS_AI_TECHNICAL_SPEC.md` | ai-models | specs/portal/ | 포털 AI 기술명세 |
| `TECHNICAL_SPEC_20260220.md` | ai-models | specs/infrastructure/ | 최신 인프라 변경 명세 |
| `COACHING_MODEL_UPGRADE_SPEC.md` | ai-models | specs/ai-models/ | 코칭 모델 업그레이드 |
| `QC_CONSULTANT_ARCHITECTURE.md` | ai-models | specs/ai-models/ | QC Gemini 3 Flash 설계 |
| `GCS_BUCKET_STRUCTURE.md` | architecture | specs/infrastructure/ | GCS 버킷 구조 (**CLAUDE.md 참조**) |
| `ARCHITECTURE_FLOWCHART.md` | architecture | specs/idphoto-kr/ | idphoto 아키텍처 플로우 |
| `SHARED_CORE_SEPARATION_PLAN.md` | architecture | specs/idphoto-kr/ | 공유 코어 분리 설계 |
| `DEPLOYMENT_GUIDE.md` | deployment | specs/infrastructure/ | 배포 절차 |
| `MONKOS_CHAT_DEPLOYMENT.md` | deployment | specs/portal/ | 챗봇 배포 가이드 |
| `DUAL_AI_DEPLOYMENT_STRATEGY.md` | deployment | specs/infrastructure/ | 하이브리드 인증 전략 |
| `CODING_STANDARDS.md` | governance | specs/ (루트) | 코딩 표준 (**CLAUDE.md 참조**) |
| `DESIGN_SYSTEM.md` | guides | specs/ (루트) | 디자인 시스템 (**CLAUDE.md 참조**) |

> **주의**: CODING_STANDARDS, DESIGN_SYSTEM, GCS_BUCKET_STRUCTURE는 CLAUDE.md 규정 테이블에서 `docs/infrastructure/` 경로로 참조됨. 이관 시 CLAUDE.md 규정 경로도 갱신 필요.

#### 잔류: docs/infrastructure/ 하위 분류 (38건)

docs/infrastructure/를 ch4 1조 구조에 맞게 하위 분류.

**architecture/ (5건)**
| 파일 | 요약 |
|------|------|
| `3TRACK_SYSTEM_ARCHITECTURE.md` | 3-Track 시스템 핵심 아키텍처 |
| `ARCHITECTURE_GUIDE_FROM_YONGA.md` | 용아→쌍아 Cloud-Native 엔진 설계 |
| `MONK_PHOTO_STUDIO_ARCHITECTURE.md` | 몽크사진관 서비스 아키텍처 |
| `BWYA_SCHEMA_DESIGN.md` | BWYA 6대 학문 AI 모델 DB 스키마 |
| `KBEAUTY_DATA_SCHEMA.md` | K뷰티 데이터 → AI 모델 파이프라인 |

**deployment/ (7건)**
| 파일 | 요약 |
|------|------|
| `CF_SERVERLESS_MIGRATION_STRATEGY.md` | CF + GCP 역할 분담 인프라 전략 |
| `GCS_BACKUP_SETUP.md` | GCS 백업 시스템 설정 |
| `GPU_VM_SETUP_L4.md` | NVIDIA L4 GPU VM 세팅 |
| `ROADMAP_GCP_ENGINE.md` | MONK AI Engine → Cloud Run 로드맵 |
| `VERTEX_AI_CONNECTION_GUIDE.md` | Vertex AI 연동 가이드 |
| `VERTEX_VM_SETUP_GUIDE.md` | Vertex AI VM 세팅 |
| `YONGA_CONNECTION_GUIDE.md` | 용아 테스트 연결 가이드 |

**ai-models/ (1건)**
| 파일 | 요약 |
|------|------|
| `bwya_prompt_seed.sql` | BWYA 프롬프트 사전 초기 데이터 |

**strategy/ (9건)**
| 파일 | 요약 |
|------|------|
| `BWYA_ACADEMY_INDEX.md` | BWYA 커리큘럼 인덱스 |
| `COIN_ECONOMY_STRATEGY.md` | 코인/크레딧 이코노미 전략 |
| `CREDIT_NFT_FEASIBILITY_REPORT.md` | 크레딧 NFT화 타당성 검토 |
| `GCP_COST_ANALYSIS.md` | GCP 비용 분석 리포트 |
| `LOOKBOOK_BACKGROUND_STRATEGY.md` | 룩북 배경 크롤링 전략 |
| `MARKETING_WEEKLY_STRATEGY.md` | 주간 마케팅 전략 |
| `MONK_AI_KIT_PACKAGE.md` | 소상공인용 AI Kit 패키지 |
| `MONK_ROCKET_STRATEGY.md` | 260만원 3개월 로켓 전략 |
| `VERTEX_CREDIT_STRATEGY.md` | Vertex AI 크레딧 활용 전략 |

**guides/ (8건)**
| 파일 | 요약 |
|------|------|
| `CLAUDE_CODE_COLLABORATION_STRATEGY.md` | Claude Code 협업 전략 |
| `CLAUDE_CODE_FEATURES.md` | Claude Code 기능 가이드 |
| `CLAUDE_CODE_SETUP_GUIDE.md` | Claude Code 설정 가이드 |
| `HOME_RESTART_GUIDE.md` | 집에서 작업 재시작 가이드 |
| `KEYWORD_LEXICON.md` | 프로젝트 용어 사전 |
| `SCRIPTS_CLEANUP_GUIDE.md` | 실행 파일 정리 가이드 |
| `VSCODE_WORKSPACE_STANDARD.md` | VSCode 워크스페이스 표준 |
| `test_payment_flow.md` | 결제 테스트 시나리오 |

**governance/ (8건)** — laws/는 이미 별도
| 파일 | 요약 |
|------|------|
| `COMMS_PROTOCOL_DRAFT_v1.md` | 통신 프로토콜 설계 |
| `FULL_DOCS_AUDIT_AND_TECH_CATALOG.md` | 문서 전수 감사 + 기술 카탈로그 |
| `LAW_AUDIT_DOCUMENT_ANALYSIS.md` | 문서 체계 해부 + 3계층 분리안 |
| `LAW_AUDIT_SESSION_CHRONICLE.md` | 세션 로그 규칙 연대기 |
| `MONK_ARTICLES_DRAFT_v1.md` | 조항 코드표 (**CLAUDE.md 참조**) |
| `MONK_GOVERNANCE_DESIGN_v1.md` | 거버넌스 설계 |
| `OPERATIONS_OVERVIEW_20260220.md` | 운영 조감도 |
| `SECURITY_AUDIT_REPORT.md` | 보안 점검 보고서 |

#### 폐기 후보 (9건)

역할 완료, 대체됨, 또는 의미 불명.

| 파일 | 이유 |
|------|------|
| `GO_NOW.md` | 즉시 실행 액션 — 시점 특정, 이미 완료 추정 |
| `OPUS_EXECUTION_PLAN.md` | 쌍아 초기 실행 계획 — 현 체계에 흡수 |
| `PROJECT_WORK_HISTORY.md` | 작업 이력 — 세션 로그로 대체 |
| `REMOTE_RETOUCH_APP_PROPOSAL.md` | 원격 리터칭 기안 — 미채택 추정 |
| `RESUME_SESSION.md` | Cursor 세션 복구 (2026-01-08) — 폐기 |
| `SESSION_LOG_VALUE.md` | 세션 로그 가치 논문 — 법률 ch3에 흡수 |
| `OVERNIGHT_AUTOMATION_RULES.md` | 야간 자동화 규칙 — 현행 체계와 비교 필요 |
| `YONGA_TEST_SWITCH.md` | 용아 테스트 전환 — CONNECTION_GUIDE와 중복 |
| `연구원_이력서_양식.md` | HR 문서 — docs/에 부적합, 별도 보관 |

### 2.4 session_watcher.sh 경로 수정

**현행** (L10):
```bash
SESSIONS_DIR="$PROJECT_DIR/docs/corpus/sessions"
```

**변경안**:
```bash
SESSIONS_DIR="$PROJECT_DIR/monkos-ops/06_로그/sessions"
```

**영향:**
- 소넷이 데몬이 감시하는 경로가 바뀜
- `docs/corpus/sessions/`는 아카이브(읽기전용)로 전환 → 신규 로그는 ops/ 정본에만 생성
- 4060 WSL에서도 동일 변경 필요 (소넷이 데몬 실행 환경)

### 2.5 README.md 심기 계획

ops/ 하위 폴더 중 README 미보유 전수 목록:

| 폴더 | README 필요 | 내용 요약 |
|------|------------|----------|
| `monkos-ops/` (루트) | **필수** | 운영 체계 최상위 안내 — 6개 영역 역할, 정본 위치, 에이전트 참조 규칙 |
| `01_전략/` | **필수** | 의사결정/주간계획/명령 — credentials 보안 주의 |
| `01_전략/decisions/` | **필수** | 의사결정 기록 — 네이밍 규칙 (YYYYMMDD_topic) |
| `01_전략/orders/` | 선택 | 작가님 명령 (현재 미사용) |
| `01_전략/weekly-plans/` | 선택 | 주간 계획 (현재 미사용) |
| `02_리서치/` | **필수** | 시장/기술/자금 리서치 영역 안내 |
| `02_리서치/funding/` | 선택 | 자금/R&D 리서치 |
| `02_리서치/market/` | 선택 | 시장 조사 |
| `02_리서치/tech/` | 선택 | 기술 리서치 |
| `03_개발/` | **필수** | 개발 영역 — tasks/reviews/releases/specs 안내 |
| `03_개발/specs/` | **필수** (신설 시) | 서비스별 기술 명세 구조 안내 |
| `03_개발/tasks/` | 선택 | 작업 티켓 (현재 미사용) |
| `03_개발/reviews/` | 선택 | 코드 리뷰/포스트모템 |
| `03_개발/releases/` | 선택 | 릴리스 노트 |
| `04_문서/` | **필수** | IR자료/보고서/템플릿 안내 |
| `05_공유/` | **필수** | 팀원 채널(han/kku) 안내 — 우체통 시스템 설명 |
| `05_공유/han/` | **필수** (리네이밍 시) | 한송이 채널 — inbox/outbox/reference 규칙 |
| `05_공유/kku/` | **필수** (신설 시) | 꾸 채널 — 우체통 규칙 |
| `06_로그/` | **필수** | 로깅 영역 — 세션 로그가 정본임을 명시 |
| `06_로그/sessions/` | **필수** | 세션 로그 정본 — 네이밍 패턴, 아카이브 관계 |
| `06_로그/metrics/` | 선택 | 운영 지표 (현재 미사용) |
| `06_로그/orchestration/` | 선택 | 오케스트레이션 로그 (현재 미사용) |
| `scripts/` | **필수** | 운영 스크립트 — 각 스크립트 역할, 실행 방법, alias |

**필수 README: 13개** / 선택: 9개

---

## 3. 실행 순서

| 순번 | 작업 | 위험도 | 의존성 | 비고 |
|------|------|--------|--------|------|
| 1 | `05_공유/hansong/` → `han/` git mv | 낮음 | 없음 | mailbox_watcher 영향 없음 |
| 2 | `05_공유/kku/` 신설 (inbox/outbox/reference + README) | 없음 | 없음 | |
| 3 | `03_개발/specs/` 폴더 구조 신설 | 없음 | 없음 | 서비스별 6개 서브폴더 + README |
| 4 | `session_watcher.sh` 경로 수정 | 낮음 | 없음 | 4060 WSL 동기화 필요 |
| 5 | README.md 필수 13개 일괄 심기 | 없음 | 1~3 완료 후 | |
| 6 | docs/infrastructure/ 하위 분류 폴더 생성 | 낮음 | 없음 | architecture/deployment/ai-models/strategy/guides |
| 7 | 이관 12건 → specs/ 이동 + CLAUDE.md 경로 갱신 | **중간** | 3,6 완료 후 | CLAUDE.md 참조 3건 갱신 필수 |
| 8 | 잔류 38건 → 하위 분류 폴더로 정리 | 낮음 | 6 완료 후 | |
| 9 | 폐기 후보 9건 → 작가님 판단 후 삭제 | **중간** | 작가님 승인 | 1건씩 확인 |

---

## 4. 작가님 판단 필요 사항

### 4.1 CLAUDE.md 참조 경로 변경

현재 CLAUDE.md 규정 테이블에서 3개 파일을 `docs/infrastructure/` 경로로 참조:
- `CODING_STANDARDS.md`
- `DESIGN_SYSTEM.md`
- `GCS_BUCKET_STRUCTURE.md`
- `MONK_ARTICLES_DRAFT_v1.md`

이관 시 CLAUDE.md도 갱신해야 함 → **헌법 영역이므로 작가님 승인 필수**.

### 4.2 폐기 후보 최종 판단

| 파일 | 판단 포인트 |
|------|-----------|
| `OVERNIGHT_AUTOMATION_RULES.md` | 야간 자동화 현행 규칙과 일치하는지 확인 필요 |
| `REMOTE_RETOUCH_APP_PROPOSAL.md` | 미래 사업 기안 — 보존 가치 있을 수 있음 |
| `연구원_이력서_양식.md` | HR 문서 → Google Drive 이관? ops/04_문서/templates/? |

### 4.3 빈 영역 처리

`02_리서치/`, `04_문서/`는 전체 미사용. 선택지:
1. **유지**: 향후 사용 대비 (현재 방침)
2. **축소**: 02_리서치 → 단일 폴더, 04_문서 → 단일 폴더
3. **폐기**: 완전 삭제 (비권장 — 구조 설계 의도 보존)

### 4.4 docs/corpus/sessions/ 처리

정본이 ops/06_로그/sessions/로 이전된 상태. corpus/sessions/에 남아있는 기존 로그(2025-11~2026-02):
1. **읽기전용 아카이브로 유지** (ch4 4조 준수, 현재 방침)
2. **ops/로 이관 후 corpus는 리다이렉트 노트만** (이중화 완전 해소)
