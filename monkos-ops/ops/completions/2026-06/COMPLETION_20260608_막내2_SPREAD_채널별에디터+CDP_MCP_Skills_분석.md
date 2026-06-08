---
type: completion
date: 2026-06-08
device: iMac
agent: 막내2
subject: SPREAD 채널별 에디터 구조 분석 + CDP/MCP/Skills 적용방안 종합 정리
portfolio: PF_SPREAD, PF_CDP, PF_OPUS, PF_PORTAL
order: ORDER_20260608_iMac쌍아_막내2_SPREAD_채널별에디터+CDP_MCP_Skills_정합성분석.md
status: 완료
---

# SPREAD 채널별 에디터 구조 분석 + CDP/MCP/Skills 적용방안 종합 정리

**[2026-06-08 13:25 KST] iMac/막내2 → iMac/쌍아, 작가님**

---

## Phase 1: 배포 채널별 에디터 구조 분석 (11채널)

### 1. MONKOS Admin (monkos.ai/admin/blog-edit.html)

```
채널명: MONKOS Admin
├── 에디터 기술 스택: Toast UI Editor (ProseMirror 기반 WYSIWYG), ES 모듈 스코프
├── 텍스트 입력 방법: editor_set_markdown() API / editor_set_html() (불안정 — CASE-008)
├── 서식 적용: ✅ 전부 가능 — editor_exec('heading'), bold, italic, addTable 등 API 직접
├── 이미지 삽입: ✅ API 직접 호출 (POST /api/admin/upload → GCS) + editor_exec('addImage')
├── 발행 트리거: 에디터 상단 "발행" 버튼 클릭 / API POST /api/admin/blog
├── CDP 검증 상태: ✅ GP-001 (100% 재현). MonkosEditor 클래스 전용 제어
├── 난제 사항: ES 모듈 스코프 우회 필요 (import() 동적 노출). setHTML 에디터 굳음 위험
└── 최적 자동화 도구: CDP (MonkosEditor) — 자체 서비스, 완전 통제. API 병행 가능
```

### 2. 네이버 블로그 (blog.naver.com)

```
채널명: 네이버 블로그
├── 에디터 기술 스택: SmartEditor ONE — iframe 기반 contentEditable, 자체 선택 모델
├── 텍스트 입력 방법: 좌표 클릭 → Input.insertText (se-title-text / se-section-text 영역)
├── 서식 적용: ❌ 불가 — 텍스트 선택 CDP 미작동 (CASE-006). 기호(■▶)로 대체 가능
├── 이미지 삽입: ❌ CDP 미검증. SmartEditor 이미지 업로드 메커니즘 독자적
├── 발행 트리거: 에디터 내 "발행" 버튼 클릭
├── CDP 검증 상태: 🟡 텍스트만 가능, 서식/링크/이미지 불가
├── 난제 사항: SmartEditor 자체 선택 모델이 CDP 이벤트와 호환 안 됨. 저장 후 본문 소실 위험 (CASE 네이버 iframe)
└── 최적 자동화 도구: **네이버 블로그 API** (Layer 1). 서식 리치 작성은 API가 유일한 해법.
    API: https://developers.naver.com/docs/blog/post/ — OAuth 인증, HTML 본문 직접 전송 가능
```

### 3. 티스토리 (tistory.com)

```
채널명: 티스토리
├── 에디터 기술 스택: iframe 에디터 (#editor-tistory_ifr), same-origin iframe
├── 텍스트 입력 방법: iframe contentDocument body.innerHTML 직접 주입
├── 서식 적용: ✅ HTML 직접 삽입이므로 모든 서식 가능 (H2, 볼드, 링크, 테이블 등)
├── 이미지 삽입: 🟡 innerHTML에 <img src="외부URL"> 삽입 가능하나, 티스토리 내부 이미지 호스팅 미연동
├── 발행 트리거: 에디터 내 "발행" 버튼 클릭
├── CDP 검증 상태: ✅ GP-006 (100% 재현, 가장 쉬운 채널)
├── 난제 사항: 카테고리 설정 미자동화 (초기 1회 수동), 외부 이미지 URL 깨질 수 있음
└── 최적 자동화 도구: CDP (iframe innerHTML) — 이미 풀 자동화 달성. 티스토리 API도 존재하나 CDP만으로 충분
    API: https://tistory.github.io/document-tistory-apis/ — OAuth, 포스트 CRUD 가능
```

