---
type: order
from: M1/쌍아
to: 막내(any)
date: 2026-03-16
status: pending
---

# [2026-03-16 04:46 KST] M1/쌍아 → 막내

## 지시서: 홈 갤러리 스트립 — Firestore 동적 연동

### 배경
- 현재 홈 갤러리 스트립은 `index.html`에 10장 하드코딩 → 변경 시 배포 필요
- 어드민 갤러리 CRUD API + UI는 이미 존재 (`gallery_items` 컬렉션)
- `home.js`에서 블로그/매거진/뉴스는 이미 Firestore SSR 교체 중
- **동일 패턴으로 갤러리 스트립도 교체 → 배포 없이 어드민에서 관리**

### 작업 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/lib/cms/home.js` | 갤러리 스트립 SSR 교체 로직 추가 |

### 상세 지시

#### home.js 수정

**① 상단에 galleryCollection 추가** (15행 부근, blogCollection 옆)

```javascript
const galleryCollection = firestore.collection('gallery_items');
```

**② renderHome() 함수 안에 갤러리 쿼리 추가**

기존 `Promise.all`에 갤러리 쿼리 추가:

변경 전:
```javascript
const [configSnap, postsSnap] = await Promise.all([
  siteConfigRef.get().catch(() => null),
  blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
]);
```

변경 후:
```javascript
const [configSnap, postsSnap, gallerySnap] = await Promise.all([
  siteConfigRef.get().catch(() => null),
  blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
  galleryCollection.where('published', '==', true).orderBy('order', 'asc').get().catch(() => ({ docs: [] })),
]);
```

**③ 갤러리 스트립 HTML 교체 로직 추가** (renderHome 내부, intro 교체 직전 또는 직후에 배치)

```javascript
// 6. Gallery strip (Firestore → 동적)
const galleryItems = gallerySnap.docs.map(d => d.data());
if (galleryItems.length > 0) {
  const stripHtml = galleryItems.slice(0, 12).map(item =>
    `  <div class="gi"><img class="gi-img" src="${esc(item.imageUrl)}" alt="${esc(item.caption || 'AI 증명사진')}" loading="lazy"></div>`
  ).join('\n');
  html = html.replace(
    /(<div class="gallery-track" id="gt">)\n[\s\S]*?(<\/div><\/div>\n\n<!-- Sticky Nav -->)/,
    `$1\n${stripHtml}\n</div></div>\n\n<!-- Sticky Nav -->`
  );
}
```

### 정규식 매칭 대상 (index.html 구조)

```html
<!-- Gallery Strip -->
<div class="gallery-strip"><div class="gallery-track" id="gt">
  <div class="gi"><img ...></div>    ← 이 부분이 교체됨
  ...
</div></div>

<!-- Sticky Nav -->
```

### 동작 흐름

1. 어드민 (`/admin/gallery.html`)에서 이미지 업로드 + published = true + order 설정
2. 사용자가 `monkos.ai` 접속
3. `renderHome()`이 Firestore에서 published 갤러리 아이템을 order 순으로 조회
4. `index.html` 템플릿의 하드코딩 갤러리를 Firestore 데이터로 교체
5. SSR 결과 반환 → 배포 없이 즉시 반영

### 주의사항
- 정규식이 `index.html`의 현재 구조에 맞춰져 있으므로, 갤러리 스트립 마크업 구조를 변경하지 말 것
- Firestore에 published 갤러리 아이템이 0개인 경우: 교체하지 않고 기존 하드코딩 유지 (fallback)
- `esc()` 함수는 `home.js`에 이미 존재 (26행)
- limit 12: 홈 스트립에 12개까지만 표시 (성능 + UI)

### 완료 조건

- [ ] `home.js`에 갤러리 Firestore 쿼리 + 스트립 교체 로직 추가
- [ ] 어드민에서 갤러리 이미지 published 상태 변경 시 홈에 즉시 반영 확인
- [ ] Firestore 갤러리 아이템 0개일 때 기존 하드코딩 유지 (fallback) 확인
- [ ] 커밋+push+배포
