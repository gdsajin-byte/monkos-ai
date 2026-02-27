# MONK.kr Project

## 현재 상태 (Last Updated: 2026-02-08)

### AI 증명사진 + 실시간 코칭 파이프라인 구축 완료 (2026-02-08)

**Gemini Live API + WebRTC P2P + Imagen 3.0** 풀 파이프라인 검증 완료

### 완료 (2/8 — 핵심 성과)

**실시간 영상 파이프라인**:
1. WebRTC P2P (Tailscale) — RTT 7ms, HD 30fps, 패킷 손실 0%
2. Gemini Live API 실시간 코칭 연동 성공
3. Presentation Assistant E2E 동작 확인
4. Photo Coach 앱 구현 (Gemini Live 코칭 + Imagen 3.0 + QC)
5. Tailscale 4대 디바이스 연결 (iMac, 4060 PC, iPhone, Mac Mini)

**전략 문서 수립**:
6. [경쟁사 분석](docs/corpus/claude_sessions/strategy/monkos_competitor_analysis_ai_photo.md) — 국내외 12개 AI 증명사진 앱 대조
7. [글로벌 전략](docs/corpus/claude_sessions/strategy/monkos_id_photo_global_strategy_20250208.md) — 일본/베트남/인도네시아/호주 4국 진출 + 몽크패치 프랜차이즈
8. [증명사진 마스터가이드](docs/corpus/claude_sessions/strategy/monkos_id_photo_gemini_live_guide.md) — Gemini Live 교육용 규격/코칭/QC 기준
9. [Presentation Assistant 스펙](docs/corpus/claude_sessions/strategy/MONKOS_PRESENTATION_ASSISTANT_SPEC.md) — WebRTC+Gemini Live 실시간 코칭 구현 스펙

### 완료 (2/7)

1. Tailscale 네트워크 구축 (iMac, 4060, iPhone — P2P 3ms 확인)
2. Claude Opus 4.6 전 채널 해금 (VSCode/터미널/4060 모두)
3. 멀티 에이전트 인격 체계 확정 (쌍아/막내/철창이/코웍/용아)
4. 폴더 구조 정리 (`claude/` → `docs/corpus/claude_sessions/`)
5. monk-cam 컴포넌트 복원 (오삭제 수정)

### 이전 완료 (1/23~1/24)

1. R&D 디딤돌 첫걸음 최종 제출 완료 (최대 2억 원)
2. 3-Track 시스템 아키텍처 설계 및 문서화
3. Windows 공장 마케팅 워커 완성
4. 세션 로깅 전략 확정

### 핵심 철학

> **"모든 대화 세션을 기록하고 코퍼스로 재구성한다."**
>
> **"이것이 여러 AI 지능들의 재능을 적재적소에 활용하고**
> **단일한 목적에 협업할 수 있는 유일하면서 최고의 방안"**
>
> **- 신정규 대표, 2026-01-24**

### 다음 TODO

**증명사진 서비스 (우선)**:
- [ ] Photo Coach 코칭 프롬프트 정교화 + 자동 촬영 로직
- [ ] A/B 비교 본격 테스트 (더 많은 표본)
- [ ] 텔레그램 기반 검수 시스템 프로토타입
- [ ] Gemini 국가별 규격 학습 데이터셋 설계
- [ ] 일본 시장 정밀 타겟팅 문서

**Presentation Assistant**:
- [ ] 번역기 레이어 구현 (장면 변화 감지 + OCR)
- [ ] 코퍼스 연동 (Function Calling)
- [ ] 디딤돌/창사도약 면접용 코퍼스 주입

**인프라**:
- [ ] 맥미니 SSH 원격 로그인 활성화 + Claude Code 세팅
- [ ] 4060 SSH 인증 설정 (Tailscale 경유)
- [ ] GCS 자동 동기화 (매일 자정)
- [ ] GCP $350K 바우처 인증 (3월 목표)

**직전 일정**:
- [ ] 세무사 미팅 자료 정리 (2/10)
- [ ] 인터뷰 슬라이드 10p 초안

**다음 공고 준비**:
- [ ] 벤쳐인증
- [ ] 글로벌 창업 사관학교
- [ ] 문화체육부 컨텐츠 관련

