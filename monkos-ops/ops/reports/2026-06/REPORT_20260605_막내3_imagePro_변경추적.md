---
type: report
date: 2026-06-05
device: iMac
agent: 막내3
portfolio: PF_IDPHOTO
subject: "[INCIDENT P0] image_pro 코드 변경 git 포렌식 — 장애 원인 특정 (승인 게이트)"
status: 승인대기
---

# REPORT — [INCIDENT P0] image_pro 변경 추적·장애 특정

**[2026-06-05 17:28 KST] iMac/막내3 → 작가님**

> 추적·진단 단계. **코드 수정·배포는 작가님 승인 후 별도 집행**(헌법 4조). 본 보고는 raw 근거만 — 추론은 "한계"로 명시.

---

## 0. 결론 (raw 근거 기반 단정)

**image_pro는 "코드를 누가 건드려서" 망가진 게 아니다.** git 포렌식상 image_pro 백엔드는 **최근 코드 변경이 없고**(server.js 마지막 수정 3/01, 운영 리비전 3/30 배포), 6/2 EOL 마이그(`8e5b890e`)·키 삭제는 **이 백엔드를 건드리지 않았다**(코칭 Live 장애와 수법 불일치).

실제 장애 = **Vertex AI Imagen 4 `ultra` 모델이 `RESOURCE_EXHAUSTED "temporarily out of capacity"` 반환** (Cloud Run 로그 실측). `fast` 모델·`/refine`·`/health`·정적 프론트는 정상. 즉 **Google Vertex 측 Imagen Ultra 용량/쿼터 문제**이며, 코드·키 삭제와 무관하다.

---

## 1. image_pro 코드 자산 전수 매핑 (실측)

| 구성 | 위치 | 모델/인증 | 비고 |
|------|------|-----------|------|
| 프론트(staff 게이트) | `MONK_kr/ai_lab/image_pro/index.html` | auth.json 자체 로그인 | OAuth 아님 |
| 프론트(메인 PWA) | `MONK_kr/ai_lab/image_pro/app/` + 백엔드 `public/`에 복제 서빙 | — | CF Pages + 백엔드 정적 |
| **백엔드** | **`apps/monk_imagen4/backend/server.js`** (Cloud Run `monk-image-engine` = `image.monkos.ai`) | 아래 3핸들러 | 운영 리비전 **00022-fx2 (3/30 배포)** |
| ├ `POST /generate` | server.js:75~200 | **Vertex AI Imagen 4** (`imagen-4.0-ultra-generate-001`/`-fast-generate-001`), `predictionClient.predict` (ADC/gRPC) | **장애 지점** |
| ├ `POST /refine` | server.js:240~320 | `gemini-3-pro-image-preview` REST + `GEMINI_API_KEY`(AI Studio) | 오늘 정상 동작 |
| ├ `POST /analyze` | server.js:327 | `gemini-2.0-flash` REST | — |
| └ `POST /translate` | server.js:412 | `gemini-2.0-flash` REST | — |
| 키 주입 | `deploy.sh:79` `--update-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest` | Secret Manager(proj monkos) | 값 무노출 |

---

## 2. git 포렌식 (변경 추적)

### 2-1. 백엔드 server.js 커밋 전수 (최근)
```
9a54231a 2026-03-01 [fix] /generate 응답 base64 직접 반환 — GCS URL 403 해소   ← 마지막 코드 변경
31e70a75 2026-03-01 [feat] /generate Vertex AI ADC 신규 구현 — fast/ultra 분기
60b70c19 2026-03-01 Revert "...Gemini API 직접 호출 전환..."
aeb74bbf 2026-02-28 [feat] image.monkos.ai 프론트엔드 통합
3f187748 2026-02-28 [feat] Image Pro → image.monkos.ai 이관 Phase 1
```
→ **server.js는 2026-03-01 이후 무변경.**

### 2-2. 핵심 라인 -L 추적
- `/refine`의 `gemini-3-pro-image-preview` 라인: `git log -L 276` → **2/28 `3f187748`에서 도입 후 단 한 번도 변경 안 됨.**
- `/generate`의 Imagen 모델 분기(`imagen-4.0-ultra/fast`): 3/01 `31e70a75`에서 신규 구현 후 무변경.

### 2-3. 배포 리비전 (실제 운영 코드)
```
monk-image-engine-00022-fx2  2026-03-30  ← 현재 100% 트래픽
monk-image-engine-00021-c76  2026-02-28
```
→ **6/2 deploy.sh CWD 수정(`6034fa1f`)은 재배포로 이어지지 않았다.** 운영 코드는 **3/30 그대로**. 6/2 이후 어떤 커밋도 image_pro 운영 아티팩트에 반영되지 않음 → **배포발 장애 불가능.**

### 2-4. 프론트 image_pro
- 실질 변경 마지막 = 2/28(`6ba934fc` v6→v5 롤백). 이후 image_pro 앱 로직 변경 없음.

---

## 3. 변경별 영향 분석 (지시서 4대 가설 대조)

| 가설 | 판정 | raw 근거 |
|------|------|---------|
| **EOL 마이그(2.0→2.5) 오변경** (코칭 패턴) | ❌ 무관 | `8e5b890e`는 `monkos_AI`(idphoto-kr/jp)만 수정. image_pro 백엔드 server.js 미변경(2-1). /refine 모델 라인 2/28 이후 불변(2-2) |
| **6/2 키 삭제(monkosimagepro 등) 참조** | ❌ 무관 | 백엔드는 Secret Manager `GEMINI_API_KEY:latest` 참조(1). /refine 오늘 정상 성공(4-2) → 키 살아있음. 막내1 포렌식(유출키 5759b56b 삭제, 정상키 생존)과 정합 |
| **AI Studio 크레딧 소진(429)** | △ 부분·분리 | `/refine`(AI Studio 키)은 오늘 성공 → image_pro 다운의 직접 원인 아님. (막내2 진단의 idphoto 429와는 별개 경로) |
| **배포/번들/엔드포인트 변경** | ❌ 무관 | 운영 리비전 3/30 고정(2-3). 6/2 이후 재배포 없음 |

