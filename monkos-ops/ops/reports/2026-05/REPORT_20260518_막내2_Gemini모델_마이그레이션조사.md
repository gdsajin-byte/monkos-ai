---
type: report
date: 2026-05-18
device: iMac
agent: 막내2
portfolio: PF_PORTAL
order: ORDER_20260518_iMac쌍아_막내2_Gemini모델_마이그레이션조사.md
status: 완료
---

# Gemini 모델 마이그레이션 전수 조사 보고서

> **[2026-05-18 12:43 KST] iMac/막내2 → 작가님, iMac/쌍아**

---

## 1. MONKOS 코드 전수 스캔 결과

### 1-1. 프로덕션 서비스 (Cloud Run 배포 대상)

| # | 모델명 | 파일:라인 | 용도 | 접근방식 | 하드코딩 | preview 태그 |
|---|--------|----------|------|----------|---------|-------------|
| 1 | `gemini-2.0-flash` | portal/server.js:78,397 | 챗봇 (health 표시) | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 2 | `gemini-2.0-flash` | portal/lib/chat-engine.js:221,265 | 챗봇 대화 엔진 | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 3 | `gemini-2.0-flash` | portal/lib/cms/blog.js:25 | 블로그 AI 기능 | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 4 | `gemini-2.0-flash` | portal/lib/cms/translate.js:16,112 | CMS 번역 | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 5 | `gemini-2.0-flash` | idphoto-kr/server.js:374 | 사전분석 (얼굴좌표) | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 6 | `gemini-2.0-flash` | idphoto-jp/server.js:377,459 | 사전분석 + QC 폴백 | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 7 | `gemini-2.0-flash` | studio/server.js:337 | 사전분석 | Vertex AI ADC | ✅ 하드코딩 | ❌ Stable |
| 8 | `gemini-2.0-flash-live-preview-04-09` | idphoto-kr/server.js:332 | Live 촬영 코칭 (음성) | Vertex AI ADC | ✅ 하드코딩 | ⚠️ Preview |
| 9 | `gemini-2.0-flash-live-preview-04-09` | idphoto-jp/server.js:335 | Live 촬영 코칭 (음성) | Vertex AI ADC | ✅ 하드코딩 | ⚠️ Preview |
| 10 | `gemini-3-pro-image-preview` | idphoto-kr/server.js:552 | Imagen I2I (증명사진 생성) | AI Studio API Key | ✅ 하드코딩 | ⚠️ Preview |
| 11 | `gemini-3-pro-image-preview` | idphoto-jp/server.js:598 | Imagen I2I (증명사진 생성) | AI Studio API Key | ✅ 하드코딩 | ⚠️ Preview |
| 12 | `gemini-3-pro-image-preview` | studio/server.js:178,454 | I2I 프로필 생성 (Nano Banana Pro) | Vertex AI ADC | ✅ 하드코딩 | ⚠️ Preview |
| 13 | `gemini-3.1-flash-image-preview` | studio/server.js:177 | I2I 프로필 생성 (Nano Banana 2) | Vertex AI ADC | ✅ 하드코딩 | ⚠️ Preview |

### 1-2. CF Workers (functions/)

| # | 모델명 | 파일:라인 | 용도 | 접근방식 |
|---|--------|----------|------|----------|
| 14 | `gemini-2.0-flash` | functions/api/translate.js:39 | 번역 | AI Studio API Key (REST) |
| 15 | `gemini-2.0-flash` | functions/api/analyze.js:40 | 분석 | AI Studio API Key (REST) |
| 16 | `gemini-3-pro-image-preview` | functions/api/generate.js:37 | 이미지 생성 | AI Studio API Key (REST) |
| 17 | `gemini-3-pro-image-preview` | functions/api/refine.js:57 | 이미지 정제 | AI Studio API Key (REST) |

### 1-3. 프로토타입/PoC (apps/)

