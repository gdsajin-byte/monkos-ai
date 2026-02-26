/**
 * prep.js — 준비실 (퍼널식 키오스크 9스텝 + FINAL)
 * Step 1: 용도 → 2: 연령 → 3: 성별 → 4: 의상 → 5: 의상컬러
 * → 6: 넥타이 → 7: 헤어 → 8: 배경 → 9: 표정 → FINAL: 확인
 */

import { store, Monk, TX, sharedInit, saveSessionData, loadSessionData, navigateTo } from './shared.js';

// ─── 상수 ───

const STEP_KEYS = [
  'purpose', 'age', 'gender', 'clothing', 'clothingColor',
  'tie', 'hair', 'background', 'expression',
];
const TOTAL_STEPS = STEP_KEYS.length;
const FINAL_STEP = TOTAL_STEPS + 1; // 10

const selections = {
  purpose: null, age: null, gender: null,
  clothing: null, clothingColor: null, tie: null,
  hair: null, background: null, expression: null,
};

// ─── 옵션 데이터 ───

const OPTIONS = {
  purpose: [
    { val: 'passport',       icon: '📋', title: '여권 / 신분증', desc: '규격 엄격 · 눈썹 이마 노출' },
    { val: 'student_id',     icon: '🎓', title: '학생증',        desc: '교복 권장 · 중간 자유도' },
    { val: 'employee_id',    icon: '🏢', title: '사원증',        desc: '정장 권장 · 중간 자유도' },
    { val: 'resume',         icon: '💼', title: '이력서',        desc: '호감형 · 높은 자유도' },
    { val: 'color_portrait', icon: '🎨', title: '컬러증명',      desc: '최대 자유도' },
  ],
  age: [
    { val: 'baby',       icon: '👶', title: '~36개월' },
    { val: 'preschool',  icon: '🧒', title: '4~7세' },
    { val: 'elementary', icon: '👦', title: '초등학생' },
    { val: 'teen',       icon: '🧑', title: '중고등학생' },
    { val: 'adult',      icon: '👤', title: '성인' },
  ],
  gender: [
    { val: 'male',   icon: '👨', title: '남성' },
    { val: 'female', icon: '👩', title: '여성' },
  ],
  clothing: [
    { val: 'as_is',   icon: '👕', title: '그대로' },
    { val: 'suit',    icon: '🤵', title: '정장' },
    { val: 'shirt',   icon: '👔', title: '셔츠 / 블라우스' },
    { val: 'casual',  icon: '🧥', title: '캐주얼' },
    { val: 'uniform', icon: '🎽', title: '교복' },
  ],
  clothingColor: [
    { val: 'black',    title: '검정',   color: '#1a1a1a' },
    { val: 'navy',     title: '네이비', color: '#1b2a4a' },
    { val: 'charcoal', title: '차콜',   color: '#4a4a4a' },
    { val: 'white',    title: '흰색',   color: '#f0f0f0' },
    { val: 'beige',    title: '베이지', color: '#d4b896' },
    { val: 'wine',     title: '와인',   color: '#722f37' },
    { val: 'pastel',   title: '파스텔', color: '#b8d4e3' },
  ],
  tie: [
    { val: 'none',         icon: '✕', title: '없음' },
    { val: 'solid_navy',   title: '무지 네이비',     color: '#1b2a4a' },
    { val: 'solid_wine',   title: '무지 와인',       color: '#722f37' },
    { val: 'stripe_blue',  title: '스트라이프 블루',  color: '#3b82f6' },
    { val: 'stripe_navy',  title: '스트라이프 네이비', color: '#1e3a5f' },
    { val: 'stripe_wine',  title: '스트라이프 와인',  color: '#8b3a4a' },
  ],
  hair: [
    { val: 'as_is', icon: '💇', title: '그대로' },
    { val: 'tidy',  icon: '✂️', title: '정돈' },
    { val: 'up',    icon: '💆', title: '올림머리' },
    { val: 'down',  icon: '🧑‍🦱', title: '내림머리' },
  ],
  background: [
    { val: 'white',  title: '흰색',   color: '#f0f0f0' },
    { val: 'blue',   title: '블루',   color: '#4a90d9' },
    { val: 'gray',   title: '그레이', color: '#9ca3af' },
    { val: 'beige',  title: '베이지', color: '#d4b896' },
    { val: 'pink',   title: '핑크',   color: '#f5a0b8' },
    { val: 'yellow', title: '옐로우', color: '#fbbf24' },
  ],
  expression: [
    { val: 'as_is',         icon: '🙂', title: '그대로' },
    { val: 'gentle_smile',  icon: '😊', title: '잔잔한 미소' },
    { val: 'neutral',       icon: '😐', title: '무표정' },
    { val: 'natural_smile', icon: '😄', title: '자연스러운 미소' },
    { val: 'bright_smile',  icon: '😁', title: '밝은 미소' },
  ],
};

