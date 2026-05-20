#!/usr/bin/env node
/**
 * IDPASS D1 마이그레이션 스크립트
 * 3개 소스 → countries, documents, seo_content, common_requirements, slug_aliases
 *
 * 소스 우선순위: 2차검수 > countries.jsonl > specs-data-v2 > specs-data(seo)
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// === 데이터 로드 ===
const jsonlLines = readFileSync(join(ROOT, 'apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl'), 'utf8').trim().split('\n');
const countrySlugs = JSON.parse(readFileSync(join(__dirname, 'country-slugs.json'), 'utf8'));
const v2Data = JSON.parse(readFileSync(join(ROOT, 'apps/crop-app/data/specs-data-v2.json'), 'utf8'));
const seoData = JSON.parse(readFileSync(join(ROOT, 'monkos_AI/portal/lib/cms/specs-data.json'), 'utf8'));

// === 상수 ===
const TYPE_TO_SLUG = {
  passport: 'passport',
  visa: 'visa',
  id: 'national-id',
  national_id: 'national-id',
  license: 'drivers-license',
  drivers_license: 'drivers-license',
  resume: 'resume',
  residence_card: 'residence-card',
  headshot: 'headshot',
};

const V2_COUNTRY_MAP = {
  korea: 'kr', japan: 'jp', us: 'us', canada: 'ca', australia: 'au',
  uk: 'uk', eu: 'eu', germany: 'de', spain: 'es', singapore: 'sg',
  thailand: 'th', india: 'in', china: 'cn', vietnam: 'vn', indonesia: 'id',
};

const CONTINENT_ORDER = { asia: 1, europe: 2, americas: 3, middle_east: 4, africa: 5, oceania: 6 };

const PRIORITY_OVERRIDE = { kr: 1, jp: 2, us: 3, cn: 4, eu: 5 };

function isoToFlag(iso) {
  return [...iso.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

function esc(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function escJson(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  return esc(JSON.stringify(obj));
}

function parseSize(sizeStr) {
  if (!sizeStr) return { w: null, h: null };
  const m = sizeStr.match(/(\d+)\s*[x×]\s*(\d+)/);
  return m ? { w: parseInt(m[1]), h: parseInt(m[2]) } : { w: null, h: null };
}

function parsePx(pxStr) {
  if (!pxStr) return { w: null, h: null };
  const m = pxStr.match(/(\d+)\s*[x×]\s*(\d+)/);
  return m ? { w: parseInt(m[1]), h: parseInt(m[2]) } : { w: null, h: null };
}

function parseHead(headStr) {
  if (!headStr) return { min: null, max: null };
  const m = headStr.match(/(\d+(?:\.\d+)?)\s*[-–~]\s*(\d+(?:\.\d+)?)/);
  if (m) return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
  const single = headStr.match(/^(\d+(?:\.\d+)?)$/);
  if (single) return { min: parseFloat(single[1]), max: parseFloat(single[1]) };
  return { min: null, max: null };
}

function numOrNull(v) {
  return v !== null && v !== undefined ? v : 'NULL';
}

// === v2 인덱스 구축 ===
const v2Index = {};
for (const c of v2Data.countries) {
  const isoId = V2_COUNTRY_MAP[c.id];
  if (!isoId) continue;
  for (const d of c.documents) {
    const docSlug = TYPE_TO_SLUG[d.type] || d.type;
    const docId = `${isoId}-${docSlug}`;
    v2Index[d.id] = { ...d, _docId: docId, _countryId: isoId, _docSlug: docSlug };
  }
}

// === SEO slug → D1 doc ID 매핑 ===
const SEO_DOC_MAP = {
  'korea-passport': 'kr-passport',
  'korea-resume': 'kr-resume',
  'korea-drivers-license': 'kr-drivers-license',
  'korea-halfcard': 'kr-resume',
  'korea-resident': 'kr-national-id',
  'japan-passport': 'jp-passport',
  'japan-resume': 'jp-resume',
  'japan-mynumber': 'jp-national-id',
  'japan-halfcard': 'jp-resume',
  'japan-zairyu': 'jp-residence-card',
  'us-passport': 'us-passport',
  'usa-headshot': 'us-headshot',
  'eu-passport': 'eu-passport',
  'eu-resume': 'eu-resume',
  'spain-passport': 'es-passport',
  'germany-resume': 'de-resume',
  'uk-passport': 'uk-passport',
  'australia-passport': 'au-passport',
  'canada-passport': 'ca-passport',
  'singapore-passport': 'sg-passport',
  'thailand-passport': 'th-passport',
  'india-passport': 'in-passport',
  'china-passport': 'cn-passport',
  'china-resume': 'cn-resume',
  'vietnam-passport': 'vn-passport',
  'indonesia-passport': 'id-passport',
};

// === SQL 생성 시작 ===
const sql = [];
sql.push('-- IDPASS Specs Seed Data');
sql.push(`-- Generated: ${new Date().toISOString()}`);
sql.push('-- Sources: countries.jsonl (202) + specs-data-v2 (15국 28문서) + specs-data.json (26 SEO)');
sql.push('');

// === 1. countries ===
sql.push('-- ============ COUNTRIES ============');
const countries = jsonlLines.map(line => JSON.parse(line));
const v2CountryFlags = {};
for (const c of v2Data.countries) {
  if (c.flag) v2CountryFlags[V2_COUNTRY_MAP[c.id]] = c.flag;
}

let countryPriority = 10;
const continentCounters = {};

for (const c of countries) {
  const slug = countrySlugs[c.id] || c.id;
  const flag = v2CountryFlags[c.id] || isoToFlag(c.id);
  const hasDocs = c.docs && c.docs.length > 0 ? 1 : 0;

  let priority;
  if (PRIORITY_OVERRIDE[c.id] !== undefined) {
    priority = PRIORITY_OVERRIDE[c.id];
  } else {
    const contIdx = (CONTINENT_ORDER[c.continent] || 99) * 1000;
    continentCounters[c.continent] = (continentCounters[c.continent] || 0) + 1;
    priority = contIdx + continentCounters[c.continent];
  }

  sql.push(`INSERT INTO countries (id, name_ko, name_en, name_ja, flag, continent, slug, priority, is_published) VALUES (${esc(c.id)}, ${esc(c.ko)}, ${esc(c.en)}, ${esc(c.ja)}, ${esc(flag)}, ${esc(c.continent)}, ${esc(slug)}, ${priority}, ${hasDocs});`);
}

// === 2. documents (from jsonl) ===
sql.push('');
sql.push('-- ============ DOCUMENTS (jsonl base) ============');

const insertedDocIds = new Set();

for (const c of countries) {
  if (!c.docs || c.docs.length === 0) continue;

  for (const d of c.docs) {
    const docSlug = TYPE_TO_SLUG[d.type] || d.type;
    const docId = `${c.id}-${docSlug}`;
    const size = parseSize(d.size);
    const px = parsePx(d.px);
    const head = parseHead(d.head);

    // v2 오버레이 검색
    const v2Match = Object.values(v2Index).find(v => v._docId === docId);
    const officialUrl = v2Match?.officialSource || null;
    const aiRestriction = v2Match?.aiRestriction ? 1 : 0;
    const groupTier = v2Match?.group || null;
    const eyeMinPct = v2Match?.eyePosition?.min_pct ?? v2Match?.eyePosition?.approx_pct ?? null;
    const eyeMaxPct = v2Match?.eyePosition?.max_pct ?? v2Match?.eyePosition?.approx_pct ?? null;
    const eyeBasis = v2Match?.eyePosition?.basis || null;
    const headMinPct = v2Match?.headHeight?.min_pct ?? null;
    const headMaxPct = v2Match?.headHeight?.max_pct ?? null;
    const dpi = v2Match?.px?.dpi ?? (px.w && size.w ? Math.round(px.w / (size.w / 25.4)) : null);
    const bg = v2Match?.background || null;
    const pxW = v2Match?.px?.w ?? px.w;
    const pxH = v2Match?.px?.h ?? px.h;

    const warning = d.warning;

    sql.push(`INSERT INTO documents (id, country_id, type, name_ko, name_en, name_ja, slug, size_w_mm, size_h_mm, size_display, px_w, px_h, dpi, background, head_height_min_mm, head_height_max_mm, head_height_min_pct, head_height_max_pct, eye_position_min_pct, eye_position_max_pct, eye_position_basis, standard, official_source_url, ai_restriction, group_tier, priority, is_published, special_notes_ko, special_notes_en, special_notes_ja) VALUES (${esc(docId)}, ${esc(c.id)}, ${esc(d.type)}, ${esc(d.ko)}, ${esc(d.en)}, ${esc(d.ja)}, ${esc(docSlug)}, ${numOrNull(size.w)}, ${numOrNull(size.h)}, ${esc(d.size)}, ${numOrNull(pxW)}, ${numOrNull(pxH)}, ${numOrNull(dpi)}, ${esc(bg)}, ${numOrNull(head.min)}, ${numOrNull(head.max)}, ${numOrNull(headMinPct)}, ${numOrNull(headMaxPct)}, ${numOrNull(eyeMinPct)}, ${numOrNull(eyeMaxPct)}, ${esc(eyeBasis)}, ${esc(d.std || null)}, ${esc(officialUrl)}, ${aiRestriction}, ${esc(groupTier)}, ${docSlug === 'passport' ? 1 : docSlug === 'visa' ? 2 : 10}, 1, ${warning ? esc(warning.ko) : 'NULL'}, ${warning ? esc(warning.en) : 'NULL'}, ${warning ? esc(warning.ja) : 'NULL'});`);

    insertedDocIds.add(docId);
  }
}

// === 2-3. v2-only documents (not in jsonl) ===
sql.push('');
sql.push('-- ============ DOCUMENTS (v2-only additions) ============');

for (const c of v2Data.countries) {
  const isoId = V2_COUNTRY_MAP[c.id];
  if (!isoId) continue;

  for (const d of c.documents) {
    const docSlug = TYPE_TO_SLUG[d.type] || d.type;
    const docId = `${isoId}-${docSlug}`;

    if (insertedDocIds.has(docId)) continue;

    const sizeW = d.size?.w_mm ?? null;
    const sizeH = d.size?.h_mm ?? null;
    const sizeDisplay = sizeW && sizeH ? `${sizeW}x${sizeH}` : null;
    const pxW = d.px?.w ?? null;
    const pxH = d.px?.h ?? null;
    const dpi = d.px?.dpi ?? null;
    const headMin = d.headHeight?.min_mm ?? null;
    const headMax = d.headHeight?.max_mm ?? null;
    const headMinPct = d.headHeight?.min_pct ?? null;
    const headMaxPct = d.headHeight?.max_pct ?? null;
    const eyeMinPct = d.eyePosition?.min_pct ?? d.eyePosition?.approx_pct ?? null;
    const eyeMaxPct = d.eyePosition?.max_pct ?? d.eyePosition?.approx_pct ?? null;
    const eyeBasis = d.eyePosition?.basis || null;
    const bg = d.background || null;

    sql.push(`INSERT INTO documents (id, country_id, type, name_ko, name_en, name_ja, slug, size_w_mm, size_h_mm, size_display, px_w, px_h, dpi, background, head_height_min_mm, head_height_max_mm, head_height_min_pct, head_height_max_pct, eye_position_min_pct, eye_position_max_pct, eye_position_basis, official_source_url, ai_restriction, group_tier, priority, is_published) VALUES (${esc(docId)}, ${esc(isoId)}, ${esc(d.type)}, ${esc(d.name.ko)}, ${esc(d.name.en)}, ${esc(d.name.ja)}, ${esc(docSlug)}, ${numOrNull(sizeW)}, ${numOrNull(sizeH)}, ${esc(sizeDisplay)}, ${numOrNull(pxW)}, ${numOrNull(pxH)}, ${numOrNull(dpi)}, ${esc(bg)}, ${numOrNull(headMin)}, ${numOrNull(headMax)}, ${numOrNull(headMinPct)}, ${numOrNull(headMaxPct)}, ${numOrNull(eyeMinPct)}, ${numOrNull(eyeMaxPct)}, ${esc(eyeBasis)}, ${esc(d.officialSource || null)}, ${d.aiRestriction ? 1 : 0}, ${esc(d.group || null)}, ${docSlug === 'passport' ? 1 : docSlug === 'visa' ? 2 : 10}, 1);`);

    insertedDocIds.add(docId);
  }
}

// SEO-only documents (not in jsonl or v2)
sql.push('');
sql.push('-- ============ DOCUMENTS (SEO-only additions) ============');

const seoOnlyDocs = {
  'germany-resume': { countryId: 'de', type: 'resume', slug: 'resume', ko: '이력서 사진', en: 'CV Photo', ja: '履歴書写真', sizeW: 35, sizeH: 45 },
};

for (const [seoSlug, def] of Object.entries(seoOnlyDocs)) {
  const docId = SEO_DOC_MAP[seoSlug];
  if (!docId || insertedDocIds.has(docId)) continue;

  sql.push(`INSERT INTO documents (id, country_id, type, name_ko, name_en, name_ja, slug, size_w_mm, size_h_mm, size_display, is_published) VALUES (${esc(docId)}, ${esc(def.countryId)}, ${esc(def.type)}, ${esc(def.ko)}, ${esc(def.en)}, ${esc(def.ja)}, ${esc(def.slug)}, ${numOrNull(def.sizeW)}, ${numOrNull(def.sizeH)}, ${esc(def.sizeW && def.sizeH ? `${def.sizeW}x${def.sizeH}` : null)}, 1);`);
  insertedDocIds.add(docId);
}

// Update countries.is_published for countries that gained docs via v2/seo
sql.push('');
sql.push('-- ============ UPDATE is_published for countries with v2/seo docs ============');
sql.push(`UPDATE countries SET is_published = 1 WHERE id IN (SELECT DISTINCT country_id FROM documents);`);

// === 3. seo_content ===
sql.push('');
sql.push('-- ============ SEO_CONTENT ============');

const seoDeduped = new Set();
for (const [seoSlug, entry] of Object.entries(seoData)) {
  const docId = SEO_DOC_MAP[seoSlug];
  if (!docId) {
    sql.push(`-- SKIP: ${seoSlug} (no mapping)`);
    continue;
  }
  if (seoDeduped.has(docId)) {
    sql.push(`-- SKIP duplicate: ${seoSlug} → ${docId} (already inserted)`);
    continue;
  }
  if (!insertedDocIds.has(docId)) {
    sql.push(`-- SKIP: ${seoSlug} → ${docId} (document not found)`);
    continue;
  }
  seoDeduped.add(docId);

  const details = entry.details || {};
  const rejReasons = entry.rejectionReasons || {};
  const faqs = entry.faqs || {};
  const seoTitle = entry.seoTitle || {};
  const seoDesc = entry.seoDescription || {};

  sql.push(`INSERT INTO seo_content (document_id, details_ko, details_en, details_ja, rejection_reasons_ko, rejection_reasons_en, rejection_reasons_ja, faqs_ko, faqs_en, faqs_ja, seo_title_ko, seo_title_en, seo_title_ja, seo_description_ko, seo_description_en, seo_description_ja, cta_service) VALUES (${esc(docId)}, ${esc(details.ko || null)}, ${esc(details.en || null)}, ${esc(details.ja || null)}, ${escJson(rejReasons.ko || null)}, ${escJson(rejReasons.en || null)}, ${escJson(rejReasons.ja || null)}, ${escJson(faqs.ko || null)}, ${escJson(faqs.en || null)}, ${escJson(faqs.ja || null)}, ${esc(seoTitle.ko || null)}, ${esc(seoTitle.en || null)}, ${esc(seoTitle.ja || null)}, ${esc(seoDesc.ko || null)}, ${esc(seoDesc.en || null)}, ${esc(seoDesc.ja || null)}, ${esc(entry.ctaService || null)});`);
}

// === 4. slug_aliases ===
sql.push('');
sql.push('-- ============ SLUG_ALIASES ============');

for (const [seoSlug, docId] of Object.entries(SEO_DOC_MAP)) {
  const parts = docId.split('-');
  const countryId = parts[0];
  const countrySlug = countrySlugs[countryId] || countryId;
  const docSlug = parts.slice(1).join('-');

  sql.push(`INSERT OR IGNORE INTO slug_aliases (old_slug, country_slug, document_slug) VALUES (${esc(seoSlug)}, ${esc(countrySlug)}, ${esc(docSlug)});`);
}

// === 5. common_requirements ===
sql.push('');
sql.push('-- ============ COMMON_REQUIREMENTS (ICAO) ============');

const requirements = [
  { type: 'required', ko: '정면 응시', en: 'Face the camera directly', ja: '正面を向いて撮影', order: 1 },
  { type: 'required', ko: '무표정 (자연스러운 표정)', en: 'Neutral expression', ja: '無表情（自然な表情）', order: 2 },
  { type: 'required', ko: '입을 다문 상태', en: 'Mouth closed', ja: '口を閉じた状態', order: 3 },
  { type: 'required', ko: '밝고 균일한 배경', en: 'Light, uniform background', ja: '明るく均一な背景', order: 4 },
  { type: 'required', ko: '얼굴에 그림자 없음', en: 'No shadows on face', ja: '顔に影がないこと', order: 5 },
  { type: 'required', ko: '최근 6개월 이내 촬영', en: 'Taken within last 6 months', ja: '6ヶ月以内に撮影', order: 6 },
  { type: 'forbidden', ko: '모자/머리 장식 착용', en: 'Hats or head coverings', ja: '帽子・頭飾りの着用', order: 1 },
  { type: 'forbidden', ko: '선글라스/색안경 착용', en: 'Sunglasses or tinted lenses', ja: 'サングラス・色付きレンズ', order: 2 },
  { type: 'forbidden', ko: '과도한 사진 보정', en: 'Excessive photo editing', ja: '過度な写真加工', order: 3 },
  { type: 'forbidden', ko: '얼굴을 가리는 요소', en: 'Anything obscuring the face', ja: '顔を隠す要素', order: 4 },
];

for (const r of requirements) {
  sql.push(`INSERT INTO common_requirements (document_id, type, text_ko, text_en, text_ja, sort_order) VALUES (NULL, ${esc(r.type)}, ${esc(r.ko)}, ${esc(r.en)}, ${esc(r.ja)}, ${r.order});`);
}

// === 출력 ===
console.log(sql.join('\n'));
