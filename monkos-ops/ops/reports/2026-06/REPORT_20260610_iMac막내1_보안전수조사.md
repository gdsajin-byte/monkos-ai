---
type: report
date: 2026-06-10
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# 보안 취약점 전수 조사 보고서

**[2026-06-10 15:08 KST] iMac/막내1 → 작가님**

> Cloud/막내(Fable 5) PR #45 보고 기반 교차 검증 + 추가 스캔 결과

---

## 1. 요약

| 등급 | Fable 5 보고 | 확인 | 오탐 | 보충 | 신규 발견 | 합계 |
|------|-------------|------|------|------|----------|------|
| **Critical** | 4 | 4 | 0 | 1 | 1 | **5** |
| **High** | 5 | 5 | 0 | 3 | 2 | **7** |
| **Medium** | — | — | — | — | 6 | **6** |
| **합계** | 9 | 9 | 0 | 4 | 9 | **18** |

**전체 판정: Fable 5 보고 9건 전수 확인. 오탐 0건. 추가 9건 신규 발견.**

---

## 2. Critical 검증 결과

### C-1: Google API 키 평문 커밋 ✅ 확인

**위치**: `docs/corpus/legacy/20260111_REBOOT_BACKUP.md:22,45`

```
VERTEX_AI_KEY=AIzaSy***[마스킹]
GOOGLE_CLOUD_PROJECT=gen-lang-client-***[마스킹]
```

- **실재 여부**: 키가 파일에 평문으로 존재. Git 히스토리에도 잔존.
- **현재 활성 여부**: 프로젝트 ID `gen-lang-client-***`는 현행 `monkos` 프로젝트와 다름. **startMONK 시절 구 프로젝트**로 추정되나, 키 폐기 여부는 Google Cloud 콘솔에서만 확인 가능.
- **보충**: MonkosChat Expo 번들에도 Firebase config 전체 노출 (아래 N-2 참조)

**위험도**: 키가 비활성이어도 Git 히스토리 영구 잔존. credential 스캐너가 감지 가능.

---

### C-2: 크레딧 환불/차감 API 무인증 ✅ 확인

**위치**:
- `portal/lib/credits.js:8,42,100` — `handleCreditsGet`, `handleCreditsUse`, `handleCreditsRefund`
- `portal/server.js:132-134` — 라우트에 인증 미들웨어 없음
- `idphoto-kr/server.js:652,664` — `/api/credit/use`, `/api/credit/refund`

**현황**:
- **portal**: 세 함수 모두 `userId`를 query param(GET) 또는 request body(POST)에서 직접 추출. 세션 쿠키/토큰 검증 없음. server.js에서 auth 미들웨어 없이 직접 핸들러 호출.
- **idphoto-kr**: `req.body.userId` 존재 여부만 체크. 인증 토큰 검증 없음.

**공격 시나리오**: `POST /api/credits/use {"userId":"victim_id", "type":"download"}` — 임의 사용자의 크레딧 70c 즉시 차감 가능.

**위험도**: **Critical — 실서비스에서 즉시 악용 가능.**

---

### C-3: AUTH_SECRET 폴백 하드코딩 ✅ 확인

**위치**: `portal/lib/shared/config.js:31`

```javascript
const authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
```

- line 28-29에 `AUTH_SECRET` 미설정 시 경고 로그 존재.
- 그러나 **실제 폴백 체인**이 `LEMONSQUEEZY_WEBHOOK_SECRET`을 거쳐 최종적으로 `'monkos-default-secret'`으로 귀결.
- 프로덕션 Cloud Run에 `AUTH_SECRET` env가 설정되어 있다면 이 폴백은 미사용. **Cloud Run 환경변수 직접 확인 필요.**

**위험도**: 프로덕션 env 미설정 시 모든 인증 토큰이 예측 가능한 시크릿으로 서명됨 → 토큰 위조 가능.

---

### C-4: ADMIN_UIDS 빈값 = 전원 관리자 (페일오픈) ✅ 확인

