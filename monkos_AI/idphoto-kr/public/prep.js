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
import { normalizeUpload, pickImage, UploadError, UPLOAD_MESSAGES } from './modules/upload.js';
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
  format: { passport: '여권/신분증', id: '증명사진' },
  gender: { f: '여성', m: '남성' },
  age: { baby: '영유아', child: '어린이', teen: '중고생', adult: '성인' },
  clothing: { default: '그대로', change: '의상변경', casual: '캐주얼', suit: '정장' },
  clothingColor: {
    skyblue: '하늘색', pink: '핑크', lemon: '레몬', green: '그린',
    beige: '베이지', blue: '블루', wine: '와인',
  },
  suitColor: { navy: '네이비', brown: '브라운', gray: '그레이', black: '블랙' },
  shirtColor: { white: '화이트', lightblue: '연블루', lightpink: '연핑크', lightbeige: '연베이지' },
  tieColor: { notie: '노타이', navy: '네이비', wine: '와인', black: '블랙' },
  tiePattern: { solid: '민무늬', stripe: '스트라이프' },
  hair: { default: '그대로', tidy: '깔끔 정리', updo: '올림머리' },
  bgColor: { white: '흰색', gray: '회색', blue: '파랑', beige: '베이지' },
};

const FORMAT_ICONS = { passport: '🛡️', id: '📋' };
const GENDER_ICONS = { f: '👩', m: '👨' };
const AGE_ICONS = { baby: '👶', child: '🧒', teen: '🎒', adult: '🙂' };

const FORMAT_DESC = {
  passport: '3.5×4.5cm · 흰색 배경 고정',
  id: '3×4cm 반명함 · 배경 선택 가능',
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
    btnPrev.textContent = idx === 0 ? '← 돌아가기' : '이전';
  }
  if (btnNext) {
    btnNext.style.display = idx === 3 ? 'none' : '';
    btnNext.textContent = '다음';
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
      <p class="prep-desc">용도에 맞는 정확한 증명사진 촬영을 위해<br>규격과 성별, 연령대를 선택해 주세요</p>
      <h2 class="prep-question">규격을 선택해 주세요</h2>
      <div class="prep-cards prep-cards-col" id="formatCards">
        ${makeCard('passport', FORMAT_ICONS.passport, '여권 / 신분증', FORMAT_DESC.passport)}
        ${makeCard('id', FORMAT_ICONS.id, '증명사진', FORMAT_DESC.id)}
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
    if (typeof gtag === 'function') gtag('event', 'spec_select', { spec_type: store.format, auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr' });
  });
}

// ─── 2p: 성별 + 연령 ───

