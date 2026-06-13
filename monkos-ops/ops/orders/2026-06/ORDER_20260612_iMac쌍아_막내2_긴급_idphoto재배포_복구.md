---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내2
subject: "[긴급] idphoto-kr/jp 재배포 — 크레딧 API 쿠키 포워딩 복구 + deploy.sh AUTH_SECRET 추가"
status: 대기
portfolio: PF_IDPHOTO
priority: P0
---

# 지시서 — [긴급] idphoto-kr/jp 재배포 복구

> **[2026-06-12 18:45 KST]** iMac/쌍아 → iMac/막내2
> 작가님 승인. 3방향 전수조사 + 역순 추적 완료, 원인 확정.

---

## 장애 원인 (확정)

portal(6/11 배포)에 크레딧 API 쿠키 인증 필수화가 들어갔으나, idphoto-kr/jp(6/9 코드)에 쿠키 포워딩이 미배포.
- idphoto-kr(구) → portal(신) 크레딧 요청 → 쿠키 없음 → 403 → 생성 실패
- 6/10부터 고객 10c 미소진 이탈 발생 중

## 복구 작업

### Step 1 — idphoto-kr deploy.sh에 AUTH_SECRET 추가

현재 `idphoto-kr/deploy.sh`의 `--update-env-vars`에 AUTH_SECRET이 없다. 추가 필요:

```bash
--set-secrets="AUTH_SECRET=AUTH_SECRET:latest"
```

Secret Manager 경유 (portal deploy.sh 패턴 준용). **값을 하드코딩하지 않는다** (헌법 4조 1항).

idphoto-jp/deploy.sh도 동일 적용.

### Step 2 — idphoto-kr 배포

```bash
cd monkos_AI/idphoto-kr && ./deploy.sh prod
```

### Step 3 — idphoto-jp 배포

```bash
cd monkos_AI/idphoto-jp && ./deploy.sh prod
```

### Step 4 — 검증

배포 완료 후:

1. **Cloud Run rev 확인**: 새 rev가 서빙 중인지
   ```bash
   gcloud run revisions list --service=monkos-idphoto-kr --project=monkos --region=us-central1 --limit=3
   ```

2. **생성 플로우 테스트**: 작가님 또는 웹민아가 로그인 → 생성 버튼 → 충전 페이지가 아닌 생성 진행 확인

3. **크레딧 API 응답 확인**: 서버 로그에서 403 소멸 확인
   ```bash
   gcloud run services logs read monkos-idphoto-kr --project=monkos --region=us-central1 --limit=20
   ```

## ⚠️ 절대 금지

- AUTH_SECRET 값을 `'monkos-default-secret'`이나 LEMONSQUEEZY 값으로 되돌리지 않는다 — 취약점 재개방 (5715fd96 C-3이 막은 것)
- AUTH_SECRET 값을 보고서·커밋·로그에 기재하지 않는다

## ⚠️ 준수 조항

- **ch5 배포**: deploy.sh 경유 필수.
- **헌법 4조 1항**: 키 값 금지.
- **헌법 3조 1항**: 매 턴 `date` KST.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.

## 커밋 메시지

```
[fix] idphoto-kr/jp 재배포 — 크레딧 API 쿠키 포워딩 복구 + deploy.sh AUTH_SECRET SM 주입
```
