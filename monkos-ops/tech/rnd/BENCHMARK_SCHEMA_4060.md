---
type: research
id: BENCHMARK_SCHEMA_4060
date: 2026-03-08 12:00 KST
from: 쌍아
status: in_progress
tags: [benchmark, 4060, SDXL, LLM, video, 5090]
---

# AI 모델 벤치마크 스키마 — 4060 Factory

**목적**: MONKOS 서비스 적합 오픈소스 모델 선정 + 5090 도입 근거 데이터 축적
**관리**: 4060/막내 → 테스트 실행 후 이 문서에 데이터 채움
**산출물 경로**: `AI_Factory/test_outputs/{category}/{model_name}/`

---

## 하드웨어 3-Tier

| Tier | 장비 | VRAM | 상태 | 특징 |
|------|------|------|------|------|
| **T1** | RTX 4060 | 8GB GDDR6 | ✅ 보유 | 실험 기지. 한계가 곧 5090 도입 근거 |
| **T2** | RTX 5090 | 32GB GDDR7 | 🔜 도입 검토 | T1 한계 돌파. 14B 추론·파인튜닝 |
| **T3** | GCS VM (A100/H100) | 40~80GB HBM | ☁️ 쿼터 확보 후 | Llama4·FLUX 전체, 대형 학습 |

---

## 스키마 1: 이미지 생성 모델

### 평가 필드 정의

| 필드 | 설명 | 단위/척도 |
|------|------|----------|
| `arch` | 아키텍처 계열 | SDXL / DiT(FLUX) / SD1.5 / 기타 |
| `identity` | 모델 정체성·특기 | 텍스트 1줄 |
| `vram_min` | 최소 VRAM (기본 설정) | GB |
| `t1_feasible` | 4060(8GB) 동작 여부 | ✅ / ⚠️빡빡 / ❌불가 |
| `t2_feasible` | 5090(32GB) 동작 여부 | ✅ / ⚠️ / ❌ |
| `t3_feasible` | Cloud VM 필요 여부 | ✅필요 / 불필요 |
| `default_res` | 기본 생성 해상도 | px (예: 1024×1024) |
| `max_res_t1` | 4060에서 가능한 최대 해상도 | px |
| `speed_t1` | 4060 생성 속도 (30step DPM++ 기준) | 초/장 |
| `realism` | 실사 수준 | ★1~5 |
| `artifact_face` | 얼굴 아티팩팅 | ★1~5 (5=아티팩트 없음) |
| `artifact_hand` | 손 아티팩팅 | ★1~5 |
| `artifact_text` | 텍스트 렌더링 | ★1~5 |
| `kbeauty_fit` | K-Beauty 피부·얼굴 적합도 | ★1~5 |
| `output_size` | 기본 해상도 출력 파일 크기 | MB (PNG/WEBP) |
| `lora_support` | LoRA 학습·적용 지원 | ✅ / ❌ |
| `finetune_t1` | 4060에서 QLoRA/파인튜닝 가능 | ✅ / ⚠️ / ❌ |
| `monkos_role` | MONKOS 프로젝트 내 역할 후보 | SOSO/MINA/증명사진/범용/실험 |
| `civitai_url` | CivitAI 링크 | URL |
| `notes` | 기술적 특이사항 | 텍스트 |

### 이미지 생성 모델 테이블

