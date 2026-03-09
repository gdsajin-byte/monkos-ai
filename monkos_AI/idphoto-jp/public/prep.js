/**
 * prep.js — v5 퍼널 (4페이지 선형)
 * 1p: 규격 선택 (passport/id)
 * 2p: 성별 + 연령
 * 3p: 스타일 (아코디언: 의상/헤어/배경)
 * 4p: CONFIRM (요약 → 촬영 시작)
 */

import {
  store, Monk, sharedInit, saveSelections, clearSelections,
  saveSessionData, loadSessionData, navigateTo, SCHEMA_VERSION
} from './shared.js';
import { initChatbot } from './modules/chatbot.js';
import {
  V5_OPTIONS, CLOTHING_BY_AGE, HAIR_VISIBLE_AGES,
  PASSPORT_FORCED_BG, PHOTO_SPECS
} from './config.js';

// ─── 상태 ───
let currentPage = 0; // 0=format, 1=profile, 2=style, 3=confirm
const PAGES = ['format', 'profile', 'style', 'confirm'];
let openAccordion = null; // 현재 열린 아코디언: 'clothing' | 'hair' | 'bg' | null

// ─── 라벨 맵 ───
const LABELS = {
  format: { passport: 'パスポート/身分証', id: '証明写真' },
  gender: { f: '女性', m: '男性' },
  age: { baby: '乳幼児', child: '子供', teen: '中高生', adult: '大人' },
  clothing: { default: 'そのまま', change: '衣装変更', casual: 'カジュアル', suit: 'スーツ' },
  clothingColor: {
    skyblue: 'スカイブルー', pink: 'ピンク', lemon: 'レモン', green: 'グリーン',
    beige: 'ベージュ', blue: 'ブルー', wine: 'ワイン',
  },
  suitColor: { navy: 'ネイビー', brown: 'ブラウン', gray: 'グレー', black: 'ブラック' },
  shirtColor: { white: 'ホワイト', lightblue: 'ライトブルー', lightpink: 'ライトピンク', lightbeige: 'ライトベージュ' },
  tieColor: { notie: 'ノータイ', navy: 'ネイビー', wine: 'ワイン', black: 'ブラック' },
  tiePattern: { solid: '無地', stripe: 'ストライプ' },
  hair: { default: 'そのまま', tidy: 'きちんと整える', updo: 'アップスタイル' },
  bgColor: { white: '白', gray: 'グレー', blue: 'ブルー', beige: 'ベージュ' },
};

const FORMAT_ICONS = { passport: '🛡️', id: '📋' };
const GENDER_ICONS = { f: '👩', m: '👨' };
const AGE_ICONS = { baby: '👶', child: '🧒', teen: '🎒', adult: '🙂' };

const FORMAT_DESC = {
  passport: '3.5×4.5cm · 白背景固定',
  id: '3×4cm 証明写真 · 背景選択可能',
};

const COLOR_MAP = {
  skyblue: '#87CEEB', pink: '#FFB6C1', lemon: '#FFF44F', green: '#90EE90',
  beige: '#D4B896', blue: '#4A90D9', wine: '#722f37',
  navy: '#1b2a4a', brown: '#8B4513', gray: '#9CA3AF', black: '#1a1a1a',
  white: '#f0f0f0', lightblue: '#ADD8E6', lightpink: '#FFB6C1', lightbeige: '#F5DEB3',
};

// ─── 페이지 라우팅 ───

function showPage(idx) {
  currentPage = idx;
  const pages = document.querySelectorAll('.prep-page');
  pages.forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });

  // 프로그레스 업데이트
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  if (fill) fill.style.width = `${((idx + 1) / PAGES.length) * 100}%`;
  if (text) text.textContent = `${idx + 1} / ${PAGES.length}`;

  // 네비 버튼
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  if (btnPrev) {
    btnPrev.style.visibility = 'visible';
    btnPrev.textContent = idx === 0 ? '← 戻る' : '前へ';
  }
  if (btnNext) {
    btnNext.style.display = idx === 3 ? 'none' : '';
    btnNext.textContent = '次へ';
  }
}

function nextPage() {
  if (currentPage === 0 && !store.format) return;
  if (currentPage === 1 && (!store.gender || !store.age)) return;
  if (currentPage === 2) {
    // passport → bgColor 강제
    if (store.format === 'passport') store.bgColor = PASSPORT_FORCED_BG;
  }
  if (currentPage < PAGES.length - 1) {
    const next = currentPage + 1;
    if (next === 2) renderStylePage();
    if (next === 3) renderConfirmPage();
    showPage(next);
  }
}