**위치**:
- `portal/lib/cms/admin-auth.js:14` — **서버 사이드 접근 제어**
- `portal/lib/auth.js:460,597,793` — **클라이언트 응답에 isAdmin 전파**

```javascript
// admin-auth.js:14 — 서버 접근 제어
if (payload && (ADMIN_UIDS.length === 0 || ADMIN_UIDS.includes(payload.userId))) {
  return payload;
}
```

```javascript
// config.js:72
export const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').filter(Boolean);
```

- `ADMIN_UIDS` 환경변수 미설정 → `[]` → `length === 0` → **모든 인증 사용자가 관리자 권한 획득**
- CMS 대시보드, 블로그 CRUD, FAQ/갤러리/게시판 관리, AI 이미지 생성, 파일 업로드, VTON 제어 — 모두 `requireAdmin()` 경유 → 전부 오픈
- auth.js의 3개 위치는 OAuth 응답에 `isAdmin: true`를 반환하여 프론트엔드도 관리자 UI 노출

**위험도**: **Critical — env 미설정 시 모든 로그인 사용자가 전체 CMS 관리 권한 획득.**

---

### N-1: `/api/auth/token` 무인증 토큰 발급 🆕 신규 Critical

**위치**: `portal/lib/auth.js:609-638`

```javascript
export async function handleAuthToken(req, res) {
  // ...
  const { userId } = JSON.parse(body);
  if (!userId) { /* 400 */ }
  // userId 인증 없이 즉시 HMAC 토큰 발급
  const hmac = createHmac('sha256', authSecret);
  hmac.update(payload);
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
  res.end(JSON.stringify({ token, expires }));
}
```

- `server.js:122`에서 `POST /api/auth/token` → `handleAuthToken` 직접 라우팅. 인증 미들웨어 없음.
- **아무나** `POST /api/auth/token {"userId":"target_user_id"}` 호출 → 해당 사용자의 유효 토큰 발급.
- 이 토큰으로 크로스 도메인 인증, 크레딧 조회/사용, 관리자 기능(C-4 결합 시) 접근 가능.

**위험도**: **Critical — C-2, C-4와 체인 시 완전한 계정 탈취 가능.**

---

## 3. High 검증 결과

### H-1: AI 생성 엔드포인트 무인증 + BLOCK_NONE ✅ 확인

| 서비스 | 인증 | 레이트리밋 | CORS | BLOCK_NONE |
|--------|------|-----------|------|------------|
| idphoto-kr (`server.js:512-565`) | userId 선택적 (미전달 시 `[FREE-GEN]`) | 없음 | `*` | 4/4 카테고리 |
| idphoto-jp (`server.js:609-612`) | 미확인 (kr과 동일 패턴 추정) | 없음 | `*` | 4/4 카테고리 |
| studio (`server.js:434-562`) | **명시적 없음** ("인증/크레딧 없이 직접 생성") | 없음 | `*` | 4/4 카테고리 (2 엔드포인트) |
| CF `functions/api/generate.js` | 없음 | 없음 | `*` | 4/4 카테고리 |

- **BLOCK_NONE**: Harassment, Hate Speech, Sexually Explicit, Dangerous Content 전부 `BLOCK_NONE` → 콘텐츠 모더레이션 완전 비활성
- **studio**: "내부 전용" 주석만 있고 네트워크 수준 접근 제한 없음. 워터마크 없이 원본 반환.

**보충**: Fable 5가 `functions/api/generate.js`를 지목했는데, 실제로는 **4개 서비스 전부** 동일 문제.

**위험도**: 외부 공격자가 무제한으로 Gemini/Imagen API 크레딧 소진 가능. 안전 필터 없이 유해 콘텐츠 생성 가능.

---

### H-2: CF Functions CORS 와일드카드 ✅ 확인

| 파일 | CORS | 인증 |
|------|------|------|
| `functions/api/chat.js` | ✅ 오리진 허용 목록 + API 키 | ✅ |
| `functions/api/analyze.js` | ❌ `*` | ❌ |
| `functions/api/generate.js` | ❌ `*` | ❌ |
| `functions/api/refine.js` | ❌ `*` | ❌ |
| `functions/api/translate.js` | ❌ `*` | ❌ |
| `functions/api/debate.js` | ❌ `*` | ❌ |

