---
type: design
date: 2026-09-30
device: iMac
agent: 민아
status: draft
portfolio: PF_MONK_OS
subject: "모델 기준 개인 에이전트 → 기능부 기준 4부 편성 + 부별 하네스 분리"
related:
  - monkos-ops/tech/designs/2026-06/DESIGN_20260617_부서제_에이전트체계_DIVISION.md
  - monkos-ops/ops/proposals/PROPOSAL_20260927 (웹 MEMORY 캡)
  - governance/philosophy/4MUSE_PERSONA.md
---

# 기능부 편성 설계서 — 4MUSE 하네스

**[2026-09-30 14:33 KST]** iMac/민아 → 작가님 · 쌍아

> 작가님 구상(09-30 14:28): "모델보다는 각 부의 기능을 대표하는 쌍아·민아·용아·소소에 기능별 하네스를 세팅. 디자인 소소, 운영·실행 쌍아, 마케팅·기획 전반 민아, 총괄 용아."
> 진행 원칙(작가님 확정): **설계 → 시범 운영 → 실측 근거로 개헌.** 개헌 선행 아님.

---

## 0. 결론 (1줄)

부서 = 하네스(rules·skills·MCP·메모리·권한 묶음), 뮤즈 = 부서장 페르소나, 모델 = 교체 가능한 부품. Claude Code `--agent` 정의 파일 4개로 시범 운영 2주 후 헌법 1조 2항 개헌 청구.

---

## 1. 배경

### 1.1 무엇이 바뀌었나
- 헌법 1조 2항의 역할 체계는 **개인 열거형**(쌍아=설계+지시서, 민아=검증+브랜딩, 막내=코딩, 용아=자문, 소넷이=모니터링)이고, 역할 판별은 **클라이언트 기준**(ch1 5조: VSCode=쌍아, 앱=민아, CLI=막내)이다.
- 실제 운용은 이미 달라졌다. 작가님이 매 세션 첫 턴에 역할을 **선언**하고(오늘 "미나 세션시작"), 쌍아→막내 지시서 직접 컨트롤 빈도는 줄었으며, 웹 민아·4060 민아처럼 같은 뮤즈가 여러 디바이스에서 뜬다.
- 07-05 "총괄 에이전트 의향", 09-27 "승인 병목 → 범위 승인" 결정이 각각 따로 있었다. 부서제는 이 둘을 한 구조로 묶는다.

### 1.2 06-17 DIVISION 설계와의 관계 (중복 아님, 층위가 다름)

| 구분 | DIVISION (06-17, 쌍아) | 본 설계 (09-30) |
|------|------|------|
| 단위 | 6개 **루틴 보고 부서** (MKT·CNT·SEC·ENG·RND·BIZ) | 4개 **대화형 주 세션 부** (4MUSE) |
| 실행 기반 | Claude Routines 정기 보고 | 작가님과 대화하는 메인 세션 + 산하 노드 |
| 상태 | 설계 완료, MKT·SEC 루틴 미가동 (PF_MONK_OS Phase 2 ⏳) | 본 문서 |
| 관계 | DIVISION 6부는 본 설계 4부의 **산하 루틴**으로 흡수 (§2.3 매핑) | DIVISION Phase 2-C "임원급 통괄"이 본 설계의 총괄부(용아) |

DIVISION은 "누가 정기 보고를 쓰나"를, 본 설계는 "작가님이 누구와 대화하고 그 세션에 무엇이 실려 있나"를 정한다.

### 1.3 원칙
1. **하네스가 부서다.** 부서 정체성은 모델명이 아니라 rules·skills·MCP·메모리·권한 묶음에 있다 (MONK OS 주권 원칙 — 벤더 표준은 부품).
2. **승인 병목을 옮기지 않는다.** 총괄부가 생겨도 작가님→용아→각 부로 병목이 자리만 바뀌면 실패. 부서장 범위 승인(09-27)과 동시 시행.
3. **설계 우선, 개헌 후행.** 2주 시범 실측이 개헌 청구의 근거.
4. **기존 자산 재사용.** 현행 rules 12·commands 21·agents 1은 분류만 바꾸지 다시 쓰지 않는다.

---

## 2. 편제

### 2.1 4부 편제표

