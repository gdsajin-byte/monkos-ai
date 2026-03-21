---
type: REPORT
date: 2026-03-14
time: "18:30 KST"
from: iMac/막내1
to: iMac/쌍아
order: ORDER_20260314_iMac쌍아_막내1_docs정밀보고_monkos_infra사문화.md
status: completed
---

# 보고서: docs/ 정밀 보고 — monkos 193건 + infrastructure 사문화 9건

> **[2026-03-14 18:30 KST] iMac/막내1 → iMac/쌍아**
> 리서치 전용. 실제 이동/삭제 미수행 (법률 ch7 3조 준수).

---

## 1. docs/monkos/ 정밀 재분류 (192건)

### 1-1. 총괄

| 분류 | 건수 | 처리 제안 |
|------|------|----------|
| ops 정본 중복 | **0건** | — |
| ops 미이관 | **5건** | 경로 이동/이관 검토 |
| 역사적 가치 (아카이브 보존) | **174건** | 현행 동결 유지 |
| 사문화 | **4건** | 삭제 제안 |
| README (아카이브 인덱스) | **9건** | 유지 |
| **합계** | **192건** | |

### 1-2. TASK/ORDER 중복 분석 (핵심)

**결론: 내용 중복 0건.**

병행 구간(02-18~02-25) 실제 내용 비교 결과:

| 날짜 | TASK 건수 | ORDER 건수 | 중복 | 근거 |
|------|-----------|-----------|------|------|
| 02-16~17 | 15건 | 0건 | — | TASK만 존재 |
| 02-18 | 6건 | 12건 | **0건** | TASK=CF디버그/generate/유령URL, ORDER=photolab분리/mirror4060. 주제 완전 분리 |
| 02-19 | 0건 | 12건 | — | ORDER만 존재 |
| 02-20~22 | 79건 | 0건 | — | TASK만 (거버넌스/법률/ops체계 수립) |
| 02-23 | 14건 | 6건 | **0건** | TASK=ch4개정/memory, ORDER=KOMOJU/철창이/토스. 주제 완전 분리 |
| 02-24 | 9건 | 0건 | — | TASK만 존재 |
| 02-25 | 10건 | 14건 | **0건** | TASK=아키텍처설계, ORDER=크레딧게이트/헤더이식. 주제 완전 분리 |

**이중 발행 건 없음.** 이전 보고서의 "시간적 분리" 판단은 정확했음이 내용 비교로 확인됨.

### 1-3. REPORT 중복 분석

**결론: 내용 중복 0건.**

- `docs/monkos/reports/2026-02/` (34건): 02-22~02-25 거버넌스 수립기 산출물
- `monkos-ops/ops/reports/2026-02/`: 02-25 이후 크레딧게이트/서버모듈화 산출물
- 동일 파일명 0건, 주제 겹침 없음 (docs=거버넌스/아키텍처/법률, ops=크레딧/모듈화/배포)

### 1-4. ops 미이관 — 5건

| # | 파일 | 사유 | 제안 이관 경로 |
|---|------|------|---------------|
| 1 | `tasks/2026-02/REPORT_20260224_막내4_입법심사.md` | tasks/에 혼입된 REPORT (유일본) | `docs/monkos/reports/2026-02/`로 이동 |
| 2 | `tasks/2026-02/REPORT_20260224_막내5_행정심사.md` | 동상 | 동상 |
| 3 | `tasks/2026-02/REPORT_20260224_막내6_사법심사.md` | 동상 | 동상 |
| 4 | `specs/SPEC_CREDIT_V2.md` | 크레딧 체계 v2 확정 명세. 현행 과금 체계의 원본 근거 | `monkos-ops/tech/specs/` 이관 검토 |
| 5 | `designs/DESIGN_20260219_prep_room_schema.md` | 준비실 카드 스키마 설계. 현행 UI의 기반 설계 | `monkos-ops/tech/designs/2026-02/` 이관 검토 |

> 1~3번은 tasks/에 잘못 배치된 REPORT 파일이나, docs/monkos/ 자체가 동결이므로 이동 여부는 작가님 판단.
> 4~5번은 현행 서비스의 원본 근거 문서이나, 동결 상태에서 현위치 유지도 유효.

### 1-5. 역사적 가치 — 174건 (대표 5건)

