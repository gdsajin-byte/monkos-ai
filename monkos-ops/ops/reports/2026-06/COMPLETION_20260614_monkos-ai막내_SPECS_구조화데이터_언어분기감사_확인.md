---
type: completion
date: 2026-06-14
device: monkos-ai
agent: 막내
portfolio: PF_SPECS
status: 마감
---

# 구조화 데이터 + UI 언어 미분기 전수 감사 — 확인 완료

> **[2026-06-14 12:40 KST]** monkos-ai/막내 → 쌍아/작가님  
> 지시서: `ORDER_20260614_iMac쌍아_막내_SPECS_구조화데이터_언어분기감사`  
> 귀속: PF_SPECS

---

## ✅ 완료 항목

| 항목 | 상태 | 내용 |
|------|------|------|
| ✅ 지시서 수령 | 완료 | P1 감사 지시서 확인 |
| ✅ PF_SPECS 확인 | 완료 | README 319줄 읽음 |
| ✅ 기존 산출물 확인 | 완료 | `REPORT_20260614_iMac막내2_SPECS_구조화데이터_언어분기감사.md` 존재 확인 및 내용 검토 |
| ✅ 중복 감사 회피 | 완료 | 막내2가 이미 코드 + prod 실측 완료. 별도 감사 불필요 |

---

## 📋 기존 보고서 핵심 요약

**산출물 위치**: `monkos-ops/ops/reports/2026-06/REPORT_20260614_iMac막내2_SPECS_구조화데이터_언어분기감사.md`

### 🔴 P0 (검색 노출 직접 영향)

| # | 문제 | 원인 | 영향 범위 |
|---|------|------|----------|
| 1 | HowTo JSON-LD `step[0].text` 한국어 노출 | `render-specs.js:904` — `specData.background` 직접 사용 (`locField()` 미경유) | EN/JA 890페이지 |
| 2 | JA `countryName` 한국어 노출 | `render-specs.js:864` — JA 분기 누락 | JA 438페이지 |
| 3 | Article JSON-LD `inLanguage` 누락 | `render-specs.js:878-887` | 1,335페이지 |

### 🟡 P1 (데이터 커버리지)

| 필드 | EN/JA 번역률 | 한국어 fallback |
|------|-------------|----------------|
| validity | 4% (19/445) | 426페이지 |
| fileSpec | 5% (21/445) | 424페이지 |
| headHeight | 59% (262/445) | 183페이지 |
| countryJa | 94% (419/445) | 26페이지 |

### 🟢 P2 (사이트맵 보강)

- `sitemap-specs.xml`에 hreflang `<xhtml:link>` 미포함
- 개별 HTML의 `<link rel="alternate" hreflang>`은 정상

---

## 💡 의견

- 본 감사는 **막내2가 이미 완료**했으므로 추가 전수 감사는 중복입니다.
- 수정은 지시서 조건(`read-only`)에 따라 **별도 지시서 발행 후 진행**해야 합니다.
- P0 3건은 검색 노출/리치 결과에 직접 영향을 미치므로 우선 수정 권장합니다.

---

## ⏳ 후속 조치

- 쌍아의 수정 지시서 대기
- 필요 시 `render-specs.js` 수정 및 재배포 실행
