---
type: order
date: 2026-05-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_SPECS
---

# SPECS 규격 다이어그램 — SVG 실루엣 → 실 가이드 이미지 교체

## 배경

현재 specs 상세 페이지(`/specs/{slug}`)의 규격 다이어그램이 SVG 실루엣(원+타원 플레이스홀더)으로 렌더링 중. 철창이가 디자인한 페이지뷰에 맞춰 실제 가이드 이미지를 넣는다.

가이드 이미지 25장이 `~/Desktop/CROP APP/guides/`에 있으며, 앱 번들용으로 압축한 JPEG 버전이 `apps/MonkosCrop/MonkosCrop/Resources/guides/`에도 있다.

## 작업

### 1. 가이드 이미지 웹용 배치

`~/Desktop/CROP APP/guides/` 원본 25장을 웹 서빙용으로 변환:

- 리사이즈: 가로 600px (웹 표시 충분)
- 포맷: WebP (용량 최적화) + JPEG 폴백
- 배치: `monkos_AI/portal/public/images/guides/{width}x{height}.webp`

사이즈 패턴 25종:
```
22x32, 24x30, 30x40, 31x41, 33x48, 35x35, 35x45, 35x50,
36x47, 37x52, 38x45, 38x48, 38x51, 40x40, 40x45, 40x50,
40x52, 40x60, 43x55, 45x45, 45x55, 50x50, 50x60, 50x70, 51x51
```

### 2. render-specs.js 수정

`render-specs.js` 526~536행 영역 — SVG 실루엣을 가이드 이미지로 교체:

**현재** (528~531행):
```html
<svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor">
  <ellipse cx="60" cy="45" rx="30" ry="38"/>
  <ellipse cx="60" cy="140" rx="50" ry="45"/>
</svg>
```

**변경**:
```html
<img src="/images/guides/${widthMM}x${heightMM}.webp"
     alt="${country} ${type} 규격 가이드 ${widthMM}×${heightMM}mm"
     width="200" loading="lazy"
     onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor" style="display:none">
  <ellipse cx="60" cy="45" rx="30" ry="38"/>
  <ellipse cx="60" cy="140" rx="50" ry="45"/>
</svg>
```

- specData의 size 필드에서 가로(mm)×세로(mm) 파싱하여 이미지 파일명 매핑
- 이미지 없는 사이즈는 SVG 폴백 유지
- alt 텍스트에 국가명+규격+사이즈 포함 (SEO)

### 3. 사이즈 파싱 로직

specs-data.json의 size 필드 포맷이 다양함:
- `"3.5 × 4.5cm"` → `35x45`
- `"35 × 45 mm"` → `35x45`
- `"2 × 2 inch (51 × 51mm)"` → `51x51`
- `"50 × 70 mm"` → `50x70`

mm 단위로 정규화하여 `{w}x{h}` 파일명에 매핑하는 헬퍼 함수 작성.

### 4. O/X 비교 영역 이미지도 동일 적용

상세 페이지의 O/X 비교 영역(적합/반려)에도 현재 SVG 실루엣 사용 중. 여기도 가이드 이미지 또는 Before/After 이미지로 교체 가능하면 교체.

## 배포

- `monkos_AI/portal/deploy.sh prod`

## 검증

```bash
curl -s https://monkos.ai/specs/korea-passport | grep -i 'guides/'
# → /images/guides/35x45.webp 포함 확인

curl -sI https://monkos.ai/images/guides/35x45.webp
# → 200 OK
```

## ⚠️ 준수 조항

- 배포는 반드시 deploy.sh 경유 (법률 ch5 2조)
- 기존 SVG 폴백 유지 (이미지 없는 규격 대응)
- 원본 이미지 출처: IDPASS 앱 가이드 이미지 (자체 생성물, 저작권 문제 없음)