// ─── 필터 테이블 ───

const AGE_FILTER = {
  passport:       ['baby', 'preschool', 'elementary', 'teen', 'adult'],
  student_id:     ['elementary', 'teen'],
  employee_id:    ['adult'],
  resume:         ['teen', 'adult'],
  color_portrait: ['baby', 'preschool', 'elementary', 'teen', 'adult'],
};

const CLOTHING_FILTER = {
  passport:       ['as_is', 'suit', 'shirt', 'casual'],
  student_id:     ['as_is', 'casual', 'uniform'],
  employee_id:    ['as_is', 'suit', 'shirt', 'casual'],
  resume:         ['as_is', 'suit', 'shirt'],
  color_portrait: ['as_is', 'suit', 'shirt', 'casual', 'uniform'],
};

const BG_FILTER = {
  passport:       [],
  student_id:     ['white', 'blue', 'gray'],
  employee_id:    ['white', 'blue', 'gray'],
  resume:         ['white', 'blue', 'gray', 'beige', 'pink'],
  color_portrait: ['white', 'blue', 'gray', 'beige', 'pink', 'yellow'],
};

const EXPR_FILTER = {
  passport:       ['as_is', 'gentle_smile', 'neutral'],
  student_id:     ['as_is', 'gentle_smile', 'neutral', 'natural_smile', 'bright_smile'],
  employee_id:    ['as_is', 'gentle_smile', 'neutral', 'natural_smile', 'bright_smile'],
  resume:         ['as_is', 'gentle_smile', 'neutral', 'natural_smile', 'bright_smile'],
  color_portrait: ['as_is', 'gentle_smile', 'neutral', 'natural_smile', 'bright_smile'],
};

// ─── 스텝 메타 ───

const STEP_META = {
  purpose:       { label: 'STEP 1', question: '어떤 사진이<br>필요하세요?', layout: 'column' },
  age:           { label: 'STEP 2', question: '연령대를<br>선택해 주세요', layout: 'column' },
  gender:        { label: 'STEP 3', question: '성별을<br>선택해 주세요', layout: 'row' },
  clothing:      { label: 'STEP 4', question: '의상 스타일을<br>선택해 주세요', layout: 'grid' },
  clothingColor: { label: 'STEP 5', question: '의상 컬러를<br>선택해 주세요', layout: 'grid' },
  tie:           { label: 'STEP 6', question: '넥타이를<br>선택해 주세요', layout: 'grid' },
  hair:          { label: 'STEP 7', question: '헤어 스타일을<br>선택해 주세요', layout: 'row2' },
  background:    { label: 'STEP 8', question: '배경색을<br>선택해 주세요', layout: 'grid' },
  expression:    { label: 'STEP 9', question: '표정을<br>선택해 주세요', layout: 'row2' },
};

// ─── 디폴트 테이블 (KR) ───

const DEFAULTS = {
  passport: {
    clothing: 'as_is', hair: 'as_is', background: 'white', expression: 'gentle_smile',
  },
  student_id: {
    clothing: 'as_is', hair: 'as_is', background: 'white', expression: 'gentle_smile',
  },
  employee_id: {
    _gender: {
      male:   { clothing: 'suit', clothingColor: 'navy', tie: 'stripe_navy', hair: 'as_is', background: 'white', expression: 'gentle_smile' },
      female: { clothing: 'as_is', hair: 'as_is', background: 'white', expression: 'gentle_smile' },
    },
  },
  resume: {
    _gender: {
      male:   { clothing: 'suit', clothingColor: 'navy', tie: 'stripe_navy', hair: 'as_is', expression: 'natural_smile' },
      female: { clothing: 'as_is', hair: 'as_is', expression: 'natural_smile' },
    },
  },
  color_portrait: {
    clothing: 'as_is', hair: 'as_is',
  },
};

