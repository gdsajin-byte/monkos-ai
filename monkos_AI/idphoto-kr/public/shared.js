/**
 * shared.js — 전 페이지 공통 로직
 * app.js에서 추출: Store, Pipe(REST), 인증, 크레딧, 결제, 유틸리티
 */

import Monk from './monk.js';
import {
  API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, CAPTURE_QUALITY, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID, SCHEMA_VERSION,
  CHARGE_OPTIONS, KRW_PER_CREDIT
} from './config.js';

// Re-export for page JS convenience
export {
  Monk, API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, CAPTURE_QUALITY, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID, SCHEMA_VERSION,
  CHARGE_OPTIONS, KRW_PER_CREDIT
};

// ─── fetch timeout 래퍼 ───
function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

// ─── Store 초기화 ───
export const store = Monk.store({
  // 사용자
  user: { id: null, email: null, name: null, credits: 0, avatar: '' },

  // 퍼널 선택 (v5 — SCHEMA_v5_확정.md 기준)
  format: null,          // "passport" | "id"
  gender: null,          // "f" | "m"
  age: null,             // "baby" | "child" | "teen" | "adult"
  clothing: 'default',   // "default" | "change" | "casual" | "suit"
  clothingColor: '',     // 조건부
  suitColor: '',         // 조건부
  shirtColor: '',        // 조건부
  tieColor: '',          // 조건부
  tiePattern: '',        // 조건부
  hair: 'default',       // "default" | "tidy" | "updo"
  bgColor: 'white',      // "white" | "gray" | "blue" | "beige"
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

  // 상태 텍스트 (사전분석/생성 진행)
  statusText: '',

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

  // 워터마크 프리뷰
  watermarkPreview: null,

  // 기타
  desktopBlocked: false,
  inappBrowser: false,
  downloadComplete: false,
  postCreditMsg: '',
  pageUrl: '',
  qrCodeUrl: '',

  // 포스트 다운로드 (크레딧 게이트 v2)
  showMission: false,
  missionConsentDone: false,
});

// ─── Pipe 설정 (REST only) ───
export const pipe = Monk.pipe({
  precheck: { type: 'post', path: API.PRECHECK },
  generate: { type: 'post', path: API.GENERATE },
  creditUse: { type: 'post', path: API.CREDIT_USE },
  creditRefund: { type: 'post', path: API.CREDIT_REFUND },
  // coaching WS 제거 (2026-09-29) — 촬영 준비 판정은 클라이언트 capture-gate.js
}, {
  baseUrl: '',
  onCreditShort: (err) => showCreditModal(err.required || 10, err.credits || 0, 'generate'),
  onError: (name, err) => Monk.log(`API 에러[${name}]: ${err.error || err.message}`),
});

// ─── 크레딧 모달 ───
export function showCreditModal(required, current, action) {
  store.creditRequired = required;
  store.creditModalTitle = action === 'download'
    ? '다운로드에 크레딧이 필요합니다'
    : '리터칭에 크레딧이 필요합니다';
  store.creditModalDesc = action === 'download'
    ? '사진을 다운로드하려면 70 크레딧이 필요합니다.'
    : '리터칭에 10 크레딧이 필요합니다.';
  store.creditModalOpen = true;
}

export function closeCreditModal() {
  store.creditModalOpen = false;
}

// ─── 충전 모달 (v3: 바텀시트) ───
export function showChargeModal() {
  import('./modules/charge.js').then(m => m.ChargeModule.show());
}

// ─── 결제 계측 (2026-09-20 결제 표면 감사) ───
// 기존 purchase 이벤트와 같은 공통 파라미터(payment_provider·service·market)를 쓴다.
// ⚠️ paymentKey·토큰·이메일은 파라미터·본문에 절대 넣지 않는다 (헌법 4조 1항)
const PAY_SERVICE = 'idphoto-kr';

export function isInApp() {
  return /(GSA\/|FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER\(|DaumApps|; wv\))/i.test(navigator.userAgent || '');
}

export function gaPay(name, params) {
  try {
    if (typeof gtag !== 'function') return;
    gtag('event', name, { payment_provider: 'toss', service: PAY_SERVICE, market: 'kr', ...(params || {}) });
  } catch (e) {}
}

