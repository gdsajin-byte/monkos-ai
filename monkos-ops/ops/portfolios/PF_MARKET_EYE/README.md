---
type: portfolio
id: PF_MARKET_EYE
name: MARKET_EYE
subject: 시장 데이터 수집·적재·조회 체계 — 모든 PF의 판단 근거 기반층
created: 2026-07-21
owner: 작가님
leads: 쌍아(설계), 민아(분석·수집기)
status: active
---

# PF_MARKET_EYE — 시장 데이터 수집·적재·조회 체계

> "이 상품 수요 어때?" → 30초 안에 숫자가 나오는 체계.
> 모든 PF(CITADEL, SPECS, INFRA 등)의 의사결정에 데이터 근거를 제공하는 기반층.

---

## 1. 배경

- 7/14: SEO 인프라 전수 실측 — 데이터 수집 도구 커버리지 ~50%
- 7/15: seo_collectors.py 도구 분리 (daily_briefing.py에서)
- 7/19: Google Ads API 연동 (키워드 플래너 실작동)
- 7/20: 민아 MARKET_EYE 수집 스키마 제안서 제출
- 7/21: 수집기 스모크 5/6 복구 + 실전 검증 (13개국 시장 실측 즉시 응답)

**전환점**: 7/21 세션에서 작가님 질문 3연속("먹히는 국가?", "네이버 기준인가?", "즉시 응답 가능한 체계인가?") → 전부 기구축 도구로 분 단위 근거 제시. "묻는 즉시 근거가 나오는 시스템(L1)" 실전 검증 완료. 다음 단계 = "근거가 매일 자동으로 쌓이는 시스템(L3)".

---

## 2. 현재 상태

### 2-1. 가동 중 수집 채널 (L1: 수동 조회)

| # | 채널 | 도구 | 상태 |
|---|------|------|------|
| 1 | Google Ads 키워드 플래너 | `ads.sh keywords` | ✅ 다국어·다지역 즉시 조회 |
| 2 | 네이버 SearchAd | `seo_collect.sh naver-searchad` | ✅ 5개 배치 분할, 공백 인코딩 수정 |
| 3 | 네이버 DataLab | `seo_collect.sh naver-datalab` | ✅ 트렌드 비교 |
| 4 | Bing WMT | `seo_collect.sh bing` | ✅ 쿼리·링크 |
| 5 | GA4 확장 | `seo_collect.sh ga4-device` | ✅ 디바이스별 세션·이탈률 |
| 6 | GSC URL Inspection | `seo_collect.sh gsc-inspection` | ✅ 색인 상태·크롤 시간 |
| 7 | GSC MCP | `gsc_mcp.sh` | ✅ 키워드·페이지 성과 |
| 8 | GA4 MCP | `ga4_mcp.sh` | ✅ 실시간 트래픽 |

### 2-2. 미가동 / 보류

| 채널 | 상태 | 비고 |
|------|------|------|
| PageSpeed Insights | 보류 | PSI 전용 API 키 필요. 현 단계 불필요 (CrUX 선행) |
| CR 요청 로그 → BQ 싱크 | 미구축 | P0 — GCP 설정만으로 가능 |
| CrUX API | 미구축 | P1 — 무료, 실사용자 CWV |
| DataForSEO | 미구축 | P1 — SERP+백링크+AI 인용, 종량 |

### 2-3. 핵심 공백 (L3 미달)

- **시계열 적립 0**: 모든 조회가 외부 API 실시간 의존. 우리 장부에 쌓인 데이터 없음.
- **자동 수집 크론 없음**: 수동 호출만 가능.
- **BQ market_eye 데이터셋 미생성**: 스키마 제안서만 존재.

---

## 3. 목표 구조 (L3: 자동 적재)

### 3-1. BQ 데이터셋: `market_eye`

> 민아 제안서 (PROPOSAL_20260720) 기반 + 7/21 교차의견 반영.

| # | 테이블 | 소스 | 주기 | 우선순위 |
|---|--------|------|------|---------|
| 1 | `gsc_daily` | GSC API | 일 1회 | P0 |
| 2 | `ga4_daily` | GA4 API | 일 1회 | P0 |
| 3 | `ads_keyword_monthly` | 키워드 플래너 | 월 1회 | P0 |
| 4 | `cr_access_log` | CR 요청 로그 BQ 싱크 | 실시간 | P0 |
| 5 | `naver_searchad_monthly` | 네이버 SearchAd | 월 1회 | P0 |
| 6 | `ads_perf_daily` | Ads API | 일 1회 | P1 (재점화 시) |
| 7 | `datalab_weekly` | 네이버 DataLab | 주 1회 | P1 |
| 8 | `serp_snapshot` | DataForSEO | 주 2회 | P2 |
| 9 | `ai_visibility` | DataForSEO AI | 주 1회 | P2 |
| V1 | `funnel_daily` (뷰) | monkos_tracking | — | P0 |
| V2 | `gate_metrics` (뷰) | 1+2+6+V1 | — | P0 |

