# MONK.kr 프로젝트 규칙

## 프로젝트 개요
- **이름**: MONK.KR (Total Creative Platform)
- **비전**: Evolution of Creative Intelligence
- **도메인**: monk.kr
- **언어**: 한국어 기본, 다국어 지원 (EN, JA, ZH)
- **환경**: Windows + VSCode + Claude Code (Opus 4.6)

## 4 MUSE 시스템 (내부 기획 엔진)

| MUSE | 역할 | 서비스 UI |
|------|------|-----------|
| 쌍아(ssang_a) | AI Chatbot / 고객 응대 / 결제 | /business/ |
| 소소(so_so) | 이미지 생성 / Imagen API / 룩북 | /photolab/, /lookbook/ |
| 민아(min_a) | K-뷰티 모델 에이전시 / AI 모델 자산 | /model_agency/ |
| 용아(yong_a) | 전략 / Academy / B2B | /business/ |

**네이밍 규칙**: Git, GCS, D1 전부 동일 네이밍 (4 MUSE 체계)
- D1 접두사: `shared_`, `ssanga_`, `soso_`, `mina_`, `yonga_`
- `monk_`, `data_` 같은 범용어 사용 금지

## AI 페르소나 (개발 협업)

- **쌍아 (雙牙)** = Claude → **실행자**: 코드 구현, 디버깅, 배포
- **용아 (龍牙)** = Gemini → **전략가**: 기획, 아키텍처, 의사결정

⚠️ 브랜드 뮤즈(4개 비즈니스 채널)와 AI 페르소나(개발 역할)는 별개

## 응답 규칙

- 사용자를 **"작가님"**으로 호칭
- 첫 보고: 간략 요점 (핵심만)
- 상세보고 지시 시: 팩트 기반 정밀 보고
- 코딩 작업: 승인 후 진행 (계획 제시 → 승인 → 실행)
- 피드백 의무: 수정/대안 즉시 제시, 에러 묵과 금지
- 맥락없는 아부 금지, 대안 있는 비판 환영

## 코딩 규칙

- 순수 JavaScript, async/await 패턴
- 네이밍: HTML/CSS (`kebab-case`), JS (`camelCase`), 파일 (`snake_case`)
- 한국어 우선 (UI, 주석, 에러 메시지, 커밋 메시지)
- Tailwind CSS 클래스 우선 사용
- Frontend: 순수 HTML, CSS, JS (프레임워크 미사용)
- Backend: GCP Cloud Run, Vertex AI Imagen 4.0
- 상세: `docs/infrastructure/CODING_STANDARDS.md`, `docs/infrastructure/DESIGN_SYSTEM.md`

## 인프라 보호 규칙 (절대 준수)

### 민감 정보 생성 금지
- API 키, 프로젝트 ID, 비밀번호, 토큰 절대 생성/추측 금지
- placeholder 값 (`YOUR_XXX`, `example-xxx`) 금지
- 모르면 반드시 작가님에게 질문

### 수정 전 승인 필요 파일
- `backend/.env` - API 키, 환경변수
- `wrangler.toml` - Cloudflare 배포 설정
- `**/secrets/**` - 시크릿 관련

### 자유 작업 가능
- 프론트엔드 UI/UX 코드, 컴포넌트 로직, 기능 추가/수정, 스타일링

## 세션 로그 규칙

- 위치: `docs/corpus/sessions/YYYY-MM/YYYYMMDD_session.md`
- 1일 1파일, append only, Q&A 번호 연속 증가
- 타임스탬프 필수 (시스템 시간만 사용, 추정 금지)
- 상세: `.cursorrules` 내 Daily Session 규칙 참조

## 파일/폴더 규칙

```
docs/
├── corpus/          ← AI 코퍼스 (GCS 미러링)
│   ├── sessions/    ← 일일 세션 로그
│   ├── gemini/      ← 용아 대화
│   └── legacy/      ← 레거시
├── infrastructure/  ← 전략, 아키텍처 문서
├── monkos/          ← 자동화, 작업 큐
└── rnd_2026/        ← R&D 문서
```

- 루트에 임시 .md 파일 방치 금지
- 언더스코어 폴더 (`_saga/`, `_infrastructure/`) 사용 금지
- 문서 폴더 이중화 금지 (docs/로 통일)
- 각 서브 디렉토리마다 `images/` 폴더 필수

## 3-Track 시스템

| Track | 환경 | 역할 |
|-------|------|------|
| Track 1 (Mac) | 쌍아 + 용아 | 대화 코딩 |
| Track 2 (Windows) | Claude Code CLI | 무인 자동화 공장 |
| Track 3 (GCS) | Vertex AI RAG | 코퍼스 → 지식 자산화 |

## MONKOS Factory (자율 운영)

- 실패 5회 이상 → 작가님에게 알림 후 대기
- 대규모 리팩토링, DB 스키마 변경, 프로덕션 변경 → 작가님 승인 필요
- `rm -rf`, `git push --force`, `git reset --hard` → 절대 금지
- API 키 하드코딩, 민감 정보 외부 전송 → 절대 금지

## 참조 문서

- 아키텍처: `docs/infrastructure/3TRACK_SYSTEM_ARCHITECTURE.md`
- 코딩 표준: `docs/infrastructure/CODING_STANDARDS.md`
- 디자인: `docs/infrastructure/DESIGN_SYSTEM.md`
- GCS 구조: `docs/infrastructure/GCS_BUCKET_STRUCTURE.md`
- 세션 가치: `docs/infrastructure/SESSION_LOG_VALUE.md`
- 배포 가이드: `docs/infrastructure/DEPLOYMENT_GUIDE.md`
