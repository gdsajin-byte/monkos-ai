---
type: task
from: M1/쌍아
to: 막내1
date: 2026-03-13 21:49 KST
status: open
priority: high
tags: [포털v4, Wave0, render.js, fragment, SSR]
---

# Wave 0-A: render.js SSR 렌더러 fragment 분리

## 배경

포털 v4에서 3컬럼 레이아웃 셸을 도입한다. 현재 `render.js`의 7개 렌더 함수가 각각 **전체 HTML** (`<!DOCTYPE>` ~ `</html>`)을 반환하고 있어, 3컬럼 셸의 메인 영역에 끼워넣을 수 없다.

각 렌더러를 **전체 HTML 모드**(현재, 직접 접근용)와 **fragment 모드**(셸에 삽입용) 양쪽으로 사용할 수 있도록 분리한다.

## 대상 파일

- `monkos_AI/portal/lib/cms/render.js` (952줄)

## 현재 구조

```
layoutHead(title, desc, extra, lang)  → <html><head>...</head> 반환
layoutNav()                            → <nav> 반환
layoutFooter()                         → <footer> 반환

renderBlogList(req, res, forceLang)    → layoutHead + layoutNav + 본문 + layoutFooter + </html>
renderBlogPost(req, res, lang)         → 동일 패턴
renderFaq(req, res)                    → 동일 패턴
renderGallery(req, res)                → 동일 패턴
renderBoardList(req, res)              → 동일 패턴
renderBoardPost(req, res)              → 동일 패턴
renderBoardWrite(req, res)             → 동일 패턴
renderSitemap(req, res)                → XML (변경 불필요)
```

## 목표 구조

### 1단계: 공통 레이아웃 셸 함수 신설

```javascript
/**
 * 전체 HTML 페이지를 래핑하는 셸 함수
 * v4에서 3컬럼 레이아웃으로 교체될 진입점
 */
export function layoutShell({ title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript }) {
  return `${layoutHead(title, description, seoMeta, htmlLang)}
<style>${pageStyle || ''}</style>
</head>
<body>
${layoutNav()}
<div class="container">
  ${bodyContent}
</div>
${layoutFooter()}
${pageScript ? `<script>${pageScript}</script>` : ''}
</body>
</html>`;
}
```

### 2단계: 각 렌더러를 데이터 함수 + 렌더 함수로 분리

각 렌더러를 2개 함수로 분리:

```javascript
// 데이터 조회 + fragment HTML 생성 (셸 없음)
export async function blogListFragment(req, forceLang = null) {
  // Firestore 쿼리 + HTML 생성
  // return { title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript }
}

// 기존 호출 호환 유지 (전체 HTML 반환)
export async function renderBlogList(req, res, forceLang = null) {
  try {
    const parts = await blogListFragment(req, forceLang);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 목록 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
```

### 3단계: 7개 렌더러 모두 동일 패턴 적용

| 렌더러 | fragment 함수 | 기존 함수 (호환 유지) |
|--------|--------------|---------------------|
| 블로그 목록 | `blogListFragment(req, forceLang)` | `renderBlogList(req, res, forceLang)` |
| 블로그 상세 | `blogPostFragment(req, lang)` | `renderBlogPost(req, res, lang)` |
| FAQ | `faqFragment(req)` | `renderFaq(req, res)` |
| 갤러리 | `galleryFragment(req)` | `renderGallery(req, res)` |
| 게시판 목록 | `boardListFragment(req)` | `renderBoardList(req, res)` |
| 게시판 상세 | `boardPostFragment(req)` | `renderBoardPost(req, res)` |
| 게시판 글쓰기 | `boardWriteFragment(req)` | `renderBoardWrite(req, res)` |
| 사이트맵 | 변경 없음 | `renderSitemap(req, res)` |

## 핵심 원칙

1. **기존 호출 100% 호환** — `server.js`의 라우트 코드는 한 줄도 수정하지 않는다
2. **fragment 함수는 export** — v4 셸에서 `import { blogListFragment } from './render.js'`로 사용
3. **CSS는 pageStyle로 분리** — 현재 각 렌더러에 인라인된 `<style>` 블록을 pageStyle 문자열로 추출
4. **JS는 pageScript로 분리** — 갤러리 필터, 게시판 삭제 등 인라인 `<script>` 블록을 pageScript로 추출
5. **layoutHead에서 `</head>` 제거** — pageStyle 삽입 여지 확보 (현재 layoutHead가 `</head>`를 포함하지 않으므로 이미 OK)

## 검증 방법

리팩토링 후 기존 동작 불변 확인:
- `/blog` → 블로그 목록 정상 렌더
- `/blog/:slug` → 블로그 상세 정상 렌더
- `/ja/blog` → 다국어 블로그 목록
- `/ja/blog/:slug` → 다국어 블로그 상세
- `/faq` → FAQ 아코디언
- `/gallery` → 갤러리 그리드 + 라이트박스
- `/board` → 게시판 목록
- `/board/write` → 글쓰기 폼
- `/board/:id` → 게시글 상세 + 삭제
- `/sitemap.xml` → XML 정상

## 규칙

- 브랜치: main (server.js 수정 없으므로 안전)
- 커밋: `[refactor] render.js fragment 분리 — v4 3컬럼 셸 준비`
- 금지: server.js 수정, 라우트 변경, prod 배포, .env 수정
- server.js import 라인 변경 불필요 (기존 export 이름 유지)
- 에스컬레이션: 예상 외 의존성 발견 시 `⏳ 대기` 보고

## 완료 기준

**실행+보고** — render.js 리팩토링 완료 → 커밋 → 결과 보고 후 대기 (push는 쌍아 검토 후).