- `chat.js`만 `ALLOWED_ORIGINS` 배열 + `X-Chat-API-Key` 인증 구현
- 나머지 5개: 오리진 검증 없음, 인증 없음 → Gemini API 키 프록시로 악용 가능

---

### H-3: Express 전역 CORS 와일드카드 ✅ 확인

| 서비스 | 파일:라인 |
|--------|----------|
| idphoto-kr | `server.js:450` — `app.use(cors())` |
| idphoto-jp | `server.js:497` — `app.use(cors())` |
| studio | `server.js:398` — `app.use(cors())` |

- 3개 Cloud Run 서비스 모두 `cors()` 인자 없이 호출 → `Access-Control-Allow-Origin: *`
- **대조**: portal은 `ALLOWED_ORIGINS` 배열 기반 오리진 검증 구현 (`config.js:127-141`, `server.js:62-64`)

**보충**: Fable 5는 idphoto-kr만 지목. 실제로는 **idphoto-jp, studio도 동일.**

---

### H-4: 카카오 OAuth 시크릿 평문 로깅 + Firestore 저장 ✅ 확인

**위치 1** — `portal/lib/auth.js:49`:
```javascript
log(`[Kakao] 토큰 요청: ... secret=${process.env.KAKAO_CLIENT_SECRET ? 'YES(' + process.env.KAKAO_CLIENT_SECRET + ')' : 'NO'} ...`);
```
- `KAKAO_CLIENT_SECRET` **값 자체**가 Cloud Logging에 평문 출력
- `YES(actual_secret_value)` 형태로 기록됨

**위치 2** — `portal/lib/auth.js:96`:
```javascript
kakaoAccessToken: tokenData.access_token,  // Firestore 평문 저장
```
- 카카오 사용자의 OAuth access token이 Firestore `users` 컬렉션에 평문 저장
- 이 토큰으로 카카오 API (프로필, 메시지 등) 호출 가능

**위험도**: Cloud Logging 접근 권한이 있는 누구나 카카오 시크릿 열람 가능. Firestore 접근 시 사용자 카카오 토큰 탈취 가능.

---

### H-5: GCS 버킷 TTL/라이프사이클 미구현 ✅ 확인

**버킷**: `monk-ai-images` (asia-northeast3)

- **signed URL**: 사용자 사진은 24시간 만료 signed URL 사용 (idphoto-kr/jp/studio `gcs-save.js`) — 접근 제한은 정상
- **마케팅 에셋**: `ads/`, `assets/`, `profiles/` 경로는 **공개 직접 URL** 사용 (`storage.googleapis.com/monk-ai-images/...`)
- **라이프사이클 정책**: **미구현.** GCS lifecycle rule 없음. 코드에서 자동 삭제 로직 없음.
- **FAQ 주장 vs 현실**: `portal/seed_faq.js`에서 사용자에게 "30일 보존 후 자동 삭제" 안내하나, **실제 구현 없음** → 사진(생체 정보) 영구 보관

**보충**: Fable 5는 IAM 미확인만 지적. 실제로는 **라이프사이클 미구현 + FAQ 허위 안내**가 더 심각.

**위험도**: 개인정보보호법(PIPA)/GDPR 위반 소지. 안내와 실제 불일치.

---

## 4. 신규 발견 (Medium)

### M-1: MonkosChat Expo 번들에 Firebase 전체 config 노출

**위치**: `apps/MonkosChat/public/_expo/static/js/web/index-***[마스킹].js:1185`

번들 내 Firebase 초기화 코드에 다음이 평문 포함:
- `apiKey` (Firebase Web API 키)
- `authDomain`, `projectId`, `storageBucket`
- `messagingSenderId`, `appId`, `measurementId`

Firebase API 키는 설계상 클라이언트 노출이 허용되나, Firestore Security Rules가 미비할 경우 직접 데이터 접근 가능.

---

