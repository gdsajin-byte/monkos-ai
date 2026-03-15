# SEO_files — 서비스 공통 SEO 자산 + 템플릿

> 새 서비스/페이지 배포 시 여기서 복사 → 값만 채우면 SEO 세팅 완료.
> `{{}}` 부분을 서비스에 맞게 교체.

---

## 구조

```
SEO_files/
├── logo/                    ← 로고·아이콘 원본
│   ├── monkos-icon.svg          벡터 마스터
│   ├── favicon-16~512.png       브라우저·PWA·SERP용
│   ├── monkos-icon-1024.png     래스터 마스터
│   ├── apple-touch-icon.png     iOS 홈화면 (180x180)
│   └── og-image-sample.png      OG 이미지 샘플 (1200x630)
│
├── templates/               ← 복사해서 쓰는 템플릿
│   ├── json-ld/
│   │   ├── WebApplication.json  웹앱 (포털)
│   │   ├── Service.json         서비스 (증명사진 등)
│   │   ├── FAQPage.json         FAQ 리치결과
│   │   ├── Organization.json    조직 정보
│   │   └── LocalBusiness.json   오프라인 매장 (몽크사진관)
│   ├── meta-tags.html           og:* + twitter:* + favicon 링크
│   ├── gtag.html                Google Analytics + Ads 전환 태그
│   ├── hreflang.html            다국어 연결 (양방향 규칙)
│   ├── robots.txt               크롤러 접근 제어
│   ├── sitemap.xml              사이트맵 뼈대
│   └── manifest.json            PWA 매니페스트
│
└── README.md
```

---

## 새 서비스 배포 체크리스트

### 1단계: 파일 복사
- [ ] `logo/` → `public/` (favicon-32, favicon-192, monkos-icon.svg, apple-touch-icon)
- [ ] `templates/robots.txt` → `public/robots.txt`
- [ ] `templates/sitemap.xml` → `public/sitemap.xml`
- [ ] `templates/manifest.json` → `public/manifest.json`
- [ ] og-image.png 제작 → `public/og-image.png` (1200x630, 서비스별 디자인)

### 2단계: HTML head 삽입
- [ ] `templates/meta-tags.html` 내용을 `<head>`에 삽입 → `{{}}` 교체
- [ ] `templates/gtag.html` 내용을 `<head>` 최상단에 삽입
- [ ] `templates/hreflang.html`에서 해당 서비스 블록 선택 → 삽입
- [ ] JSON-LD: 적합한 스키마 선택 → `<script type="application/ld+json">` 삽입

### 3단계: 검증
- [ ] Google Rich Results Test — JSON-LD 검증
- [ ] Google Search Console — URL 검사 → 인덱스 요청
- [ ] PageSpeed Insights — 메타/파비콘 경고 확인
- [ ] SNS 미리보기 — og:image 표시 확인

---

## Google 태그 ID

| ID | 용도 | 비고 |
|----|------|------|
| G-JPZWSJ3323 | Google Analytics 측정 | 전 서비스 공통 |
| G-FKG0CPTC14 | Google Ads 전환 추적 | 전 서비스 공통, 빠지면 스마트 비딩 중단 |

---

## 현재 서비스별 SEO 현황

| 항목 | monkos.ai | idphoto-kr | idphoto-jp | monk.kr |
|------|-----------|------------|------------|---------|
| favicon | △ SVG+32 | △ SVG+32 | △ SVG+32 | △ SVG+32 |
| favicon-192 | ❌ | ❌ | ❌ | ❌ |
| og:image | ❌ | ✅ | ✅ | ❌ |
| gtag | ✅ | ✅ | ✅ | ❌ |
| JSON-LD | ✅ WebApp | ✅ Service+FAQ | ✅ Service+FAQ | ✅ Org |
| sitemap | ✅ | ❌ | ❌ | ✅ |
| robots.txt | ✅ | ✅ | ✅ | ✅ |
| manifest | ❌ | ❌ | ❌ | ❌ |
| hreflang | ✅ | ✅ | ✅ | — |

---

> 원본 출처: 철창이/로고 (2026-03-07 제작)
> 최종 갱신: 2026-03-15 iMac/쌍아
