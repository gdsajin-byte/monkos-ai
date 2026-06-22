/**
 * CMS SSR — 가격 페이지
 */
import { escapeHtml, layoutHead, layoutNav, layoutFooter } from './render-shell.js';
import { log } from '../shared/config.js';

const PRICING_DATA = {
  ko: {
    currency: '₩', currencyPrefix: true,
    title: '가격 안내', subtitle: 'MONKOS AI 서비스 이용 크레딧 가격표',
    svcTitle: '서비스별 크레딧 소모량',
    svcHeader: ['서비스', '소모 크레딧', '비고'],
    services: [
      { name: 'AI 리터칭 (생성)', credit: '10c', note: '셀카 1장 → AI 보정' },
      { name: '고화질 다운로드', credit: '70c', note: '인화/제출용 원본' },
      { name: 'AI 증명사진 1장 완성', credit: '80c', note: '리터칭 + 다운로드', bold: true },
      { name: '무료 크롭앱', credit: '0c', note: '규격 크롭 · 배경 제거', link: '/crop' },
    ],
    packTitle: '크레딧 팩',
    packs: [
      { credits: 70, bonus: 10, price: '₩9,900', unit: '1c ≈ ₩124', badge: '추천' },
      { credits: 100, bonus: 30, price: '₩12,900', unit: '1c ≈ ₩99' },
      { credits: 300, bonus: 120, price: '₩34,900', unit: '1c ≈ ₩83', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '₩49,900', unit: '1c ≈ ₩67' },
    ],
    cta: '크레딧 충전하기',
    creditLabel: '크레딧',
    bonusLabel: '보너스 포함',
    infoTitle: '안내',
    infoItems: [
      '첫 회원가입 시 10c 보너스 증정 (AI 리터칭 1회 체험)',
      '충전한 크레딧은 MONKOS 전 서비스에서 사용 가능',
      '부가세 포함 가격',
    ],
    refundNote: '환불 정책은 <a href="/refund">여기</a>를 확인하세요',
  },
  ja: {
    currency: '¥', currencyPrefix: true,
    title: '料金案内', subtitle: 'MONKOS AIサービス利用クレジット価格表',
    svcTitle: 'サービス別クレジット消費量',
    svcHeader: ['サービス', '消費クレジット', '備考'],
    services: [
      { name: 'AIリタッチ（生成）', credit: '10c', note: 'セルフィー1枚 → AI補正' },
      { name: '高画質ダウンロード', credit: '70c', note: '印刷/提出用原本' },
      { name: 'AI証明写真 1枚完成', credit: '80c', note: 'リタッチ + ダウンロード', bold: true },
      { name: '無料クロップアプリ', credit: '0c', note: '規格クロップ・背景除去', link: '/crop' },
    ],
    packTitle: 'クレジットパック',
    packs: [
      { credits: 70, bonus: 10, price: '¥990', unit: '1c ≈ ¥12', badge: 'おすすめ' },
      { credits: 100, bonus: 30, price: '¥1,490', unit: '1c ≈ ¥11' },
      { credits: 300, bonus: 120, price: '¥3,990', unit: '1c ≈ ¥10', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '¥5,990', unit: '1c ≈ ¥8' },
    ],
    cta: 'クレジットをチャージ',
    creditLabel: 'クレジット',
    bonusLabel: 'ボーナス含む',
    infoTitle: 'ご案内',
    infoItems: [
      '初回登録時 10cボーナス進呈（AIリタッチ1回体験）',
      'チャージしたクレジットはMONKOS全サービスで使用可能',
      '税込価格',
    ],
    refundNote: '返金ポリシーは<a href="/refund">こちら</a>をご確認ください',
  },
  en: {
    currency: '$', currencyPrefix: true,
    title: 'Pricing', subtitle: 'MONKOS AI service credit pricing',
    svcTitle: 'Credit Cost per Service',
    svcHeader: ['Service', 'Credits', 'Note'],
    services: [
      { name: 'AI Retouch (Generate)', credit: '10c', note: '1 selfie → AI enhancement' },
      { name: 'HD Download', credit: '70c', note: 'Print/submission quality' },
      { name: 'AI ID Photo (Complete)', credit: '80c', note: 'Retouch + Download', bold: true },
      { name: 'Free Crop App', credit: '0c', note: 'Spec crop & BG removal', link: '/crop' },
    ],
    packTitle: 'Credit Packs',
    packs: [
      { credits: 70, bonus: 10, price: '$6.90', unit: '1c ≈ $0.09', badge: 'Recommended' },
      { credits: 100, bonus: 30, price: '$9.90', unit: '1c ≈ $0.08' },
      { credits: 300, bonus: 120, price: '$26.90', unit: '1c ≈ $0.06', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '$39.90', unit: '1c ≈ $0.05' },
    ],
    cta: 'Buy Credits',
    creditLabel: 'Credits',
    bonusLabel: 'bonus included',
    infoTitle: 'Info',
    infoItems: [
      '+10c bonus on first sign-up (1 free AI retouch)',
      'Credits can be used across all MONKOS services',
      'Prices include tax',
    ],
    refundNote: 'See our <a href="/refund">refund policy</a> for details',
  },
};

