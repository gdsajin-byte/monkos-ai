---
type: REPORT
id: REPORT_20260323_board컬렉션_전수조사
date: 2026-03-23
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260323_board컬렉션_전수조사
status: 완료
---

# 보고서: board vs board_posts 컬렉션 전수 조사

## A. 코드 참조 전수 목록

### `board_posts` 컬렉션 (정상 경로)

| # | 파일 | 줄 | 컬렉션 | 쿼리/동작 | 사용 필드 |
|---|------|-----|--------|-----------|-----------|
| 1 | `lib/cms/board.js` | 9 | `board_posts` | `firestore.collection('board_posts')` (전역 변수 선언) | — |
| 2 | `lib/cms/board.js` | 49 | `board_posts` | `.where('published','==',true).orderBy('createdAt','desc')` | published, createdAt, author, title, category, replies |
| 3 | `lib/cms/board.js` | 51 | `board_posts` | `.where('published','==',true).where('category','==',category).orderBy('createdAt','desc')` | (동일) |
| 4 | `lib/cms/board.js` | 88 | `board_posts` | `.doc(id).get()` | published, author, title, content, category, replies, createdAt |
| 5 | `lib/cms/board.js` | 137-151 | `board_posts` | `.doc().set(post)` | author, title, content, password, category, lang, published, replies, createdAt, updatedAt |
| 6 | `lib/cms/board.js` | 179-190 | `board_posts` | `.doc(id).get()` → `.doc(id).delete()` | password |
| 7 | `lib/cms/board.js` | 210 | `board_posts` | `.orderBy('createdAt','desc').get()` | author, title, category, published, replies, createdAt |
| 8 | `lib/cms/board.js` | 246-261 | `board_posts` | `.doc(id).get()` → `.doc(id).update({replies, updatedAt})` | replies, updatedAt |
| 9 | `lib/cms/board.js` | 285-291 | `board_posts` | `.doc(id).get()` → `.doc(id).delete()` | — |
| 10 | `lib/cms/board.js` | 316-323 | `board_posts` | `.doc(id).get()` → `.doc(id).update({published, updatedAt})` | published, updatedAt |
| 11 | `lib/cms/render.js` | 15 | `board_posts` | `firestore.collection('board_posts')` (전역 변수 선언) | — |
| 12 | `lib/cms/render.js` | 802 | `board_posts` | `.where('published','==',true).orderBy('createdAt','desc').get()` | author, title, category, replies, createdAt |
| 13 | `lib/cms/render.js` | 906 | `board_posts` | `.doc(id).get()` | published, title, content, author, category, replies, createdAt |

### `board` 컬렉션 (문제 지점)

| # | 파일 | 줄 | 컬렉션 | 쿼리/동작 | 사용 필드 |
|---|------|-----|--------|-----------|-----------|
| 14 | **`lib/cms/home.js`** | **160** | **`board`** | `.where('answered','==',true).orderBy('createdAt','desc').limit(5)` | **answered**, title, createdAt |

### 클라이언트/라우트 참조 (Firestore 직접 접근 없음)

| # | 파일 | 줄 | 내용 |
|---|------|-----|------|
| 15 | `server.js` | 41 | board.js 핸들러 import |
| 16 | `server.js` | 200-209 | `/api/board`, `/api/admin/board` 라우트 매핑 |
| 17 | `server.js` | 243-245 | `/board` SSR 라우트 매핑 |
| 18 | `public/admin/board.html` | 112 | `const API = '/api/admin/board'` (REST API 호출) |
| 19 | `public/admin/index.html` | 167 | `fetch('/api/admin/board')` (대시보드 카운트) |
| 20 | `public/index.html` | 226-227 | 홈 게시판 프리뷰 HTML 템플릿 |
| 21 | `public/js/i18n.js` | 230-232, 284 | 다국어 네비게이션 `/board` 경로 |

---

## B. 스키마 비교

| 필드 | `board` (home.js) | `board_posts` (board.js, render.js) | 비고 |
|------|:-----------------:|:-----------------------------------:|------|
| title | **읽기** | 읽기/쓰기 | 동일 용도 |
| content | — | 읽기/쓰기 | board에서는 미사용 (프리뷰라서) |
| author | — | 읽기/쓰기 | board에서는 미사용 |
| category | — | 읽기/쓰기 | board에서는 미사용 |
| password | — | 쓰기/검증 | board에서는 미사용 |
| lang | — | 쓰기 | board에서는 미사용 |
| published | — | 읽기/쓰기 | **board에서는 미사용** (where 조건 없음) |
| **answered** | **읽기 (where 조건)** | **존재하지 않음** | **핵심 불일치** |
| replies | — | 읽기/쓰기 (배열) | board_posts는 `replies.length > 0`으로 답변 판단 |
| createdAt | **읽기** | 읽기/쓰기 | 동일 용도 |
| updatedAt | — | 쓰기 | board에서는 미사용 |

