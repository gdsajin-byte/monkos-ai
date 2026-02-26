/**
 * shared.js — 전 페이지 공통 로직
 * app.js에서 추출: Store, Pipe(REST), 인증, 크레딧, 결제, 유틸리티
 */

import Monk from './monk.js';
import {
  API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID
} from './config.js';

// Re-export for page JS convenience
export {
  Monk, API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID
};

// ─── Store 초기화 ───
export const store = Monk.store({
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
  voiceEnabled: true,
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
  coaching: { type: 'ws', url: '' },  // WebSocket — url은 camera.js에서 동적 생성
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
    : '생성에 크레딧이 필요합니다';
  store.creditModalDesc = action === 'download'
    ? '사진을 다운로드하려면 70 크레딧이 필요합니다.'
    : '사진을 생성하려면 10 크레딧이 필요합니다.';
  store.creditModalOpen = true;
}

export function closeCreditModal() {
  store.creditModalOpen = false;
}

// ─── 충전 모달 (충전샵) ───
const CHARGE_OPTIONS = [
  { label: '📸 1장 구매', amount: 11600, credits: 80, desc: '생성+다운로드 1회분', recommended: true },
  { label: '10c', amount: 1450, credits: 10, desc: '' },
  { label: '100c', amount: 13050, credits: 100, desc: '10% 할인' },
  { label: '300c', amount: 34800, credits: 300, desc: '20% 할인' },
  { label: '500c', amount: 50750, credits: 500, desc: '30% 할인' },
];

let _chargeEl = null;
let _chargeIdx = 0;

function _buildChargeModal() {
  if (_chargeEl) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="charge-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1100;align-items:flex-end;justify-content:center;">
  <div style="width:100%;max-width:480px;background:linear-gradient(180deg,#1e1e3a,#161630);border:1.5px solid rgba(167,139,250,0.35);border-bottom:none;border-radius:16px 16px 0 0;padding:24px 20px;padding-bottom:max(24px,env(safe-area-inset-bottom));box-shadow:0 -8px 40px rgba(0,0,0,0.7),0 0 80px rgba(167,139,250,0.15);">
    <h3 style="text-align:center;color:#f8fafc;font-size:1.1rem;font-weight:700;margin:0 0 20px;">크레딧 충전</h3>

    <label data-ci="0" style="display:flex;align-items:center;gap:12px;padding:16px;border:2px solid #a78bfa;background:linear-gradient(135deg,rgba(167,139,250,0.2),rgba(124,58,237,0.15));border-radius:14px;cursor:pointer;margin-bottom:4px;position:relative;">
      <span style="position:absolute;top:-8px;right:12px;background:#a78bfa;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:8px;">추천</span>
      <input type="radio" name="co" value="0" checked style="accent-color:#a78bfa;width:18px;height:18px;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:700;color:#f8fafc;">📸 1장 구매 &nbsp;<span style="color:#a78bfa;">₩11,600</span></div>
        <div style="font-size:0.8rem;color:#8892a8;margin-top:2px;">생성+다운로드 1회분</div>
      </div>
    </label>

    <div style="text-align:center;font-size:0.78rem;color:#8892a8;margin:12px 0;">── 패키지 충전 (할인) ──</div>

    <label data-ci="1" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="1" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">10c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩1,450</span>
      </div>
    </label>
    <label data-ci="2" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="2" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">100c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩13,050 <span style="color:#34d399;font-size:0.72rem;">(10% 할인)</span></span>
      </div>
    </label>
    <label data-ci="3" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="3" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">300c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩34,800 <span style="color:#34d399;font-size:0.72rem;">(20% 할인)</span></span>
      </div>
    </label>
    <label data-ci="4" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="4" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">500c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩50,750 <span style="color:#34d399;font-size:0.72rem;">(30% 할인)</span></span>
      </div>
    </label>

    <button id="chargePayBtn" style="width:100%;padding:16px;background:linear-gradient(135deg,#a78bfa,#818cf8);color:#fff;border:none;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;margin-top:16px;box-shadow:0 4px 16px rgba(167,139,250,0.25);">토스페이먼츠로 결제</button>
    <button id="chargeCloseBtn" style="width:100%;padding:14px;background:rgba(30,30,60,0.8);color:#8892a8;border:1px solid rgba(167,139,250,0.12);border-radius:12px;font-size:0.95rem;font-weight:600;cursor:pointer;margin-top:10px;">닫기</button>
  </div>
</div>`;

  const overlay = wrap.firstElementChild;

  // 배경 클릭 닫기
  overlay.addEventListener('click', (e) => { if (e.target === overlay) _closeCharge(); });

  // 옵션 선택
  overlay.querySelectorAll('label[data-ci]').forEach(l => {
    l.addEventListener('click', () => { _chargeIdx = parseInt(l.dataset.ci); });
  });

  // 결제 버튼
  overlay.querySelector('#chargePayBtn').addEventListener('click', () => {
    const opt = CHARGE_OPTIONS[_chargeIdx];
    _closeCharge();
    buyCreditsKR(opt.amount, opt.credits);
  });

  // 닫기 버튼
  overlay.querySelector('#chargeCloseBtn').addEventListener('click', _closeCharge);

  document.body.appendChild(overlay);
  _chargeEl = overlay;
}

export function showChargeModal() {
  _buildChargeModal();
  _chargeIdx = 0;
  _chargeEl.querySelectorAll('input[name=co]').forEach(r => { r.checked = (r.value === '0'); });
  _chargeEl.style.display = 'flex';
}

function _closeCharge() {
  if (_chargeEl) _chargeEl.style.display = 'none';
}

// ─── 결제 (토스) ───
export async function buyCreditsKR(amount, credits) {
  if (!store.user.id) {
    alert('로그인이 필요합니다');
    return;
  }

  // 토스 심사 중 — 클라이언트 키 없으면 안내 후 리턴
  if (!TOSS_CLIENT_KEY) {
    alert('결제 시스템 준비 중입니다.\n곧 이용 가능합니다!');
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

export async function initFromTossResult() {
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
      const res = await fetch(`${API.PORTAL_URL}/api/payments/toss/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId: store.user.id }),
      });
      const data = await res.json();
      if (data.success) {
        store.user = { ...store.user, credits: data.credits };
        const stored = localStorage.getItem('monkos_user');
        if (stored) {
          const user = JSON.parse(stored);
          user.credits = data.credits;
          localStorage.setItem('monkos_user', JSON.stringify(user));
        }
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

// ─── 인증 ───
export async function initFromUrlToken() {
  const params = new URLSearchParams(location.search);
  const uid = params.get('uid');
  const token = params.get('token');
  if (!uid || !token) return false;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/auth/verify?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem('monkos_user', JSON.stringify(data.user));
      history.replaceState(null, '', location.pathname);
      Monk.log(`토큰 로그인 성공: ${data.user.email}`);
      return true;
    }
  } catch (err) {
    Monk.log('토큰 검증 실패: ' + err.message);
  }
  return false;
}

