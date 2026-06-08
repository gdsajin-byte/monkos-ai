---
type: completion
date: 2026-06-08
device: iMac
agent: 막내1
portfolio: PF_PORTAL, PF_OPUS, PF_SPREAD, PF_CITADEL, PF_IMAGE_PRO
status: 완료
---

# COMPLETION — 블로그 에디터 현황 분석 + 이미지 생성/저장/썸네일 개선 방향

**[2026-06-08 13:02 KST] iMac/막내1**

---

## Phase 1: 현황 분석

### 1. 시드(Seed) 기능

| 항목 | 내용 |
|------|------|
| **데이터 소스** | `/admin/data/episode_catalog.json` — 42개 에피소드 (정적 JSON) |
| **필드 구조** | `id`, `title`, `category`, `period`, `summary`, `insight`, `blogScore`(1-5), `researchScore`(1-5), `used`(boolean) |
| **카테고리** | ARCH, DEBUG, GOV, PRODUCT, TEAM, BIZ (6종) |
| **정렬** | blogScore 내림차순 |
| **"글감으로 사용" 워크플로우** | 팝업 → 버튼 클릭 → `title` 필드에 ep.title 삽입 + input 이벤트 발생(slug 자동생성 트리거) |
| **검색/필터** | 텍스트 검색 + 카테고리 드롭다운 |

**한계점:**
- 제목만 삽입됨 — 본문/요약/태그 자동 생성 없음
- `insight`와 `summary`를 에디터 본문에 삽입하는 기능 없음
- `used` 플래그 갱신 메커니즘 없음 (읽기 전용)
- 이미지 관련 연동 없음 (에피소드에 이미지 필드 자체 부재)

---

### 2. 리서치(Research) 기능

| 항목 | 내용 |
|------|------|
| **API 경로** | `GET /api/admin/search?query={q}&type={news\|blog\|image}&start=1&display=10` |
| **백엔드** | 네이버 Open API 프록시 (`openapi.naver.com/v1/search/{type}`) |
| **소스 종류** | 뉴스, 블로그, 이미지 (3종 토글) |
| **결과 활용** | 뉴스/블로그: "열기"(새탭) + "참조 복사"(타이틀+URL→클립보드). 이미지: 팝업 확대 보기 |
| **저작권 처리** | "저작권 주의: 오픈소스/CC 라이선스를 반드시 확인하세요" 경고문 |
| **자동 제안** | 제목 4자↑ 입력 시 1.5초 후 "🔍 리서치 검색" 토스트 표시 → 클릭 시 리서치 탭 전환+검색 실행 |
| **히스토리** | localStorage 최대 5건 |

**한계점:**
- 검색 결과를 에디터 본문에 직접 삽입하는 "인용 삽입" 기능 없음 (클립보드 복사만)
- 이미지 검색 결과를 에디터에 삽입/GCS 저장하는 기능 없음 (참조용만)
- 검색 엔진이 네이버 1곳 — Google/Bing 부재

---

### 3. 이미지 시스템

| 항목 | 내용 |
|------|------|
| **업로드 경로** | GCS `{GCS_BUCKET}/blog/{timestamp}_{filename}` |
| **변환** | sharp → JPEG 85% 품질 (GIF 제외). WebP/PNG → JPEG 통일 |
| **파일 제한** | 5MB, MIME: jpeg/png/webp/gif |
| **라이브러리** | `/api/admin/images` → GCS `blog/` prefix 전체 파일 목록, 날짜별 그룹핑, 최신순 |
| **삽입 방법** | ① 클릭→프리뷰 모달→"본문 삽입" ② 드래그&드롭(라이브러리→에디터) ③ Toast UI addImageBlobHook(에디터 직접 드롭/붙여넣기) |
| **Floating toolbar** | 에디터 본문 이미지 클릭 시: "📌 썸네일 지정" + "🗑 삭제" |
| **삭제** | 역링크 체크(blog_posts에서 사용 여부) → 경고 후 force 삭제 가능 |

**썸네일 로직 (우선순위):**
1. 수동 지정: `thumbnail` input에 URL 직접 입력 또는 파일 업로드
2. Floating toolbar: 에디터 내 이미지 클릭 → "📌 썸네일 지정"
3. 자동 fallback (저장 시): 본문 첫 이미지 추출 (WYSIWYG DOM → 마크다운 정규식)

**한계점:**
- `blog/` flat 구조 — 블로그별 이미지 묶음(폴더/태그) 없음
- AI 생성 vs 직접 업로드 이미지 구분 없음
- 리사이즈 기능 없음 (JPEG 변환만, 원본 크기 유지)
- 썸네일 전용 사이즈(1200×630) 자동 크롭 없음 → PF_PORTAL 미해결 이슈 #6
- OG 이미지 자동 생성(제목+브랜드 오버레이) 없음
- 이미지 ALT 자동 생성 없음