export function pricingFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const d = PRICING_DATA[lang] || PRICING_DATA.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const canonicalUrl = `https://monkos.ai${prefix}/pricing`;

  const seoMeta = `<meta property="og:title" content="${escapeHtml(d.title)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(d.subtitle)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/pricing">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/pricing">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/pricing">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/pricing">`;

  // 서비스 테이블
  const svcRows = d.services.map(s => {
    const nameHtml = s.bold ? `<strong>${escapeHtml(s.name)}</strong>` : escapeHtml(s.name);
    const creditHtml = s.bold ? `<strong>${escapeHtml(s.credit)}</strong>` : escapeHtml(s.credit);
    const noteHtml = s.link ? `<a href="${s.link}">${escapeHtml(s.note)}</a>` : escapeHtml(s.note);
    return `<tr><td>${nameHtml}</td><td class="accent">${creditHtml}</td><td>${noteHtml}</td></tr>`;
  }).join('\n        ');

  // 크레딧 팩 카드
  const packCards = d.packs.map(p => {
    const badgeHtml = p.badge
      ? `<span class="pack-badge${p.badgeBest ? ' best' : ''}">${escapeHtml(p.badge)}</span>`
      : '';
    return `<div class="pack-card">
        ${badgeHtml}
        <div class="pack-left">
          <span class="pack-name">${p.credits} ${escapeHtml(d.creditLabel)}</span>
          <span class="pack-bonus">+${p.bonus}c ${escapeHtml(d.bonusLabel)}</span>
        </div>
        <div class="pack-right">
          <div class="pack-price">${escapeHtml(p.price)}</div>
          <div class="pack-unit">${escapeHtml(p.unit)}</div>
        </div>
      </div>`;
  }).join('\n      ');

  // 안내 항목
  const infoLis = d.infoItems.map(i => `<li>${escapeHtml(i)}</li>`).join('\n      ');

  const pageStyle = `
.container { max-width: 800px; }
.page-header { text-align: center; margin-bottom: 40px; }
.page-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.page-header p { color: var(--text-dim); font-size: 15px; }
.cost-section { margin-bottom: 40px; }
.cost-section h2 {
  font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.cost-table {
  width: 100%; border-collapse: collapse;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
}
.cost-table th, .cost-table td { padding: 14px 20px; text-align: left; font-size: 14px; }
.cost-table thead th {
  background: var(--surface2); font-weight: 600; color: var(--text-bright); font-size: 13px;
}
.cost-table tbody tr { border-top: 1px solid var(--border); }
.cost-table tbody tr:hover { background: rgba(108, 79, 255, 0.03); }
.cost-table .accent { color: var(--accent); font-weight: 600; }
.pack-grid { display: flex; flex-direction: column; gap: 10px; }
.pack-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px;
  background: var(--card-bg); border: 1.5px solid var(--border); border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s; position: relative;
}
.pack-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(108,79,255,0.08); }
.pack-left { display: flex; flex-direction: column; gap: 2px; }
.pack-name { font-size: 16px; font-weight: 600; color: var(--text-bright); }
.pack-bonus { font-size: 13px; color: var(--success); }
.pack-right { text-align: right; }
.pack-price { font-size: 18px; font-weight: 700; color: var(--accent); }
.pack-unit { font-size: 12px; color: var(--text-dim); margin-top: 2px; }
.pack-badge {
  position: absolute; top: -8px; right: 16px;
  background: var(--accent); color: #fff; font-size: 11px; font-weight: 700;
  padding: 2px 10px; border-radius: 8px;
}
.pack-badge.best { background: #f59e0b; }
.cta-area { text-align: center; margin-top: 40px; }
.cta-btn {
  display: inline-block; padding: 16px 48px;
  background: var(--accent); color: #fff;
  border-radius: 12px; font-size: 16px; font-weight: 700;
  transition: opacity 0.2s; text-decoration: none;
}
.cta-btn:hover { opacity: 0.9; color: #fff; }
.info-note {
  margin-top: 32px; padding: 20px 24px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
}
.info-note h3 { font-size: 14px; font-weight: 600; color: var(--text-bright); margin-bottom: 8px; }
.info-note li { font-size: 13px; color: var(--text-dim); margin-bottom: 4px; list-style: none; }
.info-note li::before { content: "· "; color: var(--accent); }
@media (max-width: 600px) {
  .pack-card { padding: 14px 16px; }
  .pack-name { font-size: 14px; }
  .pack-price { font-size: 16px; }
  .header-nav { display: none; }
}`;

  const bodyContent = `
  <div class="page-header">
    <h1>${escapeHtml(d.title)}</h1>
    <p>${escapeHtml(d.subtitle)}</p>
  </div>

  <div class="cost-section">
    <h2>${escapeHtml(d.svcTitle)}</h2>
    <table class="cost-table">
      <thead><tr>${d.svcHeader.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${svcRows}
      </tbody>
    </table>
  </div>

  <div class="cost-section">
    <h2>${escapeHtml(d.packTitle)}</h2>
    <div class="pack-grid">
      ${packCards}
    </div>
  </div>

  <div class="cta-area">
    <a href="/credits" class="cta-btn">${escapeHtml(d.cta)}</a>
  </div>

  <div class="info-note">
    <h3>${escapeHtml(d.infoTitle)}</h3>
    <ul>
      ${infoLis}
      <li>${d.refundNote}</li>
    </ul>
  </div>`;

  return {
    title: `${d.title} | MONKOS AI`,
    description: d.subtitle,
    seoMeta,
    htmlLang: lang,
    pageStyle,
    bodyContent,
    pageScript: null,
  };
}

// GET /pricing — 가격 페이지 SSR (KR/JP/EN)
export function renderPricing(req, res, forceLang = null) {
  try {
    const parts = pricingFragment(forceLang);
    const html = `${layoutHead(parts.title, parts.description, parts.seoMeta || '', parts.htmlLang || 'ko')}
${parts.pageStyle ? `<style>${parts.pageStyle}</style>` : ''}
</head>
<body>
${layoutNav(parts.htmlLang || 'ko')}
<div class="container" style="max-width:800px;">
  ${parts.bodyContent}
</div>
${layoutFooter(parts.htmlLang || 'ko')}
<script>window.__LANG__='${parts.htmlLang || 'ko'}';window.__REGION__='${req.paymentRegion || (parts.htmlLang === 'ko' ? 'kr' : 'global')}';</script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Pricing 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