function prevPage() {
  if (currentPage === 0) {
    navigateTo('index.html');
    return;
  }
  const prev = currentPage - 1;
  if (prev === 2) renderStylePage();
  showPage(prev);
}

// ─── 카드 선택 헬퍼 ───

function selectCard(container, val) {
  container.querySelectorAll('.prep-card').forEach(c => c.classList.remove('selected'));
  const target = container.querySelector(`[data-val="${val}"]`);
  if (target) target.classList.add('selected');
}

function makeCard(val, icon, title, desc, extraClass) {
  const cls = extraClass ? `prep-card ${extraClass}` : 'prep-card';
  const iconHtml = icon.startsWith('#')
    ? `<span class="prep-color-chip" style="background:${icon}"></span>`
    : `<div class="prep-card-icon">${icon}</div>`;
  const descHtml = desc ? `<div class="prep-card-desc">${desc}</div>` : '';
  return `<button class="${cls}" data-val="${val}">${iconHtml}<div class="prep-card-title">${title}</div>${descHtml}</button>`;
}

// ─── 1p: 규격 선택 ───

function renderFormatPage() {
  const el = document.getElementById('page-format');
  if (!el) return;

  el.innerHTML = `
    <div class="prep-page-inner">
      <div class="prep-label">STEP 1</div>
      <p class="prep-desc">用途に合った正確な証明写真撮影のため<br>規格と性別、年齢を選択してください</p>
      <h2 class="prep-question">規格を選択してください</h2>
      <div class="prep-cards prep-cards-col" id="formatCards">
        ${makeCard('passport', FORMAT_ICONS.passport, 'パスポート / 身分証', FORMAT_DESC.passport)}
        ${makeCard('id', FORMAT_ICONS.id, '証明写真', FORMAT_DESC.id)}
      </div>
    </div>
  `;

  const container = document.getElementById('formatCards');
  if (store.format) selectCard(container, store.format);

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.prep-card');
    if (!card) return;
    store.format = card.dataset.val;
    selectCard(container, store.format);
  });
}

// ─── 2p: 성별 + 연령 ───

function renderProfilePage() {
  const el = document.getElementById('page-profile');
  if (!el) return;

  el.innerHTML = `
    <div class="prep-page-inner">
      <div class="prep-label">STEP 2</div>
      <h2 class="prep-question">性別と年齢を選択してください</h2>
      <div class="prep-group-label">性別</div>
      <div class="prep-cards prep-cards-row" id="genderCards">
        ${V5_OPTIONS.gender.map(g => makeCard(g, GENDER_ICONS[g], LABELS.gender[g], '')).join('')}
      </div>
      <div class="prep-group-label" style="margin-top:24px;">年齢</div>
      <div class="prep-cards prep-cards-row2" id="ageCards">
        ${V5_OPTIONS.age.map(a => makeCard(a, AGE_ICONS[a], LABELS.age[a], '')).join('')}
      </div>
    </div>
  `;

  const genderContainer = document.getElementById('genderCards');
  const ageContainer = document.getElementById('ageCards');

  if (store.gender) selectCard(genderContainer, store.gender);
  if (store.age) selectCard(ageContainer, store.age);

  genderContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.prep-card');
    if (!card) return;
    store.gender = card.dataset.val;
    selectCard(genderContainer, store.gender);
  });

  ageContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.prep-card');
    if (!card) return;
    const prevAge = store.age;
    store.age = card.dataset.val;
    selectCard(ageContainer, store.age);
    // 연령 변경 시 clothing 초기화
    if (prevAge !== store.age) {
      store.clothing = 'default';
      store.clothingColor = '';
      store.suitColor = '';
      store.shirtColor = '';
      store.tieColor = '';
      store.tiePattern = '';
      store.hair = 'default';
    }
  });
}

// ─── 3p: 스타일 (아코디언) ───

