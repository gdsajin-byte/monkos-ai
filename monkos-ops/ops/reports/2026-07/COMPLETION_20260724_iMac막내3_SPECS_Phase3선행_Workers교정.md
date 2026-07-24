---
type: completion
date: 2026-07-24
device: iMac
agent: 막내3
status: 완료
portfolio: PF_SPECS
---

# Phase 3 선행 완료 보고 — worker.js 화이트리스트 교정 + WORKER_PROXY_SECRET 등록

**[2026-07-24 12:15 KST]** iMac/막내3 → 작가님

> 지시서: [ORDER_20260724_iMac쌍아_막내_SPECS_Phase3선행_Workers교정.md](../../orders/2026-07/ORDER_20260724_iMac쌍아_막내_SPECS_Phase3선행_Workers교정.md)

---

## ✅ 항목 1 — worker.js STATIC_PREFIXES 교정

| 변경 전 | 변경 후 |
|---------|---------|
| `['/specs/', '/idpass/', '/css/', '/js/', '/assets/', '/images/']` | `['/css/', '/js/', '/assets/', '/images/']` |

- `/specs/`, `/idpass/` 제거 → CR SSR 경로가 Pages SPA 폴백에 가리지 않음
- 주석 1줄: SSG 전환 후 복원 안내

## ✅ 항목 2 — WORKER_PROXY_SECRET 등록

- SM 등록: v1 enabled (2026-07-24 03:12)
- SECRET_INVENTORY.md #41 메타 등재
- worker.js 50행에서 조건부 `X-Proxy-Secret` 헤더 설정 (기존 코드)

## ❌ 항목 3 — CR 측 검증 미들웨어

- `monkos_AI/portal/server.js`에 X-Proxy-Secret 검증 로직 **없음**
- **별도 지시서에서 구현 필요** (도메인 전환 전 필수)

## ✅ 항목 4 — .pages.dev 배포 + 테스트

배포: `monkos-ai.pages.dev` (Direct Upload, production branch)

| 경로 | 라우팅 | 상태 | X-Served-By |
|------|--------|------|-------------|
| `/_proxy/health` | Worker 직접 | ✅ 200 | — |
| `/specs/passport/kr` | CR 프록시 | ✅ 200, 56,853B | cf-proxy |
| `/api/auth/verify-cookie` | CR 프록시 | ✅ 401 (정확한 CR 응답) | cf-proxy |
| `/` | Pages 정적 | ✅ 200, 121B | 없음 |
| `/css/test.css` | Pages SPA 폴백 | ✅ 200 | 없음 |

- monkos.ai 도메인 미접촉 ✅

## 변경 파일

| 파일 | 변경 |
|------|------|
| `functions/cf-proxy/worker.js` | STATIC_PREFIXES에서 /specs/, /idpass/ 제거 + 주석 |
| `monkos-ops/ops/SECRET_INVENTORY.md` | #41 WORKER_PROXY_SECRET 메타 등재 |

## 💡 후속 필요

1. **CR 검증 미들웨어 구현** — portal/server.js에 X-Proxy-Secret 헤더 검증 추가 (도메인 전환 전 필수)
2. **CF Pages 환경변수 바인딩** — WORKER_PROXY_SECRET을 monkos-ai Pages 프로젝트에 환경변수로 설정 필요 (wrangler.toml 또는 CF 대시보드)
