/* blog-research.js — 리서치 탭 모듈 (ESM, v2.0) */
import { showToast, authFetch } from './admin-common.js';

let researchSource = 'news';
let researchPage = 1;
let researchQuery = '';
let researchResults = { news: [], blog: [], image: [] };
let _switchTab = null;

function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem('monkos_research_history') || '[]'); } catch { return []; }
}

function saveSearchHistory(query) {
  let history = getSearchHistory().filter(q => q !== query);
  history.unshift(query);
  history = history.slice(0, 5);
  localStorage.setItem('monkos_research_history', JSON.stringify(history));
  renderSearchHistory();
}

export function renderSearchHistory() {
  const el = document.getElementById('researchHistory');
  const history = getSearchHistory();
  if (history.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = history.map(q =>
    `<span class="research-history-item" onclick="document.getElementById('researchQuery').value='${q.replace(/'/g,"\\'")}';doResearch()">${q}</span>`
  ).join('');
}

function switchResearchSource(src) {
  researchSource = src;
  document.querySelectorAll('.research-source-toggle button').forEach(b => b.classList.toggle('active', b.dataset.src === src));
  researchPage = 1;
  if (researchQuery) doResearch();
}

async function doResearch(append) {
  const q = document.getElementById('researchQuery').value.trim();
  if (!q) return;
  researchQuery = q;
  if (!append) researchPage = 1;
  saveSearchHistory(q);

  const container = document.getElementById('researchResults');
  if (!append) container.innerHTML = '<div class="research-loading">검색 중...</div>';

  try {
    const start = (researchPage - 1) * 10 + 1;
    const r = await authFetch(`/api/admin/search?query=${encodeURIComponent(q)}&type=${researchSource}&start=${start}&display=10`);
    if (!r) return; // 401 리다이렉트됨
    const data = await r.json();

    if (!r.ok) {
      container.innerHTML = `<div class="research-loading" style="color:var(--danger)">${data.error || '검색 실패'}</div>`;
      return;
    }

    if (!append) researchResults[researchSource] = [];
    researchResults[researchSource] = researchResults[researchSource].concat(data.items || []);

    renderResearchResults(data.total);
  } catch (err) {
    container.innerHTML = `<div class="research-loading" style="color:var(--danger)">오류: ${err.message}</div>`;
  }
}

function renderResearchResults(total) {
  const container = document.getElementById('researchResults');
  const items = researchResults[researchSource];

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="research-loading">검색 결과가 없습니다</div>';
    return;
  }

  if (researchSource === 'image') {
    container.innerHTML = '<div class="research-copyright">저작권 주의: 오픈소스/CC 라이선스를 반드시 확인하세요. 이미지는 참조용이며 자동 저장되지 않습니다.</div>'
      + '<div class="research-img-grid">'
      + items.map((item, i) =>
        `<div class="research-img-item" onclick="showResearchImagePopup('${item.thumbnail || item.link}', '${(item.link || '').replace(/'/g,"\\'")}')"><img src="${item.thumbnail || item.link}" alt="${item.title}" loading="lazy"></div>`
      ).join('')
      + '</div>';
  } else {
    container.innerHTML = items.map(item => {
      const domain = extractDomain(item.link);
      const date = item.pubDate ? formatDate(item.pubDate) : '';
      return `<div class="research-item">
        <div class="research-item-title">${item.title}</div>
        <div class="research-item-meta">${date}${date && domain ? ' · ' : ''}${domain}</div>
        <div class="research-item-desc">${item.description}</div>
        <div class="research-item-actions">
          <button onclick="window.open('${item.link}','_blank')">열기 ↗</button>
          <button onclick="copyResearchRef('${item.title.replace(/'/g,"\\'")}', '${item.link}')">참조 📋</button>
        </div>
      </div>`;
    }).join('');
  }

  if (total && items.length < total) {
    container.innerHTML += `<button class="research-more" onclick="loadMoreResearch()">더보기... (${items.length}/${total})</button>`;
  }
}

function loadMoreResearch() {
  researchPage++;
  doResearch(true);
}

function showResearchImagePopup(imgUrl, sourceUrl) {
  const popup = document.createElement('div');
  popup.className = 'research-img-popup';
  popup.onclick = () => popup.remove();
  popup.innerHTML = `<img src="${imgUrl}" onclick="event.stopPropagation()"><div class="research-img-popup-src">${sourceUrl}</div>`;
  document.body.appendChild(popup);
}

function copyResearchRef(title, url) {
  navigator.clipboard.writeText(`${title}\n${url}`);
  showToast('참조 복사 완료');
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  } catch { return dateStr; }
}

/* 제목 자동 리서치 제안 (switchTab 파라미터 주입) */
export function initResearch(switchTabFn) {
  _switchTab = switchTabFn;
  renderSearchHistory();

  let suggestTimeout = null;
  document.getElementById('title').addEventListener('input', (e) => {
    if (suggestTimeout) clearTimeout(suggestTimeout);
    const title = e.target.value.trim();
    if (!title || title.length < 4) return;
    suggestTimeout = setTimeout(() => {
      const keywords = title.replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!keywords) return;
      showResearchSuggest(keywords);
    }, 1500);
  });
}

function showResearchSuggest(keywords) {
  let toast = document.getElementById('researchSuggestToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'researchSuggestToast';
    toast.className = 'research-suggest-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = '\uD83D\uDD0D "' + keywords.substring(0, 20) + (keywords.length > 20 ? '...' : '') + '" 리서치 검색';
  toast.onclick = () => {
    toast.classList.remove('show');
    document.getElementById('researchQuery').value = keywords;
    if (_switchTab) _switchTab('research');
    doResearch();
  };
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

// onclick 전역 등록
window.doResearch = doResearch;
window.switchResearchSource = switchResearchSource;
window.showResearchImagePopup = showResearchImagePopup;
window.copyResearchRef = copyResearchRef;
window.loadMoreResearch = loadMoreResearch;
