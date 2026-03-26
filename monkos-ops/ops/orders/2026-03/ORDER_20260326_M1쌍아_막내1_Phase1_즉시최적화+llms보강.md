---
type: ORDER
id: ORDER_20260326_M1쌍아_막내1_Phase1_즉시최적화+llms보강
date: 2026-03-26 02:56 KST
from: M1/쌍아
to: M1/막내1
subject: Phase 1 Step 1 — 기존 페이지 즉시 SEO 최적화 + llms-full.txt 보강
priority: high
reference: REPORT_20260326_민아_Phase1_프로그래매틱GEO_실행제안서.md
status: pending
---

# 지시서 — Phase 1 Step 1: 기존 페이지 즉시 SEO 최적화

**[2026-03-26 02:56 KST] M1/쌍아 → M1/막내1**

---

## 목적

기존 Crop/Guide 페이지의 SEO 메타 보강 + llms-full.txt 규격 상세 테이블 추가. 코드 수정만으로 즉시 검색 노출 개선.

---

## 작업 1: Crop 페이지 메타 보강

**파일**: `monkos_AI/portal/public/crop/index.html`

현재 상태: 정적 HTML, SEO 메타 부실 (title만 있고 description/OG/JSON-LD 없음)

### 수정 사항

`<head>` 내에 아래 추가:

```html
<title>증명사진 무료 크롭 — 여권 3.5×4.5cm · 반명함 3×4cm ICAO 규격 | MONKOS</title>
<meta name="description" content="여권·신분증(3.5×4.5cm) 반명함(3×4cm) 증명사진을 ICAO 국제 규격에 맞춰 무료 크롭. 서버 전송 없이 브라우저에서 즉시 처리.">
<meta property="og:title" content="증명사진 무료 크롭 — ICAO 규격 | MONKOS">
<meta property="og:description" content="여권·신분증·반명함 증명사진을 ICAO 규격에 맞춰 무료 크롭. 브라우저에서 즉시 처리.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/crop">
<link rel="canonical" href="https://monkos.ai/crop">
```

`<html>` 태그에 `lang="ko"` 속성 확인/추가 (구글 번역 "작물" 방지).

`<head>` 하단에 JSON-LD 추가:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MONKOS Crop",
  "applicationCategory": "PhotographyApplication",
  "operatingSystem": "Web Browser",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
  "description": "여권·신분증·반명함 증명사진을 ICAO 국제 규격에 맞춰 무료 크롭하는 웹 도구",
  "url": "https://monkos.ai/crop",
  "publisher": { "@type": "Organization", "name": "Monk Studio" }
}
</script>
```

---

## 작업 2: Guide 페이지 메타 보강

**파일**: `monkos_AI/portal/lib/cms/render.js`
**함수**: `guideFragment()` (라인 1099~1242)

### 수정 사항

title 변경:
- 현재: `사용 가이드 | MONKOS AI` (또는 유사)
- 변경: `AI 증명사진 촬영 가이드 — 여권·이력서 규격별 촬영법 | MONKOS`

description 변경:
- `AI로 여권·이력서용 증명사진을 촬영하는 4단계 가이드. 규격 선택부터 다운로드까지.`

seoMeta에 HowTo JSON-LD 추가:

```javascript
const guideJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "AI 증명사진 촬영 가이드",
  "description": "AI로 여권·이력서용 증명사진을 촬영하는 방법",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "규격 선택", "text": "여권, 이력서 등 용도에 맞는 증명사진 규격을 선택합니다." },
    { "@type": "HowToStep", "position": 2, "name": "셀카 촬영", "text": "밝은 곳에서 흰 배경 앞에 셀카를 촬영합니다." },
    { "@type": "HowToStep", "position": 3, "name": "AI 리터칭", "text": "AI가 배경 제거, 얼굴 보정, 규격 크롭을 자동 처리합니다." },
    { "@type": "HowToStep", "position": 4, "name": "다운로드", "text": "완성된 증명사진을 다운로드합니다." }
  ]
});
```

seoMeta에 `<script type="application/ld+json">${guideJsonLd}</script>` 추가.

hreflang 추가 (블로그 패턴 준용):
```javascript
<link rel="canonical" href="https://monkos.ai/guide">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/guide">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/guide">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/guide">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/guide">
```

---

## 작업 3: llms-full.txt 규격 상세 테이블 보강

**파일**: `MONK_kr/llms-full.txt`

현재 "Supported Photo Specifications" 섹션(22줄)을 아래로 확장:

```
## Photo Specifications by Country

### Korea (한국)
| Type | Size | Pixels (300dpi) | Use |
|------|------|-----------------|-----|
| Passport/ID (여권·신분증) | 35×45mm | 413×531px | 여권, 주민등록증, 운전면허 |
| Half-size (반명함) | 30×40mm | 354×472px | 이력서, 학생증, 자격증 |
| Business card (명함판) | 50×70mm | 591×827px | 공무원증, 택시자격증 |

#### Korea Passport Photo Requirements
- Background: Solid white, no shadows
- Head height: 3.2~3.6cm (crown to chin)
- Expression: Neutral, mouth closed
- Glasses: Not allowed (since 2021)
- Validity: Within 6 months
- File: JPEG, under 500KB
- Top 5 rejection reasons: shadow on background, head tilt, hair covering forehead, uneven lighting, wrong size

### Japan (日本)
| Type | Size | Pixels (300dpi) | Use |
|------|------|-----------------|-----|
| Passport (パスポート) | 35×45mm | 413×531px | 여권, マイナンバーカード |
| Resume (履歴書) | 30×40mm | 354×472px | 이력서(就活), 資格証 |
| Visa | 45×45mm | 531×531px | 査証申請 |

#### Japan Passport Photo Requirements
- Background: Solid white or light gray
- Head height: 70~80% of frame (34±2mm)
- Expression: Neutral
- Glasses: Allowed if no glare
- Validity: Within 6 months

### USA
| Type | Size | Pixels (300dpi) | Use |
|------|------|-----------------|-----|
| Passport/Visa | 2×2 inch (51×51mm) | 600×600px | Passport, Visa, Green Card |

#### USA Passport Photo Requirements
- Background: Plain white
- Head height: 1~1⅜ inches (25~35mm)
- Expression: Neutral with both eyes open
- Glasses: Not allowed (since 2016)
- Validity: Within 6 months
```

기존 요약형 테이블은 삭제하고 위 내용으로 교체. Last updated 날짜를 2026-03-26으로 갱신.

---

## 검증

1. 로컬 서버 실행 후 `/crop` 접속 → 메타 태그 확인 (페이지 소스 보기)
2. `/guide` 접속 → title, JSON-LD 확인
3. llms-full.txt 내용 확인
4. 기존 기능 깨짐 없는지 `/blog`, `/faq`, 홈 확인

---

## 완료 보고

```
✅ Crop 메타 보강: title/description/OG/canonical/JSON-LD
✅ Guide 메타 보강: title/description/HowTo JSON-LD/hreflang
✅ llms-full.txt 규격 테이블 확장
📁 변경 파일 목록
```
