---
type: inventory
date: 2026-05-11
updated_by: iMac/쌍아
status: 현행
---

# MONKOS 시크릿 인벤토리

> ⚠️ **이 문서에 키 값을 절대 기재하지 않는다.** 항목+위치+용도만 기록.
> 전신: `credentials_inventory.md` (2026-02-19). 본 문서가 정본.
> 최종 갱신: 2026-05-11

---

## 1. 저장소별 시크릿 맵

### A. monkos_AI/.env (Cloud Run 소스 — 33개)

| # | 변수명 | 용도 | 사용 서비스 | 비고 |
|---|--------|------|------------|------|
| 1 | PROJECT_ID | GCP 프로젝트 ID | 전체 | |
| 2 | LOCATION | GCP 리전 | 전체 | |
| 3 | GCS_BUCKET | GCS 버킷명 | 전체 | |
| 4 | ADMIN_UIDS | 관리자 UID 목록 | portal | ⭐ 인벤토리 누락이었음 |
| 5 | GEMINI_API_KEY | Google AI Studio | idphoto-kr/jp | |
| 6 | CF_API_TOKEN | Cloudflare API | DNS 관리 | |
| 7 | CF_ZONE_ID | Cloudflare Zone ID | DNS 관리 | |
| 8 | CF_WORKERS_AI_TOKEN | Workers AI 접근 | 챗봇 등 | ⭐ 누락 (2개 중복 기재) |
| 9 | KAKAO_REST_API_KEY | 카카오 OAuth | portal | |
| 10 | KAKAO_CLIENT_SECRET | 카카오 OAuth 시크릿 | portal | |
| 11 | KAKAO_REDIRECT_URI | 카카오 리다이렉트 | portal | |
| 12 | NAVER_CLIENT_ID | 네이버 OAuth | portal | ⭐ 누락 |
| 13 | NAVER_CLIENT_SECRET | 네이버 OAuth 시크릿 | portal | ⭐ 누락 |
| 14 | LINE_CHANNEL_ID | LINE 로그인 | portal | |
| 15 | LINE_CHANNEL_SECRET | LINE 로그인 시크릿 | portal | |
| 16 | LINE_MESSAGING_ACCESS_TOKEN | LINE 메시징 API | portal | ⭐ 누락 |
| 17 | LINE_MESSAGING_CHANNEL_SECRET | LINE 메시징 채널 시크릿 | portal | ⭐ 누락 |
| 18 | TOSS_SECRET_KEY | 토스페이먼츠 | portal (KR 결제) | |
| 19 | TOSS_WEBHOOK_SECRET | 토스 웹훅 검증 | portal | |
| 20 | LEMONSQUEEZY_API_KEY | Lemon Squeezy API | portal (JP/글로벌 결제) | |
| 21 | LEMONSQUEEZY_WEBHOOK_SECRET | Lemon Squeezy 웹훅 | portal | |
| 22 | TELEGRAM_BOT_TOKEN | CS 봇 @monkos_support_bot | portal | |
| 23 | TELEGRAM_TEAM_BOT_TOKEN | 팀 전용 봇 | 내부 알림 | ⭐ 누락 |
| 24 | TEAM_CHAT_ID | 텔레그램 팀 채팅 ID | 내부 알림 | ⭐ 누락 |
| 25 | TEAM_NOTIFY_SECRET | 팀 알림 시크릿 | 내부 알림 | ⭐ 누락 |
| 26 | X_ACCESS_TOKEN | X/Twitter OAuth | n8n 자동화 | |
| 27 | X_ACCESS_TOKEN_SECRET | X OAuth 시크릿 | n8n | |
| 28 | X_CONSUMER_KEY | X API 컨슈머 키 | n8n | |
| 29 | X_CONSUMER_SECRET | X API 컨슈머 시크릿 | n8n | |
| 30 | N8N_API_KEY | n8n 자동화 API | Docker 4060 | |
| 31 | TX_API_KEY | D1 거래 원장 인증 | portal, MONK_kr | |
| 32 | TX_API_URL | D1 거래 원장 엔드포인트 | portal, MONK_kr | |

### B. 루트 .env (로컬 전용 — 2개)

| # | 변수명 | 용도 | 비고 |
|---|--------|------|------|
| 1 | ELEVENLABS_API_KEY | ElevenLabs TTS | ⭐ 누락. 프로토타입용 |
| 2 | KIMI_API_KEY | Kimi AI API | ⭐ 누락. 프로토타입용 |

### C. apps/monk_imagen4/backend/.env (2개)

