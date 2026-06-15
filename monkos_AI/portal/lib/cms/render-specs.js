/**
 * CMS SSR — 증명사진 규격 허브 + 상세
 * IDPASS 카드 UI + 다크 테마 + 3티어 전환 퍼널
 */
import { createRequire } from 'module';
import { escapeHtml, layoutShell } from './render-shell.js';
import { log } from '../shared/config.js';

const _require = createRequire(import.meta.url);
export const SPECS_DATA = _require('./specs-data.json');

// ─── I18N ───────────────────────────────────────────────────────

const SPECS_I18N = {
  ko: {
    hubTitle: '증명사진 규격 가이드 — 국가별·용도별 사이즈 총정리 | MONKOS',
    hubDesc: '한국 여권·반명함, 일본 패스포트·이력서, 미국 비자 등 증명사진 규격을 한눈에. 사이즈·배경·복장 기준과 반려 사유까지.',
    hubH1: '증명사진 규격 가이드',
    hubSub: '전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보',
    detailSuffix: '규격 — 사이즈·배경·복장 완벽 가이드 | MONKOS',
    tableHeaders: { size: '사이즈', pixels: '해상도', dpi: 'DPI', background: '배경', headHeight: '머리 높이', validity: '유효기간', fileSpec: '파일 규격' },
    detailsTitle: '상세 규정',
    rejectionTitle: '반려 사유 TOP 5',
    faqTitle: '자주 묻는 질문',
    ctaAI: 'AI로 촬영하기 →',
    ctaCrop: '무료 크롭앱 →',
    officialSourceTitle: '공식 발급 안내',
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
    selectPurpose: '용도를 선택하세요',
    backToContinent: '← 대륙 선택으로',
    backToPurpose: '← 용도 선택으로',
    countriesCount: '개국',
    tierFreeTitle: '📸 무료 크롭',
    tierFreeSub: '브라우저에서 바로 처리',
    tierFreeDesc: '배경 제거 + 규격 크롭',
    tierFreeCta: '무료로 시작 →',
    tierAITitle: '🤖 AI 프리미어',
    tierAISub: 'GPU 배경 제거 + AI 규격 검수',
    tierAIDesc: '컬러 배경 선택',
    tierAICta: '크레딧으로 이용 →',
    tierStudioTitle: '👤 스튜디오 검수',
    tierStudioSub: '전문가 정밀 보정',
    tierStudioDesc: '발급 보장',
    tierStudioCta: '스튜디오 의뢰 →',
    tierRecommend: '★ 추천',
    tierComingSoon: '준비 중',
    tierSectionTitle: '이 규격으로 사진 만들기',
  },
  ja: {
    hubTitle: '証明写真 規格ガイド — 国別・用途別サイズ総まとめ | MONKOS',
    hubDesc: '韓国パスポート・半名刺、日本パスポート・履歴書、米国ビザなど証明写真規格を一覧で。サイズ・背景・服装基準と却下理由まで。',
    hubH1: '証明写真 規格ガイド',
    hubSub: '世界200カ国以上のパスポート・ビザなど証明写真規格情報',
    detailSuffix: '規格 — サイズ・背景・服装 完全ガイド | MONKOS',
    tableHeaders: { size: 'サイズ', pixels: '解像度', dpi: 'DPI', background: '背景', headHeight: '頭の高さ', validity: '有効期限', fileSpec: 'ファイル規格' },
    detailsTitle: '詳細規定',
    rejectionTitle: '却下理由 TOP 5',
    faqTitle: 'よくある質問',
    ctaAI: 'AIで撮影する →',
    ctaCrop: '無料クロップアプリ →',
    officialSourceTitle: '公式申請案内',
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
    selectPurpose: '用途を選択してください',
    backToContinent: '← 大陸選択へ',
    backToPurpose: '← 用途選択へ',
    countriesCount: 'カ国',
    tierFreeTitle: '📸 無料クロップ',
    tierFreeSub: 'ブラウザで即処理',
    tierFreeDesc: '背景除去 + 規格クロップ',
    tierFreeCta: '無料で始める →',
    tierAITitle: '🤖 AI プレミア',
    tierAISub: 'GPU背景除去 + AI規格検査',
    tierAIDesc: 'カラー背景選択',
    tierAICta: 'クレジットで利用 →',
    tierStudioTitle: '👤 スタジオ検収',
    tierStudioSub: '専門家精密補正',
    tierStudioDesc: '発行保証',
    tierStudioCta: 'スタジオ依頼 →',
    tierRecommend: '★ おすすめ',
    tierComingSoon: '準備中',
    tierSectionTitle: 'この規格で写真を作る',
  },
  en: {
    hubTitle: 'ID Photo Specifications Guide — Size & Requirements by Country | MONKOS',
    hubDesc: 'Korea passport & resume, Japan passport & resume, US visa photo specs at a glance. Size, background, dress code and rejection reasons.',
    hubH1: 'ID Photo Specifications Guide',
    hubSub: 'ID photo specifications for 200+ countries — passport, visa, and more.',
    detailSuffix: 'Specs — Size, Background & Dress Code Complete Guide | MONKOS',
    tableHeaders: { size: 'Size', pixels: 'Resolution', dpi: 'DPI', background: 'Background', headHeight: 'Head Height', validity: 'Validity', fileSpec: 'File Spec' },
    detailsTitle: 'Detailed Requirements',
    rejectionTitle: 'Top 5 Rejection Reasons',
    faqTitle: 'Frequently Asked Questions',
    ctaAI: 'Take with AI →',
    ctaCrop: 'Free Crop App →',
    officialSourceTitle: 'Official Application',
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
    selectPurpose: 'Select a purpose',
    backToContinent: '← Back to continents',
    backToPurpose: '← Back to purposes',
    countriesCount: 'countries',
    tierFreeTitle: '📸 Free Crop',
    tierFreeSub: 'Process in your browser',
    tierFreeDesc: 'Background removal + spec crop',
    tierFreeCta: 'Start free →',
    tierAITitle: '🤖 AI Premier',
    tierAISub: 'GPU background removal + AI inspection',
    tierAIDesc: 'Color background options',
    tierAICta: 'Use with credits →',
    tierStudioTitle: '👤 Studio Review',
    tierStudioSub: 'Expert precision editing',
    tierStudioDesc: 'Issuance guaranteed',
    tierStudioCta: 'Request studio →',
    tierRecommend: '★ Recommended',
    tierComingSoon: 'Coming soon',
    tierSectionTitle: 'Create your photo with this spec',
  },
};

