/* ═══ MONKOS Crop — Step Navigation + Landing Pages ═══ */

// ─── i18n ───
const LANG = (() => {
  const l = (localStorage.getItem('monkos_lang') || navigator.language || 'ko').slice(0, 2);
  return ['ko', 'ja', 'en'].includes(l) ? l : 'en';
})();

const I18N = {
  ko: {
    passport: '여권', visa: '비자', id_card: '신분증', resume: '이력서', custom: '커스텀',
    country: '국가', select_country: '국가 선택...', search_country: '국가 검색...',
    custom_size: '커스텀 사이즈', apply_custom: '커스텀 사이즈 적용',
    size: '사이즈', output: '출력', dpi: '해상도', background: '배경', standard: '표준',
    face_size: '얼굴 크기', eye_pos: '눈 위치',
    ai_warn: '⚠️ 이 국가는 AI 보정이 금지되어 있습니다',
    official_source: '공식 규정 보기', use_this_spec: '이 규격으로 크롭 →',
    upload_photo: '사진 업로드', take_photo: '촬영하기', choose_from_gallery: '갤러리에서 선택',
    photo_tips: '촬영 팁',
    tip1: '밝은 곳에서 촬영', tip2: '흰색 또는 단색 배경',
    tip3: '모자, 선글라스 금지', tip4: '정면 응시, 입 다물기',
    tip5: '어깨선까지 보이게', tip6: '그림자 없이 균일한 조명',
    select_spec: '규격 선택', white: '흰색', blue_bg: '파란색',
    eye_no_spec: '공식 규정 없음',
  },
  ja: {
    passport: 'パスポート', visa: 'ビザ', id_card: '身分証', resume: '履歴書', custom: 'カスタム',
    country: '国', select_country: '国を選択...', search_country: '国を検索...',
    custom_size: 'カスタムサイズ', apply_custom: 'カスタムサイズ適用',
    size: 'サイズ', output: '出力', dpi: '解像度', background: '背景', standard: '規格',
    face_size: '顔のサイズ', eye_pos: '目の位置',
    ai_warn: '⚠️ この国ではAI加工が禁止されています',
    official_source: '公式規定を見る', use_this_spec: 'この規格でクロップ →',
    upload_photo: '写真アップロード', take_photo: '撮影する', choose_from_gallery: 'ギャラリーから選択',
    photo_tips: '撮影のコツ',
    tip1: '明るい場所で撮影', tip2: '白または無地の背景',
    tip3: '帽子・サングラス禁止', tip4: '正面を向いて口を閉じる',
    tip5: '肩まで見えるように', tip6: '影のない均一な照明',
    select_spec: '規格選択', white: '白', blue_bg: '青',
    eye_no_spec: '公式規定なし',
  },
  en: {
    passport: 'Passport', visa: 'Visa', id_card: 'ID Card', resume: 'Resume', custom: 'Custom',
    country: 'Country', select_country: 'Select country...', search_country: 'Search country...',
    custom_size: 'Custom Size', apply_custom: 'Apply Custom Size',
    size: 'Size', output: 'Output', dpi: 'DPI', background: 'Background', standard: 'Standard',
    face_size: 'Face size', eye_pos: 'Eye position',
    ai_warn: '⚠️ AI editing is prohibited for this country',
    official_source: 'Official source', use_this_spec: 'Use this specification →',
    upload_photo: 'Upload Photo', take_photo: 'Take Photo', choose_from_gallery: 'Choose from Gallery',
    photo_tips: 'Photo Tips',
    tip1: 'Take in a well-lit area', tip2: 'White or solid-color background',
    tip3: 'No hats or sunglasses', tip4: 'Face forward, mouth closed',
    tip5: 'Shoulders visible', tip6: 'Even lighting, no shadows',
    select_spec: 'Select Specification', white: 'White', blue_bg: 'Blue',
    eye_no_spec: 'No official spec',
  }
};

function t(key) { return I18N[LANG]?.[key] || I18N.en[key] || key; }
function nameL(nameObj) { return nameObj?.[LANG] || nameObj?.en || nameObj?.ko || ''; }

// ─── State ───
let specsData = null;
let selectedPurpose = 'passport';
let selectedCountry = null;
let selectedDoc = null;
let currentStep = 1;
let bgRemovedImg = null;

