/**
 * result.js — 분석실 전용 로직
 * 프리체크 → 생성 → 결제 → 규격 크롭 → 수령처 이동
 */

import {
  store, pipe, Monk, TX, PHOTO_SPECS, CREDIT_COST,
  sharedInit, showCreditModal, saveSessionData, loadSessionData, navigateTo,
  buyCreditsKR, TOSS_CLIENT_KEY, API, fetchLatestCredits, closeCreditModal
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

// ─── 게이트 스타일 ───
const GATE_CSS = `
.gate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center}
.gate-card{background:#fff;border-radius:20px 20px 0 0;padding:28px 20px 32px;width:100%;max-width:420px;position:relative;animation:gateUp .3s ease}
@keyframes gateUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.gate-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#888}
.gate-title{font-size:18px;font-weight:700;text-align:center;margin-bottom:16px}
.gate-badge{background:#FFF3E0;color:#E65100;padding:8px 12px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;margin-bottom:16px}
.gate-checklist{margin-bottom:12px}
.gate-check{display:flex;align-items:center;gap:8px;padding:8px 0;font-size:14px;color:#444}
.gate-check.done{color:#2E7D32}
.gate-check .icon{font-size:16px;width:20px}
.gate-check .credit{margin-left:auto;font-weight:600;color:#1976D2}
.gate-progress{text-align:center;font-size:15px;font-weight:600;padding:8px 0 16px;color:#333}
.gate-btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px}
.gate-btn-kakao{background:#FEE500;color:#000}
.gate-btn-kakao:hover{background:#FDD835}
.gate-btn-pay{background:#f5f5f5;color:#333;border:1px solid #ddd}
.gate-btn-pay:hover{background:#eee}
.gate-btn-share{background:#0088cc;color:#fff}
.gate-btn-share:hover{background:#0077b3}
.gate-btn-consent{background:#E8F5E9;color:#2E7D32;border:1px solid #C8E6C9}
.gate-btn-consent:hover{background:#C8E6C9}
.gate-btn:disabled{opacity:.5;cursor:not-allowed}
.gate-divider{display:flex;align-items:center;margin:12px 0}
.gate-divider::before,.gate-divider::after{content:'';flex:1;border-bottom:1px solid #eee}
.gate-divider span{padding:0 12px;color:#999;font-size:13px}
.gate-login-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center}
.gate-login-card{background:#fff;border-radius:16px;padding:28px 20px;width:90%;max-width:340px;text-align:center}
.gate-login-msg{font-size:15px;color:#333;margin-bottom:20px;white-space:pre-line}
`;

// ─── 게이트 상태 ───
let gateCredits = 0;

function injectGateStyles() {
  if (document.getElementById('gate-styles')) return;
  const el = document.createElement('style');
  el.id = 'gate-styles';
  el.textContent = GATE_CSS;
  document.head.appendChild(el);
}

// ─── 다운로드 게이트 팝업 ───
function showDownloadGatePopup() {
  injectGateStyles();
  // 기존 팝업 제거
  const old = document.getElementById('download-gate');
  if (old) old.remove();

  gateCredits = 0;

  const overlay = document.createElement('div');
  overlay.id = 'download-gate';
  overlay.className = 'gate-overlay';
  overlay.innerHTML = `
    <div class="gate-card">
      <button class="gate-close" onclick="closeDownloadGatePopup()">&times;</button>
      <h2 class="gate-title">로그인이 필요한 서비스입니다</h2>
      <div class="gate-badge">가입 이벤트 — 첫 1장 무료!</div>
      <div class="gate-checklist">
        <div class="gate-check" id="gate-ck-login">
          <span class="icon">☐</span>
          <span>카카오 로그인</span>
          <span class="credit">30c 증정</span>
        </div>
        <div class="gate-check" id="gate-ck-event" style="opacity:.4">
          <span class="icon">☐</span>
          <span>텔레그램 채널 가입</span>
          <span class="credit">+40c</span>
        </div>
      </div>
      <div class="gate-progress" id="gate-progress">
        = <span id="gate-progress-num">0</span>c / 70c
      </div>
      <div id="gate-phase1">
        <button class="gate-btn gate-btn-kakao" onclick="startKakaoLogin()">카카오 로그인으로 무료 받기</button>
        <div class="gate-divider"><span>또는</span></div>
        <button class="gate-btn gate-btn-pay" onclick="buyDirectKR()">바로 결제 ₩10,150</button>
      </div>
      <div id="gate-phase2" style="display:none">
        <div style="text-align:center;margin-bottom:12px;font-size:14px;color:#666;line-height:1.5;">
          MONKOS 텔레그램 채널에 가입하면<br>40c를 드립니다!
        </div>
        <button class="gate-btn gate-btn-share" onclick="handleTelegramJoin()">📱 텔레그램 채널 가입하기</button>
        <div id="gate-tg-verify-hint" style="display:none;text-align:center;margin:8px 0;font-size:13px;color:#888;">
          가입 후 아래 버튼을 눌러주세요
        </div>
        <button class="gate-btn gate-btn-consent" id="gate-verify-tg" onclick="verifyTelegramJoin()" style="display:none">가입 확인하기</button>
        <div class="gate-divider"><span>또는</span></div>
        <button class="gate-btn gate-btn-pay" onclick="buyDirectKR()">바로 결제하기 ₩10,150</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  Monk.log('다운로드 게이트 팝업 표시');
}

function closeDownloadGatePopup() {
  const el = document.getElementById('download-gate');
  if (el) el.remove();
}

function updateGateUI(credits) {
  gateCredits = credits;
  const num = document.getElementById('gate-progress-num');
  if (num) num.textContent = credits;

  if (credits >= 70) {
    // 70c 달성 — 자동 다운로드 진행
    closeDownloadGatePopup();
    Monk.log(`게이트 달성: ${credits}c → 다운로드 진행`);
    proceedDownloadAfterGate();
  }
}

async function proceedDownloadAfterGate() {
  // 로그인 후 크레딧 최신화
  await fetchLatestCredits();

  if (store.user.credits < CREDIT_COST.download) {
    // 이벤트 크레딧으로도 부족하면 충전 모달
    if (typeof window.showChargeModal === 'function') {
      window.showChargeModal();
    } else {
      showCreditModal(CREDIT_COST.download, store.user.credits, 'download');
    }
    return;
  }

  try {
    const result = await pipe.run('creditUse', { userId: store.user.id, type: 'download' });
    store.user = { ...store.user, credits: result.credits };
    await cropAndShowPostDownload();
  } catch (err) {
    if (err.status === 402) {
      if (typeof window.showChargeModal === 'function') {
        window.showChargeModal();
      } else {
        showCreditModal(CREDIT_COST.download, err.credits || 0, 'download');
      }
    } else {
      Monk.log('다운로드 크레딧 에러: ' + (err.error || err.message));
    }
  }
}

// ─── 카카오 로그인 (팝업 + postMessage) ───
function startKakaoLogin() {
  const popup = window.open(
    `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=idphoto-kr`,
    'kakao-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/kakao`;
    return;
  }

  function handler(e) {
    if (e.origin !== API.PORTAL_URL) return;
    if (e.data && e.data.type === 'auth-success') {
      window.removeEventListener('message', handler);
      // 유저 데이터 저장
      localStorage.setItem('monkos_user', JSON.stringify(e.data.user));
      if (e.data.token) localStorage.setItem('monkos_token', e.data.token);
      // store 갱신
      const u = e.data.user;
      store.user = {
        id: u.id, email: u.email, name: u.name,
        credits: u.credits ?? 0, avatar: u.picture || '',
      };
      Monk.log(`로그인 성공: ${u.email || u.name} (${store.user.credits}c)`);
      onKakaoLoginSuccess();
    }
  }
  window.addEventListener('message', handler);
  setTimeout(() => window.removeEventListener('message', handler), 180000);
}

