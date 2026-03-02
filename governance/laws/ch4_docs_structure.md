# 법률 제4장: 문서/폴더 구조

> 상위 헌법: 제3조(프로젝트 정체성)
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

docs/는 **원천 아카이브** — 프로젝트의 뿌리이자 보물창고. 보존 대상.

```
docs/
├── corpus/                    ← AI 코퍼스 (아카이브, 참조용)
│   ├── sessions/              ← 세션 로그 아카이브 (정본: monkos-ops/ops/sessions/)
│   │   ├── 2026-01/
│   │   └── 2026-02/
│   ├── gemini/
│   └── legacy/
├── infrastructure/            ← 인프라 문서
│   ├── architecture/          ← 시스템 아키텍처, API 설계
│   ├── deployment/            ← 배포 가이드, 환경 설정
│   ├── ai-models/             ← AI 모델 명세, 프롬프트 전략
│   ├── strategy/              ← 사업 전략, 브랜딩
│   ├── guides/                ← 운영 가이드, 코딩 표준
│   ├── audit/                 ← 감사, 법률 분석, 거버넌스 설계
│   └── history/               ← 프로젝트 히스토리, 실행 계획
├── monkos/                    ← 작업 문서
│   ├── tasks/                 ← 지시서 (월별)
│   │   └── YYYY-MM/
│   ├── reports/               ← 보고서 (월별)
│   │   └── YYYY-MM/
│   ├── incidents/             ← 장애 보고 (월별)
│   │   └── YYYY-MM/
│   ├── designs/               ← 설계 문서 (월별)
│   │   └── YYYY-MM/
│   └── sprints/               ← 스프린트 계획
├── specs/                     ← 기술 명세 (서비스별)
│   ├── portal/
│   ├── idphoto-kr/
│   ├── idphoto-jp/
│   └── _archive/
└── rnd_2026/                  ← R&D 문서
```

- 운영 정본(세션로그/전략/리서치)은 monkos-ops/에 있다.
- 각 폴더에 `README.md` 필수 — 해당 폴더의 역할, 네이밍 규칙, 정본 위치를 명시.

> 근거: 2026-01-11 docs/ 통합, 02-08 정리, 02-22 ops/ 중심 운영체제 확정 + 하위분류 신설, 02-23 governance/ 분리 + 4계층 위계 확정
> 작가님 원문: "옵스는 운영체제 독스는 참고문헌체제가 맞지 않나" (02-22) / "각 폴더에 리드미를 심어놓기로 했던것 같은데" (02-22)
> 위반 시: 문서 산재 → 에이전트 참조 실패, 중복 생성 반복.
> 상위 헌법: 제3조

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
5. **지시서(TASK_*) docs/monkos/ 루트 직접 배치 금지.** 반드시 `tasks/YYYY-MM/` 하위에 배치.
6. **.DS_Store, 바이너리 파일 docs/ 배치 금지.** `.gitignore`에 등록.
7. **README.md 미보유 폴더 방치 금지.** 폴더 생성 시 README.md 동시 생성 의무.

> 근거: 2026-01~02-08 초기 규칙, 02-22 이중화 해소 + README 의무화, 02-23 과도기 명확화 + 정본 경로 갱신
> 위반 시: 임시 파일 누적, 폴더 혼재 → 에이전트 탐색 실패, 문서 중복 생성.
> 상위 헌법: 제3조

---

### 3조: 파일 네이밍 규칙

파일명에서 타입/날짜/에이전트를 자동 추출 가능하도록 표준화한다.

**패턴 규격 (13종)**:

| # | 패턴 | 대상 폴더 | 예시 |
|---|------|----------|------|
| 1 | `TASK_YYYYMMDD_{agent}_{name}.md` | `docs/monkos/tasks/YYYY-MM/` | `TASK_20260222_막내3_chatbot_update.md` |
| 2 | `REPORT_YYYYMMDD_{topic}.md` | `docs/monkos/reports/YYYY-MM/` | `REPORT_20260222_문서인벤토리.md` |
| 3 | `SPEC_{service}_{feature}.md` | `docs/monkos/specs/{service}/` | `SPEC_idphoto-kr_credit-system.md` |
| 4 | `INCIDENT_YYYYMMDD_{service}.md` | `docs/monkos/incidents/YYYY-MM/` | `INCIDENT_20260220_cf-function.md` |
| 5 | `DESIGN_YYYYMMDD_{feature}.md` | `docs/monkos/designs/YYYY-MM/` | `DESIGN_20260215_tts-architecture.md` |
| 6 | `SPRINT_{range}.md` | `docs/monkos/sprints/` | `SPRINT_0217-0223.md` |
| 7 | `YYYY-MM-DD_{device}_{agent}.md` | 세션 로그 | `2026-02-22_iMac_막내3.md` |
| 8 | `YYYY-MM-DD_{agent}_통합.md` | 세션 로그 (통합) | `2026-02-22_쌍아_통합.md` |
| 9 | `YYYY-MM-DD_{agent범위}_통합.md` | 세션 로그 (복수 에이전트) | `2026-02-22_막내456_통합.md` |
| 10 | `PETITION_YYYYMMDD_{agent}_{topic}.md` | `governance/constitution/petitions/` | `PETITION_20260222_막내6_법체계자동집행기반.md` |
| 11 | `ORDER_YYYYMMDD_{topic}.md` | `monkos-ops/ops/orders/` | `ORDER_20260223_KOMOJU전수조사.md` |
| 12 | `RESEARCH_YYYYMMDD_{topic}_{detail}.md` | `monkos-ops/ops/agenda/` | `RESEARCH_20260223_긴급대행절차_선택지.md` |
| 13 | `COMPLETION_YYYYMMDD_막내N_{HHMMSS}.md` | `monkos-ops/ops/reports/` | `COMPLETION_20260225_막내1_150900.md` |
| 14 | `REVIEW_YYYYMMDD_{agent}_{topic}.md` | `monkos-ops/ops/reports/` | `REVIEW_20260302_쌍아_P0_스키마_정합검토.md` |

**표기 규칙**:
- 에이전트명: `쌍아`, `막내3`, `소넷이`, `한`, `꾸` 등 (디바이스 접두어 불포함)
- 날짜: `YYYYMMDD` (세션 로그만 예외로 `YYYY-MM-DD`)
- 한글 파일명: 기존 유지, 신규는 영문 권장

**적용 범위**:
- docs/monkos/ 하위 전 유형
- governance/constitution/petitions/
- monkos-ops/ 하위 TASK_*, REPORT_*, PETITION_*, ORDER_*, RESEARCH_*, COMPLETION_*

**적용 제외**:
- docs/infrastructure/ — 원천 아카이브(보물창고). 기존 네이밍 유지, 3조 관할 밖.
- governance/laws/ — 법률 파일은 ch별 고정 네이밍.
- 세션 로그 — 패턴 #7~#9 전용.
- `monkos-ops/ops/reports/data/` — 자동 생성 데이터 출력물 (8조 6항).

**기존 파일 정비**:
- 접두사 미보유 기존 파일은 내용 확인 후 적절한 유형 접두사를 부여하거나, 해당 유형이 없으면 ch4 6조 5항 절차로 신규 유형을 등록한다.
- 정비 시한: 강제 없음. 해당 파일을 수정하는 시점에 함께 정비한다.

> 근거: 2026-02-22 문서 인벤토리 조사 — 준수율 62.7%, 자동 분류 불가 판정, 02-23 PETITION 등록 + 적용 범위 명시, 02-23 ORDER/RESEARCH 유형 등록 (막내A 전수조사 + 막내B 개정안 기반), 02-25 COMPLETION 유형 등록 (PETITION_20260225, 막내5·6 검수 통과, 작가님 승인)
> 위반 시: 패턴 미매칭 → 자동 분류 실패, 에이전트 탐색 비용 증가.
> 상위 헌법: 제3조

---

### 4조: 정본 위치 규칙

