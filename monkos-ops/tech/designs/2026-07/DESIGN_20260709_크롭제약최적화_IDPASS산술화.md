---
type: design
date: 2026-07-09
device: iMac
agent: 쌍아
portfolio: PF_SPECS
status: draft
---

# 설계서: 크롭 제약 최적화 — IDPASS 수동 보정의 산술화

**[2026-07-09 16:12 KST]** iMac/쌍아

## 취지

IDPASS 크롭앱에서 사람이 수동으로 하던 보정:
1. 정수리 가이드선 위치 조절
2. 화각 스케일 조절
3. 사진 상하 이동

이 세 가지를 **규격 제약조건의 1차원 최적화**로 산술 처리한다.
고정 계수(43%, 8% 등)를 제거하고, 매 사진마다 제약을 만족하는 최적해를 구한다.

## 현행 문제

| 고정 계수 | 문제 |
|-----------|------|
| `EYE_POSITION_RATIO = 0.43` | 종속 변수를 고정 → 규격 제약과 충돌 시 해결 불가 |
| `HAIR_VOLUME_RATIO = 0.08` | 대머리~볼륨펌을 동일 취급 → 상단 과대/과소 |
| `FACE_TARGET_MM = 33` | 이건 유지 — 규격 하한(32mm) + 심사관 마진 |

## 설계

### 입력 (측정)

```
턱(chin.y)          ← 106점 실측
눈(eyeCenter.y)     ← 106점 실측
정수리(crownY)      ← 눈 - (턱 - 눈) × 1.0 (해부학 1:1 미러)
헤어탑(hairTopY)    ← 실측 (매팅 알파 or subjectTopRow or 추정 폴백)
얼굴높이(faceH)     ← 턱 - 정수리
```

### 고정 (결정된 값)

```
scale = (33mm × mmPx) / faceH    ← 얼굴 33mm 타겟 고정
frameW, frameH                    ← 규격 (예: 413×531px)
```

### 변수 (구할 것)

```
extractTop — 프레임의 수직 위치 (1개)
```

### 제약조건 (규격)

```
C1. 정수리 여백 ≥ 3mm (hard)
    → crownY × scale - extractTop ≥ 3mm × mmPx

C2. 하단 여백 ≥ 5mm (hard)
    → frameH - (chin.y × scale - extractTop) ≤ frameH - 5mm × mmPx
    → chin.y × scale - extractTop ≤ frameH - 5mm × mmPx

C3. 헤어탑 프레임 안 (soft)
    → hairTopY × scale - extractTop ≥ 0
    
C4. 눈 위치 40~48% 범위 (soft — 경험적 안전 범위)
    → 0.40 ≤ (eyeCenter.y × scale - extractTop) / frameH ≤ 0.48
```

### 최적화

```
extractTop의 허용 범위:

  하한: extractTop ≥ crownY × scale - (frameH - 5mm × mmPx - faceH × scale)
        = 정수리 여백을 최대로 할 때 하단이 5mm 되는 지점

  상한: extractTop ≤ crownY × scale - 3mm × mmPx
        = 정수리 여백이 정확히 3mm인 지점

범위 내에서 최적점 선택:
  1순위: 헤어탑이 프레임 안에 들어오는 extractTop
  2순위: 1순위 불가 시, 정수리 여백 = 3mm (프레임 최대한 위로)
  3순위: 눈 위치가 43~45% 범위에 가까운 점 (tie-breaking)
```

### 의사코드

