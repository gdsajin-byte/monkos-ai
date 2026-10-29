---
type: research
date: 2026-10-29
device: iMac
agent: 쌍아-막내1
portfolio: PF_DESIGNLAB
order: monkos-ops/ops/orders/2026-10/ORDER_20261029_iMac쌍아_막내1_DESIGNLAB_디자인하네스_벤치마크.md
subject: "소소(디자인 TF) 강화용 외부 하네스·디자인 도구·스킬 벤치마크"
---

# RESEARCH — 디자인 하네스·도구·스킬 벤치마크

**[2026-10-29 14:21 KST]** iMac/쌍아-막내1 → iMac/쌍아 · 작가님

> **결론 1줄: 외부 도구를 새로 들이는 것보다 이미 가진 것을 고치는 편이 10-28 병목 3개를 더 많이 줄인다. 팀원 정의 안에 그 팀원 전용 Playwright를 넣으면 포트 문제가 정의 파일 안에서 끝난다(공식 문서의 `mcpServers` 필드). 외부에서 하나만 들인다면 Anthropic 공식 `frontend-design` 스킬을 시안 일꾼에게 미리 넣어 두는 것이 가장 싸다. 에이전트 팀은 토큰을 줄이지 못하고 오히려 늘린다(공식 문서) — 시안 경쟁에는 지금의 서브에이전트 방식이 맞다.**

조사 방법: WebSearch·WebFetch로 공식 문서·공식 레포를 읽었다. 설치·가입·로그인·브라우저 사용 0건. 실제로 돌려 봐야 아는 것은 "미실증"으로 적었다. 확인일은 전부 2026-10-29.

---

## 0. 현행 구성 요약 (5줄)

1. **리드** 소소 = 주 세션 정의 `.claude/agents/soso.md`. 기동은 `scripts/mk-soso.sh`(정의 적용 + 세션 이름 + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`을 이 프로세스에만 켬). 헌장은 `PROPOSAL_20261002`(6단계 프로세스, 팀은 2단계 시안 경쟁·5단계 QA에서만).
2. **팀원 3종** — `dsn-scout`(Sonnet, 조사·Playwright 읽기) · `dsn-maker`(Opus, 정적 HTML 시안 1안, 브라우저 없음) · `dsn-critic`(Sonnet, 대조·Playwright 읽기). 셋 다 `omitClaudeMd: true`.
3. **10-28 첫 실가동**(허브 시안 A·B·R): 세션이 `claude bg-spare --bg-spare`로 떠서 `mk-soso.sh`를 거치지 않았다 → 팀 환경변수가 없어 팀 도구가 노출되지 않았다. 팀원은 같은 정의의 **서브에이전트**로 대신 띄웠다.
4. **토큰** 553k = maker-A 230k(85+145) · maker-B 239k(88+151) · critic 84k. **재개 회차가 첫 회차의 1.7배**(이전 대화를 다 들고 감).
5. **브라우저**: 공유 Playwright MCP 5개가 모두 9222(작가님 개인 크롬)에 붙어 있어 팀원은 Playwright를 못 썼다. 캡처는 리드가 `cdp_utils.CDP(port=9226)`로 직접 했다(래퍼 `scripts/tools/playwright_mcp.sh`는 `CDP_PORT` 환경변수로만 포트를 바꾼다, Playwright MCP 0.0.83 고정).

> 10-28 병목 3개 = **① 팀 미노출 ② 토큰 ③ 포트 세팅**. 아래 표의 ⑤열은 이 번호를 쓴다.
>
> **[2026-10-29 14:34 KST 보강 — 민아 14:31 실측, 쌍아 전달]** ①의 원인은 bg 기능 한계가 아니라 `claude --bg` 데몬의 spare 세션에 기동 셸 환경변수(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`·`MONK_ROLE`·`CDP_PORT`)가 전달되지 않은 것이다. 따라서 **①은 도구 후보로 줄일 병목이 아니라 세팅 문제**로 분류한다(표 ⑤열에서 '①'은 "세팅으로 해소" 의미). 같은 원인으로 `CDP_PORT`도 bg 세션에서 빠지므로, 셸 환경변수에 기대지 않고 정의 파일 안에 포트를 적는 추천 ①의 (a)안은 이 문제의 영향을 받지 않는다(미실증).

