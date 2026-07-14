---
type: report
date: 2026-07-14
device: M1
agent: 막내3
portfolio: PF_CITADEL, PF_SPECS
status: 완료
---

# SEO/GEO 정보수집 채널 전략 보고서

**[2026-07-14 14:52 KST]** M1/막내3 → 작가님

---

## 1. 현행 수집 인프라 진단

### 1-1. 현재 운용 중인 파이프라인

| 파일 | 용도 | 스케줄 | 수집 데이터 |
|------|------|--------|-----------|
| `.github/scripts/daily_briefing.py` | 데일리 브리핑 | KST 05:00 매일 | GA4 기본 트래픽 + 퍼널 6이벤트, GSC 클릭/노출/CTR/순위 (상위 10쿼리·10페이지·20국가) |
| `.github/workflows/weekly-dashboard.yml` | 주간 대시보드 | KST 월 06:00 | PF 상태만 (SEO 데이터 없음) |
| `portal/lib/cms/seo.js` | 색인 요청 발송 | 콘텐츠 발행 시 | Google Indexing API + IndexNow (Naver/Bing/Yandex 등) — 발송만, 결과 미수집 |
| `portal/lib/cms/render-sitemap.js` | 사이트맵 생성 | 요청 시 | 동적 생성 (static/specs/blog) — 모니터링 없음 |

### 1-2. 현행 커버리지

| 영역 | 커버리지 | 비고 |
|------|---------|------|
| GA4 | ~30% | 기본 트래픽만. 이탈률/체류시간/디바이스/인구통계/이커머스 미수집 |
| GSC | ~35% | 일자별 스냅샷만. 디바이스/검색표시/URL Inspection/사이트맵 미수집 |
| SEO 인프라 | ~15% | HTTP 상태 확인만. CWV/메타태그/구조화데이터/hreflang 검증 없음 |
| 알림/배달 | ~80% | Telegram + GitHub Issues 정상 운용 |
| **네이버** | **0%** | IndexNow 발송만. 검색 성과 데이터 전무 |
| **Bing** | **0%** | IndexNow 발송만. 검색 성과 데이터 전무 |

### 1-3. 치명적 공백 (Critical Gaps)

1. **색인 커버리지 모니터링 = 0** — PF_SPECS 3,500+ 페이지 색인 목표이나 실제 색인 수 자동 측정 없음
2. **Core Web Vitals 수집 = 0** — 구글 랭킹 시그널이나 PageSpeed API 미연동
3. **네이버/Bing 검색 데이터 = 0** — 한국(63% 네이버) + 일본(36% Bing) 시장 핵심 채널 미연결
4. **경쟁사 모니터링 = 0** — sajinkwan.com, visafoto.com 등 자동 추적 없음
5. **키워드 시계열 = 0** — GSC 상위 10 쿼리 일일 수집하나 시계열 저장/추이 분석 없음

---

## 2. 채널별 전수 조사 결과

### 2-1. 자동화 가능성 매트릭스

| 채널 | API | 인증 | 무료 한도 | 난이도 | 우선순위 | 현재 사용 |
|------|-----|------|----------|--------|---------|----------|
| **GSC API** (확장) | ✅ | SA+도메인 | 25K행/요청, 무제한 | 쉬움 | **P0** | 부분 |
| **Bing WMT API** | ✅ | API Key | 완전 무료 | 쉬움 | **P0** | ❌ |
| **네이버 검색광고 API** | ✅ | HMAC-SHA256 | 무료 (광고비 불요) | 중간 | **P0** | ❌ |
| **GA4 Data API** (확장) | ✅ | SA | 200K 토큰/일 | 쉬움 | **P1** | 부분 |
| **네이버 DataLab API** | ✅ | Client ID/Secret | 1,000회/일 | 쉬움 | **P1** | ❌ |
| **PageSpeed Insights API** | ✅ | API Key | 25,000회/일 | 쉬움 | **P1** | ❌ |
| **네이버 서치어드바이저** | ❌ | 웹 콘솔만 | — | 불가 | **P1** | ❌ |
| **Google Ads KP API** | ✅ | OAuth+Ads계정 | 광고비 필요 (정밀치) | 어려움 | **P2** | ❌ |
| **Google Business Profile** | ✅ | OAuth+승인신청 | 무료 (승인 게이트) | 중간 | **P2** | ❌ |
| **네이버 블로그/카페 검색** | ✅ | Client ID/Secret | 25,000회/일 | 쉬움 | **P2** | ❌ |
| **AlsoAsked API** | ✅ | API Key | $29/월 300크레딧 | 중간 | **P2** | ❌ |
| **CommonCrawl/CrawlGraph** | ✅ | 인증 불요 | 완전 무료 | 중간 | **P2** | ❌ |
| **Google Trends API** | ⚠️ | Alpha 승인필요 | 비공개 | 어려움 | **P3** | ❌ |
| **AnswerThePublic** | ❌ | — | 3회/일 웹만 | 불가 | **P3** | ❌ |
| **Screaming Frog** | ❌ | CLI만 | 500 URL | 중간 | **P2** | ❌ |
| **W3C Link Checker** | ✅ | 불요 | 무제한 | 쉬움 | **P3** | ❌ |

