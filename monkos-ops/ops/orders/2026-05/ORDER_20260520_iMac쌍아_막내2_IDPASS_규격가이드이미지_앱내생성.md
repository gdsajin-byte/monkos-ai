---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내2
status: 대기
portfolio: PF_CROP
---

# 지시서: IDPASS 앱 — 규격별 가이드 이미지 생성 (크롭 엔진 활용)

> **[2026-05-20 15:44 KST] iMac/쌍아 → iMac/막내2**

## 배경

IDPASS 앱의 Step2(업로드) 화면에 **선택된 국가·문서 규격에 맞는 가이드 이미지**를 표시한다. 앱 내 크롭 엔진이 얼굴 좌표를 정확히 잡으니, 그 로직을 활용하여 샘플 사진(ref.jpg)에 최소한의 가이드 오버레이를 입힌 이미지를 생성한다.

이 이미지는 **monk.kr/specs/ 웹 페이지에서도 공용**으로 사용된다.

## 사전 컨텍스트 파악 (착수 전 필수)

1. **PF_CROP 히스토리**: `monkos-ops/ops/portfolios/PF_CROP/README.md`
2. **크롭 엔진 코드**: `apps/MonkosCrop/MonkosCrop/CropEngine.swift` — 얼굴 감지 + 좌표 계산 로직
3. **CropView 오버레이**: `apps/MonkosCrop/MonkosCrop/CropView.swift` — 가이드라인 렌더링
4. **규격 데이터**: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` — 202국 규격
5. **샘플 사진**: `~/Desktop/CROP APP/ref.jpg`
6. **Step2 시안 참조**: `~/Desktop/crop app/idpass_upload_v4.html` — 업로드 화면 레이아웃
7. **이 시안 스크린샷 참조**: Step2 업로드 탭 — 다크 HUD 배경 + 중앙에 가이드 이미지 1장 + 하단 CTA

## 핵심 요구사항

### 가이드 오버레이 — 필수 요소만

표시하는 것:
- **정수리 라인** — 수평 점선 + "정수리" 라벨
- **턱 라인** — 수평 점선 + "턱" 라벨
- **전체 프레임** — 가로×세로 테두리 (규격 비율)
- **얼굴 길이 치수** — 우측 디멘션 브래킷 ("32~36mm" 등)
- **전체 사이즈** — 좌측/하단 치수 ("3.5cm", "4.5cm")

**표시하지 않는 것**: 눈 라인, 어깨 라인, 코너 브래킷, 스펙 배지, 반투명 영역 하이라이트 — 전부 제거. 깔끔하게 필수만.

### 생성 방식

1. CropEngine으로 ref.jpg의 **실제 얼굴 좌표** 추출 (정수리, 턱, 얼굴 중심)
2. 각 규격(countries.jsonl)의 size_w_mm, size_h_mm, head_height에 맞게 **크롭 영역 계산**
3. 크롭된 이미지 위에 **최소 가이드 오버레이** 렌더링
4. PNG/WebP 출력

### 출력

**방안 A (Swift 스크립트)**: CropEngine을 커맨드라인에서 실행하여 이미지 일괄 생성
- `swift run MonkosCrop --generate-guides --output ~/Desktop/CROP\ APP/guides/`

**방안 B (HTML 시안 먼저)**: Canvas로 프로토타입 제작 → 작가님 확인 → Swift 본코딩
- `/tmp/idpass_guide_proto.html`

**방안 B를 먼저 실행** — HTML 시안으로 페이지뷰 확인 후 Swift 진행.

## 작업 1: HTML 시안 — 가이드 이미지 프로토

`/tmp/idpass_guide_proto.html`

- 다크 배경 (#05080E)
- 중앙에 가이드 이미지 (ref.jpg + 최소 오버레이)
- 3개 규격 나란히 (한국 여권 / 미국 비자 / 캐나다 여권)
- 오버레이: 정수리 라인 + 턱 라인 + 프레임 + 얼굴 길이 치수 + 전체 사이즈 — **이것만**

가이드라인 스타일:
- 색상: #00D4AA (IDPASS 액센트) — 다크 배경 위에서 잘 보임
- 점선: 가느다란 1px
- 라벨: 작은 글씨, 반투명 배경
- 치수: 깔끔한 디멘션 표기

## 작업 2: 작가님 확인 후 — Swift 이미지 생성 스크립트

작가님 승인 후 별도 지시서로 진행.

## ⚠️ 준수 조항

- CropEngine 코드 수정 금지 — 읽기 전용으로 좌표 로직만 참조
- ref.jpg는 리포에 커밋하지 않음
- 기존 ContentView.swift 수정 금지 (Step2 UI 적용은 별도 지시서)

## 산출물

1. `/tmp/idpass_guide_proto.html` — 3규격 프로토타입 (다크 HUD 스타일)
2. COMPLETION 보고서
