# 지시서: photolab 5페이지 물리 분리 — 실행

[2026-02-18 22:04 KST] M1/쌍아 → M1/막내 1호

---
type: task
from: M1/쌍아
to: M1/막내 1호
date: 2026-02-18 22:04 KST
status: open
priority: high
tags: [리팩토링, photolab, 페이지분리, 코딩]
---

## 역할 선언
> **너는 M1 "막내 1호"다. 쌍아가 아니다.**
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

## 배경

`PAGE_SPLIT_ANALYSIS.md`와 `flowchart_page_split.html`이 완성되었다. 이제 실제 코드를 분리한다.

**이전 플로우차트 보완 지시(API 라우팅)는 이 지시서에 통합. 별도 실행 불필요.**

## 목표

현재 SPA 구조(index.html + app.js)를 **5개 독립 페이지**로 물리 분리한다. 엔진 호출(코칭 REST 등)은 이번 범위 밖. **프론트엔드 구조 분리만 수행.**

## 작업 경로

`MONK_kr/ai_lab/photolab/` (★0원칙 작업장)

## 참조 문서 (반드시 읽을 것)

1. `MONK_kr/ai_lab/photolab/PAGE_SPLIT_ANALYSIS.md` — 분석 보고서
2. `MONK_kr/ai_lab/photolab/flowchart_page_split.html` — 플로우차트
3. `MEMORY.md` — 인프라 구조, 리팩토링 전략

## 산출물 파일 구조

```
MONK_kr/ai_lab/photolab/
├── index.html          ← 준비실 (진입점)
├── camera.html         ← 촬영실
├── result.html         ← 분석실
├── thankyou.html       ← 수령처
├── options.html        ← 옵션 N
├── shared.js           ← 공통 로직 (app.js에서 추출)
├── prep.js             ← 준비실 전용
├── camera.js           ← 촬영실 전용
├── result.js           ← 분석실 전용
├── thankyou.js         ← 수령처 전용
├── options.js          ← 옵션 N 전용
├── monk.js             ← 프레임워크 (Screen/WS 제거)
├── config.js           ← 설정 (변경 최소)
└── app.css             ← 스타일 (단일 유지)
```

## 작업 순서

### 1단계: 현재 코드 백업

```bash
cp index.html index_spa_backup.html
cp app.js app_spa_backup.js
cp monk.js monk_spa_backup.js
```

### 2단계: shared.js 추출

`app.js`에서 **전 페이지 공통 로직**을 `shared.js`로 추출:
- Store 초기 상태 정의 (공통 부분만: user, style, gender, age, step 등)
- `initFromUrlToken()`
- `initCredits()`
- `fetchLatestCredits()`
- `visibilitychange` 리스너
- `checkInappBrowser()`
- `showDesktopBlocker()`
- `showCreditModal()` / `closeCreditModal()`
- `buyCreditsKR()`
- `initFromTossResult()`
- `openExternal()`
- window 노출 (공통 onclick 함수)

shared.js 말미에 `init()` 함수: 공통 초기화 순서 실행.

### 3단계: 각 페이지 JS 추출

`app.js`에서 각 화면 전용 로직을 분리:

**prep.js**: `selectStyle`, `selectGender`, `selectAge`, `checkProfileComplete`, `updateConfirmMessage`, `startShooting`
- `startShooting()`: sessionStorage에 style/gender/age 저장 → `location.href = 'camera.html'`

**camera.js**: `capturePhoto`, `selectStyleInCamera`, `syncStyleChips`, `showCoaching`, `speakKo`, `toggleVoice`, `initVoice`
- 페이지 로드 시: sessionStorage에서 style/gender/age 읽기
- `capturePhoto()`: 원본 base64를 sessionStorage에 저장 → `location.href = 'result.html'`
- 코칭 관련: **기존 WS 코칭 코드는 스텁으로 대체** (REST 코칭은 별도 태스크에서 구현)
  - `startCoachingLoop()` 빈 함수 or console.log 스텁
  - 코칭 없이도 촬영→결과 흐름은 동작해야 함

