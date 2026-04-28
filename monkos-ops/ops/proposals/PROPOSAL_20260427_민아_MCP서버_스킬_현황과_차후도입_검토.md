---
type: proposal
date: 2026-04-27
from: iMac/민아
status: open
subject: 현재 MCP 서버 + 스킬 현황 + 차후 도입 후보 정리 (monkos.ai 비즈니스 적합도 기준)
---

# MCP 서버 + 스킬 현황 + 차후 도입 후보

**[2026-04-27 16:55 KST] iMac/민아 → 작가님**

> 작가님 지시: "현재 우리 MCP서버 현황과 차후 도입할 스킬 파트 서치하고 보고"

---

## 0. 한 페이지 요약

| 영역 | 현황 | 권고 |
|------|------|------|
| Claude 앱(웹/Desktop) connector | **0개** (mcp-registry list 결과) | claude.ai/customize 미설정 — 별도 환경 |
| Claude Code MCP (활성) | 약 14종 (Google Workspace + GA4 + GSC + chrome-devtools 등) | 안정적, 주력 도구 |
| 직접 정의 MCP (`~/.claude/mcp.json`) | chrome-devtools-mcp 1개 (CDP 9222) | OK |
| user-invocable Skills | 16종 (anthropic-skills 8종 + monkos-content + 일반 7종) | OK |
| 마켓플레이스(claude-plugins-official) | **221개** 플러그인 등록됨 | 검토 필요 |
| **Tier S 도입 후보** | adspirer-ads-agent / cloudflare / github / telegram / searchfit-seo | **5종 우선 검토** |

---

## 1. 현재 MCP 서버 현황

### 1-1. 두 환경의 구분
- **Claude 앱(웹/Desktop) connector**: `mcp__mcp-registry__list_connectors` 결과 **0개**. claude.ai 측 OAuth connector 미연결. 민아·쌍아·막내는 Claude Code 환경이라 이쪽은 부수적
- **Claude Code 환경의 MCP**: 시스템 프롬프트의 deferred tools 풀에 다수 활성. 우리 일상 작업의 본진

### 1-2. Claude Code 활성 MCP (deferred tools 풀에서 식별)

| MCP 서버 | 주요 도구 | 사용 빈도 |
|----------|---------|---------|
| **google-analytics** | run_report, list_google_ads_links 등 7종 | ✅ 사용 중 (오늘 GA4 분석) |
| **google-search-console** | search_analytics, index_inspect, sitemap 등 8종 | ✅ 사용 중 (오늘 GSC 분석) |
| **google-docs** | createDocument, readGoogleDoc, insertText, insertTable 등 50+종 | ✅ 사용 중 (메모리 mcp_over_cdp_for_docs) |
| **chrome-devtools** (mcp.json 직접 정의) | 9222 포트 CDP 연동 | ✅ 일상 (cdp.sh와 보완) |
| **Claude_Preview** | preview_start, preview_screenshot, preview_eval 등 | 가끔 (UI 검증) |
| **Claude_in_Chrome** | navigate, browser_batch 등 | ⚠️ CDP-rule로 사용 금지(`.claude/rules/cdp-browser.md`) |
| **Control_Chrome** | open_url, execute_javascript 등 | 미사용 |
| **PDF_Tools** | merge/split/fill/extract 등 25종 | 가끔 |
| **computer-use** | screenshot, click, type 등 30+종 | 특수 (네이티브 앱) |
| **git** | git_log, git_status 등 | 보조 (Bash 위주) |
| **Gmail** (UUID 898025...) | create_draft, search_threads 등 | 미사용 (작가님 텔레그램 신경계) |
| **Drive** (UUID bb5f7fc9...) | create_file, search_files 등 | 가끔 |
| **Calendar** (UUID ea325985...) | create_event, list_events 등 | 미사용 |
| **mcp-registry** | search/list/suggest connectors | 메타 도구 |
| **scheduled-tasks** | create/list/update | 미사용 |

