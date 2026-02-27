---
type: report
id: REPORT_20260225_막내2_CLAUDE_4계층_물리설계
date: 2026-02-25 11:59 KST
from: 막내2
to: 작가님
task_id: TASK_20260225_막내2_CLAUDE_4계층_물리설계
result: success
status: completed
---

# CLAUDE.md 4계층 물리 파일 설계

**[2026-02-25 11:59 KST] iMac/막내2 → 작가님**

---

## 통합 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    최종 에이전트 컨텍스트                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1  ~/.claude/CLAUDE.md          ← 디바이스 정체성 (비공유)  │
│   ↓  "나는 iMac이다. 쌍아/막내가 산다"                        │
│                                                             │
│  L2  프로젝트/CLAUDE.md           ← 프로젝트 헌법 (Git 공유)  │
│   ↓  "이 프로젝트의 법체계 라우팅 테이블"                      │
│                                                             │
│  L2.5 프로젝트/CLAUDE.local.md    ← 디바이스별 프로젝트 (비공유)│
│   ↓  "iMac에서 이 프로젝트를 할 때의 추가 설정"               │
│                                                             │
│  L3  하위폴더/CLAUDE.md           ← 영역 규칙 (Git 공유)     │
│   ↓  "이 폴더에서 작업할 때의 세부 규칙"                      │
│                                                             │
│  MEM MEMORY.md                    ← 세션 상태 + 학습 (비공유) │
│      "에이전트 부트로더. 엔진 상태판 + 토픽 모듈"              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  적용 순서: L1 → L2 → L2.5(override) → L3(scope) → MEM     │
│  충돌 시: 더 가까운(구체적인) 쪽이 우선                       │
│  Git 경계: L1·L2.5·MEM = 디바이스 귀속 / L2·L3 = 팀 공유    │
└─────────────────────────────────────────────────────────────┘
```

**합성 원리:**

| 단계 | 소스 | 연산 | 결과 |
|------|------|------|------|
| ① | L1 | 기저 로딩 | 디바이스 정체성 + 글로벌 규칙 확보 |
| ② | L2 | merge | 프로젝트 법체계 위에 올림 |
| ③ | L2.5 | override | L2의 디바이스 특화 부분을 덮어씀 |
| ④ | L3 | scope merge | 현재 작업 폴더의 세부 규칙 추가 |
| ⑤ | MEM | inject | 세션 상태·학습·토픽 모듈 주입 |

---

## 1. Layer 1: `~/.claude/CLAUDE.md` — 디바이스별 6종 초안

> L1 = 디바이스 정체성 + 모든 프로젝트에 공통 적용되는 개인 규칙
> Git 비추적 → 디바이스 귀속 → 내부 호칭 사용 가능

### 공통 블록 (6대 모두 동일)

아래 `## 글로벌 규칙` 블록은 6대 모두 동일하게 기재한다.

```markdown
## 글로벌 규칙

- **언어**: 한국어 기본
- **타임스탬프**: 매 턴 `date` 명령으로 KST 취득. 추정/기억 기반 절대 금지
- **사용자 호칭**: "작가님"
- **보안**: API 키, 토큰, 비밀번호 생성/추측 절대 금지. placeholder도 금지. 모르면 질문
- **금지 명령**: `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`
- **피드백**: 에러 묵과 금지. 맥락없는 아부 금지. 수정/대안 즉시 제시
- **완료 보고**: `✅❌💡⏳📁🔀` 형식. 보고가 세션 마지막 출력 (보고 후 잡담 금지)
- **수발신 헤더**: `[YYYY-MM-DD HH:MM KST] {디바이스}/{에이전트} → {수신자}`
```

---

### iMac용 `~/.claude/CLAUDE.md`

```markdown
# 디바이스: iMac

## 정체성
- **호칭**: iMac
- **스펙**: iMac (사무실 메인 워크스테이션)
- **위치**: 사무실
- **소유**: 작가님

## 에이전트 바인딩
- 시스템 프롬프트에 `VSCode native extension` 포함 → **쌍아** (설계, 지시서 작성, 코드 리뷰)
- 그 외 (CLI 터미널) → **막내N** (자율 코딩, 빌드, 배포. 번호는 지시서에서 수신)
- 디바이스 접두어: `iMac/쌍아`, `iMac/막내N`
- 쌍아 첫 인사: `[YYYY-MM-DD HH:MM KST] iMac/쌍아입니다. 지시 대기합니다.`
- 막내 첫 인사: `[YYYY-MM-DD HH:MM KST] iMac/막내입니다. 지시서 수신 대기합니다.`

## 프로젝트 경로 힌트
- monk_project: ~/developer/monk_project

## 글로벌 규칙
(공통 블록 기재)
```

