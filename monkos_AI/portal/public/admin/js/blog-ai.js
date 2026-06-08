/* blog-ai.js — AI 이미지 생성 / OG 썸네일 / SEO 제안 모듈 (ESM) */
import { showToast, authFetch } from './admin-common.js';
import { getEditor, updatePreview } from './blog-editor.js';

let lastGeneratedUrl = null;
let lastPrompt = '';

function getFormValues() {
  return {
    title: document.getElementById('title')?.value || '',
    content: getEditor()?.getMarkdown()?.substring(0, 500) || '',
    category: document.getElementById('category')?.value || '',
  };
}

/* ===== AI 이미지 생성 ===== */
async function generateAiImage() {
  const { title, content, category } = getFormValues();
  if (!title) { showToast('제목을 먼저 입력하세요', true); return; }

  const style = document.querySelector('.ai-style-btn.active')?.dataset.style || 'photo';
  const btn = document.getElementById('aiGenerateBtn');
  const status = document.getElementById('aiStatus');
  btn.disabled = true;
  btn.textContent = '생성 중...';
  status.textContent = '프롬프트 생성 → 이미지 생성 중... (30초~1분)';

  try {
    const r = await authFetch('/api/admin/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category, style }),
    });
    if (!r) return;
    if (!r.ok) {
      const err = await r.json();
      showToast(`생성 실패: ${err.error}`, true);
      status.textContent = '';
      return;
    }
    const data = await r.json();
    lastGeneratedUrl = data.url;
    lastPrompt = data.prompt || '';

    document.getElementById('aiPromptText').value = lastPrompt;
    const preview = document.getElementById('aiImagePreview');
    preview.innerHTML = `<img src="${data.url}" alt="AI 생성 이미지" style="width:100%;border-radius:6px">`;
    document.getElementById('aiImageActions').style.display = 'flex';
    status.textContent = '';
    showToast('AI 이미지 생성 완료');
  } catch (err) {
    showToast('생성 에러: ' + err.message, true);
    status.textContent = '';
  } finally {
    btn.disabled = false;
    btn.textContent = '🎲 생성';
  }
}

async function regenerateAiImage() {
  await generateAiImage();
}

function insertAiImage() {
  if (!lastGeneratedUrl) { showToast('먼저 이미지를 생성하세요', true); return; }
  const ed = getEditor();
  if (!ed) { showToast('에디터 초기화 대기 중', true); return; }
  try {
    ed.focus();
    ed.exec('addImage', { imageUrl: lastGeneratedUrl, altText: 'AI generated image' });
    showToast('본문에 이미지 삽입 완료');
    setTimeout(() => updatePreview(), 300);
  } catch {
    const md = ed.getMarkdown();
    ed.setMarkdown(md + `\n![AI generated image](${lastGeneratedUrl})\n`);
    showToast('본문에 이미지 삽입 완료');
    setTimeout(() => updatePreview(), 300);
  }
}

function setAiAsThumbnail() {
  if (!lastGeneratedUrl) { showToast('먼저 이미지를 생성하세요', true); return; }
  document.getElementById('thumbnail').value = lastGeneratedUrl;
  updatePreview();
  showToast('📌 썸네일 지정 완료');
}

