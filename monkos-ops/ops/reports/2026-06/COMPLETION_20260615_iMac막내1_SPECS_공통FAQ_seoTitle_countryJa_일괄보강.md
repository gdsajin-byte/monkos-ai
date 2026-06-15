---
type: completion
date: 2026-06-15
device: iMac
agent: 막내1
status: 완료
portfolio: PF_SPECS
order: ORDER_20260615_iMac쌍아_막내_SPECS_공통FAQ+seoTitle+countryJa_일괄보강.md
---

# COMPLETION — specs 공통FAQ·seoTitle·countryJa 일괄 보강

> **[2026-06-15 15:00 KST]** iMac/막내1 → 작가님

---

## 결과 요약

| 항목 | 상태 |
|------|------|
| ✅ 공통 FAQ 3언어 삽입 | 436건 신규 (기존 9건 보존). 445/445 = 100% |
| ✅ seoTitle·seoDescription 3언어 자동생성 | 442건 신규 (기존 3건 보존). 445/445 = 100% |
| ✅ countryJa 26건 보강 | 0 미보유 달성 |
| ✅ backgroundEn/Ja 5건 보강 | japan-*, us-passport |
| ✅ JA 한국어 잔류 해소 (R3·R4) | kr-visa/kr-license details 법률명 번역 4건 |
| ✅ seoTitle 고유성 | 중복 0건 |
| ✅ JA/EN 한국어 잔류 | 0건 (데이터 영역) |
| ✅ prod 배포 (rev 00290-65g) | monkos.ai 100% 트래픽 |

## prod 실측 (배포 후)

**EN** `/en/specs/passport/au`:
- Title: "Australia Passport / ID Photo Size 35 × 45 mm — Background & Dress Code | MONKOS"
- FAQ: 3건 (사이즈/셀프촬영/배경색)

**JA** `/ja/specs/visa/de`:
- Title: "ドイツ シェンゲンビザ写真規格 3.5 × 4.5cm — 背景・服装ガイド | MONKOS"
- FAQ: 3건 (サイズ/自宅撮影/背景色)

**JA** `/ja/specs/resume/china`:
- Title: "中国 履歴書写真規格 1寸・2寸（複数規格）" (写真 중복 없음, 한국어 없음)

**KO** `/specs/passport/au`:
- Title: "호주 Passport · ID 사진 규격 35 × 45 mm — 배경·복장 가이드 | MONKOS"
- FAQ: 3건 정상

## 산출물

| # | 산출물 | 경로 |
|---|--------|------|
| 1 | specs-data.json FAQ·seoTitle·countryJa 보강 | monkos_AI/portal/lib/cms/specs-data.json |
| 2 | 변환 스크립트 (재사용 가능) | scripts/enrich_specs_faq_seo.js |
| 3 | PF_SPECS 히스토리 1행 어펜드 | monkos-ops/ops/portfolios/PF_SPECS/README.md |

## 커밋

- `ce9a8000` [feat] specs-data.json 공통FAQ·seoTitle·countryJa 일괄 보강
