---
type: completion
date: 2026-06-06
device: iMac
agent: 막내3
subject: image_pro 코드 구조 전수 조사 보고서
portfolio: PF_IMAGEN
order: ORDER_20260606_iMac쌍아_막내4_imagePro_코드구조_정리보고.md
status: 완료
---

# image_pro 코드 구조 전수 조사 보고서

**[2026-06-06 13:23 KST] iMac/막내3 → iMac/쌍아, 작가님**

---

## 1. 서빙 구조

### 프로덕션 (image.monkos.ai)
- **Cloud Run 서비스명**: `monk-image-engine`
- **최신 리비전**: `monk-image-engine-00023-skv` (2026-06-05 배포)
- **서비스 URL**: `https://monk-image-engine-4jeplpqpua-uc.a.run.app`
- **커스텀 도메인**: `image.monkos.ai` (도메인 매핑은 gcloud domain-mappings에서 미확인 — Cloudflare DNS 프록시 또는 별도 매핑 추정)
- **서비스 계정**: `monk-image-engine@monkos.iam.gserviceaccount.com`
- **서버**: `apps/monk_imagen4/backend/server.js` (Express, Node 20)
- **프론트**: `apps/monk_imagen4/backend/public/app/assets/index-v6.js` (빌드된 단일 번들)
- **인증**: `backend/public/index.html` — Staff/Enterprise 로그인 페이지 → `auth.json` 하드코딩 인증 → `/app/` 진입
- **Dockerfile**: `server.js` + `public/` 전체를 컨테이너에 복사. backend/package.json 기준 의존성만 설치.

### 요청 흐름
```
사용자 → image.monkos.ai → Cloud Run (monk-image-engine)
  / → public/index.html (Staff 로그인)
  /app/ → public/app/index.html → index-v6.js (React SPA)
  POST /generate → server.js → Vertex AI Imagen 4 (Fast/Ultra)
  POST /refine → server.js → Gemini 3 Pro Image Preview (I2I/Edit/Upscale)
  POST /analyze → server.js → Gemini 2.0 Flash
  POST /translate → server.js → Gemini 2.0 Flash
  GET /health → 헬스 체크
```

### monk.kr (CF Pages)
- **위치**: `MONK_kr/ai_lab/image_pro/`
- **진입**: `index.html` (Staff 로그인, GA 포함) → `app/index.html` → **index-v5.js** 로드
- **v5 API 호출**: 상대경로 `/api/generate`, `/api/upload`, `/api/ads`, `/api/translate` → CF Functions 경유
- **v6도 존재**: `app/assets/index-v6.js` 파일은 있으나 app/index.html이 v5를 참조하므로 **미사용**

---

## 2. 코드 위치별 판정

| # | 위치 | 판정 | 근거 |
|---|------|------|------|
| 1 | `apps/monk_imagen4/backend/server.js` | **활성 (프로덕션)** | Cloud Run에서 실행 중. 5개 엔드포인트 서빙. 최신 리비전 06-05 배포. |
| 2 | `apps/monk_imagen4/backend/public/` | **활성 (프로덕션)** | Dockerfile에서 컨테이너에 복사. index.html(로그인) + app/(SPA) 서빙. |
| 3 | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` | **활성 (프로덕션)** | 248KB. API 베이스 `https://image.monkos.ai` 하드코딩. Cloud Run 백엔드 직접 호출. |
| 4 | `apps/monk_imagen4/modules/` | **개발 소스 (미사용/분기됨)** | 3개 모듈: imagen4-generator, imagen3-pro, lumina-lookbook. `/api/generate` (CF Functions 프록시) 호출 패턴 → v6 번들과 API 호출 방식이 다름. Vite 빌드 시 dist 번들(228KB) 생성되나, v6 번들(248KB)과 크기·내용 불일치. **v6는 이 소스에서 빌드된 것이 아님.** |
| 5 | `apps/monk_imagen4/components/` | **개발 소스 (미사용/분기됨)** | ApiKeySelector, BatchDisplay, ControlPanel, Header, PromptSection, Sidebar — modules/와 함께 Vite 빌드 대상이나 v6와는 분기된 상태. |
| 6 | `apps/monk_imagen4/services/` | **개발 소스 (미사용/분기됨)** | geminiService.ts: `@google/genai` SDK 직접 호출 (브라우저에서 Gemini API 직접). storageService.ts: R2/D1 연동. 현재 v6 번들은 server.js를 경유하므로 이 서비스 레이어는 미사용. |
| 7 | `apps/monk_imagen4/functions/api/` | **CF Pages용 (Cloud Run과 중복)** | generate.ts: Gemini API 직접 호출 + D1 rate limiting + R2 저장. upload.ts: R2 업로드. wrangler.toml 설정 존재. **Cloud Run 이관 전 아키텍처.** CF Pages 프론트(v5)가 이 Functions를 호출. |
| 8 | `apps/monk_imagen4/index.html` | **개발용 Vite 진입점** | `<script src="/index.tsx">` → Vite dev 서버용. `npm run dev`로 로컬 개발 시 사용. |
| 9 | `apps/monk_imagen4/vite.config.ts` | **개발용** | `npm run build` → `dist/`에 출력. 빌드 가능하나 dist 번들 ≠ v6 번들. |
| 10 | `MONK_kr/ai_lab/image_pro/` | **CF Pages 정적 (구버전 활성)** | monk.kr에서 CF Pages로 서빙 중. app/index.html이 **v5** 참조. v6 파일도 있으나 미로드. GA 태그(G-C2H9ZM85F7) 포함. CF Functions(`functions/api/`)를 프록시로 사용. |