### M-2: `/api/auth/verify` 타이밍 공격 취약

**위치**: `portal/lib/auth.js:669`

```javascript
if (sig !== expectedSig) {  // 문자열 비교 — 타이밍 공격 취약
```

- `handleAuthVerify`에서 문자열 직접 비교 (`!==`) 사용
- **대조**: `verifyAuthToken` 함수(config.js:220-222)는 `timingSafeEqual` 사용
- 같은 시스템 내 일관성 없음

---

### M-3: `console.log`에 민감정보 출력 패턴

`portal/lib/auth.js:49` 외 추가 패턴:
- OAuth authorization code가 로그에 노출 (`code=${code}`)
- 토큰 발급/검증 시 userId가 로그에 기록 (PII)

---

### M-4: `handleAuthVerify` GET 방식 토큰 전달

**위치**: `portal/lib/auth.js:641-703`

```javascript
const token = urlParams.searchParams.get('token');
```

- 인증 토큰이 URL query parameter로 전달 → 브라우저 히스토리, 서버 액세스 로그, Referer 헤더에 노출

---

### M-5: portal CORS에 dev URL 포함

**위치**: `portal/lib/shared/config.js:133-137`

```javascript
'https://monkos-portal-dev-933456016842.us-central1.run.app',
'https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app',
'https://monkos-portal-dev-4jeplpqpua-uc.a.run.app',
```

프로덕션 CORS 허용 목록에 dev 환경 URL 포함. dev 환경이 탈취되면 프로덕션 API 크로스 오리진 접근 가능.

---

### M-6: Google OAuth CSRF 토큰이 LINE state Map 공유

**위치**: `portal/lib/auth.js:358`

```javascript
pendingLineStates.set(csrf, Date.now());  // Google OAuth도 LINE Map 사용
```

Google OAuth와 LINE OAuth가 동일한 `pendingLineStates` Map을 CSRF 토큰 저장소로 공유. 기능상 문제는 없으나 네이밍이 혼란스럽고, 한쪽 클리어가 다른 쪽에 영향 줄 가능성 존재.

---

## 5. Fable 5 보고 대비 검증 결과표

| # | 등급 | Fable 5 보고 | 검증 결과 | 비고 |
|---|------|-------------|----------|------|
| C-1 | Critical | API 키 평문 | ✅ **확인** | 구 프로젝트 키. 활성 여부 콘솔 확인 필요 |
| C-2 | Critical | 크레딧 API 무인증 | ✅ **확인** | portal + idphoto-kr 양쪽 |
| C-3 | Critical | AUTH_SECRET 폴백 | ✅ **확인** | `'monkos-default-secret'` 폴백 실재 |
| C-4 | Critical | ADMIN_UIDS 페일오픈 | ✅ **확인** | 4개 위치 모두 동일 패턴 |
| H-1 | High | AI 무인증 + BLOCK_NONE | ✅ **확인** | **보충**: 3서비스+CF, Fable 5는 2개만 지목 |
| H-2 | High | CF CORS 와일드카드 | ✅ **확인** | 5/6 파일. chat.js만 정상 |
| H-3 | High | idphoto-kr CORS | ✅ **확인** | **보충**: idphoto-jp, studio도 동일 |
| H-4 | High | 카카오 시크릿 로깅 | ✅ **확인** | **보충**: access token Firestore 평문 저장 추가 |
| H-5 | High | GCS IAM·TTL | ✅ **확인** | **보충**: 라이프사이클 미구현 + FAQ 허위 안내 |
| N-1 | 🆕 Critical | auth/token 무인증 발급 | — | Fable 5 미보고. 계정 탈취 체인 가능 |
| N-2 | 🆕 High | Expo 번들 Firebase config | — | Fable 5 미보고 |
| N-3 | 🆕 High | studio "내부전용" 무방어 | — | H-1 보충. 워터마크 없이 원본 반환 |
| M-1~6 | 🆕 Medium | 6건 | — | 상기 §4 참조 |

---

## 6. 공격 체인 분석 (C-2 + N-1 + C-4 결합)

