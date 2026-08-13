# 법률 제4장: 문서/폴더 구조

> 상위 헌법: 제1조(정체성) 1항·3항, 제3조(적립), 제4조(구속·윤리)
> 변경 권한: 작가님 승인 시 개정 가능

---

### 1조: 프로젝트 문서 구조

프로젝트 루트의 문서 관련 디렉토리는 governance/, docs/, monkos-ops/ 세 갈래다.

**4계층 위계:**

| 계층 | 성격 | 물리 위치 |
|------|------|----------|
| 헌법 | 커널. 불변 원칙 | CLAUDE.md (자동 인식) |
| 거버넌스 | 법률+역사+철학. 절차·상세·근거 | governance/ |
| 세칙 | 부서별 운영 규정 | monkos-ops/ 각 부서 README |
| 데이터 | 실행 산출물 | 부서 하위 |

**governance/ 구조:**

```
governance/
├── laws/                      ← 법률 ch1~ch8 (정본)
├── constitution/              ← 개정 절차
│   └── petitions/             ← 청구서 보관
├── history/                   ← 역사 (결정기록)
├── philosophy/                ← 철학 (비전, 가치관, 어록)
└── MIGRATION_LOG.md
```

> 근거: 2026-02-22 헌법 개정 만장일치, 2026-02-23 물리 이행(826060d)

**docs/ 구조:**

docs/는 **아카이브(동결)** — 프로젝트의 뿌리이자 보물창고. 읽기전용 보존 대상.

**⚠️ docs/monkos/ 신규 생성 금지.** 2026-02 이전 산출물의 보존소이다. 신규 운영 문서는 전부 monkos-ops/에 생성한다. docs/monkos/의 문서를 기준으로 설계·실행하지 마라 — 과거 버전이다.

```
docs/
├── corpus/                    ← AI 코퍼스 (아카이브, 참조용)
│   ├── sessions/              ← 세션 로그 아카이브 (정본: monkos-ops/ops/sessions/)
│   │   ├── 2026-01/
│   │   └── 2026-02/
│   ├── gemini/
│   └── legacy/
├── infrastructure/            ← 인프라 원천 문서 (보물창고, 변경 없음)
│   ├── architecture/          ← 시스템 아키텍처, API 설계
│   ├── deployment/            ← 배포 가이드, 환경 설정
│   ├── ai-models/             ← AI 모델 명세, 프롬프트 전략
│   ├── strategy/              ← 사업 전략, 브랜딩
│   ├── guides/                ← 운영 가이드, 코딩 표준
│   ├── audit/                 ← 감사, 법률 분석, 거버넌스 설계
│   └── history/               ← 프로젝트 히스토리, 실행 계획
├── monkos/                    ← 🔒 아카이브 동결 (2026-02 이전 산출물)
│   ├── tasks/                 ← TASK_ 레거시 (→ ORDER_로 통합, 정본: ops/orders/)
│   ├── reports/               ← REPORT_ 레거시 (정본: ops/reports/)
│   ├── incidents/             ← INCIDENT_ 레거시 (정본: ops/incidents/)
│   ├── designs/               ← DESIGN_ 레거시 (정본: tech/designs/)
│   └── sprints/               ← SPRINT_ 레거시
├── specs/                     ← 기술 명세 아카이브 (정본: monkos-ops/tech/specs/)
└── rnd_2026/                  ← R&D 문서
```

- **운영 정본은 전부 monkos-ops/에 있다.** docs/는 참고문헌 체제이다.
- 각 폴더에 `README.md` 필수 — 해당 폴더의 역할, 네이밍 규칙, 정본 위치를 명시.

> 근거: 2026-01-11 docs/ 통합, 02-08 정리, 02-22 ops/ 중심 운영체제 확정 + 하위분류 신설, 02-23 governance/ 분리 + 4계층 위계 확정, **03-08 docs/monkos/ 아카이브 동결 선언 + TASK_→ORDER_ 통합 (작가님 승인)**
> 작가님 원문: "옵스는 운영체제 독스는 참고문헌체제가 맞지 않나" (02-22) / "타스크는 오더 즉 오더와 보고서체제를 확실히 선언" (03-08) / "독스 아카이브는 어젠다로 이관하여 옵스에 편입" (03-08)
> 위반 시: 문서 산재 → 에이전트 참조 실패, 컴팩팅 후 과거 버전을 현행으로 오인.
> 상위 헌법: 제1조(정체성) 1항

**monkos-ops/ 구조:**

monkos-ops/는 4부서 체제로 재편 중이며, 과도기에는 번호 폴더와 병존한다.

| 부서 | 소관 | 출발 번호 폴더 |
|------|------|--------------|
| ops/ | 운영관리 (전략, 결정, 세션로그, 메트릭스) | 01_전략, 06_로그 |
| tech/ | 기술 (스펙, 리뷰, R&D, 릴리즈) | 02_리서치, 03_개발 |
| contents/ | 콘텐츠 (아카데미, 출판, 다국어) | 04_문서 |
| marketing/ | 마케팅 (외부 협업, SNS) | 05_공유 |

- 번호 폴더(01~06)는 부서 이관 완료 후 별도 법률 개정으로 정리한다.
- 이관 전까지 번호 폴더는 유지하되, 신규 파일은 부서 폴더에 생성한다.
- scripts/는 범용 유틸리티, 막내 소관.

> 근거: 02-22 부서 개편, 02-23 governance 개헌 + ops 4부서 재편

---

### 2조: 금지 사항