---

## 3. 빌드 파이프라인

### Vite 빌드 (`npm run build`)
- **경로**: `apps/monk_imagen4/`
- **설정**: `vite.config.ts` — React 플러그인, `@` alias
- **출력**: `dist/` (wrangler.toml의 `pages_build_output_dir = "dist"`)
- **dist 번들**: `dist/assets/index-CtB9Ol96.js` (228KB, 2026-01-07 생성)
- **node_modules**: 존재 (118개 패키지, 2026-01-07)

### v6 번들과 TSX 소스의 관계: **분기됨 (별도 코드)**

| 비교 항목 | dist 번들 (TSX 빌드) | v6 번들 (프로덕션) |
|-----------|---------------------|-------------------|
| 파일 크기 | 228,919 bytes | 248,954 bytes |
| API 호출 | `/api/generate` (상대, CF Functions) | `https://image.monkos.ai/generate` (절대, Cloud Run) |
| image.monkos.ai 참조 | ❌ 없음 | ✅ 있음 |
| 생성 시점 | 2026-01-07 | 2026-03-02 |
| 결론 | CF Pages 배포용 번들 | **별도로 수정·빌드된 프로덕션 번들** |

v6 번들의 원본 소스는 현재 리포에 TSX 형태로 존재하지 않음. v6는 v5 기반에서 API 호출 대상을 Cloud Run으로 전환하는 등 수동/별도 빌드로 생성된 것으로 추정.

---

## 4. 기능·엔드포인트 전수

### server.js (Cloud Run) 엔드포인트

| 기능 | 엔드포인트 | 모델 | v6 프론트 호출 | 상태 |
|------|-----------|------|---------------|------|
| 헬스 체크 | GET /health | — | ❌ | ✅ 활성 |
| T2I 생성 | POST /generate | Imagen 4 Fast/Ultra (Vertex AI) | ✅ `${Gf}/generate` | ✅ 활성 |
| 배치 생성 | POST /batch-generate | (→ /generate 재활용) | ❌ 미호출 | ⚠️ 코드 존재하나 프론트 미사용 |
| I2I/Edit/Upscale | POST /refine | Gemini 3 Pro Image Preview | ✅ `${Gf}/refine` | ✅ 활성 |
| 이미지 분석 | POST /analyze | Gemini 2.0 Flash | ✅ `${Gf}/analyze` | ✅ 활성 |
| 번역 | POST /translate | Gemini 2.0 Flash | ✅ 직접 URL | ✅ 활성 |
| 정적 서빙 | GET * | — | — | ✅ SPA fallback |

### v6 프론트 추가 호출 (server.js 외)

| 기능 | 호출 대상 | 상태 |
|------|----------|------|
| 이미지 업로드 (R2) | `/api/upload` (CF Functions 상대경로) | ⚠️ Cloud Run에 `/api/upload` 엔드포인트 없음. CF Pages에서만 동작. |
| 광고 배너 | `/api/ads` (CF Functions 상대경로) | ⚠️ 동일. Cloud Run에서는 404. |

