---
type: order
from: M1/쌍아
to: 막내
date: 2026-03-31
priority: 🔴 P0
subject: image.monkos.ai — Secret Manager 키 갱신 + /batch-generate 코드 수정 + Cloud Run 재배포
related: REPORT_20260331_막내2_image_monkos_ai_진단.md
---

# 지시서: image.monkos.ai 키 갱신 + 코드 수정 + 배포

**[2026-03-31 07:10 KST] M1/쌍아 → 막내**

---

## 배경

3/31 진단 확정:
1. **GEMINI_API_KEY(`...HDow`) 만료** → `/refine`, `/analyze`, `/translate` 전부 장애
2. **`/batch-generate` 503** → `app._router.handle()` Express 비공식 API 사용으로 TypeError 발생 (3/30 T2I 장애 원인)

어제 사무실(iMac)에서 새 Google API 키를 만들어 로컬 .env는 갱신했으나, Secret Manager + Cloud Run 재배포는 미수행 상태.

---

## 작업 1: Secret Manager 키 갱신 (P0)

### 1-1. 현재 iMac에서 갱신한 새 키 확인

작가님이 어제 만든 새 키를 확인해야 함. 아래 중 하나:
- iMac의 `.env` 또는 `.env.local`에서 새 키 확인
- Google AI Studio (aistudio.google.com) → API Keys에서 확인

**⚠️ 키 값은 작가님이 직접 제공. 막내가 생성/추측 절대 금지 (헌법 제4조 1항)**

### 1-2. Secret Manager 업데이트

```bash
# 새 키를 Secret Manager에 새 버전으로 추가
echo -n "작가님_제공_키" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 기존 만료 버전 비활성화
gcloud secrets versions disable 1 --secret=GEMINI_API_KEY

# 확인 (끝 4자리만)
gcloud secrets versions access latest --secret=GEMINI_API_KEY | tail -c 4
```

---

## 작업 2: `/batch-generate` 코드 수정 (P1)

### 현재 코드 (server.js:211-232)

```javascript
app.post('/batch-generate', async (req, res) => {
  try {
    const { prompt, ...options } = req.body;
    const batchRequest = {
      ...req.body,
      numberOfImages: 4
    };
    // ❌ Express 비공식 내부 API — TypeError 발생
    req.body = batchRequest;
    return app._router.handle(req, res);
  } catch (error) {
    console.error('[Batch Generate] Error:', error);
    res.status(500).json({ error: error.message, code: 'BATCH_GENERATION_FAILED' });
  }
});
```

### 수정 방향

`/generate`의 생성 로직을 공통 함수로 추출하여 `/batch-generate`에서 재사용.

```javascript
// 1. /generate 핵심 로직을 함수로 추출
async function generateImages(params) {
  // 기존 /generate의 Vertex AI 호출 로직을 여기로 이동
  // (req, res 의존 제거)
}

// 2. /generate에서 호출
app.post('/generate', async (req, res) => {
  const result = await generateImages(req.body);
  res.json(result);
});

// 3. /batch-generate에서 numberOfImages: 4로 호출
app.post('/batch-generate', async (req, res) => {
  const result = await generateImages({ ...req.body, numberOfImages: 4 });
  res.json(result);
});
```

**핵심 원칙:**
- 기존 `/generate`의 응답 형식·GCS 저장 로직 그대로 유지
- `app._router.handle()` 완전 제거
- 에러 핸들링 동일하게 유지

---

## 작업 3: Cloud Run 재배포

작업 1, 2 완료 후:

```bash
cd apps/monk_imagen4/backend && bash deploy.sh production
```

deploy.sh가 `--update-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"`를 포함하므로, Secret Manager의 새 키가 자동 주입됨.

---

## 작업 4: E2E 검증

배포 후 전 엔드포인트 실 테스트:

```bash
# 1. 헬스
curl -s https://image.monkos.ai/health | jq .status

# 2. T2I 단건
curl -s -X POST https://image.monkos.ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a red apple on white background","numberOfImages":1}' \
  | jq '{success}'

# 3. T2I 4장 배치 (이번에 수정한 핵심)
curl -s -X POST https://image.monkos.ai/batch-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a red apple on white background"}' \
  | jq '{success}'

# 4. /translate (키 갱신 확인)
curl -s -X POST https://image.monkos.ai/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"a beautiful sunset","targetLang":"KO"}' \
  | jq '{success}'
```

`/refine`과 `/analyze`는 이미지 입력 필요 — 최소한 에러 메시지가 "API key expired"가 아닌 정상 검증 에러인지 확인:

```bash
# 5. /refine — 키 갱신 후 검증 에러 패턴 확인 (이미지 미첨부)
curl -s -X POST https://image.monkos.ai/refine \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","mode":"UPSCALE"}' \
  | jq '{success, error}'

# 6. /analyze — 동일
curl -s -X POST https://image.monkos.ai/analyze \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq '{success, error}'
```

**검증 기준:**
- `/refine` 에러가 "API key expired"가 아닌 "inputImage is required" 등 정상 검증 에러 → 키 갱신 성공
- `/batch-generate` 200 + 이미지 4장 반환 → 코드 수정 성공

---

## 준수 조항

- 헌법 제4조 1항: **API 키 생성/추측 금지** — 작가님이 직접 제공하는 키만 사용
- 헌법 제4조 2항: `/batch-generate` 수정 시 기존 `/generate` 로직 파괴 주의
- 완료 보고 형식: `✅❌💡⏳📁🔀`

---

## 완료 기준

- [ ] Secret Manager 키 갱신 (작가님 키 수신 후)
- [ ] `/batch-generate` 코드 수정 (`app._router.handle()` 제거)
- [ ] Cloud Run 재배포
- [ ] E2E 검증 6개 엔드포인트 전수 테스트
- [ ] 완료 보고
