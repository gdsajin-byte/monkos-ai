---
type: completion
date: 2026-04-24
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260424_iMac쌍아→막내2_AEO제안서_트랙3_4_5_정합성검토.md
status: 완료
---

[2026-04-24 18:27 KST] iMac/막내2 → iMac/쌍아

# COMPLETION: AEO 제안서 트랙 3·4·5 정합성 검토

> 코드 수정 없음. 실측·진단만 수행.

---

## 트랙 3: AI referral 추적 스크립트

### 3-1. 현재 GA4 설정 실측

| 항목 | 결과 |
|------|------|
| GA ID | 3개 서비스 동일: `G-JPZWSJ3323` + `G-FKG0CPTC14` |
| gtag 구성 | 기본 `config`만 — custom event **0건** |
| AI referral 추적 코드 | **없음** (document.referrer 사용 코드도 없음) |
| GA4 맞춤 측정기준 | **0건** (빈 배열 확인) |
| GA4 Property ID | `521406894` (monkos-3c6e4) |

### 3-2. `document.referrer` 기술 가능성

| 항목 | 판정 | 근거 |
|------|------|------|
| Referrer-Policy 설정 | 미설정 | 서버 헤더·HTML meta 양쪽 모두 없음 → 브라우저 기본값 `strict-origin-when-cross-origin` |
| cross-origin referrer 내용 | **origin만 전달** | `https://chatgpt.com` (경로 없음) |
| 엔진 식별 가능? | **✅ 가능** | origin만으로 chatgpt.com / perplexity.ai / claude.ai / gemini.google.com 구분 충분 |
| ChatGPT Browse 모드 | **일부 누락 가능** | 서버사이드 fetch → referrer 없음. GA4에 medium `(not set)` 2건으로 실제 확인됨 |

### 3-3. 제안서 코드 검증

**제안서 §3 JS 스니펫 호환성**: ✅ 호환

```javascript
// 제안서 코드 — 기존 gtag 전역 함수와 호환
gtag('event', 'ai_referral_landing', {
  'ai_engine': extractEngine(document.referrer),
  'landing_page': window.location.pathname
});
```

- `gtag()`는 3개 서비스 모든 페이지에 전역 선언 → 추가 의존성 없음
- `extractEngine()`: **미정의** — 구현 필요. 범위는 단순 (5줄 내외 매핑 함수)

**필요 구현**:
```javascript
function extractEngine(ref) {
  if (ref.includes('chatgpt.com')) return 'chatgpt';
  if (ref.includes('perplexity')) return 'perplexity';
  if (ref.includes('claude.ai')) return 'claude';
  if (ref.includes('gemini.google')) return 'gemini';
  if (ref.includes('copilot')) return 'copilot';
  return 'other_ai';
}
```

### 3-4. GA4 맞춤 측정기준 설정

- **MCP로 생성 불가** — Data API는 read-only. Admin API 미지원.
- **GA4 관리자 UI에서 수동 생성 필요**:
  - 경로: GA4 → 관리 → 데이터 표시 → 맞춤 정의 → 맞춤 측정기준 만들기
  - 이름: `ai_engine`, 범위: 이벤트, 이벤트 매개변수: `ai_engine`

### 3-5. 실측 ChatGPT referral 데이터 (GA4 60일)

| Source | Medium | Sessions | Users | Engagement | Avg Duration |
|--------|--------|----------|-------|-----------|-------------|
| chatgpt.com | referral | 4 | 3 | **100%** | **761초 (12.7분)** |
| chatgpt.com | (not set) | 2 | 2 | 0% | 7초 |
| chatgpt.com | (none) | 1 | 1 | 0% | 11초 |
| **합계** | | **7** | **6** | — | — |

- 제안서 "6 sessions / 5 users" → 실측 **7 sessions / 6 users** (제안서 작성 후 1건 추가 추정)
- `referral` medium 4건의 100% engagement + 12.7분 체류 = **진성 유저 확정**
- `(not set)` 2건은 ChatGPT Browse(서버사이드 fetch) 추정 — referrer 없이 direct-like 진입

---

## 트랙 4: AEO 콘텐츠 파이프라인

### 4-1. 기존 콘텐츠 자산 실측 (Firestore 직접 조회)

