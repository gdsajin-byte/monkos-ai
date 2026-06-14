---
type: order
from: iMac/쌍아
to: iMac/막내2
date: 2026-04-05
subject: CDP smart_search() — 검색 통합 패턴
status: 대기
portfolio: PF_CDP
priority: important
pf: PF_CDP
---

[2026-04-05 17:00 KST] iMac/쌍아 → iMac/막내2

# smart_search() — 검색 통합 패턴

## 문제

검색 input의 name이 사이트마다 다름 (keyword, searchKeyword, q, search 등). 검색 실행 방식도 button submit, form submit, onclick, Enter 키 등 제각각.

## 해결

프로파일링 시 검색 필드 자동 탐지 + smart_search() API:

```python
async def smart_search(self, query: str) -> bool:
    """검색 필드 자동 탐지 → 입력 → 실행"""
    # 1. 프로파일에서 검색 input 찾기
    #    - type="search"
    #    - placeholder에 '검색', 'search', '찾기' 포함
    #    - name에 'q', 'query', 'keyword', 'search' 포함
    #    - role="searchbox"
    # 2. smart_fill로 검색어 입력
    # 3. 검색 실행 (우선순위):
    #    a. 검색 버튼이 프로파일에 있으면 smart_click
    #    b. form의 submit 이벤트 발사
    #    c. Enter 키 전송 (폴백)
```

프로파일 JSON에 `search_inputs` 태그 자동 부여:
```json
{
    "search_inputs": [{
        "selector": "#keyword",
        "submit_method": "button",     // "button" | "form" | "enter"
        "submit_selector": ".btn-search"
    }]
}
```

## 테스트

- 기업마당 (bizinfo.go.kr) — 공고 검색
- Google 검색
- monkos.ai — FAQ 검색 (있다면)

## 산출물

- `scripts/tools/cdp_utils.py` — smart_search + 프로파일 search_inputs 자동 감지

## ⚠️ 준수

- 기존 API 수정 금지
- 검색 결과 데이터 변경 금지 (검색 실행만)
