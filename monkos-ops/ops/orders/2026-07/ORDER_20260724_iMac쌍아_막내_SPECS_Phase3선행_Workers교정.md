---
type: order
date: 2026-07-24
device: iMac
agent: 쌍아
receiver: 막내
status: 발행
portfolio: PF_SPECS
---

# 지시서 — Phase 3 선행: worker.js 화이트리스트 교정 + WORKER_PROXY_SECRET 등록

**[2026-07-24 12:00 KST]** iMac/쌍아 → 막내

> 근거: Phase 0 완료 보고 잔여 항목. Phase 3(도메인 전환) 전 필수 선행.
> 참조: [COMPLETION_20260723_Phase0](../reports/2026-07/COMPLETION_20260723_iMac막내3_SPECS_Phase0_CF세팅_Workers.md)

## ⚠️ 준수 조항
- 헌법 4조 1항 (비밀정보 — WORKER_PROXY_SECRET 등록은 `secret` 프로토콜 경유)
- ch5 배포 규칙 (CF Pages 배포는 wrangler 경유)
- ⚠️ monkos.ai 도메인은 아직 CF Pages에 연결하지 않음. .pages.dev에서만 테스트.

## 작업 목록

### 1. worker.js STATIC_PREFIXES 교정

- 위치: `functions/cf-proxy/worker.js` 8행
- 현재:
  ```js
  const STATIC_PREFIXES = ['/specs/', '/idpass/', '/css/', '/js/', '/assets/', '/images/'];
  ```
- 문제: `/specs/`와 `/idpass/`는 현재 CR SSR 경로. Pages의 SPA 폴백(root index.html)이 200으로 반환되어 CR SSR 페이지를 가림
- 교정:
  ```js
  const STATIC_PREFIXES = ['/css/', '/js/', '/assets/', '/images/'];
  ```
- `/specs/`는 SSG 전환(Phase 3) 완료 후 복원. `/idpass/`는 IDPASS 쉘(Phase 1) 완료 후 판단.
- 주석으로 교정 사유 1줄 명기

### 2. WORKER_PROXY_SECRET 등록

- 작가님에게 `secret` 실행 요청:
  ```
  시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
  이름: WORKER_PROXY_SECRET
  발급처: 임의 생성 (openssl rand -hex 32)
  ```
- 등록 후 `secret check WORKER_PROXY_SECRET` 확인
- SECRET_INVENTORY.md 메타 1행 추가
- CF Pages 환경변수에 바인딩 (wrangler.toml 또는 대시보드)

### 3. CR 측 검증 미들웨어 확인

- `monkos_AI/server.js`에서 `X-Proxy-Secret` 헤더 검증 로직 존재 여부 확인
- 없으면 보고 (별도 지시서에서 처리 — 도메인 전환 전 필수)
- 있으면 WORKER_PROXY_SECRET 값과 매칭되는지 확인 경로 보고

### 4. 테스트 (.pages.dev)

- 화이트리스트 교정 후 .pages.dev에 배포
- 검증:
  - `/css/`, `/js/` 등 정적 자산 → Pages에서 서빙 (X-Served-By 헤더 없음)
  - `/specs/passport/kr` → CR 프록시 경유 (X-Served-By: cf-proxy)
  - `/api/` 경로 → CR 직행
  - `/_proxy/health` → 프록시 상태 JSON
- ⚠️ monkos.ai 도메인 건드리지 않음

## 완료 보고
- 수발신 헤더 + ✅❌💡⏳📁🔀 형식
- COMPLETION 보고서 파일 필수
- 테스트 결과 (경로별 응답 상태) 포함
