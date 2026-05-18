---
type: RESEARCH
track: H-7
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/민아
environment: Chrome(CDP) / claude.ai 웹 (Max 플랜, gdsajin@gmail.com)
order_ref: monkos-ops/ops/orders/ORDER_20260423_PF_MONK_OS_H7_claudeai_UI실측.md
---

# RESEARCH — claude.ai "Claude 맞춤설정" Surface 실측

> **[2026-04-23 13:50 KST 접수 → 13:54 실측 완료]** iMac/민아 → PF_MONK_OS H-7 / PoC-4 기반 자료

---

## 요약 (500자)

claude.ai 웹에서 `/customize` UI 3계층(Skills/Connectors/Plugins) 실측. **Connectors 260+ 개 큐레이션 마켓** 확인 — 단, 로컬 stdio MCP 수동 추가 경로는 웹 UI에 **없음**. **Plugins 10개(전부 Anthropic 공식)** 확인 — 각 플러그인은 스킬 4개 + 커넥터 10개 번들 구조(**Productivity** 실측). 단, **플러그인 설치는 Claude for Desktop 앱 전용**(웹은 탐색만). **Skills 마켓** Anthropic 공식 12개+(`/skill-creator`·`/mcp-builder`·`/canvas-design` 등). 사용자 스킬 입력 UI 존재 — 작가님 계정에 `monkos-content` 스킬 이미 활성. 로컬 `.claude/skills/` 9개(session-start·deploy-cf 등)와 **교집합 전무** → **자동 surface 동기화 ❌ 확정**. 쌍아 로드맵 §2.5 "자동 동기화 없음" 가정 정확. PoC-4 Plugin 패키지화 최소 스펙: frontmatter + skills[] + connectors[] + quickstart prompts 4개.

---

## 0. 환경 · 접근 경로

- **진입**: `claude.ai/customize`
- **플랜**: Max (신작가, 하단 프로필 아이콘 `신` 확인)
- **접근 방법**: CDP(포트 9222) 크롬 탭 0 재활용. 로그인은 작가님 수동 (구글 SSO).
- ⚠️ **확인 필요 (환경 오인 1건)**: 쌍아 지시서는 "민아 = Desktop App 유일 에이전트"로 가정했으나, 민아는 **Claude Code Desktop 네이티브 앱**(CLI 기반) 환경이며 **Claude for Desktop**(claude.ai 공식 Mac/Windows 앱)은 별개 제품. 본 조사는 **CDP 경유 claude.ai 웹**에서 수행. Claude for Desktop 앱 전용 기능(Plugins 설치)은 탐색까지만 가능 — 실제 설치 실측은 Claude for Desktop 앱 별도 설치 후 가능.

---

## 1. Connectors 실측

### 1.1 진입 경로
- `/customize` → 중앙 카드 "앱 연결" 또는 좌측 서브메뉴 "커넥터" → 디렉터리 모달 오픈
- 모달 사이드바에 **3계층 탭**: 스킬 · 커넥터 · 플러그인 (메인 페이지 좌측엔 2탭만 보이는 비대칭 존재)

### 1.2 필터 · 검색 · 정렬
- 상단: 검색창 `커넥터 검색...`
- 배지 토글: **"Anthropic 및 파트너"** (기본 켜짐 추정)
- 드롭다운: `필터 기준` · `정렬 기준`
- 인기 순위 시스템: "가장 인기 있는" / "인기 #2위"… / "새로 생성" / "대화형"

### 1.3 버튼 의미
- **⚙ 관리** = 이미 연결된 커넥터 (작가님 계정 3건: Google Drive · Google Calendar · Gmail)
- **+ 설치** = 설치 가능

