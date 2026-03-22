/* blog-image.js — 이미지 시스템 모듈 (ESM, v2.0) */
import { showToast } from './admin-common.js';
import { editor, updatePreview } from './blog-editor.js';

/* ===== 이벤트 중복 방지 플래그 ===== */
let _isInsertingImage = false;
let _changeDebounceTimer = null;

/* ===== Floating toolbar 시스템 ===== */
let activeFloatToolbar = null;
let activeFloatAnchor = null;

function removeFloatToolbar() {
  if (activeFloatToolbar) {
    activeFloatToolbar.remove();
    activeFloatToolbar = null;
    activeFloatAnchor = null;
  }
}

function createFloatToolbar(anchorEl, buttons) {
  if (activeFloatAnchor === anchorEl) {
    removeFloatToolbar();
    return;
  }
  removeFloatToolbar();
  const tb = document.createElement('div');
  tb.className = 'img-float-toolbar';
  buttons.forEach(({ label, action }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = (e) => {
      e.stopPropagation();
      action();
      removeFloatToolbar();
    };
    tb.appendChild(btn);
  });
  document.body.appendChild(tb);
  const rect = anchorEl.getBoundingClientRect();
  const top = rect.top - 40;
  tb.style.top = (top < 8 ? rect.bottom + 4 : top) + 'px';
  tb.style.left = (rect.left + rect.width / 2) + 'px';
  tb.style.transform = 'translateX(-50%)';
  activeFloatToolbar = tb;
  activeFloatAnchor = anchorEl;
}

/* ===== 이미지 삽입 (단일 진입점) ===== */
function insertImage(url, name) {
  if (_isInsertingImage) return;
  _isInsertingImage = true;
  editor.exec('addImage', { imageUrl: url, altText: name || 'image' });
  showToast('이미지 삽입 완료');
  setTimeout(() => { _isInsertingImage = false; updatePreview(); }, 300);
}

/* ===== 이미지 삭제 ===== */
async function deleteImage(filename) {
  try {
    const r = await fetch(`/api/admin/images/${encodeURIComponent(filename)}`, {
      method: 'DELETE', credentials: 'include'
    });
    const result = await r.json();

    if (result.warning) {
      const posts = result.usedIn.map(p => `  - ${p.title}`).join('\n');
      const msg = `\u26A0\uFE0F 이 이미지는 ${result.usedIn.length}개 글에서 사용 중입니다:\n${posts}\n\n삭제하면 해당 글에서 이미지가 깨집니다.\n정말 삭제하시겠습니까?`;
      if (!confirm(msg)) return;

      await fetch(`/api/admin/images/${encodeURIComponent(filename)}?force=true`, {
        method: 'DELETE', credentials: 'include'
      });
    }

    showToast('이미지 삭제 완료');
    loadImageLibrary();
  } catch (err) {
    showToast('삭제 실패: ' + err.message, true);
  }
}

/* ===== 이미지 라이브러리 로딩 ===== */
async function loadImageLibrary() {
  const container = document.getElementById('imageLibrary');
  container.innerHTML = '<div class="img-lib-status">불러오는 중...</div>';
  try {
    const r = await fetch('/api/admin/images', { credentials: 'include' });
    const { images } = await r.json();
    if (!images || images.length === 0) {
      container.innerHTML = '<div class="img-lib-status">이미지를 업로드해보세요</div>';
      return;
    }
    const groups = {};
    images.forEach(img => {
      const date = img.created ? img.created.substring(0, 10) : 'unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(img);
    });
    container.innerHTML = Object.entries(groups).map(([date, imgs]) => {
      const imgCards = imgs.map(img => {
        const escapedUrl = img.url.replace(/'/g, "\\'");
        const escapedName = (img.name || 'image').replace(/'/g, "\\'");
        const tooltip = `${img.name}\n${img.created?.substring(0, 10) || ''}\n${img.size ? (img.size / 1024).toFixed(0) + 'KB' : ''}`;
        return `<div class="img-thumb" onclick="showLibraryToolbar(event, '${escapedUrl}', '${escapedName}')" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '![${escapedName}](${escapedUrl})')" title="${tooltip}"><img src="${img.url}" alt="${img.name}" loading="lazy"><button class="img-delete" onclick="event.stopPropagation(); deleteImage('${escapedName}')" title="삭제">&times;</button></div>`;
      }).join('');
      return `<div class="img-lib-date">${date}</div><div class="img-lib-grid">${imgCards}</div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div class="img-lib-status img-lib-status--error">이미지 로드 실패</div>';
  }
}

/* ===== 라이브러리 접기/펼치기 ===== */
function toggleImageLibrary() {
  const lib = document.getElementById('imageLibrary');
  const btn = document.getElementById('imgToggleBtn');
  if (lib.style.display === 'none') {
    lib.style.display = '';
    btn.textContent = '접기';
  } else {
    lib.style.display = 'none';
    btn.textContent = '펼치기';
  }
}

/* ===== 라이브러리 업로드 ===== */
async function uploadToLibrary() {
  const fileInput = document.getElementById('imgLibFile');
  fileInput.click();
  fileInput.onchange = async () => {
    const files = fileInput.files;
    if (!files.length) return;
    const btn = document.getElementById('imgUploadBtn');
    btn.textContent = '업로드 중...';
    btn.disabled = true;
    try {
      for (const file of files) {
        const form = new FormData();
        form.append('image', file, file.name);
        await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: form });
      }
      showToast(`${files.length}건 업로드 완료`);
      loadImageLibrary();
    } catch (err) {
      showToast('업로드 에러: ' + err.message, true);
    } finally {
      btn.textContent = '+ 업로드';
      btn.disabled = false;
      fileInput.value = '';
    }
  };
}

/* ===== 썸네일 업로드 ===== */
async function uploadThumbnail() {
  const fileInput = document.getElementById('thumbFile');
  fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const btn = document.getElementById('thumbUploadBtn');
    btn.textContent = '...';
    btn.disabled = true;
    try {
      const form = new FormData();
      form.append('image', file, file.name);
      const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: form });
      const data = await r.json();
      if (data.url) {
        document.getElementById('thumbnail').value = data.url;
        showToast('썸네일 업로드 완료');
      } else {
        showToast('업로드 실패: ' + (data.error || 'Unknown'), true);
      }
    } catch (err) {
      showToast('업로드 에러: ' + err.message, true);
    } finally {
      btn.textContent = '업로드';
      btn.disabled = false;
      fileInput.value = '';
    }
  };
}

/* ===== 툴바: 에디터 본문 이미지 ===== */
function showEditorImageToolbar(img) {
  createFloatToolbar(img, [
    { label: '\uD83D\uDCCC 썸네일 지정', action: () => setThumbnail(img.src) },
    { label: '\uD83D\uDDD1 삭제', action: () => {
      if (confirm('이 이미지를 삭제하시겠습니까?')) {
        const md = editor.getMarkdown();
        const imgSrc = img.src;
        const escapedSrc = imgSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const newMd = md.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapedSrc}\\)\\n?`), '');
        if (newMd !== md) {
          editor.setMarkdown(newMd);
        } else {
          try {
            const path = new URL(imgSrc).pathname;
            const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fallbackMd = md.replace(new RegExp(`!\\[[^\\]]*\\]\\([^)]*${escapedPath}\\)\\n?`), '');
            editor.setMarkdown(fallbackMd);
          } catch { editor.setMarkdown(md); }
        }
        updatePreview();
      }
    }}
  ]);
}

