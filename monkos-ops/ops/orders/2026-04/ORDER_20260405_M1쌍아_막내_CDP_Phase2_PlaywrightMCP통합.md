---
type: order
from: M1/쌍아
to: M1/막내
date: 2026-04-05 07:32 KST
priority: P1
subject: PF_CDP Phase 2 — Playwright MCP 통합 + 접근성 트리 전환
tags: [cdp, playwright, mcp, phase2]
status: open
portfolio: PF_CDP
origin: PROPOSAL_20260405_CDP_Phase2_차세대브라우저자동화 (민아) → 쌍아 설계 → 작가님 즉시진행 승인
---

# 지시서: PF_CDP Phase 2 — Playwright MCP 통합

**[2026-04-05 07:32 KST] M1/쌍아 → M1/막내**

---

## 배경

CDP 좌표 기반 클릭이 해상도/레이아웃 변경 시 깨지는 근본 문제.
Playwright MCP(Microsoft 공식)가 **접근성 트리(accessibility tree)**로 요소를 식별 — 좌표/셀렉터 불필요.
비용 ₩0. 환경변수 1줄로 기존 CDP 디버그 크롬에 직접 연결.

> 작가님 승인: "즉시 실행가능한 것들부터 바로 진행한다"

---

## Step 1: Playwright MCP 서버 설치 + 연결

### 1-1. 설치 확인

```bash
# Node.js 환경 확인 (이미 있을 것)
node -v && npm -v

# Playwright MCP 실행 테스트 (설치 불필요, npx로 즉시)
npx @playwright/mcp@latest --help
```

### 1-2. CDP 연결 모드로 실행

기존 디버그 크롬(9222 포트)이 실행 중인 상태에서:

```bash
# CDP 엔드포인트에 연결하여 MCP 서버 시작
npx @playwright/mcp@latest --cdp-endpoint ws://localhost:9222/devtools/browser
```

> 새 브라우저를 띄우는 게 아니라 **기존 디버그 크롬에 접속**하는 것.

### 1-3. 연결 검증

MCP 서버가 뜨면 아래 도구들이 사용 가능해야 함:

- `browser_snapshot` — 접근성 트리 스냅샷 (핵심)
- `browser_click` — ref ID 기반 클릭 (좌표 불필요)
- `browser_type` — ref ID 기반 타이핑
- `browser_navigate` — URL 이동
- `browser_tab_list` — 탭 목록
- `browser_screenshot` — 스크린샷

**검증 방법**: MCP 서버 stdout에 도구 목록이 출력되는지 확인. 또는 Claude Code에서 `.mcp.json` 등록 후 도구 호출 테스트.

---

## Step 2: .mcp.json 프로젝트 등록

프로젝트 루트에 `.mcp.json` 생성 (또는 기존 파일에 추가):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--cdp-endpoint",
        "ws://localhost:9222/devtools/browser"
      ]
    }
  }
}
```

> 이 설정으로 Claude Code 시작 시 자동으로 Playwright MCP 도구 획득.
> 기존 `.mcp.json`이 있으면 `mcpServers` 내에 `playwright` 키만 추가.

---

## Step 3: 접근성 트리 기반 조작 검증

### 3-1. 기본 검증 (monkos.ai)

```
1. browser_navigate → https://monkos.ai
2. browser_snapshot → 접근성 트리 출력 확인
3. browser_click → 네비게이션 메뉴 항목 클릭 (ref ID 사용)
4. browser_screenshot → 결과 스크린샷
```

### 3-2. GA4 SPA 검증 (기존 CDP 실패 구간)

```
1. browser_navigate → GA4 대시보드 URL
2. browser_snapshot → 드롭다운/탭 요소의 ref ID 확인
3. browser_click → 인구통계 드롭다운 클릭
4. browser_snapshot → 변경된 뷰 확인
```

> GA4/GSC가 SPA라서 기존 CDP `Input.dispatchMouseEvent` 좌표 클릭이 실패했음.
> 접근성 트리 기반이면 DOM 구조로 식별하므로 해결 가능성 높음.

### 3-3. 어드민 에디터 검증

```
1. browser_navigate → https://monkos.ai/admin/blog-edit.html
2. browser_snapshot → 에디터 영역 ref ID 확인
3. browser_click → 제목 입력란 클릭
4. browser_type → 테스트 제목 입력
5. browser_snapshot → 입력 확인
```

> 기존 cdp_utils.py MonkosEditor와 동일 동작이 MCP 도구로 가능한지 검증.

---

## Step 4: 기존 CDP와 공존 확인

Playwright MCP와 기존 cdp_utils.py는 **동일한 디버그 크롬**에 동시 접속 가능해야 함.

검증:
1. cdp_utils.py로 `CDP(port=9222)` 연결 → 탭 목록 조회
2. 동시에 Playwright MCP로 `browser_tab_list` 호출
3. 양쪽 모두 동일 탭 목록 반환 확인
4. 충돌이나 세션 끊김 없는지 확인

> 충돌 발생 시: 별도 포트(9226)로 Playwright 전용 크롬 인스턴스 분리 검토.

---

## Step 5: 결과 보고

아래 항목을 보고에 포함:

| 항목 | 확인 |
|------|------|
| Playwright MCP 서버 기동 | ✅/❌ |
| CDP 엔드포인트 연결 | ✅/❌ |
| browser_snapshot 접근성 트리 출력 | ✅/❌ |
| browser_click ref ID 기반 클릭 | ✅/❌ |
| GA4 SPA 네비게이션 | ✅/❌ |
| 어드민 에디터 조작 | ✅/❌ |
| 기존 cdp_utils.py 공존 | ✅/❌ |
| .mcp.json 등록 후 Claude Code 도구 획득 | ✅/❌ |

---

## 커밋 규칙

- `.mcp.json` 변경 시: `[infra] PF_CDP Phase 2: Playwright MCP 프로젝트 등록`
- 코드 변경 없이 설정만이므로 경량 커밋

## ⚠️ 준수 조항

- 기존 cdp_utils.py **수정하지 않음** (공존 확인 후 다음 지시에서 보강)
- 디버그 크롬이 꺼져 있으면 `cdp_setup.sh start 9222`로 시작 후 진행
- 완료 보고 `✅❌💡⏳📁🔀` 형식
