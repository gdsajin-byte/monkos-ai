# MONKOS AI 증명사진 서비스 — 기술명세서

**버전:** v1.1
**작성일:** 2026-02-16 (v1.0) → 2026-02-18 (v1.1 갱신)
**작성:** 쌍아 (Claude Code Opus 4.6)
**대상 독자:** 인프라 엔지니어, 기술 실사관
**갱신 의무:** 인프라, 파이프라인, 배포, 장애 발생 시 반드시 갱신

---

## 1. 서비스 개요

| 항목 | 값 |
|------|-----|
| 서비스명 | MONKOS AI 증명사진 |
| 도메인 | monkos.ai (포털), idphoto-kr.monkos.ai (한국), idphoto-jp.monkos.ai (일본) |
| 런타임 | GCP Cloud Run (us-central1) |
| 언어 | Node.js 20 (순수 JS, 프레임워크 없음) |
| AI 모델 | Gemini 2.0 Flash Live + NanoBanana 3 Pro (I2I) + Gemini 3 Flash (QC) |
| 개발 기간 | 2026-01-30 ~ 2026-02-16 (18일) |
| 총 커밋 | 100+ (main 브랜치 단일) |

---

## 2. 핵심 파이프라인

```
사용자 접속 → Google 로그인 → 크레딧 확인
  ↓
[Step 1] 카메라 + AI 코칭
  WebSocket → Gemini 2.0 Flash Live (Vertex AI ADC)
  프레임 캡처 1fps, JPEG 768×768, 장면 변화 감지
  음성 안내: Web Speech API (ko-KR / ja-JP TTS)
  OK 판정 → 촬영 버튼 활성화
  ↓
[Step 2] 증명사진 생성
  촬영 원본 → NanoBanana 3 Pro I2I (Google AI Studio API Key)
  모델: gemini-3-pro-image-preview
  IDENTITY_PRESERVATION 90:10 비율 (세이프가드 최적값)
  의상: 수트 고정 (성별/연령별 분기)
  조명: Broncolor 88 정면 오버헤드 소프트박스 강제
  생성 시간: ~16-19초
  ↓
[Step 3] QC 검증
  원본 vs 생성물 비교 → Gemini 3 Flash (Vertex AI ADC)
  검증 항목: 유사도%, 성별 일치, 연령 일치, 과보정 감지
  PASS 기준: 유사도 85%+ AND 성별/연령/보정 모두 통과
  ↓
[Step 4] 다운로드 (JPEG, 0.92 quality)
```

---

## 3. 아키텍처

### 3-1. 서비스 구성

| 서비스 | Cloud Run 서비스명 | 역할 | 리소스 |
|--------|-------------------|------|--------|
| 포털 | monkos-portal | 인증, 크레딧, 결제, CS챗봇 | 512Mi / 1CPU / max 5 |
| KR 증명사진 | monkos-idphoto-kr | 한국 AI 증명사진 | 2Gi / 2CPU / max 10 |
| JP 증명사진 | monkos-idphoto-jp | 일본 AI 증명사진 | 2Gi / 2CPU / max 10 |
| 이미지 엔진 | monk-image-engine | Imagen T2I (레거시) | - |

### 3-2. 인증 구조 (하이브리드)

```
ai = new GoogleGenAI({ vertexai: true, project: 'monkos', location: 'us-central1' })
  ├── Gemini 2.0 Flash Live    → 실시간 코칭 (WS)
  └── Gemini 3 Flash           → QC 판정

imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  └── gemini-3-pro-image-preview → Imagen I2I 생성
```

**이유:** NanoBanana 3 Pro(I2I)는 Vertex AI에서 비공개. Google AI Studio API Key 전용.

### 3-3. 데이터 저장

| 저장소 | 용도 | 비고 |
|--------|------|------|
| Firestore (`monkos` 프로젝트) | 유저/크레딧/설문/CS대화 | `users` 컬렉션 |
| Cloudflare D1 (`monk-db`) | monk.kr 포털 (별도) | idphoto 크레딧과 무관 |

### 3-4. 네트워크

```
사용자 → Cloudflare (Proxied, Full Strict SSL) → Cloud Run (us-central1)
```