### 4. note.com (note.com/notes/new)

```
채널명: note.com
├── 에디터 기술 스택: SPA, contenteditable + role="textbox", 자체 입력 처리
├── 텍스트 입력 방법: ClipboardEvent('paste') + DataTransfer.setData('text/plain') 유일
├── 서식 적용: 🟡 text/plain paste만 검증. text/html paste 미검증 (서식 적용 가능성 있음)
├── 이미지 삽입: ❌ CDP 미검증. 드래그앤드롭 또는 이미지 버튼 클릭 필요
├── 발행 트리거: "公開に進む" 버튼 클릭 → 설정 → "投稿する" 확인
├── CDP 검증 상태: 🟡 텍스트 paste만 가능, 서식/이미지 미검증
├── 난제 사항: insertText/execCommand 둘 다 무효 (CASE-004). API 미제공
└── 최적 자동화 도구: **CDP (ClipboardEvent)** → Phase 3 **Stagehand** 후보.
    API: ❌ 미제공. CDP 또는 Stagehand가 유일한 자동화 수단
```

### 5. Medium (medium.com/new-story)

```
채널명: Medium
├── 에디터 기술 스택: contentEditable 기반, graf--h3 (제목) / graf--p (본문) 구조
├── 텍스트 입력 방법: 좌표 클릭 → Input.insertText
├── 서식 적용: 🟡 에디터 내 인라인 서식 바 존재, CDP 텍스트 선택→서식 미검증
├── 이미지 삽입: ✅ backendNodeId 패턴 (GP-007, 100% 재현)
├── 발행 트리거: "Publish" 버튼 클릭 (CDP 클릭 가능)
├── CDP 검증 상태: 🟡 텍스트+이미지 가능. 서식 자동 적용 미검증
├── 난제 사항: 신규 API 토큰 발급 중단 (기존 토큰 보유 시만 API 가능). 서식 자동화 탐색 필요
└── 최적 자동화 도구: **CDP** (현행) + **Playwright MCP** (안정화).
    API: ⚠️ Medium API 존재하나 신규 토큰 발급 2023년 중단. 기존 토큰 없으면 CDP 유일
```

### 6. Reddit (reddit.com/submit)

```
채널명: Reddit
├── 에디터 기술 스택: Fancy Editor (contentEditable) / Markdown 전환 가능, React SPA
├── 텍스트 입력 방법: Markdown 모드 전환 → textarea에 직접 입력 (React controlled)
├── 서식 적용: ✅ Markdown 모드에서 마크다운 문법 직접 입력
├── 이미지 삽입: 🟡 이미지/비디오 탭 → 파일 업로드 (CDP file input)
├── 발행 트리거: "Post" 버튼 클릭
├── CDP 검증 상태: ❌ MONK 프로젝트 내 직접 검증 기록 없음 (06/07 수동 배포만 실시)
├── 난제 사항: 봇 탐지 있음 (reCAPTCHA 가능), 서브레딧별 규칙 준수 필요
└── 최적 자동화 도구: **Reddit API** (Layer 1). OAuth2 + PRAW (Python Reddit API Wrapper).
    API: https://www.reddit.com/dev/api/ — OAuth2, 포스트 CRUD + 댓글, rate limit 60req/min.
    06/07 실전에서 수동 배포 성공 — API 전환 시 완전 자동화 가능
```

