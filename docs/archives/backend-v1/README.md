# MONK AI Backend

Cloud Run + Vertex AI Imagen 백엔드 서버

## 🏗️ 아키텍처

```
[MONK.kr 웹] ─→ [Cloud Run] ─→ [Vertex AI Imagen]
(Cloudflare)     (이 서버)        (이미지 생성)
                     │
                     ▼
              [Cloud Storage]
               (이미지 저장)
```

## 📁 구조

```
backend/
├── src/
│   ├── index.ts          # 메인 서버
│   ├── routes/
│   │   ├── photo.ts      # /api/photo (소소)
│   │   ├── lookbook.ts   # /api/lookbook (소소)
│   │   └── model.ts      # /api/model (민아)
│   └── services/
│       ├── imagen.ts     # Vertex AI Imagen
│       └── storage.ts    # Cloud Storage
├── Dockerfile
├── cloudbuild.yaml
└── package.json
```

## 🚀 배포

### 로컬 개발
```bash
npm install
npm run dev
```

### Cloud Run 배포
```bash
# 방법 1: gcloud CLI
gcloud run deploy monk-ai-backend \
  --source . \
  --region=asia-northeast3 \
  --allow-unauthenticated

# 방법 2: Cloud Build
gcloud builds submit --config=cloudbuild.yaml
```

## 📡 API 엔드포인트

### Photo (소소)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/photo/generate` | 이미지 생성 |
| POST | `/api/photo/restore` | 사진 복원 |
| POST | `/api/photo/upscale` | 업스케일 |
| GET | `/api/photo/products` | 상품 목록 |

### Lookbook (소소)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/lookbook/generate` | 룩북 생성 |
| GET | `/api/lookbook/templates` | 템플릿 목록 |
| GET | `/api/lookbook/categories` | 카테고리 목록 |

### Model (민아)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/model/generate` | 모델 이미지 생성 |
| GET | `/api/model/list` | 모델 목록 |
| GET | `/api/model/:id` | 모델 상세 |

## 🔐 인증

Workload Identity 사용 - Cloud Run 서비스 계정이 자동으로 Vertex AI 권한 획득

**서비스 계정**: `smuse73@gen-lang-client-0105707468.iam.gserviceaccount.com`

## 💰 예상 비용

```
Imagen 생성: $0.03~0.04 / 장
Cloud Run: ~$0.000025 / 요청
Storage: $0.02 / GB-월

바우처: $1,500 (3개월)
```

---
© 2026 MONK STUDIO
