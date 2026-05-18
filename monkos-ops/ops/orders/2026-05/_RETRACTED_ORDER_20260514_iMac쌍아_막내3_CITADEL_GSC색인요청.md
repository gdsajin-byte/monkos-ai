---
type: order
date: 2026-05-14
from: iMac/쌍아
to: iMac/막내3
subject: PF_CITADEL Phase 2.2 Unit-2 — GSC 색인 재요청 5건 + 검사 결과 수집
status: 대기
portfolio: PF_CITADEL
prior: PROPOSAL_20260514_민아_CITADEL_Phase22_배포재시작+측정사이클.md
depends: ORDER_20260514_iMac쌍아_막내2_CITADEL_Tier1_포탈배포.md
---

# 지시서: GSC 색인 재요청 5건 + 검사 결과 수집

## 목적

막내2의 portal 배포 완료 후, Google Search Console에서 Tier 1 대상 URL 5건의 색인 재요청을 실행하고 검사 결과를 수집한다.

## 선행 조건

- **막내2의 포탈 배포(ORDER_20260514_막내2)가 완료된 후 실행**
- 배포 미완료 시 대기. 작가님에게 확인 후 착수

## 작업

### 1. GSC URL 검사 + 색인 요청

google-search-console MCP 도구 또는 CDP로 GSC 접근하여 아래 5건 처리:

| # | URL | 기대 결과 |
|---|-----|----------|
| 1 | `https://monkos.ai/guide/ai-photo` | **신규 URL — 최우선 색인 요청** |
| 2 | `https://monkos.ai/specs/korea-passport` | 재크롤 트리거 (seoTitle 변경 반영) |
| 3 | `https://monkos.ai/specs/korea-drivers-license` | 재크롤 트리거 |
| 4 | `https://monkos.ai/specs/korea-resident` | 재크롤 트리거 |
| 5 | `https://monkos.ai/sitemap.xml` | 사이트맵 재제출 |

각 URL에 대해:
1. URL 검사 실행 → 현재 인덱싱 상태 기록 (Indexed / Discovered / Crawled / Not found)
2. 색인 요청(재크롤 요청) 실행
3. 결과 기록

### 2. 검사 결과 보고

COMPLETION 보고서에 5건 검사 결과 표 포함:

```
| URL | 검사 전 상태 | 색인 요청 | 비고 |
```

## 산출물

- `COMPLETION_20260514_막내3_CITADEL_GSC색인요청.md`

## ⚠️ 준수 조항

- GSC 데이터 조회만. 사이트 설정 변경 금지
- CDP 사용 시 cdp-browser 규칙(rules/cdp-browser.md) 준수
- 선행 조건(막내2 배포) 미충족 시 실행 금지

---

> 발행: **[2026-05-14 12:06 KST]** iMac/쌍아 → iMac/막내3 투입 대기 (막내2 배포 완료 후)