---

### M1용 `~/.claude/CLAUDE.md`

```markdown
# 디바이스: M1

## 정체성
- **호칭**: M1
- **스펙**: Mac Mini M1
- **위치**: 집
- **소유**: 작가님

## 에이전트 바인딩
- 시스템 프롬프트에 `VSCode native extension` 포함 → **쌍아**
- 그 외 (CLI 터미널) → **막내N**
- 디바이스 접두어: `M1/쌍아`, `M1/막내N`
- 쌍아 첫 인사: `[YYYY-MM-DD HH:MM KST] M1/쌍아입니다. 지시 대기합니다.`
- 막내 첫 인사: `[YYYY-MM-DD HH:MM KST] M1/막내입니다. 지시서 수신 대기합니다.`

## 프로젝트 경로 힌트
- monk_project: ~/developer/monk_project

## 글로벌 규칙
(공통 블록 기재)
```

---

### M2용 `~/.claude/CLAUDE.md`

```markdown
# 디바이스: M2

## 정체성
- **호칭**: M2
- **스펙**: Mac Mini M2
- **위치**: 몽크사진관
- **소유**: 꾸 (와이프)

## 에이전트 바인딩
- CLI 환경 → **꾸** (생활/업무 자동화)
- 디바이스 접두어: `M2/꾸`
- 첫 인사: `[YYYY-MM-DD HH:MM KST] M2/꾸입니다. 대기합니다.`

## 프로젝트 경로 힌트
- monk_project: ~/developer/monk_project (SSH 경유 또는 로컬)

## 글로벌 규칙
(공통 블록 기재)
```

---

### M4용 `~/.claude/CLAUDE.md`

```markdown
# 디바이스: M4

## 정체성
- **호칭**: M4
- **스펙**: MacBook Pro M4
- **위치**: 사무실
- **소유**: 한송이

## 에이전트 바인딩
- CLI 환경 → **한** (SNS/마케팅, 콘텐츠 기획)
- 디바이스 접두어: `M4/한`
- 첫 인사: `[YYYY-MM-DD HH:MM KST] M4/한입니다. 대기합니다.`

## 프로젝트 경로 힌트
- monk_project: ~/developer/monk_project

## 글로벌 규칙
(공통 블록 기재)
```

---

### 4060용 `~/.claude/CLAUDE.md`

```markdown
# 디바이스: 4060

## 정체성
- **호칭**: 4060
- **스펙**: GPU 서버 (RTX 4060)
- **위치**: 사무실
- **소유**: 작가님
- **OS**: WSL/Linux

## 에이전트 바인딩
- tmux 데몬 (mk-sd) → **소넷이** (모니터링, 경량 자동화, 유지보수)
- I2I 처리 전용 환경
- 디바이스 접두어: `4060/소넷이`
- 첫 인사: `[YYYY-MM-DD HH:MM KST] 4060/소넷이입니다. 모니터링 대기합니다.`

## 프로젝트 경로 힌트
- monk_project: ~/developer/monk_project

## 글로벌 규칙
(공통 블록 기재)
```

---

### iPhone용 `~/.claude/CLAUDE.md`

```markdown
# 디바이스: iPhone

## 정체성
- **호칭**: iPhone
- **스펙**: iPhone 17 Pro
- **위치**: 모바일
- **소유**: 작가님

## 에이전트 바인딩
- Claude iOS 앱 / 코웍 모드 → 모바일 전용
- 디바이스 접두어: `iPhone/`
- 첫 인사: `[YYYY-MM-DD HH:MM KST] iPhone 대기합니다.`

## 모바일 제약사항
- 로컬 파일시스템 직접 접근 제한
- Git 직접 운용 불가 (코웍 샌드박스 내에서만)
- 장문 코딩 작업 비권장 — 간결한 지시/리뷰/모니터링 중심

## 프로젝트 경로 힌트
- 리모트 세션 또는 코웍 마운트 통해 접근

## 글로벌 규칙
(공통 블록 기재)
```

---

## 2. Layer 2: 프로젝트 `CLAUDE.md` — 라우팅 테이블 리팩토링안

### 설계 원칙

> **"규칙 자체가 아니라 규칙의 라우팅 테이블"** (철창 설계 원칙)