// Group + country → actual standard name
const STANDARD_NAMES = {
  A: 'ICAO 9303',
  B: {
    korea: 'KS', japan: 'JIS', china: 'GA/T 922', vietnam: 'TCVN',
    thailand: 'TIS', indonesia: 'SNI', philippines: 'PSA',
    _default: 'National',
  },
  C: {
    us: 'DOS', india: 'BIS', uk: 'HMPO', canada: 'IRCC',
    australia: 'DFAT', germany: 'BSI TR', france: 'ANTS',
    _default: 'National',
  },
};

function getStandardName(group, countryId) {
  if (!group) return '—';
  if (group === 'A') return STANDARD_NAMES.A;
  const map = STANDARD_NAMES[group];
  if (!map) return group;
  return map[countryId] || map._default || group;
}

// Purpose → specs-data type mapping
const PURPOSE_TYPES = {
  passport: ['passport'],
  visa: ['visa'],
  id: ['national_id', 'drivers_license', 'residence_card'],
  resume: ['resume', 'headshot'],
};

// ─── Data Loading ───
async function loadSpecs() {
  try {
    const res = await fetch('data/specs-data-v2.json');
    specsData = await res.json();
  } catch (e) {
    console.warn('[specs] Load failed, using empty data');
    specsData = { countries: [] };
  }
}

// ─── Step Navigation ───
function goStep(n) {
  currentStep = n;
  document.querySelectorAll('.step-page').forEach(p => p.classList.remove('active'));
  document.getElementById(`stepPage${n}`).classList.add('active');
  document.querySelectorAll('.step-bar-item').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === n);
    el.classList.toggle('done', i + 1 < n);
  });
  document.querySelectorAll('.btn-back').forEach(b => {
    b.classList.toggle('hidden', n <= 1);
  });
  window.scrollTo(0, 0);
}

// ─── Step 1: Purpose + Country Dropdown ───

function getFilteredCountries(purpose, filter = '') {
  const types = PURPOSE_TYPES[purpose];
  if (!types) return specsData.countries;
  const f = filter.toLowerCase();
  return specsData.countries.filter(c => {
    const hasType = c.documents.some(d => types.includes(d.type));
    if (!hasType) return false;
    if (!f) return true;
    return nameL(c.name).toLowerCase().includes(f) ||
           c.name.en.toLowerCase().includes(f) || c.id.includes(f);
  });
}

function getMatchingDoc(country, purpose) {
  const types = PURPOSE_TYPES[purpose];
  if (!types) return country.documents[0];
  return country.documents.find(d => types.includes(d.type)) || country.documents[0];
}

function renderDropdownItems(filter = '') {
  const items = document.getElementById('dropdownItems');
  const countries = selectedPurpose === 'custom'
    ? specsData.countries.filter(c => {
        const f = filter.toLowerCase();
        return !f || nameL(c.name).toLowerCase().includes(f) || c.name.en.toLowerCase().includes(f);
      })
    : getFilteredCountries(selectedPurpose, filter);

  items.innerHTML = countries.map(c => {
    const doc = getMatchingDoc(c, selectedPurpose);
    const sizeHint = doc?.size ? `${doc.size.w_mm}×${doc.size.h_mm}` : '';
    return `<div class="dropdown-item" data-id="${c.id}">
      <span class="dropdown-item-flag">${c.flag}</span>
      <span class="dropdown-item-name">${nameL(c.name)}</span>
      <span class="dropdown-item-sub">${sizeHint}</span>
    </div>`;
  }).join('');

  items.querySelectorAll('.dropdown-item').forEach(el => {
    el.addEventListener('click', () => {
      selectedCountry = specsData.countries.find(c => c.id === el.dataset.id);
      document.getElementById('dropdownFlag').textContent = selectedCountry.flag;
      document.getElementById('dropdownText').textContent = nameL(selectedCountry.name);
      document.getElementById('dropdownList').classList.add('hidden');

      if (selectedPurpose === 'custom') {
        document.getElementById('customSize').classList.remove('hidden');
        document.getElementById('specDetail').classList.add('hidden');
      } else {
        selectedDoc = getMatchingDoc(selectedCountry, selectedPurpose);
        showSpecDetail();
      }
    });
  });
}