export function initCredits() {
  const stored = localStorage.getItem('monkos_user');
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

export async function fetchLatestCredits() {
  if (!store.user.id) return;
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits?userId=${encodeURIComponent(store.user.id)}`);
    const data = await res.json();
    if (data.credits !== undefined) {
      store.user = { ...store.user, credits: data.credits };
      const stored = localStorage.getItem('monkos_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.credits = data.credits;
        localStorage.setItem('monkos_user', JSON.stringify(user));
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

// ─── 토큰 만료 체크 ───
export function checkTokenExpiry() {
  const token = localStorage.getItem('monkos_token');
  if (!token) return;
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('monkos_user');
        localStorage.removeItem('monkos_token');
      }
    }
  } catch (e) {
    localStorage.removeItem('monkos_user');
    localStorage.removeItem('monkos_token');
  }
}

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
  sessionStorage.removeItem('monkos_cropped');
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
  checkTokenExpiry();
  await initFromUrlToken();
  initCredits();
  await initFromTossResult();

  // sessionStorage에서 선택 데이터 복원
  const savedStyle = loadSessionData('style');
  const savedGender = loadSessionData('gender');
  const savedAge = loadSessionData('age');
  if (savedStyle) store.style = savedStyle;
  if (savedGender) store.gender = savedGender;
  if (savedAge) store.age = savedAge;

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

// ─── window 노출 (공통 onclick 함수) ───
Object.assign(window, {
  buyCreditsKR,
  closeCreditModal,
  showChargeModal,
  openExternal,
  downloadGate,
});