function renderStylePage() {
  const el = document.getElementById('page-style');
  if (!el) return;

  const age = store.age;
  const fmt = store.format;
  const allowedClothing = CLOTHING_BY_AGE[age] || ['default'];
  const showHair = HAIR_VISIBLE_AGES.includes(age);
  const bgLocked = fmt === 'passport';

  // passport 강제
  if (bgLocked) store.bgColor = PASSPORT_FORCED_BG;

  let html = `<div class="prep-page-inner">
    <div class="prep-label">STEP 3</div>
    <h2 class="prep-question">スタイルを選択してください</h2>
    <div class="prep-accordion-list">`;

  // 의상 아코디언
  html += renderAccordionItem('clothing', '👕 衣装', getClothingSummary());
  // 헤어 아코디언 (teen/adult만)
  if (showHair) {
    html += renderAccordionItem('hair', '💇 ヘア', LABELS.hair[store.hair] || 'そのまま');
  }
  // 배경 아코디언
  html += renderAccordionItem('bg', '🎨 背景', bgLocked
    ? '白（パスポート固定）'
    : (LABELS.bgColor[store.bgColor] || '白'));

  html += `</div></div>`;
  el.innerHTML = html;

  // 아코디언 토글 이벤트
  el.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const group = header.dataset.group;
      if (openAccordion === group) {
        openAccordion = null;
      } else {
        openAccordion = group;
      }
      renderStylePage();
    });
  });
}

function getClothingSummary() {
  const c = store.clothing;
  let txt = LABELS.clothing[c] || 'そのまま';
  if (c === 'change' || c === 'casual') {
    if (store.clothingColor) txt += ' · ' + (LABELS.clothingColor[store.clothingColor] || store.clothingColor);
  }
  if (c === 'suit') {
    txt += ' · ' + (LABELS.suitColor[store.suitColor] || 'ネイビー');
  }
  return txt;
}

function renderAccordionItem(group, title, summary) {
  const isOpen = openAccordion === group;
  const openCls = isOpen ? ' open' : '';
  const arrow = isOpen ? '▲' : '▼';
  const isBgLocked = group === 'bg' && store.format === 'passport';

  let bodyHtml = '';
  if (isOpen) {
    if (group === 'clothing') bodyHtml = renderClothingBody();
    else if (group === 'hair') bodyHtml = renderHairBody();
    else if (group === 'bg') bodyHtml = renderBgBody();
  }

  return `
    <div class="accordion-item${openCls}">
      <div class="accordion-header" data-group="${group}"${isBgLocked ? ' style="opacity:0.5;pointer-events:none;"' : ''}>
        <span class="accordion-title">${title}</span>
        <span class="accordion-summary">${summary}</span>
        <span class="accordion-arrow">${arrow}</span>
      </div>
      ${isOpen ? `<div class="accordion-body">${bodyHtml}</div>` : ''}
    </div>`;
}

function renderClothingBody() {
  const age = store.age;
  const allowed = CLOTHING_BY_AGE[age] || ['default'];

  let html = '<div class="prep-cards prep-cards-row2" id="clothingCards">';
  allowed.forEach(val => {
    const sel = store.clothing === val ? ' selected' : '';
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="clothing">
      <div class="prep-card-title">${LABELS.clothing[val]}</div>
    </button>`;
  });
  html += '</div>';

  // 서브옵션
  if (store.clothing === 'change' || store.clothing === 'casual') {
    html += renderColorSuboption();
  } else if (store.clothing === 'suit') {
    html += renderSuitSuboption();
  }

  return html;
}

function renderColorSuboption() {
  const isChild = ['baby', 'child'].includes(store.age);
  const colors = isChild ? V5_OPTIONS.clothingColor.child : V5_OPTIONS.clothingColor.adult;

  let html = '<div class="prep-sub-label">カラー選択</div>';
  html += '<div class="prep-cards prep-cards-grid" id="clothingColorCards">';
  colors.forEach(val => {
    const sel = store.clothingColor === val ? ' selected' : '';
    const bg = COLOR_MAP[val] || '#888';
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="clothingColor">
      <span class="prep-color-chip" style="background:${bg}"></span>
      <div class="prep-card-title">${LABELS.clothingColor[val] || val}</div>
    </button>`;
  });
  html += '</div>';
  return html;
}

