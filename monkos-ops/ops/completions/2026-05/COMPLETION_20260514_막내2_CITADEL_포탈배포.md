---
type: completion
date: 2026-05-14
device: iMac
agent: 막내2
portfolio: PF_CITADEL
order: ORDER_20260514_iMac쌍아_막내2_CITADEL_Tier1_포탈배포
status: 완료
---

# COMPLETION — monkos-portal Tier 1 prod 배포 + 5개 URL 검증

**[2026-05-14 12:12 KST]** iMac/막내2 → iMac/쌍아

## 배포

- **서비스**: monkos-portal
- **Revision**: `monkos-portal-00245-w8z` (100% 트래픽)
- **빌드**: Cloud Build `74759098` SUCCESS (46초)
- **배포 경로**: `deploy.sh prod` (ch5 2조 준수)

## 5개 URL 검증 결과

| # | URL | HTTP | 검증 항목 | 결과 |
|---|-----|------|----------|------|
| 1 | `/specs/korea-passport` | 200 | seoTitle | ✅ `여권사진 규격 2026 — 사이즈·배경·복장 총정리 \| MONKOS` |
| 2 | `/specs/korea-drivers-license` | 200 | seoTitle | ✅ `운전면허 사진 규격 2026 — 사이즈·배경·온라인 제출 총정리 \| MONKOS` |
| 3 | `/specs/korea-resident` | 200 | seoTitle | ✅ `주민등록증 사진 규격 2026 — 사이즈·배경·촬영 팁 총정리 \| MONKOS` |
| 4 | `/guide/ai-photo` | 200 | HowTo/FAQ JSON-LD | ✅ `@type: HowTo` + `@type: FAQPage` 둘 다 응답 확인 |
| 5 | `/en/blog/claudemax-20x-productivity` | **404** | noindex | ⚠️ 아래 참조 |

### 추가 검증

| 항목 | 결과 |
|------|------|
| sitemap.xml `/guide/ai-photo` 포함 | ✅ 확인 |

## ⚠️ URL 5 이슈

지시서 URL `/en/blog/claudemax-20x-productivity`는 **404**. 실제 EN slug:

- `/en/blog/claude-max-20x-2-month-real-usage-review` → **200 OK**

noindex 적용 여부:
- `NOINDEX_SLUGS`에 한국어 slug(`claudemax-20x-2개월-실사용-후기`)만 등록
- EN slug(`claude-max-20x-2-month-real-usage-review`)는 미등록 → **EN 버전에 noindex 미적용**
- 근본 원인: `baseSlug = slug` (render-blog.js:249)로 요청 slug 그대로 사용하므로, 각 언어별 slug를 별도 등록해야 함
- **코드 수정 필요** (지시서 범위 밖 — 보고만 수행)

## 요약

- ✅ 배포 완료 (rev 00245-w8z)
- ✅ URL 1~4: 전건 정상
- ⚠️ URL 5: slug 불일치 + EN noindex 미적용 — 후속 지시서 필요
- 📁 산출물: 본 보고서
