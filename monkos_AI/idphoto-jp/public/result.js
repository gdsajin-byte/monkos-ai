/**
 * result.js — 分析室専用ロジック
 * メインフロー: プリチェック → 生成 → プレビュー → ダウンロード決済 → thankyou.html 遷移
 * ポストダウンロード（ギャラリー保存、規格タブ、フル原本、SNSイベント）はthankyou.htmlに移管
 */

import {
  store, pipe, Monk, TX, PHOTO_SPECS, CREDIT_COST,
  sharedInit, showCreditModal, saveSessionData, loadSessionData, navigateTo, showChargeModal,
  buyCreditsJP, API, fetchLatestCredits, closeCreditModal,
} from './shared.js';

import { GateModule } from './modules/gate.js';
import { initChatbot } from './modules/chatbot.js';
// ─── GCSパス保管 (サーバー側ウォーターマーク — クライアントに原本到達しない) ───
let _gcsPath = null;

// ─── Media 生成 (crop/toJpeg 専用 — カメラ不要) ───
const media = Monk.media({
  video: null,
  canvas: null,
  maxSize: 720,
  faceDetection: true,
});

// ─── 広告キット定数 ───
const AD_MANIFEST_URL = 'https://storage.googleapis.com/monk-ai-images/ads/manifest.json';
const MIN_DISPLAY_TIME = 10000; // 最小10秒表示

let adImages = [];
let adTimer = null;
let adIndex = 0;

// ─── 広告manifest読込 ───
async function loadAdManifest() {
  try {
    const res = await fetch(AD_MANIFEST_URL);
    const data = await res.json();
    adImages = data.images || [];
    Monk.log(`広告manifest読込: ${adImages.length}枚`);
  } catch (e) {
    Monk.log('広告manifest読込失敗: ' + e.message);
  }
}

// ─── オーバーレイ表示 + 広告ローテーション開始 ───
function showGenOverlay() {
  const overlay = document.getElementById('gen-overlay');
  if (overlay) overlay.style.display = 'flex';

  const progress = document.getElementById('gen-progress');
  if (progress) {
    progress.style.width = '0%';
    progress.style.transition = 'width 0.5s ease';
    setTimeout(() => { progress.style.transition = 'width 10s ease-out'; progress.style.width = '90%'; }, 100);
  }

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
    img.onerror = () => {
      Monk.log('広告画像読込失敗: ' + adImages[index]);
      img.style.display = 'none';
    };
    img.onload = () => { img.style.display = ''; };
    img.src = adImages[index];
    img.style.opacity = '1';
  }, 400);
}

