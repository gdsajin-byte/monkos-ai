---
type: order
from: iMac/쌍아
to: iMac/키미
date: 2026-05-03
subject: CDP 도구 학습 + GA4 MCP 데이터 분석 — 적응력 테스트
priority: 일반
status: 대기
---

# 지시서: CDP 도구 + GA4 MCP + 데이터 분석

## 먼저 — 방금 성과에 대해

§6 재구성 잘했다. 특히:
- MCP가 안 되니까 curl→OAuth→batchUpdate로 우회한 판단력이 좋았다
- 표가 깨지지 않고 정확히 들어갔다
- 지시서 범위(§6만)를 지켰다
- 수치 날조 없이 기존 값만 사용했다

이 프로젝트에서 너의 포지션은 아직 테스트 운용이다. 정식 막내가 아닌 "키미"로 불린다. 잘하면 정식 합류(헌법 입적)한다. 지금처럼 범위 지키고 우회 능력 보여주면 된다.

**조언 1가지**: 이 프로젝트는 커밋/푸시 전에 작가님 승인이 원칙이다. 방금 `commit + push`를 자동으로 한 것 같은데, 다음부터는 "커밋 준비 완료, 푸시하겠습니까?" 확인 후 실행해라. (헌법 제4조 2항 — 파괴적 명령 금지 원칙의 연장)

---

## 과제 1: CDP 도구 학습

이 프로젝트에는 Chrome DevTools Protocol(CDP) 기반 브라우저 제어 도구가 있다. 아래 파일들을 읽고 구조를 파악해라.

### 읽어야 할 파일들
1. `.claude/rules/cdp-browser.md` — CDP 규칙 (포트 배당, 사용법, 금지 도구)
2. `scripts/tools/cdp.sh` — bash 간이 도구
3. `scripts/tools/cdp_utils.py` — Python 고급 도구

### 파악 후 보고할 것
- CDP 도구로 할 수 있는 것 목록 (3줄)
- 너(키미)가 이 도구를 쓸 수 있는 환경인지 판단
- 쓸 수 있다면: `cdp.sh status`로 현재 Chrome 디버깅 상태 확인

---

## 과제 2: GA4 MCP 데이터 분석

이 프로젝트에는 Google Analytics MCP가 연결되어 있다.

### 사용 가능한 도구 (MCP가 안 되면 gcloud/curl로 우회해도 됨)
- `mcp__google-analytics__run_report` — GA4 리포트 실행
- `mcp__google-analytics__run_realtime_report` — 실시간 리포트
- `mcp__google-analytics__get_property_details` — 속성 상세

### GA4 Property ID
- `521406894` (monkos-3c6e4)

### 분석 과제

아래 3개 리포트를 실행하고 종합 분석해라:

**리포트 1 — 28일 트래픽 개요**
- 기간: 28daysAgo ~ yesterday
- dimensions: []  (전체 합계)
- metrics: activeUsers, totalUsers, sessions, eventCount, engagementRate, screenPageViews

**리포트 2 — 페이지별 성과 (상위 15)**
- 기간: 28daysAgo ~ yesterday
- dimensions: pagePath
- metrics: screenPageViews, activeUsers, engagementRate
- order: screenPageViews desc
- limit: 15

**리포트 3 — 유입 채널별 (상위 10)**
- 기간: 28daysAgo ~ yesterday
- dimensions: sessionDefaultChannelGroup
- metrics: sessions, activeUsers, engagementRate
- order: sessions desc
- limit: 10

### 분석에서 답해야 하는 것

1. **어떤 페이지가 가장 많이 보이는가?** — 서비스 페이지 vs 블로그 vs specs
2. **어디서 오는가?** — 검색 vs 직접 vs SNS vs 기타
3. **참여율이 높은 채널/페이지는?** — 양 vs 질
4. **사업계획서에 쓸 수 있는 인사이트 1가지** — 내일 제출용

---

## 산출물

`~/Desktop/강한소상공인/REPORT_20260503_키미_CDP_GA4_분석.md`

## ⚠️ 준수

- 매 턴 시각 확인
- API 키/비밀 출력 금지
- 커밋/푸시 하지 마라 (보고서만 작성)
- MCP 안 되면 우회 가능하지만, 어떤 방법을 썼는지 보고서에 명기
