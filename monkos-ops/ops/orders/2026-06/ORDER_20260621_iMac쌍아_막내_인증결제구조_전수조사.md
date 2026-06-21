---
type: order
date: 2026-06-21
from: iMac/쌍아
to: iMac/막내
status: 대기
portfolio: PF_STYLER
subject: 인증·결제 구조 전수 조사 — OAuth 리다이렉션·Toss/LemonSqueezy 연동·크레딧 흐름 맵핑
---

# 인증·결제 구조 전수 조사

> **[2026-06-21 16:24 KST]** iMac/쌍아 → 막내
> 작가님 지시: 현재 인증과 결제 구조를 전수 조사하라.

## 1. 목적

포털(monkos.ai) 서브디렉토리 `/headshot`에 새 가격 체계(10c 통합)와 인증 흐름을 적용하기 위한 사전 조사. 현행 인증·결제가 어떻게 연결되어 있는지 정확히 파악하여, 추가 심사/등록 없이 바로 적용 가능한지 판단.

## 2. 조사 범위

### A. OAuth 인증 (3사)

각 OAuth 프로바이더에 대해:

1. **등록된 redirect URI** — Google/Kakao/Line 개발자 콘솔에 어떤 도메인·경로가 등록되어 있는지
2. **코드 내 callback 경로** — `server.js`, `lib/auth.js`에서 처리하는 callback URL
3. **도메인 범위** — `monkos.ai`만 등록? `idphoto.monkos.ai`, `idphoto-jp.monkos.ai`도 등록?
4. **서브디렉토리 영향** — `/headshot`에서 로그인 시 redirect URI가 바뀌어야 하는지, 기존 `/auth/google/callback` 그대로 쓸 수 있는지

#### 조사 파일

| 파일 | 확인 사항 |
|------|----------|
| `monkos_AI/portal/lib/auth.js` | redirect URI 구성 로직, callback 처리, 토큰 발급 |
| `monkos_AI/portal/server.js` | `/auth/*` 라우트 매핑 |
| `monkos_AI/idphoto-kr/server.js` | 별도 인증 로직 유무 |
| `monkos_AI/idphoto-jp/server.js` | 별도 인증 로직 유무 |
| `.env` 또는 Secret Manager | OAuth client ID/secret 키 이름 확인 (값은 보지 말 것) |

### B. 결제 시스템 (Toss + LemonSqueezy)

각 결제 수단에 대해:

1. **등록된 도메인/웹훅 URL** — Toss/LemonSqueezy 대시보드에 어떤 URL이 설정되어 있는지 (코드에서 추론)
2. **코드 내 결제 흐름** — checkout 요청 → 결제 완료 → 웹훅 → 크레딧 충전 전체 경로
3. **리다이렉션 구조** — 결제 완료 후 어디로 돌아오는지 (`/toss-success`, `/toss-fail` 등)
4. **결제 상품 정의** — 현재 어떤 크레딧 패키지가 정의되어 있는지 (금액, 크레딧 수)
5. **서브디렉토리 영향** — `/headshot`에서 결제 시 기존 결제 경로 그대로 사용 가능한지

#### 조사 파일

| 파일 | 확인 사항 |
|------|----------|
| `monkos_AI/portal/lib/payments.js` | Toss/LemonSqueezy 결제 로직 전체 |
| `monkos_AI/portal/lib/credits.js` | 크레딧 조회/차감/환불 로직 |
| `monkos_AI/portal/server.js` | `/api/checkout`, `/api/payments/*`, `/api/webhooks/*` 라우트 |
| `monkos_AI/portal/public/` 내 결제 관련 JS | 클라이언트 측 결제 UI 로직 |
| `monkos_AI/idphoto-kr/server.js` | kr 자체 결제 로직 유무 (포털과 공유? 별도?) |
| `monkos_AI/idphoto-jp/server.js` | jp 자체 결제 로직 유무 |

### C. 크레딧 시스템

1. **크레딧 차감 포인트** — 어떤 API에서 몇 c를 차감하는지 전수 파악
2. **현행 단가표** — 생성 10c, 다운로드 70c 등 하드코딩 위치
3. **가입 보너스 로직** — 10c 지급 코드 위치, 조건 (첫 가입만? 중복 방지?)
4. **크레딧 공유 범위** — 포털/kr/jp가 같은 Firestore 크레딧 풀을 쓰는지, 별도인지

### D. 서비스 간 관계

1. **idphoto-kr/jp가 포털 인증을 공유하는지** — 별도 OAuth? 포털 API 프록시?
2. **쿠키/토큰 도메인** — `monkos.ai` 쿠키가 서브도메인(`idphoto.monkos.ai`)에도 유효한지
3. **CORS 설정** — 서비스 간 API 호출 허용 범위

## 3. 산출물

아래 형태의 보고서:

```markdown
## 인증 맵
- Google OAuth: redirect URI = ..., callback = ..., 도메인 범위 = ...
- Kakao OAuth: ...
- Line OAuth: ...
- 서브디렉토리 영향: 추가 등록 필요/불필요

## 결제 맵
- Toss: 웹훅 URL = ..., 리다이렉트 = ..., 상품 정의 = ...
- LemonSqueezy: ...
- 서브디렉토리 영향: 추가 심사 필요/불필요

## 크레딧 맵
- 차감 포인트: [파일:라인] 생성 10c, [파일:라인] 다운로드 70c, ...
- 가입 보너스: [파일:라인] 10c 지급
- 크레딧 풀: 공유/별도

## 서비스 간 관계
- 인증: 공유/별도
- 쿠키 도메인: ...
- CORS: ...

## 결론
- /headshot에 새 가격 적용 시 추가 심사/등록 필요 여부: YES/NO
- 변경 필요 파일 목록
```

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: OAuth client secret, API 키 등 실값을 보고서에 기재 금지. 키 이름과 위치만 기록.
- **읽기 전용**: 코드 수정 없이 조사만 수행.

## 5. 보고 형식

```
✅ 인증·결제 구조 전수 조사 완료
📁 보고서: REPORT_20260621_막내_인증결제구조_전수조사.md
```

보고서는 `monkos-ops/ops/reports/2026-06/`에 배치.
