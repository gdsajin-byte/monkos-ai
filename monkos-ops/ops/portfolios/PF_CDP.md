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

**Phase 로드맵**:
1. **Phase 2** — 민아 기능 탐색·테스트 → 쌍아·막내 MCP 공유 → 멀티탭 연동. 이 구간에서 이미 실무 막강
2. **Phase 3** — 실시간 대화창. 쌍아·민아·막내가 한 공간에서 대화 → 즉시 각자 임무 세팅 → 병렬 돌입. 멀티에이전트가 하나의 통괄 시스템처럼 움직인다
3. CDP가 여는 것: 에이전트가 브라우저를 **눈으로 보고 입력**할 수 있으니, 파일 릴레이 없이 실시간 소통이 가능. 작가님 중계 부담 제거

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

### 성공 지표

| 지표 | 시작점 (3/26) | Phase 1 목표 | Phase 2 목표 |
|------|-------------|-------------|-------------|
| MCP 배당 에이전트 | 민아만 (직접 호출) | cdp_utils.py 완성 | **쌍아·막내·민아 전원** MCP 도구 |
| 반복 작업 자동화 수준 | 매번 인라인 Python | 유틸 라이브러리 | `.mcp.json` 한 줄로 전원 무장 |
| 어드민 작업 커버리지 | 블로그 글쓰기 | +이미지 일괄 +FAQ | 전 어드민 기능 |

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
| 멀티 포트 동시 운용 테스트 | ⏳ | 미정 | 에이전트별 독립 인스턴스 |

### Phase 2 — Playwright MCP 통합 + 접근성 트리 전환 🔄 진행 중

> 좌표 기반 클릭의 근본 한계를 접근성 트리로 돌파한다. 비용 ₩0.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Playwright MCP 서버 설치 + CDP 연결 | ⏳ | 막내(구현) | `npx @playwright/mcp@latest --cdp-endpoint ws://localhost:9222` |
| cdp_utils.py 접근성 트리 강화 | ⏳ | 막내(구현) | `click_element(selector)` → `click_accessible(role, name)` 전환 |
| GA4/GSC SPA 네비게이션 검증 | ⏳ | 막내(구현) | 기존 CDP 실패 구간을 Playwright MCP로 재시도 |
| `.mcp.json` 프로젝트 설정 | ⏳ | 쌍아(설계) | Playwright MCP → 전 에이전트 자동 획득 |
| 멀티 포트 동시 운용 테스트 | ⏳ | 미정 | 에이전트별 독립 크롬 인스턴스 |
| 7/12 채널 접근성 트리 전환 검증 | ⏳ | 막내(구현) | 좌표 하드코딩 0건 목표 |

### Phase 2.5 — Stagehand v3 난제 사이트 적용 ⏳ 다음

> 자연어 기반 브라우저 제어. `act("발행 버튼 클릭")`. 캐싱으로 비용 억제.
> ⚠️ LLM 비용 발생 구간 — 별도 승인 후 착수

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Stagehand Python SDK 설치 | — | 막내(구현) | `pip install stagehand` |
| note.com 자동 배포 파일럿 | — | 막내(구현) | act()/observe() 자연어 제어 |
| 캐싱 효율 실측 | — | 막내(구현) | 2회차 LLM 호출 생략 확인 + 비용/속도 측정 |
| Naver SmartEditor 돌파 시도 | — | 막내(구현) | 서식/링크 입력 가능 여부 재검증 |
| 비용 보고 → 작가님 승인 | — | 쌍아(보고) | act() 1회 ₩4~15, 월 예산 시뮬레이션 |

### Phase 3 — 스케줄 자동 배포 파이프라인 ⏳ 다음

> 콘텐츠 1건 입력 → N채널 자동 배포. 한송이 수동 배포(월 30~60시간) 자동화.
> PF_SPREAD Phase 1과 인터페이스.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 배포 오케스트레이터 스크립트 | — | 쌍아(설계) + 막내(구현) | Python, 채널별 도구 선택 (CDP/Playwright/Stagehand) |
| 채널별 배포 모듈 | — | 막내(구현) | 도구 매핑: MONKOS(CDP), X(Playwright), note(Stagehand) |
| cron / Claude Scheduled Tasks 연동 | — | 쌍아(설계) | 스케줄 트리거 |
| 실패 알림 + 재시도 로직 | — | 막내(구현) | |
| 배포 로그 자동 기록 | — | 막내(구현) | |

### Phase 3.5 — Browser Use 자율 에이전트 (선택)

> 최후 수단. 비용 높으나 가장 강건. 난제 사이트 폴백 전용.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Browser Use 설치 + 검증 | — | — | 필요 시 |
| Naver/Instagram 폴백 적용 | — | — | Stagehand 실패 시 |

### Phase 4 — 실시간 대화 + 역할 융합

> 쌍아가 민아고 민아가 막내인. 멀티에이전트가 하나의 통괄 시스템.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 실시간 대화창 구현 | — | — | 전원이 한 공간에서 대화, 즉시 임무 세팅 → 병렬 돌입 |
| 에이전트 간 CDP 소통 | — | — | 파일 릴레이 → 브라우저 기반 실시간. 작가님 중계 부담 제거 |
| CDP→CITADEL→SPREAD 연결 | — | — | 시드→에디터 작성→멀티채널 배포 |

> **병행 추적**: Anthropic 클라우드 확장도 개선 중. CDP 자체 도구화와 확장 기능 향상을 동시 추적.

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
| GA4/GSC | CDP (불안정) | **Playwright MCP** | SPA 네비게이션 해결 |

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
