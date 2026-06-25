---
type: order
date: 2026-06-25
from: iMac/쌍아
to: iMac/막내
portfolio: PF_PORTAL
status: 완료
---

# 지시서: Specs v2 P1.5 — Gemini 좌표 보정 API

**[2026-06-25 16:53 KST]** iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → 작가님` 형식

## 배경
Specs v2 크롭 임베드(P1)에서 FaceMesh가 상반신/링크드인 화각 사진의 눈·턱·정수리를 부정확하게 잡는 문제 확인. FaceMesh 한계를 Gemini 시각 보정으로 보완한다.

## 목표
1. 백엔드에 `/api/idphoto/align` 엔드포인트 신설 — Gemini Flash가 사진을 보고 정수리·턱·눈 좌표를 반환
2. 클라이언트에서 FaceMesh 1차 감지 후, 결과가 ICAO 범위 밖이면 align API를 호출하여 좌표 보정
3. 보정된 좌표로 크롭 프레임 재배치

## 작업 내용

### 1. 백엔드: `/api/idphoto/align` 엔드포인트 (server.js)

기존 `/api/idphoto/precheck` (L289~353) 패턴을 참조.

```js
// POST /api/idphoto/align
// body: { image: base64, facemesh: { crown: {x,y}, chin: {x,y}, leftPupil: {x,y}, rightPupil: {x,y} } }
// → facemesh 좌표는 0~1 normalized (이미지 비율 기준)
```

**Gemini 프롬프트:**

```
You are a precise photo measurement AI. Given a portrait photo, identify the exact positions of these facial landmarks as normalized coordinates (0.0 to 1.0, where 0,0 is top-left):

1. crown_y: The very top of the head (top of hair/scalp), NOT the forehead
2. chin_y: The bottommost point of the chin
3. left_eye_y: Center of the left eye (from viewer's perspective)
4. right_eye_y: Center of the right eye
5. face_center_x: Horizontal center of the face

The client detected these positions but they may be inaccurate:
- Crown: y=${facemesh.crown.y}
- Chin: y=${facemesh.chin.y}
- Left eye: y=${facemesh.leftPupil.y}
- Right eye: y=${facemesh.rightPupil.y}

Please verify and correct these positions based on what you see in the actual image.

Respond in JSON only:
{"crown_y": float, "chin_y": float, "left_eye_y": float, "right_eye_y": float, "face_center_x": float, "confidence": float}
```

**설정:**
- 모델: `gemini-2.5-flash` (precheck과 동일)
- responseMimeType: `application/json`
- VertexAI 경유 (기존 패턴 그대로)

**응답:**
```json
{
  "crown_y": 0.12,
  "chin_y": 0.65,
  "left_eye_y": 0.38,
  "right_eye_y": 0.38,
  "face_center_x": 0.50,
  "confidence": 0.92
}
```

### 2. 클라이언트: 조건부 Gemini 보정 호출 (render-specs.js V2 스크립트)

사진 업로드 → FaceMesh 감지 완료 후 **아래 조건 중 하나라도 해당하면** align API 호출:

```js
var faceMm = (cropPts.chin.y - cropPts.crown.y) / MM;
var eyeRatio = ((cropPts.leftPupil.y + cropPts.rightPupil.y) / 2) / FH;
var needsAlign = faceMm < V2_SPEC.faceMin || faceMm > V2_SPEC.faceMax || eyeRatio < 0.40 || eyeRatio > 0.48;
```

즉 **isBlocked 조건과 동일** — ICAO 범위 밖일 때만 호출. 범위 안이면 FaceMesh 결과 그대로 사용 (레이턴시 절약).

**호출 흐름:**
1. FaceMesh 감지 → autoPlace → 수치 표시
2. `needsAlign`이면 "AI 보정 중..." 표시 → `/api/idphoto/align` 호출
3. 응답의 normalized 좌표를 이미지 픽셀 좌표로 변환 → `extractLandmarks` 형태로 재구성
4. `autoPlace` 재실행 → 크롭 프레임 재배치 → 수치 갱신
5. confidence가 0.5 미만이면 보정 결과 무시, FaceMesh 결과 유지 + "수동 조정 권장" 안내

**UX:**
- "AI 보정 중..." 스피너는 기존 `v2-facemesh-loading` 재활용, 텍스트만 변경
- 보정 완료 후 배지에 "AI 보정됨" 표시 (선택)

### 3. FaceMesh 좌표 → normalized 변환

align API로 보낼 때 FaceMesh의 원본 normalized 좌표(0~1)를 그대로 전달. `extractLandmarks` 이전의 raw 좌표를 보존해야 함.

현재 코드에서 `detectFaceLandmarks`가 반환하는 `raw`가 이미 normalized(0~1)이므로:

```js
var alignBody = {
  image: uploadedBase64,
  facemesh: {
    crown: { y: raw[FM_IDX.LEFT_PUPIL].y - (raw[FM_IDX.CHIN].y - raw[FM_IDX.LEFT_PUPIL].y) },
    chin: { y: raw[FM_IDX.CHIN].y },
    leftPupil: { y: raw[FM_IDX.LEFT_PUPIL].y },
    rightPupil: { y: raw[FM_IDX.RIGHT_PUPIL].y }
  }
};
```

### 4. 보정 좌표 → autoPlace 재실행

align 응답을 받으면:

```js
var corrected = {
  crown: { x: alignResult.face_center_x * natW, y: alignResult.crown_y * natH },
  chin: { x: alignResult.face_center_x * natW, y: alignResult.chin_y * natH },
  leftPupil: { x: imgLandmarks.leftPupil.x, y: alignResult.left_eye_y * natH },
  rightPupil: { x: imgLandmarks.rightPupil.x, y: alignResult.right_eye_y * natH },
  leftCheek: imgLandmarks.leftCheek,   // 볼 좌표는 FaceMesh 유지
  rightCheek: imgLandmarks.rightCheek,
  tlCorner: /* 재계산 */, trCorner: /* 재계산 */,
  blCorner: /* 재계산 */, brCorner: /* 재계산 */
};
cropPts = autoPlace(corrected, natW, natH);
renderCrop();
```

모퉁이 4점(`tlCorner` 등)은 `extractLandmarks`의 보간 공식을 corrected crown/chin 기준으로 재계산.

## ⚠️ 준수 조항
- 헌법 4조 1항: API 키 하드코딩 금지. 기존 VertexAI 인증 패턴(`process.env.PROJECT_ID`) 사용.
- 헌법 4조 3항: 외부 표기는 "MONKOS". Gemini 엔진명 노출 금지 (프론트엔드에 "AI 보정"으로만 표시).
- ch2: HTML `kebab-case`, JS `camelCase`
- 배포 시 `deploy.sh prod` 경유 필수 (ch5 2조).
- V2 URL: `https://monkos.ai/specs/kr-passport` (1-segment, `/kr/` 접두어 없음).
- **⚠️ COMPLETION 보고서 필수 (ch7 1조)**: 완료 시 `monkos-ops/ops/reports/2026-06/COMPLETION_20260625_iMac막내N_SPECSv2_P15_Gemini좌표보정.md` 생성.

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | `PF_PORTAL` |
| 마무리 | `배포` |
| 산출물 | server.js + render-specs.js 수정 + **COMPLETION 보고서** |
| 문서 유형 | `COMPLETION` |
| 세션 로그 | `[log] 태그 커밋` |
