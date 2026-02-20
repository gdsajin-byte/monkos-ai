# photolab 기술명세

**최종 갱신**: [2026-02-21 08:51 KST] Mac Mini/막내2
**URL**: `https://monk.kr/ai_lab/photolab/`
**플랫폼**: Cloudflare Pages (monk-kr)
**프레임워크**: monk.js (자체) — Store + Pipe(REST) + Media

---

## 1. 아키텍처

MPA 6페이지 구조. SPA(app.js)에서 전환 완료 (2026-02-18).

| 항목 | 설명 |
|------|------|
| 화면 전환 | `location.href` (페이지 이동) |
| 데이터 전달 | `sessionStorage` (`monkos_` prefix) |
| API 호출 | CF Pages Functions → Gemini API 직접 호출 (자체 완결) |
| 코칭 | REST ~2fps (CF Function → Gemini 2.5 Flash) |
| 결제 | 토스페이먼츠 (KR 전용, 크레딧 충전) |
| 인증 | monkos.ai 포털 토큰 기반 (`?uid=&token=`) |
| 모바일 전용 | 데스크톱 차단 (`?dev`로 우회) |

## 2. 페이지 흐름

```
index.html (LP/가격)
    ↓ CTA 클릭
prep.html (준비실: 용도/성별/연령 선택)
    ↓ 촬영 시작
camera.html (촬영실: 카메라 + AI 코칭)
    ↓ 촬영
result.html (분석실: 사전분석 → 생성 → 다운로드)
    ↓ 다운로드 (크레딧 차감 + 규격 크롭)
thankyou.html (수령처: 사진 저장 + SNS 이벤트)
    ↓
options.html (네비: 새로 촬영 / 추가 촬영 / 이벤트 / 포털)
```

## 3. 파일 구조

```
MONK_kr/ai_lab/photolab/
├── index.html          ← LP (가격표 + 이벤트 + 사업자 정보)
├── prep.html           ← 준비실 (용도/성별/연령 선택)
├── camera.html         ← 촬영실 (카메라 + AI 코칭 REST)
├── result.html         ← 분석실 (사전분석 → 생성 → 다운로드)
├── thankyou.html       ← 수령처 (크롭 사진 표시 + 갤러리 저장)
├── options.html        ← 옵션N (네비게이션 카드)
│
├── shared.js           ← 공통 (Store, Pipe REST, 인증, 크레딧, 결제, 유틸)
├── prep.js             ← 준비실 JS
├── camera.js           ← 촬영실 JS (코칭 루프 + 모션 감지 + TTS)
├── result.js           ← 분석실 JS (파이프라인 + 크롭)
├── thankyou.js         ← 수령처 JS (갤러리 저장 + 텔레그램)
├── options.js          ← 옵션N JS (네비게이션)
│
├── config.js           ← API 경로 + 상수 + 규격 테이블
├── monk.js             ← 프레임워크 (Store + Pipe + Media)
├── app.css             ← 전 페이지 공유 스타일
│
├── _backup_20260217/   ← MPA 전환 전 백업
├── _legacy/            ← 레거시 HTML
│
├── app.js                  ← [잔류] SPA 원본
├── app_spa_backup.js       ← [잔류] SPA 백업
├── monk_spa_backup.js      ← [잔류] SPA 백업
├── index_spa_backup.html   ← [잔류] SPA 백업
├── index_00079.html        ← [잔류] SPA 원본 (94KB)
│
├── PAGE_SPLIT_ANALYSIS.md  ← [참조] MPA 분할 분석
├── TECH_SPEC_MPA.md        ← [본 문서]
├── flowchart_00079.html    ← [참조] SPA 플로차트
├── flowchart_page_split.html ← [참조] MPA 플로차트
├── framework_design.html   ← [참조] monk.js 설계
└── test.html               ← [참조] 테스트
```

## 4. 페이지별 책임

### index.html (LP — JS 없음)
- 히어로 + 서비스 소개 + 기능 목록
- 가격: 생성 1c(₩1,500) + 다운로드 8c(₩12,000) = 1장 9c(₩13,500)
- 이벤트: 가입 시 10c 무료 (→ monkos.ai)
- 사업자 정보 + 법적 링크 (Privacy/Terms/Refund → monkos.ai)
- CTA → `prep.html` 이동

