/**
 * profiles/ui-gallery.js — 스타일 샘플 박스 + 레퍼런스 슬롯 + 히스토리
 */

import { state, updateState, onStateChange } from './state.js';
import { SAMPLES } from './templates.js';

const ROLE_ICONS = { outfit: '👔', hair: '💇', pose: '🤳', makeup: '💄' };
const ROLE_LABELS = { outfit: '의상', hair: '헤어', pose: '포즈', makeup: '메이크업' };
const MAX_STYLE_SLOTS = 4;

export function initGallery() {
  renderSamples();
  onStateChange((key) => {
    if (key === 'gender') renderSamples();
    if (key === 'base64Image') updateMainSlot();
  });
}

// ── 메인 슬롯 (고객 사진) ──
function updateMainSlot() {
  const slotThumb = document.getElementById('slot-main-thumb');
  const slot = document.getElementById('slot-main');
  if (state.base64Image) {
    slotThumb.innerHTML = `<img src="${state.base64Image}" alt="내 사진">`;
    slot.classList.add('has-image');
  } else {
    slotThumb.innerHTML = '<div class="ref-slot-empty">👤</div>';
    slot.classList.remove('has-image');
  }
  updateSlotCount();
}

// ── 스타일 슬롯 관리 ──
function addStyleSlot(category, item) {
  const list = document.getElementById('ref-slots-list');
  const empty = document.getElementById('ref-slots-empty');

  // 같은 카테고리 기존 슬롯 교체
  const existing = list.querySelector(`[data-category="${category}"]`);
  if (existing) existing.remove();

  // 최대 슬롯 체크
  if (list.children.length >= MAX_STYLE_SLOTS && !existing) {
    alert(`최대 ${MAX_STYLE_SLOTS}개까지 선택 가능합니다`);
    return false;
  }

  if (empty) empty.style.display = 'none';

  const slot = document.createElement('div');
  slot.className = 'ref-slot ref-slot-style';
  slot.dataset.category = category;
  slot.dataset.itemId = item.id;
  slot.innerHTML = `
    <div class="ref-slot-thumb">
      <img src="${item.thumb}" alt="${item.label}">
    </div>
    <div class="ref-slot-info">
      <span class="ref-slot-role"><span class="ref-role-icon">${ROLE_ICONS[category]}</span>${ROLE_LABELS[category]}</span>
      <span class="ref-slot-res">${item.label} · 512px</span>
    </div>
    <button class="ref-slot-remove" data-category="${category}">×</button>
  `;

  slot.querySelector('.ref-slot-remove').addEventListener('click', (e) => {
    e.stopPropagation();
    slot.remove();
    updateState(category, null);
    updateSlotCount();
    // 샘플 카드 선택 해제
    const grid = document.getElementById(`${category}-grid`);
    if (grid) grid.querySelectorAll('.sample-card').forEach(c => c.classList.remove('selected'));
    if (list.children.length === 0 && empty) empty.style.display = 'block';
  });

  list.appendChild(slot);
  updateSlotCount();
  return true;
}

function updateSlotCount() {
  const list = document.getElementById('ref-slots-list');
  const count = document.getElementById('ref-count');
  const total = (state.base64Image ? 1 : 0) + list.children.length;
  count.textContent = `${total}/5`;
}

// ── 샘플 그리드 렌더링 ──
function renderSamples() {
  renderSampleGrid('outfit-grid', 'outfit', SAMPLES.outfit);
  renderSampleGrid('hair-grid', 'hair', SAMPLES.hair);
  renderSampleGrid('pose-grid', 'pose', SAMPLES.pose);
  renderSampleGrid('makeup-grid', 'makeup', SAMPLES.makeup);
}

function renderSampleGrid(containerId, stateKey, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const filtered = items.filter(item =>
    item.gender === 'all' || item.gender === state.gender
  );

  container.innerHTML = filtered.map(item => `
    <div class="sample-card ${state[stateKey] === item.id ? 'selected' : ''}"
         data-id="${item.id}" data-key="${stateKey}">
      <div class="sample-thumb">
        <img src="${item.thumb}" alt="${item.label}" loading="lazy">
      </div>
      <div class="sample-label">${item.label}</div>
    </div>
  `).join('');

  container.addEventListener('click', e => {
    const card = e.target.closest('.sample-card');
    if (!card) return;

    const itemId = card.dataset.id;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // 이미 선택된 카드 클릭 → 해제
    if (card.classList.contains('selected')) {
      card.classList.remove('selected');
      updateState(stateKey, null);
      const slot = document.querySelector(`.ref-slot-style[data-category="${stateKey}"]`);
      if (slot) slot.remove();
      updateSlotCount();
      return;
    }

    // 슬롯 추가
    const added = addStyleSlot(stateKey, item);
    if (added) {
      container.querySelectorAll('.sample-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateState(stateKey, itemId);
    }
  });
}

// ── 히스토리 ──
export function addToHistory(entry) {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const count = document.getElementById('history-count');

  if (empty) empty.style.display = 'none';

  state.history.unshift(entry);
  count.textContent = state.history.length;

  const card = document.createElement('div');
  card.className = 'history-card';
  card.innerHTML = `
    <div class="history-thumbs">
      <img src="${entry.before}" alt="B" class="history-thumb-b">
      <img src="${entry.after}" alt="A" class="history-thumb-a">
    </div>
    <div class="history-meta">
      <span class="history-purpose">${entry.purpose}</span>
      <span>${entry.outfit || '-'}</span>
      <span>${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `;
  card.addEventListener('click', () => {
    updateState('base64Image', entry.before);
    updateState('generatedImage', entry.after);
  });

  list.prepend(card);
}
