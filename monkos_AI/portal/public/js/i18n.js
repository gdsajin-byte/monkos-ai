/**
 * MONKOS Portal v4 — i18n.js
 * 다국어 + 리전 + 유틸
 */

// === 번역 데이터 ===
const i18n = {
  ja: {
    login: 'ログイン',
    loginGoogle: 'Googleでログイン',
    loginKakao: 'カカオでログイン',
    loginLine: 'LINEでログイン',
    loginClose: '閉じる',
    chatPlaceholder: 'MONKOS AIに質問してください',
    chatHint: 'Enterで送信',
    chatWelcome: 'こんにちは！MONKOS AIです。証明写真、規格、価格、クロップアプリなど何でも聞いてください。',
    chatTitle: 'MONKOS AI',
    hero_sub: 'AI証明写真 · 26カ国規格',
    nav_home: 'ホーム',
    nav_specs: '規格',
    nav_blog: 'ブログ',
    nav_faq: 'FAQ',
    nav_pricing: '料金',
    specs_heading: '国別証明写真規格',
    specs_viewall: '全て見る →',
    specs_others: 'その他',
    guide1_title: 'AI証明写真をセルカで作る方法',
    guide2_title: '就活写真 前髪のポイント',
  },
  ko: {
    login: '로그인',
    loginGoogle: 'Google로 로그인',
    loginKakao: '카카오로 로그인',
    loginLine: 'LINE으로 로그인',
    loginClose: '닫기',
    chatPlaceholder: 'MONKOS AI에게 질문하세요',
    chatHint: 'Enter로 전송',
    chatWelcome: '안녕하세요! MONKOS AI입니다. 증명사진, 규격, 가격, 크롭앱 등 무엇이든 물어보세요.',
    chatTitle: 'MONKOS AI',
    hero_sub: 'AI 증명사진 · 26개국 규격',
    nav_home: '홈',
    nav_specs: '규격',
    nav_blog: '블로그',
    nav_faq: 'FAQ',
    nav_pricing: '가격',
    specs_heading: '국가별 증명사진 규격',
    specs_viewall: '전체보기 →',
    specs_others: '기타',
    guide1_title: 'AI 증명사진 셀카로 만드는법',
    guide2_title: '취활사진 앞머리 꼭 없애야 하나?',
  },
  en: {
    login: 'Login',
    loginGoogle: 'Login with Google',
    loginKakao: 'Login with Kakao',
    loginLine: 'Login with LINE',
    loginClose: 'Close',
    chatPlaceholder: 'Ask MONKOS AI',
    chatHint: 'Press Enter',
    chatWelcome: 'Hello! I\'m MONKOS AI. Ask me anything about ID photos, specs, pricing, or the crop app.',
    chatTitle: 'MONKOS AI',
    hero_sub: 'AI ID Photos · 26 Countries',
    nav_home: 'Home',
    nav_specs: 'Specs',
    nav_blog: 'Blog',
    nav_faq: 'FAQ',
    nav_pricing: 'Pricing',
    specs_heading: 'ID Photo Specs by Country',
    specs_viewall: 'View All →',
    specs_others: 'Others',
    guide1_title: 'How to make AI ID photos from selfies',
    guide2_title: 'Job photo: Must you remove bangs?',
  }
};