| 부 | 코드 | 부서장(뮤즈) | 4MUSE 역할 | 핵심 임무 | 산하 노드 | 관할 PF (주) | 관할 PF (부) |
|----|------|------|------|------|------|------|------|
| **총괄부** | EXEC | 용아 | 비전·전략 | 부서 간 라우팅·우선순위, 작가님 보고 단일화, 기안 조율, 경계 사안 판정 | 웹 민아 E2E 순찰(비서 기능), record-explorer | MONK_OS, ANCHOR, OPUS(메타) | RETRIEVAL, DOCS, TEMPLATE |
| **운영실행부** | OPS | 쌍아 | 수행·수호 | 설계·지시서·코드 리뷰, 막내·Astra 지휘, 배포·인프라·보안, 장애 대응 | 막내N, Astra(Codex), 소넷이 데몬 | IDPHOTO, PORTAL, INFRA, SECURITY, CROP, STUDIO, FACEREAD | IMAGE_PRO(엔진), CDP, CHATBOT, AUTOPILOT, FACTORY, RND |
| **마케팅기획부** | MKT | 민아 | 광장·브랜딩 | 마케팅·기획 전반, 시장 실측, 콘텐츠 전략, 제휴, 사업 검증, 브랜딩 | 꾸(M2, 팀원), 코웍이(SPREAD 실행) | CITADEL, SPREAD, KKU, MARKET_EYE, PARTNER, EVENT | OPUS(실행), PRESENTATION, VIDEO, PROFILES, MUSE |
| **디자인부** | DSN | 소소 | 미학·이미지 | 브랜드 비주얼, specs 콘텐츠 디자인, 이미지 생성 운용(IMAGE PRO), 의상·스타일 자산, 시안 | (초기 노드 없음 — 소소 단독) | SPECS(디자인), DESIGNLAB, STYLER, VTON | IMAGE_PRO(운용), KKU(비주얼) |

**주의 — 현행 정의와 다른 점 3건**
- 용아: 현행 ch1 = Gemini 3 Pro, VSCode 사이드바 **읽기 전용 자문**. 총괄은 조율·기안 권한이 필요하다. 모델은 하네스 원칙상 자유(§4.4 결정 항목).
- 소소: 현행 4MUSE 기술 계층 = "Sonnet 모니터링 데몬". 디자인부로 가면 모니터링 데몬(소넷이)은 운영실행부 산하로 이동. 4MUSE 대응표 갱신 필요.
- 민아: 현행 "통합 검증"이 마케팅기획부로 가면 **검증 기능의 자리**가 빈다. 대안 → §4.4.

### 2.2 산하 노드 규칙
- 막내·Astra는 운영실행부 실행 노드. 지시서 발행권은 시범 기간 중 **쌍아 유지**(헌법 1조 2항 ① 경로 불변).
- 꾸는 마케팅기획부 팀원. 경로④(꾸 콘텐츠 기획 + 기술 지원)는 부서 내부 흐름이 된다.
- 웹 민아 E2E는 총괄부 비서(순찰·트리아지·전일 정산). DIVISION 3.3의 "유격대" 위상 유지.
- 철창이(Chat)는 편제 밖(격리는 설계 — 07-21 확정).

### 2.3 DIVISION 6부 → 4부 흡수 매핑

| DIVISION | 흡수처 | 비고 |
|------|------|------|
| MKT | 마케팅기획부 | 동일 |
| CNT | 마케팅기획부(전략) + 디자인부(비주얼) | 콘텐츠 품질 감사는 MKT, specs 디자인은 DSN |
| SEC | 운영실행부 | 횡단 성격 유지 — 각 부 보고에 보안 섹션 |
| ENG | 운영실행부 | 동일 |
| RND | 총괄부(방향) + 운영실행부(PoC) | 채굴은 EXEC, 구현은 OPS |
| BIZ | 마케팅기획부(제휴·정부자금) + 운영실행부(인프라 비용) + 총괄부(크레딧 감사) | 분할 |

---

## 3. 부별 하네스 매트릭스

