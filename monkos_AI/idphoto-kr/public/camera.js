/**
 * camera.js — 촬영실 전용 로직
 * 카메라 + AI 코칭 (WebSocket + Gemini Live) + 촬영 → sessionStorage 저장 → 분석실 이동
 */

import {
  store, Monk, TX, API,
  sharedInit, saveSessionData, loadSessionData, navigateTo, showDesktopBlocker,
  MAX_CAPTURE_SIZE, CAPTURE_QUALITY, FRAME_INTERVAL_MS, COACHING_DISPLAY_MS
} from './shared.js';
import { GateModule } from './modules/gate.js';
import { normalizeUpload, pickImage, UploadError, UPLOAD_MESSAGES } from './modules/upload.js';
import { initChatbot } from './modules/chatbot.js';
import { evaluateGate, createStabilityCounter, GATE_THRESHOLDS, GATE_MESSAGES } from './modules/capture-gate.js';

let captureMode = 'auto'; // 'auto' | 'manual' — 계측용

// ─── Media 생성 (카메라 페이지 전용) ───
const media = Monk.media({
  video: '#camera-video',
  canvas: '#capture-canvas',
  maxSize: MAX_CAPTURE_SIZE,
  captureQuality: CAPTURE_QUALITY,
  frameInterval: FRAME_INTERVAL_MS,
  faceDetection: true,
  mirror: true,
});

// ─── 코칭 표시 ───
let coachingTimeout = null;

function showCoaching(text, ready = false) {
  store.coaching = { text, ready, active: true };

  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) faceGuide.classList.toggle('ready', ready);

  const overlay = document.querySelector('#coaching-overlay');
  if (overlay) overlay.classList.toggle('ready', ready);

  if (coachingTimeout) clearTimeout(coachingTimeout);
  coachingTimeout = setTimeout(() => {
    if (store.step === 1) {
      store.coaching = { ...store.coaching, active: true };
    }
  }, COACHING_DISPLAY_MS);
}

// ─── 촬영 준비 게이트 (코드 판정 — 2026-09-29 Gemini Live 코칭 대체) ───
// 준비 판정은 capture-gate.js 순수 함수. 외부 호출 없음. 판정 불가(MediaPipe 미적재) 시 수동 촬영 모드.
let gateTimer = null;
let countdownTimer = null;
let gateBusy = false;
let gateMode = 'auto';          // 'auto' | 'manual'
let lastGateReason = 'unavailable';
const stability = createStabilityCounter(GATE_THRESHOLDS.stableFrames);

function getCameraArea() {
  const el = document.querySelector('#camera-area');
  return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 0, h: 0 };
}

function setManualMode(reason) {
  if (gateMode === 'manual') return;
  gateMode = 'manual';
  lastGateReason = reason || 'unavailable';
  stopGateLoop();
  showCoaching(GATE_MESSAGES.unavailable, false);
  Monk.log('자동 안내 불가 → 수동 촬영 모드 (' + lastGateReason + ')');
}

async function gateTick() {
  if (gateBusy || countdownTimer || store.step !== 1) return;
  gateBusy = true;
  try {
    const det = await media.detectFace();
    if (!det.available) { setManualMode('mediapipe_unavailable'); return; }
    const area = getCameraArea();
    if (!det.videoW || !area.w) return; // 아직 크기 미확정 — 다음 틱
    const verdict = evaluateGate({ faces: det.faces, videoW: det.videoW, videoH: det.videoH, areaW: area.w, areaH: area.h });
    lastGateReason = verdict.reason;
    showCoaching(GATE_MESSAGES[verdict.reason] || GATE_MESSAGES.no_face, verdict.ready);
    if (stability.push(verdict.ready)) {
      Monk.log('준비 판정 통과 → 카운트다운 ' + JSON.stringify(verdict.metrics));
      stability.reset();
      startCountdown();
    }
  } catch (e) {
    Monk.log('게이트 판정 에러: ' + e.message);
    setManualMode('gate_error');
  } finally {
    gateBusy = false;
  }
}

function startGateLoop() {
  stopGateLoop();
  if (gateMode === 'manual') return;
  stability.reset();
  gateTimer = setInterval(gateTick, FRAME_INTERVAL_MS);
}

