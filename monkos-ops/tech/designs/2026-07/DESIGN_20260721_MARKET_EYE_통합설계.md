---
type: design
date: 2026-07-21
device: M1
agent: 쌍아
status: 초안
portfolio: PF_MARKET_EYE
---

# MARKET_EYE 통합 설계서 — 시장 데이터 수집·적재·조회 체계

**[2026-07-21 14:28 KST]** M1/쌍아 → 작가님, 민아

> 발단: 7/20 민아 스키마 제안서 + 7/21 작가님 "데이터 시스템으로 즉시 답이 나오는 체계" 실전 검증 + 교차의견 반영
> 근거: 7/21 세션 3연속 질문 → 전부 분 단위 근거 제시 = L1 실전 검증. L3(자동 적재) 전환 설계.

---

## §1 원칙

1. **자사 행동(tracking) ↔ 시장 관측(market_eye) 데이터셋 분리** — 기존 `monkos_tracking` 무변경
2. **tenant 필드 선탑재** — 전 테이블 `tenant` 컬럼 (기본 'monkos'). B2B 온보딩 = 값 1개 추가
3. **append-only 일 파티션** — 적재만, 재작성 금지. 판정·보정은 뷰에서
4. **수집기 = 도구 3요건** — references.md 등재 + 스모크 + 실패 가시화 (무음 결번 금지)
5. **빈 응답 경고** — 수집 결과 0행 시 텔레그램 경고 (7/21 SearchAd 무음 [] 사고 교훈)

---

## §2 데이터 소스 전체 맵

### 2-1. 가동 중 (L1: 수동 조회 즉시 가능)

| # | 소스 | 도구 | 데이터 | 스모크 |
|---|------|------|--------|--------|
| 1 | Google Ads 키워드 플래너 | `ads.sh keywords` | 다국어·다지역 월검색량, CPC, 경쟁도 | ✅ 7/21 13개국+SEA 3국 실측 |
| 2 | 네이버 SearchAd | `seo_collect.sh naver-searchad` | KR 절대 검색량, CPC | ✅ 7/21 공백 수선+배치 분할 |
| 3 | 네이버 DataLab | `seo_collect.sh naver-datalab` | KR 상대 트렌드 (주간) | ✅ 7/21 |
| 4 | Bing WMT | `seo_collect.sh bing` | Bing 쿼리·링크 | ✅ 7/21 |
| 5 | GA4 확장 | `seo_collect.sh ga4-device` | 디바이스별 세션·이탈률 | ✅ 7/21 (M1 pip install) |
| 6 | GSC URL Inspection | `seo_collect.sh gsc-inspection` | 색인 상태·크롤 시간 | ✅ 7/21 (M1 pip install) |
| 7 | GSC MCP | `gsc_mcp.sh` | 키워드·페이지 성과 28d | ✅ |
| 8 | GA4 MCP | `ga4_mcp.sh` | 실시간 트래픽 | ✅ |
| 9 | Google Trends (pytrends) | 민아 직접 호출 | 다국어 십년 추세 곡선 | ✅ 7/21 4개국 실측 |

### 2-2. 미가동 — BQ 적재 대상 (L3 전환)

