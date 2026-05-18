---
type: order
id: ORDER_20260228_막내4_functions_선별복원
date: 2026-02-28 19:05 KST
from: iMac/쌍아
to: 막내4
priority: P0
status: pending
phase: "Image Pro 전용 CF Workers 선별 복원 + _redirects 정리"
depends_on: ORDER_20260228_막내4_몽크몽코스_API분리_전수점검 (완료)
---

# 지시서: Image Pro 전용 CF Workers 선별 복원

> **[2026-02-28 19:05 KST] iMac/쌍아 → 막내4**

---

## 배경 — 작가님 직접 선언

> "기존 functions를 살리되, monkos 쪽에서 사용하는 것들은 살리지 않는다.
> 오로지 MONKOS Image Pro 내부용, 이 친구가 원래 사용하던 라인만 살린다.
> monkos로 올라간 친구들은 더 이상 CF를 타지 않는다."

Phase 2에서 functions/ 전체 제거 + `_redirects`로 우회한 구조를
**Image Pro가 필요로 하는 Workers만 선별 복원**하여 분리 원칙을 회복한다.

---

## 작업 1: CF Workers 선별 복원

### 1-1. 아카이브에서 4개 파일 복원

```bash
# 아카이브 위치
SOURCE="monkos-ops/tech/archive/functions_cf/api"

# 복원 대상 (루트 functions/api/)
mkdir -p functions/api

cp "$SOURCE/generate.js"  functions/api/generate.js
cp "$SOURCE/refine.js"    functions/api/refine.js
cp "$SOURCE/analyze.js"   functions/api/analyze.js
cp "$SOURCE/translate.js" functions/api/translate.js
```

### 1-2. 복원하지 않는 파일 (monkos.ai로 이관 완료)

| 파일 | 이유 |
|------|------|
| `idphoto-coaching.js` | idphoto-kr.monkos.ai (Cloud Run) |
| `idphoto-credit-use.js` | idphoto-kr.monkos.ai (Cloud Run) |
| `idgen.js` | idphoto-kr.monkos.ai (Cloud Run) |
| `qc.js` | monkos.ai portal (Cloud Run) |
| `payment.js` | monkos.ai portal (Cloud Run) |
| `telegram.js` | monkos.ai 운영 (Cloud Run) |
| `telegram-webhook.js` | monkos.ai 운영 (Cloud Run) |
| `tx.js` | 트랜잭션 — monkos.ai portal |
| `auth.js` | monk.kr 정적화로 불필요 |
| `simple-signup.js` | monk.kr 정적화로 불필요 |
| `photo.js` | photolab → idphoto-kr.monkos.ai |
| `precheck.js` | photolab → idphoto-kr.monkos.ai |
| `visitor.js` | 트래픽 로깅 — 당분간 불필요 |
| `ads.js` | 광고 시스템 — 레거시, 프론트에서 404 허용 |

### 1-3. 복원 파일 내용 검증

각 파일을 읽고 아래 확인:

- [ ] monkos.ai를 참조하는 코드가 없는지 (있으면 제거)
- [ ] 환경변수/시크릿 참조가 정상인지 (D1 바인딩 등)
- [ ] CORS 헤더에 monk.kr만 허용하는지

> **주의**: generate.js, refine.js 등은 Vertex AI (Google Cloud) API를 호출한다.
> API 키는 CF 환경변수에 바인딩되어 있어야 한다.
> `wrangler.toml` 또는 CF 대시보드에서 기존 바인딩이 살아있는지 확인할 것.

---

## 작업 2: wrangler.toml 확인/복원

Phase 2에서 wrangler.toml의 D1 바인딩 등을 제거했을 수 있다.
Image Pro Workers가 필요로 하는 바인딩만 복원.

```bash
# 현재 wrangler.toml 확인
cat MONK_kr/wrangler.toml 2>/dev/null || echo "wrangler.toml 없음"

# 아카이브된 wrangler.toml과 비교
diff MONK_kr/wrangler.toml monkos-ops/tech/archive/functions_cf/wrangler.toml 2>/dev/null
```

generate.js/refine.js/analyze.js가 사용하는 바인딩을 확인하고 필요한 것만 복원.

---

## 작업 3: _redirects 정리

### 3-1. `/api/*` 룰 제거

```
# 변경 전 (현재)
/ai_lab/photolab/* https://idphoto-kr.monkos.ai/:splat 301
/ai_lab/image_pro/* https://image.monkos.ai/:splat 301
/api/* https://monkos.ai/api/:splat 301

# 변경 후
/ai_lab/photolab/* https://idphoto-kr.monkos.ai/:splat 301
```

- `/api/*` 룰 제거 — functions/ 복원으로 CF Workers가 직접 처리
- `/ai_lab/image_pro/*` 룰 제거 — Image Pro는 monk.kr에서 직접 서빙 (내부용)
- `/ai_lab/photolab/*` 유지 — photolab은 이미 Cloud Run으로 완전 전환

### 3-2. image_pro 리다이렉트 제거 이유

Image Pro는 분리 선언에 따라 monk.kr 내부용(풀팩)으로 유지.
monkos.ai 버전은 별도 독립 (image.monkos.ai).
따라서 monk.kr/ai_lab/image_pro/는 monk.kr 자체에서 서빙되어야 함.

---

## 작업 4: ai_lab.html Image Pro 링크 복원

```html
<!-- 변경 전 (Phase 2) -->
<a href="https://image.monkos.ai" id="image-pro-card">

<!-- 변경 후 -->
<a href="./image_pro/" id="image-pro-card">
```

Image Pro 카드 링크를 자체 상대경로로 복원.
photolab 카드는 monkos.ai 리다이렉트가 유지되므로 그대로 둔다.

---

## 작업 5: 배포 후 검증

### 5-1. CF Workers 동작
```bash
curl -s -X POST https://monk.kr/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"test","config":{"aspectRatio":"1:1","model":"fast"}}' | head -20
# 예상: 정상 응답 또는 인증 에러 (500이 아님)
```

### 5-2. Image Pro 프론트
```bash
curl -s https://monk.kr/ai_lab/image_pro/app/ | head -5
# 예상: HTML 응답 (리다이렉트 아님)
```

### 5-3. Photolab 리다이렉트 유지
```bash
curl -s -I https://monk.kr/ai_lab/photolab/ | head -5
# 예상: 301 → https://idphoto-kr.monkos.ai/
```

---

## 완료 보고

```
✅ CF Workers 4개 선별 복원 (generate, refine, analyze, translate)
✅ wrangler.toml 바인딩 확인/복원
✅ _redirects 정리 (/api/* 제거, image_pro 제거, photolab 유지)
✅ ai_lab.html Image Pro 링크 복원
✅ 배포 검증 완료
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/시크릿 생성·추측 금지. 기존 바인딩 확인만
- **헌법 8조**: 파괴적 명령 금지. 아카이브 원본 유지 (cp만 사용)
- **헌법 10조**: 교차 호출 금지 — 복원 파일에 monkos.ai 참조 없어야 함
- **ch7 1조**: main 머지 금지 — develop push까지

## 참고

- Image Pro v5 호출 엔드포인트: `/api/generate`, `/api/refine`, `/api/analyze`, `/api/translate`, `/api/ads`(레거시)
- ads.js는 복원하지 않음 — 프론트에서 404 허용 (기능 영향 없음)
- generate.js는 Vertex AI Imagen 호출 — GCP 서비스 계정 바인딩 필요