- Cloudflare: CDN + WAF + HSTS + TLS 1.2 최소
- 보안 헤더: HSTS, X-Content-Type-Options, X-Frame-Options
- CORS: 화이트리스트 방식 (ALLOWED_ORIGINS)

---

## 4. 개발 타임라인

### Phase 0: 인프라 기반 (01/30~02/07)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 01/30 | PWA 배포 | monk.kr Cloudflare Pages |
| 01/31 | 원격 개발 환경 | SSH + Tailscale 구축 |
| 02/07 | CLAUDE.md 신규 생성 | 프로젝트 규칙 체계 확립 |

### Phase 1: 파이프라인 검증 (02/08)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 02/08 AM | WebRTC P2P 성공 | iPhone→iMac, RTT 7ms, 패킷손실 0% |
| 02/08 PM | Gemini Live E2E 성공 | 카메라→Gemini→실시간 코칭 오버레이 |
| 02/08 PM | Photo Coach 앱 완성 | 코칭→Imagen→QC 3단계 파이프라인 |
| | **A/B 테스트** | 코칭 없이 92% → 코칭 후 95% (+3%p) |

**핵심 디버깅:**
- Gemini Live 모델명 오류 (`flash-live-001` → `flash-live-preview-04-09`)
- SDK `callbacks.onmessage undefined` → callbacks 객체 직접 전달
- HTTPS 필수 (Safari 카메라 접근 차단) → 자체서명 인증서 적용

### Phase 2: 일본 서비스 구축 (02/09)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 02/09 AM | monkos_AI 분리 체계 | monk.kr(Cloudflare) vs monkos.ai(GCP) 확립 |
| 02/09 AM | idphoto-jp 서비스 구현 | 일본어 네이티브 (코칭/QC/UI) |
| 02/09 PM | Vertex AI ADC 전환 시도 | Imagen I2I 404 에러 → 하이브리드 인증 롤백 |
| 02/09 PM | **E2E 프로덕션 통과** | 첫 Cloud Run 배포, 5회 리비전 |
| 02/09 PM | 규격 크롭 엔진 구현 | PHOTO_SPECS + MediaPipe 3-Tier 얼굴 감지 |
| 02/09 PM | 음성 안내 추가 | Web Speech API (ja-JP TTS) |

**핵심 디버깅:**
- Imagen Vertex AI 404 → NanoBanana 3는 AI Studio 전용 (Google 의도적 차단)
- QC `role: 'user'` 누락 → Vertex AI ADC 필수 필드
- iOS Safari 음성 미작동 → `speechSynthesis.speak('')` warmup 필요

### Phase 3: 한국 서비스 + 결제 (02/10~02/11)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 02/10 | idphoto-kr 한국어 서비스 | KR/JP 양 채널 프로덕션 배포 |
| 02/10 | monkos.ai 포털 | Gemini 챗봇 + 3개국어 자동전환 |
| 02/10 | 도메인 매핑 | monkos.ai, idphoto-kr/jp.monkos.ai |
| 02/11 | Google OAuth 연동 | 포털 로그인 + Firestore 사용자 저장 |
| 02/11 | 크레딧 시스템 | 생성 -1c, 다운로드 -10c, 공유 +10c |
| 02/11 | Lemon Squeezy 결제 | 글로벌 카드/PayPal (MoR 방식) |
| 02/11 | 법적 페이지 3종 | 개인정보처리방침, 이용약관, 환불정책 |
| 02/11 | Telegram CS봇 | @monkos_support_bot, Gemini 2.0 Flash |

**핵심 디버깅:**
- CTA 404: `req.url === '/app'` → 쿼리 파라미터 미처리. `split('?')[0]`으로 수정
- 팝업 차단: `await` 후 `window.open()` → 사전 `window.open('about:blank')` 필요
- Lemon Squeezy 404: 상품 Publish 안 됨 (대시보드 설정 누락)
- 크레딧 UI 미갱신: 서버→클라이언트 `credit-update` WS 메시지 누락
- 코칭 세션 클로저 버그: `createGeminiSession()` → `connectGeminiLive(session)` 리팩토링

