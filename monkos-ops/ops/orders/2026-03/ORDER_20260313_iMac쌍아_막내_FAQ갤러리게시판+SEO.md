---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내
status: pending
depends_on: ORDER_20260313_iMac쌍아_막내_CMS인프라+블로그시스템
priority: P1
---

# 지시서: FAQ + 갤러리 + 고객 게시판 + 자동번역 + SEO 자동화

## 배경

CMS 인프라 + 블로그 시스템(선행 지시서, 막내2 작업)이 완료된 상태.
이 지시서에서는 나머지 3개 판(FAQ, 갤러리, 고객 게시판)과 **블로그 자동번역**, SEO 자동화를 구축한다.

**선행 지시서에서 구축된 인프라를 재사용:**
- `lib/cms/admin-auth.js` — 관리자 인증
- `lib/cms/upload.js` — GCS 이미지 업로드
- `lib/cms/render.js` — SSR 렌더링 엔진 (여기에 추가)
- `public/admin/index.html` — 대시보드 (메뉴 추가)
- 공통 레이아웃/스타일

## 작업 내용

### 1. 블로그 자동번역 시스템

#### 1-A. `portal/lib/cms/translate.js` — 신규 생성

블로그 발행 시 Gemini Flash로 자동번역 생성.

```javascript
/**
 * 블로그 자동번역 — Gemini 2.0 Flash
 * 한국어 원본 → 일본어/영어 자동 생성
 */
import { ai, firestore, log } from '../shared/config.js';

const TRANSLATE_PROMPT = {
  ja: `あなたは韓国語→日本語の専門翻訳者です。
以下のブログ記事を自然な日本語に翻訳してください。
- マークダウン書式はそのまま維持
- 技術用語は適切な日本語表現に
- SEOを意識した自然な文体
- タイトルと本文を両方翻訳`,

  en: `You are a professional Korean→English translator.
Translate the following blog post into natural English.
- Keep markdown formatting intact
- Use appropriate English technical terms
- Write in an SEO-friendly, natural tone
- Translate both title and body`,
};

export async function translateAndSaveBlogPost(slug, originalDoc) {
  const targetLangs = ['ja', 'en'];
  const blogCollection = firestore.collection('blog_posts');

  for (const lang of targetLangs) {
    try {
      const prompt = `${TRANSLATE_PROMPT[lang]}

---
# ${originalDoc.title}

${originalDoc.content}
---

JSON으로 응답:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내)"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 4096,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('빈 응답');

      const translated = JSON.parse(text);
      const translatedSlug = `${slug}-${lang}`;

      await blogCollection.doc(translatedSlug).set({
        ...originalDoc,
        slug: translatedSlug,
        title: translated.title,
        content: translated.content,
        summary: translated.summary || originalDoc.summary,
        lang,
        originalSlug: slug,  // 원본 참조
        autoTranslated: true,
        updatedAt: new Date().toISOString(),
      });

      log(`[CMS] 자동번역 완료: ${slug} → ${translatedSlug} (${lang})`);
    } catch (err) {
      log(`[CMS] 자동번역 실패 (${lang}): ${err.message}`, 'ERROR');
    }
  }
}
```

#### 1-B. blog.js 연동

선행 지시서의 `lib/cms/blog.js`에서 블로그 **발행(published=true) 시** 자동번역 트리거:

- `handleBlogCreate` / `handleBlogUpdate`에서:
  - `published === true` && `lang === 'ko'` 일 때
  - `translateAndSaveBlogPost(slug, doc)` 비동기 호출 (await 불필요, 백그라운드)
- 이미 번역본이 존재하면 덮어쓰기 (재번역)
- `autoTranslated: true` 플래그로 자동/수동 구분

#### 1-C. SSR hreflang 연결

`render.js`의 블로그 상세 페이지에 hreflang 태그 추가:

```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/blog/{slug}">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/blog/{slug}-ja">
<link rel="alternate" hreflang="en" href="https://monkos.ai/blog/{slug}-en">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/{slug}">
```

#### 1-D. 관리자 번역 수동 수정

`admin/blog-edit.html`에서:
- 자동번역된 글(`autoTranslated: true`)도 편집 가능
- 블로그 목록에 `[KO]` `[JA🤖]` `[EN🤖]` 뱃지 표시 (🤖 = 자동번역)
- 수동 수정 시 `autoTranslated: false`로 변경

---

### 2. FAQ 시스템

#### 2-A. Firestore 스키마 (`faq_items/{id}`)

```
{
  id: string,            // 자동 생성
  question: string,      // 질문
  answer: string,        // 답변 (마크다운)
  category: string,      // 카테고리 (예: "결제", "촬영", "증명사진 규격")
  lang: string,          // 'ko' | 'ja' | 'en'
  order: number,         // 정렬 순서
  published: boolean,
  createdAt: string,
  updatedAt: string,
}
```

#### 2-B. `portal/lib/cms/faq.js` — 신규 생성

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/faq` | 전체 목록 (관리자) |
| `POST` | `/api/admin/faq` | FAQ 항목 추가 |
| `PUT` | `/api/admin/faq/:id` | FAQ 항목 수정 |
| `DELETE` | `/api/admin/faq/:id` | FAQ 항목 삭제 |

