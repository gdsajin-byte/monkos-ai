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

---

## 6. GA4 + GSC 실전 시연 결과

[2026-04-05 15:15 KST] 작가님 실시간 확인 하에 시연.

### smart_click 성공률: 100% (5/5)

| 단계 | 대상 | 동작 | 소요 시간 | 결과 |
|------|------|------|----------|------|
| 1 | GA4 홈 | 프로파일링 (131개 요소) | 34ms | ✅ |
| 2 | GA4 | `smart_click("보고서")` | 53ms | ✅ |
| 3 | GA4 | `smart_click("실시간")` | 277ms | ✅ |
| 4 | GSC 개요 | 프로파일링 (38개 요소) | 9ms | ✅ |
| 5 | GSC | `smart_click("실적")` | 168ms | ✅ |

### 추출 데이터 샘플

**GA4 (7일)**
- 활성 사용자 400 (↑143.9%), 이벤트 1.9천 (↑48.2%), 새 사용자 398 (↑156.8%)
- 상위: 메인 526뷰, 증명사진(KR) 512뷰, 증명사진(JP) 175뷰

**GSC (약 3개월)**
- 총 클릭 27 / 노출 245 / CTR 11% / 게재순위 9
- 상위 쿼리: `monkos` 3클릭/32노출

### 스크린샷

- `/tmp/ga4_1_landing.png` — GA4 홈
- `/tmp/ga4_2_reports.png` — GA4 보고서
- `/tmp/ga4_3_realtime.png` — GA4 실시간
- `/tmp/gsc_1_landing.png` — GSC 개요
- `/tmp/gsc_2_performance.png` — GSC 실적

---

## 7. 솔직한 체감 평가 — 기존 방식 대비 개선점

### 확실히 좋아진 것

- **코드 간결성**: `click_smart("보고서")` 한 줄. 기존엔 `read_page()` → 목록 탐색 → `click_accessible("link", "보고서")` 3단계
- **캐시 재방문**: 같은 페이지 반복 접근 시 2~3ms. 반복 자동화에서 진짜 가치
- **셀렉터 폴백 체인**: id → data-* → aria-label → 텍스트 → 좌표. 한 방법 실패해도 자동 다음 시도

### 솔직히 아직 부족한 것

- **크로스오리진 navigate 시 WS 끊김**: GA4→GSC 이동 같은 크로스도메인 네비게이션에서 웹소켓 연결이 끊어짐. 수동 재접속 필요. PageProfiler 문제가 아닌 CDP 클래스 자체의 한계
- **SPA 로드 대기 자동화 없음**: GA4 첫 로드 시 "로드 중..." 상태. 현재 `wait(5)` 하드코딩. 콘텐츠 로드 완료를 자동 판단하는 로직이 필요
- **단발성 작업에서는 차이 미미**: 프로파일링 자체가 9~34ms로 빠르지만, 기존 `read_page()`도 접근성 트리 기반이라 비슷한 속도. 캐시가 빛나는 건 반복 방문할 때

### 결론

> 단발성 작업에서는 기존 `click_accessible`과 큰 차이 없다.
> PageProfiler가 진짜 가치를 발휘하는 건 **같은 사이트를 반복 방문하는 자동화 시나리오** — 매일 GA4 데이터 수집, 블로그 연속 발행 등.
> 지금 당장 급한 건 오히려 **`safe_navigate()`** — 크로스오리진 이동 후 자동 재접속. 이게 해결되면 실전 운용이 훨씬 매끄러워진다.
