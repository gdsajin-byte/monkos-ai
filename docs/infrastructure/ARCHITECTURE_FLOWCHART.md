# MONKOS idphoto 아키텍처 플로우차트

**작성:** 2026-02-17 04:12 KST
**작성자:** 쌍아 (전략실)
**기반:** 코드베이스 역산 분석

---

## 1. 서비스 전체 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                        사용자 (스마트폰)                              │
│                    idphoto-kr.monkos.ai                              │
│                    idphoto-jp.monkos.ai                              │
└──────────┬──────────────────┬──────────────────┬────────────────────┘
           │ HTTPS            │ WSS              │ OAuth 리다이렉트
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloud Run (us-central1)                           │
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                 │
│  │  monkos-idphoto-kr  │    │  monkos-idphoto-jp  │                 │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │                 │
│  │  │  server.js    │  │    │  │  server.js    │  │                 │
│  │  │  ├─ HTTP API  │  │    │  │  ├─ HTTP API  │  │                 │
│  │  │  ├─ WS 코칭   │  │    │  │  ├─ WS コーチ │  │                 │
│  │  │  └─ Static    │  │    │  │  └─ Static    │  │                 │
│  │  └───────────────┘  │    │  └───────────────┘  │                 │
│  │  public/index.html  │    │  public/index.html  │                 │
│  └──────────┬──────────┘    └──────────┬──────────┘                 │
│             │                          │                            │
│             ▼                          ▼                            │
│  ┌──────────────────────────────────────────────────┐               │
│  │              monkos-portal (monkos.ai)            │               │
│  │  ├─ /auth/google    (OAuth)                      │               │
│  │  ├─ /auth/kakao     (KR only)                    │               │
│  │  ├─ /api/credits/*  (크레딧 CRUD)                │               │
│  │  ├─ /api/payments/* (결제 확인)                   │               │
│  │  └─ Firestore 연결  (users 컬렉션)               │               │
│  └──────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Google AI APIs     │    │     Firestore       │
│                     │    │   (projectId:monkos) │
│  ┌───────────────┐  │    │                     │
│  │ Vertex AI ADC │  │    │  users/{uid}        │
│  │ ├─ Gemini Live│  │    │  ├─ credits: N      │
│  │ │  (2.0 Flash)│  │    │  ├─ email           │
│  │ ├─ Gemini QC  │  │    │  ├─ tier            │
│  │ │  (3 Flash)  │  │    │  └─ ...             │
│  │ └─ Pre-check  │  │    └─────────────────────┘
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ AI Studio Key │  │
│  │ └─ Imagen I2I │  │
│  │   (NB3 Pro)   │  │
│  └───────────────┘  │
└─────────────────────┘
```

---

## 2. 사용자 플로우 (화면 전환)

```
  ┌──────────┐
  │ 진입점    │  idphoto-kr.monkos.ai / idphoto-jp.monkos.ai
  └────┬─────┘
       │
       ▼
  ┌──────────┐    데스크탑?    ┌──────────────────┐
  │ 판정     ├───── YES ─────▶│ #desktop-blocker │  QR 코드 표시
  └────┬─────┘                └──────────────────┘
       │ 모바일
       ▼
  ┌──────────┐   인앱브라우저?  ┌──────────────────┐
  │ 판정     ├───── YES ─────▶│ #inapp-banner    │  Chrome/Safari 유도
  └────┬─────┘                └──────────────────┘
       │ 정상 브라우저
       ▼
╔══════════════════════════════════════════════════════════════════╗
║                    #prep-screen (준비 화면)                       ║
║                                                                  ║
║  ┌─────────────────┐                                             ║
║  │  로그인 섹션     │  비로그인: 카카오/Google 버튼 표시            ║
║  │  #loginSection  │  로그인됨: 섹션 숨김, 헤더에 💎크레딧 표시     ║
║  └─────────────────┘                                             ║
║                                                                  ║
║  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐        ║
║  │  용도 선택       │  │  성별 선택    │  │  연령 선택    │        ║
║  │  .prep-styles   │  │  [남성][여성] │  │ [유아][청소년]│        ║
║  │  [여권][이력서]  │  │              │  │ [19세이상]   │        ║
║  └─────────────────┘  └──────────────┘  └──────────────┘        ║
║                                                                  ║
║  ┌─────────────────────────────────────────┐                     ║
║  │  .prep-confirm  재확인 메시지            │  3개 모두 선택 시    ║
║  │  "여권/신분증 · 남성 · 19세이상"         │  표시됨              ║
║  └─────────────────────────────────────────┘                     ║
║                                                                  ║
║  ┌─────────────────────────────────────────┐                     ║
║  │  [촬영 시작하기] .btn-start             │  3개 모두 선택 시    ║
║  │                                         │  활성화 (disabled해제)║
║  └─────────────────────────────────────────┘                     ║
╚══════════════════════════════════════════════════════════════════╝
       │
       │ startShooting()
       │ ├─ initCamera() → getUserMedia (전면 카메라)
       │ ├─ prep-screen.hidden = true
       │ ├─ camera-area.active = true
       │ ├─ controls.active = true
       │ └─ connectWS() → Gemini Live 코칭 세션 시작
       ▼
╔══════════════════════════════════════════════════════════════════╗
║              #camera-area + #controls (Step 1: AI 코칭)          ║
║                                                                  ║
║  ┌──────────────────────────────────────────────┐                ║
║  │  #camera-video (전면 카메라, 미러링)          │                ║
║  │                                              │                ║
║  │  ┌────────────────────────┐                  │                ║
║  │  │ #style-bar             │  [여권] [이력서]  │                ║
║  │  └────────────────────────┘                  │                ║
║  │                                              │                ║
║  │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐                   │                ║
║  │  │ #face-guide (점선 타원)│  얼굴 가이드      │                ║
║  │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘                   │                ║
║  │                                              │                ║
║  │  ┌────────────────────────┐                  │                ║
║  │  │ #coaching-overlay      │                  │                ║
║  │  │ "정면을 바라봐 주세요" │  AI 코칭 텍스트   │                ║
║  │  │ + TTS 음성 가이드      │                  │                ║
║  │  └────────────────────────┘                  │                ║
║  └──────────────────────────────────────────────┘                ║
║                                                                  ║
║  ┌──────────────────────────────────────────────┐                ║
║  │              ◉ #btn-capture                  │  촬영 버튼      ║
║  │              (isReady=true → 녹색 글로우)     │                ║
║  └──────────────────────────────────────────────┘                ║
║                                                                  ║
║  [WS 데이터 흐름]                                                 ║
║  프레임캡처(1fps) → WS binary → server → Gemini Live            ║
║                                  ↓                               ║
║                           ai-coaching JSON → showCoaching()      ║
╚══════════════════════════════════════════════════════════════════╝
       │
       │ capturePhoto()
       │ ├─ 캔버스에 비디오 캡처 (미러 해제)
       │ ├─ currentStep = 2
       │ ├─ disconnectWS() → 코칭 세션 종료
       │ ├─ speechSynthesis.cancel()
       │ └─ result-overlay.active = true
       ▼
╔══════════════════════════════════════════════════════════════════╗
║            #result-overlay (Step 2: 촬영 확인)                    ║
║                                                                  ║
║  ┌────────────────────────────────────────┐                      ║
║  │  .photo-compare                        │                      ║
║  │  ┌──────────┐                          │                      ║
║  │  │  원본     │   (AI 생성은 아직 없음)  │                      ║
║  │  │  사진     │                          │                      ║
║  │  └──────────┘                          │                      ║
║  └────────────────────────────────────────┘                      ║
║                                                                  ║
║  ┌──────────────────┐  ┌───────────────────────────┐             ║
║  │ [다시 찍기]       │  │ [이 사진으로 생성 (1c)]    │             ║
║  │ retakePhoto()    │  │ confirmAndGenerate()      │             ║
║  └───────┬──────────┘  └─────────────┬─────────────┘             ║
╚══════════│═══════════════════════════│═══════════════════════════╝
           │                           │
    ┌──────┘                           │
    │ (Step 1로 복귀)                  │
    ▼                                  │
  camera-area                          │
                                       │ confirmAndGenerate()
                                       │
       ┌───────────────────────────────┘
       │
       │  Phase 1: 사전분석
       │  ├─ POST /api/pre-check → Gemini 3 Flash
       │  ├─ suitable=true → 생성 진행
       │  └─ suitable=false → "재촬영 권장" + Step 2 버튼 복구
       │
       │  Phase 2: 생성 (크레딧 -1c)
       │  ├─ POST /api/generate → Imagen I2I (NB3 Pro)
       │  │   server: useCredits(userId, 'generate')
       │  │   server: compressImage() → sharp 720px
       │  │   server: IDENTITY_PRESERVATION + STYLE + OUTFIT 프롬프트
       │  │   server: imagenAI.models.generateContent()
       │  ├─ 402 에러 → showCreditModal() (크레딧 부족)
       │  └─ 성공 → generatedImageData 저장
       │
       │  Phase 3: QC 검증
       │  ├─ POST /api/qc → Gemini 3 Flash (→2.0 폴백)
       │  │   server: compressImage() 512px
       │  │   server: 원본 vs 생성물 비교 프롬프트
       │  └─ 결과 → showQCResult()
       ▼
╔══════════════════════════════════════════════════════════════════╗
║            #result-overlay (Step 3: 생성 + QC 결과)               ║
║                                                                  ║
║  ┌────────────────────────────────────────┐                      ║
║  │  .photo-compare                        │                      ║
║  │  ┌──────────┐  ┌──────────┐            │                      ║
║  │  │  원본     │  │ AI 생성  │            │                      ║
║  │  │  사진     │  │  증명사진 │            │                      ║
║  │  └──────────┘  └──────────┘            │                      ║
║  └────────────────────────────────────────┘                      ║
║                                                                  ║
║  ┌────────────────────────────────────────┐                      ║
║  │  #qc-chat (QC 컨시어지 챗창)           │                      ║
║  │  🤖 "검수 완료! 완벽합니다!"           │  PASS                ║
║  │     [유사도 87%] [품질 양호]           │                      ║
║  │  ─── 또는 ───                          │                      ║
║  │  🤖 "재촬영 권장"                      │  FAIL                ║
║  │  💡 "촬영 팁: 자연광에서..."           │                      ║
║  └────────────────────────────────────────┘                      ║
║                                                                  ║
║  ┌──────────────────┐  ┌───────────────────────────┐             ║
║  │ [다시 찍기]       │  │ [📥 다운로드 (10c)]       │  PASS시 활성 ║
║  │ retakePhoto()    │  │ downloadResult()          │             ║
║  └──────────────────┘  └─────────────┬─────────────┘             ║
╚══════════════════════════════════════│═══════════════════════════╝
                                       │
       ┌───────────────────────────────┘
       │
       │ downloadResult()
       │ ├─ 로그인 유저: POST /api/credit/use (크레딧 -10c)
       │ │   ├─ 402 → showCreditModal()
       │ │   └─ 성공 → proceedDownload() → showPreview()
       │ └─ 비로그인: 바로 showPreview()
       ▼
╔══════════════════════════════════════════════════════════════════╗
║            #thankyou-screen (땡큐/미리보기 화면)                   ║
║                                                                  ║
║  ┌────────────────────────────────────────┐                      ║
║  │  .ty-preview (AI 증명사진 미리보기)     │                      ║
║  │  ┌──────────────────┐                  │                      ║
║  │  │                  │  photoGlow 애니   │                      ║
║  │  │   증명사진 이미지 │                  │                      ║
║  │  │                  │                  │                      ║
║  │  └──────────────────┘                  │                      ║
║  └────────────────────────────────────────┘                      ║
║                                                                  ║
║  ┌──── autoSave() 분기 ────────────────────────────────────────┐ ║
║  │                                                              │ ║
║  │  navigator.share 지원?                                       │ ║
║  │  ├─ YES → Web Share API → 공유시트                           │ ║
║  │  │   ├─ 저장 성공 → showComplete()                           │ ║
║  │  │   └─ 취소(AbortError) → return false                     │ ║
║  │  │                                                           │ ║
║  │  iOS?                                                        │ ║
║  │  ├─ YES → return false (iOS는 <a download> 불가)             │ ║
║  │  └─ NO → <a download> 자동 클릭 → return true               │ ║
║  │                                                              │ ║
║  │  saved=true ─────────▶ showComplete()                        │ ║
║  │  saved=false ────────▶ showSaveGuide()                       │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  ┌─ showComplete() ───────────────┐  ┌─ showSaveGuide() ──────┐ ║
║  │  ✓ SVG 체크마크 draw 애니       │  │  👆 "길게 눌러 저장"    │ ║
║  │  🎉 컨페티 8개                  │  │  → 롱프레스 대기        │ ║
║  │  "저장 완료!" scaleBounce      │  │  → 2초후 공유섹션 표시   │ ║
║  │  → 1.2초후 공유섹션 fadeIn     │  │  → contextmenu 감지 시   │ ║
║  └────────────────────────────────┘  │    showComplete() 호출   │ ║
║                                      └──────────────────────────┘ ║
║                                                                  ║
║  ┌────────────────────────────────────────┐                      ║
║  │  .ty-share-section (SNS 공유 이벤트)   │                      ║
║  │  🎁 "SNS 공유하고 10크레딧 받기!"      │                      ║
║  │  ① 화면 캡쳐 → ② SNS 공유 → ③ 텔레그램│                      ║
║  │  [✈️ 텔레그램으로 10c 받기]            │                      ║
║  └────────────────────────────────────────┘                      ║
║                                                                  ║
║  ┌────────────────────────────────────────┐                      ║
║  │  .ty-services (더 활용하기)             │                      ║
║  │  [📲 다시 저장] [📸 추가 촬영]          │                      ║
║  │  [✂️ 용도별 크롭] [🎨 배경 교체]        │  (미출시)            ║
║  └────────────────────────────────────────┘                      ║
║                                                                  ║
║  [🏠 메인]                                                       ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 3. 서버 데이터 흐름

```
클라이언트 (index.html)                    서버 (server.js)                     외부 서비스
═══════════════════                    ═══════════════════                  ═══════════════

[카메라 프레임]
  │ JPEG blob (1fps)
  ├───── WS binary ──────────────────▶ [WS handler]
  │                                     ├─ Buffer → base64
  │                                     ├─ gemini.sendRealtimeInput()
  │                                     │     │
  │                                     │     ├──────────────────────▶ Gemini 2.0 Flash Live
  │                                     │     │                        (Vertex AI ADC)
  │                                     │     ◀─── streaming text ───  "정면을 바라봐 주세요"
  │                                     │
  │   ◀── JSON {type:'ai-coaching'} ──  ├─ flushBuffer() (600ms 디바운스)
  │                                     │
  │                                     │
[set-style]                             │
  ├───── WS JSON ────────────────────▶  ├─ session.photoStyle = 'resume'
  │                                     │
  │                                     │
[사전분석]                              │
  ├── POST /api/pre-check ───────────▶ [HTTP handler]
  │   {image: base64}                   ├─ compressImage(512px, 60%)
  │                                     ├─ ai.models.generateContent() ──▶ Gemini 3 Flash
  │   ◀── {suitable, score} ──────────  │                                  (Vertex AI ADC)
  │                                     │
  │                                     │
[생성 요청]                             │
  ├── POST /api/generate ────────────▶ [HTTP handler]
  │   {image, style, gender, age,       ├─ useCredits(userId, 'generate')
  │    userId}                          │     │
  │                                     │     ├── POST /api/credits/use ──▶ Portal API
  │                                     │     │                             (monkos.ai)
  │                                     │     ◀── {success, credits} ─────  Firestore 차감
  │                                     │
  │                                     ├─ compressImage(720px, 70%)  ───▶ sharp (KR only)
  │                                     ├─ imagenAI.generateContent()
  │                                     │     │
  │                                     │     ├──────────────────────▶ Imagen NB3 Pro
  │                                     │     │                        (AI Studio API Key)
  │                                     │     ◀── image base64 ──────  gemini-3-pro-image
  │                                     │
  │   ◀── {image: dataUrl} ──────────  ├─ 실패 시 refundCredits()
  │                                     │
  │                                     │
[QC 요청]                               │
  ├── POST /api/qc ──────────────────▶ [HTTP handler]
  │   {original, generated,             ├─ compressImage(512px) x 2
  │    gender, age}                     ├─ ai.models.generateContent() ──▶ Gemini 3 Flash
  │                                     │   (원본+생성물 비교 프롬프트)      (→ 2.0 폴백)
  │   ◀── {identity, similarity,        │
  │        same_person, ...} ─────────  │
  │                                     │
  │                                     │
[크레딧 차감]                            │
  ├── POST /api/credit/use ──────────▶ [HTTP handler]
  │   {userId, type:'download'}         ├─ useCredits() ─────────────────▶ Portal API
  │   ◀── {success, credits} ─────────  │
```

---

## 4. 인증/결제 흐름

```
[KR 결제 흐름]
═══════════════
                                    Toss Payments
사용자                idphoto-kr    (클라이언트 SDK)        Portal API        Firestore
  │                      │               │                    │                  │
  ├─ 패키지 클릭 ────────▶               │                    │                  │
  │  buyCreditsKR(29900,30)              │                    │                  │
  │                      ├─ requestPayment() ─▶               │                  │
  │                      │               │                    │                  │
  │  ◀── 결제창 ─────────────────────────┤                    │                  │
  │  (카드 입력)         │               │                    │                  │
  │                      │               │                    │                  │
  │  결제 성공 리다이렉트  │               │                    │                  │
  │  /app?toss=success   │               │                    │                  │
  │  &paymentKey=...     │               │                    │                  │
  │                      │               │                    │                  │
  ├─ initFromTossResult()│               │                    │                  │
  │                      ├─ POST /api/payments/toss/confirm ──▶                  │
  │                      │               │                    ├─ Toss 서버 승인 ──▶
  │                      │               │                    ├─ 크레딧 충전 ──────▶ credits += 30
  │  ◀── "30c 충전완료!" ─────────────────────────────────────┤                  │
  │                      │               │                    │                  │


[JP 결제 흐름]
═══════════════
                                    Lemon Squeezy
사용자                idphoto-jp    (외부 결제 페이지)       Portal API        Firestore
  │                      │               │                    │                  │
  ├─ 패키지 클릭 ────────▶               │                    │                  │
  │  buyCredits('1297532')               │                    │                  │
  │                      ├─ window.open(Lemon Squeezy URL) ──▶                  │
  │  ◀── 외부 결제 페이지 ───────────────┤                    │                  │
  │  (결제 완료 후 탭 복귀)│              │                    │                  │
  │                      │               │                    │                  │
  ├─ visibilitychange ──▶               │                    │                  │
  │  fetchLatestCredits()│               │                    │                  │
  │                      ├─ GET /api/credits?userId=... ──────▶                  │
  │                      │               │                    ├─ 조회 ────────────▶
  │  ◀── 크레딧 갱신 ────────────────────────────────────────┤                  │


[OAuth 로그인 흐름]
═══════════════════
사용자              idphoto-kr/jp         Portal (monkos.ai)         Provider
  │                      │                      │                      │
  ├─ loginGoogle() ──────▶                      │                      │
  │                      ├─ 리다이렉트 ──────────▶                      │
  │                      │  /auth/google         ├─ OAuth 시작 ─────────▶ Google
  │  ◀── Google 로그인 ──────────────────────────────────────────────── ┤
  │  (인증 완료)         │                      │                      │
  │                      │  ◀── 리다이렉트 ──────┤                      │
  │                      │  /app?uid=...&token=..│                      │
  │                      │                      │                      │
  ├─ initFromUrlToken() ─▶                      │                      │
  │                      ├─ GET /api/auth/verify ▶ 토큰 검증            │
  │                      │  ◀── {user} ─────────┤                      │
  │  sessionStorage 저장 ◀                      │                      │
```

---

## 5. KR/JP 리전 분기 맵

```
                    ┌──────────────────────────────────────────────────┐
                    │              공통 코어 (~70%)                     │
                    │                                                  │
                    │  [Util]        t(), log(), apiPost(),            │
                    │                toJpegDataUrl(), detectChange(),  │
                    │                addTouchClickHandler(), isMobile()│
                    │                                                  │
                    │  [Camera/WS]   initCamera(), connectWS(),       │
                    │                startFrameCapture(),              │
                    │                showCoaching(), capturePhoto()    │
                    │                                                  │
                    │  [Generate]    confirmAndGenerate(),             │
                    │                showQCResult(), cropToSpec()      │
                    │                                                  │
                    │  [Download]    downloadResult(), showPreview(),  │
                    │                autoSave(), showComplete(),       │
                    │                showSaveGuide()                   │
                    │                                                  │
                    │  [CSS]         레이아웃, 카메라, 결과, 땡큐,     │
                    │                애니메이션 (99% 동일)              │
                    │                                                  │
                    │  [HTML]        화면 구조, 컴포넌트 (90% 동일)    │
                    │                                                  │
                    │  [Server]      HTTP/WS 서버, AI API 호출,       │
                    │                크레딧 API, 정적파일 서빙          │
                    │                Imagen 프롬프트 (IDENTITY 공통)    │
                    └───────────────────────┬──────────────────────────┘
                                            │
                    ┌───────────────────────┴──────────────────────────┐
                    │                                                  │
          ┌─────────▼─────────┐                          ┌─────────────▼─────────┐
          │    KR 리전 (~30%)  │                          │    JP 리전 (~30%)      │
          │                   │                          │                       │
          │ [텍스트]           │                          │ [テキスト]              │
          │  TX 상수 전체 한국어│                          │  TX 상수 전체 일본어    │
          │  QC 프롬프트 한국어 │                          │  QC プロンプト 日本語   │
          │  코칭 프롬프트 한국어│                          │  コーチング 日本語      │
          │                   │                          │                       │
          │ [폰트]             │                          │ [フォント]              │
          │  Noto Sans KR     │                          │  Noto Sans JP          │
          │                   │                          │                       │
          │ [결제]             │                          │ [決済]                  │
          │  토스페이먼츠       │                          │  Lemon Squeezy         │
          │  buyCreditsKR()   │                          │  buyCredits()          │
          │  ₩12,900/₩29,900 │                          │  $10/$25/$40           │
          │  TOSS SDK 로드     │                          │  외부 URL 오픈          │
          │                   │                          │                       │
          │ [로그인]           │                          │ [ログイン]              │
          │  카카오 + Google   │                          │  LINE + Google         │
          │  loginKakao()     │                          │  loginLINE()           │
          │                   │                          │                       │
          │ [UI 차이]          │                          │ [UI 差異]               │
          │  .prep-style-option│                          │  .prep-style-chip      │
          │  (카드형 선택)     │                          │  (칩형 선택)            │
          │                   │                          │  + 의상 선택 UI         │
          │                   │                          │  .prep-outfit-chip     │
          │                   │                          │  (리크루트 스츠 등)     │
          │ [의상 프롬프트]    │                          │ [衣装プロンプト]         │
          │  일반 비즈니스 정장 │                          │  リクルートスーツ        │
          │                   │                          │  검정 무지 + 흰블라우스  │
          │ [서버 차이]        │                          │ [サーバー差異]           │
          │  sharp 의존성 有   │                          │  sharp 없음             │
          │  resume 프롬프트:  │                          │  resume プロンプト:     │
          │  Korean business  │                          │  Japanese recruit suit │
          └───────────────────┘                          └───────────────────────┘
```

---

## 6. 빌드/배포 파이프라인

```
[소스코드]                    [Docker Build]                    [Cloud Run]
═══════════                  ══════════════                    ═══════════

develop 브랜치               gcloud builds submit
     │                            │
     ▼                            ▼
┌──────────┐              ┌──────────────────┐
│ public/  │              │  Stage 1: builder │
│  index   │─── COPY ────▶│                  │
│  .html   │              │  npm install     │
│          │              │  javascript-     │
│ obfusc-  │─── COPY ────▶│  obfuscator      │
│ ate.mjs  │              │                  │
│          │              │  node obfuscate  │
│          │              │  .mjs            │
│          │              │  ┌────────────┐  │
│          │              │  │ index.html │  │
│          │              │  │ 인라인 JS  │  │
│          │              │  │ → 난독화   │  │
│          │              │  └────────────┘  │
│          │              └────────┬─────────┘
│          │                       │ COPY --from=builder
│          │                       ▼
│ package  │              ┌──────────────────┐
│ .json    │─── COPY ────▶│  Stage 2: runtime│
│          │              │                  │
│ server   │─── COPY ────▶│  npm install     │         ┌────────────────┐
│ .js      │              │  --production    │         │ Cloud Run      │
│          │              │                  │         │                │
│          │              │  node server.js  │── deploy▶│ us-central1   │
│          │              └──────────────────┘         │                │
│          │                                           │ 환경변수:      │
│          │                                           │ PROJECT_ID     │
│          │                                           │ LOCATION       │
│          │                                           │ GCS_BUCKET     │
│          │                                           │ GEMINI_API_KEY │
│          │                                           └────────────────┘
│          │
│          │              ⚠️ 난독화 한계:
│          │              obfuscate.mjs는 인라인 <script> 블록만 처리
│          │              외부 .js 파일은 난독화 안 됨
│          │              → 파일 분리 시 난독화 전략 변경 필수
└──────────┘


[배포 명령]

  ./deploy.sh dev          ./deploy.sh prod
       │                        │
       ▼                        ▼
  서비스명:                 브랜치 체크:
  monkos-idphoto-kr-dev     main 브랜치만 허용
  512Mi / 1 CPU / max 2     확인 프롬프트 (y/N)
                            서비스명:
                            monkos-idphoto-kr
                            2Gi / 2 CPU / max 10
```

---

## 7. 전역 상태 관리 맵

```
┌─────────────────────────────────────────────────────────────┐
│                     전역 상태 (window scope)                  │
│                                                             │
│  [상수 — 변경 불가]                                          │
│  ├─ MAX_CAPTURE_SIZE = 720      프레임 캡처 최대 크기        │
│  ├─ COACHING_DISPLAY_MS = 10000 코칭 표시 시간               │
│  ├─ FRAME_INTERVAL_MS = 1000    프레임 전송 간격 (1fps)      │
│  ├─ CAPTURE_SIZE = 512          WS 전송용 프레임 크기         │
│  ├─ DPI = 300                   출력 해상도                   │
│  ├─ TX = { ... }                UI 텍스트 상수 (한국어/일본어) │
│  ├─ PHOTO_SPECS = { ... }       규격 테이블 (mm)             │
│  ├─ PORTAL_URL = 'https://monkos.ai'                        │
│  ├─ CREDIT_COST = { generate:1, download:10 }               │
│  └─ TOSS_CLIENT_KEY = '...'     (KR only)                   │
│                                                             │
│  [상태 — 세션 중 변경]                                       │
│  ├─ ws              WebSocket 인스턴스 (코칭 중에만 존재)     │
│  ├─ cameraStream    MediaStream (카메라 활성 시)              │
│  ├─ frameTimer      setInterval ID (프레임 캡처)             │
│  ├─ coachingTimeout setTimeout ID (코칭 메시지 숨김)          │
│  ├─ isReady         boolean (AI가 촬영 OK 판정)              │
│  ├─ currentStep     0~3 (준비→코칭→확인→생성)                │
│  ├─ prevFrameData   ImageData (변화 감지용)                  │
│  ├─ voiceEnabled    boolean (TTS on/off)                    │
│  ├─ koVoice         SpeechSynthesisVoice                    │
│  ├─ mediapipeFaceDetector  FaceDetector 인스턴스             │
│  │                                                          │
│  ├─ selectedStyle   'id_photo' | 'resume' | null            │
│  ├─ selectedGender  'male' | 'female' | null                │
│  ├─ selectedAge     'child' | 'teen' | 'adult' | null       │
│  │                                                          │
│  ├─ capturedImageData   base64 (촬영 원본)                   │
│  ├─ generatedImageData  base64 (AI 생성 결과)                │
│  ├─ croppedImageData    base64 (규격 크롭 결과)              │
│  │                                                          │
│  ├─ userId          string | null (로그인 시 설정)           │
│  └─ userCredits     number (크레딧 잔액)                     │
│                                                             │
│  [DOM 참조]                                                  │
│  ├─ video           #camera-video                           │
│  ├─ captureCanvas   #capture-canvas                         │
│  └─ logEl           #log                                    │
│                                                             │
│  [데드코드]                                                  │
│  ├─ downloadCompleted  (선언만, 미사용)                      │
│  ├─ goToPurchase()     (내부에서 모달 열기만 — 사실상 중복)   │
│  ├─ regenerate()       (confirmAndGenerate 래퍼 — 미호출)    │
│  └─ disableShareButtons() (미호출)                           │
└─────────────────────────────────────────────────────────────┘
```
