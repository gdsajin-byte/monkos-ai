---
type: completion
date: 2026-07-23
device: iMac
agent: 막내3
status: 완료
portfolio: PF_SPECS
---

# Phase 0 완료 보고 — CF Pages 세팅 + Workers 프록시 PoC + DNS 인벤토리

**[2026-07-23 15:44 KST]** iMac/막내3 → 작가님

> 지시서: [ORDER_20260723_iMac쌍아_막내_SPECS_Phase0_CF세팅_Workers.md](../../orders/2026-07/ORDER_20260723_iMac쌍아_막내_SPECS_Phase0_CF세팅_Workers.md)

---

## ✅ Block A — CF Pages 프로젝트 세팅 + 테스트 배포

| 항목 | 결과 |
|------|------|
| Pages 프로젝트 | `monkos-ai` **기존재** (2주 전 생성, Git-connected 빌드 전량 Failure — Direct Upload로 전환) |
| 테스트 배포 | ✅ Direct Upload 성공 — 2 파일 (index.html + specs/passport/kr.html) |
| .pages.dev 접근 | ✅ `https://phase0-proxy-v2.monkos-ai.pages.dev` |
| SSG PoC 서빙 | ✅ `/specs/passport/kr` → HTTP 200, 56,170 bytes |

### R1 실증: .html 308 리다이렉트
- `/specs/passport/kr.html` → **308 Permanent Redirect** → `/specs/passport/kr`
- `/specs/passport/kr` → 200 OK (직접 접근)
- **설계서 R1 교정 확인**: flat .html 업로드 → CF Pages가 자동으로 확장자 제거 서빙. specsUrl() 무확장자 경로와 호환.

---

## ✅ Block B — DNS/웹훅 인벤토리

### 서브도메인 인벤토리

| 서브도메인 | 타입 | 대상 | 프록시 | CR 서비스 | 인증서 |
|-----------|------|------|--------|----------|--------|
| monkos.ai (apex) | A × 4 | 216.239.x.x (GFE) | ☁️ gray | monkos-portal | Google 관리 |
| matte.monkos.ai | A × 2 | 104.21.39.124, 172.67.145.71 | 🟠 orange | — (4060 터널) | CF Edge |
| idphoto-kr.monkos.ai | CNAME | ghs.googlehosted.com | ☁️ gray | monkos-idphoto-kr | Google 관리 |
| idphoto-jp.monkos.ai | CNAME | ghs.googlehosted.com | ☁️ gray | monkos-idphoto-jp | Google 관리 |
| image.monkos.ai | CNAME | ghs.googlehosted.com | ☁️ gray | monk-image-engine | Google 관리 |
| studio.monkos.ai | CNAME | ghs.googlehosted.com | ☁️ gray | monkos-studio | Google 관리 |
| pt.monkos.ai | CNAME | ghs.googlehosted.com | ☁️ gray | — (매핑 없음) | Google 관리 |
| preview.monkos.ai | — | — | — | monkos-portal (❌ 실패) | — |

- **NS**: edna.ns.cloudflare.com / bob.ns.cloudflare.com (CF NS 이관 완료 확인)
- **MX**: Cloudflare Email Routing (route1/2/3.mx.cloudflare.net)
- **TXT**: Google 사이트 확인 + SPF (CF MX)
- **미발견**: www, crop-engine, n8n, dev, cdn, api, blog 등 — 서브도메인 미설정

### Cloud Run 서비스 전량 (11개)

