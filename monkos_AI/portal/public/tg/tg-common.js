/**
 * tg-common.js — Telegram Mini App 공통 SDK
 * Telegram.WebApp 초기화 + initData 인증 + 다국어 + MainButton
 */

(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;

  // 텔레그램 외부 접근 차단
  if (!tg || !tg.initData) {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <div class="tg-blocked">
          <p>이 페이지는 텔레그램에서만 열 수 있습니다.</p>
          <p>This page can only be opened from Telegram.</p>
          <p>このページはテレグラムからのみ開けます。</p>
        </div>`;
    });
    return;
  }

  tg.ready();
  tg.expand();

  // BackButton → close
  if (tg.BackButton) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => tg.close());
  }

  // 언어 감지: URL ?lang 우선, fallback initDataUnsafe.user.language_code
  function detectLang() {
    const params = new URLSearchParams(location.search);
    const urlLang = params.get('lang');
    if (urlLang && ['ko', 'ja', 'en'].includes(urlLang)) return urlLang;

    const lc = tg.initDataUnsafe?.user?.language_code || '';
    if (lc.startsWith('ko')) return 'ko';
    if (lc.startsWith('ja')) return 'ja';
    return 'en';
  }

  // API 호출
  async function apiCall(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // initData 검증
  async function verifyUser() {
    const data = await apiCall('/api/tg/verify-init', { initData: tg.initData });
    return data;
  }

  // MainButton 래퍼
  function setMainButton(text, onClick, color) {
    if (!tg.MainButton) return;
    tg.MainButton.setText(text);
    tg.MainButton.color = color || '#a78bfa';
    tg.MainButton.textColor = '#ffffff';
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  }

  function hideMainButton() {
    if (tg.MainButton) tg.MainButton.hide();
  }

  function showMainButtonLoading() {
    if (tg.MainButton) tg.MainButton.showProgress();
  }

  function hideMainButtonLoading() {
    if (tg.MainButton) tg.MainButton.hideProgress();
  }

  // 토스트
  function showToast(msg, duration) {
    const el = document.createElement('div');
    el.className = 'tg-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, duration || 2000);
  }

  // 글로벌 노출
  window.MonkosTG = {
    tg,
    detectLang,
    verifyUser,
    apiCall,
    setMainButton,
    hideMainButton,
    showMainButtonLoading,
    hideMainButtonLoading,
    showToast,
  };
})();
