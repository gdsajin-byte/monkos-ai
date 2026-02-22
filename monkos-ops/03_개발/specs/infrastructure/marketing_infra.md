# 마케팅 자동화 인프라 기술명세서

**작성일**: 2026-02-18
**작성자**: iMac/막내3
**상태**: 운영 중 (Phase 1)

---

## 1. 인프라 구성도

```
┌─────────────────────────────────────────────────┐
│  n8n (워크플로우 엔진)                            │
│  호스트: 4060 WSL Docker                         │
│  URL: http://100.118.31.62:5678 (Tailscale)      │
│  버전: v2.8.3 / Docker 28.2.2                    │
│  재시작: unless-stopped (서버 리부팅 시 자동 기동) │
│  볼륨: n8n_data:/home/node/.n8n (영구 저장)       │
│  타임존: Asia/Seoul                               │
├─────────────────────────────────────────────────┤
│  포트포워딩                                       │
│  100.118.31.62:5678 → 127.0.0.1:5678 (netsh)    │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  자동화 파이프라인                                 │
│                                                   │
│  Schedule Trigger (매일 정해진 시간)               │
│       ↓                                           │
│  Gemini API (콘텐츠 생성 — 채널별 톤/길이/언어)   │
│       ↓                                           │
│  Switch (채널 분기)                                │
│       ├→ X (일본) — OAuth1, 280자 일본어           │
│       ├→ Instagram (한국) — Meta Graph API         │
│       ├→ Instagram (일본) — Meta Graph API         │
│       └→ Telegram 알림 (포스팅 완료 통보)          │
└─────────────────────────────────────────────────┘
```

---

## 2. 계정 체계

### 이메일
| 주소 | 전달 대상 | 용도 | 상태 |
|------|----------|------|------|
| `info@monkos.ai` | `gdsajin@gmail.com` | SNS 계정 통합 이메일 | ✅ Active |

- **방식**: Cloudflare Email Routing (무료)
- **DNS**: MX 3개 + TXT(DKIM, SPF) 설정 완료
- **도메인**: monkos.ai (Cloudflare DNS)

### SNS 계정
| 플랫폼 | 계정명 | 유형 | 이메일 | 상태 |
|--------|--------|------|--------|------|
| **X (Twitter)** | @MONKOS_AI | — | — | ✅ API 연동 완료 |
| **Instagram** | monkos.ai | 비즈니스 | info@monkos.ai | ✅ 계정 생성 |
| **Facebook** | MONKOS (페이지) | 비즈니스 페이지 | 개인 계정 하위 | ✅ 페이지 생성 |

### 개발자 계정
| 플랫폼 | 상태 | 비고 |
|--------|------|------|
| **X Developer** | ✅ 등록 완료 | Pay Per Use, 크레딧 충전 완료 |
| **Meta Developer** | ❌ 미등록 | 인스타 API 연동 시 필요 |
| **네이버 Developer** | ✅ 기존 앱 있음 | 블로그 글쓰기 API 폐지 (2020.05) |

---

## 3. API 연동 현황

### X (Twitter) — ✅ 완료
| 항목 | 값 |
|------|-----|
| API 버전 | Twitter API v2 |
| 인증 방식 | OAuth1 (Consumer Key + Access Token) |
| 엔드포인트 | `POST https://api.twitter.com/2/tweets` |
| n8n 노드 | HTTP Request + Generic Credential (OAuth1 API) |
| 테스트 | 트윗 게시 2건 성공 |
| 과금 | Pay Per Use (크레딧 충전 완료) |

**n8n 기본 X 노드 미사용 이유**: OAuth2만 지원 + localhost 콜백 문제 → HTTP Request + OAuth1이 더 유연

### Instagram — ⏳ 진행 중
| 항목 | 값 |
|------|-----|
| API | Instagram Graph API (Meta) |
| 인증 방식 | OAuth2 (Facebook Login) |
| 전제 조건 | Meta 개발자 앱 등록 + 비즈니스 계정 + 페이지 연결 |
| 현재 상태 | 계정/페이지 생성 완료, API 연동 미착수 |

### 네이버 블로그 — ❌ 불가
| 항목 | 값 |
|------|-----|
| 상태 | 글쓰기 API **2020년 5월 폐지** |
| 사유 | 광고성 블로그 대량 생산 방지 |
| 대안 | Gemini 글 생성 → 수동 복붙 / Puppeteer 자동화 (리스크 있음) |