---

## 1. 비교표

### A. 에이전트 하네스·워크플로

| 후보 | ① 하는 일 | ② 우리 구조에 붙는가 | ③ 비용 | ④ 설치·연결 | ⑤ 줄이는 병목 | ⑥ 출처 (확인 10-29) |
|---|---|---|---|---|---|---|
| **서브에이전트 정의의 `mcpServers` 필드** (Claude Code 내장) | 정의 파일 frontmatter에 MCP 서버를 **그 서브에이전트 전용으로** 인라인 정의한다. `.mcp.json`과 같은 스키마(stdio/http/sse/ws) | 붙는다. `dsn-critic`·`dsn-scout`에 `CDP_PORT=9226`짜리 Playwright를 넣거나, `--isolated --headless`로 CDP 없이 자체 브라우저를 띄우게 할 수 있다. 공유 `.mcp.json`은 그대로 | 무료 | 정의 파일 수정(`.claude/agents/`, 쌍아 소관) | **③ 직접**. 팀원이 스스로 캡처할 수 있게 되면 리드의 캡처 왕복도 줄어 ②도 일부 | https://code.claude.com/docs/en/sub-agents (`mcpServers` 항목) |
| **에이전트 팀** (Claude Code 실험 기능) | 리드 1 + 팀원 N. 작업 목록 공유, 팀원끼리 직접 메시지. 팀원은 프로젝트 정의(`dsn-*`)를 그대로 쓴다 | 조건부. **대화형 세션이 필요하다**(`-p`·SDK에서는 팀원을 띄우지 않고 서브에이전트로 돈다). `--bg` 세션이 대화형으로 치는지는 문서에 없다 → 미실증. 10-28 실패 원인은 환경변수 미설정(bg-spare 경유)이었다 | 무료(구독 토큰) — 문서: "서브에이전트보다 토큰을 훨씬 많이 쓴다", 팀원 수에 선형 | 환경변수 1개(`mk-soso.sh`에 이미 있음) | ①은 **세팅 문제**(spare 세션 env 미전달, 14:34 보강) — 이 도구가 줄이는 병목 아님. **②는 악화**. 팀원 정의의 `mcpServers`는 분할 창 모드에서만 적용, 기본(in-process) 모드는 무시 → ③은 못 줄임 | https://code.claude.com/docs/en/agent-teams |
| **서브에이전트 재개(SendMessage) vs 새로 띄우기** (내장) | 재개하면 이전 대화·도구 결과 전부를 들고 간다(문서) | 붙는다 | 무료 | 운용 규칙만 | **②**. 10-28 1.7배의 원인. 수정 회차는 "직전 파일 경로 + 고칠 목록"만 주고 새로 띄우는 편이 가볍다(미실증 — 비교 1회 필요) | https://code.claude.com/docs/en/sub-agents (Resume 항목) |
| **`frontend-design` 스킬** (Anthropic 공식) | 코드 전에 설계 절차를 강제: 대상·과업 먼저 → 토큰 계획(팔레트·서체·레이아웃) → 브리프 대조 → 제작 → **캡처로 자기 비평** → 반응형·포커스·접근성 하한. 문구 규칙(능동태·행동명 일관·에러 문구) 포함 | 붙는다. 정적 HTML 시안과 맞고, "대상·과업 먼저"는 소소 ① 의도 파악과 같은 방향. 단 "독특한 미감" 지향이라 우리 현행 토큰 고정과 부딪힐 수 있다 → 지시문에 "토큰은 현행 `:root` 고정" 명시 필요 | 무료(파일 2개: `SKILL.md`·`LICENSE.txt` — 라이선스 본문 미확인) | 스킬 폴더 복사 또는 공식 플러그인 마켓 설치. 정의의 `skills:` 필드로 maker에 미리 주입 가능(문서) | ② 간접(되돌림 회차 감소 기대, 미실증). 한 리뷰는 "미감은 오르고 동작 정확성은 그대로"라고 평가 | https://github.com/anthropics/skills/tree/main/skills/frontend-design · 원문 https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md · 설치 경로 불일치 정리 https://designrevision.com/blog/claude-code-frontend-design-plugin |
| **Chrome DevTools MCP** (구글 공식) | 브라우저 제어 + 성능 트레이스·네트워크·콘솔(소스맵)·캡처, 접근성 점검 스킬 | 붙는다. `--browserUrl http://127.0.0.1:9226`처럼 포트를 **인자로** 받고 `--isolated`(임시 프로필), `--viewport 390x844`, `--pageIdRouting`(동시 세션용) 지원 | 무료(오픈소스) | npx MCP — **설치 필요(승인 게이트)** | ③ (인자로 포트 분리). 단 Playwright MCP도 `mcpServers`로 같은 효과 → 추가 이득은 성능 트레이스뿐 | https://github.com/ChromeDevTools/chrome-devtools-mcp · 설정 https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/configuration.md |
| **Cursor Design Mode** (Cursor 3, 04-02 출시 — 3자 기사) | 내장 브라우저에서 요소를 클릭·그리기·음성으로 지시 → 에이전트가 코드 수정 | 안 붙는다. 사람이 IDE에서 쓰는 도구라 bg 세션·소소 흐름 밖. "작가님·꾸가 시안을 손으로 짚어 수정 요청"하는 장면에는 참고 가치 | Cursor 구독(가격 미확인) | 데스크톱 IDE | 없음 | https://cursor.com/blog/design-mode · https://www.cursor.com/changelog/design-mode-improvements |
| **Superdesign** | 프롬프트 → UI 목업·컴포넌트(캔버스). 원래 IDE 확장, 결과를 `.superdesign/`에 로컬 저장 | 약하다. **오픈소스 IDE 확장은 보관(유지보수 중단)**, 현행은 웹앱 + 별도 스킬 레포 | 웹앱 가격 미확인 | 웹 / 스킬 | ② 일부(생성 외주) — 미실증 | https://github.com/superdesigndev/superdesign · https://superdesign.dev |

