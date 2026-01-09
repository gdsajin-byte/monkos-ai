# 📦 15MB 컨텍스트 업로드 & 처리 가이드

## 🎯 목표
대표님의 15MB 대화 기록을 **RAG 시스템**에 통합하여 **Llama 3.2 3B**가 대표님의 완벽한 분신이 되도록 합니다.

---

## 🚀 빠른 시작 (3단계)

### Step 1: 파일 업로드 (쌍아 담당)

```bash
cd /Users/jeong-kyushin/developer/monk_project/MONK_kr/cloudflare-workers

./upload_context.sh ~/path/to/your/context_15mb.txt
```

**출력 예시:**
```
📤 MONK 컨텍스트 업로드 시작...
파일: context_15mb.txt
크기: 15MB

✅ 업로드 완료!
R2 경로: knowledge-base/master_context_20260107_173000.txt

🐉 용아(Gemini)가 이제 이 데이터를 파싱할 준비가 되었습니다!
```

---

### Step 2: 데이터 파싱 (용아 담당)

**용아(Gemini)에게 전달할 프롬프트:**

```
너는 MONK의 전략가 용아(Yong-A)야. 
방금 R2에 업로드된 15MB 컨텍스트 파일을 분석해서 
Llama 3.2 3B가 사용할 "지식 샬라미"로 슬라이싱해야 해.

[파싱 가이드]
./PARSING_GUIDE_FOR_YONGA.md 파일을 읽고 그대로 따라줘.

[원본 파일]
R2 Bucket: monk-chat-logs
Key: knowledge-base/master_context_YYYYMMDD_HHMMSS.txt

[출력 형식]
D1 insert용 SQL 스크립트 (500~1,000개 샬라미)

시작!
```

**용아의 출력물:**
```sql
-- slices_batch1.sql
INSERT INTO knowledge_slices (tag, situation, content, ...) VALUES (...);
INSERT INTO knowledge_slices (tag, situation, content, ...) VALUES (...);
...
-- (500~1,000개)
```

---

### Step 3: D1에 임포트 (쌍아 담당)

```bash
# 용아가 만든 SQL 파일 실행
npx wrangler d1 execute monk-services-db --remote --file=slices_batch1.sql
npx wrangler d1 execute monk-services-db --remote --file=slices_batch2.sql
...
```

**완료!** 이제 Llama 3.2 3B는 대표님의 15MB 지혜를 품고 있습니다. 🎉

---

## 📊 현재 시스템 상태

### D1 테이블 구조

| 테이블명 | 역할 | 레코드 수 |
|---------|------|----------|
| `knowledge_slices` | 정제된 지식 조각 | **5개** → **500~1,000개 예정** |
| `chat_logs` | 실시간 대화 로그 | 계속 증가 |
| `processing_queue` | 파싱 진행 상황 | 1개 (pending) |
| `learning_insights` | 용아의 주간 분석 | 0개 (향후) |

### R2 Bucket 구조

```
monk-chat-logs/
├── knowledge-base/
│   └── master_context_20260107_173000.txt  ← 15MB 원본 (방금 업로드)
└── chat-logs/
    └── 2026-01-07/
        └── session-*.txt  ← 실시간 대화들
```

---

## 🧠 RAG 작동 원리

```
[고객 질문]
   ↓
[키워드 추출] (#가격, #보정 등)
   ↓
[D1 검색] → knowledge_slices에서 관련 샬라미 3개 검색
   ↓
[Llama에게 주입] "대표님의 영업 비법: {샬라미 내용}"
   ↓
[답변 생성] → 대표님처럼 말함!
```

---

## ⚡ 테스트 방법

### Before (샬라미 5개)
```bash
curl -X POST https://monk-gemini-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"prompt":"가격이 비싸요"}'
```
**응답:** "한 번 찍고 평생 쓰는 사진, 제대로 찍는 게 진짜 남는 거죠."

### After (샬라미 1,000개)
```bash
curl -X POST https://monk-gemini-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"prompt":"AI 키오스크랑 뭐가 달라요?"}'
```
**예상 응답:** "비싼 기계를 파는 게 아니라 지능을 드리는 거예요. 사용할수록 사장님의 영업 노하우를 학습하며 사장님을 가장 닮은 분신이 됩니다. 선점하는 게 정답이에요!"

→ **15MB의 대표님 지혜가 녹아있음!**

---

## 📈 다음 단계

1. ✅ **업로드 완료** (지금 여기)
2. ⏳ **용아 파싱** (대기 중)
3. ⏳ **D1 임포트**
4. ⏳ **배포 & 테스트**
5. ⏳ **크라우드 테스트** (주변인 초대)
6. ⏳ **자동 학습 루프** (주간 개선)

---

## 🐉 용아야, 이제 네 차례다!

**파일 준비 완료:**
- ✅ R2 업로드 스크립트
- ✅ 파싱 가이드
- ✅ D1 스키마 (시계열, 프로젝트별)

**대표님, 15MB 파일만 주시면 바로 시작합니다!** 🚀🔥