| 서비스 | CPU | 메모리 | min | max | 도메인 매핑 |
|--------|-----|--------|-----|-----|------------|
| monkos-portal | 1 | 1Gi | 1 | 5 | monkos.ai |
| monkos-idphoto-kr | 2 | 2Gi | 1 | 10 | idphoto-kr.monkos.ai |
| monkos-idphoto-jp | 2 | 2Gi | 1 | 10 | idphoto-jp.monkos.ai |
| monk-image-engine | 2 | 2Gi | 0 | 10 | image.monkos.ai |
| monkos-studio | 1 | 1Gi | 0 | 5 | studio.monkos.ai |
| monk-n8n | 1 | 1Gi | 0 | 20 | — |
| monkos-portal-dev | 1 | 1Gi | 0 | 2 | — |
| monkos-idphoto-kr-dev | 1 | 512Mi | 0 | 2 | — |
| monkos-idphoto-jp-dev | 1 | 512Mi | 0 | 2 | — |
| monkos-studio-dev | 1 | 512Mi | 0 | 2 | — |
| jangsam-dev | 1 | 256Mi | 0 | 2 | — |

### PG 웹훅 라우트 (코드 실측)

| PG | 라우트 | 메서드 | 용도 |
|----|--------|--------|------|
| Lemon Squeezy | `/api/webhooks/lemonsqueezy` | POST | 결제 웹훅 |
| Lemon Squeezy | `/api/webhooks` | POST | 별칭 (피싱 방지 검증 우회, 7/5) |
| Toss | `/api/webhooks/toss` | POST | 결제 웹훅 |
| Toss | `/api/payments/toss/confirm` | POST | 결제 확인 |
| Toss | `/api/payments/toss/direct` | POST | 다이렉트 결제 |
| Toss | `/toss-success` | GET | 결제 성공 리다이렉트 (SSR) |
| Toss | `/toss-fail` | GET | 결제 실패 리다이렉트 (SSR) |
| Telegram | `/api/webhook/telegram` | POST | CS 봇 |
| Telegram | `/api/webhook/telegram-event` | POST | 이벤트 봇 |
| Telegram | `/api/webhook/telegram-team` | POST | 팀 봇 |
| LINE | `/api/webhook/line` | POST | LINE 봇 |

**⚠️ PG 대시보드 미확인**: Toss/Lemon 대시보드에서 실제 등록된 웹훅 URL이 `monkos.ai`인지 `*.run.app` 직결인지 **미확인**. 코드상 라우트는 전부 monkos.ai 서빙이므로 `monkos.ai` 경유 추정. **작가님 대시보드 접근 확인 필요.**

**CORS**: `ALLOWED_ORIGINS`에 `monkos.ai`, `idphoto-kr.monkos.ai`, `idphoto-jp.monkos.ai` + run.app 직결 포함. CF Pages 도메인은 미등록 (Phase 3에서 추가 필요).

---

## ✅ Block C — Workers 프록시 PoC

### 코드
- 위치: `functions/cf-proxy/worker.js`
- Pages Advanced Mode (`_worker.js`)로 배포 검증 완료

### 로직
```
요청 → isStaticPath 판정
  → 정적 경로 (/specs/, /idpass/, /css/ 등): env.ASSETS.fetch() → 200이면 서빙
  → 기타 (API, 결제, 웹훅 등): CR origin 프록시
    → X-Real-IP: CF-Connecting-IP 값
    → X-Proxy-Secret: 환경변수 (미등록)
    → Host: run.app 직결
```

### SPA 폴백 이슈 발견 + 해결
- `env.ASSETS.fetch()`가 미매칭 경로에도 root index.html 반환 (CF Pages SPA 폴백)
- **해결**: 정적 자산 경로 프리픽스 화이트리스트 적용 → API/결제는 직행 CR 프록시

### E2E 검증 결과

| 테스트 | URL | 결과 |
|--------|-----|------|
| ✅ Health | `/_proxy/health` | 200, `{"ok":true,"mode":"pages-advanced"}` |
| ✅ 정적 자산 | `/specs/passport/kr` | 200, 56,170 bytes (SSG PoC) |
| ✅ CR 프록시 | `/api/auth/verify-cookie` | **401, `{"error":"no session"}`** — 정확한 CR 응답 |
| ✅ X-Served-By | 응답 헤더 | `X-Served-By: cf-proxy` 확인 |