### Phase 4: 품질 강화 + 보안 (02/12~02/13)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 02/12 | 코칭 프롬프트 스타일별 분리 | 여권(눈썹/이마 체크) vs 이력서(표정/자세 중심) |
| 02/12 | JP 리쿠르토 스츠 의상 | 성별/연령별 취활 의상 분기 |
| 02/12 | SEO 최적화 | 메타태그, OG, JSON-LD, robots.txt, sitemap.xml |
| 02/13 | Cloudflare 프록시 전환 | DNS Only → Proxied (CDN + WAF + SSL) |
| 02/13 | 보안 헤더 추가 | HSTS, X-Frame-Options, X-Content-Type-Options |
| 02/13 | 카카오 OAuth 연동 | KOE010 에러 해결 (.env `l`→`I` 1문자 오독) |

### Phase 5: 멀티 에이전트 인프라 + 운영 (02/14~02/15)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 02/14 | REST v2.0.0 | WS→REST 분리, QC bounding box, pre-check |
| 02/14 | 4060 SSH 연결 | Tailscale + PasswordAuthentication 3중 원인 해결 |
| 02/15 | 에이전트 체계 확립 | 쌍아/막내/소넷이 3계층 + alias (mk/mk-c/mk-s) |
| 02/15 | 갤럭시 호환성 수정 | 터치 이벤트 + 삼성 인터넷 Google 인증 우회 |
| 02/15 | QC 강화 | 성별/연령 일치, 과보정 감지, FAIL 조건 명확화 |
| 02/15 | Jest 테스트 도입 | 20 tests (크레딧 매핑 + CS 검색 알고리즘) |
| 02/15 | D1 거래 원장 | tx.js API + logTransaction 7개 지점 |

### Phase 6: 안정화 + DevOps (02/16)

| 날짜 | 마일스톤 | 상세 |
|------|---------|------|
| 02/16 | 카메라 충돌 사고 | DOM 요소 삭제 → JS null 참조 → 전체 중단 |
| 02/16 | 고아 서비스 정리 | asia-northeast1/3 유령 4개 삭제 |
| 02/16 | deploy.sh dev/prod 분리 | 인자 필수, 브랜치 체크, 리소스 분기 |
| 02/16 | develop 브랜치 생성 | 2-track 배포 라인 구축 |
| 02/16 | dev 서비스 최초 배포 | `monkos-idphoto-kr-dev` (리비전 00001-f5m, 512Mi/1CPU/max2) |
| 02/16 | 배포 워크플로우 확정 | `develop→deploy dev→테스트→main 머지→deploy prod` (별도 빌드 방식) |
| 02/16 | idphoto-kr 코드 분석 | 미사용 함수/CSS 4건 식별 (삭제 대상) |

---

## 5. 주요 장애 및 디버깅 기록

### 5-1. 카메라 먹통 (02/16) — **P0 장애**

| 항목 | 내용 |
|------|------|
| 증상 | 카메라 시작 불가 + 촬영 버튼 비활성화 |
| 원인 | 헤더 UI 정리 시 `step-label`, `ws-dot`, `ws-status` DOM 삭제 → JS에서 `null.textContent` 참조 → 전체 JS 중단 |
| 악화 | 고아 서비스(asia-northeast3) 롤백 반복 → 프로덕션(us-central1) 아닌 곳에서 작업 |
| 해결 | 숨김 DOM 요소 복원 (`display:none`), us-central1 프로덕션 재배포 |
| 소요 | ~2시간 |
| 교훈 | DOM 삭제 시 JS 의존성 체크 필수. 배포 타겟 확인 먼저 |

### 5-2. Imagen Vertex AI 404 (02/09)

| 항목 | 내용 |
|------|------|
| 증상 | `gemini-3-pro-image-preview` Vertex AI에서 404 |
| 원인 | NanoBanana 3 Pro는 Google AI Studio 전용. Vertex AI에서 의도적 비공개 |
| 해결 | 하이브리드 인증: ADC(Live+QC) + API Key(Imagen I2I) |
| 교훈 | Google이 T2I(Imagen4)와 I2I(NB3) 라인업을 의도적으로 분리 |

### 5-3. 카카오 KOE010 (02/13)

