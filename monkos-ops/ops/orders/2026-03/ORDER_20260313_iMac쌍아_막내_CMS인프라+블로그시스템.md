---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내
status: pending
priority: P0
---

# 지시서: CMS 인프라 + 블로그 시스템 구축

## 배경

MONKOS 포털(monkos.ai)의 SEO 콘텐츠가 사실상 0이다.
- 크롤 가능 페이지: 랜딩 1장 + 약관 4장 = 5페이지
- 블로그, FAQ, 갤러리, 게시판 없음
- 경쟁사(증명한컷 등)에 구글 검색 순위 밀림

**목표**: monkos.ai에 콘텐츠 플랫폼(CMS)을 구축하여 SEO 허브로 전환한다.
이 지시서는 **인프라 기반 + 블로그 시스템**을 다룬다.

## 아키텍처

```
[관리자 브라우저] → /admin (카카오 로그인 + 관리자 화이트리스트)
                    ├── Toast UI Editor → 블로그 작성/편집
                    └── 이미지 드래그&드롭 → GCS 업로드
                         ↓
[monkos.ai Cloud Run]
    ├── /api/admin/*        → Firestore CRUD (관리자 전용)
    ├── /api/upload         → GCS 이미지 업로드
    ├── /blog               → SSR 목록 (구글 크롤)
    └── /blog/:slug         → SSR 상세 (구글 크롤)
```

## 작업 내용

### 1. 패키지 추가

```bash
cd portal && npm install @google-cloud/storage marked
```
- `@google-cloud/storage`: GCS 이미지 업로드
- `marked`: 마크다운 → HTML 변환 (SSR용)

### 2. `portal/lib/shared/config.js` — 환경변수 + 상수 추가

기존 환경변수 섹션(L56 부근) 아래에 추가:

```javascript
// CMS
export const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';
export const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').filter(Boolean);
```

### 3. `portal/lib/cms/admin-auth.js` — 신규 생성

관리자 인증 미들웨어. 기존 `verifyAuthToken` + `ADMIN_UIDS` 화이트리스트.

```javascript
/**
 * CMS 관리자 인증 미들웨어
 * 기존 monkos_session 쿠키 + ADMIN_UIDS 화이트리스트
 */
import { parseCookies, verifyAuthToken, ADMIN_UIDS, log } from '../shared/config.js';

export function getAdminUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.monkos_session;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  // ADMIN_UIDS 환경변수에 userId가 포함되어야 관리자
  if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(payload.userId)) return null;

  return payload; // { userId, expires }
}

export function requireAdmin(req, res) {
  const admin = getAdminUser(req);
  if (!admin) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return null;
  }
  return admin;
}
```

**중요**: `ADMIN_UIDS`가 빈 문자열이면 (미설정) → 로그인한 모든 사용자가 관리자.
프로덕션에서는 반드시 작가님 UID를 설정해야 한다.

### 4. `portal/lib/cms/upload.js` — 신규 생성

GCS 이미지 업로드 핸들러. Toast UI Editor의 이미지 업로드 훅에서 호출.

구현 요구사항:
- `POST /api/admin/upload` — multipart/form-data (이미지 파일)
- 관리자 인증 필수 (`requireAdmin`)
- GCS 버킷: `monk-ai-images`, 경로: `blog/{timestamp}_{filename}`
- 업로드 후 공개 URL 반환: `https://storage.googleapis.com/${BUCKET}/blog/...`
- 파일 크기 제한: 5MB
- 허용 MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **multipart 파싱**: 외부 라이브러리 없이 boundary 기반 직접 파싱 (순수 Node.js)

응답 형식 (Toast UI Editor 호환):
```json
{ "url": "https://storage.googleapis.com/monk-ai-images/blog/1710000000_photo.webp" }
```

### 5. `portal/lib/cms/blog.js` — 신규 생성

블로그 CRUD API 핸들러.

#### Firestore 스키마 (`blog_posts/{slug}`)