### B. 생성 도구

| 후보 | ① 하는 일 | ② 붙는가 | ③ 비용 | ④ 연결 | ⑤ 병목 | ⑥ 출처 |
|---|---|---|---|---|---|---|
| **Google Stitch** (Google Labs) | 텍스트·이미지 → 앱/웹 화면 디자인, 코드·DESIGN.md 내보내기. **원격 MCP**(`https://stitch.googleapis.com/mcp`, API 키 헤더 — 3자 가이드 기준) | 조건부. 시안 경쟁의 "제3안" 생성기로 쓰고 maker가 우리 토큰으로 옮기는 형태. 한국어 문구 품질·내보낸 HTML이 정적 단일 파일인지 미실증 | **무료(Labs)**. 한도는 출처마다 다름(월 350/200, 일 400 크레딧 등) — 구글 1차 페이지에서 수치 확인 실패 | 웹 + 원격 MCP. **구글 로그인·API 키 발급 필요(승인 게이트)** | ② (생성 토큰을 외부로) — 미실증 | 공식 문서 https://stitch.withgoogle.com/docs/mcp/setup (본문 렌더링 실패, 제목만 확인) · 3자 https://www.banani.co/blog/google-stitch-pricing-and-credits |
| **v0** (Vercel) | 프롬프트 → React/Next UI, Design Mode, GitHub 동기화 | 약하다. React·Vercel 전제, 우리 시안은 정적 HTML + 포털 SSR. 가격표에 API·MCP 언급 없음 | Free(일 7메시지·신규 $5 1회) / Plus $30/인/월 / Business $100/인/월 / Enterprise | 웹 | 없음 | https://v0.app/pricing |
| **Lovable** | 프롬프트 → 풀스택 앱 | 안 붙는다(앱 빌더, 우리 코드베이스와 별개) | 크레딧제. 공식 페이지에서 금액 미확인(3자: Pro $25) | 웹 | 없음 | https://lovable.dev/pricing |
| **21st.dev (구 Magic)** | 설명 → UI 컴포넌트 여러 변형. `code`(React/shadcn) · **`sketch`(자립형 HTML/Tailwind 초안)** 모드, MCP `generate` 도구는 코드가 아니라 빌드 진행 URL을 돌려줌 | 약하다. sketch 모드는 정적 시안과 맞지만 Tailwind라 우리 토큰 CSS와 다름 | 생성은 유료(정확한 금액은 `21st.dev/pricing.md`, 미확인) | MCP / CLI `npx @21st-dev/cli` — 설치·계정 필요 | 없음(결과가 URL이라 오히려 왕복 증가 가능) | https://21st.dev/magic |
| **shadcn MCP** (공식) | 설정된 레지스트리의 컴포넌트를 찾아 설치 | 안 붙는다. React + `components.json` 전제. 우리는 바닐라 SSR·정적 HTML | 무료 | `npx shadcn@latest mcp` | 없음 | https://ui.shadcn.com/docs/mcp |