// GA는 유실 가능 → 실패 사유의 정본은 포털 서버 WARNING 로그([Pay-Fail]).
// 문자열 본문 sendBeacon = text/plain simple request → 교차 출처여도 preflight가 없다
// (포털 핸들러가 원문을 JSON으로 파싱, 모르는 필드는 무시). 실패해도 고객 동선을 막지 않는다.
export function reportPayFail(stage, code, message) {
  const safeCode = String(code || 'UNKNOWN').slice(0, 60);
  gaPay('pay_fail', { fail_stage: stage, fail_code: safeCode, in_app: isInApp() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API.PORTAL_URL}/api/payments/fail`, JSON.stringify({
        service: PAY_SERVICE, provider: 'toss', stage, code: safeCode,
        message: String(message || '').slice(0, 200),
        vw: window.innerWidth, vh: window.innerHeight, inApp: isInApp(),
      }));
    }
  } catch (e) {}
}

// ─── 결제 (토스) — charge.html 리다이렉트 ───
export async function buyCreditsKR(amount, credits) {
  if (!store.user.id) {
    import('./modules/gate.js').then(m => {
      m.GateModule.showLoginRequired('크레딧 충전은 로그인이 필요합니다\n첫 로그인 시 10c를 드려요!', () => {
        buyCreditsKR(amount, credits);
      });
    });
    return;
  }

  // 토스 위젯은 charge.html에서만 동작 → 리다이렉트
  closeCreditModal();
  const returnPage = location.pathname.replace(/\.html$/, '').replace(/^\//, '') || 'index';
  // 2026-09-20: 모달에서 고른 상품을 charge.html에 전달 → 로드 시 같은 상품을 미리 선택(1탭 상태)해 둔다.
  // 값은 결제 금액(원). charge.html이 CHARGE_OPTIONS/스테퍼 단가와 대조해 일치할 때만 쓰고, 아니면 무시한다.
  const pkgParam = Number.isFinite(Number(amount)) && Number(amount) > 0 ? `&pkg=${encodeURIComponent(Number(amount))}` : '';
  navigateTo(`charge.html?return=${encodeURIComponent(returnPage)}${pkgParam}`);
}

function _showTossLoading() {
  const el = document.createElement('div');
  el.id = 'toss-loading';
  el.style.cssText = 'position:fixed;inset:0;background:#030508;display:flex;align-items:center;justify-content:center;z-index:9999;';
  el.innerHTML = '<div style="text-align:center;"><div style="color:#a78bfa;font-size:1.1rem;font-weight:600;">결제 확인 중...</div><div style="color:#8892a8;font-size:0.85rem;margin-top:8px;">잠시만 기다려 주세요</div></div>';
  document.body.appendChild(el);
}

function _hideTossLoading() {
  const el = document.getElementById('toss-loading');
  if (el) el.remove();
}

export async function initFromTossResult() {
  const params = new URLSearchParams(window.location.search);
  const returnParam = params.get('return');
  const cleanUrl = returnParam
    ? `${window.location.pathname}?return=${encodeURIComponent(returnParam)}`
    : window.location.pathname;

  if (params.get('toss') === 'fail') {
    const failCode = params.get('code') || 'RETURN_FAIL';
    const failMessage = params.get('message') || '';
    history.replaceState({}, '', cleanUrl);
    reportPayFail('return', failCode, failMessage);
    // 2026-09-20: alert만 띄우면 닫는 순간 사유가 사라지고 선택 뷰로 되돌아가 있다.
    // charge.html이 핸들러를 등록했으면 그쪽에서 결제 뷰를 복원하고 사유를 결제 버튼 위에 남긴다. 없으면 기존 alert.
    if (typeof window.monkosOnTossFail === 'function') {
      try {
        window.monkosOnTossFail({ code: failCode, message: failMessage });
        return;
      } catch (e) {}
    }
    alert(failMessage || '결제가 취소되었습니다');
    return;
  }

  // sessionStorage 복구 시도 (이전 실패분)
  let paymentKey = params.get('paymentKey');
  let orderId = params.get('orderId');
  let amount = params.get('amount');

  if (params.get('toss') === 'success' && paymentKey) {
    sessionStorage.setItem('monkos_pending_payment', JSON.stringify({ paymentKey, orderId, amount }));
  } else {
    const pending = sessionStorage.getItem('monkos_pending_payment');
    if (pending) {
      try {
        const p = JSON.parse(pending);
        paymentKey = p.paymentKey;
        orderId = p.orderId;
        amount = p.amount;
      } catch { return; }
    } else {
      return;
    }
  }

  if (!paymentKey || !orderId || !amount) return;

  history.replaceState({}, '', cleanUrl);

  if (!store.user.id) {
    Monk.log('결제 확인 대기: 로그인 필요');
    _showPaymentResult(false, '로그인이 필요합니다', '결제를 완료하려면 로그인해 주세요.\n로그인 후 자동으로 크레딧이 충전됩니다.');
    return;
  }

  _showTossLoading();

  try {
    const res = await fetchWithTimeout(`${API.PORTAL_URL}/api/payments/toss/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId: store.user.id }),
    }, 20000);
    const data = await res.json();
    _hideTossLoading();
    if (data.success) {
      sessionStorage.removeItem('monkos_pending_payment');
      sessionStorage.removeItem('monkos_charge_sel'); // 실패 복귀용 선택 기록 — 결제가 끝났으니 거둔다 (2026-09-20)
      // GA4 purchase 결선 — 충전 확정 시점 = 매출 발생 시점 (2026-09-02 G-M1 수정안 1-A)
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'purchase', {
            transaction_id: orderId,
            value: Number(amount),
            currency: 'KRW',
            payment_provider: 'toss',
            service: 'idphoto-kr',
            market: 'kr',
            auth_method: store.user?.provider || '',
            lang: document.documentElement.lang || 'ko',
          });
        }
      } catch (e) {}
      store.user = { ...store.user, credits: data.credits };
      Monk.log(`결제 완료: +${data.creditsAdded}c (잔액 ${data.credits}c)`);
      _showPaymentResult(true, `+${data.creditsAdded} 크레딧 충전 완료`, `현재 잔액: ${data.credits}c`);
    } else {
      reportPayFail('confirm', 'CONFIRM_HTTP_' + res.status, data.error || '');
      _showPaymentResult(false, '결제 확인 실패', data.error || '알 수 없는 오류');
    }
  } catch (err) {
    _hideTossLoading();
    Monk.log('결제 확인 에러: ' + err.message);
    reportPayFail('confirm', 'CONFIRM_NETWORK', 'confirm request failed');
    _showPaymentResult(false, '네트워크 오류', '인터넷 연결을 확인하고 다시 시도해 주세요');
  }
}

