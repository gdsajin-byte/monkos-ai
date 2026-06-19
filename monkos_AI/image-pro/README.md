# MONKOS IMAGE PRO — image.monkos.ai

> AI 이미지 생성·변주·편집 도구. T2I(Imagen 4) + I2I(나노바나나 프로) 2파티션 구조.
> Cloud Run 서비스명: `monk-image-engine`
> 어드민: 포털 어드민 → IMAGE PRO (External)

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| 도메인 | image.monkos.ai |
| Cloud Run | monk-image-engine (us-central1) |
| SA | monk-image-engine@monkos.iam.gserviceaccount.com |
| 프론트엔드 | React 19 + Vite + TypeScript |
| 백엔드 | Node.js Express |
| T2I 엔진 | Vertex AI Imagen 4 (fast/ultra), `personGeneration: allow_all` |
| I2I 엔진 | Gemini 3 Pro Image Preview (나노바나나 프로), `BLOCK_NONE` |
| GCS | monk-ai-images (생성물 보관) |

---

## 히스토리

> append only.

### 2025-12: 원형 개발

- 독립 레포 `monk-ai-studio-pro/` (레포 밖 `~/developer/`)에서 React+Vite+TS로 개발
- Gemini Pro Image Preview 기반 I2I 엔진 완성
- Quick Variations System, MONKOS 리브랜딩

### 2026-01-22: monk.kr 정식 배포 (v3)

- 커밋 `a08f5ff9` — "이미지 프로 정식 배포: 빌드 파일 복사, JSON 인증 시스템 추가"
- `MONK_kr/ai_lab/image_pro/`에 Vite 빌드 산출물 복사
- Staff/Enterprise 인증 게이트 (auth.json)
- 동일일 4건 연속 패치: 변주 로직 정리, 4K 업스케일 추가, Imagen 표기 → MONKOS ENGINE, 배포 버튼 임시 감춤

### 2026-01-13: 핵심 로직 발견 (세션 로그)

- 작가님: "거봐 우리 몽코스 로직이 정답인거야"
- `gemini-3-pro-image-preview` + `BLOCK_NONE` + IDENTITY_PRESERVATION 프롬프트 조합이 정답으로 확정
- Vertex AI가 아닌 AI Studio API 키 방식 채택 (독립성)

### 2026-02-20: v5→v6 업그레이드

- 커밋 `faae36b5` — Imagen 4 모델 스위칭 (fast/ultra)
- 커밋 `279aa3b8` — **v6**: Standard/Premium 엔진 라벨, 광고 로딩 화면, 4K 업스케일 제거
- 커밋 `32bc5462` — 광고 시스템 (GCS 매니페스트 + 캐러셀)
- **이 시점부터 TSX 원본이 아닌 번들 직접 패치 시작 → TSX와 번들 분기**

### 2026-02-28: monkos.ai 이관

- 커밋 `3f187748` — Phase 1: 백엔드 Cloud Run 배포
- 커밋 `aeb74bbf` — 프론트엔드 통합: `MONK_kr/ai_lab/image_pro/` → `apps/monk_imagen4/backend/public/` 복사
- 막내2 실행: server.js 정적 서빙 추가, Dockerfile 수정, API 분리 (monk.kr ↔ monkos.ai 교차오염 해소)
- 지시서: `ORDER_20260228_막내_image_pro_프론트_통합배포.md`

### 2026-04: v6→v5 롤백 시도 + 복원

- 커밋 `6ba934fc` — v6→v5 롤백 (일시)

### 2026-06-02~06: 장애·디버깅

- GEMINI_API_KEY 삭제 사고 → 전 서비스 생성 기능 다운
- 06-05: 민아 localStorage 오염 진단 (monk_negative_prompt → 일러스트체 출력 원인)
- 06-05: 쌍아 server.js gRPC 타임아웃 수정 (ultra 120s/fast 60s), 배포 rev 00028
- 06-06: 막내3 코드 구조 보고 — "v6 번들 원본 TSX 소스 부재, 이중 서빙, TSX ≠ v6 번들 분기" 확인

### 2026-06-19: monkos_AI 편입 + TSX 현행화 착수

- `monkos_AI/image-pro/` 신설, 본 README 작성
- Resolution 1K/2K 버튼 미작동 발견 (onClick 빈 함수 + 백엔드 imageSize 미구현)
- **TSX 원본 현행화 + 빌드 파이프라인 복구 지시서 발행 예정**

---

## 현재 파일 위치 (정리 대상)

| 위치 | 성격 | 상태 |
|------|------|------|
| `~/developer/monk-ai-studio-pro/` | TSX 원본 (v3 수준) | 레포 밖. 편입 대상 |
| `apps/monk_imagen4/backend/` | 백엔드 server.js + v6 번들 | PoC 위치. 편입 대상 |
| `apps/monk_imagen4/` 루트 | TSX 사본 (원본과 불일치) | 정리 대상 |
| `MONK_kr/ai_lab/image_pro/` | monk.kr 배포본 | 레거시. 유지 (monk.kr 서빙) |
| **`monkos_AI/image-pro/`** | **정본 위치 (신설)** | 편입 진행 중 |

---

## 엔드포인트

| 메서드 | 경로 | 엔진 | 용도 |
|--------|------|------|------|
| POST | `/generate` | Imagen 4 (Vertex AI) | T2I — 텍스트→이미지 생성 |
| POST | `/refine` | Gemini 3 Pro Image (AI Studio) | I2I — 이미지 변주/편집/업스케일 |
| POST | `/analyze` | Gemini 2.0 Flash | 이미지 분석 |
| POST | `/translate` | Gemini 2.0 Flash | 프롬프트 번역 |
| GET | `/health` | — | 헬스 체크 |

---

## 관련 서비스

- **Studio** (studio.monkos.ai): 증명사진 내부 생성 도구. 프로필스 엔드포인트(`/api/profiles/generate`) 포함. 나노바나나 프로/2 스위칭 구조. IMAGE PRO의 I2I 관용도를 프로필스에 이식하는 건이 PF_PROFILES 연계 과제.
- **idphoto-kr/jp**: 증명사진 서비스. 같은 나노바나나 프로 사용하나 프롬프트 제약이 다름 (IDENTITY_PRESERVATION 90/10).

---

## 미해결

- [ ] TSX 원본 현행화 (v6 기능 역이식) + 빌드 파이프라인 복구
- [ ] Resolution 1K/2K 선택 정상 구현
- [ ] `monkos_AI/image-pro/`로 프론트+백엔드 통합 편입
- [ ] 프로필스 관용도 갭 해소 (IMAGE PRO I2I ↔ Studio profiles 비교 분석 완료, 수정 대기)
