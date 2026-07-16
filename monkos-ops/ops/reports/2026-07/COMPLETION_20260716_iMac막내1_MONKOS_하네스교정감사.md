---
type: completion
date: 2026-07-16
device: iMac
agent: 막내1
portfolio: PF_MONK_OS
status: 완료
order: ORDER_20260716_iMac쌍아_막내1_MONKOS_하네스교정_전수감사.md
---

# MONK OS 하네스 교정 방향 전수 감사 — 완료 보고

**[2026-07-16 14:14 KST]** iMac/막내1 → 작가님

---

## A: 헌법(CLAUDE.md) 현행 정합 점검

**전체 5조 20개 항 중 대부분 현행 정합. P1 이슈 2건 발견.**

### 정상 조항

- 제1조 전 항: 에이전트 8명 체계, 꾸 경로④ 반영 완료, 정체성 보존 선언 정합
- 제2조 전 항: 수발신 헤더 규격, 피드백 의무 — rules와 일치
- 제3조 전 항: PF 갱신 의무, append-only, 정본 단일 원칙 — pf-ops.md/session-log.md와 정합
- 제4조 전 항: 비밀정보 보호, 파괴적 명령 금지 — data-access.md/git-safety.md와 정합
- 제5조 전 항: 4계층 위계, 개정 절차, 에이전트 대응 프로토콜 — 현행 일치

### 불일치

| 조항 | 문제점 | 심각도 |
|------|--------|--------|
| 제1조 2항 경로③ | "민아 실행" 표현 ↔ 법률 ch1 5항 "민아는 코드 비접촉, 진단/검증만". rules의 agent-system.md도 법률 버전 기술. 헌법 본문만 불일치 | **P1** |
| 법률 인덱스 하단 | `.claude/rules/references.md` 참조하나 해당 파일 미존재 | **P1** |
| 제4조 3항 네이밍 | `soso_` 접두사가 에이전트 역할표에 없는 소소를 지칭 — 현행 비대칭 | P2 |
| 헤더 7행 | `Claude Code (Opus 4.6)` 고정 — 모델 환경 유동적이나 현시점 일치 | P2 |

### 법률 인덱스 파일

ch1~ch8 전부 실재. `governance/constitution/amendment.md` 실재.

### 개정 이력

3건(03-25, 03-26, 06-12) 전부 본문 반영 일치. 구 7조 매핑 경고(202행) 적절.

---

## B: 법률↔룰스 정합 매트릭스

**46개 조항 교차 대조. 높음 2건, 중간 2건 발견.**

### 높음 불일치 (2건)

| 항목 | 법률 | 룰스 | 문제 |
|------|------|------|------|
| 커밋 메시지 형식 | ch6 3조: `[feature]`, `[fix]`, `[design]` 등 6종 (대괄호+정식명) | git-safety.md: `feat`, `fix`, `ops` 등 12종 (약어, 대괄호 미표기) | **실제 git log는 룰스 형식**. 법률이 현행 미반영 |
| 에스컬레이션 횟수 | ch7 4조: 에러 **5회** 반복 | makne-guard.md: 에러 **3회** 반복 | 어느 쪽이 정본인지 불명. 통일 필요 |

### 중간 불일치 (2건)

| 항목 | 문제 |
|------|------|
| 시크릿 운용 원칙 | data-access.md 후반부 50줄(secret 커맨드 경유, SA 확인 등)이 어떤 법률에도 편입되지 않음. "광역오더 #8" 근거만 존재 |
| ch4 8조 데이터 운영 | 얼굴사진=생체정보, 서버 미보관 등 핵심 운영 원칙이 rules에 미반영 |

### 미반영 법률 조항 (중요도 있는 것)

- ch5 3조 (prod 배포 권한): "작가님/쌍아만 실행 가능"이 deployment.md에 미기재
- ch1 2조 5항 (긴급 예외): P0 장애 시 민아 코드 수정 허용 조건 미반영

### 6/10 삼권분석 미반영 잔여