function showSpecDetail() {
  if (!selectedCountry || !selectedDoc) return;
  const d = selectedDoc;
  const c = selectedCountry;
  const detail = document.getElementById('specDetail');
  detail.classList.remove('hidden');

  document.getElementById('specFlag').textContent = c.flag;
  document.getElementById('specCountryName').textContent = nameL(c.name);
  document.getElementById('specDocName').textContent = nameL(d.name);

  const w = d.size?.w_mm || 0;
  const h = d.size?.h_mm || 0;
  document.getElementById('specSize').textContent = `${w}×${h}mm`;

  const dpi = d.px?.dpi || 300;
  const pxW = d.px?.w || Math.round(w / 25.4 * dpi);
  const pxH = d.px?.h || Math.round(h / 25.4 * dpi);
  document.getElementById('specPx').textContent = `${pxW}×${pxH}px`;
  document.getElementById('specDpi').textContent = `${dpi}dpi`;

  const bgMap = { white: t('white'), blue: t('blue_bg') };
  document.getElementById('specBg').textContent = bgMap[d.background] || d.background || t('white');
  document.getElementById('specStandard').textContent = getStandardName(d.group, c.id);

  const faceInfo = document.getElementById('specFaceInfo');
  faceInfo.classList.remove('hidden');

  if (d.headHeight?.min_mm) {
    document.getElementById('specFaceRange').textContent = `${d.headHeight.min_mm}–${d.headHeight.max_mm}mm`;
  } else {
    document.getElementById('specFaceRange').textContent = '—';
  }

  const eyeEl = document.getElementById('specEyeRange');
  if (d.eyePosition) {
    const ep = d.eyePosition;
    if (ep.min_pct != null && ep.max_pct != null) {
      const topMin = 100 - ep.max_pct;
      const topMax = 100 - ep.min_pct;
      eyeEl.textContent = `${topMin}–${topMax}% (from top)`;
    } else if (ep.approx_pct != null) {
      const topApprox = 100 - ep.approx_pct;
      eyeEl.textContent = `~${topApprox}% (from top)`;
    }
  } else {
    eyeEl.textContent = t('eye_no_spec');
  }

  const aiWarn = document.getElementById('specAiWarn');
  aiWarn.classList.toggle('hidden', !d.aiRestriction);

  const source = document.getElementById('specSource');
  if (d.officialSource) {
    source.classList.remove('hidden');
    source.href = d.officialSource;
  } else {
    source.classList.add('hidden');
  }
}

function injectSpec() {
  if (!selectedDoc?.size) return;
  const d = selectedDoc;
  const hh = d.headHeight || {};
  const faceMin = hh.min_mm || 32;
  const faceMax = hh.max_mm || 36;
  const faceTarget = Math.round((faceMin + faceMax) / 2);
  const wMm = d.size.w_mm;
  const hMm = d.size.h_mm;
  const dpi = d.px?.dpi || 300;
  const pxW = d.px?.w || Math.round(wMm / 25.4 * dpi);
  const pxH = d.px?.h || Math.round(hMm / 25.4 * dpi);

  const newSpec = {
    id: d.id, label: nameL(d.name),
    wMm, hMm, faceMin, faceMax, faceTarget,
    topDefault: 5, bottomDefault: 6, pxW, pxH, warn: '',
  };

  if (typeof window.setCropSpecPassport === 'function') {
    window.setCropSpecPassport(newSpec);
  }
}

function injectCustomSpec(wMm, hMm) {
  const dpi = 300;
  const pxW = Math.round(wMm / 25.4 * dpi);
  const pxH = Math.round(hMm / 25.4 * dpi);
  const newSpec = {
    id: 'custom', label: `${wMm}×${hMm}mm`,
    wMm, hMm, faceMin: 24, faceMax: 40, faceTarget: 32,
    topDefault: 5, bottomDefault: 6, pxW, pxH, warn: '',
  };
  selectedDoc = { id: 'custom', name: { ko: `커스텀 ${wMm}×${hMm}`, en: `Custom ${wMm}×${hMm}` }, size: { w_mm: wMm, h_mm: hMm }, px: { w: pxW, h: pxH, dpi } };
  if (typeof window.setCropSpecPassport === 'function') {
    window.setCropSpecPassport(newSpec);
  }
}

// ─── Step 2 ───

function renderStep2() {
  if (!selectedDoc) return;
  const badge = document.getElementById('uploadSpecBadge');
  const c = selectedCountry;
  const d = selectedDoc;
  const flag = c?.flag || '📐';
  const name = nameL(d.name);
  const size = d.size ? `${d.size.w_mm}×${d.size.h_mm}mm` : '';
  badge.textContent = `${flag} ${name} · ${size}`;
}

