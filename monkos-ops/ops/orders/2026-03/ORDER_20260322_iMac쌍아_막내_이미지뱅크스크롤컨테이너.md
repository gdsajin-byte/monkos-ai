---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 뱅크 스크롤 컨테이너 + 5열 변경

> **[2026-03-22 14:03 KST] iMac/쌍아 → 막내1**

## 증상

이미지 뱅크가 하단으로 무한 늘어남. 4행분만 보이고 나머지는 내부 스크롤로 처리해야 함.

## 수정 (3건)

### 1. blog-image.js — markThumbnailInEditor() change 루프 차단

이미지 삽입 후 렉 발생. 원인: `editor.on('change')` → `markThumbnailInEditor()` → img에 `style.outline` 주입 → ProseMirror가 DOM 변경 감지 → change 재발생 → **무한 루프**.

**blog-image.js:282~296 (setupImageHandlers 내 change 콜백)**

**현재:**
```javascript
  editor.on('change', () => {
    clearTimeout(_changeDebounceTimer);
    _changeDebounceTimer = setTimeout(() => {
      const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
      if (!wwContainer) return;
      wwContainer.querySelectorAll('img').forEach(img => {
        if (img.dataset.toolbarReady) return;
        img.dataset.toolbarReady = 'true';
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          showEditorImageToolbar(img);
        });
      });
      markThumbnailInEditor();
    }, 500);
  });
```

**변경:**
```javascript
  let _suppressChange = false;
  editor.on('change', () => {
    if (_suppressChange) return;
    clearTimeout(_changeDebounceTimer);
    _changeDebounceTimer = setTimeout(() => {
      const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
      if (!wwContainer) return;
      wwContainer.querySelectorAll('img').forEach(img => {
        if (img.dataset.toolbarReady) return;
        img.dataset.toolbarReady = 'true';
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          showEditorImageToolbar(img);
        });
      });
      _suppressChange = true;
      markThumbnailInEditor();
      requestAnimationFrame(() => { _suppressChange = false; });
    }, 500);
  });
```

핵심: `markThumbnailInEditor()`가 DOM을 변경하기 전에 `_suppressChange = true` → 이로 인한 change 이벤트 무시 → `requestAnimationFrame` 후 해제.

### 2. blog-editor.css — `#imageLibrary` 스타일 추가

`.img-lib-grid` 정의 바로 위(179행 부근)에 추가:

```css
#imageLibrary {
  max-height: 360px;
  overflow-y: auto;
}
```

### 2. blog-editor.css — grid 4열 → 5열

**현재:**
```css
.img-lib-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
```

**변경:**
```css
.img-lib-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
```

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/admin/css/blog-editor.css monkos_AI/portal/public/admin/js/blog-image.js
git commit -m "[fix] 이미지삽입 렉 해소 + 뱅크 스크롤 컨테이너 — change루프차단 + 360px + 5열"
```

캐시 버스팅: `?v=20260322g` → `?v=20260322h` (blog-edit.html)

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수
