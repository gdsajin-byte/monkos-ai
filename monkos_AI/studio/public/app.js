/**
 * app.js — MONKOS Studio v2 SPA
 * 3컬럼 레이아웃: 사이드바(퍼널) + 워크스페이스(Before/After) + 아카이브(Phase C)
 *
 * 통합 범위:
 *  - v1 app.js (파일 업로드, 드래그앤드롭)
 *  - v1 result.js (/api/idgen 호출, 비교 컷 Canvas 합성)
 *  - idphoto-kr prep.js (퍼널 옵션 아코디언, 조건부 렌더링)
 */

// ─── 상수 (idphoto-kr config.js 이식) ───

const V5_OPTIONS = {
  format: ['passport', 'id'],
  gender: ['f', 'm'],
  age: ['baby', 'child', 'teen', 'adult'],
  clothing: ['default', 'change', 'casual', 'suit'],
  clothingColor: {
    child: ['skyblue', 'pink', 'lemon', 'green'],
    adult: ['beige', 'blue', 'wine', 'green'],
  },
  suitColor: ['navy', 'brown', 'gray', 'black'],
  shirtColor: ['white', 'lightblue', 'lightpink', 'lightbeige'],
  tieColor: ['notie', 'navy', 'wine', 'black'],
  tiePattern: ['solid', 'stripe'],
  hair: ['default', 'tidy', 'updo'],
  bgColor: ['white', 'gray', 'blue', 'beige'],
};

const CLOTHING_BY_AGE = {
  baby: ['default', 'change'],
  child: ['default', 'change'],
  teen: ['default', 'casual', 'suit'],
  adult: ['default', 'casual', 'suit'],
};

const HAIR_VISIBLE_AGES = ['teen', 'adult'];
const PASSPORT_FORCED_BG = 'white';

const LABELS = {
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

const COLOR_MAP = {
  skyblue: '#87CEEB', pink: '#FFB6C1', lemon: '#FFF44F', green: '#90EE90',
  beige: '#D4B896', blue: '#4A90D9', wine: '#722f37',
  navy: '#1b2a4a', brown: '#8B4513', gray: '#9CA3AF', black: '#1a1a1a',
  white: '#f0f0f0', lightblue: '#ADD8E6', lightpink: '#FFB6C1', lightbeige: '#F5DEB3',
};

// ─── 상태 ───

const state = {
  base64Image: null,
  generatedImage: null,
  format: 'passport',
  gender: 'f',
  age: 'adult',
  clothing: 'default',
  clothingColor: '',
  suitColor: 'navy',
  shirtColor: 'white',
  tieColor: 'navy',
  tiePattern: 'solid',
  hair: 'default',
  bgColor: 'white',
};

let openAccordion = null;

// ─── DOM ───

const fileDrop = document.getElementById('file-drop');
const fileInput = document.getElementById('file-input');
const sidebarPreview = document.getElementById('sidebar-preview');
const previewImg = document.getElementById('preview-img');
const fileInfo = document.getElementById('file-info');
const btnChange = document.getElementById('btn-change');
const styleSection = document.getElementById('style-section');
const btnGenerate = document.getElementById('btn-generate');
const imgBefore = document.getElementById('img-before');
const phBefore = document.getElementById('ph-before');
const imgAfter = document.getElementById('img-after');
const phAfter = document.getElementById('ph-after');
const loadingOverlay = document.getElementById('loading-overlay');
const progressFill = document.getElementById('progress-fill');
const btnRetry = document.getElementById('btn-retry');
const btnDlAfter = document.getElementById('btn-dl-after');
const btnDlCompare = document.getElementById('btn-dl-compare');

// ─── 파일 입력 ───

fileDrop.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

fileDrop.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileDrop.classList.add('dragover');
});

fileDrop.addEventListener('dragleave', () => {
  fileDrop.classList.remove('dragover');
});

fileDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  fileDrop.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

function handleFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('10MB 이하 이미지만 업로드 가능합니다.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    state.base64Image = e.target.result;
    showFilePreview(file);
  };
  reader.readAsDataURL(file);
}

function showFilePreview(file) {
  previewImg.src = state.base64Image;
  fileInfo.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  fileDrop.style.display = 'none';
  sidebarPreview.classList.add('active');

  imgBefore.src = state.base64Image;
  imgBefore.style.display = '';
  phBefore.style.display = 'none';

  updateGenerateButton();
}

btnChange.addEventListener('click', () => {
  state.base64Image = null;
  fileInput.value = '';
  fileDrop.style.display = '';
  sidebarPreview.classList.remove('active');
  imgBefore.style.display = 'none';
  phBefore.style.display = '';
  updateGenerateButton();
});

