---
type: order
date: 2026-06-08
from: iMac/쌍아
to: iMac/막내3
portfolio: PF_PORTAL, PF_OPUS, PF_IMAGE_PRO
status: 대기
---

# 지시서 — 블로그 에디터 AI 이미지 생성 + 썸네일 자동화 Phase 1 구현

**[2026-06-08 14:01 KST] iMac/쌍아 → iMac/막내3**

---

## 배경

막내1(에디터 현황 분석) + 막내2(채널별 에디터 분석) + 민아(이미지 파이프라인 조사 + Canva 실증) 3건의 선행 분석이 완료되었다. 결론:

- 부품은 전부 있다 — Gemini 클라이언트(`config.js:89`), GCS 업로드(`upload.js`), 에디터 이미지 삽입(`blog-image.js`), Imagen은 monk-image-engine
- **AI 이미지 생성 호출만 부재**
- 썸네일 1200×630 자동 리사이즈 = PF_PORTAL 미해결 이슈 #6 즉시 해결

이 지시서는 **Phase 1 — 버튼 트리거 방식** 구현이다. 상주 에이전트(Phase 2~3)는 후속.

---

## 임무

### Task 1: 백엔드 — AI 엔드포인트 3개 신설

`monkos_AI/portal/lib/cms/ai.js` 신규 파일 생성.

#### 1-1. `POST /api/admin/ai/image` — 맥락 이미지 생성

```
요청: { title, content(본문 첫 500자), category, style }
동작:
  ① Gemini 2.5 Flash로 이미지 프롬프트 생성
     입력: title + content 키워드 5개 + category
     출력: 영문 이미지 프롬프트 (Imagen 최적화)
     스타일 프리셋: photo(기본) / illustration / minimal / diagram
  ② Imagen 4 Fast로 이미지 생성
     - config.js의 ai(GoogleGenAI) 인스턴스 사용
     - 모델: 'imagen-4.0-generate-001' (Vertex AI)
     - 해상도: 1024×1024
  ③ sharp로 JPEG 85% 변환
  ④ GCS 업로드: blog/ai_{timestamp}_{slug}.jpg
     - custom metadata: { source: 'ai-generate', model: 'imagen-4-fast', prompt: '{사용된 프롬프트}' }
  ⑤ URL 반환
응답: { url, prompt }
인증: requireAdmin
```

**Imagen 4 호출 방법** — config.js의 `ai` (GoogleGenAI Vertex) 사용:
```js
const response = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: generatedPrompt,
  config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
});
const imageBytes = response.generatedImages[0].image.imageBytes;
const imageBuffer = Buffer.from(imageBytes, 'base64');
```

#### 1-2. `POST /api/admin/ai/thumbnail` — OG 썸네일 자동 생성

```
요청: { title, category, backgroundUrl(optional) }
동작:
  ① 배경 결정: backgroundUrl → sharp 리사이즈+블러 / 없으면 브랜드 그래디언트(SVG)
  ② sharp composite로 1200×630 캔버스에:
     - 배경 (블러 or 그래디언트)
     - 제목 텍스트 (SVG → sharp 합성, 최대 2줄)
     - 카테고리 배지
     - MONKOS 로고 (public/images/logo 참조)
  ③ JPEG 85% → GCS 업로드: blog/og_{timestamp}_{slug}.jpg
  ④ URL 반환
응답: { url }
인증: requireAdmin
```

**SVG 텍스트 합성 패턴:**
```js
const svgText = `<svg width="1200" height="630">
  <rect width="1200" height="630" fill="rgba(0,0,0,0.5)"/>
  <text x="100" y="350" font-size="48" fill="white" font-family="sans-serif">
    ${escapeXml(title.slice(0, 40))}
  </text>
</svg>`;
const textLayer = Buffer.from(svgText);
const result = await sharp(background).composite([{ input: textLayer }]).jpeg({ quality: 85 }).toBuffer();
```

#### 1-3. `POST /api/admin/ai/suggest` — SEO 메타 자동 제안

```
요청: { title, content }
동작:
  ① Gemini 2.5 Flash로 생성:
     - summary (160자 이내, 한국어)
     - tags (5개, 쉼표 구분)
     - og_title (60자 이내)
응답: { summary, tags, ogTitle }
인증: requireAdmin
```

### Task 2: 서버 라우팅 등록

`server.js`에 3개 라우트 추가:
```
POST /api/admin/ai/image    → handleAiImage
POST /api/admin/ai/thumbnail → handleAiThumbnail
POST /api/admin/ai/suggest   → handleAiSuggest
```

import 추가: `import { handleAiImage, handleAiThumbnail, handleAiSuggest } from './lib/cms/ai.js';`

### Task 3: 프론트엔드 — blog-ai.js 신설

`monkos_AI/portal/public/admin/js/blog-ai.js` 신규 파일 생성.

#### 3-1. AI 이미지 탭

에디터 우측 사이드바에 4번째 탭 "AI" 추가 (이미지 / 시드 / 리서치 / **AI**).