| 모델 | arch | identity | vram_min | t1 | t2 | default_res | speed_t1 | realism | artifact_face | artifact_hand | kbeauty_fit | output_size | lora | ft_t1 | monkos_role |
|------|------|----------|----------|----|----|-------------|----------|---------|---------------|---------------|-------------|-------------|------|-------|-------------|
| **Juggernaut XL** | SDXL | 범용 실사, 드라마틱 조명 | 6GB | ✅ | ✅ | 1024×1024 | ~25s | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ~2.5MB | ✅ | ⚠️ | 범용/실험 |
| **HelloWorld XL v7** | SDXL | 동양인 특화, K-Beauty 수분광 | 6.5GB | ✅ | ✅ | 1024×1024 | ~25s | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★★★ | ~2.5MB | ✅ | ⚠️ | SOSO/MINA |
| **RealVisXL v5** | SDXL | 극사실 RAW사진, AI티 없음 | 6.5GB | ✅ | ✅ | 1024×1024 | ~25s | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ~3MB | ✅ | ⚠️ | 증명사진 |
| **FLUX.1-schnell** | DiT | 빠른 추론, 범용 고품질 | 8GB | ⚠️ | ✅ | 1024×1024 | ? | ? | ? | ? | ? | ? | ⚠️ | 미측정 |
| **FLUX.1-dev** | DiT | 고품질, 프롬프트 충실도 높음 | 12GB | ❌ | ✅ | 1024×1024 | — | ? | ? | ? | ? | ? | ✅ | T2 이후 |
| **Pony Diffusion v6** | SDXL | 애니/반실사, 표현력 극강 | 6.5GB | ✅ | ✅ | 1024×1024 | ? | ? | ? | ? | ? | ? | ✅ | ⚠️ | 실험 |
| **CyberRealistic XL** | SDXL | 아시아 실사, 사진관 스타일 | 6GB | ✅ | ✅ | 1024×1024 | ? | ? | ? | ? | ? | ? | ✅ | ⚠️ | 증명사진/MINA 후보 |
| **Illustrious XL** | SDXL | 고품질 일러스트, 아시아 스타일 | 6.5GB | ✅ | ✅ | 1024×1024 | ? | ? | ? | ? | ? | ? | ✅ | ⚠️ | 실험 |
| **FLUX.1 Kontext** | DiT | I2I 레이아웃 보존, 편집 특화 | 16GB | ❌ | ✅ | — | — | ? | ? | ? | ? | ? | — | T2 이후 |
| **SD 3.5 Large** | DiT | 텍스트 렌더링 최강, 범용 | 13GB | ❌ | ✅ | 1024×1024 | — | ? | ? | ? | ? | ? | ⚠️ | T2 이후 |
| **Llama 3.2 Vision (I2I)** | LLM | 이미지→텍스트, QC 분석 용도 | 6GB | ✅ | ✅ | — | — | — | — | — | — | — | — | QC/분석 |

> **측정 완료**: Juggernaut / HelloWorld / RealVis (2026-01-29, `AI_Factory/test_outputs/model_compare/`)
> **미측정 항목**: `?` — 4060 막내 순차 테스트 대상

---

## 스키마 2: 영상 생성 모델

### 평가 필드 정의

| 필드 | 설명 | 단위/척도 |
|------|------|----------|
| `arch` | 아키텍처 | DiT / U-Net / 기타 |
| `identity` | 특기 | 텍스트 |
| `vram_min` | 최소 VRAM | GB |
| `t1_feasible` | 4060 동작 | ✅/⚠️/❌ |
| `max_res_t1` | 4060 최대 해상도 | px |
| `max_frames_t1` | 4060 최대 프레임 수 | frames |
| `fps` | 출력 FPS | fps |
| `speed_t1` | 4060 생성 시간 (기본 설정) | 초 |
| `realism` | 실사 수준 | ★1~5 |
| `motion_quality` | 모션 자연스러움 | ★1~5 |
| `artifact_level` | 아티팩팅 정도 | ★1~5 (5=없음) |
| `output_size` | 기본 출력 파일 크기 | MB (MP4) |
| `monkos_role` | 용도 후보 | 룩북영상/포트폴리오/실험 |
| `notes` | 특이사항 | 텍스트 |

### 영상 생성 모델 테이블

