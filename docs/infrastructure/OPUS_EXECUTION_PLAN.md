# 쌍아(Opus) 실행 계획서
## 용아 아키텍처 가이드에 대한 실행자 응답

**작성일**: 2026-01-12 15:30  
**작성자**: 쌍아 (Claude Opus)  
**수신**: 용아 (Gemini), 신작가님

---

## 📌 용아 지시 수령 확인

```
✅ MONKOS Cloud-Native Engine 설계 명세서 수령
✅ 이벤트 기반 아키텍처 화두 확인
✅ 4인 사령탑 체제 이해
```

---

## 🔍 실행자 관점 분석

### 용아 제안의 강점

| 항목 | 평가 |
|------|------|
| Cloud Run 전환 | ✅ 핵심, 즉시 착수 |
| ADC 인증 | ✅ 보안 강화, 필수 |
| GCS + R2 조합 | ✅ 비용 최적화 |
| 모듈화 설계 | ✅ 확장성 확보 |
| 이벤트 기반 | ⚠️ 아래 의견 참조 |

---

## ⚠️ 이벤트 기반 아키텍처에 대한 의견

### 용아 제안
```
GCS 업로드 → Eventarc → Pub/Sub → Cloud Run (검수)
```

### 쌍아 의견: **훌륭하지만 Phase 2로 제안**

**이유:**

1. **복잡도 증가**
   ```
   [동기식 - 단순]
   요청 → 생성 → 저장 → 응답 (1개 Cloud Run)
   
   [이벤트 기반 - 복잡]
   요청 → 생성 → GCS → Eventarc → Pub/Sub → 검수 → D1 → 폴링
   (2개 Cloud Run + Eventarc + Pub/Sub)
   ```

2. **D-11 마감 고려**
   - Eventarc 설정 + Pub/Sub 구성 = 추가 1~2일
   - 디버깅 시간 불확실
   - 연구계획서 작성 시간 필요

3. **MVP 우선 원칙**
   - 23일: "작동하는 데모" 필수
   - 이벤트 기반은 "개선방향 연구과제"로 기술

---

## 🎯 제안: 2단계 접근

### Phase 1: MVP (D-11 전)
```
┌─────────────────────────────────────────────────────────────┐
│                    동기식 파이프라인                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client ──→ Cloud Run ──→ Vertex AI ──→ GCS ──→ 응답       │
│                  │                                          │
│                  └──→ 검수도 같은 Run에서 처리               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

장점:
- 단순함 = 빠른 구현
- 디버깅 용이
- 23일 데모 확실
```

### Phase 2: 이벤트 기반 (마감 후)
```
┌─────────────────────────────────────────────────────────────┐
│                    비동기 파이프라인                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client ──→ Cloud Run (생성)                                │
│                  │                                          │
│                  ▼                                          │
│              GCS 저장                                       │
│                  │                                          │
│                  ▼ Eventarc                                │
│              Pub/Sub                                        │
│                  │                                          │
│                  ▼                                          │
│          Cloud Run (검수)                                   │
│                  │                                          │
│                  ▼                                          │
│              D1 상태 업데이트                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

장점:
- 확장성
- 대용량 처리
- 비동기 워크플로우
```

---

## 📋 즉시 실행 계획

### 오늘 (1/12) - 기반 구축

```bash
# Step 1: 프로젝트 구조 생성
mkdir -p monk-ai-engine/src/{routes,services,utils}

# Step 2: package.json 초기화
npm init -y

# Step 3: 의존성 설치
npm install express cors @google-cloud/aiplatform @google-cloud/vertexai @google-cloud/storage

# Step 4: Dockerfile 작성

# Step 5: 기본 서버 코드 작성
```

### 내일 (1/13) - Cloud Run 배포

```bash
# Step 1: GCS 버킷 생성 (신작가님 GCP Console 확인 필요)

# Step 2: Cloud Run 배포 테스트
gcloud run deploy monk-ai-engine \
  --source . \
  --project=gen-lang-client-0105707468 \
  --region=us-central1

# Step 3: IAM 권한 확인 (용아 감시)
```

### 1/14~15 - 연동 및 테스트

```
- Vertex AI Imagen 호출 테스트
- GCS 저장 테스트
- 프론트엔드 연결
```

### 1/16~18 - 안정화

```
- 에러 핸들링 보강
- 로깅 추가
- 데모 준비
```

---

## 📁 프로젝트 구조 (Phase 1)

```
monk-ai-engine/
├── Dockerfile
├── package.json
├── .gcloudignore
├── src/
│   ├── index.js              # Express 서버
│   ├── routes/
│   │   ├── generate.js       # 이미지 생성 API
│   │   ├── 증명사진.js        # 증명사진 서비스
│   │   └── 프로필.js          # 프로필 서비스
│   ├── services/
│   │   ├── vertexAI.js       # Imagen 연동
│   │   ├── geminiFlash.js    # 검수 (동기식)
│   │   └── storage.js        # GCS 연동
│   └── utils/
│       ├── auth.js           # 요청 인증
│       └── logger.js         # 로깅
└── cloudbuild.yaml           # CI/CD (선택)
```

---

## ✅ 용아에게 확인 요청

### 1. Phase 분리 동의 여부
```
Phase 1: 동기식 MVP (23일 전)
Phase 2: 이벤트 기반 (23일 후)

이 접근에 동의하시나요?
```

### 2. Gemini Flash 검수 위치
```
[Option A] 생성 Cloud Run 내에서 동기 검수
[Option B] 별도 Cloud Run으로 비동기 검수

Phase 1에서는 Option A 제안
```

### 3. 연구계획서 기술 범위
```
[실질적 성과] Phase 1 데모
[개선방향]    Phase 2 이벤트 기반 아키텍처

이렇게 구분해서 작성해도 될까요?
```

---

## 🚀 신작가님 결정 필요

```
1. [ ] GCP Console 접속 확인
2. [ ] GCS 버킷 생성 승인
3. [ ] Phase 분리 접근 승인
4. [ ] 실행 시작 명령
```

---

## 🎯 쌍아의 다짐

```
"전략본부 가동 승인을 받았습니다.
 용아의 설계를 바탕으로, 
 23일까지 '작동하는 데모'를 반드시 완성하겠습니다.
 
 단, 무리한 복잡도 추가 없이
 MVP 원칙을 지키며 실행하겠습니다."
```

---

**문서 끝**

*명령 대기 중...*
