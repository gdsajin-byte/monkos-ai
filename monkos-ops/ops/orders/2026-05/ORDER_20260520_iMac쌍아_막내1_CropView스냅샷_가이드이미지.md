---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CROP
---

# 지시서: CropView 스냅샷 방식 — 가이드 이미지 23장

> **[2026-05-20 17:05 KST] iMac/쌍아 → iMac/막내1**

## 문제

지금까지 4회 시도 전부 실패. 원인: CropView가 화면에 정확히 그리는 렌더링을 **새로 복제**하려다 좌표계 변환에서 계속 틀림.

## 해결: 새로 그리지 말고, 기존 뷰를 캡처해라

CropView는 이미 화면에 **완벽하게** 렌더링하고 있다. 그 뷰를 **NSView 스냅샷**으로 이미지 캡처하면 된다. 새로운 렌더링 코드 0줄.

## 구현

### 핵심 코드 (macOS, NSView 기반)

```swift
// 1. CropView에 규격 데이터 세팅
cropView.loadImage(refImage)
cropView.applySpec(spec)  // 정수리/턱/가이드 자동 배치됨

// 2. 불필요한 UI 숨김 (수치 패널, 슬라이더, 버튼 등)
cropView.setGuideOnlyMode(true)  // 정수리+턱 라인+치수만 남김

// 3. 뷰를 이미지로 캡처
let bitmapRep = cropView.bitmapImageRepForCachingDisplay(in: cropView.bounds)!
cropView.cacheDisplay(in: cropView.bounds, to: bitmapRep)
let image = NSImage(size: cropView.bounds.size)
image.addRepresentation(bitmapRep)

// 4. PNG 저장
let pngData = bitmapRep.representation(using: .png, properties: [:])!
try pngData.write(to: outputURL)
```

### guideOnlyMode

CropView에 모드 플래그 1개만 추가:
- `true`: 정수리 라인 + 턱 라인 + 프레임 테두리 + 얼굴 길이 치수 + 전체 사이즈만 표시
- `false`: 기존 전체 UI (눈/어깨/수치패널/슬라이더 등)

기존 draw 코드에서 `if !guideOnlyMode { ... }` 로 감싸면 됨. **기존 렌더링 로직 수정 없음.**

### 배치 실행

```swift
let specs = loadUniqueSpecs()  // 23개 고유 사이즈
for spec in specs {
    cropView.applySpec(spec)
    cropView.setGuideOnlyMode(true)
    // 뷰 레이아웃 갱신 대기
    cropView.layoutSubtreeIfNeeded()
    // 스냅샷
    let image = snapshot(of: cropView)
    save(image, to: "guides/size-\(spec.sizeDisplay).png")
}
```

### 출력

```
~/Desktop/CROP APP/guides/
  ├── size-35x45.png → cwebp → MONK_kr/images/specs/guides/size-35x45.webp
  ├── size-51x51.png → ...
  └── (23장)
```

## ⚠️ 절대 하지 말 것

- **CropView의 기존 draw 코드를 복제하거나 새로 작성하지 마라** — 이게 4번 실패의 원인
- Core Graphics로 텍스트를 직접 그리지 마라
- 좌표 변환을 수동으로 하지 마라
- **화면에 보이는 그대로를 캡처하는 것만 해라**

## 검증

- 35x45.webp: IDPASS 크롭 화면 스크린샷과 **동일한** 정수리/턱 위치
- 51x51.webp: 동일
- 글씨 반전 없음, 크롭 비율 정확

## 산출물

1. CropView에 `guideOnlyMode` 플래그 추가 (최소 변경)
2. 배치 export 스크립트
3. 23장 WebP → MONK_kr 에셋
4. COMPLETION 보고서