// ─── カウントダウン → 結果公開 ───
function startCountdown(callback) {
  const countdown = document.getElementById('gen-countdown');
  const countNum = document.getElementById('gen-count-num');
  if (!countdown || !countNum) { callback(); return; }

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

// ─── 原本表示 ───
function showOriginal() {
  const captured = loadSessionData('captured');
  if (!captured) {
    Monk.log('撮影データなし → 撮影画面へ移動');
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

  const imgEl = document.querySelector('#photo-original');
  if (imgEl) imgEl.src = captured;

  Monk.log('オリジナル表示完了');
}

// ─── 再撮影 ───
function retakePhoto() {
  // Step 2 (リタッチ前): 確認なしで準備室へ移動
  if (!store.generated) {
    clearForRetake();
    return;
  }

  // Step 3 (リタッチ後): 確認モーダル
  const ok = confirm(
    '現在の写真を削除して再撮影しますか？\nリタッチ費用（10c）は返金されません。'
  );
  if (!ok) return;

  clearForRetake();
}

function clearForRetake() {
  // store 初期化
  store.captured = null;
  store.generated = null;
  store.cropped = null;
  store.statusText = '';
  store.showStep2Actions = false;
  store.showStep3Actions = false;

  // sessionStorage 以前の結果を削除
  sessionStorage.removeItem('monkos_generated');
  sessionStorage.removeItem('monkos_compare');
  sessionStorage.removeItem('monkos_pending_action');
  try { sessionStorage.removeItem('monkos_gcsPath'); } catch(e) {}
  try { sessionStorage.removeItem('monkos_originalUrl'); } catch(e) {}

  // 撮影準備室へ移動（オプション再選択可能）
  navigateTo('prep.html');
}

// ─── 生成パイプライン ───
async function confirmAndGenerate() {
  if (!store.captured) return;

  // ログイン必須（撮影室ゲートで既にチェック済みだが防御用）
  if (!store.user.id) {
    GateModule.showLoginRequired('リタッチするにはログインが必要です\n初回ログインで10cプレゼント！', () => {
      confirmAndGenerate();
    });
    return;
  }

  const base64 = store.captured.includes(',') ? store.captured.split(',')[1] : store.captured;

  // 事前分析
  store.showStep2Actions = false;
  store.resultTitle = '写真分析中...';
  store.resultSubtitle = 'AIが撮影写真を検査しています';
  store.statusText = '事前分析中...';

  try {
    const preCheck = await pipe.run('precheck', { image: base64 });
    Monk.log(`事前分析: ${preCheck.score}点 ${preCheck.suitable ? 'OK' : 'NG'}`);

    if (!preCheck.suitable) {
      store.statusText = `事前分析: ${preCheck.score}点 — ${preCheck.suggestion || '再撮影をお勧めします'}`;
      store.resultTitle = '再撮影をお勧めします';
      store.resultSubtitle = preCheck.suggestion || '撮影環境を改善してください';
      store.showStep2Actions = true;
      return;
    }

    store.statusText = `事前分析 OK (${preCheck.score}点) → リタッチ開始`;
  } catch (err) {
    Monk.log('事前分析スキップ: ' + (err.error || err.message));
  }

  // ─── 残高事前チェック（シマリング開始前） ───
  if (store.user.credits < CREDIT_COST.generate) {
    showChargeModal();
    store.showStep2Actions = true;
    store.resultTitle = TX.resultConfirm;
    store.resultSubtitle = 'クレジットが不足しています';
    return;
  }

  // 生成段階
  store.step = 3;
  store.stepLabel = TX.step3;

  showGenOverlay();
  const genStartTime = Date.now();

  try {
    const genResult = await pipe.run('generate', {
      image: base64,
      format: store.format,
      gender: store.gender,
      age: store.age,
      clothing: store.clothing,
      clothingColor: store.clothingColor,
      suitColor: store.suitColor,
      shirtColor: store.shirtColor,
      tieColor: store.tieColor,
      tiePattern: store.tiePattern,
      hair: store.hair,
      bgColor: store.bgColor,
      userId: store.user.id,
      v: 5,
    });

    // サーバーがウォーターマーク版を送信 — クライアントに原本到達しない
    _gcsPath = genResult.gcsPath || null;
    if (_gcsPath) {
      try { sessionStorage.setItem('monkos_gcsPath', _gcsPath); } catch(e) {}
    }
    Monk.log('生成完了' + (_gcsPath ? ` (GCS: ${_gcsPath})` : ''));

    // ノークロップ原本（補正本）そのまま表示 — クロップはクロップアプリでのみ
    const spec = PHOTO_SPECS[store.format];
    let croppedWatermark = genResult.image;

    // store/sessionStorageにはクロップウォーターマーク版保存
    store.generated = croppedWatermark;
    try { sessionStorage.setItem('monkos_generated', croppedWatermark); } catch(e) {}

    const elapsed = Date.now() - genStartTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    await new Promise(resolve => setTimeout(resolve, remaining));

    startCountdown(() => {
      // 比較カット: 原本 vs クロップウォーターマーク
      const genImg = document.querySelector('#photo-generated');
      if (genImg) genImg.src = croppedWatermark;

      // 比較カットラベル — クロップではなく補正本のため
      const label = document.querySelector('#photo-generated-wrap .label');
      if (label) label.textContent = 'AI 補正';

      store.statusText = TX.resultDone;
      store.resultTitle = TX.resultDone;
      store.resultSubtitle = TX.resultDoneSub;
      store.stepLabel = TX.resultDone;
      store.showStep3Actions = true;
      store.showStep2Actions = false;

      const btnDownload = document.querySelector('#btn-download');
      if (btnDownload) btnDownload.disabled = false;

      // ウォーターマークプレビューもクロップ版
      store.watermarkPreview = croppedWatermark;

    });

  } catch (err) {
    hideGenOverlay();
    if (err.status === 402) {
      showChargeModal();
      store.showStep2Actions = true;
      store.resultTitle = TX.resultConfirm;
      store.resultSubtitle = 'クレジットが不足しています';
      store.step = 2;
    } else {
      showGenerateError(err.error || err.message || 'リタッチ失敗');
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
  Monk.log('生成エラー: ' + error);
}

// ─── ダウンロード (サーバー側Signed URL) ───
async function downloadResult() {
  if (!store.generated) return;

  // C2 ホットフィックス: 連続クリック防止
  const btn = document.querySelector('#btn-download');
  if (btn) btn.disabled = true;

  // ログイン必須
  if (!store.user.id) {
    GateModule.showLoginRequired('ダウンロードにはログインが必要です', () => {
      downloadResult();
    });
    return;
  }

  // GCSパス必須
  if (!_gcsPath) {
    Monk.log('GCSパスなし — サーバー側ウォーターマーク未適用セッション');
    if (btn) btn.disabled = false;
    return;
  }

  // 残高不足 → チャージページ
  if (store.user.credits < CREDIT_COST.download) {
    sessionStorage.setItem('monkos_pending_action', 'download');
    showChargeModal();
    return;
  }

  doDownload();
}

// ─── 前後比較合成（thankyou用） ───
async function generateCompareImage() {
  const captured = loadSessionData('captured');
  const cropped = loadSessionData('image');
  if (!captured || !cropped) return;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const [imgA, imgB] = await Promise.all([
      loadImage(captured),
      loadImage(cropped),
    ]);

    // 並べて配置（同じ高さ、比率維持）
    const h = 400;
    const wA = (imgA.width / imgA.height) * h;
    const wB = (imgB.width / imgB.height) * h;
    const gap = 16;
    const pad = 24;
    const totalW = wA + gap + wB + pad * 2;
    const totalH = h + pad * 2 + 40; // 下部ブランディング領域

    canvas.width = totalW;
    canvas.height = totalH;

    // 背景
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, totalW, totalH);

    // 原本
    ctx.drawImage(imgA, pad, pad, wA, h);
    // 完成本
    ctx.drawImage(imgB, pad + wA + gap, pad, wB, h);

    // ラベル
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('オリジナル', pad + wA / 2, pad + h + 18);
    ctx.fillText(PHOTO_SPECS[store.format]?.name || '完成', pad + wA + gap + wB / 2, pad + h + 18);

    // ブランディング
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ MONKOS AI証明写真  ·  monkos.ai', totalW / 2, totalH - 10);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    sessionStorage.setItem('monkos_compare', dataUrl);
  } catch (e) {
    Monk.log('前後比較合成失敗: ' + e.message);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function doDownload() {
  try {
    // サーバーにダウンロード要求 (クレジット70c差引 + サーバークロップ + 原本Signed URL)
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, gcsPath: _gcsPath, format: store.format }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 402) {
        showChargeModal();
        return;
      }
      throw new Error(data.error || 'ダウンロード失敗');
    }

    store.user = { ...store.user, credits: data.credits };

    // サーバークロップ本 → thankyou表示用
    saveSessionData('image', data.image);

    // 原本Signed URL 保存 (thankyouで原本ダウンロード用)
    try {
      sessionStorage.setItem('monkos_originalUrl', data.originalUrl);
      sessionStorage.setItem('monkos_gcsPath', _gcsPath);
    } catch(e) {}

    // 前後比較合成
    await generateCompareImage();

    // thankyou.htmlへ遷移
    navigateTo('thankyou.html');

  } catch (err) {
    Monk.log('ダウンロードエラー: ' + (err.error || err.message));
    const btn = document.querySelector('#btn-download');
    if (btn) btn.disabled = false;
  }
}

// ─── window公開 (onclick互換) ───
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  showChargeModal,
});

