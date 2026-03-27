---
type: component
portfolio: PF_CDP
created: 2026-03-27
owner: iMac/민아
---

# PF_CDP 컴포넌트 — 로컬 CDP 브라우저 제어 도구

> 크롬 확장 1석 점유 한계를 CDP로 돌파한다.
> 디바이스·에이전트별 독립 브라우저 제어 인프라.

## 맥락

### 문제
Claude in Chrome 확장은 **한 세션이 잡으면 다른 에이전트가 못 쓴다**. 사무실 낮 세션에서 쌍아·막내·민아가 동시에 브라우저를 써야 하는데, 확장이 병목이다. 한(M4)·꾸(M2)에게 배당하면 iMac 에이전트가 전부 맹인 비행.

### 해법
Chrome DevTools Protocol(CDP)로 디버깅 포트를 열면, **포트별 독립 인스턴스**를 띄울 수 있다. 확장 없이 WebSocket으로 직접 제어. 에이전트마다 전용 포트를 배당하면 충돌 제로.

### 검증 (Phase 0, 2026-03-26)
민아가 iMac에서 CDP 전 기능 검증 완료:
- 탭 조회/전환, JS 실행, URL 이동, 스크린샷
- 마우스 클릭, 한글 타이핑, 키보드 입력
- MONKOS 어드민 블로그 에디터에서 풀 페이지 자동 작성

### 패키지화 (Phase 1, 2026-03-27)
인라인 코드를 재사용 가능한 유틸로 정리:
- `cdp_utils.py` — CDP 클래스 (35개 함수) + MonkosEditor 클래스 (에디터 특화)
- `cdp_setup.sh` — 원커맨드 환경 셋업 (install/start/stop/status/ports)
- `cdp.sh` — 간이 CLI (탭 조회, JS 실행, 스크린샷)

## 파일 구성

| 파일 | 용도 | 비고 |
|------|------|------|
| `cdp_utils.py` | Python 유틸 패키지 (전 기능) | 정본. `scripts/tools/`에도 심링크 |
| `cdp_setup.sh` | 디바이스 셋업 스크립트 | install → start → 바로 사용 |
| `cdp.sh` | 간이 CLI (bash) | 빠른 확인용 |
| `README.md` | 본 문서 | |

## 사용 절차

### 1. 최초 설치 (디바이스당 1회)

```bash
./cdp_setup.sh install
```

### 2. 디버깅 크롬 시작

```bash
./cdp_setup.sh start 9222    # 기본 포트
./cdp_setup.sh start 9223    # 막내1 전용
```

### 3. Python에서 사용

```python
from cdp_utils import CDP, MonkosEditor
import asyncio

# 기본
async with CDP(port=9222) as cdp:
    await cdp.navigate("https://monkos.ai")
    await cdp.screenshot("/tmp/shot.png")
    title = await cdp.title()

# 에디터
async with MonkosEditor(port=9222) as ed:
    await ed.navigate("https://monkos.ai/admin/blog-edit.html")
    await ed.set_title("글 제목")
    await ed.editor_set_markdown("## 본문")
```

### 4. bash에서 간이 사용

```bash
./cdp.sh tabs                          # 탭 목록
./cdp.sh eval "document.title" 0       # JS 실행
./cdp.sh screenshot /tmp/shot.png 0    # 스크린샷
```

## 포트 배당표

| 포트 | 용도 |
|------|------|
| 9222 | 기본 (쌍아/민아) |
| 9223 | 막내1 |
| 9224 | 막내2 |
| 9225 | 막내3 |
| 9230 | M4 (한) |
| 9231 | M2 (꾸) |

## 의존성

- Python 3.x
- `pip install websockets` (단일 패키지)
- Google Chrome (디버깅 모드 실행)

## 관련 문서

- [PF_CDP 정본](../PF_CDP.md)
- [작업명세](../../proposals/PROPOSAL_20260326_로컬CDP_브라우저제어_작업명세.md)
- [Phase 1 지시서](../../orders/2026-03/ORDER_20260327_M1쌍아_iMac민아_PF_CDP_Phase1_코드수집.md)