// ─── 레거시 키 매핑 ───

const PURPOSE_TO_STYLE = {
  passport: 'id_photo', student_id: 'id_photo',
  employee_id: 'resume', resume: 'resume', color_portrait: 'resume',
};

const AGE_TO_LEGACY = {
  baby: 'child', preschool: 'child',
  elementary: 'teen', teen: 'teen',
  adult: 'adult',
};

// ─── 상태 ───

let currentStep = 1;
let activeSteps = []; // 스킵 제외한 실제 표시 스텝 번호 배열

// ─── 필터 엔진 ───

function getFilteredOptions(key) {
  const p = selections.purpose;
  if (!p) return OPTIONS[key] || [];
  const all = OPTIONS[key] || [];

  if (key === 'age')        return all.filter(o => (AGE_FILTER[p] || []).includes(o.val));
  if (key === 'clothing') {
    let filtered = all.filter(o => (CLOTHING_FILTER[p] || []).includes(o.val));
    // 연령 후필터: baby/preschool → as_is만 허용
    if (['baby', 'preschool'].includes(selections.age)) {
      filtered = filtered.filter(o => o.val === 'as_is');
    }
    return filtered;
  }
  if (key === 'clothingColor') {
    // 여권/신분증: 흰색 배경 고정 → 의상 흰색 불가
    if (['passport', 'student_id'].includes(p)) {
      return all.filter(o => o.val !== 'white');
    }
    return all;
  }
  if (key === 'hair') {
    // 연령별 헤어 필터
    if (selections.age === 'baby') {
      return all.filter(o => o.val === 'as_is');
    }
    if (selections.age === 'preschool') {
      return all.filter(o => ['as_is', 'tidy'].includes(o.val));
    }
    return all;
  }
  if (key === 'background') return all.filter(o => (BG_FILTER[p] || []).includes(o.val));
  if (key === 'expression') return all.filter(o => (EXPR_FILTER[p] || []).includes(o.val));
  return all;
}

// ─── 디폴트 엔진 ───

function getDefaultValue(key) {
  const p = selections.purpose;
  if (!p) return null;
  const d = DEFAULTS[p];
  if (!d) return null;

  // 성별 분기 디폴트
  if (d._gender) {
    const g = selections.gender;
    if (!g) return null;
    const gd = d._gender[g];
    return gd ? (gd[key] ?? null) : null;
  }
  return d[key] ?? null;
}

// ─── 스킵 엔진 ───

function shouldSkip(stepNum) {
  const key = STEP_KEYS[stepNum - 1];

  // STEP 2 (age): 사원증 → adult 자동세팅, 스킵
  if (key === 'age' && selections.purpose === 'employee_id') {
    selections.age = 'adult';
    return true;
  }

  // 연령 필터가 1개뿐이면 자동세팅 + 스킵
  if (key === 'age' && selections.purpose) {
    const filtered = getFilteredOptions('age');
    if (filtered.length === 1) {
      selections.age = filtered[0].val;
      return true;
    }
  }

  // STEP 5 (clothingColor): 의상 == as_is면 스킵
  if (key === 'clothingColor') {
    return selections.clothing === 'as_is' || !selections.clothing;
  }

  // STEP 6 (tie): baby/preschool 무조건 스킵, 그 외 남성 + (정장 or 셔츠)가 아니면 스킵
  if (key === 'tie') {
    if (['baby', 'preschool'].includes(selections.age)) return true;
    return selections.gender !== 'male' || !['suit', 'shirt'].includes(selections.clothing);
  }

  // STEP 8 (background): 여권/신분증은 흰색 고정 → 스킵
  if (key === 'background') {
    if (['passport', 'student_id', 'employee_id'].includes(selections.purpose)) {
      selections.background = 'white';
      return true;
    }
  }

  return false;
}