- FAQ도 자동번역 적용: ko로 작성 → ja/en 자동 생성 (블로그와 동일 패턴)
- 번역 대상: `question` + `answer` 필드

#### 2-C. SSR 공개 페이지 (`/faq`)

- 카테고리별 아코디언 UI
- `?lang=ko|ja|en` 쿼리 파라미터로 언어 전환
- **FAQPage JSON-LD** (구글 검색 FAQ 리치 스니펫):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer}"
      }
    }
  ]
}
</script>
```

#### 2-D. 관리자 페이지 (`public/admin/faq.html`)

- FAQ 항목 목록 테이블
- 인라인 편집 또는 모달 편집 (질문/답변/카테고리/순서)
- 드래그앤드롭 순서 변경 (선택사항, 없으면 숫자 입력)
- 카테고리 필터

---

### 3. 갤러리 시스템

#### 3-A. Firestore 스키마 (`gallery_items/{id}`)

```
{
  id: string,
  imageUrl: string,      // GCS URL
  caption: string,       // 캡션 (alt 태그에도 사용)
  category: string,      // "여권", "이력서", "면허증", "프로필" 등
  lang: string,          // 'ko' | 'ja' | 'en'
  order: number,
  published: boolean,
  createdAt: string,
}
```

#### 3-B. `portal/lib/cms/gallery.js` — 신규 생성

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/gallery` | 전체 목록 (관리자) |
| `POST` | `/api/admin/gallery` | 갤러리 항목 추가 (이미지 URL + 메타) |
| `PUT` | `/api/admin/gallery/:id` | 항목 수정 |
| `DELETE` | `/api/admin/gallery/:id` | 항목 삭제 |

#### 3-C. SSR 공개 페이지 (`/gallery`)

- 카테고리 탭 필터
- 반응형 그리드 레이아웃 (masonry 또는 균등 그리드)
- 이미지 클릭 → lightbox (모달 확대)
- 각 이미지에 `alt` 태그 (caption 사용) — 구글 이미지 검색 SEO
- `loading="lazy"` 속성

#### 3-D. 관리자 페이지 (`public/admin/gallery.html`)

- 이미지 업로드 (기존 `/api/admin/upload` 재사용)
- 썸네일 그리드 뷰
- 캡션/카테고리 인라인 편집
- 발행/비공개 토글
- 삭제

---

### 4. 고객 게시판

#### 4-A. Firestore 스키마 (`board_posts/{id}`)

