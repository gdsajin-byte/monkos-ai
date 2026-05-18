---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-19
priority: normal
project: SPREAD
scope: Phase 1 — 공유 버튼 (공개 페이지 + 어드민)
---

# ORDER_20260319 — 에디터 워크스테이션 Phase 1: 공유 버튼

**[2026-03-19 16:16 KST] iMac/쌍아 → iMac/막내**

## 배경

블로그 공개 페이지와 어드민 에디터에 SNS 공유 버튼을 추가한다.
note.com과 동일한 Intent URL 방식 — API 불필요, 코드 최소.

## 참조

- 블로그 렌더링: `monkos_AI/portal/lib/cms/render.js`
- 어드민 에디터: `monkos_AI/portal/public/admin/blog-edit.html`
- 서버 라우팅: `monkos_AI/portal/server.js`
- OG 메타태그: 이미 적용됨 (render.js 내 blogPostFragment)

---

## Task 1: 블로그 공개 페이지 — 글 하단 공유 버튼

`render.js`의 `blogPostFragment()` 반환 HTML에 공유 버튼 영역 추가.

**위치**: 블로그 글 본문 하단, CTA 위

**버튼 4개**:

```html
<div class="share-buttons">
  <span class="share-label">공유하기</span>
  <a href="https://twitter.com/intent/tweet?text={title}&url={pageUrl}"
     target="_blank" rel="noopener" class="share-btn share-x" title="X에 공유">𝕏</a>
  <a href="https://social-plugins.line.me/lineit/share?url={pageUrl}"
     target="_blank" rel="noopener" class="share-btn share-line" title="LINE 공유">LINE</a>
  <a href="https://story.kakao.com/share?url={pageUrl}"
     target="_blank" rel="noopener" class="share-btn share-kakao" title="카카오 공유">💬</a>
  <button class="share-btn share-copy" onclick="navigator.clipboard.writeText('{pageUrl}');this.textContent='✓'" title="링크 복사">🔗</button>
</div>
```

**스타일**: 기존 다크 테마(var(--card-bg), var(--accent)) 준수. 버튼은 원형 또는 둥근 사각, 호버 시 accent 컬러.

**다국어 대응**:
- `lang=ko` → "공유하기"
- `lang=en` → "Share"
- `lang=ja` → "シェア"

**{title}과 {pageUrl}**: 렌더링 시점에 서버에서 삽입. URL은 `https://monkos.ai/blog/{slug}` (언어별: `/en/blog/{slug}`, `/ja/blog/{slug}`)

---

## Task 2: 어드민 에디터 — 하단 공유 버튼

`blog-edit.html` 하단 영역 (Markdown/WYSIWYG 토글 옆)에 공유 버튼 추가.

**조건**:
- **발행된 글(published=true)에서만 활성화**
- 신규 글 작성 시 / 미발행 시 → 버튼 비활성(회색, 클릭 불가)
- 발행 후 slug가 확정되면 URL 자동 생성

**버튼**: Task 1과 동일 4개 + 추가 1개
- `[복사]` 버튼: `{제목}\n{URL}` 형태로 복사 (코웍이 가공용)

---

## Task 3: Web Share API (모바일 보강)

공개 페이지의 공유 버튼 영역에 Web Share API 지원 추가.

```javascript
// 모바일에서 navigator.share 지원 시 네이티브 공유 시트 사용
if (navigator.share) {
  // "더보기" 버튼 표시 → 클릭 시 네이티브 공유
}
```

데스크톱에서는 기존 4버튼, 모바일에서는 4버튼 + "더보기(↗)" 추가.

---

## 완료 조건

- [ ] 블로그 공개 페이지 `/blog/{slug}` 하단에 공유 버튼 4개 표시
- [ ] `/en/blog/`, `/ja/blog/` 다국어 페이지에서도 동작
- [ ] 어드민 에디터 하단에 공유 버튼 (발행 시에만 활성)
- [ ] 모바일에서 Web Share API 동작
- [ ] dev 배포 후 확인

## ⚠️ 준수 조항

- 기존 에디터 기능 훼손 금지
- 다크 테마 CSS 변수 준수
- prod 배포 하지 않는다 (dev까지만)
