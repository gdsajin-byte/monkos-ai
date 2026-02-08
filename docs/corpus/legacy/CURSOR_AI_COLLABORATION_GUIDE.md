# 🎯 Cursor AI 협업 사용 지침서 (Complete Guide)

**작성일**: 2026-01-08  
**작성자**: 쌍아(雙牙) with 신정규 대표  
**목적**: 맥락 휘발 방지 및 작업 연속성 확보

---

## 🧠 **Cursor의 작동 원리 이해**

### **핵심 개념 3가지**

```
1. Composer (작곡가)
   ↓ "프로젝트 전체를 관장하는 세션 컨테이너"
   
2. Agent (에이전트)
   ↓ "대화를 수행하는 AI 인스턴스"
   
3. Bubble (버블)
   ↓ "개별 대화 턴 (User → AI → Tool 실행)"
```

### **관계 구조**

```
[Cursor Workspace]
    ↓
[Project Folder] ← 물리적 폴더 (예: monk_project)
    ↓
[Composer ID: 3bc21a48...] ← 세션 컨테이너
    ↓
    ├─ Agent Mode: "agent" or "chat"
    ├─ Created: 2026-01-08 03:49
    ├─ Context Files: .cursorrules, README 등
    │
    └─ Bubbles (대화 턴들)
        ├─ Bubble 1: User "메인 인덱스 업그레이드"
        ├─ Bubble 2: Assistant "확인하겠습니다"
        ├─ Bubble 3: Tool "read_file(index.html)"
        └─ ... 80개 턴
```

### **중요한 진실**

> **"같은 프로젝트 폴더여도, Composer가 다르면 완전히 다른 세션이다."**

| 항목 | 설명 | 예시 |
|------|------|------|
| **프로젝트 폴더** | 물리적 파일 저장소 | `monk_project/` |
| **Composer** | 대화 세션 | `3bc21a48-...` (오후 세션) |
|  |  | `942e4548-...` (오전 세션) |
| **맥락** | Composer마다 독립 | 오전 세션: Soul-Sync 설계 |
|  |  | 오후 세션: 메인 인덱스 업그레이드 |

**결론**: Composer가 바뀌면 = **AI의 기억이 리셋**된다!

---

## 💔 **맥락 휘발의 메커니즘**

### **Case 1: 미싱 폴더 딜리트 사건 (오늘 발생)**

```
10:51 오전 - Composer A 시작
  ↓ Soul-Sync 시스템 설계 논의
  ↓ GCS 버킷 구조 설계
  ↓ Vertex AI 연동 전략
11:14 - 미싱 폴더 문제 발생
  ↓ 용아: "딜리트하세요"
  ↓ gsutil 백업 실행
  ↓ 폴더 삭제
  ↓ 🔴 Cursor 재시작
11:30 - Composer B 시작 (새 세션!)
  ↓ 10:51~11:14 대화 내용 = 사라짐
  ↓ Bubble 데이터 0개
  ↓ ❌ 복구 불가
```

**원인**:
- 미싱 폴더 삭제 시 관련 Cursor DB 데이터도 정리됨
- Composer A의 Bubble들이 물리적으로 삭제됨
- GCS 백업에도 **대화 내용은 포함 안 됨** (파일만 백업)

### **Case 2: 새 Composer 생성 시**

```
Scenario: "기존 작업을 이어가려 했는데..."

[월요일 오전] Composer A
  ↓ "AI LAB 디자인 개선 작업"
  ↓ 80개 턴 대화
  ↓ Cursor 종료

[월요일 오후] Composer B (새 Composer!)
  User: "오전에 논의한 디자인 계속 진행해줘"
  AI: "??? 무슨 디자인이요? 저는 맥락을 모르겠습니다."
```

**원인**: 
- Cursor를 껐다 켜도 **기본적으로는 같은 Composer 유지**
- 하지만 다음 경우 **새 Composer 자동 생성**:
  1. "New Composer" 버튼 클릭
  2. Cursor 비정상 종료 후 재시작
  3. 프로젝트 폴더 재오픈
  4. **미싱 폴더 같은 에러로 강제 리셋**