1. **루트에 임시 .md 파일 방치 금지.**
2. **언더스코어 폴더 사용 금지.** (`_archive/` 예외)
3. **문서 정본 이중화 금지.** 동일 문서가 docs/와 monkos-ops/ 양쪽에 정본으로 존재할 수 없다. 번호 폴더(01~06)에서 부서 폴더(ops/tech/contents/marketing)로 이관된 파일은 부서 폴더를 정본으로 한다. 번호 폴더의 .gitkeep은 이중화에 해당하지 않는다.
4. **세션 로그 이중화 금지.** 정본: `monkos-ops/ops/sessions/`. `docs/corpus/sessions/`는 읽기전용 아카이브. 신규 세션 로그는 정본에만 생성.
5. **docs/monkos/ 하위 신규 파일 생성 금지.** 아카이브 동결. 운영 문서는 monkos-ops/에 생성한다.
6. **.DS_Store, 바이너리 파일 docs/ 배치 금지.** `.gitignore`에 등록.
7. **README.md 미보유 폴더 방치 금지.** 폴더 생성 시 README.md 동시 생성 의무.

> 근거: 2026-01~02-08 초기 규칙, 02-22 이중화 해소 + README 의무화, 02-23 과도기 명확화 + 정본 경로 갱신, **03-08 docs/monkos/ 아카이브 동결 (작가님 승인)**
> 위반 시: 임시 파일 누적, 폴더 혼재 → 에이전트 탐색 실패, 컴팩팅 후 과거 문서를 현행으로 오인.
> 상위 헌법: 제1조(정체성) 1항

---

### 3조: 파일 네이밍 규칙

파일명에서 타입/날짜/에이전트를 자동 추출 가능하도록 표준화한다.

**패턴 규격 (14종)**:

| # | 패턴 | 대상 폴더 | 예시 |
|---|------|----------|------|
| 1 | ~~`TASK_YYYYMMDD_{agent}_{name}.md`~~ | ~~`docs/monkos/tasks/YYYY-MM/`~~ | **레거시 — ORDER_로 통합 (03-08)** |
| 2 | `REPORT_YYYYMMDD_{topic}.md` | `monkos-ops/ops/reports/YYYY-MM/` | `REPORT_20260308_막내1_세션로그정합성점검.md` |
| 3 | `SPEC_{service}_{feature}.md` | `monkos-ops/tech/specs/{service}/` | `SPEC_idphoto-kr_credit-system.md` |
| 4 | `INCIDENT_YYYYMMDD_{service}.md` | `monkos-ops/ops/incidents/YYYY-MM/` | `INCIDENT_20260220_cf-function.md` |
| 5 | `DESIGN_YYYYMMDD_{feature}.md` | `monkos-ops/tech/designs/YYYY-MM/` | `DESIGN_20260215_tts-architecture.md` |
| 6 | `SPRINT_{range}.md` | `monkos-ops/ops/sprints/` | `SPRINT_0217-0223.md` |
| 7 | `YYYY-MM-DD_{device}_{agent}.md` | `monkos-ops/ops/sessions/YYYY-MM/` | `2026-02-22_iMac_막내3.md` |
| 7a | `YYYY-MM-DD_{device}_{agent}_{접미어}.md` | `monkos-ops/ops/sessions/YYYY-MM/` | `2026-02-26_M1_쌍아_새벽.md` |
| 8 | `YYYY-MM-DD_{agent}_통합.md` | `monkos-ops/ops/sessions/YYYY-MM/` | `2026-02-22_쌍아_통합.md` |
| 9 | `YYYY-MM-DD_{agent범위}_통합.md` | `monkos-ops/ops/sessions/YYYY-MM/` | `2026-02-22_막내456_통합.md` |
| 10 | `PETITION_YYYYMMDD_{agent}_{topic}.md` | `governance/constitution/petitions/` | `PETITION_20260222_막내6_법체계자동집행기반.md` |
| 11 | `ORDER_YYYYMMDD_{topic}.md` | `monkos-ops/ops/orders/YYYY-MM/` | `ORDER_20260308_M1쌍아_막내1_세션로그정합성점검.md` |
| 12 | `RESEARCH_YYYYMMDD_{topic}_{detail}.md` | `monkos-ops/ops/agenda/` | `RESEARCH_20260223_긴급대행절차_선택지.md` |
| 13 | `COMPLETION_YYYYMMDD_막내N_{HHMMSS}.md` | `monkos-ops/ops/reports/YYYY-MM/` | `COMPLETION_20260225_막내1_150900.md` |
| 14 | `REVIEW_YYYYMMDD_{agent}_{topic}.md` | `monkos-ops/ops/reports/YYYY-MM/` | `REVIEW_20260302_쌍아_P0_스키마_정합검토.md` |
| 15 | `PF_{코드네임}.md` | `monkos-ops/ops/portfolios/` | `PF_CITADEL.md`, `PF_PORTAL_V4.md` |
| 16 | `PROPOSAL_YYYYMMDD_{agent}_{topic}.md` | `monkos-ops/ops/proposals/` | `PROPOSAL_20260329_민아_SEO검색노출_수정제안서.md` |

**PF 귀속 파일명 규칙**:
- PF에 귀속된 문서(ORDER, REPORT, COMPLETION 등)의 파일명에 **PF 코드네임을 삽입**한다.
- 무귀속 문서는 생략.
- 예시:
  - 귀속: `ORDER_20260326_M1쌍아_막내1_CITADEL_Phase1_즉시최적화.md`
  - 무귀속: `ORDER_20260326_M1쌍아_막내1_서버장애대응.md`

**패턴 #7a 접미어 허용값**: 시간대(`새벽`, `오전`, `오후`, `저녁`), 순번(`2차`, `3차`)

**표기 규칙**:
- 에이전트명: `쌍아`, `막내3`, `소넷이`, `한`, `꾸` 등 (디바이스 접두어 불포함)
- 날짜: `YYYYMMDD` (세션 로그만 예외로 `YYYY-MM-DD`)
- 한글 파일명: 기존 유지, 신규는 영문 권장

**적용 범위**:
- monkos-ops/ 하위 전 운영 문서 (ORDER_*, REPORT_*, COMPLETION_*, REVIEW_*, SPEC_*, DESIGN_*, INCIDENT_*, RESEARCH_*)
- governance/constitution/petitions/
- docs/monkos/ 하위는 아카이브 동결 (신규 생성 금지, 기존 파일은 읽기전용)