function computeActiveSteps() {
  activeSteps = [];
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    if (!shouldSkip(i)) activeSteps.push(i);
  }
  activeSteps.push(FINAL_STEP);
}

// ─── 다음 비스킵 스텝 찾기 ───

function getNextStep(from) {
  for (let i = from + 1; i <= TOTAL_STEPS; i++) {
    if (!shouldSkip(i)) return i;
  }
  return FINAL_STEP;
}

function getPrevStep(from) {
  for (let i = from - 1; i >= 1; i--) {
    if (!shouldSkip(i)) return i;
  }
  return 1;
}

// ─── 하류 선택 초기화 ───

function clearSelectionsAfter(stepNum) {
  for (let i = stepNum; i < TOTAL_STEPS; i++) {
    const key = STEP_KEYS[i];
    selections[key] = null;
  }
}

// ─── 비권장 체크 ───

function isWarning(key, val) {
  if (key === 'clothingColor' && ['passport', 'student_id'].includes(selections.purpose)) {
    return ['beige', 'pastel'].includes(val);
  }
  return false;
}

// ─── 렌더링 ───

function renderStep(stepNum) {
  const body = document.getElementById('kiosk-body');
  if (!body) return;

  const key = STEP_KEYS[stepNum - 1];
  const meta = STEP_META[key];
  const opts = getFilteredOptions(key);
  const def = getDefaultValue(key);
  const hasColorChip = ['clothingColor', 'tie', 'background'].includes(key);

  // 디폴트 미리 적용
  if (def && !selections[key]) {
    selections[key] = def;
  }

  let layoutClass = 'kiosk-cards';
  if (meta.layout === 'row') layoutClass = 'kiosk-cards kiosk-cards-row';
  if (meta.layout === 'row2') layoutClass = 'kiosk-cards kiosk-cards-row2';
  if (meta.layout === 'grid') layoutClass = 'kiosk-cards kiosk-cards-grid';

  let cardsHtml = opts.map(o => {
    const selected = selections[key] === o.val ? ' selected' : '';
    const warn = isWarning(key, o.val);
    const iconHtml = hasColorChip && o.color
      ? `<span class="kiosk-color-chip" style="background:${o.color}"></span>`
      : (o.icon ? `<div class="kiosk-card-icon">${o.icon}</div>` : '');
    const descHtml = o.desc ? `<div class="kiosk-card-desc">${o.desc}</div>` : '';
    const warnHtml = warn ? '<div class="kiosk-card-warning">배경과 유사 · 비권장</div>' : '';

    return `<button class="kiosk-card${selected}" data-key="${key}" data-val="${o.val}" onclick="kioskSelect(this)">
      ${iconHtml}
      <div class="kiosk-card-title">${o.title}</div>
      ${descHtml}${warnHtml}
    </button>`;
  }).join('');

  // 디폴트가 적용되어 있으면 [다음] 버튼 표시
  const showNext = def && selections[key] === def;
  const nextHtml = showNext
    ? '<button class="kiosk-next" onclick="kioskNext()">이대로 진행 <span>&rarr;</span></button>'
    : '';

  // baby일 때 성별 [건너뛰기]
  const showSkip = key === 'gender' && selections.age === 'baby';
  const skipHtml = showSkip
    ? '<button class="kiosk-skip" onclick="kioskSkipGender()">건너뛰기</button>'
    : '';

  body.innerHTML = `
    <div class="kiosk-step active kiosk-enter-forward" data-kiosk-step="${stepNum}">
      <div class="kiosk-step-inner">
        <div class="kiosk-label">${meta.label}</div>
        <h2 class="kiosk-question">${meta.question}</h2>
        <div class="${layoutClass}">${cardsHtml}</div>
        ${nextHtml}${skipHtml}
      </div>
    </div>
  `;
}

