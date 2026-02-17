/**
 * app.js — MONKOS AI 증명사진 앱 계층
 * monk.js 프레임워크 위에서 동작하는 비즈니스 로직
 */

import Monk from './monk.js';
import {
  API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx
} from './config.js';

// ─── 1. Store 초기화 ───
const store = Monk.store({
  // 사용자
  user: { id: null, email: null, name: null, credits: 0, avatar: '' },

  // 선택 상태
  style: null,
  gender: null,
  age: null,
  profileComplete: false,
  prepConfirmText: '',

  // 진행 상태
  step: 0,
  stepLabel: TX.stepReady,

  // 이미지 데이터
  captured: null,
  generated: null,
  cropped: null,

  // 코칭
  coaching: { text: TX.coachingCheck, ready: false, active: false },
  wsConnected: false,

  // QC
  qcResult: null,
  qcPassed: false,
  qcBadgeText: '',

  // 결과 화면
  resultTitle: TX.resultConfirm,
  resultSubtitle: TX.resultConfirmSub,
  showStep2Actions: false,
  showStep3Actions: false,

  // 규격 크롭
  specName: '',
  specSize: '',
  specPx: '',

  // 크레딧 모달
  creditModalOpen: false,
  creditModalTitle: '크레딧이 부족합니다',
  creditModalDesc: '이 작업을 수행하려면 크레딧이 필요합니다.',
  creditRequired: 10,
  creditLow: false,

  // 기타
  voiceEnabled: true,
  desktopBlocked: false,
  inappBrowser: false,
  downloadComplete: false,
  postCreditMsg: '',
  pageUrl: '',
  qrCodeUrl: '',
});

// ─── 2. Pipe 설정 ───
const pipe = Monk.pipe({
  precheck: { type: 'post', path: '/api/pre-check' },
  generate: { type: 'post', path: '/api/generate' },
  qc: { type: 'post', path: '/api/qc' },
  creditUse: { type: 'post', path: '/api/credit/use' },
  coaching: {
    type: 'ws',
    url: () => {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      // TODO: Workers 프록시 전환 시 URL 변경
      return `${protocol}//idphoto-kr.monkos.ai`;
    },
    onOpen: (ws) => {
      store.wsConnected = true;
      ws.send(JSON.stringify({ type: 'set-style', style: store.style }));
      showCoaching(TX.coachingInit);
      Monk.log('코칭 세션 연결');
    },
    onMessage: (msg) => {
      if (msg.type === 'ai-coaching' && store.step === 1) {
        showCoaching(msg.text);
      }
    },
    onClose: () => {
      store.wsConnected = false;
      Monk.log('코칭 세션 종료');
    },
    reconnect: { delay: 3000, max: 5 },
  },
}, {
  baseUrl: API.PORTAL_URL,
  onCreditShort: (err) => showCreditModal(err.required || 1, err.credits || 0, 'generate'),
  onError: (name, err) => Monk.log(`API 에러[${name}]: ${err.error || err.message}`),
});

// ─── 3. Media 설정 ───
const media = Monk.media({
  video: '#camera-video',
  canvas: '#capture-canvas',
  maxSize: MAX_CAPTURE_SIZE,
  captureQuality: 0.8,
  frameInterval: FRAME_INTERVAL_MS,
  faceDetection: true,
  mirror: true,
});

// ─── 4. Screen 정의 ───
const screens = Monk.screens({
  prep: {
    el: '#prep-screen',
    enter() {
      store.step = 0;
      store.stepLabel = TX.stepReady;
    },
  },
  camera: {
    el: '#camera-area',
    async enter() {
      store.step = 1;
      store.stepLabel = TX.step1;
      store.coaching = { text: TX.coachingCheck, ready: false, active: true };

      await media.start();
      pipe.connect('coaching');

      // 프레임 캡처 → WS 전송
      media.onFrame((frame) => {
        if (pipe.isConnected('coaching')) {
          // base64 → blob 변환 후 전송
          const base64 = frame.split(',')[1];
          const binary = atob(base64);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
          const blob = new Blob([array], { type: 'image/jpeg' });
          pipe.sendRaw('coaching', blob);
        }
      });

      // 컨트롤 표시
      document.querySelector('#controls')?.classList.add('active');
    },
    exit() {
      media.offFrame();
      media.stop();
      pipe.disconnect('coaching');
      store.coaching = { text: '', ready: false, active: false };
      document.querySelector('#controls')?.classList.remove('active');
    },
  },
  result: {
    el: '#result-overlay',
    enter() {
      // 결과 화면 진입 시 상태 설정은 호출 측에서 처리
    },
  },
  thankyou: {
    el: '#thankyou-screen',
    enter() {
      // cropped는 showPreview()에서 이미 설정됨
      store.postCreditMsg = store.user.id
        ? `💎 10c 사용 · 잔여 ${store.user.credits}c`
        : '';
    },
  },
});

