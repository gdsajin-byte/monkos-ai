/**
 * profiles/ui-sidebar.js — 사이드바 옵션 패널
 * 파일 업로드 + 칩 선택 + 생성 버튼
 */

import { state, updateState, onStateChange } from './state.js';
import { generate } from './api.js';


export function initSidebar() {
  const fileInput = document.getElementById('file-input');
  const fileDrop = document.getElementById('file-drop');
  const previewEl = document.getElementById('sidebar-preview');
  const previewImg = document.getElementById('preview-img');
  const btnChange = document.getElementById('btn-change');
  const btnGenerate = document.getElementById('btn-generate');
  const modelSelect = document.getElementById('model-select');
  const costHint = document.getElementById('cost-hint');

  // 파일 업로드
  fileDrop.addEventListener('click', () => fileInput.click());
  fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
  fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
  btnChange.addEventListener('click', () => fileInput.click());

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      updateState('base64Image', reader.result);
      previewImg.src = reader.result;
      fileDrop.style.display = 'none';
      previewEl.style.display = 'block';
      btnGenerate.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  // 칩 선택 (위임)
  document.querySelectorAll('.opt-chips').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.opt-chip');
      if (!chip) return;
      group.querySelectorAll('.opt-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      updateState(group.dataset.field, chip.dataset.val);
    });
  });

  // 모델 선택
  modelSelect.addEventListener('change', () => {
    updateState('model', modelSelect.value);
    const costs = { 'nano-banana-2': '~₩92/장', 'nano-banana-pro': '~₩185/장' };
    costHint.textContent = `${modelSelect.options[modelSelect.selectedIndex].text} · ${costs[modelSelect.value]}`;
  });

  // 메인 프롬프트 입력 (중앙 하단)
  const promptInput = document.getElementById('custom-prompt');
  const btnPromptGenerate = document.getElementById('btn-prompt-generate');

  if (promptInput) {
    promptInput.addEventListener('input', () => {
      updateState('customPrompt', promptInput.value);
      if (btnPromptGenerate) btnPromptGenerate.disabled = !state.base64Image;
      // 자동 높이 조절
      promptInput.style.height = 'auto';
      promptInput.style.height = Math.min(promptInput.scrollHeight, 80) + 'px';
    });
  }

  if (btnPromptGenerate) {
    btnPromptGenerate.addEventListener('click', () => generate());
  }

  // 사이드바 생성 버튼
  btnGenerate.addEventListener('click', () => generate());

  // 이미지 업로드 시 프롬프트 생성 버튼 활성화
  onStateChange((key) => {
    if (key === 'base64Image') {
      if (btnPromptGenerate) btnPromptGenerate.disabled = !state.base64Image;
    }
  });
}