### C. 검증 도구

| 후보 | ① 하는 일 | ② 붙는가 | ③ 비용 | ④ 연결 | ⑤ 병목 | ⑥ 출처 |
|---|---|---|---|---|---|---|
| **Playwright `toHaveScreenshot`** (시각 회귀) | 첫 실행이 기준 이미지 생성 → 이후 픽셀 비교. `maxDiffPixels`·`threshold`(기본 0.2), `--update-snapshots` | 붙는다. 5단계 시각 QA(확정안 ↔ 구현물)의 기계 판정. 문서 경고: OS·브라우저·헤드리스 여부가 다르면 렌더가 달라짐 → 기준 이미지는 한 기기(iMac)에서만 | 무료 | `@playwright/test` — **패키지 설치 필요(승인)**. MCP와 별개의 테스트 러너 | ② (critic의 눈 대조를 기계 비교로) | https://playwright.dev/docs/test-snapshots |
| **@axe-core/playwright** (접근성) | axe 엔진으로 대비·라벨 누락·중복 ID 자동 검출. 문서: 자동 점검은 일부만 잡는다 | 붙는다. critic 8항목에 "접근성"이 없음 → 1항목 추가 근거 | 무료 | npm 패키지 — **설치 필요(승인)**. 설치 없이도 Playwright MCP `browser_evaluate`로 axe 스크립트를 주입하는 방법이 있으나 CDN 로드라 미실증 | 품질 축 추가(병목 감소는 아님) | https://playwright.dev/docs/accessibility-testing |
| **Chromatic** (Storybook 시각 회귀 SaaS) | 컴포넌트 스토리 단위 캡처 비교·리뷰 UI | 안 붙는다. Storybook 컴포넌트 체계 전제, 우리는 페이지 단위 SSR | Free 월 5,000 스냅샷 / Starter $179 / Pro $399 | SaaS + CI | 없음 | https://www.chromatic.com/pricing |
| **Style Dictionary v4** (토큰 빌드) | 토큰 원본(JSON, W3C DTCG `$type`/`$value`) → CSS 변수 등 플랫폼별 출력 | 나중. 소소 상시 업무 "토큰 정리"(포털 `:root`·monk.kr 팔레트·표면 CSS 11파일 산재)의 최종 형태. 지금은 정본이 코드 `:root`라 도입 전 정리 선행 | 무료(오픈소스, Tokens Studio 공동 유지 — 3자) | npm 빌드 도구 — 설치 필요 | 없음(장기 정합성) | https://styledictionary.com (공식 문서 직접 확인 못함 — 3자 요약 https://docs.tokens.studio/convert-to-dtcg-format) |

### 이미 연결된 도구 — 활용도

