/**
 * camera.js — 촬영실 전용 로직
 * 카메라 + AI 코칭 (REST ~2fps) + 촬영 → sessionStorage 저장 → 분석실 이동
 */

import {
  store, Monk, TX, API,
  sharedInit, saveSessionData, loadSessionData, navigateTo,
  MAX_CAPTURE_SIZE, FRAME_INTERVAL_MS, COACHING_DISPLAY_MS
} from './shared.js';

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
  if (!koVoice) return;
  // 이전 발화 즉시 중단 + 새 텍스트만 발화
  speechSynthesis.cancel();
  // cancel 후 약간의 딜레이 필요 (브라우저별 차이)
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.15;
    u.pitch = 1.05;
    u.voice = koVoice;
    speechSynthesis.speak(u);
  }, 50);
}

function toggleVoice() {
  store.voiceEnabled = !store.voiceEnabled;
  const btn = document.querySelector('#btn-voice');
  if (btn) {
    btn.textContent = store.voiceEnabled ? '🔊' : '🔇';
    btn.title = store.voiceEnabled ? '음성 ON' : '음성 OFF';
  }
  Monk.log(`음성 가이드: ${store.voiceEnabled ? 'ON' : 'OFF'}`);
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

// ─── 모션 감지 ───
let previousFrameLen = 0;
const MOTION_THRESHOLD = 0.03; // 3% 변화

function detectMotion(dataUrl) {
  const len = dataUrl.length;
  if (previousFrameLen === 0) {
    previousFrameLen = len;
    return true; // 첫 프레임은 항상 전송
  }
  const diff = Math.abs(len - previousFrameLen) / Math.max(previousFrameLen, 1);
  previousFrameLen = len;
  return diff > MOTION_THRESHOLD;
}

// ─── 코칭 REST 루프 (순차 실행 — 항상 최신 프레임) ───
let coachingActive = false;
let coachingGen = 0; // TTS 세대 카운터 (stale 방지)

async function coachingLoop() {
  Monk.log('코칭 루프 시작 (0.5fps)');
  showCoaching(TX.coachingCheck);

  while (coachingActive && store.step === 1) {
    // 1. 최신 프레임 캡처
    const frame = media.capture();
    if (!frame) {
      await sleep(500);
      continue;
    }

    const base64 = frame.includes(',') ? frame.split(',')[1] : frame;
    const gen = ++coachingGen;

    try {
      const res = await fetch(API.COACHING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          style: store.style || 'id_photo',
          purpose: store.purpose,
          gender: store.gender,
          age: store.age,
          clothing: store.clothing,
          clothingColor: store.clothingColor,
          tie: store.tie,
          hair: store.hair,
          expression: store.expression,
        }),
      });

      // 응답 도착 시 이미 다음 세대면 버림 (stale)
      if (gen !== coachingGen || !coachingActive) continue;

      if (!res.ok) {
        Monk.log(`코칭 에러: ${res.status}`);
        await sleep(2000);
        continue;
      }

      const data = await res.json();
      if (gen !== coachingGen || !coachingActive) continue;

      if (store.step === 1 && data.text) {
        showCoaching(data.text, data.ready);
      }
    } catch (err) {
      Monk.log('코칭 실패: ' + err.message);
      await sleep(2000);
    }

    // 2. 2초 간격 (0.5fps — 뷰파인더 체감 속도)
    await sleep(2000);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function startCoachingLoop() {
  coachingActive = true;
  coachingLoop(); // fire-and-forget
}

function stopCoachingLoop() {
  coachingActive = false;
  coachingGen++; // 진행 중인 응답 무효화
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  store.coaching = { text: '', ready: false, active: false };
}

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
const PURPOSE_LABELS = {
  passport: '여권', student_id: '학생증', employee_id: '사원증',
  resume: '이력서', color_portrait: '컬러증명',
};

function renderSelectionSummary() {
  const summaryEl = document.querySelector('#selection-summary');
  if (!summaryEl) return;

  const labels = [];
  labels.push(PURPOSE_LABELS[store.purpose] || store.style || '');
  if (store.gender === 'male') labels.push('남성');
  else if (store.gender === 'female') labels.push('여성');
  summaryEl.textContent = labels.filter(Boolean).join(' · ');
}

// ─── window 노출 ───
Object.assign(window, {
  capturePhoto,
  toggleVoice,
});

// ─── 초기화 ───
async function init() {
  try {
    await sharedInit();
  } catch (err) {
    Monk.log('sharedInit 에러: ' + err.message);
  }

  // ── 퍼널 9필드 로딩 ──
  const purpose = loadSessionData('purpose');
  const age = loadSessionData('age');
  const gender = loadSessionData('gender');
  const clothing = loadSessionData('clothing');
  const clothingColor = loadSessionData('clothingColor');
  const tie = loadSessionData('tie');
  const hair = loadSessionData('hair');
  const background = loadSessionData('background');
  const expression = loadSessionData('expression');

  // 필수값 체크 (style은 sharedInit()에서 복원됨, purpose는 별도)
  if (!store.style || !purpose) {
    Monk.log('선택 데이터 없음 → 준비실로 이동');
    navigateTo('prep.html');
    return;
  }

  // store에 9필드 세팅
  store.purpose = purpose;
  store.clothing = clothing;
  store.clothingColor = clothingColor;
  store.tie = tie;
  store.hair = hair;
  store.background = background;
  store.expression = expression;

  // 선택 요약 뱃지 렌더링
  renderSelectionSummary();

  // 카메라 화면 활성화
  document.querySelector('#camera-area')?.classList.add('active');

  store.step = 1;
  store.stepLabel = TX.step1;
  store.voiceEnabled = true;
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
