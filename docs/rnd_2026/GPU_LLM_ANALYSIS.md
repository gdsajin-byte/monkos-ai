# 오픈소스 LLM × GPU 하드웨어 분석 시트

**작성일:** 2026-02-19
**목적:** 자체 AI 인프라 구축을 위한 모델-하드웨어 매칭 분석

---

## 1. 하드웨어 스펙 비교

| 항목 | On-Device (iPhone) | RTX 4060 | RTX 5090 | RTX 5090 ×2 |
|------|-------------------|----------|----------|-------------|
| **메모리** | 6~8GB (통합) | 8GB GDDR6 | 32GB GDDR7 | 64GB (비풀링) |
| **대역폭** | ~50-90 GB/s | 272 GB/s | 1,792 GB/s | 3,584 GB/s |
| **TDP** | ~5W | 115W | 575W | 1,150W |
| **실매가 (2026.02)** | — | ~40만원 | ~400만원+ | ~800만원+ |
| **인터커넥트** | — | PCIe 4.0 | PCIe 5.0 | PCIe 5.0 (NVLink 없음) |
| **비고** | NPU 활용 가능 | 8GB 벽 | 4060 대비 6.6배 대역폭 | DeepSpeed/Ray로 분산 |

---

## 2. 모델 VRAM 요구량 (모드별)

| 모델 규모 | 대표 모델 | 추론 (Q4) | 추론 (FP16) | QLoRA 4bit | LoRA FP16 | 풀 FT (FP16) |
|-----------|----------|-----------|------------|------------|-----------|-------------|
| **2B** | Gemma 3 2B, SmolLM2 1.7B | ~1.5GB | ~4GB | ~2.5GB | ~5GB | ~20GB |
| **3~4B** | Phi-4 Mini 3.8B, Llama 3.2 3B, Gemma 3n 4B | ~2.5GB | ~8GB | ~4GB | ~8GB | ~35GB |
| **7~8B** | Llama 3.1 8B, Qwen 2.5 7B, Mistral 7B, DeepSeek R1 8B | ~5GB | ~16GB | ~5GB | ~15GB | ~67GB |
| **12~14B** | Gemma 3 12B, Qwen 2.5 14B | ~8.5GB | ~28GB | ~9GB | ~28GB | ~125GB |
| **30B** | Qwen 3 30B A3B (MoE) | ~20GB | ~60GB | ~20GB | ~63GB | ~288GB |
| **70B** | Llama 3.3 70B, DeepSeek R1 70B | ~40GB | ~140GB | ~46GB | ~146GB | ~672GB |

---

## 3. 핵심 매트릭스: 모델 × 하드웨어 × 모드

### 범례
- ✅ 쾌적 동작 (VRAM 여유, 실용 속도)
- ⚠️ 가능하나 제약 (느림, 빡빡함, RAM 오프로드)
- ❌ 불가 (OOM 또는 비실용적)
- 🔥 최적 가성비 구간

### A. 추론 (Inference — Q4 양자화)

| 모델 | On-Device | RTX 4060 (8GB) | RTX 5090 (32GB) | RTX 5090 ×2 (64GB) |
|------|-----------|---------------|-----------------|---------------------|
| **2B** | ✅ 10-20 tok/s (NPU) | ✅ 80+ tok/s | ✅ 150+ tok/s | ✅ (과잉) |
| **3~4B** | ⚠️ 5-15 tok/s | ✅ 60+ tok/s 🔥 | ✅ 120+ tok/s | ✅ (과잉) |
| **7~8B** | ⚠️ 2-5 tok/s | ✅ 40+ tok/s 🔥 | ✅ 100+ tok/s 🔥 | ✅ (과잉) |
| **12~14B** | ❌ OOM | ⚠️ 8-15 tok/s (빡빡) | ✅ 60+ tok/s 🔥 | ✅ (과잉) |
| **30B** | ❌ | ❌ OOM | ⚠️ 35+ tok/s (빡빡) | ✅ 50+ tok/s 🔥 |
| **70B** | ❌ | ❌ | ❌ OOM (40GB>32GB) | ⚠️ 15-25 tok/s |

### B. 파인튜닝 (QLoRA 4-bit)

| 모델 | On-Device | RTX 4060 (8GB) | RTX 5090 (32GB) | RTX 5090 ×2 (64GB) |
|------|-----------|---------------|-----------------|---------------------|
| **2B** | ❌ | ✅ 여유 | ✅ (과잉) | ✅ (과잉) |
| **3~4B** | ❌ | ✅ 여유 🔥 | ✅ (과잉) | ✅ (과잉) |
| **7~8B** | ❌ | ⚠️ 가능 (5GB, 빡빡) | ✅ 여유 🔥 | ✅ (과잉) |
| **12~14B** | ❌ | ❌ OOM (9GB>8GB) | ✅ 여유 🔥 | ✅ (과잉) |
| **30B** | ❌ | ❌ | ⚠️ 가능 (20GB) | ✅ 여유 🔥 |
| **70B** | ❌ | ❌ | ❌ OOM (46GB>32GB) | ⚠️ 가능 (분산) |

### C. 풀 ML 트레이닝 (Full Fine-Tuning FP16)

