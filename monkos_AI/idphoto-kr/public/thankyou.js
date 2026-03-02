/**
 * thankyou.js — v5 수령처(엔딩 페이지) 전용 로직
 * 진입: result.js doDownload() 성공 → navigateTo('thankyou.html')
 * 데이터: sessionStorage (monkos_cropped, monkos_compare, _mo_p, monkos_format)
 */

import {
  store, Monk, PHOTO_SPECS, CREDIT_COST,
  sharedInit, loadSessionData, navigateTo,
  API, pipe, fetchLatestCredits, showThankYou
} from './shared.js';

// ─── Media (toJpeg 전용) ───
const media = Monk.media({
  video: null,
  canvas: null,
  maxSize: 720,
});

// ─── 풀 원본 상태 ───
let _fullOriginal = null;
let _fullOriginalJpeg = null; // 변환 캐시 (재다운로드 무과금용)

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

// ─── §2-4 다운로드 (갤러리 저장) ───
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

// ─── §2-8 풀샷 원본 받기 ───
function setupFullshot() {
  _fullOriginal = sessionStorage.getItem('_mo_p');
  const section = document.getElementById('ty-fullshot-section');
  if (!section) return;

  // 비로그인 또는 _mo_p 없으면 숨김
  if (!store.user.id || !_fullOriginal) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'flex';
  section.addEventListener('click', downloadFullOriginal);
}

async function downloadFullOriginal() {
  if (!_fullOriginal || !store.user.id) return;

  // 이미 구매한 경우 → 무과금 재다운로드
  if (_fullOriginalJpeg) {
    redownloadFull();
    return;
  }

  // 잔액 부족 → charge.html
  if (store.user.credits < CREDIT_COST.fullOriginal) {
    sessionStorage.setItem('monkos_pending_action', 'full_original');
    navigateTo('charge.html?return=thankyou&action=full');
    return;
  }

  try {
    const result = await pipe.run('creditUse', { userId: store.user.id, type: 'full_original' });
    store.user = { ...store.user, credits: result.credits };

    _fullOriginalJpeg = await media.toJpeg(_fullOriginal, 0.95);

    const a = document.createElement('a');
    a.href = _fullOriginalJpeg;
    a.download = 'MONKOS_AI_Original.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 버튼 상태 변경
    const titleEl = document.getElementById('ty-fullshot-title');
    const priceEl = document.getElementById('ty-fullshot-price');
    if (titleEl) titleEl.textContent = '📸 풀샷 다시 저장하기';
    if (priceEl) priceEl.textContent = '무료';

    showThankYou('', '풀샷 원본 다운로드 완료');
    Monk.log('풀샷 원본 다운로드 완료 (20c)');
  } catch (err) {
    if (err.status === 402) {
      sessionStorage.setItem('monkos_pending_action', 'full_original');
      navigateTo('charge.html?return=thankyou&action=full');
    } else {
      Monk.log('풀샷 원본 에러: ' + (err.error || err.message));
    }
  }
}

function redownloadFull() {
  if (!_fullOriginalJpeg) return;
  const a = document.createElement('a');
  a.href = _fullOriginalJpeg;
  a.download = 'MONKOS_AI_Original.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  Monk.log('풀샷 재다운로드');
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
        showThankYou('+100 Cr', 'SNS 공유 이벤트 완료');
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
  await sharedInit();

  // 수령처 화면 활성화
  const tyScreen = document.querySelector('#thankyou-screen');
  if (tyScreen) tyScreen.classList.add('active');

  // 사진 표시
  displayPhoto();

  // 전후비교 셋업
  setupCompare();

  // 풀샷 원본 셋업
  setupFullshot();

  // SNS 이벤트 셋업
  setupSnsEvent();

  // 뒤로가기 방어
  setupBackGuard();

  // 다운로드 버튼
  const dlBtn = document.getElementById('btn-ty-download');
  if (dlBtn) dlBtn.addEventListener('click', downloadCropped);

  // 홈 버튼
  const homeBtn = document.getElementById('btn-ty-home');
  if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('/'));

  // charge.html 복귀 시 풀샷 자동 진행
  const pendingAction = sessionStorage.getItem('monkos_pending_action');
  if (pendingAction === 'full_original' && store.user.id) {
    sessionStorage.removeItem('monkos_pending_action');
    // 크레딧 최신 조회 후 자동 진행
    await fetchLatestCredits();
    if (store.user.credits >= CREDIT_COST.fullOriginal) {
      setTimeout(() => downloadFullOriginal(), 300);
    }
  } else if (pendingAction) {
    sessionStorage.removeItem('monkos_pending_action');
  }

  Monk.log('수령처 v5 초기화 완료');
}

init();
