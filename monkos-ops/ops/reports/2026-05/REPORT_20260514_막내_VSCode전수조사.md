---
type: report
date: 2026-05-14
device: iMac
agent: 막내1
subject: VSCode 최신 업데이트 전수조사 + MONK 도입 인사이트
status: 완료
---

# VSCode 전수조사 보고서 (2025-12 ~ 2026-05)

> **[2026-05-14 11:30 KST]** iMac/막내1 작성
> 지시서: `ORDER_20260514_iMac쌍아_막내_VSCode전수조사_기능셋업인사이트.md`

---

## 1. 요약 (10줄 이내)

- **VSCode 1.120.0** (2026-05-13 릴리즈) 가동 중. 6개월간 **13개 버전** (1.108→1.120) 릴리즈.
- **1.111부터 주간 릴리즈 전환** — 월간→주간으로 전환하여 AI 기능 반복 속도 가속.
- **핵심 변화축**: ① 에이전트 퍼스트 아키텍처 (Agents Window, Autopilot, 멀티에이전트 병렬) ② MCP 생태계 확장 (샌드박싱, CLI 지원, MCP Apps) ③ BYOK 모델 관리 ④ 보안 강화 (터미널 샌드박싱, 커맨드 리스크 평가, 네트워크 도메인 필터링).
- **현재 MONK 환경**: 확장 15개(매우 경량), 스니펫/프로파일 미활용, `code` CLI 미등록.
- **Claude Code 확장 2.1.141** 가동 중이며, VSCode 네이티브 Claude 에이전트 지원(1.109~)과 시너지 가능.
- **즉시 적용 가능한 액션 6건** 식별 (섹션 6 참조).

---

## 2. VSCode 코어 주요 변화 (릴리즈별)

### 2.1 1.108 (2025-12) — Agent Skills + 터미널 대개편

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **Agent Skills** | `.claude/skills/` 자동 감지. 도메인 지식 패키징 | ⭐⭐⭐ 이미 활용 중 |
| **Git Worktrees** | Source Control에서 워크트리 생성/관리 UI | ⭐⭐ 막내 병렬 작업 |
| **터미널 IntelliSense** | Ctrl+Space 트리거 방식으로 전환 | ⭐ |
| **터미널 커스텀 글리프** | ~800자 지원 (powerline, braille, box drawing) | ⭐ |
| **터미널 자동 승인** | 안전한 git/ripgrep/sed 명령 자동 승인 규칙 | ⭐⭐ |
| **프로파일 드래그 임포트** | `.code-profile` 파일 드래그&드롭 | ⭐⭐ |
| **Copy Breadcrumbs Path** | 브레드크럼 경로 클립보드 복사 | ⭐ |
| **스니펫 snakecase/kebabcase** | 변환 지원 추가 | ⭐ |

### 2.2 1.109 (2026-01) — 멀티에이전트 플랫폼 선언

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **Claude 에이전트 네이티브** | Claude Agent SDK가 VSCode 1급 시민으로 편입 | ⭐⭐⭐ |
| **멀티에이전트 세션** | 로컬/백그라운드/클라우드 세션 병렬 관리 뷰 | ⭐⭐⭐ |
| **Agent Hooks** | PreToolUse, PostToolUse 등 라이프사이클 훅 | ⭐⭐⭐ |
| **Skills → Slash Commands** | 스킬이 `/` 명령으로 GA | ⭐⭐⭐ 이미 활용 중 |
| **Message Steering & Queueing** | 실행 중 후속 메시지 전송 (대기열/방향전환/중단) | ⭐⭐ |
| **MCP Apps** | MCP 서버가 채팅 내 인터랙티브 시각화 렌더링 | ⭐⭐ |
| **Mermaid 다이어그램** | 채팅 내 플로차트/시퀀스 다이어그램 렌더링 | ⭐⭐ |
| **Thinking Tokens** | Claude 모델 사고 과정 접이식/상세 표시 | ⭐⭐ |
| **터미널 샌드박싱** | macOS/Linux — 에이전트 명령의 파일/네트워크 제한 | ⭐⭐⭐ |

