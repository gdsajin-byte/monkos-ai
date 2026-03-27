---
type: README
date: 2026-02-27
from: 막내3
---

# tools

> **소관**: 막내
> **성격**: 유틸리티
> **법적 근거**: ch4 2조

## 개요

이미지 입력 보조 도구 모음. 클립보드 스크린샷 저장, 파일 선택 다이얼로그를 통한 이미지 경로 출력 등 CLI 작업 시 이미지 핸들링을 지원한다.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| img_clip.py | 클립보드 이미지를 파일로 저장하고 경로 출력 (스크린샷 캡처 후 사용) | 2026-02-04 |
| img_pick.py | 파일 선택 다이얼로그로 이미지를 선택하고 경로 출력 (tkinter 기반) | 2026-02-04 |
| cdp.sh | CDP 간이 CLI — 탭 조회, JS 실행, 스크린샷 (PF_CDP) | 2026-03-26 |
| cdp_utils.py | CDP Python 유틸 패키지 — 전 기능 + MonkosEditor (PF_CDP Phase 1) | 2026-03-27 |

---

## CDP Tools (PF_CDP)

> 크롬 확장 없이 디버깅 포트로 브라우저를 제어한다. 에이전트별 독립 인스턴스 운용 가능.

### 의존성

```bash
pip install websockets
```

### 디버깅 크롬 실행

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.config/chrome-devtools-mcp \
  --no-first-run --no-default-browser-check about:blank &
```

### cdp.sh 사용법

```bash
./scripts/tools/cdp.sh tabs              # 탭 목록
./scripts/tools/cdp.sh eval "document.title" 0  # JS 실행
./scripts/tools/cdp.sh navigate "https://monkos.ai" 0
./scripts/tools/cdp.sh content 0         # 페이지 텍스트
./scripts/tools/cdp.sh screenshot /tmp/shot.png 0
```

### cdp_utils.py — CDP 클래스

```python
from cdp_utils import CDP
import asyncio

async def main():
    async with CDP(port=9222, tab_index=0) as cdp:
        await cdp.navigate("https://monkos.ai")
        await cdp.screenshot("/tmp/shot.png")
        await cdp.click_element("button.primary")
        await cdp.type_text("검색어")
        result = await cdp.evaluate("document.title")

asyncio.run(main())
```

### cdp_utils.py — MonkosEditor 클래스

```python
from cdp_utils import MonkosEditor
import asyncio

async def write_blog():
    async with MonkosEditor(port=9222, tab_index=0) as ed:
        await ed.navigate("https://monkos.ai/admin/blog-edit.html")
        await ed.wait(2)
        await ed.set_title("글 제목")
        await ed.set_category("AI")
        await ed.editor_set_markdown("## 제목\n\n본문")
        await ed.set_seo("SEO 요약")
        await ed.set_tags("태그1, 태그2")

asyncio.run(write_blog())
```

### 주의사항

- ProseMirror: `innerHTML` 직접 주입 불가 — `editor_set_markdown()` 사용
- 좌표: CSS 픽셀 기준 (Retina dpr=2에서도 일치)
- Toast UI Editor: ES 모듈 스코프 — `_ensure_editor()`가 자동 글로벌 노출

## 관련 문서

- [상위 폴더](../README.md)
- [PF_CDP](../../monkos-ops/ops/portfolios/PF_CDP.md)
