---
type: proposal
date: 2026-05-14
from: iMac/민아
to: 작가님, iMac/쌍아
subject: monk.kr 본진 SEO/GEO/AEO 종합 검수 + 네이버 SEO·플레이스 확장 — Phase 2.2 동반 패키지
portfolio: PF_CITADEL
status: 작가님 리뷰 → 쌍아 ORDER 환급 대기
related: PROPOSAL_20260514_민아_CITADEL_Phase22_배포재시작+측정사이클.md
---

# monk.kr 본진 종합 SEO 제안서 — 구글·AI·네이버 3축

**[2026-05-14 12:17 KST] iMac/민아 → 작가님, iMac/쌍아**

---

## 0. 배경

12:00 발행 Phase 2.2 후속 제안서는 **monkos.ai(포털) 위주**. 12:14 monk.kr 본진 검수에서 SEO/GEO/AEO 5개 영역에 결함 다수 발견. 동시에 작가님 지시로 **네이버 SEO + 네이버 플레이스(로컬 SEO)** 차원이 누락된 사실 인지.

→ 본 제안서는 ① monk.kr 본진 결함 보정 + ② 네이버 3축(검색·플레이스·블로그) 확장을 통합한 **종합 패키지**.

CITADEL 비전 갱신 시사점: PF_CITADEL은 그동안 "구글 + AI 엔진" 2축 중심. **네이버(KR 검색 점유율 1위 영역)가 사실상 누락된 상태**. 이는 한국 시장 진입의 본질적 결함.

---

## 1. 현황 정리

### 1-1. monk.kr 본진 검수 결과 (12:14 보고 압축)

| 영역 | 등급 | 핵심 결함 |
|------|------|----------|
| SEO 기본 | B+ | sitemap lastmod 3주 묵음, debate 미등록, test_monkos.html 색인 위험 |
| GEO | A- | llms-full.txt 7주 묵음, monk.kr 본진 정체성(4 카드) 노출 부족 |
| AEO | C+ | FAQPage/HowTo/Person/Breadcrumb JSON-LD 부재 |
| 인프라 | B- | `_headers` 빈 파일 (CSP·X-Frame·Referrer 미설정) |
| 신선도 | C | 콘텐츠 갱신 주기 부재 |

### 1-2. 네이버 3축 현황

| 자산 | 현황 | 비고 |
|------|------|------|
| **네이버 사이트 등록 (Search Advisor)** | ❓ 작가님 확인 필요 | `naver-site-verification` 메타는 존재(`4e800c0d...`) — 등록은 됐으나 사이트맵 제출 여부 불명 |
| **robots.txt Yeti 허용** | ✅ 명시됨 | |
| **`naver:ogtag` 메타** | ❌ 부재 | 네이버 카페·블로그 공유 시 미리보기 깨짐 |
| **네이버 톡톡** | ✅ 연동 (`talk.naver.com/W5UJ45`) | 문의 채널 활성 |
| **네이버 플레이스** | ❓ 작가님 확인 필요 | "몽크스튜디오 / 경기 하남시 미사강변동로 95 B1029" 등록 여부 불명 |
| **네이버 블로그/포스트** | ❌ 콘텐츠 없음 (한송이님 추정) | C-Rank 신호 부재 |
| **네이버 지도 연동** | ❓ 미확인 | 플레이스 등록 시 자동 |
| **네이버 페이** | ❌ 미연동 | 결제 다양화 옵션 |
| **모두(modoo)** | ❌ 미사용 | (선택 사항) |

### 1-3. 누락의 의미

- monk.kr은 한국 도메인 + 한국어 콘텐츠 + 한국 사업장 → **네이버 SEO 1차 타겟**임에도 활용도 낮음
- 5/11 GSC 측정: KR 1,046노출/39클릭 (구글 기준). **네이버 트래픽은 측정조차 안 됨** (GA4 referral에 일부 잡힐 수 있으나 미분석)
- 사진관 비즈니스 = **로컬 검색(네이버 플레이스) 본질적 적합 채널**. 미활용 시 "하남 사진관" "미사 증명사진" 검색 트래픽 손실

---

## 2. 환급 단위 분해 (쌍아 ORDER용)

### 트랙 M: monk.kr 본진 보정 (구글 + AI + AEO)

#### U-M1. sitemap 갱신 + 누락 페이지 등록 + 테스트 페이지 차단 🔴 즉시

