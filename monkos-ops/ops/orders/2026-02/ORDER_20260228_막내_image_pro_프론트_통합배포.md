---
type: order
id: ORDER_20260228_막내_image_pro_프론트_통합배포
date: 2026-02-28 18:18 KST
from: iMac/쌍아
to: 막내
priority: P1
status: pending
phase: "image.monkos.ai 프론트엔드 복제 + 통합 배포"
depends_on: image.monkos.ai 백엔드 배포 완료 (monk-image-engine-00010)
---

# 지시서: image.monkos.ai 프론트엔드 복제 + 통합 배포

> **[2026-02-28 18:18 KST] iMac/쌍아 → 막내**
> **배경**: image.monkos.ai에 백엔드(API)만 올라가 있고 프론트엔드가 없음.
> monk.kr/ai_lab/image_pro/에서 돌아가는 MONKOS Image Pro를 **완전 복제**하여
> Cloud Run에서 프론트+백엔드를 하나로 서빙한다.
> **원칙**: monk.kr 원본은 건드리지 않는다. 완벽한 분리 복제.

---

## 1. 프론트엔드 복제

```bash
# monk.kr의 Image Pro 프론트엔드를 백엔드 프로젝트에 복제
cp -r MONK_kr/ai_lab/image_pro/ apps/monk_imagen4/backend/public/

# 복제 확인
ls -la apps/monk_imagen4/backend/public/
# 예상: index.html, auth.json, app/ (index.html + assets/)
```

복제 후 디렉토리 구조:
```
apps/monk_imagen4/backend/
├── server.js
├── package.json
├── Dockerfile
├── deploy.sh
├── public/              ← 복제된 프론트엔드
│   ├── index.html       ← 인증 게이트
│   ├── auth.json        ← 인증 데이터
│   └── app/
│       ├── index.html   ← React PWA
│       └── assets/
│           ├── index-v6.js
│           └── metadata-OaVkxlN1.json
└── (기존 public/ 폴더가 있으면 내용 확인 후 머지)
```

---

## 2. server.js 수정

### 2-1. 헬스체크 경로 변경

`GET /` → `GET /health`로 이동. 이유: `GET /`은 이제 프론트엔드(index.html)가 서빙되어야 함.

```javascript
// 변경 전
app.get('/', (req, res) => {
  res.json({ status: 'healthy', ... });
});

// 변경 후
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', ... });
});
```

### 2-2. 정적 파일 서빙 추가

API 라우트 정의 **아래에**, 정적 파일 미들웨어 추가:

```javascript
// --- API 라우트들 (기존 그대로 유지) ---
// POST /generate, /refine, /analyze, /translate ...

// --- 정적 파일 서빙 (API 라우트 뒤에 배치) ---
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — API가 아닌 GET 요청은 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

> **중요**: `express.static`은 반드시 POST API 라우트들 **뒤에** 배치.
> POST /generate 등은 static 미들웨어와 충돌하지 않음 (HTTP method가 다름).

### 2-3. 기존 public/ 폴더 확인

현재 `apps/monk_imagen4/backend/public/` 폴더가 이미 존재할 수 있음.
내용물 확인 후 프론트엔드 파일과 충돌 없으면 그대로 복제. 충돌 시 보고.

---

## 3. 인증 게이트 수정 (public/index.html)

### 3-1. "AI LAB" 백링크 제거/변경

```html
<!-- 변경 전 -->
<a href="../ai_lab.html" class="...">
    <i class="fas fa-arrow-left"></i>
    <span>AI LAB</span>
</a>

<!-- 변경 후 -->
<a href="https://monkos.ai" class="...">
    <i class="fas fa-arrow-left"></i>
    <span>MONKOS</span>
</a>
```

---

## 4. Dockerfile 수정

```dockerfile
# 변경 전
COPY server.js ./

# 변경 후
COPY server.js ./
COPY public ./public
```

헬스체크 경로도 업데이트:
```dockerfile
# 변경 전
HEALTHCHECK ... CMD node -e "require('http').get('http://localhost:8080/', ...)"

# 변경 후
HEALTHCHECK ... CMD node -e "require('http').get('http://localhost:8080/health', ...)"
```

---

## 5. 배포

```bash
cd apps/monk_imagen4/backend
bash deploy.sh production
```

---

## 6. 배포 후 검증

### 6-1. 헬스체크 (새 경로)
```bash
curl -s https://image.monkos.ai/health
# 예상: {"status":"healthy","version":"2.0.0",...}
```

### 6-2. 인증 게이트 (프론트엔드)
```bash
curl -s https://image.monkos.ai/ | head -5
# 예상: <!DOCTYPE html> ... MONKOS IMAGE PRO | Staff Access
```

### 6-3. React 앱
```bash
curl -s https://image.monkos.ai/app/ | head -5
# 예상: <!DOCTYPE html> ... MONKOS IMAGE PRO | Professional Synthesis Platform
```

### 6-4. API 엔드포인트 (기존 동작 유지)
```bash
curl -s -X POST https://image.monkos.ai/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"test"}' | head -20

curl -s -X POST https://image.monkos.ai/refine \
  -H 'Content-Type: application/json' \
  -d '{}' | head -20
# 예상: {"success":false,"error":"Input image is required"} (정상 — 입력 없이 에러)
```

### 6-5. 인증 데이터 로드
```bash
curl -s https://image.monkos.ai/auth.json | head -5
# 예상: JSON 응답 (인증 데이터)
```

---

## 7. 완료 보고

```
✅ 프론트엔드 복제 완료 (MONK_kr → apps/monk_imagen4/backend/public/)
✅ server.js 수정 (헬스체크 /health, 정적 서빙 추가)
✅ Dockerfile 수정 (public 복사, 헬스체크 경로)
✅ 배포 성공 — 리비전 번호
✅ https://image.monkos.ai/ → 인증 게이트 로드 확인
✅ https://image.monkos.ai/app/ → React 앱 로드 확인
✅ API 엔드포인트 정상 동작 확인
```

실패 시 에러 + 원인 보고.

---

## ⚠️ 준수 조항

- **헌법 6조**: auth.json 내 크레덴셜 수정 금지. 그대로 복제만 할 것
- **헌법 8조**: monk.kr 원본 절대 수정/삭제 금지 — 복제만
- **ch7 1조**: main 머지 금지 — develop push까지
- **ch5**: 배포 후 검증 필수

## 참고

- 프론트엔드의 API 호출은 이미 `https://image.monkos.ai`를 대상으로 함 — URL 변경 불필요
- `/api/ads` 호출이 있으나 레거시이며 404 허용 (기능 영향 없음)
- 기존 `apps/monk_imagen4/backend/public/` 폴더 존재 시 내용물 확인 후 보고
