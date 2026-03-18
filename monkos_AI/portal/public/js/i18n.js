/**
 * MONKOS Portal v4 — i18n.js
 * 다국어 + 리전 + 유틸
 */

// === 번역 데이터 ===
const i18n = {
  ja: {
    heroTag: '<strong>Photography</strong> × <strong>AI</strong> × <strong>K-Beauty</strong>',
    ctaText: '証明写真を撮る',
    login: 'ログイン',
    loginGoogle: 'Googleでログイン',
    loginKakao: 'カカオでログイン',
    loginLine: 'LINEでログイン',
    loginClose: '閉じる',
    chatPlaceholder: 'MONKOS AIに質問してください',
    chatHint: 'Enterで送信',
    chatWelcome: 'こんにちは！MONKOS AIです。証明写真、規格、価格、クロップアプリなど何でも聞いてください。',
    chatTitle: 'MONKOS AI',
    navHome: 'ホーム', navBlog: 'ブログ', navFaq: 'FAQ', navGallery: 'ギャラリー', navBoard: '掲示板', navPricing: '料金',
    svcPhotoTitle: 'AI証明写真', svcPhotoDesc: 'パスポート・履歴書・ビザ — スタジオ品質のAIリタッチ。ICAO国際規格。',
    svcPhotoLink: '撮影開始 →',
    svcCropTitle: '無料クロップアプリ', svcCropDesc: '規格クロップ・背景除去・背景交換。サーバー送信なし。',
    svcCropLink: '/crop →',
    introText: '<strong>MONKOS</strong>は20年のキャリアを持つ写真家が作った<strong>AI証明写真</strong>プラットフォームです。パスポート写真、履歴書写真、ビザ写真をセルフィー1枚で完成します。スタジオ撮影ノウハウを学習したAIが背景整理、照明補正、肌補正、服装整頓まで処理し、<strong>ICAO国際規格</strong>に適合する証明写真を提供します。',
    howto1: '規格選択', howto1d: 'パスポート/身分証または半名刺選択',
    howto2: 'セルフィー撮影', howto2d: 'AIコーチングガイドで完璧撮影',
    howto3: 'AIリタッチ', howto3d: '背景・照明・肌・服装自動補正',
    secHowto: '証明写真アプリの使い方', secHowtoAll: '全て見る →',
    secBlog: '最新ブログ', secBlogAll: '全て見る →',
    secNews: '業界ニュース', secNewsMore: 'もっと見る →',
  },
  ko: {
    heroTag: '<strong>Photography</strong> × <strong>AI</strong> × <strong>K-Beauty</strong>',
    ctaText: '촬영 시작하기',
    login: '로그인',
    loginGoogle: 'Google로 로그인',
    loginKakao: '카카오로 로그인',
    loginLine: 'LINE으로 로그인',
    loginClose: '닫기',
    chatPlaceholder: 'MONKOS AI에게 질문하세요',
    chatHint: 'Enter로 전송',
    chatWelcome: '안녕하세요! MONKOS AI입니다. 증명사진, 규격, 가격, 크롭앱 등 무엇이든 물어보세요.',
    chatTitle: 'MONKOS AI',
    navHome: '홈', navBlog: '블로그', navFaq: 'FAQ', navGallery: '갤러리', navBoard: '게시판', navPricing: '가격',
    svcPhotoTitle: 'AI 증명사진', svcPhotoDesc: '여권·이력서·비자 — 사진관 품질 AI 리터칭. ICAO 국제 규격.',
    svcPhotoLink: '촬영 시작 →',
    svcCropTitle: '무료 크롭앱', svcCropDesc: '규격 크롭·배경 제거·배경 교체. 서버 전송 없음.',
    svcCropLink: '/crop →',
    introText: '<strong>MONKOS</strong>는 20년 경력 사진작가가 만든 <strong>AI 증명사진</strong> 플랫폼입니다. 여권사진, 이력서사진, 비자사진을 셀카 한 장으로 완성합니다. 사진관 촬영 노하우를 학습한 AI가 배경 정리, 조명 보정, 피부 보정, 의상 정돈까지 처리하며 <strong>ICAO 국제 규격</strong>에 부합하는 증명사진을 제공합니다.',
    howto1: '규격 선택', howto1d: '여권/신분증 또는 반명함 선택',
    howto2: '셀카 촬영', howto2d: 'AI 코칭 가이드로 완벽 촬영',
    howto3: 'AI 리터칭', howto3d: '배경·조명·피부·의상 자동 보정',
    secHowto: '증명사진 앱 활용법', secHowtoAll: '전체보기 →',
    secBlog: '최근 블로그', secBlogAll: '전체보기 →',
    secNews: '업계 소식', secNewsMore: '더보기 →',
  },
  en: {
    heroTag: '<strong>Photography</strong> × <strong>AI</strong> × <strong>K-Beauty</strong>',
    ctaText: 'Take ID Photo',
    login: 'Login',
    loginGoogle: 'Login with Google',
    loginKakao: 'Login with Kakao',
    loginLine: 'Login with LINE',
    loginClose: 'Close',
    chatPlaceholder: 'Ask MONKOS AI',
    chatHint: 'Press Enter',
    chatWelcome: 'Hello! I\'m MONKOS AI. Ask me anything about ID photos, specs, pricing, or the crop app.',
    chatTitle: 'MONKOS AI',
    navHome: 'Home', navBlog: 'Blog', navFaq: 'FAQ', navGallery: 'Gallery', navBoard: 'Board', navPricing: 'Pricing',
    svcPhotoTitle: 'AI ID Photo', svcPhotoDesc: 'Passport, resume, visa — studio-quality AI retouching. ICAO standard.',
    svcPhotoLink: 'Start shooting →',
    svcCropTitle: 'Free Crop App', svcCropDesc: 'Spec crop, background removal & replacement. No server upload.',
    svcCropLink: '/crop →',
    introText: '<strong>MONKOS</strong> is an <strong>AI ID photo</strong> platform created by a photographer with 20 years of experience. Complete passport, resume, and visa photos with just one selfie. AI trained on studio techniques handles background, lighting, skin, and clothing — <strong>ICAO standard</strong> ID photos.',
    howto1: 'Select Spec', howto1d: 'Choose passport/ID or business card',
    howto2: 'Take Selfie', howto2d: 'AI coaching guide for perfect shots',
    howto3: 'AI Retouch', howto3d: 'Auto background, lighting, skin & clothing',
    secHowto: 'How to Use', secHowtoAll: 'View all →',
    secBlog: 'Latest Blog', secBlogAll: 'View all →',
    secNews: 'Industry News', secNewsMore: 'More →',
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

// === 리전 감지 ===
function detectRegion() {
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var navLang = (navigator.language || '').toLowerCase();
  if (tz === 'Asia/Seoul' || navLang.startsWith('ko')) return 'kr';
  return 'global';
}

function getCookie(name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value) {
  document.cookie = name + '=' + value + ';domain=.monkos.ai;path=/;max-age=31536000;SameSite=Lax';
}

var region = getCookie('monkos_region');
if (!region) {
  region = detectRegion();
  setCookie('monkos_region', region);
}

// 리전 → 언어 자동 추론 (보정 B)
function detectLang() {
  if (region === 'kr') return 'ko';
  var navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (navLang.startsWith('ja')) return 'ja';
  return 'en';
}

var lang = (region === 'kr') ? 'ko' : (localStorage.getItem('monkos_lang') || detectLang());
var t = i18n[lang];

// region 기반 CTA URL
function getCtaUrl() {
  return (region === 'kr')
    ? 'https://idphoto-kr.monkos.ai/app'
    : 'https://idphoto-jp.monkos.ai/app';
}

// 언어 전환 (KO → region=kr, JA/EN → region=global)
window.setLang = function(newLang) {
  lang = newLang;
  t = i18n[lang];
  localStorage.setItem('monkos_lang', lang);
  // 리전 자동 추론
  if (lang === 'ko') {
    region = 'kr';
  } else {
    region = 'global';
  }
  setCookie('monkos_region', region);
  // 홈 페이지에서 언어 변경 시 SSR 콘텐츠 리로드
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    window.location.href = '/?lang=' + newLang;
    return;
  }
  applyLang();
};

// === 언어 적용 (v4 DOM) ===
function applyLang() {
  t = i18n[lang];
  document.documentElement.lang = lang;

  // 언어 버튼 활성화
  document.querySelectorAll('.lang-sw button').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // 히어로
  var heroTag = document.querySelector('.hero-tag');
  if (heroTag) heroTag.innerHTML = t.heroTag;

  // CTA 버튼
  var ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.textContent = t.ctaText;
    ctaBtn.href = getCtaUrl();
  }
  var btnShoot = document.querySelector('.btn-shoot');
  if (btnShoot) btnShoot.textContent = t.ctaText;

  // 네비게이션
  var navKeys = ['navHome', 'navBlog', 'navFaq', 'navGallery', 'navBoard', 'navPricing'];
  document.querySelectorAll('.n-links a').forEach(function(a, i) {
    if (navKeys[i] && t[navKeys[i]]) a.textContent = t[navKeys[i]];
  });

  // 인트로 텍스트
  var intro = document.querySelector('.intro-text');
  if (intro) intro.innerHTML = t.introText;

  // 서비스 카드
  var svcPhoto = document.querySelector('.svc.live');
  if (svcPhoto) {
    var h3 = svcPhoto.querySelector('h3');
    var p = svcPhoto.querySelector('p');
    var link = svcPhoto.querySelector('.svc-link');
    if (h3) h3.textContent = t.svcPhotoTitle;
    if (p) p.textContent = t.svcPhotoDesc;
    if (link) link.textContent = t.svcPhotoLink;
  }
  var svcCrop = document.querySelector('.svc.free');
  if (svcCrop) {
    var h3c = svcCrop.querySelector('h3');
    var pc = svcCrop.querySelector('p');
    var linkc = svcCrop.querySelector('.svc-link');
    if (h3c) h3c.textContent = t.svcCropTitle;
    if (pc) pc.textContent = t.svcCropDesc;
    if (linkc) linkc.textContent = t.svcCropLink;
  }

  // 활용법 섹션
  var howtoCards = document.querySelectorAll('.howto');
  var howtoData = [
    { t: t.howto1, d: t.howto1d },
    { t: t.howto2, d: t.howto2d },
    { t: t.howto3, d: t.howto3d }
  ];
  howtoCards.forEach(function(card, i) {
    if (howtoData[i]) {
      var h4 = card.querySelector('h4');
      var p2 = card.querySelector('p');
      if (h4) h4.textContent = howtoData[i].t;
      if (p2) p2.textContent = howtoData[i].d;
    }
  });

  // 섹션 헤더
  var secHeaders = document.querySelectorAll('.sec-h');
  var secData = [
    { h: t.secHowto, a: t.secHowtoAll },
    { h: t.secBlog, a: t.secBlogAll },
    { h: t.secNews, a: t.secNewsMore }
  ];
  secHeaders.forEach(function(sh, i) {
    if (secData[i]) {
      var h2 = sh.querySelector('h2');
      var a = sh.querySelector('a');
      if (h2) h2.textContent = secData[i].h;
      if (a) a.textContent = secData[i].a;
    }
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
}

// 초기 적용
applyLang();
