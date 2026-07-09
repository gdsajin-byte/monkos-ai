---
type: design
date: 2026-07-09
device: iMac
agent: 쌍아
portfolio: PF_SPECS
status: active
---

# 설계서: 크롭 눈위치 앵커 동적화 + pitch 보정 + 헤어라인 감지

**[2026-07-09 12:15 KST]** iMac/쌍아

## 문제

현행 crop.js의 눈 위치 앵커 `EYE_POSITION_RATIO = 0.43`이 전 규격 하드코딩.

| 케이스 | 현행 결과 | 원인 |
|--------|----------|------|
| 헤어 볼륨 큰 여성 | 정수리 잘림 / 상단 2.8mm (규격 하한 3mm 위반) | 43%가 너무 높음 |
| 대머리 | 가이드라인이 정수리 위 허공 | 헤어 볼륨 8% 일괄 적용 |
| 턱 내밀고 찍은 셀카 | 정수리 과소추정 → 잘림 | 1:1 미러가 pitch 미반영 |
| 턱 숙이고 찍은 셀카 | 상단 과다 여백 → 어깨 잘림 | 동일 |
| 기존 증명사진 재가공 | face_too_close 차단 | 크기 상한 과타이트 (별도 수정 완료) |

## 설계 원칙

- **복잡한 모델 금지**. sharp 픽셀 통계 + 106점 랜드마크 산술만.
- **각 보정 단계가 독립적**. 하나가 틀려도 최종 클램프가 규격 범위를 보장.
- **규격별 눈 위치가 상수가 아니라 제약조건의 해**.

## 아키텍처

```
입력: 106점 랜드마크 + 이미지 버퍼 + 규격(formats.js)
  │
  ├─ Step 1. 기본 정수리 추산 (현행 1:1 미러)
  │
  ├─ Step 2. pitch 보정 계수 (눈~코 / 코~턱 비율)
  │    → 미러 계수 0.90~1.10 범위
  │
  ├─ Step 3. 헤어라인 감지 (피부톤 연속성)
  │    → 볼륨 0~8% 동적 결정
  │
  ├─ Step 4. 규격 제약조건 기반 눈 위치 연산
  │    → 상단여백 + 하단여백 + 얼굴크기 → 허용 눈위치 범위 도출
  │    → 범위 내 최적점 선택 (밸런스 가중)
  │
  └─ Step 5. 최종 클램프 (42~48%)
      → 어떤 추산 오류가 있어도 규격 안에 있는 결과 보장
```

---

## Step 1 — 기본 정수리 (현행 유지)

```javascript
const eyeToChin = chin.y - eyeCenterY;
const crownY = eyeCenterY - eyeToChin * mirrorRatio;
```

현행 `mirrorRatio = 1.0`. Step 2에서 보정.

---

## Step 2 — pitch 보정 계수

106점에서 nose tip(86), 눈 중심, 턱(0)을 이미 추출하고 있다.

```javascript
const eyeToNose = noseTip.y - eyeCenterY;
const noseToChin = chin.y - noseTip.y;
const pitchRatio = eyeToNose / (noseToChin || 1);

// pitchRatio 해석:
//   정면 ≈ 0.7~0.9 (코가 눈~턱의 위쪽 40% 지점)
//   턱 내밀기 → noseToChin 줄어듦 → pitchRatio 상승 → 정수리 과소추정 보정 필요
//   턱 숙이기 → eyeToNose 줄어듦 → pitchRatio 하락 → 정수리 과대추정 보정 필요

const PITCH_NEUTRAL = 0.80;  // 정면 기준값 (실측 캘리브레이션 필요)
const pitchDeviation = pitchRatio - PITCH_NEUTRAL;
// 미러 계수: 턱 내밀면 확대, 숙이면 축소. 최대 ±10%
const mirrorRatio = 1.0 + Math.max(-0.10, Math.min(0.10, pitchDeviation * 0.5));
```

**범위**: 0.90 ~ 1.10. `* 0.5` 감쇠 계수로 과보정 방지.

### 캘리브레이션

