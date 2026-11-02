/**
 * CMS SSR — 증명사진 규격 허브 + 상세
 * IDPASS 카드 UI + 다크 테마 + 3티어 전환 퍼널
 */
import { createRequire } from 'module';
import { readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { escapeHtml, layoutShell } from './render-shell.js';
import { getSpecCropParams } from '../spec-crop.js';
import { log, LEMONSQUEEZY_VARIANT_SPECS_SINGLE, LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP, DIRECT_PRICING } from '../shared/config.js';
import { COMMON_RULES, SPECS_I18N, V2_REJECTIONS, V2_DETAILS, V2_FAQ_FALLBACK, RESTR_LABELS } from './specs-i18n.js';
import { specsUrl, specsCanonicalUrl, specsHreflangTags, SPECS_DOMAIN } from './specs-url.js';
import { specHero } from './components/spec-hero.js';
import { specDiagram } from './components/spec-diagram.js';
import { specCard } from './components/spec-card.js';
import { docsAccepting } from './components/docs-accepting.js';
import { faqSection } from './components/faq-section.js';
import { uniqueContentSection } from './components/unique-content.js';
import { relatedServices } from './components/related-services.js';
import { specFunnelMarkup } from './components/spec-funnel-markup.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDE_IMAGES = new Set(
  readdirSync(join(__dirname, '../../public/images/guides')).filter(f => f.endsWith('.webp')).map(f => f.replace('.webp', ''))
);

const _require = createRequire(import.meta.url);
export const SPECS_DATA = _require('./specs-data.json');
// 규격 데이터 최종 갱신일 — Article dateModified 정본 (하드코딩 금지, 데이터 파일 mtime 기준)
const SPECS_DATA_MODIFIED = (() => {
  try { return statSync(join(__dirname, 'specs-data.json')).mtime.toISOString().slice(0, 10); }
  catch { return '2026-07-13'; }
})();

// 퍼널 분리 정적 자산 버전 — Cloud Run 리비전 단위 캐시 버스트 (로컬은 dev)
const ASSET_VER = process.env.K_REVISION || 'dev';
const specsCssLink = (name) => `\n<link rel="stylesheet" href="/css/${name}.css?v=${ASSET_VER}">`;
const specsJsTag = (name) => `\n<script src="/js/${name}.js?v=${ASSET_VER}" defer></script>`;

// ─── LANGS / MARKET ────────────────────────────────────────────
const LANGS = ['ko', 'en', 'ja', 'es', 'id', 'vi'];
const HREFLANG_LANGS = LANGS;
const MARKET_MAP = { ko: 'kr', ja: 'jp', en: 'global', es: 'global', id: 'global', vi: 'global' };
const loc = (obj, lang) => obj[lang] || obj.en || obj.ko;

// ─── I18N ─── (specs-i18n.js로 분리 — import 참조)

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
  'visa-evisa', 'visa-bls', // 복합 type — 미등재 시 parseSlug가 country를 'in-visa'로 오분해 → canonical 301 루프
  'resume-1cun', 'resume-2cun',
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
  bosnia: 'ba', azerbaijan: 'az', denmark: 'dk', belgium: 'be', belarus: 'by',
  brazil: 'br', mexico: 'mx', france: 'fr', italy: 'it', netherlands: 'nl',
  portugal: 'pt', sweden: 'se', norway: 'no', finland: 'fi', poland: 'pl',
  russia: 'ru', turkey: 'tr', egypt: 'eg', nigeria: 'ng', kenya: 'ke',
  philippines: 'ph', malaysia: 'my', pakistan: 'pk', bangladesh: 'bd',
  colombia: 'co', argentina: 'ar', chile: 'cl', peru: 'pe',
  morocco: 'ma', tunisia: 'tn', kuwait: 'kw', oman: 'om',
  qatar: 'qa', bahrain: 'bh', jordan: 'jo', lebanon: 'lb',
  cambodia: 'kh', myanmar: 'mm', laos: 'la', nepal: 'np',
  'sri-lanka': 'lk', 'new-zealand': 'nz', 'south-africa': 'za',
  'saudi-arabia': 'sa', 'united-arab-emirates': 'ae',
};

