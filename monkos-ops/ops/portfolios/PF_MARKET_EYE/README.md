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
| 5 | GA4 확장 | `seo_collect.sh ga4-device` | ✅ 디바이스별 세션·이탈률 (08-02 iMac 복구) |
| 6 | GSC URL Inspection | `seo_collect.sh gsc-inspection` | ✅ 색인 상태·크롤 시간 (08-02 iMac 복구) |
| 7 | GSC MCP | `gsc_mcp.sh` | ✅ 키워드·페이지 성과 |
| 8 | GA4 MCP | `ga4_mcp.sh` | ✅ 실시간 트래픽 (08-02 기동 방식 교체) |
| 9 | PageSpeed Insights | `seo_collect.sh pagespeed` | ✅ 08-02 전용 키 전환으로 가동 (2-2에서 승격) |

> ⚠️ **상태 표기 규율 (2026-08-02 신설)**: 본 표의 ✅는 **스모크 실증 기준**이다. 07-21~08-02 사이 5·6·8·9가 무음 사망 상태였음에도 표는 ✅를 유지했다(도구 3요건 ③실패 가시화 위반). 상태 변경 시 `scripts/tools/seo_collect.sh` 무인자 스모크 결과를 근거로 삼는다.
>
> **환경 재현성**: 파이썬 의존성 정본 = `scripts/tools/requirements.txt` (08-02 신설). 신규 디바이스는 `pip install -r` + `uv tool install analytics-mcp` 2줄로 셋업한다. 디바이스별 수동 복구 금지 — 07-21 M1 단독 복구가 iMac 미반영으로 12일간 방치된 사고의 재발 방지.

### 2-2. 미가동 / 보류

