---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 에디터 렉 수정 — change 이벤트 debounce

> **[2026-03-22 13:55 KST] iMac/쌍아 → 막내1**

## 증상

에디터 타이핑 시 심한 렉 발생.

## 원인

`blog-image.js:283`의 `editor.on('change', ...)` 콜백이 매 키입력마다:
1. `querySelectorAll('img')` 전수 탐색
2. img 이벤트 리스너 체크
3. `markThumbnailInEditor()`에서 또 img 전수 탐색

## 수정

### blog-image.js — change 콜백에 debounce 적용

모듈 상단(flag 선언부 근처, 6행 부근)에 debounce 타이머 변수 추가:

```javascript
let _changeDebounceTimer = null;
```

283행의 `editor.on('change', ...)` 콜백을 debounce로 감싸기:

**현재 (283~296행):**
```javascript
  editor.on('change', () => {
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
  });
```

**변경:**
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

500ms debounce — 타이핑 중엔 실행 안 되고, 입력 멈추면 0.5초 후 1회만 실행.

## 수정 2: 이미지 뱅크 컨테이너 높이 제한 + 내부 스크롤

현재 `#imageLibrary`에 높이 제약이 없어서 이미지가 많으면 하단으로 무한 늘어남.
4행×5열 정도 보이고 나머지는 스크롤로 찾아오는 구조가 맞음.

### blog-editor.css — `#imageLibrary` 스타일 추가

`.img-lib-grid` 정의 바로 위(179행 부근)에 추가:

```css
#imageLibrary {
  max-height: 360px;
  overflow-y: auto;
}
```

360px ≈ 썸네일 4행분 (각 ~80px + gap). 5열은 `.img-lib-grid`의 `repeat(4, 1fr)`을 `repeat(5, 1fr)`로 변경:

### blog-editor.css:182

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
git add monkos_AI/portal/public/admin/js/blog-image.js monkos_AI/portal/public/admin/css/blog-editor.css
git commit -m "[fix] 에디터 렉 해소 + 이미지뱅크 스크롤 컨테이너 — debounce + max-height + 5열"
```

캐시 버스팅: `?v=20260322f` → `?v=20260322g`

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

1. monkos.ai/admin/blog-edit.html 하드 리프레시
2. 에디터에 빠르게 타이핑 — 렉 없어야 함
3. 이미지 삽입 후 클릭 → 플로팅 툴바 정상 표시되어야 함

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수