async function onKakaoLoginSuccess() {
  // 체크리스트 UI 업데이트
  const ckLogin = document.getElementById('gate-ck-login');
  if (ckLogin) {
    ckLogin.classList.add('done');
    ckLogin.querySelector('.icon').textContent = '✅';
  }

  // 가입 보너스 30c 요청
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, eventType: 'signup_bonus' }),
    });
    const data = await res.json();
    if (data.success) {
      store.user = { ...store.user, credits: data.credits ?? store.user.credits };
      updateGateUI(30);
      Monk.log('가입 보너스 30c 지급');
    } else {
      // 이미 받은 경우 등 — 현재 크레딧으로 진행
      updateGateUI(Math.min(store.user.credits, 30));
      Monk.log('가입 보너스: ' + (data.error || '이미 수령'));
    }
  } catch (err) {
    Monk.log('가입 보너스 요청 실패: ' + err.message);
    updateGateUI(0);
  }

  // Phase 2 표시 (이벤트 선택)
  const phase1 = document.getElementById('gate-phase1');
  const phase2 = document.getElementById('gate-phase2');
  if (phase1) phase1.style.display = 'none';
  if (phase2) phase2.style.display = 'block';

  const ckEvent = document.getElementById('gate-ck-event');
  if (ckEvent) ckEvent.style.opacity = '1';
}

