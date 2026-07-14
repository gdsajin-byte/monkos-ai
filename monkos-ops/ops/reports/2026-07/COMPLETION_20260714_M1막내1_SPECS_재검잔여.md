---
type: completion
date: 2026-07-14
device: M1
agent: 막내1
status: 완료
portfolio: PF_SPECS
parent_order: ORDER_20260714_M1민아_막내1_SPECS_재검잔여_headHeightMin.md
---

# 재검 잔여 — us-visa headHeightMin 실반영

**[2026-07-14 16:18 KST]** M1/막내1 → 작가님, M1/민아

## 필수 1건 ✅ headHeightMin 22→25

- 원인: 보완 1 커밋(e3062029)에서 headHeightMin: 25를 새 위치(line 2603)에 추가했으나 원래 위치(line 2720)의 22가 잔존 → JSON 중복 키, 파서가 마지막 값 22 채택
- 처리: line 2720 `22→25` 수정 + line 2603 중복 삭제
- 확인: `JSON.parse` 후 `data['us-visa'].headHeightMin === 25` ✅

```diff
- "headHeightMin": 22,
+ "headHeightMin": 25,
  "headHeightMax": 35,
```

## 비차단 권고 ✅ 출처 필드 일관성 11건

`official_source_url.source_url` 빈값 → 자기 값 복사 (cz/hu/ie/is/pl/sk 계열 passport/visa 11파일)

## 기록 정합

기존 COMPLETION(게이트보완) §보완1에 정오 각주 어펜드 완료 (append-only 원칙 준수, 원문 미수정)
