---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: editor 초기화 순서 에러 수정

> **[2026-03-22 13:47 KST] iMac/쌍아 → 막내1**

## 증상

```
TypeError: undefined is not an object (evaluating 'editor.on')
— blog-image.js:278 (setupImageHandlers)
```

이미지 라이브러리가 전혀 로딩되지 않음 (에러로 스크립트 실행 중단).

## 원인

- `blog-image.js:3`에서 `import { editor } from './blog-editor.js'`
- `blog-editor.js:11`에서 `export let editor;` (초기값 `undefined`)
- `blog-edit.html:175`에서 `initEditor()` 호출 → `editor = new toastui.Editor(...)`
- ESM 라이브 바인딩이므로 `initEditor()` 이후 `editor`에 값이 채워져야 함
- **그러나** `setupImageHandlers()` 호출 시점에 `editor`가 여전히 `undefined`

가능한 원인: `toastui.Editor` CDN 스크립트가 `type="module"` 스크립트보다 늦게 로딩되어 `toastui` 전역 객체가 없음 → `initEditor()`에서 에러 → `editor` 할당 안 됨

## 수정 방안

`setupImageHandlers()`에 editor null 체크 추가:

### blog-image.js:278

**현재:**
```javascript
export function setupImageHandlers() {
  editor.on('change', () => {
```

**변경:**
```javascript
export function setupImageHandlers() {
  if (!editor) {
    console.warn('[blog-image] editor 미초기화 — 재시도 대기');
    setTimeout(setupImageHandlers, 200);
    return;
  }
  editor.on('change', () => {
```

## 커밋 + 재배포

```bash
git add monkos_AI/portal/public/admin/js/blog-image.js
git commit -m "[fix] blog-image editor 초기화 순서 에러 — null 체크 + 재시도"
```

캐시 버스팅 버전 갱신 (blog-edit.html):
- `?v=20260322e` → `?v=20260322f`

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

```bash
curl -s https://monkos.ai/admin/js/blog-image.js | grep "editor 미초기화"
# "editor 미초기화" 문자열이 있으면 반영 확인
```

브라우저에서 콘솔 에러 없이 이미지 라이브러리 로딩되는지 확인.

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수