```
{
  id: string,
  author: string,        // 닉네임 (비회원도 작성 가능)
  title: string,
  content: string,       // 일반 텍스트 (마크다운 X)
  password: string,      // 비밀번호 해시 (비회원 수정/삭제용)
  category: string,      // "후기", "문의", "건의"
  lang: string,
  published: boolean,    // 관리자 비공개 처리용
  replies: [             // 관리자 답글
    { text: string, createdAt: string }
  ],
  createdAt: string,
  updatedAt: string,
}
```

#### 4-B. `portal/lib/cms/board.js` — 신규 생성

**공개 API** (인증 불요):

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/board` | 목록 (페이지네이션) |
| `GET` | `/api/board/:id` | 상세 |
| `POST` | `/api/board` | 글 작성 (닉네임 + 비밀번호) |
| `DELETE` | `/api/board/:id` | 삭제 (비밀번호 검증) |

**관리자 API**:

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/board` | 전체 목록 (비공개 포함) |
| `POST` | `/api/admin/board/:id/reply` | 답글 작성 |
| `DELETE` | `/api/admin/board/:id` | 강제 삭제 |
| `PUT` | `/api/admin/board/:id/toggle` | 공개/비공개 토글 |

- 비밀번호: `createHmac('sha256', ...)` 해시 저장
- XSS 방지: 콘텐츠 HTML 이스케이프 필수
- 스팸 방지: 같은 IP에서 1분 내 중복 작성 차단 (인메모리)

#### 4-C. SSR 공개 페이지

- `/board` — 게시판 목록 (제목, 작성자, 날짜, 답변여부 뱃지)
- `/board/:id` — 게시글 상세 + 관리자 답글
- `/board/write` — 글쓰기 폼 (닉네임, 비밀번호, 제목, 내용, 카테고리)
- 페이지네이션 (20개씩)

#### 4-D. 관리자 페이지 (`public/admin/board.html`)

- 전체 게시글 목록 (미답변 우선 정렬)
- 답글 작성 인라인 폼
- 비공개 처리 / 삭제 버튼

---

### 5. SEO 자동화

#### 5-A. 동적 sitemap.xml 확장

선행 지시서(막내2)에서 블로그 URL을 동적 추가했으므로, `render.js`의 `renderSitemap`에 추가:

```xml
<!-- FAQ 페이지 -->
<url>
  <loc>https://monkos.ai/faq</loc>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>

<!-- 갤러리 -->
<url>
  <loc>https://monkos.ai/gallery</loc>
  <changefreq>weekly</changefreq>
  <priority>0.6</priority>
</url>

<!-- 게시판 -->
<url>
  <loc>https://monkos.ai/board</loc>
  <changefreq>daily</changefreq>
  <priority>0.5</priority>
</url>
```

- 번역 블로그 URL도 sitemap에 포함 (`/blog/{slug}-ja`, `/blog/{slug}-en`)

#### 5-B. robots.txt 업데이트

기존 정적 `public/robots.txt` 수정:

```
User-agent: *
Allow: /
Allow: /blog
Allow: /faq
Allow: /gallery
Allow: /board
Disallow: /admin
Disallow: /api/
Sitemap: https://monkos.ai/sitemap.xml
```

#### 5-C. 공개 페이지 공통 SEO

모든 SSR 페이지에:
- `<link rel="canonical" href="...">` 태그
- Open Graph 메타 태그 (og:title, og:description, og:image)
- 구조화 데이터 (각 페이지 유형에 맞는 JSON-LD)
- hreflang 태그 (다국어 페이지)

---

### 6. server.js 라우트 등록

막내2가 등록한 CMS 라우트 아래에 추가:

```javascript
// === FAQ ===
if (urlPath === '/api/admin/faq' && req.method === 'GET') return handleFaqList(req, res);
if (urlPath === '/api/admin/faq' && req.method === 'POST') return handleFaqCreate(req, res);
if (urlPath?.startsWith('/api/admin/faq/') && req.method === 'PUT') return handleFaqUpdate(req, res);
if (urlPath?.startsWith('/api/admin/faq/') && req.method === 'DELETE') return handleFaqDelete(req, res);
if (urlPath === '/faq' && req.method === 'GET') return renderFaq(req, res);

// === 갤러리 ===
if (urlPath === '/api/admin/gallery' && req.method === 'GET') return handleGalleryList(req, res);
if (urlPath === '/api/admin/gallery' && req.method === 'POST') return handleGalleryCreate(req, res);
if (urlPath?.startsWith('/api/admin/gallery/') && req.method === 'PUT') return handleGalleryUpdate(req, res);
if (urlPath?.startsWith('/api/admin/gallery/') && req.method === 'DELETE') return handleGalleryDelete(req, res);
if (urlPath === '/gallery' && req.method === 'GET') return renderGallery(req, res);

// === 게시판 ===
if (urlPath === '/api/board' && req.method === 'GET') return handleBoardPublicList(req, res);
if (urlPath === '/api/board' && req.method === 'POST') return handleBoardPublicCreate(req, res);
if (urlPath?.startsWith('/api/board/') && req.method === 'GET') return handleBoardPublicGet(req, res);
if (urlPath?.startsWith('/api/board/') && req.method === 'DELETE') return handleBoardPublicDelete(req, res);
if (urlPath === '/api/admin/board' && req.method === 'GET') return handleBoardAdminList(req, res);
if (urlPath?.startsWith('/api/admin/board/') && urlPath?.endsWith('/reply') && req.method === 'POST') return handleBoardAdminReply(req, res);
if (urlPath?.startsWith('/api/admin/board/') && urlPath?.endsWith('/toggle') && req.method === 'PUT') return handleBoardAdminToggle(req, res);
if (urlPath?.startsWith('/api/admin/board/') && req.method === 'DELETE') return handleBoardAdminDelete(req, res);
if (urlPath === '/board' && req.method === 'GET') return renderBoardList(req, res);
if (urlPath === '/board/write' && req.method === 'GET') return renderBoardWrite(req, res);
if (urlPath?.startsWith('/board/') && req.method === 'GET') return renderBoardPost(req, res);
```

### 7. 대시보드 업데이트

`public/admin/index.html`에 FAQ/갤러리/게시판 메뉴 카드 추가 (블로그와 동일 패턴).

## ⚠️ 준수 조항
- 헌법 6조: 기존 환경변수 변경 금지
- 헌법 8조: 파괴적 명령 금지
- 헌법 11조: 고객 게시판 — XSS/인젝션 방지 필수
- 법률 2장: `lib/cms/` 디렉토리에 격리. 기존 모듈 수정 최소화

## 완료 기준
- [ ] lib/cms/translate.js — 자동번역 모듈 (Gemini Flash, ko→ja/en)
- [ ] blog.js 연동 — 발행 시 자동번역 트리거
- [ ] render.js — hreflang 태그 + 번역 블로그 SSR
- [ ] admin/blog-edit.html — 번역 뱃지 + 수동 수정
- [ ] lib/cms/faq.js — FAQ CRUD API (4개 엔드포인트)
- [ ] lib/cms/gallery.js — 갤러리 CRUD API (4개 엔드포인트)
- [ ] lib/cms/board.js — 게시판 API (공개 4 + 관리자 4 = 8개)
- [ ] render.js 확장 — FAQ/갤러리/게시판 SSR 추가
- [ ] public/admin/faq.html — FAQ 관리 페이지
- [ ] public/admin/gallery.html — 갤러리 관리 페이지
- [ ] public/admin/board.html — 게시판 관리 페이지
- [ ] server.js — 라우트 등록 (약 20개)
- [ ] robots.txt 업데이트
- [ ] sitemap.xml 확장 (번역 URL 포함)
- [ ] admin/index.html 대시보드 메뉴 추가
- [ ] 커밋 (push는 작가님 승인 후)
- [ ] 완료 보고