function downloadAiImage() {
  if (!lastGeneratedUrl) return;
  const a = document.createElement('a');
  a.href = lastGeneratedUrl;
  a.download = 'ai-image.jpg';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ===== OG 썸네일 ===== */
async function generateOgThumbnail() {
  const { title, category } = getFormValues();
  if (!title) { showToast('제목을 먼저 입력하세요', true); return; }

  const bgType = document.querySelector('input[name="ogBgType"]:checked')?.value || 'gradient';
  let backgroundUrl = null;
  if (bgType === 'blur') {
    const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
    const firstImg = wwContainer?.querySelector('img');
    if (firstImg) backgroundUrl = firstImg.src;
    if (!backgroundUrl) {
      const md = getEditor()?.getMarkdown() || '';
      const match = md.match(/!\[.*?\]\((.*?)\)/);
      if (match) backgroundUrl = match[1];
    }
    if (!backgroundUrl) {
      showToast('본문에 이미지가 없습니다. 그래디언트로 대체합니다.', true);
    }
  }

  const btn = document.getElementById('ogGenerateBtn');
  btn.disabled = true;
  btn.textContent = '생성 중...';

  try {
    const r = await authFetch('/api/admin/ai/thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, backgroundUrl }),
    });
    if (!r) return;
    if (!r.ok) {
      const err = await r.json();
      showToast(`썸네일 생성 실패: ${err.error}`, true);
      return;
    }
    const data = await r.json();
    const preview = document.getElementById('ogPreview');
    preview.innerHTML = `<img src="${data.url}" alt="OG 썸네일" style="width:100%;border-radius:6px">`;
    document.getElementById('ogApplyBtn').style.display = 'inline-block';
    document.getElementById('ogApplyBtn').dataset.url = data.url;
    showToast('OG 썸네일 생성 완료');
  } catch (err) {
    showToast('썸네일 에러: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '🖼 자동 생성';
  }
}

function applyOgThumbnail() {
  const url = document.getElementById('ogApplyBtn').dataset.url;
  if (!url) return;
  document.getElementById('thumbnail').value = url;
  updatePreview();
  showToast('📌 썸네일 적용 완료');
}

/* ===== SEO 제안 ===== */
async function generateSeoSuggestion() {
  const { title, content } = getFormValues();
  if (!title) { showToast('제목을 먼저 입력하세요', true); return; }

  const btn = document.getElementById('seoGenerateBtn');
  btn.disabled = true;
  btn.textContent = '생성 중...';

  try {
    const fullContent = getEditor()?.getMarkdown() || '';
    const r = await authFetch('/api/admin/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: fullContent }),
    });
    if (!r) return;
    if (!r.ok) {
      const err = await r.json();
      showToast(`SEO 제안 실패: ${err.error}`, true);
      return;
    }
    const data = await r.json();
    document.getElementById('seoSummary').value = data.summary || '';
    document.getElementById('seoTags').value = data.tags || '';
    document.getElementById('seoApplyBtn').style.display = 'inline-block';
    showToast('SEO 제안 생성 완료');
  } catch (err) {
    showToast('SEO 에러: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ 자동 생성';
  }
}

function applySeoSuggestion() {
  const summary = document.getElementById('seoSummary').value;
  const tags = document.getElementById('seoTags').value;
  if (summary) document.getElementById('summary').value = summary;
  if (tags) document.getElementById('tags').value = tags;
  updatePreview();
  showToast('SEO 제안 적용 완료');
}

/* ===== 스타일 토글 ===== */
function initStyleToggle() {
  document.querySelectorAll('.ai-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ai-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ===== AI 탭 초기화 (blog-edit.html에서 호출) ===== */
export function initAiTab() {
  initStyleToggle();

  document.getElementById('aiGenerateBtn')?.addEventListener('click', generateAiImage);
  document.getElementById('aiRegenerateBtn')?.addEventListener('click', regenerateAiImage);
  document.getElementById('aiInsertBtn')?.addEventListener('click', insertAiImage);
  document.getElementById('aiThumbBtn')?.addEventListener('click', setAiAsThumbnail);
  document.getElementById('aiDownloadBtn')?.addEventListener('click', downloadAiImage);
  document.getElementById('ogGenerateBtn')?.addEventListener('click', generateOgThumbnail);
  document.getElementById('ogApplyBtn')?.addEventListener('click', applyOgThumbnail);
  document.getElementById('seoGenerateBtn')?.addEventListener('click', generateSeoSuggestion);
  document.getElementById('seoApplyBtn')?.addEventListener('click', applySeoSuggestion);
}
