---
type: completion
date: 2026-07-06
device: iMac
agent: 막내1
status: 완료
---

**[2026-07-06 15:39 KST]** iMac/막내1 → 작가님

# SPECS 카드 overlay 대폭 축소 완료

## 지시서
`monkos-ops/ops/orders/2026-07/ORDER_20260706_iMac쌍아_막내_SPECS_카드overlay축소.md`

## 수정 내역

### 수정 1 — 종류 카드 (여권/비자/신분증/기타) CSS
- **파일**: `monkos_AI/portal/lib/cms/render-specs.js` (line 514~520)
- overlay: `rgba(0,0,0,0.7)~0.3` → `rgba(0,0,0,0.15)~0.05` (대폭 축소)
- `.p-name`: `#1a1a1a` → `#ffffff` + `text-shadow: 0 1px 6px rgba(0,0,0,0.7)`
- `.p-sub`: `#6c4fff` → `#ffffff` + `text-shadow` + `opacity: 0.85`

### 수정 2 — 대륙 카드 overlay inline style
- **파일**: `monkos_AI/portal/lib/cms/render-specs.js` (line 1190)
- gradient alpha `88`(53%) → `33`(20%)

## 배포
- **rev**: `monkos-portal-00395-8p9`
- 100% 트래픽 서빙

## 변경 파일
- `monkos_AI/portal/lib/cms/render-specs.js`