// ─── 기본 옵션 칩 (규격/성별/연령) ───

document.querySelectorAll('.opt-chips').forEach(group => {
  const field = group.dataset.field;
  group.addEventListener('click', (e) => {
    const chip = e.target.closest('.opt-chip');
    if (!chip) return;

    group.querySelectorAll('.opt-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');

    const prevVal = state[field];
    state[field] = chip.dataset.val;

    if (field === 'age' && prevVal !== state.age) {
      state.clothing = 'default';
      state.clothingColor = '';
      state.suitColor = 'navy';
      state.shirtColor = 'white';
      state.tieColor = 'navy';
      state.tiePattern = 'solid';
      state.hair = 'default';
    }

    if (field === 'gender' && state.gender === 'f') {
      state.tieColor = 'notie';
      state.tiePattern = '';
    }

    if (field === 'format' && state.format === 'passport') {
      state.bgColor = PASSPORT_FORCED_BG;
    }

    renderStyleSection();
  });
});

// ─── 스타일 아코디언 렌더링 ───

function renderStyleSection() {
  const age = state.age;
  const showHair = HAIR_VISIBLE_AGES.includes(age);
  const bgLocked = state.format === 'passport';

  if (bgLocked) state.bgColor = PASSPORT_FORCED_BG;

  let html = '<div class="acc-list">';
  html += renderAccordion('clothing', '👕 의상', getClothingSummary(), false);
  if (showHair) {
    html += renderAccordion('hair', '💇 헤어', LABELS.hair[state.hair] || '그대로', false);
  }
  html += renderAccordion('bg', '🎨 배경',
    bgLocked ? '흰색 (여권 고정)' : (LABELS.bgColor[state.bgColor] || '흰색'),
    bgLocked
  );
  html += '</div>';
  styleSection.innerHTML = html;
}

function getClothingSummary() {
  const c = state.clothing;
  let txt = LABELS.clothing[c] || '그대로';
  if (c === 'change' || c === 'casual') {
    if (state.clothingColor) txt += ' · ' + (LABELS.clothingColor[state.clothingColor] || '');
  }
  if (c === 'suit') {
    txt += ' · ' + (LABELS.suitColor[state.suitColor] || '네이비');
  }
  return txt;
}

function renderAccordion(group, title, summary, locked) {
  const isOpen = openAccordion === group;
  const arrow = isOpen ? '▲' : '▼';

  let bodyHtml = '';
  if (isOpen && !locked) {
    if (group === 'clothing') bodyHtml = renderClothingBody();
    else if (group === 'hair') bodyHtml = renderHairBody();
    else if (group === 'bg') bodyHtml = renderBgBody();
  }

  return `
    <div class="acc-item${isOpen ? ' open' : ''}">
      <div class="acc-header${locked ? ' acc-locked' : ''}" data-group="${group}">
        <span class="acc-title">${title}</span>
        <span class="acc-summary">${summary}</span>
        <span class="acc-arrow">${arrow}</span>
      </div>
      ${isOpen && !locked ? `<div class="acc-body">${bodyHtml}</div>` : ''}
    </div>`;
}

function renderClothingBody() {
  const allowed = CLOTHING_BY_AGE[state.age] || ['default'];

  let html = '<div class="acc-cards">';
  allowed.forEach(val => {
    const sel = state.clothing === val ? ' selected' : '';
    html += `<button class="acc-card${sel}" data-val="${val}" data-field="clothing">
      <div class="acc-card-title">${LABELS.clothing[val]}</div>
    </button>`;
  });
  html += '</div>';

  if (state.clothing === 'change' || state.clothing === 'casual') {
    html += renderColorSuboption();
  } else if (state.clothing === 'suit') {
    html += renderSuitSuboption();
  }

  return html;
}

function renderColorSuboption() {
  const isChild = ['baby', 'child'].includes(state.age);
  const colors = isChild ? V5_OPTIONS.clothingColor.child : V5_OPTIONS.clothingColor.adult;

  let html = '<div class="sub-label">컬러 선택</div><div class="acc-cards">';
  colors.forEach(val => {
    const sel = state.clothingColor === val ? ' selected' : '';
    html += `<button class="acc-card${sel}" data-val="${val}" data-field="clothingColor">
      <span class="color-chip" style="background:${COLOR_MAP[val] || '#888'}"></span>
      <div class="acc-card-title">${LABELS.clothingColor[val] || val}</div>
    </button>`;
  });
  html += '</div>';
  return html;
}

