---
type: completion
date: 2026-07-07
device: M1
agent: 막내2
portfolio: PF_CROP
status: 완료
order: ORDER_20260707_M1쌍아_막내2_BiRefNet_lite_PoC
---

# COMPLETION: BiRefNet-lite PoC — 경량 모델 품질·속도 실측

> **[2026-07-07 15:06 KST]** M1/막내2 → 작가님

---

## 품질 비교표

| 항목 | BiRefNet-portrait | BiRefNet-lite | 비율 |
|------|------------------|---------------|------|
| 모델 크기 | 928MB | 214MB | **4.3배 작음** |
| M1 CPU 모델 로드 | 2.35s | 1.29s | **1.8배 빠름** |
| M1 CPU 추론 (dawn 1024×1024) | 15.59s | 8.83s | **1.8배 빠름** |
| M1 CPU 추론 (idphoto 400×600) | 15.81s | 8.44s | **1.9배 빠름** |
| 메모리 증분 | ~5.5–5.9GB | ~4.6–4.9GB | **16% 절감** |
| 머리카락 경계 (dawn) | 양호 — 잔머리 보존 | **양호 — portrait와 육안 차이 미미** | 동급 |
| 어깨/의복 (dawn) | 정확 | 정확 | 동급 |
| 안경 처리 (idphoto) | 양호 — 프레임 깔끔 | 양호 — portrait와 동급 | 동급 |
| 배경 잔재 (회색 배경 기준) | 미세 | 미세 — portrait와 육안 차이 미미 | 동급 |

## 핵심 판정

- **품질**: 2장 테스트 기준, lite와 portrait 간 **육안 차이를 식별하기 어려움**. 머리카락 경계·안경·어깨 모두 동급 수준.
- **속도**: M1 CPU에서 portrait 대비 **약 1.8배 빠름** (15.7s → 8.6s). 기대값 "4배"에는 미달 — CPU ONNX 기준이라 GPU/CoreML 환경에서 차이 다를 수 있음.
- **크기**: 928MB → 214MB, **4.3배 작음**. 안드로이드 온디바이스 번들에 현실적인 사이즈.
- **백본**: swin_v1_tiny (lite) vs swin_v1_large (portrait). 입력 해상도 동일 1024×1024.

## 결론 — Phase 4 클라이언트 프리뷰 후보 판단

| 용도 | lite 적합성 | 근거 |
|------|------------|------|
| 안드로이드 온디바이스 정본 | ⚠️ 검토 필요 | 214MB 번들 + 8.4s CPU 추론 — 모바일 GPU/NNAPI 실측 필요 |
| 클라이언트 프리뷰 (웹 WASM) | ⚠️ 검토 필요 | 214MB 다운로드 + WASM 추론 속도 미지 |
| 서버사이드 경량화 | ✅ 유력 | GPU 환경에서 portrait 대비 속도↑ + 품질 동급이면 비용 절감 |

## 산출물

| 파일 | 위치 |
|------|------|
| `dawn_lite_white.png` | `/Users/macmini/Desktop/` |
| `dawn_lite_gray.png` | `/Users/macmini/Desktop/` |
| `idphoto_lite_white.png` | `/Users/macmini/Desktop/` |
| `idphoto_lite_gray.png` | `/Users/macmini/Desktop/` |
| `dawn_portrait_white.png` | `/Users/macmini/Desktop/` (비교용 동시 생성) |
| `dawn_portrait_gray.png` | `/Users/macmini/Desktop/` |
| `idphoto_portrait_white.png` | `/Users/macmini/Desktop/` |
| `idphoto_portrait_gray.png` | `/Users/macmini/Desktop/` |
| `birefnet-lite-poc.py` | `apps/crop-app/benchmark/poc-20260707/` |
| `BiRefNet_lite.onnx` (214MB) | `apps/crop-app/benchmark/poc-20260707/` (로컬 보관, git 미커밋) |

## 변경 파일

- `apps/crop-app/benchmark/poc-20260707/birefnet-lite-poc.py` (신규 — 실측 스크립트)
- `monkos-ops/ops/reports/2026-07/COMPLETION_20260707_M1막내2_BiRefNet_lite_PoC.md` (본 보고서)