| 모델 | On-Device | RTX 4060 (8GB) | RTX 5090 (32GB) | RTX 5090 ×2 (64GB) |
|------|-----------|---------------|-----------------|---------------------|
| **2B** | ❌ | ❌ (20GB>8GB) | ✅ 여유 🔥 | ✅ (과잉) |
| **3~4B** | ❌ | ❌ | ⚠️ 가능 (35GB≈32GB) | ✅ 여유 🔥 |
| **7~8B** | ❌ | ❌ | ❌ (67GB>32GB) | ⚠️ 분산 가능 |
| **12~14B** | ❌ | ❌ | ❌ | ❌ (125GB>64GB) |
| **30B** | ❌ | ❌ | ❌ | ❌ |
| **70B** | ❌ | ❌ | ❌ | ❌ |

---

## 4. 하드웨어별 최적 운용 전략

### RTX 4060 (현재 보유)
```
추론 마지노선: 7~8B (Q4) — 40+ tok/s 쾌적
파인튜닝 한계: 7B QLoRA 겨우 가능 (5GB/8GB)
풀 트레이닝: 불가
최적 모델: Qwen 2.5 7B, Phi-4 Mini 3.8B, Gemma 3 4B
용도: 경량 챗봇 추론, 프로토타입 테스트
```

### RTX 5090 (단일)
```
추론 스위트스팟: 12~14B (Q4) — 60+ tok/s
파인튜닝 스위트스팟: 12~14B QLoRA — 32GB 여유
풀 트레이닝: 2~3B까지만 (20~35GB)
최적 모델: Gemma 3 12B, Qwen 2.5 14B
용도: 프로덕션급 추론 + 중형 모델 커스터마이징
```

### RTX 5090 ×2 (듀얼)
```
추론: 30B 쾌적, 70B도 분산 가능
파인튜닝: 30B QLoRA 여유, 70B 분산 가능
풀 트레이닝: 3~4B까지 (7B는 분산으로 빠듯)
최적 모델: Qwen 3 30B, Llama 3.3 70B (추론), DeepSeek R1 70B
용도: 대형 모델 자체 호스팅 + 30B급 커스터마이징
주의: NVLink 미지원 → PCIe 병목, DeepSpeed 필수
```

---

## 5. 2026 추천 모델 (용도별)

| 용도 | 추천 모델 | 크기 | 비고 |
|------|----------|------|------|
| **온디바이스 (모바일)** | Gemma 3n 2B/4B | 2~4B | Google 공식 모바일 최적화 |
| **경량 챗봇** | Phi-4 Mini 3.8B | 3.8B | 4060 쾌적 |
| **범용 어시스턴트** | Qwen 2.5 7B | 7B | 4060 마지노, 벤치마크 상위 |
| **코딩 특화** | DeepSeek R1 Distill 8B | 8B | 코딩 벤치마크 최상위 |
| **고품질 추론** | Gemma 3 12B | 12B | 5090 최적 구간 |
| **프로덕션 어시스턴트** | Qwen 3 30B A3B | 30B MoE | 5090×2 최적 |
| **최고 성능** | Llama 3.3 70B | 70B | 5090×2 추론 가능 |
| **추론 특화 (수학/논리)** | DeepSeek R1 Distill 70B | 70B | 5090×2, R1 수준 추론 |

---

## 6. 투자 판단 요약

| 시나리오 | 투자 | 가능 범위 | ROI 판단 |
|---------|------|----------|---------|
| **현상 유지 (4060)** | 0원 | 7B 추론 전용 | API 비용이 더 싸면 유지 |
| **5090 단일 추가** | ~400만원+ | 14B 추론+QLoRA | 자체 모델 커스터마이징 필요 시 |
| **5090 듀얼** | ~800만원+ | 70B 추론, 30B QLoRA | 프로덕션 자체 호스팅 목표 시 |
| **클라우드 대안** | 시간당 과금 | 무제한 | 간헐적 사용 시 가성비 최고 |

**핵심:** 상시 추론 서빙이 아니면 **Claude/Gemini API가 가성비 우위**. 자체 호스팅은 (1)데이터 프라이버시 (2)커스텀 파인튜닝 (3)상시 서빙 비용 절감 — 이 3가지 중 하나가 확실할 때만 정당화됨.

---

## Sources
- [RTX 5090 공식 스펙 (NVIDIA)](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/)
- [RTX 5090 실매가/리뷰 (Wccftech)](https://wccftech.com/roundup/nvidia-geforce-rtx-5090/)
- [5090 vs H100 벤치마크 (DatabaseMart)](https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx5090-2)
- [5090 듀얼 테스트 (Hostkey)](https://hostkey.com/blog/83-more-5090-more-problems-testing-a-dual-nvidia-gpu-setup/)
- [5090 NVLink 미지원 (Level1Techs)](https://forum.level1techs.com/t/rtx-5090-nvlink/226161)
- [LLM 파인튜닝 VRAM 가이드 (Modal)](https://modal.com/blog/how-much-vram-need-fine-tuning)
- [QLoRA/LoRA VRAM 요구량 (RunPod)](https://www.runpod.io/blog/llm-fine-tuning-gpu-guide)
- [2026 오픈소스 LLM 랭킹 (WhatLLM)](https://whatllm.org/blog/best-open-source-models-february-2026)
- [온디바이스 LLM 현황 (Edge AI Vision)](https://www.edge-ai-vision.com/2026/01/on-device-llms-in-2026-what-changed-what-matters-whats-next/)
- [모바일 LLM 가이드 (SiliconFlow)](https://www.siliconflow.com/articles/en/best-small-llms-for-edge-devices)
- [RTX 4060 벤치마크 (DatabaseMart)](https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx4060)
