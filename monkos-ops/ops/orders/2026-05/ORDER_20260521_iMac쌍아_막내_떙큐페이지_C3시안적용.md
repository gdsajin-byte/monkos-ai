---
type: order
date: 2026-05-21
from: iMac/쌍아
to: iMac/막내
subject: "떙큐 페이지 C3 시안 적용 — Before/After 슬라이더 + UI 리디자인"
status: 대기
portfolio: PF_CROP
---

# 지시서: 떙큐 페이지 C3 시안 적용

> **[2026-05-21 14:52 KST] iMac/쌍아 → iMac/막내**

## 배경

클로드 디자인이 제작한 떙큐 페이지 C3 시안을 현재 앱의 thanksView에 적용한다.
핵심: Before/After 슬라이더 카드 + MONKOS AI 유도 강화.

## 디자인 참조

`~/Desktop/CROP APP/IDPASS Thanks C3.html` — React 컴포넌트. SwiftUI로 이식.

## ⚠️ 준수 조항

- **PF_CROP 선행 참조** (ch7 6조)
- ContentView.swift의 `thanksView` (1112~1232줄) 교체 대상
- Step 5 (`step5View`, 1008~1098줄)는 현행 유지 — thanksView만 변경

---

## 현재 thanksView 구조 (교체 대상)

```
1. IDPASS 로고 + SAVED ✓ 배지           ← 유지 (이미 시안과 동일)
2. 크롭 결과 사진 + "저장됐어요." + 규격   ← 유지 (소폭 조정)
3. AI Studio Promo (텍스트 카드)          ← 교체 → Before/After 슬라이더
4. "다른 규격으로 또 만들기" 버튼          ← 유지
5. © 2026 IDPASS 푸터                    ← 유지
```

## 변경 사항

### 1. Before/After 슬라이더 카드 (신규)

기존 AI Studio Promo (1159~1206줄) → C3 슬라이더 카드로 교체.

#### 구조

```
┌─────────────────────────────────────┐
│  [BEFORE]         슬라이더    [AFTER · AI] │
│  ┌─────────────┬──│──────────────┐  │
│  │  Before 이미지  │  After 이미지   │  │
│  │  (흑백+어둡게)  │  (원본 컬러)    │  │
│  └─────────────┴──│──────────────┘  │
│                   ○ (드래그 핸들)     │
│                                      │
│  MONKOS · AI STUDIO    ← DRAG TO COMPARE │
│  밀어서, 차이를 보세요.                │
│  한 컷 $1. AI가 끝까지 정돈.          │
│  [monkos.ai 보기 →]                  │
└─────────────────────────────────────┘
```

#### SwiftUI 구현 가이드

- `@State private var sliderPos: CGFloat = 0.5`
- `DragGesture`로 좌우 드래그 → sliderPos 업데이트
- Before 이미지: `.grayscale(0.85).brightness(-0.22)` 필터
- After 이미지: `.clipShape()`로 sliderPos 기준 우측만 표시
- 슬라이더 핸들: 흰색 세로 라인 + 36pt 원형 버튼 `‹›`
- BEFORE/AFTER 라벨: 좌상단/우상단 고정
- auto-sweep: `onAppear`에서 `withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true))` + `sin()` 진동
- 사용자 터치 시 auto-sweep 중지

#### 하단 텍스트

- "MONKOS · AI STUDIO" — 모노스페이스, 보라색
- "← DRAG TO COMPARE" — 우측 정렬, V1.muted
- "밀어서, **차이를 보세요.**" — 그래디언트 텍스트 (보라→핑크)
- "한 컷 $1. AI가 끝까지 정돈." — V1.muted
- `[monkos.ai 보기 →]` — 보라색 버튼 (V1.purple)

#### 다국어 키 추가 (SpecData.swift i18n)

```
"slider_drag": "밀어서, " / "Swipe to " / "スワイプして、"
"slider_accent": "차이를 보세요." / "see the difference." / "違いを見てください。"
"slider_sub": "한 컷 $1. AI가 끝까지 정돈." / "One shot $1. AI handles the rest." / "1枚$1。AIが仕上げます。"
"slider_compare": "← DRAG TO COMPARE" / "← DRAG TO COMPARE" / "← DRAG TO COMPARE"
```

### 2. Before/After 이미지 리소스

앱 번들에 2장 추가:

| 파일 | 설명 | 위치 |
|------|------|------|
| `slider_before.jpg` | 셀카 원본 (가로 와이드 크롭, 눈 중심) | Resources/ |
| `slider_after.jpg` | AI 보정 후 (동일 크롭 기준) | Resources/ |

**⚠️ 이미지는 작가님이 수동 제작하여 Resources/에 배치. 막내는 코드에서 이 파일명을 참조만.**

이미지가 아직 없으면 placeholder로 `be_f_1.jpg`(before), `pass_f_1.jpg`(after) 기존 리소스 사용.

### 3. SNS 아이콘 행 (신규)

슬라이더 카드 아래, "다른 규격으로 또 만들기" 위에 SNS 6개:

```
[ IG ] [ X ] [ YT ] [ TT ] [ TG ] [ Threads ]
```

- SF Symbol 또는 텍스트 아이콘
- 다크 카드 스타일 (V1.card 배경, 둥근 사각)
- 각각 URL 연결 (추후 세팅, 지금은 빈 버튼)

---

## 현행 유지 사항

- Step 5 (step5View) 전체 — 변경 없음
- 다운로드 버튼 로직 — Step 5에서 처리 (thanksView 진입 시 이미 저장 완료)
- IDPASS 로고 + SAVED ✓ — 현행 유지 (이미 시안과 일치)
- "저장됐어요." + 크롭 결과 표시 — 현행 유지
- 규격 표시: `🇮🇳 51×51mm · sourceName` — 현행 `standard` 대신 `sourceName` 우선 표시

---

## 완료 기준

1. 슬라이더 좌우 드래그 동작 확인
2. auto-sweep 애니메이션 동작 확인
3. Before: 흑백+어둡게, After: 원본 컬러
4. 보라색 CTA 버튼 표시
5. SNS 6개 아이콘 표시
6. 다국어 키 3개 추가 (ko/en/ja)
7. `swift build` 성공
8. 커밋: `[feat] IDPASS 떙큐 페이지 C3 시안 적용 — Before/After 슬라이더 + SNS`