---

## 4. 현재 실제 에러 확정 (Cloud Run 로그·실측 — 추론 아님)

### 4-1. 인프라 생존 확인
- `GET https://image.monkos.ai/health` → **HTTP 200** `{"status":"healthy","version":"2.0.0","project":"monkos","location":"us-central1"}`
- `GET https://image.monkos.ai/` (정적 프론트) → **HTTP 200**

### 4-2. 엔드포인트별 실측 (Cloud Run 로그, 6/05 KST)
| 엔드포인트/모델 | 결과 | 근거 |
|----------------|------|------|
| `/refine` (gemini-3-pro-image, AI Studio) | ✅ 정상 | `[Refine] Image refined successfully` 17:07·17:12 KST |
| `/generate` **`imagen-4.0-fast`** | ✅ 정상 | `[Generate] Completed` 다수 (17:25, 17:14, 17:09, 17:06, 17:05 KST …) |
| `/generate` **`imagen-4.0-ultra`** | ❌ **간헐 실패** | `[Generate] Error: 8 RESOURCE_EXHAUSTED: Unable to submit request because the service is temporarily out of capacity. Try again later.` 17:14·17:10(×2) KST + `"status":"RESOURCE_EXHAUSTED"` 13:38·12:36·12:32·12:30 KST |

> 핸들러는 catch에서 **HTTP 500**으로 래핑(server.js:196~). 사용자에겐 "생성 실패(500)"로 보임. 실체는 Vertex `RESOURCE_EXHAUSTED`.

### 4-3. 장애 발생 시점 (onset)
- **6/04**: ultra `[Generate] Completed` 정상 (예: 14:37 KST).
- **6/05 ~12:30 KST부터** ultra에 `RESOURCE_EXHAUSTED` 출현, 이후 간헐 반복(성공·실패 혼재).
- → **6/05 오전 중 Vertex 측에서 시작된 Imagen Ultra 용량 고갈.** 오늘 광범위 Gemini/Vertex 용량·결제 사건(막내1·2 P0)과 시기 일치하나, **경로는 분리**(이건 Vertex Imagen Ultra, 막내2건은 AI Studio 크레딧).

---

## 5. 망가진 지점 특정 + 복구 권고 (승인 게이트)

### 단정 (raw 근거)
> **"코드를 건드려서 망가진 게 아니다." 운영 코드는 3/30 리비전 그대로이며 6/2 마이그·키삭제 영향 밖이다(§2). 실제 장애는 `/generate`의 `imagen-4.0-ultra-generate-001`(Vertex AI)가 6/05 오전부터 `RESOURCE_EXHAUSTED "temporarily out of capacity"`를 반환하는 것이다(§4). `fast` 모델과 `/refine`은 정상이다.**

### 복구 권고 (코드/인프라 수정은 승인 후 집행)
| # | 처방 | 성격 | 효과 |
|---|------|------|------|
| 1 | **Ultra 실패 시 자동 폴백 → fast** + 사용자 재시도 안내 | 코드(server.js /generate catch에서 RESOURCE_EXHAUSTED 감지 시 fast 재호출) | 즉시 가용성 회복. fast는 정상 |
| 2 | **재시도(backoff)** 추가 — "temporarily out of capacity"는 일시적 | 코드 | 간헐 실패 흡수 |
| 3 | Vertex **Imagen 4 Ultra 쿼터/용량** 확인·증설 요청 (us-central1, proj monkos) | 인프라(콘솔) | 근본. 단 "out of capacity"는 Google측 일시 용량일 수 있어 증설로 즉효 보장 안 됨(한계 명시) |
| 4 | (선택) Ultra 모델 대체 리전 시도 | 인프라 | 용량 분산 |

> ⚠️ §1·§2의 막내2건(AI Studio 크레딧 충전)과 **별개 처방**이다. image_pro 다운은 AI Studio 충전으로 안 풀린다(다른 지갑·다른 모델).

---

## 6. 한계 (정직 고지)

- 브라우저(CDP) 재현은 미수행 — Cloud Run 로그가 충분히 단정적이라 세션 절약 위해 생략. 필요 시 CDP 재현 가능.
- "temporarily out of capacity"가 **Google측 일시 용량**인지 **프로젝트 Ultra 쿼터 0**인지는 콘솔 쿼터 페이지 확인 필요(둘 다 RESOURCE_EXHAUSTED). 성공·실패 혼재(§4-2)는 **일시 용량** 쪽을 시사하나 단정 보류.

---

## 7. 검증 체크리스트 대조
- [x] 프론트·백엔드 자산 전수 매핑 + 백엔드 소스 위치 특정(`apps/monk_imagen4/backend/server.js`)
- [x] git 이력 추적(커밋 전수 + `-L`/리비전)
- [x] 망가진 시점 특정(6/04 정상 ↔ 6/05 오전 ultra RESOURCE_EXHAUSTED)
- [x] 변경별 영향 분석(EOL·키삭제·크레딧·배포 4가설 전부 대조 → 코드 무관)
- [x] 현재 실제 에러 확정(/health 200, fast/refine 정상, ultra RESOURCE_EXHAUSTED, HTTP 500 래핑)
- [x] 망가진 지점 단정 + 복구 권고(raw 근거)

---

**[2026-06-05 17:28 KST] iMac/막내3 → 작가님 · 추적 종료, 복구 권고 승인 대기**