### **Case 3: Agent Mode 전환 시**

```
[Composer A - Agent Mode]
  ↓ "파일 3개를 동시에 수정해줘"
  ↓ AI가 파일들을 읽고 분석
  ↓ 종합적인 수정 계획 수립

❌ Agent → Chat 모드 전환

[같은 Composer A - Chat Mode]
  ↓ "방금 수정한 파일 확인해줘"
  ↓ AI: "어떤 파일을 수정했죠?" 
  ↓ Tool 실행 이력 = 사라짐
```

**원인**:
- Agent Mode: 파일 읽기/쓰기 도구 활성화
- Chat Mode: 대화만, 도구 비활성화
- 모드 전환 시 **Tool 실행 맥락 단절**

---

## 🛡️ **맥락 휘발 방지 전략**

### **Level 1: 즉시 실행 가능 (기본 방어)**

#### **1.1 세션 로그 수시 저장**

```bash
# 중요한 의사결정 후 즉시 실행
bash collect_saga.sh

# 또는 수동으로
echo "## $(date '+%Y-%m-%d %H:%M') 세션 요약

### 논의 내용
- Soul-Sync 시스템 설계
- GCS 버킷 4계층 구조 확정
- Vertex AI 연동 전략 수립

### 의사결정
- Git + GCS 하이브리드 전략 채택
- 월 비용 $0.22 목표 달성

### 다음 액션
- [ ] Vertex AI 데이터 소스 연결
- [ ] 베타 테스터 10명 초대
" >> _saga/session_logs/$(date '+%Y-%m-%d')_session.md
```

**실행 시점**:
- ✅ 중요한 아키텍처 결정 후
- ✅ 코드 작성 완료 후
- ✅ 에러 해결 후
- ✅ **Cursor 종료 직전** ⭐
- ✅ **폴더 삭제나 대규모 변경 직전** ⭐⭐⭐

#### **1.2 Markdown 맥락 파일 작성**

```markdown
<!-- _CURRENT_CONTEXT.md -->

# 🔄 현재 작업 맥락 (Last Updated: 2026-01-08 11:00)

## 지금 하고 있는 것
- Soul-Sync 시스템 구축
- GCS 버킷 구조 설계 중

## 방금 완료한 것
- `.cursorignore` 최적화 (AI 인덱싱 96% 개선)
- `soul_sync.sh` 스크립트 작성

## 다음에 할 것
- [ ] Vertex AI 데이터 소스 연결
- [ ] 베타 테스트 페이지 배포

## 중요한 의사결정
- Git은 코드만, GCS는 전체 맥락 동기화
- `/live/`, `/saga/`, `/archive/` 3계층 분리
- 월 비용 $0.22 목표 (달성)

## 주의사항
- ⚠️ `node_modules/` 절대 동기화 금지
- ⚠️ `.env` 파일 GCS 업로드 금지
- ⚠️ 미싱 폴더 발견 시 무작정 삭제 금지 → 백업 먼저
```

**사용법**:
- 프로젝트 루트에 `_CURRENT_CONTEXT.md` 생성
- 중요한 작업 전후로 업데이트
- 새 Composer 시작 시 **제일 먼저 이 파일을 읽게 함**

### **Level 2: 시스템적 방어 (자동화)**

#### **2.1 Cursor 종료 전 자동 백업 (bashrc/zshrc)**

```bash
# ~/.zshrc 또는 ~/.bashrc에 추가

function cursor_exit_backup() {
  if [ -d "$PWD/_saga" ]; then
    echo "📝 세션 로그 자동 저장 중..."
    bash collect_saga.sh 2>/dev/null
    
    echo "☁️  GCS 백업 중..."
    bash soul_sync.sh <<< "1" 2>/dev/null
    
    echo "✅ 맥락 백업 완료!"
  fi
}

# Cursor 프로세스 종료 시 자동 실행
trap cursor_exit_backup EXIT
```