**result.js**: `confirmAndGenerate`, `showQCResult`, `showGenerateError`, `showQCError`, `downloadResult`, `showPreview`, `retakePhoto`
- 페이지 로드 시: sessionStorage에서 captured/style/gender/age 읽기 → 원본 표시
- `retakePhoto()`: `location.href = 'camera.html'`
- `showPreview()`: cropped를 sessionStorage에 저장 → `location.href = 'thankyou.html'`

**thankyou.js**: `saveToPhotos`, `openTelegram`
- 페이지 로드 시: sessionStorage에서 cropped 읽기 → 사진 표시
- 옵션 N 이동: `location.href = 'options.html'` 또는 직접 링크

**options.js**: 네비게이션 함수들
- 추가 촬영 → `location.href = 'index.html'`
- 포털 → `location.href = 'https://monk.kr'`
- 텔레그램 이벤트 → 외부 링크

### 4단계: HTML 분리

현재 `index.html`에서:
- **공통 요소** (header, credit-modal, inapp-banner, desktop-blocker): 모든 HTML에 복사
- **prep-screen 섹션** → `index.html`에 남기기
- **camera-area + controls + capture-canvas 섹션** → `camera.html`로 이동
- **result-overlay 섹션** → `result.html`로 이동
- **thankyou-screen 섹션** → `thankyou.html`로 이동
- **options.html**: 신규 작성 (서비스 카드 목록 — 간단한 버튼 나열)

각 HTML의 `<script>` 태그:
```html
<script src="config.js"></script>
<script src="monk.js"></script>
<script src="shared.js"></script>
<script src="prep.js"></script>  <!-- 각 페이지 전용 -->
```

### 5단계: monk.js 경량화

- `Screen` 모듈: **코드 유지하되 사용하지 않음** (삭제는 다음 태스크)
- `Pipe` WS 부분: **코드 유지하되 사용하지 않음** (삭제는 다음 태스크)
- 이번에는 구조 분리에 집중. monk.js 내부 리팩토링은 최소화.

### 6단계: `screens.go()` → `location.href` 전환

`app.js`에서 `screens.go('camera')` 같은 호출을 `location.href = 'camera.html'`로 교체. Screen 모듈의 enter/exit 콜백에 있던 로직은 각 페이지 JS의 초기화/종료로 이동.

### 7단계: 동작 검증

각 페이지를 **PC 브라우저에서 독립적으로 열어서** 확인:
- `index.html` — 스타일/성별/연령 선택 → camera.html로 이동
- `camera.html` — 카메라 뷰 표시 (코칭은 스텁) → 촬영 버튼 → result.html로 이동
- `result.html` — 원본 표시 (API 호출은 기존 프록시 경유) → thankyou.html로 이동
- `thankyou.html` — 사진 표시 → options.html로 이동
- `options.html` — 네비게이션 동작

**주의: 모바일 온리 체크(`showDesktopBlocker`)를 개발 시 임시 비활성화하거나, config에 `DEV_MODE` 플래그를 추가하여 PC에서도 동작하게 할 것.**

## 핵심 원칙

1. **엔진 로직은 건드리지 않는다** — 코칭 REST 전환은 별도 태스크. 기존 pipe.run() 호출 그대로 유지.
2. **동작 우선** — 완벽하지 않아도 페이지 간 이동이 동작하면 OK. 작가님이 보면서 수정 지시.
3. **기존 코드 보존** — 백업 파일 유지. 레거시 참조 가능하게.
4. **커밋 단위** — 의미 단위로 분할 (예: shared.js 추출 / HTML 분리 / 검증 수정)

## 규칙

- 브랜치: develop
- 커밋: `[refactor] 접두사` 사용, 한국어 요약
- 금지: main 푸시, prod 배포, .env 수정, monkos_AI/ 수정
- 에스컬레이션: 분리 중 예상 외 의존성 발견 시 `💡 제안`으로 보고
- MEMORY.md 확인 의무

## 완료 기준

**실행 + 커밋** — 5페이지 분리 → PC 브라우저에서 페이지 간 이동 검증 → 커밋 → develop 푸시

## 완료 보고 형식

```
---
## 완료 보고
[YYYY-MM-DD HH:MM KST] M1/막내1 → M1/쌍아

✅ 완료: {항목}
❌ 실패: {항목 + 원인}
💡 제안: {발견사항}
📁 변경 파일: {파일명 (내용 1줄)}
🔀 커밋: {해시} {메시지}
---
```