`governance/`(법적 정본) · `docs/`(참고문헌) · `monkos-ops/`(운영체제) 간 정본을 정의한다.

**정본 테이블**:

| 영역 | 정본 위치 | 참조/아카이브 | 비고 |
|------|----------|-------------|------|
| 법률/헌법 | `governance/laws/` | `docs/infrastructure/laws/` (리다이렉트) | 개헌 826060d |
| 개정 절차 | `governance/constitution/` | — | 개헌 826060d |
| 청구서 | `governance/constitution/petitions/` | — | 개헌 826060d |
| 철학 | `governance/philosophy/` | — | 개헌 826060d |
| 세션 로그 | `monkos-ops/ops/sessions/` | `docs/corpus/sessions/` (아카이브) | 신규는 정본에만 |
| 전략 문서 | `monkos-ops/ops/` | — | ops가 원본 |
| 리서치 | `monkos-ops/tech/` | `docs/rnd_2026/` | tech가 원본 |
| 기술 스펙 | `monkos-ops/tech/specs/` | `docs/specs/` (아카이브) | tech가 원본 |
| 코드 리뷰 | `monkos-ops/tech/reviews/` | — | tech가 원본 |
| 지시서 | `docs/monkos/tasks/` | — | docs가 정본 |
| 보고서 | `docs/monkos/reports/` | — | docs가 정본 |
| 오더 (ORDER) | `monkos-ops/ops/orders/` | — | ops가 정본. 작가님 의지 |
| 리서치 (RESEARCH) | `monkos-ops/ops/agenda/` | — | 어젠다 연계 |
| 완료 보고 (COMPLETION) | `monkos-ops/ops/reports/` | — | 막내 완료 보고 전용 |
| 팀 공유 | `monkos-ops/marketing/` | — | marketing 전용 |
| 에셋 레지스트리 | `docs/infrastructure/ASSET_REGISTRY.md` | — | 전 저장소 통합 인덱스 |
| 범용 유틸 스크립트 | `scripts/` | — | 막내 소관 |

**원칙**:
- 정본은 **하나만** 존재한다. 참조본은 읽기전용(수정 금지).
- 양쪽에 동일 문서 발견 시: 정본 판정 → 비정본 삭제 또는 리다이렉트 노트.
- 번호 폴더(01_전략~06_로그)는 레거시다. 신규 문서는 4부서 경로에 생성한다.
- 번호 폴더 → 4부서 이관이 완료되면 번호 폴더를 삭제하고 본 테이블을 갱신한다.

> 근거: 2026-02-22 — 세션 로그/전략 문서 이중화 발견, ops 중심 운영체제 확정, 02-23 governance 개헌 + ops 4부서 재편, 02-25 COMPLETION 정본 등록 (PETITION_20260225, 막내5·6 검수 통과, 작가님 승인)
> 작가님 원문: "옵스는 운영체제 독스는 참고문헌체제" / "두개가 되면 혼선이 되니" (02-22)
> 위반 시: 정본 불명 → 에이전트가 구버전 참조, 데이터 불일치.
> 상위 헌법: 제3조

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
| `ops` | 운영 체계 (monkos-ops) | 비배포 (인프라) |

- 신규 서비스 추가 시 이 테이블에 등록 필수.
- 파일명의 `{service}` 필드는 이 레지스트리의 약칭만 허용.

> 근거: 2026-02-22 통합 스키마 제정 — 서비스 약칭 미정의로 {service} 필드 혼란
> 위반 시: 파일명/폴더명 불일치 → 자동 분류 실패
> 상위 헌법: 제3조

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
3. `monkos-ops/03_개발/specs/{서비스}/` 폴더 + README.md 생성
4. `docs/specs/{서비스}/` 폴더 + README.md 생성 (참고문헌용)

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
   - 시크릿 → 환경변수 (절대 Git 금지, 헌법 6조)
3. `docs/infrastructure/ASSET_REGISTRY.md` 해당 카테고리 테이블에 행 추가
4. 상세 문서 해당 시 참조 링크 기재 (GCS_BUCKET_STRUCTURE.md 등)

