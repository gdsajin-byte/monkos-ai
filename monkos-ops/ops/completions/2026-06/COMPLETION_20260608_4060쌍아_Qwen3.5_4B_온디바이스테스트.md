---
type: completion
date: 2026-06-08
device: 4060
agent: 쌍아
order: ORDER_20260608_iMac쌍아_4060쌍아_Qwen3.5_4B_온디바이스테스트.md
portfolio: PF_OPUS, PF_PORTAL
status: 완료
---

# COMPLETION — Qwen 3.5 4B 온디바이스 테스트 결과

**[2026-06-08 17:44 KST] 4060/쌍아 → iMac/쌍아**

---

## 1. 환경

| 항목 | 값 |
|------|-----|
| GPU | NVIDIA GeForce RTX 4060 8GB |
| 모델 | Qwen3.5-4B-Q4_K_M.gguf (unsloth, 2.55GB) |
| 양자화 | Q4_K_M (4-bit) |
| 런타임 | llama.cpp b9553 (llama-server HTTP API) |
| VRAM 사용 | 3,253 MB / 8,192 MB (40%) |
| Context | 8192 tokens |
| Python | 3.14.2, torch 2.11.0+cu128 |

---

## 2. 시나리오별 결과

| 시나리오 | 품질 (1-5) | 총 시간 (초) | tok/s | 총 토큰 | thinking 토큰 | content 토큰 | Gemini 2.5 Flash 대비 |
|----------|-----------|-------------|-------|---------|-------------|-------------|---------------------|
| SEO 제안 | **1** | 59.07 | 70.5 | 4000 (max) | ~4000 | 0 (빈 출력) | 속도·품질 모두 열세 |
| 이미지 프롬프트 | **4** | 24.59 | 71.9 | 1606 | ~960 | ~650 | 품질 동등, 속도 열세 |
| 글감 정리 | **4** | 34.12 | 71.5 | 2273 | ~1030 | ~1240 | 품질 동등, 속도 열세 |
| slug 생성 | **4** | 49.32 | 71.0 | 3340 | ~2890 | ~450 | 품질 동등, 속도 대폭 열세 |

### 시나리오별 상세

**SEO 제안** — ❌ 실패
- 4000 토큰 전부를 thinking에 소모, 실제 JSON 출력 없음
- 구조화된 JSON 출력이 필요한 태스크에서 thinking 모드가 치명적 장애

**이미지 프롬프트** — ✅ 우수
```
Professional photography guide concept, clean studio shot. A person modeling
a passport photo against three distinct background options side by side.
Left panel: pure white background. Center panel: soft light blue background.
Right panel: neutral light gray background. High-key lighting, minimal
composition, sharp focus, 8k resolution, photorealistic.
```
- Imagen API에 즉시 사용 가능한 수준

**글감 정리** — ✅ 우수
- 제목/서론/본문3섹션/결론 구조 정확
- ML Kit, Subject Segmentation 등 기술 키워드 정확 반영
- 한국어 자연스러움 양호

**slug 생성** — ✅ 정확하나 과잉
- 출력: `perfect-id-photo-background-color-guide` (정확)
- 단, 6단어 slug 생성에 3340 토큰(49초) 소요 → 과도한 thinking

---

## 3. 판정

### 판정 기준 적용 (지시서 기준)

| 기준 | SEO | 이미지 프롬프트 | 글감 정리 | slug |
|------|-----|--------------|---------|------|
| 품질 4 이상 | ❌ (1) | ✅ (4) | ✅ (4) | ✅ (4) |
| 속도 3초 이내 | ❌ (59초) | ❌ (25초) | ❌ (34초) | ❌ (49초) |
| **판정** | **서버 유지** | **서버 유지** | **서버 유지** | **서버 유지** |

### 종합 판정: ❌ 온디바이스 전환 불가 — 서버(Gemini 2.5 Flash) 유지

---

## 4. 근본 원인 분석

### Thinking 모드가 핵심 병목

Qwen 3.5는 reasoning 모델로, 모든 응답에 thinking 토큰을 대량 생성합니다:
- slug(6단어) 생성에 2890 thinking 토큰 + 450 content 토큰 = 49초
- SEO(JSON)는 4000 토큰으로도 thinking이 끝나지 않음
- `/no_think` 태그가 GGUF/llama.cpp 환경에서 작동하지 않음

### 속도 자체는 우수

- **72 tok/s**는 4060에서 매우 좋은 수치
- VRAM 3.2GB로 여유 (8GB 중 40%)
- thinking이 없다면 대부분 3초 이내 가능했을 것

---

## 5. 제언

### 단기 (현행 유지)
- 블로그 에디터 AI 기능은 **Gemini 2.5 Flash 유지**가 최선
- 응답 시간 1-2초, 비용 극소 ($0.001/요청 이하)

### 중기 (재검증 후보)
1. **Qwen3-4B (non-reasoning)** — thinking 없는 기본 모델로 재테스트
2. **Phi-4 Mini 3.8B** — Microsoft 모델, thinking 없음, 4060 최적 구간
3. **Gemma 3 4B** — Google 경량 모델

### 장기 (5090 도입 시)
- 5090(16-24GB)이면 7-8B 모델을 BF16으로 구동 가능
- 온디바이스 전환의 실질적 시작점

---

## 6. 산출물

| 파일 | 경로 |
|------|------|
| 벤치마크 결과 | `AI_Factory/test_outputs/qwen35_4b/results.json` |
| 테스트 스크립트 | `AI_Factory/test_qwen35_4b_server.py` |
| GGUF 모델 | `c:/tmp/qwen35-4b-q4km.gguf` (2.55GB, 임시) |
| llama.cpp 바이너리 | `c:/tmp/llama-cpp/` (임시) |

---

## ✅❌💡⏳📁🔀

- ✅ Qwen 3.5 4B 온디바이스 테스트 4종 완료
- ❌ 온디바이스 전환 불가 판정 (thinking 병목 + 속도 초과)
- 💡 non-reasoning 모델(Qwen3-4B, Phi-4 Mini)로 재검증 권장
- ⏳ 없음
- 📁 `AI_Factory/test_outputs/qwen35_4b/results.json`
- 🔀 main 커밋 대기
