---
type: report
date: 2026-07-07
device: M1
agent: 막내1
status: 마감
portfolio: PF_SPECS
order: ORDER_20260707_M1쌍아_막내_VertexAI_매팅서빙_바우처검증
---

# Vertex AI Prediction — BiRefNet 매팅 서빙 + GenAI 바우처 적용 검증

> **[2026-07-07 15:00 KST] M1/막내1 → 작가님**
> 귀속: PF_SPECS

---

## 1. GenAI 바우처 적용 범위 — ❌ Custom Container / GPU 미적용

### 조사 방법
- GCP SKU 그룹 공식 페이지 실측 (cloud.google.com/skus/sku-groups/)
- gcloud CLI 빌링 계정 확인 (monkos 프로젝트 → MAIN_Acount, KRW)
- 웹 리서치 교차 검증 (3개 소스)

### 결론: GenAI 크레딧(₩147만)은 **Gemini API 추론 전용**

| SKU 카테고리 | 커버 여부 | 비고 |
|-------------|----------|------|
| Gemini 2.5/3.x 텍스트 생성 (입력/출력 토큰) | ✅ | 현재 specs 생성에 사용 중 |
| Imagen 4 이미지 생성 | ✅ | |
| Gemini 임베딩 | ✅ | |
| Gemini 배치/스트리밍 | ✅ | |
| **Vertex AI Prediction (Custom Container)** | **❌** | aiplatform.googleapis.com/prediction SKU 미포함 |
| **GPU 가속기 (T4/L4/A100)** | **❌** | Vertex AI 예측용 GPU SKU 미포함 |
| **Cloud Run GPU** | **❌** | run.googleapis.com GPU SKU 미포함 |
| Cloud Run CPU/메모리 | **❌** | GenAI 크레딧 대상 아님 |

**근거**: Google Developer Program Premium GenAI Credit SKU 그룹 페이지 확인 — 전체 목록이 `Gemini API (AEFD-7695-64FA)` 서비스 하위의 토큰 생성/카운팅 SKU로만 구성. Vertex AI Prediction, Custom Model Serving, GPU 관련 SKU 일체 없음.

> ⚠️ CLI로 Billing → Credits 콘솔 직접 접근은 불가. 작가님이 GCP 콘솔(Billing → Credits)에서 **적용 SKU 필터**를 직접 확인하시면 최종 확정 가능.

### Cloud Run GPU SKU 참고

Cloud Run GPU L4 SKU는 별도 그룹(`Cloud Run GPUs`)으로 관리되며, 현재 가용 리전:
- asia-south1, asia-southeast1, europe-west1, europe-west4, us-central1, us-east4
- **asia-northeast1(도쿄), asia-northeast3(서울) 미포함** ← Cloud Run GPU L4 리전 제한

---

## 2. Vertex AI Prediction 서빙 구조

### 커스텀 컨테이너 배포: ✅ 가능

- Docker 이미지(ONNX + Python Flask/FastAPI) 배포 가능
- 모델을 `/predict` 엔드포인트로 서빙하는 표준 패턴
- Vertex AI SDK 또는 gcloud CLI로 엔드포인트 생성 → 모델 배포

### Scale-to-Zero: ✅ 지원 (v1beta1, 제약 있음)

| 항목 | 상세 |
|------|------|
| 설정 | `min_replica_count=0` (v1beta1 API) |
| 동작 | 트래픽 없으면 0 레플리카로 축소 |
| 첫 요청 | **429 에러 반환** → 클라이언트 재시도 필요 |
| 호환성 | 멀티모델 엔드포인트, 트래픽 스플릿과 비호환 |
| GPU | 지원하나 콜드스타트 대폭 증가 |

### GPU 옵션 + 리전

| GPU | 시간당 비용 | 메모리 | 비고 |
|-----|-----------|--------|------|
| T4 | $0.40~0.53/hr | 16GB | 저가, 레거시 |
| **L4** | **$0.64/hr** | 24GB | BiRefNet 928MB에 충분 |
| A100 (40GB) | $3.37/hr | 40GB | 과잉 |
| H100 | $11.27/hr | 80GB | 과잉 |

**리전 가용성**:
- **asia-northeast1 (도쿄)**: ✅ Vertex AI Prediction 가용 (T4/L4 확인)
- **asia-northeast3 (서울)**: Vertex AI Prediction 가용하나 GPU 옵션 제한적

### 콜드스타트 예상 시간

| 구성 | 예상 시간 |
|------|----------|
| CPU, 소형 모델 | 10~30초 |
| CPU + T4 GPU, 중형 모델 | **60~120초** |
| CPU + L4 GPU, 928MB ONNX | **60~120초 (추정)** |
| CPU + A100 GPU, 대형 모델 | 2~5분 |

> BiRefNet 928MB + L4 GPU 기준 → **콜드스타트 1~2분 예상**. 첫 요청 429 → 재시도 필요.

### 머신타입 + GPU 결합 비용 (시간당)

| 구성 | 비용/hr |
|------|--------|
| n1-standard-4 + T4 | $0.219 + $0.40 = **$0.62/hr** |
| n1-standard-4 + L4 | $0.219 + $0.64 = **$0.86/hr** |
| e2-standard-4 + T4 | $0.154 + $0.40 = **$0.55/hr** |

