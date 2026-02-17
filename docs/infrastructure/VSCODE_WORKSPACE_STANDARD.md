---
type: spec
from: M1/쌍아
date: 2026-02-17 12:57 KST
status: active
tags: [vscode, workspace, infra, onboarding]
---

# VSCode 워크스페이스 표준 (전 디바이스 / 전 팀원 공통)

> VSCode를 **통합 운영 플랫폼**으로 활용한다.
> 에디터 = 캔버스 디스플레이, 사이드바 = AI 협업, 터미널 = 실행.

## 레이아웃 구조

```
┌─────────────┬──────────────────────────┬─────────────┐
│  좌 사이드   │      중앙 에디터          │  우 사이드   │
│             │                          │             │
│  쌍아/소넷이 │  탭: 코드 / 프리뷰 / 브라우저 │  용아        │
│  (Claude    │       무한 분할 가능       │  (Gemini    │
│   Code)     │                          │  Code Assist)│
│             │  ┌──────┬──────┐         │             │
│  채팅       │  │코드  │MD    │  ← 분할  │  Explorer   │
│  터미널     │  │      │Preview│         │  (스위치)    │
│             │  └──────┴──────┘         │             │
└─────────────┴──────────────────────────┴─────────────┘
```

### 역할 분담

| 영역 | 용도 | 조작 |
|------|------|------|
| **좌 사이드** | 쌍아(Claude Code) 채팅 + 터미널 | 기본 고정 |
| **중앙 에디터** | 코드 편집 + 프리뷰 + 브라우저 (캔버스) | 무한 분할, 탭 전환 |
| **우 사이드** | 용아(Gemini Code Assist) + Explorer 스위치 | 우클릭 전환 |

### 중앙 에디터 = 캔버스

에디터 영역에서 열 수 있는 프리뷰 유형:

| 파일 | 프리뷰 방법 | 단축키 | 용도 |
|------|------------|--------|------|
| `.md` | Markdown Preview | `Cmd+K V` (사이드) | 전략 보고서, 대시보드, Mermaid |
| `.html` | Simple Browser / Live Server | `Cmd+Shift+P` → Simple Browser | 웹 디자인 라이브 |
| `.pdf` | PDF Viewer (내장) | 탭에서 직접 열기 | 최종 아웃풋 확인 |
| 이미지 | Image Preview (내장) | 탭에서 직접 열기 | 디자인 확인 |

### 프리뷰 고정 방법 (Pin + Lock)

```
1. 프리뷰 열기: Cmd+K V (Markdown) 또는 Simple Browser
2. 프리뷰 탭 우클릭 → Pin Tab (고정)
3. Command Palette → "Markdown: Toggle Preview Locking" (잠금)
4. 이후 Claude가 파일 수정 → 프리뷰 자동 갱신 (300ms)
```

## 디바이스별 세팅

### 공통 (모든 디바이스)

프로젝트 폴더 clone 시 `.vscode/` 자동 적용:
- `settings.json` — 에디터, 프리뷰, 레이아웃
- `extensions.json` — 권장 확장 자동 설치 안내

### 내부 디바이스

| 디바이스 | 좌 사이드 AI | 우 사이드 AI | 용도 |
|----------|------------|------------|------|
| M1 (집 맥미니) | 쌍아 (Opus) | 용아 (Gemini) | 전략실 본부 |
| iMac (사무실) | 쌍아 (Opus) | 용아 (Gemini) | 전략실 메인 |
| 4060 (GPU 서버) | 소넷이 (Sonnet) | — | GPU 팩토리 |
| M2 (부스) | 소넷이 (Sonnet) | — | 현장 운용 |

### 팀원 디바이스 (향후)

```
팀원 온보딩 플로우:
1. 프로젝트 폴더 clone (git clone → .vscode/ 자동 포함)
2. 확장 설치 안내 자동 팝업 (extensions.json)
3. Claude Code 설치 + Sonnet 모드 배정
4. Tailscale 네트워크 참여 → 원격 협업 가능
5. Git 기반 보고/수신 체계 연동
```