// ─── CONTINENT META ─────────────────────────────────────────────

const CONTINENT_META = [
  { id: 'asia', ko: '아시아', ja: 'アジア', en: 'Asia', gradient: ['#1A3A2A', '#2D5A3A'], dot: '#00D4AA', image: 'cont_asia' },
  { id: 'europe', ko: '유럽', ja: 'ヨーロッパ', en: 'Europe', gradient: ['#1A1A3A', '#3A2A5A'], dot: '#A78BFA', image: 'cont_europe' },
  { id: 'americas', ko: '아메리카', ja: 'アメリカ大陸', en: 'Americas', gradient: ['#1A2A3A', '#2A3A5A'], dot: '#3B82F6', image: 'cont_americas' },
  { id: 'africa', ko: '아프리카', ja: 'アフリカ', en: 'Africa', gradient: ['#3A2A1A', '#5A3A1A'], dot: '#FFB020', image: 'cont_africa' },
  { id: 'oceania', ko: '오세아니아', ja: 'オセアニア', en: 'Oceania', gradient: ['#1A2A2A', '#1A3A4A'], dot: '#FF6B9D', image: 'cont_oceania' },
  { id: 'middleeast', ko: '중동', ja: '中東', en: 'Middle East', gradient: ['#2A2A1A', '#4A3A1A'], dot: '#F59E0B', image: 'cont_middleeast' },
];

// ─── TYPE CATEGORIES (4 purposes) ───────────────────────────────

const TYPE_CATEGORIES = [
  { id: 'passport', ko: '여권', ja: 'パスポート', en: 'Passport', sub: 'PASSPORT', icon: '📘', image: 'card_passport', slugs: ['passport'] },
  { id: 'visa', ko: '비자', ja: 'ビザ', en: 'Visa', sub: 'VISA', icon: '📋', image: 'card_visa', slugs: ['visa', 'schengen-visa', 'e-visa'] },
  { id: 'id', ko: '신분증', ja: '身分証', en: 'ID Card', sub: 'ID', icon: '🪪', image: 'card_license', slugs: ['id', 'drivers-license', 'license', 'intl-license', 'mynumber', 'halfcard', 'resident', 'zairyu', 'exam', 'youth-id', 'taxi', 'marine'] },
  { id: 'custom', ko: '기타', ja: 'その他', en: 'Custom', sub: 'CUSTOM', icon: '📸', image: 'card_custom', slugs: ['resume', 'headshot'] },
];

// ─── SLUG PARSING ───────────────────────────────────────────────

const TYPE_SLUG_PATTERNS = [
  'schengen-visa', 'intl-license', 'drivers-license', 'youth-id',
  'passport', 'visa', 'e-visa', 'resume', 'halfcard', 'headshot',
  'mynumber', 'resident', 'zairyu', 'license', 'taxi', 'marine', 'exam', 'id',
];

function parseSlug(slug) {
  for (const pattern of TYPE_SLUG_PATTERNS) {
    if (slug.endsWith('-' + pattern)) {
      return { typeSlug: pattern, countrySlug: slug.slice(0, -(pattern.length + 1)) };
    }
  }
  const idx = slug.lastIndexOf('-');
  return idx > 0
    ? { typeSlug: slug.slice(idx + 1), countrySlug: slug.slice(0, idx) }
    : { typeSlug: slug, countrySlug: '' };
}

function getTypeCategory(typeSlug) {
  for (const cat of TYPE_CATEGORIES) {
    if (cat.slugs.includes(typeSlug)) return cat.id;
  }
  return 'custom';
}

const COUNTRY_SLUG_TO_ISO = {
  korea: 'kr', japan: 'jp', usa: 'us', canada: 'ca',
  uk: 'gb', germany: 'de', spain: 'es', australia: 'au',
  singapore: 'sg', thailand: 'th', india: 'in', china: 'cn',
  vietnam: 'vn', indonesia: 'id', eu: 'eu',
};

function canonicalCountry(countrySlug) {
  return COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug;
}

function countryFlag(countrySlug) {
  const code = (COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug).toUpperCase();
  if (code.length !== 2) return '';
  return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65, 0x1F1E6 + code.charCodeAt(1) - 65);
}

// ─── BUILD ROUTE MAPS (at module load) ──────────────────────────

const ROUTE_MAP = {};
export const REDIRECT_MAP = {};
const COUNTRY_BEST = {};

