---
type: proposal
date: 2026-07-20
device: iMac
agent: 민아
status: 제출
---

# PROPOSAL — 데이터 수집 도구화: MARKET_EYE 스키마 테이블 설계 초안

**[2026-07-20 21:05 KST]** iMac/민아 → 작가님, iMac/쌍아

> 발단: 작가님(7/20 21시, 모바일) — "데이터 수집툴을 도구화. 스키마 테이블 세팅 필요."
> 성격: 쌍아 설계서의 입력물(요구사항+스키마 초안). 구현 설계·지시서는 쌍아 소관.
> 현행 실측: BQ `monkos_tracking`(events 일파티션·identity_map) 가동 중 — 자사 행동 데이터는 이미 적재됨. **공백 = 시장·검색 데이터가 조회만 되고 쌓이지 않는 것** (GSC·Ads·데이터랩은 MCP/ads.sh로 그때그때 조회 → 휘발).

## 1. 원칙 4개

1. **자사 행동(tracking) ↔ 시장 관측(market_eye) 데이터셋 분리** — 기존 `monkos_tracking`은 그대로, 신규 BQ 데이터셋 `market_eye` 신설. 성격이 다른 데이터의 정본 분리.
2. **tenant 필드 선탑재** — 전 테이블 공통키에 `tenant`(기본 'monkos'). S2 테넌트 config·B2B 납품의 스키마 준비를 지금 공짜로 심는다 (의상 커머스 벤더 필드 선탑재와 동일 패턴).
3. **append-only 일 파티션** — 수집은 어펜드만, 재작성 금지. 판정·보정은 뷰 층에서.
4. **수집기 = 도구 3요건 준수** — references.md 도구 맵 등재 + 스모크 + 실패 가시화(수집 0행 시 경고, 무음 결번 금지).

## 2. 테이블 초안 (BQ `market_eye`, 7종 + 뷰 2종)

| # | 테이블 | grain (파티션=date) | 핵심 컬럼 | 출처/주기 |
|---|--------|--------------------|----------|----------|
| 1 | `gsc_daily` | date×page×query | tenant, site, page, query, country, device, clicks, impressions, position | GSC API / 일 1회 (3일 지연分) |
| 2 | `ga4_daily` | date×channel | tenant, channel, source_medium, sessions, users, conv_free, conv_signup, conv_purchase | GA4 API / 일 1회 |
| 3 | `ads_keyword_monthly` | month×keyword×geo_lang | tenant, keyword, lang, geo, monthly_searches, competition, cpc_low, cpc_high | 키워드 플래너(ads.sh) / 월 1회 스냅샷 |
| 4 | `ads_perf_daily` | date×campaign | tenant, campaign, cost, clicks, impressions, conversions, cpa | Ads API / 일 1회 (재점화 시 활성) |
| 5 | `datalab_weekly` | week×keyword_group | tenant, keyword_group, ratio, device, ages | 네이버 데이터랩 / 주 1회 |
| 6 | `serp_snapshot` | date×query | tenant, query, engine, our_position, our_url, top3_domains | 순찰 러너 연계 / 주 2회 (P2 — 러너 설계 후) |
| 7 | `ai_visibility` | date×query×engine | tenant, query, engine, cited(bool), cited_url, competitor_cited | AI 엔진 인용 실측 / 주 1회 (P2 — GEO 지표) |
| V1 | `funnel_daily` (뷰) | date×slug×lang | monkos_tracking.events 집계: visits→free→t1→t2 | 뷰 — 신규 적재 없음 |
| V2 | `gate_metrics` (뷰) | gate_id×metric | 4주 게이트 판정치 자동 산출 (specs→가입 전환율, T0→T1율, 동남아 전환, 재점화 CPA) | 뷰 — 1·2·4·V1 조합 |

## 3. 이 스키마가 여는 것

- **4주 게이트 자동 판정**: V2 뷰가 Day 0 "모르는 것 4개"를 상시 산출 — 게이트 도래 시 회의가 아니라 쿼리 1개.
- **CITADEL 대시보드·Looker Studio(S3) 단일 소스**: 대시보드 바인딩·B2B 납품 대시보드가 같은 테이블을 읽음 — 이중 작업 소멸.
- **MD 결정 레코드(S1) 근거 자동화**: observation 필드가 테이블 쿼리 결과를 인용 — 해석 이력에 재현 가능한 출처.
- **주간 3원 교차(7/19 애즈 전략 제안서)의 물리 기반**: GSC×Ads×데이터랩 조인이 쿼리로 가능해짐.
- **B2B 온보딩 = tenant 값 1개 추가** — 수집기 코드 변경 없이 고객 도메인 적재.

## 4. 수집기 구현 방향 (쌍아 설계 대상)

- 위치: `scripts/collectors/` (인프라 도구 분류) — 소스별 1파일(collect_gsc.js 등), 공통 로더 1개.
- 스케줄: 기존 데일리 브리핑 크론에 편승(신규 크론 최소화). 실패 시 텔레그램 경고(기존 알림 인프라).
- 비용: BQ 적재량 기준 월 수백 원대 예상(전량 무료 티어 가능성 높음 — 쌍아 산정 확인 필요).
- 우선순위: **P0 = 1·2·3번 테이블+V1·V2 뷰** (게이트 판정 최소 세트) → P1 = 4·5 (재점화·네이버) → P2 = 6·7 (러너·GEO 연계).

## 5. 유보

- 테이블·컬럼 상세는 초안 — 쌍아 설계서에서 확정. BQ 스키마는 후행 변경 비용이 크므로 설계 단계에서 컬럼 리뷰 1회 필수.
- serp_snapshot·ai_visibility는 수집 방법 자체가 미확정(순찰 러너 설계 의존) — P2 유보.
- 데이터랩 API 쿼터·약관 확인 선행 (수집 자동화 허용 범위).