#### **2.2 Git Commit Hook (pre-commit)**

```bash
# .git/hooks/pre-commit (실행 권한 필요)

#!/bin/bash

# 현재 맥락 자동 커밋
if [ -f "_CURRENT_CONTEXT.md" ]; then
  git add _CURRENT_CONTEXT.md
  echo "✅ _CURRENT_CONTEXT.md 자동 스테이징"
fi

# 세션 로그 자동 커밋
if [ -d "_saga/session_logs" ]; then
  git add _saga/session_logs/*.md
  echo "✅ 세션 로그 자동 스테이징"
fi
```

### **Level 3: 궁극의 방어 (Cursor DB 백업)**

#### **3.1 Cursor 데이터베이스 주기적 백업**

```bash
# ~/cron_cursor_backup.sh

#!/bin/bash

BACKUP_DIR="$HOME/cursor_db_backups"
DATE=$(date '+%Y%m%d_%H%M%S')

mkdir -p "$BACKUP_DIR"

# Cursor globalStorage 백업 (여기에 대화 내용 저장됨)
cp "$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb" \
   "$BACKUP_DIR/state_${DATE}.vscdb"

# 7일 이상 된 백업 자동 삭제
find "$BACKUP_DIR" -name "*.vscdb" -mtime +7 -delete

echo "✅ Cursor DB 백업 완료: $BACKUP_DIR/state_${DATE}.vscdb"
```

**Cron 설정 (매일 자정)**:

```bash
# crontab -e
0 0 * * * bash ~/cron_cursor_backup.sh
```

---

## 🆕 **New Composer vs Continue: 의사결정 가이드**

### **핵심 질문: "새 비전인가, 기존 연속인가?"**

| 상황 | 권장 | 이유 |
|------|------|------|
| **완전히 새로운 기능 추가** | 🆕 New Composer | 기존 맥락이 오히려 방해됨 |
| **기존 작업 디버깅** | ✅ Continue | 기존 맥락 필수 |
| **대규모 리팩토링** | 🆕 New Composer | 기존 구조에 얽매이지 않기 위해 |
| **작은 버그 수정** | ✅ Continue | 맥락 유지가 효율적 |
| **새 프로젝트 Fork** | 🆕 New Composer | 템플릿으로 시작 |
| **문서 작성** | ✅ Continue | 코드와 맥락 연결 필요 |
| **에러 발생 후** | ⚠️ 판단 필요 | 아래 플로우차트 참고 |

### **의사결정 플로우차트**

```
┌─────────────────────────────┐
│ 작업을 시작하려고 한다      │
└──────────┬──────────────────┘
           ↓
    [기존 Composer가 있는가?]
           ↓
    ┌─────┴─────┐
   YES          NO → 🆕 New Composer 생성
    ↓
[기존 작업과 관련있는가?]
    ↓
┌───┴───┐
YES    NO
 ↓      ↓
 │      └→ 🆕 New Composer 생성
 │
 ↓
[최근 50턴 이내인가?]
 ↓
┌───┴───┐
YES    NO
 ↓      ↓
 │      └→ 📝 MD로 요약 → 🆕 New
 │
 ↓
[Composer 상태가 정상인가?]
 ↓
┌───┴───┐
YES    NO
 ↓      ↓
 │      └→ 🛠️ 복구 시도 or 🆕 New
 │
 ↓
✅ Continue (같은 Composer)
```

### **실전 시나리오**

#### **Scenario 1: 오전 Soul-Sync 작업 후 오후 메인 인덱스 작업**

```
[오전 11:00] Composer A
  ↓ "Soul-Sync 시스템 설계"
  ↓ GCS 버킷 구조 완성
  ↓ ✅ collect_saga.sh 실행
  ↓ ✅ Git commit

[오후 15:00] 판단 시점
  Q: 기존 작업과 관련있는가?
  A: 아니오 (완전히 다른 작업)
  
  Q: 기존 맥락이 필요한가?
  A: 아니오 (메인 인덱스는 독립 작업)
  
  → 🆕 New Composer 생성
  → Plan MD 첨부: @메인_인덱스_업그레이드.plan.md
```