| 모델 | arch | identity | vram_min | t1 | max_res_t1 | max_frames_t1 | fps | speed_t1 | realism | motion | artifact | output_size | monkos_role |
|------|------|----------|----------|----|---------|----|-----|----------|---------|--------|----------|-------------|-------------|
| **AnimateDiff v3** | U-Net | SDXL 기반 애니메이션, LoRA 호환 | 8GB | ⚠️ | 512×512 | 24f | 8 | ? | ? | ? | ? | ? | 실험 |
| **CogVideoX-2B** | DiT | 텍스트→영상, 경량 | 6GB | ✅ | 480×720 | 49f | 8 | ? | ? | ? | ? | ? | 실험 |
| **Wan2.1-T2V-1.3B** | DiT | 경량 T2V, 빠른 추론 | 8GB | ⚠️ | 480×832 | 81f | 16 | ? | ? | ? | ? | ? | 실험 |
| **LTX-Video 0.9.7** | DiT | 실시간급 속도, 고품질 | 8GB | ⚠️ | 768×512 | 121f | 24 | ? | ? | ? | ? | ? | 실험 |
| **HunyuanVideo** | DiT | 최고 품질 T2V | 24GB | ❌ | — | — | — | — | ? | ? | ? | ? | T2 이후 |
| **Wan2.1-T2V-14B** | DiT | 고품질 T2V | 16GB | ❌ | — | — | — | — | ? | ? | ? | ? | T2 이후 |
| **CogVideoX-5B** | DiT | 고품질 T2V | 12GB | ❌ | — | — | — | — | ? | ? | ? | ? | T2 이후 |
| **Sora급 (OpenAI/Google)** | — | SOTA T2V | 클라우드 | ❌ | — | — | — | — | — | — | — | — | T3 비교 기준 |

---

## 스키마 3: LLM

### 평가 필드 정의

| 필드 | 설명 | 단위/척도 |
|------|------|----------|
| `arch` | 아키텍처 | Dense / MoE |
| `params` | 파라미터 수 | B |
| `identity` | 특기 | 텍스트 |
| `quant` | 권장 양자화 | Q4_K_M / Q5 / FP16 |
| `vram_q4` | Q4 추론 VRAM | GB |
| `t1_feasible` | 4060 추론 가능 | ✅/⚠️/❌ |
| `speed_t1` | 4060 추론 속도 | tok/s |
| `context_len` | 컨텍스트 길이 | K tokens |
| `korean_quality` | 한국어 품질 | ★1~5 |
| `reasoning` | 추론·논리 능력 | ★1~5 |
| `coding` | 코딩 능력 | ★1~5 |
| `qlora_t1` | 4060 QLoRA 가능 | ✅/⚠️/❌ |
| `qlora_t2` | 5090 QLoRA 가능 | ✅/⚠️/❌ |
| `monkos_role` | 용도 후보 | 챗봇/코칭/분류/실험 |
| `notes` | 특이사항 | 텍스트 |

### LLM 모델 테이블

| 모델 | params | identity | quant | vram_q4 | t1 | speed_t1 | ctx | ko | reasoning | coding | qlora_t1 | qlora_t2 | monkos_role |
|------|--------|----------|-------|---------|----|----------|-----|----|-----------|--------|----------|----------|-------------|
| **Phi-4 Mini** | 3.8B | MS 경량 추론, 코딩 강함 | Q4_K_M | ~2.5GB | ✅ | ? | 16K | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ✅ | ✅ | 챗봇/실험 |
| **Gemma 3 4B** | 4B | Google 경량, 다국어 | Q4_K_M | ~3GB | ✅ | ? | 128K | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ✅ | ✅ | 챗봇/코칭 |
| **Qwen 2.5 7B** | 7B | 중국계 최강 7B, 한국어 우수 | Q4_K_M | ~5GB | ✅ | ? | 128K | ★★★★☆ | ★★★★☆ | ★★★★☆ | ⚠️ | ✅ | 챗봇/코칭 |
| **Llama 3.1 8B** | 8B | Meta 범용, 영어 최강 | Q4_K_M | ~5GB | ✅ | ? | 128K | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ⚠️ | ✅ | 실험 |
| **DeepSeek R1 8B** | 8B | 추론 특화, 코딩 벤치 최상위 | Q4_K_M | ~5GB | ✅ | ? | 128K | ★★★☆☆ | ★★★★★ | ★★★★★ | ⚠️ | ✅ | 코딩/분류 |
| **Mistral 7B** | 7B | 범용 균형형 | Q4_K_M | ~5GB | ✅ | ? | 32K | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ⚠️ | ✅ | 실험 |
| **Gemma 3 12B** | 12B | 5090 스위트스팟, 고품질 | Q4_K_M | ~8.5GB | ⚠️ | ? | 128K | ★★★★★ | ★★★★☆ | ★★★★☆ | ❌ | ✅ | T2 이후 |
| **Qwen 2.5 14B** | 14B | 7B 대비 대폭 향상 | Q4_K_M | ~9GB | ❌ | — | 128K | ★★★★★ | ★★★★★ | ★★★★★ | ❌ | ✅ | T2 이후 |
| **Llama 4 Scout (T3)** | 17B MoE | Meta 최신, 멀티모달 | FP16 | 클라우드 | ❌ | — | 10M | ? | ? | ? | ❌ | ❌ | T3 기준점 |
| **Qwen 3 30B MoE** | 30B | MoE 효율, 5090×2 최적 | Q4_K_M | ~20GB | ❌ | — | 128K | ★★★★★ | ★★★★★ | ★★★★★ | ❌ | ⚠️ | T2 이후 |

