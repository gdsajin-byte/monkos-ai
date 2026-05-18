---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-05
subject: CDP smart_fill 이벤트 발사 내장 — React/Vue/Angular 프레임워크 호환
status: 대기
priority: critical
pf: PF_CDP
---

[2026-04-05 16:34 KST] iMac/쌍아 → iMac/막내1

# CDP smart_fill 이벤트 발사 내장 + 프레임워크 호환

## 1. 문제

smart_fill로 value를 넣어도 React/Vue/Angular가 감지 못해 화면에 반영 안 됨.
value 직접 변경은 프레임워크의 state 업데이트를 트리거하지 않는다.

## 2. 작업

### A. 리서치 — 프레임워크별 state 트리거 방식

각 프레임워크가 input 변경을 감지하는 메커니즘 조사:

- **React**: React 16+ synthetic events. `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`으로 네이티브 setter 호출 후 `input` + `change` 이벤트 dispatch
- **Vue**: v-model은 `input` 이벤트 리스닝. `dispatchEvent(new Event('input', {bubbles: true}))`
- **Angular**: `ngModel`은 `input` 이벤트. `(change)` 바인딩은 `change` 이벤트
- **바닐라 JS**: `input` + `change` 이벤트
- **jQuery**: `.trigger('change')` 또는 네이티브 이벤트

### B. smart_fill 수정 — cdp_utils.py

`PageProfiler.smart_fill()` 내부에 프레임워크 감지 + 이벤트 발사를 내장:

```python
async def smart_fill(self, name_or_selector: str, value: str) -> bool:
    # 1. 프로파일에서 input 찾기
    # 2. value 설정 (네이티브 setter 사용)
    # 3. 프레임워크 감지 → 적절한 이벤트 발사
    # 4. 화면 반영 확인
```

이벤트 발사 JS (범용 — React/Vue/Angular 전부 커버):
```javascript
(selector, value) => {
    const el = document.querySelector(selector);
    // React 네이티브 setter
    const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    // 이벤트 발사 (React input + Vue input + Angular change + 바닐라)
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
}
```

### C. 테스트

- monkos.ai 어드민 (Toast UI 기반) — 제목, 카테고리, 태그 폼 입력
- GA4 (Angular/Mat) — 검색 필드
- 아무 React 사이트 — 입력 필드 반영 확인

## 3. 산출물

- `scripts/tools/cdp_utils.py` — smart_fill 수정
- 테스트 결과 보고 (사이트별 성공/실패)

## 4. ⚠️ 준수 조항

- 기존 CDP/PageProfiler API 삭제 금지 — smart_fill 내부 로직만 수정
- 외부 의존성 추가 금지
- 테스트 시 실제 데이터 저장/발행 금지 (입력만, submit 금지)