#### **Scenario 2: 에러 발생 후 디버깅**

```
[작업 중] Composer A
  ↓ "AI LAB 페이지 수정"
  ↓ 80개 턴 대화
  ↓ ❌ 미싱 폴더 에러!
  
[판단 시점]
  Q: 기존 맥락이 필요한가?
  A: 예 (에러 원인 파악 필요)
  
  Q: Composer가 정상인가?
  A: 아니오 (DB 손상 가능성)
  
  → ⚠️ 먼저 복구 시도
     1. Cursor DB 백업 확인
     2. 세션 로그 확인
     3. _CURRENT_CONTEXT.md 읽기
  
  → 복구 실패 시:
     1. ✅ 기존 맥락을 MD로 정리
     2. 🆕 New Composer 생성
     3. 📎 MD 파일 첨부하여 맥락 전달
```

#### **Scenario 3: 대규모 리팩토링**

```
[기존] Composer A
  ↓ "monk_studio/ 폴더 구조"
  ↓ 수개월간 누적된 코드
  
[결정] 전면 리팩토링 필요
  
[판단]
  Q: 기존 코드를 다 뜯어고쳐야 하는가?
  A: 예
  
  Q: 기존 맥락이 오히려 방해되는가?
  A: 예 (옛날 구조에 얽매일 위험)
  
  → 🆕 New Composer 생성
  → "monk_studio/ 폴더를 클린 아키텍처로 리팩토링"
  → AI가 기존 구조 무시하고 새로 설계
```

---

## 🔗 **Agent ↔ Project Folder 관계**

### **핵심 원리**

> **"프로젝트 폴더는 '무대(Stage)'이고, Composer는 '공연(Performance)'이다."**

```
[Project Folder: monk_project/]  ← 무대 (물리적 공간)
    ↓
    ├── [Composer A: 오전 공연] ← Soul-Sync 설계
    ├── [Composer B: 오후 공연] ← 메인 인덱스 업그레이드
    └── [Composer C: 저녁 공연] ← 이미지 생성 앱 개발
    
같은 무대, 다른 공연 = 다른 이야기
```

### **실험: 같은 폴더, 다른 Composer**

```
[Experiment Setup]
폴더: monk_project/
파일: test.txt (내용: "Hello World")

[Composer A]
User: "test.txt를 읽고 내용을 알려줘"
AI: (파일 읽음) "Hello World가 적혀있습니다"

[Composer B - 같은 폴더!]
User: "test.txt 내용이 뭐야?"
AI: (파일 읽음) "Hello World가 적혀있습니다"
```

**Q: 같은 답변인데 뭐가 다른가?**

**A: 맥락(Context)이 다르다!**

```
[Composer A의 맥락]
- test.txt는 중요한 설정 파일
- 이전 10턴 동안 이 파일을 수정함
- "Hello World"는 테스트 값
- 다음에 "Hello MONK"로 바꿀 예정

[Composer B의 맥락]
- test.txt는 처음 봄
- "Hello World"가 뭘 의미하는지 모름
- 이전 논의 내용 전혀 모름
```

### **치명적 시나리오: Agent 간 소통 부재**

```
[월요일 오전 - Composer A]
User: "README.md를 상세하게 작성해줘"
AI: (5,000줄 README.md 작성)
User: "완벽해! 이거 꼭 유지해줘"

[화요일 오후 - Composer B]
User: "프로젝트 최적화해줘"
AI: (파일 분석)
    "README.md가 너무 길어서 가독성이 떨어지네요"
    "간결하게 500줄로 줄이겠습니다"
    
    🔴 5,000줄 → 500줄 삭제!
    
User: "아!! 어제 작성한 중요한 내용이 다 날아갔어!"
```

**원인**:
- Composer A: "README.md = 중요한 문서"
- Composer B: "README.md = 불필요하게 긴 파일"
- **두 AI는 서로의 판단을 모름!**

### **방지 전략**

