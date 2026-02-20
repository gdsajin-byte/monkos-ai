# MONK OS 운영 체제 조감도

**작성일**: 2026-02-20 11:04 KST
**작성자**: iMac/쌍아
**용도**: 전체 인프라·통신·데몬 체제를 한눈에 파악하는 단일 문서

---

## 1. 디바이스 인벤토리

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MONK OS — 5디바이스 체제                          │
├──────────┬──────────┬──────────┬──────────┬──────────────────────────┤
│   M1     │  iMac    │  4060    │   M2     │  iPhone                 │
│ Mac mini │  iMac    │ GPU서버  │ Mac mini │  모바일                  │
│  (집)    │ (사무실) │ (원격)   │ (사진관) │  (작가님)               │
│  M1칩    │ Intel    │ RTX4060  │  M2칩    │                         │
└──────────┴──────────┴──────────┴──────────┴──────────────────────────┘
```

| 디바이스 | 위치 | 칩/스펙 | OS | 역할 | Tailscale IP |
|----------|------|---------|-----|------|-------------|
| **M1** | 집 | Apple M1 | macOS | 본부 통제 센터 | `100.76.80.99` |
| **iMac** | 사무실 | Intel | macOS | 메인 워크스테이션 | `100.97.103.10` |
| **4060** | 원격 | RTX 4060 | Windows + WSL2 Ubuntu | GPU 팩토리 | `100.118.31.62` |
| **M2** | 몽크사진관 | Apple M2 | macOS | 와이프 운용 부스 | `100.93.220.17` |
| **iPhone** | 모바일 | — | iOS | 작가님 지휘용 | `100.115.57.53` |

---

## 2. Tailscale VPN 네트워크

```
                    ┌───────────────┐
                    │  Tailscale    │
                    │  Mesh VPN     │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
    │  macOS     │    │  Windows  │    │   iOS     │
    │ (3대)      │    │  + WSL    │    │           │
    ├───────────┤    ├───────────┤    ├───────────┤
    │ M1  .99   │    │ 4060 .62  │    │ iPhone    │
    │ iMac .10  │◄──►│ WSL2      │    │  .53      │
    │ M2   .17  │    │ Ubuntu    │    │ Termius   │
    └───────────┘    └───────────┘    └───────────┘
```

### SSH 접속 경로

| 출발 → 도착 | 명령/alias | 인증 | 비고 |
|-------------|-----------|------|------|
| M1 → 4060 | `ssh4060` | sshpass 기반 | `~/.bash_profile` 함수 |
| M1 → M2 | `sshm2` | SSH key | 계정 `mac` |
| iMac → 4060 | `ssh smuse73@100.118.31.62` | — | — |
| iPhone → any | Termius 앱 | SSH key | 긴급용 |

### 4060 SSH 주의사항 (Windows OpenSSH)
반드시 **4가지 전부** 맞아야 동작:
1. 방화벽: Tailscale IP only 허용
2. `administrators_authorized_keys` ACL 설정
3. Owner = SYSTEM
4. `sshd_config`: `PubkeyAuthentication yes` + `PasswordAuthentication yes`

---

## 3. 에이전트 배치도

```
M1 (집 — 본부 통제 센터)
├── VSCode ─── 전략실
│   ├── 쌍아 (Opus) — 전략 설계, 지시서 작성
│   └── 용아 (Gemini 3 Pro) — 아키텍처 자문 (읽기전용)
├── iTerm ─── 팩토리
│   ├── 막내 1~N (Opus, mk-c) — 자율 코딩, 풀 권한
│   └── 소넷이-M1 (Sonnet, mk-sd) — tmux 데몬
└── Termius ─── 원격 관제
    └── ssh4060, sshm2

iMac (사무실 — 메인 워크스테이션)
├── VSCode ─── 전략실
│   ├── 쌍아 (Opus) — 동일 역할
│   └── 용아 (Gemini 3 Pro) — 동일 역할
├── iTerm ─── 팩토리
│   ├── 막내 1~N (Opus, mk-c)
│   └── 소넷이-iMac (Sonnet, mk-sd) — 아카이브 데몬
└── 웹 ─── 철창이 (Claude 웹) — 전략 브레인스토밍

4060 (GPU 서버 — WSL2 Ubuntu)
├── VSCode Remote ─── 전략실
│   └── 쌍아 (Opus) — SSH 원격 접속
├── tmux ─── 데몬
│   ├── 소넷이-4060 (Sonnet, mk-sd) — 상시 모니터링
│   └── 막내 N대 (온콜) — 정밀 코딩, GPU 작업
└── 프로젝트 경로: /mnt/c/Users/smuse73/developer/monk_project

