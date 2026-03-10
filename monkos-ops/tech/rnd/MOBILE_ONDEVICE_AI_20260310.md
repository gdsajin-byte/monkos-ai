---
type: research
id: MOBILE_ONDEVICE_AI_20260310
date: 2026-03-10 17:41 KST
from: 쌍아
status: completed
category: ondevice-ai
tags: [mobile, on-device, LLM, image-gen, daemon, apple, samsung, pixel]
---

# 모바일 온디바이스 AI — 하드웨어 × 모델 호환 레퍼런스

**목적**: 배포 타겟 모바일 디바이스(2021~2025) 기준 온디바이스 AI 가능 범위 정의
**용도**: MONKOS 클라이언트 사이드 데몬 설계 및 배포 기준선 수립
**관련 문서**: `monkos-ops/tech/rnd/BENCHMARK_SCHEMA_4060.md`

---

## 테이블 1 — 하드웨어 스펙 (Apple)

| 디바이스 | 출시 | 칩 | NPU TOPS | RAM | Apple Intelligence |
|---------|------|-----|----------|-----|-------------------|
| iPhone 13 Pro | 2021 | A15 Bionic | 15.8 | 6GB | ❌ |
| iPhone 14 Pro | 2022 | A16 Bionic | 17 | 6GB | ❌ |
| iPhone 15 Pro | 2023 | A17 Pro | 35 | 8GB | ✅ 최소선 |
| iPhone 16 Pro | 2024 | A18 Pro | 35+ | 8GB | ✅ |
| iPhone 17 Pro | 2025 | A19 Pro | ~45 | 8GB | ✅ |
| iPad Pro (M2) | 2022 | M2 | 15.8 | 8-16GB | ❌ |
| iPad Pro (M4) | 2024 | M4 | 38 | 8-16GB | ✅ |

## 테이블 2 — 하드웨어 스펙 (Samsung / Qualcomm)

| 디바이스 | 출시 | 칩 | NPU TOPS | RAM | Galaxy AI |
|---------|------|-----|----------|-----|-----------|
| Galaxy S21 | 2021 | Snapdragon 888 | 26 | 8GB | ❌ |
| Galaxy S22 | 2022 | Snapdragon 8 Gen 1 | 27 | 8-12GB | ❌ |
| Galaxy S23 | 2023 | Snapdragon 8 Gen 2 | 36 | 8-12GB | 부분 |
| Galaxy S23 Ultra | 2023 | Snapdragon 8 Gen 2 | 36 | 12GB | 부분 |
| Galaxy S24 | 2024 | Snapdragon 8 Gen 3 | 45 | 8-12GB | ✅ |
| Galaxy S24 Ultra | 2024 | Snapdragon 8 Gen 3 | 45 | 12GB | ✅ |
| Galaxy S25 | 2025 | Snapdragon 8 Elite | 45+ | 12GB | ✅ |
| Galaxy S25 Ultra | 2025 | Snapdragon 8 Elite | 45+ | 12GB | ✅ |

## 테이블 3 — 하드웨어 스펙 (Google Pixel / Tensor)

| 디바이스 | 출시 | 칩 | NPU | RAM | Gemini Nano |
|---------|------|-----|-----|-----|-------------|
| Pixel 6 | 2021 | Tensor G1 | 6 TOPS | 8GB | ❌ |
| Pixel 6 Pro | 2021 | Tensor G1 | 6 TOPS | 12GB | ❌ |
| Pixel 7 | 2022 | Tensor G2 | 개선 | 8GB | ❌ |
| Pixel 7 Pro | 2022 | Tensor G2 | 개선 | 12GB | ❌ |
| Pixel 8 | 2023 | Tensor G3 | 개선 | 8GB | ❌ |
| Pixel 8 Pro | 2023 | Tensor G3 | 개선 | 12GB | ✅ Nano 1 |
| Pixel 9 | 2024 | Tensor G4 | 개선 | 12GB | ✅ Nano 2 |
| Pixel 9 Pro XL | 2024 | Tensor G4 | 개선 | 16GB | ✅ Nano 2 |

---

## 테이블 4 — 이미지 생성 온디바이스 가능 여부

> 기준: SD 1.5 (512×512, 20step) / Core ML 또는 ONNX Runtime Web
> ✅ 실용 | 🔶 가능하나 느림 | ❌ 불가

| 디바이스 | 배경제거 (~5MB) | SD 1.5 | SDXL (2GB+) | 비고 |
|---------|---------------|--------|------------|------|
| iPhone 13 Pro | ✅ | 🔶 ~60s | ❌ | 6GB RAM 한계 |
| iPhone 14 Pro | ✅ | 🔶 ~40s | ❌ | 6GB RAM 한계 |
| iPhone 15 Pro | ✅ | ✅ ~15s | 🔶 | Core ML 최적화. Apple Intelligence 최소선 |
| iPhone 16 Pro | ✅ | ✅ ~8s | ✅ | Image Playground 탑재 |
| iPhone 17 Pro | ✅ | ✅ ~5s | ✅ | |
| Galaxy S21 | ✅ | 🔶 ~50s | ❌ | |
| Galaxy S22 | ✅ | 🔶 ~35s | ❌ | |
| Galaxy S23 | ✅ | 🔶 ~25s | ❌ | |
| Galaxy S24 | ✅ | ✅ ~15s | 🔶 | Samsung AI 공식 지원 |
| Galaxy S25 | ✅ | ✅ ~8s | ✅ | |
| Pixel 8 Pro | ✅ | 🔶 ~35s | ❌ | Tensor GPU 미흡 |
| Pixel 9 Pro XL | ✅ | ✅ ~20s | 🔶 | 16GB RAM 강점 |

