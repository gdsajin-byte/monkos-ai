/**
 * CMS SSR — 증명사진 규격 허브 + 상세
 */
import { createRequire } from 'module';
import { escapeHtml, layoutShell } from './render-shell.js';
import { log } from '../shared/config.js';

const _require = createRequire(import.meta.url);
export const SPECS_DATA = _require('./specs-data.json');

const SPECS_I18N = {
  ko: {
    hubTitle: '증명사진 규격 가이드 — 국가별·용도별 사이즈 총정리 | MONKOS',
    hubDesc: '한국 여권·반명함, 일본 패스포트·이력서, 미국 비자 등 증명사진 규격을 한눈에. 사이즈·배경·복장 기준과 반려 사유까지.',
    hubH1: '증명사진 규격 가이드',
    hubSub: '국가별·용도별 사이즈, 배경, 복장 기준과 반려 사유까지 한눈에 확인하세요.',
    detailSuffix: '규격 — 사이즈·배경·복장 완벽 가이드 | MONKOS',
    tableHeaders: { size: '사이즈', pixels: '해상도', dpi: 'DPI', background: '배경', headHeight: '머리 높이', validity: '유효기간', fileSpec: '파일 규격' },
    detailsTitle: '상세 규정',
    rejectionTitle: '반려 사유 TOP 5',
    faqTitle: '자주 묻는 질문',
    ctaAI: 'AI로 촬영하기 →',
    ctaCrop: '무료 크롭앱 →',
    relatedTitle: '관련 콘텐츠',
    relatedLinks: [
      { label: '사용 가이드', href: '/guide' },
      { label: '무료 크롭앱', href: '/crop' },
      { label: 'FAQ', href: '/faq' },
    ],
    sameCountryLabel: '같은 국가 다른 규격',
    specLabel: '규격 보기',
    heroGlobal: '🌐 GLOBAL PHOTO SPEC GUIDE',
    heroTitle: '증명사진 규격 가이드',
    heroSub: '전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보 제공 및 규격 맞춤 서비스.',
    statCountries: '국가', statSpecs: '규격', statVerified: '공식 검증',
    hubFooter: '© 2026 MONKOS · 규격 정보는 공식 출처 기반 검증. 최종 규정은 발급 기관 확인.',
    freeCropCta: '무료 AI 크롭 →',
    searchPlaceholder: '국가명 검색...',
    selectCountry: '국가를 선택하세요',
    selectSpec: '규격을 선택하세요',
  },
  ja: {
    hubTitle: '証明写真 規格ガイド — 国別・用途別サイズ総まとめ | MONKOS',
    hubDesc: '韓国パスポート・半名刺、日本パスポート・履歴書、米国ビザなど証明写真規格を一覧で。サイズ・背景・服装基準と却下理由まで。',
    hubH1: '証明写真 規格ガイド',
    hubSub: '国別・用途別のサイズ、背景、服装基準と却下理由をまとめて確認できます。',
    detailSuffix: '規格 — サイズ・背景・服装 完全ガイド | MONKOS',
    tableHeaders: { size: 'サイズ', pixels: '解像度', dpi: 'DPI', background: '背景', headHeight: '頭の高さ', validity: '有効期限', fileSpec: 'ファイル規格' },
    detailsTitle: '詳細規定',
    rejectionTitle: '却下理由 TOP 5',
    faqTitle: 'よくある質問',
    ctaAI: 'AIで撮影する →',
    ctaCrop: '無料クロップアプリ →',
    relatedTitle: '関連コンテンツ',
    relatedLinks: [
      { label: 'ご利用ガイド', href: '/guide' },
      { label: '無料クロップアプリ', href: '/crop' },
      { label: 'FAQ', href: '/ja/faq' },
    ],
    sameCountryLabel: '同じ国の別の規格',
    specLabel: '規格を見る',
    heroGlobal: '🌐 GLOBAL PHOTO SPEC GUIDE',
    heroTitle: '証明写真 規格ガイド',
    heroSub: '世界200カ国以上のパスポート・ビザなど証明写真規格情報と規格合わせサービス。',
    statCountries: 'カ国', statSpecs: '規格', statVerified: '公式検証',
    hubFooter: '© 2026 MONKOS · 規格情報は公式ソースに基づく検証済み。最終規定は発行機関にご確認ください。',
    freeCropCta: '無料AIクロップ →',
    searchPlaceholder: '国名で検索...',
    selectCountry: '国を選択',
    selectSpec: '規格を選択',
  },
  en: {
    hubTitle: 'ID Photo Specifications Guide — Size & Requirements by Country | MONKOS',
    hubDesc: 'Korea passport & resume, Japan passport & resume, US visa photo specs at a glance. Size, background, dress code and rejection reasons.',
    hubH1: 'ID Photo Specifications Guide',
    hubSub: 'Size, background, dress code standards and rejection reasons by country and purpose.',
    detailSuffix: 'Specs — Size, Background & Dress Code Complete Guide | MONKOS',
    tableHeaders: { size: 'Size', pixels: 'Resolution', dpi: 'DPI', background: 'Background', headHeight: 'Head Height', validity: 'Validity', fileSpec: 'File Spec' },
    detailsTitle: 'Detailed Requirements',
    rejectionTitle: 'Top 5 Rejection Reasons',
    faqTitle: 'Frequently Asked Questions',
    ctaAI: 'Take with AI →',
    ctaCrop: 'Free Crop App →',
    relatedTitle: 'Related Content',
    relatedLinks: [
      { label: 'User Guide', href: '/guide' },
      { label: 'Free Crop App', href: '/crop' },
      { label: 'FAQ', href: '/en/faq' },
    ],
    sameCountryLabel: 'Other specs for the same country',
    specLabel: 'View specs',
    heroGlobal: '🌐 GLOBAL PHOTO SPEC GUIDE',
    heroTitle: 'Photo Spec Guide',
    heroSub: 'ID photo specifications for 200+ countries — passport, visa, and more. Free crop service included.',
    statCountries: 'Countries', statSpecs: 'Specs', statVerified: 'Verified',
    hubFooter: '© 2026 MONKOS · Specifications verified from official sources. Confirm final requirements with the issuing authority.',
    freeCropCta: 'Free AI Crop →',
    searchPlaceholder: 'Search country...',
    selectCountry: 'Select a country',
    selectSpec: 'Select a specification',
  },
};

