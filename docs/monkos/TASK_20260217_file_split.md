# 막내E 지시서: index.html 파일 분리 (2안)

**발행:** 2026-02-16 21:35 KST
**발행자:** 쌍아 (전략실)
**대상:** 막내E (디자인/UX 전담)
**우선도:** 최우선 (D1 오전)
**브랜치:** develop

---

## 목표

`index.html` (KR 2,428줄 / JP 2,349줄) 모놀리스를 7파일로 분리.
**기능 변경 제로** — 순수 구조 분리만. 분리 후 기존 동작 100% 동일해야 함.

---

## 산출물 (분리 후 파일 구조)

```
monkos_AI/idphoto-kr/public/
├── index.html          ← 마크업 + script src 태그만 (~600줄)
├── css/
│   └── style.css       ← CSS 전체 (~500줄)
└── js/
    ├── app.js          ← 전역 변수 + 유틸 + 초기화 (~200줄)
    ├── camera.js       ← 카메라/WebSocket/코칭 (~250줄)
    ├── generate.js     ← 이미지 생성/QC (~300줄)
    ├── download.js     ← 다운로드/저장/땡큐 화면 (~200줄)
    └── ui.js           ← 크레딧/로그인/모달/프로필 선택 (~350줄)
```

JP도 동일 구조.

---

## 핵심 원칙

1. **전역 변수는 `app.js`에 집중 선언** — 다른 파일은 읽기/쓰기만
2. **`<script>` 로드 순서가 곧 의존 순서** — 순서 틀리면 ReferenceError
3. **함수 이름/시그니처 변경 금지** — HTML onclick 속성이 함수명을 직접 참조
4. **미사용 함수 6개 제거** (데드코드 정리)
5. **CSS는 통째로 이동** — 분할 없이 1파일

---

## STEP 1: CSS 분리

### 작업

`index.html`의 `<style>` 태그 내용 전체 → `css/style.css`로 이동.

**KR 기준:** line 5 ~ line 857 (`<style>` 시작 ~ `</style>` 끝)
**JP 기준:** line 5 ~ line 859 부근 (동일 패턴)

`index.html`에 남길 것:
```html
<link rel="stylesheet" href="/css/style.css">
```

### 검증
- 페이지 로드 → 스타일 정상 적용 확인
- 네트워크 탭에서 `style.css` 200 OK 확인

---

## STEP 2: JS 분리 — app.js (전역 변수 + 유틸 + 초기화)

### 포함 항목

**전역 상수/변수 (KR line 1162~1245):**
```
MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
TX, DPI, PHOTO_SPECS, PORTAL_URL, CREDIT_COST, TOSS_CLIENT_KEY
```

**전역 상태 변수:**
```
croppedImageData, mediapipeFaceDetector, ws, cameraStream,
capturedImageData, generatedImageData, frameTimer, coachingTimeout,
isReady, currentStep, selectedStyle, selectedGender, selectedAge,
voiceEnabled, koVoice, userId, userCredits, prevFrameData, devMode
```

**유틸 함수:**
```
t(key), mmToPx(mm), log(msg), toJpegDataUrl(dataUrl, quality),
detectChange(prev, curr), addTouchClickHandler(el, handler),
isMobile(), apiPost(endpoint, body), isInAppBrowser(), openInExternalBrowser(url)
```

**DOM 참조 (KR line 1511~1513):**
```
video, captureCanvas, logEl
```
⚠️ 이 3개는 DOM 로드 후 참조해야 하므로 `app.js` 파일 하단에 배치하되,
스크립트를 `</body>` 직전에 로드하므로 DOM이 이미 존재함 — 문제없음.

**초기화 IIFE (KR line 1504~1509):**
```javascript
(async () => {
    await initFromTossResult();
    await initFromUrlToken();
    initCredits();
    updateLoginUI();
})();
```
→ 이 IIFE는 `app.js` 최하단에 배치. 단, `initFromTossResult`, `initFromUrlToken`, `initCredits`, `updateLoginUI`가 `ui.js`에 있으므로 **로드 순서상 `ui.js`가 먼저 로드되어야 함**.