for (const [slug, spec] of Object.entries(SPECS_DATA)) {
  const cc = slug.split('-')[0];
  const en = (spec.countryEn || '').toLowerCase().replace(/\s+/g, '-');
  if (en && !COUNTRY_SLUG_TO_ISO[en]) {
    COUNTRY_SLUG_TO_ISO[en] = cc;
  }
}

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
  const ii = SPECS_I18N[lang] || SPECS_I18N.en || SPECS_I18N.ko;
  const msg = ii.notFoundMsg;
  const cta = ii.notFoundCta;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 · MONKOS</title></head><body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:64px 20px;color:#222"><h1 style="font-size:48px;margin:0">404</h1><p style="color:#666">${msg}</p><p><a href="${prefix}/specs" style="color:#6b4eff;text-decoration:none">${cta} →</a></p></body></html>`;
}

function countryFlag(countrySlug, size = 32) {
  const code = (COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug).toLowerCase();
  if (code.length !== 2) return '';
  const w = size;
  const h = Math.round(size * 0.75);
  // flagcdn.com 지원 너비: 20, 40, 80, 160, 320, 640 (2025년 이후 64 등 비표준 404)
  const VALID_WIDTHS = [20, 40, 80, 160, 320, 640];
  const target = w * 2;
  const cdnW = VALID_WIDTHS.find(s => s >= target) || 640;
  return `<img src="https://flagcdn.com/w${cdnW}/${code}.webp" alt="${code}" width="${w}" height="${h}" class="flag-icon" loading="lazy" onerror="this.style.display='none'">`;
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

// cn-resume 분리 후 구 URL 호환: /specs/resume/cn → cn-resume-1cun (1寸 기본값)
if (!ROUTE_MAP['resume/cn'] && SPECS_DATA['cn-resume-1cun']) {
  ROUTE_MAP['resume/cn'] = 'cn-resume-1cun';
}

// V2 로컬이던 것을 모듈 레벨로 승격 — V1 레거시 경로(721·893)도 참조 (2026-07-16 fmtV2 미정의 500 핫픽스)
const fmtV2 = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

export function locField(spec, field, lang) {
  if (lang === 'ko') return spec[field];
  const suffix = lang.charAt(0).toUpperCase() + lang.slice(1);
  const val = spec[field + suffix];
  if (val) return val;
  if (lang !== 'en' && lang !== 'ja') return spec[field + 'En'] || spec[field];
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

// 리스트·v1 상세 공용 CSS → public/css/specs-base.css (2026-07-12 퍼널 분리)

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

    const countryName = locField(spec, 'country', lang);
    const typeName = locField(spec, 'type', lang);

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
  const i = SPECS_I18N[lang] || SPECS_I18N.en || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;

  const hubData = buildHubData(lang);
  const totalCountries = new Set(Object.values(SPECS_DATA).map(s => s.countryEn || s.country)).size;
  const totalSpecs = Object.keys(SPECS_DATA).length;

  const canonicalUrl = lang === 'ko' ? `${SPECS_DOMAIN}/specs` : `${SPECS_DOMAIN}/${lang}/specs`;
  const hreflangTags = HREFLANG_LANGS.map(l =>
    `<link rel="alternate" hreflang="${l}" href="${SPECS_DOMAIN}${l === 'ko' ? '' : '/' + l}/specs">`
  ).concat(`<link rel="alternate" hreflang="x-default" href="${SPECS_DOMAIN}/en/specs">`).join('\n');

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
      <div class="overlay" style="background:linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)">
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

  // 리스트 클라 JS → public/js/specs-list.js (2026-07-12 퍼널 분리 — 설정만 인라인 주입)
  const pageScript = `window.__SPECS_LIST_CFG__ = { hubData: ${hubDataJson}, countriesLabel: '${escapeHtml(i.countriesCount)}' };`;

  return {
    title: i.hubTitle,
    description: i.hubDesc,
    seoMeta: seoMeta + specsCssLink('specs-base'),
    htmlLang: lang,
    pageStyle: '',
    bodyContent: bodyContent + specsJsTag('specs-list'),
    pageScript,
  };
}

// ─── DETAIL PAGE (/specs/:type/:country) ────────────────────────

// ─── SPECS V2 — kr-passport 카드형 리디자인 ────────────────────

// V2_DIRECT_SLUGS 폐지 (2026-07-15 D6) — 전 슬러그 2-segment 정본 301 합류. kr-passport도 /specs/passport/kr로 301.

// 생성 엔진 호환성 게이트 (2026-07-04 감사 P0 대응)
// 생성 엔진(idphoto-generate.js)은 3:4 비율·흰색 배경으로 고정 출력한다.
// v2 페이지는 '셀카 한 장이면 {해당 규격} 규격 증명사진이 완성됩니다'를 약속하므로,
// 엔진이 충족할 수 없는 규격(정방형 등 비율 불일치, 비백색 배경)은 v2에서 제외하고
// v1(생성 CTA 없음)을 유지한다 — 규격 위반 결과물을 규격 적합으로 안내하는 사고 차단.
// - 비율: size의 세로/가로 ≥ 1.15 (3:4=1.333 근사 허용). 파싱 불가(cn-resume 등)는 제외.
// - 배경: '흰'/'White'로 시작하는 값만 허용 (흰/회색·흰색·파란 배경 등 흰색 허용 규격 포함).
function isEngineCompatibleSpec(specData) {
  if (!specData) return false;
  const m = String(specData.size || '').match(/([0-9.]+)\s*[×x]\s*([0-9.]+)/);
  if (!m) return false;
  const w = parseFloat(m[1]);
  const h = parseFloat(m[2]);
  // 정사각(1:1)까지 허용 — 규격 안착 크롭 파이프라인(crop-engine v2)이 비율을 보장 (2026-07-06 게이트 완화).
  // 종전 h/w ≥ 1.15는 크롭 부재 시절의 보수 게이트 (07-04 감사 P0). 가로형(h<w)만 계속 제외.
  if (!w || !h || h / w < 1.0) return false;
  return true;
}

// 렌더 분기: 파일럿(kr-passport)은 en/ja 포함 기존 동작 보존, 그 외는 ko 언어 한정 +
// D6 게이트 재정의 (2026-07-15): 퍼널 노출 = 엔진 호환성만 판정, 전 언어 공통.
// LEMONSQUEEZY_VARIANT_SPECS_SINGLE은 결제 가용성 플래그로 축소 — 미설정 시 유료 버튼만 비활성.
function isV2Spec(slug, lang) {
  if (!isEngineCompatibleSpec(SPECS_DATA[slug])) return false;
  return true;
}

// v2 상세 CSS → public/css/specs-funnel.css (2026-07-12 퍼널 분리)

// V2_REJECTIONS, V2_DETAILS, V2_FAQ_FALLBACK → specs-i18n.js로 분리

// 파일럿 CSS → public/css/specs-pilot.css (2026-07-12 퍼널 분리)

function specsDetailV2Fragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.en || SPECS_I18N.ko;
  const v2 = i.v2 || SPECS_I18N.ko.v2;
  // 시장 판별: 결제 PG 분기 정본 (kr=토스, jp=레몬 JP 스토어, global=레몬 글로벌)
  const market = MARKET_MAP[lang] || 'global';
  // T0 무료 퍼널 전 언어 개방 (2026-07-15 isPilot 폐지 — D1)
  // T1 리터칭 실동작 여부 — 카드 문구·CTA를 서버 플래그와 결합 (off인데 '리터칭' 판매 금지, 2026-07-10 리뷰 확정)
  // 서버 리터칭 게이트(server.js isT1Path)와 정합 — 리터칭이 실행되지 않는 슬러그에 활성 카드 노출 금지
  // (2026-07-11 T0 전면 개방 때 env-only 분기가 전 페이지로 새던 것을 작가님 실캡처로 적발)
  // 2026-07-13 작가님 승인: T1 전 슬러그 개방 (kr-passport 파일럿 졸업) — 서버 게이트와 동시 개방
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;
  const t1RetouchOn = process.env.PILOT_T1_RETOUCH === '1';
  const bgVal = String(specData.background || '').trim();
  const isColoredBg = /파란|빨간|blue|red/i.test(bgVal);

  const { typeSlug, countrySlug } = parseSlug(slug);
  const newPath = `${typeSlug}/${countrySlug}`;
  const countryName = locField(specData, 'country', lang);
  const typeName = locField(specData, 'type', lang);
  const title = (specData.seoTitle && specData.seoTitle[lang]) || `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = (specData.seoDescription && specData.seoDescription[lang]) || '';

  const canonicalUrl = specsCanonicalUrl(newPath, lang);
  const hreflangTags = specsHreflangTags(newPath);

  const faqs = (specData.faqs && (specData.faqs[lang] || specData.faqs.ko)) || (V2_FAQ_FALLBACK[lang] || V2_FAQ_FALLBACK.ko);

  // 제한사항(restrictions) — 공식 출처 기반 리서치 데이터. 값 없으면 자동 스킵.
  const restrData = specData.restrictions || {};
  const restrEntries = Object.entries(RESTR_LABELS)
    .map(([key, labels]) => {
      const r = restrData[key];
      if (!r) return null;
      const text = r[lang];
      if (!text) return null;
      return { label: labels[lang] || labels.en, text };
    })
    .filter(Boolean);
  const restrictionsHtml = restrEntries.length
    ? `<div class="v2-restrictions"><h4 class="v2-restr-title">${escapeHtml(i.restrictionsTitle)}</h4><dl class="v2-restr-list">${restrEntries.map(e => `<dt>${escapeHtml(e.label)}</dt><dd>${escapeHtml(e.text)}</dd>`).join('')}</dl></div>`
    : '';

  const ogGuideKey = GUIDE_IMAGES.has(`${slug}_${lang}`) ? `${slug}_${lang}`
    : GUIDE_IMAGES.has(slug) ? slug : (parseSizeMm(specData.size) || 'kr-passport');
  const ogImageAbsolute = `https://monkos.ai/images/guides/${ogGuideKey}.webp`;
  const specsJsonLdArr = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "MONKOS", "item": "https://monkos.ai" },
        { "@type": "ListItem", "position": 2, "name": i.specsTabLabel, "item": `https://monkos.ai${lang === 'ko' ? '' : '/' + lang}/specs` },
        { "@type": "ListItem", "position": 3, "name": `${countryName} ${typeName}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": ogImageAbsolute,
      "inLanguage": lang,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      // 브랜드 엔티티=MONKOS(전 표면 통일, ch8) + 법적 실체=몽크 스튜디오(legalName 보존) — 2026-07-13 작가님 확정
      "publisher": { "@type": "Organization", "name": "MONKOS", "legalName": "몽크 스튜디오 (Monk Studio)", "url": "https://monkos.ai" },
      "datePublished": "2026-03-26",
      "dateModified": SPECS_DATA_MODIFIED,
      // 규격 수치 기계가독화 — 생성형 엔진(GEO) 인용 표면 (표 HTML만으로는 미노출)
      "about": {
        "@type": "Thing",
        "name": `${countryName} ${typeName}`,
        "additionalProperty": [
          { "@type": "PropertyValue", "name": "photo size", "value": locField(specData, 'size', lang) },
          { "@type": "PropertyValue", "name": "background", "value": locField(specData, 'background', lang) },
          { "@type": "PropertyValue", "name": "head height", "value": locField(specData, 'headHeight', lang) },
          ...restrEntries.map(e => ({ "@type": "PropertyValue", "name": e.label, "value": e.text })),
        ].filter(p => p.value && String(p.value).trim() && String(p.value).trim() !== '-'),
      },
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
<meta property="og:image" content="${ogImageAbsolute}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${JSON.stringify(specsJsonLdArr)}</script>`;

  const h = i.tableHeaders;
  // 파일 규격은 정본 데이터(fileSpec) 사용 — 한국 여권 온라인 신청 규격(500KB/JPEG) 하드코딩 금지
  const dpiSuffix = i.dpiSuffix;
  const reqBadgeLabel = i.reqBadge;
  const specRows = [
    [h.size, locField(specData, 'size', lang), ''],
    [h.pixels, locField(specData, 'pixels', lang), ''],
    [h.dpi, specData.dpi ? `${specData.dpi} ${dpiSuffix}` : '', ''],
    [h.background, locField(specData, 'background', lang), ''],
    [h.headHeight, locField(specData, 'headHeight', lang), `<span class="v2-badge v2-badge-req">${reqBadgeLabel}</span>`],
    [h.validity, locField(specData, 'validity', lang), ''],
    [h.fileSpec, locField(specData, 'fileSpec', lang), ''],
  ].filter(([, val]) => val && String(val).trim())
   .map(([label, val, badge]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}${badge}</td></tr>`
  ).join('');

  // GEO 요약문 — 규격 수치를 자연문 1문장으로 (JSON-LD about과 동일 정본 필드, 표기만 언어별)
  const geoSummary = (() => {
    const size = locField(specData, 'size', lang);
    const bg = locField(specData, 'background', lang);
    const hh = locField(specData, 'headHeight', lang);
    const bgPart = bg ? fmtV2(i.geoSummaryBg, { bg: lang === 'en' ? String(bg).toLowerCase() : bg }) : '';
    const hhPart = hh ? fmtV2(i.geoSummaryHh, { hh }) : '';
    return fmtV2(i.geoSummaryTpl, { countryName, typeName, size, bgPart, hhPart });
  })();

  const sizeMm = parseSizeMm(specData.size);
  // 브랜드 도해 우선: {slug}_{lang}(국기+타이틀+MONKOS.AI 내장, 2026-07-11) → 구 슬러그 → 사이즈 패턴 폴백
  const guideKey = GUIDE_IMAGES.has(`${slug}_${lang}`) ? `${slug}_${lang}`
    : GUIDE_IMAGES.has(slug) ? slug : sizeMm;
  const imgSrc = `/images/guides/${guideKey}.webp`;
  const fallbackSrc = sizeMm ? `/images/guides/${sizeMm}.webp` : '';

  // 치수·머리높이 시각화는 1:1 도해 이미지에 내장 (2026-07-11 작가님 확정 — 생성기: 세션 스크립트 gen_reference_diagrams)

  // 상세 규정 — 정본 데이터 우선: detailSections > (kr-passport 파일럿 문구) > details 문장 분해 > 공통 규정.
  // V2_DETAILS는 한국 일반 규정이므로 kr-passport 외 슬러그에 폴백 금지 (타국 오정보 방지)
  const detailText = (specData.details && (specData.details[lang] || specData.details.ko)) || '';
  const detailLines = detailText.split(/[.。]\s*/).map(d => d.trim()).filter(Boolean);
  const detailItems = (specData.detailSections && specData.detailSections[lang])
    ? specData.detailSections[lang].flatMap(s => s.items)
    : slug === 'kr-passport' ? (V2_DETAILS[lang] || V2_DETAILS.ko)
    : detailLines.length ? detailLines
    : (COMMON_RULES[lang] || COMMON_RULES.ko);
  const detailHtml = detailItems.map(d => `<li>${escapeHtml(d)}</li>`).join('');

  // 반려사유 — kr-passport는 파일럿 상세본(desc 포함) 유지, 그 외는 정본 데이터(rejectionReasons: 문자열 배열)
  const dataRejections = (specData.rejectionReasons && (specData.rejectionReasons[lang] || specData.rejectionReasons.ko)) || [];
  const rejections = slug === 'kr-passport'
    ? (V2_REJECTIONS[lang] || V2_REJECTIONS.ko)
    : dataRejections.slice(0, 5).map(r => ({ title: r, desc: '' }));
  const rejectHtml = rejections.map(r =>
    `<li><div class="v2-rj-title">${escapeHtml(r.title)}</div>${r.desc ? `<div class="v2-rj-desc">${escapeHtml(r.desc)}</div>` : ''}</li>`
  ).join('');

  // 수치 박스 탭 라벨 + 공식 출처 링크 (2026-07-11 작가님: DB 보유 출처를 규정 박스에 노출, 없으면 미표기)
  const tabSpecLabel = i.specsTabLabel;
  const sourceLabel = i.sourceLabel;
  const sourceHtml = (() => {
    // 2026-10-01: officialSource는 객체({url,label}) 1건 / 문자열 URL 402건 — 문자열도 렌더 (BRIEFING_E2E 09-24~30 §🔴 출처 링크 368면 미표시)
    const os = specData.officialSource;
    const osObj = os && typeof os === 'object' ? os : null;
    const osStr = typeof os === 'string' && /^https?:/i.test(os.trim()) ? os.trim() : null;
    const url = (osObj && osObj.url) || osStr || (typeof specData.source === 'string' && /^https?:/i.test(specData.source) ? specData.source : null);
    if (!url) return '';
    let label = osObj && osObj.label && (osObj.label[lang] || osObj.label.ko);
    if (!label) { try { label = new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
    return `<div class="v2-source">${escapeHtml(sourceLabel)}: <a href="${escapeHtml(url)}" target="_blank" rel="noopener nofollow">${escapeHtml(label)} &#8599;</a></div>`;
  })();

  const sameSize = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.size === specData.size && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameHtml = sameSize.map(s => {
    const name = locField(s, 'type', lang);
    const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
    // 언어 무관 slug 기준 판정 (구: 한국어 typeName 문자열 비교 — en/ja에서 항상 false였음)
    const note = (ts === 'license' || ts === 'drivers-license') ? `<div class="v2-same-note">${escapeHtml(v2.noGlasses)}</div>` : '';
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

  // 2-티어 CTA (DESIGN_20260704_specs_2tier): T1 = ₩2,000 즉시결제(주 CTA), T2 = 발급보장 업셀 링크.
  // 보장 상세 약속 문구 금지 — 규정 미승인 상태(작가님 승인 대기), 한 줄 절제 표기만.
  // ⚠️ 2026-07-13 작가님: T2 노출 전면 잠정 중지 (운영체계 확정 전 판매 금지) — fit 링크·결과 카드·en/ja 업셀 3지점 제거.
  //    아래 upsell* 정의는 복원 대비 존치(현재 미사용). 복원 시 git f3dce941 직전 상태 참조.
  const upsellHref = i.upsellHref;
  const upsellLabel = i.upsellLabel;
  const upsellHtml = `<div class="v2-upsell"><a href="${upsellHref}" data-cta="specs-upsell" rel="noopener">${escapeHtml(upsellLabel)}</a></div>`;

  const fullName = `${countryName} ${typeName}`;
  const ctx = {
    slug, lang, specData, i, v2, prefix, market,
    countryName, typeName, fullName, typeSlug, countrySlug,
    geoSummary, imgSrc, fallbackSrc, tabSpecLabel, sourceLabel,
    specRows, detailHtml, rejectHtml, restrictionsHtml, sourceHtml,
    sameSize, sameHtml, faqHtml, locField, fmtV2, t1RetouchOn,
  };
  const warningBannerHtml = (() => {
    const alerts = [];
    if (specData.onsite) alerts.push({ icon: '📍', text: specData.warning?.[lang] || (lang === 'en' ? 'On-site photo required' : lang === 'ja' ? '現場撮影が必要です' : lang === 'es' ? 'Foto presencial requerida' : '현장 촬영이 필요합니다') });
    else if (specData.warning?.[lang] || (specData.warning && !specData.warning[lang] && specData.warning.ko)) alerts.push({ icon: '⚠️', text: specData.warning[lang] || specData.warning.es || specData.warning.en || specData.warning.ko });
    if (specData.digitalOnly) alerts.push({ icon: '💻', text: lang === 'en' ? 'Digital photo only — printed photos are not accepted' : lang === 'ja' ? 'デジタル写真のみ — 印刷写真は受付不可' : lang === 'es' ? 'Solo foto digital — no se aceptan fotos impresas' : '디지털 사진만 허용 — 인화 사진은 접수 불가' });
    if (!alerts.length) return '';
    return `\n    <div style="margin:0 auto;max-width:800px;padding:12px 20px;">
${alerts.map(a => `      <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;margin-bottom:8px;background:#FFF8E1;border-radius:8px;font-size:14px;color:#5D4037;"><span style="flex-shrink:0">${a.icon}</span><span>${escapeHtml(a.text)}</span></div>`).join('\n')}
    </div>`;
  })();

  const isFunnelDisabled = specData.funnel === false;

  const headshotCtaLabels = {
    ko: 'AI 프로필 사진을 바로 만들어보세요',
    en: 'Create your AI profile photo now',
    ja: 'AIプロフィール写真を今すぐ作成',
    es: 'Crea tu foto de perfil con IA ahora',
  };
  const headshotCtaHtml = isFunnelDisabled ? `
    <div class="v2-steps-section" id="v2-cta-headshot" style="text-align:center;padding:40px 20px;">
      <a href="${prefix}/headshot" class="v2-action-btn v2-btn-retouch" style="display:inline-block;font-size:16px;padding:14px 32px;text-decoration:none;">${escapeHtml(headshotCtaLabels[lang] || headshotCtaLabels.en)}</a>
    </div>` : '';

  const funnelSection = isFunnelDisabled ? headshotCtaHtml : specFunnelMarkup(ctx);

  const bodyContent = `
  ${market === 'kr' && !isFunnelDisabled ? '<script src="https://js.tosspayments.com/v2/standard"></script>' : ''}
  <div class="v2-wrap idpass-pilot" data-slug="${slug}">
${specHero(ctx)}
${warningBannerHtml}

    <!-- 2. 핵심 규격 듀오 — 이미지 박스 + 수치 박스(탭) 분리. DOM 순서=모바일 순서(이미지 먼저) -->
    <div class="v2-spec-duo">
${specDiagram(ctx)}
${specCard(ctx)}
    </div>
    <script>function v2SpecTab(btn){var card=btn.closest('.v2-card-specs');card.querySelectorAll('.v2-tab').forEach(function(b){b.classList.toggle('on',b===btn)});card.querySelectorAll('.v2-tabpane').forEach(function(p){p.hidden=p.getAttribute('data-pane')!==btn.getAttribute('data-pane')});}</script>
${funnelSection}

    ${sameSize.length > 0 ? docsAccepting(ctx) : ''}

${uniqueContentSection(ctx)}

${faqSection(ctx)}

${relatedServices(ctx)}

  </div>
`;

  // 클라이언트 설정 주입 — JSON.stringify 경유(이스케이프 사고 방지). 시크릿 값 없음(문구·slug·시장뿐).
  // frameRatio: 규격 세로/가로 비 — fit 스테이지를 진입 시점에 규격비로 1회 고정 (연출 중 크기 변경 금지, 2026-07-09 작가님)
  const fitCropParams = getSpecCropParams(slug);
  const v2ClientCfg = isFunnelDisabled ? null : {
    slug,
    format: typeSlug,
    market,
    frameRatio: fitCropParams ? +(fitCropParams.frameH / fitCropParams.frameW).toFixed(4) : null,
    specLabel: `${countryName} ${typeName}`,
    downloadName: `${countryName}_${typeName}_${locField(specData, 'size', lang).replace(/\s/g, '')}_MONKOS.jpg`,
    t: v2.js,
    pilot: true,
    t1: t1RetouchOn && !isColoredBg,
    price: market === 'kr' ? `₩${DIRECT_PRICING.kr.amount.toLocaleString('en-US')}` : '$1.99',
    freeCap: process.env.FREE_QUOTA_BYPASS === '1' ? 999999 : 3,
    adsConv: process.env.GOOGLE_ADS_CONVERSION_ID ? {
      id: process.env.GOOGLE_ADS_CONVERSION_ID,
      labelFree: process.env.GOOGLE_ADS_LABEL_FREE || '',
      labelPurchase: process.env.GOOGLE_ADS_LABEL_PURCHASE || '',
    } : null,
  };

  const pageScript = v2ClientCfg ? `window.__SPECS_CFG__ = ${JSON.stringify(v2ClientCfg)};` : '';

  const funnelAssets = isFunnelDisabled ? '' :
    `\n<script src="/components/attire-picker/attire-picker.js?v=${ASSET_VER}" defer></script>` + specsJsTag('specs-funnel');

  return {
    title,
    description,
    seoMeta: seoMeta + specsCssLink('specs-funnel') + (isFunnelDisabled ? '' : `\n<link rel="stylesheet" href="/components/attire-picker/attire-picker.css?v=${ASSET_VER}">`),
    htmlLang: lang,
    pageStyle: '',
    bodyContent: bodyContent + funnelAssets,
    pageScript,
  };
}

// ─── SPECS DETAIL (V1 소각 — 전 슬러그 V2 직결, 2026-07-19) ─────────────────────

export function specsDetailFragment(slug, forceLang = null) {
  if (!isV2Spec(slug, forceLang || 'ko')) return null;
  return specsDetailV2Fragment(slug, forceLang);
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
    const pathParts = url.pathname.replace(/^\/(?:ja|en|es|id|vi)\//, '/').split('/').filter(Boolean);

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
        // Location은 REDIRECT_MAP 정본 라우트 기준 — `${newType}/${iso}` 재조립은 복합 type에서 자기 자신을 가리켜 301 루프
        const canonical = REDIRECT_MAP[`${iso}-${newType}`];
        const target = canonical ? `${prefix}/specs/${canonical}` : null;
        if (target && target !== url.pathname) {
          res.writeHead(301, { Location: target });
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