const CONTINENT_META = [
  { id: 'asia', ko: '아시아', ja: 'アジア', en: 'Asia', gradient: 'linear-gradient(135deg, #1A3A2A, #2D5A3A)', dot: '#00D4AA', countries: ['한국', '日本', 'Korea', 'Japan'], countryCount: 48 },
  { id: 'europe', ko: '유럽', ja: 'ヨーロッパ', en: 'Europe', gradient: 'linear-gradient(135deg, #1A1A3A, #3A2A5A)', dot: '#A78BFA', countries: ['유럽', 'Europe'], countryCount: 44 },
  { id: 'americas', ko: '아메리카', ja: 'アメリカ', en: 'Americas', gradient: 'linear-gradient(135deg, #1A2A3A, #2A3A5A)', dot: '#3B82F6', countries: ['USA'], countryCount: 35 },
  { id: 'africa', ko: '아프리카', ja: 'アフリカ', en: 'Africa', gradient: 'linear-gradient(135deg, #3A2A1A, #5A3A1A)', dot: '#FFB020', countries: [], countryCount: 54 },
  { id: 'oceania', ko: '오세아니아', ja: 'オセアニア', en: 'Oceania', gradient: 'linear-gradient(135deg, #1A2A2A, #1A3A4A)', dot: '#FF6B9D', countries: [], countryCount: 14 },
  { id: 'middleeast', ko: '중동', ja: '中東', en: 'Middle East', gradient: 'linear-gradient(135deg, #2A2A1A, #4A3A1A)', dot: '#F59E0B', countries: [], countryCount: 17 },
];

const SPEC_CONTINENT_MAP = {
  'korea-passport': 'asia', 'korea-resume': 'asia', 'korea-drivers-license': 'asia',
  'korea-halfcard': 'asia', 'korea-resident': 'asia',
  'japan-passport': 'asia', 'japan-resume': 'asia', 'japan-mynumber': 'asia',
  'japan-halfcard': 'asia', 'japan-zairyu': 'asia',
  'singapore-passport': 'asia', 'thailand-passport': 'asia',
  'india-passport': 'asia', 'china-passport': 'asia', 'china-resume': 'asia',
  'vietnam-passport': 'asia', 'indonesia-passport': 'asia',
  'us-passport': 'americas', 'usa-headshot': 'americas', 'canada-passport': 'americas',
  'eu-passport': 'europe', 'spain-passport': 'europe', 'germany-resume': 'europe',
  'eu-resume': 'europe', 'uk-passport': 'europe',
  'australia-passport': 'oceania',
};

