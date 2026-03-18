# MONK OS — SEO 표준 템플릿 + B2B 전략

**[2026-03-15 06:53 KST] M1/코웍이 → 작가님**
상태: 전략 초안 (검토 후 확정)

---

## 1. 배경 — 왜 템플릿화인가

MONKOS AI에서 반복적으로 수행하는 SEO 작업들이 있다.
새 서비스/페이지 만들 때마다 누락 → 사후 수정 비용 발생.
이 패턴을 표준화하면:

- **내부**: 새 서비스 런칭 시 SEO 누락 제로
- **외부(B2B)**: monk.kr 홈페이지 제작 서비스에 SEO 패키지로 번들

---

## 2. SEO 표준 체크리스트 (MONK OS 표준)

### Level 1 — 필수 고정 (모든 페이지, 예외 없음)

```html
<!-- 기본 메타 -->
<title>{페이지 제목} | {브랜드명}</title>
<meta name="description" content="{120~160자 요약}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{정규 URL}">

<!-- OG 태그 -->
<meta property="og:type" content="website">
<meta property="og:title" content="{제목}">
<meta property="og:description" content="{요약}">
<meta property="og:image" content="{대표 이미지 URL}">
<meta property="og:url" content="{정규 URL}">
<meta property="og:locale" content="{ko_KR | ja_JP | en_US}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@{트위터핸들}">

<!-- 파비콘 -->
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- 트래킹 -->
<!-- gtag: Google Analytics + Ads 전환 -->
```

### Level 2 — 다국어 (국제화 서비스)

```html
<html lang="{ko|ja|en}">
<link rel="alternate" hreflang="ko" href="{ko URL}">
<link rel="alternate" hreflang="ja" href="{ja URL}">
<link rel="alternate" hreflang="en" href="{en URL}">
<link rel="alternate" hreflang="x-default" href="{기본 URL}">
```

> 규칙: 양방향 필수. A가 B를 가리키면 B도 A를 가리켜야 함.

### Level 3 — 구조화 데이터 JSON-LD (페이지 타입별)

| 페이지 타입 | 적용 스키마 | 효과 |
|------------|------------|------|
| 서비스 메인 | Service + Offer + LocalBusiness | 가격 리치 스니펫 |
| 블로그 포스트 | Article + BreadcrumbList | 날짜/작성자 표시 |
| FAQ 페이지 | FAQPage | 구글 SERP 질문 직접 노출 |
| 로컬 비즈 | LocalBusiness | 지도/영업시간 노출 |
| 제품/앱 | SoftwareApplication | 앱 평점/가격 노출 |

### Level 4 — 인덱싱 인프라

```
sitemap.xml     동적 생성 (CMS 연동, 새 포스트 자동 반영)
robots.txt      크롤러 허용/차단 규칙
GSC 연동        Google Search Console 소유권 인증 + 사이트맵 제출
네이버 SA       네이버 서치어드바이저 연동
```

---

## 3. Cloudflare 표준 세팅 (CF)

```
DNS
├── A/CNAME 레코드 → 서비스 엔드포인트
├── 프록시 ON (주황 구름) — CDN + DDoS 보호
└── 예외: Cloud Run 도메인 매핑은 프록시 OFF (SSL 충돌)

보안
├── HTTPS 강제 리다이렉트
├── HSTS 활성화
├── 보안 헤더 (X-Frame-Options, CSP 등)
└── Bot Fight Mode ON

성능
├── 캐싱: 정적 자산 (CSS/JS/이미지) Edge 캐시
├── HTML: Cache-Control no-cache (SSR 동적 콘텐츠)
└── Image Optimization (WebP 자동 변환)
```

---

## 4. B2B 상업화 방향 — monk.kr 연계

### 현재 monk.kr B2B 포지션

홈페이지 제작 서비스 → 여기에 SEO 패키지를 번들하는 구조.

### 상품 설계 (안)

```
MONK WEB STANDARD
├── 홈페이지 제작 (Cloud Run 또는 CF Pages 배포)
├── SEO Level 1~2 기본 세팅 포함
└── 첫 달 Google Search Console 세팅 + 사이트맵 제출

MONK WEB PRO
├── STANDARD 포함
├── JSON-LD 구조화 데이터 (페이지 타입별)
├── 다국어 (한/일/영)
├── CF 세팅 완전 자동화
└── 월간 SEO 리포트 (트래킹 + 개선 제안)

MONK WEB ENTERPRISE
├── PRO 포함
├── CMS 통합 (블로그/FAQ/갤러리 — MONKOS CMS 기반)
├── 콘텐츠 이관 자동화 (기존 블로그 → 새 CMS)
└── 원클릭 재배포 파이프라인
```

### 원클릭 자동화 파이프라인 (미래)

```
[고객 입력]
도메인, 브랜드명, 서비스 타입, 언어, gtag ID

    ↓

[MONK DEPLOY]
├── CF DNS 레코드 자동 생성
├── HTTPS + 보안 헤더 자동 세팅
├── SEO 메타태그 템플릿 주입
├── JSON-LD 페이지 타입별 자동 생성
├── sitemap.xml 동적 생성
├── Google Search Console API 소유권 인증 + 제출
└── 배포 완료 리포트 생성

[결과]
SEO 즉시 준비된 사이트 납품
```

### 경쟁 우위

- 일반 홈페이지 제작사: SEO는 별도 견적, 수동 작업
- MONK: SEO가 배포 파이프라인에 내장 → 납품 즉시 검색 준비 완료
- MONKOS AI 운용 경험(gtag, hreflang, JSON-LD, CF)이 그대로 상품화

---

## 5. 즉시 실행 vs 나중에

| 항목 | 시점 | 담당 |
|------|------|------|
| MONKOS 내부 SEO 표준 적용 (Level 1~3) | 지금 | 막내 |
| SEO 체크리스트 템플릿 파일화 | 지금 | 코웍이 완료 |
| monk.kr B2B 페이지에 SEO 패키지 메뉴 추가 | 다음 단계 | 쌍아+막내 |
| 원클릭 자동화 파이프라인 | 로드맵 후반 | 설계 필요 |

---

*원본: M1/코웍이 | 2026-03-15 06:53 KST*
*검토 요청: 작가님 → B2B 상품 설계 방향 확인 후 monk.kr 페이지 작업 진행*
