---
type: order
id: ORDER_20260707_M1쌍아_막내_VertexAI_매팅서빙_바우처검증
date: 2026-07-07 14:34 KST
from: M1/쌍아
to: 막내
portfolio: PF_SPECS
priority: P1
status: 대기
---

# 지시서: Vertex AI Prediction — BiRefNet 매팅 서빙 + GenAI 바우처 적용 검증

> **[2026-07-07 14:34 KST] M1/쌍아 → 막내**
> 귀속: PF_SPECS

---

## 배경

BiRefNet-portrait ONNX(928MB) 매팅 서빙을 위한 인프라 비용 최적화. Cloud Run GPU L4는 15분 유휴 테일(₩420/활성화)로 산발 트래픽에 비효율. RunPod Serverless는 저렴하나 GPU 풀 재고 변수 있음. **Vertex AI Prediction이 GenAI 바우처(₩147만)로 커버되면 실비 ₩0 서빙이 가능.**

---

## 조사 항목

### 1. GenAI 바우처 적용 범위 확인

- GCP 콘솔 → Billing → Credits에서 GenAI 크레딧(₩147만)의 **적용 SKU 목록** 확인
- Vertex AI Prediction (Custom Container) SKU가 포함되는지 확인
- GPU 사용 시 SKU (aiplatform.googleapis.com/prediction/nvidia-l4 등)도 포함되는지
- **Cloud Run GPU SKU**도 같이 확인 — 혹시 커버되면 L4 경로가 부활

### 2. Vertex AI Prediction 서빙 구조 조사

- 커스텀 컨테이너(Docker) 배포 가능 여부 — ONNX + Python Flask/FastAPI
- **scale-to-zero 지원 여부** + 유휴 테일 시간 (몇 분?)
- GPU 옵션 (T4/L4) + 서울/도쿄 리전 가용성
- 콜드스타트 예상 시간
- 가격 구조 (시간당/건당/노드시간당)

### 3. 비용 시뮬레이션

- 하루 20건 산발 기준 월 비용 (바우처 적용 전/후)
- Cloud Run L4·RunPod Serverless와 비교표

---

## 산출물

**리서치 보고서**: `REPORT_20260707_막내_VertexAI_매팅서빙_바우처검증.md`

---

## ⚠️ 준수 조항

- 코드 작성·실행 없음 — 조사·비교·보고만
- 바우처 SKU는 GCP 콘솔에서 실측 확인 (문서 추정 금지)
- 완료 보고: 수발신 헤더 필수, `✅❌💡⏳📁🔀` 형식
- PF_SPECS 히스토리 1행 어펜드, 세션 로그 어펜드, 커밋 → 푸시
