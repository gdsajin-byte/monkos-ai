---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-05
subject: CDP smart_click 드롭다운 depth=2 탐색
status: 대기
priority: important
pf: PF_CDP
---

[2026-04-05 17:00 KST] iMac/쌍아 → iMac/막내1

# smart_click 드롭다운 depth=2 탐색

## 문제

smart_click('글꼴')로 드롭다운은 열리나, 드롭다운 내부 옵션(나눔고딕, 맑은고딕 등)은 프로파일에 없음. 동적 렌더링으로 클릭 후에야 DOM이 생성되기 때문.

## 해결

smart_click에 depth 옵션 추가:

```python
async def smart_click(self, name: str, depth: int = 1) -> bool:
    # depth=1: 기존 동작 (프로파일에서 찾아 클릭)
    # depth=2: 클릭 → 짧은 대기 → 재프로파일링 → 내부 옵션 반환
```

depth=2 동작:
1. 1차 클릭 (드롭다운 열기)
2. `await cdp.wait(0.5)` (DOM 생성 대기)
3. `profile(force=True)` (재프로파일링)
4. 새 프로파일에서 2차 타겟 검색 + 클릭

사용법:
```python
await cdp.click_smart("글꼴")           # depth=1: 드롭다운 열기만
await cdp.click_smart("나눔고딕", depth=2)  # depth=2: 드롭다운 열고 → 내부 옵션 클릭
```

## 테스트

- monkos.ai 어드민 에디터 — 글꼴 드롭다운, 카테고리 select
- 아무 사이트의 네비게이션 서브메뉴

## 산출물

- `scripts/tools/cdp_utils.py` — smart_click depth 파라미터 추가

## ⚠️ 준수

- 기존 depth=1 동작 변경 금지 (하위 호환)
- PageProfiler 외 클래스 수정 금지