/* ===== 이미지 확대 뷰 모달 ===== */
function showImagePreview(url, name) {
  removeFloatToolbar();
  const overlay = document.createElement('div');
  overlay.className = 'img-preview-overlay';

  overlay.innerHTML = `
    <div class="img-preview-modal">
      <img src="${url}" alt="${name || 'image'}">
      <div class="img-preview-actions">
        <button class="img-preview-btn" data-action="insert">본문 삽입</button>
        <button class="img-preview-btn" data-action="thumb">썸네일 지정</button>
        <button class="img-preview-btn img-preview-btn--danger" data-action="delete">삭제</button>
        <button class="img-preview-btn img-preview-btn--dim" data-action="close">닫기</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('[data-action="insert"]').onclick = () => { close(); insertImage(url, name); };
  overlay.querySelector('[data-action="thumb"]').onclick = () => { close(); setThumbnail(url); };
  overlay.querySelector('[data-action="delete"]').onclick = () => { close(); deleteImage(name); };
  overlay.querySelector('[data-action="close"]').onclick = close;

  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  document.body.appendChild(overlay);
}

/* ===== 툴바: 라이브러리 이미지 ===== */
function showLibraryToolbar(e, url, name) {
  e.stopPropagation();
  showImagePreview(url, name);
}

/* ===== 썸네일 지정 ===== */
function setThumbnail(url) {
  document.getElementById('thumbnail').value = url;
  updatePreview();
  markThumbnailInEditor();
  showToast('\uD83D\uDCCC 썸네일 지정 완료');
}

/* ===== 에디터 내 썸네일 표시 ===== */
function markThumbnailInEditor() {
  const thumbUrl = document.getElementById('thumbnail').value;
  const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
  if (!wwContainer) return;
  wwContainer.querySelectorAll('img').forEach(img => {
    if (thumbUrl && img.src === thumbUrl) {
      img.style.outline = '3px solid #6d28d9';
      img.style.outlineOffset = '-3px';
    } else {
      img.style.outline = '';
      img.style.outlineOffset = '';
    }
  });
}

/* ===== 에디터 이미지 핸들러 셋업 (editor 초기화 후 호출) ===== */
export function setupImageHandlers() {
  if (!editor) {
    console.warn('[blog-image] editor 미초기화 — 재시도 대기');
    setTimeout(setupImageHandlers, 200);
    return;
  }
  // 에디터 변경 시: 이미지 클릭 핸들러 + 썸네일 마킹 (dataset.toolbarReady 체크)
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

  // 드래그&드롭: capture phase + stopImmediatePropagation
  const editorEl = document.querySelector('.toastui-editor-ww-container');
  if (editorEl) {
    editorEl.addEventListener('drop', (e) => {
      const text = e.dataTransfer.getData('text/plain');
      if (text && text.startsWith('![')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const match = text.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          insertImage(match[2], match[1]);
        }
      }
    }, true);
  }

  // 플로팅 툴바 외부 클릭 닫기
  document.addEventListener('click', (e) => {
    if (activeFloatToolbar && !activeFloatToolbar.contains(e.target)) {
      removeFloatToolbar();
    }
  });

  // 이미지 업로드 후 라이브러리 새로고침 (커스텀 이벤트)
  document.addEventListener('imageLibraryRefresh', () => loadImageLibrary());
}

// onclick 전역 등록
window.insertImage = insertImage;
window.deleteImage = deleteImage;
window.loadImageLibrary = loadImageLibrary;
window.toggleImageLibrary = toggleImageLibrary;
window.uploadToLibrary = uploadToLibrary;
window.uploadThumbnail = uploadThumbnail;
window.showLibraryToolbar = showLibraryToolbar;