// === 동의 텍스트 ===
const consentTexts = {
  ja: {
    privacyTitle: '個人情報の収集・利用同意',
    portraitTitle: '肖像権及び画像使用同意',
    confirm: '確認',
    privacyContent: '<p><strong>1. 収集項目</strong></p><ul><li>アカウント情報: メール、名前、プロフィール写真</li><li>サービス利用記録: 接続時間、利用履歴</li></ul><p><strong>2. 収集目的</strong></p><ul><li>会員識別及びサービス提供</li><li>サービス利用統計及び改善</li></ul><p><strong>3. 保有期間</strong></p><ul><li>退会時まで又は関連法令による保存期間</li></ul><p><strong>4. 同意拒否権</strong></p><ul><li>同意を拒否する権利があり、拒否した場合サービス利用が制限されます。</li></ul>',
    portraitContent: '<p><strong>1. 同意内容</strong></p><ul><li>AI証明写真生成のための顔画像撮影及び処理</li><li>AIモデルによる画像変換及び生成</li></ul><p><strong>2. 画像処理方式</strong></p><ul><li>アップロードされた画像はAI処理後即削除されます。</li><li>生成された画像はサーバーに保存されません。</li><li>全ての処理はGoogle Cloud Platformで安全に行われます。</li></ul><p><strong>3. 権利案内</strong></p><ul><li>生成された画像の著作権はユーザーにあります。</li><li>MONKOSはユーザーの画像をマーケティング等の目的に使用しません。</li></ul><p><strong>4. 同意拒否権</strong></p><ul><li>同意を拒否する権利があり、拒否した場合AIフォトサービスの利用が制限されます。</li></ul>',
  },
  ko: {
    privacyTitle: '개인정보 수집·이용 동의',
    portraitTitle: '초상권 및 이미지 사용 동의',
    confirm: '확인',
    privacyContent: '<p><strong>1. 수집 항목</strong></p><ul><li>계정 정보: 이메일, 이름, 프로필 사진</li><li>서비스 이용 기록: 접속 시간, 이용 내역</li></ul><p><strong>2. 수집 목적</strong></p><ul><li>회원 식별 및 서비스 제공</li><li>서비스 이용 통계 및 개선</li></ul><p><strong>3. 보유 기간</strong></p><ul><li>회원 탈퇴 시까지 또는 관련 법령에 따른 보존 기간</li></ul><p><strong>4. 동의 거부권</strong></p><ul><li>동의를 거부할 권리가 있으며, 거부 시 서비스 이용이 제한됩니다.</li></ul>',
    portraitContent: '<p><strong>1. 동의 내용</strong></p><ul><li>AI 증명사진 생성을 위한 얼굴 이미지 촬영 및 처리</li><li>AI 모델을 통한 이미지 변환 및 생성</li></ul><p><strong>2. 이미지 처리 방식</strong></p><ul><li>업로드된 이미지는 AI 처리 후 즉시 삭제됩니다.</li><li>생성된 이미지는 서버에 저장되지 않습니다.</li><li>모든 처리는 Google Cloud Platform에서 안전하게 수행됩니다.</li></ul><p><strong>3. 권리 안내</strong></p><ul><li>생성된 이미지의 저작권은 이용자에게 있습니다.</li><li>MONKOS는 이용자의 이미지를 마케팅 등 다른 목적으로 사용하지 않습니다.</li></ul><p><strong>4. 동의 거부권</strong></p><ul><li>동의를 거부할 권리가 있으며, 거부 시 AI 사진 서비스 이용이 제한됩니다.</li></ul>',
  },
  en: {
    privacyTitle: 'Privacy Consent',
    portraitTitle: 'Image Usage Consent',
    confirm: 'OK',
    privacyContent: '<p><strong>1. Collected Items</strong></p><ul><li>Account info: email, name, profile picture</li><li>Service usage records: access time, usage history</li></ul><p><strong>2. Purpose</strong></p><ul><li>Member identification and service provision</li><li>Service statistics and improvement</li></ul><p><strong>3. Retention Period</strong></p><ul><li>Until account deletion or as required by law</li></ul><p><strong>4. Right to Refuse</strong></p><ul><li>You may refuse consent; refusal may limit service usage.</li></ul>',
    portraitContent: '<p><strong>1. Consent</strong></p><ul><li>Face image capture and processing for AI ID photo generation</li><li>Image conversion and generation via AI models</li></ul><p><strong>2. Image Processing</strong></p><ul><li>Uploaded images are deleted immediately after AI processing.</li><li>Generated images are not stored on our servers.</li><li>All processing is performed securely on Google Cloud Platform.</li></ul><p><strong>3. Rights</strong></p><ul><li>Copyright of generated images belongs to the user.</li><li>MONKOS does not use your images for marketing or other purposes.</li></ul><p><strong>4. Right to Refuse</strong></p><ul><li>You may refuse consent; refusal may limit AI photo service usage.</li></ul>',
  }
};

