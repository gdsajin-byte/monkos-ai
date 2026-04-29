/**
 * profiles/ui-sidebar.js — 좌측 사이드바: 용도 칩 + 카테고리 탭
 * 용도 선택 → 마스터 갤러리 자동 활성화 + 필터
 */

import { state, updateState, onStateChange } from './state.js';

export function initSidebar() {
  initPurposeChips();
  initCategoryTabs();

  onStateChange((key) => {
    if (key === 'masterRef' || key === 'overrides') updateCategoryDots();
  });
}

function initPurposeChips() {
  document.querySelectorAll('.opt-chips[data-field="purpose"]').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.opt-chip');
      if (!chip) return;
      group.querySelectorAll('.opt-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      updateState('purpose', chip.dataset.val);

      const tabs = document.getElementById('category-tabs');
      tabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      const masterTab = tabs.querySelector('[data-cat="master"]');
      if (masterTab) masterTab.classList.add('active');
      updateState('activeCategory', 'master');
    });
  });
}

function initCategoryTabs() {
  const tabs = document.getElementById('category-tabs');
  tabs.addEventListener('click', e => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;

    const cat = tab.dataset.cat;
    const isActive = tab.classList.contains('active');

    tabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));

    if (isActive) {
      updateState('activeCategory', null);
    } else {
      tab.classList.add('active');
      updateState('activeCategory', cat);
    }
  });
}

function updateCategoryDots() {
  const dotMaster = document.getElementById('dot-master');
  if (dotMaster) {
    dotMaster.classList.toggle('has-ref', !!state.masterRef);
  }

  for (const cat of ['fashion', 'hair', 'makeup', 'background']) {
    const dot = document.getElementById(`dot-${cat}`);
    if (dot) {
      dot.classList.toggle('has-ref', !!state.overrides[cat]);
    }
  }
}