**규모**: sitemap.xml 수정 + robots.txt 또는 meta 수정. 5분
**산출물**:
- `MONK_kr/sitemap.xml`: `/debate/` 등록, `/crop/`(있다면) 등록, lastmod 2026-05-14 일괄 갱신
- `MONK_kr/test_monkos.html`: `<meta name="robots" content="noindex, nofollow">` 추가 또는 robots.txt에 `Disallow: /test_monkos.html`

**막내 부담**: ⭐ 단일 막내 5분
**선행 의존**: 없음

---

#### U-M2. `_headers` 보안 헤더 설정 🟠

**규모**: `MONK_kr/_headers` 파일 작성. 15분
**산출물**: CSP·X-Frame-Options·Referrer-Policy·Permissions-Policy 헤더 명시

**제안 헤더**:
```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

⚠️ CSP는 외부 CDN(Tailwind/Google Fonts/FA/Unsplash) 의존성 때문에 단계적 도입 — 우선 Report-Only 모드로 시작 후 violation 수집 → 정식 enforce 권장

**막내 부담**: ⭐ 막내 15분
**선행 의존**: 없음

---

#### U-M3. AEO 강화 — FAQPage + Person + Breadcrumb JSON-LD 🟠 ⭐ 우선

**규모**: `MONK_kr/index.html` 메타 영역에 JSON-LD 3블록 추가. 30분
**산출물**:

```html
<!-- FAQPage (llms.txt FAQ 6건 마크업) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type":"Question","name":"MONKOS는 무엇입니까?","acceptedAnswer":{"@type":"Answer","text":"..."}},
    ...
  ]
}
</script>

<!-- Person (작가님 — 20년 사진사 자산) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "신정규",
  "alternateName": "Shin-jakka",
  "jobTitle": "Founder, Professional Photographer",
  "worksFor": {"@type":"Organization","name":"MONK STUDIO"},
  "knowsAbout": ["Studio Photography","AI Photo Retouching","ICAO 9303 Standards"],
  "url": "https://monk.kr/about"
}
</script>

