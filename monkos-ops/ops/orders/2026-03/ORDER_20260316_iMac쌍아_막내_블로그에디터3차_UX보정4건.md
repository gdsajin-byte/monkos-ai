---
type: ORDER
id: ORDER_20260316_iMac쌍아_막내_블로그에디터3차_UX보정4건
date: 2026-03-16
from: iMac/쌍아
to: 막내
priority: P0
status: 대기
ref: 작가님 실사용 피드백 (2026-03-16 16:20)
---

# 블로그 에디터 3차 — UX 보정 4건

## 배경
작가님 실사용 테스트 피드백. 에디터 2차(3컬럼+이미지저장소) 적용 후 발견된 이슈.

---

## Task 1: 메인 에디터 폭 고정 — max-width: 820px

대상: `monkos_AI/portal/public/admin/blog-edit.html`

**현재:** `.editor-main { min-width: 0; }` — 1fr로 화면 가득 늘어남
**문제:** iMac 풀화면에서 에디터가 한없이 넓어져 가독성 저하

**수정:**
```css
.editor-main {
  min-width: 0;
  max-width: 820px;
  margin: 0 auto;
}
```

A4 기준(794px) + 여백 = 820px. 좌우 사이드바와 무관하게 에디터 본문은 항상 820px 이내.

---

## Task 2: 이미지 저장소 드래그→에디터 삽입

**현재:** 이미지 썸네일 클릭은 `insertImage()` 호출하지만, 드래그 앤 드롭은 동작하지 않음. 드래그 시 + 표시만 뜨고 실제 삽입 안 됨.

**수정:** 이미지 썸네일에 `draggable="true"` + `dragstart` 이벤트 추가.

```javascript
// 이미지 목록 렌더링 시
container.innerHTML = images.map(img => {
  const escapedUrl = img.url.replace(/'/g, "\\'");
  const escapedName = (img.name || 'image').replace(/'/g, "\\'");
  return `<div class="img-thumb"
    onclick="insertImage('${escapedUrl}', '${escapedName}')"
    draggable="true"
    ondragstart="event.dataTransfer.setData('text/plain', '![${escapedName}](${escapedUrl})')"
    title="${img.name}">
    <img src="${img.url}" alt="${img.name}" loading="lazy">
  </div>`;
}).join('');
```

또한 Toast UI WYSIWYG 에디터의 drop 이벤트를 감지하여 마크다운 이미지 구문을 삽입:

```javascript
// 에디터 초기화 후
const editorEl = document.querySelector('.toastui-editor-ww-container');
if (editorEl) {
  editorEl.addEventListener('drop', (e) => {
    const text = e.dataTransfer.getData('text/plain');
    if (text && text.startsWith('![')) {
      e.preventDefault();
      // 마크다운 이미지 구문에서 URL과 alt 추출
      const match = text.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        editor.exec('addImage', { imageUrl: match[2], altText: match[1] });
      }
    }
  });
}
```

---

## Task 3: 이미지 삭제 버튼

**현재:** 이미지 저장소에 업로드만 있고 삭제(×) 기능 없음.

**수정:**

### 3-1. 백엔드: 이미지 삭제 API

대상: `monkos_AI/portal/lib/cms/upload.js` + `server.js`

**신규 API**: `DELETE /api/admin/images/:filename`

```javascript
export async function handleImageDelete(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const filename = decodeURIComponent(req.url.split('/api/admin/images/')[1]);
  if (!filename) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Filename required' }));
    return;
  }

  try {
    const bucket = storage.bucket(GCS_BUCKET);
    const file = bucket.file(`blog/${filename}`);
    await file.delete();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
```

**server.js 라우팅:**
```javascript
if (urlPath?.startsWith('/api/admin/images/') && req.method === 'DELETE') return handleImageDelete(req, res);
```

### 3-2. 프론트엔드: × 버튼 추가

이미지 썸네일 우측 상단에 삭제 버튼:

```javascript
container.innerHTML = images.map(img => {
  // 기존 + 삭제 버튼
  return `<div class="img-thumb" ...>
    <img src="${img.url}" ...>
    <button class="img-delete" onclick="event.stopPropagation(); deleteImage('${img.name}')" title="삭제">×</button>
  </div>`;
}).join('');
```

```css
.img-thumb { position: relative; }
.img-delete {
  position: absolute; top: 4px; right: 4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff;
  border: none; font-size: 14px; line-height: 1;
  cursor: pointer; display: none;
  align-items: center; justify-content: center;
}
.img-thumb:hover .img-delete { display: flex; }
```

```javascript
async function deleteImage(filename) {
  if (!confirm('이미지를 삭제하시겠습니까?')) return;
  try {
    await fetch(`/api/admin/images/${encodeURIComponent(filename)}`, {
      method: 'DELETE', credentials: 'include'
    });
    showToast('이미지 삭제 완료');
    loadImageLibrary();
  } catch (err) {
    showToast('삭제 실패: ' + err.message, true);
  }
}
```

---

## Task 4: 이미지 저장소 경로 — blog/ 폴더 확정

**현재:** 업로드 API가 `blog/` 프리픽스로 GCS에 저장. 이미지 목록 API도 `blog/` 프리픽스로 조회.

**확정:** 블로그 에디터 이미지 저장소 = `GCS monk-ai-images/blog/` — 변경 없음. 이 건은 확인만.

---

## Task 5: 커밋 + 프로덕션 배포

1. 커밋 메시지: `[blog] 에디터 3차 — 메인 820px 고정 + 이미지 드래그삽입 + 삭제 기능`
2. `deploy.sh prod` 배포
3. 검증:
   - 메인 에디터 폭 820px 고정 확인 (iMac 풀화면)
   - 이미지 드래그→에디터 삽입 동작
   - 이미지 × 삭제 동작 + 목록 새로고침
   - 기존 클릭 삽입/업로드 기능 정상

---

## ⚠️ 준수 조항

- 기존 이미지 업로드(Toast UI addImageBlobHook) 절대 건드리지 말 것
- 삭제 API에 requireAdmin 인증 필수
- `--to-latest` 사용 금지