---

## 3. 채널별 상세 분석

### 3-1. P0 — 즉시 연결 필수

#### GSC API 확장

현행은 Search Analytics 기본 쿼리만 사용. 확장 대상:

| 미사용 기능 | 가치 | 비고 |
|-----------|------|------|
| **URL Inspection API** | 페이지별 색인 상태 자동 확인 | PF_SPECS 3,500 페이지 색인 추적의 핵심 |
| **BigQuery Bulk Export** | 25K 행 한계 제거, URL 레벨 노출 | 빌링 프로젝트 필요 |
| **Sitemaps API** | 사이트맵 제출 상태/에러 확인 | 현재 제출만 하고 결과 미확인 |
| **디바이스 차원** | 모바일/데스크톱 성과 분리 | 모바일 퍼스트 인덱싱 영향 파악 |
| **검색 표시(searchAppearance)** | 리치 결과/FAQ 스니펫 노출 측정 | JSON-LD 트리플 스택 효과 측정 |

셋업: 기존 SA에 URL Inspection API 권한 추가만으로 즉시 가능.

#### Bing Webmaster Tools API

**일본 시장 Bing 36% 급등** — 무시 불가.

- 인증: Microsoft 계정 + BWT 사이트 등록 (GSC에서 임포트 가능)
- 무료 백링크 데이터 (GSC에 없는 기능): 소스 URL, 앵커 텍스트, 스팸 점수
- IndexNow 프로토콜: 이미 발송 중이나 수신 확인 없음
- 키워드 인상 볼륨: `GetKeywordStats` — 무료 키워드 리서치 소스
- URL 제출: 10,000 URL/일 (PF_SPECS 대량 색인 요청에 활용)
- 셋업: API 키 생성 → REST 호출. Python 클라이언트(MERJ) 존재.

#### 네이버 검색광고 API (키워드 도구)

**한국 시장 유일한 검색량 데이터 소스.**

- 제공 데이터: 월간 PC/모바일 검색량, 클릭수/클릭률, 경쟁도, 평균 페이지 깊이
- 인증: HMAC-SHA256 서명 (CUSTOMER_ID + API_KEY + SECRET_KEY)
- 광고비 불요 — 계정 생성만으로 API 접근 가능
- 셋업: searchad.naver.com 가입 → API Manager에서 키 발급
- Python 라이브러리: `naver-search-ad` (PyPI), MCP 서버도 존재 (`PlatAid/naver-searchad-mcp`)

---

### 3-2. P1 — 2주 내 연결 권장

#### GA4 Data API 확장

현행 수집 확장 대상:

| 미사용 기능 | 가치 |
|-----------|------|
| Real-time API | 트래픽 급등/급락 즉시 감지 |
| Funnel Report | 사진 업로드→다운로드 전환 퍼널 심층 분석 |
| 비교(comparisons) | 기간 대비 자동 분석 |
| returnPropertyQuota | 쿼터 소진 방지 모니터링 |

#### 네이버 DataLab API

- 네이버 검색 트렌드 (Google Trends의 네이버 버전)
- 상대 검색량 추이 (0-100), 성별/연령/디바이스 필터
- 쇼핑 인사이트 API: 카테고리/키워드별 쇼핑 트렌드
- 인증: Client ID + Secret (developers.naver.com 등록)
- 1,000회/일 무료
- 셋업 난이도: 낮음. REST POST, JSON 응답. Python 샘플 공식 제공.
- **주의**: 레거시 엔드포인트 → NAVER API HUB 마이그레이션 진행 중 (2026-07)