function stopGateLoop() {
  if (gateTimer) {
    clearInterval(gateTimer);
    gateTimer = null;
  }
}

function startCoachingLoop() {
  showCoaching(TX.coachingCheck);
  startGateLoop();
}

function stopCoachingLoop() {
  stopGateLoop();
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  stability.reset();
  hideCountdownOverlay();
  store.coaching = { text: '', ready: false, active: false };
}

// 수동 셔터 — 판정과 무관하게 항상 동작 (최후 수단)
document.getElementById('btn-manual-shot')?.addEventListener('click', () => {
  if (store.step !== 1 || countdownTimer) return;
  Monk.log('수동 촬영 요청 (마지막 판정=' + lastGateReason + ')');
  captureMode = 'manual';
  startCountdown();
});

// ─── 카운트다운 + 자동 촬영 ───
function startCountdown() {
  stopGateLoop();
  showCountdownOverlay(3);

  let n = 3;
  countdownTimer = setInterval(() => {
    n--;
    if (n > 0) {
      showCountdownOverlay(n);
    } else {
      clearInterval(countdownTimer);
      countdownTimer = null;
      doAutoCapture();
    }
  }, 1000);
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  stability.reset();
  hideCountdownOverlay();
  startGateLoop();
}

function doAutoCapture() {
  const flashEl = document.getElementById('shutter-flash');
  if (flashEl) {
    flashEl.classList.add('active');
    setTimeout(() => flashEl.classList.remove('active'), 300);
  }
  setTimeout(() => capturePhoto(), 200);
}

function showCountdownOverlay(n) {
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('countdown-number');
  const labelEl = document.getElementById('countdown-label');
  if (!overlay || !numEl) return;

  overlay.classList.add('active');
  numEl.textContent = n;
  numEl.style.animation = 'none';
  void numEl.offsetHeight;
  numEl.style.animation = 'countdown-pop 0.4s ease';

  if (labelEl) {
    labelEl.textContent = n === 3 ? '준비되셨습니다, 촬영합니다' : '';
  }

  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) faceGuide.classList.add('ready');
}

function hideCountdownOverlay() {
  const overlay = document.getElementById('countdown-overlay');
  if (overlay) overlay.classList.remove('active');
}

// 카운트다운 중 탭 → 취소
document.getElementById('countdown-overlay')?.addEventListener('click', () => {
  if (countdownTimer) {
    cancelCountdown();
    showCoaching('카운트다운 취소됨. 다시 준비해주세요.', false);
  }
});

