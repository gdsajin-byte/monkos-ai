---
type: completion
date: 2026-07-20
device: iMac
agent: 막내3
portfolio: PF_CITADEL
status: 완료
---

# COMPLETION: specs EN 타이틀 60자 재생성 + 연호(2026) 전면 적용

> **[2026-07-20 19:13 KST]** iMac/막내3 → 작가님

## 결과

✅ **Task 1** — EN 타이틀 429슬러그 60자 이하 재생성
- 포맷: `{Country} {Type} Photo Size — {size} 2026`
- "Size & Requirements" → "Photo Size" (16자 절감)
- 풀사이즈 → 축약 → 생략 3단 폴백 체인
- 60자 초과 잔존: 0건

✅ **Task 2** — KO/JA 연호 점검: **0건** 미포함 (전원 2026 보유)

✅ **Task 3** — H1 연호 동기화: `spec-hero.js` H1에 "2026" 추가

✅ **Task 4** — 배포 완료
- dev: rev 00156-ml2
- prod: rev 00522-84n

## 변경 파일

| 파일 | 변경 |
|------|------|
| `portal/tools/seo-headterm-regen.mjs` | EN 포맷 변경 + EN-only 적용 + KO/JA 2026 체크 |
| `portal/lib/cms/specs-data.json` | EN seoTitle/seoDescription 429건 갱신 (KO/JA 무접촉) |
| `portal/lib/cms/components/spec-hero.js` | H1에 "2026" 추가 |

## EN 타이틀 변경 예시

| 슬러그 | 변경 전 | 변경 후 | 글자 |
|--------|---------|---------|------|
| us-visa | US Visa Photo Size & Requirements 2026 — 2×2 inch | US Visa Photo Size — 2 × 2 inch (51 × 51mm) 2026 | 49 |
| kr-passport | South Korea Passport Photo Size & Requirements 2026 | South Korea Passport Photo Size — 3.5 × 4.5cm 2026 | 51 |
| vc-passport | Saint Vincent and the Grenadines Passport Photo Size & Requirements 2026 (72) | Saint Vincent and the Grenadines Passport Photo Size 2026 | 58 |

## 준수 조항 이행

- ✅ URL 무변경 (타이틀·메타만)
- ✅ specs-data.json EN seoTitle/seoDescription만 변경, KO/JA 무접촉
- ✅ 기존 KO 타이틀 무변경