`PITCH_NEUTRAL`은 정면 사진 20장의 eyeToNose/noseToChin 평균으로 확정.
프로덕션 로그에 pitchRatio를 관측 로그로 추가 → 실측 후 확정.

---

## Step 3 — 헤어라인 감지 (대머리 보정)

정수리~이마 구간에서 피부톤이 연속되면 헤어라인 없음 → 볼륨 축소.

```javascript
async function detectHairVolume(imageBuffer, landmarks, scale) {
  // 이마 영역: 눈 중심 ~ 추산 정수리 (미러) 사이의 수평 밴드
  const eyeY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const crownY = landmarks.crown.y;
  const foreheadTop = Math.max(0, Math.round(crownY * scale));  // 음수 방어 (타이트 입력)
  const foreheadBot = Math.round((eyeY - (eyeY - crownY) * 0.3) * scale);  // 눈에서 30% 위
  const eyeSpan = Math.abs(landmarks.rightEye.x - landmarks.leftEye.x);
  const bandLeft = Math.round((landmarks.leftEye.x - eyeSpan * 0.3) * scale);
  const bandWidth = Math.round(eyeSpan * 1.6 * scale);
  const bandHeight = Math.max(8, foreheadBot - foreheadTop);

  // 상하 2분할: 이마 하반(확실한 피부) vs 이마 상반(헤어라인 존재 여부)
  const halfH = Math.floor(bandHeight / 2);
  const [statsLower, statsUpper] = await Promise.all([
    sharp(imageBuffer).extract({left: bandLeft, top: foreheadTop + halfH, width: bandWidth, height: halfH}).greyscale().stats(),
    sharp(imageBuffer).extract({left: bandLeft, top: foreheadTop, width: bandWidth, height: halfH}).greyscale().stats(),
  ]);

  const meanDiff = Math.abs(statsUpper.channels[0].mean - statsLower.channels[0].mean);
  const stdDiff = Math.abs(statsUpper.channels[0].stdev - statsLower.channels[0].stdev);

  // 밝기·텍스처가 유사하면 피부 연속 = 대머리
  // meanDiff < 15 && stdDiff < 10 → 헤어라인 미감지
  if (meanDiff < 15 && stdDiff < 10) {
    return 0.02;  // 최소 볼륨 (완전 대머리도 약간의 두피 곡면)
  }
  return 0.08;    // 기본 볼륨
}
```

**핵심**: 복잡한 세그멘테이션 대신 **이마 상반/하반 밝기 비교**만으로 판정. sharp 통계 2회.

---

## Step 4 — 규격 제약조건 기반 눈 위치 연산

현행: `EYE_POSITION_RATIO = 0.43` 상수
변경: 규격의 여백 규정에서 **눈 가능 범위를 도출하고 최적점 선택**

```javascript
function computeEyeAnchor(spec, faceMM, frameMM) {
  // 규격 제약에서 눈 위치 허용 범위를 도출
  //
  // 기준점 정의 (민아 검토 반영 2026-07-09):
  //   topMargin = 정수리 위 여백 (헤어볼륨은 이 여백을 소비). 별도로 더하지 않는다.
  //   bottomMargin = 턱 아래 여백.
  //   → 헤어볼륨 이중 계상 방지. topMargin이 이미 "머리 전체 위 여백"을 의미.
  //
  // 눈 위치 범위:
  //   상한: 눈이 너무 아래 → 하단여백 부족
  //     eyeMax = 1 - bottomMarginMin - halfFace
  //   하한: 눈이 너무 위 → 상단여백 부족
  //     eyeMin = topMarginMin + halfFace
  //     (halfFace = 눈~정수리 ≈ 눈~턱. 헤어볼륨은 topMargin에 포함)

  const faceRatio = faceMM / frameMM;
  const halfFace = faceRatio / 2;  // 눈~정수리 ≈ 얼굴의 절반

  const topMarginMin = spec.topMargin || 0.04;     // 규격별 상단 최소여백 (헤어탑 기준)
  const bottomMarginMin = spec.bottomMargin || 0.12;

  const eyeMin = topMarginMin + halfFace;           // 상단 여백 확보 하한
  const eyeMax = 1 - bottomMarginMin - halfFace;    // 하단 여백 확보 상한

  // 공집합 방어: eyeMin > eyeMax 시 현행 crop.js 스케일 축소 로직에 위임
  // (얼굴이 프레임 대비 너무 클 때 — 축소 후 재연산)
  if (eyeMin > eyeMax) {
    return 0.44; // 안전 폴백 (현행 43% 대비 약간 여유)
  }

  // 허용 범위 내에서 중점 선택 (상하 밸런스)
  const eyeOptimal = (eyeMin + eyeMax) / 2;

  // 안전 클램프
  return Math.max(0.42, Math.min(0.48, eyeOptimal));
}
```