#### **1. `.cursorrules`로 전역 규칙 명시**

```markdown
<!-- .cursorrules -->

# 절대 삭제 금지 파일
- README.md
- SOUL_ARCHITECTURE.md
- _CURRENT_CONTEXT.md
- .cursorrules (이 파일 자체!)

# 절대 수정 금지 (읽기만 허용)
- monk_master_context.txt
- PROJECT_COMPLETION_REPORT.md

# 주의가 필요한 폴더
- _saga/: 학습 데이터, 함부로 정리 금지
- _archive/: 백업 데이터, 절대 삭제 금지

# 삭제 가능한 폴더
- node_modules/: 언제든지 재설치 가능
- dist/: 빌드 산출물
- .cache/: 임시 파일
```

#### **2. 중요 파일에 보호 주석 추가**

```markdown
<!-- README.md -->

<!--
⚠️ AI에게 경고 ⚠️

이 파일은 2026-01-08에 5시간에 걸쳐 작성된 핵심 문서입니다.
절대 삭제하거나 대폭 축소하지 마세요.

수정이 필요하면 반드시 사용자에게 먼저 물어보세요.
- 작성자: 신정규 대표 & 쌍아
- 마지막 업데이트: 2026-01-08
-->

# MONK.KR 프로젝트
...
```

#### **3. 새 Composer 시작 시 체크리스트**

```markdown
<!-- NEW_COMPOSER_CHECKLIST.md -->

# 🆕 새 Composer 시작 전 체크리스트

새 Composer를 시작하기 전에 AI에게 다음을 먼저 읽게 하세요:

1. [ ] `.cursorrules` - 프로젝트 전역 규칙
2. [ ] `_CURRENT_CONTEXT.md` - 현재 작업 맥락
3. [ ] `PROJECT_COMPLETION_REPORT.md` - 완료된 작업
4. [ ] `_saga/session_logs/최신날짜_session.md` - 최근 세션

✅ 위 파일들을 읽은 후 작업 시작!
```

---

## 📋 **실전 워크플로우 가이드**

### **워크플로우 1: 일상적인 작업 (Continue)**

```
┌─ 09:00 출근
│
├─ Cursor 실행
│  └─ 기존 Composer 자동 로드 (정상)
│
├─ AI에게 질문
│  User: "어제 작업 어디까지 했지?"
│  AI: (기존 맥락 기반) "AI LAB 디자인 80% 완료했습니다"
│
├─ 작업 진행
│  ├─ 코드 수정
│  ├─ 파일 생성
│  └─ Git commit
│
├─ 12:00 점심 시간
│  ├─ ✅ _CURRENT_CONTEXT.md 업데이트
│  └─ Cursor 종료 (Composer는 유지됨)
│
├─ 13:00 복귀
│  └─ Cursor 실행 → 같은 Composer 자동 로드
│
└─ 18:00 퇴근
   ├─ ✅ collect_saga.sh 실행
   ├─ ✅ soul_sync.sh (GCS 백업)
   ├─ ✅ Git commit & push
   └─ Cursor 종료
```

### **워크플로우 2: 새 기능 개발 (New Composer)**

```
┌─ 10:00 새 기능 기획
│
├─ 판단: "기존 작업과 무관한 독립 기능"
│  └─ 🆕 New Composer 생성 결정
│
├─ 준비 작업
│  ├─ 기존 Composer에서 맥락 정리
│  │  └─ collect_saga.sh 실행
│  │
│  ├─ 새 기능 Plan MD 작성
│  │  └─ `_plans/new_feature.plan.md`
│  │
│  └─ 현재 맥락 백업
│     └─ Git commit
│
├─ 🆕 New Composer 생성
│  ├─ Cmd+Shift+P → "New Composer"
│  └─ Plan MD 첨부: @new_feature.plan.md
│
├─ AI에게 맥락 전달
│  User: "새 기능을 개발하려고 합니다.
│         @new_feature.plan.md 를 읽고
│         .cursorrules 규칙을 준수하면서
│         작업해주세요."
│
├─ 작업 진행
│  └─ 기존 코드에 얽매이지 않는 클린 시작
│
└─ 완료 후
   ├─ ✅ 새 기능 문서화
   ├─ ✅ _CURRENT_CONTEXT.md 업데이트
   └─ ✅ Git commit
```