| 채널 | 상태 | 비고 |
|------|------|------|
| ~~PageSpeed Insights~~ | ✅ 08-02 가동 | 전용 키가 SM에 이미 있었으나(07-21 등재) 래퍼가 `GEMINI_API_KEY`를 주입 중이어서 403. 전용 키로 전환하여 해소 → 2-1로 승격 |
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
| 07/21 | M1/민아 | **검증 호출 패턴 5종 스펙 정본화** — 금일 실전 세션의 수동 호출(검색광고 서명·데이터랩 다개년·pytrends·GSC SA·플래너 지오표)을 코드화 입력용으로 기록, 함정 포함(hint≤5·SA키 raw JSON·sleep 4s). 수집기 지시서 원본 포팅용 | [SPEC](../../../tech/specs/market_eye/SPEC_market_eye_검증호출패턴_20260721.md) | ✅ |
| 07/21 | M1/민아 | **정보서비스 카테고리 벤치마크 7유형 + 방향성** — 구조 판독: 전 카테고리 해석층 공백·해자=시계열 적립·원천=커머디티·가격 스펙트럼 빈 칸(도구↔컨설팅 사이). 방향: **"대시보드가 아니라 판독을 판다"** — 수직 판독 리포트(정기 브리프+온디맨드 진단), 테넌트 0→1 경로, L3 즉시 가동=시간 해자, 범용 도구·저가 대시보드 경쟁 금지 | [REPORT](../../reports/2026-07/REPORT_20260721_M1민아_정보서비스_벤치마크_방향성.md) | ✅ |
| 07/21 | M1/막내1 | **P0 BQ 기반 구축 완료** — dataset+테이블6+뷰2 생성, 수집기 4종(GSC·GA4·Keywords·Trends) 코드+수동 실행 검증, 크론 yml 편성. BQ 실측: GSC 113행, GA4 15행, Ads 9098행, SearchAd 9행, Trends 17행 | [COMPLETION](../../reports/2026-07/COMPLETION_20260721_M1막내1_MARKET_EYE_P0_BQ수집기.md) | ✅ |
| 07/21 | M1/민아 | **P0 게이트 재검증 — 통과 ✅ (조건 1)** — BQ 독립 실측 전량 정합: 행수 5종 정확 일치(113·15·9,098·9·17), tenant 선탑재·DAY 파티션·데이터셋 분리·실패 가시화(_notify.js) = 제안서 원칙 4/4 구조 확인. GH Secrets 실측: GCP_SA_KEY·NAVER 5종 등록 확인, **GOOGLE_ADS 5종 부재** — 8/1 월배치 전 등록 필요(작가님 조치 3호) | BQ·gh 실측 | ✅ (조건: GH Ads 5종) |
| 07/21 | M1/쌍아 | **MARKET_EYE 통합 설계서 완료** — 30종 데이터 소스 맵 + BQ 스키마 + 수집기 아키텍처 + 서비스화 경로(L3→L5) + 벤치마크 포지셔닝. P0~P1 비용 ₩0. Meta Marketing API + YouTube P1 편입 | [DESIGN](../../tech/designs/2026-07/DESIGN_20260721_MARKET_EYE_통합설계.md) | ✅ |
| 07/21 | M1/쌍아 | **GH Secrets GOOGLE_ADS 6종 SM→GH 동기화** — 민아 게이트 조건 해소 | gh secret set × 6 | ✅ |
| 07/21 | 작가님 | **CR 로그 BQ 싱크 설정** — Cloud Logging → market_eye 실시간 적재 | GCP 콘솔 | ✅ |
| 07/21 | 작가님 | **billing export BQ 설정** — 표준 사용량 비용 → market_eye 일배치 | GCP 콘솔 | ✅ |
| 07/21 | M1/쌍아+민아 | **SEA 3국 시장 실측** — ads.sh VN 85K·PH 84K·TH 10K. 개정 서열: JP≥VN≈PH>DE>KR>ID>TH. 교차 법칙 6개국 확장(우산 성장) | 세션로그 | ✅ |
| 08/02 | iMac/쌍아 | **수집 인프라 4종 무음 사망 적발·복구** (작가님 "직접 복구" 지시) — ①ga4-device·gsc-inspection 파이썬 의존성 미설치(07-21 M1 단독 복구가 iMac 미반영) ②GA4 MCP `uvx` 매기동 cryptography 소스빌드 → 타임아웃 ③PageSpeed가 GEMINI 키 오용으로 403 + **키 평문 로그 노출**. 스모크 **6/6 복구**. 재현성 정본 `requirements.txt` 신설 + 상태 표기 규율 명문화 | requirements.txt, ga4_mcp.sh, seo_collect.sh, 본 README | ✅ |
| 08/02 | iMac/쌍아 | **GA4 조회수 +41% 정체 규명** — 7/30 desktop 단일일 이상치(pv/s 7.66, 타 일자 1.0~2.0) + Direct 채널 pv/s 5.16. Organic Search는 pv/s 1.06 정상. **실사용자 회유 아님** | 세션로그 2026-08-02 | ✅ |
| 08/02 | iMac/쌍아 | **오염원 특정 + 3층 계량 체계 확립** (작가님 "직접 처리해") — BQ 요청로그로 **외부 스크래퍼 확정**(`158.69.*` 1분 131고유URL 등, 내부 자동화 아님). `gtagSnippet()` 계측 단일 정본 신설 + 자동화 판정 3층 + `automation_hit` 이벤트, prod `00542-pqt`. **홈 gtag 이원화 적발·해소**(7/30 오염 랜딩이 `/`였음). 언노운 계량 = CR 요청로그 **분당 고유URL 지문** | [ORDER 사후기록](../../orders/2026-08/ORDER_20260802_iMac쌍아_직접실행_GA4자동화표식_언노운계량.md), render-shell.js, home.js | ✅ |
| 09/15 | iMac/민아 | **Ads API v21 폐기 적발·복구** — 09-01 월배치 8개국 404 무음 실패(스텝 success·알림 0). 버전 정본 `scripts/ads_api_version`(v22) 신설, 수집기 0행→🔴+exit 1·`--dry-run`, DataLab 창 교정(부분주 오표시→7d vs 7d), 9월 9,102행 되메우기. 작가님 직접 지시 [예외] | `COMPLETION_20260915_iMac민아_MARKET_EYE_애즈v22_실패가시화_데이터랩창.md` | ✅ |
| 09/16 | iMac/민아 | **네이버 유입 정밀 분석** — GA4 오가닉 ×2.2 중 70%가 네이버 검색(monkos.ai, monk.kr 합산 아님). 8/10 색인 계단 → 3차 파동, 랜딩 60 ko specs, PC 62%. 네이버 웹문서 API 실측: 국가별 여권·비자 규격 쿼리 14/19 5위 내(1위 6) — 롱테일 선점, 헤드텀(여권 사진 규격·주민등록증)은 정부 사이트 독점. 틈: visa/us 자기 쿼리 미노출·PC→폰 동선 | 세션로그 09-16 18:29~18:52 | ✅ 분석 / ⏳ specs 후속 제안 |
| 10/06 | iMac/쌍아 | **ORDER** 마켓아이 센서 수선 — 결측 백필·GA4 차원 확장·이상 트래픽 경보·bizinfo 키 하드코딩 제거·RSS/트렌드 결손 | [ORDER_20261006_iMac쌍아_막내_MARKET_EYE_센서수선](../../orders/2026-10/ORDER_20261006_iMac쌍아_막내_MARKET_EYE_센서수선.md) | ⏳ |
| 10/06 | iMac/막내2 | 센서 수선(ORDER_20261006): 결측 백필 기본 탑재(GSC 24→2·GA4 23→0일, 잔여=지연 창), ga4_daily_dims 신설+봇·비운영 호스트 경보(9월 SG·localhost 검출), bizinfo 키 하드코딩 제거·마스킹(시크릿 미등록=결정 대기), Anthropic 공식 /news 파싱, trends 429 재시도·10월 7/7. 자기 사고 ga4_daily 중복 106행 롤백 대기. main 미병합 | [COMPLETION_20261006_iMac쌍아-막내2_MARKET_EYE_센서수선](../../reports/2026-10/COMPLETION_20261006_iMac쌍아-막내2_MARKET_EYE_센서수선.md) | ✅ |
| 10/06 | iMac/쌍아 | INCIDENT ga4_daily 8일 106행 중복 적재(막내2 자기 사고, BQ DATE 파라미터 NULL 바인딩) — 수정(bq.date+대조군) main 병합 6b4f4d53, 중복 행 롤백은 스트리밍 버퍼 소진 대기 | [INCIDENT_20261006_market_eye_ga4_daily_중복적재](../../incidents/2026-10/INCIDENT_20261006_market_eye_ga4_daily_중복적재.md) | ✅ |
| 10/06 | iMac/쌍아 | **REPORT** 네이버 스마트플레이스·예약·네이버페이 세팅 자료 정리 — 대행 범위 판단용 | [REPORT_20261006_iMac쌍아_네이버_플레이스예약페이_세팅자료](../../reports/2026-10/REPORT_20261006_iMac쌍아_네이버_플레이스예약페이_세팅자료.md) | 📁 |
| 11/05 | iMac/민아 | **PROPOSAL** 시장조사 봇 서비스 기획안 — 지금 하는 시장조사(조사 에이전트+수집기+판독 템플릿)를 상품으로. 첫 쇼케이스 = 바둑 앱 시장조사 | [PROPOSAL_20261105_iMac민아_MARKET_EYE_시장조사봇_서비스기획안](../../proposals/PROPOSAL_20261105_iMac민아_MARKET_EYE_시장조사봇_서비스기획안.md) | ⏳ |

---

## 5. Phase 로드맵

### Phase 0 — BQ 기반 구축 (P0 테이블)

| 항목 | 상태 |
|------|------|
| BQ `market_eye` 데이터셋 생성 | ✅ |
| CR 요청 로그 → BQ 싱크 설정 | ⏳ (GCP 콘솔, 작가님 실행) |
| gsc_daily 수집기 + 크론 | ✅ |
| ga4_daily 수집기 + 크론 | ✅ |
| ads_keyword_monthly 수집기 | ✅ |
| naver_searchad_monthly 수집기 | ✅ |
| trends_monthly 수집기 | ✅ |
| funnel_daily 뷰 | ✅ |
| gate_metrics 뷰 | ✅ |

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