### prep.html + prep.js (준비실) — 9단계 키오스크 퍼널
- **Step 1** 용도: `passport`(여권), `student_id`(학생증), `employee_id`(사원증), `resume`(이력서), `color_portrait`(컬러증명)
- **Step 2** 성별: `male` / `female`
- **Step 3** 연령: `child` (유아~12세) / `teen` (13~18세) / `adult` (19세+)
- **Step 4** 의상: `suit`(정장), `shirt`(셔츠/블라우스), `casual`(캐주얼), `uniform`(교복), `as_is`(현재 그대로)
- **Step 5** 의상색상: `black`, `navy`, `charcoal`, `white`, `beige`, `wine`, `pastel`
- **Step 6** 넥타이 (남성만): `solid_navy`, `solid_wine`, `stripe_blue`, `stripe_navy`, `stripe_wine`, `none`
- **Step 7** 헤어: `tidy`(정돈), `up`(올림), `down`(내림), `as_is`(현재 그대로)
- **Step 8** 배경: `white`, `light_gray`, `light_blue`
- **Step 9** 표정: `neutral`(무표정), `gentle_smile`(잔잔한 미소), `natural_smile`(자연스러운 미소), `bright_smile`(밝은 미소)
- 9필드 모두 `saveSessionData()` → `camera.html` 이동
- 성별/용도 조합에 따라 조건부 스텝 (예: 넥타이는 남성 정장만)

