---
type: order
id: ORDER_20260425_포털AEO통합개편
date: 2026-04-25
from: iMac/쌍아
to: iMac/막내1
subject: monkos.ai 포털 AEO 통합 개편 — specs 경로 확보 + 구조화 데이터 + 헤더 정체성
priority: high
status: 완료 (rev 00230, 2026-04-25 16:09 KST)
affects: monkos_AI/portal/public/index.html, monkos_AI/portal/public/css/portal.css, monkos_AI/portal/public/js/i18n.js
supersedes: ORDER_20260425_메인_구조화데이터_AEO강화 (폐기)
related: PROPOSAL_20260425_민아_포털전체개편_기안서.md
---

# 지시서 — 포털 AEO 통합 개편

## 0. 목적

monkos.ai에는 26개국 증명사진 규격 페이지(`/specs/*`)가 이미 완비되어 있으나,
**메인에서 그곳으로 가는 경로가 사실상 없다**.
봇이든 사람이든 메인을 찍었을 때 "AI 증명사진 26개국 규격 전문 서비스"임을 즉시 인지하고,
specs까지 1홉으로 도달하도록 4가지 경로를 동시에 연다.

## 1. 수정 대상

- `monkos_AI/portal/public/index.html` (49~96행 JSON-LD + 99~104행 헤더 + 148~156행 nav + 178~205행 본문)
- `monkos_AI/portal/public/css/portal.css` (specs 카드 스타일 추가)
- `monkos_AI/portal/public/js/i18n.js` (다국어 카피 추가)

---

## 2. 작업 4건

### 작업 A — H1 서브라인 추가 (사람+봇 동시 인지)

**파일**: `index.html` 99~104행 부근

**현재**:
```html
<div class="hero">
  <div class="hero-label">AI Creative Platform</div>
  <h1>MONKOS <em>AI</em></h1>
  <div class="hero-tag">Photography × AI × K-Beauty</div>
</div>
```

**수정 후**:
```html
<div class="hero"><div class="hero-inner">
  <div class="hero-label">AI CREATIVE PLATFORM</div>
  <h1>MONKOS <em>AI</em></h1>
  <p class="hero-sub" data-i18n="hero_sub">AI 증명사진 · 26개국 규격</p>
</div></div>
```

**변경점**:
- `hero-tag` ("Photography × AI × K-Beauty") → `hero-sub` ("AI 증명사진 · 26개국 규격") 교체
- H1은 유지 (브랜드 보존)
- `data-i18n="hero_sub"` 속성 추가 → i18n.js에서 JA/EN 카피 분기

**i18n.js 추가 키**:
```javascript
hero_sub: {
  ko: 'AI 증명사진 · 26개국 규격',
  ja: 'AI証明写真 · 26カ国規格',
  en: 'AI ID Photos · 26 Countries'
}
```

---

### 작업 B — nav에 "규격" 추가 (봇 1홉 경로)

**파일**: `index.html` 148~156행 부근

**현재**: `홈 / 블로그 / FAQ / 갤러리 / 게시판 / 가격` (6개)

**수정 후**: `홈 / 규격 / 블로그 / FAQ / 가격` (5개)

```html
<nav><div class="n-links">
  <a href="/" class="active" data-i18n="nav_home">홈</a>
  <a href="/specs" data-i18n="nav_specs">규격</a>
  <a href="/blog" data-i18n="nav_blog">블로그</a>
  <a href="/faq" data-i18n="nav_faq">FAQ</a>
  <a href="/pricing" data-i18n="nav_pricing">가격</a>
</div></nav>
```

**변경점**:
- "규격" 신설 (2번째 슬롯 — 홈 다음)
- "갤러리" / "게시판" nav에서 제거 (푸터로 강등 — 게시판 글 0건, 갤러리 플레이스홀더 상태)
- 기존 data-i18n 키 유지, `nav_specs` 신규 추가

**i18n.js 추가 키**:
```javascript
nav_specs: { ko: '규격', ja: '規格', en: 'Specs' }
```

---

### 작업 C — 본문 specs 5권역 카드 섹션 신설 (내부 링크 강화)

**파일**: `index.html` — 인트로 텍스트(`<p class="intro-text">`) **직후**, 서비스 카드(`.svc-grid`) **직전**에 삽입.

