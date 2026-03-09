---
type: order
date: 2026-03-01
from: M1/쌍아
to: M1/막내1
priority: P0
scope: Image Pro /generate — 2/20 전후 이력 검수 (리서치 전용, 코드 수정 금지)
context: 직전 세션 오진으로 /generate가 Gemini API로 잘못 전환됨. 원래 Vertex AI ADC 구조였으나 복원 전 정확한 이력 파악 필수
---

# 지시서: Image Pro /generate 이력 검수 리서치

**[2026-03-01 07:39 KST] M1/쌍아 → M1/막내1**

## 목적

Image Pro의 T2I(Text-to-Image) `/generate` 엔드포인트의 **정상 작동 시점 코드**를 정확히 파악한다.
2/20 전후로 모델 전환이 있었고, 2/26~28 대규모 리팩토링 과정에서 손상이 발생했다.
**복원 설계의 근거 자료**를 만드는 것이 목적이다.

## ⚠️ 절대 금지

- **코드 수정 금지** — 어떤 파일도 수정하지 않는다
- **배포 금지** — 어떤 서비스에도 배포하지 않는다
- **npm install 금지** — 의존성 변경하지 않는다
- 이 지시서는 **순수 리서치**다. 보고서만 산출한다

## 배경 요약

### 경위
1. **2/20 이전**: `imagen-4.0-generate-001` 모델이 Vertex AI에서 폐기 → 에러 발생
2. **2/20**: 작가님 직접 지시로 `imagen-4.0-fast`/`imagen-4.0-ultra` 스위칭 구현. Standard/Premium 버튼 정리. 한·꾸 정상 사용 확인
3. **2/26~28**: 대규모 리팩토링(쿠키 단일화, 탯줄 절단, CF→Cloud Run 이관) 과정에서 어딘가 손상
4. **3/1 직전 세션**: 컴팩팅으로 컨텍스트 소실된 쌍아가 Vertex AI → Gemini API 전면 전환을 오진으로 시행

### 원래 아키텍처 (monk.kr 시절, 정상 작동)
```
[프론트 v6 on monk.kr CF Pages]
  ↓ /api/generate (same-origin)
[CF Worker functions/api/generate.js]  ← model 파라미터 수신 (fast/ultra)
  ↓ fetch('https://image.monkos.ai/generate', { body: { model, prompt, ... } })
[Cloud Run apps/monk_imagen4/backend/server.js]  ← Vertex AI ADC 호출
  ↓ PredictionServiceClient
[Vertex AI Imagen 4 (fast/ultra)]
```

- CF Worker가 중간 릴레이 역할 — CF에서는 ADC 불가(API Key만 가능, 분당 60요청)
- Cloud Run에서 Vertex AI를 ADC로 직접 호출 — 이것이 정상 경로

### 현재 아키텍처 (monkos.ai 이관 후)
```
[프론트 v6 on Cloud Run (image.monkos.ai)]
  ↓ /generate (same-origin)
[Cloud Run apps/monk_imagen4/backend/server.js]  ← 여기서 Vertex AI ADC 호출해야 함
  ↓ PredictionServiceClient
[Vertex AI Imagen 4 (fast/ultra)]
```

- CF Worker 릴레이 불필요 — 프론트와 백엔드가 같은 Cloud Run
- Cloud Run이 Vertex AI를 ADC로 직접 호출하면 됨

## 조사 항목

### 1단계: 2/20 모델 전환 커밋 체인 전수 확인

아래 커밋들의 **full diff**를 각각 확인하고, 각 커밋에서 무엇이 바뀌었는지 기록한다.

```bash
# 2/20 전후 Image Pro 관련 커밋 (시간순)
git show 8590a08  # generate.js Imagen 4 엔드포인트 복구
git show dd458d6  # :predict 응답구조 대응
git show e4034df  # 배치 4→1 축소
git show d7cf981  # BLOCK_NONE 적용
git show d1b351c  # Cloud Run 프록시 전환
git show 9499029  # block_none + personGeneration 전달
git show faae36b  # model 파라미터 추가 (fast/ultra 스위칭) ← 핵심
git show 279aa3b  # v6 Standard/Premium 라벨 + 광고 로딩화면
```

**기록할 것:**
- 각 커밋에서 수정된 파일 목록
- `generate.js` (CF Worker)에서 model 파라미터를 어떻게 수신·전달하는지
- `server.js` (Cloud Run)에서 model 파라미터를 수신하여 Vertex AI 모델 ID에 매핑하는 코드가 있는지
- 프론트엔드(index-v5.js → v6)에서 model 값을 어떻게 보내는지

### 2단계: Cloud Run server.js 버전 비교

Cloud Run `server.js`의 각 시점별 코드를 비교한다.

```bash
# 원본 (최초 배포)
git show a644ffc:apps/monk_imagen4/backend/server.js

# 2/28 Phase 1 이관 (막내2)
git show 3f18774:apps/monk_imagen4/backend/server.js

# 2/28 프론트 통합 (막내)
git show aeb74bb:apps/monk_imagen4/backend/server.js

# 3/1 Gemini API 전환 (오진)
git show 1d7e481:apps/monk_imagen4/backend/server.js
```

