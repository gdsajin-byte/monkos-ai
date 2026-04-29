/**
 * profiles/main.js — MONKOS Profiles SPA 진입점
 * 모듈 구조: main → state + ui-sidebar + ui-workspace + ui-gallery + api + templates
 */

import { state, updateState } from './state.js';
import { initSidebar } from './ui-sidebar.js';
import { initWorkspace } from './ui-workspace.js';
import { initGallery } from './ui-gallery.js';

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initWorkspace();
  initGallery();
  initPanelTabs();
});

function initPanelTabs() {
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // 태깅 칩 토글
  document.querySelectorAll('.tag-chips').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.tag-chip');
      if (!chip) return;
      chip.classList.toggle('selected');
    });
  });

  // 커스텀 태그 Enter
  const customInput = document.getElementById('custom-tag-input');
  const customList = document.getElementById('custom-tag-list');
  if (customInput) {
    customInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !customInput.value.trim()) return;
      e.preventDefault();
      const tag = document.createElement('button');
      tag.className = 'tag-chip selected';
      tag.textContent = customInput.value.trim();
      tag.addEventListener('click', () => tag.remove());
      customList.appendChild(tag);
      customInput.value = '';
    });
  }
}