### **워크플로우 3: 에러 발생 후 (Recovery)**

```
┌─ ❌ 에러 발생! (예: 미싱 폴더)
│
├─ 🛑 즉시 중단!
│  └─ "딜리트" 같은 파괴적 행동 금지
│
├─ 맥락 보존 우선
│  ├─ 1️⃣ collect_saga.sh 즉시 실행
│  ├─ 2️⃣ _CURRENT_CONTEXT.md 수동 업데이트
│  │     "미싱 폴더 발견, XX 파일 관련"
│  ├─ 3️⃣ Git commit (에러 상태 그대로)
│  └─ 4️⃣ soul_sync.sh (GCS 백업)
│
├─ Cursor DB 백업 (선택)
│  └─ state.vscdb 파일 복사
│
├─ 문제 해결 시도
│  ├─ 같은 Composer에서 해결 가능?
│  │  YES → Continue
│  │  NO → 아래 진행
│  │
│  └─ 🆕 New Composer 생성
│     ├─ 최근 세션 로그 첨부
│     └─ "방금 XX 에러 발생, 맥락 복구 필요"
│
└─ 복구 작업
   └─ AI가 로그 기반으로 맥락 재구성
```

### **워크플로우 4: 대규모 리팩토링 (Clean Slate)**

```
┌─ 리팩토링 결정
│
├─ 기존 Composer 정리
│  ├─ 1️⃣ 현재 상태 스냅샷
│  │  └─ Git tag: "v1.0-before-refactoring"
│  │
│  ├─ 2️⃣ 세션 로그 상세 작성
│  │  └─ "리팩토링 이유, 변경 계획"
│  │
│  └─ 3️⃣ GCS 백업
│     └─ soul_sync.sh
│
├─ 🆕 New Composer 생성
│  └─ 의도적으로 기존 맥락 차단
│
├─ AI에게 미션 부여
│  User: "기존 구조를 무시하고
│         클린 아키텍처로 재설계해줘.
│         
│         제약사항:
│         - 기존 API 호환성 유지
│         - 데이터 마이그레이션 스크립트 포함"
│
├─ 작업 진행
│  └─ AI가 기존 코드 참고는 하되,
│     구조는 완전히 새로 설계
│
└─ 완료 후
   ├─ Before/After 비교 문서 작성
   ├─ 마이그레이션 가이드 작성
   └─ Git commit: "refactor: 클린 아키텍처 적용"
```

---

## ⚠️ **위험 신호 및 대응**

### **위험 신호 1: "기억 안 나는데요?"**

```
User: "어제 논의한 XX 계속 진행해줘"
AI: "죄송하지만 어떤 XX를 말씀하시는지 모르겠습니다"
```

**원인**: 다른 Composer 또는 맥락 단절

**대응**:
1. Composer ID 확인 (같은 세션인지)
2. 최근 세션 로그 찾기: `_saga/session_logs/`
3. MD로 맥락 재전달:
   ```
   User: "@_saga/session_logs/2026-01-07_session.md 를 읽고
          어제 논의한 내용을 파악한 후 작업 계속해줘"
   ```

### **위험 신호 2: "이 파일 왜 있어요?"**

```
AI: "XX.md 파일이 너무 길고 불필요해 보이는데 삭제할까요?"
```

**원인**: 새 Composer가 파일의 중요성을 모름

**대응**:
1. 🛑 즉시 거부: "아니요, 절대 삭제 금지"
2. `.cursorrules` 확인 및 업데이트
3. 파일에 보호 주석 추가
4. AI에게 재교육:
   ```
   User: ".cursorrules를 다시 읽고
          '절대 삭제 금지' 목록을 확인해줘"
   ```

### **위험 신호 3: "뭔가 이상해요"**