### 7. X / Twitter (x.com/compose)

```
채널명: X (Twitter)
├── 에디터 기술 스택: React SPA, data-testid 기반 DOM, contenteditable role="textbox"
├── 텍스트 입력 방법: data-testid="tweetTextarea_0" 클릭 → Input.insertText
├── 서식 적용: N/A (X는 플레인 텍스트, 해시태그/멘션만)
├── 이미지 삽입: 🟠 파일 input 존재하나 CDP 검증 미완 (TODO #8)
├── 발행 트리거: data-testid="tweetButtonInline" 클릭 (GP-005, 100%)
├── CDP 검증 상태: ✅ 텍스트 포스트 풀 자동화 (GP-005). 댓글은 상세 페이지 진입 필요 (CASE-003)
├── 난제 사항: 봇 탐지 강력 (속도 절제 필수). 이미지 첨부 미검증. className 해시값 수시 변경
└── 최적 자동화 도구: **X API** (Layer 1) + **CDP** (Layer 2 보완).
    API: https://developer.x.com/en/docs/twitter-api — OAuth 2.0, 포스트/미디어 CRUD.
    Free tier: 1,500 트윗/월. Basic $100: 50,000 트윗/월
```

### 8. GitHub Issues (github.com/issues/new)

```
채널명: GitHub Issues
├── 에디터 기술 스택: React controlled textarea, 마크다운
├── 텍스트 입력 방법: 클릭 → Input.insertText (CASE-001: value 직접 세팅 금지)
├── 서식 적용: ✅ 마크다운 원문 입력 — 렌더링은 GitHub이 처리
├── 이미지 삽입: ✅ 드래그앤드롭 / 클립보드 붙여넣기 / Markdown ![alt](url)
├── 발행 트리거: "Create" / "Submit new issue" 버튼 클릭
├── CDP 검증 상태: ✅ 풀 자동화 달성. blog.js→github-issues.js 체이닝 구현 완료
├── 난제 사항: React controlled input (CASE-001). Label 자동 분류 미구현
└── 최적 자동화 도구: **GitHub API** (Layer 1, 이미 코드 구현 완료) + CDP (폴백).
    API: GitHub REST/GraphQL API — PAT 인증, Issues CRUD. 현재 blog.js에서 자동 게시 구현 완료
```

### 9. LinkedIn (linkedin.com/feed)

```
채널명: LinkedIn
├── 에디터 기술 스택: React SPA, 동적 로딩, contenteditable div
├── 텍스트 입력 방법: "Start a post" 클릭 → 모달 contenteditable → 타이핑
├── 서식 적용: 🟡 볼드/이탈릭 가능 (Ctrl+B/I), 해시태그, @멘션
├── 이미지 삽입: 🟡 모달 내 이미지 업로드 버튼 → 파일 선택
├── 발행 트리거: "Post" 버튼 클릭
├── CDP 검증 상태: ❌ PF_SPREAD §7에 "탐색 중" 기록. SPA 동적 로딩으로 CDP 난이도 높음
├── 난제 사항: 봇 탐지 매우 강력, 계정 제한 리스크 높음. SPA 동적 로딩
└── 최적 자동화 도구: **LinkedIn API** (Layer 1).
    API: https://learn.microsoft.com/linkedin/marketing/ — OAuth 2.0,
    포스트 (ugcPosts/shares), 이미지, 댓글 CRUD. 단, Community Management API 승인 필요
```

### 10. YouTube Studio (studio.youtube.com)

