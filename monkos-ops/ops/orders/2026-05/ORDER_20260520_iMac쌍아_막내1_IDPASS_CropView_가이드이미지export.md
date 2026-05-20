---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CROP
---

# 지시서: IDPASS CropView — 23개 사이즈별 가이드 이미지 export

> **[2026-05-20 16:44 KST] iMac/쌍아 → iMac/막내1**

## 배경

IDPASS Step2(업로드) 화면을 심플하게 가져간다: **규격 가이드 이미지 1장 + 갤러리 버튼. 끝.** 규정카드/체크리스트/콜아웃 전부 제거. 가이드 이미지가 모든 것을 말해주는 구조.

이 가이드 이미지는 **CropView(크롭 엔진)가 실제로 잡은 결과물**에서 최소 오버레이만 남긴 것이다. Node Canvas로 추정하는 방식은 폐기. 동일 이미지를 monk.kr/specs/ 웹 페이지에서도 사용한다.

## 사전 컨텍스트 파악

1. **CropEngine.swift**: `apps/MonkosCrop/MonkosCrop/CropEngine.swift` — Vision 얼굴 감지 + 좌표 계산
2. **CropView.swift**: `apps/MonkosCrop/MonkosCrop/CropView.swift` — 오버레이 렌더링 (정수리/눈/턱/어깨 라인 등)
3. **countries.jsonl**: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` — 규격 데이터
4. **ref.jpg**: `~/Desktop/CROP APP/ref.jpg` — 샘플 인물 사진 (1024×1024)
5. **IDPASS 크롭 화면 스크린샷**: 미국 51×51 크롭 결과 — 정수리/턱/EYE 라인 + FACE 33.0mm + 하단 수치 패널. **이 수준의 정확도가 기준**

## 23개 고유 사이즈

```
35x45 (26건), 51x51 (13건), 40x50 (12건), 40x60 (12건),
30x40 (7건), 50x50 (7건), 45x45 (3건), 33x48 (2건),
50x70 (2건), 50x60 (2건), 36x47 (2건), 40x40 (2건),
24x30, 22x32, 35x50, 45x55, 40x52, 31x41,
38x48, 40x45, 37x52, 38x45, 35x35
```

## 작업 1: CropEngine에 배치 export 기능 추가

Swift 스크립트 또는 CropEngine 확장:

```swift
// 입력: ref.jpg + 사이즈(w_mm, h_mm, head_min, head_max)
// 처리: Vision으로 얼굴 감지 → 규격에 맞게 크롭 영역 계산
// 출력: 크롭된 이미지 + 최소 가이드 오버레이 → PNG 저장
```

### 최소 가이드 오버레이 (이것만 그린다)

- **정수리 라인** — 수평 점선 + "정수리" 라벨 (IDPASS 액센트 #00D4AA)
- **턱 라인** — 수평 점선 + "턱" 라벨
- **프레임 테두리** — 규격 비율 border
- **얼굴 길이 치수** — 우측 디멘션 ("32~36mm" 등)
- **전체 사이즈** — 하단 너비 + 좌측 높이 ("3.5cm", "4.5cm")
- **스펙 배지** — 하단 중앙 "35×45mm · ICAO 9303"

### 그리지 않는 것

눈 라인, 어깨 라인, 코너 브래킷, EYE %, 수치 패널, 슬라이더, 버튼 — 전부 제거.

## 작업 2: 23장 일괄 생성

```bash
# 빌드 & 실행 (커맨드라인 모드)
cd apps/MonkosCrop
swift build
.build/debug/MonkosCrop --export-guides \
  --input ~/Desktop/CROP\ APP/ref.jpg \
  --output ~/Desktop/CROP\ APP/guides/ \
  --specs countries.jsonl
```

또는 앱 내에서 "Export Guides" 버튼을 임시 추가해서 실행해도 됨. 방법은 막내 판단.

### 출력

```
~/Desktop/CROP APP/guides/
  ├── 35x45.png
  ├── 51x51.png
  ├── 40x50.png
  ├── 40x60.png
  ...
  └── 35x35.png  (23장)
```

## 작업 3: monk.kr 에셋으로 복사 + template.js 연동

```bash
# WebP 변환 + 복사
for f in ~/Desktop/CROP\ APP/guides/*.png; do
  name=$(basename "$f" .png)
  cwebp -q 85 "$f" -o MONK_kr/images/specs/guides/size-${name}.webp
done
```

template.js에서 문서의 size_display로 이미지 매핑:
```html
<img src="/images/specs/guides/size-35x45.webp" alt="35×45mm 여권사진 규격 가이드">
```

기존 112장 개별 이미지 → **23장 사이즈별 이미지로 교체**.

## 작업 4: IDPASS Step2 연동

Step2 업로드 화면에서 선택된 규격의 사이즈에 맞는 가이드 이미지를 표시:

```swift
// ContentView.swift Step2 영역
let guideImage = UIImage(named: "guide-\(spec.size)")
// 또는 번들 리소스에서 로드
```

심플 레이아웃:
- "사진 규격 가이드" 제목
- 가이드 이미지 1장 (중앙)
- 사이즈 + 표준명 라벨
- "갤러리에서 선택" CTA 버튼

## ⚠️ 준수 조항

- CropEngine 핵심 로직 수정 금지 — export용 메서드만 추가
- ref.jpg 리포 커밋 금지
- 생성된 가이드 이미지(webp)는 MONK_kr에 커밋
- Step2 UI 변경은 이 지시서 범위 내 (규정카드 관련 코드 제거 가능)

## 산출물

1. CropEngine export 기능 (Swift)
2. `~/Desktop/CROP APP/guides/*.png` — 23장
3. `MONK_kr/images/specs/guides/size-*.webp` — 23장 (WebP 변환)
4. `functions/specs/_lib/template.js` 수정 — 사이즈별 이미지 매핑
5. ContentView.swift Step2 — 가이드 이미지 표시 (심플 레이아웃)
6. COMPLETION 보고서
