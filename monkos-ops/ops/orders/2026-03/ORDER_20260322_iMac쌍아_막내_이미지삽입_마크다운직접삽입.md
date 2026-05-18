---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 본문 삽입 수정 — 마크다운 직접 삽입 방식

> **[2026-03-22 14:39 KST] iMac/쌍아 → 막내1**

## 원인 확정

`e1556ee`에서 `showLibraryToolbar()`가 플로팅 툴바 → 확대뷰 모달로 변경됨. 확대뷰 모달(overlay)이 에디터 위에 뜨면서 에디터 포커스+커서 위치 소실. `editor.exec('addImage')`는 커서 위치가 필요하므로 실패.

`63b8f94` (정상): 클릭 → 플로팅 툴바 → "본문 삽입" (에디터 포커스 유지)
현재 (고장): 클릭 → 확대뷰 모달 → "본문 삽입" (에디터 포커스 소실)

## 수정

### blog-image.js — insertImage() 수정

`editor.exec('addImage')` 대신 마크다운 직접 삽입 방식으로 변경. 이 방식은 커서 위치에 의존하지 않고 본문 끝에 이미지를 추가.

**현재 (49~56행):**
```javascript
function insertImage(url, name) {
  if (_isInsertingImage) return;
  _isInsertingImage = true;
  editor.focus();
  editor.exec('addImage', { imageUrl: url, altText: name || 'image' });
  showToast('이미지 삽입 완료');
  setTimeout(() => { _isInsertingImage = false; updatePreview(); }, 300);
}
```

**변경:**
```javascript
function insertImage(url, name) {
  if (_isInsertingImage) return;
  _isInsertingImage = true;
  const md = editor.getMarkdown();
  const imgTag = `\n![${name || 'image'}](${url})\n`;
  editor.setMarkdown(md + imgTag);
  showToast('이미지 삽입 완료');
  setTimeout(() => { _isInsertingImage = false; updatePreview(); }, 300);
}
```

핵심: `getMarkdown()` → 끝에 이미지 마크다운 추가 → `setMarkdown()`. 포커스/커서 무관.

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/admin/js/blog-image.js
git commit -m "[fix] 이미지 삽입 — exec→마크다운 직접 삽입 (포커스 소실 무관)"
```

캐시 버스팅: `?v=20260322j` → `?v=20260322k`

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

1. 확대뷰에서 "본문 삽입" → 에디터 본문 끝에 이미지 삽입되는지
2. 드래그&드롭 → 이미지 삽입되는지
3. 기존 본문 유지되는지 (덮어쓰기 안 되는지)

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수
