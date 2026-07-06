import { escapeHtml, layoutHead, layoutNav, layoutFooter } from './render-shell.js';
import { log } from '../shared/config.js';

const I18N = {
  ko: {
    title: 'AI 프로페셔널 헤드샷',
    subtitle: '30초 만에 완성하는 비즈니스 프로필 사진',
    metaDesc: 'AI로 프로페셔널 헤드샷을 30초 만에 생성하세요. 링크드인, 이력서, 기업 프로필에 최적화된 비즈니스 사진.',
    uploadTitle: '내 사진 업로드',
    uploadDesc: '정면 셀카 또는 상반신 사진을 올려주세요',
    uploadBtn: '사진 선택',
    cameraBtn: '카메라 촬영',
    dragText: '또는 여기에 드래그',
    styleTitle: '스타일 선택',
    styles: {
      linkedin_pro: '링크드인 · 비즈니스',
      corporate: '임원 · 기업 프로필',
      creative: '크리에이터 · 자유직',
      professional: '전문직 프로필',
      dating: '데일리 · 소개팅',
    },
    styleDesc: {
      linkedin_pro: '밝은 오피스, 신뢰감 있는 톤',
      corporate: '스튜디오 조명, 격식 있는 무드',
      creative: '자연광, 편안하고 감각적인 분위기',
      professional: '깔끔한 배경, 단정한 인상',
      dating: '따뜻한 야외 감성, 자연스러운 미소',
    },
    generateBtn: '헤드샷 생성하기',
    creditCost: '10 credits',
    balanceLabel: '잔액',
    loginRequired: '로그인이 필요합니다',
    loginBtn: '구글로 로그인',
    insufficientCredits: '크레딧이 부족합니다',
    chargeBtn: '크레딧 충전',
    generating: '헤드샷 생성 중...',
    generatingDesc: 'AI가 프로페셔널 헤드샷을 만들고 있습니다 (10~20초)',
    resultTitle: '헤드샷 완성',
    originalLabel: '원본',
    resultLabel: '헤드샷',
    retryBtn: '다시 생성',
    downloadBtn: '다운로드',
    otherStyleBtn: '다른 스타일',
    historyTitle: '생성 히스토리',
    errorRetry: '생성에 실패했습니다. 다시 시도해주세요.',
    howItWorks: '이용 방법',
    step1: '사진 업로드',
    step1Desc: '정면 셀카 또는 상반신 사진',
    step2: '스타일 선택',
    step2Desc: '용도에 맞는 스타일을 고르세요',
    step3: 'AI 생성',
    step3Desc: '30초 만에 프로 헤드샷 완성',
    pay: {
      title: '결제 방법 선택',
      instant: '바로 결제 (회원가입 불필요)',
      desc: '1회 결제로 헤드샷 1컷 생성',
      ctaSelect: '스타일을 선택해 주세요',
      ctaPhoto: '사진을 올려주세요',
      ctaMake: '이 스타일로 헤드샷 만들기',
      back: '스타일 다시 고르기',
      makeBtn: '이 사진으로 만들기',
      freeTitle: '🎁 첫 로그인 무료 체험 — 10c(1컷) 지급',
      freeSub: '크레딧 충전 시 패키지 할인',
      chargeTitle: '크레딧 충전하기 (충전할수록 할인)',
      orLogin: '로그인하고 첫 1컷 무료 받기',
      orCharge: '또는 크레딧 충전하기 (충전할수록 할인)',
      confirmSuffix: '결제하기',
      waiting: '결제 확인 중...',
      waitingHint: '결제 창에서 결제를 완료해주세요',
      confirming: '결제 승인 중...',
      failed: '결제에 실패했습니다. 다시 시도해주세요.',
      cancelled: '결제가 취소되었습니다.',
      initFail: '결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.',
      timeout: '결제 확인 시간이 초과되었습니다. 다시 시도해주세요.',
      imgLost: '결제가 확인되었습니다. 사진을 다시 올리고 스타일을 선택해주세요 (추가 결제 없음).',
      tokenExpired: '결제 유효기간(24시간)이 지났습니다. 다시 결제해주세요.',
      tokenUsed: '이미 사용된 결제입니다. 다시 결제해주세요.',
      genLimit: '재생성 횟수를 모두 사용했습니다. 새로 결제해주세요.',
      errNet: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    },
  },
  en: {
    title: 'AI Professional Headshot',
    subtitle: 'Business profile photo in 30 seconds',
    metaDesc: 'Generate professional AI headshots in 30 seconds. Optimized for LinkedIn, resumes, and corporate profiles.',
    uploadTitle: 'Upload Your Photo',
    uploadDesc: 'Front-facing selfie or upper body photo',
    uploadBtn: 'Choose Photo',
    cameraBtn: 'Take Photo',
    dragText: 'or drag & drop here',
    styleTitle: 'Choose Style',
    styles: {
      linkedin_pro: 'LinkedIn',
      corporate: 'Corporate',
      creative: 'Creative',
      professional: 'Professional',
      dating: 'Dating Profile',
    },
    styleDesc: {
      linkedin_pro: 'Bright office, trustworthy tone',
      corporate: 'Studio lighting, formal mood',
      creative: 'Natural light, relaxed and expressive',
      professional: 'Clean backdrop, polished look',
      dating: 'Warm outdoor vibe, natural smile',
    },
    generateBtn: 'Generate Headshot',
    creditCost: '10 credits',
    balanceLabel: 'Balance',
    loginRequired: 'Login required',
    loginBtn: 'Sign in with Google',
    insufficientCredits: 'Insufficient credits',
    chargeBtn: 'Buy Credits',
    generating: 'Generating headshot...',
    generatingDesc: 'AI is creating your professional headshot (10-20 sec)',
    resultTitle: 'Headshot Ready',
    originalLabel: 'Original',
    resultLabel: 'Headshot',
    retryBtn: 'Regenerate',
    downloadBtn: 'Download',
    otherStyleBtn: 'Try Another Style',
    historyTitle: 'Generation History',
    errorRetry: 'Generation failed. Please try again.',
    howItWorks: 'How It Works',
    step1: 'Upload Photo',
    step1Desc: 'Front-facing selfie or upper body',
    step2: 'Choose Style',
    step2Desc: 'Pick the right style for your needs',
    step3: 'AI Generate',
    step3Desc: 'Pro headshot ready in 30 seconds',
    pay: {
      title: 'Choose Payment',
      instant: 'Pay now (no signup)',
      desc: 'One payment, one headshot',
      ctaSelect: 'Choose a style first',
      ctaPhoto: 'Upload your photo',
      ctaMake: 'Create my headshot in this style',
      back: 'Choose a different style',
      makeBtn: 'Create with this photo',
      freeTitle: '🎁 First sign-in free — 10 credits (1 headshot)',
      freeSub: 'Bulk discounts on credit top-ups',
      chargeTitle: 'Top up credits (bulk discounts)',
      orLogin: 'Sign in & get your first headshot free',
      orCharge: 'Or top up credits (bulk discounts)',
      confirmSuffix: 'Pay',
      waiting: 'Waiting for payment...',
      waitingHint: 'Complete the payment in the checkout window',
      confirming: 'Confirming payment...',
      failed: 'Payment failed. Please try again.',
      cancelled: 'Payment was cancelled.',
      initFail: 'Could not start payment. Please try again shortly.',
      timeout: 'Payment confirmation timed out. Please try again.',
      imgLost: 'Payment confirmed. Please re-upload your photo and pick a style (no extra charge).',
      tokenExpired: 'Payment expired (24h). Please pay again.',
      tokenUsed: 'This payment was already used. Please pay again.',
      genLimit: 'All regenerations used. Please purchase again.',
      errNet: 'Network error. Please try again.',
    },
  },
  ja: {
    title: 'AIプロフェッショナルヘッドショット',
    subtitle: '30秒でビジネスプロフィール写真を完成',
    metaDesc: 'AIでプロフェッショナルなヘッドショットを30秒で生成。LinkedIn、履歴書、企業プロフィールに最適化。',
    uploadTitle: '写真をアップロード',
    uploadDesc: '正面のセルフィーまたは上半身の写真',
    uploadBtn: '写真を選択',
    cameraBtn: 'カメラで撮影',
    dragText: 'またはここにドラッグ',
    styleTitle: 'スタイルを選択',
    styles: {
      linkedin_pro: 'LinkedIn · ビジネス',
      corporate: '役員 · 企業プロフィール',
      creative: 'クリエイター',
      professional: '専門職プロフィール',
      dating: 'デイリー · マッチング',
    },
    styleDesc: {
      linkedin_pro: '明るいオフィス、信頼感のあるトーン',
      corporate: 'スタジオ照明、フォーマルなムード',
      creative: '自然光、リラックスした雰囲気',
      professional: '清潔な背景、端正な印象',
      dating: '暖かい屋外の空気感、自然な笑顔',
    },
    generateBtn: 'ヘッドショットを生成',
    creditCost: '10 credits',
    balanceLabel: '残高',
    loginRequired: 'ログインが必要です',
    loginBtn: 'Googleでログイン',
    insufficientCredits: 'クレジットが不足しています',
    chargeBtn: 'クレジットをチャージ',
    generating: 'ヘッドショット生成中...',
    generatingDesc: 'AIがプロフェッショナルなヘッドショットを作成中（10〜20秒）',
    resultTitle: 'ヘッドショット完成',
    originalLabel: 'オリジナル',
    resultLabel: 'ヘッドショット',
    retryBtn: '再生成',
    downloadBtn: 'ダウンロード',
    otherStyleBtn: '別のスタイル',
    historyTitle: '生成履歴',
    errorRetry: '生成に失敗しました。もう一度お試しください。',
    howItWorks: '使い方',
    step1: '写真アップロード',
    step1Desc: '正面セルフィーまたは上半身',
    step2: 'スタイル選択',
    step2Desc: '用途に合ったスタイルを選択',
    step3: 'AI生成',
    step3Desc: '30秒でプロ仕様の完成',
    pay: {
      title: 'お支払い方法を選択',
      instant: '今すぐ支払う（登録不要）',
      desc: '1回のお支払いで1枚生成',
      ctaSelect: 'スタイルを選んでください',
      ctaPhoto: '写真をアップロードしてください',
      ctaMake: 'このスタイルで作成',
      back: 'スタイルを選び直す',
      makeBtn: 'この写真で作成',
      freeTitle: '🎁 初回ログイン無料 — 10c（1枚）付与',
      freeSub: 'クレジットチャージでまとめ買い割引',
      chargeTitle: 'クレジットをチャージ（まとめ買い割引）',
      orLogin: 'ログインして初回1枚無料',
      orCharge: 'またはクレジットをチャージ（まとめ買い割引）',
      confirmSuffix: '支払う',
      waiting: '決済を確認中...',
      waitingHint: '決済ウィンドウでお支払いを完了してください',
      confirming: '決済を承認中...',
      failed: '決済に失敗しました。もう一度お試しください。',
      cancelled: '決済がキャンセルされました。',
      initFail: '決済を開始できません。しばらくしてからお試しください。',
      timeout: '決済確認がタイムアウトしました。もう一度お試しください。',
      imgLost: '決済を確認しました。写真を再アップロードしてスタイルを選択してください（追加料金なし）。',
      tokenExpired: '決済の有効期限（24時間）が切れました。再度お支払いください。',
      tokenUsed: 'この決済は既に使用されています。再度お支払いください。',
      genLimit: '再生成回数を使い切りました。再度ご購入ください。',
      errNet: 'ネットワークエラーが発生しました。もう一度お試しください。',
    },
  },
};

