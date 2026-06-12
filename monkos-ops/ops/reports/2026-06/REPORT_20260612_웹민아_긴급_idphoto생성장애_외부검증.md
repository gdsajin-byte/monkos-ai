---
type: report
date: 2026-06-12
device: 웹
agent: 민아
to: iMac/쌍아, 작가님
subject: "[긴급] idphoto 생성 장애 외부 검증 — 인프라·CORS 기각, AUTH_SECRET 세션 무효화 유력 + 쿠키 강제삭제 증폭 발견"
status: 완료
portfolio: PF_IDPHOTO
priority: P0
---

# REPORT — [긴급] idphoto 생성 장애 외부 검증

> **[2026-06-12 19:30 KST] 웹/민아 → iMac/쌍아, 작가님**
> 근거 지시서: `ORDER_20260612_iMac쌍아_웹민아_긴급_idphoto생성장애_외부검증.md`
> 전 항목 비로그인 외부 실측 (작가님 계정 미사용, 읽기 전용 준수). 실측 시각 18:18~19:25 KST.

## 0. 결론 요약

**인프라·CORS·엔드포인트 생존은 전부 정상 — 외부에서 보이는 장애가 없다.** 즉 장애는 "서버가 죽었다/막혔다"가 아니라 **인증 검증 값의 불일치** 계열이다. 외부 증거가 가리키는 유력 가설:

> **H1 (유력): AUTH_SECRET 값 변경/누락으로 기존 세션 쿠키 전면 무효화.** 용의 커밋 9606ee45(6/11, deploy.sh --set-secrets 전환)가 AUTH_SECRET 주입 경로를 바꿨다면(구 콘솔 직접 설정값 ↔ SM 주입값 불일치 또는 누락), 기존 고객의 `monkos_session` 서명 검증이 전부 실패한다. 그리고 **외부 실측으로 확인한 증폭기**: 서명 불일치 시 서버가 401과 함께 **쿠키를 `.monkos.ai` 전역 강제 삭제**한다(아래 §5). 결과: 고객은 로그아웃/크레딧 0 상태로 떨어지고, 게이트마다 충전·로그인 유도를 만난다. "어제부터 무료 10c 미소진 이탈" 패턴과 정합.
> 타임라인 정합: 브리핑 P0 잔여 "idphoto-kr/jp AUTH_SECRET 설정+배포 2일째 대기"(06-11 브리핑) + 6/10~11 보안 패치 3종 배포 직후 발병.

## 1. E-4 — 서비스 생존 (✅ 전부 정상)

| URL | HTTP |
|---|---|
| monkos.ai | 200 |
| idphoto-kr.monkos.ai | 200 |
| idphoto-jp.monkos.ai | 200 |

→ "AUTH_SECRET 미설정 → process.exit(1) 서버 사망" 가설 **기각** (적어도 현 리비전은 기동 상태).

## 2. E-1 — 프로덕션 API 외부 실측

| # | 호출 | 결과 | 판정 |
|---|---|---|---|
| 1 | `GET /api/auth/verify-cookie` (비로그인) | **401** `{"error":"no session"}` | ✅ 설계대로 |
| 2 | `GET /api/credits?userId=test` (비인증) | **403** `{"error":"인증 필요"}` | ✅ 5715fd96 미들웨어가 **prod에 배포돼 있음을 확인** |
| 3 | 위 2건 + `Origin: https://idphoto-kr.monkos.ai` | `access-control-allow-origin: https://idphoto-kr.monkos.ai` + `allow-credentials: true` 정확 에코 | ✅ **CORS 기각** |
| 4 | `OPTIONS` preflight (GET/content-type) | **204** + 동일 CORS 헤더 | ✅ preflight 정상 |
| 5 | `POST idphoto-kr/api/precheck`·`/api/idgen` (빈 바디) | **400** (바디 검증) — 401/403 아님 | ✅ 생성 API 입구가 인증으로 막힌 것 아님 |

⚠️ 참고: Origin 헤더 없는 호출엔 ACAO가 생략된다(에코 방식) — curl 단독 테스트 시 CORS 오판 주의.

## 3. E-2 — CDP 재현: 환경 제약으로 불가 → 대체 실측

