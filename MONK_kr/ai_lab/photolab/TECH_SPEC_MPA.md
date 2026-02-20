# photolab 기술명세

**최종 갱신**: [2026-02-20 17:34 KST] M1/막내1
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
| API 호출 | CF Pages Functions → Gemini API 직접 호출 |
| 코칭 | REST ~2fps (CF Function → Gemini Flash) |
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

### prep.html + prep.js (준비실)
- 용도 선택: `id_photo` (여권/신분증) / `resume` (취업/컬러증명)
- 성별: `male` / `female`
- 연령: `child` (유아~12세) / `teen` (13~18세) / `adult` (19세+)
- 3개 모두 선택 시 확인 멘트 표시 + 버튼 활성화
- `saveSessionData()` → `camera.html` 이동

### camera.html + camera.js (촬영실)
- `Monk.media()` 카메라 시작 (전면, 미러링, faceDetection)
- 얼굴 가이드 오버레이 + 스타일 변경 바
- **AI 코칭 REST 루프** (~2fps, 백프레셔 안전):
  - `FRAME_INTERVAL_MS` (500ms) 간격으로 프레임 캡처
  - 모션 감지 (3% 변화 임계) → 변화 없으면 스킵
  - `POST /api/idphoto-coaching` → `{ text, ready }` 응답
  - ready=true 시 촬영 버튼 + 가이드 `ready` 클래스
- **음성 TTS**: Web Speech API (`speechSynthesis`), 한국어 Yuna 우선
- 촬영 → `saveSessionData('captured')` → `result.html` 이동
- 선택 데이터 없으면 `prep.html`로 리다이렉트

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
키                    prep.js    camera.js    result.js    thankyou.js
─────────────────    ────────   ──────────   ──────────   ───────────
monkos_style         save →     ← load       ← load
monkos_gender        save →     ← load       ← load
monkos_age           save →     ← load       ← load
monkos_captured                 save →       ← load
monkos_cropped                               save →      ← load
monkos_user          (인증 시 shared.js에서 관리)
```

**용량**: captured ~100KB (JPEG 0.8), cropped ~50KB → 합계 ~200KB (5MB 한도 내)

## 6. API 경로

모든 API는 CF Pages Functions (루트 `functions/`) → Gemini API 직접 호출.
Cloud Run(idphoto-kr) 프록시 아님.

| config.js 키 | 엔드포인트 | CF Function | 백엔드 |
|--------------|-----------|-------------|--------|
| `PRECHECK` | `/api/precheck` | `functions/api/precheck.js` | Gemini Flash (사전분석) |
| `GENERATE` | `/api/idgen` | `functions/api/idgen.js` | Gemini 3 Pro Image (I2I 생성) |
| `COACHING` | `/api/idphoto-coaching` | `functions/api/idphoto-coaching.js` | Gemini Flash (코칭) |
| `CREDIT_USE` | `/api/idphoto-credit-use` | `functions/api/idphoto-credit-use.js` | monkos.ai 크레딧 API |
| (shared.js) | `/api/payment/confirm` | — | monkos.ai 결제 확인 |
| (shared.js) | `/api/auth/verify` | — | monkos.ai 토큰 검증 |
| (shared.js) | `/api/credits` | — | monkos.ai 크레딧 조회 |

**주의사항**:
- `idgen.js`: `responseModalities` 사용 금지 (에러 발생). `photo.js` 패턴 준수
- API Key: `env.GEMINI_API_KEY` (CF Pages Secrets)

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
| `FRAME_INTERVAL_MS` | 500 | 코칭 프레임 간격 (ms) |
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

## 11. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-02-18 | SPA → MPA 전환 완료. 5페이지 + shared.js 구조 |
| 2026-02-19 | index.html LP 분리 (가격표 + 이벤트). prep.html 준비실 독립 |
| 2026-02-20 | 코칭 REST 실동작 (CF Function). API 경로 CF 자체 엔진으로 전환 |
| 2026-02-20 | 기술명세 현행화 (본 문서) |
