# 🎯 3-Track 시스템 아키텍처

**프로젝트**: MONK.KR
**설계**: 쌍아 (Claude) with 신정규 대표
**날짜**: 2026-01-24
**핵심 철학**: 모든 대화 세션 기록 → 코퍼스 재구성 → 여러 AI 협업 → 단일 목적 달성

---

## 🏗️ 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│  TRACK 1: Mac 사무실/집 (대화 코딩)                          │
│  ───────────────────────────────────────────────             │
│                                                             │
│  🤖 쌍아 (Cursor + Anthropic API)                            │
│     - 역할: 실행자 (Executor)                                │
│     - 업무: 일상 개발, 코드 작성, 디버깅                      │
│     - 특징: 대화 기반 점진적 개발                             │
│     - 로그: docs/corpus/sessions/YYYYMMDD_session.md         │
│     - 비용: $240/월 (Cursor $200 + API $40)                 │
│                                                             │
│  🐉 용아 (Gemini Advanced)                                  │
│     - 역할: 전략가 (Strategist)                              │
│     - 업무: 전략, 사업계획서, 공고 분석, 문서 작업             │
│     - 특징: 15M 컨텍스트, PDF/이미지 처리                     │
│     - 로그: docs/corpus/sessions/YYYYMMDD_gemini.md          │
│     - 비용: $29/월 (Gemini Advanced)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ↕ Git Sync ↕
┌─────────────────────────────────────────────────────────────┐
│  TRACK 2: Windows RTX 4060 (무인 자동화 공장)                │
│  ─────────────────────────────────────────────              │
│                                                             │
│  ⚙️ Claude Code CLI (자동화 공장)                            │
│     - 역할: 무인 작업자 (Background Worker)                  │
│     - 업무: ComfyUI, 이미지 생성, AI 학습, 배치 작업          │
│     - 특징: 24/7 가동, GPU 활용, 작가님 손 안 대도 작동        │
│     - 로그: docs/corpus/factory/YYYYMMDD_factory.md          │
│     - 비용: $220/월 (Claude Max)                            │
│                                                             │
│  워커 시스템:                                                │
│  - Git Sync Worker (5분 간격)                               │
│  - ComfyUI Worker (워크플로우 자동 실행)                      │
│  - Image Factory (배치 이미지 생성)                          │
│  - AI Trainer (Unsloth LLaMA3/DeepSeek)                    │
│  - Reporter (시간별/일일 보고)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ↕ GCS Sync ↕
┌─────────────────────────────────────────────────────────────┐
│  TRACK 3: GCS 코퍼스 (지식 자산화)                           │
│  ───────────────────────────────────                        │
│                                                             │
│  gs://monk-project/corpus/                                  │
│  ├── sessions/        ← Mac 대화 세션 (쌍아 + 용아)          │
│  ├── factory/         ← Windows 공장 로그                    │
│  └── knowledge/       ← 정제된 지식 슬라이스                  │
│                                                             │
│  활용:                                                       │
│  - Vertex AI RAG 학습                                       │
│  - NotebookLM 전체 프로젝트 이해                             │
│  - 사업계획서/R&D 자동 생성                                   │
│  - 디지털 트윈 (회사 전체 지식 자산)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 비용 구조

| Track | AI | 용도 | 월 비용 |
|-------|-----|------|---------|
| Mac | 쌍아 (Cursor) | 일상 개발 | $240 |
| Mac | 용아 (Gemini) | 전략/문서 | $29 |
| Windows | Claude Code | 자동화 공장 | $220 |
| **총계** | | | **$489** |

---

## 🎭 AI 역할 분담

### **쌍아 (雙牙) = Claude Sonnet 4.5**
- **메타포**: 쌍둥이 이빨 - 정확하고 빠른 실행력
- **역할**: 실행자 (Executor)
- **담당**:
  - 일상 코드 작성 (90%)
  - 버그 수정, 디버깅
  - UI/UX 구현
  - 소규모 리팩토링