```html
<section class="specs-quick">
  <div class="sec-h"><h2 data-i18n="specs_heading">국가별 증명사진 규격</h2><a href="/specs" data-i18n="specs_viewall">전체보기 →</a></div>
  <div class="specs-grid">
    <a href="/specs#korea" class="spec-tile">
      <span class="flag">🇰🇷</span><h4>한국</h4>
      <p>여권·신분증·이력서·반명함·주민등록·운전면허</p>
    </a>
    <a href="/specs#japan" class="spec-tile">
      <span class="flag">🇯🇵</span><h4>日本</h4>
      <p>パスポート·マイナンバー·履歴書·在留·半名刺</p>
    </a>
    <a href="/specs#usa" class="spec-tile">
      <span class="flag">🇺🇸</span><h4>USA</h4>
      <p>Passport · Headshot</p>
    </a>
    <a href="/specs#europe" class="spec-tile">
      <span class="flag">🇪🇺</span><h4>Europe</h4>
      <p>EU · UK · Spain · Germany</p>
    </a>
    <a href="/specs#others" class="spec-tile">
      <span class="flag">🌏</span><h4 data-i18n="specs_others">기타</h4>
      <p>호주·캐나다·중국·베트남 외 8국</p>
    </a>
  </div>
</section>
```

**CSS 추가** (`portal.css`):
```css
.specs-quick { margin: 2rem 0; }
.specs-quick .sec-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.specs-quick .sec-h h2 { font-size: 1.1rem; font-weight: 700; }
.specs-quick .sec-h a { font-size: 0.85rem; opacity: 0.7; }
.specs-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
.spec-tile { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; text-align: center; text-decoration: none; color: inherit; transition: border-color 0.2s; }
.spec-tile:hover { border-color: rgba(255,255,255,0.3); }
.spec-tile .flag { font-size: 1.8rem; display: block; margin-bottom: 0.4rem; }
.spec-tile h4 { font-size: 0.95rem; margin: 0 0 0.3rem; }
.spec-tile p { font-size: 0.75rem; opacity: 0.6; margin: 0; line-height: 1.3; }
@media (max-width: 768px) { .specs-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 480px) { .specs-grid { grid-template-columns: repeat(2, 1fr); } }
```

**앵커 대응**: `/specs` 페이지 렌더러(`lib/cms/render.js` 또는 프론트 JS)에서 각 권역 제목에 `id="korea"`, `id="japan"` 등 앵커 id 부여 확인. 없으면 추가.

---

### 작업 D — JSON-LD 구조화 데이터 강화 (봇 전용 명시 선언)

**파일**: `index.html` 49~86행 — 기존 `@graph` 배열의 **끝에 3개 노드 추가**.
기존 `WebApplication`과 `ItemList`는 그대로 유지.

**추가 노드 1 — WebSite**:
```json
{
  "@type": "WebSite",
  "name": "MONKOS AI — AI 증명사진 · 26개국 규격",
  "url": "https://monkos.ai",
  "inLanguage": ["ko", "ja", "en"],
  "description": "AI-powered ID photo service covering 26 countries. Passport, visa, resume photos with ICAO-compliant specifications. Free crop tool and AI retouching.",
  "keywords": "AI passport photo, AI ID photo, 증명사진 AI, 여권사진, 履歴書 写真, ICAO photo, visa photo, 26 countries ID photo specs"
}
```

**추가 노드 2 — Organization**:
```json
{
  "@type": "Organization",
  "name": "MONKOS",
  "alternateName": ["Monk Studio", "몽크사진관", "몽코스"],
  "url": "https://monkos.ai",
  "logo": "https://monkos.ai/favicon-192.png",
  "sameAs": ["https://monk.kr"],
  "founder": {
    "@type": "Person",
    "name": "Shin JeongKyu",
    "jobTitle": "Photographer & AI Architect"
  },
  "knowsAbout": [
    "AI ID photo generation",
    "ICAO passport photo standard",
    "Passport photo specifications by country",
    "Face landmark detection for photo cropping",
    "AI photo retouching",
    "증명사진 규격",
    "여권사진",
    "履歴書 証明写真",
    "AI 증명사진"
  ],
  "areaServed": ["KR","JP","US","GB","DE","ES","FR","IT","AU","CA","SG","TH","IN","CN","VN","ID"],
  "description": "사진작가 경력 20년·스튜디오 운영 12년차 전문가가 설계한 AI 증명사진 서비스. 26개국 공식 규격 데이터 완비."
}
```