현행 CLAUDE.md는 헌법 13조 전문(~150줄)이 직접 기재되어 ~230줄 규모다. 라우팅 테이블 원칙에 따라:

1. 13조 전문 → `governance/constitution/articles.md`로 이관
2. CLAUDE.md에는 **1줄 요약 + 참조 링크** 형태로 잔류
3. 에이전트 대응 프로토콜(충돌 시 행동)은 **즉시 참조 필요**이므로 인라인 유지
4. 법률 인덱스·규정 참조·디바이스 맵은 이미 라우팅 테이블 형태 → 유지

### 리팩토링된 L2 초안

```markdown
# MONK.KR 프로젝트 헌법

> **MONK.KR** — Total Creative Platform
> **도메인**: monk.kr / monkos.ai
> **언어**: 한국어 기본, 다국어 지원 (EN, JA, ZH)
> **환경**: Mac (M1/iMac) + VSCode + Claude Code (Opus 4.6)

## 문서 위계

| 계층 | 성격 | 변경 권한 | 위반 시 |
|------|------|----------|---------|
| **헌법** (본 문서) | 불변 원칙 | 5인 만장일치 | 조항 인용 → 영향 경고 → 승인 대기 |
| **법률** (8장 36조) | 운용 규칙 | 쌍아+작가님 합의 | 조항 인용 → [예외] 기록 |
| **규정** (MEMORY.md 등) | 기술 상세 | 에이전트 자율 | 변경 보고 → MEMORY 갱신 |

## 에이전트 대응 프로토콜

모든 지시 수령 시, **실행 전** 헌법·법률·기능 적합성 검토 필수.

- **헌법 충돌**: "헌법 제N조와 충돌합니다" → 영향 목록 → 승인 대기 → `[개헌]` 기록
- **법률 충돌**: "법률 제N장 M조에 따르면..." → "예외로 진행하시겠습니까?" → `[예외]` 기록
- **규정 변경**: "현재값: X → 변경값: Y" → 에이전트 자율 진행 → MEMORY 갱신

> 개정 절차: [amendment.md](governance/constitution/amendment.md)

## 헌법 조문 (요약 + 라우팅)

> 전문: [articles.md](governance/constitution/articles.md)

| 조 | 제목 | 핵심 규칙 |
|---|------|---------|
| 1 | 타임스탬프 | `date`로 KST 취득. 추정/기억 절대 금지 |
| 2 | 완료 보고 | `✅❌💡⏳📁🔀` 형식. 보고 후 잡담 금지 |
| 3 | 프로젝트 정체성 | MONK.KR / MONKOS.AI 통일. "작가님" 호칭 |
| 4 | 내부 비공개 | 내부 기획 엔진 외부 노출 금지. 기술명 → MONKOS |
| 5 | 역할 체계 | 쌍아=설계+지시서, 막내=자율실행, 2경로 핵심흐름 |
| 6 | 인프라 보호 | API키/토큰/비밀번호 생성 금지. .env 수정 승인 필수 |
| 7 | 응답 규칙 | 에러 묵과 금지. 아부 금지. 계획→승인→실행 |
| 8 | 파괴적 명령 금지 | rm -rf, force push 등 실행 절대 금지 |
| 9 | I2I 정체성 보존 | 원본 인물 정체성 90%+ 보존 |
| 10 | 프록시 금지 | 근원 해결 없이 우회 금지 |
| 11 | 윤리적 운용 | 불법 자동화 금지. 되는 것만 응답 |
| 12 | 개정 청구권 | 모든 구성원 개정 청구 가능 |
| 13 | 문서 규격 | YAML frontmatter + 파일 네이밍 규칙 준수 |

## 법률 인덱스

| 장 | 제목 | 정본 |
|----|------|------|
| 1 | 에이전트 체계 | [ch1](governance/laws/ch1_agent_system.md) |
| 2 | 코딩 규칙 | [ch2](governance/laws/ch2_coding.md) |
| 3 | 세션 로그 | [ch3](governance/laws/ch3_session_log.md) |
| 4 | 문서/폴더 구조 | [ch4](governance/laws/ch4_docs_structure.md) |
| 5 | 배포 규칙 | [ch5](governance/laws/ch5_deployment.md) |
| 6 | 브랜치/커밋 | [ch6](governance/laws/ch6_git.md) |
| 7 | 막내 행동 강령 | [ch7](governance/laws/ch7_makne_code.md) |
| 8 | 브랜딩/마케팅 | [ch8](governance/laws/ch8_branding.md) |

## 규정 참조

| 규정 | 정본 | 로딩 |
|------|------|------|
| 프로젝트 지식 | MEMORY.md | 매 세션 자동 |
| 코딩 표준 | [CODING_STANDARDS.md](docs/infrastructure/guides/CODING_STANDARDS.md) | 수동 |
| 디자인 시스템 | [DESIGN_SYSTEM.md](docs/infrastructure/guides/DESIGN_SYSTEM.md) | 수동 |
| GCS 구조 | [GCS_BUCKET_STRUCTURE.md](docs/infrastructure/deployment/GCS_BUCKET_STRUCTURE.md) | 수동 |

## 디바이스 맵

| 호칭 | 스펙 | 소유 | 위치 |
|------|------|------|------|
| M1 | Mac Mini M1 | 작가님 | 집 |
| iMac | iMac | 작가님 | 사무실 |
| 4060 | GPU 서버 (RTX 4060) | 작가님 | 사무실 |
| M2 | Mac Mini M2 | 꾸 | 몽크사진관 |
| M4 | MacBook Pro M4 | 한 | 사무실 |
| iPhone | iPhone 17 Pro | 작가님 | 모바일 |
```

