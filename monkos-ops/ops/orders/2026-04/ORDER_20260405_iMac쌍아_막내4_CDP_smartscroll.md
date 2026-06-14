---
type: order
from: iMac/쌍아
to: iMac/막내4
date: 2026-04-05
subject: CDP smart_scroll() — 섹션맵 기반 스크롤
status: 대기
portfolio: PF_CDP
priority: important
pf: PF_CDP
---

[2026-04-05 17:00 KST] iMac/쌍아 → iMac/막내4

# smart_scroll() — 섹션맵 기반 스크롤

## 문제

scrollIntoView는 작동하나, "FAQ로 스크롤해줘"를 프로파일 기반으로 처리 못함. 섹션 이름으로 자연스럽게 이동해야 함.

## 해결

프로파일링 시 섹션맵 자동 생성 + smart_scroll() API:

```python
async def smart_scroll(self, name: str) -> bool:
    """섹션맵에서 이름 검색 → scrollIntoView"""
    profile = await self.profile()
    for section in profile.get("sections", []):
        if name.lower() in section["name"].lower():
            await self.cdp.evaluate(
                f"document.querySelector('{section['selector']}').scrollIntoView({{behavior:'smooth',block:'start'}})"
            )
            return True
    return False
```

프로파일에 sections 자동 추가:
```json
{
    "sections": [
        {"name": "FAQ", "selector": "#faq", "tag": "section", "y": 2400},
        {"name": "가격", "selector": "#pricing", "tag": "h2", "y": 3200},
        {"name": "블로그", "selector": "a[name='blog']", "tag": "a", "y": 1800}
    ]
}
```

수집 대상:
- `h1~h6` 태그 (텍스트 + 위치)
- `section`, `article` 태그 (id 또는 첫 heading)
- `[id]` 속성이 있는 주요 요소
- `a[name]` 앵커

## 테스트

- monkos.ai — FAQ, 가격, 블로그 섹션 스크롤
- 기업마당 공고 상세 — 신청 방법, 제출 서류 등 섹션 이동

## 산출물

- `scripts/tools/cdp_utils.py` — 프로파일에 sections 추가 + smart_scroll API

## ⚠️ 준수

- 기존 API 수정 금지
- 프로파일 기존 필드(actions/inputs/navigation) 건드리지 말 것 — sections 추가만
