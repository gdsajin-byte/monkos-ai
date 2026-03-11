/**
 * shared.js — 全ページ共通ロジック
 * app.jsから抽出: Store, Pipe(REST), 認証, クレジット, 決済, ユーティリティ
 */

import Monk from './monk.js';
import {
  API, CREDIT_COST, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID, SCHEMA_VERSION,
  CHARGE_OPTIONS, JPY_PER_CREDIT
} from './config.js';

// Re-export for page JS convenience
export {
  Monk, API, CREDIT_COST, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID, SCHEMA_VERSION,
  CHARGE_OPTIONS, JPY_PER_CREDIT
};

// ─── fetch timeout ラッパー ───
function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

// ─── Store 初期化 ───
export const store = Monk.store({
  // ユーザー
  user: { id: null, email: null, name: null, credits: 0, avatar: '' },

  // ファネル選択 (v5 — SCHEMA_v5_確定.md 基準)
  format: null,          // "passport" | "id"
  gender: null,          // "f" | "m"
  age: null,             // "baby" | "child" | "teen" | "adult"
  clothing: 'default',   // "default" | "change" | "casual" | "suit"
  clothingColor: '',     // 条件付き
  suitColor: '',         // 条件付き
  shirtColor: '',        // 条件付き
  tieColor: '',          // 条件付き
  tiePattern: '',        // 条件付き
  hair: 'default',       // "default" | "tidy" | "updo"
  bgColor: 'white',      // "white" | "gray" | "blue" | "beige"
  prepConfirmText: '',

  // 進行状態
  step: 0,
  stepLabel: TX.stepReady,

  // 画像データ
  captured: null,
  generated: null,
  cropped: null,

  // コーチング
  coaching: { text: TX.coachingCheck, ready: false, active: false },

  // 状態テキスト (事前分析/生成進行)
  statusText: '',

  // 結果画面
  resultTitle: TX.resultConfirm,
  resultSubtitle: TX.resultConfirmSub,
  showStep2Actions: false,
  showStep3Actions: false,

  // 規格クロップ
  specName: '',
  specSize: '',
  specPx: '',

  // クレジットモーダル
  creditModalOpen: false,
  creditModalTitle: 'クレジットが不足しています',
  creditModalDesc: 'この操作にはクレジットが必要です。',
  creditRequired: 10,
  creditLow: false,

  // ウォーターマークプレビュー
  watermarkPreview: null,

  // その他
  desktopBlocked: false,
  inappBrowser: false,
  downloadComplete: false,
  postCreditMsg: '',
  pageUrl: '',
  qrCodeUrl: '',

  // ポストダウンロード (クレジットゲート v2)
  showMission: false,
  missionConsentDone: false,
});

// ─── Pipe 設定 (REST only) ───
export const pipe = Monk.pipe({
  precheck: { type: 'post', path: API.PRECHECK },
  generate: { type: 'post', path: API.GENERATE },
  creditUse: { type: 'post', path: API.CREDIT_USE },
  creditRefund: { type: 'post', path: API.CREDIT_REFUND },
  coaching: { type: 'ws', url: '' },  // WebSocket — urlはcamera.jsで動的生成
}, {
  baseUrl: '',
  onCreditShort: (err) => showCreditModal(err.required || 10, err.credits || 0, 'generate'),
  onError: (name, err) => Monk.log(`APIエラー[${name}]: ${err.error || err.message}`),
});

// ─── クレジットモーダル ───
export function showCreditModal(required, current, action) {
  store.creditRequired = required;
  store.creditModalTitle = action === 'download'
    ? 'ダウンロードにクレジットが必要です'
    : 'リタッチにクレジットが必要です';
  store.creditModalDesc = action === 'download'
    ? '写真のダウンロードには70クレジットが必要です。'
    : 'リタッチには10クレジットが必要です。';
  store.creditModalOpen = true;
}

export function closeCreditModal() {
  store.creditModalOpen = false;
}

// ─── チャージモーダル (v3: ボトムシート) ───
export function showChargeModal() {
  import('./modules/charge.js').then(m => m.ChargeModule.show());
}

