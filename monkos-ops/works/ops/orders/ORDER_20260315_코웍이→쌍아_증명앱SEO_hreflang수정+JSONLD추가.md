# 지시서 — 증명앱 SEO: hreflang 오류 수정 + JSON-LD 추가

**[2026-03-15 06:33 KST] M1/코웍이 → M1/쌍아 → 막내**
근거: 쌍아 SEO 조사 결과 (2026-03-15)

---

## Task 1 — JP hreflang 오류 수정 (긴급 버그)

### 현상
JP 페이지(`idphoto-jp.monkos.ai`)에서 한국어 alternate가 잘못된 도메인 가리킴:

```html
<!-- 현재 (오류) -->
<link rel="alternate" hreflang="ko" href="https://monkos.ai">

<!-- 수정 -->
<link rel="alternate" hreflang="ko" href="https://idphoto-kr.monkos.ai">
```

### 올바른 양방향 구조
```
KR 페이지: hreflang="ja" → idphoto-jp.monkos.ai  ✅ (이미 정상)
JP 페이지: hreflang="ko" → idphoto-kr.monkos.ai  ← 이것만 수정
```

대상 파일: `idphoto-jp` 서비스의 HTML head 또는 hreflang 생성 로직

---

## Task 2 — JSON-LD 구조화 데이터 추가

### 대상: KR + JP 양쪽 모두

#### 2-A. Service 스키마 (메인 페이지)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "AI 증명사진 | MONKOS AI",
  "description": "셀카 한 장으로 여권사진·이력서사진·비자사진 완성. 사진관 품질의 AI 리터칭 + 발급 보장.",
  "provider": {
    "@type": "LocalBusiness",
    "name": "몽크스튜디오",
    "url": "https://monkos.ai"
  },
  "areaServed": "KR",
  "url": "https://idphoto-kr.monkos.ai",
  "offers": {
    "@type": "Offer",
    "price": "9900",
    "priceCurrency": "KRW",
    "description": "AI 증명사진 1회 (생성+고화질 다운로드)"
  }
}
</script>
```

JP 버전은 언어/통화/도메인만 교체:
- `name`: `AIプロフィール写真 | MONKOS AI`
- `areaServed`: `JP`
- `url`: `https://idphoto-jp.monkos.ai`
- `price`: `990` / `priceCurrency`: `JPY`

#### 2-B. FAQPage 스키마 (KR)

자주 묻는 질문 구글 SERP 직접 노출용:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "AI 증명사진은 실제 여권 발급에 사용할 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "네, MONKOS AI는 여권·이력서·비자 등 공식 규격에 맞춰 제작하며 발급 보장을 제공합니다. 반려 시 100c를 지급합니다."
      }
    },
    {
      "@type": "Question",
      "name": "증명사진 가격은 얼마인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "1회 ₩9,900으로 생성과 고화질 다운로드가 포함됩니다. 첫 로그인 시 10c 보너스가 제공됩니다."
      }
    },
    {
      "@type": "Question",
      "name": "스마트폰 셀카로도 가능한가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "네, 전면 카메라 셀카 한 장으로 배경 제거·조명 보정·피부 리터칭이 자동으로 처리됩니다."
      }
    }
  ]
}
</script>
```

JP 버전은 일본어로 동일 내용 번역 적용.

---

## Task 3 — Twitter Card 추가 (간단, 2줄)

KR + JP 양쪽 `<head>`에 추가:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@monkos_ai">
```

---

## Task 4 — meta robots 명시 (선택, 낮음)

```html
<meta name="robots" content="index, follow">
```

기본값이 index,follow이므로 낮은 우선순위. Task 1~3 완료 후 처리.

---

## 배포 순서

1. Task 1 (hreflang 오류) — 즉시, KR·JP 배포
2. Task 2 (JSON-LD) — Task 1 직후
3. Task 3 (Twitter Card) — 같이 처리
4. Task 4 — 마지막

---

## 검증

- [ ] JP 페이지 hreflang="ko" → `idphoto-kr.monkos.ai` 확인
- [ ] KR/JP 양쪽 JSON-LD 유효성 검사 (Google Rich Results Test)
- [ ] Twitter Card 미리보기 확인

---

*원본: M1/코웍이 | 2026-03-15 06:33 KST*
