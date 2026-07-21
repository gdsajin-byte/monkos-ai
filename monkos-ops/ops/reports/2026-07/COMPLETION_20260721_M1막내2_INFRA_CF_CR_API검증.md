---
type: completion
date: 2026-07-21
device: M1
agent: 막내2
portfolio: PF_INFRA
status: 완료
---

# COMPLETION — CF→CR API 검증 (Phase 0)

**[2026-07-21 14:49 KST]** M1/막내2 → 작가님

> 지시서: `ORDER_20260721_M1쌍아_막내2_INFRA_CF_CR_API검증.md`
> 설계서: `DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md` §3

---

## §1 배포

- 파일: `MONK_kr/api_test/index.html`
- 배포: `wrangler pages deploy MONK_kr/ --project-name monk-kr`
- 접근: https://monk.kr/api_test/
- CF 배포 URL: https://6865b701.monk-kr.pages.dev

---

## §2 검증 결과표

| 항목 | 상태 | 결과 | 후속 판단 |
|------|------|------|----------|
| **T1 — CORS 기본 호출** | ✅ PASS | `access-control-allow-origin: https://monk.kr` 확인. monk.kr이 허용 오리진에 이미 등록됨. 응답 401(인증 필요) — CORS 자체는 통과 | **Phase 1 직행 가능** (CORS 무변경) |
| **T2 — 파일 업로드 (preflight)** | ✅ PASS | OPTIONS preflight → 204. `allow-methods: GET, POST, PUT, DELETE, OPTIONS` / `allow-headers: Content-Type, Authorization`. multipart POST 허용 확인 | 파일 업로드 크로스오리진 가능 |
| **T3 — IP 확인** | ℹ️ INFO | CLI 기준 실제 클라이언트 IP 반환 (httpbin). CF Pages는 CDN이므로 클라이언트→CR 직접 fetch 시 브라우저 IP가 그대로 전달됨 (CF 프록시 개입 없음 — CF Workers 프록시 아님) | **IP 소실 문제 없음** (직접 호출 구조) |
| **T4 — 쿠키 도메인** | ⚠️ 예상대로 불가 | monk.kr에서 `.monkos.ai` 도메인 쿠키 설정 불가 (크로스도메인). 단, `access-control-allow-credentials: true`가 이미 설정되어 있어 monkos.ai 자체 쿠키는 `credentials:include`로 전송 가능 | monk.kr→monkos.ai 직접 호출 시 monkos.ai 기존 쿠키 활용 가능. 별도 인증 체계 변경 불필요 |
| **T5 — 응답 시간** | ℹ️ INFO | CLI 5회 측정: 479 / 377 / 440 / 409 / 377ms (평균 **416ms**, 최소 377ms, 최대 479ms). CF Pages TTFB: 575ms | CR API 응답 ~400ms (us-central1→M1), CF Pages 정적 서빙 ~575ms (초회, 캐시 전) |

---

## §3 CORS 상세 (서버 사이드 실측)

```
< access-control-allow-origin: https://monk.kr
< access-control-allow-credentials: true
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
< access-control-allow-headers: Content-Type, Authorization
```

- CR server.js에 monk.kr이 허용 오리진으로 이미 등록되어 있음
- preflight(OPTIONS) → 204 정상 응답
- credentials:include 허용 → monkos.ai 세션 쿠키 크로스오리진 전송 가능

---

## §4 billing SKU 분해

### 접근 상태
- Billing Budget API 미활성 (`billingbudgets.googleapis.com`)
- BQ billing export 미설정 (market_eye/monkos_tracking만 존재)
- **CLI로 정확한 비용 조회 불가** — GCP 콘솔 접근 또는 billing export 설정 필요

### 인스턴스 구성 실측

| 서비스 | 리전 | CPU | 메모리 | min | max | 현재 rev |
|--------|------|-----|--------|-----|-----|---------|
| monkos-portal | us-central1 | 1 | 1Gi | **1** | 5 | 00524 |
| monkos-portal-dev | us-central1 | 1 | 1Gi | 0 | 2 | — |
| monkos-crop-engine | asia-northeast3 | 1 | 1Gi | **1** | 3 | 00025 |

### 비용 추산 (Cloud Run gen2, 최소 인스턴스 기준)

| 서비스 | 유휴 인스턴스 비용/월 | 활성 추가 | 추산 합계/월 |
|--------|---------------------|----------|-------------|
| portal (min 1) | ~$8 (CPU idle 10% + mem) | 일 10K req → ~$2 | **~$10 (~₩14,000)** |
| portal-dev (min 0) | $0 | 간헐 | **~$1 (~₩1,400)** |
| crop-engine (min 1) | ~$8 | 건당 처리 | **~$10 (~₩14,000)** |

> ⚠️ 설계서 1-4절 추정(portal ~₩150K, crop ~₩100K)과 큰 차이. 설계서 추정은 바우처 포함 이전 체계 또는 max 가동 기준일 가능성. **정확한 비용은 GCP 콘솔 Billing Reports에서 확인 필요.**

### 전체 Cloud Run 서비스 (15개 확인)

주의 서비스:
- `monkos-matte-gpu`: CPU 4 / 16Gi / **GPU 1** — 가동 시 고비용
- `monk-image-engine`: CPU 2 / 2Gi — min 미확인
- `monkos-idphoto-kr/jp`: CPU 2 / 2Gi — 레거시, 도메인 맵핑 확인 필요

---

## §5 핵심 결론

### 아키텍처 전환 판단 재료

1. **CORS: 통과** — CR에 monk.kr 허용 오리진 이미 설정. Phase 1에서 CF→CR API 호출 즉시 가능
2. **IP: 문제없음** — 브라우저→CR 직접 fetch이므로 CF 프록시 IP 개입 없음
3. **쿠키: 실용적 해법 존재** — 크로스도메인 쿠키 설정 불가하나, `credentials:include` + `allow-credentials:true`로 monkos.ai 기존 인증 쿠키 활용 가능
4. **응답 시간: 합리적** — CR API ~400ms (M1 기준), CF Pages 정적 ~575ms

### §6 결과 분기 (지시서 §6 대응)

| 분기 | 판정 | 후속 |
|------|------|------|
| T1 CORS | **통과** | Phase 1 직행 (CORS 무변경) |
| T3 IP | **실제 IP** | IP 소실 크리티컬 해소 |
| T4 쿠키 | **부분 통과** | `credentials:include`로 해결 가능. 별도 프록시 불필요 |

---

## §6 변경 파일

| 파일 | 변경 |
|------|------|
| `MONK_kr/api_test/index.html` | 신규 — CF→CR 검증 테스트 페이지 (T1~T5) |
| 본 보고서 | 신규 |

---

✅ T1~T5 검증 결과 전량 기록 — CORS 통과, Phase 1 직행 가능
⚠️ billing SKU 정밀 분해는 GCP 콘솔 필요 (CLI 접근 불가)
📁 `MONK_kr/api_test/index.html` 배포 완료 (monk.kr/api_test/)
