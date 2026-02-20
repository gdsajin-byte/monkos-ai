/**
 * thankyou.js — 수령처 전용 로직
 * 크롭 사진 표시 + 갤러리 저장 + SNS 공유
 */

import { store, Monk, sharedInit, loadSessionData } from './shared.js';

// ─── Media 생성 (toJpeg 전용) ───
const media = Monk.media({
  video: null,
  canvas: null,
  maxSize: 720,
});

// ─── 사진 표시 ───
function displayPhoto() {
  const cropped = loadSessionData('cropped');
  if (!cropped) {
    Monk.log('크롭 데이터 없음 → 준비실로 이동');
    location.href = 'prep.html';
    return;
  }

  store.cropped = cropped;

  // 사진 표시
  const imgEl = document.querySelector('#ty-photo');
  if (imgEl) imgEl.src = cropped;

  // 크레딧 잔여 메시지
  store.postCreditMsg = store.user.id
    ? `💎 10c 사용 · 잔여 ${store.user.credits}c`
    : '';

  Monk.log('수령처 사진 표시 완료');
}

// ─── 갤러리 저장 ───
async function saveToPhotos() {
  if (!store.cropped) return;
  const jpegUrl = await media.toJpeg(store.cropped, 0.92);

  // navigator.share 지원 시
  if (navigator.share && navigator.canShare) {
    try {
      const res = await fetch(jpegUrl);
      const blob = await res.blob();
      const file = new File([blob], `monkos_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'MONKOS AI 증명사진' });
        Monk.log('사진 공유 완료');
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  // 폴백: 직접 다운로드
  const a = document.createElement('a');
  a.href = jpegUrl;
  a.download = `monkos_photo_${Date.now()}.jpg`;
  a.click();
  Monk.log('JPEG 저장 완료');
}

// ─── 텔레그램 이벤트 ───
function openTelegram() {
  const uid = store.user.id || 'guest';
  const link = `https://t.me/monkos_event_bot?start=${encodeURIComponent(uid)}`;
  window.open(link, '_blank');
  Monk.log('텔레그램 이벤트 링크 오픈');
}

// ─── window 노출 ───
Object.assign(window, {
  saveToPhotos,
  openTelegram,
});

// ─── 초기화 ───
async function init() {
  await sharedInit();

  // 수령처 화면 활성화
  const tyScreen = document.querySelector('#thankyou-screen');
  if (tyScreen) tyScreen.classList.add('active');

  displayPhoto();

  Monk.log('수령처 초기화 완료');
}

init();