function renderSuitSuboption() {
  let html = '';

  // 수트 컬러
  html += '<div class="prep-sub-label">スーツカラー</div>';
  html += '<div class="prep-cards prep-cards-grid" id="suitColorCards">';
  V5_OPTIONS.suitColor.forEach(val => {
    const sel = store.suitColor === val ? ' selected' : '';
    const bg = COLOR_MAP[val] || '#888';
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="suitColor">
      <span class="prep-color-chip" style="background:${bg}"></span>
      <div class="prep-card-title">${LABELS.suitColor[val]}</div>
    </button>`;
  });
  html += '</div>';

  // 셔츠 컬러
  html += '<div class="prep-sub-label">シャツカラー</div>';
  html += '<div class="prep-cards prep-cards-grid" id="shirtColorCards">';
  V5_OPTIONS.shirtColor.forEach(val => {
    const sel = store.shirtColor === val ? ' selected' : '';
    const bg = COLOR_MAP[val] || '#888';
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="shirtColor">
      <span class="prep-color-chip" style="background:${bg}"></span>
      <div class="prep-card-title">${LABELS.shirtColor[val]}</div>
    </button>`;
  });
  html += '</div>';

  // 타이 컬러
  html += '<div class="prep-sub-label">ネクタイ</div>';
  html += '<div class="prep-cards prep-cards-grid" id="tieColorCards">';
  V5_OPTIONS.tieColor.forEach(val => {
    const sel = store.tieColor === val ? ' selected' : '';
    const icon = val === 'notie' ? '✕' : '';
    const bg = val === 'notie' ? '' : (COLOR_MAP[val] || '#888');
    const chipHtml = bg
      ? `<span class="prep-color-chip" style="background:${bg}"></span>`
      : `<div class="prep-card-icon">${icon}</div>`;
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="tieColor">
      ${chipHtml}
      <div class="prep-card-title">${LABELS.tieColor[val]}</div>
    </button>`;
  });
  html += '</div>';

  // 타이 패턴 (notie가 아닐 때만)
  if (store.tieColor && store.tieColor !== 'notie') {
    html += '<div class="prep-sub-label">ネクタイ柄</div>';
    html += '<div class="prep-cards prep-cards-row" id="tiePatternCards">';
    V5_OPTIONS.tiePattern.forEach(val => {
      const sel = store.tiePattern === val ? ' selected' : '';
      html += `<button class="prep-card${sel}" data-val="${val}" data-field="tiePattern">
        <div class="prep-card-title">${LABELS.tiePattern[val]}</div>
      </button>`;
    });
    html += '</div>';
  }

  return html;
}

function renderHairBody() {
  let html = '<div class="prep-cards prep-cards-row" id="hairCards">';
  V5_OPTIONS.hair.forEach(val => {
    const sel = store.hair === val ? ' selected' : '';
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="hair">
      <div class="prep-card-title">${LABELS.hair[val]}</div>
    </button>`;
  });
  html += '</div>';
  return html;
}

function renderBgBody() {
  if (store.format === 'passport') {
    return '<div class="prep-locked-msg">パスポート/身分証の背景は白に固定されます</div>';
  }

  let html = '<div class="prep-cards prep-cards-grid" id="bgColorCards">';
  V5_OPTIONS.bgColor.forEach(val => {
    const sel = store.bgColor === val ? ' selected' : '';
    const bg = COLOR_MAP[val] || '#888';
    html += `<button class="prep-card${sel}" data-val="${val}" data-field="bgColor">
      <span class="prep-color-chip" style="background:${bg}"></span>
      <div class="prep-card-title">${LABELS.bgColor[val]}</div>
    </button>`;
  });
  html += '</div>';
  return html;
}

// ─── 스타일 페이지 카드 클릭 위임 ───

function handleStyleClick(e) {
  const card = e.target.closest('.prep-card');
  if (!card) return;
  const field = card.dataset.field;
  const val = card.dataset.val;
  if (!field || !val) return;

  if (field === 'clothing') {
    const prevClothing = store.clothing;
    store.clothing = val;
    // clothing 변경 시 서브옵션 초기화
    if (prevClothing !== val) {
      store.clothingColor = '';
      store.suitColor = '';
      store.shirtColor = '';
      store.tieColor = '';
      store.tiePattern = '';
      // suit 디폴트
      if (val === 'suit') {
        store.suitColor = 'navy';
        store.shirtColor = 'white';
        store.tieColor = 'navy';
        store.tiePattern = 'solid';
      }
    }
    openAccordion = 'clothing';
    renderStylePage();
    return;
  }

  if (field === 'tieColor') {
    store.tieColor = val;
    if (val === 'notie') store.tiePattern = '';
    else if (!store.tiePattern) store.tiePattern = 'solid';
    openAccordion = 'clothing';
    renderStylePage();
    return;
  }

  // 일반 필드
  store[field] = val;
  // 해당 카드 그룹에서 선택 토글
  const container = card.closest('.prep-cards');
  if (container) selectCard(container, val);
}

