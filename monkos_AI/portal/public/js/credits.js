/**
 * MONKOS Portal v4 — credits.js
 * 크레딧/결제 모듈
 */

var TOSS_CLIENT_KEY = '';
var TOSS_ENABLED = false;
var CREDIT_PACKAGES = [
  { id: 'credit_1',  credits: 1,  price: 1500,  label: '1 크레딧' },
  { id: 'credit_10', credits: 10, price: 12900, label: '10 크레딧 (10% 할인)' },
  { id: 'credit_30', credits: 30, price: 29900, label: '30 크레딧 (17% 할인)', popular: true },
  { id: 'credit_50', credits: 50, price: 45900, label: '50 크레딧 (20% 할인)' },
];
var tossPayments = null;

window.openCreditShop = function() {
  var modal = document.getElementById('creditShopModal');
  var currentCredits = document.getElementById('shopCurrentCredits');
  if (currentCredits) currentCredits.textContent = currentUser ? (currentUser.credits || 0) : 0;
  renderShopItems();
  if (modal) modal.classList.add('active');
};

window.closeCreditShop = function() {
  var modal = document.getElementById('creditShopModal');
  if (modal) modal.classList.remove('active');
};

function renderShopItems() {
  var container = document.getElementById('shopItems');
  var titleEl = document.getElementById('shopTitle');
  var labelEl = document.getElementById('shopCurrentLabel');
  var closeBtn = document.getElementById('shopCloseBtn');
  if (!container) return;

  var credits = currentUser ? (currentUser.credits || 0) : 0;

  if (region === 'kr') {
    if (titleEl) titleEl.textContent = '크레딧 충전';
    if (labelEl) labelEl.innerHTML = '현재: <strong>' + credits + '</strong> 크레딧';
    if (closeBtn) closeBtn.textContent = '닫기';
    container.innerHTML =
      '<button class="shop-item" onclick="buyToss(9900)"><span>70c <small style="color:var(--ink-m)">(+10 bonus)</small></span><span class="amount">₩9,900</span></button>' +
      '<button class="shop-item" onclick="buyToss(12900)"><span>100c <small style="color:var(--ink-m)">(+30 bonus)</small></span><span class="amount">₩12,900</span></button>' +
      '<button class="shop-item best" onclick="buyToss(34900)"><span>300c <small style="color:var(--ink-m)">(+120 bonus)</small></span><span class="amount">₩34,900 <small style="color:var(--green)">BEST</small></span></button>' +
      '<button class="shop-item" onclick="buyToss(49900)"><span>500c <small style="color:var(--ink-m)">(+250 bonus)</small></span><span class="amount">₩49,900</span></button>' +
      '<button class="shop-item" onclick="buyToss(1500)"><span>10c</span><span class="amount">₩1,500</span></button>';
  } else {
    if (titleEl) titleEl.textContent = (lang === 'ja') ? 'クレジットチャージ' : 'Credit Charge';
    if (labelEl) labelEl.innerHTML = (lang === 'ja')
      ? '現在: <strong>' + credits + '</strong> クレジット'
      : 'Current: <strong>' + credits + '</strong> credits';
    if (closeBtn) closeBtn.textContent = (lang === 'ja') ? '閉じる' : 'Close';
    container.innerHTML =
      '<button class="shop-item" onclick="buyCreditsLS(\'1909373\')"><span>40 credits</span><span class="amount">$3.90</span></button>' +
      '<button class="shop-item" onclick="buyCreditsLS(\'1909383\')"><span>80 credits</span><span class="amount">$6.90</span></button>' +
      '<button class="shop-item best" onclick="buyCreditsLS(\'1909386\')"><span>130 credits</span><span class="amount">$9.90 <small style="color:var(--green)">BEST</small></span></button>' +
      '<button class="shop-item" onclick="buyCreditsLS(\'1909388\')"><span>420 credits</span><span class="amount">$26.90</span></button>' +
      '<button class="shop-item" onclick="buyCreditsLS(\'1909390\')"><span>750 credits</span><span class="amount">$39.90</span></button>';
  }
}