---

## 3. 비용 시뮬레이션 — 하루 20건 산발 기준

### 전제
- 하루 20건, 월 600건
- 각 요청 처리 시간: ~3초 (BiRefNet 추론)
- 트래픽 패턴: 산발적 (10:00~22:00 사이 불규칙)
- 환율: $1 = ₩1,400

### 비교표

| 서빙 옵션 | 월 비용 (바우처 전) | 바우처 적용 | 콜드스타트 | 비고 |
|----------|-------------------|-----------|-----------|------|
| **RunPod Serverless** (현행) | **₩600~1,200/월** | ❌ 불가 | 2~3초 | ₩1~2/건, 웜 0.7초 |
| **Vertex AI Prediction L4** (scale-to-zero) | **₩18,000~36,000/월** | ❌ **불가** | 60~120초 | 활성화 시 $0.86/hr, 하루 1~2시간 |
| **Vertex AI Prediction T4** (scale-to-zero) | **₩12,000~25,000/월** | ❌ **불가** | 60~120초 | 활성화 시 $0.62/hr |
| **Vertex AI Prediction L4** (always-on 1레플리카) | **₩870,000/월** | ❌ **불가** | 없음 | $0.86×720hr, 과잉 |
| **Cloud Run GPU L4** | **₩420/활성화** × 활성화 횟수 | ❌ **불가** | 15분 유휴 테일 | 도쿄 미가용, 15분 테일 비효율 |

### Vertex AI scale-to-zero 산출 근거

```
하루 20건 → 20회 콜드스타트 또는 배칭 시 5~10회 활성화
각 활성화: 콜드스타트 2분 + 처리 1분 + 스케일다운 대기 ≈ 5~15분
하루 활성 시간: 약 0.5~2시간
월 활성 시간: 15~60시간
비용: 15hr × $0.86 = $12.9 ~ 60hr × $0.86 = $51.6
원화: ₩18,060 ~ ₩72,240
```

> ⚠️ 실제로는 자동 스케일다운 대기 시간(오토스케일러 판단)에 따라 비용 변동 큼. Vertex AI는 스케일다운까지 최소 10~15분 유휴 유지 가능.

---

## 4. 종합 판정

### 🔴 GenAI 바우처(₩147만) → BiRefNet 서빙 불가

GenAI 크레딧은 Gemini/Imagen 모델 API 추론 전용. Custom Container Prediction, GPU 가속기, Cloud Run GPU 모두 적용 대상 외.

### 🟡 Vertex AI Prediction — RunPod 대비 열위

| 비교 축 | Vertex AI (scale-to-zero) | RunPod Serverless (현행) |
|---------|--------------------------|------------------------|
| 월 비용 | ₩18,000~72,000 | **₩600~1,200** |
| 콜드스타트 | 60~120초 (429 에러) | **2~3초** |
| 웜 응답 | ~1초 | **0.7초** |
| UX 영향 | 🔴 첫 요청 실패+재시도 | ✅ 자연스러운 대기 |
| 리전 | 도쿄 ✅ | 글로벌 |
| 가격 대비 | **15~60배 비쌈** | 최저가 |

### ✅ 결론: RunPod Serverless 유지가 최적

1. **GenAI 바우처는 Gemini API에만 쓸 수 있으므로** Vertex AI/Cloud Run GPU 서빙에 전용 불가
2. **RunPod가 가격(₩1~2/건)·콜드스타트(2~3초)·안정성 모두 우위**
3. Vertex AI Prediction은 바우처 미적용 + 콜드스타트 1~2분 + 비용 15배 이상 → 전환 근거 없음
4. **GenAI 바우처(₩147만)는 현행 Gemini 2.5 Flash specs 생성 등에 소진하는 것이 최적**

---

## 부록: 바우처 활용 대안 제안

GenAI 크레딧이 Gemini/Imagen API에만 적용되므로, 아래 용도로 최대 소진 가능:

| 용도 | 예상 소진 | 비고 |
|------|----------|------|
| specs v2 AI 생성 (Gemini 2.5 Flash) | 현행 사용 중 | 나노바나나 ₩169/장 |
| 헤드샷 AI 생성 (Gemini) | 현행 사용 중 | |
| Imagen 4 배경 생성/편집 | 미사용 | 향후 specs 이미지 보강 가능 |
| Gemini 배치 번역 (specs 9개 언어) | 미사용 | 대량 번역 시 효율적 |

---

*조사 소스:*
- [GCP SKU Groups - GenAI Credit](https://cloud.google.com/skus/sku-groups/google-developer-program-premium-genai-credit)
- [Cloud Run GPUs SKU Group](https://cloud.google.com/skus/sku-groups/cloud-run-gpus)
- [Vertex AI Pricing Guide (nops.io)](https://www.nops.io/blog/vertex-ai-pricing/)
- [Vertex AI Scale-to-Zero Guide](https://oneuptime.com/blog/post/2026-02-17-how-to-enable-scale-to-zero-for-vertex-ai-prediction-endpoints-to-reduce-costs/view)
- [Cloud Run GPU Pricing](https://cloud.google.com/run/pricing)