### CF Functions (functions/api/) — monk.kr CF Pages용

| 기능 | 파일 | 모델 | v5 프론트 호출 | 상태 |
|------|------|------|---------------|------|
| T2I 생성 | generate.js | Gemini 3 Pro Image Preview | ✅ `/api/generate` | ✅ CF Pages 활성 |
| I2I/Edit/Upscale | refine.js | Gemini 3 Pro Image Preview | 프론트에서 직접(?) | ✅ CF Pages 활성 |
| 이미지 분석 | analyze.js | Gemini 2.5 Flash | ✅ | ✅ CF Pages 활성 |
| 번역 | translate.js | (확인 필요) | ✅ `/api/translate` | ✅ CF Pages 활성 |
| 업로드 | (루트 functions 또는 별도) | R2 | ✅ `/api/upload` | ✅ CF Pages 활성 |

### 프론트 다운로드/내보내기 (v6 번들 내)

| 기능 | 구현 방식 | 상태 |
|------|----------|------|
| 단일 이미지 다운로드 | `document.createElement("a")`, `href=V.url` / `href=B` | ⚠️ 아래 버그 참조 |
| 배치 내보내기 | for루프 + createElement("a"), `href=B.url` / `href=Y.url` | ⚠️ 동일 |
| 분석 JSON 다운로드 | Blob → createObjectURL | ✅ 정상 |
| 분석 TXT 다운로드 | Blob → createObjectURL | ✅ 정상 |
| 로그 다운로드 | Blob → createObjectURL → revokeObjectURL | ✅ 정상 |

---

## 5. 정리 방안 제안

### 안 1: Cloud Run 일원화 (권장)

`image.monkos.ai` (Cloud Run)를 단일 서빙 포인트로 통합.

**작업 내용:**
1. v6 번들의 TSX 소스를 복원/재작성 (현재 원본 소스 부재)
2. monk.kr CF Pages의 image_pro → image.monkos.ai로 리다이렉트
3. CF Functions의 generate/refine/analyze/translate → 삭제 또는 redirect
4. `apps/monk_imagen4/functions/`, `services/`, 미사용 TSX 소스 정리
5. `/api/upload`, `/api/ads` 기능을 server.js에 이관 또는 제거

**장점:** 단일 코드베이스, 모델 통일 (Vertex AI Imagen 4 + Gemini), 유지보수 용이
**단점:** v6 원본 소스 부재로 재작성 필요, CF Pages 트래픽 이전 작업 필요
**예상 작업량:** 중 (3-5일)
**리스크:** monk.kr에서 image_pro 접근 경로 변경 필요

### 안 2: 이중 운영 유지 + 소스 정비

현 상태(Cloud Run + CF Pages 병행)를 유지하되, 코드 구조만 정리.

**작업 내용:**
1. v6 번들의 TSX 소스를 별도 디렉토리로 역공학/재작성
2. 미사용 코드(dist/, modules/imagen3-pro, lumina-lookbook 등) 명시적 아카이브
3. README에 아키텍처 정본 문서화 (어떤 코드가 어디서 활성인지)

**장점:** 기존 서비스 무중단, 점진적 정리 가능
**단점:** 중복 유지보수 지속, CF Functions 모델(Gemini 3 Pro) ≠ Cloud Run 모델(Imagen 4) 불일치 지속
**예상 작업량:** 소 (1-2일)
**리스크:** 낮음

### 안 3: 프론트 소스 통합 빌드 파이프라인 복구

현재 Vite 빌드 파이프라인을 수리하여 TSX 소스 → v6 번들 재빌드 가능 상태로 만듦.

**작업 내용:**
1. modules/imagen4-generator의 API 호출을 Cloud Run 직접 호출로 전환
2. geminiService.ts → server.js 경유로 전환
3. `npm run build` → `backend/public/app/`에 출력되도록 vite.config.ts 수정
4. v6와 기능 동등성 검증

**장점:** 앞으로 TSX 수정 → 빌드 → 배포 파이프라인 정상화
**단점:** v6에만 있고 TSX에 없는 기능(사이드바 광고, Cloud R2 저장 등) 역포팅 필요
**예상 작업량:** 중-대 (3-7일)
**리스크:** v6와의 기능 차이로 기능 누락 가능

---

## 6. 알려진 버그 현황