// ─── 이벤트 크레딧 요청 ───
async function requestEventCredit(eventType) {
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, eventType }),
    });
    const data = await res.json();
    if (data.success) {
      store.user = { ...store.user, credits: data.credits ?? store.user.credits };
      return true;
    }
    Monk.log(`이벤트 크레딧 실패: ${data.error || eventType}`);
    return false;
  } catch (err) {
    Monk.log(`이벤트 크레딧 에러: ${err.message}`);
    return false;
  }
}

// ─── 텔레그램 채널 가입 (게이트 Phase 2) ───
async function handleTelegramJoin() {
  if (!store.user.id) return;
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/telegram/gate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, type: 'gate' }),
    });
    const data = await res.json();
    if (data.deeplink) {
      window.open(data.deeplink, '_blank');
      // 가입 확인 버튼 + 안내 표시
      const verifyBtn = document.getElementById('gate-verify-tg');
      const hint = document.getElementById('gate-tg-verify-hint');
      if (verifyBtn) verifyBtn.style.display = 'block';
      if (hint) hint.style.display = 'block';
      Monk.log('텔레그램 채널 가입 딥링크 오픈');
    }
  } catch (err) {
    Monk.log('텔레그램 딥링크 에러: ' + err.message);
    alert('텔레그램 연결 중 오류가 발생했습니다.');
  }
}

async function verifyTelegramJoin() {
  const ok = await requestEventCredit('telegram_join');
  if (ok) {
    const ck = document.getElementById('gate-ck-event');
    if (ck) { ck.classList.add('done'); ck.querySelector('.icon').textContent = '✅'; }
    updateGateUI(gateCredits + 40);
    Monk.log('텔레그램 채널 가입 검증 성공 +40c');
  } else {
    alert('채널 가입이 확인되지 않습니다.\n가입 후 다시 시도해주세요.');
  }
}

