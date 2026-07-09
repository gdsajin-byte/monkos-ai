---
type: order
date: 2026-07-09
device: iMac
agent: 쌍아
target: 막내2
portfolio: PF_SPECS
priority: P2
status: 대기
---

# 지시서: Head Pose 경량 모델 vs 간접 추정 비교 실측 (R&D)

**[2026-07-09 12:56 KST]** iMac/쌍아 → 막내2

## ⚠️ 준수 조항

- 헌법 4조 1항(비밀정보 보호), 4조 2항(파괴적 명령 금지)
- R&D 결과물은 `apps/` 배치. 프로덕션 코드 변경 없음.

## 배경

현행 크롭 엔진은 정수리 위치를 "눈~턱 1:1 미러"로 추산한다. pitch(상하 각도)에 의한 왜곡을 보정하려면 pitch 값이 필요한데, 106점 랜드마크에서 간접 추정(눈~코 / 코~턱 비율)하는 것은 개인차에 취약하다.

Head Pose Estimation 전용 경량 모델(WHENet, 6DRepNet 등)은 roll/yaw/pitch를 도(°) 단위로 직접 출력하며, ONNX 5MB 이하로 가볍다. **간접 추정과 경량 모델의 pitch 정밀도를 비교 실측**하여 채택 근거를 만든다.

## 목표

1. 간접 추정(106점 기반) vs 경량 모델(ONNX)의 **pitch 정확도 비교**
2. 경량 모델의 **추론 시간·모델 크기** 실측
3. crop-engine 사이드카 편입 가능성 판단 근거 확보

## Task 1 — 후보 모델 조사 + ONNX 확보

Head Pose Estimation 경량 모델 후보:

| 모델 | 특징 | 예상 크기 |
|------|------|----------|
| WHENet | Wide range, 단일 네트워크, roll/yaw/pitch 직접 출력 | ~4MB |
| 6DRepNet | 6D rotation representation, SOTA급 정확도 | ~5MB |
| FSA-Net | Feature aggregation, 경량 | ~1MB |
| img2pose | 감지+포즈 동시, 다소 무거움 | ~10MB+ (후순위) |

- 각 모델의 **사전학습 ONNX** 확보 (공식 repo 또는 ONNX Model Zoo)
- 10MB 초과 모델은 기록만 하고 실측 제외

## Task 2 — 간접 추정 베이스라인 구현

106점 랜드마크에서 pitch 간접 추정:

```javascript
// 현행 face-detect-insight.js에서 추출 가능한 값
const eyeToNose = noseTip.y - eyeCenterY;
const noseToChin = chin.y - noseTip.y;
const pitchRatio = eyeToNose / noseToChin;
// pitchRatio → pitch 각도 근사 (캘리브레이션 필요)
```

- 정면 사진에서 pitchRatio 기준값 측정
- pitchRatio → 각도(°) 변환 근사 함수 도출

## Task 3 — 비교 실측

### 테스트 이미지 세트 구성

정면·위·아래 각도별 5장씩 = 최소 15장:
- 정면 (pitch ≈ 0°) × 5
- 턱 내밀기 (pitch ≈ -10~-20°) × 5
- 턱 숙이기 (pitch ≈ +10~+20°) × 5

스톡 이미지 또는 AFLW2000-3D 데이터셋에서 GT(ground truth) 있는 이미지 활용.

### 측정 항목

| 항목 | 설명 |
|------|------|
| pitch 오차 (MAE) | GT 대비 평균 절대 오차 (°) |
| roll 오차 | 비교 (현행 atan2 vs 모델) |
| yaw 오차 | 비교 (현행 ratio vs 모델) |
| 추론 시간 | 이미지 1장당 ms (CPU, onnxruntime) |
| 모델 크기 | ONNX 파일 MB |

### 실행 환경

- iMac (CPU) — onnxruntime으로 실행
- `apps/head-pose-benchmark/` 에 벤치마크 스크립트 배치

## Task 4 — 결과 정리

보고서 형식:

```markdown
## 결과 요약

| 방법 | pitch MAE (°) | roll MAE (°) | yaw MAE (°) | 추론 (ms) | 크기 (MB) |
|------|--------------|-------------|-------------|----------|----------|
| 간접추정 (106점) | ? | ? | ? | 0 (추가비용 없음) | 0 |
| WHENet | ? | ? | ? | ? | ? |
| 6DRepNet | ? | ? | ? | ? | ? |
| FSA-Net | ? | ? | ? | ? | ? |

## 채택 권고

(pitch MAE < 5°이면서 추론 < 50ms인 모델이 있는지 여부 + 채택 의견)
```

## 산출물

| 유형 | 경로 |
|------|------|
| 벤치마크 코드 | `apps/head-pose-benchmark/` |
| 결과 보고서 | `monkos-ops/ops/reports/2026-07/REPORT_20260709_iMac막내2_HeadPose경량모델_비교실측.md` |

## 배포

없음 (R&D — 프로덕션 변경 없음)