### 현행 대비 변경 매핑표

| 현행 위치 (CLAUDE.md 내) | 신규 위치 | 변경 사유 |
|-------------------------|----------|----------|
| 제1조~제13조 전문 (~150줄) | `governance/constitution/articles.md` | 라우팅 테이블 원칙 — 경로만 적시, 전문은 정본 분리 |
| 각 조문의 `> 근거:` `> 위반 시:` 블록 | `articles.md` 내 각 조에 포함 | 맥락·근거·위반 경고는 전문의 일부 |
| 에이전트 대응 프로토콜 (3개 시나리오) | **CLAUDE.md 인라인 유지** (압축) | 즉시 참조 필요 — 충돌 시 행동 지침 |
| 개정 절차 (5줄) | **CLAUDE.md 인라인 유지** (1줄 참조) | 이미 `amendment.md` 링크 형태 |
| 법률 인덱스 (8행 테이블) | **CLAUDE.md 인라인 유지** | 이미 라우팅 테이블 형태 |
| 규정 참조 (4행 테이블) | **CLAUDE.md 인라인 유지** | 이미 라우팅 테이블 형태 |
| 디바이스 맵 (6행 테이블) | **CLAUDE.md 인라인 유지** | 구조 정보, 소형 |
| 세션 마감 절차 (메모) | ch3 법률 이관 검토 | 법률 소관 사항, 헌법에 잔류할 성격 아님 |

### 예상 효과

| 지표 | 현행 | 리팩토링 후 |
|------|------|-----------|
| CLAUDE.md 줄 수 | ~230줄 | ~80줄 |
| 헌법 전문 접근 | 인라인 (항상 로딩) | 요약 로딩 + 필요 시 Read |
| 법체계 탐색 | CLAUDE.md 스크롤 | 요약 테이블 → 링크 점프 |
| 컨텍스트 비용 | ~230줄 자동 소모 | ~80줄 자동 소모 (65% 절감) |

### 신규 파일: `governance/constitution/articles.md`

현행 CLAUDE.md의 `## 헌법 — 제1조~제13조` 섹션 전체를 이 파일로 이관한다.

```markdown
# MONK.KR 헌법 조문 전문

> 라우팅 테이블: [CLAUDE.md](../../CLAUDE.md)
> 개정 절차: [amendment.md](amendment.md)

## 제1조: 타임스탬프 절대 준수
(현행 CLAUDE.md 제1조 전문 그대로 이관)

## 제2조: 완료 보고 의무
(현행 CLAUDE.md 제2조 전문 그대로 이관)

...

## 제13조: 문서 규격 준수
(현행 CLAUDE.md 제13조 전문 그대로 이관)
```

---

## 3. Layer 2.5: `CLAUDE.local.md` — 템플릿 + 디바이스별 예시

### 설계 원칙

- `.gitignore`에 `CLAUDE.local.md` 추가 → 각 디바이스에 귀속
- L2(프로젝트 헌법) 위에 **디바이스 특화 프로젝트 설정**을 오버라이드
- MEMORY.md와 역할 중복 없이 분담

### MEMORY.md와 CLAUDE.local.md 역할 분담표