| # | 소스 | BQ 테이블 | 주기 | 비용 | 우선순위 |
|---|------|----------|------|------|---------|
| 10 | **CR 요청 로그** | `cr_access_log` | 실시간 (BQ 싱크) | 무료 (Cloud Logging 기존) | **P0** |
| 11 | **GSC API** | `gsc_daily` | 일 1회 (3일 지연) | 무료 | **P0** |
| 12 | **GA4 API** | `ga4_daily` | 일 1회 | 무료 | **P0** |
| 13 | **Ads 키워드 플래너** | `ads_keyword_monthly` | 월 1회 스냅샷 | 무료 | **P0** |
| 14 | **네이버 SearchAd** | `naver_searchad_monthly` | 월 1회 스냅샷 | 무료 | **P0** |
| 15 | **Google Trends** | `trends_monthly` | 월 1회 | 무료 (pytrends) | **P0** |
| 16 | **YouTube Data API** | `youtube_weekly` | 주 1회 | 무료 (10K/일) | **P1** |
| 17 | **Meta Marketing API** | `meta_ads_daily` | 일 1회 | 무료 | **P1** | 용도: 광고 집행 성과(도달·클릭·CPA). FB 그룹 모니터링 아님. 토큰: System User(무만료) 필수 — 일반 토큰 60일 만료 |
| 18 | **CrUX API** | `crux_monthly` | 월 1회 | 무료 | **P1** |
| 19 | **Ads 성과** | `ads_perf_daily` | 일 1회 | 무료 | **P1** (재점화 시) |
| 20 | **네이버 DataLab** | `datalab_weekly` | 주 1회 | 무료 | **P1** |
| 21 | **DataForSEO SERP** | `serp_snapshot` | 주 2회 | 종량 $50~200/월 | **P2** |
| 22 | **DataForSEO 백링크** | `backlink_snapshot` | 주 1회 | 동일 계정 종량 | **P2** |
| 23 | **DataForSEO AI 인용** | `ai_visibility` | 주 1회 | 동일 계정 종량 | **P2** |
| 24 | **PageSpeed Insights** | `pagespeed_monthly` | 월 1회 배치 | 무료 (키 필요) | **P2** |
| 25 | **Knowledge Graph** | `kg_entity_monthly` | 월 1회 | 무료 | **P2** |
| V1 | — | `funnel_daily` (뷰) | — | — | **P0** |
| V2 | — | `gate_metrics` (뷰) | — | — | **P0** |

### 2-3. 채널 모니터링 (SNS — 구글 검색 바깥)

> 7/21 작가님 지시: 재한 외국인 + SEA 유입 경로 파악

| # | 채널 | API | 비용 | 판정 |
|---|------|-----|------|------|
| 25 | **YouTube** | Data API v3 (키워드 검색) | 무료 10K/일 | **P1 — 즉시 가능** |
| 26 | **Facebook** | Graph API (그룹 접근 제한) | 무료~수동 | P2 — 수동 모니터링 |
| 27 | **Instagram** | Graph API (해시태그) | 비즈니스 계정 필요 | P2 |
| 28 | **TikTok** | Research API (학술 전용) | $7K+/년 | 부적합 |
| 29 | **Brand24/Mentionlytics** | 크로스플랫폼 멘션 | $141~200/월 | P2 — SNS 본격화 시 |

---

## §3 BQ 테이블 스키마 (P0)

### 3-1. `gsc_daily`

```
date          DATE        PARTITION
tenant        STRING      DEFAULT 'monkos'
site          STRING      'sc-domain:monkos.ai'
page          STRING
query         STRING
country       STRING
device        STRING
clicks        INT64
impressions   INT64
position      FLOAT64
```

### 3-2. `ga4_daily`

```
date          DATE        PARTITION
tenant        STRING
channel       STRING
source_medium STRING
sessions      INT64
users         INT64
new_users     INT64
bounce_rate   FLOAT64
avg_duration  FLOAT64
conv_free     INT64
conv_signup   INT64
conv_purchase INT64
```

### 3-3. `ads_keyword_monthly`

```
date          DATE        PARTITION (월초)
tenant        STRING
keyword       STRING
lang          STRING      'ko' / 'en' / 'ja' / 'vi' ...
geo           STRING      'KR' / 'JP' / 'DE' / 'VN' / 'PH' ...
monthly_searches INT64
competition   STRING
cpc_low       INT64       (원)
cpc_high      INT64       (원)
source        STRING      'google_planner' / 'naver_searchad'
```

### 3-4. `cr_access_log`

> Cloud Logging → BQ 싱크 (GCP 콘솔 설정, 수집기 코드 불필요)

