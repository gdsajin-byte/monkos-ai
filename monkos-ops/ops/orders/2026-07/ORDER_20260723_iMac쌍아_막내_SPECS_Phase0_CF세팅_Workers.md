---
type: order
date: 2026-07-23
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_SPECS
---

# Phase 0 — CF Pages 프로젝트 세팅 + Workers 프록시 PoC + DNS 인벤토리

**[2026-07-23 15:20 KST]** iMac/쌍아 → 막내

> 설계: [DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md](../../tech/designs/2026-07/DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md) Phase 0
> 배경: monkos.ai NS는 이미 Cloudflare (7/23 민아 실측). CF Pages 프로젝트 신설 + Workers 프록시 패턴 검증이 SSG 전환의 기반.

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키·토큰 생성/추측 절대 금지. CF API 토큰은 `secret` 프로토콜 경유.
- ch5 배포 규칙: deploy.sh 경유 원칙 (CF Pages는 별도 — wrangler 직접 사용 허용)
- data-access.md: 시크릿 등록은 작가님에게 `secret` 실행 요청

---

## 작업 항목

### Block A — CF Pages 프로젝트 세팅

1. **Cloudflare 대시보드에서 Pages 프로젝트 생성**
   - 프로젝트명: `monkos-ai` (작가님 확인 필요)
   - 빌드 설정: 없음 (Direct Upload 방식 — 4060에서 빌드 후 업로드)
   - 커스텀 도메인: **아직 연결하지 않음** (Phase 3에서 apex orange 전환 시 연결)

2. **테스트 페이지 배포**
   - 기존 SSG PoC 출력물 (`MONK_kr/specs-test/kr-passport/index.html`) 활용
   - `wrangler pages deploy` 으로 `.pages.dev` 도메인에 테스트 배포
   - 접근 확인

### Block B — DNS/웹훅 인벤토리

1. **서브도메인 전수 조사** (Cloudflare DNS 레코드 전량 + `gcloud beta run domain-mappings list`)
   - 각 서브도메인의: 타입(A/CNAME), 프록시 상태(orange/gray), 대상 서비스, 인증서 소유
   - 결과를 표로 정리

2. **PG 웹훅 URL 소재 확인**
   - Toss Payments 대시보드: 웹훅 URL이 `monkos.ai` 인지 `*.run.app` 직결인지
   - Lemon Squeezy 대시보드: 동일 확인
   - **확인만** — 변경하지 않음. 보고에 기재.

### Block C — Workers 프록시 PoC

1. **Workers 스크립트 작성** (`functions/cf-proxy/worker.js` 또는 CF 대시보드)
   - 로직:
     ```
     요청 → Pages 정적 자산 확인 → 있으면 서빙
                                  → 없으면 CR origin (run.app 직결) 프록시
     ```
   - **IP 포워딩**: `CF-Connecting-IP` → 커스텀 헤더 `X-Real-IP` 포워딩
   - **위조 방지**: 시크릿 헤더 (값은 `secret` 프로토콜 경유)

2. **`.pages.dev` 도메인에서 테스트** (monkos.ai 도메인은 아직 연결 안 함)
   - Workers 경유 → CR API 호출 E2E 확인
   - IP 포워딩 검증: `X-Real-IP`가 실제 클라이언트 IP인지 CR 로그에서 확인

### Block D — billing SKU 기준선 실측

1. **GCP Billing 콘솔에서 Cloud Run 서비스별 비용 분해**
   - portal vs crop-engine vs 기타 — 월별 실비용
   - ₩100k↔₩10k 모순 해소 (7/21 민아 교차검증 #9)
2. 결과를 완료 보고에 표로 포함

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| (신규) Workers 스크립트 | CF→CR 프록시 + IP 포워딩 |
| `monkos-ops/ops/SECRET_INVENTORY.md` | CF API 토큰 메타 1행 (값 금지) |

**기존 코드 수정 없음** — 이 Phase는 인프라 세팅과 검증만.

---

## 시크릿 요청

작업 중 다음 시크릿이 필요합니다. 작가님에게 요청:

1. **CF API 토큰** — Pages 프로젝트 배포용 (최소 스코프: 해당 Pages 프로젝트 Edit)
2. **Workers 프록시 시크릿** — IP 포워딩 위조 방지용 (임의 생성)

```
시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
이름: CF_PAGES_API_TOKEN
발급처: Cloudflare 대시보드 → API Tokens → Create Token → Pages Edit
```

```
시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
이름: WORKER_PROXY_SECRET
발급처: 임의 생성 (openssl rand -hex 32)
```

---

## 검증

1. `.pages.dev` 도메인에서 SSG PoC 페이지 접근 가능
2. Workers 프록시 경유 → CR API 호출 정상 (최소 /api/auth/verify-cookie)
3. IP 포워딩 검증 — CR 로그에서 X-Real-IP = 실제 클라이언트 IP
4. 서브도메인 인벤토리 표 완성
5. PG 웹훅 URL 소재 확인 완료
6. billing SKU 분해표 완성

---

## 완료 보고

- 수발신 헤더 필수
- COMPLETION 파일 생성 (인벤토리 표 + billing 분해표 포함)
- PF_SPECS 히스토리 1행 어펜드
- 커밋 → 푸시

---

## ⚠️ 금지

- monkos.ai 도메인을 CF Pages에 연결하지 않음 (Phase 3에서 실행)
- CR 코드 수정 없음
- 기존 DNS 레코드 변경 없음
- 시크릿 값 노출/생성 금지