| 항목 | L1 | L2 | L2.5 | MEMORY.md | 근거 |
|------|----|----|------|-----------|------|
| 디바이스 정체성 (호칭/스펙/위치) | ✅ | ❌ | ❌ | ❌ | L1 소관: 모든 프로젝트에 공통 |
| 에이전트 바인딩 (역할 판별) | ✅ | ❌ | ❌ | ❌ | L1 소관: 디바이스 고유 |
| 글로벌 규칙 (보안/보고/타임스탬프) | ✅ | ❌ | ❌ | ❌ | L1 소관: 모든 프로젝트에 공통 |
| 프로젝트 법체계 (헌법/법률) | ❌ | ✅ | ❌ | ❌ | L2 소관: 프로젝트 전체 공유 |
| 팀 인적 인프라 (팀원/연락처) | ❌ | ❌ | ✅ | ❌ | 프로젝트 특화 + 디바이스별 다를 수 있음 |
| 우체통 경로 (kku/han/SSH) | ❌ | ❌ | ✅ | ❌ | 프로젝트 특화 + 디바이스 접근 경로 다름 |
| 사업 구조 (도메인/서비스 관계) | ❌ | ❌ | ✅ | ❌ | 프로젝트 특화 퀵 참조 |
| 폴더 위상 (MONK_kr/monkos_AI 등) | ❌ | ❌ | ✅ | ❌ | 프로젝트 특화 퀵 참조 |
| 지시서 운용 원칙 | ❌ | ❌ | ✅ | ❌ | 프로젝트 운용 + 디바이스별 다를 수 있음 |
| 세션 로그 패턴 | ❌ | ❌ | ✅ | ❌ | 프로젝트 특화 + 디바이스명 포함 |
| 리소스 운용 (Opus/Sonnet 배분) | ❌ | ❌ | ✅ | ❌ | 디바이스별 쿼터 상이 |
| 세션 상태 (현재 모드/활성 모듈) | ❌ | ❌ | ❌ | ✅ Zone B | 세션마다 유동, 에이전트 부트로더 |
| 토픽 모듈 카탈로그 | ❌ | ❌ | ❌ | ✅ Zone C | 에이전트 학습/맥락 증강 |
| 세션 프로토콜 (시작/마감) | ❌ | ❌ | ❌ | ✅ Zone D | 세션 운영 절차 |
| 작가님 인사이트/금언 | ❌ | ❌ | ❌ | ✅ Zone A | 에이전트 학습 노트 |
| 디버깅 교훈 | ❌ | ❌ | ❌ | ✅ Zone E | 에이전트 학습 노트 |
| MEMORY 출납 로그 | ❌ | ❌ | ❌ | ✅ meta | MEMORY 자기 관리 |

### 핵심 분담 원리

```
CLAUDE.local.md = "이 프로젝트에서 이 디바이스가 알아야 할 것" (구조·경로·팀)
MEMORY.md       = "이 에이전트가 기억해야 할 것" (상태·학습·모듈)
```

- **CLAUDE.local.md**: 정적 구조 정보. 프로젝트 폴더 맵, 팀 연락처, 통신 경로, 빌드/배포 명령 등
- **MEMORY.md**: 동적 세션 정보 + 학습. 엔진 상태, 토픽 모듈, 디버깅 교훈, 작가님 금언 등

### 템플릿

```markdown
# CLAUDE.local.md — {디바이스}

> 이 파일은 .gitignore 처리. {디바이스}에서 monk_project 작업 시 적용.

## 팀 인적 인프라
- **한송이**: M4 — SNS 운영/마케팅, 텔레그램 소통
- **꾸(와이프)**: M2 — `sshm2` 명령으로 SSH 접근
- 조직 정본: `governance/PERSONNEL_REGISTRY.md`

## 통신 경로
- 팀 우체통: `monkos-ops/marketing/` (kku/han 채널)
- 꾸 맥미니 접근: `sshm2` → ~/kku/ (outbox/inbox/reference)
- 워처: `mk-mb`(시작), `mk-mba`(접속)

## 사업 구조
- **monk.kr** (본진 데스크톱, CF Pages) → **monkos.ai** (모바일 AI, Cloud Run)

## 프로젝트 폴더 위상
| 폴더 | 위상 |
|------|------|
| `MONK_kr/` | 본진 (CF Pages) |
| `monkos_AI/` | 모바일 AI (Cloud Run) |
| `monkos-ops/` | 운영 체계 (ops/tech/contents/marketing) |
| `governance/` | 법률+역사+철학 (정본) |
| `docs/` | 참고문헌+아카이브 |
| `apps/` | 프로토타입/PoC |
| `functions/` | CF Workers |
| `scripts/` | 범용 유틸 |

## 지시서 운용 원칙
- 발행 = 파일 작성 + 마크다운 링크로 제시
- 강제규정: 위반 가능성 높은 조항만 선별 워닝 (`⚠️ 준수 조항`)
- 배분: 1건씩 분리 제시, 파일 경로 충돌 체크

## 세션 로그 패턴
- 쌍아: `monkos-ops/ops/sessions/YYYY-MM-DD_{디바이스}_쌍아.md`
- 막내: `monkos-ops/ops/sessions/YYYY-MM-DD_{디바이스}_막내N.md`

## 리소스 운용
- {디바이스별 쿼터 설정}

## 연락처
- info@monkos.ai / 010-7217-2060(텔레그램)
```