| # | 모델명 | 파일:라인 | 용도 | 비고 |
|---|--------|----------|------|------|
| 18 | `gemini-2.0-flash-live-preview-04-09` | apps/photo-coach/server.js:141 | Live 코칭 데모 | PoC |
| 19 | `gemini-2.0-flash` | apps/photo-coach/server.js:223 | 분석 | PoC |
| 20 | `gemini-3-pro-image-preview` | apps/photo-coach/server.js:191 | I2I 생성 | PoC |
| 21 | `gemini-2.0-flash-live-preview-04-09` | apps/monk-cam/demo/presentation_server.js:74 | Live 데모 | PoC |
| 22 | `gemini-2.0-flash-001` | apps/MonkosChat/functions/index.js:30,140 | 챗봇 | PoC |
| 23 | `gemini-2.0-flash-001` | apps/MonkosChat/test_vertex_ai.py:24 | 테스트 | PoC |
| 24 | `gemini-1.5-pro-002` | apps/MonkosChat/test_vertex_ai.py:49 | 테스트 | PoC (이미 종료) |
| 25 | `imagen-3.0-generate-001` 등 | apps/monk_imagen4/modules/imagen3-pro/ | Imagen 3 Pro Suite | PoC (이미 종료) |
| 26 | `imagen-4.0-*` | apps/monk_imagen4/backend/server.js:100-101 | Imagen 4 생성 | PoC |
| 27 | `gemini-3-pro-image-preview` | apps/monk_imagen4/services/geminiService.ts:55 | I2I/Edit | PoC |
| 28 | `gemini-3-flash-preview` | apps/idphoto-jp-v079/server.js:352 | QC | 백업 (비프로덕션) |

### 1-4. 원타임 스크립트 (portal/scripts/)

| # | 모델명 | 파일 | 용도 |
|---|--------|------|------|
| 29 | `gemini-2.0-flash` | portal/scripts/retranslate_crosscontamination.js:50,114 | 번역 마이그레이션 |
| 30 | `gemini-2.0-flash` | portal/scripts/migrate_korean_slugs.js:34 | 슬러그 마이그레이션 |
| 31 | `gemini-2.0-flash` | portal/scripts/retranslate_naver_posts.js:63 | 네이버 재번역 |
| 32 | `gemini-2.0-flash` | portal/scripts/migrate_naver_full_content.js:206 | 네이버 콘텐츠 이관 |

---

## 2. Google 공식 Deprecation 일정

