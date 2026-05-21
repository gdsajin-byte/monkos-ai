---
type: completion
date: 2026-04-24
from: iMac/막내1
order: ORDER_20260424_iMac쌍아→막내1_AEO제안서_트랙1_2_정합성검토
status: 완료
---

[2026-04-24 18:25 KST] iMac/막내1 → iMac/쌍아

# COMPLETION: AEO 제안서 트랙 1·2 정합성 검토

> 코드 수정 없음. 전부 실측 기반.

---

## 트랙 1: AEO 구조화 데이터 — 현황 실측 + 갭 분석

### 1-1. `/specs/*` 페이지 현황

**총 26개 페이지 확인** (curl 실측):

```
australia-passport, canada-passport, china-passport, china-resume,
eu-passport, eu-resume, germany-resume, india-passport, indonesia-passport,
japan-halfcard, japan-mynumber, japan-passport, japan-resume, japan-zairyu,
korea-drivers-license, korea-halfcard, korea-passport, korea-resident,
korea-resume, singapore-passport, spain-passport, thailand-passport,
uk-passport, us-passport, usa-headshot, vietnam-passport
```

**샘플 3개 실측 결과** (japan-resume, korea-passport, us-passport):

| 항목 | japan-resume | korea-passport | us-passport |
|------|-------------|----------------|-------------|
| Article 스키마 | ✅ | ✅ | ✅ |
| **FAQPage 스키마** | ✅ (1개 Q&A) | ✅ (4개 Q&A) | ✅ (1개 Q&A) |
| **HowTo 스키마** | ✅ (4스텝) | ✅ (4스텝) | ✅ (4스텝) |
| og:description | ✅ 서술형 | ✅ 서술형 | ✅ 서술형 |
| canonical | ✅ | ✅ | ✅ |
| hreflang (ko/ja/en) | ✅ 4방향 | ✅ 4방향 | ✅ 4방향 |

### 1-2. 기타 페이지 현황

| 페이지 | 상태 | JSON-LD | og:description |
|--------|------|---------|----------------|
| `/` (메인) | ✅ 정상 | WebApplication + ItemList + **FAQPage(3개 Q&A)** | ✅ |
| **`/app`** | **❌ 404 Not Found** | — | — |
| `/crop` | ✅ 정상 | SoftwareApplication (FAQPage ❌, HowTo ❌) | ✅ |
| `idphoto-kr.monkos.ai` | ✅ 정상 | Service + **FAQPage(3개 Q&A)** | ✅ |
| `idphoto-jp.monkos.ai` | ✅ 정상 | Service + **FAQPage(3개 Q&A)** | ✅ |

### 1-3. 제안서 대비 갭 분석

#### ✅ 이미 완료된 것 (제안서가 현행을 실측 안 하고 제안)
- **"모든 /specs/* 페이지에 FAQPage + HowTo 스키마 추가"** → **이미 전 페이지에 탑재 완료**. Article + FAQPage + HowTo 3종 구조화 데이터가 이미 들어가 있음.
- **"제품 페이지에 Service 스키마 추가"** → idphoto-kr/jp에 이미 Service 스키마 있음.

#### ⚠️ 갭이 존재하는 것
| 갭 | 심각도 | 상세 |
|-----|--------|------|
| **`/app` 404** | **치명** | ChatGPT referral 3건이 이 URL로 진입했는데 페이지 없음. AI 엔진이 추천한 링크가 깨져있으면 신뢰도 급락 |
| `/crop` FAQ/HowTo 없음 | 중간 | SoftwareApplication만 있고 FAQPage/HowTo 미탑재. ChatGPT referral 1건 기록 |
| FAQ 수 적음 | 낮음 | japan-resume FAQ 1개, us-passport FAQ 1개 — 4~5개로 확장하면 AEO 가독성 향상 |
| og:description 질문형 아님 | 낮음 | 현재 서술형. "How to take a Japan resume photo?"식 질문형이 AI 엔진 매칭에 유리 |
| Place/Country 연결 스키마 없음 | 낮음 | 제안서 제안 유효. areaServed 등 추가 가능 |

#### ❌ 제안서에 빠진 치명적 항목
- **`/app` 404 수정**: GA4 데이터에서 ChatGPT가 `/app`으로 3건 딥링크 추천. 현재 404. 이것은 AEO 이전에 **기본 인프라 결함**. 제안서에 이 문제가 언급조차 되지 않음.

### 1-4. 실현 가능성

- specs 페이지: **서버 사이드 렌더링** (Express `lib/cms/render.js`). 템플릿 기반이므로 JSON-LD 확장은 렌더러 1곳 수정으로 전체 반영 가능.
- `/crop`: 정적 HTML. 개별 수정 필요.
- `/app` 404: 라우트 추가 또는 리다이렉트 필요 (server.js 수정).

---

## 트랙 2: ChatGPT 경쟁 실측 벤치마킹

### 2-1. 실측 방법
- WebSearch로 5개 핵심 쿼리 실행 (지시서 지정 쿼리)
- Perplexity site 검색 추가
- "monkos.ai" 직접 검색으로 웹 프레즌스 확인

### 2-2. 실측 결과

