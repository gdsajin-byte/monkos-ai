---
type: completion
date: 2026-06-15
device: iMac
agent: 막내1
status: 완료
portfolio: PF_SPECS
order: ORDER_20260615_iMac쌍아_막내_SPECS_다국어데이터보강_P1.md
---

# COMPLETION — specs-data.json 다국어 번역 데이터 P1 보강

> **[2026-06-15 13:45 KST]** iMac/막내1 → 작가님

---

## 결과 요약

| 항목 | 상태 |
|------|------|
| ✅ validity EN/JA 소급 번역 (9건 추가) | 28/28 = 100% |
| ✅ fileSpec EN/JA 소급 번역 (22건 추가) | 43/43 = 100% |
| ✅ headHeight EN/JA 소급 번역 (18건 추가) | 280/280 = 100% |
| ✅ 변환 스크립트 작성 (재사용 가능) | scripts/translate_specs_fields.js |
| ✅ prod 배포 (rev 00289-28d) | monkos.ai 100% 트래픽 |
| ✅ prod 실측 — EN/JA 한국어 텍스트 0건 | curl 검증 완료 |

## prod 실측 (배포 후)

**EN** `/en/specs/passport/korea`:
- Validity: "Within 6 months"
- Head Height: "3.2-3.6cm (crown to chin)"
- File Spec: "JPEG, max 500KB"

**JA** `/ja/specs/passport/korea`:
- Validity: "6ヶ月以内"
- Head Height: "3.2〜3.6cm（頭頂〜あご）"
- File Spec: "JPEG、500KB以下"

## 산출물

| # | 산출물 | 경로 |
|---|--------|------|
| 1 | specs-data.json 번역 필드 보강 | monkos_AI/portal/lib/cms/specs-data.json |
| 2 | 변환 스크립트 | scripts/translate_specs_fields.js |
| 3 | PF_SPECS 히스토리 1행 어펜드 | monkos-ops/ops/portfolios/PF_SPECS/README.md |

## 커밋

- `1f34d970` [feat] specs-data.json 다국어 번역 데이터 P1 보강