// specs 공통 스타일
const SPECS_PAGE_STYLE = `
/* === Hub (목록) === */
.specs-hub-header { text-align: center; margin-bottom: 40px; }
.specs-hub-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.specs-hub-header p { color: var(--text-dim); font-size: 15px; }
.specs-country-group { margin-bottom: 36px; }
.specs-country-group h2 {
  font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.specs-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
}
.specs-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 24px 20px; transition: border-color 0.2s, box-shadow 0.2s;
  text-decoration: none; display: block; color: inherit;
}
.specs-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(108,79,255,0.08); }
.specs-card-type { font-size: 17px; font-weight: 600; color: var(--text-bright); margin-bottom: 6px; }
.specs-card-size { font-size: 14px; color: var(--accent); font-weight: 500; margin-bottom: 4px; }
.specs-card-desc { font-size: 13px; color: var(--text-dim); line-height: 1.5; }

/* === Hub Hero === */
.specs-hub-hero { text-align: center; margin-bottom: 40px; padding: 40px 20px; }
.specs-hub-hero .hero-global { font-size: 13px; letter-spacing: 2px; color: var(--accent, #6c4fff); font-weight: 600; margin-bottom: 12px; }
.specs-hub-hero h1 { font-size: 32px; font-weight: 800; color: var(--text-bright, #111); margin-bottom: 12px; }
.specs-hub-hero .hero-sub { font-size: 15px; color: var(--text-dim, #6b7280); line-height: 1.7; max-width: 560px; margin: 0 auto 24px; }
.specs-hub-stats { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; }
.specs-hub-stat { text-align: center; }
.specs-hub-stat .stat-num { font-size: 28px; font-weight: 800; color: var(--accent, #6c4fff); }
.specs-hub-stat .stat-label { font-size: 13px; color: var(--text-dim, #6b7280); margin-top: 2px; }

/* === Hub Router (Search + Dropdowns) === */
.specs-router { max-width: 600px; margin: 0 auto 40px; }
.specs-search-wrap { position: relative; margin-bottom: 20px; }
.specs-search-wrap input {
  width: 100%; padding: 14px 20px 14px 44px; font-size: 16px; border: 2px solid var(--border, #e5e7eb);
  border-radius: 12px; background: var(--card-bg, #fff); color: var(--text-bright, #111);
  outline: none; transition: border-color 0.2s; box-sizing: border-box;
}
.specs-search-wrap input:focus { border-color: var(--accent, #6c4fff); }
.specs-search-wrap::before {
  content: '\\1F50D'; position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  font-size: 16px; pointer-events: none;
}
.specs-search-results {
  position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e5e7eb); border-radius: 10px; margin-top: 4px;
  max-height: 240px; overflow-y: auto; z-index: 10; display: none; box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
.specs-search-results.show { display: block; }
.specs-search-item {
  padding: 12px 16px; cursor: pointer; font-size: 14px; color: var(--text, #333);
  border-bottom: 1px solid var(--border, #f0f0f0);
}
.specs-search-item:hover { background: rgba(108,79,255,0.06); }
.specs-search-item:last-child { border-bottom: none; }
.specs-dropdowns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.specs-dropdowns select {
  width: 100%; padding: 14px 16px; font-size: 16px; border: 2px solid var(--border, #e5e7eb);
  border-radius: 12px; background: var(--card-bg, #fff); color: var(--text-bright, #111);
  outline: none; cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 16px center;
}
.specs-dropdowns select:focus { border-color: var(--accent, #6c4fff); }
.specs-dropdowns select:disabled { opacity: 0.5; cursor: not-allowed; }

/* === Hub Footer === */
.specs-hub-footer { text-align: center; padding: 24px 0; margin-top: 32px; font-size: 12px; color: var(--text-dim, #9ca3af); border-top: 1px solid var(--border, #e5e7eb); }
.specs-hub-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.specs-hub-topbar .hub-brand { font-size: 18px; font-weight: 800; color: var(--text-bright, #111); letter-spacing: 1px; }
.specs-hub-topbar .hub-cta { font-size: 13px; color: var(--accent, #6c4fff); text-decoration: none; font-weight: 600; }
.specs-hub-topbar .hub-cta:hover { text-decoration: underline; }

/* === Detail 공통 === */
.specs-back { display: inline-block; margin-bottom: 20px; font-size: 13px; color: var(--accent); text-decoration: none; }
.specs-back:hover { text-decoration: underline; }

/* === Hero 2열 레이아웃 === */
.specs-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 40px; }
.specs-hero-text h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); line-height: 1.3; margin-bottom: 12px; }
.specs-hero-text .specs-hero-desc { color: var(--text-dim); font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
.specs-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.specs-hero-tags span {
  background: rgba(108,79,255,0.08); color: var(--accent); padding: 4px 12px;
  border-radius: 20px; font-size: 13px; font-weight: 500;
}

/* 규격 다이어그램 */
.specs-diagram {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px;
  padding: 32px; display: flex; justify-content: center; align-items: center; position: relative;
}
.specs-photo-frame {
  width: 175px; height: 225px; background: var(--surface2, #f9fafb);
  border: 2px dashed var(--accent); border-radius: 4px; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.specs-photo-frame svg { opacity: 0.15; }
.specs-guide-w {
  position: absolute; bottom: -28px; left: 0; right: 0; text-align: center;
  font-size: 12px; color: var(--accent); font-weight: 600;
}
.specs-guide-h {
  position: absolute; top: 0; bottom: 0; right: -50px;
  display: flex; align-items: center; font-size: 12px; color: var(--accent); font-weight: 600;
  writing-mode: vertical-rl;
}
.specs-guide-h::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: -8px; width: 1px; background: var(--accent);
}
.specs-head-guide {
  position: absolute; top: 20px; left: -45px; height: 144px;
  display: flex; align-items: center; font-size: 11px; color: #ef4444; font-weight: 500;
  writing-mode: vertical-rl;
}
.specs-head-guide::before {
  content: ''; position: absolute; top: 0; bottom: 0; right: -6px; width: 1px;
  background: #ef4444; opacity: 0.5;
}

/* === 테이블 === */
.specs-table {
  width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
}
.specs-table th, .specs-table td { padding: 10px 14px; text-align: left; font-size: 14px; }
.specs-table th {
  background: var(--surface2); font-weight: 600; color: var(--text-bright); width: 110px; font-size: 13px;
  border-right: 1px solid var(--border);
}
.specs-table td { color: var(--text); }
.specs-table tr:not(:last-child) th,
.specs-table tr:not(:last-child) td { border-bottom: 1px solid var(--border); }

/* === 상세 규정 그리드 === */
.specs-section { margin-bottom: 32px; }
.specs-section h2 {
  font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 16px;
}
.specs-section p { font-size: 14px; color: var(--text); line-height: 1.8; }
.specs-details-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.specs-detail-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px;
  background: var(--surface2, #f8f9fc); border-radius: 8px; font-size: 14px; color: var(--text);
}
.specs-detail-item .sdi-icon { flex-shrink: 0; font-size: 16px; width: 24px; text-align: center; }

/* === O/X 비교 카드 === */
.specs-ox-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.specs-ox-card {
  background: var(--card-bg); border-radius: 12px; overflow: hidden; border: 2px solid var(--border);
}
.specs-ox-card.ox-good { border-color: #22c55e; }
.specs-ox-card.ox-bad { border-color: #ef4444; }
.specs-ox-header { padding: 10px 16px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.specs-ox-card.ox-good .specs-ox-header { background: rgba(34,197,94,0.08); color: #166534; }
.specs-ox-card.ox-bad .specs-ox-header { background: rgba(239,68,68,0.08); color: #991b1b; }
.specs-ox-body {
  padding: 20px; display: flex; justify-content: center; align-items: center;
  background: var(--surface2, #fafafa); min-height: 180px;
}
.specs-ox-photo {
  width: 120px; height: 154px; background: var(--card-bg); border: 2px dashed #ddd;
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
}
.specs-ox-card.ox-good .specs-ox-photo { border-color: #22c55e; }
.specs-ox-card.ox-bad .specs-ox-photo { border-color: #ef4444; }
.specs-ox-photo svg { opacity: 0.3; }
.specs-ox-caption { margin-top: 10px; font-size: 12px; color: var(--text-dim); text-align: center; }
.specs-ox-points { padding: 12px 16px; border-top: 1px solid var(--border); list-style: none; margin: 0; }
.specs-ox-points li {
  font-size: 13px; color: var(--text-dim); padding: 3px 0; display: flex; align-items: center; gap: 6px;
}

/* === 반려 사유 2열 카드 === */
.specs-rejection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; list-style: none; padding: 0; }
.specs-rejection-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; display: flex; gap: 14px; align-items: flex-start;
  transition: box-shadow 0.2s;
}
.specs-rejection-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.specs-rj-badge {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #ef4444; color: #fff; font-weight: 700; font-size: 14px;
}
.specs-rj-info h4 { font-size: 14px; font-weight: 600; color: var(--text-bright); margin: 0 0 4px 0; }
.specs-rj-info p { font-size: 13px; color: var(--text-dim); margin: 0; line-height: 1.5; }

/* === FAQ 아코디언 === */
.specs-faq { list-style: none; padding: 0; }
.specs-faq-item {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px;
  margin-bottom: 8px; overflow: hidden;
}
.specs-faq-q {
  padding: 16px 20px; font-weight: 600; font-size: 15px; color: var(--text-bright);
  cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none;
}
.specs-faq-q::before { content: "Q"; color: var(--accent); font-weight: 700; font-size: 14px; }
.specs-faq-q::after {
  content: "\\25BE"; margin-left: auto; color: var(--text-dim); font-size: 12px;
  transition: transform 0.2s;
}
.specs-faq-item.open .specs-faq-q::after { transform: rotate(180deg); }
.specs-faq-a {
  padding: 0 20px 16px 46px; font-size: 14px; color: var(--text-dim);
  line-height: 1.7; display: none;
}
.specs-faq-item.open .specs-faq-a { display: block; }

/* === CTA 배너 === */
.specs-cta {
  background: linear-gradient(135deg, var(--accent) 0%, #8b6fff 100%);
  border-radius: 16px; padding: 36px 40px;
  display: flex; align-items: center; justify-content: space-between;
  margin: 32px 0;
}
.specs-cta-text h3 { color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 4px 0; }
.specs-cta-text p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
.specs-cta-buttons { display: flex; gap: 12px; }
.specs-cta-buttons a {
  padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
  text-decoration: none; transition: all 0.2s;
}
.specs-cta-buttons .primary { background: #fff; color: var(--accent); }
.specs-cta-buttons .primary:hover { background: #f0f0ff; color: var(--accent); }
.specs-cta-buttons .secondary {
  background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3);
}

/* === 관련 콘텐츠 === */
.specs-related {
  margin-top: 32px; padding: 20px 24px;
  background: var(--surface, var(--card-bg)); border: 1px solid var(--border); border-radius: 12px;
}
.specs-related h3 { font-size: 15px; font-weight: 600; color: var(--text-bright); margin-bottom: 12px; }
.specs-related-links { display: flex; flex-wrap: wrap; gap: 10px; }
.specs-related-links a {
  font-size: 13px; color: var(--accent); text-decoration: none; padding: 6px 14px;
  background: rgba(108,79,255,0.06); border-radius: 8px; transition: all 0.2s;
  border: 1px solid transparent;
}
.specs-related-links a:hover { background: rgba(108,79,255,0.12); border-color: var(--accent); }

/* === 반응형 === */
@media (max-width: 768px) {
  .specs-hero { grid-template-columns: 1fr; }
  .specs-diagram { order: -1; }
  .specs-details-grid { grid-template-columns: 1fr; }
  .specs-ox-compare { grid-template-columns: 1fr; }
  .specs-rejection-grid { grid-template-columns: 1fr; }
  .specs-cta { flex-direction: column; text-align: center; gap: 20px; }
  .specs-dropdowns { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .specs-grid { grid-template-columns: 1fr; }
  .specs-table th { width: 100px; }
}`;