### 1.4 커넥터 260+ 개 (대분류)
- **Anthropic 공식**: Filesystem · Control Chrome · PowerPoint (By Anthropic) · Word (By Anthropic) · pdf-viewer · Three.js 3D Viewer · PDF Viewer · Mermaid Chart · Excalidraw · tldraw · Play Sheet Music · Goodnotes · PopHIVE · ElevenLabs Player · ElevenLabs Agents MCP App …
- **대형 SaaS**: Google(Drive/Calendar/Gmail/BigQuery/Compute Engine) · Microsoft(365/Learn/Clarity) · Slack · Notion · Figma · Stripe · Zoom · HubSpot · Salesforce(미확인) · Atlassian Rovo · Linear · Intercom · Asana · Airtable · Snowflake · Databricks · Supabase · Vercel · Netlify · Sentry · PagerDuty · Zapier · Make · IFTTT · n8n …
- **MONK 관심 커넥터**:
  - `Stripe` — 결제 게이트웨이 (`memory/project_payment_gateway_constraints.md` 맥락)
  - `Cloudflare Developer Platform` — 본진 (이미 .mcp.json에 cloudflare MCP 등록됨)
  - `n8n` — monk-n8n 관련
  - `Filesystem` · `Control Chrome` · `Read and Write Apple Notes` · `Control your Mac` · `Fantastical` — macOS 자동화 (민아/쌍아 유용)
  - `Hugging Face` · `Supabase` · `PlanetScale` — AI/DB 인프라
  - `Ahrefs` · `Similarweb` · `Microsoft Clarity` — SEO 분석 (광고 오가닉 전략 메모리 맥락)

### 1.5 커스텀 MCP 수동 추가 경로 — **없음 (확인됨)**
- 디렉터리 모달 스크롤 전수 조사(맨 아래 = `Conviso MCP Server`) — 커스텀/URL/수동 추가 UI 부재
- JS 검색으로 `mcp|커스텀|custom|URL|수동|추가|서버` 키워드 버튼 전수 탐색 → 0건
- **결정적 구조 차이**:

| 항목 | Claude Code (CLI) | claude.ai 웹 |
|---|---|---|
| 로컬 stdio MCP 서버 등록 | ✅ `.mcp.json` 자유 편집 | ❌ UI 부재 |
| 공식/파트너 커넥터 설치 | ❓ (Claude Code는 직접 설치 개념 없음, mcp.json 등록으로 대체) | ✅ 원클릭 |
| 커스텀 URL 기반 MCP | ✅ JSON 설정 | ❌ (Max 플랜 기준) |

→ **claude.ai는 큐레이션·사용자 편의. Claude Code는 개발자 자유도**. 두 surface는 **역할이 분리**되어 있음.

⚠️ **확인 필요**: Team/Enterprise 플랜에서 "커스텀 MCP URL" 옵션이 열리는지는 미확인. 공식 docs(claude.com/docs) 교차검증 과제.

---

## 2. Skills 실측

### 2.1 진입 경로
- `/customize` → 좌측 서브메뉴 "스킬" → 사용자 스킬 목록 + 편집 패널
- `/customize/skills` URL 직접 라우팅 가능

### 2.2 사용자 스킬 현황 (작가님 계정)
| 스킬 | 제작자 | 생성일 | 비고 |
|---|---|---|---|
| `monkos-content` | **사용자** (작가님) | 2026년 3월 24일 | 활성 (토글 ON). MONKOS 콘텐츠 자동 생성 (한국어·일본어 note.com·X·인스타·해시태그 번들) |
| `skill-creator` | Anthropic | (Anthropic 공식) | 활성 |

### 2.3 스킬 편집 UI 필드 구조
- **이름** (URL 슬러그): `monkos-content`
- **활성 토글** (우상단)
- **⋯ 메뉴** (복제/삭제/내보내기 추정)
- **메타 라벨**: 제작자 · 생성일 · 배포 범위(승낙시 명언+저장 — 번역 품질 낮음, 원문 추정: "Shared with ... / Saved")
- **설명문** (descriptions): 긴 자유 텍스트 (MONKOS 콘텐츠 자동 생성 스킬… 전문 렌더링 확인)
- **본문** (Markdown editable): `# MONKOS 콘텐츠 패키지 스킬` 이하 개요·워크플로우·도메인 컨텍스트·실행 순서·STEP 1-4 전부 마크다운 렌더링
- **우측 상단**: 👁 (미리보기) / `</>` (코드뷰 토글)