```
timestamp     TIMESTAMP
tenant        STRING      (로그 필터로 주입)
method        STRING
path          STRING
status        INT64
user_agent    STRING
country       STRING      (X-Forwarded-For → geoip)
latency_ms    INT64
bot_type      STRING      (UA 파싱: googlebot/bingbot/gptbot/user)
```

### 3-5. `naver_searchad_monthly`

```
date          DATE        PARTITION (월초)
tenant        STRING
keyword       STRING
pc_searches   INT64
mobile_searches INT64
pc_clicks     FLOAT64
mobile_clicks FLOAT64
competition   STRING
```

### 3-6. `trends_monthly`

```
date          DATE        PARTITION (월초)
tenant        STRING
keyword       STRING
geo           STRING
lang          STRING
interest      INT64       (0~100, 자기 최대 기준)
source        STRING      'google_trends' / 'naver_datalab'
```

### 3-7. 뷰 `funnel_daily`

```sql
SELECT
  DATE(timestamp) AS date,
  REGEXP_EXTRACT(page, r'/specs/([^/]+)') AS slug,
  REGEXP_EXTRACT(page, r'^/([a-z]{2})/') AS lang,
  COUNTIF(event = 'page_view') AS visits,
  COUNTIF(event = 'free_generation_complete') AS free_gen,
  COUNTIF(event = 'begin_checkout' AND value = 2000) AS t1_checkout,
  COUNTIF(event = 'purchase') AS purchase
FROM `monkos_tracking.events`
GROUP BY 1, 2, 3
```

### 3-8. 뷰 `gate_metrics`

```sql
-- 4주 게이트 판정치 자동 산출
SELECT
  'specs_to_signup' AS gate_id,
  SAFE_DIVIDE(SUM(conv_signup), SUM(sessions)) AS rate
FROM `market_eye.ga4_daily`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
UNION ALL
SELECT
  't0_to_t1' AS gate_id,
  SAFE_DIVIDE(SUM(t1_checkout), SUM(free_gen)) AS rate
FROM `market_eye.funnel_daily`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
-- ... 추가 게이트
```

---

## §4 수집기 아키텍처

### 4-1. 디렉토리 구조

```
scripts/collectors/
  ├─ collect_gsc.js        GSC 일배치
  ├─ collect_ga4.js        GA4 일배치
  ├─ collect_keywords.js   Ads 플래너 + 네이버 SearchAd 월배치
  ├─ collect_trends.js     Google Trends + 네이버 DataLab 월배치
  ├─ collect_youtube.js    YouTube 키워드 주배치
  ├─ collect_crux.js       CrUX 월배치
  ├─ _loader.js            BQ 공통 로더 (테이블별 스키마 검증 + insert)
  └─ _notify.js            실패 시 텔레그램 경고
```

### 4-2. 실행 환경

| 항목 | 값 |
|------|---|
| 위치 | 4060 (아키텍처 전환 Phase 4 연동) / 전환 전 iMac 크론 |
| 크론 | 기존 daily_briefing.yml 편승 — `collect_gsc.js`, `collect_ga4.js` 일 1회 |
| 월배치 | 매월 1일 — `collect_keywords.js`, `collect_trends.js` |
| 주배치 | 매주 월요일 — `collect_youtube.js` |
| BQ 프로젝트 | `monkos` |
| 인증 | SA 키 (GCP_SA_KEY, 기존 SM 등재) |

### 4-3. CR 로그 싱크 (코드 불필요)

GCP 콘솔에서 설정:
1. Cloud Logging → 로그 라우터 → 싱크 생성
2. 필터: `resource.type="cloud_run_revision" resource.labels.service_name="monkos-portal"`
3. 대상: BigQuery 데이터셋 `market_eye`
4. 테이블 이름: `cr_access_log`

### 4-4. 기존 도구와의 관계