M2 (몽크사진관 부스)
├── 소넷이-M2 (Sonnet) — 상시 모니터링/유지보수
├── 막내 (온콜) — 필요시 투입
└── 텔레그램 보고 — 이슈 발생 시 작가님 알림

iPhone (모바일 지휘)
├── 철창이 (Claude 웹)
├── 텔레그램 — 알림 수신 / 긴급 명령
└── Termius — 긴급 SSH 접속
```

### 에이전트 정의표

| 이름 | 모델 | 실행 환경 | alias | 권한 | 역할 |
|------|------|-----------|-------|------|------|
| 쌍아 | Opus 4.6 | VSCode 확장 | — | 샌드박스 | 전략 설계, 지시서 작성, 코드 리뷰 |
| 용아 | Gemini 3 Pro | VSCode Code Assist | — | 읽기전용 | 아키텍처 자문, 코드 분석 |
| 막내 N | Opus 4.6 | iTerm 터미널 | `mk-c` | 풀 권한 | 자율 코딩, 빌드, dev 배포 |
| 소넷이 | Sonnet 4.6 | tmux 데몬 | `mk-sd` | 풀 권한 | 모니터링, 경량 자동화 |
| 철창이 | Claude 웹 | 브라우저 | — | 웹 전용 | 전략 브레인스토밍, 기획 |

### 핵심 흐름
```
작가님 → 쌍아(설계/지시서) → 작가님이 iTerm 토스 → 막내(자율 실행) → 완료 보고
```

---

## 4. tmux/데몬 체계

### CLI 단축 명령 (alias)

| alias | 명령 | 용도 |
|-------|------|------|
| `mk` | `cd ~/developer/monk_project && claude` | 기본 대화 |
| `mk-c` | `cd ... && claude --dangerously-skip-permissions` | 막내 자율 모드 |
| `mk-s` | `cd ... && CLAUDE_MODEL=sonnet claude` | 소넷이 대화 |
| `mk-sd` | tmux + sonnet + `--dangerously-skip-permissions` | 소넷이 데몬 |
| `mk-sa` | `tmux attach -t sonnet` | 소넷이 세션 접속 |
| `mk-sl` | `tmux list-sessions` | tmux 세션 목록 |
| `mk-sw` | tmux + `session_watcher.sh` | 워처 데몬 |
| `mk-mb` | tmux + `mailbox_watcher.sh` | 메일박스 워처 |
| `mk-mba` | `tmux attach -t mailbox` | 메일박스 접속 |
| `ssh4060` | `sshpass + ssh 100.118.31.62` | 4060 원격 |
| `sshm2` | `ssh mac@100.93.220.17` | M2 원격 |

### tmux 상시 세션

| 디바이스 | 세션명 | 프로세스 | 용도 | 상태 |
|----------|--------|---------|------|------|
| M1 | `sonnet` | 소넷이-M1 (mk-sd) | 모니터링, 경량 작업 | 상시 가동 |
| M1 | `watcher` | session_watcher.sh | 세션 로그 감시 | 상시 가동 |
| M1 | `mailbox` | mailbox_watcher.sh | 팀 우체통 양방향 전달 | 필요시 가동 |
| iMac | `sonnet` | 소넷이-iMac (mk-sd) | 아카이브 데몬 | 상시 가동 |
| 4060 | `sonnet` | 소넷이-4060 (mk-sd) | 모니터링, 에러 처리 | 상시 가동 |

### 4060 WSL tmux 진입 경로
```
ssh4060 → (Windows) → wsl → (Ubuntu) → tmux attach -t sonnet
```
- Node.js 18, Claude Code 설치 완료
- alias: `/root/.bashrc` (mk, mk-c, mk-s, mk-sd, mk-sa, mk-sl)

---

## 5. 통신 채널 현황 (10채널)

```
활성 ■■■■■ (5)    반활성 ■■ (2)    계획 ■ (1)    미착수 ■ (1)    사문화 ■ (1)
```

| # | 채널 | 방향 | 상태 | 용도 |
|---|------|------|------|------|
| CH-01 | **수발신 헤더** | 에이전트↔에이전트 | **활성** | 세션 내 통신 추적 |
| CH-02 | **완료 보고 (2규칙)** | 에이전트→작가님 | **활성** | ✅❌💡⏳📁🔀 보고 |
| CH-03 | **지시서** | 쌍아→막내 | **활성** | YAML 헤더 + 역할선언 + 작업내용 |
| CH-04 | **세션 로그** | 에이전트→아카이브 | **활성** | 1일1파일, append only |
| CH-05 | **git commit** | 에이전트→전원 | **활성** | 한국어 접두사 커밋 |
| CH-06 | **텔레그램 (AI→작가님)** | AI→작가님 | **반활성** | 긴급 알림 / 완료 통보 |
| CH-07 | **텔레그램 (작가님→AI)** | 작가님→AI | **반활성** | /쌍아 /막내 원격 지시 |
| CH-08 | **텔레그램 CS 봇** | 고객→MONKOS | **계획** | 1:1 CS / 리터치 접수 |
| CH-09 | **디스코드 야간 알림** | 4060→작가님 | **미착수** | GPU 작업 알림 |
| CH-10 | **work_queue.md** | 텔레그램→에이전트 | **사문화** | 지시서(CH-03)가 대체 |

---

## 6. 텔레그램 인프라

### 봇 정보
| 항목 | 값 |
|------|-----|
| 봇 계정 | `@monkos_factory_bot` |
| 웹훅 URL | `us-central1-monkos-3c6e4.cloudfunctions.net/telegramWebhook` |
| Firebase Functions | telegramWebhook, notifyWriter, getCommands, completeCommand |

### MONKOS LINE 공식 계정
| 항목 | 값 |
|------|-----|
| 계정 | MONKOS (@208xpvko) |
| Channel ID | 2009084819 |
| Webhook | 미설정 (Cloud Run 배포 후) |
| 용도 | 증명사진 결과 전송, 예약/결제 알림 |

### 텔레그램 명령어 체계
```
/쌍아 [명령]  → ssanga에게 전달
/막내 [명령]  → makne에게 전달
/용아 [명령]  → yonga에게 전달
/전체         → 전체 AI 상태 조회
/상태         → 봇 상태 확인
```

### 핵심 미비점
- 텔레그램 인프라가 **4060(Windows) 기준**으로 구축됨
- M1/iMac(Mac)에서 운용하려면 경로 수정 + Mac용 스크립트 필요
- `night_operator.py`, `command_bridge.js`, `notify.ps1` — 전부 Windows 경로 하드코딩

---

## 7. 팀 우체통 시스템

```
M1/iMac ←──mailbox_watcher.sh (30초 폴링)──→ M2 (와이프)
         teams/kku/outbox ←→ ~/kku/inbox
         teams/kku/inbox  ←→ ~/kku/outbox