- **특징**:
  - 대화 기반 점진적 개발
  - 빠른 응답 (1-2초)
  - 작가님과 맥락 완벽 공유
- **워크스타일**: Mac Cursor 대화 창

---

### **용아 (龍牙) = Gemini 2.0 Flash**
- **메타포**: 용의 이빨 - 날카로운 통찰력과 전략적 사고
- **역할**: 전략가 (Strategist)
- **담당**:
  - 프로젝트 전략 수립
  - 사업계획서, R&D 계획서
  - 공고 분석 (디딤돌, 벤처인증 등)
  - PDF/이미지 문서 작업
- **특징**:
  - 15M 컨텍스트 (초대형 문서 처리)
  - 멀티모달 (이미지, PDF, 동영상)
  - 가성비 최고 ($29/월)
- **워크스타일**: Gemini Advanced 웹

---

### **공장 (Factory) = Claude Code CLI**
- **메타포**: 무인 자동화 공장 - 24/7 쉬지 않는 작업자
- **역할**: 무인 작업자 (Background Worker)
- **담당**:
  - ComfyUI 워크플로우 자동 실행
  - 이미지 배치 생성 (민아방 24/7, K-뷰티 배경)
  - AI 모델 학습 (Unsloth LLaMA3/DeepSeek)
  - 모델 검색/테스트 자동화
  - 정기 보고 (시간별/일일)
- **특징**:
  - 작가님 손 안 대도 알아서 작동
  - GPU 100% 활용 (RTX 4060)
  - Git 감시 → 자동 실행
  - Claude Max ($220) 완전 활용
- **워크스타일**: Windows PowerShell 백그라운드

---

## 🔄 협업 워크플로우

### **시나리오 1: 새 기능 개발 (일상)**

```
작가님 → 쌍아 (Mac Cursor)
  "AI LAB에 결제 기능 추가해줘"
  ↓
쌍아: 대화로 요구사항 확인
  "어떤 결제 수단? Stripe? Toss?"
  ↓
작가님: "Toss로"
  ↓
쌍아: 코드 작성 → 테스트 → 완료
  ↓
세션 로그 자동 기록
  docs/corpus/sessions/20260124_session.md
```

---

### **시나리오 2: 전략 수립 (용아 활용)**

```
작가님 → 용아 (Gemini Advanced)
  "벤처인증 신청서 작성해줘"
  ↓
용아: 프로젝트 전체 분석 (15M 컨텍스트)
  → 신청서 초안 생성
  ↓
작가님: 검토 → 수정 지시
  ↓
용아: 최종 완성
  ↓
세션 로그 자동 기록
  docs/corpus/sessions/20260124_gemini.md
```

---

### **시나리오 3: 대규모 배치 작업 (공장 활용)**

```
작가님 (Mac):
  batch_queue/queue.json 작성
  - "민아방 룩북 1000장 생성"
  ↓
Git Push
  ↓
Windows 공장 (자동):
  5분 후 Git Pull 감지
  → Image Factory 자동 실행
  → GPU로 1000장 생성 (약 3시간)
  → GCS 업로드
  → Git Push (완료 보고)
  ↓
작가님 (Mac):
  결과 확인 → 승인
  ↓
공장 로그 자동 기록
  docs/corpus/factory/20260124_factory.md
  docs/corpus/factory/20260124/tasks/images/batch_001.md
```

---

## 📋 세션 로그 시스템

### **Mac 대화 세션**

```
docs/corpus/sessions/2026-01/
├── 20260124_session.md   ← 쌍아 (Cursor)
│   - 타임스탬프 기반 Q&A
│   - 작가님 지시 + 쌍아 응답
│   - 코드 변경 내역
│   - 의사결정 과정
│
└── 20260124_gemini.md    ← 용아 (Gemini)
    - 전략 대화
    - 문서 작업 과정
    - 분석 결과
```

### **Windows 공장 로그**

