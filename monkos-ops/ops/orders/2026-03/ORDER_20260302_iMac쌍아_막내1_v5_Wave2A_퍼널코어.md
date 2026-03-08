---
type: order
id: ORDER_20260302_iMac쌍아_막내1_v5_Wave2A_퍼널코어
date: "2026-03-02 17:24 KST"
from: 쌍아
to: 막내1
priority: P0
status: pending
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
  - monkos-ops/03_개발/MONKOS_퍼널_UI기획안_v5_쌍아전달.md
  - monkos-ops/ops/reports/REPORT_20260302_막내1_퍼널v5_프론트엔드_충돌분석.md
---

# 지시서: v5 Wave 2-A — 퍼널 코어 (prep.html + prep.js)

> **[2026-03-02 17:24 KST] iMac/쌍아 → 막내1**

## 역할 선언
> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `iMac/막내1 → iMac/쌍아` 형식

---

## 배경

Wave 1 완료 (94b334b). config.js V5_OPTIONS + shared.js store 11필드 계약 확정.
이제 퍼널 핵심인 prep.html/js를 v5 기획안 기준으로 **전면 재작성**한다.

**병렬 작업 중**: 막내2(server.js), 막내3(charge.html) 동시 진행. 파일 충돌 없음.

---

## 임무

`monkos_AI/idphoto-kr/public/` 하위의 **prep.html**과 **prep.js** 두 파일을 전면 재작성하라.

---

## 목표 구조: 9스텝 키오스크 → 4페이지 선형 퍼널

### 현행 (v4)
```
step0(용도) → step1(연령) → step2(성별) → step3(의상) → step4(의상컬러)
→ step5(넥타이) → step6(헤어) → step7(배경) → step8(표정) → FINAL(확인)
```

### v5 (기획안 §3)
```
1p: 규격 선택 (passport / id)
2p: 성별 + 연령 (한 페이지에 2그룹)
3p: 스타일 (clothing → 서브옵션들 + hair + bgColor, 아코디언 UI)
4p: CONFIRM (선택 요약 → 촬영 시작)
```

---

## 1. prep.html 재작성

### 삭제 대상
- `#kiosk-dots` (스텝 도트 네비게이션)
- `#kiosk-body` (9스텝 컨테이너)
- `#kiosk-footer` (이전/다음 버튼)
- `#credit-modal` (충전 모달 — charge.html로 분리됨)

### 신규 구조
```html
<!-- 프로그레스 바 (4단계) -->
<div id="prep-progress">
  <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
  <span class="progress-text" id="progressText">1 / 4</span>
</div>

<!-- 페이지 컨테이너 -->
<div id="prep-pages">
  <section id="page-format" class="prep-page active">...</section>
  <section id="page-profile" class="prep-page">...</section>
  <section id="page-style" class="prep-page">...</section>
  <section id="page-confirm" class="prep-page">...</section>
</div>

<!-- 하단 네비게이션 -->
<div id="prep-nav">
  <button id="btnPrev" onclick="prevPage()">이전</button>
  <button id="btnNext" onclick="nextPage()">다음</button>
</div>
```

### 헤더/메타/폰트/토스스크립트
기존 prep.html의 `<head>` 섹션(L1-37) 그대로 유지. body 내부만 교체.

---

## 2. prep.js 재작성

### 삭제 대상 (전부)
- `STEP_KEYS`, `TOTAL_STEPS`, `FINAL_STEP`
- `selections` 객체
- `OPTIONS` 객체 (v4 옵션 데이터)
- `skipConditions`, `filterMap`, `defaultMap` 엔진
- `renderStep()`, `kioskSelect()`, `goNext()`, `goBack()`
- `renderFinal()`, `confirmFinal()`

### 신규 import
```javascript
import {
  store, Monk, sharedInit, saveSelections, clearSelections,
  saveSessionData, loadSessionData, navigateTo, SCHEMA_VERSION
} from './shared.js';
import {
  V5_OPTIONS, CLOTHING_BY_AGE, HAIR_VISIBLE_AGES,
  PASSPORT_FORCED_BG, PHOTO_SPECS
} from './config.js';
```

### 신규 구조