```javascript
function optimizeCrop(landmarks, spec) {
  const { chin, leftEye, rightEye } = landmarks;
  const eyeY = (leftEye.y + rightEye.y) / 2;
  const crownY = eyeY - (chin.y - eyeY);  // 1:1 미러
  const faceH = chin.y - crownY;
  
  const mmPx = spec.frameH / spec.frameHmm;
  const scale = (33 * mmPx) / faceH;  // 얼굴 33mm 고정
  
  // 헤어탑: 실측 있으면 실측, 없으면 정수리 그대로 (볼륨 0 — 8% 폐기)
  const hairTopY = landmarks.hairTop ?? crownY;
  
  // extractTop 허용 범위 (hard 제약)
  const crownMarginPx = 3 * mmPx;   // 정수리 위 최소 3mm
  const bottomMarginPx = 5 * mmPx;  // 턱 아래 최소 5mm
  
  const topMax = Math.round(crownY * scale - crownMarginPx);     // 정수리 3mm일 때
  const topMin = Math.round(chin.y * scale - spec.frameH + bottomMarginPx);  // 하단 5mm일 때
  
  if (topMin > topMax) {
    // 제약 불만족 — 얼굴이 프레임 대비 너무 큼. 33mm 유지, 최선 배치.
    return Math.round((topMin + topMax) / 2);
  }
  
  // 1순위: 헤어탑이 프레임 안에 들어오는 위치
  const hairTopTarget = Math.round(hairTopY * scale);  // 헤어탑이 프레임 상단(extractTop)에 맞닿는 위치
  
  if (hairTopTarget >= topMin && hairTopTarget <= topMax) {
    // 헤어탑을 프레임 상단에 맞추되, 여유 2mm
    const withMargin = Math.round(hairTopY * scale - 2 * mmPx);
    return Math.max(topMin, Math.min(topMax, withMargin));
  }
  
  // 2순위: 헤어탑 불가 → 정수리 여백 3mm (프레임 최대한 위로)
  return topMax;
}
```

### 눈 위치는 결과

```javascript
const eyePositionPercent = (eyeY * scale - extractTop) / spec.frameH;
// 이 값이 43~45%에 오면 좋지만, 고정하지 않는다.
// 제약조건의 해가 곧 최적 눈 위치.
```

## HAIR_VOLUME_RATIO 제거

현행 crop.js:23의 `HAIR_VOLUME_RATIO = 0.08` 삭제.

헤어탑은:
1. **매팅 알파 실측** — 파이프라인에서 매팅 결과가 있을 때
2. **subjectTopRow** — 순백 배경일 때 (이미 크롭된 사진 재가공)
3. **정수리 = 헤어탑** — 실측 불가 시 볼륨 0으로 폴백 (8% 추정보다 안전)

## 규격별 제약 파라미터 (formats.js에서 읽음)

| 규격 | frameHmm | faceTarget | crownMarginMin | bottomMarginMin |
|------|----------|------------|---------------|----------------|
| 한국 여권 | 45mm | 33mm | 3mm | 5mm |
| 한국 반명함 | 40mm | 26mm | 3mm | 5mm |
| 일본 여권 | 45mm | 33mm | 3mm | 5mm |
| 미국 여권 | 51mm | 28mm | 4mm | - (정방형) |

## 변경 범위

| 파일 | 변경 |
|------|------|
| `crop-engine/lib/crop.js` | `cropToFrame()` — EYE_POSITION_RATIO 기반 배치 → `optimizeCrop()` 교체 |
| `crop-engine/lib/crop.js` | `fitSpecGeometry()` — 동일 로직 적용 |
| `crop-engine/lib/crop.js` | `HAIR_VOLUME_RATIO` 삭제 |
| `crop-engine/specs/formats.js` | crownMarginMin, bottomMarginMin 필드 추가 |

## 특허 가치

IDPASS 수동 보정을 산술 최적화로 자동화하는 방법 — 기존 특허에서:
- 고정 비율 배치는 흔함
- 규격 제약 만족하는 1차원 최적화로 자동 배치는 선행기술 미확인 (막내1 조사)
- + pitch 역산 보정 + 헤어라인 실측 = 3단 체인 → 핵심 신규성

## 검증 계획

작가님 테스트 사진 3장(IMG_4973~4975)으로:
1. 현행(43% 고정) 결과
2. optimizeCrop 결과
3. 눈 위치·상단 여백·하단 여백 비교
