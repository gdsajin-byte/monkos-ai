# 법률 제4장: 문서/폴더 구조

> 상위 헌법: 제3조(프로젝트 정체성)
> 변경 권한: 작가님 승인 시 개정 가능

---

### 1조: docs/ 구조

```
docs/
├── corpus/                    ← AI 코퍼스 (아카이브, 참조용)
│   ├── sessions/              ← 세션 로그 아카이브 (정본: monkos-ops/06_로그/)
│   │   ├── 2026-01/
│   │   └── 2026-02/
│   ├── gemini/
│   └── legacy/
├── infrastructure/            ← 인프라 문서
│   ├── laws/                  ← 법률 (정본)
│   ├── architecture/          ← 시스템 아키텍처, API 설계
│   ├── deployment/            ← 배포 가이드, 환경 설정
│   ├── ai-models/             ← AI 모델 명세, 프롬프트 전략
│   ├── strategy/              ← 사업 전략, 브랜딩
│   └── guides/                ← 운영 가이드, 코딩 표준
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

- docs/는 **참고문헌 체계**다. 운영 정본(세션로그/전략/리서치)은 monkos-ops/에 있다.
- 각 폴더에 `README.md` 필수 — 해당 폴더의 역할, 네이밍 규칙, 정본 위치를 명시.

> 근거: 2026-01-11 docs/ 통합, 02-08 정리, 02-22 ops/ 중심 운영체제 확정 + 하위분류 신설
> 작가님 원문: "옵스는 운영체제 독스는 참고문헌체제가 맞지 않나" (02-22) / "각 폴더에 리드미를 심어놓기로 했던것 같은데" (02-22)
> 위반 시: 문서 산재 → 에이전트 참조 실패, 중복 생성 반복.
> 상위 헌법: 제3조

---

### 2조: 금지 사항

1. **루트에 임시 .md 파일 방치 금지.**
2. **언더스코어 폴더 사용 금지.** (`_archive/` 예외)
3. **문서 정본 이중화 금지.** 동일 문서가 docs/와 monkos-ops/ 양쪽에 정본으로 존재할 수 없다.
4. **세션 로그 이중화 금지.** 정본: `monkos-ops/06_로그/sessions/`. `docs/corpus/sessions/`는 읽기전용 아카이브. 신규 세션 로그는 정본에만 생성.
5. **지시서(TASK_*) docs/monkos/ 루트 직접 배치 금지.** 반드시 `tasks/YYYY-MM/` 하위에 배치.
6. **.DS_Store, 바이너리 파일 docs/ 배치 금지.** `.gitignore`에 등록.
7. **README.md 미보유 폴더 방치 금지.** 폴더 생성 시 README.md 동시 생성 의무.

> 근거: 2026-01~02-08 초기 규칙, 02-22 이중화 해소 + README 의무화
> 위반 시: 임시 파일 누적, 폴더 혼재 → 에이전트 탐색 실패, 문서 중복 생성.
> 상위 헌법: 제3조

---

### 3조: 파일 네이밍 규칙

파일명에서 타입/날짜/에이전트를 자동 추출 가능하도록 표준화한다.

**패턴 규격 (7종)**:

| # | 패턴 | 대상 폴더 | 예시 |
|---|------|----------|------|
| 1 | `TASK_YYYYMMDD_{agent}_{name}.md` | `tasks/YYYY-MM/` | `TASK_20260222_막내3_chatbot_update.md` |
| 2 | `REPORT_YYYYMMDD_{topic}.md` | `reports/YYYY-MM/` | `REPORT_20260222_문서인벤토리.md` |
| 3 | `SPEC_{service}_{feature}.md` | `specs/{service}/` | `SPEC_idphoto-kr_credit-system.md` |
| 4 | `INCIDENT_YYYYMMDD_{service}.md` | `incidents/YYYY-MM/` | `INCIDENT_20260220_cf-function.md` |
| 5 | `DESIGN_YYYYMMDD_{feature}.md` | `designs/YYYY-MM/` | `DESIGN_20260215_tts-architecture.md` |
| 6 | `SPRINT_{range}.md` | `sprints/` | `SPRINT_0217-0223.md` |
| 7 | `YYYY-MM-DD_{device}_{agent}.md` | 세션 로그 | `2026-02-22_iMac_막내3.md` |

**표기 규칙**:
- 에이전트명: `쌍아`, `막내3`, `소넷이`, `한`, `꾸` 등 (디바이스 접두어 불포함)
- 날짜: `YYYYMMDD` (세션 로그만 예외로 `YYYY-MM-DD`)
- 한글 파일명: 기존 유지, 신규는 영문 권장

> 근거: 2026-02-22 문서 인벤토리 조사 — 준수율 62.7%, 자동 분류 불가 판정
> 위반 시: 패턴 미매칭 → 자동 분류 실패, 에이전트 탐색 비용 증가.
> 상위 헌법: 제3조

---

### 4조: monkos-ops 연동 규칙

`docs/`(참고문헌)와 `monkos-ops/`(운영체제) 간 역할을 분리한다.

**역할 분리**:

| 영역 | 정본 위치 | 참조/아카이브 | 비고 |
|------|----------|-------------|------|
| 세션 로그 | `monkos-ops/06_로그/sessions/` | `docs/corpus/sessions/` (아카이브) | 신규는 정본에만 |
| 전략 문서 | `monkos-ops/01_전략/` | `docs/infrastructure/strategy/` | ops가 원본 |
| 리서치 | `monkos-ops/02_리서치/` | `docs/rnd_2026/` | ops가 원본 |
| 지시서/보고서 | `docs/monkos/tasks/`, `reports/` | — | docs가 정본 |
| 팀 공유 | `monkos-ops/05_공유/` | — | ops 전용 |
| 법률/헌법 | `docs/infrastructure/laws/` | — | docs 전용 |

**원칙**:
- 정본은 **하나만** 존재한다. 참조본은 읽기전용(수정 금지).
- 양쪽에 동일 문서 발견 시: 정본 판정 → 비정본 삭제 또는 리다이렉트 노트.

> 근거: 2026-02-22 — 세션 로그/전략 문서 이중화 발견, ops 중심 운영체제 확정
> 작가님 원문: "옵스는 운영체제 독스는 참고문헌체제" / "두개가 되면 혼선이 되니" (02-22)
> 위반 시: 정본 불명 → 에이전트가 구버전 참조, 데이터 불일치.
> 상위 헌법: 제3조
