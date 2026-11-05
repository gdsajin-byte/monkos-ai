/**
 * result.js — 분석실 전용 로직
 * 메인 흐름: 프리체크 → 생성 → 프리뷰 → 다운로드 결제 → thankyou.html 전환
 * 포스트 다운로드(갤러리 저장, 규격 탭, 풀원본, SNS 이벤트)는 thankyou.html로 이관
 */

import {
  store, pipe, Monk, TX, PHOTO_SPECS, CREDIT_COST,
  sharedInit, showCreditModal, saveSessionData, loadSessionData, navigateTo, showChargeModal,
  buyCreditsKR, TOSS_CLIENT_KEY, API, fetchLatestCredits, closeCreditModal,
} from './shared.js';

import { GateModule } from './modules/gate.js';
import { initChatbot } from './modules/chatbot.js';
// ─── GCS 경로 보관 (서버단 워터마크 — 클라이언트에 원본 도달하지 않음) ───
let _gcsPath = null;

// ─── Media 생성 (crop/toJpeg 전용 — 카메라 불필요) ───
const media = Monk.media({
  video: null,
  canvas: null,
  maxSize: 720,
  faceDetection: true,
});

// ─── 광고 킷 상수 ───
const AD_MANIFEST_URL = 'https://storage.googleapis.com/monk-ai-images/ads/manifest.json';
const MIN_DISPLAY_TIME = 10000; // 최소 10초 표시

let adImages = [];
let adTimer = null;
let adIndex = 0;

// ─── 광고 manifest 로드 ───
async function loadAdManifest() {
  try {
    const res = await fetch(AD_MANIFEST_URL);
    const data = await res.json();
    adImages = data.images || [];
    Monk.log(`광고 manifest 로드: ${adImages.length}장`);
  } catch (e) {
    Monk.log('광고 manifest 로드 실패: ' + e.message);
  }
}

// ─── 오버레이 표시 + 광고 로테이션 시작 ───
function showGenOverlay() {
  const overlay = document.getElementById('gen-overlay');
  if (overlay) overlay.style.display = 'flex';

  const progress = document.getElementById('gen-progress');
  if (progress) {
    progress.style.width = '0%';
    progress.style.transition = 'width 0.5s ease';
    setTimeout(() => { progress.style.transition = 'width 10s ease-out'; progress.style.width = '90%'; }, 100);
  }

  if (adImages.length > 0) {
    adIndex = 0;
    showAdImage(adIndex);
    adTimer = setInterval(() => {
      adIndex = (adIndex + 1) % adImages.length;
      showAdImage(adIndex);
    }, 6000);
  }
}

function showAdImage(index) {
  const img = document.getElementById('gen-ad-img');
  if (!img || !adImages[index]) return;
  img.style.opacity = '0';
  setTimeout(() => {
    img.onerror = () => {
      Monk.log('광고 이미지 로드 실패: ' + adImages[index]);
      img.style.display = 'none';
    };
    img.onload = () => { img.style.display = ''; };
    img.src = adImages[index];
    img.style.opacity = '1';
  }, 400);
}

// ─── 카운트다운 → 결과 공개 ───
function startCountdown(callback) {
  const countdown = document.getElementById('gen-countdown');
  const countNum = document.getElementById('gen-count-num');
  if (!countdown || !countNum) { callback(); return; }

  const progress = document.getElementById('gen-progress');
  if (progress) { progress.style.transition = 'width 0.5s ease'; progress.style.width = '100%'; }

  countdown.style.display = 'flex';

  let count = 3;
  countNum.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countNum.textContent = count;
    } else {
      clearInterval(interval);
      countNum.textContent = '✨';
      setTimeout(() => {
        hideGenOverlay();
        callback();
      }, 500);
    }
  }, 1000);
}

function hideGenOverlay() {
  if (adTimer) { clearInterval(adTimer); adTimer = null; }
  const overlay = document.getElementById('gen-overlay');
  if (overlay) overlay.style.display = 'none';
  const countdown = document.getElementById('gen-countdown');
  if (countdown) countdown.style.display = 'none';
}

// ─── 원본 표시 ───
function showOriginal() {
  const captured = loadSessionData('captured');
  if (!captured) {
    Monk.log('촬영 데이터 없음 → 촬영실로 이동');
    navigateTo('camera.html');
    return;
  }

  store.captured = captured;
  store.step = 2;
  store.stepLabel = TX.step2;
  store.resultTitle = TX.resultConfirm;
  store.resultSubtitle = TX.resultConfirmSub;
  store.showStep2Actions = true;
  store.showStep3Actions = false;
  store.generated = null;
  store.statusText = '';

  const imgEl = document.querySelector('#photo-original');
  if (imgEl) imgEl.src = captured;

  Monk.log('원본 표시 완료');
}

