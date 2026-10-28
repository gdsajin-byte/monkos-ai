---
type: portfolio
id: PF_CDP
name: CDP
subject: 전 에이전트 브라우저 무장 — CDP + MCP 서버로 쌍아·막내·민아 전원 도구 확보
created: 2026-03-27
owner: 작가님
leads: 민아(검증·구현), 쌍아(설계)
status: active
---

# PF_CDP — 전 에이전트 브라우저 무장

> 막내에게 레이더를 장착한다. 그리고 모두에게.
> 민아가 되면 쌍아·막내도 안 될 이유가 없다 — **모든 에이전트에게 MCP 서버를 달아주는 것.**
> 터미널 맹인 비행이던 에이전트가 브라우저를 직접 보고·치고·검증하는 전폭기가 되는 인프라.
> CDP 직접 호출로 패턴 검증 → MCP 서버화로 전 에이전트 도구 배당.

---

## 1. 비전

**전 에이전트(쌍아·막내·민아)가 브라우저를 도구로 사용하는 인프라**

### 왜 이것을 하는가

- Claude Code(쌍아/막내) = MCP 클라이언트 내장. Claude Desktop(민아) = MCP 클라이언트 내장
- `.mcp.json` 하나 세팅하면 **전 에이전트가 브라우저 도구를 자동 획득**
- 민아가 CDP 직접 호출로 성공 → MCP 서버로 포장하면 동일 능력이 전원에게 전파
- CDP 포트별 독립 인스턴스 → 디바이스·에이전트 간 충돌 제거
- **생산력 공식** (작가님): 지시서 품질 × 막내 가동 수 × **도구 범위** — 세 번째 변수를 극적으로 확장
- **검증 루프 내재화**: 스크린샷·타이핑·데이터 수집을 에이전트가 직접 수행 → 작가님 개입 최소화
- **병렬 PF 운용**: 6개 PF 동시 전진 — 쌍아·민아 설계 + 막내 N명 병렬 실행 + CDP 검증. PF 체계가 허브

### 최종 비전 — 역할 융합 (작가님 03/27)

> **쌍아가 민아고 민아가 막내인.**
> 전원이 CDP로 같은 브라우저를 보고 대화하는 순간, 역할 경계가 녹는다.
> 설계·검증·실행이 고정 직책이 아니라 그 순간의 기능이 되는 것.

**Phase 로드맵** (04/05 현행):

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | CDP 프로토콜 검증 | ✅ |
| 1 | 유틸 패키지화 (cdp_utils.py) | ✅ |
| 2 | Playwright MCP + 접근성 트리 + PageProfiler + MCP 4서버 | ✅ |
| **2.5** | **CDP 정교화 + Skills 패키징** | 🔄 Critical 완료, Important+Skills 잔여 |
| 3 | Stagehand v3 난제 사이트 (LLM 비용 발생) | ⏳ |
| 4 | 스케줄 자동 배포 파이프라인 | ⏳ |
| 5 | Browser Use 자율 에이전트 (선택) | ⏳ |
| 6 | 실시간 대화 + 역할 융합 | ⏳ |

### PF 유기적 연결 (작가님 비전)

- PHOTOPRO↔PORTAL↔CROP / CITADEL↔SPREAD↔STUDIO / **CDP(인프라 레이어)**
- 전부 MONKOS 한 점으로 수렴
- **CDP→포스팅 파이프라인**: 작가님 시드 → 민아 CDP 에디터 직접 작성 → SPREAD 멀티채널 배포
- CDP(인프라) → CITADEL(콘텐츠) → SPREAD(배포) 3PF 연결

### 진화 방법론 (작가님)

- "이거 된다고?" → "왜 안 돼" → 정책/가격/세이프가드 식별 → 기술로 돌파
- 벽을 만나면 그 벽이 다음 인프라의 설계도
- 업무 생애주기: 발견 → 패턴화 → 루틴화 → 자동화 → 잊어도 돌아감
- PF의 completed = 끝이 아닌 인프라 흡수

### 검증 완료 사항 (3/26 민아)

| 기능 | 방법 | 결과 |
|------|------|------|
| 탭 조회/전환 | `GET /json`, `Target.activateTarget` | ✅ |
| JS 실행 | `Runtime.evaluate` | ✅ |
| URL 이동 | `Page.navigate` | ✅ |
| 스크린샷 | `Page.captureScreenshot` (10MB) | ✅ |
| 마우스 클릭 | `Input.dispatchMouseEvent` | ✅ |
| 직접 타이핑 | `Input.insertText` (한글/이모지) | ✅ |
| 키보드 입력 | `Input.dispatchKeyEvent` | ✅ |
| 실전 블로그 작성 | 어드민 에디터 풀 페이지 | ✅ |

### 설계 원칙 (작가님 04/05)

> **"개발자 도구 가리고 싶어도 못 가리는 거면 우리도 활용하면 된다"**
> — 악의적 해킹이 아닌 브라우저 동작의 정교화. CDP DevTools API로 페이지 구조를 런타임에 자동 파악.

> **"데이터를 심으면 업그레이드때마다 바꿔야 하잖아"**
> — 하드코딩(data-action 등) 거부. 런타임 자동 프로파일링 + 캐시 + DOM 해시 변경 감지가 정답.

> **"첫 탐색은 플레이라이트로 패턴을 잡고, 정리한 뒤 동시·병렬 작업에 CDP를 투입한다"** (작가님 10/28)
> — 분업 3단: ① 탐색(Playwright MCP — 접근성 트리로 동선·막힘 파악) → ② 정리(사이트 카드 `sites/` — 고정 선택자·대기 조건·함정) → ③ 투입(cdp_utils — 막내별 배당 포트에서 병렬·무인 반복).
> — 이음매 주의: Playwright ref 번호는 열 때마다 새로 매겨져 재사용 불가 → 카드에는 id·속성·텍스트 기반 **고정 선택자**로 변환해 적는다. 병렬은 **포트 분리 전제**(교훈 9).