```

| 폴더 | 방향 | 설명 |
|------|------|------|
| `teams/kku/outbox/` | 우리→와이프 | 보낼 메시지 |
| `teams/kku/inbox/` | 와이프→우리 | 받은 메시지 |
| `teams/kku/archive/` | — | 처리 완료 |
| `teams/han/` | 한송이 채널 | 동일 구조 |

- 와이프 M2: `100.93.220.17`, 계정 `mac`, `sshm2`
- 워처: `monkos-ops/scripts/mailbox_watcher.sh`
- alias: `mk-mb` (시작), `mk-mba` (접속)

---

## 8. 배포 체계

### CF Pages (monk.kr) — 정적 사이트
```
코드 → git push develop → (자동빌드 OFF) → 수동: wrangler pages deploy
```

| 명령 | 환경 | 도메인 |
|------|------|--------|
| `wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main` | Production | monk.kr |
| `wrangler pages deploy MONK_kr/ --project-name monk-kr` | Preview | *.monk-kr.pages.dev |

- **정본**: `MONK_kr/functions/` (루트 `functions/`는 symlink)
- **API Key**: `env.GEMINI_API_KEY` (CF Pages Secrets)
- **자동빌드**: OFF (2026-02-20 변경, 멀티에이전트 통제 불가 대응)

### Cloud Run (monkos.ai) — 서버 앱

| 서비스 | 디렉토리 | 도메인 | Cloud Run 이름 |
|--------|---------|--------|---------------|
| 포털 | `monkos_AI/portal/` | monkos.ai | monkos-portal |
| JP 증명사진 | `monkos_AI/idphoto-jp/` | idphoto-jp.monkos.ai | monkos-idphoto-jp |
| KR 증명사진 | `monkos_AI/idphoto-kr/` | idphoto-kr.monkos.ai | monkos-idphoto-kr |
| 이미지엔진 | — | image.monkos.ai | monk-image-engine |

```
배포: ./deploy.sh dev (develop 브랜치, 막내 가능)
      ./deploy.sh prod (작가님/쌍아만)