| 항목 | 내용 |
|------|------|
| 증상 | 카카오 OAuth 인증 실패 (KOE010 invalid_client) |
| 원인 | .env 파일에서 `CLIENT_SECRET` 값의 `I`(대문자 아이)를 `l`(소문자 엘)로 오독 |
| 해결 | 1문자 수정 (l→I) |
| 소요 | ~1시간 (다른 원인 추적에 낭비) |
| 교훈 | 시크릿 복사 시 원본 직접 비교 필수 |

### 5-4. 고아 서비스 누적 (02/13~02/16)

| 항목 | 내용 |
|------|------|
| 증상 | 배포해도 변경 반영 안 됨 |
| 원인 | 에이전트가 "리전 최적화" 시도 → asia-northeast1/3에 중복 생성 → 도메인 매핑은 us-central1 고정 |
| 해결 | 고아 4개 삭제 + MEMORY.md에 배포 타겟 기록 |
| 교훈 | 도메인 매핑 기준으로만 배포. 리전 변경 시 도메인 재매핑 필수 |

### 5-5. 코칭 세션 클로저 버그 (02/11)

| 항목 | 내용 |
|------|------|
| 증상 | 다운로드 화면에서 코칭 멘트 계속 출력 |
| 원인 | `createGeminiSession()` 내부 독립 session 객체 → `flushBuffer()` 클로저가 원래 session.ws(null) 참조 |
| 해결 | `connectGeminiLive(session, clientId)` 리팩토링: 외부 session 직접 참조 |
| 교훈 | 클로저 캡처 범위 주의. 지연 생성 패턴에서 참조 누수 점검 |

---

## 6. AI 모델 상세

| 모델 | 용도 | 인증 | 과금 |
|------|------|------|------|
| `gemini-2.0-flash-live-preview` | 실시간 코칭 (WS) | Vertex AI ADC | Vertex AI |
| `gemini-3-flash-preview` | QC 판정 + 사전분석 | Vertex AI ADC | Vertex AI |
| `gemini-3-pro-image-preview` | Imagen I2I 생성 | Google AI Studio API Key | Gemini API |
| `gemini-2.0-flash` | 포털 챗봇 + CS봇 | Vertex AI ADC | Vertex AI |

### Imagen I2I 특성 (실전 검증)

- 엔진: NanoBanana 3 Pro (구 Imagen 3 I2I 계승)
- 단가: ~₩192/장 ($0.134)
- 생성 시간: 16~19초
- **1회 정밀 생성 전략**: 기생성 이미지 변주 시 회차마다 품질/화질 열화
- IDENTITY_PRESERVATION 90:10 = 세이프가드 최적값 (100% 시도 시 오히려 거부)

---

## 7. 결제 시스템

| 시장 | 결제수단 | 프로바이더 |
|------|---------|-----------|
| 글로벌 | 카드, PayPal | Lemon Squeezy (MoR) |
| 한국 | 카드, 가상계좌, 간편결제 | 토스페이먼츠 |

### 크레딧 이코노미

| 액션 | 크레딧 |
|------|--------|
| 가입 보너스 | 0c (설문 이벤트로 별도 지급) |
| 사진 생성 | -1c |
| 다운로드 | -10c |
| SNS 공유 보너스 | +10c (1회 한정) |
| 설문 참여 | +12c (일일 30명 선착순) |

---

## 8. 배포 구조 (현재)

### 8-1. Cloud Run 프로덕션 (us-central1)

| 도메인 | 서비스명 | Dockerfile | 빌드 |
|--------|----------|-----------|------|
| monkos.ai | monkos-portal | node:20-slim 2-stage (난독화) | gcloud builds submit |
| idphoto-kr.monkos.ai | monkos-idphoto-kr | node:20-slim 2-stage (난독화) | gcloud builds submit |
| idphoto-jp.monkos.ai | monkos-idphoto-jp | node:20-slim 2-stage (난독화) | gcloud builds submit |

### 8-2. dev 서비스 (02/16 신설)

| 도메인 | 서비스명 | 리소스 | 상태 |
|--------|----------|--------|------|
| (Cloud Run URL 직접) | monkos-idphoto-kr-dev | 512Mi / 1CPU / max 2 | 배포 완료 |
| (Cloud Run URL 직접) | monkos-idphoto-jp-dev | 512Mi / 1CPU / max 2 | 미배포 |
| (Cloud Run URL 직접) | monkos-portal-dev | 512Mi / 1CPU / max 2 | 미배포 |