- **미반영 1건**: CLAUDE.md 제5조 1항 물리 위치 테이블에서 법률과 rules가 같은 행에 병기 → rules가 법률 정본으로 오인 가능
- **반영 완료 8건**: rules 3개 신설, references.md 삭제, cdp-browser 이관, ch7 조 수 보정, git-safety 축소, skills 조항번호 보정
- **미확인**: CI 자동 집행 8건 (본 감사 범위 밖)

### ch2 인프라 상수 금지 조항

**편입 적합 판정**. ch2에 7조 신설 권고. 근거: ch5 2조의 "리전 하드코딩 금지"를 코드 전반으로 일반화. coding.md에 1줄 추가 + CLAUDE.md 인덱스 조 수 갱신(6→7).

---

## C: 스킬 현행 점검 (20개)

### 스킬별 판정

| 스킬 | 판정 | 핵심 사유 |
|------|------|---------|
| portal-context | **심각 구식** | rev 00133→00489(356차이), 파일 25개 누락, v3/v4 구분 소멸 |
| deploy-cr | 경미 구식 | crop-engine 서비스 미등재 (5→6개) |
| makne-finish | 경미 구식 | `git push` vs `mk-push.sh` 불일치 |
| cdp-browser | 경미 구식 | 도구명 대소문자 불일치 (Claude_in_Chrome → claude-in-chrome) |
| session-start | 정상 | — |
| session-end | 정상 | — |
| session-checkpoint | 정상 | — |
| deploy-cf | 정상 | — |
| escalation | 정상 | 법률(5회)과 일치. makne-guard(3회)가 불일치 측 |
| order-write | 정상 | — |
| pf-declare | 정상 | — |
| pf-status | 정상 | — |
| health-check | 정상 | — |
| model-check | 정상 | — |
| registry-add | 정상 | — |
| kku-blog | 정상 | — |
| kku-context | 정상 | — |
| kku-specs | 정상 | — |
| secret-audit | 정상 | — |
| seo-query | 정상 | — |

### 부재 스킬 (신설 검토 필요)

| 스킬명 | 근거 |
|--------|------|
| **specs-context** | PF_SPECS active, render-specs.js/specs-data.json 반복 작업. 오늘 설계서에 기안됨 |
| **headshot-context** | 관련 파일 분산(lib/headshot-*.js, render-headshot.js, public/js/headshot.js) |
| **vton-context** | lib/vton/ 디렉토리, PF_STYLER 존재, 신규 기능 영역 |
| **idphoto-context** | 별도 deploy.sh/도메인 독립 서비스, PF_IDPHOTO 존재 |

---

## D: 메모리 감사 (40개 파일)

### 인덱스 정합

- MEMORY.md 링크 38개: **전부 정상** (깨진 링크 0)
- 디스크 파일 40개 중 **고아 2개** (MEMORY.md 미등록):
  - `feedback_pre_deploy_cross_verify.md`
  - `project_hansong_departure.md`

### 개별 판정 요약

| 판정 | 건수 | 파일 |
|------|------|------|
| 현행 | 34 | (대다수) |
| 구식 | 2 | `feedback_secret_key_ops.md` (gcloud 직접 → secret 커맨드 경유로 변경됨), `project_model_placement.md` (7/12 구독 종료 후 미반영) |
| 구식 여지 | 1 | `feedback_fable_owner_level_output.md` (Fable 전제 변동 가능) |
| 삭제후보 | 1 | `project_hansong_departure.md` (MEMORY.md 인라인 + PERSONNEL_REGISTRY 3중 중복) |
| 등록 필요 | 1 | `feedback_pre_deploy_cross_verify.md` (고아, 내용 유효) |

### frontmatter 미준수

| 파일 | 이슈 |
|------|------|
| `project_persona_separation.md` | `name: ""` (빈 문자열) |
| `project_origin_narrative.md` | FLAT 구조 (유일한 비표준, 기능 문제 없음) |

---

## E: 종합 교정 권고

### P0 — 즉시 교정 (명백한 오류, 코드 수정 불필요)