### 1-3. 직접 정의 MCP (`~/.claude/mcp.json`)
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
    }
  }
}
```
→ chrome-devtools-mcp만 단독. CDP 자체는 `scripts/tools/cdp.sh`/`cdp_utils.py`로 운영 (legal: ch7 6조 / `.claude/rules/cdp-browser.md`)

### 1-4. settings.json permissions
- 105개 allowlist 항목 (gsutil/gcloud/bash/curl/git/sshpass 등 일상 명령)
- `mcp__google-analytics__get_account_summaries`, `mcp__google-analytics__run_report` 명시 허용
- `effortLevel: high`, `skipDangerousModePermissionPrompt: true`

---

## 2. 현재 활용 가능한 Skills (16종)

### 2-1. anthropic-skills 패키지 (8종)
- **schedule** — 스케줄 태스크
- **setup-cowork** — Cowork 설정
- **consolidate-memory** — 메모리 정리/통합
- **skill-creator** — 신규 스킬 생성/측정
- **pptx / docx / xlsx / pdf** — 오피스 파일 처리
- **monkos-content** ⭐ — 한송이용 한국어/일본어 SNS 콘텐츠 자동 생성 (커스텀)

### 2-2. 일반 (8종)
- **update-config** — settings.json 조작
- **keybindings-help** — 키바인딩 변경
- **simplify** — 코드 리팩터링
- **fewer-permission-prompts** — 허용 자동 추가
- **loop** — 반복 실행
- **claude-api** — Anthropic SDK 작업
- **init / review / security-review** — Claude Code 기본

### 2-3. 평가
- monkos-content 외에는 **MONK 도메인 특화 스킬 없음**. 우리 SEO/광고/콘텐츠/CDP 작업 패턴이 스킬화 안 된 상태
- skill-creator로 **자체 도메인 스킬 발행 가능**

---

## 3. 마켓플레이스 (claude-plugins-official) 221개 → 비즈니스 적합 36개 필터링 → 우선순위

### 🔴 Tier S (즉시 도입 검토) — monkos.ai 운영 핵심에 직결

| # | 플러그인 | 가치 | 카테고리 |
|---|---------|------|--------|
| 1 | **adspirer-ads-agent** ⭐ | Google Ads + Meta Ads + TikTok Ads + LinkedIn Ads 91 도구. 오늘 우리가 한 광고 분석을 자동화. 캠페인 생성/예산 조정도 가능 | productivity |
| 2 | **cloudflare** ⭐ | Workers/Pages/Wrangler. monk.kr이 CF Pages, monkos.ai functions/도 CF. 직접 제어 + 배포 자동화 | deployment |
| 3 | **github** ⭐ | gh CLI를 MCP화. 이슈/PR 관리·검색 자연스러움 | productivity |
| 4 | **telegram** ⭐ | 작가님 메모리 "텔레그램=신경계" 전제와 정합. 한송이/꾸 채널 자동화 | productivity |
| 5 | **searchfit-seo** ⭐ | SEO audit + content strategy + schema markup + keyword cluster + AI search tracking. 오늘 트랙 A-F 작업의 자동화 가능성 | (미분류) |

### 🟡 Tier A (가치 큼, 단기 검토)

| # | 플러그인 | 가치 |
|---|---------|------|
| 6 | **firebase** | GA4 monkos-3c6e4가 Firebase 계정. Firestore 직접 관리 |
| 7 | **figma** | 디자인 토큰/컴포넌트 → 코드 변환. idphoto-jp UI |
| 8 | **sentry** | 에러 모니터링. 현재 미흡 |
| 9 | **brightdata-plugin** | Google 검색 결과 직접 스크랩 + 7 skills. 경쟁사 SEO 분석 |
| 10 | **windsor-ai** | 325+ 마케팅 데이터 통합 (광범위) |
| 11 | **posthog** | 제품 분석. GA4 보완 (이벤트 추적 풍부) |

### 🟢 Tier B (특수 용도, 우선순위 낮음)

| # | 플러그인 | 평가 |
|---|---------|------|
| 12 | **stripe** / **sumup** | 한국 미지원, LS API 우회 운영 중 (메모리 ls_api_survival) |
| 13 | **notion** | governance/laws 체계와 충돌. monkos-ops 정본 정책 위배 가능 |
| 14 | **linear** | 이슈 트래킹. 작가님 메모리상 미사용 |
| 15 | **slack** | 텔레그램 신경계라 불필요 |
| 16 | **wordpress** | CF Pages 사용으로 불필요 |
| 17 | **railway** | Cloud Run 사용으로 중복 |

### ⚠️ 도입 안 권고

| # | 플러그인 | 사유 |
|---|---------|------|
| - | spotify-ads-api | 비즈니스 외 |
| - | imessage | 텔레그램 채널 우선 |
| - | apollo (sales) | B2C 위주라 부적합 |
| - | aikido / sonarqube | 보안 도구 — 별도 검토 |

---

## 4. 권고 — 단계별 도입 로드맵

### Phase 1 (이번 주 검토) — Tier S 5개 중 2개
1. **adspirer-ads-agent**: 오늘 Ads 분석을 한 번 더 손으로 한다면 즉시 도입 가치
2. **telegram**: "신경계" 자동화 시작 — 한송이/꾸 채널 알림 자동화 시범

### Phase 2 (이달 내)
3. **cloudflare**: monk.kr / functions/ 배포 라인 직접 통합
4. **github**: gh CLI 동작을 MCP로 자연어화

### Phase 3 (장기)
5. **searchfit-seo**: 오늘 패턴(트랙 A-F)을 스킬화. monkos-content와 묶어 "MONK SEO 자동화 패키지" 가능
6. **firebase / sentry / figma**: 필요 시점에 추가

### Phase 4 (자체 스킬)
- **skill-creator로 MONK 전용 스킬 발행**
  - `monkos-seo-audit` — 오늘 트랙 A-F 패턴 자동화
  - `monkos-ads-monitor` — 일일 Ads 스냅샷 + 4/22형 사건 알림
  - `monkos-content-deploy` — 콘텐츠 게시 → SNS 배포까지
- 작가님 비전 "MONKOS 엔드게임" / "자비스" 라인과 정합

---

## 5. 의존성 / 리스크

- **거버넌스 충돌 점검**: notion/linear 같은 외부 SaaS는 monkos-ops 정본 정책(헌법 3조 4항)과 마찰 가능. 운영 정본은 git, 외부 SaaS는 보조용으로 명확히
- **권한 폭증**: MCP 도입 시 settings.json allow 누적 → 보안 검토 필요. fewer-permission-prompts 스킬과 함께 관리
- **세션 토큰 비용**: MCP 도구 풀이 커지면 deferred tools 메타데이터로 컨텍스트 일부 점유. ToolSearch 패턴 유지

---

## 6. 다음 단계

작가님 결정 사항:
- (a) Phase 1의 2종(adspirer-ads-agent, telegram) 즉시 검토 → 설치 시 단계별 가이드 제공
- (b) Phase 2~4는 본 어젠다로 적립 후 트리거 조건 도달 시 진행
- (c) 본 보고서 외에 추가 분석 필요 영역 (예: Naver Search Ads MCP — 등록되지 않음, 별도 자체 MCP 제작 필요)

— iMac/민아
