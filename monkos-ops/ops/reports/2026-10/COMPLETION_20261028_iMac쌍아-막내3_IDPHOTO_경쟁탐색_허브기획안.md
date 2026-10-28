---
type: completion
date: 2026-10-28
device: iMac
agent: 막내3
subject: 증명사진 경쟁 탐색 + 증명사진관 허브 기획안 (소소 브리프)
portfolio: PF_IDPHOTO
order: ORDER_20261028_iMac쌍아_막내3_IDPHOTO_경쟁탐색_증명사진관허브_기획안.md
status: 마감
---

# COMPLETION — 경쟁 탐색 + 허브 기획안

**[2026-10-28 11:59 KST]** iMac/막내3 → iMac/쌍아

## 완료 기준 대조

| 기준 | 결과 |
|---|---|
| 탐색 ≥ 7곳 (국내 AI 2+, 실물 1+, 해외 3+, 우리 현행) | ✅ 국내 AI 3(인헨즈·증명한컷·팝업셀카) · 실물 1(시현하다) · 해외 5(PhotoAiD·Passport Photo Online·Persofoto·7ID·ピクチャン) · 우리 현행 3(specs·idphoto-kr·monk.kr) = **12곳**, 사이트별 7항목 |
| 9225 포트 대조 결과 기재 | ✅ REPORT §0 — Playwright MCP 5개 프로세스가 전부 9222에 붙어 있어 **Playwright는 한 번도 호출하지 않았다**. `cdp_utils.CDP(port=9225)`만 썼다 |
| 기획안 §4 항목 1~10 | ✅ PROPOSAL §1~§10 |
| COMPLETION + 커밋·푸시 + 원격 SHA 대조 | ✅ 본 문서 + 마감 보고에 SHA 기재 |

## 산출물

- 📁 `monkos-ops/ops/reports/2026-10/REPORT_20261028_iMac막내3_증명사진_경쟁탐색.md`
- 📁 `monkos-ops/ops/proposals/PROPOSAL_20261028_iMac막내3_증명사진관허브_기획안.md` (**핵심 — 소소 브리프**)
- 📁 캡처 28장 `monkos-ops/tech/designs/2026-10/refs_idphoto_hub/` — ⚠️ `.gitignore`의 `*.png` 규칙 때문에 git에는 없다. iMac 본 체크아웃 같은 경로에 복사했다

## 부수 발견 (지시 범위 밖 — 판단은 쌍아)

- 🔴 **`monkos.ai/ai-photo` 404**: 네이버 "AI 증명사진" 검색에 MONKOS 결과로 노출되는 URL이다. 2회 히트 404·404, 양성 대조군 `/specs/passport/kr` 200. 현행 페이지는 `/guide/ai-photo`(200)이며 코드에는 `/ai-photo` 라우트가 없다 → 301 누락으로 보인다.
- 💡 증명한컷(idcut.kr)이 우리 specs 전략(서류별 규격 랜딩 + 무료 미리보기 + 규격 검사 도구)과 거의 같은 형태를 국내에서 ₩5,900에 운영 중이다. 가장 직접적인 경쟁자다.
- 💡 외교부 2022.10 규정의 "AI 편집 불허"는 경쟁사의 약점이자 우리 정직 라우팅(기획안 D2)의 근거다.

## 하지 않은 것

- 경쟁사 가입·결제·사진 업로드: 하지 않음(헌법 4조 1항). 그래서 실제 단계 수는 랜딩 안내 기준이다.
- 서비스 코드 수정: 없음.
