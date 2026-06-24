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

const COMMON_RULES = {
  ko: [
    '촬영한지 6개월 이내의 사진이어야 합니다.',
    '이마, 눈썹, 귀까지 얼굴전체가 나와야 합니다.',
    '어깨선이 나올수 있도록 머리는 뒤로 넘기는게 좋습니다.',
    '컬러렌즈, 반짝임이 심한 악세사리는 피하는게 좋습니다.',
    '시선은 정면을 응시해야 합니다.',
    '치아가 보이면 안됩니다.',
    '흰색 또는 밝은색 상의는 배경과 구분이 어려울 수 있으므로 피하는 것이 좋습니다.',
  ],
  ja: [
    '撮影から6ヶ月以内の写真でなければなりません。',
    '額、眉、耳まで顔全体が写っている必要があります。',
    '肩のラインが見えるよう、髪は後ろに流すのが望ましいです。',
    'カラーコンタクト、光沢の強いアクセサリーは避けてください。',
    '視線は正面を向いてください。',
    '歯が見えてはいけません。',
    '白色や明るい色の上着は背景と区別がつきにくいため、避けることをお勧めします。',
  ],
  en: [
    'The photo must be taken within the last 6 months.',
    'Your full face including forehead, eyebrows, and ears must be visible.',
    'Hair should be swept back so that the shoulder line is visible.',
    'Avoid colored contact lenses and reflective accessories.',
    'Eyes must be looking directly at the camera.',
    'Teeth must not be visible.',
    'White or light-colored tops may blend with the background and should be avoided.',
  ],
};

const SPECS_I18N = {
  ko: {
    hubTitle: '증명사진 규격 가이드 — 국가별·용도별 사이즈 총정리 | MONKOS',
    hubDesc: '한국 여권·반명함, 일본 패스포트·이력서, 미국 비자 등 증명사진 규격을 한눈에. 사이즈·배경·복장 기준과 반려 사유까지.',
    hubH1: '증명사진 규격 가이드',
    hubSub: '전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보',
    detailSuffix: '규격 — 사이즈·배경·복장 완벽 가이드 | MONKOS',
    tableHeaders: { size: '사이즈', pixels: '해상도', dpi: 'DPI', background: '배경', headHeight: '머리 높이', validity: '유효기간', fileSpec: '파일 규격' },
    commonRulesTitle: '공통 규정',
    detailsTitle: '세부 규정',
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
    sameCountryLabel: '다른 사이즈 증명사진',
    specLabel: '규격 보기',
    heroGlobal: 'GLOBAL PHOTO SPEC GUIDE',
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
    ctaBadge: '20년 경력 사진작가의 AI · 3분이면 완성',
    ctaHeadline1: '셀카 한 장으로',
    ctaHeadline2: '증명사진 완성',
    ctaSub: '사진관 안 가도 됩니다. 여권·이력서·비자 규격 자동 대응.\nAI가 배경·조명·피부를 사진관 수준으로 보정합니다.',
    ctaBtn: '무료로 체험하기 →',
    ctaPrice: '첫 로그인 시 무료 체험 · 이후 1장 ₩9,900',
    heroLabel: 'PHOTO SPEC GUIDE',
    heroCta: '무료 규격 맞춤 →',
  },
  ja: {
    hubTitle: '証明写真 規格ガイド — 国別・用途別サイズ総まとめ | MONKOS',
    hubDesc: '韓国パスポート・半名刺、日本パスポート・履歴書、米国ビザなど証明写真規格を一覧で。サイズ・背景・服装基準と却下理由まで。',
    hubH1: '証明写真 規格ガイド',
    hubSub: '世界200カ国以上のパスポート・ビザなど証明写真規格情報',
    detailSuffix: '規格 — サイズ・背景・服装 完全ガイド | MONKOS',
    tableHeaders: { size: 'サイズ', pixels: '解像度', dpi: 'DPI', background: '背景', headHeight: '頭の高さ', validity: '有効期限', fileSpec: 'ファイル規格' },
    commonRulesTitle: '共通規定',
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
    sameCountryLabel: '他サイズの証明写真',
    specLabel: '規格を見る',
    heroGlobal: 'GLOBAL PHOTO SPEC GUIDE',
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
    ctaBadge: 'プロカメラマン20年のAI · 3分で完成',
    ctaHeadline1: 'セルフィー1枚で',
    ctaHeadline2: '証明写真完成',
    ctaSub: '写真館に行かなくても大丈夫。パスポート・履歴書・ビザ規格に自動対応。\nAIが背景・照明・肌を写真館レベルに補正します。',
    ctaBtn: '無料で体験する →',
    ctaPrice: '初回ログイン時 無料体験 · 以降1枚 ¥990',
    heroLabel: 'PHOTO SPEC GUIDE',
    heroCta: '無料で規格に合わせる →',
  },
  en: {
    hubTitle: 'ID Photo Specifications Guide — Size & Requirements by Country | MONKOS',
    hubDesc: 'Korea passport & resume, Japan passport & resume, US visa photo specs at a glance. Size, background, dress code and rejection reasons.',
    hubH1: 'ID Photo Specifications Guide',
    hubSub: 'ID photo specifications for 200+ countries — passport, visa, and more.',
    detailSuffix: 'Specs — Size, Background & Dress Code Complete Guide | MONKOS',
    tableHeaders: { size: 'Size', pixels: 'Resolution', dpi: 'DPI', background: 'Background', headHeight: 'Head Height', validity: 'Validity', fileSpec: 'File Spec' },
    commonRulesTitle: 'Common Requirements',
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
    sameCountryLabel: 'Other Size ID Photos',
    specLabel: 'View specs',
    heroGlobal: 'GLOBAL PHOTO SPEC GUIDE',
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
    ctaBadge: '20 Years of Photography Expertise in AI · Done in 3 min',
    ctaHeadline1: 'One Selfie,',
    ctaHeadline2: 'Perfect ID Photo',
    ctaSub: 'No photo studio needed. Auto-fit for passport, resume & visa specs.\nAI retouches background, lighting & skin to studio quality.',
    ctaBtn: 'Try Free →',
    ctaPrice: 'Free on first login · $7.99 per photo after',
    heroLabel: 'PHOTO SPEC GUIDE',
    heroCta: 'Crop to this spec for free →',
  },
};

// ─── CONTINENT META ─────────────────────────────────────────────

const CONTINENT_META = [
  { id: 'asia', ko: '아시아', ja: 'アジア', en: 'Asia', gradient: ['#1A3A2A', '#2D5A3A'], dot: '#6c4fff', image: 'cont_asia' },
  { id: 'europe', ko: '유럽', ja: 'ヨーロッパ', en: 'Europe', gradient: ['#1A1A3A', '#3A2A5A'], dot: '#A78BFA', image: 'cont_europe' },
  { id: 'americas', ko: '아메리카', ja: 'アメリカ大陸', en: 'Americas', gradient: ['#1A2A3A', '#2A3A5A'], dot: '#3B82F6', image: 'cont_americas' },
  { id: 'africa', ko: '아프리카', ja: 'アフリカ', en: 'Africa', gradient: ['#3A2A1A', '#5A3A1A'], dot: '#FFB020', image: 'cont_africa' },
  { id: 'oceania', ko: '오세아니아', ja: 'オセアニア', en: 'Oceania', gradient: ['#1A2A2A', '#1A3A4A'], dot: '#FF6B9D', image: 'cont_oceania' },
  { id: 'middleeast', ko: '중동', ja: '中東', en: 'Middle East', gradient: ['#2A2A1A', '#4A3A1A'], dot: '#F59E0B', image: 'cont_middleeast' },
];

// ─── TYPE CATEGORIES (4 purposes) ───────────────────────────────