```
{
  slug: string,          // URL 경로 (예: "passport-photo-guide")
  title: string,         // 제목
  content: string,       // 마크다운 본문
  summary: string,       // 요약 (meta description용, 160자 이내)
  thumbnail: string,     // 썸네일 GCS URL
  tags: string[],        // 태그 배열
  lang: string,          // 'ko' | 'ja' | 'en'
  published: boolean,    // 발행 여부
  author: string,        // 작성자명
  createdAt: string,     // ISO 8601
  updatedAt: string,     // ISO 8601
  viewCount: number,     // 조회수
}
```

#### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/blog` | 목록 (drafts 포함, 관리자 전용) |
| `GET` | `/api/admin/blog/:slug` | 상세 (마크다운 원문, 관리자 전용) |
| `POST` | `/api/admin/blog` | 생성 (관리자 전용) |
| `PUT` | `/api/admin/blog/:slug` | 수정 (관리자 전용) |
| `DELETE` | `/api/admin/blog/:slug` | 삭제 (관리자 전용) |

- 모든 관리자 API는 `requireAdmin` 검증
- slug 자동 생성: 제목에서 한글은 유지, 특수문자 제거, 공백→하이픈
- 생성/수정 시 `updatedAt` 자동 갱신

### 6. `portal/lib/cms/render.js` — 신규 생성

SSR 렌더링 엔진. Firestore 데이터 → HTML 페이지 생성.

구현 요구사항:
- `marked` 라이브러리로 마크다운 → HTML 변환
- 공통 레이아웃 (head/nav/footer) 포함
- **블로그 목록 페이지** (`/blog`):
  - 발행된 글만 표시 (`published: true`)
  - lang별 필터 가능 (`/blog?lang=ko`)
  - 썸네일 + 제목 + 요약 + 날짜 카드 레이아웃
  - 페이지네이션 (10개씩)
- **블로그 상세 페이지** (`/blog/:slug`):
  - 마크다운 → HTML 렌더링
  - `viewCount` 증가 (비동기)
  - SEO meta 태그: title, description, og:image, og:type=article
  - JSON-LD `Article` 구조화 데이터
  - hreflang 태그 (동일 slug의 다른 lang 버전 연결)

**SEO 필수 요소** (상세 페이지):
```html
<title>{title} | MONKOS AI</title>
<meta name="description" content="{summary}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{summary}">
<meta property="og:image" content="{thumbnail}">
<meta property="og:type" content="article">
<link rel="canonical" href="https://monkos.ai/blog/{slug}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "image": "{thumbnail}",
  "author": { "@type": "Organization", "name": "MONKOS" },
  "publisher": { "@type": "Organization", "name": "MONKOS", "url": "https://monkos.ai" },
  "datePublished": "{createdAt}",
  "dateModified": "{updatedAt}",
  "description": "{summary}"
}
</script>
```

**디자인 가이드** (공개 페이지):
- 기존 monkos.ai 랜딩의 디자인 톤 유지 (다크 배경, 포인트 컬러)
- 반응형 (모바일 우선)
- 폰트: Noto Sans KR (기존과 동일)
- nav: MONKOS 로고 + Blog/FAQ/Gallery 링크
- footer: 기존 포털 footer 재사용

### 7. `portal/public/admin/` — 관리자 페이지 (3개 파일)

#### 7-A. `admin/index.html` — 대시보드

- 관리자 전용 진입점
- 카카오 로그인 버튼 (미인증 시)
- 인증 후 메뉴: 블로그 관리 / FAQ 관리 / 갤러리 관리 / 게시판 관리
- 각 메뉴 카드에 글 수 표시

#### 7-B. `admin/blog-list.html` — 블로그 목록 관리

- 글 목록 테이블 (제목, 상태, 언어, 날짜, 조회수)
- 발행/미발행 토글
- 새 글 작성 버튼
- 삭제 버튼 (확인 다이얼로그)

#### 7-C. `admin/blog-edit.html` — 블로그 편집

- **Toast UI Editor** CDN 로드:
  ```html
  <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.min.css">
  <script src="https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js"></script>
  ```