// ─── 4p: CONFIRM ───

function renderConfirmPage() {
  const el = document.getElementById('page-confirm');
  if (!el) return;

  const rows = [];

  // 규격
  rows.push(confirmRow(FORMAT_ICONS[store.format] || '📋', '規格', LABELS.format[store.format] || '-', 0));

  // 성별 + 연령
  const genderAge = `${LABELS.gender[store.gender] || '-'} · ${LABELS.age[store.age] || '-'}`;
  rows.push(confirmRow(GENDER_ICONS[store.gender] || '👤', '人物', genderAge, 1));

  // 의상
  let clothingText = LABELS.clothing[store.clothing] || 'そのまま';
  if (store.clothing === 'change' || store.clothing === 'casual') {
    if (store.clothingColor) clothingText += ' · ' + (LABELS.clothingColor[store.clothingColor] || '');
  }
  if (store.clothing === 'suit') {
    clothingText = `スーツ · ${LABELS.suitColor[store.suitColor] || 'ネイビー'}`;
    if (store.tieColor && store.tieColor !== 'notie') {
      clothingText += ` · ${LABELS.tieColor[store.tieColor]} ${LABELS.tiePattern[store.tiePattern] || ''}`;
    }
  }
  rows.push(confirmRow('👔', '衣装', clothingText, 2));

  // 헤어 (teen/adult만)
  if (HAIR_VISIBLE_AGES.includes(store.age)) {
    rows.push(confirmRow('💇', 'ヘア', LABELS.hair[store.hair] || 'そのまま', 2));
  }

  // 배경
  const bgText = store.format === 'passport' ? '白（パスポート固定）' : (LABELS.bgColor[store.bgColor] || '白');
  rows.push(confirmRow('🎨', '背景', bgText, 2));

  // 코칭 멘트
  let coachingNote = '';
  if (store.age === 'baby') coachingNote = 'お子様を抱いて撮影しても大丈夫です';
  else if (store.age === 'child') coachingNote = '正面を向くように誘導してください';
  else if (store.format === 'passport') coachingNote = '眉毛・額が見えるようにしてください';
  else coachingNote = '好印象の表情で撮影してください';

  el.innerHTML = `
    <div class="prep-page-inner">
      <div class="prep-label">CONFIRM</div>
      <h2 class="prep-question">撮影情報確認</h2>
      <div class="prep-summary">
        <div class="prep-summary-list">${rows.join('')}</div>
        <div class="prep-summary-note">${coachingNote}</div>
      </div>
      <button class="prep-start" onclick="startShooting()">
        撮影を始める <span class="prep-start-arrow">&rarr;</span>
      </button>
      <button class="prep-reset" onclick="resetAll()">最初から選び直す</button>
    </div>
  `;
}

function confirmRow(icon, label, value, pageIdx) {
  return `
    <div class="prep-summary-item" onclick="jumpTo(${pageIdx})">
      <span class="prep-summary-icon">${icon}</span>
      <span class="prep-summary-label">${label}</span>
      <span class="prep-summary-value">${value}</span>
      <span class="prep-summary-edit">修正</span>
    </div>`;
}

// ─── 촬영 시작 ───

function startShooting() {
  const btn = document.querySelector('.prep-start');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> 準備中...';
  }

  saveSelections();
  navigateTo('camera.html');
}

// ─── 리셋 ───

function resetAll() {
  clearSelections();
  renderFormatPage();
  renderProfilePage();
  showPage(0);
}

// ─── 페이지 점프 (CONFIRM에서 수정 클릭) ───

function jumpTo(pageIdx) {
  if (pageIdx === 2) renderStylePage();
  showPage(pageIdx);
}

// ─── window 노출 ───

Object.assign(window, {
  nextPage, prevPage, startShooting, resetAll, jumpTo,
});

// ─── 초기화 ───

async function init() {
  initChatbot();
  await sharedInit();

  store.step = 0;

  renderFormatPage();
  renderProfilePage();

  // 스타일 페이지 카드 클릭 위임
  const stylePage = document.getElementById('page-style');
  if (stylePage) {
    stylePage.addEventListener('click', handleStyleClick);
  }

  // 이전 방문 데이터가 있으면 CONFIRM 직행
  if (store.format && store.gender && store.age) {
    renderStylePage();
    renderConfirmPage();
    showPage(3);
  } else {
    showPage(0);
  }

  Monk.log('v5ファネル初期化完了（4ページ）');
}

init();
