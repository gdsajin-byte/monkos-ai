---
type: order
from: iMac/쌍아
to: iMac/막내3
date: 2026-04-05
subject: CDP 탭 관리 안정화 — type=page 필터 + URL/타이틀 기반 탭 선택
status: 대기
priority: critical
pf: PF_CDP
---

[2026-04-05 16:34 KST] iMac/쌍아 → iMac/막내3

# CDP 탭 관리 안정화

## 1. 문제

`/json` 엔드포인트가 page + iframe 타겟을 전부 반환.
tab_index로 접근하면 iframe에 연결되어 스크린샷/명령 실패.
세션 중 탭 추가/제거 시 인덱스가 변동하여 불안정.

## 2. 작업

### A. CDP.connect()에 type='page' 필터링

```python
def _get_tabs(self) -> list:
    """page 타입만 반환 (iframe 제외)"""
    import urllib.request
    url = f"{self.base_url}/json"
    data = json.loads(urllib.request.urlopen(url).read())
    # page 타입만 필터
    return [t for t in data if t.get("type") == "page"]
```

### B. URL/타이틀 기반 탭 선택 API 추가

CDP 클래스 생성자 확장:

```python
class CDP:
    def __init__(self, port=9222, host="127.0.0.1",
                 tab_index=0, url=None, title=None):
        self.port = port
        self.host = host
        self.tab_index = tab_index
        self._url_pattern = url      # URL 패턴 매칭
        self._title_pattern = title   # 타이틀 패턴 매칭
```

connect()에서:
```python
async def connect(self, tab_index=None):
    tabs = self._get_tabs()  # page만

    if self._url_pattern:
        # URL에 패턴 포함된 탭 찾기
        matched = [t for t in tabs if self._url_pattern in t.get("url", "")]
        if matched:
            ws_url = matched[0]["webSocketDebuggerUrl"]
            self.ws = await websockets.connect(ws_url, max_size=10*1024*1024)
            return self

    if self._title_pattern:
        # 타이틀에 패턴 포함된 탭 찾기
        matched = [t for t in tabs if self._title_pattern in t.get("title", "")]
        if matched:
            ws_url = matched[0]["webSocketDebuggerUrl"]
            self.ws = await websockets.connect(ws_url, max_size=10*1024*1024)
            return self

    # 폴백: 기존 인덱스 방식
    idx = tab_index if tab_index is not None else self.tab_index
    ...
```

### C. safe_navigate() 추가

크로스오리진 이동 시 WebSocket 끊김 문제 해결:

```python
async def safe_navigate(self, url: str, wait: float = 3.0):
    """크로스오리진 이동 시 자동 재접속"""
    try:
        await self.navigate(url)
    except Exception:
        # WS 끊김 → 재접속
        await asyncio.sleep(1)
        await self.close()
        await self.connect()
    await self.wait(wait)
```

### D. 탭 목록 개선

```python
def print_tabs(self):
    """page 탭만 보기 좋게 출력"""
    tabs = self._get_tabs()
    for i, t in enumerate(tabs):
        print(f"  [{i}] {t.get('title', '(no title)')[:50]}")
        print(f"      {t.get('url', '')[:80]}")
```

### E. 테스트

1. iframe이 많은 페이지 (GA4, 티스토리) — type=page 필터링 확인
2. URL 기반 탭 선택: `CDP(url='monkos.ai/admin')` → 정확한 탭 연결
3. 타이틀 기반 탭 선택: `CDP(title='Blog')` → 정확한 탭 연결
4. safe_navigate: monkos.ai → analytics.google.com 크로스오리진 이동 → 자동 재접속
5. 세션 중 탭 추가/제거 후 기존 연결 유지 확인

## 3. 산출물

- `scripts/tools/cdp_utils.py` — CDP 클래스 수정 (connect, _get_tabs, safe_navigate, print_tabs)
- 테스트 결과 보고

## 4. ⚠️ 준수 조항

- 기존 tab_index 방식 유지 (하위 호환) — url/title은 추가 옵션
- PageProfiler 코드 건드리지 말 것 — CDP 클래스만 수정
- 외부 의존성 추가 금지
- 테스트 시 데이터 변경 금지
