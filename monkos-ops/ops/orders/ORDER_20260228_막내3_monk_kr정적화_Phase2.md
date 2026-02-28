---
type: order
id: ORDER_20260228_막내3_monk_kr정적화_Phase2
date: 2026-02-28 14:50 KST
from: iMac/쌍아
to: 막내3
priority: P1
status: pending
phase: "CF→Cloud Run 이관 Phase 2"
depends_on: Phase 1 완료 후 실행
---

# 지시서: monk.kr 정적화 — Functions/D1/Auth 제거

> **[2026-02-28 14:50 KST] iMac/쌍아 → 막내3**
> **배경**: CF→Cloud Run 이관 Phase 2. Image Pro 이관(Phase 1) 완료 후 실행.
> **의존성**: Phase 1 (막내2 Image Pro 이관) 완료 대기
> **설계서**: `monkos-ops/tech/DESIGN_CF_TO_CLOUDRUN_MIGRATION.md`
> **엔드라인**: Phase 2 완료 보고 → 커밋+push

---

## 1. 작업 범위

### A. functions/ 제거 계획서 작성

**중요: 바로 삭제하지 않는다.** 먼저 제거 계획서를 작성하여 보고.

각 파일의 Cloud Run 대응 확인:

| CF Function | Cloud Run 대응 | 판정 |
|---|---|---|
| photo.js | idphoto-kr `/api/generate` | 제거 가능 |
| idgen.js | idphoto-kr `/api/idgen` | 제거 가능 |
| precheck.js | idphoto-kr `/api/pre-check` | 제거 가능 |
| qc.js | idphoto-kr `/api/qc` | 제거 가능 |
| idphoto-coaching.js | idphoto-kr WebSocket | 제거 가능 |
| idphoto-credit-use.js | portal `/api/credits/use` | 제거 가능 |
| auth.js | portal `/auth/*` | 제거 가능 |
| payment.js | portal `/api/payments/*` | 제거 가능 |
| telegram.js | portal `/api/webhook/telegram` | 제거 가능 |
| telegram-webhook.js | portal `/api/webhook/telegram` | 제거 가능 |
| simple-signup.js | portal auth | 제거 가능 |
| visitor.js | **D1 고유** — 이관/대체 판단 필요 | 🔄 보고 |
| tx.js | portal credits | 제거 가능 |
| ads.js | GCS manifest — 정적화 가능 | 🔄 보고 |
| generate.js | image.monkos.ai (Phase 1) | 제거 가능 |
| refine.js | image.monkos.ai (Phase 1) | 제거 가능 |
| analyze.js | image.monkos.ai (Phase 1) | 제거 가능 |
| translate.js | image.monkos.ai (Phase 1) | 제거 가능 |

### B. MONK_kr/ 인증 페이지 정리

| 파일 | 현재 역할 | 조치 |
|------|----------|------|
| `auth-success.html` | OAuth 콜백 → localStorage 저장 | monkos.ai 리다이렉트 또는 제거 |
| `login.html` | 로그인 폼 | monkos.ai 리다이렉트 또는 제거 |
| `simple-signup.html` | 간편가입 | monkos.ai 리다이렉트 또는 제거 |
| `auth-error.html` | 에러 표시 | monkos.ai 리다이렉트 또는 제거 |

### C. ai_lab.html 수정

- 서비스 카드가 monkos.ai 실서비스로 링크하도록 변경
- photolab → `https://idphoto-kr.monkos.ai`
- image_pro → `https://image.monkos.ai`
- lookbook → "준비 중" 또는 향후 서비스 링크
- models → 현재 유지 (CF Images 디스플레이)

### D. wrangler.toml D1 바인딩 제거 계획

- `[[d1_databases]]` 블록 제거
- D1 shared_visitors 데이터 export 필요 여부 검토

### E. _redirects 설정

```
/ai_lab/photolab/*  https://idphoto-kr.monkos.ai/:splat  301
/ai_lab/image_pro/* https://image.monkos.ai/:splat       301
/api/*              https://monkos.ai/api/:splat          301
```

---

## 2. 산출물

| # | 내용 |
|---|------|
| 1 | functions/ 제거 계획서 (각 파일별 Cloud Run 대응 확인) |
| 2 | 제거 실행 (승인 후) |
| 3 | 인증 페이지 정리 |
| 4 | ai_lab.html 링크 업데이트 |
| 5 | _redirects 설정 |

**참고**: functions/ 실제 삭제는 계획서 승인 후. visitor.js, ads.js는 판단 필요 항목으로 보고.

---

## 3. 작업 절차

```
1. MEMORY.md 읽기
2. git pull origin develop
3. Phase 1 완료 확인 (image.monkos.ai 이관 완료)
4. functions/ 전체 읽기 + Cloud Run 대응 확인
5. 제거 계획서 작성 → 보고 (승인 대기)
6. 승인 후: functions/ 제거 + wrangler.toml 수정
7. 인증 페이지 정리
8. ai_lab.html 수정
9. _redirects 설정
10. 커밋 + push
11. 완료 보고
```

---

## ⚠️ 준수 조항

- **헌법 8조**: functions/ 삭제 전 **반드시 계획서 승인** — 제거 불가 항목 사전 특정
- **ch7 3조**: monk_studio/ 절대 미접촉 — CF 정적 서빙 유지
- **ch7 1조**: main 머지 금지 — develop push까지