```
채널명: YouTube Studio
├── 에디터 기술 스택: Angular/Polymer SPA, Material Design 컴포넌트
├── 텍스트 입력 방법: 영상 업로드 → 메타데이터 폼 (제목/설명/태그) contenteditable
├── 서식 적용: N/A (설명란은 플레인 텍스트)
├── 이미지 삽입: 썸네일 업로드 (파일 선택)
├── 발행 트리거: "Next" × 3 → "Publish" 버튼
├── CDP 검증 상태: ❌ PF_SPREAD §7 "탐색 중". CDP 미검증
├── 난제 사항: 영상 업로드 자체가 핵심 (파일 사이즈 대). 메타데이터만 자동화하면 가치 제한적
└── 최적 자동화 도구: **YouTube Data API v3** (Layer 1).
    API: https://developers.google.com/youtube/v3 — OAuth 2.0,
    videos.insert (업로드+메타), 썸네일 설정, 재생목록 관리. 일일 쿼터 10,000 units
```

### 11. 카카오 비즈 (center-pf.kakao.com)

```
채널명: 카카오 비즈니스
├── 에디터 기술 스택: 메시지 작성 폼, SPA
├── 텍스트 입력 방법: 메시지 유형 선택 → 텍스트/이미지/링크 입력 폼
├── 서식 적용: N/A (메시지 템플릿 기반)
├── 이미지 삽입: 이미지 메시지 → 파일 업로드
├── 발행 트리거: "보내기" 버튼
├── CDP 검증 상태: ❌ PF_SPREAD §7 "미정". 채널 연동 이슈 잔류 (TODO #2)
├── 난제 사항: center-pf에서 기존 "MONKOS AI 증명사진" 채널 미노출. 건당 과금
└── 최적 자동화 도구: **카카오톡 채널 메시지 API** (Layer 1).
    API: https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api
    메시지 발송 (텍스트/이미지/리스트/웹). 단, 비즈니스 인증 + 건당 비용 발생
```

---

## Phase 2: 현행 MCP 도구 + Skills 인벤토리

### 2-1. MCP 서버 현황

`.mcp.json` 기준 **5개 서버** 등록:

| # | 서버 | 실행 방식 | 도구 수 | SPREAD 활용 가능 기능 |
|---|------|----------|---------|---------------------|
| 1 | **Playwright** | `scripts/tools/playwright_mcp.sh` | 38개 | 채널 에디터 접근성 트리 조회, 스크린샷, 폼 입력, 클릭, 키보드, 파일 업로드 |
| 2 | **Google Analytics** | `uvx analytics-mcp` (SA impersonation) | ~8개 | 배포 후 트래픽 측정 (run_report, run_realtime_report, run_conversions_report 등) |
| 3 | **Google Search Console** | `npx mcp-server-gsc` (SA impersonation) | ~8개 | 색인 상태 확인, 검색 성과 분석, 사이트맵 관리, Quick Wins 탐지 |
| 4 | **Cloudflare** | `scripts/tools/cloudflare_mcp.sh` | 84개 | D1 콘텐츠 DB 조회/쓰기, R2 이미지 저장소, Workers 배포, KV 설정 |
| 5 | **Google Docs** | `scripts/tools/gdocs_mcp.sh` | 38개 | Google Docs/Sheets 읽기/쓰기, 스프레드시트 데이터, 드라이브 파일 관리 |

**총 MCP 도구: ~176개** (playwright 38 + GA4 ~8 + GSC ~8 + CF 84 + GDocs 38)

### 2-2. Skills 현황

`.claude/skills/` 디렉토리 — **14개 스킬**:

| # | 스킬 파일 | 기능 요약 | SPREAD 활용 가능 |
|---|----------|---------|:---:|
| 1 | `cdp-troubleshoot.md` | CDP 장애 진단 — PF_CDP 케이스/골든패스 순차 점검 | ✅ 배포 중 에디터 장애 시 |
| 2 | `deploy-cf.md` | monk.kr CF Pages 배포 | ❌ |
| 3 | `deploy-cr.md` | monkos.ai Cloud Run 배포 | ❌ |
| 4 | `escalation.md` | 에러 반복/모호 지시/충돌 시 7가지 대응 절차 | 🟡 간접 |
| 5 | `health-check.md` | 전 서비스 상태 점검 | 🟡 배포 후 검증 |
| 6 | `makne-finish.md` | 막내 작업 완료 시 보고+커밋+푸시 절차 | ✅ 배포 후 보고 |
| 7 | `model-check.md` | Gemini/Imagen 모델 유효성 점검 | ❌ |
| 8 | `order-write.md` | 지시서 작성 절차 | ❌ (쌍아 전용) |
| 9 | `pf-declare.md` | PF 선언 + 컨텍스트 선택 로딩 | 🟡 간접 |
| 10 | `pf-status.md` | 활성 PF 대시보드 보고 | 🟡 간접 |
| 11 | `registry-add.md` | 에이전트/디바이스/서비스 편입 | ❌ |
| 12 | `session-checkpoint.md` | 중간 커밋+PF 갱신+상태 보고 | ✅ 배포 세션 중 |
| 13 | `session-end.md` | 세션 마감 로그+커밋+푸시 | ✅ |
| 14 | `session-start.md` | 세션 시작 역할 판별+git 동기화 | ✅ |

**SPREAD 전용 스킬: 0개** — 배포 워크플로우 전용 스킬이 현재 없음.

### 2-3. cdp_utils.py 현황

- **총 1,847줄** (단일 파일, 리팩토링 트리거 1,500줄 초과)
- **3개 클래스 + 2개 유틸 함수**

| 클래스/함수 | 줄 수 (추정) | 주요 메서드 | SPREAD 채널 매핑 |
|------------|-------------|-----------|----------------|
| **CDPDebugLogger** | ~65줄 | log, log_send, log_key, log_eval, log_paste | 전 채널 디버그 로깅 |
| **CDP** | ~625줄 | connect, evaluate, navigate, screenshot, click, type_text, press_key, fill, read_page, find_by_role, click_accessible, upload_file, new_tab | 전 채널 기본 제어 |
| **PageProfiler** | ~605줄 | profile, smart_click, smart_fill, smart_navigate, smart_search, smart_scroll, detect_editors, smart_editor_write/read, smart_extract | 외부 채널 자동감지 제어 |
| **MonkosEditor** (CDP 상속) | ~185줄 | set_title, set_category, editor_set_markdown, editor_set_html, save_draft, preview | MONKOS Admin 전용 |
| `print_recent_cases` | ~35줄 | 로그 에러 요약 | 디버그 |
| `quick_screenshot`, `quick_eval`, `run` | ~15줄 | 간편 실행 유틸 | 전체 |

**채널별 cdp_utils.py 함수 매핑:**

| 채널 | 주 사용 함수 | 비고 |
|------|-------------|------|
| MONKOS Admin | `MonkosEditor.*` (전 메서드) | 전용 클래스 |
| X | `CDP.click_element`, `type_text`, `evaluate` (data-testid) | GP-005 |
| 티스토리 | `CDP.evaluate` (iframe innerHTML) | GP-006 |
| note.com | `CDP.evaluate` (ClipboardEvent) | CASE-004 |
| Medium | `CDP.evaluate`, `upload_file` (backendNodeId) | GP-007 |
| GitHub | `CDP.click`, `type_text` (React controlled) | CASE-001 |
| 네이버 | `CDP.click`, `type_text` (좌표 기반) | CASE-006 (제한적) |
| GA4/GSC | `PageProfiler.smart_click`, `smart_navigate` | SPA 자동 네비게이션 |
| 범용 외부 | `PageProfiler.detect_editors`, `smart_fill`, `smart_extract` | 7종 에디터 자동감지 |

---

## Phase 3: 3층 전략 + Skills 패키징 방안 제안

### 3-1. 채널별 최적 자동화 전략 (4층 구조 정교화)

6/7 확정 3층을 에디터 분석 결과 대조하여 **4층으로 정교화**:

#### Layer 1 — API 직통 (6채널)

