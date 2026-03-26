---
type: PROPOSAL
id: PROPOSAL_20260326_LOCAL_CDP
project: AGENT_INFRA
date: 2026-03-26
from: iMac/민아
to: 작가님
status: 작업명세(검토대기)
priority: 중간
ref:
  - PROPOSAL_20260320_BROWSER_ENV (브라우저 연동 env 체계 기안)
  - PROPOSAL_20260320_AGENT_AUTH (에이전트 인증 기안)
---

# 로컬 CDP 브라우저 제어 — MCP 인스턴스 독립 운용 검증

**[2026-03-26 19:13 KST] iMac/민아 → 작가님**

---

## 0. 핵심 검증 결과

> **Claude in Chrome 확장을 다른 팀원에게 넘겨줘도, 로컬 CDP(Chrome DevTools Protocol)로 자체 크롬 인스턴스를 잡아 독립적으로 브라우저 작업이 가능하다.**

이것이 이 세션에서 검증한 본질이다. 크롬 확장은 1석 점유 — 에이전트가 늘어나면 병목이 된다. CDP 방식은 디버깅 포트만 다르면 **에이전트마다 독립 브라우저 인스턴스를 운용**할 수 있고, 확장 점유와 무관하게 풀 브라우저 제어(클릭, 타이핑, 스크린샷, JS 실행)가 가능하다.

| | Claude in Chrome 확장 | 로컬 CDP (검증 완료) |
|---|---|---|
| 동시 사용 | ❌ 1석 점유 | ✅ 포트별 독립 인스턴스 |
| 에이전트 간 충돌 | 있음 | 없음 |
| 브라우저 제어 범위 | 풀 (스크린샷, 클릭, 타이핑) | 풀 (동일) |
| 설정 난이도 | 확장 설치 1회 | 디버깅 크롬 실행 + CDP 연결 |
| 커스텀 가능성 | 없음 (외부 확장) | 있음 (자체 도구화 가능) |

---

## 1. 배경 및 문제

### 1-1. 왜 이 작업이 시작됐나
- 기존 브라우저 제어는 **Claude in Chrome 확장** 의존
- 확장은 **한 세션만 점유 가능** — 다른 팀원(쌍아/막내)이 쓰면 민아가 못 씀
- 멀티에이전트 환경에서 브라우저 제어는 공유 자원이 아닌 **에이전트별 독립 자원**이어야 함
- 크롬 확장 없이 독립적으로 브라우저를 제어할 수단이 필요

### 1-2. 시도한 것
1. `chrome-devtools-mcp` npm 패키지 (`~/.claude/mcp.json` 등록)
2. Chrome `--remote-debugging-port=9222` 디버깅 인스턴스 (이전 세션 민아가 생성)
3. CDP WebSocket 직접 호출 (Python + websockets)

### 1-3. 발견된 문제

| 구분 | 상태 | 비고 |
|------|------|------|
| `~/.claude/mcp.json` 파일명 | ✅ 해결 | `.mcp.json`(dot접두사) → `mcp.json`으로 수정. 세션 리셋 필요 |
| `Control_Chrome` — 탭 열기/전환 | ✅ 동작 | `open_url`, `list_tabs`, `switch_to_tab`, `get_current_tab` |
| `Control_Chrome` — JS실행/페이지읽기 | ❌ 실패 | `get_page_content`, `execute_javascript` → "Chrome is not running" 에러 |
| CDP WebSocket 직접 호출 | ✅ 동작 | `python3 + websockets`로 전부 가능 |

**결론**: MCP 패키지가 일부 기능에서 크롬 감지를 못 하는 버그. CDP 프로토콜 자체는 정상.

---

## 2. 오늘 세션에서 검증한 것

### 2-1. CDP 직접 제어 — 전 기능 검증 완료

| 기능 | 방법 | 결과 |
|------|------|------|
| 탭 목록 조회 | `GET /json` | ✅ |
| 페이지 타이틀 | `Runtime.evaluate` → `document.title` | ✅ |
| 페이지 텍스트 추출 | `Runtime.evaluate` → `document.body.innerText` | ✅ |
| JS 임의 실행 | `Runtime.evaluate` | ✅ |
| URL 이동 | `Page.navigate` | ✅ |
| 스크린샷 | `Page.captureScreenshot` (max_size 10MB 필요) | ✅ |
| 영역 스크린샷 | `Page.captureScreenshot` + `clip` | ✅ |
| 마우스 클릭 | `Input.dispatchMouseEvent` (mousePressed+Released) | ✅ |
| 직접 타이핑 | `Input.insertText` | ✅ 한글+이모지 |
| 키보드 입력 | `Input.dispatchKeyEvent` | ✅ Enter 등 |

### 2-2. 실전 작업 — MONKOS 어드민 블로그 에디터