UI 구성:
```
┌─ AI 이미지 생성 ──────────────────┐
│ [스타일] 📷사진 | 🎨일러스트 | ◻️미니멀 │
│                                    │
│ [프롬프트] ________________________ │
│ (자동생성됨, 수정 가능)              │
│                                    │
│ [🎲 생성] [🔄 재생성]              │
│                                    │
│ ┌──────────┐                      │
│ │ 생성 결과  │ [본문 삽입]          │
│ │ 프리뷰    │ [📌 썸네일 지정]     │
│ └──────────┘ [⬇ 다운로드]          │
│                                    │
│ ─── OG 썸네일 ───                  │
│ [🖼 자동 생성] 1200×630            │
│ 배경: ○ 본문 첫 이미지 블러          │
│       ○ 브랜드 그래디언트           │
│ ┌──────────┐                      │
│ │ OG 프리뷰  │ [썸네일 적용]        │
│ └──────────┘                      │
│                                    │
│ ─── SEO 제안 ───                   │
│ [✨ 자동 생성]                      │
│ 요약: ________________________     │
│ 태그: ________________________     │
│ [적용]                             │
└────────────────────────────────────┘
```

#### 3-2. 기능 동작

| 버튼 | 동작 |
|------|------|
| 🎲 생성 | 제목+본문 첫 500자+카테고리+스타일 → `POST /api/admin/ai/image` → 프리뷰 표시 |
| 본문 삽입 | `blog-image.js`의 `insertImage(url, name)` 재활용 → 에디터 본문에 이미지 삽입 |
| 📌 썸네일 지정 | `document.getElementById('thumbnail').value = url` + updatePreview() |
| 🖼 OG 자동 생성 | 제목+카테고리+배경URL → `POST /api/admin/ai/thumbnail` → OG 프리뷰 표시 |
| ✨ SEO 제안 | 제목+본문 → `POST /api/admin/ai/suggest` → summary/tags 필드 자동 채움 |

#### 3-3. blog-edit.html 수정

- 사이드바 탭에 "AI" 탭 버튼 추가
- `<div id="tab-ai" class="tab-content">` 영역 추가
- `<script type="module">` import에 `blog-ai.js` 추가

#### 3-4. blog-ai.css (blog-edit.html 내 인라인 or 별도)

- AI 탭 내부 스타일 (프리뷰 카드, 스타일 토글, 프롬프트 텍스트영역)
- 기존 에디터 다크 테마(`--bg`, `--text`, `--accent` 변수) 준용

### Task 4: 썸네일 자동 리사이즈 (발행 시)

`blog.js`의 `handleBlogCreate`와 `handleBlogUpdate`에서 발행(published=true) 시:

```
if (published && thumbnail) {
  // thumbnail URL의 이미지를 fetch → sharp로 1200×630 리사이즈 → 별도 저장
  // blog/og_{timestamp}_{slug}.jpg
  // Firestore에 ogImage 필드 추가
}
```

`render.js`의 `og:image` 메타태그가 `ogImage || thumbnail` 폴백으로 동작하도록 수정.

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `lib/cms/ai.js` | **신규** — AI 엔드포인트 3개 |
| `server.js` | **수정** — 라우트 3개 + import 추가 |
| `public/admin/js/blog-ai.js` | **신규** — AI 탭 프론트엔드 모듈 |
| `public/admin/blog-edit.html` | **수정** — AI 탭 UI + import |
| `lib/cms/blog.js` | **수정** — 발행 시 썸네일 1200×630 자동 리사이즈 |
| `lib/cms/render.js` | **수정** — og:image에 ogImage 필드 우선 참조 |

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 비밀정보 생성/추측 절대 금지. config.js의 기존 `ai` 인스턴스를 그대로 사용. Imagen 모델명은 `'imagen-4.0-generate-001'` (Vertex AI 공식).
- **헌법 4조 2항**: `rm -rf`, `git push --force` 등 파괴적 명령 금지.
- **헌법 3조 1항**: 매 턴 `date`로 KST 취득.
- **ch7 1조**: 지시서 범위 외 파일 수정 금지.
- **ch5 2조**: 배포는 `deploy.sh` 경유 필수. 이 지시서는 **코드 구현만**, 배포는 별도 승인 후.
- upload.js의 `handleUpload` 패턴(sharp JPEG 변환, GCS 업로드, public:true) 재활용. 새 업로드 로직을 처음부터 쓰지 말 것.

---

## 검증 방법

1. 로컬 `node server.js` 기동
2. `/admin/blog-edit.html` 접속 → AI 탭 확인
3. AI 이미지 생성 → 프리뷰 → 본문 삽입 → 에디터에 이미지 표시 확인
4. OG 썸네일 생성 → 1200×630 확인 → 썸네일 적용
5. SEO 제안 → summary/tags 필드 자동 채움 확인
6. 발행 시 ogImage 필드 자동 생성 + render.js og:image 메타태그 확인

---

## 납품

- COMPLETION 보고서: `monkos-ops/ops/completions/2026-06/COMPLETION_20260608_막내3_블로그에디터_AI이미지+썸네일_Phase1.md`
- 완료 후 `✅❌💡⏳📁🔀` 형식 보고.