| 항목 | 수치 |
|------|------|
| `blog_posts` published 총 | **211건** |
| ko | 66건 |
| ja | 73건 |
| en | 72건 |
| **FAQ-like 콘텐츠** (제목에 질문형 패턴) | **81건 (38%)** |

- 이미 상당수가 AEO 친화적 구조 (질문형 제목 + 다국어 번역 완료)
- 예: "AI로 증명사진 만들기 진짜 가능할까?", "AI Photo ID vs Studio — What's the Difference?" 등
- **단, 국가별 규격 전용 블로그는 없음** → 트랙 4 "20편"은 새 카테고리

### 4-2. specs 페이지 현황 실측

| 항목 | 수치 |
|------|------|
| specs-data.json 규격 수 | **26개** |
| 한국 규격 | 5 (여권, 이력서, 반명함, 운전면허, 주민등록) |
| 일본 규격 | 4 (여권, 이력서, 마이넘버, 반명함, 재류카드) |
| 미국 규격 | 2 (여권/비자, Headshot) |
| EU 규격 | 5 (EU여권, 스페인, 독일, EU이력서, 영국) |
| 기타 | 10 (호주, 캐나다, 싱가포르, 태국, 인도, 중국×2, 베트남, 인도네시아) |
| 서빙 방식 | SSR (render.js — 정적 HTML 없음) |
| JSON-LD 스키마 | **✅ Article + FAQPage + HowTo 트리플 스택 이미 구현** |
| FAQ 데이터 | **✅ 3언어 (ko/ja/en) 포함** |
| hreflang | **✅ ko/ja/en + x-default** |
| Sitemap | **✅ 26규격 × 3언어 = 78 URL 등록** |

**핵심 판정**: 제안서 트랙 1(구조화 데이터 강화)이 요구하는 **FAQPage + HowTo 스키마가 specs 페이지에는 이미 완비**. 트랙 1의 실제 작업 범위는:
- `/app`, `/crop` 등 **제품 페이지**에 Service 스키마 추가 (미적용)
- 블로그 포스트 상단 TL;DR 블록 추가 (미적용)
- `og:description` 질문형 최적화 (부분 적용)

### 4-3. 트랙 4 콘텐츠 vs 기존 자산 중복 여부

| 제안서 초기 20편 | 기존 specs | 기존 블로그 | 판정 |
|----------------|-----------|-----------|------|
| 한국 여권 | ✅ specs 있음 | 일부 관련 글 | 블로그 전용 AEO 편 신규 필요 |
| 한국 이력서 | ✅ specs 있음 | 한일비교 글 | 단독 글 신규 필요 |
| 일본 여권 | ✅ specs 있음 | — | 신규 필요 |
| 일본 이력서 | ✅ specs 있음 | 한일비교 글 | 단독 글 신규 필요 |
| 미국 여권 | ✅ specs 있음 | — | 신규 필요 |
| ICAO 국제 표준 | 부분 | — | 신규 필요 |
| 11~20위 기타국 | ✅ specs 있음 | — | 신규 필요 |

**결론**: specs 데이터 인프라(26개 규격 + 3언어 FAQ)는 이미 탄탄. 트랙 4 블로그는 이 데이터를 **AEO 친화 편집(질문형 + TL;DR + 심화 가이드)**으로 재가공하는 작업.

### 4-4. 블로그 발행 파이프라인 확인

- CMS 구조: Firestore `blog_posts` → 어드민 에디터 (`/admin/blog-edit.html`) → 자동번역 (`translate.js`) → 3언어 발행
- 발행 경로: `/blog/{slug}` (ko), `/ja/blog/{slug}` (ja), `/en/blog/{slug}` (en)
- 자동번역: `translate.js`가 Vertex AI로 ko→ja/en 번역 후 별도 document 생성

---

## 트랙 5: 리소스 배분 재정비

### 5-1. GA4 채널별 실측 (60일)

