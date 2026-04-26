/* blog-editor.js — 에디터 코어 모듈 (ESM, v2.0) */
import { showToast, authFetch } from './admin-common.js';
import { updateShareButtons } from './blog-share.js';

const API = '/api/admin/blog';
const params = new URLSearchParams(location.search);
const editSlug = params.get('slug');
let isEdit = false;
let currentPublished = false;

let editor;
export function getEditor() { return editor; }

/* ===== Toast UI Editor 초기화 ===== */
export function initEditor() {
  editor = new toastui.Editor({
    el: document.getElementById('editor'),
    height: '70vh',
    initialEditType: 'wysiwyg',
    previewStyle: 'tab',
    hooks: {
      addImageBlobHook: async (blob, callback) => {
        try {
          const form = new FormData();
          form.append('image', blob, blob.name || 'image.png');
          const r = await authFetch('/api/admin/upload', {
            method: 'POST',
            body: form,
          });
          if (!r) return; // 401 리다이렉트됨
          if (!r.ok) {
            alert(`Upload failed (${r.status})`);
            return;
          }
          const data = await r.json();
          if (data.url) {
            callback(data.url, blob.name || 'image');
            document.dispatchEvent(new Event('imageLibraryRefresh'));
          } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          alert('Upload error: ' + err.message);
        }
      }
    }
  });

  // 에디터 변경 시 프리뷰 갱신
  editor.on('change', () => {
    updatePreview();
  });

  return editor;
}

/* ===== 프리뷰 카드 갱신 ===== */
export function updatePreview() {
  const title = document.getElementById('title').value || '제목 미입력';
  const summary = document.getElementById('summary').value || '요약 미입력';
  const thumb = document.getElementById('thumbnail').value;
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewSummary').textContent = summary;
  const thumbEl = document.getElementById('previewThumb');

  if (thumb) {
    thumbEl.innerHTML = `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover">`;
    return;
  }

  const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
  if (wwContainer) {
    const firstImg = wwContainer.querySelector('img');
    if (firstImg && firstImg.src) {
      thumbEl.innerHTML = `<img src="${firstImg.src}" style="width:100%;height:100%;object-fit:cover">`;
      return;
    }
  }

  const content = editor.getMarkdown();
  const match = content.match(/!\[.*?\]\((.*?)\)/);
  if (match) {
    thumbEl.innerHTML = `<img src="${match[1]}" style="width:100%;height:100%;object-fit:cover">`;
  } else {
    thumbEl.innerHTML = '<span style="color:var(--text-dim);font-size:11px">썸네일 없음</span>';
  }
}

