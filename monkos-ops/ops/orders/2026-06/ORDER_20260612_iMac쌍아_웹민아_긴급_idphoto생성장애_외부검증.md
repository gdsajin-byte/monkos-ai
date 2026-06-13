---
type: order
date: 2026-06-12
from: iMac/쌍아
to: 웹/민아
subject: "[긴급] idphoto 생성 장애 외부 검증 — CDP 실측 + API 응답 확인"
status: 대기
portfolio: PF_IDPHOTO
priority: P0
---

# 지시서 — [긴급] idphoto 생성 장애 외부 검증

> **[2026-06-12 18:14 KST]** iMac/쌍아 → 웹/민아
> 작가님 직접 확인: 크레딧 390 보유 상태에서 생성 버튼 → 충전 페이지로 리다이렉트. 프로덕션 장애.
> 막내1(프론트+API), 막내2(서버+배포)가 내부 코드 분석 중. 웹/민아는 **외부에서** 실측 검증.

---

## 증상

- idphoto-kr.monkos.ai에 로그인, 크레딧 있는 상태
- 생성 버튼 클릭 → 충전 페이지로 보냄 (생성이 실행되지 않음)
- 이틀 전(6/10)까지 정상 작동
- 어제부터 고객들이 무료 10c를 소진하지 않고 이탈

## 용의 커밋

- `5715fd96` (6/10) — 보안 페일클로즈 패치 (크레딧 API 인증 미들웨어 + AUTH_SECRET 폴백 제거)
- `0d43fde6` (6/11) — timingSafeEqual 전환
- `9606ee45` (6/11) — deploy.sh --set-secrets 전환

## 웹/민아 임무 — 외부 실측

### E-1. 프로덕션 API 응답 실측

외부에서 직접 호출하여 응답 확인:

1. **verify-cookie 엔드포인트**:
   ```
   curl -v https://monkos.ai/api/auth/verify-cookie
   ```
   - 비로그인 시 401 정상인지
   - 응답 헤더의 CORS 설정 확인 (Access-Control-Allow-Origin, Allow-Credentials)

2. **크레딧 API**:
   ```
   curl -v "https://monkos.ai/api/credits?userId=test"
   ```
   - 5715fd96 이후 인증 미들웨어가 추가됨 → 비인증 시 401/403 반환하는지
   - 이전에는 인증 없이 userId만으로 조회 가능했을 수 있음

3. **idphoto-kr에서 portal로의 크로스 도메인 요청**:
   - `idphoto-kr.monkos.ai` → `monkos.ai/api/auth/verify-cookie` 호출 시 CORS preflight 응답 확인
   - `Access-Control-Allow-Origin`에 `idphoto-kr.monkos.ai`가 포함되는지

### E-2. CDP 9223 재현 실측

1. 9223으로 `idphoto-kr.monkos.ai` 접속
2. 브라우저 콘솔(DevTools > Console)에서 에러 확인:
   - CORS 에러?
   - 401/403 응답?
   - `initCredits()` 실패 로그?
3. Network 탭에서 `verify-cookie` 요청의 실제 응답 코드 확인
4. `store.user.credits` 실제 값 확인 (콘솔에서 확인 가능하면)

### E-3. idphoto-jp도 동일 증상인지

`idphoto-jp.monkos.ai`에서도 같은 현상이 재현되는지 확인 (5715fd96가 idphoto-jp도 변경했으므로).

### E-4. Cloud Run 서비스 상태 확인

```
curl -s -o /dev/null -w "%{http_code}" https://monkos.ai/
curl -s -o /dev/null -w "%{http_code}" https://idphoto-kr.monkos.ai/
curl -s -o /dev/null -w "%{http_code}" https://idphoto-jp.monkos.ai/
```

서비스 자체가 살아있는지 (AUTH_SECRET 미설정 시 process.exit(1)로 서버 사망 가능).

## 산출물

보고서를 PR로 납품:
- `monkos-ops/ops/reports/2026-06/REPORT_20260612_웹민아_긴급_idphoto생성장애_외부검증.md`

## ⚠️ 준수 조항

- 읽기 전용. 코드 수정 금지.
- 작가님 계정으로 로그인 시도 금지 — 비로그인 상태에서 API 응답만 확인.
- 헌법 3조 1항: 매 턴 `date` KST.
- 헌법 3조 2항: 완료 보고 `✅❌💡⏳📁🔀`.

## 커밋 메시지

```
[research] idphoto 생성 장애 외부 검증 — API 실측 + CDP 재현 + CORS 확인
```