function _showPaymentResult(success, title, message) {
  const existing = document.getElementById('toss-result');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'toss-result';
  el.style.cssText = 'position:fixed;inset:0;background:#030508;display:flex;align-items:center;justify-content:center;z-index:9999;';

  if (success) {
    el.innerHTML = `<div style="text-align:center;padding:20px;">
      <div style="font-size:2rem;margin-bottom:12px;">✅</div>
      <div style="color:#34d399;font-size:1.2rem;font-weight:700;">${title}</div>
      <div style="color:#8892a8;font-size:0.9rem;margin-top:8px;">${message}</div>
      <button onclick="this.closest('#toss-result').remove()" style="margin-top:20px;padding:12px 32px;background:linear-gradient(135deg,#a78bfa,#818cf8);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">확인</button>
    </div>`;
  } else {
    const hasPending = !!sessionStorage.getItem('monkos_pending_payment');
    el.innerHTML = `<div style="text-align:center;padding:20px;">
      <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
      <div style="color:#f87171;font-size:1.1rem;font-weight:700;">${title}</div>
      <div style="color:#8892a8;font-size:0.85rem;margin-top:8px;">${message}</div>
      ${hasPending ? '<button id="toss-retry-btn" style="margin-top:16px;padding:12px 32px;background:linear-gradient(135deg,#a78bfa,#818cf8);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">다시 시도</button>' : ''}
      <div style="margin-top:12px;"><button onclick="sessionStorage.removeItem(\'monkos_pending_payment\');this.closest(\'#toss-result\').remove()" style="padding:8px 24px;background:transparent;color:#8892a8;border:1px solid rgba(136,146,168,0.3);border-radius:8px;font-size:0.85rem;cursor:pointer;">닫기</button></div>
      <div style="color:#666;font-size:0.75rem;margin-top:12px;">결제가 완료되었다면 잠시 후 자동 반영됩니다.<br>문의: info@monkos.ai</div>
    </div>`;
    if (hasPending) {
      setTimeout(() => {
        const retryBtn = document.getElementById('toss-retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', () => { el.remove(); initFromTossResult(); });
      }, 0);
    }
  }
  document.body.appendChild(el);
}

