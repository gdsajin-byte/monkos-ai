# functions — Cloudflare Pages Functions

> monk.kr 서버리스 API | 배포: `wrangler pages deploy MONK_kr/`와 함께 자동 배포

## 배포

별도 배포 명령 없음. MONK_kr 배포 시 자동 포함.

```bash
# MONK_kr 배포 시 functions/api/* 자동 배포
wrangler pages deploy MONK_kr/ --project-name=monk-kr
```

**주의**: wrangler는 **CWD의 `functions/`**를 참조한다. `MONK_kr/functions/`가 아님.

## API 목록

### AI 증명사진 파이프라인

| 파일 | 엔드포인트 | 기능 | Gemini 모델 |
|------|-----------|------|------------|
| `photo.js` | `POST /api/photo` | T2I 이미지 생성 | gemini-3-pro-image |
| `idgen.js` | `POST /api/idgen` | I2I 증명사진 생성 | gemini-3-pro-image-preview |
| `precheck.js` | `POST /api/precheck` | 촬영본 사전분석 | gemini-2.0-flash |
| `qc.js` | `POST /api/qc` | 생성물 QC 검증 | gemini-2.0-flash |
| `idphoto-coaching.js` | `POST /api/idphoto-coaching` | AI 촬영 코칭 | gemini-2.0-flash |
| `idphoto-credit-use.js` | `POST /api/idphoto-credit-use` | 크레딧 차감 프록시 | — (→ idphoto-kr) |

### 인증/결제

| 파일 | 엔드포인트 | 기능 |
|------|-----------|------|
| `auth.js` | `GET/POST /api/auth` | 카카오/구글 OAuth |
| `payment.js` | `POST /api/payment` | 토스페이먼츠 결제 |
| `simple-signup.js` | `POST /api/simple-signup` | 간편가입 |

### 데이터/알림

| 파일 | 엔드포인트 | 기능 |
|------|-----------|------|
| `tx.js` | `POST /api/tx` | 거래 관리 (D1) |
| `visitor.js` | `POST /api/visitor` | 방문자 추적 (D1) |
| `telegram-webhook.js` | `POST /api/telegram-webhook` | 텔레그램 봇 웹훅 |
| `telegram.js` | `POST /api/telegram` | 텔레그램 메시지 전송 |

### 기타

| 파일 | 엔드포인트 | 기능 |
|------|-----------|------|
| `analyze.js` | `POST /api/analyze` | 이미지 분석 |
| `generate.js` | `POST /api/generate` | 이미지 생성 |
| `refine.js` | `POST /api/refine` | 이미지 정제 |

## 환경변수 (CF Pages Secrets)

| 변수 | 사용 함수 |
|------|----------|
| `GEMINI_API_KEY` | photo, idgen, precheck, qc, coaching, analyze, generate, refine, simple-signup |
| `KAKAO_CLIENT_ID` | auth |
| `KAKAO_CLIENT_SECRET` | auth |
| `GOOGLE_CLIENT_ID` | auth |
| `GOOGLE_CLIENT_SECRET` | auth |
| `TELEGRAM_BOT_TOKEN` | telegram, telegram-webhook |
| `ADMIN_CHAT_ID` | telegram-webhook |
| `TOSS_SECRET_KEY` | payment |
| `TX_API_KEY` | tx |
| `DB` (D1 바인딩) | tx, visitor, simple-signup |

## 주의사항

- **idgen.js**: `responseModalities` 사용 금지 (에러 발생), `photo.js` 패턴 준수
- **idgen.js**: mimeType은 `'image/jpeg'` 고정
- 모든 함수는 CORS `*` 허용 (공개 API)
- `tx.js`만 `TX_API_KEY` 헤더 인증
- 새 함수 추가 시 `functions/api/` 에 직접 생성
