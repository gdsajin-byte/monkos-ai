---
type: report
date: 2026-06-15
device: iMac
agent: 막내2
portfolio: PF_SPREAD
status: 완료
---

# 발행→유통 멀티 디스트리뷰션 파이프라인 — 감사 + 구현 보고서

> **[2026-06-15 11:14 KST] iMac/막내2 → 작가님**
> 근거: ORDER_20260615_iMac쌍아_막내_SPREAD_발행유통_멀티디스트리뷰션_통합설계.md

---

## Phase 0 — 5축 감사 결과

### A. Cloudflare 봇 차단 실측

| 봇 | monk.kr HTTP | monkos.ai HTTP | 차단 여부 |
|---|---|---|---|
| OAI-SearchBot | 200 | 200 | No |
| PerplexityBot | 200 | 200 | No |
| Claude-SearchBot | 200 | 200 | No |
| ClaudeBot | 200 | 200 | No |
| ChatGPT-User | 200 | 200 | No |
| Googlebot | 200 | 200 | No |
| Yeti (Naver) | 200 | 200 | No |

**결론**: HTTP 레벨 차단 없음. 모든 봇이 200 응답 수신. CF challenge-platform 스크립트는 존재하나 passive (능동 차단 아님).

**단, robots.txt 레벨에서 문제 발견** → 축B 참조.

---

### B. robots.txt + AI 크롤러 감사

#### 🔴 CRITICAL — Cloudflare Managed Content 주입

monk.kr의 **라이브 robots.txt**에 Cloudflare가 "AI Scrapers and Crawlers" 설정으로 Disallow 규칙을 자동 주입하고 있음:

```
# Cloudflare Managed Content (주입됨)
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /
```

소스 파일은 이들을 Allow하지만, CF 주입이 먼저 적용되어 **사실상 차단 상태**.

> ⚠️ **대시보드 설정 변경 필요** (쌍아/작가님 영역): Cloudflare Dashboard > Security > Bots > AI Scrapers and Crawlers 토글 끄기 또는 선별 설정.

#### 누락 봇 (소스 파일)

| 봇 | 유형 | monk.kr | monkos.ai | 조치 |
|---|---|---|---|---|
| OAI-SearchBot | 검색 | ❌ 누락 | ❌ 누락 | ✅ 추가 완료 |
| Claude-SearchBot | 검색 | ❌ 누락 | ❌ 누락 | ✅ 추가 완료 |
| Claude-Web | 검색 (Q2 2026 신규) | ❌ 누락 | ❌ 누락 | ✅ 추가 완료 |
| Claude-User | 검색 | ❌ 누락 | ❌ 누락 | ✅ 추가 완료 |
| Perplexity-User | 검색 | ❌ 누락 | ❌ 누락 | ✅ 추가 완료 |
| CCBot | 훈련 (차단) | ❌ 미차단 | ❌ 미차단 | ✅ Disallow 추가 |
| Bytespider | 훈련 (차단) | ❌ 미차단 | ❌ 미차단 | ✅ Disallow 추가 |
| Meta-ExternalAgent | 훈련 (차단) | ❌ 미차단 | ❌ 미차단 | ✅ Disallow 추가 |

---

### C. 현행 Indexing 코드 감사

**seo.js — requestIndexing()**:
- Google Indexing API (`urlNotifications:publish`) 사용
- ADC 인증 (Cloud Run SA), 일일 쿼터 200콜 (인메모리 카운터, 인스턴스별 리셋)
- 공식 대상: JobPosting / BroadcastEvent **전용**. 블로그·specs에는 실질 효과 미확인.

**호출 지점 3곳**:
| 위치 | 트리거 | 비고 |
|---|---|---|
| blog.js:178 | 블로그 생성 (published) | 원본 1콜 |
| blog.js:260 | 블로그 수정 (published) | 수정마다 1콜 |
| translate.js:219 | 자동번역 완료 | 언어당 1콜 (JA+EN = 2콜) |