### iMac용 예시 (차이점만)

```markdown
# CLAUDE.local.md — iMac

> 이 파일은 .gitignore 처리. iMac에서 monk_project 작업 시 적용.

## 팀 인적 인프라
(템플릿과 동일)

## 통신 경로
(템플릿과 동일 + iMac 고유)
- 철창이 수거: ~/Desktop/철창이/ (자동 인입 대기 — 어젠다 #13)

## 리소스 운용
- Opus 쿼터 → 작가님 대화형 (쌍아 + 막내 운용)
- 사무실 메인 워크스테이션: 풀 스펙 작업 가능
```

### M2(꾸)용 차이점

```markdown
# CLAUDE.local.md — M2

## 통신 경로
- 로컬 우체통: ~/kku/ (inbox/outbox/reference)
- iMac 접근: SSH 불가 (역방향만 — iMac에서 sshm2로 접근)

## 리소스 운용
- Sonnet 쿼터 → 꾸 전용 (생활/업무 자동화)
```

### M4(한)용 차이점

```markdown
# CLAUDE.local.md — M4

## 통신 경로
- 팀 우체통: `monkos-ops/marketing/han/` (inbox/outbox/reference)
- SSH 직접 연결 ❌ (텔레그램 + GDrive 접점)

## 리소스 운용
- Sonnet 쿼터 → 한 전용 (SNS/마케팅)
```

---

## 4. Layer 3: 하위폴더 `CLAUDE.md` — 배치도

### 배치 판정 기준

L3 CLAUDE.md 배치 여부는 다음 3가지 조건으로 판정한다:

1. **독립 배포라인**: 해당 폴더가 독자적 배포 대상인가
2. **고유 기술 스택**: L2와 다른 코딩 규칙/도구가 필요한가
3. **반복 위반 이력**: 해당 폴더에서 반복적으로 발생한 실수가 있는가

3개 중 2개 이상 해당 → ✅ 배치, 1개 이하 → ❌ README로 충분

### 배치도

| 폴더 | L3 필요 | 담을 내용 | 근거 |
|------|---------|----------|------|
| `MONK_kr/` | ✅ | CF Pages 배포 규칙, Vanilla HTML/CSS/JS 코딩 스타일, `functions/` 연동 주의사항, wrangler.toml 참조 | 독립 배포라인(CF Pages) + 고유 스택(Vanilla JS) |
| `monkos_AI/` | ✅ | Cloud Run 배포 규칙, Node.js/Express 패턴, 환경변수 관리(.env → Secret Manager), I2I 규칙(헌법 9조 참조), responseModalities 금지 | 독립 배포라인(Cloud Run) + 고유 스택(Node.js) + 반복 위반(responseModalities) |
| `monkos_AI/portal/` | ❌ | — | 상위 `monkos_AI/` L3가 커버. README로 충분 |
| `monkos_AI/idphoto-kr/` | ❌ | — | 상위 `monkos_AI/` L3가 커버. README로 충분 |
| `monkos_AI/idphoto-jp/` | ❌ | — | 상위 `monkos_AI/` L3가 커버. README로 충분 |
| `monkos-ops/` | ❌ | — | 운영체제는 L2 소관. 4부서 README 체계로 충분 |
| `governance/` | ❌ | — | 법적 문서는 자체 규격(amendment.md) 보유. README 충분 |
| `functions/` | ✅ | CF Workers 전용 규칙, **루트 `functions/`만 정본** (symlink/tmp 실패), API 라우팅 패턴, photo.js responseModalities 금지 패턴 | 독립 배포라인(CF Workers) + 반복 위반(정본 경로 혼동 + responseModalities) |
| `scripts/` | ❌ | — | 범용 유틸, 독자 규칙 불필요. README로 충분 |
| `docs/` | ❌ | — | 참고문헌 체제(읽기 위주). L2 ch4가 규칙 담당 |
| `apps/` | ❌ | — | 프로토타입/PoC 성격. 독자 규칙 불필요 |