for (const [slug, spec] of Object.entries(SPECS_DATA)) {
  const { typeSlug, countrySlug } = parseSlug(slug);
  const routeKey = `${typeSlug}/${countrySlug}`;
  ROUTE_MAP[routeKey] = slug;
  REDIRECT_MAP[slug] = routeKey;

  const category = getTypeCategory(typeSlug);
  const continent = spec.continent || 'other';
  const dedupKey = `${category}:${continent}:${countrySlug}`;
  if (!COUNTRY_BEST[dedupKey] || spec.priority < COUNTRY_BEST[dedupKey].priority) {
    COUNTRY_BEST[dedupKey] = { slug, typeSlug, countrySlug, priority: spec.priority };
  }
}

function locField(spec, field, lang) {
  if (lang === 'en' && spec[field + 'En']) return spec[field + 'En'];
  if (lang === 'ja' && spec[field + 'Ja']) return spec[field + 'Ja'];
  return spec[field];
}

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

// ─── DARK THEME CSS ─────────────────────────────────────────────

const SPECS_PAGE_STYLE = `
body { background: #f6f7fb !important; color: #1a1a1a !important; }
.container { max-width: 1000px; }
a { color: #00D4AA; }
a:hover { color: #00F4C4; }

/* === Hub Hero === */
.specs-hub-hero { text-align: center; padding: 48px 20px 32px; }
.specs-hub-hero .hero-global {
  font-size: 12px; letter-spacing: 3px; color: #00D4AA; font-weight: 600;
  font-family: monospace; margin-bottom: 14px;
}
.specs-hub-hero h1 { font-size: 32px; font-weight: 800; color: #1a1a1a; margin-bottom: 12px; }
.specs-hub-hero .hero-sub { font-size: 15px; color: #888; line-height: 1.7; max-width: 520px; margin: 0 auto 28px; }
.specs-hub-stats { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
.specs-hub-stat { text-align: center; }
.specs-hub-stat .stat-num { font-size: 32px; font-weight: 800; color: #00D4AA; font-family: monospace; }
.specs-hub-stat .stat-label { font-size: 12px; color: #888; margin-top: 2px; }

/* === Purpose Cards (2×2) === */
.purpose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.purpose-card {
  position: relative; height: 100px; border-radius: 12px; overflow: hidden;
  cursor: pointer; border: 1px solid rgba(0,0,0,0.08);
  transition: border-color 0.2s, transform 0.15s;
}
.purpose-card:hover { border-color: rgba(0,212,170,0.3); transform: translateY(-2px); }
.purpose-card.active { border-color: #00D4AA; box-shadow: 0 0 20px rgba(0,212,170,0.15); }
.purpose-card img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.purpose-card .overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.purpose-card .p-name { font-size: 18px; font-weight: 800; color: #1a1a1a; }
.purpose-card .p-sub { font-size: 10px; font-weight: 700; color: #00D4AA; letter-spacing: 2px; font-family: monospace; }

/* === Continent Cards (2×3) === */
.section-title { font-size: 13px; color: #888; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.section-title .back-btn {
  color: #00D4AA; cursor: pointer; font-size: 13px; border: none; background: none;
  font-family: inherit; padding: 0;
}
.section-title .back-btn:hover { text-decoration: underline; }
.continent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.continent-card {
  position: relative; height: 120px; border-radius: 12px; overflow: hidden;
  cursor: pointer; border: 1px solid rgba(0,0,0,0.08);
  transition: border-color 0.2s, transform 0.15s;
}
.continent-card:hover { border-color: rgba(0,0,0,0.15); transform: translateY(-2px); }
.continent-card img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.continent-card .overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
}
.continent-card .c-name { font-size: 18px; font-weight: 800; color: #1a1a1a; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.continent-card .c-name-en { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); letter-spacing: 1px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.continent-card .c-count { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }

/* === Country Cards === */
.country-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.country-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 16px; cursor: pointer; text-decoration: none; display: block; color: inherit;
  transition: border-color 0.2s, transform 0.15s;
}
.country-card:hover { border-color: rgba(0,212,170,0.3); transform: translateY(-1px); color: inherit; }
.country-card .cc-flag { font-size: 24px; margin-bottom: 6px; }
.country-card .cc-name { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
.country-card .cc-meta { font-size: 12px; color: #888; }

/* === Search === */
.specs-search-wrap { position: relative; margin-bottom: 20px; }
.specs-search-wrap input {
  width: 100%; padding: 14px 20px 14px 44px; font-size: 15px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
  background: #ffffff; color: #1a1a1a; outline: none; box-sizing: border-box;
  transition: border-color 0.2s;
}
.specs-search-wrap input:focus { border-color: #00D4AA; }
.specs-search-wrap::before {
  content: '\\1F50D'; position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  font-size: 16px; pointer-events: none;
}
.specs-search-results {
  position: absolute; top: 100%; left: 0; right: 0; background: #ffffff;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; margin-top: 4px;
  max-height: 280px; overflow-y: auto; z-index: 10; display: none;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.specs-search-results.show { display: block; }
.specs-search-item {
  padding: 12px 16px; cursor: pointer; font-size: 14px; color: #1a1a1a;
  border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; gap: 10px;
}
.specs-search-item:hover { background: rgba(0,212,170,0.08); }
.specs-search-item:last-child { border-bottom: none; }
.specs-search-item .si-flag { font-size: 18px; }
.specs-search-item .si-meta { font-size: 12px; color: #888; margin-left: auto; }

/* === Hub Footer === */
.specs-hub-footer { text-align: center; padding: 24px 0; margin-top: 32px; font-size: 12px; color: #888; border-top: 1px solid rgba(0,0,0,0.08); }

/* === Detail — Back link === */
.specs-back { display: inline-block; margin-bottom: 20px; font-size: 13px; color: #00D4AA; text-decoration: none; }
.specs-back:hover { text-decoration: underline; }

/* === Detail — Hero 2열 === */
.specs-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 40px; }
.specs-hero-text h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.3; margin-bottom: 12px; }
.specs-hero-text .specs-hero-desc { color: #888; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
.specs-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.specs-hero-tags span {
  background: rgba(0,212,170,0.1); color: #00D4AA; padding: 4px 12px;
  border-radius: 20px; font-size: 13px; font-weight: 500;
}

/* === Detail — Diagram === */
.specs-diagram {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px;
  padding: 32px; display: flex; justify-content: center; align-items: center; position: relative;
}
.specs-photo-frame {
  width: 175px; height: 225px; background: #f0f1f4;
  border: 2px dashed #00D4AA; border-radius: 4px; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.specs-photo-frame svg { opacity: 0.15; }
.specs-guide-w {
  position: absolute; bottom: -28px; left: 0; right: 0; text-align: center;
  font-size: 12px; color: #00D4AA; font-weight: 600;
}
.specs-guide-h {
  position: absolute; top: 0; bottom: 0; right: -50px;
  display: flex; align-items: center; font-size: 12px; color: #00D4AA; font-weight: 600;
  writing-mode: vertical-rl;
}
.specs-guide-h::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: -8px; width: 1px; background: #00D4AA;
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

/* === Detail — Table === */
.specs-table {
  width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px;
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden;
}
.specs-table th, .specs-table td { padding: 10px 14px; text-align: left; font-size: 14px; }
.specs-table th {
  background: #f0f1f4; font-weight: 600; color: #1a1a1a; width: 110px; font-size: 13px;
  border-right: 1px solid rgba(0,0,0,0.08);
}
.specs-table td { color: #888; }
.specs-table tr:not(:last-child) th,
.specs-table tr:not(:last-child) td { border-bottom: 1px solid rgba(0,0,0,0.08); }

/* === Detail — Section === */
.specs-section { margin-bottom: 32px; }
.specs-section h2 { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; }
.specs-section p { font-size: 14px; color: #888; line-height: 1.8; }
.specs-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.specs-detail-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px;
  background: #ffffff; border-radius: 8px; font-size: 14px; color: #888;
}
.specs-detail-item .sdi-icon { flex-shrink: 0; font-size: 16px; width: 24px; text-align: center; }

/* === Detail — O/X Compare === */
.specs-ox-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.specs-ox-card {
  background: #ffffff; border-radius: 12px; overflow: hidden; border: 2px solid rgba(0,0,0,0.08);
}
.specs-ox-card.ox-good { border-color: #22c55e; }
.specs-ox-card.ox-bad { border-color: #ef4444; }
.specs-ox-header { padding: 10px 16px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.specs-ox-card.ox-good .specs-ox-header { background: rgba(34,197,94,0.1); color: #4ade80; }
.specs-ox-card.ox-bad .specs-ox-header { background: rgba(239,68,68,0.1); color: #f87171; }
.specs-ox-body {
  padding: 20px; display: flex; justify-content: center; align-items: center;
  background: #f0f1f4; min-height: 180px;
}
.specs-ox-photo {
  width: 120px; height: 154px; background: #ffffff; border: 2px dashed #ccc;
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
}
.specs-ox-card.ox-good .specs-ox-photo { border-color: #22c55e; }
.specs-ox-card.ox-bad .specs-ox-photo { border-color: #ef4444; }
.specs-ox-photo svg { opacity: 0.3; }
.specs-ox-caption { margin-top: 10px; font-size: 12px; color: #888; text-align: center; }
.specs-ox-points { padding: 12px 16px; border-top: 1px solid rgba(0,0,0,0.08); list-style: none; margin: 0; }
.specs-ox-points li {
  font-size: 13px; color: #888; padding: 3px 0; display: flex; align-items: center; gap: 6px;
}

/* === Detail — Rejection === */
.specs-rejection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; list-style: none; padding: 0; }
.specs-rejection-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 20px; display: flex; gap: 14px; align-items: flex-start;
  transition: box-shadow 0.2s;
}
.specs-rejection-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.specs-rj-badge {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #ef4444; color: #fff; font-weight: 700; font-size: 14px;
}
.specs-rj-info h4 { font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px 0; }
.specs-rj-info p { font-size: 13px; color: #888; margin: 0; line-height: 1.5; }

/* === Detail — FAQ === */
.specs-faq { list-style: none; padding: 0; }
.specs-faq-item {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
  margin-bottom: 8px; overflow: hidden;
}
.specs-faq-q {
  padding: 16px 20px; font-weight: 600; font-size: 15px; color: #1a1a1a;
  cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none;
}
.specs-faq-q::before { content: "Q"; color: #00D4AA; font-weight: 700; font-size: 14px; }
.specs-faq-q::after {
  content: "\\25BE"; margin-left: auto; color: #888; font-size: 12px;
  transition: transform 0.2s;
}
.specs-faq-item.open .specs-faq-q::after { transform: rotate(180deg); }
.specs-faq-a {
  padding: 0 20px 16px 46px; font-size: 14px; color: #888;
  line-height: 1.7; display: none;
}
.specs-faq-item.open .specs-faq-a { display: block; }

/* === Official Source Link === */
.specs-official-link {
  display: flex; align-items: center; gap: 12px; padding: 16px 20px;
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  color: #1a1a1a; text-decoration: none; font-size: 14px; font-weight: 500;
  transition: border-color 0.2s;
}
.specs-official-link:hover { border-color: #00D4AA; }
.specs-external-icon { margin-left: auto; color: #00D4AA; font-size: 16px; }

/* === Detail — 3-Tier CTA === */
.tier-section { margin: 40px 0 32px; }
.tier-section h2 { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; }
.tier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.tier-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 24px 20px; position: relative; transition: border-color 0.2s;
}
.tier-card:hover { border-color: rgba(0,0,0,0.12); }
.tier-card.recommended { border-color: #00D4AA; }
.tier-badge {
  position: absolute; top: -10px; right: 16px; background: #00D4AA; color: #fff;
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px;
}
.tier-card h3 { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
.tier-card .tier-sub { font-size: 13px; color: #00D4AA; margin-bottom: 6px; }
.tier-card .tier-desc { font-size: 13px; color: #888; margin-bottom: 16px; }
.tier-card .tier-cta {
  display: inline-block; padding: 10px 20px; border-radius: 8px; font-size: 13px;
  font-weight: 600; text-decoration: none; transition: all 0.2s;
}
.tier-card:first-child .tier-cta { background: #00D4AA; color: #fff; }
.tier-card:first-child .tier-cta:hover { background: #00F4C4; }
.tier-card:nth-child(2) .tier-cta, .tier-card:nth-child(3) .tier-cta {
  background: rgba(0,0,0,0.05); color: #888; cursor: default;
}
.tier-coming { font-size: 11px; color: #888; margin-top: 6px; }

/* === Detail — Related === */
.specs-related {
  margin-top: 32px; padding: 20px 24px;
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
}
.specs-related h3 { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
.specs-related-links { display: flex; flex-wrap: wrap; gap: 10px; }
.specs-related-links a {
  font-size: 13px; color: #00D4AA; text-decoration: none; padding: 6px 14px;
  background: rgba(0,212,170,0.06); border-radius: 8px; transition: all 0.2s;
  border: 1px solid transparent;
}
.specs-related-links a:hover { background: rgba(0,212,170,0.12); border-color: #00D4AA; }

/* === Responsive === */
@media (max-width: 768px) {
  .specs-hero { grid-template-columns: 1fr; }
  .specs-diagram { order: -1; }
  .specs-details-grid { grid-template-columns: 1fr; }
  .specs-ox-compare { grid-template-columns: 1fr; }
  .specs-rejection-grid { grid-template-columns: 1fr; }
  .tier-grid { grid-template-columns: 1fr; }
  .purpose-grid { grid-template-columns: 1fr 1fr; }
  .continent-grid { grid-template-columns: 1fr; }
  .country-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .purpose-grid { grid-template-columns: 1fr; }
}
`;

