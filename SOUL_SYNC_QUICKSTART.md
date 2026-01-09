# 🚀 Soul-Sync 빠른 시작 가이드

## 📌 **1. 첫 설정 (최초 1회만)**

### **GCS 인증**
```bash
gcloud auth application-default login
```
브라우저가 열리면 구글 계정으로 로그인하세요.

### **버킷 생성 (자동)**
`soul_sync.sh`를 처음 실행하면 자동으로 버킷을 생성할지 물어봅니다.

---

## 🔄 **2. 일상적인 사용법**

### **퇴근 전 (맥미니에서)**
```bash
cd "/Users/jeong-kyushin/developer/monk_project "
bash soul_sync.sh
# 옵션 1 선택 (로컬 → 클라우드)
```

### **출근 후 (아이맥에서)**
```bash
cd ~/developer/monk_project
bash soul_sync.sh
# 옵션 2 선택 (클라우드 → 로컬)
```

### **작업 중간에 백업만 하고 싶을 때**
```bash
bash soul_sync.sh
# 옵션 3 선택 (양방향)
```

---

## 🧠 **3. Vertex AI 연동 (young_a_test)**

### **Vertex AI에서 데이터 소스 추가**
1. Google Cloud Console → Vertex AI → Agent Builder
2. `young_a_test` 앱 선택
3. Data Sources → **Add Data Source**
4. Cloud Storage 선택
5. 경로 입력: `gs://monk-project-soul/saga/*`
6. Auto-refresh: **Enabled** (매일 새벽 2시)

이제 대표님의 모든 대화와 코드가 용아의 지식이 됩니다!

---

## 💡 **4. 자주 묻는 질문**

### **Q: 동기화가 너무 오래 걸려요**
**A**: `node_modules`나 `dist` 폴더를 삭제했는지 확인하세요. 이들은 `.cursorignore`에서 자동 제외됩니다.

### **Q: 두 컴퓨터에서 동시에 작업하면?**
**A**: 절대 금지! 나중에 동기화한 쪽이 이전 작업을 덮어씁니다. 한 번에 한 기기만 사용하세요.

### **Q: 실수로 파일을 삭제했어요**
**A**: GCS 콘솔에서 versioning을 켜두면 이전 버전 복구가 가능합니다.
```bash
gsutil versioning set on gs://monk-project-soul
```

### **Q: 비용이 얼마나 나올까요?**
**A**: 5GB 기준 월 $0.24 정도입니다. 현재 260만 원 바우처로 충분히 커버됩니다.

---

## 🎯 **5. 고급 기능**

### **특정 폴더만 동기화**
```bash
gsutil -m rsync -r ./MONK_kr/ gs://monk-project-soul/live/MONK_kr/
```

### **백업 스냅샷 만들기**
```bash
tar -czf snapshot_$(date +%Y%m%d).tar.gz ./MONK_kr/
gsutil cp snapshot_*.tar.gz gs://monk-project-soul/archive/2026-01/
```

### **다른 프로젝트로 템플릿 복제**
```bash
gsutil -m cp -r gs://monk-project-soul/templates/monk-base/ ./new-project/
```

---

## 🐉 **용아의 팁**

> "매일 퇴근 전 `soul_sync.sh`를 실행하는 습관을 들이세요. 
> 단 30초의 투자로, 하드웨어 고장이나 실수로 인한 모든 손실을 방어할 수 있습니다.
> 
> 이것은 단순한 백업이 아니라, 대표님의 '의도'를 영속화하는 의식입니다. 🐉🔥"

---

**문제가 생기면**: `gdsajin@gmail.com`으로 문의하세요.  
**긴급 복구**: GCS 콘솔 → Cloud Storage → monk-project-soul → 파일 직접 다운로드