### 다운로드 — 변주(refine) 이미지 대신 원본 다운로드 (추정)
- v6 번들의 다운로드 로직: `Y.href=B` 또는 `Ml.href=V.url`
- 단일 다운로드 시 `V.url`을 사용하는데, 이것이 refine 결과 URL인지 원본 URL인지는 변수 바인딩에 따라 다름
- minified 코드에서 정확한 원인 추적은 한계가 있으나, 갤러리 아이템의 `.url` 속성이 원본 이미지를 가리킬 가능성 존재
- **원인 추정**: refine 결과를 갤러리에 추가할 때 url 필드가 원본으로 남아있거나, 갤러리 인덱스 참조 오류

### 내보내기 단컷 — 동일 문제
- 배치 내보내기도 `B.url` / `Y.url`을 순회하므로 같은 원인

### /batch-generate — 실질적 미사용
- server.js에 코드 존재하나 `app._router.handle(req, res)` 재라우팅 방식이 Express 내부 동작에 의존 — 정상 작동 불확실
- v6 프론트에서 호출하지 않음

### /api/upload, /api/ads — Cloud Run에서 404
- v6 번들이 상대경로 `/api/upload`, `/api/ads`를 호출하나 server.js에 해당 엔드포인트 없음
- CF Pages 환경에서만 동작하는 레거시 코드가 v6에 잔존

### auth.json — 하드코딩 인증 정보
- `backend/public/auth.json`에 Staff 계정 평문 저장 → 프로덕션 보안 이슈

### 애널라이저 — 별도 진단(막내3 지시서) 결과 참조
- 별도 지시서(ORDER_20260606_iMac쌍아_막내3_imagePro_애널라이저_진단.md)로 진행 중

---

## 7. 아키텍처 요약도

```
[프로덕션 Cloud Run]
image.monkos.ai → monk-image-engine (Cloud Run, us-central1)
├── server.js (Express)
│   ├── POST /generate → Vertex AI Imagen 4 Fast/Ultra
│   ├── POST /refine → Gemini 3 Pro Image Preview
│   ├── POST /analyze → Gemini 2.0 Flash
│   ├── POST /translate → Gemini 2.0 Flash
│   └── GET * → public/ 정적 서빙
├── public/index.html (Staff 로그인)
└── public/app/
    ├── index.html (SPA 진입)
    └── assets/index-v6.js (프론트 번들, 원본 소스 부재)

[CF Pages — monk.kr]
monk.kr/ai_lab/image_pro/ → CF Pages
├── index.html (Staff 로그인, GA 포함)
└── app/
    ├── index.html → index-v5.js 참조 (활성)
    └── assets/
        ├── index-v5.js (CF Functions 호출)
        ├── index-v6.js (미사용 — index.html이 v5 참조)
        └── index-v3~v4.js (구버전 잔존)

[CF Functions — monk.kr/api/]
functions/api/
├── generate.js → Gemini 3 Pro Image Preview (T2I)
├── refine.js → Gemini 3 Pro Image Preview (I2I)
├── analyze.js → Gemini 2.5 Flash
└── translate.js → (확인 필요)

[개발 소스 — 미사용/분기]
apps/monk_imagen4/
├── index.html + index.tsx → Vite dev 진입점
├── App.tsx → ModuleLoader 아키텍처
├── modules/ → imagen4-generator, imagen3-pro, lumina-lookbook
├── components/ → React TSX 컴포넌트
├── services/ → geminiService.ts (직접 API), storageService.ts
├── functions/api/ → generate.ts, upload.ts (CF Pages용, TS 버전)
├── dist/ → Vite 빌드 결과 (228KB, v6과 불일치)
└── vite.config.ts + wrangler.toml
```

---

✅ 조사 완료 — 10개 위치 전수 판정, 엔드포인트 매핑, 빌드 파이프라인 분석, 정리 방안 3안 제시
❌ v6 번들 원본 TSX 소스 부재 확인 — 현재 TSX 소스에서 v6 재빌드 불가
💡 핵심 이슈: v6 번들이 TSX 소스와 분기되어 있어, 프론트 수정 시 minified JS를 직접 수정하거나 소스 재작성 필요
⏳ 후속: 정리 방안 선택 후 실행 지시서 필요
📁 보고서: `monkos-ops/ops/completions/2026-06/COMPLETION_20260606_막내3_imagePro_코드구조_전수조사.md`