// ─── 5. 음성 가이드 ───
let koVoice = null;

function initVoice() {
  const voices = speechSynthesis.getVoices();
  koVoice = voices.find(v => v.name.includes('Yuna'))
         || voices.find(v => v.lang.startsWith('ko'));
  if (koVoice) Monk.log(`음성 가이드: ${koVoice.name}`);
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = initVoice;
  initVoice();
}

function speakKo(text) {
  if (!store.voiceEnabled || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 1.1;
  u.pitch = 1.05;
  if (koVoice) u.voice = koVoice;
  speechSynthesis.speak(u);
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

// ─── 6. 코칭 표시 ───
let coachingTimeout = null;

function showCoaching(text) {
  store.coaching = {
    text,
    ready: text.includes('OK') || text.includes('좋아요') || text.includes('완벽'),
    active: true,
  };

  // 촬영 버튼 ready 상태
  const btnCapture = document.querySelector('#btn-capture');
  if (btnCapture) {
    btnCapture.classList.toggle('ready', store.coaching.ready);
  }

  // face-guide ready 상태
  const faceGuide = document.querySelector('#face-guide');
  if (faceGuide) {
    faceGuide.classList.toggle('ready', store.coaching.ready);
  }

  // coaching-overlay ready 상태
  const overlay = document.querySelector('#coaching-overlay');
  if (overlay) {
    overlay.classList.toggle('ready', store.coaching.ready);
  }

  // TTS
  speakKo(text);

  // 타임아웃 후 숨김
  if (coachingTimeout) clearTimeout(coachingTimeout);
  coachingTimeout = setTimeout(() => {
    if (store.step === 1) {
      store.coaching = { ...store.coaching, active: true };
    }
  }, COACHING_DISPLAY_MS);
}

// ─── 7. 준비 화면 선택 로직 ───
function selectGender(gender) {
  store.gender = gender;
  // UI 업데이트
  document.querySelectorAll('[data-gender]').forEach(c => {
    c.classList.toggle('active', c.dataset.gender === gender);
  });
  checkProfileComplete();
}

function selectAge(age) {
  store.age = age;
  document.querySelectorAll('[data-age]').forEach(c => {
    c.classList.toggle('active', c.dataset.age === age);
  });
  checkProfileComplete();
}

function selectStyle(style) {
  store.style = style;
  document.querySelectorAll('.prep-style-option').forEach(c => {
    c.classList.toggle('active', c.dataset.style === style);
  });
  syncStyleChips(style);
  checkProfileComplete();
}

function selectStyleInCamera(style) {
  store.style = style;
  syncStyleChips(style);
  // WS로 스타일 변경 전송
  if (pipe.isConnected('coaching')) {
    pipe.send('coaching', { type: 'set-style', style });
  }
  Monk.log(`스타일 변경: ${style}`);
}

function syncStyleChips(style) {
  document.querySelectorAll('.style-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.style === style);
  });
}

function checkProfileComplete() {
  const allSelected = store.gender && store.age && store.style;
  store.profileComplete = allSelected;

  // 버튼 활성화
  const btn = document.querySelector('#btn-start');
  if (btn) btn.disabled = !allSelected;

  updateConfirmMessage();
}

function updateConfirmMessage() {
  if (!store.gender || !store.age || !store.style) {
    store.prepConfirmText = '';
    return;
  }

  const genderText = store.gender === 'male' ? '남성' : '여성';
  const ageMap = { child: '유아~12세', teen: '13~18세', adult: '19세 이상' };
  const styleMap = { id_photo: '여권/신분증', resume: '취업/컬러증명' };
  const styleNote = store.style === 'id_photo'
    ? '눈썹·이마가 보이도록 준비해 주세요.'
    : '헤어와 의상을 깔끔하게 정돈해 주세요.';

  store.prepConfirmText = `<strong>${styleMap[store.style]}</strong> · ${genderText} · ${ageMap[store.age]}<br>${styleNote}<br><span style="color:#a78bfa;">준비가 완료되셨으면 촬영 시작 버튼을 눌러주세요!</span>`;

  // HTML 바인딩은 textContent만 지원하므로 직접 설정
  const el = document.querySelector('#prep-confirm-text');
  if (el) el.innerHTML = store.prepConfirmText;
}

// ─── 8. 촬영 시작 ───
async function startShooting() {
  // iOS Safari: user gesture 내에서 speechSynthesis 초기화
  if ('speechSynthesis' in window) {
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    speechSynthesis.speak(warmup);
  }

  const btn = document.querySelector('#btn-start');
  if (btn) {
    btn.disabled = true;
    btn.textContent = TX.btnStarting;
  }

  try {
    await screens.go('camera');
    Monk.log('촬영 모드 시작');
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '촬영 시작하기';
    }
    alert(TX.cameraError);
    Monk.log('카메라 시작 실패: ' + err.message);
  }
}