> 근거: 2026-02-22 통합 스키마 제정 — 신규 편입 시 법적 근거 부재, 02-23 디바이스 물리확인 + governance 폴더 편입 + YAML 연동 + 에셋 편입 절차 신설
> 위반 시: 비정규 요소 편입 → 스키마 오염, 자동 분류 파괴
> 상위 헌법: 제3조

---

### 7조: YAML Frontmatter 규격

헌법 제13조에 따라, 모든 공식 문서에 YAML frontmatter를 필수 기재한다.

**적용 범위**:
- governance/constitution/petitions/*.md
- docs/monkos/ 하위 전 유형 (tasks, reports, incidents, designs, specs)
- monkos-ops/ 하위 TASK_*, REPORT_*, PETITION_*, ORDER_*, RESEARCH_*, COMPLETION_* 파일

**적용 제외**:
- 법률 파일 (governance/laws/ch*.md) — 법률은 그 자체가 규격
- 세션 로그 — ch3 2조(형식) 준용
- README.md — type: department-readme 권장, 필수 아님
- 기존 파일 — 신규 생성분부터 적용 (헌법 제13조 소급 방지)

#### 공통 필수 필드 (전 타입)

| 필드 | 타입 | 규칙 | 예시 |
|------|------|------|------|
| `type` | enum | 하단 허용값 | `task` |
| `id` | string | 파일명(확장자 제외)과 동일 | `TASK_20260223_막내6_ch4개정안` |
| `date` | string | `YYYY-MM-DD HH:MM KST` (헌법 제1조) | `2026-02-23 04:10 KST` |
| `status` | enum | pending / in_progress / completed / archived / blocked | `pending` |

**type 허용값**: task, report, spec, incident, design, sprint, petition, order, research, completion, review

#### 타입별 추가 필수 필드

| 타입 | 필수 | 선택 |
|------|------|------|
| task | `from`, `to`, `priority`(P0~P3) | `depends_on`, `tags` |
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

#### 검증 규칙

- `from`/`to`: ch1 1조 에이전트 테이블의 이름만 허용
- `priority`: P0(긴급) > P1(높음) > P2(보통) > P3(낮음)
- `service`: ch4 5조 레지스트리 약칭만 허용
- `id`와 파일명 불일치 시: 파일명이 우선 (id 보정 대상)

#### 긴급 예외 (헌법 제13조 준용)

긴급 장애 대응(INCIDENT) 시: `type`, `date`만으로 허용. 24시간 내 전 필드 보정.

> 근거: 2026-02-23 법률 개정 — 헌법 제13조 실효화. YAML = 법과 코드의 접점, 자동 집행의 물리 계층, 02-25 completion 유형 등록 (PETITION_20260225, 막내5·6 검수 통과, 작가님 승인)
> 위반 시: 자동 분류 불가, 데몬 파싱 실패, 문서 관리 수동 의존
> 상위 헌법: 제13조

---

### 8조: 데이터 운영 규칙

> 상위 헌법: 제6조(인프라 보호), 제8조(파괴적 명령 금지), 제11조(윤리적 운용), 제13조(문서 규격)

데이터 접근·보관·삭제·고객 응대 증빙 처리에 관한 운영 규칙을 정한다.

**1항: 접근 등급**

데이터 접근 권한을 3등급으로 분류한다.

| 등급 | 대상 | 권한 범위 |
|------|------|----------|
| **L1** (관리자) | 작가님, 에이전트 (쌍아/막내/소넷이) | 전 데이터 읽기/쓰기/삭제 |
| **L2** (운영자) | 꾸 | SSH 접근, 고객 문의 대응 범위 조회 |
| **L3** (조회자) | 한송이 | 텔레그램 경유 통계 조회 (매출/사용량/전환율) |

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
> 상위 헌법: 제6조(인프라 보호), 제8조(파괴적 명령 금지), 제11조(윤리적 운용), 제13조(문서 규격)
