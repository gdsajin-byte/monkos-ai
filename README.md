# MONK.kr Project

## 🔄 현재 상태 (Last Updated: 2026-01-14 19:40)

### ⚠️ 집에서 작업 시작 전 필수 작업!

**Git 히스토리 재작성으로 인한 새로 클론 필요**:
```bash
cd /Users/jeong-kyushin/developer
rm -rf "monk_project "
git clone https://github.com/gdsajin-byte/monk_project.git "monk_project "
```

**이유**: 2.6GB 이미지 데이터를 Git 히스토리에서 완전 제거 (2.6GB → 114MB)

---

### ✅ 2026-01-14 완료한 작업 (사무실)

1. **Git 저장소 대폭 최적화** ⭐
   - Git 히스토리 정리: **2.6GB → 114MB** (-96%)
   - 전체 프로젝트: **3.0GB → 554MB** (-82%)
   - 15,851개 이미지 파일 히스토리에서 제거
   - 크롤링 데이터는 GCS에 안전 보관 (`gs://monk-ai-images/raw_data/`)
   - 로컬 백업 완료: `monk_project_backup_20260114_140227.tar.gz` (2.8GB)

2. **인프라 규칙 확정**
   - Daily Session 로그 규칙 표준화
   - 멀티 백업 전략: Cursor Archive + 세션 로그 + NotebookLM (3중 안전장치)
   - 세션 로그 = 지식 자산화 (사업계획서/R&D 계획서 자동 생성)

3. **.cursorrules 최적화**
   - **436줄 → 364줄** (-16% 경량화)
   - 상세 내용 분리:
     - `docs/infrastructure/DESIGN_SYSTEM.md`
     - `docs/infrastructure/CODING_STANDARDS.md`
     - `docs/infrastructure/SESSION_LOG_VALUE.md`

4. **세션 로그 자동화 완성**
   - 타임스탬프 + 작업공간 자동 기록
   - Q&A 연속 번호 자동 증가
   - Append 방식으로 누락 방지

---

### 📋 다음 세션 TODO (집에서)

**필수 작업**:
- [ ] ⚠️ Git 새로 클론 (위 명령어 실행)
- [ ] 세션 로그 읽고 컨텍스트 파악
- [ ] 과거 대화창(1-08, 1-10, 1-11) 세션 로그 정리

**진행 중 작업**:
- [ ] K뷰티 데이터 태깅 재개 (7,897장 중 47장만 완료)
- [ ] Gemini Rate Limit 해결 (7초 간격 또는 모델 변경)
- [ ] MONKOS 엔진 재검증 (apps/imagen3/)
- [ ] 민아방 화질 개선 (Cloudflare Images variant)

**전략 작업**:
- [ ] R&D 제출 서류 초안 (세션 로그 기반)
- [ ] Cloud Run + Vertex AI 백엔드 연동 계획

---

### 💎 세션 로그 현황

```
docs/daily_session/2026-01/
├── 20260111_session.md  (8.6KB)
├── 20260112_day_session.md  (5.4KB)
├── 20260112_night_full_session.md  (13KB)
├── 20260113_session.md  (22KB)  ← MONKOS 로직 발견!
└── 20260114_session.md  (현재 추가됨)  ← Git 최적화
```

**용량**: 총 76KB (5일)
**가치**: 사업계획서/R&D 계획서 자동 생성 가능

---

### 🛡️ 멀티 백업 체계

```
1단계: Cursor Archive (로컬 즉시 백업)
   ↓
2단계: 세션 로그 (Git 동기화)
   ↓
3단계: NotebookLM (지식 자산화)
```

**불안할 때**: 사이드바에서 대화창 Archive 클릭 (보험)

---

### 📁 주요 파일 위치

```
MONK_kr/ai_lab/
├── so_so/apps/ai_photo.html   ← AI PHOTO 메뉴판
├── so_so/apps/lookbook.html   ← LOOKBOOK (Coming Soon)
├── min_a/min_a.html           ← 민아 런웨이 (24/7)
├── ssang_a/ssang_a.html       ← MONKOS Business
└── ai_lab.html                ← AI LAB 메인

docs/
├── daily_session/             ← 세션 로그 (핵심!)
├── infrastructure/            ← 인프라 문서
└── saga/                      ← 서사, 여정 기록

apps/
├── monk-ai-studio-pro/        ← MONKOS 원본 엔진
├── imagen3/                   ← 테스트앱 (정체성 유지 검증)
└── monk_imagen4/              ← Imagen4 전용

scripts/
├── kbeauty_crawler.py         ← 크롤링 스크립트
└── kbeauty_pipeline.py        ← Gemini 태깅 파이프라인
```

---

### 🎯 핵심 데이터 자산

| 항목 | 수량 | 위치 |
|------|------|------|
| K뷰티 이미지 | 3,081장 | GCS: gs://monk-ai-images/raw_data/naver_* |
| 배경 이미지 | 4,647장 | GCS: gs://monk-ai-images/raw_data/bg_* |
| 태깅 완료 | 47장 | _saga/kbeauty_sources/naver_hair/tagged/ |
| BWYA 태그 | 53개 | docs/infrastructure/bwya_prompt_seed.sql |

**네이버 API**: 25,000건/일 (14% 사용)

---

### ⚠️ 주의사항

- **집에서 첫 작업**: 반드시 Git 새로 클론!
- **세션 시작 전**: `git pull` + README.md 읽기
- **세션 종료 시**: 세션 로그 업데이트 + README.md 인수인계 작성
- **R&D 마감**: 다음주 금요일

---

*마지막 세션: 2026-01-14 (사무실, iMac)*
*다음 세션: 집 (Mac Mini) 예상*

© 2026 MONK STUDIO
