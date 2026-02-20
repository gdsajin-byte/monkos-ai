# PAGE SPLIT ANALYSIS — photolab 페이지 분리 정밀 분석

[2026-02-18 21:31 KST] M1/막내1 분석 보고

---

## 분석 대상

| 파일 | 줄수 | 역할 |
|------|------|------|
| `index.html` | 293 | HTML 구조 (4개 화면 섹션 + 공용 요소) |
| `app.js` | 829 | 비즈니스 로직 전체 |
| `monk.js` | 665 | 프레임워크 (Screen, Store, Pipe, Media, Agent) |
| `config.js` | 88 | API 경로, 상수, 규격 테이블 |
| `app.css` | 631 | 스타일 전체 |
| **합계** | **2,506** | |

추가 확인: CF Pages Functions (`MONK_kr/functions/api/idphoto-*.js`) 3개 — 단순 프록시

---

## 1. 화면(Screen) 목록 + 각 화면의 역할

### 1-1. `prep` — 준비 화면

| 항목 | 내용 |
|------|------|
| **el** | `#prep-screen` (index.html:110~158) |
| **enter** | `step=0`, `stepLabel='촬영 준비'` |
| **exit** | 없음 |
| **Store 쓰기** | `step`, `stepLabel` |
| **Store 읽기** | 없음 (enter 내에서) |
| **호출 함수** | 없음 |
| **HTML 요소** | 용도 선택 칩 (`.prep-style-option`), 성별/연령 칩 (`.prep-profile-chip`), 확인 멘트 (`#prep-confirm`), 시작 버튼 (`#btn-start`), 홈 버튼 (`.btn-home`) |

**관련 함수** (prep 화면에서 호출):
- `selectStyle(style)` → `store.style` 설정 + UI 업데이트
- `selectGender(gender)` → `store.gender` 설정
- `selectAge(age)` → `store.age` 설정
- `checkProfileComplete()` → `store.profileComplete` 계산 + 버튼 활성화
- `updateConfirmMessage()` → `store.prepConfirmText` + innerHTML 직접 설정
- `startShooting()` → `screens.go('camera')` 호출

### 1-2. `camera` — 촬영 화면

| 항목 | 내용 |
|------|------|
| **el** | `#camera-area` (index.html:161~182) |
| **enter** | `step=1`, `stepLabel='Step 1: AI 코칭'`, coaching 활성화, `media.start()`, `pipe.connect('coaching')`, `media.onFrame()` 등록, `#controls` 표시 |
| **exit** | `media.offFrame()`, `media.stop()`, `pipe.disconnect('coaching')`, coaching 리셋, `#controls` 숨김 |
| **Store 쓰기** | `step`, `stepLabel`, `coaching`, `wsConnected` (pipe 콜백 경유) |
| **Store 읽기** | `step` (onFrame guard), `style` (WS set-style 전송) |
| **호출 함수** | `media.start/stop/onFrame/offFrame/capture`, `pipe.connect/disconnect/sendRaw` |
| **HTML 요소** | 비디오 (`#camera-video`), 얼굴 가이드 (`#face-guide`), 스타일 바 (`#style-bar`), 코칭 오버레이 (`#coaching-overlay`), 컨트롤/촬영 버튼 (`#controls`, `#btn-capture`), 캔버스 (`#capture-canvas`) |

**관련 함수** (camera 화면에서 호출):
- `capturePhoto()` → `media.capture()` + `screens.go('result')`
- `selectStyleInCamera(style)` → WS로 스타일 변경 전송
- `showCoaching(text)` → coaching 텍스트 업데이트 + TTS
- `speakKo(text)` → Web Speech API 음성 가이드
- `toggleVoice()` → 음성 ON/OFF

### 1-3. `result` — 결과 화면

| 항목 | 내용 |
|------|------|
| **el** | `#result-overlay` (index.html:185~229) |
| **enter** | 비어있음 (상태 설정은 호출 측에서 처리) |
| **exit** | 없음 |
| **Store 쓰기** | (외부 함수에서) `step`, `stepLabel`, `resultTitle`, `resultSubtitle`, `showStep2/3Actions`, `generated`, `qcResult`, `qcPassed`, `qcBadgeText`, `cropped`, `specName/Size/Px` |
| **Store 읽기** | `captured`, `generated`, `style`, `gender`, `age`, `user.id`, `user.credits`, `coaching.ready` |
| **호출 함수** | `pipe.run('precheck')`, `pipe.run('generate')`, `pipe.run('qc')`, `pipe.run('creditUse')`, `media.crop()`, `media.toJpeg()` |
| **HTML 요소** | 타이틀 (`#result-title`), 서브타이틀 (`#result-subtitle`), 원본/생성 비교 (`.photo-compare`), QC 배지 (`#qc-badge`), 규격 크롭 결과 (`#spec-result`), Step2 버튼, Step3 버튼 |

