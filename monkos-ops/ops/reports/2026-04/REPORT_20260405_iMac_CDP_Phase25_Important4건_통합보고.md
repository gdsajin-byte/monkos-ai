---
type: report
from: iMac/쌍아 (막내1~4 보고 통합)
to: 작가님
date: 2026-04-05
subject: CDP Phase 2.5 Important 4건 구현 통합 보고
pf: PF_CDP
status: 완료
portfolio: PF_CDP
---

**[2026-04-05 19:01 KST] iMac/쌍아 → 작가님**

# CDP Phase 2.5 Important 4건 — 통합 구현 보고

> 막내 4명 병렬 구현 완료. 개별 보고서 미산출 → 쌍아가 터미널 보고 기반 통합 정리.

---

## I1. smart_click depth=2 드롭다운 탐색 (막내1)

**구현**: PageProfiler.smart_click()에 `depth: int = 1` 파라미터 추가
- depth=1: 기존 동작 그대로 (하위 호환)
- depth=2: 1차 미발견 시 → 0.5초 대기 → profile(force=True) → 2차 탐색

**사용법**:
```python
await cdp.click_smart("글꼴")                    # depth=1: 드롭다운 열기
await cdp.click_smart("나눔고딕", depth=2)         # depth=2: 재프로파일 → 옵션 클릭
```

**검증**: 구문 검증 통과. 기존 호출 코드 변경 불필요.

---

## I2. smart_search() 검색 통합 (막내2)

**구현**: 3개 컴포넌트
1. `_detect_search_inputs()` — 검색 필드 자동 감지 (role=searchbox, type=search, placeholder/name 키워드)
2. `smart_search(query)` — 검색 필드 탐지 → 입력 → 실행 (button/form/enter 자동 선택)
3. `_build_profile()` — search_inputs 프로파일 자동 포함

**테스트 결과**:

| 사이트 | 검색 필드 | submit 방식 | 결과 |
|--------|----------|------------|------|
| Google | ✅ #APjFqb | button (btnK) | ✅ URL에 q= 반영 |
| 기업마당 | ✅ input[name="keyword"] | enter | ✅ 네비게이션 발생 |

---

## I3. smart_extract() 텍스트 구조화 추출 (막내3)

**구현**: 7개 필드 구조화 추출
- title, headings, tables, body, files, images, meta

**테스트 결과**:

| 사이트 | 시간 | title | headings | tables | body | images | meta |
|--------|------|-------|----------|--------|------|--------|------|
| monkos.ai | 3ms | ✅ | 23개 | 0 | 1,038자 | 10장 | 4필드 |
| 기업마당 공고 | 4ms | ✅ | 5개 | 0 (div기반) | 1,707자 | 3장 | — |
| GSC 실적 | 즉시 | ✅ | 0 | 1개 | 0 (SPA) | 0 | — |

**발견**: 정부 사이트는 `<table>` 대신 div 레이아웃 → tables 0은 정상. SPA는 body 제한적.

---

## I4. smart_scroll() 섹션맵 스크롤 (막내4)

**구현**: 3개 컴포넌트
1. `_COLLECT_SECTIONS_JS` — h1~h6, section/article/div[id], a[name] 수집. y좌표 정렬
2. `_build_profile()` — sections 필드 추가 (기존 actions/inputs/navigation 미수정)
3. `smart_scroll(name)` — 섹션명 부분 매칭 → scrollIntoView smooth

**테스트**: monkos.ai에서 35개 섹션 수집 확인.
**주의**: 한글명 매칭 — `smart_scroll("자주 묻는 질문")` (FAQ로는 불일치)

---

## 종합

| # | 항목 | 상태 | cdp_utils.py 영향 |
|---|------|------|-----------------|
| I1 | depth=2 드롭다운 | ✅ | smart_click 파라미터 추가 |
| I2 | smart_search | ✅ | 신규 메서드 + _detect_search_inputs |
| I3 | smart_extract | ✅ | 신규 메서드 |
| I4 | smart_scroll | ✅ | 신규 메서드 + _COLLECT_SECTIONS_JS + sections 프로파일 |

**cdp_utils.py 현재 1,716줄** — 1,500줄 리팩토링 싸인 초과. 다음 단계에서 JS 전환 + 모듈 분리 예정.

---

*보고서 누락 원인: 지시서에 산출물 경로(REPORT) 미명시. 향후 지시서 발행 시 보고서 경로 필수 포함.*