### 핵심 불일치

- **`board_posts`**: 답변 여부를 `replies` 배열 존재(`Array.isArray(d.replies) && d.replies.length > 0`)로 판단
- **`board`** (home.js): 답변 여부를 `answered` boolean 필드(`where('answered','==',true)`)로 판단
- **`published` 필터 누락**: home.js의 `board` 쿼리는 `published` 조건 없음 → 비공개 글도 프리뷰에 노출 가능

---

## C. 판정

### **3번: 마이그레이션 잔재 (버그)**

**근거:**

1. **컬렉션명 불일치**: 전체 코드베이스에서 `board_posts`를 사용하는데, `home.js:160`만 유일하게 `board`를 참조
2. **스키마 불일치**: `board_posts`에는 `answered` 필드가 존재하지 않고 `replies` 배열로 답변을 관리함. `board` 컬렉션의 `answered` boolean은 구(舊) 스키마
3. **home.js 초기화 패턴**: home.js 상단(line 15-17)에서 `blog_posts`, `gallery_items`, `site_config`는 전역 변수로 선언하지만, board 컬렉션은 선언하지 않음 → line 160에서 인라인으로 `firestore.collection('board')` 직접 호출 → 다른 컬렉션과 달리 리팩토링 시 누락된 흔적
4. **`published` 필터 누락**: board.js와 render.js는 모두 `.where('published','==',true)`를 사용하지만, home.js의 board 쿼리는 이 필터가 없음 → 구(舊) 코드가 그대로 남은 증거

**결론**: 게시판 CRUD가 `board_posts` 컬렉션으로 마이그레이션된 이후, 홈 SSR의 프리뷰 쿼리만 구(舊) `board` 컬렉션을 가리키고 있는 상태. 현재 `board` 컬렉션에 데이터가 없으면 홈 게시판 프리뷰가 항상 빈 상태이고, `.catch(() => ({ docs: [] }))`로 에러를 무시하고 있어 발견이 늦어진 것으로 추정.

---

## D. 수정 방안

### 통일 방향: `board_posts`로 통일

`board` 컬렉션은 코드베이스 전체에서 home.js:160 한 곳만 참조. `board_posts`가 실제 데이터가 있는 정식 컬렉션.

### 수정 대상

| 파일 | 줄 | 현재 코드 | 수정 내용 |
|------|-----|-----------|-----------|
| `lib/cms/home.js` | 160 | `firestore.collection('board')` | → `firestore.collection('board_posts')` |
| `lib/cms/home.js` | 161 | `.where('answered', '==', true)` | → `.where('published', '==', true)` 추가 + 답변 판단 로직 변경 |

### 상세 수정 설계

**현재 (home.js:160-165)**:
```js
const boardSnap = await firestore.collection('board')
  .where('answered', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get()
  .catch(() => ({ docs: [] }));
```

**수정안**:
```js
const boardSnap = await firestore.collection('board_posts')
  .where('published', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get()
  .catch(() => ({ docs: [] }));
```

**추가 수정 — 프리뷰 HTML 생성 (home.js:168-170)**:
- 현재 모든 결과에 "답변완료" 배지를 붙이는데, `board_posts`에서는 `replies` 배열로 판단해야 함
- `answered` 필터를 제거하고, 답변 여부는 `replies` 배열 길이로 표시하거나, 프리뷰는 최근 글만 보여주는 방식으로 변경

### 영향 범위

| 영역 | 영향 |
|------|------|
| **홈 SSR** | 프리뷰가 실제 `board_posts` 데이터를 표시하게 됨 (현재는 빈 상태 추정) |
| **게시판 CRUD** | 변경 없음 |
| **어드민** | 변경 없음 |
| **API** | 변경 없음 |
| **Firestore 인덱스** | `board_posts`에 `published + createdAt` 복합 인덱스 필요 여부 확인 필요 (이미 board.js에서 동일 쿼리 사용 중이므로 존재할 가능성 높음) |

---

## 보고 완료

- 조사 시각: 2026-03-23 12:24~12:25 KST
- 수정 대상: `lib/cms/home.js` 1개 파일, 160~170 라인 부근
- 위험도: 낮음 (홈 프리뷰 영역만 해당, CRUD/SSR 정상)