window.buyCreditsLS = async function(variantId) {
  if (!currentUser || !currentUser.id) {
    window.headerLogin();
    return;
  }
  var btn = event.target.closest('button');
  btn.disabled = true;
  var origText = btn.innerHTML;
  btn.textContent = '...';
  // 팝업 차단 회피 (2026-09-20): 클릭 제스처 안에서 빈 창을 먼저 열고, 체크아웃 URL 은 fetch 뒤에 지정한다.
  // 종전엔 await fetch 뒤에 window.open → 모바일 사파리·인앱 브라우저에서 차단돼 "눌러도 아무 일 없는 버튼"이었다.
  var lsWin = null;
  try { lsWin = window.open('', '_blank'); } catch (e) {}
  var body = { variantId: variantId, userId: currentUser.id, email: currentUser.email };
  if (!lsWin) {
    // 새 창 불가 → 같은 탭으로 결제하러 간다. 결제 후 충전 페이지로 돌아와 갱신된 잔액을 보게 한다
    // (credits.html handleLemonReturn 이 lemon=return 을 받아 잔액을 다시 조회한다)
    body.redirectUrl = window.location.origin + '/credits.html?lang=' + encodeURIComponent(lang === 'ko' ? 'en' : lang) +
      '&lemon=return&from=' + encodeURIComponent(window.location.pathname);
  }
  var failCode = '';
  try {
    var res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    var data = await res.json();
    if (data.url) {
      var opened = false;
      if (lsWin && !lsWin.closed) {
        try { lsWin.location = data.url; opened = true; } catch (e) {}
      }
      if (!opened) {
        // 버튼을 먼저 되돌린다 — 뒤로가기(bfcache)로 복귀했을 때 '...' 로 잠긴 버튼이 남지 않게
        btn.disabled = false;
        btn.innerHTML = origText;
        window.location.href = data.url;
        return;
      }
    } else {
      failCode = 'CHECKOUT_HTTP_' + res.status;
      if (lsWin) { try { lsWin.close(); } catch (e) {} }
      alert((lang === 'ja') ? '決済の準備に失敗しました' : 'Checkout failed');
    }
  } catch (err) {
    failCode = 'CHECKOUT_NETWORK';
    if (lsWin) { try { lsWin.close(); } catch (e) {} }
    console.error('[Checkout] error:', err);
    alert((lang === 'ja') ? '決済エラーが発生しました' : 'Checkout error');
  }
  if (failCode) reportCreditPayFail('request', failCode);
  btn.disabled = false;
  btn.innerHTML = origText;
};

// 결제 실패 계측 (2026-09-20) — 서버 WARNING 로그([Pay-Fail])가 정본. 토큰·이메일 미포함, 실패해도 조용히 넘긴다
function reportCreditPayFail(stage, code) {
  var inApp = /(GSA\/|FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER\(|DaumApps|; wv\))/i.test(navigator.userAgent || '');
  try {
    if (typeof gtag === 'function') {
      gtag('event', 'pay_fail', { payment_provider: 'lemon', fail_stage: stage, fail_code: code, in_app: inApp, service: 'portal' });
    }
  } catch (e) {}
  try {
    fetch('/api/payments/fail', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ service: 'credit-modal', provider: 'lemon', stage: stage, code: code, message: '', vw: window.innerWidth, vh: window.innerHeight, inApp: inApp }),
    }).catch(function() {});
  } catch (e) {}
}

function loadTossSDK() {
  return new Promise(function(resolve, reject) {
    if (window.TossPayments) { resolve(); return; }
    var script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.onload = function() { resolve(); };
    script.onerror = function() { reject(new Error('토스 SDK 로드 실패')); };
    document.head.appendChild(script);
  });
}

window.buyToss = function(amount) {
  window.closeCreditShop();
  var returnUrl = encodeURIComponent(window.location.pathname);
  window.location.href = '/credits?returnUrl=' + returnUrl;
};
