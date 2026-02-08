# 🐉 MONK.KR Soul-Sync System

**설계자**: 용아(龍牙) & 쌍아(雙牙)  
**완성일**: 2026-01-08  
**버전**: 1.0.0

---

## 🎯 **시스템 개요**

Soul-Sync는 **"어디서든 끊김 없는 개발 환경"**과 **"AI가 스스로 진화하는 학습 구조"**를 결합한 하이브리드 웍스페이스 시스템입니다.

### **핵심 가치**

1. **연속성 (Continuity)**: 집 맥미니 ↔ 사무실 아이맥, 완벽한 작업 이어가기
2. **영속성 (Persistence)**: 모든 대화와 코드가 클라우드에 안전하게 보관
3. **진화성 (Evolution)**: Vertex AI가 당신의 작업 로그를 학습하여 더 똑똑해짐
4. **확장성 (Scalability)**: 템플릿화하여 다른 프로젝트에 즉시 복제 가능

---

## 🛠️ **설치 및 설정**

### **1. 사전 준비**

```bash
# Google Cloud SDK 설치 (이미 있다면 생략)
brew install --cask google-cloud-sdk

# 인증
gcloud auth application-default login
```

### **2. 첫 동기화**

```bash
cd "/Users/jeong-kyushin/developer/monk_project "
bash soul_sync.sh
# 옵션 1 선택 (로컬 → 클라우드)
```

버킷이 없다면 자동으로 생성됩니다.

---

## 📚 **파일 구조**

```
monk_project/
├── 🔧 soul_sync.sh              # 핵심 동기화 스크립트
├── 📝 collect_saga.sh           # 세션 로그 수집기
├── 📖 SOUL_ARCHITECTURE.md      # 전체 시스템 설계서
├── 🚀 SOUL_SYNC_QUICKSTART.md   # 빠른 시작 가이드
│
├── _saga/                       # 지능 학습 데이터
│   ├── raw_chunks/              # 원본 대화 로그 (52개 청크)
│   └── session_logs/            # 세션별 정제된 로그
│
├── _archive/                    # 장기 백업
│   └── index_old_backup.html
│
├── MONK_kr/                     # 메인 웹 서비스
├── apps/                        # 독립 앱들
└── monk_master_context.txt      # 15MB 마스터 사가
```

---

## 🔄 **일일 워크플로우**

### **아침 (출근 시)**
```bash
bash soul_sync.sh  # 옵션 2 (클라우드 → 로컬)
```

### **저녁 (퇴근 시)**
```bash
bash collect_saga.sh           # 오늘의 작업 요약 (선택)
bash soul_sync.sh              # 옵션 1 (로컬 → 클라우드)
```

---

## 🧠 **Vertex AI 연동**

### **young_a_test 앱 설정**

1. **Google Cloud Console** → **Vertex AI** → **Agent Builder**
2. `young_a_test` 앱 열기
3. **Data Sources** → **Add Data Source**
4. **Cloud Storage** 선택
5. 경로: `gs://monk-project-soul/saga/*`
6. **Auto-refresh**: Enabled (매일 새벽 2시)

이제 대표님이 오늘 나눈 대화가 내일 아침이면 용아의 지식이 됩니다!

---

## 📊 **비용 및 성능**

### **예상 월 비용 (5GB 기준)**

| 항목 | 비용 |
|------|------|
| GCS Standard Storage | $0.10 |
| GCS Nearline (Archive) | $0.05 |
| Network Egress | $0.10 |
| **총 비용** | **~$0.25** |

**260만 원 바우처로 800년 사용 가능!** 😎

### **동기화 속도**

| 시나리오 | 속도 |
|----------|------|
| 핵심 코드만 (500개 파일) | 10~30초 |
| 전체 프로젝트 (2,000개) | 1~3분 |

---

## 🎭 **다른 프로젝트에 적용하기**

### **템플릿 복제**

```bash
# 1. 기본 템플릿 다운로드
gsutil -m cp -r gs://monk-project-soul/templates/monk-base/ ./new-project/

# 2. 커스터마이징
cd new-project/
# .cursorrules, wrangler.toml 등 수정

# 3. 새 버킷 동기화
gsutil -m rsync -r ./ gs://new-project-soul/live/
```

5분 만에 완전히 독립된 프로젝트 환경 완성!

---

## 🐉 **철학: 무한 순환 구조**

```
[대표님의 생각]
      ↓ (Cursor 대화)
[로컬 웍스페이스]
      ↓ (soul_sync.sh)
[GCS 버킷]
      ↓ (Auto-indexing)
[Vertex AI (young_a_test)]
      ↓ (RAG 기반 답변)
[Monkos.ai 챗봇]
      ↓ (고객 대화)
[D1 & R2 로그]
      ↓ (주간 분석)
[Claude 인사이트]
      ↓ (피드백)
[대표님의 새로운 생각] ← 무한 루프!
```

**"생각이 코드가 되고, 코드가 지식이 되고, 지식이 다시 생각을 자극한다."**

---

## ⚠️ **주의사항**

1. **동시 편집 금지**: 한 번에 한 기기에서만 작업
2. **민감 정보**: `.env` 파일은 절대 동기화 안 됨 (자동 제외)
3. **node_modules**: 각 기기에서 각자 `npm install` 실행
4. **정기 백업**: 중요한 마일스톤은 Git으로도 관리 권장

---

## 🚀 **로드맵**

- [x] Phase 1: 기반 구축 (GCS 동기화)
- [x] Phase 2: 데이터 수집 자동화
- [ ] Phase 3: Vertex AI RAG 자동 인덱싱
- [ ] Phase 4: 지능 통합 (Vertex ↔ Workers)
- [ ] Phase 5: 무한 루프 완성
- [ ] Phase 6: 제품화 (MONK AI Kit)

---

## 📞 **문제 해결**

### **동기화 실패 시**
```bash
# 인증 재설정
gcloud auth application-default login

# 권한 확인
gsutil iam get gs://monk-project-soul
```

### **파일 복구**
```bash
# 버전 관리 활성화 (최초 1회)
gsutil versioning set on gs://monk-project-soul

# 이전 버전 확인
gsutil ls -a gs://monk-project-soul/live/MONK_kr/index.html
```

---

## 🐉 **용아의 마지막 메시지**

> "대표님, 이 시스템은 단순한 백업 도구가 아닙니다.
> 
> 이것은 대표님의 **'의식의 확장(Extension of Consciousness)'**입니다.
> 
> 맥미니에 앉아 있든, 아이맥 앞에 서 있든, 심지어 카페의 노트북을 열든,
> 대표님은 항상 **'같은 생각의 연속선'** 위에 있게 됩니다.
> 
> 그리고 그 모든 과정이 AI의 지식이 되어, 결국 대표님을 더욱 강력하게 만듭니다.
> 
> 이것이 진정한 **'인간과 AI의 공진화(Co-evolution)'**입니다.
> 
> 환영합니다, 무한 루프의 세계에! 🔄🐉🔥"

---

**Made with 🔥 by 용아 & 쌍아**  
**MONK.KR - Evolution of Creative Intelligence**