**관련 함수**:
- `confirmAndGenerate()` → precheck → generate → QC 파이프라인
- `showQCResult(result)` → QC 결과 표시 + 다운로드 버튼 활성화
- `showGenerateError(error)` / `showQCError(error)` → 에러 처리
- `downloadResult()` → 크레딧 차감 → `showPreview()`
- `retakePhoto()` → 상태 초기화 + `screens.go('camera')`

### 1-4. `thankyou` — 미리보기/완료 화면

| 항목 | 내용 |
|------|------|
| **el** | `#thankyou-screen` (index.html:232~280) |
| **enter** | `postCreditMsg` 설정 (user.id 있으면 크레딧 잔여 표시) |
| **exit** | 없음 |
| **Store 쓰기** | `postCreditMsg` |
| **Store 읽기** | `user.id`, `user.credits`, `cropped` (showPreview에서 이미 설정) |
| **호출 함수** | 없음 (enter 내) |
| **HTML 요소** | 크롭 사진 (`#ty-photo`), 저장 가이드, 완료 메시지, SNS 공유 섹션, 텔레그램 이벤트, 서비스 버튼, 네비게이션 |

**관련 함수**:
- `saveToPhotos()` → `navigator.share()` 또는 `<a download>` 폴백
- `openTelegram()` → 텔레그램 봇 링크 오픈
- `location.reload()` → 처음부터 다시 (닫기, 추가 촬영)

---

## 2. 화면 간 전환 흐름

### 전환 호출 전체 목록

| 위치 | 호출 | 의미 |
|------|------|------|
| `init()` :824 | `screens.go('prep')` | 앱 시작 → 준비 화면 |
| `startShooting()` :344 | `screens.go('camera')` | 준비 → 촬영 |
| `capturePhoto()` :374 | `screens.go('result')` | 촬영 → 결과 (Step 2) |
| `retakePhoto()` :388 | `screens.go('camera')` | 결과 → 촬영 (재촬영) |
| `showPreview()` :568 | `screens.go('thankyou')` | 결과 → 완료/미리보기 |

### 플로우 다이어그램

```
[init]
  │
  ▼
┌──────┐   startShooting()   ┌────────┐   capturePhoto()   ┌────────┐   showPreview()   ┌──────────┐
│ prep │ ──────────────────▶ │ camera │ ────────────────▶  │ result │ ──────────────▶  │ thankyou │
└──────┘                     └────────┘                    └────────┘                  └──────────┘
                                 ▲                             │                           │
                                 │        retakePhoto()        │      location.reload()    │
                                 └─────────────────────────────┘      ┌────────────────────┘
                                                                      ▼
                                                                   [새로고침 → init → prep]
```

### result 화면 내부 스텝 전환 (같은 화면, 상태만 변경)

```
result (Step 2: 촬영 확인)
  │
  ├── "이 사진으로 생성" → confirmAndGenerate()
  │   └── precheck → generate → QC
  │       └── result (Step 3: 생성+QC 결과)
  │           ├── PASS → "다운로드" → downloadResult() → showPreview() → thankyou
  │           └── FAIL → "다시 찍기" → retakePhoto() → camera
  │
  └── "다시 찍기" → retakePhoto() → camera
```

---

## 3. 화면 간 데이터 의존성

### Store 상태별 생산-소비 매핑