---

### 4. 에디터 코어

| 항목 | 내용 |
|------|------|
| **에디터 엔진** | Toast UI Editor (CDN, `toastui-editor-all.min.js`) |
| **초기 모드** | WYSIWYG (`initialEditType: 'wysiwyg'`) |
| **프리뷰** | tab 스타일 + 좌측 사이드바 프리뷰 카드 (실시간 갱신) |
| **높이** | 70vh |
| **레이아웃** | 3컬럼: 좌(메타설정) + 중앙(에디터) + 우(탭: 이미지/시드/리서치) |
| **slug 생성** | 영문: 클라이언트 자동변환. 한글: 서버에서 Gemini 2.5 Flash AI 생성 |
| **slug 형식** | `{base}-{lang_suffix}` (예: `ai-id-photo-review-kr`) |
| **내 글 목록** | 드롭다운으로 최근 10건 표시 (published/draft 구분) |

---

### 5. 백엔드 API

| 엔드포인트 | 메서드 | 동작 | 저장소 |
|-----------|--------|------|--------|
| `/api/admin/blog` | GET | 목록 (createdAt desc) | Firestore `blog_posts` |
| `/api/admin/blog` | POST | 생성 (slug 자동, 번역, GitHub Issues, sitemap ping, Indexing API) | Firestore |
| `/api/admin/blog/:slug` | GET | 상세 조회 | Firestore |
| `/api/admin/blog/:slug` | PUT | 수정 (발행 시 번역+SEO 자동) | Firestore |
| `/api/admin/blog/:slug` | DELETE | 삭제 | Firestore |
| `/api/admin/upload` | POST | 이미지 업로드 (multipart, JPEG 변환) | GCS `blog/` |
| `/api/admin/images` | GET | 이미지 라이브러리 목록 | GCS `blog/` |
| `/api/admin/images/:filename` | DELETE | 역링크 체크 후 삭제 | GCS |
| `/api/admin/search` | GET | 네이버 검색 프록시 (news/blog/image) | 외부 API |

**인증**: `requireAdmin` — HTTP Authorization Bearer 토큰 → Firebase UID → ADMIN_UIDS 목록 대조

**발행 시 자동 체이닝:**
1. Google Sitemap Ping
2. Google Indexing API (`URL_UPDATED`)
3. `llms.txt` 갱신 (AEO 대응)
4. 한국어 원본 → Gemini 2.0 Flash 자동번역(JA/EN) → Firestore 별도 슬러그로 저장
5. GitHub Issues 자동 게시

---

## Phase 2: PF 정합성 분석

### PF_OPUS (콘텐츠 플라이휠)

| 관점 | 분석 |
|------|------|
| **교차점** | 블로그 에디터 = "① 생산 엔진"의 핵심 도구. OPUS가 추적하는 "생산 자동화율" 지표의 분모 |
| **간극** | 현재 생산 자동화율 0%. 이미지·본문·SEO 메타 모두 수동. "1건이 4축 완주"하려면 에디터에서 트리거 가능해야 하나 배포 연결 미완 |
| **시너지** | 문맥 이미지 자동 생성이 추가되면 "에디터 내 원스톱 생산" → 자동화율 30% 목표 현실화. 시드→본문 자동 확장도 같은 축 |

### PF_SPREAD (21채널 배포)

| 관점 | 분석 |
|------|------|
| **교차점** | 블로그 원본이 배포 파이프라인 입력. `blog-share.js` OG 공유 버튼 구현 (X/LINE/카카오). 발행 시 GitHub Issues 자동 게시 확인 |
| **간극** | 에디터에서 21채널 직접 트리거 불가. share 버튼은 단순 URL 공유. 채널별 톤 변환(Layer 1 API/Layer 3 CDP) 미연결 |
| **시너지** | 썸네일 자동 생성(1200×630) = 모든 채널 OG 품질 상승. 에디터 "배포" 탭 추가 시 파이프라인 시작점 확보 |

### PF_CITADEL (SEO/GEO/AEO)

