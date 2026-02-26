/**
 * result.js — 분석실 전용 로직 (모듈화)
 * 메인 흐름만: 프리체크 → 생성 → 프리뷰 → 다운로드 → 포스트 다운로드
 * 게이트/미션/충전/프리미엄 로직은 modules/ 참조
 */

import {
  store, pipe, Monk, TX, PHOTO_SPECS, CREDIT_COST,
  sharedInit, showCreditModal, saveSessionData, loadSessionData, navigateTo,
  buyCreditsKR, TOSS_CLIENT_KEY, API, fetchLatestCredits, closeCreditModal,
  showThankYou
} from './shared.js';

import { GateModule } from './modules/gate.js';
import { MissionModule } from './modules/mission.js';
import { ChargeModule } from './modules/charge.js';
import { PremiumModule } from './modules/premium.js';

// ─── 원본 격리: 풀 원본은 모듈 스코프 private 변수에만 보관 ───
let _fullOriginal = null;

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
  store.captured = null;
  store.generated = null;
  store.cropped = null;
  store.statusText = '';
  store.showStep2Actions = false;
  store.showStep3Actions = false;

  navigateTo('camera.html');
}

// ─── 생성 파이프라인 ───
async function confirmAndGenerate() {
  if (!store.captured) return;

  // 비로그인 1회 생성 제한
  if (!store.user.id) {
    if (localStorage.getItem('monkos_free_gen')) {
      GateModule.showLoginRequired('무료 체험을 사용하셨습니다.\n로그인 후 이용해주세요.');
      return;
    }
    localStorage.setItem('monkos_free_gen', Date.now().toString());
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

    // 풀 원본은 private 변수에만 보관 (img/store/sessionStorage 노출 금지)
    _fullOriginal = genResult.image;
    Monk.log('생성 완료');

    // 워터마크 버전 생성 (비교컷 표시용)
    const watermarked = await generateWatermarkPreview(genResult.image);

    // store/sessionStorage에는 워터마크 버전만 저장
    store.generated = watermarked;
    try { sessionStorage.setItem('monkos_generated', watermarked); } catch(e) {}

    const elapsed = Date.now() - genStartTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    await new Promise(resolve => setTimeout(resolve, remaining));

    startCountdown(() => {
      // 비교컷 이미지도 워터마크 버전으로 표시
      const genImg = document.querySelector('#photo-generated');
      if (genImg) genImg.src = watermarked;

      store.statusText = TX.resultDone;
      store.resultTitle = TX.resultDone;
      store.resultSubtitle = TX.resultDoneSub;
      store.stepLabel = TX.resultDone;
      store.showStep3Actions = true;
      store.showStep2Actions = false;

      const btnDownload = document.querySelector('#btn-download');
      if (btnDownload) btnDownload.disabled = false;

      // 워터마크 프리뷰는 이미 생성된 버전 사용
      store.watermarkPreview = watermarked;
    });

  } catch (err) {
    hideGenOverlay();
    if (err.status === 402) {
      ChargeModule.show();
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

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(img.width / 8, 24)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);

      for (let y = -canvas.height; y < canvas.height * 2; y += img.height / 5) {
        ctx.fillText('MONKOS', 0, y);
      }
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageDataUrl;
  });
}

// ─── 다운로드 (모듈 호출) ───
async function downloadResult() {
  if (!store.generated) return;

  // 토스 리다이렉트 대비: 원본을 임시 보관 (결제 중 페이지 리로드 대응)
  if (_fullOriginal) {
    try { sessionStorage.setItem('_mo_p', _fullOriginal); } catch(e) {}
  }

  // 비로그인 → 게이트 팝업
  if (!store.user.id) {
    GateModule.show({
      onComplete: () => doDownload(),
    });
    return;
  }

  // 잔액 부족 → 충전 모달
  if (store.user.credits < CREDIT_COST.download) {
    ChargeModule.show();
    return;
  }

  doDownload();
}

async function doDownload() {
  try {
    const result = await pipe.run('creditUse', { userId: store.user.id, type: 'download' });
    store.user = { ...store.user, credits: result.credits };
    showThankYou('', 'MONKOS AI 증명사진 다운로드 완료');

    // 결제 완료 → 원본 복원 (크롭 대상)
    if (_fullOriginal) {
      store.generated = _fullOriginal;
      const genImg = document.querySelector('#photo-generated');
      if (genImg) genImg.src = _fullOriginal;
    }

    await cropAndShowPostDownload();
  } catch (err) {
    if (err.status === 402) {
      ChargeModule.show();
    } else {
      Monk.log('다운로드 크레딧 에러: ' + (err.error || err.message));
    }
  }
}

// ─── 크롭 → 포스트 다운로드 ───
async function cropAndShowPostDownload() {
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

  if (store.cropped) {
    saveSessionData('cropped', store.cropped);
  }

  // 포스트 다운로드 상태로 전환
  store.downloadComplete = true;
  store.showStep3Actions = false;
  store.resultTitle = '다운로드 완료!';
  store.resultSubtitle = 'MONKOS AI 증명사진이 준비되었습니다';

  // 포스트 다운로드 영역에 모듈 마운트 (배치 순서: 미션→충전→프리미엄)
  const mount = document.getElementById('post-download-mount');
  if (mount) {
    // 저장 버튼 (모듈이 아닌 메인 흐름)
    const saveDiv = document.createElement('div');
    saveDiv.style.cssText = 'text-align:center;margin-bottom:16px;';
    saveDiv.innerHTML = `
      <div style="font-size:16px;font-weight:700;color:#c4b5fd;margin-bottom:12px;">다운로드 완료!</div>
      <button class="btn btn-success" id="btn-save-gallery" style="width:100%;padding:14px;font-size:15px;">📥 갤러리에 저장하기</button>
    `;
    mount.appendChild(saveDiv);
    saveDiv.querySelector('#btn-save-gallery').addEventListener('click', saveToGallery);

    // ① 미션 (100c) — 즉각 행동 유도
    store.showMission = !!store.user.id;
    MissionModule.mount(mount);
    // ② 충전 — 결제 전환
    ChargeModule.mountInline(mount);
    // ③ 프리미엄 — Coming Soon 축소 표시
    PremiumModule.mount(mount);
  }

  Monk.log('포스트 다운로드 화면 표시');
}

// ─── 갤러리 저장 ───
async function saveToGallery() {
  const imgData = store.cropped || store.generated;
  if (!imgData) return;

  const jpegUrl = await media.toJpeg(imgData, 0.92);

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

// ─── window 노출 (onclick 호환) ───
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
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

  // 토스 리다이렉트 복귀 시 원본 복원
  const pendingOrig = sessionStorage.getItem('_mo_p');
  if (pendingOrig) {
    _fullOriginal = pendingOrig;
    sessionStorage.removeItem('_mo_p');
    Monk.log('원본 이미지 임시 저장소에서 복원');
  }

  // 단건 결제 리다이렉트 처리 (GateModule 위임)
  await GateModule.initDirectPayment(() => {
    // 결제 완료 → 원본으로 교체 후 크롭
    if (_fullOriginal) store.generated = _fullOriginal;
    return cropAndShowPostDownload();
  });

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
  document.querySelectorAll('#photo-generated, #spec-photo').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
  });

  // 원본 표시
  showOriginal();

  Monk.log('분석실 초기화 완료');
}

init();