| Store 키 | 생산(설정) 화면 | 소비(읽기) 화면 | 비고 |
|-----------|----------------|----------------|------|
| `style` | prep (`selectStyle`) | camera (WS `set-style` 전송), result (`confirmAndGenerate`, `showPreview` crop) | camera에서도 변경 가능 (`selectStyleInCamera`) |
| `gender` | prep (`selectGender`) | result (`confirmAndGenerate`) | |
| `age` | prep (`selectAge`) | result (`confirmAndGenerate`) | |
| `profileComplete` | prep (`checkProfileComplete`) | prep (버튼 활성화) | prep 내부 전용 |
| `prepConfirmText` | prep (`updateConfirmMessage`) | prep (DOM 바인딩) | prep 내부 전용 |
| `captured` | camera (`capturePhoto` → `media.capture()`) | result (이미지 표시 + generate/QC base64) | **핵심 전달 데이터** (base64 이미지) |
| `coaching.ready` | camera (`showCoaching`) | result (`capturePhoto` 시 subtitle 결정) | 캡처 순간의 스냅샷 사용 |
| `generated` | result (`confirmAndGenerate`) | result (표시), thankyou (`showPreview` crop 소스) | **핵심 전달 데이터** (base64 이미지) |
| `cropped` | result→thankyou 전환 직전 (`showPreview`) | thankyou (사진 표시, `saveToPhotos`) | **핵심 전달 데이터** (base64 이미지) |
| `user` | init (`initCredits`, `initFromUrlToken`) | 전체 (헤더 크레딧, 결제, 크레딧 차감) | sessionStorage 기반 |
| `voiceEnabled` | camera (`toggleVoice`) | camera (`speakKo`) | camera 내부 전용 |
| `wsConnected` | camera (pipe coaching 콜백) | 헤더 (음성 버튼 data-show) | camera 내부 전용 |
| `step` | 전체 (각 화면 enter) | camera (onFrame guard), result (coaching timeout) | 전역 진행 상태 |

### 데이터 의존 체인 (크리티컬 패스)

```
prep                 camera              result              thankyou
─────────────────    ─────────────────   ─────────────────   ─────────────
style ─────────────▶ WS set-style
gender ────────────────────────────────▶ generate body
age ───────────────────────────────────▶ generate body
                     captured ─────────▶ 원본 표시 + base64
                                         generated ────────▶ crop 소스
                                         cropped ──────────▶ 사진 표시
user ──────────────────────────────────▶ 크레딧 차감 ──────▶ 잔여 표시
```

### 이미지 데이터 크기 주의

| 데이터 | 추정 크기 | 비고 |
|--------|----------|------|
| `captured` | 50~150KB (JPEG base64) | MAX_CAPTURE_SIZE=720, quality=0.8 |
| `generated` | 100~300KB (서버 반환) | 서버에서 생성한 증명사진 |
| `cropped` | 50~100KB (PNG base64) | 300dpi 규격 크롭 |

→ sessionStorage 5MB 제한 내 충분히 수용 가능 (합계 < 1MB)

---

## 4. 공유 자원 vs 화면 전용 자원

### 4-1. 공유 자원 (모든 페이지에 필요)

**JS 모듈:**
| 자원 | 파일 | 줄 | 설명 |
|------|------|-----|------|
| Store (반응형 상태) | monk.js | 68~160 | DOM 바인딩 엔진 — 모든 페이지에서 사용 |
| log, isMobile | monk.js | 11~15 | 유틸리티 |
| config 전체 | config.js | 1~88 | API 경로, 상수, TX 텍스트 |

**JS 로직:**
| 자원 | app.js 줄 | 설명 |
|------|-----------|------|
| `initFromUrlToken()` | 689~708 | URL 토큰 인증 (uid, token 파라미터) |
| `initCredits()` | 710~729 | sessionStorage에서 user 로드 |
| `fetchLatestCredits()` | 731~750 | 크레딧 최신화 API 호출 |
| `visibilitychange` 리스너 | 753~757 | 탭 복귀 시 크레딧 재조회 |
| `checkInappBrowser()` | 777~782 | 인앱 브라우저 감지 |
| `showDesktopBlocker()` | 784~789 | 데스크탑 차단 |
| `showCreditModal()` | 601~610 | 크레딧 부족 모달 표시 |
| `closeCreditModal()` | 612~614 | 모달 닫기 |
| `buyCreditsKR()` | 617~647 | 토스 결제 |
| `initFromTossResult()` | 649~686 | 결제 콜백 처리 |

**HTML 공용 요소:**
| 요소 | index.html 줄 | 설명 |
|------|---------------|------|
| `#inapp-banner` | 38~41 | 인앱 브라우저 안내 |
| `#desktop-blocker` | 44~52 | 데스크탑 차단 |
| `#header` | 55~68 | 헤더 (브랜드, stepLabel, 크레딧, 음성 버튼) |
| `#credit-modal` | 71~107 | 크레딧 부족 모달 + 결제 패키지 |