### L3 파일 초안

#### `MONK_kr/CLAUDE.md`

```markdown
# MONK_kr — Cloudflare Pages

> monk.kr 본진 데스크톱 사이트

## 배포
- **대상**: Cloudflare Pages (`monk-kr`)
- **빌드**: 정적 HTML/CSS/JS (프레임워크 없음)
- **배포 명령**: `wrangler pages deploy` 또는 Git push → 자동 빌드
- 배포 전 작가님 승인 필수 (ch5 배포 규칙 준수)

## 코딩 규칙
- **스택**: Vanilla HTML + CSS + JavaScript (프레임워크/번들러 없음)
- **스타일**: 디자인 시스템 참조 → `docs/infrastructure/guides/DESIGN_SYSTEM.md`
- **인코딩**: UTF-8, 한국어 기본

## 주의사항
- `functions/` 연동: CF Workers API 호출 시 루트 `functions/` 참조 (MONK_kr/ 내부 아님)
- 로그인 팝업: monk_studio/ 하위 photolab 영역
- I2I 호출 시 `responseModalities` 사용 금지 (photo.js 패턴 준수)
```

#### `monkos_AI/CLAUDE.md`

```markdown
# monkos_AI — Cloud Run (monkos.ai)

> 모바일 AI 분기 서비스

## 배포
- **대상**: Google Cloud Run
- **빌드**: Docker → `gcloud run deploy`
- **서비스**: portal, idphoto-kr, idphoto-jp (각각 독립 Cloud Run 서비스)
- 배포 전 작가님 승인 필수 (ch5 배포 규칙 준수)

## 코딩 규칙
- **스택**: Node.js + Express
- **환경변수**: `.env` 로컬 전용. 프로덕션은 Secret Manager 사용
- `.env` 수정 시 작가님 승인 필수 (헌법 6조)

## I2I 규칙 (헌법 9조 참조)
- 원본 인물 정체성 90%+ 보존 필수
- `responseModalities` I2I에서 사용 금지
- 90:10 = 세이프가드 우회 전략 (리터칭 강도 아님)

## 하위 서비스
| 폴더 | 서비스 | Cloud Run |
|------|--------|-----------|
| `portal/` | monkos.ai 포털 | monkos-portal |
| `idphoto-kr/` | 한국 증명사진 | monkos-idphoto-kr |
| `idphoto-jp/` | 일본 증명사진 | monkos-idphoto-jp |
```

#### `functions/CLAUDE.md`

```markdown
# functions/ — Cloudflare Workers

> monk.kr API 엔드포인트 (CF Workers)

## 정본 원칙
- **이 루트 `functions/` 폴더만 정본이다**
- symlink, tmp, 다른 위치의 functions 복사본 → 전부 무효
- MONK_kr/ 내부의 functions는 존재하지 않음 — 루트만 유효

## 배포
- **대상**: Cloudflare Workers (monk.kr/api/*)
- `wrangler.toml` 참조
- 배포 전 작가님 승인 필수

## 코딩 규칙
- **스택**: JavaScript (Workers 런타임)
- `api/` 하위에 라우팅
- `responseModalities` 사용 금지 (photo.js 패턴 준수)

## 디버깅 교훈
- Credential `l`/`I` 혼동 주의: hex dump 비교 필수
- 환경변수는 Cloudflare Dashboard에서 설정 (코드 하드코딩 절대 금지)
```

---

## 5. 마이그레이션 후 MEMORY.md 예상 변화

4계층 도입으로 현행 MEMORY.md의 상당 부분이 L1·L2.5로 이관된다.

### 이관 매핑