```

### 인증 하이브리드
| 방식 | 용도 | 비고 |
|------|------|------|
| Vertex AI ADC | Live 코칭 + QC + 포털 챗봇 | 서비스 계정 |
| Google AI Studio API Key | Imagen I2I 생성 | `monkos_AI/.env` → GEMINI_API_KEY |

---

## 9. 프로젝트 구조 (폴더 위상)

```
monk_project/
├── MONK_kr/          ★ 본진 (monk.kr, Cloudflare Pages)
│   ├── ai_lab/photolab/   → 프로덕션 증명사진 앱
│   └── functions/api/     → CF Workers API (photo, precheck, idgen, qc, coaching)
├── monkos_AI/        ★ 모바일 AI (monkos.ai, Cloud Run)
│   ├── portal/            → 포털 (Gemini 챗봇, 3개국어)
│   ├── idphoto-jp/        → 일본 증명사진
│   └── idphoto-kr/        → 한국 증명사진
├── monkos-ops/       ★ 운영 체계 (양쪽 공통 오케스트레이션)
│   └── scripts/           → mailbox_watcher, session_watcher
├── apps/             프로토타입/PoC
│   ├── photo-coach/       → Gemini Live 코칭 프로토타입
│   ├── monk-cam/demo/     → Presentation Assistant (WebRTC)
│   └── photolab-monkkr-mpa-0219/  → MPA 실험
├── docs/             문서 체계
│   ├── corpus/sessions/   → 세션 로그 (1일1파일)
│   ├── infrastructure/    → 전략·아키텍처·기술명세
│   └── monkos/            → 태스크 큐, 지시서
├── commands/         지시서 (레거시 경로, docs/monkos/TASK_*로 이전 중)
├── scripts/          유틸리티 스크립트
├── _scripts/         gitignore 대상 스크립트
└── teams/            팀 우체통 (kku/, han/)
```

---

## 10. Claude Max 멀티티어 운용

| 티어 | 모델 | 용도 | 실측 소비 |
|------|------|------|----------|
| Opus 쿼터 | Opus 4.6 | 쌍아 + 막내 (워크스테이션) | 하루 3대 병렬 → 주간 10% |
| Sonnet 쿼터 | Sonnet 4.6 | 소넷이 데몬 + 와이프/한송이 | 2대 상주 → 주간 1% |
| 온디맨드 $50 | — | Sonnet 초과 시 자동 과금 | 안전망 |

- 소넷이 경량화 효과: 94% 컨텍스트 절감 (50KB→3KB)
- TOS: 공식 CLI + 구독 쿼터 범위 내 사용은 회색지대 (서드파티만 차단)

---

## 11. 네트워크 토폴로지 전체도

```
                         ┌─────────────────┐
                         │   GitHub        │
                         │ (monk_project)  │
                         └────────┬────────┘
                                  │ git push/pull
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────┴─────┐ ┌────┴────┐ ┌─────┴─────┐
              │    M1     │ │  iMac   │ │   4060    │
              │  (본부)   │ │ (사무실)│ │(GPU/WSL)  │
              └─────┬─────┘ └────┬────┘ └─────┬─────┘
                    │            │             │
              ┌─────┴────────────┴─────────────┴─────┐
              │          Tailscale VPN Mesh           │
              └─────┬────────────┬─────────────┬─────┘
                    │            │             │
              ┌─────┴─────┐ ┌───┴────┐  ┌─────┴─────┐
              │    M2     │ │ iPhone │  │ Cloudflare│
              │ (사진관)  │ │(모바일)│  │  (CDN)    │
              └───────────┘ └────┬───┘  └─────┬─────┘
                                 │            │
                           ┌─────┴─────┐ ┌───┴────────┐
                           │ Telegram  │ │  monk.kr   │
                           │   Bot     │ │ monkos.ai  │
                           └───────────┘ └────────────┘
                                              │
                                        ┌─────┴─────┐
                                        │ GCP Cloud │
                                        │   Run     │
                                        └───────────┘
```

---

## 12. 오늘의 인프라 변경 요약 (2026-02-20)

| 변경 | 전 | 후 | 영향 |
|------|---|---|------|
| 프로젝트 경로 | `monk_project ` (공백) | `monk_project` | 전 디바이스 (M1 완료, iMac 완료, 4060 진행중) |
| CF Pages 자동빌드 | ON (push=배포) | **OFF** (수동만) | monk.kr 배포 통제 회복 |
| develop→main 격차 | 56커밋 | **merge 진행중** (4060) | main 브랜치 최신화 |
| photolab QC | 있음 | **제거** | 생성→바로 결과 (리소스 절감) |
| photolab 구조 | SPA | **MPA 6페이지** | index/prep/camera/result/thankyou/options |

---

*이 문서는 시점 스냅샷입니다. 인프라 변경 시 갱신 또는 신규 날짜 버전 발행.*