function getCookie(name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value) {
  document.cookie = name + '=' + value + ';domain=.monkos.ai;path=/;max-age=31536000;SameSite=Lax';
}

var lang = window.__LANG__ || getCookie('monkos_lang') || 'ko';
var region = window.__REGION__ || (lang === 'ko' ? 'kr' : 'global');
var t = i18n[lang];

// region 기반 CTA URL
function getCtaUrl() {
  return (region === 'kr')
    ? 'https://idphoto-kr.monkos.ai/'
    : 'https://idphoto-jp.monkos.ai/';
}

window.setLang = function(newLang) {
  lang = newLang;
  t = i18n[lang];
  region = (lang === 'ko') ? 'kr' : 'global';
  setCookie('monkos_lang', lang);
  if (newLang === 'ko') window.location.href = '/';
  else window.location.href = '/' + newLang + '/';
};

// === 언어 적용 (v4 DOM) ===
function applyLang() {
  t = i18n[lang];
  document.documentElement.lang = lang;

  // 언어 버튼 활성화
  document.querySelectorAll('.lang-sw button').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // 챗봇
  var cbInput = document.getElementById('cbInput');
  if (cbInput) cbInput.placeholder = t.chatPlaceholder;
  var cbHint = document.querySelector('.cb-hint');
  if (cbHint) cbHint.textContent = t.chatHint;
  var chatHeaderTitle = document.querySelector('.chat-header h3');
  if (chatHeaderTitle) chatHeaderTitle.textContent = t.chatTitle;

  // 로그인 관련
  var headerLoginBtn = document.getElementById('headerLoginBtn');
  if (headerLoginBtn) headerLoginBtn.textContent = t.login;
  var loginTitle = document.getElementById('loginModalTitle');
  if (loginTitle) loginTitle.textContent = t.login;
  var loginGoogle = document.getElementById('loginGoogleText');
  if (loginGoogle) loginGoogle.textContent = t.loginGoogle;
  var loginKakao = document.getElementById('loginKakaoText');
  if (loginKakao) loginKakao.textContent = t.loginKakao;
  var loginLine = document.getElementById('loginLineText');
  if (loginLine) loginLine.textContent = t.loginLine;
  var loginClose = document.getElementById('loginModalClose');
  if (loginClose) loginClose.textContent = t.loginClose;

  // 동의 모달
  var ct = consentTexts[lang] || consentTexts.en;
  var pTitle = document.getElementById('privacyModalTitle');
  if (pTitle) pTitle.textContent = ct.privacyTitle;
  var ptTitle = document.getElementById('portraitModalTitle');
  if (ptTitle) ptTitle.textContent = ct.portraitTitle;
  var pContent = document.getElementById('privacyModalContent');
  if (pContent) pContent.innerHTML = ct.privacyContent;
  var ptContent = document.getElementById('portraitModalContent');
  if (ptContent) ptContent.innerHTML = ct.portraitContent;
  var pClose = document.getElementById('privacyModalClose');
  if (pClose) pClose.textContent = ct.confirm;
  var ptClose = document.getElementById('portraitModalClose');
  if (ptClose) ptClose.textContent = ct.confirm;

  // KR 트랙: LINE 로그인 버튼 숨김
  var lineBtn = document.getElementById('loginLineBtn');
  if (lineBtn) lineBtn.style.display = (region === 'kr') ? 'none' : 'flex';

  // data-i18n 범용 핸들러
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
}

// 초기 적용
applyLang();
