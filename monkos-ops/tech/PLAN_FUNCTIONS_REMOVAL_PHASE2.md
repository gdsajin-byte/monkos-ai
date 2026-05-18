---
type: plan
id: PLAN_FUNCTIONS_REMOVAL_PHASE2
date: 2026-02-28
author: iMac/막내3
status: pending_approval
parent_order: ORDER_20260228_막내3_monk_kr정적화_Phase2
parent_design: DESIGN_CF_TO_CLOUDRUN_MIGRATION
---

# functions/ 제거 계획서 — Phase 2

> **[2026-02-28 15:35 KST] iMac/막내3 → iMac/쌍아**
> **목적**: monk.kr CF Pages Functions 18개 파일의 제거 가능 여부를 파일별 Cloud Run 대응으로 확인하고, 제거 실행 계획을 제시한다.
> **전제**: Phase 1 (Image Pro → image.monkos.ai 이관) 완료 후 실행
> **상태**: 승인 대기 — 이 계획서 승인 후 제거 실행

---

## 1. functions/api/ 전수 대조표 (18개)

### A. Cloud Run에 동일 기능 존재 — 즉시 제거 가능 (12개)

| # | CF Function | Cloud Run 대응 서비스 | 대응 라우트 | 검증 |
|---|---|---|---|---|
| 1 | `photo.js` | idphoto-kr | `POST /api/generate` | ✅ 동일 기능 확인 |
| 2 | `idgen.js` | idphoto-kr | `POST /api/idgen` | ✅ 동일 기능 확인 |
| 3 | `precheck.js` | idphoto-kr | `POST /api/pre-check` | ✅ 동일 기능 확인 |
| 4 | `qc.js` | idphoto-kr | `POST /api/qc` | ✅ 동일 기능 확인 |
| 5 | `idphoto-coaching.js` | idphoto-kr | WebSocket `/ws/coaching` | ✅ 동일 기능 확인 |
| 6 | `idphoto-credit-use.js` | portal | `POST /api/credits/use` | ✅ 동일 기능 확인 |
| 7 | `auth.js` | portal | `/auth/*` (Google, Kakao OAuth) | ✅ HttpOnly Cookie 방식으로 이미 전환 |
| 8 | `payment.js` | portal | `/api/payments/*` (Toss) | ✅ 동일 기능 확인 |
| 9 | `telegram.js` | portal | `POST /api/webhook/telegram` | ✅ 동일 기능 확인 |
| 10 | `telegram-webhook.js` | portal | `POST /api/webhook/telegram` | ✅ telegram.js와 중복 |
| 11 | `simple-signup.js` | portal | `/auth/*` (portal OAuth 통합) | ✅ D1 shared_users → Firestore users |
| 12 | `tx.js` | portal | `/api/credits/*` | ✅ D1 shared_credit_transactions → Firestore creditTransactions |

### B. Phase 1 이관 대상 — Phase 1 완료 후 제거 (4개)

| # | CF Function | image.monkos.ai 이관 라우트 | 비고 |
|---|---|---|---|
| 13 | `generate.js` | `POST /generate` | 현재 monk-image-engine 프록시. 이관 후 직접 호출 |
| 14 | `refine.js` | `POST /refine` | Gemini I2I/EDIT/UPSCALE → image.monkos.ai로 이관 |
| 15 | `analyze.js` | `POST /analyze` | Gemini 2.0 Flash 이미지 분석 → 이관 |
| 16 | `translate.js` | `POST /translate` | Gemini 2.0 Flash 번역 → 이관 |

**판정**: Phase 1(막내2) 완료 확인 후 제거 가능.

### C. 🔄 판단 필요 항목 (2개)

#### C-1. `visitor.js` — D1 고유, Cloud Run 대응 없음

**현황 분석:**

