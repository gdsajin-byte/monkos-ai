---
type: ORDER
date: 2026-03-25
from: iMac/쌍아
to: 막내2
subject: SEO 보강 ② — 홈 FAQ JSON-LD + sitemap 중복 제거 + 약관 noindex
priority: 높음
related:
  - monkos-ops/ops/reports/2026-03/REPORT_20260325_iMac민아_SEO_GEO_전체현황_종합보고.md
  - monkos-ops/ops/reports/2026-03/REPORT_20260325_iMac민아_종합분석_자금조달+SEO진단.md
---

# 지시서 — SEO 보강 ② FAQ JSON-LD + sitemap + noindex

**[2026-03-25 19:09 KST] iMac/쌍아 → 막내2**

---

## 작업 1: 홈 FAQ JSON-LD mainEntity 삽입

**원인 (3/24 쌍아 확정)**: home.js FAQ 프리뷰 섹션에 JSON-LD 미삽입. Firestore 데이터(39건, KO/JA/EN 각 13)는 정상.

**조치**: home.js의 FAQ 프리뷰 렌더링 부분에 FAQPage JSON-LD 삽입. /faq 페이지의 기존 JSON-LD 구현을 참고.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "질문",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "답변"
      }
    }
  ]
}
```

**검증**: `curl -s https://monkos.ai/ | grep -i "FAQPage"` → JSON-LD 존재 확인

---

## 작업 2: sitemap.xml 중복 URL 제거

**문제**: 동일 URL 2회 등록 케이스 존재
- `/ja/blog/5-10` — 2회
- `/en/blog/5-10` — 2회

**조치**: sitemap 생성 로직에서 Set/Map으로 URL 유일성 보장. 중복 제거(dedupe).

**검증**: `curl -s https://monkos.ai/sitemap.xml | sort | uniq -d` → 중복 0건

---

## 작업 3: 약관/정책 페이지 noindex

**대상**: idphoto-jp.monkos.ai / idphoto-kr.monkos.ai 약관류
- `/terms.html`, `/refund.html`, `/credits-policy.html`, `/privacy.html`, `/tokusho.html`, `/charge`

**조치**: 해당 페이지 `<head>`에 추가:
```html
<meta name="robots" content="noindex, follow">
```

**검증**: `curl -s https://idphoto-kr.monkos.ai/terms.html | grep noindex`

---

## 배포

- 3건 모두 수정 후 **dev 배포로 검증**
- dev 통과 후 **prod 배포 승인 요청**

## ⚠️ 준수 조항

- 헌법 제4조(구속·윤리) 1항: 비밀정보 보호
- 헌법 제3조(적립) 1항: 타임스탬프
- 헌법 제3조(적립) 2항: 완료 보고 필수
- 법률 ch2: 기존 코드 패턴 준수
