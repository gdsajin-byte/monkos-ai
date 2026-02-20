# portal — MONKOS 메인 포털

> Cloud Run 서비스 | 도메인: **monkos.ai**

## 배포

```bash
# dev (자유)
./deploy.sh dev

# prod (작가님/쌍아만)
./deploy.sh prod    # main 브랜치 강제, 확인 프롬프트
```

| 항목 | prod | dev |
|------|------|-----|
| 서비스명 | `monkos-portal` | `monkos-portal-dev` |
| 메모리 | 512Mi | 512Mi |
| CPU | 1 | 1 |
| 최대 인스턴스 | 5 | 2 |
| 타임아웃 | 60s | 60s |

- **리전**: `us-central1`
- **포트**: 8080
- **서비스 계정**: `monk-image-engine@monkos.iam.gserviceaccount.com`

## 핵심 구조

```
portal/
├── server.js               ← Express 서버 (챗봇 + OAuth + 결제 + 텔레그램)
├── deploy.sh               ← 배포 스크립트
├── Dockerfile              ← node:20-slim 2단계 빌드
├── obfuscate.mjs           ← 코드 난독화
├── package.json
├── seed_cs_knowledge.js    ← CS 지식베이스 시딩
├── seed_cs_brand_story.js  ← 브랜드 스토리 시딩
├── seed_cs_legal.js        ← 법적 문서 시딩
├── seed_cs_prep.js         ← 준비실 코칭 시딩
├── __tests__/              ← Jest 테스트
└── public/
    ├── index.html          ← 메인 포털 UI
    ├── privacy.html        ← 개인정보처리방침
    ├── terms.html          ← 이용약관
    ├── refund.html         ← 환불 정책
    └── monkos-icon.svg
```

## 환경변수 (.env → monkos_AI/.env)

| 변수 | 용도 |
|------|------|
| `PROJECT_ID` | GCP 프로젝트 |
| `LOCATION` | GCP 리전 |
| `GOOGLE_CLIENT_ID` | 구글 OAuth |
| `KAKAO_REST_API_KEY` | 카카오 OAuth |
| `KAKAO_REDIRECT_URI` | 카카오 콜백 URL |
| `KAKAO_CLIENT_SECRET` | 카카오 시크릿 |
| `LINE_CHANNEL_ID` | LINE 로그인 |
| `LINE_CHANNEL_SECRET` | LINE 시크릿 |
| `TELEGRAM_BOT_TOKEN` | 텔레그램 CS봇 |
| `TELEGRAM_EVENT_BOT_TOKEN` | 텔레그램 이벤트봇 |
| `TOSS_SECRET_KEY` | 토스페이먼츠 결제 |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy 결제 (JP) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | LemonSqueezy 웹훅 |
| `TX_API_KEY` | 거래 관리 API |
| `TX_API_URL` | 거래 API 엔드포인트 |

- **인증**: Vertex AI ADC (API Key 불필요)

## 챗봇 아키텍처

```
chatWithMonkos(channel, chatId, message)
├── web       ← 포털 웹 챗봇 (일반 고객)
├── telegram  ← 텔레그램 봇 CS
└── prep      ← 촬영 준비실 코칭
```

- 채널별 systemPrompt, historyMap, temperature 분리 (CHANNEL_CONFIG)
- RAG: Firestore `cs_knowledge` 컬렉션 키워드 검색
- 시딩: `node seed_cs_*.js` (Firestore에 CS 데이터 투입)

## 주요 엔드포인트

| 경로 | 기능 |
|------|------|
| `/health` | 헬스체크 |
| `/auth/kakao/callback` | 카카오 OAuth 콜백 |
| `/auth/line/callback` | LINE OAuth 콜백 |
| `/api/chat` | 챗봇 API |
| `/api/tx` | 거래 관리 |

## 주의사항

- `server.js` 수정 시 에스컬레이션 필수 (78KB, 복잡도 높음)
- `.env` 수정 금지
- 시딩 스크립트(`seed_cs_*.js`)는 Firestore에 직접 쓰므로 주의
- 테스트: `npm test` (Jest)
