---
type: inventory
date: 2026-07-14
updated_by: M1/막내3 (SM 전수 대사 44건)
status: 현행
---

# MONKOS 시크릿 인벤토리

> 🔐 **[2026-07-24 P1-ⓓ] 메타 정본 = SM annotations** (purpose·service·note, 53건 백필 완료). 인지 = `scripts/secret.sh map <NAME>` 1콜 — 이 문서의 테이블은 참조 뷰로 강등(신규 등록 시 수기 추가 불필요, `secret add`가 SM에 직접 기록).
> ⚠️ **이 문서에 키 값을 절대 기재하지 않는다.** 항목+위치+용도만 기록.
> 전신: `credentials_inventory.md` (2026-02-19). 본 문서가 정본.
> 최종 갱신: 2026-07-14 (M1/막내3 SM 전수 대사 44건 — §J 10건 추가, audit_secrets.sh 신설)
> 직전 갱신: 2026-06-12 (웹/민아 검수 + 막내1 전수조사 A 병합 — §0-1 키 현황, §3 누락 보정, §G SA 실측 현행화, 구키 삭제 완결 확인)

---

## 0. 키 저장 하이브리드 표준 (광역오더 #8 — 2026-06-03 확정)

> **원칙: "시크릿은 GCP 런타임, 설정은 정본 배포, GitHub은 카탈로그."**
> 작가님 승인(2026-06-02). 모든 키는 성격에 따라 아래 세 위치 중 하나를 **표준 저장소**로 한다.

| 성격 | 표준 저장소 | 근거 |
|------|------------|------|
| **런타임 시크릿·토큰** (API 키, OAuth secret, access token) | **GCP Secret Manager** (project=monkos) | 디바이스 무인증 복원 (gdocs로 입증) |
| **비밀 아닌 설정값** (PROJECT_ID·LOCATION·GCS_BUCKET·리다이렉트 URI·공개 ID 등) | **.env / git** | 단순 배포 |
| **정본 카탈로그 + Actions** | **GitHub Secrets** | write-only, 백업·이력 |

### monkos_AI/.env 분류 (34 유니크 — 2026-06-03 적용)

- **시크릿 → GCP Secret Manager (27종, 변수명 그대로 등록)**: GEMINI_API_KEY · CF_API_TOKEN · CHAT_API_KEY · KAKAO_REST_API_KEY · KAKAO_CLIENT_SECRET · NAVER_CLIENT_SECRET · **NAVER_SEARCHAD_API_KEY** · **NAVER_SEARCHAD_SECRET_KEY** · **NAVER_SEARCHAD_CUSTOMER_ID** · LINE_CHANNEL_SECRET · LINE_MESSAGING_ACCESS_TOKEN · LINE_MESSAGING_CHANNEL_SECRET · TOSS_SECRET_KEY · TOSS_WEBHOOK_SECRET · LEMONSQUEEZY_API_KEY · LEMONSQUEEZY_WEBHOOK_SECRET · TELEGRAM_BOT_TOKEN · TELEGRAM_TEAM_BOT_TOKEN · TEAM_NOTIFY_SECRET · X_ACCESS_TOKEN · X_ACCESS_TOKEN_SECRET · X_CONSUMER_KEY · X_CONSUMER_SECRET · N8N_API_KEY · TX_API_KEY · REMOVEBG_API_KEY · **ADMIN_UIDS**(경계 → 보수적 시크릿)
  - 등록 방식: `.env` 값 → stdin 파이프(`gcloud secrets create/versions add --data-file=-`), **값 무노출**. 복원 정합 해시 대조 24/24 일치 검증.
- **설정 → .env / git (10종)**: PROJECT_ID · LOCATION · GCS_BUCKET · KAKAO_REDIRECT_URI · CHAT_WORKERS_URL · TX_API_URL · CF_ZONE_ID · NAVER_CLIENT_ID · LINE_CHANNEL_ID · TEAM_CHAT_ID
- **정리됨**: ~~CF_WORKERS_AI_TOKEN~~ — `.env`에 `붙여넣기` placeholder 2행 중복 + 코드 참조 0건(dead). 2026-06-03 GCP·.env 양쪽 완전 제거. 향후 Workers AI 실사용 시 실제 토큰으로 신규 등록.

> M1 등 타 디바이스 .env 동기화: 시크릿은 GCP에서 복원, 설정은 .env 정본 배포. **M1 갭(-20) 실측·반영은 M1 온라인 시 별도 진행**(2026-06-03 M1 offline).

---

## 0-2. 인증 신뢰 모델 원칙 (2026-07-14 작가님·쌍아·민아 합의)

> **"신뢰의 근거를 소지물(키)에서 신원(검증된 주체)으로 옮긴다."**
> 작가님 정식화: "누군지 모르는 이가 키를 들고 있는 것보다, 키를 깜빡했어도 검증된 사람을 신뢰 우선시하는 구조."

- **구글 공식 서열** (IAM 모범사례, 2026-07-14 원문 확인): ①사용자 자격 ②관리형 워크로드 ID ③WIF ④임퍼소네이션 ⑤SA 키(최후 수단 — "avoid using service account keys whenever possible").
- **현행 채택**: SM 키 우선 (관리 루트 단일화 — 1인 운영 일관성 > 무키 이점). 임퍼소네이션은 폴백 존치 (gsc_mcp.sh).
- **임퍼소네이션 승격 트리거 3조건** (도달 시 레일 이동): ①SA 키 유출 사고 발생(즉시) ②운용 디바이스·인원 확대로 키 배포 표면적 임계 초과 ③GCP 키리스(WIF) 생태 전환점.
- **차기 실전 항목**: GH Actions의 GCP_SA_KEY → **WIF(GitHub OIDC) 키리스 전환** — 서열 3위 달성, GH 사본 키 소멸. 귀속: PF_SECURITY.
- 관련: PF_SECURITY(impersonation 표준화 비전, 4/23) · 광역오더 #8 · 헌법 4조 1항.

## 0-1. GCP 콘솔 API 키 현황 (2026-06-12 작가님+웹/민아 합동 실측 — 06-19 마감 종결)