1. **monkos.ai/admin** 접속 → 대시보드 확인
2. **Blog Management** → New Post 클릭
3. **시드 탭** 열기 → EP-036 (블로그 에디터 5회 이터레이션) 시드 선택
4. **메타 필드 세팅**: 카테고리(AI), 제목, SEO 요약, 태그
5. **본문 직접 타이핑**: H2 소제목 5개 + 볼드 + 본문 (editor.exec API + Input.insertText 조합)
6. **이미지 삽입**: 이미지 패널 → 이미지 클릭 → 미리보기 팝업 → "본문 삽입" 클릭

**전 과정 크롬 확장 없이 로컬 CDP만으로 완료.**

---

## 3. 현재 산출물

### 3-1. cdp.sh (간이 CLI 도구)
- 위치: `scripts/tools/cdp.sh`
- 용도: 단순 조회 (탭 목록, 타이틀, 스크린샷 등)
- 한계: 복잡한 연속 작업(클릭→타이핑→서식)은 인라인 Python으로 매번 작성

### 3-2. 디버깅 크롬 인스턴스
- 프로세스: `--remote-debugging-port=9222 --user-data-dir=~/.config/chrome-devtools-mcp`
- 일반 크롬과 프로필 분리 (독립 실행)
- 이전 세션 민아가 생성, 현재 살아있는 상태

---

## 4. 문제점 및 다음 단계

### 4-1. 현재 한계
1. **매번 Python 인라인 코드 작성** — 재사용성 0. 세션마다 반복
2. **cdp.sh는 단순 조회만** — 복합 작업 (클릭+대기+타이핑+서식) 커버 불가
3. **MCP 도구로 통합 안 됨** — Claude가 자연스럽게 호출하려면 MCP 서버 형태여야 함
4. **에디터 조작 노하우 휘발** — Toast UI Editor의 `window.editor` API, ProseMirror 포커스 방법 등이 코드에만 남아있음

### 4-2. 가능한 다음 단계

#### 방안 A: chrome-devtools-mcp 패키지 디버깅
- JS실행/페이지읽기 실패 원인 특정 → 패키지 이슈 or 설정 문제
- 성공하면 별도 개발 불필요
- **리스크**: 외부 패키지 의존, 우리 용도에 맞는 커스텀 불가

#### 방안 B: 자체 CDP MCP 서버 개발
- `scripts/tools/` 하위에 Node.js/Python MCP 서버
- 우리 작업에 필요한 도구만 노출: `click`, `type`, `screenshot`, `eval`, `navigate`
- MONKOS 어드민 전용 매크로도 추가 가능 (블로그 글쓰기, 이미지 삽입 등)
- **리스크**: 개발 공수. 하지만 한번 만들면 모든 에이전트가 재사용

#### 방안 C: 하이브리드 (현실적 1단계)
- `cdp.sh`를 확장하여 복합 작업도 커버하는 Python 유틸 라이브러리화
- MCP 서버는 나중에 필요 시 래핑
- 당장은 민아가 CDP 직접 호출로 작업 수행

### 4-3. 작가님 판단 필요 사항
1. **방안 선택**: A / B / C 또는 다른 방향
2. **우선순위**: 다른 작업 대비 이 인프라 투자의 긴급도
3. **포트폴리오 등록 여부**: PF로 추적할 규모인지, 세션 단위 기록으로 충분한지

---

## 5. 기술 상세 (참고)

### 5-1. CDP 연결 구조
```
Claude Code (민아)
  → python3 + websockets
    → ws://127.0.0.1:9222/devtools/page/{TARGET_ID}
      → Chrome (디버깅 인스턴스, 별도 프로필)
```

### 5-2. 핵심 CDP 명령어
```
Runtime.evaluate         — JS 실행
Page.navigate            — URL 이동
Page.captureScreenshot   — 스크린샷 (clip 옵션으로 영역 지정)
Input.dispatchMouseEvent — 마우스 클릭 (mousePressed + mouseReleased)
Input.insertText         — 텍스트 직접 입력 (한글/이모지 지원)
Input.dispatchKeyEvent   — 키보드 입력 (Enter, 단축키 등)
```

### 5-3. 주의사항
- 스크린샷 데이터가 크면 WebSocket `max_size` 확장 필요 (기본 1MB → 10MB)
- ProseMirror 에디터는 `innerHTML` 직접 주입 불가 → `window.editor.setHTML()` 또는 포커스 후 `Input.insertText`
- dpr=2 환경에서 스크린샷 좌표와 클릭 좌표 일치 (CSS pixel 기준)
- 에디터 포커스: `element.focus()` JS만으론 부족, **마우스 클릭으로 포커스 잡아야** 타이핑 동작

---

*이 문서는 2026-03-26 민아 세션에서의 탐색·검증 결과를 정리한 작업명세입니다.*
*발행/커밋 여부는 작가님 판단에 따릅니다.*
