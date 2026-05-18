---
type: ORDER
id: ORDER_20260316_iMac쌍아_막내_블로그에디터4차_WebP+UX5건
date: 2026-03-16
from: iMac/쌍아
to: 막내
priority: P0
status: 대기
ref: 작가님 실사용 피드백 (2026-03-16 16:50)
---

# 블로그 에디터 4차 — WebP 변환 + UX 5건

## 배경
작가님 실사용 피드백 + 미구현 확인 사항.

---

## Task 1: 업로드 시 WebP 자동 변환

대상: `monkos_AI/portal/lib/cms/upload.js`

**현재:** JPEG/PNG 원본 그대로 GCS 저장.
**변경:** 업로드 시 sharp로 WebP 변환 후 저장.

```javascript
import sharp from 'sharp';

// handleUpload 내부, file.save() 전에:
let imageData = filePart.data;
let contentType = filePart.contentType;
let fileName = safeName;

// WebP 변환 (GIF 제외)
if (contentType !== 'image/gif') {
  imageData = await sharp(filePart.data)
    .webp({ quality: 85 })
    .toBuffer();
  contentType = 'image/webp';
  fileName = fileName.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

const gcsPath = `blog/${timestamp}_${fileName}`;
```

**package.json에 sharp 추가:**
```bash
cd monkos_AI/portal && npm install sharp
```

**주의:** Dockerfile에서 sharp 네이티브 빌드 호환 확인. Alpine 기반이면 `npm install --platform=linuxmusl` 필요할 수 있음.

---

## Task 2: 에디터 본문 이미지 삭제 기능

**현재:** WYSIWYG 에디터에 삽입된 이미지를 삭제할 수 없음.
**원인:** Toast UI WYSIWYG에서 이미지 클릭 후 Delete/Backspace 키로 삭제 가능해야 하는데, 동작하지 않는 것으로 보임.

**수정:**
- Toast UI 에디터에서 이미지 선택 → Delete 키 동작 확인
- 만약 기본 동작이 안 되면, 이미지 클릭 시 선택 상태 + 삭제 버튼 오버레이 추가:

```javascript
// 에디터 초기화 후
editor.on('change', () => {
  // WYSIWYG 컨테이너 내 이미지에 클릭 이벤트
  const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
  if (!wwContainer) return;
  wwContainer.querySelectorAll('img').forEach(img => {
    if (img.dataset.deleteReady) return;
    img.dataset.deleteReady = 'true';
    img.style.cursor = 'pointer';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('이 이미지를 삭제하시겠습니까?')) {
        img.parentElement?.remove() || img.remove();
      }
    });
  });
});
```

대안: Toast UI의 `customHTMLRenderer`나 `widgetRules` 활용 검토.

---

## Task 3: 이미지 저장소 컨테이너 높이 제한 + 접기

**현재:** `max-height: calc(100vh - 200px)` — 이미지가 많으면 사이드바가 무한 확장.

**수정:**
- 기본 상태: 이미지 그리드 `max-height: 60vh`
- 상단에 접기/펼치기 토글 버튼 추가

```html
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
  <label style="margin-bottom:0">이미지 저장소</label>
  <div style="display:flex;gap:4px">
    <button type="button" class="btn btn-secondary" id="imgUploadBtn" onclick="uploadToLibrary()" style="padding:4px 10px;font-size:11px">+ 업로드</button>
    <button type="button" class="btn btn-secondary" id="imgToggleBtn" onclick="toggleImageLibrary()" style="padding:4px 10px;font-size:11px">접기</button>
  </div>
  <input type="file" id="imgLibFile" accept="image/*" multiple style="display:none">
</div>
<div id="imageLibrary" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:60vh;overflow-y:auto;transition:max-height 0.3s">
</div>
```

```javascript
function toggleImageLibrary() {
  const lib = document.getElementById('imageLibrary');
  const btn = document.getElementById('imgToggleBtn');
  if (lib.style.maxHeight === '0px') {
    lib.style.maxHeight = '60vh';
    lib.style.overflow = 'auto';
    btn.textContent = '접기';
  } else {
    lib.style.maxHeight = '0px';
    lib.style.overflow = 'hidden';
    btn.textContent = '펼치기';
  }
}
```

---

## Task 4: 썸네일 자동 생성 + 좌측 사이드바 미리보기

**현재:** 썸네일 필드는 수동 입력/업로드만 가능. 미리보기 없음.

**수정:**

### 4-1. 썸네일 자동 세팅 (저장 시)

`save()` 함수에서 썸네일이 비어 있으면 본문 첫 이미지 URL 자동 추출:

