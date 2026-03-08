---
type: design
id: DESIGN_CF_TO_CLOUDRUN_MIGRATION
date: 2026-02-28
author: iMac/쌍아
status: draft
priority: P1
---

# 설계서: monk.kr CF Pages → Cloud Run 이관

> **[2026-02-28 14:48 KST] iMac/쌍아**
> **목적**: monk.kr을 순수 정적 포털로 전환. 모든 동적 서비스를 monkos.ai (Cloud Run)로 통합.
> **근거**: 헌법 10조 (프록시 금지) — CF↔Cloud Run 교차지점이 인증·결제·CORS의 구조적 병목.

---

## 1. AS-IS / TO-BE

### AS-IS (현재)

```
monk.kr (CF Pages)                      monkos.ai (Cloud Run)
━━━━━━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━
 monk_studio/ (정적, 네이버결제)           portal (인증/결제/챗봇)
 ai_lab/                                 idphoto-kr (증명사진 KR)
   photolab/ (증명사진 프로토)             idphoto-jp (증명사진 JP)
   image_pro/ (이미지 프로 SPA)           monk-image-engine (T2I)
   lookbook/ (미구현)
   models/ (CF Images 갤러리)
 functions/ (20개 API) ←── 교차 ──→ Cloud Run 호출
 D1 (monk-db) ←── 이중화 ──→ Firestore
 auth (localStorage) ←── 분열 ──→ auth (HttpOnly Cookie)
```

**문제점:**
- 인증 이중화 (localStorage vs Cookie)
- 배포라인 이중화 (wrangler vs gcloud)
- D1 ↔ Firestore 데이터 이중화
- CORS `*` ↔ `credentials: 'include'` 양립 불가
- CF Functions = Google 서비스의 불필요한 프록시

### TO-BE (목표)

```
monk.kr (CF Pages) — 순수 포털            monkos.ai (Cloud Run) — 전 서비스
━━━━━━━━━━━━━━━━━━━━━━━━━━               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 monk_studio/ (정적, 네이버결제)             monkos.ai (portal)
 ai_lab/ (쇼룸 + 서비스 링크)               idphoto-kr.monkos.ai (증명사진 KR)
   → idphoto-kr.monkos.ai 링크             idphoto-jp.monkos.ai (증명사진 JP)
   → image.monkos.ai 링크                  image.monkos.ai (이미지 프로) ★이관
 models/ (CF Images 갤러리)
 챗봇 프론트 (monkos.ai API 호출)

 Functions → 없음
 D1 → 없음
 인증 → 없음
```

---

## 2. CF Functions 20개 이관 맵핑

### 이미 Cloud Run에 동일 기능 존재 (제거 대상)

| CF Function | Cloud Run 동일 기능 | 판정 |
|---|---|---|
| `photo.js` | idphoto-kr `/api/generate` | ❌ 제거 |
| `idgen.js` | idphoto-kr `/api/idgen` | ❌ 제거 |
| `precheck.js` | idphoto-kr `/api/pre-check` | ❌ 제거 |
| `qc.js` | idphoto-kr `/api/qc` | ❌ 제거 |
| `idphoto-coaching.js` | idphoto-kr WebSocket | ❌ 제거 |
| `idphoto-credit-use.js` | portal `/api/credits/use` | ❌ 제거 |
| `auth.js` | portal `/auth/*` | ❌ 제거 |
| `payment.js` | portal `/api/payments/*` | ❌ 제거 |
| `telegram.js` | portal `/api/webhook/telegram` | ❌ 제거 |
| `telegram-webhook.js` | portal `/api/webhook/telegram` | ❌ 제거 |

### Image Pro 전용 → image.monkos.ai로 이관

| CF Function | 이관 대상 | 비고 |
|---|---|---|
| `refine.js` | image.monkos.ai | I2I/EDIT/UPSCALE |
| `generate.js` | image.monkos.ai | T2I (이미 monk-image-engine 프록시) |
| `analyze.js` | image.monkos.ai | 이미지 분석 |
| `translate.js` | image.monkos.ai | 분석 결과 번역 |

### D1 의존 → Firestore 이관 또는 제거

| CF Function | D1 테이블 | Firestore 대응 | 판정 |
|---|---|---|---|
| `simple-signup.js` | shared_users, shared_credits | portal users collection | ❌ 제거 (portal에서 처리) |
| `visitor.js` | shared_visitors | 이관 필요 또는 Analytics 대체 | 🔄 검토 |
| `tx.js` | shared_credit_transactions | portal credits collection | ❌ 제거 |

### 기타

| CF Function | 판정 | 비고 |
|---|---|---|
| `ads.js` | 🔄 정적화 또는 portal 이관 | GCS manifest.json 읽기 — 정적 빌드 가능 |

---

## 3. D1 → Firestore 데이터 매핑

| D1 테이블 | Firestore 대응 | 데이터 상태 |
|---|---|---|
| `shared_users` | `users` collection (portal) | **이미 이중 존재** — portal에서 OAuth 로그인 시 Firestore에 저장. D1은 CF 측 로그인 전용. |
| `shared_credits` | `users.credits` field | **이미 이중 존재** — portal이 정본 |
| `shared_credit_transactions` | `creditTransactions` subcollection | **이미 이중 존재** |
| `shared_visitors` | 미존재 | 이관 또는 GA4 대체 검토 |

**핵심**: D1 데이터 대부분은 Firestore에 이미 존재. D1 고유 데이터는 `shared_visitors`뿐. 나머지는 CF 측 로그인한 사용자의 사본.

---

## 4. 실행 페이즈