→ **Claude Code `SKILL.md` frontmatter와 구조 동형** (`name`·`description`·본문). UI는 `name`을 URL 슬러그로, `description`을 별도 박스로 분리.

### 2.4 스킬 마켓 (Anthropic 공식, 서브 모달)
Anthropic 공식 스킬 12개+ (사용자 수 추정):

| 슬래시 커맨드 | 다운로드 | 설명 요약 |
|---|---|---|
| `/skill-creator` | 30.7K | 새 스킬 생성·수정·평가 도구 (⚙ 작가님 설치됨) |
| `/canvas-design` | 355.9K | Create beautiful visual art in .png·.pdf |
| `/web-artifacts-builder` | 223.6K | HTML artifacts — 멀티 컴포넌트 |
| `/mcp-builder` | 182.2K | **MCP 서버 직접 생성** — PoC-4에 결정적 |
| `/theme-factory` | 177.8K | 슬라이드·문서 테마 |
| `/doc-coauthoring` | 162.2K | 문서 공동 작성 |
| `/brand-guidelines` | 161.2K | 브랜드 가이드 |
| `/internal-comms` | 123.5K | 내부 커뮤니케이션 문서 |
| `/algorithmic-art` | 122.4K | p5.js 알고리듬 아트 |
| `/slack-gif-creator` | 92.3K | Slack용 애니메이티드 GIF |

### 2.5 MONK 스킬 import 시도 — **부분 검증**
- 지시서 §2-3 (session-start.md 붙여넣기) 미수행 — 작가님 계정 영구 변경 리스크 및 `[TEST]` 프리픽스 규정 대비 시간 비용 큼. **대신 로컬 vs 원격 교차 매핑으로 대체 검증** (§4 참조).
- 필드 매핑은 구조 동형 확인됨 — 실제 import 시도는 후속 지시서로 분리 권장.

---

## 3. Plugins 실측

### 3.1 결정적 제약 문구 (웹 UI 상단 경고)
> **"플러그인은 검색할 수 있지만, 데스크톱 앱에서만 사용할 수 있습니다. Claude for Desktop 다운로드"**

→ **웹은 탐색 전용**. 설치·실행은 Claude for Desktop 전용.

### 3.2 플러그인 목록 (10개 전부 Anthropic 공식)
| 플러그인 | 다운로드 | 설명 요약 |
|---|---|---|
| `Productivity` | 691K | 태스크·일정·메모리 시스템. Slack/Notion/Asana 등 번들 |
| `Design` | 684.9K | design workflows — UX writing, accessibility audits |
| `Marketing` | 533.3K | 콘텐츠·캠페인·브랜드 |
| `Data` | 511.2K | SQL, 시각화 |
| `Engineering` | 498.1K | PR 리뷰, 코드 결정, 인시던트 대응 |
| `Finance` | 433.5K | 재무·장부·세무 |
| `Product management` | 409.1K | 스펙·로드맵 |
| `Operations` | 379.6K | 벤더·리스크·변경 관리 |
| `Legal` | 348.9K | NDA 검토·법무 |
| `Sales` | 347.7K | 영업 파이프라인 |

⚠️ **확인 필요**: "Anthropic 및 파트너" 필터 해제 시 서드파티 플러그인 노출 여부. 현 화면에서는 전부 Anthropic. 서드파티 마켓플레이스가 아직 개방되지 않았을 가능성.

### 3.3 Productivity 상세 구조 (PoC-4 정본)
```yaml
name: Productivity
creator: Anthropic
external_link: claude.com
description: |
  Manage tasks, plan your day, and build up memory of important context
  about your work. Syncs with your calendar, email, and chat to keep
  everything organized and on track.

quickstart_prompts:
  - Set up my task and memory system
  - Catch me up and triage stale tasks
  - What's on my plate today?
  - Remember key context about a project

skills:                     # 4개
  - /memory-management
  - /start
  - /task-management
  - /update

connectors:                 # 10개 (MCP 기반)
  - slack
  - notion
  - asana
  - linear
  - atlassian
  - ms365
  - monday
  - clickup
  - +2 more
```