// ─── 재촬영 ───
function retakePhoto() {
  // Step 2 (리터칭 전): 확인 없이 바로 준비실 이동
  if (!store.generated) {
    clearForRetake();
    return;
  }

  // Step 3 (리터칭 후): 확인 모달
  const ok = confirm(
    '현재 사진을 삭제하고 다시 촬영하시겠습니까?\n리터칭 비용(10c)은 복구되지 않습니다.'
  );
  if (!ok) return;

  clearForRetake();
}

function clearForRetake() {
  // store 초기화
  store.captured = null;
  store.generated = null;
  store.cropped = null;
  store.statusText = '';
  store.showStep2Actions = false;
  store.showStep3Actions = false;

  // sessionStorage 이전 결과 제거
  sessionStorage.removeItem('monkos_generated');
  sessionStorage.removeItem('monkos_compare');
  sessionStorage.removeItem('monkos_pending_action');
  sessionStorage.removeItem('monkos_gcsPath');
  _gcsPath = null;

  // 촬영 준비실로 이동 (옵션 재선택 가능)
  navigateTo('prep.html');
}

// ─── 생성 파이프라인 ───
async function confirmAndGenerate() {
  if (!store.captured) return;

  if (typeof gtag === 'function') gtag('event', 'generate_click', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr' });

  // 로그인 필수 (촬영실 게이트에서 이미 체크되지만 방어용)
  if (!store.user.id) {
    GateModule.showLoginRequired('리터칭을 진행하려면 로그인이 필요합니다\n첫 로그인 시 10c를 드려요!', () => {
      confirmAndGenerate();
    });
    return;
  }

  const base64 = store.captured.includes(',') ? store.captured.split(',')[1] : store.captured;

  // 사전분석
  store.showStep2Actions = false;
  store.resultTitle = '사진 분석 중...';
  store.resultSubtitle = 'AI가 촬영본을 검수하고 있습니다';
  store.statusText = '사전분석 중...';

  try {
    const preCheck = await pipe.run('precheck', { image: base64 });
    Monk.log(`사전분석: ${preCheck.score}점 ${preCheck.suitable ? 'OK' : 'NG'}`);

    if (!preCheck.suitable) {
      if (typeof gtag === 'function') gtag('event', 'generate_fail', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', fail_stage: 'precheck', fail_code: 'SCORE_' + (preCheck.score ?? 'NA') });
      store.statusText = `사전분석: ${preCheck.score}점 — ${preCheck.suggestion || '재촬영을 권장합니다'}`;
      store.resultTitle = '재촬영을 권장합니다';
      store.resultSubtitle = preCheck.suggestion || '촬영 환경을 개선해 주세요';
      store.showStep2Actions = true;
      return;
    }

    store.statusText = `사전분석 OK (${preCheck.score}점) → 리터칭 시작`;
  } catch (err) {
    Monk.log('사전분석 스킵: ' + (err.error || err.message));
  }

  // ─── 잔고 사전 체크 (시머링 시작 전) ───
  if (store.user.credits < CREDIT_COST.generate) {
    if (typeof gtag === 'function') gtag('event', 'generate_fail', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', fail_stage: 'credit', fail_code: 'INSUFFICIENT' });
    showChargeModal();
    store.showStep2Actions = true;
    store.resultTitle = TX.resultConfirm;
    store.resultSubtitle = '크레딧이 부족합니다';
    return;
  }

  // 생성 단계
  store.step = 3;
  store.stepLabel = TX.step3;

  showGenOverlay();
  const genStartTime = Date.now();

  try {
    const genResult = await pipe.run('generate', {
      image: base64,
      format: store.format,
      gender: store.gender,
      age: store.age,
      clothing: store.clothing,
      clothingColor: store.clothingColor,
      suitColor: store.suitColor,
      shirtColor: store.shirtColor,
      tieColor: store.tieColor,
      tiePattern: store.tiePattern,
      hair: store.hair,
      bgColor: store.bgColor,
      userId: store.user.id,
      v: 5,
    });

    // 서버가 워터마크본을 전송 — 클라이언트에 원본 도달하지 않음
    _gcsPath = genResult.gcsPath || null;
    if (_gcsPath) {
      try { sessionStorage.setItem('monkos_gcsPath', _gcsPath); } catch(e) {}
    }
    Monk.log('생성 완료' + (_gcsPath ? ` (GCS: ${_gcsPath})` : ''));

    // 노크롭 원본(보정본) 그대로 표시 — 크롭은 크롭앱에서만
    const spec = PHOTO_SPECS[store.format];
    let croppedPreview = genResult.image;

    // store/sessionStorage에는 워터마크 프리뷰만 저장
    store.generated = croppedPreview;
    try { sessionStorage.setItem('monkos_generated', croppedPreview); } catch(e) {}

    const elapsed = Date.now() - genStartTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    await new Promise(resolve => setTimeout(resolve, remaining));

    startCountdown(() => {
      // 비교컷: 원본 vs 크롭 워터마크 프리뷰
      const genImg = document.querySelector('#photo-generated');
      if (genImg) genImg.src = croppedPreview;

      // 비교컷 레이블 — 크롭 아닌 보정본이므로
      const label = document.querySelector('#photo-generated-wrap .label');
      if (label) label.textContent = 'AI 보정';

      store.statusText = TX.resultDone;
      store.resultTitle = TX.resultDone;
      store.resultSubtitle = TX.resultDoneSub;
      store.stepLabel = TX.resultDone;
      store.showStep3Actions = true;
      store.showStep2Actions = false;

      const btnDownload = document.querySelector('#btn-download');
      if (btnDownload) btnDownload.disabled = false;

      store.watermarkPreview = croppedPreview;

      if (typeof gtag === 'function') gtag('event', 'preview_view', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr' });
    });

  } catch (err) {
    hideGenOverlay();
    if (typeof gtag === 'function') gtag('event', 'generate_fail', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', fail_stage: err.status === 402 ? 'credit' : 'generate', fail_code: String(err.status || err.code || 'ERR').slice(0, 40) });
    if (err.status === 402) {
      showChargeModal();
      store.showStep2Actions = true;
      store.resultTitle = TX.resultConfirm;
      store.resultSubtitle = '크레딧이 부족합니다';
      store.step = 2;
    } else {
      showGenerateError(err.error || err.message || '리터칭 실패');
    }
  }
}

function showGenerateError(error) {
  store.statusText = TX.genFail + ': ' + error;
  store.resultTitle = TX.genFail;
  store.resultSubtitle = error;
  store.showStep3Actions = false;
  store.showStep2Actions = true;
  store.step = 2;
  Monk.log('생성 에러: ' + error);
}

// ─── 다운로드 (서버단 Signed URL) ───
async function downloadResult() {
  if (!store.generated) return;

  if (typeof gtag === 'function') gtag('event', 'download_click', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr' });

  // C2 핫픽스: 연속 클릭 방지
  const btn = document.querySelector('#btn-download');
  if (btn) btn.disabled = true;

  // 로그인 필수
  if (!store.user.id) {
    GateModule.showLoginRequired('다운로드하려면 로그인이 필요합니다', () => {
      downloadResult();
    });
    return;
  }

  // GCS 경로 필수
  if (!_gcsPath) {
    Monk.log('GCS 경로 없음 — 서버단 워터마크 미적용 세션');
    if (btn) btn.disabled = false;
    return;
  }

  // 잔액 부족 → 충전 페이지
  if (store.user.credits < CREDIT_COST.download) {
    sessionStorage.setItem('monkos_pending_action', 'download');
    showChargeModal();
    return;
  }

  doDownload();
}

// ─── 전후비교 합성 (thankyou용) ───
async function generateCompareImage() {
  const captured = loadSessionData('captured');
  const cropped = loadSessionData('image');
  if (!captured || !cropped) return;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const [imgA, imgB] = await Promise.all([
      loadImage(captured),
      loadImage(cropped),
    ]);

    // 나란히 배치 (같은 높이, 비율 유지)
    const h = 400;
    const wA = (imgA.width / imgA.height) * h;
    const wB = (imgB.width / imgB.height) * h;
    const gap = 16;
    const pad = 24;
    const totalW = wA + gap + wB + pad * 2;
    const totalH = h + pad * 2 + 40; // 하단 브랜딩 영역

    canvas.width = totalW;
    canvas.height = totalH;

    // 배경
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, totalW, totalH);

    // 원본
    ctx.drawImage(imgA, pad, pad, wA, h);
    // 완성본
    ctx.drawImage(imgB, pad + wA + gap, pad, wB, h);

    // 라벨
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('원본', pad + wA / 2, pad + h + 18);
    ctx.fillText(PHOTO_SPECS[store.format]?.name || '완성', pad + wA + gap + wB / 2, pad + h + 18);

    // 브랜딩
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ MONKOS AI 증명사진  ·  monkos.ai', totalW / 2, totalH - 10);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    sessionStorage.setItem('monkos_compare', dataUrl);
  } catch (e) {
    Monk.log('전후비교 합성 실패: ' + e.message);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function doDownload() {
  try {
    // 서버에 다운로드 요청 (크레딧 70c 차감 + 서버 크롭 + 원본 Signed URL)
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, gcsPath: _gcsPath, format: store.format }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (typeof gtag === 'function') gtag('event', 'download_fail', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', fail_stage: res.status === 402 ? 'credit' : 'server', fail_code: 'HTTP_' + res.status });
      if (res.status === 402) {
        showChargeModal();
        return;
      }
      throw new Error(data.error || '다운로드 실패');
    }

    store.user = { ...store.user, credits: data.credits };
    // 실제 수령 완료 = 서버 차감·원본 URL 발급 성공 시점 (이전엔 thankyou 페이지 열람을 download_complete로 셌다 — 2026-11-06)
    if (typeof gtag === 'function') gtag('event', 'download_complete', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', value: CREDIT_COST.download, currency: 'KRW' });

    // 보정 원본 (노크롭) → thankyou + 크롭앱 전달용
    saveSessionData('image', data.image);

    // 원본 Signed URL 보존 (thankyou에서 원본 다운로드용)
    try {
      sessionStorage.setItem('monkos_originalUrl', data.originalUrl);
      sessionStorage.setItem('monkos_gcsPath', _gcsPath);
    } catch(e) {}

    // 전후비교 합성
    await generateCompareImage();

    // thankyou.html로 전환
    navigateTo('thankyou.html');

  } catch (err) {
    Monk.log('다운로드 에러: ' + (err.error || err.message));
    const btn = document.querySelector('#btn-download');
    if (btn) btn.disabled = false;
  }
}

// ─── window 노출 (onclick 호환) ───
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  showChargeModal,
});

// ─── 초기화 ───
async function init() {
  initChatbot();

  try {
    await sharedInit();
  } catch (err) {
    Monk.log('sharedInit 에러: ' + err.message);
  }

  // 로딩 상태 제거
  document.querySelector('#page-loading')?.remove();

  // 결과 화면 활성화
  const resultArea = document.querySelector('#result-overlay');
  if (resultArea) resultArea.classList.add('active');

  // 토스 리다이렉트 복귀 시 GCS 경로 복원
  const pendingGcsPath = sessionStorage.getItem('monkos_gcsPath');
  if (pendingGcsPath) {
    _gcsPath = pendingGcsPath;
    Monk.log('GCS 경로 복원: ' + _gcsPath);
  }

  // 광고 manifest 프리로드
  loadAdManifest();

  // sessionStorage에서 생성 이미지 복원 (토스 리다이렉트 후 복귀용 — 워터마크 버전)
  if (!store.generated) {
    const savedGen = sessionStorage.getItem('monkos_generated');
    if (savedGen) {
      store.generated = savedGen;
      Monk.log('생성 이미지 sessionStorage에서 복원 (워터마크)');
    }
  }

  // 비교컷 이미지 우클릭 방지 (보조 방어)
  document.querySelectorAll('#photo-generated').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
  });

  // === 생성 이미지 존재 시 결과 화면 복원 (토스 충전 후 복귀) ===
  if (store.generated) {
    // 원본도 표시 (비교컷용)
    const captured = loadSessionData('captured');
    if (captured) {
      store.captured = captured;
      const imgEl = document.querySelector('#photo-original');
      if (imgEl) imgEl.src = captured;
    }

    const genImg = document.querySelector('#photo-generated');
    if (genImg) genImg.src = store.generated;

    store.step = 3;
    store.stepLabel = TX.resultDone;
    store.resultTitle = TX.resultDone;
    store.resultSubtitle = TX.resultDoneSub;
    store.showStep3Actions = true;
    store.showStep2Actions = false;
    store.watermarkPreview = store.generated;

    const btnDownload = document.querySelector('#btn-download');
    if (btnDownload) btnDownload.disabled = false;

    Monk.log('생성 결과 복원 (토스 충전 후 복귀)');

    // 충전 목적이 다운로드였으면 자동 진행
    const pendingAction = sessionStorage.getItem('monkos_pending_action');
    if (pendingAction === 'download' && store.user.credits >= CREDIT_COST.download) {
      sessionStorage.removeItem('monkos_pending_action');
      setTimeout(() => downloadResult(), 300);
    } else {
      sessionStorage.removeItem('monkos_pending_action');
    }
  } else {
    showOriginal();
  }

  Monk.log('분석실 초기화 완료');
}

init();
