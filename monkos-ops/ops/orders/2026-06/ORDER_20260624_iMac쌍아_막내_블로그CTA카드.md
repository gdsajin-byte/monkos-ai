---
type: order
date: 2026-06-24
from: iMac/쌍아
to: 막내
portfolio: PF_PORTAL
status: 대기
---

# 블로그 CTA 카드 — 에디터 연동 + SSR 렌더링

> **[2026-06-24 14:16 KST]** iMac/쌍아 → 막내
> 배경: 블로그 50+편 중 CTA 삽입 2편뿐. 시타델 구조에서 성벽(블로그)→킵(서비스) 전환 경로 부재. 블로그 에디터에서 CTA 카드를 설정하고, 발행 시 본문 하단에 OG 카드형 CTA를 자동 삽입한다.

---

## 1. 전역 기본 CTA 설정 (Firestore)

**컬렉션**: `blog_settings` → 문서 `cta_default`

```json
{
  "enabled": true,
  "image": "https://storage.googleapis.com/.../cta-default.png",
  "title": { "ko": "AI 증명사진, 셀카 한 장이면 끝", "en": "AI ID Photo — One Selfie Is All You Need", "ja": "AI証明写真、セルフィー1枚で完了" },
  "description": { "ko": "여권·비자·이력서 — 200+ 규격 자동 적용", "en": "Passport · Visa · Resume — 200+ specs auto-applied", "ja": "パスポート·ビザ·履歴書 — 200+規格自動適用" },
  "buttonText": { "ko": "증명사진 만들기 →", "en": "Create ID Photo →", "ja": "証明写真を作る →" },
  "link": { "ko": "https://idphoto-kr.monkos.ai/", "en": "/en/headshot", "ja": "https://idphoto-jp.monkos.ai/" }
}
```

- 어드민에서 한 번 세팅하면 전체 블로그에 적용
- 글별 오버라이드가 없으면 이 기본값 사용

---

## 2. 글별 오버라이드 (Firestore blog_posts 필드 추가)

`blog_posts` 문서에 옵션 필드 추가:

```json
{
  "ctaEnabled": true,
  "ctaImage": "",
  "ctaTitle": "",
  "ctaDescription": "",
  "ctaButtonText": "",
  "ctaLink": ""
}
```

- `ctaEnabled: false` → 해당 글에서 CTA 비노출
- `ctaImage` 등이 비어있으면 → 전역 기본값 사용
- 값이 있으면 → 글별 오버라이드

---

## 3. 블로그 에디터 UI (blog-edit.html)

왼쪽 사이드바의 `previewCard` 섹션 아래에 추가:

```html
<div class="sidebar-section">
  <label>CTA 카드</label>
  <div class="pinned-row">
    <input type="checkbox" id="ctaEnabled" checked>
    <label for="ctaEnabled">하단 CTA 표시</label>
  </div>
  <input type="text" id="ctaImage" placeholder="이미지 URL (비우면 기본값)">
  <input type="text" id="ctaTitle" placeholder="타이틀 (비우면 기본값)">
  <input type="text" id="ctaLink" placeholder="링크 URL (비우면 기본값)">
</div>
```

- 저장/수정 시 `ctaEnabled`, `ctaImage`, `ctaTitle`, `ctaLink` 필드를 Firestore에 함께 저장
- 불러올 때 기존 값 복원
- `blog-editor.js`의 `save()` / `loadPost()` 함수에 필드 추가

---

## 4. SSR 렌더링 (render-blog.js)

`blogPostFragment` 함수에서 본문 HTML(`contentHtml`) 아래에 CTA 카드 삽입:

### 4-a. 데이터 조회

```js
const ctaDefault = await firestore.collection('blog_settings').doc('cta_default').get();
const ctaConfig = ctaDefault.exists ? ctaDefault.data() : null;
```

### 4-b. 글별 오버라이드 병합

```js
const ctaEnabled = post.ctaEnabled !== false;
if (ctaEnabled && ctaConfig?.enabled) {
  const img = post.ctaImage || ctaConfig.image;
  const title = post.ctaTitle || ctaConfig.title?.[htmlLang] || ctaConfig.title?.ko;
  const desc = post.ctaDescription || ctaConfig.description?.[htmlLang] || ctaConfig.description?.ko;
  const btn = post.ctaButtonText || ctaConfig.buttonText?.[htmlLang] || ctaConfig.buttonText?.ko;
  const link = post.ctaLink || ctaConfig.link?.[htmlLang] || ctaConfig.link?.ko;
  // CTA HTML 삽입
}
```

### 4-c. CTA 카드 HTML

```html
<div class="blog-cta-card">
  <a href="{link}" class="blog-cta-link">
    <div class="blog-cta-image" style="background-image:url('{image}')"></div>
    <div class="blog-cta-body">
      <div class="blog-cta-title">{title}</div>
      <p class="blog-cta-desc">{description}</p>
      <span class="blog-cta-btn">{buttonText}</span>
    </div>
  </a>
</div>
```

### 4-d. CSS (render-blog.js pageStyle에 추가)

```css
.blog-cta-card { margin: 32px 0; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--surface); }
.blog-cta-link { display: flex; text-decoration: none; color: inherit; }
.blog-cta-image { width: 200px; min-height: 120px; background-size: cover; background-position: center; flex-shrink: 0; }
.blog-cta-body { padding: 20px; display: flex; flex-direction: column; justify-content: center; }
.blog-cta-title { font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.blog-cta-desc { font-size: 14px; color: var(--text-dim); margin: 0 0 12px; }
.blog-cta-btn { display: inline-block; background: #6C4FFF; color: #fff; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; }
@media (max-width: 600px) {
  .blog-cta-link { flex-direction: column; }
  .blog-cta-image { width: 100%; aspect-ratio: 1200/630; }
}
```

---

## 5. 어드민 API 보강

`blog.js`의 POST/PUT 핸들러에서 `ctaEnabled`, `ctaImage`, `ctaTitle`, `ctaDescription`, `ctaButtonText`, `ctaLink` 필드를 `allowedFields`에 추가.

---

## 6. 전역 기본값 초기 세팅

배포 후 어드민에서 `blog_settings/cta_default` 문서를 생성한다. 또는 deploy 스크립트에 seed 데이터로 포함.

초기 이미지는 작가님이 지정할 때까지 placeholder로 두고, `ctaConfig.enabled = false`로 시작. 작가님이 어드민에서 이미지 업로드 + enabled 켜면 전체 활성화.

---

## ⚠️ 준수 조항

- 배포는 `deploy.sh` 경유 필수 (ch5 2조)
- CTA 카드의 외부 링크에 `rel="noopener"` 추가
- Firestore 직접 접근 금지 — 어드민 API 경유 (ch4 10조)
- 기존 blog 렌더링 깨뜨리지 않을 것 — `ctaConfig` 조회 실패 시 CTA 미삽입 (silent skip)

## 완료 기준

- [ ] 전역 CTA 설정 Firestore 구조
- [ ] 에디터 사이드바 CTA 섹션 UI
- [ ] 저장/불러오기 연동
- [ ] SSR 렌더링 CTA 카드 삽입
- [ ] 모바일 반응형
- [ ] 기존 수동 CTA (vol38-ai-kr, ai-kr) 와 중복되지 않도록 처리
- [ ] 완료 보고 (헌법 3조 2항)