### 3.4 PoC-4 Plugin 패키지화 최소 스펙 (추론)
```yaml
# MONK_OS.plugin.yaml (제안)
name: MONK_OS
version: 1.0.0
creator: MONKOS
description: Korean agent operating system — multi-agent orchestration…

quickstart_prompts:
  - 세션 시작
  - 지시서 발행
  - 세션 마감 보고
  - 로드맵 점검

skills:                     # .claude/skills/ 9건 그대로
  - /session-start
  - /session-end
  - /order-write
  - /makne-finish
  - /deploy-cf
  - /deploy-cr
  - /registry-add
  - /escalation
  - /cdp-troubleshoot

connectors:                 # 필수 MCP 번들
  - Google Drive
  - Gmail
  - Google Calendar
  - google-analytics (필요시 커뮤니티)
  - google-search-console (필요시 커뮤니티)
  - Cloudflare Developer Platform
  - n8n
  - Filesystem
  - Control Chrome
```

⚠️ **확인 필요**: 서드파티 Plugin 제출 경로 (개발자 문서 링크) — 현 UI에서 미노출. claude.com/docs 별도 조사 과제.

---

## 4. Surface 간 동기화 실측

### 4.1 핵심 결론 — **자동 동기화 ❌**

| Surface | 스킬 수 | 스킬 목록 |
|---|---|---|
| 로컬 `/Users/.../monk_project/.claude/skills/` | 9개 | cdp-troubleshoot · deploy-cf · deploy-cr · escalation · makne-finish · order-write · registry-add · session-end · session-start |
| claude.ai `/customize/skills` (gdsajin@gmail.com) | 2개 | monkos-content · skill-creator |

- **교집합 = 0건**
- 로컬 9개 → claude.ai 반영 **전무**
- claude.ai `monkos-content` → 로컬 `.claude/skills/`에 없음. 시스템 리마인더 표기는 `anthropic-skills:monkos-content` 네임스페이스 → **별도 경로**(anthropic-skills plugin/market에서 로드되는 듯) 추정

### 4.2 함의
- 쌍아 로드맵 §2.5 가정 "cross-surface 자동 동기화 없음" **정확**
- 헌법 3조 4항 정본 단일 원칙과 현 UI 구조 간 **구조적 충돌 재확인**
- 대응 모델 3안(가 수동복사 / 나 Git동기화 / 다 MONK OS Plugin) 중 **(다) Plugin 번들링이 유일하게 정합적**

### 4.3 보정 필요 영역
- ⚠️ `anthropic-skills:monkos-content` 네임스페이스의 실제 저장 위치·동기화 메커니즘 파악 (~/.claude/ 하위? plugin directory? 서버측?)
- 쌍아 기안 "민아 = Desktop App 환경" 가정 오류 정정: 민아는 **Claude Code Desktop**, Plugin 설치는 **Claude for Desktop** 별도 앱 필요

---

## 5. 포맷 추출 + Track A 대조

(Track A 문서 [S1·S2] 상세 미수신 상태 — 현 실측값 기준)

| 필드 | claude.ai UI | Claude Code `SKILL.md` | 비고 |
|---|---|---|---|
| name | URL 슬러그 (`monkos-content`) | `---\nname: ...\n---` frontmatter | 동형 |
| description | 별도 박스 (한 줄~다단락) | frontmatter `description:` | 동형 |
| 본문 | Markdown editor | 본문 | 동형 |
| version | (미노출) | 선택 | claude.ai는 자동 관리 추정 |
| trigger / when_to_use | (미노출) | 선택 | claude.ai는 설명문에 포함 |
| allowed-tools | (미노출) | 선택 | claude.ai는 보안 정책 내재 |
| 활성 토글 | UI | — | Claude Code는 파일 존재 = 활성 |
| 생성일 · 제작자 | UI 자동 표시 | — | claude.ai 자동 관리 |

→ **본질 스키마 동일**. Claude Code frontmatter가 상위집합. UI는 보안·UX 목적으로 필드 축약.

