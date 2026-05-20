---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CROP
---

# 지시서: CropEngine.crop() 규격별 비율 보정 + 가이드 이미지 23장 재생성

> **[2026-05-20 17:29 KST] iMac/쌍아 → iMac/막내1**

## 배경

현재 CropEngine.crop()이 `33.0/45.0` 고정 비율로 크롭한다. 이 값은 35×45(한국 여권)에서만 맞고, 51×51(미국 비자), 50×70(캐나다), 40×60(사우디) 등에서는 얼굴이 과대하게 잡힌다.

IDPASS 앱의 cropAutoPlace() (SpecData.swift:750~755)는 이미 **규격별 faceTarget**을 사용해서 좋은 비율을 내고 있다. CropEngine.crop()도 이걸 따라가야 한다.

## 사전 컨텍스트 파악 (착수 전 필수 Read)

1. **PF_CROP README**: `monkos-ops/ops/portfolios/PF_CROP/README.md`
2. **CropEngine.swift**: `apps/MonkosCrop/MonkosCrop/CropEngine.swift` — 수정 대상
3. **SpecData.swift**: `apps/MonkosCrop/MonkosCrop/SpecData.swift` — cropAutoPlace() (750행~), faceTarget 계산 (214행~)

## 작업 1: CropEngine.crop() 비율 보정

`apps/MonkosCrop/MonkosCrop/CropEngine.swift` 수정:

### 변경 전 (하드코딩 상수)

```swift
private let EYE_POSITION_RATIO: CGFloat = 0.43
private let FACE_TARGET_RATIO: CGFloat = 33.0 / 45.0
private let FACE_MIN_RATIO: CGFloat = 32.0 / 45.0
```

### 변경 후 (spec 기반 동적 계산)

crop() 함수 내부에서 spec의 값을 사용:

```swift
// 기존 전역 상수 삭제하고 crop() 내부에서 계산
let faceTargetRatio = spec.faceTarget / spec.heightMM
let faceMinRatio = spec.faceMin / spec.heightMM
let eyePositionRatio: CGFloat = spec.heightMM >= 60 ? 0.42 : 0.43
```

crop() 함수 내 참조 변경:
- `FACE_TARGET_RATIO` → `faceTargetRatio`
- `FACE_MIN_RATIO` → `faceMinRatio`
- `EYE_POSITION_RATIO` → `eyePositionRatio`

`HAIR_MARGIN_MIN`, `HAIR_VOLUME_RATIO`, `BOTTOM_MIN_RATIO`는 그대로 유지.

### 기대 결과

| 규격 | 변경 전 (고정) | 변경 후 (동적) |
|------|-------------|-------------|
| 35×45 | 73.3% | 73.3% (동일) |
| 51×51 | 73.3% | **64.7%** |
| 50×70 | 73.3% | **50.0%** |
| 40×60 | 73.3% | **58.3%** |

## 작업 2: 빌드 확인

```bash
cd apps/MonkosCrop && swift build
```

35×45, 51×51, 50×70 최소 3종 시각 확인 — 각각 얼굴 비율이 달라야 정상.

## 작업 3: 가이드 이미지 23장 재생성

기존 --export-guides CLI로 재생성:

```bash
.build/debug/MonkosCrop --export-guides \
  --input ~/Desktop/CROP\ APP/ref.jpg \
  --output ~/Desktop/CROP\ APP/guides/ \
  --specs countries.jsonl
```

## 작업 4: WebP 재변환 + MONK_kr 배치

```bash
for f in ~/Desktop/CROP\ APP/guides/*.png; do
  name=$(basename "$f" .png)
  cwebp -q 85 "$f" -o MONK_kr/images/specs/guides/size-${name}.webp
done
```

국가별 WebP(112건)도 재생성 필요하면 기존 스크립트로 재실행.

## 작업 5: 오버레이 스타일 보정

이전 결과물에서 오버레이가 파란/보라색이었다. IDPASS 액센트 **#00D4AA (초록)**으로 통일:

- 정수리/턱 점선: #00D4AA
- 라벨 텍스트: #00D4AA
- 치수 텍스트: #00D4AA
- 스펙 배지: #00D4AA 배경 + 흰색 텍스트

## ⚠️ 준수 조항

- **PF_CROP README 선행 참조 필수** (ch7 6조)
- CropEngine.crop() 크롭 로직(좌표 계산 흐름)은 유지 — **상수만 동적으로 교체**
- macOS CIImage 기반 렌더링 유지 (CGContext 직접 사용 금지)
- ref.jpg 리포 커밋 금지

## 산출물

1. CropEngine.swift 수정 (상수→spec 기반 동적)
2. `~/Desktop/CROP APP/guides/*.png` — 23장 (비율 보정됨)
3. `MONK_kr/images/specs/guides/size-*.webp` — 23장 재변환
4. swift build 성공 확인
5. COMPLETION 보고서
