---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-04-05
subject: CDP PageProfiler — 런타임 자동 프로파일링 + 캐시 레이어
status: 대기
priority: high
pf: PF_CDP
---

[2026-04-05 14:10 KST] iMac/쌍아 → iMac/막내

# CDP PageProfiler — 런타임 자동 프로파일링

## 1. 배경 + 작가님 비전

> "브라우저 업무 대행하는 에이전트가 버튼 하나 못 눌러서야 되겠나"
> "개발자 도구 파악이라던가 구조적인 접근"
> "데이터를 심으면 업그레이드때마다 하드코딩 바꿔야 하잖아"
> "페이지뷰는 가리고 싶어도 가릴 수 없다"

**핵심**: 코드에 뭘 심는 게 아니라, CDP DevTools API로 페이지 구조를 **자동으로 읽어내고 캐싱**한다.
첫 방문 = 학습, 재방문 = 캐시 즉시 동작, 페이지 변경 = 자동 갱신.
LLM 호출 불필요, 순수 CDP API만으로, 비용 ₩0.

## 2. 아키텍처

```
페이지 진입
  → PageProfiler.profile(url)
    → [병렬 수집]
       ├─ DOM.getDocument (전체 DOM 트리)
       ├─ Accessibility.getFullAXTree (의미 구조)
       ├─ DOMDebugger.getEventListeners (클릭 가능 요소)
       └─ CSS.getComputedStyleForNode (가시성 필터)
    → [파싱]
       ├─ 인터랙티브 요소 추출 (버튼, 링크, 입력, 드롭다운)
       ├─ 각 요소에 최적 셀렉터 결정 (우선순위: id > data-* > aria > CSS > XPath)
       ├─ 이벤트 리스너 바인딩 맵 (어떤 요소가 클릭/키보드 반응하는지)
       └─ 가시성/활성 상태 필터 (display:none, disabled 제외)
    → [프로파일 생성]
       └─ PageProfile JSON
  → 캐시 저장 (URL 키)
  → 다음 방문: 캐시 로드 → 구조 변경 감지 → 변경 시만 재프로파일링
```

## 3. 구현 범위

### A. PageProfile 데이터 구조

```python
{
    "url": "https://monkos.ai",
    "domain": "monkos.ai",
    "path": "/",
    "title": "MONKOS AI",
    "profiled_at": "2026-04-05T14:00:00",
    "dom_hash": "abc123",  # DOM 구조 해시 → 변경 감지용
    "actions": [
        {
            "name": "촬영 시작",
            "role": "button",
            "selector": "#start-photo",          # 최적 셀렉터
            "fallback_selectors": [               # 폴백 체인
                "[data-testid='start-photo']",
                "button:contains('촬영 시작')",
                "xpath://button[text()='촬영 시작']"
            ],
            "backend_node_id": 1234,
            "box": {"x": 360, "y": 595, "w": 120, "h": 40},
            "listeners": ["click"],
            "visible": true,
            "enabled": true
        },
        ...
    ],
    "inputs": [
        {
            "name": "검색",
            "role": "textbox",
            "selector": "#search-input",
            "placeholder": "검색어를 입력하세요",
            ...
        }
    ],
    "navigation": [
        {
            "name": "블로그",
            "role": "link",
            "href": "/blog",
            "selector": "a[href='/blog']",
            ...
        }
    ]
}
```

### B. PageProfiler 클래스 (cdp_utils.py에 추가)

```python
class PageProfiler:
    """페이지 자동 프로파일링 + 캐시"""

    CACHE_DIR = os.path.expanduser("~/.cache/cdp_profiles")
    CACHE_TTL = 86400 * 7  # 7일

    def __init__(self, cdp: CDP):
        self.cdp = cdp
        os.makedirs(self.CACHE_DIR, exist_ok=True)

    async def profile(self, url: str = None, force: bool = False) -> dict:
        """현재 페이지 프로파일링. 캐시 있으면 로드, 없거나 변경 시 재생성."""
        ...

    async def smart_click(self, name: str) -> bool:
        """프로파일 기반 즉시 클릭. 풀스캔 불필요."""
        profile = await self.profile()
        for action in profile["actions"]:
            if name.lower() in action["name"].lower():
                # 셀렉터 체인 순회 — 첫 번째 성공하는 것으로 클릭
                for selector in [action["selector"]] + action["fallback_selectors"]:
                    try:
                        await self.cdp.click_element(selector)
                        return True
                    except:
                        continue
        return False

    async def smart_fill(self, name: str, value: str) -> bool:
        """프로파일 기반 입력 필드 즉시 채우기."""
        ...

    async def smart_navigate(self, name: str) -> bool:
        """프로파일 기반 네비게이션 링크 즉시 클릭."""
        ...

    def _cache_key(self, url: str) -> str:
        """URL → 캐시 파일명"""
        ...

    async def _detect_change(self, url: str, cached: dict) -> bool:
        """DOM 해시 비교로 페이지 변경 감지"""
        ...

    async def _collect_event_listeners(self) -> list:
        """DOMDebugger.getEventListeners로 클릭 가능 요소 수집"""
        ...

    async def _best_selector(self, node) -> tuple:
        """노드에 대한 최적 셀렉터 + 폴백 체인 결정"""
        # 우선순위: id > name > data-testid > data-* > aria-label > CSS path > XPath
        ...

    async def _is_visible(self, node_id) -> bool:
        """CSS.getComputedStyleForNode로 가시성 판단"""
        ...
```

