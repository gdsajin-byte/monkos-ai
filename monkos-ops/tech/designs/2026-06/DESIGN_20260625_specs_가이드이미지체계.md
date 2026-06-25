---
type: design
date: 2026-06-25
device: iMac
agent: 민아
status: 진행
---

# DESIGN — specs 가이드 이미지 체계 (인종 사진 + 측정선 오버레이)

> **[2026-06-25 15:57 KST]** iMac/민아 → 작가님
> 목적: specs 1,284p 가이드 이미지 교체. 정수리·턱선 점선 + 전체 규격 실선을 국가별로 정확히 표현.
> 원칙: **사진(인종 베이스) ⊥ 측정선(국가 규격) 분리** — 측정선은 코드 SVG 오버레이로, 사진에 굽지 않음.

## 1. 왜 분리하나
- 측정선을 사진에 구우면: 국가(204) × 인종(7) = 1,400+장 폭발.
- 분리하면: 사진 N종(인종) + 측정선은 1,284p가 코드로 동적 오버레이. 점선/실선이 픽셀 단위로 정확.

## 2. 프레임 좌표 표준 (전 인종 사진 공통 — 측정선 정합의 전제)
| 항목 | 값 | 비고 |
|------|----|----|
| 캔버스 | 1000 × 1200 px (5:6) | 어깨까지 넉넉, 국가별 크롭 박스 여유 |
| 정수리 crown Y | 180 px | 모든 사진 고정 |
| 턱 chin Y | 660 px | crown~chin = 480px = 머리높이 기준 |
| 눈높이 Y | ~400 px | |
| 어깨선 Y | ~1080 px | |
| 수평 중심 X | 500 px | 정면 대칭 |
| 배경 | 순백 #FFFFFF | seamless, 그림자 없음 |

→ **이 좌표가 고정이라야** 측정선 SVG 하나가 전 사진에 정확히 맞는다. AI 생성 시 프롬프트로 강제.

## 3. 인종 6종 생성 프롬프트 (트래픽 MVP = 3그룹 × 남녀)
**공통 베이스**:
`Front-facing passport/ID photo, neutral expression, mouth closed, eyes looking straight at camera, pure seamless white background (#FFFFFF), flat even studio lighting with no shadows, head and shoulders visible, crown of head near top, chin at vertical center, perfectly centered and symmetric, photorealistic, sharp focus, no accessories, plain dark top.`

| # | 그룹 | 성별 | 추가 프롬프트 | 우선 |
|---|------|------|-------------|------|
| 1 | 동아시아 | 여 | East Asian woman, late 20s, natural light makeup, black hair neatly pulled back | 🔴 |
| 2 | 동아시아 | 남 | East Asian man, late 20s, short neat black hair, clean-shaven | 🔴 |
| 3 | 백인/유럽 | 여 | Caucasian/European woman, late 20s, natural makeup, hair tied back | 🔴 |
| 4 | 백인/유럽 | 남 | Caucasian/European man, late 20s, short hair, clean-shaven | 🔴 |
| 5 | 동남아시아 | 여 | Southeast Asian woman, late 20s, natural makeup, dark hair tied back | 🟠 |
| 6 | 동남아시아 | 남 | Southeast Asian man, late 20s, short dark hair, clean-shaven | 🟠 |

**2차 확장(+8)**: 남아시아·중동(MENA)·사하라이남 아프리카·라틴 × 남녀.

## 4. 측정선 SVG 오버레이 명세
**입력(국가 규격)**: `{ photoW_mm, photoH_mm, headMin_mm, headMax_mm }` (specs-data.json에서)
**출력**: 사진 위 SVG 레이어
- **실선** — 전체 규격 박스(photoW:photoH 비율) + 외곽 치수 라벨(예 "3.5cm" 가로, "4.5cm" 세로). 색: 진회색 #333.
- **점선** — 정수리·턱 수평 점선 2줄 + 머리높이 라벨(예 "3.2~3.6cm"). 색: 브랜드 보라 #6b4eff.
- **좌표 계산**: photoH_mm → 캔버스 px 매핑. 머리높이 점선 Y = crown(180)·chin(660) 기준에 국가 head_mm 비율 적용.
- 참조 스타일: 작가님 과거 스튜디오 이미지(미국비자 5×5, 머리높이 2.5~3.5cm 점선) — 그 명료도 재현.

## 5. 적용 (코드)
- `render-specs.js`: 현재 정적 `<img>` → ① 국가→인종 매핑으로 베이스 사진 선택 ② SVG 오버레이 컴포넌트 합성.
- **국가→인종 매핑 테이블** 신설(204국 → 6~7그룹). continent 기반 1차 + 예외 보정.

## 6. 제작 순서
1. **6장 생성**(트래픽 3그룹×남녀) → 작가님 컨펌 (사진 전문가 검수)
2. SVG 오버레이 컴포넌트 구현 (막내)
3. 국가→인종 매핑 테이블
4. 2차 확장 8장 → 총 14장 글로벌 풀커버

## 7. 결정 필요 (작가님)
- 성별: 인종당 남녀 2장 vs 대표 1장 → MVP 장수(6 vs 3)
- 1차 인종 범위: 트래픽 3그룹 vs 즉시 7그룹
- 측정선 스타일: 본 명세(실선 회색+점선 보라) vs 작가님 과거 이미지 그대로

## 8. 측정 정본 연결 (작가님 지적 반영 — 임의 수치 금지)
측정선은 임의로 그리지 않고 **기존 측정 정본 2소스를 결합**한다. 데모(§ show_widget)의 임의 수치는 폐기, 아래 정본으로 대체.

**① 방법론 정본 = `public/crop/crop.js`**
- anchor 공식(정규화): `chin.y=0.714`, `eye.y=0.508`, **`crown = eye − (chin − eye)`** (눈~턱 1:1 반전). 머리높이 = 프레임 높이의 ≈41.2%.
- 색상 판정: `faceMin`/`faceMax`(mm), `faceTarget`, `eyeRatio` 0.40~0.48(허용)·0.43~0.45(최적).
- 종횡비: `FW = FH × wMm/hMm`, `mm당px = FH/hMm`.
- crop.js SPECS는 **용도 2종만**: passport(wMm35·hMm45·face32~36·target34·413×531px) / id(30×40·face24~32·target28·354×472px).

**② 국가값 정본 = `lib/cms/specs-data.json`**
- 국가 204개 세부: `size`("35×45mm"), `headHeight`("32~36mm"), `pixels`, `dpi`. **문자열 → {wMm,hMm,headMin,headMax} 파싱** 필요.

**③ 정합 결과**: 측정선 crown/chin 위치 = 베이스 사진 crown/chin = crop.js anchor 비율 → **셋이 동일 공식이라 가이드 선 = 실제 크롭 100% 일치.**

**④ 구현**: crop 측정 로직을 **공유 모듈**(예 `lib/crop-spec.js`)로 추출 → 크롭앱 + specs 가이드 이미지가 함께 import. 단일 정본.

**⑤ §2 프레임 좌표 보정**: 베이스 사진도 crop.js anchor 비율로 생성(chin 71.4%, crown 도출식). 임의 crown180/chin660 → 정본 비율로 교체.