### 규격별 검산 (보정 후)

kr-passport: halfFace = 0.74/2 = 0.37
  eyeMin = 0.07 + 0.37 = 0.44
  eyeMax = 1 - 0.19 - 0.37 = 0.44
  eyeOptimal = (0.44 + 0.44) / 2 = 0.44 → 클램프 후 **0.44**

id_kr: halfFace = 0.65/2 = 0.325
  eyeMin = 0.08 + 0.325 = 0.405
  eyeMax = 1 - 0.22 - 0.325 = 0.455
  eyeOptimal = (0.405 + 0.455) / 2 = 0.43 → 클램프 후 **0.43**

| 규격 | topMargin | bottomMargin | faceRatio | eyeMin | eyeMax | 연산 눈위치 |
|------|-----------|-------------|-----------|--------|--------|-----------|
| 한국 여권 (45mm) | 7% | 19% | 74% | 0.44 | 0.44 | **44%** |
| 한국 반명함 (40mm) | 8% | 22% | 65% | 0.405 | 0.455 | **43%** |
| 일본 여권 (45mm) | 7% | 19% | 74% | 0.44 | 0.44 | **44%** |

→ 한국 여권은 현행 43% → 44%로 1% 하강. 헤어탑 여백 약 1mm 확보.
→ 한국 반명함은 여유 범위(40.5~45.5%)가 있어 43%로 현행 유지.
→ 공집합은 발생하지 않음 (보정 후 검증 완료).

---

## Step 5 — 최종 클램프

```javascript
const EYE_CLAMP_MIN = 0.42;
const EYE_CLAMP_MAX = 0.48;
const finalEyeRatio = Math.max(EYE_CLAMP_MIN, Math.min(EYE_CLAMP_MAX, computedEyeRatio));
```

어떤 보정이 오작동해도 **42~48% 범위를 절대 벗어나지 않음**.

---

## 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `crop-engine/lib/crop.js` | `EYE_POSITION_RATIO` 상수 제거 → `computeEyeAnchor()` 함수 호출 |
| `crop-engine/lib/face-detect-insight.js` | `pitchRatio` 반환 추가 (noseTip 이미 있음, 산술 1줄) |
| `crop-engine/specs/formats.js` | 각 규격에 `topMargin`, `bottomMargin` 확인 (이미 존재) |
| `crop-engine/lib/crop.js` | `detectHairVolume()` 함수 추가 (sharp 통계 2회) |

**crop-engine만 변경. portal·idphoto-kr 변경 없음.**

---

## 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| pitchRatio 캘리브레이션 미실측 | PITCH_NEUTRAL = 0.80 보수적 시작, 프로덕션 로그로 실측 후 조정 |
| 대머리 판정 오작동 (어두운 머리 + 어두운 배경) | 매팅 후 합성 배경이 흰색이라 영향 제한 / 클램프가 최종 방어 |
| 기존 크롭 결과와 차이 | 눈 위치 1~2% 이동이라 육안 차이 미미 / 규격 적합성은 개선 |

---

## 단계별 실행 제안

1. **Phase 1 (즉시)**: `pitchRatio` 로그 추가 → 프로덕션 실측 데이터 수집
2. **Phase 2 (실측 후)**: `computeEyeAnchor()` 함수 도입 + pitch 보정 + 클램프
3. **Phase 3 (관찰 후)**: `detectHairVolume()` 헤어라인 감지 추가

Phase 1은 로그만 추가라 무위험. Phase 2·3은 실측 데이터 기반으로 임계값 확정 후 진행.