| 채널 | Sessions | Users | Engagement | Avg Duration | Conversions |
|------|----------|-------|-----------|-------------|------------|
| **Paid Search** | **1,896** | 1,707 | **18.1%** | **36초** | 0 |
| Direct | 359 | 247 | 39.3% | 242초 | 0 |
| Organic Search | 123 | 69 | 43.1% | 246초 | 0 |
| Organic Social | 91 | 67 | 45.1% | 96초 | 0 |
| Cross-network | 75 | 75 | 42.7% | 53초 | 0 |
| **Referral** | **74** | **16** | **63.5%** | **412초** | 0 |
| Display | 34 | 32 | 5.9% | 13초 | 0 |
| Paid Video | 19 | 18 | 10.5% | 61초 | 0 |

**핵심 대비**:

| 지표 | Paid Search | ChatGPT (referral 4건) | 배율 |
|------|-----------|----------------------|------|
| Engagement Rate | 18.1% | 100% | **5.5×** |
| Avg Duration | 36초 | 761초 | **21×** |
| 결제 전환 | 0 | 0 | — |

### 5-2. Paid Search CPC/비용 데이터

- **GA4에 비용 데이터 없음** — Google Ads 연동(Data Import 또는 Linked Accounts) 미설정 추정
- CPC 단가·총 비용은 **Google Ads 콘솔에서만** 확인 가능
- GA4 Conversions: **모든 채널 0** → 전환 이벤트(결제 완료 등) 자체가 GA4에 미설정

### 5-3. 제안서 트리거(20/50 sessions) 현실성

| 항목 | 현재 | 제안 트리거 | 갭 |
|------|------|----------|-----|
| ChatGPT 주간 sessions | ~0.8건 | 20건 | **25배** |
| AI referral 합계 주간 | ~0.8건 | 50건 | **63배** |

- **도달 시점 추정 근거 없음** — AEO 콘텐츠 발행 후 ChatGPT 인덱스 반영 속도 자체가 미지수
- 트리거 구조(조건부 예산 이동)는 합리적이나, "언제 도달하는가"는 **측정 불가**
- 제안: 트리거를 "주간 N건" 대신 **"4주 이동평균 N건"**으로 완화 → 일시 스파이크에 반응 방지

---

## 종합 정합성 판정

| 트랙 | 제안서 주장 | 실측 검증 | 판정 |
|------|----------|----------|------|
| 트랙 3 | AI referral 추적 코드 부재 | ✅ 사실 — custom event 0건 | **정합** |
| 트랙 3 | `document.referrer` 감지 가능 | ✅ 가능 (origin 레벨) | **정합** |
| 트랙 3 | `extractEngine` 함수 | ⚠️ 미정의 — 구현 필요 (5줄) | **보완 필요** |
| 트랙 3 | GA4 맞춤 측정기준 | ⚠️ MCP 생성 불가 — 관리자 UI 수동 | **제약 명시 필요** |
| 트랙 4 | blog 208건 | ✅ 실측 211건 | **정합** (미세 차이) |
| 트랙 4 | AEO 템플릿 콘텐츠 0건 | ✅ 국가별 규격 전용 블로그 없음 | **정합** |
| 트랙 4 | specs 구조화 미비 | ❌ **specs에 FAQPage+HowTo 이미 완비** | **불일치 — 트랙 1 범위 축소** |
| 트랙 5 | Paid Search 1,694유저 | ✅ 실측 1,707유저 (60일) | **정합** (시점 차이) |
| 트랙 5 | CPC 비용 데이터 | ❌ GA4에 비용 데이터 없음 | **제약 — Google Ads 콘솔 별도** |
| 트랙 5 | 전환 비교 | ❌ Conversions 0건 — **전환 이벤트 미설정** | **전제 결여** |
| 트랙 5 | 20/50 sessions 트리거 | ⚠️ 현재 0.8건/주 → 도달 시점 미지수 | **구조 OK, 시점 추정 불가** |

---

## 즉시 조치 필요 사항 (제안)

1. **GA4 전환 이벤트 설정** — 결제 완료 이벤트가 GA4에 없으면 채널별 ROI 비교 자체가 불가. 트랙 5 의사결정의 전제조건.
2. **GA4 맞춤 측정기준 `ai_engine` 수동 생성** — 트랙 3 추적 스크립트 배포 전 필수.
3. **트랙 1 범위 재조정** — specs FAQPage+HowTo 이미 완비. 남은 작업은 제품 페이지 Service 스키마 + 블로그 TL;DR.