function parseSizeMm(sizeStr) {
  if (!sizeStr) return null;
  const mmMatch = sizeStr.match(/(\d+)\s*[×x]\s*(\d+)\s*mm/i);
  if (mmMatch) return `${mmMatch[1]}x${mmMatch[2]}`;
  const cmMatch = sizeStr.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*cm/i);
  if (cmMatch) return `${Math.round(parseFloat(cmMatch[1]) * 10)}x${Math.round(parseFloat(cmMatch[2]) * 10)}`;
  const inchMm = sizeStr.match(/inch[^(]*\((\d+)\s*[×x]\s*(\d+)\s*mm\)/i);
  if (inchMm) return `${inchMm[1]}x${inchMm[2]}`;
  return null;
}

// 규격 허브 인덱스 (/specs)
// locale별 필드 선택 (pixelsEn, backgroundJa 등 존재 시 우선)
function locField(spec, field, lang) {
  if (lang === 'en' && spec[field + 'En']) return spec[field + 'En'];
  if (lang === 'ja' && spec[field + 'Ja']) return spec[field + 'Ja'];
  return spec[field];
}

export function specsListFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;

  const sortedSpecs = Object.values(SPECS_DATA).sort((a, b) => a.priority - b.priority);

  // ItemList JSON-LD
  const itemListJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": i.hubH1,
    "itemListElement": sortedSpecs.map((spec, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://monkos.ai${prefix}/specs/${spec.slug}`,
      "name": lang === 'ja' ? (spec.typeJa || spec.type) : (lang === 'en' ? spec.typeEn : spec.type),
    })),
  });

  const canonicalUrl = lang === 'ko' ? 'https://monkos.ai/specs' : `https://monkos.ai/${lang}/specs`;
  const hreflangTags = [
    '<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs">',
    '<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs">',
    '<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs">',
    '<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs">',
  ].join('\n');

  const seoMeta = `<meta property="og:title" content="${escapeHtml(i.hubH1)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(i.hubDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${itemListJsonLd}</script>`;

  // --- 국가별 대륙 그룹핑 (드롭다운 optgroup용) ---
  const continentGroups = {};
  for (const spec of sortedSpecs) {
    const cid = SPEC_CONTINENT_MAP[spec.slug] || 'other';
    if (!continentGroups[cid]) continentGroups[cid] = {};
    const countryKey = lang === 'en' ? spec.countryEn : spec.country;
    if (!continentGroups[cid][countryKey]) continentGroups[cid][countryKey] = [];
    continentGroups[cid][countryKey].push(spec);
  }

  const continentOrder = ['asia', 'europe', 'americas', 'oceania', 'middleeast', 'africa', 'other'];
  const countryOptionsHtml = continentOrder.filter(cid => continentGroups[cid]).map(cid => {
    const meta = CONTINENT_META.find(c => c.id === cid);
    const label = meta ? (meta[lang] || meta.en) : (lang === 'ja' ? 'その他' : lang === 'en' ? 'Other' : '기타');
    const countries = Object.keys(continentGroups[cid]);
    const opts = countries.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    return `<optgroup label="${escapeHtml(label)}">${opts}</optgroup>`;
  }).join('');

  const specsDataJson = JSON.stringify(
    sortedSpecs.map(s => ({
      slug: s.slug,
      country: lang === 'en' ? s.countryEn : s.country,
      type: lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type),
      size: locField(s, 'size', lang),
    }))
  );

  const bodyContent = `
  <div class="specs-hub-topbar">
    <span class="hub-brand">MONKOS GUIDE</span>
    <a href="${prefix}/crop" class="hub-cta">${escapeHtml(i.freeCropCta)}</a>
  </div>

  <div class="specs-hub-hero">
    <div class="hero-global">${i.heroGlobal}</div>
    <h1>${escapeHtml(i.heroTitle)}</h1>
    <p class="hero-sub">${escapeHtml(i.heroSub)}</p>
    <div class="specs-hub-stats">
      <div class="specs-hub-stat"><div class="stat-num">200+</div><div class="stat-label">${escapeHtml(i.statCountries)}</div></div>
      <div class="specs-hub-stat"><div class="stat-num">500+</div><div class="stat-label">${escapeHtml(i.statSpecs)}</div></div>
      <div class="specs-hub-stat"><div class="stat-num">35+</div><div class="stat-label">${escapeHtml(i.statVerified)}</div></div>
    </div>
  </div>

  <div class="specs-router">
    <div class="specs-search-wrap">
      <input type="search" id="country-search" placeholder="${escapeHtml(i.searchPlaceholder)}" autocomplete="off">
      <div class="specs-search-results" id="search-results"></div>
    </div>
    <div class="specs-dropdowns">
      <select id="country-select">
        <option value="" disabled selected>${escapeHtml(i.selectCountry)}</option>
        ${countryOptionsHtml}
      </select>
      <select id="spec-select" disabled>
        <option value="" disabled selected>${escapeHtml(i.selectSpec)}</option>
      </select>
    </div>
  </div>

  <div class="specs-hub-footer">${i.hubFooter}</div>`;

  const pageScript = `
  (function(){
    var prefix = '${prefix}';
    var specsData = ${specsDataJson};
    var countrySelect = document.getElementById('country-select');
    var specSelect = document.getElementById('spec-select');
    var searchInput = document.getElementById('country-search');
    var searchResults = document.getElementById('search-results');

    var countries = [];
    for (var j = 0; j < countrySelect.options.length; j++) {
      if (countrySelect.options[j].value) countries.push(countrySelect.options[j].value);
    }

    searchInput.addEventListener('input', function() {
      var q = this.value.trim().toLowerCase();
      if (!q) { searchResults.classList.remove('show'); return; }
      var matches = countries.filter(function(c) { return c.toLowerCase().indexOf(q) !== -1; });
      if (!matches.length) { searchResults.classList.remove('show'); return; }
      searchResults.innerHTML = matches.map(function(c) {
        return '<div class="specs-search-item" data-country="' + c.replace(/"/g,'&quot;') + '">' + c + '</div>';
      }).join('');
      searchResults.classList.add('show');
    });

    searchResults.addEventListener('click', function(e) {
      var item = e.target.closest('.specs-search-item');
      if (!item) return;
      var country = item.dataset.country;
      countrySelect.value = country;
      countrySelect.dispatchEvent(new Event('change'));
      searchInput.value = country;
      searchResults.classList.remove('show');
    });

    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('show');
      }
    });

    countrySelect.addEventListener('change', function() {
      var country = this.value;
      var specs = specsData.filter(function(s) { return s.country === country; });
      specSelect.innerHTML = '<option value="" disabled selected>${escapeHtml(i.selectSpec)}</option>';
      specs.forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.slug;
        opt.textContent = s.type + ' (' + s.size + ')';
        specSelect.appendChild(opt);
      });
      specSelect.disabled = false;
      if (specs.length === 1) {
        specSelect.value = specs[0].slug;
        specSelect.dispatchEvent(new Event('change'));
      }
    });

    specSelect.addEventListener('change', function() {
      if (this.value) location.href = prefix + '/specs/' + this.value;
    });
  })();`;

  return {
    title: i.hubTitle,
    description: i.hubDesc,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_PAGE_STYLE,
    bodyContent,
    pageScript,
  };
}

