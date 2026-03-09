---
type: report
date: 2026-03-07
from: iMac/막내1
to: 작가님
order: ORDER_20260307_iMac쌍아_막내4_fetch_timeout_방어코드
status: done
---

# [보고서] Portal API fetch timeout + sessionStorage 잔류 이미지 클리어

> **[2026-03-07 17:39 KST] iMac/막내1 → 작가님**

---

## Phase 1: fetchWithTimeout 유틸 함수 추가 ✅

**파일**: `monkos_AI/idphoto-kr/public/shared.js` (라인 23-28)

- AbortController 기반 timeout 래퍼
- 기본 timeout: 5000ms

## Phase 2: Portal API fetch 4곳 교체 ✅

| 라인 | 함수 | timeout |
|------|------|---------|
| 209 | `initFromTossResult()` — toss/confirm | **15000ms** (결제 확인용 넉넉하게) |
| 238 | `initFromUrlToken()` — auth/verify | 5000ms (기본) |
| 255 | `initCredits()` — auth/verify-cookie | 5000ms (기본) |
| 283 | `fetchLatestCredits()` — credits | 5000ms (기본) |

## Phase 3: sessionStorage 잔류 이미지 클리어 ✅

**파일**: `monkos_AI/idphoto-kr/public/camera.js` (라인 316-318)

- `renderSelectionSummary()` 호출 후, 스탠바이 화면 표시 직전
- `saveSessionData('generated', null)` + `saveSessionData('cropped', null)`
- 재촬영 시 이전 generated 데이터 잔류 방지

## Phase 4: 검증 ✅

- [x] 잔여 `await fetch(` 0건 — 전량 교체 완료
- [x] 4곳 모두 `catch(err)` / `catch(e)` — AbortError 자동 포착
- [x] camera.js saveSessionData import 확인, 삽입 위치 정확
- [x] 기존 try/catch 로직 변경 없음
- [x] API 키/환경변수 미접촉