### 2.3 1.110 (2026-02) — 웹 에이전트 + Edit Mode 폐기

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **웹 Agents 경험** | 브라우저에서 Agents 접근 가능 | ⭐ |
| **통합 브라우저 영구화** | 세션 간 통합 브라우저 유지 | ⭐⭐ |
| **Edit Mode 폐기** | Deprecated (1.125에서 완전 제거 예정) | ⚠️ 주의 |

### 2.4 1.111 (2026-03-09) — 주간 릴리즈 전환 + Autopilot

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **주간 릴리즈** | 월간→주간 전환 (AI 기능 속도 대응) | 📌 정책 변화 |
| **Autopilot (Preview)** | 에이전트 자율 실행 모드 (task_complete까지 반복) | ⭐⭐⭐ |
| **Agent 권한 피커** | Default/Bypass/Autopilot 세션별 설정 | ⭐⭐⭐ |
| **Agent-Scoped Hooks** | `.agent.md` YAML frontmatter에 에이전트별 훅 정의 | ⭐⭐⭐ |
| **Debug Events Snapshot** | 에이전트 디버그 이벤트를 채팅에 첨부 | ⭐⭐ |

### 2.5 1.112 (2026-03-18) — 통합 브라우저 디버깅 + MCP 샌드박싱

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **통합 브라우저 디버깅** | `editor-browser` 디버그 타입 — VSCode 내에서 웹앱 디버깅 | ⭐⭐⭐ |
| **MCP 서버 샌드박싱** | macOS/Linux — MCP 서버 파일/네트워크 격리 | ⭐⭐⭐ |
| **에이전트 이미지/바이너리** | 스크린샷, 다이어그램 직접 처리 | ⭐⭐ |
| **모노레포 커스터마이징** | 상위 레포 설정 자동 탐색 | ⭐⭐ |

### 2.6 1.113 (2026-03-25) — MCP CLI + 세션 포크

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **MCP in CLI agents** | CLI 에이전트에서 MCP 서버 사용 가능 | ⭐⭐⭐ |
| **세션 포크** | 대화 분기하여 별도 실험 가능 | ⭐⭐ |
| **중첩 서브에이전트** | 에이전트 내 에이전트 호출 | ⭐⭐ |
| **Chat Customizations 에디터** | 커스텀 지시/프롬프트/에이전트/스킬 통합 관리 UI | ⭐⭐⭐ |

### 2.7 1.114~1.115 (2026-03~04) — Agents App 등장

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **Agents App** | 에이전트 전용 앱 모드 (Insiders 시작) | ⭐⭐ |
| **Claude Agent in Agents App** | Copilot CLI와 나란히 Claude 에이전트 배치 | ⭐⭐ |

### 2.8 1.116 (2026-04-15) — 에이전트 디버그 + Copilot 빌트인

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **Agent Debug Logs** | 과거 에이전트 세션 로그 열람/디버깅 | ⭐⭐⭐ |
| **포그라운드 터미널 도구** | 에이전트가 보이는 터미널에서도 작동 | ⭐⭐ |
| **Copilot 빌트인** | 확장 설치 없이 Copilot Chat 기본 내장 | 📌 정보 |
| **네트워크 도메인 필터링** | 관리자가 에이전트 네트워크 접근 제한 | ⭐⭐⭐ |
| **Tool Confirmation Carousel** | 다수 도구 호출 순차 승인 UI | ⭐⭐ |

### 2.9 1.117 (2026-04-22) — BYOK + 터미널 제목

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **BYOK** | 조직 API 키 직접 연결 (Business/Enterprise) | ⭐⭐ |
| **터미널 제목 표시** | Claude Code 등 에이전트 CLI가 고유 제목 표시 | ⭐⭐ |
| **증분 채팅 렌더링** | 블록별 스트리밍 + 애니메이션 옵션 | ⭐ |