// ─── 決済 (Lemon Squeezy — Portal API 経由、同一タブリダイレクト) ───
export async function buyCreditsJP(opt) {
  // opt = CHARGE_OPTIONS 要素: { key, variantId, price, credits, bonus }
  if (!store.user.id) {
    import('./modules/gate.js').then(m => {
      m.GateModule.showLoginRequired('クレジットチャージにはログインが必要です\n初回ログインで10cプレゼント！', () => {
        buyCreditsJP(opt);
      });
    });
    return;
  }

  closeCreditModal();

  try {
    // 決済後の復帰URL — 現在ページに ?payment=complete を付与
    const returnUrl = new URL(location.href);
    returnUrl.searchParams.delete('payment');
    returnUrl.searchParams.set('payment', 'complete');
    const redirectUrl = returnUrl.toString();

    // Portal にチェックアウト URL 要求
    const res = await fetch(`${API.PORTAL_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        variantId: opt.variantId,
        userId: store.user.id,
        email: store.user.email || undefined,
        redirectUrl,
      }),
    });

    const data = await res.json();
    if (!data.url) {
      alert('決済の準備に失敗しました。しばらくしてからお試しください。');
      return;
    }

    // 同一タブで遷移 — sessionStorage維持、決済後redirect_urlで復帰
    location.href = data.url;
  } catch (err) {
    Monk.log('決済エラー: ' + err.message);
    alert('決済エラーが発生しました。もう一度お試しください。');
  }
}

// ─── Lemon Squeezy イベントハンドラ ───
export function initLemonSqueezy() {
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Setup({
      eventHandler: (event) => {
        if (event.event === 'Checkout.Success') {
          Monk.log('Lemon決済完了 — クレジット更新中...');
          // Webhook でクレジット支給完了後 Firestore 反映 → クライアント更新
          setTimeout(() => fetchLatestCredits(), 2000);
          setTimeout(() => {
            fetchLatestCredits();
            alert(`決済が完了しました！\nクレジットが追加されました。`);
          }, 4000);
        }
      },
    });
  }
}

// ─── 認証 ───
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
      Monk.log(`トークンログイン成功: ${data.user.email}`);
      return true;
    }
  } catch (err) {
    Monk.log('トークン検証失敗: ' + err.message);
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
        Monk.log(`Cookie認証: ${data.user.email} (${data.user.credits}c)`);
        return;
      }
    }
  } catch (e) {
    Monk.log('Cookie認証失敗');
  }
  store.user = { id: null, email: null, name: null, credits: 0, avatar: '' };
  Monk.log('未ログイン状態');
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
      Monk.log(`クレジット更新: ${store.user.credits}c`);
    }
  } catch (err) {
    Monk.log('クレジット照会失敗: ' + err.message);
  }
}

// タブ復帰時クレジット再照会
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && store.user.id) {
    fetchLatestCredits();
  }
});

// ─── ダウンロードゲート ───
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

// ─── ユーティリティ ───
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
  if (/Line\/|FBAN|FBAV|Instagram|Twitter|Snapchat|Yahoo/i.test(ua)) {
    store.inappBrowser = true;
  }
}

export function showDesktopBlocker() {
  const pageUrl = location.href.replace('localhost:8080', 'idphoto-jp.monkos.ai');
  store.pageUrl = pageUrl;
  store.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=000000`;
  store.desktopBlocked = true;
}

// ─── sessionStorage ヘルパー ───
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

// ─── v5 選択値一括保存 ───
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

// ─── v5 選択値初期化 (prep 再進入時) ───
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

// ─── ページ遷移 (?dev 伝播) ───
export function navigateTo(url) {
  const devMode = new URLSearchParams(location.search).has('dev');
  location.href = devMode ? `${url}?dev` : url;
}

// ─── デバッグ: sessionStorage 状態出力 ───
export function debugSessionKeys() {
  const keys = Object.keys(sessionStorage).filter(k => k.startsWith('monkos_'));
  const summary = keys.map(k => {
    const v = sessionStorage.getItem(k);
    const short = v && v.length > 40 ? v.slice(0, 40) + '...' : v;
    return `${k.replace('monkos_', '')}=${short}`;
  }).join(', ');
  Monk.log(`[DEBUG] sessionStorage (${keys.length}): ${summary}`);
}

// ─── 共通初期化 ───
export async function sharedInit() {
  checkInappBrowser();
  await initFromUrlToken();
  await initCredits();
  initLemonSqueezy();

  // v5 旧キー整理ガード (SCHEMA_v5_確定.md §9)
  if (loadSessionData('schema_version') !== SCHEMA_VERSION) {
    ['monkos_purpose', 'monkos_style', 'monkos_expression',
     'monkos_tie', 'monkos_background'].forEach(k => sessionStorage.removeItem(k));
    saveSessionData('schema_version', SCHEMA_VERSION);
  }

  // v5 選択値復元
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

  // Store 初期値 → DOM 同期
  // monk.js Storeは初期値に対してDOM更新をしないため
  // 全キーを再代入してdata-show/data-bind/data-class同期
  for (const key of Object.keys(store)) {
    store[key] = store[key];
  }

  // ヘッダークレジット → チャージショップ連結
  const creditBadge = document.getElementById('creditBadge');
  if (creditBadge) {
    creditBadge.style.cursor = 'pointer';
    creditBadge.addEventListener('click', () => showChargeModal());
  }

  debugSessionKeys();
  Monk.log('共通初期化完了');
}

// ─── Cr モーションコンポーネント ───

/**
 * showEventCard — ② イベントカード + 3D Flip 通知
 * @param {string} title  - カードタイトル (例: 'Googleログイン完了')
 * @param {string} amount - 金額表示 (例: '+30 Cr')
 * @param {string} subtitle - サブタイトル (例: '登録イベント')
 * @param {string} tag    - タグ (例: 'EVENT')
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
 * showThankYou — v5: thankyou.html 別ページに移行。オーバーレイ除去。
 * export 維持 (他ファイルからimportするため)
 */
export function showThankYou() {}

// ─── window 公開 (共通 onclick 関数) ───
Object.assign(window, {
  buyCreditsJP,
  closeCreditModal,
  showChargeModal,
  openExternal,
  downloadGate,
  showEventCard,
  showThankYou,
  saveSelections,
  clearSelections,
});