function renderSuitSuboption() {
  let html = '';

  const FEMALE_STYLE_LABELS = {
    navy: '모던 (네이비)', brown: '모던 (브라운)',
    gray: '프로페셔널 (그레이)', black: '클래식 (블랙)',
  };
  const isFemale = state.gender === 'f';
  const suitLabel = isFemale ? '스타일' : '수트 컬러';

  html += `<div class="sub-label">${suitLabel}</div><div class="acc-cards">`;
  V5_OPTIONS.suitColor.forEach(val => {
    const sel = state.suitColor === val ? ' selected' : '';
    const label = isFemale ? (FEMALE_STYLE_LABELS[val] || LABELS.suitColor[val]) : LABELS.suitColor[val];
    html += `<button class="acc-card${sel}" data-val="${val}" data-field="suitColor">
      <span class="color-chip" style="background:${COLOR_MAP[val]}"></span>
      <div class="acc-card-title">${label}</div>
    </button>`;
  });
  html += '</div>';

  html += '<div class="sub-label">셔츠 컬러</div><div class="acc-cards">';
  V5_OPTIONS.shirtColor.forEach(val => {
    const sel = state.shirtColor === val ? ' selected' : '';
    html += `<button class="acc-card${sel}" data-val="${val}" data-field="shirtColor">
      <span class="color-chip" style="background:${COLOR_MAP[val]}"></span>
      <div class="acc-card-title">${LABELS.shirtColor[val]}</div>
    </button>`;
  });
  html += '</div>';

  if (state.gender !== 'f') {
    html += '<div class="sub-label">넥타이</div><div class="acc-cards">';
    V5_OPTIONS.tieColor.forEach(val => {
      const sel = state.tieColor === val ? ' selected' : '';
      const chipHtml = val === 'notie'
        ? '<div style="font-size:16px;margin-bottom:4px;">✕</div>'
        : `<span class="color-chip" style="background:${COLOR_MAP[val]}"></span>`;
      html += `<button class="acc-card${sel}" data-val="${val}" data-field="tieColor">
        ${chipHtml}
        <div class="acc-card-title">${LABELS.tieColor[val]}</div>
      </button>`;
    });
    html += '</div>';

    if (state.tieColor && state.tieColor !== 'notie') {
      html += '<div class="sub-label">넥타이 무늬</div><div class="acc-cards">';
      V5_OPTIONS.tiePattern.forEach(val => {
        const sel = state.tiePattern === val ? ' selected' : '';
        html += `<button class="acc-card${sel}" data-val="${val}" data-field="tiePattern">
          <div class="acc-card-title">${LABELS.tiePattern[val]}</div>
        </button>`;
      });
      html += '</div>';
    }
  }

  return html;
}

function renderHairBody() {
  let html = '<div class="acc-cards">';
  V5_OPTIONS.hair.forEach(val => {
    const sel = state.hair === val ? ' selected' : '';
    html += `<button class="acc-card${sel}" data-val="${val}" data-field="hair">
      <div class="acc-card-title">${LABELS.hair[val]}</div>
    </button>`;
  });
  html += '</div>';
  return html;
}

function renderBgBody() {
  if (state.format === 'passport') {
    return '<div class="locked-msg">여권/신분증 배경은 흰색으로 고정됩니다</div>';
  }

  let html = '<div class="acc-cards">';
  V5_OPTIONS.bgColor.forEach(val => {
    const sel = state.bgColor === val ? ' selected' : '';
    html += `<button class="acc-card${sel}" data-val="${val}" data-field="bgColor">
      <span class="color-chip" style="background:${COLOR_MAP[val]}"></span>
      <div class="acc-card-title">${LABELS.bgColor[val]}</div>
    </button>`;
  });
  html += '</div>';
  return html;
}

// ─── 스타일 이벤트 위임 (한 번만 등록) ───

styleSection.addEventListener('click', (e) => {
  const header = e.target.closest('.acc-header');
  if (header && !header.classList.contains('acc-locked')) {
    const group = header.dataset.group;
    openAccordion = openAccordion === group ? null : group;
    renderStyleSection();
    return;
  }

  const card = e.target.closest('.acc-card');
  if (!card) return;

  const field = card.dataset.field;
  const val = card.dataset.val;
  if (!field || !val) return;

  if (field === 'clothing') {
    const prev = state.clothing;
    state.clothing = val;
    if (prev !== val) {
      state.clothingColor = '';
      state.suitColor = 'navy';
      state.shirtColor = 'white';
      state.tieColor = 'navy';
      state.tiePattern = 'solid';
    }
    openAccordion = 'clothing';
    renderStyleSection();
    return;
  }

  if (field === 'tieColor') {
    state.tieColor = val;
    if (val === 'notie') state.tiePattern = '';
    else if (!state.tiePattern) state.tiePattern = 'solid';
    openAccordion = 'clothing';
    renderStyleSection();
    return;
  }

  state[field] = val;
  renderStyleSection();
});

