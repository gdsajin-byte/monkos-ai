---
type: completion
date: 2026-07-09
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: Head Pose 경량 모델 vs 간접 추정 비교 실측

**[2026-07-09 13:14 KST]** iMac/막내2 → 작가님

## 지시서

`ORDER_20260709_iMac쌍아_막내2_HeadPose경량모델_비교실측.md`

## 결과 요약

✅ Task 1 — 후보 모델 조사: 6DRepNet 2종 ONNX 확보 (5.8MB, 8.5MB). WHENet 17MB(초과), FSA-Net(ONNX 미제공)
✅ Task 2 — 간접 추정 베이스라인: 106점 랜드마크 기반 pitch/yaw/roll 추정 구현
✅ Task 3 — 비교 실측: 6장 이미지 벤치마크 완료
✅ Task 4 — 결과 보고서 작성 완료

## 핵심 수치

| 방법 | Pitch MAD | Yaw MAD | Roll MAD | 추론(ms) | 크기(MB) |
|------|-----------|---------|----------|---------|---------|
| 간접추정 vs MobileNetV3s | **14.48°** | **13.31°** | 0.96° | 0 추가 | 0 |
| MobileNetV3s vs MobileNetV2 | 2.35° | 0.99° | 0.99° | 4.3 추가 | 5.8 |

## 채택 권고

**6DRepNet-MobileNetV3s** (5.8MB, 4.3ms) — pitch/yaw 정밀도에서 간접 추정 대비 압도적 우위

## 변경 파일

- `apps/head-pose-benchmark/benchmark.py` (신규)
- `apps/head-pose-benchmark/models/6drepnet_mobilenetv3s.onnx` (신규, 5.8MB)
- `apps/head-pose-benchmark/models/6drepnet_mobilenetv2.onnx` (신규, 8.5MB)
- `apps/head-pose-benchmark/results/benchmark_results.json` (신규)
- `monkos-ops/ops/reports/2026-07/REPORT_20260709_iMac막내2_HeadPose경량모델_비교실측.md` (신규)

## 배포

없음 (R&D — 프로덕션 변경 없음)

## 💡 후속 제안

- crop-engine 사이드카에 6DRepNet-MobileNetV3s 편입 시 `/headpose` 엔드포인트 추가 (지시서 필요)
- AFLW2000-3D GT 기반 절대 MAE 측정 (데이터셋 확보 시)
- 극단적 pitch(±30°+) 이미지로 보강 실측
