/**
 * camera.js — 촬영실 전용 로직
 * 카메라 + AI 코칭 (WebSocket + Gemini Live) + 촬영 → sessionStorage 저장 → 분석실 이동
 */

import {
  store, Monk, TX, API,
  sharedInit, saveSessionData, loadSessionData, navigateTo, showDesktopBlocker,
  MAX_CAPTURE_SIZE, FRAME_INTERVAL_MS, COACHING_DISPLAY_MS
} from './shared.js';
import { GateModule } from './modules/gate.js';
import { initChatbot } from './modules/chatbot.js';

// ─── Media 생성 (카메라 페이지 전용) ───
const media = Monk.media({
  video: '#camera-video',
  canvas: '#capture-canvas',
  maxSize: MAX_CAPTURE_SIZE,
  captureQuality: 0.6,
  frameInterval: FRAME_INTERVAL_MS,
  faceDetection: true,
  mirror: true,
});

// ─── 음성 가이드 ───
let koVoice = null;
let ttsActivated = false;

function initVoice() {
  const voices = speechSynthesis.getVoices();
  koVoice = voices.find(v => v.name.includes('Yuna'))
         || voices.find(v => v.lang.startsWith('ko'));
  if (koVoice) {
    Monk.log(`음성 가이드: ${koVoice.name}`);
    // 음성 로딩이 늦어 첫 인사를 못했으면 지금 발화
    if (store.coaching?.text && store.coaching.active) {
      speakKo(store.coaching.text);
    }
  }
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = initVoice;
  initVoice();
}

// iOS Safari: speechSynthesis는 첫 호출이 user gesture 내에서 이뤄져야 함
// 페이지 첫 터치/클릭 시 TTS 활성화
function activateTTS() {
  if (ttsActivated || !('speechSynthesis' in window)) return;
  ttsActivated = true;
  const warmup = new SpeechSynthesisUtterance('');
  warmup.volume = 0;
  speechSynthesis.speak(warmup);
  Monk.log('TTS 활성화 (user gesture)');
}
document.addEventListener('touchstart', activateTTS, { once: true });
document.addEventListener('click', activateTTS, { once: true });

function speakKo(text) {
  if (!store.voiceEnabled || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 1.15;
  u.pitch = 1.05;
  if (koVoice) u.voice = koVoice;  // 있으면 사용, 없으면 시스템 기본
  speechSynthesis.speak(u);
}

// ─── 코칭 표시 ───
let coachingTimeout = null;

function showCoaching(text, ready = false) {
  store.coaching = { text, ready, active: true };

  const btnCapture = document.querySelector('#btn-capture');
  if (btnCapture) btnCapture.classList.toggle('ready', ready);

  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) faceGuide.classList.toggle('ready', ready);

  const overlay = document.querySelector('#coaching-overlay');
  if (overlay) overlay.classList.toggle('ready', ready);

  speakKo(text);

  if (coachingTimeout) clearTimeout(coachingTimeout);
  coachingTimeout = setTimeout(() => {
    if (store.step === 1) {
      store.coaching = { ...store.coaching, active: true };
    }
  }, COACHING_DISPLAY_MS);
}

// ─── WebSocket 코칭 ───
let wsCoaching = null;
let frameTimer = null;
let countdownTimer = null;
let readyCount = 0;
const READY_THRESHOLD = 1;

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

function startCoachingWS() {
  const wsUrl = getWsUrl();
  wsCoaching = new WebSocket(wsUrl);

  wsCoaching.onopen = () => {
    Monk.log('코칭 WS 연결');
    wsCoaching.send(JSON.stringify({
      type: 'set-format',
      format: store.format || 'passport',
    }));
    startFrameLoop();
  };

  wsCoaching.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'ai-coaching' && msg.text) {
        const isReady = msg.ready === true;
        showCoaching(msg.text, isReady);

        if (isReady && !countdownTimer) {
          readyCount++;
          if (readyCount >= READY_THRESHOLD) {
            startCountdown();
          }
        } else if (!isReady) {
          readyCount = 0;
        }
      }
    } catch (e) {
      Monk.log('코칭 메시지 파싱 실패: ' + e.message);
    }
  };

  wsCoaching.onerror = () => {
    Monk.log('코칭 WS 에러');
  };

  wsCoaching.onclose = () => {
    Monk.log('코칭 WS 종료');
    stopFrameLoop();
  };
}

function startFrameLoop() {
  stopFrameLoop();
  frameTimer = setInterval(() => {
    if (!wsCoaching || wsCoaching.readyState !== WebSocket.OPEN) return;

    const frame = media.capture();
    if (!frame) return;

    const base64 = frame.includes(',') ? frame.split(',')[1] : frame;
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    wsCoaching.send(binary.buffer);
  }, FRAME_INTERVAL_MS);
}

function stopFrameLoop() {
  if (frameTimer) {
    clearInterval(frameTimer);
    frameTimer = null;
  }
}

function stopCoachingWS() {
  if (wsCoaching) {
    if (wsCoaching.readyState === WebSocket.OPEN) {
      wsCoaching.send(JSON.stringify({ type: 'stop-coaching' }));
    }
    wsCoaching.close();
    wsCoaching = null;
  }
  stopFrameLoop();
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  readyCount = 0;
  hideCountdownOverlay();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  store.coaching = { text: '', ready: false, active: false };
}

function startCoachingLoop() {
  showCoaching(TX.coachingCheck);
  startCoachingWS();
}

function stopCoachingLoop() {
  stopCoachingWS();
}

// ─── 카운트다운 + 자동 촬영 ───
function startCountdown() {
  stopFrameLoop();
  showCountdownOverlay(3);
  document.querySelector('#btn-capture')?.setAttribute('disabled', '');

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
  readyCount = 0;
  hideCountdownOverlay();
  document.querySelector('#btn-capture')?.removeAttribute('disabled');
  startFrameLoop();
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

  // 카메라 정리
  media.offFrame();
  media.stop();
  document.querySelector('#controls')?.classList.remove('active');

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

// ─── window 노출 ───
Object.assign(window, {
  capturePhoto,
});

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

  // 카메라 화면 활성화
  document.querySelector('#camera-area')?.classList.add('active');

  store.step = 1;
  store.stepLabel = TX.step1;
  store.voiceEnabled = (store.coachingMode === 'voice');
  store.coaching = { text: TX.coachingCheck, ready: false, active: true };

  try {
    await media.start();

    // AI 코칭 루프 시작
    startCoachingLoop();

    // 컨트롤 표시
    document.querySelector('#controls')?.classList.add('active');

    Monk.log('촬영실 초기화 완료');
  } catch (err) {
    alert(TX.cameraError);
    Monk.log('카메라 시작 실패: ' + err.message);
  }
}

init();