**적용 제외**:
- docs/infrastructure/ — **(소멸됨, monkos-ops/tech/ 등으로 분산 이관 완료 2026-03-14)**
- governance/laws/ — 법률 파일은 ch별 고정 네이밍.
- 세션 로그 — 패턴 #7~#9 전용.
- `monkos-ops/ops/reports/data/` — 자동 생성 데이터 출력물 (8조 6항).

**기존 파일 정비**:
- 접두사 미보유 기존 파일은 내용 확인 후 적절한 유형 접두사를 부여하거나, 해당 유형이 없으면 ch4 6조 5항 절차로 신규 유형을 등록한다.
- 정비 시한: 강제 없음. 해당 파일을 수정하는 시점에 함께 정비한다.

> 근거: 2026-02-22 문서 인벤토리 조사 — 준수율 62.7%, 자동 분류 불가 판정, 02-23 PETITION 등록 + 적용 범위 명시, 02-23 ORDER/RESEARCH 유형 등록 (막내A 전수조사 + 막내B 개정안 기반), 02-25 COMPLETION 유형 등록 (PETITION_20260225, 막내5·6 검수 통과, 작가님 승인)
> 위반 시: 패턴 미매칭 → 자동 분류 실패, 에이전트 탐색 비용 증가.
> 상위 헌법: 제1조(정체성) 1항

---

### 4조: 정본 위치 규칙

`governance/`(법적 정본) · `docs/`(참고문헌) · `monkos-ops/`(운영체제) 간 정본을 정의한다.

**정본 테이블**:

| 영역 | 정본 위치 | 아카이브 (읽기전용) | 비고 |
|------|----------|-------------------|------|
| 법률/헌법 | `governance/laws/` | — | 개헌 826060d |
| 개정 절차 | `governance/constitution/` | — | 개헌 826060d |
| 청구서 | `governance/constitution/petitions/` | — | 개헌 826060d |
| 철학 | `governance/philosophy/` | — | 개헌 826060d |
| **지시서 (ORDER)** | `monkos-ops/ops/orders/YYYY-MM/` | `docs/monkos/tasks/` (TASK_ 레거시) | **TASK_→ORDER_ 통합 (03-08)** |
| **보고서 (REPORT)** | `monkos-ops/ops/reports/YYYY-MM/` | `docs/monkos/reports/` (레거시) | **정본 ops/로 통일 (03-08)** |
| **완료 보고 (COMPLETION)** | `monkos-ops/ops/reports/YYYY-MM/` | — | REPORT와 동일 폴더 |
| **리뷰 (REVIEW)** | `monkos-ops/ops/reports/YYYY-MM/` | — | REPORT와 동일 폴더 |
| **제안서 (PROPOSAL)** | `monkos-ops/ops/proposals/` | — | PF 승격 후에도 영구 보존 (9조 4항) |
| **세션 로그** | `monkos-ops/ops/sessions/YYYY-MM/` | `docs/corpus/sessions/` | 매월 1일 이관 + README |
| **기술 스펙 (SPEC)** | `monkos-ops/tech/specs/{service}/` | `docs/specs/` (구버전) | **tech가 유일 정본 (03-08)** |
| **설계 문서 (DESIGN)** | `monkos-ops/tech/designs/YYYY-MM/` | `docs/monkos/designs/` (레거시) | **tech가 유일 정본 (03-08)** |
| **인시던트 (INCIDENT)** | `monkos-ops/ops/incidents/YYYY-MM/` | `docs/monkos/incidents/` (레거시) | ops가 정본 |
| 전략/어젠다 | `monkos-ops/ops/agenda/` | — | RESEARCH_, AGENDA_ |
| 코드 리뷰 | `monkos-ops/tech/reviews/` | — | tech가 원본 |
| 스프린트 | `monkos-ops/ops/sprints/` | `docs/monkos/sprints/` (레거시) | ops가 정본 |
| R&D 리서치 | `monkos-ops/tech/` | `docs/rnd_2026/` | tech가 원본 |
| 팀 공유 | `monkos-ops/marketing/` | — | marketing 전용 |
| 에셋 레지스트리 | `monkos-ops/tech/ASSET_REGISTRY.md` | — | 전 저장소 통합 인덱스 |
| 외부 에이전트 산출물 (2026-03~07 이력) | 원격 `monkos-works` 레포 (구 works submodule) | — | **채널 폐지(2026-08-13)** — 신규 산출물은 ops/ 표준 경로 직접 적립. 이력은 원격 레포 열람 |
| **포트폴리오 (PF)** | `monkos-ops/ops/portfolios/` | — | **프로젝트 생애주기 허브 (03-26 신설)** |
| 범용 유틸 스크립트 | `scripts/` | — | 막내 소관 |

**원칙**:
- 정본은 **하나만** 존재한다. 참조본은 읽기전용(수정 금지).
- 양쪽에 동일 문서 발견 시: 정본 판정 → 비정본 삭제 또는 리다이렉트 노트.
- **docs/monkos/ 하위는 아카이브 동결.** 신규 생성 금지. 기존 파일은 읽기전용 보존.
- **컴팩팅 방어**: docs/의 문서를 발견해도 정본은 항상 monkos-ops/에 있다. docs/는 과거 버전이다.
- 번호 폴더(01_전략~06_로그)는 레거시다. 신규 문서는 4부서 경로에 생성한다.
- 번호 폴더 → 4부서 이관이 완료되면 번호 폴더를 삭제하고 본 테이블을 갱신한다.
- **월별 이관**: orders/, reports/, sessions/, incidents/, designs/ 는 YYYY-MM/ 서브폴더를 사용한다. 매월 1일, 지난달 폴더를 생성하고 README.md(목록·주요사항 개요)를 작성하여 이관한다.
- **sessions/, reports/, orders/ 루트에 직접 파일을 배치하지 않는다.**
  모든 파일은 YYYY-MM/ 서브폴더에 적립한다. (README.md는 예외)
