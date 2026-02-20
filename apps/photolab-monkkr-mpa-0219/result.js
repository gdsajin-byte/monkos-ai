/**
 * result.js — 분석실 전용 로직
 * 프리체크 → 생성 → QC → 결제 → 규격 크롭 → 수령처 이동
 */

import {
  store, pipe, Monk, TX, PHOTO_SPECS, CREDIT_COST, API,
  sharedInit, showCreditModal, saveSessionData, loadSessionData
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
    location.href = 'camera.html';
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
  store.qcResult = null;

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
  store.qcResult = null;
  store.qcPassed = false;
  store.showStep2Actions = false;
  store.showStep3Actions = false;

  location.href = 'camera.html';
}

// ─── 생성 + QC 파이프라인 ───
async function confirmAndGenerate() {
  if (!store.captured) return;

  const base64 = store.captured.includes(',') ? store.captured.split(',')[1] : store.captured;

  // 사전분석
  store.showStep2Actions = false;
  store.resultTitle = '사진 분석 중...';
  store.resultSubtitle = 'AI가 촬영본을 검수하고 있습니다';
  store.qcBadgeText = '사전분석 중...';
  store.qcResult = { pending: true };

  try {
    const preCheck = await pipe.run('precheck', { image: base64 });
    Monk.log(`사전분석: ${preCheck.score}점 ${preCheck.suitable ? 'OK' : 'NG'}`);

    if (!preCheck.suitable) {
      store.qcBadgeText = `사전분석: ${preCheck.score}점 — ${preCheck.suggestion || '재촬영을 권장합니다'}`;
      store.qcPassed = false;
      store.resultTitle = '재촬영을 권장합니다';
      store.resultSubtitle = preCheck.suggestion || '촬영 환경을 개선해 주세요';
      store.showStep2Actions = true;
      return;
    }

    store.qcBadgeText = `사전분석 OK (${preCheck.score}점) → 생성 시작`;
  } catch (err) {
    Monk.log('사전분석 스킵: ' + (err.error || err.message));
  }

  // 생성 단계
  store.step = 3;
  store.stepLabel = TX.step3;
  store.resultTitle = TX.generating;
  store.resultSubtitle = TX.generatingSub;
  store.qcBadgeText = TX.genLoading;

  try {
    const genResult = await pipe.run('generate', {
      image: base64,
      style: store.style,
      gender: store.gender,
      age: store.age,
      userId: store.user.id,
    });

    store.generated = genResult.image;
    store.resultTitle = TX.qcVerifying;
    store.resultSubtitle = TX.qcVerifyingSub;
    store.qcBadgeText = TX.qcChecking;
    Monk.log('생성 완료 → QC 시작');

    // 생성된 이미지 표시
    const genImg = document.querySelector('#photo-generated');
    if (genImg) genImg.src = genResult.image;

    // QC
    const origBase64 = store.captured.includes(',') ? store.captured.split(',')[1] : store.captured;
    const genBase64 = genResult.image.includes(',') ? genResult.image.split(',')[1] : genResult.image;

    try {
      const qcResult = await pipe.run('qc', {
        original: origBase64,
        generated: genBase64,
        gender: store.gender,
        age: store.age,
      });
      showQCResult(qcResult);
    } catch (qcErr) {
      showQCError(qcErr.error || qcErr.message || 'QC 실패');
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

function showQCResult(result) {
  const passed = result.identity === 'PASS' || result.same_person === true;
  const similarity = result.similarity || '?';

  store.qcResult = result;
  store.qcPassed = passed;
  store.qcBadgeText = passed
    ? `PASS — ${similarity}% | ${result.note || result.quality || ''}`
    : `FAIL — ${similarity}% | ${result.note || TX.retakeRecommend}`;

  store.resultTitle = passed ? TX.resultDone : TX.resultFail;
  store.resultSubtitle = passed ? TX.resultDoneSub : TX.resultFailSub;
  store.showStep3Actions = true;
  store.showStep2Actions = false;

  if (passed) store.stepLabel = TX.resultDone;

  const btnDownload = document.querySelector('#btn-download');
  if (btnDownload) btnDownload.disabled = !passed;

  Monk.log(`QC: ${passed ? 'PASS' : 'FAIL'} (${similarity}%)`);
}

function showGenerateError(error) {
  store.qcBadgeText = TX.genFail + ': ' + error;
  store.qcPassed = false;
  store.resultTitle = TX.genFail;
  store.resultSubtitle = error;
  store.showStep3Actions = false;
  store.showStep2Actions = true;
  store.step = 2;
  Monk.log('생성 에러: ' + error);
}

function showQCError(error) {
  store.qcBadgeText = 'QC: ' + error;
  store.qcPassed = false;
  store.showStep3Actions = true;
  const btnDownload = document.querySelector('#btn-download');
  if (btnDownload) btnDownload.disabled = false;
  Monk.log('QC 에러: ' + error);
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
  location.href = 'thankyou.html';
}

// ─── window 노출 ───
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
});

// ─── 초기화 ───
async function init() {
  await sharedInit();

  // 결과 화면 활성화
  const resultArea = document.querySelector('#result-overlay');
  if (resultArea) resultArea.classList.add('active');

  // 원본 표시
  showOriginal();

  Monk.log('분석실 초기화 완료');
}

init();
