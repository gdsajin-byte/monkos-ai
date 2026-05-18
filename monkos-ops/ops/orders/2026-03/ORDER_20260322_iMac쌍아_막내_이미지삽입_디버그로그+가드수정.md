---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 삽입 디버그 + 가드 수정

> **[2026-03-22 14:51 KST] iMac/쌍아 → 막내1**

## 증상

확대뷰에서 "본문 삽입" 클릭 시 아무 반응 없음. 토스트도 안 뜸. 썸네일 지정/닫기는 정상.

## 가설

1. `_isInsertingImage`가 이전 실패로 `true`에 잠겨 51행에서 리턴
2. `editor.getMarkdown()` 또는 `editor.setMarkdown()`에서 에러 → 토스트 미도달 + 플래그 미해제
3. 확대뷰 onclick 바인딩 자체가 안 됨

## 수정

### blog-image.js — insertImage() 전면 수정

**현재 (49~58행):**
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

**변경:**
```javascript
function insertImage(url, name) {
  console.log('[insertImage] 호출됨', { url, name, _isInsertingImage });
  if (_isInsertingImage) {
    console.warn('[insertImage] 중복 호출 차단됨 — 플래그 강제 해제');
    _isInsertingImage = false;
  }
  _isInsertingImage = true;
  try {
    const md = editor.getMarkdown();
    const imgTag = `\n![${name || 'image'}](${url})\n`;
    editor.setMarkdown(md + imgTag);
    showToast('이미지 삽입 완료');
  } catch (err) {
    console.error('[insertImage] 에러:', err);
    showToast('이미지 삽입 실패: ' + err.message, true);
  } finally {
    setTimeout(() => { _isInsertingImage = false; updatePreview(); }, 300);
  }
}
```

변경 포인트:
1. **콘솔 로그** — 호출 여부 확인용
2. **중복 호출 시 플래그 강제 해제** — 잠금 방지
3. **try-catch-finally** — 에러 시에도 플래그 해제 보장

### 확대뷰 버튼 바인딩에도 로그 추가

**blog-image.js:234 부근:**

현재:
```javascript
overlay.querySelector('[data-action="insert"]').onclick = () => { close(); insertImage(url, name); };
```

변경:
```javascript
overlay.querySelector('[data-action="insert"]').onclick = () => { console.log('[확대뷰] 본문삽입 클릭'); close(); insertImage(url, name); };
```

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/admin/js/blog-image.js
git commit -m "[debug] 이미지 삽입 — 콘솔로그 + try-catch + 플래그 강제해제"
```

캐시 버스팅: `?v=20260322k` → `?v=20260322m`

```bash
git add monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 캐시 버스팅 버전 갱신"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

작가님께 요청:
1. 하드 리프레시
2. 브라우저 콘솔(F12) 열어둔 상태에서 확대뷰 "본문 삽입" 클릭
3. 콘솔에 `[확대뷰] 본문삽입 클릭`과 `[insertImage] 호출됨`이 뜨는지 확인
4. 에러 메시지가 있으면 스크린샷 부탁

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 디버그 로그는 문제 해결 후 제거 예정