#### PageSpeed Insights API

- Core Web Vitals = 구글 랭킹 시그널 (확정)
- 25,000회/일 무료 — monkos.ai 50페이지 × 2(모바일/데스크톱) = 100회/일로 충분
- CrUX 필드 데이터 (실사용자) + Lighthouse 랩 데이터
- 셋업: GCP에서 PageSpeed API 활성화 + API 키 생성 (기존 프로젝트에서 즉시 가능)

#### 네이버 서치어드바이저

- **API 없음** — 웹 콘솔(searchadvisor.naver.com)만 존재
- 제공: 색인 URL 수, 크롤 제한 URL, 검색 노출 상위 10 키워드 (최근 90일)
- GSC 대비 제약: 순위 데이터 없음, 상위 10 키워드만, 90일 윈도우
- 자동화: 불가 (브라우저 스크래핑은 네이버 ToS 위반 위험)
- **권고**: 월 1회 수동 확인 + Excel 다운로드 → 브리핑에 수동 병합
- 셋업: 사이트 등록 + 소유권 인증 (HTML 파일/메타태그)

---

### 3-3. P2 — 월 단위 검토

| 채널 | 핵심 가치 | 비용 | 비고 |
|------|----------|------|------|
| Google Ads KP API | 키워드 검색량+경쟁도 (Google) | 광고비 필요 ($50+) | 정밀 볼륨 = 광고 집행 필수 |
| Google Business Profile | 리뷰 모니터링, 자동 포스팅 | 무료 (승인 게이트) | monk_studio GBP 존재 시 유용 |
| 네이버 블로그/카페 검색 | 브랜드 멘션 모니터링 | 무료 25K/일 | 콘텐츠 확산 추적 |
| AlsoAsked API | PAA 질문형 키워드 발굴 | $29/월 | 한/일 Google 지원. FAQ 전략 |
| CommonCrawl/CrawlGraph | 무료 백링크 분석 | 무료 | 경쟁사 백링크 갭 분석 |
| Screaming Frog | 기술 SEO 감사 (hreflang 검증) | 무료 500 URL | CLI 크론 가능. MCP 서버 존재 |

---

## 4. 시타델(CITADEL) 편입 설계 초안

### 4-1. 수집 파이프라인 아키텍처

```
┌─────────────────────────────────────────────────────┐
│              CITADEL 데이터 수집 파이프라인             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ 매일 (KST 05:00) ─────────────────────────┐   │
│  │  GSC Search Analytics (확장)                 │   │
│  │    + 디바이스 차원 + 검색 표시                  │   │
│  │  GA4 Data API (확장)                         │   │
│  │    + 이탈률 + 체류시간 + 디바이스               │   │
│  │  PageSpeed Insights API                      │   │
│  │    + CWV (LCP/INP/CLS) 모바일+데스크톱        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 주 2회 (월/목) ────────────────────────────┐   │
│  │  GSC URL Inspection API                      │   │
│  │    + specs 페이지 색인 상태 배치 확인           │   │
│  │  Bing WMT API                                │   │
│  │    + 검색 성과 + 백링크 + 키워드 볼륨           │   │
│  │  네이버 DataLab API                          │   │
│  │    + 핵심 키워드 트렌드 추이                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 주 1회 (월요일) ───────────────────────────┐   │
│  │  네이버 검색광고 API                          │   │
│  │    + 핵심 키워드 월간 검색량 갱신               │   │
│  │  GSC Sitemaps API                            │   │
│  │    + 사이트맵 상태/에러 확인                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 월 1회 (수동) ─────────────────────────────┐   │
│  │  네이버 서치어드바이저 (웹 콘솔)               │   │
│  │    + 색인 현황 + 상위 키워드 Excel 다운로드      │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 이벤트 기반 ───────────────────────────────┐   │
│  │  IndexNow 발송 (기존) + 결과 피드백 루프       │   │
│  │  Google Indexing API 발송 (기존) + 확인        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  저장: GCS/Firestore 시계열 → 주간 대시보드 렌더링   │
│  알림: Telegram + GitHub Issues (이상 징후 시)       │
└─────────────────────────────────────────────────────┘
```

### 4-2. 우선순위 구현 로드맵

#### Sprint 1 (즉시 — 1주 내): P0 연결