---

## 테이블 5 — LLM 온디바이스 가능 범위

> Q4 INT4 양자화 기준
> ✅ 실용 | 🔶 가능하나 느림 | ❌ VRAM/RAM 초과

| 디바이스 | RAM | 0.5B (Q4) | 1B (Q4) | 3B (Q4) | 7B (Q4) | 공식 온디바이스 LLM |
|---------|-----|-----------|---------|---------|---------|-------------------|
| iPhone 13 Pro | 6GB | ✅ | ✅ | 🔶 | ❌ | — |
| iPhone 14 Pro | 6GB | ✅ | ✅ | 🔶 | ❌ | — |
| iPhone 15 Pro | 8GB | ✅ | ✅ | ✅ | ❌ | Apple FM (~3B) |
| iPhone 16 Pro | 8GB | ✅ | ✅ | ✅ | ❌ | Apple FM |
| iPhone 17 Pro | 8GB | ✅ | ✅ | ✅ | ❌ | Apple FM |
| Galaxy S23 Ultra | 12GB | ✅ | ✅ | ✅ | 🔶 | — |
| Galaxy S24 | 8-12GB | ✅ | ✅ | ✅ | 🔶 12GB만 | Gemini Nano 1 (~1.8B) |
| Galaxy S25 | 12GB | ✅ | ✅ | ✅ | ✅ | Gemini Nano 2 (~3B) |
| Pixel 8 Pro | 12GB | ✅ | ✅ | ✅ | 🔶 | Gemini Nano 1 |
| Pixel 9 Pro XL | 16GB | ✅ | ✅ | ✅ | ✅ | Gemini Nano 2 |

---

## 테이블 6 — 초소형 데몬 모델 × 디바이스 호환

> 용도별 최소 크기 모델. 브라우저(WASM/WebGPU) 기준.

| 모델 | 크기 | 용도 | 최소 지원 디바이스 | 프레임워크 | 한국어 |
|------|------|------|-----------------|-----------|--------|
| BlazeFace | 200KB | 얼굴 감지 | iPhone 12 / S20 이상 | MediaPipe | N/A |
| MediaPipe Face Mesh | 2MB | 얼굴 468 랜드마크 | iPhone 12 / S20 이상 | MediaPipe | N/A |
| u2netp | 4.3MB | 배경 제거 | iPhone 12 / S20 이상 | ONNX Runtime | N/A |
| MODNet-p | 6MB | 배경 제거 (정밀) | iPhone 12 / S20 이상 | ONNX Runtime | N/A |
| MobileNetV3-Small | 7MB | 이미지 분류 (화질/표정) | iPhone 12 / S20 이상 | ONNX / TF.js | N/A |
| YOLOv8n-face | 6MB | 얼굴+각도 감지 | iPhone 12 / S20 이상 | ONNX Runtime | N/A |
| SmolVLM 256M | ~500MB | 비전+언어 최소 | iPhone 14 Pro / S23 이상 | Transformers.js | 미흡 |
| SmolLM 135M | ~270MB | 최소 LLM | iPhone 13 / S22 이상 | Transformers.js | 미흡 |
| Qwen2.5 0.5B | ~400MB | 한국어 최소 실용선 | iPhone 13 / S22 이상 | ONNX / Transformers.js | ✅ 양호 |
| Llama 3.2 1B | ~800MB | 범용 1B | iPhone 15 Pro / S23 Ultra 이상 | llama.cpp WASM | 보통 |
| Gemma 3 1B | ~800MB | 범용 1B (한국어 양호) | iPhone 15 Pro / S23 Ultra 이상 | ONNX | ✅ 양호 |

---

## MONKOS 배포 기준선 권고

### 최소 지원선 (전 기능 사용 가능)
```
Apple  : iPhone 15 Pro (2023, A17 Pro, 8GB)
Android: Galaxy S24 (2024, SD 8 Gen 3, 8GB)
```
이 라인 이상에서 1B 데몬 + 배경 처리 + 기본 검수 **완전 온디바이스 커버** 가능.

### 경량 지원선 (배경제거+룰기반 검수만)
```
Apple  : iPhone 13 (2021~)
Android: Galaxy S21 (2021~)
```
JS 룰 기반 + u2netp(4.3MB) → 서버 왕복 없이 기본 QC 처리 가능.

### 풀 온디바이스선 (7B급, 서버리스 완전 대체)
```
Apple  : iPad Pro M4 / iPhone 17 Pro
Android: Galaxy S25 Ultra / Pixel 9 Pro XL (16GB)
```

---

## 기술 스택 요약

| 레이어 | 라이브러리 | 비고 |
|--------|-----------|------|
| 추론 엔진 | ONNX Runtime Web | WebGPU 백엔드, 범용 |
| LLM | Transformers.js | HuggingFace, WASM/WebGPU |
| Vision | MediaPipe Tasks | Google 공식, iOS 안정 |
| LLM 네이티브 | llama.cpp WASM | 1B+ 대용량 모델 |
| 캐싱 | Service Worker + IndexedDB | SW 50MB 한계 → IndexedDB 우회 필수 |

---

*생성: 2026-03-10 4060/쌍아*
