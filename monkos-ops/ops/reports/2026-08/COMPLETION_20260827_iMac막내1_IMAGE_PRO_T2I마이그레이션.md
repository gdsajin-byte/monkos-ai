---
type: completion
date: 2026-08-27
device: iMac
agent: 막내1
status: 마감
portfolio: PF_IMAGE_PRO
---

# 완료 보고 — IMAGE PRO T2I 마이그레이션 (Imagen 4 폐지 대응)

**[2026-08-27 16:46 KST]** iMac/막내1 → 작가님

> 지시서: [ORDER_20260827_iMac쌍아_막내1_IMAGE_PRO_Imagen4폐지_T2I마이그레이션.md](../../orders/2026-08/ORDER_20260827_iMac쌍아_막내1_IMAGE_PRO_Imagen4폐지_T2I마이그레이션.md)
> 라이브 판정: `.claude/rules/live-verify.md`

---

## 1. 결과 요약 — 프로덕션 장애 복구

| 항목 | 결과 |
|---|---|
| **T2I fast** | ✅ **200** · `gemini-3.1-flash-image` · 12,401ms · PNG 1.6MB |
| **T2I ultra** | ✅ **200** · `gemini-3-pro-image` · 84,322ms · 3:4 / 2K · PNG 9.6MB |
| `/refine` 회귀 | ✅ 200 (배포 전후 동일) |
| `/analyze` 회귀 | ✅ 200 (배포 전후 동일) |
| mimeType 동적화 | ✅ GCS `content-type: image/png` · 파일 `.png` · data URL `data:image/png` 실측 |
| `Ignored params` 가시화 | ✅ Cloud Run 로그 확인 |
| 포털 CMS 이미지 생성 | ✅ 모델 경로·SDK 형태·sharp 변환 실증 / ⏳ **어드민 클릭 1회 미실행**(§5) |
| image-pro 리비전 | `monk-image-engine-00032-qj6` (직전 `00031-cbh`, 06-19) |
| 포털 리비전 | `monkos-portal-00557-k86` (직전 `00556-96b`) |

---

## 2. 배포 전 기준선 — 장애 재현 확인

지시서 근거를 이월하지 않고 착수 시점에 직접 재측정했다.

| 엔드포인트 | 배포 전 | 배포 후 |
|---|---|---|
| `POST /generate` | ❌ **500** `5 NOT_FOUND: Publisher model .../imagen-4.0-fast-generate-001 was not found` | ✅ **200** |
| `POST /refine` (I2I) | ✅ 200 · image 1,184,202자 | ✅ 200 · image 1,006,338자 |
| `POST /analyze` | ✅ 200 · `success: true` | ✅ 200 · `success: true` |

> `/refine` 응답 길이가 달라진 것은 매 호출이 새로 생성하기 때문이며 회귀가 아니다. 판정 지표는 **HTTP 200 + `success: true` + 이미지 파트 존재**로 잡았다.

---

## 3. Phase A — IMAGE PRO `/generate`

**파일**: `monkos_AI/image-pro/backend/server.js` · `package.json`

| 항목 | 변경 |
|---|---|
| 모델 | `imagen-4.0-fast-generate-001` → **`gemini-3.1-flash-image`** / `imagen-4.0-ultra-generate-001` → **`gemini-3-pro-image`** (둘 다 GA) |
| 로케이션 | 이미지 전용 `IMAGE_LOCATION='global'` 신설. `LOCATION`(us-central1)은 GCS·기존 상수와 얽혀 있어 **무접촉** |
| 호출 | `PredictionServiceClient`(gRPC `:predict`) → **REST `:generateContent` + ADC 액세스 토큰** |
| 인증 | ADC 유지. `GEMINI_API_KEY` 의존을 T2I에 **새로 만들지 않았다** |
| 상수 | 모델 ID·로케이션·호스트를 파일 상단 상수 블록에 집중 (ch2 7조) |

**mimeType 하드코딩 3개소 전부 동적화** — Gemini 이미지 모델은 PNG를 반환한다. 응답 `inlineData.mimeType`을 실제로 읽어 반영했다.

| 위치 | 기존 | 실측 결과 |
|---|---|---|
| GCS `contentType` | `'image/jpeg'` 고정 | `content-type: image/png` ✅ |
| 파일 확장자 | `.jpg` 고정 | `generated/1787816336794_0.png` ✅ |
| 응답 data URL | `data:image/jpeg;base64,` 고정 | `data:image/png;base64,iVBORw0K…` ✅ |