| # | 항목 | 소속 | 조치 |
|---|------|------|------|
| 1 | **커밋 메시지 형식 불일치** | ch6 3조 | 법률을 현행 운용(룰스 형식: `[feat]`, `[ops]` 등 12종)으로 개정 |
| 2 | **에스컬레이션 횟수 불일치** | ch7 4조 ↔ makne-guard.md | 3회 vs 5회 — 어느 쪽으로 통일할지 작가님 판단 후 한쪽 수정 |
| 3 | **portal-context 심각 구식** | .claude/commands/ | rev, 파일 구조, 서비스 도메인 전면 재작성 필요 |
| 4 | **`.claude/rules/references.md` 미존재** | 헌법 법률 인덱스 | 파일 생성 또는 헌법에서 참조 삭제 |
| 5 | **feedback_secret_key_ops.md 구식** | 메모리 | "gcloud 직접 처리" → "`secret` 커맨드 경유 필수"로 갱신 |
| 6 | **project_model_placement.md 구식** | 메모리 | 7/12 구독 종료 후 현행 상태 반영 |

### P1 — 설계 필요 (구조적 변경)

| # | 항목 | 소속 | 조치 |
|---|------|------|------|
| 7 | **ch2 7조 인프라 상수 분산 금지** 신설 | 법률 ch2 | DESIGN_20260716에 따라 조항 신설 + coding.md 반영 + CLAUDE.md 조 수 갱신 |
| 8 | **시크릿 운용 원칙 법률 편입** | ch4 10조 확장 또는 11조 | data-access.md 후반부 50줄을 법률에 편입 |
| 9 | **헌법 제1조 2항 경로③ 보정** | CLAUDE.md | "민아 실행" → "민아 진단/검증 + 보고" (법률 ch1 5항과 정합) |
| 10 | **specs-context 스킬 신설** | .claude/commands/ | DESIGN_20260716에 따라 작성 |
| 11 | **deploy-cr 서비스 맵 확장** | .claude/commands/ | crop-engine 추가 (5→6서비스) |
| 12 | **5조 1항 물리 위치 테이블 보정** | CLAUDE.md | 법률과 rules 분리 표기 (6/10 삼권분석 미반영 잔여) |
| 13 | **ch4 8조 데이터 운영 rules 반영** | .claude/rules/ | 생체정보·서버 미보관 원칙 rules 신설 또는 기존 파일 확장 |

### P2 — 어젠다 등록 (장기 검토)

| # | 항목 | 비고 |
|---|------|------|
| 14 | 메모리 거버넌스 | 디바이스별 분산, 작성자 추적 불가 — PF_MONK_OS 어젠다 등재 완료(07-16 쌍아) |
| 15 | 부재 스킬 3건 | headshot-context, vton-context, idphoto-context — PF 활성화 시 검토 |
| 16 | makne-finish push 방식 통일 | `git push` vs `mk-push.sh` — 운용 정책 확정 필요 |
| 17 | cdp-browser 도구명 보정 | Claude_in_Chrome → claude-in-chrome |
| 18 | 메모리 고아/frontmatter 정리 | 2건 고아 등록/삭제, 2건 frontmatter 보정 |
| 19 | 헌법 4조 3항 `soso_` 접두사 | 현행 에이전트 체계와 비대칭 |
| 20 | prod 배포 권한 rules 명기 | ch5 3조 "작가님/쌍아만" 제한을 deployment.md에 추가 |

### 6/10 삼권분석 미반영 잔여

| 권고 | 상태 |
|------|------|
| 5조 1항 물리 위치 보정 | **미반영** → P1 #12에 포함 |
| CI 자동 집행 8건 (C1~C8) | **미확인** — 별도 점검 필요 |
| 기타 8건 | 반영 완료 확인 |

---

## 감사 통계

| 영역 | 검사 대상 | 이상 | 정상률 |
|------|---------|------|--------|
| 헌법 | 5조 20항 | 4건 | 80% |
| 법률↔룰스 | 46조항 | 4건 | 91% |
| 스킬 | 20개 | 4건 구식 + 4건 부재 | 80% |
| 메모리 | 40파일 | 6건 | 85% |
| **전체** | **126항목** | **P0: 6건, P1: 7건, P2: 7건** | **84%** |