### 3-2. 원칙 4개 (민아 제안서)

1. **자사 행동(tracking) ↔ 시장 관측(market_eye) 데이터셋 분리**
2. **tenant 필드 선탑재** — B2B 준비
3. **append-only 일 파티션**
4. **수집기 = 도구 3요건 준수** (인지·스모크·실패 가시화)

### 3-3. 수집기 위치

- P0~P1: `scripts/collectors/` — 소스별 1파일, 데일리 크론 편승
- CR 로그: GCP 콘솔 Cloud Logging → BQ 싱크 (코드 불필요)
- 실행 환경: 4060 (아키텍처 전환 Phase 4와 연동)

---

## 4. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 07/14 | M1/쌍아 | **SEO 인프라 전수 실측** — 가동 7/공백 4 식별. 인프라 통합 정비 지시서 발행 | 세션로그 | ✅ |
| 07/14 | M1/막내3 | **자동화 인프라 통합 정비** — 5채널 수집 확장 + MCP 정규화 + 인벤토리 감사 + 스킬 | daily_briefing.py 등 11파일 | ✅ |
| 07/15 | M1/막내1 | **SEO 수집 함수 도구화** — seo_collectors.py 분리 + seo_collect.sh 래퍼 | seo_collectors.py, seo_collect.sh | ✅ |
| 07/16 | iMac/막내2+민아 | **대시보드 전채널 P1** — GSC·네이버·빙·PageSpeed 4 API + 검증 + prod 00498 | seo-dashboard.js | ✅ |
| 07/19 | iMac/쌍아 | **Google Ads API 인프라 구축** — 시크릿 6종 + ads.sh 5커맨드 + 키워드 플래너 실작동 | ads.sh, ads-oauth.sh | ✅ |
| 07/20 | iMac/민아 | **MARKET_EYE 수집 스키마 제안서** — BQ 7테이블+뷰2, 원칙 4개, P0~P2 | [PROPOSAL](../../proposals/PROPOSAL_20260720_민아_MARKET_EYE_수집스키마.md) | ✅ 제출 |
| 07/21 | M1/쌍아 | **수집기 스모크 5/6 복구** — SearchAd 공백 인코딩 + 5개 배치 분할 + GA4/GSC pip install | seo_collectors.py | ✅ |
| 07/21 | M1/민아 | **취업사진 13개국 시장 실측** — Ads 플래너 즉시 조회로 1군(JP·DE·ID·KR) 확정 | [REPORT](../../reports/2026-07/REPORT_20260721_M1민아_취업사진_국가시장_실측.md) | ✅ |
| 07/21 | M1/쌍아+민아 | **PF_MARKET_EYE 신설** — 작가님 지시. 데이터 수집·적재 체계 독립 PF 승격 | 본 README | ✅ |

---

## 5. Phase 로드맵

### Phase 0 — BQ 기반 구축 (P0 테이블)

| 항목 | 상태 |
|------|------|
| BQ `market_eye` 데이터셋 생성 | ⏳ |
| CR 요청 로그 → BQ 싱크 설정 | ⏳ |
| gsc_daily 수집기 + 크론 | ⏳ |
| ga4_daily 수집기 + 크론 | ⏳ |
| ads_keyword_monthly 수집기 | ⏳ |
| naver_searchad_monthly 수집기 | ⏳ |
| funnel_daily 뷰 | ⏳ |
| gate_metrics 뷰 | ⏳ |

### Phase 1 — 확장 (P1 테이블)

| 항목 | 상태 |
|------|------|
| CrUX API 수집기 | ⏳ |
| DataForSEO 파일럿 (SERP + 백링크) | ⏳ |
| datalab_weekly 수집기 | ⏳ |
| ads_perf_daily (재점화 시) | ⏳ |

### Phase 2 — 고도화

| 항목 | 상태 |
|------|------|
| serp_snapshot 수집기 | ⏳ |
| ai_visibility 수집기 | ⏳ |
| Looker Studio 대시보드 바인딩 | ⏳ |
| B2B tenant 멀티 테넌시 실증 | ⏳ |