| 채널 | API | 인증 | 난이도 | 현 상태 |
|------|-----|------|:---:|---------|
| **Reddit** | Reddit API (PRAW) | OAuth2 | 낮음 | 06/07 수동 배포 성공, API 전환만 하면 완전 자동화 |
| **GitHub Issues** | GitHub REST API | PAT | 낮음 | ✅ 이미 코드 구현 완료 (blog.js→github-issues.js) |
| **YouTube** | YouTube Data API v3 | OAuth2 | 중간 | 미착수. 영상 업로드+메타데이터 자동화 |
| **X** | X API v2 | OAuth 2.0 | 중간 | Free 1,500트윗/월 충분. CDP 대비 봇 탐지 회피 |
| **카카오** | 카카오톡 채널 API | REST | 중간 | 비즈 인증 필요. 건당 과금 — ROI 계산 선행 |
| **LinkedIn** | LinkedIn Marketing API | OAuth 2.0 | 높음 | Community Management API 승인 필요 |

#### Layer 2 — API + CDP 보완 (2채널)

| 채널 | API 영역 | CDP 보완 영역 | 비고 |
|------|----------|-------------|------|
| **네이버 블로그** | 네이버 블로그 API (HTML 본문+서식) | 이미지 업로드 (API 지원), 발행 후 검증 스크린샷 | API로 서식 리치 작성 해결 — SmartEditor CDP 난제 우회 |
| **티스토리** | 티스토리 API (HTML 포스트 CRUD) | 카테고리 초기 설정, 발행 후 검증 | CDP만으로도 충분하나 API 병행 시 더 안정 |

#### Layer 3 — CDP/Playwright 전용 (2채널)

| 채널 | 도구 | 방식 | 비고 |
|------|------|------|------|
| **MONKOS Admin** | CDP (MonkosEditor) | 자체 서비스 완전 통제. GP-001 | API도 가능 (POST /api/admin/blog) |
| **Medium** | CDP + Playwright MCP | contentEditable 입력 + backendNodeId 이미지. GP-007 | 신규 API 토큰 발급 중단 — CDP 유일 |

#### Layer 4 — Stagehand/수동 대기 (1채널)

| 채널 | 현황 | 비용 예측 | 비고 |
|------|------|----------|------|
| **note.com** | ClipboardEvent paste (텍스트만). 서식/이미지 미해결 | Stagehand act() 1회 ₩4~15 / 월 30건 = ₩120~450 | API 미제공. Stagehand Phase 3 후보 |

**6/7 대비 변경점:**
- 3층 → 4층: Layer 4(Stagehand/수동) 신설
- Reddit: Layer 1로 승격 (API 확인)
- 네이버: Layer 2 정교화 (API가 서식 리치 작성의 정답)
- Facebook/Instagram: 목록에서 제외 (Meta Graph API로 인스타 통합 가능하나, 현재 채널 목록 11개에 미포함 — PF_SPREAD §7 인스타 별도 추적)

### 3-2. Skills 신규 제안

PF_CDP Phase 2.5 어젠다 #22 + 에디터 분석 결과 기반:

| # | Skill 후보 | 트리거 | 동작 | 연관 PF | 우선순위 |
|---|-----------|--------|------|---------|:---:|
| 1 | **`/blog-publish`** | 블로그 발행 지시 시 | ① MONKOS 에디터에서 원본 작성 (MonkosEditor) → ② 3개국어 번역 트리거 (Gemini Flash) → ③ Indexing API 호출 → ④ llms.txt 갱신 | PORTAL+SPREAD | 🔴 |
| 2 | **`/spread-deploy`** | 채널 배포 지시 시 | ① 원본 D1/Firestore에서 로드 → ② 채널별 톤 변환 (KO/JA/EN) → ③ Layer 판정 (API?CDP?) → ④ N채널 순차 배포 → ⑤ 배포 로그 기록 | SPREAD+CDP | 🔴 |
| 3 | **`/channel-check`** | 배포 후 검증 시 | ① 각 채널 URL 접속 (Playwright MCP) → ② 스크린샷 촬영 → ③ 본문/이미지 정합성 확인 → ④ 결과 테이블 보고 | SPREAD+CDP | 🟡 |
| 4 | **`/spread-status`** | 배포 현황 요청 시 | ① PF_SPREAD §7 채널별 현황 로드 → ② 각 채널 최근 배포일/포스트 수 집계 → ③ Layer별 자동화 달성률 표시 | SPREAD | 🟡 |
| 5 | **`/api-setup`** | 신규 채널 API 연동 시 | ① 채널 API 문서 참조 → ② OAuth/PAT 설정 가이드 → ③ 테스트 호출 → ④ .env 등록 절차 | CDP+SPREAD | 🟠 |
| 6 | **`/content-adapt`** | 원본→채널 변환 시 | ① 원본 마크다운 로드 → ② 타겟 채널 제약 파악 (글자수, 서식, 이미지) → ③ 톤·길이·포맷 자동 변환 → ④ 결과 프리뷰 | OPUS+SPREAD | 🟠 |

**구현 우선순위 근거:**
- `/blog-publish`: PF_PORTAL Phase 8(에디터) 완성 + 06/07 Indexing API/llms.txt 연동으로 기반 완비. 즉시 패키징 가능
- `/spread-deploy`: PF_OPUS 플라이휠 ②배포 축의 핵심. 생산 자동화율 60% 목표 직결

### 3-3. PF 정합성 + 간극 분석

#### PF_OPUS 플라이휠 ②배포 축 — SPREAD 커버 간극

| 플라이휠 단계 | 현재 커버 | 간극 |
|-------------|----------|------|
| ① 생산 → ② 배포 | MONKOS 에디터에서 원본 작성, 3개국어 번역 | **채널별 톤 변환 엔진 부재**. 수동 변환 (06/07 실전처럼 작가님+쌍아가 채널별 수동 가공) |
| ② 배포 (API 채널) | GitHub Issues 자동 게시 구현 완료 | **나머지 5개 API 채널 (Reddit/X/YouTube/카카오/LinkedIn) 미연동** |
| ② 배포 (CDP 채널) | 7/12 채널 텍스트 검증 완료 | **서식/이미지 자동화 잔여** (네이버 서식, note 이미지, X 이미지) |
| ② → ③ 유입 | Indexing API + llms.txt 자동 갱신 (06/07) | **채널별 UTM 파라미터 + GA4 이벤트 추적 미구현** — 어떤 채널에서 유입되는지 측정 불가 |

**핵심 간극 요약:** 생산→배포 사이에 **"채널 변환 엔진"**이 비어 있음. 원본은 있고 채널도 있는데, 원본→채널별 포맷 자동 변환이 수동.

#### PF_CDP Phase 4 (스케줄 자동 배포) vs 현재 도구 성숙도

| Phase 4 항목 | 필요 도구 | 현재 성숙도 | 갭 |
|-------------|----------|:---:|------|
| 배포 오케스트레이터 | Python 스크립트 + 채널별 도구 선택 | ❌ 미착수 | `/spread-deploy` Skill로 선행 패키징 가능 |
| API 채널 모듈 | 각 채널 API SDK | 1/6 (GitHub만 완료) | Reddit(PRAW), X(tweepy) 우선 연동 |
| CDP 채널 모듈 | cdp_utils.py 채널별 함수 | MONKOS/X/티스토리/GitHub/Medium/note 6채널 검증 | 네이버 API 전환으로 CDP 탈출 필요 |
| cron 스케줄 | Claude Scheduled Tasks / crontab | 사용 가능 | 스케줄 규칙 설계 필요 |
| 실패 알림 | 텔레그램 봇 | 인프라 있음 | 알림 포맷 정의 필요 |