// ─── 初期化 ───
async function init() {
  initChatbot();

  try {
    await sharedInit();
  } catch (err) {
    Monk.log('sharedInit エラー: ' + err.message);
  }

  // ローディング状態除去
  document.querySelector('#page-loading')?.remove();

  // 結果画面アクティブ化
  const resultArea = document.querySelector('#result-overlay');
  if (resultArea) resultArea.classList.add('active');

  // リダイレクト復帰時にGCSパス復元
  const pendingGcsPath = sessionStorage.getItem('monkos_gcsPath');
  if (pendingGcsPath) {
    _gcsPath = pendingGcsPath;
    Monk.log('GCSパス復元: ' + _gcsPath);
  }

  // 広告manifestプリロード
  loadAdManifest();

  // sessionStorageから生成画像復元（リダイレクト後復帰用 — ウォーターマーク版）
  if (!store.generated) {
    const savedGen = sessionStorage.getItem('monkos_generated');
    if (savedGen) {
      store.generated = savedGen;
      Monk.log('生成画像sessionStorageから復元（ウォーターマーク）');
    }
  }

  // 比較画像右クリック防止（補助防御）
  document.querySelectorAll('#photo-generated').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
  });

  // === 生成画像存在時に結果画面復元（チャージ後復帰） ===
  if (store.generated) {
    // オリジナルも表示（比較用）
    const captured = loadSessionData('captured');
    if (captured) {
      store.captured = captured;
      const imgEl = document.querySelector('#photo-original');
      if (imgEl) imgEl.src = captured;
    }

    const genImg = document.querySelector('#photo-generated');
    if (genImg) genImg.src = store.generated;

    store.step = 3;
    store.stepLabel = TX.resultDone;
    store.resultTitle = TX.resultDone;
    store.resultSubtitle = TX.resultDoneSub;
    store.showStep3Actions = true;
    store.showStep2Actions = false;
    store.watermarkPreview = store.generated;

    const btnDownload = document.querySelector('#btn-download');
    if (btnDownload) btnDownload.disabled = false;

    Monk.log('生成結果復元（チャージ後復帰）');

    // 決済復帰検知 — ?payment=complete パラメータ
    const urlParams = new URLSearchParams(location.search);
    const isPaymentReturn = urlParams.get('payment') === 'complete';

    // URLからpaymentパラメータ除去（履歴クリーン化）
    if (isPaymentReturn) {
      const cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete('payment');
      history.replaceState(null, '', cleanUrl.toString());
    }

    // チャージ目的がダウンロードなら自動進行（決済復帰時はクレジットポーリング）
    const pendingAction = sessionStorage.getItem('monkos_pending_action');
    if (pendingAction === 'download') {
      if (isPaymentReturn) {
        // Webhook反映待ち — 最大15秒ポーリング
        Monk.log('決済復帰 — クレジットポーリング開始');
        let attempts = 0;
        const pollCredits = async () => {
          attempts++;
          await fetchLatestCredits();
          if (store.user.credits >= CREDIT_COST.download) {
            sessionStorage.removeItem('monkos_pending_action');
            Monk.log(`クレジット反映確認 (${attempts}回目) — ダウンロード自動進行`);
            setTimeout(() => downloadResult(), 300);
          } else if (attempts < 5) {
            setTimeout(pollCredits, 3000);
          } else {
            sessionStorage.removeItem('monkos_pending_action');
            Monk.log('クレジットポーリングタイムアウト — 手動ダウンロードへ');
            alert('決済は完了しましたが、クレジット反映に時間がかかっています。\nしばらくしてからダウンロードボタンを押してください。');
          }
        };
        setTimeout(pollCredits, 2000);
      } else if (store.user.credits >= CREDIT_COST.download) {
        sessionStorage.removeItem('monkos_pending_action');
        setTimeout(() => downloadResult(), 300);
      } else {
        sessionStorage.removeItem('monkos_pending_action');
      }
    } else {
      sessionStorage.removeItem('monkos_pending_action');
    }
  } else {
    showOriginal();
  }

  Monk.log('分析室初期化完了');
}

init();