**발행 1건당 총 3콜 소진** (원본 + JA + EN).

**specs 1,335 URL = 능동 색인 통지 0건**. sitemap 의존.

---

### D. sitemap 현황 교차 검증

**monkos.ai** (사이트맵 인덱스 분할 완료 — ORDER_20260614 적용 상태):
- sitemap-static.xml: 20 URL (실제 날짜 사용)
- sitemap-specs.xml: 1,335 URL (일괄 2026-05-26)
- sitemap-blog.xml: 229 URL (Firestore 실갱신일 사용)
- **잔여 이슈**: sitemap index의 static/blog lastmod가 `today` 박제 → ✅ 수정 완료

**monk.kr**:
- 17 URL, 전체 lastmod 2026-05-14
- .html URL 10건이 308 리다이렉트 (CF Pages .html 스트립) → ✅ 수정 완료
- hreflang 없음 (양 도메인 모두) — 별도 작업 필요
- specs URL 없음 (301 리다이렉트 적용 완료 — 정상)

---

### E. 딥리서치 — 기존 보고서 주장 검증

| # | 주장 | 판정 | 근거 |
|---|---|---|---|
| 1 | IndexNow 1콜 → 5개 엔진 동시 전파 | **✅ VERIFIED** | Bing, Yandex, Naver, Seznam, Yep 확인. Google 미참여. |
| 2 | 네이버 IndexNow 지원 | **✅ VERIFIED** | 2023.7~ 지원. Search Engine Land + Naver 공식. |
| 3 | Google Indexing API JobPosting 전용 | **⚠️ PARTIALLY TRUE** | 공식 문서 = 전용. 실무 = 관행상 동작하나 2025~ 스팸 패널티 위험 증가 (John Mueller 경고). |
| 4 | 일본 Bing 36.4% | **✅ VERIFIED** | StatCounter 2026.4 기준 36.38%. 데스크톱·기업 편중. |
| 5 | CF AI 봇 기본 차단 | **✅ VERIFIED** | 2025.7.1~ 전 플랜 적용. "AIndependence" 기능. |
| 6 | Schema.org AI 인용 +20-30% | **❌ CONTESTED** | Semrush 상관 연구 존재. Ahrefs 인과 실험(2026.5)에서 +2.4% (무의미). |
| 7 | 추가 발견 | — | Claude-Web (Q2 2026 신규 분리), llms.txt 10% 채택률, Perplexity UA 위장 보고 |

### 추가 발견 — 보고서에 없던 새로운 인사이트

1. **Claude-Web**: Anthropic이 Q2 2026에 ClaudeBot(훈련)에서 분리한 검색 전용 봇. robots.txt 반영 완료.
2. **Ahrefs 반박 연구**: Schema.org 효과를 +20-30%로 보고한 Semrush 벤치마크에 대해 Ahrefs가 1,885페이지 대조 실험으로 반박 (2026.5.11 발표). AI 인용률 변화 = +2.4% (통계적 무의미).
3. **llms.txt**: 채택률 ~10% (개발자/SaaS 편중). Claude와 Perplexity가 존중. Google은 미대응.
4. **IndexNow 일일 처리량**: 전 세계 50억+ URL/일 처리.

---

## Phase 1 — 구현 결과

### 1-1. robots.txt 보강 ✅

**monk.kr** (`MONK_kr/robots.txt`):
- 검색봇 5종 추가: OAI-SearchBot, Claude-SearchBot, Claude-Web, Claude-User, Perplexity-User
- 훈련봇 3종 차단: CCBot, Bytespider, Meta-ExternalAgent
- Naverbot 명시 추가
- 구조 재정리: Search Engines → AI Search Bots → AI Training Bots

**monkos.ai** (`monkos_AI/portal/public/robots.txt`):
- 동일 보강 적용
- Googlebot 명시 추가

### 1-2. IndexNow 구현 ✅