// ─── 인증 ───
export async function initFromUrlToken() {
  const params = new URLSearchParams(location.search);
  const uid = params.get('uid');
  const token = params.get('token');
  if (!uid || !token) return false;

  try {
    const res = await fetchWithTimeout(`${API.PORTAL_URL}/api/auth/verify?token=${encodeURIComponent(token)}`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success && data.user) {
      history.replaceState(null, '', location.pathname);
      Monk.log(`토큰 로그인 성공: ${data.user.email}`);
      return true;
    }
  } catch (err) {
    Monk.log('토큰 검증 실패: ' + err.message);
  }
  return false;
}

export async function initCredits() {
  try {
    const res = await fetchWithTimeout(`${API.PORTAL_URL}/api/auth/verify-cookie`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.id) {
        store.user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || '',
          credits: data.user.credits ?? 0,
          avatar: data.user.picture || '',
        };
        localStorage.removeItem('monkos_free_gen');
        Monk.log(`쿠키 인증: ${data.user.email} (${data.user.credits}c)`);
        return;
      }
    }
  } catch (e) {
    Monk.log('쿠키 인증 실패');
  }
  store.user = { id: null, email: null, name: null, credits: 0, avatar: '' };
  Monk.log('비로그인 상태');
}

export async function fetchLatestCredits() {
  if (!store.user?.id) return;
  try {
    const res = await fetchWithTimeout(`${API.PORTAL_URL}/api/credits?userId=${encodeURIComponent(store.user.id)}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      store.user.credits = data.credits ?? store.user.credits;
      Monk.log(`크레딧 갱신: ${store.user.credits}c`);
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

// ─── 다운로드 게이트 ───
export function downloadGate() {
  if (!store.user.id) {
    return 'login-required';
  }
  if (!store.user.credits || store.user.credits < CREDIT_COST.download) {
    showCreditModal(CREDIT_COST.download, store.user.credits || 0, 'download');
    return 'credit-short';
  }
  return 'ok';
}

// ─── 유틸리티 ───
export function openExternal() {
  const url = location.href;
  if (/Android/i.test(navigator.userAgent)) {
    location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  } else {
    location.href = url;
  }
}

export function checkInappBrowser() {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK|NAVER|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|DaumApps/i.test(ua)) {
    store.inappBrowser = true;
  }
}

export function showDesktopBlocker() {
  const pageUrl = location.href.replace('localhost:8080', 'idphoto-kr.monkos.ai');
  store.pageUrl = pageUrl;
  store.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=000000`;
  store.desktopBlocked = true;
}

// ─── sessionStorage 헬퍼 ───
export function saveSessionData(key, value) {
  sessionStorage.setItem(`monkos_${key}`, typeof value === 'string' ? value : JSON.stringify(value));
}

export function loadSessionData(key) {
  return sessionStorage.getItem(`monkos_${key}`);
}

export function clearSessionImages() {
  sessionStorage.removeItem('monkos_captured');
  sessionStorage.removeItem('monkos_image');
}

// ─── v5 선택값 일괄 저장 ───
export function saveSelections() {
  const keys = ['format', 'gender', 'age', 'clothing', 'clothingColor',
    'suitColor', 'shirtColor', 'tieColor', 'tiePattern', 'hair', 'bgColor'];
  keys.forEach(k => {
    const v = store[k];
    if (v !== null && v !== undefined && v !== '') {
      saveSessionData(k, v);
    } else {
      sessionStorage.removeItem(`monkos_${k}`);
    }
  });
}

// ─── v5 선택값 초기화 (prep 재진입 시) ───
export function clearSelections() {
  const keys = ['format', 'gender', 'age', 'clothing', 'clothingColor',
    'suitColor', 'shirtColor', 'tieColor', 'tiePattern', 'hair', 'bgColor'];
  keys.forEach(k => sessionStorage.removeItem(`monkos_${k}`));
  store.format = null;
  store.gender = null;
  store.age = null;
  store.clothing = 'default';
  store.clothingColor = '';
  store.suitColor = '';
  store.shirtColor = '';
  store.tieColor = '';
  store.tiePattern = '';
  store.hair = 'default';
  store.bgColor = 'white';
}

// ─── 페이지 이동 (?dev 전파) ───
export function navigateTo(url) {
  const devMode = new URLSearchParams(location.search).has('dev');
  location.href = devMode ? `${url}?dev` : url;
}

// ─── 디버그: sessionStorage 상태 출력 ───
export function debugSessionKeys() {
  const keys = Object.keys(sessionStorage).filter(k => k.startsWith('monkos_'));
  const summary = keys.map(k => {
    const v = sessionStorage.getItem(k);
    const short = v && v.length > 40 ? v.slice(0, 40) + '...' : v;
    return `${k.replace('monkos_', '')}=${short}`;
  }).join(', ');
  Monk.log(`[DEBUG] sessionStorage (${keys.length}): ${summary}`);
}

// ─── 공통 초기화 ───
export async function sharedInit() {
  checkInappBrowser();
  await initFromUrlToken();
  await initCredits();
  await initFromTossResult();

  // v5 구키 정리 가드 (SCHEMA_v5_확정.md §9)
  if (loadSessionData('schema_version') !== SCHEMA_VERSION) {
    ['monkos_purpose', 'monkos_style', 'monkos_expression',
     'monkos_tie', 'monkos_background'].forEach(k => sessionStorage.removeItem(k));
    saveSessionData('schema_version', SCHEMA_VERSION);
  }

  // v5 선택값 복원
  const restore = (key, fallback) => {
    const v = loadSessionData(key);
    return v !== null ? v : fallback;
  };
  store.format = restore('format', null);
  store.gender = restore('gender', null);
  store.age = restore('age', null);
  store.clothing = restore('clothing', 'default');
  store.clothingColor = restore('clothingColor', '');
  store.suitColor = restore('suitColor', '');
  store.shirtColor = restore('shirtColor', '');
  store.tieColor = restore('tieColor', '');
  store.tiePattern = restore('tiePattern', '');
  store.hair = restore('hair', 'default');
  store.bgColor = restore('bgColor', 'white');

  // Store 초기값 → DOM 동기화
  // monk.js Store는 초기값에 대해 DOM 업데이트를 안 하므로
  // 전체 키를 재할당하여 data-show/data-bind/data-class 동기화
  for (const key of Object.keys(store)) {
    store[key] = store[key];
  }

  // 헤더 크레딧 → 충전샵 연결
  const creditBadge = document.getElementById('creditBadge');
  if (creditBadge) {
    creditBadge.style.cursor = 'pointer';
    creditBadge.addEventListener('click', () => showChargeModal());
  }

  debugSessionKeys();
  Monk.log('공통 초기화 완료');
}

// ─── Cr 모션 컴포넌트 ───

/**
 * showEventCard — ② 이벤트 카드 + 3D Flip 알림
 * @param {string} title  - 카드 제목 (예: '카카오 로그인 완료')
 * @param {string} amount - 금액 표시 (예: '+30 Cr')
 * @param {string} subtitle - 부제 (예: '가입 이벤트')
 * @param {string} tag    - 태그 (예: 'EVENT')
 */
export function showEventCard(title, amount, subtitle, tag = 'EVENT') {
  let container = document.querySelector('.event-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'event-container';
    document.body.appendChild(container);
  }

  const card = document.createElement('div');
  card.className = 'event-card';
  card.innerHTML = `
    <div class="event-coin-wrap">
      <div class="event-glow-ring"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="event-coin">
        <div class="event-coin-face"><span class="cr-sym">Cr</span></div>
        <div class="event-coin-back"><span class="m-mark">M</span></div>
      </div>
    </div>
    <div class="event-text">
      <div class="event-title">${title} <span class="event-amount">${amount}</span></div>
      <div class="event-sub">${subtitle}</div>
    </div>
    <div class="event-tag">${tag}</div>
  `;
  container.appendChild(card);
  setTimeout(() => card.remove(), 4500);
}

/**
 * showThankYou — v5: thankyou.html 별도 페이지로 전환됨. 오버레이 제거.
 * export 유지 (다른 파일에서 import하므로)
 */
export function showThankYou() {}

// ─── window 노출 (공통 onclick 함수) ───
Object.assign(window, {
  buyCreditsKR,
  closeCreditModal,
  showChargeModal,
  openExternal,
  downloadGate,
  showEventCard,
  showThankYou,
  saveSelections,
  clearSelections,
});
