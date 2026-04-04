---
description: 브라우저 제어가 필요할 때 적용
globs:
  - "**"
---

# CDP 브라우저 제어 규칙

> **Claude in Chrome MCP 도구 사용 금지. CDP(Chrome DevTools Protocol)로 브라우저를 제어한다.**

## 왜?

Claude in Chrome 확장은 한 세션이 점유하면 다른 에이전트가 사용 불가.
CDP는 포트별 독립 인스턴스 → 멀티 에이전트 동시 운용 가능.

## 포트 배당표

> 디바이스 간 분기 불필요 (localhost 격리). 동일 디바이스 내 동시 에이전트 수만큼 분기.

| 포트 | 용도 |
|------|------|
| 9222 | 기본 (작가님/단독 에이전트) |
| 9223 | 동시 가동 2번째 에이전트 |
| 9224 | 동시 가동 3번째 에이전트 |
| 9225 | 동시 가동 4번째 에이전트 |

- 전 디바이스(M1/M4/M2/iMac) 동일 번호 체계
- 단독 에이전트면 9222 하나로 충분

## 사용법

### 1. 상태 확인
```bash
scripts/tools/cdp_setup.sh status
```

### 2. bash 간이 사용 (cdp.sh)
```bash
scripts/tools/cdp.sh tabs                       # 탭 목록
scripts/tools/cdp.sh eval "document.title" 0    # JS 실행
scripts/tools/cdp.sh navigate "https://url" 0   # URL 이동
scripts/tools/cdp.sh screenshot /tmp/shot.png 0 # 스크린샷
scripts/tools/cdp.sh content 0                  # 페이지 텍스트
```

### 3. Python 고급 사용 (cdp_utils.py)
```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP, MonkosEditor

# 기본 브라우저 제어
async with CDP(port=9222) as cdp:
    await cdp.navigate("https://monkos.ai")
    title = await cdp.title()
    await cdp.screenshot("/tmp/shot.png")
    text = await cdp.text()

# 요소 클릭
    await cdp.click_element("button.submit")
    await cdp.click_text("발행", "button")

# 폼 입력
    await cdp.fill("#title", "제목")
    await cdp.type_text("한글 입력")

# 접근성 트리 (read_page 대체)
    elements = await cdp.read_page(interactive_only=True)
    await cdp.click_accessible("button", "로그인")

# MONKOS 어드민 에디터
async with MonkosEditor(port=9222) as ed:
    await ed.navigate("https://monkos.ai/admin/blog-edit.html")
    await ed.set_title("글 제목")
    await ed.editor_set_markdown("## 본문")
```

### 4. 스크린샷 → 시각 확인
```bash
scripts/tools/cdp.sh screenshot /tmp/check.png 0
# 이후 Read 도구로 /tmp/check.png 이미지 확인
```

## 금지 도구 (사용하지 말 것)

아래 MCP 도구는 Claude in Chrome 전용이므로 **사용 금지**:
- `mcp__Claude_in_Chrome__*` 계열 전체
- `mcp__computer-use__*` 계열 (데스크톱 자동화 — 별도 승인 시만)

대신 위의 `cdp.sh` / `cdp_utils.py`를 사용한다.

## 의존성

- `pip install websockets` (단일 패키지)
- 디버깅 크롬 실행 중이어야 함: `scripts/tools/cdp_setup.sh start [포트]`

## 참조

- 정본: `monkos-ops/ops/portfolios/PF_CDP/`
- 실전 매뉴얼: `monkos-ops/ops/portfolios/PF_CDP/SPREAD_DEPLOY_MANUAL.md`
