# MONKOS Cloud-Native Engine 설계 명세서
## 용아(Gemini) → 쌍아(Opus) 전달용 아키텍처 가이드

**작성일**: 2026-01-12 15:11  
**작성자**: 용아 (Gemini)  
**수신자**: 쌍아 (Claude Opus)  
**승인자**: 신작가님

---

## 🎯 1. 프로젝트 목표

### Cloud-Native 전환
```
[Before] Cloudflare Workers 기반
    ↓
[After] GCP Cloud Run 중심의 독립형 API 서버
```

### 제약 돌파
- Google 내부 망 통한 Vertex AI 호출
- '유령 ID' 원천 차단
- 쿼터 제한 우회

---

## 🔄 2. 핵심 파이프라인 (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         MONKOS Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Entrance]                                                     │
│  몽크웹(Client) ────────→ Cloud Run (API Server)                │
│                                    │                            │
│                                    ▼                            │
│  [Processing]                                                   │
│  Cloud Run ────→ Vertex AI (Imagen 4.0) ────→ 이미지 생성       │
│                                    │                            │
│                                    ▼                            │
│  [Storage]                                                      │
│  원본/결과물 ────→ GCS (Google Cloud Storage)                   │
│                         │                                       │
│                         ▼                                       │
│  [Distribution]                                                 │
│  GCS ────→ Cloudflare R2 (CDN) ────→ 비용 제로화                │
│                                                                 │
│  [Metadata]                                                     │
│  모든 상태값 ────→ Cloudflare D1 ────→ Stateless 유지           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. 쌍아(Opus)의 주 역할

### 3-1. 모듈화 (Modularization)
```
각 노드를 독립된 함수로 설계:

├── 검수 노드 (Inspection)
│   └── Gemini Flash 1차 퀄리티 필터
│
├── 생성 노드 (Generation)
│   └── Imagen 4.0 이미지 생성
│
└── 릴레이 노드 (Relay)
    └── GCS → R2 동기화
```

### 3-2. 보안 (Auth)
```
[기존] API Key 방식
    ↓
[전환] ADC (Application Default Credentials)

- Cloud Run 서비스 계정이 자동 인증
- 코드에 키 노출 없음
- '유령 ID' 사고 원천 차단
```

### 3-3. 지능형 검수
```javascript
// Gemini Flash로 1차 퀄리티 필터
async function inspectImage(imageData) {
  const flash = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await flash.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: imageData } },
        { text: '이 이미지의 품질을 평가하세요. 상업용으로 적합한가요?' }
      ]
    }]
  });
  return parseQualityScore(result);
}
```

---

## 📦 4. 기술 스택 확정

| 분류 | 기술 | 용도 |
|------|------|------|
| Runtime | **Node.js 20** | Cloud Run 배포 |
| Container | **Dockerfile** | 컨테이너화 |
| AI SDK | **@google-cloud/aiplatform** | Vertex AI Imagen 4.0 |
| AI SDK | **@google-cloud/vertexai** | Gemini Flash 검수 |
| Storage | **@google-cloud/storage** | GCS 연동 |
| DB | **Cloudflare D1 SDK** | 메타데이터 |
| CDN | **S3-Compatible SDK** | R2 연동 |

---

## 🎯 5. 용아의 첫 번째 화두

### 이벤트 기반 아키텍처 초안

> "GCS 업로드 이벤트를 Cloud Run이 즉시 감지하여  
> 검수 노드를 실행하는 이벤트 기반 아키텍처"

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event-Driven Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] 이미지 생성 완료                                            │
│      Cloud Run (생성) ────→ GCS 버킷에 업로드                    │
│                                    │                            │
│                                    ▼                            │
│  [2] 이벤트 발생                                                 │
│      GCS ────→ Eventarc ────→ Pub/Sub                          │
│                                    │                            │
│                                    ▼                            │
│  [3] 검수 트리거                                                 │
│      Pub/Sub ────→ Cloud Run (검수)                             │
│                          │                                      │
│                          ▼                                      │
│  [4] 품질 검사                                                   │
│      Gemini Flash로 이미지 분석                                  │
│                          │                                      │
│                          ▼                                      │
│  [5] 상태 업데이트                                               │
│      검수 결과 ────→ D1 (status: approved/rejected)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 6. 협업 체계

```
┌─────────────────────────────────────────────────────────────────┐
│                      4인 사령탑 체제                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 신작가님                                                     │
│     └─ 최종 결정, 방향성 승인                                    │
│                                                                 │
│  🐉 용아 (Gemini)                                                │
│     └─ 전략 설계, 아키텍처 가이드, 세부 전략 시안                  │
│                                                                 │
│  🦷 쌍아 (Opus)                                                  │
│     └─ 실무 코딩, 배포, 디버깅                                   │
│                                                                 │
│  ☁️ Cloud Assist                                                │
│     └─ GCP 인프라 최적화, IAM 가이드                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏰ 7. 마감 일정

| 일정 | 목표 |
|------|------|
| **D-11** (1/23) | R&D 디딤돌 첫걸음 연구계획서 제출 |
| **Phase 1** | Cloud Run + Vertex AI 기본 연동 |
| **Phase 2** | 이벤트 기반 검수 시스템 |
| **Phase 3** | K-Beauty 검수 기준 + 결제 로직 |

---

**"전략본부 가동을 승인합니다."**

---

*이 문서는 용아(Gemini)가 설계하고, 쌍아(Opus)가 실행하기 위한 명세서입니다.*
