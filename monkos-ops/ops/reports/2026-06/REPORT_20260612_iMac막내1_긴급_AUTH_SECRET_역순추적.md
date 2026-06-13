---
type: report
date: 2026-06-12
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: "[긴급] AUTH_SECRET 역순 추적 — 타임라인 + 감지 실패 분석"
portfolio: PF_IDPHOTO
priority: P0
---

# AUTH_SECRET 역순 추적

> **[2026-06-12 18:38 KST]** iMac/막내1 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내1_긴급_AUTH_SECRET_역순추적.md`

---

## ⚠️ 전 보고서(전수조사 A) 수정

전수조사 A에서 "AUTH_SECRET 키 불일치"를 근본 원인으로 지목했으나 **틀렸다**. 리비전 실측 결과 AUTH_SECRET은 rev 00277(6/9) 이전부터 설정됨 — 키 전환이 원인이 아님.

**수정된 근본 원인: 비대칭 배포 — portal에 C-2(크레딧 인증) 배포됨 + idphoto-kr에 C-2(쿠키 포워딩) 미배포**

---

## 1. 코드 타임라인 (AUTH_SECRET 등장 전 커밋)

| 날짜 | 커밋 | 변경 | 의도 |
|------|------|------|------|
| 2026-02-28 | `70aee0dd` | config.js: `authSecret = AUTH_SECRET \|\| LEMONSQUEEZY \|\| 'monkos-default-secret'` 도입 | 인증 시크릿과 결제 시크릿 분리. AUTH_SECRET 미설정 시 폴백 |
| 2026-02-28 | `6f0aee64` | **portal deploy.sh**: `AUTH_SECRET=${AUTH_SECRET}` 추가 | 배포 시 AUTH_SECRET 주입 경로 확보 |
| 2026-04-08 | `4f71cbc1` | idphoto-kr/jp deploy.sh: GEMINI_API_KEY .env 읽기 제거, 콘솔 직접 세팅 방식으로 전환 | deploy.sh에서 시크릿 노출 근본 차단 |
| **2026-06-10** | **`5715fd96`** | **C-2**: portal credits.js에 `getAuthenticatedUserId(req)` 추가 (쿠키 인증 필수). idphoto-kr server.js에 쿠키 포워딩 추가 + `/api/credit/use` 로컬 인증 추가. **C-3**: config.js 'monkos-default-secret' 폴백 제거 → `process.exit(1)` | 보안 페일클로즈 — 크레딧 API 무인증 접근 차단 |
| **2026-06-11** | **`9606ee45`** | portal deploy.sh: `--update-env-vars`에서 AUTH_SECRET **제거**, 3개 시크릿 `--set-secrets` 전환 | 시크릿 SM 런타임 주입 전환 |

## 2. 토큰 서명 키 변천

| 시점 | authSecret 계산 | 실제 서명 키 | 비고 |
|------|----------------|-------------|------|
| ~02-28 이전 | `LEMONSQUEEZY \|\| 'monkos-default-secret'` | LEMONSQUEEZY_WEBHOOK_SECRET | config.js 이전 버전 |
| 02-28 (70aee0dd) | `AUTH_SECRET \|\| LEMONSQUEEZY \|\| 'default'` | ❓ AUTH_SECRET 설정 시점에 따라 | AUTH_SECRET 미설정이면 LEMONSQUEEZY |
| **전 리비전 (00277+)** | `AUTH_SECRET(설정됨) \|\| LEMONSQUEEZY \|\| 'default'` | **AUTH_SECRET** | rev 00277(6/9)에서 이미 동일 값 확인 |
| 06-10 (5715fd96) | `AUTH_SECRET \|\| LEMONSQUEEZY` (default 제거) | AUTH_SECRET (변경 없음) | 코드 변경이나 실효 없음 |

**결론: AUTH_SECRET은 6/9 이전부터 일관되게 설정됨. 서명 키 전환은 발생하지 않았다.**

## 3. 배포 타임라인

### portal (핵심)

| Rev | 배포 시각 (UTC) | 추정 기반 커밋 | AUTH_SECRET |
|-----|----------------|--------------|-------------|
| 00277 | 2026-06-09 08:21 | 6/9 세션 마감 커밋 | ✅ 설정됨 (동일값) |
| **00278** | **2026-06-10 08:13** | 5715fd96 **이전** (패치 16:33) | ✅ 설정됨 |
| **00279** | **2026-06-11 03:20** | **5715fd96 포함** — C-2(크레딧 인증) 배포 | ✅ 설정됨 |
| 00280~00286 | 2026-06-11 03:36~07:52 | 후속 배포 (9606ee45 포함) | ✅ 설정됨 |

### idphoto-kr (핵심)

| Rev | 배포 시각 (UTC) | 추정 기반 커밋 | C-2 포함 |
|-----|----------------|--------------|---------|
| **00192** | **2026-06-09 06:25** | 5715fd96 **이전** | ❌ **미포함** |

**idphoto-kr은 보안 패치(5715fd96) 이후 단 한 번도 배포되지 않았다.**

## 4. 🚨 수정된 근본 원인 — 비대칭 배포

```
[6/9] idphoto-kr 마지막 배포 (rev 00192) — 구 코드: useCredits() 쿠키 미포워딩
[6/11 03:20] portal 배포 (rev 00279) — 신 코드: credits.js에 쿠키 인증 필수 (C-2)

