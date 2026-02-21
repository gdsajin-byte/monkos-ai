/**
 * result.js — 분석실 전용 로직
 * 프리체크 → 생성 → 결제 → 규격 크롭 → 수령처 이동
 */

import {
  store, pipe, Monk, TX, PHOTO_SPECS, CREDIT_COST,
  sharedInit, showCreditModal, saveSessionData, loadSessionData, navigateTo
} from './shared.js';

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

  // 프로그레스 바 시작
  const progress = document.getElementById('gen-progress');
  if (progress) {
    progress.style.width = '0%';
    progress.style.transition = 'width 0.5s ease';
    // 10초에 걸쳐 90%까지 서서히 채움
    setTimeout(() => { progress.style.transition = 'width 10s ease-out'; progress.style.width = '90%'; }, 100);
  }

  // 광고 이미지 로테이션
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
    img.src = adImages[index];
    img.style.opacity = '1';
  }, 400);
}

// ─── 카운트다운 → 결과 공개 ───
function startCountdown(callback) {
  const countdown = document.getElementById('gen-countdown');
  const countNum = document.getElementById('gen-count-num');
  if (!countdown || !countNum) { callback(); return; }

  // 프로그레스 바 100%
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

  // 원본 이미지 표시
  const imgEl = document.querySelector('#photo-original');
  if (imgEl) imgEl.src = captured;

  Monk.log('원본 표시 완료');
}

// ─── 재촬영 ───
function retakePhoto() {
  store.captured = null;
  store.generated = null;
  store.cropped = null;
  store.statusText = '';
  store.showStep2Actions = false;
  store.showStep3Actions = false;

  navigateTo('camera.html');
}

// ─── 생성 파이프라인 (QC 제거됨) ───
async function confirmAndGenerate() {
  if (!store.captured) return;

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
      store.statusText = `사전분석: ${preCheck.score}점 — ${preCheck.suggestion || '재촬영을 권장합니다'}`;
      store.resultTitle = '재촬영을 권장합니다';
      store.resultSubtitle = preCheck.suggestion || '촬영 환경을 개선해 주세요';
      store.showStep2Actions = true;
      return;
    }

    store.statusText = `사전분석 OK (${preCheck.score}점) → 생성 시작`;
  } catch (err) {
    Monk.log('사전분석 스킵: ' + (err.error || err.message));
  }

  // 생성 단계
  store.step = 3;
  store.stepLabel = TX.step3;

  // 오버레이 표시
  showGenOverlay();
  const genStartTime = Date.now();

  try {
    const genResult = await pipe.run('generate', {
      image: base64,
      style: store.style,
      purpose: loadSessionData('purpose'),
      gender: store.gender,
      age: store.age,
      clothing: loadSessionData('clothing'),
      clothingColor: loadSessionData('clothingColor'),
      tie: loadSessionData('tie'),
      hair: loadSessionData('hair'),
      background: loadSessionData('background'),
      expression: loadSessionData('expression'),
      userId: store.user.id,
    });

    store.generated = genResult.image;
    Monk.log('생성 완료');

    // 최소 대기 시간 보장
    const elapsed = Date.now() - genStartTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    await new Promise(resolve => setTimeout(resolve, remaining));

    // 카운트다운 → 결과 공개
    startCountdown(() => {
      // 생성된 이미지 표시
      const genImg = document.querySelector('#photo-generated');
      if (genImg) genImg.src = genResult.image;

      store.statusText = TX.resultDone;
      store.resultTitle = TX.resultDone;
      store.resultSubtitle = TX.resultDoneSub;
      store.stepLabel = TX.resultDone;
      store.showStep3Actions = true;
      store.showStep2Actions = false;

      const btnDownload = document.querySelector('#btn-download');
      if (btnDownload) btnDownload.disabled = false;

      // 워터마크 프리뷰 생성
      generateWatermarkPreview(genResult.image).then(watermarked => {
        if (watermarked) store.watermarkPreview = watermarked;
      });
    });

  } catch (err) {
    hideGenOverlay();
    if (err.status === 402) {
      showCreditModal(err.required || 10, err.credits || 0, 'generate');
      store.showStep2Actions = true;
      store.resultTitle = TX.resultConfirm;
      store.resultSubtitle = '크레딧이 부족합니다';
      store.step = 2;
    } else {
      showGenerateError(err.error || err.message || '생성 실패');
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

// ─── 워터마크 프리뷰 생성 ───
async function generateWatermarkPreview(imageDataUrl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 워터마크: 대각선 반복 MONKOS 텍스트
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(img.width / 8, 24)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);

      for (let y = -canvas.height; y < canvas.height * 2; y += img.height / 4) {
        ctx.fillText('MONKOS', 0, y);
      }
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageDataUrl;
  });
}

// ─── 다운로드 (결제 + 크롭 → 수령처 이동) ───
async function downloadResult() {
  if (!store.generated) return;

  // 로그인 사용자: 다운로드 크레딧 차감
  if (store.user.id) {
    if (store.user.credits < CREDIT_COST.download) {
      showCreditModal(CREDIT_COST.download, store.user.credits, 'download');
      return;
    }

    try {
      const result = await pipe.run('creditUse', { userId: store.user.id, type: 'download' });
      store.user = { ...store.user, credits: result.credits };
      await cropAndGoToThankyou();
    } catch (err) {
      if (err.status === 402) {
        showCreditModal(CREDIT_COST.download, err.credits || 0, 'download');
      } else {
        Monk.log('다운로드 크레딧 에러: ' + (err.error || err.message));
      }
    }
    return;
  }

  // 비로그인: 바로 크롭 → 수령처
  await cropAndGoToThankyou();
}

async function cropAndGoToThankyou() {
  // 규격 크롭 실행
  if (store.generated && store.style) {
    const spec = PHOTO_SPECS[store.style];
    try {
      const cropResult = await media.crop(store.generated, spec);
      store.cropped = cropResult.dataUrl;
      store.specName = spec.name;
      store.specSize = `${spec.widthMM}×${spec.heightMM}mm`;
      store.specPx = `${cropResult.outputW}×${cropResult.outputH}px`;
      Monk.log(`규격 크롭: ${spec.name}`);
    } catch (e) {
      Monk.log('규격 크롭 실패: ' + e.message);
      store.cropped = await media.toJpeg(store.generated, 0.92);
    }
  }

  // sessionStorage에 저장
  if (store.cropped) {
    saveSessionData('cropped', store.cropped);
  }

  Monk.log('수령처로 이동');
  navigateTo('thankyou.html');
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
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  openTelegram,
});

// ─── 초기화 ───
async function init() {
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

  // 광고 manifest 프리로드
  loadAdManifest();

  // 원본 표시
  showOriginal();

  Monk.log('분석실 초기화 완료');
}

init();