function handleStepUpload(file) {
  if (!file) return;
  const fileInput = document.getElementById('fileInput');
  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));

  goStep(3);
  const badge = document.getElementById('cropSpecBadge');
  if (selectedCountry && selectedDoc) {
    badge.textContent = `${selectedCountry.flag} ${nameL(selectedDoc.name)} · ${selectedDoc.size?.w_mm}×${selectedDoc.size?.h_mm}mm`;
  }

  setTimeout(() => {
    if (typeof reset === 'function') reset('passport');
  }, 500);
}

// ─── BG Removal + Download (unchanged logic) ───

async function performBGRemoval() {
  const spinner = document.getElementById('bgSpinner');
  const canvas = document.getElementById('bgCanvas');
  spinner.classList.remove('hidden');

  const cropCanvas = document.createElement('canvas');
  if (typeof getSpec === 'function' && typeof loadedImg !== 'undefined' && loadedImg) {
    const spec = getSpec();
    const fw = getFW();
    const outScale = spec.pxH / FH;
    cropCanvas.width = spec.pxW;
    cropCanvas.height = spec.pxH;
    const ctx = cropCanvas.getContext('2d');
    ctx.scale(outScale, outScale);
    ctx.translate(fw / 2 + imgPos.x, FH / 2 + imgPos.y);
    ctx.scale(imgScale, imgScale);
    ctx.translate(-fw / 2, -FH / 2);
    const natW = loadedImg.naturalWidth;
    const natH = loadedImg.naturalHeight;
    const coverScale = Math.max(fw / natW, FH / natH);
    const dw = natW * coverScale;
    const dh = natH * coverScale;
    ctx.drawImage(loadedImg, (fw - dw) / 2, (FH - dh) / 2, dw, dh);
  } else {
    cropCanvas.width = 413; cropCanvas.height = 531;
    cropCanvas.getContext('2d').fillStyle = '#FFFFFF';
    cropCanvas.getContext('2d').fillRect(0, 0, 413, 531);
  }

  canvas.width = cropCanvas.width;
  canvas.height = cropCanvas.height;
  canvas.getContext('2d').drawImage(cropCanvas, 0, 0);

  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
    const removeBackground = mod.removeBackground || mod.default?.removeBackground || mod.default;
    const blob = await new Promise(r => cropCanvas.toBlob(r, 'image/png'));
    const result = await removeBackground(blob);
    const resultImg = new Image();
    resultImg.onload = () => {
      bgRemovedImg = resultImg;
      const ctx = canvas.getContext('2d');
      const bgColor = document.querySelector('.bg-c.active')?.dataset.color || '#FFFFFF';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resultImg, 0, 0);
      spinner.classList.add('hidden');
    };
    resultImg.src = URL.createObjectURL(result);
  } catch (err) {
    console.warn('[BG] Removal failed:', err.message);
    spinner.classList.add('hidden');
  }
}

function downloadFinal() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas?.width) return;
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    const w = selectedDoc?.px?.w || selectedDoc?.size?.w_mm || 413;
    const h = selectedDoc?.px?.h || selectedDoc?.size?.h_mm || 531;
    a.download = `MONKOS_crop_${selectedDoc?.id || 'photo'}_${w}x${h}.jpg`;
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, 'image/jpeg', 0.95);
}

// ─── i18n DOM Application ───
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) el.textContent = text;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text) el.placeholder = text;
  });
}

// ─── Scale Slider ───
function initScaleSlider() {
  const slider = document.getElementById('scaleSlider');
  const valEl = document.getElementById('scaleSliderVal');
  if (!slider) return;

  slider.addEventListener('input', () => {
    const newScale = parseFloat(slider.value) / 100;
    if (typeof window.applyScale === 'function') window.applyScale(newScale);
    valEl.textContent = `x${newScale.toFixed(2)}`;
  });

  const badgeScale = document.getElementById('badgeScale');
  if (badgeScale) {
    new MutationObserver(() => {
      const match = badgeScale.textContent.match(/x([\d.]+)/);
      if (match) {
        slider.value = Math.round(parseFloat(match[1]) * 100);
        valEl.textContent = `x${parseFloat(match[1]).toFixed(2)}`;
      }
    }).observe(badgeScale, { childList: true, characterData: true, subtree: true });
  }
}

