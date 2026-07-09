---
type: report
date: 2026-07-09
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# Head Pose 경량 모델 vs 간접 추정 비교 실측 보고서

**[2026-07-09 13:13 KST]** iMac/막내2 → 작가님

## 1. 실측 환경

- 실행 환경: iMac (CPU) — onnxruntime 1.23.2, Python 3.13
- 얼굴 검출: SCRFD-10GF (det_10g.onnx, 16MB) + 106점 랜드마크 (2d106det.onnx, 4.8MB)
- 테스트 이미지: 6장 (정면 4장, 캐주얼 1장, 측면 1장) — 프로젝트 내 기존 사진 활용
- GT 데이터셋: AFLW2000-3D 원본 다운로드 불가 (서버 타임아웃). 모델 합의(model consensus)를 참조 기준으로 사용

## 2. 후보 모델 조사 (Task 1)

| 모델 | 특징 | ONNX 크기 | 실측 대상 | 비고 |
|------|------|----------|----------|------|
| 6DRepNet-MobileNetV3s | 6D rotation, MobileNetV3-small backbone | **5.8 MB** | **O** | yakhyo/head-pose-estimation |
| 6DRepNet-MobileNetV2 | 6D rotation, MobileNetV2 backbone | **8.5 MB** | **O** | yakhyo/head-pose-estimation |
| WHENet (PINTO prepost) | Wide range, pre/post processing 내장 | 17 MB | X (>10MB) | PINTO0309/HeadPoseEstimation-WHENet |
| FSA-Net | Feature aggregation, Keras 기반 | N/A | X (ONNX 미제공) | 공식 ONNX 변환본 없음 |
| img2pose | 감지+포즈 동시 | ~40 MB | X (>10MB) | 후순위 |

- 6DRepNet 계열만 크기 기준(10MB 이하) 충족
- 입력: 1×3×224×224 (RGB, ImageNet 정규화)
- 출력: 3×3 rotation matrix → ZYX Euler angles (pitch, yaw, roll in degrees)

## 3. 간접 추정 베이스라인 (Task 2)

106점 랜드마크에서 pitch/yaw/roll을 간접 추정하는 방식:

| 축 | 추정 방식 | 수식 |
|----|----------|------|
| **Roll** | 양쪽 눈 기울기 | `atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)` |
| **Yaw** | 코끝의 좌우 편향 (눈 간 거리 정규화) | `(noseTip.x - eyeMidX) / eyeSpan → arcsin` |
| **Pitch** | 눈~코 / 코~턱 거리 비율 | `(eyeToNose / noseToChin - NEUTRAL_RATIO) × 45` |

정면 사진에서 측정된 pitch ratio 기준값: **≈ 0.57** (눈~코 거리가 코~턱 거리의 57%)

## 4. 비교 실측 결과 (Task 3)

### 4-1. 개별 이미지 결과

| 이미지 | 방법 | Pitch (°) | Yaw (°) | Roll (°) | 추론 (ms) |
|--------|------|-----------|---------|----------|----------|
| frontal_01 (정면) | 간접추정 | -14.8 | +0.6 | +0.5 | 6.5 |
| | MobileNetV3s | -5.7 | +1.0 | +1.5 | 5.7 |
| | MobileNetV2 | -8.4 | +0.8 | -0.5 | 6.6 |
| frontal_04 (정면) | 간접추정 | -18.6 | +1.5 | -0.3 | 3.4 |
| | MobileNetV3s | -5.0 | +0.8 | +0.5 | 3.0 |
| | MobileNetV2 | -6.8 | +0.5 | -0.7 | 6.8 |
| frontal_06 (정면) | 간접추정 | -18.1 | -1.1 | +0.1 | 3.3 |
| | MobileNetV3s | -3.7 | +2.4 | -0.2 | 2.9 |
| | MobileNetV2 | -5.5 | +0.9 | -0.2 | 4.1 |
| casual_03 (미소) | 간접추정 | -17.7 | -8.7 | +4.7 | 5.1 |
| | MobileNetV3s | -5.6 | +6.0 | +4.2 | 4.7 |
| | MobileNetV2 | -7.7 | +2.7 | +4.8 | 10.0 |
| yaw_05 (측면 ~20°) | 간접추정 | **-23.7** | **+39.4** | -4.5 | 3.7 |
| | MobileNetV3s | +4.9 | -20.8 | -6.6 | 4.1 |
| | MobileNetV2 | +7.8 | -20.4 | -6.9 | 8.1 |

### 4-2. 축별 오차 요약

