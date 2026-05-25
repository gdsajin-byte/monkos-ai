/**
 * specs-data.json 202개국 확장 변환 스크립트
 * 입력: specs-data.json (26건) + countries.jsonl (202개국)
 * 출력: specs-data.json (덮어쓰기, 확장)
 * 실행: node scripts/convert-specs-data.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SPECS_PATH = resolve(ROOT, 'monkos_AI/portal/lib/cms/specs-data.json');
const JSONL_PATH = resolve(ROOT, 'apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl');

const existing = JSON.parse(readFileSync(SPECS_PATH, 'utf-8'));
const jsonlLines = readFileSync(JSONL_PATH, 'utf-8').trim().split('\n');

const BG_MAP = {
  white: { ko: '흰색', ja: '白', en: 'White' },
  'light-gray': { ko: '밝은 회색', ja: '明るい灰色', en: 'Light gray' },
  red: { ko: '빨간색', ja: '赤', en: 'Red' },
  blue: { ko: '파란색', ja: '青', en: 'Blue' },
};

const TYPE_MAP = {
  passport: { ko: '여권', en: 'Passport', ja: 'パスポート' },
  visa: { ko: '비자', en: 'Visa', ja: 'ビザ' },
  id: { ko: '신분증', en: 'National ID', ja: '身分証' },
  license: { ko: '운전면허', en: "Driver's License", ja: '運転免許' },
  resume: { ko: '이력서', en: 'Resume Photo', ja: '履歴書写真' },
  residence_card: { ko: '재류카드', en: 'Residence Card', ja: '在留カード' },
  intl_license: { ko: '국제운전면허', en: 'Int\'l Driving Permit', ja: '国際運転免許' },
  exam: { ko: '시험원서', en: 'Exam Application', ja: '試験申込' },
  youth_id: { ko: '청소년증', en: 'Youth ID', ja: '青少年証' },
  taxi_license: { ko: '택시자격증', en: 'Taxi License', ja: 'タクシー資格証' },
  marine_license: { ko: '수상레저면허', en: 'Marine License', ja: '水上レジャー免許' },
};

const REJECTION_REASONS = {
  ko: ['배경 불균일', '머리 기울어짐', '사이즈 불일치', '그림자 감지', '표정 부적합'],
  ja: ['背景の不均一', '頭の傾き', 'サイズ不一致', '影の検出', '表情不適合'],
  en: ['Uneven background', 'Head tilt', 'Wrong size', 'Shadow detected', 'Improper expression'],
};

function formatSize(w, h) {
  const wCm = (w / 10).toFixed(1).replace(/\.0$/, '');
  const hCm = (h / 10).toFixed(1).replace(/\.0$/, '');
  return `${wCm} × ${hCm}cm`;
}

function formatPx(px) {
  if (!px) return '';
  return `${px.replace('x', ' × ')}px`;
}

function formatHead(headStr) {
  if (!headStr) return '';
  const h = String(headStr);
  if (h.includes('-')) {
    const [min, max] = h.split('-');
    return `${(min / 10).toFixed(1)}~${(max / 10).toFixed(1)}cm`;
  }
  return `${(h / 10).toFixed(1)}cm`;
}

function formatHeadEn(headStr) {
  if (!headStr) return '';
  const h = String(headStr);
  if (h.includes('-')) {
    const [min, max] = h.split('-');
    return `${(min / 10).toFixed(1)}-${(max / 10).toFixed(1)}cm`;
  }
  return `${(h / 10).toFixed(1)}cm`;
}

function buildDetails(doc, country) {
  const std = doc.std || 'ICAO 9303';
  const bg = BG_MAP[doc.bg || 'white'] || BG_MAP.white;
  const warning = doc.warning;

  let ko = `${std} 기준을 따릅니다. ${bg.ko} 배경, 정면 응시, 무표정.`;
  let ja = `${std}基準に準拠。${bg.ja}背景、正面、無表情。`;
  let en = `Follows ${std} standard. ${bg.en} background, frontal view, neutral expression.`;

  if (warning) {
    if (typeof warning === 'object') {
      if (warning.ko) ko += ` ${warning.ko}`;
      if (warning.ja) ja += ` ${warning.ja}`;
      if (warning.en) en += ` ${warning.en}`;
    }
  }

  return { ko, ja, en };
}

// Collect existing slugs to avoid duplicates
const existingSlugs = new Set(Object.keys(existing));

// Add continent to existing entries
const EXISTING_CONTINENT = {
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

for (const [slug, continent] of Object.entries(EXISTING_CONTINENT)) {
  if (existing[slug] && !existing[slug].continent) {
    existing[slug].continent = continent;
  }
}

// Map country IDs to existing slugs (to avoid re-adding)
const existingCountryDocs = new Set();
for (const slug of existingSlugs) {
  existingCountryDocs.add(slug);
}

let addedCount = 0;

for (const line of jsonlLines) {
  const country = JSON.parse(line);
  const { id: cid, ko: cKo, en: cEn, ja: cJa, continent, docs } = country;

  const docList = docs && docs.length > 0 ? docs : [
    { id: `${cid}-passport`, type: 'passport', ko: '여권', en: 'Passport', ja: 'パスポート', size: '35x45', px: '413x531', head: '32-36', std: 'ICAO 9303', grade: 'C' },
    { id: `${cid}-visa`, type: 'visa', ko: '비자', en: 'Visa', ja: 'ビザ', size: '35x45', px: '413x531', head: '32-36', std: 'ICAO 9303', grade: 'C' },
  ];

  for (const doc of docList) {
    const slug = doc.id;
    if (existingSlugs.has(slug)) continue;

    const [wStr, hStr] = (doc.size || '35x45').split('x');
    const w = parseInt(wStr);
    const h = parseInt(hStr);
    const bg = BG_MAP[doc.bg || 'white'] || BG_MAP.white;
    const typeInfo = TYPE_MAP[doc.type] || { ko: doc.ko || doc.type, en: doc.en || doc.type, ja: doc.ja || doc.type };

    const fileSpecParts = [];
    if (doc.format) fileSpecParts.push(doc.format);
    if (doc.maxKB) fileSpecParts.push(`max ${doc.maxKB}KB`);
    if (doc.minKB) fileSpecParts.push(`min ${doc.minKB}KB`);
    const fileSpec = fileSpecParts.join(', ');

    const entry = {
      slug,
      country: cKo,
      countryEn: cEn,
      countryJa: cJa,
      type: doc.ko || typeInfo.ko,
      typeEn: doc.en || typeInfo.en,
      typeJa: doc.ja || typeInfo.ja,
      size: formatSize(w, h),
      pixels: doc.px ? formatPx(doc.px) : '',
      dpi: doc.dpi || 300,
      background: bg.ko,
      backgroundEn: bg.en,
      backgroundJa: bg.ja,
      headHeight: doc.head ? formatHead(doc.head) : '',
      headHeightEn: doc.head ? formatHeadEn(doc.head) : '',
      headHeightJa: doc.head ? formatHead(doc.head) : '',
      validity: doc.validity || '',
      validityEn: doc.validity || '',
      validityJa: doc.validity || '',
      fileSpec,
      fileSpecEn: fileSpec,
      fileSpecJa: fileSpec,
      standard: doc.std || 'ICAO 9303',
      continent: continent === 'middle_east' ? 'middleeast' : continent,
      details: buildDetails(doc, country),
      rejectionReasons: REJECTION_REASONS,
      faqs: { ko: [], ja: [], en: [] },
      priority: doc.type === 'passport' ? 10 : doc.type === 'visa' ? 11 : 12,
    };

    if (doc.source) entry.source = doc.source;
    if (doc.sourceName) entry.sourceName = doc.sourceName;
    if (doc.grade) entry.grade = doc.grade;

    existing[slug] = entry;
    existingSlugs.add(slug);
    addedCount++;
  }
}

writeFileSync(SPECS_PATH, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`완료: 기존 26건 보존 + ${addedCount}건 추가 = 총 ${Object.keys(existing).length}건`);
