---
type: order
from: M1/쌍아
to: 막내
date: 2026-03-31
priority: 🟠 높음
subject: image.monkos.ai 정밀 진단 — Imagen 4 T2I 장애 원인 + 전 엔드포인트 상태 확인
related: INCIDENT_20260330_gemini3pro_deprecated_긴급.md
---

# 지시서: image.monkos.ai 정밀 진단

**[2026-03-31 06:17 KST] M1/쌍아 → 막내**

---

## 배경

3/30 image.monkos.ai(IMAGE PRO)에서 장애 발생.
**작가님 보고: IMAGE PRO T2I(Imagen 4)에 문제가 있었다.** 정확한 증상과 원인을 진단할 것.

### 3/30 진단으로 확인된 사실
- `gemini-3-pro-image-preview` → **폐기 아님** (어제 리서치 결과)
- `gemini-3-pro-preview` (image 없는 일반 preview) → **이것이 폐기된 모델**
- idphoto-kr/jp API 키 복구는 완료

### 미진단 사항 (이 지시서의 핵심)
- **Imagen 4 T2I (`/generate`) 자체의 장애 원인이 무엇이었는지** — 추정 아닌 실제 확인
- image.monkos.ai 전체 엔드포인트의 현재 프로덕션 상태

---

## 진단 항목

### 1. [핵심] Imagen 4 T2I `/generate` 장애 진단

어제 T2I에 문제가 있었다. 가능한 원인을 **하나씩 검증**:

**(a) Vertex AI ADC 인증 문제**
```bash
# Cloud Run 서비스 계정의 Vertex AI 권한 확인
gcloud projects get-iam-policy monkos --flatten="bindings[].members" \
  --filter="bindings.members:monk-image-engine@" --format="table(bindings.role)"

# Imagen 4 모델 접근 가능 여부 (서비스 계정 기준)
gcloud ai models list --region=us-central1 --filter="displayName~imagen" 2>&1 | head -20
```

**(b) Cloud Run 배포 상태**
```bash
gcloud run services describe monk-image-engine --region us-central1 \
  --format='table(status.url, status.conditions[0].status)'

gcloud run revisions list --service monk-image-engine --region us-central1 --limit 5
```

**(c) 실제 T2I 호출 테스트 — 추정 아닌 실행**
```bash
# /health 먼저
curl -s https://image.monkos.ai/health | jq .

# T2I 실 호출 (간단한 프롬프트)
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST https://image.monkos.ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a red apple on a white background","numberOfImages":1}' \
  | head -200
```

- HTTP 상태코드 기록
- 응답 본문 전문 기록 (에러 메시지 포함)
- 성공 시: 이미지 base64 반환되는지, GCS URL인지 확인
- 실패 시: 에러 메시지에서 원인 특정 (403? 인증? 모델? 쿼터?)

**(d) Imagen 4 모델 가용성 확인**
- `imagen-4.0-fast-generate-001` / `imagen-4.0-ultra-generate-001` 현재 Vertex AI에서 호출 가능한지
- us-central1 리전에서 해당 모델 활성 상태인지

**(e) Cloud Run 로그 확인** (어제 에러 로그)
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=monk-image-engine AND severity>=ERROR" \
  --limit=20 --format="table(timestamp,textPayload)" \
  --freshness=1d
```

### 2. 전 엔드포인트 상태 매핑

아래 테이블을 **코드 확인 + 실제 호출 결과** 기반으로 완성:

| 엔드포인트 | 파일:라인 | 사용 모델 | 모델 상태 | 실 호출 결과 |
|-----------|----------|----------|----------|------------|
| `POST /generate` | `backend/server.js:99-101` | `imagen-4.0-fast/ultra-generate-001` | ? | **실제 테스트** |
| `POST /batch-generate` | `backend/server.js` | 위와 동일 | ? | **실제 테스트** |
| `POST /refine` | `backend/server.js:276` | `gemini-3-pro-image-preview` | 정상 (폐기 아님) | **실제 테스트** |
| `POST /analyze` | `backend/server.js:346` | `gemini-2.0-flash` | ? | **실제 테스트** |
| `POST /translate` | `backend/server.js:432` | `gemini-2.0-flash` | ? | **실제 테스트** |

- "확인 필요", "정상 추정" 금지 — **모든 엔드포인트를 실제 호출하여 결과를 기록**

### 3. 프론트엔드 모듈 코드 내 폐기 모델 확인

```bash
# 실제 폐기된 모델은 gemini-3-pro-preview (image 아닌 일반)
grep -rn "gemini-3-pro-preview" apps/monk_imagen4/
# 위 결과에서 gemini-3-pro-image-preview는 제외하고, 일반 preview만 추출
```

확인된 위치:
- `services/geminiService.ts:112` → `gemini-3-pro-preview` (image 아닌 일반) — **이것이 폐기 모델**

이 파일이 프로덕션에서 실제로 사용되는 경로인지 확인할 것.

### 4. API 키 상태

- `GEMINI_API_KEY` (Secret Manager) 유효 여부
- Vertex AI ADC 서비스 계정 권한 정상 여부
- 3/30 API 키 복구 작업이 image.monkos.ai에도 적용되었는지

```bash
gcloud secrets versions access latest --secret=GEMINI_API_KEY 2>/dev/null | tail -c 4
```

### 5. 배포 경로 판정

`image.monkos.ai` DNS가 어디를 가리키는지:
```bash
dig image.monkos.ai +short
```

Cloud Run vs Cloudflare Pages — 어디가 실제 프로덕션인지 확정.

---

## 산출물

마크다운 보고서 1건 (`REPORT_20260331_막내_image_monkos_ai_진단.md`):

1. **[핵심] Imagen 4 T2I 장애 원인 판정** — 실제 테스트 결과 + Cloud Run 에러 로그 기반
2. **엔드포인트별 상태 테이블** — 모든 엔드포인트 실 호출 결과 (추정 금지)
3. **폐기 모델 사용처** — `gemini-3-pro-preview` (image 아닌 일반) 위치만 해당
4. **API 키·인증 상태**
5. **배포 경로 판정**
6. **수정 필요사항 요약** (P0/P1/P2)

---

## 준수 조항

- **코드 수정 하지 말 것** — 이 지시서는 진단만 수행
- **"추정", "정상 추정" 사용 금지** — 모든 항목은 실제 확인 결과로 기재
- 헌법 제4조 1항: API 키 값을 보고서에 포함 금지 (끝4자리 마스킹만)
- 헌법 제3조 1항: 타임스탬프 시스템 명령 취득
- 완료 보고 형식: `✅❌💡⏳📁🔀`

---

## 완료 기준

- [ ] Imagen 4 T2I `/generate` 실제 호출 테스트 + 결과 기록
- [ ] Cloud Run 에러 로그 확인 (어제 시점)
- [ ] 전 엔드포인트(5개) 실 호출 상태 확인
- [ ] `gemini-3-pro-preview` (폐기 모델) 사용처 확인
- [ ] API 키·ADC 인증 상태 확인
- [ ] 배포 경로 판정
- [ ] 보고서 작성 + 완료 보고