### 8-3. deploy.sh (02/16 개선)

```bash
./deploy.sh dev   → dev 서비스 배포 (512Mi/1CPU/max2, 브랜치 무관)
./deploy.sh prod  → production 배포 (2Gi/2CPU/max10, main 브랜치 필수, 확인 프롬프트)
./deploy.sh       → 거부 (인자 필수)
```

### 8-4. 배포 워크플로우 (확정)

```
develop 브랜치에서 작업
  → ./deploy.sh dev (별도 빌드)
  → dev 서비스에서 테스트
  → main 머지
  → ./deploy.sh prod (별도 빌드)
```

**결정:** 이미지 승격(dev 이미지 → prod 태그) vs 별도 빌드 → **별도 빌드 채택** (현 규모에서 오버엔지니어링 불필요)

### 8-5. Git 브랜치 전략

```
main     → production 배포 전용
develop  → dev 배포 + 개발 작업
```

---

## 9. 의존성

### idphoto-kr / idphoto-jp

| 패키지 | 용도 |
|--------|------|
| `@google/genai` | Gemini Live + Imagen I2I + QC |
| `ws` | WebSocket 서버 |

의존성 총 2개. express 미사용 (Node.js http 직접).

### portal

| 패키지 | 용도 |
|--------|------|
| `@google/genai` | Gemini 챗봇 |
| `@google-cloud/firestore` | 유저/크레딧 DB |

---

## 10. 보안

- API 키: .env 로컬 보관 + deploy.sh에서 Cloud Run 환경변수 주입
- .gcloudignore: .env, .env.*, *.pem, *.md 제외
- JS 난독화: 2-stage Docker 빌드 (obfuscate.mjs → runtime)
- CORS: 화이트리스트 방식 (명시적 도메인만 허용)
- OAuth: Google, 카카오, LINE (크로스도메인 HMAC 토큰)
- 개인정보: 동의 체크박스 2개 필수 (개인정보 수집·이용, 초상권)
- 환불: C방식 (미사용+7일 이내 전액, 사용 시 불가)

---

## 11. 비용 구조 (실측)

| 항목 | 월 비용 (추정) | 비고 |
|------|---------------|------|
| Imagen I2I | ~₩192/장 | 주요 비용 |
| Cloud Run | ~₩258/주 | pay-per-use |
| Cloud Storage | ~₩104/주 | 미미 |
| Gemini Live | 무료 티어 내 | Vertex AI |
| Gemini QC | 무료 티어 내 | Vertex AI |
| Cloudflare | $0 | 무료 플랜 |
| Lemon Squeezy | 5% + $0.50/건 | MoR 수수료 |

GCP 크레딧: 250만원 잔액 (2026-02 기준, 무료 티어가 커버하여 대부분 미소진)

---

## 12. 디바이스 호환성

| 이슈 | 영향 범위 | 해결 | 날짜 |
|------|----------|------|------|
| Safari HTTPS 필수 | iOS 전체 | 자체서명 인증서 → Cloud Run SSL | 02/08 |
| iOS TTS warmup | iOS Safari | `speechSynthesis.speak('')` 선행 호출 | 02/10 |
| Chrome FaceDetector 미지원 | Safari/iOS | MediaPipe 3-Tier 폴백 | 02/09 |
| 삼성 인터넷 Google 인증 | 갤럭시 삼성브라우저 | 앵커 클릭 방식 우회 | 02/15 |
| 갤럭시 터치 이벤트 | 갤럭시 전체 | touch-action CSS + addTouchClickHandler | 02/15 |
| 인앱 브라우저 제한 | 카카오/LINE 웹뷰 | 외부 브라우저 유도 안내 | 02/15 |

---

## 13. 현재 상태 요약 (02/18 기준)

### 완료