// 개별 규격 페이지 (/specs/:slug)
export function specsDetailFragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;

  const typeName = lang === 'ja' ? (specData.typeJa || specData.type) : (lang === 'en' ? specData.typeEn : specData.type);
  const countryName = lang === 'en' ? specData.countryEn : specData.country;
  const title = (specData.seoTitle && specData.seoTitle[lang]) || `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = (specData.seoDescription && specData.seoDescription[lang]) || specData.details[lang] || specData.details.ko || specData.details.en || '';

  const canonicalUrl = lang === 'ko' ? `https://monkos.ai/specs/${slug}` : `https://monkos.ai/${lang}/specs/${slug}`;
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/${slug}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/${slug}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/${slug}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/${slug}">`,
  ].join('\n');

  // FAQ 데이터
  const faqs = specData.faqs[lang] || specData.faqs.ko || [];

  // JSON-LD 트리플 스택 (FAQPage는 faqs 존재 시만 삽입 — GSC mainEntity 누락 방어)
  const specsJsonLdArr = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      "publisher": { "@type": "Organization", "name": "Monk Studio" },
      "datePublished": "2026-03-26",
      "dateModified": "2026-03-26",
    },
    ...(faqs.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    }] : []),
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": lang === 'ja' ? `${typeName}の規格に合わせて写真を準備する方法`
             : lang === 'en' ? `How to prepare a ${typeName} photo`
             : `${typeName} 규격에 맞게 사진 준비하는 법`,
      "step": [
        { "@type": "HowToStep", "position": 1, "name": lang === 'ja' ? '規格確認' : lang === 'en' ? 'Check specs' : '규격 확인', "text": `${specData.size} / ${specData.background}` },
        { "@type": "HowToStep", "position": 2, "name": lang === 'ja' ? 'セルフィー撮影' : lang === 'en' ? 'Take a selfie' : '셀카 촬영', "text": lang === 'ja' ? '明るい場所で白い背景の前で撮影' : lang === 'en' ? 'Take a photo in a bright area with a white background' : '밝은 곳에서 흰 배경 앞에 촬영' },
        { "@type": "HowToStep", "position": 3, "name": lang === 'ja' ? 'AI補正またはクロップ' : lang === 'en' ? 'AI retouch or crop' : 'AI 보정 또는 크롭', "text": lang === 'ja' ? 'MONKOS AIまたは無料クロップアプリで規格に合わせる' : lang === 'en' ? 'Use MONKOS AI or the free crop app to fit the specs' : 'MONKOS AI 또는 무료 크롭앱으로 규격 맞춤' },
        { "@type": "HowToStep", "position": 4, "name": lang === 'ja' ? 'ダウンロード' : lang === 'en' ? 'Download' : '다운로드', "text": lang === 'ja' ? '完成写真をダウンロード' : lang === 'en' ? 'Download the finished photo' : '완성 사진 다운로드' },
      ],
    },
  ];
  const specsJsonLd = JSON.stringify(specsJsonLdArr);

  const seoMeta = `<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${specsJsonLd}</script>`;

  // 규격 테이블
  const h = i.tableHeaders;
  const tableIconMap = { size: '📐', pixels: '🖥️', dpi: '🔍', background: '🎨', headHeight: '📏', validity: '📅', fileSpec: '📁' };
  const tableRows = [
    ['size', h.size, locField(specData, 'size', lang)],
    ['pixels', h.pixels, locField(specData, 'pixels', lang)],
    ['dpi', h.dpi, String(specData.dpi)],
    ['background', h.background, locField(specData, 'background', lang)],
    ['headHeight', h.headHeight, locField(specData, 'headHeight', lang)],
    ['validity', h.validity, locField(specData, 'validity', lang)],
    ['fileSpec', h.fileSpec, locField(specData, 'fileSpec', lang)],
  ].map(([key, label, val]) => `<tr><th>${tableIconMap[key] || ''} ${escapeHtml(label)}</th><td>${escapeHtml(val)}</td></tr>`).join('\n      ');

  // 상세 규정 아이콘 매핑 (details 텍스트를 파싱하여 그리드 아이템으로)
  const detailIcons = ['😐', '👓', '💇', '👂', '👔', '📸'];
  const detailLines = description.split(/[.。]\s*/).filter(d => d.trim().length > 0);
  const detailGridHtml = detailLines.map((line, idx) =>
    `<div class="specs-detail-item"><span class="sdi-icon">${detailIcons[idx] || '📋'}</span><span>${escapeHtml(line.trim())}</span></div>`
  ).join('\n        ');

  // 반려 사유 (2열 카드)
  const rejections = specData.rejectionReasons[lang] || specData.rejectionReasons.ko || [];
  const rejectionHtml = rejections.map((r, idx) =>
    `<li class="specs-rejection-card">
          <span class="specs-rj-badge">${idx + 1}</span>
          <div class="specs-rj-info"><h4>${escapeHtml(r)}</h4></div>
        </li>`
  ).join('\n        ');

  // FAQ (아코디언)
  const faqHtml = faqs.map((f, idx) =>
    `<div class="specs-faq-item${idx === 0 ? ' open' : ''}">
          <div class="specs-faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.q)}</div>
          <div class="specs-faq-a">${escapeHtml(f.a)}</div>
        </div>`
  ).join('\n        ');

  // 같은 국가 다른 규격
  const sameCountry = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameCountryLinks = sameCountry.map(s => {
    const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
    return `<a href="${prefix}/specs/${s.slug}">${escapeHtml(name)}</a>`;
  }).join('\n        ');

  // 관련 링크
  const relatedLinksHtml = i.relatedLinks.map(l =>
    `<a href="${l.href}">${escapeHtml(l.label)}</a>`
  ).join('\n        ');

  const backLabel = lang === 'ja' ? '← 全規格一覧' : lang === 'en' ? '← All Specifications' : '← 전체 규격 목록';

  // O/X 비교 i18n
  const oxGoodLabel = lang === 'ja' ? '✅ 適合写真' : lang === 'en' ? '✅ Acceptable Photo' : '✅ 적합한 사진';
  const oxBadLabel = lang === 'ja' ? '❌ 却下される写真' : lang === 'en' ? '❌ Rejected Photo' : '❌ 반려되는 사진';
  const oxGoodCaption = lang === 'ja' ? '正面・無表情・白背景' : lang === 'en' ? 'Front-facing · Neutral · White BG' : '정면 · 무표정 · 흰배경';
  const oxBadCaption = lang === 'ja' ? '傾き・影・髪' : lang === 'en' ? 'Tilted · Shadow · Hair' : '기울어짐 · 그림자 · 머리카락';

  // CTA i18n
  const ctaHeadline = lang === 'ja' ? '規格に合う写真、AIが自動で' : lang === 'en' ? 'AI makes your photo spec-ready' : '규격에 맞는 사진, AI가 자동으로';
  const ctaSub = lang === 'ja' ? '背景除去・規格クロップ・補正まで一度に' : lang === 'en' ? 'Background removal · Crop · Retouch in one step' : '배경 제거 · 규격 크롭 · 보정까지 한 번에';

  const bodyContent = `
  <a href="${prefix}/specs" class="specs-back">${escapeHtml(backLabel)}</a>

  <!-- Hero 2열 -->
  <section class="specs-hero">
    <div class="specs-hero-text">
      <h1>2026 ${escapeHtml(countryName)} ${escapeHtml(typeName)}</h1>
      <p class="specs-hero-desc">${escapeHtml(description)}</p>
      <div class="specs-hero-tags">
        <span>${escapeHtml(locField(specData, 'size', lang))}</span>
        <span>${escapeHtml(locField(specData, 'background', lang))}</span>
        <span>${escapeHtml(locField(specData, 'validity', lang))}</span>
        <span>${specData.dpi} DPI</span>
      </div>
    </div>
    <div class="specs-diagram">
      <div class="specs-photo-frame">
        ${(() => {
          const sizeMm = parseSizeMm(specData.size);
          if (sizeMm) {
            return `<img src="/images/guides/${sizeMm}.webp"
             alt="${escapeHtml(countryName)} ${escapeHtml(typeName)} ${sizeMm.replace('x','×')}mm"
             width="200" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor" style="display:none">
          <ellipse cx="60" cy="45" rx="30" ry="38"/>
          <ellipse cx="60" cy="140" rx="50" ry="45"/>
        </svg>`;
          }
          return `<svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor">
          <ellipse cx="60" cy="45" rx="30" ry="38"/>
          <ellipse cx="60" cy="140" rx="50" ry="45"/>
        </svg>`;
        })()}
        <div class="specs-head-guide">${escapeHtml(locField(specData, 'headHeight', lang))}</div>
        <div class="specs-guide-w">${escapeHtml((() => { const s = locField(specData, 'size', lang).split('×')[0].trim(); return /\d$/.test(s) ? s + 'mm' : s; })())}</div>
      </div>
      <div class="specs-guide-h">${escapeHtml((() => { const s = (locField(specData, 'size', lang).split('×')[1] || '45 mm').trim(); return /\d$/.test(s) ? s + 'mm' : s; })())}</div>
    </div>
  </section>

  <!-- 규격 테이블 -->
  <table class="specs-table">
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- 상세 규정 그리드 -->
  <div class="specs-section">
    <h2>${escapeHtml(i.detailsTitle)}</h2>
    <div class="specs-details-grid">
      ${detailGridHtml}
    </div>
  </div>

  <!-- 반려 사유 TOP 5 -->
  <div class="specs-section">
    <h2>${escapeHtml(i.rejectionTitle)}</h2>
    <ul class="specs-rejection-grid">
      ${rejectionHtml}
    </ul>
  </div>

  <!-- FAQ 아코디언 -->
  <div class="specs-section">
    <h2>${escapeHtml(i.faqTitle)}</h2>
    <div class="specs-faq">
      ${faqHtml}
    </div>
  </div>

  <!-- CTA 배너 -->
  <div class="specs-cta">
    <div class="specs-cta-text">
      <h3>${ctaHeadline}</h3>
      <p>${ctaSub}</p>
    </div>
    <div class="specs-cta-buttons">
      <a href="/" class="primary">${escapeHtml(i.ctaAI)}</a>
      <a href="/crop" class="secondary">${escapeHtml(i.ctaCrop)}</a>
    </div>
  </div>

  <!-- 관련 콘텐츠 -->
  <div class="specs-related">
    <h3>${escapeHtml(i.relatedTitle)}</h3>
    <div class="specs-related-links">
      ${relatedLinksHtml}
    </div>
    ${sameCountry.length > 0 ? `<h3 style="margin-top:16px;">${escapeHtml(i.sameCountryLabel)}</h3>
    <div class="specs-related-links">
      ${sameCountryLinks}
    </div>` : ''}
  </div>`;

  return {
    title,
    description,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_PAGE_STYLE,
    bodyContent,
    pageScript: null,
  };
}

// GET /specs — 규격 허브 인덱스
export function renderSpecsList(req, res, forceLang = null) {
  try {
    const parts = specsListFragment(forceLang);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 허브 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /specs/:slug — 규격 상세 페이지
export function renderSpecsDetail(req, res, forceLang = null) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.replace(/^\/(?:ja|en)\//, '/').split('/');
    const slug = pathParts[pathParts.indexOf('specs') + 1];
    const parts = specsDetailFragment(slug, forceLang);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