### IP 포워딩 (부분 검증)
- Worker에서 `CF-Connecting-IP` → `X-Real-IP` 헤더 설정 ✅
- CR 로그 `remoteIp`: CF 에지 IP (172.71.111.46 등) — TCP 레벨이므로 정상
- **server.js X-Real-IP 수신 검증**: Phase 2에서 server.js IP 추출 로직 수정 시 함께 검증

### 시크릿 미등록
- `WORKER_PROXY_SECRET`: 미등록 — `secret` 프로토콜 경유 등록 필요
- `CF_PAGES_API_TOKEN`: wrangler OAuth 토큰으로 배포 완료되어 즉시 불필요. 4060 빌드 시 필요.

---

## ⚠️ Block D — billing SKU 기준선 (추정)

**GCP Billing API / BigQuery billing export 미설정** — CLI/BQ 접근 불가. 서비스 구성 기반 추정:

| 서비스 | CPU | 메모리 | min | 추정 월비용 (USD) | 비고 |
|--------|-----|--------|-----|------------------|------|
| monkos-portal | 1 | 1Gi | 1 | ~$16 | 상시 가동 |
| monkos-idphoto-kr | 2 | 2Gi | 1 | ~$31 | 상시 가동 |
| monkos-idphoto-jp | 2 | 2Gi | 1 | ~$31 | 상시 가동 |
| monk-image-engine | 2 | 2Gi | 0 | ~$3 | scale-to-zero |
| monkos-studio | 1 | 1Gi | 0 | ~$1 | scale-to-zero |
| monk-n8n | 1 | 1Gi | 0 | ~$1 | scale-to-zero |
| dev 5종 | — | — | 0 | ~$1 | scale-to-zero |
| **합계** | | | | **~$84/mo (~₩126k)** | |

- **portal vs crop-engine**: portal ~$16 (~₩24k) vs crop-engine ~$3 (~₩4.5k)
- **비용 지배**: idphoto-kr + idphoto-jp (min=1, 2CPU×2GiB 상시) = ~$62 (~₩93k) — 전체의 74%
- **₩100k↔₩10k 모순 해소**: ₩100k ≈ idphoto 2종 상시비용, ₩10k ≈ portal 또는 crop-engine 단독

> ⚠️ **실비용은 GCP Console > Billing > Reports에서 확인 필요**. 위 추정은 Cloud Run 컴퓨트만 포함. 네트워킹/이그레스/Firestore/Secret Manager/Cloud Storage 미포함.

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `functions/cf-proxy/worker.js` | 신규 — CF→CR 프록시 + IP 포워딩 |

---

## 검증 체크리스트 (지시서 §검증)

| # | 항목 | 결과 |
|---|------|------|
| 1 | .pages.dev에서 SSG PoC 접근 | ✅ 200 OK, 56KB |
| 2 | Workers → CR API 호출 정상 | ✅ 401 (verify-cookie, 정확한 CR 응답) |
| 3 | IP 포워딩: X-Real-IP = 실제 클라이언트 IP | ⚠️ Worker 측 설정 확인, server.js 수신은 Phase 2 |
| 4 | 서브도메인 인벤토리 표 | ✅ 8레코드 + 11 CR서비스 |
| 5 | PG 웹훅 URL 소재 확인 | ⚠️ 코드 라우트 11건 확인, **대시보드 미접근** |
| 6 | billing SKU 분해표 | ⚠️ 구성 기반 추정 (BQ/API 미설정) |

---

## 후속 필요 사항

1. **작가님 확인**: Toss/Lemon 대시보드에서 웹훅 URL이 `monkos.ai`인지 `run.app`인지 확인
2. **작가님 확인**: GCP Console Billing Reports에서 실비용 확인 (또는 BigQuery billing export 설정)
3. **시크릿 등록**: 4060 빌드 시 `CF_PAGES_API_TOKEN` + `WORKER_PROXY_SECRET` 필요
4. **monkos-ai Pages 프로젝트**: Git 연결 빌드 전량 실패 중 — Direct Upload 전용으로 전환 권장 (Git 연결 해제)
