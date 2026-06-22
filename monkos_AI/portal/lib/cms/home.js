import { firestore, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { escapeHtml } from './render-shell.js';

const blogCollection = firestore.collection('blog_posts');
const siteConfigRef = firestore.collection('site_config').doc('main');
const layoutConfigRef = firestore.collection('site_config').doc('layout');

function esc(s) { return escapeHtml(s); }
function fmtDate(d) { return d ? d.substring(5, 10).replace('-', '.') : ''; }

const HOME_I18N = {
  ko: {
    badge: '200+국가 규격 검수 · ICAO 준수 · 5가지 스타일',
    h1: '전문 스튜디오가 개발한', h1Accent: 'AI 증명사진', h1Suffix: '서비스',
    heroSub: '여권·비자·규격 대응 <b style="color:#c2cad6;font-weight:700;">+</b><br>링크드인·프로페셔널·이력서 헤드샷.<br>셀카 한 장이면 끝.',
    stat1: '200+개국', stat1l: '여권·비자 규격', stat2: 'ICAO', stat2l: '국제 표준 준수', stat3: '5가지', stat3l: '헤드샷 스타일',
    idTitle: '증명사진', idTag: '규격 · 200+개국',
    idDesc: '여권·비자·신분증·이력서. AI가 각국 규격(px·배경·여백)에 정확히 맞춰 출력 — 한 번에 통과하는 한 장.',
    idChips: ['흰 배경', 'ICAO', '정수리 크롭'],
    idCta: '증명사진 만들기 →',
    hsEyebrow: 'AI HEADSHOT',
    hsTitle: '전문가의 품격, 한컷의 사진으로',
    hsSide: '규격이 필요한 <b style="color:#9aa3b2;">증명사진</b>은 위에서, 보여주고 싶은 <b style="color:#9aa3b2;">헤드샷</b>은 여기서.',
    hsPanelTitle: '헤드샷', hsPanelTag: 'NEW · 세미프로필',
    hsPanelDesc: '링크드인·이력서·회사 소개용 비즈니스 프로필. 셀카 한 장으로 5가지 컨셉을 골라 30초 만에<br>— 링크드인부터 데이팅 프로필까지.',
    hsCta: '헤드샷 만들기 →', hsCtaSub: '30초 · 비즈니스 프로필',
    hsPopular: '인기',
    dlTitle: 'Download <span style="color:#00D4AA;">IDPASS</span>',
    dlDesc: '완벽한 배경제거 및 변경<br>전 세계 규격 DB 크롭<br>완전한 무료 다운로드 NO 광고<br>모든 것은 내폰 안에서만~',
    dlSize: '5.5MB', dlReq: 'iOS 16+ 전용',
    bb1Eye: 'FREE · NO LOGIN', bb1H: '증명사진,<br>다 통과.',
    bb2Eye: '200+ COUNTRIES', bb2H: '여권·비자<br>규격 자동',
    bb3Eye: 'ON-DEVICE', bb3H: '서버 전송 없이<br>안전하게.',
    resEyebrow: 'RESOURCES', resTitle: '궁금한 점, 먼저 풀어드려요',
    specsCard: '📑 증명사진 규격 가이드', specsDesc: '여권·비자·신분증 — 국가별 px·배경·여백 기준을 한곳에서 확인하세요.', specsCta: '규격 DB 보기 →',
    boardTitle: '고객 게시판', viewAll: '전체보기 →', blogTitle: '최근 블로그',
    blogEmpty: '아직 포스트가 없습니다',
    navIdpass: 'IDPASS', navSpecs: '규격', navPricing: '가격',
    credits: '크레딧', login: '로그인',
    footerPowered: 'powered by <b style="color:#d4e8e4;font-weight:800">MONKOS AI</b>',
    footerLegal: 'MONKOS는 통신판매중개자가 아닌 통신판매업자로서 자체 제공 서비스에 대한 책임을 집니다. 결제·환불 및 이용 관련 문의는 고객센터로 연락 주시기 바랍니다.',
    metaTitle: 'MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진',
    metaDesc: 'AI 실시간 코칭으로 완벽한 증명사진을 촬영하세요. 여권, 비자, 이력서, 취업사진 지원.',
    htmlLang: 'ko', locale: 'ko_KR', canonical: 'https://monkos.ai/',
  },
  en: {
    badge: '200+ Country Specs · ICAO · 5 Styles',
    h1: 'AI ID Photos & Headshots', h1Accent: '', h1Suffix: '— Built by a Professional Studio',
    heroSub: 'Passport · Visa · 200+ country specs <b style="color:#c2cad6;font-weight:700;">+</b><br>LinkedIn · Corporate · Resume headshots.<br>One selfie is all you need.',
    stat1: '200+', stat1l: 'Passport & Visa Specs', stat2: 'ICAO', stat2l: 'International Standard', stat3: '5 Styles', stat3l: 'Headshot Styles',
    idTitle: 'ID Photo', idTag: 'Specs · 200+',
    idDesc: 'Passport · Visa · ID · Resume. AI precisely matches each country\'s specs (px, background, margins) — one shot that passes.',
    idChips: ['White BG', 'ICAO', 'Crown Crop'],
    idCta: 'Create ID Photo →',
    hsEyebrow: 'AI HEADSHOT',
    hsTitle: 'Professional presence, in a single shot',
    hsSide: 'Need specs? <b style="color:#9aa3b2;">ID photos</b> above. Want to impress? <b style="color:#9aa3b2;">Headshots</b> here.',
    hsPanelTitle: 'Headshot', hsPanelTag: 'NEW · Semi-Profile',
    hsPanelDesc: 'Business profiles for LinkedIn, resumes & company bios. Pick from 5 concepts with just one selfie in 30 seconds<br>— from LinkedIn to Dating Profile.',
    hsCta: 'Create Headshot →', hsCtaSub: '30s · Business Profile',
    hsPopular: 'Popular',
    dlTitle: 'Download <span style="color:#00D4AA;">IDPASS</span>',
    dlDesc: 'Perfect background removal & change<br>Worldwide spec DB crop<br>Completely free, NO ads<br>Everything stays on your phone~',
    dlSize: '5.5MB', dlReq: 'iOS 16+ only',
    bb1Eye: 'FREE · NO LOGIN', bb1H: 'ID Photos,<br>All Pass.',
    bb2Eye: '200+ COUNTRIES', bb2H: 'Passport · Visa<br>Auto Specs',
    bb3Eye: 'ON-DEVICE', bb3H: 'No server upload.<br>Safe & secure.',
    resEyebrow: 'RESOURCES', resTitle: 'Got questions? We\'ve got answers',
    specsCard: '📑 ID Photo Specs Guide', specsDesc: 'Passport · Visa · ID — Check specs (px, background, margins) for every country in one place.', specsCta: 'View Specs DB →',
    boardTitle: 'Community Board', viewAll: 'View All →', blogTitle: 'Recent Blog',
    blogEmpty: 'No posts yet',
    navIdpass: 'IDPASS', navSpecs: 'Specs', navPricing: 'Pricing',
    credits: 'Credits', login: 'Login',
    footerPowered: 'powered by <b style="color:#d4e8e4;font-weight:800">MONKOS AI</b>',
    footerLegal: 'MONKOS is a direct seller responsible for all services provided. For payment, refund, and usage inquiries, please contact customer support.',
    metaTitle: 'MONKOS AI | AI ID Photos · Passport Photos · Resume Photos',
    metaDesc: 'Capture perfect ID photos with AI real-time coaching. Passport, visa, resume photos supported.',
    htmlLang: 'en', locale: 'en_US', canonical: 'https://monkos.ai/en/',
  },
  ja: {
    badge: '200+カ国規格検査 · ICAO準拠 · 5つのスタイル',
    h1: 'プロスタジオが開発した', h1Accent: 'AI証明写真', h1Suffix: 'サービス',
    heroSub: 'パスポート·ビザ·規格対応 <b style="color:#c2cad6;font-weight:700;">+</b><br>LinkedIn·プロフェッショナル·履歴書ヘッドショット。<br>セルフィー1枚で完了。',
    stat1: '200+カ国', stat1l: 'パスポート·ビザ規格', stat2: 'ICAO', stat2l: '国際標準準拠', stat3: '5種類', stat3l: 'ヘッドショットスタイル',
    idTitle: '証明写真', idTag: '規格 · 200+カ国',
    idDesc: 'パスポート·ビザ·身分証·履歴書。AIが各国の規格(px·背景·余白)に正確に合わせて出力 — 一発で通る一枚。',
    idChips: ['白背景', 'ICAO', '頭頂クロップ'],
    idCta: '証明写真を作る →',
    hsEyebrow: 'AI HEADSHOT',
    hsTitle: 'プロの品格、一枚の写真で',
    hsSide: '規格が必要な<b style="color:#9aa3b2;">証明写真</b>は上で、見せたい<b style="color:#9aa3b2;">ヘッドショット</b>はここで。',
    hsPanelTitle: 'ヘッドショット', hsPanelTag: 'NEW · セミプロフィール',
    hsPanelDesc: 'LinkedIn·履歴書·会社紹介用ビジネスプロフィール。セルフィー1枚で5つのコンセプトから選んで30秒で<br>— LinkedInからデーティングプロフィールまで。',
    hsCta: 'ヘッドショットを作る →', hsCtaSub: '30秒 · ビジネスプロフィール',
    hsPopular: '人気',
    dlTitle: 'Download <span style="color:#00D4AA;">IDPASS</span>',
    dlDesc: '完璧な背景除去・変更<br>世界規格DBクロップ<br>完全無料・広告なし<br>すべてはスマホの中だけ~',
    dlSize: '5.5MB', dlReq: 'iOS 16+専用',
    bb1Eye: 'FREE · NO LOGIN', bb1H: '証明写真、<br>全部パス。',
    bb2Eye: '200+ COUNTRIES', bb2H: 'パスポート·ビザ<br>規格自動',
    bb3Eye: 'ON-DEVICE', bb3H: 'サーバー送信なし<br>安全に。',
    resEyebrow: 'RESOURCES', resTitle: '気になること、先にお答えします',
    specsCard: '📑 証明写真規格ガイド', specsDesc: 'パスポート·ビザ·身分証 — 国別px·背景·余白基準を一カ所で確認。', specsCta: '規格DB →',
    boardTitle: 'お客様掲示板', viewAll: '全て見る →', blogTitle: '最新ブログ',
    blogEmpty: 'まだ投稿がありません',
    navIdpass: 'IDPASS', navSpecs: '規格', navPricing: '料金',
    credits: 'クレジット', login: 'ログイン',
    footerPowered: 'powered by <b style="color:#d4e8e4;font-weight:800">MONKOS AI</b>',
    footerLegal: 'MONKOSは通信販売仲介業者ではなく通信販売業者として自社提供サービスに責任を負います。決済・返金・利用に関するお問い合わせはカスタマーセンターまでご連絡ください。',
    metaTitle: 'MONKOS AI | AI証明写真 · パスポート写真 · 履歴書写真',
    metaDesc: 'AIリアルタイムコーチングで完璧な証明写真を撮影。パスポート、ビザ、履歴書対応。',
    htmlLang: 'ja', locale: 'ja_JP', canonical: 'https://monkos.ai/ja/',
  },
};

const HEADSHOT_STYLES = [
  { key: 'linkedin_pro', label: 'LinkedIn', img: '/assets/headshot-linkedin.jpg', pos: '50% 18%' },
  { key: 'corporate', label: 'Corporate', img: '/assets/headshot-corporate.jpg', pos: '50% 14%' },
  { key: 'creative', label: 'Creative', img: '/assets/headshot-creative.png', pos: '50% 16%' },
  { key: 'professional', label: 'Professional', img: '/assets/headshot-professional.jpg', pos: '50% 16%' },
  { key: 'dating', label: 'Dating Profile', img: '/assets/headshot-dating.jpg', pos: '50% 12%' },
];

function headHtml(d) {
  return `<!DOCTYPE html>
<html lang="${d.htmlLang}">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-JPZWSJ3323');gtag('config','G-FKG0CPTC14');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>${esc(d.metaTitle)}</title>
<meta name="description" content="${esc(d.metaDesc)}">
<meta name="theme-color" content="#DFE0E3">
<meta property="og:title" content="${esc(d.metaTitle)}">
<meta property="og:description" content="${esc(d.metaDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${d.canonical}">
<meta property="og:locale" content="${d.locale}">
<link rel="canonical" href="${d.canonical}">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,500&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/home.css">
</head>
<body class="mk-home">`;
}

function navHtml(d, lang, prefix) {
  return `
<nav class="mk-nav">
  <div class="mk-nav-left">
    <a href="${prefix}/" class="mk-logo">
      <img src="/assets/monkos-icon.svg" alt="MONKOS" class="mk-logo-icon">
      <span class="mk-logo-text">MONKOS <i class="mk-teal">AI</i></span>
    </a>
    <div class="mk-nav-links">
      <a href="${prefix}/specs">${esc(d.navSpecs)}</a>
      <a href="${prefix}/pricing">${esc(d.navPricing)}</a>
      <a href="${prefix}/headshot">Headshot</a>
    </div>
  </div>
  <div class="mk-nav-right">
    <span class="mk-lang-sw">
      <button onclick="setLang('ko')"${lang === 'ko' ? ' class="active"' : ''}>KO</button>
      <button onclick="setLang('en')"${lang === 'en' ? ' class="active"' : ''}>EN</button>
      <button onclick="setLang('ja')"${lang === 'ja' ? ' class="active"' : ''}>JA</button>
    </span>
    <div class="mk-credit-pill" id="creditBadge" onclick="openCreditShop()">
      <span class="mk-coin"></span><span class="mk-credit-amt" id="creditCount">0</span><span class="mk-credit-label">${esc(d.credits)}</span>
    </div>
    <button class="mk-login-btn" id="headerLoginBtn" onclick="headerLogin()">${esc(d.login)}</button>
  </div>
</nav>`;
}

function heroHtml(d, idphotoUrl) {
  const chipsHtml = d.idChips.map(c => `<span class="mk-chip">${esc(c)}</span>`).join('');
  return `
<section class="mk-panel mk-hero">
  <div class="mk-hero-copy">
    <div class="mk-badge"><span class="mk-badge-dot"></span>${esc(d.badge)}</div>
    <h1 class="mk-h1">${esc(d.h1)}${d.h1Accent ? `<br><span class="mk-teal">${esc(d.h1Accent)}</span>` : ''} ${esc(d.h1Suffix)}</h1>
    <p class="mk-hero-sub">${d.heroSub}</p>
    <div class="mk-stats">
      <div class="mk-stat"><div class="mk-stat-num">${esc(d.stat1)}</div><div class="mk-stat-label">${esc(d.stat1l)}</div></div>
      <div class="mk-stat-divider"></div>
      <div class="mk-stat"><div class="mk-stat-num">${esc(d.stat2)}</div><div class="mk-stat-label">${esc(d.stat2l)}</div></div>
      <div class="mk-stat-divider"></div>
      <div class="mk-stat"><div class="mk-stat-num">${esc(d.stat3)}</div><div class="mk-stat-label">${esc(d.stat3l)}</div></div>
    </div>
  </div>
  <div class="mk-hero-visual">
    <div class="mk-acrylic-frame">
      <div class="mk-graphite mk-id-card">
        <div class="mk-id-images">
          <div class="mk-id-before"><img src="/assets/idphoto-before.jpg" alt="before"><span class="mk-id-label">BEFORE</span></div>
          <div class="mk-id-after"><img src="/assets/idphoto-after.jpg" alt="after"><span class="mk-pass-badge">PASS ✓</span><div class="mk-guide-h"></div><div class="mk-guide-v"></div></div>
        </div>
        <div class="mk-id-body">
          <div class="mk-id-header"><span class="mk-id-title">${esc(d.idTitle)}</span><span class="mk-id-tag">${esc(d.idTag)}</span></div>
          <p class="mk-id-desc">${esc(d.idDesc)}</p>
          <div class="mk-id-chips">${chipsHtml}</div>
          <div class="mk-id-footer"><a href="${idphotoUrl}" class="mk-btn-solid">${esc(d.idCta)}</a><span class="mk-id-domain">idphoto.monkos.ai</span></div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function headshotHtml(d, prefix) {
  const tiles = HEADSHOT_STYLES.map((s, i) =>
    `<div class="mk-hs-tile${i === 0 ? ' mk-hs-featured' : ''}">
      <img src="${s.img}" alt="${s.label}" style="object-position:${s.pos};">
      <div class="mk-hs-grad"></div>
      ${i === 0 ? `<span class="mk-hs-pop">${esc(d.hsPopular)}</span>` : ''}
      <span class="mk-hs-label">${esc(s.label)}</span>
    </div>`
  ).join('\n');
  return `
<section class="mk-panel mk-headshot">
  <div class="mk-hs-header">
    <div><div class="mk-eyebrow">${esc(d.hsEyebrow)}</div><div class="mk-sec-title">${esc(d.hsTitle)}</div></div>
    <p class="mk-hs-side">${d.hsSide}</p>
  </div>
  <div class="mk-graphite mk-hs-panel">
    <div class="mk-hs-panel-header">
      <div>
        <div class="mk-hs-panel-title"><span>${esc(d.hsPanelTitle)}</span><span class="mk-hs-tag">${esc(d.hsPanelTag)}</span></div>
        <p class="mk-hs-panel-desc">${d.hsPanelDesc}</p>
      </div>
      <div class="mk-hs-cta-wrap">
        <a href="${prefix}/headshot" class="mk-btn-solid">${esc(d.hsCta)}</a>
        <span class="mk-hs-cta-sub">${esc(d.hsCtaSub)}</span>
      </div>
    </div>
    <div class="mk-hs-gallery">${tiles}</div>
  </div>
</section>`;
}

function idpassHtml(d) {
  return `
<section class="mk-panel mk-idpass">
  <div class="mk-idpass-header">
    <div class="mk-idpass-icon-row">
      <img src="/assets/idpass-icon.png" alt="IDPASS" class="mk-idpass-icon">
      <div class="mk-idpass-title">${d.dlTitle}</div>
    </div>
    <p class="mk-idpass-desc">${d.dlDesc}</p>
    <div class="mk-idpass-rating">
      <span class="mk-stars">★★★★★</span><span class="mk-rating-num">4.9</span><span class="mk-rating-store">App Store</span>
      <span class="mk-rating-sep"></span>
      <span class="mk-rating-info"><b>${esc(d.dlSize)}</b> · ${esc(d.dlReq)}</span>
    </div>
    <div class="mk-idpass-dl">
      <a href="#" class="mk-appstore-badge"><span class="mk-appstore-icon"></span><span class="mk-appstore-text"><span class="mk-appstore-small">Download on the</span><span class="mk-appstore-big">App Store</span></span></a>
    </div>
  </div>
  <div class="mk-graphite mk-billboard">
    <div class="mk-bb-panel"><div class="mk-bb-copy"><div class="mk-bb-eye">${esc(d.bb1Eye)}</div><div class="mk-bb-h">${d.bb1H}</div></div><div class="mk-bb-phone"><img src="/assets/store_01.jpg" alt=""></div></div>
    <div class="mk-bb-panel"><div class="mk-bb-copy"><div class="mk-bb-eye">${esc(d.bb2Eye)}</div><div class="mk-bb-h">${d.bb2H}</div></div><div class="mk-bb-phone"><img src="/assets/store_03.jpg" alt=""></div></div>
    <div class="mk-bb-panel"><div class="mk-bb-copy"><div class="mk-bb-eye">${esc(d.bb3Eye)}</div><div class="mk-bb-h">${d.bb3H}</div></div><div class="mk-bb-phone"><img src="/assets/store_05.jpg" alt=""></div></div>
  </div>
</section>`;
}

function resourcesHtml(d, prefix, faqHtml, boardHtml, blogHtml) {
  return `
<section class="mk-panel mk-resources">
  <div class="mk-res-header">
    <div class="mk-eyebrow">${esc(d.resEyebrow)}</div>
    <div class="mk-res-title">${esc(d.resTitle)}</div>
  </div>
  <div class="mk-res-grid">
    <div class="mk-faq-list">${faqHtml}</div>
    <div class="mk-res-side">
      <div class="mk-side-card">
        <div class="mk-side-card-title">${esc(d.specsCard)}</div>
        <p class="mk-side-card-desc">${esc(d.specsDesc)}</p>
        <a href="${prefix}/specs" class="mk-btn-solid">${esc(d.specsCta)}</a>
      </div>
      <div class="mk-side-card">
        <div class="mk-board-header"><span class="mk-side-card-title">${esc(d.boardTitle)}</span><a href="${prefix}/board" class="mk-view-all">${esc(d.viewAll)}</a></div>
        ${boardHtml}
      </div>
    </div>
  </div>
  <div class="mk-blog-section">
    <div class="mk-blog-header"><span class="mk-blog-title">${esc(d.blogTitle)}</span><a href="${prefix}/blog" class="mk-view-all-dark">${esc(d.viewAll)}</a></div>
    <div class="mk-blog-grid">${blogHtml}</div>
  </div>
</section>`;
}

function footerHtml(d, prefix) {
  return `
<footer class="mk-footer">
  <div class="mk-footer-top">
    <div class="mk-footer-logo">
      <img src="/assets/monkos-icon.svg" alt="MONKOS" width="28" height="28" style="border-radius:8px;">
      <span>${d.footerPowered}</span>
    </div>
    <div class="mk-footer-links">
      <a href="${prefix}/specs">${esc(d.navSpecs)}</a>
      <a href="${prefix}/headshot">Headshot</a>
      <a href="${prefix}/terms.html">Terms</a>
      <a href="${prefix}/privacy.html">Privacy</a>
    </div>
    <div class="mk-footer-copy">© 2026 몽크사진관</div>
  </div>
  <div class="mk-footer-legal">
    <div class="mk-biz-info">
      <span><b>상호</b> 몽크사진관</span>
      <span><b>대표</b> 신정규</span>
      <span><b>사업자등록번호</b> 636-15-00574</span>
      <span><b>전화</b> 031-791-5030</span>
      <span><b>주소</b> 경기도 하남시 미사강변동로 95 (망월동) B1029</span>
      <span><b>이메일</b> info@monkos.ai</span>
    </div>
    <p class="mk-legal-note">${esc(d.footerLegal)}</p>
  </div>
</footer>`;
}

function tailHtml(lang) {
  const region = lang === 'ko' ? 'kr' : 'global';
  return `
<div class="modal-overlay" id="loginModal">
  <div class="modal-box">
    <h3 id="loginModalTitle">${lang === 'ko' ? '로그인' : lang === 'ja' ? 'ログイン' : 'Sign In'}</h3>
    <p style="text-align:center;margin:8px 0 16px;color:#00D4AA;font-weight:600;font-size:0.95rem;">
      ${lang === 'ko' ? '🎁 가입하면 첫 1컷 무료 (10c 즉시 지급)' : lang === 'ja' ? '🎁 登録で1枚無料（10c即時付与）' : '🎁 Sign up & get your first headshot FREE (10c bonus)'}
    </p>
    <div class="login-buttons">
      <button class="login-btn" onclick="googleLogin();closeLoginModal();">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.014 24.014 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-2.77c-.98.66-2.23 1.06-3.71 1.06-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        <span>Google</span>
      </button>
      ${lang === 'ko' ? '<button class="login-btn" onclick="loginKakao();closeLoginModal();" style="background:#FEE500;color:#191919;border:none;"><span>카카오</span></button>' : ''}
      ${lang === 'ja' ? '<button class="login-btn" onclick="loginLine();closeLoginModal();" style="background:#06C755;color:#fff;border:none;"><span>LINE</span></button>' : ''}
    </div>
    <button class="modal-close-btn" id="loginModalClose" onclick="closeLoginModal()">${lang === 'ko' ? '닫기' : lang === 'ja' ? '閉じる' : 'Close'}</button>
  </div>
</div>
<div class="modal-overlay" id="creditShopModal">
  <div class="modal-box"><h3 id="shopTitle">Credit Shop</h3><p id="shopCurrentLabel"></p><p id="shopCurrentCredits" style="display:none"></p><div id="shopItems"></div><button class="modal-close-btn" id="shopCloseBtn" onclick="closeCreditShop()">Close</button></div>
</div>
<script>window.__LANG__='${lang}';window.__REGION__='${region}';</script>
<script src="/js/i18n.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/credits.js"></script>
<script src="/js/main.js"></script>
<script src="/js/track.js"></script>
<script>
document.querySelectorAll('.mk-faq-item').forEach(function(el,i){
  el.addEventListener('click',function(){
    var wasOpen=el.classList.contains('open');
    document.querySelectorAll('.mk-faq-item.open').forEach(function(o){o.classList.remove('open')});
    if(!wasOpen)el.classList.add('open');
  });
  if(i===0)el.classList.add('open');
});
</script>
</body>
</html>`;
}

export async function renderHome(req, res, forceLang = null) {
  try {
    const lang = forceLang || req.lang || 'ko';
    const d = HOME_I18N[lang] || HOME_I18N.ko;
    const prefix = lang === 'ko' ? '' : `/${lang}`;
    const idphotoUrl = lang === 'ja' ? 'https://idphoto-jp.monkos.ai/' : 'https://idphoto-kr.monkos.ai/';

    const [postsSnap, faqSnap, boardSnap] = await Promise.all([
      blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
      firestore.collection('faq_items').where('published', '==', true).where('lang', '==', lang).orderBy('order', 'asc').limit(4).get().catch(() => ({ docs: [] })),
      firestore.collection('board_posts').where('published', '==', true).orderBy('createdAt', 'desc').limit(1).get().catch(() => ({ docs: [] })),
    ]);

    const allPosts = postsSnap.docs.map(doc => ({ slug: doc.id, ...doc.data() }));
    const langPosts = allPosts.filter(p => p.lang === lang && !p.autoTranslated);
    const displayPosts = (langPosts.length > 0 ? langPosts : allPosts.filter(p => !p.autoTranslated)).slice(0, 3);

    const faqItems = faqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const faqHtml = faqItems.length > 0
      ? faqItems.map(f => {
          const short = (f.answer || '').substring(0, 120) + (f.answer?.length > 120 ? '…' : '');
          return `<div class="mk-faq-item"><div class="mk-faq-q"><span>${esc(f.question)}</span><span class="mk-faq-toggle">+</span></div><div class="mk-faq-a">${esc(short)}</div></div>`;
        }).join('')
      : '';

    const boardItems = boardSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const boardHtml = boardItems.length > 0
      ? boardItems.map(b => `<div class="mk-board-row"><span class="mk-board-title">${esc(b.title)}</span><span class="mk-board-meta">${esc(b.author || '')} · ${fmtDate(b.createdAt)}</span></div>`).join('')
      : '';

    const blogHtml = displayPosts.length > 0
      ? displayPosts.map(p => {
          const mono = (p.title || '?')[0];
          const tag = p.tags?.[0] || p.category || '';
          const excerpt = (p.summary || '').substring(0, 60);
          const thumbHtml = p.thumbnail
            ? `<div class="mk-blog-thumb" style="background-image:url('${esc(p.thumbnail)}')"><span class="mk-blog-tag">${esc(tag)}</span></div>`
            : `<div class="mk-blog-thumb mk-blog-mono"><span class="mk-mono-char">${esc(mono)}</span><span class="mk-blog-tag">${esc(tag)}</span></div>`;
          return `<a href="${prefix}/blog/${esc(p.slug)}" class="mk-blog-card">${thumbHtml}<div class="mk-blog-body"><div class="mk-blog-card-title">${esc(p.title)}</div><p class="mk-blog-excerpt">${esc(excerpt)}</p><div class="mk-blog-meta">MONKOS · ${fmtDate(p.createdAt)}</div></div></a>`;
        }).join('')
      : `<p class="mk-blog-empty">${esc(d.blogEmpty)}</p>`;

    const faqJsonLd = faqItems.length > 0 ? `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": faqItems.map(f => ({ "@type": "Question", "name": f.question, "acceptedAnswer": { "@type": "Answer", "text": f.answer } })),
    })}</script>` : '';

    const html = headHtml(d)
      + faqJsonLd
      + navHtml(d, lang, prefix)
      + heroHtml(d, idphotoUrl)
      + headshotHtml(d, prefix)
      + idpassHtml(d)
      + resourcesHtml(d, prefix, faqHtml, boardHtml, blogHtml)
      + footerHtml(d, prefix)
      + tailHtml(lang);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[Home] SSR error: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// ========== Layout API ==========
export async function handleLayoutGet(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const doc = await layoutConfigRef.get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(doc.exists ? doc.data() : { sections: [] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleLayoutPut(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const body = await parseJsonBody(req);
    if (!body.sections || !Array.isArray(body.sections)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'sections 배열이 필요합니다' }));
    }
    const data = { sections: body.sections, updatedAt: new Date().toISOString() };
    await layoutConfigRef.set(data);
    log(`[Layout] Updated by ${admin.userId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ========== Settings API ==========
export async function handleSettingsGet(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const doc = await siteConfigRef.get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(doc.exists ? doc.data() : {}));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleSettingsPut(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const body = await parseJsonBody(req);
    const updates = { updatedAt: new Date().toISOString() };
    if (body.intro !== undefined) updates.intro = body.intro;
    await siteConfigRef.set(updates, { merge: true });
    log(`[Settings] Updated by ${admin.userId}`);
    const doc = await siteConfigRef.get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(doc.data()));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