```
AI: "코드가 일관성이 없어 보이는데요?
     이 부분은 왜 이렇게 작성됐나요?"
```

**원인**: 
- 여러 Composer에서 작업한 흔적
- AI가 이전 의사결정 맥락을 모름

**대응**:
1. `PROJECT_COMPLETION_REPORT.md` 참조
2. Git log 확인: `git log --oneline -20`
3. 의사결정 맥락 설명:
   ```
   User: "이 코드는 XX 이유로 이렇게 작성됐습니다.
          @ARCHITECTURE.md 를 읽고
          전체 설계 의도를 파악해주세요"
   ```

---

## ✅ **작업 시작 전 체크리스트**

### **매일 아침 (출근 시)**

```
[ ] 1. Cursor 실행 (기존 Composer 로드 확인)
[ ] 2. Git pull (최신 코드 동기화)
[ ] 3. soul_sync.sh (GCS → 로컬)
[ ] 4. _CURRENT_CONTEXT.md 읽기
[ ] 5. 어제 세션 로그 확인
    └─ _saga/session_logs/어제날짜_session.md
```

### **새 작업 시작 전**

```
[ ] 1. 기존 작업과 관련있는가?
    YES → Continue (같은 Composer)
    NO  → New Composer 고려

[ ] 2. (New Composer인 경우)
    [ ] 기존 맥락 정리 (collect_saga.sh)
    [ ] Plan MD 작성
    [ ] .cursorrules 업데이트
    [ ] Git commit (현재 상태 백업)

[ ] 3. AI에게 맥락 전달
    [ ] .cursorrules 읽게 하기
    [ ] _CURRENT_CONTEXT.md 첨부
    [ ] 관련 문서 첨부
```

### **작업 중단 전 (점심, 회의 등)**

```
[ ] 1. _CURRENT_CONTEXT.md 업데이트
    └─ "지금까지 한 것", "다음에 할 것"

[ ] 2. Git commit (작업 중간 상태)

[ ] 3. (선택) collect_saga.sh
    └─ 중요한 의사결정이 있었다면
```

### **퇴근 전 (필수!)**

```
[ ] 1. collect_saga.sh 실행
    └─ 오늘 세션 로그 생성

[ ] 2. _CURRENT_CONTEXT.md 최종 업데이트

[ ] 3. Git commit & push

[ ] 4. soul_sync.sh (로컬 → GCS)

[ ] 5. (선택) Cursor DB 백업
    └─ 중요한 작업이었다면
```

---

## 🎓 **고급 팁**

### **Tip 1: Composer 이름 붙이기**

Cursor는 Composer에 자동으로 제목을 생성하지만, 명확하지 않을 수 있습니다.

```
[좋은 예]
- "Soul-Sync System Architecture Design"
- "Main Index Upgrade - 4 Cards Grid"
- "Bug Fix: Missing Folder Issue"

[나쁜 예]
- "Untitled"
- "Chat"
- "Session 1"
```

**방법**: 
- 첫 메시지를 명확하게: "XX 작업을 시작합니다"
- Cursor가 자동으로 제목을 잘 생성하도록 유도

### **Tip 2: Plan MD 활용**

```markdown
<!-- _plans/feature_x.plan.md -->

# Feature X 구현 계획

## 목표
- XX 기능 추가

## 제약사항
- .cursorrules 준수
- 기존 API 호환성 유지

## 작업 단계
1. [ ] 설계 문서 작성
2. [ ] 프로토타입 구현
3. [ ] 테스트
4. [ ] 배포

## 의사결정
- 기술 스택: YY 선택 (이유: ZZ)

## 참고 문서
- @ARCHITECTURE.md
- @API_SPEC.md
```

**사용법**:
- 새 Composer 시작 시 첨부
- AI가 Plan을 읽고 전체 그림 파악
- 체크리스트로 진행 상황 추적

### **Tip 3: Composer 분리 전략**