**수정:** 초기화 IIFE는 `app.js`가 아닌 **index.html 인라인 스크립트** 또는 별도 `init` 블록으로 분리:

```html
<!-- index.html 하단 -->
<script src="/js/app.js"></script>
<script src="/js/ui.js"></script>
<script src="/js/camera.js"></script>
<script src="/js/generate.js"></script>
<script src="/js/download.js"></script>
<script>
// 초기화 (모든 모듈 로드 후 실행)
(async () => {
    await initFromTossResult();
    await initFromUrlToken();
    initCredits();
    updateLoginUI();
    initMediaPipe();
    initVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = initVoice;
    }

    // 프로필 칩 이벤트 바인딩
    document.querySelectorAll('[data-gender]').forEach(chip => {
        addTouchClickHandler(chip, () => {
            document.querySelectorAll('[data-gender]').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            selectedGender = chip.dataset.gender;
            checkProfileComplete();
        });
    });
    document.querySelectorAll('[data-age]').forEach(chip => {
        addTouchClickHandler(chip, () => {
            document.querySelectorAll('[data-age]').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            selectedAge = chip.dataset.age;
            checkProfileComplete();
        });
    });
    document.querySelectorAll('.prep-style-option').forEach(option => {
        addTouchClickHandler(option, () => {
            document.querySelectorAll('.prep-style-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedStyle = option.dataset.style;
            syncStyleChips(selectedStyle);
            updateConfirmMessage();
        });
    });
    document.querySelectorAll('.style-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedStyle = chip.dataset.style;
            log('카메라 중 스타일 변경: ' + selectedStyle);
        });
    });

    // 탭 복귀 시 크레딧 갱신
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && userId) fetchLatestCredits();
    });

    // 데스크탑 차단
    if (!devMode && !isMobile()) showDesktopBlocker();
})();
</script>
```

---

## STEP 3: JS 분리 — ui.js (크레딧/로그인/모달)

### 포함 함수

```
initFromUrlToken()         — KR line 1248~1269
fetchLatestCredits()       — KR line 1272~1292
initCredits()              — KR line 1302~1317
updateCreditBadge()        — KR line 1319~1324
showCreditModal()          — KR line 1326~1336
closeCreditModal()         — KR line 1338~1340
buyCreditsKR()             — KR line 1348~1382
initFromTossResult()       — KR line 1385~1434
loginKakao()               — KR line 1437~1439
loginGoogle()              — KR line 1459~1477
logoutUser()               — KR line 1479~1486
updateLoginUI()            — KR line 1488~1501
checkProfileComplete()     — KR line 1570~1575
updateConfirmMessage()     — KR line 1577~1592
syncStyleChips(style)      — KR line 1645~1649
showDesktopBlocker()       — KR line 2421~2428
```

### 참조하는 전역 변수 (app.js에서 선언)
`PORTAL_URL`, `TOSS_CLIENT_KEY`, `userId`, `userCredits`, `selectedGender`, `selectedAge`, `selectedStyle`

---

## STEP 4: JS 분리 — camera.js (카메라/WebSocket/코칭)

### 포함 함수

```
initCamera()               — KR line 1745~1752
connectWS()                — KR line 1682~1716
disconnectWS()             — KR line 1718~1726
startFrameCapture()        — KR line 1757~1782
stopFrameCapture()         — KR line 1784~1786
showCoaching(text)         — KR line 1799~1829
setDot(state)              — KR line 1740~1742
initVoice()                — KR line 1541~1546
speakKo(text)              — KR line 1550~1559
toggleVoice()              — KR line 1561~1567
initMediaPipe()            — KR line 1521~1537
capturePhoto()             — KR line 1832~1872
retakePhoto()              — KR line 1874~1889
startShooting()            — KR line 1652~1679
```

