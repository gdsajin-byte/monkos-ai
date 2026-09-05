---
type: completion
date: 2026-09-05
device: iMac
agent: 민아
subject: "CDP 사이트 기억 자산 재가동 — PageProfiler 시간 TTL 폐기·자가 치유(Stagehand 모델) + cdp-browser 착수 전 선행 로딩"
portfolio: PF_CDP
related: PF_KKU(네이버 블로그), PF_SPREAD
status: 완료 (2/3) — Aside PoC는 다운로드 승인 대기
---

**[2026-09-05 09:06 KST]** iMac/민아 → 작가님

> [예외: 경로③] 작가님 09-05 "직접 실행하고 사후 처리해". 규정 계층(`.claude/commands/cdp-browser.md`) 수정 포함 — 쌍아 소관, 작가님 직접 지시로 민아 실행, 사후 추인·개정 청구 대상.

## ✅ 실행

| # | 항목 | 변경 | 검증 |
|---|---|---|---|
| 1 | **PageProfiler 시간 TTL 폐기** | `scripts/tools/cdp_utils.py` — `CACHE_TTL=None`, `_load_cache`가 시간으로 버리지 않고 `_age_days` 표시만. 무효화 = DOM 해시 변경 감지(`_detect_change`, 기존)만 | 실측: monkos.ai 1차 force miss(actions 4·nav 19) → 2차 hit → **`_cached_at`을 30일 전으로 조작해도 hit**(구코드면 miss) |
| 2 | **자가 치유 (Stagehand 캐시 모델)** | `smart_click` depth=1에서 캐시 요소는 있는데 셀렉터 재생이 전부 실패하면 강제 재프로파일 1회 → 재탐색 | 실측: 캐시의 nav 요소 셀렉터를 `#__broken__`으로 파괴·폴백 제거 → `smart_click('MONKOS AI')` **True**, 캐시 파일에서 깨진 셀렉터 0건(재프로파일 반영) |
| 3 | **cdp-browser 착수 전 선행 로딩** | `.claude/commands/cdp-browser.md` "사이트 기억 자산 선행 로딩" 섹션 신설 — GP·CASE grep, 어댑터·프로파일 목록, "예외 시 참조"→"착수 전 읽기", 네이버 부재 명시 | 문서 |

## ⏳ 미실행
- **Aside PoC**(네이버 스마트에디터 서식 보존 1건): Homebrew cask `aside` 1.0.825.1, `https://releases.aside.com/dev-updater/Aside-1.0.825.1.dmg` **332MB** — 파일 다운로드는 작가님 명시 승인 필요. 승인 시 설치 → 꾸 본인 로그인 → 글 1편 → 서식·CASE 기록.
- 네이버 어댑터·GP는 Aside PoC 결과 후.

## 💡 사후
- PF_CDP 히스토리 2행 / 세션 로그 [예외] / 쌍아 추인: 규정 계층 수정 + Phase 3(Stagehand 캐시 모델) 재개를 코드로 선집행
- PageProfiler 디스크 캐시 26개는 이제 만료되지 않음 — DOM이 바뀐 사이트만 재프로파일

## 📁 산출물
`scripts/tools/cdp_utils.py` · `.claude/commands/cdp-browser.md` · 본 파일 · PF_CDP 2행
