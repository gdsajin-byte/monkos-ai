/**
 * prep.js — 준비실 전용 로직
 * 스타일/성별/연령 선택 → sessionStorage 저장 → 촬영실 이동
 */

import { store, Monk, TX, sharedInit, saveSessionData } from './shared.js';

// ─── 선택 로직 ───
function selectGender(gender) {
  store.gender = gender;
  document.querySelectorAll('[data-gender]').forEach(c => {
    c.classList.toggle('active', c.dataset.gender === gender);
  });
  checkProfileComplete();
}

function selectAge(age) {
  store.age = age;
  document.querySelectorAll('[data-age]').forEach(c => {
    c.classList.toggle('active', c.dataset.age === age);
  });
  checkProfileComplete();
}

function selectStyle(style) {
  store.style = style;
  document.querySelectorAll('.prep-style-option').forEach(c => {
    c.classList.toggle('active', c.dataset.style === style);
  });
  checkProfileComplete();
}

function checkProfileComplete() {
  const allSelected = store.gender && store.age && store.style;
  store.profileComplete = allSelected;

  const btn = document.querySelector('#btn-start');
  if (btn) btn.disabled = !allSelected;

  updateConfirmMessage();
}

function updateConfirmMessage() {
  if (!store.gender || !store.age || !store.style) {
    store.prepConfirmText = '';
    return;
  }

  const genderText = store.gender === 'male' ? '남성' : '여성';
  const ageMap = { child: '유아~12세', teen: '13~18세', adult: '19세 이상' };
  const styleMap = { id_photo: '여권/신분증', resume: '취업/컬러증명' };
  const styleNote = store.style === 'id_photo'
    ? '눈썹·이마가 보이도록 준비해 주세요.'
    : '헤어와 의상을 깔끔하게 정돈해 주세요.';

  store.prepConfirmText = `<strong>${styleMap[store.style]}</strong> · ${genderText} · ${ageMap[store.age]}<br>${styleNote}<br><span style="color:#a78bfa;">준비가 완료되셨으면 촬영 시작 버튼을 눌러주세요!</span>`;

  const el = document.querySelector('#prep-confirm-text');
  if (el) el.innerHTML = store.prepConfirmText;
}

// ─── 촬영실 이동 ───
function startShooting() {
  const btn = document.querySelector('#btn-start');
  if (btn) {
    btn.disabled = true;
    btn.textContent = TX.btnStarting;
  }

  // sessionStorage에 선택 데이터 저장
  saveSessionData('style', store.style);
  saveSessionData('gender', store.gender);
  saveSessionData('age', store.age);

  // 촬영실로 이동
  location.href = 'camera.html';
}

// ─── window 노출 ───
Object.assign(window, {
  selectGender,
  selectAge,
  selectStyle,
  startShooting,
});

// ─── 초기화 ───
async function init() {
  await sharedInit();

  store.step = 0;
  store.stepLabel = TX.stepReady;

  // 준비 화면 활성화
  const prepScreen = document.querySelector('#prep-screen');
  if (prepScreen) prepScreen.classList.add('active');

  Monk.log('준비실 초기화 완료');
}

init();
