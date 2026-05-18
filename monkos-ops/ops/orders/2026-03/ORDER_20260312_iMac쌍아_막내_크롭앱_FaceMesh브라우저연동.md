---
type: ORDER
date: 2026-03-12
from: iMac/쌍아
to: 막내
subject: 크롭앱 FaceMesh 브라우저 연동 — 사진 업로드 시 자동 랜드마크 추출
priority: high
category: 구현
---

# 지시서: 크롭앱 FaceMesh 브라우저 연동

> **[2026-03-12 11:59 KST] iMac/쌍아 → 막내**

---

## 배경

크롭앱 vanilla JS 전환이 완료되었다 (crop.html + crop.js + crop.css). 현재 사진을 업로드하면 이미지는 교체되지만, 오버레이 좌표는 SAMPLE_POINTS 하드코딩값을 사용한다.

**목표**: 사진 업로드 시 브라우저에서 FaceMesh를 실행하여 실제 랜드마크를 추출하고, 오버레이 좌표를 자동 배치한다.

## 참조 파일 (반드시 Read)

### 현재 크롭앱
- `monkos_AI/idphoto-kr/public/crop.html`
- `monkos_AI/idphoto-kr/public/crop.js`
- `monkos_AI/idphoto-kr/public/crop.css`

### crop-engine 서버측 FaceMesh 참조
- `monkos_AI/crop-engine/lib/face-detect.js` — 서버측 FaceMesh 구현 (랜드마크 인덱스, 정수리 추산 로직 참조)

### 분석 보고서
- `monkos-ops/ops/reports/2026-03/REPORT_20260312_막내3_크롭앱_프로토분석.md` — FaceMesh 브라우저 실행 분석 (3-3절)

---

## 구현 범위

### 1. MediaPipe FaceMesh CDN 로드

- `@mediapipe/face_mesh` + `@mediapipe/camera_utils` CDN에서 로드
- **번들링 없음** — `<script>` 태그로 CDN 직접 로드
- crop.html의 `<head>` 또는 `<body>` 하단에 추가

```html
<!-- MediaPipe FaceMesh -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" crossorigin="anonymous"></script>
```

### 2. FaceMesh 초기화

- crop.js에 FaceMesh 초기화 함수 추가
- 설정:
  - `maxNumFaces: 1`
  - `refineLandmarks: true` (눈동자 포함 478점)
  - `minDetectionConfidence: 0.5`
  - `minTrackingConfidence: 0.5`
- 모델 파일은 CDN에서 자동 로드 (WASM/WebGL)
- 초기화 시 로딩 인디케이터 표시 (첫 로드 ~5MB, 이후 캐시)

### 3. 사진 업로드 → FaceMesh 실행 → 좌표 추출

**플로우:**
```
사진 업로드 (file input)
  → Image 객체 로드
  → FaceMesh.send(image)
  → onResults 콜백에서 478 랜드마크 수신
  → 핵심 7포인트 추출
  → 모퉁이 4점 계산
  → 정수리 추산 (눈~턱 1:1 반전)
  → pts 객체 갱신 → render()
```

### 4. 핵심 랜드마크 추출 (face-detect.js 참조)

| 포인트 | FaceMesh 인덱스 | 용도 |
|--------|----------------|------|
| leftPupil | #159 | 좌눈 중심 |
| rightPupil | #386 | 우눈 중심 |
| chin | #152 | 턱 최하단 |
| leftCheek | #234 | 좌측 윤곽 |
| rightCheek | #454 | 우측 윤곽 |
| leftContour(상) | #54 | 좌상 모퉁이 경유 |
| rightContour(상) | #284 | 우상 모퉁이 경유 |

### 5. 좌표 변환 — FaceMesh → 프레임 좌표

FaceMesh는 **정규화 좌표 (0~1)** 반환. 이를 프레임 좌표로 변환:

```javascript
// FaceMesh 결과 → 이미지 픽셀 좌표
const imgX = landmark.x * imgWidth;
const imgY = landmark.y * imgHeight;

// 이미지 좌표 → 프레임 내 좌표 (imgPos, imgScale 반영)
// 사진이 프레임 중앙 기준으로 배치되므로 변환 필요
```

**중요**: 현재 사진은 CSS `object-fit: cover`로 프레임에 맞춰져 있고, `imgPos`와 `imgScale`로 이동/확대됨. FaceMesh 좌표를 프레임 내 좌표로 정확히 매핑해야 함.

### 6. 모퉁이 4점 계산

FaceMesh에서 직접 대응하지 않는 4개 모퉁이(tlCorner, trCorner, blCorner, brCorner)는 실측점에서 보간:

```javascript
// 이마 좌우 모퉁이: #54/#284 또는 광대~정수리 보간
tlCorner = { x: leftCheek.x + (crown.x - leftCheek.x) * 0.3, y: crown.y + (leftCheek.y - crown.y) * 0.4 }
trCorner = { x: rightCheek.x + (crown.x - rightCheek.x) * 0.3, y: crown.y + (rightCheek.y - crown.y) * 0.4 }
// 턱 좌우 모퉁이
blCorner = { x: leftCheek.x + (chin.x - leftCheek.x) * 0.3, y: leftCheek.y + (chin.y - leftCheek.y) * 0.6 }
brCorner = { x: rightCheek.x + (chin.x - rightCheek.x) * 0.3, y: rightCheek.y + (chin.y - rightCheek.y) * 0.6 }
```

또는 FaceMesh #54/#284/#172/#397 인덱스를 직접 활용 (test-cropapp-ui.js 참조).

### 7. 정수리 추산

```javascript
const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
const crownY = eyeCenterY - (chin.y - eyeCenterY); // 눈~턱 1:1 반전
```

### 8. 초기 사진 배치 (자동 스케일/위치)

FaceMesh 좌표 추출 후, 사진을 프레임에 맞게 자동 배치:

- **스케일**: 얼굴 크기가 디폴트(34mm)에 맞도록 imgScale 자동 산출
- **위치**: 눈이 프레임 상단 43%에 오도록 imgPos.y 자동 산출
- 자동 배치 후 사용자가 드래그/스케일로 미세 조정

### 9. 로딩 UI

- FaceMesh 첫 로드 시 **로딩 인디케이터** 표시 (모델 다운로드 ~5MB)
- "얼굴 분석 중..." 텍스트 + 스피너
- 분석 완료 후 자동으로 오버레이 표시

### 10. 에러 처리

- **얼굴 미감지**: "얼굴을 감지하지 못했습니다. 정면 사진을 업로드하세요." 안내
- **다중 얼굴**: 첫 번째 얼굴만 사용 (maxNumFaces: 1)
- **WebGL 미지원**: "이 브라우저에서는 얼굴 분석을 지원하지 않습니다." 안내 → SAMPLE_POINTS 폴백

### 11. SAMPLE_POINTS 유지

- 샘플 이미지(기본 SVG)에서는 여전히 SAMPLE_POINTS 사용
- FaceMesh는 실제 사진 업로드 시에만 실행
- 샘플 → 업로드 전환 시 FaceMesh 실행, 리셋 시 SAMPLE_POINTS 복원

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `crop.html` | MediaPipe CDN script 태그 추가, 로딩 인디케이터 HTML |
| `crop.js` | FaceMesh 초기화, 좌표 추출, 좌표 변환, 자동 배치, 에러 처리 |
| `crop.css` | 로딩 인디케이터 스타일 |

**기존 기능 유지** — 드래그, 스케일, 모달, 3단계 색상 등 기존 로직 변경 없음.

---

## ⚠️ 준수 조항

- 헌법 제1조: 타임스탬프 `date` 명령으로 취득
- 헌법 제2조: 완료 보고 형식 준수
- 법률 6장 1조: 기본 브랜치 `main`
- 헌법 제6조: CDN URL 외 API 키/비밀 정보 사용 금지

---

**— iMac/쌍아 지시 완료 —**