---

## 데이터 수집 프로토콜

### 이미지 생성 표준 테스트 프롬프트 세트 (4종)

```
# P1: K-Beauty 기본
Korean woman, natural beauty, soft lighting, clean skin, looking at camera,
neutral expression, professional photo
negative: bad quality, distorted, western face, oily skin

# P2: 룩북 패션 (SOSO)
Korean fashion model, trendy outfit, lookbook photography,
soft natural lighting, full body shot, modern K-fashion style

# P3: 증명사진 (몽크사진관)
passport photo, Korean person, neutral expression, white background,
front facing, professional, ID photo, natural

# P4: 모델 포트폴리오 (MINA)
Korean model, professional headshot, agency portfolio,
natural expression, clean composition, high quality
```

### 표준 생성 설정 (재현성 확보)

```yaml
steps: 30
cfg_scale: 7.0
sampler: DPM++ 2M Karras
resolution: 1024x1024
batch_size: 1
seed: 42  # 동일 시드로 모델 간 비교
```

### 파일 네이밍

```
AI_Factory/test_outputs/{category}/{model_name}/{model}_{prompt_id}_{YYYYMMDD}_{HHMMSS}.png
예: AI_Factory/test_outputs/image_gen/HelloWorldXL_v7/helloworld_p1_20260129_154923.png
```

### 측정 체크리스트

```markdown
이미지 생성 1모델 완료 체크리스트:
- [ ] P1~P4 각 5장 생성 (총 20장)
- [ ] 생성 시간 초 단위 기록 (GPU-Z 또는 터미널 시간)
- [ ] 파일 크기 기록 (PNG 원본)
- [ ] 실사/아티팩팅/K-Beauty 항목 ★ 평가
- [ ] 위 테이블에 해당 행 데이터 업데이트
- [ ] git commit: [rnd] {모델명} 벤치마크 결과 추가
```

---

## 5090 도입 판단 기준 (데이터 기반)

4060 한계가 명확해질 때 자동 발동:

| 조건 | 현재 4060 상태 | 5090 필요성 |
|------|--------------|------------|
| FLUX.1-dev 동작 불가 | ❌ (12GB 필요) | ✅ 근거 1 |
| Qwen 14B 추론 불가 | ❌ (9GB 초과) | ✅ 근거 2 |
| 7B QLoRA 불안정 (5GB/8GB) | ⚠️ | ✅ 근거 3 |
| 영상 생성 720p 이상 불가 | (측정 예정) | 측정 후 판단 |
| 생성 속도 1장 30초+ | (측정 예정) | 측정 후 판단 |

> **판단 트리거**: 위 5개 항목 중 3개 이상 ❌/⚠️ + 실측 데이터 → 5090 도입 제안서 작성

---

## 작업 큐 (4060 막내 순서)

| 순서 | 모델 | 카테고리 | 예상 시간 | 상태 |
|------|------|---------|---------|------|
| 1 | FLUX.1-schnell | 이미지 | 2h | 미시작 |
| 2 | CyberRealistic XL | 이미지 | 1h | 미시작 |
| 3 | Qwen 2.5 7B (ollama) | LLM | 1h | 미시작 |
| 4 | Phi-4 Mini (ollama) | LLM | 1h | 미시작 |
| 5 | CogVideoX-2B | 영상 | 2h | 미시작 |
| 6 | LTX-Video | 영상 | 2h | 미시작 |
| 7 | HelloWorld XL LoRA 학습 | 이미지·학습 | 4h+ | 미시작 |

---

**최종 목표**: 이 테이블이 완성되면 MONKOS 표준 모델 스택 확정 + 5090 도입 제안서 자동 생성