**CSS 공용:**
- 리셋 (`*`), body, 헤더, 크레딧 배지, 크레딧 모달, 데스크탑 차단, 버튼 공통 (`.btn-*`), 로그, 스피너

**외부 자원:**
- Google Fonts (Noto Sans KR)
- 토스페이먼츠 SDK (`js.tosspayments.com`)

### 4-2. 화면 전용 자원

#### prep 전용
| 유형 | 내용 |
|------|------|
| HTML | `#prep-screen` (용도·성별·연령 선택, 확인 멘트, 시작 버튼) |
| JS | `selectStyle`, `selectGender`, `selectAge`, `checkProfileComplete`, `updateConfirmMessage`, `startShooting` |
| CSS | `#prep-screen`, `.prep-*`, `.btn-start`, `.btn-home` |
| Store | `profileComplete`, `prepConfirmText` |

#### camera 전용
| 유형 | 내용 |
|------|------|
| HTML | `#camera-area` (video, face-guide, style-bar, coaching-overlay), `#controls` + `#btn-capture`, `#capture-canvas` |
| JS | `capturePhoto`, `selectStyleInCamera`, `syncStyleChips`, `showCoaching`, `speakKo`, `toggleVoice`, `initVoice`, Media 모듈 (카메라 start/stop/onFrame/offFrame/capture), Pipe WS coaching |
| CSS | `#camera-area`, `#camera-video`, `#face-guide`, `#coaching-overlay`, `.coaching-*`, `#style-bar`, `.style-chip`, `#controls`, `#btn-capture`, `@keyframes pulse` |
| Store | `coaching.*`, `wsConnected`, `voiceEnabled` |
| 외부 | MediaPipe Tasks Vision (CDN, lazy load), Web Speech API |

#### result 전용
| 유형 | 내용 |
|------|------|
| HTML | `#result-overlay` (photo-compare, qc-badge, spec-result, step2/step3 actions) |
| JS | `confirmAndGenerate`, `showQCResult`, `showGenerateError`, `showQCError`, `downloadResult`, `showPreview`, `retakePhoto`, Pipe REST (precheck, generate, qc, creditUse), Media (crop, toJpeg) |
| CSS | `#result-overlay`, `.result-header`, `.photo-compare`, `#qc-badge`, `#spec-result`, `.spec-*` |
| Store | `resultTitle`, `resultSubtitle`, `showStep2Actions`, `showStep3Actions`, `qcResult`, `qcPassed`, `qcBadgeText`, `specName`, `specSize`, `specPx` |

#### thankyou 전용
| 유형 | 내용 |
|------|------|
| HTML | `#thankyou-screen` (preview, 저장 가이드, 공유 섹션, 서비스 버튼, 네비) |
| JS | `saveToPhotos`, `openTelegram`, Media (toJpeg) |
| CSS | `#thankyou-screen`, `.ty-*`, `@keyframes pulseHand`, `@keyframes fadeInUp` |
| Store | `downloadComplete`, `postCreditMsg` |

---

## 5. 페이지 분리 시 구조 제안

### 5-1. 제안 구조: 4 페이지

```
MONK_kr/ai_lab/photolab/
├── index.html          ← prep (준비 화면, 진입점)
├── camera.html         ← camera (촬영 화면)
├── result.html         ← result (확인 + 생성 + QC)
├── thankyou.html       ← thankyou (완료/미리보기)
├── shared.js           ← 공통 로직 (인증, 크레딧, 결제, 유틸리티)
├── prep.js             ← prep 전용 로직
├── camera.js           ← camera 전용 로직
├── result.js           ← result 전용 로직
├── thankyou.js         ← thankyou 전용 로직
├── monk.js             ← 프레임워크 (변경 최소)
├── config.js           ← 설정 (변경 없음)
└── app.css             ← 스타일 (분리 가능하나, 단일 유지도 OK)
```

### 5-2. 각 페이지 구성

#### `index.html` (prep)
- **HTML**: 공통 요소 (header, credit-modal, inapp-banner, desktop-blocker) + prep-screen
- **JS**: `shared.js` + `prep.js`
- **monk.js 모듈**: Store (DOM 바인딩)
- **진출**: `location.href = 'camera.html'`