| 도구 | 지금 쓰는 정도 | 더 쓸 자리 |
|---|---|---|
| **Playwright MCP** | 팀원이 못 씀(9222 고정 → 금지 포트) | 위 `mcpServers`로 팀원별 포트 분리 — **1순위** |
| **CDP 스크립트** (`cdp.sh`·`cdp_utils.py`) | 리드가 9226에서 캡처·`getComputedStyle`·4xx 실측 — 10-28 실검증의 전부 | 같은 절차를 "캡처 프로브" 1개 스크립트로 묶어 팀원 Bash에서 호출(이미 `cap_probe.json`이 산출물에 있음) |
| **Figma MCP** | 10-28 미사용 | `get_screenshot`·`get_variable_defs`는 Figma 원본이 있을 때만 의미. 우리 정본이 코드라 **역방향(코드 → Figma)** 이 쓸모 — 결정권자(작가님·꾸)가 시안 2안을 한 보드에서 나란히 보고 코멘트. 미실증 |
| **Artifact** (`artifact-design`) | 10-28 미사용, 결정 요청은 레포 MD + 로컬 HTML 링크 | 결정 요청 3단계를 **비공개 아티팩트 링크**로 — 작가님이 휴대폰에서 시안 A·B를 바로 열 수 있다. 로컬 `index.html` 링크는 iMac 밖에서 안 열림 |
| **Canva MCP** | 미사용 | 마케팅 소재용. UI 시안에는 부적합 |
| **IMAGE PRO · Kling** | 미사용. 시안에 "샘플 사진 자리"가 빈칸으로 남음(10-28 critic 지적, 자산 목록으로 인계) | 기존 모델스 캐릭터 재활용으로 샘플 사진 채우기(새 인물 생성 전 재활용 먼저). 정체성 원칙상 실존 고객 사진은 쓰지 않음 |

---

## 2. 추천 3

### ① [기존 도구] 팀원 정의에 전용 Playwright 넣기 — 포트 병목 해소

- **무엇**: `dsn-critic`·`dsn-scout` frontmatter에 `mcpServers` 인라인 Playwright를 넣는다. 두 갈래 중 하나:
  - (a) 기존 래퍼 재사용 — `command: bash`, `args: [scripts/tools/playwright_mcp.sh]`, `env: {CDP_PORT: "9226"}` → 이미 쓰는 9226 크롬에 붙는다. 래퍼는 포트 미응답 시 그 포트로 디버그 크롬을 자동 기동하므로 추가 설치 없음.
  - (b) CDP 없이 — `npx @playwright/mcp@0.0.83 --isolated --headless --viewport-size 390x844` → 포트 자체가 사라진다. 대신 Playwright 브라우저 바이너리가 있는지 미확인(없으면 설치 = 승인 게이트).
  - 권고는 (a): 설치 0, 10-28 리드가 검증한 9226 절차와 같은 크롬.
- **왜**: 공유 `.mcp.json`을 건드리지 않고, 소소 세션 밖에는 영향이 없다. 정의의 도구 목록(`mcp__playwright__*`)은 이름이 같으면 그대로 쓸 수 있는지 미실증 — 인라인 서버 이름을 `playwright`로 두면 공유 서버와 이름이 겹친다. 겹칠 때 어느 쪽이 이기는지 문서에 없음 → 별도 이름(`pw-design`)과 도구 목록 교체가 안전.
- **주의**: 에이전트 팀의 기본(in-process) 모드에서는 이 필드가 **무시된다**(공식 문서). 서브에이전트 운용에서만 효과. 이것도 팀보다 서브에이전트를 권하는 이유다.
- **첫 시험 1건**: `dsn-critic` 정의 1개에만 (a)를 넣고, 10-28 산출물 `A_세로카드/index.html`을 390폭으로 캡처 1장 + 4xx 목록 반환시킨다. 판정 = 캡처가 9226 탭에서 찍혔는지(9222 탭 목록 변화 0)·도구 호출 성공. 정의 수정은 `.claude/` = 쌍아 소관.

### ② [외부, 무료] `frontend-design` 스킬을 시안 일꾼에게 미리 주입

