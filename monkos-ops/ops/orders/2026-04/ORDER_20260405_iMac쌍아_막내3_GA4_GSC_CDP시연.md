---
type: order
from: iMac/쌍아
to: iMac/막내3
date: 2026-04-05
subject: GA4 + GSC를 CDP PageProfiler로 실전 시연 — 작가님 실시간 체크
status: 대기
priority: high
pf: PF_CDP
---

[2026-04-05 14:40 KST] iMac/쌍아 → iMac/막내3

# GA4 + GSC CDP 시연 — 작가님이 눈으로 확인

## 배경

PageProfiler를 방금 구현했다. 이제 실전에 태운다.
Google Analytics 4와 Google Search Console에 CDP로 접속해서
작가님 눈앞에서 데이터를 뽑아 보여준다.

**작가님이 실시간으로 보고 있다. 매 단계 스크린샷을 찍고 결과를 보고하라.**

## 사전 조건

- CDP 포트 9222에 디버그 크롬이 가동 중 (작가님 로그인 세션)
- 작가님이 이미 GA4/GSC에 로그인된 상태 (gdsajin@gmail.com)
- cdp_utils.py에 PageProfiler가 탑재되어 있음

## 시연 시나리오

### 1단계: GA4 접속 + 프로파일링

```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP

async with CDP(port=9222) as cdp:
    # GA4 접속
    await cdp.navigate("https://analytics.google.com")
    await cdp.wait(3)  # SPA 로드 대기

    # 스크린샷 — 현재 화면
    await cdp.screenshot("/tmp/ga4_1_landing.png")

    # PageProfiler로 페이지 자동 분석
    profile = await cdp.profiler.profile()
    cdp.profiler.list_actions(profile)

    # 프로파일 결과 보고 — 어떤 버튼/링크가 잡혔는지
```

### 2단계: GA4 네비게이션 — smart_click으로 메뉴 이동

```python
    # 보고서 등 주요 메뉴 클릭 시도
    await cdp.click_smart("보고서")  # 또는 "Reports"
    await cdp.wait(2)
    await cdp.screenshot("/tmp/ga4_2_reports.png")

    # 실시간 리포트 접근 시도
    await cdp.click_smart("실시간")  # 또는 "Realtime"
    await cdp.wait(2)
    await cdp.screenshot("/tmp/ga4_3_realtime.png")
```

### 3단계: GA4 데이터 추출

```python
    # 화면에 보이는 데이터를 텍스트로 추출
    text = await cdp.text()
    # 또는 특정 영역의 데이터를 JS로 추출
    data = await cdp.evaluate("document.querySelector('[data-guidedhelpid]')?.textContent")
```

### 4단계: GSC 접속 + 프로파일링

```python
    # GSC 이동
    await cdp.navigate("https://search.google.com/search-console")
    await cdp.wait(3)
    await cdp.screenshot("/tmp/gsc_1_landing.png")

    # 프로파일링
    profile = await cdp.profiler.profile()
    cdp.profiler.list_actions(profile)
```

### 5단계: GSC 데이터 — 검색 쿼리/클릭수

```python
    # 실적 메뉴 클릭
    await cdp.click_smart("실적")  # 또는 "Performance"
    await cdp.wait(3)
    await cdp.screenshot("/tmp/gsc_2_performance.png")

    # 데이터 추출
    text = await cdp.text()
```

### 6단계: 성능 비교 보고

- 각 단계별 소요 시간 측정 (프로파일링, 클릭, 로드)
- smart_click 성공/실패 기록
- SPA 네비게이션 문제 발생 여부

## 산출물

1. 스크린샷 5장 이상 (`/tmp/ga4_*.png`, `/tmp/gsc_*.png`)
2. 프로파일 결과 (어떤 요소가 잡혔는지)
3. 추출된 데이터 샘플
4. 성능 측정 결과
5. 문제 발생 시 상세 에러

## ⚠️ 준수 조항

- **읽기 전용** — GA4/GSC 설정 변경 금지. 데이터 조회만
- 헌법 4조 1항: 민감정보 노출 금지
- 포트 9222 사용 (작가님 로그인 세션 활용)
- **매 단계마다 작가님에게 스크린샷 + 텍스트로 보고** — 작가님이 실시간 체크 중