- 필드: 제목, slug(자동생성+수동편집), 요약, 태그, 언어(ko/ja/en), 썸네일
- Toast UI Editor: 마크다운 모드 기본, WYSIWYG 전환 가능
- **이미지 업로드 훅**: 에디터에 이미지 드래그&드롭/붙여넣기 → `/api/admin/upload` 호출 → URL 삽입
- 저장 버튼 (임시저장/발행)
- 미리보기 버튼

### 8. `portal/server.js` — 라우트 등록

#### (A) import 추가 (L34 부근):
```javascript
import { handleBlogList, handleBlogGet, handleBlogCreate, handleBlogUpdate, handleBlogDelete } from './lib/cms/blog.js';
import { handleUpload } from './lib/cms/upload.js';
import { renderBlogList, renderBlogPost } from './lib/cms/render.js';
```

#### (B) CMS 라우트 추가 (챗봇/코칭 라우트 아래, 정적 파일 서빙 위):

```javascript
// === CMS 관리자 API ===
if (urlPath === '/api/admin/blog' && req.method === 'GET') return handleBlogList(req, res);
if (urlPath === '/api/admin/blog' && req.method === 'POST') return handleBlogCreate(req, res);
if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'GET') return handleBlogGet(req, res);
if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'PUT') return handleBlogUpdate(req, res);
if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'DELETE') return handleBlogDelete(req, res);
if (urlPath === '/api/admin/upload' && req.method === 'POST') return handleUpload(req, res);

// === CMS 공개 페이지 (SSR) ===
if (urlPath === '/blog' && req.method === 'GET') return renderBlogList(req, res);
if (urlPath?.startsWith('/blog/') && req.method === 'GET') return renderBlogPost(req, res);
```

#### (C) 시작 로그 추가:
```javascript
log(`CMS Admin: ${ADMIN_UIDS.length > 0 ? ADMIN_UIDS.length + '명 등록' : '전체 허용(개발모드)'}`);
```

#### (D) config import에 추가:
```javascript
ADMIN_UIDS,
```

### 9. `portal/deploy.sh` — 환경변수 추가

L110의 `--update-env-vars`에 추가:
```
GCS_BUCKET=${GCS_BUCKET},ADMIN_UIDS=${ADMIN_UIDS}
```

### 10. SEO: `robots.txt` + `sitemap.xml` 업데이트

#### robots.txt — `/blog` 허용 확인 (기존 `Allow: /`이므로 자동 허용)

#### sitemap.xml — 동적 전환

기존 정적 sitemap.xml 파일 → server.js에서 동적 생성으로 전환:
- 기존 정적 URL 5개 유지
- Firestore `blog_posts` 컬렉션에서 `published: true`인 글 URL 자동 추가
- 라우트: `GET /sitemap.xml` → 동적 생성 (정적 파일 서빙보다 우선)

## ⚠️ 준수 조항
- 헌법 6조: `.env` 수정 — `GCS_BUCKET`, `ADMIN_UIDS` 추가만. 기존 값 변경 금지
- 헌법 8조: 파괴적 명령 금지
- 법률 2장: 기존 server.js 라우트 구조(if 체인) 유지. Express 전환 금지
- 법률 2장: 기존 모듈 수정 최소화. CMS 로직은 `lib/cms/` 디렉토리에 격리

## 완료 기준
- [ ] package.json — `@google-cloud/storage`, `marked` 추가
- [ ] config.js — `GCS_BUCKET`, `ADMIN_UIDS` 환경변수 추가
- [ ] lib/cms/admin-auth.js — 관리자 인증 미들웨어
- [ ] lib/cms/upload.js — GCS 이미지 업로드 핸들러
- [ ] lib/cms/blog.js — 블로그 CRUD API (5개 엔드포인트)
- [ ] lib/cms/render.js — SSR 렌더링 (목록 + 상세)
- [ ] public/admin/index.html — 관리자 대시보드
- [ ] public/admin/blog-list.html — 블로그 목록 관리
- [ ] public/admin/blog-edit.html — 블로그 편집 (Toast UI Editor)
- [ ] server.js — CMS 라우트 등록 (8개)
- [ ] deploy.sh — 환경변수 2개 추가
- [ ] sitemap.xml 동적 전환
- [ ] 커밋 (push는 작가님 승인 후)
- [ ] 완료 보고