function renderProfilePage() {
  const el = document.getElementById('page-profile');
  if (!el) return;

  el.innerHTML = `
    <div class="prep-page-inner">
      <div class="prep-label">STEP 2</div>
      <h2 class="prep-question">성별과 연령을 선택해 주세요</h2>
      <div class="prep-group-label">성별</div>
      <div class="prep-cards prep-cards-row" id="genderCards">
        ${V5_OPTIONS.gender.map(g => makeCard(g, GENDER_ICONS[g], LABELS.gender[g], '')).join('')}
      </div>
      <div class="prep-group-label" style="margin-top:24px;">연령</div>
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
    <h2 class="prep-question">스타일을 선택해 주세요</h2>
    <div class="prep-accordion-list">`;

  // 의상 아코디언
  html += renderAccordionItem('clothing', '👕 의상', getClothingSummary());
  // 헤어 아코디언 (teen/adult만)
  if (showHair) {
    html += renderAccordionItem('hair', '💇 헤어', LABELS.hair[store.hair] || '그대로');
  }
  // 배경 아코디언
  html += renderAccordionItem('bg', '🎨 배경', bgLocked
    ? '흰색 (여권 고정)'
    : (LABELS.bgColor[store.bgColor] || '흰색'));

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
  let txt = LABELS.clothing[c] || '그대로';
  if (c === 'change' || c === 'casual') {
    if (store.clothingColor) txt += ' · ' + (LABELS.clothingColor[store.clothingColor] || store.clothingColor);
  }
  if (c === 'suit') {
    txt += ' · ' + (LABELS.suitColor[store.suitColor] || '네이비');
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

  let html = '<div class="prep-sub-label">컬러 선택</div>';
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
  html += '<div class="prep-sub-label">수트 컬러</div>';
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
  html += '<div class="prep-sub-label">셔츠 컬러</div>';
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
  html += '<div class="prep-sub-label">넥타이</div>';
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
    html += '<div class="prep-sub-label">넥타이 무늬</div>';
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
    return '<div class="prep-locked-msg">여권/신분증 배경은 흰색으로 고정됩니다</div>';
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
  rows.push(confirmRow(FORMAT_ICONS[store.format] || '📋', '규격', LABELS.format[store.format] || '-', 0));

  // 성별 + 연령
  const genderAge = `${LABELS.gender[store.gender] || '-'} · ${LABELS.age[store.age] || '-'}`;
  rows.push(confirmRow(GENDER_ICONS[store.gender] || '👤', '인물', genderAge, 1));

  // 의상
  let clothingText = LABELS.clothing[store.clothing] || '그대로';
  if (store.clothing === 'change' || store.clothing === 'casual') {
    if (store.clothingColor) clothingText += ' · ' + (LABELS.clothingColor[store.clothingColor] || '');
  }
  if (store.clothing === 'suit') {
    clothingText = `정장 · ${LABELS.suitColor[store.suitColor] || '네이비'}`;
    if (store.tieColor && store.tieColor !== 'notie') {
      clothingText += ` · ${LABELS.tieColor[store.tieColor]} ${LABELS.tiePattern[store.tiePattern] || ''}`;
    }
  }
  rows.push(confirmRow('👔', '의상', clothingText, 2));

  // 헤어 (teen/adult만)
  if (HAIR_VISIBLE_AGES.includes(store.age)) {
    rows.push(confirmRow('💇', '헤어', LABELS.hair[store.hair] || '그대로', 2));
  }

  // 배경
  const bgText = store.format === 'passport' ? '흰색 (여권 고정)' : (LABELS.bgColor[store.bgColor] || '흰색');
  rows.push(confirmRow('🎨', '배경', bgText, 2));

  // 코칭 멘트
  let coachingNote = '';
  if (store.age === 'baby') coachingNote = '아이를 안고 촬영해도 됩니다';
  else if (store.age === 'child') coachingNote = '정면을 바라보도록 유도해 주세요';
  else if (store.format === 'passport') coachingNote = '눈썹 · 이마가 보이도록 준비해 주세요';
  else coachingNote = '좋은 인상의 표정으로 촬영해 주세요';

  el.innerHTML = `
    <div class="prep-page-inner">
      <div class="prep-label">CONFIRM</div>
      <h2 class="prep-question">촬영 정보 확인</h2>
      <div class="prep-summary">
        <div class="prep-summary-list">${rows.join('')}</div>
        <div class="prep-summary-note">${coachingNote}</div>
      </div>
      <button class="prep-start" onclick="startShooting()">
        촬영 시작하기 <span class="prep-start-arrow">&rarr;</span>
      </button>
      <button class="prep-upload" type="button" onclick="startUpload()">갤러리에서 사진 올리기</button>
      <div class="prep-upload-msg" id="prep-upload-msg" role="alert" hidden></div>
      <button class="prep-reset" onclick="resetAll()">처음부터 다시 선택</button>
    </div>
  `;
}

function confirmRow(icon, label, value, pageIdx) {
  return `
    <div class="prep-summary-item" onclick="jumpTo(${pageIdx})">
      <span class="prep-summary-icon">${icon}</span>
      <span class="prep-summary-label">${label}</span>
      <span class="prep-summary-value">${value}</span>
      <span class="prep-summary-edit">수정</span>
    </div>`;
}

// ─── 촬영 시작 ───

function startShooting() {
  const btn = document.querySelector('.prep-start');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> 준비 중...';
  }

  saveSelections();
  navigateTo('camera.html');
}

// ─── 사진 올리기(11-05 작가님 — 촬영 강제 해제): 고른 사진을 촬영과 같은 규격으로 맞춰 분석실로 ───

let uploadInput = null;
async function startUpload() {
  const msg = document.getElementById('prep-upload-msg');
  const btn = document.querySelector('.prep-upload');
  if (msg) { msg.hidden = true; msg.textContent = ''; }
  saveSelections();  // 설정 저장은 촬영과 동일하게 먼저
  if (!uploadInput) {
    uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'image/*';  // capture 속성 없음 — 카메라 강제 아님
    uploadInput.hidden = true;
    document.body.appendChild(uploadInput);
  }
  const file = await pickImage(uploadInput);
  if (!file) return;
  if (btn) { btn.disabled = true; btn.textContent = '사진 여는 중...'; }
  try {
    const { dataURL } = await normalizeUpload(file);
    // 이전 결과물 제거 — 촬영실 init 과 같은 처리(촬영실을 거치지 않으므로 여기서). 옛 결과가 새 사진에 붙지 않게
    sessionStorage.removeItem('monkos_generated');
    sessionStorage.removeItem('monkos_image');
    saveSessionData('captured', dataURL);
    if (typeof gtag === 'function') gtag('event', 'photo_upload', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', capture_mode: 'upload' });
    Monk.log('사진 올리기 완료 → 분석실 이동');
    navigateTo('result.html');
  } catch (e) {
    const code = e instanceof UploadError ? e.code : 'decode';
    if (msg) { msg.textContent = UPLOAD_MESSAGES[code] || UPLOAD_MESSAGES.decode; msg.hidden = false; }
    Monk.log('사진 올리기 실패: ' + code);
    if (btn) { btn.disabled = false; btn.textContent = '갤러리에서 사진 올리기'; }
  }
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
  nextPage, prevPage, startShooting, startUpload, resetAll, jumpTo,
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

  Monk.log('v5 퍼널 초기화 완료 (4페이지)');
}

init();