- CDP 9223은 로컬 네트워크 엔드포인트 — 웹 컨테이너에서 도달 불가. 로그인 재현은 지시서 금지 조항(작가님 계정 미사용)으로도 불가. **"점검 불가(환경 제약)"** — 로그인 상태 콘솔/Network 실측은 로컬 디바이스(iMac 민아/막내) CDP 몫.
- **대체 실측 — 라이브 번들 정적 검증**: 라이브 `/prep.js?v=v5` 및 소스 대조로 프론트 로직 확인:
  - `initCredits()` → `verify-cookie` `credentials:'include'` ✅ 올바름 (shared.js:292)
  - **충전 모달 분기 2곳**: 생성 = `store.user.credits < CREDIT_COST.generate` (result.js:220) / 다운로드 = (result.js:344)
  - `store.user.credits`는 **오직 verify-cookie 응답 `data.user.credits ?? 0`** 으로 결정 (shared.js:303) — 이 값이 0이면 실잔액과 무관하게 충전 모달.

## 4. E-3 — idphoto-jp 동일 영향 구조 (✅ 확정)

- jp `config.js` 실측: `PORTAL_URL = https://monkos.ai` — **kr과 동일한 포털 인증·크레딧 API 공유**.
- jp 자체 API(`/api/precheck`)도 kr과 동일 응답(400). → 포털 측 원인이면 **kr·jp 동시 발병이 구조적 필연**.

## 5. 🔴 핵심 발견 — 무효 토큰 시 쿠키 전역 강제 삭제 (증폭기)

위조 서명 쿠키로 실측:

```
GET /api/auth/verify-cookie  (Cookie: monkos_session=<서명 불일치 토큰>)
→ HTTP 401 {"error":"invalid token"}
→ Set-Cookie: monkos_session=; Domain=.monkos.ai; Path=/; Max-Age=0   ← 전역 즉시 삭제
(동일 쿠키로 /api/credits → 403)
```

의미: **AUTH_SECRET이 한 번이라도 다른 값으로 배포되면, 그 기간 접속한 모든 고객의 세션 쿠키가 영구 소거된다.** 비밀값을 원복해도 고객은 자동 복구되지 않고 재로그인이 필요하다. 6/10 이후 접속 고객의 이탈("무료 10c 미소진")과 정합하며, **복구 후 고객 공지(재로그인 안내) 필요성**까지 시사한다.

## 6. 막내1·2 판별 포인트 인계 (외부에서 못 보는 마지막 한 칸)

1. **Cloud Run 로그 grep**: portal 로그에서 `invalid token`·`인증 필요`·`조회 거부: 세션(...)≠요청(...)` 비율의 **6/10~11 전후 급증 여부** — H1의 직접 증거.
2. **AUTH_SECRET 출처 대조**: 현 portal 리비전의 AUTH_SECRET이 ①구 콘솔 직접 설정값 ②SM 주입값 ③미설정 중 무엇인지 + 9606ee45 전후 리비전 간 **값 동일성** (값 자체 비교 금지, 해시/지문 대조 — 헌법 4조 1항).
3. idphoto-kr/jp 자체 서비스의 AUTH_SECRET 미설정 잔여(브리핑 P0, 2일째)가 이번 패치 코드 경로에서 실제 사용되는지.
4. 만약 verify-cookie가 정상(로그 급증 없음)이라면 차순위: verify-cookie 응답의 `credits` 필드 누락/스키마 변화 여부 (프론트는 `?? 0` 폴백 — §3).

## 7. 복구 권고 (원인 확정 시)

- AUTH_SECRET을 **SM 정본 단일값**으로 통일 → deploy.sh --set-secrets로 portal·idphoto-kr·jp 일괄 재배포 (ch5 준수).
- ⚠️ 값을 회전(신규 발급)하면 전 고객 1회 재로그인 발생 — 구값 유지 가능하면 유지가 고객 충격 최소.
- 복구 검증: 웹/민아가 외부에서 §2 표 재실측 + 작가님 1계정 실거래 확인.
- 재발 방지: 시크릿 주입 경로 변경 커밋은 **세션 호환성(기발급 토큰) 영향평가**를 지시서 필수 항목으로 (쌍아 — ch5 보강 검토).

---
✅ E-1·E-3·E-4 완료 / ⏳ E-2 CDP는 환경 제약 — 대체 정적 검증으로 갈음 / 🔴 신규 발견 1건(쿠키 강제삭제 증폭)
**[2026-06-12 19:30 KST] 웹/민아**
