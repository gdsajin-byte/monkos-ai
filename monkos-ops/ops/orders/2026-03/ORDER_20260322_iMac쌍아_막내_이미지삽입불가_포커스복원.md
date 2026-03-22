---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 본문 삽입 불가 수정 — 에디터 포커스 복원

> **[2026-03-22 14:25 KST] iMac/쌍아 → 막내1**

## 증상

확대뷰 모달에서 "본문 삽입" 클릭 시 이미지가 에디터에 삽입되지 않음. 드래그도 안 됨.

## 원인 (추정)

확대뷰 모달이 열리면서 에디터 포커스 소실 → `editor.exec('addImage')` 시 삽입 위치를 모름.

이 기능은 `e1556ee`에서 추가되었으나, GFE 캐시 + setupImageHandlers 에러로 **한 번도 prod에서 정상 테스트된 적 없음**.

## 수정

### blog-image.js:49-56 — insertImage() 수정

**현재:**
```javascript
function insertImage(url, name) {
  if (_isInsertingImage) return;
  _isInsertingImage = true;
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
  editor.focus();
  editor.exec('addImage', { imageUrl: url, altText: name || 'image' });
  showToast('이미지 삽입 완료');
  setTimeout(() => { _isInsertingImage = false; updatePreview(); }, 300);
}
```

핵심: `editor.focus()` 한 줄 추가. exec 전에 에디터에 포커스를 복원.

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/admin/js/blog-image.js
git commit -m "[fix] 이미지 삽입 불가 — editor.focus() 추가"
```

캐시 버스팅: `?v=20260322i` → `?v=20260322j`

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

1. 확대뷰에서 "본문 삽입" 클릭 → 에디터에 이미지 삽입되는지
2. 뱅크에서 에디터로 드래그&드롭 → 이미지 삽입되는지
3. 토스트 "이미지 삽입 완료" 표시되는지

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수
