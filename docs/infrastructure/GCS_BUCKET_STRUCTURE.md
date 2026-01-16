# GCS 버킷 구조 (2026-01-15 확정)

**버킷명**: `gs://monk-project/`
**위치**: asia-northeast3 (서울)
**스토리지 클래스**: Standard

---

## 한눈에 보는 구조

```
gs://monk-project/
│
├── 📁 shared/                     # 공유 시스템 데이터 (2026-01-16 추가)
│   │
│   ├── members/                   # 회원 데이터 (D1 실시간 백업)
│   │   └── 2026-01/*.json         # 일별 신규 가입자
│   │
│   └── credits/                   # 크레딧 거래 내역 (선택적 백업)
│       └── 2026-01/*.json
│
├── 📁 visitor_data/               # 고객/비즈니스 데이터 (2026-01-15 추가)
│   │
│   ├── visitors/                  # 방문자 정보 (성별, 연령, 직업, 목적)
│   │   └── 2026-01/*.json          # 일별 백업
│   │
│   ├── transactions/              # 결제 내역 (토큰만 저장)
│   │   └── 2026-01/*.json
│   │
│   ├── orders/                    # 주문/생성 이력
│   │   └── 2026-01/*.json
│   │
│   └── analytics/                 # 분석용 집계
│       ├── daily/
│       └── monthly/
│
├── 📁 corpus/                      # AI 학습 (Vertex AI RAG 소스)
│   │
│   ├── sessions/                   # 세션 로그 (쌍아 대화)
│   │   └── 2026-01/*.md
│   │
│   ├── gemini/                     # Gemini 대화 (용아 전략, 15M+)
│   │   └── yonga_conversations/
│   │
│   ├── knowledge/                  # 파싱된 지식 슬라이스
│   │
│   └── qa_logs/                    # QA 피드백 데이터
│
├── 📁 assets/                      # 4 MUSE 자산
│   │
│   ├── soso/                       # 소소 (이미지 생성 엔진)
│   │   │
│   │   ├── sources/                # 원천 데이터 (크롤링)
│   │   │   ├── kbeauty/            # K뷰티 이미지 (2.8GB)
│   │   │   │   ├── hair/
│   │   │   │   ├── makeup/
│   │   │   │   ├── fashion/
│   │   │   │   ├── model/
│   │   │   │   └── lingerie/
│   │   │   │
│   │   │   └── backgrounds/        # 배경 이미지
│   │   │       ├── cafe/
│   │   │       ├── interior/
│   │   │       ├── street/
│   │   │       ├── studio/
│   │   │       └── nature/
│   │   │
│   │   └── generated/              # AI 생성 중간물
│   │
│   ├── mina/                       # 민아 (AI 모델 에이전시)
│   │   │
│   │   ├── models/                 # ⭐ 완성된 AI 모델
│   │   │   └── model_XXX/
│   │   │       ├── profile/        # 프로필
│   │   │       ├── lookbook/       # 룩북
│   │   │       ├── variations/     # 변형
│   │   │       └── metadata.json   # 정보
│   │   │
│   │   ├── runway/                 # 민아방 24/7 전시
│   │   │
│   │   └── portfolios/             # 포트폴리오 패키지
│   │
│   ├── ssanga/                     # 쌍아 (B2B 솔루션)
│   │   │
│   │   └── client_assets/          # 클라이언트 자산
│   │
│   └── yonga/                      # 용아 (교육/전략)
│       │
│       ├── bwya/                   # BWYA 강의 자료
│       │   ├── curriculum/         # 6개 학과 커리큘럼
│       │   ├── lectures/           # 강의 콘텐츠
│       │   ├── prompts/            # 프롬프트 사전
│       │   └── references/         # 참고 자료
│       │
│       └── academy/                # Academy 운영
│
├── 📁 live/                        # 실시간 작업 (Hot)
│   │
│   ├── workspace/                  # 현재 작업 파일
│   │
│   └── deploy/                     # 배포 준비
│
├── 📁 archive/                     # 장기 백업 (Cold)
│   │
│   ├── snapshots/                  # 전체 스냅샷
│   │
│   └── deprecated/                 # 구버전 보관
│
└── 📁 templates/                   # 재사용 템플릿
    │
    └── ai-chatbot-kit/             # 소상공인 AI 챗봇 키트
```

---

## 데이터 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                        MONK 데이터 파이프라인                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [크롤링]          [생성 엔진]           [완성품]                │
│                                                                 │
│  soso/sources/  →  MONKOS Image Pro  →  mina/models/           │
│  (K뷰티+배경)        (Identity I2I)       (AI 모델)              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [대화 로그]        [Vertex AI]          [RAG 서비스]            │
│                                                                 │
│  corpus/sessions/ →  파싱+임베딩  →  쌍아/용아 챗봇             │
│  corpus/gemini/      (Corpus)          (실시간 응답)            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [강의 자료]        [Academy]           [수강생]                 │
│                                                                 │
│  yonga/bwya/    →  커리큘럼 제공  →  MONK Academy              │
│  (BWYA 6학과)                          (교육 서비스)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 계층별 용도