> Google AI Studio "무제한 키 제한" 마감(2026-06-19) 대응 전수 점검 결과. 상세: `2026-06-12_웹_민아_수동.md` 세션 로그.

| 프로젝트 | API 키 | 상태 |
|---------|--------|------|
| **monkos** | **MONKOS NEW API Key 1개** (생성 2026-03-30) | ✅ **전 계정 유일 생존 키.** Gemini API 제한 적용. fp 3560db307f8e = SM `GEMINI_API_KEY` (06-05 막내2 대조) |
| monkos-3c6e4 | Browser key (Firebase 자동 생성) | ✅ Generative Language API 미활성 프로젝트 — 마감 무관. Firebase Auth용, 미조치 |
| monk-data-factory | 0개 | 구 2개(검색기능key·data_factory_APIkey, Google 차단) 삭제됨. **차단 사유 미규명** (ORDER_20260612 Task 1) |
| startMONK | 0개 | monk_chatbot_cloudflare 삭제됨. 프로젝트 종료 예정(버킷 2개 거취 확인 후) |
| ~~Default Gemini Project~~ · ~~monkos-aistudio~~ · ~~My Maps Project~~ | — | 🗑️ **2026-06-12 프로젝트 종료** (30일 복원창). 키 존재 가능 공간 소거 |

- 구 키 삭제 이력: monkos 3개(06-02, 유출키 monkosimagepro 포함) + 타 프로젝트 6개(06-05~06-11 작가님 일괄 정리).
- IAM 동시 축소(06-12, Recommender): monk-data-factory 기본 SA 2개 편집자 제거, startMONK smuse73 owner 제거.

## 1. 저장소별 시크릿 맵

### A. monkos_AI/.env (Cloud Run 소스 — iMac 실측 34개 유니크)