| 관점 | 분석 |
|------|------|
| **교차점** | summary(160자), tags, slug, category가 SEO 메타에 직결. 발행 시 Indexing API + llms.txt 자동. specs 페이지와 내부 링크 전략 이미 구현 |
| **간극** | og:image 크기/품질 통제 불가 (미해결 이슈 #6). 에디터에서 structured data(JSON-LD) 직접 제어 불가 (render.js에서 자동 생성이므로 큰 문제는 아님) |
| **시너지** | 1200×630 OG 썸네일 + 제목 오버레이 자동 생성 → SNS 공유 CTR 상승 → 유입 증가. "블로그 썸네일 크기 부족" 이슈 근본 해결 |

### PF_IMAGE_PRO (AI 이미지 생성)

| 관점 | 분석 |
|------|------|
| **교차점** | 현재 **연동 없음**. image.monkos.ai는 별도 Cloud Run(monk-image-engine) |
| **간극** | 에디터에서 T2I 호출 불가. 이미지 생성: image.monkos.ai 접속 → 생성 → 다운로드 → 에디터 업로드 (4단계 수동) |
| **시너지** | IMAGE_PRO의 Imagen 4 T2I 엔진을 에디터 내부에서 호출하면 "본문 맥락 → 프롬프트 → 생성 → 삽입" 원스톱. 인증 기반 동일(Firebase UID Staff). 서버 간 API 호출로 구현 가능 |

### PF_PORTAL (에디터 호스트)

| 관점 | 분석 |
|------|------|
| **교차점** | 블로그 에디터가 PF_PORTAL CMS의 핵심 모듈. Phase 0 블록 에디터(15블록) 별도 존재 |
| **미해결 이슈** | #3 블로그 데이터 끊김 (홈 정적 목업 4건 vs Firestore). #6 썸네일 크기 부족 |
| **간극** | 블록 에디터와 블로그 에디터 미통합. 이번 개선이 블록 에디터로의 마이그레이션과 충돌하지 않도록 설계 필요 |

---

## Phase 3: 개선 방향 제안

### 축 1 — 문맥 이미지 생성

**목표**: 에디터 본문 맥락에 기반한 AI 이미지를 에디터 내부에서 생성·삽입

**구현 방향:**

| # | 항목 | 설계 |
|---|------|------|
| 1 | **진입점** | 우측 탭에 "AI 이미지" 탭 신설 (이미지/시드/리서치/AI이미지 — 4탭) |
| 2 | **프롬프트 자동 생성** | 서버에서 Gemini 2.5 Flash로 `{title} + {본문 첫 300자} + {시드 insight}` → 이미지 프롬프트 생성. 사용자가 수정 가능한 텍스트 영역으로 제공 |
| 3 | **이미지 생성 엔진** | 포털 백엔드 → monk-image-engine `/generate` API 호출 (서버 간 통신, Imagen 4 Fast). Staff 인증은 포털이 중계하므로 추가 인증 불필요 |
| 4 | **결과 UI** | 생성된 이미지 프리뷰 → "본문 삽입" / "썸네일 지정" / "재생성" 버튼 |
| 5 | **저장** | 생성 즉시 GCS `blog/ai_{timestamp}_{slug}.jpg`로 업로드 → 이미지 라이브러리에 AI 뱃지 표시 |
| 6 | **스타일 프리셋** | 블로그 브랜드 톤에 맞는 프리셋 (사진풍/일러스트/미니멀/다이어그램) |

**IMAGE_PRO 연동 가능성:**
- monk-image-engine의 `POST /generate` 엔드포인트가 이미 존재 — 포털 서버에서 내부 HTTP 호출로 연동
- 인증: monk-image-engine은 Staff JSON 인증 → 포털 서버가 Staff 토큰으로 대리 호출하거나, 내부 API 키 방식 추가
- 모델: Imagen 4 Fast (속도 우선) 기본, Ultra 옵션 제공

**프롬프트 자동 생성 전략:**
```
입력: {title}, {본문 키워드 5개}, {category}, {시드 insight (있으면)}
프롬프트 엔진: Gemini 2.5 Flash
출력: 영문 이미지 프롬프트 (Imagen 4 최적화)
스타일 지시: "professional photography style, clean composition, no text overlay"
네거티브: "illustration, cartoon, anime, text, watermark"
```

---

### 축 2 — 이미지 저장 체계

**목표**: 블로그별 이미지 묶음 관리 + AI 생성 이미지 구분

**현행 구조:**
```
GCS: {bucket}/blog/{timestamp}_{filename}.jpg  ← flat, 구분 없음
```

**개선 방향:**

| # | 항목 | 설계 |
|---|------|------|
| 1 | **경로 구조 개편** | `blog/{slug}/{timestamp}_{filename}.jpg` — 포스트별 폴더 묶음 |
| 2 | **하위 호환** | 기존 `blog/{flat}` 이미지는 이동하지 않음. 신규 업로드부터 새 경로 적용. 라이브러리에서 양쪽 모두 조회 |
| 3 | **AI 생성 구분** | 파일명 접두사 `ai_` 부여. 라이브러리 UI에 "🤖 AI" 뱃지 표시 |
| 4 | **메타데이터** | GCS custom metadata에 `source: upload|ai-generate`, `prompt: {사용된 프롬프트}`, `model: imagen-4-fast` 기록 |
| 5 | **필터링** | 라이브러리에 "전체 / 이 글 / AI 생성" 필터 추가 |
| 6 | **용량 관리** | 라이브러리에 총 사용량 표시. 월별 통계 |

**마이그레이션 전략:**
- 기존 `blog/{flat}` 파일의 `{slug}` 폴더 분류는 선택적 백그라운드 작업 (역링크 기반 매핑)
- URL 변경 없음 (기존 이미지 URL 유지) — 신규분만 새 경로
- upload.js의 `gcsPath` 생성 로직에 slug 파라미터 추가

---

### 축 3 — 썸네일 기능

**목표**: OG 이미지 자동 생성 + 1200×630 규격 자동 리사이즈

**현행 한계:**
- 썸네일 = 본문 첫 이미지 그대로 사용 (크기/비율 미제어)
- PF_PORTAL 미해결 이슈 #6 "블로그 썸네일 크기 부족"
- SNS 공유 시 이미지 잘림/저해상도 문제

**개선 방향:**

| # | 항목 | 설계 |
|---|------|------|
| 1 | **자동 리사이즈** | 썸네일 지정 시 서버에서 sharp로 1200×630 크롭+리사이즈 버전 별도 생성 → `blog/{slug}/og_{filename}.jpg` |
| 2 | **OG 이미지 자동 생성** | "자동 생성" 버튼: 제목 텍스트 + 카테고리 배지 + MONKOS 로고를 1200×630 캔버스에 합성. 배경은 본문 첫 이미지 블러 또는 브랜드 그래디언트 |
| 3 | **구현 방식** | 서버: sharp composite (텍스트 오버레이는 SVG 렌더 → sharp 합성). 또는 @vercel/og 방식의 Satori 렌더링 |
| 4 | **프리뷰** | 에디터 좌측 프리뷰 카드의 `aspect-ratio: 1200/630`이 이미 구현 — 여기에 생성된 OG 이미지 표시 |
| 5 | **발행 시 자동** | 썸네일 미지정 시 발행 전 "OG 이미지를 자동 생성하시겠습니까?" 확인 → 자동 생성 후 저장 |
| 6 | **채널 최적화** | OG 기본(1200×630) + Instagram 정방(1080×1080) + X 와이드(1600×900) 멀티 사이즈 생성 (PF_SPREAD 시너지) |

**OG 이미지 자동 생성 레이아웃 안:**
```
┌─────────────────────────────────────┐
│  [블러 배경 or 그래디언트]           │
│                                     │
│     ┌─────────────────────┐        │
│     �� 블로그 제목 (2줄 max) │        │
│     │ 카테고리 배지          │        │
│     └─────────────────────┘        │
│                                     │
│                        MONKOS 로고   │
└─────────────────────────────────────┘
1200 × 630 px
```

---

## 구현 우선순위 제안

| 순위 | 항목 | 난이도 | 효과 | 근거 |
|------|------|--------|------|------|
| **1** | 썸네일 자동 리사이즈 (1200×630) | 낮음 | 높음 | PF_PORTAL #6 즉시 해결 + PF_CITADEL og:image 품질 + PF_SPREAD 전채널 대응 |
| **2** | OG 이미지 자동 생성 (제목+브랜드) | 중간 | 높음 | 썸네일 없는 글도 브랜디드 OG 확보. 생산 병목 제거 |
| **3** | 문맥 이미지 생성 (IMAGE_PRO 연동) | 중간 | 매우 높음 | PF_OPUS 핵심 — 생산 자동화율 0→30% 기여 |
| **4** | 이미지 저장 체계 개편 (slug별 폴더) | 낮음 | 중간 | 관리성 향상. AI 이미지 도입 전 선행 조건 |
| **5** | 멀티 사이즈 썸네일 (채널별) | 중간 | 중간 | PF_SPREAD 각 채널 최적화 |

---

## ✅❌💡⏳📁🔀

- ✅ Phase 1 코드 전수 분석 완료 (8파일)
- ✅ Phase 2 PF 정합성 분석 완료 (5개 PF)
- ✅ Phase 3 개선 방향 3축 + 우선순위 제안 완료
- 💡 즉시 착수 가능 우선순위: ① 썸네일 1200×630 자동리사이즈 (sharp 한 줄 추가 수준)
- 💡 IMAGE_PRO 연동은 monk-image-engine `/generate` 엔드포인트 활용, 포털 서버 프록시로 구현
- 📁 `monkos-ops/ops/completions/2026-06/COMPLETION_20260608_막내_블로그에디터_현황분석+개선방향.md`
- 🔀 코드 수정 없음 (분석·제안만)