| 항목 | 내용 |
|------|------|
| **D1 테이블** | `shared_visitors` |
| **수집 데이터** | visitor_id, country, gender, age_group, job, purpose, name, phone, email, privacy_consent, marketing_consent, user_agent, ip_address, referrer, created_at, last_visit |
| **호출 경로** | `ai_lab.html` 챗봇 온보딩 → `POST /api/visitor` (line 757) |
| **Firestore 대응** | **없음** — D1 고유 데이터 |
| **GA4 대체** | **불가** — 프로젝트에 GA4 미설정. visitor.js가 수집하는 개인정보(이름, 연락처, 이메일)는 Analytics로 대체 불가 |

**비즈니스 영향:**
- 챗봇 온보딩 플로우의 핵심 저장소 (방문자 동의 + 연락처 → D1)
- 연락처 입력 시 100크레딧 보너스 로직과 연동 (`ai_lab.html` line 785~792)
- `localStorage.MONK_VISITOR_INFO`에도 저장 (오프라인 폴백)
- 서버 저장 실패 시 `console.warn`으로 무시 — **즉, 없어도 프론트는 동작하나 서버 백업 유실**

**권고:**
1. **D1 데이터 export 선행** — `shared_visitors` 전체 CSV/JSON export 필수
2. **Firestore 이관** — portal에 `/api/visitors` 엔드포인트 신설 (향후 Phase)
3. **Phase 2에서는 제거 보류** — 이관 대상 확정 전까지 유지. 단, functions/ 폴더 일괄 삭제 시에는 visitor.js 코드를 `monkos-ops/tech/archive/` 등에 아카이브

#### C-2. `ads.js` — GCS manifest 프록시, Cloud Run 대응 없음

**현황 분석:**

| 항목 | 내용 |
|------|------|
| **기능** | GCS `monk-ai-images/ads/manifest.json` fetch → 광고 이미지 URL + 로테이션 설정 반환 |
| **호출 경로** | Image Pro SPA 대기 화면 (이미지 생성 중 ad rotation) |
| **CORS** | `Access-Control-Allow-Origin: *` (GCS 직접 호출 시 CORS 문제 가능) |
| **Cloud Run 대응** | **없음** |
| **캐시** | `Cache-Control: public, max-age=60` (1분) |

**대체 방안 분석:**

| 방안 | 장점 | 단점 |
|------|------|------|
| ① GCS 직접 호출 | 프록시 제거 | CORS 설정 필요 (GCS bucket CORS config) |
| ② 정적 manifest 인라인 | 완전 정적화 | manifest 변경 시 재배포 필요 |
| ③ portal에 `/api/ads` 추가 | 중앙 관리 | portal 부하 증가 (미미) |

**권고:**
- **방안 ①** 추천 — GCS 버킷에 CORS 허용 설정 후 프론트에서 직접 fetch. 가장 단순하고 프록시 금지 원칙(헌법 10조)에 부합
- Phase 2에서 ads.js 제거 + Image Pro SPA의 API 호출을 GCS 직접 URL로 변경
- GCS CORS 설정은 쌍아+작가님 확인 필요 (인프라 변경)

---

## 2. MONK_kr/ 인증 페이지 정리 계획

| 파일 | 현재 역할 | localStorage 사용 | 조치 |
|------|----------|-------------------|------|
| `auth-success.html` | OAuth 콜백 → `monk_auth_token`, `monk_user`, `monkos_credits` 저장 | ✅ 3개 키 | **제거** — monkos.ai portal이 OAuth 처리. CF 측 OAuth 콜백 불필요 |
| `login.html` | 로그인 폼 → `monk_auth_token`, `monk_return_url` | ✅ 2개 키 | **제거** — monkos.ai portal `/auth/login` 대체 |
| `simple-signup.html` | 간편가입 → `monk_auth_token`, `monk_user`, `monkos_credits`, `monk_beta_users` | ✅ 4개 키 | **제거** — portal OAuth 통합 |
| `auth-error.html` | OAuth 에러 표시 | ❌ | **제거** — portal 측 에러 핸들링으로 대체 |

**참고**: `ai_lab.html` 내 localStorage 잔재 (`monk_auth_token`, `monk_user` 읽기/로그아웃 삭제)는 Phase 2에서 함께 정리.

