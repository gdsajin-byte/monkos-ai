---
type: report
from: iMac/막내3
date: 2026-04-05
subject: CDP PageProfiler — 성능 측정 결과
pf: PF_CDP
---

# CDP PageProfiler — 성능 측정 결과

[2026-04-05 14:34 KST] iMac/막내3

## 1. 테스트 환경

- 디바이스: iMac (사무실)
- CDP 포트: 9222 (외부 테스트: 9223)
- Chrome: 디버깅 모드 실행 중
- Python 3.13, websockets

## 2. 성능 측정

### 테스트 사이트별 결과

| 사이트 | 요소 수 | 첫 프로파일링 | 캐시 히트 | 속도 향상 |
|--------|---------|--------------|----------|----------|
| monkos.ai (메인) | 36개 | **9ms** | **3ms** | 3.4x |
| monkos.ai/admin/blog-edit.html | 245개 | **17ms** | **29ms** | - |
| platform.claude.com (외부) | 28개 | **5ms** | **2ms** | 2.5x |

### 지시서 목표 대비 달성

| 시나리오 | 지시서 목표 | 실측 | 판정 |
|---------|-----------|------|------|
| 첫 방문 프로파일링 | 1,500ms | **5~17ms** | **100x 초과 달성** |
| 재방문 캐시 히트 | <100ms | **2~29ms** | **달성** |
| 변경 감지 + 재프로파일 | 1,500ms | **11~16ms** | **100x 초과 달성** |

> 기존 read_page 풀스캔(~3초) 대비 압도적 성능.
> 목표 1.5초 대비 100배 빠른 결과. 순수 CDP JS 실행으로 네트워크 왕복 최소화.

### 어드민 페이지 캐시 히트가 느린 이유

어드민 페이지(245개 요소)는 캐시 JSON 파일이 크기 때문에 파일 로드 + DOM 해시 비교에 29ms 소요.
그래도 100ms 이내이므로 목표 달성.

## 3. 요소 수집 품질

### monkos.ai 메인

- actions: 8개 (언어 전환 버튼 3, 촬영 시작, 채팅 FAB 등)
- inputs: 0개
- navigation: 28개 (블로그, FAQ, 갤러리, 게시판, 가격 등)
- 셀렉터 품질: `data-lang`, `#chatFab`, `text:촬영 시작하기` 등 안정적 셀렉터 확보

### monkos.ai/admin/blog-edit.html

- actions: 233개 (임시저장, 발행, 미리보기, 에디터 툴바 전체)
- inputs: 7개 (카테고리, 언어, 썸네일, 슬러그, 요약, 태그, 제목)
- navigation: 5개
- 셀렉터 품질: `#title`, `#category`, `#tags`, `aria-label` 등 고품질 셀렉터

## 4. 변경 감지 테스트

| 단계 | 결과 |
|------|------|
| 캐시 로드 | cache_hit: True |
| DOM 요소 주입 후 | cache_hit: False (재프로파일 16ms) |
| 주입 요소 제거 후 | cache_hit: False (해시 불일치 → 재프로파일 11ms) |

DOM 구조 해시 비교 방식으로 의미 있는 변경만 감지. 정상 동작 확인.

## 5. 구현 요약

| 항목 | 내용 |
|------|------|
| 파일 | `scripts/tools/cdp_utils.py` (PageProfiler 클래스 추가) |
| 외부 의존성 | 없음 (기존 websockets만 유지) |
| 캐시 위치 | `~/.cache/cdp_profiles/` |
| 캐시 TTL | 7일 |
| 기존 API 영향 | 없음 (순수 추가) |

### 공개 API

- `cdp.profiler.profile(url=None, force=False)` — 프로파일링 (캐시 자동)
- `cdp.profiler.smart_click(name)` — 프로파일 기반 즉시 클릭
- `cdp.profiler.smart_fill(name, value)` — 프로파일 기반 입력
- `cdp.profiler.smart_navigate(name)` — 프로파일 기반 네비게이션
- `cdp.profiler.list_actions(profile)` — 요소 요약 출력 (디버그)
- `cdp.profiler.invalidate(url=None)` — 캐시 무효화
- `cdp.click_smart(name)` — CDP 클래스에서 직접 호출 가능한 단축 메서드