| 기존 도구 | 역할 변경 |
|----------|----------|
| `seo_collect.sh` / `seo_collectors.py` | L1 수동 조회 유지 (즉석 답변용) |
| `ads.sh` | L1 수동 조회 유지 |
| `daily_briefing.py` | 브리핑 생성 유지, 수집 함수는 collectors/ 호출 |
| `scripts/collectors/*` | **신규** — BQ 적재 전용 |

L1(수동) + L3(자동) 이중 운용. 수동 도구는 "지금 당장 이 숫자 알려줘"용, 자동 수집기는 "매일 쌓아서 추이 보기"용.

---

## §5 7/21 시장 실측 결과 요약 (설계 입력)

### 5-1. 시장 서열 (우산 잣대)

| 순위 | 시장 | 우산 월검색량 | 추세 (십년) | 즉발 조건 |
|------|------|------------|-----------|----------|
| 1 | JP | ~92K | 證明写真 +50%, 履歴書写真 +38% ↑ | idphoto-jp 보강 (기존 서비스) |
| 2 | VN | ~85K | ảnh thẻ 3배 성장 ↑ | vi 기라이브 (7/19), 콘텐츠 보강 |
| 3 | PH | ~84K | 2x2 picture 4.5배 ↑ 역대 최고점 | en 기개방, specs 확장 |
| 4 | DE | ~62K | passbild +56% ↑, bewerbungsfoto -56% ↓ | de-resume 기보유 |
| 5 | KR | ~23K (네이버 포함) | 증명사진 ↑, 취업사진 ↓ | 포털 랜딩 (공석) |
| 6 | ID | ~12K | pas foto 2배 ↑ | id 기라이브 (7/19) |
| 7 | TH | ~10K | รูปติดบัตร 횡보 | 언어 미개방 |

### 5-2. 교차 실증 법칙

> 6개국 전부: **용도 키워드는 우산 명사로 흡수되고, 우산은 성장한다.**
> 예외: JP 履歴書写真 (제도가 사진 요구를 유지하는 유일 시장)
> 결론: specs(규격 백과) + 생성 서비스 = 전 시장 정타

### 5-3. 재한 외국인 (구글 SEO 비대상)

- 273만 재한 외국인, 14.9만 베트남 근로자
- 구글 검색량 미미 (170/월 이하)
- 진입점: 페이스북 그룹 + YouTube → 별도 채널 전략
- YouTube Data API (무료) = P1 수집 소스

---

## §6 비용 시뮬레이션

### P0 (무료)

| 항목 | 비용 |
|------|------|
| BQ 적재 | 무료 티어 (10GB/월 저장 + 1TB/월 쿼리) |
| CR 로그 싱크 | Cloud Logging 무료 할당 내 |
| GSC/GA4/Ads API | 무료 |
| 네이버 SearchAd/DataLab | 무료 |
| Google Trends (pytrends) | 무료 |
| **P0 합계** | **₩0** |

### P1 추가

| 항목 | 비용 |
|------|------|
| YouTube Data API | 무료 |
| CrUX API | 무료 |
| **P1 합계** | **₩0** |

### P2 추가

| 항목 | 비용 |
|------|------|
| DataForSEO (SERP + 백링크 + AI) | ~$50~200/월 종량 |
| Brand24/Mentionlytics | ~$141~200/월 |
| PSI API 키 | ₩0 (키 생성만) |
| **P2 합계** | **~$200~400/월** |

---

## §7 Phase 로드맵

### Phase 0 — BQ 기반 구축 (1주)

| Task | 내용 | 담당 |
|------|------|------|
| T0-1 | BQ `market_eye` 데이터셋 생성 | 막내 |
| T0-2 | CR 로그 BQ 싱크 설정 (GCP 콘솔) | 작가님/쌍아 |
| T0-3 | `_loader.js` 공통 BQ 로더 | 막내 |
| T0-4 | `collect_gsc.js` + 크론 | 막내 |
| T0-5 | `collect_ga4.js` + 크론 | 막내 |
| T0-6 | `collect_keywords.js` (Ads + 네이버) | 막내 |
| T0-7 | `collect_trends.js` (pytrends + DataLab) | 막내 |
| T0-8 | `funnel_daily` 뷰 생성 | 막내 |
| T0-9 | `gate_metrics` 뷰 생성 | 막내 |
| T0-10 | 스모크 검증 (5종) | 민아 |

