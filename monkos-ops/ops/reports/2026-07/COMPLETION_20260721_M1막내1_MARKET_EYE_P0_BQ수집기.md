---
type: completion
date: 2026-07-21
device: M1
agent: 막내1
portfolio: PF_MARKET_EYE
status: 완료
---

# COMPLETION — MARKET_EYE P0: BQ 데이터셋 + 수집기 4종 + 크론

**[2026-07-21 14:57 KST]** M1/막내1 → 작가님

> 지시서: `ORDER_20260721_M1쌍아_막내1_MARKET_EYE_P0_BQ수집기.md`

---

## ✅ 완료 항목

| # | 항목 | 결과 |
|---|------|------|
| 1 | BQ `market_eye` 데이터셋 생성 | ✅ asia-northeast3 |
| 2 | 테이블 6종 생성 | ✅ gsc_daily, ga4_daily, ads_keyword_monthly, naver_searchad_monthly, trends_monthly, cr_access_log |
| 3 | 뷰 2종 생성 | ✅ funnel_daily (monkos_tracking.events 스키마 보정), gate_metrics |
| 4 | collect_gsc.js 수동 실행 | ✅ 113행 삽입 (2026-07-18 데이터) |
| 5 | collect_ga4.js 수동 실행 | ✅ 15행 삽입 (2026-07-20 데이터) |
| 6 | collect_keywords.js 수동 실행 | ✅ Google Planner 9,098행 + SearchAd 9행 삽입 |
| 7 | collect_trends.js 수동 실행 | ✅ Google Trends 7행 + DataLab 5행 삽입 |
| 8 | 크론 yml 편성 | ✅ daily-briefing.yml에 일배치 2종 + 월배치 2종 추가 |
| 9 | SA BQ 권한 부여 | ✅ dataset-level WRITER + project-level dataEditor, jobUser |

## 💡 작업 중 보정

| 항목 | 내용 |
|------|------|
| funnel_daily 뷰 SQL | 설계서 컬럼명(`timestamp`, `page`, `event`)과 실측 스키마(`event_timestamp`, `page_path`, `event_name`)가 불일치 → 실측 기준 보정 |
| GA4 차원 비호환 | `sessionDefaultChannelGrouping` + `sourceMedium` 동시 사용 불가 → 별도 리포트 분리 + `sessionSourceMedium` 사용 |
| pytrends 이스케이핑 | 인라인 Python 코드의 셸 이스케이핑 파손 → 임시 파일 방식으로 전환 |
| SA BQ 권한 | yong-a-orchestrator SA에 BQ 삽입 권한 미보유 → dataset-level WRITER 부여 |

## ⏳ §2 CR 로그 싱크 — 작가님 실행 필요

GCP 콘솔에서 설정:
1. Cloud Logging → 로그 라우터 → 싱크 생성
2. 필터: `resource.type="cloud_run_revision" resource.labels.service_name="monkos-portal"`
3. 대상: BigQuery `market_eye.cr_access_log`

## ⏳ GitHub Secrets 미등록 확인 필요

Google Ads 시크릿 5종이 GitHub Secrets에 등록되어 있어야 월배치 크론이 작동합니다:
- `GOOGLE_ADS_DEV_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`

## 📁 변경 파일

| 파일 | 변경 |
|------|------|
| `scripts/collectors/_loader.js` | 신규 — BQ 공통 로더 |
| `scripts/collectors/_notify.js` | 신규 — 텔레그램 경고 |
| `scripts/collectors/collect_gsc.js` | 신규 — GSC 일배치 |
| `scripts/collectors/collect_ga4.js` | 신규 — GA4 일배치 |
| `scripts/collectors/collect_keywords.js` | 신규 — Ads+SearchAd 월배치 |
| `scripts/collectors/collect_trends.js` | 신규 — Trends+DataLab 월배치 |
| `scripts/collectors/keyword_sets.json` | 신규 — 7개국 키워드셋 정본 |
| `.github/workflows/daily-briefing.yml` | 수정 — 수집기 4종 크론 편성 |
| `.github/scripts/requirements.txt` | 수정 — pytrends 추가 |
| `package.json` | 수정 — @google-cloud/bigquery, googleapis, @google-analytics/data 추가 |

## 🔀 BQ 실측

```
gsc_daily              :   113행
ga4_daily              :    15행
ads_keyword_monthly    : 9,098행
naver_searchad_monthly :     9행
trends_monthly         :    17행
funnel_daily (뷰)      :   정상
gate_metrics (뷰)      :   정상
```