// ─── 9. 촬영 ───
function capturePhoto() {
  if (store.step !== 1) return;

  store.captured = media.capture();
  store.step = 2;
  store.stepLabel = TX.step2;
  store.resultTitle = TX.resultConfirm;
  store.resultSubtitle = store.coaching.ready ? TX.resultAIOK : TX.resultConfirmSub;
  store.showStep2Actions = true;
  store.showStep3Actions = false;
  store.generated = null;
  store.qcResult = null;

  // 코칭 종료
  pipe.disconnect('coaching');
  if ('speechSynthesis' in window) speechSynthesis.cancel();

  screens.go('result');
  Monk.log('촬영 완료');
}

// ─── 10. 재촬영 ───
function retakePhoto() {
  store.captured = null;
  store.generated = null;
  store.cropped = null;
  store.qcResult = null;
  store.qcPassed = false;
  store.showStep2Actions = false;
  store.showStep3Actions = false;

  screens.go('camera');
  Monk.log('재촬영');
}

// ─── 11. 생성 + QC 파이프라인 ───
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
    // 사전분석 실패 시 생성 진행
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

    // 생성 성공
    store.generated = genResult.image;
    store.resultTitle = TX.qcVerifying;
    store.resultSubtitle = TX.qcVerifyingSub;
    store.qcBadgeText = TX.qcChecking;
    Monk.log('생성 완료 → QC 시작');

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

  if (passed) {
    store.stepLabel = TX.resultDone;
  }

  // 다운로드 버튼 활성화
  const btnDownload = document.querySelector('#btn-download');
  if (btnDownload) btnDownload.disabled = !passed;

  Monk.log(`QC: ${passed ? 'PASS' : 'FAIL'} (${similarity}%)`);
}

function showGenerateError(error) {
  store.qcBadgeText = TX.genFail + ': ' + error;
  store.qcPassed = false;
  store.resultTitle = TX.genFail;
  store.showStep3Actions = true;
  Monk.log('생성 에러: ' + error);
}

function showQCError(error) {
  store.qcBadgeText = 'QC: ' + error;
  store.qcPassed = false;
  store.showStep3Actions = true;
  // QC 실패해도 다운로드 허용
  const btnDownload = document.querySelector('#btn-download');
  if (btnDownload) btnDownload.disabled = false;
  Monk.log('QC 에러: ' + error);
}

// ─── 12. 다운로드 ───
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
      showPreview();
    } catch (err) {
      if (err.status === 402) {
        showCreditModal(CREDIT_COST.download, err.credits || 0, 'download');
      } else {
        Monk.log('다운로드 크레딧 에러: ' + (err.error || err.message));
      }
    }
    return;
  }

  // 비로그인: 바로 미리보기
  showPreview();
}

async function showPreview() {
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
      // 크롭 실패 시 원본 JPEG 변환으로 폴백
      store.cropped = await media.toJpeg(store.generated, 0.92);
    }
  }
  await screens.go('thankyou');
  Monk.log('미리보기 모드 표시');
}

async function saveToPhotos() {
  if (!store.generated) return;
  const jpegUrl = await media.toJpeg(store.generated, 0.92);

  // navigator.share 지원 시
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

  // 폴백: 직접 다운로드
  const a = document.createElement('a');
  a.href = jpegUrl;
  a.download = `monkos_photo_${Date.now()}.jpg`;
  a.click();
  Monk.log('JPEG 저장 완료');
}

// ─── 13. 크레딧 모달 ───
function showCreditModal(required, current, action) {
  store.creditRequired = required;
  store.creditModalTitle = action === 'download'
    ? '다운로드에 크레딧이 필요합니다'
    : '생성에 크레딧이 필요합니다';
  store.creditModalDesc = action === 'download'
    ? '사진을 다운로드하려면 10 크레딧이 필요합니다. 공유하면 10 크레딧을 받을 수 있습니다!'
    : '사진을 생성하려면 1 크레딧이 필요합니다.';
  store.creditModalOpen = true;
}

function closeCreditModal() {
  store.creditModalOpen = false;
}

