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
  store.resultTitle = TX.generating;
  store.resultSubtitle = TX.generatingSub;
  store.statusText = TX.genLoading;

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

    // 생성된 이미지 표시
    const genImg = document.querySelector('#photo-generated');
    if (genImg) genImg.src = genResult.image;

    // 바로 결과 표시 + 다운로드 활성화
    store.statusText = TX.resultDone;
    store.resultTitle = TX.resultDone;
    store.resultSubtitle = TX.resultDoneSub;
    store.stepLabel = TX.resultDone;
    store.showStep3Actions = true;
    store.showStep2Actions = false;

    const btnDownload = document.querySelector('#btn-download');
    if (btnDownload) btnDownload.disabled = false;

    // 워터마크 프리뷰 생성
    const watermarked = await generateWatermarkPreview(genResult.image);
    if (watermarked) {
      store.watermarkPreview = watermarked;
    }

  } catch (err) {
    if (err.status === 402) {
      showCreditModal(err.required || 1, err.credits || 0, 'generate');
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

// ─── 비교 카드 저장 ───
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

async function saveCompareCard() {
  if (!store.captured || !store.generated) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const [imgOrig, imgGen] = await Promise.all([
    loadImage(store.captured),
    loadImage(store.generated),
  ]);

  const cardW = 720;
  const imgW = (cardW - 48) / 2;
  const imgH = imgW * (imgOrig.height / imgOrig.width);
  const brandH = 48;
  const cardH = 32 + imgH + 24 + brandH + 16;

  canvas.width = cardW;
  canvas.height = cardH;

  // 배경
  ctx.fillStyle = '#0a0e17';
  ctx.beginPath();
  ctx.roundRect(0, 0, cardW, cardH, 16);
  ctx.fill();

  // 원본
  ctx.drawImage(imgOrig, 16, 24, imgW, imgH);
  // 생성
  ctx.drawImage(imgGen, 16 + imgW + 16, 24, imgW, imgH);

  // 라벨
  ctx.fillStyle = '#8892a8';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('원본', 16 + imgW / 2, 24 + imgH + 16);
  ctx.fillText('AI 증명사진', 16 + imgW + 16 + imgW / 2, 24 + imgH + 16);

  // 브랜딩 바
  ctx.fillStyle = 'rgba(167,139,250,0.1)';
  ctx.fillRect(0, cardH - brandH, cardW, brandH);
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ MONKOS AI 증명사진   monkos.ai', cardW / 2, cardH - brandH / 2 + 5);

  // 저장
  canvas.toBlob(async (blob) => {
    const file = new File([blob], `monkos_compare_${Date.now()}.jpg`, { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'MONKOS AI 증명사진' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
    }
    Monk.log('비교 카드 저장 완료');
  }, 'image/jpeg', 0.92);
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

// ─── window 노출 ───
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  saveCompareCard,
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

  // 원본 표시
  showOriginal();

  Monk.log('분석실 초기화 완료');
}

init();