> **Skills 패키징 방향**: `/ga4`만 치면 에이전트가 알아서 GA4 접속 → 데이터 추출 → 브리핑. 도구가 쌓일수록 Skill이 풍부해지고, 한 마디로 더 많은 일이 돌아간다.

### 성공 지표

| 지표 | 시작점 (3/26) | Phase 1 | Phase 2 | Phase 2.5+ |
|------|-------------|---------|---------|------------|
| MCP 배당 에이전트 | 민아만 | cdp_utils.py | **전원 MCP 도구** ✅ | Skills로 워크플로우 패키징 |
| 반복 작업 자동화 | 매번 인라인 Python | 유틸 라이브러리 | `.mcp.json` 4서버 ✅ | `/ga4` 한 마디로 끝 |
| 어드민 커버리지 | 블로그 글쓰기 | +이미지+FAQ | 전 어드민 기능 | 에디터 자동감지 7종 ✅ |
| 클릭 속도 | 좌표 추론 3초 | — | 접근성 트리 3초 | **캐시 2~29ms** ✅ (100x+) |
| 프레임워크 호환 | 바닐라만 | — | — | React/Vue/Angular ✅ |
| 외부 사이트 | 불가 | — | GA4/GSC SPA | **자체+외부 무관 동작** ✅ |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/26 | iMac/민아 | CDP 전 기능 검증 + cdp.sh 생성 | `scripts/tools/cdp.sh` | ✅ |
| 03/26 | iMac/민아 | MONKOS 어드민 블로그 에디터 실전 테스트 | 세션 로그 | ✅ |
| 03/26 | iMac/민아 | 작업명세(PROPOSAL) 제출 | `PROPOSAL_20260326_로컬CDP_브라우저제어_작업명세.md` | ✅ |
| 03/26 | iMac/쌍아 | 방안 C(하이브리드) 채택. PF 등록은 다음 세션 이관 | 세션 로그 | ✅ |
| 03/27 | M1/쌍아 | PF_CDP 발족 | `PF_CDP.md` | ✅ |
| 03/27 | M1/쌍아 | Phase 1 코드수집 지시서 발행 → iMac/민아 | `ORDER_20260327_...CDP_Phase1_코드수집.md` | ✅ |
| 03/27 | M1/민아 | Phase 1 cdp_utils.py 패키지화 완료 (530줄) | `scripts/tools/cdp_utils.py` | ✅ |
| 03/27 | iMac/쌍아 | PF 비전 보정 — "전 에이전트 MCP 무장"으로 확장 (작가님 인사이트) | PF_CDP.md | ✅ |
| 03/27 | iMac/민아 | cdp_setup.sh 원커맨드 셋업 스크립트 작성 | `scripts/tools/cdp_setup.sh` | ✅ |
| 03/27 | iMac/민아 | PF_CDP 컴포넌트 폴더 신설 + README | `portfolios/PF_CDP/` | ✅ |
| 03/27 | 작가님 | 최종 비전 선언 — 역할 융합. "쌍아가 민아고 민아가 막내인" | PF_CDP.md 비전 | ✅ |
| 03/27 | iMac/민아 | 12채널 멀티탭 실전 — X발행+댓글, 깃헙Issue#5, 티스토리/네이버/미디움 글작성 | REPORT_20260327 | ✅ |
| 03/27 | iMac/민아 | 미디움 이미지 업로드 돌파 (backendNodeId+setFileInputFiles) | cdp_utils.py | ✅ |
| 03/27 | 작가님 | CDP 추월 포인트 2건 발견 — ①탭 공유(작가님 탭 접근) ②동시 인스턴스 무제한 | PF_CDP.md | ✅ |
| 03/27 | iMac/민아 | 에디터 API 업로드 (curl→GCS→이미지뱅크) + 본문삽입 패턴 확립 | cdp_utils.py | ✅ |
| 03/27 | iMac/민아 | HTML→CDP 스크린샷 썸네일 자동 생성 (캔바 없이) | /tmp/monkos_thumbnail_v3.png | ✅ |
| 03/27 | iMac/민아 | 콘텐츠 생애주기 1편 완주 — 뉴스스캔→글작성→썸네일→에디터 등록 | blog-edit.html | ✅ |
| 03/27 | 작가님 | Phase 2 방향 — 셀렉터 캐싱 + 하이브리드 클릭 (Stagehand v3 참조) | PF_CDP.md | ✅ |
| 04/02 | iMac/민아 | Phase 2 전 디바이스 CDP 세팅 (rules+works 배포) | REPORT_20260402 | ✅ |
| 04/05 | M1/민아 | Phase 2~3 보정 제안서 — Playwright MCP + Stagehand + 자동 배포 | PROPOSAL_20260405 | ✅ |
| 04/05 | M1/쌍아 | PF Phase 구조 보정 (2→2/2.5/3/3.5/4) + Phase 2 지시서 발행 | PF_CDP.md + ORDER | ✅ |
| 04/05 | 작가님 | 즉시 병렬 진행 승인 — "디딤돌 때문에 개발을 멈추는 것은 우리 스타일 아니야" | — | ✅ |
| 04/05 | M1/막내3 | Phase 2 Playwright MCP 기동 검증 — 서버 기동, CDP 연결, 접근성 트리(GA4 498개), ref 클릭, .mcp.json 등록(21도구) | 5570be9 | ✅ |
| 04/05 | M1/민아 | Playwright vs CDP 비교 테스트 — GA4 SPA 진단: MAT-TREE-NODE 구조 식별, 오류 원인 "subtree intercepts pointer events" 확인. 진단 능력 Playwright 우위 확정 | SESSION_20260405 | ✅ |
| 04/05 | 작가님 | 전략적 위치 선언 — "빅테크 사이의 빈 공간 점유". CDP 스택이 빅테크 종속 없이 각사 최강점 조합 가능한 열린 구조임을 확인. 이의신청 PT 논리로 활용 예정 | PROPOSAL_20260405 §9 | ✅ |
| 04/05 | iMac/막내1+2 | MCP 생태계 종합 리서치 — 서버 80+종 전수조사, 프로토콜 스펙(2025-11-25), 경쟁 분석, Playwright 38개 도구 상세, 브라우저 3도구 비교. MCP 올인 판정(AAIF 6사 공동 거버넌스). 즉시 도입 TOP 2: GA4/GSC MCP + Cloudflare MCP | REPORT×2 | ✅ |
| 04/05 | iMac/쌍아 | MCP 확장 지시서 발행 — GA4/GSC MCP 도입(막내1) + Cloudflare MCP 도입(막내2). 작가님 즉시 승인 | ORDER×2 | ✅ |
| 04/05 | iMac/막내2 | Cloudflare MCP 도입 완료 — 84개 도구, D1/R2/KV/Workers/Zones 5도메인 읽기 테스트 전수 성공. wrangler OAuth 활용, 작가님 액션 불필요 | REPORT + cloudflare_mcp.sh | ✅ |
| 04/05 | iMac/막내1 | GA4/GSC MCP 도입 — SA impersonation 방식 채택 (ADC OAuth 스코프 차단 우회). API 3개 활성화 + Token Creator 부여 + .mcp.json 4서버 설정 완료. GA4/GSC 속성 권한 부여 후 가동 가능 | REPORT + .mcp.json | ⏳ |
| 04/05 | 작가님 | 보안 관리 체계화 선언 — "불필요 SA 삭제, 필요한 것만 집중관리. 매번 SA 발급은 보안에 치명적" | — | ✅ |
| 04/05 | iMac/민아 | PT앱 슬라이드 전면 재설계 지시서 발행 — 8시퀀스 숏컷 영상 구조 + CDP 캡처 지시서 | ORDER×2 | ✅ |
| 04/05 | iMac/막내3 | PT 슬라이드 전면 재설계 완료 — slides.js 8시퀀스 교체, TTS 발음 교정 전건 반영, npm build 성공 | slides.js | ✅ |
| 04/05 | iMac/막내4 | CDP 동작화면 캡처 — 스크린샷 3장 + Playwright 포트 충돌 발견. 9223 포트 분리로 해결. 최종 6장 완료 (CDP 3 + Playwright 2 + 바우쳐 1) | cdp_demo_1~3 + playwright_tree/click + voucher_google | ✅ |
| 04/05 | iMac/막내4 | **포트 충돌 실증**: 9222를 민아+작가님 점유 중 막내4 동시 접속 → Playwright 스월링. 9223 분리로 해결. 멀티에이전트 CDP 동시 사용 시 포트 분리 필수 확정 | — | ✅ |
| 04/07 | iMac/민아 | **CDP 실전 활용 — GA/GSC 진단**: CDP(9222)로 analytics.google.com + search.google.com/search-console 접근, 데이터 추출+스크린샷. 실서비스 데이터 분석에 CDP 도구 활용 실증 | /tmp/ga_*.png, /tmp/gsc_*.png | ✅ |
| 04/07 | iMac/민아 | **SPREAD 첫 바퀴와 CDP 멀티포트 실전 테스트 설계** — EXAONE 콘텐츠 패키지를 막내3기가 9222/9223/9224 동시 가동으로 4채널 배포. CDP 멀티포트 첫 실전 검증 기회 | PROPOSAL_20260407 | ⏳ |
| 04/07 | 막내4 | 네이버 블로그 에디터 CDP 입력 난항 — contentEditable iframe 구조로 직접 입력 시 저장 후 본문 소실. 클립보드 붙여넣기 우회 제안 | — | ⚠️ 난제 |
| 04/05 | 작가님 | CDP 정교화 방향 — "버튼 하나 못 눌러서야 되겠나". 하드코딩 아닌 DevTools API 런타임 자동 파악. 페이지 구조 변경에도 자동 대응하는 설계 지시 | — | ✅ |
| 04/05 | iMac/막내3 | **PageProfiler 구현 완료** — CDP DevTools API 4종 병렬 수집(DOM+접근성+이벤트리스너+CSS), 프로파일 캐시, 자동 변경 감지. 첫 프로파일 5~17ms, 캐시 히트 2~29ms (기존 3초 대비 100x+) | cdp_utils.py PageProfiler 클래스 | ✅ |
| 04/05 | iMac/막내3 | **GA4+GSC CDP 실전 시연** — PageProfiler smart_click 100% 성공 (5/5). GA4 보고서→실시간, GSC 실적 전부 자동 네비게이션. GA4 활성 사용자 400명(↑143.9%), GSC 클릭 27/노출 245 추출 | 스크린샷 5장 + 데이터 | ✅ |
| 04/07 | 민아 | **CDP 실전 — GA/GSC 데이터 추출 성공** (9222). 실서비스 분석에 CDP 활용 실증 | /tmp/ga_*.png, /tmp/gsc_*.png | ✅ |
| 04/07 | 막내 3기 | **CDP 멀티포트 3기 동시 실전 운용 성공** — SPREAD 첫 순환 (9222/9223/9224) | `4c5bf48` | ✅ |
| 04/09 | 쌍아→막내 3기 | CDP 시연 지시서 3건 발행 — SEO진단(9222)+블로그발행(9223)+다국어검증(9224) | ORDER×3 | ✅ |
| 04/09 | 막내1+3 | **CDP 시연 보고서 2건 제출** — SEO 7페이지 진단 + 다국어 15페이지 검증 | REPORT×2, `5f5912a`+`add12da` | ✅ |
| 07/19 | iMac/막내2 | **eVisa JS SPA 원문 돌파 실전** — kuwaitvisa.moi.gov.kw FAQ CDP 확보(WebFetch 불가 사이트) → kw-visa 배경 흰색 확정·grade A 교정. 자체 CDP "JS SPA 원문 확보" 계층의 실전 가치 실증 | 2222cebb + 세션로그 3차 | ✅ |
| 07/19 | iMac/민아 | **인앱 클로드 브라우저 첫 실전 완주** — 스포크 ① 검증 전체(DataTransfer 업로드 주입→precheck→fit→T0 생성→캔버스 픽셀 검증 #438edb)를 인앱만으로 수행. 파일 업로드 도구 부재를 same-origin 자산 주입으로 우회 확립. P0(200 OK 데드 퍼널) 검출 — L1 불가·L2 실주행만 가능함을 실증 | REPORT 반려·통과 2건 | ✅ |
| 07/19 | iMac/민아 | **자체 CDP vs 인앱 브라우저 10축 비교 + 재정의 제안** — 범용 무장 절반은 플랫폼이 흡수(세션당 페인=멀티에이전트 자동 격리), 자체 CDP는 4대 특수 계층(실프로필·세션밖 가동·OS 통합·고빈도 캐시)으로 특화 제안. Phase 3 보류 격하·Phase 4×순찰 러너 통합·네이버 클립보드 우회 재검증 제안. 3개월 히스토리 공백 금일분 보전, 500줄 아카이브 트리거 임박 통지 | [REPORT 비교·재정의](../../reports/2026-07/REPORT_20260719_iMac민아_CDP_인앱브라우저_비교_재정의.md) | ✅ 쌍아 합의 대기 |
| 07/20 | iMac/쌍아 | 사본 이원화 정리 — 3파일 git rm + 리다이렉트 노트. 정본: scripts/tools/ (3조 4항) | TOOLS_REDIRECT.md | ✅ |
| 10/24 | iMac/쌍아 | **사이트 카드 체계 방향 확정(작가님 10-24 22:28)** — UI 레퍼런스는 에이전트가 직접 체험·구현. 백그라운드 CDP는 고정 뷰포트에서 화면·버튼(DOM/캔버스 좌표)을 1회 정밀 분석·기록해 재사용(작가님과 함께 보는 브라우저는 크기 변동으로 위치 유동 → 기록 대상 아님). 사이트별 기록 = PF_CDP 귀속, 첫 표본 타이젬(막내15 체험 중). 목표: PF_SPREAD 채널별 '매번 재세팅' 병목 해소 | [세션로그](../../sessions/2026-10/2026-10-24_iMac_쌍아.md) | ⏳ 방향 확정 |
| 10/24 | iMac/쌍아-막내15 | **사이트 카드 첫 표본** 타이젬 웹(web.tygem.com) — 고정 뷰포트(CSS 1571×1328·DPR 2)·화면별 캔버스 버튼 좌표(✅눌러 확인/△위치만)·동선 레시피(AI 대국·관전·계가·이탈)·함정 15(뷰포트 1352≠1328·19줄 금지·캔버스 휠 무효·탭 다중 시 첫 page 연결·브리지 접바둑 차례 오판 등). 카드 형식(①~⑤) 제안 포함 | [tygem](sites/tygem.md) | ✅ |
| 10/25 | iMac/쌍아-막내15 | 사이트 카드 tygem 보강(10-25) — 기보감상 버튼 지도(감상 탭이 대국실보다 한 칸 밀림·떠 있는 분석 창 좌표·캔버스 입력칸 insertText)·레시피 3(프로 기보 검색·AI 훑기·참고도)·함정 16~20 | [tygem](sites/tygem.md) | ✅ |
| 10/28 | ?/? | **ORDER** playwright MCP 래퍼 — 9222 부재 시 디버그 크롬 자동 기동 + cdp_setup.sh start 무한 대기 수정 | [ORDER_20261028_iMac쌍아_막내1_CDP_playwright래퍼_9222자동기동](../../orders/2026-10/ORDER_20261028_iMac쌍아_막내1_CDP_playwright래퍼_9222자동기동.md) | ⏳ |
| 10/28 | iMac/쌍아 | **분업 원칙 확정(작가님 11:29)** — Playwright=첫 탐색·패턴 파악, 사이트 카드=정리, CDP=동시·병렬 투입. 04/05 진단 Playwright 우위 판정의 운용 정식화. 이음매: ref→고정 선택자 변환, 포트 분리 전제. §1 설계 원칙 등재 | [2026-10-28_iMac_쌍아](../../sessions/2026-10/2026-10-28_iMac_쌍아.md) | ✅ |
| 10/28 | iMac/쌍아-막내1 | **playwright 래퍼 9222 자동 기동** — 미응답 시 같은 포트로 cdp_setup start(출력 stderr)·~10s 대기·실패 시 ❌ exit 1, 대체 포트 연결 금지. cdp_setup start 크롬 출력 로그 분리(nohup·logs/PORT.log)로 파이프 무한 대기 해소(구 15s+ → 1s). 스모크 9229: 자동 기동·stdout 187B 전부 JSON·음성 exit 1 / 9222 무접촉(PID 79007 불변). 실세션 Reconnect는 작가님 확인 대기 | [2026-10-28_iMac_쌍아-막내1](../../sessions/2026-10/2026-10-28_iMac_쌍아-막내1.md) | ✅ |
| 10/28 | iMac/쌍아-막내1 | **playwright 래퍼 9222 자동 기동 + cdp_setup 파이프 무한 대기 수정 + @playwright/mcp@0.0.83 버전 고정** — 스모크 9229 대체 전량 통과, 9222 불변. 쌍아 병합 24655a78·cd40ac9d. 실세션 Reconnect 확인은 작가님 대기 | [COMPLETION_20261028_iMac쌍아-막내1_CDP_playwright래퍼](../../reports/2026-10/COMPLETION_20261028_iMac쌍아-막내1_CDP_playwright래퍼.md) | ✅ |
---

## 3. Phase 현황

### Phase 0 — 검증 ✅ 완료 (03/26)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| CDP 프로토콜 전 기능 테스트 | ✅ | iMac/민아 | WebSocket 직접 호출 |
| cdp.sh 간이 CLI 도구 | ✅ | iMac/민아 | `scripts/tools/cdp.sh` |
| 어드민 블로그 에디터 실전 검증 | ✅ | iMac/민아 | 풀 페이지 작성 완료 |
| 방안 선택 | ✅ | 작가님 | 방안 C(하이브리드) 채택 |

### Phase 1 — 실전 코드 수집 + 유틸 패키지화 ✅ 완료 (03/27)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 민아 세션 인라인 Python 수집 | ✅ | M1/민아 | 새벽세션에서 수집 완료 |
| 수집 코드 → `scripts/tools/cdp_utils.py` 패키지화 | ✅ | M1/민아 | CDP 클래스 + MonkosEditor 클래스 (530줄) |
| 에디터 조작 노하우 코드화 | ✅ | M1/민아 | Toast UI editor API, ProseMirror 포커스 패턴 |
| README 갱신 | ✅ | M1/민아 | `scripts/tools/README.md` 사용법 문서 |
| 멀티 포트 동시 운용 테스트 | ✅ | iMac/막내4 | 9222+9223 포트 분리 검증 완료. 동시 접속 시 충돌 실증 → 분리 필수 |

### Phase 2 — Playwright MCP 통합 + 접근성 트리 전환 ✅ 완료 (04/05)

> 좌표 기반 클릭의 근본 한계를 접근성 트리로 돌파한다. 비용 ₩0.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Playwright MCP 서버 설치 + CDP 연결 | ✅ | M1/막내3 | `.mcp.json` 등록, 38개 도구 확인 |
| cdp_utils.py 접근성 트리 강화 | ✅ | iMac/막내3 | `click_accessible` + **PageProfiler** `smart_click` 추가 |
| GA4/GSC SPA 네비게이션 검증 | ✅ | iMac/막내3 | PageProfiler로 GA4/GSC smart_click 100% 성공 (5/5) |
| `.mcp.json` 프로젝트 설정 | ✅ | iMac/막내1 | 4서버 (playwright + GA4 MCP + GSC MCP + cloudflare) |
| 멀티 포트 동시 운용 테스트 | ✅ | iMac/막내4 | 9222+9223 분리 검증. 동시 접속 시 포트 분리 필수 확정 |
| **PageProfiler 런타임 자동 프로파일링** | ✅ | iMac/막내3 | 첫 프로파일 5~17ms, 캐시 히트 2~29ms. 하드코딩 제로 |
| **Cloudflare MCP 도입** | ✅ | iMac/막내2 | 84개 도구, D1/R2/KV/Workers/Zones 전수 성공 |
| **GA4/GSC MCP 도입** | ✅ | iMac/막내1 | SA impersonation 방식. API 인증 완료 |
| 7/12 채널 접근성 트리 전환 검증 | ⏳ | 막내(구현) | Phase 2.5로 이관 |

### Phase 2.5 — CDP 정교화 + Skills 패키징 🔄 진행 중

> Phase 2 도구를 실전 수준으로 정교화하고, `.claude/skills/`로 워크플로우 패키징.
> 민아 실전 검증 리뷰 기반 (REPORT_20260405_iMac민아_CDP_PageProfiler_실전검증리뷰.md)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| **C1. smart_fill 이벤트 발사 내장** | ✅ | iMac/막내2 | React/Vue/Angular nativeSetter + focus/input/change/blur 4종 이벤트. 3사이트 검증 통과 |
| **C2. 에디터 자동감지** | ✅ | iMac/막내3 | 7종 시그니처 감지 + smart_editor_write/read API + Toast UI ES 모듈 자동 노출 |
| **C3. 탭 관리 안정화** | ✅ | iMac/막내4 | type=page 필터 + URL/title 매칭 + safe_navigate 크로스오리진 재접속 |
| 7/12 채널 접근성 트리 전환 검증 | ⏳ | 막내(구현) | 좌표 하드코딩 0건 목표 (Phase 2에서 이관) |
| I1. 드롭다운 depth=2 탐색 | ✅ | iMac/막내1 | smart_click depth=2 → 재프로파일링 → 옵션 클릭 |
| I2. 검색 통합 smart_search() | ✅ | iMac/막내2 | 검색 필드 자동 탐지 + 입력 + button/form/enter 자동 실행. Google/기업마당 검증 |
| I3. 텍스트 구조화 smart_extract() | ✅ | iMac/막내3 | 7필드 추출 (title/headings/tables/body/files/images/meta). 3사이트 검증 |
| I4. 섹션맵 smart_scroll() | ✅ | iMac/막내4 | h1~h6/section/div[id]/a[name] → scrollIntoView smooth. monkos.ai 35섹션 |
| **Skills 패키징** | 🔄 | 쌍아(설계) | cdp-browser 스킬 실재(제어 규칙+장애 진단 통합, 07/19 확인). /ga4·/gsc는 MCP 직행으로 대체됨 — 잔여 범위 재정의 필요 (07/19 비교 보고서 §2) |

### Phase 3 — Stagehand v3 난제 사이트 적용 ⏳ 다음

> 자연어 기반 브라우저 제어. `act("발행 버튼 클릭")`. 캐싱으로 비용 억제.
> ⚠️ LLM 비용 발생 구간 — 별도 승인 후 착수

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Stagehand Python SDK 설치 | — | 막내(구현) | `pip install stagehand` |
| note.com 자동 배포 파일럿 | — | 막내(구현) | act()/observe() 자연어 제어 |
| 캐싱 효율 실측 | — | 막내(구현) | 2회차 LLM 호출 생략 확인 + 비용/속도 측정 |
| Naver SmartEditor 돌파 시도 | — | 막내(구현) | 서식/링크 입력 가능 여부 재검증 |
| 비용 보고 → 작가님 승인 | — | 쌍아(보고) | act() 1회 ₩4~15, 월 예산 시뮬레이션 |

### Phase 4 — 스케줄 자동 배포 파이프라인 ⏳ 다음

> 콘텐츠 1건 입력 → N채널 자동 배포. 한송이 수동 배포(월 30~60시간) 자동화.
> PF_SPREAD Phase 1과 인터페이스.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 배포 오케스트레이터 스크립트 | — | 쌍아(설계) + 막내(구현) | Python, 채널별 도구 선택 (CDP/Playwright/Stagehand) |
| 채널별 배포 모듈 | — | 막내(구현) | 도구 매핑: MONKOS(CDP), X(Playwright), note(Stagehand) |
| cron / Claude Scheduled Tasks 연동 | — | 쌍아(설계) | 스케줄 트리거 |
| 실패 알림 + 재시도 로직 | — | 막내(구현) | |
| 배포 로그 자동 기록 | — | 막내(구현) | |

### Phase 5 — Browser Use 자율 에이전트 (선택)

> 최후 수단. 비용 높으나 가장 강건. 난제 사이트 폴백 전용.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Browser Use 설치 + 검증 | — | — | 필요 시 |
| Naver/Instagram 폴백 적용 | — | — | Stagehand 실패 시 |

### Phase 6 — 실시간 대화 + 역할 융합

> 쌍아가 민아고 민아가 막내인. 멀티에이전트가 하나의 통괄 시스템.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 실시간 대화창 구현 | — | — | 전원이 한 공간에서 대화, 즉시 임무 세팅 → 병렬 돌입 |
| 에이전트 간 CDP 소통 | — | — | 파일 릴레이 → 브라우저 기반 실시간. 작가님 중계 부담 제거 |
| CDP→CITADEL→SPREAD 연결 | — | — | 시드→에디터 작성→멀티채널 배포 |

> **병행 추적**: Anthropic 클라우드 확장도 개선 중. CDP 자체 도구화와 확장 기능 향상을 동시 추적.

### 리팩토링 계획 — ~1500줄 도달 시 착수

> 현재 cdp_utils.py ~900줄 (단일 파일). 1500줄 도달 시 리팩토링 싸인.

- **Python → JavaScript 전환**: 서비스 코드(MONK_kr, monkos_AI, CF Workers) 전부 JS. 엔진도 통일
- **모듈 분리**: `scripts/tools/cdp/` 패키지화 (core / actions / profiler / smart / editors / tabs)
- **타이밍**: 1500줄 도달 또는 Phase 2.5 Important 착수 시점 중 빠른 쪽
- **하위 호환**: `__init__.py`(또는 index.js)에서 기존 import 유지

### 채널별 최적 도구 매핑 (Phase 2~3 참조)

| 채널 | 현재 | Phase 2 이후 | 이유 |
|------|------|-------------|------|
| MONKOS Admin | CDP (MonkosEditor) | 유지 | 자체 서비스, 완전 통제 |
| X | CDP (data-testid) | CDP + Playwright MCP | DOM 변경 대비 |
| GitHub | CDP | CDP + Playwright MCP | 단순 구조 |
| Tistory | CDP (iframe) | Playwright MCP | iframe 처리 개선 |
| note.com | CDP (ClipboardEvent) | **Stagehand** | SPA + 에디터 복잡성 |
| Naver Blog | CDP (텍스트만) | **Stagehand → 실패 시 Browser Use** | SmartEditor 난제 |
| Instagram | 불가 | 공식 API 또는 SaaS | 브라우저 자동화 비현실적 |
| Medium | CDP (backendNodeId) | Playwright MCP | 파일 업로드 안정화 |
| GA4/GSC | CDP (불안정) | **PageProfiler smart_click (검증 완료)** + GA4/GSC MCP API 병행 | SPA 네비게이션 해결. 100% 성공 |

---

## 4. 성과

> 실측 데이터. 측정일 명시. 추정 금지.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| CDP 검증 기능 수 | 8/8 (전수 통과) | 03/26 | 탭·JS·이동·스크린샷·클릭·타이핑·키보드·이미지 |
| 채널별 에디터 글쓰기 | 7/12 채널 성공 | 03/27 | MONKOS/X/티스토리/깃헙/미디움/note/네이버 |
| 이미지 업로드 | 2채널 성공 | 03/27 | 미디움(backendNodeId), MONKOS(API직접) |
| 실제 발행 | 3건 | 03/27 | X포스트, X댓글, GitHub Issue#5 |
| 크롬 확장 추월 포인트 | 2건 | 03/27 | ①작가님 탭 접근 ②동시 인스턴스 무제한 |
| HTML 썸네일 생성 | 1280x670 3버전 | 03/27 | 캔바 없이 HTML→CDP 스크린샷 |
| GA 소스/매체 드릴다운 | CDP로 GA 조작 성공 | 03/27 | 드롭다운 클릭→옵션 선택→테이블 수집 |
| MCP 생태계 리서치 | 서버 80+종, 프로토콜 스펙, 경쟁분석 | 04/05 | MCP 올인 판정 (AAIF 6사 공동 거버넌스) |
| Cloudflare MCP 도입 | 84개 도구, 5도메인 전수 성공 | 04/05 | D1/R2/KV/Workers/Zones 읽기 테스트 |
| GA4/GSC MCP 도입 | SA impersonation + 4서버 설정 | 04/05 | API 인증 완료, 속성 권한 부여 잔여 |
| .mcp.json 서버 수 | 4서버 (playwright+GA4+GSC+CF) | 04/05 | 전 에이전트 자동 획득 |
| **PageProfiler 성능** | **첫 5~17ms / 캐시 2~29ms** | 04/05 | 기존 풀스캔 3초 대비 **100x+ 향상** |
| PageProfiler smart_click | GA4/GSC SPA 5/5 성공 (100%) | 04/05 | "보고서"→"실시간"→"실적" 전부 자동 |
| GA4 데이터 추출 | 활성 사용자 400(↑143.9%) | 04/05 | 7일 기준, CDP 직접 추출 |
| GSC 데이터 추출 | 클릭 27 / 노출 245 / CTR 11% | 04/05 | 약 3개월 기준 |
| 멀티포트 충돌 실증 | 9222 동시 접속 → 스월링 | 04/05 | 9223 분리로 해결. 포트 분리 필수 확정 |
| Playwright MCP 도구 수 | 38개 (5티어 caps 확장) | 04/05 | 기존 인지 21개 → 실제 38개 |

---

## 5. 복기

### 교훈 1: MCP 패키지 vs CDP 직접 호출

**현상**: chrome-devtools-mcp 패키지가 `get_page_content`, `execute_javascript`에서 "Chrome is not running" 에러
**원인**: MCP 패키지의 크롬 감지 버그. CDP 프로토콜 자체는 정상
**대응**: 외부 패키지 디버깅(방안 A) 대신 CDP 직접 호출(방안 C) 채택. 의존성 최소화

### 교훈 2: ProseMirror 에디터 포커스

**현상**: `element.focus()` JS만으로는 타이핑 미동작
**원인**: ProseMirror가 마우스 이벤트 기반으로 포커스 상태 관리
**대응**: 반드시 `Input.dispatchMouseEvent`로 클릭 후 `Input.insertText`

### 교훈 3: Toast UI Editor ES 모듈 스코프

**현상**: `window.editor`가 DOM 엘리먼트를 가리킴. Toast UI 인스턴스에 접근 불가
**원인**: ES 모듈 `import`로 초기화되어 `let editor`가 모듈 스코프에 갇힘
**대응**: `import('./js/blog-editor.js').then(m => window.__editor = m.getEditor())` 동적 임포트로 글로벌 노출. `_ensure_editor()` 자동화

### 교훈 4: PF 컴포넌트의 본질 (작가님 인사이트 03/27)

> **실무 → 개발 → 콘텐츠 → 연구 → 실무. 계속 루틴이다.**
> 연구를 위한 연구가 아니라, 실무의 방해 요소 제거 및 효율화로 접근하는 것. 이게 우리 팀의 본성.

- PF 컴포넌트 폴더에서 코드를 키우고, 안정되면 본진 `scripts/`로 끌어올린다
- 실무에서 걸리적거리는 부분이 생기면 그 파트를 업그레이드한다
- CDP는 "연구팀이 붙어야 할 사안"이지만, 우리는 실무 병목 해소로 자연스럽게 도달했다

---

### 교훈 5: 채널별 에디터 입력 방식 전부 다름 (03/27)

**현상**: 12채널 실전 테스트 결과, 에디터마다 입력 방식이 전부 달랐음.
**패턴**: 티스토리(iframe innerHTML) / X(data-testid+insertText) / 깃헙(React→클릭+타이핑) / 미디움(contenteditable) / note(ClipboardEvent) / 네이버(SmartEditor, 서식/링크 불가)
**대응**: 채널별 입력 패턴을 PF_SPREAD §7에 기록. 범용 함수가 아닌 채널 특화 패턴이 필요.

### 교훈 6: 이미지 업로드 — backendNodeId 패턴 (03/27)

**현상**: hidden file input에 `querySelector` nodeId가 0 반환. `setFileInputFiles` 실패.
**원인**: DOM agent가 숨겨진 노드를 추적 못 함.
**해결**: `Runtime.evaluate`→objectId → `DOM.describeNode`→backendNodeId → `DOM.setFileInputFiles`. 미디움에서 검증 완료.

### 교훈 7: 좌표 클릭의 한계 → Phase 2 하이브리드 (03/27)

**현상**: 좌표 기반 클릭은 해상도/레이아웃 변하면 깨짐. 네이버 SmartEditor에서 텍스트 선택 불가.
**트렌드**: Stagehand v3 — DOM+접근성트리(빠름) + 비전(폴백) + CDP 캐싱(반복). 44% 속도 향상.
**방향**: 첫 방문→접근성 트리 매핑 → 셀렉터 캐싱 → 반복은 캐시로 즉시 클릭.

### 교훈 8: API 직접 호출이 UI 조작보다 확실 (03/27)

**현상**: 에디터 file input에 CDP로 파일 넣어도 JS FileAPI에서 인식 안 됨. 버튼 클릭도 업로드 미트리거.
**해결**: `curl`로 `/api/admin/upload` 직접 호출 → GCS 업로드 + 이미지 뱅크 등록 한 번에 성공.
**원칙**: UI 조작 가능하면 UI, 안 되면 API 직접 호출. 하이브리드가 답.

### 교훈 9: 멀티에이전트 CDP 포트 충돌 (04/05)

**현상**: 포트 9222를 민아+작가님 점유 중, 막내4가 동시 접속 → Playwright MCP 스월링(무응답)
**원인**: 브라우저 레벨 WebSocket(`/devtools/browser/...`) 공유 시 접근성 트리 등 전체 상태 조회 명령이 충돌
**해결**: 9223 포트에 별도 크롬 인스턴스 기동 → 정상 동작
**원칙**: 멀티에이전트 동시 CDP 사용 시 **에이전트별 포트 분리 필수** (9222/9223/9224/9225). 같은 탭은 괜찮으나 브라우저 레벨 명령은 충돌.

### 교훈 10: 하드코딩 vs 런타임 자동 파악 (04/05, 작가님 인사이트)

**현상**: 에이전트 클릭 속도 병목 (접근성 트리 풀스캔 ~3초)
**초안**: 코드에 `data-action` 심기 → 작가님 기각: "업그레이드때마다 구조 바뀌면 하드코딩 바꿔야 하잖아"
**확정 방향**: CDP DevTools API(DOM+접근성+이벤트리스너+CSS)로 런타임 자동 파악. 프로파일 캐싱 + DOM 해시 변경 감지.
**결과**: PageProfiler 구현. 첫 프로파일 5~17ms, 캐시 히트 2~29ms. 자체/외부 사이트 무관 동작.
**원칙**: "개발자 도구 가리고 싶어도 못 가리는 거면 우리도 활용하면 된다" — 악의적 해킹이 아닌 브라우저 동작의 정교화.

### 교훈 11: SA 보안 관리 (04/05, 작가님 선언)

**현상**: GA4/GSC MCP 인증 시 매번 새 SA 키 발급 시도
**작가님 기각**: "매번 SA 발급하면 관리할 시크릿만 늘어나고 보안에 치명적"
**해결**: 기존 yong-a-orchestrator SA를 impersonate 방식으로 활용. 새 키 발급 제로.
**원칙**: 기존 SA 재활용 우선. 불필요 SA 삭제, 필요한 것만 집중관리.

---

## 6. 관련 문서 인덱스

### 기안서 (PROPOSAL)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| `monkos-ops/ops/proposals/PROPOSAL_20260326_로컬CDP_브라우저제어_작업명세.md` | iMac/민아 | CDP 독립 운용 검증 + 방안 3가지 | ✅ 방안C 채택 |

### 기술명세 (SPEC)

| 파일 | 주체 | 내용 |
|------|------|------|
| — | — | — |

### 보고서 (REPORT)

| 파일 | 주체 | 내용 |
|------|------|------|
| — | — | — |

### 지시서 (ORDER)

| 파일 | 수신 | 내용 | 상태 |
|------|------|------|------|
| `monkos-ops/ops/orders/2026-03/ORDER_20260327_M1쌍아_iMac민아_PF_CDP_Phase1_코드수집.md` | iMac/민아 | 세션 인라인 코드 수집 + cdp_utils.py 패키지화 | ⏳ |

### 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| — | — | — |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| Chrome 디버깅 포트 보안 노출 | 낮음 | localhost 바인딩만 허용, 외부 접근 불가 |
| CDP 프로토콜 버전 변경 | 낮음 | Stable 도메인(Runtime, Page, Input)만 사용 |
| 에디터 API 변경 (Toast UI → 타 에디터) | 중간 | Phase 1에서 에디터 추상화 레이어 고려 |

---

## 8. 기술 참조

### CDP 연결 구조
```
에이전트 (민아/막내)
  → python3 + websockets
    → ws://127.0.0.1:{PORT}/devtools/page/{TARGET_ID}
      → Chrome (디버깅 인스턴스, 별도 프로필)
```

### 핵심 CDP 명령어
```
Runtime.evaluate         — JS 실행
Page.navigate            — URL 이동
Page.captureScreenshot   — 스크린샷 (clip 옵션, max_size 10MB)
Input.dispatchMouseEvent — 마우스 클릭 (mousePressed + mouseReleased)
Input.insertText         — 텍스트 입력 (한글/이모지)
Input.dispatchKeyEvent   — 키보드 입력 (Enter, 단축키)
```

### 주의사항
- 스크린샷: WebSocket `max_size` 기본 1MB → 10MB 확장 필요
- ProseMirror: `innerHTML` 직접 주입 불가 → `window.editor.setHTML()` 또는 클릭+insertText
- dpr=2 환경: 스크린샷/클릭 좌표 = CSS pixel 기준 (일치)
| 07/19 | iMac/민아 | **품질 진단 실측 어펜드(§6)** — cdp_utils 정본 실측 1,847줄(README 인식 ~900줄의 2배, 리팩토링 트리거 1500줄 기초과 미인지)·타임아웃 2건·재시도 0·테스트 0·정본 이원화(scripts≠PF 사본 767줄)·전 자산 4/17 정지. 총평 "규율 있는 실험실 코드, 인프라 계층 부재". 개선 P0-1 신뢰성 계층~P2-7 골든패스 7건 로드맵 + 순찰 러너 설계와 묶음 지시 제안 | REPORT §6 | ⏳ 지시서화 대기 |
| 09/05 | 작가님·iMac/민아 | **사이트 기억 자산 재가동 (Phase 3 Stagehand 캐시 모델 선집행)** — 작가님 지적 "한번 들어간 사이트 운용법·버튼 위치를 기록해 헤매지 않게 했었다" → 실측: GP 8(04-17)·CASE 15(07-25)·어댑터 2·프로파일 캐시 26개 전부 **7일 TTL로 만료**. 조치: TTL 폐기(DOM 해시 변경 감지만) + smart_click 자가 치유(셀렉터 재생 실패→재프로파일) 실측 통과 | `COMPLETION_20260905_iMac민아_CDP_사이트기억자산_재가동.md` · cdp_utils.py | ✅ |
| 09/05 | iMac/민아 | **cdp-browser 커맨드 착수 전 선행 로딩 신설** [예외: 규정 계층, 작가님 직접 지시] — GP·CASE·어댑터·프로파일을 예외 시가 아니라 착수 전에 읽도록. 벤치마크: Aside(로그인 세션·Claude Code CLI·로컬 md 기억)·Stagehand(셀렉터 캐시 재생)·Browser Use·Skyvern 정리. Aside PoC(네이버 서식) 다운로드 승인 대기 | 세션로그 09-05 | ⏳ Aside |