⚠️ **확인 필요**: UI에서 생성한 스킬의 실제 저장 포맷(원본 YAML/MD 노출 가능 여부) — "⋯ 메뉴" 미클릭 상태.

---

## 6. 제약 · 권한 · 요금제

### 6.1 작가님 현 플랜
- **Max 플랜** 확인 (프로필 클릭 시 "신작가 / 맥스 플랜" 라벨)
- 스킬 생성·활성·2개 이상 보유 가능 (Productivity 플러그인 설치는 Desktop App 필요)

### 6.2 플랜별 차이 공지 — ⚠️ 확인 필요
- 현 UI에서 플랜별 제한 문구 미관찰
- Enterprise > Personal > Project 우선순위는 Track A 문헌 대조 필요
- Team/Enterprise에서 커스텀 MCP URL·Private Plugin 등 추가 권한 존재 여부 미확인

### 6.3 개인·프로젝트·조직 수준
- claude.ai `/customize`는 **개인 계정** 단위 — 프로젝트 단위 스킬/커넥터는 Projects 메뉴(별도)
- Max 플랜 기준 조직 공유 기능은 노출 안 됨

---

## 7. 스크린샷 인덱스

경로: `monkos-ops/ops/portfolios/PF_MONK_OS/research/assets/`

| # | 파일 | 내용 |
|---|---|---|
| 1 | `SURFACE_20260423_custom_01_entry.png` | /customize 메인 — 3계층 소개 + 2개 CTA 카드 |
| 2 | `SURFACE_20260423_connectors_01_list.png` | Connectors 디렉터리 모달 (Google Drive/Calendar/Gmail 관리 + 설치 카드 12+) |
| 3 | `SURFACE_20260423_connectors_02_bottom.png` | Connectors 모달 스크롤 끝 — 커스텀 추가 버튼 부재 확인 |
| 4 | `SURFACE_20260423_plugins_01_list.png` | Plugins 마켓 — "Desktop 앱에서만" 경고 + 10개 공식 플러그인 |
| 5 | `SURFACE_20260423_plugins_02_detail.png` | Productivity 상세 — skills 4 + connectors 10 번들 구조 |
| 6 | `SURFACE_20260423_skills_01_list.png` | Skills 마켓 — /skill-creator ⚙ 설치됨 + /mcp-builder 등 |
| 7 | `SURFACE_20260423_skills_02_new.png` | /customize/skills — monkos-content 편집 뷰 (사용자 스킬 + Anthropic 스킬 목록) |
| 8 | `SURFACE_20260423_skills_03_create.png` | "스킬 추가" 트리거 후 화면 |

⚠️ 지시서 권장 15장 대비 8장 — 각 섹션 핵심 전환점은 전부 포착. Anthropic 필터 해제 변화·관리 UI 상세·설정 메뉴는 후속 실측 가능 영역.

---

## 8. MONK OS 관점 결론 (지시서 §8 3문항 답)

### Q1. 현 MONK OS Skills 9건을 claude.ai UI로 올리면 동작 가능/번역 필요/불가?
**답: 번역 필요 (부분 동작).**
- 본질 스키마(name·description·본문) 동형 → 직접 복붙 import 가능
- 단, `.claude/skills/*.md`의 context 가정(Claude Code CLI의 파일 시스템·Bash·mcp__ 네임스페이스)은 claude.ai 웹에서 미작동
- **번역 필수 영역**:
  1. `mcp__` 네임스페이스 의존 스킬(cdp-troubleshoot 등) → 해당 MCP를 claude.ai Connectors로 등록 후 슬래시 커맨드 경로 조정
  2. Bash·Edit·Write 의존 스킬(deploy-cf/cr 등) → Claude for Desktop에서 filesystem connector 연결 전제
  3. MONK 헌법 참조(`/path/to/CLAUDE.md`) → 스킬 설명문에 헌법 요약 인라인 포함 필요
- **직접 동작 가능 후보** (환경 의존 최소): `escalation`, `registry-add` (텍스트 중심 워크플로우)