// ─── 바로 결제 (비로그인 단건) ───
async function buyDirectKR() {
  closeDownloadGatePopup();

  if (!TOSS_CLIENT_KEY) {
    alert('결제 시스템 준비 중입니다.\n곧 이용 가능합니다!');
    return;
  }

  const orderId = `DIRECT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey: `GUEST_${orderId}` });

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: 10150 },
      orderId,
      orderName: 'MONKOS AI 증명사진 1장',
      successUrl: `${window.location.origin}${window.location.pathname}?toss=direct`,
      failUrl: `${window.location.origin}${window.location.pathname}?toss=fail`,
    });
  } catch (err) {
    if (err.code !== 'PAY_PROCESS_CANCELED' && err.code !== 'USER_CANCEL') {
      alert('결제 오류: ' + (err.message || err.code));
    }
  }
}

// ─── 바로 결제 리다이렉트 처리 ───
async function initDirectPaymentResult() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('toss') !== 'direct') return;

  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');
  history.replaceState({}, '', window.location.pathname);

  if (!paymentKey || !orderId || !amount) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/payments/toss/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const data = await res.json();
    if (data.success && data.downloadToken) {
      Monk.log('단건 결제 완료 — 다운로드 진행');
      await cropAndShowPostDownload();
    } else {
      alert('결제 확인 실패: ' + (data.error || ''));
    }
  } catch (err) {
    Monk.log('단건 결제 확인 에러: ' + err.message);
    alert('결제 확인 중 오류가 발생했습니다.');
  }
}

// ─── 로그인 필요 모달 (생성 2회차 차단용) ───
function showLoginRequiredModal(message) {
  injectGateStyles();
  const old = document.getElementById('login-required-modal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'login-required-modal';
  overlay.className = 'gate-login-overlay';
  overlay.innerHTML = `
    <div class="gate-login-card">
      <p class="gate-login-msg">${message}</p>
      <button class="gate-btn gate-btn-kakao" onclick="startKakaoLoginSimple()">카카오 로그인</button>
      <button class="gate-btn gate-btn-pay" style="margin-top:8px" onclick="closeLoginRequiredModal()">닫기</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function closeLoginRequiredModal() {
  const el = document.getElementById('login-required-modal');
  if (el) el.remove();
}

function startKakaoLoginSimple() {
  closeLoginRequiredModal();
  const popup = window.open(
    `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=idphoto-kr`,
    'kakao-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/kakao`;
    return;
  }

  function handler(e) {
    if (e.origin !== API.PORTAL_URL) return;
    if (e.data && e.data.type === 'auth-success') {
      window.removeEventListener('message', handler);
      localStorage.setItem('monkos_user', JSON.stringify(e.data.user));
      if (e.data.token) localStorage.setItem('monkos_token', e.data.token);
      const u = e.data.user;
      store.user = {
        id: u.id, email: u.email, name: u.name,
        credits: u.credits ?? 0, avatar: u.picture || '',
      };
      Monk.log(`로그인 성공: ${u.email || u.name} (${store.user.credits}c)`);
    }
  }
  window.addEventListener('message', handler);
  setTimeout(() => window.removeEventListener('message', handler), 180000);
}

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

  // 비로그인 1회 생성 제한
  if (!store.user.id) {
    if (localStorage.getItem('monkos_free_gen')) {
      showLoginRequiredModal('무료 체험을 사용하셨습니다.\n로그인 후 이용해주세요.');
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
    try { sessionStorage.setItem('monkos_generated', genResult.image); } catch(e) {}
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
      if (typeof window.showChargeModal === 'function') {
        window.showChargeModal();
      } else {
        showCreditModal(err.required || 10, err.credits || 0, 'generate');
      }
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

  // 비로그인 → 게이트 팝업
  if (!store.user.id) {
    showDownloadGatePopup();
    return;
  }

  // 로그인 사용자: 잔액 부족 → 충전 모달
  if (store.user.credits < CREDIT_COST.download) {
    if (typeof window.showChargeModal === 'function') {
      window.showChargeModal();
    } else {
      showCreditModal(CREDIT_COST.download, store.user.credits, 'download');
    }
    return;
  }

  // 크레딧 차감 → 수령처
  try {
    const result = await pipe.run('creditUse', { userId: store.user.id, type: 'download' });
    store.user = { ...store.user, credits: result.credits };
    await cropAndShowPostDownload();
  } catch (err) {
    if (err.status === 402) {
      if (typeof window.showChargeModal === 'function') {
        window.showChargeModal();
      } else {
        showCreditModal(CREDIT_COST.download, err.credits || 0, 'download');
      }
    } else {
      Monk.log('다운로드 크레딧 에러: ' + (err.error || err.message));
    }
  }
}

async function cropAndShowPostDownload() {
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

  // sessionStorage에 저장 (thankyou.html 호환)
  if (store.cropped) {
    saveSessionData('cropped', store.cropped);
  }

  // 포스트 다운로드 상태로 전환
  store.downloadComplete = true;
  store.showStep3Actions = false;
  store.resultTitle = '다운로드 완료!';
  store.resultSubtitle = 'MONKOS AI 증명사진이 준비되었습니다';

  // 100c 미션 표시 여부 (로그인 + 다운로드 완료)
  store.showMission = !!store.user.id;

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

// ─── 100c 미션 ───
async function submitSnsConsent() {
  const checkbox = document.getElementById('mission-consent-check');
  if (!checkbox || !checkbox.checked) {
    alert('동의에 체크해주세요.');
    return;
  }
  if (!store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/consent/sns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, agreed: true }),
    });
    const data = await res.json();
    if (data.success) {
      store.missionConsentDone = true;
      const btn = document.getElementById('btn-consent-submit');
      if (btn) { btn.disabled = true; btn.textContent = '✅ 동의 완료됨'; btn.style.opacity = '0.6'; }
      checkbox.disabled = true;
      Monk.log('SNS 활용 동의 완료');
    } else {
      alert(data.error || '동의 처리 중 문제가 발생했습니다.');
    }
  } catch (err) {
    Monk.log('동의서 제출 에러: ' + err.message);
    alert('동의 처리 중 오류가 발생했습니다.');
  }
}