### C. 기존 CDP 클래스에 통합

```python
class CDP:
    # 기존 메서드 유지

    @property
    def profiler(self) -> PageProfiler:
        """프로파일러 접근"""
        if not hasattr(self, '_profiler'):
            self._profiler = PageProfiler(self)
        return self._profiler

    # 기존 click_accessible을 smart_click으로 대체/보강
    async def click_smart(self, name: str) -> bool:
        """프로파일 기반 스마트 클릭 — 캐시 히트 시 즉시, 미스 시 프로파일링 후 클릭"""
        return await self.profiler.smart_click(name)
```

### D. 캐시 관리

- 저장 위치: `~/.cache/cdp_profiles/{domain}_{path_hash}.json`
- TTL: 7일 (자체 사이트는 longer, 외부는 shorter — 설정 가능)
- 변경 감지: DOM 구조 해시 비교. 변경 시 자동 재프로파일링
- 수동 갱신: `profiler.profile(force=True)`

### E. 셀렉터 우선순위

최적 셀렉터 결정 로직:

| 순위 | 방식 | 안정성 | 예시 |
|------|------|--------|------|
| 1 | `id` | 최고 | `#start-photo` |
| 2 | `name` attribute | 높음 | `[name='email']` |
| 3 | `data-testid` | 높음 | `[data-testid='submit']` |
| 4 | `data-*` | 높음 | `[data-action='login']` |
| 5 | `aria-label` | 중간 | `[aria-label='촬영 시작']` |
| 6 | 텍스트 내용 | 중간 | `:has-text('촬영 시작')` |
| 7 | CSS path | 낮음 | `div.hero > button.primary` |
| 8 | XPath | 최저 | `//button[text()='촬영 시작']` |

상위 셀렉터가 있으면 그것만 사용, 없으면 폴백 체인 구성.

## 4. 성능 목표

| 시나리오 | 현재 | 목표 |
|---------|------|------|
| 첫 방문 클릭 | 3초 (풀스캔) | 1.5초 (프로파일링 + 클릭) |
| 재방문 클릭 | 3초 (또 풀스캔) | **<100ms** (캐시 히트) |
| 페이지 변경 후 | 3초 | 1.5초 (자동 재프로파일) |

## 5. 테스트 시나리오

구현 후 아래 시나리오로 성능 측정:

1. **monkos.ai** 첫 방문 → 프로파일 생성 → `smart_click("촬영 시작")` 시간 측정
2. monkos.ai 재방문 → 캐시 히트 → `smart_click("촬영 시작")` 시간 측정
3. **monkos.ai/admin/blog-edit.html** → `smart_fill("제목", "테스트")` + `smart_click("발행")`
4. 외부 사이트(예: github.com) → 프로파일 생성 → 네비게이션 클릭
5. 변경 감지: DOM 수정 후 재방문 → 자동 갱신 확인

## 6. 산출물

```
scripts/tools/cdp_utils.py  — PageProfiler 클래스 추가 (기존 코드 유지)
monkos-ops/ops/reports/REPORT_20260405_iMac막내_CDP_PageProfiler.md  — 성능 측정 결과
```

## 7. ⚠️ 준수 조항

- **기존 CDP 클래스 메서드 삭제/변경 금지** — PageProfiler는 순수 추가. 기존 API 전부 유지
- 헌법 4조 1항: API 키 생성 금지
- 헌법 4조 2항: 파괴적 명령 금지
- 법률 ch2: 모듈 분리 유지. cdp_utils.py 단일 파일에 클래스 추가
- 외부 의존성 추가 금지 — websockets만 유지. 표준 라이브러리 + os/json/hashlib 활용
- 테스트 시 서비스 데이터 변경 금지 (읽기 + 클릭 시연만)