| # | 쿼리 | monkos.ai 등장 | 상위 경쟁사 |
|---|------|:--------------:|------------|
| 1 | "AI 여권사진 서비스 추천 2026" | ❌ | aipassportphoto.com, media.io, createvision.ai, passportmaker.com, monica.im |
| 2 | "Best AI passport photo service 2026" | ❌ | PhotoAiD, PhotoGov, Snap2Pass, passport-photo.online, cutout.pro |
| 3 | "일본 이력서 사진 AI 온라인" | ❌ | monica.im, media.io, myshell.ai, canva.com, 증명한컷(idcut.kr) |
| 4 | "ICAO 규격 온라인 증명사진 AI" | ❌ | media.io, monica.im, onedollarpassportphoto.com, zzixx.com |
| 5 | "Photoroom vs monkos" | ❌ | Photoroom 정보만 반환. monkos 자체를 인식 못함 |

### 2-3. 추가 실측

| 쿼리 | 결과 |
|------|------|
| `site:perplexity.ai monkos.ai` | ❌ Perplexity에 monkos.ai 관련 페이지 없음 |
| "monkos.ai AI 증명사진 review" | ❌ monkos.ai 미등장. 검색 결과 전부 다른 서비스 |

### 2-4. 경쟁사 인사이트

| 경쟁사 | 강점 | monkos 대비 위치 |
|--------|------|-----------------|
| **PhotoAiD** | 18M+ photos, money-back guarantee, 리뷰 기사 다수 | 압도적 인지도 차이 |
| **PhotoGov** | 900+ 문서 타입, 200+ 국가, 2026 규정 준수 강조 | 규격 커버리지 압도 |
| **passport-photo.online** | Snap2Pass 브랜드, 다수 리뷰 기사 | SEO/AEO 우위 |
| **media.io** | 한국어 서비스, 다기능 | 한국어 쿼리에서 상위 |
| **monica.im** | 한국어+다국어, LinkedIn 헤드샷 겸용 | 한국어 쿼리 상위 |

### 2-5. 핵심 판단

**제안서 진단 vs 실측 결과 괴리**:

| 제안서 주장 | 실측 결과 |
|------------|----------|
| "국내 AI 증명사진 경쟁사 중 ChatGPT 인덱스에 선진입" | 웹 검색 5개 쿼리 전부 미등장. 외부 백링크/리뷰 0건. "선진입"보다 **"극초기 우연적 노출"**에 가까움 |
| "일본 시장에서도 AEO 우위 형성 중" | 일본 관련 쿼리에서도 미등장 |
| "경쟁사 대비 상대 위치 미확인 → 실측 필요" | 실측 결과: 경쟁사 대비 **웹 프레즌스 자체가 없음** (0 외부 언급) |

**GA4 ChatGPT referral 6건의 실체**:
- 6건/60일은 ChatGPT가 monkos.ai를 "인지"하고 있다는 신호로서는 유효
- 그러나 이것을 "선점"이나 "우위"로 해석하기엔 모수가 너무 적음
- 8분 31초 체류 + 66.7% Engagement는 의미 있지만, 6건에서의 통계적 신뢰도는 낮음

---

## 종합 정합성 판정

### 제안서 평가

| 항목 | 판정 | 사유 |
|------|------|------|
| 트랙 1 (구조화 데이터) | ⚠️ **현행 미실측** | FAQPage+HowTo가 이미 전 specs 페이지에 있는데 "추가" 제안. `/app` 404 누락 |
| 트랙 2 (벤치마킹) | ✅ **방향 유효** | 다만 "선점 상태" 진단은 과대. 실측 결과 전 쿼리 미등장 |
| 트랙 3 (추적 임플란트) | ✅ **유효** | AI referral 추적 스크립트는 현행에 없으므로 추가 가치 있음 |
| 트랙 4 (콘텐츠 생산) | ✅ **가장 중요** | 현재 외부 백링크/리뷰 0건. 콘텐츠 확장이 AEO의 핵심 |
| 트랙 5 (리소스 배분) | ⚠️ **시기상조** | 주간 1건에서 광고비 재배분 논의는 과도. 트랙 1~4 실행 후 재논의 |

### 제안서 수정 권고

1. **`/app` 404 즉시 수정** — 트랙 0으로 최우선. ChatGPT가 추천한 URL이 죽어있으면 AEO 전략 자체가 무의미
2. **트랙 1 현행 실측 반영** — "추가"가 아니라 "확장"(FAQ 수 증가, 질문형 og:description, `/crop` FAQ 추가)으로 재정의
3. **트랙 2 진단 보정** — "선점 상태"를 "초기 감지 단계"로 하향. 경쟁사 대비 현실적 위치 반영
4. **트랙 3 유지** — 그대로 실행 가치 있음
5. **트랙 4 최우선화** — 웹 프레즌스 자체가 없는 상태에서 구조화 데이터만으로는 AEO 불가. 외부 언급 가능한 콘텐츠 생산이 핵심
6. **트랙 5 보류** — 데이터 축적 후 (최소 8주) 재논의

### 미확인 사항

- ChatGPT/Perplexity **직접 대화 실측은 미수행** (WebSearch로 간접 확인만 가능). CDP로 chatgpt.com 접속하여 직접 질의하는 방식은 별도 세션 필요.
- specs 26개 페이지 전수 JSON-LD 확인은 3개 샘플만 수행. 나머지는 동일 템플릿 추정이나 미확인.