**키 파일**:
- `monkos_AI/portal/public/4d5a87a9-af3e-44ee-a08c-0d9d63e5ac4e.txt`
- `MONK_kr/4d5a87a9-af3e-44ee-a08c-0d9d63e5ac4e.txt`
- IndexNow 키는 공개 키 (비밀정보 아님 — 헌법 4조 1항 준수)

**seo.js 확장**:
- `requestIndexNow(urls)`: IndexNow POST (단일/배치 지원, 최대 10,000 URL)
- `notifySearchEngines(urls)`: Google Indexing API + IndexNow 병렬 호출 오케스트레이터
- 로깅: `[SEO] IndexNow 성공/실패` 패턴

**blog.js 통합** (2곳):
- `handleBlogCreate:178` — `requestIndexing` → `notifySearchEngines`
- `handleBlogUpdate:260` — `requestIndexing` → `notifySearchEngines`

**translate.js 통합** (1곳):
- `translateAndSaveBlogPost:219` — `requestIndexing` → `notifySearchEngines`

**효과**: 블로그 발행 1건 → Google(관행) + 네이버·빙·얀덱스·Seznam·Yep 동시 통지.

### 1-3. Google Indexing API 정리 ✅

- seo.js 상단에 JobPosting 전용 사실 + 병행 유지 근거 주석 추가
- 함수 삭제하지 않음 (관행상 효과 가능성 + IndexNow로 주 채널 전환)
- 기존 로깅 유지 (`[SEO] Indexing API 성공/실패`)

### 1-4. sitemap 보강 ✅

- **monkos.ai sitemap index**: `today` 박제 제거. static = `2026-06-14` 고정, blog = Firestore 최신 updatedAt 동적 조회.
- **monk.kr sitemap.xml**: .html 확장자 10건 제거 (CF Pages 308 리다이렉트 해소).
- 기존 지시서(ORDER_20260614)와 중복 없음 — 잔여 이슈만 처리.

---

## 미실행 / 후속 과제

| 항목 | 사유 | 권장 |
|---|---|---|
| CF 대시보드 AI 봇 차단 해제 | 준수 조항: 대시보드 설정 변경은 보고만 | 🔴 쌍아/작가님 즉시 실행 필요 |
| specs IndexNow 배치 통지 | 현재 specs에 발행 이벤트 없음 | 별도 admin 엔드포인트 또는 배포 시 스크립트 |
| hreflang 추가 (양 도메인) | 본 지시서 범위 밖 | SEO 향상 기대, 별도 지시서 권장 |
| GPTBot 훈련 차단 검토 | 정책 판단 필요 | 검색 = OAI-SearchBot, 훈련 = GPTBot. 분리 가능 |
| monk.kr lastmod 갱신 | CF Pages 정적 사이트 특성상 수동 관리 | 빌드 시 자동 갱신 스크립트 |

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `MONK_kr/robots.txt` | 검색봇 5종 추가 + 훈련봇 3종 차단 + 구조 재정리 |
| `MONK_kr/sitemap.xml` | .html 확장자 10건 제거 |
| `MONK_kr/4d5a87a9-af3e-44ee-a08c-0d9d63e5ac4e.txt` | IndexNow 키 파일 (신규) |
| `monkos_AI/portal/public/robots.txt` | 검색봇 5종 추가 + 훈련봇 3종 차단 + 구조 재정리 |
| `monkos_AI/portal/public/4d5a87a9-af3e-44ee-a08c-0d9d63e5ac4e.txt` | IndexNow 키 파일 (신규) |
| `monkos_AI/portal/lib/cms/seo.js` | IndexNow 함수 + notifySearchEngines 오케스트레이터 추가 |
| `monkos_AI/portal/lib/cms/blog.js` | requestIndexing → notifySearchEngines 전환 (2곳) |
| `monkos_AI/portal/lib/cms/translate.js` | requestIndexing → notifySearchEngines 전환 (1곳) |
| `monkos_AI/portal/lib/cms/render-sitemap.js` | sitemap index today 박제 제거 + blog lastmod 동적 조회 |