`grep image/jpeg server.js` → **0건**, `grep imagen` → **0건**.

**그 외**
- `negativePrompt` — Gemini 이미지 모델에 전용 필드가 없어 프롬프트에 `Avoid:` 로 병합.
- N장 — `sampleCount`가 없으므로 `Promise.all` 병렬 호출, 상한 `Math.min(max(n,1),4)`.
- 타임아웃 — 기존 gRPC 값(ultra 120s / fast 60s)을 `AbortController`로 재현. 실측 ultra 84.3s로 여유 확인.
- 미지원 파라미터 5종(`seed`·`guidanceScale`·`safetyFilterLevel`·`personGeneration`·`outputCompression`) — **수신은 유지**(프론트 400 방지), 요청 body에서 제외, `[Generate] Ignored params` 로그로 가시화. 무음 무시 없음.
- 실패 시 응답 원문을 로그에 남기고 500. **무음 폴백·강등 출고 없음.**
- `helpers`/`PredictionServiceClient`는 `/generate` 외 참조 **0건**을 확인하고 import 제거. `@google-cloud/aiplatform` 패키지 자체는 범위 밖이라 유지.
- `package.json`에 `google-auth-library ^9.15.0` 명시 승격 → `npm ls` 로 `9.15.1` 해석 확인.
- 파일 헤더 주석이 "Vertex AI Imagen 4 Backend API"로 남아 있어 현행화.

### 배포 전 사전 점검 — `/refine` 파괴 위험 배제

`deploy.sh`가 `GEMINI_API_KEY`를 주입하지 않으면 배포 자체가 `/refine`·`/analyze`를 깨뜨린다. 배포 **전에** 확인했다.

```
deploy.sh:79  --update-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"
라이브 리비전 env 실측: {'name':'GEMINI_API_KEY','valueFrom':{'secretKeyRef':...}}  → 일치 ✅
```

시크릿 **값은 열람하지 않았다**(헌법 4조 1항). 존재·주입 경로만 확인했다.

---

## 4. Phase B — 포털 CMS 이미지 생성

**파일**: `lib/shared/config.js` · `lib/cms/ai.js`

- `config.js` — 이미지 전용 `aiImage`(location `'global'`) + `CMS_IMAGE_MODEL` 신설. 텍스트용 `ai`(us-central1)는 정상 동작 중이라 **무변경**.
- `ai.js` — `ai.models.generateImages()`는 Imagen 전용 API라 Gemini 이미지 모델에 쓸 수 없다 → `aiImage.models.generateContent()`. 응답에서 `inlineData.data` 추출.
- GCS 메타데이터 `model: 'imagen-4-fast'` → `CMS_IMAGE_MODEL` 정합.
- `handleAiThumbnail` — **sharp/SVG 합성만 하고 모델 호출이 없음**을 확인. 무변경.
- 포털 프로덕션 코드의 `imagen-` 참조 **0건** (나머지 `imagen` 히트는 전부 스페인어 단어 "imagen").

### 소비처 확인 게이트 (`feedback_verify_consumer_check`)

`config.js`는 공용 정본이다. import 지점 **49곳** 대상으로 `aiImage`·`CMS_IMAGE_MODEL` **이름 충돌 0건** 확인. 신규 export이므로 기존 소비처 영향 없음.

### 회귀

```
Tests: 64 passed
Test Suites: 3 failed, 8 passed
```
실패 3건(`toss-cancel-webhook`·`payments-direct`·`headshot-gate`)은 전부 `SyntaxError: ... does not provide an export named 'LEMON_JP_VARIANTS'`이며, **내 변경을 stash하고 HEAD에서 돌려도 동일하게 3 failed / 64 passed로 재현**된다. **선행 상태이며 이번 작업과 무관하다.** (`LEMON_JP_VARIANTS`는 `config.js`에 실제로 export되어 있으므로 jest ESM 해석 문제로 보인다 — 별건.)

---

## 5. ⏳ 미완료 1건 — 포털 어드민 이미지 생성 클릭

지시서 완료 기준 "포털 어드민 이미지 생성 1회 성공"은 **작가님 클릭 1회가 필요하다.**

`/api/admin/ai/image`는 `requireAdmin` 게이트 뒤에 있고, 에이전트 세션은 `/auth/agent`에 **키 값**을 넘겨야 한다. 그 값은 Secret Manager 정본이며 **헌법 4조 1항상 에이전트가 값에 접촉할 수 없다.** 지시서 §5도 "이번 작업에서 값을 열람할 필요가 전혀 없다"고 못박았으므로 열람하지 않았다.