- **ops/cowork/ 폴더는 폐지 상태를 유지한다.** 외부 에이전트 신규 산출물은 ch4 3조 표준
  경로(`ops/reports/YYYY-MM/` 등)에 직접 적립하며, 별도 폴더에 복사하지 않는다.
- **works 채널은 폐지되었다 (2026-08-13, PETITION_20260806 + 작가님 결단).**
  구 works submodule(조문 구표기 "subtree"는 오기 — 실체는 submodule)은 본진에서 분리되었고,
  2026-03~07 외부 에이전트 산출물 이력은 원격 레포 `github.com/gdsajin-byte/monkos-works`
  (최종 연결 커밋 `372c4666`)에 read-only 보존된다. **과거 문서의 `works/` 경로 참조는 해당
  원격 레포에서 열람한다.** 외부 에이전트(코웍이·꾸) 신규 산출물은 ops/ 표준 경로에 직접
  적립하고, 쌍아가 환원·가공한 결과물(지시서·보고서)은 별개 산출물로 ops/에 적립한다.

> 근거: 2026-02-22 — 세션 로그/전략 문서 이중화 발견, ops 중심 운영체제 확정, 02-23 governance 개헌 + ops 4부서 재편, 02-25 COMPLETION 정본 등록, **03-08 정본 전면 ops/ 통일 + TASK_→ORDER_ 통합 + docs/monkos/ 아카이브 동결 + 월별 서브폴더 도입 (작가님 승인)**, **03-21 works subtree 참조 원칙 신설 + 루트 배치 금지 + ops/cowork/ 폐지 (작가님+쌍아 합의, 영향평가 2건)**, **08-13 works 채널 폐지 — submodule 분리·원격 존치 (PETITION_20260806 삼권심사 + 작가님 결단)**
> 작가님 원문: "옵스는 운영체제 독스는 참고문헌체제" (02-22) / "타스크는 오더 즉 오더와 보고서체제를 확실히 선언" (03-08) / "독스 아카이브는 어젠다로 이관하여 옵스에 편입" (03-08) / "과거가 현재를 부정하며 뒤집는 버그" (03-08)
> 위반 시: 정본 불명 → 에이전트가 구버전 참조, 컴팩팅 후 과거 문서로 현재 설계 파괴.
> 상위 헌법: 제1조(정체성) 1항

---

### 5조: 서비스 약칭 레지스트리

파일명, 폴더명, 명세서에서 사용하는 서비스 약칭을 정규화한다.

| 약칭 | 서비스 | 배포 대상 |
|------|--------|----------|
| `portal` | monkos.ai 포털 | Cloud Run: monkos-portal |
| `idphoto-kr` | 한국 AI 증명사진 | Cloud Run: monkos-idphoto-kr |
| `idphoto-jp` | 일본 AI 증명사진 | Cloud Run: monkos-idphoto-jp |
| `photolab` | monk.kr 프로덕션 증명사진 | Cloudflare Pages: monk-kr |
| `monk-kr` | monk.kr 포털 | Cloudflare Pages: monk-kr |
| `image-engine` | Imagen API 서비스 | Cloud Run: monk-image-engine |
| `crop-engine` | 규격 안착 크롭 엔진 (FaceMesh) | Cloud Run: monkos-crop-engine (asia-northeast3) |
| `ops` | 운영 체계 (monkos-ops) | 비배포 (인프라) |

- 신규 서비스 추가 시 이 테이블에 등록 필수.
- 파일명의 `{service}` 필드는 이 레지스트리의 약칭만 허용.

> 근거: 2026-02-22 통합 스키마 제정 — 서비스 약칭 미정의로 {service} 필드 혼란
> 위반 시: 파일명/폴더명 불일치 → 자동 분류 실패
> 상위 헌법: 제1조(정체성) 1항

---

### 6조: 레지스트리 확장 절차

신규 에이전트, 디바이스, 서비스, 폴더, 파일유형 편입 시 절차를 규정한다.

**1. 에이전트 편입**
1. 작가님 승인
2. ch1 1조 테이블에 행 추가 (약칭/운용자/모델/환경/역할)
3. ch1 4조 수발신 예시에 반영
4. 근거 라인에 편입 일자 기록

**2. 디바이스 편입**
1. 작가님 승인
2. 물리 합류 확인:
   - Tailscale 네트워크 합류 + IP 실측 (`tailscale status`)
   - 미합류 시: 약칭에 `(예정)` 표기 → 합류 완료 시 해제
3. ch1 4조 디바이스 약칭에 추가
4. ch1 5조 hostname 매핑 테이블에 추가
5. MEMORY.md 인프라 섹션에 IP/계정 기록

**3. 서비스 편입**
1. 작가님 승인
2. ch4 5조 서비스 약칭 레지스트리에 등록
3. `monkos-ops/tech/specs/{서비스}/` 폴더 + README.md 생성 (정본)
4. `docs/specs/{서비스}/` — 생성 불필요 (아카이브 동결)

**4. 폴더 편입**
1. 해당 루트 체계에 따라 트리 문서 갱신:
   - docs/ 하위: ch4 1조 트리에 추가
   - monkos-ops/ 하위: monkos-ops/README.md 구조표에 추가
   - governance/ 하위: governance/README.md 구조표에 추가. 헌법 개정 절차를 준용한다 (governance/는 헌법 소관).
2. README.md 동시 생성 (ch4 2조 7항 의무)
3. 정본/참조 위치 해당 시 ch4 4조 테이블 갱신

**5. 파일유형 편입**
1. ch4 3조 패턴 테이블에 행 추가
2. 필드 허용값 정의 ({agent}, {device}, {service} 등)
3. 대상 폴더 지정
4. ch4 7조 YAML 규격 — type 허용값에 등록 + 타입별 필수 필드 정의

