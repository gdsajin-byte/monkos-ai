---
type: order
date: 2026-07-09
device: M1
agent: 쌍아
target: 막내
portfolio: PF_SPECS
priority: P1
status: 대기
---

# 지시서: precheck 게이트 강화 + 소견 코드화 + UX 정리

**[2026-07-09 04:40 KST]** M1/쌍아 → 막내

## 배경

InsightFace 2단 완료(SCRFD bbox + 106점 결정론 확보)로 precheck에서 활용 가능한 수치가 늘었다.
현행 precheck는 얼굴 검출 여부 + 밝기 + 극단 각도만 거르고, 크기·위치 제한이 너무 느슨(5%)하여
전신·치우침·잘림 사진이 통과 → fit/generate에서 품질 저하.

또한 fit의 Gemini 비전 퇴출(2단)로 "전문가 AI 소견" 문구가 사라짐 → 코드 기반 소견으로 교체 필요.

## 설계 원칙

```
precheck = "이 사진으로 작업할 수 있는가" (물리적 가능성) → 거부만 표시, 통과 시 무언
postcheck = "이 결과가 규격에 맞는가" (규격 적합성) → 수치+근거 표시 (기존 judge)
```

---

## Task 1 — precheck 게이트 강화

파일: `portal/server.js` `/api/idphoto/precheck` 엔드포인트 (line ~447 부근)

### 1-1. face_ratio 게이트 (크기)

현행 `fbH < 100` (절대 px) → **비율 기반으로 교체**:

```javascript
const faceRatio = fbH / norm.height;
if (measurable && faceRatio < 0.20) { measurable = false; reason = 'face_too_small'; }
if (measurable && faceRatio > 0.50) { measurable = false; reason = 'face_too_close'; }
```

### 1-2. 위치 게이트 (상단·하단·좌우)

bbox 기준 여백 체크 — 기존 코드 `faceBox` 산출 직후에 추가:

```javascript
// 상단 잘림: 이마가 이미지 맨 위에 붙음
if (measurable && y1 / norm.height < 0.05) { measurable = false; reason = 'head_cropped'; }
// 하단 잘림: 턱이 이미지 맨 아래에 붙음
if (measurable && (norm.height - y2) / norm.height < 0.05) { measurable = false; reason = 'chin_cropped'; }
// 좌우 치우침: 얼굴 중심이 이미지 중앙에서 15% 이상 이탈
const faceCenterX = (x1 + x2) / 2;
if (measurable && Math.abs(faceCenterX - norm.width / 2) / norm.width > 0.15) { measurable = false; reason = 'off_center'; }
```

### 1-3. 과노출 게이트

현행 `bright < 40` (어두움)에 추가 — 과노출 차단:

```javascript
if (measurable && bright > 240) { measurable = false; reason = 'too_bright'; }
```

### 1-4. 각도 게이트 제거

현행 `roll > 30 || yaw > 0.35` 차단을 **제거**한다. 각도 판정은 postcheck(fit judge)로 이관.

```javascript
// 삭제: if (measurable && (Math.abs(rollDeg) > 30 || Math.abs(yawRatio) > 0.35)) { ... }
// rollDeg, yawRatio는 여전히 산출 + 로그 기록 (관측용)
```

---

## Task 2 — 클라이언트 거부 문구 + 통과 시 무언 처리

파일: `portal/lib/cms/render-specs.js` (line ~2431 부근)

### 2-1. reason 매핑표 갱신

```javascript
var reasons = {
  no_face: '얼굴을 찾지 못했어요. 정면 얼굴이 나온 사진을 올려주세요.',
  multiple_faces: '사진에 여러 명이 있어요. 1인 사진을 올려주세요.',
  face_too_small: '얼굴이 너무 작아요. 가슴 위까지 나오게 찍어주세요.',
  face_too_close: '너무 가까워요. 조금 멀리서 찍어주세요.',
  head_cropped: '머리 위가 잘렸어요. 머리 전체가 나오게 찍어주세요.',
  chin_cropped: '턱 아래가 잘렸어요. 어깨가 보이게 찍어주세요.',
  off_center: '얼굴이 한쪽으로 치우쳐 있어요. 중앙에서 찍어주세요.',
  too_dark: '사진이 너무 어두워요. 밝은 곳에서 찍어주세요.',
  too_bright: '사진이 너무 밝아요. 직사광선을 피해주세요.',
};
```

### 2-2. 통과 시 무언 처리

현행:
```javascript
summary.textContent = '측정 가능한 사진이에요. 계속 진행해주세요.';
```

