/**
 * options.js — 옵션 N 전용 로직
 * 추가 촬영 / 이벤트 / 포털 홈 등 네비게이션
 */

import { store, Monk, sharedInit, clearSessionImages } from './shared.js';

// ─── 네비게이션 ───
function goToPrep() {
  clearSessionImages();
  location.href = 'prep.html';
}

function goToCamera() {
  clearSessionImages();
  // 설정(style/gender/age)은 유지 → 촬영실 직행
  location.href = 'camera.html';
}

function goToPortal() {
  location.href = 'https://monk.kr';
}

function openTelegramEvent() {
  const uid = store.user.id || 'guest';
  const link = `https://t.me/monkos_event_bot?start=${encodeURIComponent(uid)}`;
  window.open(link, '_blank');
  Monk.log('텔레그램 이벤트 링크 오픈');
}

// ─── window 노출 ───
Object.assign(window, {
  goToPrep,
  goToCamera,
  goToPortal,
  openTelegramEvent,
});

// ─── 초기화 ───
async function init() {
  await sharedInit();
  Monk.log('옵션 N 초기화 완료');
}

init();