function getSeoMeta(lang) {
  const d = I18N[lang] || I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const canonicalUrl = `https://monkos.ai${prefix}/headshot`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `MONKOS AI Headshot`,
    applicationCategory: 'PhotographyApplication',
    operatingSystem: 'Web',
    url: canonicalUrl,
    description: d.metaDesc,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MONKOS',
      url: 'https://monkos.ai',
    },
  });

  return `<meta property="og:title" content="${escapeHtml(d.title)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(d.metaDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/headshot">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/headshot">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/headshot">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/headshot">
<script type="application/ld+json">${jsonLd}</script>`;
}

function buildStyleButtons(styles, descs = {}) {
  // 실사 카드 (2026-07-06 클로드 디자인 시안 이식) — 이모지 → 스타일별 결과 예시 사진
  return Object.entries(styles).map(([key, label]) =>
    `<button class="hs-style-btn hs-style-card" data-style="${key}">
      <img class="hs-style-img" src="/images/headshot/style-${key}.webp" alt="${escapeHtml(label)}" loading="lazy" width="480" height="600">
      <span class="hs-style-label">${escapeHtml(label)}</span>
      <span class="hs-style-desc">${escapeHtml(descs[key] || '')}</span>
    </button>`
  ).join('\n');
}

export function renderHeadshot(req, res, forceLang = null) {
  try {
    // 라우트 /headshot = ko 기본 (hreflang 정합 — /en/headshot, /ja/headshot는 forceLang 주입)
    const lang = forceLang || 'ko';
    const paymentRegion = req.paymentRegion || 'global';
    // 시장 판별: specs v2와 동일 소스 (render-specs.js:1837) — kr=토스 위젯, jp/global=레몬
    const market = lang === 'ja' ? 'jp' : lang === 'en' ? 'global' : 'kr';
    const priceLabel = market === 'kr' ? '₩2,000' : '$1.99';
    const d = I18N[lang] || I18N.ko;
    const seoMeta = getSeoMeta(lang);

    const bodyContent = `
<div class="hs-hero">
  <h1 class="hs-title">${escapeHtml(d.title)}</h1>
  <p class="hs-subtitle">${escapeHtml(d.subtitle)}</p>
</div>

<div class="hs-steps-bar">
  <div class="hs-step-indicator active" data-step="1"><span class="hs-step-num">1</span> ${escapeHtml(d.step1)}</div>
  <div class="hs-step-indicator" data-step="2"><span class="hs-step-num">2</span> ${escapeHtml(d.step2)}</div>
  <div class="hs-step-indicator" data-step="3"><span class="hs-step-num">3</span> ${escapeHtml(d.step3)}</div>
</div>

<section class="hs-section" id="hsUploadSection">
  <h2 class="hs-section-title">${escapeHtml(d.uploadTitle)}</h2>
  <p class="hs-section-desc">${escapeHtml(d.uploadDesc)}</p>
  <div class="hs-upload-zone" id="hsUploadZone">
    <div class="hs-upload-placeholder" id="hsUploadPlaceholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <div class="hs-upload-btns">
        <label class="hs-btn hs-btn-primary" for="hsFileInput">${escapeHtml(d.uploadBtn)}</label>
        <button class="hs-btn hs-btn-secondary" id="hsCameraBtn">${escapeHtml(d.cameraBtn)}</button>
      </div>
      <p class="hs-drag-text">${escapeHtml(d.dragText)}</p>
    </div>
    <div class="hs-upload-preview" id="hsUploadPreview" style="display:none;">
      <img id="hsPreviewImg" alt="preview">
      <button class="hs-change-btn" id="hsChangeBtn">✕</button>
    </div>
    <input type="file" id="hsFileInput" accept="image/*" style="display:none;">
    <input type="file" id="hsCameraInput" accept="image/*" capture="user" style="display:none;">
  </div>
</section>

<section class="hs-section" id="hsStyleSection">
  <h2 class="hs-section-title">${escapeHtml(d.styleTitle)}</h2>
  <div class="hs-style-grid">
    ${buildStyleButtons(d.styles, d.styleDesc)}
  </div>
</section>

<section class="hs-section" id="hsGenerateSection">
  <!-- 중립 CTA (2026-07-05 작가님): 가격 없는 "이 사진으로 만들기" → 클릭 시 결제 선택 화면.
       로그인+크레딧 충분 사용자만 JS가 즉시 크레딧 생성으로 직결 -->
  <button class="hs-btn hs-btn-generate" id="hsGenerateBtn" disabled
    data-label-select="${escapeHtml(d.pay.ctaSelect)}" data-label-photo="${escapeHtml(d.pay.ctaPhoto)}" data-label-make="${escapeHtml(d.pay.ctaMake)}">
    ${escapeHtml(d.pay.ctaSelect)}
  </button>
  <p class="hs-balance" id="hsBalance"></p>
</section>

<!-- 비로그인 직접결제 (T1 — specs v2 패턴 이식, 2026-07-05) -->
<section class="hs-section" id="hsPaySection" style="display:none;">
  <button type="button" class="hs-pay-back" id="hsPayBack">← ${escapeHtml(d.pay.back)}</button>
  <div class="hs-pay-sel">
    <img id="hsPaySelImg" src="" alt="" width="48" height="60">
    <span id="hsPaySelName"></span>
  </div>
  <h2 class="hs-section-title">${escapeHtml(d.pay.title)}</h2>
  <!-- 선택지 ① 바로 결제 (비회원 직접결제, 주 CTA — 2차 시안 강조 순서) -->
  <button class="hs-btn hs-btn-generate" id="hsPayInstant">
    ${escapeHtml(d.pay.instant)} — ${priceLabel}
  </button>
  <p class="hs-section-desc">${escapeHtml(d.pay.desc)}</p>
  <!-- 선택지 ② 크레딧 경로 — 비로그인: 첫 로그인 무료 체험 / 로그인+부족: 충전 라벨로 전환 -->
  <button class="hs-btn hs-btn-secondary" id="hsOptFree" style="width:100%;text-align:center;margin-top:10px;"
    data-title-free="${escapeHtml(d.pay.freeTitle)}" data-title-charge="${escapeHtml(d.pay.chargeTitle)}">
    <span id="hsOptFreeTitle">${escapeHtml(d.pay.freeTitle)}</span>
    <span id="hsOptFreeSub" style="display:block;font-size:0.82rem;color:#888;margin-top:2px;">${escapeHtml(d.pay.freeSub)}</span>
  </button>
  <div id="hsTossWidget" style="display:none;">
    <div id="hs-pm"></div>
    <div id="hs-agree"></div>
    <button class="hs-btn hs-btn-primary" id="hsPayConfirm" style="width:100%;margin-top:12px;"></button>
  </div>
  <p id="hsPayError" style="display:none;color:#ef4444;margin-top:8px;font-size:0.9rem;"></p>
</section>

<div class="hs-loading" id="hsLoading" style="display:none;">
  <div class="hs-spinner"></div>
  <p class="hs-loading-title">${escapeHtml(d.generating)}</p>
  <p class="hs-loading-desc">${escapeHtml(d.generatingDesc)}</p>
</div>

<section class="hs-result" id="hsResult" style="display:none;">
  <h2 class="hs-section-title">${escapeHtml(d.resultTitle)}</h2>
  <div class="hs-compare">
    <div class="hs-compare-item">
      <span class="hs-compare-label">${escapeHtml(d.originalLabel)}</span>
      <img id="hsOriginalImg" alt="original">
    </div>
    <div class="hs-compare-arrow">→</div>
    <div class="hs-compare-item">
      <span class="hs-compare-label">${escapeHtml(d.resultLabel)}</span>
      <img id="hsResultImg" alt="headshot">
    </div>
  </div>
  <div class="hs-result-actions">
    <button class="hs-btn hs-btn-secondary" id="hsRetryBtn">${escapeHtml(d.retryBtn)}</button>
    <button class="hs-btn hs-btn-primary" id="hsDownloadBtn">${escapeHtml(d.downloadBtn)}</button>
    <button class="hs-btn hs-btn-secondary" id="hsOtherStyleBtn">${escapeHtml(d.otherStyleBtn)}</button>
  </div>
</section>

<section class="hs-history" id="hsHistory" style="display:none;">
  <div class="hs-history-header">
    <h2 class="hs-section-title">${escapeHtml(d.historyTitle)}</h2>
    <button class="hs-btn hs-btn-secondary hs-btn-sm" id="hsDownloadAll">↓ Download All</button>
  </div>
  <div class="hs-history-grid" id="hsHistoryGrid"></div>
</section>
<div class="hs-lightbox" id="hsLightbox">
  <div class="hs-lightbox-content">
    <img id="hsLightboxImg" src="" alt="headshot full">
    <div class="hs-lightbox-actions">
      <button class="hs-btn hs-btn-primary" id="hsLightboxDownload">↓ Download</button>
      <button class="hs-btn hs-btn-secondary" id="hsLightboxClose">${lang === 'ko' ? '닫기' : lang === 'ja' ? '閉じる' : 'Close'}</button>
    </div>
  </div>
</div>

<section class="hs-how">
  <h2 class="hs-section-title">${escapeHtml(d.howItWorks)}</h2>
  <div class="hs-how-grid">
    <div class="hs-how-card">
      <div class="hs-how-num">1</div>
      <strong>${escapeHtml(d.step1)}</strong>
      <p>${escapeHtml(d.step1Desc)}</p>
    </div>
    <div class="hs-how-card">
      <div class="hs-how-num">2</div>
      <strong>${escapeHtml(d.step2)}</strong>
      <p>${escapeHtml(d.step2Desc)}</p>
    </div>
    <div class="hs-how-card">
      <div class="hs-how-num">3</div>
      <strong>${escapeHtml(d.step3)}</strong>
      <p>${escapeHtml(d.step3Desc)}</p>
    </div>
  </div>
</section>`;

    const html = `${layoutHead(`${d.title} | MONKOS AI`, d.metaDesc, seoMeta, lang)}
<link rel="stylesheet" href="/css/portal.css">
<link rel="stylesheet" href="/css/headshot.css">
</head>
<body>
${layoutNav(lang)}
<div class="container" style="max-width:640px;">
  ${bodyContent}
</div>
${layoutFooter(lang)}
<!-- Login Modal -->
<div class="modal-overlay" id="loginModal">
  <div class="modal-box">
    <h3 id="loginModalTitle">${lang === 'ko' ? '로그인' : lang === 'ja' ? 'ログイン' : 'Sign In'}</h3>
    <p style="text-align:center;margin:8px 0 16px;color:#a78bfa;font-weight:600;font-size:0.95rem;">
      ${lang === 'ko' ? '🎁 가입하면 첫 1컷 무료 (10 크레딧 즉시 지급)' : lang === 'ja' ? '🎁 登録で1枚無料（10クレジット即時付与）' : '🎁 Sign up & get your first headshot FREE (10 credits bonus)'}
    </p>
    <div class="login-buttons">
      <button class="login-btn" onclick="googleLogin(); closeLoginModal();">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.014 24.014 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-2.77c-.98.66-2.23 1.06-3.71 1.06-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        <span>${lang === 'ko' ? 'Google로 로그인' : lang === 'ja' ? 'Googleでログイン' : 'Sign in with Google'}</span>
      </button>
      ${paymentRegion === 'kr' ? `<button class="login-btn" onclick="loginKakao(); closeLoginModal();" style="background:#FEE500;color:#191919;border:none;">
        <span>카카오로 로그인</span>
      </button>` : ''}
      ${paymentRegion === 'jp' ? `<button class="login-btn" onclick="loginLine(); closeLoginModal();" style="background:#06C755;color:#fff;border:none;">
        <span>LINEでログイン</span>
      </button>` : ''}
    </div>
    <button class="modal-close-btn" id="loginModalClose" onclick="closeLoginModal()">${lang === 'ko' ? '닫기' : lang === 'ja' ? '閉じる' : 'Close'}</button>
  </div>
</div>
<!-- Credit Shop Modal -->
<div class="modal-overlay" id="creditShopModal">
  <div class="modal-box">
    <h3 id="shopTitle">크레딧 충전</h3>
    <p id="shopCurrentLabel"></p>
    <p id="shopCurrentCredits" style="display:none;"></p>
    <div id="shopItems"></div>
    <button class="modal-close-btn" id="shopCloseBtn" onclick="closeCreditShop()">닫기</button>
  </div>
</div>
<script>window.__LANG__='${lang}';window.__REGION__='${req.paymentRegion || (lang === 'ko' ? 'kr' : 'global')}';</script>
<script src="/js/i18n.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/main.js"></script>
<script src="/js/credits.js"></script>
${market === 'kr' ? '<script src="https://js.tosspayments.com/v2/standard"></script>' : ''}
<script>
  window.__HS_LANG__ = '${lang}';
  window.__HS_I18N__ = ${JSON.stringify({
    loginRequired: d.loginRequired,
    loginBtn: d.loginBtn,
    insufficientCredits: d.insufficientCredits,
    chargeBtn: d.chargeBtn,
    errorRetry: d.errorRetry,
    balanceLabel: d.balanceLabel,
    creditCost: d.creditCost,
  })};
  window.__HS_PAY__ = ${JSON.stringify({
    market,
    slug: 'headshot',
    priceLabel,
    i18n: d.pay,
  })};
</script>
<script src="/js/headshot.js"></script>
<script src="/js/track.js"></script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Headshot 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

export function renderHeadshotResult(req, res, forceLang = null) {
  return renderHeadshot(req, res, forceLang);
}
