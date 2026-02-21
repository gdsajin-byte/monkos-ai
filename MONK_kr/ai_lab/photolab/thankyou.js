/**
 * thankyou.js — 수령처 전용 로직
 * 크롭 사진 표시 + 갤러리 저장 + SNS 공유
 */

import { store, Monk, PHOTO_SPECS, sharedInit, loadSessionData, navigateTo } from './shared.js';

// ─── 용도별 활용 가이드 ───

const USAGE_GUIDE = {
  passport: [
    '여권 신청 (온라인/오프라인)',
    '주민등록증 / 운전면허증',
    '비자 신청',
  ],
  student_id: [
    '학생증 발급',
    '수험표 사진',
  ],
  employee_id: [
    '사원증 발급',
    '출입카드 사진',
    '사내 프로필',
  ],
  resume: [
    '이력서 / 자기소개서',
    '입사지원 온라인 프로필',
    'LinkedIn / 포트폴리오',
  ],
  color_portrait: [
    'SNS 프로필',
    '블로그 / 포트폴리오',
    '명함 사진',
  ],
};

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
    navigateTo('prep.html');
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

  displaySpecInfo();
  displayUsageGuide();

  Monk.log('수령처 사진 표시 완료');
}

// ─── 규격 정보 표시 ───

function displaySpecInfo() {
  const style = loadSessionData('style');
  const specInfoEl = document.getElementById('spec-info');
  if (!specInfoEl || !style) return;

  const spec = PHOTO_SPECS[style];
  if (!spec) return;

  specInfoEl.innerHTML = `
    <div style="font-weight:600; color:#a78bfa;">${spec.name}</div>
    <div style="color:#8892a8; font-size:13px; margin-top:4px;">
      ${spec.widthMM}×${spec.heightMM}mm · 300dpi
    </div>
  `;
  specInfoEl.style.display = 'block';
}

// ─── 활용 가이드 표시 ───

function displayUsageGuide() {
  const purpose = loadSessionData('purpose');
  const listEl = document.getElementById('usage-list');
  const guideEl = document.getElementById('usage-guide');
  if (!listEl || !guideEl) return;

  const items = USAGE_GUIDE[purpose];
  if (!items) {
    guideEl.style.display = 'none';
    return;
  }

  listEl.innerHTML = items.map(item =>
    `<div style="padding:2px 0;">· ${item}</div>`
  ).join('');
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
  navigateTo,
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
