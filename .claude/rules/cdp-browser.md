---
description: 브라우저 제어가 필요할 때 적용
paths:
  - "scripts/tools/cdp*"
  - "scripts/tools/cdp_utils.py"
---

# CDP 브라우저 제어 규칙

> **CDP(Chrome DevTools Protocol)는 멀티에이전트 동시 브라우저 제어의 기본 인프라다.**
> **MCP 브라우저·데이터 도구도 적합하면 함께 쓴다. 금지는 '단일 계정·세션 점유로 멀티에이전트를 막는' 도구에 한정한다.**

## 왜 CDP인가 — 그리고 왜 MCP를 막지 않는가

CDP를 기본으로 두는 이유는 단 하나, **멀티에이전트 동시 운용**이다.
- Claude in Chrome 확장은 한 세션이 점유하면 다른 에이전트가 사용 불가 → 멀티 운용의 벽.
- CDP는 포트별 독립 인스턴스 → 여러 에이전트가 동시에 각자의 브라우저를 제어 가능.

**그러나 MCP 도구 자체를 금지할 이유는 없다.** CDP 우선은 "계정·세션 단일점유 회피"가 목적이지 MCP를 죽이려는 게 아니다.
- Playwright MCP, GA4/GSC/Cloudflare MCP 등 데이터·자동화 MCP는 **적극 활용**한다.
- **MCP가 가능하고 적합하면 MCP를 우선**한다 (더 단순·안정적인 경우가 많다).
- **"MCP로는 되는데 CDP 강제 때문에 막힌다"는 논리는 성립하지 않는다.**
- CDP가 강제되는 유일한 경우: 여러 에이전트가 **동시에** 브라우저를 점유해야 하는 시나리오.

> 근거: 2026-06-05 작가님 — "MCP 차단은 CDP 발전과 Claude in Chrome 계정 한계 때문에 우회한 것일 뿐, MCP 도구 자체를 차단할 이유는 없다. 새로운 확장을 기존 제약으로 가로막으면 그것은 벽이지 레일이 아니다."

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

## 도구 선택 기준

| 도구 | 사용 | 이유 |
|------|------|------|
| **CDP** (`cdp.sh`/`cdp_utils.py`) | 멀티에이전트 동시 브라우저 제어의 기본 | 포트별 독립 인스턴스 |
| **Playwright MCP** | 단일 에이전트 브라우저 작업, MCP가 더 적합할 때 | 안정적·간편 |
| **데이터형 MCP** (GA4/GSC/Cloudflare 등) | **적극 활용** | 브라우저 점유와 무관, API 직결 |
| `mcp__Claude_in_Chrome__*` | ❌ 금지 | **단일 세션 점유 → 멀티에이전트 불가** (금지의 유일한 진짜 근거) |
| `mcp__computer-use__*` | ⚠️ 별도 승인 시만 | 데스크톱 전체 자동화 (리스크) |

원칙: **금지는 '단일점유로 멀티에이전트를 막는 것'에 한정한다.** 그 근거에 해당하지 않으면 MCP는 자유롭게 쓴다.

## 막힘 대응 — PF_CDP 참조 의무 (법률 ch7 6조)

브라우저 자동화 예외·예상외 동작 포착 시 (키 이벤트 미반영, 클릭 무효,
타이핑 실패, DOM 비어 보임, 붙여넣기 미반영, 팝업 차단 등):

1. `/cdp-troubleshoot` 스킬을 호출한다. (절차 상세 위임)
2. **가설 수립 전**에 case_studies.md + golden_paths.md + editor_adapters/ 선행 점검.
3. "CDP 원리상 불가" 같은 큰 결론으로 뛰기 금지.

> 위반 시: 2026-04-17 Google Docs Cmd+V 실패 — Phase 3 교훈 미참조로 같은 함정 재발.

## 의존성

- `pip install websockets` (단일 패키지)
- 디버깅 크롬 실행 중이어야 함: `scripts/tools/cdp_setup.sh start [포트]`

## 참조

- 정본: `monkos-ops/ops/portfolios/PF_CDP/`
- 실전 매뉴얼: `monkos-ops/ops/portfolios/PF_CDP/SPREAD_DEPLOY_MANUAL.md`