| 계층 | 폴더 | 용도 | 접근 빈도 |
|------|------|------|-----------|
| **Hot** | `live/`, `visitor_data/` | 실시간 작업, 고객 데이터 | 매일 수백 번 |
| **Warm** | `corpus/`, `assets/` | AI 학습, 서비스 자산 | 매일 수십 번 |
| **Cold** | `archive/` | 장기 백업 | 월 1~2회 |
| **Static** | `templates/` | 재사용 | 필요 시 |

---

## 비용 예상 (월간)

| 항목 | 용량 | 단가 | 비용 |
|------|------|------|------|
| visitor_data/ | ~10MB | $0.023/GB | $0.0002 |
| corpus/ | ~50MB | $0.023/GB | $0.001 |
| assets/soso/ | ~3GB | $0.023/GB | $0.07 |
| assets/mina/ | ~500MB | $0.023/GB | $0.01 |
| assets/yonga/ | ~100MB | $0.023/GB | $0.002 |
| live/ | ~100MB | $0.023/GB | $0.002 |
| archive/ | ~1GB | $0.010/GB | $0.01 |
| **총계** | ~5GB | - | **~$0.10/월** |

---

## 마이그레이션 체크리스트

### 현재 → 신규 매핑

| 현재 위치 | 신규 위치 |
|-----------|-----------|
| `gs://monk-ai-images/raw_data/kbeauty_sources/` | `gs://monk-project/assets/soso/sources/kbeauty/` |
| `gs://monk-ai-images/raw_data/*/naver_bg_*` | `gs://monk-project/assets/soso/sources/backgrounds/` |
| `gs://monk-project-soul/saga/` | `gs://monk-project/corpus/sessions/` |
| `gs://monk_session_data/` | `gs://monk-project/corpus/gemini/` |

### 마이그레이션 명령어

```bash
# 1. K뷰티 이미지 이동
gsutil -m cp -r gs://monk-ai-images/raw_data/kbeauty_sources/* \
  gs://monk-project/assets/soso/sources/kbeauty/

# 2. 배경 이미지 분리
gsutil -m mv gs://monk-project/assets/soso/sources/kbeauty/naver_bg_* \
  gs://monk-project/assets/soso/sources/backgrounds/

gsutil -m mv gs://monk-project/assets/soso/sources/kbeauty/bg_* \
  gs://monk-project/assets/soso/sources/backgrounds/

# 3. 세션 로그 이동
gsutil -m cp -r gs://monk-project-soul/saga/session_logs/* \
  gs://monk-project/corpus/sessions/

# 4. Gemini 대화 이동
gsutil -m cp -r gs://monk_session_data/* \
  gs://monk-project/corpus/gemini/

# 5. 기존 버킷 정리 (확인 후)
# gsutil rm -r gs://monk-ai-images/
# gsutil rm -r gs://monk-project-soul/
# gsutil rm -r gs://monk_session_data/
```

---

## 접근 권한 (IAM)

| 역할 | 권한 | 대상 |
|------|------|------|
| 작가님 | Owner | 전체 |
| Cloud Run | Storage Object Viewer | `corpus/`, `assets/` |
| Vertex AI | Storage Object Viewer | `corpus/` |
| Cloudflare Worker | Storage Object Viewer | `assets/mina/runway/` |

---

## 연동 설정

### Vertex AI Search & Conversation
```
Data Store: monk_corpus
Bucket URI: gs://monk-project/corpus/*
Update: Daily 02:00 KST
```

### Cloudflare R2 동기화
```
Source: gs://monk-project/assets/mina/runway/
Target: r2://monk-kr/mina/
Sync: On-demand
```

---

## visitor_data/ 보안 가이드 (2026-01-15 추가)

### 데이터 민감도 분류

| 데이터 | 민감도 | 저장 방식 | 비고 |
|--------|--------|-----------|------|
| 성별, 연령대, 직업군, 방문목적 | 🟢 낮음 | 평문 저장 | 통계용 |
| 이름 | 🟡 중간 | 선택 수집, 평문 | 마케팅용 |
| 연락처, 이메일 | 🟡 중간 | 해시 권장 | GDPR 고려 |
| 결제 정보 | 🔴 높음 | **토큰만** | PG사 위임 |

### IAM 권한

| 역할 | visitor_data/ 권한 |
|------|-------------------|
| 작가님 | Owner (전체) |
| Cloud Run | Object Creator (쓰기) |
| Analytics | Object Viewer (읽기) |

### 백업 정책

- **일별**: D1 → GCS 자동 동기화 (00:00 KST)
- **월별**: `archive/visitor_data/YYYY-MM/` 이관
- **보존**: 1년 후 자동 삭제 (법적 요건 확인 필요)

---

*문서 생성: 2026-01-15 08:13*
*위치: 집 (Mac Mini)*
*업데이트: 2026-01-15 - visitor_data/ 추가*
