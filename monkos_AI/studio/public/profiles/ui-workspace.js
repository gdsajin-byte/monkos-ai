/**
 * profiles/ui-workspace.js — 중앙: 레퍼런스 갤러리 + 결과 프리뷰 + 다운로드
 * 마스터 갤러리는 용도(purpose)로 필터
 */

import { state, updateState, onStateChange } from './state.js';
import { SAMPLES, CATEGORY_META, PURPOSE_PRESETS } from './templates.js';

let uploadedRefs = {};

export function initWorkspace() {
  initGalleryUpload();
  initResultPanel();
  renderGallery();

  onStateChange((key) => {
    if (key === 'activeCategory' || key === 'gender' || key === 'purpose') renderGallery();
    if (key === 'masterRef' || key === 'overrides') renderGallery();
    if (key === 'generatedImage' && state.generatedImage) showResult();
    if (key === 'base64Image' && state.base64Image) updateResultBefore();
  });
}

function renderGallery() {
  const cat = state.activeCategory || 'master';
  const titleEl = document.getElementById('gallery-title');
  const hintEl = document.getElementById('gallery-hint');
  const grid = document.getElementById('gallery-grid');
  const meta = CATEGORY_META[cat];

  if (cat === 'master') {
    const purposeMeta = PURPOSE_PRESETS[state.purpose];
    titleEl.textContent = `🎯 마스터 — ${purposeMeta?.label || state.purpose}`;
    hintEl.textContent = purposeMeta?.desc || '전체 무드를 결정하는 기준 이미지';
  } else {
    titleEl.textContent = meta ? `${meta.icon} ${meta.label}` : cat;
    hintEl.textContent = meta?.desc || '';
  }

  const items = SAMPLES[cat] || [];
  let filtered;
  if (cat === 'master') {
    filtered = items.filter(i =>
      (i.gender === 'all' || i.gender === state.gender) &&
      (!i.purpose || i.purpose === state.purpose)
    );
  } else {
    filtered = items.filter(i => i.gender === 'all' || i.gender === state.gender);
  }

  const uploaded = uploadedRefs[cat] || [];
  const selectedId = getSelectedId(cat);

  grid.innerHTML = '';

  for (const up of uploaded) {
    grid.appendChild(makeCard(up, cat, selectedId));
  }

  for (const item of filtered) {
    grid.appendChild(makeCard(item, cat, selectedId));
  }
}

function getSelectedId(cat) {
  if (cat === 'master') return state.masterRef?.id || null;
  return state.overrides[cat]?.id || null;
}

function makeCard(item, cat, selectedId) {
  const card = document.createElement('div');
  card.className = `gallery-card${item.id === selectedId ? ' selected' : ''}${item.uploaded ? ' gallery-card-uploaded' : ''}`;
  card.innerHTML = `
    <div class="gallery-card-thumb">
      <img src="${item.thumb}" alt="${item.label}" loading="lazy">
    </div>
    <div class="gallery-card-label">${item.label}</div>
  `;
  card.addEventListener('click', () => selectRef(cat, item));
  return card;
}

function selectRef(cat, item) {
  if (cat === 'master') {
    const current = state.masterRef;
    if (current?.id === item.id) {
      updateState('masterRef', null);
    } else {
      updateState('masterRef', { id: item.id, label: item.label, thumb: item.thumb, data: item.data || null });
    }
  } else {
    const current = state.overrides[cat];
    const newOverrides = { ...state.overrides };
    if (current?.id === item.id) {
      newOverrides[cat] = null;
    } else {
      newOverrides[cat] = { id: item.id, label: item.label, thumb: item.thumb, data: item.data || null };
    }
    updateState('overrides', newOverrides);
  }
}

function initGalleryUpload() {
  const dropZone = document.getElementById('gallery-upload-drop');
  const fileInput = document.getElementById('gallery-upload-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleUpload(fileInput.files[0]);
    fileInput.value = '';
  });
}

function handleUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const cat = state.activeCategory || 'master';
    const id = `upload-${Date.now()}`;
    const item = {
      id,
      label: '직접 업로드',
      thumb: reader.result,
      data: reader.result,
      gender: 'all',
      uploaded: true,
    };

    if (!uploadedRefs[cat]) uploadedRefs[cat] = [];
    uploadedRefs[cat].push(item);
    renderGallery();
    selectRef(cat, item);
  };
  reader.readAsDataURL(file);
}

function initResultPanel() {
  const btnDlAfter = document.getElementById('btn-dl-after');
  const btnDlCompare = document.getElementById('btn-dl-compare');
  const btnRetry = document.getElementById('btn-retry');

  btnDlAfter.addEventListener('click', () => {
    if (!state.generatedImage) return;
    const link = document.createElement('a');
    link.href = state.generatedImage;
    link.download = `monkos_profile_${Date.now()}.png`;
    link.click();
  });

  btnDlCompare.addEventListener('click', () => {
    if (!state.base64Image || !state.generatedImage) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgA = new Image();
    const imgB = new Image();

    imgA.onload = () => {
      imgB.onload = () => {
        const w = 400, h = 533, gap = 16, pad = 24, brandH = 40;
        canvas.width = w * 2 + gap + pad * 2;
        canvas.height = h + pad * 2 + brandH;
        ctx.fillStyle = '#0A0E17';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgA, pad, pad, w, h);
        ctx.drawImage(imgB, pad + w + gap, pad, w, h);
        ctx.fillStyle = '#888';
        ctx.font = '13px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('Before', pad + w / 2, pad + h + 20);
        ctx.fillText('After', pad + w + gap + w / 2, pad + h + 20);
        ctx.fillStyle = '#555';
        ctx.font = '11px "Noto Sans KR"';
        ctx.fillText('MONKOS AI Studio · monkos.ai', canvas.width / 2, canvas.height - 12);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.download = `monkos_compare_${Date.now()}.jpg`;
        link.click();
      };
      imgB.src = state.generatedImage;
    };
    imgA.src = state.base64Image;
  });

  btnRetry.addEventListener('click', async () => {
    const { generate } = await import('./api.js');
    generate();
  });
}

function showResult() {
  const panel = document.getElementById('result-preview');
  const imgAfter = document.getElementById('img-after');
  panel.style.display = 'block';
  imgAfter.src = state.generatedImage;
  if (state.base64Image) {
    document.getElementById('img-before').src = state.base64Image;
  }
}

function updateResultBefore() {
  const imgBefore = document.getElementById('img-before');
  if (imgBefore) imgBefore.src = state.base64Image;
}
