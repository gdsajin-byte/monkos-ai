---
type: order
date: 2026-07-09
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_SPECS
priority: P1
status: 대기
---

# 지시서: 크롭 앵커 동적화 Phase 2 — pitch 보정 + 규격 기반 눈위치 연산

**[2026-07-09 13:47 KST]** iMac/쌍아 → 막내

## ⚠️ 준수 조항

- 헌법 4조 1항(비밀정보 보호), 4조 2항(파괴적 명령 금지)
- ch5 2조(배포는 deploy.sh 경유)

## 배경

현행 crop.js의 `EYE_POSITION_RATIO = 0.43` 하드코딩으로 인해:
- 헤어 볼륨 큰 사람 → 상단 2.8mm (규격 하한 3mm 위반 우려)
- 턱 내밀기 셀카 → 1:1 미러가 정수리 과소추정 → 헤어탑 잘림

6DRepNet이 라이브에 올라갔으므로(00011-l7s), fit 응답에 `pose.pitch`가 포함된다.
이 pitch 값을 사용해 정수리 미러 계수를 보정하고, 눈 위치를 규격 제약에서 연산한다.

설계서: `DESIGN_20260709_크롭앵커동적화_pitch보정_헤어라인감지.md` (민아 검증 완료)

---

## Task 1 — pitch 기반 미러 계수 보정

파일: `crop-engine/lib/crop.js`

### 1-1. cropToFrame 함수 시그니처

현행 landmarks 객체에 `pose` 필드가 이미 포함됨 (6DRepNet 편입으로 추가됨).

### 1-2. 미러 계수 보정

Step 2 (정수리 추산) 부분을 변경:

**현행** (crop.js:43~46):
```javascript
const eyeToChin = chin.y - eyeCenterY;
const crownY = eyeCenterY - eyeToChin;  // 눈 위로 눈~턱 거리만큼
const faceHeight = chin.y - crownY;     // = eyeToChin * 2
```

**변경**:
```javascript
const eyeToChin = chin.y - eyeCenterY;
// pitch 보정: 사진 속 정수리 위치 기준
//   턱 내밀기(pitch < 0) → 사진에서 눈~정수리가 짧아짐 → 미러 축소
//   턱 숙이기(pitch > 0) → 사진에서 눈~정수리가 길어짐 → 미러 확대
const pose = landmarks.pose || {};
const pitchDeg = pose.pitch || 0;
// 정면(0°) 기준 ±10% 범위. tan 기반 — 선형 근사보다 대각도에서 정확
const mirrorRatio = 1.0 + Math.max(-0.10, Math.min(0.10, Math.tan(pitchDeg * Math.PI / 180) * 0.3));
const crownY = eyeCenterY - eyeToChin * mirrorRatio;
const faceHeight = chin.y - crownY;
```

**임계값 근거**:
- `* 0.3` 감쇠 — pitch -10°(턱 내밀기)에서 mirrorRatio ≈ 0.95 (5% 축소). 과보정 방지.
- pitch 부호: 6DRepNet 출력에서 턱 내밀기 = 음수, 턱 숙이기 = 양수 (R&D 실측 확인)
- 방향: 턱 내밀기 → 사진 속 정수리가 가까움 → 미러 축소. 턱 숙이기 → 반대.
- `Math.tan` — 선형보다 대각도에서 자연스러운 보정 곡선

### 1-3. 로그 추가

crop.js 완료 로그에 mirrorRatio 추가:

```javascript
console.log(`[Crop] 완료: face=${actualFaceMM}mm, top=${topMM}mm, bottom=${bottomMM}mm, eye=${eyePosPercent}%, scale=${meta.scale}, mirror=${mirrorRatio.toFixed(2)}, pitch=${pitchDeg}°`);
```

---

## Task 2 — 규격 기반 눈위치 연산

파일: `crop-engine/lib/crop.js`

### 2-1. computeEyeAnchor 함수 추가

`EYE_POSITION_RATIO` 상수 선언 직후에 함수 추가:

```javascript
function computeEyeAnchor(spec) {
  const faceRatio = (FACE_TARGET_MM / FRAME_MM);
  const halfFace = faceRatio / 2;
  const topMarginMin = spec.topMargin || 0.04;
  const bottomMarginMin = spec.bottomMargin || 0.12;

  const eyeMin = topMarginMin + halfFace;
  const eyeMax = 1 - bottomMarginMin - halfFace;

  if (eyeMin > eyeMax) return 0.44;

  const eyeOptimal = (eyeMin + eyeMax) / 2;
  return Math.max(0.42, Math.min(0.48, eyeOptimal));
}
```

### 2-2. EYE_POSITION_RATIO 교체

**현행** (crop.js:63):
```javascript
let targetEyeY = frameH * EYE_POSITION_RATIO;
```

**변경**:
```javascript
const eyeAnchor = computeEyeAnchor(spec);
let targetEyeY = frameH * eyeAnchor;
```

`EYE_POSITION_RATIO` 상수는 폴백 참조용으로 유지하되 주석 변경:
```javascript
const EYE_POSITION_RATIO = 0.43;    // 레거시 폴백 — 실사용은 computeEyeAnchor()
```

### 2-3. 규격별 예상 결과

| 규격 | eyeMin | eyeMax | 연산 눈위치 | 현행 |
|------|--------|--------|-----------|------|
| 한국 여권 | 0.44 | 0.44 | **44%** | 43% |
| 한국 반명함 | 0.405 | 0.455 | **43%** | 43% |
| 일본 여권 | 0.44 | 0.44 | **44%** | 43% |

→ 한국 여권: 43% → 44%. 상단 여백 약 1mm 추가 확보.

---

## Task 3 — fit-spec 응답에 보정 메타 추가

파일: `crop-engine/lib/crop.js`

meta 객체에 보정 정보 추가:

```javascript
const meta = {
  spec: `${format}_${country}`,
  scale: Math.round(scale * 100) / 100,
  faceMM: actualFaceMM,
  topMarginMM: topMM,
  bottomMarginMM: bottomMM,
  eyePositionPercent: eyePosPercent,
  eyeAnchor: eyeAnchor,
  mirrorRatio: +mirrorRatio.toFixed(2),
  pitchDeg: pitchDeg,
  extractRegion: { left: extractLeft, top: extractTop, width: frameW, height: frameH },
};
```

---

## 검증

| 케이스 | 기대 결과 |
|--------|----------|
| 정면 셀카 (pitch ≈ 0°) | mirrorRatio ≈ 1.0. 눈위치 44% (여권). 상단 여백 ~3.5mm |
| 턱 내밀기 (pitch ≈ -15°) | mirrorRatio ≈ 0.92. 사진 속 정수리가 가까우므로 미러 축소. 가이드선 하강 |
| 턱 숙이기 (pitch ≈ +10°) | mirrorRatio ≈ 1.05. 사진 속 정수리가 멀어지므로 미러 확대. 가이드선 상승 |
| 6DRepNet 미응답 (pose 없음) | pitchDeg = 0, mirrorRatio = 1.0. 현행과 동일 동작 |
| 반명함 규격 | 눈위치 43% (현행 유지) |
| 상단 2.8mm 문제 사진 (재테스트) | 상단 ~3.5mm로 개선 |

## 배포

1. `./deploy.sh crop-engine`
2. portal 변경 없음 (crop-engine만)

## 비변경 사항 (Phase 3으로 이관)

- 헤어라인 감지 (대머리 볼륨 보정) — 별도 지시서
- `HAIR_VOLUME_RATIO` 동적화 — Phase 3