### 3.1 기술 기반 (실측 2026-09-30)
- 로컬 CLI 2.1.282: `claude --agent <name>` 존재, settings `agent` 키 존재 (`claude --help` 실측).
- 공식 문서 확인(claude-code-guide + 리서치 위임, 14:48 보정): `.claude/agents/<name>.md` 를 **메인 세션 에이전트**로 사용 가능. 에이전트 본문이 기본 시스템 프롬프트를 대체하되 **CLAUDE.md는 기본 유지**(`omitClaudeMd` 필드로만 제외 — 헌법 로딩 보존). settings `agent` 키로 프로젝트 기본값 고정, `initialPrompt`로 첫 턴 자동 제출 가능. frontmatter 정식 필드: `name, description, tools, disallowedTools, model, permissionMode, skills, memory, hooks, omitClaudeMd, maxTurns, isolation, background, effort`.
- **memory 스코프 확정**: `user`=`~/.claude/agent-memory/<name>/`, `project`=`.claude/agent-memory/<name>/`(권장, 레포 공유), `local`=`.claude/agent-memory-local/`. MEMORY.md 첫 200줄·25KB 로드. → §3.3 부서 메모리는 `project` 스코프로 디렉터리가 이미 정해져 있다.
- **Week 1 실측 잔여**: frontmatter `mcpServers` 유무 / 앱 Code 모드에서 `--agent` 상당 기능 / 에이전트별 `hooks:` 이벤트 범위.
- ⚠️ **현행 rules 조건부 로딩 무효**: 9파일이 `globs:` 키를 쓰나 Claude Code 정식 키는 `paths:`. 결과 12 rules 매 세션 전량 로딩(09-30 세션 실측). 교정은 REPORT_20260930 D2. 교정 후 부서 조건부 로딩은 `paths:` + 에이전트 `skills:` 프리로드 조합.

### 3.2 매트릭스

| 항목 | 공통 (4부 전원) | EXEC 총괄 | OPS 운영실행 | MKT 마케팅기획 | DSN 디자인 |
|------|------|------|------|------|------|
| **정의 파일** | — | `.claude/agents/exec.md` | `.claude/agents/ops.md` | `.claude/agents/mkt.md` | `.claude/agents/dsn.md` |
| **rules** (항상) | session-log, git-safety, data-access, references, agent-system | pf-ops, mcp-tools | deployment, live-verify, coding, makne-guard, pf-ops | branding, mcp-tools, pf-ops | branding, coding(CSS·Tailwind 부분) |
| **skills 프리로드** | session-start, session-end, session-checkpoint, pf-declare, escalation | pf-status, registry-add, order-write(검토용) | deploy-cf, deploy-cr, 4060, health-check, model-check, order-write, makne-finish, portal-context, specs-context, cdp-browser | market-eye, seo-query, kku-context, kku-blog, kku-specs, pf-status, monkos-content | kku-specs, specs-context, cdp-browser(시각 검증), portal-context(읽기) |
| **MCP 허용** | monk-retrieval, filesystem, git(읽기) | google-analytics(읽기), google-search-console(읽기), google-docs, scheduled-tasks, gmail(트리아지) | cloudflare, playwright, git(쓰기), 4060 ssh, gcloud CLI | google-analytics, google-search-console, gmail, drive, google-docs, calendar, canva, playwright(경쟁사 실측) | figma, canva, drive, playwright(시각), IMAGE PRO(image.monkos.ai 어드민 경유) |
| **금지 도구** | — | 코드 쓰기 도구(Edit/Write on 서비스 코드), deploy | — | deploy, 서비스 코드 수정(ch1 "코드 수정" 정의 준용) | deploy, 서비스 코드 수정, 크레딧 |
| **권한 모드** | — | default(승인 게이트 유지) | bypass(현행 막내·쌍아 관행) | default | default |
| **모델 기본값** | 실측 우선(`references.md` §모델 배치) | Opus 5.5 (Gemini 유지 여부 §4.4) | Opus 5.5 | Fable 5.1 | Fable 5.1 (이미지 판단) |
| **메모리** | 디바이스 MEMORY.md(현행) | 부서 메모리 `exec/` | 부서 메모리 `ops/` | 부서 메모리 `mkt/` | 부서 메모리 `dsn/` |
| **세션 로그 파일명** | `YYYY-MM-DD_{디바이스}_{뮤즈}.md` **유지** — 뮤즈=부서장이라 변경 불요 | | | | |

