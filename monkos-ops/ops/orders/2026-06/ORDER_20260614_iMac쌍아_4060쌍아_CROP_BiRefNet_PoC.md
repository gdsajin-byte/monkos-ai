---
type: order
id: ORDER_20260614_iMac쌍아_4060쌍아_CROP_BiRefNet_PoC
date: 2026-06-14 16:29 KST
from: iMac/쌍아
to: 4060/쌍아
portfolio: PF_CROP
priority: P1
status: done
---

# BiRefNet 배경 제거 PoC — 4060 GPU 서버

> **[2026-06-14 16:29 KST] iMac/쌍아 → 4060/쌍아**
> 귀속: PF_CROP
> 배경: RMBG-2.0은 CC BY-NC(상업 불가). BiRefNet은 Apache 2.0(상업 무료) + 품질 2위.
> 기존 환경: 5/25 RMBG-2.0 시도 시 Python 3.10 venv + PyTorch CUDA 12.1 세팅 완료 (`apps/crop-app/benchmark/`)

---

## 목표

BiRefNet을 4060 GPU에 올려 배경 제거 품질·속도를 실측한다. specs 페이지 서비스 기능 편입 판단 근거.

---

## 작업 항목

### 1. 모델 다운로드 + 환경 세팅

- HuggingFace: `ZhengPeng7/BiRefNet` (Apache 2.0, gated 아님 — 즉시 다운 가능)
- 기존 RMBG venv 재활용 또는 별도 venv 생성
- 필요 패키지: `torch`, `torchvision`, `transformers`, `Pillow`, `flask`

### 2. 추론 서버 작성

- `birefnet_server.py` — Flask API, POST `/remove-bg` → 배경 제거된 PNG 반환
- 입력: 이미지 파일 (multipart)
- 출력: 배경 제거된 PNG (알파 채널)
- 위치: `apps/crop-app/benchmark/`

### 3. 테스트 페이지

- `birefnet-test.html` — 브라우저에서 이미지 업로드 → 서버 호출 → 결과 표시
- 기존 `rmbg2-test.html` 패턴 참고

### 4. 품질·속도 벤치마크

테스트 이미지 5종으로 실측:
- 증명사진 (정면, 단색 배경)
- 증명사진 (복잡한 배경)
- 머리카락 디테일 (곱슬/긴 머리)
- 안경 착용
- 저조도/그림자

측정 항목:
- 추론 시간 (초)
- 메모리 사용량 (VRAM)
- 출력 품질 (경계 깔끔함, 머리카락 보존)

---

## ⚠️ 준수 조항

- 라이선스 확인 필수: Apache 2.0인지 모델 카드에서 재확인
- 테스트 이미지는 자체 촬영 또는 CC0 — 고객 사진 사용 금지
- 4060 기존 서비스(ComfyUI/VTON)에 영향 없도록 별도 포트 사용

---

## 산출물

- `apps/crop-app/benchmark/birefnet_server.py`
- `apps/crop-app/benchmark/birefnet-test.html`
- 벤치마크 결과 보고서 (이미지 5종 × 추론 시간 + 품질 평가)
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