// ─── HUB PAGE (/specs) ─────────────────────────────────────────

function buildHubData(lang) {
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const result = {};

  for (const cat of TYPE_CATEGORIES) {
    result[cat.id] = {};
    for (const cm of CONTINENT_META) {
      result[cat.id][cm.id] = [];
    }
  }

  const seen = {};
  const sorted = Object.entries(SPECS_DATA).sort((a, b) => a[1].priority - b[1].priority);

  for (const [slug, spec] of sorted) {
    const { typeSlug, countrySlug } = parseSlug(slug);
    const category = getTypeCategory(typeSlug);
    const continent = spec.continent || 'other';
    if (!result[category] || !result[category][continent]) continue;

    const dedupKey = `${category}:${continent}:${canonicalCountry(countrySlug)}`;
    if (seen[dedupKey]) continue;
    seen[dedupKey] = true;

    const countryName = lang === 'en' ? (spec.countryEn || spec.country) : (lang === 'ja' ? (spec.countryJa || spec.country) : spec.country);
    const typeName = lang === 'ja' ? (spec.typeJa || spec.type) : (lang === 'en' ? (spec.typeEn || spec.type) : spec.type);

    result[category][continent].push({
      flag: countryFlag(countrySlug),
      name: countryName,
      type: typeName,
      size: locField(spec, 'size', lang),
      url: `${prefix}/specs/${typeSlug}/${countrySlug}`,
    });
  }

  return result;
}

