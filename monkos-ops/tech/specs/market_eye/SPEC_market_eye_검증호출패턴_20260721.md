---
type: spec
date: 2026-07-21
device: M1
agent: 민아
status: 검증완료
portfolio: PF_MARKET_EYE
---

# MARKET_EYE 검증 호출 패턴 4종 — 7/21 실전 세션 검증본

**[2026-07-21 14:30 KST]** M1/민아 → 쌍아 (수집기 코드화 지시서 입력용)

> 금일 시장 실측 세션(취업사진 13개국 §1~§10)에서 **실제 데이터를 반환한 호출 패턴의 원본 기록**.
> 수집기 코드화 시 이 패턴을 **그대로 포팅**할 것 — 재해석 금지 원칙(7/7). 전부 당일 실전 검증됨.

## 1. 네이버 검색광고 키워드도구 (절대 검색량 스냅샷)

- 엔드포인트: `GET https://api.searchad.naver.com/keywordstool`
- 서명: `{timestamp}.GET.{uri}` → HMAC-SHA256(SECRET_KEY) → base64. 헤더 4종: X-Timestamp·X-API-KEY·X-Customer·X-Signature
- 파라미터: `hintKeywords`(공백 제거 필수 — 쌍아 7/21 수선분), `showDetail=1`
- 응답 필드: `keywordList[].relKeyword / monthlyPcQcCnt / monthlyMobileQcCnt / compIdx`
- ⚠️ **hint 상한 5개 — 6개 이상 무음 `[]`** (금일 실측). 배치 분할 + 초과 경고 필수
- 키: SM `NAVER_SEARCHAD_API_KEY` / `NAVER_SEARCHAD_SECRET_KEY` / `NAVER_SEARCHAD_CUSTOMER_ID`
- 참조 구현: `scripts/tools/seo_collectors.py::fetch_naver_searchad` (배치 분할만 보강하면 정본)

## 2. 네이버 데이터랩 다개년 시계열 (추세)

- 엔드포인트: `POST https://openapi.naver.com/v1/datalab/search`
- 바디: `{"startDate":"2016-01-01","endDate":"{today}","timeUnit":"month","keywordGroups":[{"groupName":kw,"keywords":[kw]} ×≤5]}`
- 헤더: X-Naver-Client-Id / X-Naver-Client-Secret (SM `NAVER_DATALAB_CLIENT_ID/SECRET`)
- 응답: `results[].data[] {period, ratio}` — **요청 내 정규화 상대지수** (절대 환산 금지, 네이버 총검색 규모 변화 미보정 명기)
- 현행 `fetch_naver_datalab`은 30일 창 고정 — **startDate/timeUnit 파라미터화**가 코드화 골자
- 집계 검증식: 연도별 mean(ratio) — 금일 §8 십년 테이블 산식

## 3. 구글 트렌드 십년 곡선 (해외 추세)

- 라이브러리: `pytrends` (비공식 — 파손 리스크 명기, 실패 시 텔레그램 경고)
- 패턴: `TrendReq(hl='en-US', tz=540)` → `build_payload([term], timeframe='2016-01-01 {today}', geo=GEO)` → `interest_over_time()`
- **키워드 1개씩 단독 쿼리** (자기 최대=100 궤적 판독용 — 금일 §9·§10 방법론), 호출 간 sleep 4s (429 회피, 금일 11쿼리 무차단)
- 검증 지오: JP·DE·ID·VN·PH

## 4. GSC Search Analytics (T3 자사 점유)

- API: `searchconsole v1` / `searchanalytics().query(siteUrl="sc-domain:monkos.ai", body)`
- 인증: SM `GCP_SA_KEY` (**raw JSON — base64 아님**, 금일 실측: b64decode 시 파손. try raw → except b64 분기 권장) + scope `webmasters.readonly`
- 검증 쿼리 3형: ① page-contains 필터 상위 쿼리 ② query-contains 필터 전 표면 노출 ③ page 차원 총계
- 금일 실증: idphoto-jp 28d 노출 2 실측이 이 패턴

## 5. 구글 키워드 플래너 (지오·언어별 T2)

- 기존 정본: `scripts/ads.sh keywords "<terms>" <lang_id> <geo_id>` — 그대로 사용 (검증 13개 시장)
- 주요 상수 (금일 사용분): lang en 1000·de 1001·fr 1002·es 1003·ja 1005·id 1025·vi 1040·th 1044 / geo KR 2410·JP 2392·US 2840·DE 2276·FR 2250·ES 2724·MX 2484·ID 2360·VN 2704·TH 2764·IN 2356·PH 2608·GB 2826·BR 2076

## 코드화 배선 제안 (BQ `market_eye`)

| 호출 | 적재 테이블 (7/20 제안서) | 주기 |
|------|--------------------------|------|
| 1 검색광고 | `datalab_weekly` 또는 신설 `naver_keyword_monthly` | 월 1 |
| 2 데이터랩 | `datalab_weekly` | 주 1 |
| 3 트렌드 | `serp_snapshot` 인접 신설 `trends_monthly` | 월 1 |
| 4 GSC | `gsc_daily` (기설계) | 일 1 |
| 5 플래너 | `ads_keyword_monthly` (기설계) | 월 1 |

> 시크릿: 값 비노출 원칙 — 크론 환경은 deploy 주입 또는 SM 런타임 액세스. 본 문서에 값 절대 금지.