```javascript
async function save(published) {
  // 기존 코드...
  let thumbnail = document.getElementById('thumbnail').value.trim();

  // 썸네일 미지정 시 본문 첫 이미지 자동 추출
  if (!thumbnail) {
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    if (match) {
      thumbnail = match[1];
      document.getElementById('thumbnail').value = thumbnail;
    }
  }
  // ...
}
```

### 4-2. 좌측 사이드바 하단 — 썸네일 미리보기 카드

좌측 사이드바 태그 섹션 아래에 미리보기 카드 추가:

```html
<!-- 좌측 사이드바 최하단 -->
<div class="sidebar-section" id="previewCard">
  <label>미리보기</label>
  <div style="border:1px solid var(--border);border-radius:6px;overflow:hidden;background:var(--surface2)">
    <div id="previewThumb" style="width:100%;aspect-ratio:16/9;background:#eee;display:flex;align-items:center;justify-content:center;overflow:hidden">
      <span style="color:var(--text-dim);font-size:11px">썸네일 없음</span>
    </div>
    <div style="padding:8px">
      <div id="previewTitle" style="font-size:13px;font-weight:600;color:var(--text-bright);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">제목 미입력</div>
      <div id="previewSummary" style="font-size:11px;color:var(--text-dim);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">요약 미입력</div>
    </div>
  </div>
</div>
```

### 4-3. 실시간 미리보기 갱신

제목/요약/썸네일 변경 시 미리보기 카드 실시간 업데이트:

```javascript
function updatePreview() {
  const title = document.getElementById('title').value || '제목 미입력';
  const summary = document.getElementById('summary').value || '요약 미입력';
  const thumb = document.getElementById('thumbnail').value;

  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewSummary').textContent = summary;

  const thumbEl = document.getElementById('previewThumb');
  if (thumb) {
    thumbEl.innerHTML = `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover">`;
  } else {
    // 본문 첫 이미지 시도
    const content = editor.getMarkdown();
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    if (match) {
      thumbEl.innerHTML = `<img src="${match[1]}" style="width:100%;height:100%;object-fit:cover">`;
    } else {
      thumbEl.innerHTML = '<span style="color:var(--text-dim);font-size:11px">썸네일 없음</span>';
    }
  }
}

// 이벤트 바인딩
document.getElementById('title').addEventListener('input', updatePreview);
document.getElementById('summary').addEventListener('input', updatePreview);
document.getElementById('thumbnail').addEventListener('input', updatePreview);
editor.on('change', updatePreview);
```

---

## Task 5: 반응형 개선 — 메인 최소폭 보장

**현재 문제:** 화면을 좁히면 좌측 사이드바(220px 고정)가 메인을 압박 → 메인이 먼저 찌그러짐. 더 좁히면 우측이 사라지고, 좌측이 메인 위로 올라옴.

**수정:** 메인에 최소폭을 설정하고, 사이드바가 먼저 접히도록:

```css
.editor-layout {
  display: grid;
  grid-template-columns: 220px minmax(480px, 820px) 300px;
  gap: 20px;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 24px;
}

/* 메인 최소폭 유지 못하면 우측 먼저 드롭 */
@media (max-width: 1200px) {
  .editor-layout { grid-template-columns: 200px minmax(400px, 820px); }
  .editor-right { display: none; }
}

/* 그래도 못 버티면 좌측도 드롭 */
@media (max-width: 700px) {
  .editor-layout { grid-template-columns: 1fr; }
  .editor-left { position: static; max-height: none; }
}
```

기존 900px 브레이크포인트 → 700px로 변경 (메인 최소폭 확보).

---

## Task 6: 커밋 + 프로덕션 배포

1. `npm install sharp` 실행 (portal 디렉토리)
2. 커밋 메시지: `[blog] 에디터 4차 — WebP 변환 + 이미지 삭제 + 저장소 접기 + 썸네일 미리보기`
3. `deploy.sh prod` 배포
4. 검증:
   - JPEG/PNG 업로드 → GCS에 .webp로 저장 확인
   - GIF 업로드 → 원본 유지 확인
   - 에디터 본문 이미지 클릭 → 삭제 동작
   - 이미지 저장소 접기/펼치기 토글
   - 썸네일 미지정 → 저장 시 본문 첫 이미지 자동 세팅
   - 좌측 미리보기 카드 실시간 갱신

---

## ⚠️ 준수 조항

- sharp 설치 시 Dockerfile 호환 확인 필수 (Alpine → linuxmusl)
- 기존 업로드 플로우(addImageBlobHook) 유지 — WebP 변환만 추가
- GIF는 WebP 변환 제외 (애니메이션 손실 방지)
- `--to-latest` 사용 금지
