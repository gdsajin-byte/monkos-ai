---
type: portfolio
id: PF_IMAGE_PRO
name: IMAGE_PRO
subject: MONKOS Image Pro — AI 이미지 생성/변주/분석 플랫폼 (image.monkos.ai)
created: 2026-01-16
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
parent: PF_STYLER
---

# PF_IMAGE_PRO — MONKOS Image Pro

## 1. 비전

- **image.monkos.ai** — 내부 스태프용 AI 이미지 생성 도구
- **T2I** (텍스트→이미지): Vertex AI Imagen 4 Fast/Ultra
- **I2I** (이미지→이미지 변주/편집/업스케일): Gemini 3 Pro Image Preview
- **Analyze** (리버스 프롬프트): Gemini 2.5 Flash
- **Translate** (번역): Gemini 2.5 Flash
- Staff/Enterprise JSON 인증 → `/app/` SPA 진입

---

## 2. 아키텍처 정본

```
[프로덕션 — image.monkos.ai]
Cloud Run: monk-image-engine (us-central1)
├── server.js (Express, Node 20)
│   ├── POST /generate → Vertex AI Imagen 4 Fast/Ultra (T2I)
│   ├── POST /refine → Gemini 3 Pro Image Preview (I2I/Edit/Upscale)
│   ├── POST /analyze → Gemini 2.5 Flash (리버스 프롬프트)
│   ├── POST /translate → Gemini 2.5 Flash (번역)
│   ├── POST /api/upload → 크래시 방지 스텁 (실제 GCS 저장 미구현)
│   └── GET * → public/ 정적 서빙 (SPA fallback)
├── public/index.html — Staff 로그인
└── public/app/
    ├── index.html → index-v6.js 로드
    └── assets/index-v6.js — 프론트 빌드 번들 (원본 TSX 소스 부재)

[레거시 — monk.kr/ai_lab/image_pro/]
CF Pages: v5 번들 + CF Functions
(이중 서빙 상태, 정리 대상)

[개발 소스 — 미사용/분기]
apps/monk_imagen4/ 내 modules/, components/, services/ — v6과 분기됨
```

### 요청 흐름

```
사용자 → image.monkos.ai → Cloud Run (monk-image-engine)
  / → public/index.html (Staff 로그인)
  /app/ → public/app/index.html → index-v6.js (React SPA)
  POST /generate → server.js → Vertex AI Imagen 4 (Fast/Ultra)
  POST /refine → server.js → Gemini 3 Pro Image Preview (I2I/Edit/Upscale)
  POST /analyze → server.js → Gemini 2.5 Flash
  POST /translate → server.js → Gemini 2.5 Flash
```

---

## 3. 코드 위치별 판정

| # | 위치 | 판정 | 근거 |
|---|------|------|------|
| 1 | `apps/monk_imagen4/backend/server.js` | **활성 (프로덕션)** | Cloud Run 실행 중. 5개 엔드포인트 서빙. |
| 2 | `apps/monk_imagen4/backend/public/` | **활성 (프로덕션)** | Dockerfile에서 컨테이너 복사. 로그인 + SPA 서빙. |
| 3 | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` | **활성 (프로덕션)** | 248KB. API 베이스 `https://image.monkos.ai` 하드코딩. |
| 4 | `apps/monk_imagen4/modules/` | **개발 소스 (미사용/분기)** | CF Functions 프록시 호출 패턴 → v6과 API 호출 방식 불일치. |
| 5 | `apps/monk_imagen4/components/` | **개발 소스 (미사용/분기)** | modules/와 함께 Vite 빌드 대상이나 v6과 분기. |
| 6 | `apps/monk_imagen4/services/` | **개발 소스 (미사용/분기)** | 브라우저 직접 Gemini API 호출. v6은 server.js 경유. |
| 7 | `apps/monk_imagen4/functions/api/` | **CF Pages용 (Cloud Run과 중복)** | Cloud Run 이관 전 아키텍처. v5가 호출. |
| 8 | `apps/monk_imagen4/index.html` | **개발용 Vite 진입점** | `npm run dev` 로컬 개발용. |
| 9 | `apps/monk_imagen4/vite.config.ts` | **개발용** | dist 번들 ≠ v6 번들. |
| 10 | `MONK_kr/ai_lab/image_pro/` | **CF Pages 정적 (구버전 활성)** | monk.kr에서 v5 서빙 중. GA 태그 포함. |