**팀원 AI 배정:**
- **좌 사이드**: 소넷이 (Sonnet) — 코딩 + 실행
- **우 사이드**: 용아 (Gemini Code Assist) — 크로스체크
- **비용**: Sonnet = Opus 대비 ~1/5 비용, 팀원 배포에 최적

**보고/수신 체계:**
- Git push → 막내/소넷이 작업 결과 커밋
- Tailscale → 디바이스 간 직접 접속 (ssh)
- 세션 로그 → `docs/corpus/sessions/` 통일 포맷
- 텔레그램 → 긴급 알림/에스컬레이션

## 필수 확장 목록

### 핵심 (반드시 설치)

| 확장 | ID | 용도 |
|------|----|------|
| Claude Code | `anthropic.claude-vscode` | 좌 사이드 AI |
| Gemini Code Assist | `google.geminicodeassist` | 우 사이드 AI |
| Markdown Mermaid | `bierner.markdown-mermaid` | 프리뷰 Mermaid 렌더링 |
| Mermaid Syntax | `bpruber.mermaid-markdown-syntax-highlighting` | 에디터 Mermaid 하이라이팅 |
| Live Server | `ms-vscode.live-server` | HTML 라이브 프리뷰 |
| Prettier | `esbenp.prettier-vscode` | 코드 포맷팅 |
| ESLint | `dbaeumer.vscode-eslint` | JS 린팅 |

### 권장 (생산성)

| 확장 | ID | 용도 |
|------|----|------|
| GitLens | `eamodio.gitlens` | Git 히스토리 시각화 |
| Git Graph | `mhutchie.git-graph` | 브랜치 그래프 |
| Error Lens | `usernamehw.errorlens` | 인라인 에러 표시 |
| Tailwind CSS | `bradlc.vscode-tailwindcss` | Tailwind 자동완성 |
| Cloud Code | `googlecloudtools.cloudcode` | GCP 연동 |

## 운용 패턴

### 패턴 1: 전략 회의 (대시보드 모드)

```
중앙 에디터:
  탭1: dashboard.md (Markdown Preview, Pin + Lock)
  탭2: 세션 로그 (실시간 추적)

좌: 쌍아와 전략 대화
우: 용아에게 크로스체크 질문
```

### 패턴 2: 웹 개발 (라이브 코딩 모드)

```
중앙 에디터:
  좌분할: index.html (코드)
  우분할: Simple Browser (라이브 프리뷰)

좌: 쌍아에게 코드 수정 지시
우: 용아에게 디자인/UX 검토 요청
```

### 패턴 3: 아키텍처 설계 (문서 모드)

```
중앙 에디터:
  좌분할: ARCHITECTURE.md (에디터)
  우분할: Markdown Preview (Mermaid 다이어그램)

좌: 쌍아와 설계 논의
우: 용아에게 기술 검증
```

### 패턴 4: 막내 관제 (모니터링 모드)

```
중앙 에디터:
  탭1: 세션 로그 Preview (막내 작업 추적)
  탭2: git graph (커밋 추적)

좌: 쌍아 — 막내 지시서 작성
터미널: iTerm에서 막내 N대 병렬 운용
```

## 키보드 단축키

| 동작 | macOS | 용도 |
|------|-------|------|
| Markdown 프리뷰 (사이드) | `Cmd+K V` | .md 캔버스 열기 |
| Markdown 프리뷰 (탭) | `Cmd+Shift+V` | 현재 탭에서 프리뷰 |
| Simple Browser | `Cmd+Shift+P` → "Simple Browser" | HTML 라이브 |
| 에디터 분할 | `Cmd+\` | 좌우 분할 |
| 탭 전환 | `Cmd+1~9` | 에디터 그룹 전환 |
| 터미널 토글 | `` Ctrl+` `` | 하단 터미널 |
| Explorer 토글 | `Cmd+Shift+E` | 우측 파일 탐색 |
| Command Palette | `Cmd+Shift+P` | 모든 명령 |