<!-- BreadcrumbList -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"MONK","item":"https://monk.kr"},
    {"@type":"ListItem","position":2,"name":"몽크사진관","item":"https://monk.kr/monk_studio/monk_studio.html"}
  ]
}
</script>
```

**작가님 결정 필요**:
- Person 스키마에 작가님 실명 노출 의향 (Phase 2.2 Unit-4와 동일 결정 사항 — **여기서 일괄 결정**)
- `/about` 페이지 존재 여부 (없으면 신설 별건)

**막내 부담**: ⭐⭐ 막내 30분
**선행 의존**: Person 스키마 노출 결정

> 💡 **12:00 발행 Phase 2.2 Unit-4(Tier 2-E Organization 스키마)에 monk.kr 본진까지 확장 — 한 번에 처리 가능**

---

#### U-M4. llms.txt + llms-full.txt 갱신 🟠

**규모**: 두 파일 갱신. 30분
**산출물**:
- `monk.kr/llms.txt`: monk.kr 본진 4 카드 구조(스튜디오/AI LAB/B2B/Academy) 명시 추가
- `monk.kr/llms-full.txt`: Last updated 2026-05-14 + 최근 가격 변화(있다면) + 새 서비스(debate POC, MonkosCrop iOS) 반영

**민아 부담**: 민아 직접 (콘텐츠 작성). 30분
**선행 의존**: 없음

---

#### U-M5. monk.kr 하위 페이지 검수 (RESEARCH 별건) 🟡

**대상**: `monk_studio/*`, `ai_lab/*`, `b2b/*`, `Academy/*`, `debate/*`
**산출물**: `RESEARCH_20260515_민아_monk.kr_하위페이지_SEO검수.md` (또는 막내에게 위임)
**검수 항목**: title/description/canonical/hreflang/JSON-LD/이미지 alt/내부 링크 구조

**막내 또는 민아 부담**: 2~4시간
**선행 의존**: 본 제안서 승인 후 별도 ORDER

---

#### U-M6. 외부 CDN/이미지 자체 호스팅 🟡 (중기)

**대상**:
- Tailwind CDN → 빌드 시 inline 또는 자체 호스팅
- Google Fonts (Inter) → 자체 호스팅 (`@font-face`)
- Font Awesome CDN → 자체 호스팅
- Unsplash 4 카드 이미지 → MONK 자체 이미지 (저작권 + LCP)

**막내 부담**: 1~2시간 (빌드 환경 변경 필요)
**선행 의존**: 별건 PF (성능 최적화) 검토 가능

---

### 트랙 N: 네이버 3축 확장 🟢 신규

#### U-N1. 네이버 Search Advisor 사이트맵 제출 + 등록 상태 점검 🔴

**규모**: 네이버 Search Advisor (search.naver.com/webmaster) 접속 + sitemap 제출. 10분
**산출물**:
- 사이트 등록 여부 확인 (`naver-site-verification` 메타는 있으므로 등록은 완료 추정)
- `https://monk.kr/sitemap.xml` Search Advisor 제출
- 색인 현황 확인 + 페이지별 상태 확인
- 검색 노출 점검 도구로 주요 페이지 5건 검사

**작가님 부담**: 작가님 직접 (네이버 ID 로그인 필요) 또는 민아 위임 시 작가님 계정 보유 확인
**선행 의존**: 작가님 네이버 ID 확인

> ⚠️ 네이버는 GSC와 별개 콘솔. 구글 sitemap 제출과 무관하게 별도 제출 필수

---

#### U-N2. 네이버 플레이스 등록·최적화 🔴 ⭐ 핵심

**규모**: 네이버 플레이스(smartplace.naver.com) 등록 + 최적화. 30분~1시간
**산출물**:

**기본 정보**:
- 상호명: 몽크스튜디오
- 업종: 사진관 또는 사진 스튜디오
- 대표자: 신정규
- 주소: 경기도 하남시 미사강변동로 95 B1029
- 전화: 031-791-5030
- 사업자등록번호: 636-15-00574

**최적화 콘텐츠**:
- 사업장 사진 5~10장 (외관·내부·작업물 샘플·작가님 프로필)
- 영업시간 (평일 11:00-19:30)
- 서비스 메뉴 (증명사진·여권사진·프로필·가족사진·그룹사진 + 가격)
- 소개글 (20년 경력 + AI 차별점)
- 키워드: "하남 사진관" "미사 증명사진" "강남 프로필 사진" 등 의도 매칭

**작가님 부담**: 작가님 직접 (사업장 정보 + 사진 준비)
**한송이 또는 와이프 보조**: 사진 촬영·소개글 작성 가능

> 💡 **로컬 SEO 본질** — 사진관 비즈니스의 네이버 노출 1차 채널. 미등록 시 "하남 사진관" 검색 트래픽 0

---

#### U-N3. `naver:ogtag` + 모바일 최적화 메타 추가 🟠

**규모**: `MONK_kr/index.html` 메타 영역 추가. 10분
**산출물**:

```html
<!-- Naver OG Tag (네이버 카페·블로그 공유 시 미리보기) -->
<meta property="naver:ogtag" content="MONK | 몽크사진관 · AI 크리에이티브 플랫폼">

<!-- Naver Modoo 연동 (선택) -->
<meta property="al:web:url" content="https://monk.kr">
```

또한 추가 권고:
- `<meta name="format-detection" content="telephone=yes">` (전화번호 자동 인식)
- `<meta name="apple-mobile-web-app-capable" content="yes">` (iOS PWA 대비)

**막내 부담**: ⭐ 막내 10분 (U-M3와 묶음 가능)
**선행 의존**: 없음

---

#### U-N4. 네이버 블로그 백링크 캠페인 🟠 ⭐ 한송이·꾸 채널

**규모**: 8주 캠페인 (콘텐츠 발행 + 링크)
**산출물**: monk.kr / monkos.ai 백링크 5건+ 확보

**채널별 액션**:

| 채널 | 담당 | 콘텐츠 주제 | 빈도 |
|------|------|------------|------|
| 한송이 네이버 블로그 | 한송이 | 헤어메이크업·증명사진 가이드 + monkos.ai 링크 | 주 2건 |
| 꾸 네이버 블로그 | 꾸(와이프) | 일상 사진 팁·하남 라이프 + monk.kr 링크 | 주 1건 |
| 작가님 직접 블로그 | 작가님 | 20년 사진사 시각 + 기술 인사이트 | 월 2건 |

⚠️ **C-Rank 신호 누적** — 네이버는 컨텐츠 신뢰도(C-Rank) 기반. 단순 백링크보다 **꾸준한 컨텐츠 발행 + 자연스러운 내부 링크**가 효과

**선행 의존**: 한송이·꾸 채널 활성 상태 확인 (작가님 결정)

---

#### U-N5. 네이버 이미지 색인 최적화 🟡

**규모**: index.html + 하위 페이지 이미지 alt 보강. 1~2시간
**산출물**:
- 4 카드 이미지 alt 보강 (현재: "몽크사진관"·"AI LAB"·"B2B"·"Academy" → 키워드 풍부형으로)
- 파일명 영문 SEO 친화 (`monk-photo-studio.jpg` 등)
- og:image alt 명시

예시:
```html
<img src="..." alt="몽크사진관 강남 프리미엄 증명사진 스튜디오 — 신정규 작가">
```

⚠️ Unsplash 외부 이미지는 alt 효과 약함. U-M6 자체 호스팅 후 완전 효과

**막내 부담**: ⭐ 막내 1시간
**선행 의존**: U-M6 또는 일단 alt만 보강

---

#### U-N6. 네이버 톡톡 + 카카오톡 채널 결합 🟡 (선택)

**규모**: footer 채널 다양화. 10분
**산출물**: 현재 네이버 톡톡 단일 → 카카오톡 채널 동시 표기

**작가님 결정 필요**: 카카오톡 채널 운영 의향 (MEMORY.md에 "@monkos(카카오 예정)" 명시 — 현재 미설치)

**막내 부담**: ⭐ 막내 10분 (작가님 카카오 채널 URL 확정 후)

---

## 3. 통합 우선순위 매트릭스

| 단위 | 트랙 | 우선 | 막내 부담 | 작가님 부담 | Phase 2.2 흡수 가능 |
|------|------|------|----------|------------|-------------------|
| U-M1 sitemap+noindex | M | 🔴 즉시 | ⭐ 5분 | — | Unit-1 묶음 |
| U-N1 Search Advisor sitemap | N | 🔴 즉시 | — | 10분 | — |
| U-N2 네이버 플레이스 | N | 🔴 즉시 | — | 30분~1h + 사진 | — |
| U-M3 FAQ+Person+Breadcrumb | M | 🟠 ⭐ | ⭐⭐ 30분 | 결정 1건 | **Unit-4 흡수** |
| U-N3 naver:ogtag | N | 🟠 | ⭐ 10분 (U-M3 묶음) | — | U-M3 묶음 |
| U-M2 _headers 보안 | M | 🟠 | ⭐ 15분 | — | 별도 |
| U-M4 llms.txt 갱신 | M | 🟠 | — | 민아 30분 | U-M3와 동봉 |
| U-N4 네이버 블로그 캠페인 | N | 🟠 | — | 채널 결정 | Unit-5 흡수 |
| U-N5 이미지 alt 보강 | N | 🟡 | ⭐ 1h | — | 별도 |
| U-M5 하위 페이지 검수 | M | 🟡 | 2~4h 또는 민아 | — | 별건 RESEARCH |
| U-M6 외부 CDN 이전 | M | 🟡 (중기) | 1~2h | — | 별건 PF |
| U-N6 카카오톡 채널 | N | 🟡 (선택) | ⭐ 10분 | 채널 URL | 별도 |

---

## 4. 측정 지표 — 네이버 추가

5/11 Phase 2.2 제안서 §4 지표에 네이버 트랙 추가:

| 지표 | 현재 | 4주 목표 | 8주 목표 |
|------|------|---------|---------|
| **네이버 Search Advisor 색인 페이지** | ❓ 미확인 | 15+ | 30+ |
| **네이버 플레이스 등록·노출** | ❓ 미확인 | 등록·노출 | 리뷰 5건+ |
| **"하남 사진관" 네이버 검색 노출** | 0 (추정) | 1페이지 진입 | 상위 5위 |
| **"미사 증명사진" 네이버 검색 노출** | 0 (추정) | 1페이지 진입 | 상위 5위 |
| **네이버 referral 세션 (GA4)** | ❓ 미분석 | 측정 시작 | 월 30+ |
| **네이버 블로그 백링크** | 0 | 2건+ | 5건+ |
| **네이버 이미지 검색 노출** | ❓ 미확인 | 측정 시작 | 일 10+ |

---

## 5. 작가님 결정 필요 사항

| # | 항목 | 잠정 권장 | 비고 |
|---|------|----------|------|
| 1 | U-M1 즉시 실행 (sitemap+noindex) | **즉시** | 5분 작업 |
| 2 | U-M3 Person 스키마 — 작가님 실명 노출 의향 | **노출 권장** (20년 사진사 자산) | Phase 2.2 Unit-4와 일괄 결정 |
| 3 | U-N1 Search Advisor — 작가님 직접 vs 민아 위임 | 작가님 계정 정보 공유 시 민아 위임 가능 | 보안 결정 |
| 4 | U-N2 네이버 플레이스 등록 시점 | **즉시 착수** | 사진관 비즈니스 핵심 채널 |
| 5 | U-N2 사업장 사진 5~10장 준비 가능 시점 | 한송이·작가님 분담 | 일정 협의 |
| 6 | U-N4 네이버 블로그 채널 활성화 — 한송이·꾸 의향 확인 | 우선 한송이 (현행 활동성) | 별도 텔레그램 협의 |
| 7 | U-N6 카카오톡 채널 운영 의향 | 우선 보류 (네이버 톡톡 단일 유지) | MEMORY.md "카카오 예정" 보류 사유 |
| 8 | U-M5 하위 페이지 검수 주체 (민아 vs 막내 위임) | 막내 위임 (검수 패턴 정립됨) | 별건 ORDER |
| 9 | U-M6 외부 CDN 자체 호스팅 PF 신설 여부 | 보류 (Phase 2.2 결산 후 재평가) | |

---

## 6. 환급 로드맵

```
[Day 0 — 5/14 오늘]
  U-M1 sitemap+noindex (막내 5분) ← 🔴
  U-N1 Search Advisor sitemap 제출 (작가님/민아 10분) ← 🔴
  U-N2 네이버 플레이스 등록 착수 (작가님 30분~1h) ← 🔴 ⭐ 핵심
  
[Day 1~7]
  U-M3 FAQ+Person+Breadcrumb JSON-LD (Phase 2.2 Unit-4 통합) ← 🟠 ⭐
  U-N3 naver:ogtag (U-M3 묶음)
  U-M2 _headers 보안 설정 ← 🟠
  U-M4 llms.txt 갱신 (민아) ← 🟠
  U-N4 네이버 블로그 캠페인 채널 활성화 (한송이·꾸 협의)
  
[Day 7 — 5/21]
  Phase 2.2 Unit-3 측정 사이클 (12:00 제안서) → 분기 결정
  네이버 측정 신호도 동시 수집 시작
  
[Day 7~]
  U-N5 이미지 alt 보강
  U-M5 하위 페이지 검수 RESEARCH 발행
  
[Week 4~8]
  네이버 플레이스 리뷰 5건+ 캠페인
  네이버 블로그 백링크 5건+ 누적
  Phase 2.2 + monk.kr + 네이버 종합 8주 결산
```

---

## 7. 쌍아 환급 시 묶음 제안

| 묶음 | 포함 단위 | 단일 ORDER 발행 가능 여부 |
|------|----------|------------------------|
| **묶음 1 — 즉시 코드 보정** | U-M1 + U-N3 | ✅ 하나로 묶어도 15분 |
| **묶음 2 — JSON-LD 패키지** | U-M3 (FAQ+Person+Breadcrumb) + Phase 2.2 Unit-4 (Organization 확장) | ✅ 통합 ORDER 권장 |
| **묶음 3 — 보안·콘텐츠** | U-M2 + U-M4 | ✅ 막내 1명 1시간 |
| **묶음 4 — 네이버 채널** | U-N1 + U-N2 | ❌ 작가님 직접 작업 (계정 + 사진 준비) |
| **묶음 5 — 외부 채널** | U-N4 | ❌ 한송이·꾸 협의 → works 채널 |
| **별건 RESEARCH** | U-M5 | ✅ 별도 ORDER |
| **별건 중기** | U-M6, U-N5, U-N6 | 보류 |

---

## 8. 요약

**한 줄**: monk.kr 본진 SEO/GEO/AEO 결함 6건 보정 + 네이버 3축(Search Advisor·플레이스·블로그) 신규 진입을 단일 패키지로 처리. PF_CITADEL Phase 2.2와 직접 통합.

**핵심 전환**:
- CITADEL = "구글 + AI" → **"구글 + AI + 네이버"** 3축 확장
- 네이버 플레이스 = 사진관 비즈니스의 본질적 채널 (미등록 = 한국 로컬 검색 0)
- AEO = "FAQ만" → **"FAQ + Person + Breadcrumb"** AI 인용 신호 강화

**쌍아 환급 형태**: 묶음 1·2·3을 단일 ORDER 3건으로 빠르게 환급 가능. 묶음 4·5는 작가님·외부 채널 결정 후 별도 진행.

**예상 효과 (8주)**:
- 네이버 referral 월 30+ 신규 채널
- "하남 사진관" "미사 증명사진" 로컬 검색 상위 진입
- AEO 강화로 ChatGPT/Claude 인용 빈도 증가
- monk.kr 콘텐츠 신선도 회복

---

*[2026-05-14 12:17 KST] iMac/민아 작성. PROPOSAL_20260514_민아_CITADEL_Phase22_배포재시작+측정사이클.md의 동반 패키지. 쌍아 ORDER 환급 대기.*