→ portal이 쿠키 인증을 요구하는데, idphoto-kr은 쿠키를 보내지 않는다
```

**장애 재현 경로**:

1. `initCredits()` → browser → portal verify-cookie (쿠키 포함, CORS OK) → 390c ✅
2. 클라이언트 체크: 390 >= 10 → 통과 ✅
3. POST `/api/idgen` → idphoto-kr **구 코드**: `useCredits(userId, 'generate')` — **쿠키 미포워딩**
4. portal `handleCreditsUse` → `getAuthenticatedUserId(req)` → Cookie 헤더 없음 → null → **403**
5. idphoto-kr: `creditResult = { error: '인증 필요' }` → `!creditResult.success` → **402** 반환
6. 클라이언트: 402 catch → `showCreditModal(10, 0, 'generate')` → 충전 페이지 이동

## 5. 수정안 (전수조사 A 보고서 대체)

### 즉시 조치 (P0 — 서비스 복구)

**idphoto-kr 재배포** — 최신 코드(쿠키 포워딩 포함)로:
```bash
cd monkos_AI/idphoto-kr && ./deploy.sh prod
```

⚠️ **단, deploy.sh에 AUTH_SECRET 미포함** 문제 잔존:
- `/api/credit/use`, `/api/credit/refund` 로컬 인증 실패 (localAuthSecret = '')
- 이 엔드포인트는 다운로드 크레딧 처리에 사용됨
- **deploy.sh에 AUTH_SECRET 주입 추가** 또는 **로컬 인증 제거 (portal 위임)** 필요

### 완전 수정안

```bash
# idphoto-kr deploy.sh에 추가:
--set-secrets="AUTH_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest"

# 또는 AUTH_SECRET을 SM에 등록 후:
gcloud secrets create AUTH_SECRET --project=monkos --data-file=- <<< "<값>"
--set-secrets="AUTH_SECRET=AUTH_SECRET:latest"
```

## 6. 감지 실패 분석

### 왜 사전에 감지하지 못했는가

| 실패 지점 | 원인 | 방지책 |
|----------|------|--------|
| **배포 비대칭 미검출** | portal만 배포하고 idphoto-kr 미배포. 보안 패치 지시서에 "전 서비스 동시 배포" 미명시 | 크로스서비스 의존성 변경 시 **의존 서비스 동시 배포 의무화** |
| **E2E 미검증** | 배포 후 실제 생성 플로우 테스트 없음 | 배포 후 **생성→다운로드 1회 E2E** 필수화 |
| **서버간 API 변경 비가시** | portal의 credits.js 인증 추가가 idphoto-kr에 미치는 영향을 지시서에서 언급했으나, 배포 누락 | **API 계약 변경 시 소비자 서비스 배포 체크리스트** |
| **Cloud Run 리비전 미대조** | 커밋은 됐지만 배포 여부를 확인하지 않음 | 보안 패치 배포 후 `gcloud run revisions list` 대조 |

### 보안 패치 지시서(5715fd96 근거)의 배포 항목

지시서에 C-2가 portal + idphoto-kr **양쪽** 변경을 포함했으나:
- portal은 6/11 배포됨 ✅
- idphoto-kr은 **배포 누락** ❌
- 지시서에 "양쪽 서비스 동시 배포 필수" 게이트가 없었음

---

## 7. AUTH_SECRET 환경변수 현황

| 항목 | 값 |
|------|-----|
| Secret Manager 등록 | ❌ 미등록 (`gcloud secrets versions list` → NOT_FOUND) |
| portal Cloud Run | ✅ plaintext env var (rev 00277 이전부터 설정, 동일값 유지) |
| idphoto-kr Cloud Run | ❌ 미설정 |
| idphoto-jp Cloud Run | ❌ 미확인 (동일 구조 추정) |
| deploy.sh (현행 9606ee45) | ❌ 제거됨 (이전엔 `${AUTH_SECRET}` 참조 존재) |

**AUTH_SECRET은 SM에 없고, deploy.sh에서도 제거됨. 현재 portal에 잔존하는 plaintext env var만 유일한 소스.**

---

**감사 완료**
**[2026-06-12 18:38 KST] iMac/막내1**
