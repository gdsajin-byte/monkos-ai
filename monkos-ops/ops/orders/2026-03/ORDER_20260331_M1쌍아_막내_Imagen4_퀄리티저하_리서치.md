---
type: order
from: M1/쌍아
to: 막내1, 막내2
date: 2026-03-31
priority: 🟠 높음
subject: Imagen 4 fast/ultra 퀄리티 저하 + Premium 일러스트 변질 원인 리서치
related: ORDER_20260331_M1쌍아_막내_IMAGE_MONKOS_AI_키갱신+배치수정+배포.md
---

# 지시서: Imagen 4 모델 변경사항 리서치

**[2026-03-31 07:38 KST] M1/쌍아 → 막내1, 막내2**

---

## 배경

image.monkos.ai의 T2I 엔진은 Vertex AI Imagen 4를 사용 (3/1 구현 확인):
- Standard: `imagen-4.0-fast-generate-001`
- Premium: `imagen-4.0-ultra-generate-001`

3/1 이후 **코드 변경 없음** (server.js 최종 배포 2/28, rev 00021-c76). 그런데 **어제(3/30) 작가님 보고**:
- T2I 생성 **퀄리티가 많이 떨어짐**
- **Premium(ultra)이 일러스트/그림을 내뱉음** (사진이 아닌 그림체)
- 한송이 쪽에서도 동일 증상

코드에 변화가 없으므로 **Google 측 모델 변경**을 의심.

---

## 막내1 — Google 공식 발표 + Vertex AI Release Notes 전수 조사

### 1-1. Vertex AI Release Notes (3월)

웹 검색으로 아래 확인:
- `cloud.google.com/vertex-ai/generative-ai/docs/release-notes` — 3월 변경사항
- Imagen 4 관련 모델 업데이트, 파라미터 변경, 동작 변경 전수 확인
- 특히 **3/20~3/30 사이** 변경 집중 확인

### 1-2. Imagen 4 모델 ID 현행 상태

아래 모델들의 현재 공식 상태 확인:
- `imagen-4.0-fast-generate-001` — Active? Deprecated? 후속 버전?
- `imagen-4.0-ultra-generate-001` — Active? Deprecated? 후속 버전?
- `imagen-4.0-generate-001` (원본) — 현재 상태?
- Imagen 4의 최신 모델 ID가 무엇인지 (002 등 신규 버전 출시 여부)

### 1-3. 파라미터 변경 여부

우리가 사용 중인 파라미터:
```javascript
safetyFilterLevel: 'block_none'
personGeneration: 'allow_all'
guidanceScale: 7.0
outputMimeType: 'image/jpeg'
outputCompression: 95
```

위 파라미터 중 최근 **제한/폐기/동작 변경**된 것이 있는지:
- `personGeneration: 'allow_all'` — 유효 값인지? `'allow_adult'`와 차이?
- `safetyFilterLevel: 'block_none'` — 최근 제한되었는지?
- `guidanceScale` — Imagen 4에서 지원 중단 여부

### 1-4. 일러스트 변질 관련

Premium(ultra) 모델에서 사진이 아닌 일러스트/그림이 나오는 현상:
- Google 세이프가드 강화로 인물 사진 → 일러스트 우회 사례가 있는지
- Vertex AI에서 `personGeneration` 정책이 변경되었는지
- 커뮤니티에서 동일 증상 보고가 있는지

---

## 막내2 — 커뮤니티 반응 + 실전 사례 수집

### 2-1. 커뮤니티 검색

최근 2주 (3/17~3/31) 아래 채널에서 Imagen 4 퀄리티 관련 글 수집:

1. **Google AI 공식 포럼** (discuss.ai.google.dev) — Imagen 4 quality, style change
2. **GitHub Issues** (google-gemini, generative-ai 관련 레포) — Imagen 4 regression
3. **Reddit** (r/GoogleGeminiAI, r/StableDiffusion, r/MachineLearning) — Imagen 4 quality drop
4. **Stack Overflow** — Imagen 4 illustration, cartoon style output
5. **X(Twitter)** — "imagen 4" + quality / illustration / degraded

각 글의 **날짜, 증상, 사용 모델(fast/ultra/standard), 해결책**을 기록.

### 2-2. 실전 비교 테스트

Vertex AI에서 직접 호출하여 현재 출력 품질 확인:

```bash
# fast 모델 테스트 — 인물 사진 프롬프트
curl -s -X POST https://image.monkos.ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "professional headshot portrait of a young Korean woman, studio lighting, white background, photography style",
    "model": "fast",
    "numberOfImages": 1
  }' -o /tmp/imagen4_fast_test.json

# ultra 모델 테스트 — 동일 프롬프트
curl -s -X POST https://image.monkos.ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "professional headshot portrait of a young Korean woman, studio lighting, white background, photography style",
    "model": "ultra",
    "numberOfImages": 1
  }' -o /tmp/imagen4_ultra_test.json
```

결과 확인:
- 이미지가 **사진**인지 **일러스트/그림**인지
- base64를 디코딩해서 파일로 저장 → 시각적 확인
- HTTP 응답에 에러나 경고 메시지가 있는지

### 2-3. 파라미터 영향 테스트

`personGeneration` 값을 바꿔서 차이 확인:

```bash
# allow_all (현재 설정)
curl -s -X POST https://image.monkos.ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"portrait of a Korean woman","model":"ultra","numberOfImages":1,"personGeneration":"allow_all"}'

# allow_adult (다른 경로에서 사용하던 값)
curl -s -X POST https://image.monkos.ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"portrait of a Korean woman","model":"ultra","numberOfImages":1,"personGeneration":"allow_adult"}'
```

두 결과의 품질 차이를 비교 기록.

---

## 산출물

마크다운 보고서 각 1건:

**막내1**: `REPORT_20260331_막내1_Imagen4_모델변경사항_리서치.md`
1. Vertex AI Release Notes 3월 변경사항 테이블
2. 모델 ID별 현행 상태 테이블
3. 파라미터 변경 여부 테이블
4. 일러스트 변질 관련 공식 정보

**막내2**: `REPORT_20260331_막내2_Imagen4_커뮤니티+실전테스트.md`
1. 커뮤니티 반응 수집 (최소 5건)
2. fast/ultra 실 호출 결과 (이미지 파일 첨부 또는 품질 소견)
3. personGeneration 파라미터 비교 결과
4. 종합 소견

---

## 준수 조항

- **코드 수정 하지 말 것** — 리서치 + 테스트만 수행
- 헌법 제4조 1항: API 키 값 보고서 기재 금지
- 완료 보고 형식: `✅❌💡⏳📁🔀`

---

## 완료 기준

- [ ] 막내1: Vertex AI Release Notes 3월 전수 확인
- [ ] 막내1: 모델 ID 현행 상태 + 파라미터 변경 여부 확인
- [ ] 막내2: 커뮤니티 반응 최소 5건 수집
- [ ] 막내2: fast/ultra 실 호출 테스트 + 품질 소견
- [ ] 막내2: personGeneration 파라미터 비교
- [ ] 각 보고서 작성 + 완료 보고