```javascript
// ─── 상태 ───
let currentPage = 0; // 0=format, 1=profile, 2=style, 3=confirm
const PAGES = ['format', 'profile', 'style', 'confirm'];

// ─── 페이지 라우팅 ───
function showPage(idx) { ... }  // active 클래스 토글 + 프로그레스 업데이트
function nextPage() { ... }     // 유효성 검증 → 다음 페이지
function prevPage() { ... }     // 이전 페이지

// ─── 1p: 규격 선택 ───
function renderFormatPage() { ... }
// V5_OPTIONS.format → 2카드 (passport/id)
// 선택 시 store.format = val

// ─── 2p: 성별 + 연령 ───
function renderProfilePage() { ... }
// V5_OPTIONS.gender → 2카드 (f/m)
// V5_OPTIONS.age → 4카드 (baby/child/teen/adult)
// 선택 시 store.gender = val, store.age = val

// ─── 3p: 스타일 (아코디언) ───
function renderStylePage() { ... }
// 조건부 표시 규칙 (SCHEMA §2-3):
//   영유아/어린이: clothing(default/change) + clothingColor(child) — hair 숨김
//   중고생/성인:   clothing(default/casual/suit) + hair — CLOTHING_BY_AGE 참조
//   passport: bgColor=white 고정 — PASSPORT_FORCED_BG
//
// 아코디언 그룹:
//   [의상] clothing → 서브옵션 (clothingColor / suitColor+shirtColor+tieColor+tiePattern)
//   [헤어] hair (HAIR_VISIBLE_AGES만)
//   [배경] bgColor (passport면 고정)

// ─── 4p: CONFIRM ───
function renderConfirmPage() { ... }
// 선택 요약 테이블 표시
// "촬영 시작" 버튼 → startShooting()

// ─── 촬영 시작 ───
function startShooting() {
  saveSelections();  // shared.js — sessionStorage에 11키 저장
  navigateTo('camera.html');
}

// ─── 초기화 ───
async function init() {
  await sharedInit();
  renderFormatPage();
  renderProfilePage();
  renderStylePage();
  showPage(0);
}
init();
```

---

## 3. 조건부 표시 규칙 (핵심 로직)

SCHEMA_v5_확정.md §2-3~2-5 정본 기준:

### clothing 허용값
```javascript
// config.js CLOTHING_BY_AGE 참조
const allowed = CLOTHING_BY_AGE[store.age]; // baby/child: [default, change], teen/adult: [default, casual, suit]
```

### clothing 서브옵션 분기
```
clothing="default" → 서브옵션 없음
clothing="change"  → clothingColor (child 4색: skyblue/pink/lemon/green)
clothing="casual"  → clothingColor (adult 4색: beige/blue/wine/green)
clothing="suit"    → suitColor + shirtColor + tieColor(+tiePattern)
```

### hair 표시
```javascript
const showHair = HAIR_VISIBLE_AGES.includes(store.age); // teen/adult만
```

### bgColor 강제
```javascript
if (store.format === 'passport') store.bgColor = PASSPORT_FORCED_BG; // white 고정
```

---

## 4. UI 가이드라인 (기획안 §3 참고)

- 카드 선택 UI: 터치 친화적, 최소 48px 높이
- 선택된 카드: accent 보더 + 체크 아이콘
- 아코디언: 열림/닫힘 토글, 선택값 미리보기 표시
- 프로그레스 바: 연속형 (1/4, 2/4, 3/4, 4/4)
- CONFIRM 페이지: 선택값을 한눈에 볼 수 있는 요약 리스트
- **CSS는 app.css에 추가** (인라인 스타일 최소화)

---

## 수정 범위

| 파일 | 작업 |
|------|------|
| **prep.html** | 전면 재작성 (body 내부) |
| **prep.js** | 전면 재작성 |
| **app.css** | v5 prep 관련 스타일 추가 (기존 키오스크 CSS 교체) |

**수정 금지**: shared.js, config.js, camera.js, result.js, server.js, charge.js

---

## 검증 체크리스트

| # | 점검 항목 |
|---|----------|
| 1 | 1p: passport/id 2개 카드 렌더링 + 선택 시 store.format 반영 |
| 2 | 2p: gender 2카드 + age 4카드 렌더링 + store 반영 |
| 3 | 3p: age=baby/child 시 clothing에 casual/suit 안 보임 |
| 4 | 3p: age=teen/adult 시 clothing에 change 안 보임 |
| 5 | 3p: clothing=suit 시 suitColor+shirtColor+tieColor+tiePattern 표시 |
| 6 | 3p: format=passport 시 bgColor=white 고정 (선택 불가) |
| 7 | 3p: age=baby/child 시 hair 섹션 숨김 |
| 8 | 4p: CONFIRM에 선택값 요약 표시 |
| 9 | "촬영 시작" 클릭 시 saveSelections() 호출 + camera.html 이동 |
| 10 | `node --check prep.js` 문법 오류 없음 |
| 11 | app.css에 v5 prep 스타일 존재 |

---

⚠️ **준수 조항**
- 헌법 1조: 타임스탬프 시스템 취득
- 헌법 2조: 완료 보고 형식 준수
- 헌법 6조: API 키/시크릿 생성 금지
- 헌법 9조: I2I 정체성 보존 — 프론트에서 직접 해당 없으나 스타일 옵션이 서버 프롬프트에 영향
- **정본**: SCHEMA_v5_확정.md > 기획안 > 본 지시서. 충돌 시 SCHEMA 우선.
- **다른 막내 파일 수정 절대 금지** — shared.js, config.js, server.js, result.js, charge.js

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | prep.html + prep.js + app.css (3파일) |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
