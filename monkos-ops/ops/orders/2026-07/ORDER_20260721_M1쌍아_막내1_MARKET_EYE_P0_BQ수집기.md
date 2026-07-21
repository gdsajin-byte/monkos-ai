---
type: order
date: 2026-07-21
device: M1
agent: 쌍아
target: 막내1
portfolio: PF_MARKET_EYE
status: 발행
---

# 지시서 — MARKET_EYE P0: BQ 데이터셋 생성 + 수집기 크론

**[2026-07-21 14:47 KST]** M1/쌍아 → 막내1

> 목표: 시장 데이터가 매일 자동으로 BQ에 쌓이는 체계 구축. 오늘부터 시계열 적립 시작.
> 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260721_MARKET_EYE_통합설계.md` §3~§4
> 검증 호출 패턴: `monkos-ops/tech/specs/market_eye/SPEC_market_eye_검증호출패턴_20260721.md`

---

## ⚠️ 준수 조항

- **원본 포팅, 재해석 금지** (ch7 + feedback): 검증 호출 패턴 스펙의 API 호출 코드를 그대로 이식. 자기 해석으로 재구현 금지.
- **SearchAd hint 5개 상한**: 키워드 6개↑ 시 5개 배치 분할 필수 (seo_collectors.py 기구현 참조).
- **빈 응답 경고**: 수집 결과 0행 시 텔레그램 경고 발송. 무음 실패 금지.
- **시크릿 비접촉**: API 키는 SM에서 런타임 주입. 코드에 값 하드코딩 금지.
- **append-only**: BQ 테이블 기존 행 수정/삭제 금지. INSERT만.

---

## §1 BQ 데이터셋 생성

```bash
bq mk --dataset --location=asia-northeast3 monkos:market_eye
```

### 테이블 6종 생성

설계서 §3의 스키마 그대로. 전 테이블 공통: `tenant STRING DEFAULT 'monkos'`, `date DATE` 파티션.

1. `gsc_daily` — §3-1
2. `ga4_daily` — §3-2
3. `ads_keyword_monthly` — §3-3
4. `naver_searchad_monthly` — §3-5
5. `trends_monthly` — §3-6
6. `cr_access_log` — §3-4 (테이블 생성만, 싱크 설정은 §4에서)

### 뷰 2종 생성

7. `funnel_daily` — §3-7 SQL
8. `gate_metrics` — §3-8 SQL

---

## §2 CR 로그 BQ 싱크

GCP 콘솔에서 설정 (코드 불필요):

1. Cloud Logging → 로그 라우터 → 싱크 생성
2. 필터: `resource.type="cloud_run_revision" resource.labels.service_name="monkos-portal"`
3. 대상: BigQuery 데이터셋 `market_eye.cr_access_log`

> 이 작업은 GCP 콘솔 권한 필요. 막내가 직접 불가하면 작가님에게 요청.

---

## §3 수집기 코드

### 디렉토리

```
scripts/collectors/
  ├─ _loader.js          BQ 공통 로더
  ├─ _notify.js          텔레그램 경고
  ├─ collect_gsc.js      GSC 일배치
  ├─ collect_ga4.js      GA4 일배치
  ├─ collect_keywords.js  Ads 플래너 + 네이버 SearchAd 월배치
  └─ collect_trends.js   Google Trends + 네이버 DataLab 월배치
```

### _loader.js 요구사항

- `@google-cloud/bigquery` 사용
- 함수: `insertRows(table, rows)` — 스키마 검증 + insertAll
- 실패 시 _notify.js 호출 (텔레그램)
- 빈 rows 시 경고 로그 + 텔레그램

### collect_gsc.js

- GSC Search Analytics API 호출 (3일 전 데이터)
- 차원: page, query, country, device
- 지표: clicks, impressions, position
- `_loader.insertRows('gsc_daily', rows)`
- 기존 `gsc_mcp.sh` / `seo_collectors.py fetch_gsc_url_inspection` 참조하되, Search Analytics (searchanalytics/query)는 별도 구현

### collect_ga4.js

- GA4 Data API 호출 (전일 데이터)
- 차원: sessionDefaultChannelGrouping, sourceMedium
- 지표: sessions, totalUsers, newUsers, bounceRate, averageSessionDuration
- 전환 이벤트: free_generation_complete, sign_up, purchase
- 기존 `seo_collectors.py fetch_ga4_extended` 코드 원본 포팅

### collect_keywords.js

- Google Ads 키워드 플래너: 설계서 §5-1 시장 서열 7개국 키워드셋 조회
- 네이버 SearchAd: KR 키워드셋 조회
- 기존 `ads.sh keyword_ideas` + `seo_collectors.py fetch_naver_searchad` 원본 포팅
- 키워드셋 정본: 별도 JSON 파일 (`scripts/collectors/keyword_sets.json`)

### collect_trends.js

- pytrends: 7개국 우산 키워드 월간 interest 조회
- 네이버 DataLab: KR 키워드 주간 ratio 조회
- 기존 `seo_collectors.py fetch_naver_datalab` + 민아 pytrends 호출 원본 포팅

---

## §4 크론 설정

기존 `.github/workflows/daily-briefing.yml` 편승:

```yaml
# 일배치 (매일 09:00 KST = 00:00 UTC)
- name: Collect GSC
  run: node scripts/collectors/collect_gsc.js
- name: Collect GA4
  run: node scripts/collectors/collect_ga4.js

# 월배치 (매월 1일)
- name: Collect Keywords (monthly)
  if: github.event.schedule == '0 0 1 * *' || ...
  run: node scripts/collectors/collect_keywords.js
- name: Collect Trends (monthly)
  if: ...
  run: node scripts/collectors/collect_trends.js
```

> 크론 구체 편성은 기존 yml 구조에 맞춰 조정. 핵심: 일배치 2종(GSC+GA4) + 월배치 2종(Keywords+Trends).

---

## §5 검증

1. 각 수집기 수동 실행 → BQ 행 삽입 확인
2. 빈 응답 시 텔레그램 경고 도착 확인
3. `funnel_daily` 뷰 쿼리 실행 → 데이터 반환 확인
4. `gate_metrics` 뷰 쿼리 실행 → 데이터 반환 확인
5. 스모크 5종은 **민아 게이트**

---

## §6 완료 기준

- [ ] BQ `market_eye` 데이터셋 + 테이블 6종 + 뷰 2종 생성
- [ ] 수집기 4종 수동 실행 성공 (각각 BQ 행 확인)
- [ ] 크론 yml 편성
- [ ] 빈 응답 텔레그램 경고 작동
- [ ] COMPLETION 보고서 작성
- [ ] PF_MARKET_EYE 히스토리 1행 어펜드
