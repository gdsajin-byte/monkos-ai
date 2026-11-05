/**
 * thankyou.js — v6 수령처(엔딩 페이지) 전용 로직
 * 진입: result.js doDownload() 성공 → navigateTo('thankyou.html')
 * 데이터: sessionStorage (monkos_image, monkos_compare, monkos_format)
 * v6: 풀샷 별도과금 폐지 — 다운로드 70c에 크롭본+원본 포함
 */

import {
  store, Monk,
  sharedInit, loadSessionData, navigateTo,
  API
} from './shared.js';
import { initChatbot } from './modules/chatbot.js';

// ─── Media (toJpeg 전용) ───
const media = Monk.media({
  video: null,
  canvas: null,
  maxSize: 720,
});

// ─── 토스트 피드백 ───
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(139,92,246,0.9)', color: '#fff', padding: '10px 20px',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    zIndex: '9999', transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── §2-3 완성본 표시 ───
function displayPhoto() {
  const image = loadSessionData('image');
  if (!image) {
    Monk.log('이미지 데이터 없음 → 준비실로 이동');
    navigateTo('prep.html');
    return;
  }

  store.image = image;

  const imgEl = document.querySelector('#ty-photo');
  if (imgEl) imgEl.src = image;

  Monk.log('수령처 사진 표시 완료');
}

// ─── §2-4 다운로드 (보정 원본 갤러리 저장) ───
async function downloadImage() {
  if (!store.image) return;
  const jpegUrl = await media.toJpeg(store.image, 0.92);

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

  const a = document.createElement('a');
  a.href = jpegUrl;
  a.download = `monkos_photo_${Date.now()}.jpg`;
  a.click();
  Monk.log('JPEG 저장 완료');
}

// ─── §2-5 전후비교 표시 + 저장 ───
function setupCompare() {
  const compareData = sessionStorage.getItem('monkos_compare');
  const section = document.getElementById('ty-compare-section');
  if (!compareData || !section) return;

  section.style.display = 'flex';

  const thumb = document.getElementById('ty-compare-thumb');
  if (thumb) thumb.src = compareData;

  const saveBtn = document.getElementById('btn-ty-compare-save');
  if (saveBtn) saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveCompare(compareData);
  });

  // 카드 전체 클릭도 저장
  section.addEventListener('click', () => saveCompare(compareData));
}

async function saveCompare(compareData) {
  const jpegUrl = await media.toJpeg(compareData, 0.92);

  if (navigator.share && navigator.canShare) {
    try {
      const res = await fetch(jpegUrl);
      const blob = await res.blob();
      const file = new File([blob], `monkos_compare_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'MONKOS AI 전후비교' });
        Monk.log('전후비교 공유 완료');
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  const a = document.createElement('a');
  a.href = jpegUrl;
  a.download = `monkos_compare_${Date.now()}.jpg`;
  a.click();
  Monk.log('전후비교 저장 완료');
}

// ─── 뒤로가기 방어 ───
function setupBackGuard() {
  history.replaceState(null, '', location.href);
  window.addEventListener('popstate', () => {
    history.replaceState(null, '', location.href);
  });
}

// ─── 크롭앱 이동 ───
function goToCrop() {
  const format = loadSessionData('format') || 'passport';
  navigateTo(`crop.html?from=thankyou&spec=${format}`);
}

// ─── window 노출 ───
Object.assign(window, {
  navigateTo,
  goToCrop,
});

// ─── 초기화 ───
async function init() {
  initChatbot();
  await sharedInit();

  // 수령처 화면 활성화
  const tyScreen = document.querySelector('#thankyou-screen');
  if (tyScreen) tyScreen.classList.add('active');

  // 사진 표시
  displayPhoto();

  // 전후비교 셋업
  setupCompare();

  // 뒤로가기 방어
  setupBackGuard();

  // 다운로드 버튼 (보정 원본)
  const dlBtn = document.getElementById('btn-ty-download');
  if (dlBtn) dlBtn.addEventListener('click', downloadImage);

  // 크롭 버튼
  const cropBtn = document.getElementById('btn-ty-crop');
  if (cropBtn) cropBtn.addEventListener('click', goToCrop);

  // 홈 버튼
  const homeBtn = document.getElementById('btn-ty-home');
  if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('/'));

  // pending action 정리
  const pendingAction = sessionStorage.getItem('monkos_pending_action');
  if (pendingAction) {
    sessionStorage.removeItem('monkos_pending_action');
  }

  // 2026-09-02: 'purchase'→'download_complete'. 수령은 결제가 아니다(충전 시점이 purchase). 다운로드마다 발화하던 가짜 매출 차단
  // 2026-11-06: 'download_complete'→'thankyou_view'. 실제 수령 완료는 result.js doDownload 성공 분기에서 발화. 새로고침마다 중복되던 수령 카운트 차단
  if (typeof gtag === 'function') gtag('event', 'thankyou_view', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr' });

  Monk.log('수령처 v6 초기화 완료');
}

init();
