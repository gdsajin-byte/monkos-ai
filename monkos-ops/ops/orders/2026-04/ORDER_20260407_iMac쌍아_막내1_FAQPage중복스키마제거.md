---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내1
status: 대기
priority: P0
pf: PF_CITADEL
ref: iMac/민아 진단 (2026-04-07 17:48)
---

# 지시서: FAQPage 중복 스키마 제거

> **민아 진단**: 메인 페이지에 FAQPage JSON-LD가 2곳에서 동시 삽입 → 구글 리치 결과 미표시.
> index.html 정적 하드코딩(①)을 삭제하면 해결. home.js 동적 삽입(②)이 정본.

---

## 작업

`monkos_AI/portal/public/index.html` L73 부근의 `<script type="application/ld+json">` FAQPage 스키마 블록을 **삭제**.

### 삭제 대상 (정적 하드코딩)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  ...
}
</script>
```

### 건드리지 않는 것
- `home.js:300` 동적 삽입 — 정본, 유지
- `render.js:599` — `/faq` 전용, 유지
- `render.js:1738` — `/specs/*` 전용, 유지

## 검증

- `/` 접속 → FAQPage JSON-LD가 **1개만** 존재하는지 확인 (home.js 동적 삽입분)
- `/ja/` 접속 → 동일 확인
- 기존 FAQ 응답 내용이 정상 표시되는지 확인

## 배포

```bash
cd monkos_AI/portal
gcloud run deploy monkos-portal \
  --project=monkos \
  --region=asia-northeast1 \
  --source=. \
  --allow-unauthenticated
```

## 커밋

`[seo] CITADEL: FAQPage 중복 스키마 제거 — index.html 정적 하드코딩 삭제`

## ⚠️ 준수 조항

- home.js 동적 삽입 로직 수정 금지
- 헌법 4조 1항: 배포 시 키 하드코딩 금지

## 완료 기준

1. index.html 정적 FAQPage 삭제
2. 배포 성공
3. 검증 통과 (FAQPage 1개만 존재)
4. 완료 보고 (✅❌💡⏳📁🔀 형식)
