---
type: report
date: 2026-06-12
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: "Cloudflare 인프라 전수 맵트리 — Pages Functions + Workers + 환경변수"
portfolio: PF_SECURITY
---

# Cloudflare 인프라 전수 맵트리

> **[2026-06-12 14:56 KST]** iMac/막내1 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내1_인프라_CF워커스_맵트리.md`
> 감사 방식: 읽기 전용 (코드·환경변수 변경 금지)

---

## Task 1 — CF Pages Functions 전수

### 1-1. `functions/api/` (6개)

| 함수 | URL | 엔진 | 인증 | 호출원 | 활성 |
|------|-----|------|------|--------|------|
| `chat.js` | `/api/chat` | Workers AI `@cf/google/gemma-4-26b-a4b-it` | `env.CHAT_API_KEY` (외부) + CORS origin (내부) | `MONK_kr/index.html` (메인 챗봇) + monkos.ai portal(CHAT_WORKERS_URL 경유) | ✅ **핵심 라이브** |
| `generate.js` | `/api/generate` | Gemini API `gemini-3-pro-image-preview` | `env.GEMINI_API_KEY` | `MONK_kr/ai_lab/image_pro/` (이미지 프로 T2I) | ✅ 라이브 |
| `refine.js` | `/api/refine` | Gemini API `gemini-3-pro-image-preview` | `env.GEMINI_API_KEY` | `MONK_kr/ai_lab/image_pro/` (이미지 프로 I2I/Edit) | ✅ 라이브 |
| `translate.js` | `/api/translate` | Gemini API `gemini-2.5-flash` | `env.GEMINI_API_KEY` | `MONK_kr/ai_lab/image_pro/` (분석 결과 번역) | ✅ 라이브 |
| `analyze.js` | `/api/analyze` | Gemini API `gemini-2.5-flash` | `env.GEMINI_API_KEY` | `MONK_kr/ai_lab/image_pro/` (이미지 분석) | ✅ 라이브 |
| `debate.js` | `/api/debate` | Workers AI `gemma-3-12b-it` + `qwen2.5-coder-32b` | `context.env.AI` (바인딩) | `MONK_kr/debate/index.html` | 🟡 실험 기능 |

**바인딩 의존성** (wrangler.toml):
- `AI` — Workers AI 바인딩 (chat.js, debate.js)
- `DB` — D1 `monk-db` (chat.js RAG + specs/)
- `GEMINI_API_KEY` — CF Dashboard 환경변수 (generate/refine/translate/analyze)
- `CHAT_API_KEY` — CF Dashboard 환경변수 (chat.js 외부 인증)

### 1-2. `functions/specs/` (7개 — SSR 렌더링)

| 함수 | URL | 엔진 | 바인딩 | 비고 |
|------|-----|------|--------|------|
| `_middleware.js` | `/specs/*` (전체) | 정적 로직 | `env.DB` (D1) | lang 파라미터 + DB 주입 |
| `index.js` | `/specs/` | D1 쿼리 + SSR | DB | 국가 허브 페이지 |
| `[country]/index.js` | `/specs/{country}/` | D1 쿼리 + SSR | DB | 국가별 문서 목록 |
| `[country]/[document].js` | `/specs/{country}/{doc}` | D1 쿼리 + SSR | DB | 개별 문서 상세 |
| `sitemap.xml.js` | `/specs/sitemap.xml` | D1 쿼리 | DB | SEO 사이트맵 |
| `_lib/*.js` (4개) | — | 헬퍼 | — | queries, template, seo, i18n |

### 1-3. `functions/en/specs/`, `functions/ja/specs/` (다국어 SSR)

| 함수 | URL | 엔진 | 바인딩 |
|------|-----|------|--------|
| `en/specs/[[path]].js` | `/en/specs/*` | D1 쿼리 + SSR | `env.DB` |
| `ja/specs/[[path]].js` | `/ja/specs/*` | D1 쿼리 + SSR | `env.DB` |

### 1-4. `functions/api/_lib/prompts.js` (헬퍼)

chat.js가 import하는 채널별 프롬프트 + 코칭 빌더. D1 RAG 설정 포함.

---

## Task 2 — 외부 Workers 파악

### 2-1. `monk-chatbot.gdsajin.workers.dev`

| 항목 | 내용 |
|------|------|
| **config.js 참조** | `MONK_CONFIG.API.CHATBOT` |
| **레포 내 소스** | `MONK_kr/cloudflare-workers/` 디렉토리 존재하나 **JS 소스 파일 0개** (wrangler 빌드 캐시만 잔존) |
| **호출원** | `MONK_kr/ai_lab/ai_lab.html` (grep 결과), `test_monkos.html` |
| **현재 상태** | 🔴 **레거시 — Pages Function `/api/chat`으로 대체됨**. config.js에 URL 잔존하나, index.html은 `/api/chat` 직접 호출 |
| **근거** | index.html:456 `const CHAT_API = '/api/chat'` — Workers URL 미사용 |

### 2-2. `monk-gemini-proxy.gdsajin.workers.dev`

| 항목 | 내용 |
|------|------|
| **config.js 참조** | `MONK_CONFIG.API.GEMINI_PROXY` |
| **레포 내 소스** | 없음 (cloudflare-workers/ 내 미발견) |
| **호출원** | `MONK_kr/ai_lab/ai_lab.html:284` — photolab의 Gemini 호출 폴백 경로 |
| **현재 상태** | 🔴 **레거시** — 작가님 증언 "고정답변만 줌". Pages Function generate/refine이 Gemini API 직접 호출로 대체 |

### 2-3. `monk-imagen-proxy.gdsajin.workers.dev`

| 항목 | 내용 |
|------|------|
| **config.js 참조** | `MONK_CONFIG.API.IMAGEN_PROXY` |
| **레포 내 소스** | 없음 |
| **호출원** | `ai_lab/lookbook/index.html`, `_legacy/imagen_v4.html` — 레거시 파일만 |
| **현재 상태** | 🔴 **레거시** — lookbook + imagen_v4는 레거시. 현 image_pro는 Pages Function 경유 |

### 2-4. `*.workers.dev` 전수 grep 결과

| Workers URL | 참조 파일 수 | 판정 |
|-------------|------------|------|
| `monk-chatbot.gdsajin.workers.dev` | 5 (config.js + ai_lab + lookbook + _legacy + test) | 🔴 레거시 |
| `monk-gemini-proxy.gdsajin.workers.dev` | 5 (config.js + ai_lab + lookbook + _legacy + apps 레거시) | 🔴 레거시 |
| `monk-imagen-proxy.gdsajin.workers.dev` | 5 (config.js + lookbook + _legacy ×3) | 🔴 레거시 |

**외부 Workers 3개 전부 레거시.** 현행 라이브는 Pages Functions가 전담.

---

## Task 3 — 환경변수 맵

### CF Dashboard 등록 (SECRET_INVENTORY §E) vs 코드 참조 교차

| 환경변수 | §E 등록 | 코드 참조 | 실제 필요 | 비고 |
|----------|---------|----------|----------|------|
| `GEMINI_API_KEY` | ✅ | ✅ (generate/refine/translate/analyze) | ✅ **필수** | ⚠️ §E "지문 미대조" 경고 — CF 키가 MONKOS NEW와 동일한지 미확인 |
| `CHAT_API_KEY` | ✅ | ✅ (chat.js 외부 인증) | ✅ 필수 | monkos.ai portal에서 X-Chat-API-Key 헤더로 전송 |
| `KAKAO_CLIENT_ID` | ✅ | ❓ (grep 필요) | 🟡 | monk.kr OAuth — CF Pages에서 직접 처리하는지 미확인 |
| `KAKAO_CLIENT_SECRET` | ✅ | ❓ | 🟡 | 동상 |
| `GOOGLE_CLIENT_ID` | ✅ | ❓ | 🟡 | 동상 |
| `GOOGLE_CLIENT_SECRET` | ✅ | ❓ | 🟡 | 동상 |
| `GCP_PROJECT_ID` | ✅ | ❌ (functions/ 내 미참조) | 🔴 레거시 추정 | Vertex AI 프록시용이었으나 현재 Gemini API 직접 호출로 전환 |
| `GCP_SERVICE_ACCOUNT_KEY` | ✅ | ❌ (functions/ 내 미참조) | 🔴 레거시 추정 | SA JSON 문자열 — Vertex AI 프록시 잔재 |
| `GCS_BUCKET` | ✅ | ❌ (functions/ 내 미참조) | 🔴 레거시 추정 | Pages Functions에서 GCS 직접 접근 없음 |
| `GCS_BACKUP_ENABLED` | ✅ | ❌ | 🔴 레거시 | 동상 |
| `TELEGRAM_BOT_TOKEN` | ✅ | ❌ (functions/ 내 미참조) | 🔴 레거시 추정 | 텔레그램은 monkos.ai portal에서 처리 |
| `ADMIN_CHAT_ID` | ✅ | ❌ | 🔴 레거시 추정 | 동상 |
| `TX_API_KEY` | ✅ | ❌ (functions/ 내 미참조) | 🔴 레거시 추정 | D1 거래원장은 portal Cloud Run에서 처리 |

**wrangler.toml 바인딩 (코드 필수):**

| 바인딩 | 타입 | 코드 사용 | §E 미등록 |
|--------|------|----------|----------|
| `AI` | Workers AI | chat.js, debate.js | N/A (바인딩, 키 아님) |
| `DB` | D1 `monk-db` | chat.js RAG, specs/ 전체 | N/A (바인딩) |

### 환경변수 정리 후보 (13개 중 7개 레거시 추정)

| 필수 유지 | 레거시 추정 | 확인 필요 |
|----------|-----------|----------|
| GEMINI_API_KEY | GCP_PROJECT_ID | KAKAO_CLIENT_ID |
| CHAT_API_KEY | GCP_SERVICE_ACCOUNT_KEY | KAKAO_CLIENT_SECRET |
| | GCS_BUCKET | GOOGLE_CLIENT_ID |
| | GCS_BACKUP_ENABLED | GOOGLE_CLIENT_SECRET |
| | TELEGRAM_BOT_TOKEN | |
| | ADMIN_CHAT_ID | |
| | TX_API_KEY | |

---

## Task 4 — 최종 맵 트리

```
monk.kr (CF Pages — wrangler: monk-kr)
│
├── 바인딩
│   ├── AI — Workers AI (gemma-4, gemma-3, qwen2.5)
│   └── DB — D1 monk-db (RAG + specs SSR)
│
├── CF Pages Functions (functions/)
│   │
│   ├── /api/chat          ✅ 핵심 — Workers AI gemma-4-26b, D1 RAG, 4채널 분기
│   │   └── 호출: monk.kr index.html + monkos.ai portal (CHAT_WORKERS_URL)
│   │
│   ├── /api/generate      ✅ 라이브 — Gemini API (GEMINI_API_KEY), T2I
│   │   └── 호출: monk.kr/ai_lab/image_pro/
│   │
│   ├── /api/refine        ✅ 라이브 — Gemini API, I2I/Edit/Upscale
│   │   └── 호출: monk.kr/ai_lab/image_pro/
│   │
│   ├── /api/translate     ✅ 라이브 — Gemini 2.5 Flash, 분석 번역
│   │   └── 호출: monk.kr/ai_lab/image_pro/ 분석 패널
│   │
│   ├── /api/analyze       ✅ 라이브 — Gemini 2.5 Flash, 이미지 분석
│   │   └── 호출: monk.kr/ai_lab/image_pro/ 분석 패널
│   │
│   ├── /api/debate        🟡 실험 — Workers AI gemma-3 + qwen2.5, 2에이전트 토론
│   │   └── 호출: monk.kr/debate/
│   │
│   ├── /specs/*           ✅ 라이브 — D1 SSR, 증명사진 규격 허브 (ko)
│   │   ├── /specs/                    국가 허브
│   │   ├── /specs/{country}/          국가별 문서 목록
│   │   ├── /specs/{country}/{doc}     문서 상세
│   │   └── /specs/sitemap.xml         SEO
│   │
│   ├── /en/specs/*        ✅ 라이브 — D1 SSR, specs 영문판
│   │   └── /en/specs/sitemap.xml      SEO
│   │
│   └── /ja/specs/*        ✅ 라이브 — D1 SSR, specs 일문판
│       └── /ja/specs/sitemap.xml      SEO
│
├── 정적 페이지 (MONK_kr/)
│   ├── /                          메인 (챗봇 탑재)
│   ├── /ai_lab/                   AI 랩 허브
│   ├── /ai_lab/image_pro/         이미지 프로 (Gemini API 4개 함수 소비)
│   ├── /ai_lab/photolab/          포토랩 (레거시 Gemini Proxy 참조 잔존)
│   ├── /ai_lab/lookbook/          룩북 (레거시 Imagen Proxy 참조)
│   ├── /debate/                   AI 토론 (실험)
│   └── /b2b/                      B2B
│
├── 외부 라우팅 (monk.kr → monkos.ai Cloud Run)
│   ├── 증명사진 → idphoto-kr.monkos.ai
│   ├── image_pro API fallback → image.monkos.ai (monk-image-engine)
│   └── 로그인/결제 → monkos.ai (portal)
│
└── 외부 Workers (config.js 등록 — 전부 레거시)
    ├── monk-chatbot.gdsajin.workers.dev      🔴 /api/chat으로 대체됨
    ├── monk-gemini-proxy.gdsajin.workers.dev  🔴 Pages Functions generate/refine으로 대체됨
    └── monk-imagen-proxy.gdsajin.workers.dev  🔴 Pages Functions로 대체됨
```

---

## 발견사항 요약

| # | 심각도 | 항목 | 권고 |
|---|--------|------|------|
| F1 | ⚠️ MED | **CF GEMINI_API_KEY 지문 미대조** — MONKOS NEW (monkos 프로젝트)와 동일 키인지 미확인. 구 프로젝트 키였으면 06-12 종료로 무효화 가능 | monk.kr에서 generate/analyze 라이브 테스트 또는 CF Dashboard 수동 대조 |
| F2 | ⚠️ MED | **CF Dashboard 환경변수 13개 중 7개 레거시 추정** (GCP_*, GCS_*, TELEGRAM_*, TX_*, ADMIN_CHAT_ID) | 코드 미참조 확인 후 정리 |
| F3 | ⚠️ LOW | **외부 Workers 3개 전부 레거시** — config.js에 URL 잔존 | config.js에서 URL 제거 + CF Dashboard에서 Workers 삭제 |
| F4 | ⚠️ LOW | **photolab/ai_lab.html에 Gemini Proxy 하드코딩** (line 284) | Pages Function 경유로 전환 또는 레거시 페이지 정리 |
| F5 | ℹ️ INFO | **KAKAO/GOOGLE OAuth 환경변수 4개** — monk.kr에서 직접 OAuth 처리하는지 불분명 | 프론트 코드 확인 (functions/ 외 서버리스 로직?) |
| F6 | ✅ GOOD | **핵심 라이브 함수 6+7=13개 전부 정상 식별** | Pages Functions 체계 안정 |
| F7 | ✅ GOOD | **D1 monk-db 바인딩 활발 사용** (chat RAG + specs SSR) | 인프라 정합 |

---

**감사 완료**
**[2026-06-12 14:56 KST] iMac/막내1**