변경 — **통과 시 안내 문구 없이 바로 다음 단계로**:
```javascript
// 통과 시 체크 영역 표시 생략, 바로 proceed
proceedToPay();
```

기존 `checkActions` 표시 + "계속 진행" 버튼 단계를 생략. 거부 시에만 사유 표시 + "다시 올리기" 버튼.

---

## Task 3 — fit 소견 코드화 (Gemini 비전 대체)

파일: `portal/server.js` fit 엔드포인트 — 기존 `let vision = null;` 직후에 추가

Gemini가 하던 소견을 metrics 수치 기반 코드 매핑으로 교체:

```javascript
// 코드 소견 — metrics 기반 (Gemini 비전 대체)
const codedNote = (function() {
  if (!frame || !lines) return null;
  const m = metricsFromFit(frame, lines, spec);
  if (m.topMm < 2) return '머리 위 여백이 부족합니다. 헤어 볼륨이 큰 경우 다른 사진을 권장합니다.';
  if (m.topMm > 6) return '머리 위 공간이 넉넉합니다.';
  if (m.bottomMm < 4) return '어깨선 여백이 좁습니다.';
  return null; // 정상 범위 — 소견 없음
})();
if (codedNote) vision = { note: codedNote };
```

클라이언트 `v2-fit-note` 표시 로직(`전문가 AI —` 접두사)은 그대로 유지 가능하되, 접두사를 변경:

파일: `portal/lib/cms/render-specs.js` (line ~2680 부근)
```javascript
// 변경: '전문가 AI — ' → 그냥 소견만
n.textContent = expertMsg;
```

---

## Task 4 — postcheck에 각도 게이트 추가

파일: `portal/server.js` fit 엔드포인트 — `judgeMetrics` 또는 응답 생성 부근

fit 응답의 `gate` 필드(InsightFace 106점 기반, 이미 산출됨)를 judge에 반영:

```javascript
// gate 기반 postcheck (fit 결과에 추가)
const poseCheck = {};
if (gate) {
  poseCheck.roll = { value: gate.rollDeg, ok: Math.abs(gate.rollDeg) <= 15 };
  poseCheck.yaw = { value: gate.yawRatio, ok: Math.abs(gate.yawRatio) <= 0.20 };
  poseCheck.eyeOpen = { value: Math.min(gate.eyeOpenL || 1, gate.eyeOpenR || 1), ok: Math.min(gate.eyeOpenL || 1, gate.eyeOpenR || 1) > 0.15 };
  poseCheck.mouthOpen = { value: gate.mouthOpen, ok: (gate.mouthOpen || 0) < 0.15 };
}
```

응답 JSON에 `poseCheck` 포함 → 클라이언트 fit 시어터에서 뱃지로 표시. 클라이언트 뱃지 렌더링은 기존 `renderFitVerdict`에 추가:

파일: `portal/lib/cms/render-specs.js` `renderFitVerdict` 함수 내:
```javascript
if (d.poseCheck) {
  if (d.poseCheck.roll) badge('기울기', Math.abs(d.poseCheck.roll.value).toFixed(0) + '°', d.poseCheck.roll.ok ? 'pass' : 'fail');
  if (d.poseCheck.eyeOpen && !d.poseCheck.eyeOpen.ok) badge('눈', '감김', 'fail');
  if (d.poseCheck.mouthOpen && !d.poseCheck.mouthOpen.ok) badge('입', '벌림', 'warn');
}
```

---

## 검증

| 케이스 | 기대 |
|--------|------|
| 레퍼런스 셀카 (~40%) | precheck 무언 통과 → fit 뱃지 전부 pass |
| 전신 사진 (~10%) | precheck 거부: "얼굴이 너무 작아요" |
| 극단 클로즈업 (~60%) | precheck 거부: "너무 가까워요" |
| 정수리 잘린 셀카 | precheck 거부: "머리 위가 잘렸어요" |
| 좌로 치우친 사진 | precheck 거부: "한쪽으로 치우쳐 있어요" |
| 어두운 야간 사진 | precheck 거부: "너무 어두워요" |
| 15° 기울인 셀카 | precheck 통과 → fit postcheck roll 뱃지 경고 |
| 기존 통과 사진 전체 | **회귀 없음** 확인 필수 |

---

## ⚠️ 준수 조항

- deploy.sh 경유 배포 (ch5 2조)
- portal만 변경 — crop-engine 변경 없음
- 범위 밖 작업 금지: fit 기하 로직, 크롭 로직 변경 금지
- 기존 `side_angle`, `occluded` reason 코드는 클라이언트 매핑표에 유지 (하위호환)
- `too_dark` 임계 40은 현행 유지 (실측 검증된 값)
