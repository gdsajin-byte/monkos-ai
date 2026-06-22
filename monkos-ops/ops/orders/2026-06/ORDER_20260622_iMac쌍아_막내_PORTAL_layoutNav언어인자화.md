---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_HEADSHOT
---

# 지시서: layoutNav 언어 인자화 (P0 — 언어 분기 실버그)

## 배경
`layoutNav()`(render-shell.js:127)가 언어 인자를 안 받고 모든 링크를 무접두사(=한국어)로 하드코딩.
→ `/ja/headshot` 같은 일본어 페이지에서도 로고·네비 클릭 시 한국어 `/`로 이탈.
→ 글로벌 진입자가 내부 탐색 중 한국어로 튕기는 치명적 UX 버그.

## 작업 항목

### 1. layoutNav(lang) 언어 인자 추가

**파일**: `monkos_AI/portal/lib/cms/render-shell.js` (127행)

**현재**:
```javascript
export function layoutNav() {
  return `<header class="site-header">
  <div class="header-top">
    <a href="/" class="logo">...MONKOS</a>
    <nav class="header-nav">
      <a href="/blog">Blog</a>
      <a href="/faq">FAQ</a>
      ...
```

**변경**:
```javascript
export function layoutNav(lang = 'ko') {
  const prefix = (lang === 'ko') ? '' : `/${lang}`;
  return `<header class="site-header">
  <div class="header-top">
    <a href="${prefix}/" class="logo"><span class="logo-dot"></span>MONKOS</a>
    <nav class="header-nav">
      <a href="${prefix}/blog">Blog</a>
      <a href="${prefix}/faq">FAQ</a>
      <a href="${prefix}/gallery">Gallery</a>
      <a href="${prefix}/board">Board</a>
      <a href="${prefix}/guide">Guide</a>
      <a href="${prefix}/pricing">Pricing</a>
    </nav>
  </div>
</header>`;
}
```

### 2. layoutShell에 lang 전달

**같은 파일** (154행), `layoutShell`이 내부에서 `layoutNav()`를 호출하는데, `htmlLang` 인자를 전달해야 함:

```javascript
// 변경 전
${layoutNav()}

// 변경 후
${layoutNav(htmlLang || 'ko')}
```

### 3. 직접 호출처 lang 전달 (6곳)

`layoutShell` 경유가 아닌 직접 `layoutNav()` 호출처에 lang 인자 추가:

| 파일 | 행 | 변경 |
|------|-----|------|
| `render-headshot.js` | 304 | `layoutNav()` → `layoutNav(lang)` |
| `render-static.js` | 128 | `layoutNav()` → `layoutNav(lang)` — 해당 함수의 lang 변수 확인 후 전달 |
| `render-static.js` | 245 | 동일 |
| `render-pricing.js` | 259 | `layoutNav()` → `layoutNav(lang)` |
| `render-board.js` | 98 | `layoutNav()` → `layoutNav(lang || 'ko')` |

**layoutShell 경유 호출** (자동 적용 — 2항 완료 시):
- `render-blog.js` (206, 443) — `layoutShell({ htmlLang: lang, ... })` 이미 전달 중인지 확인
- `render-specs.js` (1521, 1582) — 동일 확인
- `render-board.js` (200, 311) — 동일 확인
- `render-static.js` (430, 596) — 동일 확인

→ `layoutShell` 호출 시 `htmlLang` 필드가 누락된 곳이 있으면 해당 렌더 함수의 lang 변수를 `htmlLang`으로 전달할 것.

### 4. layoutFooter도 동일 패턴 적용

`layoutFooter()`의 Terms/Privacy/Refund 링크도 prefix 적용:

```javascript
export function layoutFooter(lang = 'ko') {
  const prefix = (lang === 'ko') ? '' : `/${lang}`;
  return `<footer class="footer">
  &copy; ${new Date().getFullYear()} MONKOS. All rights reserved.
  <br><a href="${prefix}/terms.html">Terms</a> &middot; <a href="${prefix}/privacy.html">Privacy</a> &middot; <a href="${prefix}/refund.html">Refund</a>
</footer>`;
}
```

`layoutShell` 내 `layoutFooter()` 호출에도 lang 전달.

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 필수 (ch5 2조)
- 기존 한국어 페이지(prefix 없음)의 동작이 변경되지 않아야 함 (기본값 'ko' → prefix 빈 문자열)

## 검증
- [ ] `/ja/headshot` 페이지에서 로고 클릭 → `/ja/` 이동 (한국어 `/`로 안 튕김)
- [ ] `/ja/headshot` 페이지에서 Blog 클릭 → `/ja/blog` 이동
- [ ] `/en/headshot` 페이지에서 동일 검증
- [ ] `/headshot` (한국어) 페이지 — 기존과 동일하게 동작 (regression 없음)
- [ ] footer Terms/Privacy 링크도 언어 prefix 유지

## 대상 파일
1. `monkos_AI/portal/lib/cms/render-shell.js` — layoutNav, layoutFooter, layoutShell
2. `monkos_AI/portal/lib/cms/render-headshot.js` — layoutNav 호출
3. `monkos_AI/portal/lib/cms/render-static.js` — layoutNav 호출 2곳
4. `monkos_AI/portal/lib/cms/render-pricing.js` — layoutNav 호출
5. `monkos_AI/portal/lib/cms/render-board.js` — layoutNav 호출
6. 기타 layoutShell 경유 호출처 — htmlLang 전달 누락 확인 및 보정