// ─── Init ───
async function init() {
  await loadSpecs();
  applyI18n();

  // Purpose buttons
  document.querySelectorAll('.purpose-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPurpose = btn.dataset.purpose;
      selectedCountry = null;
      selectedDoc = null;
      document.getElementById('dropdownFlag').textContent = '🌍';
      document.getElementById('dropdownText').textContent = t('select_country');
      document.getElementById('specDetail').classList.add('hidden');
      document.getElementById('customSize').classList.toggle('hidden', selectedPurpose !== 'custom');
      document.getElementById('countryDropdown').classList.toggle('hidden', selectedPurpose === 'custom' && !selectedCountry);
      if (selectedPurpose === 'custom') {
        document.getElementById('countryDropdown').classList.remove('hidden');
      }
    });
  });

  // Country dropdown toggle
  document.getElementById('countrySelect').addEventListener('click', () => {
    const list = document.getElementById('dropdownList');
    const isHidden = list.classList.contains('hidden');
    list.classList.toggle('hidden');
    if (isHidden) {
      renderDropdownItems();
      document.getElementById('countrySearch').focus();
    }
  });

  // Country search
  document.getElementById('countrySearch').addEventListener('input', e => {
    renderDropdownItems(e.target.value);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.country-dropdown')) {
      document.getElementById('dropdownList').classList.add('hidden');
    }
  });

  // Spec confirm → Step 2
  document.getElementById('specConfirm').addEventListener('click', () => {
    injectSpec();
    goStep(2);
    renderStep2();
  });

  // Custom apply
  document.getElementById('customApply').addEventListener('click', () => {
    const w = parseInt(document.getElementById('customW').value);
    const h = parseInt(document.getElementById('customH').value);
    if (w > 0 && h > 0) {
      injectCustomSpec(w, h);
      goStep(2);
      renderStep2();
    }
  });

  // Step 2: Camera + Gallery
  const stepFileInput = document.getElementById('stepFileInput');
  const cameraInput = document.getElementById('cameraInput');

  document.getElementById('btnGallery').addEventListener('click', () => stepFileInput.click());
  document.getElementById('btnCamera').addEventListener('click', () => cameraInput.click());

  stepFileInput.addEventListener('change', e => handleStepUpload(e.target.files[0]));
  cameraInput.addEventListener('change', e => handleStepUpload(e.target.files[0]));

  // Step 3 → Step 4
  const btnNextBG = document.getElementById('btnNextBG');
  if (btnNextBG) {
    btnNextBG.addEventListener('click', () => {
      goStep(4);
      performBGRemoval();
    });
  }

  // Step 4: BG color buttons
  document.querySelectorAll('.bg-c').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bg-c').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const canvas = document.getElementById('bgCanvas');
      if (canvas.width > 0 && bgRemovedImg) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = btn.dataset.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgRemovedImg, 0, 0);
      }
    });
  });

  // Step 4 → Step 5
  const btnBGDone = document.getElementById('btnBGDone');
  if (btnBGDone) {
    btnBGDone.addEventListener('click', () => {
      goStep(5);
      const doneSpec = document.getElementById('doneSpec');
      doneSpec.textContent = selectedDoc
        ? `${selectedCountry?.flag || ''} ${nameL(selectedDoc.name)} · ${selectedDoc.size?.w_mm}×${selectedDoc.size?.h_mm}mm`
        : '';
      const src = document.getElementById('bgCanvas');
      const dst = document.getElementById('doneCanvas');
      dst.width = src.width; dst.height = src.height;
      dst.getContext('2d').drawImage(src, 0, 0);
    });
  }

  // Step 5: Download + Crop Another
  const btnDL = document.getElementById('btnDownloadFinal');
  if (btnDL) btnDL.addEventListener('click', downloadFinal);

  const btnAnother = document.getElementById('btnCropAnother');
  if (btnAnother) {
    btnAnother.addEventListener('click', () => {
      selectedCountry = null; selectedDoc = null;
      document.getElementById('dropdownFlag').textContent = '🌍';
      document.getElementById('dropdownText').textContent = t('select_country');
      document.getElementById('specDetail').classList.add('hidden');
      goStep(1);
    });
  }

  // Step bar: click completed steps to navigate back
  document.querySelectorAll('.step-bar-item').forEach(el => {
    el.addEventListener('click', () => {
      const step = parseInt(el.dataset.step);
      if (step < currentStep) goStep(step);
    });
  });

  // Back buttons
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 1) goStep(currentStep - 1);
    });
  });

  initScaleSlider();
}

init();
