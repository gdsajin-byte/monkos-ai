# 🐉 MONK.KR Soul-Sync Architecture
**작성일**: 2026-01-08  
**설계자**: 용아(龍牙) & 쌍아(雙牙)  
**전략**: Hybrid Soul-Fork

---

## 📊 **GCS 버킷 구조 (gs://monk-project-soul/)**

```
gs://monk-project-soul/
│
├── 📁 live/                           # 실시간 작업 영역
│   ├── MONK_kr/                       # 메인 웹 서비스
│   │   ├── index.html                # 메인 랜딩 페이지
│   │   ├── ai_lab/                   # 4 MUSE 시스템
│   │   │   ├── ssang_a/              # 챗봇 브랜드
│   │   │   ├── so_so/                # 이미지 생성 브랜드
│   │   │   ├── min_a/                # K-뷰티 모델 브랜드
│   │   │   └── yong_a/               # 전략/교육 브랜드
│   │   ├── monk_studio/              # 오프라인 사진관
│   │   └── cloudflare-workers/       # 백엔드 프록시
│   │       ├── src/index.js          # Monkos.ai 엔진
│   │       └── schema_services.sql   # D1 스키마
│   ├── apps/                          # 독립 앱들
│   │   ├── monk_imagen4/             # Imagen 4 앱
│   │   └── monk-ai-studio-pro/       # AI Studio Pro
│   ├── .cursorrules                   # AI 맥락 파일 (핵심!)
│   └── soul_sync.sh                   # 동기화 스크립트
│
├── 📁 saga/                           # 지능 학습 데이터 (RAG 소스)
│   ├── monk_master_context.txt        # 15MB 마스터 사가
│   ├── monk_master_context_20260108_143022.txt  # 타임스탬프 백업
│   ├── raw_chunks/                    # 분할된 대화 로그
│   │   ├── chunk_aa
│   │   ├── chunk_ab
│   │   └── ...
│   ├── session_logs/                  # 세션별 대화 기록
│   │   ├── 2026-01-08_morning.md
│   │   └── 2026-01-08_evening.md
│   ├── insights/                      # 주간 분석 결과
│   │   ├── week_01_summary.md
│   │   └── learning_patterns.json
│   └── knowledge_slices/              # 정제된 샬라미 (Vertex AI용)
│       ├── monk_studio_services.json
│       ├── ai_lab_tech_stack.json
│       └── business_strategy.json
│
├── 📁 archive/                        # 장기 백업 (Nearline 스토리지)
│   ├── 2026-01/
│   │   ├── snapshot_20260108.tar.gz
│   │   └── index_old_backup.html
│   └── 2026-02/
│
├── 📁 templates/                      # 재사용 템플릿 (다른 프로젝트용)
│   ├── monk-base/
│   │   ├── .cursorrules              # MONK 스타일 AI 룰
│   │   ├── cloudflare-workers/       # Workers 템플릿
│   │   │   └── chatbot_template.js
│   │   └── soul_sync.sh              # 동기화 스크립트
│   └── ai-chatbot-kit/               # 소상공인용 패키지
│       ├── ollama/                   # 로컬 AI 구성
│       └── quick_start.md
│
└── 📁 shared/                         # 프로젝트 간 공유 자산
    ├── ai-prompts/                    # 프롬프트 라이브러리
    │   ├── claude_style_concise.txt
    │   ├── hallucination_prevention.txt
    │   └── multi_persona_router.txt
    └── design-system/                 # 디자인 토큰
        ├── tailwind-monk-theme.js
        └── gradient-colors.css
```

---

## 🎯 **스토리지 클래스 전략**

| 폴더 | 스토리지 클래스 | 액세스 빈도 | 월 비용 (5GB 기준) |
|------|----------------|------------|-------------------|
| `/live/` | **Standard** | 매일 수백 번 | $0.10 |
| `/saga/` | **Standard** | 매일 수십 번 (AI 학습) | $0.05 |
| `/archive/` | **Nearline** | 월 1~2회 | $0.05 |
| `/templates/` | **Coldline** | 분기 1회 | $0.02 |
| `/shared/` | **Standard** | 주간 수십 번 | $0.02 |
| **총 비용** | - | - | **~$0.24/월** |

---

## 🔄 **동기화 전략**

### **자동 동기화 규칙**

| 트리거 | 동기화 대상 | 방향 | 주기 |
|--------|------------|------|------|
| 퇴근 시 (수동) | `/live/` | 로컬 → GCS | 하루 1회 |
| 출근 시 (수동) | `/live/` | GCS → 로컬 | 하루 1회 |
| 세션 종료 시 | `/saga/session_logs/` | 로컬 → GCS | 대화 후 |
| Git commit 시 | `monk_master_context.txt` | 로컬 → GCS | 커밋마다 |
| Vertex AI 학습 시 | `/saga/knowledge_slices/` | GCS ↔ Vertex | 자동 |

