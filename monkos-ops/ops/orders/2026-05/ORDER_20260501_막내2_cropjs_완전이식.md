---
type: order
date: 2026-05-01
from: iMac/쌍아
to: 막내2
subject: "crop.js 완전 이식 — 8포인트 체계 + SVG 오버레이 + autoPlace 통째로"
status: 대기
---

# [2026-05-01 17:40 KST] iMac/쌍아 → 막내2

## 문제 (작가님 직접 지적)

기존 crop.js의 핵심 로직을 부분만 이식하고 나머지를 무시했다. 8포인트 체계, SVG 오버레이 렌더링, autoPlace 좌표 변환이 통째로 빠져 있다.

## 필수 선행 작업

**`monkos_AI/crop-app/public/crop.js` 전체를 처음부터 끝까지 읽어라.** 부분 참조가 아니라 전체 이해 후 이식.

## 기존 crop.js 핵심 구조 (이것을 이식)

### 1. 8포인트 랜드마크 체계

```
FM_IDX = {
  LEFT_PUPIL: 159,    // 좌눈 중심
  RIGHT_PUPIL: 386,   // 우눈 중심
  CHIN: 152,          // 턱
  LEFT_CHEEK: 234,    // 얼굴 좌측 윤곽
  RIGHT_CHEEK: 454,   // 얼굴 우측 윤곽
}
```

+ 산출 포인트:
- `crown`: 정수리 추정 (eyeY - (chinY - eyeY))
- `tlCorner, trCorner, blCorner, brCorner`: 얼굴 바운딩 코너 4개

**총 8포인트**가 크롭 배치 + 오버레이 + 판정의 기준.

### 2. autoPlace() — 자동 배치 (735~784행)

```
1. raw landmarks(이미지 자연 좌표) 입력
2. cover 스케일 계산 (object-fit: cover 기준)
3. toCover()로 프레임 좌표 변환
4. imgScale: 얼굴이 faceTarget mm에 맞도록
5. imgPos.y: 눈이 프레임 상단 43%에 오도록
6. imgPos.x: 얼굴 중심이 프레임 수평 중앙에 오도록
7. 모든 랜드마크를 프레임 좌표(pts)로 변환하여 반환
```

**핵심**: autoPlace()가 반환하는 `pts`가 이후 모든 오버레이·판정에 사용되는 좌표. raw 좌표를 직접 사용하면 안 됨.

### 3. SVG 오버레이 렌더링 (renderUI, 280~410행)

기존 crop.js는 프레임 위에 SVG를 겹쳐서 모든 가이드라인을 그림:

```
- pupilL, pupilR: 눈 포인트 (원)
- guideline: 눈 높이 수평선
- crossH, crossV: 프레임 십자선
- maskTop, maskBottom: 정수리/턱 영역 마스크
- dimLineV, dimLineTopH, dimLineBotH: 치수선
- crownIndicator: 정수리 위치 표시
```

모든 좌표는 `pts.*` (autoPlace 반환값)에서 가져옴.

### 4. 3단계 색상 판정 (Green/Yellow/Red)

```
얼굴 크기:
  Green: faceMin+1 ~ faceMax-1 (최적)
  Yellow: faceMin ~ faceMin+1, faceMax-1 ~ faceMax (경계)
  Red: 범위 밖

눈 높이:
  Green: 43~45%
  Yellow: 40~43%, 45~48%
  Red: 범위 밖
```

### 5. CSS transform 렌더링 (291행)

```js
photo.style.transform = `translate(calc(-50% + ${imgPos.x}px), calc(-50% + ${imgPos.y}px)) scale(${imgScale})`;
```

### 6. Canvas 크롭 출력 (exportCrop, 430~470행)

CSS transform을 Canvas에서 정확히 재현:
```js
ctx.translate(FW/2 + imgPos.x, FH/2 + imgPos.y);
ctx.scale(imgScale, imgScale);
ctx.translate(-FW/2, -FH/2);
// object-fit: cover 재현
const coverScale = Math.max(FW/natW, FH/natH);
ctx.drawImage(img, (FW-dw)/2, (FH-dh)/2, dw, dh);
```

## 이식 작업

### R1. crop.js 전체 읽기
`monkos_AI/crop-app/public/crop.js` 전체를 읽고 구조를 파악하라.

### R2. 8포인트 + autoPlace 완전 이식
현재 app.js의 부분 이식을 폐기하고, crop.js의 로직을 완전히 이식:
- `extractLandmarks()` → 8포인트 전부 추출
- `autoPlace()` → imgScale, imgPos, **pts(프레임 좌표)** 전부 반환
- `renderUI()` → pts 기반 SVG 오버레이 전체

### R3. SVG 오버레이 이식
crop.js의 SVG 가이드라인을 HUD 다크 디자인에 맞게 이식:
- 눈 포인트, 십자선, 치수선, 정수리/턱 마스크
- 색상은 HUD 토큰 사용 (--accent, --warn, --fail)
- crop.js의 Green/Yellow/Red 3단계 판정 색상 유지

### R4. Canvas 크롭 출력 검증
crop.js의 exportCrop 로직과 현재 app.js의 performCrop이 정확히 일치하는지 확인. 불일치 시 crop.js 기준으로 교체.

### R5. UX 흐름 — 수치 먼저, 조정은 선택

```
사진 업로드 → autoPlace 자동 배치
  ↓
[Step 3 크롭 화면 진입]
  - 사진이 프레임에 "탁" 안착된 상태
  - 수치 패널 즉시 표시: 눈 높이 43%, 얼굴 34.0mm, 정수리 위치 등
  - SVG 오버레이 (눈 점, 가이드라인) 표시
  ↓
[대부분 여기서 끝] → "다음" 버튼으로 배경 제거 진행
  ↓
[맞지 않을 때] → "조정하기" 버튼 터치
  - 정수리 핀 활성화 (드래그 가능)
  - 스케일 보정 활성화
  - 위치 드래그 활성화
  - 조정 후 수치 실시간 갱신
```

- 수치 패널은 자동 배치 직후 즉시 표시 (검수 버튼 뒤가 아님)
- "MONKOS 검수" 연출은 조정 완료 후 최종 확인용 (선택적)
- 조정 UI는 디폴트 숨김, "조정하기" 선택 시에만 활성화

### R6. 검증
1. 눈 포인트가 **눈(홍채) 위에 정확히** 위치
2. 자동 배치로 눈이 43% 근처에 앵커링
3. 얼굴 크기가 faceTarget에 맞게 스케일링
4. 드래그 보정 후 오버레이가 함께 이동
5. Canvas 출력이 화면 프리뷰와 정확히 일치

## ⚠️

- `monkos_AI/crop-app/` 수정 금지 (읽기만)
- **부분 이식 금지** — 통째로 이해하고 이식