> 출처: `COMPLETION_20260606_막내3_imagePro_코드구조_전수조사.md` §2

---

## 4. 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 2026-01-10 | 작가님 | Image Pro 초기 개발 (MONK_kr/ai_lab/image_pro/) — Quick Variations System | MONK_kr 내 v1~v4 빌드 | ✅ |
| 2026-01-18 | 작가님 | AI LAB 대규모 개편 — MONKOS 브랜드 통일 + 4MUSE 내부화 | `7a4cb581` | ✅ |
| 2026-01-22 | 막내 | 정식 배포 — CF Functions API 추가(generate/refine/analyze) + JSON 인증 + MONKOS ENGINE 표기 통일 | `a08f5ff9` ~ `ec5264d8` | ✅ |
| 2026-01-29 | 막내 | Cloud Run 백엔드(monk-image-engine) 구축 + 배포 + 도메인 연결 | `a644ffce` ~ `e806ca57` | ✅ |
| 2026-02-20 | 막내 | Imagen 4 모델 스위칭 + v6 빌드(Standard/Premium) + 광고 시스템 구축 | `faae36b5` ~ `279aa3b8` | ✅ |
| 2026-02-28 | 막내 | image.monkos.ai 이관 Phase 1 — 프론트 통합 + v6→v5 롤백 + CF Functions 탯줄 절단 | `3f187748` ~ `d3c6a6d1` | ✅ |
| 2026-03-01 | 막내 | Vertex AI ADC 신규 구현 — fast/ultra 분기 + protobuf 변환 + GCS 403 해소 | `31e70a75` ~ `9a54231a` | ✅ |
| 2026-06-02 | 막내 | deploy.sh CWD 미고정 결함 전수 수정 (5개 서비스 광역) | `6034fa1f` | ✅ |
| 2026-06-05 | 막내 | **INCIDENT** — ultra predict() 타임아웃(DEADLINE_EXCEEDED 30s) 해소 | `3a5d2af0` | ✅ |
| 2026-06-06 | 막내2 | 일러스트편향 근본수정 — enhancePrompt:false + 네거티브 프롬프트 분리 | `f0bcd87c` | ✅ |
| 2026-06-06 | 막내 | 다운로드버그 + EXPORT크래시 + localStorage오염 — v6 번들 3건 패치 + /api/upload 스텁 신설 | `064df031` | ✅ |
| 2026-06-06 | 막내3 | 코드 구조 전수 조사 보고서 — 10개 위치 판정 + 아키텍처 매핑 | COMPLETION 보고서 | ✅ |
| 2026-06-06 | 막내1 | **PF_IMAGE_PRO 신설** — 아키텍처 정본 + 히스토리 정착 | 본 문서 | ✅ |
| 2026-08-27 | 막내1 | **🔴 INCIDENT 복구 — Vertex Imagen 계열 전면 폐지 대응 T2I 마이그레이션**(ORDER_20260827). `POST /generate`가 `imagen-4.0-fast-generate-001` **NOT_FOUND**로 500 전량 실패(마지막 성공 08-17, 리비전 00031은 06-19 이후 무배포 → 우리 코드 변경 없음, 구글 측 폐지). fast→**gemini-3.1-flash-image** / ultra→**gemini-3-pro-image**(둘 다 GA), 이미지 전용 `IMAGE_LOCATION='global'` 신설(`LOCATION` 무접촉), gRPC `:predict`→REST `:generateContent`+ADC. **mimeType 하드코딩 3개소 동적화**(Gemini는 PNG 반환 — GCS contentType·확장자·data URL 전부 실측 확인). 미지원 파라미터 5종은 수신 유지+요청 제외+`Ignored params` 로그로 가시화(무음 무시 없음). 실측: fast **200/12.4s**, ultra **200/84.3s**(3:4·2K), `/refine`·`/analyze` 배포 전후 **200 동일**(무접촉 실증). 배포 전 `deploy.sh`의 `GEMINI_API_KEY` 주입을 먼저 확인해 `/refine` 파괴 위험 배제. 시크릿 값 무접촉. **2차 피해 동시 처리** — 포털 `lib/cms/ai.js`도 동일 원인으로 고장 상태였다(어드민 AI 이미지 생성 500). `aiImage`(global)+`CMS_IMAGE_MODEL` 신설, `generateImages()`→`generateContent()`. 소비처 게이트 49곳 충돌 0. Phase D: `apps/monk_imagen4/` 비정본 경고 주석(로직 무변경). ⏳ 어드민 클릭 1회만 미실행(세션 키=시크릿, 헌법 4조 1항) — 통과 조건 4가지는 전부 실증 | [COMPLETION](../../reports/2026-08/COMPLETION_20260827_iMac막내1_IMAGE_PRO_T2I마이그레이션.md) · `monk-image-engine-00032-qj6` · `monkos-portal-00557-k86` | ✅ prod |