### 2.10 1.118 (2026-04-29) — 리모트 컨트롤 + 시맨틱 검색

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **리모트 컨트롤** | CLI 세션을 GitHub.com/모바일에서 원격 모니터링 | ⭐⭐⭐ |
| **시맨틱 코드베이스 검색** | 워크스페이스 내 의미 기반 코드 검색 | ⭐⭐⭐ |
| **Chat Session Insights** | 채팅 이력 → 스탠드업 리포트/팁 자동 생성 | ⭐⭐ |
| **TypeScript 7 지원** | TS 7 얼리 서포트 | ⭐ |

### 2.11 1.119~1.120 (2026-05) — Agents Window Stable

| 영역 | 변화 | MONK 관련도 |
|------|------|------------|
| **Agents Window (Stable)** | 에이전트 전용 윈도우 정식 안정화 | ⭐⭐⭐ |
| **BYOK 토큰 사용량** | 컨텍스트 윈도우 토큰 수/비율 실시간 표시 | ⭐⭐⭐ |
| **Thinking Effort 설정** | BYOK 모델 사고 노력 조절 (품질↔속도 균형) | ⭐⭐ |
| **터미널 커맨드 리스크 평가** | AI 기반 Safe/Caution/Review 뱃지 | ⭐⭐⭐ |
| **터미널 출력 압축** | 대규모 출력 자동 압축 (컨텍스트 절약) | ⭐⭐⭐ |
| **Markdown Diff Preview** | 렌더링된 마크다운 diff 뷰 | ⭐⭐ |

---

## 3. 확장 생태계 변화

### 3.1 현재 설치 확장 (15개)

| # | 확장 | 버전 | 용도 | 비고 |
|---|------|------|------|------|
| 1 | **anthropic.claude-code** | 2.1.141 | Claude Code 네이티브 확장 | ✅ 핵심. 구버전(2.1.140) 잔류 |
| 2 | esbenp.prettier-vscode | 12.4.0 | 코드 포맷팅 | ✅ 활용 중 |
| 3 | **google.geminicodeassist** | 2.82.0 | Gemini Code Assist (용아) | ✅ 구버전(2.81.0) 잔류 |
| 4 | googlecloudtools.cloudcode | 2.39.0 | Google Cloud 도구 | ✅ 배포 관련 |
| 5 | ms-ceintl.vscode-language-pack-ko | 1.118 | 한국어 팩 | ✅ |
| 6 | ms-python.debugpy | 2026.6.0 | Python 디버거 | ✅ |
| 7 | ms-python.python | 2026.4.0 | Python 지원 | ✅ |
| 8 | ms-python.vscode-pylance | 2026.2.1 | Python 언어 서버 | ✅ |
| 9 | ms-python.vscode-python-envs | 1.30.0 | Python 환경 관리 | ✅ |
| 10 | ms-toolsai.jupyter | 2025.9.1 | Jupyter 노트북 | ⚠️ 구버전 가능성 |
| 11 | ms-toolsai.jupyter-keymap | 1.1.2 | Jupyter 키맵 | ✅ |
| 12 | ms-toolsai.jupyter-renderers | 1.3.0 | Jupyter 렌더러 | ✅ |
| 13 | ms-toolsai.vscode-jupyter-cell-tags | 0.1.9 | Jupyter 셀 태그 | ✅ |
| 14 | ms-toolsai.vscode-jupyter-slideshow | 0.1.6 | Jupyter 슬라이드 | ❓ 사용 빈도 낮을 듯 |
| 15 | ritwickdey.liveserver | 5.7.10 | 로컬 서버 | ✅ |

### 3.2 주목할 변화

**이미 설치된 확장 관련:**
- Claude Code 확장: 구버전(2.1.140) 디스크에 잔류. 정리 가능.
- Gemini Code Assist: 구버전(2.81.0) 잔류. 마찬가지.
- Jupyter: 2025.9.1 — 2026년 버전이 존재할 가능성 있음. 업데이트 확인 필요.

**미설치이나 MONK에 유용할 확장:**