// ─── 촬영 ───
function capturePhoto() {
  if (store.step !== 1) return;

  // 코칭 중지
  stopCoachingLoop();

  // 캡처
  const captured = media.capture();
  if (!captured) {
    Monk.log('캡처 실패');
    return;
  }

  // sessionStorage에 저장
  saveSessionData('captured', captured);

  if (typeof gtag === 'function') gtag('event', 'photo_upload', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', capture_mode: captureMode, gate_reason: lastGateReason });

  // 카메라 정리
  media.offFrame();
  media.stop();

  Monk.log('촬영 완료 → 분석실 이동');

  // 분석실로 이동
  navigateTo('result.html');
}

// ─── 선택 요약 뱃지 ───
const FORMAT_LABELS = {
  passport: '여권사진',
  id: '증명사진',
};

function renderSelectionSummary() {
  const summaryEl = document.querySelector('#selection-summary');
  if (!summaryEl) return;

  const labels = [];
  labels.push(FORMAT_LABELS[store.format] || '');
  if (store.gender === 'm') labels.push('남성');
  else if (store.gender === 'f') labels.push('여성');
  if (store.age) {
    const AGE_LABELS = { baby: '영유아', child: '어린이', teen: '청소년', adult: '성인' };
    labels.push(AGE_LABELS[store.age] || '');
  }
  summaryEl.textContent = labels.filter(Boolean).join(' · ');
}

// ─── 초기화 ───
async function init() {
  initChatbot();

  try {
    await sharedInit();
  } catch (err) {
    Monk.log('sharedInit 에러: ' + err.message);
  }

  // ── 데스크톱 차단 (카메라가 필요한 이 페이지에서만) ──
  const devMode = new URLSearchParams(location.search).has('dev');
  if (!Monk.isMobile() && !devMode) {
    showDesktopBlocker();
    return;
  }

  // ── 로그인 게이트 (촬영실 진입 = 로그인 필수) ──
  if (!store.user.id) {
    await new Promise(resolve => {
      GateModule.showLoginRequired(
        '촬영을 시작하려면 로그인이 필요합니다\n첫 로그인 시 10c를 드려요!',
        resolve  // 로그인 성공 콜백 → resolve → 카메라 init 진행
      );

      // 닫기 버튼 → 랜딩으로 복귀
      const closeBtn = document.getElementById('gate-login-close-btn');
      if (closeBtn) {
        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', () => {
          GateModule.closeLoginRequired();
          navigateTo('index.html');
        });
      }
    });
    Monk.log(`로그인 확인: ${store.user.email} (${store.user.credits}c)`);
  }

  // ── v5 필수값 체크 (sharedInit에서 이미 11필드 복원됨) ──
  if (!store.format) {
    Monk.log('선택 데이터 없음 → 준비실로 이동');
    navigateTo('prep.html');
    return;
  }

  // 선택 요약 뱃지 렌더링
  renderSelectionSummary();

  // 이전 결과물 제거 (재촬영 시 옛 generated 잔류 방지)
  sessionStorage.removeItem('monkos_generated');
  sessionStorage.removeItem('monkos_image');

  // 스탠바이 화면 표시 (카메라는 아직 OFF)
  document.querySelector('#standby-screen')?.classList.add('active');

  // 시작 버튼 핸들러
  document.getElementById('btn-start-camera')?.addEventListener('click', async () => {
    // 스탠바이 숨기기
    document.querySelector('#standby-screen')?.classList.remove('active');

    // 카메라 화면 활성화
    document.querySelector('#camera-area')?.classList.add('active');
    store.step = 1;
    store.stepLabel = TX.step1;
    store.coaching = { text: TX.coachingCheck, ready: false, active: true };

    try {
      await media.start();
      startCoachingLoop();
      Monk.log('촬영실 초기화 완료');
    } catch (err) {
      Monk.log('카메라 시작 실패: ' + err.message);
      showUploadFallback(err);  // 권한 거부·카메라 없음이 막다른 길이 되지 않게(11-05) — 사진 올리기로 우회
    }
  });
}

// ─── 카메라 실패 → 사진 올리기 우회(11-05 kr 업로드 열기 §2-4) ───
function showUploadFallback(err) {
  let box = document.getElementById('upload-fallback');
  if (!box) {
    box = document.createElement('div');
    box.id = 'upload-fallback';
    box.className = 'upload-fallback';
    box.innerHTML = `<p class="upload-fallback-text"></p>
      <button type="button" class="prep-upload">갤러리에서 사진 올리기</button>
      <div class="prep-upload-msg" role="alert" hidden></div>`;
    document.body.appendChild(box);
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.hidden = true;
    box.appendChild(input);
    const btn = box.querySelector('.prep-upload'), msg = box.querySelector('.prep-upload-msg');
    btn.onclick = async () => {
      msg.hidden = true;
      const file = await pickImage(input);
      if (!file) return;
      btn.disabled = true; btn.textContent = '사진 여는 중...';
      try {
        const { dataURL } = await normalizeUpload(file);
        saveSessionData('captured', dataURL);
        if (typeof gtag === 'function') gtag('event', 'photo_upload', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ko', service: 'idphoto-kr', capture_mode: 'upload', gate_reason: 'camera_fail' });
        navigateTo('result.html');
      } catch (e) {
        msg.textContent = UPLOAD_MESSAGES[e instanceof UploadError ? e.code : 'decode'] || UPLOAD_MESSAGES.decode;
        msg.hidden = false;
        btn.disabled = false; btn.textContent = '갤러리에서 사진 올리기';
      }
    };
  }
  box.querySelector('.upload-fallback-text').textContent = `${TX.cameraError} 갤러리에 있는 사진으로도 진행할 수 있습니다.`;
  box.classList.add('active');
}

init();