> 2026-06-02 iMac 실측: 35행(CF_WORKERS_AI_TOKEN 1행 중복) → 유니크 34개.
> **2026-06-03 갱신(오더 #8)**: CF_WORKERS_AI_TOKEN(dead placeholder) 완전 제거 → **현 유니크 34개**(시크릿 24 + 설정 10). 분류·등록 현황은 §0. 값 비노출 변수명 대조.
> **2026-06-12 GCP 전수조사**: GCP API 키 전체 11→2 축소 (monkos MONKOS NEW 1개 + monkos-3c6e4 Firebase Browser 1개). Gemini 06-19 마감 충족.

| # | 변수명 | 용도 | 사용 서비스 | 비고 |
|---|--------|------|------------|------|
| 1 | PROJECT_ID | GCP 프로젝트 ID | 전체 | |
| 2 | LOCATION | GCP 리전 | 전체 | |
| 3 | GCS_BUCKET | GCS 버킷명 | 전체 | |
| 4 | ADMIN_UIDS | 관리자 UID 목록 | portal | ⭐ 인벤토리 누락이었음 |
| 5 | GEMINI_API_KEY | Google AI Studio | idphoto-kr/jp | |
| 6 | CF_API_TOKEN | Cloudflare API | DNS 관리 | |
| 7 | CF_ZONE_ID | Cloudflare Zone ID | DNS 관리 | |
| ~~8~~ | ~~CF_WORKERS_AI_TOKEN~~ | ~~Workers AI 접근~~ | — | ✅ **2026-06-03 정리 완료** — placeholder(`붙여넣기`) 2행 중복 + 코드 미참조(dead). GCP·.env 양쪽 삭제. §0 참조 |
| 9 | KAKAO_REST_API_KEY | 카카오 OAuth | portal | |
| 10 | KAKAO_CLIENT_SECRET | 카카오 OAuth 시크릿 | portal | |
| 11 | KAKAO_REDIRECT_URI | 카카오 리다이렉트 | portal | |
| 12 | NAVER_CLIENT_ID | 네이버 OAuth | portal | ⭐ 누락 |
| 13 | NAVER_CLIENT_SECRET | 네이버 OAuth 시크릿 | portal | ⭐ 누락 |
| 14 | LINE_CHANNEL_ID | LINE 로그인 | portal | |
| 15 | LINE_CHANNEL_SECRET | LINE 로그인 시크릿 | portal | |
| 16 | LINE_MESSAGING_ACCESS_TOKEN | LINE 메시징 API | portal | ⭐ 누락 |
| 17 | LINE_MESSAGING_CHANNEL_SECRET | LINE 메시징 채널 시크릿 | portal | ⭐ 누락 |
| 18 | TOSS_SECRET_KEY | 토스페이먼츠 | portal (KR 결제) | ⭐ 2026-07-13 v2=라이브 정본 등록(작가님)·prod latest 참조 전환(콘솔 plain env 제거)·v1(6/3 테스트키 오등록분) destroy. 토스 재발급 구키는 토스측 7일 후 자동만료. dev는 별도 TOSS_SECRET_KEY_TEST |
| 19 | TOSS_WEBHOOK_SECRET | 토스 웹훅 검증 | portal | |
| 20 | LEMONSQUEEZY_API_KEY | Lemon Squeezy API | portal (JP/글로벌 결제) | 2026-07-02 v2 로테이션 (키노출 인시던트) |
| 21 | LEMONSQUEEZY_WEBHOOK_SECRET | Lemon Squeezy 웹훅 (JP store#290457) | portal | |
| 21-G | LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL | Lemon Squeezy 웹훅 (Global store#415328) | portal | 2026-06-23 |
| 22 | TELEGRAM_BOT_TOKEN | CS 봇 @monkos_support_bot | portal | 2026-10-22 portal Cloud Run 주입 = SM `latest` 참조(평문 env 제거, ORDER_20261022 SM 전환) — dev·prod |
| 23 | TELEGRAM_TEAM_BOT_TOKEN | 팀 전용 봇 | 내부 알림 · portal | ⭐ 누락 · 2026-10-22 portal Cloud Run 주입 = SM `latest` 참조(평문 env 제거, ORDER_20261022) — dev·prod |
| 24 | TEAM_CHAT_ID | 텔레그램 팀 채팅 ID | 내부 알림 | ⭐ 누락 |
| 25 | TEAM_NOTIFY_SECRET | 팀 알림 시크릿 | 내부 알림 · portal | ⭐ 누락 · 2026-10-22 portal Cloud Run 주입 = SM `latest` 참조(평문 env 제거, ORDER_20261022) — dev·prod |
| 25-E | TELEGRAM_EVENT_BOT_TOKEN | 이벤트 봇 (/start는 CS봇 안내) | portal (prod 전용) | 2026-10-22 SM 신규 등재(작가님 터미널, v1 — 현행 prod env 값 무노출 이관) · prod SM 참조 전환. **dev는 미적용·빈 값 유지**(작가님 10-22 "2번승인", dev 실발송 방지) |
| 26 | X_ACCESS_TOKEN | X/Twitter OAuth | n8n 자동화 | |
| 27 | X_ACCESS_TOKEN_SECRET | X OAuth 시크릿 | n8n | |
| 28 | X_CONSUMER_KEY | X API 컨슈머 키 | n8n | |
| 29 | X_CONSUMER_SECRET | X API 컨슈머 시크릿 | n8n | |
| ~~30~~ | ~~N8N_API_KEY~~ | ~~n8n 자동화 API~~ | 🗑️ **폐기(삭제)** | **07-24 SM 컨테이너 완전 삭제** (버전 destroy + 컨테이너 삭제). monk-n8n 서비스 삭제(07-24)로 소비처 0 |
| 31 | TX_API_KEY | D1 거래 원장 인증 | portal, MONK_kr | |
| 32 | TX_API_URL | D1 거래 원장 엔드포인트 | portal, MONK_kr | |
| 33 | REMOVEBG_API_KEY | remove.bg 배경 제거 API | 크롭앱, 스펙스, Android | ⭐ 2026-05-25 추가. 무료 50장/월 |
| 34 | CHAT_WORKERS_URL | 챗봇 Workers 엔드포인트 | portal | ⭐ 2026-06-02 §A 편입 (§F deploy.sh엔 기존 존재) |
| 35 | CHAT_API_KEY | 챗봇 Workers API 인증 | portal | ⭐ 2026-06-02 §A 편입 (§3 CF Dashboard와 동일값) |
| 36 | AGENT_API_KEYS | GH Actions→포털 CMS 에이전트 인증 | portal (blog-draft-publish) | ⭐ 2026-06-11 신설. SM: AGENT-API-KEYS, GH: PORTAL_AGENT_KEY. deploy.sh --set-secrets 주입. **2026-09-26 v2 로테이션**(민아 세션 컨텍스트 부분 노출 → 작가님 `secret add`). prod rev 00564부터 v2, v1은 401 실측. GH PORTAL_AGENT_KEY는 15:54 SM→gh 파이프로 v2 동기(민아, 값 미접촉). v1은 15:56 disabled(작가님 지시, 민아 집행) — 노출 키 완전 폐기 |
| 37 | RUNPOD_API_KEY | RunPod Serverless API 인증 | monkos-matte (BiRefNet 서빙) | ⭐ 2026-07-07 신설. 키명 monkos-matte, R/W, RunPod T4 flex 서빙용 |
| 38 | MATTE_SECRET | 4060 BiRefNet 서버 인증 토큰 | 4060 matte-server, portal | ⭐ 2026-07-23 신설. X-Matte-Secret 헤더로 CR→4060 인증. 4060 NSSM env + SM 등록 |
| 39 | CF_PAGES_TOKEN | CF Pages 배포 API 토큰 | 4060 빌드→CF Pages deploy | ⭐ 2026-07-23 신설. Pages:Edit + Workers Scripts:Edit 스코프. SSG 빌드 파이프라인용 |
| 40 | PAGESPEED_API_KEY | PageSpeed Insights API 키 | 대시보드/성능 측정 | 2026-07-21 생성분 — **07-24 감사에서 미등재 적발, 소급 등재** |
| 41 | WORKER_PROXY_SECRET | CF Workers→CR 프록시 인증 토큰 | cf-proxy worker (X-Proxy-Secret 헤더) | ⭐ 2026-07-24 신설. openssl rand -hex 32 생성. CR 측 검증 미들웨어는 별도 구현 필요 |
| 42 | HF_TOKEN | HuggingFace 모델 다운로드 (매트·크롭 벤치마크·3D) | 4060 + 로컬 | ⭐ 2026-07-24 신설(구 하드코딩 토큰 로테이션분, READ 권한). **07-25 순찰이 인벤 미등재 적발 → 소급 등재**. `_start_server.bat` 환경변수 참조 전환 완료. 4060 env 세팅 대기 |
| 43 | RESEND_API_KEY | monkos.ai 메일 발신 (탈퇴 완료 통지·영수증·CS 회신) | portal (`lib/mailer.js`) | ⭐ 2026-08-13 신설. 도메인 인증은 `send` 서브도메인 방식(루트 MX·SPF 무관 — CF Email Routing 수신 보존). deploy.sh --set-secrets 주입 |
| 44 | EDGE_TRUST_KEY | CF 엣지 워커↔포털 오리진 신뢰 헤더 공유 시크릿 (타 CF 테넌트 중계 위장 차단 — 쌍아 P2-2) | portal (`lib/shared/edge-trust.js`, deploy.sh --set-secrets) + CF Worker `monkos-portal-edge` env 바인딩 | ⭐ 2026-08-24 신설 (작가님 secret 등록). 대역 AND 키 상수시간 대조, 미설정 시 fail-secure 비신뢰 |
| 45 | CF_PAGES_DEPLOY_TOKEN | GitHub Actions monk.kr CF Pages 버튼 배포 전용 (계정 토큰 `github-actions-monk-kr-pages`, Pages:Edit 단일 스코프) | `.github/workflows/deploy-monk-kr.yml` (GitHub Secrets 동명 등재) | ⭐ 2026-09-24 신설. **만료 2027-09-24**. #39 CF_PAGES_TOKEN(Pages+Workers Scripts, 4060 SSG용)과 용도 분리 — 스코프가 더 좁은 CI 전용. 09-24 GitHub 최초 등록이 빈값이라 SM→gh 파이프로 재등록 |
| 46 | CF_ACCOUNT_ID | Cloudflare 계정 ID (비밀도 낮음, Actions 입력용) | `deploy-monk-kr.yml` (GitHub Secrets 동명 등재) | ⭐ 2026-09-24 신설 |

### B. 루트 .env (로컬 전용 — 2개)

| # | 변수명 | 용도 | 비고 |
|---|--------|------|------|
| 1 | ELEVENLABS_API_KEY | ElevenLabs TTS | ⭐ 누락. 프로토타입용 |
| 2 | KIMI_API_KEY | Kimi AI API | ✅ Secret Manager 등록 완료 (v2, 2026-06-21). 로컬 평문 파일 삭제됨 |

### C. apps/monk_imagen4/backend/.env (2개)

| # | 변수명 | 용도 | 비고 |
|---|--------|------|------|
| 1 | CLOUDFLARE_API_TOKEN | CF API | monkos_AI의 CF_API_TOKEN과 동일값 추정 |
| 2 | CLOUDFLARE_ZONE_ID | CF Zone ID | 동일값 추정 |

### D. apps/monk_imagen4/.env.local (1개)

| # | 변수명 | 용도 | 비고 |
|---|--------|------|------|
| 1 | GEMINI_API_KEY | Gemini API | monkos_AI와 동일값 추정 |

### E. Cloudflare Dashboard (monk-kr Pages — 16개)

| # | 변수명 | 용도 |
|---|--------|------|
| 1 | GEMINI_API_KEY | Workers AI 폴백 |
| 2 | KAKAO_CLIENT_ID | 카카오 OAuth (monk.kr) |
| 3 | KAKAO_CLIENT_SECRET | 카카오 OAuth 시크릿 |
| 4 | GOOGLE_CLIENT_ID | Google OAuth |
| 5 | GOOGLE_CLIENT_SECRET | Google OAuth 시크릿 |
| 6 | GCP_PROJECT_ID | Vertex AI 프로젝트 |
| 7 | GCP_SERVICE_ACCOUNT_KEY | SA JSON 문자열 |
| 8 | GCS_BUCKET | GCS 버킷 |
| 9 | GCS_BACKUP_ENABLED | 백업 플래그 |
| 10 | TELEGRAM_BOT_TOKEN | 텔레그램 봇 |
| 11 | ADMIN_CHAT_ID | 관리자 채팅 ID |
| 12 | TX_API_KEY | D1 거래 원장 |
| 13 | CHAT_API_KEY | 챗봇 Workers API 인증 (monkos.ai→Workers 서비스 간 호출) | ⭐ 2026-05-25 추가
| 14 | TOSS_CLIENT_KEY | 사진관 인화 주문 토스 결제위젯 (`functions/api/studio-order.js`) — SM #TOSS_CLIENT_KEY 동일 값, 포털과 공유(사업자 단위) | ⭐ 2026-10-22 추가 (민아, `secret get`→`wrangler pages secret put` 파이프 동기화) |
| 15 | TOSS_SECRET_KEY | 사진관 인화 주문 토스 승인 + 주문 토큰 HMAC (`functions/api/studio-pay.js`) — SM 동일 값 | ⭐ 2026-10-22 추가 (동상) |
| 16 | RESEND_API_KEY | 사진관 인화 주문 사진·결제완료 메일 발신 (`functions/api/_lib/studio-order.js`) — SM #43 동일 값 | ⭐ 2026-10-22 추가 (동상). SM↔Pages 자동 동기 없음 — 로테이션 시 재파이프 · 재동기화 2026-10-22 (secret pages-sync, 길이 36) |

> ⚠️ **§E GEMINI_API_KEY 지문 미대조** (2026-06-12 검수): monkos_AI와 "동일값 추정"일 뿐 실측 대조된 적 없음. 만약 구 프로젝트(Default Gemini 등) 발급 키였다면 06-12 프로젝트 종료로 무효화됐을 수 있음 → **지문 대조 또는 monk.kr Gemini 폴백 라이브 검증 필요** (ORDER_20260612 Task 1 연계).

### F. Cloud Run 환경변수 (deploy.sh 경유)

| 서비스 | 주입 변수 | deploy.sh |
|--------|----------|-----------|
| monkos-portal | PROJECT_ID, LOCATION, GCS_BUCKET, ADMIN_UIDS + .env 17개 + **CHAT_WORKERS_URL, CHAT_API_KEY** | monkos_AI/portal/deploy.sh |
| monkos-idphoto-kr | PROJECT_ID, LOCATION, GCS_BUCKET | monkos_AI/idphoto-kr/deploy.sh |
| monkos-idphoto-jp | PROJECT_ID, LOCATION, GCS_BUCKET | monkos_AI/idphoto-jp/deploy.sh |
| monkos-studio | (확인 필요) | monkos_AI/studio/deploy.sh |

### G. GCP 서비스 계정 (SA)

| SA | 이메일 | IAM 역할 | 용도 | 비고 |
|----|--------|---------|------|------|
| yong-a-orchestrator | yong-a-orchestrator@monkos.iam.gserviceaccount.com | **Agent Platform 사용자** + aiplatform.user + storage.objectAdmin | CI·관리용 | ✅ 06-10 editor→Agent Platform 축소. 키 교체: c1b7e5a702b8(6/10 발급, SM+GH 등록, 로컬 삭제). **06-12 실측: 구키 1月·5月 삭제 완료 확인** |
| monk-image-engine | monk-image-engine@monkos.iam.gserviceaccount.com | aiplatform.user + datastore.owner + datastore.user + storage.objectAdmin + **secretmanager.secretAccessor** + **roles/indexing.publisher**(GSC 스코프) · ~~tokenCreator(프로젝트)~~ → **tokenCreator(SA 레벨 — 자기서명 전용)** | Cloud Run 실행 SA | ✅ GSC sc-domain:monkos.ai 소유자 등록 완료 (06-07). indexing.publisher는 GSC 스코프. 06-11 secretmanager.secretAccessor 부여. **07-24 tokenCreator 프로젝트→SA 축소**(자기 signBlob 한정) + gdsajin SA-level tokenCreator(GSC 쓰기 임퍼소네이션, gsc_submit.sh 경유) |
| Compute Engine default | 933456016842-compute@developer.gserviceaccount.com | **roles/editor** (Cloud Build 기본 실행 SA — 암묵 의존) | GCE 기본 | 07-24 editor 회수 시도 → Cloud Build storage.objects.get 실패로 배포 불가 → **editor 복원**. T3(SA 분리) 전까지 유지 필수 |
| smuse73 *(startMONK)* | smuse73@gen-lang-client-0105707468.iam.gserviceaccount.com | serviceusage.serviceUsageConsumer + aiplatform.user | 레거시 | ✅ 06-12 owner 제거. ⚠️ USER_MANAGED 키 1개(67d2ab92, 2025-12-22). 프로젝트 종료 시 일괄 폐기 후보 |
| monk-factory-agent *(monk-data-factory)* | monk-factory-agent@monk-data-factory.iam.gserviceaccount.com | storage.objectAdmin + aiplatform.user | 데이터 팩토리 | ⚠️ USER_MANAGED 키 1개(863e0af1, 2025-12-29). 기본 SA 2개 편집자 06-12 제거. 용도 재확인 후 결정 |

### H. 로컬 인증 파일

| 파일 | 경로 | 용도 |
|------|------|------|
| ADC | ~/.config/gcloud/application_default_credentials.json | gcloud 기본 인증 |
| SA 키 캐시 (MCP 1순위) | ~/.config/monkos-mcp/sa_key.json | gsc_mcp.sh용 GCP_SA_KEY 복원본(600) — SM 정본 단일화 원칙 (2026-07-14 작가님·쌍아·민아 합의) |
| ADC impersonated (폴백) | ~/.config/gcloud/adc_impersonated.json | yong-a 임퍼소네이션 — SM 접근 불가 시 폴백. 주의: source_credentials에 사용자 리프레시 토큰 내장(기존 ADC 사본) |
| ADC impersonated | ~/.config/gcloud/adc_impersonated.json | SA 임퍼소네이션 |

#### H-2. 기기 로그인 세션 전제 (2026-10-22 신설 — 민아. "손이 안 간" 흐름이 기대는 숨은 자격. 새 기기·재설치 시 먼저 복구)

| 자격 | 저장 위치(기기 로컬) | 쓰는 곳 | 복구 명령 | 실측 |
|------|---------------------|---------|-----------|------|
| Cloudflare 계정 로그인 (wrangler OAuth) | `~/Library/Preferences/.wrangler/config/default.toml` | `secret pages-sync`(Pages 시크릿 put/list), `wrangler pages secret list`, 로컬 `pages dev`, 예비 배포 경로 | `npx wrangler login` (브라우저 승인) · 확인 `npx wrangler whoami` | iMac 10-22 ✅ (사용자 OAuth — CF_PAGES_DEPLOY_TOKEN #45와 별개, 범위가 더 넓음) |
| GitHub CLI 로그인 (gh) | `~/.config/gh/hosts.yml` (keyring) | 버튼 배포 `gh workflow run`·`gh run watch`, PR·이슈 | `gh auth login` · 확인 `gh auth status` | iMac 10-22 ✅ |
| gcloud 사용자 계정 + ADC | `~/.config/gcloud/` (위 H 표) | `secret.sh` 전부(SM 조회·등록), `gcloud run` 조회 | `gcloud auth login` + `gcloud auth application-default login` | iMac 10-22 ✅ |

> 원칙: 이 세 로그인은 **값이 아니라 세션**이라 SM에 넣지 않는다. 대신 어느 기기에 살아 있는지 이 표로 안다. 에이전트가 "도구가 안 된다"를 만나면 키 부재보다 이 표를 먼저 본다. 다른 기기(M1·M2·4060)는 미실측 — 그 기기에서 처음 쓸 때 행을 채운다.

### I. D1 데이터베이스

| 이름 | 바인딩 위치 |
|------|------------|
| monk-db | 루트 wrangler.toml |
| monk-services-db | cloudflare-workers wrangler.toml |

### J. GCP Secret Manager (로컬 런타임 키 표준 — project=monkos)

> 2026-06-02 신설. **로컬 도구 런타임 키의 표준 저장소** (GitHub Secrets는 write-only/Actions 전용이라 로컬이 값을 못 읽음).
> 접근: `gcloud secrets versions access latest --secret=<NAME> --project=monkos`

| 시크릿명 | 용도 | 사용처 | 등록일 |
|---------|------|--------|--------|
| MCP_GDOCS_CLIENT_ID | gdocs MCP OAuth 클라이언트 ID | `scripts/tools/gdocs_mcp.sh` | 기존 |
| MCP_GDOCS_CLIENT_SECRET | gdocs MCP OAuth 클라이언트 시크릿 | `scripts/tools/gdocs_mcp.sh` | 기존 |
| MCP_GDOCS_TOKEN | gdocs MCP refresh token (token.json 전체) | gdocs_mcp.sh 자동복원 | ⭐ 2026-06-02 신설 |
| ELEVENLABS_API_KEY · KIMI_API_KEY | TTS·AI 프로토타입 | 루트 .env 대응 | 기존 |
| **monkos_AI/.env 시크릿 24종** | §0 분류 참조 (GEMINI_API_KEY·CF_API_TOKEN·CHAT_API_KEY·KAKAO_*·NAVER_CLIENT_SECRET·LINE_*·TOSS_*·LEMONSQUEEZY_*·TELEGRAM_*·TEAM_NOTIFY_SECRET·X_*·N8N_API_KEY·TX_API_KEY·REMOVEBG_API_KEY·ADMIN_UIDS) | Cloud Run 런타임 / 타 디바이스 복원 | ⭐ **2026-06-03 일괄 등록 (광역오더 #8)** — 변수명 그대로, 해시 정합 24/24 |
| **GCP_SA_KEY** | yong-a-orchestrator SA 키 JSON (키 ID: c1b7e5a702b8) | GH Actions·웹 민아 루틴·로컬 gcloud 복원 | ⭐ **2026-06-10 등록** — 광역오더 #8 보완(SA 키 누락분). 로컬 미보관(SM=정본) |
| **AGENT-API-KEYS** | 포털 CMS 에이전트 인증 (GH `PORTAL_AGENT_KEY` 카탈로그 동기) | portal blog-draft-publish, deploy.sh --set-secrets 주입 | ⭐ **2026-06-11 신설** — §A #36 대응 |
| **LEMONSQUEEZY_VARIANT_SPECS_SINGLE** | Lemon Squeezy 글로벌 스토어 specs 단건 variant ID | portal (specs 글로벌 결제) | ⭐ **2026-07-05 신설** — USD $1.99 통일 |
| **TOSS_CLIENT_KEY** | 토스페이먼츠 라이브 클라이언트 키 (결제위젯 SDK용) | portal (KR 결제) | ⭐ **2026-07-05 신설** — specs KR 결제 연동 |

| **AUTH_SECRET** | NextAuth 세션 서명 키 | portal (CR 환경변수 직접 설정) | ⭐ **2026-06-12 SM 등록 확인** — 콘솔에서 직접 설정된 것도 있음 · **2026-11-03 v2(끝 줄바꿈 없음, 작가님 secret.sh) = prod 값 해시 일치 → deploy.sh SM 참조 전환(원장 181)**. v1은 끝 줄바꿈 포함 — 참조 금지(trim 없는 서명 키) |
| **GITHUB_TOKEN** | 포털 GitHub API 토큰 | portal | ⭐ **2026-11-03 신설** — prod 평문 env 값 이전(작가님 secret.sh, 해시 일치), deploy.sh SM 참조(원장 181) |
| **GOOGLE_CLIENT_SECRET** | Google OAuth 클라이언트 시크릿 | portal | ⭐ **2026-11-03 SM 신설** — prod 평문 env 값 이전(작가님 secret.sh, 해시 일치), deploy.sh SM 참조(원장 181) |
| **TOSS_SECRET_KEY_TEST** | 토스 테스트 시크릿 키 | portal-dev (개발 환경 결제 테스트) | ⭐ **2026-07-12 신설** — dev 환경 전용, prod TOSS_SECRET_KEY와 분리 |
| **TOSS_CLIENT_KEY_TEST** | 토스 테스트 클라이언트 키 (결제위젯 SDK용) | portal-dev · studio-dev · idphoto-kr-dev (dev 결제위젯) | ⭐ **2026-07-25 신설** — dev 실결제 차단. deploy.sh 평문 하드코딩(`portal/deploy.sh:91`) → SM 참조 전환 대상. ORDER_20260725 토스클라이언트키_dev분리 |
| **LEMONSQUEEZY_API_KEY_GLOBAL** | Lemon Squeezy 글로벌 스토어 API 키 | portal (글로벌 결제) | ⭐ **2026-06-23 신설** — Global store#415328 |
| **LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL** | Lemon Squeezy 글로벌 웹훅 시크릿 | portal | ⭐ **2026-06-23 신설** — Global store#415328 |
| **BING_WMT_API_KEY** | Bing Webmaster Tools API | daily_briefing (Bing 검색 성과) | ⭐ **2026-07-14 신설** — 일본 시장 Bing 36% 대응 |
| **NAVER_DATALAB_CLIENT_ID** | 네이버 DataLab API 클라이언트 ID | daily_briefing (네이버 트렌드) | ⭐ **2026-07-14 신설** — 네이버 검색 트렌드 수집 |
| **NAVER_DATALAB_CLIENT_SECRET** | 네이버 DataLab API 클라이언트 시크릿 | daily_briefing (네이버 트렌드) | ⭐ **2026-07-14 신설** |
| **GOOGLE_ADS_DEV_TOKEN** | Google Ads API 개발자 토큰 (MCC 663-413-9609) | 키워드 플래너·캠페인 관리 API | ⭐ **2026-07-17 신설** — Basic Access 승인 완료 (2026-07-19) |
| **GOOGLE_ADS_CLIENT_ID** | Google Ads OAuth 클라이언트 ID | Ads API 인증 | ⭐ **2026-07-19 신설** |
| **GOOGLE_ADS_CLIENT_SECRET** | Google Ads OAuth 클라이언트 시크릿 | Ads API 인증 | ⭐ **2026-07-19 신설** |
| **GOOGLE_ADS_REFRESH_TOKEN** | Google Ads OAuth 리프레시 토큰 | Ads API 인증 | ⭐ **2026-07-19 신설** |
| **GOOGLE_ADS_CUSTOMER_ID** | Google Ads MCC ID (663-413-9609, 하이픈 제거) | Ads API login-customer-id | ⭐ **2026-07-19 신설** |
| **GOOGLE_ADS_CLIENT_CID** | Google Ads 클라이언트 계정 (MonkosAI, 586-642-3846) | Ads API 메트릭 조회 대상 | ⭐ **2026-07-19 신설** |
| **TOSS_SECRET_KEY** | 토스페이먼츠 라이브 시크릿 키 | portal (KR 결제 서버 검증) | ⭐ **2026-07-13 신설** |
| **YOUTUBE_DATA_API_KEY** | YouTube Data API v3 키 (GCP 키 `youtube-data-readonly`, keys/c5f7f009-…, **youtube.googleapis.com 전용 제한**) | 공개 영상 메타(설명란·조회수) 목록화 — PF_GO 유튜브 해설 수집(막내2) | ⭐ **2026-11-05 신설** (작가님 22:13 승인·22:15 대행 지시, `secret add` 경유) |

**gdocs 토큰 중앙화 (광역오더 #7)**: iMac 정본 `~/.config/mcp-google-docs/token.json` → `MCP_GDOCS_TOKEN`으로 등록.
`gdocs_mcp.sh`가 token.json 부재 시 GCP에서 자동 복원 → **타 디바이스(M1 등) 무인증 동작**. 검증 완료(바이트 동일 복원·권한 600).

---

## 2. 갭 분석 (2/19 인벤토리 대비)

### 누락 항목 (11개)

| 변수 | 저장소 | 추정 추가 시기 |
|------|--------|---------------|
| CF_WORKERS_AI_TOKEN | monkos_AI/.env | 챗봇 Workers AI 배포 시 (5월) |
| ADMIN_UIDS | monkos_AI/.env | portal 관리자 기능 |
| NAVER_CLIENT_ID | monkos_AI/.env | 네이버 OAuth 추가 시 |
| NAVER_CLIENT_SECRET | monkos_AI/.env | 네이버 OAuth 추가 시 |
| LINE_MESSAGING_ACCESS_TOKEN | monkos_AI/.env | LINE 메시징 확장 시 |
| LINE_MESSAGING_CHANNEL_SECRET | monkos_AI/.env | LINE 메시징 확장 시 |
| TELEGRAM_TEAM_BOT_TOKEN | monkos_AI/.env | 팀 내부 알림 봇 신설 |
| TEAM_CHAT_ID | monkos_AI/.env | 팀 내부 알림 |
| TEAM_NOTIFY_SECRET | monkos_AI/.env | 팀 내부 알림 |
| ELEVENLABS_API_KEY | 루트 .env | TTS 프로토타입 |
| KIMI_API_KEY | 루트 .env | AI 프로토타입 |

### 중복 저장 (동일 키 다수 위치)

| 변수 | 위치 1 | 위치 2 | 위치 3 |
|------|--------|--------|--------|
| GEMINI_API_KEY | monkos_AI/.env | CF Dashboard | apps/monk_imagen4/.env.local |
| CF_API_TOKEN / CLOUDFLARE_API_TOKEN | monkos_AI/.env | apps/monk_imagen4/backend/.env | — |
| KAKAO_CLIENT_SECRET | monkos_AI/.env | CF Dashboard | — |
| TELEGRAM_BOT_TOKEN | monkos_AI/.env | CF Dashboard | — |
| TX_API_KEY | monkos_AI/.env | CF Dashboard | — |
| GCS_BUCKET | monkos_AI/.env | CF Dashboard | — |

### 보안 이슈

| 이슈 | 심각도 | 대응 |
|------|--------|------|
| ~~yong-a-orchestrator에 roles/editor 부여~~ | ✅ 해소 | **2026-06-19 작가님 직접 editor 삭제 확정** (06-10 Agent Platform 축소의 후속, 본 행 정본 보정). 현 권한: Agent Platform + aiplatform.user + storage.objectAdmin → GCP_SA_KEY 유출 시에도 Cloud Run 배포·삭제 불가 |
| yong-a-orchestrator storage.objectAdmin (GA4·집계 read 용도엔 과권한) | 🟡 중간 | 유출 시 monk-ai-images 고객사진 R/W/삭제 노출. 읽기전용이면 objectViewer로 축소 검토 |
| CF Dashboard에 SA JSON 문자열 직접 저장 | 🟡 중간 | 현재 CF 표준 방식. 대안 제한적 |
| .env 파일 4대 디바이스 수동 동기화 | 🟡 중간 | GitHub Secrets 도입 시 개선 |

---

## 3. GitHub Secrets (gdsajin-byte/monk_project)

> 2026-05-11 등록 완료. `gh secret list`로 확인 가능.

| GitHub Secret 이름 | 값 소스 | SA | 등록일 | 용도 |
|--------------------|---------|-----|--------|------|
| GCP_SA_KEY | yong-a-orchestrator 키 JSON → base64 | yong-a-orchestrator | 05-11 (06-10 신키 c1b7e5a702b8 교체 등록) | Actions에서 GCP 인증 |
| GA4_PROPERTY_ID | `521406894` | — | 05-11 | 일일 보고서 |
| GSC_SITE_URL | `sc-domain:monkos.ai` | — | 05-11 | 일일 보고서 |
| TELEGRAM_BOT_TOKEN | Firebase Functions (telegramWebhook) @monkos_factory_bot | — | 05-12 | 텔레그램 알림 허브 (팩토리 봇) |
| TELEGRAM_CHAT_ID | Firebase Functions WRITER_CHAT_ID | — | 05-12 | 작가님 DM (팩토리 봇 → 작가님) |
| PAT_TOKEN | GitHub Fine-grained PAT (MONKOS_PAT, No expiration) | — | 05-11 | cross-repo 접근 (monk_project + monkos-works + monk-kr) |
| ~~MONKOS-CDP~~ | GitHub Fine-grained PAT — 코웍이 깃 접근용(한송이 재직기 발급). CDP 브라우저 자동화·로컬 git(SSH)·Actions 전부 무의존 확인 | — | 07-05 | **만료 방치 처분 (2026-07-06 만료, 작가님 확정)**. 만료 후 401 발생 시 숨은 소비처 역추적 |
| MCP_GDOCS_CLIENT_ID | GCP Secret Manager 동기화 | — | 06-02 | 정본 카탈로그 + 향후 Actions 확장 |
| MCP_GDOCS_CLIENT_SECRET | GCP Secret Manager 동기화 | — | 06-02 | 정본 카탈로그 + 향후 Actions 확장 |
| MCP_GDOCS_TOKEN | token.json 전체 (GCP와 동일 페이로드) | — | 06-02 | gdocs 토큰 카탈로그 |
| PORTAL_AGENT_KEY | SM `AGENT-API-KEYS` 동일 페이로드 | — | 06-11 | blog-draft-publish → 포털 CMS 인증 (⚠️ 401 미해소 — Cloud Run `AGENT_API_KEYS` 값 대조 미결, 기보고 #54/#57) |
| CF_PAGES_DEPLOY_TOKEN | SM `CF_PAGES_DEPLOY_TOKEN`(#45) 동일 값 — SM↔GitHub 자동 동기 없음 | — | 09-24 | monk.kr 버튼 배포 (`deploy-monk-kr.yml`). **만료 2027-09-24** — SM 로테이션 시 `gh secret set` 동시 갱신 필수 |
| CF_ACCOUNT_ID | SM `CF_ACCOUNT_ID`(#46) 동일 값 | — | 09-24 | monk.kr 버튼 배포 (`deploy-monk-kr.yml`) |

### 향후 확장 (배포 자동화 시)

| GitHub Secret 이름 | 값 소스 | 용도 |
|--------------------|---------|------|
| CF_API_TOKEN | monkos_AI/.env | CF 배포 자동화 |

---

## 4. 디바이스 맵 + SSH/Tailscale 크리덴셜

> 2026-05-18 갱신. Tailscale 네트워크: gdsajin@

### Tailscale 디바이스

| 약칭 | Tailscale 호스트 | IP | OS | 소유 | 용도 |
|------|-----------------|-----|-----|------|------|
| **iMac** | jeong-kyu-imac | 100.97.103.10 | macOS | 작가님 | 사무실 메인 워크스테이션 |
| **M1** | macmini-macmini | 100.76.80.99 | macOS | 작가님 | 집. Xcode 원격 빌드 + VNC |
| **M2** | kku-macmini-m2-macmini | 100.81.38.20 | macOS | 꾸(와이프) | 팀원용 |
| ~~**M4**~~ | han-macbookpro | 100.121.220.14 | macOS | 한송이 | ❌ 실효 (05-27 퇴사, 10-23 테일넷 미등재 확인) |
| **4060** | monk-4060 (구 desktop-70gomar, 10-23 실측 교정) | 100.118.31.62 | Windows | 작가님 | GPU 서버 (WSL) — 09-02 라인업 배제, offline 정상 |
| **iPhone** | iphone181 | 100.115.57.53 | iOS | 작가님 | 모바일 |

### 권한 매트릭스 — SA·임퍼소네이션·키 상태 (2026-07-24 감사 신설, 갱신 의무: IAM 변경 시 동반)

> 에이전트 인지 정본: 권한 관련 판단 전 이 표를 Read. 실측 갱신: `scripts/tools/sa_audit.sh`

| 주체 | 프로젝트 롤 | 키 상태 | 임퍼소네이션 | 용도 |
|------|------------|---------|-------------|------|
| monk-image-engine SA | aiplatform.user · datastore.owner/user · bq.dataEditor/jobUser · storage.objectAdmin · secretAccessor · **tokenCreator(SA 레벨 — 자기서명 전용, 07-24 프로젝트→SA 축소)** | 사용자 키 0 (키리스 ✓) | ← gdsajin (SA 레벨, GSC 쓰기용) | **전 Cloud Run 런타임(10서비스)** + GSC 소유자 |
| yong-a-orchestrator SA | aiplatform.user · bq.dataEditor/jobUser · storage.objectAdmin | **영구 키 1개** (06-10 생성, 무만료 — ⚠️로테이션 부재). SM `GCP_SA_KEY` 정본 + 로컬 600 | ← gdsajin (7/14 합의) | MCP·에이전트 오케스트레이션. GSC=전체 사용자(읽기) |
| compute default SA | **roles/editor** (Cloud Build 기본 실행 SA 암묵 의존 — 07-24 회수→배포실패→복원. T3 SA 분리 전 유지 필수) | — | — | Cloud Build 소스 업로드·빌드 실행 |
| ~~appspot SA~~ | 🗑️ **부재 — 항목 폐기 (07-25 민아 실측)**. `gcloud iam service-accounts list` 결과 monkos 프로젝트 SA는 yong-a·monk-image-engine·compute default **3개뿐**, appspot SA 자체가 존재하지 않음. 이 유령 행이 07-24 T2 지시서의 "appspot 롤 회수" 오조준 근원(실제 editor 보유자는 compute default) | — | — | ~~App Engine legacy~~ |
| user gdsajin | owner · cloudbuild.editor | — | → yong-a · image-engine | 작가님 (1인 운영 루트) |

- GSC 쓰기(사이트맵)는 `gsc_submit.sh` 경유 (image-engine 임퍼소네이션). MCP는 읽기 전용.
- 순찰 규약: 이 표와 실측(sa_audit.sh) 불일치 발견 시 즉시 보고 + 표 갱신.

### SSH 접속 정보

| 약칭 | 접속 명령 | User | 인증 방식 | 설정 위치 |
|------|----------|------|----------|----------|
| **M1** | `ssh m1` | macmini | SSH 키 | ~/.ssh/config |
| **M2** | `sshm2` / `ssh m2` | kku | 비밀번호 (값 기재 금지 — 07-24 마스킹, SSH 키 전환 권고) | ~/.bash_profile + ~/.ssh/config |
| **M4** | `ssh m4` | hansonngyi | 비밀번호 | ~/.ssh/config |
| **4060** | `ssh4060` / `ssh 4060` | smuse73 | **SSH 키 전용** (07-24 전환 완료 — PasswordAuthentication no + KbdInteractiveAuthentication no, 실측 "Permission denied (publickey)" 단독. 백업: sshd_config.bak_20260724) | ~/.bash_profile + ~/.ssh/config |

### 원격 빌드 파이프라인 (5/13 확립)

```
iMac (코드 편집) → scp → M1 (xcodebuild) → Simulator → VNC (UI 확인)
```
- VNC: macOS 화면 공유 (Tailscale P2P, ping 8ms)
- M4도 동일 파이프라인 가능 (5/15~16 확립, arm64 + Xcode 26.5)

### 디바이스 프로필 정본

`monkos-ops/ops/devices/` — 5/13 전수 수집 (iMac, M1, M2, 4060, M4)

---

## 5. 변경 시 체크리스트

1. 키 추가/변경 → 해당 `.env` 갱신
2. deploy.sh `--update-env-vars` 반영 여부 확인
3. CF 서비스면 Dashboard 수동 등록
4. **이 문서(SECRET_INVENTORY.md) 갱신** ← 정본
5. `.gitignore` 패턴 확인
6. GitHub Secrets 해당 시 등록/갱신
7. 디바이스 추가/IP 변경 시 §4 + `~/.ssh/config` + `~/.bash_profile` 동시 갱신
8. `credentials_inventory.md`는 이 문서로 대체됨 (구본)