| # | 파일 | 설명 |
|---|------|------|
| 1 | `incidents/INCIDENT_20260216_deployment.md` | 프로젝트 최초 배포 사고 로그. 유일본 |
| 2 | `reports/2026-02/REPORT_20260222_Phase1종합_법률반영안.md` | 법률 체계 수립의 시작점. 거버넌스 탄생 원본 |
| 3 | `reports/2026-02/REPORT_20260225_쌍아_MONK_OS_3계층아키텍처_정합제안서.md` | 현행 CLAUDE.md 아키텍처의 원형 설계서 |
| 4 | `sprints/SPRINT_D1D3_20260217.md` | 서비스 론칭 최초 스프린트 계획표 |
| 5 | `specs/SPEC_PLANB_idphoto_refactoring.md` | Plan B 리팩토링 명세. 8회 연속 배포 실패 대응 기록 |

**판정 근거:** 02-16~02-25는 MONK OS 거버넌스 수립기+서비스 론칭기. 이 기간의 지시서/보고서는 "왜 현재 구조가 이렇게 되었는가"를 추적하는 유일한 원본. monkos-ops/에 복제본 없음. README에 이미 "아카이브 동결" 경고 표기 완료.

### 1-6. 사문화 — 4건

| # | 파일 | 사유 |
|---|------|------|
| 1 | `sprints/work_queue.md` | 텔레그램 큐 잔해. "현재 대기 중인 작업 없음" 상태. 01-30 마지막 기록. ORDER_ 체계로 대체 완료 |
| 2 | `tasks/TASK_TEMPLATE.md` | 구 TASK_ 체계 서식. ORDER_ 체계에서 미사용. 02-22 작성 후 실질 사용 이력 없음 |
| 3 | `specs/TELEGRAM_DEPLOY_GUIDE.md` | Firebase Functions 기반 웹훅 구조. 현행 봇과 괴리. 비표준 네이밍 (SPEC_ 접두사 미사용) |
| 4 | `specs/YONGA.md` | 비활성 에이전트(Gemini 용아) 페르소나 정의. **경계선** — governance/PERSONNEL_REGISTRY.md에 용아가 등록 에이전트이므로 재활성화 시 참조 가치 있음 |

---

## 2. docs/infrastructure/ 사문화 9건 상세

### 전건 상세 분석

#### 1. `deployment/GCS_BACKUP_SETUP.md`
- **작성일**: 2026-01-16 | **분량**: 92줄
- **내용**: GCP Service Account → CF Workers → GCS 회원 데이터 백업 가이드. JWT 서명 미완성 경고 포함.
- **판정: 삭제** — 미완성 상태의 폐기 인프라. D1 기반으로 전환됨. `GCS_BUCKET_STRUCTURE.md`가 정본으로 대체.

#### 2. `deployment/GPU_VM_SETUP_L4.md`
- **작성일**: 2026-01-09 | **분량**: 482줄
- **내용**: NVIDIA L4 x 2 GPU VM 세팅 가이드. 월 $1,500, 3개월 마일스톤. `# TODO: 실제 학습 로직` 잔류.
- **판정: 삭제** — 미실행 구상. 마일스톤 체크박스 1개만 체크. "슈퍼용아/슈퍼민아" 개념 폐기. TODO skeleton 코드.

#### 3. `deployment/HOME_RESTART_GUIDE.md`
- **작성일**: 2026-01-08 | **분량**: 302줄
- **내용**: 사무실→집 작업 이어가기용 1회성 핸드오프 메모. Vertex AI 프록시 재배포, "폰으로 찍어서 확인하세요" 문구.
- **판정: 삭제** — 하루 저녁용 즉석 메모. vertex-ai-proxy 폐기, Cursor 체계 전환. 참조 경로(`_saga/`) 존재하지 않음.

#### 4. `deployment/VERTEX_VM_SETUP_GUIDE.md`
- **작성일**: 2026-01-09 | **분량**: 467줄
- **내용**: GCP e2-standard-4 VM에 Code Server(웹 VS Code) 설치 가이드. 260만원 크레딧 활용.
- **판정: 삭제** — 미실행 + **비밀번호 평문 노출(`monk2026!`)**. 헌법 제4조(인프라 보호) 위반 소지. 보안상 삭제 권장.

#### 5. `guides/CLAUDE_CODE_SETUP_GUIDE.md`
- **작성일**: 2026-01-24 | **분량**: 161줄
- **내용**: Cursor에서 Claude Code 확장 설치 + Claude Max API 키 연결 가이드. Opus 4.5 기준.
- **판정: 삭제** — 구버전(Opus 4.5) + 구환경(Cursor). CLI 전환 완료. 체크리스트 전부 미체크(`[ ]`).