/* ===== 탭 전환 ===== */
export function switchTab(tabName) {
  document.querySelectorAll('.sidebar-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
  const target = document.getElementById('tab-' + tabName);
  if (target) target.style.display = '';
}

/* ===== 내 글 목록 드롭다운 ===== */
async function loadMyPosts() {
  const dd = document.getElementById('myPostsDropdown');
  if (dd.style.display === 'block') { dd.style.display = 'none'; return; }
  dd.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:13px">불러오는 중...</div>';
  dd.style.display = 'block';
  try {
    const r = await authFetch(API);
    if (!r) return; // 401 리다이렉트됨
    if (!r.ok) {
      dd.innerHTML = `<div style="padding:12px;color:var(--danger);font-size:13px">로드 실패 (${r.status})</div>`;
      return;
    }
    const { posts } = await r.json();
    if (!posts || posts.length === 0) {
      dd.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:13px">글이 없습니다</div>';
      return;
    }
    dd.innerHTML = posts.slice(0, 10).map(p =>
      `<a href="/admin/blog-edit.html?slug=${encodeURIComponent(p.slug)}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:13px;color:var(--text);border-bottom:1px solid var(--border);text-decoration:none">`
      + `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${p.title || '(무제)'}</span>`
      + `<span style="padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;margin-left:8px;flex-shrink:0;${p.published ? 'background:rgba(52,211,153,.15);color:#059669' : 'background:rgba(136,146,168,.15);color:var(--text-dim)'}">${p.published ? 'Published' : 'Draft'}</span>`
      + `</a>`
    ).join('') + '<a href="/admin/blog-list.html" style="display:block;padding:8px 12px;font-size:12px;color:var(--accent);font-weight:600;text-align:center">전체 목록 &rarr;</a>';
  } catch (err) {
    dd.innerHTML = '<div style="padding:12px;color:var(--danger);font-size:13px">에러: ' + err.message + '</div>';
  }
}

/* ===== 기존 포스트 로딩 ===== */
export async function loadPost() {
  if (!editSlug) return;
  isEdit = true;
  document.getElementById('pageTitle').textContent = 'Edit Post';

  try {
    const r = await authFetch(`${API}/${encodeURIComponent(editSlug)}`);
    if (!r) return; // 401 리다이렉트됨
    if (!r.ok) { showToast('Post not found', true); return; }

    const post = await r.json();
    document.getElementById('title').value = post.title || '';
    document.getElementById('slug').value = post.slug || '';
    document.getElementById('slug').readOnly = true;
    document.getElementById('summary').value = post.summary || '';
    document.getElementById('tags').value = (post.tags || []).join(', ');
    document.getElementById('thumbnail').value = post.thumbnail || '';
    document.getElementById('lang').value = post.lang || 'ko';
    document.getElementById('category').value = post.category || '';
    document.getElementById('pinned').checked = post.pinned || false;
    currentPublished = post.published || false;
    editor.setMarkdown(post.content || '');
    setTimeout(() => { updatePreview(); updateShareButtons(currentPublished); }, 100);
  } catch (err) {
    showToast('Load failed: ' + err.message, true);
  }
}

/* ===== 저장/발행 ===== */
async function save(published) {
  const title = document.getElementById('title').value.trim();
  const content = editor.getMarkdown();
  if (!title) { showToast('Title is required', true); return; }
  if (!content) { showToast('Content is required', true); return; }

  let thumbnail = document.getElementById('thumbnail').value.trim();
  if (!thumbnail) {
    const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
    if (wwContainer) {
      const firstImg = wwContainer.querySelector('img');
      if (firstImg && firstImg.src) {
        thumbnail = firstImg.src;
      }
    }
    if (!thumbnail) {
      const imgMatch = content.match(/!\[.*?\]\((.*?)\)/);
      if (imgMatch) thumbnail = imgMatch[1];
    }
    if (thumbnail) {
      document.getElementById('thumbnail').value = thumbnail;
      updatePreview();
    }
  }

  const body = {
    title,
    slug: document.getElementById('slug').value.trim(),
    content,
    summary: document.getElementById('summary').value.trim(),
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean),
    thumbnail,
    lang: document.getElementById('lang').value,
    category: document.getElementById('category').value,
    pinned: document.getElementById('pinned').checked,
    published,
    author: 'MONKOS',
  };

  try {
    const url = isEdit ? `${API}/${encodeURIComponent(editSlug)}` : API;
    const method = isEdit ? 'PUT' : 'POST';
    const r = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!r) return; // 401 리다이렉트됨
    const data = await r.json();

    if (r.ok) {
      currentPublished = published;
      updateShareButtons(currentPublished);
      showToast(published ? 'Published!' : 'Draft saved!');
      if (!isEdit && data.slug) {
        history.replaceState(null, '', `/admin/blog-edit.html?slug=${encodeURIComponent(data.slug)}`);
        isEdit = true;
        document.getElementById('slug').readOnly = true;
        document.getElementById('pageTitle').textContent = 'Edit Post';
      }
    } else {
      showToast(data.error || 'Save failed', true);
    }
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

/* ===== 미리보기 ===== */
function preview() {
  const slug = document.getElementById('slug').value.trim();
  if (slug) window.open(`/blog/${slug}`, '_blank');
  else showToast('Save first to preview', true);
}

/* ===== 이벤트 바인딩 셋업 ===== */
export function setupEditorBindings() {
  // Slug sanitize
  document.getElementById('slug').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[\/$#\[\].]/g, '');
  });

  // Preview event bindings
  document.getElementById('title').addEventListener('input', updatePreview);
  document.getElementById('summary').addEventListener('input', updatePreview);
  document.getElementById('thumbnail').addEventListener('input', updatePreview);

  // Auto-generate slug from title (영문 제목 → slug, 비영문은 서버에서 AI 생성)
  document.getElementById('title').addEventListener('input', (e) => {
    if (!isEdit) {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
      const slugField = document.getElementById('slug');
      if (slug.length >= 3) {
        slugField.value = slug;
        slugField.placeholder = '';
      } else {
        slugField.value = '';
        slugField.placeholder = '자동 생성됩니다 (영문 입력 시 직접 지정)';
      }
    }
  });

  // 내 글 목록 외부 클릭 닫기
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('myPostsDropdown');
    if (dd && !e.target.closest('#myPostsBtn') && !e.target.closest('#myPostsDropdown')) dd.style.display = 'none';
  });
}

// onclick 전역 등록
window.save = save;
window.preview = preview;
window.switchTab = switchTab;
window.loadMyPosts = loadMyPosts;
