---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내1
status: 대기
portfolio: PF_CITADEL
priority: P0
ref: ORDER_20260405_M1쌍아_막내_CITADEL_SEO보정_3건.md
pf: PF_CITADEL
---

# 지시서: CITADEL SEO 기술 보정 3건

> **M1/쌍아가 4/5에 코드 검증까지 완료한 지시서를 iMac으로 이관.**
> 원본 정본: `monkos-ops/ops/orders/2026-04/ORDER_20260405_M1쌍아_막내_CITADEL_SEO보정_3건.md`
> **원본 지시서를 Read하여 그대로 실행할 것.**

---

## 요약

| 건 | 내용 | 대상 파일 |
|----|------|----------|
| 1 | JA/EN 메인 메타 태그 현지화 (P0) | monkos_AI/portal/lib/cms/home.js |
| 2 | Crop hreflang + H1 추가 (P1) | monkos_AI/portal/public/crop/index.html |
| 3 | Blog 목록 JSON-LD 추가 (P1) | monkos_AI/portal/lib/cms/render.js |

## 실행

1. 원본 지시서 Read: `monkos-ops/ops/orders/2026-04/ORDER_20260405_M1쌍아_막내_CITADEL_SEO보정_3건.md`
2. 건별 개별 커밋: `[seo] CITADEL 건N: {내용 요약}`
3. 배포: `gcloud run deploy monkos-portal --project=monkos --region=asia-northeast1 --source=. --allow-unauthenticated`
4. 완료 보고 (✅❌💡⏳📁🔀 형식)

## ⚠️ 준수 조항

- index.html KO 메타 원본 수정 금지 (SSR 치환 방식)
- crop H1 스타일 깨짐 시 CSS 보정 포함
- 헌법 4조 1항: API 키 하드코딩 금지