async function openMissionBot() {
  if (!store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/telegram/gate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, type: 'mission' }),
    });
    const data = await res.json();
    if (data.deeplink) {
      window.open(data.deeplink, '_blank');
      Monk.log('미션 텔레그램 봇 오픈');
    } else {
      alert(data.error || '텔레그램 연결 중 오류가 발생했습니다.');
    }
  } catch (err) {
    Monk.log('미션 봇 딥링크 에러: ' + err.message);
    alert('텔레그램 연결 중 오류가 발생했습니다.');
  }
}

async function verifyMission() {
  if (!store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits/mission-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id }),
    });
    const data = await res.json();
    if (data.success) {
      store.user = { ...store.user, credits: data.credits ?? store.user.credits };
      store.showMission = false;
      Monk.log(`미션 완료! +100c → ${data.credits}c`);
      alert(`🎉 미션 완료! 100c가 지급되었습니다.\n현재 잔액: ${data.credits}c`);
    } else {
      alert(data.error || '미션 조건을 확인해주세요.\n- SNS 활용 동의서 서명\n- 텔레그램으로 캡쳐 전송');
    }
  } catch (err) {
    Monk.log('미션 확인 에러: ' + err.message);
    alert('미션 확인 중 오류가 발생했습니다.');
  }
}

// ─── window 노출 ───
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  // 게이트 팝업
  showDownloadGatePopup,
  closeDownloadGatePopup,
  startKakaoLogin,
  startKakaoLoginSimple,
  handleTelegramJoin,
  verifyTelegramJoin,
  buyDirectKR,
  showLoginRequiredModal,
  closeLoginRequiredModal,
  // 포스트 다운로드 (100c 미션)
  saveToGallery,
  submitSnsConsent,
  openMissionBot,
  verifyMission,
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

  // 단건 결제 리다이렉트 처리
  await initDirectPaymentResult();

  // 광고 manifest 프리로드
  loadAdManifest();

  // sessionStorage에서 생성 이미지 복원 (토스 리다이렉트 후 복귀용)
  if (!store.generated) {
    const savedGen = sessionStorage.getItem('monkos_generated');
    if (savedGen) {
      store.generated = savedGen;
      Monk.log('생성 이미지 sessionStorage에서 복원');
    }
  }

  // 원본 표시
  showOriginal();

  Monk.log('분석실 초기화 완료');
}

init();
