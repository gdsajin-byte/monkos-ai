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
      '<button class="shop-item" onclick="buyToss(1450)"><span>10c</span><span class="amount">₩1,450</span></button>';
  } else {
    if (titleEl) titleEl.textContent = (lang === 'ja') ? 'クレジットチャージ' : 'Credit Charge';
    if (labelEl) labelEl.innerHTML = (lang === 'ja')
      ? '現在: <strong>' + credits + '</strong> クレジット'
      : 'Current: <strong>' + credits + '</strong> credits';
    if (closeBtn) closeBtn.textContent = (lang === 'ja') ? '閉じる' : 'Close';
    container.innerHTML =
      '<button class="shop-item" onclick="buyCreditsLS(\'1382367\')"><span>70c <small style="color:var(--ink-m)">(+10 bonus)</small></span><span class="amount">¥990</span></button>' +
      '<button class="shop-item best" onclick="buyCreditsLS(\'1382348\')"><span>100c <small style="color:var(--ink-m)">(+30 bonus)</small></span><span class="amount">¥1,490 <small style="color:var(--green)">BEST</small></span></button>' +
      '<button class="shop-item" onclick="buyCreditsLS(\'1382362\')"><span>300c <small style="color:var(--ink-m)">(+120 bonus)</small></span><span class="amount">¥3,990</span></button>' +
      '<button class="shop-item" onclick="buyCreditsLS(\'1382436\')"><span>500c <small style="color:var(--ink-m)">(+250 bonus)</small></span><span class="amount">¥5,990</span></button>' +
      '<button class="shop-item" onclick="buyCreditsLS(\'1382355\')"><span>10c</span><span class="amount">¥150</span></button>';
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
  try {
    var res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ variantId: variantId, userId: currentUser.id, email: currentUser.email }),
    });
    var data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank');
    } else {
      alert((lang === 'ja') ? '決済の準備に失敗しました' : 'Checkout failed');
    }
  } catch (err) {
    console.error('[Checkout] error:', err);
    alert((lang === 'ja') ? '決済エラーが発生しました' : 'Checkout error');
  }
  btn.disabled = false;
  btn.innerHTML = origText;
};

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