### camera.html + camera.js (촬영실)
- `Monk.media()` 카메라 시작 (전면, 미러링, faceDetection)
- 얼굴 가이드 오버레이 + 선택 요약 뱃지 (#selection-summary)
- sessionStorage에서 **9필드 로딩**: purpose, age, gender, clothing, clothingColor, tie, hair, background, expression
- 필수값 체크: `store.style` + `purpose` 없으면 `prep.html` 리다이렉트
- **AI 코칭 순차 루프** (응답 완료 → 300ms → 최신 프레임):
  - 순차 while 루프 (setInterval 폐기) — 항상 "지금" 프레임 분석
  - `coachingGen` 세대 카운터로 stale 응답 폐기
  - `POST /api/idphoto-coaching` → base64 이미지 + 9필드 전송 → `{ text, ready }` 응답
  - ready=true 시 촬영 버튼 + 가이드 `ready` 클래스
- **음성 TTS**: Web Speech API (`speechSynthesis`), 한국어 Yuna 우선, `ko` 폴백
  - `store.voiceEnabled = true` 기본값 (음성 ON 초기화)
  - cancel 후 50ms 딜레이 → 새 발화 (싱크 보장)
- 촬영 → `saveSessionData('captured')` → `result.html` 이동

### result.html + result.js (분석실)
- sessionStorage에서 `captured` 로드 → 원본 표시
- **파이프라인** (QC 단계 제거됨):
  1. **사전분석** (`pipe.run('precheck')`) → score + suitable 판정
     - NG 시: 재촬영 권장 메시지 + Step2 버튼
  2. **AI 생성** (`pipe.run('generate')`) → 생성 이미지 반환
     - 402 시: 크레딧 모달
     - 에러 시: 에러 메시지 + Step2 버튼
  3. **다운로드** → 크레딧 차감 (`pipe.run('creditUse')`) → 규격 크롭 (`media.crop()`) → `thankyou.html` 이동
- 비로그인: 크레딧 차감 없이 바로 크롭 → 수령처

### thankyou.html + thankyou.js (수령처)
- sessionStorage에서 `cropped` 로드 → 사진 표시
- **갤러리 저장**: `navigator.share` (파일 공유) → 미지원 시 `<a download>` 폴백
- **SNS 이벤트**: 화면 캡쳐 → SNS 공유 → 텔레그램 전송 → 10c 지급
- 추가 활용: 다시 저장, 추가 촬영, 용도별 크롭(미출시), 배경 교체(미출시)
- 크롭 데이터 없으면 `prep.html`로 리다이렉트

### options.html + options.js (옵션N)
- 새로 촬영 (`clearSessionImages()` → `prep.html`)
- 추가 촬영 (`clearSessionImages()` → `camera.html`, 설정 유지)
- 이벤트 참여 (텔레그램 봇)
- MONK 포털 (`monk.kr`)

## 5. sessionStorage 데이터 흐름

```
키                      prep.js    camera.js    result.js    thankyou.js
───────────────────    ────────   ──────────   ──────────   ───────────
monkos_style            save →     ← load       ← load
monkos_gender           save →     ← load       ← load
monkos_age              save →     ← load       ← load
monkos_purpose          save →     ← load       ← load
monkos_clothing         save →     ← load
monkos_clothingColor    save →     ← load
monkos_tie              save →     ← load
monkos_hair             save →     ← load
monkos_background       save →     ← load
monkos_expression       save →     ← load
monkos_captured                    save →       ← load
monkos_cropped                                  save →      ← load
monkos_user             (인증 시 shared.js에서 관리)
```

**용량**: 9필드 텍스트 ~1KB + captured ~100KB (JPEG 0.8) + cropped ~50KB → 합계 ~200KB (5MB 한도 내)

## 6. API 경로

### 6-1. 배포라인 교차 금지 원칙 (2026-02-21 확정)

```
MONK (monk.kr)                  MONKOS (monkos.ai)
├── CF Pages (프론트)            ├── Cloud Run (서비스)
├── CF Functions (AI 엔진)       ├── 독립 엔진 (CF 로직 클론)
│   자체 완결                    │   자체 완결
│                               │
└── 개발/테스트                  └── 프로덕션
     └──── 교차 호출 없음 ─────┘
```

- monk.kr의 AI 호출은 **CF Functions 내에서 자체 완결**. monkos.ai 서버로 프록시/교차 호출 금지
- monkos.ai 이관 시: CF Functions 로직을 **Cloud Run으로 클론** (같은 코드, 별도 배포)
- 인증/크레딧/결제만 예외적으로 monkos.ai 포탈 API 경유 (이들은 포탈 고유 기능)

### 6-2. config.js API 매핑 (현행)

모든 AI API는 CF Pages Functions (루트 `functions/`) → Gemini API 직접 호출.

| config.js 키 | 엔드포인트 | CF Function | 백엔드 | 모델 |
|--------------|-----------|-------------|--------|------|
| `PRECHECK` | `/api/precheck` | `functions/api/precheck.js` | Gemini API 직접 | `gemini-2.0-flash` |
| `GENERATE` | `/api/idgen` | `functions/api/idgen.js` | Gemini API 직접 | `gemini-3-pro-image-preview` (I2I, 9필드 동적 프롬프트) |
| `COACHING` | `/api/idphoto-coaching` | `functions/api/idphoto-coaching.js` | Gemini API 직접 | `gemini-2.5-flash` (thinkingBudget:0) |
| `CREDIT_USE` | `/api/idphoto-credit-use` | `functions/api/idphoto-credit-use.js` | monkos.ai 프록시 | — |

**비고**:
- QC는 config.js에서 제거됨 (2026-02-21). MPA에서 QC 미사용 (00079 QC 제거 결정 유지)
- `CREDIT_USE`만 monkos.ai 경유 (크레딧은 포탈 Firestore 관리)

### 6-3. 포탈 경유 API (shared.js 직접 호출)

| 엔드포인트 | 용도 | 호출 위치 |
|-----------|------|----------|
| `monkos.ai/api/payment/confirm` | 토스 결제 확인 | shared.js |
| `monkos.ai/api/auth/verify` | 토큰 인증 | shared.js |
| `monkos.ai/api/credits` | 크레딧 조회 | shared.js |

### 6-4. CF Functions 코칭 상세 (idphoto-coaching.js)

```
[camera.js] 순차 while 루프 (응답 완료 → 300ms → 최신 프레임 캡처)
    ↓ coachingGen 세대 카운터 (stale 응답 폐기)
[CF Function] POST /api/idphoto-coaching
    ↓ 9필드 동적 프롬프트 빌더 (buildCoachingPrompt)
    ↓ Gemini 2.5 Flash REST API (thinkingBudget: 0)
    ↓ READY 키워드 판정
[camera.js] { text: "고개를 들어주세요", ready: false }
    ↓ 코칭 오버레이 표시 + TTS 발화 (cancel + 50ms 딜레이)
```

**코칭 루프 설계 원칙** (2026-02-21 확정):
- setInterval 방식 폐기 → 순차 while 루프 채택
- **항상 최신 프레임**: 응답 완료 후 "지금" 상태 캡처 (2초 전 분석 방지)
- **stale 응답 폐기**: `coachingGen` 카운터로 대기 중 stop/재시작 시 구응답 무시
- **TTS 싱크**: `speechSynthesis.cancel()` 후 50ms 딜레이 → 새 발화 (브라우저 cancel 처리 대기)

**프롬프트 분기**:
- `id_photo`: 정면 응시, 조명, 표정, 눈썹, 얼굴 라인 체크 (5항목)
- `resume`: 정면 응시, 조명, 표정, 자세 체크 (4항목, 눈썹/얼굴라인 제거)

**9필드 동적 컨텍스트**: style, purpose, gender, age, clothing, clothingColor, tie, hair, expression

**READY 키워드**: `좋아요`, `완벽`, `촬영하세요`, `OK`, `좋습니다`, `잘 맞`, `훌륭`, `지금`

**주의사항**:
- `idgen.js`: `responseModalities` 사용 금지 (에러 발생). `photo.js` 패턴 준수
- API Key: `env.GEMINI_API_KEY` (CF Pages Secrets, `wrangler pages secret put`)
- `gemini-2.5-flash`는 thinking 모드 기본 ON → `thinkingConfig: { thinkingBudget: 0 }` 필수

### 6-5. CF Functions 생성 상세 (idgen.js — 동적 프롬프트 빌더)

```
[result.js] confirmAndGenerate()
    ↓ 9필드 전체 전송 (purpose, clothing, clothingColor, tie, hair, background, expression + style, gender, age)
[CF Function] POST /api/idgen
    ↓ buildPrompt(body) — 동적 프롬프트 조립
    ↓ Gemini 3 Pro Image Preview (I2I)
[result.js] { image: "data:image/png;base64,..." }
```

**프롬프트 구조** (고정값 + 동적값 샌드위치):
```
IDENTITY_PRESERVATION          ← 고정 (90:10 + 정면 + 정체성)

[IMAGE-TO-IMAGE TRANSFORM]
[STYLE] PURPOSE_PROMPTS[용도]  ← 고정 (perfectly front-facing 포함)
[BACKGROUND] BG_PROMPTS[배경]  ← 동적 (퍼널)
[SUBJECT] 성별/연령             ← 동적 (퍼널)
[OUTFIT] 의상+색상+넥타이       ← 동적 (퍼널, 여성 셔츠→블라우스 분기)
[HAIR] 헤어                    ← 동적 (퍼널)
[EXPRESSION] 표정              ← 동적 (퍼널)
[CONSTRAINT] 변경 금지          ← 고정 (성별/연령/얼굴 변경 금지)
```

**룩업 테이블**: `BG_PROMPTS`, `CLOTHING_PROMPTS`, `CLOTHING_COLOR_PROMPTS`, `TIE_PROMPTS`, `EXPRESSION_PROMPTS`, `HAIR_PROMPTS`, `PURPOSE_PROMPTS`

## 7. 공통 컴포넌트 (HTML 중복)

아래 요소가 prep/camera/result/thankyou/options 5개 HTML에 동일하게 포함:

| 컴포넌트 | 역할 |
|---------|------|
| `#inapp-banner` | 인앱 브라우저 경고 (`data-show="inappBrowser"`) |
| `#desktop-blocker` | 데스크톱 차단 + QR 코드 (`data-class="desktopBlocked:active"`) |
| `#header` | 브랜드 + step-label + 크레딧 배지 |
| `#credit-modal` | 크레딧 부족 모달 (3단계 패키지: 10c/30c/50c) |
| `<link href="app.css">` | 공통 스타일시트 |
| `<script src="tosspayments">` | 토스페이먼츠 SDK |
| `#log` | 디버그 로그 |

## 8. 설정값 (config.js)

| 상수 | 값 | 용도 |
|------|-----|------|
| `CREDIT_COST.generate` | 1 | 생성 크레딧 |
| `CREDIT_COST.download` | 8 | 다운로드 크레딧 |
| `MAX_CAPTURE_SIZE` | 720 | 캡처 최대 해상도 |
| `CAPTURE_SIZE` | 512 | 코칭 프레임 크기 |
| `FRAME_INTERVAL_MS` | 500 | (미사용, 순차 루프 전환) |
| `COACHING_DISPLAY_MS` | 10000 | 코칭 텍스트 표시 시간 (ms) |
| `DPI` | 300 | 출력 DPI |

### 규격 테이블 (PHOTO_SPECS)

| 키 | 이름 | 크기 | 얼굴 상단 | 얼굴 길이 |
|----|------|------|----------|----------|
| `id_photo` | 여권/증명사진 | 35×45mm | 7mm | 27mm |
| `resume` | 이력서 | 30×40mm | 6mm | 24mm |

## 9. 배포

```bash
# CWD = monk_project (루트 functions/ 참조)
wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main
```

- **프로덕션**: `https://monk.kr/ai_lab/photolab/`
- **데스크톱 테스트**: `?dev` 파라미터 추가
- **CF Functions 정본**: 루트 `functions/` (실제 디렉토리)

## 10. 알려진 이슈

| # | 이슈 | 상태 | 설명 |
|---|------|------|------|
| 1 | 생성 지연 체감 | 미해결 | Gemini I2I ~15-30초. 프로그레스 UI 개선 필요 |
| 2 | SPA 잔류 파일 | 미해결 | `app.js`, `*_spa_backup.*`, `index_00079.html` — 정리 보류 |
| 3 | app.css 미분할 | 미해결 | 전 페이지가 공유. 페이지별 분할은 후순위 |
| 4 | HTML 공통 요소 중복 | 미해결 | 헤더/모달/배너 5개 HTML에 복사. SSI 불가(정적 호스팅) |
| 5 | TOSS_CLIENT_KEY 미설정 | 미해결 | 결제 미연동 (빈 문자열) |
| 6 | 용도별 크롭/배경 교체 | 미출시 | thankyou.html에 버튼만 존재 (`alert('곧 출시 예정')`) |
| 7 | TTS 일본어 음성 | 해결 | `koVoice=null` 시 발화 차단 (가드 적용). `voiceEnabled=true` 기본값 설정 |
| 8 | ai_lab.html 인사 모달 | 미해결 | 포토랩 진입 전 인사 음성 출력. 원인 조사 필요 (작가님 판단 대기) |
| 9 | 포탈 server.js 원복 필요 | 미해결 | 막내3이 추가한 코칭/QC 코드 236줄 제거 필요 (배포라인 교차 금지 원칙) |

## 11. monkos 이관 전략

### 현재 (monk.kr — CF 기반)
```
monk.kr (CF Pages)
├── 프론트: HTML/JS/CSS (정적 배포)
├── AI 엔진: CF Functions (Gemini API Key)
│   ├── /api/idphoto-coaching (코칭, Gemini 2.5 Flash)
│   ├── /api/precheck (사전분석, Gemini 2.0 Flash)
│   └── /api/idgen (생성, Gemini 3 Pro Image)
└── 크레딧/인증: monkos.ai 포탈 API 경유
```

### 이관 시 (monkos.ai — Cloud Run 기반)
```
monkos.ai (Cloud Run)
├── 프론트: 동일 HTML/JS/CSS
├── AI 엔진: 같은 서버 프로세스 (Vertex AI ADC)
│   ├── /api/coaching (코칭, 동일 로직 클론)
│   ├── /api/precheck (사전분석, 동일 로직 클론)
│   └── /api/idgen (생성, 동일 로직 클론)
└── 크레딧/인증: 동일 서버 내 처리
```

**핵심**: CF Functions 로직을 Cloud Run으로 클론 (교차 호출 없이 자체 완결)

## 12. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-02-18 | SPA → MPA 전환 완료. 5페이지 + shared.js 구조 |
| 2026-02-19 | index.html LP 분리 (가격표 + 이벤트). prep.html 준비실 독립 |
| 2026-02-20 | 코칭 REST 실동작 (CF Function). API 경로 CF 자체 엔진으로 전환 |
| 2026-02-20 | 기술명세 현행화 |
| 2026-02-21 | 코칭 모델 `gemini-2.5-flash` 확정. CF Functions 배포 정상화 |
| 2026-02-21 | 9단계 키오스크 퍼널 (prep.js 9필드) 추가 |
| 2026-02-21 | config.js QC 행 제거 (MPA에서 QC 미사용) |
| 2026-02-21 | **배포라인 교차 금지 원칙** 확립. 포탈 코칭/QC 코드 원복 결정 |
| 2026-02-21 | monkos 이관 전략 추가. CF Functions → Cloud Run 클론 방식 확정 |
| 2026-02-21 | 기술명세 갱신 (본 문서) |
| 2026-02-21 | idgen.js 동적 프롬프트 빌더 전환 (하드코딩 → 9필드 buildPrompt) |
| 2026-02-21 | result.js 9필드 전체 전송 (purpose, clothing, clothingColor, tie, hair, background, expression 추가) |
| 2026-02-21 | 코칭 루프 setInterval → 순차 while 루프 전환 (stale 응답 방지) |
| 2026-02-21 | 모션 감지 제거 + voiceEnabled=true 초기화 + TTS cancel 딜레이 |
| 2026-02-21 | idgen.js 에러 핸들링 개선 (Gemini API 에러 상세 클라이언트 전달) |