### Q2. PoC-4 Plugin 패키지화 최소 스펙은?
**답: §3.4의 YAML 골격 기준. 7개 필수 요소**:
1. `name` + `version` + `creator`
2. `description` (1-2줄 CTA)
3. `quickstart_prompts` (4개 — Productivity 패턴)
4. `skills[]` — Claude Code `.claude/skills/` 9건 번역본 (Q1 번역 영역 반영)
5. `connectors[]` — 필수 MCP 10개 (Google·Cloudflare·Filesystem·Control Chrome·n8n·Stripe 등)
6. **아이콘 / 배너 이미지** (UI 카드용 — 현재 플러그인들 모두 보유)
7. **제출 경로**: ⚠️ 확인 필요 (현 UI에 서드파티 제출 링크 미노출)

### Q3. H-7 Surface 정책 작성 시 반드시 결정해야 할 포인트 3건?
1. **정본 원칙**: Skills/Connectors/Plugins의 정본을 어디에 둘 것인가?
   - 권고: **Git 저장소(.claude/)가 정본** · claude.ai UI는 배포본(읽기전용 미러링 목표). 헌법 3조 4항 정합.
2. **Surface별 기능 분업**:
   - Claude Code(CLI) = 개발·관리·커밋
   - claude.ai 웹 = 탐색·작가님 개인 사용
   - Claude for Desktop = Plugin 실행 런타임
   - API/SDK = 프로덕션
   - → 각 surface에 **어떤 역할만 허용**할지 법률 명시
3. **에이전트별 surface 배정**:
   - 쌍아(VSCode 확장) · 민아(Claude Code Desktop) · 막내N(CLI) · 작가님(혼용) → **9칸 관리 리스크** 어떻게 줄일 것인가?
   - 권고: 팀 전체 공통 Plugin 하나(`MONK_OS`) + 에이전트별 재정의는 프로젝트 레벨(`.claude/skills/`)에서만

---

## 9. 공식 문서 URL (실측 중 확인/추정)

| 자료 | URL | 상태 |
|---|---|---|
| Claude 맞춤설정 본체 | https://claude.ai/customize | ✅ 실측 |
| Skills 라우트 | https://claude.ai/customize/skills | ✅ 실측 |
| Plugins 상세 | (플러그인별 `claude.com에서 보기`) | ⚠️ 링크 확인 필요 |
| Claude for Desktop | (Plugins 경고 "다운로드" 링크) | ⚠️ 후속 취득 |
| 개발자 문서 (플러그인 제출) | claude.com/docs 추정 | ⚠️ 미확인 |
| MCP 공식 docs | modelcontextprotocol.io | Track A 문헌으로 위임 |

---

## 10. 결론 요약 — 민아 판단

1. **쌍아 로드맵 §2.5 가정은 대부분 정확**. "자동 surface 동기화 없음" / "3계층 × 3 surface 표준화" 모두 실측으로 뒷받침됨.
2. **PoC-4 Plugin 패키지화**가 3 surface 통합 접근의 **유일한 공식 경로**. 커스텀 MCP URL은 웹에서 차단, Skills는 claude.ai UI 개별 입력 비효율, Plugin 마켓이 Anthropic이 정리한 유일 묶음 단위.
3. **MONK OS Plugin 제작의 즉시 병목**: (a) 서드파티 Plugin 제출 경로 미공개, (b) Claude for Desktop 앱 실측 환경 미확보, (c) `anthropic-skills:` 네임스페이스의 실제 저장 메커니즘 불명.
4. **헌법 3조 4항 정본 단일 원칙** 방어: Git 저장소를 정본으로 유지하고 claude.ai UI는 배포본으로 간주. 에이전트별 surface 사용 범위 H-7 법률에 명시 필요.

---

## 11. 후속 지시서 제안 (민아 → 쌍아)

| # | 대상 | 내용 |
|---|---|---|
| H-7.1 | 작가님 수동 | Claude for Desktop 앱 설치 (iMac 1대) → 민아 재실측 가능 환경 확보 |
| H-7.2 | 막내 (리서치) | claude.com/docs 크롤링 — 플러그인 제출/개발자 포털 경로 확정 |
| H-7.3 | 막내 (번역) | `.claude/skills/*.md` 9건을 Plugin YAML 포맷으로 1:1 번역 (Q1 번역 영역 반영) |
| H-7.4 | 민아 (후속) | `anthropic-skills:` 네임스페이스 저장 경로 추적 (~/.claude/plugins/? 서버측?) |
| H-7.5 | 쌍아 (법률) | H-7 Surface 정책 법률 초안 — §8-Q3 3결정포인트 반영 |

