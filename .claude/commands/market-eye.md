---
name: market-eye
description: 시장 데이터 즉시 조회 — 키워드 검색량·트렌드·경쟁도를 다국어·다지역으로 실측
user_invocable: true
---

# /market-eye — 시장 데이터 즉시 조회

> PF_MARKET_EYE 소관. "이 상품 수요 어때?" → 30초 안에 숫자.
> 정본 소스: `monkos-ops/tech/specs/market_eye/SPEC_market_eye_검증호출패턴_20260721.md`
> **원본 포팅 — 재해석 금지.**

## 트리거

- 작가님이 시장 수요·검색량·트렌드·경쟁도를 물을 때
- "이 키워드 수요 어때", "독일 취업사진 검색량", "증명사진 트렌드" 등

## 실행 절차

### 1. 입력 파싱

작가님 질문에서 추출:
- **키워드**: 조회 대상 (예: "취업사진", "bewerbungsfoto")
- **지역**: 국가 코드 (기본 KR)
- **소스**: google / naver / both (기본 both for KR, google for 해외)

### 2. Google Ads 키워드 플래너

```bash
# 지역·언어 상수표 (정본: 검증 호출 패턴 스펙 §6)
# KR=2410/1004, JP=2392/1005, DE=2276/1001, VN=2704/1020
# PH=2608/1000, TH=2764/1044, ID=2360/1023, US=2840/1000
scripts/ads.sh keywords "{키워드}" {lang_id} {country_id}
```

### 3. 네이버 SearchAd (KR 한정)

```bash
scripts/tools/seo_collect.sh naver-searchad --keywords "{키워드}"
```

⚠️ **함정**:
- hintKeywords **5개 상한** — 6개↑ 시 무음 빈 배열. 수집기에 배치 분할 구현됨 (7/21 수선).
- 공백 포함 키워드는 자동 제거됨 ("AI 증명사진" → "AI증명사진").

### 4. 네이버 DataLab (KR 트렌드)

```bash
scripts/tools/seo_collect.sh naver-datalab --keywords "{키워드}"
```

### 5. 결과 종합

테이블 형식으로 보고:

```markdown
| 키워드 | Google 월검색량 | 네이버 PC+M | CPC | 경쟁도 |
```

다국어 비교 시 국가별 서열 포함.

## 다국어 조회 패턴

여러 국가 비교 요청 시 — 각국 네이티브 헤드텀으로 조회:

```bash
# 예: 취업사진 4개국 비교
scripts/ads.sh keywords "취업사진" 1004 2410      # KR
scripts/ads.sh keywords "履歴書写真" 1005 2392     # JP
scripts/ads.sh keywords "bewerbungsfoto" 1001 2276 # DE
scripts/ads.sh keywords "ảnh xin việc" 1020 2704   # VN
```

## BQ 적재 데이터 조회 (L3 가동 후)

```bash
# GSC 최근 28일 상위 키워드
bq query --project_id=monkos "SELECT query, SUM(clicks) c, AVG(position) p FROM market_eye.gsc_daily WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) GROUP BY 1 ORDER BY c DESC LIMIT 20"

# GA4 채널별 세션 추이
bq query --project_id=monkos "SELECT date, channel, sessions FROM market_eye.ga4_daily ORDER BY date DESC LIMIT 30"

# GA4 국가×호스트×랜딩×소스 (ga4_daily_dims, 2026-10-06 신설) — 참여율 낮은 국가·소스 조합(봇 판독)
bq query --project_id=monkos --use_legacy_sql=false "SELECT country, source, SUM(active_users) u, SUM(sessions) s, SAFE_DIVIDE(SUM(engaged_sessions), SUM(sessions)) er FROM market_eye.ga4_daily_dims WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) GROUP BY 1,2 HAVING u >= 50 ORDER BY er LIMIT 20"
```

### 수집 운용 (2026-10-06 센서 수선 — ORDER_20261006)

- **결측 백필 기본 탑재**: `collect_gsc.js`(최근 14일, KST 오늘-3일까지)·`collect_ga4.js`(최근 10일, 오늘-2일까지)는 테이블에 **없는 날짜만** 수집. 같은 날짜 재적재 금지 — 존재 조회 + 대조군(리터럴 COUNT) 불일치 시 적재 중단
- **장기 백필**: `node scripts/collectors/collect_ga4.js --since 2026-07-01` (또는 `workflow_dispatch` 입력 `backfill_since`). 로컬은 `GOOGLE_APPLICATION_CREDENTIALS`(임퍼소네이션 ADC) 폴백
- **`ga4_daily_dims`**: country × hostName × landingPage(언어 접두 en/ja/es/zh/ko 제거 후 1단) × sessionSource. `active_users`는 랜딩 정규화 합산이라 상한 근사
- **브리핑 경보 2종**(`daily_briefing.py detect_traffic_alerts`, 7일 합계 GA4 직조회): 🟡 봇 의심(국가×소스 50명↑·참여율 10%↓) / 🟡 비운영 호스트 유입(`monkos.ai`·`*.monkos.ai`·`monk.kr`·`*.monk.kr` 외)
- **trends 월배치**: pytrends 429 재시도(3회) + 결손 텔레그램 알림 + 같은 달 기적재 키워드 건너뜀 → `workflow_dispatch monthly=trends`로 결손분만 재수집. 수동 실행 기본값 `monthly=none`(월 테이블 중복 방지)
- **뉴스**: Anthropic = 공식 `/news` 페이지 파싱(공식 RSS 없음). bizinfo = `BIZINFO_API_KEY` 시크릿 필수(미설정 시 🔴 명시 건너뜀), 로그의 인증값 `***` 마스킹

## 도구 3요건

- **인지**: 본 스킬 + references.md 도구맵 등재
- **스모크**: `scripts/ads.sh keywords "증명사진"` → 수치 반환 확인 / 센서 수선분은 COMPLETION_20261006 MARKET_EYE_센서수선 (과거 데이터 경보 시험·dispatch 실행)
- **실패 가시화**: API 에러 시 stderr WARNING 출력 (무음 금지). 수집 0행·결손·존재 조회 무효는 텔레그램 ⚠️/🔴
