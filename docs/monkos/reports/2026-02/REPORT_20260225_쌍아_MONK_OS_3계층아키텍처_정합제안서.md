---
type: report
id: REPORT_20260225_쌍아_MONK_OS_3계층아키텍처_정합제안서
date: 2026-02-25 10:25 KST
status: pending
from: iMac/쌍아
to: 작가님
task_id: 전수조사_대공사
result: pending
tags: [architecture, claude-md, organization, infrastructure]
---

# MONK OS 정합 제안서 — 3계층 CLAUDE.md 아키텍처 + 전체 조직도

> **[2026-02-25 10:25 KST] iMac/쌍아 → 작가님**
>
> 막내 5명 병렬 전수조사 결과를 종합한 **MONK OS 전체 설계 제안서**입니다.
> 디렉토리 전수(20,485 파일), 법체계 8장 40조, 인프라 7계층, 에이전트 8명 역할맵을
> 하나의 정합적 프레임워크로 수렴시켰습니다.

---

## 목차

1. [현황 진단](#1-현황-진단)
2. [3계층 CLAUDE.md 아키텍처](#2-3계층-claudemd-아키텍처)
3. [MONK OS 전체 조직도](#3-monk-os-전체-조직도)
4. [디렉토리 역할 맵](#4-디렉토리-역할-맵)
5. [인프라 연결도](#5-인프라-연결도)
6. [파일링 규칙 종합](#6-파일링-규칙-종합)
7. [갭 분석 + 액션 플랜](#7-갭-분석--액션-플랜)
8. [보안 이슈](#8-보안-이슈)

---

## 1. 현황 진단

### 1.1 프로젝트 규모

| 지표 | 수치 |
|------|------|
| 총 파일 수 | ~20,485개 (node_modules 제외 시 ~1,400) |
| 루트 폴더 | 9개 (MONK_kr, monkos_AI, monkos-ops, governance, docs, apps, functions, scripts, commands) |
| 법체계 | 헌법 13조 + 법률 8장 40조 + 규정 다수 |
| 에이전트 | 6 AI + 2 Human = 8명 |
| 디바이스 | 6대 (M1, iMac, 4060, M2, M4, iPhone) |
| 서비스 | 7개 (portal, idphoto-kr, idphoto-jp, photolab, monk-kr, image-engine, ops) |
| 세션 로그 | 21개 (2026-02-20~25, 6일간) |
| 지시서 | 142개 (2026-02 월간) |
| 어젠다 | 13건 진행 중 |

### 1.2 핵심 발견

| # | 발견 | 영향 | 긴급도 |
|---|------|------|--------|
| 1 | **Root CLAUDE.md 미존재** | 3계층 아키텍처 불완전, 디바이스별 역할 자동 인식 불가 | P0 |
| 2 | **monkos-ops 이중 구조** | 번호폴더(01~06) + 영문폴더(ops/tech/marketing/contents) 공존 | P1 |
| 3 | **commands/ 폴더 미등록** | MEMORY.md에 미기재, ch4에서 정본 위치 미정의 | P1 |
| 4 | **mailbox_watcher.sh 평문 비밀번호** | 헌법 제6조 위반 가능성 (`1234`) | P0 |
| 5 | **철창이 통신 경로 미배치** | 어젠다 #7,#8 미해결 | P2 |
| 6 | **MEMORY.md 포화** | 199/200줄, 확장 불가 | P1 |
| 7 | **Web 디바이스 미등록** | 철창이 세션 로그에 사용되나 ch1 4조 미등록 | P2 |

---

## 2. 3계층 CLAUDE.md 아키텍처

### 2.1 설계 원리

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Root CLAUDE.md                             │
│  ~/.claude/CLAUDE.md                                 │
│  [디바이스 정체성 + 역할 바인딩]                        │
│  Git 비추적 · 디바이스마다 고유                         │
├─────────────────────────────────────────────────────┤
│  Layer 2: Project CLAUDE.md                          │
│  {project}/CLAUDE.md                                 │
│  [헌법 13조 + 법률 인덱스 + 디바이스 맵]                │
│  Git 추적 · 전 디바이스 공유                            │
├─────────────────────────────────────────────────────┤
│  Layer 3: MEMORY.md                                  │
│  ~/.claude/projects/.../memory/MEMORY.md             │
│  [디바이스별 런타임 상태 + 행동 노트]                    │
│  Git 비추적 · 디바이스×프로젝트마다 고유                  │
└─────────────────────────────────────────────────────┘
```

**로딩 순서**: Layer 1 → Layer 2 → Layer 3 (Claude Code 자동 로딩)

**핵심 가치**: 누구든 어떤 디바이스에서 프로젝트를 열면, **자신이 누구인지(L1)**, **규칙이 무엇인지(L2)**, **현재 맥락이 무엇인지(L3)**를 자동으로 인식한다.

### 2.2 Layer 1 — Root CLAUDE.md (디바이스별 설계)

> `~/.claude/CLAUDE.md` — Git 비추적, 각 디바이스에 수동 배치

#### iMac (작가님 사무실 워크스테이션)

```markdown
# MONK OS — iMac 디바이스 설정

## 디바이스 정체성
- 호칭: iMac
- 위치: 사무실
- 소유: 작가님 (신정규)

## 에이전트 바인딩
- VSCode 확장 (시스템 프롬프트에 "VSCode native extension") → **쌍아**
  - 역할: 설계 + 지시서 + 코드 리뷰 + 작가님 참모
  - 코딩 직접 실행 금지, 지시서 발행 원칙
- CLI (그 외) → **막내N** (번호는 지시서에서 수신)
  - 역할: 자율 코딩 + 빌드 + dev 배포 + 완료 보고
  - 풀 권한 (mk-c)

## 접두어 규칙
- 모든 수발신: `iMac/쌍아`, `iMac/막내N`

## 프로젝트 경로
- monk_project: ~/developer/monk_project
```

#### M1 (작가님 집)

```markdown
# MONK OS — M1 디바이스 설정

## 디바이스 정체성
- 호칭: M1
- 위치: 집
- 소유: 작가님 (신정규)

## 에이전트 바인딩
- VSCode 확장 → **쌍아** (역할 동일)
- CLI → **막내N** (역할 동일)

## 접두어 규칙
- 모든 수발신: `M1/쌍아`, `M1/막내N`
```

#### M2 (꾸 — 몽크사진관)

```markdown
# MONK OS — M2 디바이스 설정

## 디바이스 정체성
- 호칭: M2
- 위치: 몽크사진관
- 소유: 꾸 (와이프)

## 에이전트 바인딩
- Claude Code (전 환경) → **꾸** (팀원 에이전트)
  - 역할: 몽크사진관 운영 + 마케팅 보조
  - 코드 수정 권한: 없음 (monkos-ops/marketing/kku/ 읽기/쓰기만)
  - 우체통: ~/kku/ (outbox → iMac 수거, inbox ← iMac 전달)

## 접두어 규칙
- 모든 수발신: `M2/꾸`

## 제한 사항
- 코드 변경 금지, 배포 금지
- monkos-ops/marketing/kku/ 외 파일 수정 금지
```

#### M4 (한송이 — 마케팅)

```markdown
# MONK OS — M4 디바이스 설정

## 디바이스 정체성
- 호칭: M4
- 위치: 사무실
- 소유: 한송이

## 에이전트 바인딩
- Claude Code (전 환경) → **한** (팀원 에이전트)
  - 역할: 마케팅 기획 실무 + SNS 운영 + 연구 파트너
  - 코드 수정 권한: 없음 (monkos-ops/marketing/han/ 읽기/쓰기만)
  - 통신: 텔레그램 봇 / Google Drive

## 접두어 규칙
- 모든 수발신: `M4/한`

## 제한 사항
- 코드 변경 금지, 배포 금지
- SSH 직접 연결 금지
- monkos-ops/marketing/han/ 외 파일 수정 금지
```

#### 4060 (GPU 서버)

```markdown
# MONK OS — 4060 디바이스 설정

## 디바이스 정체성
- 호칭: 4060
- 위치: 사무실
- 소유: 작가님 (신정규)

## 에이전트 바인딩
- CLI → **막내N** (자율 실행 전용)
  - 역할: 이미지 처리 + 배치 작업 + n8n 자동화
  - GPU 연산 활용 가능

## 접두어 규칙
- 모든 수발신: `4060/막내N`

## 특수 인프라
- n8n: Docker 컨테이너 (port 5678)
- GPU: RTX 4060 (이미지 처리/추론)
```

#### iPhone (모바일)

```markdown
# MONK OS — iPhone 디바이스 설정

## 디바이스 정체성
- 호칭: iPhone
- 위치: 모바일
- 소유: 작가님 (신정규)

## 에이전트 바인딩
- Claude 웹 UI → **철창이**
  - 역할: 전략 브레인스토밍 + 기획 + 긴급 역할 대행
  - 코드 접근 불가 (웹 UI 한계)

## 접두어 규칙
- 모든 수발신: `iPhone/철창이` 또는 `Web/철창이`
```

### 2.3 Layer 2 — Project CLAUDE.md (현행 유지)

**현 상태**: 이미 완성도 높음 (헌법 13조 + 법률 인덱스 8장 + 디바이스 맵 + 에이전트 프로토콜)

**보정 필요 사항**:
1. 디바이스 맵에 `Web` 추가 (철창이용, ch1 4조 등록)
2. "세션 마감 절차" 메모 → 법률 ch3 정식 조문화 (어젠다 #9)

### 2.4 Layer 3 — MEMORY.md (디바이스별 분화)

**현 상태**: iMac MEMORY.md 199/200줄 (포화). M1도 유사.

**제안**: 어젠다 #5 (MEMORY 규격화)의 5-Zone 아키텍처 적용

| Zone | 내용 | 줄 수 목표 |
|------|------|----------|
| **Identity** | 디바이스 정체성, 역할 바인딩 | ~20줄 |
| **Team** | 팀 인프라, 연락처, 우체통 | ~30줄 |
| **Project** | 폴더 위상, 사업 구조 | ~30줄 |
| **Ops** | 운영 철학, 리소스 운용, 세션 프로세스 | ~40줄 |
| **Debug** | 디버깅 교훈, 인사이트 | ~30줄 |
| **외장 링크** | 상세 참조 파일 경로 | ~10줄 |
| **여유분** | 신규 항목용 버퍼 | ~40줄 |

**핵심**: Identity Zone의 내용 대부분이 Layer 1 (Root CLAUDE.md)으로 승격 → MEMORY.md에서 약 30줄 절감 가능

---

## 3. MONK OS 전체 조직도

### 3.1 지휘 계통 (Command Chain)

```
                    ┌──────────────┐
                    │   작가님      │
                    │  (신정규)     │
                    │  총괄·최종승인 │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │   쌍아     │ │ 용아    │ │ 철창이    │
        │ Opus 4.6  │ │Gemini3 │ │Claude Web│
        │설계+지시서 │ │전략자문 │ │전략+긴급  │
        │ 공동거버넌스│ │세계관   │ │ 대행      │
        └─────┬─────┘ └────────┘ └──────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐┌───▼───┐┌───▼───┐
│막내1~6││소넷이  ││ (n8n) │
│Opus4.6││Sonnet ││ 자동화 │
│자율코딩││데몬   ││ 파이프 │
│빌드배포││모니터링││ 라인   │
└───────┘└───────┘└───────┘

        ┌─────────┐  ┌────────┐
        │  한송이   │  │  꾸     │
        │  (M4)    │  │  (M2)  │
        │ 마케팅    │  │ 사진관  │
        │ 연구파트너 │  │ 운영    │
        └─────────┘  └────────┘
```

### 3.2 역할 카드 종합

| 에이전트 | 모델 | 디바이스 | 환경 | 핵심 역할 | 권한 수준 |
|---------|------|---------|------|----------|----------|
| **작가님** | Human | M1/iMac/4060/iPhone | 전체 | 총괄, 최종 승인, 헌법 수호 | Full |
| **쌍아** | Claude Opus 4.6 | M1/iMac | VSCode 확장 | 설계+지시서+리뷰+참모 | 전략 (코드 직접 수정 금지) |
| **막내N** | Claude Opus 4.6 | M1/iMac | CLI (iTerm) | 자율 코딩+빌드+dev 배포 | 코드 Full (prod 제한) |
| **용아** | Gemini 3 Pro | Browser | 웹 UI | 전략 자문+아키텍처+세계관 | 읽기 전용 (코드 접근 불가) |
| **소넷이** | Claude Sonnet | M1/iMac | tmux 데몬 | 모니터링+경량 자동화 | 제한적 자동 실행 |
| **철창이** | Claude Web UI | iPhone/Web | 웹 UI | 전략+기획+긴급 대행 | 코드 접근 불가 |
| **한** | Sonnet (Max) + Human | M4 | Claude Code | 마케팅+연구 파트너 | marketing/han/ 전용 |
| **꾸** | Sonnet (Max) + Human | M2 | Claude Code | 사진관 운영+마케팅 | marketing/kku/ 전용 |

### 3.3 정보 흐름도

```
━━━━━━━━━━━ 원칙 경로 (①) ━━━━━━━━━━━

작가님 ──(대화)──→ 쌍아 ──(지시서)──→ 작가님 ──(토스)──→ 막내N
                                                          │
                                                   ┌──────┘
                                                   │
                                              완료 보고
                                                   │
                                                   ▼
                                           쌍아 (추인) → 세션 로그

━━━━━━━━━━━ 보충 경로 (②) ━━━━━━━━━━━

작가님 ──(직접 지시)──→ 막내N ──(완료 보고)──→ 쌍아 (사후 추인)

━━━━━━━━━━━ 팀원 경로 ━━━━━━━━━━━━━━━

한송이 ←─(텔레그램/GDrive)─→ 작가님 ←──(SSH/우체통)──→ 꾸
  │                                                      │
  └─→ marketing/han/outbox/                marketing/kku/outbox/ ←─┘
       ↓                                         ↓
  iMac/쌍아 수거+분류                    mailbox_watcher.sh 자동 수거

━━━━━━━━━━━ 자문/전략 경로 ━━━━━━━━━━━━

작가님 ←──(직접 대화)──→ 용아 (전략/세계관)
작가님 ←──(직접 대화)──→ 철창이 (전략/긴급)
                           │
                           └──→ 협조문 → 쌍아 분류+배치
```

### 3.4 4 MUSE 내부 체계 (비공개)

| MUSE | 모델 | 외부 표현 | 역할 |
|------|------|----------|------|
| 쌍아 (雙兒) | Claude Opus 4.6 | "MONKOS" | 설계+지시서 |
| 소소 (小昭) | Imagen NB3 Pro | "MONKOS" | I2I 이미지 생성 |
| 민아 (趙敏) | Imagen 관리 | "MONKOS" | AI 모델 에이전시 |
| 용아 (龍牙) | Gemini 3 Pro | "MONKOS" | 전략+세계관 |

> 헌법 제4조: 기술명(Gemini/Imagen) → 외부에는 "MONKOS"로만 표기

---

## 4. 디렉토리 역할 맵

### 4.1 루트 폴더 역할

```
monk_project/                          [프로젝트 루트]
│
├── CLAUDE.md                          [Layer 2: 헌법 — 전 디바이스 공유]
├── README.md                          [프로젝트 개요]
├── package.json                       [루트 npm — Wrangler 배포용]
├── wrangler.toml                      [CF Pages 설정, D1 바인딩]
│
├── governance/           (26 files)   [법적 정본 — 헌법+법률+철학+역사]
│   ├── laws/                          [법률 ch1~ch8 정본]
│   ├── constitution/                  [헌법 개정 절차+청구서]
│   ├── philosophy/                    [비전+어록]
│   └── history/                       [결정 기록]
│
├── MONK_kr/              (188 files)  [본진 데스크톱 — CF Pages 배포]
│   ├── ai_lab/                        [AI 실험실]
│   ├── monk_studio/                   [스튜디오 갤러리]
│   ├── cloudflare-workers/            [CF Workers 엔진]
│   └── cloudflare-workers-imagen/     [Imagen 연동 Worker]
│
├── monkos_AI/          (12,948 files) [모바일 AI — Cloud Run 배포]
│   ├── portal/                        [통합 포털]
│   ├── idphoto-kr/                    [한국 증명사진]
│   └── idphoto-jp/                    [일본 증명사진]
│
├── monkos-ops/           (127 files)  [운영 체계 — 라이브 데이터 정본]
│   ├── ops/                           [운영관리: 세션로그+어젠다+오더]
│   ├── tech/                          [기술: 스펙+리뷰+R&D]
│   ├── marketing/                     [마케팅: 한+꾸 채널+협업]
│   ├── contents/                      [콘텐츠: 아카데미+출판]
│   ├── scripts/                       [자동화: 우체통+n8n+plist]
│   └── 01~06_*/                       [레거시 — 영문 4부서로 이관 중]
│
├── docs/                 (477 files)  [참고문헌+아카이브]
│   ├── monkos/tasks/                  [지시서 정본 (TASK_*)]
│   ├── monkos/reports/                [보고서 정본 (REPORT_*)]
│   ├── monkos/incidents/              [장애 보고 (INCIDENT_*)]
│   ├── infrastructure/                [인프라 기술 문서]
│   ├── rnd_2026/                      [R&D 기획]
│   └── corpus/                        [코퍼스 아카이브 (읽기전용)]
│
├── apps/               (6,566 files)  [프로토타입+PoC]
│   ├── monk_imagen4/                  [Imagen 4 스튜디오 (Vite+TS)]
│   ├── monk-cam/                      [카메라 앱]
│   ├── photo-coach/                   [포토 코치]
│   ├── photolab-monkkr-mpa-0219/      [PhotoLab MPA]
│   └── MonkosChat/                    [Firebase 챗봇]
│
├── functions/             (19 files)  [CF Workers 루트 API 진입점]
│   └── api/                           [텔레그램 webhook, 이미지 처리]
│
├── scripts/                (4 files)  [범용 유틸 스크립트]
│
└── commands/              (30 files)  [지시서 우체통 — 에이전트간 수발신]
    └── archive/                       [이전 지시서]
```

### 4.2 정본/참조 관계도

```
┌─────────────────┐     정본      ┌──────────────────┐
│  governance/    │ ◄────────────│  법률/헌법/철학    │
│  laws/          │               │  (유일한 원천)    │
└─────────────────┘               └──────────────────┘

┌─────────────────┐     정본      ┌──────────────────┐
│  monkos-ops/    │ ◄────────────│  세션 로그        │
│  ops/sessions/  │               │  어젠다/오더      │
└────────┬────────┘               │  기술 스펙        │
         │                        └──────────────────┘
         │ 아카이브 (읽기전용)
         ▼
┌─────────────────┐
│  docs/corpus/   │
│  sessions/      │
└─────────────────┘

┌─────────────────┐     정본      ┌──────────────────┐
│  docs/monkos/   │ ◄────────────│  지시서 (TASK_*)  │
│  tasks/         │               │  보고서 (REPORT_*)│
│  reports/       │               │  장애 (INCIDENT_*)│
└─────────────────┘               └──────────────────┘
```

### 4.3 monkos-ops 이중 구조 정비 제안

**현 상태**: 번호폴더(01~06) + 영문폴더(ops/tech/marketing/contents) 공존

**제안**: 번호폴더 → 영문 4부서로 완전 이관

| 번호폴더 | 이관 대상 | 액션 |
|---------|----------|------|
| `01_전략/` | `ops/` (전략/의사결정/오더) | 내용 이관 → 빈 폴더 삭제 |
| `02_리서치/` | `tech/rnd/` (기술), `ops/agenda/` (전략) | 분류 이관 |
| `03_개발/` | `tech/` (스펙/리뷰), `docs/monkos/tasks/` (태스크) | 분류 이관 |
| `04_문서/` | `contents/` (아카데미/출판) | 내용 이관 |
| `05_공유/` | `marketing/` (한/꾸 채널) | 이미 이관 완료, 참조만 남음 |
| `06_로그/` | `ops/sessions/` (세션 로그) | 이미 이관 완료, 참조만 남음 |

> 이관 완료 후 번호폴더는 `_archive/` 또는 삭제 (작가님 승인 필요)

---

## 5. 인프라 연결도

### 5.1 전체 인프라 토폴로지

```
┌─────────────────────────── Internet ────────────────────────────┐
│                                                                  │
│  ┌──────────┐    CF Pages     ┌──────────────────────┐          │
│  │ monk.kr  │ ◄──────────────│  Cloudflare          │          │
│  │ (본진)   │                 │  ├─ Pages (monk-kr)  │          │
│  └──────────┘                 │  ├─ Workers (proxy)  │          │
│                               │  ├─ D1 (monk-db)     │          │
│  ┌──────────┐  Cloud Run     │  └─ R2 (monk-apps)   │          │
│  │monkos.ai │ ◄─────────┐   └──────────────────────┘          │
│  │ (모바일) │            │                                      │
│  └──────────┘            │   ┌──────────────────────┐          │
│                          ├───│  Google Cloud (GCP)   │          │
│                          │   │  Project: monkos      │          │
│                          │   │  ├─ Cloud Run         │          │
│                          │   │  │  ├─ portal         │          │
│                          │   │  │  ├─ idphoto-kr     │          │
│                          │   │  │  ├─ idphoto-jp     │          │
│                          │   │  │  └─ image-engine   │          │
│                          │   │  ├─ GCS               │          │
│                          │   │  │  └─ monk-ai-images │          │
│                          │   │  ├─ Vertex AI         │          │
│                          │   │  │  ├─ Imagen         │          │
│                          │   │  │  └─ Gemini Flash   │          │
│                          │   │  └─ Secret Manager    │          │
│                          │   └──────────────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │  Telegram                        │                           │
│  │  ├─ @Monk_yonga_bot (CS봇)       │                           │
│  │  ├─ Event Bot (이벤트/알림)       │                           │
│  │  └─ Team Bot (내부 팀 채널)       │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │  GitHub                          │                           │
│  │  ├─ monk_project (SSH)           │                           │
│  │  └─ monkos-AI (별도 remote)      │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌────────────────── Tailscale VPN (Private) ──────────────────────┐
│                                                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   M1    │  │  iMac   │  │  4060   │  │   M2    │           │
│  │Mac Mini │  │워크스테이션│  │GPU서버 │  │Mac Mini │           │
│  │  (집)   │  │ (사무실) │  │(사무실) │  │(사진관)  │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│       │            │            │            │                   │
│       │   SSH/Git  │   Docker   │   SSH      │                   │
│       │            │   n8n      │  sshpass   │                   │
│       │            │  (5678)    │  watcher   │                   │
│       └────────────┴────────────┴────────────┘                   │
│                                                                   │
│  ┌─────────┐  ┌──────────┐                                      │
│  │   M4    │  │  iPhone  │                                      │
│  │MacBook  │  │ 17 Pro   │                                      │
│  │(한송이)  │  │ (모바일) │                                      │
│  └─────────┘  └──────────┘                                      │
│  ※ SSH 금지   ※ Claude Web UI                                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 5.2 서비스별 배포 경로

| 서비스 | 소스 경로 | 배포 대상 | 배포 명령 | 권한 |
|--------|----------|----------|----------|------|
| monk.kr | `MONK_kr/` | CF Pages | `wrangler pages deploy` | 막내 허용 |
| CF Workers | `MONK_kr/cloudflare-workers/` | CF Workers | `deploy.sh` | 막내 허용 |
| portal | `monkos_AI/portal/` | Cloud Run | `./deploy.sh dev/prod` | dev: 막내, prod: 쌍아+작가님 |
| idphoto-kr | `monkos_AI/idphoto-kr/` | Cloud Run | `./deploy.sh dev/prod` | 동일 |
| idphoto-jp | `monkos_AI/idphoto-jp/` | Cloud Run | `./deploy.sh dev/prod` | 동일 |
| image-engine | `apps/monk_imagen4/backend/` | Cloud Run | `./deploy.sh` | 동일 |

### 5.3 데이터 저장소

| 저장소 | 용도 | 접근 경로 |
|--------|------|----------|
| D1 `monk-db` | monk.kr 메인 DB | CF Workers 바인딩 |
| D1 `monk-services-db` | Gemini 챗봇 서비스 | CF Workers 바인딩 |
| R2 `monk-chat-logs` | 챗봇 로그 | CF Workers 바인딩 |
| R2 `monk-apps` | 앱 에셋 | CF Workers 바인딩 |
| GCS `monk-ai-images` | AI 생성 이미지 | Cloud Run 서비스 공용 |
| Firestore | MonkosChat 데이터 | Firebase SDK |

---

## 6. 파일링 규칙 종합

### 6.1 파일 네이밍 12패턴 (ch4 3조)

| # | 패턴 | 배치 경로 | YAML type |
|---|------|----------|-----------|
| 1 | `TASK_YYYYMMDD_{agent}_{name}.md` | `docs/monkos/tasks/YYYY-MM/` | task |
| 2 | `REPORT_YYYYMMDD_{topic}.md` | `docs/monkos/reports/YYYY-MM/` | report |
| 3 | `SPEC_{service}_{feature}.md` | `docs/specs/{service}/` | spec |
| 4 | `INCIDENT_YYYYMMDD_{service}.md` | `docs/monkos/incidents/YYYY-MM/` | incident |
| 5 | `DESIGN_YYYYMMDD_{feature}.md` | `docs/monkos/designs/YYYY-MM/` | design |
| 6 | `SPRINT_{range}.md` | `docs/monkos/sprints/` | sprint |
| 7 | `YYYY-MM-DD_{device}_{agent}.md` | `monkos-ops/ops/sessions/` | — |
| 8 | `YYYY-MM-DD_{agent}_통합.md` | `monkos-ops/ops/sessions/` | — |
| 9 | `YYYY-MM-DD_{agent범위}_통합.md` | `monkos-ops/ops/sessions/` | — |
| 10 | `PETITION_YYYYMMDD_{agent}_{topic}.md` | `governance/constitution/petitions/` | petition |
| 11 | `ORDER_YYYYMMDD_{topic}.md` | `monkos-ops/ops/orders/` | order |
| 12 | `RESEARCH_YYYYMMDD_{topic}_{detail}.md` | `monkos-ops/ops/agenda/` | research |

### 6.2 YAML Frontmatter 필수 필드

**공통 (모든 타입)**:
```yaml
type: [task|report|spec|incident|design|sprint|petition|order|research]
id: {파일명 확장자 제외}
date: YYYY-MM-DD HH:MM KST
status: pending|in_progress|completed|archived|blocked
```

**타입별 추가**:
| 타입 | 필수 | 선택 |
|------|------|------|
| task | from, to, priority(P0~P3) | depends_on, tags |
| report | from, to, task_id, result | tags |
| petition | from, to, category, procedure | tags |
| spec | service(약칭), from | version, tags |
| incident | service, severity | resolved_at, tags |

### 6.3 서비스 약칭 레지스트리 (ch4 5조)

| 약칭 | 서비스 | 배포 대상 |
|------|--------|----------|
| `portal` | monkos.ai 포털 | Cloud Run |
| `idphoto-kr` | 한국 AI 증명사진 | Cloud Run |
| `idphoto-jp` | 일본 AI 증명사진 | Cloud Run |
| `photolab` | monk.kr 프로덕션 증명사진 | CF Pages |
| `monk-kr` | monk.kr 포털 | CF Pages |
| `image-engine` | Imagen API 서비스 | Cloud Run |
| `ops` | 운영 체계 | 비배포 |

### 6.4 금지 사항 (ch4 2조)

1. 루트에 임시 .md 파일 방치
2. 언더스코어 폴더 사용 (`_archive/` 제외 불가)
3. 정본 이중화 (동일 문서 양쪽에 정본 존재)
4. 세션 로그 이중화 (정본: ops/sessions/)
5. 지시서 루트 직접 배치 (반드시 `tasks/YYYY-MM/`)
6. 바이너리 파일 docs/ 배치
7. README.md 미보유 폴더

---

## 7. 갭 분석 + 액션 플랜

### 7.1 즉시 실행 (P0)

| # | 액션 | 담당 | 비고 |
|---|------|------|------|
| 1 | **Root CLAUDE.md 생성** — iMac, M1 우선 | 쌍아 지시서 → 막내 | 3계층 아키텍처 핵심 |
| 2 | **mailbox_watcher.sh 비밀번호 제거** — SSH 키 인증 전환 | 막내 | 헌법 6조 위반 해소 |
| 3 | **MEMORY.md 압축** — Identity Zone → Root CLAUDE.md 승격 | 쌍아+막내 | 포화 해소 (~30줄 절감) |

### 7.2 단기 실행 (P1)

| # | 액션 | 담당 | 비고 |
|---|------|------|------|
| 4 | **monkos-ops 번호폴더 이관** — 01~06 → 영문 4부서 완전 이전 | 막내 | 이중 구조 해소 |
| 5 | **commands/ 폴더 법제화** — ch4에 정본 위치 정의 추가 | 쌍아 법률 개정안 | 30개 지시서 정본 미정 |
| 6 | **Web 디바이스 등록** — ch1 4조 + 헌법 디바이스 맵 추가 | 법률 개정 | 철창이 세션 정규화 |
| 7 | **M2/M4 Root CLAUDE.md 준비** — 꾸, 한 디바이스 배치 | 쌍아 | 팀원 프로젝트 인입 전제 |

### 7.3 중기 과제 (P2)

| # | 액션 | 담당 | 비고 |
|---|------|------|------|
| 8 | **철창이 통신 경로 확정** | 어젠다 #7,#8 | 세션 자동 인입 (#13) 전제 |
| 9 | **세션 마감 절차 법률화** | 어젠다 #9 → ch3 | 현재 메모 수준 |
| 10 | **자산 인입 게이트웨이 Phase 1** | 어젠다 #13 | Chrome 확장 + launchd |

### 7.4 의존성 그래프

```
[P0-1] Root CLAUDE.md ──→ [P1-7] M2/M4 배치 ──→ 팀원 프로젝트 인입
                     │
                     └──→ [P0-3] MEMORY.md 압축

[P1-4] monkos-ops 정비 ──→ [P1-5] commands/ 법제화

[P2-8] 철창이 경로 ──→ [P2-10] 자산 인입 게이트웨이
                   └──→ [P1-6] Web 디바이스 등록
```

---

## 8. 보안 이슈

### 8.1 평문 비밀번호 (헌법 제6조 위반 가능성)

**파일**: `monkos-ops/scripts/mailbox_watcher.sh`
**내용**: SSH 접속 시 `sshpass -p "1234"` 사용
**위험**: Tailscale VPN 내부이나 Git 추적 중 → 평문 노출

**권고 조치**:
1. SSH 키 인증으로 전환 (`ssh-copy-id mac@100.93.220.17`)
2. `sshpass` 제거
3. 기존 비밀번호 `1234` 변경

### 8.2 환경변수 관리 현황

| 서비스 | 관리 방식 | 상태 |
|--------|---------|------|
| Cloud Run | `--set-env-vars` (deploy.sh) | 적정 |
| CF Workers | Dashboard / `wrangler secret put` | 적정 |
| 로컬 | `.env` (gitignored) | 적정 |
| mailbox_watcher | **평문 in script** | 위반 |

---

## 결론

### 이 제안서의 핵심

1. **3계층 CLAUDE.md 아키텍처**는 MONK OS의 "신경계"입니다.
   - Root(정체성) + Project(헌법) + MEMORY(맥락) = 완전한 자동 역할 인식
   - 누구든 프로젝트를 열면 자기가 누구인지 즉시 안다

2. **Frontend/Backend 분리**가 명확해집니다.
   - Frontend: 작가님 + 쌍아 (전략 대화 + 지시서 발행)
   - Backend: 막내N (풀 자동 엔진) + 소넷이 (데몬)

3. **팀원 인입 경로**가 완성됩니다.
   - M2(꾸), M4(한)에 Root CLAUDE.md 배치 → 프로젝트 clone → 즉시 역할 활성화
   - 철창이: Web 디바이스 등록 + 자산 인입 게이트웨이 (#13)

4. **10개 액션 아이템**: P0(3건) + P1(4건) + P2(3건) — 의존성 순서 준수

### 승인 요청

작가님, 본 제안서의 방향성 승인을 요청드립니다.
승인 시 P0 항목부터 즉시 지시서를 발행하여 막내에게 투입하겠습니다.

---

> **작성**: iMac/쌍아
> **조사 투입**: 막내 5명 병렬 (디렉토리/법체계/인프라/3계층/역할맵)
> **일시**: 2026-02-25 10:25 KST