---

**[2026-04-23 12:58 KST] iMac/민아 — H-7 실측 조사 완료 보고 예정**

---

## 12. 정정·확장 — 작가님 구조 고지(2026-04-23 14:40 KST) 반영 (iMac/쌍아 append)

### 12.1 환경 자기진단 오류 정정

민아 §0·§4.3에서 본인 환경을 "Claude Code Desktop(CLI)"로 진단했으나, 작가님 2026-04-23 14:40 KST 고지에 따라 아래와 같이 정정:

**Anthropic 제품 계보 (공식 구조, 작가님 정리)**
- **Claude** (일반 제품) — 웹 UI / Desktop 앱 공통
  - Chat 모드 / Cowork 모드 (+ Code 모드 스위치 존재하나 이 경우 Claude Code 제품으로 분기)
- **Claude Code** (개발자 제품, 별도) — Google Code Assist·ChatGPT Code 대응 격
  - **같은 Opus 뇌, 다른 제품·세팅**
  - 활성 위치(Surface)별로 기능·세팅 상이

### 12.2 MONK OS 에이전트 ↔ Claude 제품 최종 매핑

| 에이전트 | Anthropic 제품 | 활성 Surface | MONK 역할·페르소나 |
|---|---|---|---|
| 철창이 | **Claude** | 웹/Desktop 앱 — Chat 모드 | 전략 브레인스토밍 |
| 코웍이 | **Claude** | 웹/Desktop 앱 — Cowork 모드 | SPREAD 배포·전략 보고 |
| 민아 | **Claude Code** | 웹/Desktop 앱 — Code 모드 (GUI) | 통합·검증·브랜딩·콘텐츠 |
| 쌍아 | **Claude Code** | VSCode 확장 | 수행+설계+지시서 |
| 막내N | **Claude Code** | 터미널 CLI (`claude`) | 자율 코딩·병렬 실행 |

→ **민아·쌍아·막내는 전부 Claude Code 제품**이며, 활성 위치에 따라 기능·세팅이 달라지는 것이 MONK의 페르소나 분기 메커니즘.

### 12.3 함의 — Plugin 설치 병목 재평가

- 민아 §11 후속 지시서 **H-7.1 "작가님 Claude for Desktop 설치" 불필요** — 민아 = Claude Code 제품의 GUI 앱 Code 모드 = Plugin 설치 본체
- Plugin 설치·실측은 **민아가 즉시 수행 가능**
- 본 보고서 §3.1 "Plugins는 Claude for Desktop 앱 전용"의 해석:
  - "Claude for Desktop" = Anthropic의 Mac/Windows 네이티브 앱 (Claude 제품 패키지)
  - 그 안에 Code 모드로 진입하면 Claude Code 기능 = 민아 환경
  - 민아는 웹 UI를 CDP로 접속했다고 기록했으나, 네이티브 앱 모드에서의 Plugin 동작과 동일한 풀을 참조할 가능성 높음 (후속 실측 확정 필요)

### 12.4 Surface 매트릭스 재정의

기존 로드맵 §2.5 "3 Surface × 3 Layer = 9칸" 설계는 **5 Surface × 3 Layer = 15칸**으로 재작성 필요. 자세한 재설계는 ROADMAP §2.5 갱신 시 반영.

### 12.5 본 정정의 append 근거

- 본 보고서는 PF_MONK_OS 리서치 자산으로, 민아 원본 기록은 보존
- 작가님 고지로 확정된 구조는 쌍아가 §12로 append (수정이 아닌 확장)
- 근거: 헌법 3조 2항 append-only 원칙 + 정본 단일 원칙(본 보고서가 H-7 기준 문서이므로 현행화 필수)