function renderFinal() {
  const body = document.getElementById('kiosk-body');
  if (!body) return;

  const items = [];
  const addItem = (icon, text, stepNum) => {
    if (text) items.push({ icon, text, stepNum });
  };

  const findTitle = (key, val) => {
    const opt = (OPTIONS[key] || []).find(o => o.val === val);
    return opt ? opt.title : val;
  };
  const findIcon = (key, val) => {
    const opt = (OPTIONS[key] || []).find(o => o.val === val);
    return opt?.icon || '';
  };
  const findColor = (key, val) => {
    const opt = (OPTIONS[key] || []).find(o => o.val === val);
    return opt?.color || '';
  };

  // 1. 용도
  addItem(findIcon('purpose', selections.purpose), findTitle('purpose', selections.purpose), 1);

  // 2. 연령 + 성별 (합쳐서 표시)
  const ageText = findTitle('age', selections.age);
  const genderText = selections.gender ? findTitle('gender', selections.gender) : '';
  const ageGender = genderText ? `${ageText} · ${genderText}` : ageText;
  addItem(findIcon('age', selections.age), ageGender, 2);

  // 3. 의상 + 컬러 (합쳐서 표시)
  if (selections.clothing) {
    const clothText = findTitle('clothing', selections.clothing);
    const colorText = selections.clothingColor ? findTitle('clothingColor', selections.clothingColor) : '';
    const colorChip = selections.clothingColor ? findColor('clothingColor', selections.clothingColor) : '';
    const chipHtml = colorChip ? `<span class="kiosk-summary-chip" style="background:${colorChip}"></span>` : '';
    addItem(findIcon('clothing', selections.clothing),
      colorText ? `${clothText} · ${colorText} ${chipHtml}` : clothText, 4);
  }

  // 4. 넥타이
  if (selections.tie && selections.tie !== 'none') {
    const tieColor = findColor('tie', selections.tie);
    const tieChip = tieColor ? `<span class="kiosk-summary-chip" style="background:${tieColor}"></span>` : '';
    addItem('👔', `${findTitle('tie', selections.tie)} ${tieChip}`, 6);
  }

  // 5. 헤어
  if (selections.hair) {
    addItem(findIcon('hair', selections.hair), findTitle('hair', selections.hair), 7);
  }

  // 6. 배경
  if (selections.background) {
    const bgColor = findColor('background', selections.background);
    const bgChip = bgColor ? `<span class="kiosk-summary-chip" style="background:${bgColor}"></span>` : '';
    addItem('🎨', `${findTitle('background', selections.background)} 배경 ${bgChip}`, 8);
  }

  // 7. 표정
  if (selections.expression) {
    addItem(findIcon('expression', selections.expression), findTitle('expression', selections.expression), 9);
  }

  const summaryHtml = items.map(item => `
    <div class="kiosk-summary-item" onclick="kioskJumpTo(${item.stepNum})">
      <span class="kiosk-summary-icon">${item.icon}</span>
      <span class="kiosk-summary-text">${item.text}</span>
      <span class="kiosk-summary-edit">수정</span>
    </div>
  `).join('');

  const noteText = ['passport', 'student_id'].includes(selections.purpose)
    ? '눈썹 · 이마가 보이도록 준비해 주세요'
    : '헤어와 의상을 깔끔하게 정돈해 주세요';

  body.innerHTML = `
    <div class="kiosk-step active kiosk-enter-forward" data-kiosk-step="${FINAL_STEP}">
      <div class="kiosk-step-inner">
        <div class="kiosk-label">CONFIRM</div>
        <h2 class="kiosk-question">촬영 정보 확인</h2>
        <div class="kiosk-summary">
          <div class="kiosk-summary-list">${summaryHtml}</div>
          <div class="kiosk-summary-note">${noteText}</div>
        </div>
        <button class="kiosk-start" onclick="startShooting()">
          촬영 시작하기 <span class="kiosk-start-arrow">&rarr;</span>
        </button>
        <button class="kiosk-reset" onclick="kioskReset()">처음부터 다시 선택</button>
      </div>
    </div>
  `;
}

function renderProgressDots() {
  const el = document.getElementById('kiosk-progress');
  if (!el) return;

  computeActiveSteps();
  const dotsHtml = activeSteps.map(s => {
    let cls = 'kiosk-dot';
    if (s === currentStep) cls += ' active';
    else if (s < currentStep) cls += ' done';
    return `<div class="${cls}"></div>`;
  }).join('');
  el.innerHTML = dotsHtml;
}