#### 6. `guides/SCRIPTS_CLEANUP_GUIDE.md`
- **작성일**: 2026-01-08 | **분량**: 224줄
- **내용**: `MONK_kr/monk_cs/` 스크립트 정리 제안서. 폴더 분리 계획 + 자동 정리 스크립트.
- **판정: 삭제** — **대상 디렉토리(`monk_cs/`) 자체가 현재 존재하지 않음.** 적용 불가능.

#### 7. `strategy/context_README_legacy.md`
- **작성일**: 2026-01-10 | **분량**: 24줄
- **내용**: `.context/` 폴더 README. 용아 전략 대화 + 프로젝트 컨텍스트 저장 구조 설명.
- **판정: 삭제** — 파일명 자체에 `legacy` 명시. `.context/` 폴더 체계 → CLAUDE.md/MEMORY.md 체계로 전면 교체. 참조 대상 부재.

#### 8. `strategy/project_vision_context.md`
- **작성일**: 2026-01-10 | **분량**: 31줄
- **내용**: 프로젝트 비전 skeleton. 80% 이상이 빈 placeholder ("(Gemini와 논의한 장기 비전)", "(수익 구조, 가격 전략 등)").
- **판정: 삭제** — 내용 부재. **"4 MUSE 시스템" 명칭 노출로 헌법 제4조(내부 기밀 보호) 위반 소지.**

#### 9. `strategy/yonga_strategy_context.md`
- **작성일**: 2026-01-07 | **분량**: 39줄
- **내용**: 용아 전략 대화 기록 템플릿. "여기에 Gemini 대화창에서 복사해서 붙여넣기" placeholder만 존재.
- **판정: 삭제** — 빈 템플릿. 이 워크플로우(수동 복붙) 자체 미채택. **"4 MUSE 시스템", "소소", "민아" 내부 명칭 노출.**

### 종합 판정

| # | 파일 | 줄 수 | 최종 판정 | 핵심 사유 |
|---|------|-------|----------|----------|
| 1 | GCS_BACKUP_SETUP.md | 92 | **삭제** | 미완성 + 폐기 인프라 |
| 2 | GPU_VM_SETUP_L4.md | 482 | **삭제** | 미실행 구상 + TODO skeleton |
| 3 | HOME_RESTART_GUIDE.md | 302 | **삭제** | 1회성 즉석 메모 |
| 4 | VERTEX_VM_SETUP_GUIDE.md | 467 | **삭제** | 미실행 + 비밀번호 평문 노출 |
| 5 | CLAUDE_CODE_SETUP_GUIDE.md | 161 | **삭제** | 구버전/구환경 가이드 |
| 6 | SCRIPTS_CLEANUP_GUIDE.md | 224 | **삭제** | 대상 디렉토리 소멸 |
| 7 | context_README_legacy.md | 24 | **삭제** | legacy 명시 + 참조 부재 |
| 8 | project_vision_context.md | 31 | **삭제** | 빈 placeholder + 내부 명칭 노출 |
| 9 | yonga_strategy_context.md | 39 | **삭제** | 빈 템플릿 + 내부 명칭 노출 |

**전 9건 삭제 판정. 총 1,822줄.** 전부 2026년 1월(프로젝트 초기) 작성. git history에서 복원 가능.

> 특이사항: 4번(VERTEX_VM_SETUP_GUIDE.md)의 비밀번호 `monk2026!` 평문 노출 — git history에도 남아 있으므로, 해당 비밀번호가 실제 사용 중이라면 변경 필요.

---

## 3. 이전 보고서와의 차이

| 항목 | 이전 보고서 | 본 정밀 보고 |
|------|-----------|-------------|
| monkos/ 분류 | "전량 레거시" 일괄 | 4분류(중복0/미이관5/역사174/사문화4) |
| TASK/ORDER 중복 | "시간적 분리" 추정 | 내용 비교로 0건 확정 |
| monkos/ 삭제 제안 | 2건 | 4건 (+TELEGRAM_DEPLOY, YONGA) |
| infrastructure/ 사문화 | 8건 (파일명 수준) | 9건 (전건 내용 요약 + 판정 근거) |
| 보안 이슈 | 미식별 | VERTEX_VM 비밀번호 노출 + 2건 내부명칭 노출 |