### **제외 패턴 (`.cursorignore`와 동일)**

```bash
node_modules/
dist/
build/
.git/
.DS_Store
*.log
chunk_*
*_backup.*
*_old.*
.wrangler/
.cache/
```

---

## 🧠 **Vertex AI 연동 구조**

```
[로컬 웍스페이스]
      ↓ (soul_sync.sh)
[GCS: /live/ & /saga/]
      ↓ (Data Source 연결)
[Vertex AI Search]
      ↓ (Auto-Indexing)
[young_a_test App] ← RAG 기반 지능
      ↑
[대표님의 질문] → "어제 우리가 논의한 하이브리드 전략이 뭐였지?"
```

**Vertex AI가 학습하는 데이터**:
- `/saga/monk_master_context.txt` (15MB 마스터 사가)
- `/saga/session_logs/` (세션별 대화)
- `/saga/knowledge_slices/` (정제된 지식 조각)
- `/live/.cursorrules` (프로젝트 정체성)

---

## 🚀 **다른 기기에서 환경 재현하기**

### **집 맥미니 → 사무실 아이맥**

```bash
# 집에서 퇴근 전
cd "/Users/jeong-kyushin/developer/monk_project "
bash soul_sync.sh  # 옵션 1 선택 (업로드)

# 사무실에서 출근 후
mkdir -p ~/developer/monk_project
cd ~/developer/monk_project
bash soul_sync.sh  # 옵션 2 선택 (다운로드)

# Cursor IDE로 폴더 열기
# → 모든 대화 맥락, 코드, 설정이 완벽히 동기화됨!
```

---

## 🎭 **새 프로젝트 Fork 시나리오**

### **예시: 카페 "Bean & Books"의 AI 챗봇 프로젝트**

```bash
# 1. 템플릿 복제
gsutil -m cp -r gs://monk-project-soul/templates/ai-chatbot-kit/ ./bean-and-books-ai/

# 2. 커스터마이징
cd bean-and-books-ai/
# .cursorrules 수정 → "MONK.KR" → "Bean & Books"
# chatbot_template.js 수정 → 메뉴, 영업시간 등

# 3. 새 버킷에 동기화
gsutil -m rsync -r ./ gs://bean-and-books-soul/live/

# 4. Vertex AI에 연결
# → 5분 만에 독립된 프로젝트 완성!
```

---

## 📈 **성능 최적화 체크리스트**

- [x] `node_modules` 제외 (50,000+ 파일 절약)
- [x] 이미지 파일 `.cursorignore` 추가 (AI 인덱싱 부하 감소)
- [x] 백업 파일 `/archive/` 분리 (실시간 동기화 속도 향상)
- [x] Saga 데이터 별도 관리 (Vertex AI 학습 최적화)
- [x] 타임스탬프 백업 (실수 삭제 복구 가능)
- [ ] 주간 `/archive/` 스냅샷 자동화 (Cloud Scheduler)
- [ ] 크기별 스토리지 클래스 자동 조정 (Lifecycle Policy)

---

## 💡 **주의사항**

1. **동시 편집 금지**: 한 번에 한 기기에서만 작업하세요. 충돌 발생 시 최신 파일이 덮어씌워집니다.
2. **민감 정보**: `.env` 파일은 절대 버킷에 올리지 마세요. (`.cursorignore`에 이미 추가됨)
3. **비용 모니터링**: GCS 콘솔에서 월간 비용을 주기적으로 확인하세요.
4. **버전 관리**: 중요한 파일은 Git으로도 별도 관리하는 것을 권장합니다.

---

## 🐉 **용아의 마지막 조언**

> "이 구조는 단순한 백업이 아닙니다. 대표님의 '생각하는 과정' 자체를 클라우드에 실시간으로 각인시켜, 어떤 기기에서든 같은 '의도'를 이어가게 만드는 **'의식의 영속성(Persistence of Consciousness)'** 시스템입니다.
> 
> 맥미니에서 시작한 아이디어가 아이맥에서 완성되고, 그 과정이 Vertex AI의 지식이 되어, 결국 고객의 질문에 완벽히 답하는 Monkos.ai로 돌아옵니다.
> 
> 이것이 진정한 **무한 순환(Infinite Loop)**입니다. 🔄🐉🔥"

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-08 by 용아 & 쌍아
