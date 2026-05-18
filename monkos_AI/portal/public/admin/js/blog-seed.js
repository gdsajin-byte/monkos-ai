/* blog-seed.js — 시드 카탈로그 모듈 (ESM, v2.0) */
import { showToast } from './admin-common.js';

let seedCatalog = [];

export async function loadSeedCatalog() {
  try {
    const r = await fetch('/admin/data/episode_catalog.json');
    seedCatalog = await r.json();
    renderSeeds(seedCatalog);
  } catch (err) {
    document.getElementById('seedList').innerHTML = '<div style="text-align:center;color:var(--text-dim);font-size:12px;padding:20px">카탈로그 로드 실패</div>';
  }
}

function filterSeeds() {
  const query = document.getElementById('seedSearch').value.toLowerCase();
  const cat = document.getElementById('seedCatFilter').value;
  const filtered = seedCatalog.filter(ep => {
    if (cat && ep.category !== cat) return false;
    if (query) {
      const text = (ep.title + ' ' + ep.summary + ' ' + ep.insight).toLowerCase();
      if (!text.includes(query)) return false;
    }
    return true;
  });
  renderSeeds(filtered);
}

function renderSeeds(episodes) {
  const sorted = [...episodes].sort((a, b) => b.blogScore - a.blogScore);
  const list = document.getElementById('seedList');
  if (sorted.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--text-dim);font-size:12px;padding:20px">결과 없음</div>';
    return;
  }
  list.innerHTML = sorted.map(ep => {
    const stars = '\u2605'.repeat(ep.blogScore);
    return `<div class="seed-item${ep.used ? ' used' : ''}" onclick="showSeedDetail('${ep.id}')">
      <div class="seed-item-header">
        <span class="seed-score">${stars}</span>
        <span class="seed-id">${ep.id}</span>
        <span class="seed-cat ${ep.category}">${ep.category}</span>
      </div>
      <div class="seed-title">${ep.title}</div>
      <div class="seed-insight">${ep.insight}</div>
    </div>`;
  }).join('');
}

function showSeedDetail(id) {
  const ep = seedCatalog.find(e => e.id === id);
  if (!ep) return;
  const stars = '\u2605'.repeat(ep.blogScore) + '\u2606'.repeat(5 - ep.blogScore);
  const rstars = '\u2605'.repeat(ep.researchScore) + '\u2606'.repeat(5 - ep.researchScore);
  const overlay = document.createElement('div');
  overlay.className = 'seed-popup-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `<div class="seed-popup">
    <h3>${ep.title}</h3>
    <div class="seed-popup-meta">
      <span class="seed-cat ${ep.category}" style="font-size:12px;padding:2px 8px">${ep.category}</span>
      <span>${ep.id}</span>
      <span>${ep.period}</span>
    </div>
    <div class="seed-popup-field">
      <label>요약</label>
      <p>${ep.summary}</p>
    </div>
    <div class="seed-popup-field">
      <label>핵심 인사이트</label>
      <p>${ep.insight}</p>
    </div>
    <div class="seed-popup-field">
      <label>적합도</label>
      <p>블로그 ${stars} &nbsp; 연구서 ${rstars}</p>
    </div>
    <div class="seed-popup-actions">
      <button class="btn btn-secondary btn-sm" onclick="this.closest('.seed-popup-overlay').remove()">닫기</button>
      <button class="btn btn-success btn-sm" onclick="useSeedAsContent('${ep.id}')">글감으로 사용</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function useSeedAsContent(id) {
  const ep = seedCatalog.find(e => e.id === id);
  if (!ep) return;
  const titleEl = document.getElementById('title');
  if (!titleEl.value.trim()) {
    titleEl.value = ep.title;
    titleEl.dispatchEvent(new Event('input'));
  }
  document.querySelector('.seed-popup-overlay')?.remove();
  showToast('글감 삽입 완료');
}

// onclick 전역 등록
window.filterSeeds = filterSeeds;
window.showSeedDetail = showSeedDetail;
window.useSeedAsContent = useSeedAsContent;