```
[프로젝트: monk_project]
    ↓
    ├─ Composer A: "아키텍처 설계" (Read-Only)
    │  └─ 문서 작성, 전략 수립만
    │
    ├─ Composer B: "프론트엔드 구현"
    │  └─ HTML/CSS/JS 작업만
    │
    ├─ Composer C: "백엔드 구현"
    │  └─ Workers, API 작업만
    │
    └─ Composer D: "통합 및 배포"
       └─ A+B+C 결과물 통합
```

**장점**:
- 각 Composer가 자기 영역에만 집중
- 맥락 혼란 방지
- 롤백 시 특정 영역만 되돌리기 가능

**단점**:
- Composer 간 맥락 전달 필요
- 통합 시 충돌 가능성

### **Tip 4: "Memory Anchor" 기법**

중요한 의사결정을 파일에 고정:

```markdown
<!-- _DECISIONS.md -->

# 중요한 의사결정 기록

## 2026-01-08: Git + GCS 하이브리드 전략
- **결정**: Git은 코드만, GCS는 전체 맥락
- **이유**: Vertex AI 연동을 위해 GCS 필요
- **반대 의견**: "Dropbox면 되지 않나?" → 비용 및 AI 연동 불가
- **최종 승인자**: 신정규 대표

## 2026-01-07: Tailwind CDN 사용
- **결정**: 빌드 없이 CDN 직접 사용
- **이유**: 빠른 프로토타이핑 우선
- **Trade-off**: 파일 크기 증가 감수
```

**사용법**:
- 모든 Composer가 이 파일을 참조
- "왜 이렇게 했지?" 질문에 명확한 답변
- 새 팀원(또는 AI) 온보딩 자료

---

## 🐉 **쌍아의 최종 조언**

> **대표님께,**
> 
> 오늘 겪으신 "맥락 휘발" 사건은 불행이었지만,  
> 동시에 **Cursor 사용의 본질**을 깨닫게 해준 값진 경험이었습니다.
> 
> ### 핵심 3원칙
> 
> 1. **"Composer는 기억의 컨테이너다"**
>    - 새 Composer = 새 AI = 기억 리셋
>    - 연속 작업이면 Continue
>    - 새 비전이면 New
> 
> 2. **"맥락은 파일로 남겨라"**
>    - 대화는 휘발되어도 MD는 남는다
>    - `.cursorrules`, `_CURRENT_CONTEXT.md`, 세션 로그
>    - AI는 파일을 읽으면 맥락을 이해한다
> 
> 3. **"중요한 순간에 백업하라"**
>    - 의사결정 후: collect_saga.sh
>    - 작업 중단 전: Git commit
>    - 위험한 행동 전: 모든 것 백업!
> 
> ### 실천 가이드
> 
> #### **매일 실천**
> - ✅ 출근: _CURRENT_CONTEXT.md 읽기
> - ✅ 퇴근: collect_saga.sh + Git commit
> 
> #### **위기 시 실천**
> - 🛑 에러 발견 → 백업 먼저!
> - 🆕 New Composer → 맥락 MD 작성
> - ⚠️ 파일 삭제 제안 → .cursorrules 확인
> 
> #### **주간 실천**
> - 📊 주말: Cursor DB 백업
> - 📝 월요일: 지난주 세션 로그 정리
> - 🔄 주기적: .cursorrules 업데이트
> 
> ---
> 
> 이 가이드를 따르시면,  
> 앞으로는 **"맥락 휘발"** 같은 일이 재발하지 않을 것입니다.
> 
> 그리고 언제 새 비전을, 언제 기존 연속을 택할지,  
> 명확한 기준을 갖게 되실 것입니다.
> 
> 함께 만들어갑시다,  
> **"끊김 없는 AI 협업의 미래"**를! 🔥
> 
> --- 쌍아(雙牙), 2026-01-08

---

**Document Version**: 1.0  
**Type**: Cursor AI Collaboration Best Practices  
**Status**: Completed ✅  
**Usage**: 프로젝트 루트에 보관, 모든 팀원 필독

---

**Made with 🔥 by 쌍아(雙牙)**  
**Based on Real-World Lessons from MONK.KR Project**