| 확장 | 용도 | MONK 관련도 |
|------|------|------------|
| **dotenv-vscode** | `.env` 파일 구문 강조 + 변수 자동완성 | ⭐⭐ 헌법 4조 보강 |
| **SecretSentinel** | 하드코딩된 시크릿 실시간 감지 (Shannon 엔트로피) | ⭐⭐⭐ 헌법 4조 보강 |
| **Cloak** | `.env` 값 암호화 + Touch ID 게이팅 | ⭐⭐⭐ 헌법 4조 보강 |
| **GitLens** | Git 히스토리/blame 고급 시각화 | ⭐⭐ |
| **Markdown All in One** | 마크다운 작성 생산성 (TOC, 자동 포맷) | ⭐⭐ 세션 로그 |
| **Todo Tree** | TODO/FIXME 코드 내 태그 트리 표시 | ⭐ |
| **Error Lens** | 에러/경고 인라인 표시 | ⭐⭐ |

**Deprecated/대체된 확장:**
- **Edit Mode** (VSCode 빌트인): 1.110에서 deprecated, 1.125에서 제거 예정. 현재 MONK 환경에 영향 없음.
- **GitHub Copilot**: 1.116부터 빌트인 — 확장 설치 없이 기본 제공. 현재 MONK은 Claude Code + Gemini 체계이므로 직접 영향 없으나, Copilot CLI의 MCP/터미널 기능은 참고할 가치 있음.

---

## 4. 현재 MONK 환경 진단

### 4.1 VSCode 버전
- **1.120.0** (2026-05-13 릴리즈) — 최신 상태 ✅

### 4.2 프로젝트 설정 (`.vscode/settings.json`)

**잘 갖춰진 항목:**
- ✅ Prettier + ESLint 포맷팅/린팅 파이프라인
- ✅ formatOnSave 활성화
- ✅ Git 안전 설정 (`autofetch: false`, `confirmSync: true`)
- ✅ 파일 제외 패턴 (node_modules, .git, dist, .next 등)
- ✅ Claude Code 모델 `opus[1m]` 지정
- ✅ 터미널 MesloLGS NF 폰트 (powerline 글리프 호환)
- ✅ 에디터 탭 자동 잠금 설정 (에이전트 세션 보호)

**미흡하거나 부재한 항목:**
- ❌ **`code` CLI 미등록** — Shell Command: Install 'code' command in PATH 미실행. 확장 목록 조회, CLI 기반 자동화 불가.
- ❌ **스니펫 0건** — 세션 로그 YAML frontmatter, 지시서 템플릿, 타임스탬프 등 반복 패턴 자동화 미활용.
- ❌ **프로파일 미사용** — 쌍아(설계)/막내(코딩) 역할별 확장 세트 분리 가능하나 미활용.
- ❌ **터미널 기본 위치 `editor`** — 막내 CLI 세션이 에디터 영역을 점유. 패널(`bottom`)로 분리하면 코드 뷰와 병행 용이.
- ⚠️ **`terminal.integrated.scrollback: 10000`** — 충분하지만, 1.120의 출력 압축 기능과 조합하면 컨텍스트 절약 가능.
- ⚠️ **eslint.validate에 TypeScript 미포함** — JS/HTML만 검증. TS 파일 사용 시 추가 필요.

### 4.3 유저 설정 (`~/Library/Application Support/Code/User/settings.json`)

- `claudeCode.preferredLocation: "panel"` — 패널 모드 ✅
- `geminicodeassist.project: "neat-charter-l2hmx"` — Gemini 프로젝트 연결 ✅
- `cloudcode.project: "monkos"` — GCP 프로젝트 연결 ✅
- `github.copilot.nextEditSuggestions.enabled: true` — Copilot 편집 제안 활성화 (사용 중인지 확인 필요)

### 4.4 키바인딩
- **1건만 등록**: `Shift+Enter` → 터미널 전송. 최소한의 커스터마이징 상태.