**6. 에셋 편입**
1. 에셋 카테고리 판정: CODE / BIN / DATA / SEC / GOV / OPS / LEGACY
2. 저장소 배정:
   - 코드/문서 → Git
   - 바이너리/미디어 → GCS 또는 R2
   - DB 레코드 → D1 또는 Firestore
   - 시크릿 → 환경변수 (절대 Git 금지, 헌법 제4조(구속·윤리) 1항)
3. `monkos-ops/tech/ASSET_REGISTRY.md` 해당 카테고리 테이블에 행 추가
4. 상세 문서 해당 시 참조 링크 기재 (GCS_BUCKET_STRUCTURE.md 등)

> 근거: 2026-02-22 통합 스키마 제정 — 신규 편입 시 법적 근거 부재, 02-23 디바이스 물리확인 + governance 폴더 편입 + YAML 연동 + 에셋 편입 절차 신설
> 위반 시: 비정규 요소 편입 → 스키마 오염, 자동 분류 파괴
> 상위 헌법: 제1조(정체성) 1항

---

### 7조: YAML Frontmatter 규격

헌법 제3조(적립) 3항에 따라, 모든 공식 문서에 YAML frontmatter를 필수 기재한다.

**적용 범위**:
- governance/constitution/petitions/*.md
- monkos-ops/ 하위 전 운영 문서 (ORDER_*, REPORT_*, COMPLETION_*, REVIEW_*, SPEC_*, DESIGN_*, INCIDENT_*, RESEARCH_*, PROPOSAL_* 파일)
- docs/monkos/ 하위는 아카이브 동결 (기존 파일의 YAML 보정은 허용하나 신규 생성 금지)

**적용 제외**:
- 법률 파일 (governance/laws/ch*.md) — 법률은 그 자체가 규격
- 세션 로그 — ch3 2조(형식) 준용
- README.md — type: department-readme 권장, 필수 아님
- 기존 파일 — 신규 생성분부터 적용 (헌법 제3조(적립) 3항 소급 방지). 단, 인덱싱·검색 목적의 메타데이터 필드 소급 보강(내용 무변경)은 쌍아+작가님 합의 시 일괄 실행을 허용한다.

#### 공통 필수 필드 (전 타입)

| 필드 | 타입 | 규칙 | 예시 |
|------|------|------|------|
| `type` | enum | 하단 허용값 | `task` |
| `id` | string | 파일명(확장자 제외)과 동일 | `TASK_20260223_막내6_ch4개정안` |
| `date` | string | `YYYY-MM-DD HH:MM KST` (헌법 제3조(적립) 1항) | `2026-02-23 04:10 KST` |
| `status` | enum | pending / in_progress / completed / archived / blocked | `pending` |

**type 허용값**: order, report, spec, incident, design, sprint, petition, research, completion, review, agenda, portfolio, **proposal**
> `task`는 레거시. 신규 지시서는 `order` 사용 (03-08 TASK_→ORDER_ 통합)

#### 타입별 추가 필수 필드

| 타입 | 필수 | 선택 |
|------|------|------|
| ~~task~~ | ~~레거시 — order 사용~~ | — |
| report | `from`, `to`, `task_id`, `result`(success/partial/fail) | `tags` |
| petition | `from`, `to`, `category`, `procedure` | `tags` |
| spec | `service`(ch4 5조 약칭), `from` | `version`, `tags` |
| incident | `service`, `severity`(critical/major/minor) | `resolved_at`, `tags` |
| design | `from`, `feature` | `tags` |
| sprint | `range`, `from` | `tags` |
| order | `from`, `to`, `priority`(P0~P3) | `deadline`, `tags` |
| research | `from`, `to`, `order_ref` | `category`, `tags` |
| completion | `from`, `to`, `order`, `commit`, `branch` | `time`, `tags` |
| review | `from`, `to`, `sources`(검토 대상 보고서 목록) | `tags` |
| portfolio | `name`, `subject`, `owner`, `leads` | `domain`, `tags` |
| proposal | `from`, `to`, `subject`, `priority` | `pf_ref`, `tags` |

#### 검증 규칙

- `from`/`to`: ch1 1조 에이전트 테이블의 이름만 허용
- `priority`: P0(긴급) > P1(높음) > P2(보통) > P3(낮음)
- `service`: ch4 5조 레지스트리 약칭만 허용
- `id`와 파일명 불일치 시: 파일명이 우선 (id 보정 대상)

#### 긴급 예외 (헌법 제3조(적립) 3항 준용)

긴급 장애 대응(INCIDENT) 시: `type`, `date`만으로 허용. 24시간 내 전 필드 보정.

> 근거: 2026-02-23 법률 개정 — 헌법 제3조(적립) 3항 실효화. YAML = 법과 코드의 접점, 자동 집행의 물리 계층, 02-25 completion 유형 등록 (PETITION_20260225, 막내5·6 검수 통과, 작가님 승인)
> 위반 시: 자동 분류 불가, 데몬 파싱 실패, 문서 관리 수동 의존
> 상위 헌법: 제3조(적립) 3항(문서 규격)

---

### 8조: 데이터 운영 규칙

> 상위 헌법: 제4조(구속·윤리), 제3조(적립) 3항(문서 규격)

데이터 접근·보관·삭제·고객 응대 증빙 처리에 관한 운영 규칙을 정한다.

**1항: 접근 등급**

데이터 접근 권한을 3등급으로 분류한다.

| 등급 | 대상 | 권한 범위 |
|------|------|----------|
| **L1** (관리자) | 작가님, 에이전트 (쌍아/막내/소넷이) | 전 데이터 읽기/쓰기/삭제 |
| **L2** (운영자) | 꾸 | SSH 접근, 고객 문의 대응 범위 조회 |
| **L3** (조회자) | (현재 해당자 없음 — 한송이 퇴사 2026-05-27 실효) | 텔레그램 경유 통계 조회 (매출/사용량/전환율) |

- 등급 변경: 작가님 승인 필수.
- L2/L3 대상자의 결제 정보(paymentKey 등)는 **항상 마스킹** 출력.
- 등급 배정 근거: `governance/PERSONNEL_REGISTRY.md`

**2항: 개인정보 처리 원칙**

1. **얼굴 사진은 생체정보로 취급한다.**
   - 근거: 일본 APPI — 얼굴 사진을 개인식별부호로 규정.
   - MONKOS는 일본 서비스(idphoto-jp)를 운영하므로 **최엄격 기준을 전 서비스에 동일 적용**한다.
2. **서버 미보관 원칙.**
   - 서비스 파이프라인: 사진 업로드 → AI 처리 → 사용자 전달 → **서버에 보관하지 않는다.**
   - "보관 기간"이 아니라 "보관하지 않음"이 MONKOS의 정책이다.
3. **결제 정보 마스킹.**
   - paymentKey, 카드번호 등 결제 정보는 모든 출력(로그, 보고서, CLI)에서 마스킹한다.

**3항: 삭제 정책**

| 대상 | 정책 | 비고 |
|------|------|------|
| 서비스 사진 (업로드 원본 + 생성물) | **보관하지 않음** — 처리 완료 후 서버 미보관 | 삭제 대상 자체가 없음 |
| CS 수신 증빙 (반려 심사 등) | **심사 완료 후 7영업일 이내 삭제** | 개인정보 처리방침에 명시 |
| user-reset | **소프트 삭제 + 유예 기간** 필수 | 즉시 삭제(하드 삭제) 금지 |

**user-reset 안전 규칙:**
- 실행 조건: 지시서 또는 작가님 직접 지시 경유 시에만 실행 가능.
- 소프트 삭제: 데이터를 삭제 표시 후 유예 기간 경과 시 영구 삭제.

**4항: 반려 보장 심사 — 증빙 처리**

고객이 여권/증명사진 반려 시 보장을 청구하는 절차에서 수신하는 증빙의 처리 규칙.

**고객 제출 항목** (텔레그램 CS봇 경유):

| 항목 | 용도 |
|------|------|
| 반려 기관 + 지점명 | 사실 확인 |
| 반려 사유 | 사진 품질 귀책 판단 |
| 담당자 이름 | 사실 확인 추적 |
| 본인 이름 | 본인 확인 |
| 이메일 | 계정 확인 |
| 연락처 | CS 연락 |
| 전후 캡쳐 사진 | 증빙 |

**처리 규칙:**
- 심사 기한: 인증 절차 거쳐 **5영업일 이내**.
- 증빙 사진 보관: **심사 완료 후 7영업일 이내 삭제** (3항 준용).
- 환불 조치: 심사 승인 후 규정 기한 내 크레딧 환급.

**환불 규정과의 관계:**
- 크레딧 미사용 + 구매 후 7일 이내 → 직접 환불 (반려 심사 불필요).
- 생성/다운로드 사용 시점 → 일반 환불 규정 범위 밖. 반려 보장은 별도 절차.

**5항: 개인정보 처리방침**

monkos.ai에 개인정보 처리방침을 **반드시 게시**한다.

**필수 명시 사항:**

| 항목 | 내용 |
|------|------|
| 수집 항목 | 이메일, 이름, 연락처, 얼굴 사진 (처리 시 일시 수신) |
| 처리 목적 | AI 증명사진 생성 |
| 보관 기간 | **미보관** — 처리 완료 후 서버에 보관하지 않음 |
| CS 증빙 보관 | 심사 완료 후 7영업일 이내 삭제 |
| 제3자 제공 | 해당 시 명시 (결제사 등) |
| 이용자 권리 | 삭제 요청, 열람 요청 절차 |

- 규모 불문 법적 필수 사항.
- 일본 서비스: APPI 준거법 표기 추가.

**6항: 보고서 출력물 관리**

- 자동 생성 데이터 출력물: `monkos-ops/ops/reports/data/`
- 3조 파일 네이밍 **적용 제외** (자동 생성 특성).
- `.gitignore`에 `monkos-ops/ops/reports/data/` 등록.
- README.md 동시 생성 (2조 7항).

**7항: 도구 정본**

운영 데이터 조회/관리 도구의 정본 위치.

- `scripts/`는 **범용 유틸리티, 막내 소관**.
- ops-db CLI 등 데이터 조회/관리 도구 구현 시: `scripts/` 하위 배치.

> 근거: 2026-02-28 막내1 원안(PETITION_20260228_막내1_데이터운영규정.md), 삼권심사 조건부 승인, 철창이 리서치(APPI, 소프트삭제), 작가님 보정(서버 미보관 원칙, 반려 보장 절차), 03-02 쌍아 재설계(DESIGN_20260302_쌍아_데이터운영규정_재설계.md)
> 위반 시: 개인정보 유출, 법적 리스크(APPI 위반), 데이터 영구 유실, 고객 신뢰 훼손.
> 상위 헌법: 제4조(구속·윤리), 제3조(적립) 3항(문서 규격)

---

### 9조: 포트폴리오(PF) 운용 규칙

> 상위 헌법: 제3조(적립) 2항 (PF 적립 의무)
> 신설: 03-26 (AMENDMENT_20260326, 5인 만장일치)

**1항 — 생애주기**

기안(PROPOSAL) 승인 시, PF 신규 생성 또는 기존 PF 인입을 작가님+쌍아가 협의하여 결정한다.
PF의 status는 `draft | active | blocked | paused | completed` 중 하나이다.
완료된 PF는 에셋으로 영구 보존하며, 버전업 시 `active`로 복귀한다.

**2항 — 정합성 판정 기준**

PF 히스토리와 세션 로그가 동일 사건을 기록할 수 있다. 양자가 어긋날 때의 정본:
- 사실 판단("이 작업이 실행되었는가?") → **세션 로그**가 정본
- 상태 판단("프로젝트가 지금 어디인가?") → **PF Phase 현황**이 정본

**3항 — 비대화 관리**

- 히스토리 테이블 **100행 초과 시**: 완료된 Phase의 히스토리를 별도 파일(`PF_{코드네임}_HISTORY_{PhaseN}.md`)로 분리. 본문에 요약 + 링크만 잔류.
- PF 파일 **500줄 초과 시**: 아카이브 트리거. 쌍아가 세션 마감 시 줄 수 확인.

**4항 — PROPOSAL 보존**

PROPOSAL은 PF 승격 후에도 `ops/proposals/`에 영구 보존한다. 삭제 금지.

**5항 — 소급 불적용**

기존 프로젝트는 현재 상태 스냅샷만 작성한다. 히스토리 역추적은 하지 않는다.

**6항 — ops/projects/ 폐지**

PF 체계 발효에 따라 `ops/projects/` 폴더는 폐지한다. 잔류 파일은 `ops/portfolios/`로 이관 완료.

**7항 — 메타 PF (통괄 PF)**

- 메타 PF는 여러 하위 PF를 묶는 상위 통괄 PF이다 (예: PF_OPUS).
- **정본 분리**: 메타 PF = 흐름·연결·KPI의 정본. 하위 PF = 각 도메인 실측·실행의 정본. 양쪽 히스토리가 동일 사건을 기록할 수 있으며, 판정은 2항을 준용한다.
- 메타 PF의 Phase는 하위 PF의 Phase와 독립적이다. 하위 PF가 완료되어도 메타 PF는 계속 active일 수 있다.
- 비대화 관리(3항)는 메타 PF에도 동일 적용한다.

> 근거: 2026-06-05 — PF_OPUS(콘텐츠 플라이휠) 신설 시 메타 PF 개념 합의. 2026-06-06 삼권 리서치 D항목 조건부 통과, 정본 경계 명문화.

> 근거: 2026-03-26 — PF 체계 개헌 (AMENDMENT_20260326). 작가님 기안, 쌍아 설계, 삼권심사(입법·행정·사법) 3자 "수정 후 통과", 5인 만장일치 의결.
> 작가님 원문: "세션로그만 뒤지다보니 에이전트들이 리서치할때마다 해석이 달라지고" / "포트폴리오는 시작부터 완성되어 내보일 수 있는 작품의 뉘앙스" / "문서체계에 완벽히 들어와야하는 시스템이고 세션로그처럼 의무를 부여할 파트"
> 위반 시: PF 미갱신 → 에이전트 맥락 유실, 프로젝트 상태 추적 불가.
> 상위 헌법: 제3조(적립) 2항

---

### 10조: 크레딧/고객 데이터 접근 규칙

> 상위 헌법: 제4조(구속·윤리) 1항(비밀정보 보호), 4항(윤리적 운용)
> 신설: 2026-05-12 (작가님 승인)
> 관련: 8조(데이터 운영 규칙)

Firestore 고객 데이터(크레딧, 개인정보, 결제 기록)에 대한 접근·변경 절차를 규정한다.
deploy.sh 경유 필수(ch5 2조)와 동일 패턴 — **스크립트 경유를 강제**하여 감사 추적을 보장한다.

**1항 — 직접 접근 금지**

- Firestore에 직접 접근하는 node 스크립트, `gcloud firestore`, 콘솔 직접 편집을 **금지**한다.
- 모든 크레딧 조회/변경, 고객 정보 조회는 **`scripts/credits.sh` 경유 필수**.
- 지시서에 Firestore 직접 접근 코드가 기재된 경우, 막내는 실행 전 10조 위반 보고 후 `credits.sh` 경유로 전환한다.

**2항 — 스크립트 정본**

| 명령 | 기능 | 감사 로그 |
|------|------|----------|
| `credits.sh query <email>` | 크레딧 조회 | — |
| `credits.sh charge <email> <amount> "<사유>"` | 크레딧 충전 | ✅ 자동 |
| `credits.sh deduct <email> <amount> "<사유>"` | 크레딧 차감 | ✅ 자동 |
| `credits.sh user <email>` | 고객 정보 조회 | — |
| `credits.sh log [N]` | 감사 로그 열람 | — |

- 정본 위치: `scripts/credits.sh`
- 충전/차감 시 **사유 필수**. 사유 없이 실행 시 스크립트가 거부한다.

**3항 — 감사 추적 (이중 기록)**

크레딧 변경(charge/deduct) 시 스크립트가 **자동으로 이중 기록**한다:

| 기록 위치 | 형식 | 특성 |
|----------|------|------|
| Firestore `audit` 컬렉션 | JSON (timestamp, email, before, after, amount, reason, device) | 영구 보존, 서비스 연동 가능 |
| `monkos-ops/ops/audit/CREDIT_AUDIT_LOG.md` | 마크다운 테이블 (append only) | Git 추적, 오프라인 열람 |

- 감사 로그는 **append only**. 수정·삭제 절대 금지 (헌법 3조 2항 준용).
- 세션 로그에도 크레딧 변경 사실을 어펜드한다 (기존 의무 유지).

**4항 — 접근 등급별 권한**

8조 1항 접근 등급을 크레딧 운용에 적용한다:

| 등급 | 크레딧 조회 | 크레딧 변경 | 고객 정보 조회 | 감사 로그 열람 |
|------|-----------|-----------|--------------|-------------|
| **L1** (작가님, 에이전트) | ✅ | ✅ (사유 필수) | ✅ | ✅ |
| **L2** (꾸) | ✅ | ❌ | 마스킹 출력 | ❌ |
| **L3** (해당자 없음 — 한송이 퇴사 2026-05-27 실효) | ❌ | ❌ | ❌ | ❌ |

- L1이라도 **작가님 지시 또는 지시서 명시** 없이 크레딧 변경 금지.
- 에이전트 자율 판단에 의한 크레딧 변경은 헌법 4조 위반으로 간주한다.
- 본 항은 8조 1항 L1 권한의 **절차적 강화 규율**이며, L1 등급 정의 자체를 변경하지 않는다.

**5항 — 막내 방어 의무**

- 지시서에 Firestore 직접 접근 코드(`firestore.collection('users')`, `node -e "import { firestore }"` 등)가 포함된 경우:
  1. 실행 전 10조 1항 위반 보고
  2. `credits.sh` 경유로 전환하여 실행
- 작가님이 직접 `credits.sh` 우회를 지시한 경우: 세션 로그에 `[예외]` 기록.

**6항 — 예외**

- 서비스 코드(`monkos_AI/portal/server.js` 및 `lib/` 하위)의 런타임 Firestore 접근은 본 조항 적용 대상 아님.
- 본 조항은 **운영·관리 목적의 수동 접근**(`users` 컬렉션 및 고객 개인정보/크레딧 데이터)에만 적용한다. DB 구조 관리(TTL 설정, 컬렉션 목록 조회 등)는 적용 대상 아님.
- `credits.sh` 스크립트의 기능 확장/수정: 작가님+쌍아 합의.

> 근거: 2026-05-12 — 크레딧 수동 충전 시 감사 로그 부재, 접근 절차 미규정 상태에서 작가님 문제 제기. deploy.sh 패턴(ch5 2조)의 성공적 운용을 데이터 접근에 확장 적용.
> 위반 시: 크레딧 변경 추적 불가, 고객 데이터 무단 접근, 감사 증적 부재.
> 상위 헌법: 제4조(구속·윤리) 1항, 4항

---

### 11조: 시크릿 운용 규칙

**1항 — 정본 체계**

- **GCP Secret Manager** = 시크릿 단일 정본.
- **GitHub Secrets** = write-only 카탈로그 + Actions 실행용 (정본 아님).
- **.env / git** = 비밀 아닌 설정값만 (PROJECT_ID, LOCATION, GCS_BUCKET 등).
- **인벤토리 정본**: `monkos-ops/ops/SECRET_INVENTORY.md` (메타만, 값 절대 금지).

**2항 — `secret` 커맨드 경유 필수**

시크릿이 필요할 때 에이전트가 직접 값을 다루지 않는다. 작가님에게 `secret` 실행을 요청한다.

- 에이전트 확인(값 미접촉): `secret check <NAME>` (존재 + 버전만 확인).
- 에이전트 후속: SECRET_INVENTORY.md 메타 1행 추가 + deploy.sh --set-secrets 라인 추가(해당 시).
- `gcloud secrets create/versions add` 직접 실행 금지.

**3항 — 금지 사항**

- 시크릿 값 생성/추측/placeholder 금지 (헌법 4조 1항).
- 에이전트가 값을 채팅·컨텍스트·파일에 노출 금지.
- .env에 시크릿 하드코딩 후 git 커밋 금지.
- SA 키 JSON을 코드에 포함 금지.

**4항 — 실측 참고**

- GCP_SA_KEY는 plain JSON (base64 아님 — 07-16 실측 확정).
- 복원 캐시 경로: `~/.config/monkos-mcp/sa_key.json`(600). 복원 스크립트(ga4_mcp·gsc_mcp·seo_collect)는 형식 자동판별.
- "키가 없다" 보고 전 `secret check <NAME>` 또는 SECRET_INVENTORY.md를 먼저 확인한다.

> 근거: 광역오더 #8 (시크릿 운영 원칙) + 06-23 프로토콜 확정 + 07-16 실측(GCP_SA_KEY=plain JSON, 복원 스크립트 형식 자동판별 보정).
> 개정: 07-16 — data-access.md 후반부 50줄을 법률로 편입 (PETITION_20260716).
> 위반 시: 시크릿 유출, 인프라 인증 실패, 복원 스크립트 전멸.
> 상위 헌법: 제4조(구속·윤리) 1항

---

### 12조: 계층 동기화 스탬프 (2026-08-13 신설 — PETITION_20260806 #10)

**1항 — 스탬프 의무**
- 정본에서 파생되는 발췌본·배포본(`.claude/rules/` 법률 발췌 9종, 헌법 에센스 등)은 문서 머리에
  원 정본과의 동기화 기준을 **기계 판독 형식**으로 명기한다: `> source: {정본 경로}@{YYYY-MM-DD}` (자유 문장 금지).
- 날짜는 발췌·동기화 시점의 **정본 최종 개정일**이다. 정본 개정 시 대응 발췌본과 스탬프를 동시 갱신한다 (헌법 5조 1항 준용).

**2항 — 기계 대조 (조문 집행 코드화)**
- `.github/workflows/governance-check.yml`의 스탬프 대조 스텝이 발췌본 스탬프 ↔ 정본 최종 커밋일을
  비교하여 불일치 시 `::warning::`을 발한다 (비블로킹).
- 사람 감사에만 위탁하지 않는다 — **표기만 있고 대조가 없는 스탬프는 무효다** (2026-08-06 에센스 5개월 동결 실사고:
  works 배포본 스탬프는 5개월간 정확했으나 아무도 대조하지 않았다).

**3항 — 인명·디바이스 잔재 처리 원칙**
- 퇴사·폐기된 인명/디바이스는 정본·법률에서 삭제하지 않고 **실효 주석**으로 전환한다 (append-only 역사 문서의 해석 보호).
- 예외: 미래 동작을 결정하는 표(호스트네임 판별 테이블 등)에서는 **제거**한다.

> 근거: PETITION_20260806 삼권심사 — 입법(막내1)·사법(막내3) 공통 조건 C2 + 막내3 대안 4. 작가님 직접 집행 지시 (08-13).