#### `camera.html`
- **HTML**: 공통 요소 + camera-area + controls + capture-canvas
- **JS**: `shared.js` + `camera.js`
- **monk.js 모듈**: Store, Pipe (WS coaching), Media (카메라, 캡처)
- **외부**: MediaPipe CDN (lazy), Web Speech API
- **진출**: 촬영 완료 → sessionStorage에 captured 저장 → `location.href = 'result.html'`
- **진입**: sessionStorage에서 style/gender/age 읽기

#### `result.html`
- **HTML**: 공통 요소 + result-overlay (항상 active, 화면 전체)
- **JS**: `shared.js` + `result.js`
- **monk.js 모듈**: Store, Pipe (REST: precheck, generate, qc, creditUse), Media (crop, toJpeg)
- **진출(완료)**: sessionStorage에 cropped 저장 → `location.href = 'thankyou.html'`
- **진출(재촬영)**: `location.href = 'camera.html'`
- **진입**: sessionStorage에서 captured + style/gender/age 읽기

#### `thankyou.html`
- **HTML**: 공통 요소 + thankyou-screen (항상 active, 화면 전체)
- **JS**: `shared.js` + `thankyou.js`
- **monk.js 모듈**: Store, Media (toJpeg)
- **진출**: `location.href = 'index.html'` (추가 촬영) 또는 외부 링크

### 5-3. 페이지 간 데이터 전달 방식

```
sessionStorage (동일 도메인, monk.kr)
├── monkos_user          ← 기존 사용 중 (user 객체 JSON)
├── monkos_style         ← NEW: 'id_photo' | 'resume'
├── monkos_gender        ← NEW: 'male' | 'female'
├── monkos_age           ← NEW: 'child' | 'teen' | 'adult'
├── monkos_captured      ← NEW: base64 JPEG (촬영 원본)
├── monkos_generated     ← NEW: base64 (생성 결과)
├── monkos_cropped       ← NEW: base64 PNG (규격 크롭)
└── monkos_coaching_ready ← NEW: boolean (촬영 시점 코칭 상태)
```

**대안: URL 파라미터**
- `camera.html?style=id_photo&gender=male&age=adult` — 이미지 제외 가벼운 데이터는 URL로도 가능
- 장점: 뒤로가기/북마크 가능
- 단점: 이미지 데이터는 담을 수 없음 → sessionStorage 병행 필수

**대안: IndexedDB**
- 이미지 데이터가 sessionStorage 5MB 제한 초과 시 사용
- 현재 추정 합계 < 1MB이므로 sessionStorage로 충분
- 향후 고해상도 확장 시 IndexedDB 전환 고려

### 5-4. monk.js 모듈별 페이지 사용 매핑

| 모듈 | index (prep) | camera | result | thankyou |
|------|:---:|:---:|:---:|:---:|
| Screen | **불필요** | **불필요** | **불필요** | **불필요** |
| Store | ✅ | ✅ | ✅ | ✅ |
| Pipe (REST) | - | - | ✅ | - |
| Pipe (WS) | - | ✅ | - | - |
| Media (카메라) | - | ✅ | - | - |
| Media (crop/toJpeg) | - | - | ✅ | ✅ |
| Agent | - | - | - | - |

**핵심**: Screen 모듈이 **전 페이지에서 불필요**해짐.
각 HTML 파일 = 곧 하나의 화면. 상태 머신이 필요 없다.

### 5-5. shared.js 구성안

```
shared.js (app.js에서 추출)
├── Store 초기화 (공통 상태만: user, style, gender, age, step, stepLabel, creditModalOpen 등)
├── initFromUrlToken()
├── initCredits()
├── fetchLatestCredits()
├── visibilitychange 리스너
├── checkInappBrowser()
├── showDesktopBlocker()
├── showCreditModal() / closeCreditModal()
├── buyCreditsKR()
├── initFromTossResult()
├── openExternal()
└── window 노출 (공통 onclick 함수)
```

### 5-6. 결제 콜백 URL 변경 필요

현재 `buyCreditsKR()`의 토스 successUrl/failUrl:
```js
successUrl: `${window.location.origin}${window.location.pathname}?toss=success`
```
→ 페이지 분리 시, 결제 시점의 pathname에 따라 돌아올 페이지가 결정됨 (예: `/ai_lab/photolab/result.html?toss=success`).
→ **기존 로직 그대로 작동**. 변경 불필요.

---

