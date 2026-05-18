---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 삽입 렉 근본 수정 + 4열 복원

> **[2026-03-22 14:14 KST] iMac/쌍아 → 막내1**

## 증상

이미지 본문 삽입 시 렉 발생. 이전 `_suppressChange` 수정으로 해소 안 됨.

## 근본 원인

`editor.on('change')` 콜백 안에서 **에디터 DOM을 직접 수정**하면 ProseMirror가 이를 content change로 감지하여 change 이벤트 재발생 → 루프.

문제가 되는 DOM 수정 2건:
1. `img.style.cursor = 'pointer'` (blog-image.js:284)
2. `markThumbnailInEditor()` → `img.style.outline = '3px solid ...'` (blog-image.js:266)

## 수정 (3건)

### 1. blog-image.js — change 콜백에서 DOM 스타일 주입 제거

**setupImageHandlers() 내 change 콜백 전체 교체.**

현재의 change 콜백을 아래로 교체:

```javascript
  editor.on('change', () => {
    clearTimeout(_changeDebounceTimer);
    _changeDebounceTimer = setTimeout(() => {
      const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
      if (!wwContainer) return;
      wwContainer.querySelectorAll('img').forEach(img => {
        if (img.dataset.toolbarReady) return;
        img.dataset.toolbarReady = 'true';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          showEditorImageToolbar(img);
        });
      });
    }, 500);
  });
```

변경 포인트:
- `img.style.cursor = 'pointer'` **제거** → CSS로 처리 (수정 2)
- `markThumbnailInEditor()` 호출 **제거** → change에서 호출하지 않음
- `_suppressChange` 플래그 **제거** (불필요해짐)

### 2. blog-editor.css — 에디터 내 img cursor CSS 추가

`.img-delete` 정의 부근에 추가:

```css
.toastui-editor-ww-container .ProseMirror img {
  cursor: pointer;
}
```

이렇게 하면 JS에서 `img.style.cursor`를 주입하지 않아도 됨.

### 3. blog-editor.css — 5열 → 4열 복원

```css
.img-lib-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
```

(작가님 피드백: 4열이 맞음. 5열은 이미지가 너무 작음)

## markThumbnailInEditor()는 언제 호출하나

change 이벤트에서 제거하되, 아래 시점에서는 계속 호출:
- `setThumbnail()` 함수 내 (blog-image.js:255) — 썸네일 지정할 때만
- 이때는 사용자 명시 액션이므로 1회성 change는 무방

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/admin/js/blog-image.js monkos_AI/portal/public/admin/css/blog-editor.css
git commit -m "[fix] 이미지삽입 렉 근본해소 — change콜백 DOM수정 제거 + CSS cursor + 4열 복원"
```

캐시 버스팅: `?v=20260322h` → `?v=20260322i`

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

1. 하드 리프레시 후 에디터에 텍스트 타이핑 — 렉 없어야 함
2. 이미지 뱅크에서 "본문 삽입" — **삽입 되고 렉 없어야 함**
3. 이미지 뱅크 4열 그리드 확인
4. 에디터 내 이미지 클릭 → 플로팅 툴바 표시되어야 함

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수