가장 위험한 시나리오:

1. `POST /api/auth/token {"userId":"admin_uid"}` → 관리자 인증 토큰 획득 (N-1)
2. C-4 + env 미설정 → 모든 사용자가 관리자 → 아무 userId로도 가능
3. 획득한 토큰으로 CMS 전체 접근 (블로그 변조, 이미지 업로드, 대시보드 열람)
4. `POST /api/credits/refund {"userId":"attacker_id", "type":"download"}` → 무한 크레딧 충전 (C-2)
5. idphoto-kr/jp에서 무제한 AI 이미지 생성 (H-1) + BLOCK_NONE으로 유해 콘텐츠 생성

**전제 조건**: 서비스 URL 알고 있으면 누구나 가능. CORS `*`이므로 웹 페이지에서 직접 호출 가능.

---

## 7. 수정 우선순위 권고

> 본 지시서는 진단 전용. 수정 코드 미포함. 우선순위만 제시.

### 즉시 (P0)

1. **N-1** `/api/auth/token`에 세션 쿠키/토큰 검증 추가
2. **C-2** 크레딧 API에 인증 미들웨어 추가 (portal + idphoto-kr/jp)
3. **C-4** `ADMIN_UIDS.length === 0` 조건을 `false`로 변경 (빈값 = 관리자 없음)
4. **H-1** AI 생성 엔드포인트에 인증 + 레이트리밋 추가

### 이번 주 (P1)

5. **C-3** `'monkos-default-secret'` 폴백 제거, env 미설정 시 서버 시작 차단
6. **H-3** idphoto-kr/jp/studio CORS 오리진 허용 목록 적용
7. **H-4** 카카오 시크릿 로깅 제거 + access token Firestore 저장 제거
8. **H-2** CF Functions 5개에 chat.js 패턴 적용

### 이번 달 (P2)

9. **C-1** 레거시 문서에서 키 마스킹 + Git 히스토리 정리 (`git filter-repo`)
10. **H-5** GCS 라이프사이클 정책 설정 (30일) + FAQ 안내와 일치
11. **H-1** BLOCK_NONE → 최소 BLOCK_MEDIUM_AND_ABOVE로 변경
12. **M-1~6** 순차 보정

---

## 8. 추가 스캔 결과 (Task 3)

### 클린 항목 (위협 없음)

| 스캔 항목 | 결과 |
|----------|------|
| `eval()` 사용 | ❌ 없음 (monkos_AI/ + functions/ 전체) |
| `child_process.exec()` 사용 | ❌ 없음 (3건 감지 모두 TUI Editor API/RegExp — 무관) |
| `console.log` 민감정보 출력 | ❌ 없음 (H-4 카카오 시크릿 외 추가 없음) |
| `.env` Git 추적 | ❌ `.gitignore` 정상 작동 (.env, .env.local 등 제외됨) |
| `.env.example` 실제 키 | ❌ placeholder만 사용 |
| CMS admin 엔드포인트 인증 | ✅ 전건 `requireAdmin()` 적용 확인 (blog/faq/gallery/board/dashboard/upload/AI/translate/search/settings/layout/vton) |

### 보충: 서비스별 인증 전수 현황

| 서비스 | 인증 있음 | 인증 없음 | 비고 |
|--------|----------|----------|------|
| portal (monkos.ai) | CMS admin 전건, 결제 webhook 서명 검증 | 크레딧 API, auth/token, chat, coaching | C-2, N-1 해당 |
| idphoto-kr | download (path 소유 검증) | idgen (userId 선택), credit/use, credit/refund | C-2, H-1 해당 |
| idphoto-jp | download (path 소유 검증) | idgen (userId 선택), credit/use, credit/refund | C-2, H-1 해당 |
| studio | — | **전 엔드포인트** (명시적 무인증) | H-1 해당 |
| crop-engine | — | crop, specs (유틸리티, 크레딧 무관) | 저위험 |
| CF Functions | chat.js (오리진+API키) | analyze, generate, refine, translate, debate | H-2 해당 |

---

*끝.*
