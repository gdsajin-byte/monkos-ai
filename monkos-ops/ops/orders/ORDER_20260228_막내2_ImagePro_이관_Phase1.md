---
type: order
id: ORDER_20260228_막내2_ImagePro_이관_Phase1
date: 2026-02-28 14:50 KST
from: iMac/쌍아
to: 막내2
priority: P1
status: pending
phase: "CF→Cloud Run 이관 Phase 1"
---

# 지시서: Image Pro → image.monkos.ai 이관

> **[2026-02-28 14:50 KST] iMac/쌍아 → 막내2**
> **배경**: monk.kr CF Pages → Cloud Run 전면 이관의 Phase 1. Image Pro를 image.monkos.ai로 이관.
> **설계서**: `monkos-ops/tech/DESIGN_CF_TO_CLOUDRUN_MIGRATION.md`
> **엔드라인**: Phase 1 완료 보고 → 커밋+push

---

## 1. 현황

### 현재 구조
- **프론트**: `MONK_kr/ai_lab/image_pro/` (Vite SPA, CF Pages에서 정적 서빙)
- **백엔드 API** (CF Pages Functions):
  - `functions/api/generate.js` → T2I (monk-image-engine 프록시)
  - `functions/api/refine.js` → I2I/EDIT/UPSCALE (Gemini 직접)
  - `functions/api/analyze.js` → 이미지 분석 (Gemini 직접)
  - `functions/api/translate.js` → 번역 (Gemini 직접)
- **Cloud Run**: `monk-image-engine` (image.monkos.ai) — 현재 T2I만 (Vertex AI Imagen 4.0)

### 목표 구조
- **image.monkos.ai** (Cloud Run)에서 전 기능 제공:
  - `/generate` (기존) + `/batch-generate` (기존)
  - `/refine` (신규 — CF에서 이관)
  - `/analyze` (신규 — CF에서 이관)
  - `/translate` (신규 — CF에서 이관)
- **프론트**: 기존 SPA의 API 호출 경로를 image.monkos.ai로 변경
- **인증**: portal HttpOnly Cookie 연동 (staff/enterprise 로그인)

---

## 2. 작업 범위

### A. monk-image-engine server.js에 API 추가

**참조 파일** (CF Functions 원본):
- `functions/api/refine.js` — I2I: Gemini gemini-3-pro-image-preview
- `functions/api/analyze.js` — 분석: Gemini 2.0 Flash
- `functions/api/translate.js` — 번역: Gemini 2.0 Flash

각 CF Function의 핵심 로직을 읽고, Express 라우트로 이관:
- `POST /refine` — 이미지 I2I/편집/업스케일
- `POST /analyze` — 이미지 분석 (프롬프트/스타일 추출)
- `POST /translate` — 분석 결과 번역

**환경변수**: `GEMINI_API_KEY` (기존 monk-image-engine에 미설정이면 추가 필요)

### B. Image Pro SPA 엔드포인트 변경

`MONK_kr/ai_lab/image_pro/` 소스에서:
- API 호출 경로를 `/api/refine` → `https://image.monkos.ai/refine` 등으로 변경
- 인증 방식 검토: 현재 어떤 인증을 쓰는지 확인 (auth.json? localStorage?)

### C. 인증 연동

- 현재 image_pro의 `auth.json` 또는 인증 방식 확인
- portal HttpOnly Cookie 기반으로 전환 가능한지 검토
- 불가능하면 현재 방식 유지 + 향후 전환 계획 보고

---

## 3. 작업 절차

```
1. MEMORY.md 읽기
2. git pull origin develop
3. CF Functions 원본 읽기 (refine.js, analyze.js, translate.js, generate.js)
4. monk-image-engine server.js 읽기 (현재 구조 파악)
5. API 3개 이관 (refine, analyze, translate)
6. Image Pro SPA 엔드포인트 변경
7. Dockerfile 확인 (변경 필요 시 수정)
8. deploy.sh 확인 (환경변수 추가 필요 시)
9. 커밋 + push
10. 완료 보고
```

---

## 4. 참조

| 문서 | 경로 |
|------|------|
| CF refine.js | `functions/api/refine.js` |
| CF analyze.js | `functions/api/analyze.js` |
| CF translate.js | `functions/api/translate.js` |
| CF generate.js | `functions/api/generate.js` |
| image-engine server.js | `apps/monk_imagen4/backend/server.js` |
| Image Pro SPA | `MONK_kr/ai_lab/image_pro/` |
| 이관 설계서 | `monkos-ops/tech/DESIGN_CF_TO_CLOUDRUN_MIGRATION.md` |

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키 생성/추측 금지 — 환경변수 이름만 확인, 값은 기존 것 활용
- **ch7 1조**: main 머지 + 배포 금지 — develop push까지
- **ch7 4조**: server.js 수정은 보고 포함 (image-engine)
