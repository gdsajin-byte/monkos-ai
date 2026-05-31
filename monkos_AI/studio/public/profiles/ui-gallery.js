/**
 * profiles/ui-gallery.js — 우측 사이드바: 스택 관리 + 유저 사진 + 생성 버튼
 */

import { state, updateState, onStateChange } from './state.js';
import { CATEGORY_META } from './templates.js';
import { generate } from './api.js';

export function initGallery() {
  initUserPhoto();
  initGenderChips();
  initModelSelect();
  initPromptInput();
  initGenerateButton();
  renderStack();

  onStateChange((key) => {
    if (key === 'masterRef' || key === 'overrides') renderStack();
    if (key === 'masterRef' || key === 'base64Image') updateGenerateBtn();
  });
}

function initUserPhoto() {
  const fileInput = document.getElementById('file-input');
  const fileDrop = document.getElementById('file-drop');
  const preview = document.getElementById('user-photo-preview');
  const previewImg = document.getElementById('preview-img');
  const btnChange = document.getElementById('btn-change');

  fileDrop.addEventListener('click', () => fileInput.click());
  fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
  fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleUserFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleUserFile(fileInput.files[0]);
  });
  btnChange.addEventListener('click', () => fileInput.click());

  function handleUserFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      updateState('base64Image', reader.result);
      previewImg.src = reader.result;
      fileDrop.style.display = 'none';
      preview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }
}

function initGenderChips() {
  document.querySelectorAll('.opt-chips-sm').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.opt-chip-sm');
      if (!chip) return;
      group.querySelectorAll('.opt-chip-sm').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      updateState(group.dataset.field, chip.dataset.val);
    });
  });
}

function initModelSelect() {
  const select = document.getElementById('model-select');
  const costHint = document.getElementById('cost-hint');
  select.addEventListener('change', () => {
    updateState('model', select.value);
    const costs = { 'nano-banana-2': '~₩92/장', 'nano-banana-pro': '~₩185/장' };
    costHint.textContent = `${select.options[select.selectedIndex].text} · ${costs[select.value]}`;
  });
}

function initPromptInput() {
  const input = document.getElementById('custom-prompt');
  if (input) {
    input.addEventListener('input', () => {
      updateState('customPrompt', input.value);
    });
  }
}

function initGenerateButton() {
  const btn = document.getElementById('btn-generate');
  btn.addEventListener('click', () => generate());
}

function updateGenerateBtn() {
  const btn = document.getElementById('btn-generate');
  btn.disabled = !state.base64Image && !state.masterRef;
}

function renderStack() {
  renderMasterSlot();
  renderOverrides();
}

function renderMasterSlot() {
  const slot = document.getElementById('slot-master');
  const ref = state.masterRef;

  if (!ref) {
    slot.className = 'stack-slot';
    slot.innerHTML = '<div class="stack-slot-empty">첫 번째 선택이 마스터가 됩니다</div>';
    return;
  }

  slot.className = 'stack-slot has-ref';
  slot.innerHTML = `
    <div class="stack-slot-filled">
      <div class="stack-slot-thumb"><img src="${ref.thumb}" alt="${ref.label}"></div>
      <div class="stack-slot-info">
        <span class="stack-slot-role">🎯 마스터<span class="stack-master-badge">MASTER</span></span>
        <span class="stack-slot-label">${ref.label}</span>
      </div>
      <button class="stack-slot-remove" id="remove-master">×</button>
    </div>
  `;
  slot.querySelector('#remove-master').addEventListener('click', () => {
    updateState('masterRef', null);
  });
}

function renderOverrides() {
  const list = document.getElementById('override-list');
  const empty = document.getElementById('override-empty');
  const cats = ['fashion', 'hair', 'makeup', 'background'];
  const activeOverrides = cats.filter(c => state.overrides[c]);

  list.querySelectorAll('.override-slot').forEach(el => el.remove());

  if (activeOverrides.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  for (const cat of activeOverrides) {
    const ref = state.overrides[cat];
    const meta = CATEGORY_META[cat];
    const slot = document.createElement('div');
    slot.className = 'override-slot';
    slot.innerHTML = `
      <div class="override-slot-thumb"><img src="${ref.thumb}" alt="${ref.label}"></div>
      <div class="override-slot-info">
        <span class="override-slot-cat">${meta.icon} ${meta.label}</span>
        <span class="override-slot-label">${ref.label}</span>
      </div>
      <button class="override-slot-remove" data-cat="${cat}">×</button>
    `;
    slot.querySelector('.override-slot-remove').addEventListener('click', () => {
      const newOverrides = { ...state.overrides };
      newOverrides[cat] = null;
      updateState('overrides', newOverrides);
    });
    list.appendChild(slot);
  }
}

export function addToHistory(entry) {
  state.history.unshift(entry);
  updateState('history', state.history);
}