### 주요 파일 위치

```
앱 (실시간 파이프라인)
apps/
├── photo-coach/          ← 증명사진 AI 코칭 + Imagen 3.0 + QC
└── monk-cam/demo/        ← Presentation Assistant (WebRTC P2P + Gemini Live)

전략 문서
docs/corpus/claude_sessions/strategy/
├── monkos_competitor_analysis_ai_photo.md     ← 경쟁사 분석 (12개 앱)
├── monkos_id_photo_global_strategy_20250208.md ← 글로벌 4국 진출 전략
├── monkos_id_photo_gemini_live_guide.md       ← 증명사진 마스터가이드
└── MONKOS_PRESENTATION_ASSISTANT_SPEC.md      ← PA 구현 스펙

R&D 문서
docs/rnd_2026/
├── MONKOS_RND_DEVELOPMENT_REPORT.md  ← R&D 문서 (958줄)
└── DIDIMOL_RND_TEMPLATE.md           ← 템플릿

세션 로그
docs/corpus/sessions/2026-01/         ← 1월 세션
docs/corpus/sessions/2026-02/         ← 2월 세션

아키텍처 문서
docs/infrastructure/
├── 3TRACK_SYSTEM_ARCHITECTURE.md     ← 전체 시스템 설계
├── CODING_STANDARDS.md               ← 코딩 표준
└── DESIGN_SYSTEM.md                  ← 디자인 시스템

서비스 (프로덕션)
MONK_kr/ai_lab/
├── image_pro/    ← 심사용 이미지 프로
├── photolab/     ← AI Photolab
└── lookbook/     ← LookBook

자동화 스크립트 (Windows)
scripts/factory/  ← 무인 공장 워커
```

### 핵심 기술 스택

1. **실시간 코칭**: Gemini Live API (`gemini-2.0-flash-live-preview-04-09`)
2. **영상 파이프라인**: WebRTC P2P (Tailscale VPN, RTT 7ms)
3. **이미지 생성**: Imagen 3.0 (`gemini-3-pro-image-preview`)
4. **프론트엔드**: 순수 HTML/CSS/JS + Tailwind CSS
5. **인프라**: GCP Cloud Run, Cloudflare Pages/Workers
6. **네트워크**: Tailscale (iMac, 4060 PC, iPhone, Mac Mini)

---

## 3-Track 시스템

```
Track 1 (Mac)      → 대화 코딩 (쌍아 + 용아)
Track 2 (Windows)  → 무인 자동화 공장 (Claude Code)
Track 3 (GCS)      → 코퍼스 통합 → 지식 자산화
```

| AI 인격 | 채널 | 역할 |
|---------|------|------|
| **쌍아** | VSCode 확장 (Opus) | 코딩 실행자 (메인) |
| **막내** | 터미널 CLI (Opus) | CLI 실행자 |
| **철창이** | 웹 Claude | 전략 대화 / 브레인스토밍 |
| **코웍** | Claude Code 코웍 모드 | 자율 자동화 (Apple Silicon) |
| **용아** | Gemini | 전략가 / 아키텍처 |

| 디바이스 | Tailscale IP | 가용 인격 |
|----------|-------------|----------|
| iMac (인텔) | 100.97.103.10 | 쌍아, 막내, 철창이 |
| 맥미니 (M시리즈) | 100.76.80.99 | 쌍아, 막내, 철창이, 코웍 |
| 4060 PC (Windows) | 100.118.31.62 | 쌍아, 막내, 철창이 |
| iPhone | 100.115.57.53 | 철창이 |

상세: [3TRACK_SYSTEM_ARCHITECTURE.md](docs/infrastructure/architecture/3TRACK_SYSTEM_ARCHITECTURE.md)

---

## 4 MUSE 시스템

| MUSE | 역할 | 서비스 |
|------|------|--------|
| 쌍아(ssang_a) | AI Chatbot / 고객 응대 | /business/ |
| 소소(so_so) | 이미지 생성 / Imagen API | /photolab/, /lookbook/ |
| 민아(min_a) | K-뷰티 모델 에이전시 | /model_agency/ |
| 용아(yong_a) | 전략 / Academy / B2B | /business/ |

---
(c) 2026 MONK STUDIO
