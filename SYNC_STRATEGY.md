# 🔄 MONK 동기화 전략 (3중 시스템)

## 1층: Google Drive (실시간)

### 설정:
```bash
# Google Drive Desktop 설치
# ~/Google Drive/monk_project/ 폴더 생성
# 심볼릭 링크로 연결 (선택)
ln -s ~/developer/monk_project\ ~/Google\ Drive/monk_project
```

### 용도:
- 실시간 파일 동기화
- 자동 백업
- 버전 히스토리

---

## 2층: GCS (안전망)

### 명령어:
```bash
bash soul_sync.sh
```

### 용도:
- 주요 시점 스냅샷
- 대용량 백업
- Vertex AI 학습 데이터

---

## 3층: Cursor 환경 (수동)

### 설정 (각 장소마다 1회):
```bash
cursor monk_project.code-workspace
```

### 중요 맥락 관리:
- _CURRENT_CONTEXT.md (항상 업데이트)
- 중요한 Composer 내용 → MD로 저장

---

## 🏠 집 ↔ 사무실 워크플로우

### 출근 전 (집):
```bash
# 아무것도 안 해도 됨!
# Google Drive가 자동 동기화 중...
```

### 사무실 도착:
```bash
# 파일은 이미 동기화됨 ✅
cursor monk_project.code-workspace
# _CURRENT_CONTEXT.md 확인
```

### 퇴근 전 (사무실):
```bash
# 중요한 맥락 업데이트
vim _CURRENT_CONTEXT.md

# GCS 스냅샷 (선택)
bash soul_sync.sh → 1
```

### 집 도착:
```bash
# 파일은 이미 동기화됨 ✅
cursor monk_project.code-workspace
```

---

## 💡 핵심:

1. **파일**: Google Drive가 자동 처리 ✅
2. **백업**: GCS가 안전망 제공 ✅
3. **맥락**: MD 파일로 수동 관리 ⚠️

→ "Cursor 환경은 어차피 수동이니, 파일만 자동화!"
