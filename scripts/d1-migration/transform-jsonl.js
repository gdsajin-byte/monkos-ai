#!/usr/bin/env node
/**
 * IDPASS countries.jsonl 변환 — 철창이 3건 보고서 전면 반영
 * Phase 1: 스키마 확장 (grade/bg/source/digital 등)
 * Phase 2: 1차 보고서 등급·배경색·현장촬영·소스 반영
 * Phase 3: 2차 보고서 문서유형 확장 (한국 5종, 일본 2종)
 * Phase 4: 3차 보고서 e-Visa 디지털 규격 반영
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const JSONL_PATH = join(ROOT, 'apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl');

const lines = readFileSync(JSONL_PATH, 'utf8').trim().split('\n');
const countries = lines.map(l => JSON.parse(l));

// === GRADE MAP ===

// Country-level A grade: all docs of these countries get A
const GRADE_A_COUNTRIES = new Set([
  // EU Reg. 2252/2004 (31국)
  'de','fr','it','es','nl','pl','se','be','at','pt','cz','ro','dk','ie',
  'hu','bg','hr','sk','si','lv','lt','ee','lu','mt','cy','fi','gr',
  'no','is','ch','li',
  // 개별 .gov 확인 (§1~§4, §14, §32, §35, §36)
  'kr','jp','tw','sg','hk','my','kz','in','au','nz','uk','tr',
  'us','ca','mx','ar','br','pe','co','bz','dm','jm',
  'kw','bh','ye','iq','la','mv','mu',
]);

// Doc-level overrides (specific docs that override country default)
const GRADE_A_DOCS = new Set([
  'in-visa-evisa','in-visa-bls','cn-visa',
]);

const GRADE_BPLUS_COUNTRIES = new Set([
  // EAC Directive 16 (8국)
  'ke','tz','rw','ug','ss','cd','so',
]);

const GRADE_C_DOCS = {
  'af-passport': 'C',
  'gd-passport': 'C',
  'mm-visa': 'C',
};

// bi-passport is C (상충) but bi is also in EAC → doc-level C overrides country B+
const GRADE_C_COUNTRIES_DOCS = {
  'bi': { 'bi-passport': 'C' },
};

// EU source for bulk A upgrade
const EU_SOURCE = 'https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex:32004R2252';
const EU_SOURCE_NAME = 'EU Reg. 2252/2004';
const EAC_SOURCE = 'https://www.eac.int/immigration/migration-management/electronic-machine-readable-travel-documents';
const EAC_SOURCE_NAME = 'EAC/CM32/Directive 16';

const EU_COUNTRIES = new Set([
  'de','fr','it','es','nl','pl','se','be','at','pt','cz','ro','dk','ie',
  'hu','bg','hr','sk','si','lv','lt','ee','lu','mt','cy','fi','gr',
  'no','is','ch','li',
]);

// === BACKGROUND MAP (doc or country level) ===
const BG_OVERRIDES = {
  'fr': { bg: 'light-gray', bgNote: { ko: '흰색 배경 금지', en: 'White background prohibited', ja: '白背景禁止' } },
  'gr': { bg: 'gray', bgNote: { ko: 'RGB(190,190,190)±10', en: 'RGB(190,190,190)±10', ja: 'RGB(190,190,190)±10' } },
  'at': { bg: 'gray' },
  'ch': { bg: 'gray' },
  'dk': { bg: 'gray' },
  'fi': { bg: 'light-gray' },
  'kw': { bg: 'blue' },
  'om': { bg: 'blue' },
  'ps': { bg: 'blue' },
};

const BG_DOC_OVERRIDES = {
  'id-passport': { bg: 'red' },
  'ru-visa': { bg: 'light-gray', bgNote: { ko: '비자만 밝은 회색', en: 'Light gray for visa only', ja: 'ビザのみ明るいグレー' } },
  'jm-passport': { bg: 'varies', bgNote: { ko: '피부색별 분기', en: 'Varies by skin tone', ja: '肌色により異なる' } },
};

// === SOURCE MAP (A-grade) ===
const SOURCE_MAP = {
  'kr-passport': { source: 'https://www.mofa.go.kr/us-losangeles-en/brd/m_4394/view.do?seq=725383', sourceName: 'mofa.go.kr' },
  'kr-visa': { source: 'https://www.immigration.go.kr/sites/immigration/file/photo-size.html', sourceName: 'immigration.go.kr' },
  'kr-id': { source: 'https://www.mois.go.kr/frt/sub/a06/b06/IDCard_5/screen.do', sourceName: 'mois.go.kr' },
  'kr-license': { source: 'https://www.safedriving.or.kr/guide/larGuide10.do?menuCode=MN-PO-12111', sourceName: 'safedriving.or.kr' },
  'jp-passport': { source: 'https://www.ph.emb-japan.go.jp/files/100325628.pdf', sourceName: 'emb-japan.go.jp' },
  'ca-passport': { source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html', sourceName: 'canada.ca' },
  'mx-passport': { source: 'https://consulmex.sre.gob.mx/frankfurt/images/stories/pdf/fotosejemp.pdf', sourceName: 'sre.gob.mx' },
  'ar-passport': { source: 'https://www.argentina.gob.ar/normativa/nacional/decreto-261-2011-179846/actualizacion', sourceName: 'argentina.gob.ar' },
  'br-passport': { source: 'https://www.gov.br/pf/pt-br/assuntos/passaporte/ajuda/duvidas_/documentacao/documentacao-fotografia-5x7-o-que-preciso', sourceName: 'gov.br/pf' },
  'fr-passport': { source: 'https://au.diplomatie.gouv.fr/fr/idendite/passeport-pre-demande', sourceName: 'diplomatie.gouv.fr' },
  'pe-passport': { source: 'https://www.gob.pe/174-obtener-pasaporte-electronico-para-mayores-de-edad', sourceName: 'gob.pe' },
  'tw-passport': { source: 'https://www.boca.gov.tw', sourceName: 'boca.gov.tw' },
  'sg-passport': { source: 'https://eservices.ica.gov.sg', sourceName: 'ica.gov.sg' },
};

// === FLAG MAP ===
const ONSITE_DOCS = new Set(['br-passport', 'pe-passport', 'mx-passport', 'ph-passport']);
const DIGITAL_ONLY_DOCS = new Set(['de-passport', 'fi-passport']);

// === DIGITAL SPEC MAP (Phase 4: e-Visa) ===
const DIGITAL_SPECS = {
  'in-visa-evisa': { pxRange: '350-1000', maxKB: 1024, minKB: 10, format: 'JPEG' },
  'in-visa-bls': { pxRange: '350-1000', maxKB: 300, minKB: 10, format: 'JPEG' },
  'us-visa': { pxRange: '600-1200', maxKB: 240, format: 'JPEG' },
  'us-passport': { pxRange: '600-1200', maxKB: 240, format: 'JPEG' },
  'sg-passport': { pxRange: '400-514', maxKB: 60, format: 'JPEG' },
  'tr-passport': { pxRange: '600-720', maxKB: 500, format: 'JPEG' },
  'sa-passport': { pxRange: '200-200', maxKB: 100, minKB: 5, format: 'JPEG' },
  'ae-visa': { pxRange: '300-369', maxKB: 600, format: 'JPEG' },
  'kh-passport': { pxRange: '400-800', maxKB: 1024, format: 'JPEG' },
  'vn-passport': { pxRange: '400-600', maxKB: 500, format: 'JPEG' },
  'lk-passport': { pxRange: '350-450', format: 'JPEG' },
  'ge-passport': { pxRange: '472-591', format: 'JPEG' },
  'az-passport': { pxRange: '600-800', format: 'JPEG' },
  'ru-passport': { pxRange: '826-1063', maxKB: 5120, minKB: 240, format: 'JPEG', dpi: 600 },
  'pk-passport': { pxRange: '350-467', maxKB: 60, format: 'JPEG' },
  'ng-passport': { dpi: 600 },
};

// === VALIDITY MAP ===
const VALIDITY_MAP = {
  'sg-passport': '3m',
  'ng-passport': '2w',
};

// === NEW DOCS (Phase 3) ===
const NEW_KOREAN_DOCS = [
  { id: 'kr-intl-license', type: 'intl_license', ko: '국제운전면허', en: 'International Driving Permit', ja: '国際運転免許', size: '35x45', px: '413x531', head: '32-36', std: 'safedriving.or.kr', grade: 'A', source: 'https://www.safedriving.or.kr/guide/larGuide10.do?menuCode=MN-PO-12111', sourceName: 'safedriving.or.kr' },
  { id: 'kr-exam', type: 'exam', ko: '수능원서', en: 'College Entrance Exam', ja: '大学入試', size: '35x45', px: '413x531', head: '32-36', std: '', grade: 'B' },
  { id: 'kr-youth-id', type: 'youth_id', ko: '청소년증', en: 'Youth ID', ja: '青少年証', size: '35x45', px: '413x531', head: '32-36', std: '', grade: 'B' },
  { id: 'kr-taxi', type: 'taxi_license', ko: '택시자격증', en: 'Taxi License', ja: 'タクシー資格証', size: '50x70', px: '591x827', head: '', std: '', grade: 'B' },
  { id: 'kr-marine', type: 'marine_license', ko: '수상레저면허', en: 'Marine Leisure License', ja: '水上レジャー免許', size: '35x45', px: '413x531', head: '32-36', std: 'boat.kcg.go.kr', grade: 'A', source: 'https://boat.kcg.go.kr/home/common/photoStandards.do', sourceName: 'boat.kcg.go.kr' },
];

const NEW_JAPANESE_DOCS = [
  { id: 'jp-resume', type: 'resume', ko: '이력서', en: 'Resume Photo', ja: '履歴書写真', size: '30x40', px: '354x472', head: '', std: '', grade: 'B' },
  { id: 'jp-residence', type: 'residence_card', ko: '재류카드', en: 'Residence Card', ja: '在留カード', size: '30x40', px: '354x472', head: '', std: '出入国在留管理庁', grade: 'B' },
];

// === India visa split docs ===
const INDIA_VISA_SPLIT = [
  {
    id: 'in-visa-evisa', type: 'visa', ko: 'e-Visa', en: 'e-Visa', ja: 'e-Visa',
    size: '51x51', px: '600x600', head: '36-41', std: 'indianvisaonline.gov.in',
    grade: 'A', source: 'https://indianvisaonline.gov.in/evisa/', sourceName: 'indianvisaonline.gov.in',
    pxRange: '350-1000', maxKB: 1024, minKB: 10, format: 'JPEG',
  },
  {
    id: 'in-visa-bls', type: 'visa', ko: '비자 (BLS/VFS)', en: 'Visa (BLS/VFS)', ja: 'ビザ (BLS/VFS)',
    size: '51x51', px: '600x600', head: '36-41', std: 'BLS/VFS',
    grade: 'A',
    pxRange: '350-1000', maxKB: 300, minKB: 10, format: 'JPEG',
  },
];

// === KZ (카자흐스탄) — currently empty docs, add passport ===
const KZ_PASSPORT = {
  id: 'kz-passport', type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート',
  size: '35x45', px: '413x531', head: '', std: '', grade: 'B', bg: 'gray',
};

// === NEW DOCS: au, nz, mv, iq, mu (empty docs → add passport) ===
const EMPTY_COUNTRY_PASSPORTS = {
  'au': { id: 'au-passport', type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート', size: '35x45', px: '413x531', head: '', std: 'ICAO 9303', grade: 'A', source: 'https://immi.homeaffairs.gov.au/citizenship/photo-requirements-for-citizenship-applications', sourceName: 'homeaffairs.gov.au', bg: 'light-gray', maxKB: 3584, minKB: 70, format: 'JPEG' },
  'nz': { id: 'nz-passport', type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート', size: '35x45', px: '413x531', head: '', std: 'ICAO 9303', grade: 'A', source: 'https://www.passports.govt.nz/passport-photos/', sourceName: 'passports.govt.nz', maxKB: 5120, minKB: 250, format: 'JPEG' },
  'mv': { id: 'mv-passport', type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート', size: '35x45', px: '413x531', head: '', std: '', grade: 'A' },
  'iq': { id: 'iq-passport', type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート', size: '35x45', px: '413x531', head: '', std: '', grade: 'A' },
  'mu': { id: 'mu-passport', type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート', size: '35x45', px: '413x531', head: '', std: '', grade: 'A' },
};

// === UK enhancements ===
const UK_ENHANCEMENTS = {
  'uk-passport': { grade: 'A', source: 'https://www.gov.uk/photos-for-passports', sourceName: 'gov.uk', bg: 'light-gray', validity: '1m', maxKB: 10240, minKB: 50, format: 'JPEG' },
  'uk-license': { grade: 'A', source: 'https://www.gov.uk/photos-for-passports', sourceName: 'gov.uk', bg: 'light-gray' },
};

// === TRANSFORM ===
function assignGrade(docId, countryId) {
  if (GRADE_A_DOCS.has(docId)) return 'A';
  if (GRADE_C_DOCS[docId]) return GRADE_C_DOCS[docId];
  if (GRADE_C_COUNTRIES_DOCS[countryId]?.[docId]) return GRADE_C_COUNTRIES_DOCS[countryId][docId];
  if (GRADE_A_COUNTRIES.has(countryId)) return 'A';
  if (GRADE_BPLUS_COUNTRIES.has(countryId)) return 'B+';
  return 'B';
}

function applyDocEnhancements(doc, countryId) {
  const docId = doc.id;
  const enhanced = { ...doc };

  // Grade (preserve if already set, e.g. from split/new docs)
  if (!enhanced.grade) enhanced.grade = assignGrade(docId, countryId);

  // UK-specific enhancements
  if (UK_ENHANCEMENTS[docId]) {
    const uke = UK_ENHANCEMENTS[docId];
    for (const [k, v] of Object.entries(uke)) {
      if (!enhanced[k]) enhanced[k] = v;
    }
  }

  // EU source auto-assign (if no source yet and country is EU)
  if (!enhanced.source && EU_COUNTRIES.has(countryId)) {
    enhanced.source = EU_SOURCE;
    enhanced.sourceName = EU_SOURCE_NAME;
  }

  // EAC source auto-assign
  if (!enhanced.source && GRADE_BPLUS_COUNTRIES.has(countryId)) {
    enhanced.source = EAC_SOURCE;
    enhanced.sourceName = EAC_SOURCE_NAME;
  }

  // Background - doc-level override first, then country-level
  if (BG_DOC_OVERRIDES[docId]) {
    const ov = BG_DOC_OVERRIDES[docId];
    enhanced.bg = ov.bg;
    if (ov.bgNote) enhanced.bgNote = ov.bgNote;
  } else if (BG_OVERRIDES[countryId]) {
    const ov = BG_OVERRIDES[countryId];
    enhanced.bg = ov.bg;
    if (ov.bgNote) enhanced.bgNote = ov.bgNote;
  }

  // Source
  if (SOURCE_MAP[docId]) {
    enhanced.source = SOURCE_MAP[docId].source;
    enhanced.sourceName = SOURCE_MAP[docId].sourceName;
  }

  // Flags
  if (ONSITE_DOCS.has(docId)) enhanced.onsite = true;
  if (DIGITAL_ONLY_DOCS.has(docId)) enhanced.digitalOnly = true;

  // Digital specs
  if (DIGITAL_SPECS[docId]) {
    const ds = DIGITAL_SPECS[docId];
    if (ds.pxRange) enhanced.pxRange = ds.pxRange;
    if (ds.maxKB) enhanced.maxKB = ds.maxKB;
    if (ds.minKB) enhanced.minKB = ds.minKB;
    if (ds.format) enhanced.format = ds.format;
    if (ds.dpi) enhanced.dpi = ds.dpi;
  }

  // Validity
  if (VALIDITY_MAP[docId]) enhanced.validity = VALIDITY_MAP[docId];

  return enhanced;
}

function cleanDoc(doc) {
  const clean = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v === undefined || v === null || v === '') continue;
    if (v === false) continue;
    clean[k] = v;
  }
  return clean;
}

// === MAIN TRANSFORM ===
for (const country of countries) {
  if (!country.docs) country.docs = [];

  // Special: India visa split
  if (country.id === 'in') {
    country.docs = country.docs.filter(d => d.id !== 'in-visa');
    for (const newDoc of INDIA_VISA_SPLIT) {
      const enhanced = applyDocEnhancements(newDoc, country.id);
      country.docs.push(cleanDoc(enhanced));
    }
  }

  // Special: Korea new docs
  if (country.id === 'kr') {
    for (const newDoc of NEW_KOREAN_DOCS) {
      country.docs.push(cleanDoc(newDoc));
    }
  }

  // Special: Japan new docs
  if (country.id === 'jp') {
    for (const newDoc of NEW_JAPANESE_DOCS) {
      country.docs.push(cleanDoc(newDoc));
    }
  }

  // Special: KZ add passport
  if (country.id === 'kz' && country.docs.length === 0) {
    country.docs.push(cleanDoc(KZ_PASSPORT));
  }

  // Special: Add passport to empty A-grade countries (au, nz, mv, iq, mu)
  if (EMPTY_COUNTRY_PASSPORTS[country.id] && country.docs.length === 0) {
    country.docs.push(cleanDoc(EMPTY_COUNTRY_PASSPORTS[country.id]));
  }

  // Apply enhancements to all existing docs
  country.docs = country.docs.map(d => {
    if (d.grade) return cleanDoc(d); // already processed (new docs)
    return cleanDoc(applyDocEnhancements(d, country.id));
  });
}

// === OUTPUT ===
const output = countries.map(c => JSON.stringify(c)).join('\n') + '\n';
writeFileSync(JSONL_PATH, output, 'utf8');

// === STATS ===
let totalCountries = countries.length;
let countriesWithDocs = 0;
let totalDocs = 0;
const gradeCounts = { A: 0, 'B+': 0, B: 0, C: 0, X: 0 };
let bgNonStandard = 0;
let digitalCount = 0;

for (const c of countries) {
  if (c.docs.length > 0) countriesWithDocs++;
  for (const d of c.docs) {
    totalDocs++;
    const g = d.grade || 'B';
    gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    if (d.bg && d.bg !== 'white') bgNonStandard++;
    if (d.pxRange || d.maxKB) digitalCount++;
  }
}

console.log('=== IDPASS jsonl 변환 완료 ===');
console.log(`총 국가: ${totalCountries}`);
console.log(`docs 보유 국가: ${countriesWithDocs}`);
console.log(`총 문서 수: ${totalDocs}`);
console.log(`grade 분포: A=${gradeCounts.A}, B+=${gradeCounts['B+']}, B=${gradeCounts.B}, C=${gradeCounts.C}, X=${gradeCounts.X || 0}`);
console.log(`bg 비표준 국가: ${bgNonStandard}`);
console.log(`디지털 규격 보유: ${digitalCount}`);