- [x] KR/JP 2개 채널 프로덕션 가동
- [x] 5단계 AI 파이프라인 (코칭→생성→QC→다운로드)
- [x] 크레딧 시스템 + Lemon Squeezy/토스 결제
- [x] Google/카카오/LINE OAuth 3종
- [x] Telegram CS봇
- [x] Cloudflare CDN + WAF
- [x] dev/prod 2-track 배포 라인
- [x] 고아 Cloud Run 서비스 정리 완료
- [x] monk.js 프레임워크 코어 v1 (Screen/Store/Pipe/Media/Agent)
- [x] monk.kr photolab 앱 계층 v1 (app.js/config.js/index.html/app.css)
- [x] CF Pages Function 프록시 3개 (precheck/generate/qc)
- [x] 00079 의존성 핀 고정 (카메라 오류는 코드 원인 확정)

### 미완료

- [ ] main 머지 → monk.kr 프로덕션 배포 (develop 대기 중)
- [ ] 모바일 E2E 재테스트 (프록시 동작 확인)
- [ ] creditUse 프록시 (다운로드 크레딧)
- [ ] QC 결과 미표시 원인 (서버 로그 미확보)
- [ ] GA4 설치 + 전환율 데이터 수집
- [ ] KR/JP 공유 코어 분리 (설계서 완료, 구현 대기)
- [ ] AI 에이전트 2분할 vision/voice (설계서 완료, 구현 대기)

---

## 부록 A: 서비스 URL 맵

### 프로덕션

| URL | 서비스명 | 리전 |
|-----|----------|------|
| https://monkos.ai | monkos-portal | us-central1 |
| https://idphoto-kr.monkos.ai | monkos-idphoto-kr | us-central1 |
| https://idphoto-jp.monkos.ai | monkos-idphoto-jp | us-central1 |
| https://image.monkos.ai | monk-image-engine | us-central1 |

### dev (커스텀 도메인 미연결, Cloud Run URL 직접 접근)

| 서비스명 | URL | 상태 |
|----------|-----|------|
| monkos-idphoto-kr-dev | https://monkos-idphoto-kr-dev-933456016842.us-central1.run.app | 배포 완료 |
| monkos-idphoto-jp-dev | (미배포) | 대기 |
| monkos-portal-dev | (미배포) | 대기 |

## 부록 B: 코드 정리 대상 (02/16 분석)

### idphoto-kr

| 분류 | 항목 | 조치 |
|------|------|------|
| 미사용 함수 | `goToPurchase()`, `disableShareButtons()` | 삭제 권장 |
| 미사용 CSS | `.dot`, `.dot-on`, `.dot-off`, `.dot-wait` | 삭제 권장 |
| 중복 로직 | `updateCreditBadge()` ↔ `updateLoginUI()` | 통합 권장 |
| 함수명 불일치 | `setDot()` → `toggleVoiceButton()` | 리네이밍 권장 |

정리 시 약 30줄 감소 예상. 치명적 이슈 없음.

## 부록 C: 환경변수

### idphoto-kr / idphoto-jp

| 변수 | 소스 |
|------|------|
| PROJECT_ID | deploy.sh → Cloud Run |
| LOCATION | deploy.sh → Cloud Run |
| GCS_BUCKET | deploy.sh → Cloud Run |
| GEMINI_API_KEY | .env → deploy.sh → Cloud Run |

### portal

위 외에: KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI, KAKAO_CLIENT_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_EVENT_BOT_TOKEN, TOSS_SECRET_KEY, LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET, LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, TX_API_KEY, TX_API_URL

---

## 부록 D: 2/17~2/18 갱신 — monk.kr photolab + 리팩토링 전환

### D-1. 전략 전환 (02/17)

**카메라 충돌 근본 원인 확정:**
- 의존성 핀 고정 배포(00086) → 여전히 카메라 오류 → **코드 자체가 원인**
- 모놀리스(index.html 2,437줄) 사이드 이펙트 추적 불가
- Plan B 전환: monk.js 프레임워크 분해 리팩토링

**작업 경로 전환:**
- 기존: `monkos_AI/idphoto-kr/` (Cloud Run 직접 서빙)
- 전환: `MONK_kr/ai_lab/photolab/` (Cloudflare Pages, 프록시 경유)
- 이유: "몽크에서 개발해서 몽코스로 독립시키는" 기초 개념 복귀

### D-2. monk.kr photolab 클라이언트 구조

