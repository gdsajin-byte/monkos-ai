---
type: completion
date: 2026-05-20
device: iMac
agent: 막내1
portfolio: PF_CROP
order: ORDER_20260520_iMac쌍아_막내1_IDPASS_CropView_가이드이미지export.md
status: 완료
---

# COMPLETION: IDPASS CropView — 23개 사이즈별 가이드 이미지 export

> **[2026-05-20 16:50 KST] iMac/막내1 → iMac/쌍아, 작가님**

## 실행 결과

### 작업 1: CropEngine 배치 export 기능 ✅

`MonkosCropApp.swift`에 `--export-guides` CLI 모드 추가:

- `GuideExporter.run()` — async, 전 과정 자동
- **Vision 얼굴 감지** 1회 실행 → eye=(497,350), chin=618 (Node Canvas 추정 crown=55 대비 Vision 정밀)
- `CropEngine.crop()` 재활용 — 규격별 크롭 영역 계산 (웹 엔진 v2 이식 로직 그대로)
- `drawGuideOverlay()` — NSGraphicsContext로 최소 오버레이 렌더링
- `CropEngine.lastCropX/Y/W/H` → `mapY()` 좌표 변환

### 최소 가이드 오버레이 (지시서 준수)

| 그리는 것 | 구현 |
|----------|------|
| 정수리 라인 | 수평 점선 + "정수리" 라벨 |
| 턱 라인 | 수평 점선 + "턱" 라벨 |
| 프레임 테두리 | 2px accent 보더 |
| 얼굴 길이 치수 | 우측 디멘션 bracket + mm 표시 |
| 전체 사이즈 | 하단 너비 cm 라벨 |
| 스펙 배지 | 좌상단 "WxH mm" |

| 그리지 않는 것 | |
|---------------|---|
| 눈 라인 | 미포함 |
| 어깨 라인 | 미포함 |
| 코너 브래킷 | 미포함 |
| EYE % | 미포함 |
| 수치 패널/슬라이더/버튼 | 미포함 |

### 작업 2: 23장 일괄 생성 ✅

```
swift build → .build/debug/MonkosCrop --export-guides
23/23 generated
```

### 작업 3: WebP 변환 + MONK_kr 에셋 ✅

- `cwebp -q 85` → `MONK_kr/images/specs/guides/size-{W}x{H}.webp`
- PNG 12MB → WebP **760KB** (94% 절감)
- 기존 112개 개별 이미지 → **23개 사이즈별**로 통합

### template.js 수정 ✅

```html
<!-- 변경 전 -->
<img src="/images/specs/guides/korea-passport.webp">
<!-- 변경 후 -->
<img src="/images/specs/guides/size-35x45.webp">
```

동일 사이즈(35×45)인 26개 국가 여권이 모두 같은 이미지 공유 → CDN 캐시 효율 극대화.

### 작업 4: Step2 UI 연동

ContentView.swift Step2 변경은 별도 후속 지시 대기. 현 지시서에서는 가이드 이미지 생성 + 웹 연동까지 완료.

### 육안 검증 ✅

| 사이즈 | 비율 | 정수리 | 턱 | 치수 | 배지 | 판정 |
|--------|------|--------|-----|------|------|------|
| 35×45 | 3:4 ✅ | 정확 ✅ | 정확 ✅ | 표시 ✅ | 35×45mm ✅ | PASS |
| 51×51 | 1:1 ✅ | 정확 ✅ | 정확 ✅ | 22~35mm ✅ | 51×51mm ✅ | PASS |
| 50×70 | 5:7 ✅ | 정확 ✅ | 정확 ✅ | 31~36mm ✅ | 50×70mm ✅ | PASS |

## Node Canvas 대비 CropEngine Vision의 이점

| 항목 | Node Canvas (이전) | CropEngine Vision (현재) |
|------|-------------------|-------------------------|
| 얼굴 감지 | 수동 측정 (추정) | Apple Vision (정밀) |
| 크롭 로직 | 단순 비율 계산 | 웹 엔진 v2 이식 (동일 알고리즘) |
| 좌표 정확도 | HEAD TOP 오차 ~15px | 정수리·턱 Vision 기반 정확 |
| 이미지 수 | 112개 (국가×문서) | **23개 (고유 사이즈)** |
| 총 용량 | 4.0MB | **760KB** (81% 절감) |

## 산출물

| # | 파일 | 설명 |
|---|------|------|
| 1 | `apps/MonkosCrop/MonkosCrop/MonkosCropApp.swift` | `--export-guides` CLI 모드 추가 |
| 2 | `~/Desktop/CROP APP/guides/*.png` | 23장 PNG (리포 미커밋) |
| 3 | `MONK_kr/images/specs/guides/size-*.webp` | 23장 WebP (CF Pages 에셋) |
| 4 | `functions/specs/_lib/template.js` | size-WxH.webp 매핑 |
| 5 | PF_CITADEL 히스토리 | 1행 어펜드 |
