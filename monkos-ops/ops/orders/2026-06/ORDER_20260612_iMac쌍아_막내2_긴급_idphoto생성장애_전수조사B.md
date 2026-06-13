---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내2
subject: "[긴급] idphoto 생성 장애 전수조사 B — 서버 인증 로직 + 배포 환경변수 + Cloud Run 실측"
status: 대기
portfolio: PF_IDPHOTO
priority: P0
---

# 지시서 — [긴급] idphoto 생성 장애 전수조사 B

> **[2026-06-12 18:12 KST]** iMac/쌍아 → iMac/막내2
> 작가님 직접 확인: 프로덕션 생성 장애. 2건 분할 B건 (A: 막내1).
> 상호 교차 감사.

---

## 증상·용의 커밋

A건과 동일. `5715fd96` + `0d43fde6` + `9606ee45` 용의.

## Task B — 서버 인증 로직 + 배포 환경 + Cloud Run 실측

### B-1. portal 서버 인증 로직 전수

`monkos_AI/portal/lib/auth.js`:
1. `handleVerifyCookie()` — 쿠키 파싱 → `verifyAuthToken()` → Firestore 조회 → credits 반환. 각 단계 실패 경로 전수 확인
2. `verifyAuthToken()` — `0d43fde6`에서 timingSafeEqual 전환됨. 이 전환이 토큰 검증 로직을 깨뜨리는지 (인코딩 불일치, Buffer 변환 문제 등)
3. AUTH_SECRET 로딩: `process.env.AUTH_SECRET` 확인. `5715fd96`에서 폴백 제거 → 미설정 시 `process.exit(1)` → **서버 자체가 기동하지 않아야 하는데**, 서버가 살아있으면 AUTH_SECRET은 있는 것. 그렇다면 문제는 값이 달라진 것일 수 있음

### B-2. credits.js 인증 미들웨어

`monkos_AI/portal/lib/credits.js`:
1. `5715fd96` C-2에서 추가된 인증 미들웨어 전수 확인
2. idphoto-kr에서 `/api/credits?userId=...` 호출 시 인증 헤더/쿠키가 필요해졌는지
3. `shared.js:fetchLatestCredits()`가 credentials:'include'로 호출하는데, CORS가 쿠키를 통과시키는지

### B-3. Cloud Run 환경변수 실측

```bash
gcloud run services describe monkos-portal --project=monkos --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

- AUTH_SECRET이 환경변수에 존재하는지
- `9606ee45` deploy.sh --set-secrets 전환 이후 시크릿 주입이 정상인지
- **rev 번호 확인**: 현재 서빙 중인 rev가 어느 커밋 기반인지

```bash
gcloud run services describe idphoto-kr --project=monkos --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

- idphoto-kr도 동일 확인

### B-4. 배포 이력 대조

```bash
gcloud run revisions list --service=monkos-portal --project=monkos --region=us-central1 --limit=5
gcloud run revisions list --service=idphoto-kr --project=monkos --region=us-central1 --limit=5
```

- 6/10 이후 배포된 rev 목록
- 각 rev가 어느 커밋에 대응하는지 대조
- 장애 시작 시점과 배포 시점 일치 여부

### B-5. CORS 설정 확인

idphoto-kr.monkos.ai → monkos.ai/api/auth/verify-cookie 호출 시:
1. portal server.js의 CORS 헤더에 `idphoto-kr.monkos.ai`가 허용 origin에 있는지
2. `Access-Control-Allow-Credentials: true` 설정 여부
3. `5715fd96` 이전/이후 CORS 변경 여부

## 산출물

`monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내2_긴급_idphoto생성장애B.md`

## ⚠️ 준수 조항

- **헌법 4조 2항**: 읽기 전용. 코드 수정 금지 — 원인 특정 후 수정안을 보고.
- **헌법 4조 1항**: 키 값 금지. 환경변수 이름+존재 여부만.
- **헌법 3조 1항**: 매 턴 `date` KST.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.

## 교차 감사

막내1 보고서(프론트+API)와 교차:
- 프론트 인증 실패 경로와 서버측 원인의 인과 일치 여부
- 수정안이 동일 원인을 가리키는지

## 커밋 메시지

```
[research] idphoto 생성 장애 전수조사 B — 서버 인증+배포 환경+Cloud Run 실측
```