```
MONK_kr/ai_lab/photolab/
├── index.html    (293줄) — HTML + data-bind 속성
├── monk.js       (660줄) — 프레임워크 코어 (Screen/Store/Pipe/Media/Agent)
├── app.js        (810줄) — 비즈니스 로직
├── config.js      (86줄) — 상수/설정/API 경로
├── app.css       (633줄) — 스타일
└── test.html              — 단위 테스트
```

**monk.js 5 모듈:**

| 모듈 | 역할 | 핵심 API |
|------|------|----------|
| Screen | 화면 상태 머신 | `screens.go(name)`, enter/exit 생명주기 |
| Store | Proxy 반응형 상태 + DOM 바인딩 | `store.속성 = 값` → data-bind/show/hide/class 갱신 |
| Pipe | REST/WS 통신 | `pipe.run(name, data)`, `pipe.connect(name)` |
| Media | 카메라/캡처/크롭 | `media.start()`, `media.capture()`, `media.crop(spec)` |
| Agent | Vision/Voice AI 래퍼 | `vision.start(inputFn)`, `vision.onResult(cb)` |

### D-3. CF Pages Function 프록시

**배포 = Git Push** (main 브랜치 → monk.kr 프로덕션)

| 파일 | 엔드포인트 | 프록시 대상 |
|------|-----------|------------|
| `functions/api/idphoto-precheck.js` | POST `/api/idphoto-precheck` | `idphoto-kr.monkos.ai/api/pre-check` |
| `functions/api/idphoto-generate.js` | POST `/api/idphoto-generate` | `idphoto-kr.monkos.ai/api/generate` |
| `functions/api/idphoto-qc.js` | POST `/api/idphoto-qc` | `idphoto-kr.monkos.ai/api/qc` |

**WS 코칭:** CF Function 프록시 불가 → 직접 연결 `wss://idphoto-kr.monkos.ai/`

**CF Pages Function 제약사항 (실전 발견):**
1. 정적 디렉토리와 겹치는 경로에 Function 배치 불가 (405)
2. catch-all `[[path]]` 패턴 POST 미작동
3. 해결: 개별 파일 분리, `onRequestPost`/`onRequestOptions` export

### D-4. 추가 장애 기록

**5-6. 핀 고정 배포 실패 (02/17)**

| 항목 | 내용 |
|------|------|
| 증상 | 의존성 핀 고정 후에도 카메라 오류 |
| 원인 | 코드 변경분(250줄) 자체가 원인. 의존성 아님 |
| 해결 | 00079로 재롤백. Plan B(모듈 분해) 전환 |
| 교훈 | 모놀리스 한계. 작은 변경도 전체 장애 유발 가능 |

**5-7. CF Pages Function 라우팅 실패 (02/18)**

| 항목 | 내용 |
|------|------|
| 증상 | 프록시 Function이 405 반환 (실행 안 됨) |
| 원인 | catch-all `[[path]].js` POST 미작동 + 정적 자산 우선 서빙 |
| 해결 | 개별 파일(`idphoto-precheck.js` 등) 3개로 분리 |
| 교훈 | CF Pages Function은 개별 파일 + 메서드별 export가 안전 |

### D-5. 프로덕션 현황 (02/18 시점)

**Cloud Run (idphoto-kr):**
- 활성 리비전: 00079-tpk (100% 트래픽, 안정)
- 알려진 이슈: QC 결과 미표시

**Cloudflare Pages (monk.kr):**
- photolab 코드: develop에 8커밋 대기 (main 머지 진행 중)

### D-6. 참조 문서 (추가)

| 문서 | 내용 |
|------|------|
| `MONK_PHOTO_STUDIO_ARCHITECTURE.md` | 몽크사진관 서비스 전략 + 4카드 구조 |
| `SHARED_CORE_SEPARATION_PLAN.md` | KR/JP 공유 코어 분리 설계 |
| `SPEC_PLANB_idphoto_refactoring.md` | Plan B 리팩토링 전체 기술명세 |

---

*v1.0: 2026-02-16 (쌍아)*
*v1.1: 2026-02-18 — monk.kr photolab 전환, CF Function 프록시, 장애 추가 (쌍아)*