**대신 그 클릭이 통과할 조건을 전부 분해해 실증했다:**

| 조건 | 검증 | 결과 |
|---|---|---|
| 라우트 살아 있음 | 무인증 POST | **401 `{"error":"Unauthorized"}`** — 500이 아니라 인증 게이트가 정상 응답 |
| SA 권한 | 포털 SA 실측 = `monk-image-engine@monkos.iam.gserviceaccount.com` | **image-pro와 동일 SA**. §3에서 이미 이 SA로 `gemini-3.1-flash-image` 200 실증 |
| SDK 호출 형태 | `GoogleGenAI({vertexai:true, location:'global'})` + `generateContent` 동일 구성 실행 | `modelVersion: gemini-3.1-flash-image` · `mimeType: image/png` · base64 145,840자 ✅ |
| 후속 sharp 변환 | `sharp(png).jpeg({quality:85})` | **jpeg 1408×768 20.4KB** — PNG 입력 자동 판별 확인 ✅ |

> 즉 남은 것은 **어드민 세션 통과 여부**뿐이고, 모델·권한·SDK·이미지 변환 경로는 전부 실측으로 통과했다. 작가님이 어드민에서 "AI 이미지 생성"을 1회 눌러 GCS URL 반환을 확인해 주시면 종결된다.
> 검증 스크립트는 `config.js`를 임포트하지 않고 동일 구성만 재현해 **시크릿에 접촉하지 않았다.**

---

## 6. Phase C — 실측 상세 (판정 방법 명기)

`/generate`는 POST API로 CDN 캐시 대상이 아니므로 2회 히트 규칙은 적용하지 않았다(규칙 적용 대상은 캐시 계층 너머의 GET 표면). 대신 **배포 전 기준선 → 배포 후 재측정**의 전후 대조로 판정했다.

```
# T2I fast
POST /generate {"prompt":"a red apple on a white table","model":"fast","aspectRatio":"1:1","imageSize":"1K"}
→ 200 / 13.75s
  success=True  model=gemini-3.1-flash-image  modelVersion=gemini-3.1-flash-image
  aspectRatio=1:1  imageSize=1K  duration=12401ms
  data URL prefix=data:image/png;base64,iVBORw0K   base64 길이=1,613,182

# T2I ultra
POST /generate {"prompt":"a red apple on a white table","model":"ultra","aspectRatio":"3:4","imageSize":"2K"}
→ 200 / 86.19s
  model=gemini-3-pro-image  modelVersion=gemini-3-pro-image
  aspectRatio=3:4  imageSize=2K  duration=84322ms   base64 길이=9,612,694

# 미지원 파라미터 + GCS 저장 동시
POST /generate {... "saveToGcs":true,"seed":42,"guidanceScale":9,"personGeneration":"allow_all","negativePrompt":"text, watermark"}
→ 200
  로그: [Generate] Ignored params (unsupported by gemini-3.1-flash-image): seed, guidanceScale, personGeneration
  로그: [Generate] Saved to GCS: .../generated/1787816336794_0.png
  GCS 헤더 실측: content-type: image/png / content-length: 1,573,828

# 회귀 (무접촉 엔드포인트)
POST /refine  (I2I) → 200  success=true  image 1,006,338자
POST /analyze        → 200  success=true
```

> `aspectRatio`·`imageSize`가 요청대로 반영되고 `modelVersion`이 요청 모델과 일치하는 것까지 확인했다. "200이 떴다"만으로 판정하지 않았다.

---

## 7. Phase D — 이중 소스 방어

`apps/monk_imagen4/backend/server.js` 최상단에 경고 주석 1줄 추가. **로직 무변경**(`node --check` 통과), 이 판본의 Imagen 호출은 고치지 않았다 — 배포되지 않으므로 무해하고, 고치면 정본 오인을 부른다.

**정본 판정 재확인**: `monkos_AI/image-pro/backend/` 최종 커밋 `301ae908`(**06-19**)이 장애 리비전 `00031-cbh` 생성일과 일치한다. `apps/` 판본은 `4a058707`(06-12)로 더 오래됐다.

---

## 8. 범위 준수

