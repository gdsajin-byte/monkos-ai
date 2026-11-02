import { escapeHtml, layoutHead, layoutNav, layoutFooter } from './render-shell.js';
import { log } from '../shared/config.js';

const I18N = {
  ko: {
    title: 'AI 프로페셔널 헤드샷',
    subtitle: '셀카 한 장이면 충분해요. 30초 뒤, 스튜디오급 프로필이 완성됩니다.',
    metaDesc: 'AI로 프로페셔널 헤드샷을 30초 만에 생성하세요. 링크드인, 이력서, 기업 프로필에 최적화된 비즈니스 사진.',
    uploadTitle: '내 사진 업로드',
    uploadDesc: '얼굴이 잘 보이는 정면 셀카 한 장이면 돼요',
    uploadBtn: '사진 올리기',
    cameraBtn: '카메라로 찍기',
    dragText: '파일을 여기로 끌어다 놓아도 돼요',
    styleTitle: '스타일 선택',
    styleSubtitle: '어디에 쓸 프로필인가요? 용도에 맞는 스타일을 골라주세요',
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
      title: '결제 방법',
      subtitle: '한 번만 써볼지, 여러 컷 만들지에 따라 골라주세요',
      cardDirect: '바로 결제',
      badgeNoSignup: '회원가입 불필요',
      unitOne: '헤드샷 1컷',
      cardDirectDesc: '지금 이 사진 한 장만 빠르게 만들 때',
      cardCredit: '크레딧 충전',
      badgeBulk: '충전할수록 할인',
      creditFrom: '₩1,240',
      unitFrom: '컷부터',
      cardCreditDesc: '카카오 · 구글 간편로그인 후 여러 컷 만들 때',
      perCut: '한 컷 생성 10c',
      balance: '보유 크레딧',
      ctaDirect: '{price} 결제하고 헤드샷 만들기',
      ctaCreditLogin: '간편로그인하고 크레딧 충전하기',
      ctaCreditCharge: '크레딧 충전하고 만들기',
      subCredit: '충전 크레딧은 기한 없이 사용할 수 있어요',
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
      needCard: '카드사를 먼저 골라 주세요',
      needAgree: '약관에 동의해 주세요',
      waiting: '결제 확인 중...',
      waitingHint: '결제 창에서 결제를 완료해주세요',
      confirming: '결제 승인 중...',
      failed: '결제에 실패했습니다. 다시 시도해주세요.',
      cancelled: '결제가 취소되었습니다.',
      retryHint: '아래에서 결제를 다시 진행해 주세요.', // 실패 복귀 시 위젯 자동 재오픈 안내 (2026-09-20)
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
    subtitle: 'One selfie is all it takes — a studio-grade profile in 30 seconds.',
    metaDesc: 'Generate professional AI headshots in 30 seconds. Optimized for LinkedIn, resumes, and corporate profiles.',
    uploadTitle: 'Upload Your Photo',
    uploadDesc: 'A clear front-facing selfie is all you need',
    uploadBtn: 'Upload Photo',
    cameraBtn: 'Take Photo',
    dragText: 'or drag & drop your file here',
    styleTitle: 'Choose Style',
    styleSubtitle: 'Where will you use it? Pick the style that fits',
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
      title: 'Payment',
      subtitle: 'One-off or multiple headshots — pick what fits',
      cardDirect: 'Pay once',
      badgeNoSignup: 'No signup',
      unitOne: 'per headshot',
      cardDirectDesc: 'Fastest way to create just this one photo',
      cardCredit: 'Credits',
      badgeBulk: 'Bulk discounts',
      creditFrom: '$0.99',
      unitFrom: 'per cut from',
      cardCreditDesc: 'Sign in and create multiple headshots',
      perCut: '10 credits per headshot',
      balance: 'Balance',
      ctaDirect: 'Pay {price} & create my headshot',
      ctaCreditLogin: 'Sign in & top up credits',
      ctaCreditCharge: 'Top up & create',
      subCredit: 'Credits never expire',
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
      needCard: 'Please choose a card company first',
      needAgree: 'Please agree to the terms',
      waiting: 'Waiting for payment...',
      waitingHint: 'Complete the payment in the checkout window',
      confirming: 'Confirming payment...',
      failed: 'Payment failed. Please try again.',
      cancelled: 'Payment was cancelled.',
      retryHint: 'Please try the payment again below.',
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
    subtitle: 'セルフィー1枚で十分。30秒でスタジオ級のプロフィールが完成します。',
    metaDesc: 'AIでプロフェッショナルなヘッドショットを30秒で生成。LinkedIn、履歴書、企業プロフィールに最適化。',
    uploadTitle: '写真をアップロード',
    uploadDesc: '顔がはっきり見える正面のセルフィー1枚でOK',
    uploadBtn: '写真をアップ',
    cameraBtn: 'カメラで撮る',
    dragText: 'ファイルをここにドラッグ&ドロップでもOK',
    styleTitle: 'スタイルを選択',
    styleSubtitle: 'どこで使うプロフィールですか？用途に合うスタイルを選んでください',
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
      title: 'お支払い方法',
      subtitle: '1回だけ試すか、複数枚つくるかで選んでください',
      cardDirect: '今すぐ支払う',
      badgeNoSignup: '登録不要',
      unitOne: '1枚',
      cardDirectDesc: 'この1枚だけをすぐ作りたいとき',
      cardCredit: 'クレジット',
      badgeBulk: 'まとめ買い割引',
      creditFrom: '$0.99',
      unitFrom: '1枚あたり〜',
      cardCreditDesc: 'ログインして複数枚つくるとき',
      perCut: '1枚 = 10c',
      balance: '保有クレジット',
      ctaDirect: '{price} 支払って作成する',
      ctaCreditLogin: 'ログインしてチャージ',
      ctaCreditCharge: 'チャージして作成',
      subCredit: 'クレジットに有効期限はありません',
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
      needCard: 'カード会社を選択してください',
      needAgree: '利用規約に同意してください',
      waiting: '決済を確認中...',
      waitingHint: '決済ウィンドウでお支払いを完了してください',
      confirming: '決済を承認中...',
      failed: '決済に失敗しました。もう一度お試しください。',
      cancelled: '決済がキャンセルされました。',
      retryHint: '下の決済ボタンからもう一度お試しください。',
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
  <p class="hs-section-desc">${escapeHtml(d.styleSubtitle)}</p>
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
  <p class="hs-section-desc">${escapeHtml(d.pay.subtitle)}</p>
  <!-- 결제 방식 2카드 선택식 (클로드 디자인 시안) — CTA 라벨이 선택에 따라 변함 -->
  <div class="hs-pay-cards">
    <div class="hs-pay-card selected" id="hsPayCardDirect" role="button" tabindex="0">
      <div class="hs-pay-card-top">
        <span class="hs-pay-card-title">${escapeHtml(d.pay.cardDirect)}</span>
        <span class="hs-badge hs-badge-purple">${escapeHtml(d.pay.badgeNoSignup)}</span>
      </div>
      <div class="hs-pay-price"><b>${priceLabel}</b><span> / ${escapeHtml(d.pay.unitOne)}</span></div>
      <p class="hs-pay-card-desc">${escapeHtml(d.pay.cardDirectDesc)}</p>
    </div>
    <div class="hs-pay-card" id="hsPayCardCredit" role="button" tabindex="0">
      <div class="hs-pay-card-top">
        <span class="hs-pay-card-title">${escapeHtml(d.pay.cardCredit)}</span>
        <span class="hs-badge hs-badge-green">${escapeHtml(d.pay.badgeBulk)}</span>
      </div>
      <div class="hs-pay-price"><b>${escapeHtml(d.pay.creditFrom)}</b><span> / ${escapeHtml(d.pay.unitFrom)}</span></div>
      <p class="hs-pay-card-desc">${escapeHtml(d.pay.cardCreditDesc)}</p>
      <p class="hs-pay-bal">${escapeHtml(d.pay.perCut)} · ${escapeHtml(d.pay.balance)} <b id="hsPayCredBal">0c</b></p>
    </div>
  </div>
  <!-- 결제 에러 슬롯 2곳 (2026-09-20, specs 결제 동선 수정 이식) — 기존엔 결제하기 버튼 아래 1곳이라 문구가 시야 밖에 떴다.
       hsPayError = 첫 결제 버튼 바로 위(위젯 닫힘) / hsPayErrorConfirm = 결제하기 바로 위(위젯 열림). 표시 토글은 headshot.js -->
  <p class="hs-pay-error" id="hsPayError" role="alert" style="display:none;"></p>
  <button class="hs-btn hs-btn-generate" id="hsPayGo" style="margin-top:16px;"
    data-label-direct="${escapeHtml(d.pay.ctaDirect.replace('{price}', priceLabel))}"
    data-label-credit-login="${escapeHtml(d.pay.ctaCreditLogin)}"
    data-label-credit-charge="${escapeHtml(d.pay.ctaCreditCharge)}"
    data-sub-direct="${escapeHtml(d.pay.desc)}" data-sub-credit="${escapeHtml(d.pay.subCredit)}">
    ${escapeHtml(d.pay.ctaDirect.replace('{price}', priceLabel))}
  </button>
  <p class="hs-section-desc" id="hsPayGoSub">${escapeHtml(d.pay.desc)}</p>
  <div id="hsTossWidget" style="display:none;">
    <div id="hs-pm"></div>
    <div id="hs-agree"></div>
    <p class="hs-pay-error" id="hsPayErrorConfirm" role="alert" style="display:none;"></p>
    <button class="hs-btn hs-btn-primary" id="hsPayConfirm" style="width:100%;margin-top:12px;"></button>
    <!-- 결제하기 버튼 하단 고정(is-docked) 시 원래 자리를 지키는 스페이서 (2026-09-20) -->
    <div id="hsPayConfirmSpacer" aria-hidden="true" style="height:0;"></div>
  </div>
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
${market === 'kr' ? '<script src="/js/toss-pay-guard.js"></script>' : ''}
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
