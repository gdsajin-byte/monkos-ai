---
type: order
date: 2026-06-08
from: iMac/쌍아
to: iMac/막내
portfolio: PF_PORTAL, PF_OPUS, PF_SPREAD, PF_CITADEL, PF_IMAGE_PRO
status: 대기
---

# 지시서 — 블로그 에디터 현황 분석 + 이미지 생성/저장/썸네일 설계 + PF 정합성 기반 개선 방향 제안

**[2026-06-08 12:56 KST] iMac/쌍아 → iMac/막내**

---

## 배경

작가님+민아가 블로그 에디터 영역의 고도화를 설계 중이다. 핵심 방향은:
1. 문맥에 맞는 AI 이미지 생성 기능
2. 이미지 저장 체계
3. 썸네일 자동/반자동 생성

이를 위해 현재 블로그 에디터의 **시드(Seed)** 기능과 **리서치(Research)** 기능이 어떻게 구성되어 있는지 정확히 파악하고, 관련 PF들의 정합성을 토대로 개선 방향을 제안해야 한다.

---

## 임무

### Phase 1: 현황 분석 (코드 읽기)

블로그 에디터 관련 파일을 전수 분석하고 아래 항목별로 정리하라.

**대상 파일:**
- `monkos_AI/portal/public/admin/js/blog-editor.js` — 에디터 코어
- `monkos_AI/portal/public/admin/js/blog-seed.js` — 시드 카탈로그
- `monkos_AI/portal/public/admin/js/blog-research.js` — 리서치 탭
- `monkos_AI/portal/public/admin/js/blog-image.js` — 이미지 시스템
- `monkos_AI/portal/public/admin/js/blog-share.js` — 공유 시스템
- `monkos_AI/portal/public/admin/blog-edit.html` — 에디터 HTML
- `monkos_AI/portal/lib/cms/blog.js` — 백엔드 블로그 API
- `monkos_AI/portal/server.js` — 라우트 확인 (admin, search, upload 등)

**분석 항목:**

| # | 항목 | 내용 |
|---|------|------|
| 1 | **시드(Seed) 기능** | 데이터 소스(episode_catalog.json), 필드 구조, 카테고리 체계, blogScore/researchScore 활용, "글감으로 사용" 워크플로우, 한계점 |
| 2 | **리서치(Research) 기능** | 검색 API 경로·소스(news/blog/image), 결과 활용 흐름(인용 삽입 등), 이미지 검색 저작권 처리, 한계점 |
| 3 | **이미지 시스템** | 업로드 경로(GCS?), 라이브러리 구조, 삽입 메커니즘, 썸네일 로직(수동 업로드 vs 본문 첫 이미지 추출), floating toolbar, 한계점 |
| 4 | **에디터 코어** | Toast UI Editor 설정, WYSIWYG/마크다운 모드, 프리뷰 카드 로직, 저장/발행 플로우 |
| 5 | **백엔드 API** | `/api/admin/blog` CRUD, `/api/admin/upload`, `/api/admin/images`, `/api/admin/search` — 각 엔드포인트의 동작, 인증 체계, 저장소(Firestore? GCS?) |

### Phase 2: PF 정합성 분석

아래 PF들을 읽고, 블로그 에디터와의 **교차점·간극·시너지**를 분석하라.

| PF | 읽을 파일 | 교차점 |
|----|----------|--------|
| **PF_OPUS** | `monkos-ops/ops/portfolios/PF_OPUS/README.md` | 생산 엔진(①)의 핵심 도구가 블로그 에디터. 자동화율 지표와 연결 |
| **PF_SPREAD** | `monkos-ops/ops/portfolios/PF_SPREAD/README.md` | 블로그 원본 → 21채널 배포. 에디터에서 배포 트리거가 연결되는가? |
| **PF_CITADEL** | `monkos-ops/ops/portfolios/PF_CITADEL/README.md` | SEO 메타데이터(og:image, structured data) 에디터에서 제어 가능한가? |
| **PF_IMAGE_PRO** | `monkos-ops/ops/portfolios/PF_IMAGE_PRO/README.md` | image.monkos.ai의 T2I/I2I 엔진을 에디터 내에서 호출할 수 있는가? |
| **PF_PORTAL** | `monkos-ops/ops/portfolios/PF_PORTAL/README.md` | 블록 에디터 Phase 0과의 관계, 미해결 이슈 (#3 블로그 데이터 끊김, #6 썸네일 크기 부족) |

### Phase 3: 개선 방향 제안

Phase 1-2 분석 결과를 토대로, 아래 3대 축에 대한 **구체적 개선 방향**을 제안하라.

**축 1 — 문맥 이미지 생성**
- 에디터 본문 맥락(제목+시드+본문 키워드)을 기반으로 AI 이미지를 생성하는 기능
- IMAGE_PRO의 T2I 엔진(Imagen 4) 연동 가능성
- 프롬프트 자동 생성 전략 (본문 맥락 → 이미지 프롬프트)

**축 2 — 이미지 저장 체계**
- 현행 GCS 업로드 경로와 구조 분석
- 블로그별 이미지 묶음(폴더/태그) 전략
- AI 생성 이미지 vs 직접 업로드 이미지 구분 관리

**축 3 — 썸네일 기능**
- 현행 썸네일 로직의 한계 (수동 업로드 or 본문 첫 이미지 추출)
- OG 이미지 자동 생성 (제목+브랜드 오버레이)
- SEO/소셜 최적화 사이즈(1200×630) 자동 리사이즈

**출력 형식:** COMPLETION 보고서 1건.

---

## ⚠️ 준수 조항

- **코드 수정 없음** — 이번 지시서는 **분석·제안만**. 구현은 후속 지시서에서 별도 발행.
- 헌법 3조 1항: 매 턴 `date`로 KST 취득. 추정 금지.
- 헌법 4조 1항: API 키, 비밀정보 생성/추측 금지.
- ch7 1조: 지시 범위 외 파일 수정 금지.

---

## 납품

- `monkos-ops/ops/completions/2026-06/COMPLETION_20260608_막내_블로그에디터_현황분석+개선방향.md`
- 완료 후 `✅❌💡⏳📁🔀` 형식 보고.
