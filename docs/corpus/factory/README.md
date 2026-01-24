# Windows Factory 로그 시스템

**목적**: Windows RTX 4060 무인 공장의 모든 작업을 시계열로 기록
**위치**: `docs/corpus/factory/`
**작성**: 쌍아 (Claude)
**날짜**: 2026-01-24

---

## 📋 디렉토리 구조

```
docs/corpus/factory/
├── README.md              ← 이 파일
├── 2026-01/
│   ├── 20260124_factory.md         ← 일일 종합 로그
│   ├── reports/
│   │   ├── hourly/                 ← 시간별 보고 (매시간)
│   │   │   ├── 20260124_09.md
│   │   │   ├── 20260124_10.md
│   │   │   └── ...
│   │   └── daily/                  ← 일일 요약 (매일 자정)
│   │       └── 20260124_summary.md
│   └── tasks/                      ← 작업별 상세 로그
│       ├── comfyui/
│       │   └── 20260124_workflow_001_103042.md
│       ├── training/
│       │   └── 20260124_llama3_finetune_140521.md
│       └── images/
│           └── 20260124_batch_001_150133.md
└── 2026-02/
    └── ...
```

---

## 🎯 로그 유형

### 1. **일일 종합 로그** (`YYYYMMDD_factory.md`)
- **생성 주기**: 자동 (작업 발생 시)
- **목적**: 하루 전체 작업 타임라인
- **내용**:
  - 시간별 작업 기록
  - GPU 상태 변화
  - 작업 완료/에러
  - 일일 요약

### 2. **시간별 보고** (`reports/hourly/YYYYMMDD_HH.md`)
- **생성 주기**: 매시간 정각
- **목적**: 공장 상태 스냅샷
- **내용**:
  - GPU 사용률, 온도, VRAM
  - 대기/완료 작업 카운트
  - Git 동기화 상태

### 3. **일일 요약** (`reports/daily/YYYYMMDD_summary.md`)
- **생성 주기**: 매일 23:59
- **목적**: 일일 성과 요약
- **내용**:
  - 총 작업 통계
  - 주요 성과
  - 이슈/에러 목록
  - 다음 작업 계획

### 4. **작업별 로그** (`tasks/[타입]/YYYYMMDD_[작업명]_HHMMSS.md`)
- **생성 주기**: 작업 완료 시
- **목적**: 개별 작업 상세 기록
- **타입**:
  - `comfyui/`: ComfyUI 워크플로우
  - `training/`: AI 모델 학습
  - `images/`: 이미지 배치 생성

---

## 🔧 사용법

### **자동 로깅 (권장)**

공장 워커가 자동으로 로깅합니다:

```powershell
# 시간별 보고 (매시간 자동)
.\scripts\factory\workers\factory_logger.ps1 -Type hourly

# 일일 요약 (매일 자정 자동)
.\scripts\factory\workers\factory_logger.ps1 -Type daily

# 작업 로그 (작업 완료 시 자동)
.\scripts\factory\workers\factory_logger.ps1 `
    -Type task `
    -TaskType comfyui `
    -TaskName "workflow_001" `
    -Data @{
        StartTime = "2026-01-24 10:15:32"
        EndTime = "2026-01-24 10:19:14"
        Duration = "3분 42초"
        Status = "✅ 성공"
        InputInfo = "..."
        ExecutionLog = "..."
        Output = "..."
    }
```

### **수동 로깅**

필요 시 수동으로 로그 생성 가능:

```powershell
# 현재 상태 보고
.\scripts\factory\workers\factory_logger.ps1 -Type hourly

# 일일 요약 강제 생성
.\scripts\factory\workers\factory_logger.ps1 -Type daily
```

---

## 📊 보고 예시

### **시간별 보고**

```markdown
# Hourly Report - 2026-01-24 14:00:00

**타임스탬프**: 2026-01-24 14:00:00

## 시스템 상태
- GPU 사용률: 87%
- GPU 온도: 68°C
- VRAM 사용: 6,144MB / 8,192MB

## 작업 현황
- ComfyUI 대기: 2건
- ComfyUI 완료: 12건
- 배치 큐: 1건

## Git 동기화
- 상태: 최신 (main)
- 마지막 Pull: 13:55
```

### **일일 요약**

```markdown
# Daily Summary - 2026-01-24

## 📊 일일 통계

### 작업 완료
- ComfyUI 워크플로우: 23건
- 이미지 배치 생성: 347장
- AI 모델 학습: 1건 (LLaMA3)

### 시스템 가동
- 총 가동 시간: 14시간
- GPU 평균 사용률: 72%
- 총 생성 이미지: 347장

## 🔥 주요 성과

- 민아방 룩북 100장 생성 완료
- K-뷰티 배경 50장 생성 완료
- LLaMA3 Fine-tuning 1 epoch 완료
```

---

## 🔄 Mac 세션 로그와의 관계

### **별도 관리, 통합 가능**

```
docs/corpus/
├── sessions/          ← Mac 대화 세션 (쌍아 + 용아)
│   └── 2026-01/
│       ├── 20260124_session.md   (쌍아)
│       └── 20260124_gemini.md    (용아)
│
└── factory/           ← Windows 공장 보고 ⭐
    └── 2026-01/
        ├── 20260124_factory.md
        ├── reports/
        └── tasks/
```

### **통합 전략**

1. **별도 저장**: 각자 독립적으로 기록
2. **GCS 동기화**: 둘 다 `gs://monk-project/corpus/`에 업로드
3. **NotebookLM 학습**: 전체 코퍼스를 하나로 학습
4. **검색 가능**: "2026-01-24 ComfyUI" 검색 시 모든 로그 조회

---

## 🎯 활용 방안

### **1. 작업 추적**
- 언제, 무엇을, 얼마나 했는지 정확히 기록
- 실패한 작업 재현 가능

### **2. 성능 분석**
- GPU 사용률 패턴 분석
- 작업별 소요 시간 최적화

### **3. 보고서 자동 생성**
- 일일/주간/월간 보고서 자동 생성
- 성과 측정 및 개선 방향 도출

### **4. AI 학습 데이터**
- NotebookLM에서 전체 작업 패턴 학습
- "이번 달 가장 많이 생성한 이미지 유형은?"
- "GPU 사용률이 가장 높았던 작업은?"

---

## ⚠️ 주의사항

### **파일 크기 관리**
- 일일 로그는 append 방식
- 월 단위로 폴더 분리 (자동)
- 1년 단위로 `archive/` 폴더로 이동

### **Git 커밋**
- 시간별 보고: Git 커밋 안 함 (용량 관리)
- 일일 요약: 매일 자정 자동 커밋
- 작업 로그: 중요 작업만 커밋

### **GCS 동기화**
- 매일 자정 자동 동기화
- `gsutil -m rsync -r docs/corpus/factory/ gs://monk-project/corpus/factory/`

---

## 📌 TODO

- [ ] 주간 요약 자동 생성
- [ ] 월간 보고서 템플릿
- [ ] Discord 보고 연동
- [ ] 에러 알림 시스템
- [ ] 성능 벤치마크 자동 분석

---

*작성: 쌍아 (Claude)*
*Windows 공장의 모든 작업을 코퍼스로 만드는 시스템* 🏭