| 현행 MEMORY.md 섹션 | 이관 대상 | MEMORY에서 |
|---------------------|----------|-----------|
| `## 이 디바이스: iMac` | L1 `~/.claude/CLAUDE.md` | **삭제** |
| `## 역할 자동 인식` | L1 에이전트 바인딩 | **삭제** |
| `## 팀 인적 인프라` | L2.5 `CLAUDE.local.md` | **삭제** |
| `## 팀 우체통 시스템` | L2.5 통신 경로 | **삭제** |
| `## 사업 구조` | L2.5 사업 구조 | **삭제** |
| `## 프로젝트 폴더 위상` | L2.5 폴더 위상 | **삭제** |
| `## 운영 철학` | L2.5 또는 MEMORY Zone A | 검토 필요 |
| `## 리소스 운용` | L2.5 리소스 운용 | **삭제** |
| `## 작가님 인사이트` | MEMORY Zone A 잔류 | **유지** |
| `## 디버깅 교훈` | MEMORY Zone E 잔류 | **유지** |
| `## 지시서 운용 원칙` | L2.5 지시서 운용 | **삭제** |
| `## 연락처` | L2.5 연락처 | **삭제** |
| `## 세션 로그 파일명 패턴` | L2.5 세션 로그 패턴 | **삭제** |
| `## MEMORY 출납 로그` | MEMORY meta 잔류 | **유지** |
| `## 세션 시작/마감 프로세스` | MEMORY Zone D 잔류 | **유지** |
| `## 외장 메모리` | MEMORY Zone C 잔류 | **유지** |

### 이관 후 MEMORY.md 예상 규모

| Zone | 현행 (추정) | 이관 후 |
|------|-----------|---------|
| Zone A: 디폴트값 | ~72줄 | ~25줄 (구조 정보 이관 후 철학/인사이트만 잔류) |
| Zone B: 엔진 상태판 | ~15줄 | ~15줄 (변동 없음) |
| Zone C: 모듈 카탈로그 | ~60줄 | ~60줄 (변동 없음) |
| Zone D: 세션 프로토콜 | ~15줄 | ~15줄 (변동 없음) |
| Zone E: 확장 버퍼 | ~38줄 | ~85줄 (**확장 여유 대폭 증가**) |
| **합계** | ~199줄 | ~200줄 (용량은 동일, 구조 정보→학습/모듈 공간 전환) |

**핵심 효과**: 구조 정보(~75줄)가 L1·L2.5로 이관되면, 그 자리에 토픽 모듈·학습 노트를 더 담을 수 있다. MEMORY의 본령(에이전트 부트로더)에 집중하는 구조.

---

## 6. 실행 로드맵 (제안)

| # | 작업 | 의존 | 난이도 | 비고 |
|---|------|------|--------|------|
| 1 | `.gitignore`에 `CLAUDE.local.md` 추가 | — | 낮음 | 선행 필수 |
| 2 | `governance/constitution/articles.md` 생성 (현행 13조 이관) | — | 낮음 | 복사+정리 |
| 3 | `CLAUDE.md` 라우팅 테이블로 리팩토링 | #2 | 중간 | 현행 → 신규 교체 |
| 4 | L1 파일 6종 배포 (각 디바이스 `~/.claude/CLAUDE.md`) | — | 중간 | 디바이스별 수동 배치 |
| 5 | L2.5 `CLAUDE.local.md` 생성 (iMac 먼저) | #1 | 중간 | 현행 MEMORY에서 이관 |
| 6 | L3 CLAUDE.md 3종 생성 (MONK_kr, monkos_AI, functions) | — | 낮음 | 본 보고서 초안 활용 |
| 7 | MEMORY.md 이관 보정 (L1·L2.5로 이관된 항목 삭제) | #4, #5 | 중간 | 어젠다 #5 연동 |
| 8 | 타 디바이스 L1·L2.5 배포 (M1, M2, M4, 4060, iPhone) | #4, #5 | 중간 | 디바이스 접근 필요 |

**우선순위**: #1 → #2 → #3 → #6 (Git 작업, 즉시 가능) → #4, #5 (iMac 로컬) → #7 → #8 (순차 배포)

---

## 7. 설계 포인트 요약

1. **L1은 디바이스 정체성의 유일한 원천이다.** MEMORY에서 디바이스 정보를 이관함으로써 MEMORY는 본령(부트로더)에 집중한다.

2. **L2는 라우팅 테이블이다.** 헌법 전문을 `articles.md`로 분리하되, 요약 1줄은 인라인 유지하여 에이전트가 규칙의 존재를 인지한다. 컨텍스트 65% 절감.

3. **L2.5는 MEMORY와 역할을 분담한다.** 정적 구조(팀/경로/폴더) → L2.5, 동적 상태(세션/학습/모듈) → MEMORY. 중복 제거.

4. **L3은 배포라인 단위로 배치한다.** 독립 배포라인 + 고유 기술 스택 + 반복 위반 이력 기준. 과잉 배치 방지.

5. **Git 경계가 곧 공유/귀속 경계다.** L2·L3 = Git 공유 → 팀 규칙. L1·L2.5·MEM = 비공유 → 디바이스 귀속.