| 방법 | Pitch MAD (°) | Yaw MAD (°) | Roll MAD (°) | 추론 (ms) | 크기 (MB) |
|------|--------------|-------------|-------------|----------|----------|
| 간접추정 (106점) vs MobileNetV3s | 14.48 | 13.31 | 0.96 | 5.3 (추가비용 0) | 0 |
| 간접추정 (106점) vs MobileNetV2 | 13.10 | 12.42 | 0.83 | 5.3 (추가비용 0) | 0 |
| **MobileNetV3s vs MobileNetV2** | **2.35** | **0.99** | **0.99** | — | — |

### 4-3. 문제점 분석

**Pitch — 체계적 편향 (MAD 13~14°)**
- 간접 추정은 모든 이미지에서 모델 대비 10~15° 더 낮은 (더 부정적인) pitch 값을 산출
- 원인: NEUTRAL_RATIO 캘리브레이션 부재. 정면 기준 eyeToNose/noseToChin ≈ 0.57인데, 임의값 0.90을 사용
- 캘리브레이션 후에도 pitch_ratio → 각도 변환이 선형 근사이므로 대각도에서 오차 증가
- **개인차 문제**: 동일 pitch에서 얼굴형(긴 턱/짧은 턱)에 따라 ratio가 달라짐 → 일반화 한계

**Yaw — 부호 반전 + 대각도 붕괴 (MAD 12~13°)**
- 정면(±5°): 간접 추정도 합리적 (오차 2~3°)
- 대각도(>15°): 부호 반전 발생. 간접 +39° vs 모델 -21° (60° 오차)
- 원인 1: 이미지 좌표계(nose.x > midX = positive) vs 주체 좌표계(face left = negative) 충돌
- 원인 2: `arcsin(ratio × 2)` 근사가 대각도에서 발산

**Roll — 양호 (MAD < 1°)**
- 양쪽 모두 `atan2(눈 기울기)`를 사용하므로 본질적으로 동일 방법
- 간접 추정으로 충분

## 5. 채택 권고 (Task 4)

### 결론: 6DRepNet-MobileNetV3s 채택 권고

| 기준 | 간접 추정 | 6DRepNet-MobileNetV3s |
|------|----------|----------------------|
| Pitch 정밀도 | MAD ~14° (불합격) | **기준 (모델 간 합의 2.35°)** |
| Yaw 정밀도 | MAD ~13° + 부호반전 (불합격) | **기준 (모델 간 합의 0.99°)** |
| Roll 정밀도 | MAD ~1° (합격) | 기준 (MAD 0.99°) |
| 추론 시간 | 0 ms 추가 | **4.3 ms 추가** (합격: <50ms) |
| 모델 크기 | 0 MB | **5.8 MB** (합격: <10MB) |
| 개인차 내성 | 취약 (얼굴형 의존) | 강건 (학습 기반) |

### 사이드카 편입 방안

1. **ONNX 모델 배치**: `monkos_AI/crop-engine/models/6drepnet_mobilenetv3s.onnx` (5.8MB)
2. **추론 파이프라인**: SCRFD face detect → bbox → face crop 224×224 → 6DRepNet → rotation matrix → euler angles
3. **기존 사이드카 활용**: `face_detect_scrfd.py`에 `/headpose` 엔드포인트 추가 가능
4. **추가 비용**: 모델 크기 +5.8MB, 이미지당 추론 +4.3ms (CPU)
5. **Roll은 기존 방식 유지**: atan2 기반 roll은 이미 정확하므로 모델 불필요

### 유보 사항

- GT 데이터셋(AFLW2000-3D) 기반 절대 오차(MAE) 미측정 — 모델 합의 기반 상대 비교만 수행
- 극단적 pitch(±30° 이상)의 테스트 이미지 부재 — 추후 실제 서비스 이미지로 보강 권고
- WHENet(17MB)는 크기 기준 초과로 미실측. 공식 repo에서 경량 ONNX 확보 시 재평가 가능

## 6. 산출물

| 유형 | 경로 |
|------|------|
| 벤치마크 코드 | `apps/head-pose-benchmark/benchmark.py` |
| ONNX 모델 | `apps/head-pose-benchmark/models/6drepnet_mobilenetv3s.onnx` (5.8MB) |
| ONNX 모델 | `apps/head-pose-benchmark/models/6drepnet_mobilenetv2.onnx` (8.5MB) |
| 결과 JSON | `apps/head-pose-benchmark/results/benchmark_results.json` |
| 본 보고서 | `monkos-ops/ops/reports/2026-07/REPORT_20260709_iMac막내2_HeadPose경량모델_비교실측.md` |