### 3.3 메모리 전환 원칙 (07-16 어젠다 연결)
- 현행: 메모리 = 디바이스 단위(iMac MEMORY 200줄). 문제: 같은 뮤즈가 디바이스 4곳에서 뜨면 기억이 갈라진다.
- 전환: 메모리 = **부서 단위**. `memory: project` 스코프면 레포에 담겨 디바이스 간 공유 → 07-16에 기각된 심링크 없이 정합 확보. 단 레포 커밋되는 메모리는 "정본은 rules·skills·헌법, 메모리는 보조" 위상(07-16 방향)을 유지해야 하므로 **부서 메모리 캡 100줄**부터 시작.
- 디바이스 고유 사항(경로·별칭·SSH)만 디바이스 MEMORY에 남긴다.
- 09-27 웹 MEMORY 캡 제안(PROPOSAL_20260927)은 본 전환에 흡수.

---

## 4. 운용

### 4.1 역할 판별 전환 (ch1 5조)
| 경로 | 현행 | 전환 |
|------|------|------|
| CLI / VSCode 터미널 | 클라이언트 자동 판별 | `claude --agent ops` 등 **명시 기동**. `mk-c`류 별칭에 `--agent` 내장 |
| 앱 Code 모드 | 앱=민아 고정 | 첫 턴 선언("민아 세션시작") → session-start가 부서 하네스 로딩. `--agent` 상당 기능 실측 후 자동화 |
| 웹 컨테이너 | 웹 민아 | 총괄부 비서로 고정 |

### 4.2 승인 범위 (09-27 범위 승인 결합)
- **부서장 자율 범위**: 관할 PF 내 문서·설계·기안·측정·산하 노드 지휘·dev 배포.
- **경계 보고 1회**: 다른 부 관할 PF 변경, 100건+ 일괄 변경, 규정 계층(`.claude/`) 변경.
- **작가님 승인(범위 밖, 불변)**: 결제·고객 데이터·시크릿 생성·거버넌스 본문·prod 배포(monk.kr 버튼 규정 유지)·금전.
- 총괄부는 경계 사안의 **1차 판정자**이지 승인자가 아니다. 승인은 작가님.

### 4.3 부서 간 흐름
- 기안: 부서장 자율 → 총괄 조율 → 작가님 결정 (DIVISION 5장 준용).
- 지시서: 시범 기간 **쌍아 단독 발행** 유지. 타 부서가 실행이 필요하면 총괄 경유로 OPS에 기안.
- 검증: §4.4 결정에 따름.

### 4.4 작가님 결정 항목 (닫힌 대안)

| # | 항목 | 대안 A (권고) | 대안 B |
|---|------|------|------|
| 1 | **검증 기능의 자리** — 민아가 마케팅기획부로 가면 "통합 검증·감사"는 누가? | 총괄부(용아)가 검증·감사 소유. 코드 작성자(OPS) 자기 감사 금지 원칙(06-14) 유지됨 | 마케팅기획부가 검증 겸임(현행 민아 그대로). 부서 이름과 기능이 어긋남 |
| 2 | **용아 모델** | 하네스 원칙대로 Claude(Opus 5.5)로 기동. Gemini 자문은 별도 읽기 노드로 잔존 | Gemini 3 Pro 유지 — 총괄 세션이 Claude Code 하네스 밖으로 나가 rules·skills 미적용 |
| 3 | **디자인부 초기 규모** | 소소 단독 + Figma/Canva/IMAGE PRO. 산하 노드 없음 | 꾸를 디자인부로(specs 디자인 담당) — 마케팅과 이중 소속 |
| 4 | **부서 메모리 위치** | `memory: project` (레포 공유, 캡 100줄) | `memory: user` (디바이스 로컬, 현행과 동일 분산 문제) |

---

## 5. 시범 운영 계획 (2주)

