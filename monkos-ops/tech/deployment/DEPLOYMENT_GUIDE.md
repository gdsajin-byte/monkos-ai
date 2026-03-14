# MONK.KR 배포 가이드

**최초 작성**: 2026-01-08
**최종 업데이트**: 2026-02-09 (monkos_AI 분리 체계 추가, Photo Coach → idphoto-jp 승격, 일본 특화)

---

## 서비스 배포 현황

| 서비스 | 경로 | 환경 | 상태 |
|--------|------|------|------|
| monk.kr 메인 | `MONK_kr/` | Cloudflare Pages | 배포 완료 |
| AI Photolab | `MONK_kr/ai_lab/photolab/` | Cloudflare Pages | 배포 완료 |
| Imagen API | `MONK_kr/functions/api/photo.js` | Cloudflare Workers | 배포 완료 |
| Photo Coach | `apps/photo-coach/` | 로컬 (iMac) | 프로토타입 (공유 앱스) |
| **MONKOS ID Photo JP** | **`monkos_AI/idphoto-jp/`** | **GCP Cloud Run** | **개발 중 → idphoto-jp.monkos.ai** |
| Presentation Assistant | `apps/monk-cam/demo/` | 로컬 (iMac) | 개발 완료, 프로덕션 준비 중 |
| Monkos Chat | `apps/MonkosChatApp/` | Cloudflare Pages | 배포 완료 |

---

## 1. Cloudflare Pages (정적 사이트)

### 배포 방법

```bash
# Cloudflare Dashboard → Pages → 프로젝트 선택 → Upload assets
# MONK_kr 폴더 드래그 앤 드롭
# 커스텀 도메인: monk.kr 연결
```

### 배포 대상 파일

```
MONK_kr/
├── index.html              ← 메인 페이지
├── monk_studio/            ← 몽크사진관
├── ai_lab/
│   ├── photolab/           ← AI Photolab (증명사진)
│   ├── image_pro/          ← 이미지 프로
│   └── lookbook/           ← LookBook
└── functions/
    └── api/photo.js        ← Imagen API (Workers)
```

---

## 2. Photo Coach (로컬 → 프로덕션 전환 예정)

### 현재 구성 (iMac 로컬)

```
apps/photo-coach/
├── server.js        ← Gemini Live 코칭 + Imagen 3.0 + QC
├── index.html       ← 3단계 UI
├── package.json
├── cert.pem         → 심링크 (자체서명)
└── key.pem          → 심링크
```

### 로컬 실행

```bash
cd apps/photo-coach
npm install
node server.js
# HTTPS: https://100.97.103.10:8443 (Tailscale IP)
```

### 의존성

- Vertex AI ADC 인증 (Gemini Live)
- Google AI Studio API Key (Imagen 3.0, QC) — `apps/imagen3/backend/.env`
- SSL 인증서 (자체서명, `apps/monk-cam/demo/cert.pem`)

### 프로덕션 전환

Photo Coach는 `monkos_AI/idphoto-jp/`로 승격되어 Cloud Run 배포 체계로 전환됨.
일본 시장 특화 네이티브 일본어 설계. 도메인: `idphoto-jp.monkos.ai`
상세: `monkos_AI/infrastructure/DEPLOY_GUIDE.md`

---

## 3. Presentation Assistant (로컬)

### 현재 구성 (iMac 로컬)

```
apps/monk-cam/demo/
├── signaling_server.js    ← HTTPS + WSS 시그널링
├── presentation_server.js ← Gemini Live API 브릿지
├── sender.html            ← iPhone 카메라 송신
├── receiver.html          ← iMac 수신
├── presenter_sender.html  ← 발표자 오버레이
├── presenter_receiver.html ← 수신 + 프레임 캡처
├── cert.pem               ← 자체서명 SSL
└── key.pem
```

### 로컬 실행

```bash
cd apps/monk-cam/demo
node presentation_server.js
# 또는 시그널링만: node signaling_server.js
```

---

## 4. Cloudflare Workers (API)

### Imagen API

```bash
cd MONK_kr/cloudflare-workers-imagen
npx wrangler deploy
```

### Gemini Proxy

```bash
cd MONK_kr/cloudflare-workers
npx wrangler deploy
```

---

## 5. 환경별 API 인증

| 서비스 | 인증 방식 | 키 위치 |
|--------|----------|---------|
| Gemini Live API | Vertex AI ADC | 시스템 ADC (gcloud auth) |
| Imagen 3.0 | Google AI Studio API Key | `apps/imagen3/backend/.env` |
| Gemini QC | Google AI Studio API Key | 위와 동일 |
| Cloudflare Workers | wrangler.toml | `MONK_kr/cloudflare-workers/wrangler.toml` |

---

## 6. 배포 전 체크리스트

### 공통

- [ ] GCS 백업 완료
- [ ] 환경변수/API 키 확인
- [ ] 로컬 테스트 통과

### Cloudflare Pages

- [ ] 파일 업로드
- [ ] 커스텀 도메인 확인
- [ ] HTTPS 확인

### Photo Coach

- [ ] Vertex AI ADC 인증 유효
- [ ] Imagen API Key 유효
- [ ] SSL 인증서 유효

---

## 7. 롤백

```
Cloudflare Pages:
  Dashboard → Deployments → 이전 버전 → Rollback

로컬 앱:
  git log → git checkout <커밋> -- apps/photo-coach/
```

---

*최초 작성: 2026-01-08*
*업데이트: 2026-02-09 — monkos_AI 분리 체계 추가, Photo Coach → idphoto-jp.monkos.ai 승격 (일본 특화)*