| # | 작업 | 예상 공수 | 시크릿 필요 |
|---|------|---------|-----------|
| 1 | GSC API 확장 — URL Inspection + 디바이스 + searchAppearance 차원 추가 | 0.5일 | 기존 SA |
| 2 | Bing WMT 등록 + API 키 발급 + 검색 성과/백링크 수집 스크립트 | 1일 | Bing API Key (신규) |
| 3 | 네이버 검색광고 계정 생성 + API 키 발급 + 키워드 수집 스크립트 | 1일 | Naver Ads API Key (신규) |
| 4 | daily_briefing.py에 Bing/네이버 데이터 병합 | 0.5일 | — |

#### Sprint 2 (2주 내): P1 연결

| # | 작업 | 예상 공수 | 시크릿 필요 |
|---|------|---------|-----------|
| 5 | PageSpeed Insights API 연동 + CWV 일일 수집 | 0.5일 | PSI API Key (기존 GCP) |
| 6 | 네이버 DataLab API 연동 + 트렌드 수집 | 0.5일 | Naver Client ID/Secret (신규) |
| 7 | GA4 확장 — 이탈률/체류시간/디바이스/리얼타임 | 0.5일 | 기존 SA |
| 8 | 키워드 시계열 저장소 설계 (GCS/Firestore) | 1일 | — |
| 9 | 네이버 서치어드바이저 사이트 등록 + 소유권 인증 | 수동 | — |

#### Sprint 3 (월 단위): P2 선별

| # | 작업 | 조건 |
|---|------|------|
| 10 | 네이버 블로그 검색 API — 브랜드 멘션 모니터링 | 콘텐츠 전략 확대 시 |
| 11 | AlsoAsked API — FAQ/PAA 키워드 발굴 자동화 | specs 콘텐츠 확장 시 |
| 12 | CrawlGraph — 경쟁사 백링크 갭 분석 | 링크 빌딩 전략 수립 시 |
| 13 | Screaming Frog CLI — hreflang/기술 SEO 주간 감사 | 다국어 페이지 1,000+ 시 |

### 4-3. 신규 시크릿 필요 목록

| 시크릿명 | 용도 | 발급처 |
|---------|------|--------|
| `BING_WMT_API_KEY` | Bing Webmaster Tools API | BWT Settings > API |
| `NAVER_ADS_CUSTOMER_ID` | 네이버 검색광고 API | manage.searchad.naver.com |
| `NAVER_ADS_API_KEY` | 네이버 검색광고 API | manage.searchad.naver.com > API Manager |
| `NAVER_ADS_SECRET_KEY` | 네이버 검색광고 API | manage.searchad.naver.com > API Manager |
| `NAVER_CLIENT_ID` | 네이버 DataLab/검색 API | developers.naver.com |
| `NAVER_CLIENT_SECRET` | 네이버 DataLab/검색 API | developers.naver.com |

기존 시크릿으로 즉시 가능: GSC 확장 (기존 `GCP_SA_KEY`), GA4 확장 (기존 `GA4_PROPERTY_ID`), PageSpeed API (GCP 프로젝트 API Key)

---

## 5. PF_SPECS 연계

PF_SPECS의 3,500+ 페이지 색인 추적에 직결되는 채널:

| 채널 | PF_SPECS 기여 |
|------|-------------|
| GSC URL Inspection API | **specs 페이지별 색인 상태 배치 확인** — 핵심 KPI 측정 |
| Bing WMT URL Submission | specs 신규 페이지 10,000/일 대량 제출 |
| IndexNow 피드백 루프 | 발송한 색인 요청의 실제 처리 여부 확인 |
| PageSpeed API | specs 페이지 CWV 품질 일괄 점검 |
| 네이버 검색광고 API | "여권사진 규격" 등 specs 타겟 키워드의 네이버 검색량 확보 |

---

## 6. 요약

- **현행 커버리지**: ~25-30% (GA4 30%, GSC 35%, SEO 인프라 15%, 네이버/Bing 0%)
- **P0 3건** (GSC 확장, Bing WMT, 네이버 검색광고): 1주 내 연결 시 커버리지 60%+
- **P1 4건** (GA4 확장, 네이버 DataLab, PageSpeed, 서치어드바이저): 2주 내 연결 시 커버리지 80%+
- **Ubersuggest MCP**: SKIP (별도 보고서 참조)
- **신규 시크릿**: 6건 (작가님 발급 필요)
- **예상 총 공수**: Sprint 1 = 3일, Sprint 2 = 2.5일