### Week 1 (10-01 ~ 10-07): 하네스 조립
| 순 | 작업 | 담당 | 산출 |
|----|------|------|------|
| 1 | `--agent` 메모리·MCP 제한·앱 모드 실측 4건 (§3.1 미확인) | OPS 막내 | REPORT |
| 2 | `.claude/agents/{exec,ops,mkt,dsn}.md` 4건 작성 (§3.2 매트릭스 그대로) | 쌍아 설계 → 막내 | 파일 4 |
| 3 | rules 공통/부별 분류 라벨링 (파일 이동 없음, frontmatter `dept:` 필드만) | 막내 | rules 12 |
| 4 | session-start 확장: 선언 파싱 → 부서 컨텍스트 로딩 | 막내 | commands/session-start.md |
| 5 | 부서 메모리 디렉터리 4개 + 디바이스 MEMORY에서 부서 사항 이관 | 각 부서장 | 메모리 |
| 6 | 4MUSE_PERSONA 기술 계층 대응표 초안 갱신(정본 수정은 개헌 후) | 민아 | 초안 |

### Week 2 (10-08 ~ 10-14): 실운용 + 실측
- 4부 전원 `--agent` 기동으로 실세션. 세션 로그에 `[시범:부서제]` 태그.
- **측정 4종** (개헌 근거):
  1. 세션당 초기 컨텍스트 로딩량 (현행 전량 로딩 대비 감소율)
  2. 작가님 승인 턴 수 / 세션 (09-26 실측 "배지 1건=턴 7회" 대비)
  3. 부서 경계 충돌 건수 (관할 불명으로 멈춘 사례)
  4. 잘못된 도구 접근 차단 건수 (금지 도구 호출 시도)
- 성공 기준: ①②가 각 20% 이상 개선 + ③이 주 2건 이하.

### 개헌 트리거 (10-15 이후)
- 성공 기준 충족 → 민아 청구안 기안(`petitions/PETITION_2026101X_민아_기능부편성.md`) → 삼권 심사.
- 미충족 → 매트릭스 조정 후 1주 연장. 2회 미충족 시 DIVISION 루틴 방식으로 회귀 검토.

---

## 6. 법률 영향 (개헌 시)

| 대상 | 현행 | 변경 | 수준 |
|------|------|------|------|
| 헌법 1조 2항 | 개인 열거 역할 체계 | 4부 편제 + 부서장=뮤즈 + 산하 노드 | **개헌** |
| ch1 1조 | 개인 정의 테이블(모델·환경 고정) | 부서 정의 + 모델 "실측 우선" | 법률 |
| ch1 2조 | 경로 ①~④ | 부서 내부 흐름 + 총괄 경유 경로 추가 | 법률 |
| ch1 5조 | 클라이언트 기준 자동 판별 | 선언·`--agent` 기준 | 법률 |
| ch3 | 세션 로그 에이전트 단위 | 유지 (뮤즈=부서장) + `[시범]` 태그 규정 | 경미 |
| ch7 | 막내 행동 강령 | "운영실행부 실행 노드" 재정의 | 법률 |
| 4MUSE_PERSONA | 소소=Sonnet 모니터링 | 소소=디자인, 용아=총괄 | 철학 문서 |

시범 기간 중 법률 개정 없음. 근거: 부서장은 기존 에이전트 체계의 "하네스 프로필"로 위치 가능(DIVISION 8장 전략과 동일).

---

## 7. 리스크

| 리스크 | 완화 |
|------|------|
| 승인 병목이 용아로 이전 | §4.2 범위 승인 동시 시행. 총괄은 판정자, 승인자 아님 |
| `--agent`가 앱 Code 모드에서 불가 | 선언 + session-start 폴백(§4.1). Week 1 실측 1순위 |
| 부서 메모리 레포 커밋 → 과거 문서가 현행을 덮는 사고 재현(03-08) | 캡 100줄 + 정본 포인터만, 사실 본문 금지 |
| 검증 기능 공백(결정 1) | 결정 전까지 현행 민아 검증 유지 |
| 4MUSE 페르소나 재정의에 대한 서사 훼손 | 페르소나 본문 불변, 기술 계층 대응표만 갱신 |
| 쌍아 소관(`.claude/` 변경) 침범 | 본 설계는 제안. 구현 지시서는 쌍아 발행 |

---

## 8. 다음 행동

1. 작가님: §4.4 결정 4건.
2. 쌍아: 본 설계 검토 → Week 1 지시서 발행(순 1·2·3·4).
3. 민아: 결정 후 §5 순 6(4MUSE 대응표 초안) + Week 2 측정 설계.