const TYPE_CATEGORIES = [
  { id: 'passport', ko: '여권', ja: 'パスポート', en: 'Passport', sub: 'PASSPORT', icon: '', image: 'card_passport', slugs: ['passport'] },
  { id: 'visa', ko: '비자', ja: 'ビザ', en: 'Visa', sub: 'VISA', icon: '', image: 'card_visa', slugs: ['visa', 'schengen-visa', 'e-visa'] },
  { id: 'id', ko: '신분증', ja: '身分証', en: 'ID Card', sub: 'ID', icon: '', image: 'card_license', slugs: ['id', 'drivers-license', 'license', 'intl-license', 'mynumber', 'halfcard', 'resident', 'zairyu', 'exam', 'youth-id', 'taxi', 'marine'] },
  { id: 'custom', ko: '기타', ja: 'その他', en: 'Custom', sub: 'CUSTOM', icon: '', image: 'card_custom', slugs: ['resume', 'headshot'] },
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

// 6/19 슬러그 체계 변경(fe0a38f3)으로 통폐합된 옛 type → 새 type.
// 색인된 옛 URL(/specs/korea-drivers-license 등) 301 복구용. 검증되는 대로 확장.
const TYPE_ALIASES = {
  'drivers-license': 'license',   // 운전면허
  'resident': 'id',               // 주민등록증 → 신분증
  'mynumber': 'id',               // 마이넘버카드 → 신분증
  'zairyu': 'residence',          // 재류카드 → 거주
  // 'halfcard'(반명함)는 신규 데이터에 정본 없음 → 404(noindex) 유지
};

// 404 시 text/plain 대신 HTML 반환 — 모바일 Safari의 .txt 다운로드 오인 방지 + UX
function specs404Html(prefix, lang) {
  const msg = lang === 'ja' ? 'お探しの規格ページが見つかりません。'
    : lang === 'en' ? 'The requested spec page was not found.'
    : '요청하신 규격 페이지를 찾을 수 없습니다.';
  const cta = lang === 'ja' ? '証明写真の規格一覧へ' : lang === 'en' ? 'Browse all photo specs' : '증명사진 규격 전체 보기';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 · MONKOS</title></head><body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:64px 20px;color:#222"><h1 style="font-size:48px;margin:0">404</h1><p style="color:#666">${msg}</p><p><a href="${prefix}/specs" style="color:#6b4eff;text-decoration:none">${cta} →</a></p></body></html>`;
}

function countryFlag(countrySlug, size = 32) {
  const code = (COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug).toLowerCase();
  if (code.length !== 2) return '';
  const w = size;
  const h = Math.round(size * 0.75);
  return `<img src="https://flagcdn.com/w${w * 2}/${code}.webp" alt="${code}" width="${w}" height="${h}" class="flag-icon" loading="lazy">`;
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
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
body { background: #ffffff !important; color: #1a1a1a !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important; }
.container { max-width: 1000px; }
a { color: #6c4fff; }
a:hover { color: #5a3de6; }

/* === Hub Hero === */
.specs-hub-hero { text-align: center; padding: 48px 20px 32px; }
.specs-hub-hero .hero-global {
  font-size: 12px; letter-spacing: 3px; color: #6c4fff; font-weight: 600;
  font-family: monospace; margin-bottom: 14px;
}
.specs-hub-hero h1 { font-size: 32px; font-weight: 800; color: #1a1a1a; margin-bottom: 12px; }
.specs-hub-hero .hero-sub { font-size: 15px; color: #888; line-height: 1.7; max-width: 520px; margin: 0 auto 28px; }
.specs-hub-stats { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
.specs-hub-stat { text-align: center; }
.specs-hub-stat .stat-num { font-size: 32px; font-weight: 800; color: #6c4fff; font-family: monospace; }
.specs-hub-stat .stat-label { font-size: 12px; color: #888; margin-top: 2px; }

/* === Purpose Cards (2×2) === */
.purpose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.purpose-card {
  position: relative; height: 100px; border-radius: 12px; overflow: hidden;
  cursor: pointer; border: 1px solid rgba(0,0,0,0.08);
  transition: border-color 0.2s, transform 0.15s;
}
.purpose-card:hover { border-color: rgba(108,79,255,0.3); transform: translateY(-2px); }
.purpose-card.active { border-color: #6c4fff; box-shadow: 0 0 20px rgba(108,79,255,0.15); }
.purpose-card img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.purpose-card .overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.purpose-card .p-name { font-size: 18px; font-weight: 800; color: #1a1a1a; }
.purpose-card .p-sub { font-size: 10px; font-weight: 700; color: #6c4fff; letter-spacing: 2px; font-family: monospace; }

/* === Continent Cards (2×3) === */
.section-title { font-size: 13px; color: #888; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.section-title .back-btn {
  color: #6c4fff; cursor: pointer; font-size: 13px; border: none; background: none;
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
.country-card:hover { border-color: rgba(108,79,255,0.3); transform: translateY(-1px); color: inherit; }
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
.specs-search-wrap input:focus { border-color: #6c4fff; }
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
.specs-search-item:hover { background: rgba(108,79,255,0.08); }
.specs-search-item:last-child { border-bottom: none; }
.flag-icon { border-radius: 4px; vertical-align: middle; display: inline-block; object-fit: cover; }
.specs-search-item .si-flag { font-size: 18px; line-height: 0; }
.specs-search-item .flag-icon { width: 24px; height: 18px; border-radius: 3px; }
.cc-flag .flag-icon { width: 32px; height: 24px; border-radius: 4px; }
.specs-hero-text h1 .flag-icon { height: 40px; width: auto; border-radius: 5px; margin-right: 8px; vertical-align: middle; position: relative; top: -0.1em; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.specs-search-item .si-meta { font-size: 12px; color: #888; margin-left: auto; }

/* === Hub Footer === */
.specs-hub-footer { text-align: center; padding: 24px 0; margin-top: 32px; font-size: 12px; color: #888; border-top: 1px solid rgba(0,0,0,0.08); }

/* ================================================================
   DETAIL PAGE — Clean White Design, Full-width Section Bands
   Accent: #6c4fff | Sections divided by alternating bg color
   ================================================================ */

/* === Section bands — full-width alternating === */
.specs-band {
  margin: 0; padding: 60px 32px; background: #ffffff;
  border-radius: 0;
}
.specs-band .band-inner { max-width: 1000px; margin: 0 auto; }
.specs-band-white { background: #ffffff; }
.specs-band-gray { background: #f5f5f5; }
.specs-band-dark { background: linear-gradient(135deg, #0b1120 0%, #162032 50%, #0f2a3d 100%); }

/* === Detail — Back link === */
.specs-back {
  display: inline-flex; align-items: center; gap: 6px;
  margin-bottom: 16px; font-size: 13px; font-weight: 500;
  color: #6c4fff; text-decoration: none; letter-spacing: 0.2px;
}
.specs-back:hover { text-decoration: underline; }

/* === Detail — Hero (white, clean) === */
.specs-hero-wrap {
  background: #ffffff; padding: 40px 48px 32px;
  min-height: 682px; max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; justify-content: center;
  box-sizing: border-box;
}
.specs-hero {
  display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px;
  align-items: center; max-width: 1000px; margin: 0 auto;
}
.specs-hero-text h1 {
  font-size: 42px; font-weight: 700; color: #1a1a1a;
  line-height: 1.35; margin-bottom: 16px;
}
.specs-hero-text .specs-hero-desc {
  color: #666; font-size: 17px; line-height: 1.7; margin-bottom: 24px;
}
.specs-hero-tags { display: flex; gap: 10px; flex-wrap: wrap; row-gap: 20px; }
.specs-hero-tags span, .specs-hero-tags a span {
  background: rgba(108,79,255,0.1); color: #6c4fff;
  padding: 6px 12px; border-radius: 20px; font-size: 13px;
  font-weight: 600; border: 1px solid rgba(108,79,255,0.2);
  white-space: nowrap;
}
.specs-band-dark .specs-hero-tags span,
.specs-band-dark .specs-hero-tags a span {
  background: rgba(255,255,255,0.08); color: #ffffff;
  border: 1px solid rgba(255,255,255,0.2);
}
.specs-hero-label {
  font-size: 12px; letter-spacing: 2.5px; color: #6c4fff; font-weight: 600;
  font-family: monospace; margin-bottom: 12px; text-transform: uppercase;
}
.specs-hero-cta {
  display: inline-block; margin-top: 24px; padding: 14px 32px;
  background: #6c4fff; color: #fff; font-size: 15px; font-weight: 600;
  border-radius: 10px; text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}
.specs-hero-cta:hover { background: #5a3de6; transform: translateY(-1px); }

/* === PASSED stamp overlay === */
.specs-stamp {
  position: absolute; bottom: 10px; right: -20px;
  width: 216px; height: 216px;
  transform: rotate(-18deg);
  pointer-events: none; z-index: 20;
  opacity: 0.7;
}
.specs-stamp svg { width: 100%; height: 100%; }

/* === Before/After === */
.specs-ba-item { text-align: center; }
.specs-ba-img {
  width: 100%; height: 240px; object-fit: cover; object-position: center top;
  border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); display: block;
}
.specs-ba-label {
  margin-top: 8px; font-size: 11px; font-weight: 700; color: #888;
  letter-spacing: 2px;
}
.specs-ba-label-after { color: #6c4fff; }

/* === Crop tool — 3-panel === */
.specs-crop-tool { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.specs-crop-panel {
  height: 300px; border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; box-sizing: border-box;
}
.specs-crop-upload {
  background: #ffffff; border: 2px dashed rgba(0,0,0,0.12);
  cursor: pointer;
}
.specs-crop-preview {
  background: #f0f1f5; border: 1px solid rgba(0,0,0,0.06);
}
.specs-crop-preview img {
  width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block;
}
.specs-crop-preview .crop-placeholder {
  color: #bbb; font-size: 14px; text-align: center;
}
.specs-crop-preview .crop-placeholder-icon {
  font-size: 40px; margin-bottom: 8px; opacity: 0.3;
}
.specs-crop-label {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 0;
  text-align: center; background: rgba(0,0,0,0.5); color: #fff;
  font-size: 11px; font-weight: 700; letter-spacing: 2px;
}
.specs-crop-label-after { background: rgba(108,79,255,0.7); }

@media (max-width: 768px) {
  .specs-crop-tool { grid-template-columns: 1fr 1fr; gap: 10px; }
  .specs-crop-upload { grid-column: 1 / -1; height: auto; min-height: 160px; padding: 24px 20px; }
  .specs-crop-panel { height: 200px; }
}

/* === Detail — Photo Diagram === */
.specs-diagram {
  background: transparent; border-radius: 0; padding: 20px 60px 40px 50px;
  display: flex; justify-content: center; align-items: center;
  position: relative;
}
.specs-photo-frame {
  width: 175px; height: 225px; background: #e0e2e6;
  border: 1px solid rgba(0,0,0,0.08); border-radius: 4px;
  position: relative; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  overflow: visible;
}
.specs-photo-frame img { border-radius: 4px; position: relative; z-index: 1; }
.specs-stamp { z-index: 20 !important; }
.specs-photo-frame img {
  object-fit: cover; width: 100%; height: 100%; display: block;
}
.specs-photo-frame svg { opacity: 0.12; }

/* Guide lines */
.specs-guide-w {
  position: absolute; bottom: -28px; left: 0; right: 0;
  text-align: center; font-size: 12px; color: #6c4fff; font-weight: 600;
}
.specs-guide-h {
  position: absolute; top: 0; bottom: 0; right: -50px;
  display: flex; align-items: center; font-size: 12px;
  color: #6c4fff; font-weight: 600; writing-mode: vertical-rl;
}
.specs-guide-h::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: -8px;
  width: 1px; background: rgba(108,79,255,0.4);
}
.specs-head-guide {
  position: absolute; top: 18px; left: -45px; height: 144px;
  display: flex; align-items: center; font-size: 11px;
  color: #ef4444; font-weight: 500; writing-mode: vertical-rl;
}
.specs-head-guide::before {
  content: ''; position: absolute; top: 0; bottom: 0; right: -8px;
  width: 1px; background: rgba(239,68,68,0.3);
}

/* === Detail — Common Rules (inside gray card, no extra box) === */
.specs-common-rules {
  list-style: none; padding: 0; margin: 0 0 32px;
}
.specs-common-rule {
  padding: 14px 0; font-size: 16px; color: #333;
  line-height: 1.7; border-bottom: 1px solid rgba(0,0,0,0.06);
}
.specs-common-rule:last-child { border-bottom: none; }

/* === Detail — Section wrapper === */
.specs-section { margin-bottom: 48px; }
.specs-section h2 {
  font-size: 32px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 32px; letter-spacing: -0.3px;
}
.specs-section p { font-size: 14px; color: #666; line-height: 1.8; }

/* Detail sections (categorized) */
.specs-detail-sections { margin-top: 40px; }
.specs-detail-cat { margin-bottom: 32px; }
.specs-detail-cat:last-child { margin-bottom: 0; }
.specs-detail-cat h3 {
  font-size: 18px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 2px solid #6c4fff;
  display: inline-block;
}
.specs-detail-cat ul {
  list-style: none; padding: 0; margin: 0;
}
.specs-detail-cat li {
  padding: 12px 0; font-size: 16px; color: #555;
  line-height: 1.7; border-bottom: 1px solid rgba(0,0,0,0.04);
  padding-left: 18px; position: relative;
}
.specs-detail-cat li:last-child { border-bottom: none; }
.specs-detail-cat li::before {
  content: ''; position: absolute; left: 0; top: 18px;
  width: 6px; height: 6px; border-radius: 50%;
  background: #6c4fff;
}

/* AI summary box */
.specs-ai-summary {
  background: linear-gradient(135deg, rgba(108,79,255,0.05) 0%, rgba(108,79,255,0.015) 100%);
  border-left: 3px solid #6c4fff; padding: 18px 22px;
  border-radius: 0 14px 14px 0; margin-bottom: 24px;
  font-size: 16px; color: #333; line-height: 1.7;
}

/* Specs table */
.specs-table {
  width: 100%; border-collapse: collapse; border-spacing: 0;
  margin-bottom: 24px; background: transparent;
}
.specs-table th, .specs-table td {
  padding: 14px 20px; text-align: left; font-size: 17px;
}
.specs-table th {
  background: transparent; font-weight: 700; color: #1a1a1a;
  width: 130px; font-size: 15px;
}
.specs-table td { color: #555; font-weight: 500; }
.specs-table tr:not(:last-child) th,
.specs-table tr:not(:last-child) td {
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

/* Detail items grid */
.specs-details-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.specs-detail-item {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; background: #ffffff; border-radius: 10px;
  font-size: 16px; color: #555; line-height: 1.5;
  border: 1px solid rgba(0,0,0,0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.specs-detail-item:hover {
  border-color: rgba(108,79,255,0.25);
  box-shadow: 0 2px 8px rgba(108,79,255,0.06);
}

/* === Detail — O/X Compare === */
.specs-ox-compare {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-bottom: 36px;
}
.specs-ox-card {
  background: #ffffff; border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02);
  transition: box-shadow 0.2s;
}
.specs-ox-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.specs-ox-card.ox-good { border-color: rgba(34,197,94,0.3); }
.specs-ox-card.ox-bad { border-color: rgba(239,68,68,0.3); }
.specs-ox-header {
  padding: 12px 18px; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; gap: 8px;
}
.specs-ox-card.ox-good .specs-ox-header {
  background: rgba(34,197,94,0.06); color: #16a34a;
}
.specs-ox-card.ox-bad .specs-ox-header {
  background: rgba(239,68,68,0.06); color: #dc2626;
}
.specs-ox-body {
  padding: 24px; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: #f8f9fb; min-height: 180px;
}
.specs-ox-photo {
  width: 120px; height: 154px; background: #e0e2e6;
  border: 1px solid rgba(0,0,0,0.08); border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.specs-ox-card.ox-good .specs-ox-photo { border-color: rgba(34,197,94,0.4); }
.specs-ox-card.ox-bad .specs-ox-photo { border-color: rgba(239,68,68,0.4); }
.specs-ox-photo svg { opacity: 0.2; }
.specs-ox-caption {
  margin-top: 10px; font-size: 12px; color: #888; text-align: center;
}
.specs-ox-points {
  padding: 14px 18px; border-top: 1px solid rgba(0,0,0,0.05);
  list-style: none; margin: 0;
}
.specs-ox-points li {
  font-size: 13px; color: #666; padding: 4px 0;
  display: flex; align-items: center; gap: 6px;
}

/* === Detail — Rejection Checklist === */
.specs-rejection-list {
  list-style: none; padding: 0; margin: 0;
}
.specs-rejection-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 17px; color: #333; line-height: 1.5;
}
.specs-rejection-item:last-child { border-bottom: none; }
.specs-rj-x {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(239,68,68,0.08);
  color: #dc2626; font-weight: 700; font-size: 16px;
}

/* === Detail — FAQ Accordion === */
.specs-faq { list-style: none; padding: 0; }
.specs-faq-item {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px; margin-bottom: 10px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s;
}
.specs-faq-item:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.specs-faq-q {
  padding: 18px 22px; font-weight: 600; font-size: 17px; color: #1a1a1a;
  cursor: pointer; display: flex; align-items: center; gap: 12px;
  user-select: none; transition: background 0.15s;
}
.specs-faq-q:hover { background: rgba(0,0,0,0.015); }
.specs-faq-q::before {
  content: "Q"; color: #6c4fff; font-weight: 800; font-size: 14px;
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%;
  background: rgba(108,79,255,0.08); display: flex;
  align-items: center; justify-content: center;
}
.specs-faq-q::after {
  content: "\\25BE"; margin-left: auto; color: #aaa; font-size: 14px;
  transition: transform 0.25s ease;
}
.specs-faq-item.open .specs-faq-q::after { transform: rotate(180deg); }
.specs-faq-a {
  padding: 0 22px 20px 60px; font-size: 16px; color: #666;
  line-height: 1.8; display: none;
}
.specs-faq-item.open .specs-faq-a { display: block; }

/* === Official Source Link === */
.specs-official-link {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 22px; background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
  color: #1a1a1a; text-decoration: none; font-size: 14px; font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.specs-official-link:hover {
  border-color: rgba(108,79,255,0.3);
  box-shadow: 0 2px 12px rgba(108,79,255,0.08);
}
.specs-external-icon {
  margin-left: auto; color: #6c4fff; font-size: 18px;
  transition: transform 0.2s;
}
.specs-official-link:hover .specs-external-icon {
  transform: translate(2px, -2px);
}

/* === Detail — Online Guide === */
.specs-online-guide { margin-top: 8px; }
.specs-online-section { margin-bottom: 28px; }
.specs-online-section:last-child { margin-bottom: 0; }
.specs-online-section h3 {
  font-size: 18px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 14px; padding-bottom: 8px;
  border-bottom: 2px solid #6c4fff; display: inline-block;
}
.specs-online-section ul { list-style: none; padding: 0; margin: 0; }
.specs-online-section li {
  padding: 10px 0; font-size: 16px; color: #555;
  line-height: 1.7; border-bottom: 1px solid rgba(0,0,0,0.04);
  padding-left: 18px; position: relative;
}
.specs-online-section li:last-child { border-bottom: none; }
.specs-online-section li::before {
  content: ''; position: absolute; left: 0; top: 18px;
  width: 6px; height: 6px; border-radius: 50%; background: #6c4fff;
}
.specs-online-source {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06); border-radius: 12px;
  color: #1a1a1a; text-decoration: none; font-size: 14px; font-weight: 500;
  margin-top: 20px; transition: border-color 0.2s;
}
.specs-online-source:hover { border-color: rgba(108,79,255,0.3); }
.specs-online-source .specs-external-icon { margin-left: auto; color: #6c4fff; }

/* === Detail — CTA Banner === */
.specs-cta-banner {
  text-align: center; padding: 20px 0;
}
.specs-cta-badge {
  display: inline-block; font-size: 13px; color: #b4a0ff;
  margin-bottom: 20px; font-weight: 500;
}
.specs-cta-banner h2 {
  font-size: 28px; font-weight: 800; color: #ffffff;
  line-height: 1.4; margin-bottom: 8px;
}
.specs-cta-banner h2 span {
  color: #b4a0ff;
}
.specs-cta-sub {
  font-size: 14px; color: rgba(255,255,255,0.6);
  line-height: 1.7; margin-bottom: 28px;
}
.specs-cta-btn {
  display: inline-block; padding: 16px 40px;
  background: #6c4fff; color: #fff; font-size: 16px; font-weight: 700;
  border-radius: 12px; text-decoration: none;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 4px 16px rgba(124,58,237,0.3);
}
.specs-cta-btn:hover { background: #5a3de6; transform: translateY(-2px); }
.specs-cta-price {
  margin-top: 14px; font-size: 13px; color: rgba(255,255,255,0.5);
}
.specs-cta-price strong { color: rgba(255,255,255,0.8); }

/* === Detail — Related Content === */
.specs-related {
  margin-top: 40px; padding: 0;
  background: transparent; border: none; border-radius: 0;
  box-shadow: none;
}
.specs-related h3 {
  font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.8);
  margin-bottom: 14px;
}
.specs-related-links { display: flex; flex-wrap: wrap; gap: 10px; }
.specs-related-links a {
  font-size: 13px; color: #6c4fff; text-decoration: none;
  padding: 7px 16px; background: rgba(108,79,255,0.1);
  border-radius: 10px; transition: all 0.2s;
  border: 1px solid rgba(108,79,255,0.15); font-weight: 500;
}
.specs-related-links a:hover {
  background: rgba(108,79,255,0.2); border-color: rgba(108,79,255,0.3);
}

/* === Responsive — Detail page === */
@media (max-width: 768px) {
  .specs-hero-wrap { margin: 0; padding: 24px 20px 32px; }
  .specs-hero { grid-template-columns: 1fr; gap: 24px; }
  .specs-hero-text { text-align: left; }
  .specs-hero-text h1 { font-size: 28px; }
  .specs-hero-text .specs-hero-desc { text-align: left; }
  .specs-hero-tags { justify-content: flex-start; gap: 8px; row-gap: 18px; }
  .specs-hero-tags span, .specs-hero-tags a span { font-size: 12px; padding: 5px 10px; }
  .specs-back { display: block; text-align: left; margin-bottom: 12px; }
  .specs-diagram { margin-bottom: 8px; padding: 20px 36px; }
  .specs-details-grid { grid-template-columns: 1fr; }
  .specs-ox-compare { grid-template-columns: 1fr; }
  .specs-rejection-item { padding: 14px 0; font-size: 14px; }
  .specs-cta-banner h2 { font-size: 22px; }
  .specs-cta-btn { padding: 14px 32px; font-size: 15px; }
  .specs-related { padding: 20px 22px; }
  .specs-common-rule { padding: 16px 20px; }
  .specs-faq-q { padding: 16px 18px; }
  .specs-faq-a { padding: 0 18px 18px 52px; }
}
/* === Responsive — Hub page === */
@media (max-width: 768px) {
  .purpose-grid { grid-template-columns: 1fr 1fr; }
  .continent-grid { grid-template-columns: 1fr; }
  .country-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .purpose-grid { grid-template-columns: 1fr; }
  .specs-hero-text h1 { font-size: 22px; }
  .specs-diagram { padding: 28px 24px; }
  .specs-photo-frame { width: 140px; height: 180px; }
  .specs-guide-h { right: -44px; }
  .specs-head-guide { left: -38px; }
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

// ─── SPECS V2 — kr-passport 카드형 리디자인 ────────────────────

const V2_SLUGS = new Set(['kr-passport']);

const SPECS_V2_STYLE = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
body { background: #ffffff !important; color: #1a1a1a !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important; }
.container { max-width: 1000px; }
a { color: #6c4fff; }
a:hover { color: #5a3de6; }

.v2-wrap { max-width: 960px; margin: 0 auto; padding: 40px 24px 0; }
.v2-breadcrumb { font-size: 13px; color: #888; margin-bottom: 16px; }
.v2-breadcrumb a { color: #6c4fff; text-decoration: none; }
.v2-breadcrumb a:hover { text-decoration: underline; }
.v2-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.v2-tag {
  background: rgba(108,79,255,0.08); color: #6c4fff; padding: 5px 14px;
  border-radius: 20px; font-size: 13px; font-weight: 600; text-decoration: none;
  border: 1px solid rgba(108,79,255,0.15);
}
.v2-tag:hover { background: rgba(108,79,255,0.15); }
.v2-header h1 { font-size: 36px; font-weight: 800; color: #1a1a1a; margin-bottom: 8px; line-height: 1.3; }
.v2-header .v2-sub { font-size: 15px; color: #888; margin-bottom: 40px; }

/* 핵심 규격 카드 — 2컬럼 */
.v2-spec-card {
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px;
  padding: 32px; margin-bottom: 48px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.v2-spec-table { width: 100%; border-collapse: collapse; }
.v2-spec-table tr { border-bottom: 1px solid rgba(0,0,0,0.05); }
.v2-spec-table tr:last-child { border-bottom: none; }
.v2-spec-table th {
  text-align: left; padding: 12px 0; font-size: 14px; color: #888;
  font-weight: 500; width: 110px; vertical-align: top;
}
.v2-spec-table td { padding: 12px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; }
.v2-badge {
  display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px;
  font-weight: 600; margin-left: 8px; vertical-align: middle;
}
.v2-badge-a { background: rgba(108,79,255,0.1); color: #6c4fff; }
.v2-badge-req { background: rgba(239,68,68,0.1); color: #dc2626; }

/* 규격 다이어그램 */
.v2-diagram-wrap {
  display: flex; align-items: center; justify-content: center;
  position: relative; min-height: 280px;
}
.v2-photo-frame {
  width: 160px; height: 206px; background: #e8e9ed; border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08); position: relative;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.v2-photo-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.v2-dim-w {
  position: absolute; bottom: -24px; left: 0; right: 0; text-align: center;
  font-size: 12px; color: #6c4fff; font-weight: 700;
}
.v2-dim-w::before {
  content: ''; position: absolute; bottom: 8px; left: 10%; right: 10%;
  height: 1px; background: rgba(108,79,255,0.3);
}
.v2-dim-h {
  position: absolute; top: 0; bottom: 0; right: -40px;
  display: flex; align-items: center; font-size: 12px;
  color: #6c4fff; font-weight: 700; writing-mode: vertical-rl;
}
.v2-dim-h::before {
  content: ''; position: absolute; top: 5%; bottom: 5%; left: -8px;
  width: 1px; background: rgba(108,79,255,0.3);
}
.v2-dim-head {
  position: absolute; top: 10px; left: -36px; height: 130px;
  display: flex; align-items: center; font-size: 11px;
  color: #ef4444; font-weight: 600; writing-mode: vertical-rl;
}
.v2-dim-head::before {
  content: ''; position: absolute; top: 0; bottom: 0; right: -6px;
  width: 1px; background: rgba(239,68,68,0.3);
}

/* 3스텝 플로우 */
.v2-steps-section {
  background: #f7f7fb; border-radius: 20px; padding: 40px 32px;
  margin-bottom: 48px;
}
.v2-steps-title { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
.v2-steps-sub { font-size: 14px; color: #888; margin-bottom: 8px; }
.v2-steps-badge {
  display: inline-block; background: rgba(108,79,255,0.1); color: #6c4fff;
  font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px;
  margin-bottom: 28px;
}
.v2-check-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.v2-photo-side { display: flex; flex-direction: column; align-items: center; }
.v2-checklist-side {
  background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
  padding: 24px; min-height: 280px;
}
.v2-checklist-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; letter-spacing: 0.5px; }
.v2-checklist-loading { display: flex; align-items: center; gap: 10px; padding: 16px 0; }
.v2-checklist-items { list-style: none; padding: 0; margin: 0; }
.v2-checklist-items li {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 14px; color: #333;
}
.v2-checklist-items li:last-child { border-bottom: none; }
.v2-check-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.v2-check-pass { background: rgba(34,197,94,0.12); color: #16a34a; }
.v2-check-fail { background: rgba(239,68,68,0.12); color: #dc2626; }
.v2-check-warn { background: rgba(245,158,11,0.12); color: #d97706; }
.v2-checklist-summary { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; }
.v2-summary-pass { background: rgba(34,197,94,0.08); color: #16a34a; }
.v2-summary-fail { background: rgba(239,68,68,0.08); color: #dc2626; }
.v2-action-buttons { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.v2-action-btn {
  flex: 1; min-width: 100px; padding: 12px 8px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; border: 1px solid rgba(0,0,0,0.1);
  background: #fff; color: #333; transition: all 0.2s; text-align: center;
}
.v2-action-btn:hover { border-color: #6c4fff; color: #6c4fff; }
.v2-btn-retouch { background: #6c4fff; color: #fff !important; border-color: #6c4fff; }
.v2-btn-retouch:hover { background: #5a3de6; }
.v2-btn-premier { background: #1a1a1a; color: #fff !important; border-color: #1a1a1a; }
.v2-btn-premier:hover { background: #333; }
.v2-credit { font-size: 11px; opacity: 0.8; margin-left: 4px; }

/* Phase 2: 결제 */
.v2-pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.v2-pay-preview { text-align: center; }
.v2-pay-preview img { max-width: 200px; max-height: 260px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); }
.v2-change-photo { margin-top: 12px; background: none; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 6px 16px; font-size: 12px; color: #666; cursor: pointer; }
.v2-change-photo:hover { border-color: #6c4fff; color: #6c4fff; }
.v2-pay-options { display: flex; flex-direction: column; gap: 12px; }
.v2-pay-btn {
  width: 100%; padding: 20px 24px; border-radius: 14px; cursor: pointer;
  text-align: left; border: 2px solid rgba(0,0,0,0.08); background: #fff; transition: all 0.2s;
}
.v2-pay-btn:hover { border-color: #6c4fff; box-shadow: 0 4px 16px rgba(108,79,255,0.1); }
.v2-pay-instant { border-color: #6c4fff; }
.v2-pay-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.v2-pay-price { font-size: 24px; font-weight: 800; color: #6c4fff; margin-bottom: 6px; }
.v2-pay-desc { font-size: 12px; color: #888; }
.v2-pay-divider { text-align: center; color: #ccc; font-size: 12px; position: relative; }
.v2-pay-divider span { background: #f5f5f7; padding: 0 12px; position: relative; z-index: 1; }
.v2-pay-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px solid #e5e5e5; }

/* Phase 3: 생성 중 */
.v2-generating { text-align: center; padding: 60px 0; }
.v2-gen-text { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 16px; }
.v2-gen-sub { font-size: 13px; color: #888; margin-top: 6px; }

/* Phase 4: 결과 */
.v2-result-grid { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px; }
.v2-result-before, .v2-result-after { text-align: center; }
.v2-result-label { font-size: 12px; font-weight: 600; color: #888; margin-bottom: 8px; }
.v2-result-before img, .v2-result-after img { max-width: 180px; max-height: 240px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); }
.v2-result-arrow { font-size: 28px; color: #ccc; font-weight: 300; }
.v2-result-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.v2-download-btn {
  background: #6c4fff; color: #fff; border: none; padding: 14px 40px;
  border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer;
}
.v2-download-btn:hover { background: #5a3de6; }

/* 스텝1 — 업로드 */
.v2-upload-zone {
  width: 100%; border: 2px dashed rgba(108,79,255,0.25); border-radius: 12px;
  padding: 32px 16px; cursor: pointer; transition: border-color 0.2s, background 0.2s;
  display: flex; flex-direction: column; align-items: center;
}
.v2-upload-zone:hover, .v2-upload-zone.dragover { border-color: #6c4fff; background: rgba(108,79,255,0.03); }
.v2-upload-zone .v2-upload-icon { font-size: 32px; color: #bbb; margin-bottom: 8px; }
.v2-upload-zone .v2-upload-btn {
  padding: 8px 20px; border: 1.5px solid #6c4fff; border-radius: 8px;
  color: #6c4fff; font-size: 13px; font-weight: 600; background: none; cursor: pointer;
  margin-top: 8px;
}
.v2-upload-zone .v2-upload-hint { font-size: 11px; color: #bbb; margin-top: 6px; }

/* 스텝2 — 프리뷰 */
.v2-preview-box {
  width: 140px; height: 180px; background: #f0f1f5; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.06); position: relative;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.v2-preview-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
.v2-preview-overlay {
  position: absolute; top: 8px; right: 8px; background: rgba(108,79,255,0.85);
  color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px;
}
.v2-preview-check {
  position: absolute; bottom: 8px; right: 8px; width: 24px; height: 24px;
  background: #22c55e; border-radius: 50%; color: #fff; font-size: 14px;
  display: none; align-items: center; justify-content: center;
}
.v2-preview-check.show { display: flex; }

/* 스텝3 — 다운로드 */
.v2-download-btn {
  display: none; padding: 12px 28px; background: #6c4fff; color: #fff;
  font-size: 14px; font-weight: 700; border: none; border-radius: 10px;
  cursor: pointer; transition: background 0.2s;
}
.v2-download-btn:hover { background: #5a3de6; }
.v2-download-btn.show { display: inline-block; }

/* 스텝 로딩 */
.v2-step-loading {
  display: none; flex-direction: column; align-items: center; gap: 10px;
}
.v2-step-loading.show { display: flex; }
.v2-spinner {
  width: 32px; height: 32px; border: 3px solid rgba(108,79,255,0.2);
  border-top-color: #6c4fff; border-radius: 50%; animation: v2spin 0.8s linear infinite;
}
@keyframes v2spin { to { transform: rotate(360deg); } }

/* 상세규정 + 반려사유 2컬럼 */
.v2-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 48px; }
.v2-detail-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px;
  padding: 28px; box-shadow: 0 1px 6px rgba(0,0,0,0.03);
}
.v2-detail-card h3 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px; }
.v2-detail-list { list-style: none; padding: 0; margin: 0; }
.v2-detail-list li {
  padding: 10px 0; font-size: 14px; color: #555; line-height: 1.7;
  border-bottom: 1px solid rgba(0,0,0,0.04); padding-left: 16px; position: relative;
}
.v2-detail-list li:last-child { border-bottom: none; }
.v2-detail-list li::before {
  content: ''; position: absolute; left: 0; top: 16px;
  width: 5px; height: 5px; border-radius: 50%; background: #6c4fff;
}
.v2-reject-list { list-style: none; padding: 0; margin: 0; counter-reset: rj; }
.v2-reject-list li {
  padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.04);
  counter-increment: rj;
}
.v2-reject-list li:last-child { border-bottom: none; }
.v2-rj-title {
  font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px;
  display: flex; align-items: center; gap: 8px;
}
.v2-rj-title::before {
  content: counter(rj); flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
  background: rgba(239,68,68,0.08); color: #dc2626; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.v2-rj-desc { font-size: 13px; color: #888; padding-left: 30px; }

/* 같은 규격 서류 */
.v2-same-section { margin-bottom: 48px; }
.v2-same-section h2 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
.v2-same-sub { font-size: 14px; color: #888; margin-bottom: 20px; }
.v2-same-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.v2-same-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 16px 20px; text-decoration: none; color: #1a1a1a;
  display: flex; align-items: center; gap: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.v2-same-card:hover { border-color: rgba(108,79,255,0.3); box-shadow: 0 2px 10px rgba(108,79,255,0.08); }
.v2-same-icon { font-size: 20px; }
.v2-same-name { font-size: 14px; font-weight: 600; }
.v2-same-size { font-size: 12px; color: #888; }
.v2-same-note { font-size: 11px; color: #ef4444; }

/* FAQ */
.v2-faq-section { margin-bottom: 48px; }
.v2-faq-section h2 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 20px; }
.v2-faq-item {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 12px;
  margin-bottom: 8px; overflow: hidden;
}
.v2-faq-q {
  padding: 16px 20px; font-weight: 600; font-size: 15px; color: #1a1a1a;
  cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none;
}
.v2-faq-q:hover { background: rgba(0,0,0,0.015); }
.v2-faq-q::before {
  content: 'Q'; color: #6c4fff; font-weight: 800; font-size: 12px;
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
  background: rgba(108,79,255,0.08); display: flex;
  align-items: center; justify-content: center;
}
.v2-faq-q::after {
  content: '\\25BE'; margin-left: auto; color: #aaa; font-size: 13px;
  transition: transform 0.25s;
}
.v2-faq-item.open .v2-faq-q::after { transform: rotate(180deg); }
.v2-faq-a {
  padding: 0 20px 16px 54px; font-size: 14px; color: #666;
  line-height: 1.8; display: none;
}
.v2-faq-item.open .v2-faq-a { display: block; }

/* CTA 배너 */
.v2-cta-banner {
  background: linear-gradient(135deg, #6c4fff 0%, #9f7afe 100%);
  border-radius: 20px; padding: 48px 32px; text-align: center; margin-bottom: 48px;
}
.v2-cta-banner h2 { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.v2-cta-banner .v2-cta-sub { font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 24px; }
.v2-cta-btn-main {
  display: inline-block; padding: 14px 36px; background: #fff; color: #6c4fff;
  font-size: 15px; font-weight: 700; border-radius: 10px; text-decoration: none;
  transition: transform 0.15s; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.v2-cta-btn-main:hover { transform: translateY(-2px); }

/* 에러 메시지 */
.v2-error-msg { display: none; color: #dc2626; font-size: 13px; margin-top: 8px; text-align: center; }
.v2-error-msg.show { display: block; }

/* 반응형 */
@media (max-width: 768px) {
  .v2-wrap { padding: 24px 16px 0; }
  .v2-header h1 { font-size: 26px; }
  .v2-spec-card { grid-template-columns: 1fr; gap: 24px; }
  .v2-check-layout { grid-template-columns: 1fr; }
  .v2-action-buttons { flex-direction: column; }
  .v2-pay-grid { grid-template-columns: 1fr; }
  .v2-result-grid { flex-direction: column; }
  .v2-result-arrow { transform: rotate(90deg); }
  .v2-steps-section { padding: 28px 20px; }
  .v2-detail-grid { grid-template-columns: 1fr; }
  .v2-same-grid { flex-direction: column; }
}
`;

const V2_REJECTIONS_KO = [
  { title: '배경 그림자 / 음영', desc: '얼굴 앞·뒤로 그림자가 생긴 경우' },
  { title: '머리 높이 규격 초과', desc: '정수리~턱이 32-36mm 범위를 벗어남' },
  { title: '표정 · 미소', desc: '입을 벌리거나 치아가 보이는 사진' },
  { title: '안경 반사 / 컬러렌즈', desc: '렌즈에 빛 반사 또는 색조 렌즈 착용' },
  { title: '앞머리·장신구로 얼굴 가림', desc: '이마·눈썹·귀 윤곽이 가려진 경우' },
];

const V2_DETAILS_KO = [
  '촬영 6개월 이내, 정면을 응시한 상반신 사진',
  '균일한 흰색 배경, 그림자·무늬·테두리 없음',
  '입은 다물고 무표정 — 치아가 보이면 반려',
  '안경 착용 시 빛 반사·뿔테로 눈 가림 금지 (운전면허는 무안경 권장)',
  '머리카락·장신구로 얼굴 윤곽을 가리지 않을 것',
  '컬러 사진, 자연스러운 피부 톤 · 과도한 보정 금지',
];

const V2_FAQ_FALLBACK = [
  { q: '여권사진과 운전면허증 사진이 같나요?', a: '네, 대한민국 여권과 운전면허증은 모두 35×45mm 규격으로 동일합니다. 다만 운전면허증은 안경 미착용을 권장합니다.' },
  { q: 'AI로 만든 얼굴 사진을 제출해도 되나요?', a: '아니요. AI 생성 이미지(딥페이크 등)는 제출 불가합니다. MONKOS AI는 실제 사진의 배경·크기·밝기를 규격에 맞게 보정하는 것이지, 얼굴을 생성하지 않습니다.' },
  { q: '온라인 신청용 파일 규격은 어떻게 되나요?', a: '가로 413 × 세로 531 픽셀, JPEG 형식, 500KB 이하, 300DPI 이상을 권장합니다.' },
];

function specsDetailV2Fragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;

  const { typeSlug, countrySlug } = parseSlug(slug);
  const newPath = `${typeSlug}/${countrySlug}`;
  const countryName = lang === 'en' ? (specData.countryEn || specData.country) : lang === 'ja' ? (specData.countryJa || specData.country) : specData.country;
  const typeName = lang === 'ja' ? (specData.typeJa || specData.type) : (lang === 'en' ? specData.typeEn : specData.type);
  const title = (specData.seoTitle && specData.seoTitle[lang]) || `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = (specData.seoDescription && specData.seoDescription[lang]) || '';

  const canonicalUrl = lang === 'ko' ? `https://monkos.ai/specs/${newPath}` : `https://monkos.ai/${lang}/specs/${newPath}`;
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/${newPath}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/${newPath}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/${newPath}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/${newPath}">`,
  ].join('\n');

  const faqs = (specData.faqs && (specData.faqs[lang] || specData.faqs.ko)) || V2_FAQ_FALLBACK;
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
      "dateModified": "2026-06-24",
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
  ];

  const seoMeta = `<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="https://monkos.ai/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${JSON.stringify(specsJsonLdArr)}</script>`;

  const h = i.tableHeaders;
  const specRows = [
    [h.size, locField(specData, 'size', lang), '<span class="v2-badge v2-badge-a">그룹 A</span>'],
    [h.pixels, locField(specData, 'pixels', lang), ''],
    [h.dpi, String(specData.dpi) + ' 이상', ''],
    [h.background, locField(specData, 'background', lang), ''],
    [h.headHeight, locField(specData, 'headHeight', lang), '<span class="v2-badge v2-badge-req">필수</span>'],
    [h.validity, locField(specData, 'validity', lang), ''],
    ['파일 용량', '500KB 이하', ''],
    ['파일 형식', 'JPEG', ''],
  ].map(([label, val, badge]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}${badge}</td></tr>`
  ).join('');

  const sizeMm = parseSizeMm(specData.size);
  const sizeW = locField(specData, 'size', lang).split('×')[0].trim();
  const sizeH = (locField(specData, 'size', lang).split('×')[1] || '4.5cm').trim();
  const imgSrc = `/images/guides/${slug}.webp`;
  const fallbackSrc = sizeMm ? `/images/guides/${sizeMm}.webp` : '';

  const detailItems = (specData.detailSections && specData.detailSections[lang])
    ? specData.detailSections[lang].flatMap(s => s.items)
    : V2_DETAILS_KO;
  const detailHtml = detailItems.map(d => `<li>${escapeHtml(d)}</li>`).join('');

  const rejections = V2_REJECTIONS_KO;
  const rejectHtml = rejections.map(r =>
    `<li><div class="v2-rj-title">${escapeHtml(r.title)}</div><div class="v2-rj-desc">${escapeHtml(r.desc)}</div></li>`
  ).join('');

  const sameSize = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameHtml = sameSize.map(s => {
    const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
    const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
    const note = name.includes('운전면허') ? '<div class="v2-same-note">무안경 권장</div>' : '';
    return `<a href="${prefix}/specs/${ts}/${cs}" class="v2-same-card">
      <span class="v2-same-icon">📄</span>
      <div><div class="v2-same-name">${escapeHtml(name)}</div><div class="v2-same-size">${escapeHtml(locField(s, 'size', lang))}</div>${note}</div>
    </a>`;
  }).join('');

  const faqHtml = faqs.map((f, idx) =>
    `<div class="v2-faq-item${idx === 0 ? ' open' : ''}">
      <div class="v2-faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.q)}</div>
      <div class="v2-faq-a">${escapeHtml(f.a)}</div>
    </div>`
  ).join('');

  const bodyContent = `
  <div class="v2-wrap">
    <!-- 1. 헤더 -->
    <nav class="v2-breadcrumb">
      <a href="${prefix}/specs">${escapeHtml(specsLabel)} 가이드</a> &gt; ${escapeHtml(countryName)} &gt; ${escapeHtml(typeName)}
    </nav>
    <div class="v2-tags">
      <span class="v2-tag">${escapeHtml(countryName)}</span>
      <span class="v2-tag">${escapeHtml(typeName)}</span>
      ${sameSize.map(s => {
        const n = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
        const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
        return `<a href="${prefix}/specs/${ts}/${cs}" class="v2-tag">${escapeHtml(n)}</a>`;
      }).join('')}
    </div>
    <div class="v2-header">
      <h1>${escapeHtml(countryName)} ${escapeHtml(typeName)}</h1>
      <div class="v2-sub">${escapeHtml(specData.countryEn || countryName)} ${escapeHtml(specData.typeEn || typeName)} Photo Specification</div>
    </div>

    <!-- 2. 핵심 규격 카드 -->
    <div class="v2-spec-card">
      <div>
        <table class="v2-spec-table">
          ${specRows}
        </table>
      </div>
      <div class="v2-diagram-wrap">
        <div class="v2-photo-frame">
          <img src="${imgSrc}" alt="${escapeHtml(countryName)} ${escapeHtml(typeName)}"
               onerror="this.src='${fallbackSrc}';this.onerror=function(){this.style.display='none'}">
          <div class="v2-dim-head">${escapeHtml(locField(specData, 'headHeight', lang))}</div>
          <div class="v2-dim-w">${escapeHtml(sizeW)}</div>
        </div>
        <div class="v2-dim-h">${escapeHtml(sizeH)}</div>
      </div>
    </div>

    <!-- 3. 여권사진 만들기 -->
    <div class="v2-steps-section" id="v2-steps">
      <div class="v2-steps-title">${escapeHtml(countryName)} ${escapeHtml(typeName)} 사진 만들기</div>
      <div class="v2-steps-sub">셀카 한 장이면 ${escapeHtml(locField(specData, 'size', lang))} 규격 증명사진이 완성됩니다.</div>

      <!-- Phase 1: 업로드 -->
      <div class="v2-make-layout" id="v2-phase-upload">
        <div class="v2-upload-zone" id="v2-dropzone">
          <div class="v2-upload-icon">&#8615;</div>
          <div class="v2-upload-main-text">사진을 끌어다 놓거나</div>
          <button type="button" class="v2-upload-btn">사진 선택</button>
          <input type="file" id="v2-file-input" accept="image/*" style="display:none">
          <div class="v2-upload-hint">JPG, PNG, HEIC / max 10MB</div>
        </div>
        <div class="v2-error-msg" id="v2-error"></div>
      </div>

      <!-- Phase 1.5: 검수 결과 -->
      <div class="v2-make-layout" id="v2-phase-check" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-check-img" src="" alt="검수 사진">
          </div>
          <div class="v2-checklist-side">
            <div class="v2-checklist-title">규정 체크</div>
            <div class="v2-checklist-loading" id="v2-loading">
              <div class="v2-spinner"></div>
              <span>AI 검수 중...</span>
            </div>
            <ul class="v2-checklist-items" id="v2-checklist-items"></ul>
            <div class="v2-checklist-summary" id="v2-summary"></div>
            <div class="v2-action-buttons" id="v2-check-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-btn-change">다른 사진</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-btn-proceed">진행하기</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2: 결제 선택 -->
      <div class="v2-make-layout" id="v2-phase-pay" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-preview-img" src="" alt="미리보기">
            <button class="v2-change-photo" id="v2-change-photo">다른 사진</button>
          </div>
          <div class="v2-pay-options">
            <button class="v2-pay-btn v2-pay-instant" id="v2-pay-instant">
              <div class="v2-pay-title">여권사진 만들기</div>
              <div class="v2-pay-price">₩2,000</div>
              <div class="v2-pay-desc">카드/토스 즉시결제 · 로그인 불필요</div>
            </button>
            <div class="v2-pay-divider"><span>또는</span></div>
            <button class="v2-pay-btn v2-pay-credit" id="v2-pay-credit">
              <div class="v2-pay-title">크레딧으로 만들기 <span class="v2-badge v2-badge-a">39% 할인</span></div>
              <div class="v2-pay-price">10c <span style="font-size:13px;color:#888;font-weight:400;">(약 ₩1,225)</span></div>
              <div class="v2-pay-desc">간편로그인 시 10c 무료 지급 · 추가 충전 40c ₩4,900</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Phase 3: 생성 중 -->
      <div class="v2-make-layout" id="v2-phase-generating" style="display:none;">
        <div class="v2-generating">
          <div class="v2-spinner"></div>
          <div class="v2-gen-text">AI가 여권사진을 만들고 있습니다...</div>
          <div class="v2-gen-sub">약 30초 소요</div>
        </div>
      </div>

      <!-- Phase 4: 결과 + 다운로드 -->
      <div class="v2-make-layout" id="v2-phase-result" style="display:none;">
        <div class="v2-result-grid">
          <div class="v2-result-before">
            <div class="v2-result-label">원본</div>
            <img id="v2-result-before-img" src="" alt="원본">
          </div>
          <div class="v2-result-arrow">→</div>
          <div class="v2-result-after">
            <div class="v2-result-label">완성</div>
            <img id="v2-result-after-img" src="" alt="완성">
          </div>
        </div>
        <div class="v2-result-actions">
          <button class="v2-download-btn" id="v2-download">다운로드</button>
          <button class="v2-action-btn v2-btn-retry" id="v2-btn-retry2">다른 사진으로 만들기</button>
        </div>
      </div>
    </div>

    <!-- 4. 상세규정 + 반려사유 -->
    <div class="v2-detail-grid">
      <div class="v2-detail-card">
        <h3>상세 규정</h3>
        <ul class="v2-detail-list">${detailHtml}</ul>
      </div>
      <div class="v2-detail-card">
        <h3>반려사유 TOP 5</h3>
        <ol class="v2-reject-list">${rejectHtml}</ol>
      </div>
    </div>

    ${sameSize.length > 0 ? `<!-- 5. 같은 사진으로 제출 가능한 서류 -->
    <div class="v2-same-section">
      <h2>같은 사진으로 제출 가능한 서류</h2>
      <div class="v2-same-sub">아래 서류는 ${escapeHtml(countryName)} ${escapeHtml(typeName)}과(와) 동일 규격(${escapeHtml(locField(specData, 'size', lang))})입니다.</div>
      <div class="v2-same-grid">${sameHtml}</div>
    </div>` : ''}

    <!-- 6. FAQ -->
    <div class="v2-faq-section">
      <h2>자주 묻는 질문</h2>
      ${faqHtml}
    </div>

    <!-- 7. CTA 배너 -->
    <div class="v2-cta-banner">
      <h2>규격에 맞는 여권사진, AI로 자동 완성</h2>
      <div class="v2-cta-sub">셀카 한 장이면 ${escapeHtml(locField(specData, 'size', lang).replace('cm', 'mm').replace('3.5', '35').replace('4.5', '45'))} · 균일 흰색 배경으로 30초 만에 변환</div>
      <a href="#v2-steps" class="v2-cta-btn-main">지금 만들기 →</a>
    </div>
  </div>
`;

  const pageScript = `
(function(){
  var dropzone = document.getElementById('v2-dropzone');
  var fileInput = document.getElementById('v2-file-input');
  var preview = document.getElementById('v2-preview');
  var loading = document.getElementById('v2-loading');
  var errorMsg = document.getElementById('v2-error');
  var phaseUpload = document.getElementById('v2-phase-upload');
  var phaseCheck = document.getElementById('v2-phase-check');
  var phasePay = document.getElementById('v2-phase-pay');
  var phaseGen = document.getElementById('v2-phase-generating');
  var phaseResult = document.getElementById('v2-phase-result');
  var uploadedBase64 = null;

  if(!dropzone) return;

  function showPhase(phase){
    [phaseUpload, phaseCheck, phasePay, phaseGen, phaseResult].forEach(function(p){ if(p) p.style.display='none'; });
    if(phase) phase.style.display='';
  }

  dropzone.querySelector('.v2-upload-btn').addEventListener('click', function(e){ e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', function(){ fileInput.click(); });
  dropzone.addEventListener('dragover', function(e){ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', function(){ dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop', function(e){
    e.preventDefault(); dropzone.classList.remove('dragover');
    if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function(){ if(fileInput.files.length) handleFile(fileInput.files[0]); });

  function showError(msg){ errorMsg.textContent = msg; errorMsg.classList.add('show'); }
  function hideError(){ errorMsg.classList.remove('show'); }

  function handleFile(file){
    hideError();
    if(!file.type.match(/image\\/(jpeg|png|heic|heif|webp)/i)) return showError('JPG, PNG, HEIC 파일만 업로드 가능합니다.');
    if(file.size > 10*1024*1024) return showError('10MB 이하 파일만 업로드 가능합니다.');
    var reader = new FileReader();
    reader.onload = function(ev){
      uploadedBase64 = ev.target.result;
      document.getElementById('v2-check-img').src = uploadedBase64;
      showPhase(phaseCheck);

      var checklistItems = document.getElementById('v2-checklist-items');
      var checkLoading = document.getElementById('v2-loading');
      var summary = document.getElementById('v2-summary');
      var checkActions = document.getElementById('v2-check-actions');
      checklistItems.innerHTML = '';
      summary.innerHTML = '';
      summary.className = 'v2-checklist-summary';
      checkActions.style.display = 'none';
      checkLoading.style.display = 'flex';

      fetch('/api/idphoto/precheck', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ image: uploadedBase64 })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        checkLoading.style.display = 'none';
        if(data.checks){
          var allPass = true;
          data.checks.forEach(function(c){
            var li = document.createElement('li');
            var icon = document.createElement('span');
            icon.className = 'v2-check-icon ' + (c.pass ? 'v2-check-pass' : c.warn ? 'v2-check-warn' : 'v2-check-fail');
            icon.textContent = c.pass ? '✓' : c.warn ? '!' : '✗';
            li.appendChild(icon);
            li.appendChild(document.createTextNode(c.label));
            checklistItems.appendChild(li);
            if(!c.pass && !c.warn) allPass = false;
          });
          summary.className = 'v2-checklist-summary ' + (allPass ? 'v2-summary-pass' : 'v2-summary-fail');
          summary.textContent = allPass ? '규격 적합! 진행하기를 눌러주세요.' : '일부 항목이 부적합합니다. 다른 사진을 권장합니다.';
          checkActions.style.display = 'flex';
        } else {
          showError(data.error || '검수 실패');
          showPhase(phaseUpload);
        }
      })
      .catch(function(){ showError('검수 오류'); showPhase(phaseUpload); });
    };
    reader.readAsDataURL(file);
  }

  // 검수: 다른 사진
  document.getElementById('v2-btn-change').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });
  // 검수: 진행하기 → 결제
  document.getElementById('v2-btn-proceed').addEventListener('click', function(){
    document.getElementById('v2-preview-img').src = uploadedBase64;
    showPhase(phasePay);
  });

  // 결제: 다른 사진
  document.getElementById('v2-change-photo').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });

  // 즉시 결제 (₩2,000 토스)
  document.getElementById('v2-pay-instant').addEventListener('click', function(){
    if(!uploadedBase64) return;
    showPhase(phaseGen);
    fetch('/api/idphoto/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ image: uploadedBase64, format:'passport', gender:'m', age:'adult' })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.image){
        document.getElementById('v2-result-before-img').src = uploadedBase64;
        document.getElementById('v2-result-after-img').src = 'data:image/png;base64,'+data.image;
        showPhase(phaseResult);
      } else {
        showError(data.error || '생성 실패');
        showPhase(phasePay);
      }
    })
    .catch(function(){ showError('오류 발생'); showPhase(phasePay); });
  });

  // 크레딧 결제
  document.getElementById('v2-pay-credit').addEventListener('click', function(){
    window.location.href = '/headshot?from=specs';
  });

  // 다운로드
  document.getElementById('v2-download').addEventListener('click', function(){
    var img = document.getElementById('v2-result-after-img');
    if(!img.src) return;
    var a = document.createElement('a');
    a.href = img.src; a.download = 'monkos-passport.jpg';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  // 다른 사진으로 만들기
  document.getElementById('v2-btn-retry2').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });
})();
`;

  return {
    title,
    description,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_V2_STYLE,
    bodyContent,
    pageScript,
  };
}

// ─── SPECS DETAIL (v1 — 기존 전체 사용) ─────────────────────

export function specsDetailFragment(slug, forceLang = null) {
  if (V2_SLUGS.has(slug)) return specsDetailV2Fragment(slug, forceLang);

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
  const heroDescription = (specData.heroDesc && specData.heroDesc[lang]) || description;

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
  const tableRows = [
    ['size', h.size, locField(specData, 'size', lang)],
    ['pixels', h.pixels, locField(specData, 'pixels', lang)],
    ['dpi', h.dpi, String(specData.dpi)],
    ['background', h.background, locField(specData, 'background', lang)],
    ['headHeight', h.headHeight, locField(specData, 'headHeight', lang)],
    ['validity', h.validity, locField(specData, 'validity', lang)],
    ['fileSpec', h.fileSpec, locField(specData, 'fileSpec', lang)],
  ].map(([key, label, val]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}</td></tr>`).join('\n      ');

  const detailText = (specData.details && (specData.details[lang] || specData.details.ko)) || '';
  const detailLines = detailText.split(/[.。]\s*/).filter(d => d.trim().length > 0);
  const detailGridHtml = detailLines.map((line) =>
    `<div class="specs-detail-item"><span>${escapeHtml(line.trim())}</span></div>`
  ).join('\n        ');

  const commonRules = COMMON_RULES[lang] || COMMON_RULES.ko;
  const commonRulesHtml = commonRules.map((rule, idx) =>
    `<li class="specs-common-rule">${idx + 1}. ${escapeHtml(rule)}</li>`
  ).join('\n        ');

  const rejections = (specData.rejectionReasons && (specData.rejectionReasons[lang] || specData.rejectionReasons.ko)) || [];
  const rejectionHtml = rejections.map((r) =>
    `<li class="specs-rejection-item">
          <span class="specs-rj-x">&times;</span>
          <span>${escapeHtml(r)}</span>
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

  const oxGoodLabel = lang === 'ja' ? '適合写真' : lang === 'en' ? 'Acceptable Photo' : '적합한 사진';
  const oxBadLabel = lang === 'ja' ? '却下される写真' : lang === 'en' ? 'Rejected Photo' : '반려되는 사진';
  const oxGoodCaption = lang === 'ja' ? '正面・無表情・白背景' : lang === 'en' ? 'Front-facing · Neutral · White BG' : '정면 · 무표정 · 흰배경';
  const oxBadCaption = lang === 'ja' ? '傾き・影・髪' : lang === 'en' ? 'Tilted · Shadow · Hair' : '기울어짐 · 그림자 · 머리카락';

  const aiSummary = (specData.aiSummary && specData.aiSummary[lang])
    ? escapeHtml(specData.aiSummary[lang])
    : lang === 'ja'
    ? `${escapeHtml(countryName)}の${escapeHtml(typeName)}は${escapeHtml(locField(specData, 'size', lang))}、${escapeHtml(locField(specData, 'background', lang))}背景、${escapeHtml(locField(specData, 'validity', lang))}以内の撮影が必要です。`
    : lang === 'en'
    ? `${escapeHtml(countryName)} ${escapeHtml(typeName)} requires ${escapeHtml(locField(specData, 'size', lang))}, ${escapeHtml(locField(specData, 'background', lang)).toLowerCase()} background, taken within ${escapeHtml(locField(specData, 'validity', lang)).toLowerCase()}.`
    : `${escapeHtml(countryName)} ${escapeHtml(typeName)}은 ${escapeHtml(locField(specData, 'size', lang))}, ${escapeHtml(locField(specData, 'background', lang))} 배경이며 ${escapeHtml(locField(specData, 'validity', lang))} 촬영이 필요합니다.`;

  const detailSections = (specData.detailSections && specData.detailSections[lang]) || [];
  const detailSectionsHtml = detailSections.length ? `
        <div class="specs-detail-sections">
          ${detailSections.map(sec => `<div class="specs-detail-cat">
            <h3>${escapeHtml(sec.title)}</h3>
            <ul>${sec.items.map(item => `
              <li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>`).join('\n          ')}
        </div>` : '';

  const onlineGuide = (specData.onlineGuide && specData.onlineGuide[lang]) || null;
  const onlineGuideHtml = onlineGuide ? `
        <div class="specs-online-guide">
          ${onlineGuide.sections.map(sec => `<div class="specs-online-section">
            <h3>${escapeHtml(sec.subtitle)}</h3>
            <ul>${sec.items.map(item => `
              <li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>`).join('\n          ')}
          ${onlineGuide.source ? `<a href="${escapeHtml(onlineGuide.source.url)}" target="_blank" rel="noopener noreferrer" class="specs-online-source">
            <span>${escapeHtml(onlineGuide.source.label)}</span>
            <span class="specs-external-icon">↗</span>
          </a>` : ''}
        </div>` : '';

  const bodyContent = `
  <div class="specs-hero-wrap">
  <div class="band-inner">
  <a href="${prefix}/specs" class="specs-back">${escapeHtml(backLabel)}</a>

  <!-- Hero 풀와이드 -->
  <section class="specs-hero">
    <div class="specs-hero-text">
      <h1>${countryFlag(countrySlug, 40)} ${(specData.heroTitle && specData.heroTitle[lang]) ? escapeHtml(specData.heroTitle[lang]) : `${escapeHtml(countryName)} ${escapeHtml(typeName)} ${lang === 'ja' ? '規定案内' : lang === 'en' ? 'Requirements Guide' : '규정안내'}`}</h1>
      <p class="specs-hero-desc">${escapeHtml(heroDescription)}</p>
    </div>
    <div class="specs-diagram">
      <div class="specs-photo-frame">
        ${(() => {
          const countryImg = `/images/guides/${slug}.webp`;
          const sizeMm = parseSizeMm(specData.size);
          const fallbackImg = sizeMm ? `/images/guides/${sizeMm}.webp` : '';
          const altText = `${countryName} ${typeName}`;
          return `<img src="${countryImg}"
             alt="${escapeHtml(altText)}"
             width="200" loading="lazy"
             onerror="this.src='${fallbackImg}';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='block'}">
        <svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor" style="display:none">
          <ellipse cx="60" cy="45" rx="30" ry="38"/>
          <ellipse cx="60" cy="140" rx="50" ry="45"/>
        </svg>`;
        })()}
        <div class="specs-head-guide">${escapeHtml(locField(specData, 'headHeight', lang))}</div>
        <div class="specs-guide-w">${escapeHtml(locField(specData, 'size', lang).split('×')[0].trim())}</div>
      </div>
      <div class="specs-guide-h">${escapeHtml((locField(specData, 'size', lang).split('×')[1] || '4.5cm').trim())}</div>
    </div>
  </section>
  </div>
  </div>

  ${sameCountry.length > 0 ? `<!-- BAND: 다른 용도 규격 -->
  <div class="specs-band specs-band-dark" style="padding:32px 20px;">
    <div class="band-inner">
      <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:12px;">${escapeHtml(i.sameCountryLabel)}</div>
      <div class="specs-hero-tags">${sameCountry.map(s => {
        const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
        const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
        return '<a href="' + prefix + '/specs/' + ts + '/' + cs + '" style="text-decoration:none;"><span>' + escapeHtml(name) + '</span></a>';
      }).join('')}</div>
    </div>
  </div>` : ''}

  <!-- BAND: 규격 맞춤 도구 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${lang === 'ja' ? `${escapeHtml(typeName)} 規定写真を作る` : lang === 'en' ? `Make ${escapeHtml(typeName)} Photo` : `${escapeHtml(typeName)} 규정 사진 만들기`}</h2>
        <div class="specs-crop-tool" id="specs-crop-embed">
          <div class="specs-crop-panel specs-crop-upload">
            <div style="font-size:32px;color:#aaa;margin-bottom:12px;">&#8615;</div>
            <div style="font-size:15px;color:#555;font-weight:600;margin-bottom:8px;">${lang === 'ja' ? '写真をドラッグ＆ドロップ' : lang === 'en' ? 'Drag and drop photo' : '사진을 끌어다 놓으세요'}</div>
            <div style="margin:12px 0;padding:10px 24px;border:1.5px solid #6c4fff;border-radius:8px;color:#6c4fff;font-size:14px;font-weight:600;">${lang === 'ja' ? '写真を選択' : lang === 'en' ? 'Choose photo' : '사진 선택'}</div>
            <div style="font-size:12px;color:#aaa;margin-top:8px;">JPG, PNG, HEIC / max 10MB</div>
          </div>
          <div class="specs-crop-panel specs-crop-preview">
            <img src="/images/guides/sample-before-kr.png" alt="Before">
            <div class="specs-crop-label">BEFORE</div>
          </div>
          <div class="specs-crop-panel specs-crop-preview">
            <img src="/images/guides/sample-after-kr.webp" alt="After">
            <div class="specs-crop-label specs-crop-label-after">AFTER</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- BAND: 규격 정보 -->
  <div class="specs-band specs-band-white">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${lang === 'ja' ? '規格情報' : lang === 'en' ? 'Specifications' : '규격 정보'}</h2>
        <div class="specs-ai-summary">${aiSummary}</div>
        <table class="specs-table">
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        ${detailSectionsHtml}
      </div>
    </div>
  </div>

  ${detailLines.length ? `<!-- BAND: 촬영 주의사항 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${lang === 'ja' ? '撮影時の注意事項' : lang === 'en' ? 'Photo Requirements' : '촬영 주의사항'}</h2>
        <div class="specs-details-grid">
          ${detailGridHtml}
        </div>
      </div>
    </div>
  </div>` : ''}

  ${specData.officialSource ? `<!-- BAND: 공식 안내 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <a href="${escapeHtml(specData.officialSource.url)}" target="_blank" rel="noopener noreferrer" class="specs-official-link">
        <span>${escapeHtml((specData.officialSource.label && (specData.officialSource.label[lang] || specData.officialSource.label.ko)) || specData.officialSource.url)}</span>
        <span class="specs-external-icon">↗</span>
      </a>
    </div>
  </div>` : ''}

  ${rejections.length ? `<!-- BAND: 반려 사유 -->
  <div class="specs-band specs-band-white">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${escapeHtml(i.rejectionTitle)}</h2>
        <ul class="specs-rejection-list">
          ${rejectionHtml}
        </ul>
      </div>
    </div>
  </div>` : ''}

  ${onlineGuideHtml ? `<!-- BAND: 온라인 신청 안내 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${escapeHtml(onlineGuide.title)}</h2>
        ${onlineGuideHtml}
      </div>
    </div>
  </div>` : ''}

  ${faqs.length ? `<!-- BAND: 자주 묻는 질문 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${escapeHtml(i.faqTitle)}</h2>
        <div class="specs-faq">
          ${faqHtml}
        </div>
      </div>
    </div>
  </div>` : ''}

  <!-- BAND: CTA 배너 (다크 배경, 맨 하단) -->
  <div class="specs-band specs-band-dark">
    <div class="band-inner">
      <div class="specs-cta-banner">
        <div class="specs-cta-badge">${escapeHtml(i.ctaBadge)}</div>
        <h2>${escapeHtml(i.ctaHeadline1)}<br><span>${escapeHtml(i.ctaHeadline2)}</span></h2>
        <p class="specs-cta-sub">${escapeHtml(i.ctaSub).replace(/\n/g, '<br>')}</p>
        <a href="https://monkos.ai" class="specs-cta-btn">${escapeHtml(i.ctaBtn)}</a>
        <p class="specs-cta-price">${i.ctaPrice.replace(/(무료 체험|無料体験|Free)/g, '<strong>$1</strong>')}</p>
      </div>
    </div>
  </div>

`;

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
    parts.paymentRegion = req.paymentRegion;
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
        if (!V2_SLUGS.has(oldSlug)) {
          const redirect = REDIRECT_MAP[oldSlug];
          if (redirect) {
            const newUrl = `${prefix}/specs/${redirect}`;
            res.writeHead(301, { Location: newUrl });
            return res.end();
          }
        }
      }
      slug = oldSlug;
    }

    if (!slug || !SPECS_DATA[slug]) {
      // 6/19 슬러그 체계 변경(fe0a38f3) 복구: 옛 URL(국가명/구type) → 새 정본 301
      let oldType = null, oldCountry = null;
      if (remaining.length === 1) {
        ({ typeSlug: oldType, countrySlug: oldCountry } = parseSlug(remaining[0]));
      } else if (remaining.length >= 2) {
        oldType = remaining[0];
        oldCountry = remaining[1];
      }
      if (oldType && oldCountry) {
        const iso = canonicalCountry(oldCountry);
        const newType = TYPE_ALIASES[oldType] || oldType;
        if (SPECS_DATA[`${iso}-${newType}`]) {
          res.writeHead(301, { Location: `${prefix}/specs/${newType}/${iso}` });
          return res.end();
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(specs404Html(prefix, lang));
    }

    const parts = specsDetailFragment(slug, forceLang);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(specs404Html(prefix, lang));
    }
    parts.paymentRegion = req.paymentRegion;
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
