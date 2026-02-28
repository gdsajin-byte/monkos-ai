---
type: order
id: ORDER_20260228_막내_image_monkos_ai_배포
date: 2026-02-28 16:55 KST
from: iMac/쌍아
to: 막내
priority: P1
status: pending
phase: "image.monkos.ai 배포 + 검증"
depends_on: Phase 1 코드 완료 (3f18774)
---

# 지시서: image.monkos.ai (MONKOS Image Pro) 배포

> **[2026-02-28 16:55 KST] iMac/쌍아 → 막내**
> **배경**: Phase 1에서 Image Pro 이관 코드 완료 (막내2 `3f18774`). 서비스명 `monk-image-engine`.
> **중요도**: 팀원들이 매일 실사용하는 핵심 툴. 중단 없이 전환되어야 함.
> **엔드라인**: 배포 + 헬스체크 + /refine, /analyze, /translate 엔드포인트 검증 → 완료 보고

---

## 1. 사전 확인

```bash
# MEMORY.md 읽기
# git pull origin develop
# deploy.sh 확인
cat apps/monk_imagen4/backend/deploy.sh
```

### Secret Manager 확인
```bash
gcloud secrets list --project=monkos | grep GEMINI
# GEMINI_API_KEY가 존재하는지 확인
# 없으면 보고 후 대기 (쌍아가 키 확보)
```

### 현재 서비스 상태 확인
```bash
gcloud run services describe monk-image-engine --region us-central1 --format='value(status.url)'
# 기존 서비스가 있는지, 현재 버전은 무엇인지 확인
```

---

## 2. 배포 실행

```bash
cd apps/monk_imagen4/backend
bash deploy.sh production
```

- deploy.sh는 production이 기본값
- `--update-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"` — Secret Manager에서 자동 주입
- 서비스 계정: `monk-image-engine@monkos.iam.gserviceaccount.com`

---

## 3. 배포 후 검증

### 3-1. 헬스 체크
```bash
SERVICE_URL=$(gcloud run services describe monk-image-engine --region us-central1 --format='value(status.url)')
curl -s "$SERVICE_URL/" | head -20
```

### 3-2. 기존 엔드포인트 (/generate)
```bash
curl -s -X POST "$SERVICE_URL/generate" \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "test image", "aspectRatio": "1:1", "numberOfImages": 1}' | head -50
```
→ 정상 응답 또는 API 에러 메시지 확인 (401/403이면 GEMINI_API_KEY 문제)

### 3-3. 신규 엔드포인트 (Phase 1 추가분)

```bash
# /refine — I2I/EDIT/UPSCALE
curl -s -X POST "$SERVICE_URL/refine" \
  -H 'Content-Type: application/json' \
  -d '{"mode": "UPSCALE", "prompt": "test", "upscaleFactor": "x2"}' | head -50

# /analyze — 이미지 분석
curl -s -X POST "$SERVICE_URL/analyze" \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "describe this image"}' | head -50

# /translate — 번역
curl -s -X POST "$SERVICE_URL/translate" \
  -H 'Content-Type: application/json' \
  -d '{"text": "안녕하세요", "targetLang": "en"}' | head -50
```

→ 각 엔드포인트가 응답하는지 확인 (입력 데이터 부족으로 에러라도, 라우트 자체가 살아있는지 검증)

### 3-4. 커스텀 도메인 확인
```bash
# image.monkos.ai 서브도메인이 monk-image-engine을 가리키는지 확인
nslookup image.monkos.ai
curl -s https://image.monkos.ai/ | head -20
```

---

## 4. 완료 보고

```
✅ 배포 성공 — 리비전 번호, 서비스 URL
✅ 헬스 체크 통과
✅ /generate 응답 확인
✅ /refine 라우트 확인
✅ /analyze 라우트 확인
✅ /translate 라우트 확인
✅ image.monkos.ai 도메인 연결 확인
```

실패 시 에러 메시지 + 원인 분석 보고.

---

## ⚠️ 준수 조항

- **헌법 6조**: Secret Manager 키 직접 생성/추측 금지. 없으면 보고
- **ch7 1조**: main 머지 금지 — develop push까지
- **ch5**: 배포 후 헬스체크 필수