---

## 5. 알려진 이슈

| # | 이슈 | 심각도 | 비고 |
|---|------|--------|------|
| 1 | v6 번들 원본 TSX 소스 부재 | 중 | 프론트 수정 시 minified JS 직접 패치 필요 |
| 2 | localStorage 오염 | 중 | 서버 단 CRITICAL INSTRUCTION 클리너로 우회 중. 프론트 근본 수정 필요 |
| 3 | /api/upload 스텁 | 저 | 실제 GCS 저장 미구현. 크래시 방지용 200 응답만 |
| 4 | 이중 서빙 (image.monkos.ai + monk.kr) | 중 | 모델 불일치 (Cloud Run: Imagen 4, CF: Gemini 3 Pro). 정리 대상 |
| 5 | auth.json 평문 인증 | 저 | 내부 스태프 전용이므로 즉시 위험은 낮으나, 보안 이슈 |
| 6 | /batch-generate 미사용 | 저 | server.js에 코드 존재하나 프론트 미호출. 정리 대상 |

---

## 6. 복기 — 2026-06-05~06 세션 교훈

- **PF 없이 유지보수 진입** → 코드 위치 파악에 시간 소모, 엉뚱한 소스(TSX) 수정
- **v6 번들 ≠ TSX 소스** → 프론트 수정 시 혼동. dist 빌드(228KB)와 v6(248KB)는 분기된 별도 코드
- **localStorage 잔존이 T2I 품질에 영향** → 사용자가 저장한 네거티브 프롬프트가 서버 단에서 주입되어 일러스트 편향 발생. 서버 단 방어(CRITICAL INSTRUCTION 제거) 필요
- **enhancePrompt:false 섣부른 적용** → 되던 기능(T2I 품질) 깨뜨림. 원인 격리 전 파라미터 변경 금지
- **타임아웃 미명시** → ultra 모델 30s 기본 타임아웃에 걸림. predict() 호출 시 timeout 명시 필수

---

## 7. 관련 문서 인덱스

| 문서 | 위치 |
|------|------|
| 코드 구조 전수조사 | `monkos-ops/ops/completions/2026-06/COMPLETION_20260606_막내3_imagePro_코드구조_전수조사.md` |
| deploy.sh | `apps/monk_imagen4/backend/deploy.sh` |
| 일러스트편향 근본수정 오더 | `monkos-ops/ops/orders/2026-06/ORDER_20260606_iMac쌍아_막내2_imagePro_일러스트편향_근본수정.md` |
| 다운로드버그 수정 오더 | `monkos-ops/ops/orders/2026-06/ORDER_20260606_iMac쌍아_막내_imagePro_다운로드버그_수정.md` |
| EXPORT+localStorage 오더 | `monkos-ops/ops/orders/2026-06/ORDER_20260606_iMac쌍아_막내_imagePro_EXPORT수정+localStorage클리어.md` |
| 애널라이저 진단 오더 | `monkos-ops/ops/orders/2026-06/ORDER_20260606_iMac쌍아_막내3_imagePro_애널라이저_진단.md` |
