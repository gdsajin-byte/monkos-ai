---
type: spec
date: 2026-07-07
device: iMac
agent: 민아
portfolio: PF_CROP
status: 운영
---

# 배경제거 엔진 테스트 기반 (2026-07-07 완성)

> 작가님 지시: "테스트 기반을 완성해두거라" — 휴무일 M1/4060(집) 승계용.
> 목표: 웹 본진에 IDPASS급 배경제거 — "코드는 우리가, 연산은 각자 디바이스에서"

## 1. 실측 판정 현황 (전부 완료 — 재실험 불요)

| 실측 | 주체·일자 | 결과 |
|------|----------|------|
| BiRefNet 4060 GPU | 쌍아 06/14 | **0.829s/장, VRAM 3,197MB(39%)**, 경계 깔끔·머리카락 우수 |
| RMBG-2.0 A/B | 쌍아 06/14 | 품질 동급·속도 7%↑, **라이선스로 BiRefNet 승** (RMBG=CC BY-NC 비상업 — "기각"의 실체) |
| 대안 6종 리서치 | 막내1 06/14 | BiRefNet 최적 확인, 프로덕션 표준 = BiRefNet+ViTMatte 2단 권고 |
| **애플 비전 직접 대조** | 민아 07/07 | **BiRefNet ≈ 애플 비전** (잔머리 올 단위 대등, 둘 다 원본 픽셀 보존). 대조 이미지: GDrive |
| CPU 하한 | 민아 07/07 | 구형 인텔 iMac ONNX 19.4s/장 (모델로드 6s 별도) — 온디바이스 실현성 하한 |

## 2. 파일 위치 (다운로드 완료분)

| 파일 | 위치 | 비고 |
|------|------|------|
| BiRefNet-portrait ONNX (972MB) | GDrive `CROP APP/POC_20260707_BiRefNet/` (업로드 중) + iMac 세션 스크래치 | 재다운로드: `https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-portrait-epoch_150.onnx` |
| BiRefNet PyTorch (쌍아 06/14) | 4060 HF 캐시 (`ZhengPeng7/BiRefNet`) | 4060 기동 시 즉시 사용 가능 |
| 비교 이미지·테스트 원본 | GDrive `CROP APP/POC_20260707_BiRefNet/` | poc-compare.jpg = 4엔진 판정본 |
| 서버·테스트 UI (쌍아 06/14) | 레포 `apps/crop-app/benchmark/` | birefnet_server.py, compare-test.html 등 |

## 3. 실행법 (디바이스별)

### M1 (Apple Silicon — 집)
```bash
# 애플 비전 (아이폰과 동일 API, 네이티브)
swiftc apple-vision-poc.swift -o apple-poc && ./apple-poc <입력.jpg> <출력.png>

# BiRefNet ONNX (M1 CPU — 인텔 iMac보다 수 배 빠를 것, 실측 요망)
python3 -m venv venv && venv/bin/pip install onnxruntime pillow numpy
venv/bin/python birefnet-poc.py <입력> <출력.png> <모델.onnx>
```

### 4060 (집 이전 완료, 07:00 현재 오프라인 — 전원 인가 후)
```bash
ssh 4060   # Tailscale 100.118.31.62 (iMac ~/.ssh/config 등록됨)
# 쌍아 06/14 환경 그대로: apps/crop-app/benchmark/birefnet_server.py (Flask, PyTorch CUDA)
# 점검 항목: ① tailscale 온라인 ② nvidia-smi ③ HF 캐시 모델 존재 ④ birefnet_server 기동 → compare-test.html
```

### iMac (사무실 — 검증 완료 상태)
- 스크립트 2종 본 폴더. venv는 세션 스크래치(휘발) — 재생성 1분.

## 4. 다음 단계 (설계서 골격 — 작가님 방향 확정분)

```
[손님 디바이스] 감지(FaceMesh 3MB)·크롭 미리보기·경량 매팅 프리뷰 — 결제 전 전 과정, 연산 무료
[결제 후 서버] BiRefNet 정본 매팅 + 배경색 합성(유색 16국 개방) + 우리 크롭 수학 — 4060 초기 → 클라우드 GPU 승격
[Gemini] 보정 트랙(헤드샷)·폴백 전용으로 재배치
```
- 파이프라인 순서 = IDPASS 이식: 원본 감지 → 크롭 → 매팅 (재생성 없음, 원본 픽셀 보존 = 정체성 제1원칙)
- 온디바이스 지향(작가님): 폰·노트북 연산력 > 구형 iMac 실증 — 프리뷰 전량 클라이언트
