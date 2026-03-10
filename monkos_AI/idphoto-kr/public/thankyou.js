/**
 * thankyou.js — v6 수령처(엔딩 페이지) 전용 로직
 * 진입: result.js doDownload() 성공 → navigateTo('thankyou.html')
 * 데이터: sessionStorage (monkos_cropped, monkos_compare, monkos_originalUrl, monkos_format)
 * v6: 풀샷 별도과금 폐지 — 다운로드 70c에 크롭본+원본 포함
 */

import {
  store, Monk, PHOTO_SPECS,
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

// ─── 원본 URL 상태 ───
let _originalUrl = null;

// ─── §2-3 완성본 표시 ───
function displayPhoto() {
  const cropped = loadSessionData('cropped');
  if (!cropped) {
    Monk.log('크롭 데이터 없음 → 준비실로 이동');
    navigateTo('prep.html');
    return;
  }

  store.cropped = cropped;

  const imgEl = document.querySelector('#ty-photo');
  if (imgEl) imgEl.src = cropped;

  // 규격명 표시
  const format = loadSessionData('format');
  const specNameEl = document.getElementById('ty-spec-name');
  if (specNameEl && format) {
    const spec = PHOTO_SPECS[format];
    if (spec) specNameEl.textContent = spec.name;
  }

  Monk.log('수령처 사진 표시 완료');
}

// ─── §2-4 다운로드 (크롭본 갤러리 저장) ───
async function downloadCropped() {
  if (!store.cropped) return;
  const jpegUrl = await media.toJpeg(store.cropped, 0.92);

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

// ─── §2-4b 원본(노크롭) 다운로드 — 추가과금 없음 ───
function downloadOriginal() {
  if (!_originalUrl) {
    showToast('원본 이미지를 불러올 수 없습니다');
    return;
  }

  const a = document.createElement('a');
  a.href = _originalUrl;
  a.download = 'MONKOS_AI_Original.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('원본 다운로드 완료');
  Monk.log('원본 다운로드 트리거');
}

// ─── 원본 버튼 셋업 ───
function setupOriginalDownload() {
  _originalUrl = sessionStorage.getItem('monkos_originalUrl');
  const section = document.getElementById('ty-fullshot-section');
  if (!section) return;

  if (!_originalUrl) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'flex';

  // 가격 표시 변경 (무료)
  const priceEl = document.getElementById('ty-fullshot-price');
  if (priceEl) priceEl.textContent = '무료';

  const titleEl = document.getElementById('ty-fullshot-title');
  if (titleEl) titleEl.textContent = '📸 원본(노크롭) 저장하기';

  section.addEventListener('click', downloadOriginal);
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

// ─── §2-10 SNS 이벤트 ───
function setupSnsEvent() {
  const btn = document.getElementById('btn-ty-sns-event');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!store.user.id) return;

    try {
      const res = await fetch(`${API.PORTAL_URL}/api/credits/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: store.user.id, eventType: 'sns_share' }),
      });
      const data = await res.json();
      if (data.success) {
        store.user = { ...store.user, credits: data.credits ?? store.user.credits };
        showToast('SNS 인증 이벤트 신청 완료 · +100c');
        btn.disabled = true;
        btn.textContent = '✅ 이벤트 완료';
      } else {
        alert(data.error || '이미 참여한 이벤트입니다.');
      }
    } catch (err) {
      alert('이벤트 처리 중 오류가 발생했습니다.');
    }
  });
}

// ─── 뒤로가기 방어 ───
function setupBackGuard() {
  history.replaceState(null, '', location.href);
  window.addEventListener('popstate', () => {
    history.replaceState(null, '', location.href);
  });
}

// ─── window 노출 ───
Object.assign(window, {
  navigateTo,
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

  // 원본 다운로드 셋업 (추가과금 없음)
  setupOriginalDownload();

  // SNS 이벤트 셋업
  setupSnsEvent();

  // 뒤로가기 방어
  setupBackGuard();

  // 다운로드 버튼 (크롭본)
  const dlBtn = document.getElementById('btn-ty-download');
  if (dlBtn) dlBtn.addEventListener('click', downloadCropped);

  // 홈 버튼
  const homeBtn = document.getElementById('btn-ty-home');
  if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('/'));

  // pending action 정리
  const pendingAction = sessionStorage.getItem('monkos_pending_action');
  if (pendingAction) {
    sessionStorage.removeItem('monkos_pending_action');
  }

  Monk.log('수령처 v6 초기화 완료');
}

init();