---

## 3. ai_lab.html 서비스 카드 링크 변경 계획

| 서비스 카드 | 현재 링크 | 변경 후 |
|-------------|----------|---------|
| photolab (증명사진) | `./photolab/` | `https://idphoto-kr.monkos.ai` |
| image_pro (이미지 프로) | `./image_pro/` | `https://image.monkos.ai` |
| lookbook | `./lookbook/` | 현재 미구현 → "준비 중" 표시 유지 |
| models | (별도 갤러리) | **유지** — CF Images 디스플레이, 변경 불필요 |

**추가 변경**: `purposeRoutes` 매핑 (line 656~664)도 monkos.ai 절대 URL로 변경 필요:
```
'AI 증명사진': 'https://idphoto-kr.monkos.ai',
'AI 프로필':  'https://idphoto-kr.monkos.ai',
'AI 이미지 생성': 'https://image.monkos.ai',
...
```

---

## 4. wrangler.toml D1 바인딩 제거 계획

현재 (`wrangler.toml`):
```toml
[[d1_databases]]
binding = "DB"
database_name = "monk-db"
database_id = "6fe2a64b-****"
```

**조치**: `[[d1_databases]]` 블록 전체 제거.

**선행 조건**:
- visitor.js의 `shared_visitors` 데이터 export 완료
- functions/ 전체 제거 완료 (D1 참조하는 코드가 없을 때)

---

## 5. _redirects 설정 계획

신규 `MONK_kr/_redirects` 파일:

```
/ai_lab/photolab/*  https://idphoto-kr.monkos.ai/:splat  301
/ai_lab/image_pro/* https://image.monkos.ai/:splat       301
/api/*              https://monkos.ai/api/:splat          301
```

**목적**: 기존 북마크/링크의 301 리다이렉트 보장. SEO 크레딧 이전.

---

## 6. 실행 순서 (승인 후)

```
Step 1. D1 shared_visitors 데이터 export (CSV + JSON)
Step 2. visitor.js, ads.js 코드 아카이브 (monkos-ops/tech/archive/)
Step 3. functions/ 디렉토리 전체 제거 (18개 + README.md)
Step 4. 인증 페이지 4개 제거 (auth-success, login, simple-signup, auth-error)
Step 5. ai_lab.html 수정 (서비스 링크 + localStorage 정리 + visitor API 호출 제거)
Step 6. wrangler.toml D1 바인딩 제거
Step 7. _redirects 파일 생성
Step 8. _headers 검토 (photolab 경로 → 리다이렉트 후 불필요 시 정리)
Step 9. 커밋 + push → 완료 보고
```

---

## 7. 리스크 매트릭스

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| visitor.js D1 데이터 유실 | **높음** | Step 1에서 반드시 export 선행 |
| ai_lab.html 챗봇 visitor API 호출 실패 | **중간** | 코드상 catch로 무시 (line 775~777). 제거 시 fetch 호출 자체 삭제 |
| 기존 `/api/*` 호출 URL 깨짐 | **중간** | _redirects로 301 보장 |
| ads.js 제거 후 Image Pro 광고 미표시 | **낮음** | Image Pro SPA가 image.monkos.ai로 이관되면 ads 호출도 새 서비스에서 처리 |
| monk_studio/ 영향 | **없음** | Functions 미사용. 네이버결제 = 외부 서비스. 정적 서빙만 |

---

## 8. 승인 요청 사항

1. **visitor.js 처리 방침**: 제거 보류 + 아카이브 vs Firestore 즉시 이관?
2. **ads.js 대체 방안**: GCS 직접 호출(①) 승인 여부 + GCS CORS 설정 주체 확인
3. **D1 데이터 export 실행 주체**: 막내3 직접 vs 쌍아+작가님 대시보드?
4. **인증 페이지 4개 완전 삭제 승인** (monkos.ai 리다이렉트 vs 삭제)

---

**이상 제거 계획서 끝. 승인 대기.**