// ─── 생성 버튼 ───

function updateGenerateButton() {
  btnGenerate.disabled = !state.base64Image;
}

btnGenerate.addEventListener('click', async () => {
  if (!state.base64Image) return;

  btnGenerate.disabled = true;
  btnGenerate.textContent = '생성 중...';

  imgAfter.style.display = 'none';
  phAfter.style.display = 'none';
  loadingOverlay.classList.add('active');

  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
  setTimeout(() => {
    progressFill.style.transition = 'width 15s ease-out';
    progressFill.style.width = '90%';
  }, 100);

  const base64 = state.base64Image.includes(',')
    ? state.base64Image.split(',')[1]
    : state.base64Image;

  try {
    const res = await fetch('/api/idgen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        format: state.format,
        gender: state.gender,
        age: state.age,
        clothing: state.clothing,
        clothingColor: state.clothingColor,
        suitColor: state.suitColor,
        shirtColor: state.shirtColor,
        tieColor: state.tieColor,
        tiePattern: state.tiePattern,
        hair: state.hair,
        bgColor: state.format === 'passport' ? 'white' : state.bgColor,
        v: 5,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `API 에러 (${res.status})`);
    }

    const data = await res.json();
    state.generatedImage = data.image;

    progressFill.style.transition = 'width 0.5s ease';
    progressFill.style.width = '100%';

    setTimeout(() => showResult(), 500);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    phAfter.style.display = '';
    phAfter.textContent = '생성 실패: ' + err.message;
    phAfter.style.color = '#ef4444';
    btnGenerate.disabled = false;
    btnGenerate.textContent = '생성';
  }
});

function showResult() {
  loadingOverlay.classList.remove('active');
  imgAfter.src = state.generatedImage;
  imgAfter.style.display = '';
  phAfter.style.display = 'none';

  btnRetry.disabled = false;
  btnDlAfter.disabled = false;
  btnDlCompare.disabled = false;
  btnGenerate.disabled = false;
  btnGenerate.textContent = '생성';
}

// ─── 다시 하기 ───

btnRetry.addEventListener('click', () => {
  state.generatedImage = null;
  imgAfter.style.display = 'none';
  phAfter.style.display = '';
  phAfter.textContent = '생성 대기';
  phAfter.style.color = '';

  btnRetry.disabled = true;
  btnDlAfter.disabled = true;
  btnDlCompare.disabled = true;
});

// ─── After 다운로드 ───

btnDlAfter.addEventListener('click', () => {
  if (!state.generatedImage) return;
  const link = document.createElement('a');
  link.href = state.generatedImage;
  link.download = `monkos_studio_${Date.now()}.png`;
  link.click();
});

// ─── 비교 컷 다운로드 (Canvas 합성 — result.js 이식) ───

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

btnDlCompare.addEventListener('click', async () => {
  if (!state.base64Image || !state.generatedImage) return;

  btnDlCompare.disabled = true;
  btnDlCompare.textContent = '합성 중...';

  try {
    const [imgA, imgB] = await Promise.all([
      loadImage(state.base64Image),
      loadImage(state.generatedImage),
    ]);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const h = 600;
    const wA = (imgA.width / imgA.height) * h;
    const wB = (imgB.width / imgB.height) * h;
    const gap = 20;
    const pad = 32;
    const totalW = wA + gap + wB + pad * 2;
    const brandH = 48;
    const totalH = h + pad * 2 + brandH;

    canvas.width = totalW;
    canvas.height = totalH;

    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, totalW, totalH);

    ctx.drawImage(imgA, pad, pad, wA, h);
    ctx.drawImage(imgB, pad + wA + gap, pad, wB, h);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Before', pad + wA / 2, pad + h + 22);
    ctx.fillText('After', pad + wA + gap + wB / 2, pad + h + 22);

    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MONKOS AI Studio  ·  monkos.ai', totalW / 2, totalH - 12);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.download = `monkos_compare_${Date.now()}.jpg`;
    link.click();

  } catch (e) {
    alert('비교 컷 합성 실패: ' + e.message);
  } finally {
    btnDlCompare.disabled = false;
    btnDlCompare.textContent = '비교 컷 다운로드';
  }
});

// ─── 초기화 ───

renderStyleSection();