### Phase 0: P0 긴급 배포 (선행)
- gate.js `_startGoogleLoginSimple()` credentials 보정
- main 머지 + Cloud Run 배포
- iOS Safari 수정 + credentials 보정 반영

### Phase 1: Image Pro 이관 (image.monkos.ai)
- monk-image-engine에 refine/analyze/translate API 추가
- 또는 별도 서비스로 분리 (`monkos-image-pro`)
- ai_lab/image_pro/ SPA의 API 엔드포인트를 image.monkos.ai로 변경
- 인증: portal HttpOnly Cookie 연동

### Phase 2: monk.kr 정적화
- functions/ 디렉토리 제거
- wrangler.toml에서 D1 바인딩 제거
- auth 관련 페이지 정리 (auth-success.html, login.html, simple-signup.html)
  → 제거 또는 monkos.ai 리다이렉트
- ai_lab.html → 서비스 카드 + monkos.ai 링크만
- ai_lab/photolab/ → idphoto-kr.monkos.ai 링크/리다이렉트

### Phase 3: 레거시 정리
- cloudflare-workers/ 제거 (monk-gemini-proxy)
- cloudflare-workers-imagen/ 제거 (monk-imagen-proxy)
- .bak 파일 제거
- cert.pem/key.pem .gitignore 추가 + git rm --cached
- GCR 레거시 이미지 정리 (idphoto-kr 구 레포 42개 등)

### Phase 4: DNS/도메인 정리
- monk.kr/ai_lab/* → monkos.ai 서비스별 리다이렉트 확정
- CF Pages 설정: Git 자동빌드 OFF 확인
- CF Pages Preview 배포 정리

---

## 5. 리스크 / 체크포인트

| 리스크 | 대응 |
|--------|------|
| D1 shared_visitors 데이터 유실 | Phase 2 전에 export + Firestore 이관 또는 GA4 대체 확정 |
| ai_lab/photolab 기존 사용자 북마크 깨짐 | 301 리다이렉트 설정 (CF _redirects) |
| image_pro staff/enterprise 인증 전환 | portal Cookie 기반으로 재설계 필요 |
| ads.js GCS manifest 호출 | 정적 빌드 또는 portal에 ads API 추가 |
| monk.kr 챗봇 (구 RAG) | monkos.ai portal /api/chat 이미 존재 → 프론트만 API 경로 변경 |

---

## 6. 막내 배분

| Phase | 담당 | 성격 |
|-------|------|------|
| Phase 0 | 막내1 (기존 맥락) | P0 긴급 — credentials 1건 + 배포 |
| Phase 1 | 막내2 | Image Pro 이관 — server.js 수정 + SPA 엔드포인트 변경 |
| Phase 2 | 막내3 | monk.kr 정적화 — functions 제거 + auth 정리 + 리다이렉트 |
| Phase 3 | 막내4 | 레거시 정리 — 코드베이스 + GCR + .gitignore |
| Phase 4 | 쌍아 | DNS/CF 설정 — 대시보드 확인 필요 (작가님과 함께) |

**순차 의존성:**
- Phase 0 → (독립) Phase 1, Phase 3, Phase 4
- Phase 1 완료 → Phase 2 시작 가능 (Image Pro 이관 후 Functions 제거)
- Phase 2, 3 완료 → Phase 4

---

## 7. 환경변수 이관 체크리스트

### CF Pages Secrets → Cloud Run 환경변수

| CF Secret | 이관 대상 | 현재 Cloud Run 상태 |
|---|---|---|
| `GEMINI_API_KEY` | idphoto-kr, image.monkos.ai | ✅ 이미 설정 |
| `KAKAO_CLIENT_ID` | portal | ✅ `KAKAO_REST_API_KEY`로 존재 |
| `KAKAO_CLIENT_SECRET` | portal | ✅ 이미 설정 |
| `GOOGLE_CLIENT_ID` | portal | ✅ 이미 설정 |
| `GOOGLE_CLIENT_SECRET` | portal | 확인 필요 |
| `TELEGRAM_BOT_TOKEN` | portal | ⚠️ 빈 값 (막내4 보고) |
| `TOSS_SECRET_KEY` | portal | ⚠️ 빈 값 (막내4 보고) |
| `TX_API_KEY` | portal | ⚠️ 빈 값 |
| `GCS_BUCKET` | idphoto-kr | ✅ 이미 설정 |
| `GCP_SERVICE_ACCOUNT_KEY` | 불필요 (ADC) | — |

---

## 8. 완료 기준

- [ ] monk.kr에 Pages Functions 0개
- [ ] monk.kr에 D1 바인딩 없음
- [ ] monk.kr에 인증 로직 없음 (localStorage 제거)
- [ ] image.monkos.ai에서 Image Pro 전 기능 동작
- [ ] ai_lab/ 페이지가 monkos.ai 서비스로 올바르게 링크/리다이렉트
- [ ] monk_studio/ 기존 동작 100% 유지
- [ ] 레거시 Workers 코드 제거
- [ ] GCR 레거시 이미지 정리

---

## 참조 문서

| 문서 | 경로 |
|------|------|
| 막내3 CF 점검 보고서 | `monkos-ops/ops/reports/COMPLETION_20260228_막내3_132000.md` |
| 막내4 GCS/Git 점검 보고서 | `monkos-ops/ops/reports/COMPLETION_20260228_막내4_132100.md` |
| 쿠키 단일화 설계서 | `monkos-ops/tech/DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md` |
| 서비스 노드맵 | `monkos-ops/ops/reports/REPORT_20260228_쌍아_서비스노드맵_mermaid.md` |