- **무엇**: Anthropic 공식 스킬 1개(SKILL.md)를 프로젝트 스킬로 두고 `dsn-maker` 정의의 `skills:`에 넣어 시작 시 주입(문서상 본문 전체 주입).
- **왜**: maker는 브라우저도 체크리스트도 없이 시안을 만들고, 결함은 리드 캡처·critic에서 잡혀 재개 회차(1.7배 토큰)로 돌아왔다. 이 스킬은 "토큰 계획 → 브리프 대조 → 캡처 자기 비평 → 반응형·포커스 하한"을 제작 안에 넣는다. ①과 함께 maker에게도 전용 Playwright를 주면 자기 비평이 실제로 가능해진다.
- **충돌 지점**: 스킬은 "템플릿 같은 기본값을 피하는 독특한 미감"을 민다. 우리 시안은 현행 토큰·되는 것만이 우선 → maker 지시문에 "토큰은 현행 `:root`만, 미감 판단은 레이아웃·위계에 한정" 한 줄을 고정해야 한다. 라이선스 본문은 미확인 — 복사 전에 `LICENSE.txt` 확인.
- **첫 시험 1건**: 10-28 허브 브리프로 maker 1회(스킬 주입, 새로 띄움)를 돌려 10-28 maker-A 첫 회차(85k·결함 3)와 비교한다. 잴 것 = 토큰, 리드 캡처에서 나온 결함 수, critic 불일치 수.

### ③ [운용] 수정 회차는 재개하지 말고 새로 띄우기 + 팀 기능은 보류

- **무엇**: 시안 수정은 `SendMessage` 재개 대신 "현재 파일 경로 + 고칠 목록 n개"만 담은 새 서브에이전트로. 에이전트 팀은 시범 계측(훅·session_id·이름)이 목적일 때만 **대화형** `mk-soso.sh`로 1회.
- **왜**: 재개는 이전 대화·도구 결과를 전부 들고 간다(문서) → 10-28 재개 회차 145k·151k. 에이전트 팀은 "서브에이전트보다 토큰을 훨씬 많이 쓴다"고 공식 문서가 적고 있고, 팀원 전용 MCP(①)도 기본 모드에서 무시된다. 10-28 "팀 미노출"의 원인은 기능 한계가 아니라 `--bg` 데몬 spare 세션에 기동 셸 환경변수가 전달되지 않은 것(민아 14:31 실측) — 세팅 문제이며, 고칠 것은 기동 경로이지 도구가 아니다.
- **첫 시험 1건**: 다음 시안 수정 1건을 "새로 띄우기"로 돌려 토큰을 10-28 재개 회차(145k)와 비교한다.

> 외부 생성 도구(Stitch·v0·21st)는 이번 추천에서 뺐다. Stitch는 무료이고 원격 MCP가 있어 가장 근접하지만 구글 로그인·API 키 발급이 필요하고(승인 게이트), 한국어 문구·우리 토큰 반영이 미실증이며, 생성물을 우리 토큰으로 옮기는 maker 작업이 그대로 남는다. 위 3건 뒤 "시안 경쟁에 제3의 시각이 필요하다"는 판단이 서면 그때 1회 시험할 후보 1번.

---

## 3. 미확인·한계

- **설치·실행 0건**이라 표의 모든 "붙는다"는 문서 기준이다. 특히 ① 인라인 MCP의 `env` 필드 적용·도구 이름 충돌, ② 스킬 주입 시 토큰 증가분, `--bg` 세션의 팀 기능 지원 여부는 미실증.
- **Google Stitch** 공식 문서 본문을 읽지 못했다(제목만 렌더링). 엔드포인트·인증·무료 한도는 3자 가이드이며 출처끼리 수치가 다르다.
- **가격** 원문 확인: v0·Chromatic. 미확인(3자만): Lovable·21st.dev·Cursor·Superdesign 웹앱.
- **Style Dictionary** 공식 사이트 직접 확인 못함(3자 요약).
- **미조사**: Codex·Gemini CLI의 디자인 전용 모드 — 공식 문서에서 해당 기능을 찾지 못해 표에서 뺐다. Percy·BackstopJS·Lighthouse CI 등 다른 시각 회귀·성능 도구는 Playwright 내장 기능과 겹쳐 생략.
- `frontend-design` 설치 명령은 출처마다 마켓 이름이 다르다(`claude-code-plugins` / `claude-plugins-official`). 도입 시 `/plugin` 실측 필요.
- 도입 판정은 쌍아·작가님. 이 보고서는 사실과 추천까지다.
