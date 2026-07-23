> 🔀 **[2026-07-24 리다이렉트] 이 문서는 구세대(2026-02-19) 참조본이다 — 정본 아님.**
> 시크릿 정본 = GCP Secret Manager, 메타 정본 = [SECRET_INVENTORY.md](SECRET_INVENTORY.md), 인지 = `scripts/secret.sh map`.
> 본 문서는 읽기 전용 보존(삭제 지시 없음). 갱신 금지.

# MONKOS 인증 정보 인벤토리

> ⚠️ 이 문서에는 키 값을 절대 기재하지 않습니다. 위치와 용도만 기록합니다.
> 최종 업데이트: 2026-02-19

## 1. 중앙 저장소

### monkos_AI/.env (Cloud Run 환경변수 소스)
| 변수명 | 용도 | 사용처 |
|--------|------|--------|
| GEMINI_API_KEY | Google AI Studio — Imagen I2I 생성 | idphoto-kr, idphoto-jp |
| LINE_CHANNEL_ID | LINE 로그인 | portal |
| LINE_CHANNEL_SECRET | LINE 로그인 시크릿 | portal |
| KAKAO_REST_API_KEY | 카카오 로그인 | portal |
| KAKAO_CLIENT_SECRET | 카카오 로그인 시크릿 | portal |
| KAKAO_REDIRECT_URI | 카카오 리다이렉트 URL | portal |
| TOSS_SECRET_KEY | 토스페이먼츠 시크릿 | portal (KR 결제) |
| TOSS_WEBHOOK_SECRET | 토스 웹훅 검증 | portal |
| LEMONSQUEEZY_API_KEY | Lemon Squeezy API | portal (JP/글로벌 결제) |
| LEMONSQUEEZY_WEBHOOK_SECRET | Lemon Squeezy 웹훅 검증 | portal |
| TELEGRAM_BOT_TOKEN | CS 봇 @monkos_support_bot | portal |
| X_ACCESS_TOKEN | X/Twitter @MONKOS_AI | n8n 자동화 |
| X_ACCESS_TOKEN_SECRET | X OAuth 시크릿 | n8n |
| X_CONSUMER_KEY | X API 컨슈머 키 | n8n |
| X_CONSUMER_SECRET | X API 컨슈머 시크릿 | n8n |
| N8N_API_KEY | n8n 자동화 API | 4060 Docker |
| TX_API_KEY | D1 거래 원장 인증 | portal, MONK_kr |
| TX_API_URL | D1 거래 원장 엔드포인트 | portal, MONK_kr |
| CF_API_TOKEN | Cloudflare API 토큰 | DNS 관리 |
| CF_ZONE_ID | Cloudflare Zone ID (monkos.ai) | DNS 관리 |
| PROJECT_ID | GCP 프로젝트 ID | Cloud Run 전체 |
| LOCATION | GCP 리전 | Cloud Run 전체 |
| GCS_BUCKET | GCS 버킷명 | 스토리지 |

## 2. Cloudflare Dashboard 시크릿 (monk-kr Pages)
| 변수명 | 용도 |
|--------|------|
| GEMINI_API_KEY | Gemini API — Workers 전체 |
| KAKAO_CLIENT_ID | 카카오 OAuth (monk.kr) |
| KAKAO_CLIENT_SECRET | 카카오 OAuth 시크릿 |
| GOOGLE_CLIENT_ID | Google OAuth (monk.kr) |
| GOOGLE_CLIENT_SECRET | Google OAuth 시크릿 |
| GCP_PROJECT_ID | Vertex AI 프로젝트 |
| GCP_SERVICE_ACCOUNT_KEY | SA JSON 문자열 |
| GCS_BUCKET | GCS 버킷 |
| GCS_BACKUP_ENABLED | 백업 플래그 |
| TELEGRAM_BOT_TOKEN | 텔레그램 봇 |
| ADMIN_CHAT_ID | 관리자 채팅 ID |
| TX_API_KEY | D1 거래 원장 |

## 3. Cloud Run 환경변수 (deploy.sh 경유)
| 서비스 | 변수 수 | 소스 |
|--------|---------|------|
| monkos-portal | 17개 | monkos_AI/.env → deploy.sh |
| monkos-idphoto-kr | 3개 | monkos_AI/.env → deploy.sh |
| monkos-idphoto-jp | 3개 | monkos_AI/.env → deploy.sh |

## 4. OAuth 클라이언트 (Google Cloud Console)
| 클라이언트 | 용도 | 참조 위치 |
|-----------|------|-----------|
| 933456016842-... | Google OAuth (monkos.ai) | portal server.js, index.html |
| (CF Dashboard) | Google OAuth (monk.kr) | MONK_kr/functions/api/auth.js |

## 5. 서비스 계정
| 계정 | 용도 |
|------|------|
| monk-image-engine@monkos.iam.gserviceaccount.com | Cloud Run 실행 SA |
| (CF Dashboard SA JSON) | Vertex AI + GCS 접근 |

## 6. 외부 서비스 계정
| 서비스 | 용도 | 키 위치 |
|--------|------|---------|
| Lemon Squeezy | JP/글로벌 결제 | monkos_AI/.env |
| 토스페이먼츠 | KR 결제 | monkos_AI/.env |
| LINE | OAuth 로그인 | monkos_AI/.env |
| 카카오 | OAuth 로그인 | monkos_AI/.env + CF Dashboard |
| X (Twitter) | SNS 자동 포스팅 | monkos_AI/.env |
| Telegram | CS 봇 + 알림 | monkos_AI/.env + CF Dashboard |
| n8n | 워크플로우 자동화 | monkos_AI/.env |
| Firebase | MonkosChat (레거시) | 앱 번들 내 공개키 |

## 7. D1 데이터베이스
| 이름 | ID | 바인딩 위치 |
|------|-----|------------|
| monk-db | 6fe2a64b-... | 루트 wrangler.toml |
| monk-services-db | 1c88fa57-... | cloudflare-workers wrangler.toml |

---

## 키 추가/변경 시 체크리스트
1. `monkos_AI/.env`에 추가
2. 해당 서비스 `deploy.sh`에 `--update-env-vars` 추가
3. CF 서비스면 Dashboard에 수동 등록
4. 이 문서 업데이트
5. `.gitignore` 확인