// ─── 네비게이션 ───

function goToStep(step, direction) {
  if (step < 1) return;

  const dir = direction || (step > currentStep ? 'forward' : 'backward');
  currentStep = step;

  if (step === FINAL_STEP) {
    renderFinal();
  } else {
    renderStep(step);
  }

  // 슬라이드 방향 적용
  const stepEl = document.querySelector('.kiosk-step');
  if (stepEl) {
    stepEl.classList.remove('kiosk-enter-forward', 'kiosk-enter-backward');
    stepEl.classList.add(dir === 'forward' ? 'kiosk-enter-forward' : 'kiosk-enter-backward');
  }

  renderProgressDots();

  // 뒤로 버튼
  const backBtn = document.getElementById('kiosk-back');
  if (backBtn) backBtn.style.visibility = step > 1 ? 'visible' : 'hidden';
}

function kioskSelect(btn) {
  const key = btn.dataset.key;
  const val = btn.dataset.val;
  const prevVal = selections[key];

  // 같은 스텝의 카드 선택 해제
  const cards = btn.closest('.kiosk-cards').querySelectorAll('.kiosk-card');
  cards.forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');

  selections[key] = val;

  // 값이 변경되면 하류 선택 초기화
  if (prevVal !== val) {
    const stepIdx = STEP_KEYS.indexOf(key);
    clearSelectionsAfter(stepIdx + 1);
  }

  // 350ms 후 자동 전진
  setTimeout(() => {
    const next = getNextStep(currentStep);
    goToStep(next, 'forward');
  }, 350);
}

function kioskNext() {
  const next = getNextStep(currentStep);
  goToStep(next, 'forward');
}

function kioskBack() {
  if (currentStep <= 1) return;
  const prev = getPrevStep(currentStep);
  goToStep(prev, 'backward');
}

function kioskReset() {
  for (const key of STEP_KEYS) selections[key] = null;
  goToStep(1, 'forward');
}

function kioskJumpTo(stepNum) {
  goToStep(stepNum, 'backward');
}

function kioskSkipGender() {
  selections.gender = null;
  const next = getNextStep(3); // 성별은 step 3
  goToStep(next, 'forward');
}

// ─── 촬영실 이동 ───

function applyLegacyMapping() {
  // purpose → style
  if (selections.purpose) {
    const legacyStyle = PURPOSE_TO_STYLE[selections.purpose];
    store.style = legacyStyle;
    saveSessionData('style', legacyStyle);
  }
  // age → legacy age
  if (selections.age) {
    const legacyAge = AGE_TO_LEGACY[selections.age];
    store.age = legacyAge;
    saveSessionData('age', legacyAge);
  }
  // gender (동일)
  store.gender = selections.gender;
  saveSessionData('gender', selections.gender || '');
}

function startShooting() {
  const btn = document.querySelector('.kiosk-start');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> 준비 중...';
  }

  // 9필드 전부 저장
  for (const key of STEP_KEYS) {
    saveSessionData(key, selections[key] || '');
  }

  // 레거시 매핑 저장
  applyLegacyMapping();

  navigateTo('camera.html');
}

// ─── window 노출 ───

Object.assign(window, {
  kioskSelect, kioskNext, kioskBack, kioskReset,
  kioskJumpTo, kioskSkipGender, startShooting,
});

// ─── 초기화 ───

async function init() {
  await sharedInit();

  store.step = 0;
  store.stepLabel = TX.stepReady;

  const prepScreen = document.querySelector('#prep-screen');
  if (prepScreen) prepScreen.classList.add('active');

  // 이전 방문 데이터 복원
  let restored = false;
  for (const key of STEP_KEYS) {
    const saved = loadSessionData(key);
    if (saved) {
      selections[key] = saved;
      restored = true;
    }
  }

  // 모든 필수 필드가 있으면 FINAL 직행
  if (restored && selections.purpose && selections.age) {
    goToStep(FINAL_STEP, 'forward');
  } else {
    goToStep(1, 'forward');
  }

  Monk.log('키오스크 초기화 완료 (9스텝)');
}

init();
