---
type: completion
date: 2026-07-07
device: M1
agent: 막내2
portfolio: PF_CROP
status: 완료
order: ORDER_20260707_M1쌍아_막내2_BiRefNet_lite_브라우저PoC
---

# COMPLETION: BiRefNet-lite 브라우저 PoC — onnxruntime-web 실측

> **[2026-07-07 15:37 KST]** M1/막내2 → 작가님

---

## 결론: BiRefNet-lite 브라우저 추론 불가

모든 백엔드×정밀도 조합에서 **추론 시 OOM 발생**. 모델 로드는 성공하나 1024×1024 고정 입력의 중간 텐서가 브라우저 메모리 한계를 초과.

---

## 실측 매트릭스

| 백엔드 | 모델 | 로드 | 추론 | 실패 원인 |
|--------|------|------|------|----------|
| WASM | fp32 (214MB) | ✅ 3.25s | ❌ OOM | WASM 힙 한계 (2-4GB), 추론 시 ~4.6GB 필요 |
| WASM | fp16 (109MB) | ✅ 2.89s | ❌ OOM | 동일 — fp16 weights이지만 중간 연산은 fp32 |
| WebGPU | fp32 (214MB) | ❌ 버퍼 초과 | — | 기본 maxBufferSize 256MB < 모델 224MB |
| WebGPU | fp16 (109MB) | ✅ 4.13s | ❌ OOM | GPU 연산 중 버퍼 할당 실패 |

### 입력 축소 시도

- 512×512 입력 시도 → `Got invalid dimensions: Expected 1024` — **모델이 1024×1024 고정 입력**

### WebGPU 한도 (M1 Chrome 149)

| 항목 | 기본 디바이스 | 어댑터 최대 |
|------|-------------|-----------|
| maxBufferSize | 256MB | 4096MB |
| maxStorageBufferBindingSize | 128MB | 4096MB |

어댑터 최대 한도로 올려도 추론 시 OOM (onnxruntime-web 내부 할당 패턴 한계).

---

## 근본 원인 분석

1. **BiRefNet 아키텍처**: Swin Transformer 백본 + Bilateral Reference 디코더 → 1024×1024 입력에서 다수의 중간 피처맵 생성
2. **Python 실측 기준**: 추론 시 메모리 증분 **~4.6GB** (model weights 214MB + intermediate ~4.4GB)
3. **WASM 한계**: 주소공간 최대 4GB, 실사용 2GB 내외. 4.6GB 소요와 양립 불가
4. **WebGPU 한계**: onnxruntime-web이 내부적으로 생성하는 GPU 버퍼 수/크기가 디바이스 한도를 초과

---

## Phase 4 전략 시사점

| 접근 | 판정 | 근거 |
|------|------|------|
| 브라우저 BiRefNet-lite 직접 추론 | ❌ 불가 | 메모리 한계 — 현세대 onnxruntime-web으로는 근본적 불가 |
| 브라우저 경량 모델 (MediaPipe Selfie Seg 등) | ⚠️ 프리뷰 한정 | 품질 부족이나 프리뷰 용도로는 가능 (ML Kit Android 동급) |
| 서버 BiRefNet → 브라우저 결과 수신 | ✅ 현행 채택 | RunPod/4060 GPU 0.7-0.8s, 프로덕션 검증 완료 |
| WASM 대안 모델 탐색 | 💡 후속 검토 | MODNet/PP-Matting 등 경량 모델 (입력 해상도 256-512 가능) |

---

## 산출물

| 파일 | 위치 |
|------|------|
| `birefnet-lite-browser.html` | `apps/crop-app/benchmark/` |
| `BiRefNet_lite_fp16.onnx` (109MB) | `apps/crop-app/benchmark/poc-20260707/` (로컬, git 미커밋) |

## 변경 파일

- `apps/crop-app/benchmark/birefnet-lite-browser.html` (신규 — 브라우저 PoC)
- `monkos-ops/ops/reports/2026-07/COMPLETION_20260707_M1막내2_BiRefNet_lite_브라우저PoC.md` (본 보고서)
