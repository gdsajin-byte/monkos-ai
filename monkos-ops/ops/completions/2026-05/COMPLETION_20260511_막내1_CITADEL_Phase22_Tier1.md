---
type: completion
date: 2026-05-11
device: iMac
agent: 막내1
portfolio: PF_CITADEL
order: ORDER_20260511_iMac쌍아_막내_CITADEL_Phase22_Tier1.md
status: 완료
---

# COMPLETION — CITADEL Phase 2.2 Tier 1

**[2026-05-11 19:03 KST] iMac/막내1 → 작가님, 쌍아**

## 결과

✅ A: specs-data.json 타이틀/메타 갱신 — korea-passport, korea-drivers-license, korea-resident
✅ B: /guide/ai-photo 신설 + HowTo·FAQ JSON-LD + sitemap
✅ C: korea-passport FAQ 2건 확장 (집촬영, 메이크업)
✅ D: claudemax EN noindex 적용 (작가님 승인 완료)

## 상세

### A: seoTitle/seoDescription (3건 + render-specs.js 수정)

| slug | seoTitle (ko) |
|------|--------------|
| korea-passport | 여권사진 규격 2026 — 사이즈·배경·복장 총정리 |
| korea-drivers-license | 운전면허 사진 규격 2026 — 사이즈·배경·온라인 제출 총정리 |
| korea-resident | 주민등록증 사진 규격 2026 — 사이즈·배경·촬영 팁 총정리 |

- 3언어(ko/ja/en) 동시 적용
- render-specs.js: seoTitle/seoDescription 필드 존재 시 우선 사용, 없으면 기존 동적 생성 폴백

### B: /guide/ai-photo 랜딩

- 구성: AI 증명사진 소개 + 사진관 vs AI 비교표 + 3단계 사용법 + FAQ 4건 + CTA
- JSON-LD: HowTo + FAQPage
- sitemap: priority 0.8 추가
- server.js 라우트 등록

### C: korea-passport FAQ 확장

| 질문 | 비고 |
|------|------|
| 여권사진 집에서 찍어도 되나요? | 셀프 촬영 안내 + MONKOS AI CTA |
| 여권사진 메이크업 주의사항이 있나요? | 컨투어링·컬러렌즈 주의사항 |

### D: noindex

- 대상: `/en/blog/claudemax-20x-...` (노출 247, CTR 0.4%)
- render-blog.js에 `NOINDEX_SLUGS` Set 추가 — 향후 대상 추가 시 slug만 등록

## 배포

⏳ monkos.ai Cloud Run 배포 필요 (deploy.sh 경유)