| # | 변수명 | 용도 | 비고 |
|---|--------|------|------|
| 1 | CLOUDFLARE_API_TOKEN | CF API | monkos_AI의 CF_API_TOKEN과 동일값 추정 |
| 2 | CLOUDFLARE_ZONE_ID | CF Zone ID | 동일값 추정 |

### D. apps/monk_imagen4/.env.local (1개)

| # | 변수명 | 용도 | 비고 |
|---|--------|------|------|
| 1 | GEMINI_API_KEY | Gemini API | monkos_AI와 동일값 추정 |

### E. Cloudflare Dashboard (monk-kr Pages — 12개)

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

### F. Cloud Run 환경변수 (deploy.sh 경유)

| 서비스 | 주입 변수 | deploy.sh |
|--------|----------|-----------|
| monkos-portal | PROJECT_ID, LOCATION, GCS_BUCKET, ADMIN_UIDS + .env 17개 | monkos_AI/portal/deploy.sh |
| monkos-idphoto-kr | PROJECT_ID, LOCATION, GCS_BUCKET | monkos_AI/idphoto-kr/deploy.sh |
| monkos-idphoto-jp | PROJECT_ID, LOCATION, GCS_BUCKET | monkos_AI/idphoto-jp/deploy.sh |
| monkos-studio | (확인 필요) | monkos_AI/studio/deploy.sh |

### G. GCP 서비스 계정 (SA)

| SA | 이메일 | IAM 역할 | 용도 | 비고 |
|----|--------|---------|------|------|
| yong-a-orchestrator | yong-a-orchestrator@monkos.iam.gserviceaccount.com | **roles/editor** + aiplatform.user + storage.objectAdmin | 범용 | ⚠️ editor 과도 |
| monk-image-engine | monk-image-engine@monkos.iam.gserviceaccount.com | aiplatform.user + datastore.owner + datastore.user + iam.serviceAccountTokenCreator + storage.objectAdmin | Cloud Run 실행 SA | |
| Compute Engine default | 933456016842-compute@developer.gserviceaccount.com | (기본) | GCE 기본 | |

### H. 로컬 인증 파일

| 파일 | 경로 | 용도 |
|------|------|------|
| ADC | ~/.config/gcloud/application_default_credentials.json | gcloud 기본 인증 |
| ADC impersonated | ~/.config/gcloud/adc_impersonated.json | SA 임퍼소네이션 |

### I. D1 데이터베이스

| 이름 | 바인딩 위치 |
|------|------------|
| monk-db | 루트 wrangler.toml |
| monk-services-db | cloudflare-workers wrangler.toml |

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
| yong-a-orchestrator에 roles/editor 부여 | 🔴 높음 | 최소 권한으로 축소 필요 |
| CF Dashboard에 SA JSON 문자열 직접 저장 | 🟡 중간 | 현재 CF 표준 방식. 대안 제한적 |
| .env 파일 4대 디바이스 수동 동기화 | 🟡 중간 | GitHub Secrets 도입 시 개선 |

---

## 3. GitHub Secrets (gdsajin-byte/monk_project)

> 2026-05-11 등록 완료. `gh secret list`로 확인 가능.

| GitHub Secret 이름 | 값 소스 | SA | 등록일 | 용도 |
|--------------------|---------|-----|--------|------|
| GCP_SA_KEY | yong-a-orchestrator 키 JSON → base64 | yong-a-orchestrator | 05-11 | Actions에서 GCP 인증 |
| GA4_PROPERTY_ID | `521406894` | — | 05-11 | 일일 보고서 |
| GSC_SITE_URL | `sc-domain:monkos.ai` | — | 05-11 | 일일 보고서 |
| TELEGRAM_BOT_TOKEN | monkos_AI/.env TELEGRAM_BOT_TOKEN | — | 05-11 | 텔레그램 알림 허브 |
| TELEGRAM_CHAT_ID | monkos_AI/.env TEAM_CHAT_ID | — | 05-11 | 텔레그램 팀 채팅 |

### 향후 확장 (배포 자동화 시)

| GitHub Secret 이름 | 값 소스 | 용도 |
|--------------------|---------|------|
| CF_API_TOKEN | monkos_AI/.env | CF 배포 자동화 |

---

## 4. 변경 시 체크리스트

1. 키 추가/변경 → 해당 `.env` 갱신
2. deploy.sh `--update-env-vars` 반영 여부 확인
3. CF 서비스면 Dashboard 수동 등록
4. **이 문서(SECRET_INVENTORY.md) 갱신** ← 정본
5. `.gitignore` 패턴 확인
6. GitHub Secrets 해당 시 등록/갱신
7. `credentials_inventory.md`는 이 문서로 대체됨 (구본)
