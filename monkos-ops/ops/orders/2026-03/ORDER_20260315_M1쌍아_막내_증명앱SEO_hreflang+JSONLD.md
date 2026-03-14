---
type: ORDER
id: ORDER_20260315_M1쌍아_막내_증명앱SEO_hreflang+JSONLD
date: 2026-03-15
from: M1/쌍아
to: 막내
priority: P1
status: 대기
origin: 코웍이 오더 보정 + 쌍아 SEO 조사
---

# 지시서 — 증명앱 SEO: hreflang 수정 + JSON-LD + Twitter Card

**[2026-03-15 06:35 KST] M1/쌍아 → 막내**

---

## 배경

증명앱(idphoto-kr / idphoto-jp) SEO 조사 결과:
- gtag, OG 태그, canonical, hreflang 기본 구조는 완료 상태
- JP hreflang에 버그, JSON-LD 미구현, Twitter Card 미구현

---

## Task 1 — JP hreflang 버그 수정 (긴급)

대상: `idphoto-jp/public/index.html` (또는 hreflang 생성 로직)

```html
<!-- AS-IS (오류) -->
<link rel="alternate" hreflang="ko" href="https://monkos.ai/">

<!-- TO-BE -->
<link rel="alternate" hreflang="ko" href="https://idphoto-kr.monkos.ai/">
```

KR 페이지는 이미 정상 (`hreflang="ja" → idphoto-jp.monkos.ai`). JP만 수정.

---

## Task 2 — JSON-LD 구조화 데이터 추가

KR + JP 양쪽 `<head>`에 추가. **가격 정보(Offer) 넣지 말 것** — 크레딧 체계라 단가 유동적.

### 2-A. Service + LocalBusiness (KR)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "MONKOS AI 증명사진",
  "description": "셀카 한 장으로 여권사진·이력서사진·비자사진 완성. 사진관 품질의 AI 리터칭과 발급 보장.",
  "url": "https://idphoto-kr.monkos.ai",
  "provider": {
    "@type": "LocalBusiness",
    "name": "몽크스튜디오",
    "url": "https://monkos.ai",
    "@id": "https://monkos.ai/#organization"
  },
  "areaServed": {
    "@type": "Country",
    "name": "KR"
  },
  "serviceType": "AI ID Photo Generation",
  "inLanguage": "ko"
}
</script>
```

### 2-B. Service + LocalBusiness (JP)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "MONKOS AI 証明写真",
  "description": "セルフィー1枚でパスポート・履歴書・ビザ写真を作成。写真館品質のAIレタッチと発行保証。",
  "url": "https://idphoto-jp.monkos.ai",
  "provider": {
    "@type": "LocalBusiness",
    "name": "モンクスタジオ",
    "url": "https://monkos.ai",
    "@id": "https://monkos.ai/#organization"
  },
  "areaServed": {
    "@type": "Country",
    "name": "JP"
  },
  "serviceType": "AI ID Photo Generation",
  "inLanguage": "ja"
}
</script>
```

### 2-C. FAQPage (KR)

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
        "text": "네, MONKOS AI는 여권·이력서·비자 등 공식 규격에 맞춰 제작하며 발급 보장을 제공합니다."
      }
    },
    {
      "@type": "Question",
      "name": "스마트폰 셀카로도 가능한가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "네, 전면 카메라 셀카 한 장으로 배경 제거, 조명 보정, 피부 리터칭이 자동으로 처리됩니다."
      }
    },
    {
      "@type": "Question",
      "name": "어떤 종류의 증명사진을 만들 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "여권사진, 이력서사진, 비자사진, 운전면허 사진 등 다양한 공식 규격을 지원합니다."
      }
    }
  ]
}
</script>
```

### 2-D. FAQPage (JP)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "AI証明写真は実際のパスポート申請に使えますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、MONKOS AIはパスポート・履歴書・ビザなどの公式規格に合わせて作成し、発行保証を提供しています。"
      }
    },
    {
      "@type": "Question",
      "name": "スマートフォンのセルフィーでも可能ですか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、フロントカメラのセルフィー1枚で背景除去、照明補正、肌レタッチが自動で処理されます。"
      }
    },
    {
      "@type": "Question",
      "name": "どのような種類の証明写真が作れますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "パスポート写真、履歴書写真、ビザ写真、運転免許証写真など、様々な公式規格に対応しています。"
      }
    }
  ]
}
</script>
```

---

## Task 3 — Twitter Card 추가

KR + JP 양쪽 `<head>`에 OG 태그 근처에 추가:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@monkos_ai">
```

---

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `idphoto-jp/public/index.html` | hreflang 수정 + JSON-LD(Service+FAQ) + Twitter Card |
| `idphoto-kr/public/index.html` | JSON-LD(Service+FAQ) + Twitter Card |

---

## 배포 순서

1. Task 1 (hreflang 버그) + Task 2 + Task 3 → 한번에 수정, KR·JP 동시 배포
2. 배포 후 검증

---

## 검증 체크리스트

- [ ] JP hreflang="ko" → `https://idphoto-kr.monkos.ai/` 확인
- [ ] KR JSON-LD: Service + FAQPage 존재 확인
- [ ] JP JSON-LD: Service + FAQPage 존재 확인 (일본어)
- [ ] JSON-LD에 가격(Offer) **없는 것** 확인
- [ ] Twitter Card 메타태그 존재 확인
- [ ] 콘솔 에러 없음

---

## 완료 조건

- hreflang 양방향 정합성 ✅
- JSON-LD 유효 (Google Rich Results Test 통과) ✅
- Twitter Card 정상 ✅

---

*M1/쌍아 | 2026-03-15 06:35 KST*