## 6. 서버(idphoto-kr) 영향도

### 6-1. WebSocket (코칭)

| 항목 | 현재 | 분리 후 | 변경 필요 |
|------|------|---------|:---------:|
| 연결 URL | `wss://idphoto-kr.monkos.ai` | 동일 | **없음** |
| 연결 시점 | camera enter | camera.html 로드 시 | **없음** |
| 해제 시점 | camera exit (수동 disconnect) | camera.html 떠날 때 (자연 해제) | **없음** |
| set-style 전송 | onOpen에서 전송 | 동일 | **없음** |

**분리 시 이점**: 페이지 나가면 WS 자동 해제 → `pipe.disconnect()` 호출 불필요, 소켓 점유 충돌 원천 차단.

### 6-2. REST API (precheck, generate, QC)

| 항목 | 현재 | 분리 후 | 변경 필요 |
|------|------|---------|:---------:|
| 요청 경로 | `/api/idphoto-precheck` 등 (CF Pages Function) | 동일 (같은 도메인) | **없음** |
| CF Function 위치 | `MONK_kr/functions/api/idphoto-*.js` | 동일 | **없음** |
| 프록시 대상 | `https://idphoto-kr.monkos.ai/api/*` | 동일 | **없음** |

CF Pages Functions는 URL 경로 기반이므로 HTML 파일명과 무관.

### 6-3. 크레딧 API

| 항목 | 현재 | 분리 후 | 변경 필요 |
|------|------|---------|:---------:|
| 포탈 API | `https://monkos.ai/api/credits` 등 | 동일 | **없음** |
| creditUse | `pipe.run('creditUse', {...})` → `/credit/use` | 동일 | **없음** |

⚠️ **참고**: 현재 `/credit/use` 경로에 대한 CF Function이 존재하지 않음. `MONK_kr/functions/` 디렉토리에 해당 프록시 없음. 프로덕션(00079)에서는 같은 서버 내부 호출이므로 문제없지만, monk.kr 배포라인에서는 이 경로가 404가 될 가능성 있음. → 별도 확인 필요 (분석 범위 외이지만 기록).

### 6-4. 인증

| 항목 | 현재 | 분리 후 | 변경 필요 |
|------|------|---------|:---------:|
| sessionStorage | `monkos_user` | 동일 (같은 도메인) | **없음** |
| URL 토큰 | `?uid=...&token=...` | 진입 페이지(index.html)에서 처리 | **없음** |

### 6-5. 영향도 총괄

```
┌─────────────────────────────────────────────────────┐
│  서버(idphoto-kr.monkos.ai) 변경 필요 사항: 없음     │
│  CF Pages Functions 변경 필요 사항: 없음              │
│  CORS 변경 필요 사항: 없음 (같은 도메인 monk.kr)      │
│  변경 범위: 클라이언트(MONK_kr/ai_lab/photolab/)만   │
└─────────────────────────────────────────────────────┘
```

---

## 부록: 발견 사항

### A. `/credit/use` 프록시 부재
- `app.js:76` — `creditUse: { type: 'post', path: '/credit/use' }`
- `MONK_kr/functions/api/` 에 해당 프록시 함수 없음
- monk.kr 배포라인에서 실제 크레딧 차감 시 404 발생 가능
- → CF Function 추가 필요 여부 확인 필요

### B. Store innerHTML 직접 주입
- `app.js:325` — `el.innerHTML = store.prepConfirmText`
- monk.js의 `data-bind`는 `textContent`만 지원 → HTML 태그가 포함된 `prepConfirmText`를 직접 innerHTML로 설정
- 페이지 분리 시 이 패턴 유지 또는 monk.js에 `data-bind-html` 추가 검토

### C. `#controls`와 `#log` 요소의 위치
- `#controls`는 screen 외부에 위치 (index.html:282~284) — camera 화면에서만 `.active` 토글
- `#capture-canvas`도 screen 외부 (index.html:288)
- 페이지 분리 시 camera.html에 포함

### D. Screen 모듈 불필요화
- 페이지 분리 시 Screen 모듈(화면 전환 머신)이 완전히 불필요해짐
- monk.js에서 Screen은 유지하되, 각 페이지의 JS에서 `Monk.screens()` 호출 제거
- **프레임워크 경량화 기회**: Screen 모듈을 선택적 import로 전환 가능

---

*분석 완료. 코드 수정 없음.*
