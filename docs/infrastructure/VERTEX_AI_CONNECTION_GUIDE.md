# 🧠 Vertex AI ↔ GCS 연동 가이드

**대상 앱**: young_a_test  
**목적**: GCS의 Saga 데이터를 Vertex AI가 자동으로 학습하게 만들기

---

## 🚀 **연동 절차 (5분 소요)**

### **Step 1: Vertex AI Agent Builder 접속**

1. **Google Cloud Console** 열기: https://console.cloud.google.com
2. 좌측 메뉴 → **Vertex AI** → **Agent Builder** 클릭
3. `young_a_test` 앱 선택 (없으면 새로 생성)

---

### **Step 2: Data Sources 추가**

1. 좌측 메뉴에서 **Data** → **Data Stores** 클릭
2. **Create Data Store** 버튼 클릭
3. 다음과 같이 설정:

| 항목 | 값 |
|------|-----|
| **Data source type** | Cloud Storage |
| **Region** | asia-northeast3 (Seoul) |
| **Bucket URI** | `gs://monk-project-soul/saga/*` |
| **Data type** | Unstructured documents |
| **Document parsing** | Layout Parser (추천) |

4. **Continue** 클릭

---

### **Step 3: Data Store 이름 설정**

| 항목 | 값 |
|------|-----|
| **Data Store name** | `monk-saga-knowledge` |
| **Data Store ID** | `monk-saga-knowledge` (자동 생성) |
| **Region** | `global` 또는 `asia-northeast3` |

**Create** 버튼 클릭!

---

### **Step 4: 앱에 Data Store 연결**

1. **Apps** 메뉴로 이동
2. `young_a_test` 앱 선택
3. **Configurations** 탭 클릭
4. **Data Stores** 섹션에서 **Add Data Store** 클릭
5. 방금 만든 `monk-saga-knowledge` 선택
6. **Save** 클릭

---

### **Step 5: 자동 갱신 설정**

1. **Data Stores** → `monk-saga-knowledge` 선택
2. **Settings** 탭 클릭
3. **Import schedule** 설정:
   - **Enable automatic refresh**: ✅ 체크
   - **Frequency**: Daily (매일)
   - **Time**: 02:00 KST (새벽 2시)

---

### **Step 6: 첫 인덱싱 시작**

1. **Data** 탭 → **Activity** 섹션
2. **Import** 버튼 클릭
3. **Start import** 확인

**⏱️ 인덱싱 시간**: 약 5~10분 소요 (15MB 기준)

---

## ✅ **연동 확인 테스트**

인덱싱이 완료되면 `young_a_test` 앱의 채팅창에서 다음과 같이 질문해보세요:

### **테스트 질문들**

```
Q1: "MONK.KR 프로젝트의 4 MUSE 시스템이 뭐야?"
→ 쌍아, 소소, 민아, 용아를 정확히 답해야 함

Q2: "Soul-Sync가 뭐야?"
→ 하이브리드 웍스페이스 전략을 설명해야 함

Q3: "Monkos.ai는 어떤 엔진을 사용해?"
→ Llama 3.2 3B를 답해야 함

Q4: "어제 우리가 논의한 무한 순환 구조가 뭐였지?"
→ 대화 → 코드 → 지식 → AI → 피드백 루프를 설명해야 함
```

**모두 정확히 답하면 연동 성공!** 🎉

---

## 🔄 **일상적인 업데이트 워크플로우**

### **매일 퇴근 전**

```bash
cd "/Users/jeong-kyushin/developer/monk_project "
bash soul_sync.sh  # 옵션 1 (업로드)
```

→ 오늘의 작업이 GCS로 올라감  
→ 내일 새벽 2시에 Vertex AI가 자동으로 학습  
→ 출근 후 `young_a_test`가 어제 대화를 기억함!

---

## 🐉 **용아의 팁**

### **학습 품질을 높이는 방법**

1. **세션 로그 작성**: `bash collect_saga.sh`로 오늘의 핵심 요약
2. **파일 이름 규칙**: 날짜 + 주제 (예: `2026-01-08_soul_sync_strategy.md`)
3. **구조화**: 마크다운으로 헤더, 리스트, 코드블록 명확히 구분
4. **중복 제거**: 같은 내용 반복 대신, 링크로 참조

### **모니터링**

```bash
# 버킷 용량 확인
gsutil du -sh gs://monk-project-soul/saga/

# 최근 업로드된 파일 확인
gsutil ls -lh gs://monk-project-soul/saga/ | tail -10
```

---

## ⚠️ **주의사항**

1. **비용**: 데이터가 많아지면 인덱싱 비용이 증가합니다. 현재 15MB는 무시 가능 수준.
2. **민감 정보**: API 키, 비밀번호 등은 절대 Saga 폴더에 넣지 마세요.
3. **파일 형식**: TXT, MD, PDF, DOCX 지원. 이미지는 OCR 필요.

---

## 🚀 **고급: API를 통한 실시간 학습**

나중에 Workers에서 직접 Vertex AI에 쿼리를 보낼 수도 있습니다:

```javascript
// Cloudflare Workers에서 Vertex AI 호출 예시
const response = await fetch(
  'https://discoveryengine.googleapis.com/v1/projects/YOUR_PROJECT/locations/global/collections/default_collection/dataStores/monk-saga-knowledge/servingConfigs/default_search:search',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERTEX_AI_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: userQuestion,
      pageSize: 5
    })
  }
);
```

이렇게 하면 **Llama 3.2 3B (빠른 답변) + Vertex AI (깊은 지식)**을 결합할 수 있습니다!

---

**Made with 🔥 by 용아 & 쌍아**  
**MONK.KR - Evolution of Creative Intelligence**
