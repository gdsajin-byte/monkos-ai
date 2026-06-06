---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내3
subject: image_pro 애널라이저(리버스 프롬프트) 기능 멈춤 진단
status: 대기
portfolio: PF_IMAGEN
---

# 지시서: image_pro 애널라이저 기능 멈춤 진단

> **증상**: image.monkos.ai에서 Analyze(리버스 프롬프트) 버튼을 누르면 반응이 없거나 "Analysis engine unreachable" 에러 발생. 버튼 자체는 UI에 존재함.
> **목적**: 어디서 멈추는지 특정하고, 원인과 해결 방안을 보고한다. 수정은 하지 않는다.

---

## 1. 진단 대상

### 프론트엔드 (v6 빌드 번들)

프론트엔드는 빌드된 단일 파일이다:
- `apps/monk_imagen4/backend/public/app/assets/index-v6.js`

v6 번들 내 애널라이저 호출 흐름 (minified 변수명):
```
사용자 Analyze 버튼 클릭
  → bi() 함수 호출
  → z = b || Z.find(...).url  (현재 이미지 URL 결정)
  → Kf.analyzeImage(z) 호출
  → fetch(`https://image.monkos.ai/analyze`, { method: 'POST', body: { imageData: z } })
  → 성공: Al(Y) — 분석 결과 세팅
  → 실패: X("Analysis engine unreachable.")
```

**확인 사항**:
1. 브라우저 개발자 도구(Network 탭)에서 `/analyze` 요청이 실제로 나가는지
2. 요청이 나간다면 응답 상태 코드와 body 내용
3. 요청이 안 나간다면 — `z`(이미지 URL) 값이 null/undefined인지 (이미지 미선택 시 요청 자체가 안 나감)

### 백엔드 (server.js)

- `apps/monk_imagen4/backend/server.js` L332-409
- 엔드포인트: `POST /analyze`
- 모델: `gemini-2.0-flash` (generativelanguage.googleapis.com)
- 인증: `GEMINI_API_KEY` (x-goog-api-key 헤더)

**확인 사항**:
1. Cloud Run 로그에서 `[Analyze]` 로그가 찍히는지
2. `GEMINI_API_KEY`가 유효한지 — `/analyze` 호출 시 Gemini API 응답 상태
3. `gemini-2.0-flash` 모델이 현재도 유효한 모델명인지 (deprecated 여부)

---

## 2. 진단 절차

### Step 1: Cloud Run 로그 확인

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="monk-image-engine" AND textPayload=~"Analyze"' --limit 20 --format='value(textPayload)' --freshness=24h
```

아무것도 안 나오면 → 요청 자체가 백엔드까지 도달하지 않는 것.

### Step 2: 직접 API 호출 테스트

브라우저에서 실제 이미지로 테스트가 어려우면, 서버에 직접 요청:

```bash
# 작은 테스트 이미지(1x1 흰 픽셀)로 /analyze 호출
curl -s -X POST https://image.monkos.ai/analyze \
  -H 'Content-Type: application/json' \
  -d '{"imageData":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="}' \
  | python3 -m json.tool
```

응답별 판정:
- `200 + success: true` → 백엔드 정상, 프론트 문제
- `500 + GEMINI_API_KEY not configured` → 환경변수 누락
- `4xx/5xx + Gemini API error` → API 키 무효 또는 모델 deprecated
- 타임아웃/연결 실패 → Cloud Run 서비스 자체 문제

### Step 3: 모델 유효성 검증

```bash
# gemini-2.0-flash 모델이 현재 사용 가능한지
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash?key=$GEMINI_API_KEY" | python3 -m json.tool
```

deprecated되었으면 대체 모델 확인:
```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | python3 -c "import sys,json; [print(m['name']) for m in json.load(sys.stdin)['models'] if 'flash' in m['name'].lower()]"
```

### Step 4: 프론트엔드 확인 (CDP)

image.monkos.ai/app/ 접속 후 CDP로 콘솔 로그 확인:
```bash
scripts/tools/cdp.sh eval "console.log('analyze test')" 0
```

또는 브라우저 콘솔에서:
- Analyze 버튼 클릭 후 Console 탭에 `Analyze image error:` 또는 `Analysis engine unreachable` 메시지 확인
- Network 탭에서 `/analyze` 요청 필터링

---

## 3. 보고 형식

```markdown
## 애널라이저 진단 결과

### 1. 요청 도달 여부
- Cloud Run 로그: (있음/없음)
- /analyze 직접 호출 결과: (상태코드 + 응답 요약)

### 2. 모델 상태
- gemini-2.0-flash: (유효/deprecated/에러)
- GEMINI_API_KEY: (유효/무효/미설정)

### 3. 원인 특정
- (프론트 문제 / 백엔드 문제 / API 키 문제 / 모델 deprecated)

### 4. 해결 방안
- (구체적 수정 사항)
```

---

## 4. ⚠️ 준수 조항

- **수정 금지**: 이 지시서는 진단+보고만. 코드 수정은 별도 승인.
- **헌법 4조 1항**: GEMINI_API_KEY 값을 로그/보고서에 절대 노출 금지. 유효 여부만 보고.
- **ch5 배포**: 배포 금지.

---

## 5. 참조

| 용도 | 경로 |
|------|------|
| 백엔드 /analyze 엔드포인트 | `apps/monk_imagen4/backend/server.js` L332-409 |
| 프론트 v6 번들 | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` |
| 프론트 analyze 호출 | v6 번들 내 `Kf.analyzeImage()` → `fetch(Gf+"/analyze")`, `Gf="https://image.monkos.ai"` |
| 프론트 에러 메시지 | `"Analysis engine unreachable."` (catch 블록) |
| deploy.sh | `apps/monk_imagen4/backend/deploy.sh` |
