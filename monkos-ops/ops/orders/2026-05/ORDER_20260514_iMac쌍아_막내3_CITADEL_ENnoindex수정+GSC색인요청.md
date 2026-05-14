---
type: order
date: 2026-05-14
from: iMac/쌍아
to: iMac/막내3
subject: PF_CITADEL Phase 2.2 — EN noindex 누락 수정 + 재배포 + GSC 색인 요청 5건
status: 대기
portfolio: PF_CITADEL
prior: ORDER_20260514_iMac쌍아_막내2_CITADEL_Tier1_포탈배포.md
note: 막내2 배포 완료(rev 00245-w8z). EN noindex 누락 버그 발견으로 원본 지시서 폐기 후 합산 재발급
---

# 지시서: EN noindex 누락 수정 + 재배포 + GSC 색인 요청

## 목적

막내2 배포에서 URL 5 이슈 발견: EN 블로그 noindex가 한국어 slug으로만 등록되어 영문 버전 미적용. 코드 수정 → 재배포 → GSC 색인 요청을 일괄 처리한다.

## 작업

### 1. EN noindex 누락 수정

monkos-portal 코드에서 `NOINDEX_SLUGS` (또는 동등 구현부) 확인:
- 현재: 한국어 slug만 등록 (`claudemax-20x-productivity` 등)
- 실제 EN slug: `claude-max-20x-2-month-real-usage-review` (막내2 보고)

**수정 방침:**
1. 해당 코드 파일을 먼저 Read하여 NOINDEX_SLUGS 구현 방식 파악
2. EN slug를 NOINDEX_SLUGS에 추가
3. 가능하면 `/en/blog/*` 경로 전체에 noindex를 적용하는 방식 검토 (민아 제안서 Unit-3-Plus-B 참조: "CTR 1% 미만 EN 전체 noindex")
4. 단, 범위 확대는 **EN slug 1건 추가**에 한정. 전체 EN noindex는 별도 결정 사항

### 2. 재배포

```bash
cd monkos_AI/portal && ./deploy.sh
```

> ⚠️ 헌법 5장 2조 — deploy.sh 경유 필수

배포 후 검증:
- `https://monkos.ai/en/blog/claude-max-20x-2-month-real-usage-review` → `<meta name="robots" content="noindex">` 확인

### 3. GSC 색인 재요청 5건

google-search-console MCP 또는 CDP로 GSC 접근:

| # | URL | 액션 |
|---|-----|------|
| 1 | `https://monkos.ai/guide/ai-photo` | **최우선 색인 요청** (신규 URL) |
| 2 | `https://monkos.ai/specs/korea-passport` | 재크롤 트리거 |
| 3 | `https://monkos.ai/specs/korea-drivers-license` | 재크롤 트리거 |
| 4 | `https://monkos.ai/specs/korea-resident` | 재크롤 트리거 |
| 5 | `https://monkos.ai/sitemap.xml` | 사이트맵 재제출 |

각 URL: 현재 인덱싱 상태 기록 → 색인 요청 실행 → 결과 기록

## 산출물

- EN noindex 코드 수정 (커밋)
- Cloud Run 재배포 완료
- `COMPLETION_20260514_막내3_CITADEL_ENnoindex+GSC색인.md`

## ⚠️ 준수 조항

- ch5 2조: deploy.sh 경유 필수
- 코드 수정 범위: NOINDEX_SLUGS에 EN slug 1건 추가. 그 이상의 범위 확대 금지
- GSC 데이터 조회/색인 요청만. 사이트 설정 변경 금지
- CDP 사용 시 rules/cdp-browser.md 준수

---

> 발행: **[2026-05-14 12:14 KST]** iMac/쌍아 → iMac/막내3 즉시 투입 가능