**Phase 4 착수 가능 시점:** API 채널 3개 이상 연동 + `/spread-deploy` Skill 패키징 완료 후.

#### PF_PORTAL 블로그 에디터(막내1 분석)와 SPREAD 원본 허브 연결점

| 연결점 | 현황 | 보완 필요 |
|--------|------|----------|
| 에디터 → 원본 저장 | Firestore blog_posts에 KO/JA/EN 3개국어 저장 | ✅ 완비 |
| 원본 → 배포 트리거 | 발행 시 Indexing API + llms.txt 자동 (06/07) | **SPREAD 트리거 미연결** — 발행 시 `/spread-deploy` 자동 호출 필요 |
| 원본 → 채널 변환 | 수동 | **`/content-adapt` Skill** 또는 blog.js 내 채널 변환 함수 필요 |
| 에디터 이미지 → 채널 이미지 | GCS URL 직접 사용 | 일부 채널 외부 이미지 차단 가능 (네이버) → 채널별 이미지 재업로드 필요 |

---

## 종합 제언

### 즉시 착수 가능 (도구 기반 완비)

1. **Reddit API 연동** — PRAW 설치 + OAuth2 설정. 06/07 수동 배포 콘텐츠 재활용 가능
2. **`/blog-publish` Skill 패키징** — 현행 blog.js 플로우(발행→번역→인덱싱→llms.txt)를 Skill 래핑
3. **네이버 블로그 API 전환** — SmartEditor CDP 난제를 API로 우회. 서식 리치 작성 가능

### 중기 (API 연동 + 오케스트레이터)

4. **X API 연동** — Free tier 1,500트윗/월로 충분. CDP 봇 탐지 리스크 해소
5. **`/spread-deploy` Skill 설계** — Layer 판정 로직 + 채널별 배포 모듈 오케스트레이션
6. **채널 변환 엔진** — 원본 마크다운→채널별 포맷 자동 변환 (가장 큰 간극)

### cdp_utils.py 리팩토링 시점

현재 1,847줄로 **리팩토링 트리거(1,500줄) 초과**. PF_CDP README에 기재된 모듈 분리 계획:
- `scripts/tools/cdp/` 패키지화 (core / actions / profiler / smart / editors / tabs)
- Python→JavaScript 전환 검토 (서비스 코드와 언어 통일)
- 다음 cdp_utils.py 기능 추가 시 리팩토링 병행 권장

---

## ✅❌💡⏳📁🔀

✅ Phase 1 완료 — 11채널 에디터 구조 전수 분석 (기술 스택, 입력 방법, 서식, 이미지, CDP 검증 상태, 난제, 최적 도구)
✅ Phase 2 완료 — MCP 5서버(~176도구) + Skills 14개 + cdp_utils.py 1,847줄 전수 인벤토리 + 채널별 함수 매핑
✅ Phase 3 완료 — 4층 전략 정교화 + Skills 6건 신규 제안 + PF 정합성 간극 3건 분석

💡 핵심 발견:
- 6/7 3층→**4층 구조**로 정교화 (Layer 4: Stagehand/수동 = note.com)
- **API 전환이 가장 효과적인 채널**: 네이버(서식 난제 해소), Reddit(즉시 가능), X(봇 탐지 회피)
- **가장 큰 간극**: 원본→채널별 자동 변환 엔진 부재 (현재 전부 수동 가공)
- **cdp_utils.py 1,847줄**: 리팩토링 트리거 초과, 다음 기능 추가 시 분리 권장

📁 본 보고서 1건
⏳ 후속: API 연동 지시서 (Reddit/X/네이버) + `/blog-publish` Skill 패키징 + cdp_utils.py 리팩토링
🔀 PF_SPREAD Phase 1 인프라 구축, PF_CDP Phase 2.5 Skills 패키징, PF_OPUS Phase 1 생산공장 연결