### 4.5 Claude Code 확장 연동 상태
- 버전 2.1.141 (최신 근방) ✅
- `opus[1m]` 모델 지정 ✅
- 패널 위치 설정 ✅
- `.claude/skills/`, `.claude/rules/` 디렉토리 활용 중 ✅
- Agent Hooks, Agent-Scoped Hooks: **활용 여부 미확인** (1.109+에서 도입)

---

## 5. 도입 추천 인사이트 (우선순위)

### 🔴 P0 — 즉시 적용 (인프라/보안)

#### 5.1 `code` CLI 등록
- **현황**: PATH에 미등록. `code --list-extensions` 등 CLI 자동화 불가.
- **조치**: VSCode 내 `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH" 실행.
- **효과**: 스크립트에서 VSCode 연동 가능, 확장 자동 설치/관리, `code --diff` 등 활용.

#### 5.2 시크릿 보호 확장 도입
- **현황**: 헌법 4조 1항(비밀정보 보호)의 VSCode 레벨 방어선 부재.
- **추천**: `Cloak` 또는 `SecretSentinel` — `.env` 값 마스킹/실시간 시크릿 감지.
- **효과**: API 키 노출 사전 차단. 에이전트가 `.env` 내용을 읽어도 마스킹 상태.

#### 5.3 터미널 커맨드 리스크 평가 활성화 (1.120)
- **현황**: 1.120에서 실험적 기능으로 도입. 활성화 여부 미확인.
- **효과**: 에이전트가 실행하는 터미널 명령에 Safe/Caution/Review 뱃지 표시. 헌법 4조 2항(파괴적 명령 금지) 시각적 보강.

### 🟡 P1 — 단기 도입 (생산성)

#### 5.4 스니펫 세트 구축
- **현황**: 스니펫 0건.
- **추천 스니펫**:
  - `yaml-session`: 세션 로그 YAML frontmatter
  - `yaml-order`: 지시서 YAML frontmatter
  - `yaml-completion`: 완료 보고서 YAML frontmatter
  - `yaml-pf`: 포트폴리오 YAML frontmatter
  - `ts-kst`: `**[YYYY-MM-DD HH:MM KST]**` 타임스탬프 블록
  - `header-comm`: 수발신 헤더 `[날짜] 디바이스/에이전트 → 수신자`
- **효과**: 세션 로그/지시서/보고서 작성 시 반복 타이핑 제거. YAML 필수 필드 누락 방지.

#### 5.5 터미널 출력 압축 활성화 (1.120)
- **현황**: 1.120 신기능. 대규모 git diff, npm install 출력 자동 압축.
- **효과**: 에이전트 컨텍스트 윈도우 절약 — MONK 멀티에이전트의 토큰 생존 전략과 직결.

#### 5.6 통합 브라우저 디버깅 활용 (1.112+)
- **현황**: 현재 CDP(Chrome DevTools Protocol)로 외부 브라우저 제어 중.
- **가능성**: `editor-browser` 디버그 타입으로 VSCode 내에서 웹앱 디버깅. 브레이크포인트/변수 검사 가능.
- **주의**: CDP 체계와의 병행/대체 여부는 별도 검토 필요. PF_CDP 비전과 충돌하지 않는 범위에서 보조 도구로 활용 가능.

### 🟢 P2 — 중기 검토 (아키텍처)

#### 5.7 Agent Hooks / Agent-Scoped Hooks (1.109/1.111)
- **현황**: `.claude/skills/`는 활용 중이나, Agent Hooks(PreToolUse, PostToolUse 등)는 미확인.
- **가능성**:
  - `PreToolUse`: 파괴적 명령 사전 차단 자동화 (헌법 4조 2항)
  - `PostToolUse`: 세션 로그 자동 어펜드 트리거
  - Agent-Scoped Hooks: 쌍아/막내 역할별 다른 훅 세트 적용
- **효과**: 헌법 준수 자동화. 수동 검증 부담 감소.

#### 5.8 MCP 서버 샌드박싱 (1.112)
- **현황**: MONK 환경에서 MCP 서버 사용 여부 미확인.
- **가능성**: 향후 MCP 도구 확장 시, macOS 샌드박스로 파일/네트워크 격리 적용.
- **효과**: 헌법 4조 보강. 에이전트 도구의 접근 범위 물리적 제한.

#### 5.9 Autopilot 모드 (1.111)
- **현황**: `chat.autopilot.enabled` 설정 존재. 현재 활용 여부 미확인.
- **주의**: 헌법 5조 4항(실행 전 검토 의무)과 충돌 가능. 승인 없이 파괴적 행동 가능하므로 **막내 전용, 제한 범위** 내에서만 실험적 도입 검토.

#### 5.10 프로파일 분리
- **현황**: 프로파일 미사용.
- **가능성**: 쌍아(설계: 마크다운/문서 확장 중심) vs 막내(코딩: 린터/디버거 중심) 프로파일 분리.
- **효과**: 역할별 확장 로딩 최적화. 불필요 확장에 의한 리소스 점유 감소.

#### 5.11 Chat Session Insights (1.118)
- **현황**: 채팅 이력 → 스탠드업 리포트 자동 생성 기능.
- **가능성**: 세션 마감 시 자동 요약 생성 → 세션 로그 초안으로 활용.
- **주의**: 헌법 3조 1항(타임스탬프 정확성)은 여전히 수동 검증 필요.

#### 5.12 리모트 컨트롤 (1.118)
- **현황**: CLI 세션을 GitHub.com/모바일에서 원격 모니터링 가능.
- **가능성**: 작가님이 외출 중에도 막내 세션 상태를 모바일로 확인.
- **주의**: Copilot CLI 기반 기능. Claude Code CLI와의 호환성 확인 필요.

#### 5.13 시맨틱 코드베이스 검색 (1.118)
- **현황**: 워크스페이스 내 의미 기반 코드 검색.
- **효과**: `monkos_AI/` 내 서비스 코드 탐색 시 키워드가 아닌 의도 기반 검색 가능.

---

## 6. 즉시 적용 가능 액션 리스트

| # | 액션 | 난이도 | 효과 | 비고 |
|---|------|--------|------|------|
| 1 | `code` CLI PATH 등록 | 10초 | CLI 자동화 기반 확보 | Cmd+Shift+P → "Shell Command" |
| 2 | 시크릿 보호 확장 설치 | 1분 | 헌법 4조 방어선 추가 | Cloak 또는 SecretSentinel |
| 3 | 스니펫 세트 구축 (6종) | 10분 | 문서 작성 반복 제거 | 작가님 승인 후 별도 지시서 |
| 4 | 터미널 커맨드 리스크 평가 활성화 | 1분 | 파괴적 명령 시각 경고 | 1.120 실험적 설정 |
| 5 | 터미널 출력 압축 활성화 | 1분 | 토큰 절약 | 1.120 프리뷰 설정 |
| 6 | 구버전 확장 정리 | 1분 | 디스크 정리 | claude-code 2.1.140, geminicodeassist 2.81.0 |

> ⚠️ **설정 변경은 본 보고서의 범위 밖** (ch7 3조 준수). 위 액션은 작가님 승인 후 별도 지시서로 실행.

---

## 참조 소스

- [VSCode 1.120 Release Notes](https://code.visualstudio.com/updates/v1_120)
- [VSCode 1.108 Release Notes](https://code.visualstudio.com/updates/v1_108)
- [VSCode 1.109 Release Notes](https://code.visualstudio.com/updates/v1_109)
- [VSCode 1.111 Release Notes](https://code.visualstudio.com/updates/v1_111)
- [VSCode 1.112 Release Notes](https://code.visualstudio.com/updates/v1_112)
- [VSCode 1.113 Release Notes](https://code.visualstudio.com/updates/v1_113)
- [VSCode 1.116 Release Notes](https://code.visualstudio.com/updates/v1_116)
- [VSCode 1.117 Release Notes](https://code.visualstudio.com/updates/v1_117)
- [VSCode Release Notes Archive](https://code.visualstudio.com/updates/archive)
- [Claude Code Extension — VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog)
- [Cloak — .env Secret Protection](https://getcloak.dev/)