### 참조하는 전역 변수 (app.js에서 선언)
`ws`, `cameraStream`, `video`, `captureCanvas`, `frameTimer`, `coachingTimeout`,
`isReady`, `currentStep`, `capturedImageData`, `generatedImageData`, `croppedImageData`,
`selectedStyle`, `voiceEnabled`, `koVoice`, `mediapipeFaceDetector`, `prevFrameData`,
`FRAME_INTERVAL_MS`, `CAPTURE_SIZE`, `COACHING_DISPLAY_MS`, `MAX_CAPTURE_SIZE`

---

## STEP 5: JS 분리 — generate.js (이미지 생성/QC)

### 포함 함수

```
confirmAndGenerate()       — KR line 1892~1979
addQCChatMessage()         — KR line 1982~1995
createQCBubble()           — KR line 1997~2002
generatePassMessage()      — KR line 2004~2011
generateFailMessage()      — KR line 2013~2021
generateFailGuide()        — KR line 2023~2031
showQCResult(result)       — KR line 2033~2057
showGenerateError(error)   — KR line 2059~2067
showQCError(error)         — KR line 2069~2077
cropToSpec()               — KR line 2084~2178
showSpecResult()           — KR line 2180~2199
```

### 참조하는 전역 변수 (app.js에서 선언)
`capturedImageData`, `generatedImageData`, `croppedImageData`, `selectedStyle`,
`selectedGender`, `selectedAge`, `userId`, `currentStep`, `PHOTO_SPECS`, `mediapipeFaceDetector`

### 참조하는 타 파일 함수
- `apiPost()` ← app.js
- `showCreditModal()` ← ui.js
- `updateCreditBadge()` ← ui.js
- `log()`, `t()` ← app.js

---

## STEP 6: JS 분리 — download.js (다운로드/저장/땡큐)

### 포함 함수

```
downloadResult()           — KR line 2227~2262
proceedDownload()          — KR line 2264~2266
showPreview()              — KR line 2268~2301
autoSave(jpegUrl)          — KR line 2303~2334
showSaveGuide()            — KR line 2336~2360
showComplete()             — KR line 2362~2390
saveToPhotos()             — KR line 2392~2396
cleanupSession()           — KR line 2219~2223
openTelegram()             — KR line 2398~2404
```

### 참조하는 전역 변수 (app.js에서 선언)
`generatedImageData`, `userId`, `userCredits`, `CREDIT_COST`, `cameraStream`, `ws`

### 참조하는 타 파일 함수
- `apiPost()`, `toJpegDataUrl()`, `log()` ← app.js
- `updateCreditBadge()`, `showCreditModal()` ← ui.js
- `disconnectWS()` ← camera.js

---

## STEP 7: 데드코드 제거

분리 과정에서 아래 미사용 코드를 **제거** (어디서도 호출되지 않음):

| 함수/변수 | 위치 (KR) | 사유 |
|-----------|-----------|------|
| `goToPurchase()` | line 1342 | 어디서도 호출 안 됨 |
| `regenerate()` | line 2079 | 어디서도 호출 안 됨 |
| `disableShareButtons()` | line 2406 | 어디서도 호출 안 됨 |
| `downloadCompleted` | line 2225 | 선언만 되고 사용 안 됨 |

⚠️ 아래 2개는 **향후 사용 가능성이 있으므로 주석 처리만**:
| 함수 | 위치 (KR) | 사유 |
|------|-----------|------|
| `showSpecResult()` | line 2180 | Step4 클로즈업 기능 비활성 상태 — 향후 활성화 가능 |
| `cleanupSession()` | line 2219 | 세션 정리 유틸 — 향후 필요 가능 |

---

## STEP 8: index.html 최종 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MONKOS AI 증명사진</title>
    <link rel="stylesheet" href="/css/style.css">
    <!-- 기존 외부 리소스 (MediaPipe, Toss 등) 유지 -->
