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

### Phase 2 — 전 에이전트 MCP 무장 ⏳ 다음

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| cdp_utils.py → MCP 서버 래핑 | ⏳ | 쌍아(설계) + 막내(구현) | Phase 1 패턴을 MCP 도구로 노출 |
| `.mcp.json` 프로젝트 설정 | ⏳ | 쌍아 | 한 줄 등록 → 전 에이전트 자동 획득 |
| 멀티 포트 동시 운용 테스트 | ⏳ | 미정 | 에이전트별 독립 크롬 인스턴스 |
| 멀티탭 동시 제어 | — | — | 원 탭 고정 → 탭 간 전환·병렬 조작 |

### Phase 3 — 파이프라인 연동

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 어드민 매크로 | — | — | 블로그 글쓰기, 이미지 삽입, FAQ 편집 |
| 웹서치 자동화 | — | — | 검색→수집→분석 파이프라인 |
| CDP→CITADEL→SPREAD 연결 | — | — | 시드→에디터 작성→멀티채널 배포 |
| 한(M4)·꾸(M2) 세팅 | — | 작가님 | 디바이스별 크롬 디버깅 + MCP 배당 |

> **병행 추적**: Anthropic 클라우드 확장도 개선 중. CDP 자체 도구화와 확장 기능 향상을 동시 추적.

---

## 4. 성과

> 실측 데이터. 측정일 명시. 추정 금지.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| CDP 검증 기능 수 | 8/8 (전수 통과) | 03/26 | 탭·JS·이동·스크린샷·클릭·타이핑·키보드·이미지 |

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