**기록할 것:**
- 각 버전의 `/generate` 핸들러 전문
- `model` 파라미터 수신 여부
- Vertex AI 모델 ID 매핑 방식 (generate-001 고정? fast/ultra 분기?)
- `@google-cloud/aiplatform` 의존성 존재 여부
- `PredictionServiceClient` 초기화 방식

### 3단계: CF Worker generate.js 버전 비교

monk.kr에서 사용하던 CF Worker의 코드 변천을 추적한다.

```bash
# 2/20 모델 스위칭 추가 시점
git show faae36b:functions/api/generate.js

# 2/28 탯줄 절단 직전
git show 6ba934f:functions/api/generate.js 2>/dev/null || echo "없음"
git show 0555f72:functions/api/generate.js 2>/dev/null || echo "없음"
git show d3c6a6d:functions/api/generate.js 2>/dev/null || echo "없음"

# MONK_kr 폴더의 generate.js (선별 복원 이후)
git show 0555f72:MONK_kr/functions/api/generate.js 2>/dev/null || echo "없음"
```

**기록할 것:**
- CF Worker가 Cloud Run에 전달하던 정확한 request body 형태
- model 파라미터 전달 방식
- CF Worker가 Cloud Run 응답을 프론트에 전달할 때 변환 로직 (이미지 배열 형식)

### 4단계: 프론트엔드 model 값 확인

프론트엔드가 백엔드에 보내는 model 값을 확인한다.

```bash
# v5 (monk.kr 현행)
grep -n 'model' MONK_kr/ai_lab/image_pro/app/assets/index-v5.js | head -20

# v6 (Cloud Run에 복사된 버전)
grep -n 'model' apps/monk_imagen4/backend/public/app/assets/index-v6.js | head -20

# Standard/Premium 라벨 관련
grep -n -i 'standard\|premium\|fast\|ultra' apps/monk_imagen4/backend/public/app/assets/index-v6.js | head -20
```

**기록할 것:**
- 프론트엔드가 /generate 호출 시 보내는 request body 구조
- model 값: "fast" / "ultra" 중 어떤 값을 보내는지
- Standard 버튼 → model:"fast", Premium 버튼 → model:"ultra" 매핑 확인

### 5단계: 손상 시점 특정

2/26~28 리팩토링 커밋 중 Cloud Run server.js를 변경한 커밋을 시간순으로 나열한다.

```bash
git log --oneline --all --after="2026-02-25" -- apps/monk_imagen4/backend/server.js
```

각 커밋의 diff에서 `/generate` 핸들러 변경 내용을 기록하고, 어느 시점에서 model 분기 또는 Vertex AI 호출이 손상됐는지 특정한다.

### 6단계: 현재 프로덕션 상태 확인

```bash
# 현재 서빙 중인 Cloud Run 리비전
gcloud run services describe monk-image-engine --region=us-central1 --format="value(status.traffic)"

# 최근 5개 리비전
gcloud run revisions list --service=monk-image-engine --region=us-central1 --limit=5

# /health 응답 확인
curl -s https://image.monkos.ai/health | python3 -m json.tool
```

현재 프로덕션에 어떤 버전이 올라가 있는지 확인한다.

## 보고서 형식

보고서 파일: `monkos-ops/ops/reports/REPORT_20260301_막내_ImagePro_generate_이력검수.md`

```markdown
# Image Pro /generate 이력 검수 보고서

## 1. 커밋 체인 분석 (2/20)
| 커밋 | 날짜 | 수정 파일 | 핵심 변경 |
|------|------|----------|----------|
| ... | ... | ... | ... |

## 2. Cloud Run server.js 버전별 비교
| 시점 | 커밋 | model 수신 | Vertex AI 모델 ID | aiplatform 의존성 |
|------|------|-----------|------------------|-----------------|
| 원본 | a644ffc | ? | ? | ? |
| Phase 1 이관 | 3f18774 | ? | ? | ? |
| 프론트 통합 | aeb74bb | ? | ? | ? |
| Gemini 전환 (오진) | 1d7e481 | 없음 | 없음 (Gemini 3) | 제거 |

## 3. CF Worker generate.js 변천
| 시점 | 커밋 | model 전달 | 응답 변환 |
|------|------|-----------|----------|
| ... | ... | ... | ... |

## 4. 프론트엔드 계약
- Standard 버튼 → model: "?"
- Premium 버튼 → model: "?"
- request body 구조: { ... }

## 5. 손상 시점 특정
- 어느 커밋에서 무엇이 빠졌는지 명확히 기술

## 6. 프로덕션 현황
- 현재 서빙 리비전: ?
- 현재 /generate 동작 여부: ?

## 7. 복원을 위한 핵심 발견
- Cloud Run server.js에 model 파라미터 분기가 원래 있었는지 / 없었는지
- 있었다면 어느 커밋에서 손실됐는지
- 없었다면 CF Worker가 하던 변환을 Cloud Run에 새로 구현해야 하는 범위
```

## 완료 조건

- [ ] 2/20 커밋 체인 8개 전수 확인 완료
- [ ] Cloud Run server.js 4개 버전 비교 완료
- [ ] CF Worker generate.js 변천 추적 완료
- [ ] 프론트엔드 model 값 전달 방식 확인
- [ ] 손상 시점 특정 (어느 커밋에서 뭐가 빠졌는지)
- [ ] 프로덕션 현황 확인
- [ ] 보고서 작성 완료
- [ ] **코드 수정 0건** 확인
