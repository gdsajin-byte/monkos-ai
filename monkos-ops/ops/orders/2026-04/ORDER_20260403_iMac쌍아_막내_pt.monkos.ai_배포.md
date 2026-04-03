---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-04-03 15:50 KST
priority: P0
subject: pt.monkos.ai 서브도메인 배포 — Cloud Run + ElevenLabs 프록시
tags: [배포, cloud-run, 서브도메인, pt, elevenlabs, presentation]
status: open
ref: apps/monkos-3d/
---

# 지시서: pt.monkos.ai 배포

**[2026-04-03 15:50 KST] iMac/쌍아 → iMac/막내**

---

## 목표

`apps/monkos-3d/`를 **pt.monkos.ai** 서브도메인으로 Cloud Run 배포.
ElevenLabs API 프록시를 서버 사이드에서 처리. 내부용 (당분간).

---

## 1. 서버 구성

현재 Vite dev server의 프록시를 프로덕션용 Express 서버로 전환.

```
apps/monkos-3d/
├── server.js          ← 신규: Express 서버
│   ├── 정적 파일 서빙 (dist/)
│   └── /api/elevenlabs/* → ElevenLabs API 프록시 (xi-api-key 주입)
├── Dockerfile         ← 신규
├── .dockerignore      ← 신규
├── vite.config.js     ← 빌드 전용 유지
└── src/               ← 기존 그대로
```

### server.js 핵심

```javascript
// 1. 정적 파일 서빙
app.use(express.static('dist'));

// 2. ElevenLabs 프록시
app.all('/api/elevenlabs/*', async (req, res) => {
  // Secret Manager에서 ELEVENLABS_API_KEY 로딩
  // https://api.elevenlabs.io + 경로 포워딩
  // xi-api-key 헤더 주입
});

// 3. SPA 폴백
app.get('*', (req, res) => res.sendFile('dist/index.html'));
```

### API 키

- **Secret Manager**: `projects/monkos/secrets/ELEVENLABS_API_KEY` (이미 등록 완료)
- 서버 시작 시 Secret Manager에서 로딩
- 기존 monkos_AI 서비스들과 동일 패턴 (`@google-cloud/secret-manager`)

---

## 2. Dockerfile

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ dist/
COPY server.js .
EXPOSE 8080
CMD ["node", "server.js"]
```

### 빌드 순서

```bash
cd apps/monkos-3d
npm run build          # vite build → dist/
docker build -t pt .
```

---

## 3. Cloud Run 배포

```bash
gcloud run deploy pt \
  --project=monkos \
  --region=asia-northeast1 \
  --source=. \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --min-instances=0 \
  --max-instances=2
```

---

## 4. 서브도메인 매핑

```bash
gcloud run domain-mappings create \
  --service=pt \
  --domain=pt.monkos.ai \
  --region=asia-northeast1 \
  --project=monkos
```

- DNS: Cloudflare에서 `pt.monkos.ai` → Cloud Run 매핑 (CNAME `ghs.googlehosted.com`)
- SSL: Cloud Run 자동 발급

---

## 5. 어드민 연동

- `monkos.ai/admin/` 에서 pt.monkos.ai 접근 링크 추가 (추후 별도 지시)
- 당분간 내부용 — 별도 인증 불필요 (URL 비공개)

---

## 6. 검증

- [ ] `https://pt.monkos.ai` 접속 → 슬라이드 12장 렌더링
- [ ] ElevenLabs TTS 발화 → 몽코스 립싱크 동작
- [ ] 보이스 셀렉터 동작
- [ ] 모바일 접속 확인

---

## ⚠️ 준수 조항

- API 키 하드코딩 금지 — Secret Manager에서 런타임 로딩 (헌법 4조 1항)
- `.env` 파일 Docker 이미지에 포함 금지
- 기존 monkos_AI 서비스 배포 패턴 참고: `monkos_AI/idphoto-kr/server.js`, `monkos_AI/portal/server.js`
- 배포 후 리비전 확인 보고
- 완료 보고 `✅❌💡⏳📁🔀` 형식