export function specsListFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;

  const hubData = buildHubData(lang);
  const totalCountries = new Set(Object.values(SPECS_DATA).map(s => s.countryEn || s.country)).size;
  const totalSpecs = Object.keys(SPECS_DATA).length;

  const canonicalUrl = lang === 'ko' ? 'https://monkos.ai/specs' : `https://monkos.ai/${lang}/specs`;
  const hreflangTags = [
    '<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs">',
    '<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs">',
    '<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs">',
    '<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs">',
  ].join('\n');

  const itemListJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": i.hubH1,
    "description": i.hubDesc,
    "url": canonicalUrl,
  });

  const seoMeta = `<meta property="og:title" content="${escapeHtml(i.hubH1)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(i.hubDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="https://monkos.ai/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(i.hubH1)} | MONKOS AI">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://monkos.ai/og-image.png">
<meta name="theme-color" content="#05080E">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${itemListJsonLd}</script>`;

  const purposeCardsHtml = TYPE_CATEGORIES.map(cat => {
    const name = cat[lang] || cat.en;
    return `<div class="purpose-card" data-cat="${cat.id}">
      <img src="/images/cards/${cat.image}.webp" alt="${escapeHtml(name)}" width="300" height="100" loading="lazy"
           onerror="this.style.display='none'">
      <div class="overlay">
        <span class="p-name">${escapeHtml(name)}</span>
        <span class="p-sub">${cat.sub}</span>
      </div>
    </div>`;
  }).join('\n    ');

  const continentCardsHtml = CONTINENT_META.map(cm => {
    const name = cm[lang] || cm.en;
    return `<div class="continent-card" data-cont="${cm.id}" style="display:none">
      <img src="/images/continents/${cm.image}.webp" alt="${escapeHtml(name)}" width="300" height="120" loading="lazy"
           onerror="this.style.display='none'">
      <div class="overlay" style="background:linear-gradient(135deg,${cm.gradient[0]}CC,${cm.gradient[1]}CC)">
        <span class="c-name">${escapeHtml(name)}</span>
        <span class="c-name-en">${cm.en.toUpperCase()}</span>
        <span class="c-count" data-cont-count="${cm.id}"></span>
      </div>
    </div>`;
  }).join('\n    ');

  const hubDataJson = JSON.stringify(hubData);

  const bodyContent = `
  <div class="specs-hub-hero">
    <div class="hero-global">${i.heroGlobal}</div>
    <h1>${escapeHtml(i.heroTitle)}</h1>
    <p class="hero-sub">${escapeHtml(i.heroSub)}</p>
    <div class="specs-hub-stats">
      <div class="specs-hub-stat"><div class="stat-num">${totalCountries}+</div><div class="stat-label">${escapeHtml(i.statCountries)}</div></div>
      <div class="specs-hub-stat"><div class="stat-num">${totalSpecs}+</div><div class="stat-label">${escapeHtml(i.statSpecs)}</div></div>
      <div class="specs-hub-stat"><div class="stat-num">35+</div><div class="stat-label">${escapeHtml(i.statVerified)}</div></div>
    </div>
  </div>

  <div class="specs-search-wrap">
    <input type="search" id="country-search" placeholder="${escapeHtml(i.searchPlaceholder)}" autocomplete="off">
    <div class="specs-search-results" id="search-results"></div>
  </div>

  <div id="purpose-section">
    <div class="section-title">${escapeHtml(i.selectPurpose)}</div>
    <div class="purpose-grid">
      ${purposeCardsHtml}
    </div>
  </div>

  <div id="continent-section" style="display:none">
    <div class="section-title">
      <button class="back-btn" id="back-to-purpose">${escapeHtml(i.backToPurpose)}</button>
    </div>
    <div class="continent-grid">
      ${continentCardsHtml}
    </div>
  </div>

  <div id="country-section" style="display:none">
    <div class="section-title">
      <button class="back-btn" id="back-to-continent">${escapeHtml(i.backToContinent)}</button>
    </div>
    <div class="country-grid" id="country-grid"></div>
  </div>

  <div class="specs-hub-footer">${i.hubFooter}</div>`;

  const pageScript = `
(function(){
  var hubData = ${hubDataJson};
  var countriesLabel = '${escapeHtml(i.countriesCount)}';
  var currentCat = null;
  var currentCont = null;

  var purposeSection = document.getElementById('purpose-section');
  var continentSection = document.getElementById('continent-section');
  var countrySection = document.getElementById('country-section');
  var countryGrid = document.getElementById('country-grid');
  var searchInput = document.getElementById('country-search');
  var searchResults = document.getElementById('search-results');

  // Build flat search index
  var searchIndex = [];
  Object.keys(hubData).forEach(function(cat) {
    Object.keys(hubData[cat]).forEach(function(cont) {
      hubData[cat][cont].forEach(function(c) {
        searchIndex.push({ flag: c.flag, name: c.name, type: c.type, size: c.size, url: c.url, cat: cat, cont: cont });
      });
    });
  });

  // Search
  searchInput.addEventListener('input', function() {
    var q = this.value.trim().toLowerCase();
    if (!q) { searchResults.classList.remove('show'); return; }
    var seen = {};
    var matches = searchIndex.filter(function(c) {
      if (seen[c.url]) return false;
      var match = c.name.toLowerCase().indexOf(q) !== -1;
      if (match) seen[c.url] = true;
      return match;
    }).slice(0, 12);
    if (!matches.length) { searchResults.classList.remove('show'); return; }
    searchResults.innerHTML = matches.map(function(c) {
      return '<div class="specs-search-item" data-url="' + c.url + '">'
        + '<span class="si-flag">' + c.flag + '</span>'
        + '<span>' + c.name + '</span>'
        + '<span class="si-meta">' + c.type + ' · ' + c.size + '</span>'
        + '</div>';
    }).join('');
    searchResults.classList.add('show');
  });

  searchResults.addEventListener('click', function(e) {
    var item = e.target.closest('.specs-search-item');
    if (item && item.dataset.url) location.href = item.dataset.url;
  });

  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target))
      searchResults.classList.remove('show');
  });

  // Purpose cards click
  document.querySelectorAll('.purpose-card').forEach(function(card) {
    card.addEventListener('click', function() {
      currentCat = this.dataset.cat;
      document.querySelectorAll('.purpose-card').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');

      // Update continent counts for this category
      document.querySelectorAll('.continent-card').forEach(function(cc) {
        var contId = cc.dataset.cont;
        var countries = hubData[currentCat] && hubData[currentCat][contId] ? hubData[currentCat][contId] : [];
        var countEl = cc.querySelector('[data-cont-count]');
        if (countEl) countEl.textContent = countries.length + ' ' + countriesLabel;
        cc.style.display = countries.length > 0 ? '' : 'none';
      });

      purposeSection.style.display = 'none';
      continentSection.style.display = '';
      countrySection.style.display = 'none';
    });
  });

  // Continent cards click
  document.querySelectorAll('.continent-card').forEach(function(card) {
    card.addEventListener('click', function() {
      currentCont = this.dataset.cont;
      var countries = hubData[currentCat] && hubData[currentCat][currentCont] ? hubData[currentCat][currentCont] : [];

      countryGrid.innerHTML = countries.map(function(c) {
        return '<a href="' + c.url + '" class="country-card">'
          + '<div class="cc-flag">' + c.flag + '</div>'
          + '<div class="cc-name">' + c.name + '</div>'
          + '<div class="cc-meta">' + c.type + ' · ' + c.size + '</div>'
          + '</a>';
      }).join('');

      continentSection.style.display = 'none';
      countrySection.style.display = '';
    });
  });

  // Back buttons
  document.getElementById('back-to-purpose').addEventListener('click', function() {
    continentSection.style.display = 'none';
    countrySection.style.display = 'none';
    purposeSection.style.display = '';
    currentCat = null;
    document.querySelectorAll('.purpose-card').forEach(function(c) { c.classList.remove('active'); });
  });

  document.getElementById('back-to-continent').addEventListener('click', function() {
    countrySection.style.display = 'none';
    continentSection.style.display = '';
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

// ─── DETAIL PAGE (/specs/:type/:country) ────────────────────────

export function specsDetailFragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;

  const { typeSlug, countrySlug } = parseSlug(slug);
  const newPath = `${typeSlug}/${countrySlug}`;

  const typeName = lang === 'ja' ? (specData.typeJa || specData.type) : (lang === 'en' ? specData.typeEn : specData.type);
  const countryName = lang === 'en'
    ? (specData.countryEn || specData.country)
    : lang === 'ja'
      ? (specData.countryJa || specData.country)
      : specData.country;
  const title = (specData.seoTitle && specData.seoTitle[lang]) || `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = (specData.seoDescription && specData.seoDescription[lang]) || (specData.details && (specData.details[lang] || specData.details.ko || specData.details.en)) || '';

  const canonicalUrl = lang === 'ko' ? `https://monkos.ai/specs/${newPath}` : `https://monkos.ai/${lang}/specs/${newPath}`;
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/${newPath}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/${newPath}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/${newPath}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/${newPath}">`,
  ].join('\n');

  const faqs = (specData.faqs && (specData.faqs[lang] || specData.faqs.ko)) || [];

  const specsLabel = { ko: '규격', en: 'Specs', ja: '規格' }[lang] || 'Specs';
  const specsJsonLdArr = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "MONKOS", "item": "https://monkos.ai" },
        { "@type": "ListItem", "position": 2, "name": specsLabel, "item": `https://monkos.ai${lang === 'ko' ? '' : '/' + lang}/specs` },
        { "@type": "ListItem", "position": 3, "name": `${countryName} ${typeName}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "inLanguage": lang,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      "publisher": { "@type": "Organization", "name": "Monk Studio" },
      "datePublished": "2026-03-26",
      "dateModified": "2026-05-26",
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
        { "@type": "HowToStep", "position": 1, "name": lang === 'ja' ? '規格確認' : lang === 'en' ? 'Check specs' : '규격 확인', "text": `${locField(specData, 'size', lang)} / ${locField(specData, 'background', lang)}` },
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
<meta property="og:image" content="https://monkos.ai/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://monkos.ai/og-image.png">
<meta name="theme-color" content="#05080E">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${specsJsonLd}</script>`;

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

  const detailIcons = ['😐', '👓', '💇', '👂', '👔', '📸'];
  const detailText = (specData.details && (specData.details[lang] || specData.details.ko)) || '';
  const detailLines = detailText.split(/[.。]\s*/).filter(d => d.trim().length > 0);
  const detailGridHtml = detailLines.map((line, idx) =>
    `<div class="specs-detail-item"><span class="sdi-icon">${detailIcons[idx] || '📋'}</span><span>${escapeHtml(line.trim())}</span></div>`
  ).join('\n        ');

  const rejections = (specData.rejectionReasons && (specData.rejectionReasons[lang] || specData.rejectionReasons.ko)) || [];
  const rejectionHtml = rejections.map((r, idx) =>
    `<li class="specs-rejection-card">
          <span class="specs-rj-badge">${idx + 1}</span>
          <div class="specs-rj-info"><h4>${escapeHtml(r)}</h4></div>
        </li>`
  ).join('\n        ');

  const faqHtml = faqs.map((f, idx) =>
    `<div class="specs-faq-item${idx === 0 ? ' open' : ''}">
          <div class="specs-faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.q)}</div>
          <div class="specs-faq-a">${escapeHtml(f.a)}</div>
        </div>`
  ).join('\n        ');

  const sameCountry = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameCountryLinks = sameCountry.map(s => {
    const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
    const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
    return `<a href="${prefix}/specs/${ts}/${cs}">${escapeHtml(name)}</a>`;
  }).join('\n        ');

  const relatedLinksHtml = i.relatedLinks.map(l =>
    `<a href="${l.href}">${escapeHtml(l.label)}</a>`
  ).join('\n        ');

  const backLabel = lang === 'ja' ? '← 全規格一覧' : lang === 'en' ? '← All Specifications' : '← 전체 규격 목록';

  const oxGoodLabel = lang === 'ja' ? '✅ 適合写真' : lang === 'en' ? '✅ Acceptable Photo' : '✅ 적합한 사진';
  const oxBadLabel = lang === 'ja' ? '❌ 却下される写真' : lang === 'en' ? '❌ Rejected Photo' : '❌ 반려되는 사진';
  const oxGoodCaption = lang === 'ja' ? '正面・無表情・白背景' : lang === 'en' ? 'Front-facing · Neutral · White BG' : '정면 · 무표정 · 흰배경';
  const oxBadCaption = lang === 'ja' ? '傾き・影・髪' : lang === 'en' ? 'Tilted · Shadow · Hair' : '기울어짐 · 그림자 · 머리카락';

  const bodyContent = `
  <a href="${prefix}/specs" class="specs-back">${escapeHtml(backLabel)}</a>

  <!-- Hero 2열 -->
  <section class="specs-hero">
    <div class="specs-hero-text">
      <h1>${countryFlag(countrySlug)} ${escapeHtml(countryName)} ${escapeHtml(typeName)}</h1>
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
  ${detailLines.length ? `<div class="specs-section">
    <h2>${escapeHtml(i.detailsTitle)}</h2>
    <div class="specs-details-grid">
      ${detailGridHtml}
    </div>
  </div>` : ''}

  <!-- 반려 사유 -->
  ${rejections.length ? `<div class="specs-section">
    <h2>${escapeHtml(i.rejectionTitle)}</h2>
    <ul class="specs-rejection-grid">
      ${rejectionHtml}
    </ul>
  </div>` : ''}

  <!-- FAQ 아코디언 -->
  ${faqs.length ? `<div class="specs-section">
    <h2>${escapeHtml(i.faqTitle)}</h2>
    <div class="specs-faq">
      ${faqHtml}
    </div>
  </div>` : ''}

  <!-- 공식 발급 안내 -->
  ${specData.officialSource ? `<div class="specs-section">
    <h2>${escapeHtml(i.officialSourceTitle)}</h2>
    <a href="${escapeHtml(specData.officialSource.url)}" target="_blank" rel="noopener noreferrer" class="specs-official-link">
      <span>🏛️</span>
      <span>${escapeHtml((specData.officialSource.label && (specData.officialSource.label[lang] || specData.officialSource.label.ko)) || specData.officialSource.url)}</span>
      <span class="specs-external-icon">↗</span>
    </a>
  </div>` : ''}

  <!-- 3단 티어 CTA -->
  <div class="tier-section">
    <h2>${escapeHtml(i.tierSectionTitle)}</h2>
    <div class="tier-grid">
      <div class="tier-card">
        <h3>${i.tierFreeTitle}</h3>
        <div class="tier-sub">${escapeHtml(i.tierFreeSub)}</div>
        <div class="tier-desc">${escapeHtml(i.tierFreeDesc)}</div>
        <a href="/crop" class="tier-cta">${escapeHtml(i.tierFreeCta)}</a>
      </div>
      <div class="tier-card recommended">
        <span class="tier-badge">${escapeHtml(i.tierRecommend)}</span>
        <h3>${i.tierAITitle}</h3>
        <div class="tier-sub">${escapeHtml(i.tierAISub)}</div>
        <div class="tier-desc">${escapeHtml(i.tierAIDesc)}</div>
        <a href="#" class="tier-cta">${escapeHtml(i.tierAICta)}</a>
        <div class="tier-coming">${escapeHtml(i.tierComingSoon)}</div>
      </div>
      <div class="tier-card">
        <h3>${i.tierStudioTitle}</h3>
        <div class="tier-sub">${escapeHtml(i.tierStudioSub)}</div>
        <div class="tier-desc">${escapeHtml(i.tierStudioDesc)}</div>
        <a href="#" class="tier-cta">${escapeHtml(i.tierStudioCta)}</a>
        <div class="tier-coming">${escapeHtml(i.tierComingSoon)}</div>
      </div>
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

// ─── ROUTE HANDLERS ─────────────────────────────────────────────

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

export function renderSpecsDetail(req, res, forceLang = null) {
  try {
    const lang = forceLang || 'ko';
    const prefix = lang === 'ko' ? '' : `/${lang}`;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.replace(/^\/(?:ja|en)\//, '/').split('/').filter(Boolean);

    const specsIdx = pathParts.indexOf('specs');
    const remaining = pathParts.slice(specsIdx + 1);

    let slug = null;

    if (remaining.length >= 2) {
      const routeKey = `${remaining[0]}/${remaining[1]}`;
      slug = ROUTE_MAP[routeKey];
      if (!slug) {
        const reversed = `${remaining[1]}/${remaining[0]}`;
        slug = ROUTE_MAP[reversed];
        if (slug) {
          const canonical = REDIRECT_MAP[slug];
          if (canonical) {
            res.writeHead(301, { Location: `${prefix}/specs/${canonical}` });
            return res.end();
          }
        }
      }
    }

    if (!slug && remaining.length === 1) {
      const oldSlug = remaining[0];
      if (SPECS_DATA[oldSlug]) {
        const redirect = REDIRECT_MAP[oldSlug];
        if (redirect) {
          const newUrl = `${prefix}/specs/${redirect}`;
          res.writeHead(301, { Location: newUrl });
          return res.end();
        }
      }
      slug = oldSlug;
    }

    if (!slug || !SPECS_DATA[slug]) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

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