---

## 4. n8n 운영 정보

### 접속
```
브라우저: http://100.118.31.62:5678
Tailscale 네트워크 내부에서만 접속 가능
```

### Docker 관리
```bash
# 상태 확인
docker ps | grep n8n

# 로그
docker logs n8n --tail 50

# 재시작
docker restart n8n

# 중지/시작
docker stop n8n
docker start n8n
```

### 데이터 백업
```bash
# 볼륨 위치 확인
docker volume inspect n8n_data

# 백업 (tar)
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n_backup_$(date +%Y%m%d).tar.gz /data
```

### Cloud Run (레거시)
- 서비스명: `monk-n8n`
- 상태: min-instances 0 (대기 모드, 과금 거의 없음)
- 삭제 예정 (작가님 승인 후)

---

## 5. 채널 전략 (확정)

### 우선순위
| 순번 | 채널 | 시장 | 상태 |
|------|------|------|------|
| 1 | X (Twitter) | 일본 | ✅ 완료 |
| 2 | Instagram | 한국 | ⏳ 계정 완료, API 미연동 |
| 3 | Instagram | 일본 | ❌ 미착수 |
| 4 | 네이버 블로그 | 한국 | ❌ API 폐지, 대안 검토 |
| 5 | 유튜브 | 공통 | ❌ 별도 세팅 필요 |
| 6 | 틱톡 | 공통 | ❌ 미착수 |

### 채널 총 9개 (한국 4 + 일본/글로벌 5)
- **한국**: 네이버 블로그, 인스타그램, 유튜브, 틱톡
- **일본/글로벌**: X, Tistory(구글SEO), 인스타그램, 유튜브, 틱톡

---

## 6. 자동화 워크플로우 설계

### 일일 포스팅 (Phase 1)
```
Schedule Trigger (매일 10:00 KST)
  → Gemini API: 콘텐츠 시드 → 채널별 변환
    → X: 일본어 280자 + 해시태그
    → Instagram: 이미지 + 캡션 + 해시태그
  → Telegram: 포스팅 완료 알림
```

### 비포/애프터 공유 (Phase 2)
```
Manual Trigger (이미지 업로드)
  → Gemini API: 이미지 분석 → 캡션 생성
  → 전 채널 동시 발행
```

### 주간 리포트 (Phase 3)
```
Schedule Trigger (매주 월요일 09:00)
  → 각 채널 API: 통계 수집
  → Google Sheets: 데이터 적재
  → Telegram: 주간 요약 보고
```

---

## 7. 비용 구조

| 항목 | 월 비용 | 비고 |
|------|---------|------|
| n8n (4060 Docker) | $0 | 셀프호스트, 이미 가동 중인 서버 |
| Cloudflare Email | $0 | Email Routing 무료 |
| X API | 사용량 과금 | Pay Per Use, 소량 시 ~$5 |
| Meta API | $0 | 무료 (Graph API) |
| Gemini API | ~$5 | 콘텐츠 생성 (Vertex AI) |
| **월 합계** | **~$10** | |

---

## 8. 장애 이력

| 날짜 | 이슈 | 원인 | 해결 |
|------|------|------|------|
| 2/18 | n8n Cloud Run "Starting up" 무한 대기 | SQLite 마이그레이션 반복 (컨테이너 휘발) | 4060 Docker로 이전 |
| 2/18 | X API 401 Unauthorized | 스크린샷 OCR 키 오류 (`l`/`I` 혼동) | 키 직접 복사로 정정 |
| 2/18 | X API 402 CreditsDepleted | Pay Per Use 크레딧 없음 | 크레딧 충전 |

---

## 9. 프로젝트 폴더 구조

```
marketing/
├── README.md                    ← 개요
├── docs/
│   ├── CHANNEL_STRATEGY.md      ← 채널 전략
│   └── MARKETING_INFRA_SPEC.md  ← 이 문서 (기술명세서)
├── n8n/
│   ├── docker-compose.yml       ← Docker Compose 설정
│   ├── install_n8n.sh           ← 설치 스크립트
│   └── workflows/               ← 워크플로우 JSON 백업
├── content/
│   ├── blog/
│   ├── instagram/
│   ├── youtube/
│   └── x/
└── scripts/                     ← 자동화 스크립트
```

---

*최종 업데이트: 2026-02-18 16:29 KST*