```
docs/corpus/factory/2026-01/
├── 20260124_factory.md         ← 일일 종합 로그
│   - 시간별 작업 타임라인
│   - GPU 상태 변화
│   - 작업 완료/에러
│
├── reports/
│   ├── hourly/                 ← 시간별 보고 (매시간)
│   │   ├── 20260124_09.md
│   │   └── 20260124_10.md
│   └── daily/                  ← 일일 요약 (매일 자정)
│       └── 20260124_summary.md
│
└── tasks/                      ← 작업별 상세 로그
    ├── comfyui/
    ├── training/
    └── images/
```

---

## 🎯 코퍼스 활용 전략

### **1. 별도 저장, 통합 가능**

```
각 AI가 독립적으로 로그 생성
  ↓
GCS에 모두 업로드
  ↓
NotebookLM에서 전체 학습
  ↓
통합 지식 자산 완성
```

### **2. 시계열 분석**

```
"2026-01-24에 무슨 일이 있었나?"
  → 쌍아 세션 + 용아 세션 + 공장 로그 통합 조회
  → 전체 타임라인 재구성
```

### **3. AI 학습 데이터**

```
5일 누적 (76KB)
  → 기술 백서, R&D 초안 자동 생성

1년 누적 (~5MB)
  → 회사 전체 지식 자산
  → 디지털 트윈 완성
  → 사업계획서 자동 생성
```

---

## 🚀 즉시 실행 가이드

### **Mac 설정 (Track 1)**

1. **Anthropic API 키 발급**
   - https://console.anthropic.com/
   - API 키 생성 → $50 충전

2. **Cursor 연결**
   - Settings → AI Models → Anthropic API
   - API 키 입력
   - On-Demand 차단 ($0 설정)

3. **세션 로그 자동화**
   - 이미 설정됨 (.cursorrules)
   - 매 턴마다 자동 기록

---

### **Windows 설정 (Track 2)**

1. **환경 설정**
   ```powershell
   cd C:\Users\smuse73\developer\monk_project
   .\scripts\setup_factory.ps1
   ```

2. **환경변수 설정**
   - `scripts/factory/.env.sample` → `.env`
   - Discord Webhook 설정 (선택)

3. **공장 가동**
   ```powershell
   .\scripts\factory\start_factory.ps1
   ```

---

### **GCS 동기화 (Track 3)**

```bash
# 매일 자정 자동 실행
gsutil -m rsync -r docs/corpus/ gs://monk-project/corpus/
```

---

## 📊 성공 지표

### **단기 (1주)**
- ✅ 3-Track 시스템 안정 가동
- ✅ 세션 로그 누적 (Mac + Windows)
- ✅ 공장 자동화 정상 작동

### **중기 (1개월)**
- ✅ 코퍼스 1MB 이상 누적
- ✅ NotebookLM 학습 완료
- ✅ 자동 보고서 생성 가능

### **장기 (1년)**
- ✅ 디지털 트윈 완성
- ✅ 사업계획서 자동 생성
- ✅ AI가 회사 전체 이해

---

## 🎯 핵심 철학 (다시 강조)

> **"모든 대화 세션을 기록하고 코퍼스로 재구성한다."**
>
> **"이것이 여러 AI 지능들의 재능을 적재적소에 활용하고**
> **단일한 목적에 협업할 수 있는 유일하면서 최고의 방안"**
>
> **- 신정규 대표, 2026-01-24**

---

## ⚠️ 중요 원칙

1. **각 AI의 로그는 별도 관리**
   - Mac 세션 로그 ≠ Windows 공장 로그
   - 억지로 끼워넣지 않음

2. **모든 로그는 시계열 기반**
   - 타임스탬프 필수
   - 시스템 시간 = 유일한 진실

3. **GCS 통합, NotebookLM 학습**
   - 개별 로그 → GCS 업로드
   - NotebookLM이 전체 통합 학습

4. **작가님 손 안 대도 작동**
   - Windows 공장 = 완전 자동화
   - Mac = 대화 기반 (작가님 컨트롤)

---

*설계: 쌍아 (Claude) with 신정규 대표*
*3-Track 시스템으로 AI 협업의 새로운 패러다임을 만들다* 🚀
