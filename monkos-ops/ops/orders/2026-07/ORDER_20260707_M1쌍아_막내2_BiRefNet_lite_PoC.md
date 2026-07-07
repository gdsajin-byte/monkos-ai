---
type: order
id: ORDER_20260707_M1쌍아_막내2_BiRefNet_lite_PoC
date: 2026-07-07 14:57 KST
from: M1/쌍아
to: M1/막내2
portfolio: PF_CROP
priority: P2
status: 대기
---

# 지시서: BiRefNet-lite PoC — 경량 모델 품질·속도 실측

> **[2026-07-07 14:57 KST] M1/쌍아 → M1/막내2**
> 귀속: PF_CROP

---

## 배경

BiRefNet-portrait(928MB)을 프로덕션 채택 확정. 경량 변형 BiRefNet_lite(약 5배 작음, 4배 빠름)의 품질이 증명사진 용도에 충분한지 실측. 안드로이드 온디바이스·클라이언트 프리뷰(Phase 4) 후보 판단 근거.

---

## 작업

### 1. 모델 다운로드

HuggingFace에서 BiRefNet_lite ONNX 확보:
- `ZhengPeng7/BiRefNet_lite` — swin_v1_tiny 백본, 범용
- ONNX 변환이 없으면 PyTorch → ONNX 변환 (기존 poc-20260707/birefnet-poc.py 참조)

### 2. M1 로컬 실측

기존 PoC 환경(`apps/crop-app/benchmark/poc-20260707/venv`) 재활용.

**테스트 이미지 2장**:
- `/Users/macmini/Desktop/dawn-original.jpg` (흩날리는 머리카락 + 복잡 실내 배경)
- `/Users/macmini/Downloads/my_id_photo.jpg` (안경 + 실내 배경)

**측정 항목**:
- 모델 크기 (MB)
- 모델 로드 시간
- 추론 시간 (초)
- 메모리 사용량

### 3. 결과물 데스크탑 출력

각 테스트 이미지에 대해 흰배경 + 회색배경(#808080) 2벌씩, 총 4장:
- `/Users/macmini/Desktop/dawn_lite_white.png`
- `/Users/macmini/Desktop/dawn_lite_gray.png`
- `/Users/macmini/Desktop/idphoto_lite_white.png`
- `/Users/macmini/Desktop/idphoto_lite_gray.png`

기존 portrait 결과물(데스크탑에 이미 있음)과 나란히 비교할 수 있도록.

### 4. 품질 비교표

```markdown
| 항목 | BiRefNet-portrait | BiRefNet-lite |
|------|------------------|---------------|
| 모델 크기 | 928MB | ?MB |
| M1 CPU 추론 | 14.8초 | ?초 |
| 모델 로드 | 2.6초 | ?초 |
| 머리카락 경계 | 양호 | ? |
| 어깨/의복 | 정확 | ? |
| 안경 처리 | 양호 | ? |
| 배경 잔재 (회색 배경 기준) | 미세 | ? |
```

---

## ⚠️ 준수 조항

- 기존 venv·스크립트 재활용, 최소 코드
- ONNX 모델은 git 커밋 금지 (로컬 보관)
- 완료 보고: 수발신 헤더 필수, `✅❌💡⏳📁🔀` 형식
- PF_CROP 히스토리 1행 어펜드, 세션 로그 어펜드, 커밋 → 푸시