// ─── 14. 결제 (토스) ───
async function buyCreditsKR(amount, credits) {
  if (!store.user.id) {
    alert('로그인이 필요합니다');
    return;
  }
  closeCreditModal();

  const orderId = `MONKOS_${store.user.id.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey: store.user.id });

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId: orderId,
      orderName: `MONKOS ${credits} 크레딧`,
      successUrl: `${window.location.origin}${window.location.pathname}?toss=success`,
      failUrl: `${window.location.origin}${window.location.pathname}?toss=fail`,
      customerEmail: store.user.email || undefined,
      customerName: store.user.name || undefined,
    });
  } catch (err) {
    if (err.code === 'PAY_PROCESS_CANCELED' || err.code === 'USER_CANCEL') {
      Monk.log('결제 취소');
    } else {
      alert('결제 오류: ' + (err.message || err.code));
    }
  }
}

async function initFromTossResult() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('toss') === 'fail') {
    const msg = params.get('message') || '결제 실패';
    history.replaceState({}, '', window.location.pathname);
    alert(msg);
    return;
  }

  if (params.get('toss') === 'success') {
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = params.get('amount');

    history.replaceState({}, '', window.location.pathname);

    if (!paymentKey || !orderId || !amount) return;

    try {
      const res = await fetch(`${API.PORTAL_URL}/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId: store.user.id }),
      });
      const data = await res.json();
      if (data.success) {
        store.user = { ...store.user, credits: data.credits };
        Monk.log(`결제 완료: ${data.credits}c`);
        alert(`결제가 완료되었습니다!\n현재 크레딧: ${data.credits}c`);
      } else {
        alert('결제 확인 실패: ' + (data.error || ''));
      }
    } catch (err) {
      Monk.log('결제 확인 에러: ' + err.message);
    }
  }
}

// ─── 15. 인증 ───
async function initFromUrlToken() {
  const params = new URLSearchParams(location.search);
  const uid = params.get('uid');
  const token = params.get('token');
  if (!uid || !token) return false;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/auth/verify?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (data.success && data.user) {
      sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
      history.replaceState(null, '', location.pathname);
      Monk.log(`토큰 로그인 성공: ${data.user.email}`);
      return true;
    }
  } catch (err) {
    Monk.log('토큰 검증 실패: ' + err.message);
  }
  return false;
}

function initCredits() {
  const stored = sessionStorage.getItem('monkos_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      store.user = {
        id: user.id,
        email: user.email,
        name: user.name || user.email?.split('@')[0] || '',
        credits: user.credits ?? 0,
        avatar: user.avatar || user.picture || '',
      };
      Monk.log(`로그인: ${user.email} (${store.user.credits}c)`);
    } catch (e) {
      Monk.log('사용자 정보 파싱 실패');
    }
  } else {
    Monk.log('비로그인 상태');
  }
}

async function fetchLatestCredits() {
  if (!store.user.id) return;
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits?userId=${encodeURIComponent(store.user.id)}`);
    const data = await res.json();
    if (data.credits !== undefined) {
      store.user = { ...store.user, credits: data.credits };
      // sessionStorage 동기화
      const stored = sessionStorage.getItem('monkos_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.credits = data.credits;
        sessionStorage.setItem('monkos_user', JSON.stringify(user));
      }
      Monk.log(`크레딧 갱신: ${data.credits}c`);
    }
  } catch (err) {
    Monk.log('크레딧 조회 실패: ' + err.message);
  }
}

// 탭 복귀 시 크레딧 재조회
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && store.user.id) {
    fetchLatestCredits();
  }
});


// ─── 16. 기타 유틸리티 ───
function openExternal() {
  const url = location.href;
  if (/Android/i.test(navigator.userAgent)) {
    location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  } else {
    location.href = url;
  }
}

function openTelegram() {
  const uid = store.user.id || 'guest';
  const link = `https://t.me/monkos_event_bot?start=${encodeURIComponent(uid)}`;
  window.open(link, '_blank');
  Monk.log('텔레그램 이벤트 링크 오픈');
}

function checkInappBrowser() {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK|NAVER|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|DaumApps/i.test(ua)) {
    store.inappBrowser = true;
  }
}

function showDesktopBlocker() {
  const pageUrl = location.href.replace('localhost:8080', 'idphoto-kr.monkos.ai');
  store.pageUrl = pageUrl;
  store.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=000000`;
  store.desktopBlocked = true;
}

// ─── 17. window 노출 (인라인 onclick 호환) ───
Object.assign(window, {
  selectGender,
  selectAge,
  selectStyle,
  selectStyleInCamera,
  startShooting,
  capturePhoto,
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  saveToPhotos,
  buyCreditsKR,
  closeCreditModal,
  toggleVoice,
  openExternal,
  openTelegram,
});

// ─── 18. 초기화 ───
async function init() {
  checkInappBrowser();
  await initFromUrlToken();
  initCredits();
  await initFromTossResult();

  // 데스크톱 차단
  const devMode = new URLSearchParams(location.search).has('dev');
  if (!Monk.isMobile() && !devMode) {
    showDesktopBlocker();
  }

  // 준비 화면으로 시작
  screens.go('prep');

  Monk.log('앱 초기화 완료');
}

init();