| 항목 | 상태 |
|---|---|
| `/refine`·`/analyze` | 무접촉 ✅ (배포 전후 200 동일 실증) |
| `/batch-generate`·`/translate`·`/api/upload` | 무접촉 ✅ |
| `LOCATION`(us-central1) 상수 | 무변경 ✅ (이미지 전용 상수 신설) |
| 시크릿 값 접촉 | **없음** ✅ (존재·주입 경로만 확인, 검증 스크립트도 `config.js` 미임포트) |
| 배포 경로 | `deploy.sh` 경유 ✅ (`gcloud run deploy` 직접 실행 없음) |
| 인프라 상수 하드코딩 | 없음 ✅ (파일 상단 상수 집중) |
| 프론트 계약 | 유지 ✅ (응답 JSON 형태·파라미터 수신 그대로) |
| 롤백 단위 | Phase A / Phase B **별도 커밋** ✅ |
| 타 에이전트 미커밋 작업 | 무접촉 ✅ (민아 08-27 세션 진행 중) |

---

## 9. 커밋

| 커밋 | 내용 | 롤백 단위 |
|---|---|---|
| `86bbd4aa` | `[fix] IMAGE PRO T2I 모델 마이그레이션 — Imagen 4 폐지 대응` (+ Phase D 동봉) | image-pro |
| `76edeef3` | `[fix] 포털 CMS 이미지생성 Imagen 4 폐지 대응 — gemini-3.1-flash-image 전환` | portal |
| (본 커밋) | `[log] T2I 마이그레이션 실측 기록` | 기록 |

배포: `monk-image-engine-00032-qj6` · `monkos-portal-00557-k86`

---

## 10. 후속 필요 (범위 밖 — 보고만)

1. **`ultra` 응답이 84초다.** 기존 Imagen 4 ultra 대비 체감이 길다. 프론트 타임아웃·로딩 UX가 이 지연을 견디는지 확인이 필요하다(코드 타임아웃 120s·Cloud Run 300s는 여유).
2. **`imageSize: '4K'` 미검증.** 프론트가 4K를 보낼 수 있다면 별도 확인이 필요하다. 이번엔 1K·2K만 실측했다.
3. **포털 테스트 3 suite 선행 실패** — `LEMON_JP_VARIANTS` ESM 해석 문제. 이번 작업과 무관하나 회귀 신호를 가리므로 별건 처리 권고.
4. **이중 소스 일원화 미결** — 경고 주석은 방어일 뿐이다. `apps/monk_imagen4/backend/` 폐기 또는 심볼릭 통합은 별건.
5. **`negativePrompt` 성능 변화** — 전용 필드에서 프롬프트 병합으로 바뀌어 억제 강도가 달라질 수 있다. 꾸 상시 사용 중이므로 체감 피드백을 받아볼 가치가 있다.

---

✅ **T2I 복구 완결** — fast 200(12.4s) · ultra 200(84.3s), 배포 전 500 NOT_FOUND에서 전환 실증
✅ `/refine`·`/analyze` **회귀 없음** — 배포 전후 200 동일. 배포 전 `deploy.sh`의 `GEMINI_API_KEY` 주입을 먼저 확인해 파괴 위험을 배제
✅ **mimeType 하드코딩 3개소 전부 동적화** — GCS `image/png` · `.png` 확장자 · data URL 실측
✅ `Ignored params` 가시화 확인 — 무음 무시 없음. 실패 시 원문 로그 + 500, 강등 출고 없음
✅ Phase B 소비처 확인 게이트 49곳 이름 충돌 0 · SDK 호출 형태·sharp 변환 실증
✅ Phase D 비정본 경고 주석 (로직 무변경). 정본 판정 근거 재확인(06-19 커밋 = 장애 리비전 생성일)
⏳ **작가님 클릭 1회 필요** — 어드민 "AI 이미지 생성". 어드민 세션 키는 시크릿이라 접촉하지 않았고(헌법 4조 1항), 그 클릭이 통과할 조건(라우트 401·동일 SA 권한·SDK 형태·sharp 변환)은 전부 실증했습니다
💡 `ultra` 84초 — 프론트 타임아웃·로딩 UX 확인 권고 / `4K` 미검증 / `negativePrompt` 억제 강도 변화 가능
📁 `image-pro/backend/{server.js,package.json}` · `portal/lib/{shared/config.js,cms/ai.js}` · `apps/monk_imagen4/backend/server.js` · 세션로그 · PF_IMAGE_PRO · 본 보고서
🔀 3커밋 롤백 단위 분리 — `86bbd4aa`(image-pro) / `76edeef3`(portal) / 기록