**추가 노드 3 — ProfessionalService + 26국 OfferCatalog**:
```json
{
  "@type": "ProfessionalService",
  "name": "MONKOS AI 증명사진 서비스",
  "serviceType": "AI ID Photo Service",
  "url": "https://monkos.ai",
  "provider": { "@type": "Organization", "name": "MONKOS" },
  "areaServed": ["KR","JP","US","GB","DE","ES","FR","IT","AU","CA","SG","TH","IN","CN","VN","ID"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "26개국 증명사진 규격 가이드",
    "numberOfItems": 26,
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 여권·신분증", "url": "https://monkos.ai/specs/korea-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 반명함 (3×4)", "url": "https://monkos.ai/specs/korea-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 반명함 (이력서)", "url": "https://monkos.ai/specs/korea-halfcard" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 주민등록증", "url": "https://monkos.ai/specs/korea-resident" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 운전면허증", "url": "https://monkos.ai/specs/korea-drivers-license" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 パスポート", "url": "https://monkos.ai/specs/japan-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 マイナンバーカード", "url": "https://monkos.ai/specs/japan-mynumber" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 在留カード", "url": "https://monkos.ai/specs/japan-zairyu" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 履歴書", "url": "https://monkos.ai/specs/japan-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 半名刺写真", "url": "https://monkos.ai/specs/japan-halfcard" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "USA Passport / Visa", "url": "https://monkos.ai/specs/us-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "USA Headshot · LinkedIn", "url": "https://monkos.ai/specs/usa-headshot" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "EU Passport · ID", "url": "https://monkos.ai/specs/eu-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Spain Pasaporte · NIE", "url": "https://monkos.ai/specs/spain-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Germany Bewerbungsfoto", "url": "https://monkos.ai/specs/germany-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "EU CV Photo", "url": "https://monkos.ai/specs/eu-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "UK Passport", "url": "https://monkos.ai/specs/uk-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Australia Passport · ID", "url": "https://monkos.ai/specs/australia-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Canada Passport · ID", "url": "https://monkos.ai/specs/canada-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Singapore Passport · PR", "url": "https://monkos.ai/specs/singapore-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Thailand Passport", "url": "https://monkos.ai/specs/thailand-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "India Passport", "url": "https://monkos.ai/specs/india-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "中国 护照 · 签证", "url": "https://monkos.ai/specs/china-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "中国 简历照片", "url": "https://monkos.ai/specs/china-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Vietnam Hộ chiếu", "url": "https://monkos.ai/specs/vietnam-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Indonesia Paspor", "url": "https://monkos.ai/specs/indonesia-passport" }}
    ]
  },
  "description": "26개국 공식 증명사진 규격 데이터를 완비한 AI 서비스. 각국 여권·비자·이력서·신분증 사진을 ICAO 국제 표준에 맞춰 자동 생성·크롭."
}
```

**기존 ItemList(서비스 5개)도 갱신** — specs 항목 추가:
```json
{ "@type": "ListItem", "position": 3, "name": "26개국 규격 가이드", "url": "https://monkos.ai/specs" }
```
기존 position 3~5는 4~6으로 밀기.

---

## 3. 검증

1. JSON 문법:
   ```bash
   node -e "const h=require('fs').readFileSync('monkos_AI/portal/public/index.html','utf8'); const m=h.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/); JSON.parse(m[1]); console.log('✅ Valid JSON-LD')"
   ```

2. 로컬 서버 확인:
   ```bash
   cd monkos_AI/portal && node server.js
   ```
   - `/` 접속 → 헤더 서브라인 "AI 증명사진 · 26개국 규격" 확인
   - nav "규격" 클릭 → `/specs` 이동 확인
   - 본문 specs 카드 5권역 표시 + 각 타일 클릭 → `/specs#korea` 등 이동 확인
   - 페이지 소스에서 JSON-LD 3개 노드 존재 확인

3. `/specs` 페이지 앵커: `#korea`, `#japan`, `#usa`, `#europe`, `#others` 스크롤 동작 확인. 미동작 시 `renderSpecsList`에 id 부여.

## 4. 배포

`./monkos_AI/portal/deploy.sh`

## 5. 배포 후 실측

```bash
curl -s https://monkos.ai/ | grep -oP '<script type="application/ld\+json">.*?</script>'
curl -s https://monkos.ai/ | grep 'hero-sub'
curl -s https://monkos.ai/ | grep '/specs'
```

⚠️ 준수 조항:
- 배포는 반드시 deploy.sh 경유 (법률 5장 2조)
- 기존 JSON-LD WebApplication 노드 삭제 금지 — 추가만
- `<title>`, `<meta name="description">` 변경 금지 — 이미 좋은 상태

---

**완료 보고**: 수정 → 로컬 검증 → 배포 → curl 실측 → 보고