### Phase 1 — 확장 (2주)

| Task | 내용 | 담당 |
|------|------|------|
| T1-1 | `collect_youtube.js` + 크론 | 막내 |
| T1-2 | **Meta Marketing API 연동** — 앱 생성 + 토큰 + `collect_meta.js` | 쌍아 설계 → 막내 |
| T1-3 | `collect_crux.js` | 막내 |
| T1-4 | Ads 성과 일배치 (재점화 시 활성) | 막내 |
| T1-5 | Looker Studio 연결 (citadel 대시보드 바인딩) | 쌍아 설계 |

### Phase 2 — 고도화

| Task | 내용 | 담당 |
|------|------|------|
| T2-1 | DataForSEO 파일럿 (SERP + 백링크 + AI 인용) | 쌍아 설계 |
| T2-2 | SNS 모니터링 도구 선정 | 쌍아 |
| T2-3 | PSI 배치 수집기 | 막내 |
| T2-4 | KG 엔티티 스냅 | 막내 |
| T2-5 | B2B tenant 멀티 테넌시 실증 | 쌍아 설계 |

---

## §8 서비스화 경로

### 8-1. 코드화 경계선

| 층 | 담당 | 오늘 세션 대응 |
|----|------|-------------|
| 수집·적재·파생 | **코드** (크론→BQ) | 수동 API 11쿼리 → collectors/ 이식 |
| 임계 감지·알림 | **코드** (규칙) | "이력서사진 -85%" 같은 급변 자동 감지 |
| 표준 리포트 | **코드** (템플릿) | 키워드셋×시장×기간 함수 → 정기 브리프 |
| 해석·질문 설계 | **에이전트** | "건대사진관 붕괴 = 탐색 채널 이탈" 판독 |

### 8-2. 서비스화 3단 (L3→L4→L5)

| 단계 | 내용 | 산출물 |
|------|------|--------|
| **L3** 수집 자동화 | 크론 → BQ 적재 | 시계열 자산 (소급 불가 해자) |
| **L4** 판정·알림 | 임계값 규칙 → 텔레그램/이메일 | 이상 감지 자동 보고 |
| **L5** 표준 리포트 | 템플릿 → 정기 브리프 + 온디맨드 진단 | **MONKOS Market Eye 리포트 = B2B 상품 원형** |

### 8-3. 포지셔닝 (민아 벤치마크 기반)

- **비진입**: 크롤러 전쟁 (Ahrefs), 저가 대시보드 (블랙키위)
- **진입**: 숫자+판독 묶음 — 도구($117~)와 컨설팅($수천) 사이의 빈 슬롯
- **차별화**: 테넌트 0 캘리브레이션 (GSC·GA4·실결제 실측 보정 = 검증 가능한 수치)
- **해자**: L3 크론이 오늘부터 쌓는 수직 시계열 = 3개월 뒤 소급 불가

### 8-4. 참조

- 검증 호출 패턴 스펙: `monkos-ops/tech/specs/market_eye/SPEC_market_eye_검증호출패턴_20260721.md`
- 정보 서비스 벤치마크: `monkos-ops/ops/reports/2026-07/REPORT_20260721_M1민아_정보서비스_벤치마크_방향성.md`

---

## §9 민아 교차 검토 요청

1. BQ 스키마 컬럼 리뷰 (§3) — 후행 변경 비용 크므로 1회 확정 필수
2. CR 로그 싱크 필터 정확도 — bot_type 파싱 규칙
3. 수집 주기 적정성 — 일/주/월 배분
4. 기존 daily_briefing.py와의 중복 범위 확정
