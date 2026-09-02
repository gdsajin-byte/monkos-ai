/**
 * thankyou.js — v6 受取処(エンディングページ) 専用ロジック
 * 進入: result.js doDownload() 成功 → navigateTo('thankyou.html')
 * データ: sessionStorage (monkos_image, monkos_compare, monkos_originalUrl, monkos_format)
 * v6: フルショット別課金廃止 — ダウンロード70cにクロップ本+原本含む
 */

import {
  store, Monk,
  sharedInit, loadSessionData, navigateTo,
  API
} from './shared.js';
import { initChatbot } from './modules/chatbot.js';

// ─── Media (toJpeg 専用) ───
const media = Monk.media({
  video: null,
  canvas: null,
  maxSize: 720,
});

// ─── トーストフィードバック ───
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(139,92,246,0.9)', color: '#fff', padding: '10px 20px',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    zIndex: '9999', transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── 原本URL状態 ───
let _originalUrl = null;

// ─── §2-3 完成本表示 ───
function displayPhoto() {
  const cropped = loadSessionData('image');
  if (!cropped) {
    Monk.log('クロップデータなし → 準備画面へ移動');
    navigateTo('prep.html');
    return;
  }

  store.cropped = cropped;

  const imgEl = document.querySelector('#ty-photo');
  if (imgEl) imgEl.src = cropped;

  Monk.log('受取画面 写真表示完了');
}

// ─── §2-4 ダウンロード (クロップ本ギャラリー保存) ───
async function downloadCropped() {
  if (!store.cropped) return;
  const jpegUrl = await media.toJpeg(store.cropped, 0.92);

  if (navigator.share && navigator.canShare) {
    try {
      const res = await fetch(jpegUrl);
      const blob = await res.blob();
      const file = new File([blob], `monkos_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'MONKOS AI証明写真' });
        Monk.log('写真共有完了');
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
  Monk.log('JPEG保存完了');
}

// ─── §2-4b 原本(ノークロップ) ダウンロード — 追加課金なし ───
function downloadOriginal() {
  if (!_originalUrl) {
    showToast('原本画像を読み込めません');
    return;
  }

  const a = document.createElement('a');
  a.href = _originalUrl;
  a.download = 'MONKOS_AI_Original.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('原本ダウンロード完了');
  Monk.log('原本ダウンロードトリガー');
}

// ─── 原本ボタンセットアップ ───
function setupOriginalDownload() {
  _originalUrl = sessionStorage.getItem('monkos_originalUrl');
  const section = document.getElementById('ty-fullshot-section');
  if (!section) return;

  if (!_originalUrl) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'flex';

  // 価格表示変更 (無料)
  const priceEl = document.getElementById('ty-fullshot-price');
  if (priceEl) priceEl.textContent = '無料';

  const titleEl = document.getElementById('ty-fullshot-title');
  if (titleEl) titleEl.textContent = '📸 原本(ノークロップ) 保存する';

  section.addEventListener('click', downloadOriginal);
}

// ─── §2-5 前後比較表示 + 保存 ───
function setupCompare() {
  const compareData = sessionStorage.getItem('monkos_compare');
  const section = document.getElementById('ty-compare-section');
  if (!compareData || !section) return;

  section.style.display = 'flex';

  const thumb = document.getElementById('ty-compare-thumb');
  if (thumb) thumb.src = compareData;

  const saveBtn = document.getElementById('btn-ty-compare-save');
  if (saveBtn) saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveCompare(compareData);
  });

  // カード全体クリックも保存
  section.addEventListener('click', () => saveCompare(compareData));
}

async function saveCompare(compareData) {
  const jpegUrl = await media.toJpeg(compareData, 0.92);

  if (navigator.share && navigator.canShare) {
    try {
      const res = await fetch(jpegUrl);
      const blob = await res.blob();
      const file = new File([blob], `monkos_compare_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'MONKOS AI ビフォーアフター' });
        Monk.log('ビフォーアフター共有完了');
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  const a = document.createElement('a');
  a.href = jpegUrl;
  a.download = `monkos_compare_${Date.now()}.jpg`;
  a.click();
  Monk.log('ビフォーアフター保存完了');
}

// ─── 戻るボタン防御 ───
function setupBackGuard() {
  history.replaceState(null, '', location.href);
  window.addEventListener('popstate', () => {
    history.replaceState(null, '', location.href);
  });
}

// ─── クロップアプリ移動 ───
function goToCrop() {
  const format = loadSessionData('format') || 'passport';
  navigateTo(`crop.html?from=thankyou&spec=${format}`);
}

// ─── window公開 ───
Object.assign(window, {
  navigateTo,
  goToCrop,
});

// ─── 初期化 ───
async function init() {
  initChatbot();
  await sharedInit();

  // 受取画面アクティブ化
  const tyScreen = document.querySelector('#thankyou-screen');
  if (tyScreen) tyScreen.classList.add('active');

  // 写真表示
  displayPhoto();

  // 前後比較セットアップ
  setupCompare();

  // 原本ダウンロードセットアップ (追加課金なし)
  setupOriginalDownload();

  // 戻るボタン防御
  setupBackGuard();

  // ダウンロードボタン (クロップ本)
  const dlBtn = document.getElementById('btn-ty-download');
  if (dlBtn) dlBtn.addEventListener('click', downloadCropped);

  // クロップボタン
  const cropBtn = document.getElementById('btn-ty-crop');
  if (cropBtn) cropBtn.addEventListener('click', goToCrop);

  // ホームボタン
  const homeBtn = document.getElementById('btn-ty-home');
  if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('/'));

  // pending action 整理
  const pendingAction = sessionStorage.getItem('monkos_pending_action');
  if (pendingAction) {
    sessionStorage.removeItem('monkos_pending_action');
  }

  // 2026-09-02: 'purchase'→'download_complete'. 수령은 결제가 아니다(충전 시점이 purchase). 다운로드마다 발화하던 가짜 매출 차단
  if (typeof gtag === 'function') gtag('event', 'download_complete', { spec_type: store.format || '', auth_method: store.user?.provider || '', lang: document.documentElement.lang || 'ja', service: 'idphoto-jp' });

  Monk.log('受取画面 v6 初期化完了');
}

init();