> 출처: [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations), [Model versions](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions), [Release notes](https://ai.google.dev/gemini-api/docs/changelog)

### 2-1. 확정된 Shutdown 일정

| 모델 | Shutdown 날짜 | D-Day (5/18 기준) | 공식 대체 모델 | 비고 |
|------|-------------|-------------------|---------------|------|
| **`gemini-2.0-flash`** | **2026-06-01** | **D-14** | `gemini-2.5-flash` | 2026-03-06부터 신규 고객 차단 |
| **`gemini-2.0-flash-001`** | **2026-06-01** | **D-14** | `gemini-2.5-flash` | 동일 |
| `gemini-2.0-flash-lite` | 2026-06-01 | D-14 | `gemini-2.5-flash-lite` | 미사용 |
| `gemini-2.0-flash-live-001` | 2025-12-09 | **이미 종료** | `gemini-3.1-flash-live-preview` | — |
| `imagen-3.0-generate-002` | 2025-11-10 | 이미 종료 | `imagen-4.0-generate-001` | PoC에만 잔존 |
| `imagen-4.0-generate-001` | 2026-06-24 | D-37 | `gemini-3-pro-image-preview` | PoC에만 해당 |
| `gemini-2.5-flash` | 2026-10-16 | D-151 | `gemini-3-flash-preview` | 중기 이전 대상 |
| `gemini-2.5-pro` | 2026-10-16 | D-151 | `gemini-3.1-pro-preview` | 참고 |

### 2-2. Preview 모델 (Shutdown 미확정 — 최소 2주 전 통지)

| 모델 | 현재 상태 | 리스크 | 비고 |
|------|----------|--------|------|
| **`gemini-2.0-flash-live-preview-04-09`** | Preview | 🔴 **매우 높음** | 2.0 계열 전체 2026-06-01 shutdown. 이 preview도 동시 종료 가능성 극히 높음 |
| **`gemini-3-pro-image-preview`** | Preview | 🟡 중간 | GA 일정 미발표. Preview 최소 2주 전 통지 정책. 현재 활성 |
| **`gemini-3.1-flash-image-preview`** | Preview | 🟡 중간 | Nano Banana 2. 2026-05 현재 활성. Vertex AI에서도 allowlist 방식 제공 중 |
| `gemini-3-flash-preview` | Preview | 🟢 낮음 | 미사용 (백업에만). 2.5-flash 후속 |

### 2-3. Google AI Studio vs Vertex AI 가용성 차이

| 모델 | AI Studio (API Key) | Vertex AI (ADC) |
|------|-------------------|----------------|
| `gemini-2.0-flash` | ✅ (6/1까지) | ✅ (6/1까지) |
| `gemini-2.5-flash` | ✅ | ✅ |
| `gemini-3-pro-image-preview` | ✅ 무료 포함 | ⚠️ **Allowlist 필요** |
| `gemini-3.1-flash-image-preview` | ✅ | ⚠️ **Allowlist 필요** |
| `gemini-3.1-flash-live-preview` | ✅ | ⚠️ Allowlist 필요 |

> **핵심**: idphoto-kr/jp의 I2I 생성이 AI Studio API Key를 사용하는 이유는 `gemini-3-pro-image-preview`가 Vertex AI에서 allowlist 없이는 접근 불가하기 때문.

---

## 3. 마이그레이션 영향도 분석

### 🔴 CRITICAL — D-14 (2026-06-01 Shutdown)

#### 3-1. `gemini-2.0-flash` → `gemini-2.5-flash`

| 항목 | 분석 |
|------|------|
| **영향 범위** | 프로덕션 7개소 (#1~7) + CF Workers 2개소 (#14,15) + 스크립트 4개소 (#29~32) |
| **긴급도** | 🔴 D-14. **즉시 착수 필수** |
| **대체 모델** | `gemini-2.5-flash` (Stable, 2026-10-16까지 보장) |
| **API 시그니처** | `@google/genai` SDK 동일 인터페이스. 모델명 문자열만 교체 |
| **응답 포맷** | 동일 (generateContent → text 추출 패턴 동일) |
| **코드 변경** | 모델명 문자열 교체만. 로직 변경 불필요 |
| **비용** | 2.5-flash는 2.0-flash 대비 입력 토큰 기준 유사 가격대 |
| **퀄리티** | 2.5-flash가 추론 성능 상위. 챗봇/번역/분석 모두 품질 향상 예상 |
| **테스트** | 챗봇 응답 톤, 번역 품질, 사전분석 좌표 정확도 실측 필수 |

#### 3-2. `gemini-2.0-flash-live-preview-04-09` → `gemini-3.1-flash-live-preview`

| 항목 | 분석 |
|------|------|
| **영향 범위** | 프로덕션 2개소 (#8,9: idphoto-kr/jp Live 코칭) |
| **긴급도** | 🔴 D-14. 2.0 계열 동시 shutdown 가능성 높음 |
| **대체 모델** | `gemini-3.1-flash-live-preview` (Google 공식 권장) |
| **API 시그니처** | Live API WebSocket 인터페이스. 모델명 교체 + 파라미터 호환성 검증 필요 |
| **코드 변경** | 모델명 교체 + Live API 세션 설정(config) 파라미터 검증. 음성 설정(voiceConfig 등) 호환 확인 필요 |
| **Vertex AI 가용** | ⚠️ Allowlist 필요할 수 있음 — 사전 확인 필수 |
| **테스트** | 실시간 음성 코칭 품질, 레이턴시, 한국어/일본어 음성 지원 실측 필수 |

### 🟡 HIGH — Preview 리스크 (Shutdown 미확정)

#### 3-3. `gemini-3-pro-image-preview` (현재 유지, 모니터링)

| 항목 | 분석 |
|------|------|
| **영향 범위** | 프로덕션 3개소 (#10,11,12) + CF Workers 2개소 (#16,17). **핵심 매출 기능 (증명사진 I2I)** |
| **긴급도** | 🟡 확정 shutdown 없으나 Preview 정책상 최소 2주 전 통지로 종료 가능 |
| **현재 상태** | 2026-05 현재 활성. GA 전환 일정 미발표 |
| **대체 후보** | `gemini-3.1-flash-image-preview` (Nano Banana 2) — 더 빠르고 저렴하나 4K 품질은 Pro가 우위 |
| **코드 변경** | 모델명 교체만 (동일 SDK/REST 패턴) |
| **테스트** | **증명사진 퀄리티 = 매출 직결**. 정체성 보존율, 해상도, 배경 처리 비교 필수 |
| **전략** | 당장 교체 불필요. 대체 모델 사전 검증 + deprecation 모니터링 체계 구축 |

### 🟢 LOW — PoC/백업 (운영 무관)

| 대상 | 조치 |
|------|------|
| apps/MonkosChat (#22,23) | PoC. 활성화 시 교체 |
| apps/monk_imagen4 imagen-3.0 (#25) | 이미 종료 모델. 코드 정리 또는 방치 |
| apps/idphoto-jp-v079 (#28) | 백업 스냅샷. 수정 불필요 |
| portal/scripts (#29~32) | 원타임 스크립트. 재실행 가능성 낮으나 교체 권장 |

---

## 4. 마이그레이션 로드맵 제안

### Phase 1: 긴급 (5/19 ~ 5/25) — D-14 대응

| 우선순위 | 작업 | 예상 소요 | 롤백 전략 |
|---------|------|----------|----------|
| **P0** | `gemini-2.0-flash` → `gemini-2.5-flash` (프로덕션 7개소) | 1일 (코드 변경) + 1일 (테스트) | 모델명 문자열 원복 |
| **P0** | `gemini-2.0-flash` → `gemini-2.5-flash` (CF Workers 2개소) | 0.5일 | REST URL 원복 |
| **P1** | `gemini-2.0-flash-live-preview-04-09` → `gemini-3.1-flash-live-preview` (idphoto-kr/jp) | 1일 (코드) + 2일 (음성 품질 테스트) | 모델명 원복 |

**산출물**: 각 서비스별 deploy.sh 배포

### Phase 2: 안정화 (5/26 ~ 5/31) — 6/1 전 완료

| 작업 | 예상 소요 |
|------|----------|
| 프로덕션 모니터링 (에러율, 레이턴시) | 상시 |
| 챗봇 응답 품질 검수 (KR/JP) | 1일 |
| Live 코칭 음성 품질 검수 (KR/JP) | 1일 |
| 사전분석 좌표 정확도 비교 | 0.5일 |

### Phase 3: Preview 리스크 대비 (6월~)

| 작업 | 예상 소요 |
|------|----------|
| `gemini-3-pro-image-preview` 대체 모델 사전 검증 (Nano Banana 2 vs Pro 비교) | 3일 |
| Vertex AI allowlist 신청 (gemini-3-pro-image-preview, gemini-3.1-flash-live-preview) | 비동기 |
| Preview deprecation 모니터링 체계 구축 (changelog RSS 등) | 0.5일 |
| 모델명 환경변수화 검토 (하드코딩 → `process.env.GEMINI_MODEL` 패턴) | 1일 |

### Phase 4: 중기 (10월 전)

| 작업 | 비고 |
|------|------|
| `gemini-2.5-flash` → `gemini-3-flash-preview` (또는 GA 모델) | 2.5-flash shutdown 2026-10-16 |
| PoC 코드 정리 (imagen-3.0, gemini-1.5 잔존 제거) | 기술 부채 |

---

## 5. 핵심 발견 사항

1. **전 서비스 모델명 하드코딩**: 17개 프로덕션 참조점 전부 문자열 하드코딩. 환경변수화하면 향후 마이그레이션 비용 대폭 절감.

2. **하이브리드 인증 복잡성**: idphoto-kr/jp는 Vertex AI ADC + AI Studio API Key 병행. `gemini-3-pro-image-preview`가 Vertex AI allowlist 필요하여 이 구조가 발생. allowlist 확보 시 ADC 단일화 가능.

3. **KR/JP 코드 동기화**: idphoto-kr과 idphoto-jp가 거의 동일 구조이나 별도 파일. 한쪽만 교체하고 다른 쪽을 누락할 리스크 있음.

4. **Live API 모델 세대 건너뜀**: 현재 `2.0-flash-live-preview` → 대체가 `3.1-flash-live-preview`. 중간 2.5 Live 모델(`gemini-live-2.5-flash-preview`)은 이미 2025-12-09 종료됨. API 호환성 변경폭이 클 수 있음.

---

## 출처

- [Gemini deprecations — 공식 Shutdown 일정표](https://ai.google.dev/gemini-api/docs/deprecations)
- [Gemini API Models — 현재 가용 모델 목록](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3 Pro Image Preview — 모델 상세](https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image-preview)
- [Gemini API Release Notes — 변경 이력](https://ai.google.dev/gemini-api/docs/changelog)
- [Model versions and lifecycle — Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions)
- [Gemini 3 Pro Image — Vertex AI](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-pro-image)
