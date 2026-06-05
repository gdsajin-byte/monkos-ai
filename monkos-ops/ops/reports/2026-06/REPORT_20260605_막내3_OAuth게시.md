---
type: report
date: 2026-06-05
device: iMac
agent: 막내3
portfolio: PF_IDPHOTO
subject: "[INCIDENT] image_pro OAuth Testing→Production 재가동 — 진단 보고 (승인 게이트)"
status: 승인대기
---

# REPORT — [INCIDENT] image_pro OAuth 게시 진단

**[2026-06-05 15:25 KST] iMac/막내3 → 작가님**

> ⚠️ **승인 게이트(3단계)**: 진단까지 완료. **게시 상태 변경은 작가님 승인 후 실행**(헌법 4조). 본 보고는 변경 전 보고다.

---

## 0. 한 줄 결론

원 진단(06-02)의 처방 방향(**Testing→Production 게시**)은 유효하나, **OAuth 동의화면의 출처가 staff 로그인 게이트가 아님**을 코드로 확정했다. 출처는 **Gemini/AI Studio 빌드 앱(PWA "MONKOS IMAGE PRO")**이며, 게시상태 최종 확인은 **GCP Console 1회 확인**이 필요하다(gcloud로 노출 안 됨).

---

## 1. 진단 사실 (코드 실측 — 추정 아님)

### 1-1. image_pro 구조
| 구성 | 실측 | 위치 |
|------|------|------|
| 프론트 게이트 | **auth.json 기반 자체 staff/enterprise 로그인** (Google OAuth 아님) | `MONK_kr/ai_lab/image_pro/index.html` |
| 메인 앱 | React PWA, name="MONKOS IMAGE PRO", id="com.monkos.image.pro.v4" | `app/index.html` + `app/assets/index-v6.js` |
| 백엔드 | **Cloud Run** `https://image.monkos.ai` (`/refine`, `/translate`) | 번들 내 `Gf="https://image.monkos.ai"` |
| 인증 방식 | **GEMINI_API_KEY** (.env.local, 서버측). API_KEY_INVALID→AUTH_REQUIRED 처리 | `index-v6.js` |

### 1-2. 핵심 발견 — OAuth 호출 부재
- image_pro 정적 소스 전체에서 **OAuth client_id(`*.apps.googleusercontent.com`), scope URL(`googleapis.com/auth/*`), oauth2 endpoint, access_token/signIn/consent 코드가 전혀 없음.**
- 즉 **staff 로그인 흐름은 Google 동의화면을 띄우지 않는다.** 06-02 원 진단의 "image_pro Google 로그인 레이어 미검증" 전제는 코드와 불일치.
- 앱은 사용자 OAuth가 아니라 **서버측 Gemini API 키**로 작동.

### 1-3. 동의화면 "MONKOS IMAGE pro"의 실제 출처 (가설 — 정합도 높음)
- PWA manifest name이 **"MONKOS IMAGE PRO"로 동의화면 표시명과 일치** → 이 동의화면은 **Google AI Studio "Build" 앱 / Gemini 사용자 인증 OAuth 앱**에 등록된 브랜드다.
- AI Studio 빌드 앱을 사용자 계정 quota로 구동할 때 "MONKOS IMAGE pro" 동의가 뜨고, **프로젝트 `monkos` 동의화면이 Testing이면 refresh token 7일 만료 → 반복 재동의**. 06-02 증상(M1, 너댓번, 7일)과 정합.

### 1-4. GCP 환경
| 항목 | 값 |
|------|-----|
| 프로젝트 | `monkos` (번호 **933456016842**, name MONKOS) |
| gcloud 계정 | gdsajin@gmail.com (인증됨) |
| 동의화면 게시상태 | **gcloud 미노출** — 일반 OAuth 동의화면 상태는 Console 전용. `gcloud alpha iap oauth-brands`는 IAP 브랜드 한정이라 부적용(+ alpha 미설치) |

---

## 2. scope 검토

- 클라이언트 코드에 **명시 scope 없음** (앱이 OAuth scope를 직접 선언하지 않음 — AI Studio가 Gemini 접근 scope를 관리).
- 따라서 **scope 과다 위험 낮음.** 별도 최소화 작업 불요로 판단. (Console 동의화면에 등록된 scope가 Gemini 외 민감 scope를 포함하는지만 게시 전 1회 확인 권고.)

---

## 3. 권고안 (승인 후 실행)

| # | 처방 | 효과 | 리스크 |
|---|------|------|--------|
| 1 | 프로젝트 `monkos` OAuth **동의화면 Testing → In production 게시** | refresh token 영속화 → 7일 재동의 마찰 종식 | 낮음 (내부 스태프/Gemini 앱). 미검증 앱 경고 자체는 게시 후에도 도메인 인증 전까지 잔존 가능 |
| 2 | 게시 직전 Console에서 등록 scope 1회 확인 | Gemini 외 민감 scope 없음 확인 | — |
| 3 | 게시 후 M1에서 AI Studio/PWA 재구동 → **경고·재동의 소멸 실측** | 처방 검증 | — |

### 실행 수단 (승인 시 택1)
- **A. 작가님 직접**: Console > APIs & Services > OAuth consent screen (project monkos) > **PUBLISH APP**. 1클릭. 가장 빠름·안전.
- **B. 막내3 CDP 구동**: 승인 시 CDP로 Console 진입해 게시 수행(작가님 Google 세션 점유 필요). 세션 소진 고려 시 A 권장.

> ⚠️ **승인 전까지 어떤 변경도 하지 않음.** 게시는 작가님 명시 승인이 게이트(헌법 4조 2항).

---

## 4. 미해소·확인 필요 (1건)

- **동의화면 게시상태 Testing/Production 최종 확정** — gcloud로 못 읽어 Console 1회 확인 필요. Testing이 거의 확실(증상 정합)하나 실측 원칙상 게시 직전 눈으로 확인.

---

## 5. 검증 체크리스트 대조

- [x] 동의화면 게시상태 진단 → **gcloud 미노출 확정, Console 확인 필요** (Testing 유력)
- [x] scope 검토 → 클라이언트 명시 scope 없음, 최소화 불요
- [ ] 진단 보고 → **작가님 승인 대기** ← 현 단계
- [ ] (승인 후) Production 게시 + 재로그인 경고 소멸 확인

---

**[2026-06-05 15:25 KST] iMac/막내3 → 작가님 · 진단 종료, 게시 승인 대기**