</head>
<body>
    <!-- 마크업 전체 (기존 그대로) -->

    <!-- 인앱 브라우저 감지 (인라인 — DOM 초기에 실행 필요) -->
    <script>
    (function() {
        const ua = navigator.userAgent || '';
        if (/KAKAOTALK|NAVER|LINE|Instagram|FBAN|FBAV/.test(ua)) {
            document.getElementById('inapp-banner').style.display = 'flex';
        }
    })();
    function openExternal() { /* 기존 코드 유지 */ }
    </script>

    <!-- JS 모듈 로드 (순서 중요!) -->
    <script src="/js/app.js"></script>
    <script src="/js/ui.js"></script>
    <script src="/js/camera.js"></script>
    <script src="/js/generate.js"></script>
    <script src="/js/download.js"></script>

    <!-- 초기화 (모든 모듈 로드 후) -->
    <script>
    (async () => {
        await initFromTossResult();
        await initFromUrlToken();
        initCredits();
        updateLoginUI();
        initMediaPipe();
        initVoice();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = initVoice;
        }
        // 프로필 칩 이벤트 바인딩 (기존 코드)
        // visibilitychange 리스너 (크레딧 갱신)
        // 데스크탑 차단 체크
    })();
    </script>
</body>
</html>
```

---

## STEP 9: `<script>` 로드 순서 근거

```
1. app.js      ← 전역 변수/상수 선언 (다른 모든 파일이 의존)
2. ui.js       ← 크레딧/로그인 (초기화 IIFE에서 먼저 호출)
3. camera.js   ← 카메라/WS (ui.js 함수 참조 없음, app.js만 참조)
4. generate.js ← 생성/QC (ui.js의 showCreditModal 참조)
5. download.js ← 다운로드 (camera.js의 disconnectWS 참조)
6. 초기화 인라인 ← 모든 함수 정의 완료 후 실행
```

---

## STEP 10: JP 적용

KR 완성 후 JP에 동일 적용. 차이점:
- `TX` 객체 내 텍스트 → 일본어
- `TOSS_CLIENT_KEY` → 없음 (Lemon Squeezy 사용)
- `buyCreditsKR()` → 없음 (JP는 다른 결제)
- `loginKakao()` → 없음 (JP는 Google만)
- 나머지 구조는 100% 동일

---

## server.js 정적 파일 서빙 확인

현재 `server.js`는 `/public/` 디렉토리를 정적 서빙함.
`css/`, `js/` 서브디렉토리도 `/public/` 하위이므로 **server.js 변경 불필요**.

확인 사항:
- `GET /css/style.css` → 200 OK (Content-Type: text/css)
- `GET /js/app.js` → 200 OK (Content-Type: application/javascript)

---

## 안전 제약

- **기능 변경 제로** — 분리만, 로직 수정 금지
- **HTML onclick 속성의 함수명 변경 금지** — 기존 인라인 핸들러 유지
- **서버 코드 변경 없음**
- **develop 브랜치에서 작업**

---

## 검증 체크리스트

### 로드 검증
- [ ] 페이지 로드 시 콘솔 에러 없음
- [ ] 네트워크 탭: 7개 파일 전부 200 OK
- [ ] CSS 정상 적용 (레이아웃 깨짐 없음)

### 기능 검증 (풀 플로우)
- [ ] 프로필 선택 (성별/연령/용도) 정상
- [ ] 카메라 시작 → WebSocket 연결 → 코칭 텍스트 표시
- [ ] 촬영 → 확인 화면 → 이미지 표시
- [ ] 재촬영 → 카메라 복귀
- [ ] 생성 → 크레딧 차감 → AI 이미지 생성
- [ ] 다운로드 → 처리 중... → 땡큐 화면
- [ ] 자동 저장 → 완료 애니메이션 (또는 롱프레스 가이드)
- [ ] 크레딧 모달 → 충전 → 카카오/구글 로그인
- [ ] 데스크탑 접속 → 차단 화면

### 에러 검증
- [ ] 네트워크 끊김 → 에러 처리 정상
- [ ] 크레딧 부족 → 모달 정상
- [ ] 카메라 권한 거부 → 에러 메시지 정상

---

## 커밋 메시지
```
[design] index.html 파일 분리: CSS/JS 7파일 구조화 + 데드코드 제거
```
